"""Player glitch reports.

Players send what happened and how it happened (or "I don't know"). Reports are
kept in memory for the owner's admin panel and, when Render has the
GITHUB_REPORT_TOKEN environment variable (a fine-grained GitHub token with
Issues read/write on this repo), each one also becomes a GitHub issue labelled
"glitch-report" so the hourly glitch check can find and fix it.
Optional: GITHUB_REPORT_REPO (default elijahmenaia-stack/Cat-city-project-online).

Reports are also saved in the game's Postgres database (the same one as
accounts and cloud saves, when DATABASE_URL is set), so a restart or redeploy
no longer erases them.
"""
from __future__ import annotations

import json
import logging
import os
import re
import secrets
import time
from collections import deque

from aiohttp import ClientSession, ClientTimeout, web

from accounts import limited, same_origin

LOG = logging.getLogger('catcity.glitch')
REPO = os.environ.get('GITHUB_REPORT_REPO', 'elijahmenaia-stack/Cat-city-project-online')
REPORTS: deque = deque(maxlen=200)
CONTROL = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]')


def tidy(value, limit):
    if not isinstance(value, str):
        return ''
    return CONTROL.sub('', value).strip()[:limit]


def build_report(data, account, remote):
    what = tidy(data.get('what'), 1000)
    dont_know = data.get('dontKnow') is True
    how = '' if dont_know else tidy(data.get('how'), 1000)
    if len(what) < 5:
        return None, 'Please describe what happened (at least a few words).'
    if not dont_know and len(how) < 3:
        return None, 'Please say how it happened, or tick "I don\'t know".'
    ctx = data.get('context') if isinstance(data.get('context'), dict) else {}
    context = {k: tidy(str(ctx.get(k, '')), 300) for k in ('cat', 'area', 'position', 'screen', 'device', 'online', 'boss', 'event', 'errors', 'page')}
    return {
        'id': secrets.token_hex(5),
        'at': int(time.time()),
        'by': (account or {}).get('username') or 'guest',
        'what': what,
        'how': "I don't know" if dont_know else how,
        'context': context,
        'remote': (remote or '')[:40],
        'issue': None,
    }, None


def issue_body(report):
    ctx = report['context']
    lines = [
        '**What happened**', '', report['what'], '',
        '**How it happened**', '', report['how'], '',
        '**Game details (sent automatically)**', '',
    ]
    for key, label in (('cat', 'Cat'), ('area', 'Area'), ('position', 'Position'), ('boss', 'Boss fight'), ('event', 'Event'),
                       ('online', 'Online'), ('screen', 'Screen'), ('device', 'Device'), ('page', 'Version'), ('errors', 'Recent errors')):
        if ctx.get(key):
            lines.append('- %s: %s' % (label, ctx[key].replace('`', "'")))
    lines += ['', 'Reported by: %s · report id %s' % (report['by'], report['id']), '',
              '_Sent from the in-game 🐞 Glitch Report. The hourly glitch check picks these up._']
    return '\n'.join(lines)


async def create_issue(report):
    token = os.environ.get('GITHUB_REPORT_TOKEN', '').strip()
    if not token:
        LOG.warning('glitch report %s: GITHUB_REPORT_TOKEN is not set, so no GitHub issue was made', report['id'])
        return None
    demo = '[demo] ' if os.environ.get('CATCITY_DEMO') == '1' else ''
    title = '🐞 Glitch report: ' + demo + re.sub(r'\s+', ' ', report['what'])[:70]
    try:
        async with ClientSession(timeout=ClientTimeout(total=12)) as session:
            async with session.post('https://api.github.com/repos/%s/issues' % REPO,
                                    json={'title': title, 'body': issue_body(report), 'labels': ['glitch-report']},
                                    headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
                                             'User-Agent': 'cat-city-glitch-reports'}) as response:
                if response.status in (200, 201):
                    number = (await response.json()).get('number')
                    LOG.warning('glitch report %s: created GitHub issue #%s', report['id'], number)
                    return number
                detail = (await response.text())[:200]
                LOG.warning('glitch report %s: GitHub said %s %s', report['id'], response.status, detail)
    except Exception as exc:  # noqa: BLE001 — a GitHub outage must never break the game
        LOG.warning('glitch report %s: could not reach GitHub (%s)', report['id'], type(exc).__name__)
        return None
    return None


TABLE_READY = False


async def db_ready(pool):
    global TABLE_READY
    if pool is None:
        return False
    if not TABLE_READY:
        async with pool.acquire() as conn:
            await conn.execute('''CREATE TABLE IF NOT EXISTS catcity_glitch_reports (
                id TEXT PRIMARY KEY, created_at BIGINT NOT NULL, report JSONB NOT NULL)''')
        TABLE_READY = True
    return True


async def save(pool, report):
    try:
        if await db_ready(pool):
            async with pool.acquire() as conn:
                await conn.execute('INSERT INTO catcity_glitch_reports (id, created_at, report) VALUES ($1, $2, $3) '
                                   'ON CONFLICT (id) DO UPDATE SET report = EXCLUDED.report',
                                   report['id'], report['at'], json.dumps(report))
            return True
    except Exception:  # noqa: BLE001 — never lose the in-memory copy because of the database
        return False
    return False


async def load(pool, limit=50):
    try:
        if await db_ready(pool):
            async with pool.acquire() as conn:
                rows = await conn.fetch('SELECT report FROM catcity_glitch_reports ORDER BY created_at DESC LIMIT $1', limit)
            return [json.loads(r['report']) if isinstance(r['report'], str) else dict(r['report']) for r in rows]
    except Exception:  # noqa: BLE001
        return None
    return None


def install(app, accounts):
    async def submit(request):
        if not same_origin(request):
            raise web.HTTPForbidden()
        user = accounts.user(request)
        # The owner tests the game and reports lots of glitches in a row, so her verified
        # account gets a much higher limit (still capped so GitHub isn't flooded).
        if user and user.get('admin'):
            too_many = limited('glitch-owner:' + user['username'].lower(), 40, 600)
        else:
            too_many = limited('glitch:' + str(request.remote), 4, 600)
        if too_many:
            return web.json_response({'error': 'Thanks! You have sent a few reports already — please wait a little before sending another.'}, status=429)
        try:
            data = await request.json()
        except Exception:  # noqa: BLE001
            return web.json_response({'error': 'Could not read the report.'}, status=400)
        report, error = build_report(data if isinstance(data, dict) else {}, user, request.remote)
        if error:
            return web.json_response({'error': error}, status=400)
        REPORTS.appendleft(report)
        report['issue'] = await create_issue(report)
        report['saved'] = await save(getattr(accounts, 'pool', None), report)
        return web.json_response({'ok': True, 'id': report['id']})

    async def listing(request):
        accounts.require(request, admin=True)
        stored = await load(getattr(accounts, 'pool', None))
        reports = stored if stored is not None else list(REPORTS)[:50]
        return web.json_response({'reports': [{k: v for k, v in r.items() if k != 'remote'} for r in reports],
                                  'github': bool(os.environ.get('GITHUB_REPORT_TOKEN')),
                                  'database': stored is not None}, headers={'Cache-Control': 'no-store'})

    app.router.add_post('/api/glitch-report', submit)
    app.router.add_get('/api/glitch-reports', listing)

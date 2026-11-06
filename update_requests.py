"""Owner update requests.

Only the owner's account (Elidagoat, checked against the server's owner
password hash — the same check as the admin panel) can send an update request
from the admin panel. Each request becomes a GitHub issue titled
"🛠️ Update request: …" with a marker line, using the same GITHUB_REPORT_TOKEN
as glitch reports. Claude's hourly scheduled task picks these issues up, builds
the change, merges it once the GitHub checks pass, and comments on the issue.

Everyone else gets 403. Requests are rate limited (6 per hour).
"""
from __future__ import annotations

import logging
import os
import re
import time
from collections import deque

from aiohttp import ClientSession, ClientTimeout, web

from accounts import limited, same_origin

LOG = logging.getLogger('catcity.updates')
REPO = os.environ.get('GITHUB_REPORT_REPO', 'fynnmenaia-glitch/cat-city-game')
MARKER = 'cat-city-owner-update-request'
REQUESTS: deque = deque(maxlen=50)
CONTROL = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]')


def tidy(value, limit):
    if not isinstance(value, str):
        return ''
    return CONTROL.sub('', value).strip()[:limit]


def build_request(data, user):
    """Returns (request, error). `user` must be the verified owner account."""
    if not user or not user.get('admin'):
        return None, 'Only the owner account can request updates.'
    text = tidy(data.get('text'), 4000)
    if len(text) < 8:
        return None, 'Please describe the update (at least a few words).'
    return {'text': text, 'by': user['username'], 'at': int(time.time()), 'issue': None}, None


def issue_title(req):
    first = re.sub(r'\s+', ' ', req['text'])
    return '🛠️ Update request: ' + (first[:70] + ('…' if len(first) > 70 else ''))


def issue_body(req):
    return '\n'.join([
        '**Update requested in the game by the owner**', '',
        req['text'], '',
        '---',
        'Requested by: %s (verified owner account) · %s UTC' % (req['by'], time.strftime('%Y-%m-%d %H:%M', time.gmtime(req['at']))),
        '<!-- %s -->' % MARKER,
        '_Claude\'s hourly scheduled task builds these, merges once the checks pass, and comments here._',
    ])


async def create_issue(req):
    token = os.environ.get('GITHUB_REPORT_TOKEN', '').strip()
    if not token:
        LOG.warning('update request: GITHUB_REPORT_TOKEN is not set')
        return None
    try:
        async with ClientSession(timeout=ClientTimeout(total=12)) as session:
            async with session.post('https://api.github.com/repos/%s/issues' % REPO,
                                    json={'title': issue_title(req), 'body': issue_body(req), 'labels': ['update-request']},
                                    headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
                                             'User-Agent': 'cat-city-update-requests'}) as response:
                if response.status in (200, 201):
                    number = (await response.json()).get('number')
                    LOG.warning('update request: created GitHub issue #%s', number)
                    return number
                LOG.warning('update request: GitHub said %s %s', response.status, (await response.text())[:200])
    except Exception as exc:  # noqa: BLE001 — never break the game over GitHub
        LOG.warning('update request: could not reach GitHub (%s)', type(exc).__name__)
    return None


def install(app, accounts):
    async def submit(request):
        if not same_origin(request):
            raise web.HTTPForbidden()
        user = accounts.require(request, admin=True)
        if limited('update:' + user['username'].lower(), 6, 3600):
            return web.json_response({'error': 'That\'s 6 requests this hour — please wait a little.'}, status=429)
        try:
            data = await request.json()
        except Exception:  # noqa: BLE001
            return web.json_response({'error': 'Could not read the request.'}, status=400)
        req, error = build_request(data if isinstance(data, dict) else {}, user)
        if error:
            return web.json_response({'error': error}, status=400)
        req['issue'] = await create_issue(req)
        REQUESTS.appendleft(req)
        return web.json_response({'ok': True, 'issue': req['issue'],
                                  'github': bool(os.environ.get('GITHUB_REPORT_TOKEN'))})

    async def listing(request):
        accounts.require(request, admin=True)
        return web.json_response({'requests': list(REQUESTS)[:20]}, headers={'Cache-Control': 'no-store'})

    app.router.add_post('/api/update-request', submit)
    app.router.add_get('/api/update-requests', listing)

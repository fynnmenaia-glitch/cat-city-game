"""📸 Screenshots for glitch reports (update request #67).

After a glitch report is sent, the game can send one in-game screenshot (the
game picture only, a small JPEG) for it. The server keeps the latest ones in
memory for the owner's 🐞 View Glitch Reports panel, and also saves a copy to
the repo's `glitch-screenshots` branch (never `main`, so nothing redeploys) and
adds it to the report's GitHub issue so the hourly glitch check can see it.
"""
from __future__ import annotations

import base64
import binascii
import logging
import os
import time
from collections import OrderedDict

from aiohttp import ClientSession, ClientTimeout, web

from accounts import limited, same_origin
from glitch_reports import REPORTS

LOG = logging.getLogger('catcity.glitch')
REPO = os.environ.get('GITHUB_REPORT_REPO', 'fynnmenaia-glitch/cat-city-game')
BRANCH = 'glitch-screenshots'
PREFIX = 'data:image/jpeg;base64,'
MAX_BYTES = 180_000  # the server accepts requests up to 256 KB, base64 included
WINDOW = 15 * 60
SHOTS: OrderedDict = OrderedDict()
KEEP = 40


def decode_image(data_url):
    """Returns the JPEG bytes, or None if it isn't a small, real JPEG."""
    if not isinstance(data_url, str) or not data_url.startswith(PREFIX) or len(data_url) > MAX_BYTES * 4 // 3 + 64:
        return None
    try:
        raw = base64.b64decode(data_url[len(PREFIX):], validate=True)
    except (binascii.Error, ValueError):
        return None
    if len(raw) > MAX_BYTES or not raw.startswith(b'\xff\xd8') or not raw.rstrip(b'\x00').endswith(b'\xff\xd9'):
        return None
    return raw


def find_report(report_id, remote, username, now=None):
    """The screenshot must belong to a report just sent by the same player."""
    now = now or time.time()
    for report in REPORTS:
        if report.get('id') != report_id:
            continue
        if now - report.get('at', 0) > WINDOW:
            return None
        same_player = (username and report.get('by') == username) or (report.get('remote') and report.get('remote') == (remote or '')[:40])
        return report if same_player else None
    return None


def _headers(token):
    return {'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'User-Agent': 'cat-city-glitch-reports'}


async def upload(report, raw):
    """Saves the picture on the glitch-screenshots branch and links it on the issue. Returns the image URL or None."""
    token = os.environ.get('GITHUB_REPORT_TOKEN', '').strip()
    if not token:
        return None
    api = 'https://api.github.com/repos/' + REPO
    path = 'screenshots/%s.jpg' % report['id']
    try:
        async with ClientSession(timeout=ClientTimeout(total=20)) as session:
            async with session.get(api + '/git/ref/heads/' + BRANCH, headers=_headers(token)) as response:
                exists = response.status == 200
            if not exists:
                async with session.get(api + '/git/ref/heads/main', headers=_headers(token)) as response:
                    sha = (await response.json()).get('object', {}).get('sha') if response.status == 200 else None
                if not sha:
                    return None
                async with session.post(api + '/git/refs', json={'ref': 'refs/heads/' + BRANCH, 'sha': sha}, headers=_headers(token)) as response:
                    if response.status not in (200, 201):
                        LOG.warning('screenshot %s: could not make the branch (%s)', report['id'], response.status)
                        return None
            body = {'message': 'Glitch report screenshot %s' % report['id'], 'branch': BRANCH,
                    'content': base64.b64encode(raw).decode('ascii')}
            async with session.put(api + '/contents/' + path, json=body, headers=_headers(token)) as response:
                if response.status not in (200, 201):
                    LOG.warning('screenshot %s: GitHub said %s', report['id'], response.status)
                    return None
            url = 'https://github.com/%s/blob/%s/%s?raw=true' % (REPO, BRANCH, path)
            if report.get('issue'):
                async with session.post(api + '/issues/%s/comments' % report['issue'],
                                        json={'body': '📸 In-game screenshot sent with this report:\n\n![screenshot](%s)' % url},
                                        headers=_headers(token)) as response:
                    pass
            return url
    except Exception as exc:  # noqa: BLE001 — GitHub trouble must never break the game
        LOG.warning('screenshot %s: could not reach GitHub (%s)', report['id'], type(exc).__name__)
        return None


def install(app, accounts):
    async def submit(request):
        if not same_origin(request):
            raise web.HTTPForbidden()
        if limited('glitch-shot:' + str(request.remote), 8, 600):
            return web.json_response({'error': 'Too many screenshots, please wait a little.'}, status=429)
        if (request.content_length or 0) > MAX_BYTES * 2:
            return web.json_response({'error': 'That screenshot is too big.'}, status=413)
        try:
            data = await request.json()
        except Exception:  # noqa: BLE001
            return web.json_response({'error': 'Could not read the screenshot.'}, status=400)
        user = accounts.user(request)
        report = find_report(str(data.get('id', '')), request.remote, (user or {}).get('username'))
        if not report:
            return web.json_response({'error': 'That report could not be found.'}, status=404)
        if report['id'] in SHOTS:
            return web.json_response({'ok': True, 'already': True})
        raw = decode_image(data.get('image'))
        if raw is None:
            return web.json_response({'error': 'That screenshot could not be read.'}, status=400)
        SHOTS[report['id']] = {'bytes': raw, 'at': int(time.time()), 'by': report.get('by'), 'what': report.get('what', '')[:120], 'issue': report.get('issue'), 'url': None}
        while len(SHOTS) > KEEP:
            SHOTS.popitem(last=False)
        report['screenshot'] = True
        SHOTS[report['id']]['url'] = await upload(report, raw)
        return web.json_response({'ok': True})

    async def listing(request):
        accounts.require(request, admin=True)
        items = [{'id': k, 'at': v['at'], 'by': v['by'], 'what': v['what'], 'issue': v['issue'], 'url': v['url']} for k, v in reversed(SHOTS.items())]
        return web.json_response({'screenshots': items}, headers={'Cache-Control': 'no-store'})

    async def image(request):
        accounts.require(request, admin=True)
        shot = SHOTS.get(request.match_info['id'])
        if not shot:
            raise web.HTTPNotFound()
        return web.Response(body=shot['bytes'], content_type='image/jpeg', headers={'Cache-Control': 'no-store'})

    app.router.add_post('/api/glitch-screenshot', submit)
    app.router.add_get('/api/glitch-screenshots', listing)
    app.router.add_get('/api/glitch-screenshot/{id}', image)

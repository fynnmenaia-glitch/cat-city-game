"""Staged updates and the owner's "🚀 Release update" button.

Changes built from the owner's in-game update requests don't go live straight
away. They are written as *staged* add-on scripts in client/staged/ and listed
in client/staged/manifest.json:

    {"updates": [{"id": "u57-purple-hat", "title": "Purple hat in the shop",
                  "kind": "feature", "issue": 57, "files": ["u57-purple-hat.js"]}]}

`kind` is "mission", "event" or "feature" and picks the words in the global
UPDATE! cutscene (client/update-cutscene.js).

A staged update only loads in the game once the owner presses "Release update"
in the admin panel. Players' games poll /api/release and load newly released
scripts in place, so nobody is moved or reloaded. Released ids are kept forever
(until a later release adds more).

The released list is stored durably in a GitHub issue ("🚀 Cat City releases"),
using the same GITHUB_REPORT_TOKEN as glitch reports, so it survives redeploys
on the free tier. Without a token it falls back to a local JSON file.
"""
from __future__ import annotations

import json
import logging
import os
import re
import time
from pathlib import Path

from aiohttp import ClientSession, ClientTimeout, web

from accounts import limited, same_origin

LOG = logging.getLogger('catcity.releases')
HERE = Path(__file__).resolve().parent
STAGED = HERE / 'client' / 'staged'
MANIFEST = STAGED / 'manifest.json'
LOCAL_STATE = HERE / 'release_state.json'
REPO = os.environ.get('GITHUB_REPORT_REPO', 'elijahmenaia-stack/Cat-city-project-online')
MARKER = 'cat-city-releases-store'
TITLE = '🚀 Cat City releases (used by the game, please keep open)'
ID = re.compile(r'^[a-z0-9][a-z0-9-]{1,60}$')
FILE = re.compile(r'^[a-z0-9][a-z0-9-]{1,60}\.js$')

STATE = {'released': [], 'history': [], 'loaded': False, 'issue': None}


def read_manifest(path=MANIFEST):
    """Returns the list of valid staged updates (bad entries are skipped)."""
    try:
        data = json.loads(Path(path).read_text('utf-8'))
    except Exception:  # noqa: BLE001
        return []
    out = []
    for item in data.get('updates', []) if isinstance(data, dict) else []:
        if not isinstance(item, dict) or not ID.match(str(item.get('id', ''))):
            continue
        files = [f for f in item.get('files', []) if isinstance(f, str) and FILE.match(f)]
        kind = item.get('kind') if item.get('kind') in ('mission', 'event', 'feature') else 'feature'
        out.append({'id': item['id'], 'title': str(item.get('title', item['id']))[:120], 'kind': kind,
                    'issue': item.get('issue') if isinstance(item.get('issue'), int) else None, 'files': files})
    return out


def body_for(state):
    payload = {'released': state['released'], 'history': state['history'][-50:]}
    return '\n'.join([
        'The game keeps the list of released updates here. Please keep this issue open and don\'t edit the block below.',
        '', '```json', json.dumps(payload, indent=1), '```', '', '<!-- %s -->' % MARKER])


def parse_body(text):
    match = re.search(r'```json\s*(\{.*?\})\s*```', text or '', re.S)
    if not match:
        return None
    try:
        data = json.loads(match.group(1))
    except Exception:  # noqa: BLE001
        return None
    released = [r for r in data.get('released', []) if isinstance(r, str) and ID.match(r)]
    history = [h for h in data.get('history', []) if isinstance(h, dict)]
    return {'released': released, 'history': history}


def release(state, ids, manifest, by):
    """Adds the staged ids to the released list. Returns the ids newly released."""
    known = {u['id'] for u in manifest}
    new = [i for i in ids if i in known and i not in state['released']]
    if new:
        state['released'] = state['released'] + new
        state['history'] = (state['history'] + [{'at': int(time.time()), 'by': by, 'ids': new}])[-50:]
    return new


def _headers(token):
    return {'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'User-Agent': 'cat-city-releases'}


async def load_state():
    if STATE['loaded']:
        return
    STATE['loaded'] = True
    token = os.environ.get('GITHUB_REPORT_TOKEN', '').strip()
    if token:
        try:
            async with ClientSession(timeout=ClientTimeout(total=12)) as session:
                for page in (1, 2, 3):
                    async with session.get('https://api.github.com/repos/%s/issues?state=all&per_page=100&page=%d' % (REPO, page),
                                           headers=_headers(token)) as response:
                        if response.status != 200:
                            LOG.warning('releases: GitHub said %s', response.status)
                            break
                        issues = await response.json()
                    for issue in issues:
                        if MARKER in (issue.get('body') or ''):
                            parsed = parse_body(issue.get('body'))
                            if parsed:
                                STATE.update(parsed)
                                STATE['issue'] = issue.get('number')
                                LOG.warning('releases: loaded %d released updates from issue #%s', len(STATE['released']), STATE['issue'])
                                return
                    if len(issues) < 100:
                        break
        except Exception as exc:  # noqa: BLE001
            LOG.warning('releases: could not reach GitHub (%s)', type(exc).__name__)
    try:
        parsed = parse_body(LOCAL_STATE.read_text('utf-8'))
        if parsed:
            STATE.update(parsed)
    except Exception:  # noqa: BLE001
        pass


async def save_state():
    try:
        LOCAL_STATE.write_text(body_for(STATE), 'utf-8')
    except Exception:  # noqa: BLE001
        pass
    token = os.environ.get('GITHUB_REPORT_TOKEN', '').strip()
    if not token:
        return False
    try:
        async with ClientSession(timeout=ClientTimeout(total=12)) as session:
            if STATE['issue']:
                url = 'https://api.github.com/repos/%s/issues/%s' % (REPO, STATE['issue'])
                async with session.patch(url, json={'body': body_for(STATE), 'state': 'open'}, headers=_headers(token)) as response:
                    return response.status == 200
            async with session.post('https://api.github.com/repos/%s/issues' % REPO,
                                    json={'title': TITLE, 'body': body_for(STATE)}, headers=_headers(token)) as response:
                if response.status in (200, 201):
                    STATE['issue'] = (await response.json()).get('number')
                    return True
                LOG.warning('releases: GitHub said %s', response.status)
    except Exception as exc:  # noqa: BLE001
        LOG.warning('releases: could not save to GitHub (%s)', type(exc).__name__)
    return False


def install(app, accounts):
    async def status(request):
        await load_state()
        manifest = read_manifest()
        out = {'released': STATE['released']}
        user = accounts.user(request) if hasattr(accounts, 'user') else None
        if user and user.get('admin'):
            out['staged'] = [u for u in manifest if u['id'] not in STATE['released']]
            out['history'] = STATE['history'][-10:]
        return web.json_response(out, headers={'Cache-Control': 'no-store'})

    async def do_release(request):
        if not same_origin(request):
            raise web.HTTPForbidden()
        user = accounts.require(request, admin=True)
        if limited('release:' + user['username'].lower(), 10, 3600):
            return web.json_response({'error': 'Too many releases this hour.'}, status=429)
        await load_state()
        manifest = read_manifest()
        new = release(STATE, [u['id'] for u in manifest], manifest, user['username'])
        if not new:
            return web.json_response({'ok': True, 'released': [], 'message': 'Nothing new to release.'})
        saved = await save_state()
        return web.json_response({'ok': True, 'released': new, 'saved': saved})

    async def staged_file(request):
        name = request.match_info['name']
        if name != 'manifest.json' and not FILE.match(name):
            raise web.HTTPNotFound()
        path = STAGED / name
        if not path.is_file():
            raise web.HTTPNotFound()
        return web.FileResponse(path, headers={'Cache-Control': 'no-cache'})

    app.router.add_get('/api/release', status)
    app.router.add_post('/api/release', do_release)
    app.router.add_get('/staged/{name}', staged_file)

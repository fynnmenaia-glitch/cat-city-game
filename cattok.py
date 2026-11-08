"""📱 Cat Tok on the server: players' videos, the owner's ✔️ verification, and LIVE streams.

Who you are
  Signed-in players are "u:<username>". Guests send a random secret in the X-CatTok-Id header
  (made once and kept in their browser); the public id is a hash of it, so nobody can pretend to
  be someone else just by knowing their public id.

Videos  (anyone can post, up to 30 seconds)
  POST /api/cattok/video            {caption, sound, template, set, cat, gear, sponsor, boost, duration,
                                     name, frames?: data:image/jpeg (a sprite sheet of gameplay frames),
                                     frameInfo?: {cols, rows, n, fw, fh, fps}}
  POST /api/cattok/video/{id}/audio {audio: data:audio/...}   (optional voice, sent separately)
  GET  /api/cattok/videos           newest videos (no pictures), with ✔️ flags
  GET  /api/cattok/video/{id}/frames · /audio
  POST /api/cattok/video/{id}/like · /remove (author or owner)

Verification (owner only, from the Cat Tok app on the owner's phone)
  POST /api/cattok/verify {uid, on}   GET /api/cattok/me

LIVE  (the owner and verified players)
  POST /api/cattok/live             {title, set, cat, gear, pose, mode, frame?}  (every ~1 s while live)
  POST /api/cattok/live/end
  GET  /api/cattok/lives            who is live now
  GET  /api/cattok/live/{uid}?since=N   the stream's latest state + new comments/gifts
  POST /api/cattok/live/{uid}/comment {text} · /heart · /gift {gift, fish}

Durable storage: like glitch screenshots, everything is saved on the repo's `cattok-data` branch
(never main, so nothing redeploys) when GITHUB_REPORT_TOKEN is set, and loaded again on start-up.
Without a token it is kept in cattok_state.json next to this file (lost when Render redeploys).
"""
from __future__ import annotations

import asyncio
import base64
import binascii
import hashlib
import json
import logging
import os
import re
import secrets
import time
from collections import OrderedDict, deque
from pathlib import Path

from aiohttp import ClientSession, ClientTimeout, web

from accounts import limited, same_origin

LOG = logging.getLogger('catcity.cattok')
HERE = Path(__file__).resolve().parent
LOCAL = HERE / 'cattok_state.json'
REPO = os.environ.get('GITHUB_REPORT_REPO', 'fynnmenaia-glitch/cat-city-game')
BRANCH = 'cattok-data'
KEEP_VIDEOS = 300
MAX_FRAMES = 170_000
MAX_AUDIO = 130_000
MAX_LIVE_FRAME = 45_000
SECRET = re.compile(r'^[a-f0-9]{32}$')
VID = re.compile(r'^v[a-z0-9]{6,20}$')
UID = re.compile(r'^(u:[A-Za-z0-9_]{3,20}|g[a-f0-9]{12})$')
WORD = re.compile(r'^[a-z0-9_-]{1,24}$')
GIFTS = {'rose': 1, 'fish': 5, 'yarn': 10, 'crown': 50, 'galaxy': 100}

STATE = {'videos': OrderedDict(), 'verified': {}, 'likes': {}, 'loaded': False}
BLOBS: dict = {}            # 'v123.jpg' / 'v123.audio' -> bytes (cache; the branch has the rest)
LIVES: dict = {}            # uid -> live stream
DIRTY = {'json': False}


def now():
    return time.time()


# ------------------------------------------------------------------ identity
def identity(request, accounts):
    user = accounts.user(request)
    if user:
        return {'uid': 'u:' + user['username'], 'owner': bool(user.get('admin')), 'account': True}
    secret = request.headers.get('X-CatTok-Id', '').strip().lower()
    if SECRET.match(secret):
        return {'uid': 'g' + hashlib.sha256(('cattok:' + secret).encode()).hexdigest()[:12], 'owner': False, 'account': False}
    return None


def is_verified(uid, owner=False):
    return owner or uid in STATE['verified']


def clean_text(text, limit, filter_fn):
    if not isinstance(text, str):
        return ''
    text = text.strip()[:limit]
    if not text:
        return ''
    cleaned, error = filter_fn(text if len(text) >= 2 else text + ' ')
    return '' if error else cleaned.strip()[:limit]


def word(value, default=''):
    value = str(value or '').strip().lower()
    return value if WORD.match(value) else default


def decode(data_url, prefixes, limit):
    if not isinstance(data_url, str):
        return None, None
    for prefix in prefixes:
        if data_url.startswith(prefix):
            body = data_url[len(prefix):]
            if len(body) > limit * 4 // 3 + 8:
                return None, None
            try:
                raw = base64.b64decode(body, validate=True)
            except (binascii.Error, ValueError):
                return None, None
            return (raw, prefix[5:prefix.index(';')]) if len(raw) <= limit else (None, None)
    return None, None


def is_jpeg(raw):
    return raw is not None and raw.startswith(b'\xff\xd8') and raw.rstrip(b'\x00').endswith(b'\xff\xd9')


def clean_gear(gear):
    out = {}
    if not isinstance(gear, dict):
        return out
    for slot in ('head', 'body', 'paws', 'weapon'):
        item = gear.get(slot)
        if isinstance(item, dict) and isinstance(item.get('name'), str):
            out[slot] = {k: str(item.get(k, ''))[:40] for k in ('name', 'tier', 'rarity', 'color') if item.get(k)}
    return out


def public(video, viewer=None):
    data = {k: v for k, v in video.items() if k not in ('secret',)}
    data['verified'] = video['uid'] in STATE['verified'] or video.get('owner', False)
    data['likes'] = video.get('baseLikes', 0) + len(STATE['likes'].get(video['id'], ()))
    data['liked'] = bool(viewer and viewer in STATE['likes'].get(video['id'], ()))
    return data


# ------------------------------------------------------------------ durable storage (GitHub branch)
def _headers(token):
    return {'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'User-Agent': 'cat-city-cattok'}


async def _ensure_branch(session, api, token):
    async with session.get(api + '/git/ref/heads/' + BRANCH, headers=_headers(token)) as response:
        if response.status == 200:
            return True
    async with session.get(api + '/git/ref/heads/main', headers=_headers(token)) as response:
        sha = (await response.json()).get('object', {}).get('sha') if response.status == 200 else None
    if not sha:
        return False
    async with session.post(api + '/git/refs', json={'ref': 'refs/heads/' + BRANCH, 'sha': sha}, headers=_headers(token)) as response:
        return response.status in (200, 201)


async def _put(session, api, token, path, raw, message):
    sha = None
    async with session.get(api + '/contents/' + path, params={'ref': BRANCH}, headers=_headers(token)) as response:
        if response.status == 200:
            sha = (await response.json()).get('sha')
    body = {'message': message, 'branch': BRANCH, 'content': base64.b64encode(raw).decode('ascii')}
    if sha:
        body['sha'] = sha
    async with session.put(api + '/contents/' + path, json=body, headers=_headers(token)) as response:
        return response.status in (200, 201)


async def _get(session, api, token, path):
    async with session.get(api + '/contents/' + path, params={'ref': BRANCH},
                           headers={**_headers(token), 'Accept': 'application/vnd.github.raw'}) as response:
        return await response.read() if response.status == 200 else None


def snapshot():
    return json.dumps({'videos': list(STATE['videos'].values())[-KEEP_VIDEOS:], 'verified': STATE['verified'],
                       'likes': {k: sorted(v) for k, v in STATE['likes'].items()}}, separators=(',', ':')).encode()


def restore(data):
    try:
        payload = json.loads(data)
    except Exception:  # noqa: BLE001
        return
    for video in payload.get('videos', []):
        if isinstance(video, dict) and VID.match(str(video.get('id', ''))):
            STATE['videos'][video['id']] = video
    STATE['verified'].update({k: v for k, v in (payload.get('verified') or {}).items() if UID.match(k)})
    for k, v in (payload.get('likes') or {}).items():
        STATE['likes'][k] = set(v)


async def load():
    if STATE['loaded']:
        return
    STATE['loaded'] = True
    token = os.environ.get('GITHUB_REPORT_TOKEN', '').strip()
    if token:
        try:
            async with ClientSession(timeout=ClientTimeout(total=20)) as session:
                raw = await _get(session, 'https://api.github.com/repos/' + REPO, token, 'state.json')
            if raw:
                restore(raw)
                LOG.info('cattok: loaded %s videos, %s verified', len(STATE['videos']), len(STATE['verified']))
            return
        except Exception as exc:  # noqa: BLE001
            LOG.warning('cattok: could not load from GitHub (%s)', type(exc).__name__)
    if LOCAL.exists():
        restore(LOCAL.read_text('utf-8'))


async def save_blob(name, raw):
    BLOBS[name] = raw
    while len(BLOBS) > 120:
        BLOBS.pop(next(iter(BLOBS)))
    token = os.environ.get('GITHUB_REPORT_TOKEN', '').strip()
    if not token:
        return
    try:
        async with ClientSession(timeout=ClientTimeout(total=25)) as session:
            api = 'https://api.github.com/repos/' + REPO
            if await _ensure_branch(session, api, token):
                await _put(session, api, token, 'blobs/' + name, raw, 'Cat Tok ' + name)
    except Exception as exc:  # noqa: BLE001
        LOG.warning('cattok: could not save %s (%s)', name, type(exc).__name__)


async def get_blob(name):
    if name in BLOBS:
        return BLOBS[name]
    token = os.environ.get('GITHUB_REPORT_TOKEN', '').strip()
    if not token:
        return None
    try:
        async with ClientSession(timeout=ClientTimeout(total=15)) as session:
            raw = await _get(session, 'https://api.github.com/repos/' + REPO, token, 'blobs/' + name)
    except Exception:  # noqa: BLE001
        return None
    if raw:
        BLOBS[name] = raw
    return raw


async def flush():
    """Writes state.json (debounced: called every few seconds by the background loop)."""
    if not DIRTY['json']:
        return
    DIRTY['json'] = False
    data = snapshot()
    token = os.environ.get('GITHUB_REPORT_TOKEN', '').strip()
    if not token:
        try:
            LOCAL.write_bytes(data)
        except OSError:
            pass
        return
    try:
        async with ClientSession(timeout=ClientTimeout(total=25)) as session:
            api = 'https://api.github.com/repos/' + REPO
            if await _ensure_branch(session, api, token):
                if not await _put(session, api, token, 'state.json', data, 'Cat Tok state'):
                    DIRTY['json'] = True
    except Exception as exc:  # noqa: BLE001
        DIRTY['json'] = True
        LOG.warning('cattok: could not save state (%s)', type(exc).__name__)


def changed():
    DIRTY['json'] = True


# ------------------------------------------------------------------ lives
def live_public(uid, live):
    return {'uid': uid, 'name': live['name'], 'title': live['title'], 'set': live['set'], 'cat': live['cat'],
            'mode': live['mode'], 'viewers': len([1 for t in live['viewers'].values() if now() - t < 8]) + live.get('extraViewers', 0),
            'hearts': live['hearts'], 'started': int(live['started']), 'owner': live['owner'], 'verified': True}


def tidy_lives():
    for uid in [u for u, live in LIVES.items() if now() - live['updated'] > 15]:
        LIVES.pop(uid, None)


def add_event(live, kind, **data):
    live['seq'] += 1
    live['events'].append({'n': live['seq'], 'kind': kind, 'at': int(now()), **data})


# ------------------------------------------------------------------ routes
def install(app, accounts, filter_fn):
    async def startup(_app):
        await load()

        async def loop():
            while True:
                await asyncio.sleep(8)
                try:
                    await flush()
                    tidy_lives()
                except Exception:  # noqa: BLE001
                    pass
        task = asyncio.create_task(loop())
        yield
        task.cancel()
        await flush()

    def who(request):
        me = identity(request, accounts)
        if not me:
            raise web.HTTPForbidden(text='Cat Tok needs an id.')
        return me

    async def body(request, limit=240_000):
        if not same_origin(request):
            raise web.HTTPForbidden()
        if (request.content_length or 0) > limit:
            raise web.HTTPRequestEntityTooLarge(max_size=limit, actual_size=request.content_length or 0)
        try:
            data = await request.json()
        except Exception:  # noqa: BLE001
            raise web.HTTPBadRequest(text='Could not read that.')
        return data if isinstance(data, dict) else {}

    async def me_route(request):
        me = identity(request, accounts)
        if not me:
            return web.json_response({'uid': None, 'verified': False, 'owner': False})
        return web.json_response({'uid': me['uid'], 'owner': me['owner'], 'verified': is_verified(me['uid'], me['owner'])},
                                 headers={'Cache-Control': 'no-store'})

    async def post_video(request):
        data = await body(request)
        me = who(request)
        if limited('cattok-video:' + me['uid'], 6, 600):
            return web.json_response({'error': 'You posted a lot! Wait a few minutes.'}, status=429)
        caption = clean_text(data.get('caption', ''), 120, filter_fn)
        if data.get('caption') and not caption:
            return web.json_response({'error': 'Please keep your caption friendly (no links or rude words).'}, status=400)
        name = clean_text(data.get('name', ''), 20, filter_fn) or 'catcity.player'
        vid = 'v' + secrets.token_hex(5)
        frames = None
        if data.get('frames'):
            frames, _ = decode(data['frames'], ['data:image/jpeg;base64,'], MAX_FRAMES)
            if not is_jpeg(frames):
                return web.json_response({'error': 'That video was too big or could not be read.'}, status=400)
        info = data.get('frameInfo') if isinstance(data.get('frameInfo'), dict) else {}
        boost = data.get('boost') if data.get('boost') in (1, 2, 3) else 1
        video = {'id': vid, 'uid': me['uid'], 'name': name, 'owner': me['owner'], 'at': int(now()),
                 'caption': caption, 'sound': clean_text(data.get('sound', ''), 40, filter_fn) or 'original sound',
                 'template': word(data.get('template'), 'zoomies'), 'set': word(data.get('set'), 'village'),
                 'cat': word(data.get('cat'), 'astro'), 'gear': clean_gear(data.get('gear')),
                 'sponsor': word(data.get('sponsor')), 'boost': boost,
                 'duration': max(3, min(30, int(data.get('duration') or 10))), 'item': word(data.get('item')),
                 'mode': 'game' if frames else 'set', 'audio': False,
                 'baseLikes': 0}
        if frames:
            video['frameInfo'] = {k: max(1, min(400, int(info.get(k) or 1))) for k in ('cols', 'rows', 'n', 'fw', 'fh')}
            video['frameInfo']['fps'] = max(1, min(8, int(info.get('fps') or 3)))
            await save_blob(vid + '.jpg', frames)
        STATE['videos'][vid] = video
        while len(STATE['videos']) > KEEP_VIDEOS:
            STATE['videos'].popitem(last=False)
        changed()
        return web.json_response({'ok': True, 'video': public(video, me['uid'])})

    async def post_audio(request):
        data = await body(request, 200_000)
        me = who(request)
        video = STATE['videos'].get(request.match_info['id'])
        if not video or video['uid'] != me['uid'] or video.get('audio'):
            return web.json_response({'error': 'That video could not be found.'}, status=404)
        raw, mime = decode(data.get('audio'), ['data:audio/mp4;base64,', 'data:audio/webm;base64,', 'data:audio/ogg;base64,', 'data:audio/aac;base64,'], MAX_AUDIO)
        if raw is None:
            return web.json_response({'error': 'That voice recording was too long.'}, status=400)
        video['audio'] = mime
        await save_blob(video['id'] + '.audio', raw)
        changed()
        return web.json_response({'ok': True})

    async def list_videos(request):
        viewer = (identity(request, accounts) or {}).get('uid')
        items = [public(v, viewer) for v in reversed(STATE['videos'].values())][:120]
        return web.json_response({'videos': items}, headers={'Cache-Control': 'no-store'})

    async def frames(request):
        vid = request.match_info['id']
        if vid not in STATE['videos']:
            raise web.HTTPNotFound()
        raw = await get_blob(vid + '.jpg')
        if not raw:
            raise web.HTTPNotFound()
        return web.Response(body=raw, content_type='image/jpeg', headers={'Cache-Control': 'public, max-age=86400'})

    async def audio(request):
        video = STATE['videos'].get(request.match_info['id'])
        if not video or not video.get('audio'):
            raise web.HTTPNotFound()
        raw = await get_blob(video['id'] + '.audio')
        if not raw:
            raise web.HTTPNotFound()
        return web.Response(body=raw, content_type=video['audio'], headers={'Cache-Control': 'public, max-age=86400'})

    async def like(request):
        await body(request, 1000)
        me = who(request)
        vid = request.match_info['id']
        if vid not in STATE['videos']:
            raise web.HTTPNotFound()
        if limited('cattok-like:' + me['uid'], 120, 600):
            return web.json_response({'error': 'Slow down!'}, status=429)
        likes = STATE['likes'].setdefault(vid, set())
        if me['uid'] in likes:
            likes.discard(me['uid'])
        else:
            likes.add(me['uid'])
        changed()
        return web.json_response({'ok': True, 'video': public(STATE['videos'][vid], me['uid'])})

    async def remove(request):
        await body(request, 1000)
        me = who(request)
        video = STATE['videos'].get(request.match_info['id'])
        if not video:
            raise web.HTTPNotFound()
        if video['uid'] != me['uid'] and not me['owner']:
            raise web.HTTPForbidden()
        STATE['videos'].pop(video['id'], None)
        STATE['likes'].pop(video['id'], None)
        changed()
        return web.json_response({'ok': True})

    async def verify(request):
        data = await body(request, 2000)
        accounts.require(request, admin=True)
        uid = str(data.get('uid', ''))
        if not UID.match(uid):
            return web.json_response({'error': 'Unknown player.'}, status=400)
        if data.get('on'):
            name = next((v['name'] for v in reversed(STATE['videos'].values()) if v['uid'] == uid), uid)
            STATE['verified'][uid] = {'at': int(now()), 'name': name}
        else:
            STATE['verified'].pop(uid, None)
            live = LIVES.pop(uid, None)
            if live:
                LOG.info('cattok: ended %s live (verification removed)', uid)
        changed()
        return web.json_response({'ok': True, 'verified': uid in STATE['verified']})

    # -------------------------------------------------------------- lives
    async def live_update(request):
        data = await body(request, 80_000)
        me = who(request)
        if not is_verified(me['uid'], me['owner']):
            return web.json_response({'error': 'Only verified creators can go LIVE.'}, status=403)
        if limited('cattok-live:' + me['uid'], 200, 120):
            return web.json_response({'error': 'Too fast.'}, status=429)
        live = LIVES.get(me['uid'])
        if not live:
            if len(LIVES) >= 12:
                return web.json_response({'error': 'Lots of people are live right now. Try again soon!'}, status=429)
            live = LIVES[me['uid']] = {'name': 'catcity.player', 'title': '', 'set': 'village', 'cat': 'astro', 'mode': 'set',
                                       'started': now(), 'updated': now(), 'seq': 0, 'events': deque(maxlen=60),
                                       'viewers': {}, 'hearts': 0, 'gifts': 0, 'giftFish': 0, 'paid': 0, 'owner': me['owner'],
                                       'state': {}, 'frame': None, 'frameAt': 0}
            add_event(live, 'sys', text='The LIVE started!')
        live['updated'] = now()
        live['name'] = clean_text(data.get('name', ''), 20, filter_fn) or live['name']
        title = clean_text(data.get('title', ''), 60, filter_fn)
        if title:
            live['title'] = title
        live['set'] = word(data.get('set'), live['set'])
        live['cat'] = word(data.get('cat'), live['cat'])
        live['mode'] = 'game' if data.get('mode') == 'game' else 'set'
        state = data.get('state') if isinstance(data.get('state'), dict) else {}
        live['state'] = {'pose': word(state.get('pose'), 'idle'), 'gear': clean_gear(state.get('gear')),
                         'say': clean_text(state.get('say', ''), 80, filter_fn), 'prop': word(state.get('prop'))}
        if data.get('frame'):
            raw, _ = decode(data['frame'], ['data:image/jpeg;base64,'], MAX_LIVE_FRAME)
            if is_jpeg(raw):
                live['frame'] = raw
                live['frameAt'] = now()
        owed = live['giftFish'] - live['paid']
        live['paid'] = live['giftFish']
        since = int(data.get('since') or 0)
        return web.json_response({'ok': True, 'live': live_public(me['uid'], live), 'fish': owed,
                                  'events': [e for e in live['events'] if e['n'] > since]}, headers={'Cache-Control': 'no-store'})

    async def live_end(request):
        await body(request, 1000)
        me = who(request)
        live = LIVES.pop(me['uid'], None)
        owed = (live['giftFish'] - live['paid']) if live else 0
        return web.json_response({'ok': True, 'fish': owed})

    async def lives(request):
        tidy_lives()
        return web.json_response({'lives': [live_public(u, l) for u, l in LIVES.items()]}, headers={'Cache-Control': 'no-store'})

    async def live_get(request):
        uid = request.match_info['uid']
        live = LIVES.get(uid)
        if not live:
            return web.json_response({'ended': True}, headers={'Cache-Control': 'no-store'})
        viewer = (identity(request, accounts) or {}).get('uid') or ('ip:' + str(request.remote))
        live['viewers'][viewer] = now()
        if len(live['viewers']) > 400:
            for k in sorted(live['viewers'], key=live['viewers'].get)[:100]:
                live['viewers'].pop(k, None)
        since = int(request.query.get('since') or 0)
        return web.json_response({'live': live_public(uid, live), 'state': live['state'],
                                  'frameAt': int(live['frameAt'] * 1000) if live['frame'] else 0,
                                  'events': [e for e in live['events'] if e['n'] > since]}, headers={'Cache-Control': 'no-store'})

    async def live_frame(request):
        live = LIVES.get(request.match_info['uid'])
        if not live or not live['frame']:
            raise web.HTTPNotFound()
        return web.Response(body=live['frame'], content_type='image/jpeg', headers={'Cache-Control': 'no-store'})

    async def live_comment(request):
        data = await body(request, 2000)
        me = who(request)
        live = LIVES.get(request.match_info['uid'])
        if not live:
            raise web.HTTPNotFound()
        if limited('cattok-cm:' + me['uid'], 20, 60):
            return web.json_response({'error': 'Slow down a little!'}, status=429)
        text = clean_text(data.get('text', ''), 80, filter_fn)
        if not text:
            return web.json_response({'error': 'Please keep comments friendly.'}, status=400)
        add_event(live, 'comment', name=clean_text(data.get('name', ''), 20, filter_fn) or 'viewer', text=text, cat=word(data.get('cat'), 'astro'))
        return web.json_response({'ok': True})

    async def live_heart(request):
        await body(request, 1000)
        who(request)
        live = LIVES.get(request.match_info['uid'])
        if not live:
            raise web.HTTPNotFound()
        live['hearts'] += 1
        return web.json_response({'ok': True, 'hearts': live['hearts']})

    async def live_gift(request):
        data = await body(request, 2000)
        me = who(request)
        live = LIVES.get(request.match_info['uid'])
        if not live:
            raise web.HTTPNotFound()
        gift = word(data.get('gift'))
        if gift not in GIFTS or limited('cattok-gift:' + me['uid'], 30, 60):
            return web.json_response({'error': 'That gift could not be sent.'}, status=400)
        live['gifts'] += 1
        live['giftFish'] += GIFTS[gift]
        add_event(live, 'gift', name=clean_text(data.get('name', ''), 20, filter_fn) or 'viewer', gift=gift, fish=GIFTS[gift], cat=word(data.get('cat'), 'astro'))
        return web.json_response({'ok': True})

    app.cleanup_ctx.append(startup)
    r = app.router
    r.add_get('/api/cattok/me', me_route)
    r.add_post('/api/cattok/video', post_video)
    r.add_post('/api/cattok/video/{id}/audio', post_audio)
    r.add_get('/api/cattok/videos', list_videos)
    r.add_get('/api/cattok/video/{id}/frames', frames)
    r.add_get('/api/cattok/video/{id}/audio', audio)
    r.add_post('/api/cattok/video/{id}/like', like)
    r.add_post('/api/cattok/video/{id}/remove', remove)
    r.add_post('/api/cattok/verify', verify)
    r.add_post('/api/cattok/live', live_update)
    r.add_post('/api/cattok/live/end', live_end)
    r.add_get('/api/cattok/lives', lives)
    r.add_get('/api/cattok/live/{uid}', live_get)
    r.add_get('/api/cattok/live/{uid}/frame', live_frame)
    r.add_post('/api/cattok/live/{uid}/comment', live_comment)
    r.add_post('/api/cattok/live/{uid}/heart', live_heart)
    r.add_post('/api/cattok/live/{uid}/gift', live_gift)

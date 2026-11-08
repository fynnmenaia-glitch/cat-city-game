"""Cat City Online: cross-platform rooms, moderated chat and secure optional cloud accounts.

Persistent accounts require DATABASE_URL. Never place plaintext passwords in source.
"""
import asyncio
from collections import defaultdict, deque
from dataclasses import dataclass, field
import json
import logging
import math
import os
from pathlib import Path
import re
import secrets
import time

from aiohttp import web, WSMsgType
from tag_house import TagHouse
from accounts import AccountService, install_routes, same_origin
from glitch_reports import install as install_glitch_reports
from glitch_screens import install as install_glitch_screens
from update_requests import install as install_update_requests
from releases import install as install_releases
from cattok import install as install_cattok
import social
from social import SocialService, clean as clean_chat
from ai_cats import make_lobbies
from bot_adventure import tick_workers, collect_bot_drop, VALID_ACTIVITIES

HERE = Path(__file__).resolve().parent
# The demo website (CATCITY_DEMO=1) serves the cut-down build from tools/build_demo.py.
DEMO = os.environ.get('CATCITY_DEMO') == '1'
PUBLIC = HERE / ('demo' if DEMO else 'client')
ROLES = ('Astro', 'Galaxy', 'Baby', 'Harley', 'Skylar', 'Pumpkin')
ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
# (hp, legacy damage, speed). Hits deal the sword tier damage (1-20, see
# client/gear-tiers.js), so bosses take roughly 25-35 hits with a fitting sword.
BOSS_STATS = {7: (70, 18, 70), 11: (120, 17, 100), 15: (180, 15, 113), 19: (240, 16, 116)}
BOSS_JUNIOR_HP = 140.0
ARENA_W, ARENA_H = 1500, 1150
ROOMS = {}
TAG_HOUSE = TagHouse()
ACCOUNTS = AccountService()
SOCIAL_TIME_MODE = lambda: social.TIME_MODE
SOCIAL_CURRENT_EVENT = lambda: social.CURRENT_EVENT
JOIN_ATTEMPTS = defaultdict(deque)
ROOM_TTL = 2 * 60 * 60
DISCONNECT_GRACE = 90
LOG = logging.getLogger('catcity.online')
SOCIAL = SocialService(ACCOUNTS, ROOMS)


@dataclass
class Player:
    id: str
    token: str
    cat: int
    ws: object
    x: float = 544.0
    y: float = 576.0
    arena_x: float = 750.0
    arena_y: float = 1025.0
    in_boss: bool = False
    cave_id: str = ''
    cave_x: float = 0.0
    cave_y: float = 0.0
    voice_enabled: bool = False
    chapter: int = -1
    last_hit: float = 0.0
    last_update: float = 0.0
    disconnected_at: float = 0.0
    quest_stage: int = 0
    quest_started: bool = False
    activity: str = 'explore'
    skin: dict | None = None
    home: dict | None = None

    def public(self):
        return {
            'id': self.id, 'cat': self.cat, 'name': ROLES[self.cat],
            'x': round(self.x, 2), 'y': round(self.y, 2),
            'arenaX': round(self.arena_x, 2), 'arenaY': round(self.arena_y, 2),
            'inBoss': self.in_boss, 'chapter': self.chapter,
            'caveId': self.cave_id, 'caveX': round(self.cave_x, 2), 'caveY': round(self.cave_y, 2),
            'voiceEnabled': self.voice_enabled,
            'skin': self.skin,
            'home': self.home,
            'online': self.ws is not None and not self.ws.closed,
        }


@dataclass
class Room:
    code: str
    is_public: bool = False
    title: str = 'Cat City Room'
    host_id: str = ''
    started: bool = False
    players: dict = field(default_factory=dict)
    bots: list = field(default_factory=list)
    ai_room: bool = False
    human_capacity: int = len(ROLES)
    bot_drops: list = field(default_factory=list)
    bot_harvested: set = field(default_factory=set)
    bosses: dict = field(default_factory=dict)
    chat_history: deque = field(default_factory=lambda: deque(maxlen=50))
    created: float = field(default_factory=time.monotonic)
    updated: float = field(default_factory=time.monotonic)

    def snapshot(self):
        return {
            'type': 'state', 'code': self.code, 'isPublic': self.is_public, 'title': self.title,
            'hostId': self.host_id, 'started': self.started,
            'players': [p.public() for p in self.players.values()],
            'bots': self.bots, 'crewRoom': self.ai_room, 'humanCapacity': self.human_capacity,
            'botDrops': self.bot_drops, 'botMined': list(self.bot_harvested)[-100:],
            'tag': TAG_HOUSE.snapshot(self),
            'bosses': {str(ch): {
                'hp': int(round(b['hp'])), 'maxHP': b['maxHP'],
                'x': round(b['x'], 2), 'y': round(b['y'], 2),
                **({'juniorHP': round(b['juniorHP'], 2),
                    'juniorX': round(b['juniorX'], 2),
                    'juniorY': round(b['juniorY'], 2)} if ch == 19 and 'juniorHP' in b else {}),
            } for ch, b in self.bosses.items()},
        }


def code_for_room():
    for _ in range(100):
        code = ''.join(secrets.choice(ALPHABET) for _ in range(6))
        if code not in ROOMS:
            return code
    raise RuntimeError('Unable to generate a room code')


OWNER_SKIN_ACCOUNTS = {'elidagoat'}
SKIN_COLOUR = re.compile(r'^#[0-9a-fA-F]{6}$')
SKIN_WHITE = {'chest', 'belly', 'paws', 'muzzle', 'blaze'}
SKIN_ACC = {'bow', 'bandana', 'glasses', 'scarf', 'flowercrown', 'leafcrown', 'goggles', 'witchhat'}


def is_owner_account(account):
    return bool(account) and (account.get('owner') is True or str(account.get('username', '')).lower() in OWNER_SKIN_ACCOUNTS)


HOME_HOUSES = ('home', 'Rose Cottage', 'Lavender Lodge', 'Golden Villa')
HOME_FLOOR = ('lamp', 'globe', 'trophy', 'teddy', 'lantern', 'chest', 'plant', 'crystal', 'candles', 'cushion')
HOME_WALL = ('painting_sea', 'painting_rose', 'moonwindow', 'ribbon', 'clock')
HOME_PETS = ('goldfish', 'bunny', 'hamster', 'bird', 'puppy')


def clean_home(raw):
    """Validate the house a player shares with their online room (visits).
    Only known house, furniture and pet ids are kept: no free text."""
    if not isinstance(raw, dict) or raw.get('house') not in HOME_HOUSES:
        return None
    def picks(key, allowed, limit):
        value = raw.get(key)
        if not isinstance(value, list):
            return []
        return [v for v in value if isinstance(v, str) and v in allowed][:limit]
    pet = raw.get('pet')
    return {
        'house': raw['house'],
        'floor': picks('floor', HOME_FLOOR, 6),
        'wall': picks('wall', HOME_WALL, 2),
        'pet': pet if pet in HOME_PETS else None,
    }


def clean_skin(raw, account):
    """Validate a skin from a client. Returns a safe dict or None."""
    if not isinstance(raw, dict) or not account:
        return None
    if raw.get('kind') == 'owner':
        return {'kind': 'owner', 'name': str(account.get('username', ''))[:20]} if is_owner_account(account) else None
    if raw.get('kind') != 'custom':
        return None
    out = {'kind': 'custom'}
    for key in ('base', 'stripe', 'light', 'eye', 'nose', 'earIn'):
        value = raw.get(key)
        if not isinstance(value, str) or not SKIN_COLOUR.match(value):
            return None
        out[key] = value.lower()
    out['tabby'] = raw.get('tabby') is True
    out['patch'] = raw.get('patch') if raw.get('patch') in ('tux', 'calico') else None
    white = raw.get('white') if isinstance(raw.get('white'), list) else []
    out['white'] = [w for w in white if w in SKIN_WHITE][:5]
    acc = raw.get('acc') if isinstance(raw.get('acc'), list) else []
    out['acc'] = [a for a in acc if a in SKIN_ACC][:1]
    name = raw.get('name') if isinstance(raw.get('name'), str) else ''
    name = re.sub(r'[^A-Za-z0-9 _-]', '', name).strip()[:14]
    # Nobody else can pass themselves off as the owner.
    if not is_owner_account(account) and re.sub(r'[^a-z]', '', name.lower()) in ('elidagoat', 'elithegoat'):
        name = ''
    out['name'] = name
    return out


def valid_role(value):
    return type(value) is int and value in range(len(ROLES))


def clean_number(value, minimum, maximum, default):
    if type(value) not in (int, float):
        return default
    if not math.isfinite(value):
        return default
    return round(max(minimum, min(maximum, float(value))), 2)


def rate_limited(peer):
    now = time.monotonic()
    q = JOIN_ATTEMPTS[peer]
    while q and q[0] < now - 60:
        q.popleft()
    q.append(now)
    return len(q) > 25


async def send(ws, payload):
    if ws is not None and not ws.closed:
        try:
            await ws.send_json(payload)
        except (ConnectionError, RuntimeError):
            pass


async def publish(room):
    snapshot = room.snapshot()
    active = [p.ws for p in room.players.values() if p.ws is not None and not p.ws.closed]
    if active:
        await asyncio.gather(*(send(ws, snapshot) for ws in active))


def attach(room, role, ws, token=None):
    player = Player(id=secrets.token_hex(5), token=token or secrets.token_urlsafe(24), cat=role, ws=ws)
    player.x += 36 * (role - 1)
    room.players[player.id] = player
    room.updated = time.monotonic()
    return player


async def static_page(request):
    kind = request.path.lstrip('/')
    filename = {'': 'index.html', 'iphone': 'index.html', 'windows': 'index.html'}.get(kind)
    if filename is None:
        raise web.HTTPNotFound()
    return web.FileResponse(PUBLIC / filename, headers={'Cache-Control': 'no-cache'})


async def tag_map(_request):
    return web.json_response(TAG_HOUSE.map_payload())


async def tag_script(_request):
    return web.FileResponse(PUBLIC / 'tag-house.js', headers={'Cache-Control':'no-cache'})


async def cave_voice_script(_request):
    return web.FileResponse(PUBLIC / 'cave-voice.js', headers={'Cache-Control': 'no-cache'})


async def admin_stage_script(_request):
    return web.FileResponse(PUBLIC / 'admin-stage.js', headers={'Cache-Control':'no-cache'})


async def world_script(_request):
    return web.FileResponse(PUBLIC / 'world-overhaul.js', headers={'Cache-Control': 'no-cache'})


async def public_rooms(_request):
    rooms=[]
    for room in ROOMS.values():
        if not room.is_public:
            continue
        cats=sorted(p.cat for p in room.players.values())
        rooms.append({'code':room.code, 'title':room.title, 'players':len(cats),
                      'availableCats':[i for i in range(len(ROLES)) if i not in cats],
                      'capacity':room.human_capacity, 'crewRoom':room.ai_room,
                      'crewBots':[bot['name'] for bot in room.bots],
                      'crewBotRoles':[bot.get('role') for bot in room.bots]})
    rooms.sort(key=lambda r:(-r['players'],r['title']))
    return web.json_response({'rooms':rooms,'maxRooms':16,'activeRooms':len(ROOMS)},
                             headers={'Cache-Control':'no-store'})


async def mining_script(_request):
    return web.FileResponse(PUBLIC / 'adventure-mining.js', headers={'Cache-Control':'no-cache'})

async def adventure_script(_request):
    return web.FileResponse(PUBLIC / 'adventure-update.js', headers={'Cache-Control':'no-cache'})

async def bot_adventure_script(_request):
    return web.FileResponse(PUBLIC / 'bot-adventure.js', headers={'Cache-Control':'no-cache'})

async def resource_tree_script(_request):
    return web.FileResponse(PUBLIC / 'resource-trees.js', headers={'Cache-Control':'no-cache'})

async def terraria_inventory_script(_request):
    return web.FileResponse(PUBLIC / 'terraria-inventory.js', headers={'Cache-Control':'no-cache'})

async def tutorial_island_script(_request):
    return web.FileResponse(PUBLIC / 'tutorial-island.js', headers={'Cache-Control':'no-cache'})

async def ui_layout_polish_script(_request):
    return web.FileResponse(PUBLIC / 'ui-layout-polish.js', headers={'Cache-Control':'no-cache'})

async def squishem_art_script(_request):
    return web.FileResponse(PUBLIC / 'squishem-art.js', headers={'Cache-Control':'no-cache'})


async def squishems_script(_request):
    return web.FileResponse(PUBLIC / 'squishems.js', headers={'Cache-Control':'no-cache'})


async def squishem_museum_script(_request):
    return web.FileResponse(PUBLIC / 'squishem-museum.js', headers={'Cache-Control':'no-cache'})


async def live_event_adventures_script(_request):
    return web.FileResponse(PUBLIC / 'live-event-adventures.js', headers={'Cache-Control':'no-cache'})


async def adventure_quest_board_script(_request):
    return web.FileResponse(PUBLIC / 'adventure-quest-board.js', headers={'Cache-Control':'no-cache'})


async def event_decorations_script(_request):
    return web.FileResponse(PUBLIC / 'event-decorations.js', headers={'Cache-Control':'no-cache'})


async def squishem_places_script(_request):
    return web.FileResponse(PUBLIC / 'squishem-places.js', headers={'Cache-Control':'no-cache'})


async def pc_house_script(_request):
    return web.FileResponse(PUBLIC / 'pc-house.js', headers={'Cache-Control':'no-cache'})


async def public_script(_request):
    return web.FileResponse(PUBLIC / 'public-lobbies.js', headers={'Cache-Control':'no-cache'})


async def storybook_script(_request):
    return web.FileResponse(PUBLIC / 'storybook-garden.js', headers={'Cache-Control':'no-cache'})


async def aurora_atelier_script(_request):
    return web.FileResponse(PUBLIC / 'aurora-atelier.js', headers={'Cache-Control': 'no-cache'})


async def item_pixel_art_script(_request):
    return web.FileResponse(PUBLIC / 'item-pixel-art.js', headers={'Cache-Control': 'no-cache'})


async def cat_pixel_art_script(_request):
    return web.FileResponse(PUBLIC / 'cat-pixel-art.js', headers={'Cache-Control': 'no-cache'})


async def nature_pixel_art_script(_request):
    return web.FileResponse(PUBLIC / 'nature-pixel-art.js', headers={'Cache-Control': 'no-cache'})


async def village_interiors_script(_request):
    return web.FileResponse(PUBLIC / 'village-interiors.js', headers={'Cache-Control': 'no-cache'})


async def cat_art_wire_script(_request):
    return web.FileResponse(PUBLIC / 'cat-art-wire.js', headers={'Cache-Control': 'no-cache'})


async def birman_art_script(_request):
    return web.FileResponse(PUBLIC / 'birman-art.js', headers={'Cache-Control': 'no-cache'})


async def hud_layout_fix_script(_request):
    return web.FileResponse(PUBLIC / 'hud-layout-fix.js', headers={'Cache-Control': 'no-cache'})


VOICE_FILE = re.compile(r'^[tvwck]\d{2}\.m4a$')  # t = tutorial, v = extra lines, w = Birman Takeover, c = castle mission, k = Cat Tok trailer


FONT_FILE = re.compile(r'^CatCityPixel\.(woff|ttf)$')


async def font_file(request):
    # The original Cat City Pixel font (client/assets/fonts).
    name = request.match_info.get('name', '')
    path = PUBLIC / 'assets' / 'fonts' / name
    if not FONT_FILE.match(name) or not path.is_file():
        raise web.HTTPNotFound()
    kind = 'font/woff' if name.endswith('.woff') else 'font/ttf'
    return web.FileResponse(path, headers={'Cache-Control': 'public, max-age=604800', 'Content-Type': kind})


async def voice_lines_script(_request):
    return web.FileResponse(PUBLIC / 'voice-lines.js', headers={'Cache-Control': 'no-cache'})


async def pixel_caves_script(_request):
    return web.FileResponse(PUBLIC / 'pixel-caves.js', headers={'Cache-Control': 'no-cache'})


async def levels_script(_request):
    return web.FileResponse(PUBLIC / 'levels.js', headers={'Cache-Control': 'no-cache'})


async def update_cutscene_script(_request):
    return web.FileResponse(PUBLIC / 'update-cutscene.js', headers={'Cache-Control': 'no-cache'})


async def release_loader_script(_request):
    return web.FileResponse(PUBLIC / 'release-loader.js', headers={'Cache-Control': 'no-cache'})


async def cozy_update_script(_request):
    return web.FileResponse(PUBLIC / 'cozy-update.js', headers={'Cache-Control': 'no-cache'})


async def playtest_features_script(_request):
    return web.FileResponse(PUBLIC / 'playtest-features.js', headers={'Cache-Control': 'no-cache'})


async def taxi_escape_script(_request):
    return web.FileResponse(PUBLIC / 'taxi-escape.js', headers={'Cache-Control': 'no-cache'})


async def glitch_report_script(_request):
    return web.FileResponse(PUBLIC / 'glitch-report.js', headers={'Cache-Control': 'no-cache'})


async def skins_script(_request):
    return web.FileResponse(PUBLIC / 'skins.js', headers={'Cache-Control': 'no-cache'})


async def tv_glitch_script(_request):
    return web.FileResponse(PUBLIC / 'tv-glitch.js', headers={'Cache-Control': 'no-cache'})


async def soundtrack_script(_request):
    return web.FileResponse(PUBLIC / 'soundtrack.js', headers={'Cache-Control': 'no-cache'})


async def infected_kitties_script(_request):
    return web.FileResponse(PUBLIC / 'infected-kitties.js', headers={'Cache-Control': 'no-cache'})


async def flower_terrace_script(_request):
    return web.FileResponse(PUBLIC / 'flower-terrace.js', headers={'Cache-Control': 'no-cache'})


async def pixel_ui_script(_request):
    return web.FileResponse(PUBLIC / 'pixel-ui.js', headers={'Cache-Control': 'no-cache'})


async def admin_birman_script(_request):
    return web.FileResponse(PUBLIC / 'admin-birman.js', headers={'Cache-Control': 'no-cache'})


async def birman_takeover_script(_request):
    return web.FileResponse(PUBLIC / 'birman-takeover.js', headers={'Cache-Control': 'no-cache'})


async def bow_script(_request):
    return web.FileResponse(PUBLIC / 'bow.js', headers={'Cache-Control': 'no-cache'})


async def pixel_decor_script(_request):
    return web.FileResponse(PUBLIC / 'pixel-decor.js', headers={'Cache-Control': 'no-cache'})


async def lucky_blocks_script(_request):
    return web.FileResponse(PUBLIC / 'lucky-blocks.js', headers={'Cache-Control': 'no-cache'})


async def pixel_floors_script(_request):
    return web.FileResponse(PUBLIC / 'pixel-floors.js', headers={'Cache-Control': 'no-cache'})


async def gear_tiers_script(_request):
    return web.FileResponse(PUBLIC / 'gear-tiers.js', headers={'Cache-Control': 'no-cache'})


async def pixel_emoji_script(_request):
    return web.FileResponse(PUBLIC / 'pixel-emoji.js', headers={'Cache-Control': 'no-cache'})


async def voice_line(request):
    # Tutorial voice lines recorded by the owner (client/assets/voice/tNN.m4a).
    name = request.match_info.get('name', '')
    path = PUBLIC / 'assets' / 'voice' / name
    if not VOICE_FILE.match(name) or not path.is_file():
        raise web.HTTPNotFound()
    return web.FileResponse(path, headers={'Cache-Control': 'public, max-age=86400', 'Content-Type': 'audio/mp4'})


async def aurora_atlas(_request):
    return web.FileResponse(PUBLIC / 'assets' / 'aurora-atlas.svg',
                            headers={'Content-Type': 'image/svg+xml',
                                     'Cache-Control': 'public, max-age=3600'})

async def social_script(_request):
    return web.FileResponse(PUBLIC / 'social-accounts.js', headers={'Cache-Control':'no-cache'})


async def health(_request):
    return web.json_response({'ok': True, 'game': 'Cat City Online', 'rooms': len(ROOMS)})


async def websocket(request):
    if not same_origin(request):
        raise web.HTTPForbidden(text='Invalid origin.')
    ws = web.WebSocketResponse(heartbeat=24, max_msg_size=8192, compress=False)
    await ws.prepare(request)
    room = None
    player = None
    peer = request.remote or 'unknown'
    try:
        async for message in ws:
            if message.type != WSMsgType.TEXT:
                if message.type in (WSMsgType.CLOSED, WSMsgType.ERROR):
                    break
                continue
            try:
                data = json.loads(message.data)
            except (ValueError, TypeError):
                await send(ws, {'type': 'error', 'message': 'That message could not be read.'})
                continue
            if not isinstance(data, dict):
                continue
            action = data.get('type')
            if action in ('create', 'join', 'resume'):
                if player is not None:
                    await send(ws, {'type': 'error', 'message': 'Leave your current room before joining another.'})
                    continue
                if rate_limited(peer):
                    await send(ws, {'type': 'error', 'message': 'Too many attempts. Please try again shortly.'})
                    continue
                if action == 'create':
                    role = data.get('cat')
                    if not valid_role(role):
                        await send(ws, {'type': 'error', 'message': 'Choose Astro, Galaxy, Baby, Harley, Skylar or Pumpkin.'})
                        continue
                    if len(ROOMS) >= 16:
                        await send(ws, {'type': 'error', 'message': 'All 16 rooms are in use. Try again in a little while.'})
                        continue
                    room = Room(code_for_room())
                    room.is_public = data.get('public') is True
                    raw_title = data.get('title','')
                    proposed_title = ''.join(c for c in str(raw_title)[:50] if c.isprintable()).strip()[:28]
                    valid_title, _ = clean_chat(proposed_title)
                    room.title = valid_title or ('Open Cat City Room' if room.is_public else 'Private Cat City Room')
                    ROOMS[room.code] = room
                    player = attach(room, role, ws)
                    room.host_id = player.id
                elif action == 'join':
                    code = str(data.get('code', '')).strip().upper().replace(' ', '')
                    role = data.get('cat')
                    candidate = ROOMS.get(code)
                    if not candidate:
                        await send(ws, {'type': 'error', 'message': 'Room not found. Check the 6-character code.'})
                        continue
                    if not valid_role(role):
                        await send(ws, {'type': 'error', 'message': 'Choose which cat to play.'})
                        continue
                    if len(candidate.players) >= candidate.human_capacity:
                        await send(ws, {'type': 'error', 'message': f'This room is full ({candidate.human_capacity} human players).', 'code': 'FULL'})
                        continue
                    if role in {p.cat for p in candidate.players.values()}:
                        await send(ws, {'type': 'error', 'message': f'{ROLES[role]} is already taken. Choose another cat.'})
                        continue
                    room = candidate
                    player = attach(room, role, ws)
                    if room.ai_room and not room.host_id:
                        room.host_id = player.id
                else:
                    code = str(data.get('code', '')).strip().upper()
                    token = data.get('token')
                    candidate = ROOMS.get(code)
                    match = next((p for p in candidate.players.values() if p.token == token), None) if candidate and isinstance(token, str) else None
                    if not match:
                        await send(ws, {'type': 'error', 'message': 'Could not restore the previous room. Try Join Room.'})
                        continue
                    if match.ws is not None and not match.ws.closed:
                        await match.ws.close(code=1000, message=b'Reconnected from another tab')
                    room = candidate
                    player = match
                    player.ws = ws
                    player.disconnected_at = 0
                    player.voice_enabled = False
                    room.updated = time.monotonic()
                await send(ws, {'type': 'welcome', 'code': room.code, 'id': player.id, 'token': player.token, 'cat': player.cat, 'players': [p.public() for p in room.players.values()], 'isPublic':room.is_public, 'title':room.title, 'hostId':room.host_id, 'started':room.started,
                                           'bots':room.bots, 'crewRoom':room.ai_room, 'humanCapacity':room.human_capacity})
                await publish(room)
                if room.chat_history:
                    await send(ws, {'type':'chat_history', 'messages':list(room.chat_history)})
                await send(ws, {'type':'admin_time', 'timeMode':getattr(room,'admin_time_mode',SOCIAL_TIME_MODE())})
                await send(ws, {'type':'admin_event', 'event':getattr(room,'admin_event',SOCIAL_CURRENT_EVENT())})
                await send(ws, {'type':'admin_npc', 'npcs':SOCIAL.npcs+getattr(room,'admin_npcs',[])})
                await send(ws, {'type':'admin_stage', 'stage':SOCIAL.stage})
                await send(ws, SOCIAL.poll_packet())
                scoped_announcement=getattr(room,'admin_announcement',None)
                if scoped_announcement:
                    await send(ws, {'type':'announcement','text':scoped_announcement['text'],'by':'Cat City Admin',
                                    'id':scoped_announcement.get('id'),'at':scoped_announcement.get('at')})
                continue
            if action == 'leave':
                if room and player:
                    was_host = player.id == room.host_id
                    room.players.pop(player.id, None)
                    if was_host and room.players:
                        room.host_id = next(iter(room.players))
                    if not room.players:
                        if room.ai_room: room.host_id = ''
                        else: ROOMS.pop(room.code, None)
                    else:
                        await publish(room)
                room, player = None, None
                await send(ws, {'type': 'left'})
                continue
            if player is None or room is None:
                await send(ws, {'type': 'error', 'message': 'Create or join a room first.'})
                continue
            if action == 'poll_vote':
                await SOCIAL.vote(ws,room,player,data)
                continue
            if action == 'bot_collect':
                packet=collect_bot_drop(room,player,data.get('id'))
                if packet:
                    await send(ws,packet)
                    room.updated=time.monotonic()
                    await publish(room)
                continue
            if action == 'start_game':
                if player.id != room.host_id:
                    await send(ws, {'type':'error','message':'Only the room host can start the game.'})
                    continue
                if not room.started:
                    room.started = True
                    room.updated = time.monotonic()
                    await publish(room)
                continue
            if action == 'set_skin':
                # Character skins: a custom cat (needs an account) or the owner's
                # own skin (only the owner's account). Anything else is ignored.
                account = ACCOUNTS.user(request)
                player.skin = clean_skin(data.get('skin'), account)
                room.updated = time.monotonic()
                await publish(room)
                continue
            if action == 'set_home':
                # House visits: share which house you live in and what's in it.
                player.home = clean_home(data.get('home'))
                room.updated = time.monotonic()
                await publish(room)
                continue
            if action == 'chat':
                await SOCIAL.chat(ws, room, player, data, request)
                continue
            if action == 'chat_report':
                await SOCIAL.report(ws, room, player, data)
                continue
            if action == 'room_visibility':
                if not room.ai_room and player.id == room.host_id and isinstance(data.get('public'), bool):
                    room.is_public = data['public']
                    if room.is_public:
                        for participant in room.players.values():
                            if participant.voice_enabled:
                                participant.voice_enabled = False
                                await send(participant.ws, {'type':'voice_disabled','reason':'Voice chat works in private rooms only.'})
                    room.updated = time.monotonic()
                    await publish(room)
                continue
            if action in ('voice_status','voice_signal','voice_status_disabled','voice_signal_disabled'):
                await send(ws, {'type':'voice_error','message':'Voice chat has been removed from Cat City.'})
                continue
            if action == 'tag_enter':
                # Party transfer: all connected teammates enter the same Tag House.
                # Entry is idempotent, so late arrival cannot reset other players.
                changed=False
                for teammate in list(room.players.values()):
                    if teammate.ws is not None and not teammate.ws.closed:
                        changed=TAG_HOUSE.handle(room,teammate,'tag_enter',{}) or changed
                if changed:
                    room.updated=time.monotonic()
                    await publish(room)
                continue
            if isinstance(action, str) and action.startswith('tag_'):
                if TAG_HOUSE.handle(room, player, action, data):
                    room.updated = time.monotonic()
                    await publish(room)
                continue
            if action == 'position':
                now = time.monotonic()
                if now - player.last_update < 0.055:
                    continue
                player.last_update = now
                player.x = clean_number(data.get('x'), -150000, 150000, player.x)
                old_quest_started = player.quest_started
                quest_stage = data.get('questStage')
                player.quest_stage = quest_stage if type(quest_stage) is int and 0 <= quest_stage <= 16 else player.quest_stage
                player.quest_started = data.get('questStarted') is True
                activity=data.get('activity')
                if isinstance(activity,str) and activity in VALID_ACTIVITIES:
                    player.activity=activity
                if room.ai_room and player.quest_started and not old_quest_started:
                    await send(ws, {'type':'ai_quest_help','text':'🐾 Your teammates are joining your quest! Lead the way.'})
                player.y = clean_number(data.get('y'), -150000, 150000, player.y)
                player.arena_x = clean_number(data.get('arenaX'), 48, ARENA_W - 48, player.arena_x)
                player.arena_y = clean_number(data.get('arenaY'), 64, ARENA_H - 48, player.arena_y)
                cave_id = data.get('caveId','')
                player.cave_id = cave_id if isinstance(cave_id, str) and len(cave_id) <= 32 and (not cave_id or cave_id.startswith('c:')) else ''
                if player.cave_id:
                    player.cave_x = clean_number(data.get('caveX'),0,1200,player.cave_x)
                    player.cave_y = clean_number(data.get('caveY'),0,1000,player.cave_y)
                in_boss = data.get('inBoss') is True
                chapter = data.get('chapter')
                player.in_boss = in_boss and type(chapter) is int and chapter in BOSS_STATS
                player.chapter = chapter if player.in_boss else -1
                room.updated = now
                if player.in_boss and player.chapter not in room.bosses:
                    max_hp, _, _ = BOSS_STATS[player.chapter]
                    room.bosses[player.chapter] = {
                        'hp': float(max_hp), 'maxHP': max_hp,
                        'x': float(ARENA_W / 2), 'y': float(ARENA_H * .29),
                        'last_active': now, 'last_assist': now,
                    }
                    if player.chapter == 19:
                        room.bosses[player.chapter].update({'juniorHP': BOSS_JUNIOR_HP,
                            'juniorX': float(ARENA_W * .31), 'juniorY': float(ARENA_H * .38)})
                await publish(room)
            elif action == 'boss_hit':
                chapter = data.get('chapter')
                now = time.monotonic()
                if type(chapter) is not int or not player.in_boss or player.chapter != chapter or chapter not in BOSS_STATS:
                    continue
                if now - player.last_hit < 0.29:
                    continue
                boss = room.bosses.get(chapter)
                if not boss or (boss['hp'] <= 0 and boss.get('juniorHP', 0) <= 0):
                    continue
                player.last_hit = now
                # Damage per hit comes from the sword tier the client reports,
                # clamped to the real range (no sword 1 ... admin 20 + bonuses).
                power = data.get('power', 1)
                damage = min(28.0, max(1.0, float(power))) if isinstance(power, (int, float)) and not isinstance(power, bool) and power == power else 1.0
                # A modest, capped collectible bonus for co-op fights. The client
                # chooses its carried plush; the server fixes the allowed values.
                boosts={'astro':1.10,'baby':1.27,'harley':1.22,'berry':1.08,'minty':1.0,
                        'galaxy':1.0,'skyler':1.0,'pumpkin':1.0,'mochi':1.0,'starpuff':1.0}
                squish=data.get('squishem')
                factor=boosts.get(squish,1.0) if isinstance(squish,str) else 1.0
                if chapter == 19 and data.get('target') == 'junior':
                    boss['juniorHP'] = max(0.0, boss.get('juniorHP', 0) - round(damage*factor,2))
                elif boss['hp'] > 0:
                    boss['hp'] = max(0.0, boss['hp'] - round(damage*factor,2))
                else:
                    continue
                room.updated = now
                await publish(room)
            elif action == 'ping':
                await send(ws, {'type': 'pong'})
    finally:
        if room and player and player.ws is ws:
            player.ws = None
            player.voice_enabled = False
            player.disconnected_at = time.monotonic()
            room.updated = time.monotonic()
            await publish(room)
    return ws


async def tick_bosses(app):
    try:
        while True:
            await asyncio.sleep(.18)
            now = time.monotonic()
            await SOCIAL.maybe_finish_poll()
            for code, room in list(ROOMS.items()):
                for pid, p in list(room.players.items()):
                    if p.ws is None and now - p.disconnected_at > DISCONNECT_GRACE:
                        room.players.pop(pid, None)
                        if room.host_id == pid:
                            room.host_id = next(iter(room.players), '')
                            if room.players:
                                await publish(room)
                if not room.ai_room and (not room.players or now - room.updated > ROOM_TTL):
                    ROOMS.pop(code, None)
                    TAG_HOUSE.clear(code)
                    continue
                if room.ai_room and room.players:
                    if tick_workers(room, .18, now) and int(now*4)%2==0:
                        await publish(room)
                if TAG_HOUSE.tick(room, now):
                    await publish(room)
                for chapter, boss in list(room.bosses.items()):
                    players = [p for p in room.players.values() if p.ws is not None and p.in_boss and p.chapter == chapter]
                    if not players:
                        if now - boss['last_active'] > 5:
                            room.bosses.pop(chapter, None)
                        continue
                    boss['last_active'] = now
                    if boss['hp'] <= 0 and boss.get('juniorHP', 0) <= 0:
                        continue
                    target = min(players, key=lambda p: (p.arena_x-boss['x'])**2 + (p.arena_y-boss['y'])**2)
                    dx = target.arena_x - boss['x']
                    dy = target.arena_y - boss['y']
                    dist = math.hypot(dx, dy)
                    if dist > 85 and boss['hp'] > 0:
                        step = min(dist-85, BOSS_STATS[chapter][2] * .18)
                        boss['x'] = min(ARENA_W-55, max(55, boss['x'] + dx / dist * step))
                        boss['y'] = min(ARENA_H-55, max(68, boss['y'] + dy / dist * step))
                    if chapter == 19 and boss.get('juniorHP', 0) > 0:
                        junior_target = min(players, key=lambda p:
                            (p.arena_x-boss['juniorX'])**2 + (p.arena_y-boss['juniorY'])**2)
                        jdx = junior_target.arena_x - boss['juniorX']
                        jdy = junior_target.arena_y - boss['juniorY']
                        jd = math.hypot(jdx,jdy)
                        if jd > 75:
                            step = min(jd-75, 145 * .18)
                            boss['juniorX'] = min(ARENA_W-55,max(55,boss['juniorX']+jdx/jd*step))
                            boss['juniorY'] = min(ARENA_H-55,max(68,boss['juniorY']+jdy/jd*step))
                    if now - boss['last_assist'] > 6.5:
                        boss['last_assist'] = now
                        if boss['hp'] > 0:
                            boss['hp'] = max(0.0, boss['hp'] - 3)
                        elif chapter == 19:
                            boss['juniorHP'] = max(0.0, boss['juniorHP'] - 3)  # Biscuit's assistance
                    await publish(room)
    except asyncio.CancelledError:
        pass


async def background(app):
    task = asyncio.create_task(tick_bosses(app))
    yield
    task.cancel()
    await task


def make_app():
    app = web.Application(client_max_size=262_144)
    if not any(room.ai_room for room in ROOMS.values()):
        make_lobbies(Room, ROOMS, code_for_room)
    app.router.add_get('/', static_page)
    app.router.add_get('/iphone', static_page)
    app.router.add_get('/windows', static_page)
    app.router.add_get('/health', health)
    app.router.add_get('/public-rooms', public_rooms)
    app.router.add_get('/public-lobbies.js', public_script)
    app.router.add_get('/adventure-update.js', adventure_script)
    app.router.add_get('/adventure-mining.js', mining_script)
    app.router.add_get('/bot-adventure.js', bot_adventure_script)
    app.router.add_get('/pc-house.js', pc_house_script)
    app.router.add_get('/resource-trees.js', resource_tree_script)
    app.router.add_get('/squishem-art.js', squishem_art_script)
    app.router.add_get('/squishems.js', squishems_script)
    app.router.add_get('/squishem-places.js', squishem_places_script)
    app.router.add_get('/event-decorations.js', event_decorations_script)
    app.router.add_get('/squishem-museum.js', squishem_museum_script)
    app.router.add_get('/live-event-adventures.js', live_event_adventures_script)
    app.router.add_get('/adventure-quest-board.js', adventure_quest_board_script)
    app.router.add_get('/terraria-inventory.js', terraria_inventory_script)
    app.router.add_get('/tutorial-island.js', tutorial_island_script)
    app.router.add_get('/ui-layout-polish.js', ui_layout_polish_script)
    # Conversational AI and voice routes intentionally removed.
    app.router.add_get('/storybook-garden.js', storybook_script)
    app.router.add_get('/aurora-atelier.js', aurora_atelier_script)
    app.router.add_get('/hud-layout-fix.js', hud_layout_fix_script)
    app.router.add_get('/birman-art.js', birman_art_script)
    app.router.add_get('/cat-pixel-art.js', cat_pixel_art_script)
    app.router.add_get('/item-pixel-art.js', item_pixel_art_script)
    app.router.add_get('/cat-art-wire.js', cat_art_wire_script)
    app.router.add_get('/village-interiors.js', village_interiors_script)
    app.router.add_get('/nature-pixel-art.js', nature_pixel_art_script)
    app.router.add_get('/art/aurora-atlas.svg', aurora_atlas)
    app.router.add_get('/voice/{name}', voice_line)
    app.router.add_get('/assets/fonts/{name}', font_file)
    app.router.add_get('/pixel-emoji.js', pixel_emoji_script)
    app.router.add_get('/gear-tiers.js', gear_tiers_script)
    app.router.add_get('/pixel-floors.js', pixel_floors_script)
    app.router.add_get('/lucky-blocks.js', lucky_blocks_script)
    app.router.add_get('/pixel-decor.js', pixel_decor_script)
    app.router.add_get('/bow.js', bow_script)
    app.router.add_get('/birman-takeover.js', birman_takeover_script)
    app.router.add_get('/admin-birman.js', admin_birman_script)
    app.router.add_get('/pixel-ui.js', pixel_ui_script)
    app.router.add_get('/flower-terrace.js', flower_terrace_script)
    app.router.add_get('/infected-kitties.js', infected_kitties_script)
    app.router.add_get('/soundtrack.js', soundtrack_script)
    app.router.add_get('/tv-glitch.js', tv_glitch_script)
    app.router.add_get('/skins.js', skins_script)
    app.router.add_get('/glitch-report.js', glitch_report_script)
    app.router.add_get('/taxi-escape.js', taxi_escape_script)
    app.router.add_get('/playtest-features.js', playtest_features_script)
    app.router.add_get('/cozy-update.js', cozy_update_script)
    app.router.add_get('/release-loader.js', release_loader_script)
    app.router.add_get('/update-cutscene.js', update_cutscene_script)
    app.router.add_get('/levels.js', levels_script)
    app.router.add_get('/pixel-caves.js', pixel_caves_script)
    app.router.add_get('/voice-lines.js', voice_lines_script)
    app.router.add_get('/social-accounts.js', social_script)
    app.router.add_get('/tag-map', tag_map)
    app.router.add_get('/tag-house.js', tag_script)
    app.router.add_get('/world-overhaul.js', world_script)
    app.router.add_get('/cave-voice.js', cave_voice_script)
    app.router.add_get('/admin-stage.js', admin_stage_script)
    app.router.add_get('/ws', websocket)
    install_routes(app, ACCOUNTS)
    install_glitch_reports(app, ACCOUNTS)
    install_glitch_screens(app, ACCOUNTS)
    install_update_requests(app, ACCOUNTS)
    if not DEMO:  # staged updates and the 🚀 Release button belong to the main game only
        install_releases(app, ACCOUNTS)
        install_cattok(app, ACCOUNTS, clean_chat)
    SOCIAL.routes(app)
    app.cleanup_ctx.append(ACCOUNTS.startup)
    app.cleanup_ctx.append(background)
    return app


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    port = int(os.environ.get('PORT', '8765'))
    print(f'Cat City Online is running: http://localhost:{port}/')
    print('Windows: /windows   |   iPhone: /iphone')
    print('For internet play, deploy this folder to an HTTPS hosting service.')
    web.run_app(make_app(), host='0.0.0.0', port=port, print=None)
"""Cat City room chat, child-friendly NPC dialogue and owner-only tools.

No external AI key is bundled. NPC replies are safe, context-dependent dialogue,
not claims that a hosted generative model is running.
"""
from __future__ import annotations
import asyncio
import math
from collections import deque
import re
import secrets
import time
import unicodedata
from aiohttp import web
from accounts import same_origin, limited

BAD_WORDS = re.compile(r'(?i)\b(?:fuck\w*|f\W*u\W*c\W*k|shit\w*|bitch\w*|cunt\w*|asshole\w*|dick\w*|piss\w*|bastard\w*|slut\w*|nigg\w*|fagg\w*)\b')
HARMFUL = re.compile(r'(?i)\b(?:kill yourself|kys|go die|i hate you|you suck|stupid idiot|moron)\b')
CONTACT = re.compile(r'(?i)(?:https?://|www\.|\b\w+[.+-]?\w*@\w+\.\w+\b|\b(?:\+?\d[\s().-]*){8,}\b|discord\.gg|snapchat|whatsapp|telegram|\.com\b|\.co\.uk\b)')
CHAT_PRESETS = (
    'Follow me! 🐾', 'Let’s play tag!', 'Let’s do a quest!',
    'Nice job! 💜', 'Where should we go?', 'Meet at the village!'
)
REPORTS = deque(maxlen=120)
CURRENT_EVENT = {'name':'none', 'endsAt': 0}
LATEST_ANNOUNCEMENT = None
TIME_MODE = 'auto'
NPCS = {
    'Marmalade': ('shop', 'The shop has supplies for your journey. Fish coins are handy!'),
    'Pebble': ('library', 'A wonderful question! The library is full of little clues.'),
    'Luna': ('magic', 'A little kindness can be the strongest magic.'),
    'Biscuit': ('quests', 'The next quest is waiting! Check your journal.'),
    'Forge': ('craft', 'You can use materials to craft armour and tools.'),
    'SlayCat': ('friendship', 'You are doing brilliantly, bestie!'),
    'Poppy': ('garden', 'The cherry trees bloom beautifully in Cat City.'),
    'Mochi': ('forest', 'Have you spotted the secret paths in the woods?'),
    'Nova': ('stars', 'The night sky is beautiful in Cat City!'),
}


def clean(message):
    if not isinstance(message, str):
        return None, 'Please type a message.'
    raw = unicodedata.normalize('NFKC', message)
    raw = ''.join(c for c in raw if c.isprintable() and c not in '\r\n\t').strip()
    if not (2 <= len(raw) <= 160):
        return None, 'Messages must contain 2–160 characters.'
    if BAD_WORDS.search(raw) or BAD_WORDS.search(re.sub(r'[^a-zA-Z]', '', raw)) or HARMFUL.search(raw):
        return None, 'That language is not allowed. Please keep Cat City friendly.'
    if CONTACT.search(raw):
        return None, 'Please do not share links or personal contact details.'
    return raw, None


def npc_reply(npc, message, quest_stage=0, previous=''):
    name = npc if npc in NPCS else 'Mochi'
    text = message.lower()
    if re.search(r'\b(hi|hello|hey|hiya)\b',text):
        return f'Hello there! I’m {name}. Welcome to Cat City! What would you like to explore? 🐾'
    if any(q in text for q in ('boss','birman','fight','attack')):
        return 'The Birmans are tricky! Watch the warning circles, keep moving, and jump to dodge their yarn.'
    if any(q in text for q in ('quest','mission','what next','help me')):
        return f'You are on Quest {max(1,min(16,int(quest_stage)+1))}. Open Quests to see your next goal. I believe in you!'
    if any(q in text for q in ('tag','freeze','chase','run')):
        return 'Open Pause → Tag House to play Normal Tag or Freeze Tag. Run along the maze corridors to escape!'
    if any(q in text for q in ('craft','armour','armor','titanium','amethyst','string','materials')):
        return 'Gather materials and open Inventory to craft armour. Different biomes have different surprises!'
    if any(q in text for q in ('forest','biome','cherry','poison','camp','wrangler')):
        return 'There are forests, cherry groves and dangerous poison areas. The Catnip Wranglers hide near their camp!'
    if any(q in text for q in ('sad','scared','lonely','worried')):
        return 'I’m glad you came to talk. You can explore at your own speed, and you can always take a break. 💜'
    if any(q in text for q in ('friend','mum','mom','brother','family')):
        return 'That sounds like an adventure for friends! Create a private room and give your family the short code.'
    if any(q in text for q in ('where','direction','lost')):
        return 'Try opening the map. You can also use Quick Home if you want to return to the village.'
    if any(q in text for q in ('thank','thanks')):
        return 'You’re very welcome, little adventurer! 🌸'
    if any(q in text for q in ('music','song','sound')):
        return 'The cozy background tunes can be adjusted in Settings. My favourite is exploring the cherry trees!'
    persona, default = NPCS[name]
    return f'{default} ' + ('What would you like to know next?' if not previous else 'We can talk about quests, crafting, tag, or exploring!')


async def broadcast(rooms, packet):
    for room in list(rooms.values()):
        for player in room.players.values():
            ws=player.ws
            if ws is not None and not ws.closed:
                try:
                    await ws.send_json(packet)
                except (ConnectionError, RuntimeError):
                    pass


class SocialService:
    def __init__(self, accounts, rooms):
        self.accounts = accounts
        self.rooms = rooms
        self.last_chat = {}
        self.poll = None
        self.unique_issued = set()
        self.npc_history = {}
        self.npcs = []
        self.stage = {'active':False,'id':'','x':480.0,'y':280.0,'cat':0,'lastUpdate':0,'present':False}
        self.stage_last = 0.0

    async def chat(self, ws, room, player, data, request):
        msg, error = clean(data.get('message'))
        if error:
            await ws.send_json({'type':'chat_error','message':error})
            return
        # Public rooms keep unauthenticated guest chat to safe one-tap phrases.
        account=self.accounts.user(request)
        if room.is_public and not account and msg not in CHAT_PRESETS:
            await ws.send_json({'type':'chat_error','message':'For public rooms, sign in to type. Guests can use quick-chat phrases.'})
            return
        now=time.monotonic()
        key=(room.code, player.id)
        if now - self.last_chat.get(key,0) < 1.5 or limited('chat:'+player.id,8,60):
            await ws.send_json({'type':'chat_error','message':'Please slow down between messages.'})
            return
        self.last_chat[key] = now
        record = {'type':'chat','id':secrets.token_hex(6),'cat':player.cat,
                  'name': account['username'] if account else player.public()['name']+' (Guest)',
                  'text':msg, 'time':int(time.time())}
        room.chat_history.append(record)
        for p in room.players.values():
            if p.ws and not p.ws.closed:
                try:
                    await p.ws.send_json(record)
                except (ConnectionError, RuntimeError):
                    pass
        return record

    @staticmethod
    def _ai_vote_choice(identity,options):
        """Simulated preferences, not human votes or paid model responses."""
        favourites={
            'mochi':('treasure_rain','cherry_blossom','fish_festival','crystal_carnival'),
            'nova':('galaxy_gala','starfall','moonlight_magic','crystal_carnival','meteor_shower'),
            'poppy':('pumpkin_cutie','cherry_blossom','lily_bloom','rainbow_day','fish_festival'),
            'pip':('frog_festival','lily_bloom','catnip_party','rainbow_day'),
            'cosmo':('ghost_2_0','galaxy_gala','crystal_carnival','meteor_shower','starfall','moonlight_magic'),
            'biscuit':('wrangler_raid','treasure_rain','fish_festival','ghost_parade'),
        }
        if options and all(str(o).startswith('c') and len(str(o))==2 for o in options):
            return secrets.choice(options)  # custom owner poll: no favourites
        pref=favourites.get(identity,())
        scores={event:(len(pref)-pref.index(event)) if event in pref else 0 for event in options}
        best=max(scores.values())
        preferred=[event for event in options if scores[event]==best]
        return secrets.choice(preferred)

    def _new_ai_voters(self,options):
        """Four AI lobbies have two worker cats each; one simulated vote per cat."""
        now=int(time.time())
        queue=[]
        for room in self.rooms.values():
            if not getattr(room,'ai_room',False):continue
            for index,cat in enumerate(room.bots[:2]):
                bot_id=cat.get('id')
                if not isinstance(bot_id,str):continue
                # Stagger votes rather than immediately crowding the results.
                delay=4+secrets.randbelow(42)+(index*3)
                queue.append({'id':room.code+':'+bot_id,'dueAt':now+delay,
                              'choice':self._ai_vote_choice(bot_id,options)})
        return queue

    def poll_packet(self):
        p=self.poll
        if not p:
            return {'type':'poll_state','active':False}
        return {'type':'poll_state','active':True,'id':p['id'],'options':p['options'],
                'custom':bool(p.get('custom')),'question':p.get('question',''),'labels':dict(p.get('labels',{})),
                'votes':dict(p['votes']),'botVotes':dict(p['botVotes']),
                'humanVotes':dict(p['humanVotes']),
                'botTotal':sum(p['botVotes'].values()),'humanTotal':len(p['voters']),
                'endsAt':p['endsAt']}

    async def vote(self, ws, room, player, data):
        p=self.poll
        if not p or p['endsAt']<=int(time.time()):
            await ws.send_json({'type':'poll_error','message':'There is no active global vote.'})
            return
        selected=data.get('event')
        if selected not in p['options']:
            await ws.send_json({'type':'poll_error','message':'Choose one of the listed options.'})
            return
        if player.id in p['voters']:
            await ws.send_json({'type':'poll_error','message':'You have already voted in this event poll.'})
            return
        p['voters'].add(player.id)
        p['votes'][selected]+=1
        p['humanVotes'][selected]+=1
        await broadcast(self.rooms,self.poll_packet())

    async def maybe_finish_poll(self):
        global CURRENT_EVENT
        p=self.poll
        if not p:return
        now=int(time.time())
        scheduled=[vote for vote in p['aiQueue'] if vote['dueAt']<=now and p['endsAt']>now]
        if scheduled:
            for vote in scheduled:
                if vote['id'] in p['aiVoters']:continue
                p['aiVoters'].add(vote['id'])
                event=vote['choice']
                p['votes'][event]+=1
                p['botVotes'][event]+=1
            p['aiQueue']=[v for v in p['aiQueue'] if v not in scheduled]
            await broadcast(self.rooms,self.poll_packet())
        if p['endsAt']>now:return
        highest=max(p['votes'].values())
        winners=[name for name in p['options'] if p['votes'][name]==highest]
        # No actual humans required: labeled bot votes can still elect a winner.
        chosen=secrets.choice(winners) if p['voters'] or p['aiVoters'] else 'none'
        if p.get('custom'):
            ai=len(p['aiVoters']);human=len(p['voters'])
            label=p['labels'].get(chosen,'') if chosen!='none' else ''
            self.poll=None
            await broadcast(self.rooms,{'type':'poll_state','active':False,'winner':chosen,'custom':True,'question':p.get('question',''),
                                       'botTotal':ai,'humanTotal':human,
                                       'message':('Poll result: "'+p.get('question','')+'" → '+label+' ('+str(human)+' human, '+str(ai)+' bot votes)') if label else 'Poll ended with no votes.'})
            return
        if chosen!='none':
            CURRENT_EVENT={'name':chosen,'endsAt':now+p['durationSeconds'],
                           'luck':p['luck']}
            await broadcast(self.rooms,{'type':'admin_event','event':CURRENT_EVENT})
        ai=len(p['aiVoters']);human=len(p['voters'])
        self.poll=None
        await broadcast(self.rooms,{'type':'poll_state','active':False,'winner':chosen,
                                   'botTotal':ai,'humanTotal':human,
                                   'message':('Global vote winner: '+chosen.replace('_',' ')
                                             +' ('+str(human)+' human, '+str(ai)+' bot votes)')
                                             if chosen!='none' else 'Poll ended with no votes.'})

    async def report(self, ws, room, player, data):
        target = data.get('messageId')
        record=next((item for item in room.chat_history if item['id']==target),None)
        if record and not limited('report:'+player.id,5,300):
            REPORTS.append({'room':room.code,'messageId':record['id'],
                            'reportedText':record['text'][:160], 'speaker':record['name'],
                            'when':int(time.time())})
            await ws.send_json({'type':'chat_notice','message':'Thanks. Your report has been sent to the game owner.'})

    async def dialogue(self, request):
        if not same_origin(request):
            raise web.HTTPForbidden()
        if limited('npc:'+str(request.remote),18,60):
            return web.json_response({'error':'This cat needs a little break. Try again soon.'},status=429)
        data=await request.json()
        msg, error=clean(data.get('message'))
        if error:
            return web.json_response({'error':error},status=400)
        npc=str(data.get('npc','Mochi'))[:22]
        quest=data.get('questStage',0)
        quest=int(quest) if type(quest) is int and 0<=quest<=16 else 0
        key=(str(request.remote),npc)
        reply=npc_reply(npc,msg,quest,self.npc_history.get(key,''))
        self.npc_history[key]=msg[:80]
        return web.json_response({'npc':npc if npc in NPCS else 'Mochi','reply':reply,
                                  'poweredBy':'Safe built-in character dialogue'},headers={'Cache-Control':'no-store'})

    async def admin(self, request):
        if not same_origin(request):
            raise web.HTTPForbidden()
        user=self.accounts.require(request,admin=True)
        if limited('admin:'+str(request.remote),25,60):
            return web.json_response({'error':'Too many requests. Try again soon.'},status=429)
        data=await request.json()
        command=data.get('action')
        if command=='event_poll':
            # The global vote is open to every online room, independent of owner location.
            valid=('fish_festival','cherry_blossom','moonlight_magic','catnip_party',
                   'starfall','treasure_rain','meteor_shower','ghost_parade',
                   'lily_bloom','glow_mushrooms','wrangler_raid','winter_snow',
                   'rainbow_day','firefly_festival','crystal_carnival','frog_festival',
                   'galaxy_gala','ghost_2_0','pumpkin_cutie','tv_glitch')
            raw=data.get('options')
            if not isinstance(raw,list) or not (2<=len(raw)<=4) or any(x not in valid for x in raw) or len(set(raw))!=len(raw):
                return web.json_response({'error':'Choose 2–4 different real Cat City events.'},status=400)
            if self.poll and self.poll['endsAt']>int(time.time()):
                return web.json_response({'error':'Another global vote is already active.'},status=409)
            duration=data.get('durationSeconds',600)
            if type(duration) is not int or not 30<=duration<=7200:duration=600
            luck=data.get('luck',1)
            if type(luck) is not int or luck not in (1,2,4,6,8,12,16,20,24):luck=1
            self.poll={'id':secrets.token_hex(6),'options':raw,
                       'endsAt':int(time.time())+90,
                       'votes':{name:0 for name in raw},
                       'humanVotes':{name:0 for name in raw},
                       'botVotes':{name:0 for name in raw},
                       'voters':set(),'aiVoters':set(),
                       'aiQueue':self._new_ai_voters(raw),
                       'durationSeconds':duration,'luck':luck}
            await broadcast(self.rooms,self.poll_packet())
            return web.json_response({'ok':True,'message':'Global event vote is open for 90 seconds.',
                                      'poll':self.poll_packet()})
        if command=='custom_poll':
            # Owner-only custom poll: any question with 2-4 choices; no event starts.
            if not user.get('owner'):
                return web.json_response({'error':'Only the owner can run custom polls.'},status=403)
            question,error=clean(data.get('question'))
            if error:
                return web.json_response({'error':'Question: '+error},status=400)
            raw=data.get('choices')
            if not isinstance(raw,list):raw=[]
            labels=[]
            for c in raw:
                if not isinstance(c,str) or not c.strip():continue
                text,err=clean(c)
                if err:return web.json_response({'error':'Choice: '+err},status=400)
                labels.append(text[:40])
            if not 2<=len(labels)<=4 or len(set(labels))!=len(labels):
                return web.json_response({'error':'Give 2–4 different choices.'},status=400)
            if self.poll and self.poll['endsAt']>int(time.time()):
                return web.json_response({'error':'Another global vote is already active.'},status=409)
            keys=['c%d'%i for i in range(len(labels))]
            self.poll={'id':secrets.token_hex(6),'options':keys,'custom':True,'question':question[:120],
                       'labels':dict(zip(keys,labels)),'endsAt':int(time.time())+90,
                       'votes':{k:0 for k in keys},'humanVotes':{k:0 for k in keys},'botVotes':{k:0 for k in keys},
                       'voters':set(),'aiVoters':set(),'aiQueue':self._new_ai_voters(keys),'durationSeconds':0,'luck':1}
            await broadcast(self.rooms,self.poll_packet())
            return web.json_response({'ok':True,'message':'Your poll is open for 90 seconds.','poll':self.poll_packet()})
        if command=='event_poll_finish':
            if not self.poll:return web.json_response({'error':'No vote to end.'},status=400)
            self.poll['endsAt']=0
            await self.maybe_finish_poll()
            return web.json_response({'ok':True,'message':'The vote has been finalised.'})
        if command=='unique_drop':
            # Exactly one eligible human in exactly one randomly chosen live room.
            candidates=[(room,player) for room in self.rooms.values()
                        for player in room.players.values() if player.ws and not player.ws.closed]
            if not candidates:
                return web.json_response({'error':'No connected players are available.'},status=409)
            room,player=secrets.choice(candidates)
            unique_id='global:'+secrets.token_hex(10)
            self.unique_issued.add(unique_id)
            variant=secrets.choice(('Eli-geode Excalibur','One-of-One Star Crown',
                                   'Ghost Monarch Armour','Impossible Crystal Blade'))
            weapon='Sword' in variant or 'Blade' in variant or 'Excalibur' in variant
            item={'id':unique_id,'name':'👑 '+variant,'rarity':'impossible',
                  'type':'weapon' if weapon else ('head' if 'Crown' in variant else 'body'),
                  'color':'#ffe89c','durability':999,'maxDurability':999,'unique':True}
            await player.ws.send_json({'type':'bot_unique_loot','item':item})
            return web.json_response({'ok':True,'message':'One unique item sent to one player in '+room.title+'.'})
        if command=='give_fish':
            amount=data.get('amount',1000)
            if type(amount) is not int or not (1<=amount<=100000):
                return web.json_response({'error':'Choose 1 to 100,000 fish coins.'},status=400)
            return web.json_response({'ok':True,'message':'Owner fish coins granted.','fish':amount})
        if command=='gear_set':
            theme=data.get('theme','Eli-geode')
            if theme not in ('Forest','Crystal','Eli-geode','Ghost','Admin'):
                return web.json_response({'error':'Unknown armour set.'},status=400)
            items=[]
            for kind,noun in (('head','Crown'),('body','Armour'),('paws','Boots'),('weapon','Blade')):
                items.append({'id':'owner:'+secrets.token_hex(8),'name':'👑 '+theme+' '+noun,
                              'rarity':'admin','type':kind,'color':'#ffb9ed' if theme=='Ghost' else '#f8db76',
                              'durability':1000,'maxDurability':1000})
            return web.json_response({'ok':True,'message':'Full armour and sword set granted.','items':items})
        if command=='give_gear':
            name=str(data.get('name','Admin Star Sword'))[:35]
            kind=data.get('gearType','weapon')
            if not re.fullmatch(r'[A-Za-z0-9 ]{3,35}',name) or kind not in ('weapon','head','body','paws'):
                return web.json_response({'error':'Choose a safe item name and gear type.'},status=400)
            item={'id':'owner:'+secrets.token_hex(8),'name':'👑 '+name,
                  'rarity':'admin','type':kind,'color':'#ff9f70',
                  'durability':1000,'maxDurability':1000}
            return web.json_response({'ok':True,'message':'Owner gear awarded to your local Backpack.','item':item})
        if command=='boss_travel':
            chapter=data.get('chapter')
            if type(chapter) is not int or chapter not in (7,11,15,19,99):
                return web.json_response({'error':'Choose one of the three Birman bosses.'},status=400)
            return web.json_response({'ok':True,'message':'Owner boss travel granted.','chapter':chapter})
        if command == 'admin_abuse':
            enabled=data.get('enabled') is True
            now=int(time.time())
            if enabled:
                self.stage={'active':True,'id':secrets.token_hex(5),
                            'x':480.0,'y':280.0,'cat':int(data.get('cat',0)) if type(data.get('cat',0)) is int and data.get('cat',0) in (0,1,2) else 0,
                            'lastUpdate':now,'present':False,'startedAt':now,
                            # Playtester Admin Abuse: Playtester lucky blocks can spawn.
                            'playtester':data.get('playtester') is True,
                            # Birman Takeover: after 3 owner announcements the Birman Family take over.
                            'takeover':{'phase':'armed' if data.get('takeover') is True else 'none','count':0,'at':0}}
            else:
                self.stage={'active':False,'id':'','x':480.0,'y':280.0,'cat':0,'lastUpdate':now,'present':False,'playtester':False,
                            'takeover':{'phase':'none','count':0,'at':0}}
                self._clear_takeover_announcement()
            await broadcast(self.rooms,{'type':'admin_stage','stage':self.stage})
            live_msg=('🎭 Birman Takeover armed — it looks like a normal Admin Abuse. Send 3 global announcements and the Birmans take over!' if self.stage['takeover']['phase']=='armed'
                      else '🧪 Playtester Admin Abuse is LIVE — Playtester lucky blocks can spawn!' if self.stage.get('playtester') else '👑 Admin Abuse is LIVE globally!')
            return web.json_response({'ok':True,'message':(live_msg if enabled else 'Admin Abuse ended.'),'stage':self.stage})
        scope=data.get('scope', 'global')
        if scope not in ('global', 'server'):
            return web.json_response({'error':'Choose Global or This Server.'},status=400)
        room=None
        if scope=='server':
            code=str(data.get('roomCode','')).strip().upper()
            room=self.rooms.get(code)
            if room is None:
                return web.json_response({'error':'Join a server before using server-only owner tools.'},status=400)
        targets=self.rooms if room is None else {room.code: room}
        if command=='announce':
            message, error=clean(data.get('message'))
            if error:
                return web.json_response({'error':error},status=400)
            global LATEST_ANNOUNCEMENT
            packet={'id':secrets.token_hex(6),'text':message,'at':int(time.time())}
            if room is None:
                LATEST_ANNOUNCEMENT=packet
            else:
                room.admin_announcement=packet
            takeover=self.stage.get('takeover') or {}
            if room is None and self.stage.get('active') and takeover.get('phase')=='armed':
                # Birman Takeover: the owner's messages show with their username.
                name=str(user.get('username') or 'Owner')[:24] if isinstance(user,dict) else 'Owner'
                packet.update({'by':name})
                takeover['count']=int(takeover.get('count',0))+1
                await broadcast(targets,{'type':'announcement','text':message,'by':name,'id':packet['id']})
                if takeover['count']>=3:
                    takeover['phase']='starting'
                    asyncio.create_task(self._birman_takeover(name))
                    return web.json_response({'ok':True,'message':'Announcement 3/3 sent… here we go! 🎭'})
                return web.json_response({'ok':True,'message':'Announcement %d/3 sent with your username.'%takeover['count']})
            await broadcast(targets,{'type':'announcement','text':message,'by':'Cat City Admin','id':packet['id']})
            return web.json_response({'ok':True,'id':packet['id'],'message':'Announcement sent to '+('every online room.' if room is None else 'this server only.')})
        if command=='time':
            global TIME_MODE
            value=data.get('value')
            if value not in ('auto','day','sunset','night'):
                return web.json_response({'error':'Choose auto, day, sunset or night.'},status=400)
            if room is None:
                TIME_MODE=value
            else:
                room.admin_time_mode=value
            await broadcast(targets,{'type':'admin_time','timeMode':value})
            return web.json_response({'ok':True,'timeMode':value,'scope':scope})
        if command=='event':
            global CURRENT_EVENT
            name=data.get('value')
            if name not in ('none','fish_festival','cherry_blossom','moonlight_magic','catnip_party','starfall','treasure_rain','meteor_shower','ghost_parade','lily_bloom','glow_mushrooms','wrangler_raid','winter_snow','rainbow_day','firefly_festival','crystal_carnival','frog_festival','galaxy_gala','ghost_2_0','pumpkin_cutie','tv_glitch'):
                return web.json_response({'error':'Unknown event.'},status=400)
            duration=data.get('durationSeconds',600)
            duration=max(30,min(7200,duration)) if type(duration) is int else 600
            multiplier=data.get('luck',1)
            multiplier=multiplier if type(multiplier) is int and multiplier in (1,2,4,6,8,12,16,20,24) else 1
            packet={'name':name, 'endsAt':int(time.time())+(duration if name!='none' else 0), 'luck':multiplier if name!='none' else 1}
            if room is None:
                CURRENT_EVENT=packet
            else:
                room.admin_event=packet
            await broadcast(targets,{'type':'admin_event','event':packet})
            return web.json_response({'ok':True,'event':packet,'scope':scope})
        if command=='spawn':
            name=str(data.get('name','Nova')).strip()[:20]
            if not re.fullmatch(r'[A-Za-z0-9 ]{2,20}',name):
                return web.json_response({'error':'Use a short friendly NPC name.'},status=400)
            npc={'id':secrets.token_hex(5),'name':name,'x':544+secrets.randbelow(180)-90,
                 'y':576+secrets.randbelow(130)-65}
            if room is None:
                self.npcs=(self.npcs+[npc])[-10:]
            else:
                room.admin_npcs=(getattr(room,'admin_npcs',[])+[npc])[-8:]
            for target in targets.values():
                await broadcast({target.code:target},{'type':'admin_npc','npcs':self.npcs+getattr(target,'admin_npcs',[])})
            return web.json_response({'ok':True,'scope':scope,'npcs':self.npcs+getattr(room,'admin_npcs',[]) if room else self.npcs})
        if command=='reports':
            return web.json_response({'ok':True,'reports':list(REPORTS)[-30:]})
        if command=='clear_npcs':
            if room is None:
                self.npcs=[]
            else:
                room.admin_npcs=[]
            for target in targets.values():
                await broadcast({target.code:target},{'type':'admin_npc','npcs':self.npcs+getattr(target,'admin_npcs',[])})
            return web.json_response({'ok':True,'scope':scope})
        return web.json_response({'error':'Unknown admin action.'},status=400)

    async def _birman_takeover(self, owner_name):
        """The Birman Takeover sequence, after the owner's third announcement."""
        global LATEST_ANNOUNCEMENT
        stage_id=self.stage.get('id')
        await asyncio.sleep(3)
        if self.stage.get('id')!=stage_id or not self.stage.get('active'):
            return
        cut={'id':secrets.token_hex(6),'text':'Here we go…','by':owner_name,'cut':True,'at':int(time.time())}
        LATEST_ANNOUNCEMENT=cut
        await broadcast(self.rooms,{'type':'announcement',**cut})
        await asyncio.sleep(2.2)
        if self.stage.get('id')!=stage_id or not self.stage.get('active'):
            return
        now=int(time.time())
        self.stage['takeover']={'phase':'taken','count':3,'at':now}
        packet={'id':secrets.token_hex(6),'by':'The Birman Family','glitch':True,'at':now,
                'text':'Hello, everyone. We have taken over your game, and we are here to make as much terror as possible.'}
        LATEST_ANNOUNCEMENT=packet
        await broadcast(self.rooms,{'type':'announcement',**packet})
        await broadcast(self.rooms,{'type':'admin_stage','stage':self.stage})

    async def stage_position(self, request):
        if not same_origin(request):
            raise web.HTTPForbidden()
        self.accounts.require(request,admin=True)
        if not self.stage.get('active'):
            return web.json_response({'error':'The global stage event has ended.'},status=409)
        now=time.monotonic()
        data=await request.json()
        if data.get('leaving') is True:
            self.stage['present']=False
            await broadcast(self.rooms,{'type':'admin_stage_position','stage':self.stage})
            return web.json_response({'ok':True})
        if now-self.stage_last<.09:
            return web.json_response({'ok':True,'throttled':True})
        x,y=data.get('x'),data.get('y')
        if type(x) not in (int,float) or type(y) not in (int,float) or not math.isfinite(x) or not math.isfinite(y):
            return web.json_response({'error':'Invalid stage position'},status=400)
        self.stage['x']=round(max(42.0,min(918.0,float(x))),1)
        self.stage['y']=round(max(92.0,min(510.0,float(y))),1)
        cat=data.get('cat')
        if type(cat) is int and cat in (0,1,2):
            self.stage['cat']=cat
        self.stage['lastUpdate']=int(time.time())
        self.stage['present']=True
        self.stage_last=now
        await broadcast(self.rooms,{'type':'admin_stage_position','stage':self.stage})
        return web.json_response({'ok':True})

    ADMIN_ABUSE_MAX_SECONDS = 3 * 3600

    def _clear_takeover_announcement(self):
        global LATEST_ANNOUNCEMENT
        if LATEST_ANNOUNCEMENT and (LATEST_ANNOUNCEMENT.get('glitch') or LATEST_ANNOUNCEMENT.get('cut') or LATEST_ANNOUNCEMENT.get('by') not in (None, 'Cat City Admin')):
            LATEST_ANNOUNCEMENT = None

    async def expire_stage(self):
        """Admin Abuse switches itself off after 3 hours if the owner forgets to end it."""
        started = self.stage.get('startedAt') or self.stage.get('lastUpdate') or 0
        if self.stage.get('active') and time.time() - started > self.ADMIN_ABUSE_MAX_SECONDS:
            self.stage = {'active': False, 'id': '', 'x': 480.0, 'y': 280.0, 'cat': 0, 'lastUpdate': int(time.time()), 'present': False,
                          'playtester': False, 'takeover': {'phase': 'none', 'count': 0, 'at': 0}}
            self._clear_takeover_announcement()
            await broadcast(self.rooms, {'type': 'admin_stage', 'stage': self.stage})

    async def world_state(self, _request):
        await self.expire_stage()
        return web.json_response({'timeMode':TIME_MODE,'event':CURRENT_EVENT,
                                  'npcs':self.npcs,'announcement':LATEST_ANNOUNCEMENT,'stage':self.stage},headers={'Cache-Control':'no-store'})

    def routes(self, app):
        app.router.add_post('/api/npc/chat',self.dialogue)
        app.router.add_post('/api/admin/action',self.admin)
        app.router.add_post('/api/admin/stage/position',self.stage_position)
        app.router.add_get('/api/world-state',self.world_state)
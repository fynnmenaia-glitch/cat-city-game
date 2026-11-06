"""Autonomous, server-controlled Cat City companions.

AI workers do not chat or use microphones. They actually traverse mining-node
positions, swing tools, harvest resources and leave claimable material drops.
No paid AI API, credentials, or persistent database changes are involved.
"""
from __future__ import annotations
import math
import os
import secrets
import time

CHUNK=32*24
TASKS=((-2,0),(-1,1),(1,-1),(2,1),(0,2),(-2,-1),(2,-2),(-1,-2),
       (1,2),(-3,0),(3,1),(0,-2),(-2,2),(3,-1))
MAX_DROPS=22
VALID_ACTIVITIES=('explore','gather','chop','mine','loot','quest','fight','tag','rest')
def h(a,b,k=0):
    n=math.sin(a*127.1+b*311.7+k*53.17)*43758.5453
    return n-math.floor(n)

DEMO=os.environ.get('CATCITY_DEMO')=='1'

def biome(cx,cy):
    if cx==0 and cy==0:return 'town'
    n=h(cx,cy)
    if DEMO:
        # The demo world only has four biomes (same rule as tools/build_demo.py).
        return 'cherry' if n<.25 else 'poison' if n>.75 else 'marsh' if n<.5 else 'moonstone'
    if cx<0 and -1<=cy<=1:return 'wild'
    return 'cherry' if n<.17 else 'poison' if n>.82 else 'marsh' if n<.32 else 'moonstone' if n>.66 else 'wild'

def target_node(cx,cy):
    """Same node coordinate/biome calculation as client/adventure-mining.js."""
    area=biome(cx,cy)
    x=cx*CHUNK+(6+h(cx,cy,57)*12)*32
    y=cy*CHUNK+(6+h(cx,cy,63)*12)*32
    is_tree=area in ('wild','cherry','marsh')
    material=('wood' if is_tree else
      ('eligeode' if h(cx,cy,51)<.003 else 'amethyst' if h(cx,cy,52)<.23 else 'crystal')
      if area=='moonstone' else 'stone')
    return {'x':x,'y':y,'cx':cx,'cy':cy,'id':f'mine:{cx}:{cy}',
            'material':material,'job':'chop' if is_tree else 'mine','biome':area}

def choose_work(room,bot,index,player=None):
    """Prefer resources in the user's biome, or an unharvested nearby node."""
    sequence=TASKS
    start=(int(bot.get('route',0))+index*3)%len(sequence)
    if player and player.activity in ('chop','mine','gather'):
        cx=math.floor(player.x/CHUNK)
        cy=math.floor(player.y/CHUNK)
        # Help nearby without trying to take the precise tile the human uses.
        options=((cx-1,cy),(cx+1,cy),(cx,cy+1),(cx,cy-1))
        for x,y in options:
            if (x,y)!=(0,0) and f'mine:{x}:{y}' not in room.bot_harvested:
                return target_node(x,y)
    for n in range(len(sequence)):
        cx,cy=sequence[(start+n)%len(sequence)]
        target=target_node(cx,cy)
        if target['id'] not in room.bot_harvested:
            bot['route']=(start+n+1)%len(sequence)
            return target
    # World naturally replenishes after the finite route finishes; limit memory.
    room.bot_harvested.clear()
    cx,cy=sequence[start]
    bot['route']=(start+1)%len(sequence)
    return target_node(cx,cy)

def nearest_player(room,bot):
    people=[p for p in room.players.values() if p.ws is not None and not p.ws.closed
            and not p.in_boss and not p.cave_id]
    if not people:return None
    return min(people,key=lambda p:(p.x-bot['x'])**2+(p.y-bot['y'])**2)

def tick_workers(room,seconds,now=None):
    if not getattr(room,'ai_room',False):return False
    now=time.monotonic() if now is None else now
    if not room.players:return False
    changed=False
    for i,bot in enumerate(room.bots):
        bot.setdefault('route',i*3)
        bot.setdefault('job','explore')
        bot.setdefault('activity','travelling')
        bot.setdefault('target',None)
        bot.setdefault('workingUntil',0.)
        bot.setdefault('carried',{})
        human=nearest_player(room,bot)
        target=bot.get('target')
        if not isinstance(target,dict):
            target=choose_work(room,bot,i,human)
            bot['target']=target
        # Follow the player's purpose without permanently camping beside them.
        # Helpers still venture out to independently harvest nodes.
        if human and human.quest_started and i==0 and (int(now)//16)%3==0:
            goal_x=human.x-62
            goal_y=human.y+38
            bot['questHelping']=True
            bot['activity']='helping player quest'
            bot['job']='support'
        else:
            bot['questHelping']=False
            goal_x=target['x']
            goal_y=target['y']
            bot['job']=target['job']
            bot['activity']='chopping wood' if target['job']=='chop' else 'mining ore'
        dx=goal_x-bot['x']
        dy=goal_y-bot['y']
        dist=math.hypot(dx,dy)
        if dist>34:
            speed=215 if bot['questHelping'] else 184
            step=min(dist-28,speed*max(.02,min(seconds,.5)))
            if dist>0:
                bot['x']+=dx/dist*step
                bot['y']+=dy/dist*step
            bot['swing']=0
            changed=True
            continue
        if bot['questHelping']:
            bot['swing']=0
            continue
        if target['id'] in room.bot_harvested:
            bot['target']=choose_work(room,bot,i,human)
            bot['workingAt']=None
            bot['swing']=0
            continue
        if bot.get('workingAt')!=target['id']:
            # Spend time actually chopping/mining; only reward when complete.
            bot['workingAt']=target['id']
            bot['workingUntil']=now+2.4
            bot['swing']=1
            bot['activity']='chopping wood' if target['job']=='chop' else 'mining '+target['material']
            changed=True
            continue
        if now<bot['workingUntil']:
            bot['swing']=1
            changed=True
            continue
        room.bot_harvested.add(target['id'])
        material=target['material']
        amount=1+(1 if h(target['cx'],target['cy'],44)>.67 else 0)
        bot['carried'][material]=bot['carried'].get(material,0)+amount
        room.bot_drops.append({'id':secrets.token_hex(6),'x':round(bot['x'],1),
                  'y':round(bot['y'],1),'material':material,'amount':amount,
                  'by':bot['name'],'time':int(time.time())})
        if len(room.bot_drops)>MAX_DROPS:
            del room.bot_drops[:-MAX_DROPS]
        bot['target']=None
        bot['workingAt']=None
        bot['swing']=0
        bot['activity']='found '+material
        bot['lastHarvest']=target['id']
        changed=True
    return changed

def collect_bot_drop(room,player,identifier):
    if not getattr(room,'ai_room',False) or not isinstance(identifier,str) or len(identifier)>32:
        return None
    for drop in list(room.bot_drops):
        if drop['id']!=identifier:continue
        if player.in_boss or player.cave_id or math.hypot(player.x-drop['x'],player.y-drop['y'])>85:
            return None
        room.bot_drops.remove(drop)
        return {'type':'bot_loot','id':identifier,'material':drop['material'],
                'amount':drop['amount'],'by':drop['by']}
    return None

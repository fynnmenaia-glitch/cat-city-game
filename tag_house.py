"""Authoritative, five-player Tag House mini-game for Cat City Online.

Shared, deterministic maze. Server controls tag transfers, sparse power-ups,
shield windows, boost pads and the three-minute scoring round.
"""
import math
import random
import secrets
import time
from aiohttp import web
from collections import deque

COLS, ROWS, TILE = 93, 69, 32
WIDTH, HEIGHT = COLS * TILE, ROWS * TILE
ROUND_SECONDS = 180
SPEED = 190.0
SPRINT_SPEED = 235.0
BOOST_SPEED = 300.0


def make_maze():
    rng = random.Random(314159)
    grid = [['1'] * COLS for _ in range(ROWS)]
    nx, ny = 30, 22
    def carve_cell(ix, iy):
        x, y = 2 + ix * 3, 2 + iy * 3
        for yy in (y, y+1):
            for xx in (x, x+1):
                grid[yy][xx] = '0'
    for iy in range(ny):
        for ix in range(nx):
            carve_cell(ix, iy)
    seen = {(15, 20)}
    stack = [(15, 20)]
    while stack:
        x, y = stack[-1]
        choices = [(x+dx, y+dy, dx, dy) for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))
                   if 0 <= x+dx < nx and 0 <= y+dy < ny and (x+dx,y+dy) not in seen]
        if not choices:
            stack.pop()
            continue
        ax, ay, dx, dy = rng.choice(choices)
        base_x, base_y = 2 + x*3, 2 + y*3
        if dx == 1:
            for z in (0, 1): grid[base_y+z][base_x+2] = '0'
        elif dx == -1:
            for z in (0, 1): grid[base_y+z][base_x-1] = '0'
        elif dy == 1:
            for z in (0, 1): grid[base_y+2][base_x+z] = '0'
        else:
            for z in (0, 1): grid[base_y-1][base_x+z] = '0'
        seen.add((ax, ay)); stack.append((ax, ay))
    # Extra routes let players loop and dodge rather than only face dead ends.
    for iy in range(1, ny-1):
        for ix in range(1, nx-1):
            x, y = 2 + ix*3, 2 + iy*3
            if rng.random() < .24:
                if rng.random() < .5:
                    for z in (0, 1): grid[y+z][x+2] = '0'
                else:
                    for z in (0, 1): grid[y+2][x+z] = '0'
    # Cheerful open party areas, and a big central lobby near the spawn.
    centers = [(15,20,4,3),(5,5,3,3),(23,7,3,3),(10,12,3,3),
               (22,17,4,3),(4,17,3,3),(17,4,3,3),(15,12,3,3),(25,13,3,3)]
    for ix, iy, rw, rh in centers:
        cx, cy = 2+3*ix, 2+3*iy
        for y in range(max(1,cy-rh), min(ROWS-1,cy+rh+1)):
            for x in range(max(1,cx-rw), min(COLS-1,cx+rw+1)):
                grid[y][x] = '0'
    return [''.join(r) for r in grid]

MAZE = make_maze()
WALKABLE = [(x*TILE + TILE/2, y*TILE + TILE/2) for y in range(2,ROWS-2)
            for x in range(2,COLS-2) if MAZE[y][x] == '0']
_rng = random.Random(77770)
PADS = []
for px, py in _rng.sample(WALKABLE, len(WALKABLE)):
    if all(math.hypot(px-p['x'],py-p['y'])>470 for p in PADS) and math.hypot(px-1460,py-1960)>220:
        PADS.append({'x':px,'y':py})
    if len(PADS)>=11: break
SPAWNS = [(1464.0, 1952.0), (1532.0, 1952.0), (1496.0, 2005.0)]
for sx,sy in ((1400.,1950.),(1590.,2030.)):
    # Derive legal walkable starts, keeping everybody separated.
    eligible=[p for p in WALKABLE if all(math.hypot(p[0]-x,p[1]-y)>49 for x,y in SPAWNS)]
    SPAWNS.append(min(eligible,key=lambda p:math.hypot(p[0]-sx,p[1]-sy)))
# Sixth distinct walkable start supports every playable role, even in five-human rooms.
_sixth=[p for p in WALKABLE if all(math.hypot(p[0]-x,p[1]-y)>49 for x,y in SPAWNS)]
SPAWNS.append(min(_sixth,key=lambda p:math.hypot(p[0]-1660,p[1]-1900)))


def floor_at(x, y, radius=10):
    for px, py in ((x-radius,y-radius),(x+radius,y-radius),
                   (x-radius,y+radius),(x+radius,y+radius)):
        cx, cy = int(px // TILE), int(py // TILE)
        if not (0<=cx<COLS and 0<=cy<ROWS and MAZE[cy][cx]=='0'):
            return False
    return True



# Tag House V3: authoritative online bots, freeze tag, roulette, timed matches.
OPTIONS=(60,120,180,300,600)
SPIN_SECONDS=4.6
BOT_SPEED=168.0


def new_room():
    return dict(players={}, bots={}, active=False, phase='idle', mode='normal',
                itId=None, itCat=None, scores={str(i):0 for i in range(6)},
                endsAt=0.0, spinUntil=0.0, duration=180,
                started=0.0, lastTag=0.0, pickups=[],nextSpawn=0.0,
                round=0,lastWinner='',updated=time.monotonic())


def make_person(cat, now, bot=False):
    x,y=SPAWNS[cat]
    return dict(cat=cat, inside=True,x=x,y=y,frozen=False,boostUntil=0.,
                shieldUntil=now+2,lastMove=now,padCooldown=0.,bot=bot,
                repath=0., path=[],waypoint=0,targetX=x,targetY=y)


class TagHouse:
    def __init__(self):
        self.rooms={}
        self.rng=random.SystemRandom()

    def room(self,code):return self.rooms.setdefault(code,new_room())
    def clear(self,code):self.rooms.pop(code,None)
    def map_payload(self):
        return {'cols':COLS,'rows':ROWS,'tile':TILE,'maze':MAZE,'pads':PADS,
                'spawns':SPAWNS,'roundSeconds':ROUND_SECONDS}

    @staticmethod
    def present_humans(room,tag):
        return [(p,tag['players'][p.id]) for p in room.players.values()
                if p.ws is not None and not p.ws.closed
                and tag['players'].get(p.id,{}).get('inside')]

    def participants(self,room,tag):
        return [(p.id,v,p.cat,False) for p,v in self.present_humans(room,tag)] + [
            (bid,v,v['cat'],True) for bid,v in tag['bots'].items()]

    def sync_bots(self,room,tag,now):
        occupied={p.cat for p,v in self.present_humans(room,tag)}
        if not occupied:
            if tag['bots']:
                tag['bots'].clear()
            return
        # Keep five total room participants while allowing SIX possible character roles.
        desired=[cat for cat in range(6) if cat not in occupied][:max(0,5-len(occupied))]
        for cat in range(6):
            bid=f'bot-{cat}'
            if cat in occupied or cat not in desired:
                if bid in tag['bots']:
                    if tag['itId']==bid:
                        replacement=next((p.id for p,v in self.present_humans(room,tag) if p.cat==cat),None)
                        tag['itId']=replacement
                    del tag['bots'][bid]
            elif bid not in tag['bots']:
                tag['bots'][bid]=make_person(cat,now,True)
                if tag['itCat']==cat and tag['phase'] in ('roulette','play'):
                    tag['itId']=bid
        valid={pid for pid,_,_,_ in self.participants(room,tag)}
        if tag['itId'] not in valid and tag['phase'] in ('roulette','play'):
            roster=self.participants(room,tag)
            if roster:
                first=next((p for p in roster if p[2]==tag['itCat']),roster[0])
                tag['itId']=first[0];tag['itCat']=first[2]

    def snapshot(self,room):
        tag=self.room(room.code);now=time.monotonic()
        self.sync_bots(room,tag,now)
        players=[]
        for pid,p,cat,bot in self.participants(room,tag):
            players.append({'id':pid,'cat':cat,'bot':bot,'online':True,
                            'inHouse':True,'x':round(p['x'],1),'y':round(p['y'],1),
                            'boost':round(max(0,p['boostUntil']-now),1),
                            'shield':round(max(0,p['shieldUntil']-now),1),
                            'frozen':bool(p['frozen'])})
        return {'active':tag['active'],'phase':tag['phase'],
                'mode':tag['mode'],'itId':tag['itId'],'itCat':tag['itCat'],
                'players':players,'scores':dict(tag['scores']),
                'duration':tag['duration'],
                'remaining':int(max(0,(tag['endsAt'] if tag['active'] else (now+tag['duration']))-now)) if tag['active'] else tag['duration'],
                'spinRemaining':round(max(0,tag['spinUntil']-now),2) if tag['phase']=='roulette' else 0,
                'pickups':list(tag['pickups']),'round':tag['round'],'winner':tag['lastWinner']}

    def create_pickup(self,tag):
        positions=[(p['x'],p['y']) for p in tag['pickups']]
        positions += [(p['x'],p['y']) for p in [*tag['players'].values(),*tag['bots'].values()] if p['inside']]
        for _ in range(50):
            x,y=self.rng.choice(WALKABLE)
            if all(math.hypot(x-xx,y-yy)>260 for xx,yy in positions):
                kind=self.rng.choices(['rocket','bubble','fish'],[5,3,2])[0]
                tag['pickups'].append({'id':secrets.token_hex(3),'kind':kind,'x':x,'y':y})
                return True
        return False

    @staticmethod
    def _clear_path(x1,y1,x2,y2):
        dist=math.hypot(x2-x1,y2-y1)
        count=max(1,int(math.ceil(dist/8)))
        return all(floor_at(x1+(x2-x1)*k/count,y1+(y2-y1)*k/count) for k in range(1,count+1))

    def _move(self,p,reqx,reqy,now,allow_sprint=False):
        dt=max(.03,min(.45,now-p['lastMove']))
        spd=BOOST_SPEED if p['boostUntil']>now else (SPRINT_SPEED if allow_sprint else SPEED)
        dx=reqx-p['x'];dy=reqy-p['y'];dist=math.hypot(dx,dy)
        max_step=spd*dt+15
        if dist>max_step and dist>0:
            reqx=p['x']+dx/dist*max_step;reqy=p['y']+dy/dist*max_step
        if floor_at(reqx,reqy) and self._clear_path(p['x'],p['y'],reqx,reqy):
            p['x'],p['y']=reqx,reqy
        else:
            if floor_at(reqx,p['y']) and self._clear_path(p['x'],p['y'],reqx,p['y']):p['x']=reqx
            if floor_at(p['x'],reqy) and self._clear_path(p['x'],p['y'],p['x'],reqy):p['y']=reqy
        p['lastMove']=now

    def _rewards(self,tag,p,now):
        for pad in PADS:
            if now>p['padCooldown'] and math.hypot(p['x']-pad['x'],p['y']-pad['y'])<24:
                p['boostUntil']=max(p['boostUntil'],now+3.2);p['padCooldown']=now+5;break
        for pickup in list(tag['pickups']):
            if math.hypot(p['x']-pickup['x'],p['y']-pickup['y'])<24:
                tag['pickups'].remove(pickup)
                if pickup['kind']=='rocket':p['boostUntil']=max(p['boostUntil'],now+6)
                elif pickup['kind']=='bubble':p['shieldUntil']=max(p['shieldUntil'],now+6)
                else:
                    choices=[(x,y) for x,y in self.rng.sample(WALKABLE,min(90,len(WALKABLE)))
                             if math.hypot(x-p['x'],y-p['y'])>450 and floor_at(x,y)]
                    if choices:p['x'],p['y']=choices[0]

    def handle(self,room,player,action,data):
        tag=self.room(room.code);now=time.monotonic()
        if action=='tag_enter':
            if tag['players'].get(player.id,{}).get('inside'):return False
            tag['players'][player.id]=make_person(player.cat,now)
            self.sync_bots(room,tag,now);tag['updated']=now
            return True
        if action=='tag_leave':
            tag['players'].pop(player.id,None)
            self.sync_bots(room,tag,now)
            if not self.present_humans(room,tag):
                tag['phase']='idle';tag['active']=False;tag['itId']=None;tag['itCat']=None
            tag['updated']=now
            return True
        if action=='tag_start':
            p=tag['players'].get(player.id)
            if not p or not p['inside'] or tag['phase'] in ('roulette','play'):return False
            self.sync_bots(room,tag,now)
            roster=self.participants(room,tag)
            if len(roster)!=5:return False
            mode=data.get('mode','normal')
            if mode not in ('normal','freeze'):return False
            duration=data.get('duration',180)
            if type(duration) is not int or duration not in OPTIONS:return False
            itid,_,itcat,_=self.rng.choice(roster)
            tag.update(active=False,phase='roulette',mode=mode,itId=itid,itCat=itcat,
                       duration=duration, scores={str(i):0 for i in range(6)},
                       endsAt=0.,spinUntil=now+SPIN_SECONDS,started=0.,lastTag=now,
                       pickups=[],nextSpawn=now+8,round=tag['round']+1,lastWinner='')
            for _,q,_,_ in roster:
                q['frozen']=False;q['shieldUntil']=0.;q['boostUntil']=0.
            tag['updated']=now
            return True
        if action=='tag_stop':
            if tag['phase']=='idle':return False
            tag['phase']='idle';tag['active']=False;tag['itId']=None;tag['itCat']=None
            tag['lastWinner']='Round ended';tag['updated']=now
            return True
        if action != 'tag_move':return False
        p=tag['players'].get(player.id)
        if not p or not p['inside']:return False
        x,y=data.get('x'),data.get('y')
        if type(x) not in (float,int) or type(y) not in (float,int) or not (math.isfinite(x) and math.isfinite(y)):
            return False
        if p['frozen']:
            p['lastMove']=now
        else:
            self._move(p,float(x),float(y),now,data.get('sprint') is True)
            self._rewards(tag,p,now)
        tag['updated']=now
        return True

    @staticmethod
    def _cell(x,y):return int(x//TILE),int(y//TILE)

    def _path(self,start,goal):
        """Four-way corridor navigation; bots never cross walls."""
        st=self._cell(*start);dest=self._cell(*goal)
        if st==dest:return [goal]
        if not(0<=st[0]<COLS and 0<=st[1]<ROWS and 0<=dest[0]<COLS and 0<=dest[1]<ROWS):return []
        if MAZE[st[1]][st[0]]!='0' or MAZE[dest[1]][dest[0]]!='0':return []
        todo=deque([st]);previous={st:None}
        while todo:
            cx,cy=todo.popleft()
            if (cx,cy)==dest:break
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx,ny=cx+dx,cy+dy
                if 0<=nx<COLS and 0<=ny<ROWS and MAZE[ny][nx]=='0' and (nx,ny) not in previous:
                    previous[(nx,ny)]=(cx,cy);todo.append((nx,ny))
        if dest not in previous:return []
        path=[];cur=dest
        while cur!=st:
            path.append(((cur[0]+.5)*TILE,(cur[1]+.5)*TILE));cur=previous[cur]
        path.reverse();return path

    def _bot_strategy(self,room,tag,bid,bot,now):
        roster=self.participants(room,tag)
        if tag['phase']!='play' or bot['frozen']:return
        it=tag['itId']==bid
        targets=[(pid,p) for pid,p,_,_ in roster if pid!=bid and not p['frozen']]
        if it:
            if not targets:return
            target=min(targets,key=lambda v:math.hypot(v[1]['x']-bot['x'],v[1]['y']-bot['y']))[1]
            tx,ty=target['x'],target['y']
        elif tag['mode']=='freeze' and any(p['frozen'] for pid,p,_,_ in roster if pid!=tag['itId'] and pid!=bid):
            rescue=[p for pid,p,_,_ in roster if p['frozen'] and pid!=tag['itId']]
            target=min(rescue,key=lambda p:math.hypot(p['x']-bot['x'],p['y']-bot['y']))
            tx,ty=target['x'],target['y']
        else:
            hunter=next((p for pid,p,_,_ in roster if pid==tag['itId']),None)
            if hunter is None:return
            # Seek distant reachable escape loops, favouring distance from hunter.
            candidates=self.rng.sample(WALKABLE,min(48,len(WALKABLE)))
            candidates=[q for q in candidates if math.hypot(q[0]-bot['x'],q[1]-bot['y'])<850]
            if not candidates:return
            tx,ty=max(candidates,key=lambda q:math.hypot(q[0]-hunter['x'],q[1]-hunter['y'])-math.hypot(q[0]-bot['x'],q[1]-bot['y'])*.22)
        if now>=bot['repath'] or not bot['path']:
            bot['path']=self._path((bot['x'],bot['y']),(tx,ty))
            bot['repath']=now+self.rng.uniform(.45,.80)
        if not bot['path']:return
        node=bot['path'][0];d=math.hypot(node[0]-bot['x'],node[1]-bot['y'])
        if d<9:
            bot['path'].pop(0)
            if not bot['path']:return
            node=bot['path'][0];d=math.hypot(node[0]-bot['x'],node[1]-bot['y'])
        speed=BOOST_SPEED if bot['boostUntil']>now else BOT_SPEED+(8 if it else 0)
        dt=max(.04,min(.28,now-bot['lastMove']))
        step=min(speed*dt,d)
        if d>0:
            self._move(bot,bot['x']+(node[0]-bot['x'])*step/d,bot['y']+(node[1]-bot['y'])*step/d,now)
        self._rewards(tag,bot,now)

    def tick(self,room,now):
        tag=self.rooms.get(room.code)
        if not tag:return False
        changed=False
        for player in room.players.values():
            if player.ws is None or player.ws.closed:
                if tag['players'].pop(player.id,None):changed=True
        present_ids={player.id for player in room.players.values()}
        for pid in list(tag['players']):
            if pid not in present_ids:tag['players'].pop(pid,None);changed=True
        prev_bot_ids=set(tag['bots'])
        self.sync_bots(room,tag,now)
        if set(tag['bots'])!=prev_bot_ids:changed=True
        if not self.present_humans(room,tag):
            if tag['phase']!='idle':tag['phase']='idle';tag['active']=False;changed=True
            return changed
        roster=self.participants(room,tag)
        if tag['phase']=='roulette' and now>=tag['spinUntil']:
            tag['phase']='play';tag['active']=True;tag['started']=now;tag['endsAt']=now+tag['duration']
            tag['lastTag']=now;changed=True
            for pid,p,_,_ in roster:p['shieldUntil']=now+1.7
        if tag['phase']!='play':return changed
        if now>=tag['endsAt']:
            tag['phase']='idle';tag['active']=False
            if tag['mode']=='freeze':
                tag['lastWinner']='Runners win! They survived!'
            else:
                score=max(tag['scores'].values());winners=[['Astro','Galaxy','Baby','Harley','Skylar','Pumpkin'][i] for i in range(6) if tag['scores'][str(i)]==score]
                tag['lastWinner']=' / '.join(winners)+' win!' if score else 'Everybody wins!'
            return True
        # Navigate exactly one server-owned cat per empty player slot.
        for bid,p in tag['bots'].items():self._bot_strategy(room,tag,bid,p,now)
        # Freeze rescue: a free runner reaches a teammate.
        if tag['mode']=='freeze':
            frozen=[(pid,p) for pid,p,_,_ in roster if p['frozen']]
            for fid,target in frozen:
                if any(pid not in (tag['itId'],fid) and not ally['frozen'] and
                       math.hypot(ally['x']-target['x'],ally['y']-target['y'])<=27
                       for pid,ally,_,_ in roster):
                    target['frozen']=False;target['shieldUntil']=now+2.0;changed=True
        if now-tag['lastTag']>1.45:
            hunter=next(((pid,p,cat) for pid,p,cat,_ in roster if pid==tag['itId']),None)
            if hunter:
                hid,h,hcat=hunter
                for pid,p,cat,_ in roster:
                    if pid==hid or p['frozen'] or p['shieldUntil']>now:continue
                    if math.hypot(h['x']-p['x'],h['y']-p['y'])<=26:
                        tag['scores'][str(hcat)]+=1;tag['lastTag']=now
                        if tag['mode']=='freeze':
                            p['frozen']=True
                            if len([q for ppid,q,_,_ in roster if ppid!=hid and q['frozen']])==len(roster)-1:
                                tag['phase']='idle';tag['active']=False;tag['lastWinner']='Tagger wins! All cats frozen!'
                        else:
                            tag['itId']=pid;tag['itCat']=cat;p['shieldUntil']=now+1.4
                        changed=True;break
        if len(tag['pickups'])<3 and now>=tag['nextSpawn']:
            changed|=self.create_pickup(tag)
            tag['nextSpawn']=now+self.rng.uniform(10,16)
        return changed or bool(tag['bots'])

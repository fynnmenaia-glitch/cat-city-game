/* Cat City — 🚕 Taxi stops + "The Long Way Home" (Birman Castle escape).
 *
 * TAXI STOPS: a yellow taxi waits in about half of the wild chunks (every
 * biome outside the village). Walk up, press E / 🐾 and ride straight home.
 * Each ride has a 25% chance of starting the story mission instead (until
 * the mission is finished).
 *
 * THE MISSION (about 10–15 minutes):
 *  1. 3D cutscene from inside the taxi: you look out of the window at Cherry
 *     Grove, Lily Marsh, the Flower Terrace, the Poison Wastes… then hundreds
 *     of Catnip Wrangler camps. The hooded driver turns round — a Wrangler —
 *     and knocks you out with his catnip club.
 *  2. You wake up in the Birman Castle jail and escape room by room:
 *     Jail Cell (find a hairpin, pick the lock) → Dungeon Corridor (sneak past
 *     guards, grab the key ring) → Guard Room (ambush) → Castle Kitchen
 *     (find the pantry lever) → Armoury (take the Wrangler Crook — trap!) →
 *     Courtyard (pull three levers, beat the gate guards) → Family Tree
 *     Gallery (Biscuit's painting → 3D cutscene: the paint drips off and
 *     Biscuit is a Birman; then the security cameras turn and Wranglers burst
 *     in) → Great Hall (cutscene: the Admin is dragged in by a purple and a
 *     gold Wrangler). To be continued…
 *  Getting spotted by a patrol calls an army of 5–15 Wranglers. Getting
 *  knocked out sends you back to the start of the room. Progress is saved
 *  per room (s.castle.room); "Give up" sends you home and the next mission
 *  taxi ride carries on from the same room.
 *
 * Owner tools (admin panel): start the mission with or without the taxi
 * cutscene, jump to any room, reset the mission.
 *
 * API: catCityCastleEscape.start({room, cutscene}) · .open() · .state()
 */
(()=>{'use strict';
const core=window.__catCityEngine,art=window.catCityCatArt;
if(!core||!art)return;
const s=core.state,T=core.T,CH=24*T,$=id=>document.getElementById(id);
const HOME={x:17*T,y:18*T};
const h=(x,y,k=0)=>{const n=Math.sin(x*127.1+y*311.7+k*53.17)*43758.5453;return n-Math.floor(n)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,p)=>a+(b-a)*p,ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
const CAT_IDS=['astro','galaxy','baby','harley','skylar','pumpkin'];
s.castle=s.castle&&typeof s.castle==='object'?s.castle:{};
const C=s.castle;if(C.done&&!C.ch2&&!C.ch1){C.ch1=true;C.r1=1;C.done=false;C.stage='ch2'}
C.room=clamp(Math.floor(Number(C.room)||0),0,7);
// Biscuit's true colours: cream Birman coat, deep blue eyes, white gloves, his bandana.
art.coats.biscuitBirman={name:'Biscuit',base:'#f3e6cc',stripe:'#d9c29a',light:'#fffaf0',white:['paws','chest'],eye:'#2f6fd8',nose:'#ec9fb6',earIn:'#5a3d34',acc:['bandana']};
const myArtId=()=>window.catCitySkins?.artId?.()||CAT_IDS[s.cat]||'astro';
const ownerSkin=()=>window.catCitySkins?.current?.()==='owner';
function drawMe(g,x,y,scale,pose,fr,flip){
 if(ownerSkin()&&window.catCitySkins?.drawPeer?.(g,x,y-16*scale*.8,{skin:{kind:'owner'}},scale*.8))return;
 art.draw(g,x,y,myArtId(),pose,fr,{scale,flip});
}
const myCoat=()=>{const c=art.coats[myArtId()]||art.coats.astro;return ownerSkin()?'#f0953c':c.base};
// ------------------------------------------------------------------ sound
function beep(freq,dur,type='square',vol=.07,slide=0){try{const A=window.catCityAudio,ac=A?.ctx?.();if(!ac||!A.on?.())return;const o=ac.createOscillator(),gn=ac.createGain(),t0=ac.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t0);if(slide)o.frequency.linearRampToValueAtTime(Math.max(30,freq+slide),t0+dur);gn.gain.setValueAtTime(vol*(A.volume?.()||.5),t0);gn.gain.exponentialRampToValueAtTime(.0001,t0+dur);o.connect(gn);gn.connect(A.master?.()||ac.destination);o.start(t0);o.stop(t0+dur+.03)}catch(e){}}
const SFX={honk:()=>{beep(392,.18,'square',.08);setTimeout(()=>beep(330,.22,'square',.08),200)},hit:()=>beep(160,.14,'sawtooth',.08,-90),swing:()=>beep(520,.08,'triangle',.05,-260),hurt:()=>beep(220,.2,'square',.07,-120),
 alarm:()=>{for(let i=0;i<4;i++)setTimeout(()=>beep(i%2?660:880,.2,'square',.06),i*230)},pick:()=>{beep(780,.08,'triangle',.06);setTimeout(()=>beep(1040,.1,'triangle',.06),90)},door:()=>beep(110,.35,'sawtooth',.06,40),bonk:()=>beep(90,.5,'sawtooth',.12,-60),click:()=>beep(1400,.04,'square',.05)};

// ================================================================== TAXI STOPS
const inVillage=(x,y)=>x>-3*T&&y>-3*T&&x<51*T&&y<38*T;
function stops(){
 const out=[],cx0=Math.floor(s.x/CH),cy0=Math.floor(s.y/CH);
 for(let cx=cx0-1;cx<=cx0+1;cx++)for(let cy=cy0-1;cy<=cy0+1;cy++){
  if(!cx&&!cy)continue;if(h(cx,cy,71)>.5)continue;
  const x=cx*CH+(4+h(cx,cy,72)*16)*T,y=cy*CH+(4+h(cx,cy,73)*16)*T;if(inVillage(x,y))continue;out.push({id:cx+','+cy,x,y});
 }
 return out;
}
const nearStop=()=>{let best=null,bd=64;for(const p of stops()){const d=Math.hypot(s.x-p.x,s.y-(p.y-6));if(d<bd){bd=d;best=p}}return best};
function drawTaxi(g,x,y,k,blink,hood){
 g.save();g.translate(Math.round(x),Math.round(y));
 const P=(a,b,w,hh,c)=>{g.fillStyle=c;g.fillRect(Math.round(a*k),Math.round(b*k),Math.max(1,Math.round(w*k)),Math.max(1,Math.round(hh*k)))};
 g.fillStyle='rgba(30,20,40,.35)';g.beginPath();g.ellipse(0,0,25*k,4*k,0,0,7);g.fill();
 P(-23,-15,46,12,'#241a2c');P(-22,-14,44,10,'#ffcf33');P(-22,-6,44,3,'#e0a91c');
 P(-14,-23,26,9,'#241a2c');P(-13,-22,24,8,'#ffcf33');P(-11,-21,9,6,'#9fd8ff');P(0,-21,9,6,'#9fd8ff');P(-10,-21,2,6,'#d7f0ff');
 if(hood){P(3,-20,5,5,'#2b2733');P(4,-19,3,2,'#f9df80')} // a hooded driver
 for(let i=0;i<11;i++)P(-22+i*4,-11,2,2,i%2?'#241a2c':'#fff6e4');
 P(-6,-27,12,5,'#241a2c');P(-5,-26,10,3,blink?'#fff3a0':'#ffd45c');
 P(-18,-6,9,7,'#241a2c');P(9,-6,9,7,'#241a2c');P(-16,-4,4,3,'#8a8a96');P(11,-4,4,3,'#8a8a96');
 P(20,-12,3,3,'#fff6c0');P(-23,-12,2,3,'#e8506a');
 g.restore();
}
const oldDraw=core.draw;
core.draw=function(){
 oldDraw();
 if(open||core.bossMode||document.body.classList.contains('start-menu-open')||window.catCityCaveState?.().inside||document.body.classList.contains('in-interior'))return;
 const g=core.ctx,cx=s.x-core.W/2,cy=s.y-core.H/2,t=performance.now()/1000,n=nearStop();
 g.save();g.imageSmoothingEnabled=false;
 for(const p of stops()){const x=p.x-cx,y=p.y-cy;if(x<-90||y<-90||x>core.W+90||y>core.H+90)continue;
  // Sign post
  g.fillStyle='#5b4632';g.fillRect(Math.round(x-46),Math.round(y-40),4,40);g.fillStyle='#241a2c';g.fillRect(Math.round(x-62),Math.round(y-56),36,18);g.fillStyle='#ffd45c';g.fillRect(Math.round(x-60),Math.round(y-54),32,14);
  g.font='bold 10px system-ui';g.textAlign='center';g.fillStyle='#241a2c';g.fillText('TAXI',Math.round(x-44),Math.round(y-43));
  drawTaxi(g,x,y,2,Math.floor(t*2)%2===0,true);
  if(n&&n.id===p.id){g.font='bold 11px system-ui';g.lineWidth=3;g.strokeStyle='#241832';g.fillStyle='#fff6e4';const lab='E / 🐾 · 🚕 Ride the taxi home';g.strokeText(lab,x,y+18);g.fillText(lab,x,y+18)}}
 g.restore();
 worldExtras();
};
const oldInteract=core.interact;
core.interact=function(){if(!open&&!core.bossMode&&!document.body.classList.contains('in-interior')){if(m3Interact())return;const L=nearLore();if(L){readLore(L);return}const p=nearStop();if(p){taxiMenu();return}}return oldInteract()};
if($('interact'))$('interact').onclick=()=>core.interact();

// ------------------------------------------------------------------ DOM
const css=document.createElement('style');css.id='cc-castle-style';
css.textContent=[
 '#cc-taxi-menu{display:none;position:fixed;inset:0;z-index:7400;background:#120b1caa;align-items:center;justify-content:center;padding:12px}#cc-taxi-menu.open{display:flex}',
 '#cc-taxi-menu>div{background:#2a1d3a;color:#fff6e4;border:3px solid #ffd45c;border-radius:16px;padding:16px;max-width:360px;font:14px system-ui;text-align:center}',
 '#cc-taxi-menu button{margin:6px;min-height:44px;padding:8px 14px;border-radius:12px;border:2px solid #fff6e4;font:bold 14px system-ui;background:#ffd45c;color:#241a2c}#cc-taxi-menu button.no{background:#dcc5f7}',
 '#cc-castle{display:none;position:fixed;inset:0;z-index:7500;background:#000;touch-action:none;user-select:none;-webkit-user-select:none}#cc-castle.open{display:block}',
 '#cc-castle canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated}',
 '#cc-castle-top{position:absolute;left:8px;right:8px;top:8px;display:flex;gap:8px;align-items:flex-start;pointer-events:none}',
 '#cc-castle-hud{background:#120b1ccc;border:2px solid #e8d3ff;border-radius:12px;padding:6px 10px;color:#fff6e4;font:bold 13px system-ui;max-width:min(70vw,520px)}',
 '#cc-castle-hud .hearts{font-size:15px;letter-spacing:1px}#cc-castle-hud .room{color:#ffd45c}#cc-castle-hud .obj{font-weight:600;font-size:12px;margin-top:2px}',
 '#cc-castle-quit,#cc-castle-skip{pointer-events:auto;margin-left:auto;min-height:44px;min-width:44px;border-radius:12px;border:2px solid #fff6e4;background:#f6c6d2;color:#33224a;font:bold 13px system-ui;padding:6px 10px}',
 '#cc-castle-skip{position:absolute;right:10px;top:10px;display:none;background:#fff6e4}#cc-castle.cine #cc-castle-skip{display:block}',
 '#cc-castle.cine #cc-castle-top,#cc-castle.cine #cc-castle-joy,#cc-castle.cine #cc-castle-btns{display:none}',
 '#cc-castle-say{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);max-width:min(92vw,640px);background:#120b1ce6;color:#fff6e4;border:2px solid #ffd45c;border-radius:14px;padding:10px 14px;font:bold 15px system-ui;text-align:center;display:none;pointer-events:none}',
 '#cc-castle.cine #cc-castle-say{bottom:9%}',
 '#cc-castle-joy{position:absolute;left:18px;bottom:22px;width:132px;height:132px;border-radius:50%;background:#ffffff1f;border:3px solid #ffffff55;touch-action:none}',
 '#cc-castle-joy i{position:absolute;left:41px;top:41px;width:50px;height:50px;border-radius:50%;background:#fff6e4cc;border:3px solid #33224a}',
 '#cc-castle-btns{position:absolute;right:16px;bottom:24px;display:flex;gap:10px;align-items:flex-end}',
 '#cc-castle-btns button{width:74px;height:74px;border-radius:50%;border:3px solid #fff6e4;font:bold 26px system-ui;touch-action:none}#cc-castle-atk{background:#f08a8a}#cc-castle-act{background:#ffe3a6;width:62px!important;height:62px!important}',
 '#cc-castle-keys{display:none;position:absolute;left:50%;bottom:12px;transform:translateX(-50%);background:#120b1cd9;color:#fff6e4;border:2px solid #ffffff55;border-radius:12px;padding:6px 12px;font:bold 13px system-ui;pointer-events:none;white-space:nowrap}#cc-castle.cine #cc-castle-keys{display:none!important}',
 '@media(pointer:fine){#cc-castle-joy{display:none}#cc-castle-btns button{width:58px;height:58px;font-size:21px}#cc-castle-act{width:50px!important;height:50px!important}#cc-castle-keys{display:block}}',
 'body.cc-in-castle #mobile,body.cc-in-castle #interact,body.cc-in-castle #sprint{display:none!important}'
].join('\n');document.head.append(css);
const menu=document.createElement('div');menu.id='cc-taxi-menu';menu.innerHTML='<div><div style="font-size:42px">🚕</div><b>Taxi Stop</b><p id="cc-taxi-text">The driver keeps his hood up. "Where to, kitty?"</p><button id="cc-taxi-go">🏡 Take me home</button><button class="no" id="cc-taxi-no">Not now</button></div>';
document.body.append(menu);
const root=document.createElement('div');root.id='cc-castle';
root.innerHTML='<canvas id="cc-castle-cv"></canvas><div id="cc-castle-top"><div id="cc-castle-hud"></div><button id="cc-castle-quit" type="button">🚪 Give up</button></div><div id="cc-castle-say"></div><div id="cc-castle-joy"><i></i></div><div id="cc-castle-btns"><button id="cc-castle-act" type="button" aria-label="Use">🐾</button><button id="cc-castle-atk" type="button" aria-label="Attack">⚔️</button></div><button id="cc-castle-skip" type="button">Skip ⏭</button><div id="cc-castle-keys">WASD / arrows: move · Space / F / click: ⚔️ attack · E: 🐾 use · Esc: give up</div>';
document.body.append(root);
const cv=$('cc-castle-cv'),hudEl=$('cc-castle-hud'),sayEl=$('cc-castle-say');let g=cv.getContext('2d');
let W=1,H=1;
function fit(){const d=Math.min(2,window.devicePixelRatio||1),px=Math.max(1.5,Math.min(innerWidth,innerHeight)*d/400);W=Math.round(innerWidth*d/px);H=Math.round(innerHeight*d/px);if(cv.width!==W)cv.width=W;if(cv.height!==H)cv.height=H;g.imageSmoothingEnabled=false}
let sayUntil=0;function say(text,ms=3200){sayEl.textContent=text;sayEl.style.display=text?'block':'none';sayUntil=performance.now()+ms}

// ------------------------------------------------------------------ taxi menu
function taxiMenu(){
 $('cc-taxi-text').textContent=C.done?'"Back again? Hop in." It\'s a normal driver this time.':'The driver keeps his hood up. "Where to, kitty?"';
 menu.classList.add('open');SFX.honk();
}
$('cc-taxi-no').onclick=()=>menu.classList.remove('open');
$('cc-taxi-go').onclick=()=>{menu.classList.remove('open');
 if(!C.done&&(Math.random()<.25||window.__ccForceTaxiMission)){window.__ccForceTaxiMission=false;
  if(C.stage==='islands')start({stage:'islands'});else if(C.ch1)start({stage:'ch2',recap:true});else start({room:C.room||0,cutscene:!C.seenTaxi})}
 else quickRide();
};
function quickRide(){
 const f=document.createElement('div');f.style.cssText='position:fixed;inset:0;z-index:7600;background:#000;opacity:0;transition:opacity .45s;display:flex;align-items:center;justify-content:center;color:#ffd45c;font:bold 22px system-ui';f.textContent='🚕 Beep beep! Heading home…';document.body.append(f);
 requestAnimationFrame(()=>f.style.opacity='1');SFX.honk();
 setTimeout(()=>{s.x=HOME.x;s.y=HOME.y;core.persist();},700);
 setTimeout(()=>{f.style.opacity='0';core.note('🏡 Home sweet home! The taxi drops you at the Cosy Cat House.')},1500);
 setTimeout(()=>f.remove(),2100);
}

// ================================================================== CASTLE MAP
const S=16,GW=40,CX=20;
const ROOMS=[
 {name:'Jail Cell',w:8,h:6,floor:2},
 {name:'Dungeon Corridor',w:28,h:8,floor:2},
 {name:'Guard Room',w:22,h:12,floor:2},
 {name:'Castle Kitchen',w:24,h:12,floor:7},
 {name:'Armoury',w:18,h:11,floor:2},
 {name:'Courtyard',w:34,h:20,floor:4},
 {name:'Family Tree Gallery',w:28,h:12,floor:3},
 {name:'Great Hall',w:30,h:18,floor:3}
];
const ARMY={1:5,2:6,3:7,4:8,5:10,gate:9,6:12};
let grid=null,GH=0,rooms=[],solid=new Set(),mapCv=null;
const tileAt=(tx,ty)=>(tx<0||ty<0||tx>=GW||ty>=GH)?0:grid[ty*GW+tx];
const isSolidTile=(tx,ty)=>{const v=tileAt(tx,ty);return v===0||v===1||v===5||v===6||solid.has(tx+','+ty)};
const isWallTile=(tx,ty)=>{const v=tileAt(tx,ty);return v===0||v===1||v===6};
function build(){
 GH=ROOMS.reduce((a,r)=>a+r.h+5,4);grid=new Uint8Array(GW*GH);solid=new Set();rooms=[];
 const set=(x,y,v)=>{if(x>=0&&y>=0&&x<GW&&y<GH)grid[y*GW+x]=v};
 let cur=1;
 ROOMS.forEach((R,i)=>{
  const ox=CX-Math.floor(R.w/2),oy=cur+1;
  for(let y=oy-1;y<=oy+R.h;y++)for(let x=ox-1;x<=ox+R.w;x++)set(x,y,(x<ox||x>=ox+R.w||y<oy||y>=oy+R.h)?1:R.floor);
  if(i>0)for(let x=CX-1;x<=CX+1;x++)set(x,oy-1,R.floor);
  if(i<ROOMS.length-1){
   for(let x=CX-1;x<=CX+1;x++)set(x,oy+R.h,6);
   for(let y=oy+R.h+1;y<=oy+R.h+3;y++)for(let x=CX-2;x<=CX+2;x++)set(x,y,(x===CX-2||x===CX+2)?1:2);
  }
  rooms.push({...R,i,ox,oy});cur=oy+R.h+4;
 });
 // The cell's front wall is bars; prison cells line the dungeon corridor's top wall.
 const r0=rooms[0];for(let x=r0.ox;x<r0.ox+r0.w;x++)if(Math.abs(x-CX)>1)set(x,r0.oy+r0.h,5);
 const r1=rooms[1];for(let x=r1.ox;x<r1.ox+r1.w;x++)if(Math.abs(x-CX)>1&&(x-r1.ox)%4!==0)set(x,r1.oy-1,5);
}
// ------------------------------------------------------------------ room contents
let objs=[],enemies=[],rs=[],fx=[];
function P(room,tx,ty){return {x:(room.ox+tx+.5)*S,y:(room.oy+ty+.5)*S}}
function block(room,tx,ty){solid.add((room.ox+tx)+','+(room.oy+ty))}
function decor(room,tx,ty,sprite,isSolid=true,extra={}){const p=P(room,tx,ty);if(isSolid)block(room,tx,ty);objs.push({kind:'decor',sprite,room:room.i,...p,...extra})}
function populate(){
 objs=[];
 const [r0,r1,r2,r3,r4,r5,r6,r7]=rooms;
 // 0 Jail Cell
 objs.push({kind:'crack',room:0,...P(r0,0,2),wall:[-1,0],text:'Just a crack. Nothing in here.'});
 objs.push({kind:'crack',room:0,...P(r0,7,3),wall:[1,0],text:'A loose brick… only spiders behind it. 🕷️'});
 objs.push({kind:'crack',room:0,...P(r0,3,0),wall:[0,-1],hairpin:true});
 decor(r0,1,4,'straw',false);decor(r0,6,4,'bucket');
 // 1 Dungeon Corridor
 objs.push({kind:'key',room:1,...P(r1,27,1)});
 decor(r1,0,7,'barrel');decor(r1,27,7,'barrel');decor(r1,26,7,'crate');
 for(const [tx,id] of [[2,'pip'],[9,'mochi'],[18,'toffee'],[25,'clover']])objs.push({kind:'prisoner',room:1,id,...P(r1,tx,-1)});
 // 2 Guard Room
 for(const [x,y] of [[4,4],[5,4],[16,4],[17,4],[4,8],[5,8],[16,8],[17,8]])decor(r2,x,y,'table');
 decor(r2,0,0,'barrel');decor(r2,21,0,'barrel');decor(r2,21,11,'crate');
 objs.push({kind:'snack',room:2,...P(r2,11,6)});
 // 3 Kitchen
 for(let x=1;x<23;x++)if(Math.abs(r3.ox+x-CX)>1)decor(r3,x,0,x%5===2?'oven':'counter');
 decor(r3,10,6,'table');decor(r3,13,6,'table');decor(r3,0,11,'barrel');decor(r3,1,11,'barrel');
 for(const [x,y] of [[2,6],[21,3],[12,9]])objs.push({kind:'snack',room:3,...P(r3,x,y)});
 objs.push({kind:'lever',room:3,...P(r3,22,10),id:'pantry'});
 // 4 Armoury
 objs.push({kind:'rack',room:4,...P(r4,3,1)});block(r4,3,0);
 for(const x of [13,14,15,16])decor(r4,x,0,'armour');decor(r4,0,10,'crate');decor(r4,17,10,'crate');
 // 5 Courtyard
 for(let x=15;x<=18;x++)for(let y=9;y<=10;y++)block(r5,x,y);objs.push({kind:'decor',sprite:'fountain',room:5,...P(r5,16.5,9.5)});
 for(const [x,y] of [[6,6],[27,6],[6,13],[27,13],[11,3],[22,3],[11,16],[22,16],[2,9],[31,9]])decor(r5,x,y,(x+y)%3?'tree':'bush');
 for(const [x,y,id] of [[1,2,'a'],[32,2,'b'],[1,17,'c']])objs.push({kind:'lever',room:5,...P(r5,x,y),id});
 // 6 Family Tree Gallery
 for(const [x,who,label] of [[3,'king','Great-Grandpaw Birman'],[8,'junior','Birman Junior'],[19,'armour','Sir Armoured Birman'],[24,'biscuit','Sir Biscuit']])objs.push({kind:'painting',room:6,who,label,...P(r6,x,0)});
 for(const [x,y] of [[1,-1],[26,-1],[-1,6],[28,6],[13,12],[0,11]])objs.push({kind:'camera',room:6,...P(r6,x,y)});
 decor(r6,0,0,'plant');decor(r6,27,0,'plant');
 // 7 Great Hall
 for(const y of [3,7,11,15])for(const x of [4,25])decor(r7,x,y,'pillar');
 decor(r7,15,16,'throne');block(r7,14,16);block(r7,16,16);
 objs.push({kind:'sidedoor',room:7,...P(r7,-1,9)});
}
const PATROLS={1:[[[2,2],[25,2]],[[25,5],[2,5]]],3:[[[3,4],[20,4]],[[20,8],[3,8]]],5:[[[4,4],[29,4],[29,15],[4,15]],[[10,7],[23,7]],[[23,12],[10,12]],[[30,17],[18,17],[18,13]]]};
function spawnPatrols(i){
 const room=rooms[i];for(const path of PATROLS[i]||[]){const pts=path.map(([x,y])=>P(room,x,y));
  enemies.push({kind:'patrol',room:i,x:pts[0].x,y:pts[0].y,pts,idx:1,dir:0,hp:3+(i>=5?1:0),max:3+(i>=5?1:0),cd:0,hurt:0,alert:0,anim:Math.random()*9})}
}
function resetRoom(i){
 const old=rs[i]||{};rs[i]={cleared:false,armyLeft:0,queue:0,spawnT:0,caught:false,ambush:false,levers:old.levers||{},hairpin:old.hairpin||false,key:old.key||false,searched:old.searched||{},rack:old.rack||false,gate:old.gate||false,cams:0,taken:old.taken||{}};
 enemies=enemies.filter(e=>e.room!==i);spawnPatrols(i);
}
// ------------------------------------------------------------------ tile art (pre-drawn once)
function drawMap(){
 mapCv=document.createElement('canvas');mapCv.width=GW*S;mapCv.height=GH*S;const m=mapCv.getContext('2d');m.imageSmoothingEnabled=false;
 m.fillStyle='#07040b';m.fillRect(0,0,mapCv.width,mapCv.height);
 for(let ty=0;ty<GH;ty++)for(let tx=0;tx<GW;tx++){
  const v=tileAt(tx,ty),x=tx*S,y=ty*S,n=h(tx,ty,5);
  if(v===2){m.fillStyle=n<.5?'#5d5668':'#57506a';m.fillRect(x,y,S,S);m.fillStyle='#4a4458';m.fillRect(x,y,S,1);m.fillRect(x,y,1,S);if(n>.85){m.fillStyle='#6c6578';m.fillRect(x+5,y+6,3,2)}}
  else if(v===3){m.fillStyle='#7a2236';m.fillRect(x,y,S,S);m.fillStyle='#8f2b42';m.fillRect(x+2,y+2,S-4,S-4);m.fillStyle='#c8952b';if((tx+ty)%4===0)m.fillRect(x+7,y+7,2,2)}
  else if(v===4){m.fillStyle=n<.5?'#2f5a3c':'#2b5337';m.fillRect(x,y,S,S);m.fillStyle='#3b6d48';if(n>.6)m.fillRect(x+3+n*8,y+4,1,3);if(n<.2)m.fillRect(x+9,y+10,1,3)}
  else if(v===7){m.fillStyle=(tx+ty)%2?'#d9d2c4':'#b9b0a1';m.fillRect(x,y,S,S)}
  else if(v===1||v===6){
   const below=tileAt(tx,ty+1),front=below!==1&&below!==0&&below!==5&&below!==6;
   m.fillStyle='#2a2333';m.fillRect(x,y,S,S);
   if(front){m.fillStyle='#4b4157';m.fillRect(x,y+4,S,S-4);m.fillStyle='#3a3245';for(let r=0;r<3;r++){m.fillRect(x,y+4+r*4,S,1);m.fillRect(x+((r%2)?4:10),y+4+r*4,1,4)}m.fillStyle='#211b29';m.fillRect(x,y,S,4)}
  }
  else if(v===5){m.fillStyle='#1a1422';m.fillRect(x,y,S,S);m.fillStyle='#8d8a99';for(let k=1;k<S;k+=4)m.fillRect(x+k,y,2,S);m.fillRect(x,y+2,S,2);m.fillRect(x,y+S-3,S,2)}
 }
 // Torches on walls that face a floor tile.
 for(let ty=0;ty<GH;ty++)for(let tx=0;tx<GW;tx++){if(tileAt(tx,ty)===1&&tileAt(tx,ty+1)>1&&tileAt(tx,ty+1)!==5&&tileAt(tx,ty+1)!==6&&(tx*7+ty)%6===0){const x=tx*S+6,y=ty*S+4;m.fillStyle='#5b4632';m.fillRect(x+1,y+5,2,6);m.fillStyle='#ffb347';m.fillRect(x,y+1,4,4);m.fillStyle='#fff3a0';m.fillRect(x+1,y+2,2,2)}}
}
const torches=()=>{const out=[];for(let ty=0;ty<GH;ty++)for(let tx=0;tx<GW;tx++)if(tileAt(tx,ty)===1&&tileAt(tx,ty+1)>1&&tileAt(tx,ty+1)!==5&&tileAt(tx,ty+1)!==6&&(tx*7+ty)%6===0)out.push({x:tx*S+8,y:ty*S+7});return out};
let TORCH=[];

// ================================================================== GAME STATE
let open=false,mode='off',modeT=0,last=0,raf=0,room=0,hp=8,MAXHP=8,inv=0,atkCd=0,atkAnim=0,ko=0,wake=0,lockpick=null,camShake=0,face={x:0,y:1},moving=false,stepT=0;
const P0={x:0,y:0};const me={x:0,y:0};
const input={keys:new Set(),jx:0,jy:0};
function entryPoint(i){const r=rooms[i];return {x:CX*S+8,y:(r.oy+.9)*S}}
function doorOpen(i){const r=rooms[i];if(!r||i>=rooms.length-1)return;for(let x=CX-1;x<=CX+1;x++)grid[(r.oy+r.h)*GW+x]=2;SFX.door();camShake=.25}
function doorClosed(i){const r=rooms[i];return r&&i<rooms.length-1&&grid[(r.oy+r.h)*GW+CX]===6}
function start(opts={}){
 if(open)return;
 build();populate();drawMap();TORCH=torches();enemies=[];rs=[];fx=[];
 const startRoom=clamp(Math.floor(opts.room||0),0,7);
 for(let i=0;i<rooms.length;i++){resetRoom(i);if(i<startRoom){rs[i].cleared=true;doorOpen(i);enemies=enemies.filter(e=>e.room!==i)}}
 room=startRoom;hp=MAXHP;inv=0;ko=0;lockpick=null;const ep=entryPoint(room);me.x=ep.x;me.y=ep.y;face={x:0,y:1};
 if(C.biscuit)objs.forEach(o=>{if(o.who==='biscuit')o.who='biscuitBirman'});
 open=true;root.classList.add('open');document.body.classList.add('cc-in-castle','in-interior');fit();
 input.keys.clear();input.jx=input.jy=0;
 window.catCityVoice?.preload?.(['c01','c02','c03','c04','c05','c06','c07','c08']);
 if(opts.stage==='m3leave'){setMode('m3leave')}
 else if(opts.stage==='m2'){m2Start()}
 else if(opts.stage==='m3'){if(C.m3s==='boss')bossStart();else setMode('m3ride')}
 else if(opts.stage==='m3boss'){bossStart()}
 else if(opts.stage==='islands'){setMode('islands');islandsStart(clamp(Math.floor(C.island||0),0,5))}
 else if(opts.stage==='ch2'){setMode('abyss');if(opts.recap)say('',1)}
 else if(opts.cutscene){setMode('taxi')}else{setMode('play');wake=room===0?1.6:0;roomIntro()}
 last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
}
function close(){window.catCityMissionMusic=null;playAsBoss=false;cmdBox.classList.remove('open');sendBtn.classList.remove('show');open=false;mode='off';root.classList.remove('open','cine');document.body.classList.remove('cc-in-castle','in-interior');cancelAnimationFrame(raf);sayEl.style.display='none'}
function setMode(m){mode=m;modeT=0;root.classList.toggle('cine',!PLAYLIKE.includes(m));cmdBox?.classList.remove('open');if(m==='taxi'){taxiWorld=makeTaxiWorld()}if(!PLAYLIKE.includes(m))sayEl.style.display='none'}
const PLAYLIKE=['play','islands','m2cmd','m3climb','m3boss'];
function roomIntro(){const r=rooms[room];say('🏰 '+r.name,2400)}
function giveUp(){if(mode.startsWith('m2')){close();core.note('😿 You wake up in the village. That was a strange dream…');return}
 if(mode==='m3leave'){close();C.m3s='trail';core.persist();return}
 if(mode.startsWith('m3')){C.m3s=C.m3s==='boss'?'boss':'fort';core.persist();close();s.x=HOME.x;s.y=HOME.y;core.persist();core.note('🐾 You made it home. The No Return taxi is still waiting where Biscuit\'s pawprints lead.');return}
 if(mode==='islands'){C.stage='islands';core.persist();close();s.x=HOME.x;s.y=HOME.y;core.persist();core.note('🐾 You found a way down and ran home. The next mission taxi will take you back to the floating islands.');return}
 C.room=room;core.persist();close();s.x=HOME.x;s.y=HOME.y;core.persist();core.note('🐾 You squeezed out through a drain and ran home. The next mission taxi will take you back to the '+rooms[room].name+'.')}
$('cc-castle-quit').onclick=giveUp;
$('cc-castle-skip').onclick=()=>skipCutscene();
function skipCutscene(){
 if(mode==='taxi'){C.seenTaxi=true;core.persist();setMode('play');wake=1.6;roomIntro()}
 else if(mode==='biscuit'){finishBiscuit()}
 else if(mode==='drag'){drawDrag.thud=0;cineKO=false;finishChapter1();setMode('abyss')}
 else if(mode==='abyss'){sayEl.style.fontStyle='';dust=[];setMode('wake')}
 else if(mode==='wake'){setMode('glitch')}
 else if(mode==='glitch'){rain=[];setMode('islands');islandsStart(0)}
 else if(mode==='fall'){shards=[];setMode('adminpov')}
 else if(mode==='adminpov'){C.ch2=true;core.persist();setMode('end')}
 else if(mode==='m2intro'){said.scr=0;setMode('m2cmd')}
 else if(mode==='m2console'){if(sendPressed){sendBtn.classList.remove('show');finishM2()}}
 else if(mode==='m3ride'){fortStart(C.m3cp||0)}
 else if(mode==='m3locket'){drips=[];setMode('m3home')}
 else if(mode==='m3home'){setMode('m3welcome')}
 else if(mode==='m3leave'){said.lv=0;close();C.m3s='trail';core.persist();core.note('🐾 Follow Biscuit\'s glowing pawprints to the No Return taxi!')}
 else if(mode==='m3intro'){said.stand=0;bossStart(true)}
 else if(mode==='m3admin'){said.adm=0;power=999;enemies=[];setMode('m3boss')}
 else if(mode==='m3welcome'){confetti=[];finishM3()}
 else if(mode==='end'){finishMission()}
}

// ------------------------------------------------------------------ input
const KEYMAP={w:'u',arrowup:'u',s:'d',arrowdown:'d',a:'l',arrowleft:'l',d:'r',arrowright:'r'};
window.addEventListener('keydown',e=>{
 if(!open||e.ctrlKey||e.metaKey||e.target?.closest?.('input,select,textarea,[contenteditable]'))return;
 const k=String(e.key||'').toLowerCase();e.preventDefault();e.stopImmediatePropagation();
 if(mode==='m2console'){if(!sendPressed&&(k===' '||k==='enter'||k==='e'))sendBtn.onclick();return}
 if(!PLAYLIKE.includes(mode)){if(k===' '||k==='enter'||k==='escape'||k==='e')skipCutscene();return}
 if(KEYMAP[k])input.keys.add(KEYMAP[k]);
 if(k===' '||k==='j'||k==='f')attack();
 if(k==='e'||k==='enter'){if(mode==='m2cmd')m2Use();else use()}
 if(k==='escape')giveUp();
},true);
window.addEventListener('keyup',e=>{if(!open)return;const k=String(e.key||'').toLowerCase();if(KEYMAP[k])input.keys.delete(KEYMAP[k]);e.stopImmediatePropagation()},true);
const joy=$('cc-castle-joy'),knob=joy.querySelector('i');let joyId=null;
function joyMove(e){const r=joy.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=Math.hypot(dx,dy)||1,R=r.width/2-20,k=Math.min(1,m/R);input.jx=dx/m*k;input.jy=dy/m*k;knob.style.transform='translate('+(dx/m*Math.min(m,R))+'px,'+(dy/m*Math.min(m,R))+'px)'}
joy.addEventListener('pointerdown',e=>{e.preventDefault();joyId=e.pointerId;try{joy.setPointerCapture(e.pointerId)}catch(_){}joyMove(e)});
joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e)});
const joyEnd=e=>{if(e.pointerId!==joyId)return;joyId=null;input.jx=input.jy=0;knob.style.transform=''};
joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
$('cc-castle-atk').addEventListener('pointerdown',e=>{e.preventDefault();attack()});
// Computer: a left click on the mission picture attacks too (glitch report: "you can't attack on computer").
$('cc-castle-cv').addEventListener('mousedown',e=>{if(e.button!==0||!PLAYLIKE.includes(mode)||!matchMedia('(pointer:fine)').matches)return;e.preventDefault();if(mode==='m2cmd')return;attack()});
$('cc-castle-act').addEventListener('pointerdown',e=>{e.preventDefault();if(mode==='m2cmd')m2Use();else use()});
cv.addEventListener('pointerdown',e=>{if(mode!=='play')return;if(lockpick){e.preventDefault();use()}});
addEventListener('resize',()=>{if(open)fit()});

// ------------------------------------------------------------------ play: movement & collision
const R_ME=5;
function canStand(x,y,r=R_ME){if(mode==='islands')return onIsland(x,y,r+1);if(mode==='m3climb')return onFort(x,y,r+1);if(mode==='m3boss')return inArena(x,y,r+1);for(const [dx,dy] of [[-r,-r],[r,-r],[-r,r],[r,r]]){if(isSolidTile(Math.floor((x+dx)/S),Math.floor((y+dy)/S)))return false}return true}
function slide(o,dx,dy,r){if(canStand(o.x+dx,o.y,r))o.x+=dx;if(canStand(o.x,o.y+dy,r))o.y+=dy}
function roomOf(y){for(let i=rooms.length-1;i>=0;i--)if(y>=(rooms[i].oy-.5)*S)return i;return 0}
function damage(){const lv=window.catCityLevels?.level?.()||1;return 1+(C.crook?1:0)+Math.floor(lv/8)}
function attack(){
 if(!['play','islands','m3climb','m3boss'].includes(mode)||jump||ko>0||atkCd>0||lockpick||fallT>0)return;atkCd=.34;atkAnim=.25;SFX.swing();
 const ax=me.x+face.x*10,ay=me.y+face.y*10;let hit=false;
 for(const e of enemies){if(e.room!==room||e.hp<=0)continue;if(Math.hypot(e.x-ax,e.y-ay)<22){e.hp-=damage();e.hurt=.25;hit=true;const m=Math.hypot(e.x-me.x,e.y-me.y)||1;e.kx=(e.x-me.x)/m*90;e.ky=(e.y-me.y)/m*90;
  if(e.kind==='patrol'&&!rs[room].caught){e.hp=0} // a sneak attack takes a patrol out in one hit
  if(e.hp<=0){fx.push({kind:'poof',x:e.x,y:e.y,t:0});window.catCityLevels?.add?.(4,'wrangler')}}}
 if(bossAttackCheck())hit=true;
 if(hit){SFX.hit();camShake=Math.max(camShake,.08)}
 enemies=enemies.filter(e=>e.hp>0);
}
function nearObj(){let best=null,bd=22;for(const o of objs){if(o.room!==room||o.gone)continue;if(!['crack','key','lever','rack','painting'].includes(o.kind))continue;const d=Math.hypot(o.x-me.x,o.y-me.y);if(d<bd){bd=d;best=o}}return best}
function nearCellDoor(){return room===0&&doorClosed(0)&&Math.abs(me.x-CX*S-8)<26&&Math.abs(me.y-(rooms[0].oy+rooms[0].h-.5)*S)<16}
function use(){
 if(mode!=='play'||ko>0)return;
 if(lockpick){const lp=lockpick;if(Math.abs(lp.pos-lp.zone)<lp.size){lp.hits++;SFX.click();if(lp.hits>=3){lockpick=null;rs[0].cleared=true;doorOpen(0);say('🔓 Click! The cell door swings open.');objective()}else{lp.zone=.15+Math.random()*.7;lp.size=Math.max(.06,lp.size-.015)}}else{lp.shake=.3;SFX.hurt();say('Clunk… the pin slipped. Try again!',1500)}return}
 if(nearCellDoor()){if(!rs[0].hairpin){say('🔒 The cell door is locked. Maybe something in the walls could pick it…');return}lockpick={pos:0,dir:1,zone:.3+Math.random()*.4,size:.11,hits:0,shake:0};say('Press 🐾 / E when the pin is in the gold zone (3 times)',3000);return}
 const o=nearObj();if(!o){if(doorClosed(room)&&Math.hypot(me.x-CX*S-8,me.y-(rooms[room].oy+rooms[room].h)*S)<30)say('🔒 '+lockedText());return}
 const st=rs[room];
 if(o.kind==='crack'){const k=o.x+','+o.y;st.searched[k]=true;if(o.hairpin){st.hairpin=true;o.gone=true;SFX.pick();say('📌 A hairpin was hidden behind the brick! Use it on the cell door.')}else say(o.text);objective()}
 if(o.kind==='key'){o.gone=true;st.key=true;SFX.pick();say('🗝️ Got the key ring! Open the door at the end of the corridor.');if(!st.caught){st.cleared=true;doorOpen(1)}objective()}
 if(o.kind==='lever'){if(st.levers[o.id])return say('That lever is already pulled.');st.levers[o.id]=true;o.on=true;SFX.door();
  if(room===3){st.cleared=true;doorOpen(3);say('⚙️ Clunk! The pantry lever opened the kitchen door.')}
  if(room===5){const n=Object.keys(st.levers).length;if(n<3)say('⚙️ Lever '+n+' of 3 pulled! The portcullis creaks…');else{say('⚙️ All three levers! The portcullis rises… GATE GUARDS!',3500);st.gate=true;callArmy(ARMY.gate,'gate')}}
  objective()}
 if(o.kind==='rack'&&!st.rack){st.rack=true;C.crook=true;core.persist();o.gone=true;SFX.pick();say('🪝 You took the Wrangler Crook! (+1 damage)… wait, the door is opening! IT\'S A TRAP!',3600);setTimeout(()=>{if(open&&room===4)callArmy(ARMY[4],'trap')},900);objective()}
 if(o.kind==='painting'){
  if(o.who==='biscuit'){setMode('biscuit');return}
  say('🖼️ '+o.label+(o.who==='biscuitBirman'?' — the paint is gone. It\'s really Biscuit… a Birman.':' — part of the Birman family tree.'))}
}
function lockedText(){return ({0:'The cell door is locked.',1:'You need the key ring from the end of the corridor.',2:'The door won\'t budge while guards are here.',3:'Locked from the pantry side. Find the lever!',4:'The armoury door is barred.',5:'The portcullis needs all three levers.',6:'Sealed. Something in this room must open it.'})[room]||'Locked.'}
function objective(){
 const st=rs[room]||{};const t={
  0:st.cleared?'Go through the cell door':st.hairpin?'Pick the cell door lock (stand by the door, press 🐾 / E)':'Search the cracks in the cell walls (🐾 / E)',
  1:st.cleared?'Go through the door at the end':st.caught?'⚔️ Defeat the Wrangler army!':st.key?'Go through the door at the end':'Sneak past the guards (stay out of their yellow view) and grab the key ring →',
  2:st.cleared?'Go through the door':st.ambush?'⚔️ Defeat the guards!':'Cross the guard room…',
  3:st.cleared?'Head through the kitchen door':st.caught?'⚔️ Defeat the Wrangler army!':'Find the pantry lever in the bottom-right corner. Fish snacks heal you!',
  4:st.rack?(st.cleared?'Go on to the courtyard':'⚔️ It\'s a trap! Defeat them!'):'Take the weapon from the rack',
  5:st.cleared?'Go through the portcullis':st.gate?'⚔️ Defeat the gate guards!':st.caught?'⚔️ Defeat the Wrangler army!':'Pull the 3 levers (left, right, bottom-left) — '+Object.keys(st.levers||{}).length+'/3',
  6:st.cleared?'Go to the Great Hall':st.cams?'⚔️ The cameras saw you! Defeat the Wranglers!':C.biscuit?'Keep going… the door is at the far end':'Look at the paintings of the Birman family tree (the last one on the right…)',
  7:'Walk into the Great Hall…'
 }[room]||'';
 st.obj=t;
}
// ------------------------------------------------------------------ armies & enemies
function spawnPoint(i){const r=rooms[i];return {x:CX*S+8,y:(r.oy+r.h-.6)*S}}
function callArmy(n,why){const st=rs[room];st.queue+=n;st.armyLeft+=n;st.spawnT=.3;if(why==='caught')st.caught=true;if(why==='ambush')st.ambush=true;
 // Patrols that saw you join in.
 for(const e of enemies)if(e.room===room&&e.kind==='patrol'){e.kind='army';st.armyLeft++}
 SFX.alarm();camShake=.3;objective()}
function caught(){const st=rs[room];if(st.caught||st.cleared)return;say('❗ SPOTTED! A Wrangler army is coming!',2600);callArmy(ARMY[room]||6,'caught')}
function armyDone(){const st=rs[room];
 if(room===1){st.caught=false;if(st.key){st.cleared=true;doorOpen(1);say('Phew! Now through the door.')}else say('The army is down. Grab the key ring!')}
 else if(room===2||room===4||room===6){st.cleared=true;doorOpen(room);say('✅ Room cleared! The door is open.')}
 else if(room===3){st.caught=false;say('The army is down. Find that lever!')}
 else if(room===5){if(st.gate){st.cleared=true;doorOpen(5);say('✅ The gate guards are down! Through the portcullis!',3000)}else{st.caught=false;say('Army defeated! Keep pulling levers.')}}
 objective()}
function vision(e){const a=Math.atan2(e.fy||1,e.fx||0);return {a,len:74,half:.55}}
function sees(e){const v=vision(e),dx=me.x-e.x,dy=me.y-e.y,d=Math.hypot(dx,dy);if(d>v.len)return false;let da=Math.atan2(dy,dx)-v.a;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;if(Math.abs(da)>v.half&&d>14)return false;
 for(let k=4;k<d;k+=4){const x=e.x+dx/d*k,y=e.y+dy/d*k;if(isWallTile(Math.floor(x/S),Math.floor(y/S)))return false}return true}
function updateEnemies(dt){
 const st=rs[room];
 if(st.queue>0){st.spawnT-=dt;if(st.spawnT<=0){st.spawnT=.38;st.queue--;const sp=spawnPoint(room);enemies.push({kind:'army',room,x:sp.x+(Math.random()-.5)*30,y:sp.y,hp:3+(room>=5?1:0),max:3+(room>=5?1:0),cd:.8,hurt:0,anim:Math.random()*9,kx:0,ky:0})}}
 for(const e of enemies){if(e.room!==room)continue;if(e.isl!==undefined&&e.isl!==isl)continue;e.anim+=dt;e.hurt=Math.max(0,e.hurt-dt);e.cd=Math.max(0,e.cd-dt);
  if(e.kx||e.ky){slide(e,e.kx*dt,e.ky*dt,5);e.kx*=.82;e.ky*=.82;if(Math.abs(e.kx)+Math.abs(e.ky)<2)e.kx=e.ky=0}
  if(e.kind==='patrol'){
   if(e.alert>0){e.alert-=dt;e.fx=me.x-e.x;e.fy=me.y-e.y;if(e.alert<=0)caught();continue}
   const p=e.pts[e.idx],dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);
   if(d<2){e.idx=(e.idx+1)%e.pts.length;e.wait=.6}else if((e.wait=(e.wait||0)-dt)<=0){const sp=30;e.fx=dx/d;e.fy=dy/d;slide(e,dx/d*sp*dt,dy/d*sp*dt,5)}
   if(ko<=0&&sees(e)){e.alert=.55;fx.push({kind:'alert',x:e.x,y:e.y-26,t:0});SFX.click()}
  }else{
   const dx=me.x-e.x,dy=me.y-e.y,d=Math.hypot(dx,dy)||1;e.fx=dx/d;e.fy=dy/d;
   let sx=0,sy=0;for(const o of enemies){if(o===e||o.room!==room)continue;const ox=e.x-o.x,oy=e.y-o.y,od=Math.hypot(ox,oy);if(od>0&&od<14){sx+=ox/od;sy+=oy/od}}
   const sp=room>=5?58:52;if(d>12)slide(e,(dx/d+sx*.6)*sp*dt,(dy/d+sy*.6)*sp*dt,5);
   if(d<15&&e.cd<=0&&ko<=0&&inv<=0){e.cd=1.1;e.lunge=.2;hp--;inv=.7;SFX.hurt();camShake=.2;if(hp<=0)knockOut()}
   e.lunge=Math.max(0,(e.lunge||0)-dt);
  }}
 // Count the army down.
 if(st.armyLeft>0){const alive=enemies.filter(e=>e.room===room&&e.kind==='army').length;if(st.queue<=0&&alive===0){st.armyLeft=0;armyDone()}}
}
function knockOut(){ko=2.2;say('💫 Knocked out! Back to the start of the room…',2200)}
function respawn(){const i=room,ep=entryPoint(i);me.x=ep.x;me.y=ep.y;hp=MAXHP;inv=1;const st=rs[i];
 enemies=enemies.filter(e=>e.room!==i);
 // Keep what you found, but the guards are back on patrol.
 const keep={levers:st.levers,hairpin:st.hairpin,key:st.key,searched:st.searched,rack:st.rack,taken:st.taken};
 if(st.cleared)return;
 rs[i]={...rs[i],...keep,caught:false,ambush:false,armyLeft:0,queue:0,gate:false,cams:0};
 if(i===5&&Object.keys(st.levers).length>=3){rs[i].gate=true;callArmy(ARMY.gate,'gate')}
 if(i===4&&st.rack){callArmy(ARMY[4],'trap')}
 if(i===6&&C.biscuit){rs[i].cams=0}
 spawnPatrols(i);objective()}
// ------------------------------------------------------------------ play: update
function updatePlay(dt){
 if(wake>0)wake-=dt;
 if(ko>0){ko-=dt;if(ko<=0)respawn();return}
 inv=Math.max(0,inv-dt);atkCd=Math.max(0,atkCd-dt);atkAnim=Math.max(0,atkAnim-dt);
 if(lockpick){const lp=lockpick;lp.pos+=lp.dir*dt*.9;if(lp.pos>1){lp.pos=1;lp.dir=-1}if(lp.pos<0){lp.pos=0;lp.dir=1}lp.shake=Math.max(0,lp.shake-dt);if(!nearCellDoor())lockpick=null;return}
 let vx=input.jx,vy=input.jy;if(input.keys.has('l'))vx-=1;if(input.keys.has('r'))vx+=1;if(input.keys.has('u'))vy-=1;if(input.keys.has('d'))vy+=1;
 const m=Math.hypot(vx,vy);moving=m>.15;
 if(moving){vx/=Math.max(1,m);vy/=Math.max(1,m);const sp=74;slide(me,vx*sp*dt,vy*sp*dt,R_ME);face={x:vx/(m>1?1:m||1),y:vy/(m>1?1:m||1)};const fm=Math.hypot(face.x,face.y)||1;face.x/=fm;face.y/=fm;stepT+=dt}
 // Room changes.
 const r=roomOf(me.y);if(r!==room&&r>room){room=r;C.room=Math.max(C.room||0,r);core.persist();roomIntro();objective();
  if(r===7)setTimeout(()=>{},0)}
 const st=rs[room],R=rooms[room];
 // Pickups.
 for(const o of objs){if(o.room!==room||o.gone||o.kind!=='snack')continue;if(Math.hypot(o.x-me.x,o.y-me.y)<14){o.gone=true;hp=Math.min(MAXHP,hp+3);SFX.pick();say('🐟 Fish snack! +3 hearts',1600)}}
 // Triggers.
 if(room===2&&!st.ambush&&!st.cleared&&me.y>(R.oy+3)*S){say('😼 "Get the prisoner!" — GUARDS!',2500);callArmy(ARMY[2],'ambush')}
 if(room===6&&C.biscuit&&!st.cams&&!st.cleared&&me.y>(R.oy+7)*S){st.cams=1;st.camT=0;say('📹 …every camera in the room turns to look at you.',3000);SFX.click();setTimeout(()=>{if(open&&room===6&&!rs[6].cleared){say('🚨 The door bursts open — WRANGLERS!',2600);callArmy(ARMY[6],'ambush')}},1700)}
 if(room===7&&me.y>(R.oy+4)*S&&mode==='play'){setMode('drag');return}
 updateEnemies(dt);
}
// ================================================================== DRAWING (play)
let Z=3,camX=0,camY=0;
function toScreen(x,y){return [(x-camX)*Z,(y-camY)*Z]}
function drawDecor(o,sx,sy,t){
 const k=Z,P=(a,b,w,hh,c)=>{g.fillStyle=c;g.fillRect(Math.round(sx+a*k),Math.round(sy+b*k),Math.round(w*k),Math.round(hh*k))};
 switch(o.sprite){
  case 'barrel':P(-6,-8,12,15,'#241a2c');P(-5,-7,10,13,'#8a5a34');P(-5,-4,10,1,'#5b3a22');P(-5,2,10,1,'#5b3a22');break;
  case 'crate':P(-7,-7,14,14,'#241a2c');P(-6,-6,12,12,'#b07a44');P(-6,-1,12,1,'#7a5230');P(-1,-6,1,12,'#7a5230');break;
  case 'table':P(-8,-6,16,10,'#241a2c');P(-7,-5,14,7,'#9a6a3c');P(-6,2,2,5,'#5b3a22');P(4,2,2,5,'#5b3a22');P(-3,-7,3,3,'#e8e2d4');break;
  case 'counter':P(-8,-8,16,15,'#241a2c');P(-8,-7,16,6,'#e8e2d4');P(-8,-1,16,8,'#8a5a34');break;
  case 'oven':P(-8,-8,16,15,'#241a2c');P(-7,-7,14,13,'#5a5568');P(-5,-3,10,6,'#1a1422');P(-4,0,8,2,Math.sin(t*8)>0?'#ff8a3d':'#ffb347');break;
  case 'bucket':P(-4,-4,8,8,'#241a2c');P(-3,-3,6,6,'#8d8a99');break;
  case 'straw':P(-10,-5,20,10,'#c9a34e');P(-8,-3,16,1,'#e3c26a');P(-6,1,12,1,'#a98632');break;
  case 'armour':P(-5,-12,10,18,'#241a2c');P(-4,-11,8,6,'#c8ccd8');P(-4,-5,8,8,'#a9aebe');P(-1,-9,2,2,'#241a2c');P(-1,3,2,4,'#5b4632');break;
  case 'tree':P(-2,-4,4,10,'#5b4632');g.fillStyle='#1f4a2c';g.beginPath();g.arc(sx,sy-10*k,10*k,0,7);g.fill();g.fillStyle='#2e6b3f';g.beginPath();g.arc(sx-3*k,sy-12*k,6*k,0,7);g.fill();break;
  case 'bush':g.fillStyle='#24552f';g.beginPath();g.arc(sx,sy-2*k,8*k,0,7);g.fill();g.fillStyle='#347744';g.beginPath();g.arc(sx-2*k,sy-4*k,4*k,0,7);g.fill();break;
  case 'fountain':P(-30,-14,60,30,'#3a3245');P(-28,-12,56,26,'#8d8a99');P(-24,-8,48,18,'#3f7fe0');P(-3,-22,6,14,'#a9aebe');for(let i=0;i<4;i++)P(-1+Math.sin(t*4+i)*6,-24+((t*20+i*6)%14),2,2,'#c8f1ff');break;
  case 'plant':P(-3,0,6,6,'#8a5a34');g.fillStyle='#3b8a4f';g.beginPath();g.arc(sx,sy-3*k,6*k,0,7);g.fill();break;
  case 'pillar':P(-7,-26,14,32,'#241a2c');P(-6,-25,12,30,'#8d8a99');P(-6,-25,3,30,'#b0adbd');P(-8,-27,16,4,'#6c6578');P(-8,3,16,3,'#6c6578');break;
  case 'throne':P(-12,-26,24,32,'#241a2c');P(-11,-25,22,30,'#c8952b');P(-8,-21,16,14,'#7a2236');P(-11,-6,22,4,'#ffd45c');P(-3,-29,6,4,'#e8506a');break;
 }
}
function drawPainting(o,sx,sy,t){
 // Painted on the wall tile above.
 const k=Z,w=26*k,hh=20*k,x=sx-w/2,y=sy-S*k-hh/2+2*k;
 g.fillStyle='#241a2c';g.fillRect(Math.round(x-2*k),Math.round(y-2*k),Math.round(w+4*k),Math.round(hh+4*k));g.fillStyle='#c8952b';g.fillRect(Math.round(x-k),Math.round(y-k),Math.round(w+2*k),Math.round(hh+2*k));
 g.fillStyle=o.who.startsWith('biscuit')?'#2e4a3a':'#3a2b4a';g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(hh));
 g.save();g.beginPath();g.rect(x,y,w,hh);g.clip();
 if(o.who==='biscuit'||o.who==='biscuitBirman')art.draw(g,sx,y+hh+6*k,o.who,'idle',0,{scale:k*.75});
 else window.catCityBirmanArt?.draw?.(g,sx,y+hh*.32,o.who==='armour'?'armour':o.who==='junior'?'junior':'king',{hp:1,max:1,t,scale:k*.42});
 g.restore();
}
function drawCamera(o,sx,sy,t){const k=Z,st=rs[6]||{};const look=st.cams?Math.atan2(me.y-o.y,me.x-o.x):Math.sin(t*.8+o.x)*.8+Math.PI/2;
 g.save();g.translate(sx,sy);g.fillStyle='#241a2c';g.fillRect(-3*k,-3*k,6*k,6*k);g.rotate(look);g.fillStyle='#d9d2c4';g.fillRect(0,-2*k,8*k,4*k);g.fillStyle='#241a2c';g.fillRect(7*k,-1.5*k,2*k,3*k);
 g.fillStyle=st.cams?(Math.floor(t*6)%2?'#ff3b5c':'#7a1020'):'#55ff7a';g.fillRect(2*k,-1*k,2*k,2*k);g.restore()}
function drawPlay(t,focus=me){
 Z=2;
 const vw=W/Z,vh=H/Z;camX=focus.x-vw/2;camY=focus.y-vh/2;
 if(camShake>0){camX+=(Math.random()-.5)*camShake*12;camY+=(Math.random()-.5)*camShake*12}
 g.fillStyle='#07040b';g.fillRect(0,0,W,H);
 g.drawImage(mapCv,Math.floor(camX),Math.floor(camY),Math.ceil(vw)+1,Math.ceil(vh)+1,-(camX-Math.floor(camX))*Z,-(camY-Math.floor(camY))*Z,(Math.ceil(vw)+1)*Z,(Math.ceil(vh)+1)*Z);
 // Closed doors.
 for(let i=0;i<rooms.length-1;i++){if(!doorClosed(i))continue;const r=rooms[i];const [sx,sy]=toScreen((CX-1)*S,(r.oy+r.h)*S);if(sy<-80||sy>H+80)continue;
  g.fillStyle='#241a2c';g.fillRect(sx,sy,3*S*Z,S*Z);g.fillStyle=i===0?'#8d8a99':i===5?'#6c6578':'#6b4425';g.fillRect(sx+Z,sy+Z,3*S*Z-2*Z,S*Z-Z);
  g.fillStyle=i===0||i===5?'#1a1422':'#4a2e18';for(let k=4;k<3*S;k+=6)g.fillRect(sx+k*Z,sy+Z,Z*(i===0||i===5?2:1),S*Z-Z);g.fillStyle='#ffd45c';g.fillRect(sx+1.5*S*Z-2*Z,sy+7*Z,4*Z,3*Z)}
 // Torch glow.
 g.save();g.globalCompositeOperation='lighter';for(const tc of TORCH){const [sx,sy]=toScreen(tc.x,tc.y);if(sx<-120||sy<-120||sx>W+120||sy>H+120)continue;const r=(34+Math.sin(t*9+tc.x)*3)*Z,gr=g.createRadialGradient(sx,sy,0,sx,sy,r);gr.addColorStop(0,'rgba(255,170,70,.22)');gr.addColorStop(1,'rgba(255,170,70,0)');g.fillStyle=gr;g.fillRect(sx-r,sy-r,r*2,r*2)}g.restore();
 // Patrol vision cones.
 for(const e of enemies){if(e.room!==room||e.kind!=='patrol')continue;const v=vision(e),[sx,sy]=toScreen(e.x,e.y);g.fillStyle=e.alert>0?'rgba(255,60,80,.28)':'rgba(255,230,120,.18)';g.beginPath();g.moveTo(sx,sy);g.arc(sx,sy,v.len*Z,v.a-v.half,v.a+v.half);g.closePath();g.fill()}
 // Things, sorted by y.
 const list=[];
 for(const o of objs){if(o.gone)continue;const [sx,sy]=toScreen(o.x,o.y);if(sx<-140||sy<-140||sx>W+140||sy>H+140)continue;list.push({y:o.kind==='painting'||o.kind==='camera'?-1e9:o.y,draw:()=>drawObj(o,sx,sy,t)})}
 for(const e of enemies){if(e.room!==room&&Math.abs(e.y-me.y)>300)continue;const [sx,sy]=toScreen(e.x,e.y);list.push({y:e.y,draw:()=>drawWrangler(e,sx,sy,t)})}
 list.push({y:me.y,draw:()=>{const [sx,sy]=toScreen(me.x,me.y);if(inv>0&&Math.floor(t*14)%2)return;
  const pose=(ko>0||cineKO)?'sleep':atkAnim>0?'attack':moving?(Math.abs(face.x)>Math.abs(face.y)?'walk':face.y<0?'walkBack':'walkFront'):'idle';
  const n=art.poses[pose]||1,fr=atkAnim>0?Math.min(n-1,Math.floor((.25-atkAnim)/.25*n)):Math.floor(t*8)%n;
  g.fillStyle='rgba(15,10,20,.4)';g.beginPath();g.ellipse(sx,sy+3*Z,7*Z,2.5*Z,0,0,7);g.fill();
  if(playAsBoss){const sc=Z*.6;window.catCityBirmanArt?.draw?.(g,sx,sy+3*Z-9.5*sc,'armour',{hp:1,max:1,t,scale:sc})}else drawMe(g,sx,sy+3*Z,Z*.62,pose,fr,face.x<-.2);
  if(atkAnim>0){const ef=art.effect('slash',Math.floor((.25-atkAnim)*20));g.save();g.translate(sx+face.x*12*Z,sy-6*Z+face.y*10*Z);g.rotate(Math.atan2(face.y,face.x));g.drawImage(ef,-12*Z,-12*Z,24*Z,24*Z);g.restore()}}});
 list.sort((a,b)=>a.y-b.y);for(const it of list)it.draw();
 for(const f of fx){f.t+=1/60;const [sx,sy]=toScreen(f.x,f.y);if(f.kind==='poof'){g.fillStyle='rgba(220,200,255,'+Math.max(0,1-f.t*2)+')';for(let i=0;i<6;i++){const a=i/6*6.28,r=(4+f.t*30)*Z;g.fillRect(sx+Math.cos(a)*r,sy-8*Z+Math.sin(a)*r,2*Z,2*Z)}}
  if(f.kind==='alert'){g.drawImage(art.effect('alert'),sx-8*Z,sy-8*Z-f.t*10,16*Z,16*Z)}}
 fx=fx.filter(f=>f.t<.7);
 // Night tint in the courtyard, darkness everywhere else at the edges.
 const vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.25,W/2,H/2,Math.max(W,H)*.7);vg.addColorStop(0,'rgba(5,3,10,0)');vg.addColorStop(1,room===5?'rgba(10,15,45,.75)':'rgba(5,3,10,.8)');g.fillStyle=vg;g.fillRect(0,0,W,H);
 if(room===5){g.fillStyle='rgba(20,30,90,.18)';g.fillRect(0,0,W,H)}
 if(rs[6]?.cams&&room===6&&!rs[6].cleared){g.fillStyle='rgba(255,0,40,'+(.08+Math.max(0,Math.sin(t*6))*.1)+')';g.fillRect(0,0,W,H)}
 // Interaction hint.
 const o=nearObj();let hint=null;
 if(lockpick)hint=null;else if(nearCellDoor())hint=rs[0].hairpin?'🐾 / E · Pick the lock':'🔒 Locked';else if(o)hint={crack:'🐾 / E · Search the crack',key:'🐾 / E · Take the key ring',lever:'🐾 / E · Pull the lever',rack:'🐾 / E · Take the Wrangler Crook',painting:'🐾 / E · Look at the painting'}[o.kind];
 if(hint){const [sx,sy]=toScreen(me.x,me.y);g.font='bold '+Math.round(5*Z)+'px system-ui';g.textAlign='center';g.lineWidth=Z;g.strokeStyle='#120b1c';g.fillStyle='#fff6e4';g.strokeText(hint,sx,sy+14*Z);g.fillText(hint,sx,sy+14*Z)}
 if(lockpick)drawLockpick(t);
 if(wake>0){const p=clamp(wake/1.6,0,1),lid=H/2*ease(p);g.fillStyle='#000';g.fillRect(0,0,W,lid);g.fillRect(0,H-lid,W,lid);g.fillStyle='rgba(0,0,0,'+(p*.6)+')';g.fillRect(0,0,W,H)}
 if(ko>0){g.fillStyle='rgba(0,0,0,'+clamp((2.2-ko)/1.2,0,.85)+')';g.fillRect(0,0,W,H)}
 camShake=Math.max(0,camShake-1/60);
}
function drawObj(o,sx,sy,t){
 const k=Z;
 if(o.kind==='decor')return drawDecor(o,sx,sy,t);
 if(o.kind==='painting')return drawPainting(o,sx,sy,t);
 if(o.kind==='camera')return drawCamera(o,sx,sy,t);
 if(o.kind==='crack'){const [wx,wy]=o.wall,x=sx+wx*S*k*.75,y=sy+wy*S*k*.75;g.strokeStyle='#120b1c';g.lineWidth=Math.max(1,k*.8);g.beginPath();g.moveTo(x-3*k,y-4*k);g.lineTo(x,y-1*k);g.lineTo(x-2*k,y+2*k);g.lineTo(x+2*k,y+5*k);g.stroke();if(!rs[0]?.searched?.[o.x+','+o.y]&&Math.floor(t*2)%2){g.fillStyle='#fff6e4';g.fillRect(x+3*k,y-5*k,k,k)}return}
 if(o.kind==='key'){g.fillStyle='#241a2c';g.fillRect(sx-5*k,sy-5*k,10*k,10*k);g.fillStyle='#ffd45c';g.beginPath();g.arc(sx-1*k,sy-1*k,3*k,0,7);g.fill();g.fillRect(sx,sy,5*k,1.5*k);g.fillRect(sx+3*k,sy,1.5*k,3*k);if(Math.floor(t*3)%2){g.fillStyle='#fff';g.fillRect(sx+2*k,sy-4*k,k,k)}return}
 if(o.kind==='snack'){g.fillStyle='#7fb3ff';g.beginPath();g.ellipse(sx,sy-2*k+Math.sin(t*4)*k,5*k,3*k,0,0,7);g.fill();g.beginPath();g.moveTo(sx+4*k,sy-2*k);g.lineTo(sx+8*k,sy-5*k);g.lineTo(sx+8*k,sy+1*k);g.fill();g.fillStyle='#241a2c';g.fillRect(sx-3*k,sy-3*k,k,k);return}
 if(o.kind==='lever'){g.fillStyle='#241a2c';g.fillRect(sx-4*k,sy-1*k,8*k,5*k);g.fillStyle='#6c6578';g.fillRect(sx-3*k,sy,6*k,3*k);g.save();g.translate(sx,sy);g.rotate(o.on?.7:-.7);g.fillStyle='#8a5a34';g.fillRect(-k,-10*k,2*k,10*k);g.fillStyle=o.on?'#55ff7a':'#e8506a';g.beginPath();g.arc(0,-10*k,2.5*k,0,7);g.fill();g.restore();return}
 if(o.kind==='rack'){g.fillStyle='#241a2c';g.fillRect(sx-10*k,sy-18*k,20*k,20*k);g.fillStyle='#8a5a34';g.fillRect(sx-9*k,sy-17*k,18*k,18*k);g.fillStyle='#5b3a22';g.fillRect(sx-9*k,sy-10*k,18*k,2*k);if(!rs[4]?.rack){g.fillStyle='#c9a34e';g.fillRect(sx-k,sy-16*k,2*k,15*k);g.strokeStyle='#c9a34e';g.lineWidth=2*k;g.beginPath();g.arc(sx+2*k,sy-16*k,3*k,Math.PI,0);g.stroke();g.fillStyle='#55c46a';g.fillRect(sx+3*k,sy-15*k,3*k,3*k)}return}
 if(o.kind==='prisoner'){art.draw(g,sx,sy+2*k,o.id,'sit',0,{scale:k*.5});return}
 if(o.kind==='sidedoor'){g.fillStyle='#241a2c';g.fillRect(sx-6*k,sy-14*k,12*k,28*k);g.fillStyle='#6b4425';g.fillRect(sx-5*k,sy-13*k,10*k,26*k);return}
}
function drawWrangler(e,sx,sy,t){
 const k=Z,pose=e.lunge>0?'attack':Math.abs(e.fx||0)>Math.abs(e.fy||0)?'walk':(e.fy||1)<0?'walkBack':'walkFront',n=art.poses[pose]||1,fr=Math.floor(e.anim*8)%n;
 g.fillStyle='rgba(15,10,20,.4)';g.beginPath();g.ellipse(sx,sy+3*k,7*k,2.5*k,0,0,7);g.fill();
 g.save();if(e.hurt>0)g.filter='brightness(2.4)';art.draw(g,sx,sy+3*k,'wrangler',pose,fr,{scale:k*.62,flip:(e.fx||0)<-.2});g.restore();
 if(e.kind==='army'||e.hp<e.max){g.fillStyle='#241a2c';g.fillRect(sx-8*k,sy-24*k,16*k,2.5*k);g.fillStyle='#e8506a';g.fillRect(sx-7.5*k,sy-23.5*k,15*k*Math.max(0,e.hp/e.max),1.5*k)}
 if(e.kind==='squad'&&!e.leave){g.font='bold '+(8*k)+'px system-ui';g.textAlign='center';g.fillText('❗',sx,sy-24*k+Math.sin(t*5)*k)}
 if(e.alert>0){g.font='bold '+(10*k)+'px system-ui';g.textAlign='center';g.fillStyle='#ff3b5c';g.fillText('!',sx,sy-26*k)}
}
function drawLockpick(t){
 const lp=lockpick,bw=Math.min(W*.8,520),bh=Math.max(26,H*.05),x=(W-bw)/2+(lp.shake>0?(Math.random()-.5)*14:0),y=H*.62;
 g.fillStyle='#120b1ce6';g.fillRect(x-12,y-50,bw+24,bh+76);g.fillStyle='#fff6e4';g.font='bold '+Math.round(bh*.55)+'px system-ui';g.textAlign='center';g.fillText('🔓 Pick the lock · '+lp.hits+'/3',W/2,y-18);
 g.fillStyle='#3a3245';g.fillRect(x,y,bw,bh);g.fillStyle='#ffd45c';g.fillRect(x+(lp.zone-lp.size)*bw,y,lp.size*2*bw,bh);
 g.fillStyle='#fff';g.fillRect(x+lp.pos*bw-3,y-6,6,bh+12);
}
function drawHud(){
 const hearts='<div class="hearts">'+'❤️'.repeat(Math.max(0,hp))+'🖤'.repeat(Math.max(0,MAXHP-hp))+'</div>';
 if(mode==='m2cmd'){hudEl.innerHTML='<div class="room">👑 You are the Boss Birman</div><div class="obj">'+(orders<4?'Give orders to the Wrangler squads (❗) — '+orders+'/4':'Go to the throne (bottom of the hall) and press 🐾 / E')+'</div>';return}
 if(mode==='m3climb'){hudEl.innerHTML=hearts+'<div class="room">🏰 Broken Fortress · '+(cp+1)+'/'+FC.length+'</div><div class="obj">'+(fClear(isl)?'Climb to the gate at the top. Bridges fall, platforms move!':'⚔️ Defeat the Wranglers to power the jump pad')+'</div>';return}
 if(mode==='m3boss'){hudEl.innerHTML=hearts+'<div class="room">👑 Boss Birman</div><div class="obj">'+(boss.phase===1?'Dodge the red warnings, hit him up close':boss.phase===2?'He\'s calling Wranglers! Keep fighting':'⚡ Admin power: finish him!')+'</div>';return}
 if(mode==='islands'){const I=ISL[isl];hudEl.innerHTML='<div class="hearts">'+'❤️'.repeat(Math.max(0,hp))+'🖤'.repeat(Math.max(0,MAXHP-hp))+'</div><div class="room">🏝️ Floating islands · '+(isl+1)+'/'+ISL.length+'</div><div class="obj">'+(I.crumble?'…':islClear(isl)?'Step on the glowing jump pad →':'⚔️ Defeat the Wranglers to power the jump pad')+'</div>';return}
 if(mode!=='play'){hudEl.innerHTML='';return}
 const st=rs[room]||{};objective();
 hudEl.innerHTML='<div class="hearts">'+'❤️'.repeat(Math.max(0,hp))+'🖤'.repeat(Math.max(0,MAXHP-hp))+'</div><div class="room">🏰 '+rooms[room].name+(C.crook?' · 🪝 Crook':'')+'</div><div class="obj">'+(st.obj||'')+'</div>';
}

// ================================================================== CUTSCENE 1 — THE TAXI (3D)
let taxiWorld=[];
function makeTaxiWorld(){const L=[];let x=0;while(x<13500){x+=40+Math.random()*110;L.push({x,depth:1.5+Math.random()*7,r:Math.random()})}
 for(let i=0;i<300;i++)L.push({x:6600+Math.random()*6800,depth:1.5+Math.random()*9,r:Math.random(),camp:true});
 return L.sort((a,b)=>b.depth-a.depth)}
const zoneAt=x=>x<2300?'cherry':x<4100?'marsh':x<5600?'terrace':x<6700?'poison':'camps';
const GROUND={cherry:['#cfe6a8','#bfdc96'],marsh:['#7fbf9a','#6aa98a'],terrace:['#c7e39b','#b5d488'],poison:['#7a5a8c','#6a4b7a'],camps:['#6d5b3f','#5c4b33']};
function drawScenery(o,sx,sy,k,t){
 const D=window.catCityDecor,z=o.camp?'camps':zoneAt(o.x),P=(a,b,w,hh,c)=>{g.fillStyle=c;g.fillRect(Math.round(sx+a*k),Math.round(sy+b*k),Math.max(1,Math.round(w*k)),Math.max(1,Math.round(hh*k)))};
 const dk=Math.max(1,Math.round(k*1.6));
 if(z==='cherry'){if(o.r<.55){P(-2,-22,4,22,'#6b4b2f');g.fillStyle='#f4a6c8';g.beginPath();g.arc(sx,sy-26*k,13*k,0,7);g.fill();g.fillStyle='#ffc7de';g.beginPath();g.arc(sx-4*k,sy-29*k,7*k,0,7);g.fill()}else D?.draw(g,o.r<.8?'flowerPink':'tulip',sx,sy,dk)}
 else if(z==='marsh'){if(o.r<.4){g.fillStyle='#3f7fb8';g.beginPath();g.ellipse(sx,sy,18*k,5*k,0,0,7);g.fill();D?.draw(g,'lily',sx,sy,dk)}else if(o.r<.75)D?.draw(g,'reeds',sx,sy,dk);else{P(-2,-20,4,20,'#5b4632');g.fillStyle='#5c9a5a';g.beginPath();g.arc(sx,sy-22*k,11*k,0,7);g.fill();g.fillStyle='#4b8a4a';for(let i=-2;i<=2;i++)P(i*4,-18,2,14,'#4b8a4a')}}
 else if(z==='terrace'){D?.draw(g,o.r<.33?'flowerYellow':o.r<.66?'flowerPink':o.r<.9?'tulip':'coconutFlower',sx,sy,dk)}
 else if(z==='poison'){if(o.r<.5)D?.draw(g,'toxicShroom',sx,sy,dk);else if(o.r<.8)D?.draw(g,'toxicBush',sx,sy,dk);else{P(-2,-24,3,24,'#3a2b2f');P(-8,-20,7,2,'#3a2b2f');P(1,-15,7,2,'#3a2b2f')}}
 else{ // Wrangler camps
  if(o.r<.55){if(D)D.draw(g,'campTent',sx,sy,dk);else{g.fillStyle='#73549d';g.beginPath();g.moveTo(sx-14*k,sy);g.lineTo(sx,sy-16*k);g.lineTo(sx+14*k,sy);g.fill()}}
  else if(o.r<.75){P(-1,-28,2,28,'#4a3a2a');P(1,-28,10,6,'#73549d');P(3,-27,3,3,'#f9df80')}
  else if(o.r<.9){P(-5,-2,10,3,'#4a3a2a');const f=Math.sin(t*14+o.x)*1.5;P(-3,-7+f*.3,6,5,'#ff8a3d');P(-1.5,-9+f*.4,3,4,'#ffe07a')}
  else art.draw(g,sx,sy,'wrangler','idle',Math.floor(t*4+o.x)%(art.poses.idle||1),{scale:k*.9});
 }
}
function drawTaxi3D(t){
 const T0=modeT;fit();g.imageSmoothingEnabled=false;
 const pan=ease(clamp((T0-12.6)/1.2,0,1)),off=pan*W*.58;
 // Cabin.
 g.fillStyle='#1d1527';g.fillRect(0,0,W,H);g.fillStyle='#2a2036';g.fillRect(0,0,W,H*.1);g.fillStyle='#33264a';g.fillRect(0,H*.7,W,H*.3);
 // The window.
 const wx=W*.2+off,wy=H*.12,ww=W*.74,wh=H*.52,travel=T0*560;
 g.save();g.beginPath();g.roundRect?g.roundRect(wx,wy,ww,wh,Math.min(ww,wh)*.08):g.rect(wx,wy,ww,wh);g.clip();
 const zone=zoneAt(travel),red=clamp((T0-9)/3,0,1);
 const sky=g.createLinearGradient(0,wy,0,wy+wh*.45);sky.addColorStop(0,red>0?'rgb('+Math.round(lerp(120,90,red))+','+Math.round(lerp(190,20,red))+','+Math.round(lerp(255,40,red))+')':'#78bdf0');sky.addColorStop(1,red>0?'rgb('+Math.round(lerp(255,200,red))+','+Math.round(lerp(220,80,red))+','+Math.round(lerp(200,60,red))+')':'#d8f0ff');
 g.fillStyle=sky;g.fillRect(wx,wy,ww,wh);
 const hz=wy+wh*.42,Hc=wh*.58*1.5,pxu=ww/900;
 // Far hills (slow parallax).
 g.fillStyle=red>.3?'#3a1a2a':'#8fbf8a';for(let i=-1;i<9;i++){const bx=wx+((i*ww/6+travel*pxu/40)%(ww*1.5))-ww*.25;g.beginPath();g.ellipse(bx,hz+2,ww*.14,wh*.08,0,Math.PI,0);g.fill()}
 // Perspective ground, tile by tile so the biomes roll past.
 for(let r=Math.ceil(hz);r<wy+wh;r+=3){const d=Hc/(r-hz+.001);if(d>14){g.fillStyle=GROUND[zone][0];g.fillRect(wx,r,ww,3);continue}
  const tw=160*pxu/d,cx=wx+ww/2,first=Math.floor((travel-(ww/2)/(pxu/d))/160)-1,lastT=Math.ceil((travel+(ww/2)/(pxu/d))/160)+1;
  for(let i=first;i<=lastT;i++){const X=i*160,sx=cx-(X-travel)*pxu/d-tw;const z=zoneAt(X);g.fillStyle=GROUND[z][(i&1)];g.fillRect(Math.floor(sx),r,Math.ceil(tw)+1,3)}
  const fog=clamp(d/16,0,.55);g.fillStyle=red>.4?'rgba(60,10,20,'+fog+')':'rgba(220,240,255,'+fog+')';g.fillRect(wx,r,ww,3)}
 // Scenery sprites, far first.
 for(const o of taxiWorld){const sx=wx+ww/2-(o.x-travel)*pxu/o.depth;if(sx<wx-80||sx>wx+ww+80)continue;const sy=hz+Hc/o.depth*.66,k=(ww/130)/o.depth;drawScenery(o,sx,sy,k,t)}
 // Glass glare.
 g.fillStyle='rgba(255,255,255,.08)';g.beginPath();g.moveTo(wx+ww*.1,wy);g.lineTo(wx+ww*.22,wy);g.lineTo(wx+ww*.05,wy+wh);g.lineTo(wx-ww*.07,wy+wh);g.fill();
 g.restore();
 g.strokeStyle='#0f0b14';g.lineWidth=Math.max(8,W*.012);g.beginPath();g.roundRect?g.roundRect(wx,wy,ww,wh,Math.min(ww,wh)*.08):g.rect(wx,wy,ww,wh);g.stroke();
 // Your paws on the window sill (first person).
 const coat=myCoat();for(const px of [wx+ww*.42,wx+ww*.58]){g.fillStyle='#241a2c';g.beginPath();g.ellipse(px,wy+wh+H*.05,W*.05,H*.05,0,0,7);g.fill();g.fillStyle=coat;g.beginPath();g.ellipse(px,wy+wh+H*.05,W*.045,H*.044,0,0,7);g.fill();g.fillStyle='#ef8fa5';for(let i=-1;i<=1;i++){g.beginPath();g.arc(px+i*W*.014,wy+wh+H*.03,W*.007,0,7);g.fill()}}
 // The driver (front seat, to your left).
 const dx=-W*.28+off,seatY=H*.42,R=Math.min(W,H)*.13;
 g.fillStyle='#4a1f2c';g.beginPath();g.roundRect?g.roundRect(dx-R*1.5,seatY,R*3,H,R*.4):g.rect(dx-R*1.5,seatY,R*3,H);g.fill();
 const turn=clamp((T0-13.9)/.5,0,1),hoodDown=clamp((T0-14.7)/.5,0,1),swing=clamp((T0-15.7)/.55,0,1);
 if(turn<.5){g.fillStyle='#2b2733';g.beginPath();g.arc(dx,seatY-R*.2,R,0,7);g.fill();g.beginPath();g.moveTo(dx-R*.9,seatY-R*.6);g.lineTo(dx,seatY-R*1.7);g.lineTo(dx+R*.9,seatY-R*.6);g.fill();g.fillStyle='#3a3545';g.fillRect(dx-R*.1,seatY-R*1.2,R*.2,R*1.6)}
 else{
  g.save();if(hoodDown<1){g.beginPath();g.arc(dx,seatY-R*.2,R*1.05,0,7);g.rect(dx-R*2,seatY-R*3+hoodDown*R*2,R*4,R*4);g.clip()}
  art.draw(g,dx,seatY+R*1.1,'wrangler','walkFront',0,{scale:R/9});g.restore();
  if(hoodDown<1){g.fillStyle='#2b2733';g.save();g.globalAlpha=1-hoodDown;g.beginPath();g.arc(dx,seatY-R*.2-hoodDown*R*.8,R*1.05,Math.PI*1.05,Math.PI*1.95);g.lineTo(dx,seatY-R*1.7-hoodDown*R*.8);g.fill();g.restore()}
  // Glowing eyes.
  if(Math.floor(t*5)%3){g.fillStyle='rgba(249,223,128,.5)';g.beginPath();g.arc(dx-R*.3,seatY-R*.3,R*.12,0,7);g.arc(dx+R*.3,seatY-R*.3,R*.12,0,7);g.fill()}
 }
 if(T0>15.3){const a=lerp(-2.4,.5,ease(swing)),len=R*2.2*(1+swing*1.6),bx=dx+R*1.2+swing*W*.2,by=seatY+R*.3;g.save();g.translate(bx,by);g.rotate(a);g.fillStyle='#6b4b2f';g.fillRect(-R*.12,-len,R*.24,len);g.fillStyle='#55c46a';g.beginPath();g.arc(0,-len,R*.35*(1+swing),0,7);g.fill();g.fillStyle='#8fe08a';g.beginPath();g.arc(-R*.1,-len-R*.1,R*.18*(1+swing),0,7);g.fill();g.restore()}
 // Captions.
 const lines=[[.6,3.6,'🚕 You hop in. The driver keeps his hood up and says nothing…'],[3.9,6.6,'💭 Cherry Grove… Lily Marsh… so pretty from in here.'],[7,9.2,'💭 The Poison Wastes? This isn\'t the way home…'],[9.4,12.4,'💭 Tents. Flags. Campfires… those are Catnip Wrangler camps. HUNDREDS of them.'],[12.6,14.6,'💭 Um… driver?'],[14.8,15.8,'🦹 "You should\'ve walked, kitty."']];
 if(T0>14.8&&!said.walk){said.walk=1;voice('c01')}
 const cur=lines.find(l=>T0>=l[0]&&T0<l[1]);sayEl.style.display=cur?'block':'none';if(cur)sayEl.textContent=cur[2];
 if(T0<.8){g.fillStyle='rgba(0,0,0,'+(1-T0/.8)+')';g.fillRect(0,0,W,H)}
 if(swing>=1){if(!drawTaxi3D.bonked){drawTaxi3D.bonked=true;SFX.bonk()}const after=T0-16.25;g.fillStyle=after<.12?'#fff':'#000';g.fillRect(0,0,W,H);
  if(after>.6){g.fillStyle='#e9dcff';g.font='bold '+Math.round(Math.min(W,H)*.05)+'px system-ui';g.textAlign='center';g.fillText(after<1.6?'💫':after<2.6?'💫 …':'💫 … everything goes dark.',W/2,H/2)}
  if(after>3.6){drawTaxi3D.bonked=false;C.seenTaxi=true;core.persist();sayEl.style.display='none';setMode('play');wake=1.8;room=0;roomIntro()}}
 if(T0<16.25&&T0>9){g.fillStyle='rgba(255,0,0,'+(Math.sin(T0*3)*.03+.03)+')';g.fillRect(0,0,W,H)}
}

// ================================================================== CUTSCENE 2 — BISCUIT'S PAINTING
const TEX=1400,LINE=760;let vtex=null,drips=[];
function villageTex(){if(vtex)return vtex;vtex=document.createElement('canvas');vtex.width=vtex.height=TEX;const x=vtex.getContext('2d'),F=window.catCityFloors;
 if(F){F.fill(x,'town',0,0,TEX,TEX);F.fill(x,'path',TEX/2-130,0,260,TEX);F.fill(x,'path',0,LINE-90,TEX,180)}else{x.fillStyle='#a8d49a';x.fillRect(0,0,TEX,TEX);x.fillStyle='#e8d9b0';x.fillRect(TEX/2-130,0,260,TEX)}return vtex}
function project(cam,wx,wy){const f=cam.y-wy,l=wx-cam.x;if(f<6)return null;return {sx:W/2+l*cam.focal/f,sy:cam.horizon*H+cam.h*cam.focal/f,k:cam.focal/f,f}}
function drawPaintingClose(t,who,label,zoom){
 g.fillStyle='#2a2333';g.fillRect(0,0,W,H);
 for(let y=0;y<H;y+=28)for(let x=(y/28%2)*24;x<W;x+=48){g.fillStyle='#3a3245';g.fillRect(x,y,46,26)}
 const pw=Math.min(W*.55,H*.62)*zoom,ph=pw*1.15,x=W/2-pw/2,y=H*.46-ph/2;
 g.fillStyle='#241a2c';g.fillRect(x-pw*.08,y-pw*.08,pw*1.16,ph+pw*.16);g.fillStyle='#c8952b';g.fillRect(x-pw*.06,y-pw*.06,pw*1.12,ph+pw*.12);g.fillStyle='#ffd45c';g.fillRect(x-pw*.06,y-pw*.06,pw*1.12,pw*.02);
 g.fillStyle='#2e4a3a';g.fillRect(x,y,pw,ph);const gr=g.createRadialGradient(W/2,y+ph*.45,0,W/2,y+ph*.45,pw*.7);gr.addColorStop(0,'rgba(255,230,160,.25)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x,y,pw,ph);
 g.save();g.beginPath();g.rect(x,y,pw,ph);g.clip();art.draw(g,W/2,y+ph*1.02,who,'idle',0,{scale:pw/22});g.restore();
 g.fillStyle='#c8952b';g.fillRect(W/2-pw*.3,y+ph+pw*.1,pw*.6,pw*.11);g.fillStyle='#241a2c';g.font='bold '+Math.round(pw*.06)+'px Georgia,serif';g.textAlign='center';g.fillText(label,W/2,y+ph+pw*.18);
}
function drawBiscuit3D(t){
 const T0=modeT;fit();g.imageSmoothingEnabled=false;
 if(T0<3.6){drawPaintingClose(t,'biscuit','Sir Biscuit',1+T0*.06);if(T0>2.4){g.fillStyle='rgba(255,250,235,'+clamp((T0-2.4)/1.2,0,1)+')';g.fillRect(0,0,W,H)}}
 else if(T0<12.4){
  const p=clamp((T0-3.6)/8.8,0,1),tex=villageTex(),cam={x:TEX/2+Math.sin(T0*.5)*90,y:LINE+lerp(520,170,ease(p)),h:lerp(70,34,ease(p)),horizon:.42,focal:Math.min(W,H)*1.15};
  const hz=cam.horizon*H,sky=g.createLinearGradient(0,0,0,hz);sky.addColorStop(0,'#7ec4f2');sky.addColorStop(1,'#fff1d6');g.fillStyle=sky;g.fillRect(0,0,W,hz+1);
  for(let r=Math.ceil(hz)+1;r<H;r+=2){const d=cam.h*cam.focal/(r-hz),span=W*d/cam.focal,wy=cam.y-d;if(wy<0||wy>=TEX){g.fillStyle='#8cbd7a';g.fillRect(0,r,W,2);continue}g.drawImage(tex,cam.x-span/2,wy,span,1,0,r,W,2);const fog=Math.min(.5,d/2600);if(fog>.02){g.fillStyle='rgba(255,241,214,'+fog.toFixed(3)+')';g.fillRect(0,r,W,2)}}
  // Cottages around the square.
  const list=[];for(const [hx,hy,c] of [[TEX/2-330,LINE-260,'#f5b2ae'],[TEX/2+330,LINE-260,'#d9b5ee'],[TEX/2-420,LINE-40,'#b3d9ed'],[TEX/2+420,LINE-40,'#f4c879'],[TEX/2-200,LINE-460,'#a7dd9b'],[TEX/2+220,LINE-480,'#c9b2ed']]){const pr=project(cam,hx,hy);if(pr)list.push({f:pr.f,draw:()=>{const w=120*pr.k,hh=90*pr.k;g.fillStyle='#241a2c';g.fillRect(pr.sx-w/2-2,pr.sy-hh-2,w+4,hh+4);g.fillStyle=c;g.fillRect(pr.sx-w/2,pr.sy-hh,w,hh);g.fillStyle='#806aa0';g.beginPath();g.moveTo(pr.sx-w*.62,pr.sy-hh);g.lineTo(pr.sx,pr.sy-hh*1.65);g.lineTo(pr.sx+w*.62,pr.sy-hh);g.fill();g.fillStyle='#fff0b5';g.fillRect(pr.sx-w*.08,pr.sy-hh*.45,w*.16,hh*.45)}})}
  const bp=project(cam,TEX/2,LINE);
  if(bp)list.push({f:bp.f,draw:()=>{
   const sc=1.9*bp.k,top=bp.sy-29.5*sc,bot=bp.sy+2.5*sc,peel=clamp((T0-6.2)/3.4,0,1),line=lerp(top,bot+4,peel);
   g.fillStyle='rgba(30,20,40,.3)';g.beginPath();g.ellipse(bp.sx,bp.sy,20*bp.k*1.9,6*bp.k,0,0,7);g.fill();
   // The puddle of paint grows as it drips off.
   if(peel>0){g.fillStyle='#8a5f37';g.beginPath();g.ellipse(bp.sx,bp.sy+2*bp.k,(8+peel*26)*bp.k*1.4,(3+peel*7)*bp.k,0,0,7);g.fill();g.fillStyle='#b88655';g.beginPath();g.ellipse(bp.sx-4*bp.k,bp.sy+1*bp.k,(5+peel*16)*bp.k*1.4,(2+peel*4)*bp.k,0,0,7);g.fill()}
   art.draw(g,bp.sx,bp.sy,'biscuitBirman','idle',0,{scale:sc});
   g.save();g.beginPath();g.rect(0,line,W,H);g.clip();art.draw(g,bp.sx,bp.sy,'biscuit','idle',0,{scale:sc});g.restore();
   if(peel>0&&peel<1){if(Math.random()<.7)drips.push({x:bp.sx+(Math.random()-.5)*28*sc,y:line,v:0,c:['#b88655','#8a5f37','#d5a776'][Math.floor(Math.random()*3)],w:(1+Math.random()*2)*sc*.6});
    // Wobbly paint edge.
    g.fillStyle='#b88655';for(let i=-8;i<=8;i++){const xx=bp.sx+i*sc*1.6,yy=line+Math.sin(i*1.7+T0*6)*sc*1.2;g.fillRect(xx,yy-sc,sc*1.6,sc*2.2)}}
   for(const d of drips){d.v+=H*.0009;d.y+=d.v;g.fillStyle=d.c;g.fillRect(d.x,d.y-d.w*3,d.w,d.w*3)}drips=drips.filter(d=>d.y<bp.sy);
  }});
  list.sort((a,b)=>b.f-a.f);for(const it of list)it.draw();
  if(T0<4.6){g.fillStyle='rgba(255,250,235,'+(1-(T0-3.6))+')';g.fillRect(0,0,W,H)}
  if(T0>11.2){g.fillStyle='rgba(255,250,235,'+clamp((T0-11.2)/1.2,0,1)+')';g.fillRect(0,0,W,H)}
 }
 else{drawPaintingClose(t,'biscuitBirman','Sir Biscuit',1.1);if(T0<13.4){g.fillStyle='rgba(255,250,235,'+(1-(T0-12.4))+')';g.fillRect(0,0,W,H)}}
 const lines=[[.3,2.6,'💭 Wait… that\'s BISCUIT. Why is Biscuit in the Birman family tree?'],[4.2,6.2,'Cat Village. Biscuit, the brave adventurer who sends you on every quest…'],[6.4,9.6,'…the paint is running. It\'s dripping right off him!'],[9.8,12.2,'💭 Cream fur. Blue eyes. White gloves…'],[13,16.4,'💭 Biscuit… is a BIRMAN?!']];
 const cur=lines.find(l=>T0>=l[0]&&T0<l[1]);sayEl.style.display=cur?'block':'none';if(cur)sayEl.textContent=cur[2];
 if(T0>16.6)finishBiscuit();
}
function finishBiscuit(){C.biscuit=true;core.persist();objs.forEach(o=>{if(o.who==='biscuit')o.who='biscuitBirman'});drips=[];sayEl.style.display='none';setMode('play');say('🖼️ The painting has changed. Biscuit… a Birman. Keep going.',3200);objective();window.catCityLevels?.add?.(40,'story')}

// ================================================================== CUTSCENE 3 — THE ADMIN IS DRAGGED IN
function adminImg(){return window.catCityAdminBirman?.owner?.(false)||null}
function drawAdmin(x,y,k,pose,t){
 // pose: kneel (dragged), fly (thrown), lie (on her back, arms and legs out).
 const img=adminImg();g.save();g.translate(x,y);
 if(pose==='lie'){g.scale(1,.55);g.rotate(-Math.PI/2)}
 if(pose==='fly')g.rotate(-Math.PI/2*clamp(t,0,1));
 if(pose==='prop')g.rotate(-Math.PI/2*.62);
 if(img){const w=img.width*k*.9,hh=img.height*k*.9,sq=pose==='kneel'?.78:1;g.drawImage(img,-w/2,-hh*sq,w,hh*sq)}
 else art.draw(g,0,0,'harley',pose==='lie'?'sleep':'hurt',0,{scale:k*1.2});
 g.restore();
}
// 3D: the Great Hall as a perspective floor, everyone as upright sprites.
let htex=null,htexF=null;
function hallTex(){if(htex)return;htex=document.createElement('canvas');htex.width=htex.height=TEX;const x=htex.getContext('2d');
 for(let ty=0;ty<TEX;ty+=64)for(let tx=0;tx<TEX;tx+=64){x.fillStyle=((tx+ty)/64)%2?'#5d5668':'#534c60';x.fillRect(tx,ty,64,64);x.fillStyle='#46405a';x.fillRect(tx,ty,64,3);x.fillRect(tx,ty,3,64)}
 x.fillStyle='#c8952b';x.fillRect(TEX/2-176,0,352,TEX);x.fillStyle='#7a2236';x.fillRect(TEX/2-164,0,328,TEX);x.fillStyle='#8f2b42';for(let y=0;y<TEX;y+=48)x.fillRect(TEX/2-150,y+8,300,30);
 htexF=document.createElement('canvas');htexF.width=htexF.height=TEX;const y=htexF.getContext('2d');y.translate(TEX,0);y.scale(-1,1);y.drawImage(htex,0,0)}
function proj3(cam,wx,wy){const f=cam.dir<0?cam.y-wy:wy-cam.y,l=cam.dir<0?wx-cam.x:cam.x-wx;if(f<4)return null;return {sx:W/2+l*cam.focal/f,sy:cam.horizon*H+cam.h*cam.focal/f,k:cam.focal/f,f}}
function hallFloor(cam,t){
 const hz=cam.horizon*H;
 // Back wall: dark stone, torches and Birman banners.
 g.fillStyle='#2a2333';g.fillRect(0,0,W,hz+1);g.fillStyle='#231d2c';for(let y=hz-8;y>0;y-=18)g.fillRect(0,y,W,3);
 for(let i=-2;i<8;i++){const x=((i*W/4.5-cam.x*.6*cam.dir)%(W*1.6)+W*1.6)%(W*1.6)-W*.3;g.fillStyle='#4b2f6b';g.fillRect(x,hz*.25,W*.07,hz*.5);g.fillStyle='#ffd45c';g.fillRect(x+W*.025,hz*.4,W*.02,W*.02);
  const tx=x+W*.11,ty=hz*.45,r=W*.05+Math.sin(t*9+i)*3,gr=g.createRadialGradient(tx,ty,0,tx,ty,r);gr.addColorStop(0,'rgba(255,170,70,.55)');gr.addColorStop(1,'rgba(255,170,70,0)');g.fillStyle=gr;g.fillRect(tx-r,ty-r,r*2,r*2);g.fillStyle='#ffb347';g.fillRect(tx-3,ty-4,6,8)}
 for(let r=Math.ceil(hz)+1;r<H;r+=2){const d=cam.h*cam.focal/(r-hz),span=W*d/cam.focal,wy=cam.dir<0?cam.y-d:cam.y+d;if(wy<0||wy>=TEX){g.fillStyle='#2a2333';g.fillRect(0,r,W,2);continue}
  if(cam.dir<0)g.drawImage(htex,cam.x-span/2,wy,span,1,0,r,W,2);else g.drawImage(htexF,TEX-(cam.x+span/2),wy,span,1,0,r,W,2);
  const fog=Math.min(.55,d/1800);if(fog>.02){g.fillStyle='rgba(18,10,26,'+fog.toFixed(3)+')';g.fillRect(0,r,W,2)}}
}
let cineKO=false;
function drawPanel(x,y,k,t,broken){
 if(broken>=1)return;
 g.save();g.globalAlpha=broken>0?1-broken:(.75+Math.random()*.25);const w=46*k,hh=26*k,jx=(Math.random()-.5)*3*k;
 if(broken>0){for(let i=0;i<12;i++){const a=i/12*6.28,r=broken*50*k;g.fillStyle=i%2?'#c9b2ed':'#ffd45c';g.fillRect(x+Math.cos(a)*r,y-hh/2+Math.sin(a)*r,4*k,3*k)}g.restore();return}
 g.fillStyle='#241a2c';g.fillRect(x-w/2-k+jx,y-hh-k,w+2*k,hh+2*k);g.fillStyle='#4b2f6b';g.fillRect(x-w/2+jx,y-hh,w,hh);g.fillStyle='#ffd45c';g.font='bold '+Math.round(5*k)+'px system-ui';g.textAlign='center';g.fillText('👑 ADMIN',x+jx,y-hh+7*k);
 g.fillStyle='#c9b2ed';for(let i=0;i<3;i++)g.fillRect(x-w/2+4*k+jx,y-hh+10*k+i*5*k,w-8*k-(Math.random()*12*k),2.5*k);
 if(Math.random()<.3){g.fillStyle='rgba(255,59,92,.6)';g.fillRect(x-w/2,y-hh+Math.random()*hh,w,2*k)}g.restore();
}
// World spots (camera looks towards -y; the back wall is at y≈200).
const HD={door:{x:TEX/2-460,y:470},mid:{x:TEX/2-40,y:520},land:{x:TEX/2+10,y:640},pWall:{x:TEX/2-200,y:300},gWall:{x:TEX/2+200,y:300},you:{x:TEX/2+230,y:560},bossIn:{x:TEX/2+380,y:230}};
function dragState(T0){
 const st={};const pulls=clamp((T0-1.2)/3.8,0,1),step=Math.floor(pulls*6)/6+ease((pulls*6)%1)/6;
 st.a={x:lerp(HD.door.x,HD.mid.x,Math.min(1,step)),y:lerp(HD.door.y,HD.mid.y,Math.min(1,step)),pose:'kneel',ft:0,lift:0};
 const thrown=clamp((T0-5)/.8,0,1);
 if(T0>5){st.a={x:lerp(HD.mid.x,HD.land.x,thrown),y:lerp(HD.mid.y,HD.land.y,thrown),lift:Math.sin(thrown*Math.PI)*60,pose:thrown<1?'fly':'lie',ft:thrown}}
 if(T0>7.2&&T0<12.5)st.a.pose='prop';
 const back=ease(clamp((T0-5.8)/1.2,0,1));
 st.p={x:T0<5?st.a.x-34:lerp(HD.mid.x-30,HD.pWall.x,back),y:T0<5?st.a.y+4:lerp(HD.mid.y,HD.pWall.y,back),walk:T0<5||(T0>5.8&&T0<7)};
 st.g={x:T0<5?st.a.x+36:lerp(HD.mid.x+40,HD.gWall.x,back),y:T0<5?st.a.y-6:lerp(HD.mid.y,HD.gWall.y,back),walk:st.p.walk};
 // Boss Birman: in from the back door, punches you, then goes for her.
 const toYou=ease(clamp((T0-7.4)/2.6,0,1)),toHer=ease(clamp((T0-10.8)/1.4,0,1)),youS={x:HD.you.x,y:HD.you.y-70},herS={x:HD.land.x-80,y:HD.land.y+70};
 st.b={x:lerp(lerp(HD.bossIn.x,youS.x,toYou),herS.x,toHer),y:lerp(lerp(HD.bossIn.y,youS.y,toYou),herS.y,toHer),vis:T0>7.4,walk:(T0>7.4&&T0<10)||(T0>10.8&&T0<12.2)};
 st.youKO=T0>10.5;return st;
}
function camFor(T0,st){
 const M=Math.min(W,H);
 if(T0<5.2)return {x:lerp(TEX/2-260,st.a.x+60,.6),y:1000,h:34,dir:-1,horizon:.42,focal:M*1.25};
 if(T0<7.4)return {x:TEX/2-20,y:lerp(1060,1000,ease(clamp((T0-5.2)/2,0,1))),h:44,dir:-1,horizon:.4,focal:M*1.2};
 // Low and in front of the Boss Birman as he stalks towards you.
 if(T0<10.15)return {x:st.b.x+60,y:st.b.y+250,h:22,dir:-1,horizon:.46,focal:M*1.1};
 // Your eyes: the fist comes straight at you.
 if(T0<10.8)return {x:HD.you.x,y:HD.you.y,h:26,dir:-1,horizon:.44,focal:M*1.2};
 // Low on the floor: his feet in front, her trying to get up, you knocked out behind.
 return {x:HD.land.x+40,y:HD.land.y+250,h:8,dir:-1,horizon:.5,focal:M*1.0};
}
function drawDrag(t){
 const T0=modeT;fit();g.imageSmoothingEnabled=false;hallTex();
 const st=dragState(T0),cam=camFor(T0,st);cineKO=st.youKO;
 if(camShake>0){cam.x+=(Math.random()-.5)*camShake*40;camShake=Math.max(0,camShake-1/60)}
 hallFloor(cam,t);
 if(T0>5&&!said.iyg){said.iyg=1;voice('c02')}
 if(T0>7.7&&!said.www){said.www=1;voice('c03')}
 if(T0>5.8&&!drawDrag.thud){drawDrag.thud=1;SFX.bonk();camShake=.35}
 if(T0>10.45&&drawDrag.thud===1){drawDrag.thud=2;SFX.bonk();camShake=.5}
 if(T0>12.4&&drawDrag.thud===2){drawDrag.thud=3;SFX.bonk();camShake=.5}
 if(T0>13.4&&drawDrag.thud===3){drawDrag.thud=4;beep(3400,2.6,'sine',.025)}
 const L=[];
 const add=(w,fn)=>{const pr=proj3(cam,w.x,w.y);if(pr)L.push({f:pr.f,draw:()=>fn(pr)})};
 const shadow=(pr,r)=>{g.fillStyle='rgba(15,10,20,.4)';g.beginPath();g.ellipse(pr.sx,pr.sy,r*pr.k,r*.28*pr.k,0,0,7);g.fill()};
 const flipFor=(dx)=>cam.dir<0?dx<0:dx>0;
 if(T0>.9){
  add(st.p,pr=>{shadow(pr,16);art.draw(g,pr.sx,pr.sy,'wrangler',st.p.walk?'walk':'idle',Math.floor(t*7)%(art.poses.walk||1),{scale:1.9*pr.k,flip:flipFor(T0<5?-1:1)})});
  add(st.g,pr=>{shadow(pr,16);g.save();g.filter='hue-rotate(150deg) saturate(1.7) brightness(1.3)';art.draw(g,pr.sx,pr.sy,'wrangler',st.g.walk?'walk':'idle',Math.floor(t*7+2)%(art.poses.walk||1),{scale:1.9*pr.k,flip:flipFor(-1)});g.restore()});
  add(st.a,pr=>{shadow(pr,18);drawAdmin(pr.sx,pr.sy-st.a.lift*pr.k,2.2*pr.k,st.a.pose,st.a.ft);
   if(T0>11.2&&T0<12.9)drawPanel(pr.sx+30*pr.k,pr.sy-40*pr.k,1.6*pr.k,t,clamp((T0-12.4)/.4,0,1))});
 }
 // You (unless this is your own point of view).
 if(!(T0>10.15&&T0<10.8))add(HD.you,pr=>{shadow(pr,16);drawMe(g,pr.sx,pr.sy,1.9*pr.k,st.youKO?'sleep':'idle',0,false)});
 if(st.b.vis&&!(T0>10.15&&T0<10.8)){const lunge=T0>12.1&&T0<12.6?Math.sin((T0-12.1)/.5*Math.PI):0;
  add(st.b,pr=>{shadow(pr,26);const sc=2.2*pr.k;window.catCityBirmanArt?.draw?.(g,pr.sx-lunge*20*pr.k,pr.sy-9.5*sc+(st.b.walk?Math.abs(Math.sin(t*9))*-3*pr.k:0),'armour',{hp:1,max:1,t,scale:sc})})}
 L.sort((a,b)=>b.f-a.f);for(const it of L)it.draw();
 // Your point of view: the Boss Birman fills the screen and swings.
 if(T0>10.15&&T0<10.8){const p=clamp((T0-10.15)/.45,0,1),sc=Math.min(W,H)/38*(1+p*.6);window.catCityBirmanArt?.draw?.(g,W/2,H*.52,'armour',{hp:1,max:1,t,scale:sc});
  const fr=Math.min(W,H)*(.12+p*1.1);g.fillStyle='#ffffff';g.beginPath();g.arc(W*.62-p*W*.12,H*.55,fr,0,7);g.fill();g.fillStyle='#ddd9e6';g.beginPath();g.arc(W*.62-p*W*.12+fr*.2,H*.55+fr*.15,fr*.8,0,7);g.fill();
  if(p>=1){g.fillStyle='#fff';g.fillRect(0,0,W,H)}}
 if(T0<1.3){const a=clamp(T0/.3,0,1)*(1-clamp((T0-.8)/.5,0,1)),pr=proj3(cam,HD.door.x,HD.door.y);if(pr){g.fillStyle='rgba(255,240,200,'+(.55*a)+')';g.fillRect(pr.sx-40*pr.k,pr.sy-110*pr.k,80*pr.k,110*pr.k)}}
 // Shot cuts flash briefly.
 for(const c of [5.2,7.4,10.8])if(T0>c&&T0<c+.08){g.fillStyle='#000';g.fillRect(0,0,W,H)}
 const lb=H*.11*clamp(T0/.5,0,1);g.fillStyle='#000';g.fillRect(0,0,W,lb);g.fillRect(0,H-lb,W,lb);
 if(T0>12.9){const p=clamp((T0-12.9)/2,0,1);g.fillStyle='rgba(30,22,8,'+(p*.92)+')';g.fillRect(0,0,W,H);for(let i=0;i<6;i++){g.fillStyle='rgba(90,70,30,'+(.08*p)+')';g.beginPath();g.ellipse(W*(.2+i*.13),H*(.4+Math.sin(i+T0)*.1),W*.2,H*.12,0,0,7);g.fill()}}
 const lines=[[.2,1.8,'💥 A side door slams open—'],[1.9,5,'💭 Two Wranglers… dragging someone in…'],[5,5.9,'"In you go!"'],[6,7.4,'💭 No… that\'s the ADMIN! They caught Elidagoat!'],[7.6,10.1,'👑 BOSS BIRMAN: "Well, well, well… what has the cat dragged in?"'],[11.2,12.4,'💭 He\'s trying to open his admin panel—'],[13.4,15.6,'…eeeeeeeeeeeeeee…']];
 const cur=lines.find(l=>T0>=l[0]&&T0<l[1]);sayEl.style.display=cur?'block':'none';if(cur)sayEl.textContent=cur[2];
 if(T0>16){drawDrag.thud=0;cineKO=false;said.iyg=said.www=0;finishChapter1();setMode('abyss')}
}
// ================================================================== CHAPTER 2
const voice=id=>{try{window.catCityVoice?.play?.(id)}catch(e){}};
const said={};const sayOnce=(key,id)=>{if(!said[key]){said[key]=1;voice(id)}};
// ---------------------------------------------------------------- the abyss: Biscuit whispers "I'm sorry"
let dust=[];
function drawAbyss(t){
 const T0=modeT;fit();g.fillStyle='#000';g.fillRect(0,0,W,H);
 if(T0<2.4){g.textAlign='center';g.globalAlpha=clamp(T0/.6,0,1)*clamp((2.4-T0)/.6,0,1);g.fillStyle='#ffd45c';g.font='bold '+Math.round(Math.min(W,H)*.055)+'px system-ui';g.fillText('Chapter 2',W/2,H*.45);g.fillStyle='#e9dcff';g.font='bold '+Math.round(Math.min(W,H)*.03)+'px system-ui';g.fillText('The Island Run',W/2,H*.45+Math.min(W,H)*.07);g.globalAlpha=1;return}
 const A=T0-2.4;
 if(dust.length<90)for(let i=0;i<4;i++)dust.push({x:Math.random()*W,y:Math.random()*H,v:.2+Math.random()*.6,s:1+Math.random()*2});
 g.fillStyle='rgba(200,190,230,.35)';for(const d of dust){d.y-=d.v;d.x+=Math.sin(t+d.y*.01)*.2;if(d.y<0)d.y=H;g.fillRect(d.x,d.y,d.s,d.s)}
 // A soft light from above, Biscuit standing in it, then walking away into the dark.
 const away=clamp((A-5.2)/2.6,0,1),sc=Math.min(W,H)/32*lerp(.42,.2,away)*(1+A*.015),bx=W/2,by=lerp(H*.72,H*.5,away);
 const fade=clamp(A/1.5,0,1)*(1-clamp((A-7)/1.2,0,1));
 const gr=g.createRadialGradient(bx,by-sc*12,0,bx,by-sc*12,sc*26);gr.addColorStop(0,'rgba(255,240,200,'+(.22*fade)+')');gr.addColorStop(1,'rgba(255,240,200,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.save();g.globalAlpha=fade;g.fillStyle='rgba(255,255,255,.08)';g.beginPath();g.ellipse(bx,by+sc,sc*14,sc*3,0,0,7);g.fill();
 art.draw(g,bx,by,'biscuitBirman',away>0?'walkBack':'idle',away>0?Math.floor(t*4)%2:0,{scale:sc});g.restore();
 if(A>2.6)sayOnce('sorry','c04');
 const cur=A>2.4&&A<5?'…I\'m sorry.':'';sayEl.style.display=cur?'block':'none';sayEl.textContent=cur;sayEl.style.fontStyle=cur?'italic':'';
 if(A>8.6){sayEl.style.fontStyle='';dust=[];setMode('wake')}
}
// ---------------------------------------------------------------- waking up (camera copies the phone clip: face on the floor, wobble, settle sideways, get up)
let off=null,og=null;
const WAKE=[[0,{x:0,h:2,hz:.04,roll:-10,blur:16}],[1,{x:20,h:3,hz:.08,roll:-18,blur:12}],[2,{x:-30,h:5,hz:.14,roll:-30,blur:8}],[2.6,{x:110,h:9,hz:.44,roll:-58,blur:5}],[3.6,{x:-170,h:10,hz:.5,roll:-76,blur:4}],[4.9,{x:70,h:9,hz:.46,roll:-60,blur:3.5}],[6.3,{x:-130,h:9,hz:.5,roll:-82,blur:3}],[7.6,{x:0,h:9,hz:.47,roll:-88,blur:2.2}],[10.4,{x:10,h:9,hz:.47,roll:-90,blur:1.6}],[12.2,{x:0,h:34,hz:.42,roll:0,blur:0}]];
function wakeCam(T0){let a=WAKE[0],b=WAKE[WAKE.length-1];for(let i=0;i<WAKE.length-1;i++)if(T0>=WAKE[i][0]&&T0<WAKE[i+1][0]){a=WAKE[i];b=WAKE[i+1];break}
 const p=a===b?1:ease(clamp((T0-a[0])/(b[0]-a[0]),0,1)),o={};for(const k in a[1])o[k]=lerp(a[1][k],b[1][k],p);
 const shake=T0<10.4?(1-T0/10.4):0;o.x+=Math.sin(T0*2.3)*14*shake;o.roll+=Math.sin(T0*1.7)*4*shake;return o}
let rtex=null;
function roomTex(){if(rtex)return rtex;rtex=document.createElement('canvas');rtex.width=rtex.height=TEX;const x=rtex.getContext('2d');
 for(let ty=0;ty<TEX;ty+=56)for(let tx=0;tx<TEX;tx+=56){x.fillStyle=((tx+ty)/56)%2?'#4f4a5c':'#48435a';x.fillRect(tx,ty,56,56);x.fillStyle='#3d384c';x.fillRect(tx,ty,56,2);x.fillRect(tx,ty,2,56)}
 x.fillStyle='#5b2a3a';x.fillRect(TEX/2-220,560,440,300);x.fillStyle='#6d3448';x.fillRect(TEX/2-200,580,400,260);return rtex}
// The back wall: stone, a door on the right, a window on the left, and the board.
const SCRAWL=[];for(let i=0;i<22;i++)SCRAWL.push({x:.15+Math.random()*.7,y:.1+Math.random()*.85,r:(Math.random()-.5)*.5,s:.022+Math.random()*.03,c:['#e8506a','#fff6e4','#ffd45c','#ff8a8a'][i%4]});
function backWall(cam,t,opt={}){
 const hz=cam.horizon*H,M=Math.min(W,H),px=-(cam.x-TEX/2)*.9;
 g.fillStyle='#2a2333';g.fillRect(0,0,W,hz+1);g.fillStyle='#231d2c';for(let y=hz-6;y>0;y-=20)g.fillRect(0,y,W,3);
 // Board.
 const bw=Math.min(M*.72,W*.48),bh=hz*.62,bx=W/2-bw/2+px,by=hz*.18;g.fillStyle='#241a2c';g.fillRect(bx-8,by-8,bw+16,bh+16);g.fillStyle='#8a5a34';g.fillRect(bx-5,by-5,bw+10,bh+10);g.fillStyle='#2e3d33';g.fillRect(bx,by,bw,bh);
 g.save();g.beginPath();g.rect(bx,by,bw,bh);g.clip();g.textAlign='center';
 for(const s of SCRAWL){g.save();g.translate(bx+s.x*bw,by+s.y*bh);g.rotate(s.r);g.font='bold '+Math.round(M*s.s)+'px "Comic Sans MS","Marker Felt",cursive';g.fillStyle=s.c;g.globalAlpha=.85;g.fillText('WHERE ARE YOU BISCUIT',0,0);g.restore()}
 g.restore();
 // Window (left) and door (right).
 const ww=Math.min(M*.26,W*.2),wx=bx-ww-W*.03,wy=hz*.2,wh=hz*.52;g.fillStyle='#241a2c';g.fillRect(wx-6,wy-6,ww+12,wh+12);g.fillStyle=opt.adminRoom?'#3b2b55':'#1a2440';g.fillRect(wx,wy,ww,wh);
 if(opt.adminRoom)opt.adminRoom(wx,wy,ww,wh);
 g.fillStyle='rgba(180,220,255,.12)';g.beginPath();g.moveTo(wx,wy+wh);g.lineTo(wx+ww*.3,wy);g.lineTo(wx+ww*.45,wy);g.lineTo(wx+ww*.15,wy+wh);g.fill();g.fillStyle='#241a2c';g.fillRect(wx+ww/2-2,wy,4,wh);g.fillRect(wx,wy+wh/2-2,ww,4);
 const dx=bx+bw+W*.03,dw=Math.min(M*.2,W*.16),dh=hz*.85,dy=hz-dh;g.fillStyle='#241a2c';g.fillRect(dx-6,dy-6,dw+12,dh+6);g.fillStyle=opt.doorOpen?'#0b0610':'#6b4425';g.fillRect(dx,dy,dw,dh);
 if(opt.doorOpen){g.fillStyle='#6b4425';g.fillRect(dx-dw*.25*opt.doorOpen,dy,dw*.25*opt.doorOpen,dh)}else{g.fillStyle='#4a2e18';for(let k=8;k<dw;k+=dw/5)g.fillRect(dx+k,dy,3,dh);g.fillStyle='#ffd45c';g.fillRect(dx+dw*.15,dy+dh*.5,6,6)}
 return {dx:dx+dw/2,dy:hz};
}
function roomFloor(cam){const hz=cam.horizon*H,tex=roomTex();for(let r=Math.ceil(hz)+1;r<H;r+=2){const d=cam.h*cam.focal/(r-hz),span=W*d/cam.focal,wy=cam.y-d;if(wy<0||wy>=TEX){g.fillStyle='#2a2333';g.fillRect(0,r,W,2);continue}g.drawImage(tex,cam.x-span/2,wy,span,1,0,r,W,2);const fog=Math.min(.5,d/1600);if(fog>.02){g.fillStyle='rgba(18,10,26,'+fog.toFixed(3)+')';g.fillRect(0,r,W,2)}}}
function drawWake(t){
 const T0=modeT;fit();if(!off){off=document.createElement('canvas');og=off.getContext('2d')}off.width=W;off.height=H;
 const k=wakeCam(T0),M=Math.min(W,H),cam={x:TEX/2+k.x,y:900,h:k.h*(M/400),horizon:k.hz,focal:M*1.15};
 const saved=g;g=og;g.imageSmoothingEnabled=false;roomFloor(cam);backWall(cam,t);
 // Fluffy rug right in your face at the start.
 if(T0<2.2){g.fillStyle='rgba(235,230,225,'+(1-T0/2.2)*.85+')';g.fillRect(0,0,W,H);for(let i=0;i<60;i++){g.fillStyle='rgba(255,255,255,'+(.25*(1-T0/2.2))+')';g.fillRect((i*137+T0*300)%W,(i*91)%H,W*.08,3)}}
 g=saved;
 g.fillStyle='#000';g.fillRect(0,0,W,H);g.save();g.translate(W/2,H/2);g.rotate(k.roll*Math.PI/180);const z=1+Math.abs(Math.sin(k.roll*Math.PI/180))*.45;g.scale(z,z);if(k.blur>.3)g.filter='blur('+(k.blur*M/700).toFixed(1)+'px)';g.drawImage(off,-W/2,-H/2);g.restore();g.filter='none';
 const vg=g.createRadialGradient(W/2,H/2,M*.2,W/2,H/2,Math.max(W,H)*.7);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,'+(T0<10.4?.85:.6)+')');g.fillStyle=vg;g.fillRect(0,0,W,H);
 if(T0<.8){g.fillStyle='rgba(0,0,0,'+(1-T0/.8)+')';g.fillRect(0,0,W,H)}
 if(T0>.2&&!said.ring2){said.ring2=1;beep(3400,3.2,'sine',.02)}
 const lines=[[3,6,'💭 Ugh… my head… where am I?'],[7.6,10.4,'💭 That board… "WHERE ARE YOU BISCUIT"… written everywhere.']];
 const cur=lines.find(l=>T0>=l[0]&&T0<l[1]);sayEl.style.display=cur?'block':'none';if(cur)sayEl.textContent=cur[2];
 if(T0>12.6)setMode('glitch');
}
// ---------------------------------------------------------------- the Boss Birman glitches; the Admin pauses him; 1s and 0s; the castle breaks apart
let rain=[];
function sliceDraw(drawFn,x,y,w,h,amt){if(!off){off=document.createElement('canvas');og=off.getContext('2d')}const o2=document.createElement('canvas');o2.width=Math.max(1,Math.ceil(w));o2.height=Math.max(1,Math.ceil(h));const c=o2.getContext('2d');c.imageSmoothingEnabled=false;drawFn(c,w/2,h);
 const n=12;for(let i=0;i<n;i++){const sy=i*h/n,dx=(Math.random()-.5)*amt;g.drawImage(o2,0,sy,w,h/n,x-w/2+dx,y-h+sy,w,h/n)}
 if(amt>2){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.35;g.filter='hue-rotate(120deg)';g.drawImage(o2,x-w/2+amt*.4,y-h);g.filter='hue-rotate(260deg)';g.drawImage(o2,x-w/2-amt*.4,y-h);g.restore()}}
function drawGlitch(t){
 const T0=modeT;fit();g.imageSmoothingEnabled=false;const M=Math.min(W,H);
 if(T0<10.2){
  const cam={x:TEX/2,y:900,h:34*(M/400),horizon:.42,focal:M*1.15},door=clamp((T0-.3)/.6,0,1);
  roomFloor(cam);
  const paused=T0>5.6&&T0<8.2;
  const wallInfo=backWall(cam,t,{doorOpen:door,adminRoom:(x,y,w,h)=>{if(T0<4.6)return;const img=adminImg();if(img){const k=Math.min(w*.62/img.width,h*.72/img.height);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.drawImage(img,x+w*.55-img.width*k/2,y+h-img.height*k-h*.04,img.width*k,img.height*k);g.restore()}
   // His pause button.
   g.fillStyle=paused?'#ff3b5c':'#ffd45c';g.fillRect(x+w*.08,y+h*.15,w*.22,h*.22);g.fillStyle='#241a2c';g.fillRect(x+w*.13,y+h*.19,w*.04,h*.14);g.fillRect(x+w*.2,y+h*.19,w*.04,h*.14)}});
  // The Boss Birman walks in through the door and stops in front of the board.
  const walk=ease(clamp((T0-.9)/2.4,0,1)),wx=lerp(TEX/2+380,TEX/2+40,walk),wy=lerp(560,700,walk),pr=proj3({...cam,dir:-1},wx,wy);
  if(pr){const sc=2.2*pr.k,bw=44*sc,bh=46*sc,glitch=T0>3.6?(paused?2:T0>8.2?28:10+Math.sin(t*30)*6):0;
   g.fillStyle='rgba(15,10,20,.4)';g.beginPath();g.ellipse(pr.sx,pr.sy,26*pr.k,7*pr.k,0,0,7);g.fill();
   const fn=(c,cx,cy)=>window.catCityBirmanArt?.draw?.(c,cx,cy-9.5*sc,'armour',{hp:1,max:1,t:paused?0:t,scale:sc});
   if(glitch>0)sliceDraw(fn,pr.sx,pr.sy+10*sc,bw*1.2,bh*1.25,glitch*pr.k);else{fn(g,pr.sx,pr.sy)}
   if(paused){g.fillStyle='rgba(120,140,200,.25)';g.fillRect(pr.sx-bw*.6,pr.sy-bh*1.1,bw*1.2,bh*1.2);g.fillStyle='#fff';g.font='bold '+Math.round(M*.04)+'px system-ui';g.textAlign='center';g.fillText('⏸ PAUSED',pr.sx,pr.sy-bh*1.15)}
   if(T0>8.2){g.strokeStyle='#fff';g.lineWidth=2;for(let i=0;i<5;i++){g.beginPath();g.moveTo(pr.sx,pr.sy-bh*.5);g.lineTo(pr.sx+(Math.random()-.5)*bw,pr.sy-bh*.5+(Math.random()-.5)*bh);g.stroke()}}}
    if(T0>5.5&&!said.nsf){said.nsf=1;voice('c05');SFX.click()}
  if(T0>8.2&&!said.brk){said.brk=1;SFX.alarm();camShake=.6}
  if(T0>3.6&&!paused&&Math.random()<.25){g.fillStyle='rgba(255,59,92,.25)';g.fillRect(0,Math.random()*H,W,4+Math.random()*12)}
  if(T0>8.2){g.fillStyle='rgba(255,255,255,'+clamp(1-(T0-8.2)*3,0,1)+')';g.fillRect(0,0,W,H);g.fillStyle='#ff3b5c';g.font='bold '+Math.round(M*.07)+'px monospace';g.textAlign='center';if(Math.floor(t*8)%2)g.fillText('ERROR',W/2+(Math.random()-.5)*20,H*.3)}
  // 1s and 0s take over the screen.
  if(T0>8.6){const p=clamp((T0-8.6)/1.4,0,1),cols=Math.floor(W/14);if(rain.length<cols)for(let i=0;i<cols;i++)rain.push({y:-Math.random()*H,v:4+Math.random()*9});
   g.fillStyle='rgba(0,0,0,'+(p*.8)+')';g.fillRect(0,0,W,H);g.font='bold 14px monospace';g.textAlign='left';
   rain.forEach((r,i)=>{r.y+=r.v;if(r.y>H)r.y=-20;for(let k=0;k<Math.ceil(p*30);k++){const yy=r.y-k*16;if(yy<0||yy>H)continue;g.fillStyle=k===0?'#e8fff0':'rgba(85,255,122,'+(1-k/30)+')';g.fillText(Math.random()<.5?'0':'1',i*14,yy)}})}
  const lines=[[1.2,3.6,'👣 The Boss Birman walks in…'],[3.6,4.5,'⚠️ …he\'s glitching?!'],[4.6,5.5,'💭 Through the glass… the Admin!'],[5.6,7.8,'👑 ADMIN: "Not so fast!"'],[8.3,10,'⚠️ He\'s breaking out!']];
  const cur=lines.find(l=>T0>=l[0]&&T0<l[1]);sayEl.style.display=cur?'block':'none';if(cur)sayEl.textContent=cur[2];
  if(camShake>0){camShake=Math.max(0,camShake-1/60)}
 }else{
  // Outside: the castle tears itself into floating islands.
  rain=[];const A=T0-10.2,p=ease(clamp(A/3.6,0,1));
  const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#120a24');sky.addColorStop(1,'#3a1f5a');g.fillStyle=sky;g.fillRect(0,0,W,H);
  for(let i=0;i<60;i++){g.fillStyle='rgba(255,255,255,.6)';g.fillRect((i*197)%W,(i*113)%(H*.6),2,2)}
  const cx=W/2,cy=H*.62,u=M/60;
  const parts=[[-12,-14,8,14],[-4,-22,8,22],[4,-14,8,14],[-20,-6,8,6],[12,-6,8,6],[-8,-30,4,8],[0,-36,4,10]];
  parts.forEach(([x,y,w,h],i)=>{const a=i/parts.length*6.28+.4,dx=Math.cos(a)*p*W*.32*(1+i%3*.2),dy=Math.sin(a)*p*H*.16-p*H*.08+Math.sin(t*1.5+i)*4*p;
   const X=cx+x*u+dx,Y=cy+y*u+dy;g.fillStyle='#3a3245';g.fillRect(X,Y,w*u,h*u);g.fillStyle='#4b4157';g.fillRect(X,Y,w*u,u);for(let k=0;k<w;k+=2)g.fillRect(X+k*u,Y-u,u,u);
   // Rocky underside once it floats.
   if(p>.2){g.fillStyle='#5b4632';g.beginPath();g.moveTo(X,Y+h*u);g.lineTo(X+w*u/2,Y+h*u+w*u*.7*p);g.lineTo(X+w*u,Y+h*u);g.fill();g.fillStyle='#3b8a4f';g.fillRect(X-u*.5,Y+h*u-u,w*u+u,u)}});
  for(let i=0;i<14;i++){const yy=(t*60+i*53)%H;g.fillStyle='rgba(140,120,170,.5)';g.fillRect(cx+(i-7)*u*6,cy+yy*.3,3,3)}
  if(A<.5){g.fillStyle='rgba(255,255,255,'+(1-A*2)+')';g.fillRect(0,0,W,H)}
  sayEl.style.display=A>.6&&A<4?'block':'none';sayEl.textContent='The whole castle breaks apart into tiny floating islands…';
  if(A>4.4){said.well=said.nsf=said.brk=0;setMode('islands');islandsStart(0)}
 }
}
// ---------------------------------------------------------------- the islands: jump pads to the next island
const ISL=[{x:0,y:0,r:80},{x:270,y:-150,r:70},{x:540,y:-40,r:88,foes:3},{x:790,y:-230,r:72},{x:1050,y:-90,r:92,foes:5},{x:1310,y:-270,r:78,crumble:true},{x:1580,y:-130,r:96,last:true}];
let isl=0,jump=null,crumbleT=0,cloud=[];
const islDir=i=>{const a=ISL[i],b=ISL[i+1],d=Math.hypot(b.x-a.x,b.y-a.y);return {x:(b.x-a.x)/d,y:(b.y-a.y)/d}};
const padPos=i=>{const d=islDir(i),I=ISL[i];return {x:I.x+d.x*(I.r-22),y:I.y+d.y*(I.r-22)}};
const landPos=i=>{const d=islDir(i-1),I=ISL[i];return {x:I.x-d.x*(I.r-28),y:I.y-d.y*(I.r-28)}};
const islClear=i=>!enemies.some(e=>e.isl===i);
function islandsStart(i){
 isl=i;jump=null;crumbleT=0;room=99;rs[99]={queue:0,armyLeft:0,cleared:true,levers:{},searched:{}};enemies=[];
 ISL.forEach((I,k)=>{if(I.foes&&k>=i)for(let n=0;n<I.foes;n++){const a=n/I.foes*6.28;enemies.push({kind:'army',room:99,isl:k,x:I.x+Math.cos(a)*I.r*.45,y:I.y+Math.sin(a)*I.r*.45,hp:4,max:4,cd:1,hurt:0,anim:n,kx:0,ky:0})}});
 const p=i?landPos(i):ISL[0];me.x=p.x;me.y=p.y;hp=MAXHP;inv=1;C.stage='islands';C.island=i;core.persist();
 say(i?'🏝️ Back on island '+(i+1):'🏝️ Get to the last island! Step on the glowing jump pads.',3200);
}
function onIsland(x,y,r=6){return ISL.some(I=>Math.hypot(x-I.x,y-I.y)<=I.r-r)}
function updateIslands(dt){
 if(ko>0){ko-=dt;if(ko<=0){const p=isl?landPos(isl):ISL[0];me.x=p.x;me.y=p.y;hp=MAXHP;inv=1}return}
 inv=Math.max(0,inv-dt);atkCd=Math.max(0,atkCd-dt);atkAnim=Math.max(0,atkAnim-dt);
 if(jump){jump.t+=dt;const p=clamp(jump.t/jump.dur,0,1);me.x=lerp(jump.a.x,jump.b.x,p);me.y=lerp(jump.a.y,jump.b.y,p);jump.h=Math.sin(p*Math.PI)*46;
  if(p>=1){isl=jump.to;jump=null;C.island=isl;core.persist();if(ISL[isl].crumble){crumbleT=1.9;say('😨 The island is shaking…',2000);SFX.alarm()}else say('🏝️ Island '+(isl+1)+' of '+ISL.length,1400)}return}
 if(crumbleT>0){crumbleT-=dt;camShake=.15;if(crumbleT<=0){setMode('fall')}return}
 let vx=input.jx,vy=input.jy;if(input.keys.has('l'))vx-=1;if(input.keys.has('r'))vx+=1;if(input.keys.has('u'))vy-=1;if(input.keys.has('d'))vy+=1;
 const m=Math.hypot(vx,vy);moving=m>.15;
 if(moving){vx/=Math.max(1,m);vy/=Math.max(1,m);slide(me,vx*74*dt,vy*74*dt,R_ME);const fm=Math.hypot(vx,vy)||1;face={x:vx/fm,y:vy/fm}}
 const I=ISL[isl];
 if(!I.last&&!I.crumble&&islClear(isl)){const p=padPos(isl);if(Math.hypot(me.x-p.x,me.y-p.y)<13){jump={a:{x:p.x,y:p.y},b:landPos(isl+1),t:0,dur:1,to:isl+1,h:0};SFX.swing();beep(300,.4,'triangle',.06,500)}}
 updateEnemies(dt);
}
function drawIslands(t){
 Z=2;const vw=W/Z,vh=H/Z;camX=me.x-vw/2;camY=me.y-vh/2;
 if(camShake>0){camX+=(Math.random()-.5)*camShake*12;camY+=(Math.random()-.5)*camShake*12;camShake=Math.max(0,camShake-1/60)}
 const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#120a24');sky.addColorStop(1,'#3a1f5a');g.fillStyle=sky;g.fillRect(0,0,W,H);
 for(let i=0;i<80;i++){const x=((i*197-camX*Z*.2)%W+W)%W,y=((i*113-camY*Z*.2)%H+H)%H;g.fillStyle='rgba(255,255,255,'+(.3+(i%3)*.2)+')';g.fillRect(x,y,2,2)}
 if(cloud.length<8)for(let i=0;i<8;i++)cloud.push({x:Math.random()*2000-200,y:-400+Math.random()*500,s:30+Math.random()*50,v:4+Math.random()*8});
 for(const c of cloud){c.x+=c.v/60;if(c.x>1900)c.x=-300;const [sx,sy]=toScreen(c.x,c.y);g.fillStyle='rgba(200,180,230,.12)';g.beginPath();g.ellipse(sx,sy,c.s*Z,c.s*.35*Z,0,0,7);g.fill()}
 ISL.forEach((I,i)=>{const [sx,sy]=toScreen(I.x,I.y),r=I.r*Z;const crumb=i===isl&&crumbleT>0?(1.9-crumbleT):0;
  g.fillStyle='#4a3a2a';g.beginPath();g.moveTo(sx-r,sy+r*.15);g.lineTo(sx-r*.4,sy+r*1.2);g.lineTo(sx,sy+r*1.6);g.lineTo(sx+r*.5,sy+r*1.1);g.lineTo(sx+r,sy+r*.15);g.fill();
  g.fillStyle='#6b5233';g.beginPath();g.ellipse(sx,sy+r*.12,r,r*.55,0,0,7);g.fill();g.fillStyle=I.last?'#7a6aa0':'#3b8a4f';g.beginPath();g.ellipse(sx+(crumb?(Math.random()-.5)*6:0),sy,r,r*.52,0,0,7);g.fill();
  g.fillStyle=I.last?'#9a8ac0':'#4fa565';g.beginPath();g.ellipse(sx-r*.2,sy-r*.1,r*.6,r*.28,0,0,7);g.fill();
  if(I.last){g.fillStyle='#3a3245';g.fillRect(sx-14*Z,sy-34*Z,28*Z,30*Z);for(let k=0;k<4;k++)g.fillRect(sx-14*Z+k*8*Z,sy-38*Z,4*Z,4*Z)}
  if(crumb){g.strokeStyle='#120a24';g.lineWidth=Z;for(let k=0;k<6;k++){g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+Math.cos(k)*r*crumb/1.9,sy+Math.sin(k)*r*.5*crumb/1.9);g.stroke()}}
  if(!I.last&&!I.crumble){const p=padPos(i),[px,py]=toScreen(p.x,p.y),on=islClear(i);g.fillStyle='#241a2c';g.beginPath();g.ellipse(px,py,10*Z,5*Z,0,0,7);g.fill();g.fillStyle=on?'#55e0ff':'#6c6578';g.beginPath();g.ellipse(px,py,8*Z,4*Z,0,0,7);g.fill();
   if(on){g.fillStyle='rgba(85,224,255,'+(.25+Math.sin(t*5)*.15)+')';g.beginPath();g.ellipse(px,py-4*Z,12*Z,8*Z,0,0,7);g.fill();const d=islDir(i);g.fillStyle='#fff';g.save();g.translate(px,py);g.rotate(Math.atan2(d.y,d.x));g.fillRect(2*Z,-Z,6*Z,2*Z);g.restore()}}});
 const list=[];
 for(const e of enemies){const [sx,sy]=toScreen(e.x,e.y);list.push({y:e.y,draw:()=>drawWrangler(e,sx,sy,t)})}
 list.push({y:me.y,draw:()=>{const [sx,sy]=toScreen(me.x,me.y),jh=(jump?jump.h:0)*Z;if(inv>0&&Math.floor(t*14)%2&&!jump)return;
  const pose=ko>0?'sleep':jump?'jump':atkAnim>0?'attack':moving?(Math.abs(face.x)>Math.abs(face.y)?'walk':face.y<0?'walkBack':'walkFront'):'idle';const n=art.poses[pose]||1,fr=Math.floor(t*8)%n;
  g.fillStyle='rgba(15,10,20,.4)';g.beginPath();g.ellipse(sx,sy+3*Z,7*Z*(1-jh/(Z*90)),2.5*Z,0,0,7);g.fill();drawMe(g,sx,sy+3*Z-jh,Z*.62,pose,fr,face.x<-.2);
  if(atkAnim>0){const ef=art.effect('slash',Math.floor((.25-atkAnim)*20));g.save();g.translate(sx+face.x*12*Z,sy-6*Z+face.y*10*Z);g.rotate(Math.atan2(face.y,face.x));g.drawImage(ef,-12*Z,-12*Z,24*Z,24*Z);g.restore()}}});
 list.sort((a,b)=>a.y-b.y);list.forEach(o=>o.draw());
 for(const f of fx){f.t+=1/60;const [sx,sy]=toScreen(f.x,f.y);g.fillStyle='rgba(220,200,255,'+Math.max(0,1-f.t*2)+')';for(let i=0;i<6;i++){const a=i/6*6.28,r=(4+f.t*30)*Z;g.fillRect(sx+Math.cos(a)*r,sy-8*Z+Math.sin(a)*r,2*Z,2*Z)}}fx=fx.filter(f=>f.t<.7);
 if(ko>0){g.fillStyle='rgba(0,0,0,'+clamp((2.2-ko)/1.2,0,.85)+')';g.fillRect(0,0,W,H)}
}
// ---------------------------------------------------------------- falling: Birman Biscuit saves you and flies you home
let shards=[];
function flyGround(cam,t,zoneOf){
 const hz=cam.horizon*H;const sky=g.createLinearGradient(0,0,0,hz);sky.addColorStop(0,'#7ec4f2');sky.addColorStop(1,'#fff1d6');g.fillStyle=sky;g.fillRect(0,0,W,hz+1);
 for(let r=Math.ceil(hz)+1;r<H;r+=3){const d=cam.h*cam.focal/(r-hz);if(d>9000){g.fillStyle='#bcd9a8';g.fillRect(0,r,W,3);continue}const span=W*d/cam.focal,wy=cam.y-d,ts=Math.max(200,span/26),ty=Math.floor(wy/ts),z=zoneOf(wy);
  for(let X=Math.floor((cam.x-span/2)/ts)*ts;X<cam.x+span/2;X+=ts){const ix=Math.floor(X/ts);g.fillStyle=GROUND[z][(ix+ty)&1];const sx=W/2+(X-cam.x)*cam.focal/d;g.fillRect(Math.floor(sx),r,Math.ceil(ts*cam.focal/d)+1,3)}
  const fog=Math.min(.45,d/40000);g.fillStyle='rgba(255,241,214,'+fog+')';g.fillRect(0,r,W,3)}
 // Trees, flowers and camps dotted over the land.
 const L=[];for(let gy=Math.floor((cam.y-200)/420);gy>Math.floor((cam.y-9000)/420);gy--)for(let gx=Math.floor((cam.x-5000)/420);gx<(cam.x+5000)/420;gx++){if(h(gx,gy,9)>.18)continue;const wx=gx*420+h(gx,gy,10)*300,wy=gy*420,d=cam.y-wy;if(d<60)continue;const sx=W/2+(wx-cam.x)*cam.focal/d,sy=cam.horizon*H+cam.h*cam.focal/d;if(sx<-60||sx>W+60||sy>H+40)continue;L.push({d,sx,sy,z:zoneOf(wy),r:h(gx,gy,11)})}
 L.sort((a,b)=>b.d-a.d);for(const o of L){const k=Math.min(3,cam.focal/o.d*6);drawScenery({x:{cherry:1000,marsh:3000,terrace:5000,poison:6200}[o.z]||1000,r:o.r},o.sx,o.sy,k,t)}
}
const flyZone=wy=>{const z=['cherry','marsh','terrace','poison','cherry'];return z[Math.floor(((-wy/2600)%5+5)%5)]};
function drawFall(t){
 const T0=modeT;fit();const M=Math.min(W,H);
 if(T0<3){
  if(T0<1.4){drawIslands(t);g.strokeStyle='#fff';g.lineWidth=3;for(let i=0;i<9;i++){const a=i*.7,l=M*.5*clamp(T0/1.2,0,1);g.beginPath();g.moveTo(W/2,H/2);g.lineTo(W/2+Math.cos(a)*l,H/2+Math.sin(a)*l*.7);g.stroke()}camShake=.3;if(!said.crk){said.crk=1;SFX.bonk()}}
  else{if(!shards.length)for(let i=0;i<14;i++)shards.push({x:W/2+(Math.random()-.5)*W*.8,y:H/2+(Math.random()-.5)*H*.5,vx:(Math.random()-.5)*4,vy:2+Math.random()*4,r:Math.random()*6,s:M*(.08+Math.random()*.12),c:Math.random()<.5?'#3b8a4f':'#6b5233'});
   g.fillStyle='#000';g.fillRect(0,0,W,H);for(const s of shards){s.x+=s.vx;s.y+=s.vy;s.vy+=.35;s.r+=.05;g.save();g.translate(s.x,s.y);g.rotate(s.r);g.fillStyle=s.c;g.beginPath();g.moveTo(-s.s/2,-s.s/3);g.lineTo(s.s/2,-s.s/2);g.lineTo(s.s/3,s.s/2);g.fill();g.restore()}}
  sayEl.style.display='block';sayEl.textContent=T0<1.4?'💥 It\'s crumbling beneath your feet—':'Aaaaaaa!';
 }else if(T0<8.6){
  shards=[];g.fillStyle='#000';g.fillRect(0,0,W,H);
  for(let i=0;i<40;i++){const x=(i*173)%W,y=H-((T0*900+i*97)%(H*1.4));g.fillStyle='rgba(180,170,220,.25)';g.fillRect(x,y,2,M*.12)}
  // Through the dark: a glowing, powered-up Birman Biscuit flies up to you.
  const A=T0-3,p=clamp((A-1)/3.4,0,1),sc=M/32*lerp(.12,.5,ease(p)),bx=W/2,by=lerp(H*.9,H*.62,ease(p));
  if(A>1){const gl=g.createRadialGradient(bx,by-sc*14,0,bx,by-sc*14,sc*30);gl.addColorStop(0,'rgba(255,230,140,.6)');gl.addColorStop(.5,'rgba(120,180,255,.2)');gl.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gl;g.fillRect(0,0,W,H);
   const fl=Math.sin(t*12)*.4;g.fillStyle='rgba(255,246,200,.85)';for(const sd of [-1,1]){g.save();g.translate(bx+sd*sc*6,by-sc*16);g.rotate(sd*(.5+fl));g.beginPath();g.ellipse(sd*sc*10,0,sc*12,sc*5,0,0,7);g.fill();g.restore()}
   art.draw(g,bx,by,'biscuitBirman','jump',0,{scale:sc})}
  if(A>4.4&&!said.got){said.got=1;voice('c07')}
  if(A>4.6){g.fillStyle='rgba(255,255,250,'+clamp((A-4.6)/1,0,1)+')';g.fillRect(0,0,W,H)}
  const cur=A>1.4&&A<4.3?'…something is glowing down there in the dark…':A>4.4&&A<5.6?'🐾 BISCUIT: "I\'ve got ya!"':'';sayEl.style.display=cur?'block':'none';sayEl.textContent=cur;
 }else{
  const A=T0-8.6,cam={x:0,y:-A*1800,h:500,horizon:.32,focal:M*1.1};flyGround(cam,t,flyZone);
  const bx=W/2+Math.sin(t*1.3)*M*.03,by=H*.48+Math.sin(t*2)*M*.02,sc=M/105,fl=Math.sin(t*10)*.5;
  g.fillStyle='rgba(255,246,200,.9)';for(const sd of [-1,1]){g.save();g.translate(bx+sd*sc*6,by-sc*16);g.rotate(sd*(.4+fl));g.beginPath();g.ellipse(sd*sc*10,0,sc*12,sc*5,0,0,7);g.fill();g.restore()}
  art.draw(g,bx,by,'biscuitBirman','idle',0,{scale:sc});drawMe(g,bx+sc*2,by+sc*12,sc*.85,'jump',0,false);
  if(A<.9){g.fillStyle='rgba(255,255,250,'+(1-A/.9)+')';g.fillRect(0,0,W,H)}
  if(A>.6&&!said.hold){said.hold=1;voice('c08')}
  const cur=A>.6&&A<3.6?'🐾 BISCUIT: "Hold on tight, we\'re going home."':'';sayEl.style.display=cur?'block':'none';sayEl.textContent=cur;
  if(A>4.6){said.crk=said.got=said.hold=0;setMode('adminpov')}
 }
}
// ---------------------------------------------------------------- the Admin's point of view
function drawAdminPov(t){
 const T0=modeT;fit();const M=Math.min(W,H);
 if(T0<6.6){
  hallTex();const cam={x:TEX/2,y:900,h:30,dir:-1,horizon:.42,focal:M*1.2};hallFloor(cam,t);
  // The Boss Birman closes in.
  const p=ease(clamp(T0/4.4,0,1)),sc=M/34*lerp(.9,2.4,p);window.catCityBirmanArt?.draw?.(g,W/2,H*.62+sc*6-9.5*sc,'armour',{hp:1,max:1,t,scale:sc});
  if(T0>3.4&&T0<5.2){g.fillStyle='rgba(255,0,40,'+(.12+Math.sin(t*14)*.08)+')';g.fillRect(0,0,W,H)}
  // His admin panel: glitches, shatters, then comes back.
  const pw=M*.7,ph=M*.42,px=W/2-pw/2,py=H*.5-ph/2;
  if(T0<2.4||T0>4.6){const rest=T0>4.6?clamp((T0-4.6)/.6,0,1):1,jit=T0<2.4&&T0>.8?(Math.random()-.5)*M*.03:0;g.save();g.globalAlpha=.88*rest;g.translate(W/2+jit,H/2);g.scale(rest,rest);g.translate(-W/2,-H/2);
   g.fillStyle='#241a2c';g.fillRect(px-6,py-6,pw+12,ph+12);g.fillStyle='#4b2f6b';g.fillRect(px,py,pw,ph);g.fillStyle='#ffd45c';g.font='bold '+Math.round(M*.05)+'px system-ui';g.textAlign='center';g.fillText(T0>4.6?'👑 ADMIN PANEL RESTORED':'👑 ADMIN PANEL',W/2,py+M*.07);
   g.fillStyle='#c9b2ed';for(let i=0;i<4;i++)g.fillRect(px+M*.05,py+M*.12+i*M*.065,pw-M*.1-(i*M*.06),M*.035);
   if(T0<2.4&&T0>.8&&Math.random()<.5){g.fillStyle='rgba(255,59,92,.7)';g.fillRect(px,py+Math.random()*ph,pw,M*.02)}g.restore()}
  else{const b=clamp((T0-2.4)/1,0,1);for(let i=0;i<24;i++){const a=i/24*6.28,r=b*M*.6;g.fillStyle=i%2?'#4b2f6b':'#c9b2ed';g.fillRect(W/2+Math.cos(a)*r,H/2+Math.sin(a)*r*.7,M*.04,M*.03)}
   g.fillStyle='#ff3b5c';g.font='bold '+Math.round(M*.05)+'px monospace';g.textAlign='center';g.fillText('💥 CONNECTION LOST',W/2,H*.2)}
  if(T0>2.4&&!said.pb){said.pb=1;SFX.bonk();camShake=.3}
  if(T0>4.8&&!said.nnt){said.nnt=1;voice('c06');beep(880,.3,'triangle',.06,500)}
  if(T0>6.2){g.fillStyle='rgba(255,255,255,'+clamp((T0-6.2)/.4,0,1)+')';g.fillRect(0,0,W,H)}
  const lines=[[.2,2.3,'👑 Admin view: your panel is glitching…'],[3.4,4.6,'The Boss Birman is about to knock you out—'],[4.8,6.4,'👑 ADMIN: "Nope. Not today!"']];
  const cur=lines.find(l=>T0>=l[0]&&T0<l[1]);sayEl.style.display=cur?'block':'none';if(cur)sayEl.textContent=cur[2];
 }else{
  // He flies up and away, looking down across all the biomes.
  const A=T0-6.6,cam={x:Math.sin(A*.3)*800,y:-A*2600,h:lerp(700,1600,ease(clamp(A/4,0,1))),horizon:lerp(.3,.18,ease(clamp(A/4,0,1))),focal:M*1.1};flyGround(cam,t,flyZone);
  if(A<.5){g.fillStyle='rgba(255,255,255,'+(1-A*2)+')';g.fillRect(0,0,W,H)}
  sayEl.style.display=A>.5&&A<4.6?'block':'none';sayEl.textContent='👑 The Admin flies away, looking down across every biome of Cat City…';
  if(A>5.4){g.fillStyle='rgba(0,0,0,'+clamp((A-5.4)/1,0,1)+')';g.fillRect(0,0,W,H)}
  if(A>6.6){said.pb=said.nnt=0;C.ch2=true;core.persist();setMode('end')}
 }
}

// ================================================================== LORE SPOTS (in the open world)
const BIOME=(cx,cy)=>{if(!cx&&!cy)return 'town';if(cx<0&&cy>=-1&&cy<=1)return 'wild';const v=h(cx,cy);if(v<.17)return 'cherry';if(v>.82)return 'poison';if(v<.32)return 'marsh';if(v>.66)return 'moonstone';return 'wild'};
function findChunk(b,skip=0){let n=0;for(let r=1;r<12;r++)for(let cx=-r;cx<=r;cx++)for(let cy=-r;cy<=r;cy++){if(Math.max(Math.abs(cx),Math.abs(cy))!==r)continue;if(BIOME(cx,cy)===b){if(n===skip)return [cx,cy];n++}}return [3,3]}
const LORE=[
 {id:'statue',biome:'wild',skip:1,ox:12,oy:9,sprite:'statue',title:'🗿 The Broken Statue',text:'A cracked statue of a Birman wearing a crown. The plaque says: "THE BIRMAN FAMILY — RULERS OF THE FLOATING CASTLE." Someone has scratched the faces off.'},
 {id:'tree',biome:'cherry',skip:0,ox:14,oy:11,sprite:'tree',title:'🌸 The Carved Cherry Tree',text:'Tiny paw-carved letters in the bark: "B was here. Day 1 away from the castle. Nobody shouts here. The petals are quiet."'},
 {id:'paint',biome:'marsh',skip:0,ox:9,oy:14,sprite:'paint',title:'🎨 Paint Pots in the Reeds',text:'Three old paint pots, half sunk in the mud: brown, tan and stripy-dark brown… exactly the colours of Biscuit\'s fur. A paintbrush is still stuck in one.'},
 {id:'bench',biome:'moonstone',skip:0,ox:11,oy:8,sprite:'bench',title:'💐 The Memorial Bench',text:'A little bench covered in fresh flowers. Carved on the back: "For every cat who had to run to be safe. You are home now." Someone sits here a lot.'},
 {id:'orders',biome:'poison',skip:1,ox:13,oy:12,sprite:'note',title:'📜 Wrangler Orders',text:'"ORDERS FROM THE BOSS: Search every biome. Find the small one. Bring him back to the castle. Do NOT let the Admin see you." It is stamped with a Birman paw print.'},
 {id:'poster',biome:'wild',skip:0,ox:6,oy:5,sprite:'poster',title:'📌 A Torn Poster',text:'"MISSING: BISCUIT. Cream fur, blue eyes, white paws. Return him to the Birman Family." Someone has scribbled over it in crayon: "He doesn\'t want to go back."'},
 {id:'wreck',biome:'poison',skip:0,ox:8,oy:16,sprite:'wreck',title:'🚕 The Wrecked Taxi',text:'A taxi with its doors ripped off. On the seat: a Wrangler hood and a map with CAT VILLAGE circled in red three times.'},
 {id:'admin',biome:'cherry',skip:1,ox:10,oy:10,sprite:'glow',title:'💜 A Glowing Note',text:'"I sealed the castle in the sky years ago so it could never hurt anyone again. If it ever opens… I\'ll be there. Look after each other. — The Admin"'}
];
s.loreFound=Array.isArray(s.loreFound)?s.loreFound:[];
let lorePos=null;
function loreSpots(){if(!lorePos)lorePos=LORE.map(L=>{const [cx,cy]=findChunk(L.biome,L.skip);return {...L,x:cx*CH+L.ox*T,y:cy*CH+L.oy*T}});return lorePos}
const nearLore=()=>{let best=null,bd=50;for(const L of loreSpots()){const d=Math.hypot(s.x-L.x,s.y-L.y);if(d<bd){bd=d;best=L}}return best};
function drawLoreSprite(g2,L,x,y,t){
 const P2=(a,b,w,hh,c)=>{g2.fillStyle=c;g2.fillRect(Math.round(x+a*2),Math.round(y+b*2),Math.round(w*2),Math.round(hh*2))};
 g2.fillStyle='rgba(30,20,40,.3)';g2.beginPath();g2.ellipse(x,y,20,5,0,0,7);g2.fill();
 switch(L.sprite){
  case 'statue':P2(-9,-3,18,3,'#6c6578');P2(-6,-22,12,19,'#8d8a99');P2(-7,-30,14,9,'#a9aebe');P2(-6,-34,3,4,'#a9aebe');P2(3,-34,3,4,'#a9aebe');P2(-5,-28,10,4,'#6c6578');P2(-7,-37,14,3,'#c8952b');P2(2,-18,6,2,'#5d5668');break;
  case 'tree':P2(-3,-20,6,20,'#6b4b2f');P2(-1,-12,3,4,'#3a2a1a');g2.fillStyle='#f4a6c8';g2.beginPath();g2.arc(x,y-50,22,0,7);g2.fill();g2.fillStyle='#ffc7de';g2.beginPath();g2.arc(x-8,y-56,11,0,7);g2.fill();break;
  case 'paint':for(const [dx,c] of [[-9,'#b88655'],[0,'#d5a776'],[9,'#8a5f37']]){P2(dx-3,-7,7,7,'#241a2c');P2(dx-2,-6,5,5,'#c9c4d4');P2(dx-2,-6,5,2,c)}P2(1,-14,1,9,'#6b4b2f');break;
  case 'bench':P2(-12,-8,24,3,'#8a5a34');P2(-12,-14,24,3,'#8a5a34');P2(-11,-5,2,5,'#5b3a22');P2(9,-5,2,5,'#5b3a22');for(let i=0;i<5;i++)P2(-10+i*5,-11,2,2,['#ff6f8f','#ffd45c','#b47cf0','#7fb3ff','#fff'][i]);break;
  case 'note':P2(-1,-18,2,18,'#5b4632');P2(-6,-26,12,10,'#241a2c');P2(-5,-25,10,8,'#f3ead2');P2(-4,-23,8,1,'#8a7f6a');P2(-4,-21,6,1,'#8a7f6a');P2(1,-19,3,2,'#e8506a');break;
  case 'poster':P2(-1,-18,2,18,'#5b4632');P2(-7,-30,14,14,'#241a2c');P2(-6,-29,12,12,'#f3ead2');P2(-4,-27,8,6,'#f3e6cc');P2(-2,-26,1,1,'#2f6fd8');P2(1,-26,1,1,'#2f6fd8');P2(-5,-20,10,1,'#e8506a');break;
  case 'wreck':g2.save();g2.filter='grayscale(.85) brightness(.7)';drawTaxi(g2,x,y,1.4,false,false);g2.restore();for(let i=0;i<3;i++){g2.fillStyle='rgba(120,120,130,'+(.3-i*.08)+')';g2.beginPath();g2.arc(x+6+Math.sin(t+i)*4,y-34-i*10-(t*8%10),6+i*2,0,7);g2.fill()}break;
  case 'glow':{const p=.5+Math.sin(t*3)*.5;g2.fillStyle='rgba(180,124,240,'+(.18+p*.15)+')';g2.beginPath();g2.arc(x,y-14,18,0,7);g2.fill();P2(-5,-14,10,8,'#241a2c');P2(-4,-13,8,6,'#e9dcff');P2(-3,-11,6,1,'#7a4fc0');break}
 }
 if(!s.loreFound.includes(L.id)){g2.font='14px system-ui';g2.textAlign='center';g2.fillText('📜',x,y-62+Math.sin(t*3)*3)}
}
const loreBox=document.createElement('div');loreBox.id='cc-lore';loreBox.innerHTML='<div><b id="cc-lore-title"></b><p id="cc-lore-text"></p><div id="cc-lore-count" style="font-size:12px;opacity:.8"></div><button id="cc-lore-ok" type="button">OK</button></div>';
document.body.append(loreBox);
const loreCss=document.createElement('style');loreCss.textContent='#cc-lore{display:none;position:fixed;inset:0;z-index:7650;background:#120b1caa;align-items:center;justify-content:center;padding:12px}#cc-lore.open{display:flex}#cc-lore>div{background:#2a1d3a;color:#fff6e4;border:3px solid #c9b2ed;border-radius:16px;padding:16px;max-width:380px;font:14px system-ui;text-align:center;line-height:1.45}#cc-lore button{margin-top:8px;min-height:44px;padding:8px 18px;border-radius:12px;border:2px solid #fff6e4;font:bold 14px system-ui;background:#dcc5f7;color:#33224a}';document.head.append(loreCss);
let loreDone=null;
function loreDialog(title,text,count,then){$('cc-lore-title').textContent=title;$('cc-lore-text').textContent=text;$('cc-lore-count').textContent=count||'';loreBox.classList.add('open');loreDone=then||null}
$('cc-lore-ok').onclick=()=>{loreBox.classList.remove('open');const f=loreDone;loreDone=null;if(f)f()};
function readLore(L){const first=!s.loreFound.includes(L.id);if(first){s.loreFound.push(L.id);core.persist();SFX.pick();window.catCityLevels?.add?.(15,'lore')}
 loreDialog(L.title,L.text,'📜 Lore found: '+s.loreFound.length+' / '+LORE.length)}

// ================================================================== NPCs REACT TO THE STORY
const storyStage=()=>C.m3?3:C.m2?2:C.done?1:0;
const NPC_LINES={
 1:{marmalade:'Biscuit came in for a fish snack today. Same old Biscuit — just a lot fluffier! Whatever happened at that castle, he\'s safe here.',
    pebble:'I\'ve been reading about the Birman Family. The old books say their castle floated above the clouds. I thought it was a fairy tale…',
    luna:'The moon showed me a locket, scratched and cold. Somebody up there is still looking for Biscuit.',
    biscuit:'…You saw the painting. I\'m still me, I promise. I painted my fur so he wouldn\'t find me. Thank you for not running away.',
    forge:'That Wrangler Crook you brought back? Nasty bit of metal. I\'ll melt it into something kinder.',
    slaycat:'Bestie, you escaped a FLOATING CASTLE. And Biscuit\'s a Birman?! Iconic. Still my favourite cat in the village.'},
 2:{marmalade:'Biscuit hasn\'t been in for his fish snack. That\'s not like him at all…',
    pebble:'There\'s a page torn out of my Birman book. The only words left are "the locket".',
    luna:'The Admin visited last night. He asked me to keep an eye on Biscuit. He looked worried.',
    forge:'Wranglers were sneaking round the village at dawn. I chased them off with a hammer!',
    slaycat:'Something\'s off with Biscuit. He keeps looking at the sky. Go check on him, okay?'},
 3:{marmalade:'Biscuit\'s back and he ordered TWO fish snacks. I gave him three. 💛',
    pebble:'I\'ve started writing a new chapter for my Birman book: "The Cat Who Came Home."',
    luna:'The locket is gone and the moon feels lighter. Whatever you did up there, it was kind.',
    biscuit:'It\'s over. I don\'t have to hide any more. Want to go for a walk? I\'ll follow you anywhere.',
    forge:'Heard you beat the Boss Birman. I\'m making you a trophy. It\'s going to be ENORMOUS.',
    slaycat:'You, Biscuit AND the Admin against the Boss Birman? Legendary. I\'m writing a song about it.'}
};
window.catCityNpcLine=id=>{const st=storyStage();if(id==='biscuit'&&C.m3&&s.biscuitFollow!==false)return 'Biscuit is following you around now! (You can turn this off in Settings.)';if(id==='biscuit'&&C.m2&&!C.m3)return null;return NPC_LINES[st]?.[id]||null};
// Biscuit: a small Birman after Chapter 2; gone from his spot while he's away (Mission 3); with you after Mission 3.
window.catCityArtAlias=id=>{if(id!=='biscuit')return null;if((C.m2&&!C.m3)||(C.m3&&s.biscuitFollow!==false))return {hide:true};return C.ch2?{id:'biscuitBirman',scale:.78}:null};

// ================================================================== MISSION 3 IN THE WORLD: the note, the pawprints, the No Return taxi
const BISCUIT_SPOT={x:10*T+16,y:20*T+16};
let nrTaxi=null;const nrPos=()=>{if(!nrTaxi){const [cx,cy]=findChunk('poison',2);nrTaxi={x:cx*CH+12*T,y:cy*CH+12*T}}return nrTaxi};
const m3Active=()=>C.m2&&!C.m3;
function worldExtras(){
 const g2=core.ctx,cx=s.x-core.W/2,cy=s.y-core.H/2,t=performance.now()/1000;
 g2.save();g2.imageSmoothingEnabled=false;
 for(const L of loreSpots()){const x=L.x-cx,y=L.y-cy;if(x<-80||y<-80||x>core.W+80||y>core.H+80)continue;drawLoreSprite(g2,L,x,y,t)}
 const nl=nearLore();if(nl){const x=nl.x-cx,y=nl.y-cy;g2.font='bold 11px system-ui';g2.textAlign='center';g2.lineWidth=3;g2.strokeStyle='#241832';g2.fillStyle='#fff6e4';const lab='E / 🐾 · Look';g2.strokeText(lab,x,y+18);g2.fillText(lab,x,y+18)}
 if(m3Active()){
  if(C.m3s!=='trail'&&C.m3s!=='fort'&&C.m3s!=='boss'){const x=BISCUIT_SPOT.x-cx,y=BISCUIT_SPOT.y-cy;g2.fillStyle='#241a2c';g2.fillRect(x-9,y-8,18,14);g2.fillStyle='#f3ead2';g2.fillRect(x-8,y-7,16,12);g2.fillStyle='#8a7f6a';g2.fillRect(x-6,y-4,12,1);g2.fillRect(x-6,y-1,9,1);g2.font='14px system-ui';g2.textAlign='center';g2.fillText('✨',x+10,y-12+Math.sin(t*4)*2);
   // Biscuit has gone (story): say so where he used to stand, so it doesn't look like he vanished.
   {const near=Math.hypot(s.x-BISCUIT_SPOT.x,s.y-BISCUIT_SPOT.y)<50,txt=near?'E / 🐾 · Read Biscuit\'s note':'📜 Biscuit left a note';g2.font='bold 11px system-ui';g2.lineWidth=3;g2.strokeStyle='#241832';g2.fillStyle=near?'#fff6e4':'#ffd45c';g2.strokeText(txt,x,y+20);g2.fillText(txt,x,y+20)}}
  else{const A=BISCUIT_SPOT,B=nrPos(),d=Math.hypot(B.x-A.x,B.y-A.y),n=Math.floor(d/56);
   // The glowing trail only leads you to the taxi the first time; after you've ridden it, just the taxi and the arrow stay.
   if(C.m3s==='trail')for(let i=1;i<n;i++){const px=A.x+(B.x-A.x)*i/n,py=A.y+(B.y-A.y)*i/n,x=px-cx,y=py-cy;if(x<-20||y<-20||x>core.W+20||y>core.H+20)continue;const a=Math.atan2(B.y-A.y,B.x-A.x),side=i%2?5:-5,pulse=.5+Math.sin(t*4-i*.4)*.5;
    g2.save();g2.translate(x-Math.sin(a)*side,y+Math.cos(a)*side);g2.rotate(a+Math.PI/2);g2.fillStyle='rgba(255,230,140,'+(.35+pulse*.5)+')';g2.beginPath();g2.ellipse(0,0,4,5,0,0,7);g2.fill();for(const [ox,oy] of [[-4,-6],[0,-8],[4,-6]]){g2.beginPath();g2.arc(ox,oy,1.8,0,7);g2.fill()}g2.restore()}
   const x=B.x-cx,y=B.y-cy;if(x>-90&&y>-90&&x<core.W+90&&y<core.H+90){g2.fillStyle='rgba(232,80,106,'+(.18+Math.sin(t*3)*.08)+')';g2.beginPath();g2.arc(x,y-14,46,0,7);g2.fill();g2.save();g2.filter='grayscale(1) brightness(.35)';drawTaxi(g2,x,y,2,false,true);g2.restore();
    g2.fillStyle='#241a2c';g2.fillRect(x-30,y-74,60,16);g2.fillStyle='#e8506a';g2.fillRect(x-28,y-72,56,12);g2.font='bold 9px system-ui';g2.textAlign='center';g2.fillStyle='#fff6e4';g2.fillText('NO RETURN',x,y-63);
    if(Math.hypot(s.x-B.x,s.y-B.y)<64){g2.font='bold 11px system-ui';g2.lineWidth=3;g2.strokeStyle='#241832';g2.fillStyle='#fff6e4';g2.strokeText('E / 🐾 · Get in the No Return taxi',x,y+18);g2.fillText('E / 🐾 · Get in the No Return taxi',x,y+18)}}
   else{const a=Math.atan2(B.y-s.y,B.x-s.x),R=Math.min(core.W,core.H)*.38;g2.save();g2.translate(core.W/2+Math.cos(a)*R,core.H/2+Math.sin(a)*R);g2.rotate(a);g2.fillStyle='rgba(255,230,140,.85)';g2.beginPath();g2.moveTo(14,0);g2.lineTo(-8,-9);g2.lineTo(-4,0);g2.lineTo(-8,9);g2.fill();g2.restore()}}
 }
 // Birman Biscuit companion.
 if(C.m3&&s.biscuitFollow!==false)drawCompanion(g2,cx,cy,t);
 g2.restore();
}
let comp=null;
function drawCompanion(g2,cx,cy,t){
 if(!comp)comp={x:s.x-30,y:s.y+20,vx:0,vy:0,lx:s.x,ly:s.y,dir:{x:0,y:1}};
 const mv={x:s.x-comp.lx,y:s.y-comp.ly};comp.lx=s.x;comp.ly=s.y;const mm=Math.hypot(mv.x,mv.y);if(mm>.5)comp.dir={x:mv.x/mm,y:mv.y/mm};
 const tx=s.x-comp.dir.x*36,ty=s.y-comp.dir.y*30+6,dx=tx-comp.x,dy=ty-comp.y,d=Math.hypot(dx,dy);
 if(d>400){comp.x=tx;comp.y=ty}else if(d>4){const sp=Math.min(d,Math.max(2,d*.12));comp.x+=dx/d*sp;comp.y+=dy/d*sp}
 const moving=d>6,pose=!moving?'idle':Math.abs(dx)>Math.abs(dy)?'walk':dy<0?'walkBack':'walkFront',n=art.poses[pose]||1,x=comp.x-cx,y=comp.y-cy;
 g2.fillStyle='#473b5560';g2.beginPath();g2.ellipse(x,y,11,3.5,0,0,7);g2.fill();art.draw(g2,x,y,'biscuitBirman',pose,moving?Math.floor(t*8)%n:0,{scale:.95,flip:dx<-1});
}
function m3Interact(){
 if(!m3Active())return false;
 if((!C.m3s||C.m3s==='note')&&Math.hypot(s.x-BISCUIT_SPOT.x,s.y-BISCUIT_SPOT.y)<50){
  loreDialog('📜 A note from Biscuit','"I\'m sorry. He saw me in his locket again, and he won\'t stop until he has me. I can\'t let anyone else get hurt because of me. I\'m going back to the castle to face him. Please don\'t follow me. — B"','🐾 Glowing pawprints lead out of the village…',()=>start({stage:'m3leave'}));return true}
 if(C.m3s&&Math.hypot(s.x-nrPos().x,s.y-nrPos().y)<64){loreDialog('🚕 The No Return taxi','The door creaks open by itself. "One way only," says a voice from the dark. There\'s no coming back.','',()=>start({stage:'m3'}));return true}
 return false;
}

// ================================================================== MISSION 2: THE LOCKET (you are the Boss Birman)
let playAsBoss=false,squads=[],orders=0,cmdTarget=null,sendPressed=0;
const cmdBox=document.createElement('div');cmdBox.id='cc-cmd';root.append(cmdBox);
const sendBtn=document.createElement('button');sendBtn.id='cc-send';sendBtn.type='button';sendBtn.textContent='📡 SEND BISCUIT TO ME';root.append(sendBtn);
const cmdCss=document.createElement('style');cmdCss.textContent='#cc-cmd{display:none;position:absolute;left:50%;bottom:16%;transform:translateX(-50%);background:#2a1426f0;border:3px solid #e8506a;border-radius:14px;padding:10px;z-index:3;max-width:92vw;text-align:center;color:#fff6e4;font:bold 13px system-ui}#cc-cmd.open{display:block}#cc-cmd button{margin:4px;min-height:42px;padding:6px 10px;border-radius:10px;border:2px solid #fff6e4;background:#ffd45c;color:#241a2c;font:bold 13px system-ui}#cc-send{display:none;position:absolute;left:50%;top:62%;transform:translateX(-50%);z-index:3;min-height:60px;padding:12px 20px;border-radius:14px;border:3px solid #fff6e4;background:#e8506a;color:#fff;font:900 18px system-ui;box-shadow:0 0 24px #ff3b5c}#cc-send.show{display:block}';document.head.append(cmdCss);
const ORDERS=[['🔎 Search the Poison Wastes','"Y-yes, Boss! Right away, Boss!"'],['🛡️ Guard the castle gate','"We won\'t let anyone in, Boss…"'],['🚕 Watch every taxi stop','"Every single one, Boss. Promise."'],['🏘️ Spy on Cat Village','"Q-quietly, Boss. Very quietly."']];
const BOSS_SNAPS=['👑 "Faster."','👑 "Don\'t come back without him."','👑 "Did I say you could look at me?"','👑 "Go. Now."'];
function m2Start(){
 const R=rooms[7];room=7;playAsBoss=true;orders=0;cmdTarget=null;sendPressed=0;enemies=[];rs[7]=rs[7]||{};
 const p=P(R,15,12);me.x=p.x;me.y=p.y;face={x:0,y:-1};
 squads=[];const spots=[[6,5],[24,5],[6,13],[24,13]];spots.forEach(([tx,ty],i)=>{const c=P(R,tx,ty);const sq={i,done:false,members:[]};
  for(let k=0;k<3;k++){const e={kind:'squad',room:7,sq:i,x:c.x+(k-1)*14,y:c.y+(k%2)*8,hp:3,max:3,cd:0,hurt:0,anim:k,fx:0,fy:1,leave:null};enemies.push(e);sq.members.push(e)}squads.push(sq)});
 setMode('m2intro');
}
function m2Squad(){let best=null,bd=40;for(const sq of squads){if(sq.done)continue;for(const e of sq.members){const d=Math.hypot(e.x-me.x,e.y-me.y);if(d<bd){bd=d;best=sq}}}return best}
function m2Use(){
 if(mode!=='m2cmd')return;
 if(orders>=4){const R=rooms[7],th=P(R,15,16);if(Math.hypot(me.x-th.x,me.y-th.y)<44){setMode('m2console');sendBtn.classList.add('show')}else say('👑 Go to the throne. The stolen Admin console is waiting.',2200);return}
 const sq=m2Squad();if(!sq){say('Walk up to a Wrangler squad (they have a ❗) and press 🐾 / E.',2200);return}
 cmdTarget=sq;cmdBox.innerHTML='<div>👑 Give this squad an order:</div>'+ORDERS.map((o,i)=>'<button type="button" data-o="'+i+'">'+o[0]+'</button>').join('');cmdBox.classList.add('open');
 cmdBox.querySelectorAll('button').forEach(b=>b.onclick=()=>m2Order(+b.dataset.o));
}
function m2Order(o){
 const sq=cmdTarget;cmdBox.classList.remove('open');if(!sq||sq.done)return;sq.done=true;orders++;cmdTarget=null;
 const R=rooms[7],exits=[P(R,-1,9),P(R,15,-1)],ex=exits[sq.i%2];sq.members.forEach((e,k)=>{e.leave={x:ex.x,y:ex.y,delay:.4+k*.25}});
 say(ORDERS[o][1]+'   '+BOSS_SNAPS[(orders-1)%4],3000);SFX.click();
 if(orders>=4)setTimeout(()=>{if(open&&mode==='m2cmd')say('👑 Now… the Admin console. Bring him to me.',3000)},3200);
}
function updateM2(dt){
 let vx=input.jx,vy=input.jy;if(input.keys.has('l'))vx-=1;if(input.keys.has('r'))vx+=1;if(input.keys.has('u'))vy-=1;if(input.keys.has('d'))vy+=1;
 const m=Math.hypot(vx,vy);moving=m>.15&&!cmdBox.classList.contains('open');
 if(moving){vx/=Math.max(1,m);vy/=Math.max(1,m);slide(me,vx*60*dt,vy*60*dt,7);const fm=Math.hypot(vx,vy)||1;face={x:vx/fm,y:vy/fm}}
 for(const e of enemies){if(e.kind!=='squad')continue;e.anim+=dt;
  if(e.leave){if((e.leave.delay-=dt)>0){e.fx=me.x-e.x;e.fy=me.y-e.y;continue}const dx=e.leave.x-e.x,dy=e.leave.y-e.y,d=Math.hypot(dx,dy);e.fx=dx;e.fy=dy;if(d<6){e.gone=true}else{e.x+=dx/d*70*dt;e.y+=dy/d*70*dt}}
  else{e.fx=me.x-e.x;e.fy=me.y-e.y;
   // They flinch when the Boss gets close.
   const d=Math.hypot(me.x-e.x,me.y-e.y);if(d<26){e.x-=(me.x-e.x)/d*20*dt;e.y-=(me.y-e.y)/d*20*dt}}}
 enemies=enemies.filter(e=>!e.gone);
}
function drawM2Console(t){
 const T0=modeT,M=Math.min(W,H);hallTex();hallFloor({x:TEX/2,y:900,h:30,dir:-1,horizon:.42,focal:M*1.2},t);g.fillStyle='rgba(80,0,20,.35)';g.fillRect(0,0,W,H);
 const sp=sendPressed?T0-sendPressed:-1;
 // The hijacked panel.
 const pw=M*.78,ph=M*.5,yank=sp>3.1?ease(clamp((sp-3.1)/.7,0,1)):0,px=W/2-pw/2+yank*W,py=H*.38-ph/2;
 if(yank<1){g.save();g.globalAlpha=.94;g.fillStyle='#241a2c';g.fillRect(px-6,py-6,pw+12,ph+12);g.fillStyle='#4a1426';g.fillRect(px,py,pw,ph);g.fillStyle='#ffd45c';g.font='bold '+Math.round(M*.045)+'px system-ui';g.textAlign='center';g.fillText('👑 ADMIN CONTROL — HIJACKED',px+pw/2,py+M*.07);
  g.fillStyle='#ffb3c1';g.font='bold '+Math.round(M*.03)+'px system-ui';g.fillText(sp<0?'Target: BISCUIT':'Locating Biscuit…',px+pw/2,py+M*.13);
  if(sp>=0){const p=clamp(sp/2.6,0,.72);g.fillStyle='#241a2c';g.fillRect(px+pw*.1,py+ph*.45,pw*.8,M*.05);g.fillStyle='#ff3b5c';g.fillRect(px+pw*.1,py+ph*.45,pw*.8*p,M*.05);g.fillStyle='#fff6e4';g.font='bold '+Math.round(M*.028)+'px system-ui';g.fillText(sp<1?'Scanning biomes…':sp<2?'Cat Village…':'FOUND. Pulling…',px+pw/2,py+ph*.7)}
  if(Math.random()<.2){g.fillStyle='rgba(255,59,92,.4)';g.fillRect(px,py+Math.random()*ph,pw,4)}g.restore()}
 // Your (the Boss's) paw on the console — it starts to glitch apart.
 const pawX=W*.62,pawY=H*.86,pr=M*.12,gl=sp>1.4?clamp((sp-1.4)/1.6,0,1):0;
 for(let i=0;i<10;i++){const sy=pawY-pr+i*pr*.2,off=gl*(Math.random()-.5)*M*.12;g.save();g.beginPath();g.rect(0,sy,W,pr*.2);g.clip();g.fillStyle='#f3e6cc';g.beginPath();g.ellipse(pawX+off,pawY,pr*1.1,pr,0,0,7);g.fill();g.fillStyle='#4a3326';g.beginPath();g.ellipse(pawX+off,pawY+pr*.55,pr*1.1,pr*.5,0,0,Math.PI);g.fill();g.fillStyle='#fff';for(let k=-1;k<=1;k++){g.beginPath();g.arc(pawX+off+k*pr*.45,pawY-pr*.75,pr*.25,0,7);g.fill()}g.restore()}
 if(gl>0){for(let i=0;i<30*gl;i++){g.fillStyle=Math.random()<.5?'#ff3b5c':'#55e0ff';g.fillRect(pawX+(Math.random()-.5)*pr*3,pawY+(Math.random()-.5)*pr*2,M*.012,M*.012)}}
 // The Admin arrives and takes it back.
 if(sp>2.6){const img=adminImg(),a=ease(clamp((sp-2.6)/.5,0,1)),gone=clamp((sp-4.4)/.5,0,1),ax=lerp(W*1.1,W*.82,a)+yank*W*.2,ay=H*.62,k=M/110;
  if(img&&gone<1){g.save();g.globalAlpha=1-gone;g.drawImage(img,ax-img.width*k/2,ay-img.height*k,img.width*k,img.height*k);g.restore()}
  if(gone>0&&gone<1){for(let i=0;i<20;i++){g.fillStyle=i%2?'#c9b2ed':'#ffd45c';g.fillRect(ax+(Math.random()-.5)*M*.3*gone,ay-M*.1+(Math.random()-.5)*M*.3*gone,M*.015,M*.015)}}}
 if(sp>2.7&&!said.m2nsf){said.m2nsf=1;voice('c05')}
 if(sp>5.2&&sp<7){g.fillStyle='rgba(255,0,30,'+(.25+Math.sin(t*20)*.1)+')';g.fillRect(0,0,W,H);if(!said.m2roar){said.m2roar=1;SFX.bonk();camShake=.6}}
 const lines=sp<0?[[0,99,'👑 Press the button. Bring Biscuit home… to ME.']]:[[0,1.4,'📡 Sending…'],[1.5,2.6,'💭 Your paw… it\'s glitching apart—'],[2.7,4.4,'👑 ADMIN: "Not so fast!" — he snatches the controls back.'],[4.5,5.2,'✨ …and he\'s gone, panel and all.'],[5.2,7,'👑 "NOOOOO!"'],[7.2,9.6,'Biscuit is safe… for now.']];
 const cur=lines.find(l=>(sp<0?0:sp)>=l[0]&&(sp<0?0:sp)<l[1]);sayEl.style.display=cur?'block':'none';if(cur)sayEl.textContent=cur[2];
 if(sp>9.6){g.fillStyle='rgba(0,0,0,'+clamp((sp-9.6),0,1)+')';g.fillRect(0,0,W,H)}
 if(sp>10.6){said.m2nsf=said.m2roar=0;sendBtn.classList.remove('show');finishM2()}
}
sendBtn.onclick=()=>{if(mode==='m2console'&&!sendPressed){sendPressed=modeT;sendBtn.classList.remove('show');beep(220,1.2,'sawtooth',.05,300)}};
function drawM2Intro(t){
 const T0=modeT,M=Math.min(W,H);hallTex();hallFloor({x:TEX/2,y:900,h:26,dir:-1,horizon:.36,focal:M*1.2},t);g.fillStyle='rgba(40,0,15,.55)';g.fillRect(0,0,W,H);
 // The Boss's paws holding the open locket.
 const lx=W/2,ly=H*.58,lr=M*.17;
 for(const sd of [-1,1]){g.fillStyle='#f3e6cc';g.beginPath();g.ellipse(lx+sd*lr*1.15,ly+lr*.9,lr*.7,lr*.6,0,0,7);g.fill();g.fillStyle='#4a3326';g.beginPath();g.ellipse(lx+sd*lr*1.15,ly+lr*1.25,lr*.7,lr*.35,0,0,Math.PI);g.fill();g.fillStyle='#fff';for(let k=-1;k<=1;k++){g.beginPath();g.arc(lx+sd*lr*1.15+k*lr*.25,ly+lr*.45,lr*.13,0,7);g.fill()}}
 g.strokeStyle='#c8952b';g.lineWidth=M*.008;g.beginPath();g.moveTo(lx,ly-lr*1.05);g.lineTo(lx-lr*.4,ly-lr*2);g.stroke();
 g.fillStyle='#c8952b';g.beginPath();g.ellipse(lx,ly,lr*.82,lr,0,0,7);g.fill();g.fillStyle='#ffd45c';g.beginPath();g.ellipse(lx,ly,lr*.72,lr*.9,0,0,7);g.fill();g.fillStyle='#2e4a3a';g.beginPath();g.ellipse(lx,ly,lr*.6,lr*.76,0,0,7);g.fill();
 g.save();g.beginPath();g.ellipse(lx,ly,lr*.6,lr*.76,0,0,7);g.clip();art.draw(g,lx,ly+lr*.95,'biscuitBirman','idle',0,{scale:lr/14});
 // Claw scratches across the picture.
 const sc=clamp((T0-5.6)/1.2,0,1);g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=M*.008;for(let i=0;i<3;i++){const p=clamp(sc*3-i,0,1);if(p<=0)continue;g.beginPath();g.moveTo(lx-lr*.6+i*lr*.25,ly-lr*.7);g.lineTo(lx-lr*.6+i*lr*.25+lr*.7*p,ly-lr*.7+lr*1.4*p);g.stroke()}g.restore();
 if(T0>5.6&&!said.scr){said.scr=1;beep(1800,.5,'sawtooth',.04,-1400)}
 const lines=[[.5,3.4,'👑 You are the BOSS BIRMAN.'],[3.6,5.5,'👑 "You ran from me, Biscuit."'],[5.6,7.3,'*scraaatch*'],[7.5,10,'👑 "Nobody leaves the Birman family."']];
 const cur=lines.find(l=>T0>=l[0]&&T0<l[1]);sayEl.style.display=cur?'block':'none';if(cur)sayEl.textContent=cur[2];
 if(T0<.8){g.fillStyle='rgba(0,0,0,'+(1-T0/.8)+')';g.fillRect(0,0,W,H)}
 if(T0>10.4){said.scr=0;setMode('m2cmd');say('👑 Give your Wrangler squads their orders.',3000)}
}
function finishM2(){
 const first=!C.m2;C.m2=true;C.m3s='note';if(first){s.fish=(s.fish||0)+150;window.catCityLevels?.add?.(100,'locket')}core.persist();playAsBoss=false;
 endInfo={title:'🔒 Mission 2 complete: The Locket',sub:'The Boss Birman wants Biscuit back… and he won\'t stop.',reward:first?'Rewards: 🐟 150 fish · ⭐ 100 XP':'',finish:()=>{close();core.note('😿 You wake up in the village. Somebody should check on Biscuit…')}};setMode('end');
}

// ================================================================== MISSION 3: NO RETURN
const FC=[{x:0,y:0,r:80},{x:0,y:-300,r:70},{x:260,y:-470,r:70},{x:700,y:-470,r:82,foes:4},{x:700,y:-760,r:70},{x:420,y:-960,r:72,foes:3},{x:420,y:-1380,r:110,gate:true}];
const FL=[{k:'bridge',a:0,b:1,w:30},{k:'pad',a:1,b:2},{k:'mover',a:2,b:3,r:42,per:5},{k:'bridge',a:3,b:4,w:26},{k:'pad',a:4,b:5},{k:'mover',a:5,b:6,r:44,per:5.6}];
let fortT=0,cp=0,fallT=0;
const fdir=(a,b)=>{const A=FC[a],B=FC[b],d=Math.hypot(B.x-A.x,B.y-A.y);return {x:(B.x-A.x)/d,y:(B.y-A.y)/d,d}};
function moverPos(L){const A=FC[L.a],B=FC[L.b],dd=fdir(L.a,L.b),s0={x:A.x+dd.x*(A.r+L.r-10),y:A.y+dd.y*(A.r+L.r-10)},s1={x:B.x-dd.x*(B.r+L.r-10),y:B.y-dd.y*(B.r+L.r-10)},u=ease(clamp((Math.sin(fortT*Math.PI*2/L.per)*1.25+1)/2,0,1));return {x:lerp(s0.x,s1.x,u),y:lerp(s0.y,s1.y,u)}}
function bridgeEnds(L){const A=FC[L.a],B=FC[L.b],dd=fdir(L.a,L.b);return [{x:A.x+dd.x*(A.r-12),y:A.y+dd.y*(A.r-12)},{x:B.x-dd.x*(B.r-12),y:B.y-dd.y*(B.r-12)}]}
const bridgeTime=L=>{const [a,b]=bridgeEnds(L);return Math.hypot(b.x-a.x,b.y-a.y)/74+.8};
const segDist=(p,a,b)=>{const vx=b.x-a.x,vy=b.y-a.y,u=clamp(((p.x-a.x)*vx+(p.y-a.y)*vy)/(vx*vx+vy*vy),0,1);return Math.hypot(p.x-(a.x+vx*u),p.y-(a.y+vy*u))};
function fortCircleAt(x,y,r=0){for(let i=0;i<FC.length;i++)if(Math.hypot(x-FC[i].x,y-FC[i].y)<=FC[i].r-r)return i;return -1}
function onFort(x,y,r=6){if(fortCircleAt(x,y,r)>=0)return true;
 for(const L of FL){if(L.k==='bridge'&&!L.gone){const [a,b]=bridgeEnds(L);if(segDist({x,y},a,b)<=L.w/2-r/2)return true}if(L.k==='mover'){const p=moverPos(L);if(Math.hypot(x-p.x,y-p.y)<=L.r-r)return true}}return false}
function fortStart(i){
 i=clamp(i|0,0,5);room=99;rs[99]={queue:0,armyLeft:0,cleared:true,levers:{},searched:{}};enemies=[];jump=null;fallT=0;cp=i;isl=i;
 FL.forEach(L=>{L.gone=false;L.touch=0;L.goneAt=0});
 FC.forEach((F,k)=>{if(F.foes&&k>=i)for(let n=0;n<F.foes;n++){const a=n/F.foes*6.28;enemies.push({kind:'army',room:99,isl:k,x:F.x+Math.cos(a)*F.r*.45,y:F.y+Math.sin(a)*F.r*.45,hp:4,max:4,cd:1,hurt:0,anim:n,kx:0,ky:0})}});
 me.x=FC[i].x;me.y=FC[i].y;hp=MAXHP;inv=1;C.m3s='fort';C.m3cp=i;core.persist();setMode('m3climb');say(i?'🏰 Back at the broken fortress.':'🏰 The broken fortress! Climb to the top — bridges fall, platforms move.',3200);
}
const fClear=i=>!enemies.some(e=>e.isl===i);
function updateFort(dt){
 fortT+=dt;
 if(ko>0){ko-=dt;if(ko<=0){me.x=FC[cp].x;me.y=FC[cp].y;hp=MAXHP;inv=1}return}
 inv=Math.max(0,inv-dt);atkCd=Math.max(0,atkCd-dt);atkAnim=Math.max(0,atkAnim-dt);
 if(fallT>0){fallT-=dt;if(fallT<=0){hp=Math.max(0,hp-2);if(hp<=0){knockOut();return}me.x=FC[cp].x;me.y=FC[cp].y;inv=1.2;FL.forEach(L=>{L.gone=false;L.touch=0})}return}
 if(jump){jump.t+=dt;const p=clamp(jump.t/jump.dur,0,1);me.x=lerp(jump.a.x,jump.b.x,p);me.y=lerp(jump.a.y,jump.b.y,p);jump.h=Math.sin(p*Math.PI)*46;if(p>=1)jump=null;return}
 // Ride moving platforms.
 if(fortCircleAt(me.x,me.y,2)<0)for(const L of FL){if(L.k!=='mover')continue;const p0=moverPos(L);if(Math.hypot(me.x-p0.x,me.y-p0.y)<=L.r){fortT-=dt;const pa=moverPos(L);fortT+=dt;me.x+=p0.x-pa.x;me.y+=p0.y-pa.y}}
 let vx=input.jx,vy=input.jy;if(input.keys.has('l'))vx-=1;if(input.keys.has('r'))vx+=1;if(input.keys.has('u'))vy-=1;if(input.keys.has('d'))vy+=1;
 const m=Math.hypot(vx,vy);moving=m>.15;
 if(moving){vx/=Math.max(1,m);vy/=Math.max(1,m);const nx=me.x+vx*74*dt,ny=me.y+vy*74*dt;if(onFort(nx,me.y,5))me.x=nx;if(onFort(me.x,ny,5))me.y=ny;const fm=Math.hypot(vx,vy)||1;face={x:vx/fm,y:vy/fm}}
 // Bridges crumble a moment after you step on them, then grow back.
 const now=fortT;for(const L of FL){if(L.k!=='bridge')continue;if(L.gone){if(now-L.goneAt>3.5){L.gone=false;L.touch=0}continue}const [a,b]=bridgeEnds(L);if(segDist(me,a,b)<L.w/2&&fortCircleAt(me.x,me.y,0)<0){if(!L.touch){L.touch=now;SFX.click()}}if(L.touch&&now-L.touch>bridgeTime(L)){L.gone=true;L.goneAt=now;SFX.door()}}
 if(!onFort(me.x,me.y,0)){fallT=.9;say('😵 You fell! Back to the last safe island…',1800);SFX.hurt();return}
 const ci=fortCircleAt(me.x,me.y,4);if(ci>=0){isl=ci;if(ci>cp){cp=ci;C.m3cp=ci;core.persist()}}
 if(ci>=0)for(const L of FL)if(L.k==='pad'&&L.a===ci&&fClear(ci)){const dd=fdir(L.a,L.b),A=FC[L.a],p={x:A.x+dd.x*(A.r-22),y:A.y+dd.y*(A.r-22)};if(Math.hypot(me.x-p.x,me.y-p.y)<13){const B=FC[L.b];jump={a:p,b:{x:B.x-dd.x*(B.r-28),y:B.y-dd.y*(B.r-28)},t:0,dur:1,h:0};SFX.swing();beep(300,.4,'triangle',.06,500)}}
 if(ci===6&&!jump){C.m3s='boss';core.persist();bossStart();return}
 updateEnemies(dt);
}
function drawFort(t){
 Z=2;const vw=W/Z,vh=H/Z;camX=me.x-vw/2;camY=me.y-vh/2;if(camShake>0){camX+=(Math.random()-.5)*camShake*12;camY+=(Math.random()-.5)*camShake*12;camShake=Math.max(0,camShake-1/60)}
 const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#1a0612');sky.addColorStop(1,'#4a1430');g.fillStyle=sky;g.fillRect(0,0,W,H);
 for(let i=0;i<70;i++){const x=((i*197-camX*Z*.2)%W+W)%W,y=((i*113-camY*Z*.2)%H+H)%H;g.fillStyle='rgba(255,200,220,'+(.25+(i%3)*.15)+')';g.fillRect(x,y,1,1)}
 for(const L of FL){if(L.k==='bridge'){const [a,b]=bridgeEnds(L),[ax,ay]=toScreen(a.x,a.y),[bx,by]=toScreen(b.x,b.y);if(L.gone){g.fillStyle='rgba(120,80,50,.25)';for(let i=0;i<6;i++)g.fillRect(lerp(ax,bx,i/6),lerp(ay,by,i/6)+((fortT-L.goneAt)*60*Z),3*Z,3*Z);continue}
   const shake=L.touch?(Math.random()-.5)*2*Z:0,ang=Math.atan2(by-ay,bx-ax),len=Math.hypot(bx-ax,by-ay);g.save();g.translate(ax+shake,ay);g.rotate(ang);g.fillStyle='#3a2a1a';g.fillRect(0,-L.w*Z/2-Z,len,L.w*Z+2*Z);for(let k=0;k<len;k+=6*Z){g.fillStyle=L.touch?'#6b4425':'#8a5a34';g.fillRect(k,-L.w*Z/2,5*Z,L.w*Z)}g.restore()}}
 FC.forEach((F,i)=>{const [sx,sy]=toScreen(F.x,F.y),r=F.r*Z;g.fillStyle='#3a2a2a';g.beginPath();g.moveTo(sx-r,sy+r*.15);g.lineTo(sx-r*.3,sy+r*1.3);g.lineTo(sx+r*.4,sy+r*1.1);g.lineTo(sx+r,sy+r*.15);g.fill();
  g.fillStyle='#4b4157';g.beginPath();g.ellipse(sx,sy+r*.1,r,r*.55,0,0,7);g.fill();g.fillStyle='#5d5668';g.beginPath();g.ellipse(sx,sy,r,r*.52,0,0,7);g.fill();g.strokeStyle='#3a3245';g.lineWidth=Z;for(let k=0;k<4;k++){g.beginPath();g.moveTo(sx+Math.cos(k*1.7)*r*.2,sy+Math.sin(k*1.7)*r*.1);g.lineTo(sx+Math.cos(k*1.7)*r*.8,sy+Math.sin(k*1.7)*r*.4);g.stroke()}
  if(F.gate){g.fillStyle='#2a2333';g.fillRect(sx-30*Z,sy-70*Z,60*Z,46*Z);for(let k=0;k<6;k++)g.fillRect(sx-30*Z+k*11*Z,sy-76*Z,6*Z,6*Z);g.fillStyle='#120b1c';g.fillRect(sx-9*Z,sy-44*Z,18*Z,20*Z);g.fillStyle='rgba(232,80,106,'+(.3+Math.sin(t*3)*.15)+')';g.fillRect(sx-7*Z,sy-42*Z,14*Z,18*Z)}});
 for(const L of FL){if(L.k==='mover'){const p=moverPos(L),[sx,sy]=toScreen(p.x,p.y),r=L.r*Z;g.fillStyle='#3a3245';g.beginPath();g.ellipse(sx,sy+r*.2,r,r*.5,0,0,7);g.fill();g.fillStyle='#8d8a99';g.beginPath();g.ellipse(sx,sy,r,r*.48,0,0,7);g.fill();g.strokeStyle='rgba(85,224,255,.8)';g.lineWidth=Z;g.beginPath();g.ellipse(sx,sy,r*.9,r*.42,0,0,7);g.stroke()}
  if(L.k==='pad'){const dd=fdir(L.a,L.b),A=FC[L.a],p={x:A.x+dd.x*(A.r-22),y:A.y+dd.y*(A.r-22)},[px,py]=toScreen(p.x,p.y),on=fClear(L.a);g.fillStyle='#241a2c';g.beginPath();g.ellipse(px,py,10*Z,5*Z,0,0,7);g.fill();g.fillStyle=on?'#55e0ff':'#6c6578';g.beginPath();g.ellipse(px,py,8*Z,4*Z,0,0,7);g.fill();if(on){g.fillStyle='rgba(85,224,255,'+(.25+Math.sin(t*5)*.15)+')';g.beginPath();g.ellipse(px,py-4*Z,12*Z,8*Z,0,0,7);g.fill()}}}
 const list=[];for(const e of enemies){const [sx,sy]=toScreen(e.x,e.y);list.push({y:e.y,draw:()=>drawWrangler(e,sx,sy,t)})}
 list.push({y:me.y,draw:()=>drawPlayerAt(t)});list.sort((a,b)=>a.y-b.y);list.forEach(o=>o.draw());drawFx();
 if(fallT>0){g.fillStyle='rgba(0,0,0,'+clamp(1-fallT/.9,0,.8)+')';g.fillRect(0,0,W,H)}
 if(ko>0){g.fillStyle='rgba(0,0,0,'+clamp((2.2-ko)/1.2,0,.85)+')';g.fillRect(0,0,W,H)}
}
function drawPlayerAt(t){const [sx,sy]=toScreen(me.x,me.y),jh=(jump?jump.h:0)*Z;if(inv>0&&Math.floor(t*14)%2&&!jump)return;
 const pose=ko>0?'sleep':jump?'jump':atkAnim>0?'attack':moving?(Math.abs(face.x)>Math.abs(face.y)?'walk':face.y<0?'walkBack':'walkFront'):'idle';const n=art.poses[pose]||1,fr=Math.floor(t*8)%n;
 g.fillStyle='rgba(15,10,20,.4)';g.beginPath();g.ellipse(sx,sy+3*Z,7*Z,2.5*Z,0,0,7);g.fill();
 if(power>0){g.fillStyle='rgba(85,224,255,'+(.25+Math.sin(t*8)*.12)+')';g.beginPath();g.arc(sx,sy-8*Z-jh,16*Z,0,7);g.fill()}
 drawMe(g,sx,sy+3*Z-jh,Z*.62,pose,fr,face.x<-.2);
 if(atkAnim>0){const ef=art.effect('slash',Math.floor((.25-atkAnim)*20));g.save();g.translate(sx+face.x*12*Z,sy-6*Z+face.y*10*Z);g.rotate(Math.atan2(face.y,face.x));const sz=power>0?36:24;g.drawImage(ef,-sz/2*Z,-sz/2*Z,sz*Z,sz*Z);g.restore()}}
function drawFx(){for(const f of fx){f.t+=1/60;const [sx,sy]=toScreen(f.x,f.y);g.fillStyle='rgba(220,200,255,'+Math.max(0,1-f.t*2)+')';for(let i=0;i<6;i++){const a=i/6*6.28,r=(4+f.t*30)*Z;g.fillRect(sx+Math.cos(a)*r,sy-8*Z+Math.sin(a)*r,2*Z,2*Z)}}fx=fx.filter(f=>f.t<.7)}

// ---------------------------------------------------------------- the Boss Birman fight (3 phases)
const ARENA=170,BHP=120;let boss=null,ally=null,power=0,waveT=0,marks=[];
function bossStart(skipIntro){
 if(!skipIntro){setMode('m3intro');return}
 room=99;rs[99]={queue:0,armyLeft:0,cleared:true,levers:{},searched:{}};enemies=[];marks=[];power=0;waveT=6;jump=null;isl=undefined;
 boss={x:0,y:-70,hp:BHP,max:BHP,phase:1,cd:2.4,act:null,stun:0,hurt:0,anim:0};ally={x:-30,y:120,zap:6,beam:0};
 me.x=0;me.y=110;hp=MAXHP;inv=1.5;face={x:0,y:-1};setMode('m3boss');say('👑 The BOSS BIRMAN. Biscuit is here too!',2600);setTimeout(()=>{if(open&&mode==='m3boss')voice('c07')},700);
}
const inArena=(x,y,r=6)=>Math.hypot(x,y)<=ARENA-r;
function B0act(){if(boss){boss.act=null;boss.stun=0}}
function bossHit(dmg){if(!boss||boss.hp<=0)return;boss.hp=Math.max(0,boss.hp-dmg);boss.hurt=.2;fx.push({kind:'poof',x:boss.x,y:boss.y-10,t:0});SFX.hit();
 const ph=boss.hp>BHP*.66?1:boss.hp>BHP*.33?2:3;if(ph!==boss.phase){boss.phase=ph;boss.act=null;boss.cd=1.6;camShake=.4;
  if(ph===2){say('🔒 The locket glows… "WRANGLERS! TO ME!"',3000);SFX.alarm()}
  if(ph===3){enemies=[];marks=[];B0act();setMode('m3admin')}}
 if(boss.hp<=0){camShake=.6;SFX.bonk();setTimeout(()=>{if(open&&mode==='m3boss')setMode('m3locket')},900)}}
function hurtMe(){if(inv>0||ko>0)return;hp--;inv=.9;SFX.hurt();camShake=.25;if(hp<=0){ko=2.2;say('💫 The Boss Birman knocked you out! Try again…',2200)}}
function updateBoss(dt){
 const B=boss;B.anim+=dt;B.hurt=Math.max(0,B.hurt-dt);
 if(ko>0){ko-=dt;if(ko<=0)bossStart(true);return}
 inv=Math.max(0,inv-dt);atkCd=Math.max(0,atkCd-dt);atkAnim=Math.max(0,atkAnim-dt);
 let vx=input.jx,vy=input.jy;if(input.keys.has('l'))vx-=1;if(input.keys.has('r'))vx+=1;if(input.keys.has('u'))vy-=1;if(input.keys.has('d'))vy+=1;
 const m=Math.hypot(vx,vy);moving=m>.15;if(moving){vx/=Math.max(1,m);vy/=Math.max(1,m);const nx=me.x+vx*80*dt,ny=me.y+vy*80*dt;if(inArena(nx,me.y))me.x=nx;if(inArena(me.x,ny))me.y=ny;const fm=Math.hypot(vx,vy)||1;face={x:vx/fm,y:vy/fm}}
 if(B.hp<=0)return;
 // Biscuit fights beside you: he zaps the Boss now and then.
 const at={x:me.x-face.x*26,y:me.y-face.y*20+8},ad=Math.hypot(at.x-ally.x,at.y-ally.y);if(ad>3){ally.x+=(at.x-ally.x)*Math.min(1,dt*4);ally.y+=(at.y-ally.y)*Math.min(1,dt*4)}
 ally.zap-=dt;ally.beam=Math.max(0,ally.beam-dt);if(ally.zap<=0&&Math.hypot(B.x-ally.x,B.y-ally.y)<190){ally.zap=7;ally.beam=.35;B.stun=1.1;bossHit(4);beep(1200,.25,'square',.05,-600)}
 // Phase 2: Wrangler waves.
 if(B.phase===2){waveT-=dt;if(waveT<=0&&enemies.length<6){waveT=11;for(let i=0;i<3;i++){const a=Math.random()*6.28;enemies.push({kind:'army',room:99,x:Math.cos(a)*(ARENA-20),y:Math.sin(a)*(ARENA-20),hp:3,max:3,cd:1,hurt:0,anim:i,kx:0,ky:0})}if(!said.wave){said.wave=1;voice('c01')}}}
 updateEnemies(dt);
 // Telegraphed attacks.
 for(const k of marks){k.t-=dt;if(k.t<=0&&!k.hit){k.hit=true;if(Math.hypot(me.x-k.x,me.y-k.y)<k.r)hurtMe()}}marks=marks.filter(k=>k.t>-.25);
 if(B.stun>0){B.stun-=dt;return}
 if(B.act){const a=B.act;a.t+=dt;
  if(a.kind==='dash'){if(a.t<a.tele){}else if(a.t<a.tele+.55){const sp=(B.phase===3?440:380)*dt;const nx=B.x+a.dx*sp,ny=B.y+a.dy*sp;if(inArena(nx,ny,10)){B.x=nx;B.y=ny}if(Math.hypot(me.x-B.x,me.y-B.y)<22)hurtMe()}else B.act=null}
  else if(a.kind==='sweep'){if(a.t>=a.tele&&!a.done){a.done=true;if(Math.hypot(me.x-B.x,me.y-B.y)<58)hurtMe();camShake=.2}if(a.t>a.tele+.3)B.act=null}
  else if(a.kind==='rain'){if(a.t>1.3)B.act=null}
  return}
 const dx=me.x-B.x,dy=me.y-B.y,d=Math.hypot(dx,dy)||1;if(d>44){B.x+=dx/d*42*dt;B.y+=dy/d*42*dt}
 B.cd-=dt;if(B.cd<=0){const opts=B.phase===1?['dash','sweep']:['dash','sweep','rain'],kind=opts[Math.floor(Math.random()*opts.length)],tele=B.phase===3?.65:.85;
  if(kind==='dash')B.act={kind,t:0,tele,dx:dx/d,dy:dy/d};
  if(kind==='sweep')B.act={kind,t:0,tele:tele*.9};
  if(kind==='rain'){B.act={kind,t:0};for(let i=0;i<5;i++){const a=Math.random()*6.28,r=i?20+Math.random()*60:0;marks.push({x:clamp(me.x+Math.cos(a)*r,-140,140),y:clamp(me.y+Math.sin(a)*r,-140,140),r:24,t:1.15})}}
  B.cd=B.phase===1?2.3:B.phase===2?2.5:1.7}
}
function bossAttackCheck(){if(mode!=='m3boss'||!boss||boss.hp<=0)return false;const ax=me.x+face.x*12,ay=me.y+face.y*12;if(Math.hypot(boss.x-ax,boss.y-(ay-6))<32){bossHit(damage()*(power>0?3:1));return true}return false}
function drawBoss3(t){
 Z=2;const vw=W/Z,vh=H/Z;camX=(mode==='m3admin'?0:me.x*.6)-vw/2;camY=(mode==='m3admin'?-80:me.y*.6)-vh/2;if(camShake>0){camX+=(Math.random()-.5)*camShake*12;camY+=(Math.random()-.5)*camShake*12;camShake=Math.max(0,camShake-1/60)}
 const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#1a0612');sky.addColorStop(1,'#4a1430');g.fillStyle=sky;g.fillRect(0,0,W,H);
 const [cx,cy]=toScreen(0,0),R=ARENA*Z;g.fillStyle='#3a2a2a';g.beginPath();g.ellipse(cx,cy+R*.2,R,R*.62,0,0,7);g.fill();g.fillStyle='#4b4157';g.beginPath();g.arc(cx,cy,R,0,7);g.fill();g.fillStyle='#5d5668';g.beginPath();g.arc(cx,cy,R*.96,0,7);g.fill();g.fillStyle='#7a2236';g.beginPath();g.arc(cx,cy,R*.55,0,7);g.fill();g.fillStyle='#8f2b42';g.beginPath();g.arc(cx,cy,R*.48,0,7);g.fill();
 // Telegraphs.
 const B=boss;for(const k of marks){const [sx,sy]=toScreen(k.x,k.y);g.fillStyle='rgba(255,40,70,'+(k.t>0?.18+(1-k.t)*.3:.6)+')';g.beginPath();g.arc(sx,sy,k.r*Z,0,7);g.fill()}
 if(B.act&&B.act.kind==='dash'&&B.act.t<B.act.tele){const [sx,sy]=toScreen(B.x,B.y);g.save();g.translate(sx,sy);g.rotate(Math.atan2(B.act.dy,B.act.dx));g.fillStyle='rgba(255,40,70,'+(.2+B.act.t/B.act.tele*.35)+')';g.fillRect(0,-13*Z,240*Z,26*Z);g.restore()}
 if(B.act&&B.act.kind==='sweep'&&B.act.t<B.act.tele+.2){const [sx,sy]=toScreen(B.x,B.y);g.fillStyle='rgba(255,40,70,'+(B.act.t<B.act.tele?.15+B.act.t/B.act.tele*.3:.6)+')';g.beginPath();g.arc(sx,sy,58*Z,0,7);g.fill()}
 const list=[];
 for(const e of enemies){const [sx,sy]=toScreen(e.x,e.y);list.push({y:e.y,draw:()=>drawWrangler(e,sx,sy,t)})}
 if(B.hp>0||modeT<99){const [sx,sy]=toScreen(B.x,B.y);list.push({y:B.y,draw:()=>{const sc=Z*.62;g.fillStyle='rgba(15,10,20,.45)';g.beginPath();g.ellipse(sx,sy+2*Z,16*Z,5*Z,0,0,7);g.fill();
  if(B.phase>=2){const p=.5+Math.sin(t*5)*.5;g.fillStyle='rgba(255,212,92,'+(.15+p*.15)+')';g.beginPath();g.arc(sx,sy-14*Z,24*Z,0,7);g.fill()}
  g.save();if(B.hurt>0)g.filter='brightness(2.2)';if(B.stun>0)g.filter='hue-rotate(160deg) brightness(1.3)';window.catCityBirmanArt?.draw?.(g,sx,sy-9.5*sc,'armour',{hp:B.hp,max:B.max,t,scale:sc});g.restore();
  if(B.phase>=2){g.fillStyle='#ffd45c';g.beginPath();g.ellipse(sx+10*Z,sy-10*Z,3*Z,4*Z,0,0,7);g.fill()}}})}
 {const [sx,sy]=toScreen(ally.x,ally.y);list.push({y:ally.y,draw:()=>{g.fillStyle='rgba(15,10,20,.4)';g.beginPath();g.ellipse(sx,sy+2*Z,6*Z,2*Z,0,0,7);g.fill();art.draw(g,sx,sy+2*Z,'biscuitBirman','idle',0,{scale:Z*.5});
  if(ally.beam>0){const [bx,by]=toScreen(B.x,B.y-14);g.strokeStyle='#c8f1ff';g.lineWidth=2*Z;g.beginPath();g.moveTo(sx,sy-10*Z);for(let i=1;i<6;i++)g.lineTo(lerp(sx,bx,i/6)+(Math.random()-.5)*8*Z,lerp(sy-10*Z,by,i/6)+(Math.random()-.5)*8*Z);g.stroke()}}})}
 if(B.phase===3&&mode!=='m3admin'){const img=adminImg(),[sx,sy]=toScreen(0,-ARENA+12);if(img){const k=Z*.7;list.push({y:-ARENA,draw:()=>{g.fillStyle='rgba(201,178,237,'+(.2+Math.sin(t*4)*.1)+')';g.beginPath();g.arc(sx,sy-12*Z,20*Z,0,7);g.fill();g.drawImage(img,sx-img.width*k/2,sy-img.height*k,img.width*k,img.height*k)}})}}
 list.push({y:me.y,draw:()=>drawPlayerAt(t)});list.sort((a,b)=>a.y-b.y);list.forEach(o=>o.draw());drawFx();
 // Boss health bar.
 const bw=W*.6,bx=(W-bw)/2,by=H*.1;g.fillStyle='#241a2c';g.fillRect(bx-2,by-2,bw+4,14);g.fillStyle='#6c1a2c';g.fillRect(bx,by,bw,10);g.fillStyle=B.phase===3?'#55e0ff':B.phase===2?'#ffd45c':'#e8506a';g.fillRect(bx,by,bw*B.hp/B.max,10);
 g.fillStyle='#fff6e4';g.font='bold 9px system-ui';g.textAlign='center';g.fillText('👑 BOSS BIRMAN · Phase '+B.phase+'/3',W/2,by-4);
 if(ko>0){g.fillStyle='rgba(0,0,0,'+clamp((2.2-ko)/1.2,0,.85)+')';g.fillRect(0,0,W,H)}
}
// ---------------------------------------------------------------- the locket (3D)
function drawM3Locket(t){
 const T0=modeT,M=Math.min(W,H);hallTex();
 const wide=T0<3||(T0>=9.5&&T0<12.5)||T0>=15.5;
 if(wide){const cam={x:TEX/2,y:1000,h:44,dir:-1,horizon:.4,focal:M*1.2};hallFloor(cam,t);const L=[];const add=(wx,wy,fn)=>{const pr=proj3(cam,wx,wy);if(pr)L.push({f:pr.f,draw:()=>fn(pr)})};
  const look=T0>=9.5;
  add(TEX/2,520,pr=>{const sc=2.2*pr.k;g.save();g.translate(pr.sx,pr.sy);g.scale(1,.82);window.catCityBirmanArt?.draw?.(g,0,-9.5*sc,'armour',{hp:1,max:1,t,scale:sc});g.restore()});
  add(TEX/2-170,650,pr=>drawMe(g,pr.sx,pr.sy,1.9*pr.k,'idle',0,false));
  add(TEX/2+160,650,pr=>art.draw(g,pr.sx,pr.sy,'biscuitBirman','idle',0,{scale:1.9*pr.k*.8}));
  add(TEX/2+290,600,pr=>{const img=adminImg();if(img){const k=1.3*pr.k;g.drawImage(img,pr.sx-img.width*k/2,pr.sy-img.height*k,img.width*k,img.height*k)}});
  if(look&&T0<12.5)add(TEX/2,590,pr=>{g.fillStyle='rgba(255,230,140,'+(.4+Math.sin(t*4)*.2)+')';g.beginPath();g.arc(pr.sx,pr.sy-4*pr.k,14*pr.k,0,7);g.fill();g.fillStyle='#ffd45c';g.beginPath();g.ellipse(pr.sx,pr.sy-4*pr.k,6*pr.k,7*pr.k,0,0,7);g.fill()});
  L.sort((a,b)=>b.f-a.f);L.forEach(o=>o.draw());
  if(T0>=15.5){g.fillStyle='rgba(255,250,240,'+clamp((T0-16)/1.5,0,1)+')';g.fillRect(0,0,W,H)}}
 else{g.fillStyle='#1a0e16';g.fillRect(0,0,W,H);const lx=W/2,ly=H*.5,lr=M*.18;
  // Paw.
  const fist=T0>=12.5?ease(clamp((T0-12.9)/.8,0,1)):0;g.fillStyle='#f3e6cc';g.beginPath();g.ellipse(lx,ly+lr*1.25,lr*1.5,lr*(.75-fist*.1),0,0,7);g.fill();g.fillStyle='#fff';for(let k=-1;k<=1;k++){g.beginPath();g.arc(lx+k*lr*.5,ly+lr*(.65+fist*.4),lr*.22,0,7);g.fill()}
  if(fist<1){const sq=1-fist*.8;g.save();g.translate(lx,ly);g.scale(1,sq);
   // Locket back (gold shell).
   g.fillStyle='#c8952b';g.beginPath();g.ellipse(0,0,lr*.82,lr,0,0,7);g.fill();g.fillStyle='#ffd45c';g.beginPath();g.ellipse(0,0,lr*.72,lr*.9,0,0,7);g.fill();g.fillStyle='#9a6f1c';g.beginPath();g.ellipse(0,0,lr*.55,lr*.7,0,0,7);g.fill();
   // The picture part: snapped off at 4.5 s.
   const off=T0>=4.5&&T0<9.5?ease(clamp((T0-4.5)/1,0,1)):T0>=9.5?1:0;
   if(T0<12.5){g.save();g.translate(off*lr*1.6,off*lr*.6);g.rotate(off*.6);g.fillStyle='#ffd45c';g.beginPath();g.ellipse(0,0,lr*.62,lr*.78,0,0,7);g.fill();g.fillStyle='#2e4a3a';g.beginPath();g.ellipse(0,0,lr*.52,lr*.66,0,0,7);g.fill();g.save();g.beginPath();g.ellipse(0,0,lr*.52,lr*.66,0,0,7);g.clip();art.draw(g,0,lr*.85,'biscuitBirman','idle',0,{scale:lr/15});g.restore();
    g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=M*.006;for(let i=0;i<3;i++){g.beginPath();g.moveTo(-lr*.45+i*lr*.22,-lr*.55);g.lineTo(-lr*.05+i*lr*.22,lr*.5);g.stroke()}g.restore()}
   g.restore()}
  if(T0>=4.5&&!said.snap){said.snap=1;beep(900,.12,'square',.06,-500)}
  // Tears.
  if(T0>=6.5&&T0<9.5){if(Math.random()<.18)drips.push({x:lx+(Math.random()-.5)*lr,y:H*.05,v:0,c:'#8fd0ff',w:M*.012,tear:1});}
  for(const d of drips){d.v+=H*.0012;d.y+=d.v;g.fillStyle=d.c;g.beginPath();g.ellipse(d.x,d.y,d.w*.6,d.w,0,0,7);g.fill();if(d.y>ly-lr*.2&&!d.sp){d.sp=1;fx.push({kind:'ripple',x:d.x,y:d.y,t:0})}}drips=drips.filter(d=>d.y<ly-lr*.2);
  for(const f of fx){if(f.kind!=='ripple')continue;f.t+=1/60;g.strokeStyle='rgba(143,208,255,'+Math.max(0,1-f.t*2)+')';g.lineWidth=2;g.beginPath();g.ellipse(f.x,f.y,f.t*M*.08,f.t*M*.03,0,0,7);g.stroke()}fx=fx.filter(f=>f.kind!=='ripple'||f.t<.6);
  if(fist>0){if(!said.crush){said.crush=1;SFX.bonk();camShake=.5}for(let i=0;i<24*fist;i++){g.fillStyle=i%2?'#ffd45c':'#c8952b';const a=i*.9,r=fist*lr*1.4;g.fillRect(lx+Math.cos(a)*r,ly+Math.sin(a)*r*.6,M*.012,M*.012)}}}
 const lines=[[.3,3,'The Boss Birman drops to his knees.'],[3.2,6.3,'He snaps the picture off the locket.'],[6.5,9.4,'…his tears fall onto the locket.'],[9.6,12.4,'Everyone stares at it in silence.'],[12.6,15.4,'Then the tears stop… and he crushes the locket.'],[15.6,17.6,'He turns away without a word.']];
 const cur=lines.find(l=>T0>=l[0]&&T0<l[1]);sayEl.style.display=cur?'block':'none';if(cur)sayEl.textContent=cur[2];
 if(T0>17.8){said.snap=said.crush=0;drips=[];setMode('m3home')}
}
function drawM3Ride(t){
 const T0=modeT,M=Math.min(W,H),cam={x:0,y:-T0*900,h:lerp(300,2600,ease(clamp(T0/5,0,1))),horizon:lerp(.35,.6,ease(clamp(T0/5,0,1))),focal:M*1.1};flyGround(cam,t,flyZone);
 g.fillStyle='rgba(90,10,30,'+(.25+T0*.08)+')';g.fillRect(0,0,W,H);
 if(T0>.3&&!said.iyg3){said.iyg3=1;voice('c02')}
 sayEl.style.display=T0<5.5?'block':'none';sayEl.textContent=T0<2.5?'🦹 "In ya go."':'The No Return taxi rises into the sky… there\'s no going back.';
 if(T0<.6){g.fillStyle='rgba(0,0,0,'+(1-T0/.6)+')';g.fillRect(0,0,W,H)}
 if(T0>5.2){g.fillStyle='rgba(0,0,0,'+clamp((T0-5.2)/.8,0,1)+')';g.fillRect(0,0,W,H)}
 if(T0>6.1){said.iyg3=0;fortStart(C.m3cp||0)}
}
function drawM3Home(t){
 const T0=modeT,M=Math.min(W,H),cam={x:0,y:-T0*1600,h:500,horizon:.32,focal:M*1.1};flyGround(cam,t,flyZone);
 const bx=W/2,by=H*.48+Math.sin(t*2)*M*.02,sc=M/105,fl=Math.sin(t*10)*.5;g.fillStyle='rgba(255,246,200,.9)';for(const sd of [-1,1]){g.save();g.translate(bx+sd*sc*6,by-sc*16);g.rotate(sd*(.4+fl));g.beginPath();g.ellipse(sd*sc*10,0,sc*12,sc*5,0,0,7);g.fill();g.restore()}
 art.draw(g,bx,by,'biscuitBirman','idle',0,{scale:sc});drawMe(g,bx+sc*2,by+sc*12,sc*.85,'jump',0,false);
 const img=adminImg();if(img){const k=sc*.9;g.drawImage(img,W*.78-img.width*k/2,H*.3+Math.sin(t*1.7)*M*.02-img.height*k,img.width*k,img.height*k)}
 if(T0<.9){g.fillStyle='rgba(255,250,240,'+(1-T0/.9)+')';g.fillRect(0,0,W,H)}
 if(T0>.6&&!said.hold3){said.hold3=1;voice('c08')}
 sayEl.style.display=T0>.6&&T0<4?'block':'none';sayEl.textContent='🐾 BISCUIT: "Hold on tight, we\'re going home."';
 if(T0>5.2){said.hold3=0;setMode('m3welcome')}
}
function finishM3(){
 const first=!C.m3;C.m3=true;C.m3s='done';if(s.biscuitFollow===undefined)s.biscuitFollow=true;if(first){s.fish=(s.fish||0)+500;window.catCityLevels?.add?.(400,'noreturn')}core.persist();
 endInfo={title:'🏰 Mission 3 complete: No Return',sub:'Biscuit is home for good — and he\'s following you now! (Turn it off in Settings.)',reward:first?'Rewards: 🐟 500 fish · ⭐ 400 XP · 🐾 Birman Biscuit companion':'',finish:()=>{close();s.x=HOME.x;s.y=HOME.y;core.persist();core.note('🐾 Birman Biscuit is following you! You can turn this off in Settings.')}};setMode('end');
}
// ---------------------------------------------------------------- settings: Biscuit follows me
function companionSetting(){const panel=$('settings-panel'),saves=$('settings-saves');if(!panel||!C.m3)return;let row=$('cc-biscuit-follow-row');
 if(!row){row=document.createElement('div');row.className='settings-section';row.id='cc-biscuit-follow-row';row.innerHTML='<label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="cc-biscuit-follow" style="width:auto;min-height:0;margin:0"> 🐾 Birman Biscuit follows me</label>';(saves||panel).before?saves?saves.before(row):panel.append(row):panel.append(row);
  $('cc-biscuit-follow').onchange=e=>{s.biscuitFollow=!!e.target.checked;comp=null;core.persist()}}
 const box=$('cc-biscuit-follow');if(box&&box.checked!==(s.biscuitFollow!==false))box.checked=s.biscuitFollow!==false}
setInterval(companionSetting,1500);
// ---------------------------------------------------------------- Mission 2 starts after a knockout (30%, once the castle mission is done)
window.addEventListener('catcity:knockout',()=>{if(open||!C.done||C.m2)return;if(!(Math.random()<.3||window.__ccForceM2))return;window.__ccForceM2=false;
 setTimeout(()=>{const d=$('dialog');if(d)d.style.display='none';start({stage:'m2'})},1500)});

// ================================================================== MISSION 3 CUTSCENES (3D)
function nightVillage(cam,t,night){
 const hz=cam.horizon*H,tex=villageTex();const sky=g.createLinearGradient(0,0,0,hz);
 if(night){sky.addColorStop(0,'#0b0820');sky.addColorStop(1,'#2a2050')}else{sky.addColorStop(0,'#7ec4f2');sky.addColorStop(1,'#fff1d6')}g.fillStyle=sky;g.fillRect(0,0,W,hz+1);
 if(night){for(let i=0;i<50;i++){g.fillStyle='rgba(255,255,255,'+(.4+Math.sin(t*2+i)*.3)+')';g.fillRect((i*137)%W,(i*71)%Math.max(1,hz*.9),1,1)}g.fillStyle='#fff6d6';g.beginPath();g.arc(W*.78,hz*.3,Math.min(W,H)*.05,0,7);g.fill()}
 for(let r=Math.ceil(hz)+1;r<H;r+=2){const d=cam.h*cam.focal/(r-hz),span=W*d/cam.focal,wy=cam.y-d;if(wy<0||wy>=TEX){g.fillStyle=night?'#1c2a22':'#8cbd7a';g.fillRect(0,r,W,2);continue}g.drawImage(tex,cam.x-span/2,wy,span,1,0,r,W,2);const fog=Math.min(.5,d/2600);g.fillStyle=night?'rgba(10,8,32,'+(.45+fog*.5)+')':'rgba(255,241,214,'+fog+')';g.fillRect(0,r,W,2)}
 const L=[];for(const [hx,hy,c] of [[TEX/2-330,LINE-260,'#f5b2ae'],[TEX/2+330,LINE-260,'#d9b5ee'],[TEX/2-420,LINE-40,'#b3d9ed'],[TEX/2+420,LINE-40,'#f4c879'],[TEX/2-200,LINE-460,'#a7dd9b'],[TEX/2+220,LINE-480,'#c9b2ed']]){const pr=proj3({...cam,dir:-1},hx,hy);if(pr)L.push({f:pr.f,draw:()=>{const w=120*pr.k,hh=90*pr.k;g.fillStyle='#241a2c';g.fillRect(pr.sx-w/2-2,pr.sy-hh-2,w+4,hh+4);g.fillStyle=c;g.fillRect(pr.sx-w/2,pr.sy-hh,w,hh);if(night){g.fillStyle='rgba(10,8,32,.55)';g.fillRect(pr.sx-w/2,pr.sy-hh,w,hh)}g.fillStyle='#806aa0';g.beginPath();g.moveTo(pr.sx-w*.62,pr.sy-hh);g.lineTo(pr.sx,pr.sy-hh*1.65);g.lineTo(pr.sx+w*.62,pr.sy-hh);g.fill();g.fillStyle=night?'#ffd45c':'#fff0b5';g.fillRect(pr.sx-w*.08,pr.sy-hh*.45,w*.16,hh*.45)}})}
 return L;
}
function capt(lines,T0){const cur=lines.find(l=>T0>=l[0]&&T0<l[1]);sayEl.style.display=cur?'block':'none';if(cur)sayEl.textContent=cur[2]}
// Biscuit sneaks out of the village at night.
function drawM3Leave(t){
 const T0=modeT,M=Math.min(W,H),cam={x:TEX/2,y:LINE+260,h:40,dir:-1,horizon:.42,focal:M*1.15};const L=nightVillage(cam,t,true);
 // Walks away, stops, looks back, walks on.
 const d1=ease(clamp((T0-1)/3,0,1)),d2=ease(clamp((T0-7.2)/3.4,0,1)),wy=LINE+120-d1*260-d2*700,look=T0>4.1&&T0<7.2,walking=(T0>1&&T0<4.1)||T0>7.2;
 const pr=proj3(cam,TEX/2+10,wy);if(pr)L.push({f:pr.f,draw:()=>{g.save();g.globalAlpha=1-clamp((T0-9.6)/1,0,1);g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(pr.sx,pr.sy,14*pr.k*1.9,4*pr.k,0,0,7);g.fill();
  art.draw(g,pr.sx,pr.sy,'biscuitBirman',look?'idle':'walkBack',walking?Math.floor(t*5)%2:0,{scale:1.9*pr.k*.8});g.restore()}});
 L.sort((a,b)=>b.f-a.f);L.forEach(o=>o.draw());
 if(T0>4.3&&!said.lv){said.lv=1;voice('c04')}
 capt([[.3,3.8,'Late last night…'],[4.2,7,'Biscuit looks back at the village one last time. "…I\'m sorry."'],[7.4,10.4,'…and walks off into the dark.']],T0);
 if(T0<.8){g.fillStyle='rgba(0,0,0,'+(1-T0/.8)+')';g.fillRect(0,0,W,H)}
 if(T0>10.4){g.fillStyle='rgba(0,0,0,'+clamp((T0-10.4)/.8,0,1)+')';g.fillRect(0,0,W,H)}
 if(T0>11.3){said.lv=0;close();C.m3s='trail';core.persist();core.note('🐾 Follow Biscuit\'s glowing pawprints to the No Return taxi!')}
}
// Before the fight: the Boss Birman on his throne, Biscuit stands up to him.
function drawM3Intro(t){
 const T0=modeT,M=Math.min(W,H);hallTex();const close1=T0>4.6&&T0<7.4;
 const cam=close1?{x:TEX/2,y:640,h:30,dir:-1,horizon:.38,focal:M*1.3}:{x:TEX/2+Math.sin(T0*.3)*40,y:lerp(1060,960,ease(clamp(T0/4,0,1))),h:40,dir:-1,horizon:.4,focal:M*1.15};
 if(camShake>0){cam.x+=(Math.random()-.5)*camShake*50;camShake=Math.max(0,camShake-1/60)}
 hallFloor(cam,t);g.fillStyle='rgba(60,0,20,.25)';g.fillRect(0,0,W,H);
 const L=[],add=(wx,wy,fn)=>{const pr=proj3(cam,wx,wy);if(pr)L.push({f:pr.f,draw:()=>fn(pr)})};
 // Throne and the Boss (sitting, then standing up).
 const stand=ease(clamp((T0-7.6)/.8,0,1));
 add(TEX/2,330,pr=>{const k=pr.k;g.fillStyle='#241a2c';g.fillRect(pr.sx-60*k,pr.sy-150*k,120*k,150*k);g.fillStyle='#c8952b';g.fillRect(pr.sx-56*k,pr.sy-146*k,112*k,142*k);g.fillStyle='#7a2236';g.fillRect(pr.sx-42*k,pr.sy-130*k,84*k,80*k);g.fillStyle='#e8506a';g.fillRect(pr.sx-8*k,pr.sy-158*k,16*k,14*k);
  const sc=2.2*k,sy=pr.sy-lerp(30,0,stand)*k;g.save();g.translate(pr.sx,sy);g.scale(1,lerp(.86,1,stand));window.catCityBirmanArt?.draw?.(g,0,-9.5*sc,'armour',{hp:1,max:1,t,scale:sc});g.restore()});
 // Biscuit walks up; you stay back.
 const bw=ease(clamp((T0-1.2)/2.8,0,1));
 add(TEX/2-10,lerp(820,520,bw),pr=>{g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(pr.sx,pr.sy,12*pr.k*1.9,3*pr.k,0,0,7);g.fill();art.draw(g,pr.sx,pr.sy,'biscuitBirman',bw<1?'walkBack':'idle',bw<1?Math.floor(t*5)%2:0,{scale:1.9*pr.k*.8})});
 if(!close1)add(TEX/2+140,860,pr=>drawMe(g,pr.sx,pr.sy,1.9*pr.k,'idle',0,false));
 L.sort((a,b)=>b.f-a.f);L.forEach(o=>o.draw());
 if(T0>7.6&&!said.stand){said.stand=1;SFX.bonk();camShake=.5}
 for(const c of [4.6,7.4])if(T0>c&&T0<c+.07){g.fillStyle='#000';g.fillRect(0,0,W,H)}
 const lb=H*.1;g.fillStyle='#000';g.fillRect(0,0,W,lb);g.fillRect(0,H-lb,W,lb);
 capt([[.3,1.2,'The throne room at the top of the fortress…'],[1.3,4.4,'Biscuit walks right up to the Boss Birman.'],[4.7,7.3,'🐾 BISCUIT: "I\'m not coming back. Not ever."'],[7.7,10,'👑 BOSS BIRMAN: "Then I\'ll TAKE you back."']],T0);
 if(T0<.7){g.fillStyle='rgba(0,0,0,'+(1-T0/.7)+')';g.fillRect(0,0,W,H)}
 if(T0>10.2){said.stand=0;bossStart(true)}
}
// Phase 3: the screen glitches, a portal opens, the Admin steps out.
function drawM3Admin(t){
 const T0=modeT,M=Math.min(W,H);drawBoss3(t);
 const [px,py]=toScreen(0,-ARENA+30),open3=ease(clamp((T0-.8)/1,0,1))*(1-ease(clamp((T0-4.6)/.6,0,1)));
 if(T0<1.2){for(let i=0;i<8;i++){g.fillStyle=i%2?'rgba(201,178,237,.5)':'rgba(255,59,92,.4)';g.fillRect(0,Math.random()*H,W,2+Math.random()*8)}}
 if(open3>0){const r=34*Z*open3;for(let k=5;k>0;k--){g.fillStyle=k%2?'rgba(180,124,240,'+(.18+k*.06)+')':'rgba(255,212,92,'+(.12+k*.04)+')';const rr=r*k/5*(1+Math.sin(t*6+k)*.06);g.beginPath();g.ellipse(px,py-rr*.6,rr*.7,rr,0,0,7);g.fill()}g.fillStyle='#0b0510';g.beginPath();g.ellipse(px,py-r*.6,r*.35,r*.6,0,0,7);g.fill()}
 const img=adminImg(),step=ease(clamp((T0-1.8)/1,0,1));if(img&&step>0){const k=Z*.9*step;g.drawImage(img,px-img.width*k/2,py-img.height*k+(1-step)*10*Z,img.width*k,img.height*k)}
 if(T0>2.6&&!said.adm){said.adm=1;voice('c06')}
 if(T0>3.6&&T0<4.4){g.fillStyle='rgba(85,224,255,'+(.5-(T0-3.6)*.6)+')';g.fillRect(0,0,W,H)}
 capt([[.2,1.6,'⚠️ The arena glitches…'],[1.8,3.5,'👑 ADMIN: "Nope. Not today!"'],[3.6,5.2,'⚡ ADMIN POWER! Your attacks are 3× stronger!']],T0);
 if(T0>5.3){said.adm=0;power=999;enemies=[];setMode('m3boss')}
}
// Back in the village: everyone runs over to welcome you both home.
let confetti=[];
function drawM3Welcome(t){
 const T0=modeT,M=Math.min(W,H),cam={x:TEX/2,y:LINE+300,h:38,dir:-1,horizon:.42,focal:M*1.15};const L=nightVillage(cam,t,false);
 add3(L,cam,TEX/2-40,LINE+60,pr=>drawMe(g,pr.sx,pr.sy,1.9*pr.k,'idle',0,false));
 add3(L,cam,TEX/2+40,LINE+60,pr=>{const hop=T0>3?Math.abs(Math.sin(t*6))*8*pr.k:0;art.draw(g,pr.sx,pr.sy-hop,'biscuitBirman',T0>3?'jump':'idle',0,{scale:1.9*pr.k*.62})});
 const npcs=[['marmalade',-420,-120],['slaycat',420,-120],['luna',-300,-300],['pebble',300,-300],['forge',0,-380]];
 npcs.forEach(([id,ox,oy],i)=>{const p=ease(clamp((T0-.6-i*.25)/2.2,0,1)),tx=TEX/2+ox*.35,ty=LINE+oy*.3-10,sx0=TEX/2+ox*1.6,sy0=LINE+oy*1.4;
  add3(L,cam,lerp(sx0,tx,p),lerp(sy0,ty,p),pr=>{g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(pr.sx,pr.sy,12*pr.k*1.9,3*pr.k,0,0,7);g.fill();art.draw(g,pr.sx,pr.sy-(p>=1?Math.abs(Math.sin(t*5+i))*6*pr.k:0),id,p<1?'walkFront':'idle',p<1?Math.floor(t*6)%2:0,{scale:1.9*pr.k})})});
 L.sort((a,b)=>b.f-a.f);L.forEach(o=>o.draw());
 if(T0>2.8){if(confetti.length<120)for(let i=0;i<4;i++)confetti.push({x:Math.random()*W,y:-10,v:1+Math.random()*2,c:['#ff6f8f','#ffd45c','#7fb3ff','#b47cf0','#55e07a'][i%5],r:Math.random()*6});for(const c of confetti){c.y+=c.v*H/300;c.r+=.1;g.fillStyle=c.c;g.fillRect(c.x+Math.sin(c.r)*4,c.y,3,4)}confetti=confetti.filter(c=>c.y<H)}
 capt([[.4,2.6,'🏡 Back in Cat Village…'],[2.8,5,'🎉 "WELCOME HOME!"'],[5.1,7.4,'💜 SLAYCAT: "Biscuit, you\'re a BIRMAN now?! Iconic."'],[7.5,9.6,'🐾 Biscuit waves. He\'s home for good.']],T0);
 if(T0<.8){g.fillStyle='rgba(255,250,240,'+(1-T0/.8)+')';g.fillRect(0,0,W,H)}
 if(T0>9.8){confetti=[];finishM3()}
}
function add3(L,cam,wx,wy,fn){const pr=proj3(cam,wx,wy);if(pr)L.push({f:pr.f,draw:()=>fn(pr)})}

// ================================================================== THE END (for now)
let endInfo=null;
function drawEnd(t){
 if(endInfo){const T0=modeT,M=Math.min(W,H);g.fillStyle='#000';g.fillRect(0,0,W,H);g.textAlign='center';g.globalAlpha=clamp(T0,0,1);g.fillStyle='#ffd45c';g.font='bold '+Math.round(M*.05)+'px system-ui';g.fillText(endInfo.title,W/2,H*.4);g.fillStyle='#e9dcff';g.font='bold '+Math.round(M*.028)+'px system-ui';g.fillText(endInfo.sub,W/2,H*.4+M*.08);
  if(T0>1.5){g.fillStyle='#fff6e4';if(endInfo.reward)g.fillText(endInfo.reward,W/2,H*.4+M*.15);g.fillText('Tap / press any key to continue',W/2,H*.4+M*.22)}g.globalAlpha=1;sayEl.style.display='none';if(T0>9)finishMission();return}
 const T0=modeT;g.fillStyle='#000';g.fillRect(0,0,W,H);g.textAlign='center';
 g.globalAlpha=clamp(T0/1,0,1);g.fillStyle='#ffd45c';g.font='bold '+Math.round(Math.min(W,H)*.06)+'px system-ui';g.fillText(C.ch2?'The End… for now':'To be continued…',W/2,H*.4);
 g.fillStyle='#e9dcff';g.font='bold '+Math.round(Math.min(W,H)*.03)+'px system-ui';g.fillText(C.ch2?'🏰 The Long Way Home — complete!':'🏰 Chapter 1 complete',W/2,H*.4+Math.min(W,H)*.08);
 if(T0>1.5){g.fillStyle='#fff6e4';g.fillText(C.r2?'Rewards already collected':'Chapter 2 rewards: 🐟 300 fish · ⭐ 200 XP · 🐾 Birman Biscuit in the village',W/2,H*.4+Math.min(W,H)*.15);g.fillText('Tap / press any key to go home',W/2,H*.4+Math.min(W,H)*.22)}
 g.globalAlpha=1;sayEl.style.display='none';
 if(T0>9)finishMission();
}
cv.addEventListener('pointerdown',()=>{if(mode==='end'&&modeT>1.5)finishMission()});
function finishChapter1(){C.ch1=true;C.stage='ch2';if(!C.r1){C.r1=1;s.fish=(s.fish||0)+500;window.catCityLevels?.add?.(300,'castle')}core.persist()}
function finishMission(){
 if(!open)return;if(endInfo){const f=endInfo.finish;endInfo=null;f();return}const first=!C.r2;
 if(first){C.r2=1;s.fish=(s.fish||0)+300;window.catCityLevels?.add?.(200,'castle');s.completed=Array.isArray(s.completed)?s.completed:[];if(!s.completed.includes('castle-escape'))s.completed.push('castle-escape')}
 C.done=true;C.ch2=true;C.stage='';C.room=0;C.island=0;s.x=HOME.x;s.y=HOME.y;core.persist();close();
 core.note(first?'🏡 Home at last! Biscuit is back in the village… as a small Birman. +300 🐟 · +200 XP':'🏡 Back home in Cat Village.');
}

// ================================================================== LOOP
const MUSIC={taxi:'castle',play:'castle',biscuit:'cave',drag:'bossbirman',abyss:'cave',wake:'cave',glitch:'takeover',islands:'islands',fall:'islands',adminpov:'islands',end:'town',m2intro:'locket',m2cmd:'locket',m2console:'locket',m3ride:'noreturn',m3climb:'noreturn',m3boss:'bossbirman',m3locket:'locket',m3home:'islands',m3leave:'locket',m3intro:'bossbirman',m3admin:'bossbirman',m3welcome:'town'};
function loop(now){
 if(!open)return;window.catCityMissionMusic=MUSIC[mode]||'castle';const dt=Math.min(.05,(now-last)/1000);last=now;modeT+=dt;const t=now/1000;fit();
 try{
  if(mode==='play'){updatePlay(dt);if(mode==='play')drawPlay(t)}
  else if(mode==='taxi')drawTaxi3D(t);
  else if(mode==='biscuit')drawBiscuit3D(t);
  else if(mode==='drag')drawDrag(t);
  else if(mode==='abyss')drawAbyss(t);
  else if(mode==='wake')drawWake(t);
  else if(mode==='glitch')drawGlitch(t);
  else if(mode==='islands'){updateIslands(dt);if(mode==='islands')drawIslands(t)}
  else if(mode==='fall')drawFall(t);
  else if(mode==='adminpov')drawAdminPov(t);
  else if(mode==='m2intro')drawM2Intro(t);
  else if(mode==='m2cmd'){updateM2(dt);drawPlay(t)}
  else if(mode==='m2console')drawM2Console(t);
  else if(mode==='m3ride')drawM3Ride(t);
  else if(mode==='m3climb'){updateFort(dt);if(mode==='m3climb')drawFort(t)}
  else if(mode==='m3boss'){updateBoss(dt);if(mode==='m3boss')drawBoss3(t)}
  else if(mode==='m3locket')drawM3Locket(t);
  else if(mode==='m3home')drawM3Home(t);
  else if(mode==='m3leave')drawM3Leave(t);
  else if(mode==='m3intro')drawM3Intro(t);
  else if(mode==='m3admin')drawM3Admin(t);
  else if(mode==='m3welcome')drawM3Welcome(t);
  else if(mode==='end')drawEnd(t);
  if(PLAYLIKE.includes(mode)&&sayUntil&&now>sayUntil){sayEl.style.display='none';sayUntil=0}
  drawHud();
 }catch(e){console.error('[castle]',e)}
 raf=requestAnimationFrame(loop);
}

// ================================================================== OWNER TOOLS
function adminTools(){
 const anchor=$('cc-admin-set-level');if(!anchor||$('cc-admin-castle'))return;
 const box=document.createElement('div');box.id='cc-admin-castle';box.style.cssText='margin-top:8px;padding-top:6px;border-top:1px dashed #ffd45c66';
 box.innerHTML='<strong>🚕 Taxi mission (Birman Castle)</strong><br><label>Room<select id="cc-admin-castle-room">'+ROOMS.map((r,i)=>'<option value="'+i+'">'+(i+1)+'. '+r.name+'</option>').join('')+'</select></label> <button id="cc-admin-castle-go">🏰 Jump to room</button> <button id="cc-admin-castle-taxi">🚕 Play from the taxi cutscene</button> <button id="cc-admin-castle-force">🎲 Next taxi ride = mission</button> <button id="cc-admin-castle-ch2">2️⃣ Play Chapter 2</button> <button id="cc-admin-castle-isl">🏝️ Jump to the islands</button> <button id="cc-admin-m2">🔒 Play Mission 2 (Locket)</button> <button id="cc-admin-m3">🚕 Play Mission 3 (No Return)</button> <button id="cc-admin-m3boss">👑 Mission 3 boss</button> <button id="cc-admin-castle-reset">↺ Reset mission</button>';
 anchor.after(box);
 $('cc-admin-castle-go').onclick=()=>{if(!window.catCityIsOwner?.())return;closeSettings();start({room:Number($('cc-admin-castle-room').value)||0})};
 $('cc-admin-castle-taxi').onclick=()=>{if(!window.catCityIsOwner?.())return;closeSettings();start({room:0,cutscene:true})};
 $('cc-admin-castle-ch2').onclick=()=>{if(!window.catCityIsOwner?.())return;closeSettings();start({stage:'ch2'})};
 $('cc-admin-castle-isl').onclick=()=>{if(!window.catCityIsOwner?.())return;closeSettings();C.island=0;start({stage:'islands'})};
 $('cc-admin-m2').onclick=()=>{if(!window.catCityIsOwner?.())return;closeSettings();start({stage:'m2'})};
 $('cc-admin-m3').onclick=()=>{if(!window.catCityIsOwner?.())return;closeSettings();C.m3s='fort';C.m3cp=0;start({stage:'m3'})};
 $('cc-admin-m3boss').onclick=()=>{if(!window.catCityIsOwner?.())return;closeSettings();start({stage:'m3boss'})};
 $('cc-admin-castle-force').onclick=()=>{window.__ccForceTaxiMission=true;core.note('🎲 Your next taxi ride will start the mission.')};
 $('cc-admin-castle-reset').onclick=()=>{Object.assign(C,{room:0,done:false,seenTaxi:false,biscuit:false,crook:false,ch1:false,ch2:false,stage:'',island:0,m2:false,m3:false,m3s:'',m3cp:0});s.castle=C;core.persist();core.note('↺ Taxi mission reset.')};
}
function closeSettings(){document.querySelectorAll('.show,.open').forEach(el=>{if(/settings|admin/i.test(el.id||'')&&el.id!=='cc-admin-tools')el.classList.remove('show','open')});$('settings')?.classList.remove('show','open')}
setInterval(adminTools,1500);

window.catCityCastleEscape={start,open:()=>open,state:()=>({open,mode,room,hp,enemies:enemies.filter(e=>e.room===room).length,objective:rs[room]?.obj,me:{...me},castle:{...C}}),
 _test:{m:()=>({mode,orders,cp,boss:boss&&{hp:boss.hp,phase:boss.phase},C:{...C}}),send:()=>sendBtn.onclick(),order:i=>{cmdTarget=m2Squad()||cmdTarget;m2Order(i)},squads:()=>squads.map(q=>({done:q.done,x:q.members[0].x,y:q.members[0].y})),bossHit:n=>bossHit(n),lore:()=>loreSpots().map(L=>({id:L.id,x:L.x,y:L.y})),nr:()=>nrPos(),fc:()=>FC,isl:()=>({isl,jump:!!jump,clear:islClear(isl),enemies:enemies.filter(e=>e.isl===isl).length}),pad:i=>padPos(i),
 heal:()=>{hp=MAXHP},lp:()=>lockpick,skip:skipCutscene,teleport:(x,y)=>{me.x=x;me.y=y},rooms:()=>rooms,objs:()=>objs,use,attack,rs:()=>rs,setMode,stops,nearStop}};
})();

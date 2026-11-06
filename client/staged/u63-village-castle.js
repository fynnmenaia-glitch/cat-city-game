/* Staged update u63 (request #63): 🏰 the Village Castle.
 * - 🛡️ Security in the 🏘️ Village tab now builds castle walls around the village:
 *   each level adds more wall (level 10 is the top level).
 * - Pressing the upgrade to level 10: you have to go to bed in your house, or you
 *   get sleepy and fall asleep where you are… and wake up inside the finished castle.
 * - Great Hall (bottom): the door leads outside to the south gate. Stairs go up.
 * - Castle top: "🔭 See the view" turns 3D, in your cat's eyes, looking out over
 *   Cat City and the biomes. Drag / arrow keys / ◀ ▶ to look around.
 * - Later on, walk up to the south gate tower and press E / 🐾 to go back in.
 */
(()=>{'use strict';
if(window.__ccU63)return;window.__ccU63=true;
const core=window.__catCityEngine,I=window.catCityInteriors;if(!core||!I)return;
const s=core.state,T=core.T,$=id=>document.getElementById(id),MAX=10;
const X0=-28,Y0=-28,X1=48*T+28,Y1=35*T+28,GATE={x:24*T,y:Y1};
s.villageCastle=s.villageCastle&&typeof s.villageCastle==='object'?s.villageCastle:{done:false,pending:false};
const C=s.villageCastle;
const security=()=>{try{return Number(JSON.parse(localStorage.getItem('catcity_tycoon_v1')||'{}').security)||0}catch(e){return 0}};
const HOME_ROOMS=['home','Rose Cottage','Lavender Lodge','Golden Villa'];
const busy=()=>core.bossMode||!!window.catCityCastleEscape?.open?.()||$('cc-upd')?.classList.contains('open')||$('cc-cz-scene')?.classList.contains('open');

// ------------------------------------------------------------------ walls in the world
// The wall runs clockwise from the south gate, with gaps where the village paths leave.
const GAPS={bottom:[22*T,26*T],top:[22*T,26*T],left:[15*T,19*T],right:[15*T,19*T]};
const SEG=[];// {x,y,horiz}
(()=>{const B=32;
 for(let x=GATE.x-B;x>=X0;x-=B)if(x+B<=GAPS.bottom[0]||x>=GAPS.bottom[1])SEG.push({x,y:Y1,h:true});
 for(let y=Y1-B;y>=Y0;y-=B)if(y+B<=GAPS.left[0]||y>=GAPS.left[1])SEG.push({x:X0,y,h:false});
 for(let x=X0+B;x<=X1;x+=B)if(x+B<=GAPS.top[0]||x>=GAPS.top[1])SEG.push({x,y:Y0,h:true});
 for(let y=Y0+B;y<=Y1;y+=B)if(y+B<=GAPS.right[0]||y>=GAPS.right[1])SEG.push({x:X1,y,h:false});
 for(let x=X1-B;x>=GATE.x;x-=B)if(x+B<=GAPS.bottom[0]||x>=GAPS.bottom[1])SEG.push({x,y:Y1,h:true});
})();
const TOWERS=[[X0,Y0],[X1,Y0],[X0,Y1],[X1,Y1],[GAPS.bottom[0]-20,Y1],[GAPS.bottom[1]+20,Y1],[GAPS.top[0]-20,Y0],[GAPS.top[1]+20,Y0],[X0,GAPS.left[0]-20],[X0,GAPS.left[1]+20],[X1,GAPS.right[0]-20],[X1,GAPS.right[1]+20]];
function drawWalls(g,t){
 const lvl=Math.min(MAX,security());if(lvl<=0&&!C.done)return;
 const built=C.done?SEG.length:Math.floor(SEG.length*lvl/MAX),cam={x:s.x,y:s.y},far=(x,y)=>Math.abs(x-cam.x)>core.W/2+80||Math.abs(y-cam.y)>core.H/2+80;
 for(let i=0;i<SEG.length;i++){const p=SEG[i];if(far(p.x,p.y))continue;
  if(i<built){if(p.h){g.fillStyle='#5d5872';g.fillRect(p.x,p.y-10,32,22);g.fillStyle='#8d88a6';g.fillRect(p.x,p.y-14,32,18);g.fillStyle='#a9a4c2';for(let k=0;k<32;k+=10)g.fillRect(p.x+k,p.y-20,6,6);g.fillStyle='#6f6a88';g.fillRect(p.x,p.y-4,32,2);g.fillRect(p.x+15,p.y-14,2,10)}
   else{g.fillStyle='#5d5872';g.fillRect(p.x-11,p.y,22,32);g.fillStyle='#8d88a6';g.fillRect(p.x-9,p.y,18,32);g.fillStyle='#a9a4c2';for(let k=0;k<32;k+=10)g.fillRect(p.x-9,p.y+k,4,6);g.fillStyle='#6f6a88';g.fillRect(p.x-9,p.y+15,18,2)}}
  else if(i<built+3&&lvl<MAX){// scaffolding where the builders are working
   g.fillStyle='#9a6a3a';if(p.h){g.fillRect(p.x+2,p.y-18,3,28);g.fillRect(p.x+26,p.y-18,3,28);g.fillRect(p.x,p.y-12,32,3);g.fillRect(p.x,p.y+2,32,3)}else{g.fillRect(p.x-10,p.y+2,28,3);g.fillRect(p.x-10,p.y+26,28,3);g.fillRect(p.x-8,p.y,3,32);g.fillRect(p.x+5,p.y,3,32)}
   if(i===built&&Math.floor(t*3)%2){g.fillStyle='#ffd45c';g.fillRect(p.x+12,p.y-24,4,4)}}}
 if(lvl>=MAX||C.done)for(const [x,y] of TOWERS){if(far(x,y))continue;g.fillStyle='#4d4862';g.fillRect(x-22,y-30,44,48);g.fillStyle='#8d88a6';g.fillRect(x-20,y-34,40,46);g.fillStyle='#a9a4c2';for(let k=-20;k<20;k+=10)g.fillRect(x+k,y-42,6,8);
  g.fillStyle='#2a1d33';g.fillRect(x-4,y-22,8,12);if(!C.done){g.fillStyle='#9a6a3a';g.fillRect(x-24,y-40,3,56);g.fillRect(x+21,y-40,3,56);g.fillRect(x-24,y-20,48,3)}
  else{g.fillStyle='#7a5235';g.fillRect(x-1,y-62,2,22);g.fillStyle=(x+y)%2?'#c9a2ff':'#ffd45c';g.fillRect(x+1,y-62+Math.round(Math.sin(t*3+x)*1),12,8)}}
 if(C.done&&!far(GATE.x,GATE.y)){const gx=GAPS.bottom[0]-20;// door into the castle, in the gate tower
  g.fillStyle='#6b4b2f';g.fillRect(gx-8,Y1-2,16,20);g.fillStyle='#ffd45c';g.fillRect(gx+4,Y1+8,2,2);
  if(nearDoor()){g.font='bold 11px system-ui';g.textAlign='center';g.lineWidth=3;g.strokeStyle='#241832';g.fillStyle='#fff6e4';g.strokeText('E / 🐾 · Enter the castle',gx,Y1+32);g.fillText('E / 🐾 · Enter the castle',gx,Y1+32)}}
}
const nearDoor=()=>C.done&&Math.hypot(s.x-(GAPS.bottom[0]-20),s.y-(Y1+12))<50;
const oldTerrain=window.catCityDrawOverhaul;
window.catCityDrawOverhaul=function(ct,st,...rest){const r=oldTerrain?.(ct,st,...rest);try{ct.save();ct.imageSmoothingEnabled=false;drawWalls(ct,performance.now()/1000);ct.restore()}catch(e){}return r};
const oldInteract=core.interact;
core.interact=function(){if(nearDoor()&&!busy()&&$('dialog')?.style.display!=='block'){I.enter('vc-hall');I.kit&&say('🏰 Welcome back to your castle!');return}return oldInteract()};

// ------------------------------------------------------------------ Village tab: level 10 is the top
function tycoonUI(){const opts=$('tycoon-options');if(!opts)return;const lvl=security();
 for(const b of opts.querySelectorAll('button')){if(!/Upgrade security/.test(b.textContent))continue;
  if(lvl>=MAX){if(!b.dataset.castle){b.dataset.castle='1';b.textContent='🏰 Castle complete · top level';b.disabled=true;b.onclick=null;const d=b.nextElementSibling;if(d)d.textContent='Security level '+lvl+': your castle protects the whole village.'}}
  else if(!b.dataset.castleHint){b.dataset.castleHint='1';const d=b.nextElementSibling;if(d)d.textContent+=lvl===MAX-1?' 🏰 This finishes the castle!':' 🏰 Each level builds more castle wall ('+lvl+'/'+MAX+').'}}}
new MutationObserver(tycoonUI).observe(document.body,{childList:true,subtree:true});

// ------------------------------------------------------------------ going to sleep
const ov=document.createElement('div');ov.id='cc-u63-sleep';ov.style.cssText='position:fixed;inset:0;z-index:9550;pointer-events:none;display:none';
ov.innerHTML='<div id="cc-u63-top" style="position:absolute;left:0;right:0;top:0;height:0;background:#000;transition:height 1.6s ease-in"></div><div id="cc-u63-bot" style="position:absolute;left:0;right:0;bottom:0;height:0;background:#000;transition:height 1.6s ease-in"></div><div id="cc-u63-dark" style="position:absolute;inset:0;background:radial-gradient(circle,#0000 30%,#120b1c);opacity:0;transition:opacity 6s"></div><div id="cc-u63-txt" style="position:absolute;left:50%;top:44%;transform:translateX(-50%);color:#e9dcff;font:bold 24px system-ui;text-shadow:0 2px 6px #000;text-align:center;width:90vw"></div>';
document.body.append(ov);
const dlg=document.createElement('div');dlg.className='cc-pf-dialog';dlg.id='cc-u63-dlg';dlg.innerHTML='<div><div class="big">🏰</div><h3>The castle is nearly finished!</h3><div>The builders will work through the night. 😴 <b>Go to bed in your house</b> to sleep while they finish…<br><small>(If you stay up, you\'ll get sleepy soon!)</small></div><div style="margin-top:8px"><button type="button">OK!</button></div></div>';document.body.append(dlg);
dlg.querySelector('button').onclick=()=>dlg.classList.remove('open');
let sleepyAt=0,sleeping=false,switching=false,lastRoom=null;
function eyes(close,ms){$('cc-u63-top').style.transitionDuration=$('cc-u63-bot').style.transitionDuration=(ms/1000)+'s';$('cc-u63-top').style.height=$('cc-u63-bot').style.height=close?'51%':'0'}
function sleep(where){if(sleeping)return;sleeping=true;ov.style.display='block';$('cc-u63-txt').textContent=where==='bed'?'🛏️ You snuggle into bed…':'🥱 You curl up right where you are…';eyes(true,1600);
 setTimeout(()=>{$('cc-u63-txt').textContent='💤 Zzz…';$('cc-u63-dark').style.opacity='0'},1900);
 setTimeout(()=>{$('cc-u63-txt').textContent='🔨 *tap tap tap* …the builders are busy…'},3600);
 setTimeout(()=>{C.done=true;C.pending=false;core.persist();switching=true;if(I.inside)I.leave(true);I.enter('vc-hall');switching=false;$('cc-u63-txt').textContent='';
  setTimeout(()=>{eyes(false,700);setTimeout(()=>{eyes(true,300);setTimeout(()=>{eyes(false,900);setTimeout(()=>{ov.style.display='none';sleeping=false;say('🏰 You wake up… in a CASTLE?! The stairs on the right go up to the top.');window.catCitySfx?.('reward')},950)},350)},800)},400)},6200)}
setInterval(()=>{const lvl=security();
 if(lvl>=MAX&&!C.done&&!C.pending){C.pending=true;core.persist();$('tycoon-panel')?.classList.remove('show');dlg.classList.add('open');sleepyAt=Date.now()+60000;window.catCitySfx?.('quest')}
 if(!C.pending||sleeping||busy())return;if(!sleepyAt)sleepyAt=Date.now()+60000;
 if(HOME_ROOMS.includes(I.roomId)){sleep('bed');return}
 if(Date.now()>sleepyAt-8000&&!I.inside){ov.style.display='block';$('cc-u63-dark').style.opacity='1';$('cc-u63-txt').textContent='🥱 You\'re getting really sleepy…'}
 if(Date.now()>sleepyAt)sleep('outside')},1000);

// ------------------------------------------------------------------ the castle rooms
const K=I.kit,R=K.R,SPR=K.SPR;
function say(t){try{K.say(t)}catch(e){core.note(t)}}
function banner(x,col,t){R(x,10,16,30,'#2a1d33');R(x+1,10,14,28,col);R(x+1,34+Math.round(Math.sin(t*2+x)*1),14,6,col);R(x+5,16,6,6,'#ffd45c');R(x-2,8,20,3,'#c9963a')}
function torch(x,y,t){R(x,y,4,10,'#6b4428');const f=Math.floor(t*8)%2;R(x-1,y-5-f,6,6,'#ff9d3c');R(x,y-4-f,4,3,'#ffe36b')}
function stairs(x,y,up){for(let i=0;i<5;i++){R(x+i*4,y+(up?16-i*4:i*4),28-i*4,4,i%2?'#6f6a88':'#8d88a6')}R(x-2,y-4,30,3,'#2a1d33')}
I.addRoom('vc-hall',{title:'🏰 Cat City Castle · Great Hall',
 bg(){K.floor('tile','#8d88a6','#7d7896');K.walls('#5b4a7a','#4d3e69','#2a1d3a');const t=performance.now()/1000;
  for(const [x,c] of [[40,'#7a52b8'],[96,'#c94c5a'],[208,'#c94c5a'],[264,'#7a52b8']])banner(x,c,t);torch(70,24,t);torch(246,24,t);
  SPR.rug(134,70,52,138,'#a83246','#e8bb5c');SPR.chandelier(144,0,t)},
 items:()=>[
  K.item({x:140,y:30,w:40,h:36,draw:t=>{R(146,30,28,34,'#c9963a');R(148,32,24,30,'#7a52b8');R(150,46,20,16,'#9b6ed6');R(144,60,32,6,'#c9963a');R(156,24,8,6,'#ffd45c')},label:'👑 Sit on the throne',use:()=>say('👑 You sit on the throne. Cat City is safe behind your castle walls!'),useX:160,useY:82}),
  K.item({x:18,y:66,w:30,h:42,draw:()=>SPR.bed(18,66,'#7a52b8'),label:'🛏️ Royal bed',use:()=>say('🛏️ The royal bed. This is where you woke up!'),useX:56,useY:100}),
  K.item({x:262,y:120,w:40,h:28,draw:()=>stairs(266,124,true),solid:false,label:'🪜 Go up to the top of the castle',use:()=>switchTo('vc-top'),useX:282,useY:150}),
  K.item({x:30,y:150,w:20,h:30,draw:()=>SPR.armourStand(30,150)}),K.item({x:270,y:66,w:30,h:30,draw:()=>SPR.weaponRack(270,66)})]});
I.addRoom('vc-top',{title:'🏰 Cat City Castle · The top',
 bg(){const t=performance.now()/1000;for(let y=0;y<64;y+=4){const q=y/64;R(0,y,320,4,'rgb('+Math.round(120+q*100)+','+Math.round(170+q*50)+','+Math.round(230-q*10)+')')}
  for(let i=0;i<4;i++){const cx=((i*97+t*6)%380)-30;R(cx,12+i*9,30,6,'#ffffffcc');R(cx+6,8+i*9,16,4,'#ffffffcc')}
  K.floor('tile','#9a96b2','#8d88a6');R(0,56,320,10,'#6f6a88');for(let x=0;x<320;x+=24)R(x,46,14,12,'#8d88a6');
  R(0,0,6,208,'#6f6a88');R(314,0,6,208,'#6f6a88');for(let y=70;y<208;y+=24){R(0,y,10,14,'#8d88a6');R(310,y,10,14,'#8d88a6')}},
 items:()=>[
  K.item({x:150,y:70,w:20,h:30,draw:t=>{R(158,84,4,16,'#6b4428');R(152,98,16,3,'#6b4428');R(150,74,22,8,'#c9963a');R(168,72,6,12,'#2a1d33');R(170,74,3,3,'#9fe0ff')},label:'🔭 See the view',use:()=>view3d(),useX:160,useY:112}),
  K.item({x:40,y:150,w:40,h:28,draw:()=>stairs(44,154,false),solid:false,label:'🪜 Go back down to the Great Hall',use:()=>switchTo('vc-hall'),useX:60,useY:182}),
  K.item({x:262,y:80,w:20,h:30,draw:t=>{R(270,80,2,30,'#7a5235');R(272,80,16,10,'#c9a2ff');R(276,83,6,4,'#ffd45c')}})]});
function switchTo(id){switching=true;I.leave(true);I.enter(id);switching=false}
window.addEventListener('catcity:interior',e=>{const d=e.detail||{};if(d.inside){lastRoom=d.room;return}
 if(switching)return;
 if(lastRoom==='vc-top'){setTimeout(()=>{switching=true;I.enter('vc-hall');switching=false;say('🪜 You head down the stairs to the Great Hall.')},0);return}
 if(lastRoom==='vc-hall'){s.x=GATE.x;s.y=Y1+60;core.persist();core.note('🏰 You walk out of the castle\'s south gate.')}});

// ------------------------------------------------------------------ 🔭 the 3D view from the top
const HOUSES=[[5,5,8,6,'#f5b4a5','#c94c5a'],[19,5,9,6,'#c9b2ed','#7a52b8'],[34,5,8,6,'#9ad7cf','#3f8f8a'],[6,22,9,6,'#f4c879','#7a52b8'],[22,22,9,6,'#b6d5fa','#5c7fc0'],[35,22,8,6,'#a7dd9b','#4f9e5c'],[6,31,4,3,'#f7cfdc','#d9607e'],[21,31,4,3,'#e2d2f6','#7a52b8'],[37,31,4,3,'#fbeec8','#c8952b']];
const hh=(x,y,k=0)=>{const n=Math.sin(x*127.1+y*311.7+k*53.17)*43758.5453;return n-Math.floor(n)};
const BIOME=(cx,cy)=>{if(!cx&&!cy)return 'town';if(cx<0&&cy>=-1&&cy<=1)return 'wild';const v=hh(cx,cy);if(v<.17)return 'cherry';if(v>.82)return 'poison';if(v<.32)return 'marsh';if(v>.66)return 'moonstone';return 'wild'};
const BCOL={town:'#6fae5f',wild:'#4f8f45',cherry:'#e9a8c4',marsh:'#4f7f6a',moonstone:'#7779b5',poison:'#5d3a70'};
const BDEC={town:['#3f8f4f','#5fb36c'],wild:['#2f6f3a','#4f9e5c'],cherry:['#7a5235','#ffc2dc'],marsh:['#355f4f','#6fa38a'],moonstone:['#5b5f9e','#bfe0ff'],poison:['#3a2050','#b06be0']};
const view=document.createElement('div');view.id='cc-u63-view';view.style.cssText='position:fixed;inset:0;z-index:9450;background:#000;display:none;touch-action:none';
view.innerHTML='<canvas id="cc-u63-cv" style="position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated"></canvas><div style="position:absolute;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:10px"><button type="button" id="cc-u63-l" style="min-height:48px;min-width:64px;font:bold 18px system-ui;border-radius:14px">◀</button><button type="button" id="cc-u63-x" style="min-height:48px;padding:0 16px;font:bold 15px system-ui;border-radius:14px;background:#ffd45c">🚪 Stop watching</button><button type="button" id="cc-u63-r" style="min-height:48px;min-width:64px;font:bold 18px system-ui;border-radius:14px">▶</button></div><div style="position:absolute;left:50%;top:calc(12px + env(safe-area-inset-top));transform:translateX(-50%);color:#fff6e4;font:bold 14px system-ui;text-shadow:0 2px 4px #000;text-align:center">🔭 The view from your castle<br><small>Drag or use ◀ ▶ to look around</small></div>';
document.body.append(view);
let vraf=0,yaw=Math.PI,turn=0,dragX=null;
function view3d(){switching=true;I.leave(true);switching=false;lastRoom='vc-view';view.style.display='block';yaw=Math.PI;const cv=$('cc-u63-cv'),g=cv.getContext('2d');
 const wide=innerWidth>=innerHeight,LW=wide?Math.min(420,Math.round(180*innerWidth/innerHeight)):180,LH=wide?180:Math.min(420,Math.round(180*innerHeight/innerWidth)),F=180,HOR=LH*.46;cv.width=LW;cv.height=LH;g.imageSmoothingEnabled=false;
 const cam={x:GAPS.bottom[0]-20,z:Y1,h:230};let last=performance.now();
 const decor=[];for(let cx=-4;cx<=5;cx++)for(let cy=-4;cy<=5;cy++){const b=BIOME(cx,cy);for(let k=0;k<6;k++){decor.push({x:cx*768+hh(cx,cy,k+3)*768,z:cy*768+hh(cx,cy,k+9)*768,b,kind:b==='moonstone'?'crystal':b==='marsh'&&k%2?'pool':'tree'})}}
 function P(x,z,y){const dx=x-cam.x,dz=z-cam.z,fx=Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=Math.sin(yaw),d=dx*fx+dz*fz;if(d<20)return null;const side=dx*rx+dz*rz,f=F*1.1/d;return {x:LW/2+side*f,y:HOR+(cam.h-y)*f,k:f,d}}
 function poly(pts,c){if(pts.some(p=>!p))return;g.fillStyle=c;g.beginPath();g.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))g.lineTo(p.x,p.y);g.closePath();g.fill()}
 function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;yaw+=turn*dt*1.2;const t=now/1000;
  for(let y=0;y<HOR+2;y+=3){const q=y/HOR;g.fillStyle='rgb('+Math.round(110+q*140)+','+Math.round(170+q*60)+','+Math.round(235-q*40)+')';g.fillRect(0,y,LW,3)}
  for(let i=0;i<5;i++){const cx=((i*91-yaw*60+t*3)%(LW+60)+LW+60)%(LW+60)-30;g.fillStyle='#ffffffd0';g.fillRect(Math.round(cx),12+i*11,26,5);g.fillRect(Math.round(cx)+5,9+i*11,14,4)}
  g.fillStyle='#4f8f45';g.fillRect(0,HOR,LW,LH-HOR);
  const things=[];
  for(let cx=-4;cx<=5;cx++)for(let cy=-4;cy<=5;cy++){const b=BIOME(cx,cy),x0=cx*768,z0=cy*768,m=P(x0+384,z0+384,0);things.push({d:m?m.d+5000:1e9,draw:()=>poly([P(x0,z0,0),P(x0+768,z0,0),P(x0+768,z0+768,0),P(x0,z0+768,0)],BCOL[b])})}
  for(const o of decor){const p=P(o.x,o.z,0);if(!p)continue;things.push({d:p.d,draw:()=>{const r=Math.max(1,30*p.k),[a,c]=BDEC[o.b];if(o.kind==='crystal'){g.fillStyle=c;g.beginPath();g.moveTo(p.x,p.y-r*2.4);g.lineTo(p.x+r*.6,p.y);g.lineTo(p.x-r*.6,p.y);g.fill()}else if(o.kind==='pool'){g.fillStyle='#6fa8c8';g.beginPath();g.ellipse(p.x,p.y,r*1.6,r*.4,0,0,7);g.fill()}else{g.fillStyle='#6b4428';g.fillRect(p.x-r*.12,p.y-r*1.6,r*.24,r*1.6);g.fillStyle=c;g.beginPath();g.arc(p.x,p.y-r*1.8,r,0,7);g.fill()}}})}
  for(const [x,y,w,hh2,wall,roof] of HOUSES){const x0=x*T,x1=(x+w)*T,zf=(y+hh2)*T,zb=y*T,H=hh2*T*.55,c=P((x0+x1)/2,(zf+zb)/2,0);if(!c)continue;things.push({d:c.d,draw:()=>{
   for(const [a,b] of [[[x0,zf],[x1,zf]],[[x1,zf],[x1,zb]],[[x1,zb],[x0,zb]],[[x0,zb],[x0,zf]]])poly([P(a[0],a[1],0),P(b[0],b[1],0),P(b[0],b[1],H),P(a[0],a[1],H)],wall);
   poly([P(x0,zf,H),P(x1,zf,H),P((x0+x1)/2,(zf+zb)/2,H*1.6)],roof);poly([P(x1,zf,H),P(x1,zb,H),P((x0+x1)/2,(zf+zb)/2,H*1.6)],roof);poly([P(x1,zb,H),P(x0,zb,H),P((x0+x1)/2,(zf+zb)/2,H*1.6)],roof);poly([P(x0,zb,H),P(x0,zf,H),P((x0+x1)/2,(zf+zb)/2,H*1.6)],roof)}})}
  for(let i=0;i<SEG.length;i+=1){const p=SEG[i],x=p.h?p.x+16:p.x,z=p.h?p.y:p.y+16,c=P(x,z,0);if(!c)continue;const L=p.h?[[p.x,p.y],[p.x+32,p.y]]:[[p.x,p.y],[p.x,p.y+32]];things.push({d:c.d,draw:()=>{poly([P(L[0][0],L[0][1],0),P(L[1][0],L[1][1],0),P(L[1][0],L[1][1],70),P(L[0][0],L[0][1],70)],'#8d88a6');const top=P(x,z,84),bot=P(x,z,70);if(top&&bot){g.fillStyle='#a9a4c2';g.fillRect(top.x-2,top.y,4,bot.y-top.y)}}})}
  for(const [x,z] of TOWERS){const c=P(x,z,0);if(!c||Math.hypot(x-cam.x,z-cam.z)<60)continue;things.push({d:c.d,draw:()=>{const b=P(x-22,z,0),b2=P(x+22,z,0),tp=P(x-22,z,120),tp2=P(x+22,z,120);poly([b,b2,tp2,tp],'#7d7896');const f1=P(x,z,120),f2=P(x,z,160);if(f1&&f2){g.fillStyle='#7a5235';g.fillRect(f2.x,f2.y,1,f1.y-f2.y);g.fillStyle='#c9a2ff';g.fillRect(f2.x+1,f2.y,Math.max(2,30*f2.k),Math.max(2,18*f2.k))}}})}
  things.sort((a,b)=>b.d-a.d).forEach(o=>o.draw());
  // Your cat's view: the battlements and your paws resting on the wall.
  g.fillStyle='#6f6a88';g.fillRect(0,LH-30,LW,30);g.fillStyle='#8d88a6';for(let x=-((yaw*40)%28+28);x<LW;x+=28)g.fillRect(Math.round(x),LH-44,16,16);g.fillRect(0,LH-30,LW,4);
  const bob=Math.round(Math.sin(t*2)*1);
  for(const px of [LW*.32,LW*.68]){g.fillStyle='#2a1d33';g.fillRect(Math.round(px-14),LH-38+bob,28,40);g.fillStyle='#e8a050';g.fillRect(Math.round(px-12),LH-36+bob,24,38);g.fillStyle='#f7cfdc';for(let k=-8;k<=8;k+=8)g.fillRect(Math.round(px+k-2),LH-34+bob,4,3)}
  vraf=requestAnimationFrame(frame)}
 vraf=requestAnimationFrame(frame);
}
function stopView(){cancelAnimationFrame(vraf);view.style.display='none';turn=0;switching=true;I.enter('vc-top');switching=false}
$('cc-u63-x').onclick=stopView;
for(const [id,d] of [['cc-u63-l',-1],['cc-u63-r',1]]){const b=$(id);b.onpointerdown=e=>{e.preventDefault();turn=d};b.onpointerup=b.onpointerleave=b.onpointercancel=()=>{turn=0}}
view.addEventListener('pointerdown',e=>{if(e.target.tagName!=='BUTTON')dragX=e.clientX});view.addEventListener('pointermove',e=>{if(dragX!==null){yaw+=(e.clientX-dragX)*.006;dragX=e.clientX}});addEventListener('pointerup',()=>{dragX=null});
addEventListener('keydown',e=>{if(view.style.display!=='block')return;const k=e.key.toLowerCase();if(k==='arrowleft'||k==='a')turn=-1;else if(k==='arrowright'||k==='d')turn=1;else if(k==='escape'){e.preventDefault();e.stopImmediatePropagation();stopView()}},true);
addEventListener('keyup',e=>{if(['arrowleft','arrowright','a','d'].includes(e.key.toLowerCase()))turn=0});
window.catCityVillageCastle={view:view3d,sleep,state:C,security};
})();

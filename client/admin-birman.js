/* Cat City — the Admin Birman (the Birman Takeover portal boss, chapter 99).
 *
 * Phase 1: when you hit it, it jumps back and unrolls its admin panel flat on
 *   the floor like a carpet (you can read it). Its paw presses "Temporary God
 *   Mode · 30s": it glows gold, can't be hurt, and chases you down faster.
 * Phase change (1→2): its point of view: the admin panel up front, the
 *   players running at it behind. It presses Teleport.
 * Phase 2: teleports every 6 s for 30 s, rests 30 s, repeats. Each arrival
 *   drops a red circle where you are standing.
 * Phase change (2→3): super angry, still its point of view. It types
 *   /knockout: the AI teammates are knocked out (never you, never real
 *   players). With a full house of real players and no bots it presses
 *   "Vacuum to Village" instead: everyone sprints away from the vacuum until
 *   it stops (get sucked in and you're sent back to the village).
 * Phase 3: ban-hammer lines of red circles every 7 s.
 * End: the owner (a catified PNGtuber) jumps down and takes admin back, hands
 *   up with fingers pointing up, the energy racing back into them.
 *
 * Hooks into index.html via window.catCityBossMod + window.catCityBossAPI.
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const OUT='#241a2c';
// ------------------------------------------------------------------ pixel helpers
function sprite(rows,pal,scale=1){
 const H=rows.length,W=Math.max(...rows.map(r=>r.length)),G=rows.map(r=>[...r.padEnd(W,'.')].map(ch=>ch==='.'?null:pal[ch]));
 const out=G.map(r=>r.slice());
 for(let y=-1;y<=H;y++)for(let x=-1;x<=W;x++){}
 const c=document.createElement('canvas');c.width=(W+2)*scale;c.height=(H+2)*scale;const g=c.getContext('2d');
 for(let y=-1;y<=H;y++)for(let x=-1;x<=W;x++){const on=G[y]?.[x];if(on){g.fillStyle=on;g.fillRect((x+1)*scale,(y+1)*scale,scale,scale)}
  else if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>G[y+b]?.[x+a])){g.fillStyle=OUT;g.fillRect((x+1)*scale,(y+1)*scale,scale,scale)}}
 return c;
}
// ------------------------------------------------------------------ the owner (catified PNGtuber)
// Round grey head with a shine, little oval brows, happy closed eyes, a :3
// mouth and whisker lines, now with cat ears and a tail. Two poses.
const OWNER_PAL={g:'#c9c9cf',G:'#a9a9b1',d:'#8e8e98',w:'#ffffff',k:'#2a2430',p:'#f2a9bd',b:'#b1b1b9'};
const HEAD=[
 '....kk..............kk....',
 '...kgGk............kGgk...',
 '...kgpGk..........kGpgk...',
 '...kgppGkkkkkkkkkkGppgk...',
 '..kgggggggggggggggggggggk.',
 '.kggwwgggggggggggggggggggk',
 '.kgwwgggggggggggggggggggGk',
 'kggwggggbbbggggggbbbggggGGk',
 'kgggggggbbbggggggbbbgggggGk',
 'kgggggggggggggggggggggggGGk',
 'kggggkkggggggggggggggkkgGGk',
 'kgggggkkggggggggggggkkggGGk',
 'kgggkkkkkggggggggggkkkkkgGk',
 'kggggggggggggggggggggggggGk',
 'kgkkkkggggggkgkggggggkkkkGk',
 'kgggggggggggkgkggggggggggGk',
 'kgkkkkgggggkgggkgggggkkkkGk',
 '.kggggggggggggggggggggggGk.',
 '.kGgggggggggggggggggggGGGk.',
 '..kGGggggggggggggggggGGGk..',
 '...kkGGGGggggggggggGGGkk...',
 '.....kkkkkkkkkkkkkkkkk.....'];
function ownerRows(reach){
 const body=reach?[
  '..kk.k.kk...........kk.k.kk..',
  '..kgkgkgk...........kgkgkgk..',
  '..kgggggk...........kgggggk..',
  '...kgggk.............kgggk...',
  '....kgggk...........kgggk....',
  '.....kgggkkkkkkkkkkkgggk.....',
  '......kggggggggggggggggk.....',
  '.......kgggggggggggggk.......',
  '.......kgggggggggggggk...kk..',
  '.......kgggggggggggggk..kgGk.',
  '........kggggggggggggkkgGk...',
  '........kgggk...kgggkk.kk....',
  '........kkkkk...kkkkk........']:[
  '.......kkkkkkkkkkkkkk........',
  '......kggggggggggggggk.......',
  '.....kgggggggggggggggk.......',
  '....kggkggggggggggggkggk.....',
  '....kgk.kggggggggggk.kgk.....',
  '....kgk.kggggggggggk.kgk.kk..',
  '....kkk.kggggggggggk.kkkkgGk.',
  '........kggggggggggkkkkgGk...',
  '........kgggk..kgggk..kk.....',
  '........kkkkk..kkkkk.........'];
 return [...HEAD.map(r=>'.'+r+'..'),...body];
}
const ownerCache={};
function owner(reach){const k=reach?'r':'s';return ownerCache[k]||(ownerCache[k]=sprite(ownerRows(reach),OWNER_PAL,1))}
// ------------------------------------------------------------------ the admin panel
const BUTTONS=[['god','⚡ Temporary God Mode · 15s'],['teleport','🌀 Teleport'],['knockout','💤 /knockout'],['vacuum','🌪️ Vacuum to Village'],['restore','👑 Restore Owner (locked)']];
function panel(highlight,pressed,typed){
 const c=document.createElement('canvas');c.width=360;c.height=244;const g=c.getContext('2d');
 g.fillStyle='#120b1c';g.fillRect(0,0,360,244);g.fillStyle='#ffd45c';g.fillRect(0,0,360,4);g.fillRect(0,240,360,4);g.fillRect(0,0,4,244);g.fillRect(356,0,4,244);
 g.fillStyle='#2a1d36';g.fillRect(4,4,352,30);g.font='bold 15px "Cat City Pixel",monospace';g.fillStyle='#ffd45c';g.textAlign='left';g.fillText('🛠️ ADMIN PANEL · The Birman Family',12,25);
 BUTTONS.forEach(([id,label],i)=>{const y=42+i*38,on=id===highlight,press=on&&pressed;
  g.fillStyle=id==='restore'?'#2c2836':press?'#ff3b5c':on?'#5a3a7a':'#3a2a4e';g.fillRect(14,y,332,30);
  g.fillStyle=press?'#ffffff':on?'#ffe6ac':'#2a1d36';g.fillRect(14,y+28,332,2);
  g.fillStyle=id==='restore'?'#7a7290':'#fff6e4';g.font='bold 14px "Cat City Pixel",monospace';g.fillText(label,26,y+20)});
 if(typed!=null){g.fillStyle='#000';g.fillRect(14,204,332,30);g.fillStyle='#7ff5ff';g.font='bold 15px "Cat City Pixel",monospace';g.fillText('> '+typed+(Math.floor(performance.now()/300)%2?'_':''),22,225)}
 return c;
}
// A little pixel paw cursor.
function paw(g,x,y,s=1){g.save();g.translate(Math.round(x),Math.round(y));g.scale(s,s);g.fillStyle=OUT;g.fillRect(-9,-3,18,15);g.fillRect(-11,-11,6,8);g.fillRect(-4,-14,6,8);g.fillRect(4,-11,6,8);
 g.fillStyle='#fff3e6';g.fillRect(-8,-2,16,13);g.fillRect(-10,-10,4,6);g.fillRect(-3,-13,4,6);g.fillRect(5,-10,4,6);g.fillStyle='#f2a9bd';g.fillRect(-4,2,8,6);g.restore()}
function buttonCenter(id){const i=BUTTONS.findIndex(b=>b[0]===id);return {x:180,y:42+i*38+15}}
// ------------------------------------------------------------------ state
let on=false,finished=false,phase=1,god=0,godCool=0,carpet=null,tele={cycle:0,next:6,hidden:0,ghost:null},banClock=10,scene=null,vacuum=0,flipFloor=null,winDone=false;
function reset(){finished=false;phase=1;god=0;godCool=0;carpet=null;tele={cycle:0,next:6,hidden:0,ghost:null};banClock=10;scene=null;vacuum=0;winDone=false}
function hpPhase(A){const f=A.bossHP/A.maxHP;return f>.66?1:f>.33?2:3}
function realPlayers(){return (window.catCityOnlinePlayers?.()||[]).length}
function fullHouse(){return core&&window.catCityOnlineConnected?.()&&realPlayers()>=6}
const mod={
 active(){const a=window.catCityBossAPI;const now=!!(a&&core.bossMode&&a.chapter===99);if(now&&!on){on=true;reset()}if(!now&&on)on=false;return now},
 hidden(){return tele.hidden>0||(scene&&scene.kind==='win')},
 // No red circles while it's chasing you in God Mode, opening its panel or vacuuming.
 quiet(){return god>0||!!carpet||vacuum>0},
 // Damage you do: blocked during god mode, the vacuum and the carpet animation.
 blockHit(A){
  if(god>0){A.note('✨ GOD MODE! The Admin Birman can\'t be hurt — run!');return true}
  if(vacuum>0||carpet)return true;
  if(phase===1&&godCool<=0){
   // It jumps back and unrolls the admin panel on the floor.
   const dx=A.bossX-A.px,dy=A.bossY-A.py,d=Math.hypot(dx,dy)||1;
   carpet={t:0,fromX:A.bossX,fromY:A.bossY,toX:Math.max(80,Math.min(A.ARENA_W-80,A.bossX+dx/d*170)),toY:Math.max(90,Math.min(A.ARENA_H-120,A.bossY+dy/d*120))};
   A.note('🛠️ The Admin Birman is opening its admin panel…');return true}
  return false;
 },
 update(dt,A){
  if(scene)return sceneTick(dt,A);
  if(finished)return;
  // Phase changes play a point-of-view cutscene.
  const want=hpPhase(A);
  if(want>phase){phase=want;god=0;carpet=null;scene=phase===2?{kind:'teleport',t:0}:fullHouse()?{kind:'vacuum',t:0}:{kind:'knockout',t:0};document.body.classList.add('cc-boss-intro');voice(VOICE[scene.kind]);return 'pause'}
  if(A.bossHP<=0&&!winDone){winDone=true;scene={kind:'win',t:0};document.body.classList.add('cc-boss-intro');A.bossHP=1;return 'pause'}
  godCool=Math.max(0,godCool-dt);
  if(carpet){
   carpet.t+=dt;const p=Math.min(1,carpet.t/.35);
   // Jump back with a hop.
   A.bossX=carpet.fromX+(carpet.toX-carpet.fromX)*p;A.bossY=carpet.fromY+(carpet.toY-carpet.fromY)*p-Math.sin(p*Math.PI)*40;
   if(carpet.t>2.6){carpet=null;god=15;A.note('⚡ TEMPORARY GOD MODE · 15s! Run from its wrath!')}
   return 'hold';
  }
  if(god>0){god-=dt;
   // Wrath: it chases you down faster.
   const dx=A.px-A.bossX,dy=A.py-A.bossY,d=Math.hypot(dx,dy)||1;const st=Math.min(d-70,125*dt);if(st>0){A.bossX+=dx/d*st;A.bossY+=dy/d*st}
   if(god<=0){godCool=35;A.note('😮‍💨 God mode wore off! Attack now!')}}
  if(phase>=2){
   tele.cycle+=dt;if(tele.cycle>=60)tele.cycle=0;
   if(tele.hidden>0){tele.hidden-=dt;if(tele.hidden<=0){A.bossX=tele.ghost.x;A.bossY=tele.ghost.y;tele.ghost=null;A.addMark(A.px,A.py,1.6)}}
   else if(tele.cycle<30){tele.next-=dt;if(tele.next<=0){tele.next=6;let x,y,n=0;do{x=90+Math.random()*(A.ARENA_W-180);y=100+Math.random()*(A.ARENA_H-220);n++}while(Math.hypot(x-A.px,y-A.py)<220&&n<20);
    tele.ghost={x,y,fromX:A.bossX,fromY:A.bossY};tele.hidden=.45;A.addMark(A.bossX,A.bossY,.9)}}
  }
  if(phase>=3){banClock-=dt;if(banClock<=0){banClock=13;const dx=A.px-A.bossX,dy=A.py-A.bossY,d=Math.hypot(dx,dy)||1;for(let i=1;i<=3;i++)A.addMark(A.bossX+dx/d*i*110,A.bossY+dy/d*i*110,1.8+i*.15);A.note('🔨 BAN HAMMER! Dodge the line!')}}
  if(vacuum>0){vacuum-=dt;
   // The vacuum at the top of the arena pulls everyone in; sprint away!
   const vx=A.ARENA_W/2,vy=70,dx=vx-A.px,dy=vy-A.py,d=Math.hypot(dx,dy)||1;A.px+=dx/d*140*dt;A.py+=dy/d*140*dt;
   if(d<60){vacuum=0;A.note('🌪️ You got vacuumed back to the village!');A.leave();A.home();return 'pause'}
   if(vacuum<=0)A.note('🌪️ The vacuum stopped! Finish the Admin Birman!');}
 },
 drawUnder(ctx,A){
  // The admin panel laid flat on the floor like a carpet, unrolling.
  if(carpet){const p=Math.min(1,Math.max(0,(carpet.t-.35)/.5)),press=carpet.t>1.9;const img=panel('god',press);
   ctx.save();ctx.translate(A.bossX,A.bossY+70);ctx.transform(1,0,-.18,1,0,0);ctx.scale(.75*p,.42);ctx.globalAlpha=.95;ctx.imageSmoothingEnabled=false;ctx.drawImage(img,-180,0);
   if(carpet.t>1.2){const c=buttonCenter('god'),k=Math.min(1,(carpet.t-1.2)/.6);paw(ctx,-180+c.x+60*(1-k),c.y+60*(1-k)+(press?3:0),2.2)}ctx.restore()}
  if(god>0){ctx.save();const r=70+Math.sin(performance.now()/90)*6;ctx.fillStyle='rgba(255,212,92,.28)';ctx.beginPath();ctx.arc(A.bossX,A.bossY,r,0,7);ctx.fill();ctx.restore()}
  if(tele.hidden>0&&tele.ghost){ctx.save();ctx.fillStyle='rgba(127,245,255,.5)';for(let i=0;i<14;i++){const p=1-tele.hidden/.45;ctx.fillRect(tele.ghost.fromX+(Math.random()-.5)*70*(1-p),tele.ghost.fromY+(Math.random()-.5)*90,6,3);ctx.fillRect(tele.ghost.x+(Math.random()-.5)*70*p,tele.ghost.y+(Math.random()-.5)*90,6,3)}ctx.restore()}
 },
 drawOver(ctx,A){
  if(god>0){ctx.save();ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#241a2c';ctx.fillStyle='#ffd45c';const txt='⚡ GOD MODE '+Math.ceil(god)+'s';ctx.strokeText(txt,A.bossX,A.bossY-86);ctx.fillText(txt,A.bossX,A.bossY-86);ctx.restore()}
  if(vacuum>0){ctx.save();const vx=A.ARENA_W/2,vy=70,t=performance.now()/1000;ctx.fillStyle='#3a3446';ctx.fillRect(vx-50,vy-40,100,50);ctx.fillStyle='#120b1c';ctx.fillRect(vx-36,vy,72,18);
   ctx.strokeStyle='rgba(200,230,255,.5)';ctx.lineWidth=3;for(let i=0;i<10;i++){const a=t*4+i,r=(80+((t*200+i*60)%300));ctx.beginPath();ctx.arc(vx,vy+10,r,a,a+.5);ctx.stroke()}
   ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffffff';ctx.fillText('🌪️ VACUUM TO VILLAGE · '+Math.ceil(vacuum)+'s · SPRINT AWAY!',vx,vy+60);ctx.restore()}
  if(scene&&scene.kind==='knockedOut'){} // allies show their own knocked-out state
 },
 cutscene(ctx,W,H,A){if(!scene)return false;drawScene(ctx,W,H,A);return true},
 // Owner practice: jump straight to the ending.
 skipToEnd(A){if(!on){on=true;reset()}phase=3;god=0;carpet=null;vacuum=0;tele.hidden=0;winDone=true;scene={kind:'win',t:0};document.body.classList.add('cc-boss-intro');A.bossHP=1}
};
// ------------------------------------------------------------------ cutscenes
// Voice lines (client/assets/voice/wNN.m4a). A missing file just stays silent;
// the line is always shown as a subtitle too.
const VOICE={teleport:'w02',knockout:'w03',vacuum:'w04'};
function voice(id){if(id)window.catCityVoice?.play(id)}
function sceneTick(dt,A){
 scene.t+=dt;const k=scene.kind;
 if(k==='teleport'&&scene.t>4.2){end();tele.next=0.5}
 if(k==='knockout'&&scene.t>5.4){end();window.catCityArenaAllies?.knockout?.();A.note('💤 /knockout! Your helper cats are down — it\'s up to you!')}
 if(k==='vacuum'&&scene.t>5.2){end();vacuum=12;A.note('🌪️ VACUUM TO VILLAGE! Sprint away!')}
 if(k==='win'&&scene.t>WIN.end){end();A.bossHP=0;finished=true;winVoice=null}
 return 'pause';
}
function end(){scene=null;document.body.classList.remove('cc-boss-intro')}
// Mode-7 floor from the boss's point of view, looking south at the players.
function povFloor(ctx,W,H,A,shake){
 const F=A.floor();if(!flipFloor){flipFloor=document.createElement('canvas');flipFloor.width=F.width;flipFloor.height=F.height;const g=flipFloor.getContext('2d');g.translate(F.width,0);g.scale(-1,1);g.drawImage(F,0,0)}
 const cam={x:A.bossX+shake,y:A.bossY,h:78,focal:Math.min(W,H)*1.05,hz:H*.34};
 const sky=ctx.createLinearGradient(0,0,0,cam.hz);sky.addColorStop(0,'#140f2a');sky.addColorStop(1,'#3e315e');ctx.fillStyle=sky;ctx.fillRect(0,0,W,cam.hz+1);
 ctx.imageSmoothingEnabled=false;
 for(let r=Math.ceil(cam.hz)+1;r<H;r+=2){const d=cam.h*cam.focal/(r-cam.hz),span=W*d/cam.focal,wy=cam.y+d;if(wy>=F.height){ctx.fillStyle='#3e315e';ctx.fillRect(0,r,W,2);continue}
  ctx.drawImage(flipFloor,F.width-(cam.x+span/2),wy,span,1,0,r,W,2)}
 return cam;
}
function billboard(ctx,cam,W,wx,wy,fn){const f=wy-cam.y;if(f<8)return null;const k=cam.focal/f;return {f,sx:W/2+(cam.x-wx)*k,sy:cam.hz+cam.h*k,k,fn}}
function drawRunners(ctx,cam,W,A,t,run){
 const art=window.catCityCatArt,list=[];
 const me=A.catName(),pull=Math.min(.45,run*.12);
 const px=A.px+(A.bossX-A.px)*pull,py=A.py+(A.bossY-A.py)*pull;
 list.push(billboard(ctx,cam,W,px,py,(sx,sy,k)=>art?.draw(ctx,sx,sy-Math.abs(Math.sin(t*12))*4*k,me,'walkBack',0,{scale:1.65*1.2*k})));
 for(const a of (window.catCityArenaAllies?.list?.()||[])){const ax=a.x+(A.bossX-a.x)*pull,ay=a.y+(A.bossY-a.y)*pull;
  list.push(billboard(ctx,cam,W,ax,ay,(sx,sy,k)=>art?.draw(ctx,sx,sy-Math.abs(Math.sin(t*12+ax))*4*k,a.id,'walkBack',0,{scale:1.65*1.2*k,gear:a.k?.gear,weapon:a.k?.weapon})))}
 list.filter(Boolean).sort((a,b)=>b.f-a.f).forEach(b=>{if(art)b.fn(b.sx,b.sy,b.k)});
}
function drawScene(ctx,W,H,A){
 const t=scene.t,k=scene.kind;ctx.save();
 if(k==='win'){drawWin(ctx,W,H,A,t);ctx.restore();return}
 const angry=k!=='teleport',shake=angry&&t>.4?(Math.random()-.5)*10:0;
 const cam=povFloor(ctx,W,H,A,shake);
 drawRunners(ctx,cam,W,A,t,t);
 if(angry){ctx.fillStyle='rgba(255,40,70,'+(.12+Math.sin(t*10)*.06)+')';ctx.fillRect(0,0,W,H)}
 // Its paws holding the panel (seen from its own eyes).
 const target=k==='teleport'?'teleport':k==='vacuum'?'vacuum':'knockout';
 const typed=k==='knockout'&&t>1.6?'/knockout @teammates'.slice(0,Math.floor((t-1.6)*9)):k==='knockout'?'':null;
 const pressed=t>(k==='knockout'?4:3.1);
 const img=panel(target,pressed,typed),pw=Math.min(W*.62,420),ph=pw*244/360,px=W/2-pw/2+shake,py=H-ph-H*.06+Math.max(0,(1-t*2))*ph;
 ctx.imageSmoothingEnabled=false;ctx.drawImage(img,px,py,pw,ph);
 const c=buttonCenter(target),cx=px+c.x*pw/360,cy=py+c.y*ph/244,go=Math.min(1,Math.max(0,(t-1.3)/1.2));
 paw(ctx,cx+(1-go)*pw*.35,cy+(1-go)*ph*.5+(pressed?4:0),pw/150);
 // Birman paws at the bottom corners, holding it.
 ctx.fillStyle='#f6ead8';ctx.fillRect(px-30,py+ph*.55,46,40);ctx.fillRect(px+pw-16,py+ph*.55,46,40);ctx.fillStyle=OUT;ctx.fillRect(px-30,py+ph*.55,46,4);ctx.fillRect(px+pw-16,py+ph*.55,46,4);
 ctx.textAlign='center';ctx.font='bold '+Math.round(Math.min(30,W/20))+'px system-ui';ctx.lineWidth=6;ctx.strokeStyle='#12091c';
 const title=k==='teleport'?'"You think you can catch me?"':k==='vacuum'?'"ENOUGH! Everyone OUT of my game!"':'"GRRRRR! NO MORE HELPERS!"';
 ctx.fillStyle=angry?'#ff8fa3':'#ffe6ac';ctx.strokeText(title,W/2,H*.12);ctx.fillText(title,W/2,H*.12);
 if(pressed){const f=Math.max(0,1-(t-(k==='knockout'?4:3.1))*2);ctx.fillStyle='rgba(255,255,255,'+f*.85+')';ctx.fillRect(0,0,W,H)}
 const bar=Math.round(H*.07);ctx.fillStyle='#000';ctx.fillRect(0,0,W,bar);ctx.fillRect(0,H-bar,W,bar);
 ctx.restore();
}
// The owner jumps down, takes their admin powers back ("Well, I'll be taking
// that back."), leaves through a glowing portal, then a portal opens under the
// whole team: they look down, fall through, and land back in Cat Village.
// Her recorded line (client/assets/voice/w01.m4a) is 2.6 s long.
const WIN={land:1.1,reach:1.6,line:3.6,portal:6.4,jump:6.9,close:7.5,team:7.8,look:8.2,fall:9.2,flash:10.0,end:10.8};
let winVoice=null;
function glowPortal(ctx,x,y,r,open,t){if(open<=0)return;const rr=r*open;
 for(let i=5;i>0;i--){ctx.fillStyle=i%2?'rgba(255,212,92,'+(.18+i*.08)+')':'rgba(127,245,255,'+(.14+i*.06)+')';const q=rr*i/5*(1+Math.sin(t*7+i)*.06);ctx.beginPath();ctx.ellipse(x,y,q,q*.42,0,0,7);ctx.fill()}
 ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.ellipse(x,y,rr*.35,rr*.14,0,0,7);ctx.fill()}
function drawWin(ctx,W,H,A,t){
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#2a1d4a');sky.addColorStop(1,'#806aa2');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 if(window.catCityFloors)window.catCityFloors.fill(ctx,'arena',0,H*.62,W,H*.38);
 const ground=H*.86,S=Math.max(3,Math.round(Math.min(W,H)/150)),bar=Math.round(H*.07);
 if(t<WIN.team){
  // The defeated Admin Birman, dizzy, on the right.
  ctx.save();ctx.translate(W*.74,ground-20);ctx.scale(1.3,1.3);window.catCityBirmanArt?.draw(ctx,0,0,'armour',{hp:1,max:100,t});ctx.restore();
  for(let i=0;i<4;i++){const a=t*5+i*1.57;ctx.fillStyle='#ffd45c';ctx.fillRect(W*.74+Math.cos(a)*40-4,ground-150+Math.sin(a)*10-4,8,8)}
  // The owner drops in from the top, bounces, then reaches up.
  const drop=Math.min(1,t/WIN.land),bounce=t>WIN.land?Math.abs(Math.sin((t-WIN.land)*9))*Math.max(0,1-(t-WIN.land)*2.5)*30:0;
  const reach=t>WIN.reach&&t<WIN.portal,img=owner(reach),w=img.width*S,h=img.height*S;
  let ox=W*.34,oy=(t<WIN.land?-h+(ground+h)*drop*drop:ground)-bounce,alpha=1;
  // Glowing portal opens beside her; she hops in and it closes.
  const px=W*.18,open=t<WIN.portal?0:t<WIN.close?Math.min(1,(t-WIN.portal)/.4):Math.max(0,1-(t-WIN.close)/.3);
  glowPortal(ctx,px,ground-4,90,open,t);
  if(t>WIN.jump){const p=Math.min(1,(t-WIN.jump)/.5);ox=ox+(px-ox)*p;oy=oy-Math.sin(p*Math.PI)*120+p*40;alpha=1-Math.max(0,(p-.6)/.4)}
  if(alpha>0){ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(img,Math.round(ox-w/2),Math.round(oy-h),w,h);
   const name=window.catCityTakeover?.ownerName?.()||'The Owner';
   ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#12091c';ctx.fillStyle='#fff6e4';ctx.strokeText('👑 '+name,ox,oy-h-10);ctx.fillText('👑 '+name,ox,oy-h-10);ctx.globalAlpha=1}
  // Energy races from the Birman back into the owner's raised hands.
  if(t>WIN.reach&&t<WIN.portal){const hx=ox,hy=oy-h*.38,e=t-WIN.reach,fadeOut=t>WIN.line+.8?Math.max(0,1-(t-WIN.line-.8)/1.2):1;
   for(let i=0;i<40;i++){const p=(e*1.6+i/40)%1,sx=W*.74,sy=ground-90;if(e<i/40*1.2)continue;
    const x=sx+(hx-sx)*p+Math.sin(p*9+i)*14*(1-p),y=sy+(hy-sy)*p-Math.sin(p*Math.PI)*60;ctx.globalAlpha=fadeOut;
    ctx.fillStyle=i%3?'#ffd45c':i%2?'#7ff5ff':'#ffffff';ctx.fillRect(Math.round(x)-3,Math.round(y)-3,6,6)}ctx.globalAlpha=1;
   const glow=Math.min(1,e/1.5);ctx.fillStyle='rgba(255,212,92,'+(.25*glow+Math.sin(t*8)*.08)+')';ctx.beginPath();ctx.arc(hx,hy-20,60*glow+10,0,7);ctx.fill()}
  // Her line, once the powers are back.
  if(t>WIN.line&&!winVoice){winVoice=true;window.catCityVoice?.play('w01')}
  if(t>WIN.line&&t<WIN.portal+.6){ctx.globalAlpha=Math.min(1,(t-WIN.line)*3);const msg='"Well, I\'ll be taking that back."';ctx.font='bold '+Math.round(Math.min(24,W/26))+'px system-ui';ctx.textAlign='center';
   const mw=ctx.measureText(msg).width+30;ctx.fillStyle='#12091ccc';ctx.fillRect(W/2-mw/2,H-bar-58,mw,40);ctx.fillStyle='#fff6e4';ctx.fillText(msg,W/2,H-bar-30);ctx.globalAlpha=1}
  if(t>WIN.reach+1&&t<WIN.line+.4){ctx.globalAlpha=Math.min(1,(t-WIN.reach-1)*2);ctx.font='bold '+Math.round(Math.min(32,W/18))+'px system-ui';ctx.strokeStyle='#12091c';ctx.lineWidth=6;ctx.fillStyle='#ffd45c';ctx.textAlign='center';
   ctx.strokeText('👑 Admin powers restored! 👑',W/2,H*.18);ctx.fillText('👑 Admin powers restored! 👑',W/2,H*.18);ctx.globalAlpha=1}
 }else{
  // The team: a glowing portal opens under them, they look down… and fall.
  const art=window.catCityCatArt,team=[A.catName(),...(window.catCityArenaAllies?.list?.()||[]).map(a=>a.id)].slice(0,6);
  const n=team.length,cx=W/2,open=Math.min(1,(t-WIN.team)/.4),fall=t>WIN.fall?Math.min(1,(t-WIN.fall)/.7):0;
  glowPortal(ctx,cx,ground,Math.min(W*.42,90+n*55),open,t);
  team.forEach((id,i)=>{const x=cx+(i-(n-1)/2)*Math.min(110,W*.8/n),k=Math.max(2,S*.9)*(1-fall*.9),y=ground+fall*60;
   const look=t>WIN.look&&t<WIN.fall;
   if(art){ctx.globalAlpha=1-fall*.8;art.draw(ctx,x,y-(look?0:0),id,look?'walkFront':'idle',0,{scale:k});ctx.globalAlpha=1}
   // Cartoon "!" as they look down at the portal.
   if(look){const pop=Math.min(1,(t-WIN.look-i*.08)*6);if(pop>0){ctx.font='bold '+Math.round(26*pop)+'px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#12091c';ctx.fillStyle='#ffd45c';ctx.strokeText('!',x,y-k*36);ctx.fillText('!',x,y-k*36)}
    ctx.fillStyle='#12091c';ctx.fillRect(x-6,y-k*3,3,3);ctx.fillRect(x+3,y-k*3,3,3)}
  });
  if(t>WIN.flash){ctx.fillStyle='rgba(255,255,255,'+Math.min(1,(t-WIN.flash)/.5)+')';ctx.fillRect(0,0,W,H)}
 }
 ctx.fillStyle='#000';ctx.fillRect(0,0,W,bar);ctx.fillRect(0,H-bar,W,bar);
}
window.catCityBossMod=mod;
window.catCityAdminBirman={owner,panel,phase:()=>phase,scene:()=>scene?.kind||null,godMode:()=>god};
})();

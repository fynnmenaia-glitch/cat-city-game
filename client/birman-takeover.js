/* Cat City — the Birman Takeover (an owner-only Admin Abuse variant).
 *
 * 1. The owner ticks "🎭 Birman Takeover" and starts Admin Abuse. It looks
 *    like a normal Admin Abuse.
 * 2. The owner's first three global announcements show as "<username>: text".
 * 3. Then the server sends "Here we go…" from the owner, which cuts off; the
 *    announcement box glitches and The Birman Family take over the message.
 * 4. Everyone sees a cutscene: one cat's paws, rising to show them armoured
 *    with a sword, then two, three, four, then all six; then they run past
 *    the camera towards the portals.
 * 5. Birman portals open around the village. Walking into one starts a fight
 *    against a Birman (practice rules: no story progress lost or gained).
 *
 * Server side: social.py (stage.takeover, announce counter, the sequence).
 * API: catCityTakeover.handle(packet) → true if it showed the announcement
 *      catCityTakeover.play() → play the cutscene (testing)
 *      catCityTakeover.portals() → portal positions when the takeover is live
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,T=core.T,$=id=>document.getElementById(id);
const CATS=['astro','galaxy','baby','harley','skylar','pumpkin'];
// ------------------------------------------------------------------ announcement box
const css=document.createElement('style');
css.textContent=[
 '#cc-takeover-say{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 74px);transform:translateX(-50%);z-index:8800;min-width:min(420px,90vw);max-width:94vw;background:#2a1d3af2;border:3px solid #ffd45c;border-radius:14px;padding:10px 14px;color:#fff6e4;font:bold 14px system-ui;box-shadow:0 8px 24px #0008;display:none;pointer-events:none}',
 '#cc-takeover-say.show{display:block}',
 '#cc-takeover-say b{color:#ffd45c;display:block;font-size:12px;margin-bottom:3px}',
 '#cc-takeover-say.birman{border-color:#ff3b5c;background:#1a0f1ef5}',
 '#cc-takeover-say.birman b{color:#ff6b84}',
 '#cc-takeover-say.glitch{animation:ccGlitch .09s steps(2) infinite;border-color:#7ff5ff}',
 '#cc-takeover-say.glitch b,#cc-takeover-say.glitch span{text-shadow:-3px 0 #ff3b5c,3px 0 #7ff5ff}',
 '@keyframes ccGlitch{0%{transform:translate(-50%,0) skewX(0)}25%{transform:translate(calc(-50% - 6px),2px) skewX(8deg)}50%{transform:translate(calc(-50% + 5px),-2px) skewX(-6deg);filter:hue-rotate(90deg)}75%{transform:translate(calc(-50% - 2px),1px);clip-path:inset(20% 0 30% 0)}100%{transform:translate(-50%,0)}}',
 '#cc-takeover-cut{position:fixed;inset:0;z-index:99995;display:none;background:#000}',
 '#cc-takeover-cut.on{display:block}',
 '#cc-takeover-cut canvas{width:100%;height:100%;image-rendering:pixelated;display:block}'
].join('');document.head.append(css);
const box=document.createElement('div');box.id='cc-takeover-say';box.setAttribute('role','status');box.innerHTML='<b></b><span></span>';document.body.append(box);
let hideTimer=0;
function say(by,text,cls='',ms=7000){
 box.className='show '+cls;box.querySelector('b').textContent=by;box.querySelector('span').textContent=text;
 clearTimeout(hideTimer);if(ms)hideTimer=setTimeout(()=>box.classList.remove('show'),ms);
}
const scramble=t=>[...t].map(c=>c===' '?' ':'#@%&?!*$'[Math.floor(Math.random()*8)]).join('');
const seen=new Set();let lastBy='',ownerName='';
function handle(p){
 if(!p||!p.by||p.by==='Cat City Admin')return false;
 if(p.id){if(seen.has(p.id))return true;seen.add(p.id)}
 if(p.cut){
  // "Here we go…" types out, then cuts off mid-word.
  const full=p.text||'Here we go…';let i=0;lastBy=p.by;ownerName=p.by;say(p.by,'','',0);
  const iv=setInterval(()=>{i++;box.querySelector('span').textContent=full.slice(0,Math.min(i,full.length-2))+(i>=full.length-2?'—':'');if(i>=full.length-2){clearInterval(iv)}},90);
  return true;
 }
 if(p.glitch){
  // The box glitches out, then The Birman Family take over the message.
  box.className='show glitch';box.querySelector('b').textContent=scramble(lastBy||'Cat City Admin');
  let n=0;const iv=setInterval(()=>{n++;box.querySelector('b').textContent=scramble(n%2?'THE BIRMAN FAMILY':'????????');box.querySelector('span').textContent=scramble(p.text.slice(0,40));
   // Their recorded message (w05) is about 9.3 s; the cutscene starts when they finish.
   if(n>16){clearInterval(iv);say('🎭 The Birman Family',p.text,'birman',10000);window.catCityVoice?.play('w05');setTimeout(()=>play(p.at||Date.now()),9800)}},90);
  return true;
 }
 lastBy=p.by;if(p.by!=='The Birman Family')ownerName=p.by;say(p.by,p.text);return true;
}
// ------------------------------------------------------------------ cutscene
const cut=document.createElement('div');cut.id='cc-takeover-cut';const cv=document.createElement('canvas');cut.append(cv);document.body.append(cut);
const g=cv.getContext('2d');
const GEAR=[['Diamond Helmet','Diamond Chestplate','Diamond Boots','Diamond Sword'],['Emerald Helmet','Emerald Chestplate','Emerald Boots','Emerald Sword'],['Amethyst Helmet','Amethyst Chestplate','Amethyst Boots','Amethyst Sword'],
 ['Titanium Helmet','Titanium Chestplate','Titanium Boots','Titanium Sword'],['Crystal Helmet','Crystal Chestplate','Crystal Boots','Crystal Sword'],['Eli-Geode Helmet','Eli-Geode Chestplate','Eli-Geode Boots','Eli-geode Blade']];
function kit(i){const [h,b,p,w]=GEAR[i%GEAR.length],it=(n,t)=>({id:'takeover:'+n,name:n,type:t,rarity:'legendary'});return {gear:{head:it(h,'head'),body:it(b,'body'),paws:it(p,'paws')},weapon:it(w,'weapon')}}
// The cutscene is 3D: a perspective ground plane drawn one screen row at a
// time (like the boss intro), with the cats and portals as upright sprites.
// World: the six cats line up across x at y=LINE, facing the camera; the
// portals wait behind the camera at y=PORTAL_Y.
const LINE=1000,PORTAL_Y=1900,TEX=2400,RUN_AT=8.3,TURN_AT=9.7,END=11.6;
const SHOTS=[[0,2.4,1],[2.4,1.3,2],[3.7,1.3,3],[5.0,1.4,4],[6.4,1.9,6]];
let playing=false,startAt=0,raf=0,order=CATS,tex=null,texFlip=null;
const catX=i=>[0,-46,46,-92,92,-138][i]*1.0+TEX/2;
function textures(){
 if(tex)return;tex=document.createElement('canvas');tex.width=tex.height=TEX;const x=tex.getContext('2d');
 const F=window.catCityFloors;
 if(F){F.fill(x,'town',0,0,TEX,TEX);F.fill(x,'path',TEX/2-260,0,520,TEX);F.fill(x,'path',0,LINE-120,TEX,240)}else{x.fillStyle='#a8d49a';x.fillRect(0,0,TEX,TEX)}
 x.fillStyle='rgba(70,10,40,.35)';x.fillRect(0,0,TEX,TEX);
 texFlip=document.createElement('canvas');texFlip.width=texFlip.height=TEX;const y=texFlip.getContext('2d');y.translate(TEX,0);y.scale(-1,1);y.drawImage(tex,0,0);
}
const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2,lerp=(a,b,p)=>a+(b-a)*p;
// Camera for time t: {x, y, h (height), dir (-1 looks towards -y, +1 towards +y), horizon (fraction of H), focal}
function camera(t,W,H){
 if(t<SHOTS[4][0]){
  const [st,len,n]=SHOTS.findLast(sh=>t>=sh[0]),p=ease(Math.min(1,(t-st)/len));
  // Each shot starts down at the paws and rises up to show the whole group.
  const cx=n===1?catX(0):(catX(0)+catX(n-1))/2+(n%2?0:0),width=n===1?40:Math.abs(catX(n-1)-catX(n-2))*(n/2)+60;
  const cx2=n===1?catX(0):[catX(0),catX(1),catX(2),catX(3)].slice(0,n).reduce((a,b)=>a+b,0)/n;
  const dist=lerp(46,Math.max(130,width*1.35),p),h=lerp(5,46,p),side=n%2?1:-1;
  return {x:cx2+side*lerp(0,30,p),y:LINE+dist,h,dir:-1,horizon:lerp(.82-5/46*1.25,.38,p),focal:Math.min(W,H)*1.2};
 }
 if(t<RUN_AT){const p=ease(Math.min(1,(t-SHOTS[4][0])/1.6));return {x:TEX/2,y:LINE+lerp(200,250,p),h:lerp(60,80,p),dir:-1,horizon:.38,focal:Math.min(W,H)*1.15}}
 if(t<TURN_AT){return {x:TEX/2,y:LINE+300,h:26,dir:-1,horizon:.42,focal:Math.min(W,H)*1.1}}
 // Reverse shot: the camera has turned round to face the portals.
 const p=ease(Math.min(1,(t-TURN_AT)/1.2));return {x:TEX/2,y:LINE+lerp(300,360,p),h:lerp(26,70,p),dir:1,horizon:.4,focal:Math.min(W,H)*1.1};
}
// Where each cat is at time t (they charge the camera, then race to the portals).
function catPos(i,t){
 const x=catX(i);if(t<RUN_AT)return {x,y:LINE,run:false};
 const r=Math.max(0,t-RUN_AT-i*.06),y=LINE+r*300,PX=[TEX/2-260,TEX/2+260,TEX/2];
 const p=Math.max(0,Math.min(1,(y-(LINE+300))/(PORTAL_Y-(LINE+300)))),tx=PX[i%3];
 return {x:y<LINE+300?x:lerp(x,tx,p),y:Math.min(PORTAL_Y-10,y),run:true,gone:y>=PORTAL_Y-10};
}
function project(cam,wx,wy,W,H){
 const f=cam.dir<0?cam.y-wy:wy-cam.y,l=cam.dir<0?wx-cam.x:cam.x-wx;if(f<6)return null;
 return {sx:W/2+l*cam.focal/f,sy:cam.horizon*H+cam.h*cam.focal/f,k:cam.focal/f,f};
}
function frame(){
 if(!playing)return;
 const W=cv.width=innerWidth,H=cv.height=innerHeight,t=(performance.now()-startAt)/1000,art=window.catCityCatArt;textures();
 const cam=camera(t,W,H),hz=cam.horizon*H;g.imageSmoothingEnabled=false;
 // Sky: dark, with a red takeover glow, and village rooftops on the horizon.
 const sky=g.createLinearGradient(0,0,0,Math.max(1,hz));sky.addColorStop(0,'#12091c');sky.addColorStop(1,'#5a1f3a');g.fillStyle=sky;g.fillRect(0,0,W,Math.max(0,hz)+1);
 g.fillStyle='#1d0f22';for(let i=0;i<10;i++){const x=((i*W/8+cam.x*.2*cam.dir)%(W+200))-100,w=W/9,h=28+((i*37)%5)*9;if(hz-h<H){g.fillRect(x,hz-h,w,h+2);for(let k=0;k<w/2;k+=3)g.fillRect(x+k,hz-h-k*.45,w-2*k,3)}}
 // Perspective ground.
 for(let r=Math.max(0,Math.ceil(hz)+1);r<H;r+=2){const d=cam.h*cam.focal/(r-hz),span=W*d/cam.focal,wy=cam.dir<0?cam.y-d:cam.y+d;
  if(wy<0||wy>=TEX){g.fillStyle='#2a1426';g.fillRect(0,r,W,2);continue}
  if(cam.dir<0)g.drawImage(tex,cam.x-span/2,wy,span,1,0,r,W,2);else g.drawImage(texFlip,TEX-(cam.x+span/2),wy,span,1,0,r,W,2);
  const fog=Math.min(.6,d/2200);if(fog>.02){g.fillStyle='rgba(18,9,28,'+fog.toFixed(3)+')';g.fillRect(0,r,W,2)}}
 // Upright sprites, far first.
 const list=[];
 for(let i=0;i<3;i++){const px=[TEX/2-260,TEX/2+260,TEX/2][i],pr=project(cam,px,PORTAL_Y,W,H);if(pr)list.push({f:pr.f,draw:()=>{const r=90*pr.k;
  for(let k=5;k>0;k--){g.fillStyle=k%2?'rgba(255,59,92,'+(.2+k*.07)+')':'rgba(127,245,255,'+(.14+k*.05)+')';const rr=r*k/5*(1+Math.sin(t*6+k+i)*.07);g.fillRect(Math.round(pr.sx-rr*.7),Math.round(pr.sy-rr*2),Math.round(rr*1.4),Math.round(rr*2))}
  g.fillStyle='#0b0510';g.fillRect(Math.round(pr.sx-r*.25),Math.round(pr.sy-r*1.2),Math.round(r*.5),Math.round(r*1.1))}})}
 const shown=t<SHOTS[4][0]?SHOTS.findLast(sh=>t>=sh[0])[2]:6;
 for(let i=0;i<shown;i++){const c=catPos(i,t);if(c.gone)continue;const pr=project(cam,c.x,c.y,W,H);if(!pr)continue;const k=kit(i);
  list.push({f:pr.f,draw:()=>{g.fillStyle='#12091c55';g.beginPath();g.ellipse(pr.sx,pr.sy,18*pr.k,5*pr.k,0,0,7);g.fill();
   const away=cam.dir>0&&c.run,pose=c.run?(away?'walkBack':'walkFront'):'walkFront',fr=c.run?Math.floor(t*12+i)%2:0,bob=c.run?Math.abs(Math.sin(t*14+i))*4*pr.k:0;
   if(art)art.draw(g,pr.sx,pr.sy-bob,order[i],pose,fr,{scale:1.65*1.2*pr.k,gear:k.gear,weapon:k.weapon})}})}
 list.sort((a,b)=>b.f-a.f);for(const it of list)it.draw();
 // Sword glint as each group shot settles.
 if(t<SHOTS[4][0]+1.9){const [st,len,n]=SHOTS.findLast(sh=>t>=sh[0]),p=(t-st)/len;if(p>.78&&p<1){const a=(p-.78)/.22;for(let i=0;i<n;i++){const pr=project(cam,catX(i),LINE,W,H);if(!pr)continue;const x=pr.sx+12*pr.k,y=pr.sy-34*pr.k,r=10*pr.k*a;g.fillStyle='rgba(255,255,255,'+(1-a)+')';g.fillRect(x-r,y-1,r*2,3);g.fillRect(x-1,y-r,3,r*2)}}}
 if(t>SHOTS[4][0]+.5&&t<RUN_AT+.3){g.globalAlpha=Math.min(1,(t-SHOTS[4][0]-.5)*3);g.textAlign='center';g.font='bold '+Math.round(Math.min(34,W/18))+'px system-ui';g.lineWidth=6;g.strokeStyle='#12091c';g.fillStyle='#ffd45c';
  g.strokeText('⚔️ CAT CITY FIGHTS BACK! ⚔️',W/2,H*.18);g.fillText('⚔️ CAT CITY FIGHTS BACK! ⚔️',W/2,H*.18);g.globalAlpha=1}
 // Quick whip-pan flash when the camera turns round.
 if(Math.abs(t-TURN_AT)<.16){g.fillStyle='rgba(255,255,255,'+(1-Math.abs(t-TURN_AT)/.16)*.8+')';g.fillRect(0,0,W,H)}
 const bar=Math.round(H*.08);g.fillStyle='#000';g.fillRect(0,0,W,bar);g.fillRect(0,H-bar,W,bar);
 const fade=t<.4?1-t/.4:t>END-.6?Math.min(1,(t-END+.6)/.6):0;if(fade>0){g.fillStyle='rgba(0,0,0,'+fade+')';g.fillRect(0,0,W,H)}
 if(t>=END){stop();return}
 raf=requestAnimationFrame(frame);
}
function play(id){
 const key='cc-takeover-played:'+(id||'test');
 if(id){try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1')}catch(e){}}
 // Your own cat leads the first shot.
 const mine=CATS[s.cat]||'astro';order=[mine,...CATS.filter(c=>c!==mine)];
 playing=true;startAt=performance.now();cut.classList.add('on');cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
}
function stop(){playing=false;cut.classList.remove('on');cancelAnimationFrame(raf);core.note('🌀 Birman portals have opened around the village! Walk into one to fight.')}
// ------------------------------------------------------------------ portals in the world
function live(){const st=window.catCityAdminStageState;return !!(st?.active&&st.takeover?.phase==='taken')}
const PORTALS=[{x:-3*T,y:17.5*T,ch:7},{x:51*T,y:17.5*T,ch:11},{x:24*T,y:-3*T,ch:15},{x:17.5*T,y:38*T,ch:19}];
function portals(){return live()?PORTALS:[]}
let lastWatch='';
setInterval(()=>{const tk=window.catCityAdminStageState?.takeover;
 // Players who were offline or polling (no live announcement) still get the cutscene once.
 if(live()&&tk.at&&lastWatch!==String(tk.at)){lastWatch=String(tk.at);if(Date.now()/1000-tk.at<90&&!playing)setTimeout(()=>{if(!playing)play(tk.at)},11000)}},1500);
const oldDraw=core.draw;
core.draw=function(){
 oldDraw();if(!live()||core.bossMode||playing||window.catCityCaveState?.().inside)return;
 const ctx=core.ctx,cx=s.x-core.W/2,cy=s.y-core.H/2,t=performance.now()/1000;
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(const p of PORTALS){const x=p.x-cx,y=p.y-cy;if(x<-120||y<-160||x>core.W+120||y>core.H+120)continue;
  for(let i=5;i>0;i--){ctx.fillStyle=i%2?'rgba(255,59,92,'+(.18+i*.07)+')':'rgba(127,245,255,'+(.12+i*.05)+')';const r=52*i/5*(1+Math.sin(t*6+i)*.07);ctx.fillRect(Math.round(x-r*.7),Math.round(y-r*1.3),Math.round(r*1.4),Math.round(r*2))}
  ctx.fillStyle='#0b0510';ctx.fillRect(Math.round(x-12),Math.round(y-30),24,40);
  ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#12091c';ctx.fillStyle='#ff8fa3';ctx.strokeText('🎭 BIRMAN PORTAL',x,y-78);ctx.fillText('🎭 BIRMAN PORTAL',x,y-78);
  if(Math.hypot(s.x-p.x,s.y-p.y)<80){ctx.fillStyle='#fff6e4';ctx.strokeText('E / 🐾 · Enter',x,y+30);ctx.fillText('E / 🐾 · Enter',x,y+30)}}
 ctx.restore();
};
const oldInteract=core.interact;
core.interact=function(){
 if(live()&&!core.bossMode){const p=PORTALS.find(p=>Math.hypot(s.x-p.x,s.y-p.y)<80);if(p){core.note('🎭 Into the Birman portal! Your friends are coming too.');portalFight=true;allies=null;core.startBoss(99,{force:true});return}}
 return oldInteract();
};
if($('interact'))$('interact').onclick=()=>core.interact();
// ------------------------------------------------------------------ AI helper cats in portal fights
// The roster cats nobody is playing join you, told to help but not to win it
// for you: each takes a small swipe now and then, they keep their distance,
// and together they can never do more than a quarter of the boss's health.
let portalFight=false,allies=null,allyDamage=0;
const ALLY_CAP=.35;
function makeAllies(api){
 const taken=new Set([CATS[s.cat]]);
 for(const p of (window.catCityOnlinePlayers?.()||[]))if(p&&Number.isInteger(p.cat))taken.add(CATS[p.cat]);
 allyDamage=0;
 return CATS.filter(c=>!taken.has(c)).map((id,i)=>({id,x:api.px+(i-2)*70,y:api.py+40,cool:2+i*.7,swing:0,flip:false,k:kit(i+1)}));
}
window.catCityArenaAllies={
 tick(dt,api){
  if(!portalFight)return;if(!allies)allies=makeAllies(api);
  const cap=(api.maxHP+(api.juniorHP>0?140:0))*ALLY_CAP;
  allies.forEach((a,i)=>{
   const junior=api.juniorHP>0&&i%2===1,tx=junior?api.juniorX:api.bossX,ty=junior?api.juniorY:api.bossY;
   // Circle the boss at a safe distance, each at its own angle.
   const ang=performance.now()/2600+i*Math.PI*2/allies.length,gx=tx+Math.cos(ang)*120,gy=ty+Math.sin(ang)*85;
   const dx=gx-a.x,dy=gy-a.y,d=Math.hypot(dx,dy);if(d>4){const st=Math.min(d,150*dt);a.x+=dx/d*st;a.y+=dy/d*st;a.flip=dx<0}
   a.cool-=dt;a.swing=Math.max(0,a.swing-dt);
   if(a.ko)return;
   if(a.cool<=0&&allyDamage<cap&&(junior?api.juniorHP:api.bossHP)>0){a.cool=3.5+Math.random()*2.5;a.swing=.25;const dmg=Math.min(1,cap-allyDamage);allyDamage+=dmg;api.hit(dmg,junior)}
  });
 },
 list(){return portalFight&&allies?allies:[]},
 knockout(){if(allies)allies.forEach(a=>{a.ko=true})},
 draw(ctx){
  if(!portalFight||!allies)return;const art=window.catCityCatArt;
  for(const a of allies){ctx.fillStyle='#392f5955';ctx.beginPath();ctx.ellipse(a.x,a.y+4,16,6,0,0,7);ctx.fill();
   if(a.ko){if(art)art.draw(ctx,a.x,a.y,a.id,'sleep',0,{scale:1.65});const t=performance.now()/1000;for(let i=0;i<3;i++){const an=t*4+i*2.1;ctx.fillStyle='#ffd45c';ctx.fillRect(a.x+Math.cos(an)*18-3,a.y-34+Math.sin(an)*5-3,6,6)}}
   else if(art)art.draw(ctx,a.x,a.y,a.id,a.swing>0?'run':'walkFront',a.swing>0?2:0,{scale:1.65,flip:a.flip,gear:a.k.gear,weapon:a.k.weapon});
   ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#241832';ctx.fillStyle='#bff7ff';const n=a.id[0].toUpperCase()+a.id.slice(1)+(a.ko?' · KO':' · BOT');ctx.strokeText(n,a.x,a.y-44);ctx.fillText(n,a.x,a.y-44)}
 }
};
setInterval(()=>{if(!core.bossMode&&portalFight){portalFight=false;allies=null}},800);
window.catCityTakeover={handle,play,portals,live,ownerName:()=>ownerName};
})();

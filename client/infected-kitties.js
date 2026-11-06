/* Cat City — infected kitties (giant update).
 *
 * Poorly kitties wander the wilds, never within 50 tiles of the village. They
 * look green and spotty, cough little bubbles, and chase and bump you (each
 * bump knocks 2 fish coins loose).
 * You choose:
 *   💚 Heal: use a rare Coconut Flower (Flower Terrace). The kitty sparkles
 *      back to health, thanks you, gives you a reward, then wanders off.
 *   ⚔️ Fight: hit it with your sword (or bow from range) until it faints.
 * Healed and fainted kitties come back after 25 minutes.
 *
 * Desktop: E heals if you have a Coconut Flower, otherwise fights; F always fights.
 * API: catCityInfected.list() · catCityInfected.heal(id) · catCityInfected.fight(id)
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,T=core.T,CH=24*T,$=id=>document.getElementById(id);
s.kittyState=s.kittyState&&typeof s.kittyState==='object'?s.kittyState:{};
s.materials=s.materials&&typeof s.materials==='object'?s.materials:{};
const h=(x,y,k=0)=>{const n=Math.sin(x*127.1+y*311.7+k*53.17)*43758.5453;return n-Math.floor(n)};
const VILLAGE={x0:0,y0:0,x1:48*T,y1:35*T},SAFE=50*T,BACK=25*60*1000,HP=10;
const COATS=['poppy','clover','mochi','toffee','pip','willow'];
// Distance from a point to the village rectangle.
const villageDist=(x,y)=>Math.hypot(Math.max(VILLAGE.x0-x,0,x-VILLAGE.x1),Math.max(VILLAGE.y0-y,0,y-VILLAGE.y1));
const live=new Map(); // id → kitty with moving state
function kittiesNear(){
 const cx0=Math.floor(s.x/CH),cy0=Math.floor(s.y/CH),now=Date.now(),ids=new Set();
 for(let cx=cx0-1;cx<=cx0+1;cx++)for(let cy=cy0-1;cy<=cy0+1;cy++){
  const r=h(cx,cy,71);if(r>=.4)continue;const n=r<.12?2:1;
  for(let i=0;i<n;i++){const id='ik:'+cx+':'+cy+':'+i,hx=cx*CH+(4+h(cx+i,cy,72)*16)*T,hy=cy*CH+(4+h(cx,cy+i,73)*16)*T;
   if(villageDist(hx,hy)<SAFE)continue;
   const st=s.kittyState[id];if(st&&st.until>now&&!live.get(id)?.leaving)continue;
   ids.add(id);if(!live.has(id))live.set(id,{id,homeX:hx,homeY:hy,x:hx,y:hy,hp:HP,coat:COATS[Math.floor(h(cx,cy+i,74)*COATS.length)],wander:0,tx:hx,ty:hy,bump:0,hurt:0,state:'sick',stateAt:0,flip:false})}
 }
 for(const [id,k] of live)if(!ids.has(id)&&k.state==='sick')live.delete(id);
 return [...live.values()];
}
function nearest(range=120){let best=null,bd=range;for(const k of kittiesNear()){if(k.state!=='sick')continue;const d=Math.hypot(s.x-k.x,s.y-k.y);if(d<bd){bd=d;best=k}}return best}
// ------------------------------------------------------------------ actions
function heal(k){
 if(!k||k.state!=='sick')return;
 if(!((s.materials.coconut||0)>0)){core.note('🥥 You need a Coconut Flower to heal this kitty. They grow in the Flower Terrace!');return}
 s.materials.coconut--;k.state='healing';k.stateAt=performance.now();
 // Reward: fish coins plus something nice.
 s.fish=(Number(s.fish)||0)+25;
 const r=Math.random();let extra='';
 if(r<.35){const it=window.catCityLuckyBlocks?.reward(r<.08?'rare':'uncommon',Date.now()%9973);if(it){const item={id:'kitty:'+Date.now().toString(36),...it};s.adventureItems=Array.isArray(s.adventureItems)?s.adventureItems:[];s.adventureItems.push(item);window.catCityInventoryItemAdded?.(item);extra=' and a '+item.name}}
 else{const mats=['rose','bluebell','sunpetal','lavender','iron','crystal'],m=mats[Math.floor(Math.random()*mats.length)];s.materials[m]=(s.materials[m]||0)+2;extra=' and 2 '+m}
 s.kittyState[k.id]={status:'healed',until:Date.now()+BACK};core.persist();
 k.reward='+25 🐟'+extra;core.note('💚 You healed the kitty! It gave you 25 fish coins'+extra+'.');
 window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'heal',kitty:k.id}}));
}
function fight(k){
 if(!k||k.state!=='sick')return;
 const B=window.catCityBow,bow=B?.equipped(),d=Math.hypot(s.x-k.x,s.y-k.y);
 if(d>(bow?B.range:90)){core.note(bow?'🏹 Get within bow range!':'⚔️ Get closer to fight the kitty!');return}
 if(performance.now()-(k.lastHit||0)<380)return;k.lastHit=performance.now();
 if(bow){if(!B.fire())return;B.shoot(s.x,s.y,k.x,k.y-10)}
 window.catCityWeaponHit?.();window.catCitySetPlayerActivity?.('fight');
 const dmg=window.catCityHitDamage?.()||1;k.hp=Math.max(0,k.hp-dmg);k.hurt=.25;
 if(k.hp<=0){k.state='fainted';k.stateAt=performance.now();const coins=8,mat=Math.random()<.5?'venom':'stone';s.fish=(Number(s.fish)||0)+coins;s.materials[mat]=(s.materials[mat]||0)+1;
  s.kittyState[k.id]={status:'defeated',until:Date.now()+BACK};core.persist();core.note('😵 The infected kitty fainted. +'+coins+' 🐟 and 1 '+mat+'.')}
 else core.note('⚔️ Hit! The kitty has '+Math.ceil(k.hp)+' health left.');
}
// ------------------------------------------------------------------ buttons
const css=document.createElement('style');css.textContent=['#cc-kitty-actions{display:none;position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:60;gap:8px}',
 '#cc-kitty-actions.show{display:flex}','#cc-kitty-actions button{min-height:44px;padding:8px 12px;font-weight:900;border:2px solid #fff;touch-action:manipulation;white-space:nowrap}',
 '@media (max-width:700px){#cc-kitty-actions{bottom:calc(272px + env(safe-area-inset-bottom,0px))}}',
 '#cc-kitty-heal{background:#9ef0b8;color:#1f4a2e}','#cc-kitty-fight{background:#ffb0c0;color:#4a1f2e}'].join('');document.head.append(css);
const bar=document.createElement('div');bar.id='cc-kitty-actions';bar.innerHTML='<button id="cc-kitty-heal" type="button">💚 Heal</button><button id="cc-kitty-fight" type="button">⚔️ Fight</button>';document.body.append(bar);
$('cc-kitty-heal').onclick=()=>heal(nearest(140));$('cc-kitty-fight').onclick=()=>fight(nearest(window.catCityBow?.equipped()?360:140));
addEventListener('keydown',e=>{if((e.key==='f'||e.key==='F'||e.key===' ')&&!e.repeat&&!core.bossMode&&!e.target?.closest?.('input,textarea,select,[contenteditable]')){const k=nearest(window.catCityBow?.equipped()?360:120);if(k){e.preventDefault();fight(k)}}});
const oldInteract=core.interact;
core.interact=function(){if(!core.bossMode){const k=nearest(95);if(k){if((s.materials.coconut||0)>0)heal(k);else fight(k);return}}return oldInteract()};
if($('interact'))$('interact').onclick=()=>core.interact();
// ------------------------------------------------------------------ movement
let last=performance.now(),bumpCool=0;
setInterval(()=>{
 const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;
 const off=core.bossMode||document.body.classList.contains('start-menu-open')||window.catCityCaveState?.().inside||document.body.classList.contains('in-interior');
 const k0=off?null:nearest(140);bar.classList.toggle('show',!!k0);
 if(k0)$('cc-kitty-heal').textContent='💚 Heal (🥥 '+(s.materials.coconut||0)+')';
 if(off)return;bumpCool=Math.max(0,bumpCool-dt);
 for(const k of kittiesNear()){
  k.hurt=Math.max(0,k.hurt-dt);
  if(k.state==='healing'){if(now-k.stateAt>2200){k.state='leaving';k.stateAt=now;k.tx=k.x+(Math.random()<.5?-1:1)*600;k.ty=k.y+(Math.random()-.5)*300}continue}
  if(k.state==='leaving'){const dx=k.tx-k.x,dy=k.ty-k.y,d=Math.hypot(dx,dy)||1;k.x+=dx/d*110*dt;k.y+=dy/d*110*dt;k.flip=dx<0;if(now-k.stateAt>4500)live.delete(k.id);continue}
  if(k.state==='fainted'){if(now-k.stateAt>2600)live.delete(k.id);continue}
  const pd=Math.hypot(s.x-k.x,s.y-k.y);
  if(pd<200&&villageDist(s.x,s.y)>SAFE*.6){k.tx=s.x;k.ty=s.y}
  else{k.wander-=dt;if(k.wander<=0){k.wander=2+Math.random()*3;k.tx=k.homeX+(Math.random()-.5)*260;k.ty=k.homeY+(Math.random()-.5)*200}}
  const dx=k.tx-k.x,dy=k.ty-k.y,d=Math.hypot(dx,dy);const sp=pd<200?60:35; // playtest: kitties were too quick
  if(d>26){k.x+=dx/d*sp*dt;k.y+=dy/d*sp*dt;k.flip=dx<0}
  if(pd<28&&bumpCool<=0){bumpCool=3;const lost=Math.min(2,Number(s.fish)||0);s.fish=(Number(s.fish)||0)-lost;core.persist();core.note('🤧 The infected kitty bumped you'+(lost?' and knocked '+lost+' fish loose!':'!')+' Heal it with a Coconut Flower or fight it.');window.catCityHurt?.(1,'an infected kitty')}
 }
},50);
// ------------------------------------------------------------------ drawing
const tint=document.createElement('canvas');tint.width=tint.height=96;const tg=tint.getContext('2d');
function drawKitty(ctx,k,x,y,t){
 const art=window.catCityCatArt;if(!art)return;
 const sick=k.state==='sick'||(k.state==='healing'&&performance.now()-k.stateAt<1100);
 const pose=k.state==='fainted'?'sleep':k.state==='leaving'?'walk':Math.hypot(k.tx-k.x,k.ty-k.y)>26?'walk':'idle',fr=Math.floor(t*8)%4;
 ctx.fillStyle='#2a1d3655';ctx.beginPath();ctx.ellipse(x,y+2,16,5,0,0,7);ctx.fill();
 const fade=k.state==='leaving'?Math.max(0,1-(performance.now()-k.stateAt)/4500):k.state==='fainted'?Math.max(0,1-(performance.now()-k.stateAt)/2600):1;
 ctx.globalAlpha=fade;
 if(sick){
  // Draw the cat into a small canvas and tint it a sickly green.
  tg.clearRect(0,0,96,96);art.draw(tg,48,80,k.coat,pose,fr,{scale:1.65,flip:k.flip});
  tg.globalCompositeOperation='source-atop';tg.fillStyle=k.hurt>0?'rgba(255,80,100,.55)':'rgba(120,200,80,.48)';tg.fillRect(0,0,96,96);
  tg.fillStyle='rgba(150,80,190,.85)';for(const [sx,sy] of [[40,50],[56,58],[46,66],[60,44]])tg.fillRect(sx,sy,4,4);
  tg.globalCompositeOperation='source-over';ctx.imageSmoothingEnabled=false;ctx.drawImage(tint,Math.round(x-48),Math.round(y-80));
  // Coughing bubbles.
  for(let i=0;i<3;i++){const p=(t*.7+i/3)%1;ctx.fillStyle='rgba(180,240,140,'+(1-p)+')';ctx.fillRect(Math.round(x+10+p*14),Math.round(y-40-p*26),4,4)}
  if(k.hp<HP){ctx.fillStyle='#2a1d36';ctx.fillRect(x-20,y-54,40,6);ctx.fillStyle='#9ef0b8';ctx.fillRect(x-19,y-53,38*k.hp/HP,4)}
  ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#241832';ctx.fillStyle='#c8f5a8';ctx.strokeText('🤒 Infected Kitty',x,y-60);ctx.fillText('🤒 Infected Kitty',x,y-60);
 }else art.draw(ctx,x,y,k.coat,pose,fr,{scale:1.65,flip:k.flip});
 if(k.state==='healing'){const e=(performance.now()-k.stateAt)/1000;ctx.fillStyle='#ffffff';for(let i=0;i<10;i++){const a=e*4+i*.63,r=14+e*18;ctx.fillRect(Math.round(x+Math.cos(a)*r),Math.round(y-30+Math.sin(a)*r*.6),3,3)}
  if(e>.9){ctx.font='bold 12px system-ui';ctx.textAlign='center';const msg='💚 Thank you! I feel so much better!',w=ctx.measureText(msg).width+16;ctx.fillStyle='#ffffffee';ctx.fillRect(x-w/2,y-92,w,22);ctx.fillStyle='#2a1d36';ctx.fillText(msg,x,y-77);
   if(k.reward){ctx.fillStyle='#fff3a0';ctx.strokeStyle='#241832';ctx.lineWidth=3;ctx.strokeText(k.reward,x,y-100);ctx.fillText(k.reward,x,y-100)}}}
 ctx.globalAlpha=1;
}
const oldDraw=core.draw;
core.draw=function(){
 oldDraw();
 if(core.bossMode||document.body.classList.contains('start-menu-open')||window.catCityCaveState?.().inside||document.body.classList.contains('in-interior'))return;
 const ctx=core.ctx,cx=s.x-core.W/2,cy=s.y-core.H/2,t=performance.now()/1000;ctx.save();
 for(const k of kittiesNear()){const x=k.x-cx,y=k.y-cy;if(x<-80||y<-100||x>core.W+80||y>core.H+80)continue;drawKitty(ctx,k,x,y,t)}
 ctx.restore();
};
window.catCityInfected={list:kittiesNear,heal:id=>heal(live.get(id)),fight:id=>fight(live.get(id)),villageDist};
})();

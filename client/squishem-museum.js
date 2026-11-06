/* Cat City: Squishem Collection Room — a real walkable museum.
 * Preserves existing saves and Squishem collection ownership.
 */
(()=>{'use strict';
const core=window.__catCityEngine,plush=window.catCitySquishems,art=window.catCitySquishemArt;
if(!core||!plush||!art)return;
const $=id=>document.getElementById(id),s=core.state,T=core.T;
const entrance={x:18*T,y:29*T},catalog=plush.catalog;
const tiers=[
 {count:3,label:'25% · First Collector',reward:'60 🐟 fish coins',kind:'fish',qty:60},
 {count:5,label:'50% · Lucky Whiskers',reward:'1-hour +10% luck blessing',kind:'luck'},
 {count:8,label:'75% · Plush Decorator',reward:'🧸 shelf décor unlock',kind:'decor'},
 {count:10,label:'100% · Master Collector',reward:'250 🐟 + Master Collector Medal',kind:'master'}
];
s.museumRewards=s.museumRewards&&typeof s.museumRewards==='object'?s.museumRewards:{};
s.decorUnlocked=Array.isArray(s.decorUnlocked)?s.decorUnlocked:[];
let inside=false,x=372,y=361,last=0,raf=0,focused=null;
const pressed=new Set(),spots=catalog.map((d,i)=>({id:d.id,x:106+(i%5)*136,y:i<5?182:301}));
const css=document.createElement('style');css.id='cc-museum-style';
css.textContent=[
 '#cc-museum{display:none;position:fixed;inset:0;z-index:9050;background:linear-gradient(160deg,#241636,#473458);padding:8px;align-items:center;justify-content:center;flex-direction:column;gap:5px;touch-action:pan-y!important}',
 '#cc-museum.open{display:flex}',
 '#cc-museum h2{color:#fff3dd;font:900 18px system-ui;margin:2px}',
 '#cc-museum-progress{color:#ffedc5;font:bold 12px system-ui;text-align:center}',
 '#cc-museum-canvas{width:min(96vw,780px);max-height:53dvh;height:auto;image-rendering:pixelated;border:4px solid #f6d2ee;border-radius:15px;background:#e8d6e8}',
 '#cc-museum-actions{display:flex;gap:3px;flex-wrap:wrap;align-items:center;justify-content:center;max-width:96vw}',
 '#cc-museum-actions button,#cc-museum-info button{min-height:42px;min-width:43px;border:2px solid #d8c0f7;border-radius:9px;padding:7px;background:#f5ddf3;color:#3d2946;font:bold 12px system-ui;touch-action:manipulation!important}',
 '#cc-museum-hint{min-height:25px;color:#fff0d6;font:bold 12px/1.5 system-ui;text-align:center;max-width:95vw}',
 '#cc-museum-info{display:none;position:absolute;z-index:2;top:10%;left:50%;transform:translateX(-50%);width:min(480px,94vw);max-height:75dvh;overflow-y:auto!important;-webkit-overflow-scrolling:touch;touch-action:pan-y!important;overscroll-behavior:contain;background:#fff8ef;color:#423352;border:3px solid #e6badc;border-radius:14px;padding:14px;box-shadow:0 12px 32px #271c3866}',
 '#cc-museum-info.open{display:block}',
 '#cc-museum-info h3{margin:4px 0;font:bold 18px system-ui}',
 '#cc-museum-info p,#cc-museum-info li{font:12px/1.6 system-ui}',
 '#cc-museum-info-buttons{display:flex;flex-wrap:wrap;gap:5px}',
 'body.cc-in-museum #cc-sq-open,body.cc-in-museum #cc-sq-event,body.cc-in-museum #cc-hotbar-ten{display:none!important}',
 '@media(max-width:650px){#cc-museum-canvas{max-height:43dvh}#cc-museum h2{font-size:16px}#cc-museum-actions button{min-height:40px;padding:6px}#cc-museum-hint{font-size:11px}}'
].join('\n');document.head.append(css);
const root=document.createElement('div');root.id='cc-museum';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
root.setAttribute('aria-label','Squishem Collection Museum');
root.innerHTML='<h2>🧸 The Squishem Collection Room</h2><div id="cc-museum-progress"></div><canvas id="cc-museum-canvas" width="760" height="420"></canvas><div id="cc-museum-hint"></div><div id="cc-museum-actions"></div><div id="cc-museum-info"><h3 id="cc-museum-info-title"></h3><div id="cc-museum-info-body"></div><div id="cc-museum-info-buttons"></div></div>';
document.body.append(root);
const cv=$('cc-museum-canvas'),g=cv.getContext('2d'),controls=$('cc-museum-actions');
function button(label,onClick,id){
 const b=document.createElement('button');b.type='button';b.textContent=label;if(id)b.id=id;
 b.onclick=onClick;controls.append(b);return b;
}
for(const [label,key] of [['⬅️','left'],['⬆️','up'],['⬇️','down'],['➡️','right']]){
 const b=button(label,()=>{},'cc-museum-'+key);b.setAttribute('aria-label','Walk '+key);
 b.addEventListener('pointerdown',e=>{e.preventDefault();pressed.add(key);b.setPointerCapture?.(e.pointerId)});
 for(const name of ['pointerup','pointercancel','lostpointercapture','pointerleave'])b.addEventListener(name,()=>pressed.delete(key));
}
button('🐾 Interact / E',interact,'cc-museum-action');
button('🏆 Rewards',showRewards,'cc-museum-rewards');
button('🐱 Curator',showCurator,'cc-museum-curator');
button('🚪 Leave',leave,'cc-museum-exit');
const keys={w:'up',a:'left',s:'down',d:'right',arrowup:'up',arrowleft:'left',arrowdown:'down',arrowright:'right'};
window.addEventListener('keydown',e=>{
 if(!inside||e.target?.closest?.('input,textarea,select,[contenteditable]'))return;
 const key=String(e.key||'').toLowerCase();
 if(key==='escape'){e.preventDefault();e.stopImmediatePropagation();if($('cc-museum-info').classList.contains('open'))closeInfo();else leave();return}
 if($('cc-museum-info').classList.contains('open'))return;
 if(key==='e'||key===' '){e.preventDefault();e.stopImmediatePropagation();interact();return}
 if(keys[key]){e.preventDefault();e.stopImmediatePropagation();pressed.add(keys[key])}
},true);
window.addEventListener('keyup',e=>{if(inside)pressed.delete(keys[String(e.key||'').toLowerCase()])},true);
function nearby(){
 const here=[...spots.map(item=>({type:'plush',...item})),{type:'curator',x:702,y:340},{type:'exit',x:379,y:408}];
 let best=null,dist=73;
 for(const item of here){const d=Math.hypot(x-item.x,y-item.y);if(d<dist){best=item;dist=d}}
 return best;
}
function safe(){return !core.bossMode&&!window.catCityTagHouse?.inside&&!window.catCityTutorial?.active&&
 !window.catCityCaveState?.().inside&&!window.catCityPCHouse?.inside&&!window.catCitySquishemPlaces?.inside&&
 !$('catcity-start-menu')?.classList.contains('show')}
function enter(fromMenu=false){
 if(inside)return true;
 if(!safe())return false;
 if(!fromMenu&&Math.hypot(s.x-entrance.x,s.y-entrance.y)>95)return false;
 inside=true;x=379;y=368;last=performance.now();pressed.clear();focused=null;
 root.classList.add('open');document.body.classList.add('cc-in-museum');
 updateProgress();raf=requestAnimationFrame(draw);return true;
}
function leave(){
 if(!inside)return;inside=false;pressed.clear();cancelAnimationFrame(raf);closeInfo();
 root.classList.remove('open');document.body.classList.remove('cc-in-museum');
 core.note('🧸 You left the Squishem Collection Room!');
}
function info(title,body,buttons=[]){
 $('cc-museum-info-title').textContent=title;
 const el=$('cc-museum-info-body');el.replaceChildren();
 const p=document.createElement('p');p.textContent=body;el.append(p);
 const list=$('cc-museum-info-buttons');list.replaceChildren();
 for(const [label,action] of buttons){
  const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;list.append(b);
 }
 const close=document.createElement('button');close.textContent='✕ Close';close.onclick=closeInfo;list.append(close);
 $('cc-museum-info').classList.add('open');
}
function closeInfo(){$('cc-museum-info').classList.remove('open')}
function showPlush(id){
 focused=id;const d=plush.byId[id],owned=plush.owned(id);
 const actions=owned?[
  [s.squishemCarried===id?'🫧 Squish!':'🧸 Carry this Squishem',()=>{
    if(s.squishemCarried===id)plush.squish();else plush.carry(id);showPlush(id);
  }],
  ['🫧 Play squish sound',()=>plush.squish()]
 ]:[['🔎 How do I find it?',()=>{
   const hint=plush.findGuide(id);
   info('🔎 '+d.name,hint.description+' '+hint.status,[
    ['Open Squishem Collection',()=>{closeInfo();leave();plush.open()}]
   ]);
 }]];
 info((owned?'✅ ':'🔒 ')+d.emoji+' '+d.name,
  (owned?'Collected and displayed on your shelf!':'Still missing — it will appear as a silhouette until you collect it.')+
  ' · '+d.source+' · +'+Math.round((d.power-1)*100)+'% '+d.kind+' when carried.',actions);
}
function showCurator(){
 const missing=catalog.filter(it=>!plush.owned(it.id)),tip=missing[0];
 info('🐱 Mallow the Museum Curator',
  tip?'You have '+s.squishemOwned.length+' of '+catalog.length+' plushies! Next, look for '+tip.name+'. '+tip.hint+
      '. Earn rewards at 3, 5, 8 and 10 collected.':
      'You found every Squishem! Claim your Master Collector reward at the rewards desk.',[
   ['🏆 See collection rewards',showRewards],
   ['📚 Squishem hints',()=>{closeInfo();leave();plush.open()}]
  ]);
}
function grantReward(tier){
 if((s.squishemOwned||[]).length<tier.count||s.museumRewards[tier.count])return false;
 if(tier.kind==='master'&&window.catCityInventoryHasSpace&&!window.catCityInventoryHasSpace()){
  core.note('🎒 Free an inventory slot for the Master Collector Medal first.');return false;
 }
 s.museumRewards[tier.count]=true;
 if(tier.kind==='fish')s.fish+=tier.qty;
 if(tier.kind==='luck')s.museumBlessingUntil=Date.now()+3600000;
 if(tier.kind==='decor'&&!s.decorUnlocked.includes('🧸'))s.decorUnlocked.push('🧸');
 if(tier.kind==='master'){
  s.fish+=250;s.museumTitle='Master Collector';
  const item={id:'museum:master-collector-medal',name:'🏆 Master Collector Medal',type:'head',rarity:'impossible',
   color:'#ffdf83',durability:400,maxDurability:400};
  s.adventureItems=Array.isArray(s.adventureItems)?s.adventureItems:[];
  if(!s.adventureItems.some(x=>x.id===item.id)){s.adventureItems.push(item);window.catCityInventoryItemAdded?.(item)}
 }
 core.persist();core.note('🏆 Museum reward unlocked: '+tier.reward);
 updateProgress();return true;
}
function showRewards(){
 const n=s.squishemOwned.length;
 const buttons=tiers.map(tier=>[
  (s.museumRewards[tier.count]?'✅ Claimed':n>=tier.count?'🎁 Claim':'🔒 Locked')+' · '+tier.count+'/10 · '+tier.reward,
  ()=>{if(grantReward(tier))showRewards()}
 ]);
 info('🏆 Museum Milestone Rewards',
  'Collected '+n+'/10. Rewards can be claimed ONCE at 3, 5, 8 and 10 plushies. The Lucky Whiskers blessing lasts one hour after claiming.',
  buttons);
}
function updateProgress(){
 const amount=catalog.filter(d=>plush.owned(d.id)).length;
 $('cc-museum-progress').textContent='🌷 '+amount+' / '+catalog.length+' collected · '+(s.museumTitle||'Plush Explorer')+
   ' · Next: '+(tiers.find(t=>!s.museumRewards[t.count])?.count||'All')+' Squishems';
}
function interact(){
 if(!inside)return false;
 if($('cc-museum-info').classList.contains('open')){closeInfo();return true}
 const near=nearby();
 if(!near){$('cc-museum-hint').textContent='Walk closer to a display, the curator or the door!';return true}
 if(near.type==='plush')showPlush(near.id);
 else if(near.type==='curator')showCurator();
 else leave();
 return true;
}
function px(px,py,w,h,color){g.fillStyle=color;g.fillRect(px,py,w,h)}
function label(text,px,py,font='bold 14px system-ui'){
 g.font=font;g.textAlign='center';g.strokeStyle='#473650';g.lineWidth=3;
 g.strokeText(text,px,py);g.fillStyle='#fff8ed';g.fillText(text,px,py);
}
function draw(time){
 if(!inside)return;
 const dt=Math.min(.06,Math.max(.004,(time-last)/1000));last=time;
 const vx=Number(pressed.has('right'))-Number(pressed.has('left'));
 const vy=Number(pressed.has('down'))-Number(pressed.has('up'));
 if(!$('cc-museum-info').classList.contains('open')&&(vx||vy)){
  const k=190*dt/Math.max(1,Math.hypot(vx,vy));
  x=Math.max(32,Math.min(728,x+vx*k));y=Math.max(192,Math.min(397,y+vy*k));
 }
 px(0,0,760,420,'#f2dce8');px(0,0,760,208,'#d9c3e9');
 for(let yy=207;yy<420;yy+=40)for(let xx=0;xx<760;xx+=48)
  px(xx,yy,47,39,(Math.floor(xx/48)+Math.floor(yy/40))%2?'#ebc7ce':'#f6ded6');
 px(22,18,716,55,'#9163a5');px(36,28,688,36,'#f7d4e9');
 label('🧸 THE SQUISHEM MUSEUM 🧸',380,52,'bold 22px system-ui');
 for(let row=0;row<2;row++){
  const yy=row===0?205:325;px(20,yy-5,720,15,'#ad7797');px(20,yy+10,720,9,'#f8e8bd');
 }
 for(const [i,p] of spots.entries()){
  const d=plush.byId[p.id],got=plush.owned(d.id);
  px(p.x-52,p.y-49,104,58,'#fbeee5');px(p.x-49,p.y-45,98,51,got?'#efdced':'#ab9bac');
  if(got)art.draw(g,d.id,p.x,p.y-7,.76,time/1000);
  else{g.save();g.globalAlpha=.25;art.draw(g,d.id,p.x,p.y-7,.76,0);g.restore();label('?',p.x,p.y-39,'bold 22px system-ui')}
  label(d.name.replace(' Squishem','').slice(0,13),p.x,p.y+22,'bold 10px system-ui');
  if(!got){g.fillStyle='#42304e99';g.fillRect(p.x-28,p.y-18,56,6)}
 }
 // Curator stays in the right-hand aisle.
 g.font='42px system-ui';g.textAlign='center';g.fillText('🐱',700,321);
 label('MALLOW',700,346,'bold 11px system-ui');
 px(338,398,84,20,'#876090');label('🚪 EXIT',380,414,'bold 11px system-ui');
 const cat=core.cats[s.cat]||core.cats[0],coat=cat.coat||'#db9d5d';
 px(x-12,y-27,24,25,coat);px(x-14,y-39,28,19,coat);
 px(x-14,y-49,9,15,coat);px(x+5,y-49,9,15,coat);
 px(x-7,y-34,5,5,cat.eye||'#453b44');px(x+3,y-34,5,5,cat.eye||'#453b44');
 px(x-8,y-2,8,10,coat);px(x+3,y-2,8,10,coat);
 label('YOU',x,y-53,'bold 10px system-ui');
 const near=nearby();
 $('cc-museum-hint').textContent=near?.type==='plush'?'🐾 E · '+(plush.owned(near.id)?'Squish / Carry':'See missing plush clue'):
  near?.type==='curator'?'🐾 E · Ask Mallow for hints':near?.type==='exit'?'🐾 E · Exit Museum':
  'Walk to a Squishem shelf and press E / 🐾 to interact.';
 if(y>390&&Math.abs(x-380)<35){leave();return}
 raf=requestAnimationFrame(draw);
}
const oldDraw=core.draw;
core.draw=function(){
 oldDraw();if(inside||core.bossMode||window.catCityTagHouse?.inside||window.catCityCaveState?.().inside||
 window.catCitySquishemPlaces?.inside||$('catcity-start-menu')?.classList.contains('show'))return;
 const g=core.ctx,W=core.W,H=core.H;
 const xx=entrance.x-s.x+W/2,yy=entrance.y-s.y+H/2;
 if(xx<-85||xx>W+85||yy<-110||yy>H+90)return;
 g.save();g.translate(xx,yy);g.imageSmoothingEnabled=false;
 if(window.catCityDecor?.drawBuilding){
  // Wave 5: pixel-art museum, same footprint as before.
  window.catCityDecor.drawBuilding(g,'Squishem Museum',-62,-84,124,89,'#f5c6d8','#af78ae');
  g.fillStyle='#4d3458';g.font='bold 12px system-ui';g.textAlign='center';g.fillText('🧸 SQUISHEM',0,-52);
  window.catCitySquishemArt?.draw(g,'mochi',0,-58,.32,performance.now()/1000);
  window.catCityDecor.draw(g,'tulip',-47,4,2);window.catCityDecor.draw(g,'tulip',47,4,2);
 }else{
 g.fillStyle='#49304a55';g.fillRect(-68,-5,138,16);
 g.fillStyle='#f5c6d8';g.fillRect(-62,-82,124,87);
 g.fillStyle='#af78ae';g.beginPath();g.moveTo(-73,-80);g.lineTo(0,-116);g.lineTo(73,-80);g.fill();
 g.fillStyle='#fdf0d8';g.fillRect(-48,-67,96,25);g.fillStyle='#4d3458';g.font='bold 12px system-ui';
 g.textAlign='center';g.fillText('🧸 SQUISHEM',0,-52);
 g.fillStyle='#77528b';g.fillRect(-20,-41,40,46);g.fillStyle='#d8a6df';g.fillRect(-17,-38,34,42);
 g.font='20px system-ui';g.fillText('🧸',0,-12);g.fillText('🌷',-47,0);g.fillText('🌷',47,0);}
 if(Math.hypot(s.x-entrance.x,s.y-entrance.y)<100){
  g.fillStyle='#fff9de';g.font='bold 11px system-ui';g.strokeStyle='#3c2946';g.lineWidth=3;
  g.strokeText('E / 🐾 Enter Museum',0,24);g.fillText('E / 🐾 Enter Museum',0,24);
 }
 g.restore();
};
const previousInteract=core.interact;
core.interact=function(){
 if(inside)return interact();
 if(Math.hypot(s.x-entrance.x,s.y-entrance.y)<95&&enter())return;
 return previousInteract();
};
if($('interact'))$('interact').onclick=()=>core.interact();
const pause=$('pause-panel')?.querySelector('.cc-list');
if(pause){const b=document.createElement('button');b.id='cc-museum-open';b.textContent='🧸 Visit Squishem Museum';b.onclick=()=>{$('pause-panel')?.classList.remove('show');enter(true)};pause.prepend(b)}
window.addEventListener('catcity:adventure-action',e=>{
 if(e.detail?.item?.squishemId&&inside)updateProgress();
});
const title=$('catcity-start-menu');
if(title)new MutationObserver(()=>{if(inside&&title.classList.contains('show'))leave()}).observe(title,{attributes:true,attributeFilter:['class']});
window.catCityMuseum={enter,leave,interact,grantReward,showRewards,showCurator,spots,tiers,entrance,
 luckMultiplier:()=>Date.now()<Number(s.museumBlessingUntil||0)?1.1:1,
 get inside(){return inside},get position(){return{x,y}},
 testMove(nx,ny){x=nx;y=ny},updateProgress};
})();
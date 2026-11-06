/* Cat City Live Event Adventures: per-event challenges and earnable reward tokens.
 * No server schema changes or paid AI APIs; uses existing local/cloud save state.
 */
(()=>{'use strict';
const core=window.__catCityEngine,plush=window.catCitySquishems;
if(!core||!plush)return;
const s=core.state,$=id=>document.getElementById(id),T=core.T;
s.eventTokens=Math.max(0,Math.floor(Number(s.eventTokens)||0));
s.eventRuns=s.eventRuns&&typeof s.eventRuns==='object'?s.eventRuns:{};
s.eventPurchases=s.eventPurchases&&typeof s.eventPurchases==='object'?s.eventPurchases:{};
const specials={
 galaxy_gala:[
  {id:'stargazer',type:'pickup',target:2,title:'🌠 Collect 2 starlit gear pieces',reward:3},
  {id:'crystals',type:'mine',target:2,title:'💎 Mine 2 rocks or crystals',reward:3},
  {id:'squish',type:'squishem',key:'galaxy',target:1,title:'🧸 Find the Galaxy Squishem',reward:5}
 ],
 ghost_2_0:[
  {id:'haunted',type:'enter_event',key:'ghost',target:1,title:'👻 Enter a haunted cave',reward:3},
  {id:'skyler',type:'squishem',key:'skyler',target:1,title:'🧸 Collect the Skylar Squishem',reward:5},
  {id:'loot',type:'pickup',target:2,title:'🎁 Collect 2 pieces of biome gear',reward:3}
 ],
 pumpkin_cutie:[
  {id:'visit',type:'enter_event',key:'pumpkin',target:1,title:'🏠 Enter a bouncing pumpkin hut',reward:3},
  {id:'pumpkin',type:'squishem',key:'pumpkin',target:1,title:'🧸 Find the Pumpkin Squishem',reward:5},
  {id:'loot',type:'pickup',target:2,title:'🎃 Collect 2 pumpkin-touched items',reward:3}
 ]
};
const generic=[
 {id:'supplies',type:'pickup',target:2,title:'🎁 Pick up 2 biome items',reward:3},
 {id:'timber',type:'chop',target:2,title:'🪵 Chop 2 trees',reward:3},
 {id:'treasure',type:'chest',target:1,title:'🧰 Open a treasure chest',reward:5}
];
const goalsFor=name=>specials[name]||generic;
const live=()=>plush.activeEvent();
const runKey=e=>e.name+':'+String(e.endsAt);
function currentRun(){
 const e=live();if(!e?.name||e.name==='none')return null;
 const key=runKey(e);
 if(!s.eventRuns[key]){
  s.eventRuns[key]={name:e.name,endsAt:e.endsAt,progress:{},claimed:{}};
  const entries=Object.keys(s.eventRuns);
  if(entries.length>35)delete s.eventRuns[entries[0]];
  core.persist();
 }
 return {key,event:e,state:s.eventRuns[key],goals:goalsFor(e.name)};
}
function currentTask(){
 const run=currentRun();
 if(!run)return '';
 const task=run.goals.find(g=>!run.state.claimed[g.id]&&progressFor(run,g)<g.target);
 return task?.title||'Rewards ready · tap to claim!';
}
function progressFor(run,goal){
 let n=Number(run.state.progress[goal.id]||0);
 if(goal.type==='squishem'&&plush.owned(goal.key))n=Math.max(n,1);
 return Math.min(goal.target,n);
}
function emitProgress(type,detail={}){
 const run=currentRun();if(!run||detail.tutorial)return;
 let touched=false;
 for(const goal of run.goals){
  if(goal.type!==type||run.state.claimed[goal.id])continue;
  if(type==='squishem'&&goal.key!==detail.id)continue;
  if(type==='enter_event'&&goal.key!==detail.kind)continue;
  if(type==='pickup'&&detail.item?.type==='squishem')continue;
  if(type==='pickup'&&run.event.name==='galaxy_gala'&&!detail.item?.effects?.includes('galaxy'))continue;
  if(type==='pickup'&&run.event.name==='pumpkin_cutie'&&!detail.item?.effects?.includes('pumpkin'))continue;
  const old=progressFor(run,goal);
  if(old>=goal.target)continue;
  run.state.progress[goal.id]=Math.min(goal.target,old+1);
  touched=true;
  if(old+1===goal.target)core.note('🎪 Event challenge complete: '+goal.title+'! Claim your tokens.');
 }
 if(touched){core.persist();if(panel.classList.contains('open'))render()}
}
window.addEventListener('catcity:adventure-action',e=>{
 const d=e.detail||{},kind=d.type;
 if(kind==='pickup'||kind==='mine'||kind==='chop'||kind==='chest')emitProgress(kind,d);
 if(kind==='squishem')emitProgress('squishem',d);
 if(kind==='enter_event')emitProgress('enter_event',d);
});
function claim(id){
 const run=currentRun();if(!run)return false;
 const goal=run.goals.find(g=>g.id===id);
 if(!goal||run.state.claimed[id]||progressFor(run,goal)<goal.target)return false;
 run.state.claimed[id]=true;s.eventTokens+=goal.reward;
 s.fish=(Number(s.fish)||0)+10;core.persist();
 core.note('🎉 +'+goal.reward+' Event Tokens and +10 🐟!');render();return true;
}
const shop=[
 {id:'materials',name:'🪵 Crafting Supply Parcel',cost:3,detail:'4 wood, 4 stone and 2 steel',kind:'materials'},
 {id:'gear',name:'🌟 Event Sparkle Gear',cost:6,detail:'A unique enchanted weapon from this event',kind:'gear'},
 {id:'decor',name:'🎪 Festival Garland',cost:9,detail:'A permanent decorative garland for your collection',kind:'decor'}
];
function buy(id){
 const offer=shop.find(o=>o.id===id);if(!offer||s.eventTokens<offer.cost){
  core.note('🎟️ More Event Tokens needed. Complete event challenges!');return false;
 }
 if(offer.kind==='gear'&&window.catCityInventoryHasSpace&&!window.catCityInventoryHasSpace()){
  core.note('🎒 Inventory full. Clear a slot before buying Event Gear.');return false;
 }
 const event=live(),uniqueKey=event.name==='none'?'festival:'+id:'festival:'+runKey(event)+':'+id;
 if(offer.kind!=='materials'&&s.eventPurchases[uniqueKey]){
  core.note('🎪 Already purchased this event reward!');return false;
 }
 s.eventTokens-=offer.cost;
 if(offer.kind==='materials'){
  s.materials=s.materials||{};s.materials.wood=(s.materials.wood||0)+4;
  s.materials.stone=(s.materials.stone||0)+4;s.steel=(s.steel||0)+2;
 }else if(offer.kind==='gear'){
  const themed=event.name==='galaxy_gala'||event.name==='pumpkin_cutie'?
    (event.name==='galaxy_gala'?'🌌 Starlit':'🎃 Pumpkin'):'🎪 Festival';
  const item={id:'festival-gear:'+uniqueKey,name:themed+' Charm Blade',type:'weapon',
   rarity:'epic',color:'#ce9ef7',durability:220,maxDurability:220};
  const decorated=plush.eventItemEffect(item);
  s.adventureItems=s.adventureItems||[];s.adventureItems.push(decorated);
  window.catCityInventoryItemAdded?.(decorated);
 }else{
  s.decorUnlocked=Array.isArray(s.decorUnlocked)?s.decorUnlocked:[];
  if(!s.decorUnlocked.includes('🎪'))s.decorUnlocked.push('🎪');
 }
 if(offer.kind!=='materials')s.eventPurchases[uniqueKey]=true;
 core.persist();render();core.note('🎁 Redeemed '+offer.name+'!');return true;
}
const style=document.createElement('style');style.id='cc-events-adventure-style';
style.textContent=[
 '#cc-event-adventure{display:none;position:fixed;inset:0;z-index:8600;background:#1d1236e6;padding:8px;align-items:center;justify-content:center;touch-action:pan-y!important}',
 '#cc-event-adventure.open{display:flex}',
 '#cc-event-adventure .cc-ea-card{background:linear-gradient(155deg,#fffaec,#ede0fb);color:#3c2c50;border:3px solid #cbaadd;border-radius:17px;padding:15px;width:min(540px,97vw);max-height:87dvh;overflow-y:auto!important;-webkit-overflow-scrolling:touch;touch-action:pan-y!important;overscroll-behavior-y:contain}',
 '#cc-event-adventure h2{font:900 19px system-ui;margin:0 0 7px}',
 '#cc-event-adventure h3{margin:10px 0 5px;font:800 14px system-ui}',
 '#cc-event-adventure p{font:12px/1.5 system-ui}',
 '#cc-event-adventure .cc-ea-row{padding:8px;border:1px solid #dabfdc;border-radius:10px;margin-bottom:5px;background:#fffdf7}',
 '#cc-event-adventure .cc-ea-row strong{display:block;font-size:12px}',
 '#cc-event-adventure .cc-ea-row small{font-size:11px;color:#6e587a}',
 '#cc-event-adventure button{background:#ead1f3;color:#3c2957;border:1px solid #c5a5d5;border-radius:9px;margin:3px;padding:7px 9px;min-height:39px;font:bold 12px system-ui;touch-action:manipulation!important}',
 '#cc-event-adventure button:disabled{opacity:.5}',
 '#cc-event-adventure .cc-ea-footer{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:4px}',
 'body.cc-in-museum #cc-event-adventure{display:none!important}',
 '#cc-event-task{display:none;position:fixed;right:8px;top:calc(424px + env(safe-area-inset-top,0px));z-index:69;background:#fff0be;color:#443054;border:2px solid #d7b1e8;border-radius:11px;max-width:100px;min-height:35px;padding:6px;font:700 10px system-ui;touch-action:manipulation!important}',
 '#cc-event-task.show{display:block}',
 'body.start-menu-open #cc-event-task,body.taghouse-inside #cc-event-task,body.boss-fighting #cc-event-task{display:none!important}',
 '@media(max-width:700px), (max-height:650px){#cc-event-task{display:none!important}}'
].join('\n');document.head.append(style);
const panel=document.createElement('div');panel.id='cc-event-adventure';panel.setAttribute('role','dialog');
panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Live event objectives and rewards');
panel.innerHTML='<section class="cc-ea-card"><h2>🎪 Live Event Adventures</h2><div id="cc-ea-balance"></div><p id="cc-ea-intro"></p><h3>🎯 Event Challenges</h3><div id="cc-ea-challenges"></div><h3>🎟️ Event Token Shop</h3><div id="cc-ea-shop"></div><div class="cc-ea-footer"><button id="cc-ea-museum" type="button">🧸 Squishems</button><button id="cc-ea-board" type="button">📜 Quest Board</button><button id="cc-ea-close" type="button">✕ Close</button></div></section>';
document.body.append(panel);
const taskButton=document.createElement('button');taskButton.type='button';taskButton.id='cc-event-task';
taskButton.textContent='🎯 Event Goals';taskButton.onclick=open;document.body.append(taskButton);
function makeButton(parent,text,handler,disabled=false){
 const btn=document.createElement('button');btn.type='button';btn.textContent=text;
 btn.disabled=disabled;btn.onclick=handler;parent.append(btn);return btn;
}
function render(){
 $('cc-ea-balance').textContent='🎟️ '+s.eventTokens+' Event Tokens · 🐟 '+Math.floor(s.fish||0)+' coins';
 const run=currentRun(),intro=$('cc-ea-intro'),tasks=$('cc-ea-challenges');tasks.replaceChildren();
 if(!run){
  intro.textContent='No event is active. Start one from the Owner Admin Panel or wait for a voted event. Tokens you earned previously remain available to spend.';
  const row=document.createElement('div');row.className='cc-ea-row';row.textContent='⏳ Event challenges appear here when a live event begins.';tasks.append(row);
 }else{
  intro.textContent='🎪 '+run.event.name.replaceAll('_',' ')+' · '+Math.max(0,Math.ceil((run.event.endsAt-Date.now()/1000)/60))+' minutes remaining. Complete goals to earn tokens — your rewards stay in your save!';
  for(const goal of run.goals){
   const value=progressFor(run,goal),claimed=!!run.state.claimed[goal.id];
   const row=document.createElement('div');row.className='cc-ea-row';
   const text=document.createElement('strong');text.textContent=(claimed?'✅ ':value>=goal.target?'🎁 ':'◻ ')+goal.title;
   const sub=document.createElement('small');sub.textContent=value+'/'+goal.target+' · +'+goal.reward+' tokens and 10 🐟';row.append(text,sub);
   makeButton(row,claimed?'✓ Claimed':value>=goal.target?'🎟️ Claim Reward':'Not ready',()=>claim(goal.id),claimed||value<goal.target);
   tasks.append(row);
  }
 }
 const shopContainer=$('cc-ea-shop');shopContainer.replaceChildren();
 for(const offer of shop){
  const row=document.createElement('div');row.className='cc-ea-row';
  const title=document.createElement('strong');title.textContent=offer.name+' · '+offer.cost+' 🎟️';
  const description=document.createElement('small');description.textContent=offer.detail;row.append(title,description);
  makeButton(row,'Redeem',()=>buy(offer.id),s.eventTokens<offer.cost);
  shopContainer.append(row);
 }
}
function open(){
 $('pause-panel')?.classList.remove('show');render();panel.classList.add('open');
}
function close(){panel.classList.remove('open')}
$('cc-ea-close').onclick=close;
$('cc-ea-museum').onclick=()=>{close();window.catCitySquishems?.open()};
$('cc-ea-board').onclick=()=>{close();window.catCityQuestBoard?.open()};
panel.addEventListener('click',e=>{if(e.target===panel)close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();close()}},true);
const pause=$('pause-panel')?.querySelector('.cc-list');
if(pause){const btn=document.createElement('button');btn.textContent='🎪 Live Event Quests & Token Shop';btn.id='cc-event-adventure-open';btn.onclick=open;pause.prepend(btn)}
// Village Event Desk, near the southeast path: always available for trading
// saved tokens, even outside the timed festival.
const desk={x:31*T,y:30*T};
const oldDraw=core.draw;
core.draw=function(){
 oldDraw();
 if(core.bossMode||window.catCityMuseum?.inside||window.catCityPCHouse?.inside||window.catCitySquishemPlaces?.inside||
  window.catCityTagHouse?.inside||window.catCityCaveState?.().inside||$('catcity-start-menu')?.classList.contains('show'))return;
 const g=core.ctx,xx=desk.x-s.x+core.W/2,yy=desk.y-s.y+core.H/2;
 if(xx<-100||xx>core.W+100||yy<-90||yy>core.H+100)return;
 g.save();g.translate(xx,yy);g.imageSmoothingEnabled=false;
 // Wave 5: pixel-art event desk (a counter with a striped awning and a ticket).
 const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 P(-48,-60,96,30,'#2a1d36');P(-46,-58,92,26,'#fee6ac');for(let i=-44;i<44;i+=8)P(i,-34,4,4,'#f39ac4');
 P(-54,-36,108,4,'#2a1d36');for(let i=-52;i<52;i+=12){P(i,-32,6,10,'#ff8fb1');P(i+6,-32,6,10,'#ffffff')}P(-54,-22,108,2,'#2a1d36');
 P(-46,-20,92,38,'#2a1d36');P(-44,-18,88,34,'#8d608b');for(let y=-14;y<14;y+=6)P(-44,y,88,2,'#7a5078');P(-44,-18,88,3,'#b98ab3');
 P(-14,-12,28,18,'#2a1d36');P(-12,-10,24,14,'#ffd45c');P(-12,-4,24,2,'#e0a83a');P(-2,-10,4,14,'#e0a83a');
 g.fillStyle='#523a62';g.textAlign='center';g.font='bold 11px system-ui';g.fillText('EVENT DESK',0,-41);
 if(Math.hypot(s.x-desk.x,s.y-desk.y)<85){
  g.font='bold 11px system-ui';g.strokeStyle='#43304d';g.lineWidth=3;g.strokeText('E / 🐾 Event Rewards',0,34);g.fillStyle='#fff6dc';g.fillText('E / 🐾 Event Rewards',0,34);
 }g.restore();
};
const prevInteract=core.interact;
core.interact=function(){
 if(!window.catCityMuseum?.inside&&!window.catCitySquishemPlaces?.inside&&Math.hypot(s.x-desk.x,s.y-desk.y)<82){open();return}
 return prevInteract();
};
if($('interact'))$('interact').onclick=()=>core.interact();
function tick(){
 const active=!!currentRun();
 taskButton.classList.toggle('show',active);
 if(active)taskButton.textContent='🎟️ '+s.eventTokens+' · Event goals';
 if(panel.classList.contains('open'))render();
}
setInterval(tick,1500);tick();
const menu=$('catcity-start-menu');
if(menu)new MutationObserver(()=>{if(menu.classList.contains('show'))close()}).observe(menu,{attributes:true,attributeFilter:['class']});
window.catCityEventAdventure={open,close,claim,buy,goalsFor,progressFor,currentRun,currentTask,emitProgress,shop,desk,get tokens(){return s.eventTokens}};
})();
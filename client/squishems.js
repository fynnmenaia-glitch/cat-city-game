/* Squishems! Cat City collectible plushies with rarity, a carry slot,
 * a squeaky/squishy sound, event exclusives and original plush artwork.
 * Existing save format, multiplayer cat roles and worker AI are unchanged.
 */
(()=>{'use strict';
const core=window.__catCityEngine,art=window.catCitySquishemArt;if(!core||!art)return;
const s=core.state,$=id=>document.getElementById(id),T=core.T,CHUNK=T*24;
const catalog=[
 {id:'astro',name:'Astro Squishem',emoji:'🧡',rarity:'rare',source:'Rare woodland find',kind:'damage',power:1.10,hint:'Rare — explore the forest and look for an orange plush'},
 {id:'galaxy',name:'Galaxy Squishem',emoji:'🌌',rarity:'event',source:'Galaxy Gala only',kind:'luck',power:1.23,hint:'Only appears during 🌌 Galaxy Gala'},
 {id:'baby',name:'Baby Squishem',emoji:'👑',rarity:'exclusive',source:'Admin Abuse only',kind:'damage',power:1.27,hint:'Find Baby in the village square during Admin Abuse'},
 {id:'skyler',name:'Skylar Squishem',emoji:'👻',rarity:'event',source:'Ghost 2.0 cave only',kind:'luck',power:1.28,hint:'Enter a temporary ghost cave while Ghost 2.0 is active'},
 {id:'harley',name:'Harley Squishem',emoji:'🧶',rarity:'rare',source:'Catnip Wrangler loot only',kind:'damage',power:1.22,hint:'Defeat Wrangler camp guards and claim a rare chest reward'},
 {id:'pumpkin',name:'Pumpkin Squishem',emoji:'🎃',rarity:'event',source:'Pumpkin Cutie hut only',kind:'luck',power:1.20,hint:'Enter a temporary bouncing-pumpkin hut and find Pumpkin'},
 {id:'mochi',name:'Mochi Mallow',emoji:'🍥',rarity:'uncommon',source:'Forest or Cherry Grove',kind:'luck',power:1.06,hint:'A fluffy custom Squishem sometimes found among trees'},
 {id:'berry',name:'Berrybean',emoji:'🫐',rarity:'uncommon',source:'Marsh finds',kind:'damage',power:1.08,hint:'A purple berry plush hidden in the marsh'},
 {id:'minty',name:'Minty Purr',emoji:'🍃',rarity:'uncommon',source:'Cherry Grove finds',kind:'luck',power:1.08,hint:'A mint-green plushie hiding in blossom fields'},
 {id:'starpuff',name:'Starpuff',emoji:'🌟',rarity:'rare',source:'Flower Terrace finds',kind:'luck',power:1.12,hint:'A soft blue starry friend found in the Flower Terrace'}
];
const byId=Object.fromEntries(catalog.map(it=>[it.id,it])),names=Object.fromEntries(catalog.map(it=>[it.id,it.name]));
s.squishemOwned=Array.isArray(s.squishemOwned)?s.squishemOwned.filter(id=>byId[id]):[];
s.adventureItems=Array.isArray(s.adventureItems)?s.adventureItems:[];
if(!byId[s.squishemCarried]||!s.squishemOwned.includes(s.squishemCarried))s.squishemCarried='';
const seed=(a,b,k=0)=>{const n=Math.sin(a*127.1+b*311.7+k*53.17)*43758.5453;return n-Math.floor(n)};
function activeEvent(){
 const ev=window.catCityGetAdventureEvent?.()||window.catCityAdminEvent||{};
 return ev?.name&&ev.name!=='none'&&Number(ev.endsAt)>Date.now()/1000?ev:{name:'none',endsAt:0,luck:1};
}
const eventIs=name=>activeEvent().name===name;
const stageActive=()=>window.catCityAdminStageState?.active===true;
const owned=id=>s.squishemOwned.includes(id);
const hidden=()=>core.bossMode||window.catCityTagHouse?.inside||
  window.catCityCaveState?.().inside||window.catCityPCHouse?.inside||
  window.catCitySquishemPlaces?.inside||window.catCityMuseum?.inside||window.catCityTutorial?.active||
  $('catcity-start-menu')?.classList.contains('show');
function biome(cx,cy){
 if(cx===0&&cy===0)return 'town';
 if(cx<0&&cy>=-1&&cy<=1)return 'wild';
 const v=seed(cx,cy);return v<.17?'cherry':v>.82?'poison':v<.32?'marsh':v>.66?'moonstone':'wild';
}
function eventItemEffect(item){
 if(!item||typeof item!=='object'||item.type==='squishem')return item;
 const name=activeEvent().name;
 if(name!=='galaxy_gala'&&name!=='pumpkin_cutie')return item;
 // Only about one in five eligible items gets permanent event enchantment.
 // Use a stable item ID so reopening a menu or moving does not reroll loot.
 const signature=String(item.id||item.name||'').split('').reduce((sum,ch,i)=>sum+ch.charCodeAt(0)*(i+3),0);
 if(seed(signature,name.length,481)>=.20)return item;
 const effect=name==='galaxy_gala'?'galaxy':'pumpkin';
 const mark=effect==='galaxy'?'🌌 Starlit ':'🎃 Pumpkin-Touched ';
 if(Array.isArray(item.effects)&&item.effects.includes(effect))return item;
 return {...item,name:mark+item.name,effects:[...(item.effects||[]),effect],
   color:effect==='galaxy'?'#d8c6ff':'#ffd18a',
   maxDurability:Math.round((item.maxDurability||100)*1.12),
   durability:Math.round((item.durability||100)*1.12)};
}
window.catCitySquishemItemEffect=eventItemEffect;
function bonus(){
 const d=byId[s.squishemCarried];
 return d?{kind:d.kind,value:d.power,id:d.id,name:d.name}:{kind:'none',value:1,id:'',name:''};
}
function luckMultiplier(){return (bonus().kind==='luck'?bonus().value:1)*(window.catCityMuseum?.luckMultiplier?.()||1)}
function damageMultiplier(){return bonus().kind==='damage'?bonus().value:1}
function gearPower(item){
 if(!item?.effects)return 1;
 return item.effects.includes('galaxy')?1.13:item.effects.includes('pumpkin')?1.10:1;
}
let lastSound=0,ctxAudio=null;
function squishSound(){
 const now=performance.now();if(now-lastSound<180)return;lastSound=now;
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  if(!ctxAudio)ctxAudio=new Audio();
  if(ctxAudio.state==='suspended')ctxAudio.resume().catch(()=>{});
  const start=ctxAudio.currentTime;
  for(const [offset,freq,volume] of [[0,310,.06],[.05,455,.037]]){
   const osc=ctxAudio.createOscillator(),gain=ctxAudio.createGain();
   osc.type='sine';osc.frequency.setValueAtTime(freq,start+offset);
   osc.frequency.exponentialRampToValueAtTime(freq*.56,start+offset+.12);
   gain.gain.setValueAtTime(.0001,start+offset);
   gain.gain.exponentialRampToValueAtTime(volume,start+offset+.015);
   gain.gain.exponentialRampToValueAtTime(.0001,start+offset+.18);
   osc.connect(gain).connect(ctxAudio.destination);
   osc.start(start+offset);osc.stop(start+offset+.19);
  }
 }catch(e){/* No audio permission? Gameplay still works. */}
}
function addPlush(id,source){
 const d=byId[id];if(!d||owned(id))return false;
 if(window.catCityInventoryHasSpace&&!window.catCityInventoryHasSpace()){
  core.note('🎒 Free an Inventory slot before collecting '+d.name+'.');return false;
 }
 const item={id:'squishem:'+id,squishemId:id,name:d.emoji+' '+d.name,
  type:'squishem',rarity:d.rarity==='event'?'epic':d.rarity==='exclusive'?'impossible':d.rarity,
  color:d.rarity==='exclusive'?'#ffe9aa':'#f6c8ec',maxDurability:100,durability:100,
  bonusKind:d.kind,bonusMultiplier:d.power,from:source};
 if(!s.adventureItems.some(it=>it.id===item.id))s.adventureItems.push(item);
 s.squishemOwned.push(id);
 window.catCityInventoryItemAdded?.(item);
 if(!s.squishemCarried)s.squishemCarried=id;
 core.persist();squishSound();renderPanel();
 core.note('🧸 SQUISH! You found '+d.name+' · '+Math.round((d.power-1)*100)+'% '+d.kind+' bonus!');
 window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'pickup',item}}));
 window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'squishem',id,item}}));
 return true;
}
function carry(id){
 if(!owned(id))return false;
 s.squishemCarried=id;core.persist();squishSound();renderPanel();
 core.note('🧸 Carrying '+byId[id].name+' · +'+Math.round((byId[id].power-1)*100)+'% '+byId[id].kind+'!');
 return true;
}
function worldFinds(){
 const cx=Math.floor(s.x/CHUNK),cy=Math.floor(s.y/CHUNK),list=[];
 for(let xx=cx-1;xx<=cx+1;xx++)for(let yy=cy-1;yy<=cy+1;yy++){
  if(!xx&&!yy)continue;
  const b=biome(xx,yy);
  const opts=b==='wild'?[['astro',.055],['mochi',.20]]:
   b==='cherry'?[['minty',.20],['mochi',.15]]:
   b==='marsh'?[['berry',.21]]:
   b==='moonstone'?[['starpuff',.14]]:[];
  for(const [id,chance] of opts){
   if(owned(id)||seed(xx,yy,id.length*37)>chance)continue;
   const x=xx*CHUNK+(7+seed(xx,yy,id.length*3)*10)*T;
   const y=yy*CHUNK+(8+seed(yy,xx,id.length*5)*9)*T;
   list.push({id,x,y,label:byId[id].name,source:b+' secret spot'});
  }
 }
 if(eventIs('galaxy_gala')&&!owned('galaxy')){
  list.push({id:'galaxy',x:26*T,y:24*T,label:byId.galaxy.name,source:'Galaxy Gala'});
  // An extra Galaxy altar inside moonstone makes discovery possible beyond town.
  if(biome(cx,cy)==='moonstone'){
   list.push({id:'galaxy',x:cx*CHUNK+14*T,y:cy*CHUNK+12*T,label:byId.galaxy.name,source:'Galaxy Gala'});
  }
 }
 if(stageActive()&&!owned('baby')){
  list.push({id:'baby',x:22*T,y:17*T,label:byId.baby.name,source:'Admin Abuse'});
 }
 return list;
}
function nearest(){
 if(hidden())return null;
 let best=null,dist=72;
 for(const p of worldFinds()){
  const d=Math.hypot(s.x-p.x,s.y-p.y);
  if(d<dist){best=p;dist=d}
 }
 return best;
}
const styles=document.createElement('style');styles.id='squishem-styles';
styles.textContent=[
 '#cc-sq-collection{display:none;position:fixed;inset:0;z-index:8500;background:#160f2ddc;align-items:center;justify-content:center;padding:8px;touch-action:pan-y!important}',
 '#cc-sq-collection.open{display:flex}',
 '#cc-sq-card{background:linear-gradient(#fff9fa,#f2e4ff);border:3px solid #d2b8ed;border-radius:18px;padding:14px;width:min(580px,97vw);max-height:85dvh;min-height:0;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;scrollbar-width:thin;color:#44304f;touch-action:pan-y!important}',
 '#cc-sq-card :not(button),#cc-sq-grid .squishem-card,#cc-sq-grid .squishem-card :not(button){touch-action:pan-y!important}',
 '#cc-sq-guide{display:none;background:#fff5d8;border:2px solid #daa666;border-radius:12px;padding:10px;margin:9px 0;color:#483951;font:12px/1.5 system-ui;touch-action:pan-y!important}',
 '#cc-sq-guide.open{display:block}',
 '#cc-sq-guide strong,#cc-sq-guide p{display:block;margin:4px 0}',
 '#cc-sq-guide-actions{display:flex;flex-wrap:wrap;gap:4px}',
 '#cc-sq-card h2{margin:0 0 5px;font-size:22px;color:#573e70}#cc-sq-card p{font-size:12px;line-height:1.5}',
 '#cc-sq-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(116px,1fr));gap:8px}',
 '#cc-sq-grid .squishem-card{border:2px solid #dbc7ea;border-radius:13px;padding:8px;background:white;display:flex;flex-direction:column;align-items:center;gap:4px}',
 '#cc-sq-grid .squishem-card.collected{border-color:#a6d6a7;background:#f4fff5}',
 '#cc-sq-grid canvas{image-rendering:pixelated;width:64px;height:74px}',
 '#cc-sq-grid strong{font-size:12px;text-align:center}',
 '#cc-sq-grid small{font-size:10px;text-align:center;min-height:27px}',
 '#cc-sq-card button{min-height:38px;border-radius:10px;border:2px solid #c0b0e8;background:#e1d1f8;color:#3d2b54;padding:6px 9px;margin:2px;touch-action:manipulation!important}',
 '#cc-sq-grid button{font-size:10px;min-height:34px}',
 '#cc-sq-event{position:fixed;right:8px;top:calc(339px + env(safe-area-inset-top,0px));z-index:69;width:74px;min-height:63px;display:none;align-items:center;flex-direction:column;justify-content:center;padding:6px 3px;border:2px solid #f2ddb4;border-radius:13px;background:#44315fe8;color:#fff9e8;box-shadow:0 5px 15px #20112e66;touch-action:manipulation!important}',
 '#cc-sq-event.show{display:flex}',
 '#cc-sq-event span{font-size:27px;line-height:1.1}',
 '#cc-sq-event small{font:bold 12px/1.2 system-ui;margin-top:4px}',
 '#cc-sq-event .cc-event-activity{font:700 9px/1.2 system-ui!important;max-width:90px;overflow-wrap:anywhere;text-align:center;margin:3px 0 0}',
 '@media(min-height:650px){#cc-sq-event{min-height:73px!important;width:93px!important;max-width:93px!important}}',
 'body:has(#cc-sq-event.show) #cc-event-chip{display:none!important}',
 'body.start-menu-open #cc-sq-event,body.taghouse-inside #cc-sq-event,body.boss-fighting #cc-sq-event,body:has(#cc-sq-collection.open) #cc-sq-event{display:none!important}',
 '#cc-sq-pickup{display:none;position:fixed;z-index:70;left:50%;bottom:calc(253px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:80vw;background:#ffe6fc;border:2px solid #bd97e4;border-radius:12px;color:#493256;padding:7px;font-size:11px;font-weight:700;pointer-events:none}',
 '#cc-sq-pickup.show{display:block}',
 '@media(max-width:650px){#cc-sq-event{top:calc(339px + env(safe-area-inset-top,0px));right:7px;width:58px;min-height:58px}#cc-sq-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}#cc-sq-grid .squishem-card{padding:5px}#cc-sq-grid strong{font-size:10px}#cc-sq-grid small{font-size:9px}}'
].join('\n');document.head.append(styles);
const panel=document.createElement('div');panel.id='cc-sq-collection';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Squishem plush collection');panel.setAttribute('aria-modal','true');
panel.innerHTML='<section id="cc-sq-card"><h2>🧸 Squishems!</h2><p>Squishy collectible plushies. Carry ONE for a luck or damage boost. Press E / 🐾 to make a cute squeak! Event plushies disappear from their spawn locations when their event ends, but collected plushies stay forever.</p><p id="cc-sq-total"></p><div id="cc-sq-guide" role="status" aria-live="polite"><strong id="cc-sq-guide-title"></strong><p id="cc-sq-guide-description"></p><p id="cc-sq-guide-status"></p><div id="cc-sq-guide-actions"><button id="cc-sq-guide-track" type="button">🧭 Track location</button><button id="cc-sq-guide-dismiss" type="button">✕ Close hint</button></div></div><div id="cc-sq-grid"></div><button id="cc-sq-close">✕ Close Collection</button></section>';
document.body.append(panel);
const eventButton=document.createElement('button');eventButton.type='button';eventButton.id='cc-sq-event';eventButton.setAttribute('aria-label','Active event and countdown');document.body.append(eventButton);
const pickup=document.createElement('div');pickup.id='cc-sq-pickup';document.body.append(pickup);
const eventEmojis={fish_festival:'🐟',cherry_blossom:'🌸',moonlight_magic:'🌙',catnip_party:'🌿',starfall:'⭐',
 treasure_rain:'💰',meteor_shower:'☄️',ghost_parade:'👻',lily_bloom:'🪷',glow_mushrooms:'🍄',
 wrangler_raid:'🧶',winter_snow:'❄️',rainbow_day:'🌈',firefly_festival:'✨',
 crystal_carnival:'💎',frog_festival:'🐸',galaxy_gala:'🌌',ghost_2_0:'👻',pumpkin_cutie:'🎃'};
let lastEvent='';
function timerText(sRemaining){const seconds=Math.max(0,Math.floor(sRemaining));return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')}
function updateEvent(){
 const e=activeEvent(),remain=Number(e.endsAt)-Date.now()/1000;
 const show=e.name!=='none'&&remain>0&&!hidden();
 collectionChip.textContent='🧸 Squishems '+s.squishemOwned.length+'/'+catalog.length;
 updateTracking();
 eventButton.classList.toggle('show',show);
 if(show){
  eventButton.replaceChildren();
  const em=document.createElement('span');em.textContent=eventEmojis[e.name]||'🎪';
  const clock=document.createElement('small');clock.textContent=timerText(remain);
  const task=document.createElement('small');task.className='cc-event-activity';
  task.textContent=(window.catCityEventAdventure?.currentTask?.()||'Tap for event goals').replace(/[🎪🎯🧸🎃🌌👻⭐💎🎁🪵]/gu,'').trim().slice(0,25);
  eventButton.append(em,clock,task);eventButton.title=e.name.replaceAll('_',' ')+' · '+clock.textContent+' · '+task.textContent;
  // The event badge with its countdown is the announcement. Avoid a long
  // notification covering gameplay (or changing legacy toast geometry).
  lastEvent=e.name;
 }else if(e.name==='none')lastEvent='';
 const near=nearest();
 pickup.classList.toggle('show',!!near);
 pickup.textContent=near?'🐾 / E · Collect '+near.label:'';
}
function drawWorld(){
 if(hidden())return;
 const g=core.ctx,W=core.W,H=core.H,time=Date.now()/1000;
 g.save();g.textAlign='center';
 for(const obj of worldFinds()){
  const x=obj.x-s.x+W/2,y=obj.y-s.y+H/2;
  if(x<-65||x>W+65||y<-80||y>H+75)continue;
  g.strokeStyle='#f7ebf7';g.lineWidth=2;g.fillStyle='#744d8d7a';
  g.beginPath();g.ellipse(x,y+4,27,8,0,0,Math.PI*2);g.fill();
  art.draw(g,obj.id,x,y,1.03,time);
  g.font='bold 12px system-ui';g.strokeStyle='#392947';g.lineWidth=3;
  g.strokeText('🧸 '+obj.label,x,y-80);g.fillStyle='#fff2d7';g.fillText('🧸 '+obj.label,x,y-80);
  if(Math.hypot(s.x-obj.x,s.y-obj.y)<80){g.font='bold 10px system-ui';g.strokeText('Press E / 🐾',x,y+23);g.fillText('Press E / 🐾',x,y+23)}
 }
 if(eventIs('pumpkin_cutie')||eventIs('galaxy_gala')){
  // Event creatures bounce directly onto the biome's equipment,
  // which receives a permanent event enchantment when picked up.
  const pumpkin=eventIs('pumpkin_cutie'),near=window.catCityGetFloorLoot?.()||[];
  g.globalAlpha=.85;g.font='21px system-ui';
  for(const n of near.filter(n=>n.item?.effects?.includes(pumpkin?'pumpkin':'galaxy')).slice(0,18)){
   const tx=n.x-s.x+W/2,ty=n.y-s.y+H/2;
   if(tx<-40||tx>W+40||ty<-50||ty>H+50)continue;
   const phase=time*3+seed(n.x|0,n.y|0)*6;
   const leap=pumpkin?Math.abs(Math.sin(phase))*33:Math.abs(Math.sin(phase))*18;
   g.fillText(pumpkin?'🎃':'🌠',tx,ty-12-leap);
   if(pumpkin&&leap<5){g.font='13px system-ui';g.fillText('✨',tx+12,ty-20);g.font='21px system-ui'}
  }
  g.globalAlpha=1;
  // Pumpkins jump and land on floor items; stars shimmer on Galaxy gear.
  const isPumpkin=eventIs('pumpkin_cutie');
  for(let i=0;i<9;i++){
   const x=(i*137+time*(19+i%3*3))%(W+80)-40;
   const y=(i*89+(isPumpkin?Math.abs(Math.sin(time*3+i))*35:Math.sin(time*2+i)*25))%(H+45)+20;
   g.font=(isPumpkin?27:23)+'px system-ui';g.globalAlpha=.7;
   g.fillText(isPumpkin?'🎃':'🌟',x,y);
  }
 }
 g.restore();
}
const baseDraw=core.draw;core.draw=function(){baseDraw();drawWorld()};
const oldInteract=core.interact;
core.interact=function(){
 const n=nearest();
 if(n){addPlush(n.id,n.source);return}
 return oldInteract();
};
$('interact')?.addEventListener('click',()=>{
 if(s.squishemCarried&&!hidden())squishSound();
},false);
window.addEventListener('keydown',e=>{
 if(String(e.key||'').toLowerCase()==='e'&&!e.repeat&&s.squishemCarried&&!hidden()&&!e.target?.closest?.('input,textarea,select,[contenteditable]'))squishSound();
},true);
// Exact, usable directions for the same deterministic spawns the game draws.
let selectedGuide='',trackedId='';
const compass=(x,y)=>{
 const dx=x-s.x,dy=y-s.y;
 const choices=['E','SE','S','SW','W','NW','N','NE'];
 const angle=Math.atan2(dy,dx);
 const direction=choices[(Math.round(angle/(Math.PI/4))+8)%8];
 return direction+' · '+Math.round(Math.hypot(dx,dy)/T)+' tiles away';
};
function naturalTarget(id){
 const cx=Math.floor(s.x/CHUNK),cy=Math.floor(s.y/CHUNK);
 let closest=null,best=Infinity;
 for(let xx=cx-14;xx<=cx+14;xx++)for(let yy=cy-14;yy<=cy+14;yy++){
  if(!xx&&!yy)continue;
  const zone=biome(xx,yy);
  const pairs=zone==='wild'?[['astro',.055],['mochi',.20]]:
    zone==='cherry'?[['minty',.20],['mochi',.15]]:
    zone==='marsh'?[['berry',.21]]:
    zone==='moonstone'?[['starpuff',.14]]:[];
  for(const [name,chance] of pairs){
   if(name!==id||seed(xx,yy,id.length*37)>chance)continue;
   const x=xx*CHUNK+(7+seed(xx,yy,id.length*3)*10)*T;
   const y=yy*CHUNK+(8+seed(yy,xx,id.length*5)*9)*T;
   const dist=Math.hypot(x-s.x,y-s.y);
   if(dist<best){best=dist;closest={x,y,label:zone==='wild'?'Wild Forest':zone==='cherry'?'Cherry Grove':zone==='marsh'?'Marsh':'Flower Terrace'};}
  }
 }
 return closest;
}
function findGuide(id){
 const d=byId[id];if(!d)return null;
 let description=d.hint,status='',waypoint=null;
 switch(id){
  case 'galaxy':
   description='Start 🌌 Galaxy Gala using the owner Admin Panel → Event. Visit the glowing Galaxy altar just east of the starting village and press E / 🐾.';
   if(eventIs('galaxy_gala'))waypoint={x:26*T,y:24*T,label:'Galaxy altar'};
   else status='⏳ Galaxy Gala is not running. This exclusive Squishem cannot spawn until it starts.';
   break;
  case 'baby':
   description='Baby appears beside the village admin stage during an active 👑 Admin Abuse show. Walk close and press E / 🐾.';
   if(stageActive())waypoint={x:22*T,y:17*T,label:'Village square'};
   else status='⏳ No Admin Abuse show is active. Wait for the owner to start one.';
   break;
  case 'skyler':
   description='During 👻 Ghost 2.0, a haunted cave appears east of the village. Enter with E / 🐾, walk through the cave to Skylar, then collect. The cave disappears when the event ends.';
   if(eventIs('ghost_2_0'))waypoint={x:31*T,y:18*T,label:'Ghost 2.0 cave entrance'};
   else status='⏳ Ghost 2.0 is not running. Start the event before looking for its cave.';
   break;
  case 'pumpkin':
   description='During 🎃 Pumpkin Cutie, a pumpkin hut appears southeast of the village. Enter with E / 🐾, find Pumpkin inside and collect her before the event ends.';
   if(eventIs('pumpkin_cutie'))waypoint={x:32*T,y:26*T,label:'Pumpkin hut entrance'};
   else status='⏳ Pumpkin Cutie is not running. Start the event before looking for its hut.';
   break;
  case 'harley':
   description='Harley is loot-only: find Catnip Wrangler camps away from the village, claim their loot, and hope for the rare Harley drop. Natural Wrangler chases do not drop Harley.';
   status='🧶 Each claimed Wrangler camp has a chance to drop Harley. Explore for more camps if a chest does not contain one.';
   break;
  default:
   description=d.hint+'. Search the glowing plush on the ground in its matching biome. Stand close and press E / 🐾.';
   waypoint=naturalTarget(id);
   if(!waypoint)status='🔎 No matching ground spawn found in the surrounding explored region. Travel further into that biome and check again.';
 }
 if(owned(id))status='✅ Already collected! '+(status||'You can carry and squish this plushie in Inventory.');
 else if(waypoint)status='📍 '+waypoint.label+' — '+compass(waypoint.x,waypoint.y)+'.';
 return {id,name:d.name,description,status,waypoint,available:!!waypoint};
}
function showGuide(id){
 const detail=findGuide(id);if(!detail)return;
 selectedGuide=id;
 $('cc-sq-guide-title').textContent='🔎 How to find '+detail.name;
 $('cc-sq-guide-description').textContent=detail.description;
 $('cc-sq-guide-status').textContent=detail.status;
 const track=$('cc-sq-guide-track');
 track.disabled=!detail.available;
 track.textContent=trackedId===id?'✅ Tracking':'🧭 Track location';
 $('cc-sq-guide').classList.add('open');
 $('cc-sq-card').scrollTo({top:0,behavior:'auto'});
}
function updateTracking(){
 if(!trackedId)return;
 const guide=findGuide(trackedId);
 if(guide?.waypoint){
  const d=byId[trackedId];
  collectionChip.textContent='🧭 '+d.emoji+' '+compass(guide.waypoint.x,guide.waypoint.y);
  collectionChip.title='Tracking '+d.name;
 }else{
  // An expired event cannot leave a false arrow pointing to a deleted cave/hut.
  trackedId='';
 }
}
function renderPanel(){
 const grid=$('cc-sq-grid');if(!grid)return;
 grid.replaceChildren();
 $('cc-sq-total').textContent='Collected '+s.squishemOwned.length+' / '+catalog.length+' · Equipped: '+(byId[s.squishemCarried]?.name||'None');
 for(const d of catalog){
  const got=owned(d.id),card=document.createElement('div');card.className='squishem-card'+(got?' collected':'');
  const picture=document.createElement('canvas');picture.width=64;picture.height=74;
  const g=picture.getContext('2d');art.draw(g,d.id,32,70,1,0,true);
  if(!got){g.fillStyle='#271b327f';g.fillRect(0,0,64,74)}
  const title=document.createElement('strong');title.textContent=d.emoji+' '+d.name;
  const badge=document.createElement('small');badge.textContent=(got?'✅ OWNED · ':'🔒 '+d.source+' · ')+Math.round((d.power-1)*100)+'% '+d.kind;
  const button=document.createElement('button');button.type='button';
  button.textContent=got?(s.squishemCarried===d.id?'🧸 Squish!':'🧸 Carry & Squish'):'🔎 Where?';
  button.onclick=()=>{if(got){if(s.squishemCarried===d.id){squishSound();core.note('Squish! '+d.name+' is happy!')}else carry(d.id)}else showGuide(d.id)};
  card.append(picture,title,badge,button);grid.append(card);
 }
}
function openCollection(){
 $('pause-panel')?.classList.remove('show');
 $('cc-terraria-inventory')?.classList.remove('open');
 renderPanel();panel.classList.add('open');
}
function closeCollection(){panel.classList.remove('open')}
$('cc-sq-guide-dismiss').onclick=()=>$('cc-sq-guide').classList.remove('open');
$('cc-sq-guide-track').onclick=()=>{const detail=findGuide(selectedGuide);if(!detail?.waypoint)return;trackedId=selectedGuide;showGuide(trackedId);core.note('🧭 Tracking '+detail.name+' · '+detail.status);};
$('cc-sq-close').onclick=closeCollection;
panel.onclick=e=>{if(e.target===panel)closeCollection()};
const pause=$('pause-panel')?.querySelector('.cc-list');
if(pause){const b=document.createElement('button');b.id='cc-squishems-open';b.textContent='🧸 Squishems · Plush Collection';
 b.onclick=openCollection;pause.prepend(b)}
eventButton.onclick=()=>{if(window.catCityEventAdventure)window.catCityEventAdventure.open();else openCollection()};
// Always-visible Squishem button: players should not need to hunt through Pause.
const collectionChip=document.createElement('button');
collectionChip.type='button';collectionChip.id='cc-sq-open';
collectionChip.setAttribute('aria-label','Open Squishem plush collection');
collectionChip.textContent='🧸 Squishems';
collectionChip.onclick=openCollection;document.body.append(collectionChip);
styles.textContent += [
 '#cc-sq-open{position:fixed;top:calc(393px + env(safe-area-inset-top,0px));left:8px;z-index:67;margin:0;border:2px solid #fff7fd;border-radius:13px;background:#f7ccea;color:#443052;padding:7px 10px;min-height:36px;font:bold 12px system-ui;box-shadow:0 4px 12px #32204377;touch-action:manipulation!important}',
 'body.start-menu-open #cc-sq-open,body.taghouse-inside #cc-sq-open,body.boss-fighting #cc-sq-open,body.catcity-in-cave #cc-sq-open,body.cc-on-stage #cc-sq-open,body.cc-in-squishem-event #cc-sq-open,body:has(#cc-sq-collection.open) #cc-sq-open,body:has(#cc-terraria-inventory.open) #cc-sq-open{display:none!important}',
 '@media(max-height:650px){#cc-sq-open{display:none!important}#cc-sq-event{top:calc(116px + env(safe-area-inset-top,0px))!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;min-height:48px!important;width:66px!important}}'
].join('\n');

window.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open')){e.stopImmediatePropagation();e.preventDefault();closeCollection()}},true);
const title=$('catcity-start-menu');
if(title)new MutationObserver(()=>{if(title.classList.contains('show'))closeCollection()}).observe(title,{attributes:true,attributeFilter:['class']});
window.addEventListener('catcity:wrangler-camp-loot',e=>{
 const campId=String(e.detail?.id||'');
 if(!campId||owned('harley'))return;
 const signature=[...campId].reduce((n,ch,i)=>n+ch.charCodeAt(0)*(i+7),0);
 const v=seed(signature,campId.length,729);
 if(v<.38){addPlush('harley','Wrangler Camp '+campId)}
 else core.note('🧶 Wrangler loot claimed. Harley Squishem did not drop this time — try another camp!');
});
window.catCitySquishems={
 catalog,byId,owned,addPlush,carry,bonus,damageMultiplier,luckMultiplier,gearPower,
 eventItemEffect,activeEvent,eventIs,stageActive,draw:art.draw,squish:squishSound,
 open:openCollection,close:closeCollection,worldFinds,nearest,updateEvent,findGuide,showGuide,get trackedId(){return trackedId}
};
updateEvent();setInterval(updateEvent,700);
})();
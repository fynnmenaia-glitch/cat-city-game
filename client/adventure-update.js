/* Cat City Great Adventure, additive extension. All data uses the existing save. */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,$=id=>document.getElementById(id),CHUNK=core.T*24;
const rand=(a,b,k=0)=>{const n=Math.sin(a*127.1+b*311.7+k*53.17)*43758.5453;return n-Math.floor(n)};
const rarity=[['common','#fff',70],['uncommon','#75eaaa',18],['rare','#73beff',8],['epic','#d5a1ff',3],['legendary','#ffc16b',.7],['mythical','#ff89c7',.22],['ultra-mythical','#ef80ff',.07],['impossible','#fff0a2',.01]];
const choices={town:['Wooden Paw Sword','Cotton Hood','Wool Vest','Soft Paw Boots'],wild:['Oak Sword','Forest Helmet','Leaf Armour','Ranger Boots'],cherry:['Blossom Blade','Cherry Crown','Petal Armour','Pink Paws'],marsh:['Lily Spear','Frog Hood','Marsh Armour','Reed Paws'],moonstone:['Crystal Sabre','Amethyst Crown','Moonplate Armour','Crystal Boots'],poison:['Venom Fang','Wrangler Mask','Poison Armour','Toxic Boots']};
const biome=(cx,cy)=>{if(cx===0&&cy===0)return 'town';if(cx<0&&cy>=-1&&cy<=1)return 'wild';const v=rand(cx,cy);return v<.17?'cherry':v>.82?'poison':v<.32?'marsh':v>.66?'moonstone':'wild'};
const getBiome=()=>biome(Math.floor(s.x/CHUNK),Math.floor(s.y/CHUNK));
const typeOf=n=>/sword|blade|sabre|spear|fang/i.test(n)?'weapon':/hood|helmet|crown|mask/i.test(n)?'head':/boots|paws/i.test(n)?'paws':'body';
let active={name:'none',endsAt:0,luck:1};
const luck=()=>((active.endsAt>Date.now()/1000&&active.name!=='none'&&[1,2,4,6,8,12,16,20,24].includes(+active.luck))?+active.luck:1)*(window.catCitySquishems?.luckMultiplier()||1);
const effect=()=>active.endsAt>Date.now()/1000?active.name:'none';
const prefix=()=>effect()==='ghost_parade'?'👻 Ghost ':effect()==='starfall'?'🌟 Star ':effect()==='crystal_carnival'?'💎 Crystal ':effect()==='treasure_rain'?'💰 Treasure ':effect()==='moonlight_magic'?'🌙 Lunar ':'';
function chooseRarity(seed){const weight=rarity.map((r,i)=>r[2]*(i?Math.pow(luck(),.5+Math.min(i,6)*.14):1));let n=seed*weight.reduce((a,b)=>a+b,0);for(let i=0;i<rarity.length;i++)if((n-=weight[i])<=0)return rarity[i];return rarity[0]}
function makeItem(id,b,x,y,k){const names=choices[b]||choices.wild,r=chooseRarity(rand(x|0,y|0,k+33)),base=names[Math.floor(rand(y|0,x|0,k+38)*names.length)],tier=rarity.indexOf(r);const themed=effect()!=='none'&&rand(x|0,y|0,k+107)<.18;const item={id,name:(themed?prefix():'')+base,type:typeOf(base),rarity:r[0],color:r[1],durability:90+42*tier,maxDurability:90+42*tier};return window.catCitySquishems?.eventItemEffect(item)||item}
async function eventSync(){if(window.catCityOnlineConnected?.())return;try{const r=await fetch('/api/world-state',{cache:'no-store'});if(r.ok)active=(await r.json()).event||active}catch(e){}}
window.addEventListener('catcity:server',e=>{if(e.detail?.type==='admin_event')active=e.detail.event||active});eventSync();setInterval(eventSync,15000);
s.adventureItems=Array.isArray(s.adventureItems)?s.adventureItems:[];
s.adventurePicked=Array.isArray(s.adventurePicked)?s.adventurePicked:[];
s.adventureHotbar=Array.isArray(s.adventureHotbar)?s.adventureHotbar.slice(0,10):[];
s.adventureEquipment=s.adventureEquipment&&typeof s.adventureEquipment==='object'?s.adventureEquipment:{};
const claimed=new Set(s.adventurePicked);
function nearby(){const cx=Math.floor(s.x/CHUNK),cy=Math.floor(s.y/CHUNK),out=[];for(let ix=cx-1;ix<=cx+1;ix++)for(let iy=cy-1;iy<=cy+1;iy++){if(ix===0&&iy===0)continue;for(let k=0;k<(['treasure_rain','starfall','galaxy_gala','pumpkin_cutie'].includes(effect())?5:3);k++){if(rand(ix,iy,291+k*11)>=(k<3?.38:.20))continue;const id='floor:'+ix+':'+iy+':'+k+(k>=3?':'+effect()+':'+active.endsAt:'');if(claimed.has(id))continue;const x=(ix+(4+rand(ix,iy,k+1)*15)/24)*CHUNK,y=(iy+(4+rand(ix,iy,k+12)*15)/24)*CHUNK;out.push({id,x,y,item:makeItem(id,biome(ix,iy),x,y,k)})}}return out}
const css=document.createElement('style');css.textContent=[
'#cc-fourbar{position:fixed;bottom:calc(10px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:89;display:flex;gap:6px}',
'#cc-fourbar button{min-width:47px;width:clamp(48px,12vw,62px);height:57px;border:3px solid #f6ddad;border-radius:12px;background:#302448e8;color:white;font-size:23px;display:flex;flex-direction:column;align-items:center;justify-content:center}',
'#cc-fourbar button.selected{border-color:#ffd452;background:#685094}',
'#cc-fourbar small{font-size:9px;white-space:nowrap}',
'#cc-bag-button{position:fixed;bottom:calc(87px + env(safe-area-inset-bottom));left:8px;z-index:88;background:#e4d0fb;color:#332447;border:2px solid white;border-radius:12px;padding:10px;font-weight:900}',
'#cc-objective{position:fixed;top:132px;left:7px;z-index:83;max-width:190px;background:#302448dc;color:white;border:2px solid #f8ddb4;border-radius:12px;padding:8px;font:bold 12px/1.5 system-ui;pointer-events:none;white-space:pre-line}',
'#cc-pickup-hint{position:fixed;bottom:calc(82px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:84;background:#352448e9;color:white;border-radius:12px;padding:7px 12px;font:bold 12px system-ui;pointer-events:none}',
'#cc-adventure-bag,#cc-training{display:none;position:fixed;inset:0;z-index:7000;background:#1b1238e8;align-items:center;justify-content:center;padding:12px;overflow:auto}',
'#cc-adventure-bag.open,#cc-training.open{display:flex}',
'.cc-adventure-card{width:min(620px,96vw);max-height:86dvh;overflow:auto;background:#fff7ee;color:#352749;border:4px solid #c7afe1;border-radius:18px;padding:14px}',
'.cc-adventure-card button{background:#e0d0f6;color:#302448;border:2px solid #a48cce;border-radius:12px;padding:8px;min-height:42px;margin:4px;font-weight:800}',
'.cc-adventure-entry{padding:9px 0;border-bottom:1px solid #d5c4e2}.cc-adventure-entry small{display:block;color:#665875}',
'body.start-menu-open #cc-fourbar,body.start-menu-open #cc-bag-button,body.start-menu-open #cc-pickup-hint,body.start-menu-open #cc-objective,body.taghouse-inside #cc-fourbar,body.taghouse-inside #cc-bag-button,body.taghouse-inside #cc-pickup-hint,body.taghouse-inside #cc-objective{display:none!important}',
'@media(max-width:600px){#cc-objective{max-width:140px;top:148px;font-size:10px}#cc-bag-button{top:270px;bottom:auto;left:8px}#cc-fourbar{bottom:calc(185px + env(safe-area-inset-bottom));left:50%;display:grid;grid-template-columns:repeat(2,52px);transform:translateX(-50%)}#cc-fourbar button{width:52px;min-width:52px;height:44px;font-size:17px;padding:3px}#cc-fourbar small{font-size:8px}#cc-pickup-hint{bottom:calc(295px + env(safe-area-inset-bottom));font-size:10px}}'
].join('');document.head.append(css);
const add=(tag,id,parent=document.body)=>{const el=document.createElement(tag);el.id=id;parent.append(el);return el};
const hot=add('div','cc-fourbar'),bagButton=add('button','cc-bag-button'),objective=add('div','cc-objective'),hint=add('div','cc-pickup-hint'),bag=add('div','cc-adventure-bag'),training=add('div','cc-training');
bag.setAttribute('role','dialog');bag.setAttribute('aria-modal','true');training.setAttribute('role','dialog');training.setAttribute('aria-modal','true');
bagButton.type='button';bagButton.textContent='🎒 Backpack';
const card=document.createElement('div');card.className='cc-adventure-card';bag.append(card);
const trainCard=document.createElement('div');trainCard.className='cc-adventure-card';training.append(trainCard);
let selected=0;
const itemById=id=>s.adventureItems.find(it=>it.id===id);
function renderHot(){
 hot.replaceChildren();for(let i=0;i<4;i++){const it=itemById(s.adventureHotbar[i]),b=document.createElement('button');b.className=i===selected?'selected':'';b.type='button';b.textContent=it?(it.type==='weapon'?'⚔️':it.type==='head'?'🪖':it.type==='paws'?'🥾':'🛡️'):'＋';
 const small=document.createElement('small');small.textContent=it?it.rarity:'Slot '+(i+1);b.append(small);b.setAttribute('aria-label',it?it.name:'Empty slot '+(i+1));
 b.onclick=()=>{selected=i;renderHot();if(it){s.adventureEquipment[it.type]=it.id;core.persist();core.note('Equipped '+it.name)}else openBag()};hot.append(b)}}
function openBag(){card.replaceChildren();const title=document.createElement('h2');title.textContent='🎒 Backpack & Armour';card.append(title);
 const para=document.createElement('p');para.textContent='Items picked up from the floor or chests appear here. Choose a quick slot on the bottom bar, then add or equip an item.';card.append(para);
 const crafting=document.createElement('button');crafting.textContent='🛠️ Crafting & materials';crafting.onclick=()=>{bag.classList.remove('open');window.catCityOpenInventory?.()};card.append(crafting);
 const close=document.createElement('button');close.textContent='✕ Close';close.onclick=()=>bag.classList.remove('open');card.append(close);
 if(!s.adventureItems.length){const empty=document.createElement('p');empty.textContent='Find a glowing item in a biome and press E or 🐾 to pick it up.';card.append(empty)}
 for(const it of s.adventureItems){const row=document.createElement('div');row.className='cc-adventure-entry';const title=document.createElement('b');title.textContent=it.name+' · '+it.rarity.toUpperCase();row.append(title);
 const sub=document.createElement('small');sub.textContent='Durability '+it.durability+'/'+it.maxDurability+' · '+it.type;row.append(sub);
 const equip=document.createElement('button');equip.textContent='Equip';equip.onclick=()=>{s.adventureEquipment[it.type]=it.id;core.persist();openBag()};row.append(equip);
 const put=document.createElement('button');put.textContent='Slot '+(selected+1);put.onclick=()=>{s.adventureHotbar[selected]=it.id;core.persist();renderHot();openBag()};row.append(put);
 if(it.durability<it.maxDurability){
   const repair=document.createElement('button');repair.textContent='🛠️ Repair (2 🪵 + 2 🪨)';
   repair.disabled=(s.materials?.wood||0)<2||(s.materials?.stone||0)<2;
   repair.onclick=()=>{if((s.materials?.wood||0)<2||(s.materials?.stone||0)<2){core.note('Need 2 wood and 2 stone to repair.');return}
     s.materials.wood-=2;s.materials.stone-=2;it.durability=it.maxDurability;core.persist();
     core.note('🛠️ '+it.name+' repaired!');openBag()};
   row.append(repair);
 }
 card.append(row)}
 bag.classList.add('open')}
bagButton.onclick=openBag;bag.addEventListener('click',e=>{if(e.target===bag)bag.classList.remove('open')});
const oldSettingsButton=$('world-open-inventory');if(oldSettingsButton)oldSettingsButton.parentElement.style.display='none';
function takeNearby(){let picked=null,dist=70;for(const it of nearby()){const d=Math.hypot(s.x-it.x,s.y-it.y);if(d<dist){dist=d;picked=it}}if(!picked)return false;
 if(window.catCityInventoryHasSpace&&!window.catCityInventoryHasSpace()){core.note('🎒 Inventory full. Open it to free a slot first.');return true}
 claimed.add(picked.id);s.adventurePicked.push(picked.id);s.adventureItems.push(picked.item);
 if(s.adventureHotbar.length<10)s.adventureHotbar.push(picked.item.id);
 window.catCityInventoryItemAdded?.(picked.item);core.persist();renderHot();core.note('🎁 '+picked.item.name+' · '+picked.item.rarity.toUpperCase());
 window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'pickup',item:picked.item}}));return true}
const originalInteract=core.interact;core.interact=function(){if(!window.catCityCaveState?.().inside&&takeNearby())return;return originalInteract()};
if($('interact'))$('interact').onclick=()=>core.interact();
const beforeDraw=core.draw;core.draw=function(){beforeDraw();if(document.body.classList.contains('start-menu-open')||core.bossMode||document.body.classList.contains('taghouse-inside')||window.catCityCaveState?.().inside)return;
 const ct=core.ctx,W=core.W,H=core.H;ct.save();ct.textAlign='center';let closest=null,dist=70;
 for(const n of nearby()){const x=n.x-s.x+W/2,y=n.y-s.y+H/2;if(x<-50||x>W+50||y<-50||y>H+50)continue;
 const icon=window.catCityItemArt?.icon?.(n.item),bob=Math.round(Math.sin(Date.now()/420+n.x)*2);ct.shadowBlur=12;ct.shadowColor=n.item.color;
 if(icon){ct.imageSmoothingEnabled=false;ct.drawImage(icon,Math.round(x-16),Math.round(y-26+bob),32,32)}else{ct.font='28px system-ui';ct.fillText(n.item.type==='weapon'?'⚔️':n.item.type==='head'?'🪖':n.item.type==='paws'?'🥾':'🛡️',x,y)}ct.shadowBlur=0;
 if(n.item.effects?.includes('galaxy')||n.item.effects?.includes('pumpkin')){ct.font='20px system-ui';ct.fillText(n.item.effects.includes('galaxy')?'🌌':'🎃',x+16,y-16+Math.sin(Date.now()/350)*3)}
 ct.lineWidth=3;ct.strokeStyle='#241832';ct.font='bold 10px system-ui';ct.strokeText(n.item.name,x,y+15);ct.fillStyle='#fff';ct.fillText(n.item.name,x,y+15);
 ct.strokeText(n.item.rarity.toUpperCase(),x,y+28);ct.fillStyle=n.item.color;ct.fillText(n.item.rarity.toUpperCase(),x,y+28);
 const d=Math.hypot(s.x-n.x,s.y-n.y);if(d<dist){dist=d;closest=n}}
 ct.restore();hint.textContent=closest?'🐾 E / Paw: '+closest.item.name:''};
const originalDrawCat=core.drawCat;core.drawCat=function(x,y,cat,scale=1,flag=false){
 originalDrawCat(x,y,cat,scale,flag);if(cat!==core.cats[s.cat])return;
 const ct=core.ctx;ct.save();ct.translate(x,y);ct.scale(scale,scale);
 const equipped=t=>itemById(s.adventureEquipment[t]);const helm=equipped('head'),body=equipped('body'),paws=equipped('paws'),weapon=equipped('weapon');
 if(body){ct.fillStyle=body.color;ct.fillRect(-11,-1,22,10)}if(paws){ct.fillStyle=paws.color;ct.fillRect(-13,9,9,7);ct.fillRect(4,9,9,7)}
 if(helm){ct.fillStyle=helm.color;ct.fillRect(-14,-24,28,8)}
 if(weapon){ct.save();ct.translate(17,-8);ct.rotate(.5);ct.fillStyle='#93603f';ct.fillRect(-2,3,4,16);ct.fillStyle=weapon.color;ct.fillRect(-4,-18,8,23);ct.restore()}
 ct.restore()};
window.catCityChestReward=function(id){
 const b=getBiome(),names=choices[b]||choices.wild,loot=[];
 for(let i=0;i<(effect()==='treasure_rain'?3:2);i++){const it=makeItem('chest:'+id+':'+i,b,id.length*71+i*333,id.length*47+i*555,i+31);s.adventureItems.push(it);window.catCityInventoryItemAdded?.(it);loot.push(it.name+' ('+it.rarity+')')}
 window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'chest',chest:id}}));
 core.persist();renderHot();return loot.join(' and ')};
function closeTransient(){
 $('shop-menu')?.classList.remove('open');$('shop-toggle')?.setAttribute('aria-expanded','false');
 $('cat-menu')?.classList.remove('open');$('world-inventory')?.classList.remove('open');bag.classList.remove('open')}
const start=$('catcity-start-menu');if(start)new MutationObserver(()=>{if(start.classList.contains('show'))closeTransient()}).observe(start,{attributes:true,attributeFilter:['class']});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTransient()},true);
// The old click-through tutorial has been replaced with the interactive training island.
setInterval(()=>{if(start?.classList.contains('show')||core.bossMode){objective.textContent='';return}objective.textContent=s.adventureItems.length?'🗺️ FREE PLAY\nExplore '+({moonstone:'the Flower Terrace',wild:'the wild',town:'the village',cherry:'Cherry Grove',marsh:'Lily Marsh',poison:'the Poison Wastes'}[getBiome()]||getBiome())+'. Collect gear, mine, open chests or press Q for quests!':'🌟 OBJECTIVE\nFind glowing equipment outside the village. Walk close and press E / 🐾 to pick it up!'},1500);
const rarityPower={common:0,uncommon:1,rare:2,epic:3,legendary:4,mythical:5,'ultra-mythical':6,impossible:7,playtester:8,admin:8};
let armourHits=0;
window.catCityWeaponDamage=()=>{
 const item=itemById(s.adventureEquipment?.weapon);
 if(!item||item.durability<=0)return 1;
 return Math.min(2,1+(.08*(rarityPower[item.rarity]||0)))*(window.catCitySquishems?.gearPower(item)||1);
};
window.catCityWeaponHit=()=>{
 const item=itemById(s.adventureEquipment?.weapon);
 if(!item||item.durability<=0)return;
 item.durability=Math.max(0,item.durability-1);core.persist();
 if(!item.durability){
  delete s.adventureEquipment.weapon;core.note('⚠️ Your weapon broke. Repair it in your Backpack.');
 }
 renderHot();
};
window.catCityArmourAbsorb=()=>{
 // Armour reduces some solo boss hits and takes wear. Extra pieces improve odds.
 const worn=['head','body','paws'].map(t=>itemById(s.adventureEquipment?.[t])).filter(it=>it&&it.durability>0);
 if(!worn.length)return false;
 armourHits++;
 const power=worn.reduce((n,it)=>n+1+.12*(rarityPower[it.rarity]||0),0);
 const blocked=(armourHits%Math.max(2,Math.ceil(7/Math.max(1,power)))===0);
 const item=worn[armourHits%worn.length];
 item.durability=Math.max(0,item.durability-1);
 if(!item.durability){delete s.adventureEquipment[item.type];core.note('🛡️ '+item.name+' wore out!')}
 core.persist();if(blocked)core.note('🛡️ Armour absorbed the yarn attack!');
 return blocked;
};
window.catCityRefreshHotbar=renderHot;
window.catCityGetAdventureEvent=()=>active;
window.catCityGetFloorLoot=nearby;
renderHot();
})();
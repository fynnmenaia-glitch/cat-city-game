/* Cat City inventory rebuilt as a 10x4 Terraria-style grid, with 1–0 hotbar.
 * Existing gear, crafts, saves and cloud accounts remain compatible.
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,$=id=>document.getElementById(id);
const SLOT_COUNT=40, HOT_COUNT=10;
const icons={weapon:'⚔️',head:'🪖',body:'🛡️',paws:'🥾'};
const colors={common:'#f8f6ff',uncommon:'#86efb7',rare:'#83ccff',epic:'#dab3ff',legendary:'#ffe29b',mythical:'#ffaadf','ultra-mythical':'#eb9aff',impossible:'#fff7a4',admin:'#ffc285',playtester:'#7ff5e6',glitch:'#7ff5ff'};
s.adventureItems=Array.isArray(s.adventureItems)?s.adventureItems:[];
s.adventureEquipment=s.adventureEquipment&&typeof s.adventureEquipment==='object'?s.adventureEquipment:{};
s.terrariaSlots=Array.isArray(s.terrariaSlots)?s.terrariaSlots.slice(0,SLOT_COUNT):[];
s.terrariaSlots.length=SLOT_COUNT;
for(let i=0;i<SLOT_COUNT;i++)s.terrariaSlots[i]=typeof s.terrariaSlots[i]==='string'?s.terrariaSlots[i]:null;
s.ammoArrows=Math.max(0,Math.min(9999,Number(s.ammoArrows)||0));
let current=Math.max(0,Math.min(9,Number(s.terrariaSelected)||0)),selected=null,trashConfirmUntil=0,overflow=[];
const itemFor=id=>s.adventureItems.find(it=>it.id===id);
function reconcile(){
 const valid=new Set(s.adventureItems.map(it=>it?.id).filter(Boolean)),seen=new Set();
 for(let i=0;i<SLOT_COUNT;i++){
  const id=s.terrariaSlots[i];
  if(!id||!valid.has(id)||seen.has(id))s.terrariaSlots[i]=null;
  else seen.add(id);
 }
 // Respect the existing four-slot quick bar during the first migration.
 if(!s.terrariaMigrated){
  const old=Array.isArray(s.adventureHotbar)?s.adventureHotbar:[];
  for(let i=0;i<Math.min(4,old.length);i++){
   if(valid.has(old[i])&&!seen.has(old[i])){s.terrariaSlots[i]=old[i];seen.add(old[i])}
  }
  s.terrariaMigrated=true;
 }
 overflow=[];
 for(const it of s.adventureItems){
  if(!it?.id||seen.has(it.id))continue;
  const space=s.terrariaSlots.indexOf(null);
  if(space<0){overflow.push(it);continue}
  s.terrariaSlots[space]=it.id;seen.add(it.id);
 }
 s.adventureHotbar=s.terrariaSlots.slice(0,HOT_COUNT);
 s.terrariaSelected=current;
}
reconcile();
const style=document.createElement('style');style.id='cc-terraria-style';
style.textContent=[
 '#cc-fourbar,#cc-adventure-bag,#cc-training{display:none!important}',
 '#cc-terraria-inventory{display:none;position:fixed;inset:0;z-index:8100;background:#071b46e8;align-items:flex-start;justify-content:center;padding:max(14px,env(safe-area-inset-top)) 6px 12px;overflow:auto;touch-action:pan-y!important}',
 '#cc-terraria-inventory.open{display:flex}',
 '#cc-ti-card{--cell:clamp(27px,7.6vw,44px);width:max-content;min-width:min(98vw,430px);max-width:calc(100vw - 8px);background:linear-gradient(145deg,#10327c,#1c438e);color:#fff4db;border:3px solid #d0bbec;border-radius:15px;padding:10px;box-shadow:0 12px 35px #030b27b0;font:12px system-ui;touch-action:pan-y!important}',
 '#cc-ti-top{display:flex;align-items:center;gap:7px;margin-bottom:8px;justify-content:space-between}',
 '#cc-ti-top strong{font-size:17px;text-shadow:1px 2px #09245f}',
 '#cc-ti-top button,#cc-ti-actions button,#cc-ti-craft button{background:#2b4e9f;color:white;border:1px solid #9db8e8;border-radius:7px;padding:6px 8px;min-height:36px;margin:2px;font-size:11px}',
 '#cc-ti-board-wrap{width:100%;overflow-x:auto;touch-action:pan-x!important;overscroll-behavior:contain}',
 '#cc-ti-board{display:flex;gap:10px;align-items:flex-start;min-width:max-content}',
 '#cc-ti-grid{display:grid;grid-template-columns:repeat(10,var(--cell));grid-template-rows:repeat(4,var(--cell));gap:3px}',
 '#cc-ti-money{display:flex;gap:4px;align-items:flex-start}',
 '#cc-ti-money>div{display:grid;grid-template-columns:repeat(2,calc(var(--cell)*.84));grid-template-rows:repeat(4,calc(var(--cell)*.84));gap:3px;align-content:start}',
 '#cc-ti-money h4{grid-column:span 2;text-align:center;margin:0;font-size:10px;height:14px;line-height:14px;color:#e3dafa}',
 '#cc-ti-grid button,#cc-ti-money button,.cc-ti-trash-slot{position:relative;margin:0;padding:1px;border:2px solid #092759;background:linear-gradient(145deg,#3d5cb8,#394a9f);box-shadow:inset 0 2px #7d9ed0;min-width:0;min-height:0;color:white;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-direction:column;touch-action:manipulation!important}',
 '#cc-ti-grid button{width:var(--cell);height:var(--cell)}',
 '#cc-ti-money button{width:calc(var(--cell)*.84);height:calc(var(--cell)*.84)}',
 '#cc-ti-grid button.focused,#cc-ti-grid button:focus-visible{border-color:#fff6a5;background:#6855a8}',
 '#cc-ti-grid button.selected-hot{box-shadow:0 0 0 2px #ffce6b,inset 0 2px #9ac1ef}',
 '#cc-ti-grid button span.main-icon{font-size:clamp(14px,4.2vw,25px);line-height:1}',
 '#cc-ti-grid button small,#cc-ti-money button small{font-size:8px;line-height:1.2;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
 '#cc-ti-grid button b{position:absolute;left:2px;top:0;font-size:8px;color:#fff1bd}',
 '#cc-ti-grid button .cc-ti-durability{height:3px;bottom:1px;position:absolute;left:2px;right:2px;background:#516d9e}',
 '#cc-ti-grid button .cc-ti-durability i{height:100%;display:block;background:#83eab4}',
 '#cc-ti-lower{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:9px 0 0}',
 '#cc-ti-detail{flex:1 1 200px;min-height:54px;padding:9px;background:#0a2659c7;border-radius:9px;border:1px solid #8caad7;line-height:1.45}',
 '#cc-ti-actions{flex:1 1 200px;display:flex;flex-wrap:wrap;gap:2px;justify-content:flex-start}',
 '#cc-ti-craft{display:flex;flex-wrap:wrap;align-items:center;gap:3px;margin:7px 0 0}',
 '#cc-ti-craft summary{cursor:pointer;font-weight:700;touch-action:manipulation!important}',
 '#cc-ti-overflow{margin-top:6px;max-height:80px;overflow:auto;touch-action:pan-y!important}',
 '#cc-ti-overflow button{min-height:34px;margin:3px;background:#455a97;color:white;border:1px solid #a9bce9}',
 '#cc-hotbar-ten{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(190px + env(safe-area-inset-bottom));z-index:67;display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:2px;width:min(380px,94vw);background:#162857b5;border:1px solid #d5b7f5;border-radius:8px;padding:3px}',
 '#cc-hotbar-ten button{position:relative;padding:3px 0;margin:0;font-size:14px;min-height:33px;width:100%;border:1px solid #b1a5d9;background:#293c70;color:white;border-radius:5px;touch-action:manipulation!important}',
 '#cc-hotbar-ten button strong{font:8px system-ui;position:absolute;right:2px;top:0;color:#ffd58a}',
 '#cc-hotbar-ten button.active{background:#78569c;border-color:#ffe5a3}',
 'body.start-menu-open #cc-hotbar-ten,body.taghouse-inside #cc-hotbar-ten,body.boss-fighting #cc-hotbar-ten,body:has(#cc-terraria-inventory.open) #cc-hotbar-ten{display:none!important}',
 '@media(max-width:600px){#cc-ti-card{--cell:clamp(24px,7.05vw,31px);padding:7px}#cc-ti-board{gap:5px}#cc-ti-grid{gap:2px}#cc-ti-top strong{font-size:15px}#cc-hotbar-ten{bottom:calc(196px + env(safe-area-inset-bottom));max-width:95vw}#cc-hotbar-ten button{min-height:28px;font-size:13px}#cc-ti-lower{gap:5px}#cc-ti-detail{font-size:11px}}',
 '@media(max-height:630px){#cc-hotbar-ten{bottom:calc(142px + env(safe-area-inset-bottom))}#cc-ti-card{max-height:calc(100dvh - 20px);overflow-y:auto}}'
].join('\n');document.head.append(style);
const panel=document.createElement('div');panel.id='cc-terraria-inventory';
panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Terraria style Cat City inventory');
panel.innerHTML='<div id="cc-ti-card"><div id="cc-ti-top"><strong>🎒 Inventory</strong><span id="cc-ti-money-summary">🐟 0 coins</span><button id="cc-ti-sort" type="button">⇵ Sort</button><button id="cc-ti-close" type="button">✕ Close</button></div><div id="cc-ti-board-wrap"><div id="cc-ti-board"><div id="cc-ti-grid"></div><div id="cc-ti-money"></div></div></div><div id="cc-ti-lower"><div id="cc-ti-detail">Select an item to equip, move, repair or trash it.</div><div id="cc-ti-actions"></div></div><div id="cc-ti-craft"><details><summary>⚒️ Crafting, arrows & materials</summary><div id="cc-ti-materials"></div><button id="cc-ti-craft-arrows" type="button">🏹 Make 5 arrows (1 wood + 1 stone)</button><button id="cc-ti-old-craft" type="button">🛠️ Open Crafting Recipes</button></details></div><div id="cc-ti-overflow"></div></div>';
document.body.append(panel);
const tray=document.createElement('div');tray.id='cc-hotbar-ten';tray.setAttribute('aria-label','Ten-slot quick inventory');document.body.append(tray);
const grid=$('cc-ti-grid'),details=$('cc-ti-detail'),actions=$('cc-ti-actions');
const close=()=>{panel.classList.remove('open');selected=null;renderHotbar()};
const itemIcon=it=>it?.type==='squishem'?'🧸':it?.id==='owned:bow'?'🏹':icons[it?.type]||'🎁';
function firstEmpty(){return s.terrariaSlots.findIndex(x=>x===null)}
function persist(){s.adventureHotbar=s.terrariaSlots.slice(0,HOT_COUNT);s.terrariaSelected=current;core.persist()}
function ensureItem(it){
 if(!it?.id)return false;
 if(!s.adventureItems.some(x=>x.id===it.id))s.adventureItems.push(it);
 if(s.terrariaSlots.includes(it.id))return true;
 const index=firstEmpty();
 if(index<0){core.note('🎒 Inventory full! Open the inventory to manage your items.');return false}
 s.terrariaSlots[index]=it.id;persist();return true;
}
function syncOwnedBow(){
 if(!Array.isArray(s.owned)||!s.owned.includes('Bow'))return;
 if(s.adventureItems.some(it=>it.id==='owned:bow'))return;
 ensureItem({id:'owned:bow',name:'Adventurer Bow',type:'weapon',rarity:'common',
   color:'#f1d591',durability:220,maxDurability:220});
 core.note('🏹 Your Bow is available in Inventory. Craft arrows to use it!');
}
function pickSlot(index){
 if(selected!==null&&selected!==index){
  const a=s.terrariaSlots[selected],b=s.terrariaSlots[index];
  s.terrariaSlots[selected]=b;s.terrariaSlots[index]=a;
  selected=index;persist();
 }else if(selected===index)selected=null;
 else selected=index;
 renderAll();
}
function equip(index){
 const item=itemFor(s.terrariaSlots[index]);
 if(!item)return;
 if(!['head','body','paws','weapon'].includes(item.type))return;
 if(Number(item.durability)<=0){core.note('🛠️ Repair that item before equipping.');return}
 s.adventureEquipment[item.type]=item.id;current=Math.min(9,index);
 persist();core.note('Equipped '+item.name);
 window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'equip',item}}));
 renderAll();
}
function trash(index){
 if(!s.terrariaSlots[index])return;
 if(Date.now()>trashConfirmUntil){trashConfirmUntil=Date.now()+5000;details.textContent='🗑️ Press Trash again within 5 seconds to permanently discard this item.';return}
 const id=s.terrariaSlots[index],it=itemFor(id);
 for(const type of Object.keys(s.adventureEquipment))if(s.adventureEquipment[type]===id)delete s.adventureEquipment[type];
 s.terrariaSlots[index]=null;s.adventureItems=s.adventureItems.filter(x=>x.id!==id);
 selected=null;trashConfirmUntil=0;persist();
 core.note('🗑️ Discarded '+(it?.name||'item'));renderAll();
}
function repair(index){
 const item=itemFor(s.terrariaSlots[index]);
 if(!item||item.durability>=item.maxDurability)return;
 s.materials=s.materials||{};
 if((s.materials.wood||0)<2||(s.materials.stone||0)<2){
  core.note('Needs 2 wood and 2 stone.');return}
 s.materials.wood-=2;s.materials.stone-=2;item.durability=item.maxDurability;
 persist();core.note('🛠️ Repaired '+item.name);renderAll();
}
function makeButton(text,handler){
 const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=handler;actions.append(b);
 return b;
}
function renderSelection(){
 actions.replaceChildren();
 if(selected===null){details.textContent='Select any slot to move, equip or repair an item. Tap a second slot to swap. Desktop: 1–0 changes hotbar.';return}
 const item=itemFor(s.terrariaSlots[selected]);
 if(!item){details.textContent='Empty slot '+(selected+1)+'. Tap another occupied slot to move its item here.';return}
 const dur=Math.max(0,Number(item.durability)||0),max=Math.max(1,Number(item.maxDurability)||100);
 details.textContent=itemIcon(item)+' '+item.name+' · '+(item.rarity||'common').toUpperCase()+' · '+item.type+' · '+dur+'/'+max+' durability';
 if(item.type==='squishem'){
  const owned=window.catCitySquishems?.owned(item.squishemId);
  const carried=core.state.squishemCarried===item.squishemId;
  details.textContent='🧸 '+item.name+' · '+(owned?'Collected':'Special plush')+' · '+Math.round(((item.bonusMultiplier||1)-1)*100)+'% '+(item.bonusKind||'luck')+' bonus';
  makeButton(carried?'🫧 Squish!':'🧸 Carry & Squish',()=>{
    if(carried){window.catCitySquishems?.squish();core.note('🫧 '+item.name+' squeaks!')}
    else window.catCitySquishems?.carry(item.squishemId);
    renderAll();
  });
  makeButton('📚 All Squishems',()=>window.catCitySquishems?.open());
  return;
 }

 makeButton('⚔️ Equip',()=>equip(selected)).disabled=dur<=0;
 makeButton('🛠️ Repair',()=>repair(selected)).disabled=dur>=max;
 makeButton('🗑️ Trash',()=>trash(selected));
 if(selected>=10)makeButton('⬆️ Move to hotbar',()=>{
  const target=s.terrariaSlots.slice(0,10).findIndex(x=>!x);
  if(target<0){core.note('Tap a hotbar slot to swap with this item.');return}
  pickSlot(target);
 });
 if(s.adventureEquipment[item.type]===item.id){
  makeButton('↩ Unequip',()=>{delete s.adventureEquipment[item.type];persist();renderAll()});
 }
}
function cell(index){
 const id=s.terrariaSlots[index],it=itemFor(id),b=document.createElement('button');
 b.type='button';b.className=(selected===index?'focused ':'')+(index===current?'selected-hot':'');
 b.setAttribute('aria-label',it?'Slot '+(index+1)+', '+it.name:'Empty inventory slot '+(index+1));
 b.title=it?it.name:'Empty slot';
 if(index<10){const label=document.createElement('b');label.textContent=index===9?'0':index+1;b.append(label)}
 if(it){
  const icon=document.createElement('span');icon.className='main-icon';icon.textContent=itemIcon(it);icon.style.color=colors[it.rarity]||'#fff';b.append(icon);
  const line=document.createElement('small');line.textContent=it.rarity==='ultra-mythical'?'MYTH':(it.rarity||'item').slice(0,7);b.append(line);
  const bar=document.createElement('div');bar.className='cc-ti-durability';
  const inner=document.createElement('i');inner.style.width=(Math.max(0,(it.durability||0))/(it.maxDurability||1)*100)+'%';bar.append(inner);b.append(bar);
 }
 b.onclick=()=>pickSlot(index);
 b.draggable=!!it;
 b.ondragstart=e=>{e.dataTransfer?.setData('text/plain',String(index))};
 b.ondragover=e=>{e.preventDefault()};
 b.ondrop=e=>{e.preventDefault();const from=Number(e.dataTransfer?.getData('text/plain'));if(Number.isInteger(from)&&from>=0&&from<40){selected=from;pickSlot(index)}};
 return b;
}
function renderGrid(){
 grid.replaceChildren();for(let i=0;i<SLOT_COUNT;i++)grid.append(cell(i));
 const money=$('cc-ti-money');money.replaceChildren();
 for(const [label,values] of [
  ['Coins',[['💰',Math.floor((s.fish||0)/10000)],['🪙',Math.floor((s.fish||0)%10000/100)],
            ['🐟',Math.floor((s.fish||0)%100)],['💠',0]]],
  ['Ammo',[['🏹',s.ammoArrows||0],['•',0],['•',0],['•',0]]]
 ]){
  const col=document.createElement('div');const heading=document.createElement('h4');heading.textContent=label;col.append(heading);
  for(const [icon,count] of values){
   const b=document.createElement('button');b.disabled=true;b.setAttribute('aria-label',label+' '+count);
   b.textContent=count?icon:'';
   const small=document.createElement('small');small.textContent=count?String(count):'';
   b.append(small);col.append(b);
  }money.append(col);
 }
 const trashSlot=document.createElement('button');trashSlot.className='cc-ti-trash-slot';trashSlot.textContent='🗑️';
 trashSlot.setAttribute('aria-label','Discard selected item');
 trashSlot.style.width='calc(var(--cell)*.84)';trashSlot.style.height='calc(var(--cell)*.84)';
 trashSlot.onclick=()=>{if(selected!==null)trash(selected);else core.note('Choose an item then press Trash.')};
 money.append(trashSlot);
 $('cc-ti-money-summary').textContent='🐟 '+Math.floor(s.fish||0)+' coins';
}
function renderHotbar(){
 reconcile();tray.replaceChildren();
 for(let i=0;i<HOT_COUNT;i++){
  const it=itemFor(s.terrariaSlots[i]),b=document.createElement('button');
  b.type='button';b.className=i===current?'active':'';
  b.setAttribute('aria-label',it?'Quick slot '+(i===9?0:i+1)+' '+it.name:'Empty quick slot '+(i===9?0:i+1));
  b.textContent=it?itemIcon(it):'·';
  const n=document.createElement('strong');n.textContent=i===9?'0':i+1;b.append(n);
  b.onclick=()=>{current=i;if(it?.type==='squishem'){window.catCitySquishems?.carry(it.squishemId);renderHotbar()}else if(it)equip(i);else{renderHotbar();open()}};
  tray.append(b);
 }
}
function renderResources(){
 s.materials=s.materials||{};
 const target=$('cc-ti-materials');
 // Every material you have (always wood and stone), with its icon.
 const MAT_LABELS={wood:'🪵 Wood',stone:'🪨 Stone',iron:'⛓️ Iron',coal:'⚫ Coal',steel:'🔩 Steel',titanium:'⚙️ Titanium',crystal:'🔮 Crystal',emerald:'💚 Emerald',diamond:'💠 Diamond',amethyst:'💎 Amethyst',eligeode:'🌈 Eli-geode',
  flower:'🌼 Wildflowers',cherry:'🌸 Cherry Blossoms',lily:'🪷 Lily Petals',reed:'🌾 Reeds',frog:'🐸 Frog Moss',leaf:'🍃 Leaves',venom:'🟣 Poison Sap',catnip:'🌿 Catnip',string:'🧶 Magic String',
  rose:'🌹 Rosy Petal',bluebell:'🔔 Bluebell',sunpetal:'🌻 Sunpetal',lavender:'💜 Lavender',coconut:'🥥 Coconut Flower'};
 target.textContent=Object.entries(MAT_LABELS).filter(([k])=>k==='wood'||k==='stone'||(s.materials[k]||0)>0).map(([k,l])=>l+' '+(s.materials[k]||0)).join(' · ');
 $('cc-ti-craft-arrows').disabled=(s.materials.wood||0)<1||(s.materials.stone||0)<1;
 const over=$('cc-ti-overflow');over.replaceChildren();
 if(overflow.length){const label=document.createElement('small');label.textContent='📦 Overflow storage: '+overflow.length+' old items. Free a slot to retrieve them.';over.append(label)}
}
function renderAll(){reconcile();renderGrid();renderSelection();renderResources();renderHotbar()}
function open(){
 $('pause-panel')?.classList.remove('show');
 $('settings-panel')?.classList.remove('open');
 $('world-inventory')?.classList.remove('open');
 $('cc-adventure-bag')?.classList.remove('open');
 renderAll();panel.classList.add('open');
 window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'inventory'}}));
}
$('cc-ti-close').onclick=close;
$('cc-ti-sort').onclick=()=>{
 const filled=s.terrariaSlots.filter(Boolean);s.terrariaSlots=filled.concat(Array(SLOT_COUNT-filled.length).fill(null));
 selected=null;persist();renderAll();
};
$('cc-ti-craft-arrows').onclick=()=>{
 if((s.materials.wood||0)<1||(s.materials.stone||0)<1)return;
 s.materials.wood--;s.materials.stone--;s.ammoArrows+=5;persist();renderAll();
 core.note('🏹 Crafted 5 arrows.');window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'craft'}}));
};
$('cc-ti-old-craft').onclick=()=>{close();window.catCityOpenCrafting?.()||window.catCityOpenInventoryOriginal?.()};
panel.addEventListener('click',e=>{if(e.target===panel)close()});
const bag=$('cc-bag-button');if(bag){bag.textContent='🎒 Inventory';bag.onclick=open;}
const originalCraft=window.catCityOpenInventory;
window.catCityOpenInventoryOriginal=originalCraft;
window.catCityOpenCrafting=originalCraft;
window.catCityOpenInventory=open;
const oldSettings=$('world-open-inventory');if(oldSettings){oldSettings.parentElement.style.display='';oldSettings.onclick=open;}
const pause=$('pause-panel')?.querySelector('.cc-list');
if(pause){const btn=document.createElement('button');btn.id='cc-pause-inventory';btn.textContent='🎒 Inventory · 40 slots + Coins + Ammo';btn.onclick=open;pause.prepend(btn)}
window.catCityInventoryItemAdded=it=>{ensureItem(it);if(panel.classList.contains('open'))renderAll();else renderHotbar()};
window.catCityInventoryHasSpace=()=>{reconcile();return firstEmpty()>=0};
window.catCityRefreshHotbar=()=>{reconcile();renderHotbar();if(panel.classList.contains('open'))renderAll()};
window.catCityGetTerrariaInventory=()=>({slots:s.terrariaSlots.slice(),selected:current,items:s.adventureItems.length,arrows:s.ammoArrows});
window.catCityInventoryOpen=open;
window.addEventListener('catcity:adventure-action',e=>{
 if(['pickup','chest','lucky','craft','mine','equip'].includes(e.detail?.type)){
  reconcile();if(panel.classList.contains('open'))renderAll();else renderHotbar();
 }
});
document.addEventListener('keydown',e=>{
 if(e.target?.closest?.('input,textarea,select,[contenteditable]'))return;
 if(e.key==='Escape'&&panel.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();close();return}
 if(String(e.key||'').toLowerCase()==='i'&&!document.body.classList.contains('start-menu-open')){
  e.preventDefault();e.stopImmediatePropagation();panel.classList.contains('open')?close():open();return;
 }
 if(!document.body.classList.contains('start-menu-open')&&!panel.classList.contains('open')
  &&/^[0-9]$/.test(e.key)){
  e.preventDefault();e.stopImmediatePropagation();
  current=e.key==='0'?9:Number(e.key)-1;
  if(s.terrariaSlots[current])equip(current);else{persist();renderHotbar()}
 }
},true);
syncOwnedBow();setInterval(syncOwnedBow,2100);
renderHotbar();
})();
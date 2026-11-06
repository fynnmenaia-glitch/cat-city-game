/* Cat City: Great World & Crafting Expansion. All procedural artwork and music original. */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,ctx=core.ctx,T=core.T;
const names=['Astro','Galaxy','Baby'];
const $=id=>document.getElementById(id);
const h=(x,y,k=0)=>{const n=Math.sin(x*127.1+y*311.7+k*53.17)*43758.5453;return n-Math.floor(n)};
const chunk=24*T;
let settings={pack:'aurora',helpers:false,difficulty:'normal',menuMusic:true};
try{settings={...settings,...JSON.parse(localStorage.getItem('catcity_world_settings')||'{}')}}catch(e){}
// First release: showcase the new pack for players still using the default Cozy
// selection. Existing custom Storybook / Enhanced / Alien choices are respected.
// The flag makes this a one-time preview; later changes remain the player's choice.
try{
 if(settings.pack==='cozy'&&localStorage.getItem('catcity_aurora_atelier_intro')!=='shown'){
  settings.pack='aurora';
  localStorage.setItem('catcity_aurora_atelier_intro','shown');
  localStorage.setItem('catcity_world_settings',JSON.stringify(settings));
 }
}catch(e){}

function persistSettings(){try{localStorage.setItem('catcity_world_settings',JSON.stringify(settings))}catch(e){}}
window.catCityGraphicsPack=()=>settings.pack;
window.catCityAdventureDifficulty=()=>settings.difficulty;
window.catCityDrawGlob=(ct,x,y,scale=1)=>{
 ct.save();ct.translate(x,y);ct.scale(scale,scale);
 ct.fillStyle='#a2eb9f';ct.beginPath();ct.ellipse(0,2,13,13,0,0,Math.PI*2);ct.fill();
 ct.fillStyle='#76cf8f';ct.fillRect(-8,8,5,6);ct.fillRect(3,8,5,6);
 ct.fillStyle='#adf3e2';ct.beginPath();ct.ellipse(0,-10,14,13,0,0,7);ct.fill();
 ct.fillStyle='#8fd6a0';ct.beginPath();ct.moveTo(-12,-17);ct.lineTo(-13,-28);ct.lineTo(-2,-22);ct.moveTo(12,-17);ct.lineTo(13,-28);ct.lineTo(2,-22);ct.fill();
 ct.fillStyle='#443868';ct.fillRect(-7,-13,4,5);ct.fillRect(4,-13,4,5);
 ct.fillStyle='#e89ec1';ct.fillRect(-1,-7,3,2);ct.restore();
};
// Materials do not clutter the HUD. Everything is recorded in inventory and saved with the main game.
const ITEMS={
 flower:['🌸','Wildflowers'],wood:['🪵','Wood'],stone:['🪨','Stone'],frog:['🐸','Frog Moss'],lily:['🪷','Lily Petals'],
 leaf:['🍃','Leaves'],cherry:['🌸','Cherry Blossoms'],steel:['🔩','Steel'],titanium:['⚙️','Titanium'],
 amethyst:['💎','Amethyst'],catnip:['🌿','Catnip'],string:['🧶','Magic String'],
 venom:['🟣','Poison Sap'],coal:['⚫','Coal'],crystal:['🔮','Moon Crystal'],reed:['🌾','Reeds'],diamond:['💠','Diamond'],emerald:['💚','Emerald'],eligeode:['🌈','Eli-geode']
};
const RECIPES=[
 ['🌼 Flower Crown',{flower:4,leaf:2},'head',2],['🌸 Flower Tunic',{flower:7,leaf:3},'body',3],['🌸 Flower Paws',{flower:4,leaf:2},'paws',2],
 ['🐸 Frog Hood',{frog:4,reed:2},'head',3],['🐸 Frog Chestplate',{frog:7,reed:3},'body',4],['🐸 Frog Boots',{frog:3,reed:3},'paws',3],
 ['🪷 Lily Crown',{lily:5,flower:2},'head',4],['🪷 Lily Robe',{lily:8,flower:2},'body',5],['🪷 Lily Paws',{lily:4,reed:3},'paws',3],
 ['⚙️ Titanium Helmet',{titanium:4,steel:2},'head',7],['⚙️ Titanium Armour',{titanium:7,steel:4},'body',11],['⚙️ Titanium Paws',{titanium:4,steel:2},'paws',6],
 ['💎 Amethyst Crown',{amethyst:4,crystal:2},'head',7],['💎 Amethyst Vest',{amethyst:8,crystal:3},'body',12],['💎 Amethyst Slippers',{amethyst:4,flower:2},'paws',6],
 ['🧶 String Helmet',{string:1,steel:2},'head',10],['🧶 String Paws',{string:1,steel:2},'paws',10],
 ['🔥 Furnace',{stone:10,wood:6,coal:2},'workshop',0],['🔩 Smelt Steel',{stone:2,coal:1},'material',0]
];
s.materials=s.materials&&typeof s.materials==='object'?s.materials:{};
s.gear=Array.isArray(s.gear)?s.gear:[];
s.overhaulRewards=s.overhaulRewards&&typeof s.overhaulRewards==='object'?s.overhaulRewards:{};
s.campLoot=Array.isArray(s.campLoot)?s.campLoot:[];
s.oreDeposits=Array.isArray(s.oreDeposits)?s.oreDeposits:[];
s.equipment=s.equipment&&typeof s.equipment==='object'?s.equipment:{head:'',body:'',paws:''};
const add=(id,qty=1)=>{s.materials[id]=(s.materials[id]||0)+qty;core.persist();};
const has=(items)=>Object.entries(items).every(([k,n])=>(s.materials[k]||0)>=n);
const spend=(items)=>{for(const [k,n] of Object.entries(items))s.materials[k]-=n;core.persist();};
const stat=()=>Object.values(s.equipment).reduce((n,name)=>n+(RECIPES.find(r=>r[0]===name)?.[3]||0),0);
window.catCityArmorPoints=stat;
function rewards(){
 if(s.questStage>=3&&!s.overhaulRewards.flowers){s.overhaulRewards.flowers=true;s.gear.push('🌼 Flower Crown','🌸 Flower Tunic','🌸 Flower Paws');core.note('🌸 Quest 3 reward: Complete Flower Armour Set!');core.persist();}
 if(s.bossWon&&!s.overhaulRewards.firstBirman){s.overhaulRewards.firstBirman=true;add('titanium',3);add('amethyst',3);core.note('⚔️ First Birman defeated! +3 Titanium and +3 Amethyst. Save them for your armour!');core.persist();}
}
const style=document.createElement('style');style.id='cat-city-world-overhaul-css';style.textContent=`
#world-inventory{display:none;position:fixed;inset:0;z-index:610;background:#1c1638e9;align-items:center;justify-content:center;padding:12px;touch-action:pan-y!important}
#world-inventory.open{display:flex}#world-inventory-card{background:#fff7e9;color:#352747;border:4px solid #bda2df;border-radius:22px;width:min(610px,96vw);max-height:88dvh;overflow:auto;padding:17px;touch-action:pan-y!important;box-shadow:0 14px 44px #0c091cb0}
#world-inventory-card h2{margin:4px 0 10px}#world-inventory-card button{min-height:43px;touch-action:manipulation!important}
#world-inventory-card .resource{display:flex;justify-content:space-between;border-bottom:1px solid #ddcfea;padding:6px 3px;font-size:14px}
#world-inventory-card .recipes{display:grid;grid-template-columns:repeat(auto-fit,minmax(225px,1fr));gap:8px}
#world-inventory-card .recipe{border:2px solid #d7bce7;background:#fdf7ff;border-radius:13px;padding:10px}
#world-inventory-card .recipe button{width:100%;margin:6px 0 0;background:#c7e8d1}
#world-inventory-card .recipe button:disabled{opacity:.43;background:#e4d8e7}
#world-inventory-card nav{position:sticky;top:0;background:#fff7e9;z-index:2;display:flex;gap:4px;flex-wrap:wrap;padding:3px 0}
#world-inventory-card nav button{flex:1;margin:2px;background:#dbccf0}
#world-inventory-card nav button.chosen{background:#ffdda6}
#world-inventory-card .section{padding:10px 0}
#world-inventory-card small{color:#5f5267}
#world-inventory-card #inventory-gather{background:#b2eac8;width:100%;margin:5px 0 12px}
#setting-world-pack{width:100%;background:#fff;border:2px solid #bda2df;padding:8px;border-radius:10px;touch-action:manipulation}
#setting-world-difficulty{background:#fff;padding:7px;border-radius:10px;touch-action:manipulation}
#poison-attack{display:none;position:fixed;left:10px;right:auto;top:calc(env(safe-area-inset-top) + 270px);bottom:auto;z-index:41;width:88px;min-height:58px;border:2px solid white;border-radius:18px;background:#ec9acf;color:#3c2347;font-weight:900;touch-action:manipulation}
#poison-attack.show{display:block}body.taghouse-inside #poison-attack{display:none!important}
body.taghouse-inside #settings-panel,body.taghouse-inside #settings-control{display:none!important}
#settings-panel{scrollbar-width:thin;overscroll-behavior:contain}#settings-panel input,#settings-panel select{touch-action:manipulation!important}
.settings-world-row{padding:8px 3px;border-top:1px solid #dacde7}
.world-new-btn{background:#e1cffa;color:#342747;border-radius:10px;margin:6px 0;min-height:40px}
#taghouse-world-door{display:none!important} /* No overlapping door button; enter with paw/E or Pause → Tag House */
button:active{transform:scale(.96);filter:brightness(1.05)}button:focus-visible{outline:3px solid #fff1af;outline-offset:2px}#world-inventory button:active,#settings-panel button:active,#taghouse-scene button:active{transform:scale(.96);filter:brightness(1.05)}
`;document.head.append(style);
const setSection=document.createElement('div');setSection.id='world-settings';setSection.className='settings-section';setSection.innerHTML=`<strong>🎨 Graphics & Adventure</strong>
 <div class="settings-world-row"><label for="setting-world-pack">Graphics pack</label><select id="setting-world-pack"><option value="cozy">🏡 Cozy · Original cats</option><option value="enhanced">✨ Enhanced · Detailed scenery</option><option value="storybook">🌸 Storybook Pixel Gardens · Inspired by your screenshots</option><option value="aurora">🌌 Aurora Atelier · Original Cat City graphics</option><option value="alien">👽 Alien Cat · Glob cats</option></select><small>Aurora Atelier is the new original graphics pack: glowing trees, lanterns, moonstones and a finale stage. Switch styles any time. Cat appearances and saves remain yours.</small></div>
 <div class="settings-world-row"><label>🐾 Helper cats <input type="checkbox" id="world-helper-cats"></label><small>Other cats can follow and help gather resources. Turn off to explore alone.</small></div>
 <div class="settings-world-row"><label for="setting-world-difficulty">Adventure difficulty</label><select id="setting-world-difficulty"><option value="easy">Relaxed</option><option value="normal">Normal</option><option value="hard">Brave · Hard</option></select></div>
 <div class="settings-world-row"><button type="button" id="world-open-inventory" class="world-new-btn">🎒 Inventory, Materials & Crafting</button></div>`;
$('settings-saves')?.before(setSection);
$('setting-world-pack').value=['cozy','enhanced','storybook','aurora','alien'].includes(settings.pack)?settings.pack:'aurora';
$('setting-world-difficulty').value=['easy','normal','hard'].includes(settings.difficulty)?settings.difficulty:'normal';
$('world-helper-cats').checked=settings.helpers;
$('setting-world-pack').addEventListener('change',e=>{settings.pack=e.target.value;persistSettings();core.note('🎨 '+e.target.options[e.target.selectedIndex].text+' graphics enabled');});
$('setting-world-difficulty').addEventListener('change',e=>{settings.difficulty=e.target.value;persistSettings();});
$('world-helper-cats').addEventListener('change',e=>{settings.helpers=e.target.checked;persistSettings();const f=$('setting-cats-follow');if(f&&f.checked!==settings.helpers){f.click();}core.note(settings.helpers?'🐾 Helper cats on':'🐾 Helper cats resting at home');});
// Material inventory and equipment, intentionally absent from the main HUD.
function nearForge(){return !core.bossMode&&!window.catCityTagHouse?.inside&&Math.hypot(s.x-(34*T+16),s.y-(25*T+16))<80;}

const inv=document.createElement('div');inv.id='world-inventory';inv.setAttribute('role','dialog');inv.setAttribute('aria-modal','true');inv.setAttribute('aria-label','Cat City Inventory');
inv.innerHTML=`<div id="world-inventory-card"><nav><button id="world-tab-bag" class="chosen">🎒 Bag</button><button id="world-tab-craft">🛠️ Craft</button><button id="world-tab-gear">🛡️ Armour</button><button id="world-inv-close">✕ Close</button></nav><div id="world-inv-body"></div></div>`;document.body.append(inv);
let view='bag',lastGather=0;
function biome(){const cx=Math.floor(s.x/chunk),cy=Math.floor(s.y/chunk);if(!cx&&!cy)return 'town';if(cx<0&&cy>=-1&&cy<=1)return 'wild';const v=h(cx,cy);if(v<.17)return 'cherry';if(v>.82)return 'poison';if(v<.32)return 'marsh';if(v>.66)return 'moonstone';return 'wild';}
function harvest(){
 const now=Date.now();if(now-lastGather<5000){core.note('🌱 Give the plants a moment to recover.');return;}lastGather=now;
 const b=biome();const nearTown=b==='town';
 const drops=nearTown?{flower:2,wood:1}:b==='cherry'?{cherry:2,flower:1,wood:1}:b==='poison'?{venom:2,coal:1}:b==='marsh'?{frog:1,lily:2,reed:2}:b==='moonstone'?{flower:2,amethyst:1,stone:2,crystal:1}:{wood:2,stone:1,leaf:2};
 for(const [k,n] of Object.entries(drops))add(k,n);
 const parts=Object.keys(drops).map(k=>ITEMS[k][0]+' '+ITEMS[k][1]);core.note('🎒 Gathered: '+parts.join(', ')); renderInv();
}
function craft(recipe){const [name,cost,slot]=recipe;if(['head','body','paws'].includes(slot)&&!nearForge()){core.note('🔨 Special armour is crafted by Forge near Fishpond Park.');return;}if(!has(cost))return;
 if(slot==='material'&&!s.gear.includes('🔥 Furnace')){core.note('🔥 Make a Furnace first.');return;}
 spend(cost);
 if(slot==='material'){add('steel',1);}else if(!s.gear.includes(name)){s.gear.push(name);}else{core.note('Already crafted '+name);for(const [k,n] of Object.entries(cost))add(k,n);return;}
 core.persist();renderInv();core.note('✨ Crafted '+name+'!');
}
function renderInv(){const body=$('world-inv-body');if(!body)return;
 for(const id of ['bag','craft','gear'])$('world-tab-'+id)?.classList.toggle('chosen',id===view);
 body.replaceChildren();
 if(view==='bag'){
 const header=document.createElement('div');header.innerHTML='<h2>🎒 Materials</h2><small>These are kept in your inventory, not on the game HUD.</small>';body.append(header);
 const g=document.createElement('button');g.id='inventory-gather';g.textContent='🌱 Gather materials nearby';g.onclick=harvest;body.append(g);
 for(const [k,[icon,label]] of Object.entries(ITEMS)){if(!(s.materials[k]>0))continue;const row=document.createElement('div');row.className='resource';row.textContent=icon+' '+label+' · '+s.materials[k];body.append(row);}
 const gear=document.createElement('p');gear.textContent='🛡️ Crafted pieces: '+s.gear.length+' · Defence: '+stat();body.append(gear);
 }else if(view==='craft'){
 const title=document.createElement('h2');title.textContent=nearForge()?'🔨 Forge’s Special Armour Workshop':'🛠️ Tools & Smelting';body.append(title);
 const info=document.createElement('p');info.textContent=nearForge()?'Select an armour piece. Forge uses only the listed materials — no fish coins.':'Special armour requires a visit to Forge near Fishpond Park. You can make tools and smelt materials here.';body.append(info);
 const list=document.createElement('div');list.className='recipes';
 for(const recipe of RECIPES.filter(r=>['material','workshop'].includes(r[2])||nearForge())){const [name,cost,slot]=recipe;const el=document.createElement('div');el.className='recipe';const label=document.createElement('strong');label.textContent=name;el.append(label);
 const small=document.createElement('small');small.style.display='block';small.textContent=Object.entries(cost).map(([k,n])=>`${ITEMS[k][0]} ${n} ${ITEMS[k][1]}`).join('  ·  ');el.append(small);
 const b=document.createElement('button');b.textContent=(s.gear.includes(name)&&slot!=='material')?'Owned ✓':'Craft';b.disabled=!has(cost)||(s.gear.includes(name)&&slot!=='material');b.onclick=()=>craft(recipe);el.append(b);list.append(el);}
 body.append(list);
 }else{
 const h2=document.createElement('h2');h2.textContent='🛡️ Armour Wardrobe';body.append(h2);
 const info=document.createElement('p');info.textContent='Defence: '+stat()+' · These sets are earned and crafted using your materials.';body.append(info);
 for(const slot of ['head','body','paws']){
 const label=document.createElement('p');label.innerHTML='<strong>'+({head:'🎩 Head',body:'🦺 Body',paws:'🐾 Paws'}[slot])+'</strong>';body.append(label);
 const sel=document.createElement('select');sel.style.cssText='width:100%;padding:10px;border-radius:10px;background:white;color:#342647;touch-action:manipulation';
 const options=['',...s.gear.filter(name=>RECIPES.some(r=>r[0]===name&&r[2]===slot))];
 for(const name of options){const o=document.createElement('option');o.value=name;o.textContent=name||'None';sel.append(o);}
 sel.value=s.equipment[slot]||'';sel.onchange=()=>{s.equipment[slot]=sel.value;core.persist();renderInv();};body.append(sel);
 }
 }
}
function openInv(){view='bag';renderInv();inv.classList.add('open');$('settings-panel')?.classList.remove('open');}
$('world-open-inventory').onclick=openInv;
$('world-inv-close').onclick=()=>inv.classList.remove('open');
inv.addEventListener('click',e=>{if(e.target===inv)inv.classList.remove('open');});
for(const id of ['bag','craft','gear'])$('world-tab-'+id).onclick=()=>{view=id;renderInv();};
window.catCityOpenInventory=openInv;
window.catCityForgeNear=nearForge;
window.catCityForgeOpen=function(){if(!nearForge()){core.note('🔨 Find Forge near Fishpond Park to craft special armour.');return false;}document.getElementById('cc-npc-modal')?.classList.remove('open');document.getElementById('settings-panel')?.classList.remove('open');view='craft';renderInv();inv.classList.add('open');return true;};
// Alternate pack affects cat appearance only by explicit Alien pack selection.
const oldCat=core.drawCat;
core.drawCat=function(x,y,cat,scale=1,flag=false){if(settings.pack==='alien'){window.catCityDrawGlob(ctx,x,y,scale);return;}return oldCat(x,y,cat,scale,flag);};
// New procedural tile graphics. Original sprite cats, quests and world positions remain untouched.
// Wave 5: pixel-art biome decor (trees from nature-pixel-art.js, the rest from
// pixel-decor.js). Positions use the same hashes as the old shapes, so the
// world layout and the Wrangler camps stay where they were.
function pixelBiome(ct,area,ox,oy,cx,cy,tile){
 const D=window.catCityDecor,N=window.catCityNatureArt,items=[];
 // Never scatter biome decor over the village itself (48×35 tiles at the origin).
 const add=(x,y,fn)=>{if(x>-40&&x<48*tile+40&&y>-40&&y<35*tile+60)return;items.push([y,fn])};
 if(area==='cherry'){
  for(let j=0;j<28;j++){const x=ox+(2+h(cx*9+j,cy)*20)*tile,y=oy+(2+h(cx,cy*11+j)*20)*tile;add(x,y+37,()=>N.drawTree(ct,x,y+37,'cherry','mature',{scale:1.6}))}
  for(let j=0;j<16;j++){const x=ox+h(cx*5+j,cy*7,3)*chunk,y=oy+h(cx*7,cy*5+j,4)*chunk;add(x,y,()=>D.draw(ct,j%3?'flowerPink':'tulip',x,y,2))}
 }else if(area==='poison'){
  for(let j=0;j<30;j++){const x=ox+h(cx*13+j,cy*3)*chunk,y=oy+h(cx*3,cy*13+j)*chunk;const k=j%4;add(x,y+10,()=>D.draw(ct,k===0?'toxicShroom':k===1?'toxicPuddle':'toxicBush',x,y+10,k===1?3:2))}
  if(h(cx,cy,99)<.23){
   const campX=ox+chunk*.52,campY=oy+chunk*.49;
   add(campX,campY+86,()=>{D.draw(ct,'campTent',campX,campY+86,12);
    ct.fillStyle='#fff';ct.font='bold 17px system-ui';ct.textAlign='center';ct.lineWidth=3;ct.strokeStyle='#2a1d36';ct.strokeText('WRANGLER CAMP',campX,campY-142);ct.fillText('WRANGLER CAMP',campX,campY-142);
    if(!s.campLoot.includes(cx+','+cy))D.draw(ct,'gift',campX,campY+125,4)});
  }
 }else if(area==='marsh'){
  for(let j=0;j<18;j++){const x=ox+h(cx*13+j,cy*4)*chunk,y=oy+h(cx*4,cy*13+j)*chunk;add(x,y,()=>{D.draw(ct,'pond',x,y+14,4);if(j%3===0)D.draw(ct,'lily',x+6,y+2,2)});if(j%2)add(x,y+20,()=>D.draw(ct,'reeds',x+44,y+20,2))}
  for(let j=0;j<8;j++){const x=ox+h(cx*3+j,cy*9,5)*chunk,y=oy+h(cx*9,cy*3+j,6)*chunk;add(x,y+37,()=>N.drawTree(ct,x,y+37,'willow','mature',{scale:1.5}))}
 }else if(area==='moonstone'){
  // Flower Terrace (replaced Moonstone Hills; the internal biome key stays
  // 'moonstone' so saves, mining and Squishem spawns keep working).
  // Stepped grass ledges, dense flower beds, blossom trees and a few
  // amethyst/crystal outcrops for the forge.
  for(let r=1;r<6;r++){const ly=oy+r*chunk/6+Math.round((h(cx,cy,70+r)-.5)*40);add(ox+chunk/2,ly-9999,()=>{ct.fillStyle='#c0e7a6';ct.fillRect(ox,ly-4,chunk,4);ct.fillStyle='#8cc07d';ct.fillRect(ox,ly,chunk,4);ct.fillStyle='#a08a66';ct.fillRect(ox,ly+4,chunk,4);ct.fillStyle='#7a6a52';ct.fillRect(ox,ly+8,chunk,2);for(let k=0;k<chunk;k+=24){ct.fillStyle='#b59c74';ct.fillRect(ox+k+((r*7)%12),ly+5,6,2)}})}
  const beds=['flowerPink','flowerYellow','tulip'];
  for(let j=0;j<34;j++){const x=ox+h(cx*11+j,cy*5,14)*chunk,y=oy+h(cx*5,cy*11+j,15)*chunk;add(x,y,()=>{for(let k=0;k<5;k++)D.draw(ct,beds[(j+k)%3],x+(k%3)*12-12,y+Math.floor(k/3)*10,3)})}
  for(let j=0;j<10;j++){const x=ox+h(cx*12+j,cy)*chunk,y=oy+h(cx,cy*12+j)*chunk;add(x,y+13,()=>D.draw(ct,j%3?'bush':'crystal',x,y+13,j%3?3:3))}
  for(let j=0;j<6;j++){const x=ox+h(cx*4+j,cy*2,8)*chunk,y=oy+h(cx*2,cy*4+j,9)*chunk;add(x,y+37,()=>N.drawTree(ct,x,y+37,j%2?'cherry':'magic','mature',{scale:1.5}))}
 }else{
  for(let j=0;j<26;j++){const x=ox+h(cx*12+j,cy*3)*chunk,y=oy+h(cx*3,cy*12+j)*chunk;const sp=h(cx+j,cy,12)<.18?'pine':h(cx,cy+j,13)<.1?'autumn':'oak';add(x,y+37,()=>N.drawTree(ct,x,y+37,sp,'mature',{scale:1.6}))}
  for(let j=0;j<14;j++){const x=ox+h(cx*6+j,cy*8,7)*chunk,y=oy+h(cx*8,cy*6+j,8)*chunk;const k=j%5;add(x,y,()=>D.draw(ct,k===0?'bush':k===1?'rock':k===2?'flowerYellow':'flowerPink',x,y,2))}
 }
 items.sort((a,b)=>a[0]-b[0]);for(const [,fn] of items)fn();
}
function drawTerrain(ct,st,tile,W,H,tick){
 const camX=st.x-W/2,camY=st.y-H/2;
 const x0=Math.floor(camX/chunk)-1,x1=Math.ceil((camX+W)/chunk)+1;
 const y0=Math.floor(camY/chunk)-1,y1=Math.ceil((camY+H)/chunk)+1;
 const hi=settings.pack==='enhanced'||settings.pack==='storybook'||settings.pack==='aurora';const alien=settings.pack==='alien';
 ct.save();
 for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
 const ox=cx*chunk,oy=cy*chunk;const v=h(cx,cy);
 const area=(cx===0&&cy===0)?'town':(cx<0&&cy>=-1&&cy<=1)?'wild':v<.17?'cherry':v>.82?'poison':v<.32?'marsh':v>.66?'moonstone':'wild';
 const color={town:'#b8dbb1',cherry:'#e6c8d2',poison:'#7f9a86',marsh:'#95cdb8',moonstone:'#aaa9cf',wild:'#a7cb9a'}[area];
 const floors=window.catCityFloors;
 if(floors){floors.fill(ct,window.catCityFloorFor?.(cx,cy,area)||(area==='moonstone'?'terrace':area),ox,oy,chunk,chunk)}else{
 ct.fillStyle=alien?'#82ab9b':hi?color:({town:'#c6e5bb',cherry:'#f3dbe4',poison:'#9bb5a2',marsh:'#abdac5',moonstone:'#c5c1ea',wild:'#b6dbad'}[area]);ct.fillRect(ox,oy,chunk,chunk);}
 // Tiny natural floor texture, consistent across devices (old flat floors only).
 if(!floors)for(let i=0;i<145;i++){
  const xx=ox+h(cx*31+i,cy*7)*chunk,yy=oy+h(cx*7,cy*29+i)*chunk;
  const z=2+Math.floor(h(cx,cy,i)*4);ct.fillStyle=area==='poison'?'#c0dbb7':area==='cherry'?'#f8b8d4':area==='moonstone'?'#f5e5ff':'#f3f8c4';ct.globalAlpha=.32;ct.fillRect(xx,yy,z,z);ct.globalAlpha=1;
 }
 if(area==='town')continue;
 if(window.catCityDecor&&window.catCityNatureArt){pixelBiome(ct,area,ox,oy,cx,cy,tile)}
 else if(area==='cherry'){
  for(let j=0;j<28;j++){
   const x=ox+(2+h(cx*9+j,cy)*20)*tile,y=oy+(2+h(cx,cy*11+j)*20)*tile;
   ct.fillStyle='#8e6b77';ct.fillRect(x-5,y+14,10,28);ct.fillStyle=j%3?'#e9a6c8':'#f6c5da';ct.beginPath();ct.arc(x,y,hi?27:23,0,7);ct.fill();
   if(hi){ct.fillStyle='#ffe5ed';ct.beginPath();ct.arc(x-7,y-8,9,0,7);ct.fill();}
  }
 }else if(area==='poison'){
  for(let j=0;j<30;j++){
   let x=ox+h(cx*13+j,cy*3)*chunk,y=oy+h(cx*3,cy*13+j)*chunk;
   ct.fillStyle=j%4?'#536c58':'#9e7baf';ct.beginPath();ct.arc(x,y,13+(j%4)*3,0,7);ct.fill();
   ct.fillStyle='#bfeda6';ct.fillRect(x-3,y-3,6,6);
  }
  // Fewer Wrangler camps, avoiding a settlement in every poison biome.
  if(h(cx,cy,99)<.23){
  const campX=ox+chunk*.52,campY=oy+chunk*.49;
  ct.fillStyle='#604b59';ct.fillRect(campX-90,campY-40,180,125);
  ct.fillStyle='#9b6078';ct.beginPath();ct.moveTo(campX-110,campY-40);ct.lineTo(campX,campY-130);ct.lineTo(campX+110,campY-40);ct.closePath();ct.fill();
  ct.fillStyle='#fff4be';ct.font='26px system-ui';ct.textAlign='center';ct.fillText('🧶',campX,campY-72);
  ct.fillStyle='#fff';ct.font='bold 17px system-ui';ct.fillText('WRANGLER CAMP',campX,campY-142);
  const campId=cx+','+cy;
  if(!s.campLoot.includes(campId)){ct.font='26px system-ui';ct.fillText('🎁',campX,campY+113);}
  }
 }else if(area==='marsh'){
  for(let j=0;j<18;j++){
   const x=ox+h(cx*13+j,cy*4)*chunk,y=oy+h(cx*4,cy*13+j)*chunk;
   ct.fillStyle='#79b9bd';ct.beginPath();ct.ellipse(x,y,34,16,-.2,0,7);ct.fill();ct.fillStyle='#a2ce75';ct.beginPath();ct.ellipse(x-8,y,14,7,0,0,7);ct.fill();
   if(j%3===0){ct.font='22px system-ui';ct.fillText('🪷',x,y);}
  }
 }else if(area==='moonstone'){
  for(let j=0;j<18;j++){
   const x=ox+h(cx*12+j,cy)*chunk,y=oy+h(cx,cy*12+j)*chunk;
   ct.fillStyle='#b1a5dc';ct.beginPath();ct.moveTo(x,y-30);ct.lineTo(x-12,y+13);ct.lineTo(x+14,y+13);ct.closePath();ct.fill();
   ct.fillStyle='#f1d9ff';ct.fillRect(x-1,y-18,4,20);
  }
 }else{
  for(let j=0;j<26;j++){
   const x=ox+h(cx*12+j,cy*3)*chunk,y=oy+h(cx*3,cy*12+j)*chunk;
   ct.fillStyle='#8c7458';ct.fillRect(x-5,y+10,10,27);ct.fillStyle=j%3?'#659879':'#75ac81';ct.beginPath();ct.arc(x,y,hi?26:22,0,7);ct.fill();
  }
 }
 ct.font='bold 22px system-ui';ct.textAlign='center';ct.lineWidth=3;ct.strokeStyle='#fff9';ct.fillStyle='#44314e';
 const title={cherry:'🌸 CHERRY GROVE',poison:'☠️ POISON WASTES',marsh:'🪷 LILY MARSH',moonstone:'🌺 FLOWER TERRACE',wild:'🌲 WILDERNESS'}[area];
 ct.strokeText(title,ox+chunk/2,oy+65);ct.fillText(title,ox+chunk/2,oy+65);
 }
 // The whole village gets town grass, even where a neighbouring biome chunk overlaps it.
 if(window.catCityFloors)window.catCityFloors.fill(ct,'town',0,0,48*tile,35*tile);
 // Cozy village roads with scalloped stone borders.
 const path=(x,y,w,hh)=>{
  ct.fillStyle='#ddc2a1';ct.fillRect(x-5,y-5,w+10,hh+10);
  if(window.catCityFloors){window.catCityFloors.fill(ct,'path',x,y,w,hh);return}
  ct.fillStyle='#f5e7cd';ct.fillRect(x,y,w,hh);
  for(let i=0;i<Math.ceil(w*hh/2000);i++){const xx=x+h(i,Math.floor(x))*w,yy=y+h(i,Math.floor(y))*hh;ct.fillStyle='#d4bda3';ct.fillRect(xx,yy,Math.min(10,w/3),3);}
 };
 path(0,16*tile,48*tile,3*tile);path(16*tile,0,3*tile,35*tile);path(31*tile,0,3*tile,35*tile);
 // Vibrant houses with roofs, timber trim, windows, paths and awnings. No cat-model edits.
 const houses=[
  [5,5,8,6,'#f4b9a2','Marmalade'],[19,5,9,6,'#ceadee','Library'],[34,5,8,6,'#8fcbc5','Luna'],
  [6,22,9,6,'#edc778','Guild'],[22,22,9,6,'#a8c9f0','Cosy Home'],[35,22,8,6,'#a5d59d','Pond']
 ];
 for(const [tx,ty,tw,th,color,label] of houses){
  const x=tx*tile,y=ty*tile,w=tw*tile,hh=th*tile;
  if(window.catCityDecor?.drawBuilding){window.catCityDecor.drawBuilding(ct,label,x,y,w,hh,hi?'#ffefd9':color,hi?'#8f5fae':'#986baf');
   ct.font='bold 15px system-ui';ct.textAlign='center';ct.lineWidth=4;ct.strokeStyle='#2a1d36';ct.fillStyle='#fff6e4';ct.strokeText(label,x+w*.5,y+14);ct.fillText(label,x+w*.5,y+14);
   for(let j=0;j<6;j++)window.catCityDecor.draw(ct,j%2?'tulip':'flowerYellow',x+15+j*(w-25)/6,y+hh+22,2);
   continue;}
  ct.shadowColor=hi?'#38294b99':'#685a6f66';ct.shadowBlur=hi?15:7;ct.shadowOffsetY=9;
  ct.fillStyle=hi?'#ffefd9':color;ct.fillRect(x,y+24,w,hh-24);ct.shadowBlur=0;ct.shadowOffsetY=0;
  const roof=ct.createLinearGradient(x,y,x+w,y+55);
  roof.addColorStop(0,hi?'#8553a2':'#986baf');roof.addColorStop(.5,hi?'#be85ca':'#b48ab6');roof.addColorStop(1,hi?'#6f487e':'#855f9c');
  ct.fillStyle=roof;ct.beginPath();ct.moveTo(x-16,y+42);ct.lineTo(x+w*.5,y-29);ct.lineTo(x+w+16,y+42);ct.closePath();ct.fill();
  ct.fillStyle='#f6e6e1';ct.fillRect(x+9,y+hh-24,w-18,8);
  for(const wx of [x+33,x+w-66]){
   ct.fillStyle='#79698e';ct.fillRect(wx,y+70,34,49);ct.fillStyle='#fff1bd';ct.fillRect(wx+4,y+74,26,40);
   ct.fillStyle='#b4d1d3';ct.fillRect(wx+16,y+74,3,40);ct.fillRect(wx+4,y+92,26,3);
   ct.fillStyle='#e5d4dc';ct.fillRect(wx-5,y+114,45,7);
  }
  const doorX=x+w/2-24;ct.fillStyle='#684b71';ct.fillRect(doorX,y+hh-65,48,65);ct.fillStyle='#ab809b';ct.fillRect(doorX+6,y+hh-59,36,59);
  ct.fillStyle='#ffebb6';ct.beginPath();ct.arc(doorX+35,y+hh-30,3.5,0,7);ct.fill();
  ct.fillStyle='#6f517d';ct.font='bold 15px system-ui';ct.textAlign='center';ct.fillText(label,x+w*.5,y+14);
  for(let j=0;j<6;j++){ct.font='17px system-ui';ct.fillText(j%2?'🌷':'🌼',x+15+j*(w-25)/6,y+hh+17);}
 }
 // Scenic flowers and stepping stones outside paths, never changing the cat models.
 for(let i=0;i<54;i++){
  const x=h(i,41)*48*tile,y=h(i,23)*35*tile;if((y>15*tile&&y<20*tile)||(x>16*tile&&x<19*tile))continue;
  ct.font=(hi?22:17)+'px system-ui';ct.fillText(i%4?'✿':'🌼',x,y);
 }
 ct.restore();
}
window.catCityDrawOverhaul=drawTerrain;
// Poisons, Wrangler camps, loot and explicit attack button are available only in Poison Wastes.
let camp={id:'',guards:[],defeated:false,lastHurt:0};
const attack=document.createElement('button');attack.id='poison-attack';attack.type='button';attack.textContent='⚔️ ATTACK';document.body.append(attack);
let attackTime=0;
function campPoint(){const cx=Math.floor(s.x/chunk),cy=Math.floor(s.y/chunk);return {cx,cy,id:cx+','+cy,x:cx*chunk+chunk*.52,y:cy*chunk+chunk*.49};}
// Playtest: Wranglers now guard every part of the Poison Wastes, not only the tent camps.
function nearCamp(){if(biome()!=='poison')return false;const p=campPoint();return Math.hypot(s.x-p.x,s.y-p.y)<420;}
function syncCamp(){const p=campPoint();if(camp.id===p.id)return;
 const hp=settings.difficulty==='hard'?4:settings.difficulty==='easy'?2:3;
 camp={id:p.id,guards:[{x:p.x-62,y:p.y+48,hp},{x:p.x+63,y:p.y+49,hp}],defeated:s.campLoot.includes(p.id),lastHurt:0};
}
function attackCamp(){
 const now=Date.now();if(now-attackTime<550)return;attackTime=now;
 if(!nearCamp())return;syncCamp();const point=campPoint();
 if(camp.defeated){core.note('🎁 Camp clear! Press E to open the loot chest.');return;}
 const alive=camp.guards.filter(g=>g.hp>0);
 if(!alive.length){camp.defeated=true;return;}
 const target=alive.reduce((a,g)=>Math.hypot(s.x-g.x,s.y-g.y)<Math.hypot(s.x-a.x,s.y-a.y)?g:a,alive[0]);
 const B=window.catCityBow,bow=B?.equipped(),reach=bow?B.range:102;
 if(Math.hypot(s.x-target.x,s.y-target.y)>reach){core.note(bow?'🏹 Get within bow range of a Wrangler!':'⚔️ Move closer to a Wrangler to attack!');return;}
 if(bow){if(!B.fire())return;B.shoot(s.x,s.y,target.x,target.y-10);}
 target.hp--;const left=camp.guards.reduce((n,g)=>n+Math.max(0,g.hp),0);
 if(target.hp<=0)window.dispatchEvent(new CustomEvent('catcity:wrangler-defeated',{detail:{where:'camp'}}));window.catCitySfx?.('hit');
 core.note('⚔️ Wrangler hit! '+left+' guard health left.');
 if(left===0){camp.defeated=true;core.note('🏆 Wrangler Camp cleared! Press E near the chest to claim your loot.');}
}
attack.onclick=attackCamp;
// Computer: Space attacks the camp Wranglers too, like everywhere else (glitch report: "you can't attack on computer").
addEventListener('keydown',e=>{if(e.key!==' '||e.repeat||core.bossMode||e.target?.closest?.('input,textarea,select,[contenteditable]'))return;if(!nearCamp())return;syncCamp();if(camp.defeated)return;e.preventDefault();attackCamp()});
const originalInteract=core.interact;
core.interact=function(){
 if(nearCamp()){syncCamp();const p=campPoint();
  if(camp.defeated && Math.hypot(s.x-p.x,s.y-p.y)<155){
   if(!s.campLoot.includes(p.id)){s.campLoot.push(p.id);add('string',1);add('catnip',3);add('steel',2);add('coal',1);core.note('🎁 Camp loot: 1 Magic String, 3 Catnip, 2 Steel, 1 Coal!');
   window.dispatchEvent(new CustomEvent('catcity:wrangler-camp-loot',{detail:{id:p.id}}));core.persist();return;}
  }
  attackCamp();return;
 }
 return originalInteract();
};
const interactBtn=$('interact');if(interactBtn)interactBtn.onclick=()=>core.interact();
function drawCampGuards(ct){
 if(!nearCamp()||camp.defeated)return;syncCamp();
 for(const g of camp.guards){if(g.hp<=0)continue;
  core.drawCat(g.x,g.y,{coat:'#8064a8',belly:'#cbb8ed',eye:'#f6d591',name:'Wrangler'},1.15,false);
  ct.fillStyle='#382545';ct.font='bold 12px system-ui';ct.textAlign='center';ct.fillText('WRANGLER '+('❤'.repeat(g.hp)),g.x,g.y-31);
 }
}
const oldDrawOverhaul=window.catCityDrawOverhaul;
window.catCityDrawOverhaul=(ct,st,tile,W,H,tick)=>{oldDrawOverhaul(ct,st,tile,W,H,tick);drawCampGuards(ct);};
function tickCampCombat(){
 if(!nearCamp()||camp.defeated)return;syncCamp();
 const now=Date.now(),point=campPoint(),chase=settings.difficulty==='hard'?94:settings.difficulty==='easy'?53:70;
 for(const [i,g] of camp.guards.entries()){
  if(g.hp<=0)continue;
  const d=Math.hypot(s.x-g.x,s.y-g.y);
  // Movement now happens smoothly in moveCampGuards (playtest: Wranglers were too slow).
  if(d<25&&now-camp.lastHurt>3500){
   camp.lastHurt=now;const lost=Math.max(1,Math.round((settings.difficulty==='hard'?7:settings.difficulty==='easy'?2:4)/(1+stat()*.11)));
   s.fish=Math.max(0,(Number(s.fish)||0)-lost);core.persist();core.note('🧶 Wrangler tackled you! -'+lost+' 🐟. Strike back!');window.catCityHurt?.(1,'a Wrangler');
  }
  if(d>400){g.x+=(point.x+(i?63:-62)-g.x)*.035;g.y+=(point.y+49-g.y)*.035;}
 }
}
// AI adventure helper companions: existing following toggle and fair, periodic nearby gathering.
let nextHelper=Date.now()+17000;
function tickWorld(){
 rewards();const body=document.body;const disabled=body.classList.contains('taghouse-inside')||core.bossMode;
 attack.classList.toggle('show',!disabled&&nearCamp()&&!matchMedia('(pointer:coarse)').matches);
 if(interactBtn && !disabled)interactBtn.textContent=nearCamp()?'⚔️':'🐾';
 if(!disabled)tickCampCombat();
 if(settings.helpers&&Date.now()>nextHelper&&!disabled){nextHelper=Date.now()+17000;const b=biome();const key=b==='marsh'?'reed':b==='cherry'?'cherry':b==='poison'?'catnip':b==='moonstone'?'stone':'wood';add(key,1);core.note('🐾 Your cat helpers found 1 '+ITEMS[key][1]+'!');}
 if(!disabled)syncCamp();
}
setInterval(tickWorld,750);
// Wranglers chase smoothly at real running speed (a bit slower than you) and
// notice you from further away as soon as you're near their camp.
let lastGuardMove=performance.now();
setInterval(()=>{const now=performance.now(),dt=Math.min(.1,(now-lastGuardMove)/1000);lastGuardMove=now;
 if(core.bossMode||!nearCamp()||camp.defeated)return;syncCamp();
 const sp=settings.difficulty==='hard'?140:settings.difficulty==='easy'?85:115;
 for(const g of camp.guards){if(g.hp<=0)continue;const d=Math.hypot(s.x-g.x,s.y-g.y);if(d<320&&d>26){const st=Math.min(sp*dt,d-25);g.x+=(s.x-g.x)/d*st;g.y+=(s.y-g.y)/d*st}}
},50);
// Original procedural soundtracks: distinct cozy, adventure, menu, cherry, poison and battle themes.
// Song sequences and notes written specifically for this game; no audio or font asset downloads.
const music=$('audio-music'),vol=$('audio-volume');let audioCtx=null,master=null,sequence=0,lastTheme='',lastBeat=0,melodyBar=0;
const F={C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,G5:783.99,A5:880};
const themes={
 stage:{tempo:208,lead:[F.C5,F.E5,F.G5,F.E5,F.D5,F.C5,F.A4,F.G4,F.A4,F.C5,F.E5,F.G5,F.E5,F.D5,F.C5,F.G4],bass:[F.C4/2,F.G4/2,F.A4/2,F.F4/2]},
 menu:{tempo:460,lead:[F.C4,F.E4,F.G4,F.C5,F.G4,F.E4,F.D4,F.G4,F.E4,F.G4,F.A4,F.E5,F.D5,F.C5,F.G4,F.E4],bass:[F.C4/2,F.A4/4,F.F4/2,F.G4/2]},
 cozy:{tempo:370,lead:[F.E4,F.G4,F.C5,F.B4,F.A4,F.G4,F.E4,F.D4,F.C4,F.E4,F.G4,F.A4,F.G4,F.E4,F.D4,F.C4],bass:[F.C4/2,F.A4/4,F.F4/2,F.G4/2]},
 cottage:{tempo:440,lead:[F.G4,F.A4,F.C5,F.D5,F.C5,F.A4,F.G4,F.E4,F.F4,F.A4,F.C5,F.E5,F.D5,F.C5,F.A4,F.G4],bass:[F.F4/2,F.G4/2,F.E4/2,F.C4/2]},
 explore:{tempo:295,lead:[F.D4,F.F4,F.A4,F.G4,F.E4,F.F4,F.G4,F.A4,F.C5,F.A4,F.G4,F.F4,F.E4,F.D4,F.C4,F.E4],bass:[F.D4/2,F.G4/2,F.C4/2,F.A4/4]},
 cherry:{tempo:350,lead:[F.G4,F.C5,F.E5,F.D5,F.C5,F.A4,F.G4,F.E4,F.F4,F.A4,F.D5,F.C5,F.A4,F.G4,F.E4,F.C4],bass:[F.C4/2,F.F4/2,F.G4/2,F.E4/2]},
 poison:{tempo:270,lead:[F.C4,F.E4,F.D4,F.F4,F.E4,F.G4,F.D4,F.C4,F.D4,F.F4,F.E4,F.C4,F.G4/2,F.C4,F.D4,F.E4],bass:[F.C4/4,F.D4/4,F.F4/4,F.E4/4]},
 battle:{tempo:185,lead:[F.C4,F.G4,F.C5,F.G4,F.D4,F.A4,F.D5,F.A4,F.E4,F.B4,F.E5,F.B4,F.F4,F.C5,F.G4,F.C5],bass:[F.C4/2,F.D4/2,F.E4/2,F.G4/2]},
};
window.catCityOverhaulMusic=true;
function enableAudio(){
 if(!audioCtx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audioCtx=new C();master=audioCtx.createGain();master.gain.value=1.8;const limiter=audioCtx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=8;limiter.ratio.value=10;limiter.attack.value=.005;limiter.release.value=.18;master.connect(limiter);limiter.connect(audioCtx.destination);}
 if(audioCtx.state!=='running')audioCtx.resume().catch(()=>{});
 unlockAppleAudio();
 updateMusicLabel();
}
// iPhone / iPad: Safari mutes Web Audio music while the side silent switch is on,
// unless the page declares it is playing media. Newer iOS supports
// navigator.audioSession; older iOS needs a silent looping <audio> element.
// Both only run from a user tap (enableAudio is called from tap/key handlers).
let silentLoop=null,appleUnlocked=false;
function silentWavUrl(){
 const rate=8000,samples=rate/2,buf=new ArrayBuffer(44+samples*2),v=new DataView(buf);
 const w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};
 w(0,'RIFF');v.setUint32(4,36+samples*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);
 v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);
 v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,samples*2,true);
 return URL.createObjectURL(new Blob([buf],{type:'audio/wav'}));
}
function unlockAppleAudio(){
 if(!music?.checked)return;
 try{
  if(navigator.audioSession&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback';
  if(!appleUnlocked&&audioCtx){
   const b=audioCtx.createBuffer(1,1,22050),src=audioCtx.createBufferSource();
   src.buffer=b;src.connect(audioCtx.destination);src.start(0);appleUnlocked=true;
  }
  if(!navigator.audioSession&&/iPad|iPhone|iPod/.test(navigator.userAgent)||(!navigator.audioSession&&navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)){
   if(!silentLoop){silentLoop=document.createElement('audio');silentLoop.src=silentWavUrl();silentLoop.loop=true;silentLoop.setAttribute('playsinline','');silentLoop.setAttribute('aria-hidden','true');}
   if(silentLoop.paused)silentLoop.play().catch(()=>{});
  }
 }catch(e){}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&silentLoop&&!silentLoop.paused)silentLoop.pause()});
music?.addEventListener('change',()=>{if(!music.checked&&silentLoop&&!silentLoop.paused)silentLoop.pause()});
// Safari requires a tap to unlock Web Audio after a reload; no website can bypass this rule.
const musicRow=music?.closest('.settings-section');
const musicButton=document.createElement('button');musicButton.id='cc-resume-music';musicButton.type='button';musicButton.textContent='🎵 Enable / Resume Music';
musicButton.style.cssText='padding:10px 13px;background:#d7efcb;color:#322b3c;border:2px solid #b9d4aa;border-radius:12px;min-height:43px;touch-action:manipulation;margin:8px 2px';
musicRow?.append(musicButton);
const menuMusicButton=document.createElement('button');menuMusicButton.type='button';menuMusicButton.id='cc-title-music';menuMusicButton.textContent='🎵 Tap to hear music';
menuMusicButton.style.cssText='font-size:12px!important;padding:7px 12px!important;margin:4px auto!important;min-height:37px;touch-action:manipulation';
document.querySelector('#catcity-start-menu .title-card')?.append(menuMusicButton);
function updateMusicLabel(){const active=audioCtx?.state==='running'&&music?.checked&&Number(vol?.value)>0;
 musicButton.textContent=active?'🎶 Music playing · Tap to resume':'🎵 Enable / Resume Music';
 menuMusicButton.textContent=active?'🎶 Music enabled':'🎵 Tap to hear music';
}
function resumeFromUser(){if(music){music.checked=true;music.dispatchEvent(new Event('change',{bubbles:true}));}if(vol&&Number(vol.value)<5){vol.value=70;vol.dispatchEvent(new Event('input',{bubbles:true}));}
 enableAudio();lastBeat=0;sequence=0;updateMusicLabel();}
musicButton.onclick=resumeFromUser;menuMusicButton.onclick=resumeFromUser;
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&audioCtx&&music?.checked){enableAudio();lastBeat=0;}});
window.addEventListener('pageshow',()=>{if(audioCtx&&music?.checked){enableAudio();lastBeat=0;}});
music?.addEventListener('change',()=>{if(music.checked)enableAudio();updateMusicLabel();});
vol?.addEventListener('input',updateMusicLabel);
window.catCityMusicStatus=()=>({musicOn:!!music?.checked,volume:Number(vol?.value)||0,audioState:audioCtx?.state||'not started',theme:window.catCitySoundtrack?.theme()||currentTheme()});

document.addEventListener('pointerdown',enableAudio,{passive:true});document.addEventListener('keydown',enableAudio,{passive:true});
function playNote(freq,when,duration,gain,wave='sine'){
 if(!audioCtx||audioCtx.state!=='running'||!music?.checked||+vol.value===0)return;
 const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=wave;o.frequency.setValueAtTime(freq,when);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(gain*(+vol.value/100),when+.027);g.gain.exponentialRampToValueAtTime(.0001,when+duration);o.connect(g);g.connect(master);o.start(when);o.stop(when+duration+.04);
}
function currentTheme(){if(window.catCityAdminStageInside?.())return 'stage';if(core.bossMode)return 'battle';if($('catcity-start-menu')?.classList.contains('show'))return 'menu';if(window.catCityCaveState?.().inside)return 'cave';if(document.body.classList.contains('taghouse-inside'))return 'explore';const area=biome();if(area==='town')return Math.floor(Date.now()/110000)%2?'cozy':'cottage';if(area==='cherry')return 'cherry';if(area==='poison')return 'poison';return 'explore';}
// The new soundtrack (soundtrack.js) uses this audio context, switch and volume.
window.catCityAudio={ctx:()=>audioCtx,master:()=>master,on:()=>!!music?.checked&&Number(vol?.value)>0,volume:()=>(Number(vol?.value)||0)/100,biome:()=>biome()};
setInterval(()=>{if(window.catCitySoundtrack)return;if(document.hidden||!audioCtx||audioCtx.state!=='running'||!music?.checked)return;const th=currentTheme();if(th!==lastTheme){lastTheme=th;sequence=0;lastBeat=0;}const now=performance.now();if(now<lastBeat)return;const song=th==='cave'?themes.explore:themes[th];
 const tempo=th==='cave'?Math.round(song.tempo*1.95):song.tempo;
 lastBeat=now+tempo;const i=sequence++%song.lead.length;const when=audioCtx.currentTime+.02;
 const pitch=th==='cave'?.72:1,mainGain=th==='cave'?.20:th==='stage'?.32:th==='poison'?.16:.27;
 playNote(song.lead[i]*pitch,when,tempo/980,mainGain,th==='cave'?'triangle':th==='poison'?'triangle':'sine');
 if(i%4===0)playNote(song.bass[(i/4)%4]*pitch,when+.025,tempo/690,th==='cave'?.13:.17,'triangle');
 if(th==='cave'){playNote(song.lead[i]*pitch*.5,when+.16,tempo/920,.07,'sine');}
 else if(i%8===3)playNote(song.lead[i]*2,when+.08,tempo/1550,.07,'sine');
},60);
// Helpful menu shortcut and UI state only, no inventory resource counters in the HUD.
const banner=document.createElement('div');banner.id='catcity-world-version';banner.style.cssText='display:none';document.body.append(banner);
// Time-safe material setup for an upgraded save.
rewards();
})();

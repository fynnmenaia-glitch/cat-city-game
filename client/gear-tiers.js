/* Cat City — weapon and armour material tiers (giant update).
 *
 * Damage per hit by sword material (Sofia's design):
 *   no sword 1 · Wood 2 · Stone 3 · Iron 4 · Steel 5 · Titanium 6 ·
 *   Crystal 7 · Emerald 8 · Diamond 9 · Amethyst 10 · Eli-Geode 12 · Admin 20
 * Found (not forged) loot gets up to +20% for rarity. Older biome weapons map onto the same ladder.
 * Armour pieces use the same tiers: each worn piece adds to the chance of
 * blocking a boss hit.
 * Forge crafting (in the backpack's Crafting section): Sword, Helmet,
 * Chestplate and Boots for every material from Wood to Eli-Geode.
 * Playtester gear (15) only comes from Playtester lucky blocks.
 * Iron is a new material: mining stone sometimes gives iron too.
 *
 * API: catCityTiers.tierOf(item) · catCityHitDamage() · catCityTiers.list
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,$=id=>document.getElementById(id);
const LADDER=[
 {key:'wood',name:'Wood',dmg:2,rarity:'common'},
 {key:'stone',name:'Stone',dmg:3,rarity:'common'},
 {key:'iron',name:'Iron',dmg:4,rarity:'uncommon'},
 {key:'steel',name:'Steel',dmg:5,rarity:'uncommon'},
 {key:'glitched',name:'Glitched',dmg:5,rarity:'glitch'},
 {key:'titanium',name:'Titanium',dmg:6,rarity:'rare'},
 {key:'crystal',name:'Crystal',dmg:7,rarity:'rare'},
 {key:'emerald',name:'Emerald',dmg:8,rarity:'epic'},
 {key:'diamond',name:'Diamond',dmg:9,rarity:'epic'},
 {key:'amethyst',name:'Amethyst',dmg:10,rarity:'legendary'},
 {key:'eligeode',name:'Eli-Geode',dmg:12,rarity:'mythical'},
 {key:'playtester',name:'Playtester',dmg:15,rarity:'playtester'},
 {key:'admin',name:'Admin',dmg:20,rarity:'admin'}
];
const BY=Object.fromEntries(LADDER.map((t,i)=>[t.key,{...t,index:i}]));
// Name keywords → tier. Material words first, then older biome gear.
const WORDS=[
 [/admin/i,'admin'],[/glitch/i,'glitched'],[/playtester/i,'playtester'],[/eli-?geode/i,'eligeode'],[/amethyst/i,'amethyst'],[/diamond/i,'diamond'],[/emerald/i,'emerald'],
 [/crystal|moon/i,'crystal'],[/titanium/i,'titanium'],[/steel/i,'steel'],[/iron/i,'iron'],[/stone/i,'stone'],
 [/treasure|festival|star|legendary/i,'titanium'],[/venom|poison|toxic|wrangler/i,'steel'],
 [/lily|marsh|reed|frog/i,'iron'],[/cherry|blossom|petal|pink/i,'stone'],
 [/wood|wooden|paw|training|oak|timber|cotton|wool|cloth|soft|leaf|forest|ranger|flower/i,'wood']
];
function tierOf(item){
 if(!item)return null;if(item.tier&&BY[item.tier])return BY[item.tier];
 if(item.rarity==='admin')return BY.admin;
 const n=String(item.name||'');for(const [rx,k] of WORDS)if(rx.test(n))return BY[k];
 return BY.wood;
}
const RARITY={common:0,uncommon:1,rare:2,epic:3,legendary:4,mythical:5,'ultra-mythical':6,impossible:7,playtester:8,admin:8,glitch:2};
const itemById=id=>(s.adventureItems||[]).find(it=>it&&it.id===id);
function weapon(){const it=itemById(s.adventureEquipment?.weapon);return it&&!(it.durability<=0)?it:null}
window.catCityHitDamage=()=>{
 const it=weapon();
 if(!it)return Math.round((window.catCityPotions?.strength()||1)*10)/10;
 if(it.id==='owned:bow')return 4;
 // Forged tier gear hits for exactly its tier; found loot gets up to +20% for rarity.
 const t=tierOf(it),bonus=it.tier?1:1+Math.min(.2,.03*(RARITY[it.rarity]||0));
 return Math.round(t.dmg*bonus*(window.catCitySquishems?.gearPower?.(it)||1)*(window.catCityPotions?.strength()||1)*10)/10;
};
// Armour: each worn piece's tier adds to the chance of blocking a boss hit.
const oldAbsorb=window.catCityArmourAbsorb;
window.catCityArmourAbsorb=()=>{
 const worn=['head','body','paws'].map(t=>itemById(s.adventureEquipment?.[t])).filter(it=>it&&it.durability>0);
 if(!worn.length)return false;
 const base=oldAbsorb?oldAbsorb():false; // keeps the original wear behaviour
 if(base)return true;
 const power=worn.reduce((n,it)=>n+(tierOf(it).index+1),0);
 return Math.random()<Math.min(.7,power*.025);
};

// ------------------------------------------------------------------ iron from mining stone
s.materials=s.materials&&typeof s.materials==='object'?s.materials:{};
window.addEventListener('catcity:adventure-action',e=>{
 const d=e.detail||{};if(d.tutorial||d.type!=='mine'||d.material!=='stone')return;
 if(Math.random()<.4){s.materials.iron=(s.materials.iron||0)+1;core.persist();core.note('⛓️ You found 1 iron in the rock!')}
});

// ------------------------------------------------------------------ Forge crafting
const SLOTS=[
 {type:'weapon',word:'Sword',cost:3,extraWood:2},
 {type:'head',word:'Helmet',cost:4},
 {type:'body',word:'Chestplate',cost:6},
 {type:'paws',word:'Boots',cost:3}
];
function recipe(t,slot){
 const need={};
 if(t.key==='wood'){need.wood=slot.cost+(slot.extraWood||0)+1}
 else if(t.key==='eligeode'){need.eligeode=Math.max(1,Math.ceil(slot.cost/2));need.amethyst=slot.cost}
 else{need[t.key]=slot.cost;if(slot.extraWood)need.wood=slot.extraWood}
 return need;
}
function nameFor(t,slot){return t.key==='eligeode'&&slot.type==='weapon'?'Eli-geode Blade':t.name+' '+slot.word}
function can(need){return Object.entries(need).every(([k,v])=>(s.materials[k]||0)>=v)}
function craft(t,slot){
 const need=recipe(t,slot);if(!can(need)){core.note('🔨 You need '+Object.entries(need).map(([k,v])=>v+' '+k).join(', ')+'.');return}
 for(const [k,v] of Object.entries(need))s.materials[k]-=v;
 const item={id:'tier:'+t.key+':'+slot.type+':'+Date.now().toString(36),name:nameFor(t,slot),type:slot.type,tier:t.key,rarity:t.rarity,durability:80+t.index*25,maxDurability:80+t.index*25,color:'#fff'};
 s.adventureItems=Array.isArray(s.adventureItems)?s.adventureItems:[];s.adventureItems.push(item);
 window.catCityInventoryItemAdded?.(item);core.persist();
 window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'craft',item}}));
 core.note('🔨 Forged '+item.name+'! '+(slot.type==='weapon'?t.dmg+' damage per hit.':'Equip it in your backpack.'));
 render();
}
const MAT_ICON={wood:'log:oak',stone:'stone',iron:'ore:iron',steel:'ingot:steel',titanium:'ingot:titanium',crystal:'gem:crystal',emerald:'gem:emerald',diamond:'gem:diamond',amethyst:'gem:amethyst',eligeode:'geode'};
const style=document.createElement('style');
style.textContent=['#cc-forge{margin-top:8px;border-top:1px solid #ffffff30;padding-top:6px}','#cc-forge h4{margin:4px 0;font-size:13px;color:#ffe3a6}',
 '#cc-forge .row{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin:3px 0}','#cc-forge .row b{min-width:78px;font-size:12px}',
 '#cc-forge button{font-size:11px;padding:4px 6px;margin:0;min-height:30px;border-radius:8px}','#cc-forge button[disabled]{opacity:.45}',
 '#cc-forge img{width:16px;height:16px;image-rendering:pixelated;vertical-align:-3px}','#cc-forge small{font-size:10px;color:#e8dcff}'].join('');
document.head.append(style);
function iconImg(key){const u=window.catCityNatureArt?.materialURL?.(MAT_ICON[key]);return u?'<img alt="" src="'+u+'">':''}
function render(){
 const host=document.querySelector('#cc-ti-craft details');if(!host)return;
 let box=$('cc-forge');if(!box){box=document.createElement('div');box.id='cc-forge';host.append(box)}
 box.innerHTML='<h4>🔨 Forge: swords &amp; armour by material</h4><small>Sword damage per hit: no sword 1 · Wood 2 · Stone 3 · Iron 4 · Steel 5 · Titanium 6 · Crystal 7 · Emerald 8 · Diamond 9 · Amethyst 10 · Eli-Geode 12</small>';
 for(const t of LADDER){if(t.key==='admin'||t.key==='playtester'||t.key==='glitched')continue;
  const row=document.createElement('div');row.className='row';row.innerHTML='<b>'+iconImg(t.key)+' '+t.name+' <small>('+(s.materials[t.key]||0)+')</small></b>';
  for(const slot of SLOTS){const need=recipe(t,slot),b=document.createElement('button');b.type='button';b.textContent=slot.word+' · '+Object.entries(need).map(([k,v])=>v+' '+(k==='eligeode'?'eli':k)).join('+');b.disabled=!can(need);b.onclick=()=>craft(t,slot);row.append(b)}
  box.append(row);
 }
}
let tries=0;const iv=setInterval(()=>{if(document.querySelector('#cc-ti-craft details')){render();clearInterval(iv)}else if(++tries>40)clearInterval(iv)},500);
window.addEventListener('catcity:adventure-action',e=>{if(e.detail?.type==='inventory')setTimeout(render,50)});
window.catCityTiers={tierOf,list:LADDER,render,craft:(key,type)=>craft(BY[key],SLOTS.find(x=>x.type===type))};
})();

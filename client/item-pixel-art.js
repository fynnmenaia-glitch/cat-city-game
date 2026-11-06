/* Cat City — weapon & armour pixel art (art wave 3).
 * Unique 16×16 icons for every weapon, head, body and paw item, built from
 * the item's name (material + kind), plus the colours used when the item is
 * worn by a cat (cat-pixel-art.js paints worn gear).
 *
 * Kinds:  sword · sabre · fang · spear · bow · hood · helmet · crown · mask ·
 *         armour · robe · vest · boots
 * Looks:  wood, training, oak, timber, cherry/blossom/petal/pink, lily/marsh/
 *         reed/frog, crystal, diamond, emerald, amethyst, moon, venom/poison/
 *         toxic/wrangler, gold/treasure/festival/star/legendary, cotton/wool/
 *         soft, leaf/forest/ranger, eli-geode (rainbow), admin (gold & white)
 * Event prefixes add a small badge: 👻 Ghost, 🌟 Star, 💎 Crystal,
 * 💰 Treasure, 🌙 Lunar. Rarity epic and above adds a sparkle.
 *
 * API: window.catCityItemArt.icon(item) -> 16×16 canvas
 *      window.catCityItemArt.dataURL(item) -> PNG data URL (cached)
 *      window.catCityItemArt.palette(item) -> {a,b,c} main/light/dark colours
 *      window.catCityItemArt.kind(item)
 *      window.catCityItemArt.sheet() -> review sheet canvas
 */
(()=>{'use strict';
const S=16,OUT='#241a2c';
const MATS=[
 ['admin',{a:'#ffd45c',b:'#ffffff',c:'#c8952b',x:'#ffffff'}],
 ['playtester',{a:'#3fd6c6',b:'#c8fff7',c:'#1f948f',x:'#ff9fe0'}],
 ['glitched',{a:'#4a4458',b:'#7ff5ff',c:'#2c2836',x:'#ff5a7a'}],
 ['eli-geode',{a:'#b77cf2',b:'#e9d7ff',c:'#6c3fb0',rainbow:true}],
 ['eligeode',{a:'#b77cf2',b:'#e9d7ff',c:'#6c3fb0',rainbow:true}],
 ['diamond',{a:'#8fe9ff',b:'#ffffff',c:'#3fb2d6'}],
 ['emerald',{a:'#3fcf7f',b:'#b8ffd6',c:'#1f8a50'}],
 ['amethyst',{a:'#b47cf0',b:'#e8d4ff',c:'#7144b8'}],
 ['crystal',{a:'#9fdfff',b:'#effbff',c:'#4f9fd6'}],
 ['moon',{a:'#c4cdfa',b:'#ffffff',c:'#7581d0'}],
 ['titanium',{a:'#cfd8e6',b:'#ffffff',c:'#7d8aa3',x:'#8fd0ff'}],['steel',{a:'#a9b4c4',b:'#e6edf6',c:'#5d6878'}],['iron',{a:'#b9a596',b:'#e2d6cc',c:'#6f5d52'}],['stone',{a:'#9a9ca6',b:'#c9cbd2',c:'#5f616c'}],
 ['venom',{a:'#7fe26a',b:'#dcffd0',c:'#3a9a35'}],['poison',{a:'#8fd86a',b:'#e0ffd0',c:'#4a8f3a',x:'#a15fd6'}],['toxic',{a:'#9fe35a',b:'#eaffc8',c:'#5a9a2a'}],
 ['wrangler',{a:'#73549d',b:'#9a7cc4',c:'#46306a'}],
 ['festival',{a:'#ffd45c',b:'#fff3b0',c:'#d08a2a',x:'#ff6fae'}],['treasure',{a:'#ffcf4a',b:'#fff2b0',c:'#b8862a',x:'#e8506a'}],['legendary',{a:'#ffc16b',b:'#fff0c8',c:'#c8822b'}],['gold',{a:'#ffd45c',b:'#fff3b0',c:'#c8952b'}],
 ['cherry',{a:'#ffa8cc',b:'#ffe3ef',c:'#d06a98'}],['blossom',{a:'#ffb6d5',b:'#fff0f6',c:'#d9709e'}],['petal',{a:'#ffb6d5',b:'#fff0f6',c:'#d9709e'}],['pink',{a:'#ff9ec7',b:'#ffe0ee',c:'#d0638f'}],
 ['lily',{a:'#7fd6b0',b:'#e6fff3',c:'#3f9a78',x:'#ffffff'}],['marsh',{a:'#6fbf9a',b:'#cff3e0',c:'#3c8a68'}],['frog',{a:'#7fcf5a',b:'#d6ffc0',c:'#4a8f30'}],['reed',{a:'#cdb67a',b:'#f2e6bd',c:'#8f7a42'}],
 ['timber',{a:'#b0b8c4',b:'#eef2f7',c:'#6f7886',x:'#a0703f'}],['oak',{a:'#c2cad6',b:'#f2f5fa',c:'#7a8494',x:'#5fae4a'}],
 ['leaf',{a:'#6fbf5a',b:'#c8f0b0',c:'#3f8a35'}],['forest',{a:'#5fa85a',b:'#bfe8b0',c:'#36753a'}],['ranger',{a:'#9b6b44',b:'#c99a6a',c:'#6b4428',x:'#5fae4a'}],
 ['cotton',{a:'#f4ede0',b:'#ffffff',c:'#c9bfae'}],['wool',{a:'#efe3cf',b:'#fffaf0',c:'#c4b39a'}],['soft',{a:'#f2e2d0',b:'#fff8f0',c:'#c8b29a'}],['cloth',{a:'#e9dcc6',b:'#fff8ea',c:'#b9a88e'}],
 ['training',{a:'#c99a6a',b:'#e8c49a',c:'#8a6240'}],['wood',{a:'#b98557',b:'#d9a877',c:'#7a5233'}],
 ['cat',{a:'#b6c1d0',b:'#eef3fa',c:'#6e7a8c'}],['miner',{a:'#f6c84a',b:'#fff0a8',c:'#b88a22'}],['paw',{a:'#a87a52',b:'#d6aa7c',c:'#6e4c30'}],
 ['adventurer',{a:'#9b6b44',b:'#d6aa7c',c:'#6b4428'}]
];
const DEFAULT={a:'#c2cad6',b:'#f2f5fa',c:'#7a8494'};
// Event items are named with an emoji prefix, e.g. "💎 Crystal Oak Sword". Plain
// "Crystal Sabre" is not an event item.
const EVENT=/^[^A-Za-z0-9]+\s*(Ghost|Star|Crystal|Treasure|Lunar)\s+(?=[A-Z])/;
function nameOf(it){return String(typeof it==='string'?it:it?.name||'').replace(EVENT,'').replace(/^[^A-Za-z0-9]+\s*/,'')}
function eventOf(it){const m=String(typeof it==='string'?it:it?.name||'').match(EVENT);return m?m[1]:null}
function palette(it){
 const n=nameOf(it).toLowerCase(),admin=/^admin\b|\badmin\b/.test(n)||it?.rarity==='admin';
 if(admin)return {...MATS[0][1]};
 for(const [k,p] of MATS)if(n.includes(k))return {...p};
 return {...DEFAULT};
}
function kind(it){
 const n=nameOf(it).toLowerCase(),t=it?.type;
 if(/bow/.test(n))return 'bow';
 if(/spear/.test(n))return 'spear';
 if(/fang/.test(n))return 'fang';
 if(/sabre|saber/.test(n))return 'sabre';
 if(/sword|blade/.test(n)||t==='weapon')return 'sword';
 if(/crown|halo/.test(n))return 'crown';
 if(/mask/.test(n))return 'mask';
 if(/hood/.test(n))return 'hood';
 if(/helm|helmet|cap/.test(n)||t==='head')return 'helmet';
 if(/robe/.test(n))return 'robe';
 if(/vest/.test(n))return 'vest';
 if(/boots|paws|shoes/.test(n)||t==='paws')return 'boots';
 return 'armour';
}
const RAINBOW=['#ff6f7a','#ffb35c','#ffe35c','#7fe07a','#6fb6ff','#b57cf2'];
function build(it){
 const g=Array.from({length:S},()=>Array(S).fill(null));
 const put=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<S&&y<S)g[y][x]=c};
 const rect=(x,y,w,h,c)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)put(i,j,c)};
 const p=palette(it),k=kind(it),n=nameOf(it).toLowerCase(),col=i=>p.rainbow?RAINBOW[i%RAINBOW.length]:null;
 const blade=(i,base)=>col(i)||base;
 if(k==='sword'||k==='sabre'||k==='fang'){
  const wide=/timber|guard/.test(n),curve=k!=='sword';
  for(let i=0;i<9;i++){const x=4+i,y=11-i+(curve?Math.round(Math.sin(i/8*Math.PI)*1.6):0);
   put(x,y,blade(i,p.a));put(x+1,y,blade(i+1,p.b));if(wide){put(x,y+1,blade(i,p.c));put(x+1,y-1,p.b)}else put(x,y+1,p.c)}
  put(13,2,p.b);if(k==='fang'){put(13,3,p.b);put(12,2,p.a)}
  const guard=p.x||(/wood|training/.test(n)?'#7a5233':'#c8952b');
  rect(2,10,4,1,guard);rect(4,12,1,3,guard);put(3,11,guard);put(5,13,guard);
  rect(1,13,2,2,'#6b4428');put(0,15,p.x||'#c8952b');
  if(/paw|training|wooden/.test(n)){put(0,14,'#f2d0b8');put(1,15,'#f2d0b8')}
  if(/cherry|blossom/.test(n))for(const [a,b] of [[8,3],[11,7],[6,4]])put(a,b,'#ffe3ef');
  if(/oak/.test(n)){put(2,9,'#5fae4a');put(6,11,'#5fae4a')}
  if(/treasure/.test(n))put(3,11,'#e8506a');
  if(/star|festival/.test(n)){rect(12,0,3,3,'#ffe35c');put(13,0,'#fff6c0');put(11,1,'#ffe35c');put(15,1,'#ffe35c')}
 }else if(k==='spear'){
  for(let i=0;i<11;i++)put(2+i,14-i,i<9?'#8a5d3b':p.c);
  for(let i=0;i<10;i++)put(3+i,14-i,i<9?'#a8744a':p.c);
  rect(11,1,3,3,p.a);put(14,0,p.b);put(13,1,p.b);put(12,2,p.b);put(10,4,p.c);put(14,3,p.c);
  if(/lily/.test(n)){rect(8,5,3,2,'#ffffff');put(9,4,'#ffffff');put(9,6,'#f6dc4a')}
  if(/marsh/.test(n)){put(9,6,'#3c8a68');put(7,6,'#6fbf9a')}
 }else if(k==='bow'){
  for(let i=0;i<13;i++){const y=1+i,x=4+Math.round(Math.sin(i/12*Math.PI)*-3+3);put(x-3,y,p.c);put(x-2,y,p.a)}
  for(let y=2;y<14;y++)put(9,y,'#efe6d6');
  for(let i=0;i<10;i++)put(3+i,8,'#b98557');rect(13,7,2,3,'#c2cad6');put(15,8,'#c2cad6');put(2,7,'#ff6f7a');put(2,9,'#ff6f7a')
 }else if(k==='crown'){
  rect(2,8,12,5,p.a);rect(2,12,12,1,p.c);for(const x of [2,7,12]){rect(x,4,2,4,p.a);put(x,3,p.b)}rect(4,6,2,2,p.a);rect(9,6,2,2,p.a);
  for(const x of [4,8,11])put(x,10,col(x)||(/cherry/.test(n)?'#ff6fae':/amethyst/.test(n)?'#7144b8':'#e8506a'));rect(3,8,10,1,p.b)
 }else if(k==='helmet'){
  rect(3,4,10,7,p.a);rect(2,7,12,5,p.a);rect(4,3,8,1,p.a);rect(4,4,4,2,p.b);rect(2,11,12,2,p.c);
  if(/cat/.test(n)){rect(3,1,2,3,p.a);rect(11,1,2,3,p.a);put(3,1,p.b)}
  if(/miner/.test(n)){rect(6,5,4,3,'#fff6b0');put(7,5,'#ffffff')}
  if(/forest/.test(n)){rect(10,1,3,3,'#5fae4a');put(9,2,'#8fe39a')}
  if(/emerald/.test(n))rect(7,6,2,2,'#b8ffd6');
  rect(5,9,6,1,p.c)
 }else if(k==='hood'){
  rect(3,3,10,10,p.a);rect(2,6,12,8,p.a);rect(4,2,8,1,p.a);rect(5,6,6,5,'#3a2c44');rect(3,4,4,2,p.b);rect(2,13,12,1,p.c);
  if(/frog/.test(n)){rect(3,0,3,3,p.a);rect(10,0,3,3,p.a);put(4,1,'#ffffff');put(11,1,'#ffffff');put(5,1,'#241a2c');put(12,1,'#241a2c')}
 }else if(k==='mask'){
  rect(1,5,14,6,p.a);rect(1,5,14,1,p.b);rect(1,10,14,1,p.c);rect(3,7,3,2,'#241a2c');rect(10,7,3,2,'#241a2c');put(4,7,'#f9df80');put(11,7,'#f9df80');rect(0,7,1,2,p.c);rect(15,7,1,2,p.c)
 }else if(k==='boots'){
  for(const ox of [1,8]){rect(ox+1,3,5,8,p.a);rect(ox+1,10,7,4,p.a);rect(ox+1,3,5,1,p.b);rect(ox+1,13,7,1,p.c);rect(ox+2,4,2,5,p.b)}
  if(/pink|paws|legendary|soft|reed/.test(n))for(const ox of [1,8]){put(ox+3,11,'#ffd2e4');put(ox+5,11,'#ffd2e4')}
  if(/crystal/.test(n))for(const ox of [1,8])put(ox+2,5,'#ffffff');
 }else{ // armour, robe, vest
  const robe=k==='robe',vest=k==='vest';
  rect(3,2,10,robe?13:11,p.a);rect(1,3,3,4,p.a);rect(12,3,3,4,p.a);rect(6,2,4,2,'#00000000');
  rect(6,1,4,2,null);put(6,2,null);put(9,2,null);
  rect(4,3,3,3,p.b);rect(3,robe?14:12,10,1,p.c);rect(7,4,2,robe?11:8,p.c);
  if(vest){rect(7,3,2,10,'#3a2c44');put(5,7,'#c8952b');put(10,7,'#c8952b')}
  if(/petal|cherry/.test(n))for(const [a,b] of [[4,8],[10,6],[11,10]])put(a,b,'#ffe3ef');
  if(/leaf|forest/.test(n))for(const [a,b] of [[4,9],[11,8]])put(a,b,'#3f8a35');
  if(/moon/.test(n)){rect(9,6,3,3,'#fff6b0');put(10,6,p.a)}
  if(/paw/.test(n)){rect(9,8,2,2,'#f2d0b8');put(8,7,'#f2d0b8');put(11,7,'#f2d0b8');put(9,6,'#f2d0b8');put(10,6,'#f2d0b8')}
  if(/poison/.test(n))put(10,9,'#a15fd6');
  if(p.rainbow)for(let y=3;y<13;y++)put(4+(y%3),y,RAINBOW[y%6]);
 }
 const ev=eventOf(it),rar=it?.rarity;
 if(['epic','legendary','mythical','ultra-mythical','impossible','admin','playtester'].includes(rar)||/admin/.test(n)){put(14,13,'#ffffff');put(13,14,'#ffffff');put(15,14,'#ffffff');put(14,15,'#ffffff');put(14,14,'#fff6b0')}
 if(ev){const c={Ghost:'#e9f0ff',Star:'#ffe35c',Crystal:'#9fdfff',Treasure:'#ffcf4a',Lunar:'#c4cdfa'}[ev];rect(0,0,3,3,c);put(1,1,ev==='Ghost'?'#241a2c':'#ffffff')}
 return g;
}
function toCanvas(g){
 const c=document.createElement('canvas');c.width=S;c.height=S;const x=c.getContext('2d');
 for(let y=0;y<S;y++)for(let i=0;i<S;i++){const v=g[y][i];if(v&&v!=='#00000000'){x.fillStyle=v;x.fillRect(i,y,1,1)}else if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const w=g[y+dy]?.[i+dx];return w&&w!=='#00000000'})){x.fillStyle=OUT;x.fillRect(i,y,1,1)}}
 return c;
}
const cache=new Map(),urls=new Map();
const keyOf=it=>(typeof it==='string'?it:(it?.name||'')+'|'+(it?.type||'')+'|'+(it?.rarity||''));
function icon(it){const k=keyOf(it);if(!cache.has(k))cache.set(k,toCanvas(build(it)));return cache.get(k)}
function dataURL(it){const k=keyOf(it);if(!urls.has(k)){const c=icon(it),b=document.createElement('canvas');b.width=S*4;b.height=S*4;const x=b.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(c,0,0,S*4,S*4);urls.set(k,b.toDataURL())}return urls.get(k)}
const CATALOG=['Wood Sword','Stone Sword','Iron Sword','Steel Sword','Titanium Sword','Crystal Sword','Emerald Sword','Amethyst Sword','Admin Sword','Stone Helmet','Iron Chestplate','Steel Boots','Titanium Helmet','Training Paw Blade','Wooden Paw Sword','Oak Sword','Timberguard Sword','Blossom Blade','Cherry Blade','Lily Spear','Marsh Spear','Crystal Sabre','Venom Fang','Diamond Sword','Eli-geode Blade','Treasure Seeker Blade','Festival Star Blade','Adventurer Bow',
 'Cotton Hood','Forest Helmet','Cherry Crown','Frog Hood','Amethyst Crown','Crystal Crown','Wrangler Mask','Emerald Helm','Cat Helmet','Crystal Miner Helmet',
 'Training Cloth Armour','Wool Vest','Leaf Armour','Petal Armour','Marsh Armour','Moonplate Armour','Poison Armour','Amethyst Armour','Paw Armour','Moonlight Robe',
 'Soft Paw Boots','Ranger Boots','Ranger Paw Boots','Pink Paws','Reed Paws','Crystal Boots','Toxic Boots','Legendary Paws',
 'Admin Diamond Sword','Admin Eli-geode Blade','Admin Crystal Crown','Admin Amethyst Armour','Admin Legendary Paws','👻 Ghost Oak Sword','🌟 Star Crystal Sabre','💰 Treasure Wool Vest','🌙 Lunar Pink Paws'];
function sheet(scale=5){
 const cols=10,cell=S*scale+8,rows=Math.ceil(CATALOG.length/cols);
 const c=document.createElement('canvas');c.width=cols*cell;c.height=rows*(cell+14);const x=c.getContext('2d');x.imageSmoothingEnabled=false;
 x.font='bold 9px system-ui';x.textAlign='center';
 CATALOG.forEach((n,i)=>{const cx=(i%cols)*cell,cy=Math.floor(i/cols)*(cell+14);const it={name:n,rarity:/Admin/.test(n)?'admin':/Eli|Diamond|Legendary/.test(n)?'legendary':'common'};
  x.fillStyle='#3a2c52';x.fillRect(cx+2,cy+2,cell-4,cell-4);x.drawImage(icon(it),cx+4,cy+4,S*scale,S*scale);x.fillStyle='#fff';x.fillText(n.replace(/^\W+\s/,'').slice(0,16),cx+cell/2,cy+cell+9)});
 return c;
}
window.catCityItemArt={icon,dataURL,palette,kind,sheet,catalog:CATALOG,nameOf};

// ---------------------------------------------------------------- inventory icons
// Swap the emoji in the inventory grid, hotbar and item details for pixel icons.
const core=window.__catCityEngine;
function itemByName(name){const list=core?.state?.adventureItems||[];return list.find(it=>it&&it.name===name)}
const SKIP=new Set(['squishem']);
function swapButton(b,name){
 if(!name)return;const it=itemByName(name);if(!it||b.dataset.pixelIcon===it.id+it.rarity)return;
 const plush=it.type==='squishem'?window.catCitySquishemArt?.url?.(it.squishemId):null;if(SKIP.has(it.type)&&!plush)return;
 const img=new Image();img.src=plush||dataURL(it);img.alt='';img.draggable=false;img.className='cc-pixel-icon';
 const emoji=b.querySelector('.main-icon');
 if(emoji){emoji.textContent='';emoji.append(img)}
 else{for(const n of [...b.childNodes])if(n.nodeType===3&&n.textContent.trim())n.remove();b.prepend(img)}
 b.dataset.pixelIcon=it.id+it.rarity;
}
function sweep(){
 document.querySelectorAll('#cc-ti-grid button[title]').forEach(b=>{if(b.title&&b.title!=='Empty slot')swapButton(b,b.title)});
 document.querySelectorAll('#cc-hotbar-ten button[aria-label^="Quick slot"]').forEach(b=>{const m=b.getAttribute('aria-label').match(/^Quick slot \d+ (.+)$/);if(m)swapButton(b,m[1])});
}
if(core){
 const st=document.createElement('style');st.textContent='.cc-pixel-icon{width:1.55em;height:1.55em;image-rendering:pixelated;vertical-align:middle;pointer-events:none}#cc-hotbar-ten .cc-pixel-icon{width:24px;height:24px}';document.head.append(st);
 let queued=false;const mo=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sweep()})});
 const watch=()=>{for(const id of ['cc-ti-grid','cc-hotbar-ten']){const el=document.getElementById(id);if(el&&!el.dataset.pixelWatch){el.dataset.pixelWatch='1';mo.observe(el,{childList:true,subtree:true})}}sweep()};
 watch();setInterval(watch,1500);
}
})();

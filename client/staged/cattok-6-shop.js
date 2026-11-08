/* Cat Tok part 6: the 🛍️ Shop, parcels and unboxing.
 * The Shop tab (bottom bar) sells snacks, decorations, toys and a games console for 🐟 fish:
 * search, category chips, a flash sale with a countdown, "Vouchers for you", product pages with
 * Add to basket / Buy now, a basket and checkout. Orders arrive after about one in-game day
 * (catCityClock: 5 real minutes). Then a pop-up at the top says the parcel has arrived: it waits
 * outside your home if you have one, otherwise in the village. Press E / 🐾 by it to open it in
 * first person: cut the tape with your paw, drag the four flaps open, and take what's inside.
 * Snacks go in 🍲 Snacks (they refill hearts), decorations / toys / the console can be put in your
 * home (📦 My stuff in Your orders), and the Purrstation Pocket has a little game to play.
 * Saved in the game save: s.ctShop = {orders, vouchers, stuff, first}.
 * API: window.CatTokShop = {catalog, buy(id, {price, from}), art(id), open(id), orders()}.
 */
(()=>{'use strict';
const start=()=>{const T=window.CatTok,core=window.__catCityEngine;if(!T||!core||window.CatTokShop)return;
const s=core.state,$=id=>document.getElementById(id);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const CLOCK=()=>window.catCityClock,DAY=()=>CLOCK()?.DAY_MS||300000;
s.ctShop=s.ctShop&&typeof s.ctShop==='object'?s.ctShop:{};const SH=s.ctShop;
SH.orders=Array.isArray(SH.orders)?SH.orders:[];SH.vouchers=SH.vouchers&&typeof SH.vouchers==='object'?SH.vouchers:{};SH.stuff=SH.stuff&&typeof SH.stuff==='object'?SH.stuff:{};
let basket=[];// [{id, qty, price}] (not saved: like a real basket it empties when you leave)

// ------------------------------------------------------------------ the catalogue
// kind: snack (heals) · floor / wall (home decoration) · toy (floor) · console (floor, playable)
const CAT=[
 {id:'galaxy_treats',name:'Galaxy Treats',brand:'Galaxy Treats',cat:'galaxy',kind:'snack',heal:2,icon:'🌌',price:40,was:60,sold:4218,stars:4.9,desc:'Galaxy\'s very own crunchy star-shaped treats. Out of this world! Refills 2 ❤️.'},
 {id:'galaxy_treats_xl',name:'Galaxy Treats Party Pack',brand:'Galaxy Treats',cat:'galaxy',kind:'snack',heal:99,icon:'🌠',price:95,was:140,sold:1102,stars:4.8,desc:'The big bag. Shiny wrapper, extra stars. Refills all your hearts.'},
 {id:'peachy_tea',name:'Peachy Paws Iced Tea',brand:'Peachy Paws',cat:'snacks',kind:'snack',heal:1,icon:'🍑',price:12,was:20,sold:9001,stars:4.7,desc:'Sweet peach iced tea, served cold. As seen on the Peachy Paws LIVE! Refills 1 ❤️.'},
 {id:'peachy_tea_12',name:'Peachy Paws Iced Tea ×12',brand:'Peachy Paws',cat:'snacks',kind:'snack',heal:99,qtyGives:12,icon:'🧃',price:90,was:160,sold:3870,stars:4.8,desc:'Twelve bottles of Peachy Paws: peach, lemon, mango and berry. Refills all your hearts (×12).'},
 {id:'tuna_bites',name:'Tuna Crunch Bites',brand:'Whisker Kitchen',cat:'snacks',kind:'snack',heal:1,icon:'🐟',price:15,was:22,sold:2540,stars:4.6,desc:'Little crunchy tuna bites. Refills 1 ❤️.'},
 {id:'sushi_roll',name:'Salmon Sushi Roll',brand:'Whisker Kitchen',cat:'snacks',kind:'snack',heal:3,icon:'🍣',price:30,was:45,sold:1980,stars:4.9,desc:'Fresh salmon roll for fancy cats. Refills 3 ❤️.'},
 {id:'catnip_gummies',name:'Catnip Gummies',brand:'Zoomie Co.',cat:'snacks',kind:'snack',heal:1,icon:'🌿',price:18,was:25,sold:3302,stars:4.5,desc:'Chewy green gummies. Zoomies not included. Refills 1 ❤️.'},
 {id:'milk_pudding',name:'Milk Pudding Cup',brand:'Whisker Kitchen',cat:'snacks',kind:'snack',heal:2,icon:'🍮',price:20,was:28,sold:1450,stars:4.7,desc:'Wobbly vanilla milk pudding. Refills 2 ❤️.'},
 {id:'fairy_lights',name:'Fairy Lights',cat:'decor',kind:'wall',icon:'✨',price:40,was:55,sold:2210,stars:4.8,desc:'Warm twinkly lights for your wall.'},
 {id:'neon_paw',name:'Neon Paw Sign',cat:'decor',kind:'wall',icon:'🐾',price:70,was:99,sold:860,stars:4.9,desc:'A glowing pink paw for the wall. Very Cat Tok.'},
 {id:'lava_lamp',name:'Lava Lamp',cat:'decor',kind:'floor',icon:'🫧',price:55,was:80,sold:1240,stars:4.7,desc:'Slow purple blobs. So relaxing.'},
 {id:'bean_bag',name:'Bean Bag',cat:'decor',kind:'floor',icon:'🛋️',price:45,was:60,sold:1730,stars:4.6,desc:'Squishy, perfect for naps.'},
 {id:'mini_fridge',name:'Mini Fridge',cat:'decor',kind:'floor',icon:'🧊',price:90,was:130,sold:640,stars:4.8,desc:'Keeps your Peachy Paws cold.'},
 {id:'disco_ball',name:'Disco Ball',cat:'decor',kind:'floor',icon:'🪩',price:80,was:110,sold:930,stars:4.9,desc:'Party time in your living room.'},
 {id:'yarn_ball',name:'Yarn Ball',cat:'toys',kind:'toy',icon:'🧶',price:10,was:15,sold:6012,stars:4.9,desc:'The classic. (Not a Birman.)'},
 {id:'mouse_toy',name:'Mouse on a String',cat:'toys',kind:'toy',icon:'🐭',price:12,was:18,sold:4120,stars:4.7,desc:'Wiggle wiggle pounce.'},
 {id:'scratch_post',name:'Scratching Post',cat:'toys',kind:'toy',icon:'🪵',price:35,was:50,sold:2380,stars:4.8,desc:'Save the sofa!'},
 {id:'squeaky_fish',name:'Squeaky Fish',cat:'toys',kind:'toy',icon:'🐠',price:8,was:12,sold:5320,stars:4.5,desc:'Squeak squeak.'},
 {id:'purrstation',name:'Purrstation Pocket',brand:'Purrstation',cat:'gaming',kind:'console',icon:'🎮',price:300,was:420,sold:777,stars:5,desc:'A handheld games console with Fish Catch built in. Play it from 📦 My stuff or put it in your home.'}
];
const BY=Object.fromEntries(CAT.map(c=>[c.id,c]));
const CATS=[['all','All'],['galaxy','🌌 Galaxy Treats'],['snacks','Snacks'],['decor','Decor'],['toys','Toys'],['gaming','Gaming']];

// Snacks become real snacks: they show in the 🍲 Snacks button and refill hearts.
function addRecipes(){const R=window.catCityCozy?.recipes;if(!R)return false;for(const c of CAT)if(c.kind==='snack'&&!R.some(r=>r.id==='ct_'+c.id))R.push({id:'ct_'+c.id,icon:c.icon,name:c.name,need:{},heal:c.heal});return true}
if(!addRecipes()){const iv=setInterval(()=>{if(addRecipes())clearInterval(iv)},1000)}

// ------------------------------------------------------------------ pixel product pictures
const PX=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
const ART={
 galaxy_treats(g){PX(g,8,5,16,23,'#241832');PX(g,9,6,14,21,'#5b3fa8');PX(g,9,6,14,4,'#7d5fd0');PX(g,10,4,12,3,'#241832');PX(g,11,5,10,2,'#c9a2ff');
  PX(g,12,12,8,7,'#e9953c');PX(g,12,10,2,3,'#e9953c');PX(g,18,10,2,3,'#e9953c');PX(g,13,14,1,1,'#241832');PX(g,18,14,1,1,'#241832');PX(g,14,16,4,2,'#fff6e7');
  for(const [x,y] of [[10,22],[14,24],[19,21],[21,25],[11,8]])PX(g,x,y,1,1,'#ffd45c');PX(g,10,20,12,2,'#ffd45c')},
 galaxy_treats_xl(g){ART.galaxy_treats(g);PX(g,3,10,7,16,'#241832');PX(g,4,11,5,14,'#ff6fae');PX(g,5,13,3,3,'#ffd45c');PX(g,23,12,7,15,'#241832');PX(g,24,13,5,13,'#7fd6ff');PX(g,25,15,3,3,'#fff')},
 peachy_tea(g){PX(g,13,3,6,3,'#241832');PX(g,14,4,4,2,'#ff8a5c');PX(g,12,6,8,3,'#241832');PX(g,11,9,10,20,'#241832');PX(g,12,10,8,18,'#c25a1e');PX(g,12,10,8,3,'#e07a3c');
  PX(g,11,15,10,8,'#fff3d0');PX(g,14,16,4,4,'#ffa66b');PX(g,15,15,2,1,'#5fbf55');PX(g,12,21,8,1,'#ff8a5c');PX(g,13,11,1,4,'#ffffff88')},
 peachy_tea_12(g){for(let i=0;i<4;i++){const x=2+i*7;PX(g,x+2,8,3,2,'#241832');PX(g,x,10,7,18,'#241832');PX(g,x+1,11,5,16,['#c25a1e','#e0c13c','#e07a3c','#a0356a'][i]);PX(g,x+1,16,5,5,'#fff3d0');PX(g,x+2,17,3,3,['#ffa66b','#ffe06b','#ffb36b','#ff7ab0'][i])}PX(g,1,26,30,3,'#7a5235')},
 tuna_bites(g){PX(g,7,9,18,17,'#241832');PX(g,8,10,16,15,'#7ec8e3');PX(g,8,10,16,4,'#bfe8ff');PX(g,11,15,10,6,'#ff8a3c');PX(g,21,16,3,4,'#ff8a3c');PX(g,12,17,1,1,'#241832');PX(g,9,22,14,2,'#3f8fc8')},
 sushi_roll(g){PX(g,6,12,20,14,'#241832');PX(g,7,13,18,12,'#2a3a2a');PX(g,9,15,14,8,'#fffbef');PX(g,12,17,8,4,'#ff7a5c');PX(g,13,18,6,2,'#ffa58a');PX(g,4,24,24,3,'#c94c5a')},
 catnip_gummies(g){PX(g,8,6,16,22,'#241832');PX(g,9,7,14,20,'#bff0c0');PX(g,9,7,14,4,'#5fbf55');for(const [x,y,c] of [[11,14,'#5fbf55'],[16,13,'#8be06e'],[12,19,'#3f9a45'],[17,19,'#5fbf55']]){PX(g,x,y,4,4,c);PX(g,x+1,y,1,1,'#ffffff99')}},
 milk_pudding(g){PX(g,8,12,16,15,'#241832');PX(g,9,13,14,13,'#fff3d0');PX(g,9,13,14,3,'#c9963a');PX(g,13,9,6,4,'#241832');PX(g,14,10,4,3,'#c94c5a');PX(g,8,25,16,2,'#e9dcff')},
 fairy_lights(g){for(let i=0;i<7;i++){const x=3+i*4,y=10+Math.round(Math.sin(i)*3);PX(g,x,y,1,3,'#2a1d33');PX(g,x-1,y+3,3,3,['#ffd45c','#ff6fae','#7fd6ff','#9bf06a'][i%4])}g.fillStyle='#2a1d33';for(let x=3;x<29;x++)g.fillRect(x,10+Math.round(Math.sin((x-3)/4)*3),1,1)},
 neon_paw(g){PX(g,4,4,24,24,'#241832');PX(g,5,5,22,22,'#3a2448');const c='#ff6fd8';PX(g,12,16,9,7,c);PX(g,10,11,3,4,c);PX(g,14,9,3,4,c);PX(g,18,9,3,4,c);PX(g,22,11,3,4,c)},
 lava_lamp(g){PX(g,12,25,9,4,'#241832');PX(g,13,26,7,2,'#c9963a');PX(g,11,6,11,20,'#241832');PX(g,12,7,9,18,'#5a2a7a');PX(g,14,10,4,4,'#ff6fae');PX(g,15,17,5,5,'#ff6fae');PX(g,13,4,7,3,'#241832');PX(g,14,5,5,1,'#c9963a')},
 bean_bag(g){PX(g,5,13,22,15,'#241832');PX(g,6,14,20,13,'#e47c9a');PX(g,8,12,14,4,'#241832');PX(g,9,13,12,3,'#f7a6bd');PX(g,8,16,8,2,'#f7cfdc')},
 mini_fridge(g){PX(g,8,4,16,25,'#241832');PX(g,9,5,14,23,'#bfe8ff');PX(g,9,14,14,1,'#241832');PX(g,20,7,1,5,'#5a6f8a');PX(g,20,17,1,6,'#5a6f8a');PX(g,11,7,4,3,'#ff8a5c')},
 disco_ball(g){PX(g,15,2,2,6,'#241832');for(let y=0;y<14;y++)for(let x=0;x<14;x++){const dx=x-6.5,dy=y-6.5;if(dx*dx+dy*dy<=49){g.fillStyle=(x+y)%2?'#d9e2f0':'#8fa0bf';g.fillRect(9+x,8+y,1,1)}}PX(g,12,11,2,2,'#ffffff');PX(g,19,17,1,1,'#fff')},
 yarn_ball(g){for(let y=0;y<16;y++)for(let x=0;x<16;x++){const dx=x-7.5,dy=y-7.5,r=dx*dx+dy*dy;if(r<=64){g.fillStyle=r>50?'#241832':((x+2*y)%5===0?'#a83a66':'#e05a8a');g.fillRect(8+x,8+y,1,1)}}g.fillStyle='#e05a8a';for(let i=0;i<7;i++)g.fillRect(24+i,22+Math.round(Math.sin(i)*2),1,1)},
 mouse_toy(g){PX(g,10,16,12,8,'#241832');PX(g,11,17,10,6,'#b9b2c4');PX(g,10,13,4,4,'#241832');PX(g,11,14,2,2,'#f7a6bd');PX(g,19,19,1,1,'#241832');PX(g,21,20,3,1,'#f7a6bd');g.fillStyle='#7a5235';for(let i=0;i<10;i++)g.fillRect(11-i,15-Math.round(i*1.1),1,1)},
 scratch_post(g){PX(g,6,26,20,4,'#241832');PX(g,7,27,18,2,'#c8955a');PX(g,13,5,7,22,'#241832');for(let y=6;y<26;y+=2)PX(g,14,y,5,1,y%4?'#d9b98a':'#b88f5a');PX(g,10,3,13,3,'#241832');PX(g,11,4,11,1,'#e47c9a')},
 squeaky_fish(g){PX(g,7,12,16,9,'#241832');PX(g,8,13,14,7,'#ffc23c');PX(g,22,11,5,11,'#241832');PX(g,23,12,3,9,'#ff8a3c');PX(g,10,15,2,2,'#241832');PX(g,13,17,6,1,'#e08a1e')},
 purrstation(g){PX(g,3,9,26,15,'#241832');PX(g,4,10,24,13,'#7d5fd0');PX(g,10,11,12,9,'#241832');PX(g,11,12,10,7,'#7fd6ff');PX(g,14,14,3,3,'#e9953c');PX(g,5,14,4,1,'#fff6e4');PX(g,6,13,1,3,'#fff6e4');PX(g,24,13,2,2,'#ff6fae');PX(g,25,16,2,2,'#ffd45c');PX(g,13,21,6,1,'#c9a2ff')}
};
const artCache={};
function art(id,size=96){const k=id+':'+size;if(artCache[k])return artCache[k];const c=document.createElement('canvas');c.width=32;c.height=32;const g=c.getContext('2d');
 const bg=BY[id]?.cat==='galaxy'?'#efe6ff':BY[id]?.kind==='snack'?'#fff4e2':BY[id]?.cat==='gaming'?'#e6f6ff':'#f6f0ff';g.fillStyle=bg;g.fillRect(0,0,32,32);try{ART[id]?.(g)}catch(e){}
 const o=document.createElement('canvas');o.width=size;o.height=size;const og=o.getContext('2d');og.imageSmoothingEnabled=false;og.drawImage(c,0,0,size,size);return artCache[k]=o.toDataURL()}

// Decoration art inside homes (cozy-update.js asks window.catCityDecorArt for ids it doesn't know).
const DECO=window.catCityDecorArt=window.catCityDecorArt||{floor:{},wall:{},use:{}};
// The 32×32 picture shrunk to 2/3 size once, as a list of pixels, then drawn into the room with its rectangle helper.
const pixCache={};
function pixels(id){if(pixCache[id])return pixCache[id];const c=document.createElement('canvas');c.width=32;c.height=32;const g=c.getContext('2d');ART[id](g);const d=g.getImageData(0,0,32,32).data,out=[];
 for(let yy=0;yy<21;yy++)for(let xx=0;xx<21;xx++){const i=(Math.floor(yy*1.5)*32+Math.floor(xx*1.5))*4;if(d[i+3]>10)out.push([xx,yy,'rgb('+d[i]+','+d[i+1]+','+d[i+2]+')'])}return pixCache[id]=out}
const small=(id,R,x,y,w,h,ox=-2,oy=-4)=>{for(const [a,b,c] of pixels(id))R(x+ox+a,y+oy+b,1,1,c)};
for(const c of CAT){if(c.kind==='floor'||c.kind==='toy'||c.kind==='console')DECO.floor[c.id]=(R,x,y)=>small(c.id,R,x,y);if(c.kind==='wall')DECO.wall[c.id]=(R,x,y)=>small(c.id,R,x,y,20,20,-1,-3)}
DECO.use.purrstation={label:'🎮 Play Fish Catch',use:()=>setTimeout(fishCatch,200)};

// ------------------------------------------------------------------ prices, vouchers, flash sale
const VOUCHERS=[{id:'v20',pct:20,min:50,title:'20% off',sub:'on orders over 50 🐟'},{id:'v10',pct:10,min:0,title:'10% off',sub:'on any order'}];
const fishNow=()=>Math.floor(s.fish||0);
function flash(){const d=Math.floor(Date.now()/DAY()),pool=CAT.filter(c=>c.price>=12);const c=pool[d%pool.length];const ends=(d+1)*DAY();return{id:c.id,price:Math.max(1,Math.round(c.price*.5)),ends,left:3+((d*7)%5)}}
function priceOf(id){const c=BY[id];if(!c)return 0;const f=flash();if(f.id===id)return f.price;if(!SH.first&&id==='yarn_ball')return 1;return c.price}
const offPct=(now,was)=>was>now?Math.round((1-now/was)*100):0;
function bestVoucher(total){let best=null;for(const v of VOUCHERS)if(SH.vouchers[v.id]==='claimed'&&total>=v.min&&(!best||v.pct>best.pct))best=v;return best}

// ------------------------------------------------------------------ styles
const css=document.createElement('style');css.textContent=`
.cts{background:#fff;color:#161823;height:100%;overflow-y:auto;padding:calc(48px + env(safe-area-inset-top)) 0 18px;font:14px -apple-system,system-ui,sans-serif}
.cts-top{display:flex;gap:8px;align-items:center;padding:0 12px 8px}
.cts-search{flex:1;display:flex;align-items:center;border:2px solid #161823;border-radius:8px;overflow:hidden}
.cts-search input{flex:1;border:0!important;outline:0;padding:8px 10px!important;font:14px system-ui!important;min-width:0;background:#fff;color:#161823;box-shadow:none!important}
.cts-search b{background:#161823;color:#fff;padding:9px 12px;font:700 13px system-ui}
.cts-cart{position:relative;font-size:24px;padding:2px 4px}
.cts-cart i{position:absolute;top:-4px;right:-6px;min-width:17px;height:17px;border-radius:9px;background:#fe2c55;color:#fff;font:800 10px/17px system-ui;font-style:normal;text-align:center;padding:0 3px}
.cts-chips{display:flex;gap:14px;overflow-x:auto;padding:0 12px 8px;scrollbar-width:none;white-space:nowrap}.cts-chips::-webkit-scrollbar{display:none}
.cts-chips button{font:600 15px system-ui;color:#8a8b91;padding:4px 0;border-bottom:2px solid transparent!important}
.cts-chips button.on{color:#161823;border-bottom-color:#161823!important}
.cts-wallet{margin:0 12px 8px;padding:8px 12px;border-radius:10px;background:#fff4e2;font:700 13px system-ui;display:flex;justify-content:space-between;align-items:center}
.cts-flash{margin:0 12px 10px;border-radius:12px;padding:10px;background:linear-gradient(90deg,#fe2c55,#ff7a45);color:#fff;display:flex;gap:10px;align-items:center}
.cts-flash img{width:64px;height:64px;border-radius:8px;image-rendering:pixelated;background:#fff}
.cts-flash .t{font:900 14px system-ui}.cts-flash .c{font:800 12px system-ui;background:#0003;border-radius:6px;padding:2px 6px;display:inline-block;margin-top:3px}
.cts-flash .p{font:900 18px system-ui}.cts-flash s{opacity:.75;font-size:12px}
.cts-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 8px}
.cts-card{text-align:left;border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 1px 4px #0002;display:flex;flex-direction:column}
.cts-card img{width:100%;aspect-ratio:1;image-rendering:pixelated;display:block}
.cts-card .b{padding:6px 8px 9px}.cts-card .n{font:600 13px system-ui;line-height:1.25;height:32px;overflow:hidden}
.cts-card .r{font:600 11px system-ui;color:#8a8b91;margin:3px 0}.cts-card .r em{color:#ffb400;font-style:normal}
.cts-card .deal{font:700 11px system-ui;color:#fe2c55}
.cts-card .pr{font:800 16px system-ui;color:#fe2c55}.cts-card .pr s{font:500 11px system-ui;color:#8a8b91;margin-left:4px}.cts-card .pr u{text-decoration:none;font:800 11px system-ui;margin-left:4px}
.cts-free{display:inline-block;background:#e8faf2;color:#0a8a5a;font:700 10px system-ui;border-radius:3px;padding:1px 4px;margin-bottom:3px}
.cts-pg{position:absolute;inset:0;z-index:26;background:#fff;color:#161823;overflow-y:auto;padding-bottom:84px;animation:ctsIn .2s ease-out}
@keyframes ctsIn{from{transform:translateX(30px);opacity:0}}
.cts-pg .back{position:absolute;left:10px;top:calc(48px + env(safe-area-inset-top));z-index:2;width:36px;height:36px;border-radius:50%;background:#0006;color:#fff;font:700 20px/36px system-ui;text-align:center}
.cts-pg .hero{width:100%;aspect-ratio:1;image-rendering:pixelated;display:block}
.cts-pg .in{padding:12px 14px}.cts-pg .big{font:900 26px system-ui;color:#fe2c55}.cts-pg .big s{font:500 14px system-ui;color:#8a8b91;margin-left:6px}.cts-pg .big b{font:800 15px system-ui;margin-right:6px}
.cts-pg h3{font:700 16px system-ui;margin:6px 0}.cts-pg p{color:#555;margin:6px 0;line-height:1.4}
.cts-del{font:600 13px system-ui;color:#161823;margin-top:8px}
.cts-foot{position:absolute;left:0;right:0;bottom:0;z-index:3;display:flex;gap:10px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #eee}
.cts-foot button{flex:1;border-radius:24px!important;padding:13px 0;font:800 15px system-ui}
.cts-foot .a{background:#f1f1f2!important;color:#161823}.cts-foot .y{background:#fe2c55!important;color:#fff}
.cts-line{display:flex;gap:10px;align-items:center;padding:10px 14px;border-bottom:1px solid #f1f1f2}
.cts-line img{width:56px;height:56px;border-radius:8px;image-rendering:pixelated}
.cts-line .tx{flex:1;min-width:0}.cts-line .tx b{display:block;font:600 14px system-ui}.cts-line .tx span{font:12px system-ui;color:#8a8b91}
.cts-qty{display:flex;align-items:center;gap:8px;font:700 14px system-ui}.cts-qty button{width:28px;height:28px;border-radius:6px!important;background:#f1f1f2!important}
.cts-sum{padding:12px 14px;font:14px system-ui}.cts-sum div{display:flex;justify-content:space-between;margin:4px 0}.cts-sum .tot{font:900 18px system-ui}
.cts-sum .vou{color:#fe2c55;font-weight:700}
.cts-vpop{position:absolute;inset:0;z-index:40;background:#0007;display:flex;align-items:center;justify-content:center;padding:24px}
.cts-vbox{width:100%;max-width:300px;border-radius:18px;background:linear-gradient(#ffe4ef,#fff 40%);padding:18px 14px 14px;color:#161823}
.cts-vbox h3{font:900 20px system-ui;margin:0}.cts-vbox small{color:#8a8b91}
.cts-v{background:#fff;border-radius:12px;padding:12px;margin-top:10px;box-shadow:0 1px 4px #0002}
.cts-v b{font:900 26px system-ui;color:#fe2c55}.cts-v b span{font-size:16px}.cts-v div{font:12px system-ui;color:#555}
.cts-vbox .go{display:block;width:100%;margin-top:12px;border-radius:24px!important;background:#fe2c55!important;color:#fff;font:800 15px system-ui;padding:12px 0}
.cts-tabs2{display:flex;border-bottom:1px solid #eee}.cts-tabs2 button{flex:1;padding:10px 0;font:700 14px system-ui;color:#8a8b91}.cts-tabs2 button.on{color:#161823;box-shadow:inset 0 -2px #161823}
.cts-bar{height:6px;border-radius:3px;background:#f1f1f2;overflow:hidden;margin-top:6px}.cts-bar i{display:block;height:100%;background:#20d5ec}
.cts-btn{border-radius:6px!important;padding:7px 10px;background:#fe2c55!important;color:#fff;font:700 12px system-ui}
.cts-btn.g{background:#f1f1f2!important;color:#161823}
`;document.head.append(css);

// ------------------------------------------------------------------ the shop page
let cat='all',query='';
function shopPage(el){
 if(!SH.vouchersSeen){SH.vouchersSeen=true;core.persist();setTimeout(()=>vouchersPopup(),350)}
 const f=flash(),fc=BY[f.id];
 const L=CAT.filter(c=>(cat==='all'||c.cat===cat)&&(!query||(c.name+' '+(c.brand||'')+' '+c.cat).toLowerCase().includes(query)));
 el.innerHTML='<div class="cts"><div class="cts-top"><div class="cts-search"><input type="search" placeholder="Search Cat Tok Shop" value="'+esc(query)+'" data-q><b>Search</b></div><button class="cts-cart" data-cart>🛒'+(basket.length?'<i>'+basket.reduce((a,b)=>a+b.qty,0)+'</i>':'')+'</button></div>'+
  '<div class="cts-chips">'+CATS.map(([k,n])=>'<button data-c="'+k+'" class="'+(cat===k?'on':'')+'">'+n+'</button>').join('')+'</div>'+
  '<div class="cts-wallet"><span>Your fish: 🐟 '+fishNow()+'</span><button class="cts-btn g" data-orders>📦 Your orders'+(SH.orders.some(o=>o.status==='arrived')?' •':'')+'</button></div>'+
  (cat==='all'&&!query?'<button class="cts-flash" data-id="'+f.id+'" style="width:calc(100% - 24px);text-align:left"><img src="'+art(f.id)+'"><div style="flex:1"><div class="t">⚡ FLASH SALE · '+esc(fc.name)+'</div><div class="p">🐟 '+f.price+' <s>🐟 '+fc.price+'</s></div><span class="c" data-flashleft>Ends in --</span> <span class="c">Only '+f.left+' left!</span></div></button>':'')+
  '<div class="cts-grid">'+L.map(card).join('')+'</div>'+(L.length?'':'<div style="text-align:center;color:#8a8b91;padding:30px">No results</div>')+'</div>';
 el.querySelector('[data-q]').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();clearTimeout(el._qt);el._qt=setTimeout(()=>{shopPage(el);const i=el.querySelector('[data-q]');i.focus();i.setSelectionRange(i.value.length,i.value.length)},350)});
 el.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{cat=b.dataset.c;shopPage(el)});
 el.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>product(b.dataset.id));
 el.querySelector('[data-cart]').onclick=()=>basketPage();el.querySelector('[data-orders]').onclick=()=>ordersPage();
 const tick=()=>{const x=el.querySelector('[data-flashleft]');if(!x||!x.isConnected)return;const ms=Math.max(0,f.ends-Date.now()),m=Math.floor(ms/60000),sec=Math.floor(ms/1000)%60;x.textContent='Ends in '+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');setTimeout(tick,1000)};tick()}
function card(c){const p=priceOf(c.id),deal=!SH.first&&c.id==='yarn_ball'?'New customer deal':flash().id===c.id?'⚡ Flash sale':'';
 return '<button class="cts-card" data-id="'+c.id+'"><img src="'+art(c.id)+'" alt=""><div class="b"><span class="cts-free">Free delivery</span><div class="n">'+esc(c.name)+'</div><div class="r"><em>★</em> '+c.stars.toFixed(1)+' · '+T.fmt(c.sold)+' sold</div>'+(deal?'<div class="deal">'+deal+'</div>':'')+'<div class="pr">🐟 '+p+'<s>🐟 '+(c.was||c.price)+'</s><u>-'+offPct(p,c.was||c.price)+'%</u></div></div></button>'}

// ------------------------------------------------------------------ vouchers pop-up
function vouchersPopup(){const app=T.app;if(!app||app.querySelector('.cts-vpop'))return;const d=document.createElement('div');d.className='cts-vpop';
 d.innerHTML='<div class="cts-vbox"><h3>Vouchers for you</h3><small>Limited-time offers</small>'+VOUCHERS.map(v=>'<div class="cts-v"><b>'+v.pct+'%<span> off</span></b><div>'+v.sub+'</div><div style="color:#8a8b91;font-size:11px">Used automatically at checkout · one use each</div></div>').join('')+'<button class="go">Claim all</button><button class="x" style="display:block;margin:8px auto 0;color:#8a8b91;font:600 13px system-ui">Not now</button></div>';
 app.append(d);d.querySelector('.go').onclick=()=>{for(const v of VOUCHERS)if(!SH.vouchers[v.id])SH.vouchers[v.id]='claimed';core.persist();d.remove();window.catCitySfx?.('coin');T.toast('🎟️ Vouchers claimed!')};
 d.querySelector('.x').onclick=()=>d.remove()}

// ------------------------------------------------------------------ product page
function page(html){const app=T.app;if(!app)return null;app.querySelector('.cts-pg')?.remove();const d=document.createElement('div');d.className='cts-pg';d.innerHTML='<button class="back" data-back>‹</button>'+html;app.append(d);d.querySelector('[data-back]').onclick=()=>d.remove();return d}
function product(id){const c=BY[id];if(!c)return;const p=priceOf(id),was=c.was||c.price,f=flash();
 const d=page('<img class="hero" src="'+art(id,320)+'"><div class="in"><div class="big"><b>-'+offPct(p,was)+'%</b>🐟 '+p+'<s>🐟 '+was+'</s></div>'+
  (f.id===id?'<div style="color:#fe2c55;font:800 13px system-ui">⚡ Flash sale · only '+f.left+' left!</div>':'')+(!SH.first&&id==='yarn_ball'?'<div style="color:#fe2c55;font:800 13px system-ui">New customer deal</div>':'')+
  '<h3>'+esc(c.name)+'</h3><div style="font:600 12px system-ui;color:#8a8b91"><span style="color:#ffb400">★</span> '+c.stars.toFixed(1)+' · '+T.fmt(c.sold)+' sold'+(c.brand?' · '+esc(c.brand):'')+'</div><p>'+esc(c.desc)+'</p>'+
  '<div class="cts-del">🚚 Free delivery · arrives in about 1 in-game day</div><div style="font:12px system-ui;color:#8a8b91;margin-top:4px">'+(s.houses?.length?'Left outside '+esc(s.houses[0])+'.':'Left in the village (buy a home and parcels come to your door).')+'</div></div>'+
  '<div class="cts-foot"><button class="a" data-add>Add to basket</button><button class="y" data-buy>Buy now</button></div>');
 if(!d)return;d.querySelector('[data-add]').onclick=()=>{addToBasket(id);T.toast('🛒 Added to basket')};
 d.querySelector('[data-buy]').onclick=()=>{basket=basket.filter(b=>b.id!==id);basket.unshift({id,qty:1});basketPage()}}
function addToBasket(id,qty=1){const b=basket.find(x=>x.id===id);if(b)b.qty=Math.min(9,b.qty+qty);else basket.push({id,qty});window.catCitySfx?.('pop')}

// ------------------------------------------------------------------ basket + checkout
function totals(){const sub=basket.reduce((a,b)=>a+priceOf(b.id)*b.qty,0),v=bestVoucher(sub),off=v?Math.round(sub*v.pct/100):0;return{sub,v,off,total:Math.max(0,sub-off)}}
function basketPage(){const tt=totals();
 const d=page('<div style="padding:calc(50px + env(safe-area-inset-top)) 0 0"><h2 style="font:800 17px system-ui;text-align:center;margin:0 0 8px">Basket ('+basket.reduce((a,b)=>a+b.qty,0)+')</h2>'+
  (basket.length?basket.map((b,i)=>{const c=BY[b.id];return '<div class="cts-line"><img src="'+art(b.id)+'"><div class="tx"><b>'+esc(c.name)+'</b><span>🐟 '+priceOf(b.id)+' each</span></div><div class="cts-qty"><button data-m="'+i+'">−</button>'+b.qty+'<button data-p="'+i+'">+</button></div></div>'}).join('')+
   '<div class="cts-sum"><div><span>Subtotal</span><span>🐟 '+tt.sub+'</span></div>'+(tt.v?'<div class="vou"><span>🎟️ Voucher '+tt.v.pct+'% off</span><span>−🐟 '+tt.off+'</span></div>':'')+'<div><span>Delivery</span><span style="color:#0a8a5a">Free</span></div><div class="tot"><span>Total</span><span>🐟 '+tt.total+'</span></div><div style="color:#8a8b91;font-size:12px">You have 🐟 '+fishNow()+'. Arrives in about 1 in-game day.</div></div>'
  :'<div style="text-align:center;color:#8a8b91;padding:50px 20px"><div style="font-size:48px">🛒</div>Your basket is empty</div>')+'</div>'+
  (basket.length?'<div class="cts-foot"><button class="y" data-pay>Place order · 🐟 '+tt.total+'</button></div>':''));
 if(!d)return;
 d.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const it=basket[+b.dataset.m];it.qty--;if(it.qty<=0)basket.splice(+b.dataset.m,1);basketPage()});
 d.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{const it=basket[+b.dataset.p];it.qty=Math.min(9,it.qty+1);basketPage()});
 d.querySelector('[data-pay]')?.addEventListener('click',()=>checkout())}
function checkout(){const tt=totals();if(fishNow()<tt.total){T.toast('🐟 You need '+(tt.total-fishNow())+' more fish');return}
 s.fish=fishNow()-tt.total;if(tt.v)SH.vouchers[tt.v.id]='used';
 const items=basket.map(b=>({id:b.id,qty:b.qty*(BY[b.id].qtyGives||1)}));placeOrder(items,tt.total,'shop');basket=[];
 T.app?.querySelector('.cts-pg')?.remove();ordersPage(true)}
function placeOrder(items,paid,from){const now=Date.now(),o={id:'o'+now.toString(36)+Math.floor(Math.random()*1e4).toString(36),items,paid,from,at:now,arriveAt:now+DAY(),status:'shipping'};
 SH.orders.unshift(o);SH.orders=SH.orders.slice(0,40);if(!SH.first)SH.first=now;core.persist();window.catCitySfx?.('buy');
 const when=CLOCK()?CLOCK().now(o.arriveAt).label:'soon';T.inbox('📦','Order placed!','Arrives '+when+' · '+itemsText(items),null);window.dispatchEvent(new CustomEvent('catcity:cattok-order',{detail:o}));return o}
const itemsText=items=>items.map(i=>{const c=BY[i.id],n=c?.qtyGives?Math.round(i.qty/c.qtyGives):i.qty;return (c?.icon||'📦')+' '+(c?.name||i.id)+(n>1?' ×'+n:'')}).join(', ');
// Buying from a live (part 9): one item at a special price, straight to an order.
function buy(id,o={}){const c=BY[id];if(!c)return false;const price=Math.max(0,Math.round(o.price??priceOf(id)));if(fishNow()<price){T.toast?.('🐟 You need '+(price-fishNow())+' more fish');return false}
 s.fish=fishNow()-price;placeOrder([{id,qty:(c.qtyGives||1)*(o.qty||1)}],price,o.from||'live');return true}

// ------------------------------------------------------------------ orders + my stuff
let otab='orders';
function ordersPage(justOrdered){const now=Date.now();
 const d=page('<div style="padding:calc(50px + env(safe-area-inset-top)) 0 0"><h2 style="font:800 17px system-ui;text-align:center;margin:0 0 8px">'+(justOrdered?'🎉 Order placed!':'Your orders')+'</h2>'+
  '<div class="cts-tabs2"><button data-o="orders" class="'+(otab==='orders'?'on':'')+'">📦 Orders</button><button data-o="stuff" class="'+(otab==='stuff'?'on':'')+'">🧸 My stuff</button></div>'+
  (otab==='orders'?(SH.orders.length?SH.orders.map(o=>{const pct=o.status==='shipping'?Math.min(100,Math.round((now-o.at)/(o.arriveAt-o.at)*100)):100;const first=o.items[0]||{};
    return '<div class="cts-line"><img src="'+art(first.id)+'"><div class="tx"><b>'+esc(itemsText(o.items))+'</b><span>'+(o.status==='shipping'?'🚚 On its way · arrives '+(CLOCK()?.now(o.arriveAt).label||'soon'):o.status==='arrived'?'📦 Arrived! '+esc(spotName(o))+' · go and open it':'✅ Opened')+'</span><div class="cts-bar"><i style="width:'+pct+'%"></i></div></div></div>'}).join(''):'<div style="text-align:center;color:#8a8b91;padding:50px 20px"><div style="font-size:48px">📦</div>No orders yet</div>')
   :stuffList())+'</div>');
 if(!d)return;d.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{otab=b.dataset.o;ordersPage()});wireStuff(d);
 if(justOrdered){const t=setInterval(()=>{if(!d.isConnected){clearInterval(t);return}d.querySelectorAll('.cts-bar i').forEach((bar,i)=>{const o=SH.orders[i];if(o&&o.status==='shipping')bar.style.width=Math.min(100,Math.round((Date.now()-o.at)/(o.arriveAt-o.at)*100))+'%'})},1000)}}
function stuffList(){const ids=Object.keys(SH.stuff).filter(k=>SH.stuff[k]>0);if(!ids.length)return '<div style="text-align:center;color:#8a8b91;padding:50px 20px"><div style="font-size:48px">🧸</div>Open a parcel and your new things wait here until you put them in your home.</div>';
 return ids.map(id=>{const c=BY[id]||{name:id};return '<div class="cts-line"><img src="'+art(id)+'"><div class="tx"><b>'+esc(c.name)+(SH.stuff[id]>1?' ×'+SH.stuff[id]:'')+'</b><span>'+(c.kind==='wall'?'Wall decoration':c.kind==='console'?'Games console':c.kind==='toy'?'Toy':'Decoration')+'</span></div>'+
  (c.kind==='console'?'<button class="cts-btn" data-play="'+id+'">▶ Play</button> ':'')+'<button class="cts-btn g" data-place="'+id+'">🏡 Put in home</button></div>'}).join('')}
function wireStuff(d){d.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>placeInHome(b.dataset.place));d.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{window.CatPhone?.close?.();setTimeout(fishCatch,350)})}
function placeInHome(id){const c=BY[id],cz=window.catCityCozy;const home=(s.houses||[])[0];
 if(!home){T.toast('🏡 Buy a home first (Marmalade\'s shop)');return}if(!cz){T.toast('Try again in a moment');return}
 const D=cz.decorOf(home),kind=c.kind==='wall'?'wall':'floor',max=kind==='wall'?2:6;if(D[kind].length>=max){T.toast('📦 Your '+(kind==='wall'?'walls are':'room is')+' full: clear it in the 📒 catalogue');return}
 D[kind].push(id);SH.stuff[id]--;core.persist();cz.shareHome?.(home);window.catCitySfx?.('buy');T.toast('🏡 Put in '+home+'!');ordersPage()}

// ------------------------------------------------------------------ parcels in the world
const T32=core.T||32;
function spotFor(){const homes=[{id:'Rose Cottage',x:8*T32,y:33*T32},{id:'Lavender Lodge',x:23*T32,y:33*T32},{id:'Golden Villa',x:39*T32,y:33*T32}];const h=homes.find(x=>(s.houses||[]).includes(x.id));
 return h?{x:h.x+46,y:h.y+108,name:'outside '+h.id}:{x:17*T32+56,y:18*T32+44,name:'in the village square'}}
const spotName=o=>o.spot?.name||spotFor().name;
function parcels(){return SH.orders.filter(o=>o.status==='arrived')}
function tickOrders(){const now=Date.now();let changed=false;
 for(const o of SH.orders){if(o.status==='shipping'&&now>=o.arriveAt){o.status='arrived';const sp=spotFor(),n=parcels().length-1;o.spot={x:sp.x+(n%3)*24,y:sp.y+Math.floor(n/3)*18,name:sp.name};changed=true;arrived(o)}}
 if(changed)core.persist()}
// Pop-up at the top of the screen.
const pop=document.createElement('div');pop.id='cc-parcel-pop';pop.className='cc-no-pixel';
const pcss=document.createElement('style');pcss.textContent='#cc-parcel-pop{position:fixed;left:50%;top:calc(8px + env(safe-area-inset-top));z-index:9450;transform:translate(-50%,-140%);transition:transform .35s cubic-bezier(.2,.9,.3,1.2);width:min(92vw,380px);display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:18px;background:#fffffff2;color:#161823;box-shadow:0 8px 24px #0005;font:14px -apple-system,system-ui,sans-serif;cursor:pointer}#cc-parcel-pop.show{transform:translate(-50%,0)}#cc-parcel-pop img{width:42px;height:42px;border-radius:10px;image-rendering:pixelated;background:#fff4e2}#cc-parcel-pop b{display:block;font-size:14px}#cc-parcel-pop span{font-size:12px;color:#555}';document.head.append(pcss);document.body.append(pop);
let popT=0;function showPop(title,text,img){pop.innerHTML='<img src="'+img+'"><div><b>'+esc(title)+'</b><span>'+esc(text)+'</span></div>';pop.classList.add('show');clearTimeout(popT);popT=setTimeout(()=>pop.classList.remove('show'),5200)}
pop.onclick=()=>pop.classList.remove('show');
function arrived(o){showPop('📦 Your parcel has arrived!','It\'s '+o.spot.name+'. Walk to it and press E / 🐾 to open it.',parcelIcon());try{window.catCityVoice?.play('k05')}catch(e){}window.catCitySfx?.('reward');
 T.inbox('📦','Your parcel has arrived!',itemsText(o.items)+' · '+o.spot.name,null);core.note?.('📦 Parcel arrived '+o.spot.name+'!')}
let iconURL='';function parcelIcon(){if(iconURL)return iconURL;const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');g.fillStyle='#fff4e2';g.fillRect(0,0,32,32);drawBox(g,4,6,1);return iconURL=c.toDataURL()}
// A pixel cardboard box (front view), 24×22 at scale 1.
function drawBox(g,x,y,k){const P=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a*k,y+b*k,w*k,h*k)};P(0,4,24,18,'#5a3a22');P(1,5,22,16,'#c8955a');P(1,5,22,4,'#dcae74');P(-1,2,26,4,'#5a3a22');P(0,3,24,2,'#e8c088');P(10,2,4,20,'#5a3a22');P(11,3,2,18,'#e9e0c8');P(3,12,5,4,'#fff6e4');P(4,13,3,1,'#8a6a4a');P(4,15,2,1,'#8a6a4a')}
const busy=()=>core.bossMode||document.body.classList.contains('in-interior')||document.body.classList.contains('cc-in-interior-room')||document.body.classList.contains('start-menu-open')||!!window.catCityCaveState?.().inside||!!window.catCityCastleEscape?.open?.()||$('catcity-start-menu')?.classList.contains('show');
const near=()=>{let best=null,bd=56;for(const o of parcels()){const d=Math.hypot(s.x-o.spot.x,s.y-o.spot.y);if(d<bd){bd=d;best=o}}return best};
const oldDraw=core.draw;core.draw=function(){oldDraw.apply(this,arguments);if(busy())return;const L=parcels();if(!L.length)return;const g=core.ctx,W=core.W,H=core.H,t=performance.now()/1000;g.save();g.imageSmoothingEnabled=false;
 for(const o of L){const x=Math.round(o.spot.x-s.x+W/2),y=Math.round(o.spot.y-s.y+H/2);if(x<-60||y<-60||x>W+60||y>H+60)continue;
  g.fillStyle='rgba(20,14,30,.3)';g.fillRect(x-24,y+18,48,5);const hop=Math.round(Math.abs(Math.sin(t*2.2))*2);drawBox(g,x-24,y-26-hop,2);
  g.fillStyle='#ffd45c';g.fillRect(x-2,y-46-hop+Math.round(Math.sin(t*4)*2),4,8);g.fillRect(x-2,y-36-hop+Math.round(Math.sin(t*4)*2),4,3)}
 const n=near();if(n){const x=n.spot.x-s.x+W/2,y=n.spot.y-s.y+H/2;g.font='bold 13px system-ui';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#241832';g.strokeText('E / 🐾 · Open your parcel',x,y-58);g.fillStyle='#fff6e4';g.fillText('E / 🐾 · Open your parcel',x,y-58)}
 g.restore()};
const oldInteract=core.interact;core.interact=function(){if(!busy()&&!unbox.open){const o=near();if(o){openParcel(o);return}}return oldInteract.apply(this,arguments)};
setInterval(tickOrders,1000);tickOrders();

// ------------------------------------------------------------------ unboxing (first person)
const unbox={open:false};
const ucss=document.createElement('style');ucss.textContent=`
#cc-unbox{position:fixed;inset:0;z-index:9420;display:none;background:radial-gradient(circle at 50% 40%,#5b4a7a,#1d1530);touch-action:none;user-select:none;-webkit-user-select:none;font:15px -apple-system,system-ui,sans-serif;color:#fff6e4;cursor:none}
#cc-unbox.open{display:block}
#cc-unbox.open canvas{animation:ccZoomBox .55s cubic-bezier(.2,.9,.3,1)}
@keyframes ccZoomBox{from{transform:translate(-50%,-10%) scale(.18);opacity:.3}to{transform:translate(-50%,-50%) scale(1);opacity:1}}
#cc-unbox canvas{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);image-rendering:pixelated}
#cc-unbox .hint{position:absolute;left:0;right:0;top:calc(18px + env(safe-area-inset-top));text-align:center;font:800 18px system-ui;text-shadow:0 2px 6px #000}
#cc-unbox .hint small{display:block;font:600 13px system-ui;opacity:.85;margin-top:4px}
#cc-unbox .x{position:absolute;right:12px;top:calc(12px + env(safe-area-inset-top));width:40px;height:40px;border-radius:50%;border:2px solid #fff;background:#241832;color:#fff;font:900 16px system-ui;cursor:pointer}
#cc-unbox .take{position:absolute;left:50%;bottom:calc(30px + env(safe-area-inset-bottom));transform:translateX(-50%);display:none;padding:14px 26px;border-radius:24px;border:3px solid #fff6e4;background:#fe2c55;color:#fff;font:900 17px system-ui;cursor:pointer}
`;document.head.append(ucss);
const U=document.createElement('div');U.id='cc-unbox';U.className='cc-no-pixel';U.innerHTML='<canvas width="160" height="160"></canvas><div class="hint"></div><button class="x" type="button" aria-label="Close">✕</button><button class="take" type="button">Take it! 🎁</button>';document.body.append(U);
const cv=U.querySelector('canvas'),ug=cv.getContext('2d');
let order=null,stage='tape',cuts=[],flaps,drag=null,ptr={x:80,y:80,on:false,seen:false},raf=0,reveal=0,sparks=[];
const BX=20,BY2=20,BW=120;// the box seen from above: 20..140
function size(){const k=Math.max(2,Math.floor(Math.min(innerWidth,innerHeight*.8)/160));cv.style.width=160*k+'px';cv.style.height=160*k+'px';return k}
function openParcel(o){order=o;unbox.open=true;stage='tape';cuts=new Array(24).fill(false);flaps={l:0,r:0,t:0,b:0};drag=null;reveal=0;sparks=[];size();pop.classList.remove('show');U.classList.add('open');U.querySelector('.take').style.display='none';hint();document.body.classList.add('cc-unboxing');window.catCitySfx?.('pop');cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function hint(){const h=U.querySelector('.hint');h.innerHTML=stage==='tape'?'✂️ Cut the tape with your paw<small>Drag your paw along the tape, top to bottom</small>':stage==='long'?'👐 Drag the big flaps open<small>Pull each side outwards</small>':stage==='short'?'👐 Now the little flaps<small>Pull them up and down</small>':'🎁 '+esc(itemsText(order.items))}
function close(){U.classList.remove('open');unbox.open=false;cancelAnimationFrame(raf);document.body.classList.remove('cc-unboxing')}
U.querySelector('.x').onclick=e=>{e.stopPropagation();close()};
U.querySelector('.take').onclick=e=>{e.stopPropagation();take()};
function take(){if(!order)return;const got=[];for(const it of order.items){const c=BY[it.id];if(!c)continue;if(c.kind==='snack'){addRecipes();const sn=s.snacks=s.snacks||{};sn['ct_'+c.id]=(sn['ct_'+c.id]||0)+it.qty}else SH.stuff[c.id]=(SH.stuff[c.id]||0)+it.qty;got.push(c)}
 order.status='opened';order.openedAt=Date.now();core.persist();window.catCityCozy?.snackButton?.();window.catCitySfx?.('reward');close();
 const snacks=got.filter(c=>c.kind==='snack'),things=got.filter(c=>c.kind!=='snack');
 core.note?.('🎁 '+got.map(c=>c.icon+' '+c.name).join(', ')+(snacks.length?' · eat snacks from 🍲 Snacks':'')+(things.length?' · put things in your home from Cat Tok → Your orders → 🧸 My stuff':''));
 window.dispatchEvent(new CustomEvent('catcity:cattok-unboxed',{detail:order}));order=null}
function toBox(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*160,y:(e.clientY-r.top)/r.height*160}}
U.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const p=toBox(e);ptr={...p,on:true,seen:true};
 if(stage==='long'){if(flaps.l<1&&p.x>BX&&p.x<80&&p.y>BY2&&p.y<BY2+BW)drag={f:'l',x0:p.x,y0:p.y,p0:flaps.l};else if(flaps.r<1&&p.x>=80&&p.x<BX+BW&&p.y>BY2&&p.y<BY2+BW)drag={f:'r',x0:p.x,y0:p.y,p0:flaps.r}}
 else if(stage==='short'){if(flaps.t<1&&p.y<80&&p.y>BY2-4)drag={f:'t',x0:p.x,y0:p.y,p0:flaps.t};else if(flaps.b<1&&p.y>=80&&p.y<BY2+BW+4)drag={f:'b',x0:p.x,y0:p.y,p0:flaps.b}}
 cutAt(p)});
addEventListener('pointermove',e=>{if(!unbox.open)return;const p=toBox(e);ptr.x=p.x;ptr.y=p.y;ptr.seen=true;if(ptr.on)cutAt(p);
 if(drag){const d=drag.f==='l'?drag.x0-p.x:drag.f==='r'?p.x-drag.x0:drag.f==='t'?drag.y0-p.y:p.y-drag.y0;flaps[drag.f]=Math.max(0,Math.min(1,drag.p0+d/70))}});
addEventListener('pointerup',()=>{if(!unbox.open)return;ptr.on=false;if(drag){const f=drag.f;drag=null;const target=flaps[f]>.42?1:0;settle(f,target)}});
function settle(f,target){const step=()=>{flaps[f]+=(target-flaps[f])*.3;if(Math.abs(target-flaps[f])<.02){flaps[f]=target;if(target===1)window.catCitySfx?.('pop');check();return}requestAnimationFrame(step)};step()}
function check(){if(stage==='long'&&flaps.l===1&&flaps.r===1){stage='short';hint()}else if(stage==='short'&&flaps.t===1&&flaps.b===1){stage='open';hint();for(let i=0;i<28;i++)sparks.push({x:80,y:80,vx:(Math.random()-.5)*3,vy:-Math.random()*3-1,l:1});setTimeout(()=>{if(unbox.open)U.querySelector('.take').style.display='block'},700)}}
function cutAt(p){if(stage!=='tape'||!ptr.on)return;if(Math.abs(p.x-80)>9||p.y<BY2-2||p.y>BY2+BW+2)return;const i=Math.max(0,Math.min(23,Math.floor((p.y-BY2)/BW*24)));
 for(let j=i-1;j<=i+1;j++)if(j>=0&&j<24&&!cuts[j]){cuts[j]=true;if(Math.random()<.5)window.catCitySfx?.('chop')}
 if(cuts.filter(Boolean).length>=21){cuts.fill(true);stage='long';hint();window.catCitySfx?.('pop')}}
addEventListener('keydown',e=>{if(!unbox.open)return;if(e.key==='Escape'){e.preventDefault();close()}if((e.key==='Enter'||e.key===' ')&&stage==='open'){e.preventDefault();take()}},true);
addEventListener('resize',()=>{if(unbox.open)size()});
// drawing
const C={out:'#5a3a22',top:'#c8955a',lit:'#dcae74',dark:'#9a6c3e',in:'#3a2616',inLit:'#6a4a2e',inside:'#e8c088',tape:'#e9e0c8',tapeD:'#bfb49a'};
function R(x,y,w,h,c){ug.fillStyle=c;ug.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function loop(){if(!unbox.open)return;const t=performance.now()/1000;ug.clearRect(0,0,160,160);
 // table + shadow
 R(0,148,160,12,'#00000033');R(BX+4,BY2+BW+2,BW,6,'#00000044');
 // inside of the box (seen when flaps open)
 R(BX,BY2,BW,BW,C.out);R(BX+2,BY2+2,BW-4,BW-4,C.in);R(BX+2,BY2+2,BW-4,8,C.inLit);
 // tissue paper + the item
 const anyOpen=flaps.l>0||flaps.r>0;if(anyOpen){R(BX+10,BY2+14,BW-20,BW-26,'#f7cfdc');R(BX+14,BY2+18,BW-28,8,'#fde6ee');
  const first=order?.items?.[0];if(first&&ART[first.id]){if(stage==='open')reveal=Math.min(1,reveal+.025);const lift=Math.round(reveal*14),sc=2+Math.round(reveal),tmp=document.createElement('canvas');tmp.width=tmp.height=32;const tg=tmp.getContext('2d');ART[first.id](tg);ug.imageSmoothingEnabled=false;ug.drawImage(tmp,80-16*sc,80-16*sc-lift+(stage==='open'?Math.round(Math.sin(t*3)*2):0),32*sc,32*sc)}}
 // short flaps (under the long ones): top and bottom, hinge on the box edge
 flapV('t',BY2,1);flapV('b',BY2+BW,-1);
 // long flaps: left hinge at BX, right hinge at BX+BW, they meet in the middle
 flapH('l',BX,1);flapH('r',BX+BW,-1);
 // tape across the middle seam
 if(stage==='tape'||flaps.l<.05&&flaps.r<.05){for(let i=0;i<24;i++){const y=BY2+i*BW/24;if(cuts[i]){R(73,y,5,BW/24,C.tape);R(82,y,5,BW/24,C.tape);R(77,y,1,BW/24,C.tapeD);R(82,y,1,BW/24,C.tapeD)}else{R(73,y,14,BW/24,C.tape);R(73,y+BW/24-1,14,1,C.tapeD)}}
  R(70,BY2-4,20,4,C.tape);R(70,BY2+BW,20,4,C.tape)}
 // label sticker
 if(flaps.r<.1)R(BX+BW-38,BY2+BW-26,26,16,'#fff6e4'),R(BX+BW-35,BY2+BW-22,18,2,'#8a6a4a'),R(BX+BW-35,BY2+BW-17,12,2,'#8a6a4a');
 // sparkles
 for(const p of sparks){p.x+=p.vx;p.y+=p.vy;p.vy+=.06;p.l-=.012;if(p.l>0)R(p.x,p.y,2,2,p.l>.5?'#ffd45c':'#fff6e4')}sparks=sparks.filter(p=>p.l>0);
 // the paw (claws out while cutting)
 if(ptr.seen)paw(ptr.x,ptr.y,stage==='tape');
 raf=requestAnimationFrame(loop)}
function flapH(f,hinge,dir){const p=flaps[f],ang=p*Math.PI,len=BW/2,ext=Math.cos(ang)*len;// ext>0: lying over the box, <0: folded out
 const x0=hinge,x1=hinge+dir*ext;const lo=Math.min(x0,x1),w=Math.abs(x1-x0);if(w<1)return;
 const outside=ext<0,shade=Math.abs(Math.cos(ang));R(lo,BY2,w,BW,C.out);
 R(lo+1,BY2+1,Math.max(0,w-2),BW-2,outside?(shade>.6?C.inside:'#c9a070'):(shade>.6?C.top:C.dark));
 if(!outside&&shade>.6)R(lo+1,BY2+1,Math.max(0,w-2),3,C.lit)}
function flapV(f,hinge,dir){const p=flaps[f],ang=p*Math.PI,len=BW*.32,ext=Math.cos(ang)*len;const y0=hinge,y1=hinge+dir*ext;const lo=Math.min(y0,y1),h=Math.abs(y1-y0);if(h<1)return;
 const outside=ext<0,shade=Math.abs(Math.cos(ang));R(BX,lo,BW,h,C.out);R(BX+1,lo+1,BW-2,Math.max(0,h-2),outside?(shade>.6?C.inside:'#c9a070'):(shade>.6?C.dark:'#8a5e34'))}
function paw(x,y,claws){x=Math.round(x);y=Math.round(y);const o='#241832',f=core.cats?.[s.cat||0]?.coat||'#e9953c',pad='#f7a6bd';
 R(x-5,y-1,11,9,o);R(x-4,y,9,7,f);R(x-2,y+2,5,4,pad);
 for(const [dx,dy] of [[-6,-5],[-2,-8],[2,-8],[5,-5]]){R(x+dx,y+dy,4,4,o);R(x+dx+1,y+dy+1,2,2,pad);if(claws){R(x+dx+1,y+dy-2,1,2,'#fff6e4')}}}

// ------------------------------------------------------------------ Fish Catch (the Purrstation Pocket)
function fishCatch(){if($('cc-fishcatch'))return;const d=document.createElement('div');d.id='cc-fishcatch';d.className='cc-no-pixel';
 d.style.cssText='position:fixed;inset:0;z-index:9430;background:#120b1cee;display:flex;align-items:center;justify-content:center;touch-action:none;font:15px system-ui;color:#fff';
 d.innerHTML='<div style="background:#7d5fd0;border:4px solid #241832;border-radius:26px;padding:16px 16px 22px;box-shadow:0 10px 0 #241832"><div style="font:900 13px system-ui;color:#fff6e4;margin-bottom:6px;text-align:center">PURRSTATION POCKET</div><canvas width="120" height="96" style="display:block;width:min(80vw,360px);image-rendering:pixelated;border:4px solid #241832;border-radius:6px;background:#7fd6ff"></canvas><div data-s style="text-align:center;margin-top:8px;font:800 14px system-ui">Catch the fish! ◀ ▶ or drag</div><button data-x style="display:block;margin:10px auto 0;padding:8px 18px;border-radius:16px;border:2px solid #fff;background:#241832;color:#fff;font:800 14px system-ui">Turn off</button></div>';
 document.body.append(d);const c=d.querySelector('canvas'),g=c.getContext('2d');let px=60,score=0,fishes=[],t0=performance.now(),last=t0,run=true,left=false,right=false,best=SH.fishBest||0;
 const k=e=>{if(e.key==='ArrowLeft'||e.key==='a'){left=e.type==='keydown';e.preventDefault()}if(e.key==='ArrowRight'||e.key==='d'){right=e.type==='keydown';e.preventDefault()}if(e.key==='Escape')stop()};
 addEventListener('keydown',k,true);addEventListener('keyup',k,true);
 c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();px=(e.clientX-r.left)/r.width*120});c.addEventListener('pointerdown',e=>{const r=c.getBoundingClientRect();px=(e.clientX-r.left)/r.width*120});
 function stop(){run=false;removeEventListener('keydown',k,true);removeEventListener('keyup',k,true);d.remove()}
 d.querySelector('[data-x]').onclick=stop;
 const P=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),w,h)};
 function frame(now){if(!run)return;const dt=Math.min(.05,(now-last)/1000);last=now;const el=(now-t0)/1000,leftT=Math.max(0,30-el);
  if(left)px-=90*dt;if(right)px+=90*dt;px=Math.max(8,Math.min(112,px));
  if(leftT>0&&Math.random()<dt*(1.6+el/12))fishes.push({x:6+Math.random()*108,y:-6,v:24+Math.random()*20+el,gold:Math.random()<.12});
  P(0,0,120,96,'#7fd6ff');P(0,80,120,16,'#3f8fc8');for(let i=0;i<6;i++)P((i*23+el*10)%130-10,84+(i%2)*5,10,1,'#bfe8ff');
  for(const f of fishes){f.y+=f.v*dt;P(f.x-4,f.y-2,8,4,f.gold?'#ffd45c':'#ff8a3c');P(f.x+4,f.y-3,2,6,f.gold?'#ffd45c':'#ff8a3c');P(f.x-2,f.y-1,1,1,'#241832');
   if(!f.got&&f.y>66&&f.y<80&&Math.abs(f.x-px)<10){f.got=true;score+=f.gold?5:1;window.catCitySfx?.('coin')}}
  fishes=fishes.filter(f=>!f.got&&f.y<100);
  const col=core.cats?.[s.cat||0]?.coat||'#e9953c';P(px-7,68,14,10,'#241832');P(px-6,69,12,8,col);P(px-6,65,4,4,'#241832');P(px+2,65,4,4,'#241832');P(px-5,66,2,3,col);P(px+3,66,2,3,col);P(px-3,71,1,1,'#241832');P(px+2,71,1,1,'#241832');
  d.querySelector('[data-s]').textContent=leftT>0?'🐟 '+score+'  ·  ⏱ '+Math.ceil(leftT)+'s  ·  Best '+best:'Time! You caught '+score+' fish'+(score>best?' · NEW BEST! 🏆':'');
  if(leftT<=0&&!d.dataset.done){d.dataset.done='1';if(score>best){SH.fishBest=score;core.persist()}}
  requestAnimationFrame(frame)}
 requestAnimationFrame(frame)}

// ------------------------------------------------------------------ hook into Cat Tok
T.pageHooks.shop=el=>shopPage(el);
T.pageHooks.orders=()=>ordersPage();
window.CatTokShop={catalog:CAT,byId:BY,buy,art,open:id=>{T.open?.();setTimeout(()=>{T.go?.('shop');if(id)product(id)},500)},orders:()=>SH.orders,priceOf,flash,addToBasket,placeOrder};
window.dispatchEvent(new CustomEvent('catcity:cattok-shop-ready'));
};
if(window.CatTok&&window.__catCityEngine)start();else{addEventListener('catcity:cattok-lives-ready',start,{once:true});const iv=setInterval(()=>{if(window.CatTok&&window.__catCityEngine){clearInterval(iv);start()}},500)}
})();

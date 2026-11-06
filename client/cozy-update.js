/* Cat City — the cosy update (6 Nov 2026).
 *
 * 1. Cooking: harvested crops go into a pantry. Cook them at the 🍲 pot by the
 *    Village Garden or in any home into snacks that refill hearts (🍲 button).
 *    Seasonal crops live in playtest-features.js.
 * 2. Mission 4 "The Broken Panel": after Mission 3 the Admin writes to you.
 *    Win back 4 code shards from glitch Wranglers in 4 biomes, then a
 *    cutscene: the panel works again and shows the empty castle.
 * 3. Homes: a 📒 catalogue in every home to buy furniture and adopt a pet;
 *    in online rooms you can visit other players' homes (server: set_home).
 * 4. Daily jobs: three small jobs a day with a streak bonus.
 * 5. Wrangler Raid: when the owner starts the "🧶 Wrangler Raid" event, waves
 *    of Wranglers attack the village; fight them off together.
 * 6. Sound effects (Settings toggle) and new garden, home and raid music.
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,T=core.T,$=id=>document.getElementById(id);
const PT=()=>window.catCityPlaytest;
const busy=()=>core.bossMode||document.body.classList.contains('in-interior')||document.body.classList.contains('cc-in-interior-room')||document.body.classList.contains('cc-in-castle')||$('catcity-start-menu')?.classList.contains('show')||!!window.catCityCastleEscape?.open?.()||!!window.catCityCaveState?.().inside;
const coarse=()=>matchMedia('(pointer:coarse)').matches;
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
const css=document.createElement('style');css.textContent=[
 '#cc-cz-snack{position:fixed;left:10px;bottom:calc(170px + env(safe-area-inset-bottom));z-index:42;display:none;min-height:44px;padding:6px 12px;border-radius:14px;border:2px solid #fff6e4;background:#ffd45c;color:#3a2440;font:bold 14px system-ui;box-shadow:0 3px 0 #0004}',
 '#cc-cz-snack.show{display:block}',
 '@media(pointer:coarse){#cc-cz-snack{left:auto;right:10px;bottom:calc(250px + env(safe-area-inset-bottom))}}',
 '#cc-cz-attack{position:fixed;right:12px;bottom:calc(310px + env(safe-area-inset-bottom));z-index:43;display:none;width:96px;min-height:58px;border:2px solid #fff;border-radius:18px;background:#ec9acf;color:#3c2347;font:900 15px system-ui;box-shadow:0 3px 0 #0005}',
 '#cc-cz-attack.show{display:block}',
 '@media(pointer:fine){#cc-cz-attack{bottom:calc(120px + env(safe-area-inset-bottom))}}',
 '#cc-cz-scene{position:fixed;inset:0;z-index:9400;background:#000;display:none}#cc-cz-scene.open{display:block}',
 '#cc-cz-scene canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated}',
 '#cc-cz-say{position:absolute;left:50%;bottom:8%;transform:translateX(-50%);max-width:88vw;padding:10px 16px;border-radius:14px;background:#120b1ce6;border:3px solid #ffd45c;color:#fff6e4;font:bold 17px system-ui;text-align:center;display:none}',
 '#cc-cz-skip{position:absolute;right:12px;top:calc(12px + env(safe-area-inset-top));min-height:40px;padding:6px 12px;border-radius:12px;border:2px solid #fff6e4;background:#33224acc;color:#fff6e4;font:bold 13px system-ui}',
 '.cc-cz-list{display:flex;flex-direction:column;gap:4px;margin-top:6px}.cc-cz-list button{margin:0!important}',
 '.cc-cz-row{display:flex;justify-content:space-between;gap:8px;text-align:left;padding:4px 0;border-bottom:1px dashed #ffd45c44}'
].join('\n');document.head.append(css);
const mk=(tag,id,html,parent=document.body)=>{const e=document.createElement(tag);if(id)e.id=id;if(html)e.innerHTML=html;parent.append(e);return e};

// A small dialog (same look as the playtest dialogs).
const dlg=mk('div','cc-cz-dlg','<div><div class="big" id="cc-cz-icon"></div><h3 id="cc-cz-title"></h3><div id="cc-cz-body"></div><div id="cc-cz-btns" class="cc-cz-list"></div></div>');dlg.className='cc-pf-dialog';
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.classList.remove('open')});
function dialog(icon,title,body,buttons){$('cc-cz-icon').textContent=icon;$('cc-cz-title').textContent=title;$('cc-cz-body').innerHTML=body;const box=$('cc-cz-btns');box.replaceChildren();
 for(const [label,fn,alt,keep] of buttons){const b=document.createElement('button');b.type='button';b.textContent=label;if(alt)b.className='alt';b.onclick=()=>{if(!keep)dlg.classList.remove('open');fn?.()};box.append(b)}dlg.classList.add('open')}
const dlgOpen=()=>dlg.classList.contains('open')||$('cc-pf-dlg')?.classList.contains('open');

// ================================================================== 6. SOUND EFFECTS
const sfxOn=()=>{try{return localStorage.getItem('catcity_sfx')!=='off'}catch(e){return true}};
let ownCtx=null;
function actx(){const c=window.catCityAudio?.ctx?.();if(c)return c;if(!ownCtx){try{ownCtx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}return ownCtx}
addEventListener('pointerdown',()=>{if(ownCtx?.state==='suspended')ownCtx.resume()},{passive:true});
const SFX={
 hurt:{n:[330,196],d:.12,w:'square',v:.16},heal:{n:[523,659,784],d:.08,w:'triangle',v:.18},
 plant:{n:[392,523],d:.07,w:'triangle',v:.16},water:{n:[1046,880,740,622],d:.04,w:'sine',v:.12},
 harvest:{n:[523,659,784,1046],d:.06,w:'square',v:.1},quest:{n:[523,784],d:.1,w:'triangle',v:.18},
 reward:{n:[523,659,784,1046,1318],d:.07,w:'square',v:.1},pop:{n:[988],d:.035,w:'sine',v:.07},
 hit:{n:[220,110],d:.06,w:'square',v:.14},horn:{n:[196,196,147,196],d:.18,w:'sawtooth',v:.1},
 shard:{n:[988,1318,1568,1976],d:.06,w:'triangle',v:.15},cook:{n:[392,494,587,784],d:.08,w:'triangle',v:.16},
 coin:{n:[988,1318],d:.06,w:'square',v:.09},ko:{n:[392,330,262,196],d:.14,w:'triangle',v:.18},buy:{n:[659,988],d:.07,w:'square',v:.09}
};
let lastSfx={};
window.catCitySfx=name=>{const f=SFX[name];if(!f||!sfxOn())return;const now=performance.now();if(now-(lastSfx[name]||0)<60)return;lastSfx[name]=now;
 const c=actx();if(!c||c.state==='closed')return;if(c.state==='suspended')c.resume?.();
 const vol=f.v*(0.4+0.6*(window.catCityAudio?.volume?.()??0.8));let t=c.currentTime+.01;
 for(const hz of f.n){const o=c.createOscillator(),g=c.createGain();o.type=f.w;o.frequency.setValueAtTime(hz,t);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+f.d*1.6);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+f.d*1.7);t+=f.d}};
window.addEventListener('catcity:knockout',e=>{if(e.detail?.world)window.catCitySfx('ko')});

// New music: the garden, homes and the Wrangler raid.
const ST=window.catCitySoundtrack;
ST?.extra('garden',{name:'Garden Rows',bpm:96,chords:['C','Am','F','G','C','Em','F','G'],lead:'triangle',pad:true,soft:true,arp:[0,2,1,2],drums:'k.......k.......',hat:'....h.......h...',
 mel:`E5 - - - G5 - E5 - D5 - C5 - D5 - - - | C5 - - - E5 - A5 - G5 - E5 - C5 - - - | A4 - C5 - F5 - - - E5 - D5 - C5 - A4 - | B4 - - - D5 - G5 - F5 - D5 - B4 - - - |
  E5 - G5 - C6 - - - B5 - G5 - E5 - - - | G5 - - - E5 - B4 - E5 - G5 - B5 - - - | A5 - - - F5 - C5 - F5 - A5 - G5 - F5 - | E5 - D5 - B4 - G4 - C5 - - - - - . .`});
ST?.extra('home',{name:'Home Sweet Home',bpm:78,chords:['F','Dm','Gm','C','F','Am','Bb','C'],lead:'sine',bell:true,pad:true,soft:true,arp:[0,1,2,1],drums:'................',hat:'........h.......',
 mel:`C5 - - - A4 - - - F4 - A4 - C5 - - - | D5 - - - F5 - - - A5 - - - - - . . | Bb4 - - - D5 - - - G5 - F5 - D5 - - - | C5 - - - E5 - - - G5 - - - - - . . |
  A5 - - - G5 - F5 - C5 - - - F5 - - - | E5 - - - C5 - - - A4 - C5 - E5 - - - | D5 - - - F5 - Bb5 - A5 - - - G5 - - - | F5 - - - - - - - . . . . . . . .`});
ST?.extra('raid',{name:'Wrangler Raid!',bpm:144,chords:['Em','C','D','B','Em','C','Am','B'],lead:'square',pad:true,dark:true,arp:[0,1,2,1],drums:'k...s...k.k.s...',hat:'h.h.h.h.h.h.h.h.',
 mel:`E5 - E5 - G5 - E5 - B5 - - - A5 - G5 - | E5 - E5 - G5 - E5 - C6 - - - B5 - G5 - | F#5 - F#5 - A5 - F#5 - D6 - - - C6 - A5 - | B5 - - - D#5 - F#5 - B5 - - - . . . . |
  E5 - G5 - B5 - E6 - D6 - B5 - G5 - E5 - | C6 - - - G5 - E5 - C5 - E5 - G5 - - - | A5 - - - C6 - A5 - E5 - A5 - C6 - B5 - | B5 - - - D#5 - - - E5 - - - - - . .`});
const HOME_ROOMS=['home','Rose Cottage','Lavender Lodge','Golden Villa'];
window.catCityMusicHint=()=>{
 const rid=window.catCityInteriors?.roomId;if(rid&&(HOME_ROOMS.includes(rid)||rid==='visit'))return 'home';
 if(raidActive()&&inVillage())return 'raid';
 const G=PT()?.garden;if(G&&Math.hypot(s.x-G.x-48,s.y-G.y-26)<260)return 'garden';
 return null};

// ================================================================== 1. COOKING
s.pantry=s.pantry&&typeof s.pantry==='object'?s.pantry:{};
s.snacks=s.snacks&&typeof s.snacks==='object'?s.snacks:{};
const crop=k=>PT()?.crops?.[k]||{name:k,icon:'🌱',price:4};
const RECIPES=[
 {id:'stew',icon:'🐟',name:'Fish Stew',need:{carrot:1},fish:10,heal:2},
 {id:'cake',icon:'🍰',name:'Carrot Cake',need:{carrot:2},heal:2},
 {id:'tea',icon:'🍵',name:'Catnip Tea',need:{catnip:2},heal:1},
 {id:'pie',icon:'🥧',name:'Pumpkin Pie',need:{pumpkin:1,carrot:1},heal:3},
 {id:'tart',icon:'🍓',name:'Strawberry Tart',need:{strawberry:2},heal:99},
 {id:'cookies',icon:'🍪',name:'Sunflower Cookies',need:{sunflower:2},heal:99},
 {id:'soup',icon:'🍲',name:'Mushroom Soup',need:{mushroom:2},heal:99},
 {id:'pudding',icon:'🍮',name:'Snowberry Pudding',need:{snowberry:2},heal:99}
];
const healText=r=>r.heal>=99?'all hearts':'+'+r.heal+' ❤️';
const canCook=r=>Object.entries(r.need).every(([k,v])=>(s.pantry[k]||0)>=v)&&(s.fish||0)>=(r.fish||0);
const needText=r=>Object.entries(r.need).map(([k,v])=>v+' '+crop(k).icon).join(' + ')+(r.fish?' + '+r.fish+' 🐟':'');
function pantryText(){const e=Object.entries(s.pantry).filter(([,v])=>v>0);return e.length?e.map(([k,v])=>crop(k).icon+' '+v).join(' · '):'Empty: grow crops in the Village Garden!'}
function cook(){
 const list=RECIPES.filter(r=>r.need.carrot||r.need.catnip||r.need.pumpkin||(s.pantry[Object.keys(r.need)[0]]||0)>0||Object.keys(r.need).some(k=>crop(k).season===PT()?.season?.()));
 dialog('🍲','Cooking pot','<b>Pantry:</b> '+pantryText()+'<br><small>Snacks go in your bag: tap 🍲 to eat one when you\'re hurt.</small>',[
  ...list.map(r=>[(canCook(r)?'':'🔒 ')+r.icon+' '+r.name+' · '+needText(r)+' → '+healText(r),()=>{
   if(!canCook(r)){core.note('🧺 You need '+needText(r)+' for '+r.name+'.');return}
   for(const [k,v] of Object.entries(r.need))s.pantry[k]-=v;if(r.fish)s.fish-=r.fish;s.snacks[r.id]=(s.snacks[r.id]||0)+1;core.persist();window.catCitySfx('cook');
   window.dispatchEvent(new CustomEvent('catcity:cooked',{detail:{recipe:r.id}}));core.note(r.icon+' You cooked '+r.name+'! It\'s in your snacks.');snackBtn();cook()},false,true]),
  ['🧺 Sell crops for fish',sellCrops,true],['Close',null,true]]);
}
function sellCrops(){const e=Object.entries(s.pantry).filter(([,v])=>v>0);if(!e.length){core.note('🧺 Your pantry is empty.');return}
 dialog('🧺','Sell crops','Marmalade buys crops for her shop.',[...e.map(([k,v])=>[crop(k).icon+' Sell '+v+' '+crop(k).name+' · '+(v*crop(k).price)+' 🐟',()=>{s.fish=(s.fish||0)+v*crop(k).price;s.pantry[k]=0;core.persist();window.catCitySfx('coin');core.note('🐟 Sold '+v+' '+crop(k).name+' for '+v*crop(k).price+' fish.');sellCrops()},false,true]),['◀ Back',cook,true]])}
window.catCityCook=cook;
// Eating snacks
const snack=mk('button','cc-cz-snack');snack.type='button';
function snackCount(){return Object.values(s.snacks).reduce((a,b)=>a+(b>0?b:0),0)}
function snackBtn(){const n=snackCount();snack.textContent='🍲 Snacks · '+n;snack.classList.toggle('show',n>0&&!busy())}
snack.onclick=()=>{const have=RECIPES.filter(r=>(s.snacks[r.id]||0)>0);if(!have.length)return;
 dialog('🍲','Your snacks','Hearts: '+(PT()?.hearts()??'?')+' / '+(PT()?.max()??'?'),[...have.map(r=>[r.icon+' Eat '+r.name+' ('+s.snacks[r.id]+') · '+healText(r),()=>{s.snacks[r.id]--;window.catCityHeal?.(r.heal>=99?99:r.heal);core.persist();core.note(r.icon+' Yum! '+r.name+' · '+healText(r));snackBtn()}]),['Close',null,true]])};
// The outdoor pot sits just below the garden.
const POT=()=>{const G=PT()?.garden||{x:42,y:726};return {x:G.x+48,y:G.y+104}};
function drawPot(g,t){const P=POT();const x=Math.round(P.x),y=Math.round(P.y);
 g.fillStyle='#5b5f6b';g.fillRect(x-14,y+8,28,4);for(let i=0;i<3;i++){g.fillStyle=i%2?'#ff9d3c':'#ffd65c';g.fillRect(x-8+i*6,y+5+((Math.floor(t*6)+i)%2),4,4)}
 g.fillStyle='#2a1d33';g.fillRect(x-15,y-12,30,18);g.fillStyle='#3d3448';g.fillRect(x-14,y-11,28,16);g.fillStyle='#e8a050';g.fillRect(x-12,y-13,24,4);
 for(let i=0;i<3;i++){const k=(t*0.8+i/3)%1;g.globalAlpha=1-k;g.fillStyle='#ffffff';g.fillRect(x-6+i*6,y-18-k*16,3,3)}g.globalAlpha=1}
const nearPot=()=>{const P=POT();return Math.hypot(s.x-P.x,s.y-P.y)<44};

// ================================================================== 3. HOMES: furniture, pets, visits
s.homeDecor=s.homeDecor&&typeof s.homeDecor==='object'?s.homeDecor:{};
const FLOOR={lamp:['💡 Floor lamp',40],globe:['🌍 Globe',60],trophy:['🏆 Trophy',80],teddy:['🧸 Teddy',30],lantern:['🏮 Lantern',45],chest:['🧰 Toy chest',50],plant:['🪴 Plant',20],crystal:['🔮 Crystal ball',120],candles:['🕯️ Candles',25],cushion:['🛋️ Cushion',25]};
const WALL={painting_sea:['🖼️ Sea painting',35],painting_rose:['🖼️ Rose painting',35],moonwindow:['🌙 Moon window',70],ribbon:['🎀 Ribbon',15],clock:['🕰️ Clock',40]};
const PETS={goldfish:['🐠 Goldfish',80],bunny:['🐰 Bunny',150],hamster:['🐹 Hamster',120],bird:['🐦 Bird',140],puppy:['🐶 Puppy',200]};
const FS=[[140,74],[172,74],[100,90],[204,92],[100,110],[64,114]],WS=[[176,26],[94,28]];
const decorOf=id=>{const d=s.homeDecor[id]||(s.homeDecor[id]={floor:[],wall:[],pet:null});d.floor=Array.isArray(d.floor)?d.floor:[];d.wall=Array.isArray(d.wall)?d.wall:[];return d};
function drawFloor(kit,id,x,y,t){const {SPR}=kit,g=window.catCityInteriors.kit.ctx(),R=window.catCityInteriors.kit.R;
 if(id==='lamp')SPR.lamp(x,y-16);else if(id==='globe')SPR.globe(x,y);else if(id==='trophy')SPR.trophy(x,y+2);else if(id==='teddy')SPR.teddy(x,y);else if(id==='lantern')SPR.lantern(x,y,t);else if(id==='chest')SPR.chest(x-3,y+2);else if(id==='plant')SPR.plant(x,y);else if(id==='crystal')SPR.crystalBall(x-2,y+2,t);
 else if(id==='candles'){SPR.candle(x+2,y+10,t);SPR.candle(x+9,y+12,t+.3)}
 else if(id==='cushion'){R(x-1,y+9,20,11,'#2a1d33');R(x,y+10,18,9,'#e47c9a');R(x+2,y+11,14,2,'#f7cfdc');R(x+8,y+13,2,2,'#c94c5a')}}
function drawWall(kit,id,x,y,t){const {SPR}=kit,R=window.catCityInteriors.kit.R;
 if(id==='painting_sea')SPR.painting(x,y,'#7ec8e3');else if(id==='painting_rose')SPR.painting(x,y,'#f7a6bd');else if(id==='moonwindow')SPR.moonWindow(x-4,y-4);else if(id==='ribbon')SPR.ribbon(x+4,y+2);
 else if(id==='clock'){R(x+2,y,16,16,'#2a1d33');R(x+3,y+1,14,14,'#fff3d0');R(x+9,y+3,2,6,'#2a1d33');const a=t*.5;R(x+10+Math.round(Math.cos(a)*4),y+8+Math.round(Math.sin(a)*4),2,2,'#c94c5a')}}
function drawPet(kind,t,R){
 if(kind==='goldfish'){const x=258,y=114;R(x-1,y+5,24,17,'#2a1d33');R(x,y+6,22,15,'#bfe8ff');R(x,y+12,22,9,'#7ec8e3');const fx=x+4+Math.round((Math.sin(t*1.3)+1)*6);R(fx,y+13,5,3,'#ff8a3c');R(fx+(Math.cos(t*1.3)>0?-2:5),y+13,2,3,'#ff8a3c');R(x-2,y+21,26,3,'#7a5235');return {x:269,y:138}}
 if(kind==='bird'){const x=160+Math.round(Math.sin(t*.6)*90),y=40+Math.round(Math.sin(t*1.7)*10),f=Math.floor(t*8)%2;R(x,y,8,6,'#5ab0e0');R(x+6,y+1,3,2,'#ffd45c');R(x+2,y-(f?2:0),4,2,'#3b8ac0');R(x+5,y+1,1,1,'#2a1d33');return {x,y:200}}
 const px=160+Math.round(Math.sin(t*.45)*56),py=150+Math.round(Math.sin(t*.8)*10),hop=kind==='bunny'?Math.abs(Math.round(Math.sin(t*5)*3)):0,dir=Math.cos(t*.45)>0?1:-1;
 if(kind==='bunny'){R(px-6,py-9-hop,12,8,'#f4efe2');R(px+(dir>0?3:-7),py-14-hop,3,6,'#f4efe2');R(px+(dir>0?6:-4),py-14-hop,2,6,'#f4efe2');R(px+(dir>0?4:-5),py-7-hop,1,1,'#2a1d33');R(px+(dir>0?-8:6),py-7-hop,3,3,'#ffffff')}
 else if(kind==='hamster'){R(px-5,py-7,10,7,'#e8b06a');R(px-4,py-4,8,3,'#fff3d0');R(px+(dir>0?2:-3),py-6,1,1,'#2a1d33');R(px-4,py-8,2,2,'#e8b06a');R(px+2,py-8,2,2,'#e8b06a')}
 else{R(px-8,py-10,16,9,'#c8955a');R(px+(dir>0?5:-11),py-14,7,7,'#c8955a');R(px+(dir>0?9:-9),py-13,2,4,'#7a5235');R(px+(dir>0?9:-8),py-11,1,1,'#2a1d33');R(px+(dir>0?-10:8),py-12,2,4,'#c8955a');R(px-6,py-2,3,3,'#7a5235');R(px+3,py-2,3,3,'#7a5235')}
 return {x:px,y:py}}
window.catCityHomeExtras=(o,kit)=>{
 const {item,SPR,say}=kit;const R=window.catCityInteriors.kit.R;const out=[];
 const visit=o.visit,D=visit||decorOf(o.id);
 (D.wall||[]).slice(0,2).forEach((w,i)=>{const [x,y]=WS[i];out.push(item({x,y,w:20,h:16,draw:t=>drawWall(kit,w,x,y,t),solid:false,wall:true}))});
 (D.floor||[]).slice(0,6).forEach((f,i)=>{const [x,y]=FS[i];out.push(item({x,y,w:16,h:20,draw:t=>drawFloor(kit,f,x,y,t),solid:false,base:y+20}))});
 if(D.pet){let last={x:160,y:150};const pet=item({x:0,y:0,w:1,h:1,solid:false,draw:t=>{last=drawPet(D.pet,t,R)},label:'Pet your '+(PETS[D.pet]?.[0]||'pet').replace(/^\S+\s/,'').toLowerCase(),use:()=>{say(visit?'💕 '+(PETS[D.pet]?.[0]||'pet')+' loves the attention!':'💕 You pet your '+(PETS[D.pet]?.[0]||'pet')+'. It looks so happy!');window.catCitySfx('heal')}});
  // The pet moves, so where it's drawn and where you stand to pet it follow it.
  Object.defineProperties(pet,{base:{get:()=>D.pet==='bird'?260:last.y},useX:{get:()=>D.pet==='goldfish'?269:last.x},useY:{get:()=>D.pet==='goldfish'?140:D.pet==='bird'?190:last.y+8}});out.push(pet)}
 if(visit)return out;
 out.push(item({x:226,y:92,w:14,h:20,draw:()=>{R(229,98,8,14,'#7a5235');R(225,92,16,8,'#2a1d33');R(226,93,14,6,'#f4efe2');R(232,93,1,6,'#c9963a')},label:'📒 Home catalogue: furniture, pets & visits',use:()=>{kit.leave(true);catalogue(o.id)},useX:233,useY:120}));
 if(!o.kitchen)out.push(item({x:58,y:146,w:32,h:28,draw:t=>SPR.cauldron(58,146,t),label:'🍲 Cook something tasty',use:()=>{kit.leave(true);cook()},useX:74,useY:182}));
 return out};
function catalogue(home){const D=decorOf(home);
 dialog('📒','Home catalogue','You have 🐟 '+Math.floor(s.fish||0)+'. Furniture: '+D.floor.length+'/6 · Wall: '+D.wall.length+'/2 · Pet: '+(D.pet?PETS[D.pet][0]:'none'),[
  ['🪑 Furniture',()=>shop(home,'floor')],['🖼️ Wall decorations',()=>shop(home,'wall')],['🐾 Adopt a pet',()=>shop(home,'pet')],
  ['🏡 Visit a friend\'s home',visitMenu,true],['📦 Clear this room (half refund)',()=>{let back=0;for(const f of D.floor)back+=FLOOR[f]?.[1]||0;for(const w of D.wall)back+=WALL[w]?.[1]||0;back=Math.floor(back/2);D.floor=[];D.wall=[];s.fish=(s.fish||0)+back;core.persist();core.note('📦 Room cleared · +'+back+' 🐟');shareHome(home)},true],
  ['🏠 Back inside',()=>window.catCityInteriors.enter(home),true]])}
function shop(home,kind){const D=decorOf(home),list=kind==='floor'?FLOOR:kind==='wall'?WALL:PETS,full=kind==='floor'?D.floor.length>=6:kind==='wall'?D.wall.length>=2:false;
 dialog(kind==='pet'?'🐾':kind==='wall'?'🖼️':'🪑',kind==='pet'?'Adopt a pet':kind==='wall'?'Wall decorations':'Furniture',(full?'<b>This room is full:</b> clear it in the catalogue to change things.<br>':'')+'You have 🐟 '+Math.floor(s.fish||0),[
  ...Object.entries(list).map(([id,[name,cost]])=>[name+' · '+cost+' 🐟'+(kind==='pet'&&D.pet===id?' (yours)':''),()=>{
   if(full){core.note('📦 This room is full.');return}if(kind==='pet'&&D.pet===id)return;if((s.fish||0)<cost){core.note('🐟 You need '+cost+' fish.');return}
   s.fish-=cost;if(kind==='pet')D.pet=id;else D[kind].push(id);core.persist();window.catCitySfx('buy');shareHome(home);core.note((kind==='pet'?'💕 Welcome home, ':'🏡 Placed: ')+name+'!');window.catCityInteriors.enter(home)}]),
  ['◀ Back',()=>catalogue(home),true]])}
// Visiting: your most recently decorated home is shared with your online room.
function shareHome(home){s.sharedHome=home;core.persist();lastSent=''}
let lastSent='',lastMe=null;
function homePacket(){const id=s.sharedHome||[...(s.houses||[])].pop()||'home',D=decorOf(id);return {house:id,floor:D.floor.slice(0,6),wall:D.wall.slice(0,2),pet:D.pet||null}}
setInterval(()=>{if(!window.catCityOnlineConnected?.()||!window.catCityOnlineRoomInfo?.()?.code)return;const me=window.catCityOnlineMe?.();const p=JSON.stringify(homePacket());if(p===lastSent&&me===lastMe)return;lastSent=p;lastMe=me;window.catCityOnlineSend?.({type:'set_home',home:JSON.parse(p)})},4000);
const HOUSE_LOOK={home:{name:'Cosy Cat House',bed:'#7ec8e3',rug:['#4f7fd0','#f4e6c8'],floor:['wood','#d4b58b','#c1a17d'],walls:['#b6d5fa','#a3c6f0','#5c3c26']},
 'Rose Cottage':{bed:'#e47c9a',rug:['#c94c5a','#f7cfdc'],sofa:'#e8a0b6',fireplace:true,floor:['wood','#d9a98a','#c8967a'],walls:['#f7cfdc','#efbccc','#8c5d36']},
 'Lavender Lodge':{bed:'#9b5fd6',rug:['#6b4b9e','#d8c6f2'],sofa:'#b48ad8',fireplace:true,piano:true,shelf:true,floor:['wood','#bba3d6','#ab92c8'],walls:['#d8c6f2','#c9b4ea','#5b4377']},
 'Golden Villa':{bed:'#e8bb5c',rug:['#c8952b','#fff3d0'],sofa:'#d9a84a',fireplace:true,piano:true,shelf:true,chandelier:true,kitchen:true,floor:['tile','#f4ecd8','#e2d2b0'],walls:['#f6e3b0','#ecd394','#9c7027']}};
function visitMenu(){const me=window.catCityOnlineMe?.(),players=(window.catCityOnlinePlayers?.()||[]).filter(p=>p.id!==me&&p.home&&HOUSE_LOOK[p.home.house]);
 if(!window.catCityOnlineConnected?.()){dialog('🏡','Visit a friend','Join an online room (🌐 Online) with friends, then come back here to visit their homes!',[['OK',null]]);return}
 if(!players.length){dialog('🏡','Visit a friend','Nobody in your room has shared a home yet. Friends share theirs by decorating with the 📒 catalogue.',[['OK',null]]);return}
 dialog('🏡','Visit a friend','Whose home would you like to visit?',[...players.map(p=>['🐾 '+p.name+'\'s '+(p.home.house==='home'?'Cosy Cat House':p.home.house),()=>visit(p)]),['Close',null,true]])}
function visit(p){const L=HOUSE_LOOK[p.home.house],I=window.catCityInteriors;if(!I)return;
 I.addRoom('visit',{title:'🏡 '+p.name+'\'s '+(p.home.house==='home'?'Cosy Cat House':p.home.house),bg(){I.floor(...L.floor);I.walls(...L.walls)},items:()=>I.homeItems({...L,id:'visit',pc:false,visit:{floor:p.home.floor||[],wall:p.home.wall||[],pet:p.home.pet}})});
 I.enter('visit');core.note('🏡 Visiting '+p.name+'\'s home!')}
window.catCityVisitMenu=visitMenu;

// ================================================================== shared enemies (raid + Mission 4)
const enemies=[];let atkAt=0,camE=0,camF=0;
const attackBtn=mk('button','cc-cz-attack');attackBtn.type='button';attackBtn.textContent='⚔️ ATTACK';
function nearestEnemy(){let best=null,bd=1e9;for(const e of enemies){if(e.hp<=0)continue;const d=Math.hypot(s.x-e.x,s.y-e.y);if(d<bd){bd=d;best=e}}return best?{e:best,d:bd}:null}
function attack(){const now=Date.now();if(now-atkAt<450||busy())return false;const n=nearestEnemy();if(!n)return false;
 const B=window.catCityBow,bow=B?.equipped?.(),reach=bow?B.range:96;if(n.d>reach){if(n.d<260)core.note(bow?'🏹 Get within bow range!':'⚔️ Move closer to attack!');return false}
 atkAt=now;if(bow){if(!B.fire())return true;B.shoot(s.x,s.y,n.e.x,n.e.y-10)}
 const power=1+Math.min(2,Math.floor((window.catCityWeaponPower?.()||0)/3));n.e.hp-=power;n.e.hurtAt=now;const ang=Math.atan2(n.e.y-s.y,n.e.x-s.x);n.e.x+=Math.cos(ang)*26;n.e.y+=Math.sin(ang)*26;window.catCitySfx('hit');
 if(n.e.hp<=0){n.e.deadAt=now;window.dispatchEvent(new CustomEvent('catcity:wrangler-defeated',{detail:{where:n.e.kind}}));n.e.onDefeat?.()}
 return true}
attackBtn.onclick=attack;
addEventListener('keydown',e=>{if(e.key!==' '||e.repeat||e.target?.closest?.('input,textarea,select,[contenteditable]'))return;if(nearestEnemy()&&attack())e.preventDefault()});
function tickEnemies(dt){const now=Date.now();
 for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.hp<=0){if(now-e.deadAt>500)enemies.splice(i,1);continue}
  if(busy())continue;const d=Math.hypot(s.x-e.x,s.y-e.y);
  if(d<(e.sight||330)&&d>18){const sp=(e.speed||70)*dt;e.x+=(s.x-e.x)/d*sp;e.y+=(s.y-e.y)/d*sp}
  else if(e.home&&d>=(e.sight||330)){const hd=Math.hypot(e.home.x-e.x,e.home.y-e.y);if(hd>4){e.x+=(e.home.x-e.x)/hd*40*dt;e.y+=(e.home.y-e.y)/hd*40*dt}}
  if(d<26&&now-(e.hitAt||0)>1400){e.hitAt=now;window.catCityHurt?.(1,e.kind==='glitch'?'a glitch Wrangler':'a raiding Wrangler');if(e.kind==='raid'&&(s.fish||0)>0){const lost=Math.min(3,Math.floor(s.fish));s.fish-=lost}const a=Math.atan2(e.y-s.y,e.x-s.x);e.x+=Math.cos(a)*40;e.y+=Math.sin(a)*40}}
 const n=nearestEnemy();attackBtn.classList.toggle('show',!!n&&n.d<240&&!busy())}
function drawEnemies(g,t){const now=Date.now();
 for(const e of enemies){const sx=e.x+camE,sy=e.y+camF;if(sx<-60||sy<-60||sx>core.W+60||sy>core.H+60)continue;
  g.save();if(e.hp<=0)g.globalAlpha=Math.max(0,1-(now-e.deadAt)/500);
  const glitch=e.kind==='glitch';if(glitch&&Math.floor(t*10+e.x)%7===0)g.translate((Math.random()-.5)*4,0);
  if(now-(e.hurtAt||0)<150)g.filter='brightness(2)';
  if(glitch)g.filter=(g.filter&&g.filter!=='none'?g.filter+' ':'')+'hue-rotate(-150deg) saturate(1.5)';g.translate(camE,camF);core.drawCat(e.x,e.y,{name:'Wrangler',coat:glitch?'#2a8f6e':'#73549d',belly:glitch?'#a8f5d2':'#d6c1e8',eye:glitch?'#7fff9e':'#f9df80'},1.05);g.restore();
  if(e.hp>0){g.fillStyle='#241832';g.fillRect(Math.round(sx-16),Math.round(sy-36),32,5);g.fillStyle=glitch?'#55e07a':'#ff6f9a';g.fillRect(Math.round(sx-15),Math.round(sy-35),Math.round(30*e.hp/e.max),3);
   if(glitch){g.font='bold 9px monospace';g.fillStyle='#7fff9e';g.textAlign='center';g.fillText(Math.random()<.5?'10110':'01001',sx,sy-40)}}}}

// ================================================================== 5. WRANGLER RAID
s.raidsWon=Array.isArray(s.raidsWon)?s.raidsWon:[];
const raidEvent=()=>{const ev=window.catCityAdminEvent;if(ev?.name==='wrangler_raid'&&ev.endsAt*1000>Date.now())return ev;if(window.__ccLocalRaid&&window.__ccLocalRaid>Date.now())return {name:'wrangler_raid',endsAt:Math.floor(window.__ccLocalRaid/1000),local:true};return null};
const raidActive=()=>{const e=raidEvent();return !!e&&!s.raidsWon.includes(e.endsAt)};
const inVillage=()=>s.x>-60&&s.y>-60&&s.x<(48*T)+60&&s.y<(35*T)+60;
let raid=null;
function tickRaid(){const ev=raidEvent();
 if(!ev||s.raidsWon.includes(ev.endsAt)){if(raid){for(const e of enemies)if(e.kind==='raid')e.hp=0;raid=null}return}
 if(!raid||raid.id!==ev.endsAt){raid={id:ev.endsAt,wave:0,next:Date.now()+1500,announced:false}}
 if(!inVillage()||busy())return;
 if(!raid.announced){raid.announced=true;window.catCitySfx('horn');core.note('🧶 WRANGLER RAID! Wranglers are storming the village. Fight them off with ⚔️ / Space!')}
 const alive=enemies.filter(e=>e.kind==='raid'&&e.hp>0).length;
 if(alive===0&&Date.now()>raid.next){
  if(raid.wave>=3){s.raidsWon.push(raid.id);s.raidsWon=s.raidsWon.slice(-20);s.fish=(s.fish||0)+120;window.catCityLevels?.add?.(100,'raid');core.persist();window.catCitySfx('reward');core.note('🏆 Village defended! The Wranglers ran away. +120 🐟 +100 XP');raid=null;return}
  raid.wave++;const n=3+raid.wave*2,W=(48*T),H=(35*T);
  for(let i=0;i<n;i++){const side=i%4,x=side===0?-30:side===1?W+30:(i*173)%W,y=side===2?-30:side===3?H+30:(i*131)%H;
   enemies.push({kind:'raid',x,y,hp:2+Math.floor(raid.wave/2),max:2+Math.floor(raid.wave/2),speed:62+raid.wave*8,sight:2000,onDefeat:()=>{s.fish=(s.fish||0)+6;core.persist()}})}
  window.catCitySfx('horn');core.note('🧶 Wave '+raid.wave+'/3 · '+n+' Wranglers incoming!');raid.next=Date.now()+4000}
 else if(alive>0)raid.next=Date.now()+3000;
}
const raidHud=()=>{if(!raidActive()||!raid)return '';const alive=enemies.filter(e=>e.kind==='raid'&&e.hp>0).length;return '<br>🧶 Raid wave '+raid.wave+'/3 · '+alive+' left'};

// ================================================================== 4. DAILY JOBS
const JOBS={
 harvest:{t:'Harvest 2 crops',need:2,ev:'harvest'},water:{t:'Water 3 garden plots',need:3,ev:'water'},cook:{t:'Cook a snack',need:1,ev:'cook'},
 talk:{t:'Chat with 3 different cats',need:3,ev:'talk'},wrangler:{t:'Defeat 3 Wranglers',need:3,ev:'wrangler'},
 fish:{t:'Earn 40 fish',need:40,ev:'fish'},biomes:{t:'Visit 2 different biomes',need:2,ev:'biome'}
};
function seeded(n){const d=today();let h=0;for(const c of d)h=(h*31+c.charCodeAt(0))>>>0;const keys=Object.keys(JOBS),out=[];while(out.length<n){h=(h*1103515245+12345)>>>0;const k=keys[h%keys.length];if(!out.includes(k))out.push(k)}return out}
function daily(){const d=today();if(!s.daily||s.daily.date!==d){const prev=s.daily||{};s.daily={date:d,jobs:seeded(3).map(id=>({id,have:0,done:false})),seen:[],biomes:[],streak:prev.streak||0,lastAll:prev.lastAll||'',bonus:false};core.persist()}return s.daily}
function bump(ev,n=1,key){const D=daily();if(key){const list=ev==='biome'?D.biomes:D.seen;if(list.includes(key))return;list.push(key)}
 for(const j of D.jobs){const J=JOBS[j.id];if(j.done||J.ev!==ev)continue;j.have=Math.min(J.need,j.have+n);if(j.have>=J.need){j.done=true;s.fish=(s.fish||0)+25;window.catCityLevels?.add?.(20,'daily');window.catCitySfx('quest');core.note('📅 Daily job done: '+J.t+'! +25 🐟 +20 XP')}}
 if(!D.bonus&&D.jobs.every(j=>j.done)){D.bonus=true;const y=new Date(Date.now()-864e5),yd=y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate();D.streak=D.lastAll===yd?D.streak+1:1;D.lastAll=D.date;const b=40*Math.min(7,D.streak);s.fish=(s.fish||0)+b;window.catCitySfx('reward');core.note('🔥 All daily jobs done! '+D.streak+'-day streak · bonus +'+b+' 🐟')}
 core.persist()}
window.addEventListener('catcity:adventure-action',e=>{if(e.detail?.type==='harvest')bump('harvest')});
window.addEventListener('catcity:watered',()=>bump('water'));
window.addEventListener('catcity:cooked',()=>bump('cook'));
window.addEventListener('catcity:wrangler-defeated',()=>bump('wrangler'));
const oldNpcLine=window.catCityNpcLine;window.catCityNpcLine=id=>{bump('talk',1,id);return oldNpcLine?.(id)};
let lastFish=s.fish||0;setInterval(()=>{const f=s.fish||0;if(f>lastFish&&f-lastFish<500)bump('fish',Math.floor(f-lastFish));lastFish=f;const b=window.catCityAudio?.biome?.();if(b&&b!=='town')bump('biome',1,b)},1500);
function dailyPanel(){const D=daily();dialog('📅','Daily jobs','🔥 Streak: '+D.streak+' day'+(D.streak===1?'':'s')+'<br><small>Each job: +25 🐟 +20 XP · all three: streak bonus (up to 280 🐟). New jobs every day!</small>'+D.jobs.map(j=>'<div class="cc-cz-row"><span>'+(j.done?'✅':'⬜')+' '+JOBS[j.id].t+'</span><b>'+j.have+'/'+JOBS[j.id].need+'</b></div>').join(''),[['👍 OK',null]])}
window.catCityDaily=dailyPanel;

// ================================================================== 2. MISSION 4: THE BROKEN PANEL
const C=()=>s.castle||{};
s.m4=s.m4&&typeof s.m4==='object'?s.m4:{stage:'',shards:[false,false,false,false]};
const hh=(x,y,k=0)=>{const n=Math.sin(x*127.1+y*311.7+k*53.17)*43758.5453;return n-Math.floor(n)};
const BIOME=(cx,cy)=>{if(!cx&&!cy)return 'town';if(cx<0&&cy>=-1&&cy<=1)return 'wild';const v=hh(cx,cy);if(v<.17)return 'cherry';if(v>.82)return 'poison';if(v<.32)return 'marsh';if(v>.66)return 'moonstone';return 'wild'};
const CH=24*T;
function findChunk(b,skip=0){for(let r=1;r<40;r++)for(let cx=-r;cx<=r;cx++)for(let cy=-r;cy<=r;cy++){if(Math.max(Math.abs(cx),Math.abs(cy))!==r)continue;if(BIOME(cx,cy)===b){if(skip--<=0)return {cx,cy}}}return {cx:3,cy:3}}
const SHARDS=[['cherry','🌸 Cherry Grove'],['marsh','🌿 Misty Marsh'],['moonstone','🌸 Flower Terrace'],['poison','☠️ Poison Wastes']].map(([b,name],i)=>{const c=findChunk(b,1);return {i,b,name,x:c.cx*CH+CH/2+70,y:c.cy*CH+CH/2-50}});
const ADMIN_SPOT={x:26*T,y:29*T+10};
function m4Hud(){const M=s.m4;if(M.stage==='shards'){const got=M.shards.filter(Boolean).length;return '<br>💾 Mission 4: code shards '+got+'/4'+(got===4?' · return to the Admin':'')}return ''}
function m4Letter(){dialog('💌','A letter… from the Admin','<i>"Kitty — the admin panel never came back right after the Boss punched it. Four pieces of its code fell out across the biomes, and the glitches are guarding them. Could you and Biscuit bring them back? I\'ll wait outside the Cosy Cat House. — The Admin"</i>',
 [['💾 Start Mission 4: The Broken Panel',()=>{s.m4.stage='shards';s.m4.shards=[false,false,false,false];core.persist();window.catCitySfx('quest');core.note('💾 Mission 4: find the 4 code shards. Look for the green glow on your Map in each biome!')}],['Later',()=>{letterLater=Date.now()+10*60000},true]])}
let letterLater=Date.now()+20000,guarded={};
function tickM4(){const M=s.m4;
 if(!M.stage&&C().m3&&!busy()&&!dlgOpen()&&Date.now()>letterLater&&s.tutorialCompleted){letterLater=Date.now()+10*60000;m4Letter()}
 if(M.stage!=='shards')return;
 for(const sh of SHARDS){if(M.shards[sh.i])continue;const d=Math.hypot(s.x-sh.x,s.y-sh.y);
  if(d<600&&!guarded[sh.i]){guarded[sh.i]=true;for(let k=0;k<2;k++){const hx=sh.x+(k?60:-60),hy=sh.y+40;enemies.push({kind:'glitch',shard:sh.i,x:hx,y:hy,home:{x:hx,y:hy},hp:4,max:4,speed:78,sight:230})}}
  if(d>900&&guarded[sh.i]){guarded[sh.i]=false;for(const e of enemies)if(e.shard===sh.i)e.hp=0,e.deadAt=0}}
}
function nearShard(){const M=s.m4;if(M.stage!=='shards')return null;for(const sh of SHARDS){if(!M.shards[sh.i]&&Math.hypot(s.x-sh.x,s.y-sh.y)<46)return sh}return null}
function takeShard(sh){if(enemies.some(e=>e.shard===sh.i&&e.hp>0)){core.note('👾 The glitch Wranglers are guarding it! Defeat them first.');return}
 s.m4.shards[sh.i]=true;core.persist();window.catCitySfx('shard');const got=s.m4.shards.filter(Boolean).length;core.note('💾 Code shard '+got+'/4 from '+sh.name+'!'+(got===4?' Take them to the Admin by the Cosy Cat House.':''))}
const nearAdminSpot=()=>s.m4.stage==='shards'&&Math.hypot(s.x-ADMIN_SPOT.x,s.y-ADMIN_SPOT.y)<60;
const nearAdmin=()=>nearAdminSpot()&&s.m4.shards.every(Boolean);
function adminWaiting(){const got=s.m4.shards.filter(Boolean).length;core.note('🤖 The Admin: "You\'ve found '+got+' of 4 code shards. Look for the green glow on your Map — I\'ll wait right here."')}
function drawM4(g,t){const M=s.m4;if(M.stage!=='shards')return;
 for(const sh of SHARDS){if(M.shards[sh.i])continue;const x=sh.x+camE,y=sh.y+camF;if(x<-80||y<-80||x>core.W+80||y>core.H+80)continue;
  g.save();g.globalAlpha=.35+.25*Math.sin(t*3);g.fillStyle='#55ff9a';g.beginPath();g.arc(x,y,26,0,7);g.fill();g.globalAlpha=1;
  const bob=Math.sin(t*2.5)*3;g.fillStyle='#0f2a1c';g.fillRect(Math.round(x-9),Math.round(y-15+bob),18,22);g.fillStyle='#55ff9a';g.fillRect(Math.round(x-7),Math.round(y-13+bob),14,18);
  g.fillStyle='#0f2a1c';g.font='bold 7px monospace';g.textAlign='center';g.fillText('101',x,y-5+bob);g.fillText('010',x,y+2+bob);g.restore();
  if(Math.hypot(s.x-sh.x,s.y-sh.y)<46){lab(g,'E / 🐾 · Take the code shard',x,y+30)}}
 // The Admin waits outside the Cosy Cat House for the whole mission, as his letter says
 // (glitch report: he only appeared once all 4 shards were found, and was drawn tiny).
 {const x=ADMIN_SPOT.x+camE,y=ADMIN_SPOT.y+camF;const img=window.catCityAdminBirman?.owner?.(false);
  if(img&&x>-80&&y>-80&&x<core.W+80&&y<core.H+80){const k=Math.max(1,Math.round(58/img.height));g.fillStyle='#241a2c55';g.beginPath();g.ellipse(x,y+1,img.width*k*.35,4,0,0,7);g.fill();g.drawImage(img,Math.round(x-img.width*k/2),Math.round(y-img.height*k+Math.sin(t*1.6)*2),img.width*k,img.height*k)}
  else{g.fillStyle='#ffd45c';g.beginPath();g.arc(x,y-20,10,0,7);g.fill()}
  g.font='bold 11px system-ui';g.textAlign='center';g.fillStyle='#ffd45c';g.strokeStyle='#241832';g.lineWidth=3;g.strokeText('The Admin',x,y-58);g.fillText('The Admin',x,y-58);
  if(nearAdmin())lab(g,'E / 🐾 · Give the shards to the Admin',x,y+22);else if(nearAdminSpot())lab(g,'E / 🐾 · Talk to the Admin',x,y+22)}}
function lab(g,t,x,y){g.font='bold 11px system-ui';g.textAlign='center';g.lineWidth=3;g.strokeStyle='#241832';g.fillStyle='#fff6e4';g.strokeText(t,x,y);g.fillText(t,x,y)}

// ---- The ending cutscene (pixel canvas)
const scene=mk('div','cc-cz-scene','<canvas id="cc-cz-cv"></canvas><div id="cc-cz-say"></div><button id="cc-cz-skip" type="button">Skip ▶</button>');
let sceneRaf=0,sceneStart=0,sceneEnd=null;
const SHOTS=[
 {d:4.5,say:'🐾 THE ADMIN: "Last piece… there."'},
 {d:4.5,say:'The admin panel flickers back to life.'},
 {d:6,say:'On the screen… the castle is empty. Only the Boss is left.'},
 {d:5,say:'🐾 BISCUIT: "He kept the picture…"'},
 {d:5.5,say:'🐾 THE ADMIN: "Not today, Biscuit. But one day… maybe."'}
];
function playM4Scene(){const cv=$('cc-cz-cv'),g=cv.getContext('2d');const LW=240,LH=135;cv.width=LW;cv.height=LH;g.imageSmoothingEnabled=false;
 scene.classList.add('open');sceneStart=performance.now();window.catCityMissionMusic='locket';snackBtn();attackBtn.classList.remove('show');
 const total=SHOTS.reduce((a,b)=>a+b.d,0),say=$('cc-cz-say');
 const art=window.catCityCatArt,B=window.catCityBirmanArt,me=(art?.ids||[])[s.cat]||'astro';
 const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const birman=(x,feet,v,sc,t)=>B?.draw(g,x,feet-(v==='king'?48:36),v,{scale:sc,t});
 const admin=(x,feet,k,t)=>{const img=window.catCityAdminBirman?.owner?.(false);if(img)g.drawImage(img,Math.round(x-img.width*k/2),Math.round(feet-img.height*k+Math.sin(t*1.7)*1),Math.round(img.width*k),Math.round(img.height*k))};
 function sky(t){for(let y=0;y<LH;y+=3){const k=y/LH;R(0,y,LW,3,'rgb('+Math.round(255-k*90)+','+Math.round(160-k*70)+','+Math.round(120+k*40)+')')}R(0,92,LW,43,'#6fae5f');R(0,92,LW,3,'#8fd17a');for(let i=0;i<12;i++)R((i*37+5)%LW,100+(i*13)%30,2,2,'#f7cfdc')}
 function panel(cx,cy,w,h,on,t){R(cx-w/2-2,cy-h/2-2,w+4,h+4,'#2a1d33');R(cx-w/2,cy-h/2,w,h,on?'#11151f':'#000');R(cx-w/2,cy-h/2,w,6,'#ffd45c');R(cx-w/2+2,cy-h/2+1,4,4,'#ff6f9a')}
 function throne(cx,cy,w,h,t){R(cx-w/2,cy-h/2+6,w,h-6,'#2a1840');for(let x=cx-w/2+4;x<cx+w/2;x+=14)R(x,cy-h/2+8,3,h-20,'#3b2557');R(cx-w/2,cy+h/2-12,w,12,'#1d1030');R(cx-10,cy-6,20,22,'#7a52b8');R(cx-12,cy-9,24,4,'#ffd45c');
  for(let i=0;i<6;i++){const k=(t*.7+i/6)%1;g.globalAlpha=.25;R(cx-w/2+((i*29)%w),cy-h/2+6+k*(h-10),1,3,'#cbb7f0')}g.globalAlpha=1}
 function frame(now){const t=(now-sceneStart)/1000;if(t>=total){finish();return}
  let acc=0,shot=0;for(;shot<SHOTS.length;shot++){if(t<acc+SHOTS[shot].d)break;acc+=SHOTS[shot].d}const lt=t-acc;
  g.clearRect(0,0,LW,LH);say.style.display='block';say.textContent=SHOTS[shot].say;
  if(shot===0){sky(t);admin(160,104,0.9,t);art?.draw(g,84,104,me,'idle',(t%3)<.12?1:0,{scale:1});birman(116,104,'junior',.55,t);
   for(let i=0;i<4;i++){const k=Math.min(1,Math.max(0,(lt-.4-i*.5)/1)),x=84+(160-84)*k,y=88-Math.sin(k*Math.PI)*24;if(k<1){R(x-3,y-4,6,7,'#0f2a1c');R(x-2,y-3,4,5,'#55ff9a')}}
   if(lt>3)for(let i=0;i<8;i++){g.globalAlpha=1-(lt-3)/1.5;R(160+Math.cos(i)*18*(lt-3),74+Math.sin(i)*18*(lt-3),2,2,'#55ff9a')}g.globalAlpha=1}
  else if(shot===1){R(0,0,LW,LH,'#0b0f17');for(let i=0;i<70;i++){const k=Math.min(1,lt/3),a=i*2.4,r=(1-k)*140+8,x=120+Math.cos(a+t)*r*(i%5/5+.5),y=66+Math.sin(a+t)*r*.6;g.fillStyle='#55ff9a';g.font='6px monospace';g.fillText(i%2?'1':'0',x,y)}
   const on=lt>2.6;if(on||Math.floor(lt*10)%3===0)panel(120,66,120*Math.min(1,lt/2.6+.1),70*Math.min(1,lt/2.6+.1),on,t);if(on){g.fillStyle='#7fff9e';g.font='bold 7px monospace';g.textAlign='center';g.fillText('ADMIN PANEL · ONLINE',120,62);g.textAlign='left'}}
  else if(shot===2){R(0,0,LW,LH,'#0b0f17');panel(120,64,200,112,true,t);throne(120,68,192,98,t);
   const sc=.95;birman(120,106,'king',sc,t*.2);R(108,92,8,6,'#c9963a');R(109,93,6,4,'#f4efe2');R(111,94,2,2,'#c8955a');
   if(lt>2.4){const k=((lt-2.4)%1.6)/1.6;R(124,74+k*16,2,3,'#9fe0ff')}
   if(Math.floor(t*7)%13===0){g.globalAlpha=.3;R(0,(t*90)%LH,LW,3,'#7fff9e');g.globalAlpha=1}}
  else if(shot===3){R(0,0,LW,LH,'#1a1426');g.globalAlpha=.25;R(0,0,LW,LH,'#55ff9a');g.globalAlpha=1;R(0,100,LW,35,'#2a1d33');birman(120,128,'junior',2.2,t*.15);
   g.globalAlpha=.45;R(0,0,LW,22,'#55ff9a');g.globalAlpha=1}
  else{sky(t);R(0,0,LW,LH,'rgba(40,20,60,'+Math.min(.45,lt*.12)+')');admin(160,104,0.9,t);art?.draw(g,84,104,me,'idle',0,{scale:1});birman(116,104,'junior',.55,t);
   const k=Math.max(0,1-lt/1.6);if(k>0)panel(160,40,60*k,36*k,true,t)}
  if(t<.6){g.fillStyle='rgba(0,0,0,'+(1-t/.6)+')';g.fillRect(0,0,LW,LH)}
  sceneRaf=requestAnimationFrame(frame)}
 sceneRaf=requestAnimationFrame(frame);$('cc-cz-skip').onclick=finish;
 function finish(){cancelAnimationFrame(sceneRaf);scene.classList.remove('open');say.style.display='none';window.catCityMissionMusic=null;
  const first=s.m4.stage!=='done';s.m4.stage='done';if(first){s.fish=(s.fish||0)+400;window.catCityLevels?.add?.(300,'m4')}core.persist();window.catCitySfx('reward');
  dialog('💾','Mission 4 complete: The Broken Panel','The admin panel works again… and the Boss is all alone in the castle.<br><b>To be continued…</b>'+(first?'<br><br>Rewards: 🐟 400 fish · ⭐ 300 XP':''),[['🐾 Back to Cat City',null]])}
}
window.catCityMission4={scene:playM4Scene,letter:m4Letter,shards:SHARDS,admin:ADMIN_SPOT};

// ================================================================== wiring: HUD, drawing, interact, settings
const oldHealthHud=window.catCityHealthHud;
window.catCityHealthHud=()=>{const D=daily();const done=D.jobs.filter(j=>j.done).length;return (oldHealthHud?.()||'')+'<br>📅 Daily '+done+'/3'+(D.streak?' · 🔥'+D.streak:'')+raidHud()+m4Hud()};
const oldTerrain=window.catCityDrawOverhaul;
window.catCityDrawOverhaul=function(ct,st,...rest){const r=oldTerrain?.(ct,st,...rest);const m=ct.getTransform();camE=m.e/(m.a||1);camF=m.f/(m.d||1);if(!busy())drawPot(ct,performance.now()/1000);return r};
const oldDraw=core.draw;
core.draw=function(){oldDraw();if(busy())return;const g=core.ctx,t=performance.now()/1000;g.save();g.imageSmoothingEnabled=false;drawEnemies(g,t);drawM4(g,t);
 if(nearPot()){const P=POT();lab(g,'E / 🐾 · Cook at the pot',P.x+camE,P.y+camF+26)}g.restore()};
const oldInteract=core.interact;
core.interact=function(){if(!busy()&&!dlgOpen()&&$('dialog')?.style.display!=='block'){
 if(nearPot()){cook();return}const sh=nearShard();if(sh){takeShard(sh);return}if(nearAdmin()){playM4Scene();return}if(nearAdminSpot()){adminWaiting();return}}
 return oldInteract()};
let lastT=performance.now();
setInterval(()=>{const now=performance.now(),dt=Math.min(.1,(now-lastT)/1000);lastT=now;tickEnemies(dt);tickRaid();tickM4()},50);
setInterval(snackBtn,700);
function settingsUI(){
 const box=$('cc-pf-settings');if(box&&!$('cc-sfx-toggle')){const l=document.createElement('label');l.style.cssText='display:flex;align-items:center;gap:8px;margin:8px 0';l.innerHTML='<input type="checkbox" id="cc-sfx-toggle"> 🔔 Sound effects';box.append(l);
  const cb=$('cc-sfx-toggle');cb.checked=sfxOn();cb.onchange=()=>{try{localStorage.setItem('catcity_sfx',cb.checked?'on':'off')}catch(e){}if(cb.checked)window.catCitySfx('pop')}}
 const pause=$('pause-panel')?.querySelector('.cc-list');if(pause&&!$('cc-daily-pause')){
  const b=document.createElement('button');b.type='button';b.id='cc-daily-pause';b.textContent='📅 Daily jobs';b.onclick=()=>{$('pause-panel')?.classList.remove('show');dailyPanel()};pause.append(b);
  const v=document.createElement('button');v.type='button';v.textContent='🏡 Visit a friend\'s home';v.onclick=()=>{$('pause-panel')?.classList.remove('show');visitMenu()};pause.append(v)}
 const anchor=$('cc-admin-castle');if(anchor&&!$('cc-admin-cozy')){const a=document.createElement('div');a.id='cc-admin-cozy';a.style.cssText='margin-top:8px;padding-top:6px;border-top:1px dashed #ffd45c66';
  a.innerHTML='<strong>💾 Mission 4 + cosy update</strong><br><button id="cc-admin-m4">💌 Mission 4 letter</button> <button id="cc-admin-m4shards">💾 Give all 4 shards</button> <button id="cc-admin-m4scene">🎬 Mission 4 ending</button> <button id="cc-admin-raid">🧶 Test raid (just me, 5 min)</button> <button id="cc-admin-daily">📅 New daily jobs</button> <button id="cc-admin-m4reset">↺ Reset Mission 4</button>';
  anchor.after(a);const own=()=>!!window.catCityIsOwner?.();const close=()=>document.querySelectorAll('.show,.open').forEach(el=>{if(/settings|admin/i.test(el.id||'')&&el.id!=='cc-admin-tools')el.classList.remove('show','open')});
  $('cc-admin-m4').onclick=()=>{if(!own())return;close();m4Letter()};
  $('cc-admin-m4shards').onclick=()=>{if(!own())return;s.m4.stage='shards';s.m4.shards=[true,true,true,true];core.persist();close();core.note('💾 All 4 shards given. The Admin is waiting outside the Cosy Cat House.')};
  $('cc-admin-m4scene').onclick=()=>{if(!own())return;close();playM4Scene()};
  $('cc-admin-raid').onclick=()=>{if(!own())return;close();window.__ccLocalRaid=Date.now()+5*60000;core.note('🧶 Test raid started (only you see it). Use the Events list to start a real one for everyone.')};
  $('cc-admin-daily').onclick=()=>{if(!own())return;s.daily=null;daily();close();dailyPanel()};
  $('cc-admin-m4reset').onclick=()=>{if(!own())return;s.m4={stage:'',shards:[false,false,false,false]};core.persist();core.note('↺ Mission 4 reset.')}}
}
// Admin panel layout: story mission buttons in their own card at the very bottom,
// grouped by mission; test tools in a separate card higher up, with room between.
function adminLayout(){
 const tools=$('cc-admin-tools'),castle=$('cc-admin-castle'),cozy=$('cc-admin-cozy');if(!tools||!castle||!cozy||$('cc-admin-missions'))return;
 if(!$('cc-admin-layout-style')){const st=document.createElement('style');st.id='cc-admin-layout-style';st.textContent=[
  '.cc-admin-card{border:2px solid #c7b6e6;border-radius:12px;padding:10px;margin:22px 0 10px}',
  '.cc-admin-card h4{margin:0 0 6px;font:900 15px system-ui}',
  '.cc-admin-group{margin:12px 0 4px;padding-top:8px;border-top:1px dashed #c7b6e6}.cc-admin-group:first-of-type{border-top:0;padding-top:0}',
  '.cc-admin-group>b{display:block;font-size:13px;margin-bottom:6px}',
  '.cc-admin-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}',
  '.cc-admin-grid button{margin:0!important;width:100%}',
  '.cc-admin-grid label{grid-column:1/-1}'].join('\n');document.head.append(st)}
 const card=(id,title,note)=>{const c=document.createElement('div');c.id=id;c.className='cc-admin-card';c.innerHTML='<h4>'+title+'</h4>'+(note?'<p style="font-size:12px;margin:0 0 4px">'+note+'</p>':'');return c};
 const group=(parent,title,ids)=>{const g=document.createElement('div');g.className='cc-admin-group';g.innerHTML='<b>'+title+'</b>';const grid=document.createElement('div');grid.className='cc-admin-grid';
  for(const id of ids){const el=$(id);if(!el)continue;grid.append(el.tagName==='SELECT'?(el.closest('label')||el):el)}g.append(grid);parent.append(g)};
 // Test tools: a few sections above the missions.
 const test=card('cc-admin-testing','🧪 Test tools','Only you see these: they don\'t change anything for other players.');
 group(test,'Village',['cc-admin-raid','cc-admin-daily']);
 const reports=$('cc-admin-reports');reports?reports.before(test):tools.append(test);
 // Story missions: always the last thing in the panel.
 const m=card('cc-admin-missions','🎬 Story missions','Jump into any mission to test it.');
 group(m,'🏰 Mission 1 · Birman Castle',['cc-admin-castle-room','cc-admin-castle-go','cc-admin-castle-taxi','cc-admin-castle-force']);
 group(m,'2️⃣ Mission 1 · Chapter 2',['cc-admin-castle-ch2','cc-admin-castle-isl']);
 group(m,'🔒 Mission 2 · The Locket',['cc-admin-m2']);
 group(m,'🚕 Mission 3 · No Return',['cc-admin-m3','cc-admin-m3boss']);
 group(m,'💾 Mission 4 · The Broken Panel',['cc-admin-m4','cc-admin-m4shards','cc-admin-m4scene']);
 group(m,'↺ Reset',['cc-admin-castle-reset','cc-admin-m4reset']);
 const rs=$('cc-admin-castle-reset');if(rs)rs.textContent='↺ Reset Missions 1–3';
 tools.append(m);const fb=$('cc-admin-feedback');if(fb)m.before(fb);
 // Keep the (now empty) old boxes hidden so the scripts that made them don't add them again.
 castle.style.display='none';cozy.style.display='none';
}
setInterval(()=>{settingsUI();adminLayout()},1500);
window.catCityCozy={enemies,daily:()=>daily(),cook,raidActive,pot:POT,catalogue,visit,decorOf,_attack:attack};
})();

/* Cat Tok part 7: ➕ Create — making and posting videos (up to 30 seconds).
 * Two ways to make one:
 *  🎬 On a set: pick a template (Zoomies, Dance, Taste test, Unboxing, Fit check, News report…),
 *     a set (background), any of the six cats (yours wears your gear), a length and a caption.
 *     Templates work with every cat and every set, so they always make sense.
 *  🎮 Gameplay: the phone goes away and the game is recorded (3 pictures a second, up to 30 s).
 * Sets: Village and the CC News studio are free; Your home needs a home; the biome sets need the
 * full armour set from that biome (Cherry: Blossom Blade + Cherry Crown + Petal Armour + Pink Paws,
 * and so on); TV Glitch needs the full Glitched set; Birman Castle needs the castle mission done;
 * the Admin set is the owner's. The owner has every set.
 * Voice: players can talk over their video, but the 🎙️ switch is off by default.
 * Sponsors: finish 2 side quests for Marmalade, Pebble, Luna, Forge or SlayCat and they sponsor you
 * (2× boost). Finish all four Biscuit & Birman missions and Biscuit sponsors you (3× boost). Each NPC
 * now has a second, Cat Tok side quest.
 * Videos go to the server (cattok.py) so everyone sees them in For You and Cat City. The owner sees
 * a ✔️ Verify button on players' videos and a 🛡️ Creators list in their profile.
 * API: CatTok.video = {sets, templates, draw(g,W,H,t,v), owns(set), sponsors(), me(), api(path,data)}.
 */
(()=>{'use strict';
const start=()=>{const T=window.CatTok,core=window.__catCityEngine;if(!T||!core||T.video)return;
const s=core.state,$=id=>document.getElementById(id);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const A=()=>window.catCityCatArt,R=T.R,owner=()=>!!window.catCityIsOwner?.();
const CATS=['astro','galaxy','baby','harley','skylar','pumpkin'];

// ------------------------------------------------------------------ who am I (guests get a random id kept on this device)
function secret(){let k='';try{k=localStorage.getItem('catcity_cattok_id')||''}catch(e){}if(!/^[a-f0-9]{32}$/.test(k)){k=[...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('');try{localStorage.setItem('catcity_cattok_id',k)}catch(e){}}return k}
async function api(path,data){const o={credentials:'same-origin',cache:'no-store',headers:{'X-CatTok-Id':secret()}};if(data!==undefined){o.method='POST';o.headers['Content-Type']='application/json';o.body=JSON.stringify(data)}
 const r=await fetch('/api/cattok/'+path,o);let j={};try{j=await r.json()}catch(e){}if(!r.ok)throw Error(j.error||('Cat Tok is busy ('+r.status+')'));return j}
let ME={uid:null,verified:false,owner:false};
async function refreshMe(){try{ME=await api('me')}catch(e){}return ME}
refreshMe();

// ------------------------------------------------------------------ gear + ownership
function myGear(){const st=s,byId=id=>(st.adventureItems||[]).find(it=>it&&it.id===id),eq=st.adventureEquipment||{};const g={};
 for(const slot of ['head','body','paws','weapon']){const it=byId(eq[slot]);if(it)g[slot]={name:it.name,tier:it.tier||'',rarity:it.rarity||'',color:it.color||''}}return g}
const hasItem=name=>(s.adventureItems||[]).some(it=>it&&String(it.name).toLowerCase().includes(name.toLowerCase()));
const BIOME_SETS={cherry:['Blossom Blade','Cherry Crown','Petal Armour','Pink Paws'],marsh:['Lily Spear','Frog Hood','Marsh Armour','Reed Paws'],moonstone:['Crystal Sabre','Amethyst Crown','Moonplate Armour','Crystal Boots'],poison:['Venom Fang','Wrangler Mask','Poison Armour','Toxic Boots'],forest:['Oak Sword','Forest Helmet','Leaf Armour','Ranger Boots']};

// ------------------------------------------------------------------ sets (backgrounds)
const px=(g,x,y,w,h,c)=>R(g,x,y,w,h,c);
function tree(g,x,y,leaf,dark,trunk='#7a5235',k=1){px(g,x-3*k,y-14*k,6*k,14*k,trunk);px(g,x-12*k,y-34*k,24*k,22*k,dark);px(g,x-10*k,y-36*k,20*k,20*k,leaf);px(g,x-6*k,y-32*k,6*k,4*k,'#ffffff33')}
function house(g,x,y,w,h,wall,roof){px(g,x,y-h,w,h,wall);px(g,x-4,y-h-10,w+8,12,roof);px(g,x+w/2-5,y-16,10,16,'#7a5235');px(g,x+6,y-h+8,10,8,'#bfe8ff');if(w>40)px(g,x+w-16,y-h+8,10,8,'#bfe8ff')}
function stars(g,W,H,t,n=24,col='#fff'){for(let i=0;i<n;i++){const x=(i*53)%W,y=(i*37)%(H*.5);g.globalAlpha=.4+.6*Math.abs(Math.sin(t*1.5+i));px(g,x,y,2,2,col)}g.globalAlpha=1}
const SETS=[
 {id:'village',name:'Village',icon:'🏘️',need:'free',ground:.8,draw(g,W,H,t){T.sky(g,W,H,'#8fd3ff','#e8f6ff');px(g,0,H*.62,W,H*.38,'#8fd16a');px(g,0,H*.76,W,H*.24,'#d9c39a');for(let i=0;i<8;i++)px(g,(i*31)%W,H*.66+(i%3)*5,3,3,'#ffffff88');
  house(g,6,H*.66,56,40,'#f5b4a5','#d9607e');house(g,W-70,H*.66,62,44,'#b6d5fa','#7a52b8');tree(g,W*.5,H*.66,'#6cc264','#3f9a45');px(g,W*.36,H*.5,3,H*.26,'#4b4360');px(g,W*.36-4,H*.5,11,6,'#ffd45c')}},
 {id:'news',name:'CC News studio',icon:'📰',need:'free',ground:.82,draw(g,W,H,t){T.sky(g,W,H,'#162447','#1f4068');px(g,10,30,W-20,H*.42,'#0d1530');stars(g,W,H*.8,t,14);for(let i=0;i<6;i++){const bh=20+((i*37)%30);px(g,14+i*27,30+H*.42-bh,22,bh,['#f5b4a5','#c9b2ed','#ffd45c'][i%3])}
  T.live?.studioLight?.(g,W,H,t)},front(g,W,H){px(g,0,H*.72,W,H*.28,'#2a3a6e');px(g,0,H*.72,W,5,'#4a6abf');px(g,W/2-38,H*.76,76,22,'#c62f3a');g.font='bold 13px system-ui';g.textAlign='center';g.fillStyle='#fff';g.fillText('CC NEWS',W/2,H*.76+16)}},
 {id:'home',name:'Your home',icon:'🏡',need:'home',ground:.84,draw(g,W,H,t){px(g,0,0,W,H,'#f7e0c8');for(let x=0;x<W;x+=12)px(g,x,0,6,H*.7,'#f2d2b4');px(g,0,H*.7,W,H*.3,'#b88f5a');for(let x=0;x<W;x+=18)px(g,x,H*.7,1,H*.3,'#9a7246');
  px(g,W*.6,H*.18,44,38,'#7a5235');px(g,W*.6+3,H*.18+3,38,32,'#bfe8ff');px(g,W*.6+3,H*.18+20,38,15,'#8fd16a');px(g,W*.6+21,H*.18+3,2,32,'#7a5235');px(g,14,H*.56,60,24,'#9b5fd6');px(g,14,H*.52,60,8,'#c9a2ff');px(g,W*.25,H*.84,W*.5,10,'#e47c9a')}},
 {id:'cherry',name:'Cherry Grove',icon:'🌸',need:'set',ground:.8,draw(g,W,H,t){T.sky(g,W,H,'#ffd1e3','#fff3f8');px(g,0,H*.66,W,H*.34,'#f2a6c4');px(g,0,H*.8,W,H*.2,'#e88cb0');
  for(const [x,k] of [[22,1.2],[W-26,1.4],[W*.5,1]])tree(g,x,H*.68,'#ffb7d0','#f28cb1','#8c5d36',k);for(let i=0;i<14;i++){const x=(i*41+t*18)%W,y=(i*29+t*30)%H;px(g,x,y,3,2,'#ff8fb8')}}},
 {id:'marsh',name:'Lily Marsh',icon:'🐸',need:'set',ground:.8,draw(g,W,H,t){T.sky(g,W,H,'#9fe0d0','#e2fff7');px(g,0,H*.6,W,H*.4,'#3f9fa8');for(let i=0;i<9;i++)px(g,(i*23+t*8)%W,H*.64+i*12,14,2,'#9fe8f0');
  for(const [x,y] of [[20,.7],[120,.74],[70,.86],[150,.9]]){px(g,x,H*y,22,8,'#5fbf55');px(g,x+8,H*y,4,4,'#3f9fa8')}for(let i=0;i<6;i++)px(g,4+i*34,H*.52,3,H*.1,'#7a9a3a');px(g,0,H*.8,W,H*.2,'#6a8a4a')}},
 {id:'moonstone',name:'Moonstone Caves',icon:'💎',need:'set',ground:.8,draw(g,W,H,t){T.sky(g,W,H,'#1d1640','#4a3a7a');stars(g,W,H,t,30);px(g,W-50,24,26,26,'#fff3c4');px(g,W-44,24,20,20,'#1d1640');px(g,0,H*.7,W,H*.3,'#3a2f63');
  for(const [x,h,c] of [[16,40,'#a6acd6'],[46,26,'#c4f6ff'],[W-40,46,'#7fe7ff'],[W-70,24,'#c9a2ff']]){px(g,x,H*.7-h,10,h,c);px(g,x+2,H*.7-h-6,6,6,c);g.globalAlpha=.3+.3*Math.sin(t*2+x);px(g,x-4,H*.7-h-8,18,h+8,'#ffffff');g.globalAlpha=1}}},
 {id:'poison',name:'Poison Wastes',icon:'☠️',need:'set',ground:.8,draw(g,W,H,t){T.sky(g,W,H,'#3a4a2a','#8aa04a');px(g,0,H*.66,W,H*.34,'#4a5a2a');for(const [x,y] of [[30,.8],[120,.86]]){px(g,x,H*y,40,10,'#7fff4e');for(let i=0;i<3;i++){const b=(t*1.5+i*.33)%1;g.globalAlpha=1-b;px(g,x+8+i*10,H*y-b*14,4,4,'#bfff8e');g.globalAlpha=1}}
  for(const x of [16,W-30]){px(g,x,H*.42,5,H*.26,'#3a2a2a');px(g,x-8,H*.5,8,3,'#3a2a2a');px(g,x+5,H*.46,10,3,'#3a2a2a')}}},
 {id:'forest',name:'West Forest',icon:'🌲',need:'set',ground:.8,draw(g,W,H,t){T.sky(g,W,H,'#a8e6a1','#e9ffe6');px(g,0,H*.64,W,H*.36,'#4f9a45');for(let i=0;i<6;i++)tree(g,8+i*34,H*.66+(i%2)*6,'#5aaa50','#2f7a35','#6a4a2a',1+(i%3)*.15);px(g,0,H*.82,W,H*.18,'#3f8a3a')}},
 {id:'glitch',name:'TV Glitch',icon:'📺',need:'glitch',ground:.8,draw(g,W,H,t){px(g,0,0,W,H,'#120a1e');for(let y=0;y<H;y+=4){g.globalAlpha=.08+.08*Math.random();px(g,0,y,W,2,['#ff3b5c','#3bffb0','#3b8bff'][Math.floor(y/4)%3])}g.globalAlpha=1;
  for(const [x,y] of [[10,40],[W-60,60],[30,H*.5]]){px(g,x,y,50,38,'#2a2a3a');px(g,x+3,y+3,44,30,Math.random()<.5?'#cfd8e8':'#8fa0bf');for(let i=0;i<8;i++)px(g,x+3+Math.random()*40,y+3+Math.random()*28,4,2,'#fff')}
  if(Math.random()<.15){const y=Math.random()*H;px(g,0,y,W,6,'#ff3b5c88')}px(g,0,H*.8,W,H*.2,'#2a1a3e')}},
 {id:'castle',name:'Birman Castle',icon:'🏰',need:'castle',ground:.82,draw(g,W,H,t){px(g,0,0,W,H,'#4a4060');for(let y=0;y<H*.75;y+=10)for(let x=(y/10)%2?0:10;x<W;x+=20)px(g,x,y,19,9,'#544a6c');px(g,0,H*.75,W,H*.25,'#6a2a3a');px(g,0,H*.75,W,4,'#c9963a');
  for(const x of [20,W-40]){px(g,x,30,20,60,'#9a2a3a');px(g,x,90,10,8,'#9a2a3a');px(g,x+10,90,10,4,'#9a2a3a');px(g,x+6,46,8,8,'#ffd45c')}for(const x of [W*.3,W*.7]){px(g,x,H*.45,4,10,'#2a1d33');g.globalAlpha=.6+.4*Math.sin(t*8+x);px(g,x-1,H*.45-5,6,6,'#ffb43c');g.globalAlpha=1}}},
 {id:'admin',name:'Admin HQ',icon:'👑',need:'owner',ground:.82,draw(g,W,H,t){T.sky(g,W,H,'#120b1c','#3a1f5c');for(let i=0;i<3;i++){const x=12+i*56;px(g,x,40,48,34,'#ffd45c');px(g,x+2,42,44,30,'#1a1030');for(let j=0;j<4;j++)px(g,x+5,46+j*6,10+((i*7+j*13+Math.floor(t*4))%28),2,'#7fff9e')}
  px(g,0,H*.76,W,H*.24,'#2a1640');px(g,0,H*.76,W,3,'#ffd45c');g.font='bold 12px system-ui';g.textAlign='center';g.fillStyle='#ffd45c';g.fillText('👑 ADMIN',W/2,H*.3)}}
];
const SET=Object.fromEntries(SETS.map(x=>[x.id,x]));
function owns(id){const x=SET[id];if(!x)return false;if(owner()||ME.owner)return true;
 if(x.need==='free')return true;if(x.need==='home')return (s.houses||[]).length>0;if(x.need==='set')return BIOME_SETS[id].every(hasItem);if(x.need==='glitch')return !!window.catCityTVGlitch?.fullSet?.();if(x.need==='castle')return !!(s.castle&&(s.castle.done||s.castle.ch2||s.castle.ch1));return false}
function needText(id){const x=SET[id];if(x.need==='home')return 'Buy a home first';if(x.need==='set')return 'Needs the full set: '+BIOME_SETS[id].join(', ');if(x.need==='glitch')return 'Needs the full Glitched set (TV Glitch event)';if(x.need==='castle')return 'Finish the Birman Castle mission';if(x.need==='owner')return 'Owner only';return ''}

// ------------------------------------------------------------------ templates
const itemImgs={};function itemImg(id){if(!id||!window.CatTokShop)return null;if(!itemImgs[id]){const im=new Image();im.src=window.CatTokShop.art(id,64);itemImgs[id]=im}return itemImgs[id].complete?itemImgs[id]:null}
function cat(g,v,x,y,pose,frame,sc=2.4,flip=false){A()?.draw(g,Math.round(x),Math.round(y),v.cat||'astro',pose,frame,{scale:sc,flip,gear:v.cat===v.myCat?v.gear:null})}
const lineY=(set,H)=>H*(set?.ground||.8);
const TEMPLATES=[
 {id:'zoomies',name:'Zoomies',icon:'💨',cap:'when the zoomies hit at 3am 😼',draw(g,W,H,t,v,set){const y=lineY(set,H),k=(t*.45)%2,dir=k<1?1:-1,x=dir>0?-30+(k%1)*(W+60):W+30-(k%1)*(W+60);for(let i=0;i<5;i++)px(g,x-dir*(10+i*7),y-6-i%2*4,5,2,'#ffffffaa');cat(g,v,x,y,'run',Math.floor(t*10)%4,2.4,dir<0)}},
 {id:'dance',name:'Dance trend',icon:'💃',cap:'learned the Cat City shuffle 💃',draw(g,W,H,t,v,set){const y=lineY(set,H),b=Math.abs(Math.sin(t*6))*14;g.globalAlpha=.18;px(g,0,0,W,H,['#ff6f9a','#7fd6ff','#ffd45c','#9bf06a'][Math.floor(t*2)%4]);g.globalAlpha=1;cat(g,v,W/2,y-b,Math.floor(t*4)%2?'jump':'idle',Math.floor(t*4)%2,2.7,Math.floor(t*2)%2===1);for(let i=0;i<4;i++)px(g,(i*47+t*40)%W,(i*61+t*70)%(H*.6),4,4,'#fff')}},
 {id:'nap',name:'Nap time',icon:'😴',cap:'do not disturb 😴',draw(g,W,H,t,v,set){const y=lineY(set,H);px(g,W/2-40,y-10,80,14,'#9b5fd6');px(g,W/2-40,y-12,80,4,'#c9a2ff');cat(g,v,W/2,y-4,'sleep',Math.floor(t*1.5)%2,2.6);g.font='bold 15px system-ui';g.fillStyle='#fff';for(let i=0;i<3;i++){const k=(t*.6+i/3)%1;g.globalAlpha=1-k;g.fillText('z',W/2+20+i*8+k*12,y-40-k*40)}g.globalAlpha=1}},
 {id:'snack',name:'Taste test',icon:'😋',cap:'rating Galaxy Treats 10/10 🌌',draw(g,W,H,t,v,set){const y=lineY(set,H);cat(g,v,W/2-10,y,'sit',0,2.7);const im=itemImg(v.item||'galaxy_treats');const k=(t%3)/3;if(im)g.drawImage(im,W/2+20,y-70+Math.sin(t*4)*3,48,48);if(k>.5){g.font='bold 22px system-ui';g.fillText('😋',W/2-14,y-90)}
  if(k>.75){g.font='bold 20px system-ui';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#241832';g.strokeText('10/10!',W/2,H*.32);g.fillStyle='#ffd45c';g.fillText('10/10!',W/2,H*.32)}}},
 {id:'unbox',name:'Unboxing',icon:'📦',cap:'unboxing my Cat Tok Shop parcel 📦',draw(g,W,H,t,v,set){const y=lineY(set,H),k=Math.min(1,(t%5)/3);cat(g,v,W*.3,y,'interact',0,2.4);const bx=W*.62,by=y-30;px(g,bx-26,by,52,30,'#5a3a22');px(g,bx-24,by+2,48,26,'#c8955a');const fl=Math.round(k*16);px(g,bx-28-fl,by-3,26,5,'#dcae74');px(g,bx+2+fl,by-3,26,5,'#dcae74');
  const im=itemImg(v.item||'purrstation');if(im&&k>.6){const lift=(k-.6)*90;g.drawImage(im,bx-24,by-24-lift,48,48);for(let i=0;i<6;i++)px(g,bx-30+((i*17+t*30)%60),by-30-lift-((i*11)%30),3,3,'#ffd45c')}}},
 {id:'outfit',name:'Fit check',icon:'✨',cap:'fit check ✨ rate my gear',draw(g,W,H,t,v,set){const y=lineY(set,H),p=Math.floor(t*1.2)%4,pose=['walkFront','walk','walkBack','walk'][p];cat(g,v,W/2,y,pose,Math.floor(t*4)%2,3,p===3);for(let i=0;i<8;i++){const a=t*2+i*.8;px(g,W/2+Math.cos(a)*50,y-40+Math.sin(a)*30,3,3,'#fff6c4')}}},
 {id:'news',name:'News report',icon:'🎙️',cap:'reporting LIVE from Cat City 🎙️',draw(g,W,H,t,v,set){const y=lineY(set,H);cat(g,v,W/2,y-6,'idle',Math.floor(t*2)%2,2.6);if(set?.id!=='news'){px(g,0,y-6,W,H-y+6,'#2a3a6e');px(g,0,y-6,W,4,'#4a6abf')}
  T.live?.ticker?.(g,W,H-30,16,'BREAKING · '+String(v.caption||'Big news in Cat City!').toUpperCase(),t,{bg:'#c62f3a',size:10})}},
 {id:'story',name:'Storytime',icon:'📖',cap:'storytime: the day I met a Birman 😳',draw(g,W,H,t,v,set){const y=lineY(set,H);cat(g,v,W/2,y,'sit',0,2.6);const words=String(v.caption||'so this happened…').split(' '),n=Math.min(words.length,1+Math.floor((t%8)*2));T.live?.bubble?.(g,W,W/2,y-80,words.slice(0,n).join(' ')||'…',{size:11})}},
 {id:'jump',name:'Jump challenge',icon:'🧶',cap:'how many can you jump? 🧶',draw(g,W,H,t,v,set){const y=lineY(set,H),sp=70;let air=0;for(let i=0;i<3;i++){const ox=W-((t*sp+i*80)%(W+60));px(g,ox,y-12,14,12,'#e05a8a');px(g,ox+3,y-9,3,3,'#a83a66');const d=ox-W*.3;if(d>-10&&d<40)air=Math.max(air,Math.sin((40-d)/50*Math.PI)*42)}cat(g,v,W*.3,y-air,air>2?'jump':'run',air>2?0:Math.floor(t*10)%4,2.4)}},
 {id:'pov',name:'POV',icon:'👀',cap:'POV: you just joined Cat City 👀',draw(g,W,H,t,v,set){const y=lineY(set,H),k=(t%4)/4;cat(g,v,W/2,y-20+k*20,'walkFront',Math.floor(t*4)%2,1.6+k*2)}}
];
const TPL=Object.fromEntries(TEMPLATES.map(x=>[x.id,x]));

// The one drawing function every posted video uses.
const sheets={};
function sheetFor(v){if(v.localSheet)return v.localSheet;if(!v.id||v.mode!=='game')return null;if(!sheets[v.id]){const im=new Image();im.src='/api/cattok/video/'+encodeURIComponent(v.id)+'/frames';sheets[v.id]=im}return sheets[v.id].complete&&sheets[v.id].naturalWidth?sheets[v.id]:null}
function drawVideo(g,W,H,t,v){const dur=v.duration||10,lt=t%dur;
 if(v.mode==='game'){const im=sheetFor(v),fi=v.frameInfo;px(g,0,0,W,H,'#111');if(im&&fi){const i=Math.floor(lt*(fi.fps||3))%fi.n,cx=(i%fi.cols)*fi.fw,cy=Math.floor(i/fi.cols)*fi.fh;const sc=Math.max(W/fi.fw,H/fi.fh),dw=fi.fw*sc,dh=fi.fh*sc;g.imageSmoothingEnabled=false;g.drawImage(im,cx,cy,fi.fw,fi.fh,(W-dw)/2,(H-dh)/2,dw,dh)}else{g.font='bold 12px system-ui';g.textAlign='center';g.fillStyle='#fff';g.fillText('Loading…',W/2,H/2)}}
 else{const set=SET[v.set]||SET.village,tp=TPL[v.template]||TPL.zoomies;set.draw(g,W,H,lt);tp.draw(g,W,H,lt,v,set);set.front?.(g,W,H,lt)}
 if(v.caption&&v.template!=='story'&&v.template!=='news')T.caption(g,W,v.caption,Math.round(H*.24),11);
 if(v.sponsor){const sp=SPONSORS.find(x=>x.id===v.sponsor);if(sp){g.font='bold 7px system-ui';g.textAlign='left';const txt='Paid partnership · '+sp.name;const w=g.measureText(txt).width+8,y=Math.round(H*.7);px(g,6,y,w,11,'#000a');g.fillStyle='#fff';g.fillText(txt,10,y+8)}}
 // progress bar like the real app
 px(g,0,H-2,W,2,'#ffffff44');px(g,0,H-2,W*(lt/dur),2,'#fff')}

// ------------------------------------------------------------------ sponsors + second side quests
const SPONSORS=[
 {id:'marmalade',name:'Marmalade',npc:'marmalade',boost:2},{id:'pebble',name:'Pebble',npc:'pebble',boost:2},{id:'luna',name:'Luna',npc:'luna',boost:2},
 {id:'forge',name:'Forge',npc:'forge',boost:2},{id:'slaycat',name:'SlayCat',npc:'slaycat',boost:2},{id:'biscuit',name:'Biscuit',npc:'biscuit',boost:3}];
const biscuitDone=()=>{const C=s.castle||{};return !!((C.done||C.ch2||C.ch1)&&C.m2&&C.m3&&s.m4?.stage==='done')};
function sponsorOk(sp){if(owner())return true;if(sp.id==='biscuit')return biscuitDone();return (window.catCitySideQuests?.doneFor(sp.npc)||0)>=2}
function sponsorNeed(sp){if(sp.id==='biscuit')return 'Finish all 4 Biscuit & Birman missions';const n=window.catCitySideQuests?.doneFor(sp.npc)||0;return 'Finish 2 of '+sp.name+'\'s side quests ('+n+'/2)'}
s.ctStats=s.ctStats&&typeof s.ctStats==='object'?s.ctStats:{};const CS=s.ctStats;
const bump=(k,n=1)=>{CS[k]=(CS[k]||0)+n;core.persist()};
addEventListener('catcity:cattok-unboxed',()=>bump('unboxed'));
const SQ=[
 {id:'ct_marmalade',npc:'marmalade',who:'Marmalade',title:'Unboxing Day',ask:'Have you tried the <b>Cat Tok Shop</b> on your 📱 phone? Order something and <b>open the parcel</b> when it arrives. I love a good unboxing!',prog:()=>Math.min(1,CS.unboxed||0)+'/1 parcels opened',ready:()=>(CS.unboxed||0)>=1,reward:{fish:80,xp:50},thanks:'Ooh, what did you get? That box was so satisfying! I\'d love to sponsor your Cat Tok videos now. 🤝'},
 {id:'ct_pebble',npc:'pebble',who:'Pebble',title:'A Story for Cat Tok',ask:'Every story deserves an audience. <b>Post a video</b> on Cat Tok (📱 → ➕). Storytime is my favourite!',prog:()=>Math.min(1,CS.posted||0)+'/1 videos posted',ready:()=>(CS.posted||0)>=1,reward:{fish:80,xp:50},thanks:'A wonderful little tale! I\'ll sponsor your next one, if you like. 🤝'},
 {id:'ct_luna',npc:'luna',who:'Luna',title:'Spread the Love',ask:'Kindness is a kind of magic. <b>Like 5 videos</b> on Cat Tok to make other cats smile.',prog:()=>Math.min(5,CS.liked||0)+'/5 likes',ready:()=>(CS.liked||0)>=5,reward:{fish:70,xp:45},thanks:'I felt the sparkle from here! You may carry my name on your videos now. 🤝'},
 {id:'ct_forge',npc:'forge',who:'Forge',title:'Support the Streamers',ask:'Live streamers work hard! <b>Send a gift</b> on any Cat Tok LIVE.',prog:()=>Math.min(1,CS.gifted||0)+'/1 gifts sent',ready:()=>(CS.gifted||0)>=1,reward:{fish:90,xp:50},thanks:'Generous paws! Forge Works will sponsor you any day. 🤝'},
 {id:'ct_slaycat',npc:'slaycat',who:'SlayCat',title:'Main Character Energy',ask:'Bestie, you need <b>followers</b>! <b>Follow 3 creators</b> on Cat Tok and they\'ll follow back. 💅',prog:()=>Math.min(3,Object.values(T.state.follows||{}).filter(Boolean).length)+'/3 following',ready:()=>Object.values(T.state.follows||{}).filter(Boolean).length>=3,reward:{fish:80,xp:50},thanks:'Iconic. SlayCat officially sponsors you. Don\'t let it go to your head! 🤝'}];
function addQuests(){if(!window.catCitySideQuests)return false;SQ.forEach(q=>window.catCitySideQuests.add(q));return true}
if(!addQuests()){const iv=setInterval(()=>{if(addQuests())clearInterval(iv)},1000)}

// ------------------------------------------------------------------ styles
const css=document.createElement('style');css.textContent=`
.ctc{background:#fff;color:#161823;height:100%;overflow-y:auto;padding:calc(48px + env(safe-area-inset-top)) 0 20px;font:14px -apple-system,system-ui,sans-serif}
.ctc h2{font:800 18px system-ui;text-align:center;margin:0 0 4px}.ctc .sub{text-align:center;color:#8a8b91;font-size:13px;margin-bottom:12px}
.ctc-two{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 14px}
.ctc-big{border-radius:16px!important;padding:18px 10px;background:#f1f1f2!important;text-align:center;font:800 15px system-ui;display:flex;flex-direction:column;gap:6px;align-items:center}
.ctc-big i{font-size:38px;font-style:normal}.ctc-big small{font:500 12px system-ui;color:#8a8b91}
.ctc-sec{font:800 14px system-ui;padding:14px 14px 6px}
.ctc-row{display:flex;gap:8px;overflow-x:auto;padding:0 14px 6px;scrollbar-width:none}.ctc-row::-webkit-scrollbar{display:none}
.ctc-chip{flex:none;border-radius:12px!important;padding:8px 10px;background:#f1f1f2!important;font:700 13px system-ui;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:74px}
.ctc-chip i{font-size:22px;font-style:normal}.ctc-chip.on{background:#161823!important;color:#fff}.ctc-chip.lock{opacity:.45}
.ctc-prev{position:relative;margin:4px auto 0;width:52%;aspect-ratio:9/16;border-radius:12px;overflow:hidden;background:#000}
.ctc-prev canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated}
.ctc-field{padding:6px 14px}.ctc-field label{display:flex;justify-content:space-between;align-items:center;font:600 14px system-ui;gap:10px}
.ctc-field input[type=text]{width:100%;border:1px solid #ddd!important;border-radius:8px!important;padding:10px!important;font:14px system-ui!important;background:#fff;color:#161823;box-sizing:border-box}
.ctc-field input[type=range]{flex:1}
.ctc-field select{border:1px solid #ddd!important;border-radius:8px!important;padding:8px!important;font:14px system-ui!important;background:#fff;color:#161823;max-width:60%}
.ctc-post{display:block;width:calc(100% - 28px);margin:14px auto 0;border-radius:8px!important;padding:14px 0;background:#fe2c55!important;color:#fff;font:800 16px system-ui}
.ctc-note{font:12px system-ui;color:#8a8b91;padding:2px 14px}
.ctc-sw{position:relative;width:46px;height:28px;border-radius:14px;background:#ddd;flex:none;transition:background .2s}.ctc-sw.on{background:#20d5ec}.ctc-sw::after{content:'';position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px #0003}.ctc-sw.on::after{left:21px}
#cc-rec{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);z-index:9440;display:none;align-items:center;gap:10px;padding:8px 10px 8px 14px;border-radius:24px;background:#000d;color:#fff;font:800 15px system-ui;box-shadow:0 4px 16px #0006}
#cc-rec.on{display:flex}#cc-rec i{width:12px;height:12px;border-radius:50%;background:#fe2c55;animation:ccRec 1s infinite}@keyframes ccRec{50%{opacity:.25}}
#cc-rec button{border-radius:16px!important;padding:6px 12px;background:#fe2c55!important;color:#fff;font:800 13px system-ui;border:0}
.ct-verify{position:absolute;right:12px;top:calc(96px + env(safe-area-inset-top));z-index:5;border-radius:16px!important;padding:6px 12px;background:#20d5ec!important;color:#fff;font:800 13px system-ui!important;box-shadow:0 2px 8px #0005}
.ct-verify.done{background:#ffffffdd!important;color:#161823}
.ct-vbadge{position:absolute;left:10px;top:calc(96px + env(safe-area-inset-top));z-index:5;background:#000a;color:#fff;font:700 11px system-ui;padding:3px 7px;border-radius:6px}
`;document.head.append(css);

// ------------------------------------------------------------------ the Create page
const draft={mode:'set',template:'zoomies',set:'village',cat:null,duration:10,caption:'',sound:'original sound',sponsor:'',voice:false,item:''};
const SOUNDS=['original sound','Cat City shuffle (trend)','Lo-fi purrs','Petal Breeze','Static Showtime','Galaxy Treats jingle','Dramatic zoom'];
let prevRaf=0,voiceRec=null,voiceData=null,recorded=null;
function myCat(){return CATS[s.cat||0]||'astro'}
function createPage(el){cancelAnimationFrame(prevRaf);if(!draft.cat)draft.cat=myCat();if(!draft.item){const st=Object.keys(s.ctShop?.stuff||{});draft.item=st[0]||''}
 if(recorded){postPage(el);return}
 el.innerHTML='<div class="ctc"><h2>Create</h2><div class="sub">Make a video up to 30 seconds</div><div class="ctc-two"><button class="ctc-big" data-m="set"><i>🎬</i>Use a set<small>Templates + backgrounds</small></button><button class="ctc-big" data-m="game"><i>🎮</i>Record gameplay<small>Film yourself playing</small></button></div>'+
  '<div class="ctc-sec">Your creator stats</div><div class="ctc-note">'+(CS.posted||0)+' videos posted · '+(T.state.followers||0)+' followers'+(ME.verified||owner()?' · <b style="color:#20d5ec">✔ Verified</b>: you can go LIVE':' · not verified yet (the owner verifies creators, then you can go LIVE)')+'</div>'+
  '<div class="ctc-sec">🤝 Sponsors</div>'+SPONSORS.map(sp=>'<div class="ctc-note">'+(sponsorOk(sp)?'✅ <b>'+sp.name+'</b> sponsors you · '+sp.boost+'× boost':'🔒 '+sp.name+' ('+sp.boost+'×): '+esc(sponsorNeed(sp)))+'</div>').join('')+
  (window.CatTokLive&&(ME.verified||owner())?'<button class="ctc-post" data-live style="background:#161823!important">🔴 Go LIVE</button>':'')+'</div>';
 el.querySelector('[data-m="set"]').onclick=()=>{draft.mode='set';setPage(el)};
 el.querySelector('[data-m="game"]').onclick=()=>gamePage(el);
 el.querySelector('[data-live]')?.addEventListener('click',()=>window.CatTokLive?.start?.())}
function chip(on,lock,icon,name,attr){return '<button class="ctc-chip'+(on?' on':'')+(lock?' lock':'')+'" '+attr+'><i>'+icon+'</i>'+esc(name)+(lock?' 🔒':'')+'</button>'}
function setPage(el){cancelAnimationFrame(prevRaf);
 el.innerHTML='<div class="ctc"><h2>🎬 On a set</h2><div class="ctc-prev"><canvas width="180" height="320"></canvas></div>'+
  '<div class="ctc-sec">Template</div><div class="ctc-row">'+TEMPLATES.map(x=>chip(draft.template===x.id,false,x.icon,x.name,'data-tp="'+x.id+'"')).join('')+'</div>'+
  '<div class="ctc-sec">Set</div><div class="ctc-row">'+SETS.filter(x=>x.need!=='owner'||owner()).map(x=>chip(draft.set===x.id,!owns(x.id),x.icon,x.name,'data-st="'+x.id+'"')).join('')+'</div><div class="ctc-note" data-need></div>'+
  '<div class="ctc-sec">Cat</div><div class="ctc-row">'+CATS.map((c,i)=>'<button class="ctc-chip'+(draft.cat===c?' on':'')+'" data-cat="'+c+'"><img src="'+T.avatar(c)+'" style="width:34px;height:34px;border-radius:50%;image-rendering:pixelated">'+esc((core.cats?.[i]?.name)||c)+'</button>').join('')+'</div>'+
  ((draft.template==='snack'||draft.template==='unbox')?'<div class="ctc-field"><label>Item <select data-item>'+(window.CatTokShop?.catalog||[]).map(c=>'<option value="'+c.id+'"'+(draft.item===c.id?' selected':'')+'>'+c.icon+' '+esc(c.name)+'</option>').join('')+'</select></label></div>':'')+
  details()+'<button class="ctc-post" data-next>Next</button><button class="ctc-note" data-back style="display:block;margin:10px auto">‹ Back</button></div>';
 const cv=el.querySelector('canvas'),c=T.crisp(cv);const t0=performance.now();const loop=n=>{if(!cv.isConnected)return;c.begin();try{drawVideo(c.g,180,320,(n-t0)/1000,{...draft,myCat:myCat(),gear:myGear()})}catch(e){}prevRaf=requestAnimationFrame(loop)};prevRaf=requestAnimationFrame(loop);
 el.querySelectorAll('[data-tp]').forEach(b=>b.onclick=()=>{const was=TPL[draft.template];draft.template=b.dataset.tp;if(!draft.caption||draft.caption===was?.cap)draft.caption=TPL[draft.template].cap;if(draft.template==='snack'&&!draft.item)draft.item='galaxy_treats';setPage(el)});
 el.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{const id=b.dataset.st;if(!owns(id)){el.querySelector('[data-need]').textContent='🔒 '+SET[id].name+': '+needText(id);return}draft.set=id;setPage(el)});
 el.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{draft.cat=b.dataset.cat;setPage(el)});
 el.querySelector('[data-item]')?.addEventListener('change',e=>draft.item=e.target.value);
 wireDetails(el);el.querySelector('[data-next]').onclick=()=>{recorded={mode:'set'};postPage(el)};el.querySelector('[data-back]').onclick=()=>createPage(el)}
function details(){return '<div class="ctc-field"><label>Length <input type="range" min="5" max="30" value="'+draft.duration+'" data-dur><b data-durv>'+draft.duration+'s</b></label></div>'}
function wireDetails(el){const d=el.querySelector('[data-dur]');if(d)d.oninput=()=>{draft.duration=+d.value;el.querySelector('[data-durv]').textContent=d.value+'s'}}
if(!draft.caption)draft.caption=TPL.zoomies.cap;

// ------------------------------------------------------------------ gameplay recording
function gamePage(el){cancelAnimationFrame(prevRaf);
 el.innerHTML='<div class="ctc"><h2>🎮 Record gameplay</h2><div class="sub">Your phone goes away and the game is filmed.<br>Tap ⏹ Stop when you\'re done (30 seconds max).</div>'+
  '<div class="ctc-field"><label>🎙️ Use my voice <span class="ctc-sw'+(draft.voice?' on':'')+'" data-voice></span></label></div><div class="ctc-note">Off unless you switch it on. Your voice is heard by everyone who watches your video.</div>'+
  '<button class="ctc-post" data-go>🔴 Start recording</button><button class="ctc-note" data-back style="display:block;margin:10px auto">‹ Back</button></div>';
 el.querySelector('[data-voice]').onclick=e=>{draft.voice=!draft.voice;e.currentTarget.classList.toggle('on',draft.voice)};
 el.querySelector('[data-back]').onclick=()=>createPage(el);el.querySelector('[data-go]').onclick=()=>recordGame()}
const rec=document.createElement('div');rec.id='cc-rec';rec.className='cc-no-pixel';rec.innerHTML='<i></i><span data-t>0:00</span><span data-mic></span><button type="button" data-stop>⏹ Stop</button>';document.body.append(rec);
let recState=null;
async function recordGame(){window.CatPhone?.close?.();const FW=90,FH=160,FPS=2,MAX=30;if(Object.values(TPL).some(x=>x.cap===draft.caption))draft.caption='';
 const frames=[];let startAt=0;voiceData=null;
 if(draft.voice)await startVoice();
 recState={frames,timer:0};startAt=performance.now();rec.classList.add('on');rec.querySelector('[data-mic]').textContent=voiceRec?'🎙️':'';
 const grab=()=>{const g=$('game');if(!g)return;const cw=g.width,ch=g.height,zoom=Math.max(1,Math.min(2.2,Math.min(cw,ch*9/16)/190));let w=Math.min(cw,ch*9/16)/zoom,h=w*16/9;if(h>ch){h=ch;w=h*9/16}const c=document.createElement('canvas');c.width=FW;c.height=FH;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(g,(cw-w)/2,(ch-h)/2,w,h,0,0,FW,FH);frames.push(c)};
 grab();recState.timer=setInterval(()=>{const el=(performance.now()-startAt)/1000;rec.querySelector('[data-t]').textContent='0:'+String(Math.floor(el)).padStart(2,'0')+' / 0:30';if(frames.length<MAX*FPS)grab();if(el>=MAX)stopRecording()},1000/FPS);
 rec.querySelector('[data-stop]').onclick=()=>stopRecording()}
async function stopRecording(){if(!recState)return;clearInterval(recState.timer);const frames=recState.frames;recState=null;rec.classList.remove('on');await stopVoice();
 if(frames.length<3){core.note?.('🎬 That was too short. Try again!');return}
 recorded={mode:'game',...packFrames(frames,90,160,2)};draft.duration=Math.min(30,Math.max(3,Math.round(frames.length/2)));
 window.CatPhone?.open?.('cattok');setTimeout(()=>T.go?.('create'),450)}
function packFrames(frames,FW,FH,fps){let list=frames.slice(),q=.62,url='';
 for(let tries=0;tries<8;tries++){const cols=10,rows=Math.ceil(list.length/cols),c=document.createElement('canvas');c.width=cols*FW;c.height=rows*FH;const g=c.getContext('2d');list.forEach((f,i)=>g.drawImage(f,(i%cols)*FW,Math.floor(i/cols)*FH));url=c.toDataURL('image/jpeg',q);
  const bytes=Math.floor((url.length-23)*3/4);if(bytes<=165000){const img=new Image();img.src=url;return{frames:url,frameInfo:{cols,rows,n:list.length,fw:FW,fh:FH,fps},sheet:img}}
  if(q>.4)q-=.1;else{list=list.filter((_,i)=>i%2===0);fps=Math.max(1,fps/2)}}
 return{frames:null}}
async function startVoice(){voiceRec=null;try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const type=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg'].find(t=>window.MediaRecorder?.isTypeSupported?.(t));
  const mr=new MediaRecorder(stream,{mimeType:type,audioBitsPerSecond:24000});const chunks=[];mr.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};mr.start(500);voiceRec={mr,stream,chunks,type}}catch(e){core.note?.('🎙️ No microphone, so the video has no voice.');}}
function stopVoice(){return new Promise(ok=>{if(!voiceRec){ok();return}const {mr,stream,chunks,type}=voiceRec;voiceRec=null;mr.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:(type||'audio/webm').split(';')[0]});
  if(blob.size>130000){core.note?.('🎙️ Your voice recording was too long to send, so it was left off.');ok();return}const fr=new FileReader();fr.onload=()=>{voiceData=String(fr.result).replace(/^data:audio\/([a-z0-9]+)(;[^,]*)?;base64,/,'data:audio/$1;base64,');ok()};fr.readAsDataURL(blob)};try{mr.stop()}catch(e){ok()}})}

// ------------------------------------------------------------------ post screen (both kinds)
function postPage(el){cancelAnimationFrame(prevRaf);const sponsors=SPONSORS.filter(sponsorOk);if(draft.sponsor&&!sponsors.some(x=>x.id===draft.sponsor))draft.sponsor='';
 el.innerHTML='<div class="ctc"><h2>Post</h2><div class="ctc-prev"><canvas width="180" height="320"></canvas></div>'+
  '<div class="ctc-field"><input type="text" maxlength="120" placeholder="Describe your video… #catcity" value="'+esc(draft.caption)+'" data-cap></div>'+
  (recorded.mode==='set'?'<div class="ctc-field"><label>🎙️ Add my voice <span class="ctc-sw'+(draft.voice?' on':'')+'" data-voice></span></label></div><div class="ctc-note" data-vnote>'+(voiceData?'✅ Voice recorded · ':'')+'Off unless you switch it on. Record while the preview plays.</div>':(voiceData?'<div class="ctc-note">🎙️ Your voice is on this video.</div>':''))+
  '<div class="ctc-field"><label>Sound <select data-sound>'+SOUNDS.map(x=>'<option'+(draft.sound===x?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label></div>'+
  '<div class="ctc-field"><label>🤝 Sponsor <select data-sp><option value="">None</option>'+sponsors.map(x=>'<option value="'+x.id+'"'+(draft.sponsor===x.id?' selected':'')+'>'+esc(x.name)+' · '+x.boost+'× boost</option>').join('')+'</select></label></div>'+
  (sponsors.length?'':'<div class="ctc-note">No sponsors yet: finish 2 side quests for an NPC (or all of Biscuit\'s missions).</div>')+
  '<button class="ctc-post" data-post>Post</button><div class="ctc-note" data-msg style="text-align:center"></div><button class="ctc-note" data-back style="display:block;margin:10px auto">‹ Discard</button></div>';
 const v=()=>({...draft,...(recorded.mode==='game'?{mode:'game',frameInfo:recorded.frameInfo,localSheet:recorded.sheet}:{mode:'set'}),myCat:myCat(),gear:myGear()});
 const cv=el.querySelector('canvas'),c=T.crisp(cv);let t0=performance.now();const loop=n=>{if(!cv.isConnected)return;c.begin();try{drawVideo(c.g,180,320,(n-t0)/1000,v())}catch(e){}prevRaf=requestAnimationFrame(loop)};prevRaf=requestAnimationFrame(loop);
 el.querySelector('[data-cap]').oninput=e=>draft.caption=e.target.value;el.querySelector('[data-sound]').onchange=e=>draft.sound=e.target.value;el.querySelector('[data-sp]').onchange=e=>draft.sponsor=e.target.value;
 el.querySelector('[data-voice]')?.addEventListener('click',async e=>{const sw=e.currentTarget;draft.voice=!draft.voice;sw.classList.toggle('on',draft.voice);const note=el.querySelector('[data-vnote]');
  if(draft.voice){note.textContent='🎙️ Recording for '+draft.duration+'s… talk now!';t0=performance.now();await startVoice();if(!voiceRec){draft.voice=false;sw.classList.remove('on');note.textContent='No microphone.';return}setTimeout(async()=>{await stopVoice();note.textContent=voiceData?'✅ Voice recorded ('+draft.duration+'s). Switch off to remove it.':'Voice left off.'},draft.duration*1000)}
  else{voiceData=null;note.textContent='Voice removed.'}});
 el.querySelector('[data-back]').onclick=()=>{recorded=null;voiceData=null;draft.voice=false;createPage(el)};
 el.querySelector('[data-post]').onclick=async e=>{const b=e.currentTarget,msg=el.querySelector('[data-msg]');b.disabled=true;msg.textContent='Posting…';
  const sp=SPONSORS.find(x=>x.id===draft.sponsor);
  const body={caption:draft.caption,sound:draft.sound,template:draft.template,set:draft.set,cat:draft.cat,gear:draft.cat===myCat()?myGear():{},sponsor:draft.sponsor,boost:sp?sp.boost:1,duration:draft.duration,item:draft.item,name:T.myName()};
  if(recorded.mode==='game'){if(!recorded.frames){msg.textContent='That recording was too big. Try a shorter one.';b.disabled=false;return}body.frames=recorded.frames;body.frameInfo=recorded.frameInfo}
  try{const r=await api('video',body);if(voiceData&&(draft.voice||recorded.mode==='game')){try{await api('video/'+r.video.id+'/audio',{audio:voiceData})}catch(err){core.note?.('🎙️ '+err.message)}}
   const mine=addServerVideo(r.video,true);if(recorded.mode==='game')mine.localSheet=recorded.sheet;
   bump('posted');T.state.followers=(T.state.followers||0)+Math.round((3+Math.random()*12)*(sp?sp.boost:1));T.save();
   recorded=null;voiceData=null;draft.voice=false;draft.sponsor='';window.catCitySfx?.('reward');T.toast('🎉 Posted!'+(sp?' '+sp.boost+'× boost from '+sp.name:''));setTimeout(()=>{T.go('profile')},700)}
  catch(err){msg.textContent='⚠️ '+err.message;b.disabled=false}}}

// ------------------------------------------------------------------ players' videos in the feed
const known=new Map();let audioEl=null,audioFor=null;
function views(v){const mins=Math.max(1,(Date.now()/1000-v.at)/60);return Math.round(Math.min(60000,mins*6)*(v.boost||1))}
function addServerVideo(v,mine){if(known.has(v.id)){const it=known.get(v.id);it.verified=v.verified;it.serverLikes=v.likes;return it}
 const it=T.addItem({id:'p:'+v.id,kind:'video',author:v.name,avatar:v.cat,verified:v.verified,caption:v.caption,tags:[],sound:v.sound+(v.sound==='original sound'?' - '+v.name:''),local:true,boost:v.boost||1,
  likes:(v.likes||0)+Math.round(views(v)/9),commentCount:Math.round(views(v)/60),saves:Math.round(views(v)/80),shares:Math.round(views(v)/120),
  w:180,h:T.screenH(),server:v,mine:!!mine||v.uid===ME.uid,
  draw(g,W,H,t){drawVideo(g,W,H,t,{...v,myCat:v.cat})},
  onLike:(item,on)=>{bump('liked',on?1:0);api('video/'+v.id+'/like',{}).catch(()=>{})},
  onShow:el=>{showExtras(el,it);playVoice(it)}});
 if(it.mine)it.author=T.myName();known.set(v.id,it);return it}
async function pull(){try{const r=await api('videos');for(const v of (r.videos||[]).slice().reverse())addServerVideo(v)}catch(e){}}
pull();setInterval(()=>{if(T.app)pull()},30000);addEventListener('catcity:phone-open',pull);
function playVoice(it){const v=it.server;if(audioFor===it.id)return;stopVoiceAudio();if(!v?.audio)return;audioEl=new Audio('/api/cattok/video/'+encodeURIComponent(v.id)+'/audio');audioEl.loop=true;audioFor=it.id;audioEl.play().catch(()=>{})}
function stopVoiceAudio(){if(audioEl){audioEl.pause();audioEl=null}audioFor=null}
setInterval(()=>{if(!audioEl)return;const vis=T.app?.querySelector('.ct-page.on[data-p="home"]');const el=T.app?.querySelector('.ct-item[data-id="'+CSS.escape(audioFor||'')+'"]');if(!vis||!el||document.querySelector('.ct-liveroom'))stopVoiceAudio();else{const r=el.getBoundingClientRect(),fr=T.app.querySelector('.ct-feed').getBoundingClientRect();if(Math.abs(r.top-fr.top)>r.height*.5)stopVoiceAudio()}},500);
// Owner: ✔️ Verify on players' videos.
function showExtras(el,it){if(!el||el.querySelector('.ct-verify,.ct-vbadge'))return;const v=it.server;if(!v)return;
 if(v.sponsor){const sp=SPONSORS.find(x=>x.id===v.sponsor);if(sp){const b=document.createElement('div');b.className='ct-vbadge';b.textContent='🤝 '+sp.name+' · '+sp.boost+'× boost';el.append(b)}}
 if(!(owner()||ME.owner)||v.owner||v.uid===ME.uid)return;const b=document.createElement('button');b.className='ct-verify'+(it.verified?' done':'');b.type='button';b.textContent=it.verified?'✔ Verified':'✔️ Verify @'+v.name;
 b.onclick=async e=>{e.stopPropagation();const on=!it.verified;b.disabled=true;try{await api('verify',{uid:v.uid,on});for(const x of known.values())if(x.server.uid===v.uid){x.verified=on;x.server.verified=on}b.className='ct-verify'+(on?' done':'');b.textContent=on?'✔ Verified':'✔️ Verify @'+v.name;
  const name=el.querySelector('.ct-info .name');if(name){name.querySelector('.tick')?.remove();if(on)name.insertAdjacentHTML('beforeend','<span class="tick">✓</span>')}T.toast(on?'✔ @'+v.name+' is verified and can go LIVE':'Verification removed')}catch(err){T.toast('⚠️ '+err.message)}b.disabled=false};el.append(b)}
// Owner: 🛡️ Creators list in the profile (watch, verify, remove).
const oldExtra=T.pageHooks.profileExtra;
T.pageHooks.profileExtra=(slot,apiObj)=>{if(oldExtra)oldExtra(slot,apiObj);if(!slot)return;if(!(owner()||ME.owner)){slot.textContent=(ME.verified?'✔ Verified creator':'🎬 '+(CS.posted||0)+' videos');return}slot.textContent='🛡️ Creators';slot.style.cursor='pointer';slot.onclick=creators};
async function creators(){await pull();const app=T.app;if(!app)return;app.querySelector('.cts-pg')?.remove();const byUid=new Map();for(const it of known.values()){const v=it.server;if(v.owner)continue;const e=byUid.get(v.uid)||{uid:v.uid,name:v.name,verified:v.verified,cat:v.cat,videos:[]};e.videos.push(it);byUid.set(v.uid,e)}
 const d=document.createElement('div');d.className='cts-pg';d.innerHTML='<button class="back" data-back>‹</button><div style="padding:calc(50px + env(safe-area-inset-top)) 0 0"><h2 style="font:800 17px system-ui;text-align:center;margin:0 0 4px">🛡️ Creators</h2><div style="text-align:center;color:#8a8b91;font-size:12px;margin-bottom:8px">Watch their videos, then verify them so they can go LIVE.</div>'+
  ([...byUid.values()].map(c=>'<div class="cts-line"><img src="'+T.avatar(c.cat)+'"><div class="tx"><b>@'+esc(c.name)+(c.verified?' <span style="color:#20d5ec">✔</span>':'')+'</b><span>'+c.videos.length+' video'+(c.videos.length>1?'s':'')+'</span></div><button class="cts-btn g" data-watch="'+esc(c.uid)+'">▶ Watch</button> <button class="cts-btn'+(c.verified?' g':'')+'" data-ver="'+esc(c.uid)+'">'+(c.verified?'Unverify':'✔️ Verify')+'</button></div>').join('')||'<div style="text-align:center;color:#8a8b91;padding:40px">No player videos yet.</div>')+'</div>';
 app.append(d);d.querySelector('[data-back]').onclick=()=>d.remove();
 d.querySelectorAll('[data-watch]').forEach(b=>b.onclick=()=>{const c=byUid.get(b.dataset.watch);d.remove();if(c?.videos[0])T.jumpTo?T.jumpTo(c.videos[0].id):T.go('home')});
 d.querySelectorAll('[data-ver]').forEach(b=>b.onclick=async()=>{const c=byUid.get(b.dataset.ver);try{await api('verify',{uid:c.uid,on:!c.verified});c.videos.forEach(x=>{x.verified=!c.verified;x.server.verified=!c.verified});T.toast(!c.verified?'✔ @'+c.name+' verified':'Verification removed');creators()}catch(e){T.toast('⚠️ '+e.message)}})}

T.pageHooks.create=el=>{refreshMe().then(()=>{if(el.isConnected&&!recorded&&el.querySelector('.ctc h2')?.textContent==='Create')createPage(el)});createPage(el)};
T.video={sets:SETS,templates:TEMPLATES,draw:drawVideo,owns,needText,sponsors:()=>SPONSORS.filter(sponsorOk),allSponsors:SPONSORS,me:()=>ME,refreshMe,api,secret,myGear,known,stats:CS};
window.dispatchEvent(new CustomEvent('catcity:cattok-create-ready'));
};
if(window.CatTok&&window.__catCityEngine)start();else{const iv=setInterval(()=>{if(window.CatTok&&window.__catCityEngine){clearInterval(iv);start()}},500)}
})();

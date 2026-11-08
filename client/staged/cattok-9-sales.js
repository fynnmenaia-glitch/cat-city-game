/* Cat Tok part 9: selling lives.
 * 🍑 Peachy Paws LIVE: the iced tea live (made-up brand). Marmalade and Luna behind a table of bottles
 *    and a bowl of ice, shelves of bottles, fairy lights; the yellow bottom half with the big Peachy
 *    Paws logo, "10% OFF" and "LIVE EXCLUSIVE"; a Giveaway Goal likes bar and Hourly Ranking; a flash
 *    sale card pops up with a countdown, the crossed-out price, the discount and a Buy button.
 *    Tap 25 hearts in one visit and you win the giveaway (a free Peachy Paws, once per in-game day).
 * 🌌 Galaxy's ASMR LIVE: Galaxy whispers into a fluffy microphone, taps it, crunches Galaxy Treats and
 *    begs for gifts ("please give me gifts…"). Gifts make her very happy. Galaxy Treats flash sale.
 * Buying here uses CatTokShop.buy(id, {price}) so it becomes a normal order and parcel.
 */
(()=>{'use strict';
const start=()=>{const T=window.CatTok,core=window.__catCityEngine,SHOP=window.CatTokShop;if(!T||!core||!T.addLive||!SHOP||T.salesReady)return;T.salesReady=true;
const s=core.state,R=T.R,esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const A=()=>window.catCityCatArt,DAY=()=>window.catCityClock?.DAY_MS||300000;
const imgs={};function art(id){const k=id;if(!imgs[k]){const i=new Image();i.src=SHOP.art(id,64);imgs[k]=i}return imgs[k].complete?imgs[k]:null}

// ------------------------------------------------------------------ the flash sale card (both lives)
const css=document.createElement('style');css.textContent=`
.ct-fs{position:absolute;left:8px;right:8px;bottom:calc(60px + env(safe-area-inset-bottom));z-index:7;display:flex;gap:9px;align-items:center;background:#fff;color:#161823;border-radius:12px;padding:8px;box-shadow:0 6px 18px #0006;animation:ctFs .35s cubic-bezier(.2,.9,.3,1.2)}
@keyframes ctFs{from{transform:translateY(40px);opacity:0}}
.ct-fs img{width:58px;height:58px;border-radius:8px;image-rendering:pixelated;background:#fff4e2;flex:none}
.ct-fs .tx{flex:1;min-width:0;font:12px system-ui}.ct-fs .br{color:#8a8b91;font-size:11px}
.ct-fs .nm{font:700 13px system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ct-fs .nm em{font-style:normal;background:#161823;color:#fff;font:800 9px system-ui;border-radius:3px;padding:1px 4px;margin-right:4px;vertical-align:1px}
.ct-fs .fl{color:#fe2c55;font:700 11px system-ui}.ct-fs .pr{font:900 15px system-ui}.ct-fs .pr s{color:#8a8b91;font:500 11px system-ui;margin-left:4px}.ct-fs .pr u{text-decoration:none;background:#fe2c55;color:#fff;font:800 10px system-ui;border-radius:3px;padding:1px 3px;margin-left:4px}
.ct-fs .cd{position:absolute;left:8px;top:-10px;background:#fe2c55;color:#fff;font:800 11px system-ui;border-radius:6px;padding:2px 6px}
.ct-fs .buy{flex:none;border-radius:8px!important;background:#fe2c55!important;color:#fff!important;font:800 14px system-ui!important;padding:9px 16px}
.ct-fs .cl{position:absolute;right:4px;top:2px;color:#8a8b91;font-size:14px;width:22px;height:22px}
.ct-bag{position:absolute;left:10px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:6;width:40px;height:40px;border-radius:50%;background:#ff7a1a;font-size:20px;display:flex;align-items:center;justify-content:center}
.ct-bag i{position:absolute;top:-4px;right:-4px;background:#fff;color:#161823;font:800 10px/16px system-ui;font-style:normal;border-radius:8px;min-width:16px;text-align:center}
.ct-liveroom:has(.ct-bag) .ct-lr-bar{left:58px}
`;document.head.append(css);
function flashCard(room,o){room.querySelector('.ct-fs')?.remove();const c=SHOP.byId[o.id];if(!c)return;const ends=Date.now()+o.secs*1000;const d=document.createElement('div');d.className='ct-fs';
 d.innerHTML='<span class="cd" data-cd>⚡ --:--</span><img src="'+SHOP.art(o.id,96)+'"><div class="tx"><div class="br">'+esc(o.brand)+'</div><div class="nm"><em>OFFICIAL</em>'+esc(c.name)+'</div><div class="fl">⚡ LIVE flash sale</div><div class="pr">🐟 '+o.price+'<s>🐟 '+(c.was||c.price)+'</s><u>-'+Math.round((1-o.price/(c.was||c.price))*100)+'%</u></div></div><button class="buy" type="button">Buy</button><button class="cl" type="button" aria-label="Close">✕</button>';
 room.append(d);d.addEventListener('click',e=>e.stopPropagation());d.querySelector('.cl').onclick=()=>d.remove();
 d.querySelector('.buy').onclick=()=>{if(SHOP.buy(o.id,{price:o.price,from:o.from})){T.live.sys('🛒 You bought '+c.name+'! Arrives in about 1 in-game day 📦');window.catCitySfx?.('buy');d.querySelector('.buy').textContent='Bought ✓';d.querySelector('.buy').disabled=true;o.left=Math.max(0,(o.left||3)-1)}else T.live.sys('🐟 Not enough fish for that one.')};
 const tick=()=>{if(!d.isConnected)return;const ms=Math.max(0,ends-Date.now());d.querySelector('[data-cd]').textContent='⚡ '+String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0');if(ms<=0){d.remove();return}setTimeout(tick,500)};tick()}
function bag(room,items,brand,from){const b=document.createElement('button');b.className='ct-bag';b.type='button';b.innerHTML='🛍️<i>'+items.length+'</i>';room.append(b);
 b.onclick=e=>{e.stopPropagation();const sh=T.sheet('<div class="ct-sh-head">'+esc(brand)+' · LIVE deals<button class="x">✕</button></div><div style="overflow-y:auto;padding-bottom:10px">'+items.map(o=>{const c=SHOP.byId[o.id];return '<div class="cts-line"><img src="'+SHOP.art(o.id,96)+'"><div class="tx"><b>'+esc(c.name)+'</b><span style="color:#fe2c55;font-weight:800">🐟 '+o.price+'</span> <span><s>🐟 '+(c.was||c.price)+'</s></span></div><button class="cts-btn" data-b="'+o.id+'">Buy</button></div>'}).join('')+'</div>');
  sh.querySelectorAll('[data-b]').forEach(x=>x.onclick=()=>{const o=items.find(i=>i.id===x.dataset.b);if(SHOP.buy(o.id,{price:o.price,from})){x.textContent='✓';x.disabled=true;T.live.sys('🛒 Bought '+SHOP.byId[o.id].name+' 📦')}else T.toast('🐟 Not enough fish')})}}

// ------------------------------------------------------------------ 🍑 Peachy Paws LIVE
const PEACH_DEALS=[{id:'peachy_tea_12',price:45,secs:252,brand:'Peachy Paws Drinks',from:'peachy-live'},{id:'peachy_tea',price:5,secs:180,brand:'Peachy Paws Drinks',from:'peachy-live'},{id:'mini_fridge',price:60,secs:200,brand:'Peachy Paws × Whisker Home',from:'peachy-live'}];
const BOTTLES=[['#c25a1e','#ffa66b','PEACH'],['#a0356a','#ff7ab0','BERRY'],['#e0c13c','#ffe06b','LEMON'],['#7ab83c','#c6f08a','GREEN']];
function bottle(g,x,y,k,i){const [c,l]=BOTTLES[i%4];R(g,x+1*k,y,3*k,2*k,'#241832');R(g,x+2*k/2,y+2*k,4*k,1*k,'#241832');R(g,x,y+3*k,5*k,11*k,'#241832');R(g,x+1*k/2,y+3*k+k/2,4*k,10*k,c);R(g,x+1*k/2,y+7*k,4*k,3*k,'#fff3d0');R(g,x+1.5*k,y+7.5*k,2*k,2*k,l)}
const PEACH_LINES=[['marm','Peach is the BEST flavour, no debate 🍑'],['luna','Lemon is so refreshing though…'],['marm','Only 3 left on the 12-pack! Grab it now!'],['luna','Hit the giveaway goal and we do a giveaway! 🎁'],['marm','Ice ice baby 🧊'],['luna','Tap the screen for likes!'],['marm','Free delivery to your home 📦'],['luna','Which flavour should we try next?']];
let peachHearts=0;
const peach=T.addLive({id:'live-peachy',author:'peachypaws.tea',avatar:'marmalade',verified:true,caption:'🍑 LIVE EXCLUSIVE: 10% OFF Peachy Paws all day! Giveaway at 70K likes 🎁',tags:['peachypaws','icedtea','flashsale'],viewers:[260,420],hourly:'Hourly Ranking',
 welcome:'Welcome to the Peachy Paws LIVE! 🍑 Deals pop up below.',comments:['which flavour is best?','peach 🍑🍑','lemon gang 🍋','is the 12 pack still on sale??','GIVEAWAY 🎁','just bought one!','omg free delivery','ice ice baby lol','berry is underrated','hi from Cherry Grove 🌸'],
 quickComments:['Peach! 🍑','Lemon! 🍋','I bought one! 🛒','Giveaway please 🎁'],
 draw(g,W,H,t,L){const top=H*.56;
  // the room: warm wall, fairy lights, shelves of bottles, plant
  R(g,0,0,W,top,'#f2a72e');for(let x=0;x<W;x+=6)R(g,x,0,3,top,'#f5b445');R(g,0,0,W,10,'#8a5a34');for(let i=0;i<14;i++){const x=6+i*13;R(g,x,10+(i%2)*2,1,3,'#3a2416');g.globalAlpha=.6+.4*Math.sin(t*3+i);R(g,x-1,13+(i%2)*2,3,3,'#fff3c4');g.globalAlpha=1}
  for(const sy of [top*.36,top*.62]){R(g,W*.3,sy,W*.7,3,'#fff6e4');for(let i=0;i<9;i++)bottle(g,W*.32+i*13,sy-15,1,i)}R(g,4,top*.4,12,top*.6,'#3f9a45');R(g,0,top*.3,20,10,'#5fbf55');
  // goal bar
  const goal=70000,likes=L.likes;R(g,4,22,W-8,7,'#fff6e4');R(g,5,23,Math.min(W-10,(W-10)*likes/goal),5,'#ffd23c');g.font='bold 6px system-ui';g.textAlign='center';g.fillStyle='#241832';g.fillText(Math.round(likes/goal*100)+'%',W/2,28);
  g.textAlign='left';g.fillStyle='#fff';g.font='bold 6px system-ui';R(g,4,31,88,9,'#0006');g.fillStyle='#fff';g.fillText('Giveaway Goal · '+T.fmt(likes)+' / 70K Likes',7,38);
  // two hosts behind the table
  const spk=PEACH_LINES[Math.floor(t/4)%PEACH_LINES.length];const lean=k=>Math.round(Math.sin(t*2+k)*1.5);
  A()?.draw(g,W*.3,top-4+lean(0),'marmalade','idle',Math.floor(t*2)%2,{scale:2.2});A()?.draw(g,W*.72,top-4+lean(1),'luna','idle',Math.floor(t*2+1)%2,{scale:2.2,flip:true});
  R(g,0,top-16,W,18,'#fff6e4');R(g,0,top-16,W,2,'#e9dcc8');
  // bowl of ice + bottles on the table
  R(g,8,top-30,40,16,'#bfe8ff88');for(let i=0;i<6;i++)R(g,12+i*6,top-26+(i%2)*3,5,5,'#ffffffcc');for(let i=0;i<3;i++)bottle(g,14+i*10,top-48,1.2,i);for(let i=0;i<4;i++)bottle(g,W*.55+i*12,top-34,1.2,i+1);
  T.live.bubble(g,W,spk[0]==='marm'?W*.3:W*.72,top-58,spk[1],{size:8,max:W*.55});
  // bottom half: yellow stripes, the big logo, badges
  R(g,0,top+2,W,H-top,'#ffd23c');for(let x=0;x<W;x+=8)R(g,x,top+2,4,H-top,'#ffdc5a');const cx=W/2,cy=top+(H-top)*.42,r=34+Math.sin(t*2)*1.5;
  g.fillStyle='#fff3a0';g.beginPath();g.arc(cx,cy,r+6,0,7);g.fill();g.fillStyle='#ffe23c';g.beginPath();g.arc(cx,cy,r,0,7);g.fill();R(g,cx-36,cy-10,72,20,'#c62f3a');R(g,cx-38,cy-8,76,16,'#d9404a');g.font='bold 11px system-ui';g.textAlign='center';g.fillStyle='#fff';g.fillText('Peachy Paws',cx,cy+4);
  R(g,cx-6,cy-r+4,12,8,'#ffa66b');R(g,cx-1,cy-r+2,2,3,'#5fbf55');
  g.save();g.translate(28,top+18);g.rotate(-.2);R(g,-22,-12,46,26,'#ffffff');g.font='bold 11px system-ui';g.fillStyle='#e05a1e';g.textAlign='center';g.fillText('10%',0,0);g.fillText('OFF',0,11);g.restore();R(g,4,top+4,8,6,'#5fbf55');
  R(g,W-58,top+8,54,22,'#2f80ed');g.font='bold 9px system-ui';g.fillStyle='#fff';g.textAlign='center';g.fillText('LIVE',W-31,top+18);g.font='bold 6px system-ui';g.fillText('EXCLUSIVE',W-31,top+26)},
 onEnter(L,room){peachHearts=0;bag(room,PEACH_DEALS,'Peachy Paws','peachy-live');let i=0;const next=()=>{if(!room.isConnected)return;flashCard(room,PEACH_DEALS[i%PEACH_DEALS.length]);i++;setTimeout(next,26000)};setTimeout(next,1800)},
 onLike(L){peachHearts++;const day=Math.floor(Date.now()/DAY());if(peachHearts===25&&s.ctShop&&s.ctShop.giveawayDay!==day){s.ctShop.giveawayDay=day;SHOP.buy('peachy_tea',{price:0,from:'giveaway'});core.persist();T.live.sys('🎉 GIVEAWAY! You won a free Peachy Paws Iced Tea! It\'s on its way 📦');window.catCitySfx?.('reward')}},
 onGift(g){T.live.sys('💖 Marmalade: thank you for the '+g.name+'!')}});

// ------------------------------------------------------------------ 🌌 Galaxy's ASMR LIVE
const GALAXY_DEALS=[{id:'galaxy_treats',price:18,secs:240,brand:'Galaxy Treats',from:'galaxy-live'},{id:'galaxy_treats_xl',price:55,secs:240,brand:'Galaxy Treats',from:'galaxy-live'}];
const BEG=['please give me gifts…','please give me gifts…','pleeease… just one little gift? 🥺','tap tap tap… 🎤','*crunch* Galaxy Treats… mmm 😋','whisper… whisper… 🤫','a rose would make me sooo happy 🌹','please give me gifts, please give me gifts…','shhh… can you hear the crinkle? 🌌'];
let happyUntil=0,lastTap=0;
function asmr(kind){const c=window.catCityAudio?.ctx?.();if(!c||c.state!=='running')return;const len=kind==='crunch'?.12:.05,b=c.createBuffer(1,Math.floor(c.sampleRate*len),c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,kind==='crunch'?1.5:6);
 const src=c.createBufferSource();src.buffer=b;const f=c.createBiquadFilter();f.type=kind==='crunch'?'bandpass':'lowpass';f.frequency.value=kind==='crunch'?2400:900;const v=c.createGain();v.gain.value=kind==='crunch'?.05:.08;src.connect(f).connect(v).connect(c.destination);src.start()}
const galaxyLive=T.addLive({id:'live-galaxy',author:'galaxy.asmr',avatar:'galaxy',verified:true,caption:'🌌 ASMR with Galaxy · whispers, taps and Galaxy Treats crunching 🎤',tags:['asmr','galaxytreats','relax'],viewers:[880,1600],hourly:'ASMR ranking #1',
 welcome:'Welcome to Galaxy\'s ASMR LIVE 🌌 Shhh… headphones on 🎧',comments:['so relaxing 😌','the crunch 😩😩','GALAXY 💖','sending a rose 🌹','I can\'t afford a crown 😭','ASMR queen','tingles!!','who else has headphones on','Galaxy Treats are the best','the whispering lol'],
 quickComments:['So relaxing 😌','Hi Galaxy! 💖','More crunching! 😋','🌹🌹🌹'],
 draw(g,W,H,t,L){// a dark, cosy room with a fluffy mic
  T.sky(g,W,H,'#1d1530','#3a2a55');for(let i=0;i<20;i++){g.globalAlpha=.3+.3*Math.sin(t+i);R(g,(i*37)%W,(i*53)%(H*.6),2,2,'#c9a2ff')}g.globalAlpha=1;
  R(g,0,H*.68,W,H*.32,'#2a1f40');R(g,0,H*.68,W,2,'#4a3a70');const glow=.25+.1*Math.sin(t*1.5);g.globalAlpha=glow;g.fillStyle='#ff6fd8';g.beginPath();g.arc(W*.8,H*.25,40,0,7);g.fill();g.globalAlpha=1;
  const happy=Date.now()<happyUntil,lean=Math.sin(t*1.2)*2;A()?.draw(g,W*.42+lean,H*.7,'galaxy',happy?'jump':'idle',Math.floor(t*(happy?6:1.5))%2,{scale:3.4});
  // the fluffy microphone
  const mx=W*.68,my=H*.5;R(g,mx-2,my+10,4,H*.18,'#555');R(g,mx-10,H*.68,20,4,'#444');for(let i=0;i<40;i++){const a=i*.9,rr=12+((i*7)%5);R(g,mx+Math.cos(a)*rr*.8-1,my+Math.sin(a)*rr-1,3,3,i%3?'#9a8fb0':'#c4bcd6')}R(g,mx-8,my-10,16,20,'#b3a9cf');
  const tap=Math.floor(t*1.6)%5===0;if(tap){R(g,mx-16,my-4,6,4,'#e58c39');if(Date.now()-lastTap>600&&L.inRoom){lastTap=Date.now();asmr('tap')}}
  // Galaxy Treats bag
  const im=art('galaxy_treats');if(im)g.drawImage(im,W*.08,H*.56,38,38);
  const line=happy?'THANK YOU!! 💖 you\'re the best!':BEG[Math.floor(t/3.5)%BEG.length];if(line.includes('crunch')&&L.inRoom&&Math.floor(t*4)%3===0)asmr('crunch');
  T.live.bubble(g,W,W*.42,H*.36,line,{size:happy?10:8,max:W*.6,bg:happy?'#ffe0f4':'#fff'})},
 onEnter(L,room){bag(room,GALAXY_DEALS,'Galaxy Treats','galaxy-live');setTimeout(()=>{if(room.isConnected)flashCard(room,GALAXY_DEALS[0])},2500)},
 onGift(g,L){happyUntil=Date.now()+4000;T.live.sys('🌌 Galaxy: OMG a '+g.name+'!! THANK YOU 💖💖');if(g.fish>=50)setTimeout(()=>T.live.sys('🌌 Galaxy did a happy spin for you! ✨'),1200)}});
// Galaxy notices when the live is in the feed: a little notification once per day.
try{const day=Math.floor(Date.now()/86400000);if(T.state.galaxyNote!==day){T.state.galaxyNote=day;T.save();setTimeout(()=>T.inbox('🌌','galaxy.asmr is LIVE','ASMR + Galaxy Treats flash sale 🎧','galaxy'),4000)}}catch(e){}
window.dispatchEvent(new CustomEvent('catcity:cattok-sales-ready'));
};
const go=()=>{if(window.CatTok?.addLive&&window.CatTokShop&&window.__catCityEngine)start();else setTimeout(go,600)};go();
})();

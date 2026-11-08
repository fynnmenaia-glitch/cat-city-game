/* Cat Tok part 10: the 🎬 Cat Tok trailer, voiced by Sofia (client/assets/voice/k01–k07.m4a).
 * k01 "Cat City… has a new app." · k02 "Scroll. Like. Follow." · k03 "Breaking news from Cat City!" ·
 * k04 "Flash sale — only three left! Buy now!" · k05 "Your parcel has arrived!" ·
 * k06 "Get sponsored. Get verified. Go LIVE." · k07 "Cat Tok. Out now… only in Cat City!"
 * It plays for everyone straight after the UPDATE! cutscene when this update is released, and any
 * time from the pinned "Official trailer" video in Cat Tok (▶ Watch with sound).
 * API: window.catCityCatTokTrailer.play()
 */
(()=>{'use strict';
const start=()=>{const T=window.CatTok,core=window.__catCityEngine;if(!T||!core||window.catCityCatTokTrailer)return;
const R=T.R,A=()=>window.catCityCatArt,CATS=['astro','galaxy','baby','harley','skylar','pumpkin'];
const LINES=[['k01',1.94,'Cat City… has a new app.'],['k02',1.88,'Scroll. Like. Follow.'],['k03',3.8,'Breaking news from Cat City!'],['k04',3.5,'Flash sale — only three left! Buy now!'],['k05',2.26,'Your parcel has arrived!'],['k06',3.5,'Get sponsored. Get verified. Go LIVE.'],['k07',4.3,'Cat Tok. Out now… only in Cat City!']];
const PAD=.7,STARTS=[];let total=0;for(const l of LINES){STARTS.push(total);total+=l[1]+PAD}total+=1.2;
const shopArt={};function art(id){if(!window.CatTokShop)return null;if(!shopArt[id]){const i=new Image();i.src=window.CatTokShop.art(id,64);shopArt[id]=i}return shopArt[id].complete?shopArt[id]:null}
const logo=(g,cx,cy,k,t)=>{const s=Math.round(22*k);R(g,cx-s,cy-s,s*2,s*2,'#000');R(g,cx-s+2,cy-s+2,s*2-4,s*2-4,'#161823');g.font='bold '+Math.round(22*k)+'px system-ui';g.textAlign='center';g.fillStyle='#25f4ee';g.fillText('♪',cx-2,cy+8*k);g.fillStyle='#fe2c55';g.fillText('♪',cx+2,cy+8*k+1);g.fillStyle='#fff';g.fillText('♪',cx,cy+8*k)};
function phone(g,x,y,w,h){R(g,x-3,y-3,w+6,h+6,'#241832');R(g,x,y,w,h,'#000');R(g,x+w/2-10,y+3,20,5,'#241832')}
// One drawing per line; k = 0..1 through that line.
const SCENES=[
 (g,W,H,t,k)=>{T.sky(g,W,H,'#1a1240','#5b4a7a');for(let i=0;i<30;i++){g.globalAlpha=.5+.5*Math.sin(t*2+i);R(g,(i*41)%W,(i*67)%(H*.6),2,2,'#fff')}g.globalAlpha=1;R(g,0,H*.72,W,H*.28,'#3a5a3a');
  for(const [x,c] of [[10,'#f5b4a5'],[W-62,'#b6d5fa']]){R(g,x,H*.72-40,52,40,c);R(g,x-4,H*.72-50,60,12,'#7a52b8');R(g,x+8,H*.72-30,10,8,'#ffd45c')}
  const py=H*.72-k*120;phone(g,W/2-30,py,60,104);logo(g,W/2,py+48,1,t);g.globalAlpha=Math.min(1,k*2)*.5;g.fillStyle='#25f4ee';g.beginPath();g.arc(W/2,py+48,36+Math.sin(t*6)*3,0,7);g.fill();g.globalAlpha=1;logo(g,W/2,py+48,1,t)},
 (g,W,H,t,k)=>{R(g,0,0,W,H,'#000');const step=Math.min(2,Math.floor(k*3));const off=(k*3%1);const id=CATS[(step*2+Math.floor(t))%6];
  T.sky(g,W,H,['#ff9ec7','#7fd6ff','#ffd45c'][step],'#ffffff');A()?.draw(g,W/2,H*.7-off*20,id,step===1?'jump':'idle',Math.floor(t*4)%2,{scale:3});
  if(step>=1){g.font='bold 54px system-ui';g.textAlign='center';g.globalAlpha=1-off;g.fillText('❤️',W/2,H*.45-off*30);g.globalAlpha=1}
  if(step>=2){R(g,W-46,H*.4,30,30,'#fe2c55');g.font='bold 20px system-ui';g.fillStyle='#fff';g.textAlign='center';g.fillText('+',W-31,H*.4+22)}
  g.font='bold 18px system-ui';g.fillStyle='#fff';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#000';const word=['Scroll.','Like.','Follow.'][step];g.strokeText(word,W/2,H*.2);g.fillText(word,W/2,H*.2)},
 (g,W,H,t,k)=>{T.sky(g,W,H,'#162447','#1f4068');R(g,10,40,W-20,H*.4,'#0d1530');for(let i=0;i<6;i++){const bh=20+((i*37)%30);R(g,14+i*27,40+H*.4-bh,22,bh,['#f5b4a5','#c9b2ed','#ffd45c'][i%3])}
  A()?.draw(g,W/2,H*.7,'pebble','idle',Math.floor(t*2)%2,{scale:2.8});R(g,0,H*.66,W,H*.34,'#2a3a6e');R(g,W/2-40,H*.7,80,22,'#c62f3a');g.font='bold 13px system-ui';g.textAlign='center';g.fillStyle='#fff';g.fillText('CC NEWS',W/2,H*.7+16);
  const by=H*.84;R(g,0,by,W,26,'#fff');R(g,0,by,74,12,'#c62f3a');g.font='bold 8px system-ui';g.fillStyle='#fff';g.textAlign='left';g.fillText('BREAKING NEWS',4,by+9);g.font='bold 10px system-ui';g.fillStyle='#161823';g.fillText('CAT TOK ARRIVES IN CAT CITY',4,by+22)},
 (g,W,H,t,k)=>{R(g,0,0,W,H*.56,'#f2a72e');for(let i=0;i<9;i++){const [c]=[['#c25a1e'],['#a0356a'],['#e0c13c']][i%3];R(g,14+i*18,40,8,22,'#241832');R(g,15+i*18,41,6,20,c)}
  A()?.draw(g,W*.3,H*.54,'marmalade','idle',Math.floor(t*2)%2,{scale:2.2});A()?.draw(g,W*.72,H*.54,'luna','idle',Math.floor(t*2)%2,{scale:2.2,flip:true});R(g,0,H*.5,W,14,'#fff6e4');
  R(g,0,H*.56,W,H*.44,'#ffd23c');const cy=H*.66+(1-Math.min(1,k*3))*80;R(g,8,cy,W-16,52,'#fff');const im=art('peachy_tea_12');if(im)g.drawImage(im,12,cy+4,44,44);
  g.font='bold 9px system-ui';g.textAlign='left';g.fillStyle='#fe2c55';g.fillText('⚡ LIVE flash sale',60,cy+16);g.fillStyle='#161823';g.font='bold 12px system-ui';g.fillText('🐟 45',60,cy+32);g.fillStyle='#8a8b91';g.font='9px system-ui';g.fillText('Only 3 left!',60,cy+45);
  const pulse=1+Math.sin(t*10)*.06;R(g,W-58,cy+14,46*pulse,22,'#fe2c55');g.fillStyle='#fff';g.font='bold 11px system-ui';g.textAlign='center';g.fillText('Buy',W-35,cy+29)},
 (g,W,H,t,k)=>{T.sky(g,W,H,'#8fd3ff','#e8f6ff');R(g,0,H*.66,W,H*.34,'#8fd16a');R(g,24,H*.66-70,132,70,'#f7cfdc');R(g,18,H*.66-84,144,18,'#d9607e');R(g,80,H*.66-30,20,30,'#8c5d36');
  const drop=Math.min(1,k*2.2),by=H*.66-20-(1-drop)*200;R(g,W/2+30,by,40,30,'#5a3a22');R(g,W/2+32,by+2,36,26,'#c8955a');R(g,W/2+48,by,4,30,'#e9e0c8');
  if(k>.5){const f=(k-.5)*2;R(g,W/2+26-f*10,by-4,22,5,'#dcae74');R(g,W/2+52+f*10,by-4,22,5,'#dcae74');const im=art('purrstation');if(im)g.drawImage(im,W/2+28,by-14-f*40,44,44)}
  A()?.draw(g,W*.3,H*.82,'astro','idle',Math.floor(t*2)%2,{scale:2.4})},
 (g,W,H,t,k)=>{T.sky(g,W,H,'#2a1d3a','#5b4a7a');const step=Math.min(2,Math.floor(k*3));A()?.draw(g,W/2,H*.68,'galaxy',step===2?'jump':'idle',Math.floor(t*4)%2,{scale:3});
  if(step>=0){R(g,10,H*.2,90,16,'#000a');g.font='bold 8px system-ui';g.fillStyle='#fff';g.textAlign='left';g.fillText('🤝 Sponsored by Biscuit · 3×',14,H*.2+11)}
  if(step>=1){g.fillStyle='#20d5ec';g.beginPath();g.arc(W/2+40,H*.42,12,0,7);g.fill();g.font='bold 14px system-ui';g.fillStyle='#fff';g.textAlign='center';g.fillText('✓',W/2+40,H*.42+5)}
  if(step>=2){R(g,W/2-26,H*.8,52,20,'#fe2c55');g.font='bold 12px system-ui';g.fillStyle='#fff';g.textAlign='center';g.fillText('LIVE',W/2,H*.8+14);for(let i=0;i<6;i++){g.font='16px system-ui';g.fillText('❤️',W-30+Math.sin(t*3+i)*8,H*.9-((t*60+i*30)%(H*.6)))}}},
 (g,W,H,t,k)=>{R(g,0,0,W,H,'#000');for(let i=0;i<6;i++)A()?.draw(g,18+i*29,H*.82+Math.abs(Math.sin(t*5+i))*-8,CATS[i],'idle',Math.floor(t*3+i)%2,{scale:1.6});
  const z=Math.min(1,k*3);logo(g,W/2,H*.36,.6+z*.9,t);g.font='bold 26px system-ui';g.textAlign='center';g.fillStyle='#25f4ee';g.fillText('Cat Tok',W/2-2,H*.58);g.fillStyle='#fe2c55';g.fillText('Cat Tok',W/2+2,H*.58+1);g.fillStyle='#fff';g.fillText('Cat Tok',W/2,H*.58);
  if(k>.45){g.font='bold 11px system-ui';g.fillStyle='#ffd45c';g.fillText('OUT NOW · only in Cat City',W/2,H*.66)}}
];
function drawAt(g,W,H,t){let i=STARTS.length-1;while(i>0&&t<STARTS[i])i--;const k=Math.min(1,(t-STARTS[i])/(LINES[i][1]+PAD));SCENES[i](g,W,H,t,k);
 const fade=t-STARTS[i];if(fade<.25){g.globalAlpha=1-fade/.25;R(g,0,0,W,H,'#000');g.globalAlpha=1}
 g.font='bold 10px system-ui';g.textAlign='center';const txt=LINES[i][2];g.lineWidth=3;g.strokeStyle='#000';g.strokeText(txt,W/2,H-14);g.fillStyle='#fff';g.fillText(txt,W/2,H-14);return i}

// ------------------------------------------------------------------ full-screen player
const css=document.createElement('style');css.textContent='#cc-cttrailer{position:fixed;inset:0;z-index:9480;background:#000;display:none;align-items:center;justify-content:center}#cc-cttrailer.open{display:flex}#cc-cttrailer .box{position:relative;height:min(100vh,177.7vw);aspect-ratio:9/16}#cc-cttrailer canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated}#cc-cttrailer canvas.ct-txt{image-rendering:auto}#cc-cttrailer button{position:absolute;right:14px;top:calc(14px + env(safe-area-inset-top));z-index:3;padding:8px 14px;border-radius:16px;border:2px solid #fff;background:#0008;color:#fff;font:800 13px system-ui}';document.head.append(css);
const P=document.createElement('div');P.id='cc-cttrailer';P.className='cc-no-pixel';P.innerHTML='<div class="box"><canvas width="180" height="320"></canvas></div><button type="button">Skip ⏭</button>';document.body.append(P);
let playing=false,raf=0;
function play(){if(playing)return;playing=true;window.CatPhone?.close?.();P.classList.add('open');window.catCityVoice?.preload?.(LINES.map(l=>l[0]));const cv=P.querySelector('canvas'),c=T.crisp(cv);const t0=performance.now();let said=-1;
 const loop=n=>{if(!playing)return;const t=(n-t0)/1000;if(t>=total){stop();return}c.begin();let i=0;try{i=drawAt(c.g,180,320,t)}catch(e){}if(i!==said&&t>=STARTS[i]){said=i;try{window.catCityVoice?.play(LINES[i][0])}catch(e){}}raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop)}
function stop(){playing=false;cancelAnimationFrame(raf);P.classList.remove('open');try{localStorage.setItem('catcity_cattok_trailer','seen')}catch(e){}}
P.querySelector('button').onclick=stop;addEventListener('keydown',e=>{if(playing&&e.key==='Escape'){e.preventDefault();stop()}},true);

// Plays for everyone right after the UPDATE! cutscene when this update is released.
window.catCityOnRelease=window.catCityOnRelease||{};window.catCityOnRelease['cattok-10-trailer']=()=>setTimeout(play,400);
// The pinned trailer in the feed (silent there; ▶ plays it with sound).
T.addItem({id:'cattok-trailer',kind:'video',pin:2,author:'cattok',avatar:'galaxy',verified:true,caption:'🎬 Cat Tok · Official trailer · out now, only in Cat City! #cattok',tags:['trailer'],sound:'Cat Tok trailer - voiced by Sofia',likes:120000,
 draw(g,W,H,t){drawAt(g,W,H,t%total)},onShow(el){if(el.querySelector('.ct-play'))return;const b=document.createElement('button');b.className='ct-play';b.type='button';b.textContent='▶ Watch with sound';b.style.cssText='position:absolute;left:50%;top:44%;transform:translateX(-50%);z-index:5;padding:10px 18px;border-radius:22px;background:#fe2c55;color:#fff;font:800 15px system-ui;box-shadow:0 4px 12px #0006';b.onclick=e=>{e.stopPropagation();play()};el.append(b)}});
window.catCityCatTokTrailer={play,stop,length:total};
};
const go=()=>{if(window.CatTok&&window.__catCityEngine)start();else setTimeout(go,600)};go();
})();

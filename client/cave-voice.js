/* Cat City: randomly placed Crystal Caves, without voice chat. */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,T=core.T,ctx=core.ctx,cats=core.cats,$=id=>document.getElementById(id);
const caveState={inside:false,id:'',x:0,y:0,anchorX:0,anchorY:0,grid:null,art:null,entrance:null};
const CW=37,CH=27,STEP=32,CHUNK=24*T;
window.catCityCaveState=()=>({inside:caveState.inside,id:caveState.id,x:caveState.x,y:caveState.y});
function hash(a,b,n=17){let z=Math.sin(a*127.1+b*311.7+n*71.7)*43758.5453;return z-Math.floor(z)}
function caveAt(cx,cy){if(cx===0&&cy===0)return null;
 const chance=(cx===1&&cy===0)||hash(cx,cy,931)>.64;
 if(!chance)return null;
 return {id:'c:'+cx+','+cy,cx,cy,x:cx*CHUNK+CHUNK*((cx===1&&cy===0)?.86:(.38+hash(cx,cy,441)*.24)),y:cy*CHUNK+CHUNK*((cx===1&&cy===0)?.75:(.38+hash(cx,cy,442)*.24))};
}
function nearbyCave(){if(caveState.inside||core.bossMode||window.catCityTagHouse?.inside)return null;
 const cx=Math.floor(s.x/CHUNK),cy=Math.floor(s.y/CHUNK);let closest=null,d=85;
 for(let yy=cy-1;yy<=cy+1;yy++)for(let xx=cx-1;xx<=cx+1;xx++){
  const c=caveAt(xx,yy);if(!c)continue;const dd=Math.hypot(s.x-c.x,s.y-c.y);if(dd<d){closest=c;d=dd;}
 }return closest;}
// Fully connected cavern: deterministic winding passages and little underground rooms.
function generate(cave){
 let seed=((cave.cx*73856093)^(cave.cy*19349663)^0xa5e3b3)>>>0;
 const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
 const grid=Array.from({length:CH},()=>Array(CW).fill(1));
 function carve(x,y,r=0){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  const xx=x+dx,yy=y+dy;if(xx>=1&&xx<CW-1&&yy>=1&&yy<CH-1)grid[yy][xx]=0;
 }}
 let x=3,y=3;carve(x,y,2);
 for(let i=0;i<2500;i++){
  const dir=Math.floor(rnd()*4);x=Math.max(2,Math.min(CW-3,x+(dir===0?1:dir===1?-1:0)));
  y=Math.max(2,Math.min(CH-3,y+(dir===2?1:dir===3?-1:0)));
  carve(x,y,i%9===0?2:1);
  if(i%220===0){carve(x,y,3);}
 }
 // Additional guaranteed passages connect across the back of the cavern.
 for(let px=3;px<CW-3;px++)carve(px,Math.floor(CH/2),1);
 for(let py=3;py<CH-3;py++)carve(Math.floor(CW/2),py,1);
 carve(3,3,2);
 return grid;
}
function floorAt(x,y){const ix=Math.floor(x/STEP),iy=Math.floor(y/STEP);return caveState.grid?.[iy]?.[ix]===0;}
function canStand(x,y){return [[0,0],[-10,-8],[10,-8],[-10,9],[10,9]].every(([dx,dy])=>floorAt(x+dx,y+dy));}
window.catCityCaveOreSpots=()=>{
 if(!caveState.inside||!caveState.grid)return [];
 const out=[];
 for(let gy=3;gy<CH-3;gy++)for(let gx=3;gx<CW-3;gx++){
  const x=(gx+.5)*STEP,y=(gy+.5)*STEP;
  if(!canStand(x,y))continue;
  if(Math.hypot(x-(Math.floor(CW/2)+.5)*STEP,y-(Math.floor(CH/2)+.5)*STEP)<100)continue;
  if(hash(gx,gy,caveState.id.length*9)>.075)continue;
  out.push([x,y]);
 }
 return out.slice(0,10);
};
function paintMap(cave){
 const off=document.createElement('canvas');off.width=CW*STEP;off.height=CH*STEP;
 const g=off.getContext('2d');if(!g)return off;
 let seed=hash(cave.cx,cave.cy,501)*100000;
 const rand=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;};
 for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){
  const wall=caveState.grid[y][x]===1,px=x*STEP,py=y*STEP;
  g.fillStyle=wall?(rand()>.5?'#4a455e':'#514965'):(rand()>.5?'#34394e':'#30384b');g.fillRect(px,py,STEP,STEP);
  if(wall){g.fillStyle='#777084';g.fillRect(px+3,py+3,STEP-7,4);g.fillStyle='#272e46';g.fillRect(px,py+25,STEP,7);}
  else if(window.catCityFloors){window.catCityFloors.fill(g,'cave',px,py,STEP,STEP);rand();rand();rand();rand();}
  else{g.fillStyle=rand()>.65?'#69768c':'#565e75';g.globalAlpha=.45;g.fillRect(px+4+rand()*17,py+7+rand()*16,3+rand()*6,2);g.globalAlpha=1;}
 }
 for(let i=0;i<120;i++){
  const x=2+Math.floor(rand()*(CW-4)),y=2+Math.floor(rand()*(CH-4));if(caveState.grid[y][x])continue;
  const px=x*STEP+16,py=y*STEP+17;
  g.font=(i%5===0?25:17)+'px system-ui';g.textAlign='center';g.fillText(i%7===0?'💎':i%3===0?'🍄':'✦',px,py);
 }
 // Pixel-art exit: a stone ring round a wooden hatch with a rope ladder and daylight (was a plain square).
 {const ex=(Math.floor(CW/2)-1)*STEP,ey=(Math.floor(CH/2)-1)*STEP,Z=STEP*3,P=4,box=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(ex+a*P,ey+b*P,w*P,h*P)},n=Z/P;
  box(0,0,n,n,'#2a2236');box(1,1,n-2,n-2,'#6d6680');box(2,2,n-4,n-4,'#8a8399');
  for(let i=0;i<n;i+=3){box(i,1,2,1,'#a49eb3');box(1,i,1,2,'#a49eb3');box(i,n-2,2,1,'#4c465c');box(n-2,i,1,2,'#4c465c')}
  box(4,4,n-8,n-8,'#3b2a20');box(5,5,n-10,n-10,'#fff1b8');box(6,6,n-12,n-12,'#ffe38a');
  for(let y=6;y<n-6;y+=3){box(9,y,n-18,1,'#9c6a3c')}box(8,5,1,n-10,'#7a5235');box(n-9,5,1,n-10,'#7a5235');
  g.font='bold 16px "Cat City Pixel",monospace';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#241832';g.fillStyle='#ffe38a';
  g.strokeText('EXIT',CW*STEP/2,ey-10);g.fillText('EXIT',CW*STEP/2,ey-10)}
 return off;
}
function enterCave(c){if(!c||core.bossMode||window.catCityTagHouse?.inside)return false;
 caveState.anchorX=s.x;caveState.anchorY=s.y;caveState.entrance=c;caveState.id=c.id;
 caveState.inside=true;caveState.grid=generate(c);caveState.art=paintMap(c);
 caveState.x=(Math.floor(CW/2)+.5)*STEP;caveState.y=(Math.floor(CH/2)+.5)*STEP;
 document.body.classList.add('catcity-in-cave');$('cc-cave-exit').hidden=false;
 core.note('🕯️ Crystal Cave! The exploration music becomes slow and eerie.');return true;
}
function exitCave(){if(!caveState.inside)return;
 s.x=caveState.anchorX;s.y=caveState.anchorY;caveState.inside=false;caveState.id='';caveState.grid=null;caveState.art=null;
 document.body.classList.remove('catcity-in-cave');$('cc-cave-exit').hidden=true;
 core.note('🌿 You returned to the surface.');}
const css=document.createElement('style');css.id='catcity-cave-voice-style';css.textContent=`
#cc-cave-exit{position:fixed;right:12px;top:65px;z-index:145;background:#d4c9fa;color:#2c2544;border:2px solid white;border-radius:13px;font-weight:900;min-height:45px;touch-action:manipulation}
#cc-cave-exit[hidden]{display:none!important}
body.catcity-in-cave #map-open,body.catcity-in-cave #wardrobe-open,body.catcity-in-cave #shop-switch,body.catcity-in-cave #cat-switch,body.catcity-in-cave #poison-attack,body.catcity-in-cave #hud,body.catcity-in-cave #start-arrived,body.catcity-in-cave #cc-enter-door,body.catcity-in-cave #quest-tracker,body.catcity-in-cave #quest-btn,body.catcity-in-cave #quest-vision,body.catcity-in-cave #cat-home-fast,body.catcity-in-cave #introReplay,body.catcity-in-cave #tycoon-open,body.catcity-in-cave #cat-compass,body.catcity-in-cave #day-cycle-label{display:none!important}
#cc-voice-button{display:none;position:fixed;right:10px;bottom:calc(216px + env(safe-area-inset-bottom,0px));z-index:85;min-height:43px;padding:7px 10px;border:2px solid #fff;border-radius:14px;background:#e2d6fb;color:#3d2850;box-shadow:0 4px 12px #160e3980;font-size:13px;font-weight:800;touch-action:manipulation}
#cc-voice-button.show{display:block}body.boss-fighting #cc-voice-button,body.start-menu-open #cc-voice-button,body:has(.cc-social-modal.open) #cc-voice-button,body:has(#pause-panel.show) #cc-voice-button,body:has(#catcity-online-panel.open) #cc-voice-button{display:none!important}
#cc-voice-panel{display:none;position:fixed;inset:0;z-index:4900;background:#211632d9;align-items:center;justify-content:center;padding:14px;touch-action:pan-y!important}
#cc-voice-panel.open{display:flex}#cc-voice-card{width:min(430px,96vw);max-height:87dvh;overflow:auto;background:#fff9ed;border:3px solid #bda3d5;border-radius:20px;padding:18px;box-shadow:0 12px 40px #160b30aa;color:#3d294b;touch-action:pan-y!important}
#cc-voice-card button{padding:11px 13px;min-height:44px;margin:4px;border-radius:12px;border:2px solid #e0d1ed;background:#d7f1df;color:#312641;touch-action:manipulation}
#cc-voice-card h2{margin:0 0 12px}#cc-voice-card p{font-size:13px;line-height:1.5}#cc-voice-users{display:flex;flex-direction:column;gap:6px;margin:8px 0}#cc-voice-users label{display:flex;gap:8px;align-items:center;padding:7px;border-radius:10px;background:#f2e4f4;font-size:14px}#cc-voice-users input{touch-action:manipulation}
@media(max-width:600px){#cc-voice-button{right:12px;bottom:calc(218px + env(safe-area-inset-bottom,0px))}body.taghouse-inside #cc-voice-button{right:10px;top:192px;bottom:auto;z-index:755}}
`;document.head.append(css);
const caveExit=document.createElement('button');caveExit.id='cc-cave-exit';caveExit.type='button';caveExit.textContent='↩ Leave Cave';caveExit.hidden=true;caveExit.onclick=exitCave;document.body.append(caveExit);
const oldInteract=core.interact;
core.interact=function(){
 if(caveState.inside){if(Math.hypot(caveState.x-(Math.floor(CW/2)+.5)*STEP,caveState.y-(Math.floor(CH/2)+.5)*STEP)<72)exitCave();else core.note('🕯️ Follow the glowing passage back to the EXIT.');return;}
 const cave=nearbyCave();if(cave){enterCave(cave);return;}
 return oldInteract();
};
if($('interact'))$('interact').onclick=()=>core.interact();
function moveCave(){
 if(!caveState.inside)return;
 const dx=Math.max(-25,Math.min(25,s.x-caveState.anchorX));
 const dy=Math.max(-25,Math.min(25,s.y-caveState.anchorY));
 s.x=caveState.anchorX;s.y=caveState.anchorY;
 const nx=Math.max(14,Math.min((CW-1)*STEP-14,caveState.x+dx));
 const ny=Math.max(14,Math.min((CH-1)*STEP-14,caveState.y+dy));
 if(canStand(nx,caveState.y))caveState.x=nx;
 if(canStand(caveState.x,ny))caveState.y=ny;
}
function paintCave(){
 if(!caveState.inside)return;
 const W=core.W,H=core.H,camX=Math.max(0,Math.min(CW*STEP-W,caveState.x-W/2)),camY=Math.max(0,Math.min(CH*STEP-H,caveState.y-H/2));
 ctx.fillStyle='#161e31';ctx.fillRect(0,0,W,H);
 ctx.drawImage(caveState.art,-camX,-camY);
 for(const p of window.catCityOnlinePlayers?.()||[]){
  if(!p.online||p.caveId!==caveState.id||p.id===window.catCityOnlineMe?.()||p.cat===s.cat)continue;
  const cat=cats[p.cat];if(!cat)continue;
  core.drawCat(p.caveX-camX,p.caveY-camY,{...cat},1.05,false);
  ctx.save();ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#f5dfff';ctx.fillText('🌐 '+cat.name,p.caveX-camX,p.caveY-camY-28);ctx.restore();
 }
 core.drawCat(caveState.x-camX,caveState.y-camY,cats[s.cat],1.08,false);
 // Vignette: gentle atmospheric darkness around the player, without obstructing the controls.
 ctx.save();const grad=ctx.createRadialGradient(caveState.x-camX,caveState.y-camY,90,caveState.x-camX,caveState.y-camY,Math.max(W,H)*.62);
 grad.addColorStop(0,'#06112500');grad.addColorStop(.65,'#080c1d5c');grad.addColorStop(1,'#070b1fd9');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);ctx.restore();
 ctx.fillStyle='#e9deff';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText('🕯️ CRYSTAL CAVE · '+caveState.id.slice(2),W/2,60);
}
function paintEntrances(){
 if(core.bossMode||window.catCityTagHouse?.inside||$('catcity-start-menu')?.classList.contains('show'))return;
 const W=core.W,H=core.H,cx=Math.floor(s.x/CHUNK),cy=Math.floor(s.y/CHUNK);ctx.save();
 for(let yy=cy-1;yy<=cy+1;yy++)for(let xx=cx-1;xx<=cx+1;xx++){
  const cave=caveAt(xx,yy);if(!cave)continue;
  const x=cave.x-s.x+W/2,y=cave.y-s.y+H/2;
  if(x<-70||x>W+70||y<-70||y>H+70)continue;
  ctx.fillStyle='#38334a';ctx.beginPath();ctx.ellipse(x,y,47,34,0,Math.PI,2*Math.PI);ctx.fill();
  ctx.fillStyle='#131b32';ctx.beginPath();ctx.ellipse(x,y+5,28,24,0,Math.PI,Math.PI*2);ctx.fill();
  ctx.font='31px system-ui';ctx.textAlign='center';ctx.fillText('💎',x,y-31);
  ctx.font='bold 11px system-ui';ctx.fillStyle='#fff3c9';ctx.fillText('CRYSTAL CAVE',x,y+36);
  if(Math.hypot(s.x-cave.x,s.y-cave.y)<85){ctx.fillStyle='#f6e6fa';ctx.font='bold 15px system-ui';ctx.fillText('🐾 / E to enter',x,y+57);}
 }
 ctx.restore();
}
const oldDraw=core.draw;
core.draw=function(){if(caveState.inside){moveCave();oldDraw();paintCave();}else{oldDraw();paintEntrances();}};
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&caveState.inside&&!document.querySelector('.cc-panel.show,.cc-social-modal.open,#settings-panel.open'))exitCave();});

// Proximity voice and microphone capture removed; the caves still work.
})();

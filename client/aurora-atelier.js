/* CAT CITY — AURORA ATELIER
 * An original, lightweight eight-sprite art pack.
 * Art atlas: /art/aurora-atlas.svg (same-origin vector artwork).
 * Does not alter hitboxes, drops, quests, saves, or online player positions.
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const T=core.T, CH=24*T;
const atlas=new Image();
atlas.decoding='async';
let ready=false;
atlas.onload=()=>{ready=true;try{buildPixel()}catch(e){pix=null}};
atlas.onerror=()=>{ready=false};
atlas.src='/art/aurora-atlas.svg';
const selected=()=>window.catCityGraphicsPack?.()==='aurora';
const hash=(a,b,k=0)=>{const n=Math.sin(a*127.1+b*311.7+k*53.17)*43758.5453;return n-Math.floor(n)};
const biome=(cx,cy)=>{if(cx===0&&cy===0)return 'town';if(cx<0&&cy>=-1&&cy<=1)return 'wild';const v=hash(cx,cy);return v<.17?'cherry':v>.82?'poison':v<.32?'marsh':v>.66?'moonstone':'wild'};
const art=[
 {name:'Starlit pine',id:'pine',index:0},
 {name:'Cotton-candy cherry tree',id:'cherry',index:1},
 {name:'Amethyst crystals',id:'crystal',index:2},
 {name:'Twilight mushrooms',id:'mushroom',index:3},
 {name:'Moon lantern',id:'lantern',index:4},
 {name:'Lily pool',id:'lily',index:5},
 {name:'Enchanted flowering hedge',id:'hedge',index:6},
 {name:'Cat City crest',id:'crest',index:7}
];
// Pixel art style (the default): the vector atlas is redrawn once at low resolution
// with hard edges and a dark outline, then scaled up without smoothing, so Aurora's
// trees, hedges and lanterns match the rest of Cat City's pixel art.
const CELL=34;let pix=null;
const pixelMode=()=>window.catCityArtStyle?.()!=='classic';
function buildPixel(){
 const cv=document.createElement('canvas');cv.width=4*CELL;cv.height=2*CELL;const g=cv.getContext('2d',{willReadFrequently:true});
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(atlas,0,0,512,256,0,0,cv.width,cv.height);
 const img=g.getImageData(0,0,cv.width,cv.height),d=img.data,W=cv.width,H=cv.height,solid=new Uint8Array(W*H);
 for(let i=0;i<W*H;i++){const a=d[i*4+3];if(a>=120){solid[i]=1;d[i*4+3]=255;
   // a few colour steps per channel keeps the pixel look flat, like the hand-made sprites
   for(let k=0;k<3;k++)d[i*4+k]=Math.min(255,Math.round(d[i*4+k]/24)*24)}else d[i*4+3]=0}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(solid[i])continue;const cellEdge=(x%CELL===0)||(y%CELL===0);if(cellEdge)continue;
  if((x>0&&solid[i-1])||(x<W-1&&solid[i+1])||(y>0&&solid[i-W])||(y<H-1&&solid[i+W])){d[i*4]=42;d[i*4+1]=29;d[i*4+2]=51;d[i*4+3]=235}}
 g.putImageData(img,0,0);pix=cv;
}
function sprite(ct,index,x,y,w=110,h=110){
 if(!ready)return;
 if(pix&&pixelMode()){const sx=(index%4)*CELL,sy=Math.floor(index/4)*CELL,k=Math.max(1,Math.round(w/CELL)),pw=CELL*k,ph=CELL*k;
  const was=ct.imageSmoothingEnabled;ct.imageSmoothingEnabled=false;ct.drawImage(pix,sx,sy,CELL,CELL,Math.round(x-pw/2),Math.round(y-ph*.88),pw,ph);ct.imageSmoothingEnabled=was;return}
 const sx=(index%4)*128,sy=Math.floor(index/4)*128;
 ct.drawImage(atlas,sx,sy,128,128,Math.round(x-w/2),Math.round(y-h*.88),w,h);
}
function sparkle(ct,x,y,t,seed=0){
 const pulse=.45+.55*Math.sin(t*.042+seed*5);
 if(pixelMode()){const s=pulse>.7?3:2,X=Math.round(x),Y=Math.round(y);ct.globalAlpha=.45+pulse*.5;ct.fillStyle=seed%3===0?'#fff2b5':seed%3===1?'#defcff':'#f8d5ff';
  ct.fillRect(X-s/2,Y-s*2.5,s,s*5);ct.fillRect(X-s*2.5,Y-s/2,s*5,s);ct.globalAlpha=1;return}
 const radius=2.2+pulse*2.4;
 ct.globalAlpha=.38+pulse*.48;
 ct.fillStyle=seed%3===0?'#fff2b5':seed%3===1?'#defcff':'#f8d5ff';
 ct.beginPath();ct.moveTo(x,y-radius*2.2);ct.lineTo(x+radius*.6,y-radius*.5);
 ct.lineTo(x+radius*2.1,y);ct.lineTo(x+radius*.6,y+radius*.5);
 ct.lineTo(x,y+radius*2.2);ct.lineTo(x-radius*.6,y+radius*.5);
 ct.lineTo(x-radius*2.1,y);ct.lineTo(x-radius*.6,y-radius*.5);ct.closePath();ct.fill();
 ct.globalAlpha=1;
}
function decorateWorld(ct,st,tile,W,H,tick){
 if(!selected()||!ready||core.bossMode||window.catCityMuseum?.inside||
    window.catCityTagHouse?.inside||document.body.classList.contains('catcity-in-cave'))return;
 const camX=st.x-W/2,camY=st.y-H/2;
 const minX=camX-135,maxX=camX+W+135,minY=camY-145,maxY=camY+H+145;
 const x0=Math.floor(minX/CH),x1=Math.floor(maxX/CH);
 const y0=Math.floor(minY/CH),y1=Math.floor(maxY/CH);
 ct.save();ct.imageSmoothingEnabled=true;
 // Sparse hand-made silhouettes add identity without covering gathering nodes.
 for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
  const zone=biome(cx,cy);
  if(zone==='town')continue;
  const originX=cx*CH,originY=cy*CH;
  const type=zone==='cherry'?1:zone==='moonstone'?2:zone==='poison'?3:zone==='marsh'?5:0;
  const quantity=zone==='cherry'||zone==='wild'?6:5;
  for(let i=0;i<quantity;i++){
   const x=originX+(2.5+hash(cx*23+i,cy*11,4)*19)*tile;
   const y=originY+(3+hash(cx*17+i,cy*29,8)*17)*tile;
   if(x<minX||x>maxX||y<minY||y>maxY)continue;
   const size=(zone==='wild'||zone==='cherry'?86:zone==='moonstone'?82:zone==='marsh'?81:89)*(0.80+hash(i,cy,11)*.37);
   sprite(ct,type,x,y,size,size);
   if(i===1||i===4){
    const fx=x+20+hash(i,cx,77)*26,fy=y-38;
    sparkle(ct,fx,fy,tick,i+Math.abs(cx*9+cy));
   }
   if(i===3&&zone==='wild')sprite(ct,6,x+62,y+25,58,58);
  }
 }
 // A landscaped village: lanterns and garden beds remain away from doors,
 // and the crest sits near the arena entrance instead of blocking the Quest Board.
 const village=[
  [14.2,15.2,4,77],[20.5,15.2,4,77],[29.1,15.2,4,77],
  [14.1,20.8,4,77],[20.5,20.8,4,77],[29.1,20.8,4,77],
  [9.4,16.1,6,63],[23.1,19.8,6,61],[36.4,19.7,6,68],
  [12.1,26.7,5,82],[39.1,26.9,5,82],[22.0,12.5,6,66],
  [27.0,14.3,7,102],[2.9,21.7,1,90],[45.1,22.9,1,90],
  [11.2,10.9,6,58],[30.2,10.7,6,58]
 ];
 for(const [tx,ty,index,size] of village){
  const x=tx*tile,y=ty*tile;
  if(x<minX||x>maxX||y<minY||y>maxY)continue;
  sprite(ct,index,x,y,size,size);
  if(index===4||index===7)sparkle(ct,x+20,y-size*.56,tick,index+tx);
 }
 // Fixed decorative fireflies are not collectible loot.
 for(let i=0;i<24;i++){
  const x=hash(i,91)*48*tile,y=hash(i,17)*35*tile;
  if(x<minX||x>maxX||y<minY||y>maxY)continue;
  sparkle(ct,x,y+Math.sin(tick*.027+i)*4,tick,i);
 }
 ct.restore();
}
const formerOverhaul=window.catCityDrawOverhaul;
if(typeof formerOverhaul==='function'){
 window.catCityDrawOverhaul=(...args)=>{formerOverhaul(...args);decorateWorld(...args)};
}
const formerBoss=core.drawBoss;
core.drawBoss=function(){
 formerBoss();
 if(!selected()||core.bossChapter!==19)return;
 const ct=core.ctx,W=core.W,H=core.H,seconds=performance.now()/1000;
 ct.save();
 // Showtime wings and starbeats surround the existing player controls and HUD.
 const beat=(seconds*128/60)%1,glow=.10+.14*(1-beat);
 const l=ct.createLinearGradient(0,0,W,0);
 l.addColorStop(0,'rgba(115,77,179,'+glow+')');l.addColorStop(.19,'rgba(115,77,179,0)');
 l.addColorStop(.81,'rgba(115,77,179,0)');l.addColorStop(1,'rgba(255,194,222,'+glow+')');
 ct.fillStyle=l;ct.fillRect(0,0,W,H);
 ct.textAlign='center';
 for(let side=0;side<2;side++)for(let n=0;n<4;n++){
  const x=side===0?18+n*25:W-18-n*25;
  const y=178+n*31+Math.sin(seconds*1.4+n)*5;
  sparkle(ct,x,y,Math.floor(seconds*60),n+side);
 }
 if(W>=430){
  ct.fillStyle='#fef5dc';ct.font='bold 13px system-ui';
  ct.fillText('✦ AURORA ATELIER · FINAL ACT ✦',W/2,H-28);
 }
 ct.restore();
};
const css=document.createElement('style');css.id='cc-aurora-atelier-style';
css.textContent=[
 'body.cc-aurora-atelier #hud{border-color:#ffe5b7!important;background:linear-gradient(130deg,#37224bdc,#395c72d9)!important;box-shadow:0 5px 20px #24164380!important}',
 'body.cc-aurora-atelier #quest-tracker{border-color:#e9d4ff!important;background:linear-gradient(130deg,#50386bdd,#417e8cdc)!important}',
 'body.cc-aurora-atelier #cc-objective{border-color:#f9e3ba!important;background:#3a315bdc!important}',
 'body.cc-aurora-atelier #catcity-start-menu .title-card{box-shadow:0 0 0 3px #f8d8fb38,0 18px 70px #724c9a66!important}',
 'body.cc-aurora-atelier #boss-hud{background:linear-gradient(135deg,#48285ef2,#2f5e79f2)!important;border-color:#ffe7b3!important}'
].join('\n');
document.head.append(css);
function updateTheme(){document.body.classList.toggle('cc-aurora-atelier',selected())}
updateTheme();
const themeSelect=document.getElementById('setting-world-pack');
themeSelect?.addEventListener('change',updateTheme);
window.catCityAuroraArt={name:'Aurora Atelier',version:1,author:'Original Cat City artwork',sprites:art,atlas:'/art/aurora-atlas.svg',isActive:selected,drawSprite:sprite};
})();
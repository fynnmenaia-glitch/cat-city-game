/* Cat City Storybook Pixel Gardens — original procedural art inspired by user-provided moodboard.
   Only scenery is replaced; original Astro, Galaxy and Baby game sprites remain untouched. */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const S=()=>window.catCityGraphicsPack?.()==='storybook';
const tile=core.T,C=core.ctx;
function hash(a,b=0,k=0){const x=Math.sin(a*127.1+b*311.7+k*57.3)*43758.5453;return x-Math.floor(x);}
const spriteCache={};
// Pixel art style (default): each painted sprite is shrunk to chunky pixels with a dark
// outline and drawn at whole-number scales, so Storybook matches the pixel cats.
const pixCache={};
function pixSprite(type,variant=0){const key=type+variant;if(pixCache[key])return pixCache[key];const src=makeSprite(type,variant),W=38,H=39;
 const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(src,0,0,W,H);
 const img=g.getImageData(0,0,W,H),d=img.data,solid=new Uint8Array(W*H);
 for(let i=0;i<W*H;i++){if(d[i*4+3]>=120){solid[i]=1;d[i*4+3]=255}else d[i*4+3]=0}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(solid[i])continue;if((x>0&&solid[i-1])||(x<W-1&&solid[i+1])||(y>0&&solid[i-W])||(y<H-1&&solid[i+W])){d[i*4]=42;d[i*4+1]=29;d[i*4+2]=51;d[i*4+3]=235}}
 g.putImageData(img,0,0);return pixCache[key]=cv}
function drawSprite(ct,type,variant,x,y,sz,anchor){
 if(window.catCityArtStyle?.()==='classic'){ct.drawImage(makeSprite(type,variant),x-sz/2,y-sz*anchor,sz,sz);return}
 const k=Math.max(1,Math.round(sz/38)),w=38*k,h=39*k;ct.drawImage(pixSprite(type,variant),Math.round(x-w/2),Math.round(y-h*anchor),w,h)}
function makeSprite(type,variant=0){const key=type+variant;if(spriteCache[key])return spriteCache[key];
 const cv=document.createElement('canvas');cv.width=112;cv.height=116;
 const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 function blob(x,y,r,pal){
  rect(x-r+5,y-r+4,2*r-8,2*r-6,pal[0]);
  rect(x-r+2,y-r+10,2*r-2,2*r-17,pal[0]);
  rect(x-r+9,y-r,2*r-16,2*r-1,pal[0]);
  rect(x-r+10,y-r+5,r,7,pal[1]);rect(x-r+5,y-r+12,10,7,pal[2]);
  rect(x+1,y+3,12,6,pal[3]);
 }
 if(type==='pine'){
  rect(51,73,12,39,'#80634d');
  const pal=variant%3===0?['#3a6654','#80b48d','#639977','#244f43']:['#486e5a','#94bc84','#709e76','#345744'];
  for(let j=3;j>=0;j--){let y=10+j*17,half=15+(3-j)*8;rect(56-half,y+19,2*half,8,pal[0]);rect(56-half+8,y+8,2*(half-8),19,pal[0]);rect(56-half+14,y,2*(half-14),16,pal[0]);rect(56-half+16,y+4,9,11,pal[1]);rect(56+half-27,y+13,8,5,pal[2]);}
 }else if(type==='cherry'||type==='gold'){
  rect(51,72,10,37,'#775b67');rect(43,67,8,15,'#775b67');rect(62,72,9,15,'#775b67');
  const pal=type==='cherry'?['#ae759f','#f9c4df','#e89fc6','#ffdcea']:['#b0a15c','#f8e79f','#dac66c','#fff7bf'];
  for(const [x,y,r] of [[38,53,23],[75,53,22],[55,28,29],[57,62,31]])blob(x,y,r,pal);
  for(let i=0;i<8;i++)rect(26+hash(i,0)*58,26+hash(i,1)*37,4,4,pal[3]);
 }else if(type==='bush'){
  const pal=variant%3===0?['#4f8b72','#a7d68b','#78bb91','#356b5c']:['#5d936c','#bbda91','#85b97a','#3d785b'];
  for(const [x,y,r] of [[34,78,18],[54,65,26],[79,80,20]])blob(x,y,r,pal);
 }else if(type==='pot'){
  rect(40,80,33,8,'#765266');rect(44,88,25,17,'#a77684');rect(46,105,21,4,'#654653');
  rect(55,42,3,39,'#488963');rect(48,50,3,23,'#4d9561');rect(65,60,3,23,'#4d9561');
  for(const [x,y,k] of [[55,37,variant%3],[47,51,1],[65,58,2]]){
    const cols=[['#f49cc9','#fff0be'],['#b0b9fb','#f7e1ff'],['#ffd17e','#fff6b8']][k];
    rect(x-7,y-3,14,8,cols[0]);rect(x-3,y-7,7,15,cols[0]);rect(x-2,y-2,4,5,cols[1]);
  }
 }
 spriteCache[key]=cv;return cv;
}
function drawHouse(ct,x,y,w,h,roof,wall,kind){
 ct.save();ct.imageSmoothingEnabled=false;
 ct.fillStyle='#49395055';ct.fillRect(x+12,y+22,w+8,h+14);
 ct.fillStyle='#5e4763';ct.fillRect(x-3,y+37,w+6,h-29);
 ct.fillStyle=wall;ct.fillRect(x+2,y+38,w-4,h-37);
 for(let i=0;i<Math.floor(w/19);i++){ct.fillStyle=i%2?'#d7bac0':'#e9cdd2';ct.fillRect(x+6+i*19,y+55,2,h-58);}
 ct.fillStyle='#5c4563';ct.beginPath();ct.moveTo(x-14,y+45);ct.lineTo(x+w*.2,y-4);ct.lineTo(x+w*.78,y-4);ct.lineTo(x+w+14,y+45);ct.closePath();ct.fill();
 ct.fillStyle=roof;ct.beginPath();ct.moveTo(x-9,y+39);ct.lineTo(x+w*.22,y+1);ct.lineTo(x+w*.8,y+1);ct.lineTo(x+w+9,y+39);ct.closePath();ct.fill();
 for(let i=0;i<Math.floor(w/17);i++)for(let j=0;j<3;j++){
  let px=x+10+i*17+((j%2)*7),py=y+7+j*10;ct.fillStyle=(i+j)%2?'#ffffff27':'#26113717';ct.fillRect(px,py,12,3);
 }
 for(let i=0;i<2;i++){
  const wx=x+15+i*(w-52);ct.fillStyle='#695b73';ct.fillRect(wx,y+60,40,38);
  ct.fillStyle='#ffe8ae';ct.fillRect(wx+4,y+64,32,30);ct.fillStyle='#9abac0';ct.fillRect(wx+18,y+64,4,30);ct.fillRect(wx+4,y+77,32,4);
  ct.fillStyle='#f4dfd4';ct.fillRect(wx-4,y+96,48,6);
 }
 const doorX=x+w/2-18;ct.fillStyle='#5a455d';ct.fillRect(doorX-4,y+h-67,44,66);
 ct.fillStyle='#896e85';ct.fillRect(doorX+2,y+h-61,32,61);
 ct.fillStyle='#ffe3a5';ct.fillRect(doorX+27,y+h-35,4,4);
 ct.fillStyle='#f4e1c9';ct.fillRect(x+w/2-30,y+h,60,12);
 drawSprite(ct,'pot',0,x+35,y+h-38+52*.73,50,.73);drawSprite(ct,'pot',1,x+w-40,y+h-38+52*.73,50,.73);
 ct.font='bold 14px system-ui';ct.textAlign='center';ct.fillStyle='#402e4c';ct.fillText(kind,x+w/2,y+56);
 ct.restore();
}
function drawStorybook(ct,st,T,W,H){
 const camX=st.x-W/2,camY=st.y-H/2; const loX=camX-140,hiX=camX+W+140,loY=camY-150,hiY=camY+H+130;
 ct.save();ct.imageSmoothingEnabled=false;
 const townW=48*T,townH=35*T;
 const inTown=(st.x>=0&&st.x<townW&&st.y>=0&&st.y<townH);
 // Soft leaf shadows, tiny blossoms, stone paths and coloured pixel shrubs.
 if(inTown){
  for(let k=0;k<125;k++){
   const x=hash(k,7)*townW,y=hash(k,15)*townH;
   if(x<loX||x>hiX||y<loY||y>hiY)continue;
   if((y>14*T&&y<20*T)||(x>16*T&&x<19*T)||(x>31*T&&x<34*T))continue;
   const type=k%9===0?'pot':k%5===0?'bush':k%4===0?'cherry':k%3===0?'gold':'pine';
   const sz=type==='pot'?35:type==='bush'?58:100;
   drawSprite(ct,type,k%3,x,y,sz,.73);
  }
  const houses=[[5,5,8,6,'#896596','#f4d9cd','SHOP'],[19,5,9,6,'#6d789d','#e5d6ed','LIBRARY'],[34,5,8,6,'#8f729c','#e9d2c3','LUNA'],[6,22,9,6,'#9d6579','#f2e0ca','GUILD'],[22,22,9,6,'#797198','#d5d9e9','HOME']];
  for(const [tx,ty,tw,th,r,w,label] of houses){
   const x=tx*T,y=ty*T,width=tw*T,height=th*T;
   if(x+width<loX||x>hiX||y+height<loY||y>hiY)continue;
   drawHouse(ct,x,y,width,height,r,w,label);
  }
 }else{
  const CH=24*T,cx0=Math.floor(loX/CH),cx1=Math.ceil(hiX/CH),cy0=Math.floor(loY/CH),cy1=Math.ceil(hiY/CH);
  for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){
   const ox=cx*CH,oy=cy*CH,v=hash(cx,cy);
   const type=v<.17?'cherry':v>.82?'bush':v<.32?'gold':'pine';
   for(let i=0;i<26;i++){
    const x=ox+hash(cx*13+i,cy*7)*CH,y=oy+hash(cy*11+i,cx*3)*CH;
    if(x<loX||x>hiX||y<loY||y>hiY)continue;
    if(Math.abs(x-ox-CH*.52)<120&&Math.abs(y-oy-CH*.49)<115&&v>.82)continue;
    const sz=(i%7===0?60:90)+hash(i,cx)*23;
    drawSprite(ct,type,i%3,x,y,sz,.77);
   }
  }
 }
 // Ground-cover petals and pebbles, sparse and deliberately subtle.
 for(let i=0;i<50;i++){
  const wx=Math.floor(camX/400)*400+hash(i,1)*Math.ceil(W/400+2)*400;
  const wy=Math.floor(camY/400)*400+hash(i,2)*Math.ceil(H/400+2)*400;
  if(wx<loX||wx>hiX||wy<loY||wy>hiY)continue;
  const dot=i%3===0?'#f5b5d2':i%2===0?'#fff0ba':'#a3caa3';ct.fillStyle=dot;
  ct.fillRect(Math.round(wx),Math.round(wy),4,4);ct.fillRect(Math.round(wx)+6,Math.round(wy)+2,2,2);
 }
 ct.restore();
}
const old=window.catCityDrawOverhaul;
if(typeof old==='function')window.catCityDrawOverhaul=(...args)=>{old(...args);if(S())drawStorybook(...args);};
// The new pack also restyles the separate Tag House to match the moodboard.
window.catCityStorybookIsActive=S;
})();

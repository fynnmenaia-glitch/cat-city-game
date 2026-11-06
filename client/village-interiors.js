/* Cat City — walk-around village interiors + visible player homes.
 *
 * 1. The three homes you can buy (Rose Cottage, Lavender Lodge, Golden Villa)
 *    are drawn in the village in pixel-art style, on top of the graphics-pack
 *    scenery that used to hide them. Owned homes have lit windows; others show
 *    a For Sale sign.
 * 2. Walking into a village building or an owned home opens a real room you
 *    walk around (replacing the old pop-up panel): furniture you bump into,
 *    things to use with E / 🐾, the NPC who lives there, and a door to leave.
 *
 * Rooms: Marmalade's Shop, Moonbeam Library, Luna's Cottage, Adventure Guild,
 * Cosy Cat House (with the fish-team computer) and the three owned homes.
 * Uses the new pixel-art cats (cat-pixel-art.js). Does not move the saved
 * world position: you come back out where you went in.
 */
(()=>{'use strict';
const core=window.__catCityEngine,art=window.catCityCatArt;
if(!core||!art)return;
const s=core.state,T=core.T,$=id=>document.getElementById(id);
const LW=320,LH=208,FLOOR_TOP=64;
const CAT_IDS=['astro','galaxy','baby','harley','skylar','pumpkin'];

// ------------------------------------------------------------------ DOM
const css=document.createElement('style');css.id='cc-interior-style';
css.textContent=[
 '#cc-interior{display:none;position:fixed;inset:0;z-index:7000;background:#1b1428;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:8px;touch-action:none}',
 '#cc-interior.open{display:flex}',
 '#cc-interior h2{margin:0;font:900 18px system-ui;color:#fff0c4;text-shadow:0 2px 0 #3b2752}',
 '#cc-interior-canvas{width:min(96vw,calc(66dvh*320/208),960px);aspect-ratio:320/208;image-rendering:pixelated;border:4px solid #e8d3ff;border-radius:14px;background:#000;touch-action:none}',
 '#cc-interior-hint{min-height:20px;font:bold 13px system-ui;color:#fff3d6;text-align:center;max-width:94vw}',
 '#cc-interior-controls{display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;touch-action:manipulation}',
 '#cc-interior-controls button{min-width:50px;min-height:46px;margin:0;border:2px solid #fff6e4;border-radius:12px;background:#dcc5f7;color:#33224a;font:bold 14px system-ui;touch-action:none}',
 '#cc-interior-controls #cc-int-act{background:#ffe3a6;min-width:120px}',
 '#cc-interior-controls #cc-int-leave{background:#f6c6d2}',
 'body.cc-in-interior-room #mobile,body.cc-in-interior-room #interact,body.cc-in-interior-room #sprint,body.cc-in-interior-room #cc-enter-door{display:none!important}',
 '@media(pointer:fine){#cc-interior-controls .pad{display:none}}'
].join('\n');document.head.append(css);
const root=document.createElement('div');root.id='cc-interior';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
root.innerHTML='<h2 id="cc-interior-title"></h2><canvas id="cc-interior-canvas" width="320" height="208"></canvas><div id="cc-interior-hint"></div><div id="cc-interior-controls"></div>';
document.body.append(root);
const cv=$('cc-interior-canvas'),g=cv.getContext('2d');g.imageSmoothingEnabled=false;
const controls=$('cc-interior-controls'),hintEl=$('cc-interior-hint');
const pressed=new Set();
for(const [sym,dir] of [['⬅','left'],['⬆','up'],['⬇','down'],['➡','right']]){
 const b=document.createElement('button');b.type='button';b.className='pad';b.textContent=sym;b.setAttribute('aria-label','Walk '+dir);
 b.addEventListener('pointerdown',e=>{e.preventDefault();pressed.add(dir);b.setPointerCapture?.(e.pointerId)});
 for(const t of ['pointerup','pointercancel','lostpointercapture','pointerleave'])b.addEventListener(t,()=>pressed.delete(dir));
 controls.append(b);
}
const actBtn=document.createElement('button');actBtn.id='cc-int-act';actBtn.type='button';actBtn.textContent='🐾 Use';actBtn.onclick=()=>use();controls.append(actBtn);
const leaveBtn=document.createElement('button');leaveBtn.id='cc-int-leave';leaveBtn.type='button';leaveBtn.textContent='🚪 Leave';leaveBtn.onclick=()=>leave();controls.append(leaveBtn);
// Drag on the room to walk (phones): direction from where the finger went down.
let drag=null;
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,id:e.pointerId};cv.setPointerCapture?.(e.pointerId)});
cv.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;pressed.delete('left');pressed.delete('right');pressed.delete('up');pressed.delete('down');if(Math.hypot(dx,dy)<10)return;if(dx<-8)pressed.add('left');if(dx>8)pressed.add('right');if(dy<-8)pressed.add('up');if(dy>8)pressed.add('down')});
for(const t of ['pointerup','pointercancel'])cv.addEventListener(t,e=>{if(drag&&e.pointerId===drag.id){const moved=pressed.size>0;drag=null;['left','right','up','down'].forEach(d=>pressed.delete(d));if(!moved)use()}});

// ------------------------------------------------------------------ pixel helpers
const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
const OUT='#2a1d33';
function box(x,y,w,h,base,top,shade){R(x-1,y-1,w+2,h+2,OUT);R(x,y,w,h,base);if(top)R(x,y,w,2,top);if(shade)R(x,y+h-2,w,2,shade)}
function hashI(i){const v=Math.sin(i*91.7+13.1)*43758.5;return v-Math.floor(v)}
const SPR={
 window(x,y,night){box(x,y,32,24,'#7d5a42','#9a7354','#5f4332');R(x+3,y+3,26,18,night?'#2b3a6b':'#a9dcf5');R(x+3,y+3,26,5,night?'#3b4c86':'#cdeefc');R(x+15,y+3,2,18,'#7d5a42');R(x+3,y+11,26,2,'#7d5a42');R(x-3,y-2,6,27,'#e47c9a');R(x+29,y-2,6,27,'#e47c9a');R(x-3,y-3,38,2,'#6b4b37')},
 moonWindow(x,y){box(x,y,32,24,'#5b4377','#7a5d9a','#43315a');R(x+3,y+3,26,18,'#1f2552');R(x+19,y+6,6,6,'#fff3b0');R(x+21,y+6,4,4,'#1f2552');for(const [a,b] of [[7,7],[12,15],[25,16],[9,12]])R(x+a,y+b,1,1,'#ffffff')},
 painting(x,y,c){box(x,y,22,16,'#c9963a','#e8bb5c','#9c7027');R(x+2,y+2,18,12,c||'#8fd1b0');R(x+2,y+9,18,5,'#5fa06e');R(x+13,y+4,4,4,'#fff0a0')},
 shelfGoods(x,y){box(x,y,48,40,'#9b6b44','#b98557','#7a5233');for(const r of [8,22,36])R(x,y+r,48,2,'#6e4a2e');const goods=['#f0953c','#7ec8e3','#f6dc4a','#e47c9a','#a5d59d','#c9a6ef'];for(let i=0;i<12;i++){const c=goods[i%6];R(x+3+(i%6)*7.5,y+(i<6?1:15),5,7,c);R(x+3+(i%6)*7.5,y+(i<6?1:15),5,2,'#ffffff55')}R(x+6,y+26,10,10,'#e8e0d2');R(x+8,y+28,6,6,'#7ec8e3');R(x+22,y+27,8,9,'#c9a6ef');R(x+34,y+26,10,10,'#f6dc4a')},
 counter(x,y,w){box(x,y,w,22,'#b5804f','#d39c66','#8c5d36');for(let i=8;i<w;i+=16)R(x+i,y+6,1,14,'#8c5d36');R(x,y+4,w,1,'#8c5d36')},
 register(x,y){box(x,y,16,10,'#6b7d96','#8ea3bf','#4f5d72');R(x+3,y+2,10,3,'#a6f0c6');R(x+2,y-4,12,4,'#5a6a80')},
 fishDisplay(x,y){box(x,y,22,12,'#d7eef8','#ffffff','#a9cfe0');R(x+4,y+4,9,4,'#f0953c');R(x+13,y+3,3,6,'#f0953c');R(x+5,y+5,1,1,'#222')},
 barrel(x,y){box(x,y,18,22,'#9b6b44','#b98557','#7a5233');R(x,y+5,18,2,'#5b5f6b');R(x,y+15,18,2,'#5b5f6b');R(x+3,y+1,12,3,'#c7965f')},
 plant(x,y){box(x+3,y+12,12,10,'#c8735a','#e08e72','#9e5642');R(x+1,y+2,6,8,'#4f9e5c');R(x+9,y,6,10,'#5fb36c');R(x+5,y-3,6,10,'#6fc77b');R(x+4,y+4,2,2,'#8fe39a');R(x+11,y+2,2,2,'#8fe39a')},
 rug(x,y,w,h,a,b){R(x,y,w,h,OUT);R(x+1,y+1,w-2,h-2,a);R(x+4,y+4,w-8,h-8,b);R(x+7,y+7,w-14,h-14,a);for(let i=x+3;i<x+w-3;i+=6){R(i,y-1,2,2,'#f4e6c8');R(i,y+h-1,2,2,'#f4e6c8')}},
 bookshelf(x,y,seed=0){box(x,y,32,44,'#7a5235','#93653f','#5c3c26');for(const r of [12,25,38])R(x,y+r,32,2,'#4c311f');const cols=['#c94c5a','#4f7fd0','#5fae6a','#e0a63a','#8a5fc9','#d97a4a','#3f9aa3'];for(let row=0;row<3;row++){let bx=x+2;let k=seed*7+row*5;while(bx<x+29){const w=2+Math.floor(hashI(k)*3),h=8+Math.floor(hashI(k+1)*3);R(bx,y+row*13+12-h,w,h,cols[k%cols.length]);R(bx,y+row*13+12-h,w,1,'#ffffff40');bx+=w+1;k++}}},
 table(x,y,w,h){box(x,y,w,h,'#a36f45','#c08756','#7f5332');R(x+2,y+h,3,6,'#6f472b');R(x+w-5,y+h,3,6,'#6f472b')},
 candle(x,y,t){R(x,y,4,7,'#f4efe2');R(x+1,y-3,2,3,(Math.floor(t*8)%2)?'#ffd65c':'#ff9d3c');R(x-1,y+7,6,2,'#c9963a')},
 book(x,y){R(x,y,12,8,'#4f7fd0');R(x+1,y+1,10,6,'#f4efe2');R(x+6,y,1,8,'#3a5fa0')},
 globe(x,y){box(x+3,y+18,10,4,'#7a5235','#93653f',null);R(x+7,y+12,2,6,'#7a5235');R(x,y,16,14,OUT);R(x+1,y+1,14,12,'#5ab0e0');R(x+3,y+3,5,4,'#5fae6a');R(x+9,y+7,4,4,'#5fae6a')},
 cauldron(x,y,t){R(x+4,y+24,24,4,'#5b5f6b');for(let i=0;i<3;i++)R(x+8+i*7,y+22+((Math.floor(t*6)+i)%2),4,4,i%2?'#ff9d3c':'#ffd65c');R(x-1,y+3,34,22,OUT);R(x,y+4,32,20,'#3d3448');R(x,y+4,32,3,'#5a4e68');R(x+3,y+2,26,4,'#7ff0a0');for(let i=0;i<4;i++){const bx=x+5+((i*9+Math.floor(t*10))%22),by=y-((t*14+i*5)%10);R(bx,by,3,3,'#9ff7b6')}},
 potionShelf(x,y){box(x,y,40,34,'#5b4377','#7a5d9a','#43315a');for(const r of [14,30])R(x,y+r,40,2,'#3a2950');const c=['#ff6fae','#7ff0a0','#7ec8e3','#f6dc4a','#c9a6ef'];for(let i=0;i<10;i++){const px=x+3+(i%5)*7,py=y+(i<5?4:20);R(px+1,py,2,2,'#e8e0d2');R(px,py+2,5,8,c[i%5]);R(px+1,py+3,1,3,'#ffffff80')}},
 crystalBall(x,y,t){box(x+2,y+14,16,6,'#7a5235','#93653f',null);R(x+2,y,16,14,OUT);R(x+3,y+1,14,12,'#b9a6f5');R(x+5,y+3,4,3,'#ffffff');R(x+9+Math.round(Math.sin(t*2)*2),y+7,3,3,'#ff9be6')},
 starRug(x,y,w,h){R(x,y,w,h,OUT);R(x+1,y+1,w-2,h-2,'#3b2f6b');for(let i=0;i<14;i++)R(x+4+hashI(i)*(w-8),y+4+hashI(i+20)*(h-8),2,2,i%3?'#f2d36b':'#ffffff');R(x+w/2-4,y+h/2-4,8,8,'#f2d36b');R(x+w/2-2,y+h/2-6,4,12,'#f2d36b');R(x+w/2-6,y+h/2-2,12,4,'#f2d36b')},
 questBoard(x,y){box(x,y,48,34,'#8c5d36','#a8744a','#6b4428');R(x+3,y+3,42,28,'#d9b98a');const papers=[[6,6,'#fff6e0'],[19,5,'#fde2ef'],[32,7,'#e3f4ff'],[10,18,'#fffbe0'],[26,18,'#fff6e0']];for(const [a,b,c] of papers){R(x+a,y+b,11,10,c);R(x+a+5,y+b-1,2,2,'#c94c5a');R(x+a+2,y+b+4,7,1,'#8a7f73');R(x+a+2,y+b+6,5,1,'#8a7f73')}},
 weaponRack(x,y){box(x,y,36,8,'#7a5235','#93653f','#5c3c26');box(x,y+32,36,6,'#7a5235','#93653f','#5c3c26');for(const [i,c] of [[5,'#dfe8f4'],[15,'#ffd45c'],[25,'#9fd6e8']]){R(x+i,y+6,3,26,c);R(x+i-2,y+26,7,2,'#c8952b');R(x+i,y+28,3,4,'#6b4428')}},
 mapTable(x,y,w,h){this.table(x,y,w,h);R(x+6,y+3,w-12,h-6,'#f1e2bf');R(x+10,y+6,14,8,'#a5d59d');R(x+30,y+5,20,10,'#7ec8e3');R(x+w-30,y+8,12,6,'#e0c26a');R(x+18,y+h-9,2,2,'#c94c5a')},
 trophy(x,y){box(x,y+12,14,6,'#7a5235','#93653f',null);R(x+3,y,8,8,'#ffd45c');R(x+5,y+8,4,4,'#c8952b');R(x+1,y+2,2,4,'#ffd45c');R(x+11,y+2,2,4,'#ffd45c');R(x+5,y+2,2,2,'#fff3b0')},
 armourStand(x,y){R(x+9,y+30,4,8,'#7a5235');box(x+4,y+36,14,4,'#7a5235','#93653f',null);box(x+2,y+10,18,20,'#aebdd2','#e9f1fb','#6c7c96');box(x+5,y,12,10,'#aebdd2','#e9f1fb','#6c7c96');R(x+7,y+4,8,2,'#2a1d33');R(x+10,y-4,3,5,'#9b5fd6')},
 bed(x,y,c){box(x,y,30,42,'#8a5d3b','#a8744a','#6b4428');R(x+2,y+2,26,4,'#6b4428');R(x+3,y+7,24,9,'#fbf7f1');R(x+3,y+14,24,2,'#e4dce6');R(x+2,y+17,26,23,c);R(x+2,y+17,26,3,'#ffffff55');R(x+2,y+38,26,2,'#00000030')},
 pcDesk(x,y,t){this.table(x,y+14,40,12);box(x+8,y-4,24,17,'#3e3a5c','#55507a','#2c2944');R(x+10,y-2,20,12,(Math.floor(t*2)%2)?'#8ce1ce':'#7fd6c4');R(x+17,y+2,6,3,'#f0953c');R(x+16,y+3,2,1,'#f0953c');R(x+18,y+13,4,2,'#2c2944');R(x+12,y+16,16,3,'#d6d2e6')},
 decorShelf(x,y){box(x,y,48,10,'#8a5d3b','#a8744a','#6b4428');R(x+4,y+10,3,8,'#6b4428');R(x+41,y+10,3,8,'#6b4428')},
 fireplace(x,y,t){box(x,y,44,40,'#9a8f99','#b8aeb8','#7a707a');for(let i=0;i<6;i++)R(x+2+(i%3)*14,y+3+Math.floor(i/3)*8,12,6,'#aaa0aa');R(x+8,y+16,28,24,'#2a1d33');for(let i=0;i<4;i++){const f=(Math.floor(t*8)+i)%3;R(x+11+i*6,y+40-10-f*3,5,10+f*3,i%2?'#ff9d3c':'#ffd65c')}R(x-3,y-4,50,5,'#7a5235')},
 sofa(x,y,c){box(x,y,48,22,c,'#ffffff40','#00000030');R(x-3,y+4,6,18,c);R(x+45,y+4,6,18,c);R(x+4,y+8,19,10,'#ffffff30');R(x+25,y+8,19,10,'#ffffff30');R(x-3,y+4,6,2,'#ffffff40');R(x+45,y+4,6,2,'#ffffff40')},
 kitchen(x,y){box(x,y,56,26,'#e8e0d2','#ffffff','#c8bfb0');R(x+4,y+4,18,10,'#5b5f6b');for(const a of [6,14])R(x+a,y+6,6,6,'#2a1d33');R(x+30,y+4,20,10,'#a9cfe0');R(x+38,y,4,5,'#aebdd2');R(x+2,y+17,24,7,'#b5804f');R(x+30,y+17,24,7,'#b5804f')},
 wardrobe(x,y){box(x,y,30,46,'#8a5d3b','#a8744a','#6b4428');R(x+14,y+2,2,42,'#6b4428');R(x+10,y+22,2,4,'#ffd45c');R(x+18,y+22,2,4,'#ffd45c')},
 lamp(x,y){R(x+6,y+12,2,22,'#5b5f6b');box(x+2,y+34,10,3,'#5b5f6b',null,null);R(x,y,14,12,'#f6dc4a');R(x+2,y+2,10,2,'#fff6b0')},
 chandelier(x,y,t){R(x+15,y,2,8,'#c8952b');R(x+2,y+8,28,3,'#ffd45c');for(const a of [2,14,26]){R(x+a,y+11,4,4,'#fff3b0');if(Math.floor(t*6+a)%2)R(x+a+1,y+15,2,2,'#ffd65c')}},
 piano(x,y){box(x,y,44,30,'#2f2a36','#4a4352','#1f1b25');R(x+3,y+18,38,7,'#fbf7f1');for(let i=0;i<9;i++)R(x+6+i*4,y+18,2,4,'#2f2a36')},
 chest(x,y){box(x,y+4,22,14,'#b5804f','#d39c66','#8c5d36');R(x-1,y,24,6,'#9b6b44');R(x+9,y+5,4,5,'#ffd45c')},
 teddy(x,y){R(x+2,y,4,4,'#c08756');R(x+10,y,4,4,'#c08756');R(x+3,y+2,10,9,'#c08756');R(x+5,y+5,2,2,'#2a1d33');R(x+9,y+5,2,2,'#2a1d33');R(x+2,y+10,12,9,'#c08756');R(x+5,y+12,6,5,'#e2b98c')},
 lantern(x,y,t){R(x+5,y,4,3,'#5b5f6b');R(x+1,y+3,12,15,'#e8506a');R(x+3,y+5,8,11,(Math.floor(t*3)%2)?'#ffd65c':'#ffc23c');R(x+1,y+18,12,2,'#5b5f6b')},
 ribbon(x,y){R(x,y,6,6,'#ff6fae');R(x+8,y,6,6,'#ff6fae');R(x+5,y+2,4,3,'#c73d7f');R(x+3,y+6,3,7,'#ff6fae');R(x+8,y+6,3,7,'#ff6fae')}
};
const DECOR={'🪴':(x,y)=>SPR.plant(x,y),'🧸':(x,y)=>SPR.teddy(x,y),'🖼️':(x,y)=>SPR.painting(x,y,'#e0a6c8'),'🏮':(x,y,t)=>SPR.lantern(x,y,t),'🎀':(x,y)=>SPR.ribbon(x,y)};

// ------------------------------------------------------------------ rooms
function walls(c1,c2,trim){R(0,0,LW,FLOOR_TOP,c1);for(let x=0;x<LW;x+=16)R(x,0,1,FLOOR_TOP-12,c2);R(0,FLOOR_TOP-12,LW,10,c2);R(0,FLOOR_TOP-3,LW,3,trim||'#6b4428');R(0,0,4,LH,trim||'#6b4428');R(LW-4,0,4,LH,trim||'#6b4428')}
function floor(kind,a,b){
 for(let y=FLOOR_TOP;y<LH;y+=8)for(let x=0;x<LW+16;x+=16){
  if(kind==='wood'){const off=(y/8)%2?8:0;R(x-off,y,16,8,((x+y)/8)%3?a:b);R(x-off,y+7,16,1,'#00000022');R(x-off,y,1,8,'#00000022')}
  else if(kind==='tile'){R(x,y,16,8,((x/16+y/8)%2)?a:b)}
  else if(kind==='stone'){R(x,y,16,8,a);R(x+((y/8)%2?8:0),y,1,8,b);R(x,y+7,16,1,b)}
  else{R(x,y,16,8,a);if(hashI(x*3+y)>.8)R(x+5,y+3,2,1,b)}
 }
}
function doorway(){R(4,LH-4,140,4,'#6b4428');R(176,LH-4,140,4,'#6b4428');R(146,LH-8,28,8,'#c9963a');R(148,LH-6,24,4,'#e8bb5c')}
const npc=(id,x,y,talk)=>({type:'npc',id,x,y,w:16,h:6,base:y,solid:true,label:'Talk to '+(art.coats[id]?.name||id),use:talk||(()=>window.catCityOpenNpcQuest?.(art.coats[id]?.name)),useX:x,useY:y+10});
const item=(o)=>({solid:true,...o,base:o.base??(o.y+o.h)});
const CLUES=['Pebble whispers: treasure often hides where paths fork.','A note in the margin: “Wranglers fear the light of starlit lanterns.”','An old map shows a cave east of the village, glowing at night.','“Chop three trees, mine three rocks — that is the woodcutter’s way.”','“Birmans hate the sound of rhythm crystals.”'];
const ROOMS={
 shop:{title:'🛍️ Marmalade’s Shop',bg(){floor('wood','#c99a6a','#b98a5c');walls('#f3c9b8','#e9b5a2','#8c5d36')},
  items:()=>[
   item({x:24,y:12,w:32,h:24,draw:()=>SPR.window(24,12),solid:false,wall:true}),
   item({x:264,y:12,w:32,h:24,draw:()=>SPR.window(264,12),solid:false,wall:true}),
   item({x:66,y:26,w:48,h:40,base:66,draw:()=>SPR.shelfGoods(66,26)}),
   item({x:206,y:26,w:48,h:40,base:66,draw:()=>SPR.shelfGoods(206,26)}),
   item({x:110,y:150,w:100,h:40,draw:()=>SPR.rug(110,150,100,40,'#c94c5a','#e8bb5c'),solid:false,flat:true}),
   npc('marmalade',160,92,()=>{openShop()}),
   item({x:112,y:96,w:96,h:22,draw:()=>{SPR.counter(112,96,96);SPR.register(126,92);SPR.fishDisplay(176,94)},label:'Shop with Marmalade',use:()=>openShop(),useX:160,useY:126}),
   item({x:18,y:150,w:18,h:22,draw:()=>SPR.barrel(18,150)}),item({x:284,y:150,w:18,h:22,draw:()=>SPR.barrel(284,150)}),
   item({x:20,y:70,w:18,h:22,draw:()=>SPR.plant(20,70)}),item({x:282,y:70,w:18,h:22,draw:()=>SPR.plant(282,70)})
  ]},
 library:{title:'📚 Moonbeam Library',bg(){floor('wood','#a98a6a','#9a7b5c');walls('#cfc3ec','#bfb1e2','#5c3c26')},
  items:()=>[
   ...[12,48,240,276].map((x,i)=>item({x,y:20,w:32,h:44,base:64,draw:()=>SPR.bookshelf(x,20,i),label:'Read a book',use:()=>say(CLUES[(i+Math.floor(Date.now()/4000))%CLUES.length]),useX:x+16,useY:72})),
   item({x:134,y:10,w:32,h:24,draw:()=>SPR.moonWindow(134,10),solid:false,wall:true}),
   item({x:100,y:130,w:120,h:50,draw:()=>SPR.rug(100,130,120,50,'#4f7fd0','#cfc3ec'),solid:false,flat:true}),
   item({x:116,y:112,w:88,h:22,draw:(t)=>{SPR.table(116,112,88,22);SPR.candle(128,106,t);SPR.book(150,110);SPR.book(176,108)},label:'Study at the table',use:()=>say('📖 You read about the Birman family… they love yarn and rhythm.'),useX:160,useY:142}),
   item({x:28,y:150,w:16,h:22,draw:()=>SPR.globe(28,150)}),
   npc('pebble',230,104),
   item({x:286,y:150,w:18,h:22,draw:()=>SPR.plant(286,150)})
  ]},
 magic:{title:'🔮 Luna’s Cottage',bg(){floor('plain','#4a3b6e','#7c6aa8');walls('#6b5590','#5d4980','#3a2950')},
  items:()=>[
   item({x:144,y:10,w:32,h:24,draw:()=>SPR.moonWindow(144,10),solid:false,wall:true}),
   item({x:18,y:28,w:40,h:34,base:64,draw:()=>SPR.potionShelf(18,28)}),item({x:262,y:28,w:40,h:34,base:64,draw:()=>SPR.potionShelf(262,28)}),
   item({x:96,y:132,w:128,h:52,draw:()=>SPR.starRug(96,132,128,52),solid:false,flat:true}),
   item({x:144,y:100,w:32,h:28,draw:(t)=>SPR.cauldron(144,100,t),label:'Brew potions at the cauldron',use:()=>{if(window.catCityPotions)window.catCityPotions.open();else blessing()},useX:160,useY:136}),
   item({x:48,y:118,w:20,h:20,draw:(t)=>SPR.crystalBall(48,118,t),label:'Gaze into the crystal ball',use:()=>say('🔮 The crystal shows… a quest marker near '+(['Biscuit','Pebble','Forge','the arena'][Math.min(3,Math.floor((s.questStage||0)/5))])+'.'),useX:58,useY:146}),
   npc('luna',232,108)
  ]},
 guild:{title:'⚔️ Adventure Guild',bg(){floor('stone','#9a8f99','#7a707a');walls('#d9b98a','#c9a674','#6b4428')},
  items:()=>[
   item({x:136,y:14,w:48,h:34,draw:()=>SPR.questBoard(136,14),solid:false,wall:true,label:'Read the quest board',use:()=>{leave(true);$('quest-btn')?.click()},useX:160,useY:74}),
   item({x:20,y:24,w:36,h:38,base:64,draw:()=>SPR.weaponRack(20,24)}),item({x:264,y:24,w:36,h:38,base:64,draw:()=>SPR.weaponRack(264,24)}),
   item({x:104,y:116,w:112,h:30,draw:()=>SPR.mapTable(104,116,112,30),label:'Look at the big map',use:()=>{leave(true);$('map-open')?.click()},useX:160,useY:156}),
   item({x:64,y:44,w:14,h:18,base:64,draw:()=>SPR.trophy(64,44)}),item({x:242,y:44,w:14,h:18,base:64,draw:()=>SPR.trophy(242,44)}),
   item({x:24,y:132,w:22,h:40,draw:()=>SPR.armourStand(24,132)}),item({x:276,y:132,w:22,h:40,draw:()=>SPR.armourStand(276,132)}),
   npc('biscuit',200,94)
  ]},
 home:{title:'🏡 Cosy Cat House',bg(){floor('wood','#d4b58b','#c1a17d');walls('#b6d5fa','#a3c6f0','#5c3c26')},
  items:()=>homeItems({id:'home',bed:'#7ec8e3',rug:['#4f7fd0','#f4e6c8'],pc:true})},
 'Rose Cottage':{title:'🌹 Rose Cottage',bg(){floor('wood','#d9a98a','#c8967a');walls('#f7cfdc','#efbccc','#8c5d36')},
  items:()=>homeItems({id:'Rose Cottage',bed:'#e47c9a',rug:['#c94c5a','#f7cfdc'],sofa:'#e8a0b6',fireplace:true})},
 'Lavender Lodge':{title:'💜 Lavender Lodge',bg(){floor('wood','#bba3d6','#ab92c8');walls('#d8c6f2','#c9b4ea','#5b4377')},
  items:()=>homeItems({id:'Lavender Lodge',bed:'#9b5fd6',rug:['#6b4b9e','#d8c6f2'],sofa:'#b48ad8',fireplace:true,piano:true,shelf:true})},
 'Golden Villa':{title:'✨ Golden Villa',bg(){floor('tile','#f4ecd8','#e2d2b0');walls('#f6e3b0','#ecd394','#9c7027')},
  items:()=>homeItems({id:'Golden Villa',bed:'#e8bb5c',rug:['#c8952b','#fff3d0'],sofa:'#d9a84a',fireplace:true,piano:true,shelf:true,chandelier:true,kitchen:true})}
};
function homeItems(o){
 const list=[
  item({x:24,y:12,w:32,h:24,draw:()=>SPR.window(24,12),solid:false,wall:true}),
  item({x:136,y:28,w:22,h:16,draw:()=>SPR.painting(136,28,'#8fd1b0'),solid:false,wall:true}),
  item({x:96,y:126,w:128,h:48,draw:()=>SPR.rug(96,126,128,48,o.rug[0],o.rug[1]),solid:false,flat:true}),
  item({x:18,y:66,w:30,h:42,draw:()=>SPR.bed(18,66,o.bed),label:'Rest in bed (saves your game)',use:()=>{core.persist();say('💤 You curl up for a nap… game saved!')},useX:33,useY:116}),
  item({x:112,y:44,w:48,h:10,base:64,draw:()=>SPR.decorShelf(112,44),label:'Decorate with your treasures',use:()=>decorate(),useX:136,useY:74}),
  item({x:282,y:150,w:18,h:22,draw:()=>SPR.plant(282,150)}),
 ];
 if(o.pc)list.push(item({x:250,y:62,w:40,h:26,base:88,draw:(t)=>SPR.pcDesk(250,62,t),label:'Use the fish-team computer',use:()=>{if(typeof core.collector==='function'){raiseDialog();core.collector()}},useX:270,useY:96}));
 if(o.fireplace)list.push(item({x:250,y:24,w:44,h:40,base:64,draw:(t)=>SPR.fireplace(250,24,t),label:'Warm your paws by the fire',use:()=>say('🔥 Toasty! Your whiskers feel warm.'),useX:272,useY:74}));
 if(o.sofa)list.push(item({x:200,y:150,w:48,h:22,draw:()=>SPR.sofa(200,150,o.sofa),label:'Sit on the sofa',use:()=>say('🛋️ So comfy. A perfect place for a cat nap.'),useX:224,useY:178}));
 if(o.piano)list.push(item({x:200,y:34,w:44,h:30,base:64,draw:()=>SPR.piano(200,34),label:'Play the piano',use:()=>{say('🎹 Plink plonk! A lovely little tune.');window.catCityPlayChime?.()},useX:222,useY:74}));
 if(o.shelf)list.push(item({x:60,y:20,w:32,h:44,base:64,draw:()=>SPR.bookshelf(60,20,3),label:'Browse your books',use:()=>say(CLUES[Math.floor(Math.random()*CLUES.length)]),useX:76,useY:72}));
 if(o.chandelier)list.push(item({x:144,y:0,w:32,h:18,draw:(t)=>SPR.chandelier(144,0,t),solid:false,wall:true}));
 if(o.kitchen)list.push(item({x:18,y:150,w:56,h:26,draw:()=>SPR.kitchen(18,150),label:'Cook something tasty',use:()=>{if(window.catCityCook){leave(true);window.catCityCook()}else say('🐟 You make a tasty fish snack. Yum!')},useX:46,useY:182}));
 else list.push(item({x:18,y:150,w:30,h:46,draw:()=>SPR.wardrobe(18,150),label:'Change your look',use:()=>{leave(true);$('wardrobe-open')?.click()},useX:33,useY:200}));
 // Decorations the player has placed, on the shelf and around the room.
 const placed=Array.isArray(s.decorPlaced)?s.decorPlaced:[];
 const spots=[[116,30],[136,30],[156,30],[72,136],[236,96]];
 placed.slice(0,spots.length).forEach((d,i)=>{const [x,y]=spots[i];if(DECOR[d])list.push(item({x,y,w:14,h:18,draw:(t)=>DECOR[d](x,y,t),solid:false,wall:i<3,base:i<3?56:y+18}))});
 // Furniture, pets and the cooking pot from cozy-update.js.
 try{list.push(...(window.catCityHomeExtras?.(o,{item,SPR,say,leave})||[]))}catch(e){console.warn('home extras',e)}
 return list;
}

// ------------------------------------------------------------------ doors
const HOMES=[
 {id:'Rose Cottage',x:8*T,y:33*T,cost:500,roof:'#d9607e',wall:'#f7cfdc',trim:'#8c5d36'},
 {id:'Lavender Lodge',x:23*T,y:33*T,cost:750,roof:'#7a52b8',wall:'#e2d2f6',trim:'#5b4377'},
 {id:'Golden Villa',x:39*T,y:33*T,cost:1000,roof:'#c8952b',wall:'#fbeec8',trim:'#7a5235'}
];
const DOORS=[
 {room:'shop',x:9*T,y:11*T,r:70},{room:'library',x:23*T,y:11*T,r:70},{room:'magic',x:38*T,y:11*T,r:70},
 {room:'guild',x:10*T,y:28*T,r:70},{room:'home',x:26*T,y:27*T,r:95},
 ...HOMES.map(h=>({room:h.id,x:h.x,y:h.y+82,r:70,home:h}))
];
function overworld(){
 const b=document.body.classList;
 return !inside&&!core.bossMode&&!b.contains('start-menu-open')&&!b.contains('taghouse-inside')&&!b.contains('catcity-in-cave')&&!b.contains('cc-on-stage')&&!b.contains('cc-tutorial-play')&&!b.contains('in-interior')&&!b.contains('cc-in-pc-house')&&!b.contains('cc-in-museum')&&!b.contains('cc-in-squishem-event')&&!window.catCityCaveState?.().inside;
}
function nearDoor(){if(!overworld())return null;let best=null,bd=1e9;for(const d of DOORS){const dist=Math.hypot(s.x-d.x,s.y-d.y);if(dist<d.r&&dist<bd){bd=dist;best=d}}return best}

// ------------------------------------------------------------------ outdoor homes (pixel art)
const houseCache=new Map();
function houseSprite(h,owned){
 const key=h.id+owned;if(houseCache.has(key))return houseCache.get(key);
 const W=36,H=34,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 const grid=Array.from({length:H},()=>Array(W).fill(null));
 const P=(a,b,w,hh,col)=>{for(let yy=b;yy<b+hh;yy++)for(let xx=a;xx<a+w;xx++)if(yy>=0&&yy<H&&xx>=0&&xx<W)grid[yy][xx]=col};
 P(26,1,4,8,'#a8604a');P(26,1,4,1,'#c97a62');
 for(let r=0;r<11;r++){const inset=Math.max(0,9-r);P(1+inset,4+r,34-inset*2,1,r%2?shade(h.roof,.85):h.roof)}
 P(0,14,36,2,shade(h.roof,.7));
 P(4,16,28,18,h.wall);for(let yy=18;yy<34;yy+=4)P(4,yy,28,1,shade(h.wall,.93));
 P(4,16,1,18,h.trim);P(31,16,1,18,h.trim);
 P(15,22,6,12,h.trim);P(16,23,4,11,shade(h.trim,1.25));P(19,28,1,1,'#ffd45c');P(13,33,10,1,'#9a8f99');
 for(const wx of [7,24]){P(wx,19,6,6,h.trim);P(wx+1,20,4,4,owned?'#ffe38a':'#5a6b8e');if(owned)P(wx+1,20,2,1,'#fff6c8');P(wx+2,20,1,4,h.trim);P(wx-1,25,8,2,'#7a5235');P(wx,24,1,1,'#e8506a');P(wx+3,24,1,1,'#f6dc4a');P(wx+5,24,1,1,'#ff8fc8')}
 for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){if(grid[yy][xx]){x.fillStyle=grid[yy][xx];x.fillRect(xx,yy,1,1)}else if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>grid[yy+dy]?.[xx+dx])){x.fillStyle=OUT;x.fillRect(xx,yy,1,1)}}
 houseCache.set(key,c);return c;
}
function shade(hex,k){const n=parseInt(hex.slice(1),16);const f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return '#'+((1<<24)|(f(n>>16&255)<<16)|(f(n>>8&255)<<8)|f(n&255)).toString(16).slice(1)}
// ------------------------------------------------------------------ solid buildings
// Glitch report "I keep passing through buildings": the village buildings had no collision.
// Walls are solid now; you can still reach every door (they sit on the bottom edge).
const SOLID=[
 ...[[5,5,8,6],[19,5,9,6],[34,5,8,6],[6,22,9,6],[22,22,9,6],[35,22,8,6]].map(([x,y,w,h])=>({x:x*T+6,y:y*T+4,w:w*T-12,h:h*T-14})),
 ...HOMES.map(h=>({x:h.x-62,y:h.y-46,w:124,h:104})),
 {x:18*T-56,y:29*T-78,w:112,h:66} // Squishem Museum
];
const inSolid=(x,y)=>SOLID.some(b=>x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h);
let lastX=s.x,lastY=s.y;
function collide(){
 if(!overworld()||document.body.classList.contains('cc-in-castle')||window.catCityCastleEscape?.open?.()){lastX=s.x;lastY=s.y;return}
 const fx=s.x,fy=s.y+10; // the cat's feet
 if(inSolid(fx,fy)&&!inSolid(lastX,lastY+10)&&Math.hypot(s.x-lastX,s.y-lastY)<60){ // walked in (not a teleport)
  if(!inSolid(fx,lastY+10))s.y=lastY;else if(!inSolid(lastX,fy))s.x=lastX;else{s.x=lastX;s.y=lastY}
 }
 lastX=s.x;lastY=s.y;
}
window.catCitySolidAt=(x,y)=>inSolid(x,y+10);
const oldDraw=core.draw;
core.draw=function(){
 collide();
 oldDraw();
 if(!overworld())return;
 const ctx=core.ctx,W=core.W,H=core.H,camX=s.x-W/2,camY=s.y-H/2,houses=Array.isArray(s.houses)?s.houses:[];
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(const h of HOMES){
  const sx=h.x-camX,sy=h.y-camY;if(sx<-120||sx>W+120||sy<-160||sy>H+140)continue;
  const owned=houses.includes(h.id),img=houseSprite(h,owned),S=4;
  ctx.drawImage(img,Math.round(sx-img.width*S/2),Math.round(sy+76-img.height*S),img.width*S,img.height*S);
  ctx.textAlign='center';ctx.font='bold 13px system-ui';ctx.lineWidth=4;ctx.strokeStyle='#2a1d33';ctx.fillStyle='#fff6e4';
  const label=(owned?'🏡 ':'🔒 ')+h.id+(owned?'':' · '+h.cost+' 🐟');
  ctx.strokeText(label,sx,sy+76-img.height*S-8);ctx.fillText(label,sx,sy+76-img.height*S-8);
  if(!owned){ctx.fillStyle='#fff6e4';ctx.strokeStyle='#2a1d33';ctx.lineWidth=2;ctx.fillRect(sx+58,sy+34,34,22);ctx.strokeRect(sx+58,sy+34,34,22);ctx.fillStyle='#7a5235';ctx.fillRect(sx+73,sy+56,4,18);ctx.fillStyle='#c94c5a';ctx.font='bold 9px system-ui';ctx.fillText('FOR',sx+75,sy+44);ctx.fillText('SALE',sx+75,sy+53)}
 }
 const d=nearDoor();
 if(d){const name=d.home?d.home.id:ROOMS[d.room].title.replace(/^\S+\s/,'');const owned=!d.home||houses.includes(d.home.id);
  const msg=owned?'E / 🐾 · Enter '+name:'🔒 '+name+' · buy it in the Shop ('+d.home.cost+' 🐟)';
  ctx.font='bold 14px system-ui';const w=ctx.measureText(msg).width+24;ctx.fillStyle='#342849e6';ctx.fillRect(W/2-w/2,H-128,w,30);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(msg,W/2,H-108)}
 ctx.restore();
};

// ------------------------------------------------------------------ interior loop
let inside=false,room=null,items=[],px=160,py=190,last=0,raf=0,step=0,facing=1,dirPose='walkBack',moving=false,blessed=false,sayUntil=0,sayText='';
const oldInteract=core.interact;
core.interact=function(){
 if(inside){use();return}
 const d=nearDoor();
 if(d){if(d.home&&!(s.houses||[]).includes(d.home.id)){core.note('🔒 '+d.home.id+' is for sale: buy it in the Shop for '+d.home.cost+' 🐟');return}enter(d.room);return}
 return oldInteract();
};
if($('interact'))$('interact').onclick=()=>core.interact();
let roomId=null;
function enter(id){roomId=id;
 room=ROOMS[id];if(!room)return;
 inside=true;items=room.items();px=160;py=192;facing=1;dirPose='walkBack';blessed=false;sayText='';
 $('cc-interior-title').textContent=room.title;
 root.classList.add('open');document.body.classList.add('cc-in-interior-room');
 pressed.clear();last=performance.now();raf=requestAnimationFrame(loop);
 window.dispatchEvent(new CustomEvent('catcity:interior',{detail:{inside:true,room:id}}));
}
function leave(quiet){
 if(!inside)return;inside=false;pressed.clear();cancelAnimationFrame(raf);
 root.classList.remove('open');document.body.classList.remove('cc-in-interior-room');
 if($('dialog'))$('dialog').style.zIndex='';
 if(!quiet)core.note('🚪 Back outside.');
 window.dispatchEvent(new CustomEvent('catcity:interior',{detail:{inside:false}}));
}
function say(t){sayText=t;sayUntil=performance.now()+3500;hintEl.textContent=t}
function raiseDialog(){if($('dialog'))$('dialog').style.zIndex='7900'}
function openShop(){if(window.catCityTutorial?.active&&typeof window.catCityTutorialShop==='function'){leave(true);window.catCityTutorialShop();return}leave(true);if(typeof core.renderShop==='function')core.renderShop();const m=$('shop-menu');m?.classList.add('open');$('shop-toggle')?.setAttribute('aria-expanded','true');core.note('🛍️ Marmalade: “Have a look around, sweet whiskers!”')}
function blessing(){if(blessed){say('✨ Luna: “The moon has blessed you already today — come back soon!”');return}blessed=true;s.fish=(s.fish||0)+5;core.persist();say('✨ Luna gives you a moon blessing: +5 fish coins!')}
function decorate(){
 s.decorUnlocked=Array.isArray(s.decorUnlocked)?s.decorUnlocked:[];s.decorPlaced=Array.isArray(s.decorPlaced)?s.decorPlaced:[];
 const next=s.decorUnlocked.find(d=>!s.decorPlaced.includes(d));
 if(!next){say(s.decorUnlocked.length?'🎀 All your treasures are already on display!':'🎁 Find treasures in caves to decorate your home.');return}
 s.decorPlaced.push(next);core.persist();items=room.items();say('🎀 You placed '+next+' in your home!');
}
function nearest(){let best=null,bd=26;for(const it of items){if(!it.use)continue;const d=Math.hypot(px-it.useX,py-it.useY);if(d<bd){bd=d;best=it}}return best}
function use(){if(!inside)return;const it=nearest();if(it){if(it.type==='npc')raiseDialog();it.use()}else say('Walk up to something glowing and press E / 🐾. The door at the bottom leads outside.')}
function blocked(x,y){
 if(x<10||x>LW-10||y<FLOOR_TOP+8||y>LH-4)return true;
 for(const it of items){if(!it.solid||it.flat)continue;const top=it.type==='npc'?it.y-4:Math.max(FLOOR_TOP,it.base-10),bottom=it.type==='npc'?it.y+3:it.base+2;const left=it.type==='npc'?it.x-8:it.x-2,right=it.type==='npc'?it.x+8:it.x+it.w+2;if(x>left-5&&x<right+5&&y>top&&y<bottom)return true}
 return false;
}
const keymap={w:'up',a:'left',s:'down',d:'right',arrowup:'up',arrowleft:'left',arrowdown:'down',arrowright:'right'};
window.addEventListener('keydown',e=>{
 if(!inside||e.target?.closest?.('input,select,textarea,[contenteditable]'))return;
 const k=String(e.key||'').toLowerCase();
 if(k==='escape'&&$('dialog')?.style.display==='block')return;
 if(k==='escape'){e.preventDefault();e.stopImmediatePropagation();leave();return}
 if(k==='e'||k===' '||k==='enter'){e.preventDefault();e.stopImmediatePropagation();use();return}
 if(keymap[k]){e.preventDefault();e.stopImmediatePropagation();pressed.add(keymap[k])}
},true);
window.addEventListener('keyup',e=>{if(inside)pressed.delete(keymap[String(e.key||'').toLowerCase()])},true);
function loop(ts){
 if(!inside)return;
 const dt=Math.min(.05,Math.max(.004,(ts-last)/1000));last=ts;const t=ts/1000;
 const dx=(pressed.has('right')?1:0)-(pressed.has('left')?1:0),dy=(pressed.has('down')?1:0)-(pressed.has('up')?1:0);
 moving=!!(dx||dy);
 if(moving){
  const sp=72*dt/Math.hypot(dx,dy);const nx=px+dx*sp,ny=py+dy*sp;
  if(!blocked(nx,py))px=nx;if(!blocked(px,ny))py=ny;
  step+=sp;if(dx)facing=dx<0?-1:1;dirPose=Math.abs(dx)>=Math.abs(dy)?'walk':(dy<0?'walkBack':'walkFront');
  if(py>LH-8&&Math.abs(px-160)<16&&dy>0){leave();return}
 }
 // draw
 room.bg();doorway();
 for(const it of items)if(it.wall||it.flat)it.draw(t);
 const ents=items.filter(it=>!it.wall&&!it.flat).map(it=>({y:it.base,draw:()=>it.type==='npc'?art.draw(g,it.x,it.y,it.id,'idle',(t%3.4)<.14?1:0,{scale:1}):it.draw(t)}));
 const id=CAT_IDS[s.cat]||'astro';
 ents.push({y:py,draw:()=>{g.fillStyle='#00000033';g.beginPath();g.ellipse(px,py,9,3,0,0,7);g.fill();
  if(moving)art.draw(g,px,py,id,dirPose,dirPose==='walk'?Math.floor(step/6)%4:Math.floor(step/7)%2,{scale:1,flip:dirPose==='walk'&&facing<0});
  else art.draw(g,px,py,id,'idle',(t%3.6)<.14?1:0,{scale:1})}});
 ents.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
 const near=nearest();
 if(near){const bob=Math.round(Math.sin(t*6)*1.5);const ax=Math.round(near.useX),ay=Math.round((near.type==='npc'?near.y-36:Math.min(near.y,near.base-20)-8)+bob);R(ax-3,ay,7,2,'#ffe38a');R(ax-2,ay+2,5,2,'#ffe38a');R(ax-1,ay+4,3,2,'#ffe38a');R(ax-4,ay-1,9,1,OUT)}
 if(performance.now()>sayUntil)hintEl.textContent=near?'E / 🐾 · '+near.label:'Walk around with WASD / arrows (or drag on the room). The door at the bottom leads outside.';
 raf=requestAnimationFrame(loop);
}
// Other features can add their own rooms (e.g. the inside of a TV, tv-glitch.js).
function addRoom(id,def){ROOMS[id]=def}
window.catCityInteriors={enter,leave,addRoom,homeItems:o=>homeItems(o),floor:(...a)=>floor(...a),walls:(...a)=>walls(...a),get roomId(){return inside?roomId:null},get inside(){return inside},get rooms(){return Object.keys(ROOMS)},
 kit:{R,floor,walls,doorway,item,say,SPR,LW,LH,FLOOR_TOP,ctx:()=>g}};
})();

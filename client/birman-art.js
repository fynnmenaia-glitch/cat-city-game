/* Cat City — Birman boss art.
 * Original pixel-art Birman bosses, built from simple shapes at load time and
 * cached as small canvases. Real Birman markings: cream body with a golden
 * tint, dark "points" (mask, ears, legs, tail), white gloves on every paw and
 * deep blue eyes.
 *
 * Variants:
 *   king    — Yarn Ball Birman (Quest 8): seal point, gold crown, yarn ball.
 *   junior  — Birman Junior (Quest 12): blue point kitten, big eyes, scarf, yarn on head.
 *   armour  — Armoured Birman (Quest 16): helmet + plume, breastplate, shield, sword.
 *   finale  — Junior in the Quest 20 showdown: Junior with a shoulder plate.
 *
 * Animation: tail sway, blinking, idle bob, white flash when hit, glowing eyes
 * once a boss is below half health.
 *
 * API: window.catCityBirmanArt.draw(ctx, x, y, variant, {hp, max, t})
 *   x,y is the same point the old boss sprite used (feet sit about 48px below).
 *   window.catCityBirmanArt.sheet() returns a canvas with every variant/frame.
 */
(()=>{'use strict';
const GW=44,GH=46;
const BASE={
 o:'#2b1f35', // outline
 c:'#f7ecd6', // cream body
 C:'#e6d2ad', // cream shade
 g:'#f1d79f', // golden back tint
 f:'#fffaf0', // light ruff / chest fluff
 w:'#ffffff', // white gloves
 W:'#ddd9e6', // glove shade / whiskers
 b:'#2f6fd8', // eye blue
 B:'#a9dcff', // eye highlight
 k:'#151528', // pupil
 p:'#ec9fb6', // nose / inner ear
 y:'#ffd45c', // gold
 Y:'#c8952b', // gold shade
 r:'#e8506a', // red gem
 n:'#d98be0', // yarn
 N:'#a556b8', // yarn shade
 m:'#aebdd2', // steel
 M:'#6c7c96', // dark steel
 l:'#e9f1fb', // steel highlight
 v:'#9b5fd6', // plume
 V:'#6b3aa3', // plume shade
 s:'#ff8fc8', // scarf pink
 S:'#d95e9c', // scarf shade
 e:'#ff5fd2', // enraged eye glow
 E:'#ffd1f3'  // enraged eye highlight
};
const POINTS={
 seal:{P:'#5b3a2b',Q:'#8a6248'},
 blue:{P:'#63718f',Q:'#8f9cb8'}
};
function grid(){return Array.from({length:GH},()=>Array(GW).fill(null))}
function build(variant,{tail=0,blink=false,angry=false}={}){
 const g=grid(),junior=variant==='junior'||variant==='finale',armour=variant==='armour';
 const put=(x,y,c,only)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=GW||y>=GH)return;if(only&&!only.includes(g[y][x]))return;g[y][x]=c};
 const ell=(cx,cy,rx,ry,c,only,clip)=>{for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;if(dx*dx+dy*dy<=1&&(!clip||clip(x,y)))put(x,y,c,only)}};
 const rect=(x0,y0,x1,y1,c,only)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)put(x,y,c,only)};
 const poly=(pts,c,only)=>{for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){let inside=false;const px=x+.5,py=y+.5;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,yi]=pts[i],[xj,yj]=pts[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)inside=!inside}if(inside)put(x,y,c,only)}};
 const body=['c','C','g','f'];
 // 1. Tail — fluffy, fully point coloured, swaying tip.
 const sway=[-2,0,2,0][tail%4];
 for(let i=0;i<=24;i++){const t=i/24,u=1-t;
  const x=u*u*30+2*u*t*41+t*t*(36+sway),y=u*u*37+2*u*t*34+t*t*16,r=2.9-t*.6;
  ell(x,y,r,r,'P')}
 // 2. Back legs and paws.
 ell(13,39,4,3.3,'P');ell(31,39,4,3.3,'P');
 ell(12,41.5,3.2,1.7,'w');ell(32,41.5,3.2,1.7,'w');
 // 3. Yarn ball held at the side (king).
 if(variant==='king'){
  ell(8.5,33,5.6,5.6,'n');
  for(const [a,b] of [[5,30],[6,33],[8,36],[11,31],[10,35]])put(a,b,'N');
  for(let x=4;x<=12;x++)put(x,33+Math.round(Math.sin(x*.9)),'N',['n']);
  for(let i=0;i<7;i++)put(4-i*.5,38+i,'N');
 }
 // 4. Body with golden back tint and shading.
 ell(22,33,11,9.5,'c');
 ell(22,27,9,4,'g',['c']);
 ell(24,38,10,4.5,'C',['c']);
 // 5. Front legs with white gloves.
 rect(16,34,19,40,'P');rect(25,34,28,40,'P');
 rect(15,40,20,42,'w');rect(24,40,29,42,'w');
 for(const x of [17,19,26,28])put(x,42,'W');
 // 6. Chest ruff with a jagged lower edge.
 ell(22,26,9,5,'f');
 ell(22,28.5,7,2.2,'c',['f']);
 // 7. Ears (point colour) with pink inners.
 poly([[10.5,12],[12.5,1.5],[19,8]],'P');poly([[13,10],[13.8,5],[17,8.5]],'p');
 poly([[33.5,12],[31.5,1.5],[25,8]],'P');poly([[31,10],[30.2,5],[27,8.5]],'p');
 // 8. Head with cheek fluff.
 ell(22,16,11.5,9,'c');
 poly([[11,15],[8.5,20],[12,22]],'c');poly([[33,15],[35.5,20],[32,22]],'c');
 ell(22,11,7,3,'g',['c']);
 // 9. Mask: soft edge, then dark centre.
 ell(22,18.6,7.6,6.2,'Q',['c','g']);
 ell(22,19,6.3,5.1,'P',['c','g','Q']);
 // 10. Eyes.
 const big=junior;
 const eyes=big?[[15,14,19,18],[25,14,29,18]]:[[16,15,18,17],[26,15,28,17]];
 for(const [x0,y0,x1,y1] of eyes){
  if(blink){rect(x0,Math.floor((y0+y1)/2),x1,Math.floor((y0+y1)/2),'o');continue}
  rect(x0,y0,x1,y1,angry?'e':'b');
  const mid=Math.floor((x0+x1)/2)+(big?1:0);rect(mid,y0,mid,y1,'k');
  if(big)rect(mid-1,y0+1,mid-1,y1-1,'k');
  put(x0,y0,angry?'E':'B');if(big)put(x0+1,y0,angry?'E':'B');
 }
 if(!junior&&!blink){put(18,15,'P');put(26,15,'P')} // slanted, cross boss eyes
 // 11. Nose and mouth.
 put(21,19,'p');put(22,19,'p');
 if(junior){put(20,20,'o');put(23,20,'o');put(21,21,'o');put(22,21,'o')} // cheeky smile
 else{put(21,20,'o');put(22,20,'o');put(20,21,'o');put(23,21,'o')} // grumpy boss mouth
 // 12. Accessories.
 if(variant==='king'){
  rect(15,5,29,8,'y');rect(15,8,29,8,'Y');
  poly([[15,5.5],[15,1],[18.5,5.5]],'y');poly([[19.5,5.5],[22,0],[24.5,5.5]],'y');poly([[25.5,5.5],[29,1],[29,5.5]],'y');
  put(22,6,'r');put(18,6,'r');put(26,6,'r');put(22,2,'r');
 }
 if(junior){
  rect(13,23,31,25,'s');rect(13,25,31,25,'S');
  poly([[27,25],[33,25],[32,31],[29,30]],'s');put(31,30,'S');put(32,29,'S');
  if(variant==='junior'){ell(22,3,4,3.4,'n');put(20,2,'N');put(23,4,'N');put(24,2,'N');put(21,4,'N')}
  else{ell(13,26,4.2,3,'m');ell(12,25,1.6,1,'l');rect(10,28,16,28,'M',['m'])}
 }
 if(armour){
  ell(22,11,12.2,7.4,'m',null,(x,y)=>y<=12);
  rect(10,12,34,13,'M');
  ell(17,7,3,1.6,'l',['m']);
  rect(21,4,23,12,'M',['m']);
  poly([[21,5],[21,0],[27,0.5],[30,3],[25,3],[23,5]],'v');put(26,1,'V');put(28,2,'V');put(24,2,'V');
  ell(22,30.5,9.2,7.6,'m',null,(x,y)=>y>=24);
  ell(19,28,3,2,'l',['m']);
  rect(13,24,31,24,'y',['m','f','c','g']);rect(22,25,22,37,'M',['m']);
  ell(12,26,4.2,3.2,'m');ell(32,26,4.2,3.2,'m');ell(11,25,1.6,1,'l');ell(31,25,1.6,1,'l');
  // Shield with a gold paw crest.
  poly([[1.5,24],[12.5,24],[12.5,34],[7,41],[1.5,34]],'M');
  poly([[3,25.5],[11,25.5],[11,33.5],[7,39],[3,33.5]],'m');
  ell(7,32,2,1.7,'y');for(const [a,b] of [[4.5,28.5],[6.5,27.5],[8.5,28.5],[9.5,30]])put(a,b,'y');
  // Sword.
  rect(38,10,39,33,'l');rect(39,10,39,33,'m');put(38,9,'l');
  rect(34,34,43,35,'y');rect(34,35,43,35,'Y');rect(38,36,39,40,'S');put(38,41,'y');put(39,41,'y');
 }
 // 13. Outline pass: any empty pixel touching the sprite becomes outline.
 const out=g.map(r=>r.slice());
 for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){
  if(g[y][x])continue;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const v=g[y+dy]?.[x+dx];if(v&&v!=='o'){out[y][x]='o';break}}
 }
 // 14. Whiskers go on after the outline so they stay thin.
 for(const [x0,y0,x1,y1] of [[11,19,5,18],[11,21,5,22],[33,19,39,18],[33,21,39,22]]){
  const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
  for(let i=0;i<=n;i++){const x=Math.round(x0+(x1-x0)*i/n),y=Math.round(y0+(y1-y0)*i/n);if(!out[y][x])out[y][x]='W'}
 }
 return out;
}
function toCanvas(map,variant,flash=false){
 const cv=document.createElement('canvas');cv.width=GW;cv.height=GH;const c=cv.getContext('2d');
 const pal={...BASE,...POINTS[variant==='junior'||variant==='finale'?'blue':'seal']};
 for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const k=map[y][x];if(!k)continue;c.fillStyle=flash?(k==='o'?'#ffffff':'#fff6fd'):pal[k]||'#ff00ff';c.fillRect(x,y,1,1)}
 return cv;
}
const cache=new Map();
function frame(variant,tail,blink,angry,flash){
 const key=[variant,tail,blink,angry,flash].join('|');
 if(!cache.has(key))cache.set(key,toCanvas(build(variant,{tail,blink,angry}),variant,flash));
 return cache.get(key);
}
const hurt=new Map();
function draw(ctx,x,y,variant='king',opts={}){
 const t=Number.isFinite(opts.t)?opts.t:performance.now()/1000;
 const junior=variant==='junior'||variant==='finale';
 const scale=opts.scale||(junior?2.25:3);
 const now=performance.now();
 const state=hurt.get(variant)||{hp:opts.hp,until:0};
 if(Number.isFinite(opts.hp)&&Number.isFinite(state.hp)&&opts.hp<state.hp)state.until=now+130;
 state.hp=opts.hp;hurt.set(variant,state);
 const angry=Number.isFinite(opts.hp)&&Number.isFinite(opts.max)&&opts.max>0&&opts.hp/opts.max<.5;
 const tail=Math.floor(t*(angry?5:2.6))%4;
 const blink=!angry&&(t+(junior?1.3:0))%3.4<.13;
 const bob=Math.round(Math.sin(t*(junior?4.2:2.8))*(junior?2:1.5));
 const img=frame(variant,tail,blink,angry,now<state.until);
 const w=GW*scale,h=GH*scale,feet=junior?36:48;
 ctx.save();
 ctx.imageSmoothingEnabled=false;
 if(angry){
  ctx.globalAlpha=.28+.12*Math.sin(t*8);ctx.fillStyle='#ff6fd8';
  ctx.beginPath();ctx.ellipse(x,y+feet-h*.45,w*.46,h*.5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 }
 ctx.drawImage(img,Math.round(x-w/2),Math.round(y+feet-h+bob),w,h);
 ctx.restore();
}
function sheet(){
 const variants=['king','junior','armour','finale'],cols=6,cell=GW*3+12,rowH=GH*3+12;
 const cv=document.createElement('canvas');cv.width=cols*cell;cv.height=variants.length*rowH;
 const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
 variants.forEach((v,r)=>{
  [[0,false,false],[1,false,false],[2,false,false],[0,true,false],[1,false,true],[0,false,false,true]].forEach(([tl,bl,an,fl],i)=>{
   c.drawImage(frame(v,tl,bl,an,!!fl),i*cell+6,r*rowH+6,GW*3,GH*3);
  });
 });
 return cv;
}
window.catCityBirmanArt={draw,sheet,variants:['king','junior','armour','finale'],size:{w:GW,h:GH}};
})();

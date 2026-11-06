/* Cat City — playable cat pixel art (batch 1 of the art redraw).
 * One shared, parametric pixel-cat builder in the same style as birman-art.js.
 * Each cat is a "coat" (colours + markings), so the six playable cats stay
 * consistent and the future Create-Your-Own-Cat feature can reuse it.
 *
 * Poses (32×32 grid, feet on row 29, side views face right — flip for left):
 *   idle(2, front)  walk(4, side)  run(4, side)  jump(2, side)  attack(2, side)
 *   hurt(1, side)   interact(1, front)  sit(1, front)  sleep(2, side)
 *   walkBack(2, back)  walkFront(2, front)
 * Effects: slash, zzz, alert.
 *
 * API (window.catCityCatArt):
 *   frame(catId, pose, index) -> canvas (cached)
 *   draw(ctx, x, y, catId, pose, index, {scale, flip})  feet at (x, y)
 *   sheet() -> canvas with every cat and pose (review sheet)
 *   coats / poses
 */
(()=>{'use strict';
const G=32;
const OUT='#241a2c',OUT_DARK='#0f0b14';
// ---------------------------------------------------------------- coats
// base/stripe/light/shade: fur. white: which areas are white. Masks are
// defined per view in colorize().
const coats={
 astro:{name:'Astro',base:'#f0953c',stripe:'#c4631f',light:'#ffbf73',tabby:true,white:[],eye:'#e3a92f',nose:'#e98a8f',earIn:'#f4a9a6'},
 galaxy:{name:'Galaxy',base:'#ee8f3a',stripe:'#c15f1e',light:'#ffbb6c',tabby:true,white:['chest','belly','paws','muzzle'],eye:'#78c25a',nose:'#ef9aa3',earIn:'#f6b2b0'},
 baby:{name:'Baby',base:'#8b7f73',stripe:'#4d4239',light:'#b3a698',tabby:true,white:['chest','belly'],eye:'#a8cc66',nose:'#c98a86',earIn:'#d8a6a2',serious:true},
 harley:{name:'Harley',base:'#3b3443',stripe:'#2a2430',light:'#5a5068',white:['chest','belly','paws','muzzle','blaze'],eye:'#d1c46a',nose:'#f28fb1',earIn:'#d98aa6',dark:true},
 skylar:{name:'Skylar',base:'#fbf7f1',stripe:'#e3dbe5',light:'#ffffff',patch:'tux',white:[],eye:'#d4b85c',nose:'#221c28',earIn:'#2f2836'},
 pumpkin:{name:'Pumpkin',base:'#fbf6ee',stripe:'#e6ddd2',light:'#ffffff',patch:'calico',white:[],eye:'#93a84f',nose:'#e7939a',earIn:'#f1aeb0'},
 // NPCs (batch 2 starts here — front-view accessories for now).
 marmalade:{name:'Marmalade',base:'#e5a34b',stripe:'#b9752a',light:'#f7c57c',tabby:true,white:['chest','muzzle'],eye:'#7aa857',nose:'#e88f93',earIn:'#f2aaa8',acc:['apron']},
 pebble:{name:'Pebble',base:'#85858d',stripe:'#66666e',light:'#a4a4ac',white:['chest','muzzle'],eye:'#e0b84a',nose:'#c98a8e',earIn:'#d2a2a8',acc:['glasses']},
 luna:{name:'Luna',base:'#aaa1d7',stripe:'#8c83bf',light:'#c9c2ec',white:['chest','belly'],eye:'#f2d36b',nose:'#e99ab8',earIn:'#f0b7cf',acc:['witchhat']},
 biscuit:{name:'Biscuit',base:'#b88655',stripe:'#8a5f37',light:'#d5a776',tabby:true,white:['chest','paws'],eye:'#6f9f4d',nose:'#d88a82',earIn:'#e8a7a0',acc:['bandana']},
 forge:{name:'Forge',base:'#7d8895',stripe:'#5d6773',light:'#9eaab6',white:['chest','muzzle'],eye:'#f0a640',nose:'#c08488',earIn:'#cf9ea5',acc:['apron','goggles']},
 slaycat:{name:'SlayCat',base:'#999aa7',stripe:'#7a7b88',light:'#b9bac6',white:['chest','muzzle','paws'],eye:'#d87ae6',nose:'#f08fb8',earIn:'#f4adc9',acc:['prideflag','bow']},
 // Village neighbours.
 poppy:{name:'Poppy',base:'#f2c3a0',stripe:'#d99e78',light:'#ffdcc2',white:['chest','paws','muzzle'],eye:'#7aa857',nose:'#ef8fa3',earIn:'#f6b2b8',acc:['flowercrown']},
 clover:{name:'Clover',base:'#3b3443',stripe:'#2a2430',light:'#5a5068',white:['chest'],eye:'#8fd06a',nose:'#8d6a78',earIn:'#d98aa6',dark:true,acc:['leafscarf']},
 mochi:{name:'Mochi',base:'#fbf3e8',stripe:'#e8dccd',light:'#ffffff',white:[],eye:'#6fa8d8',nose:'#f2a0b4',earIn:'#f6bccb',acc:['bow']},
 toffee:{name:'Toffee',base:'#c8874a',stripe:'#9a5f2c',light:'#e3a96d',tabby:true,white:['muzzle'],eye:'#e0b84a',nose:'#d98a82',earIn:'#e8a7a0',acc:['scarf']},
 pip:{name:'Pip',base:'#a2a0a6',stripe:'#7d7b82',light:'#c2c0c6',tabby:true,white:['chest','paws'],eye:'#e3a92f',nose:'#d08f96',earIn:'#d9a4ab',acc:['goggles']},
 willow:{name:'Willow',base:'#b9b4a8',stripe:'#7f796d',light:'#d6d1c6',tabby:true,white:['chest','muzzle'],eye:'#7cc35a',nose:'#d6949a',earIn:'#e0aab0',acc:['leafcrown']},
 // Catnip Wranglers (villains).
 wrangler:{name:'Wrangler',base:'#73549d',stripe:'#563b7d',light:'#9277bb',white:['muzzle'],eye:'#f9df80',nose:'#3a2950',earIn:'#a88bcf',acc:['mask','lasso']}
};
const BLACK={base:'#3b3443',stripe:'#2a2430',light:'#5a5068'};
const GINGER={base:'#f0953c',stripe:'#c4631f',light:'#ffbf73'};
const DARKTAB={base:'#5f4b3c',stripe:'#33261d',light:'#7d6654'};
const WHITE={base:'#fbf7f1',shade:'#e4dce6'};
// ---------------------------------------------------------------- raster helpers
function mk(){const g=Array.from({length:G},()=>Array(G).fill(null));
 const put=(x,y,v,only)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=G||y>=G)return;if(only&&!only.includes(g[y][x]?.p))return;g[y][x]=typeof v==='string'?{p:v}:v};
 const ell=(cx,cy,rx,ry,v,only)=>{for(let y=0;y<G;y++)for(let x=0;x<G;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;if(dx*dx+dy*dy<=1)put(x,y,v,only)}};
 const rect=(x0,y0,x1,y1,v,only)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)put(x,y,v,only)};
 const poly=(pts,v,only)=>{for(let y=0;y<G;y++)for(let x=0;x<G;x++){let inside=false;const px=x+.5,py=y+.5;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,yi]=pts[i],[xj,yj]=pts[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)inside=!inside}if(inside)put(x,y,v,only)}};
 const line=(x0,y0,x1,y1,w,v,only)=>{const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)*2));for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;ell(x,y,w/2,w/2,v,only)}};
 const curve=(p0,p1,p2,r0,r1,v,ringed)=>{for(let i=0;i<=28;i++){const t=i/28,u=1-t;const x=u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0],y=u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1],r=r0+(r1-r0)*t;ell(x,y,r,r,{p:v,t})}};
 return {g,put,ell,rect,poly,line,curve};
}
// ---------------------------------------------------------------- poses
// Each pose returns {g, view:{type,bx,by,hx,hy,foot}} with parts labelled.
function side(f,kind){
 const d=mk();let bx=15,by=21,brx=8,bry=4.6,hx=24,hy=14.5,lift=0,foot=29;
 let legs=[],tailEnd=[3,9],tailMid=[3,17],eye='open',paw=null;
 if(kind==='walk'){const o=[-1,0,1,0][f];lift=f%2?-1:0;
  legs=[[20+o,23,foot,o],[22-o,23,foot,-o],[9-o,23,foot,-o],[11+o,23,foot,o]];tailEnd=[3+[0,1,0,-1][f],8];}
 else if(kind==='run'){brx=9.6;bry=4;by=19;hy=13;hx=25;lift=f%2?-1:0;
  const L=[[[[21,21],[26,26]],[[10,21],[4,26]]],[[[20,21],[23,28]],[[11,21],[8,28]]],[[[20,21],[18,28]],[[11,21],[14,28]]],[[[21,21],[24,27]],[[10,21],[6,27]]]][f];
  legs=[{line:L[0]},{line:[[L[0][0][0]+2,L[0][0][1]],[L[0][1][0]+1,L[0][1][1]]]},{line:L[1]},{line:[[L[1][0][0]+2,L[1][0][1]],[L[1][1][0]+1,L[1][1][1]]]}];
  tailEnd=[0,14+f%2];tailMid=[3,18];}
 else if(kind==='jump'){
  if(f===0){by=23;bry=4.2;hy=17;hx=24;legs=[[20,25,foot,1],[22,25,foot,1],[9,25,foot,-1],[11,25,foot,-1]];tailEnd=[2,15];tailMid=[3,21]}
  else{by=15;hy=9;hx=25;foot=22;legs=[{line:[[21,17],[27,21]]},{line:[[23,17],[28,20]]},{line:[[10,17],[4,22]]},{line:[[12,17],[6,22]]}];tailEnd=[1,6];tailMid=[3,13]}}
 else if(kind==='attack'){legs=[[22,23,foot,0],[9,23,foot,0],[11,23,foot,0]];
  paw=f===0?[[21,19],[28,11]]:[[21,20],[30,22]];tailEnd=[2,7];hx=24.5}
 else if(kind==='hurt'){bx=14;hx=22.5;hy=12;legs=[[19,22,foot,1],[21,22,foot,2],[8,22,foot,-2],[10,22,foot,-1]];eye='hurt';tailEnd=[1,13];tailMid=[2,19]}
 else{legs=[[20,23,foot,0],[22,23,foot,0],[9,23,foot,0],[11,23,foot,0]]}
 const B=by+lift,H=hy+lift;
 // tail (behind)
 d.curve([bx-brx+1.5,B-1],tailMid,tailEnd,1.6,1.3,'tail');
 // far legs first (darker via part 'legFar'), then body, then near legs
 const drawLeg=(L,far)=>{const part=far?'legFar':'leg';
  if(L.line){d.line(L.line[0][0],L.line[0][1]+lift,L.line[1][0],L.line[1][1]+lift,2.1,part);d.ell(L.line[1][0],L.line[1][1]+lift,1.4,1.1,'paw')}
  else{const [x,top,bot,o]=L;d.line(x,top+lift,x+o*.6,bot-1,2.1,part);d.rect(Math.round(x+o*.6)-1,bot-1,Math.round(x+o*.6)+1,bot,'paw')}};
 legs.forEach((L,i)=>{if(i%2===1)drawLeg(L,true)});
 d.ell(bx,B,brx,bry,'body');
 legs.forEach((L,i)=>{if(i%2===0)drawLeg(L,false)});
 if(paw){d.line(paw[0][0],paw[0][1],paw[1][0],paw[1][1],2.2,'leg');d.ell(paw[1][0],paw[1][1],1.5,1.3,'paw')}
 // head
 d.poly([[hx-4.6,hy-2.5+lift],[hx-3.2,hy-8+lift],[hx-.4,hy-4.2+lift]],'ear');
 d.poly([[hx+.2,hy-4+lift],[hx+2.6,hy-8.2+lift],[hx+4.3,hy-2.4+lift]],'ear');
 d.poly([[hx-3.6,hy-3.2+lift],[hx-3,hy-6.4+lift],[hx-1.4,hy-4.2+lift]],'earIn');
 d.ell(hx,H,6,5.4,'head');
 d.ell(hx+4.4,H+1.8,2,1.6,'muzzle');
 // face
 const ex=Math.round(hx+2),ey=Math.round(H-1);
 if(eye==='hurt'){d.put(ex-1,ey-1,'pupil');d.put(ex,ey,'pupil');d.put(ex-1,ey+1,'pupil')}
 else{d.rect(ex,ey,ex+1,ey+1,'eye');d.put(ex+1,ey,'pupil');d.put(ex+1,ey+1,'pupil');d.put(ex,ey,'shine')}
 d.put(Math.round(hx+6.2),Math.round(H+1),'nose');d.put(Math.round(hx+5),Math.round(H+3),'mouth');
 return {g:d.g,view:{type:'side',bx,by:B,hx,hy:H,brx,bry,foot}};
}
function front(f,kind){
 const d=mk();const bx=16,hx=16;let by=22,hy=13,lift=0;const foot=29;
 const sway=[0,1,2,1][f%4];
 if(kind==='sit'){
  d.curve([20,26],[26,29],[11,29.5],1.5,1.3,'tail');
  d.ell(10.5,26.5,3.6,2.8,'body');d.ell(21.5,26.5,3.6,2.8,'body');
  d.ell(bx,23,7,6.4,'body');
  d.rect(12,24,14,29,'leg');d.rect(18,24,20,29,'leg');d.rect(12,28,14,29,'paw');d.rect(18,28,20,29,'paw');
  by=23;
 }else if(kind==='back'){
  const o=f?1:-1;
  d.rect(11,24,13,foot,'legFar');d.rect(19,24,21,foot,'legFar');
  d.rect(11,foot-1,13,foot,'paw');d.rect(19,foot-1,21,foot,'paw');
  d.ell(bx,22,7,5.6,'body');
  d.curve([16,24],[20+o,17],[18+o*2,7],1.6,1.3,'tail');
  hy=12.5;
 }else{
  const o=kind==='walk'?(f?1:-1):0;lift=kind==='walk'&&f?-1:0;
  d.curve([21,25],[28,24],[27+sway,16],1.6,1.3,'tail');
  d.ell(bx,22+lift,7,5.4,'body');
  if(kind==='interact'){d.rect(12,24,14,foot,'leg');d.rect(12,foot-1,14,foot,'paw');d.line(20,21,25,13,2.3,'leg');d.ell(25.5,12.5,1.7,1.5,'paw')}
  else{d.line(13,24,13-o*.3,foot-1,2.4,'leg');d.line(19,24,19+o*.3,foot-1,2.4,'leg');
   d.rect(11,foot-1,14,foot,'paw');d.rect(18,foot-1,21,foot,'paw');if(o){d.rect(11,foot-1,14,foot,'paw')}}
  by=22+lift;hy=13+lift;
 }
 const H=hy;
 if(kind==='back'){
  d.poly([[9,H-2],[10,H-8.5],[14,H-4.5]],'ear');d.poly([[23,H-2],[22,H-8.5],[18,H-4.5]],'ear');
  d.ell(hx,H,7.4,6.1,'head');
  return {g:d.g,view:{type:'back',bx,by,hx,hy:H,foot}};
 }
 d.poly([[8.8,H-1.5],[10,H-8.6],[14.4,H-4.6]],'ear');d.poly([[23.2,H-1.5],[22,H-8.6],[17.6,H-4.6]],'ear');
 d.poly([[10.3,H-3],[10.8,H-6.6],[13.2,H-4.6]],'earIn');d.poly([[21.7,H-3],[21.2,H-6.6],[18.8,H-4.6]],'earIn');
 d.ell(hx,H,7.6,6.3,'head');
 d.ell(8.8,H+1.5,1.6,2.4,'head');d.ell(23.2,H+1.5,1.6,2.4,'head'); // cheek fluff
 d.ell(hx,H+2.7,3.4,2.3,'muzzle');
 const blink=kind==='idle'&&f===1;
 for(const ex of [11,18]){
  if(blink){d.rect(ex,H,ex+2,H,'pupil')}
  else{d.rect(ex,H-1,ex+2,H+1,'eye');d.rect(ex+1,H-1,ex+1,H+1,'pupil');d.put(ex,H-1,'shine')}
 }
 d.rect(15,H+2,16,H+2,'nose');d.put(14,H+3,'mouth');d.put(17,H+3,'mouth');
 return {g:d.g,view:{type:'front',bx,by,hx,hy:H,foot,blink}};
}
function sleep(f){
 const d=mk();const breathe=f?0.4:0;
 d.curve([6,26],[3,30],[19,29.6],1.6,1.4,'tail');
 d.ell(15,25-breathe,10,4.6+breathe,'body');
 d.ell(23.5,25,5.2,4.2,'head');
 d.poly([[19.5,23],[20.6,18.4],[23.6,21.6]],'ear');d.poly([[24,21.4],[26.6,18.2],[27.8,22.8]],'ear');
 d.poly([[20.6,22],[21,19.8],[22.6,21.4]],'earIn');
 d.ell(27.6,26.4,2,1.6,'muzzle');
 d.rect(24,25,25,25,'pupil');d.put(29,26,'nose');
 return {g:d.g,view:{type:'side',bx:15,by:25,hx:23.5,hy:25,brx:10,bry:4.6,foot:29}};
}
const POSES={
 idle:{n:2,make:f=>front(f,'idle')},
 walk:{n:4,make:f=>side(f,'walk')},
 run:{n:4,make:f=>side(f,'run')},
 jump:{n:2,make:f=>side(f,'jump')},
 attack:{n:2,make:f=>side(f,'attack')},
 hurt:{n:1,make:f=>side(f,'hurt')},
 interact:{n:1,make:f=>front(f,'interact')},
 sit:{n:1,make:f=>front(f,'sit')},
 sleep:{n:2,make:f=>sleep(f)},
 walkFront:{n:2,make:f=>front(f,'walk')},
 walkBack:{n:2,make:f=>front(f,'back')}
};
// ---------------------------------------------------------------- colouring
function regions(view,cell,x,y){
 const {p,t}=cell,v=view,r=new Set();
 const fur=['body','head','tail','leg','legFar','ear','muzzle','paw'];
 if(!fur.includes(p))return r;
 if(v.type==='side'){
  if(p==='body'&&y>v.by+1.2)r.add('belly');
  if((p==='body'||p==='head')&&x>v.hx-3.5&&y>v.hy+2.5)r.add('chest');
  if(p==='body'&&x>v.bx+v.brx-4&&y>v.by-1)r.add('chest');
  if(p==='muzzle')r.add('muzzle');
  if(p==='paw')r.add('paws');
  if(p==='head'&&y<v.hy-1.5)r.add('cap');
  if(p==='ear')r.add('cap');
  if(p==='body'&&y<v.by-.6)r.add('saddle');
  if(p==='tail')r.add('tailpart');
  if(x<v.bx)r.add('rear');else r.add('fore');
 }else if(v.type==='front'){
  if(p==='body'&&Math.abs(x+.5-v.bx)<3.6&&y>v.by-4)r.add('chest'),r.add('belly');
  if(p==='head'&&y>v.hy+2.5&&Math.abs(x+.5-v.hx)<4)r.add('chest');
  if(p==='muzzle')r.add('muzzle');
  if(p==='paw')r.add('paws');
  if((p==='head'&&y<v.hy-1.5)||p==='ear')r.add('cap');
  if(p==='head'&&Math.abs(x+.5-v.hx)<1.3&&y<v.hy+2&&y>v.hy-6)r.add('blaze');
  if(p==='body'&&Math.abs(x+.5-v.bx)>=3.6&&y<v.by-1)r.add('saddle');
  if(p==='tail')r.add('tailpart');
  if(x+.5<v.bx)r.add('rear');else r.add('fore');
  if(p==='head'&&x<v.hx-1&&y<v.hy+1&&y>v.hy-3)r.add('lefteye');
 }else{
  if(p==='head'||p==='ear')r.add('cap');
  if(p==='body')r.add('saddle');
  if(p==='tail')r.add('tailpart');
  if(p==='paw')r.add('paws');
  if(x+.5<v.bx)r.add('rear');else r.add('fore');
 }
 return r;
}
function furColour(coat,view,cell,x,y){
 const reg=regions(view,cell,x,y);
 let fur=coat;
 if(coat.patch==='tux'){ // Skylar: white with black cap, ears, saddle, tail and an eye patch
  const saddle=reg.has('saddle')&&Math.abs(x+.5-view.bx)<4.5&&(view.type!=='back'||y<view.by);
  if(reg.has('cap')||saddle||reg.has('tailpart')||reg.has('lefteye'))fur=BLACK;
  if(reg.has('muzzle'))fur=coat;
 }else if(coat.patch==='calico'){ // Pumpkin: white base, ginger + dark tabby patches
  if(reg.has('cap')||reg.has('saddle')||reg.has('tailpart')){fur=reg.has('rear')?GINGER:DARKTAB;}
  if(view.type==='side'&&cell.p==='head'&&x>view.hx+1&&y<view.hy+1)fur=DARKTAB;
  if(reg.has('belly')||reg.has('chest')||reg.has('muzzle')||reg.has('paws'))fur=coat;
 }
 const white=coat.white.some(k=>reg.has(k));
 if(white)fur=WHITE;
 const tabby=(coat.tabby&&fur===coat)||(fur===DARKTAB||fur===GINGER);
 let col=fur.base;
 if(tabby){
  const p=cell.p;
  if(p==='tail'&&Math.floor((cell.t||0)*7)%2)col=fur.stripe;
  if((p==='body')&&(view.type==='side'?y<view.by+.5&&((x+Math.floor(y/2))%4===0):(Math.abs(x+.5-view.bx)>=3&&(y%3===0))))col=fur.stripe;
  if(p==='head'&&view.type!=='side'&&y<=view.hy-3&&[view.hx-2,view.hx,view.hx+1,view.hx+3].map(Math.floor).includes(x)&&y>=view.hy-5)col=fur.stripe;
  if(p==='head'&&view.type==='side'&&y<=view.hy-2&&(x%2===0))col=fur.stripe;
  if((p==='leg'||p==='legFar')&&y%3===0)col=fur.stripe;
 }
 if(cell.p==='legFar'||(cell.p==='body'&&view.type==='side'&&y>view.by+2.5&&!white))col=shade(col,fur===WHITE?.92:.84);
 if(fur===WHITE&&(cell.p==='legFar'||(cell.p==='body'&&y>view.by+3)))col=WHITE.shade;
 if((cell.p==='head'||cell.p==='body')&&!white&&fur.light&&highlight(view,cell,x,y))col=fur.light;
 return col;
}
function highlight(v,cell,x,y){
 if(cell.p==='head')return v.type==='side'?(x<v.hx-2&&y<v.hy-2&&y>v.hy-4):(y===Math.round(v.hy-4)&&x>v.hx-5&&x<v.hx-2);
 return v.type==='side'&&cell.p==='body'&&y===Math.round(v.by-v.bry+1)&&x>v.bx-4&&x<v.bx+3;
}
function shade(hex,k){const n=parseInt(hex.slice(1),16);const r=Math.round((n>>16&255)*k),g=Math.round((n>>8&255)*k),b=Math.round((n&255)*k);return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}
function colour(coat,view,cell,x,y){
 switch(cell.p){
  case 'eye':return coat.eye;
  case 'pupil':return '#15121c';
  case 'shine':return '#ffffff';
  case 'nose':return coat.nose;
  case 'mouth':return coat.dark?'#e6dcec':'#4a3646';
  case 'earIn':{const fur=furColour(coat,view,{p:'ear'},x,y);return fur===BLACK.base?'#d98aa6':coat.earIn}
  default:return furColour(coat,view,cell,x,y);
 }
}
// ---------------------------------------------------------------- render + cache
function render(catId,pose,index,gear){
 const coat=coats[catId]||coats.astro,P=POSES[pose]||POSES.idle;
 const {g,view}=P.make(index%P.n);
 const art=window.catCityItemArt;
 const boots=gear?.paws&&art?art.palette(gear.paws):null;
 // Serious Baby: flatten the top row of the eyes into a brow.
 if(coat.serious){for(let y=0;y<G;y++)for(let x=0;x<G;x++){const c=g[y][x];if(c&&(c.p==='eye'||c.p==='shine')&&g[y-1]?.[x]?.p!=='eye'&&g[y+1]?.[x]?.p==='eye'||(c&&c.p==='eye'&&g[y-1]?.[x]?.p==='head'&&g[y+1]?.[x]?.p==='eye'))g[y][x]={p:'head'}}}
 const cv=document.createElement('canvas');cv.width=G;cv.height=G;const c=cv.getContext('2d');
 const outline=coat.dark?OUT_DARK:OUT;
 for(let y=0;y<G;y++)for(let x=0;x<G;x++){
  const cell=g[y][x];
  if(cell){c.fillStyle=boots&&cell.p==='paw'?(g[y+1]?.[x]?.p==='paw'?boots.a:boots.c):colour(coat,view,cell,x,y);c.fillRect(x,y,1,1);continue}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){if(g[y+dy]?.[x+dx]){c.fillStyle=outline;c.fillRect(x,y,1,1);break}}
 }
 if(coat.acc)paintAccessories(c,coat.acc,view);
 if(gear&&art&&pose!=='sleep')paintGear(c,gear,view,art);
 // whiskers on front-facing poses
 if(view.type==='front'&&!['back'].includes(view.type)){
  c.fillStyle=coat.dark?'#cfc6da':'#ffffffcc';
  for(const [x0,y0,x1] of [[7,view.hy+2,4],[7,view.hy+3,4],[24,view.hy+2,27],[24,view.hy+3,27]]){const s=Math.sign(x1-x0);for(let x=x0;x!==x1+s;x+=s)if(!g[y0]?.[x])c.fillRect(x,y0+(Math.abs(x-x0)>1?(y0===view.hy+3?1:-0):0),1,1)}
 }
 cv.view=view;cv.hand=handFor(view,pose,index%P.n);
 return cv;
}
function handFor(v,pose,f){
 if(v.type==='side'){if(pose==='attack')return f===0?{x:28,y:11,a:-1.9}:{x:30,y:22,a:.5};return {x:Math.round(v.bx+v.brx-1),y:Math.round(v.by+3),a:-.9}}
 if(v.type==='front')return pose==='interact'?{x:25,y:12,a:-.4}:{x:22,y:25,a:-.5};
 return {x:9,y:24,a:-2.4,behind:true};
}
function paintGear(c,gear,v,art){
 const px=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
 const hx=Math.round(v.hx),hy=Math.round(v.hy),bx=Math.round(v.bx),by=Math.round(v.by),T=v.type;
 if(gear.body){const p=art.palette(gear.body),k=art.kind(gear.body);
  if(T==='front'){px(hx-5,by-4,11,k==='robe'?9:7,p.a);px(hx-5,by-4,11,1,p.b);px(hx,by-3,1,k==='robe'?8:6,p.c);px(hx-6,by-4,2,3,p.a);px(hx+5,by-4,2,3,p.a)}
  else if(T==='side'){px(bx-4,by-4,11,5,p.a);px(bx-4,by-4,11,1,p.b);px(bx+2,by-3,1,4,p.c)}
  else{px(bx-6,by-4,13,6,p.a);px(bx-6,by-4,13,1,p.b)}}
 if(gear.head){const p=art.palette(gear.head),k=art.kind(gear.head);
  const w=T==='side'?12:16,x0=T==='side'?hx-6:hx-8;
  if(k==='crown'){px(x0+2,hy-7,w-4,3,p.a);for(let i=0;i<3;i++)px(x0+2+i*Math.floor((w-6)/2),hy-9,2,2,p.a);px(x0+3,hy-6,1,1,'#e8506a');px(x0+w-4,hy-6,1,1,'#e8506a')}
  else if(k==='mask'){if(T!=='back'){px(T==='side'?hx-3:hx-8,hy-2,T==='side'?9:17,3,p.a);if(T==='front'){px(11,hy-1,3,1,'#241a2c');px(18,hy-1,3,1,'#241a2c')}else px(hx+2,hy-1,2,1,'#241a2c')}}
  else if(k==='hood'){px(x0,hy-7,w,5,p.a);px(x0,hy-7,w,1,p.b);px(x0-1,hy-3,2,6,p.a);if(T!=='side')px(x0+w-1,hy-3,2,6,p.a);else px(x0-2,hy-2,2,6,p.a)}
  else{px(x0,hy-7,w,4,p.a);px(x0+1,hy-8,w-2,1,p.a);px(x0+2,hy-7,4,1,p.b);px(x0-1,hy-3,w+2,1,p.c)}}
}
function paintAccessories(c,acc,v){
 const px=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
 const hx=Math.round(v.hx),hy=Math.round(v.hy),bx=Math.round(v.bx),by=Math.round(v.by),T=v.type;
 const flowers=['#ff6fae','#f6dc4a','#ffffff','#c9a6ef'];
 for(const a of acc){
  if(a==='apron'){
   if(T==='front'){px(hx-4,by-3,9,8,'#f4efe6');px(hx-4,by-3,9,1,'#c9b8a4');px(hx-1,by,3,2,'#d6c7b4')}
   else if(T==='side'){px(bx+2,by-2,6,6,'#f4efe6');px(bx+2,by-2,6,1,'#c9b8a4');px(bx-2,by-3,4,1,'#c9b8a4')}
   else{px(bx-5,by-2,11,1,'#c9b8a4');px(bx-1,by-1,3,2,'#f4efe6')}}
  if(a==='glasses'){
   if(T==='front'){for(const ex of [hx-6,hx+1]){px(ex,hy-2,5,1,'#2b2433');px(ex,hy+2,5,1,'#2b2433');px(ex,hy-2,1,5,'#2b2433');px(ex+4,hy-2,1,5,'#2b2433')}px(hx-1,hy-1,2,1,'#2b2433')}
   else if(T==='side'){px(hx+1,hy-3,4,1,'#2b2433');px(hx+1,hy+1,4,1,'#2b2433');px(hx+4,hy-3,1,5,'#2b2433');px(hx-3,hy-2,4,1,'#2b2433')}}
  if(a==='goggles'){
   if(T==='front'){px(hx-7,hy-6,15,2,'#5b4436');px(hx-5,hy-7,4,4,'#9fd6e8');px(hx+2,hy-7,4,4,'#9fd6e8');px(hx-5,hy-7,4,1,'#ffffff')}
   else if(T==='side'){px(hx-5,hy-5,10,2,'#5b4436');px(hx+2,hy-6,4,4,'#9fd6e8');px(hx+2,hy-6,4,1,'#ffffff')}
   else px(hx-7,hy-4,15,2,'#5b4436')}
  if(a==='witchhat'){
   if(T==='side'){px(hx-7,hy-6,14,2,'#3d2a5e');px(hx-4,hy-8,9,2,'#4b3474');px(hx-4,hy-10,6,2,'#4b3474');px(hx-6,hy-12,4,2,'#4b3474');px(hx-4,hy-7,9,1,'#f2d36b')}
   else{px(hx-8,hy-6,17,2,'#3d2a5e');px(hx-5,hy-8,11,2,'#4b3474');px(hx-3,hy-10,7,2,'#4b3474');px(hx-1,hy-12,4,2,'#4b3474');px(hx+2,hy-13,3,1,'#4b3474');px(hx-5,hy-7,11,1,'#f2d36b');if(T==='front')px(hx,hy-10,2,2,'#f2d36b')}}
  if(a==='bandana'||a==='scarf'||a==='leafscarf'){
   const col=a==='bandana'?'#d9414f':a==='scarf'?'#4f7fd0':'#4fbf5c',hi=a==='bandana'?'#ffd2d2':a==='scarf'?'#a9c8ff':'#a6eaa8';
   if(T==='front'){px(hx-6,hy+4,13,2,col);px(hx-2,hy+6,5,2,col);px(hx,hy+8,1,1,col);px(hx-4,hy+4,2,1,hi);if(a==='scarf'){px(hx+3,hy+6,3,5,col);px(hx+3,hy+10,3,1,hi)}if(a==='leafscarf')px(hx-1,hy+6,3,2,'#ffffff')}
   else if(T==='side'){px(hx-4,hy+4,7,2,col);px(hx-5,hy+6,3,2,col);px(hx-3,hy+4,2,1,hi);if(a==='scarf')px(hx-7,hy+5,3,5,col)}
   else{px(hx-6,hy+4,13,2,col);if(a==='scarf')px(hx+2,hy+6,3,5,col)}}
  if(a==='bow'){
   if(T==='side'){px(hx-1,hy-8,3,3,'#ff6fae');px(hx+3,hy-8,3,3,'#ff6fae');px(hx+2,hy-7,1,1,'#c73d7f')}
   else{px(hx+3,hy-7,3,3,'#ff6fae');px(hx+7,hy-7,3,3,'#ff6fae');px(hx+6,hy-6,1,1,'#c73d7f')}}
  if(a==='flowercrown'||a==='leafcrown'){
   const w=T==='side'?9:13,x0=T==='side'?hx-5:hx-6;
   for(let i=0;i<w;i+=2){px(x0+i,hy-6,2,2,a==='leafcrown'?(i%4?'#5fae6a':'#8fd06a'):flowers[(i/2)%4]);if(a==='flowercrown')px(x0+i+1,hy-5,1,1,'#5fae6a')}}
  if(a==='mask'){
   if(T==='front'){px(hx-8,hy-2,17,3,'#2b2433');for(const ex of [11,18])px(ex,hy-1,3,1,'#f9df80')}
   else if(T==='side'){px(hx-4,hy-2,10,3,'#2b2433');px(hx+2,hy-1,2,1,'#f9df80');px(hx-6,hy-1,3,3,'#2b2433')}
   else px(hx-8,hy-1,17,2,'#2b2433')}
  if(a==='lasso'){
   if(T==='front'){for(let k=0;k<12;k++){const ang=k/12*6.28;px(25+Math.cos(ang)*3,22+Math.sin(ang)*3,1,1,'#d9b98a')}px(24,25,1,4,'#d9b98a')}
   else if(T==='side'){for(let k=0;k<12;k++){const ang=k/12*6.28;px(bx-3+Math.cos(ang)*3,by-1+Math.sin(ang)*2,1,1,'#d9b98a')}}}
  if(a==='prideflag'){
   const st=['#e8414f','#f39a3a','#f6dc4a','#4fbf5c','#3f7fe0','#8a4fc9'];
   if(T==='front'){px(26,7,1,21,'#6b4b2f');st.forEach((col,i)=>px(27,7+i*2,5,2,col))}
   else if(T==='side'){const x=bx-3,y=by-17;px(x,y,1,15,'#6b4b2f');st.forEach((col,i)=>px(x-5,y+i*2,5,2,col))}
   else{px(bx+6,by-17,1,15,'#6b4b2f');st.forEach((col,i)=>px(bx+7,by-17+i*2,5,2,col))}}
 }
}
const cache=new Map();
function frame(catId,pose,index=0,gear){const gk=gear?[gear.head?.name,gear.body?.name,gear.paws?.name].join(','):'';const key=catId+'|'+pose+'|'+index+'|'+gk;if(!cache.has(key)){if(cache.size>600)cache.clear();cache.set(key,render(catId,pose,index,gear))}return cache.get(key)}
function draw(ctx,x,y,catId,pose='idle',index=0,opts={}){
 const s=opts.scale||1.25,img=frame(catId,pose,index,opts.gear);
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));
 if(opts.flip)ctx.scale(-1,1);
 const ox=Math.round(-G*s/2),oy=Math.round(-29.5*s);
 const weapon=opts.weapon&&window.catCityItemArt&&pose!=='sleep'?window.catCityItemArt.icon(opts.weapon):null,h=img.hand;
 const drawWeapon=()=>{ctx.save();ctx.translate(ox+h.x*s,oy+h.y*s);ctx.rotate(h.a+.78);ctx.drawImage(weapon,-3*s,-13*s,16*s,16*s);ctx.restore()};
 if(weapon&&h&&h.behind)drawWeapon();
 ctx.drawImage(img,ox,oy,G*s,G*s);
 if(weapon&&h&&!h.behind)drawWeapon();
 ctx.restore();
 // Where things sit on screen, for overlays such as Looks hats.
 const v=img.view||{},mx=X=>x+(opts.flip?-1:1)*(ox+X*s);
 return {head:{x:mx(v.hx||16),y:y+oy+((v.hy||13)-7)*s},neck:{x:mx(v.hx||16),y:y+oy+((v.hy||13)+5)*s},chest:{x:mx((v.bx||16)+3),y:y+oy+((v.by||22)-1)*s},scale:s};
}
// ---------------------------------------------------------------- effects
function effect(kind,f=0){
 const d=mk();
 if(kind==='slash'){for(let a=-1.1;a<=1.1;a+=.05){const r=10+f;d.put(14+Math.cos(a)*r,16+Math.sin(a)*r,'s1');d.put(14+Math.cos(a)*(r-1),16+Math.sin(a)*(r-1),Math.abs(a)<.7?'s2':'s1')}}
 if(kind==='zzz'){for(const [x,y,s] of [[8,22,4],[15,14,5],[23,5,6]]){d.rect(x,y,x+s,y,'z');d.line(x+s,y,x,y+s,1,'z');d.rect(x,y+s,x+s,y+s,'z')}}
 if(kind==='alert'){d.ell(16,12,7,8,'b');d.poly([[13,18],[16,24],[18,18]],'b');d.rect(15,7,16,13,'r');d.rect(15,15,16,16,'r')}
 const cols={s1:'#ffffff',s2:'#c8f1ff',z:'#e9dcff',b:'#ffffff',r:'#e8506a'};
 const cv=document.createElement('canvas');cv.width=G;cv.height=G;const c=cv.getContext('2d');
 for(let y=0;y<G;y++)for(let x=0;x<G;x++){const cell=d.g[y][x];if(cell){c.fillStyle=cols[cell.p];c.fillRect(x,y,1,1)}else if(kind!=='slash'){for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(d.g[y+dy]?.[x+dx]){c.fillStyle=OUT;c.fillRect(x,y,1,1);break}}}
 return cv;
}
// ---------------------------------------------------------------- review sheet
function sheet(scale=3,only){
 const order=['idle','walk','run','jump','attack','hurt','interact','sit','sleep','walkFront','walkBack'];
 const cols=order.reduce((n,p)=>n+POSES[p].n,0);
 const cell=G*scale,ids=only||Object.keys(coats);
 const cv=document.createElement('canvas');cv.width=cols*cell+cell;cv.height=ids.length*cell+cell*0.5;
 const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
 c.font='bold '+Math.round(scale*4)+'px system-ui';c.fillStyle='#fff';c.textAlign='center';
 let col=1;for(const p of order){c.fillText(p,(col+POSES[p].n/2)*cell,scale*10);col+=POSES[p].n}
 ids.forEach((id,r)=>{
  const y=r*cell+cell*.5;c.textAlign='left';c.fillStyle='#fff';c.fillText(coats[id].name,4,y+cell/2);
  let i=1;for(const p of order){for(let f=0;f<POSES[p].n;f++){c.drawImage(frame(id,p,f),i*cell,y,cell,cell);
   if(p==='attack')c.drawImage(effect('slash',f),i*cell+cell*.45,y-cell*.1,cell,cell);
   if(p==='sleep')c.drawImage(effect('zzz'),i*cell+cell*.55,y-cell*.15,cell*.5,cell*.5);
   if(p==='interact')c.drawImage(effect('alert'),i*cell+cell*.05,y-cell*.25,cell*.5,cell*.5);
   i++}}
 });
 return cv;
}
window.catCityCatArt={frame,draw,effect,sheet,coats,poses:Object.fromEntries(Object.entries(POSES).map(([k,v])=>[k,v.n])),ids:['astro','galaxy','baby','harley','skylar','pumpkin'],npcIds:['marmalade','pebble','luna','biscuit','forge','slaycat','poppy','clover','mochi','toffee','pip','willow','wrangler']};
})();

/* Cat City — trees, growth stages, saplings and materials (art wave 4).
 *
 * Trees: oak, cherry blossom, willow, pine, autumn, magic crystal; each with
 *   sprout → young → mature stages plus a stump. Same pixel style as the
 *   Birmans and cats (shapes + automatic outline), drawn at 2.4× in the world.
 *   Replaces window.catCityTreeAsset.draw (same signature) so every choppable
 *   tree and AI-worker tree uses the new art: wild → oak, cherry → cherry,
 *   marsh → willow, town → oak.
 * Regrowth: a chopped tree used to vanish for 8 minutes. Now a sprout appears
 *   where it stood and grows into a young tree before the mature tree returns.
 * Materials: 16×16 icons for logs and planks per wood, saplings, stone, ores,
 *   gems, plants and crafting bits. The Materials / Crafting lists swap their
 *   emoji for these icons.
 *
 * API: window.catCityNatureArt.tree(species, stage) -> canvas
 *      window.catCityNatureArt.drawTree(ctx, x, y, species, stage, opts)
 *      window.catCityNatureArt.material(key) -> 16×16 canvas
 *      window.catCityNatureArt.sheet() -> review sheet
 */
(()=>{'use strict';
const OUT='#22192b';
function grid(w,h){return Array.from({length:h},()=>Array(w).fill(null))}
function painter(g){
 const H=g.length,W=g[0].length;
 const put=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H)g[y][x]=c};
 const rect=(x,y,w,h,c)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)put(i,j,c)};
 const ell=(cx,cy,rx,ry,c,only)=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;if(dx*dx+dy*dy<=1&&(!only||only.includes(g[y][x])))g[y][x]=c}};
 const poly=(pts,c)=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++){let inside=false;const px=x+.5,py=y+.5;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,yi]=pts[i],[xj,yj]=pts[j];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)inside=!inside}if(inside)g[y][x]=c}};
 return {put,rect,ell,poly,W,H};
}
function toCanvas(g){
 const H=g.length,W=g[0].length,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 for(let y=0;y<H;y++)for(let i=0;i<W;i++){const v=g[y][i];if(v){x.fillStyle=v;x.fillRect(i,y,1,1)}else if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>g[y+dy]?.[i+dx])){x.fillStyle=OUT;x.fillRect(i,y,1,1)}}
 return c;
}
function hash(i){const v=Math.sin(i*91.7+13.1)*43758.5;return v-Math.floor(v)}
// ------------------------------------------------------------------ trees
const SPECIES={
 oak:{leaf:'#5c9e58',light:'#8fcf74',shade:'#3a7348',bark:'#7e5638',barkL:'#b0804f',fruit:'#e0704a'},
 cherry:{leaf:'#f2a3c4',light:'#ffd3e4',shade:'#c86f99',bark:'#7c5668',barkL:'#a9839a',fruit:'#ffffff'},
 willow:{leaf:'#7cb36a',light:'#b9dc9a',shade:'#4d8a5e',bark:'#6f5d45',barkL:'#a89470'},
 pine:{leaf:'#3f8a62',light:'#6fbf8a',shade:'#2a6448',bark:'#6b4a33',barkL:'#966a48'},
 autumn:{leaf:'#e88a3a',light:'#ffc45c',shade:'#b8562a',bark:'#7e5638',barkL:'#b0804f',fruit:'#d9414f'},
 magic:{leaf:'#9a7ce0',light:'#d6c4ff',shade:'#6a4fb0',bark:'#5b4377',barkL:'#8a6fb0',fruit:'#8ff0ff'}
};
const AREA={wild:'oak',town:'oak',cherry:'cherry',marsh:'willow',pine:'pine',autumn:'autumn',magic:'magic'};
const TW=40,TH=56,BASE=54;
function buildTree(sp,stage){
 const g=grid(TW,TH),d=painter(g),p=SPECIES[sp]||SPECIES.oak,cx=20;
 if(stage==='stump'){d.rect(14,46,12,8,p.bark);d.rect(15,47,10,6,p.barkL);d.ell(20,46,6,2.2,'#d9b48a');d.ell(20,46,3.5,1.2,'#b8905f');d.put(20,46,'#8a6440');d.rect(11,52,4,2,p.bark);d.rect(25,52,4,2,p.bark);return g}
 if(stage==='sprout'){
  d.ell(20,53,7,2.2,'#7a5a3e');d.rect(19,45,2,8,'#5fa85a');
  if(sp==='pine'){d.poly([[15,47],[20,39],[25,47]],p.leaf);d.poly([[16,43],[20,37],[24,43]],p.light)}
  else{d.ell(15.5,45,4,2.4,p.leaf);d.ell(24.5,43,4,2.4,p.leaf);d.ell(15,44.5,2,1,p.light);d.ell(24,42.5,2,1,p.light);
   if(sp==='cherry')d.ell(20,43,1.8,1.8,'#ffd3e4');if(sp==='magic')d.ell(20,42,1.6,1.6,'#8ff0ff')}
  return g;
 }
 const young=stage==='young',s=young?.6:1;
 // trunk
 const top=young?36:26;d.rect(cx-(young?1:2),top,young?3:5,BASE-top,p.bark);d.rect(cx-(young?1:1),top+2,1,BASE-top-3,p.barkL);
 if(!young){d.rect(cx-5,BASE-3,3,3,p.bark);d.rect(cx+3,BASE-3,3,3,p.bark);d.rect(cx+3,34,5,2,p.bark);d.rect(cx-7,38,5,2,p.bark)}
 if(sp==='pine'){
  const tiers=young?[[30,8],[24,6],[19,4]]:[[40,15],[31,12],[22,9],[14,6]];
  for(const [y,r] of tiers){d.poly([[cx-r,y+6],[cx,y-6],[cx+r,y+6]],p.leaf);d.poly([[cx-r+2,y+5],[cx-1,y-4],[cx,y+5]],p.light);d.rect(cx+1,y+4,r-1,2,p.shade)}
  return g;
 }
 const blobs=young?[[20,30,8,6.5],[15,33,5,4],[25,32,5,4]]:[[20,16,11,9],[11,22,8,7],[29,21,8,7],[14,29,8,6],[26,29,8,6],[20,25,10,8]];
 for(const [x,y,rx,ry] of blobs)d.ell(x+1.5,y+1.5,rx,ry,p.shade);
 for(const [x,y,rx,ry] of blobs)d.ell(x,y,rx,ry,p.leaf);
 for(const [x,y,rx,ry] of blobs)d.ell(x-rx*.35,y-ry*.4,rx*.45,ry*.35,p.light,[p.leaf]);
 if(sp==='willow'){for(let i=0;i<10;i++){const x=6+i*3+(i%2),len=(young?6:12)+Math.floor(hash(i)*6);d.rect(x,young?33:27,1,len,i%3?p.leaf:p.light)}}
 if(p.fruit&&!young){for(let i=0;i<7;i++){const x=8+hash(i+3)*24,y=10+hash(i+9)*22;if(g[Math.round(y)]?.[Math.round(x)]===p.leaf||g[Math.round(y)]?.[Math.round(x)]===p.shade){d.rect(x,y,2,2,p.fruit)}}}
 if(sp==='magic'&&!young){for(const [x,y] of [[12,14],[27,12],[20,22],[9,27],[30,26]]){d.rect(x,y,2,3,'#8ff0ff');d.put(x,y,'#ffffff')}}
 return g;
}
const treeCache=new Map();
function tree(species,stage='mature'){const k=species+'|'+stage;if(!treeCache.has(k))treeCache.set(k,toCanvas(buildTree(species,stage)));return treeCache.get(k)}
const SCALE=2.4;
function drawTree(ctx,x,y,species='oak',stage='mature',o={}){
 const img=tree(species,stage),s=o.scale||SCALE;
 const shake=o.shake||0;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));
 ctx.fillStyle='#2a3b3655';ctx.beginPath();ctx.ellipse(0,-1,stage==='mature'?30:stage==='young'?18:9,stage==='mature'?6:4,0,0,7);ctx.fill();
 ctx.drawImage(img,Math.round(-20*s+shake),Math.round(-BASE*s),TW*s,TH*s);
 ctx.restore();
}
// Replace the old tree asset, keeping its signature for every caller.
const old=window.catCityTreeAsset;
const oldPalette=old?.palette||(()=>({bark:'#7e5638',barkLight:'#b0804f'}));
function compatDraw(ctx,x,y,area='wild',progress=0,mode='standing',time=Date.now()){
 if(!ctx||!ctx.drawImage)return;
 const sp=AREA[area]||'oak',p=SPECIES[sp];
 if(mode==='felled'){drawTree(ctx,x,y,sp,'stump');return}
 const shake=progress>0?Math.sin(time*.055)*Math.min(5,progress*2.3):0;
 drawTree(ctx,x,y,sp,'mature',{shake});
 if(progress>0){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.fillStyle='#fff6d5';ctx.fillRect(-9,-34,18,3);ctx.fillStyle=p.barkL;ctx.fillRect(-25,-13-progress*4,6,5);ctx.fillRect(18,-23+progress*3,5,5);ctx.fillRect(-19,-35,4,6);ctx.restore()}
}
window.catCityTreeAsset={draw:compatDraw,palette:area=>{const p=SPECIES[AREA[area]||'oak'];return {...oldPalette(area),leaf:p.leaf,light:p.light,shade:p.shade,bark:p.bark,barkLight:p.barkL}},pixelArt:area=>tree(AREA[area]||'oak','mature'),exists:true,pixel:true};

// ------------------------------------------------------------------ regrowth stages
const core=window.__catCityEngine;
if(core){
 const s=core.state,T=core.T,CHUNK=T*24,GROW=8*60*1000;
 const h=(a,b,k=0)=>{const n=Math.sin(a*127.1+b*311.7+k*53.17)*43758.5453;return n-Math.floor(n)};
 const biome=(cx,cy)=>{if(cx<0&&cy>=-1&&cy<=1)return 'wild';const v=h(cx,cy);return v<.17?'cherry':v>.82?'poison':v<.32?'marsh':v>.66?'moonstone':'wild'};
 const oldDraw=core.draw;
 core.draw=function(){
  oldDraw();
  const b=document.body.classList;
  if(core.bossMode||b.contains('start-menu-open')||b.contains('taghouse-inside')||b.contains('catcity-in-cave')||window.catCityCaveState?.().inside)return;
  const r=s.resourceRespawns;if(!r)return;
  const ctx=core.ctx,W=core.W,H=core.H,camX=s.x-W/2,camY=s.y-H/2,now=Date.now();
  for(const id in r){
   const m=/^mine:(-?\d+):(-?\d+)$/.exec(id);if(!m)continue;const xx=+m[1],yy=+m[2],area=biome(xx,yy);
   if(!['wild','cherry','marsh'].includes(area))continue;
   const left=r[id]-now;if(left<=0)continue;
   const x=xx*CHUNK+(6+h(xx,yy,57)*12)*T-camX,y=yy*CHUNK+(6+h(xx,yy,63)*12)*T-camY;
   if(x<-80||x>W+80||y<-40||y>H+160)continue;
   const grown=1-left/GROW;
   drawTree(ctx,x,y+16,AREA[area],grown<.5?'sprout':'young');
  }
 };
}

// ------------------------------------------------------------------ materials
const M=16;
const WOODS={oak:['#8a5d3b','#c99a6a','#e8c99a'],cherry:['#7c5668','#d9a8bf','#f4d6e4'],willow:['#6f5d45','#b8a682','#e0d4b4'],pine:['#6b4a33','#b88a5c','#e3c08f'],autumn:['#7e5638','#d39a5c','#f0c890'],magic:['#5b4377','#a98bd6','#e0d0ff'],birch:['#d8d2c4','#efe9dc','#f8f4ea']};
const GEMS={amethyst:['#b47cf0','#e8d4ff','#7144b8'],crystal:['#9fdfff','#effbff','#4f9fd6'],diamond:['#8fe9ff','#ffffff','#3fb2d6'],emerald:['#3fcf7f','#b8ffd6','#1f8a50'],ruby:['#e8506a','#ffc0cc','#a8304a']};
const ORES={iron:'#d8b8a0',copper:'#e8884a',silver:'#e6ecf4',gold:'#ffd45c',coal:'#2a2430'};
function buildMaterial(key){
 const g=grid(M,M),d=painter(g);
 const [kind,sub]=key.split(':');
 if(kind==='log'){const [bark,end,ring]=WOODS[sub]||WOODS.oak;d.rect(2,5,10,7,bark);d.rect(2,5,10,1,shade(bark,1.25));for(let x=3;x<11;x+=3)d.rect(x,7,1,3,shade(bark,.8));d.ell(12.5,8.5,3,3.6,end);d.ell(12.5,8.5,1.7,2,ring);d.put(12,8,shade(bark,.8));if(sub==='birch')for(const x of [4,8])d.rect(x,6,2,1,'#3a3430')}
 else if(kind==='plank'){const [,mid,light]=WOODS[sub]||WOODS.oak;for(let i=0;i<3;i++){d.rect(1,3+i*4,14,3,i%2?mid:light);d.rect(1,5+i*4,14,1,shade(mid,.8));d.put(3+i*4,4+i*4,shade(mid,.7))}}
 else if(kind==='sapling'){const sp=SPECIES[sub]||SPECIES.oak;d.rect(4,11,8,4,'#c8735a');d.rect(4,11,8,1,'#e08e72');d.rect(7,5,2,6,'#5fa85a');if(sub==='pine'){d.poly([[3,9],[8,2],[13,9]],sp.leaf)}else{d.ell(5,6,3,2,sp.leaf);d.ell(11,4,3,2,sp.leaf);d.put(4,5,sp.light);d.put(10,3,sp.light)}if(sub==='cherry')d.rect(7,3,2,2,'#ffd3e4');if(sub==='magic')d.rect(7,3,2,2,'#8ff0ff')}
 else if(kind==='gem'){const [a,b,c]=GEMS[sub]||GEMS.crystal;d.poly([[3,6],[6,2],[10,2],[13,6],[8,14]],a);d.poly([[3,6],[13,6],[8,14]],c);d.poly([[6,2],[8,6],[10,2]],b);d.rect(5,6,6,1,b);d.put(6,4,'#ffffff')}
 else if(kind==='ore'){d.ell(8,9,6.5,5.5,'#8a8f9a');d.ell(7,7.5,4,3,'#a9aeb8',['#8a8f9a']);for(const [x,y] of [[5,8],[9,6],[10,10],[6,11]])d.rect(x,y,2,2,ORES[sub]||'#ffd45c');if(sub==='coal'){d.ell(8,9,6.5,5.5,'#3a3442');for(const [x,y] of [[6,7],[10,9]])d.rect(x,y,1,1,'#9a92a8')}}
 else if(kind==='geode'){d.ell(8,8,7,6.5,'#8a7f9a');d.ell(8,8,5,4.5,'#3a2c52');['#ff6f7a','#ffb35c','#ffe35c','#7fe07a','#6fb6ff','#b57cf2'].forEach((c,i)=>{const a=i/6*6.28;d.rect(8+Math.cos(a)*3,8+Math.sin(a)*2.6,2,2,c)});d.put(8,8,'#ffffff')}
 else if(kind==='stone'){d.ell(8,9.5,6.5,5,'#8f8f9a');d.ell(6.5,8,3.5,2.5,'#b4b4be',['#8f8f9a']);d.rect(9,11,3,1,'#6f6f7a')}
 else if(kind==='ingot'){const c=sub==='titanium'?['#c9d0e0','#eef2fa','#8a92a6']:['#aebdd2','#e9f1fb','#6c7c96'];d.poly([[2,11],[5,6],[13,6],[15,11]],c[0]);d.rect(5,6,8,1,c[1]);d.rect(2,11,13,2,c[2]);if(sub==='titanium')d.ell(9,8.5,1.5,1.2,'#8a92a6')}
 else if(kind==='flower'){const c=sub==='cherry'?'#ffb6d5':sub==='lily'?'#ffffff':'#ffd45c';for(let i=0;i<5;i++){const a=i/5*6.28-1.57;d.ell(8+Math.cos(a)*3.5,8+Math.sin(a)*3.5,2.3,2.3,c)}d.ell(8,8,1.8,1.8,sub==='lily'?'#f6dc4a':'#e88a3a');if(sub!=='cherry')d.rect(8,12,1,4,'#5fa85a')}
 else if(kind==='leaf'){d.poly([[2,14],[4,5],[10,2],[14,3],[12,10],[5,13]],'#5fae4a');d.poly([[4,12],[12,4],[13,5],[5,13]],'#8fe39a');d.rect(1,14,2,1,'#3f8a35')}
 else if(kind==='moss'){d.ell(8,10,6.5,4.5,'#5f9e3a');for(const [x,y] of [[4,8],[8,6],[11,8],[6,10]])d.ell(x,y,2,1.6,'#8fd06a');d.put(5,7,'#ffffff');d.put(6,7,'#241a2c')}
 else if(kind==='catnip'){d.rect(7,4,2,11,'#3f8a35');for(const [x,y,f] of [[4,5,1],[11,7,-1],[4,10,1],[11,11,-1]])d.ell(x,y,3,1.8,'#6fcf5a');d.ell(8,3,2,1.6,'#c9a6ef')}
 else if(kind==='string'){d.ell(8,8,6,6,'#ff8fc8');for(const [x0,y0,x1,y1] of [[3,6,13,6],[3,10,13,10],[6,3,6,13]])for(let i=0;i<=10;i++){const x=x0+(x1-x0)*i/10,y=y0+(y1-y0)*i/10;if(g[Math.round(y)]?.[Math.round(x)])d.put(x,y,'#d95e9c')}d.rect(13,12,2,1,'#ff8fc8');d.rect(14,13,1,2,'#ff8fc8')}
 else if(kind==='venom'){d.ell(8,10,5,4.5,'#a15fd6');d.poly([[4,9],[8,2],[12,9]],'#a15fd6');d.ell(6.5,9,1.5,1.5,'#d9b8ff')}
 else if(kind==='reed'){for(const x of [4,7,10]){d.rect(x,4,1,11,'#b8a05a');d.ell(x+.5,4,1.4,2.4,'#8a6a3a')}}
 else if(kind==='feather'){d.poly([[3,14],[11,2],[14,4],[5,14]],'#f4efe6');d.poly([[4,14],[12,3]],'#c9bfae');for(let i=0;i<10;i++)d.put(4+i*.8,13-i*1.1,'#c9bfae')}
 else if(kind==='bone'){d.rect(4,7,8,2,'#f4efe2');for(const [x,y] of [[3,6],[3,9],[12,6],[12,9]])d.ell(x,y,1.8,1.8,'#f4efe2')}
 else if(kind==='leather'){d.poly([[2,4],[13,3],[14,12],[3,13]],'#a87048');d.rect(4,5,8,1,'#c8905e');for(let i=3;i<13;i+=2)d.put(i,12,'#7a5233')}
 else if(kind==='cloth'){d.rect(2,4,12,9,'#e9dcc6');d.rect(2,4,12,1,'#fff8ea');for(let i=4;i<13;i+=3)d.rect(2,i,12,1,'#c9b8a4');d.rect(12,9,2,4,'#d6c7b4')}
 else if(kind==='fiber'){for(let i=0;i<4;i++)for(let y=2;y<14;y++)d.put(4+i*2+Math.round(Math.sin(y*.7+i)),y,i%2?'#c8b27a':'#e0cc94');d.rect(3,8,10,2,'#8a6a3a')}
 else if(kind==='scale'){d.ell(8,8,6,6.5,'#5fb3a8');for(const [x,y] of [[6,6],[10,6],[8,9],[6,11],[10,11]])d.ell(x,y,1.8,1.4,'#9fe3d6')}
 else if(kind==='essence'){d.ell(8,8,6,6,'#b98bff');d.ell(8,8,4,4,'#e3d0ff');d.ell(7,7,1.6,1.6,'#ffffff');for(const [x,y] of [[2,2],[13,3],[3,13]])d.put(x,y,'#fff6b0')}
 else if(kind==='arrows'){for(const o of [0,3]){for(let i=0;i<10;i++)d.put(3+i+o*.3,13-i-o,'#b98557');d.rect(12+o*.3,2-o,3,2,'#c2cad6');d.rect(2+o*.3,12-o,2,3,'#ff6f7a')}}
 else{d.ell(8,8,6,6,'#cfc6da')}
 return g;
}
function shade(hex,k){const n=parseInt(hex.slice(1),16);const f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return '#'+((1<<24)|(f(n>>16&255)<<16)|(f(n>>8&255)<<8)|f(n&255)).toString(16).slice(1)}
const matCache=new Map(),matUrl=new Map();
function material(key){if(!matCache.has(key))matCache.set(key,toCanvas(buildMaterial(key)));return matCache.get(key)}
function materialURL(key){if(!matUrl.has(key)){const c=material(key),b=document.createElement('canvas');b.width=M*4;b.height=M*4;const x=b.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(c,0,0,M*4,M*4);matUrl.set(key,b.toDataURL())}return matUrl.get(key)}
// Game material ids → icon keys (also used for the emoji in material lists).
const GAME={wood:'log:oak',stone:'stone',coal:'ore:coal',steel:'ingot:steel',titanium:'ingot:titanium',amethyst:'gem:amethyst',crystal:'gem:crystal',diamond:'gem:diamond',emerald:'gem:emerald',eligeode:'geode',
 flower:'flower:wild',cherry:'flower:cherry',lily:'flower:lily',leaf:'leaf',frog:'moss',catnip:'catnip',string:'string',venom:'venom',reed:'reed',arrows:'arrows'};
const EMOJI={'🪵':'log:oak','🪨':'stone','⚫':'ore:coal','🔩':'ingot:steel','⚙️':'ingot:titanium','💎':'gem:amethyst','🔮':'gem:crystal','💠':'gem:diamond','💚':'gem:emerald','🌈':'geode','🌸':'flower:cherry','🌼':'flower:wild','🪷':'flower:lily','🍃':'leaf','🐸':'moss','🌿':'catnip','🧶':'string','🟣':'venom','🌾':'reed','🏹':'arrows'};
function swapEmoji(root){
 if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
 while(walker.nextNode()){const n=walker.currentNode;if(n.parentElement?.closest('button.recipe-title,h2,h3,summary,.cc-no-pixel'))continue;if(Object.keys(EMOJI).some(e=>n.textContent.includes(e)))nodes.push(n)}
 const rx=new RegExp('('+Object.keys(EMOJI).map(e=>e.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','u');
 for(const n of nodes){
  const parts=n.textContent.split(rx);if(parts.length<2)continue;const frag=document.createDocumentFragment();
  parts.forEach((part,i)=>{if(EMOJI[part]){const next=parts[i+1]||'';const key=part==='💎'&&/^\s*Diamond/i.test(next)?'gem:diamond':part==='🌸'&&/^\s*(Wild)?flower/i.test(next)?'flower:wild':EMOJI[part];const img=new Image();img.src=materialURL(key);img.alt=part;img.className='cc-pixel-mat';frag.append(img)}else if(part)frag.append(part)});
  n.replaceWith(frag);
 }
}
if(core){
 const st=document.createElement('style');st.textContent='.cc-pixel-mat{width:1.35em;height:1.35em;image-rendering:pixelated;vertical-align:-0.3em;margin:0 1px}';document.head.append(st);
 let queued=false;const mo=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;for(const id of ['cc-ti-materials','world-inv-body','cc-ti-craft'])swapEmoji(document.getElementById(id))})});
 const watch=()=>{for(const id of ['cc-ti-materials','world-inv-body','cc-ti-craft']){const el=document.getElementById(id);if(el&&!el.dataset.matWatch){el.dataset.matWatch='1';mo.observe(el,{childList:true,subtree:true,characterData:true});swapEmoji(el)}}};
 watch();setInterval(watch,1500);
}

// ------------------------------------------------------------------ review sheet
const MAT_KEYS=[...Object.keys(WOODS).map(w=>'log:'+w),...Object.keys(WOODS).map(w=>'plank:'+w),...Object.keys(SPECIES).map(w=>'sapling:'+w),
 'stone','ore:coal','ore:iron','ore:copper','ore:silver','ore:gold','ingot:steel','ingot:titanium','gem:amethyst','gem:crystal','gem:diamond','gem:emerald','gem:ruby','geode',
 'flower:wild','flower:cherry','flower:lily','leaf','moss','catnip','string','venom','reed','fiber','leather','cloth','feather','bone','scale','essence','arrows'];
function sheet(){
 const stages=['sprout','young','mature','stump'],sp=Object.keys(SPECIES),ts=2;
 const tw=TW*ts+10,th=TH*ts+10,cols=12,mc=16*4+10,mrows=Math.ceil(MAT_KEYS.length/cols);
 const c=document.createElement('canvas');c.width=Math.max(stages.length*sp.length*0+tw*stages.length*3, cols*mc)+20;c.height=Math.ceil(sp.length/3)*th+mrows*(mc+12)+40;
 const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.font='bold 10px system-ui';x.textAlign='center';x.fillStyle='#fff';
 sp.forEach((s2,i)=>{const ox=(i%3)*tw*4,oy=Math.floor(i/3)*th;stages.forEach((st2,j)=>{x.drawImage(tree(s2,st2),ox+j*tw+5,oy+5,TW*ts,TH*ts)});x.fillText(s2,ox+tw*2,oy+th-2)});
 const my=Math.ceil(sp.length/3)*th+20;
 MAT_KEYS.forEach((k,i)=>{const ox=(i%cols)*mc+10,oy=my+Math.floor(i/cols)*(mc+12);x.fillStyle='#3a2c52';x.fillRect(ox,oy,mc-6,mc-6);x.drawImage(material(k),ox+2,oy+2,64,64);x.fillStyle='#fff';x.fillText(k.replace(':',' '),ox+mc/2-3,oy+mc+4)});
 return c;
}
window.catCityNatureArt={tree,drawTree,material,materialURL,sheet,species:Object.keys(SPECIES),materials:MAT_KEYS,gameMaterial:GAME};
})();

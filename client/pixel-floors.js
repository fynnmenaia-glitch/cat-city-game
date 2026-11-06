/* Cat City — pixel-art floors and ground tiles (giant update).
 *
 * Every biome gets its own 16×16 pixel tiles, drawn at 2× so one art tile is
 * exactly one game tile (32 px). Tiles come in several variants mixed by a
 * fixed hash into a 8×8-tile block, so the ground doesn't look like a grid of
 * stamps, and the result is turned into a repeating canvas pattern anchored
 * to the world, so it doesn't swim as the camera moves.
 *
 * Floors: town, wild, cherry, poison, marsh, moonstone, terrace (Flower
 * Terrace), path (village roads), sand, cave, wood (indoor planks), arena.
 *
 * API: catCityFloors.pattern(ctx, kind) · catCityFloors.fill(ctx, kind, x, y, w, h)
 *      catCityFloors.tile(kind, variant) → canvas · catCityFloors.kinds
 */
(()=>{'use strict';
const P=16,SC=2,BLOCK=8;
// a base, b light, c dark, d detail, e accent, f accent 2
const PAL={
 town:{a:'#a8d49a',b:'#bfe3ad',c:'#90c086',d:'#76ab72',e:'#ffd7ec',f:'#fff2a6'},
 wild:{a:'#93c187',b:'#a8d099',c:'#7cac74',d:'#5f9461',e:'#fff2a6',f:'#ffffff'},
 cherry:{a:'#eccbd7',b:'#f6dde6',c:'#dcb4c4',d:'#c99aae',e:'#f7a6c9',f:'#ffffff'},
 poison:{a:'#7f9a86',b:'#91ad97',c:'#687f6f',d:'#526657',e:'#a77fbe',f:'#c3efa9'},
 marsh:{a:'#94ccb6',b:'#a9dac6',c:'#7db8a3',d:'#5f9f8c',e:'#76b8c4',f:'#c7ecf2'},
 moonstone:{a:'#b2aed8',b:'#cbc8ec',c:'#9893c4',d:'#7c77ad',e:'#efdcff',f:'#ffffff'},
 terrace:{a:'#a6d68f',b:'#c0e7a6',c:'#8cc07d',d:'#7a6a52',e:'#ff9fc9',f:'#ffe27a'},
 path:{a:'#f2e2c6',b:'#fbf0db',c:'#ddc6a4',d:'#c4a983',e:'#e9d3b2',f:'#ffffff'},
 sand:{a:'#f4dfa8',b:'#fcecc4',c:'#e6cc8e',d:'#d2b475',e:'#ffffff',f:'#f6b6c8'},
 cave:{a:'#5d5470',b:'#6e6584',c:'#4b4360',d:'#3a334c',e:'#9d8fc0',f:'#c7b8ef'},
 wood:{a:'#c99a6a',b:'#dbb083',c:'#b6865a',d:'#8f6643',e:'#e8c49a',f:'#7a5233'},
 arena:{a:'#c9b8e6',b:'#dccff2',c:'#b4a2d6',d:'#9784bd',e:'#ffe3a6',f:'#ffffff'}
};
const KINDS=Object.keys(PAL);
// Small deterministic hash so tiles look the same on every device.
function hash(a,b,c=0){let x=(a*374761393+b*668265263+c*2147483647)|0;x=(x^(x>>>13))*1274126177|0;return((x^(x>>>16))>>>0)/4294967296}
function grid(fill){return Array.from({length:P},()=>Array(P).fill(fill))}
function put(g,x,y,v){if(x>=0&&y>=0&&x<P&&y<P)g[y][x]=v}
function noise(g,seed,pl,pd,lv='b',dv='c'){for(let y=0;y<P;y++)for(let x=0;x<P;x++){const r=hash(x,y,seed);if(r<pl)g[y][x]=lv;else if(r>1-pd)g[y][x]=dv}}
function tuft(g,x,y,v='d'){put(g,x,y,v);put(g,x-1,y-1,v);put(g,x+1,y-1,v);put(g,x,y-1,v)}
function flower(g,x,y,petal,mid='f'){put(g,x,y,mid);put(g,x-1,y,petal);put(g,x+1,y,petal);put(g,x,y-1,petal);put(g,x,y+1,petal)}
// Tile builders, one per floor, each with variants 0..3.
const BUILD={
 grass(kind,v){const g=grid('a');noise(g,v*7+1,.1,.08);
  if(v===1){tuft(g,4,6);tuft(g,11,12);tuft(g,13,4)}
  else if(v===2){tuft(g,7,9);flower(g,3,12,'e');flower(g,12,5,'f','e')}
  else if(v===3){for(let x=2;x<14;x++)if(hash(x,v,9)<.5)put(g,x,8,'b');tuft(g,9,13)}
  return g},
 cherry(kind,v){const g=grid('a');noise(g,v*5+3,.12,.08);
  const petals=v===0?2:v===1?4:v===2?6:3;for(let i=0;i<petals;i++){const x=1+Math.floor(hash(i,v,4)*14),y=1+Math.floor(hash(v,i,5)*14);put(g,x,y,'e');put(g,x+1,y,'e');if(i%2)put(g,x,y+1,'f')}
  if(v===3)tuft(g,8,10,'d');return g},
 poison(kind,v){const g=grid('a');noise(g,v*3+5,.08,.16,'b','c');
  if(v===1){for(let y=6;y<11;y++)for(let x=5;x<12;x++)if(Math.hypot(x-8.5,(y-8.5)*1.4)<3.6)put(g,x,y,'e');put(g,7,7,'f');put(g,10,9,'f')}
  else if(v===2){put(g,3,4,'f');put(g,12,11,'f');put(g,9,3,'f');tuft(g,6,12,'d')}
  else if(v===3){for(let x=0;x<P;x++)if(hash(x,3,8)<.35)put(g,x,Math.floor(4+hash(x,1,1)*8),'d')}
  return g},
 marsh(kind,v){const g=grid('a');noise(g,v*11+2,.1,.08);
  if(v===1||v===3){for(let y=0;y<P;y++)for(let x=0;x<P;x++){const d=Math.hypot(x-8,(y-8)*1.7);if(d<(v===1?6:4))g[y][x]=d<1.5&&v===1?'f':'e'}put(g,6,7,'f');put(g,7,7,'f')}
  else if(v===2){for(const x of [4,5,11])for(let y=6;y<13;y++)if(hash(x,y,2)<.75)put(g,x,y,'d');put(g,4,5,'c');put(g,11,5,'c')}
  return g},
 moonstone(kind,v){const g=grid('a');
  // Big flagstones with grout lines, offset by variant.
  for(let y=0;y<P;y++)for(let x=0;x<P;x++){const gx=(x+(v&1)*4)%8===0,gy=(y+(v>>1)*4)%8===0;if(gx||gy)g[y][x]='d';else if(hash(x,y,v+20)<.12)g[y][x]='b';else if(hash(x,y,v+30)<.08)g[y][x]='c'}
  if(v===2){put(g,11,5,'e');put(g,11,4,'f');put(g,10,5,'e');put(g,12,5,'e')}return g},
 terrace(kind,v){const g=grid('a');noise(g,v*13+7,.1,.06);
  // Terrace step edge along the bottom of some tiles.
  if(v===3){for(let x=0;x<P;x++){put(g,x,13,'c');put(g,x,14,'d');put(g,x,15,'d')}}
  const n=v===0?2:v===1?3:1;for(let i=0;i<n;i++)flower(g,2+Math.floor(hash(i,v,6)*12),2+Math.floor(hash(v,i,7)*9),i%2?'f':'e',i%2?'e':'f');
  if(v===2)tuft(g,8,10,'c');return g},
 path(kind,v){const g=grid('a');
  // Cobbles: rounded stones with darker joints.
  const stones=[[1,1,6,5],[8,0,7,5],[0,7,5,4],[6,6,6,5],[12,6,4,5],[2,12,7,4],[10,12,6,4]];
  for(const [x0,y0,w,h] of stones){const sh=(v*3)%4;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const edge=y===y0||x===x0||y===y0+h-1||x===x0+w-1;put(g,(x+sh)%P,y,edge?'c':(hash(x,y,v)<.18?'b':'a'))}}
  for(let y=0;y<P;y++)for(let x=0;x<P;x++)if(g[y][x]==='a'&&hash(x,y,v+40)<.05)g[y][x]='e';return g},
 sand(kind,v){const g=grid('a');noise(g,v*17+9,.14,.1);if(v===1){put(g,5,9,'e');put(g,6,9,'f')}if(v===2)for(let x=3;x<13;x++)if(x%3)put(g,x,6+(x%2),'c');return g},
 cave(kind,v){const g=grid('a');noise(g,v*19+4,.08,.2,'b','c');
  for(let y=0;y<P;y++)for(let x=0;x<P;x++)if((x+y*3+v)%11===0&&hash(x,y,v)<.5)g[y][x]='d';
  if(v===2){put(g,9,6,'e');put(g,10,6,'f');put(g,9,7,'e')}return g},
 wood(kind,v){const g=grid('a');
  for(let y=0;y<P;y++)for(let x=0;x<P;x++){if(y%4===3)g[y][x]='d';else if(hash(x,y,v+50)<.07)g[y][x]='c';else if(y%4===0)g[y][x]='b'}
  const seam=(v*5+3)%P;for(let r=0;r<4;r++)put(g,(seam+r*7)%P,r*4+1,'d');if(v===1){put(g,6,6,'f');put(g,7,6,'c')}return g},
 arena(kind,v){const g=grid('a');
  for(let y=0;y<P;y++)for(let x=0;x<P;x++){if(x===0||y===0)g[y][x]='c';else if(x===15||y===15)g[y][x]='d';else if(hash(x,y,v+60)<.1)g[y][x]='b'}
  if(v===1){put(g,7,7,'e');put(g,8,8,'e');put(g,7,8,'f');put(g,8,7,'f')}return g}
};
const BUILDER={town:'grass',wild:'grass',cherry:'cherry',poison:'poison',marsh:'marsh',moonstone:'moonstone',terrace:'terrace',path:'path',sand:'sand',cave:'cave',wood:'wood',arena:'arena'};
const tileCache=new Map(),patCache=new WeakMap();
function tile(kind,v=0){
 kind=PAL[kind]?kind:'wild';const key=kind+v;
 if(tileCache.has(key))return tileCache.get(key);
 const g=BUILD[BUILDER[kind]](kind,v),pal=PAL[kind],c=document.createElement('canvas');c.width=c.height=P*SC;
 const x=c.getContext('2d');for(let yy=0;yy<P;yy++)for(let xx=0;xx<P;xx++){x.fillStyle=pal[g[yy][xx]]||pal.a;x.fillRect(xx*SC,yy*SC,SC,SC)}
 tileCache.set(key,c);return c;
}
const WEIGHTS={town:[.55,.2,.12,.13],wild:[.5,.25,.1,.15],cherry:[.4,.25,.2,.15],poison:[.55,.15,.15,.15],marsh:[.55,.12,.2,.13],moonstone:[.4,.2,.1,.3],
 terrace:[.35,.25,.25,.15],path:[.3,.25,.25,.2],sand:[.6,.15,.25,0],cave:[.5,.3,.2,0],wood:[.6,.4,0,0],arena:[.85,.15,0,0]};
const blockCache=new Map();
function block(kind){
 kind=PAL[kind]?kind:'wild';if(blockCache.has(kind))return blockCache.get(kind);
 const S=P*SC,c=document.createElement('canvas');c.width=c.height=S*BLOCK;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
 const w=WEIGHTS[kind];
 for(let ty=0;ty<BLOCK;ty++)for(let tx=0;tx<BLOCK;tx++){
  let r=hash(tx,ty,kind.length*31+kind.charCodeAt(0)),v=0;while(v<3&&r>=w[v]){r-=w[v];v++}
  x.drawImage(tile(kind,v),tx*S,ty*S);
 }
 blockCache.set(kind,c);return c;
}
function pattern(ctx,kind){
 let m=patCache.get(ctx);if(!m){m=new Map();patCache.set(ctx,m)}
 if(!m.has(kind)){const p=ctx.createPattern(block(kind),'repeat');m.set(kind,p)}
 return m.get(kind);
}
// Fill a world-space rectangle. The pattern is anchored to the world origin,
// so ground stays put as the camera scrolls.
function fill(ctx,kind,x,y,w,h){ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle=pattern(ctx,kind);ctx.fillRect(x,y,w,h);ctx.restore()}
function sheet(){
 const S=P*SC,c=document.createElement('canvas');c.width=S*4*2+16;c.height=(S*2+8)*KINDS.length;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
 x.fillStyle='#241a2c';x.fillRect(0,0,c.width,c.height);
 KINDS.forEach((k,i)=>{for(let v=0;v<4;v++)x.drawImage(tile(k,v),v*(S*2+4),i*(S*2+8),S*2,S*2)});
 return c;
}
window.catCityFloors={pattern,fill,tile,block,sheet,kinds:KINDS};
})();

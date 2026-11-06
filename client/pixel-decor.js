/* Cat City — pixel-art world decor (giant update, wave 5).
 *
 * Small sprites drawn from text grids, with an automatic dark outline, cached
 * as canvases. Used by world-overhaul.js for biome decor and by the village.
 *
 * Sprites: toxicShroom, toxicBush, toxicPuddle, pond, lily, reeds, crystal,
 *   crystalSmall, rock, bush, flowerPink, flowerYellow, tulip, lamp, bench,
 *   fence, sign, well, barrel, crate, mailbox, campTent, gift.
 *
 * API: catCityDecor.draw(ctx, name, x, y, scale=2)  (x,y = bottom centre)
 *      catCityDecor.sprite(name) · catCityDecor.names · catCityDecor.sheet()
 */
(()=>{'use strict';
const OUT='#2a1d36';
// Each sprite: palette + rows. '.' = empty. Rows are left-to-right pixels.
const S={
 toxicShroom:{p:{r:'#9b5fc4',l:'#c99af0',d:'#6b3d8f',s:'#f2e6ff',w:'#efe6d6',g:'#c3efa9'},rows:[
  '....rrrr....','..rrlrrlrr..','.rrllrrrrlr.','rrlrrsrrrsrr','rrrrrrrrrrrr','.ddddddddd..','....wwww....','....wwww....','...gwwwwg...','..gg.gg.gg..']},
 toxicBush:{p:{a:'#536c58',b:'#6f8a70',d:'#3a4c3e',e:'#bfeda6',f:'#a77fbe'},rows:[
  '....aabaa.....','..aabbbbaaa...','.aabbebbbbaa..','aabbbbbbfbbaa.','abbfbbbbbbebaa','aabbbbebbbbbaa','.aaabbbbbbaaa.','..ddaaaaaadd..']},
 toxicPuddle:{p:{a:'#a77fbe',b:'#c9a6e0',d:'#7a5694',e:'#e7d6f5'},rows:[
  '...dddddd...','.ddaaaaaadd.','daabbaaeaaad','daaaaaabbaad','.ddaaaaaadd.','...dddddd...']},
 pond:{p:{a:'#5fa9c4',b:'#8fd0e2',e:'#d9f4fa',d:'#3c7f9a',g:'#7fbf6a',G:'#5d9a50'},rows:[
  '.....GgggG.......','...GgddddddgG....','..GddaaaaaaaddG..','.GdaabbaaaeaaadG.','Gdaaaaaaabbaaaad.','Gdaaeaaaaaaaaaad.','.Gdaaaabbaaaaadg.','..GddaaaaaaaddG..','....GgddddddgG...','......GgggG......']},
 lily:{p:{g:'#7fbf6a',G:'#4d8a3e',p:'#ffd3ea',P:'#f39ac4',y:'#ffe27a'},rows:[
  '...pPp...','..pPyPp..','.ggpPpgg.','gGggggGgg','.gggGggg.']},
 reeds:{p:{g:'#6fa85a',G:'#4d7f3e',b:'#8f6a42',B:'#b88a55'},rows:[
  '.B...B..','.b.B.b..','.g.b.g.B','.g.g.g.b','gG.g.Gg.','.g.G.g.g','.gGg.gGg','.ggg.ggg']},
 crystal:{p:{a:'#b47cf0',b:'#e0c8ff',c:'#7a4fc0',w:'#ffffff',r:'#8a8f9a',R:'#a9aeb8'},rows:[
  '.....w.....','....wb.....','....bac....','..w.bac....','..bcbacc.w.','.bacbaccbc.','.bacbacbac.','.baccacbac.','RRrrrrrrrRR','.RRrrrrrRR.']},
 crystalSmall:{p:{a:'#9fdfff',b:'#effbff',c:'#4f9fd6'},rows:[
  '..b...','.bac..','.bac.b','bacbac','baccac']},
 rock:{p:{a:'#9a9ca6',b:'#c9cbd2',c:'#6f717c'},rows:[
  '...aaaa...','.aabbaaaa.','aabbaaaaca','aaaaaaacca','.cccccccc.']},
 bush:{p:{a:'#5c9e58',b:'#8fcf74',c:'#3a7348',e:'#ff9fc9'},rows:[
  '...abba...','.aabbbbaa.','aabbebbbaa','abbbbbbeba','aabbbbbbaa','.cccaaccc.']},
 flowerPink:{p:{p:'#ff9fc9',P:'#e06a9e',y:'#ffe27a',g:'#5f9461'},rows:['.p.','pyp','.P.','.g.','gg.']},
 flowerYellow:{p:{p:'#ffe27a',P:'#e0b23a',y:'#ff9f5a',g:'#5f9461'},rows:['.p.','pyp','.P.','.g.','.gg']},
 tulip:{p:{r:'#ff6f8f',R:'#d04466',g:'#5f9461'},rows:['r.r','rRr','RRR','.g.','gg.']},
 lamp:{p:{m:'#5d5470',M:'#857aa0',y:'#fff1a6',Y:'#ffd45c'},rows:[
  '.MMMM.','MyyYYM','MyYYYM','.MMMM.','..mm..','..mm..','..mm..','..mm..','..mm..','.mmmm.','mmmmmm']},
 bench:{p:{w:'#c99a6a',W:'#a8764a',d:'#7a5233',m:'#5d5470'},rows:[
  'wwwwwwwwwwww','WWWWWWWWWWWW','............','wwwwwwwwwwww','dddddddddddd','.m........m.','.m........m.']},
 fence:{p:{w:'#e8d6b8',W:'#c4a983'},rows:[
  '.w...w...w..','www.www.www.','wWwwwWwwwWww','wWw.wWw.wWw.','wWwwwWwwwWww','wWw.wWw.wWw.','WWW.WWW.WWW.']},
 sign:{p:{w:'#c99a6a',W:'#a8764a',d:'#7a5233',t:'#5d4a3a'},rows:[
  'wwwwwwwwww','wttwttttww','wwwwwwwwww','wtttwttwww','WWWWWWWWWW','....dd....','....dd....','...dddd...']},
 well:{p:{s:'#9a9ca6',S:'#c9cbd2',d:'#6f717c',r:'#b55f6b',R:'#8f3f4f',w:'#7a5233',b:'#3c7f9a'},rows:[
  '...RRRRRR...','..RrrrrrrR..','.RrrrrrrrrR.','...w....w...','...w....w...','.SSSSSSSSSS.','SsbbbbbbbbsS','SSSSSSSSSSSS','SsSsSsSsSsSS','dddddddddddd']},
 barrel:{p:{w:'#b98557',W:'#d9a877',d:'#7a5233',m:'#6f717c'},rows:[
  '.mmmmmm.','wWWwwwWw','wWwwwwWw','mmmmmmmm','wWwwwwWw','wWwwwwWw','mmmmmmmm','.wwwwww.']},
 crate:{p:{w:'#c99a6a',W:'#e8c49a',d:'#8f6643'},rows:[
  'dddddddd','dWwwwwWd','dwdwwdwd','dwwddwwd','dwwddwwd','dwdwwdwd','dWwwwwWd','dddddddd']},
 mailbox:{p:{r:'#e8506a',R:'#b83a52',w:'#7a5233',f:'#ffd45c'},rows:[
  '.rrrrf','rrrrrf','rRRRRr','rrrrrr','..ww..','..ww..','..ww..','.wwww.']},
 campTent:{p:{a:'#9b6078',b:'#c98aa2',d:'#604b59',o:'#2a1d36',y:'#fff4be'},rows:[
  '.......a.......','......aba......','.....abbba.....','....abbobba....','...abbbobbba...','..abbbbobbbba..','.abbbbooobbbba.','abbbbbooobbbbba','ddddddyyyddddd.']},
 coconutFlower:{p:{w:'#fff6e4',W:'#ffe6c8',b:'#8f6643',B:'#b98557',g:'#5f9461'},rows:[
  '...ww...','..wWWw..','.wwbbww.','wWbBBbWw','wWbBBbWw','.wwbbww.','..wWWw..','...gg...','..gggg..','...gg...']},
 gift:{p:{a:'#ff6fae',b:'#ffb0d4',r:'#ffd45c'},rows:[
  '..r.r..','...r...','rrrrrrr','aaarbaa','abaraba','aaaraaa','aaaraaa']}
};
// Gem colour variants of the crystal cluster.
for(const [name,a,b,c] of [['crystalDiamond','#8fe9ff','#ffffff','#3fb2d6'],['crystalEmerald','#3fcf7f','#b8ffd6','#1f8a50'],['crystalBlue','#9fdfff','#effbff','#4f9fd6']])
 S[name]={p:{...S.crystal.p,a,b,c},rows:S.crystal.rows};
const cache=new Map();
function sprite(name){
 if(cache.has(name))return cache.get(name);const def=S[name];if(!def)return null;
 const rows=def.rows,H=rows.length+2,W=Math.max(...rows.map(r=>r.length))+2;
 const G=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>{const ch=rows[y-1]?.[x-1];return ch&&ch!=='.'?def.p[ch]:null}));
 const out=G.map(r=>r.slice());
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!G[y][x]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>G[y+b]?.[x+a]))out[y][x]=OUT;
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 out.forEach((r,y)=>r.forEach((col,x)=>{if(col){g.fillStyle=col;g.fillRect(x,y,1,1)}}));
 cache.set(name,c);return c;
}
function draw(ctx,name,x,y,scale=2){
 const c=sprite(name);if(!c)return;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(c,Math.round(x-c.width*scale/2),Math.round(y-c.height*scale),c.width*scale,c.height*scale);ctx.restore();
}
function sheet(scale=4){
 const names=Object.keys(S),cell=20*scale,c=document.createElement('canvas');c.width=6*cell;c.height=Math.ceil(names.length/6)*cell;const g=c.getContext('2d');
 g.fillStyle='#93c187';g.fillRect(0,0,c.width,c.height);names.forEach((n,i)=>draw(g,n,(i%6)*cell+cell/2,Math.floor(i/6)*cell+cell-6,scale));return c;
}
// ------------------------------------------------------------------ buildings
// Pixel village building for a w×h (px) footprint, as world-overhaul.js lays
// them out: roof peak 32 px above the top, walls from y+24, door centred at
// the bottom, windows at x+33 and x+w-66. One art pixel = 4 game pixels.
const bCache=new Map();
function shade(hex,k){const n=parseInt(hex.slice(1,7),16),f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return '#'+((f(n>>16&255)<<16)|(f(n>>8&255)<<8)|f(n&255)).toString(16).padStart(6,'0')}
function building(label,w,hh,wall,roof='#986baf'){
 const key=[label,w,hh,wall,roof].join('|');if(bCache.has(key))return bCache.get(key);
 const U=4,gw=Math.round(w/U)+8,gh=Math.round((hh+32)/U)+1,ox=4,G=Array.from({length:gh},()=>Array(gw).fill(null));
 const P=(x,y,ww,h2,c)=>{for(let j=y;j<y+h2;j++)for(let i=x;i<x+ww;i++)if(j>=0&&i>=0&&j<gh&&i<gw)G[j][i]=c};
 const col=px=>ox+Math.round(px/U),row=py=>Math.round((py+32)/U);
 const W0=col(0),W1=col(w),bottom=gh-1,trim=shade(wall,.72),plank=shade(wall,.92),lite=shade(wall,1.08);
 // Walls with planks and corner posts.
 P(W0,row(24),W1-W0,bottom-row(24),wall);for(let j=row(24)+3;j<bottom;j+=4)P(W0,j,W1-W0,1,plank);
 P(W0,row(24),1,bottom-row(24),trim);P(W1-1,row(24),1,bottom-row(24),trim);P(W0,bottom-1,W1-W0,1,shade(wall,.8));
 // Building extras behind the roof.
 const L=label.toLowerCase();
 if(/home|luna/.test(L)){const cx=W1-10;P(cx,0,4,9,/luna/.test(L)?'#6a4f9a':'#a8604a');P(cx,0,4,1,/luna/.test(L)?'#9a7ce0':'#c97a62');if(/luna/.test(L)){P(cx+1,-1,2,1,'#ffe27a')}}
 // Roof: stepped triangle with shingle rows and a dark eave.
 const peak=Math.floor(gw/2),rows=row(42);
 for(let r=0;r<rows;r++){const half=Math.min(peak,Math.round((r+1)*peak/(rows-2))),c=(r>>1)%2?shade(roof,.88):roof;P(peak-half,r,half*2,1,c);if(r%2===0)for(let i=peak-half+((r>>1)%2?1:3);i<peak+half;i+=4)P(i,r,1,1,shade(roof,.75))}
 P(0,rows-2,gw,2,shade(roof,.62));P(0,rows-2,gw,1,shade(roof,.8));
 // Windows with frames, glass shine, cross bars and flower boxes.
 for(const wx of (w>=150?[33,w-66]:[])){const x=col(wx),y=row(70);P(x,y,9,12,trim);P(x+1,y+1,7,10,'#fff1bd');P(x+1,y+1,3,2,'#ffffff');P(x+4,y+1,1,10,'#b4d1d3');P(x+1,y+5,7,1,'#b4d1d3');
  P(x-1,y+12,11,2,'#a8764a');P(x,y+11,1,1,'#ff9fc9');P(x+3,y+11,1,1,'#ffe27a');P(x+6,y+11,1,1,'#ff6f8f');P(x+8,y+11,1,1,'#ffe27a')}
 // Door: arched, panelled, with a knob and a step.
 const small=hh<100,dw=small?10:12,dh=small?11:16,dx=col(w/2)-dw/2,dy=bottom-dh;P(dx,dy+2,dw,dh-1,'#684b71');P(dx+1,dy,dw-2,2,'#684b71');P(dx+1,dy+2,dw-2,dh-2,'#ab809b');P(dx+2,dy+1,dw-4,1,'#ab809b');
 if(!small){P(dx+2,dy+4,3,4,'#c49ab3');P(dx+7,dy+4,3,4,'#c49ab3');P(dx+2,dy+10,3,4,'#c49ab3');P(dx+7,dy+10,3,4,'#c49ab3')}P(dx+dw-3,dy+Math.floor(dh/2)+1,1,1,'#ffebb6');
 // Per-building touches.
 if(/marmalade|shop/.test(L)){for(let i=0;i<16;i++)P(dx-2+i,dy-3,1,3,i%4<2?'#ff8fb1':'#ffffff');P(dx-2,dy,16,1,'#d0607e')}
 if(/squishem/.test(L)){const sx=W0+2,sy=row(30);P(sx,sy,W1-W0-4,4,'#fdf0d8');for(let i=sx+1;i<W1-3;i+=3)P(i,sy+1,1,2,i%2?'#f39ac4':'#b47cf0')}
 if(/library/.test(L)){const bx=col(w/2)-4,by=row(46);P(bx,by,8,5,trim);P(bx+1,by+1,1,4,'#e8506a');P(bx+2,by+1,1,4,'#5fb0ff');P(bx+3,by+2,1,3,'#7fcf5a');P(bx+4,by+1,1,4,'#ffd45c');P(bx+5,by+1,2,4,'#b47cf0')}
 if(/guild/.test(L)){for(const bx of [W0+2,W1-5]){P(bx,row(30),3,8,'#d9414f');P(bx+1,row(30)+7,1,2,'#d9414f');P(bx+1,row(32),1,2,'#ffd45c')}}
 if(/pond|park/.test(L)){const fx=col(w/2)-4,fy=row(46);P(fx,fy,9,5,'#e8d6b8');P(fx+1,fy+1,5,3,'#5fb0ff');P(fx+6,fy+2,2,1,'#5fb0ff');P(fx+2,fy+2,1,1,'#ffffff')}
 // Outline.
 const out=G.map(r=>r.slice());for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)if(!G[y][x]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>G[y+b]?.[x+a]))out[y][x]=OUT;
 const c=document.createElement('canvas');c.width=gw;c.height=gh;const g=c.getContext('2d');out.forEach((r,y)=>r.forEach((cl,x)=>{if(cl){g.fillStyle=cl;g.fillRect(x,y,1,1)}}));
 bCache.set(key,c);return c;
}
// Draw at the footprint's top-left (x, y), the same as the old shapes.
function drawBuilding(ctx,label,x,y,w,hh,wall,roof){const c=building(label,w,hh,wall,roof);ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#38294b40';ctx.fillRect(Math.round(x+6),Math.round(y+hh-4),Math.round(w),10);
 ctx.drawImage(c,Math.round(x-16),Math.round(y-32),c.width*4,c.height*4);ctx.restore()}
window.catCityDecor={draw,sprite,sheet,building,drawBuilding,names:Object.keys(S)};
})();

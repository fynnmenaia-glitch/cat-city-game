/* Cat City — cat lucky blocks (giant update).
 *
 * Winged pixel-art cubes with cat ears, whiskers and a big "?" face. The
 * colour shows the rarity before you open it, and the reward matches it:
 *   Common grey · Uncommon green · Rare blue · Epic purple ·
 *   Legendary orange-yellow · Mythic red · Impossible black (very rare) ·
 *   TV Glitch (between Uncommon and Rare; only during the TV Glitch event,
 *   an old TV with static, gives glitched gear) ·
 *   Admin (only during Admin Abuse) · Playtester (only during a Playtester
 *   Admin Abuse, ticked in the owner's admin panel).
 * The rarity is fixed per block spot, so it looks the same for everyone.
 *
 * API: catCityLuckyBlocks.rarityAt(cx, cy) · draw(ctx, rarity, x, y, t)
 *      reward(rarity, seed) · list · color(rarity)
 */
(()=>{'use strict';
const LIST=[
 {key:'common',name:'Common',w:50,body:'#a7a9b4',light:'#c9cbd3',dark:'#7d7f8c',mark:'#ffffff'},
 {key:'uncommon',name:'Uncommon',w:25,body:'#5fc477',light:'#8fe0a0',dark:'#3d9a58',mark:'#ffffff'},
 {key:'glitch',name:'TV Glitch',w:0,body:'#4a4458',light:'#7a7290',dark:'#2c2836',mark:'#7ff5ff',tv:true},
 {key:'rare',name:'Rare',w:13,body:'#4a9ef0',light:'#86c3ff',dark:'#2f72c4',mark:'#ffffff'},
 {key:'epic',name:'Epic',w:7,body:'#9b5fe0',light:'#c39af5',dark:'#6f3db3',mark:'#ffffff'},
 {key:'legendary',name:'Legendary',w:3.2,body:'#ffad2e',light:'#ffd970',dark:'#d9771a',mark:'#fff7d6',sparkle:'#fff3a0'},
 {key:'mythical',name:'Mythic',w:1.3,body:'#e8423f',light:'#ff8379',dark:'#a82230',mark:'#fff0e0',sparkle:'#ffd0c0'},
 {key:'impossible',name:'Impossible',w:.08,body:'#1c1622',light:'#3a3044',dark:'#0b080e',mark:'#ff3b5c',sparkle:'#b06cff',glow:'#ff3b5c'},
 {key:'admin',name:'Admin',w:0,body:'#fff3d1',light:'#ffffff',dark:'#e0a83a',mark:'#e8506a',sparkle:'#ffd24a',crown:true},
 {key:'playtester',name:'Playtester',w:0,body:'#3fd6c6',light:'#a6fff3',dark:'#1f948f',mark:'#ffffff',sparkle:'#ff9fe0',badge:true}
];
const BY=Object.fromEntries(LIST.map(r=>[r.key,r]));
const OUT='#2a1d36';
const h=(x,y,k=0)=>{const n=Math.sin(x*127.1+y*311.7+k*74.7)*43758.5453;return n-Math.floor(n)};
function luck(){const e=window.catCityGetAdventureEvent?.()||{};const v=+e.luck;return (v>1&&e.endsAt>Date.now()/1000?Math.min(24,v):1)*(window.catCityPotions?.luck()||1)}
function stage(){return window.catCityAdminStageState||{}}
// Which rarity a block spot has. Admin and Playtester only take over spots
// while their Admin Abuse is running.
function rarityAt(cx,cy){
 const st=stage();
 if(st.active&&st.playtester&&h(cx,cy,131)<.12)return 'playtester';
 if(window.catCityGetAdventureEvent?.()?.name==='tv_glitch'&&h(cx,cy,151)<.3)return 'glitch';
 if(st.active&&h(cx,cy,97)<.12)return 'admin';
 const L=luck(),weights=LIST.map((r,i)=>r.w*(i?Math.pow(L,.8):1));
 let v=h(cx,cy,21)*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<weights.length;i++){v-=weights[i];if(v<=0)return LIST[i].key}
 return 'common';
}
// ------------------------------------------------------------------ pixel art
const GW=22,GH=22;
function build(r,closed){
 const G=Array.from({length:GH},()=>Array(GW).fill(null));
 const set=(x,y,c)=>{if(x>=0&&y>=0&&x<GW&&y<GH)G[y][x]=c};
 const rect=(x,y,w,hh,c)=>{for(let j=y;j<y+hh;j++)for(let i=x;i<x+w;i++)set(i,j,c)};
 // Cat ears.
 for(let j=0;j<4;j++){rect(3,3+j,1+j,1,r.body);rect(19-j,3+j,1+j,1,r.body)}set(4,5,'#f2a9bd');set(17,5,'#f2a9bd');set(4,6,'#f2a9bd');set(17,6,'#f2a9bd');
 if(r.crown){rect(8,2,6,2,'#ffd24a');set(8,1,'#ffd24a');set(11,1,'#ffd24a');set(13,1,'#ffd24a');set(10,2,'#e8506a');set(12,2,'#5fb0ff')}
 if(r.tv){for(let j=0;j<4;j++){set(8-j,6-j,'#9a92a8');set(13+j,6-j,'#9a92a8')}set(4,2,'#ff5a7a');set(17,2,'#7ff5ff')}
 // Cube: top face, front face with bevel.
 rect(3,7,16,3,r.light);rect(3,10,16,11,r.body);
 if(r.tv){rect(5,11,12,9,'#16222e');rect(5,11,12,1,'#2c4152');set(18,13,'#ff5a7a');set(18,15,'#ffd45c')}
 rect(3,10,16,1,r.light);rect(3,10,1,11,r.light);rect(18,10,1,11,r.dark);rect(3,20,16,1,r.dark);
 for(let i=4;i<18;i+=3)set(i,8,r.body);
 // Corner rivets.
 for(const [x,y] of [[4,11],[17,11],[4,19],[17,19]])set(x,y,r.dark);
 // "?" mark.
 const q=['.XXX.','X...X','....X','...X.','..X..','.....','..X..'];
 q.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch==='X')set(8+i,11+j,r.mark)}));
 // Whiskers poking out from the sides.
 for(const y of [14,16]){set(1,y,r.dark);set(2,y,r.dark);set(19,y,r.dark);set(20,y,r.dark)}
 // Little pink nose under the mark.
 if(!r.tv){set(10,18,'#ed9cb2');set(11,18,'#ed9cb2')}
 if(r.badge){rect(15,16,4,4,'#ffffff');set(15,17,'#3fd6c6');set(16,18,'#3fd6c6');set(17,17,'#3fd6c6');set(18,16,'#3fd6c6')}
 if(r.key==='impossible'){set(7,13,'#ff3b5c');set(14,13,'#ff3b5c')}
 // Outline.
 const out=G.map(row=>row.slice());
 for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(!G[y][x]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>G[y+b]?.[x+a]))out[y][x]=r.key==='impossible'?'#5a1530':OUT;
 return out;
}
// Wings: three flap frames, white feathers with a soft tint of the block colour.
function wing(r,frame){
 const shapes=[
  ['....XX','..XXXX','.XXXXX','XXXXX.','XXX...','X.....'],
  ['......','XXXXXX','XXXXXX','.XXXXX','..XXX.','......'],
  ['X.....','XXX...','XXXXX.','.XXXXX','..XXXX','....XX']
 ][frame];
 const G=shapes.map(row=>[...row].map(ch=>ch==='X'?(r.key==='impossible'?'#3a3044':r.tv?'#d8fbff':'#ffffff'):null));
 // Feather lines.
 for(let y=1;y<G.length;y+=2)for(let x=0;x<6;x++)if(G[y][x]&&x%2===0)G[y][x]=r.key==='impossible'?'#5c4a6e':r.light;
 const out=Array.from({length:8},()=>Array(8).fill(null));
 for(let y=0;y<6;y++)for(let x=0;x<6;x++)out[y+1][x+1]=G[y][x];
 const res=out.map(row=>row.slice());
 for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(!out[y][x]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>out[y+b]?.[x+a]))res[y][x]=OUT;
 return res;
}
const cache=new Map();
function canvasOf(grid,scale){const c=document.createElement('canvas');c.width=grid[0].length*scale;c.height=grid.length*scale;const g=c.getContext('2d');
 grid.forEach((row,y)=>row.forEach((col,x)=>{if(col){g.fillStyle=col;g.fillRect(x*scale,y*scale,scale,scale)}}));return c}
function sprite(key,frame){
 const r=BY[key]||BY.common,id=key+':'+frame;if(cache.has(id))return cache.get(id);
 const S=2,body=canvasOf(build(r),S),wl=canvasOf(wing(r,frame),S);
 const c=document.createElement('canvas');c.width=body.width+wl.width*2-8;c.height=body.height+8;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const bx=wl.width-4;
 // Left wing mirrored, right wing as drawn; both attach at the cube's upper sides.
 g.save();g.translate(bx+6,0);g.scale(-1,1);g.drawImage(wl,0,14+frame*2);g.restore();
 g.drawImage(wl,bx+body.width-6,14+frame*2);
 g.drawImage(body,bx,0);
 cache.set(id,c);return c;
}
// Body and a single wing, cached separately so the wings can swing.
const parts=new Map();
function partsOf(key){
 if(parts.has(key))return parts.get(key);
 const r=BY[key]||BY.common,p={body:canvasOf(build(r),2),wing:canvasOf(wing(r,0),2)};parts.set(key,p);return p;
}
// Wing flap: each wing swings around the point where it joins the cube, a
// quick down-beat and a slower lift, and the block bobs up on every beat.
function draw(ctx,key,x,y,t=Date.now()/1000,scale=1){
 const r=BY[key]||BY.common,{body,wing:wg}=partsOf(key);
 const speed=key==='impossible'?6:key==='common'?8:10;
 const ph=(t*speed)%(Math.PI*2),beat=Math.sin(ph),down=Math.max(0,-beat);
 const angle=beat*.55,lift=Math.round(down*3+Math.sin(t*2.6)*2);
 const bw=body.width*scale,bh=body.height*scale,ww=wg.width*scale,wh=wg.height*scale;
 const top=Math.round(y-bh+2-lift),left=Math.round(x-bw/2);
 ctx.save();ctx.imageSmoothingEnabled=false;
 // Shadow shrinks a little as the block lifts.
 const sw=Math.round((28-lift)*scale);ctx.fillStyle='#1d142833';ctx.fillRect(Math.round(x-sw/2),Math.round(y+6),sw,3);
 if(r.glow){ctx.shadowColor=r.glow;ctx.shadowBlur=14+Math.sin(t*5)*6}else if(r.sparkle){ctx.shadowColor=r.body;ctx.shadowBlur=10}
 const jy=top+28*scale;
 // Right wing.
 ctx.save();ctx.translate(left+bw-4*scale,jy);ctx.rotate(-angle);ctx.drawImage(wg,0,-wh+5*scale,ww,wh);ctx.restore();
 // Left wing (mirrored).
 ctx.save();ctx.translate(left+4*scale,jy);ctx.scale(-1,1);ctx.rotate(-angle);ctx.drawImage(wg,0,-wh+5*scale,ww,wh);ctx.restore();
 if(r.tv){
  // Glitch: occasional colour split and a sideways tear through the block.
  const g=Math.floor(t*9),glitchy=h(g,3,7)<.35,tear=glitchy?Math.round((h(g,5,1)-.5)*8*scale):0,ty=Math.floor(h(g,8,2)*bh);
  if(glitchy){ctx.globalAlpha=.55;ctx.globalCompositeOperation='lighter';ctx.filter='none';
   ctx.drawImage(body,left-2*scale,top,bw,bh);ctx.drawImage(body,left+2*scale,top,bw,bh);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1}
  ctx.drawImage(body,0,0,body.width,ty/scale,left,top,bw,ty);ctx.drawImage(body,0,ty/scale,body.width,body.height-ty/scale,left+tear,top+ty,bw,bh-ty);
  // Moving static on the screen, with the "?" flickering through it.
  const sx=left+6*2*scale,sy=top+12*2*scale,sw=10*2*scale,sh=7*2*scale,px=2*scale;
  for(let yy=0;yy<sh;yy+=px)for(let xx=0;xx<sw;xx+=px){const v=h(xx+g*31,yy,g);if(v<.45){ctx.fillStyle=v<.12?'#ffffff':v<.25?'#9ab0c0':v<.33?'#ff5a7a':'#7ff5ff';ctx.fillRect(sx+xx,sy+yy,px,px)}}
  if(h(g,1,9)<.6){ctx.fillStyle='#7ff5ff';const q=['.XXX.','X...X','....X','...X.','..X..','.....','..X..'];q.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch==='X')ctx.fillRect(left+(8+i)*2*scale,top+(11+j)*2*scale,px,px)}))}
  ctx.fillStyle='#ffffff18';ctx.fillRect(sx,sy+((g*5)%7)*px*2,sw,px);
 }else ctx.drawImage(body,left,top,bw,bh);ctx.shadowBlur=0;
 if(r.sparkle){ctx.fillStyle=r.sparkle;for(let i=0;i<3;i++){const a=t*1.7+i*2.1,px=Math.round(x+Math.cos(a)*26*scale),py=Math.round(y-24*scale+Math.sin(a*1.3)*16*scale-lift);ctx.fillRect(px,py,2,2);if((Math.floor(t*4)+i)%3===0){ctx.fillRect(px-2,py,6,2);ctx.fillRect(px,py-2,2,6)}}}
 ctx.restore();
}
// ------------------------------------------------------------------ rewards
// Better blocks give better material tiers (see gear-tiers.js).
const POOL={
 common:['wood','stone'],uncommon:['stone','iron'],rare:['steel','titanium'],epic:['crystal','emerald'],
 glitch:['glitched'],legendary:['diamond','amethyst'],mythical:['amethyst','eligeode'],impossible:['eligeode'],admin:['admin'],playtester:['playtester']
};
const SLOTS=[['weapon','Sword'],['head','Helmet'],['body','Chestplate'],['paws','Boots']];
const MAT={glitched:'Glitched',wood:'Wood',stone:'Stone',iron:'Iron',steel:'Steel',titanium:'Titanium',crystal:'Crystal',emerald:'Emerald',diamond:'Diamond',amethyst:'Amethyst',eligeode:'Eli-Geode',admin:'Admin',playtester:'Playtester'};
function reward(key,seed){
 const pool=POOL[key]||POOL.common,mat=pool[Math.floor(h(seed,7,3)*pool.length)],[type,word]=SLOTS[Math.floor(h(seed,9,5)*SLOTS.length)];
 const rarity=key==='mythical'?'mythical':key;
 const base=({glitch:150,common:80,uncommon:100,rare:130,epic:170,legendary:220,mythical:280,impossible:400,admin:600,playtester:500})[key]||100;
 return {name:(mat==='eligeode'&&type==='weapon'?'Eli-geode Blade':MAT[mat]+' '+word),type,tier:mat,rarity,color:color(key),durability:base,maxDurability:base};
}
function color(key){return (BY[key]||BY.common).light}
window.catCityLuckyBlocks={rarityAt,draw,sprite,reward,color,list:LIST,byKey:BY};
})();

/* Squishems: original Cat City plush artwork in canvas pixels.
 * Rounded ears, soft cheek patches, little paws and lively squash/stretch.
 */
(()=>{'use strict';
const palettes={
 astro:{body:'#f5aa58',head:'#f9bb69',ear:'#bd8052',patch:'#e59343',eye:'#4d423a',shine:'#fff1bb',name:'Astro'},
 galaxy:{body:'#f3a760',head:'#ffe9ca',ear:'#a16a50',patch:'#c67d46',eye:'#598b66',shine:'#e8d6ff',name:'Galaxy'},
 baby:{body:'#9b8b82',head:'#ab9a91',ear:'#775e60',patch:'#877571',eye:'#bfde73',shine:'#ffe5fa',name:'Baby'},
 skyler:{body:'#f6f6f1',head:'#fffefa',ear:'#323136',patch:'#25272d',eye:'#d8c679',shine:'#e0ccff',name:'Skylar'},
 harley:{body:'#faf8f4',head:'#fffefd',ear:'#36333b',patch:'#292b32',eye:'#d5c66c',shine:'#fce1ee',name:'Harley'},
 pumpkin:{body:'#fff6e9',head:'#fff7eb',ear:'#a6683d',patch:'#c98843',eye:'#847a53',shine:'#ffd59b',name:'Pumpkin'},
 mochi:{body:'#f4c8d7',head:'#ffe3e6',ear:'#de9cac',patch:'#e7abba',eye:'#68537a',shine:'#fff7f9',name:'Mochi Mallow'},
 berry:{body:'#d6a4e7',head:'#e7c4f9',ear:'#ba76d4',patch:'#c17add',eye:'#483d70',shine:'#ffc3e6',name:'Berrybean'},
 minty:{body:'#b4ebca',head:'#d9ffe9',ear:'#8cc6a6',patch:'#8fc4a5',eye:'#456f68',shine:'#effff9',name:'Minty Purr'},
 starpuff:{body:'#a9bcf2',head:'#d7dfff',ear:'#8a99d3',patch:'#97acdf',eye:'#5c548d',shine:'#f8eeb5',name:'Starpuff'}
};
const cache=new Map(),urls=new Map();
const GW=32,GH=37,OUTLINE='#2d2140';
// Pixel-art plush on a 32×37 grid (drawn at 2× into the 64×74 canvas). Shapes
// are filled cell by cell, so every edge is a crisp pixel step, then an
// automatic dark outline goes around the whole plush like the other art.
function art(id){
 const key=Object.prototype.hasOwnProperty.call(palettes,id)?id:'mochi';
 if(cache.has(key))return cache.get(key);
 const p=palettes[key],G=Array.from({length:GH},()=>Array(GW).fill(null));
 const set=(x,y,c)=>{if(x>=0&&y>=0&&x<GW&&y<GH)G[y][x]=c};
 const rect=(x,y,w,h,c)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)set(i,j,c)};
 const ell=(cx,cy,rx,ry,c)=>{for(let j=Math.floor(cy-ry);j<=Math.ceil(cy+ry);j++)for(let i=Math.floor(cx-rx);i<=Math.ceil(cx+rx);i++){const dx=(i+.5-cx)/rx,dy=(j+.5-cy)/ry;if(dx*dx+dy*dy<=1)set(i,j,c)}};
 const shade=(hex,f)=>{const n=parseInt(hex.slice(1,7),16),r=n>>16,g=n>>8&255,b=n&255,m=v=>Math.max(0,Math.min(255,Math.round(v*f)));return '#'+((m(r)<<16)|(m(g)<<8)|m(b)).toString(16).padStart(6,'0')};
 const bodyDark=shade(p.body,.84),headDark=shade(p.head,.86);
 // Body, stubby arms and feet.
 ell(16,25,10.5,9,p.body);
 for(let j=25;j<34;j++)for(let i=6;i<27;i++)if(G[j][i]===p.body&&(i>21||j>30))G[j][i]=bodyDark;
 ell(7.5,28.5,3.5,3,p.body);ell(24.5,28.5,3.5,3,p.body);
 ell(12.5,31.5,3.5,3,p.body);ell(20,31.5,3.5,3,p.body);
 rect(11,33,3,1,'#fdf4f0');rect(19,33,3,1,'#fdf4f0');
 // Ears with pink inners.
 // Pointy triangle ears: tip at the top, widening down into the head.
 for(let j=0;j<8;j++){const w=1+Math.floor(j*0.9);rect(8,2+j,w,1,p.ear);rect(24-w,2+j,w,1,p.ear);if(j>2&&j<7){rect(9,2+j,Math.max(0,w-2),1,'#f2a9bd');rect(24-w+1,2+j,Math.max(0,w-2),1,'#f2a9bd')}}
 // Big round head with a little lower shading.
 ell(16,16.5,11,9.5,p.head);
 for(let j=21;j<27;j++)for(let i=5;i<28;i++)if(G[j][i]===p.head)G[j][i]=headDark;
 rect(7,10,6,6,p.patch);rect(19,9,6,5,p.patch);
 // Individual markings so each Squishem matches its cat.
 if(key==='harley'){rect(7,10,7,9,'#30313b');rect(21,10,5,6,'#313039');rect(13,13,5,6,p.head);rect(13,18,7,4,p.head)}
 else if(key==='skyler'){rect(7,10,7,9,'#282830');rect(19,10,8,9,'#2a2931');rect(14,10,4,10,p.head);rect(13,20,6,3,'#24232b')}
 else if(key==='pumpkin'){rect(7,11,6,7,'#d38c42');rect(19,10,7,7,'#534a44');rect(11,14,5,5,'#e5a463');rect(15,17,6,5,'#fff8ed')}
 else if(key==='galaxy'){rect(7,11,6,4,'#d88a48');rect(20,9,6,6,'#ac7650');rect(12,17,7,4,'#fffcf4')}
 else if(key==='astro'){rect(7,11,5,5,'#db8b3e');rect(20,11,6,6,'#edb76a')}
 else if(key==='baby'){rect(8,11,6,5,'#8d7d76');rect(20,10,6,6,'#9c8b8a')}
 // Face: tall shiny eyes, nose, mouth, blush.
 rect(11,16,2,4,p.eye);rect(19,16,2,4,p.eye);set(11,16,'#ffffff');set(19,16,'#ffffff');
 rect(15,20,2,1,key==='skyler'?'#242127':'#ed9cb2');set(15,21,'#59455b');set(16,21,'#59455b');
 rect(8,21,2,1,'#ffc9d8');rect(22,21,2,1,'#ffc9d8');
 rect(15,27,2,2,p.shine);
 // Extras.
 if(key==='starpuff'){rect(14,4,4,1,'#fff3a2');rect(15,2,2,4,'#fff3a2')}
 if(key==='berry'){rect(6,12,2,2,'#f699d1');rect(24,12,2,2,'#f699d1');rect(15,4,2,3,'#6c4f8f');rect(17,4,3,1,'#7fbf6a')}
 if(key==='minty'){rect(16,3,2,6,'#7bb68a');rect(18,4,4,2,'#80c98c')}
 if(key==='mochi'){ell(16,27.5,4.5,3,'#fff4f6')}
 if(key==='galaxy'){set(10,27,'#ffffff');set(22,25,'#e8d6ff');set(18,30,'#ffffff')}
 if(key==='baby'){rect(13,4,7,2,'#ffd45c');set(13,3,'#ffd45c');set(16,3,'#ffd45c');set(19,3,'#ffd45c')}
 // Outline pass.
 const out=G.map(r=>r.slice());
 for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(!G[y][x]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>G[y+b]?.[x+a]))out[y][x]=OUTLINE;
 const c=document.createElement('canvas');c.width=64;c.height=74;const g=c.getContext('2d');
 g.fillStyle='#19123733';g.fillRect(14,70,36,3);g.fillRect(10,71,44,1);
 for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(out[y][x]){g.fillStyle=out[y][x];g.fillRect(x*2,y*2,2,2)}
 cache.set(key,c);return c;
}
// Square portrait for menus and the backpack.
function url(id){
 if(urls.has(id))return urls.get(id);
 const a=art(id),c=document.createElement('canvas');c.width=c.height=74;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(a,5,0);
 const u=c.toDataURL();urls.set(id,u);return u;
}
function draw(ctx,id,x,y,size=1,t=Date.now()/1000,held=false){
 if(!ctx?.drawImage)return;
 const original=art(id),bounce=held?Math.sin(t*7)*2:Math.sin(t*3.3)*2;
 const squash=held?.82:1+Math.sin(t*4)*.04;
 ctx.save();ctx.translate(Math.round(x),Math.round(y+bounce));
 ctx.scale(size*(2-squash),size*squash);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(original,-32,-70,64,74);ctx.restore();
}
window.catCitySquishemArt={draw,art,url,palettes};
})();
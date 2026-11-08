/* Cat City — pixel-art cave entrances.
 * The world caves were drawn as a smooth 🕳️ emoji and the Ghost 2.0 event cave as a smooth oval.
 * This draws a blocky rocky mound with a dark arched mouth instead, in the same pixel style as the trees.
 *   window.catCityPixelCave.draw(ctx, x, y, {theme:'moss'|'crystal'|'amber'|'ghost'|'plain', scale:3, t})
 * (x, y) is the bottom-centre of the cave mouth. Each theme is drawn once into a small canvas and reused.
 */
(()=>{'use strict';
const GW=34,GH=26;
const THEMES={
 plain:{rock:'#6e6584',light:'#8d84a8',hi:'#b3a9cf',dark:'#4b4360',line:'#241c30',accent:['#7a7192'],glow:null},
 moss:{rock:'#66707a',light:'#84909a',hi:'#a9b6bf',dark:'#454e58',line:'#1f2630',accent:['#5fbf55','#8be06e','#3f9a45'],glow:'#8be06e'},
 crystal:{rock:'#5f6488',light:'#7d83ab',hi:'#a6acd6',dark:'#424768',line:'#1c1f36',accent:['#7fe7ff','#c4f6ff','#5aa8ff'],glow:'#7fe7ff'},
 amber:{rock:'#7d6656',light:'#9c8270',hi:'#c4a790',dark:'#5a4638',line:'#2a1e18',accent:['#ffc23c','#ffe08a','#e08a1e'],glow:'#ffc23c'},
 ghost:{rock:'#4f4470',light:'#6a5d93',hi:'#9888c6',dark:'#352c52',line:'#170f28',accent:['#e6c6ff','#bfa0ff','#ffffff'],glow:'#e6c6ff'}
};
const cache={};
function rnd(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function build(name){
 const th=THEMES[name]||THEMES.plain,c=document.createElement('canvas');c.width=GW;c.height=GH;const g=c.getContext('2d'),r=rnd(name.length*977+13);
 const cx=GW/2-.5;
 // grid: 0 empty, 1 rock, 2 mouth
 const cell=[];for(let y=0;y<GH;y++){cell.push([]);for(let x=0;x<GW;x++){
  const dx=(x-cx)/(GW/2),dy=(y-(GH-1))/(GH-1);
  const bumpy=1+.07*Math.sin(x*1.3)+.05*Math.cos(x*.7+1);
  let v=dx*dx+dy*dy<=bumpy*bumpy*.98?1:0;
  // the arched mouth
  const mx=(x-cx)/7.5,my=(y-(GH-1))/13;if(v&&mx*mx+my*my<=1&&y>GH-14)v=2;
  cell[y].push(v)}}
 const at=(x,y)=>x<0||y<0||x>=GW||y>=GH?0:cell[y][x];
 for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const v=at(x,y);if(!v)continue;let col;
  if(v===2){// mouth: dark, a little lighter round the rim, darkest deep inside
   const rim=at(x-1,y)===1||at(x+1,y)===1||at(x,y-1)===1;const deep=(Math.abs(x-cx)<4&&y>GH-9);
   col=rim?'#2b2238':deep?'#07050c':'#120d1a';
  }else{
   const edge=!at(x-1,y)||!at(x+1,y)||!at(x,y-1)||!at(x,y+1);
   const mouthEdge=at(x-1,y)===2||at(x+1,y)===2||at(x,y+1)===2||at(x,y-1)===2;
   if(edge||mouthEdge)col=th.line;
   else{const shade=(x-cx)/(GW/2)*.6+(y/GH)*.7+(r()-.5)*.5;// lit from the top-left
    col=shade<-.15?th.hi:shade<.35?th.light:shade<.8?th.rock:th.dark;
    // little cracks and rock seams
    if(r()<.06)col=th.dark}
  }
  g.fillStyle=col;g.fillRect(x,y,1,1)}
 // stones round the base
 for(const [x,y] of [[2,GH-1],[3,GH-2],[GW-4,GH-1],[GW-3,GH-2],[9,GH-1],[GW-10,GH-1]]){if(at(x,y)!==1){g.fillStyle=th.line;g.fillRect(x,y,2,1);g.fillStyle=th.light;g.fillRect(x,y-1,2,1)}}
 // theme accents: moss tufts, crystals, amber specks, ghostly wisps
 const spots=[];for(let i=0;i<70&&spots.length<14;i++){const x=1+Math.floor(r()*(GW-2)),y=Math.floor(r()*(GH-3));if(at(x,y)===1&&at(x,y-1)!==2&&at(x,y+1)!==2)spots.push([x,y])}
 for(const [x,y] of spots){const a=th.accent;
  if(name==='crystal'){g.fillStyle=a[2];g.fillRect(x,y,1,2);g.fillStyle=a[0];g.fillRect(x,y,1,1);g.fillStyle=a[1];g.fillRect(x,y-1,1,1)}
  else if(name==='moss'){g.fillStyle=a[2];g.fillRect(x,y,2,1);g.fillStyle=a[0];g.fillRect(x,y-1,1,1);if(r()<.5){g.fillStyle=a[1];g.fillRect(x+1,y-1,1,1)}}
  else{g.fillStyle=a[Math.floor(r()*a.length)];g.fillRect(x,y,1,1)}}
 return c}
function sprite(theme){return cache[theme]||(cache[theme]=build(theme))}
function draw(ctx,x,y,o={}){const theme=THEMES[o.theme]?o.theme:'plain',sc=Math.max(1,Math.round(o.scale||3)),c=sprite(theme),w=GW*sc,h=GH*sc,t=o.t??performance.now()/1000;
 const px=Math.round(x-w/2),py=Math.round(y-h);
 ctx.save();ctx.imageSmoothingEnabled=false;
 // blocky shadow under the mound
 ctx.fillStyle='rgba(20,14,30,.35)';ctx.fillRect(px+sc*2,py+h-sc,w-sc*4,sc*2);ctx.fillRect(px+sc*5,py+h+sc,w-sc*10,sc);
 ctx.drawImage(c,px,py,w,h);
 // a soft pixel glow twinkling in the mouth
 const th=THEMES[theme];if(th.glow){const k=(Math.sin(t*2.2)+1)/2;ctx.globalAlpha=.35+.45*k;ctx.fillStyle=th.glow;
  ctx.fillRect(Math.round(x-sc*1.5),py+h-sc*5,sc,sc);ctx.fillRect(Math.round(x+sc*1),py+h-sc*7,sc,sc);ctx.globalAlpha=.25*k;ctx.fillRect(Math.round(x-sc*3),py+h-sc*3,sc,sc)}
 ctx.restore();return{w,h}}
window.catCityPixelCave={draw,sprite,themes:Object.keys(THEMES),size:[GW,GH]};
})();

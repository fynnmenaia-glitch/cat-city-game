/* Cat City event décor: temporary, world-anchored decorations for every event.
 * Events decorate town and nearby biomes without modifying saved world terrain.
 */
(()=>{'use strict';
const core=window.__catCityEngine,sq=window.catCitySquishems;
if(!core||!sq)return;
const themes={
 galaxy_gala:{name:'Galaxy Gala',icons:['🌟','🌌','✨','💫'],accent:'#beb3ff',tint:'#5b4db012',kind:'galaxy'},
 ghost_2_0:{name:'Ghost 2.0',icons:['👻','🕯️','🦇','💜'],accent:'#cdb4ef',tint:'#44316f18',kind:'ghost'},
 pumpkin_cutie:{name:'Pumpkin Cutie',icons:['🎃','🍂','🧡','🌻'],accent:'#ffa75b',tint:'#ffd09c1a',kind:'pumpkin'},
 ghost_parade:{name:'Ghost Parade',icons:['👻','🕯️','🦇'],accent:'#d8b8ee',tint:'#44316f14',kind:'ghost'},
 cherry_blossom:{name:'Cherry Blossom',icons:['🌸','🌷','🎀'],accent:'#ffacd9',tint:'#ffbada0d'},
 starfall:{name:'Starfall',icons:['🌟','⭐','✨'],accent:'#ffe3a4',tint:'#b8b0ff0f',kind:'galaxy'},
 meteor_shower:{name:'Meteor Shower',icons:['☄️','💫','✨'],accent:'#f7b6a0',tint:'#f0b89b0d',kind:'galaxy'},
 moonlight_magic:{name:'Moonlight Magic',icons:['🌙','✨','🔮'],accent:'#bdc9ff',tint:'#8b8af114',kind:'galaxy'},
 treasure_rain:{name:'Treasure Rain',icons:['💰','🪙','💎'],accent:'#ffda78',tint:'#ffed9b0c'},
 catnip_party:{name:'Catnip Party',icons:['🍀','🌿','🎉'],accent:'#a6ecb7',tint:'#9debaa0d'},
 wrangler_raid:{name:'Wrangler Raid',icons:['🧶','⚔️','🛡️'],accent:'#d4aaf0',tint:'#795ca30d'},
 lily_bloom:{name:'Lily Bloom',icons:['🪷','🌺','🌸'],accent:'#e9bae9',tint:'#e4d4ff0c'},
 glow_mushrooms:{name:'Glowing Mushrooms',icons:['🍄','✨','🌟'],accent:'#bda7f3',tint:'#b0d8e70f'},
 winter_snow:{name:'Winter Snow',icons:['❄️','☃️','✨'],accent:'#c6ecff',tint:'#c8e8ff13'},
 rainbow_day:{name:'Rainbow Day',icons:['🌈','🎈','🌟'],accent:'#ffb4d2',tint:'#ffe9ac0c'},
 firefly_festival:{name:'Firefly Festival',icons:['✨','🪲','🪷'],accent:'#d7ee9d',tint:'#d9f8a50c'},
 crystal_carnival:{name:'Crystal Carnival',icons:['💎','🔮','✨'],accent:'#9be7ee',tint:'#c2efff0e'},
 frog_festival:{name:'Frog Festival',icons:['🐸','🌿','🪷'],accent:'#a7deaa',tint:'#b8e9aa0d'},
 fish_festival:{name:'Fish Festival',icons:['🐟','🫧','🎏'],accent:'#a3dafa',tint:'#c1eafe0b'}
};
const s=core.state,unit=core.T*7;
const seed=(x,y,k=0)=>{const v=Math.sin(x*127.1+y*311.7+k*53.17)*43758.5453;return v-Math.floor(v)};
function currentTheme(){
 const e=sq.activeEvent();
 return themes[e.name]?{...themes[e.name],id:e.name,endsAt:e.endsAt}:null;
}
function visible(){
 const menu=document.getElementById('catcity-start-menu');
 return !core.bossMode&&!window.catCityTagHouse?.inside&&!window.catCitySquishemPlaces?.inside&&
  !window.catCityCaveState?.().inside&&!window.catCityTutorial?.active&&
  !menu?.classList.contains('show');
}
function decorate(g,width,height,seconds=Date.now()/1000){
 const theme=currentTheme();
 if(!theme||!visible())return 0;
 g.save();
 g.fillStyle=theme.tint;g.fillRect(0,0,width,height);
 const cx=Math.floor(s.x/unit),cy=Math.floor(s.y/unit);
 let drawn=0;
 for(let ix=cx-4;ix<=cx+4;ix++)for(let iy=cy-4;iy<=cy+4;iy++){
  const v=seed(ix,iy,theme.id.length*17);
  if(v<.57)continue;
  const wx=(ix+.55)*unit,wy=(iy+.48)*unit;
  const x=wx-s.x+width/2,y=wy-s.y+height/2;
  if(x<-65||x>width+65||y<-80||y>height+55)continue;
  const icon=theme.icons[Math.floor(seed(iy,ix,18)*theme.icons.length)];
  const bob=Math.sin(seconds*2.7+ix*3+iy)*3;
  // A floor-anchored festival display with bunting, lanterns and flags.
  g.globalAlpha=.8;
  g.fillStyle='#34234a4c';g.beginPath();g.ellipse(x,y+12,24,6,0,0,Math.PI*2);g.fill();
  g.strokeStyle=theme.accent;g.lineWidth=3;
  g.beginPath();g.moveTo(x-25,y+4);g.lineTo(x-25,y-37);g.quadraticCurveTo(x,y-45,x+25,y-37);g.lineTo(x+25,y+4);g.stroke();
  for(let n=0;n<5;n++){
   const bx=x-21+n*10,by=y-37-Math.sin(n/4*Math.PI)*5;
   g.fillStyle=n%2?'#fff1cf':theme.accent;g.beginPath();
   g.moveTo(bx-4,by);g.lineTo(bx+4,by);g.lineTo(bx,by+9);g.fill();
  }
  if(theme.kind==='ghost'){
   g.fillStyle='#bbb0ce';g.fillRect(x-14,y-11,28,24);g.fillRect(x-9,y-18,18,10);
   g.fillStyle='#786d88';g.fillRect(x-2,y-7,4,13);
  }else if(theme.kind==='pumpkin'){
   g.fillStyle='#dc9658';g.fillRect(x-15,y-10,30,21);
   g.fillStyle='#70a45b';g.fillRect(x-3,y-16,7,9);
   g.fillStyle='#4b3a36';g.fillRect(x-7,y-2,3,4);g.fillRect(x+5,y-2,3,4);
  }else if(theme.kind==='galaxy'){
   g.fillStyle='#d4c7fc';g.fillRect(x-13,y-10,26,18);
   g.fillStyle='#6b5fbb';g.fillRect(x-10,y-7,20,12);
   g.fillStyle='#fff6ae';g.fillRect(x-1,y-4,4,4);
  }else{
   g.fillStyle=theme.accent;g.fillRect(x-11,y-7,22,17);
   g.fillStyle='#fff9e3';g.fillRect(x-7,y-4,14,5);
  }
  g.globalAlpha=.98;g.font='24px system-ui';g.textAlign='center';
  g.fillText(icon,x,y-48+bob);drawn++;
 }
 // An obvious temporary event arch near the village, not just a timer icon.
 const vx=20*core.T-s.x+width/2,vy=12*core.T-s.y+height/2;
 if(vx>-120&&vx<width+120&&vy>-115&&vy<height+95){
  g.globalAlpha=.9;g.strokeStyle=theme.accent;g.lineWidth=7;
  g.beginPath();g.moveTo(vx-80,vy+36);g.lineTo(vx-80,vy-36);
  g.quadraticCurveTo(vx,vy-95,vx+80,vy-36);g.lineTo(vx+80,vy+36);g.stroke();
  g.fillStyle='#39294e';g.fillRect(vx-86,vy-76,172,35);
  g.strokeStyle=theme.accent;g.lineWidth=3;g.strokeRect(vx-86,vy-76,172,35);
  g.font='bold 12px system-ui';g.textAlign='center';g.fillStyle='#fff3d2';
  g.fillText(theme.icons[0]+' '+theme.name.toUpperCase(),vx,vy-53,161);drawn++;
 }
 // Stars, snow and festival petals drift during an event; the effect stops instantly at expiry.
 if(['galaxy','ghost','pumpkin'].includes(theme.kind)||theme.id==='winter_snow'){
  for(let i=0;i<13;i++){
   const x=(seed(i,3,theme.id.length)*width+seconds*(i%3+1)*4)%(width+40)-20;
   const y=(seed(i,9,theme.id.length)*height+seconds*(i%4+1)*3)%(height+40)-20;
   g.globalAlpha=.45;g.fillStyle=theme.accent;
   g.fillRect(x,y,3+(i%3),3+(i%3));drawn++;
  }
 }
 g.restore();return drawn;
}
const previous=core.draw;
core.draw=function(){previous();decorate(core.ctx,core.W,core.H)};
window.catCityEventDecorations={themes,currentTheme,decorate};
})();
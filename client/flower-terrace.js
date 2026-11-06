/* Cat City — Flower Terrace flowers, the rare Coconut Flower, and potions.
 *
 * Flowers grow in the Flower Terrace (internal biome key 'moonstone'): Rosy
 * Petals, Bluebells, Sunpetals and Lavender, plus a rare glowing Coconut
 * Flower (heals infected kitties, see infected-kitties.js). Walk up and press
 * E / 🐾 to pick; flowers regrow after 6 minutes.
 *
 * Potions are brewed at Luna's cauldron (stir it inside Luna's Cottage):
 *   💖 Heart Potion   2 Rosy Petal + 1 Bluebell   → +2 hearts in your next boss fight
 *   🍀 Lucky Potion   2 Sunpetal + 1 Lavender     → 5 minutes of extra lucky-block luck
 *   💪 Strength Potion 2 Lavender + 1 Rosy Petal + 1 Iron → 3 minutes of +30% damage
 *
 * API: catCityPotions.open() · catCityPotions.luck() · catCityPotions.strength()
 *      catCityPotions.takeHearts() → extra hearts for a boss fight (uses them up)
 *      catCityFlowers.spots() · catCityFlowers.pick(id)
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,T=core.T,CH=24*T,$=id=>document.getElementById(id);
s.materials=s.materials&&typeof s.materials==='object'?s.materials:{};
s.flowerPicks=s.flowerPicks&&typeof s.flowerPicks==='object'?s.flowerPicks:{};
const h=(x,y,k=0)=>{const n=Math.sin(x*127.1+y*311.7+k*53.17)*43758.5453;return n-Math.floor(n)};
const isTerrace=(cx,cy)=>{if(!cx&&!cy)return false;if(cx<0&&cy>=-1&&cy<=1)return false;const v=h(cx,cy);return !(v<.17||v>.82||v<.32)&&v>.66};
const KINDS={rose:['🌹','Rosy Petal','#ff6f8f'],bluebell:['🔔','Bluebell','#7fb3ff'],sunpetal:['🌻','Sunpetal','#ffd45c'],lavender:['💜','Lavender','#b47cf0'],coconut:['🥥','Coconut Flower','#fff6e4']};
const REGROW=6*60*1000;
function spots(){
 const out=[],cx0=Math.floor(s.x/CH),cy0=Math.floor(s.y/CH),now=Date.now();
 for(let cx=cx0-1;cx<=cx0+1;cx++)for(let cy=cy0-1;cy<=cy0+1;cy++){if(!isTerrace(cx,cy))continue;
  const list=['rose','bluebell','sunpetal','lavender'];
  for(let i=0;i<12;i++){const id='fl:'+cx+':'+cy+':'+i;if((s.flowerPicks[id]||0)>now)continue;
   out.push({id,kind:list[i%4],x:cx*CH+(2+h(cx*7+i,cy,31)*20)*T,y:cy*CH+(2+h(cx,cy*7+i,32)*20)*T})}
  if(h(cx,cy,33)<.4){const id='fl:'+cx+':'+cy+':coco';if((s.flowerPicks[id]||0)<=now)out.push({id,kind:'coconut',x:cx*CH+(4+h(cx,cy,34)*16)*T,y:cy*CH+(4+h(cx,cy,35)*16)*T})}
 }
 return out;
}
const near=()=>{let best=null,bd=46;for(const f of spots()){const d=Math.hypot(s.x-f.x,s.y-f.y);if(d<bd){bd=d;best=f}}return best};
function pick(f){
 s.flowerPicks[f.id]=Date.now()+REGROW;s.materials[f.kind]=(s.materials[f.kind]||0)+1;core.persist();
 const [ic,name]=KINDS[f.kind];core.note(f.kind==='coconut'?'🥥✨ You found a rare Coconut Flower! It can heal infected kitties.':ic+' Picked a '+name+'! ('+s.materials[f.kind]+')');
 window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'pickup',material:f.kind}}));
 // Tidy old entries.
 const now=Date.now();for(const k in s.flowerPicks)if(s.flowerPicks[k]<now)delete s.flowerPicks[k];
}
const oldDraw=core.draw;
core.draw=function(){
 oldDraw();
 if(core.bossMode||document.body.classList.contains('start-menu-open')||window.catCityCaveState?.().inside||document.body.classList.contains('in-interior'))return;
 const ctx=core.ctx,cx=s.x-core.W/2,cy=s.y-core.H/2,t=performance.now()/1000,D=window.catCityDecor,n=near();
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(const f of spots()){const x=f.x-cx,y=f.y-cy;if(x<-40||y<-40||x>core.W+40||y>core.H+40)continue;
  if(f.kind==='coconut'){
   // Easy to spot (playtest): a tall light beam, a pulsing glow and a bigger flower.
   const pulse=.5+Math.sin(t*3)*.5;ctx.fillStyle='rgba(255,246,200,'+(.10+pulse*.08)+')';ctx.fillRect(Math.round(x-10),Math.round(y-220),20,210);
   ctx.fillStyle='rgba(255,246,200,'+(.28+pulse*.18)+')';ctx.beginPath();ctx.arc(x,y-14,28+pulse*6,0,7);ctx.fill();D?.draw(ctx,'coconutFlower',x,y,4);
   ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#241832';ctx.fillStyle='#fff3a0';ctx.strokeText('🥥 Coconut Flower',x,y-56);ctx.fillText('🥥 Coconut Flower',x,y-56);
   if(Math.floor(t*2)%2){ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(x+10),Math.round(y-30),2,2)}}
  else if(D){const name={rose:'tulip',bluebell:'flowerPink',sunpetal:'flowerYellow',lavender:'flowerPink'}[f.kind];
   ctx.save();if(f.kind==='bluebell')ctx.filter='hue-rotate(200deg)';if(f.kind==='lavender')ctx.filter='hue-rotate(250deg)';D.draw(ctx,name,x,y,4);ctx.restore()}
  if(n&&n.id===f.id){ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#241832';ctx.fillStyle='#fff6e4';const lab='E / 🐾 · Pick '+KINDS[f.kind][1];ctx.strokeText(lab,x,y+16);ctx.fillText(lab,x,y+16)}}
 ctx.restore();
};
const oldInteract=core.interact;
core.interact=function(){if(!core.bossMode&&!document.body.classList.contains('in-interior')){const f=near();if(f){pick(f);return}}return oldInteract()};
if($('interact'))$('interact').onclick=()=>core.interact();
// ------------------------------------------------------------------ potions
const POTIONS=[
 {id:'heart',name:'💖 Heart Potion',need:{rose:2,bluebell:1},desc:'+2 hearts in your next boss fight'},
 {id:'luck',name:'🍀 Lucky Potion',need:{sunpetal:2,lavender:1},desc:'5 minutes of extra lucky-block luck'},
 {id:'strength',name:'💪 Strength Potion',need:{lavender:2,rose:1,iron:1},desc:'3 minutes of +30% damage'}
];
const css=document.createElement('style');css.textContent=['#cc-potions{display:none;position:fixed;inset:0;z-index:7200;background:#120b1ccc;align-items:center;justify-content:center}','#cc-potions.open{display:flex}',
 '#cc-potions>div{background:#2a1d3a;color:#fff6e4;border:3px solid #b47cf0;padding:14px;width:min(420px,92vw);max-height:86dvh;overflow:auto;font:13px system-ui}',
 '#cc-potions h3{margin:0 0 6px;color:#e0c8ff}','#cc-potions .p{border:2px solid #4a3a5e;padding:8px;margin:6px 0;background:#3a2a4e}','#cc-potions .p b{display:block}','#cc-potions small{color:#d8c8f0}',
 '#cc-potions button{margin:6px 4px 0 0;padding:6px 10px;min-height:34px;background:#c8a6ff;color:#2a1d36;border:2px solid #fff}','#cc-potions button:disabled{opacity:.45}'].join('');document.head.append(css);
const box=document.createElement('div');box.id='cc-potions';box.innerHTML='<div role="dialog" aria-label="Luna’s cauldron"></div>';document.body.append(box);
const card=box.firstChild;
const has=need=>Object.entries(need).every(([k,v])=>(s.materials[k]||0)>=v);
const label=k=>(KINDS[k]?KINDS[k][0]+' '+KINDS[k][1]:k==='iron'?'⛓️ Iron':k);
function render(){
 const now=Date.now();card.innerHTML='<h3>🧪 Luna’s Cauldron</h3><small>Brew potions from Flower Terrace flowers. Your flowers: '+Object.keys(KINDS).map(k=>label(k)+' '+(s.materials[k]||0)).join(' · ')+'</small>';
 for(const p of POTIONS){const d=document.createElement('div');d.className='p';d.innerHTML='<b>'+p.name+'</b><small>'+p.desc+' · needs '+Object.entries(p.need).map(([k,v])=>v+' '+label(k)).join(', ')+'</small>';
  const b=document.createElement('button');b.type='button';b.textContent='🫧 Brew';b.disabled=!has(p.need);b.onclick=()=>brew(p);d.append(b);card.append(d)}
 const active=[];if((s.potionHearts||0)>0)active.push('💖 +'+s.potionHearts+' hearts ready');if((s.potionLuckUntil||0)>now)active.push('🍀 luck '+Math.ceil((s.potionLuckUntil-now)/60000)+' min');if((s.potionStrengthUntil||0)>now)active.push('💪 strength '+Math.ceil((s.potionStrengthUntil-now)/60000)+' min');
 const a=document.createElement('small');a.textContent=active.length?'Active: '+active.join(' · '):'No potions active.';card.append(a);
 const c=document.createElement('button');c.type='button';c.textContent='✕ Close';c.onclick=()=>box.classList.remove('open');card.append(document.createElement('br'),c);
}
function brew(p){if(!has(p.need))return;for(const [k,v] of Object.entries(p.need))s.materials[k]-=v;const now=Date.now();
 if(p.id==='heart')s.potionHearts=Math.min(4,(s.potionHearts||0)+2);
 if(p.id==='luck')s.potionLuckUntil=Math.max(now,s.potionLuckUntil||0)+5*60000;
 if(p.id==='strength')s.potionStrengthUntil=Math.max(now,s.potionStrengthUntil||0)+3*60000;
 core.persist();core.note('🫧 You brewed a '+p.name+'! '+p.desc+'.');render()}
window.catCityPotions={open(){render();box.classList.add('open')},
 luck:()=>(s.potionLuckUntil||0)>Date.now()?2:1,strength:()=>(s.potionStrengthUntil||0)>Date.now()?1.3:1,
 takeHearts(){const n=s.potionHearts||0;if(n){s.potionHearts=0;core.persist();core.note('💖 Your Heart Potion gives you +'+n+' hearts!')}return n}};
// "Coconut Flower nearby!" hint when one is close but off screen.
let hinted='';setInterval(()=>{if(core.bossMode||window.catCityCaveState?.().inside)return;const c=spots().find(f=>f.kind==='coconut'&&Math.hypot(s.x-f.x,s.y-f.y)<700);if(c&&hinted!==c.id){hinted=c.id;core.note('🥥✨ A Coconut Flower is nearby! Look for the beam of light.')}},2500);
window.catCityFlowers={spots,pick,kinds:KINDS};
})();

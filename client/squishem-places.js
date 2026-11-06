/* Limited-time event locations for Squishems.
 * Ghost 2.0 => temporary ghost caves containing Skylar.
 * Pumpkin Cutie => temporary pumpkin huts containing Pumpkin.
 * Interiors eject everyone as soon as the event expires, without deleting
 * earned plushies or altering the character's saved overworld position.
 */
(()=>{'use strict';
const core=window.__catCityEngine,plush=window.catCitySquishems;
if(!core||!plush)return;
const s=core.state,T=core.T,CHUNK=24*T,$=id=>document.getElementById(id);
const contexts={ghost_2_0:{kind:'ghost',id:'skyler',name:'Ghost 2.0 Cave',emoji:'👻'},
 pumpkin_cutie:{kind:'pumpkin',id:'pumpkin',name:'Pumpkin Cutie Hut',emoji:'🎃'}};
const hash=(a,b,c=0)=>{const n=Math.sin(a*127.1+b*311.7+c*53.17)*43758.5453;return n-Math.floor(n)};
let inside=false,kind='',anchor=null,last=0,raf=0,x=112,y=278,walked=0,modeEvent='',finished=false;
const pressed=new Set();
function active(){const ev=plush.activeEvent();return contexts[ev.name]?ev.name:''}
function valid(){return inside&&active()===modeEvent}
function closedState(){return core.bossMode||window.catCityTagHouse?.inside||window.catCityCaveState?.().inside||
 window.catCityPCHouse?.inside||window.catCityTutorial?.active||
 $('catcity-start-menu')?.classList.contains('show')}
function portals(){
 const e=active();if(!e||closedState())return [];
 const cx=Math.floor(s.x/CHUNK),cy=Math.floor(s.y/CHUNK),out=[];
 for(let xx=cx-1;xx<=cx+1;xx++)for(let yy=cy-1;yy<=cy+1;yy++){
  if(xx===0&&yy===0)continue;
  const r=hash(xx,yy,e.length*13);
  if(r<.36){
   const id=e+':'+xx+','+yy;
   out.push({id,kind:contexts[e].kind,event:e,
    x:xx*CHUNK+(6+hash(xx,yy,19)*13)*T,
    y:yy*CHUNK+(6+hash(xx,yy,47)*13)*T});
  }
 }
 // A reliable event entrance on the edge of the starter village.
 const x=e==='ghost_2_0'?31*T:32*T,y=e==='ghost_2_0'?18*T:26*T;
 out.push({id:e+':starter',kind:contexts[e].kind,event:e,x,y});
 return out;
}
function nearby(){
 if(inside||closedState())return null;
 let nearest=null,d=88;
 for(const p of portals()){const dist=Math.hypot(s.x-p.x,s.y-p.y);if(dist<d){nearest=p;d=dist}}
 return nearest;
}
const css=document.createElement('style');css.id='cc-sq-places-style';
css.textContent=[
 '#cc-sq-place{display:none;position:fixed;inset:0;z-index:9000;background:linear-gradient(#1d193c,#392547);padding:6px;align-items:center;justify-content:center;flex-direction:column;gap:6px;touch-action:pan-y!important}',
 '#cc-sq-place.open{display:flex}',
 '#cc-sq-place h2{font:bold 20px system-ui;margin:3px;color:#fff4d0;text-align:center}',
 '#cc-sq-place>p{margin:0;font:12px/1.5 system-ui;color:#fff1e1;text-align:center;max-width:94vw}',
 '#cc-sq-place-canvas{width:min(96vw,770px);max-height:58dvh;height:auto;object-fit:contain;image-rendering:pixelated;border:4px solid #d9b9ec;border-radius:15px;background:#3b2d50}',
 '#cc-sq-place-controls{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;width:96vw}',
 '#cc-sq-place-controls button{min-height:44px;min-width:50px;padding:7px 11px;border:2px solid #fff2dd;border-radius:12px;background:#dbd0fa;color:#352544;font:bold 13px system-ui;touch-action:manipulation!important}',
 '#cc-sq-place-action{background:#fff0ac!important}',
 '#cc-sq-place-exit{background:#f2d1db!important}',
 '#cc-sq-place-message{min-height:22px;font:bold 13px system-ui;color:#fff0a9;text-align:center}',
 'body.cc-in-squishem-event #mobile,body.cc-in-squishem-event #interact,body.cc-in-squishem-event #sprint,body.cc-in-squishem-event #cc-hotbar-ten{pointer-events:none!important}',
 '@media(max-width:600px){#cc-sq-place h2{font-size:17px}#cc-sq-place-canvas{max-height:43dvh}#cc-sq-place-controls{gap:3px}#cc-sq-place-controls button{min-height:41px;min-width:44px;padding:6px}}'
].join('\n');document.head.append(css);
const root=document.createElement('div');root.id='cc-sq-place';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Temporary Squishem event location');
root.innerHTML='<h2 id="cc-sq-place-title"></h2><p id="cc-sq-place-description"></p><canvas id="cc-sq-place-canvas" width="680" height="380"></canvas><div id="cc-sq-place-controls"></div><div id="cc-sq-place-message"></div>';
document.body.append(root);
const canvas=$('cc-sq-place-canvas'),ctx=canvas.getContext('2d');
function msg(text){$('cc-sq-place-message').textContent=text}
function enter(portal){
 if(!portal||inside||active()!==portal.event||closedState())return false;
 inside=true;kind=portal.kind;modeEvent=portal.event;
 anchor={x:s.x,y:s.y,portalId:portal.id};
 x=112;y=278;walked=0;finished=false;pressed.clear();last=performance.now();
 root.classList.add('open');document.body.classList.add('cc-in-squishem-event');
 const ghost=kind==='ghost';
 $('cc-sq-place-title').textContent=(ghost?'👻 GHOST 2.0 CAVE':'🎃 PUMPKIN CUTIE HUT')+' · EVENT ONLY';
 $('cc-sq-place-description').textContent=ghost?
   'Find the Skylar Squishem deep inside the ghost cave. Walk towards the glowing plushie, then press E / 🐾. The cave closes when Ghost 2.0 ends.':
   'Walk through this enchanted pumpkin hut towards the Pumpkin Squishem, then press E / 🐾. The hut disappears when Pumpkin Cutie ends.';
 msg('Walk towards the glowing plushie!');
 window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'enter_event',kind,event:modeEvent}}));
 raf=requestAnimationFrame(draw);return true;
}
function leave(expired=false){
 if(!inside)return;
 inside=false;root.classList.remove('open');document.body.classList.remove('cc-in-squishem-event');
 pressed.clear();cancelAnimationFrame(raf);
 if(anchor){s.x=anchor.x;s.y=anchor.y}
 core.persist();
 msg('');modeEvent='';
 core.note(expired?'⏰ Event ended! You were safely returned outside; event entrances disappeared.':'🌷 Returned to Cat City!');
}
function target(){return kind==='ghost'?{x:537,y:145,id:'skyler'}:{x:535,y:173,id:'pumpkin'}}
function claim(){
 if(!inside)return false;
 if(!valid()){leave(true);return false}
 const p=target();
 if(Math.hypot(x-p.x,y-p.y)>80){msg('Walk a little closer to the Squishem first!');return false}
 if(plush.owned(p.id)){msg('You already own this Squishem! Leave the event location to explore.');plush.squish();return true}
 const won=plush.addPlush(p.id,kind==='ghost'?'Ghost 2.0 Cave':'Pumpkin Cutie Hut');
 if(won){finished=true;msg('🧸 SQUISH! '+p.id.charAt(0).toUpperCase()+p.id.slice(1)+' is yours forever!');}
 return won;
}
function action(){
 if(!inside)return;
 if(!valid()){leave(true);return}
 claim();
}
const panel=$('cc-sq-place-controls');
function btn(label,fn,id){
 const b=document.createElement('button');b.type='button';b.textContent=label;if(id)b.id=id;b.onclick=fn;panel.append(b);return b;
}
for(const [label,key] of [['⬅','left'],['⬆','up'],['⬇','down'],['➡','right']]){
 const b=btn(label,()=>{});b.setAttribute('aria-label','Walk '+key);
 b.addEventListener('pointerdown',e=>{e.preventDefault();pressed.add(key);b.setPointerCapture?.(e.pointerId)});
 for(const event of ['pointerup','pointercancel','lostpointercapture','pointerleave'])b.addEventListener(event,()=>pressed.delete(key));
}
btn('🐾 Pick Up / E',action,'cc-sq-place-action');
btn('🚪 Leave',()=>leave(false),'cc-sq-place-exit');
const movements={w:'up',a:'left',s:'down',d:'right',arrowup:'up',arrowleft:'left',arrowdown:'down',arrowright:'right'};
window.addEventListener('keydown',e=>{
 if(!inside||e.target?.closest?.('input,textarea,select,[contenteditable]'))return;
 const key=String(e.key||'').toLowerCase();
 if(key==='e'||key===' '){e.preventDefault();e.stopImmediatePropagation();action();return}
 if(key==='escape'){e.preventDefault();e.stopImmediatePropagation();leave(false);return}
 if(movements[key]){e.preventDefault();e.stopImmediatePropagation();pressed.add(movements[key])}
},true);
window.addEventListener('keyup',e=>{if(inside)pressed.delete(movements[String(e.key||'').toLowerCase()])},true);
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function caption(text,x,y,size=16){ctx.font='bold '+size+'px system-ui';ctx.textAlign='center';ctx.strokeStyle='#291c36';ctx.lineWidth=3;ctx.strokeText(text,x,y);ctx.fillStyle='#fff6d7';ctx.fillText(text,x,y)}
function drawCave(time){
 const t=time/1000;
 rect(0,0,680,380,'#241e3c');
 for(let i=0;i<18;i++)for(let j=0;j<10;j++){
  const wave=Math.sin(i*2.7+j*.8+t*.5);
  rect(i*40,j*38,39,37,wave>.3?'#40345b':'#35304b');
 }
 // The glowing winding cave walkway is playable (no collision traps).
 rect(60,210,575,125,'#696080');rect(280,100,310,148,'#696080');
 rect(85,232,490,70,'#857495');rect(330,114,227,122,'#857495');
 for(let n=0;n<17;n++){
  const gx=(n*97)%650,gy=18+(n*53)%320;
  ctx.fillStyle=n%3===0?'#a9f0ef':'#bd9de5';
  ctx.beginPath();ctx.arc(gx,gy,2+Math.sin(t*2+n),0,Math.PI*2);ctx.fill();
 }
 for(const [px,py] of [[181,141],[280,66],[615,96],[140,341]]){
  rect(px,py,15,23,'#c1adf3');rect(px+3,py+4,9,9,'#e7d4ff');
 }
 caption('👻 BOO! GHOST CAVE',341,38,19);
}
function drawHut(time){
 rect(0,0,680,380,'#efc8aa');rect(0,0,680,200,'#eac5a7');
 for(let xx=0;xx<680;xx+=66)for(let yy=199;yy<380;yy+=56)rect(xx,yy,64,54,(xx/66+yy/56)%2?'#c48f73':'#d8a37f');
 rect(35,65,120,150,'#b47b50');rect(42,73,106,138,'#edd0a7');
 rect(490,70,115,115,'#cc8a50');rect(499,77,98,101,'#ffe1aa');
 rect(246,95,173,30,'#8f5d4d');rect(261,125,145,54,'#b07958');
 caption('🎃 PUMPKIN CUTIE HUT',341,41,20);
 const t=time/1000;
 for(let i=0;i<6;i++){
  const px=90+i*102,py=125+Math.abs(Math.sin(t*3+i))*(35+5*i);
  ctx.font='27px system-ui';ctx.textAlign='center';ctx.fillText('🎃',px,py);
 }
}
function draw(timestamp){
 if(!inside)return;
 if(!valid()){leave(true);return}
 const dt=Math.min(.07,Math.max(.004,(timestamp-last)/1000));last=timestamp;
 const dx=Number(pressed.has('right'))-Number(pressed.has('left')),dy=Number(pressed.has('down'))-Number(pressed.has('up'));
 const speed=180*dt/Math.max(1,Math.hypot(dx,dy));
 x=Math.max(40,Math.min(635,x+dx*speed));y=Math.max(75,Math.min(339,y+dy*speed));walked+=Math.hypot(dx,dy)*speed;
 if(kind==='ghost')drawCave(timestamp);else drawHut(timestamp);
 const targetPlush=target();
 if(!finished&&!plush.owned(targetPlush.id)){
  ctx.fillStyle='#ffe0ff99';ctx.beginPath();ctx.ellipse(targetPlush.x,targetPlush.y,35,16,0,0,Math.PI*2);ctx.fill();
  plush.draw(ctx,targetPlush.id,targetPlush.x,targetPlush.y+5,1.65,timestamp/1000);
  caption('🧸 '+targetPlush.id.toUpperCase()+' SQUISHEM',targetPlush.x,targetPlush.y-120,13);
  if(Math.hypot(x-targetPlush.x,y-targetPlush.y)<80)caption('E / 🐾 to collect',targetPlush.x,targetPlush.y+40,13);
 }
 const cat=core.cats[s.cat]||core.cats[0];
 const coat=cat.coat||'#e8a057';
 rect(x-14,y-31,27,26,coat);rect(x-16,y-44,31,22,coat);
 rect(x-15,y-52,9,13,coat);rect(x+7,y-52,9,13,coat);
 rect(x-7,y-38,5,5,cat.eye||'#433d4d');rect(x+4,y-38,5,5,cat.eye||'#433d4d');
 rect(x-4,y-23,9,14,cat.belly||'#f7ddbe');
 rect(x-12,y-6,8,11,coat);rect(x+5,y-6,8,11,coat);
 caption('YOU',x,y-56,13);
 raf=requestAnimationFrame(draw);
}
const oldInteract=core.interact;core.interact=function(){
 if(inside){action();return}
 const p=nearby();
 if(p){enter(p);return}
 return oldInteract();
};
if($('interact'))$('interact').onclick=()=>core.interact();
function drawPortals(){
 if(inside||closedState())return;
 const g=core.ctx,W=core.W,H=core.H,t=Date.now()/1000;
 g.save();g.textAlign='center';
 for(const p of portals()){
  const x=p.x-s.x+W/2,y=p.y-s.y+H/2;
  if(x<-90||x>W+90||y<-100||y>H+95)continue;
  const ghost=p.kind==='ghost';
  g.fillStyle='#34264888';g.beginPath();g.ellipse(x,y+22,56,17,0,0,Math.PI*2);g.fill();
  if(ghost){
   g.fillStyle='#251b43';g.beginPath();g.ellipse(x,y-17,35,48,0,0,Math.PI*2);g.fill();
   g.strokeStyle='#e6c6ff';g.lineWidth=6;g.beginPath();g.ellipse(x,y-17,38,50,0,0,Math.PI*2);g.stroke();
   g.globalAlpha=.7;g.font='29px system-ui';g.fillText('👻',x,y-10+Math.sin(t*3)*5);g.globalAlpha=1;
  }else{
   g.fillStyle='#a66c42';g.fillRect(x-43,y-33,86,74);
   g.fillStyle='#f3b675';g.beginPath();g.moveTo(x-52,y-30);g.lineTo(x,y-74);g.lineTo(x+52,y-30);g.fill();
   g.fillStyle='#583c37';g.fillRect(x-13,y-7,26,48);
   g.font='29px system-ui';g.fillText('🎃',x,y-38+Math.sin(t*2)*4);
  }
  g.font='bold 11px system-ui';g.fillStyle='#fff9e3';g.strokeStyle='#39254b';g.lineWidth=3;
  const label=ghost?'GHOST 2.0 CAVE':'PUMPKIN HUT';
  g.strokeText(label,x,y+48);g.fillText(label,x,y+48);
  if(Math.hypot(s.x-p.x,s.y-p.y)<95){g.strokeText('🐾 E · Enter',x,y+65);g.fillText('🐾 E · Enter',x,y+65)}
 }
 g.restore();
}
const priorDraw=core.draw;core.draw=function(){priorDraw();drawPortals()};
setInterval(()=>{if(inside&&!valid())leave(true)},350);
window.catCitySquishemPlaces={enter,leave,portals,nearby,claim,get inside(){return inside},get kind(){return kind},
 get event(){return modeEvent},get position(){return{x,y}},testMove(px,py){x=px;y=py}};
})();
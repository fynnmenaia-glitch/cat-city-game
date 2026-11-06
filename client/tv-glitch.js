/* Cat City — the TV Glitch event (giant update).
 *
 * While the "tv_glitch" event runs (owner admin panel or a vote):
 *  - Big glitchy TVs appear around the village and the wild. Walk up and press
 *    E / 🐾 to go inside one: a glitchy TV-studio room with a glitch chest.
 *  - Each TV's chest gives a Glitched piece you don't have yet (Sword, Helmet,
 *    Chestplate, Boots), so four TVs make a full set. TV Glitch lucky blocks
 *    also spawn (lucky-blocks.js).
 *  - "Static Showtime" (an original theatrical TV-villain song) plays.
 * After the event: if you own the full Glitched set, the instrumental version
 * plays instead of the normal music. Turn that off in Settings.
 *
 * API: catCityTVGlitch.active() · .tvs() · .fullSet() · .enterTV(id)
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,T=core.T,$=id=>document.getElementById(id);
const active=()=>{const e=window.catCityGetAdventureEvent?.()||window.catCityAdminEvent||{};return e.name==='tv_glitch'&&Number(e.endsAt)>Date.now()/1000};
const eventKey=()=>{const e=window.catCityGetAdventureEvent?.()||window.catCityAdminEvent||{};return 'tv:'+Math.floor(Number(e.endsAt)||0)};
const TVS=[{id:'west',x:-6*T,y:9*T},{id:'east',x:54*T,y:26*T},{id:'north',x:24*T,y:-7*T},{id:'south',x:9*T,y:42*T},{id:'wild',x:-32*T,y:17*T},{id:'hills',x:72*T,y:-12*T}];
const PIECES=[['weapon','Glitched Sword'],['head','Glitched Helmet'],['body','Glitched Chestplate'],['paws','Glitched Boots']];
s.tvLooted=s.tvLooted&&typeof s.tvLooted==='object'?s.tvLooted:{};
const owned=type=>(s.adventureItems||[]).some(it=>it&&it.tier==='glitched'&&it.type===type);
const fullSet=()=>PIECES.every(([type])=>owned(type));
// ------------------------------------------------------------------ music
const SHOW={bpm:132,chords:['F#m','D','E','C#7','F#m','D','Bm','C#7'],lead:'square',arp:[0,1,2,1],drums:'k..k.s.kk..k.s..',hat:'h.hhh.hhh.hhh.hh',bassOct:true,glitch:true,sting:true,static:true,
 mel:`C#5 C#5 . F#5 - . A5 - G#5 - F#5 - E5 - F#5 - | D5 - - - F#5 - A5 - D6 - C#6 - B5 - A5 - | B5 - - - G#5 - E5 - G#5 - B5 - E6 - - - | F5 - - - G#5 - C#6 - F6 - - - - - . . |
  F#6 - . F#6 - . E6 - C#6 - A5 - F#5 - A5 - | F#6 - - - D6 - A5 - F#5 - D6 - C#6 - B5 - | B5 - D6 - F#6 - - - E6 - D6 - C#6 - B5 - | C#6 - - - - - F5 - G#5 - C#6 - - - . .`};
const REWARD={...SHOW,name:'Static Showtime (instrumental)',lead:'triangle',glitch:false,sting:false,drums:'k...s...k.k.s...',hat:'..h...h...h...h.'};
const addSongs=()=>{const st=window.catCitySoundtrack;if(!st||st.songs.static_event)return;st.extra('static_event',{...SHOW,name:'Static Showtime'});st.extra('static_reward',REWARD)};
let pref=true;try{pref=localStorage.getItem('catcity_glitch_music')!=='off'}catch(e){}
setInterval(()=>{addSongs();
 const menu=$('catcity-start-menu')?.classList.contains('show'),boss=core.bossMode;
 window.catCitySoundtrackOverride=(menu||boss)?null:active()?'static_event':(fullSet()&&pref?'static_reward':null);
},700);
// Settings switch.
function addSetting(){const panel=$('settings-panel');if(!panel||$('cc-glitch-music'))return;
 const row=document.createElement('label');row.style.cssText='display:flex;gap:8px;align-items:center;margin:8px 0;font-size:13px';
 row.innerHTML='<input type="checkbox" id="cc-glitch-music" style="width:auto;min-height:0;margin:0"> 📺 Play "Static Showtime" when I own the full Glitched set';
 (panel.querySelector('.settings-section')||panel).append(row);const box=$('cc-glitch-music');box.checked=pref;
 box.onchange=()=>{pref=box.checked;try{localStorage.setItem('catcity_glitch_music',pref?'on':'off')}catch(e){}core.note(pref?'📺 Static Showtime will play with your full Glitched set.':'🎵 Normal music, even with the Glitched set.')}}
addSetting();setInterval(addSetting,2000);
// ------------------------------------------------------------------ TVs in the world
function drawTV(ctx,x,y,t,id){
 const R=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x+a),Math.round(y+b),w,h)},gl=Math.floor(t*9+id.length)%11===0?Math.round((Math.random()-.5)*10):0;
 R(-62,-4,124,10,'#2a1d3655');
 // Antennas.
 for(let i=0;i<9;i++){R(-8-i*3,-150-i*3,3,3,'#9a92a8');R(6+i*3,-150-i*3,3,3,'#9a92a8')}R(-36,-180,6,6,'#ff5a7a');R(32,-180,6,6,'#7ff5ff');
 // Wooden case, screen, knobs and legs.
 R(-64,-150,128,140,'#2a1d36');R(-60,-146,120,132,'#8f6643');R(-60,-146,120,6,'#b98557');R(-60,-20,120,6,'#6b4a33');
 R(-52+gl,-136,80,100,'#16222e');
 for(let yy=0;yy<100;yy+=4)for(let xx=0;xx<80;xx+=4){const v=Math.sin((xx*7.3+yy*3.1+Math.floor(t*14)*13.7))*43758.5453;const r=v-Math.floor(v);if(r<.5)R(-52+xx+gl,-136+yy,4,4,r<.12?'#ffffff':r<.25?'#9ab0c0':r<.33?'#ff5a7a':'#7ff5ff')}
 R(-52,-136+((Math.floor(t*40)%25)*4),80,3,'#ffffff33');
 R(36,-130,16,16,'#2a1d36');R(38,-128,12,12,'#ffd45c');R(36,-104,16,16,'#2a1d36');R(38,-102,12,12,'#d9a877');
 R(38,-70,12,4,Math.floor(t*2)%2?'#ff3b5c':'#5a1f2a');
 R(-50,-10,8,14,'#2a1d36');R(42,-10,8,14,'#2a1d36');
 ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#12091c';ctx.fillStyle='#7ff5ff';ctx.strokeText('📺 GLITCH TV',x,y-188);ctx.fillText('📺 GLITCH TV',x,y-188);
}
const nearTV=()=>active()?TVS.find(v=>Math.hypot(s.x-v.x,s.y-(v.y-20))<90):null;
const oldDraw=core.draw;
core.draw=function(){
 oldDraw();if(!active()||core.bossMode||document.body.classList.contains('start-menu-open')||window.catCityCaveState?.().inside||document.body.classList.contains('in-interior'))return;
 const ctx=core.ctx,cx=s.x-core.W/2,cy=s.y-core.H/2,t=performance.now()/1000,n=nearTV();
 for(const v of TVS){const x=v.x-cx,y=v.y-cy;if(x<-120||y<-220||x>core.W+120||y>core.H+60)continue;drawTV(ctx,x,y,t,v.id);
  const done=s.tvLooted[eventKey()+':'+v.id];
  if(n===v){ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#12091c';ctx.fillStyle='#fff6e4';const m=done?'📺 Already looted · E / 🐾 Visit':'E / 🐾 · Jump into the TV!';ctx.strokeText(m,x,y+22);ctx.fillText(m,x,y+22)}}
};
// Glitchy screen flash when you go in.
function flash(){const f=document.createElement('div');f.style.cssText='position:fixed;inset:0;z-index:9500;pointer-events:none;background:repeating-linear-gradient(0deg,#ff3b5c55 0 3px,#7ff5ff55 3px 6px,#00000088 6px 9px);mix-blend-mode:screen;transition:opacity .5s';document.body.append(f);setTimeout(()=>f.style.opacity='0',220);setTimeout(()=>f.remove(),800)}
let currentTV=null;
function enterTV(id){const I=window.catCityInteriors;if(!I||!active())return;currentTV=id;flash();I.enter('tv')}
const oldInteract=core.interact;
core.interact=function(){if(!core.bossMode){const v=nearTV();if(v){enterTV(v.id);return}}return oldInteract()};
if($('interact'))$('interact').onclick=()=>core.interact();
// ------------------------------------------------------------------ the inside of a TV
function lootChest(){
 const key=eventKey()+':'+currentTV;const K=window.catCityInteriors.kit;
 if(s.tvLooted[key]){K.say('📺 This TV\'s chest is empty. Try another TV!');return}
 s.tvLooted[key]=true;
 const missing=PIECES.filter(([type])=>!owned(type)),[type,name]=(missing.length?missing:PIECES)[Math.floor(Math.random()*(missing.length||PIECES.length))];
 const item={id:'glitch:'+type+':'+Date.now().toString(36),name,type,tier:'glitched',rarity:'glitch',color:'#7ff5ff',durability:180,maxDurability:180};
 s.adventureItems=Array.isArray(s.adventureItems)?s.adventureItems:[];s.adventureItems.push(item);window.catCityInventoryItemAdded?.(item);
 s.fish=(Number(s.fish)||0)+15;core.persist();
 const have=PIECES.filter(([t])=>owned(t)).length;
 K.say('📺✨ You got '+name+'! (+15 🐟) Glitched set: '+have+'/4'+(have===4?' — FULL SET! 🎵':''));
 core.note('📺 '+name+'! Glitched set '+have+'/4');
}
function setupRoom(){
 const I=window.catCityInteriors;if(!I||I.rooms.includes('tv'))return!!I;const K=I.kit,{R,item,LW,LH,FLOOR_TOP}=K;
 I.addRoom('tv',{title:'📺 Inside the Glitch TV',
  bg(){const t=performance.now()/1000;
   R(0,0,LW,LH,'#12091c');
   // Studio back wall with flickering stage lights.
   for(let x=0;x<LW;x+=20)R(x,0,18,FLOOR_TOP-6,(x/20+Math.floor(t*3))%3?'#2c1f40':'#3a2a52');
   for(let i=0;i<8;i++)R(12+i*40,6,8,6,(Math.floor(t*4)+i)%2?'#ffd45c':'#7a5a20');
   // Checkered studio floor in TV colours.
   for(let y=FLOOR_TOP;y<LH;y+=12)for(let x=0;x<LW;x+=12)R(x,y,12,12,((x+y)/12)%2?'#3a2a4e':'#2a1d3a');
   // Static scanlines and the odd glitch tear.
   R(0,(Math.floor(t*60)%LH),LW,2,'#7ff5ff22');if(Math.floor(t*8)%9===0)R(0,Math.random()*LH,LW,4,'#ff3b5c33');
   R(146,LH-8,28,8,'#7ff5ff');R(148,LH-6,24,4,'#c8fbff')},
  items:()=>[
   item({x:110,y:8,w:100,h:46,draw:(t)=>{R(108,6,104,50,'#2a1d36');R(112,10,96,40,'#16222e');for(let yy=0;yy<40;yy+=4)for(let xx=0;xx<96;xx+=4){const v=Math.sin(xx*7.3+yy*3.1+Math.floor(t*14)*13.7)*43758.5453,r=v-Math.floor(v);if(r<.45)R(112+xx,10+yy,4,4,r<.1?'#fff':r<.25?'#9ab0c0':'#7ff5ff')}},solid:false,wall:true}),
   item({x:146,y:104,w:28,h:20,draw:(t)=>{const open=s.tvLooted[eventKey()+':'+currentTV];R(146,104,28,20,'#2a1d36');R(148,106,24,16,open?'#3a3446':'#4a4458');R(148,106,24,5,open?'#2c2836':'#7ff5ff');R(158,112,4,5,'#ffd45c');if(!open&&Math.floor(t*4)%2)R(150,100,2,2,'#ffffff')},
    label:'Open the glitch chest',use:lootChest,useX:160,useY:130}),
   item({x:30,y:120,w:18,h:20,draw:()=>{R(30,120,18,20,'#2a1d36');R(32,122,14,16,'#ff5a7a');R(34,124,10,4,'#ffb0c0')}}),
   item({x:272,y:120,w:18,h:20,draw:()=>{R(272,120,18,20,'#2a1d36');R(274,122,14,16,'#7ff5ff');R(276,124,10,4,'#c8fbff')}})
  ]});
 return true;
}
const iv=setInterval(()=>{if(setupRoom())clearInterval(iv)},500);
window.catCityTVGlitch={active,tvs:()=>active()?TVS:[],fullSet,enterTV};
})();

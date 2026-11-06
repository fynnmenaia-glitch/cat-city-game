/* Enterable PC House. Does not move/swap the player's saved world coordinates. */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const $=id=>document.getElementById(id),T=core.T;
const css=document.createElement('style');
css.textContent=[
 '#cc-pc-house{display:none;position:fixed;inset:0;z-index:5950;background:#211733;align-items:center;justify-content:center;flex-direction:column;padding:8px;touch-action:pan-y}',
 '#cc-pc-house.open{display:flex}',
 '#cc-pc-house header{font:bold 19px system-ui;color:#fff6c9;padding:7px}',
 '#cc-pc-canvas{width:min(96vw,850px);height:min(65dvh,520px);object-fit:contain;image-rendering:pixelated;border:4px solid #eddaff;border-radius:16px;background:#ecd5ab}',
 '#cc-pc-controls{display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap;margin:6px}',
 '#cc-pc-controls button{min-height:44px;font-size:13px;border:2px solid #fff9e2;border-radius:12px;padding:8px 10px;background:#dcc1fb;color:#382447}',
 '#cc-pc-controls button.green{background:#b5efcd}#cc-pc-controls button.red{background:#f8c5d0}',
 '#cc-pc-hint{font:13px system-ui;color:#fff1de;max-width:95vw;text-align:center}',
 'body.cc-in-pc-house #cc-fourbar{pointer-events:none!important}'
].join('');document.head.append(css);
const room=document.createElement('div');room.id='cc-pc-house';room.setAttribute('role','region');
room.setAttribute('aria-label','Cat City computer house');
room.innerHTML='<header>🏡 The Computer House</header><canvas id="cc-pc-canvas" width="800" height="490"></canvas><div id="cc-pc-controls"></div><p id="cc-pc-hint">Explore inside. Walk to the computer and tap E / 🐾 or Open Computer. Walk to the door to leave.</p>';
document.body.append(room);
const canvas=$('cc-pc-canvas'),ct=canvas.getContext('2d'),panel=$('cc-pc-controls');
let inside=false,raf=0,last=0,x=400,y=405;const pressed=new Set();
function button(label,handler,cl=''){
 const el=document.createElement('button');el.type='button';el.textContent=label;el.className=cl;el.onclick=handler;panel.append(el);return el;
}
for(const [symbol,direction] of [['⬅️','left'],['⬆️','up'],['⬇️','down'],['➡️','right']]){
 const el=button(symbol,()=>{});el.setAttribute('aria-label','Move '+direction);
 el.addEventListener('pointerdown',e=>{pressed.add(direction);el.setPointerCapture?.(e.pointerId)});
 for(const event of ['pointerup','pointercancel','lostpointercapture','pointerleave'])el.addEventListener(event,()=>pressed.delete(direction));
}
button('🖥️ Use Computer',()=>openComputer(),'green');
button('🚪 Leave House',()=>leave(),'red');
const nearHouse=()=>!inside&&!core.bossMode&&!window.catCityTagHouse?.inside&&!window.catCityCaveState?.().inside&&Math.hypot(core.state.x-26*T,core.state.y-26*T)<95;
const nearComputer=()=>Math.hypot(x-400,y-265)<130;
const old=core.interact;
core.interact=function(){
 if(inside){if(nearComputer())openComputer();else leave();return}
 if(nearHouse()){enter();return}
 return old();
};
if($('interact'))$('interact').onclick=()=>core.interact();
function enter(){
 if(!nearHouse())return;
 inside=true;x=400;y=410;last=performance.now();
 room.classList.add('open');document.body.classList.add('cc-in-pc-house');
 core.note('🏡 You entered the Computer House. Explore inside!');
 raf=requestAnimationFrame(draw);
}
function leave(){
 if(!inside)return;inside=false;pressed.clear();
 room.classList.remove('open');document.body.classList.remove('cc-in-pc-house');cancelAnimationFrame(raf);
 if($('dialog'))$('dialog').style.zIndex='';
 core.note('🏡 Back outside the Computer House.');
}
function openComputer(){
 if(!inside)return;
 if($('dialog'))$('dialog').style.zIndex='7900';
 if(typeof core.collector==='function')core.collector();
 else core.note('The fish team computer is unavailable.');
}
const controls={w:'up',a:'left',s:'down',d:'right',arrowup:'up',arrowleft:'left',arrowdown:'down',arrowright:'right'};
window.addEventListener('keydown',e=>{
 if(!inside||e.target?.closest?.('input,select,textarea,[contenteditable]'))return;
 const key=String(e.key||'').toLowerCase();
 if(key==='escape'&&$('dialog')?.style.display==='block')return;
 if(key==='escape'){e.stopImmediatePropagation();e.preventDefault();leave();return}
 if(key==='e'||key===' '){e.stopImmediatePropagation();e.preventDefault();if(nearComputer())openComputer();else leave();return}
 if(controls[key]){e.stopImmediatePropagation();e.preventDefault();pressed.add(controls[key])}
},true);
window.addEventListener('keyup',e=>pressed.delete(controls[String(e.key||'').toLowerCase()]),true);
function rect(px,py,w,h,color){ct.fillStyle=color;ct.fillRect(px,py,w,h)}
function text(t,px,py,font='bold 20px system-ui'){ct.fillStyle='#fff7d2';ct.font=font;ct.textAlign='center';ct.fillText(t,px,py)}
function draw(timestamp){
 if(!inside)return;
 const dt=Math.min(.06,Math.max(.005,(timestamp-last)/1000));last=timestamp;
 const dx=Number(pressed.has('right'))-Number(pressed.has('left')),dy=Number(pressed.has('down'))-Number(pressed.has('up'));
 const speed=180*dt/Math.max(1,Math.hypot(dx,dy));
 x=Math.max(45,Math.min(755,x+dx*speed));y=Math.max(235,Math.min(455,y+dy*speed));
 rect(0,0,800,490,'#eedeb7');rect(0,0,800,235,'#d2c7ee');
 for(let yy=235;yy<490;yy+=42)for(let xx=0;xx<800;xx+=74)rect(xx,yy,73,41,(xx/74+yy/42)%2?'#c1a17d':'#d4b58b');
 rect(65,48,110,145,'#9676af');rect(72,55,96,138,'#f5dec1');
 rect(610,48,125,110,'#a37bc5');rect(620,56,105,92,'#b1dff1');
 rect(332,163,144,14,'#8a645d');rect(341,177,126,69,'#c1a081');
 rect(375,93,78,71,'#413b65');rect(382,100,64,53,'#8ce1ce');
 text('🐟',414,139,'bold 29px system-ui');
 rect(350,315,110,18,'#96716c');rect(372,330,67,36,'#b99e79');
 text('🌸',120,227,'36px system-ui');text('📚',650,218,'40px system-ui');
 rect(346,465,108,20,'#775597');text('🚪 EXIT',400,481,'bold 15px system-ui');
 const cat=core.cats[core.state.cat]||core.cats[0];
 rect(x-12,y-20,24,32,cat.coat||'#bd91a0');rect(x-10,y-33,20,18,cat.coat||'#bd91a0');
 rect(x-12,y-40,7,15,cat.coat||'#bd91a0');rect(x+5,y-40,7,15,cat.coat||'#bd91a0');
 rect(x-6,y-25,4,5,cat.eye||'#2f3548');rect(x+3,y-25,4,5,cat.eye||'#2f3548');
 rect(x-7,y,14,12,cat.belly||'#f4dabc');rect(x-14,y+10,9,9,cat.coat||'#bd91a0');rect(x+5,y+10,9,9,cat.coat||'#bd91a0');
 text(nearComputer()?'🖥️ E / Paw · Use PC':'Walk to the glowing computer',400,72,'bold 15px system-ui');
 if(y>452&&Math.abs(x-400)<50){leave();return}
 raf=requestAnimationFrame(draw);
}
window.catCityPCHouse={enter,leave,get inside(){return inside}};
})();
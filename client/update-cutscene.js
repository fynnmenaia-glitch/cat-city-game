/* Cat City — the global "UPDATE!" cutscene.
 *
 * When the owner presses 🚀 Release update, every player's game (release-loader.js)
 * plays this: a 3D fly-over of the village with everyone standing still, a giant
 * "UPDATE!" appears in the sky, explodes, and shows what's new:
 *   kind "mission" → "NEW MISSION ADDED", kind "event" → "NEW EVENT" and the
 *   event starts straight after (the update breaks into the event's own cutscene),
 *   anything else → "NEW UPDATE".
 * A staged update can register what happens after the cutscene:
 *   window.catCityOnRelease = window.catCityOnRelease || {};
 *   window.catCityOnRelease['u57-ghost-party'] = () => startMyEventCutscene();
 * Nobody is moved: the game keeps running underneath.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const css=document.createElement('style');css.textContent=[
 '#cc-upd{position:fixed;inset:0;z-index:9600;background:#000;display:none}#cc-upd.open{display:block}',
 '#cc-upd canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated}',
 '#cc-upd-skip{position:absolute;right:12px;top:calc(12px + env(safe-area-inset-top));min-height:40px;padding:6px 12px;border-radius:12px;border:2px solid #fff6e4;background:#33224acc;color:#fff6e4;font:bold 13px system-ui}'
].join('\n');document.head.append(css);
const root=document.createElement('div');root.id='cc-upd';root.innerHTML='<canvas id="cc-upd-cv"></canvas><button id="cc-upd-skip" type="button">Skip ▶</button>';document.body.append(root);
window.catCityOnRelease=window.catCityOnRelease||{};

// Village layout (tiles) for the 3D model.
const T=32;
const HOUSES=[[5,5,8,6,'#f5b4a5','#c94c5a'],[19,5,9,6,'#c9b2ed','#7a52b8'],[34,5,8,6,'#9ad7cf','#3f8f8a'],[6,22,9,6,'#f4c879','#7a52b8'],[22,22,9,6,'#b6d5fa','#5c7fc0'],[35,22,8,6,'#a7dd9b','#4f9e5c'],
 [6,31,4,3,'#f7cfdc','#d9607e'],[21,31,4,3,'#e2d2f6','#7a52b8'],[37,31,4,3,'#fbeec8','#c8952b']];
const CATS=[['marmalade',9.5,13.5],['pebble',23.5,13.5],['luna',38.5,13.5],['forge',34.5,25.5],['slaycat',38.5,20.5],['astro',20,17],['galaxy',27,17.5],['baby',15,18],['harley',31,16],['skylar',18,20],['pumpkin',29,20]];
const TREES=[[2,2],[45,3],[2,16],[46,15],[3,29],[45,29],[16,3],[31,3],[16,28],[32,30]];

let raf=0,playing=false;
function play(updates,done){
 if(playing){done?.();return}playing=true;
 const list=(updates&&updates.length?updates:[{title:'Something new!'}]);
 const kind=list.find(u=>u.kind==='event')?'event':list.find(u=>u.kind==='mission')?'mission':'feature';
 const head=kind==='event'?'NEW EVENT!':kind==='mission'?'NEW MISSION ADDED!':'NEW UPDATE!';
 const cv=$('cc-upd-cv'),g=cv.getContext('2d');// The short side is always 180 pixels, so the picture keeps its shape on phones and computers.
 const wide=innerWidth>=innerHeight,LW=wide?Math.min(420,Math.round(180*innerWidth/innerHeight)):180,LH=wide?180:Math.min(420,Math.round(180*innerHeight/innerWidth)),F=180,HOR=LH-F*.58;cv.width=LW;cv.height=LH;g.imageSmoothingEnabled=false;
 root.classList.add('open');const start=performance.now();const prevMusic=window.catCityMissionMusic;window.catCityMissionMusic='menu';window.catCitySfx?.('horn');
 const art=window.catCityCatArt,s=window.__catCityEngine?.state;const me=(art?.ids||[])[s?.cat||0]||'astro';
 const others=(window.catCityOnlinePlayers?.()||[]).filter(p=>p.id!==window.catCityOnlineMe?.()).slice(0,8).map((p,i)=>[(art?.ids||[])[p.cat]||'astro',14+i*2.6,15.5+(i%2)]);
 const cats=[...CATS,[me,24,16.2,true],...others];
 const parts=[];let exploded=false,said=false;
 const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const DUR=10.5;
 function proj(x,z,y,cam){const dz=cam.z-z;if(dz<8)return null; // camera looks north (towards smaller z)
 const f=F*1.05/dz;return {x:LW/2+(x-cam.x)*f,y:HOR+(cam.h-y)*f,k:f}}
 function poly(pts,c){if(pts.some(p=>!p))return;g.fillStyle=c;g.beginPath();g.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))g.lineTo(p.x,p.y);g.closePath();g.fill()}
 function frame(now){const t=(now-start)/1000;if(t>DUR){finish();return}
  // Camera: glides in from the south of the village, then tilts up to the sky.
  const k=Math.min(1,t/5),ease=k*k*(3-2*k);const cam={x:24*T+Math.sin(t*.25)*90,z:60*T-ease*12*T,h:300-ease*90};
  const up=Math.max(0,Math.min(1,(t-3.2)/1.4));const lift=up*F*.35;
  g.save();g.translate(0,lift);
  // sky
  for(let y=-lift;y<HOR+2;y+=3){const q=(y+lift)/(HOR+lift);R(0,y,LW,3,'rgb('+Math.round(40+q*200)+','+Math.round(50+q*120)+','+Math.round(120+q*60)+')')}
  for(let i=0;i<40;i++){const sx=(i*53.7)%LW,sy=-lift+(i*29.3)%(HOR+lift*.8);if((i+Math.floor(t*3))%7)R(sx,sy,1,1,'#ffffffaa')}
  // ground
  R(0,HOR,LW,LH,'#5f9e52');
  for(let z=0;z<36;z+=3){const a=proj(0,z*T,0,cam),b=proj(48*T,z*T,0,cam);if(a&&b){g.strokeStyle='#6fae5f';g.lineWidth=1;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()}}
  poly([proj(0,15*T,0,cam),proj(48*T,15*T,0,cam),proj(48*T,19*T,0,cam),proj(0,19*T,0,cam)],'#d9c39a');
  poly([proj(22*T,0,0,cam),proj(26*T,0,0,cam),proj(26*T,35*T,0,cam),proj(22*T,35*T,0,cam)],'#d9c39a');
  // things, far to near
  const things=[];
  for(const [x,y,w,h,wall,roof] of HOUSES)things.push({z:(y+h)*T,draw:()=>{const x0=x*T,x1=(x+w)*T,zf=(y+h)*T,zb=y*T,H=h*T*.55,RH=H*.6;
   poly([proj(x0,zf,0,cam),proj(x1,zf,0,cam),proj(x1,zf,H,cam),proj(x0,zf,H,cam)],wall);
   poly([proj(x1,zf,0,cam),proj(x1,zb,0,cam),proj(x1,zb,H,cam),proj(x1,zf,H,cam)],'#00000033');
   poly([proj(x0-8,zf+8,H,cam),proj(x1+8,zf+8,H,cam),proj((x0+x1)/2,(zf+zb)/2,H+RH,cam)],roof);
   poly([proj(x1+8,zf+8,H,cam),proj(x1+8,zb-8,H,cam),proj((x0+x1)/2,(zf+zb)/2,H+RH,cam)],'#00000044');
   const d1=proj((x0+x1)/2-14,zf,0,cam),d2=proj((x0+x1)/2+14,zf,40,cam);if(d1&&d2)R(d1.x,d2.y,d2.x-d1.x,d1.y-d2.y,'#6b4b2f');
   const w1=proj(x0+20,zf,H*.7,cam),w2=proj(x0+48,zf,H*.45,cam);if(w1&&w2){R(w1.x,w1.y,w2.x-w1.x,w2.y-w1.y,'#ffe9a8');const w3=proj(x1-48,zf,H*.7,cam),w4=proj(x1-20,zf,H*.45,cam);if(w3&&w4)R(w3.x,w3.y,w4.x-w3.x,w4.y-w3.y,'#ffe9a8')}}});
  for(const [x,z] of TREES)things.push({z:z*T,draw:()=>{const p=proj(x*T,z*T,0,cam),q=proj(x*T,z*T,70,cam);if(!p||!q)return;const r=Math.max(2,26*p.k);R(p.x-r*.15,q.y,r*.3,p.y-q.y,'#7a5235');g.fillStyle='#3f8f4f';g.beginPath();g.arc(p.x,q.y,r,0,7);g.fill();g.fillStyle='#5fb36c';g.beginPath();g.arc(p.x-r*.3,q.y-r*.3,r*.55,0,7);g.fill()}});
  for(const [id,x,z,isMe] of cats)things.push({z:z*T,draw:()=>{const p=proj(x*T,z*T,0,cam);if(!p)return;const sc=Math.max(.35,Math.min(2.6,p.k*3.2));
   g.fillStyle='#00000033';g.beginPath();g.ellipse(p.x,p.y,9*sc,3*sc,0,0,7);g.fill();
   // Everyone looks up once the UPDATE appears.
   const pose=t>3.4&&art?.poses?.walkBack?'walkBack':'idle';art?.draw(g,p.x,p.y,id,pose,0,{scale:sc});
   if(isMe&&t<3){g.fillStyle='#ffd45c';g.font='bold '+Math.max(6,Math.round(7*sc))+'px system-ui';g.textAlign='center';g.fillText('▼ you',p.x,p.y-30*sc)}}});
  things.sort((a,b)=>a.z-b.z) /* far (small z) first */.forEach(o=>o.draw());
  g.restore();
  // The big UPDATE! in the sky
  const cx=LW/2,cy=LH*.3;
  if(t>3.6&&!exploded){const a=Math.min(1,(t-3.6)/.6),pulse=1+Math.sin(t*10)*.04*Math.min(1,(t-4.2)*2),shake=t>5.4?(Math.random()-.5)*3*(t-5.4):0;
   g.save();g.translate(cx+shake,cy-(1-a)*40);g.scale(pulse*(.6+a*.4),pulse*(.6+a*.4));
   g.fillStyle='#ffd45c';g.globalAlpha=.25;g.beginPath();g.arc(0,0,60,0,7);g.fill();g.globalAlpha=1;
   bigText(g,'UPDATE',-8,0,'#ffd45c');bigBang(g,46,0);g.restore();
   if(t>6.4){exploded=true;window.catCitySfx?.('reward');for(let i=0;i<120;i++){const ang=Math.random()*7,sp=30+Math.random()*130;parts.push({x:cx,y:cy,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp-30,c:['#ffd45c','#ff6f9a','#7fd6ff','#9bf06a','#c9a2ff','#ffffff'][i%6],l:1.2+Math.random()})}}}
  if(exploded){const dt=1/60;for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=60*dt;p.l-=dt;if(p.l>0)R(p.x,p.y,2,2,p.c)}
   const fl=Math.max(0,1-(t-6.4)/.35);if(fl>0){g.fillStyle='rgba(255,255,255,'+fl+')';g.fillRect(0,0,LW,LH)}
   const a=Math.min(1,(t-6.6)/.5);if(a>0){g.save();g.globalAlpha=a;R(0,LH*.24-F*.13,LW,F*.5,'#120b1cd0');
    g.textAlign='center';g.fillStyle=kind==='event'?'#ff9be6':kind==='mission'?'#9bf06a':'#ffd45c';g.font='bold '+Math.round(F*.085)+'px "CatCityPixel",monospace';g.fillText(head,LW/2,LH*.24,LW-8);
    g.fillStyle='#fff6e4';g.font='bold '+Math.round(F*.06)+'px system-ui';list.slice(0,3).forEach((u,i)=>g.fillText(u.title,LW/2,LH*.24+F*.1+i*F*.075,LW-8));
    if(kind==='event'&&t>8.6){g.fillStyle='#ffd45c';g.font='bold '+Math.round(F*.05)+'px system-ui';g.fillText('Starting now…',LW/2,LH*.24+F*.32)}g.restore()}}
  if(t<.5){g.fillStyle='rgba(0,0,0,'+(1-t/.5)+')';g.fillRect(0,0,LW,LH)}
  if(t>DUR-.5){g.fillStyle='rgba(0,0,0,'+((t-(DUR-.5))/.5)+')';g.fillRect(0,0,LW,LH)}
  raf=requestAnimationFrame(frame)}
 function finish(){cancelAnimationFrame(raf);root.classList.remove('open');playing=false;window.catCityMissionMusic=prevMusic||null;
  // The update breaks into the event / mission's own start (registered by the staged script).
  for(const u of list){const fn=window.catCityOnRelease?.[u.id];if(typeof fn==='function'){try{fn()}catch(e){console.warn('release hook',u.id,e)}}}
  done?.()}
 $('cc-upd-skip').onclick=finish;raf=requestAnimationFrame(frame);
}
// Chunky pixel letters (5x7) so the sky text is crisp at low resolution.
const FONT={U:['10001','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],D:['11110','10001','10001','10001','10001','10001','11110'],A:['01110','10001','10001','11111','10001','10001','10001'],T:['11111','00100','00100','00100','00100','00100','00100'],E:['11111','10000','10000','11110','10000','10000','11111']};
function bigText(g,text,x,y,col){const px=3,w=text.length*6*px;let ox=x-w/2;for(const ch of text){const f=FONT[ch];if(f)for(let r=0;r<7;r++)for(let c=0;c<5;c++)if(f[r][c]==='1'){g.fillStyle='#2a1d33';g.fillRect(ox+c*px+1,y-10+r*px+1,px,px);g.fillStyle=col;g.fillRect(ox+c*px,y-10+r*px,px,px)}ox+=6*px}}
function bigBang(g,x,y){g.fillStyle='#2a1d33';g.fillRect(x-4,y-17,10,24);g.fillRect(x-4,y+10,10,9);g.fillStyle='#ff6f9a';g.fillRect(x-5,y-18,10,24);g.fillRect(x-5,y+9,10,9)}
window.catCityUpdateCutscene=play;
})();

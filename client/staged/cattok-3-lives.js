/* Cat Tok part 3: the live stream engine.
 * CatTok.addLive({id, author, avatar, caption, verified, viewers:[min,max], draw(g,W,H,t,live), comments:[...], hourly}).
 * In the feed a live shows "LIVE now"; tap it to go in. Inside: host pill with likes and Follow,
 * viewers, a scrolling comment stream, floating hearts (tap anywhere), joins, a comment box and share.
 * Helpers for scenes: CatTok.live.cat / bubble / ticker / studioLight.
 */
(()=>{'use strict';
const start=()=>{const T=window.CatTok;if(!T||T.addLive)return;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const css=document.createElement('style');css.textContent=`
.ct-liveroom{position:absolute;inset:0;z-index:28;background:#000;color:#fff;overflow:hidden;font:14px -apple-system,system-ui,sans-serif;animation:ctIn .22s ease-out}
@keyframes ctIn{from{opacity:0;transform:scale(1.04)}}
.ct-liveroom canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;object-fit:cover}
.ct-liveroom canvas.ct-txt{image-rendering:auto;pointer-events:none}
.ct-lr-top{position:absolute;left:8px;right:8px;top:calc(48px + env(safe-area-inset-top));display:flex;align-items:center;gap:6px;z-index:3}
.ct-lr-host{display:flex;align-items:center;gap:6px;background:#0006;border-radius:20px;padding:3px 4px 3px 3px;max-width:62%}
.ct-lr-host i{width:32px;height:32px;border-radius:50%;flex:none;background:#333 center/cover;image-rendering:pixelated}
.ct-lr-host div{min-width:0;line-height:1.1}.ct-lr-host b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ct-lr-host span{font-size:11px;opacity:.85}
.ct-lr-follow{background:#fe2c55;border-radius:14px;padding:5px 10px;font:700 12px system-ui;flex:none}
.ct-lr-follow.done{background:#ffffff33}
.ct-lr-viewers{margin-left:auto;display:flex;align-items:center;gap:4px}
.ct-lr-viewers i{width:24px;height:24px;border-radius:50%;margin-left:-8px;border:1.5px solid #000;background:#444 center/cover;image-rendering:pixelated}
.ct-lr-viewers b{background:#0006;border-radius:12px;padding:3px 8px;font-size:12px}
.ct-lr-x{font-size:22px;padding:0 4px;text-shadow:0 1px 3px #000}
.ct-lr-chips{position:absolute;left:8px;top:calc(88px + env(safe-area-inset-top));display:flex;gap:5px;z-index:3}
.ct-lr-chips span{background:#0005;border-radius:10px;padding:3px 8px;font:600 11px system-ui}
.ct-lr-cms{position:absolute;left:8px;right:70px;bottom:calc(62px + env(safe-area-inset-bottom));max-height:34%;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;gap:5px;z-index:3;-webkit-mask-image:linear-gradient(transparent,#000 30%);mask-image:linear-gradient(transparent,#000 30%)}
.ct-lr-cm{display:flex;gap:6px;align-items:flex-start;font-size:13px;line-height:1.3;text-shadow:0 1px 2px #000;animation:ctUp .25s ease-out}
@keyframes ctUp{from{opacity:0;transform:translateY(8px)}}
.ct-lr-cm i{width:24px;height:24px;border-radius:50%;flex:none;background:#444 center/cover;image-rendering:pixelated}
.ct-lr-cm b{color:#ffffffb8;font-weight:600;margin-right:4px}
.ct-lr-cm.sys{color:#ffe08a}
.ct-lr-bar{position:absolute;left:8px;right:8px;bottom:calc(10px + env(safe-area-inset-bottom));display:flex;gap:8px;align-items:center;z-index:4}
.ct-lr-say{flex:1;background:#0006;border-radius:20px;padding:10px 14px;color:#fffb;font-size:13px;text-align:left}
.ct-lr-bar .b{width:40px;height:40px;border-radius:50%;background:#0006;font-size:20px;display:flex;align-items:center;justify-content:center;flex:none}
.ct-lr-hearts{position:absolute;right:10px;bottom:70px;width:60px;height:60%;pointer-events:none;z-index:3}
.ct-lr-hearts span{position:absolute;bottom:0;font-size:24px;animation:ctFloat 2.2s ease-out forwards}
@keyframes ctFloat{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:1}100%{transform:translate(var(--dx),-260px) scale(1.2);opacity:0}}
.ct-lr-quick{position:absolute;left:0;right:0;bottom:0;z-index:6;background:#fff;color:#161823;border-radius:14px 14px 0 0;padding:12px 10px calc(14px + env(safe-area-inset-bottom));display:flex;flex-wrap:wrap;gap:6px}
.ct-lr-quick button{border:1px solid #0002;border-radius:16px;padding:7px 11px;font-size:13px;background:#f1f1f2;color:#161823}
`;document.head.append(css);

const NAMES=['purrfectpaws','whisker.wiz','fishfan99','mochi_moments','tuna.queen','zoomiesonly','biscuitstan','catnipkid','luna.lover','meowmeow.mp4','pawsandplay','sleepy.kit','starryfur','tabbytalk','yarnbandit','clawdia','furball.fm','kittenkaboodle','pebble.reads','sir.fluff','marmalade.fan','clover.leaf'];
const CHAT=['hiii 👋','first time here!','😂😂','love this live','❤️❤️❤️','where is this??','hello from the Flower Terrace 🌸','W live','omg','say hi to me pls 🙏','🔥🔥','sooo cute','lol','is it real?','😮','yesss','tap tap tap ❤️','who else is here from For You?'];

function addLive(def){const it=T.addItem({kind:'live',local:true,...def,draw:(g,W,H,t,i)=>def.draw(g,W,H,t,state(i))});return it}
const states={};
function state(it){return states[it.id]||(states[it.id]={viewers:Math.round((it.viewers?.[0]||300)+((it.viewers?.[1]||900)-(it.viewers?.[0]||300))*T.rng(it.id+'v')()),likes:Math.floor(T.rng(it.id+'l')()*60000)+4000,hearts:0,started:Date.now()})}

// ---------------------------------------------------------------- the live room
let room=null,raf=0,timers=[];
let inRoom=null;
function openLive(it){closeLive();const app=T.app;if(!app)return;const L=state(it),S=T.state,fol=()=>!!S.follows[it.author];L.inRoom=true;inRoom=L;
 room=document.createElement('div');room.className='ct-liveroom';
 room.innerHTML='<canvas width="180" height="'+(T.screenH?.()||320)+'"></canvas>'+
  '<div class="ct-lr-top"><div class="ct-lr-host"><i style="background-image:url('+T.avatar(it.avatar||it.author)+')"></i><div><b>'+esc(it.author)+(it.verified?' <span style="color:#20d5ec">✓</span>':'')+'</b><span data-likes>❤ '+T.fmt(L.likes)+'</span></div></div><button class="ct-lr-follow'+(fol()?' done':'')+'">'+(fol()?'Following':'Follow')+'</button><div class="ct-lr-viewers"><i></i><i></i><i></i><b data-v>'+T.fmt(L.viewers)+'</b></div><button class="ct-lr-x" aria-label="Leave live">✕</button></div>'+
  '<div class="ct-lr-chips"><span>🔥 '+esc(it.hourly||'Hourly ranking #'+(1+Math.floor(T.rng(it.id+'r')()*30)))+'</span><span>Explore ›</span></div>'+
  '<div class="ct-lr-cms"></div><div class="ct-lr-hearts"></div>'+
  '<div class="ct-lr-bar"><button class="ct-lr-say">Add comment…</button><button class="b" data-gift aria-label="Gift">🎁</button><button class="b" data-share aria-label="Share">↪️</button><button class="b" data-heart aria-label="Like">❤️</button></div>';
 (it.extraUi||null)?.(room,L,it);
 app.append(room);
 const vs=room.querySelectorAll('.ct-lr-viewers i');vs.forEach((v,i)=>v.style.backgroundImage='url('+T.avatar((window.catCityCatArt?.ids||['astro'])[(i*2+1)%6])+')');
 room.querySelector('.ct-lr-x').onclick=closeLive;
 const fb=room.querySelector('.ct-lr-follow');fb.onclick=e=>{e.stopPropagation();S.follows[it.author]=!S.follows[it.author];T.save();fb.classList.toggle('done',fol());fb.textContent=fol()?'Following':'Follow';if(fol()){sys('You followed '+it.author+' 💖');window.catCitySfx?.('pop')}};
 const heart=()=>{L.likes++;L.hearts++;room.querySelector('[data-likes]').textContent='❤ '+T.fmt(L.likes);floatHeart();it.onLike?.(L)};
 room.querySelector('[data-heart]').onclick=e=>{e.stopPropagation();heart()};
 room.querySelector('canvas').addEventListener('click',heart);
 room.querySelector('[data-share]').onclick=e=>{e.stopPropagation();sys('🔗 You shared the LIVE');try{navigator.clipboard?.writeText('Cat Tok LIVE · @'+it.author)}catch(_){}};
 room.querySelector('[data-gift]').onclick=e=>{e.stopPropagation();(T.gift?T.gift(it,L,sys):sys('🎁 Gifts are coming soon!'))};
 room.querySelector('.ct-lr-say').onclick=e=>{e.stopPropagation();const q=document.createElement('div');q.className='ct-lr-quick';q.innerHTML=['👋 Hi!','❤️❤️❤️','😂','Love this!','Where is this?','W','🔥🔥','Hello from Cat City!'].concat(it.quickComments||[]).map(t=>'<button>'+esc(t)+'</button>').join('');room.append(q);
  q.querySelectorAll('button').forEach(b=>b.onclick=ev=>{ev.stopPropagation();comment(T.myName(),b.textContent,T.myCat(),true);q.remove();window.catCitySfx?.('pop');it.onComment?.(b.textContent,L)});setTimeout(()=>addEventListener('click',function off(ev){if(!q.contains(ev.target)){q.remove();removeEventListener('click',off,true)}},true),0)};
 // Viewers come and go, comments roll in, other viewers send hearts.
 const pool=(it.comments||[]).concat(CHAT),r=T.rng(it.id+Date.now());
 sys(it.welcome||'Welcome to the LIVE! Be kind and have fun 💖');comment(T.myName(),'joined 👋',T.myCat(),true,true);
 timers.push(setInterval(()=>{L.viewers=Math.max(20,Math.round(L.viewers*(.985+r()*.03)+(r()-.45)*8));room.querySelector('[data-v]').textContent=T.fmt(L.viewers)},1500));
 timers.push(setInterval(()=>{const n=NAMES[Math.floor(r()*NAMES.length)];if(r()<.18)comment(n,'joined 👋',null,false,true);else comment(n,pool[Math.floor(r()*pool.length)])},1100));
 timers.push(setInterval(()=>{if(r()<.7){floatHeart();L.likes+=Math.floor(1+r()*4);room.querySelector('[data-likes]').textContent='❤ '+T.fmt(L.likes)}},420));
 const cv=room.querySelector('canvas');const t0=performance.now();
 const loop=now=>{if(!room)return;T.drawCrisp(cv,it,(now-t0)/1000);raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);
 addEventListener('keydown',liveKeys,true);it.onEnter?.(L,room)}
function liveKeys(e){if(!room)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeLive()}}
function closeLive(){if(inRoom){inRoom.inRoom=false;inRoom=null}cancelAnimationFrame(raf);timers.forEach(clearInterval);timers=[];removeEventListener('keydown',liveKeys,true);room?.remove();room=null}
function comment(name,text,av,me,join){if(!room)return;const box=room.querySelector('.ct-lr-cms'),d=document.createElement('div');d.className='ct-lr-cm';
 d.innerHTML='<i style="background-image:url('+T.avatar(av||(window.catCityCatArt?.ids||['astro'])[Math.floor(Math.random()*6)])+')"></i><div><b>'+esc(name)+(me?' (you)':'')+'</b>'+esc(text)+'</div>';if(join)d.style.opacity='.75';box.append(d);while(box.children.length>9)box.firstChild.remove()}
function sys(text){if(!room)return;const box=room.querySelector('.ct-lr-cms'),d=document.createElement('div');d.className='ct-lr-cm sys';d.textContent=text;box.append(d);while(box.children.length>9)box.firstChild.remove()}
function floatHeart(){const h=room?.querySelector('.ct-lr-hearts');if(!h)return;const s=document.createElement('span');s.textContent=['❤️','💖','💗','🩷','💜','🧡'][Math.floor(Math.random()*6)];s.style.left=(Math.random()*30)+'px';s.style.setProperty('--dx',(Math.random()*40-30)+'px');h.append(s);setTimeout(()=>s.remove(),2300)}

// ---------------------------------------------------------------- scene helpers
const H={
 cat(g,id,x,y,scale=2,pose='idle',t=0,opts={}){const A=window.catCityCatArt,B=window.catCityBirmanArt;if(id.startsWith('birman:'))B?.draw(g,x,y-(id==='birman:king'?48:36),id.slice(7),{scale:scale*.45,t});else A?.draw(g,x,y,id,pose,opts.frame??(Math.floor(t*2)%2),{scale,flip:opts.flip,gear:opts.gear})},
 // A pixel speech bubble that stays inside the screen.
 bubble(g,W,x,y,text,o={}){g.font='bold '+(o.size||9)+'px "Cat City Pixel",monospace';const words=String(text).split(' '),lines=[];let cur='';const max=o.max||W*.62;for(const w of words){const t=cur?cur+' '+w:w;if(g.measureText(t).width>max&&cur){lines.push(cur);cur=w}else cur=t}lines.push(cur);
  const lh=(o.size||9)+3,bw=Math.ceil(Math.max(...lines.map(l=>g.measureText(l).width)))+10,bh=lines.length*lh+6;let bx=Math.round(Math.min(W-bw-3,Math.max(3,x-bw/2))),by=Math.round(y-bh-6);
  g.fillStyle='#241832';g.fillRect(bx-1,by-1,bw+2,bh+2);g.fillStyle=o.bg||'#fff';g.fillRect(bx,by,bw,bh);const tx=Math.round(Math.min(bx+bw-8,Math.max(bx+6,x)));g.fillRect(tx-2,by+bh,5,3);g.fillRect(tx-1,by+bh+3,3,2);
  g.fillStyle=o.color||'#241832';g.textAlign='left';lines.forEach((l,i)=>g.fillText(l,bx+5,by+4+lh*(i+1)-3))},
 ticker(g,W,y,h,text,t,o={}){g.fillStyle=o.bg||'#111';g.fillRect(0,y,W,h);g.save();g.beginPath();g.rect(0,y,W,h);g.clip();g.font='bold '+(o.size||8)+'px "Cat City Pixel",monospace';g.fillStyle=o.color||'#fff';g.textAlign='left';const w=g.measureText(text).width+40,x=W-((t*(o.speed||28))%(w+W));g.fillText(text,x,y+h-3);g.fillText(text,x+w+W,y+h-3);g.restore()},
 studioLight(g,W,H,t,col='#ffffff'){g.save();g.globalAlpha=.06+.03*Math.sin(t*2);g.fillStyle=col;g.beginPath();g.moveTo(W*.2,0);g.lineTo(W*.45,0);g.lineTo(W*.7,H*.75);g.lineTo(W*.1,H*.75);g.fill();g.restore()}
};
T.addLive=addLive;T.openLive=openLive;T.closeLive=closeLive;T.live={...H,comment:(n,t)=>comment(n,t),sys,state};
window.dispatchEvent(new CustomEvent('catcity:cattok-lives-ready'));
};
if(window.CatTok)start();else addEventListener('catcity:cattok-ready',start,{once:true});
})();

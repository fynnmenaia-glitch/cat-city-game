/* Cat Tok part 8: 🔴 going LIVE, watching real players' lives, and 🎁 gifts.
 * Only the owner and players the owner has verified (✔️ in the Cat Tok app) can go LIVE.
 *  🎬 On a set: your cat on any set you own (the owner also has the Admin set). Buttons make your cat
 *     wave, dance, sit, run or nap, or show a snack, and say quick lines in a speech bubble.
 *  🎮 Gameplay: the phone goes away and viewers see your game (a new picture every second).
 * Viewers anywhere find real lives in the feed (LIVE), can send hearts, quick comments and gifts.
 * Gifts cost the viewer 🐟 fish and the streamer receives them (the server keeps count).
 * The same 🎁 gift sheet works in the made-up lives too (News, Galaxy, Peachy Paws).
 * API: window.CatTokLive = {start(), end(), gifts}.
 */
(()=>{'use strict';
const start=()=>{const T=window.CatTok,core=window.__catCityEngine,V=T?.video;if(!T||!core||!V||!T.addLive||window.CatTokLive)return;
const s=core.state,$=id=>document.getElementById(id);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const owner=()=>!!window.catCityIsOwner?.()||V.me().owner;
const R=T.R,CATS=['astro','galaxy','baby','harley','skylar','pumpkin'],myCat=()=>CATS[s.cat||0]||'astro';
const GIFTS=[{id:'rose',icon:'🌹',name:'Rose',fish:1},{id:'fish',icon:'🐟',name:'Fish',fish:5},{id:'yarn',icon:'🧶',name:'Yarn ball',fish:10},{id:'crown',icon:'👑',name:'Crown',fish:50},{id:'galaxy',icon:'🌌',name:'Galaxy',fish:100}];
const POSES=[{id:'wave',icon:'👋',name:'Wave',pose:'idle'},{id:'dance',icon:'💃',name:'Dance',pose:'jump'},{id:'sit',icon:'🪑',name:'Sit',pose:'sit'},{id:'run',icon:'🏃',name:'Run',pose:'run'},{id:'sleep',icon:'😴',name:'Nap',pose:'sleep'},{id:'snack',icon:'🍪',name:'Snack',pose:'sit',prop:'galaxy_treats'}];
const SAYS=['Hi everyone! 👋','Welcome to my LIVE!','Thanks for the gift! 💖','Tap the screen for hearts!','Follow for more!','What should I do next?','Bye bye! 👋'];

// ------------------------------------------------------------------ drawing a live (shared by host and viewers)
const imgs={};function img(url){if(!imgs[url]){const i=new Image();i.src=url;imgs[url]=i}return imgs[url].complete&&imgs[url].naturalWidth?imgs[url]:null}
function drawStage(g,W,H,t,o){const set=V.sets.find(x=>x.id===o.set)||V.sets[0],st=o.state||{},y=H*(set.ground||.8);set.draw(g,W,H,t);
 const p=POSES.find(x=>x.id===st.pose)||POSES.find(x=>x.pose===st.pose)||POSES[0];const A=window.catCityCatArt;
 const bob=p.id==='dance'?Math.abs(Math.sin(t*6))*12:0,run=p.id==='run',x=run?W/2+Math.sin(t*1.4)*50:W/2;
 A?.draw(g,Math.round(x),Math.round(y-bob),o.cat||'astro',p.pose,run?Math.floor(t*10)%4:p.id==='sleep'?Math.floor(t*1.5)%2:Math.floor(t*2)%2,{scale:2.6,flip:run&&Math.cos(t*1.4)<0,gear:o.gear&&Object.keys(o.gear).length?o.gear:null});
 if(p.id==='wave'){g.font='bold 18px system-ui';g.textAlign='center';g.fillText('👋',x+26,y-58+Math.sin(t*8)*3)}
 const prop=st.prop||p.prop;if(prop&&window.CatTokShop){const im=img(window.CatTokShop.art(prop,64));if(im)g.drawImage(im,x+16,y-64+Math.sin(t*4)*2,40,40)}
 set.front?.(g,W,H,t);if(st.say)T.live.bubble(g,W,x,y-74,st.say,{size:10})}
function drawFrame(g,W,H,url){R(g,0,0,W,H,'#111');const im=url&&img(url);if(im){const sc=Math.max(W/im.naturalWidth,H/im.naturalHeight),dw=im.naturalWidth*sc,dh=im.naturalHeight*sc;g.imageSmoothingEnabled=false;g.drawImage(im,(W-dw)/2,(H-dh)/2,dw,dh)}else{g.font='bold 12px system-ui';g.textAlign='center';g.fillStyle='#fff';g.fillText('Connecting…',W/2,H/2)}}

// ------------------------------------------------------------------ 🎁 gifts (all lives)
function giftSheet(it,L,sys){const sh=T.sheet('<div class="ct-sh-head">Send a gift · you have 🐟 '+Math.floor(s.fish||0)+'<button class="x">✕</button></div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:4px 12px 16px">'+GIFTS.map(g=>'<button data-g="'+g.id+'" style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0;border-radius:10px;background:#f1f1f2;font:600 12px system-ui"><span style="font-size:28px">'+g.icon+'</span>'+g.name+'<b style="color:#fe2c55">🐟 '+g.fish+'</b></button>').join('')+'</div>');
 sh.querySelectorAll('[data-g]').forEach(b=>b.onclick=async()=>{const g=GIFTS.find(x=>x.id===b.dataset.g);if((s.fish||0)<g.fish){T.toast('🐟 You need '+(g.fish-Math.floor(s.fish||0))+' more fish');return}
  if(it.real){try{await V.api('live/'+encodeURIComponent(it.uid)+'/gift',{gift:g.id,name:T.myName(),cat:myCat()})}catch(e){T.toast('⚠️ '+e.message);return}}
  s.fish=Math.floor(s.fish||0)-g.fish;core.persist();V.stats.gifted=(V.stats.gifted||0)+1;core.persist();T.closeSheet();window.catCitySfx?.('coin');
  if(!it.real){sys?.('🎁 You sent '+g.icon+' '+g.name+'!');T.live.floatHeart();it.onGift?.(g,L)}else T.live.floatHeart()})}
T.gift=giftSheet;

// ------------------------------------------------------------------ watching real players' lives
const real=new Map();
async function pullLives(){let list=[];try{list=(await V.api('lives')).lives||[]}catch(e){return}const me=V.me().uid,seen=new Set();
 for(const l of list){if(l.uid===me)continue;seen.add(l.uid);let it=real.get(l.uid);
  if(!it){const o={set:l.set,cat:l.cat,state:{},frame:null,mode:l.mode};
   it=T.addLive({id:'live:'+l.uid,real:true,uid:l.uid,author:l.name,avatar:l.cat,verified:true,caption:'🔴 '+(l.title||'LIVE now'),tags:['live'],viewers:[l.viewers,l.viewers],likes:l.hearts,commentCount:0,hourly:l.owner?'👑 Owner LIVE':'🔥 LIVE now',
    welcome:'Welcome to '+l.name+'\'s LIVE! Be kind 💖',quickComments:['Hi '+l.name+'! 👋','Love your set!','Can I be in the next video?','Say hi to me pls 🙏'],
    o,draw:(g,W,H,t)=>{if(it.o.mode==='game')drawFrame(g,W,H,it.o.frame);else drawStage(g,W,H,t,it.o)},
    onEnter:(L,room)=>watch(it,L,room),onComment:text=>V.api('live/'+encodeURIComponent(l.uid)+'/comment',{text,name:T.myName(),cat:myCat()}).catch(e=>T.live.sys('⚠️ '+e.message)),
    onLike:()=>{const n=Date.now();if(n-(it.lastHeart||0)>400){it.lastHeart=n;V.api('live/'+encodeURIComponent(l.uid)+'/heart',{}).catch(()=>{})}}});
   real.set(l.uid,it);T.inbox?.('🔴',l.name+' is LIVE!',l.title||'Tap to watch',l.cat)}
  it.o.set=l.set;it.o.cat=l.cat;it.o.mode=l.mode}
 for(const [uid,it] of real)if(!seen.has(uid)){const i=T.items.indexOf(it);if(i>=0)T.items.splice(i,1);real.delete(uid);T.refresh?.()}}
pullLives();setInterval(()=>{if(T.app)pullLives()},10000);
function watch(it,L,room){let since=0,alive=true;const tick=async()=>{if(!alive||!L.inRoom||!room.isConnected){alive=false;return}
  try{const d=await V.api('live/'+encodeURIComponent(it.uid)+'?since='+since);if(d.ended){T.live.sys('The LIVE has ended. 👋');alive=false;return}
   it.o.state=d.state||{};it.o.set=d.live.set;it.o.cat=d.live.cat;it.o.mode=d.live.mode;it.o.gear=d.state?.gear;if(d.frameAt)it.o.frame='/api/cattok/live/'+encodeURIComponent(it.uid)+'/frame?t='+d.frameAt;
   room.querySelector('[data-v]').textContent=T.fmt(d.live.viewers);room.querySelector('[data-likes]').textContent='❤ '+T.fmt(d.live.hearts);
   for(const e of d.events||[]){since=Math.max(since,e.n);if(e.kind==='comment')T.live.comment(e.name,e.text,e.cat);else if(e.kind==='gift'){const g=GIFTS.find(x=>x.id===e.gift);T.live.sys('🎁 '+e.name+' sent '+(g?g.icon+' '+g.name:'a gift')+'!');T.live.floatHeart()}else if(e.kind==='sys')T.live.sys(e.text)}}catch(e){}
  setTimeout(tick,1500)};tick()}

// ------------------------------------------------------------------ going LIVE (host)
const css=document.createElement('style');css.textContent=`
.ct-host .ct-lr-bar{flex-wrap:wrap}
.ct-host-ctl{position:absolute;left:8px;right:8px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:5;display:flex;flex-direction:column;gap:6px}
.ct-host-row{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}.ct-host-row::-webkit-scrollbar{display:none}
.ct-host-row button{flex:none;border-radius:16px!important;padding:7px 10px;background:#0008!important;color:#fff;font:700 12px system-ui}
.ct-host-row button.on{background:#fe2c55!important}
.ct-host-end{background:#fe2c55!important;color:#fff;border-radius:16px!important;padding:6px 12px;font:800 12px system-ui}
.ct-host-stats{position:absolute;left:8px;top:calc(88px + env(safe-area-inset-top));z-index:3;display:flex;gap:5px}
.ct-host-stats span{background:#0006;border-radius:10px;padding:3px 8px;font:700 11px system-ui;color:#fff}
#cc-livepill{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);z-index:9440;display:none;align-items:center;gap:8px;padding:6px 8px 6px 12px;border-radius:22px;background:#000d;color:#fff;font:800 13px system-ui;box-shadow:0 4px 16px #0006}
#cc-livepill.on{display:flex}#cc-livepill b{background:#fe2c55;border-radius:5px;padding:1px 6px}
#cc-livepill button{border-radius:14px!important;padding:5px 10px;background:#fe2c55!important;color:#fff;font:800 12px system-ui;border:0}
#cc-livepill .lc{max-width:38vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:600 12px system-ui;opacity:.9}
`;document.head.append(css);
const pill=document.createElement('div');pill.id='cc-livepill';pill.className='cc-no-pixel';pill.innerHTML='<b>LIVE</b><span data-pv>👁 0</span><span data-ph>❤ 0</span><span class="lc" data-pc></span><button type="button" data-pend>End</button>';document.body.append(pill);
let host=null;// {title,set,mode,state,since,timer,fish,room}
function setup(){const app=T.app;if(!app)return;if(!(owner()||V.me().verified)){T.toast('Only verified creators can go LIVE');return}
 const sets=V.sets.filter(x=>V.owns(x.id)&&(x.need!=='owner'||owner()));let pick=owner()?'admin':'village',mode='set';
 const sh=T.sheet('<div class="ct-sh-head">🔴 Go LIVE<button class="x">✕</button></div><div style="padding:0 14px 16px;overflow-y:auto"><input data-title maxlength="60" placeholder="LIVE title, e.g. Chatting with you all!" style="width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:8px;padding:10px;font:14px system-ui;margin-bottom:10px">'+
  '<div style="display:flex;gap:8px;margin-bottom:10px"><button data-mode="set" style="flex:1;padding:10px;border-radius:10px;background:#161823;color:#fff;font:700 13px system-ui">🎬 On a set</button><button data-mode="game" style="flex:1;padding:10px;border-radius:10px;background:#f1f1f2;font:700 13px system-ui">🎮 Gameplay</button></div>'+
  '<div data-sets style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">'+sets.map(x=>'<button data-set="'+x.id+'" style="padding:7px 10px;border-radius:12px;font:700 12px system-ui;background:'+(x.id===pick?'#161823;color:#fff':'#f1f1f2')+'">'+x.icon+' '+esc(x.name)+'</button>').join('')+'</div>'+
  '<button data-golive style="display:block;width:100%;padding:13px;border-radius:8px;background:#fe2c55;color:#fff;font:800 15px system-ui">Go LIVE</button><div style="font:12px system-ui;color:#8a8b91;margin-top:8px">Everyone playing Cat City can watch. Viewers can send hearts, comments and 🎁 gifts (you get the 🐟).</div></div>');
 const paint=()=>{sh.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===mode;b.style.background=on?'#161823':'#f1f1f2';b.style.color=on?'#fff':''});sh.querySelector('[data-sets]').style.display=mode==='set'?'flex':'none';sh.querySelectorAll('[data-set]').forEach(b=>{const on=b.dataset.set===pick;b.style.background=on?'#161823':'#f1f1f2';b.style.color=on?'#fff':''})};
 sh.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;paint()});sh.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{pick=b.dataset.set;paint()});
 sh.querySelector('[data-golive]').onclick=()=>{const title=sh.querySelector('[data-title]').value.trim()||(T.myName()+'\'s LIVE');T.closeSheet();begin({title,set:pick,mode})}}
async function begin(o){host={...o,cat:myCat(),state:{pose:'wave',say:'',prop:''},since:0,fish:0,hearts:0,viewers:0,started:Date.now()};
 try{await send()}catch(e){T.toast('⚠️ '+e.message);host=null;return}window.catCitySfx?.('reward');
 host.timer=setInterval(()=>send().catch(()=>{}),host.mode==='game'?1000:1500);
 if(host.mode==='game'){window.CatPhone?.close?.();pill.classList.add('on')}else hostRoom()}
function frame(){const g=$('game');if(!g)return null;const cw=g.width,ch=g.height,zoom=Math.max(1,Math.min(2.2,Math.min(cw,ch*9/16)/190));let w=Math.min(cw,ch*9/16)/zoom,h=w*16/9;if(h>ch){h=ch;w=h*9/16}
 const c=document.createElement('canvas');c.width=108;c.height=192;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(g,(cw-w)/2,(ch-h)/2,w,h,0,0,108,192);return c.toDataURL('image/jpeg',.6)}
async function send(){if(!host)return;const body={title:host.title,set:host.set,cat:host.cat,mode:host.mode,name:T.myName(),since:host.since,state:{...host.state,gear:V.myGear()}};if(host.mode==='game')body.frame=frame();
 const d=await V.api('live',body);if(!host)return;host.viewers=d.live.viewers;host.hearts=d.live.hearts;if(d.fish>0){s.fish=Math.floor(s.fish||0)+d.fish;host.fish+=d.fish;core.persist();window.catCitySfx?.('coin')}
 for(const e of d.events||[]){host.since=Math.max(host.since,e.n);if(e.kind==='comment'){hostLine('<b>'+esc(e.name)+'</b>'+esc(e.text),e.cat);pill.querySelector('[data-pc]').textContent=e.name+': '+e.text}else if(e.kind==='gift'){const g=GIFTS.find(x=>x.id===e.gift);hostLine('🎁 <b>'+esc(e.name)+'</b> sent '+(g?g.icon+' '+g.name:'a gift')+' (+🐟 '+e.fish+')',null,true);pill.querySelector('[data-pc]').textContent='🎁 '+e.name+' sent '+(g?g.icon:'a gift')}}
 pill.querySelector('[data-pv]').textContent='👁 '+T.fmt(host.viewers);pill.querySelector('[data-ph]').textContent='❤ '+T.fmt(host.hearts);
 const r=host.room;if(r?.isConnected){r.querySelector('[data-v]').textContent=T.fmt(host.viewers);r.querySelector('[data-likes]').textContent='❤ '+T.fmt(host.hearts);r.querySelector('[data-fish]').textContent='🐟 +'+host.fish+' from gifts'}}
function hostLine(html,cat,sys){const box=host?.room?.querySelector('.ct-lr-cms');if(!box)return;const d=document.createElement('div');d.className='ct-lr-cm'+(sys?' sys':'');d.innerHTML=(cat?'<i style="background-image:url('+T.avatar(cat)+')"></i>':'')+'<div>'+html+'</div>';box.append(d);while(box.children.length>9)box.firstChild.remove()}
function hostRoom(){const app=T.app;if(!app||!host)return;app.querySelector('.ct-host')?.remove();const r=document.createElement('div');r.className='ct-liveroom ct-host';host.room=r;
 r.innerHTML='<canvas width="180" height="'+(T.screenH?.()||320)+'"></canvas><div class="ct-lr-top"><div class="ct-lr-host"><i style="background-image:url('+T.avatar(host.cat)+')"></i><div><b>'+esc(T.myName())+' <span style="color:#20d5ec">✓</span></b><span data-likes>❤ 0</span></div></div><div class="ct-lr-viewers"><b data-v>0</b></div><button class="ct-host-end" data-end>End LIVE</button></div>'+
  '<div class="ct-host-stats"><span>🔴 '+esc(host.title)+'</span><span data-fish>🐟 +0 from gifts</span></div><div class="ct-lr-cms" style="bottom:calc(96px + env(safe-area-inset-bottom))"></div>'+
  '<div class="ct-host-ctl"><div class="ct-host-row">'+POSES.map(p=>'<button data-pose="'+p.id+'" class="'+(host.state.pose===p.id?'on':'')+'">'+p.icon+' '+p.name+'</button>').join('')+'</div><div class="ct-host-row">'+SAYS.map((t,i)=>'<button data-say="'+i+'">💬 '+esc(t)+'</button>').join('')+'</div></div>';
 app.append(r);hostLine('🔴 You are LIVE! Viewers can find you in the LIVE tab.',null,true);
 r.querySelectorAll('[data-pose]').forEach(b=>b.onclick=()=>{host.state.pose=b.dataset.pose;host.state.prop=POSES.find(p=>p.id===b.dataset.pose)?.prop||'';r.querySelectorAll('[data-pose]').forEach(x=>x.classList.toggle('on',x===b));send().catch(()=>{})});
 r.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>{host.state.say=SAYS[+b.dataset.say];clearTimeout(host.sayT);host.sayT=setTimeout(()=>{if(host){host.state.say='';send().catch(()=>{})}},6000);send().catch(()=>{})});
 r.querySelector('[data-end]').onclick=()=>end();
 const cv=r.querySelector('canvas'),t0=performance.now();const loop=n=>{if(!host||!r.isConnected)return;T.drawCrisp(cv,{draw:(g,W,H,t)=>drawStage(g,W,H,t,{set:host.set,cat:host.cat,state:host.state,gear:V.myGear()})},(n-t0)/1000);requestAnimationFrame(loop)};requestAnimationFrame(loop)}
async function end(){if(!host)return;const h=host;host=null;clearInterval(h.timer);clearTimeout(h.sayT);pill.classList.remove('on');h.room?.remove();let extra=0;try{extra=(await V.api('live/end',{})).fish||0}catch(e){}
 if(extra>0){s.fish=Math.floor(s.fish||0)+extra;core.persist()}const mins=Math.max(1,Math.round((Date.now()-h.started)/60000));T.inbox?.('🔴','LIVE ended','You were live for '+mins+' min · ❤ '+h.hearts+' · 🐟 +'+(h.fish+extra)+' from gifts',myCat());core.note?.('🔴 LIVE ended · 🐟 +'+(h.fish+extra)+' from gifts')}
pill.querySelector('[data-pend]').onclick=()=>end();
// If the phone is reopened during a set LIVE, show the host room again.
setInterval(()=>{if(host&&host.mode==='set'&&T.app&&!T.app.querySelector('.ct-host'))hostRoom();if(host&&host.mode==='set'&&!T.app&&!pill.classList.contains('on'))pill.classList.add('on');if(host&&host.mode==='set'&&T.app)pill.classList.remove('on')},1000);
addEventListener('beforeunload',()=>{if(host)navigator.sendBeacon?.('/api/cattok/live/end',new Blob(['{}'],{type:'application/json'}))});
window.CatTokLive={start:setup,end,gifts:GIFTS,isLive:()=>!!host,drawStage};
window.dispatchEvent(new CustomEvent('catcity:cattok-live-ready'));
};
const go=()=>{if(window.CatTok?.video&&window.CatTok?.addLive&&window.__catCityEngine)start();else setTimeout(go,500)};go();
})();

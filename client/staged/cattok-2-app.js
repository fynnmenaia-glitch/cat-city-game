/* Cat Tok part 2: the app.
 * Full-screen vertical feed (swipe / scroll / arrow keys), the top tabs
 * (LIVE · Cat City · Following · Friends · For You · 🔍), the right rail
 * (avatar + follow, ❤️, 💬, 🔖, ↗, sound disc), captions with #hashtags,
 * the bottom bar (Home · Shop · ➕ · Inbox · Profile), comments and share sheets.
 * Feed items are pixel scenes drawn on a small canvas and scaled up sharp.
 * API: window.CatTok = {addItem, items, open, inbox, avatar, rng, state, save, refresh, pageHooks}.
 */
(()=>{'use strict';
if(window.CatTok)return;
const core=window.__catCityEngine;if(!core)return;
const $=id=>document.getElementById(id);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const KEY='catcity_cattok_v1';
const st=(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}})();
for(const k of ['likes','saves','follows','reposts','comments'])st[k]=st[k]&&typeof st[k]==='object'?st[k]:{};
st.inbox=Array.isArray(st.inbox)?st.inbox:[];
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}};
// Small seeded random so every item's counts and comments are stable.
const rng=seed=>{let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h=Math.imul(h^h>>>15,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}};
const fmt=n=>n>=1e6?(n/1e6).toFixed(n>=1e7?0:1).replace('.0','')+'M':n>=1e4?(n/1e3).toFixed(n>=1e5?0:1).replace('.0','')+'K':n>=1e3?(n/1e3).toFixed(1).replace('.0','')+'K':String(n);
const ART=()=>window.catCityCatArt;

// ---------------------------------------------------------------- styles
const css=document.createElement('style');css.id='cc-cattok-style';css.textContent=`
.ct{position:absolute;inset:0;background:#000;color:#fff;font:14px -apple-system,system-ui,'Segoe UI',Roboto,sans-serif;overflow:hidden}
.ct button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.ct-page{position:absolute;inset:0 0 calc(54px + env(safe-area-inset-bottom)) 0;display:none;overflow:hidden}
.ct-page.on{display:block}
.ct-feed{position:absolute;inset:0;overflow-y:auto;scroll-snap-type:y mandatory;scrollbar-width:none;overscroll-behavior:contain}
.ct-feed::-webkit-scrollbar{display:none}
.ct-item{position:relative;height:100%;scroll-snap-align:start;scroll-snap-stop:always;overflow:hidden;background:#111}
.ct-item canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;object-fit:cover}
.ct-item canvas.ct-txt,canvas.ct-txt{image-rendering:auto;pointer-events:none}
.ct-shade{position:absolute;left:0;right:0;bottom:0;height:38%;background:linear-gradient(transparent,#0009);pointer-events:none}
.ct-shadetop{position:absolute;left:0;right:0;top:0;height:120px;background:linear-gradient(#0007,transparent);pointer-events:none}
.ct-top{position:absolute;left:0;right:0;top:calc(44px + env(safe-area-inset-top));z-index:5;display:flex;align-items:center;justify-content:space-between;padding:0 12px;pointer-events:none}
.ct-top>*{pointer-events:auto}
.ct-tabs{display:flex;gap:13px;font:600 15px -apple-system,system-ui,sans-serif;white-space:nowrap}
.ct-tabs button{opacity:.7;position:relative;text-shadow:0 1px 2px #0008}
.ct-tabs button.on{opacity:1;font-weight:800}
.ct-tabs button.on:after{content:'';position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);width:20px;height:3px;border-radius:2px;background:#fff}
.ct-live{font:900 10px system-ui;border:1.6px solid #fff;border-radius:5px;padding:1px 3px;letter-spacing:.04em}
.ct-ico{font-size:21px;text-shadow:0 1px 2px #0008}
.ct-rail{position:absolute;right:8px;bottom:14px;z-index:4;display:flex;flex-direction:column;align-items:center;gap:15px}
.ct-rail button{display:flex;flex-direction:column;align-items:center;gap:2px;font:700 12px -apple-system,system-ui,sans-serif;text-shadow:0 1px 2px #000a}
.ct-rail .i{font-size:31px;line-height:1;filter:drop-shadow(0 1px 2px #0008);transition:transform .15s}
.ct-rail button:active .i{transform:scale(.85)}
.ct-rail .liked .i{animation:ctPop .35s}
@keyframes ctPop{40%{transform:scale(1.35)}}
.ct-av{position:relative;width:48px;height:48px;border-radius:50%;border:2px solid #fff;background:#333 center/cover;image-rendering:pixelated;margin-bottom:6px}
.ct-av .plus{position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);width:20px;height:20px;border-radius:50%;background:#fe2c55;color:#fff;font:900 16px/20px system-ui;text-align:center}
.ct-av .plus.done{background:#fff;color:#fe2c55;font-size:13px}
.ct-disc{width:44px;height:44px;border-radius:50%;background:radial-gradient(#222 30%,#111 31%,#333 70%,#111 71%);display:flex;align-items:center;justify-content:center;animation:ctSpin 4s linear infinite}
.ct-disc i{width:24px;height:24px;border-radius:50%;background:#555 center/cover;image-rendering:pixelated}
@keyframes ctSpin{to{transform:rotate(360deg)}}
.ct-info{position:absolute;left:12px;right:74px;bottom:14px;z-index:4;text-shadow:0 1px 2px #000a;font-size:14px;line-height:1.35}
.ct-info .name{font-weight:800;font-size:16px;margin-bottom:4px;display:flex;align-items:center;gap:5px}
.ct-info .tick{display:inline-flex;width:14px;height:14px;border-radius:50%;background:#20d5ec;color:#fff;font-size:10px;align-items:center;justify-content:center}
.ct-info .cap{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ct-info .cap.open{display:block;-webkit-line-clamp:unset}
.ct-info .tag{font-weight:700}
.ct-info .more{font-weight:700;opacity:.85}
.ct-info .snd{margin-top:6px;display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;font-size:13px}
.ct-info .snd span{display:inline-block;animation:ctMarq 9s linear infinite}
@keyframes ctMarq{from{transform:translateX(60%)}to{transform:translateX(-100%)}}
.ct-livepill{display:inline-block;background:#fe2c55;color:#fff;font:800 12px system-ui;padding:3px 7px;border-radius:4px;margin-bottom:6px}
.ct-heart{position:absolute;z-index:6;font-size:84px;pointer-events:none;animation:ctBig .8s ease-out forwards;filter:drop-shadow(0 4px 8px #0006)}
@keyframes ctBig{0%{transform:translate(-50%,-50%) scale(.4) rotate(-12deg);opacity:0}20%{transform:translate(-50%,-50%) scale(1.15) rotate(-12deg);opacity:1}100%{transform:translate(-50%,-140%) scale(.9) rotate(-12deg);opacity:0}}
.ct-nav{position:absolute;left:0;right:0;bottom:0;height:calc(54px + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);background:#000;border-top:1px solid #ffffff1a;display:flex;align-items:center;justify-content:space-around;z-index:10}
.ct-nav button{display:flex;flex-direction:column;align-items:center;gap:1px;font:600 10px -apple-system,system-ui,sans-serif;opacity:.65;position:relative;min-width:48px}
.ct-nav button.on{opacity:1}
.ct-nav .ni{font-size:22px;line-height:1.1}
.ct-nav .plus{width:44px;height:28px;border-radius:8px;background:#fff;color:#000;font:900 20px/28px system-ui;box-shadow:-3px 0 0 #25f4ee,3px 0 0 #fe2c55;opacity:1}
.ct-nav .badge{position:absolute;top:-3px;left:30px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#fe2c55;color:#fff;font:800 10px/16px system-ui;display:none}
.ct-nav .badge.on{display:block}
.ct.light .ct-nav{background:#fff;border-top-color:#0001;color:#111}
.ct-sheet{position:absolute;left:0;right:0;bottom:0;z-index:30;background:#fff;color:#161823;border-radius:14px 14px 0 0;transform:translateY(105%);transition:transform .28s cubic-bezier(.2,.9,.3,1);max-height:72%;display:flex;flex-direction:column;padding-bottom:env(safe-area-inset-bottom)}
.ct-sheet.on{transform:none}
.ct-dim{position:absolute;inset:0;z-index:29;background:#0006;display:none}
.ct-dim.on{display:block}
.ct-sh-head{position:relative;text-align:center;font:700 13px system-ui;padding:14px 40px 10px}
.ct-sh-head .x{position:absolute;right:12px;top:8px;font-size:22px;color:#161823}
.ct-cm{display:flex;gap:10px;padding:8px 14px;align-items:flex-start}
.ct-cm .a{width:34px;height:34px;border-radius:50%;flex:none;background:#ddd center/cover;image-rendering:pixelated}
.ct-cm .b{flex:1;min-width:0;font-size:13px;line-height:1.35}
.ct-cm .n{color:#8a8b91;font-size:12px;font-weight:600}
.ct-cm .m{color:#8a8b91;font-size:11px;margin-top:3px}
.ct-cm .h{display:flex;flex-direction:column;align-items:center;color:#8a8b91;font-size:11px;gap:1px;min-width:26px}
.ct-cm .h.on{color:#fe2c55}
.ct-cms{overflow-y:auto;flex:1}
.ct-quick{display:flex;gap:6px;overflow-x:auto;padding:8px 12px;border-top:1px solid #0001;scrollbar-width:none}
.ct-quick button{flex:none;border:1px solid #0002;border-radius:16px;padding:6px 11px;font-size:13px;background:#f1f1f2}
.ct-shrow{display:flex;gap:14px;overflow-x:auto;padding:6px 16px 18px;scrollbar-width:none}
.ct-shrow button{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:11px;min-width:58px}
.ct-shrow i{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:23px;font-style:normal;color:#fff}
.ct-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;padding:30px;color:#fffb}
.ct-empty b{font-size:17px;color:#fff}
.ct-white{background:#fff;color:#161823;height:100%;overflow-y:auto;padding:calc(50px + env(safe-area-inset-top)) 0 20px}
.ct-white h2{font:800 17px system-ui;text-align:center;margin:0 0 12px}
.ct-row{display:flex;gap:12px;align-items:center;padding:10px 16px}
.ct-row .ri{width:46px;height:46px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:22px;background:#f1f1f2 center/cover;image-rendering:pixelated}
.ct-row .rt{flex:1;min-width:0}.ct-row .rt b{display:block;font-size:14px}.ct-row .rt span{display:block;font-size:12px;color:#8a8b91;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ct-row .dot{width:8px;height:8px;border-radius:50%;background:#fe2c55}
.ct-prof{text-align:center}
.ct-prof .pav{width:96px;height:96px;border-radius:50%;margin:0 auto 10px;background:#eee center/cover;image-rendering:pixelated}
.ct-prof .handle{font:700 16px system-ui}
.ct-stats{display:flex;justify-content:center;gap:28px;margin:12px 0}
.ct-stats b{display:block;font-size:17px}.ct-stats span{font-size:12px;color:#8a8b91}
.ct-pbtn{display:inline-block;margin:4px;border-radius:6px;padding:9px 16px;background:#f1f1f2;font:600 14px system-ui}
.ct-ptabs{display:flex;border-bottom:1px solid #0001;margin-top:12px}
.ct-ptabs button{flex:1;padding:10px;font-size:18px;opacity:.4;border-bottom:2px solid transparent}
.ct-ptabs button.on{opacity:1;border-bottom-color:#161823}
.ct-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px}
.ct-grid button{position:relative;aspect-ratio:3/4;background:#222 center/cover;image-rendering:pixelated}
.ct-grid span{position:absolute;left:5px;bottom:4px;font:700 12px system-ui;color:#fff;text-shadow:0 1px 2px #000}
.ct-grid em{position:absolute;left:4px;top:4px;background:#fe2c55;color:#fff;font:700 10px system-ui;padding:1px 4px;border-radius:3px;font-style:normal}
.ct-search{position:absolute;inset:0;z-index:25;background:#fff;color:#161823;display:none;flex-direction:column;padding-top:calc(48px + env(safe-area-inset-top))}
.ct-search.on{display:flex}
.ct-sbar{display:flex;gap:8px;align-items:center;padding:6px 12px}
.ct-sbar input{flex:1;border:0;border-radius:6px;background:#f1f1f2;padding:9px 12px;font:15px system-ui;outline:0}
.ct-sbar button{font-weight:700;color:#fe2c55}
`;document.head.append(css);

// ---------------------------------------------------------------- pixel avatars
const avCache={};
function avatar(id,bg){const key=id+(bg||'');if(avCache[key])return avCache[key];const c=document.createElement('canvas');c.width=40;c.height=40;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 g.fillStyle=bg||['#ffd45c','#9ad7cf','#f5b4a5','#c9b2ed','#a7dd9b','#b6d5fa'][Math.floor(rng(id)()*6)];g.fillRect(0,0,40,40);
 const A=ART(),catIds=[...(A?.ids||[]),...(A?.npcIds||[])];
 if(catIds.includes(id))A.draw(g,20,52,id,'idle',0,{scale:1.55});
 else if(id.startsWith('birman:'))window.catCityBirmanArt?.draw(g,20,36-36,id.slice(7),{scale:.55,t:0});
 else{g.fillStyle='#fff';g.font='bold 22px system-ui';g.textAlign='center';g.fillText(id.slice(0,1).toUpperCase(),20,28)}
 return avCache[key]=c.toDataURL()}

// ---------------------------------------------------------------- items
const items=[];
function addItem(it){if(items.some(x=>x.id===it.id))return it;const r=rng(it.id);
 it.likes=it.likes??Math.floor(200+r()*r()*90000);it.commentCount=it.commentCount??Math.floor(8+r()*r()*1600);it.saves=it.saves??Math.floor(it.likes*(.02+r()*.08));it.shares=it.shares??Math.floor(it.likes*(.01+r()*.05));
 it.tags=it.tags||[];it.sound=it.sound||('original sound - '+it.author);items.push(it);scheduleRefresh();return it}
let refreshT=0;function scheduleRefresh(){clearTimeout(refreshT);refreshT=setTimeout(()=>{if(app)buildFeed()},120)}

// ---------------------------------------------------------------- the app
let app=null,tab='foryou',page='home',liveOnly=false,observer=null,visible=null,raf=0;
const pageHooks={};
function open(view){
 app=document.createElement('div');app.className='ct';app.innerHTML=`
 <div class="ct-page on" data-p="home"><div class="ct-feed"></div><div class="ct-top"><button class="ct-live" data-live>LIVE</button><div class="ct-tabs"><button data-t="local">Cat City</button><button data-t="following">Following</button><button data-t="friends">Friends</button><button data-t="foryou" class="on">For You</button></div><button class="ct-ico" data-search aria-label="Search">🔍</button></div></div>
 <div class="ct-page" data-p="shop"></div><div class="ct-page" data-p="create"></div><div class="ct-page" data-p="inbox"></div><div class="ct-page" data-p="profile"></div>
 <nav class="ct-nav"><button data-n="home" class="on"><span class="ni">⌂</span>Home</button><button data-n="shop"><span class="ni">🛍</span>Shop</button><button data-n="create" aria-label="Create"><span class="plus">+</span></button><button data-n="inbox"><span class="ni">✉</span>Inbox<span class="badge"></span></button><button data-n="profile"><span class="ni">👤</span>Profile</button></nav>
 <div class="ct-dim"></div><div class="ct-sheet" data-sheet></div>
 <div class="ct-search"><div class="ct-sbar"><button data-sback style="color:#161823;font-size:22px">‹</button><input placeholder="Search Cat Tok" enterkeyhint="search"><button data-sgo>Search</button></div><div class="ct-sres" style="overflow-y:auto;flex:1"></div></div>`;
 view.append(app);
 app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;liveOnly=false;app.querySelectorAll('[data-t]').forEach(x=>x.classList.toggle('on',x===b));buildFeed()});
 app.querySelector('[data-live]').onclick=()=>{liveOnly=!liveOnly;app.querySelector('[data-live]').style.background=liveOnly?'#fe2c55':'';buildFeed()};
 app.querySelector('[data-search]').onclick=openSearch;
 app.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>go(b.dataset.n));
 app.querySelector('.ct-dim').onclick=closeSheet;
 app.querySelector('[data-sback]').onclick=()=>app.querySelector('.ct-search').classList.remove('on');
 const doSearch=()=>search(app.querySelector('.ct-sbar input').value);app.querySelector('[data-sgo]').onclick=doSearch;app.querySelector('.ct-sbar input').onkeydown=e=>{if(e.key==='Enter')doSearch()};
 buildFeed();go('home');updateBadge();
 addEventListener('keydown',keys,true);
}
function close(){cancelAnimationFrame(raf);observer?.disconnect();removeEventListener('keydown',keys,true);app?.remove();app=null;visible=null}
function keys(e){if(!app||page!=='home'||app.querySelector('.ct-sheet.on')||app.querySelector('.ct-search.on')||document.querySelector('.ct-liveroom'))return;const k=e.key;
 if(k==='ArrowDown'||k==='ArrowUp'||k==='j'||k==='k'){e.preventDefault();e.stopImmediatePropagation();const f=app.querySelector('.ct-feed');f.scrollBy({top:(k==='ArrowDown'||k==='j'?1:-1)*f.clientHeight,behavior:'smooth'})}
 else if(k==='l'||k==='L'){e.stopImmediatePropagation();const cur=visible&&items.find(i=>i.id===visible.dataset.id);if(cur)toggleLike(cur,visible)}}
function go(p){page=p;app.querySelectorAll('.ct-page').forEach(x=>x.classList.toggle('on',x.dataset.p===p));app.querySelectorAll('[data-n]').forEach(b=>b.classList.toggle('on',b.dataset.n===p));
 app.classList.toggle('light',p!=='home');window.CatPhone?.screen()?.querySelector('#cc-phone-status')?.style.setProperty('color',p==='home'?'#fff':'#111');
 const el=app.querySelector('[data-p="'+p+'"]');
 if(p==='inbox'){st.inboxSeen=Date.now();save();updateBadge()}
 if(pageHooks[p])pageHooks[p](el,api);else if(p==='shop')placeholder(el,'🛍️','Cat Tok Shop','Flash sales, deals and parcels to your door. Opening soon!');
 else if(p==='create')placeholder(el,'➕','Create','Make your own Cat Tok videos. Coming soon!');
 else if(p==='inbox')inbox(el);else if(p==='profile')profile(el);
 if(p==='home')startLoop();else cancelAnimationFrame(raf)}
function placeholder(el,icon,title,text){el.innerHTML='<div class="ct-white"><div class="ct-empty" style="color:#8a8b91"><div style="font-size:54px">'+icon+'</div><b style="color:#161823">'+esc(title)+'</b><span>'+esc(text)+'</span></div></div>'}

// ---------------------------------------------------------------- feed
function list(){let L=items.slice();
 if(liveOnly)L=L.filter(i=>i.kind==='live');
 else if(tab==='following')L=L.filter(i=>st.follows[i.author]);
 else if(tab==='friends'){const names=new Set((window.catCityOnlinePlayers?.()||[]).map(p=>String(p.name).toLowerCase()));L=L.filter(i=>names.has(String(i.author).toLowerCase()))}
 else if(tab==='local')L=L.filter(i=>i.local||i.kind==='live');
 // For You: lives near the top, then a stable shuffle that changes each time you open the app; boosted items appear more often.
 const seed=rng(String(openCount)+tab);L.sort((a,b)=>(b.pin||0)-(a.pin||0)||((b.kind==='live')-(a.kind==='live'))*.5+(seed()-.5)*(1/(b.boost||1)+1/(a.boost||1)));return L}
let openCount=0;
function buildFeed(){if(!app)return;const feed=app.querySelector('.ct-feed');observer?.disconnect();feed.replaceChildren();feed.scrollTop=0;const L=list();
 if(!L.length){feed.innerHTML='<div class="ct-empty">'+(tab==='following'?'<div style="font-size:48px">👥</div><b>Follow cats to see their posts here</b><span>Tap ➕ on someone\'s picture to follow them.</span>':tab==='friends'?'<div style="font-size:48px">🤝</div><b>No friends\' posts yet</b><span>When friends in your online room post, they show up here.</span>':'<b>Nothing here yet</b>')+'</div>';return}
 observer=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting&&e.intersectionRatio>.6){visible=e.target;const it=items.find(i=>i.id===visible.dataset.id);it?.onShow?.(visible)}},{root:feed,threshold:[.6]});
 for(const it of L){const el=card(it);feed.append(el);observer.observe(el)}visible=feed.firstElementChild;startLoop()}
// Crisp text: the pixel art is drawn 180 px wide and scaled up, which made words blurry and blocky.
// crisp(cv) adds a sharp, high-resolution canvas on top; any text the scene draws goes there in a normal font.
const CRISP_K=4,MIRROR=new Set(['save','restore','translate','scale','rotate','transform','beginPath','closePath','rect','moveTo','lineTo','arc','arcTo','ellipse','quadraticCurveTo','bezierCurveTo','clip']),TEXTFN=new Set(['fillText','strokeText','measureText']),TPROPS=new Set(['textAlign','textBaseline','fillStyle','strokeStyle','lineWidth','lineJoin','globalAlpha','shadowColor','shadowBlur','shadowOffsetX','shadowOffsetY','direction','letterSpacing']);
const READ_FONT='-apple-system,system-ui,"Segoe UI",Roboto,sans-serif';
function fixFont(f){return String(f).replace(/"Cat City Pixel"\s*,?\s*monospace|"Cat City Pixel"|\bmonospace\b/g,READ_FONT)}
function crisp(cv,k=CRISP_K,txt){if(cv.__crisp&&!txt)return cv.__crisp;const g=cv.getContext('2d');
 if(!txt){txt=document.createElement('canvas');txt.className='ct-txt';cv.after(txt)}
 txt.width=cv.width*k;txt.height=cv.height*k;const t=txt.getContext('2d');t.lineJoin='round';
 const syncT=()=>{const m=g.getTransform();t.setTransform(m.a*k,m.b*k,m.c*k,m.d*k,m.e*k,m.f*k)};
 const px=new Proxy(g,{get(o,p){if(p==='canvas')return cv;if(TEXTFN.has(p))return (...a)=>t[p](...a);
   if(p==='setTransform'||p==='resetTransform')return (...a)=>{g[p](...a);syncT()};
   if(MIRROR.has(p))return (...a)=>{t[p](...a);return g[p](...a)};
   const v=o[p];return typeof v==='function'?v.bind(o):v},
  set(o,p,v){if(p==='font'){o.font=v;t.font=fixFont(v);return true}if(TPROPS.has(p))t[p]=v;o[p]=v;return true}});
 const begin=()=>{t.setTransform(1,0,0,1,0,0);t.globalAlpha=1;t.clearRect(0,0,txt.width,txt.height);t.setTransform(k,0,0,k,0,0);g.imageSmoothingEnabled=false};
 if(txt.width!==cv.width*k){txt.width=cv.width*k;txt.height=cv.height*k}
 return cv.__crisp={g:px,begin,txt,k}}
function drawCrisp(cv,it,t){const c=crisp(cv);if(c.txt.width!==cv.width*c.k){c.txt.width=cv.width*c.k;c.txt.height=cv.height*c.k}c.begin();c.g.save();try{it.draw(c.g,cv.width,cv.height,t,it)}catch(e){}c.g.restore()}
// Canvases match the phone screen's shape so nothing gets cropped: always 180 pixels wide.
function screenH(){const f=app?.querySelector('.ct-feed');const r=f&&f.clientWidth?f.clientHeight/f.clientWidth:16/9;return Math.max(240,Math.min(420,Math.round(180*r)))}
function card(it){const el=document.createElement('div');el.className='ct-item';el.dataset.id=it.id;
 const cv=document.createElement('canvas');cv.width=it.w||180;cv.height=it.h||screenH();el.append(cv);
 el.insertAdjacentHTML('beforeend','<div class="ct-shadetop"></div><div class="ct-shade"></div>');
 const liked=!!st.likes[it.id],saved=!!st.saves[it.id],fol=!!st.follows[it.author];
 const rail=document.createElement('div');rail.className='ct-rail';rail.innerHTML=
  '<button data-a="av"><div class="ct-av" style="background-image:url('+avatar(it.avatar||it.author)+')">'+(it.author===myName()?'':'<span class="plus'+(fol?' done':'')+'">'+(fol?'✓':'+')+'</span>')+'</div></button>'+
  '<button data-a="like" class="'+(liked?'liked':'')+'"><span class="i">'+(liked?'❤️':'🤍')+'</span><span>'+fmt(it.likes+(liked?1:0))+'</span></button>'+
  '<button data-a="cm"><span class="i">💬</span><span>'+fmt(it.commentCount+((st.comments[it.id]||[]).length))+'</span></button>'+
  '<button data-a="save"><span class="i">'+(saved?'🔖':'📑')+'</span><span>'+fmt(it.saves+(saved?1:0))+'</span></button>'+
  '<button data-a="share"><span class="i">↪️</span><span>'+fmt(it.shares)+'</span></button>'+
  '<div class="ct-disc"><i style="background-image:url('+avatar(it.avatar||it.author)+')"></i></div>';
 el.append(rail);
 const info=document.createElement('div');info.className='ct-info';
 const cap=esc(it.caption||'').replace(/#(\w+)/g,'<span class="tag">#$1</span>')+(it.tags.length?' '+it.tags.map(t=>'<span class="tag">#'+esc(t)+'</span>').join(' '):'');
 info.innerHTML=(it.kind==='live'?'<span class="ct-livepill">LIVE now</span>':'')+'<div class="name">'+esc(it.author)+(it.verified?'<span class="tick">✓</span>':'')+'</div><div class="cap">'+cap+'</div>'+(cap.length>90?'<button class="more">more</button>':'')+'<div class="snd">♫ <span>'+esc(it.sound)+'</span></div>';
 el.append(info);
 info.querySelector('.more')?.addEventListener('click',e=>{e.stopPropagation();info.querySelector('.cap').classList.toggle('open');e.target.textContent=info.querySelector('.cap').classList.contains('open')?'less':'more'});
 rail.querySelector('[data-a="like"]').onclick=e=>{e.stopPropagation();toggleLike(it,el)};
 rail.querySelector('[data-a="cm"]').onclick=e=>{e.stopPropagation();comments(it,el)};
 rail.querySelector('[data-a="save"]').onclick=e=>{e.stopPropagation();st.saves[it.id]=!st.saves[it.id];save();const b=rail.querySelector('[data-a="save"]');b.querySelector('.i').textContent=st.saves[it.id]?'🔖':'📑';b.lastChild.textContent=fmt(it.saves+(st.saves[it.id]?1:0));window.catCitySfx?.('pop')};
 rail.querySelector('[data-a="share"]').onclick=e=>{e.stopPropagation();share(it)};
 rail.querySelector('[data-a="av"]').onclick=e=>{e.stopPropagation();if(it.author===myName())return;st.follows[it.author]=!st.follows[it.author];save();const p=rail.querySelector('.plus');if(p){p.classList.toggle('done',!!st.follows[it.author]);p.textContent=st.follows[it.author]?'✓':'+'}if(st.follows[it.author]){window.catCitySfx?.('pop');pushInbox('👥','You followed '+it.author,'Their new posts show up in Following.',it.avatar||it.author)}};
 // Tap: lives open; videos pause/play. Double tap: like with a big heart.
 let lastTap=0,tapT=0;el.addEventListener('click',e=>{if(e.target.closest('.ct-rail,.ct-info button'))return;const now=Date.now();
  if(now-lastTap<300){clearTimeout(tapT);if(!st.likes[it.id])toggleLike(it,el);burst(el,e)}
  else tapT=setTimeout(()=>{if(it.kind==='live'&&window.CatTok.openLive)window.CatTok.openLive(it);else{it.paused=!it.paused;flashPause(el,it.paused)}},300);lastTap=now});
 return el}
function toggleLike(it,el){st.likes[it.id]=!st.likes[it.id];save();const b=el.querySelector('[data-a="like"]');b.classList.toggle('liked',!!st.likes[it.id]);b.querySelector('.i').textContent=st.likes[it.id]?'❤️':'🤍';b.lastChild.textContent=fmt(it.likes+(st.likes[it.id]?1:0));if(st.likes[it.id])window.catCitySfx?.('pop')}
function burst(el,e){const r=el.getBoundingClientRect(),h=document.createElement('div');h.className='ct-heart';h.textContent='❤️';h.style.left=(e.clientX-r.left)+'px';h.style.top=(e.clientY-r.top)+'px';el.append(h);setTimeout(()=>h.remove(),850)}
function flashPause(el,p){let d=el.querySelector('.ct-pause');if(!d){d=document.createElement('div');d.className='ct-pause';d.style.cssText='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:64px;opacity:.75;pointer-events:none;z-index:3;text-shadow:0 2px 8px #000';el.append(d)}d.textContent=p?'▶':'';}
// Only the item on screen animates (and the ones next to it draw once), to keep phones cool.
function startLoop(){cancelAnimationFrame(raf);const t0=performance.now();const loop=now=>{if(!app||page!=='home')return;const el=visible;if(el){const it=items.find(i=>i.id===el.dataset.id);if(it&&!it.paused)drawCrisp(el.querySelector('canvas'),it,(now-t0)/1000)}
  raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);
 // first frames for the rest
 setTimeout(()=>app?.querySelectorAll('.ct-item').forEach(el=>{if(el===visible)return;const it=items.find(i=>i.id===el.dataset.id);if(it)drawCrisp(el.querySelector('canvas'),it,1.5)}),50)}

// ---------------------------------------------------------------- comments + share
const NAMES=['purrfectpaws','whisker.wiz','fishfan99','mochi_moments','tuna.queen','zoomiesonly','biscuitstan','catnipkid','luna.lover','meowmeow.mp4','pawsandplay','sleepy.kit','starryfur','tabbytalk','yarnbandit','clawdia','furball.fm','kittenkaboodle'];
const QUICK=['😂😂😂','So cute!! 😻','Part 2 please 🙏','Haha who else?','This is me fr 😭','Love this ❤️','Wait for it…','Iconic 💅','No way 😮','Best one yet!','Fish for this cat 🐟','Following! 👥'];
function genComments(it){const r=rng(it.id+'c'),pool=it.commentPool||QUICK,out=[];const n=8+Math.floor(r()*8);for(let i=0;i<n;i++){out.push({n:NAMES[Math.floor(r()*NAMES.length)],t:pool[Math.floor(r()*pool.length)],h:Math.floor(r()*r()*900),ago:(1+Math.floor(r()*23))+'h',av:(ART()?.ids||['astro'])[Math.floor(r()*6)]})}return out.sort((a,b)=>b.h-a.h)}
function sheet(html){const s=app.querySelector('[data-sheet]');s.innerHTML=html;app.querySelector('.ct-dim').classList.add('on');requestAnimationFrame(()=>s.classList.add('on'));s.querySelector('.x')?.addEventListener('click',closeSheet);return s}
function closeSheet(){app?.querySelector('[data-sheet]')?.classList.remove('on');app?.querySelector('.ct-dim')?.classList.remove('on')}
function comments(it,el){const mine=(st.comments[it.id]||[]).map(c=>({n:myName(),t:c.t,h:0,ago:'now',av:myCat(),me:true}));const all=[...mine,...genComments(it)];
 const s=sheet('<div class="ct-sh-head">'+fmt(it.commentCount+mine.length)+' comments<button class="x">✕</button></div><div style="font:600 12px system-ui;color:#8a8b91;padding:0 16px 4px">Most relevant ▾</div><div class="ct-cms">'+all.map((c,i)=>'<div class="ct-cm"><i class="a" style="background-image:url('+avatar(c.av)+')"></i><div class="b"><div class="n">'+esc(c.n)+(c.me?' · You':'')+'</div>'+esc(c.t)+'<div class="m">'+c.ago+' · Reply</div></div><button class="h" data-h="'+i+'"><span>♡</span>'+(c.h?fmt(c.h):'')+'</button></div>').join('')+'</div><div class="ct-quick">'+QUICK.map(q=>'<button>'+esc(q)+'</button>').join('')+'</div>');
 s.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{b.classList.toggle('on');b.firstChild.textContent=b.classList.contains('on')?'♥':'♡'});
 s.querySelectorAll('.ct-quick button').forEach(b=>b.onclick=()=>{(st.comments[it.id]=st.comments[it.id]||[]).push({t:b.textContent,at:Date.now()});save();window.catCitySfx?.('pop');comments(it,el);const c=el.querySelector('[data-a="cm"]');c.lastChild.textContent=fmt(it.commentCount+st.comments[it.id].length)})}
function share(it){const players=(window.catCityOnlinePlayers?.()||[]).filter(p=>p.id!==window.catCityOnlineMe?.()).slice(0,6);
 const s=sheet('<div class="ct-sh-head">Share this video to get more views<button class="x">✕</button></div><div class="ct-shrow">'+
  '<button data-s="copy"><i style="background:#2f80ed">🔗</i>Copy link</button><button data-s="repost"><i style="background:#ffc300">🔁</i>'+(st.reposts[it.id]?'Reposted':'Repost')+'</button><button data-s="save"><i style="background:#8a8b91">🔖</i>Save</button>'+
  players.map((p,i)=>'<button data-p="'+i+'"><i style="background:#eee center/cover;image-rendering:pixelated;background-image:url('+avatar((ART()?.ids||[])[p.cat||0]||'astro')+')"></i>'+esc(String(p.name).slice(0,10))+'</button>').join('')+'</div>'+(players.length?'':'<div style="font-size:12px;color:#8a8b91;padding:0 16px 14px">Join an online room to send videos to friends.</div>'));
 s.querySelector('[data-s="copy"]').onclick=()=>{try{navigator.clipboard?.writeText('Cat Tok · @'+it.author+' · '+(it.caption||''))}catch(e){}it.shares++;closeSheet();toast('🔗 Link copied')};
 s.querySelector('[data-s="repost"]').onclick=()=>{st.reposts[it.id]=!st.reposts[it.id];save();closeSheet();toast(st.reposts[it.id]?'🔁 Reposted to your profile':'Repost removed')};
 s.querySelector('[data-s="save"]').onclick=()=>{st.saves[it.id]=true;save();closeSheet();toast('🔖 Saved')};
 s.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{const p=players[+b.dataset.p];window.catCityOnlineSend?.({type:'chat',text:'📱 Watch this on Cat Tok: @'+it.author+' · '+String(it.caption||'').slice(0,60)});closeSheet();toast('Sent to '+p.name)})}
function toast(t){const d=document.createElement('div');d.style.cssText='position:absolute;left:50%;top:45%;transform:translateX(-50%);z-index:40;background:#000c;color:#fff;padding:10px 16px;border-radius:8px;font:600 14px system-ui;pointer-events:none';d.textContent=t;app?.append(d);setTimeout(()=>d.remove(),1400)}

// ---------------------------------------------------------------- search
function openSearch(){const s=app.querySelector('.ct-search');s.classList.add('on');const inp=s.querySelector('input');inp.value='';search('');setTimeout(()=>inp.focus(),50)}
function search(q){const box=app.querySelector('.ct-sres');q=q.trim().toLowerCase();const L=items.filter(i=>!q||(i.author+' '+i.caption+' '+i.tags.join(' ')).toLowerCase().includes(q));
 box.innerHTML=(q?'':'<div style="padding:4px 16px 8px;font:700 14px system-ui">You may like</div>')+'<div class="ct-grid">'+L.slice(0,30).map(i=>'<button data-id="'+esc(i.id)+'" style="background-image:url('+thumb(i)+')">'+(i.kind==='live'?'<em>LIVE</em>':'')+'<span>@'+esc(i.author)+'</span></button>').join('')+'</div>'+(L.length?'':'<div class="ct-empty" style="position:static;color:#8a8b91">No results</div>');
 box.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{app.querySelector('.ct-search').classList.remove('on');jumpTo(b.dataset.id)})}
function jumpTo(id){tab='foryou';liveOnly=false;app.querySelectorAll('[data-t]').forEach(x=>x.classList.toggle('on',x.dataset.t==='foryou'));go('home');buildFeed();const feed=app.querySelector('.ct-feed'),el=feed.querySelector('[data-id="'+CSS.escape(id)+'"]');if(el){feed.prepend(el);feed.scrollTop=0;visible=el}const it=items.find(i=>i.id===id);if(it?.kind==='live'&&window.CatTok.openLive)window.CatTok.openLive(it)}
const thumbCache={};
function thumb(it){if(thumbCache[it.id])return thumbCache[it.id];const c=document.createElement('canvas');c.width=it.w||180;c.height=it.h||320;const tx=document.createElement('canvas'),k=2,cr=crisp(c,k,tx);cr.begin();try{it.draw(cr.g,c.width,c.height,2,it)}catch(e){}const out=document.createElement('canvas');out.width=c.width*k;out.height=c.height*k;const o=out.getContext('2d');o.imageSmoothingEnabled=false;o.drawImage(c,0,0,out.width,out.height);o.drawImage(tx,0,0);return thumbCache[it.id]=out.toDataURL('image/jpeg',.72)}

// ---------------------------------------------------------------- inbox + profile
function pushInbox(icon,title,text,av){st.inbox.unshift({icon,title,text,av,at:Date.now()});st.inbox=st.inbox.slice(0,60);save();updateBadge();window.CatPhone?.notify(title,text)}
function updateBadge(){const n=st.inbox.filter(m=>m.at>(st.inboxSeen||0)).length;const b=app?.querySelector('.ct-nav .badge');if(b){b.textContent=n>9?'9+':n;b.classList.toggle('on',n>0)}}
const ago=t=>{const s=(Date.now()-t)/1000;return s<60?'now':s<3600?Math.floor(s/60)+'m':s<86400?Math.floor(s/3600)+'h':Math.floor(s/86400)+'d'};
function inbox(el){const seen=st.inboxPrevSeen||0;st.inboxPrevSeen=st.inboxSeen;
 el.innerHTML='<div class="ct-white"><h2>Inbox</h2>'+
  '<div class="ct-row"><i class="ri" style="background:#fe2c55;color:#fff">👥</i><div class="rt"><b>Activity &amp; new followers</b><span>'+(Object.keys(st.likes).filter(k=>st.likes[k]).length)+' likes · '+(Object.keys(st.follows).filter(k=>st.follows[k]).length)+' following</span></div></div>'+
  '<div class="ct-row"><i class="ri" style="background:#161823;color:#fff">🔔</i><div class="rt"><b>System notifications</b><span>'+esc(st.inbox[0]?.title||'Welcome to Cat Tok!')+'</span></div>'+(st.inbox.some(m=>m.at>seen)?'<i class="dot"></i>':'')+'</div>'+
  '<div style="font:700 13px system-ui;color:#8a8b91;padding:10px 16px 2px">Notifications</div>'+
  (st.inbox.length?st.inbox.map(m=>'<div class="ct-row"><i class="ri" style="'+(m.av?'background-image:url('+avatar(m.av)+')':'')+'">'+(m.av?'':esc(m.icon))+'</i><div class="rt"><b>'+esc(m.title)+'</b><span>'+esc(m.text||'')+' · '+ago(m.at)+'</span></div>'+(m.at>seen?'<i class="dot"></i>':'')+'</div>').join(''):'<div class="ct-empty" style="position:static;color:#8a8b91;padding:40px"><div style="font-size:40px">📭</div>Nothing yet. Likes, follows and parcels show up here.</div>')+'</div>'}
function myName(){return window.catCityAccount?.()?.username||window.catCityOnlineName?.()||core.state.name||(ART()?.ids||['astro'])[core.state.cat||0]||'you'}
function myCat(){return (ART()?.ids||['astro'])[core.state.cat||0]||'astro'}
let ptab='videos';
function profile(el){const likedIds=Object.keys(st.likes).filter(k=>st.likes[k]),savedIds=Object.keys(st.saves).filter(k=>st.saves[k]),mine=items.filter(i=>i.author===myName()||st.reposts[i.id]);
 const grid=ptab==='liked'?items.filter(i=>likedIds.includes(i.id)):ptab==='saved'?items.filter(i=>savedIds.includes(i.id)):mine;
 el.innerHTML='<div class="ct-white"><div class="ct-prof"><div class="pav" style="background-image:url('+avatar(myCat())+')"></div><div class="handle">@'+esc(myName())+'</div><div class="ct-stats"><div><b>'+Object.keys(st.follows).filter(k=>st.follows[k]).length+'</b><span>Following</span></div><div><b>'+(st.followers||0)+'</b><span>Followers</span></div><div><b>'+fmt(st.likesReceived||0)+'</b><span>Likes</span></div></div><span class="ct-pbtn" data-orders>📦 Your orders</span>'+(pageHooks.profileExtra?'<span class="ct-pbtn" data-extra></span>':'')+'</div>'+
  '<div class="ct-ptabs"><button data-pt="videos" class="'+(ptab==='videos'?'on':'')+'">▦</button><button data-pt="saved" class="'+(ptab==='saved'?'on':'')+'">🔖</button><button data-pt="liked" class="'+(ptab==='liked'?'on':'')+'">♡</button></div>'+
  (grid.length?'<div class="ct-grid">'+grid.map(i=>'<button data-id="'+esc(i.id)+'" style="background-image:url('+thumb(i)+')">'+(i.pin?'<em>Pinned</em>':'')+'<span>▷ '+fmt(i.likes*7)+'</span></button>').join('')+'</div>':'<div class="ct-empty" style="position:static;color:#8a8b91;padding:40px">'+(ptab==='videos'?'Your videos and reposts show up here.':ptab==='saved'?'Tap 🔖 on a video to save it.':'Videos you like show up here.')+'</div>')+'</div>';
 el.querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>{ptab=b.dataset.pt;profile(el)});
 el.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>jumpTo(b.dataset.id));
 el.querySelector('[data-orders]').onclick=()=>pageHooks.orders?pageHooks.orders(el,api):toast('📦 Orders open with the Shop soon');
 if(pageHooks.profileExtra)pageHooks.profileExtra(el.querySelector('[data-extra]'),api)}

// ---------------------------------------------------------------- starter videos (more arrive in part 8)
const A=()=>ART();
const R=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
function sky(g,W,H,top,bot){for(let y=0;y<H;y+=4){const q=y/H;g.fillStyle=mix(top,bot,q);g.fillRect(0,y,W,4)}}
function mix(a,b,q){const p=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)),x=p(a),y=p(b);return 'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*q)).join(',')+')'}
function caption(g,W,text,y,size=11){g.font='bold '+size+'px "Cat City Pixel",monospace';g.textAlign='center';const words=String(text).split(' '),lines=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(g.measureText(t).width>W-24&&cur){lines.push(cur);cur=w}else cur=t}lines.push(cur);
 lines.forEach((l,i)=>{const yy=y+i*(size+4);g.lineWidth=3;g.strokeStyle='#000';g.strokeText(l,W/2,yy);g.fillStyle='#fff';g.fillText(l,W/2,yy)})}
const starters=[
 {id:'s-zoomies',author:'zoomie.astro',avatar:'astro',caption:'3am zoomies hit different 😼💨',tags:['catsoftiktok','zoomies','catcity'],draw(g,W,H,t){sky(g,W,H,'#3b2d5e','#b48ad8');R(g,0,H*.7,W,H*.3,'#6b4b9e');for(let i=0;i<6;i++)R(g,(i*41+t*120)%W-10,H*.7+((i*7)%20),18,2,'#fff3');const x=((t*90)%(W+60))-30;A()?.draw(g,x,H*.72,'astro','run',Math.floor(t*10)%4,{scale:2});caption(g,W,'when the zoomies hit at 3am',60)}},
 {id:'s-fishing',author:'pumpkin.fishes',avatar:'pumpkin',caption:'POV: you finally catch the golden fish #fishing',tags:['fyp','catcity'],draw(g,W,H,t){sky(g,W,H,'#7ec8e3','#f6e3b0');R(g,0,H*.62,W,H*.38,'#3f8fc8');for(let i=0;i<8;i++)R(g,(i*29+t*14)%W,H*.66+i*9,12,2,'#bfe8ff');R(g,20,H*.55,70,10,'#8a5a34');A()?.draw(g,50,H*.56,'pumpkin','sit',0,{scale:2});const bob=Math.sin(t*3)*3;g.strokeStyle='#fff';g.beginPath();g.moveTo(70,H*.45);g.lineTo(130,H*.66+bob);g.stroke();if((t%4)>2.6){R(g,124,H*.6-((t%4)-2.6)*30,14,8,'#ffd23c');caption(g,W,'GOLDEN FISH!!',90,14)}else caption(g,W,'waiting…',90)}},
 {id:'s-nap',author:'baby.naps',avatar:'baby',caption:'do not disturb 😴 #sleepy #cosy',tags:['asmr'],draw(g,W,H,t){sky(g,W,H,'#2b2140','#5b4377');R(g,30,H*.6,120,40,'#9b5fd6');R(g,30,H*.6,120,8,'#c9a2ff');A()?.draw(g,90,H*.66,'baby','sleep',Math.floor(t*1.5)%2,{scale:2.4});g.fillStyle='#fff';g.font='bold 14px monospace';for(let i=0;i<3;i++){const k=(t*.6+i/3)%1;g.globalAlpha=1-k;g.fillText('z',110+i*8+k*12,H*.5-k*40);}g.globalAlpha=1;caption(g,W,'me after one quest',60)}},
 {id:'s-dance',author:'galaxy.dances',avatar:'galaxy',caption:'learned the Cat City shuffle 💃 tag a friend',tags:['dance','trend'],draw(g,W,H,t){const c=['#ff6f9a','#7fd6ff','#ffd45c','#9bf06a'][Math.floor(t*2)%4];sky(g,W,H,'#1a1426',c);for(let i=0;i<10;i++){g.globalAlpha=.25;R(g,(i*37)%W,(i*71+t*60)%H,6,6,'#fff')}g.globalAlpha=1;const b=Math.abs(Math.sin(t*6))*14;A()?.draw(g,W/2,H*.7-b,'galaxy',Math.floor(t*4)%2?'jump':'idle',Math.floor(t*4)%2,{scale:2.6,flip:Math.floor(t*2)%2===1});caption(g,W,'the Cat City shuffle',58)}},
 {id:'s-birman',author:'skylar.story',avatar:'skylar',caption:'okay who left the painting like this?? 👀 #storytime',tags:['mystery','birman'],draw(g,W,H,t){sky(g,W,H,'#2a1840','#5b4a7a');R(g,40,70,100,120,'#c9963a');R(g,46,76,88,108,'#3b2557');const B=window.catCityBirmanArt;const k=Math.min(1,(t%5)/2);g.globalAlpha=k;B?.draw(g,90,170-36,'junior',{scale:.9,t});g.globalAlpha=1;A()?.draw(g,140,H*.85,'skylar','idle',0,{scale:2});caption(g,W,(t%5)<2?'the painting was empty…':'…until it wasn\'t 😳',40)}},
 {id:'s-squishem',author:'harley.collects',avatar:'harley',caption:'my Squishem collection so far 🧸 rate it 1-10',tags:['squishems','collection'],draw(g,W,H,t){sky(g,W,H,'#f7cfdc','#fff3d0');R(g,0,H*.68,W,H,'#e8a0b6');for(let i=0;i<5;i++){const x=24+i*33,b=Math.abs(Math.sin(t*3+i))*6;R(g,x,H*.6-b,22,18,['#ffb3c6','#a2d2ff','#caffbf','#fdffb6','#ffc6ff'][i]);R(g,x+5,H*.6-b+5,3,3,'#241832');R(g,x+14,H*.6-b+5,3,3,'#241832')}A()?.draw(g,W/2,H*.86,'harley','idle',Math.floor(t*2)%2,{scale:2});caption(g,W,'5 out of 10 Squishems!',58)}}
];
for(const v of starters)addItem({kind:'video',...v});

// ---------------------------------------------------------------- the app on the phone
const api={crisp,drawCrisp,fixFont,screenH:()=>screenH(),addItem,items,open:()=>window.CatPhone?.open('cattok'),inbox:pushInbox,avatar,rng,state:st,save,refresh:buildFeed,pageHooks,go:p=>app&&go(p),toast,caption,sky,mix,R,fmt,myName,myCat,sheet,closeSheet,thumb,get app(){return app}};
window.CatTok=api;
function register(){window.CatPhone?.registerApp({id:'cattok',name:'Cat Tok',icon:window.__catPhoneIcons?.tok||'',open(view){openCount++;open(view)},close})}
if(window.CatPhone)register();else addEventListener('catcity:phone-ready',register,{once:true});
if(!st.welcomed){st.welcomed=true;save();pushInbox('📱','Welcome to Cat Tok!','Swipe up for more. Double-tap to like.')}
window.dispatchEvent(new CustomEvent('catcity:cattok-ready'));
})();

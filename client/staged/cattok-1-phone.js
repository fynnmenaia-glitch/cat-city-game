/* Cat Tok part 1: the 📱 phone and its home screen.
 * A 📱 button (under Map) slides up a little phone. The home screen has two apps:
 * Cat Tok (parts 2+) and Settings (opens the game's own settings). While the
 * phone is open your cat stands still and is safe.
 * API for the other parts: window.CatPhone = {open, close, isOpen, screen, openApp, registerApp, notify}.
 */
(()=>{'use strict';
if(window.CatPhone)return;
const core=window.__catCityEngine;if(!core)return;
const $=id=>document.getElementById(id);
const css=document.createElement('style');css.id='cc-phone-style';css.textContent=`
#cc-phone-btn{position:fixed;right:10px;z-index:44;min-width:46px;min-height:46px;padding:4px 10px;border-radius:12px;border:2px solid #241832;background:#fff6e4;color:#241832;font:900 15px 'Cat City Pixel',system-ui;box-shadow:0 3px 0 #241832;display:none;align-items:center;gap:6px}
#cc-phone-btn.show{display:flex}
#cc-phone-btn .dot{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#ff2d55;color:#fff;font:900 11px system-ui;display:none;align-items:center;justify-content:center;border:2px solid #fff}
#cc-phone-btn.badge .dot{display:flex}
#cc-phone-btn.glow{animation:ccPhoneGlow 1.2s ease-in-out infinite}
@keyframes ccPhoneGlow{50%{box-shadow:0 3px 0 #241832,0 0 18px 6px #ffd45c;transform:translateY(-2px)}}
#cc-phone-wrap{position:fixed;inset:0;z-index:8800;display:none;align-items:flex-end;justify-content:center;background:#0b0612aa;backdrop-filter:blur(2px)}
#cc-phone-wrap.open{display:flex}
#cc-phone{position:relative;width:min(390px,96vw);height:min(800px,94dvh);margin-bottom:max(2dvh,env(safe-area-inset-bottom));border-radius:48px;background:#111;border:3px solid #3a3346;box-shadow:0 0 0 2px #000,0 20px 60px #000c,inset 0 0 0 2px #2a2533;padding:11px;box-sizing:border-box;transform:translateY(110%);transition:transform .38s cubic-bezier(.2,.9,.25,1.05)}
#cc-phone-wrap.up #cc-phone{transform:none}
#cc-phone-screen{position:relative;width:100%;height:100%;border-radius:38px;overflow:hidden;background:#000;color:#fff;font:14px -apple-system,system-ui,'Segoe UI',sans-serif;-webkit-user-select:none;user-select:none}
#cc-phone-island{position:absolute;top:9px;left:50%;transform:translateX(-50%);width:96px;height:28px;border-radius:15px;background:#000;z-index:60}
#cc-phone-status{position:absolute;top:0;left:0;right:0;height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 26px 0 30px;font:600 15px -apple-system,system-ui,sans-serif;z-index:59;pointer-events:none;text-shadow:0 1px 2px #0006}
#cc-phone-status .r{display:flex;gap:6px;align-items:center;font-size:12px}
#cc-phone-status .bat{width:22px;height:11px;border:1.5px solid currentColor;border-radius:3px;position:relative;opacity:.95}
#cc-phone-status .bat:after{content:'';position:absolute;left:1px;top:1px;bottom:1px;width:72%;background:currentColor;border-radius:1px}
#cc-phone-home{position:absolute;inset:0;padding:70px 22px 0}
#cc-phone-wall{position:absolute;inset:0;image-rendering:pixelated;width:100%;height:100%}
#cc-phone-apps{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:18px 8px}
.cc-app{display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:0;color:#fff;font:500 12px -apple-system,system-ui,sans-serif;text-shadow:0 1px 3px #000a;padding:0;cursor:pointer}
.cc-app i{display:block;width:60px;height:60px;border-radius:15px;box-shadow:0 4px 10px #0005;background-size:cover;image-rendering:pixelated;transition:transform .12s}
.cc-app:active i{transform:scale(.9)}
#cc-phone-dock{position:absolute;left:12px;right:12px;bottom:34px;height:86px;border-radius:30px;background:#ffffff38;backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:space-around}
#cc-phone-bar{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:134px;height:5px;border-radius:3px;background:#fff;opacity:.85;z-index:70;cursor:pointer}
#cc-phone-bar:before{content:'';position:absolute;left:-30px;right:-30px;top:-14px;bottom:-10px}
#cc-phone-appview{position:absolute;inset:0;z-index:20;background:#000;display:none;transform:scale(.6);opacity:0;transition:transform .25s,opacity .25s}
#cc-phone-appview.open{display:block}
#cc-phone-appview.in{transform:none;opacity:1}
#cc-phone-close{position:absolute;right:-6px;top:-6px;z-index:80;width:38px;height:38px;border-radius:50%;border:2px solid #fff;background:#241832;color:#fff;font:900 16px system-ui;cursor:pointer}
#cc-phone-toast{position:absolute;left:10px;right:10px;top:52px;z-index:75;border-radius:20px;background:#ffffffeb;color:#111;padding:10px 12px;display:flex;gap:10px;align-items:center;box-shadow:0 6px 20px #0005;transform:translateY(-140%);transition:transform .3s;font:13px -apple-system,system-ui,sans-serif}
#cc-phone-toast.show{transform:none}
#cc-phone-toast b{display:block;font-size:13px}
#cc-phone-toast i{width:36px;height:36px;border-radius:9px;flex:none;background-size:cover;image-rendering:pixelated}
@media (max-width:520px){#cc-phone{width:100vw;height:100dvh;margin:0;border-radius:0;border:0;padding:0;box-shadow:none}#cc-phone-screen{border-radius:0}#cc-phone-close{right:12px;top:auto;bottom:24px;display:none}#cc-phone-island{top:calc(6px + env(safe-area-inset-top))}#cc-phone-status{top:env(safe-area-inset-top)}}
/* The game's pixel button skin and fonts don't belong on the phone: it looks like a real phone. */
#cc-phone-wrap button{font-family:-apple-system,system-ui,'Segoe UI',Roboto,sans-serif!important;box-shadow:none;border-radius:inherit}
#cc-phone-wrap :is(input,select,textarea){box-shadow:none!important;border-radius:6px!important;font-family:-apple-system,system-ui,sans-serif!important}
`;document.head.append(css);

// ---------------------------------------------------------------- pixel icons
function px(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;draw(g,(x,y,ww,hh,col)=>{g.fillStyle=col;g.fillRect(x,y,ww,hh)});return c.toDataURL()}
// Cat Tok icon: a black tile with a pixel cat head and a music note, in cyan/pink offsets.
const ICON_TOK=px(20,20,(g,R)=>{R(0,0,20,20,'#0b0b10');const cat=(ox,oy,c)=>{R(ox+4,oy+5,2,2,c);R(ox+12,oy+5,2,2,c);R(ox+4,oy+7,10,7,c);R(ox+5,oy+14,8,1,c)};cat(-1,-1,'#25f4ee');cat(1,1,'#fe2c55');cat(0,0,'#fff');R(6,9,2,2,'#0b0b10');R(10,9,2,2,'#0b0b10');R(8,12,2,1,'#fe2c55')});
const ICON_SET=px(20,20,(g,R)=>{R(0,0,20,20,'#8e8e93');R(1,1,18,9,'#a7a7ad');for(const [x,y] of [[9,3],[9,14],[3,9],[14,9],[5,5],[13,5],[5,13],[13,13]])R(x,y,3,3,'#3a3a3c');R(6,6,8,8,'#3a3a3c');R(8,8,4,4,'#a7a7ad')});
window.__catPhoneIcons={tok:ICON_TOK,settings:ICON_SET};

// ---------------------------------------------------------------- the phone
const btn=document.createElement('button');btn.id='cc-phone-btn';btn.type='button';btn.title='Phone (T)';btn.innerHTML='📱<span class="dot"></span>';btn.setAttribute('aria-label','Open your phone');document.body.append(btn);
const wrap=document.createElement('div');wrap.id='cc-phone-wrap';wrap.className='cc-no-pixel';wrap.innerHTML=`<div id="cc-phone" role="dialog" aria-label="Phone"><button id="cc-phone-close" type="button" aria-label="Put the phone away">✕</button><div id="cc-phone-screen"><div id="cc-phone-island"></div><div id="cc-phone-status"><span id="cc-phone-clock">9:41</span><span class="r">▂▄▆ 5G <span class="bat"></span></span></div><div id="cc-phone-home"><canvas id="cc-phone-wall" width="90" height="190"></canvas><div id="cc-phone-apps"></div><div id="cc-phone-dock"></div></div><div id="cc-phone-appview"></div><div id="cc-phone-toast"><i></i><div><b></b><span></span></div></div><div id="cc-phone-bar" title="Home"></div></div></div>`;
document.body.append(wrap);
// Mark everything inside the phone so the game's pixel skin leaves it alone.
const mark=root=>root.querySelectorAll?.('button:not([data-no-pixel])').forEach(b=>b.setAttribute('data-no-pixel',''));
new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.nodeType!==1)continue;if(n.tagName==='BUTTON')n.setAttribute('data-no-pixel','');mark(n)}}).observe(wrap,{childList:true,subtree:true});mark(wrap);
const apps=[];
function registerApp(app){if(apps.some(a=>a.id===app.id))return;apps.push(app);renderHome()}
function renderHome(){const grid=$('cc-phone-apps'),dock=$('cc-phone-dock');grid.replaceChildren();dock.replaceChildren();
 for(const a of apps){const b=document.createElement('button');b.type='button';b.className='cc-app';b.innerHTML='<i style="background-image:url('+a.icon+')"></i><span>'+a.name+'</span>';b.onclick=()=>openApp(a.id);(a.dock?dock:grid).append(b)}
 if(!dock.children.length)dock.style.display='none';else dock.style.display=''}
let current=null;
function openApp(id){const a=apps.find(x=>x.id===id);if(!a)return;if(a.external){a.open();return}
 const view=$('cc-phone-appview');view.replaceChildren();view.classList.add('open');requestAnimationFrame(()=>view.classList.add('in'));current=a;a.open(view);
 $('cc-phone-status').style.color=a.statusDark?'#111':'#fff'}
function goHome(){const view=$('cc-phone-appview');if(!current){close();return}current.close?.();current=null;view.classList.remove('in');setTimeout(()=>{if(!current){view.classList.remove('open');view.replaceChildren()}},250);$('cc-phone-status').style.color='#fff'}
let openFlag=false;
function open(app){if(window.CAT_CITY_DEMO_OFF)return;openFlag=true;wrap.classList.add('open');document.body.classList.add('cc-phone-open');requestAnimationFrame(()=>requestAnimationFrame(()=>wrap.classList.add('up')));window.catCitySfx?.('pop');clock();drawWall();btn.classList.remove('glow');if(app)setTimeout(()=>openApp(app),120)}
function close(){if(current){current.close?.();current=null}wrap.classList.remove('up');openFlag=false;document.body.classList.remove('cc-phone-open');setTimeout(()=>{if(!openFlag){wrap.classList.remove('open');const v=$('cc-phone-appview');v.classList.remove('open','in');v.replaceChildren()}},380)}
btn.onclick=()=>openFlag?close():open();
$('cc-phone-close').onclick=close;
$('cc-phone-bar').onclick=goHome;
wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
// Swipe up from the bottom edge = home (like a real phone).
let sy=null;$('cc-phone-screen').addEventListener('touchstart',e=>{const t=e.touches[0],r=e.currentTarget.getBoundingClientRect();sy=r.bottom-t.clientY<34?t.clientY:null},{passive:true});
$('cc-phone-screen').addEventListener('touchend',e=>{if(sy!==null&&sy-e.changedTouches[0].clientY>50)goHome();sy=null},{passive:true});
// While the phone is open the game doesn't get your keys (except T / Escape), and you're safe.
addEventListener('keydown',e=>{const k=(e.key||'').toLowerCase();
 if(e.target?.closest?.('input,textarea,select,[contenteditable]'))return;
 if(!openFlag){if(k==='t'&&!e.repeat&&btn.classList.contains('show')&&!document.querySelector('.cc-pf-dialog.open')){e.preventDefault();open()}return}
 if(k==='escape'){e.preventDefault();e.stopImmediatePropagation();current?goHome():close();return}
 if(k==='t'){e.preventDefault();e.stopImmediatePropagation();close();return}
 // Game keys don't reach the game while you're on your phone.
 if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' ','e','shift','q','f','i','j','k','o','b','h','m','p','1','2','3','4','5','6','7','8','9','0'].includes(k))e.stopImmediatePropagation();
},true);
const oldHurt=window.catCityHurt;if(oldHurt)window.catCityHurt=(...a)=>{if(openFlag)return;return oldHurt(...a)};

// The clock shows the in-game time of day when the game has one, otherwise the real time.
function clock(){const d=new Date(),h=d.getHours(),m=d.getMinutes();$('cc-phone-clock').textContent=h+':'+String(m).padStart(2,'0')}
setInterval(()=>{if(openFlag)clock()},5000);
// Wallpaper: a pixel night sky over Cat City with your cat.
function drawWall(){const c=$('cc-phone-wall'),g=c.getContext('2d'),W=c.width,H=c.height,R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
 for(let y=0;y<H;y++){const q=y/H;R(0,y,W,1,'rgb('+Math.round(40+q*170)+','+Math.round(28+q*80)+','+Math.round(90+q*70)+')')}
 for(let i=0;i<40;i++)R((i*37)%W,(i*53)%(H*.6),1,1,i%3?'#fff8':'#fff');R(64,22,9,9,'#fff3c4');R(67,22,6,6,'#2a1d4a');
 const hills=(y0,col,a)=>{g.fillStyle=col;g.beginPath();g.moveTo(0,H);for(let x=0;x<=W;x+=3)g.lineTo(x,y0+Math.sin(x*a)*5);g.lineTo(W,H);g.fill()};hills(H*.7,'#3b2d5e',.09);hills(H*.78,'#2c2148',.13);
 for(const [x,w,h,c] of [[8,16,16,'#f5b4a5'],[30,18,20,'#c9b2ed'],[56,16,15,'#9ad7cf']]){R(x,H*.8-h,w,h,c);g.fillStyle='#4a3a6a';g.beginPath();g.moveTo(x-2,H*.8-h);g.lineTo(x+w/2,H*.8-h-8);g.lineTo(x+w+2,H*.8-h);g.fill();R(x+w/2-2,H*.8-6,4,6,'#5b3a22');R(x+3,H*.8-h+4,3,3,'#ffe9a8')}
 R(0,H*.8,W,H*.2,'#4f8f45');const id=(window.catCityCatArt?.ids||[])[s()?.cat||0]||'astro';window.catCityCatArt?.draw(g,W/2,H*.93,id,'sit',0,{scale:1})}
const s=()=>core.state;

// Settings app: opens the game's own settings panel.
registerApp({id:'settings',name:'Settings',icon:ICON_SET,dock:true,external:true,open(){close();setTimeout(()=>{const b=$('settings-control');if(b)b.click();else $('settings-panel')?.classList.add('show','open')},400)}});

// Notifications slide down from the top of the phone (and badge the 📱 button when it's away).
let toastT=0,unread=0;
function notify(title,text,icon){if(openFlag){const t=$('cc-phone-toast');t.querySelector('b').textContent=title;t.querySelector('span').textContent=text||'';t.querySelector('i').style.backgroundImage='url('+(icon||ICON_TOK)+')';t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),3500)}
 else{unread++;btn.classList.add('badge');btn.querySelector('.dot').textContent=unread>9?'9+':unread}}
btn.addEventListener('click',()=>{unread=0;btn.classList.remove('badge')});

// Place the 📱 button under the Map button (wherever the layout puts it), hide it when the game is busy.
function place(){const busy=core.bossMode||document.body.classList.contains('cc-in-interior-room')||document.body.classList.contains('cc-in-castle')||document.body.classList.contains('in-interior')||$('catcity-start-menu')?.classList.contains('show')||$('cc-upd')?.classList.contains('open');
 btn.classList.toggle('show',!busy||openFlag);
 // Sit under the column of buttons on the right (Map, Looks, Pause… whatever this screen shows).
 const m=$('map-open')?.getBoundingClientRect();if(!m||!m.height){btn.style.top='calc(260px + env(safe-area-inset-top))';return}
 const col=[...document.querySelectorAll('button,a')].filter(el=>el!==btn&&!el.closest('#cc-phone-wrap')).map(el=>el.getBoundingClientRect()).filter(r=>r.height&&r.top>=m.top-4&&r.right>m.left+4&&r.left<m.right+30&&r.bottom<innerHeight*.72).sort((a,b)=>a.top-b.top);
 let bottom=m.bottom;for(const r of col){if(r.top<=bottom+40)bottom=Math.max(bottom,r.bottom)}
 btn.style.top=Math.round(bottom+8)+'px';btn.style.right=Math.max(6,Math.round(innerWidth-m.right))+'px'}
setInterval(place,500);place();
window.CatPhone={open,close,isOpen:()=>openFlag,screen:()=>$('cc-phone-screen'),openApp,goHome,registerApp,notify,icons:window.__catPhoneIcons,button:btn};
window.dispatchEvent(new CustomEvent('catcity:phone-ready'));
})();

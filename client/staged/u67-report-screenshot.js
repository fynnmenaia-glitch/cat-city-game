/* Staged update u67 (request #67): 📸 in-game screenshots for glitch reports.
 * - 🐞 Report a glitch gets a "📸 Add a screenshot of the game" button, with a preview.
 * - Pause menu: "📸 Screenshot + report" snaps the game right now and opens the report.
 * - Only the game picture is captured (the game canvases), never the rest of the screen.
 * - The owner sees the pictures under 🐞 View Glitch Reports (and on the GitHub issue).
 * Server side: glitch_screens.py (/api/glitch-screenshot).
 */
(()=>{'use strict';
if(window.__ccU67)return;window.__ccU67=true;
const $=id=>document.getElementById(id);
let shot=null;// JPEG data URL waiting to be sent with the next report

// ---- Capture: draw every visible game canvas onto one picture, in page order.
function capture(){
 const W=innerWidth,H=innerHeight,scale=Math.min(1,960/Math.max(W,H));
 const out=document.createElement('canvas');out.width=Math.round(W*scale);out.height=Math.round(H*scale);const g=out.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,out.width,out.height);
 const canvases=[...document.querySelectorAll('canvas')].filter(c=>{if(!c.width||!c.height)return false;const r=c.getBoundingClientRect();if(r.width<W*.3||r.height<H*.3)return false;let e=c;while(e&&e!==document.body){const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return false;e=e.parentElement}return true});
 let drawn=0;for(const c of canvases){const r=c.getBoundingClientRect();try{g.imageSmoothingEnabled=false;g.drawImage(c,r.left*scale,r.top*scale,r.width*scale,r.height*scale);drawn++}catch(e){}}
 if(!drawn)return null;
 // Keep it small enough for the server (under ~170 KB).
 for(const q of [.7,.55,.4,.3]){const url=out.toDataURL('image/jpeg',q);if(url.length*3/4<170000)return url}
 return null;
}
function flash(){const f=document.createElement('div');f.style.cssText='position:fixed;inset:0;z-index:9999;background:#fff;opacity:.85;pointer-events:none;transition:opacity .35s';document.body.append(f);requestAnimationFrame(()=>requestAnimationFrame(()=>{f.style.opacity='0'}));setTimeout(()=>f.remove(),450);window.catCitySfx?.('pop')}

// ---- The report form: button + preview.
function formUI(){
 const send=$('cc-glitch-send');if(!send||$('cc-shot-row'))return;
 const row=document.createElement('div');row.id='cc-shot-row';row.style.cssText='margin:8px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap';
 row.innerHTML='<button type="button" id="cc-shot-take" style="min-height:40px">📸 Add a screenshot of the game</button><img id="cc-shot-preview" alt="Screenshot preview" style="display:none;max-width:120px;max-height:80px;border:2px solid #ffd45c;border-radius:6px;image-rendering:pixelated"><button type="button" id="cc-shot-remove" style="display:none;min-height:36px">✖ Remove</button>';
 (send.parentElement||send).before(row);
 $('cc-shot-take').onclick=()=>{const form=send.closest('[id]');const hide=[...document.querySelectorAll('.cc-glitch-dialog,.open,.show')].filter(e=>e.contains(send));hide.forEach(e=>e.style.visibility='hidden');
  // Wait one frame so the game is drawn without the form in the way, then snap.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const url=capture();hide.forEach(e=>e.style.visibility='');if(url){shot=url;flash()}else window.__catCityEngine?.note?.('📸 Couldn\'t take a screenshot here, sorry!');preview()}))};
 $('cc-shot-remove').onclick=()=>{shot=null;preview()};preview();
}
function preview(){const img=$('cc-shot-preview'),rm=$('cc-shot-remove'),take=$('cc-shot-take');if(!img)return;img.style.display=shot?'block':'none';rm.style.display=shot?'inline-block':'none';if(shot)img.src=shot;if(take)take.textContent=shot?'📸 Take it again':'📸 Add a screenshot of the game'}
function pauseUI(){const pause=$('pause-panel')?.querySelector('.cc-list');if(!pause||$('cc-shot-pause'))return;const b=document.createElement('button');b.type='button';b.id='cc-shot-pause';b.textContent='📸 Screenshot + report a glitch';
 b.onclick=()=>{$('pause-panel')?.classList.remove('show');requestAnimationFrame(()=>requestAnimationFrame(()=>{shot=capture();if(shot)flash();($('cc-glitch-pause')||$('cc-glitch-settings'))?.click();setTimeout(()=>{formUI();preview()},60)}))};pause.append(b)}

// ---- Send the screenshot right after the report itself is sent.
const realFetch=window.fetch.bind(window);
window.fetch=async(input,init)=>{const url=typeof input==='string'?input:input?.url||'';const res=await realFetch(input,init);
 if(shot&&/\/api\/glitch-report$/.test(url)&&(init?.method||'GET').toUpperCase()==='POST'&&res.ok){const image=shot;shot=null;preview();
  res.clone().json().then(d=>{if(d?.id)return realFetch('/api/glitch-screenshot',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:d.id,image})})}).then(r=>{if(r&&r.ok)window.__catCityEngine?.note?.('📸 Screenshot sent with your report!')}).catch(()=>{})}
 return res};

// ---- Owner: screenshots under 🐞 View Glitch Reports.
function adminUI(){const b=$('cc-admin-glitches');if(!b||b.dataset.shots)return;b.dataset.shots='1';
 b.addEventListener('click',async()=>{let box=$('cc-admin-shots');if(!box){box=document.createElement('div');box.id='cc-admin-shots';box.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:8px 0';($('cc-admin-glitch-list')||b).after(box)}
  box.textContent='📸 Loading screenshots…';
  try{const d=await realFetch('/api/glitch-screenshots',{credentials:'same-origin',cache:'no-store'}).then(r=>r.json());const list=d.screenshots||[];box.replaceChildren();
   if(!list.length){box.textContent='📸 No screenshots yet.';return}
   const h=document.createElement('strong');h.style.width='100%';h.textContent='📸 Screenshots ('+list.length+')';box.append(h);
   for(const s of list){const a=document.createElement('a');a.href=s.url||('/api/glitch-screenshot/'+encodeURIComponent(s.id));a.target='_blank';a.rel='noopener';a.style.cssText='display:block;width:140px;font-size:11px;color:inherit;text-decoration:none';
    const img=document.createElement('img');img.src='/api/glitch-screenshot/'+encodeURIComponent(s.id);img.alt='Screenshot: '+s.what;img.style.cssText='width:140px;border:2px solid #c7b6e6;border-radius:6px';img.onerror=()=>{if(s.url)img.src=s.url};
    const cap=document.createElement('div');cap.textContent=new Date(s.at*1000).toLocaleString()+' · '+s.by+(s.issue?' · #'+s.issue:'')+' · '+s.what;a.append(img,cap);box.append(a)}}catch(e){box.textContent='📸 Couldn\'t load screenshots.'}})}
setInterval(()=>{formUI();pauseUI();adminUI()},1000);formUI();pauseUI();adminUI();
})();

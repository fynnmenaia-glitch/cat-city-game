/* Cat City — staged updates + the owner's 🚀 Release update button.
 *
 * Updates built from the owner's in-game requests are staged scripts in
 * /staged/ (listed in /staged/manifest.json). They only load once the owner
 * presses "🚀 Release update". Every game checks /api/release every 20 s and
 * loads newly released scripts in place: nobody is moved or reloaded.
 *
 * For a change that has to touch existing code, guard it with
 *   window.catCityReleased('u57-purple-hat')
 * and listen for the `catcity:release` event (detail.ids) to switch it on live.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let released=new Set(),manifest=[],loaded=new Set(),tried=new Set(),first=true;
window.catCityReleased=id=>released.has(id)||tried.has(id);
function loadScripts(u){for(const f of u.files||[]){const key=u.id+'/'+f;if(loaded.has(key))continue;loaded.add(key);const sc=document.createElement('script');sc.src='/staged/'+f+'?v='+encodeURIComponent(u.id);sc.async=false;document.body.append(sc)}}
async function getManifest(){try{const r=await fetch('/staged/manifest.json',{cache:'no-store'});if(r.ok){const d=await r.json();manifest=Array.isArray(d.updates)?d.updates:[]}}catch(e){}}
let staged=[],history=[];
async function poll(){
 try{const r=await fetch('/api/release',{cache:'no-store',credentials:'same-origin'});if(!r.ok)return;const d=await r.json();
  staged=Array.isArray(d.staged)?d.staged:[];history=Array.isArray(d.history)?d.history:[];
  const fresh=(d.released||[]).filter(id=>!released.has(id));if(!fresh.length){renderAdmin();return}
  for(const id of fresh)released.add(id);await getManifest();
  const news=manifest.filter(u=>fresh.includes(u.id));news.forEach(loadScripts);
  window.dispatchEvent(new CustomEvent('catcity:release',{detail:{ids:fresh}}));
  if(!first&&news.length){const msg='✨ New update: '+news.map(u=>u.title).join(' · ');window.__catCityEngine?.note?.(msg);showWhenFree(news,msg)}
 }catch(e){}finally{first=false;renderAdmin()}}
function banner(text){const b=document.createElement('div');b.style.cssText='position:fixed;left:50%;top:calc(70px + env(safe-area-inset-top));transform:translateX(-50%);z-index:9500;padding:10px 16px;border-radius:14px;border:3px solid #ffd45c;background:#2a1d3aee;color:#fff6e4;font:bold 15px system-ui;max-width:90vw;text-align:center;box-shadow:0 0 22px #ffd45c88';b.textContent=text;document.body.append(b);setTimeout(()=>b.remove(),7000)}
// Play the global UPDATE! cutscene, but not in the middle of a boss fight or a mission.
function showWhenFree(news,msg){const core=window.__catCityEngine;const busy=()=>core?.bossMode||!!window.catCityCastleEscape?.open?.()||document.getElementById('cc-cz-scene')?.classList.contains('open');
 const go=()=>{if(busy()){setTimeout(go,2000);return}if(window.catCityUpdateCutscene)window.catCityUpdateCutscene(news);else{banner(msg);for(const u of news){try{window.catCityOnRelease?.[u.id]?.()}catch(e){}}}};go()}
poll();setInterval(poll,10000);

// ------------------------------------------------------------------ owner card
function renderAdmin(){
 const tools=$('cc-admin-tools');if(!tools||!window.catCityIsOwner?.())return;
 let card=$('cc-admin-release');
 if(!card){card=document.createElement('div');card.id='cc-admin-release';card.className='cc-admin-card';card.style.cssText='border:2px solid #ffd45c;border-radius:12px;padding:10px;margin:22px 0 10px';
  const anchor=$('cc-admin-update');if(anchor)anchor.after(card);else{const m=$('cc-admin-missions');m?m.before(card):tools.append(card)}}
 const list=staged.length?staged.map(u=>'<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #ffd45c66"><span>🆕 '+esc(u.title)+(u.issue?' <small>(#'+u.issue+')</small>':'')+'</span><button type="button" data-try="'+esc(u.id)+'" style="margin:0">'+(tried.has(u.id)?'✅ Trying':'🧪 Try (only me)')+'</button></div>').join(''):'<p style="font-size:12px;margin:4px 0">No updates waiting. When your update requests are built, they wait here until you release them.</p>';
 const last=history.length?'<p style="font-size:11px;margin:6px 0 0">Last release: '+new Date(history[history.length-1].at*1000).toLocaleString()+' · '+history[history.length-1].ids.length+' update(s)</p>':'';
 const html='<h4 style="margin:0 0 6px;font:900 15px system-ui">🚀 Updates waiting</h4><p style="font-size:12px;margin:0 0 6px">Players keep playing where they are. Released updates stay in the game for good.</p>'+list+
  '<button type="button" id="cc-release-preview" style="margin-top:8px;width:100%">🎬 Preview the update cutscene (only me)</button><button type="button" id="cc-release-go" style="margin-top:8px;width:100%;font-weight:900"'+(staged.length?'':' disabled')+'>🚀 Release update'+(staged.length?' ('+staged.length+')':'')+'</button><p id="cc-release-msg" style="font-size:12px;margin:4px 0 0" aria-live="polite"></p>'+last;
 if(card.dataset.html===html)return;card.dataset.html=html;card.innerHTML=html;
 card.querySelectorAll('[data-try]').forEach(b=>b.onclick=async()=>{const id=b.dataset.try;if(tried.has(id))return;tried.add(id);await getManifest();const u=manifest.find(x=>x.id===id);if(u)loadScripts(u);window.dispatchEvent(new CustomEvent('catcity:release',{detail:{ids:[id],preview:true}}));card.dataset.html='';renderAdmin()});
 $('cc-release-preview').onclick=()=>{document.querySelectorAll('.show,.open').forEach(el=>{if(/settings|admin/i.test(el.id||'')&&el.id!=='cc-admin-tools')el.classList.remove('show','open')});window.catCityUpdateCutscene?.(staged.length?staged:[{title:'Preview: your next update'}])};
 $('cc-release-go').onclick=async()=>{const msg=$('cc-release-msg');if(!confirmRelease())return;msg.textContent='Releasing…';
  try{const r=await fetch('/api/release',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'});const d=await r.json();
   if(!r.ok)throw Error(d.error||'Could not release');msg.textContent=d.released?.length?'🚀 Released! Everyone sees the UPDATE! cutscene within 10 seconds, without leaving where they are.'+(d.saved===false?' (Saved on the server only: check GITHUB_REPORT_TOKEN.)':''):'Nothing new to release.';
   poll()}catch(e){msg.textContent='⚠️ '+e.message}};
}
let armed=0;
function confirmRelease(){const b=$('cc-release-go');if(Date.now()-armed<4000){armed=0;return true}armed=Date.now();b.textContent='Tap again to release to everyone';setTimeout(()=>{if(b.isConnected){b.dataset.x='';const card=$('cc-admin-release');if(card)card.dataset.html='';renderAdmin()}},4000);return false}
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
setInterval(renderAdmin,2000);
})();

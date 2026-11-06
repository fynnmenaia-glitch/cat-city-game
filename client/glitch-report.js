/* Cat City — 🐞 Glitch Report.
 *
 * A "🐞 Report a glitch" button in Settings and the Pause menu opens a short
 * form: what happened (required) and how it happened, or tick "I don't know".
 * Game details are added automatically (cat, area, position, boss fight,
 * event, online, screen, device, recent errors) so glitches are easier to fix.
 * Sent to /api/glitch-report (glitch_reports.py). The owner can read reports in
 * the admin panel ("🐞 View Glitch Reports").
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,$=id=>document.getElementById(id);
// Remember the last few page errors to send with a report.
const recent=[];addEventListener('error',e=>{recent.push(String(e.message||'').slice(0,120));if(recent.length>3)recent.shift()});
addEventListener('unhandledrejection',e=>{recent.push(String(e.reason?.message||e.reason||'').slice(0,120));if(recent.length>3)recent.shift()});
const css=document.createElement('style');css.textContent=[
 '#cc-glitch{display:none;position:fixed;inset:0;z-index:9300;background:#120b1cdd;align-items:center;justify-content:center;padding:10px}','#cc-glitch.open{display:flex}',
 '#cc-glitch>div{background:#2a1d3a;color:#fff6e4;border:3px solid #ff8fa3;padding:14px;width:min(460px,96vw);max-height:92dvh;overflow:auto;font:14px system-ui}',
 '#cc-glitch h3{margin:0 0 6px;color:#ffb0c0}','#cc-glitch label{display:block;margin:10px 0 4px;font-weight:900}',
 '#cc-glitch textarea{width:100%;min-height:76px;padding:8px;font:14px system-ui;background:#120b1c;color:#fff;border:2px solid #5a4a6e;box-sizing:border-box}',
 '#cc-glitch textarea:disabled{opacity:.45}','#cc-glitch .dk{display:flex;gap:8px;align-items:center;font-weight:400;margin-top:6px}','#cc-glitch .dk input{width:auto;min-height:0;margin:0}',
 '#cc-glitch small{color:#d8c8f0}','#cc-glitch .act{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}',
 '#cc-glitch .act button{padding:9px 14px;min-height:42px;font-weight:900;border:2px solid #fff}','#cc-glitch-send{background:#ff8fa3;color:#2a1d36}','#cc-glitch-cancel{background:#d8c8f0;color:#2a1d36}',
 '#cc-glitch-msg{min-height:18px;margin-top:8px}','.cc-glitch-open{background:#ffb0c0!important;color:#3a1d2a!important}'
].join('');document.head.append(css);
const box=document.createElement('div');box.id='cc-glitch';box.innerHTML=`<div role="dialog" aria-label="Report a glitch"><h3>🐞 Report a glitch</h3>
<small>Thank you for helping fix Cat City! Tell us what went wrong.</small>
<label for="cc-glitch-what">What happened?</label><textarea id="cc-glitch-what" maxlength="1000" placeholder="e.g. My cat walked through the wall of the shop"></textarea>
<label for="cc-glitch-how">How did it happen?</label><textarea id="cc-glitch-how" maxlength="1000" placeholder="e.g. I pressed Sprint, let go, then pressed it again"></textarea>
<label class="dk"><input type="checkbox" id="cc-glitch-dk"> I don't know how it happened</label>
<small>Your cat, where you are and your screen size are sent automatically to help fix it.</small>
<div class="act"><button type="button" id="cc-glitch-send">🐞 Send report</button><button type="button" id="cc-glitch-cancel">Cancel</button></div><div id="cc-glitch-msg" aria-live="polite"></div></div>`;
document.body.append(box);
const dk=$('cc-glitch-dk'),how=$('cc-glitch-how'),msg=$('cc-glitch-msg');
dk.onchange=()=>{how.disabled=dk.checked;if(dk.checked)how.value=''};
function open(){msg.textContent='';box.classList.add('open');setTimeout(()=>$('cc-glitch-what').focus(),50)}
function close(){box.classList.remove('open')}
$('cc-glitch-cancel').onclick=close;
function context(){
 const ev=window.catCityGetAdventureEvent?.()||{},b=document.body;
 const area=window.catCityAudio?.biome?.()||'';
 return {cat:core.cats[s.cat]?.name+(window.catCitySkins?.current?.()?' ('+window.catCitySkins.current()+' skin)':''),
  area:window.catCityCaveState?.().inside?'cave':b.classList.contains('cc-in-interior-room')?'inside a building':area==='moonstone'?'Flower Terrace':area,
  position:Math.round(s.x)+', '+Math.round(s.y),boss:core.bossMode?String(core.bossChapter):'',event:ev.name&&ev.name!=='none'?ev.name:'',
  online:window.catCityOnlineConnected?.()?'yes':'no',screen:innerWidth+'x'+innerHeight,device:navigator.userAgent.slice(0,180),
  errors:recent.join(' | '),page:document.querySelectorAll('script[src]').length+' scripts'};
}
$('cc-glitch-send').onclick=async()=>{
 const what=$('cc-glitch-what').value.trim();
 if(what.length<5){msg.textContent='Please describe what happened.';return}
 if(!dk.checked&&how.value.trim().length<3){msg.textContent='Please say how it happened, or tick "I don\'t know".';return}
 msg.textContent='Sending…';
 try{const r=await fetch('/api/glitch-report',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({what,how:how.value.trim(),dontKnow:dk.checked,context:context()})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){msg.textContent=d.error||'Could not send right now. Please try again later.';return}
  $('cc-glitch-what').value='';how.value='';dk.checked=false;how.disabled=false;close();core.note('🐞 Thanks! Your glitch report was sent.');
 }catch(e){msg.textContent='Could not send right now. Please try again later.'}
};
// Buttons in Settings and the Pause menu.
function addButtons(){
 const settings=$('settings-panel');
 if(settings&&!$('cc-glitch-settings')){const b=document.createElement('button');b.type='button';b.id='cc-glitch-settings';b.className='cc-glitch-open';b.textContent='🐞 Report a glitch';b.style.cssText='margin:8px 2px;padding:10px 13px;min-height:43px';b.onclick=open;(settings.querySelector('.settings-section')||settings).append(b)}
 const pause=$('pause-panel')?.querySelector('.cc-list');
 if(pause&&!$('cc-glitch-pause')){const b=document.createElement('button');b.type='button';b.id='cc-glitch-pause';b.className='cc-glitch-open';b.textContent='🐞 Report a glitch';b.onclick=()=>{$('pause-panel')?.classList.remove('show');open()};pause.append(b)}
 // Owner: read reports in the admin panel.
 const admin=$('cc-admin-reports');
 if(admin&&!$('cc-admin-glitches')){const b=document.createElement('button');b.type='button';b.id='cc-admin-glitches';b.textContent='🐞 View Glitch Reports';const out=document.createElement('pre');out.id='cc-admin-glitch-list';out.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px';
  b.onclick=async()=>{out.textContent='Loading…';try{const d=await fetch('/api/glitch-reports',{credentials:'same-origin',cache:'no-store'}).then(r=>r.json());
   out.textContent=(d.github?'':'(GitHub issues are off: add GITHUB_REPORT_TOKEN in Render to send reports to the hourly check.)\n')+(d.database?'':'(Reports are only in memory: a restart erases them. Check DATABASE_URL in Render.)\n')+'\n'+((d.reports||[]).map(r=>new Date(r.at*1000).toLocaleString()+' · '+r.by+(r.issue?' · GitHub #'+r.issue:'')+'\nWHAT: '+r.what+'\nHOW: '+r.how+'\n'+Object.entries(r.context||{}).filter(([,v])=>v).map(([k,v])=>'  '+k+': '+v).join('\n')).join('\n\n')||'No glitch reports yet. 🎉')}catch(e){out.textContent='Could not load reports.'}};
  admin.after(b,out)}
 // Owner: ask Claude for an update. Only the owner account is accepted by the server.
 if(admin&&!$('cc-admin-update')){const box=document.createElement('div');box.id='cc-admin-update';box.style.cssText='margin:10px 0;padding:8px;border:2px dashed #ffd45c88;border-radius:10px';
  box.innerHTML='<strong>🛠️ Request an update</strong><br><span style="font-size:11px">Describe what you want changed or added. Claude picks it up within the hour, builds it, tests it and puts it live.</span><textarea id="cc-admin-update-text" rows="4" maxlength="4000" style="width:100%;margin-top:6px;font:13px system-ui;border-radius:8px;padding:6px" placeholder="e.g. Make the taxi honk twice and add a purple hat to Marmalade\'s shop"></textarea><button id="cc-admin-update-send" type="button">📨 Send update request</button><div id="cc-admin-update-status" style="font-size:12px;margin-top:4px" aria-live="polite"></div>';
  (document.getElementById('cc-admin-glitch-list')||admin).after(box);
  $('cc-admin-update-send').onclick=async()=>{const t=$('cc-admin-update-text'),st=$('cc-admin-update-status'),text=t.value.trim();if(text.length<8){st.textContent='Please describe the update in a few words.';return}
   st.textContent='Sending…';try{const r=await fetch('/api/update-request',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});const d=await r.json().catch(()=>({}));
    if(!r.ok){st.textContent='❌ '+(d.error||'Only the owner account can send update requests.');return}
    t.value='';st.textContent=d.issue?'✅ Sent as GitHub issue #'+d.issue+'. Claude checks every hour and will comment there when it\'s live.':'⚠️ Received, but GitHub didn\'t take it (check GITHUB_REPORT_TOKEN in Render).'}catch(e){st.textContent='❌ Could not send. Are you online?'}}}
}
addButtons();setInterval(addButtons,2000);
window.catCityGlitchReport={open,close};
})();

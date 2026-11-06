/* Cat City Accounts, moderated lobby chat, friendly NPCs and protected owner dashboard. */
(() => {'use strict';
const $ = id => document.getElementById(id);
const core=window.__catCityEngine;
if(!core) return;
const css=document.createElement('style');css.id='catcity-social-styles';css.textContent=`
.cc-social-modal{display:none;position:fixed;inset:0;z-index:4500;align-items:center;justify-content:center;padding:12px;background:#1c1539d9;touch-action:pan-y!important}
.cc-social-modal.open{display:flex}.cc-social-card{width:min(470px,96vw);max-height:91dvh;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y!important;background:#fff6ed;color:#362947;border:3px solid #bda2db;border-radius:23px;padding:18px;box-shadow:0 20px 65px #160d2ac4}
.cc-social-card button,.cc-social-card input,.cc-social-card textarea,.cc-social-card select{touch-action:manipulation!important;font-size:15px!important}
.cc-social-card input,.cc-social-card textarea,.cc-social-card select{display:block;width:100%;min-height:43px;border:2px solid #bda6d4;border-radius:10px;background:#fff;color:#302343;padding:9px;margin:6px 0 12px}
.cc-social-card textarea{min-height:70px;resize:vertical;touch-action:pan-y!important}
.cc-social-card label{display:block;font-weight:800;font-size:13px;margin-top:9px}
.cc-social-card button{border:2px solid #fff;background:#d6b6f3;color:#382948;font-weight:800;padding:10px 13px;border-radius:12px;min-height:43px}
.cc-social-card button:disabled{opacity:.5}
.cc-social-card .cc-social-primary{background:#b5ebd2}.cc-social-card .cc-social-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.cc-social-card .cc-social-head h2{margin:0;font-size:20px}.cc-social-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.cc-social-row button{flex:1}
.cc-social-message{font-size:13px;color:#6d4c70;line-height:1.4;min-height:20px}.cc-social-error{color:#a32942!important}
.cc-account-title-actions{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin-top:6px}.cc-account-title-actions button{margin:0!important;font-size:12px!important;padding:8px 10px!important;min-height:39px!important;background:#fff0cf!important}
#cc-account-status{font-size:12px;text-align:center;color:#ffefd6;margin-top:5px}
#cc-chat-float{display:none;position:fixed;left:10px;bottom:calc(300px + env(safe-area-inset-bottom,0px));width:108px;min-height:43px;z-index:90;border:2px solid #fff;border-radius:15px;box-shadow:0 5px 13px #1c134c88;background:#d2b6fa;color:#35214d;margin:0;padding:7px 9px;font-size:14px;font-weight:900;touch-action:manipulation!important}
#cc-chat-float.show{display:block}body.taghouse-inside #cc-chat-float{left:auto;bottom:auto;right:12px;top:calc(124px + env(safe-area-inset-top,0px));z-index:750}
/* Quick Home remains available under Pause, leaving Sprint fully uncovered. */
#cat-home-fast{display:none!important}
/* A room-chat control is visible on the game HUD only while actually online. */
body:has(#pause-panel.show) #cc-chat-float,body:has(.cc-social-modal.open) #cc-chat-float,body:has(#catcity-online-panel.open) #cc-chat-float,body:has(#settings-panel.open) #cc-chat-float{display:none!important}
#cc-chat-card{display:flex;flex-direction:column;max-height:87dvh}#cc-chat-list{min-height:130px;max-height:45dvh;overflow-y:auto;touch-action:pan-y!important;overscroll-behavior:contain;border:2px solid #e2d3eb;border-radius:13px;padding:8px;background:#fff}
.cc-chat-entry{padding:7px 4px;border-bottom:1px solid #e8dbef;font-size:13px;overflow-wrap:anywhere}.cc-chat-entry strong{color:#674183}.cc-chat-entry button{float:right;padding:2px 7px;min-height:24px;font-size:11px!important;margin:0;background:#f4e4ed}
#cc-chat-presets{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0}#cc-chat-presets button{min-height:32px;padding:5px 7px;font-size:11px!important;margin:0}
#cc-chat-form{display:flex;gap:7px;align-items:center}#cc-chat-form input{flex:1;margin:0;min-width:0}#cc-chat-form button{margin:0}
#cc-npc-history{height:170px;overflow-y:auto;touch-action:pan-y!important;border-radius:12px;background:#f4eafa;padding:10px;color:#382b4e;font-size:13px;line-height:1.5}
.cc-npc-line{padding:5px 0;border-bottom:1px solid #d9c9e5}
body:has(#settings-panel.open) #start-arrived,body:has(.cc-social-modal.open) #start-arrived{display:none!important}
#cc-global-announcement{display:none;position:fixed;top:calc(44px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);width:min(520px,90vw);z-index:1600;text-align:center;background:#382452f5;color:#fff6dc;border:2px solid #f7d49f;border-radius:15px;box-shadow:0 10px 26px #150e3288;padding:13px;font-size:15px;font-weight:800;pointer-events:none;overflow-wrap:anywhere}
#cc-global-announcement.show{display:block;animation:ccpop .4s ease-out}
@keyframes ccpop{from{transform:translate(-50%,-10px) scale(.94);opacity:0}to{transform:translate(-50%,0) scale(1);opacity:1}}
#cc-admin-settings{display:none}#cc-admin-settings.visible{display:block}#cc-admin-tools{display:none}#cc-admin-tools.open{display:block;margin-top:10px;touch-action:pan-y!important}
#cc-admin-tools button{min-height:39px;margin:3px 0}#cc-admin-tools input,#cc-admin-tools select,#cc-admin-tools textarea{max-width:100%;padding:8px;font-size:14px;background:#fff;color:#2c2140;border:2px solid #cfb5e8;border-radius:9px;touch-action:manipulation!important}
#cc-admin-tools label{display:block;margin:7px 0;font-size:13px}#cc-admin-tools textarea{width:100%;min-height:60px;touch-action:pan-y!important}
#cc-admin-tools .cc-admin-inline{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#cc-admin-tools .cc-admin-inline>*{flex:1;min-width:115px}
body.start-menu-open #cc-chat-float,body.boss-fighting #cc-chat-float{display:none!important}
@media(max-width:600px){#cc-chat-float{bottom:calc(272px + env(safe-area-inset-bottom,0px))}}
@media(max-width:440px){.cc-social-card{padding:12px}.cc-social-card .cc-social-head h2{font-size:18px}}
`;document.head.append(css);

function modal(id,body){const el=document.createElement('div');el.id=id;el.className='cc-social-modal';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.innerHTML=body;document.body.append(el);return el;}
const account=modal('cc-account-modal',`<div class="cc-social-card"><div class="cc-social-head"><h2>🐱 Cat City Account</h2><button type="button" id="cc-account-close">✕</button></div>
<div id="cc-account-info" class="cc-social-message">Sign in to your Cat City account.</div>
<div id="cc-account-forms"><label for="cc-account-name">Username</label><input id="cc-account-name" autocomplete="username" maxlength="20" placeholder="Your Cat City username" />
<label for="cc-account-pass">Password</label><input id="cc-account-pass" type="password" autocomplete="current-password" maxlength="128" placeholder="Password (never shown in chat)" />
<div class="cc-social-row"><button id="cc-account-login" class="cc-social-primary">🐾 Log In</button><button id="cc-account-register">✨ Create Account</button></div></div>
<div id="cc-account-signed" hidden><div class="cc-social-row"><button id="cc-account-cloud-save">☁️ Save to Cloud</button><button id="cc-account-cloud-load">📥 Load Cloud Save</button><button id="cc-account-logout">Log Out</button></div></div>
<p class="cc-social-message" id="cc-account-cloud-note"></p><p id="cc-account-feedback" class="cc-social-message" aria-live="polite"></p>
<small style="display:block;color:#7b6884">Passwords are never stored in the game files. Cloud saves require persistent database hosting; local saves continue working as before.</small></div>`);
const chat=modal('cc-chat-modal',`<div class="cc-social-card" id="cc-chat-card"><div class="cc-social-head"><h2>💬 Room Chat</h2><button id="cc-chat-close">✕</button></div>
<p class="cc-social-message">Only players in your room see these messages. No swearing, bullying or sharing contact details. Tap 🚩 to report a message.</p>
<div id="cc-chat-list" aria-live="polite"></div><div id="cc-chat-presets"></div><form id="cc-chat-form"><input type="text" id="cc-chat-input" maxlength="160" autocomplete="off" placeholder="Say something friendly…" /><button type="submit" class="cc-social-primary">Send</button></form><p id="cc-chat-feedback" class="cc-social-message" aria-live="polite"></p></div>`);
const npc=modal('cc-npc-modal',`<div class="cc-social-card"><div class="cc-social-head"><h2>🐱 Talk to a Cat</h2><button id="cc-npc-close">✕</button></div>
<strong id="cc-npc-current">Talk to a nearby cat 🐾</strong><select id="cc-npc-select" style="display:none" aria-label="Nearby cat"><option>Marmalade</option><option>Pebble</option><option>Luna</option><option>Biscuit</option><option>Forge</option><option>SlayCat</option><option>Poppy</option><option>Mochi</option><option>Nova</option></select>
<div id="cc-npc-history" aria-live="polite">🐾 Hello! Ask about adventures, quests, materials or anything in Cat City.</div>
<form id="cc-npc-form"><label for="cc-npc-input">Your message</label><input id="cc-npc-input" maxlength="160" placeholder="Hello! What should we explore?" autocomplete="off"/><button class="cc-social-primary" type="submit">💬 Talk</button></form><button id="cc-npc-forge" type="button" style="display:none;background:#b8e8d0">🔨 Forge Special Armour</button><button id="cc-npc-story" type="button">📖 Quest / Story Conversation</button><p id="cc-npc-feedback" class="cc-social-message"></p>
<small>These cats give safe, context-aware responses. </small></div>`);
const announcement=document.createElement('div');announcement.id='cc-global-announcement';announcement.setAttribute('role','status');document.body.append(announcement);
const floater=document.createElement('button');floater.id='cc-chat-float';floater.type='button';floater.setAttribute('aria-label','Open multiplayer room chat');floater.textContent='💬 Chat';document.body.append(floater);
const title=$('catcity-start-menu')?.querySelector('.title-card');
const titleRow=document.createElement('div');titleRow.className='cc-account-title-actions';titleRow.innerHTML='<button id="cc-title-login" type="button">🔐 Log In</button><button id="cc-title-register" type="button">✨ Create Account</button>';
const titleStatus=document.createElement('div');titleStatus.id='cc-account-status';titleStatus.textContent='Optional account sign-in';
if(title){title.append(titleRow,titleStatus);}
let currentAccount=null, cloudAvailable=false, onlineReady=false, adminNpcs=[],chatMessages=[], mutedCats=new Set(),lastAnnouncement='',lastWorldPoll=0;
window.catCityIsOwner=()=>!!currentAccount?.admin;
window.catCityAccount=()=>currentAccount;
function feedback(node,msg,error=false){node.textContent=msg;node.classList.toggle('cc-social-error',error);}
function open(el){el.classList.add('open');}function close(el){if(document.activeElement && el.contains(document.activeElement))document.activeElement.blur();el.classList.remove('open');}
for(const el of [account,chat,npc]){
 el.addEventListener('click',e=>{if(e.target===el)close(el)});
 // Typing into chat, account and NPC fields must never trigger WASD/E gameplay.
 el.addEventListener('keydown',e=>e.stopPropagation());
 el.addEventListener('keyup',e=>e.stopPropagation());
}
$('cc-account-close').onclick=()=>close(account);$('cc-chat-close').onclick=()=>close(chat);$('cc-npc-close').onclick=()=>close(npc);
$('cc-title-login').onclick=()=>open(account);$('cc-title-register').onclick=()=>{open(account);$('cc-account-name').focus();};
// Account controls stay in Pause. Chat is on the HUD for connected players only;
// conversations with NPCs happen in the world when the player approaches a cat.
const pauseList=$('pause-panel')?.querySelector('.cc-list');
if(pauseList){const b=document.createElement('button');b.id='cc-pause-account';b.type='button';b.textContent='🔐 Account & Cloud Saves';b.addEventListener('click',()=>{$('pause-panel').classList.remove('show');open(account);});pauseList.append(b);}
$('cc-chat-float').onclick=()=>{if(window.catCityOnlineConnected?.()){floater.textContent='💬 Chat';open(chat);}};
async function api(url,data){const resp=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await resp.json().catch(()=>({error:'Server response could not be read.'}));if(!resp.ok)throw Error(result.error||'Something went wrong.');return result;}
function refreshAccount(){
 const signed=!!currentAccount;
 $('cc-account-forms').hidden=signed;$('cc-account-signed').hidden=!signed;
 $('cc-account-info').textContent=signed?'Logged in as '+currentAccount.username+(currentAccount.admin?' · 👑 Owner':''):'Sign in or create a Cat City account.';
 titleStatus.textContent=signed?'🐾 '+currentAccount.username+(currentAccount.admin?' 👑':''):'Optional account sign-in';
 $('cc-account-cloud-save').disabled=!cloudAvailable;$('cc-account-cloud-load').disabled=!cloudAvailable;
 $('cc-account-cloud-note').textContent=cloudAvailable?'Cloud saves are enabled for player accounts.':'Cloud registration and saves are not available until a persistent database is connected. Your existing local saves still work.';
 adminSection.classList.toggle('visible',!!currentAccount?.admin);
 if(!currentAccount?.admin){$('cc-admin-tools').classList.remove('open');$('cc-admin-toggle').checked=false;}
}
async function initAccount(){try{
 const status=await fetch('/api/account/status',{cache:'no-store'}).then(r=>r.json());cloudAvailable=!!status.cloudSavesAvailable;
 const me=await fetch('/api/account/me',{cache:'no-store',credentials:'same-origin'}).then(r=>r.json());currentAccount=me.account||null;
}catch(e){feedback($('cc-account-feedback'),'Account server unavailable. You can still play locally.',true);}refreshAccount();}
async function doLogin(register){
 const username=$('cc-account-name').value.trim(),password=$('cc-account-pass').value;
 if(!username||!password)return feedback($('cc-account-feedback'),'Enter your username and password.',true);
 const btn=$('cc-account-login');btn.disabled=true;
 try{const result=await api(register?'/api/account/register':'/api/account/login',{username,password});
   currentAccount=result.account;
   feedback($('cc-account-feedback'),'Signed in successfully! 🐾');
   if(window.catCityOnlineConnected?.()) feedback($('cc-account-feedback'),'Signed in! Rejoin your online room to use your account name in chat.');
   refreshAccount();
 }catch(e){feedback($('cc-account-feedback'),e.message,true);}finally{$('cc-account-pass').value='';btn.disabled=false;}
}
$('cc-account-login').onclick=()=>doLogin(false);$('cc-account-register').onclick=()=>doLogin(true);
$('cc-account-pass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin(false)});
$('cc-account-logout').onclick=async()=>{try{await api('/api/account/logout',{});currentAccount=null;refreshAccount();feedback($('cc-account-feedback'),'You have logged out.');}catch(e){feedback($('cc-account-feedback'),e.message,true)}};
$('cc-account-cloud-save').onclick=async()=>{try{await api('/api/account/save',{progress:core.state});feedback($('cc-account-feedback'),'Your progress was saved to the cloud!')}catch(e){feedback($('cc-account-feedback'),e.message,true)}};
$('cc-account-cloud-load').onclick=async()=>{try{const r=await fetch('/api/account/save',{credentials:'same-origin'});const data=await r.json();if(!r.ok)throw Error(data.error||'Cloud save unavailable');if(!data.progress){feedback($('cc-account-feedback'),'No cloud save found.');return;}
 if(!confirm('Load your cloud save? This will replace local progress and refresh Cat City.'))return;
 localStorage.setItem('catcity_v1',JSON.stringify(data.progress));location.reload();
}catch(e){feedback($('cc-account-feedback'),e.message,true)}};

// Room chat is scoped to the active online room. All untrusted text uses textContent.
const quick=['Follow me! 🐾','Let’s play tag!','Let’s do a quest!','Nice job! 💜','Where should we go?','Meet at the village!'];
function chatSend(text){if(!window.catCityOnlineConnected?.()){feedback($('cc-chat-feedback'),'Create or join an online room to chat.',true);return;}
 window.catCityOnlineSend?.({type:'chat',message:text});$('cc-chat-input').value='';}
for(const msg of quick){const btn=document.createElement('button');btn.type='button';btn.textContent=msg;btn.onclick=()=>chatSend(msg);$('cc-chat-presets').append(btn);}
$('cc-chat-form').onsubmit=e=>{e.preventDefault();chatSend($('cc-chat-input').value.trim());};
function renderMessages(){const list=$('cc-chat-list');list.replaceChildren();for(const msg of chatMessages.slice(-45)){
 if(mutedCats.has(msg.cat))continue;
 const entry=document.createElement('div');entry.className='cc-chat-entry';
 const name=document.createElement('strong');name.textContent=(msg.bot?'🤖 ':(['🧡 ','🤍 ','🤎 '][msg.cat]||'🐱 '))+msg.name+': ';
 const content=document.createElement('span');content.textContent=msg.text;entry.append(name,content);
 const report=document.createElement('button');report.type='button';report.textContent='🚩';report.title='Report message';report.onclick=()=>{
   window.catCityOnlineSend?.({type:'chat_report',messageId:msg.id});feedback($('cc-chat-feedback'),'Report sent for review.');};
 const mute=document.createElement('button');mute.type='button';mute.textContent='🔇';mute.title='Hide this cat’s messages';mute.onclick=()=>{mutedCats.add(msg.cat);renderMessages();};
 if(!msg.bot)entry.append(report,mute);list.append(entry);
}list.scrollTop=list.scrollHeight;}
// Each announcement plays once per device, and nothing older than 3 minutes
// replays after a page reload (e.g. the Birman Family's glitch message).
function freshAnnouncement(p){
 if(!p)return false;const now=Date.now()/1000;if(p.at&&now-Number(p.at)>180)return false;
 if(p.id){let seen=[];try{seen=JSON.parse(localStorage.getItem('catcity_seen_announcements')||'[]')}catch(e){}
  if(seen.includes(p.id))return false;seen.push(p.id);try{localStorage.setItem('catcity_seen_announcements',JSON.stringify(seen.slice(-40)))}catch(e){}}
 return true;
}
function banner(text){announcement.textContent='📣 '+text;announcement.classList.add('show');clearTimeout(banner.timer);banner.timer=setTimeout(()=>announcement.classList.remove('show'),8500);}
let timeOverride='auto';
function serverMessage(msg){if(!msg||!msg.type)return;
 if(msg.type==='welcome'){chatMessages=[];renderMessages();}
 if(msg.type==='chat_history'){chatMessages=Array.isArray(msg.messages)?msg.messages.slice(-45):[];renderMessages();}
 if(msg.type==='chat'){chatMessages.push(msg);if(chatMessages.length>50)chatMessages.shift();renderMessages();if(!chat.classList.contains('open'))floater.textContent='💬 New';}
 if(msg.type==='chat_error'||msg.type==='chat_notice')feedback($('cc-chat-feedback'),msg.message,msg.type==='chat_error');
 if(msg.type==='announcement'){if(msg.id)lastAnnouncement=msg.id;if(!freshAnnouncement(msg))return;if(window.catCityTakeover?.handle(msg))return;banner(msg.text);}
 if(msg.type==='admin_time'){timeOverride=msg.timeMode||'auto';window.catCityAdminTimeOverride=timeOverride;}
 if(msg.type==='admin_event'){window.catCityAdminEvent=msg.event||{name:'none'};const n=msg.event?.name;if(n&&n!=='none')banner('Event started: '+n.replaceAll('_',' ')+'!');}
 if(msg.type==='admin_npc'){adminNpcs=msg.npcs||[];updateNpcOptions();}
}
window.addEventListener('catcity:server',e=>serverMessage(e.detail));
chat.addEventListener('click',()=>{floater.textContent='💬 Chat';});
function refreshChatVisibility(){
 const joined=!!window.catCityOnlineConnected?.();
 floater.classList.toggle('show',joined);
 if(!joined){floater.textContent='💬 Chat';if(chat.classList.contains('open'))close(chat);}
}
refreshChatVisibility();setInterval(refreshChatVisibility,650);

// Safe, contextual NPC conversations: no unrestricted generated answers or external model billing.
function updateNpcOptions(){const selector=$('cc-npc-select');if(!selector)return;for(const n of adminNpcs){if(![...selector.options].some(o=>o.value===n.name)){const opt=document.createElement('option');opt.value=n.name;opt.textContent=n.name;selector.append(opt);}}}
const positions=[['Marmalade',9,13],['Pebble',23,13],['Luna',38,13],['Biscuit',10,20],['Forge',34,25],['SlayCat',38,20]];
function nearbyNpc(){const s=core.state,T=core.T||32;let best=null,d=70;
 for(const [name,x,y] of positions){const q=Math.hypot(s.x-(x*T+16),s.y-(y*T+16));if(q<d){d=q;best=name;}}
 for(const n of adminNpcs){const q=Math.hypot(s.x-n.x,s.y-n.y);if(q<d){d=q;best=n.name;}}
 return best;
}
function gameReadyForNpc(){
 if(core.bossMode||window.catCityTagHouse?.inside)return false;
 if($('catcity-start-menu')?.classList.contains('show'))return false;
 if($('dialog')?.style.display==='block')return false;
 if(document.querySelector('.cc-social-modal.open,.cc-panel.show,#settings-panel.open,#catcity-online-panel.open'))return false;
 return true;
}
function beginNpcTalk(name){
 if(!name)return;
 updateNpcOptions();
 const select=$('cc-npc-select');
 if(![...select.options].some(opt=>opt.value===name)){
  const opt=document.createElement('option');opt.value=name;opt.textContent=name;select.append(opt);
 }
 select.value=name;
 $('cc-npc-current').textContent='🐱 Talking to '+name;
 $('cc-npc-history').textContent='🐾 '+name+' is listening. What would you like to ask?';
 $('cc-npc-forge').style.display=name==='Forge'?'block':'none';feedback($('cc-npc-feedback'),'');open(npc);
}
// Preserve quest actions in the original NPC dialogue as an explicit second choice.
const classicInteract=core.interact;
core.interact=function(){
 if(gameReadyForNpc()){
  const target=nearbyNpc();
  if(target){beginNpcTalk(target);return;}
 }
 return classicInteract();
};
// The engine attached this button to an earlier interact function, so rebind it.
if($('interact'))$('interact').onclick=()=>core.interact();
$('cc-npc-forge').onclick=()=>{if($('cc-npc-select').value!=='Forge'||nearbyNpc()!=='Forge'){core.note('🔨 You need to stand beside Forge.');return;}window.catCityForgeOpen?.();};
$('cc-npc-story').onclick=()=>{
 close(npc);
 if(nearbyNpc() && gameReadyForNpc()){
  const name=nearbyNpc();
  if(!window.catCityOpenNpcQuest?.(name))classicInteract();
 }else core.note('Move closer to the cat to hear their story!');
};
// Tapping a nearby NPC directly on the world canvas opens their conversation.
$('game')?.addEventListener('click',e=>{
 if(!gameReadyForNpc())return;
 const name=nearbyNpc();if(!name)return;
 const rect=e.currentTarget.getBoundingClientRect();
 const x=(e.clientX-rect.left)/rect.width*core.W-core.W/2+core.state.x;
 const y=(e.clientY-rect.top)/rect.height*core.H-core.H/2+core.state.y;
 const T=core.T||32;
 const staticNpc=positions.find(p=>p[0]===name);
 const px=staticNpc?staticNpc[1]*T+16:adminNpcs.find(n=>n.name===name)?.x;
 const py=staticNpc?staticNpc[2]*T+16:adminNpcs.find(n=>n.name===name)?.y;
 if(px!=null&&Math.hypot(x-px,y-py)<38)beginNpcTalk(name);
});
$('cc-npc-form').onsubmit=async e=>{e.preventDefault();const input=$('cc-npc-input'),message=input.value.trim();if(!message)return;
 const line=document.createElement('div');line.className='cc-npc-line';line.textContent='You: '+message;$('cc-npc-history').append(line);input.value='';
 try{const r=await api('/api/npc/chat',{npc:$('cc-npc-select').value,message,questStage:core.state.questStage||0});
 const reply=document.createElement('div');reply.className='cc-npc-line';reply.textContent=r.npc+': '+r.reply;$('cc-npc-history').append(reply);$('cc-npc-history').scrollTop=$('cc-npc-history').scrollHeight;feedback($('cc-npc-feedback'),'');
 }catch(err){feedback($('cc-npc-feedback'),err.message,true)}};

// Owner-only admin control: the checkbox hides UI; the server always checks the signed session.
const adminSection=document.createElement('div');adminSection.id='cc-admin-settings';adminSection.className='settings-section';
adminSection.innerHTML=`<strong>👑 Owner tools</strong><label style="display:flex;gap:8px;align-items:center">Enable Admin Panel <input id="cc-admin-toggle" type="checkbox" /></label>
<div id="cc-admin-tools"><p style="font-size:12px">Only your verified owner login can use these tools. Events, announcements and NPCs reset when the server restarts.</p>
<div style="padding:10px;border:2px solid #d6afe7;border-radius:12px;margin:8px 0">
<strong>👑 Admin Abuse · Global Live Stage</strong><p style="font-size:12px">Open a golden village portal in every room and let everyone watch your cat on the shared stage. Players who attend receive limited event Looks.</p>
<button type="button" id="cc-admin-abuse">👑 Start Admin Abuse</button><label style="display:flex;align-items:center;gap:6px;font-size:12px;margin:4px 0"><input type="checkbox" id="cc-admin-playtester" style="width:auto;min-height:0;margin:0"> 🧪 Is this a playtester admin abuse?</label><label style="display:flex;align-items:center;gap:6px;font-size:12px;margin:4px 0"><input type="checkbox" id="cc-admin-takeover" style="width:auto;min-height:0;margin:0"> 🎭 Birman Takeover (after 3 announcements)</label></div>
<label>🌍 Send commands to <select id="cc-admin-scope"><option value="global">🌍 Global · All online rooms</option><option value="server">🏠 This Server · My current room only</option></select></label>
<small>For This Server, join a multiplayer room first. Only that room receives your broadcast, event, time change or NPC.</small>
<label>Announcement <textarea id="cc-admin-announcement" maxlength="160" placeholder="Friendly message to players..."></textarea></label>
<button id="cc-admin-send">📣 Send Announcement</button>
<div class="cc-admin-inline"><label>World time<select id="cc-admin-time"><option value="auto">Automatic</option><option value="day">Day</option><option value="sunset">Sunset</option><option value="night">Night</option></select></label><button id="cc-admin-settime">🕒 Set World Time</button></div>
<div class="cc-admin-inline"><label>Event<select id="cc-admin-event"><option value="fish_festival">🐟 Fish Festival</option><option value="cherry_blossom">🌸 Cherry Blossom</option><option value="moonlight_magic">🌙 Moonlight Magic</option><option value="catnip_party">🎉 Catnip Party</option><option value="starfall">🌟 Starfall</option><option value="treasure_rain">💰 Treasure Rain</option><option value="meteor_shower">☄️ Meteor Shower</option><option value="ghost_parade">👻 Ghost Parade</option><option value="ghost_2_0">👻 Ghost 2.0 · Haunted Caves</option><option value="galaxy_gala">🌌 Galaxy Gala</option><option value="pumpkin_cutie">🎃 Pumpkin Cutie</option><option value="tv_glitch">📺 TV Glitch</option><option value="lily_bloom">🪷 Lily Bloom</option><option value="glow_mushrooms">🍄 Glowing Mushrooms</option><option value="wrangler_raid">🧶 Wrangler Raid</option><option value="winter_snow">❄️ Snow Day</option><option value="rainbow_day">🌈 Rainbow Day</option><option value="firefly_festival">✨ Firefly Festival</option><option value="crystal_carnival">💎 Crystal Carnival</option><option value="frog_festival">🐸 Frog Festival</option><option value="none">End Event</option></select></label><label>Duration (minutes)<input type="number" min="1" max="120" step="1" id="cc-admin-event-minutes" value="10" /></label><label>Loot luck<select id="cc-admin-event-luck"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="6">6×</option><option value="8">8×</option><option value="12">12×</option><option value="16">16×</option><option value="20">20×</option><option value="24">24×</option></select></label><button id="cc-admin-setevent">🎪 Start / End Event</button></div>
<div class="cc-admin-inline"><label>NPC name <input id="cc-admin-npc-name" maxlength="20" value="Nova" /></label><button id="cc-admin-spawn">🐱 Spawn NPC</button><button id="cc-admin-clear">🧹 Clear Spawned NPCs</button></div>
<div style="border:2px solid #c7b6e6;border-radius:12px;padding:9px;margin:9px 0">
<strong>🗳️ Global player event voting</strong>
<p style="font-size:12px">Choose two different events. Every online player can vote once; after 90 seconds, the winning event begins.</p>
<label>Option 1<select id="cc-poll-one"><option value="fish_festival">🐟 Fish Festival</option><option value="ghost_parade">👻 Ghost Parade</option><option value="treasure_rain">💰 Treasure Rain</option><option value="crystal_carnival">💎 Crystal Carnival</option><option value="starfall">🌟 Starfall</option><option value="galaxy_gala">🌌 Galaxy Gala</option><option value="ghost_2_0">👻 Ghost 2.0</option><option value="pumpkin_cutie">🎃 Pumpkin Cutie</option><option value="tv_glitch">📺 TV Glitch</option></select></label>
<label>Option 2<select id="cc-poll-two"><option value="ghost_parade">👻 Ghost Parade</option><option value="fish_festival">🐟 Fish Festival</option><option value="treasure_rain">💰 Treasure Rain</option><option value="crystal_carnival">💎 Crystal Carnival</option><option value="starfall">🌟 Starfall</option><option value="galaxy_gala">🌌 Galaxy Gala</option><option value="ghost_2_0">👻 Ghost 2.0</option><option value="pumpkin_cutie">🎃 Pumpkin Cutie</option><option value="tv_glitch">📺 TV Glitch</option></select></label>
<button id="cc-admin-poll">🗳️ Launch 90-second global vote</button>
<button id="cc-admin-poll-finish">✅ Finalise vote now</button>
<details><summary>🗳️ Custom poll (owner)</summary><label>Question<input id="cc-cpoll-q" maxlength="120" placeholder="What should we add next?"></label><label>Choice 1<input id="cc-cpoll-1" maxlength="40"></label><label>Choice 2<input id="cc-cpoll-2" maxlength="40"></label><label>Choice 3 (optional)<input id="cc-cpoll-3" maxlength="40"></label><label>Choice 4 (optional)<input id="cc-cpoll-4" maxlength="40"></label><button id="cc-admin-cpoll">🗳️ Launch 90-second poll</button></details>
</div>
<div style="border:2px solid #c7b6e6;border-radius:12px;padding:9px;margin:9px 0">
<strong>🎁 Owner items & boss travel</strong>
<label>Gear name<input id="cc-admin-gear-name" maxlength="35" value="Admin Star Sword" /></label>
<label>Type<select id="cc-admin-gear-type"><option value="weapon">⚔️ Weapon</option><option value="head">🪖 Helmet</option><option value="body">🛡️ Armour</option><option value="paws">🥾 Boots</option></select></label>
<button id="cc-admin-give">🎁 Give Me Gear</button>
<label>Full set<select id="cc-admin-set-theme"><option value="Eli-geode">🌈 Eli-geode</option><option value="Crystal">💎 Crystal</option><option value="Forest">🌲 Forest</option><option value="Ghost">👻 Ghost</option><option value="Admin">👑 Admin</option></select></label>
<button id="cc-admin-set">🛡️ Give Me Complete Armour + Sword Set</button>
<label>Fish coins<input id="cc-admin-fish" type="number" min="1" max="100000" value="1000" /></label>
<button id="cc-admin-fish-add">🐟 Give Me Fish Coins</button>
<button id="cc-admin-unique">🌍 Drop ONE unique item to ONE random player globally</button>
<label>Boss<select id="cc-admin-boss"><option value="7">Birman (Quest 8)</option><option value="11">Birman Junior (Quest 12)</option><option value="15">Armoured Birman (Quest 16)</option><option value="19">⚔️ Double Birman Showdown (Quest 20)</option><option value="99">🎭 Admin Birman (Birman Takeover)</option></select></label>
<button id="cc-admin-boss-travel">⚔️ Teleport to Boss</button>
<label>⭐ My level<input id="cc-admin-level" type="number" min="1" max="99" value="1" style="width:70px"></label><button id="cc-admin-set-level">⭐ Set my level</button>
</div>
<button id="cc-admin-reports">🚩 View Chat Reports</button><pre id="cc-admin-report-list" style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px"></pre>
<p id="cc-admin-feedback" style="font-size:12px" aria-live="polite"></p></div>`;
$('settings-saves')?.before(adminSection);
// Keep the Admin Panel open while "Enable Admin Panel" is ticked: closing Settings from a mission
// button used to remove .open from the tools, leaving the box ticked but the panel shut.
new MutationObserver(()=>{const tools=$('cc-admin-tools');if($('cc-admin-toggle').checked&&currentAccount?.admin&&!tools.classList.contains('open'))tools.classList.add('open')}).observe($('cc-admin-tools'),{attributes:true,attributeFilter:['class']});
$('cc-admin-toggle').onchange=e=>{const enabled=!!e.target.checked&&!!currentAccount?.admin;$('cc-admin-tools').classList.toggle('open',enabled);try{localStorage.setItem('catcity_admin_ui',String(enabled));}catch(e){}};
async function adminAction(action,other={}){try{
  const scope=$('cc-admin-scope').value;
  const roomCode=window.catCityOnlineRoomInfo?.().code||'';
  if(scope==='server'&&!window.catCityOnlineConnected?.())throw Error('Join an online room to use This Server.');
  const r=await api('/api/admin/action',{action,scope,roomCode,...other});feedback($('cc-admin-feedback'),r.message||'Owner command completed.');return r;}catch(e){feedback($('cc-admin-feedback'),e.message,true);}}
$('cc-admin-abuse').onclick=async()=>{
 const r=await adminAction('admin_abuse',{scope:'global',enabled:!window.catCityAdminStageState?.active,cat:core.state.cat,playtester:!!$('cc-admin-playtester')?.checked,takeover:!!$('cc-admin-takeover')?.checked});
 if(r?.stage)window.dispatchEvent(new CustomEvent('catcity:server',{detail:{type:'admin_stage',stage:r.stage}}));
};
$('cc-admin-send').onclick=async()=>{const message=$('cc-admin-announcement').value.trim();const r=await adminAction('announce',{message});
 // Show it on your own screen straight away (you may not be in the room it went to).
 if(r?.ok&&!window.catCityOnlineConnected?.()&&!window.catCityAdminStageState?.takeover?.phase?.match(/armed|starting/)&&freshAnnouncement({id:r.id}))banner(message);if(r?.ok)$('cc-admin-announcement').value=''};
$('cc-admin-settime').onclick=()=>adminAction('time',{value:$('cc-admin-time').value});
$('cc-admin-setevent').onclick=()=>adminAction('event',{value:$('cc-admin-event').value,durationSeconds:Math.max(60,Math.min(7200,Math.round(Number($('cc-admin-event-minutes').value||10)*60))),luck:Number($('cc-admin-event-luck').value)});
$('cc-admin-poll').onclick=()=>adminAction('event_poll',{scope:'global',
 options:[$('cc-poll-one').value,$('cc-poll-two').value],
 durationSeconds:Math.max(60,Math.min(7200,Math.round(Number($('cc-admin-event-minutes').value||10)*60))),
 luck:Number($('cc-admin-event-luck').value)});
$('cc-admin-poll-finish').onclick=()=>adminAction('event_poll_finish',{scope:'global'});
$('cc-admin-cpoll').onclick=()=>adminAction('custom_poll',{scope:'global',question:$('cc-cpoll-q').value.trim(),choices:[1,2,3,4].map(i=>$('cc-cpoll-'+i).value.trim()).filter(Boolean)});
$('cc-admin-give').onclick=async()=>{
 const r=await adminAction('give_gear',{scope:'global',name:$('cc-admin-gear-name').value,gearType:$('cc-admin-gear-type').value});
 if(!r?.item)return;
 core.state.adventureItems=Array.isArray(core.state.adventureItems)?core.state.adventureItems:[];
 core.state.adventureItems.push(r.item);core.persist();window.catCityRefreshHotbar?.();
 core.note('👑 Owner gear added to Backpack: '+r.item.name);
};
$('cc-admin-set').onclick=async()=>{
 const r=await adminAction('gear_set',{scope:'global',theme:$('cc-admin-set-theme').value});
 if(!Array.isArray(r?.items))return;
 core.state.adventureItems=Array.isArray(core.state.adventureItems)?core.state.adventureItems:[];
 core.state.adventureEquipment=core.state.adventureEquipment||{};
 for(const item of r.items){core.state.adventureItems.push(item);core.state.adventureEquipment[item.type]=item.id}
 core.persist();window.catCityRefreshHotbar?.();core.note('👑 Complete owner armour and weapon set equipped!');
};
$('cc-admin-fish-add').onclick=async()=>{
 const amount=Number($('cc-admin-fish').value);
 const r=await adminAction('give_fish',{scope:'global',amount:Math.max(1,Math.min(100000,Math.floor(amount||1000)))});
 if(!r?.fish)return;
 core.state.fish=(Number(core.state.fish)||0)+r.fish;
 core.persist();core.note('🐟 +'+r.fish+' owner fish coins!');
};
$('cc-admin-unique').onclick=()=>adminAction('unique_drop',{scope:'global'});
$('cc-admin-set-level').onclick=()=>{window.catCityLevels?.set($('cc-admin-level').value);feedback($('cc-admin-feedback'),'Your level is now '+(window.catCityLevels?.level()||1)+'.')};
$('cc-admin-boss-travel').onclick=async()=>{
 const r=await adminAction('boss_travel',{scope:'global',chapter:Number($('cc-admin-boss').value)});
 if(!r?.ok)return;
 $('settings-panel')?.classList.remove('open');$('pause-panel')?.classList.remove('show');
 if(typeof core.startBoss==='function'){
   const opened=core.startBoss(r.chapter,{force:true});
   if(opened&&core.bossMode)core.note('👑 Owner: '+({7:'Birman',11:'Birman Junior',15:'Armoured Birman',19:'Double Birman Showdown',99:'Admin Birman'}[r.chapter]||'Boss')+' practice arena opened!');
   else feedback($('cc-admin-feedback'),'The arena could not open. Close other activities and try again.',true);
 }else feedback($('cc-admin-feedback'),'Boss arena is unavailable in this game session.',true);
};
$('cc-admin-spawn').onclick=()=>adminAction('spawn',{name:$('cc-admin-npc-name').value});
$('cc-admin-clear').onclick=()=>adminAction('clear_npcs');
$('cc-admin-reports').onclick=async()=>{const r=await adminAction('reports');if(r)$('cc-admin-report-list').textContent=(r.reports||[]).slice(-15).map(x=>x.when+' · '+x.speaker+': '+x.reportedText).join('\n')||'No reports yet.';};

// Spawned NPCs share the existing Cat City cat art; the player models are unchanged.
const oldDraw=core.draw;
core.draw=function(){oldDraw();if(core.bossMode||window.catCityTagHouse?.inside)return;const ctx=core.ctx,s=core.state,W=core.W,H=core.H;
 ctx.save();for(const n of adminNpcs){const x=n.x-s.x+W/2,y=n.y-s.y+H/2;if(x<-36||y<-36||x>W+36||y>H+36)continue;
 core.drawCat(x,y,core.cats[1],.95);ctx.textAlign='center';ctx.font='bold 12px system-ui';ctx.strokeStyle='#2a1d3c';ctx.lineWidth=4;ctx.strokeText(n.name,x,y-26);ctx.fillStyle='#fff';ctx.fillText(n.name,x,y-26);}
 ctx.restore();};

async function pollWorld(){if(window.catCityOnlineConnected?.())return;try{const data=await fetch('/api/world-state',{cache:'no-store'}).then(r=>r.json());
 window.catCityAdminTimeOverride=data.timeMode||'auto';if(Array.isArray(data.npcs)){adminNpcs=data.npcs;updateNpcOptions();}
 window.catCityAdminEvent=data.event||{name:'none'};
 if(data.announcement && data.announcement.id!==lastAnnouncement){lastAnnouncement=data.announcement.id;if(freshAnnouncement(data.announcement)&&!window.catCityTakeover?.handle(data.announcement))banner(data.announcement.text);}
}catch(e){}}
pollWorld();setInterval(pollWorld,4000); // was 17 s: offline players saw global announcements late
// Mild world decoration for special events; never covers controls, menus or characters.
const eventIcons={galaxy_gala:'🌌',ghost_2_0:'👻',pumpkin_cutie:'🎃',fish_festival:'🐟',cherry_blossom:'🌸',moonlight_magic:'✨',catnip_party:'🌿',starfall:'⭐',treasure_rain:'💰',meteor_shower:'☄️',ghost_parade:'👻',lily_bloom:'🪷',glow_mushrooms:'🍄',wrangler_raid:'🧶',winter_snow:'❄️',rainbow_day:'🌈',firefly_festival:'✨',crystal_carnival:'💎',frog_festival:'🐸'};
const drawEventBefore=core.draw;
core.draw=function(){drawEventBefore();
 const ev=window.catCityAdminEvent; if(!ev||ev.name==='none'||!eventIcons[ev.name]||window.catCityTagHouse?.inside||window.catCityCaveState?.().inside||core.bossMode||document.getElementById('catcity-start-menu')?.classList.contains('show'))return;
 const g=core.ctx,W=core.W,H=core.H;g.save();g.textAlign='center';g.font='18px system-ui';g.globalAlpha=.56;
 const tick=Date.now()/1000;
 for(let k=0;k<10;k++){const x=((k*119.1+tick*(12+k%3*5))%(W+60))-30,y=(k*71.3+Math.sin(tick+k)*21)%(H+50);g.fillText(eventIcons[ev.name],x,y+25);}
 g.restore();
};
window.catCityAccountOpen=()=>open(account);window.catCityNPCOpen=()=>open(npc);
initAccount();
})();
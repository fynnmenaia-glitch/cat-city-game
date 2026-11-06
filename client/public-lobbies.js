/* Cat City: public/private rooms and title navigation, compatible with the existing game. */
(() => {'use strict';
const $=id=>document.getElementById(id);
const form=$('online-form'), panel=$('catcity-online-panel'), pause=$('pause-panel');
if(!form||!panel)return;
const css=document.createElement('style');css.id='catcity-public-lobbies-style';css.textContent=`
#online-form .room-privacy{border:2px solid #c9b4dc;border-radius:17px;background:#fffaf8;padding:12px;margin:12px 0;touch-action:pan-y}
#online-form .room-privacy label{display:flex;align-items:center;gap:10px;margin:3px 0 8px;font-size:15px;touch-action:manipulation}
#online-form #online-is-public{display:inline-block;flex:0 0 21px;width:21px;height:21px;margin:0;accent-color:#9873b6;touch-action:manipulation}
#online-form #online-room-title{font-size:15px;min-height:42px;margin:6px 0 2px}
#online-public-tabs{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap}
#online-public-tabs button{flex:1;min-width:118px;font-size:13px!important;min-height:44px!important;margin:0}
#online-public-tabs button.selected{background:#f7d992!important;border-color:#d0a056!important}
/* A global touch-action:none reset was intercepting swipes on nested card text.
   Permit vertical panning on the full ancestor-to-descendant scroll chain. */
#catcity-online-panel.open,#catcity-online-panel .coop-card,#online-form,#online-public-tabs{touch-action:pan-y!important}
#online-public-results{display:none;gap:9px;flex-direction:column;max-height:min(47dvh,460px);min-height:110px;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch;touch-action:pan-y!important;overscroll-behavior-y:contain;scrollbar-width:thin}
#online-public-results .room-card,#online-public-results .room-card :not(button),#online-public-results .room-help{touch-action:pan-y!important}
#online-public-results .room-card{flex-shrink:0}
#online-public-results .room-card button,#online-public-results>button{touch-action:manipulation!important}
#online-public-results.open{display:flex}
#online-public-results .room-card{border:2px solid #cdb8dc;border-radius:14px;background:#fff;padding:10px;color:#3b2a4b}
#online-public-results .room-card strong,#online-public-results .room-card small{display:block}
#online-public-results .room-card small{font-size:12px;color:#6a567c}
#online-public-results .room-card button{width:100%;min-height:43px!important;margin:7px 0 0;background:#c9ebdd!important}
#online-public-results .room-card button:disabled{opacity:.5}
#online-public-results .room-help{font-size:12px;color:#694e7d}
body.taghouse-inside #quest-btn,body.taghouse-inside #quest-tracker,body.taghouse-inside #catcity-online-open,body.taghouse-inside #catcity-online-status{display:none!important}
#pause-title,#pause-tag-house{min-height:46px!important;background:#c0e8d6!important}
#pause-title{background:#ffe4a6!important}
`;document.head.append(css);
const privacy=document.createElement('div');privacy.className='room-privacy';privacy.id='online-privacy';
privacy.innerHTML='<label for="online-is-public"><input type="checkbox" id="online-is-public"/> 🌍 Make this room PUBLIC</label><small>Private rooms are invite-only. Public rooms appear in the server browser so other Cat City players can join.</small><label for="online-room-title">Public room name (optional)</label><input type="text" id="online-room-title" maxlength="28" placeholder="e.g. Cozy Cat Adventures" autocomplete="off" />';
const create=$('online-create');create.parentNode.insertBefore(privacy,create);
const tabs=document.createElement('div');tabs.id='online-public-tabs';tabs.innerHTML='<button type="button" id="online-tab-create" class="selected">🏠 Create / Join Code</button><button type="button" id="online-tab-public">🌍 Public Servers</button>';
form.insertBefore(tabs,form.firstChild);
const results=document.createElement('div');results.id='online-public-results';results.setAttribute('aria-live','polite');form.insertBefore(results,tabs.nextSibling);
const origNodes=[...form.children].filter(child=>child!==tabs&&child!==results);
let tab='create',loading=false,lastFetch=0;
function showTab(which){tab=which;const pub=tab==='public';
 $('online-tab-public').classList.toggle('selected',pub);$('online-tab-create').classList.toggle('selected',!pub);
 results.classList.toggle('open',pub);for(const node of origNodes) node.style.display=pub?'none':'';
 if(pub)refreshPublic(true);
}
$('online-tab-create').onclick=()=>showTab('create');
$('online-tab-public').onclick=()=>showTab('public');
function setText(node,text){node.textContent=text;}
async function refreshPublic(force=false){
 if(tab!=='public'||loading||(!force&&Date.now()-lastFetch<7000))return;
 loading=true;lastFetch=Date.now();results.replaceChildren();
 const status=document.createElement('div');status.className='room-help';status.textContent='Looking for public Cat City rooms…';results.append(status);
 try{
  const r=await fetch('/public-rooms',{cache:'no-store'});if(!r.ok)throw Error('Server returned '+r.status);
  const data=await r.json();results.replaceChildren();
  const head=document.createElement('div');head.className='room-help';head.textContent=`${data.activeRooms||0} / ${data.maxRooms||16} total rooms running · only public rooms appear here.`;results.append(head);
  if(!data.rooms?.length){const empty=document.createElement('div');empty.className='room-card';empty.textContent='No public rooms yet! You can create the first one in the Create tab. 🐱';results.append(empty);return;}
  for(const room of data.rooms){
   const card=document.createElement('div');card.className='room-card';
   const title=document.createElement('strong');setText(title,'🌍 '+room.title);card.append(title);
   const roles=['Astro','Galaxy','Baby','Harley','Skylar','Pumpkin'];const available=Array.isArray(room.availableCats)?room.availableCats.filter(c=>Number.isInteger(c)&&c>=0&&c<roles.length):[];
   // Autonomous teammates fill only unused cat slots. Human players can take over
   // those slots without exceeding the six-character lobby roster.
   const extras=room.crewRoom?(room.crewBotRoles||[]).filter(role=>available.includes(role)).length:0;
   const info=document.createElement('small');setText(info,`${room.players+extras}/${room.capacity||6} players · Code ${room.code}`);card.append(info);
   const cats=document.createElement('small');setText(cats,available.length?'Choose: '+available.map(c=>roles[c]).join(', '):'No available cats');card.append(cats);
   const join=document.createElement('button');join.type='button';join.textContent=available.length&&room.players<(room.capacity||6)?'🐾 Join This Public Room':'Room Full';join.disabled=!available.length||room.players>=(room.capacity||6);
   join.addEventListener('click',()=>{const chosen=Number($('online-cat').value);const role=available.includes(chosen)?chosen:available[0];$('online-cat').value=String(role);$('online-join-code').value=room.code;showTab('create');$('online-join').click();});
   card.append(join);results.append(card);
  }
 }catch(e){status.textContent='Could not load public servers. Check your connection and tap Refresh.';results.replaceChildren(status);}
 finally{const refresh=document.createElement('button');refresh.type='button';refresh.textContent='↻ Refresh Public Servers';refresh.addEventListener('click',()=>refreshPublic(true));results.append(refresh);loading=false;}
}
setInterval(()=>{if(panel.classList.contains('open')&&tab==='public')refreshPublic();},8200);
// All title navigation happens in the original client. The current online room stays connected.
const pauseList=pause?.querySelector('.cc-list');
const titleMenu=$('catcity-start-menu');
function returnToTitle(){
 if(window.catCityTagHouse?.inside)window.catCityTagHouse.leave();
 if(document.body.classList.contains('boss-fighting'))$('boss-exit')?.click();
 for(const el of document.querySelectorAll('.cc-panel.show'))el.classList.remove('show');
 for(const el of document.querySelectorAll('#settings-panel.open,#catcity-online-panel.open,#world-inventory.open'))el.classList.remove('open');
 for(const el of document.querySelectorAll('#quest-vision'))el.style.display='none';
 document.body.classList.remove('settings-open','in-interior');
 document.body.classList.add('start-menu-open');
 titleMenu?.classList.add('show');
 window.__catCityEngine?.persist?.();
 const arrived=$('start-arrived');arrived?.classList.remove('show');
}
if(pauseList){
 const tagBtn=document.createElement('button');tagBtn.id='pause-tag-house';tagBtn.type='button';tagBtn.textContent='🏁 Play Tag House · Solo / Multiplayer';
 tagBtn.onclick=()=>{pause?.classList.remove('show');window.catCityTagHouse?.enter();};pauseList.append(tagBtn);
 const back=document.createElement('button');back.id='pause-title';back.type='button';back.textContent='🏡 Return to Main Title';
 back.onclick=returnToTitle;pauseList.append(back);
}
const oldFun=$('pause-fun');if(oldFun)oldFun.style.display='none';
window.catCityReturnToTitle=returnToTitle;
window.catCityPublicLobbyRefresh=()=>refreshPublic(true);
})();

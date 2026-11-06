/* Cat City autonomous crew — no AI chat, no microphone, no speech.
 * Server bots choose real biome nodes, chop/mine and drop materials to collect.
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,$=id=>document.getElementById(id);
const styles=document.createElement('style');
styles.id='cc-inline-poll-style';
styles.textContent=[
 '#cc-ai-open,#cc-ai-panel,#cc-voice-button,#cc-voice-panel{display:none!important}',
 '#cc-bot-crew{display:none;position:fixed;inset:0;z-index:7050;align-items:center;justify-content:center;padding:12px;background:#211734dd}',
 '#cc-bot-crew.open{display:flex}',
 '#cc-bot-crew>section{border:4px solid #dac2f0;border-radius:19px;background:#fff9ec;color:#352348;padding:15px;width:min(540px,95vw);max-height:82vh;overflow:auto;touch-action:pan-y}',
 '#cc-bot-crew article{border-bottom:1px solid #d5c0e4;padding:7px 0}',
 '#cc-bot-crew button{min-height:42px}',
 '#cc-bot-action{display:none;position:fixed;bottom:calc(105px + env(safe-area-inset-bottom));right:8px;z-index:57;background:#d5f0ca;color:#302448;border:2px solid white;border-radius:12px;font-size:12px;padding:9px}',
 '#cc-bot-action.show{display:block}',
 'body.start-menu-open #cc-bot-action,body.taghouse-inside #cc-bot-action,body.boss-fighting #cc-bot-action{display:none!important}',
 // Inline poll: question + two real vote options, always visible while voting is active.
 // No giant modal and no tiny chip that needs tapping before voting.
 '#cc-global-poll{box-sizing:border-box;display:none;position:fixed;right:8px;top:calc(246px + env(safe-area-inset-top,0px));z-index:545;width:min(166px,calc(100vw - 148px));max-height:calc(100dvh - 275px);overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch;touch-action:pan-y!important;padding:5px;background:#41315feF;color:#fff6e5;border:2px solid #ffe2b3;border-radius:11px;box-shadow:0 5px 15px #20142e77;font:700 10px/1.2 system-ui}',
 '#cc-global-poll.open{display:block}',
 '#cc-global-poll>section{display:flex;flex-direction:column;gap:3px}',
 '#cc-poll-chip{display:block;position:static!important;min-height:0!important;padding:0 2px;margin:0!important;color:#fff8e8;background:none!important;border:none!important;box-shadow:none!important;text-align:center;font:800 10px/1.2 system-ui!important}',
 '#cc-poll-options{display:grid;grid-template-columns:1fr;gap:3px}',
 '#cc-poll-options button{display:block;width:100%;height:28px;min-height:28px!important;max-height:28px;padding:3px 5px!important;margin:0!important;border:2px solid #c9b3de!important;border-radius:7px!important;background:#e2d1f1!important;color:#342443!important;font:bold 10px/1.15 system-ui!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;touch-action:manipulation!important}',
 '#cc-poll-options button:disabled{opacity:.72!important;cursor:default}',
 '#cc-poll-options button.chosen{border-color:#8cf0be!important;background:#c0eed2!important;opacity:1!important}',
 '#cc-poll-meta{text-align:center;color:#f4e2f9;font:600 8px/1.15 system-ui;white-space:normal}',
 'body.start-menu-open #cc-global-poll,body.taghouse-inside #cc-global-poll,body.boss-fighting #cc-global-poll,body.cc-in-museum #cc-global-poll,body.cc-in-squishem-event #cc-global-poll{display:none!important}',
 'body:has(#cc-global-poll.open) #cc-sq-event{top:calc(414px + env(safe-area-inset-top,0px))!important}',
 'body:has(#cc-global-poll.open) #cc-bot-action{top:calc(525px + env(safe-area-inset-top,0px))!important;bottom:auto!important}',
 '@media(max-width:700px){#cc-global-poll{right:7px!important;top:calc(246px + env(safe-area-inset-top,0px))!important;width:min(166px,calc(100vw - 148px))!important}}',
 '@media(max-height:650px){#cc-global-poll{top:calc(120px + env(safe-area-inset-top,0px))!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;max-height:calc(100dvh - 128px)!important;width:min(166px,46vw)!important}body:has(#cc-global-poll.open) #cc-sq-event{display:none!important}body:has(#cc-global-poll.open) #cc-bot-action{display:none!important}}'
].join('\n');
document.head.append(styles);
const crew=document.createElement('div');crew.id='cc-bot-crew';crew.setAttribute('role','dialog');crew.setAttribute('aria-modal','true');
const card=document.createElement('section');crew.append(card);document.body.append(crew);
const action=document.createElement('button');action.type='button';action.id='cc-bot-action';action.textContent='🐾 Collect supplies';document.body.append(action);
const pollPanel=document.createElement('div');pollPanel.id='cc-global-poll';
pollPanel.setAttribute('role','group');pollPanel.setAttribute('aria-label','Choose the next Cat City event');
document.body.append(pollPanel);
const pollChip=document.createElement('div');pollChip.id='cc-poll-chip';
pollChip.setAttribute('aria-live','polite');
const pollChoices=document.createElement('div');pollChoices.id='cc-poll-options';
const pollMeta=document.createElement('small');pollMeta.id='cc-poll-meta';
const pollCard=document.createElement('section');pollCard.append(pollChip,pollChoices,pollMeta);
pollPanel.append(pollCard);
let activePoll=null,localVoteId='';
const eventEmojis={fish_festival:'🐟',ghost_parade:'👻',treasure_rain:'💰',
 starfall:'🌟',crystal_carnival:'💎',galaxy_gala:'🌌',ghost_2_0:'👻',
 pumpkin_cutie:'🎃',moonlight_magic:'🌙',cherry_blossom:'🌸',
 winter_snow:'❄️',rainbow_day:'🌈',catnip_party:'🌿',wrangler_raid:'🧶',
 lily_bloom:'🪷',glow_mushrooms:'🍄',meteor_shower:'☄️',firefly_festival:'✨',
 frog_festival:'🐸',tv_glitch:'📺'};
function niceEvent(event){return String(event||'').replaceAll('_',' ').replace(/\b\w/g,ch=>ch.toUpperCase())}
function updatePollChip(){
 const active=!!activePoll?.active&&activePoll.endsAt>Math.floor(Date.now()/1000)&&!!window.catCityOnlineConnected?.();
 pollPanel.classList.toggle('open',active);
 pollChip.classList.toggle('show',active);
 if(!active)return;
 const remaining=Math.max(0,activePoll.endsAt-Math.floor(Date.now()/1000));
 pollChip.textContent=(localVoteId===activePoll.id?'✅ Vote sent':'🗳️ '+(activePoll.custom?(activePoll.question||'Poll'):'Which event?'))+' · '+remaining+'s';
 pollMeta.textContent=(Number(activePoll.humanTotal||0)+Number(activePoll.botTotal||0))+' total votes';
}
function renderPoll(){
 updatePollChip();pollChoices.replaceChildren();
 if(!pollPanel.classList.contains('open'))return;
 const alreadyVoted=localVoteId===activePoll.id;
 for(const event of activePoll.options||[]){
  const button=document.createElement('button');button.type='button';
  const name=activePoll.custom?(activePoll.labels?.[event]||event):niceEvent(event);
  const text=(activePoll.custom?'🔘':(eventEmojis[event]||'🎪'))+' '+name+' · '+(activePoll.votes?.[event]||0);
  button.textContent=(alreadyVoted?'✓ ':'')+text;
  button.title=name+' — '+(activePoll.votes?.[event]||0)+' votes';
  button.setAttribute('aria-label','Vote for '+name);
  button.disabled=alreadyVoted;
  if(alreadyVoted)button.classList.add('chosen');
  button.onclick=()=>{
   if(localVoteId===activePoll.id)return;
   localVoteId=activePoll.id;
   window.catCityOnlineSend?.({type:'poll_vote',event});
   renderPoll();
  };
  pollChoices.append(button);
 }
}
setInterval(updatePollChip,1000);

const pauseList=$('pause-panel')?.querySelector('.cc-list');
if(pauseList){const b=document.createElement('button');b.textContent='🐱 Teammates & Resource Gathering';b.type='button';pauseList.append(b);b.onclick=()=>{ $('pause-panel')?.classList.remove('show');openCrew()}}
let bots=[],drops=[],mined=new Set(),lastActivity='explore',activityUntil=0;
window.catCityBotMinedNodes=mined;
window.catCityPlayerActivity=()=>Date.now()<activityUntil?lastActivity:((s.questStarted?.[s.questStage||0])?'quest':'explore');
window.catCitySetPlayerActivity=(activity,duration=4200)=>{
 if(!['gather','chop','mine','loot','quest','fight','tag','rest'].includes(activity))return;
 lastActivity=activity;activityUntil=Date.now()+duration;
};
function connected(){const info=window.catCityOnlineRoomInfo?.()||{};return info.connected&&info.crewRoom}
function nearDrop(){
 if(!connected()||core.bossMode||window.catCityCaveState?.().inside)return null;
 let best=null,d=80;
 for(const drop of drops){
  const dist=Math.hypot(s.x-drop.x,s.y-drop.y);
  if(dist<d){best=drop;d=dist}
 }
 return best;
}
function take(drop){
 if(!drop||!connected())return;
 window.catCityOnlineSend?.({type:'bot_collect',id:drop.id});
 action.classList.remove('show');
}
action.onclick=()=>take(nearDrop());
const oldInteract=core.interact;
core.interact=function(){
 const drop=nearDrop();
 if(drop){take(drop);return}
 oldInteract();
};
if($('interact'))$('interact').onclick=()=>core.interact();
function openCrew(){
 card.replaceChildren();
 const h=document.createElement('h2');h.textContent='🐱 Teammates';card.append(h);
 const info=document.createElement('p');info.textContent=connected()?'Your teammates travel out of the village, chop trees, mine stones and leave material bundles. Follow them or collect supplies with E / 🐾.':'Join a public Cat City room to adventure with teammates.';card.append(info);
 for(const bot of bots){
  const row=document.createElement('article');
  const label=document.createElement('strong');label.textContent='🐱 '+bot.name+' — '+(bot.activity||'exploring');row.append(label);
  const hint=document.createElement('p');hint.textContent='Biome: '+(bot.target?.biome||'exploring')+' · Job: '+(bot.job||'explore')+' · Gathered: '+Object.entries(bot.carried||{}).map(([k,v])=>v+' '+k).join(', ');row.append(hint);card.append(row);
 }
 const summary=document.createElement('p');summary.textContent='Resource bundles waiting: '+drops.length+'. Collect the supplies in the world to add them to your Backpack.';card.append(summary);
 const done=document.createElement('button');done.textContent='✕ Close';done.onclick=()=>crew.classList.remove('open');card.append(done);
 crew.classList.add('open');
}
crew.addEventListener('click',e=>{if(e.target===crew)crew.classList.remove('open')});
window.addEventListener('catcity:server',e=>{
 const m=e.detail;if(!m)return;
 if(m.type==='welcome'||m.type==='state'){
  const roomInfo=window.catCityOnlineRoomInfo?.()||{};
  if(m.crewRoom){
   bots=Array.isArray(m.bots)?m.bots:[];
   drops=Array.isArray(m.botDrops)?m.botDrops:[];
   mined=new Set(Array.isArray(m.botMined)?m.botMined:[]);
  }else{bots=[];drops=[];mined.clear()}
  window.catCityBotMinedNodes=mined;
 }
 if(m.type==='left'){bots=[];drops=[];mined.clear();activePoll=null;renderPoll()}
 if(m.type==='bot_loot'){
  const material=String(m.material||'').toLowerCase();
  const amount=Number(m.amount);
  if(!['wood','stone','diamond','emerald','amethyst','crystal','eligeode'].includes(material)||!Number.isInteger(amount)||amount<1||amount>4)return;
  s.materials=s.materials&&typeof s.materials==='object'?s.materials:{};
  s.materials[material]=(Number(s.materials[material])||0)+amount;
  core.persist();
  window.catCitySetPlayerActivity('gather');
  core.note('🐱 '+(m.by||'teammate')+' left '+amount+' '+material+'! Materials saved to your Backpack.');
 }
 if(m.type==='poll_state'){
  activePoll=m;
  if(!m.active && m.message)core.note('🗳️ '+m.message);
  renderPoll();
 }
 if(m.type==='poll_error'){localVoteId='';core.note('🗳️ '+(m.message||'Could not vote.'));renderPoll()}
 if(m.type==='bot_unique_loot'){
  // Server winner acknowledgement for one-of-one global rare item.
  const item=m.item;
  if(!item||typeof item.id!=='string'||typeof item.name!=='string')return;
  s.adventureItems=Array.isArray(s.adventureItems)?s.adventureItems:[];
  if(!s.adventureItems.some(it=>it.id===item.id)){
   s.adventureItems.push(item);core.persist();window.catCityRefreshHotbar?.();
   core.note('👑 Unique global treasure received: '+item.name+'!');
  }
 }
});
setInterval(()=>{
 const visible=connected()&&!document.body.classList.contains('start-menu-open')&&!core.bossMode&&!window.catCityCaveState?.().inside;
 const closest=visible?nearDrop():null;
 action.classList.toggle('show',!!closest);if(closest)action.textContent='🐾 Take '+closest.amount+' '+closest.material;
 // The vote panel updates only when votes arrive, never every frame.
},300);
const beforeDraw=core.draw;
core.draw=function(){
 beforeDraw();
 if(!connected()||core.bossMode||document.body.classList.contains('start-menu-open')||document.body.classList.contains('taghouse-inside')||window.catCityCaveState?.().inside)return;
 const ctx=core.ctx,W=core.W,H=core.H;
 ctx.save();ctx.textAlign='center';
 // Show the same choppable tree at a worker's actual destination — no more air chopping.
 const drawnTrees=new Set();
 for(const bot of bots){
  const target=bot.target;
  if(!target||target.job!=='chop'||drawnTrees.has(target.id))continue;
  drawnTrees.add(target.id);
  const tx=target.x-s.x+W/2,ty=target.y-s.y+H/2;
  if(tx>-90&&tx<W+90&&ty>-130&&ty<H+90)
   window.catCityTreeAsset?.draw(ctx,tx,ty,target.biome||'wild',bot.swing?2:0);
 }
 const occupied=new Set((window.catCityOnlineRoomInfo?.().players||[]).filter(p=>p.online).map(p=>p.cat));
 for(const bot of bots){
  // A human choosing the same cat takes over that visible player slot.
  if(occupied.has(bot.role))continue;
  const x=bot.x-s.x+W/2,y=bot.y-s.y+H/2;
  if(x<-65||x>W+65||y<-65||y>H+65)continue;
  ctx.save();
  window.catCityDrawingOnlineBot=true;
  try{core.drawCat(x,y,core.cats[bot.role]||{name:bot.name,coat:bot.coat,belly:bot.belly,eye:bot.eye},1)}
  finally{window.catCityDrawingOnlineBot=false}
  if(bot.swing){
   ctx.font='25px system-ui';ctx.fillText(bot.job==='chop'?'🪓':'⛏️',x+19,y-10);
  }
  ctx.font='bold 11px system-ui';ctx.strokeStyle='#2b2047';ctx.lineWidth=3;
  ctx.strokeText('🐱 '+bot.name,x,y-32);
  ctx.fillStyle='#fff2ca';ctx.fillText('🐱 '+bot.name,x,y-32);
  if(bot.target&&Math.hypot(bot.x-bot.target.x,bot.y-bot.target.y)<90){
   ctx.font='bold 10px system-ui';ctx.strokeText(bot.target.material+' node',x,y-44);ctx.fillText(bot.target.material+' node',x,y-44);
  }
  ctx.restore();
 }
 for(const item of drops){
  const x=item.x-s.x+W/2,y=item.y-s.y+H/2;
  if(x<-45||x>W+45||y<-45||y>H+45)continue;
  ctx.font='25px system-ui';ctx.fillText('📦',x,y-3);
  ctx.strokeStyle='#2c2344';ctx.lineWidth=3;ctx.font='bold 10px system-ui';
  const label=item.amount+' '+item.material+' · '+item.by;
  ctx.strokeText(label,x,y+14);ctx.fillStyle='#fff8cc';ctx.fillText(label,x,y+14);
 }ctx.restore();
};
})();
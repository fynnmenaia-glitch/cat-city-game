/* Cat City 2026 mobile layout pass and compact objective board.
 * Crucial controls remain accessible; full tools live in the Pause menu.
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,$=id=>document.getElementById(id);
const style=document.createElement('style');style.id='cc-safe-layout';
style.textContent=[
 '#cc-compact-status{display:none;position:fixed;z-index:65;top:113px;left:8px;max-width:48vw;background:#302446d9;border:2px solid #e6c8fa;color:#fff6e5;padding:6px 8px;border-radius:10px;font:700 12px/1.4 system-ui;pointer-events:none}',
 '#cc-objective-toggle{display:none;position:fixed;z-index:68;left:8px;top:226px;margin:0;min-height:35px;max-width:45vw;text-align:left;background:#3c3253e5;border:2px solid #ffdda5;border-radius:11px;color:#fff7e3;font-size:12px;padding:6px 8px;touch-action:manipulation!important}',
 '#cc-event-chip{display:none;position:fixed;right:7px;top:calc(385px + env(safe-area-inset-top));z-index:63;max-width:145px;background:#442b60e8;border:2px solid #ffe1a1;border-radius:11px;color:#fff4dc;font-size:10px;min-height:34px;padding:6px;margin:0}',
 '#cc-event-chip.show{display:block}',
 'body.start-menu-open #cc-event-chip,body.taghouse-inside #cc-event-chip,body.boss-fighting #cc-event-chip{display:none!important}',
 '#cc-objective-sheet{display:none;position:fixed;inset:0;z-index:7250;padding:12px;background:#170d31d9;align-items:center;justify-content:center;touch-action:pan-y!important}',
 '#cc-objective-sheet.open{display:flex}',
 '#cc-objective-sheet>section{width:min(470px,95vw);max-height:86dvh;overflow:auto;touch-action:pan-y!important;background:#fcf4e8;color:#382b4b;border:3px solid #d1b6ee;border-radius:17px;padding:15px}',
 '#cc-objective-sheet button{margin:4px;min-height:43px;border:1px solid #aa92cf;background:#d9c6f3;color:#34244b}',
 '#cc-guide-steps{margin:9px 0;padding:0 0 0 19px;font-size:13px;line-height:1.7}',
 'body.start-menu-open #cc-compact-status,body.start-menu-open #cc-objective-toggle,body.taghouse-inside #cc-compact-status,body.taghouse-inside #cc-objective-toggle,body.boss-fighting #cc-compact-status,body.boss-fighting #cc-objective-toggle{display:none!important}',
 'body:has(#pause-panel.show) #cc-objective-toggle,body:has(#settings-panel.open) #cc-objective-toggle,body:has(#cc-terraria-inventory.open) #cc-objective-toggle{display:none!important}',
 '@media(max-width:700px){',
   '#hud,#quest-tracker,#cc-objective{display:none!important}',
   '#cc-compact-status,#cc-objective-toggle{display:block}',
   '#cat-switch{position:fixed!important;top:calc(7px + env(safe-area-inset-top))!important;left:7px!important;right:auto!important;transform:none!important;z-index:69!important}',
   '#cat-toggle{font-size:11px!important;min-height:32px!important;padding:6px 7px!important;max-width:124px!important;white-space:nowrap!important;overflow:hidden!important}',
   '#settings-control{position:fixed!important;top:calc(7px + env(safe-area-inset-top))!important;right:7px!important;min-height:32px!important;padding:6px 8px!important;font-size:11px!important}',
   '#day-cycle-label{top:calc(41px + env(safe-area-inset-top))!important;left:50%!important;max-width:125px!important;transform:translateX(-50%)!important;padding:2px 6px!important;font-size:9px!important}',
   '#cat-compass{top:calc(67px + env(safe-area-inset-top))!important;left:50%!important;transform:translateX(-50%)!important;width:min(186px,56vw)!important;min-width:0!important;padding:4px 6px!important;z-index:21!important}',
   '#cat-compass .points{font-size:11px!important;letter-spacing:1px!important}#cat-compass .questdirection{font-size:8px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}',
   '#pause-open{position:fixed!important;top:calc(54px + env(safe-area-inset-top))!important;right:7px!important;left:auto!important;min-height:32px!important;font-size:11px!important;padding:6px!important;z-index:65!important}',
   '#shop-switch{position:fixed!important;top:calc(113px + env(safe-area-inset-top))!important;right:7px!important;left:auto!important;transform:none!important;z-index:66!important}',
   '#shop-toggle{font-size:11px!important;min-height:34px!important;padding:6px 8px!important;margin:0!important}',
   '#quest-btn{position:fixed!important;top:calc(153px + env(safe-area-inset-top))!important;right:7px!important;left:auto!important;min-height:34px!important;font-size:11px!important;padding:6px 8px!important;margin:0!important;z-index:62!important}',
   '#map-open{position:fixed!important;top:calc(194px + env(safe-area-inset-top))!important;right:7px!important;left:auto!important;min-height:34px!important;padding:6px 8px!important;font-size:11px!important;z-index:61!important}',
   '#wardrobe-open,#tycoon-open{display:none!important}',
   '#stamina-ui{position:fixed!important;top:calc(163px + env(safe-area-inset-top))!important;left:8px!important;bottom:auto!important;width:min(137px,43vw)!important;height:46px!important;min-height:0!important;padding:5px 7px!important;font-size:10px!important;line-height:1.2!important;z-index:54!important}',
   '#stamina-track{height:8px!important;margin-top:4px!important}',
   '#cc-compact-status{top:calc(113px + env(safe-area-inset-top))!important;left:8px!important;font-size:11px!important;width:min(137px,43vw)!important;min-height:42px!important;max-width:none!important}',
   '#cc-objective-toggle{top:calc(217px + env(safe-area-inset-top))!important;left:8px!important;font-size:10px!important;width:min(137px,43vw)!important;max-width:none!important;padding:6px!important}',
   '#cc-bag-button{position:fixed!important;top:calc(261px + env(safe-area-inset-top))!important;left:8px!important;bottom:auto!important;min-height:35px!important;padding:6px 8px!important;font-size:11px!important;z-index:63!important}',
   '#catcity-online-open{position:fixed!important;top:calc(304px + env(safe-area-inset-top))!important;left:8px!important;bottom:auto!important;right:auto!important;min-height:34px!important;padding:6px 8px!important;font-size:11px!important;z-index:65!important;margin:0!important}',
   '#cc-chat-float{position:fixed!important;top:calc(347px + env(safe-area-inset-top))!important;left:8px!important;bottom:auto!important;width:103px!important;min-height:34px!important;font-size:11px!important;padding:6px 8px!important;z-index:66!important}',
   '#catcity-online-status{display:none!important}',
   '#cc-poll-chip{top:calc(246px + env(safe-area-inset-top))!important;right:7px!important;max-width:140px!important}',
   '#cc-bot-action{position:fixed!important;top:calc(293px + env(safe-area-inset-top))!important;right:7px!important;left:auto!important;bottom:auto!important;max-width:145px!important;min-height:34px!important;font-size:10px!important;padding:6px!important}',
   '#cc-hotbar-ten{bottom:calc(161px + env(safe-area-inset-bottom))!important;width:min(370px,95vw)!important}',
   '#cc-hotbar-ten button{min-height:29px!important}',
   '#mobile{width:122px!important;height:122px!important;left:9px!important;bottom:calc(9px + env(safe-area-inset-bottom))!important;border-width:3px!important;z-index:44!important}',
   '#stick{width:50px!important;height:50px!important;left:33px!important;top:33px!important}',
   '#interact{right:9px!important;bottom:calc(11px + env(safe-area-inset-bottom))!important;width:94px!important;min-width:94px!important;height:52px!important;min-height:52px!important;padding:5px!important;font-size:14px!important;z-index:53!important}',
   '#sprint{right:9px!important;bottom:calc(74px + env(safe-area-inset-bottom))!important;width:94px!important;min-width:94px!important;height:43px!important;min-height:43px!important;padding:5px!important;font-size:12px!important;z-index:53!important}',
   '#cc-pickup-hint{bottom:calc(209px + env(safe-area-inset-bottom))!important;left:50%!important;max-width:60vw!important;padding:5px 7px!important;font-size:9px!important;pointer-events:none!important;text-align:center!important}',
   '#cc-pickup-hint:empty{display:none!important}',
   '#toast{top:auto!important;bottom:calc(243px + env(safe-area-inset-bottom))!important;left:50%!important;max-width:68vw!important;font-size:11px!important;padding:7px!important;z-index:95!important;pointer-events:none!important}',
   '#cc-global-announcement{top:calc(410px + env(safe-area-inset-top))!important;left:50%!important;width:min(340px,87vw)!important;font-size:12px!important;padding:8px!important}',
   '.cc-cave-indicator{top:calc(405px + env(safe-area-inset-top))!important;left:50%!important;max-width:75vw!important;font-size:11px!important}',
   '#save-switch{position:relative!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;width:100%!important;display:block!important}',
   '#save-toggle{font-size:12px!important;padding:10px!important;width:98%!important}',
   '#save-panel{position:relative!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;width:100%!important;max-height:35dvh!important;overflow:auto!important;touch-action:pan-y!important}',
   '#pause-panel .cc-list{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px!important}',
   '#pause-panel .cc-list>button{min-height:42px!important;min-width:0!important;width:100%!important;font-size:12px!important;padding:7px!important;margin:1px!important}',
   '#pause-panel .cc-card{max-height:85dvh!important;overflow:auto!important;touch-action:pan-y!important}',
   '.cc-panel .cc-card{max-width:min(92vw,560px)!important}',
   '#dialog{top:calc(100px + env(safe-area-inset-top))!important;width:94vw!important;max-height:62dvh!important}',
 '}',
 '@media(max-height:650px) and (max-width:700px){#cc-hotbar-ten{bottom:135px!important}#mobile{width:105px!important;height:105px!important}#stick{left:26px!important;top:26px!important}#catcity-online-open{top:265px!important}#cc-chat-float{top:307px!important}}'
].join('\n');
// Universal toast fix: all collection, equipment, helper and quest notifications
// must be small notifications, never a tall full-screen purple rectangle.
style.textContent+=[
 '#toast{position:fixed!important;inset:auto!important;left:50%!important;right:auto!important;bottom:calc(245px + env(safe-area-inset-bottom))!important;top:auto!important;transform:translateX(-50%)!important;width:max-content!important;max-width:min(320px,85vw)!important;height:auto!important;max-height:58px!important;min-height:0!important;padding:8px 12px!important;border:2px solid #e7d2fa!important;border-radius:12px!important;background:#493663ef!important;box-shadow:0 4px 16px #24163477!important;color:#fff7e8!important;text-align:center!important;font:700 12px/1.3 system-ui!important;overflow:hidden!important;overflow-wrap:anywhere!important;white-space:normal!important;pointer-events:none!important;z-index:280!important;box-sizing:border-box!important}',
 'body.start-menu-open #toast{display:none!important}',
 '@media(max-height:650px){#toast{bottom:calc(190px + env(safe-area-inset-bottom))!important}}'
].join('');
style.textContent+='\n@media(max-width:700px){html body #mobile{width:122px!important;height:122px!important;left:9px!important;bottom:calc(9px + env(safe-area-inset-bottom))!important}html body #stick{width:50px!important;height:50px!important;left:33px!important;top:33px!important}html body #cc-hotbar-ten{bottom:calc(194px + env(safe-area-inset-bottom))!important}}';
// Keep the 10-slot inventory HOTBAR above the stamina meter, with the
// stamina meter below it and above the movement joystick. This also handles
// landscape iPhones, whose CSS viewport can be wider than 700px.
style.textContent += [
 '@media (max-width:900px), (hover:none) and (pointer:coarse){',
 'html body #cc-hotbar-ten{position:fixed!important;top:auto!important;bottom:calc(214px + env(safe-area-inset-bottom,0px))!important;left:50%!important;transform:translateX(-50%)!important;z-index:67!important}',
 'html body #stamina-ui{position:fixed!important;top:auto!important;bottom:calc(143px + env(safe-area-inset-bottom,0px))!important;left:9px!important;right:auto!important;height:44px!important;min-height:0!important;width:min(150px,43vw)!important;padding:5px 7px!important;font-size:10px!important;line-height:1.2!important;z-index:54!important;box-sizing:border-box!important}',
 'html body #stamina-track{height:8px!important;margin-top:4px!important}',
 'html body #mobile{width:122px!important;height:122px!important;left:9px!important;bottom:calc(9px + env(safe-area-inset-bottom,0px))!important}',
 'html body #stick{width:50px!important;height:50px!important;left:33px!important;top:33px!important}',
 '}'
].join('');
// The six-cat chooser must cover nearby HUD chips; otherwise Skylar/Pumpkin
// entries receive clicks on the Next Goal, Inventory or Online buttons instead.
style.textContent += [
 'body:has(#cat-menu.open) #cat-switch{z-index:7000!important;isolation:isolate!important}',
 'body:has(#cat-menu.open) #cat-menu{display:block!important;position:absolute!important;z-index:7001!important;left:0!important;top:100%!important;max-height:min(66dvh,480px)!important;width:min(225px,83vw)!important;overflow-y:auto!important;touch-action:pan-y!important;overscroll-behavior:contain!important;box-shadow:0 12px 30px #20112dbb!important}',
 'body:has(#cat-menu.open) #cat-menu button{width:calc(100% - 8px)!important;min-height:40px!important;display:block!important;touch-action:manipulation!important}',
 'body:has(#cat-menu.open) #cc-objective-toggle,body:has(#cat-menu.open) #cc-compact-status,body:has(#cat-menu.open) #stamina-ui,body:has(#cat-menu.open) #cc-bag-button,body:has(#cat-menu.open) #catcity-online-open,body:has(#cat-menu.open) #cc-chat-float,body:has(#cat-menu.open) #shop-switch,body:has(#cat-menu.open) #quest-btn,body:has(#cat-menu.open) #map-open,body:has(#cat-menu.open) #cc-global-poll{visibility:hidden!important;pointer-events:none!important}'
].join('');
document.head.append(style);
const mini=document.createElement('div');mini.id='cc-compact-status';mini.setAttribute('role','status');document.body.append(mini);
const objective=document.createElement('button');objective.id='cc-objective-toggle';
objective.type='button';objective.textContent='🎯 Next Goal';document.body.append(objective);
const eventChip=document.createElement('button');eventChip.id='cc-event-chip';eventChip.type='button';eventChip.textContent='🎪 Current Event';document.body.append(eventChip);
const sheet=document.createElement('div');sheet.id='cc-objective-sheet';
sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','Adventure goals and optional quests');
sheet.innerHTML='<section><h2>🎯 Adventure Goals</h2><p id="cc-goal-current"></p><p id="cc-goal-event"></p><ol id="cc-guide-steps"></ol><p>Quests are optional. Explore, mine, craft or collect treasure at your own pace.</p><button id="cc-goal-quests">📜 Open Quests</button><button id="cc-goal-tutorial">🏫 Practice Tutorial</button><button id="cc-goal-close">✕ Back to Game</button></section>';
document.body.append(sheet);
const goals=[
 {key:'pickup',label:'Find a glowing sword or armour in a biome and tap E / 🐾 to pick it up.',done:()=>s.adventurePicked?.length>0||s.adventureItems?.length>0},
 {key:'equip',label:'Open Inventory, select a weapon and press Equip.',done:()=>!!s.adventureEquipment?.weapon},
 {key:'chop',label:'Visit West Forest. Chop a full-size tree with three axe strikes.',done:()=>Number(s.materials?.wood)>0},
 {key:'mine',label:'Mine a rock or crystal to collect materials.',done:()=>Number(s.materials?.stone)>0||Number(s.materials?.crystal)>0},
 {key:'chest',label:'Open a Woodland treasure chest and collect equipment.',done:()=>s.chestsOpened?.length>0},
 {key:'craft',label:'Craft arrows or tools using gathered resources.',done:()=>Number(s.ammoArrows)>0||s.gear?.length>0},
 {key:'explore',label:'Explore a second biome and discover its ground loot and hidden treasures.',done:()=>Array.isArray(s.adventureVisited)&&s.adventureVisited.length>=2},
 {key:'quest',label:'Try an optional main quest when you want a story challenge.',done:()=>Number(s.questStage)>0}
];
function currentGoal(){return goals.find(g=>!g.done())||{label:'Explore new biomes, collect rare gear and build your own adventure!'}}
function currentBiome(){
 const size=core.T*24,cx=Math.floor(s.x/size),cy=Math.floor(s.y/size);
 if(cx===0&&cy===0)return 'town';
 if(cx<0&&cy>=-1&&cy<=1)return 'wild';
 const n=Math.sin(cx*127.1+cy*311.7)*43758.5453;
 const v=n-Math.floor(n);
 return v<.17?'cherry':v>.82?'poison':v<.32?'marsh':v>.66?'moonstone':'wild';
}
function renderSheet(){
 const tracked=window.catCityQuestBoard?.trackedGoal?.();
 $('cc-goal-current').textContent='Next: '+(tracked?.label||currentGoal().label)+(tracked?' · '+tracked.hint:'');
 const ev=window.catCityGetAdventureEvent?.()||{},left=Math.max(0,(ev.endsAt||0)-Date.now()/1000);
 $('cc-goal-event').textContent=left>0&&ev.name!=='none'?'🎪 Active event: '+ev.name.replaceAll('_',' ')+' · '+(ev.luck||1)+'× luck · '+Math.ceil(left/60)+' min remaining':'🎪 No special event currently active.';
 const list=$('cc-guide-steps');list.replaceChildren();
 for(const goal of goals){
  const li=document.createElement('li');li.textContent=(goal.done()?'✓ ':'○ ')+goal.label;
  li.style.color=goal.done()?'#477757':'#493650';list.append(li);
 }
}
function openSheet(){renderSheet();sheet.classList.add('open')}
function closeSheet(){sheet.classList.remove('open')}
objective.onclick=openSheet;eventChip.onclick=openSheet;
$('cc-goal-close').onclick=closeSheet;
$('cc-goal-quests').onclick=()=>{closeSheet();$('quest-btn')?.click()};
$('cc-goal-tutorial').onclick=()=>{closeSheet();window.catCityTutorial?.start(true)};
sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet()});
const pauseList=$('pause-panel')?.querySelector('.cc-list');
const save=$('save-switch');
if(pauseList&&save)pauseList.append(save);
function pauseAction(label,selector){
 if(!pauseList)return;
 const button=document.createElement('button');button.textContent=label;
 button.onclick=()=>{$('pause-panel')?.classList.remove('show');$(selector)?.click()};pauseList.append(button);
}
pauseAction('🛍️ Shop','shop-toggle');
pauseAction('👑 Wardrobe & Looks','wardrobe-open');
pauseAction('📜 Quests','quest-btn');
pauseAction('⚙️ Settings','settings-control');
if(pauseList){
 const b=document.createElement('button');b.textContent='🎯 Adventure Objectives';
 b.onclick=()=>{$('pause-panel')?.classList.remove('show');openSheet()};
 pauseList.prepend(b);
}
function closeAllTransient(){
 const all=['cc-terraria-inventory','cc-objective-sheet','cc-global-poll','cc-bot-crew','cc-training-island',
 'cc-account-modal','cc-npc-modal','cc-chat-modal','world-inventory','cc-pc-house'];
 for(const id of all)$(id)?.classList.remove('open');
 for(const id of ['shop-menu','cat-menu','save-panel'])$(id)?.classList.remove('open');
 for(const id of ['shop-toggle','cat-toggle','save-toggle'])$(id)?.setAttribute('aria-expanded','false');
}
const titleMenu=$('catcity-start-menu');
if(titleMenu)new MutationObserver(()=>{
 if(titleMenu.classList.contains('show'))closeAllTransient();
}).observe(titleMenu,{attributes:true,attributeFilter:['class']});
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&sheet.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();closeSheet()}
},true);
let lastBiome='';
function update(){
 const cats=core.cats,role=cats[s.cat]?.name||'Cat';
 const info=window.catCityOnlineRoomInfo?.()||{};
 const onlinePlayers=(info.players||[]).filter(p=>p.online);
 const occupied=new Set(onlinePlayers.map(p=>p.cat));
 const teammates=info.crewRoom?(info.bots||[]).filter(b=>!occupied.has(b.role)).length:0;
 const room=info.connected?'🌐 '+(onlinePlayers.length+teammates)+'/'+(info.humanCapacity||6)+' players':'📍 '+currentBiome();
 const hearts=Number.isFinite(s.hearts)&&window.catCityPlaytest?' · ❤️ '+s.hearts+'/'+window.catCityPlaytest.max():'';
 mini.textContent='🐱 '+role+' · 🐟 '+Math.floor(s.fish||0)+'\n'+room+hearts;
 mini.style.whiteSpace='pre-line';
 const labels={pickup:'Find gear',equip:'Equip a sword',chop:'Chop a tree',mine:'Mine ore',
  chest:'Open a chest',craft:'Craft arrows',explore:'Visit a biome',quest:'Try a quest'};
 const tracked=window.catCityQuestBoard?.trackedGoal?.();
 objective.textContent=tracked?'🎯 '+tracked.name.slice(0,17)+' '+tracked.progress+'/'+tracked.target:'🎯 '+(labels[currentGoal().key]||'Free play');
 const event=window.catCityGetAdventureEvent?.()||{};
 const seconds=Math.max(0,(event.endsAt||0)-Date.now()/1000);
 eventChip.classList.toggle('show',seconds>0&&event.name!=='none');
 if(seconds>0&&event.name!=='none')eventChip.textContent='🎪 '+event.name.replaceAll('_',' ').slice(0,14)+' · '+(event.luck||1)+'×';
 const biome=currentBiome();
 if(biome!==lastBiome){
  lastBiome=biome;s.adventureVisited=Array.isArray(s.adventureVisited)?s.adventureVisited:[];
  if(!s.adventureVisited.includes(biome)){s.adventureVisited.push(biome);core.persist()}
  window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'explore',biome}}));
 }
}
update();setInterval(update,1500);
window.catCityObjectives={open:openSheet,next:()=>currentGoal().label,count:goals.length};
})();
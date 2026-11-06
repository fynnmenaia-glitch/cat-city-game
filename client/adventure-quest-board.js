/* Cat City Adventure Quest Board — repeatable gathering, treasure, gear and
 * exploration missions alongside (not replacing) all 16 Biscuit story quests.
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const $=id=>document.getElementById(id),s=core.state,T=core.T;
const quests=[
 {id:'timber',name:'🪵 Forest Woodcutter',type:'chop',count:3,step:2,desc:'Chop trees in West Forest or anywhere wooded. Each felled tree counts.',hint:'Find the big green pixel trees west of the starting village.'},
 {id:'stone',name:'⛏️ Mineral Explorer',type:'mine',count:3,step:2,desc:'Mine stone, crystals or rare ores in the biomes.',hint:'Move into wild biomes and strike the rocks three times.'},
 {id:'chests',name:'🧰 Treasure Hunter',type:'chest',count:1,step:1,desc:'Open woodland chests to uncover gear and materials.',hint:'Look for a 🧰 outside the town; stand nearby and press E / 🐾.'},
 {id:'scavenge',name:'⚔️ Gear Collector',type:'pickup',count:3,step:2,desc:'Pick up real weapons and armour lying on the ground.',hint:'Look for glowing equipment in the forest, marsh, cherry and Flower Terrace biomes.'},
 {id:'explore',name:'🗺️ Biome Trailblazer',type:'explore',count:2,step:1,desc:'Visit different biome areas and discover new terrain.',hint:'Leave the village and explore west, east and south; different biomes count once per mission.'},
 {id:'festival',name:'🎪 Festival Adventurer',type:'enter_event',count:1,step:1,desc:'Explore a temporary event cave or hut while it is active.',hint:'Join Ghost 2.0 or Pumpkin Cutie, then walk into its temporary entrance.'}
];
s.boardQuests=s.boardQuests&&typeof s.boardQuests==='object'?s.boardQuests:{};
s.boardTracked=typeof s.boardTracked==='string'?s.boardTracked:'';
s.boardTotalClaims=Math.max(0,Number(s.boardTotalClaims)||0);
for(const q of quests){
 const old=s.boardQuests[q.id];
 s.boardQuests[q.id]=old&&typeof old==='object'?old:{level:0,progress:0,seen:[]};
 const o=s.boardQuests[q.id];
 o.level=Math.max(0,Math.floor(Number(o.level)||0));
 o.progress=Math.max(0,Number(o.progress)||0);
 o.seen=Array.isArray(o.seen)?o.seen:[];
}
const goal=q=>q.count+Math.min(5,s.boardQuests[q.id].level)*q.step;
const progress=q=>Math.min(goal(q),s.boardQuests[q.id].progress);
const current=q=>s.boardQuests[q.id],completed=q=>progress(q)>=goal(q);
// Place the sign near the starting square, not far south beyond the village.
const boardPosition={x:16*T,y:15*T};
function action(type,data={}){
 if(data.tutorial)return;
 let changed=false;
 for(const q of quests){
  if(q.type!==type||completed(q))continue;
  if(type==='pickup'&&data.item?.type==='squishem')continue;
  const rec=current(q);
  if(type==='explore'){
   if(!data.biome||rec.seen.includes(data.biome))continue;
   rec.seen.push(data.biome);
   rec.progress=rec.seen.length;
  }else rec.progress++;
  changed=true;
  if(completed(q)){core.note('📜 Quest Board: '+q.name+' complete! Return to claim your reward.')}
 }
 if(changed){core.persist();if(panel.classList.contains('open'))render()}
}
window.addEventListener('catcity:adventure-action',e=>{
 const d=e.detail||{},type=d.type;
 if(['mine','chop','pickup','chest','explore','enter_event'].includes(type))action(type,d);
});
function rewardItem(q,level){
 const options={
  timber:['Timberguard Sword','weapon'],stone:['Crystal Miner Helmet','head'],
  chests:['Treasure Seeker Blade','weapon'],scavenge:['Ranger Paw Boots','paws'],
  explore:['Explorer’s Cape','body'],festival:['Festival Star Blade','weapon']
 };
 const [name,type]=options[q.id];
 return {id:'board:'+q.id+':'+level,name:name+' +'+level,type,rarity:level>=5?'legendary':'rare',
 color:level>=5?'#ffcd81':'#b3a2ed',durability:160+level*12,maxDurability:160+level*12};
}
function claim(id){
 const q=quests.find(x=>x.id===id);if(!q||!completed(q))return false;
 const rec=current(q),next=rec.level+1,gearReward=next%3===0;
 if(gearReward&&window.catCityInventoryHasSpace&&!window.catCityInventoryHasSpace()){
  core.note('🎒 Free an inventory slot before claiming your bonus adventure gear.');return false;
 }
 const coins=35+next*15;
 rec.level=next;rec.progress=0;rec.seen=[];
 s.boardTotalClaims++;s.fish=(Number(s.fish)||0)+coins;
 s.materials=s.materials||{};
 if(q.id==='timber')s.steel=(Number(s.steel)||0)+1;
 else if(q.id==='stone')s.materials.wood=(s.materials.wood||0)+2;
 else if(q.id==='chests')s.materials.eligeode=(s.materials.eligeode||0)+1;
 else s.materials.stone=(s.materials.stone||0)+1;
 if(gearReward){
  const item=rewardItem(q,next);
  s.adventureItems=Array.isArray(s.adventureItems)?s.adventureItems:[];
  if(!s.adventureItems.some(x=>x.id===item.id)){
   s.adventureItems.push(item);window.catCityInventoryItemAdded?.(item);
  }
 }
 if(s.boardTotalClaims>=15)s.boardRank='Royal Adventurer';
 else if(s.boardTotalClaims>=5)s.boardRank='Rising Explorer';
 else s.boardRank='Novice Adventurer';
 core.persist();
 core.note('🏆 '+q.name+': +'+coins+' 🐟'+(gearReward?' and rare gear!':''));
 render();return true;
}
function trackedGoal(){
 const q=quests.find(x=>x.id===s.boardTracked);if(!q)return null;
 return {id:q.id,name:q.name,label:q.name+' ('+progress(q)+'/'+goal(q)+')',hint:q.hint,
  progress:progress(q),target:goal(q)};
}
function track(id){
 const q=quests.find(x=>x.id===id);if(!q)return false;
 s.boardTracked=id;core.persist();render();
 core.note('🧭 Tracking '+q.name+' · '+q.hint);return true;
}
const css=document.createElement('style');css.id='cc-quest-board-css';
css.textContent=[
 '#cc-quest-board{display:none;position:fixed;inset:0;z-index:8450;background:#1c1234e6;align-items:center;justify-content:center;padding:8px;touch-action:pan-y!important}',
 '#cc-quest-board.open{display:flex}',
 '#cc-qb-card{background:linear-gradient(#fff5db,#f0dbe5);color:#45334b;border:3px solid #c9a79e;border-radius:17px;width:min(540px,97vw);max-height:88dvh;overflow-y:auto!important;-webkit-overflow-scrolling:touch;touch-action:pan-y!important;overscroll-behavior:contain;padding:14px}',
 '#cc-qb-card h2{font:900 20px system-ui;margin:0 0 6px}',
 '#cc-qb-card p{font:12px/1.5 system-ui;margin:4px 0 10px}',
 '#cc-qb-tasks{display:grid;grid-template-columns:1fr;gap:7px}',
 '#cc-qb-tasks article{padding:10px;border:2px solid #d8b7a7;border-radius:11px;background:#fffaf2}',
 '#cc-qb-tasks strong{display:block;font-size:13px}',
 '#cc-qb-tasks small{display:block;font:11px/1.5 system-ui;color:#69586e}',
 '#cc-qb-tasks progress{width:100%;height:11px;margin:4px 0}',
 '#cc-quest-board button{background:#e9cfde;color:#4a3051;border:1px solid #b89dbd;border-radius:9px;margin:3px;padding:7px 10px;min-height:38px;font:bold 11px system-ui;touch-action:manipulation!important}',
 '#cc-quest-board button:disabled{opacity:.55}',
 '#cc-qb-footer{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end}',
 'body.cc-in-museum #cc-quest-board{display:none!important}'
].join('\n');document.head.append(css);
const panel=document.createElement('div');panel.id='cc-quest-board';panel.setAttribute('role','dialog');
panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Cat City repeatable adventure quest board');
panel.innerHTML='<section id="cc-qb-card"><h2>📜 The Adventure Quest Board</h2><p>Find this board just north of the village spawn, or open it from Quests. Repeatable challenges for gathering, treasure, exploring and festivals. These are optional and separate from Biscuit’s 16 story quests. Every third reward includes rare equipment!</p><p id="cc-qb-rank"></p><div id="cc-qb-tasks"></div><div id="cc-qb-footer"><button id="cc-qb-story" type="button">📖 Main Story Quests</button><button id="cc-qb-event" type="button">🎪 Event Challenges</button><button id="cc-qb-close" type="button">✕ Close</button></div></section>';
document.body.append(panel);
const tasks=$('cc-qb-tasks');
function addButton(parent,title,fn,disabled=false){
 const b=document.createElement('button');b.type='button';b.textContent=title;b.onclick=fn;b.disabled=disabled;parent.append(b);return b;
}
function render(){
 $('cc-qb-rank').textContent='⭐ '+(s.boardRank||'Novice Adventurer')+' · '+s.boardTotalClaims+' missions claimed · 🐟 '+Math.floor(s.fish||0);
 tasks.replaceChildren();
 for(const q of quests){
  const rec=current(q),need=goal(q),value=progress(q),ready=completed(q);
  const article=document.createElement('article');
  const title=document.createElement('strong');title.textContent=(ready?'✅ ':s.boardTracked===q.id?'🧭 ':'◻ ')+q.name;
  const desc=document.createElement('small');desc.textContent=q.desc;
  const bar=document.createElement('progress');bar.max=need;bar.value=value;bar.setAttribute('aria-label',q.name+' completion');
  const tally=document.createElement('small');tally.textContent=value+' / '+need+' · '+(35+(rec.level+1)*15)+' 🐟 reward · Tier '+(rec.level+1);
  const hint=document.createElement('small');hint.textContent='Hint: '+q.hint;
  article.append(title,desc,bar,tally,hint);
  addButton(article,s.boardTracked===q.id?'🧭 Tracking':'🧭 Track',()=>track(q.id));
  addButton(article,ready?'🎁 Claim Reward':'⏳ In progress',()=>claim(q.id),!ready);
  tasks.append(article);
 }
}
function open(){
 $('pause-panel')?.classList.remove('show');
 $('cc-objective-sheet')?.classList.remove('open');
 render();panel.classList.add('open');
}
function close(){panel.classList.remove('open')}
$('cc-qb-close').onclick=close;
$('cc-qb-story').onclick=()=>{close();$('quest-btn')?.click()};
$('cc-qb-event').onclick=()=>{close();window.catCityEventAdventure?.open()};
panel.onclick=e=>{if(e.target===panel)close()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open')){e.stopImmediatePropagation();e.preventDefault();close()}},true);
const pause=$('pause-panel')?.querySelector('.cc-list');
if(pause){const b=document.createElement('button');b.id='cc-qb-open';b.textContent='📜 Adventure Quest Board';b.onclick=open;pause.prepend(b)}
const goalSheet=$('cc-objective-sheet')?.querySelector('section');
if(goalSheet){
 const button=document.createElement('button');button.type='button';button.id='cc-qb-from-goals';
 button.textContent='📜 Repeatable Quest Board';button.onclick=open;
 const closeButton=$('cc-goal-close');goalSheet.insertBefore(button,closeButton);
}
const priorDraw=core.draw;
core.draw=function(){
 priorDraw();
 if(core.bossMode||window.catCityMuseum?.inside||window.catCitySquishemPlaces?.inside||window.catCityPCHouse?.inside||
  window.catCityTagHouse?.inside||window.catCityCaveState?.().inside||$('catcity-start-menu')?.classList.contains('show'))return;
 const g=core.ctx,px=boardPosition.x-s.x+core.W/2,py=boardPosition.y-s.y+core.H/2;
 if(px<-80||px>core.W+80||py<-80||py>core.H+80)return;
 g.save();g.translate(px,py);g.fillStyle='#795139';g.fillRect(-34,-39,8,62);g.fillRect(26,-39,8,62);
 g.fillStyle='#a87649';g.fillRect(-49,-75,98,58);g.fillStyle='#f1d8a7';g.fillRect(-43,-70,86,49);
 g.textAlign='center';g.fillStyle='#493849';g.font='bold 12px system-ui';g.fillText('📜 QUESTS',0,-48);
 g.font='21px system-ui';g.fillText('⭐',0,-21);
 if(Math.hypot(s.x-boardPosition.x,s.y-boardPosition.y)<90){
  g.strokeStyle='#42334a';g.lineWidth=3;g.font='bold 11px system-ui';
  g.strokeText('E / 🐾 Quest Board',0,45);g.fillStyle='#fff9de';g.fillText('E / 🐾 Quest Board',0,45);
 }g.restore();
};
const previousInteract=core.interact;
core.interact=function(){
 if(!window.catCityMuseum?.inside&&!window.catCitySquishemPlaces?.inside&&!window.catCityPCHouse?.inside&&
  Math.hypot(s.x-boardPosition.x,s.y-boardPosition.y)<83){open();return}
 return previousInteract();
};
if($('interact'))$('interact').onclick=()=>core.interact();
const menu=$('catcity-start-menu');
if(menu)new MutationObserver(()=>{if(menu.classList.contains('show'))close()}).observe(menu,{attributes:true,attributeFilter:['class']});
window.catCityQuestBoard={quests,open,close,claim,track,trackedGoal,boardPosition,action,goal,progress,completed,
 get totalClaims(){return s.boardTotalClaims}};
})();
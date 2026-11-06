/* Cat City — Training Village tutorial (replaces the old training island).
 *
 * A small fenced-off corner of Cat City with the real game art and systems:
 * the signpost, Biscuit, Pebble, Forge, Marmalade's walk-in shop, a tree, a
 * rock, a treasure chest, a crafting table, the quest board and the big gate
 * into Cat City. 15 steps, each voiced by Sofia (client/assets/voice/tNN.m4a)
 * with subtitles. While a step is waiting for you, the screen dims except the
 * thing you need: the place to walk to, then the 🐾 button when you're close,
 * or the exact button (backpack, sword slot, Equip, Make arrows, Fish Snack,
 * Sprint). The light comes back when the step is done. If you still haven't
 * reached the place 5 seconds after the line ends, a see-through ghost of your
 * cat floats there to show you the way. Lines are never cut off: the next
 * step's line waits for the current one to finish.
 *
 * Uses the real backpack (equip + crafting), shop and shop interior. Keeps the
 * old API (window.catCityTutorial, s.tutorialStep, s.tutorialCompleted) and
 * hooks (Play, Online buttons, title "Practice Tutorial", Pause replay).
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state,$=id=>document.getElementById(id),T=32,WW=30*T,WH=20*T;
const art=()=>window.catCityCatArt,nature=()=>window.catCityNatureArt,items=()=>window.catCityItemArt;
// ------------------------------------------------------------------ style + DOM
const style=document.createElement('style');style.id='cc-training-village-style';
style.textContent=[
 '#cc-tutorial-island{display:none;position:fixed;inset:0;z-index:7900;background:#1a234f;touch-action:none;overflow:hidden}',
 '#cc-tutorial-island.open{display:block}',
 '#cc-tutorial-island.away{display:none!important}',
 '#cc-tv-canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated}',
 '#cc-tv-sub{position:absolute;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);width:min(640px,94vw);background:#2b1f45ee;border:3px solid #ffe3a6;border-radius:16px;color:#fff;padding:10px 14px 10px 46px;font:bold 15px/1.4 system-ui;box-shadow:0 6px 20px #0008;z-index:3}',
 '#cc-tv-sub:before{content:"🎙️";position:absolute;left:12px;top:9px;font-size:22px}',
 '#cc-tv-sub small{display:block;color:#ffe3a6;font-size:11px;letter-spacing:.5px;margin-bottom:2px}',
 '#cc-tv-meter{position:absolute;left:50%;transform:translateX(-50%);top:calc(4px + env(safe-area-inset-top));width:min(640px,94vw);height:5px;background:#ffffff30;border-radius:4px;overflow:hidden;z-index:3}#cc-tv-meter i{display:block;height:100%;width:0;background:#ffd56a;transition:width .4s}',
 '#cc-tv-pad{position:absolute;left:16px;bottom:calc(18px + env(safe-area-inset-bottom));width:120px;height:120px;border-radius:50%;background:#ffffff22;border:3px solid #ffffff80;touch-action:none;z-index:3}',
 '#cc-tv-pad i{position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:#e8c8ffd0;pointer-events:none}',
 '.cc-tv-btn{position:absolute;z-index:3;margin:0;border:3px solid #fff8e8;border-radius:18px;font:900 15px system-ui;color:#33224a;box-shadow:0 4px 12px #0006;touch-action:none}',
 '#cc-tv-act{right:16px;bottom:calc(22px + env(safe-area-inset-bottom));width:92px;height:72px;background:#ffe3a6;font-size:26px}',
 '#cc-tv-sprint{right:118px;bottom:calc(30px + env(safe-area-inset-bottom));width:86px;height:56px;background:#a6f1d3}',
 '#cc-tv-sprint.on{background:#f6d58c}',
 '#cc-tv-bag{right:16px;bottom:calc(106px + env(safe-area-inset-bottom));width:92px;height:48px;background:#dcc5f7;font-size:13px}',
 '#cc-tv-voice{left:12px;top:calc(96px + env(safe-area-inset-top));width:auto;height:40px;padding:0 10px;background:#dcc5f7;font-size:13px}',
 '#cc-tv-leave{right:12px;top:calc(96px + env(safe-area-inset-top));width:auto;height:40px;padding:0 10px;background:#f6c6d2;font-size:13px}',
 '#cc-tv-talk{display:none;position:absolute;left:50%;bottom:calc(150px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(520px,92vw);background:#fff8ec;color:#33224a;border:3px solid #c9a6ef;border-radius:16px;padding:12px 14px;font:600 15px/1.45 system-ui;z-index:4;box-shadow:0 8px 24px #0007}',
 '#cc-tv-talk b{color:#7a46c0}#cc-tv-talk button{display:block;margin:8px 0 0 auto;min-height:40px;border:0;border-radius:10px;background:#ffe3a6;font:bold 14px system-ui;padding:6px 14px}',
 '#cc-tv-cheer{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%) scale(.6);opacity:0;font:900 30px system-ui;color:#fff3b0;text-shadow:0 3px 0 #5b3a8a,0 0 18px #ffb6e8;transition:all .35s;pointer-events:none;z-index:3}',
 '#cc-tv-cheer.show{opacity:1;transform:translate(-50%,-50%) scale(1)}',
 // Spotlight: everything dims except one rounded hole. Taps go straight through it.
 '#cc-spotlight{position:fixed;left:0;top:0;width:0;height:0;border-radius:18px;box-shadow:0 0 0 200vmax rgba(12,6,26,.66);pointer-events:none;z-index:99990;opacity:0;transition:opacity .45s,left .12s,top .12s,width .12s,height .12s}',
 '#cc-spotlight.on{opacity:1}',
 '#cc-spotlight:after{content:"";position:absolute;inset:-5px;border-radius:22px;border:3px solid #ffe38a;animation:ccSpot 1.1s ease-in-out infinite}',
 '@keyframes ccSpot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.07);opacity:.55}}',
 'body.cc-tutorial-play #cc-hotbar-ten{display:none!important}',
 '@media(pointer:fine){#cc-tv-pad{display:none}}'
].join('\n');document.head.append(style);
const root=document.createElement('div');root.id='cc-tutorial-island';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Training Village tutorial');
root.innerHTML='<canvas id="cc-tv-canvas"></canvas><div id="cc-tv-meter"><i></i></div><div id="cc-tv-sub"><small id="cc-tv-stage"></small><span id="cc-tv-line"></span></div>'+
 '<div id="cc-tv-pad"><i></i></div><button type="button" class="cc-tv-btn" id="cc-tv-act" aria-label="Action">🐾</button><button type="button" class="cc-tv-btn" id="cc-tv-sprint">⚡ Sprint</button><button type="button" class="cc-tv-btn" id="cc-tv-bag">🎒 Backpack</button>'+
 '<button type="button" class="cc-tv-btn" id="cc-tv-voice">🔊 Voice on</button><button type="button" class="cc-tv-btn" id="cc-tv-leave">↩ Training menu</button>'+
 '<div id="cc-tv-talk"><div id="cc-tv-talk-text"></div><button type="button" id="cc-tv-talk-ok">OK 🐾</button></div><div id="cc-tv-cheer"></div>';
document.body.append(root);
const spot=document.createElement('div');spot.id='cc-spotlight';document.body.append(spot);
const cv=$('cc-tv-canvas'),ctx=cv.getContext('2d');

// ------------------------------------------------------------------ voice
const voice=new Audio();voice.preload='auto';
let voiceOn=true;try{voiceOn=localStorage.getItem('catcity_voice')!=='off'}catch(e){}
function syncVoiceBtn(){$('cc-tv-voice').textContent=voiceOn?'🔊 Voice on':'🔇 Voice off'}
syncVoiceBtn();
$('cc-tv-voice').onclick=()=>{voiceOn=!voiceOn;try{localStorage.setItem('catcity_voice',voiceOn?'on':'off')}catch(e){}if(!voiceOn)voice.pause();syncVoiceBtn()};
// Lines are never cut off: the next step waits until the current line has
// finished (see afterVoice). voiceEndAt marks when the latest line ended.
let voiceEndAt=0;
voice.addEventListener('ended',()=>{voiceEndAt=performance.now()});
voice.addEventListener('error',()=>{voiceEndAt=performance.now()});
function speaking(){return voiceOn&&!!voice.src&&!voice.paused&&!voice.ended}
function speak(code){voiceEndAt=0;if(!voiceOn||!code){voiceEndAt=performance.now();return}try{voice.src='/voice/'+code+'.m4a';voice.currentTime=0;const p=voice.play();if(p&&p.catch)p.catch(()=>{voiceEndAt=performance.now()})}catch(e){voiceEndAt=performance.now()}}
function afterVoice(cb,min=0){
 const started=performance.now();
 const tick=()=>{if(!active)return;if(speaking()&&performance.now()-started<15000){setTimeout(tick,120);return}setTimeout(cb,Math.max(250,min-(performance.now()-started)))};
 tick();
}

// ------------------------------------------------------------------ world
const P={x:2.5*T,y:15*T};
const O={
 sign:{x:7*T,y:14*T},biscuit:{x:10*T,y:11*T},pebble:{x:3.5*T,y:10.5*T},sword:{x:13*T,y:14.6*T},
 tree:{x:17*T,y:8.6*T},rock:{x:21*T,y:8.8*T},chest:{x:23.5*T,y:13.4*T},table:{x:18*T,y:15.6*T},
 shop:{x:4*T,y:2.6*T,w:6.5*T,h:5*T},shopDoor:{x:7.25*T,y:7.9*T},board:{x:14*T,y:4.6*T},
 forge:{x:25*T,y:5.6*T},anvil:{x:26.6*T,y:5.8*T},gate:{x:29.4*T,y:10*T}
};
const sword={id:'tutorial:wooden-paw-blade',name:'Training Paw Blade',type:'weapon',rarity:'common',color:'#ffe1a2',durability:90,maxDurability:90};
const armour={id:'tutorial:cloth-armour',name:'Training Cloth Armour',type:'body',rarity:'uncommon',color:'#95f4b8',durability:105,maxDurability:105};
let x=P.x,y=P.y,facing=1,pose='idle',stepDist=0,moving=false,sprinting=false,sprintTime=0;
let treeHits=0,rockHits=0,swordTaken=false,chestOpen=false,treeDown=false,rockDown=false;
const solids=[[O.shop.x,O.shop.y,O.shop.w,O.shop.h-14],[O.tree.x-10,O.tree.y-14,20,14],[O.rock.x-18,O.rock.y-16,36,16],[O.chest.x-16,O.chest.y-18,32,18],[O.table.x-22,O.table.y-16,44,16],[O.board.x-26,O.board.y-10,52,10],[O.anvil.x-14,O.anvil.y-12,28,12]];
function blocked(nx,ny){
 const inGate=ny>9*T&&ny<11*T;
 if(nx<T*.9||ny<T*1.6||ny>WH-T*.7||(nx>WW-T*.9&&!inGate))return true;
 if(nx>WW-4)return true;
 for(const [rx,ry,rw,rh] of solids)if(nx>rx-8&&nx<rx+rw+8&&ny>ry&&ny<ry+rh+4)return true;
 for(const n of [O.biscuit,O.pebble,O.forge])if(Math.hypot(nx-n.x,ny-n.y)<16)return true;
 return false;
}
function near(o,r=50){return Math.hypot(x-o.x,y-o.y)<r}

// ------------------------------------------------------------------ steps
const STEPS=[
 {voice:'t01',title:'Welcome',line:"Hello, and welcome to Cat City! I'm going to show you how everything works. Don't worry, it only takes a few minutes.",auto:true},
 {voice:'t02',title:'Walk to the signpost',line:'First, let’s get moving. Use the joystick, or the arrow keys, and walk over to the signpost.',target:'sign',reach:true},
 {voice:'t03',title:'Talk to Biscuit',line:'Lovely! See Biscuit over there? Walk up to Biscuit and tap the paw button to say hello.',target:'biscuit',act:'talkBiscuit'},
 {voice:'t04',title:'Pick up the sword',line:'Every adventurer needs a sword. There’s one glowing on the grass. Go and pick it up.',target:'sword',act:'takeSword'},
 {voice:'t05',title:'Open your backpack',line:'Brilliant! Now open your backpack to see your new sword.',ui:'bag'},
 {voice:'t06',title:'Equip the sword',line:'Tap the sword, then tap Equip so your cat can hold it.',ui:'equip'},
 {voice:'t07',title:'Chop the tree',line:'Looking good! Now walk up to the big tree and hit it three times to collect some wood.',target:'tree',act:'chop'},
 {voice:'t08',title:'Mine the rock',line:'Great chopping! Next, find the blue rock and hit it three times to get some stone.',target:'rock',act:'mine'},
 {voice:'t09',title:'Open the treasure chest',line:'Ooh, a treasure chest! Walk over and open it. I wonder what’s inside…',target:'chest',act:'openChest'},
 {voice:'t10',title:'Make arrows',line:'Now let’s make something. Go to the crafting table and make some arrows with your wood and stone.',target:'table',act:'craftTable',ui:'craft'},
 {voice:'t11',title:'Marmalade’s shop',line:'Time to go shopping! Walk through the door of Marmalade’s shop and buy a fish snack.',target:'shopDoor',act:'enterShop',ui:'shop'},
 {voice:'t12',title:'Say hello to Forge',line:'Well done! Now say hello to Forge. Forge can make you amazing armour later on.',target:'forge',act:'talkForge'},
 {voice:'t13',title:'Read the quest board',line:'See the quest board? Walk up to it and read your very first quest.',target:'board',act:'readBoard'},
 {voice:'t14',title:'Sprint to the gate',line:'Nearly finished! Hold the Sprint button and race over to the big gate.',ui:'sprint',target:'gate',sprint:true},
 {voice:'t15',title:'Into Cat City',line:'This is it! Walk through the gate, and Cat City is all yours.',target:'gate',exit:true}
];
const CHEERS=['Well done!','Purr-fect!','Amazing, you’re a natural!'];
let active=false,stage=0,stepStarted=0,waiting=false,raf=0,last=0,hintShown=0,sub='';
function setLine(text,code){$('cc-tv-line').textContent=text;sub=text}
function startStep(i){
 stage=i;s.tutorialStep=i;core.persist();waiting=false;stepStarted=performance.now();hintShown=0;sprintTime=0;
 const st=STEPS[i];
 $('cc-tv-stage').textContent='STEP '+(i+1)+' OF '+STEPS.length+' · '+st.title.toUpperCase();
 $('cc-tv-meter').firstElementChild.style.width=((i+1)/(STEPS.length+1)*100)+'%';
 setLine(st.line);speak(st.voice);
 if(st.ui==='shop'&&(s.fish||0)<10){s.fish=10;core.persist();core.note('🐟 Biscuit slipped you 10 fish coins for the shop!')}
 if(st.auto){setTimeout(()=>afterVoice(()=>{if(active&&stage===i)done()},600),400)}
 ghost.on=false;
}
function done(){
 if(waiting)return;waiting=true;spotOff();
 const c=$('cc-tv-cheer');if(stage>0){c.textContent=CHEERS[stage%3];c.classList.add('show');setTimeout(()=>c.classList.remove('show'),900)}
 if(stage>=STEPS.length-1){finish();return}
 afterVoice(()=>{if(active)startStep(stage+1)},1000);
}
function cheerText(t){const c=$('cc-tv-cheer');c.textContent=t;c.classList.add('show');setTimeout(()=>c.classList.remove('show'),700)}
function registerItem(item){s.adventureItems=Array.isArray(s.adventureItems)?s.adventureItems:[];if(!s.adventureItems.some(it=>it.id===item.id)){s.adventureItems.push({...item});window.catCityInventoryItemAdded?.(s.adventureItems.at(-1))}core.persist()}
function emit(type,item){window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type,item,tutorial:true}}))}
function talk(name,text,after,button){const box=$('cc-tv-talk');$('cc-tv-talk-text').innerHTML='';const b=document.createElement('b');b.textContent=name+': ';$('cc-tv-talk-text').append(b,text);$('cc-tv-talk-ok').textContent=button||'OK 🐾';box.style.display='block';talking=after}
let talking=null;
$('cc-tv-talk-ok').onclick=()=>closeTalk();
function closeTalk(){if(!talking)return;$('cc-tv-talk').style.display='none';const f=talking;talking=null;f()}
const ACTS={
 talkBiscuit(){talk('Biscuit','Welcome, little adventurer! Finish your training and the whole of Cat City is yours to explore. 🐾',done)},
 talkForge(){talk('Forge','Bring me steel from woodland chests and I’ll forge you mighty armour. Come and see me in Cat City!',done)},
 takeSword(){swordTaken=true;registerItem(sword);emit('pickup',sword);done()},
 chop(){treeHits++;emit('strike');cheerText(treeHits<3?'🪓 '+treeHits+' / 3':'🪵 +3 wood!');if(treeHits>=3){treeDown=true;s.materials=s.materials||{};s.materials.wood=(s.materials.wood||0)+3;core.persist();emit('chop');done()}},
 mine(){rockHits++;emit('strike');cheerText(rockHits<3?'⛏️ '+rockHits+' / 3':'🪨 +3 stone!');if(rockHits>=3){rockDown=true;s.materials=s.materials||{};s.materials.stone=(s.materials.stone||0)+3;core.persist();emit('mine');done()}},
 openChest(){chestOpen=true;registerItem(armour);emit('chest',armour);cheerText('🎁 Training Cloth Armour!');done()},
 craftTable(){if(!(s.materials?.wood>0&&s.materials?.stone>0)){s.materials=s.materials||{};s.materials.wood=Math.max(1,s.materials.wood||0);s.materials.stone=Math.max(1,s.materials.stone||0)}window.catCityInventoryOpen?.();const openCraft=()=>{const d=document.querySelector('#cc-ti-craft details');if(d)d.open=true};setTimeout(openCraft,60);setTimeout(openCraft,300)},
 enterShop(){if(window.catCityInteriors){root.classList.add('away');window.catCityInteriors.enter('shop')}else{tutorialShop()}},
 readBoard(){talk('📜 Quest board','Quest 1 · First Fish — collect 3 magical fish around Cat City. Quests are optional: you can explore freely too!',done)}
};
// Marmalade's counter during the tutorial: same purchase as the real shop
// (10 fish coins → Fish Snack), shown inside the tutorial so nothing hides it.
function tutorialShop(){
 if(window.catCityInteriors?.inside)window.catCityInteriors.leave(true);
 root.classList.remove('away');
 talk('Marmalade','Welcome, sweet whiskers! A crunchy fish snack is just 10 fish coins.',()=>{
  s.owned=Array.isArray(s.owned)?s.owned:[];
  if(!s.owned.includes('Fish Snack')){s.fish=Math.max(0,(s.fish||0)-10);s.owned.push('Fish Snack');core.renderShop?.()}
  core.persist();cheerText('🐟 Fish Snack bought!');done();
 },'🐟 Buy Fish Snack · 10 🐟');
}
window.catCityTutorialShop=tutorialShop;
function act(){
 if(!active)return;
 if(talking){closeTalk();return}
 const st=STEPS[stage];if(!st||waiting)return;
 if(st.act&&st.target){const o=O[st.target];if(near(o,st.target==='shopDoor'?40:56)){ACTS[st.act]();return}setLine('Ooh, you’re a bit too far away. Walk a little closer.');setTimeout(()=>{if(active&&STEPS[stage]===st)setLine(st.line)},2200);return}
 if(st.ui==='bag'){openBag();return}
}
function openBag(){window.catCityInventoryOpen?.()}
// Act on click (finger lifted), so a tap that opens the backpack can't also
// land on the backpack's background and close it again.
$('cc-tv-act').addEventListener('click',e=>{e.preventDefault();act()});
$('cc-tv-bag').addEventListener('click',()=>openBag());
$('cc-tv-leave').onclick=()=>stop();
// Inventory / crafting / equip events from the real backpack.
window.addEventListener('catcity:adventure-action',e=>{
 if(!active||waiting)return;const st=STEPS[stage],d=e.detail||{};
 if(st.ui==='bag'&&d.type==='inventory')done();
 if(st.ui==='equip'&&d.type==='equip'&&d.item?.id===sword.id){done();setTimeout(()=>$('cc-ti-close')?.click(),600)}
 if(st.ui==='craft'&&d.type==='craft'){done();setTimeout(()=>$('cc-ti-close')?.click(),600)}
});
// Back from the shop interior / shop menu.
window.addEventListener('catcity:interior',e=>{if(!active)return;if(!e.detail?.inside)root.classList.remove('away')});

// ------------------------------------------------------------------ controls
const keys=new Set();
const KEY={w:'up',a:'left',s:'down',d:'right',arrowup:'up',arrowleft:'left',arrowdown:'down',arrowright:'right'};
let joy={x:0,y:0},padId=null;
const pad=$('cc-tv-pad'),knob=pad.firstElementChild;
pad.addEventListener('pointerdown',e=>{padId=e.pointerId;pad.setPointerCapture?.(e.pointerId);movePad(e)});
pad.addEventListener('pointermove',e=>{if(e.pointerId===padId)movePad(e)});
for(const t of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(t,e=>{if(e.pointerId===padId){padId=null;joy={x:0,y:0};knob.style.left='35px';knob.style.top='35px'}});
function movePad(e){const r=pad.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=Math.min(1,Math.hypot(dx,dy)/45),a=Math.atan2(dy,dx);joy={x:Math.cos(a)*m,y:Math.sin(a)*m};knob.style.left=(35+joy.x*35)+'px';knob.style.top=(35+joy.y*35)+'px'}
const sprintBtn=$('cc-tv-sprint');let sprintHeld=false;
sprintBtn.addEventListener('pointerdown',e=>{e.preventDefault();sprintHeld=true;sprintBtn.classList.add('on');sprintBtn.setPointerCapture?.(e.pointerId)});
for(const t of ['pointerup','pointercancel','lostpointercapture'])sprintBtn.addEventListener(t,()=>{sprintHeld=false;sprintBtn.classList.remove('on')});
window.addEventListener('keydown',e=>{
 if(!active||root.classList.contains('away'))return;
 if($('cc-terraria-inventory')?.classList.contains('open'))return;
 if(e.target?.closest?.('input,textarea,select,[contenteditable]'))return;
 const k=String(e.key||'').toLowerCase();
 if(KEY[k]){e.preventDefault();e.stopImmediatePropagation();keys.add(KEY[k]);return}
 if(k==='shift'){e.stopImmediatePropagation();sprintHeld=true;sprintBtn.classList.add('on');return}
 if(k==='e'||k===' '||k==='enter'){e.preventDefault();e.stopImmediatePropagation();act();return}
 if(k==='b'||k==='i'){e.preventDefault();e.stopImmediatePropagation();openBag();return}
 if(k==='escape'){e.preventDefault();e.stopImmediatePropagation();if(talking)closeTalk();else stop()}
},true);
window.addEventListener('keyup',e=>{if(!active)return;const k=String(e.key||'').toLowerCase();keys.delete(KEY[k]);if(k==='shift'){sprintHeld=false;sprintBtn.classList.remove('on')}},true);

// ------------------------------------------------------------------ spotlight
let spotEl=null,spotWorld=null;
function spotOn(el){spotEl=el;spotWorld=null}
function spotAt(world){spotWorld=world;spotEl=null}
function spotOff(){spotEl=null;spotWorld=null;spot.classList.remove('on')}
function placeSpot(r,pad=8){spot.style.left=(r.left-pad)+'px';spot.style.top=(r.top-pad)+'px';spot.style.width=(r.width+pad*2)+'px';spot.style.height=(r.height+pad*2)+'px';spot.classList.add('on')}
const touch=matchMedia('(pointer:coarse)').matches;
function chooseSpot(){
 if(!active||waiting){if(!talking)spot.classList.remove('on');return}
 if(talking){const b=$('cc-tv-talk-ok');if(b)placeSpot(b.getBoundingClientRect());return}
 const st=STEPS[stage];if(!st||st.auto||performance.now()-stepStarted<900){spot.classList.remove('on');return}
 const inv=$('cc-terraria-inventory')?.classList.contains('open');
 if(st.ui==='equip'){
  if(!inv){placeSpot($('cc-tv-bag').getBoundingClientRect());return}
  const eq=[...document.querySelectorAll('#cc-ti-actions button')].find(b=>/equip/i.test(b.textContent)&&b.offsetParent);
  const slot=document.querySelector('#cc-ti-grid button[aria-label*="Training Paw Blade"]');
  const el=eq||slot;if(el){placeSpot(el.getBoundingClientRect(),5);return}
 }
 if(st.ui==='bag'&&!inv){placeSpot($('cc-tv-bag').getBoundingClientRect());return}
 if(st.ui==='craft'&&inv){const b=$('cc-ti-craft-arrows');if(b&&b.offsetParent){placeSpot(b.getBoundingClientRect(),5);return}const sm=document.querySelector('#cc-ti-craft summary');if(sm){placeSpot(sm.getBoundingClientRect(),5);return}}
 if(root.classList.contains('away')){const u=$('cc-int-act');if(st.ui==='shop'&&window.catCityInteriors?.inside&&u){placeSpot(u.getBoundingClientRect(),5);return}spot.classList.remove('on');return}
 if(st.ui==='sprint'&&!sprintHeld&&touch){placeSpot(sprintBtn.getBoundingClientRect());return}
 if(st.target){
  const o=O[st.target],close=st.act&&near(o,st.target==='shopDoor'?40:56);
  if(close&&touch){placeSpot($('cc-tv-act').getBoundingClientRect());return}
  const sc=toScreen(o),size=st.target==='tree'?[110,150,-120]:st.target==='gate'?[90,130,-90]:st.target==='shopDoor'?[70,80,-60]:[80,90,-60];
  const r=cv.getBoundingClientRect();placeSpot({left:r.left+sc.x-size[0]/2,top:r.top+sc.y+size[2],width:size[0],height:size[1]},0);return
 }
 spot.classList.remove('on');
}
let cam={x:0,y:0};
// Ghost guide: if you still haven't reached the place a few seconds after the
// line, a see-through ghost of your cat floats there, waves, and repeats.
const ghost={on:false,x:0,y:0,phase:'walk',t:0,step:0,facing:1,pose:'walk'};
function ghostTarget(st){if(!st?.target)return null;const o=O[st.target];return {x:o.x+(st.target==='gate'?-20:-26),y:o.y+(st.target==='board'||st.target==='tree'||st.target==='shopDoor'?14:6)}}
function updateGhost(dt){
 const st=STEPS[stage];
 if(!active||waiting||!st||!st.target||st.auto||talking||root.classList.contains('away')){ghost.on=false;return}
 const g=ghostTarget(st);
 if(Math.hypot(x-g.x,y-g.y)<70){ghost.on=false;return}
 const quiet=voiceEndAt?performance.now()-voiceEndAt:0;
 if(!ghost.on){if(voiceEndAt&&quiet>5000){ghost.on=true;ghost.x=x;ghost.y=y;ghost.phase='walk';ghost.t=0;ghost.step=0}return}
 ghost.t+=dt;
 if(ghost.phase==='walk'){const dx=g.x-ghost.x,dy=g.y-ghost.y,d=Math.hypot(dx,dy),sp=95*dt;
  if(d<=sp){ghost.x=g.x;ghost.y=g.y;ghost.phase='wave';ghost.t=0}else{ghost.x+=dx/d*sp;ghost.y+=dy/d*sp;ghost.step+=sp;if(Math.abs(dx)>4)ghost.facing=dx<0?-1:1;ghost.pose=Math.abs(dx)>=Math.abs(dy)*.8?'walk':(dy<0?'walkBack':'walkFront')}}
 else if(ghost.phase==='wave'&&ghost.t>1.6){ghost.phase='fade';ghost.t=0}
 else if(ghost.phase==='fade'&&ghost.t>2.2){ghost.x=x;ghost.y=y;ghost.phase='walk';ghost.t=0}
}
function drawGhost(t){
 if(!ghost.on)return;const a=art();if(!a)return;
 const alpha=ghost.phase==='fade'?Math.max(0,.7-ghost.t*.7):ghost.phase==='walk'&&ghost.t<.4?ghost.t/.4*.7:.7;
 if(alpha<=0)return;
 const id=CAT_IDS[s.cat]||'astro',float=Math.sin(t*4)*3-4;
 ctx.save();ctx.globalAlpha=alpha*.5;ctx.fillStyle='#bfe4ff';ctx.beginPath();ctx.ellipse(ghost.x,ghost.y,11,4,0,0,7);ctx.fill();
 for(let i=0;i<4;i++){const k=(t*1.6+i*.25)%1;ctx.globalAlpha=alpha*(1-k)*.8;ctx.fillStyle='#e6f4ff';ctx.fillRect(Math.round(ghost.x-ghost.facing*(8+k*22)),Math.round(ghost.y-18-k*10+Math.sin(i*2)*4),3,3)}
 ctx.globalAlpha=alpha;ctx.filter='saturate(.35) brightness(1.35)';
 if(ghost.phase==='walk')a.draw(ctx,ghost.x,ghost.y+float,id,ghost.pose,ghost.pose==='walk'?Math.floor(ghost.step/10)%4:Math.floor(ghost.step/11)%2,{scale:1.3,flip:ghost.pose==='walk'&&ghost.facing<0});
 else a.draw(ctx,ghost.x,ghost.y+float,id,'interact',0,{scale:1.3});
 ctx.filter='none';ctx.globalAlpha=Math.min(1,alpha*1.6);
 ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#1c3350';ctx.strokeText(ghost.phase==='walk'?'👻 Follow me!':'👻 Over here!',ghost.x,ghost.y-52+float);ctx.fillStyle='#e6f4ff';ctx.fillText(ghost.phase==='walk'?'👻 Follow me!':'👻 Over here!',ghost.x,ghost.y-52+float);
 ctx.restore();
}
function toScreen(o){return {x:o.x-cam.x,y:o.y-cam.y}}

// ------------------------------------------------------------------ drawing
const R=(px,py,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(px),Math.round(py),Math.round(w),Math.round(h))};
const OUT='#241a2c';
function box(px,py,w,h,c,top,shadeC){R(px-2,py-2,w+4,h+4,OUT);R(px,py,w,h,c);if(top)R(px,py,w,4,top);if(shadeC)R(px,py+h-4,w,4,shadeC)}
function hash(i){const v=Math.sin(i*91.7+13.1)*43758.5;return v-Math.floor(v)}
function drawGround(){
 for(let ty=0;ty<20;ty++)for(let tx=0;tx<30;tx++){const px=tx*T,py=ty*T;if(px-cam.x>cv.width||px+T-cam.x<0||py-cam.y>cv.height||py+T-cam.y<0)continue;
  R(px,py,T,T,(tx+ty)%2?'#9fd38c':'#a8da93');if(hash(tx*7+ty*13)>.7)R(px+8+hash(tx)*12,py+10+hash(ty)*10,3,2,'#c6efae');if(hash(tx*3+ty*5)>.93)R(px+12,py+12,4,4,hash(tx+ty)>.5?'#ffd5e8':'#fff3b0')}
 const path=(x0,y0,x1,y1)=>{R(x0-4,y0-4,x1-x0+8,y1-y0+8,'#dcc39f');R(x0,y0,x1-x0,y1-y0,'#f1e0bf');for(let i=0;i<(x1-x0)*(y1-y0)/900;i++)R(x0+hash(i+x0)*(x1-x0),y0+hash(i+y0)*(y1-y0),6,3,'#e0c9a3')};
 path(T,14.2*T,WW,15.8*T);path(6.4*T,8*T,8*T,15*T);path(8*T,9.2*T,WW,10.8*T);path(13.2*T,5*T,14.8*T,9.5*T);path(24.2*T,6*T,25.8*T,9.5*T);
}
function drawFence(){
 for(let px=0;px<WW;px+=T){R(px,T*.9,T,5,'#8a5d3b');R(px,T*1.3,T,5,'#8a5d3b');R(px+12,T*.4,8,T*1.2,'#a8744a')}
 for(let px=0;px<WW;px+=T){R(px,WH-T*.5,T,5,'#8a5d3b');R(px+12,WH-T*.9,8,T*.9,'#a8744a')}
 for(let py=T;py<WH;py+=T){R(6,py,5,T,'#8a5d3b');R(2,py+10,12,10,'#a8744a');if(py<9*T||py>11*T){R(WW-11,py,5,T,'#8a5d3b');R(WW-14,py+10,12,10,'#a8744a')}}
}
function drawGate(t){const gx=O.gate.x,gy=O.gate.y;box(gx-6,gy-3.2*T,12,3.4*T+T,'#8a5d3b','#a8744a');box(gx-6,gy+1.1*T,12,1.2*T,'#8a5d3b');box(gx-34,gy-3.4*T,68,22,'#c9963a','#e8bb5c','#9c7027');ctx.fillStyle='#3a2a14';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText('CAT CITY →',gx,gy-3.4*T+15);for(let i=0;i<4;i++)R(gx-1+Math.sin(t*3+i)*12,gy-2.6*T+i*14,3,3,'#fff3b0')}
function drawShop(){
 const {x:sx,y:sy,w,h}=O.shop;
 box(sx+6,sy+40,w-12,h-40,'#f7e1c8','#ffffff40','#d9bc9c');
 for(let i=0;i<7;i++){const inset=Math.max(0,24-i*4);R(sx+inset,sy+10+i*6,w-inset*2,6,i%2?'#d9607e':'#e8789a')}R(sx,sy+46,w,6,'#b84a68');
 for(let i=0;i<6;i++)R(sx+14+i*((w-28)/6),sy+54,(w-28)/6-2,10,i%2?'#fff3e8':'#e8789a');
 box(O.shopDoor.x-14,sy+h-46,28,44,'#8a5d3b','#a8744a');R(O.shopDoor.x+6,sy+h-26,4,4,'#ffd45c');
 for(const wx of [sx+24,sx+w-58]){box(wx,sy+80,34,28,'#7d5a42');R(wx+3,sy+83,28,22,'#ffe38a');R(wx+16,sy+83,2,22,'#7d5a42')}
 box(sx+w/2-46,sy+18,92,20,'#fff3e8','#ffffff','#d9bc9c');ctx.fillStyle='#8c3a5a';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText('MARMALADE’S SHOP',sx+w/2,sy+32);
}
function drawSign(){const {x:sx,y:sy}=O.sign;R(sx-2,sy-30,5,30,'#8a5d3b');box(sx-24,sy-46,48,22,'#c99a6a','#e8c49a','#8a6240');ctx.fillStyle='#3a2a14';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillText('TRAINING',sx,sy-37);ctx.fillText('VILLAGE',sx,sy-28)}
function drawRock(){const {x:rx,y:ry}=O.rock;if(rockDown){box(rx-16,ry-6,32,6,'#6f7d8f');return}box(rx-20,ry-26,40,26,'#607ea2','#90c6e1','#4a6488');R(rx-12,ry-22,10,8,'#c2e8ff');R(rx+6,ry-12,6,6,'#9fd6f4')}
function drawChest(){const {x:cx,y:cy}=O.chest;box(cx-16,cy-18,32,18,chestOpen?'#8f7650':'#ca9051','#e0a868','#9c6a3a');box(cx-16,cy-26,32,9,'#a6693d','#c08756');R(cx-3,cy-20,6,10,'#ffd45c');if(!chestOpen)R(cx-1,cy-17,2,3,'#7a5233')}
function drawTable(){const {x:tx,y:ty}=O.table;box(tx-22,ty-16,44,12,'#a36f45','#c08756','#7f5332');R(tx-18,ty-4,5,8,'#6f472b');R(tx+13,ty-4,5,8,'#6f472b');R(tx-14,ty-22,10,6,'#c2cad6');R(tx-10,ty-26,2,6,'#8a5d3b');R(tx+4,ty-21,12,5,'#d9a877');R(tx+6,ty-24,8,3,'#8f8f9a')}
function drawBoard(){const {x:bx,y:by}=O.board;R(bx-22,by-6,5,10,'#6b4428');R(bx+17,by-6,5,10,'#6b4428');box(bx-26,by-44,52,38,'#8c5d36','#a8744a','#6b4428');R(bx-22,by-40,44,30,'#d9b98a');for(const [a,b,c] of [[-19,-37,'#fff6e0'],[-5,-38,'#fde2ef'],[8,-36,'#e3f4ff'],[-13,-24,'#fffbe0']]){R(bx+a,by+b,11,10,c);R(bx+a+5,by+b-1,2,2,'#c94c5a')}}
function drawAnvil(){const {x:ax,y:ay}=O.anvil;box(ax-14,ay-14,28,8,'#5b5f6b','#7a7f8c');R(ax-6,ay-6,12,6,'#4a4e58');box(ax-10,ay,20,5,'#4a4e58')}
function drawSword(t){if(swordTaken)return;const img=items()?.icon(sword);const bob=Math.sin(t*4)*3;ctx.save();ctx.globalAlpha=.35+.25*Math.sin(t*5);ctx.fillStyle='#fff6b0';ctx.beginPath();ctx.ellipse(O.sword.x,O.sword.y,18,6,0,0,7);ctx.fill();ctx.restore();if(img){ctx.drawImage(img,O.sword.x-16,O.sword.y-34+bob,32,32)}else{ctx.font='26px system-ui';ctx.fillText('⚔️',O.sword.x,O.sword.y-10)}}
function drawCatAt(id,cx,cy,p='idle',f=0,flip=false){const a=art();if(a)a.draw(ctx,cx,cy,id,p,f,{scale:1.3,flip});else{R(cx-10,cy-24,20,24,'#e99d53')}}
function label(t,lx,ly){ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#241832';ctx.strokeText(t,lx,ly);ctx.fillStyle='#fff8de';ctx.fillText(t,lx,ly)}
function drawArrow(o,t){const st=STEPS[stage];if(!st||waiting||!st.target)return;const bob=Math.sin(t*6)*4,ax=o.x,ay=o.y-(st.target==='tree'?140:st.target==='gate'?120:st.target==='shopDoor'?70:62)+bob;R(ax-7,ay,14,4,'#ffe38a');R(ax-5,ay+4,10,4,'#ffe38a');R(ax-3,ay+8,6,4,'#ffe38a');R(ax-1,ay+12,2,3,'#ffe38a');R(ax-8,ay-2,16,2,OUT)}
const CAT_IDS=['astro','galaxy','baby','harley','skylar','pumpkin'];
function render(t){
 const w=cv.clientWidth,h=cv.clientHeight;if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
 ctx.imageSmoothingEnabled=false;
 cam.x=Math.max(0,Math.min(WW-w,x-w/2));cam.y=Math.max(0,Math.min(WH-h,y-h*.55));
 if(WW<w)cam.x=(WW-w)/2;if(WH<h)cam.y=(WH-h)/2;
 R(0,0,w,h,'#7aa86f');
 ctx.save();ctx.translate(-Math.round(cam.x),-Math.round(cam.y));
 drawGround();drawFence();
 const ents=[];
 ents.push({y:O.shop.y+O.shop.h,d:drawShop},{y:O.sign.y,d:drawSign},{y:O.rock.y,d:drawRock},{y:O.chest.y,d:drawChest},{y:O.table.y,d:drawTable},{y:O.board.y,d:drawBoard},{y:O.anvil.y,d:drawAnvil},{y:O.gate.y+1.2*T,d:()=>drawGate(t)},{y:O.sword.y,d:()=>drawSword(t)});
 ents.push({y:O.tree.y,d:()=>{const n=nature();if(n){if(treeDown)n.drawTree(ctx,O.tree.x,O.tree.y,'oak','stump');else n.drawTree(ctx,O.tree.x+(treeHits&&!waiting?Math.sin(t*50)*2:0),O.tree.y,'oak','mature')}}});
 for(const [id,o,nm] of [['biscuit',O.biscuit,'Biscuit'],['pebble',O.pebble,'Pebble'],['forge',O.forge,'Forge']])ents.push({y:o.y,d:()=>{drawCatAt(id,o.x,o.y,'idle',(t+o.x)%3.6<.14?1:0);label(nm,o.x,o.y-48)}});
 const id=CAT_IDS[s.cat]||'astro';
 ents.push({y:y,d:()=>{ctx.fillStyle='#00000030';ctx.beginPath();ctx.ellipse(x,y,12,4,0,0,7);ctx.fill();
  const weapon=s.adventureEquipment?.weapon===sword.id?sword:null;
  const a=art();if(a){const pp=moving?pose:'idle',fr=moving?(pose==='walk'||pose==='run'?Math.floor(stepDist/(pose==='run'?16:10))%4:Math.floor(stepDist/11)%2):((t%3.6)<.14?1:0);a.draw(ctx,x,y,id,pp,fr,{scale:1.3,flip:moving&&(pose==='walk'||pose==='run')&&facing<0,weapon})}
  label('YOU',x,y-48)}});
 ents.push({y:ghost.y,d:()=>drawGhost(t)});
 ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());
 const st=STEPS[stage];if(st&&st.target)drawArrow(O[st.target],t);
 ctx.restore();
}
function loop(ts){
 if(!active)return;
 const dt=Math.min(.05,Math.max(.004,(ts-last)/1000));last=ts;const t=ts/1000;
 if(!root.classList.contains('away')&&!talking&&!$('cc-terraria-inventory')?.classList.contains('open')){
  let dx=(keys.has('right')?1:0)-(keys.has('left')?1:0)+joy.x,dy=(keys.has('down')?1:0)-(keys.has('up')?1:0)+joy.y;
  const m=Math.hypot(dx,dy);moving=m>.15;
  if(moving){dx/=Math.max(1,m);dy/=Math.max(1,m);sprinting=sprintHeld;const sp=(sprinting?230:125)*dt;
   const nx=x+dx*sp,ny=y+dy*sp;if(!blocked(nx,y))x=nx;if(!blocked(x,ny))y=ny;stepDist+=sp;
   if(Math.abs(dx)>.2)facing=dx<0?-1:1;pose=Math.abs(dx)>=Math.abs(dy)*.8?(sprinting?'run':'walk'):(dy<0?'walkBack':'walkFront');
   if(sprinting)sprintTime+=dt;}
 }else moving=false;
 const st=STEPS[stage];
 if(st&&!waiting){
  if(st.reach&&near(O[st.target],46))done();
  if(st.sprint&&x>O.gate.x-3*T&&Math.abs(y-O.gate.y)<2.5*T){if(sprintTime>.6)done();else if(!hintShown){hintShown=1;setLine('Keep holding Sprint all the way to the gate!')}}
  if(st.exit&&performance.now()-stepStarted>2600&&x>WW-T*1.6&&Math.abs(y-O.gate.y)<T)done();
  if(!st.auto&&performance.now()-stepStarted>20000&&hintShown<2){hintShown=2;setLine((Math.random()<.5?'Need a hand? Look for the glowing arrow, it shows you where to go.':'Take your time. Follow the arrow and you’ll find it.')+' '+st.line)}
 }
 updateGhost(dt);render(t);chooseSpot();
 raf=requestAnimationFrame(loop);
}
// Left the shop room without buying: come back to the village.
setInterval(()=>{if(active&&root.classList.contains('away')&&!window.catCityInteriors?.inside)root.classList.remove('away')},400);

// ------------------------------------------------------------------ start / stop
function begin(force=false){
 if(active)return;if(!force&&s.tutorialCompleted)return;
 const from=force?0:Math.max(0,Math.min(STEPS.length-1,Number(s.tutorialStep)||0));
 x=P.x;y=P.y;facing=1;treeHits=0;rockHits=0;
 swordTaken=from>3||(s.adventureItems||[]).some(it=>it.id===sword.id)&&from>3;treeDown=from>6;rockDown=from>7;chestOpen=from>8;
 active=true;root.classList.add('open');root.classList.remove('away');document.body.classList.add('cc-tutorial-play');
 last=performance.now();raf=requestAnimationFrame(loop);
 if(force&&s.tutorialCompleted){setLine('Welcome back! Let’s run through it again.')}
 startStep(from);
}
function finish(){
 afterVoice(finishNow,300);
}
function finishNow(){
 speak('t16');setLine('You did it! You’re a real Cat City adventurer now. Have fun, and I’ll see you around!');
 const c=$('cc-tv-cheer');c.textContent='🏆 Training complete!';c.classList.add('show');
 s.tutorialCompleted=true;s.tutorialStep=STEPS.length;core.persist();
 setTimeout(()=>{c.classList.remove('show');close();core.note('🏆 Training complete! You can now explore and join multiplayer.');$('start-play')?.click()},2600);
 // (the voice element keeps playing after the village closes, so t16 is never cut)
}
function close(){active=false;spotOff();root.classList.remove('open','away');document.body.classList.remove('cc-tutorial-play');keys.clear();joy={x:0,y:0};sprintHeld=false;cancelAnimationFrame(raf);$('cc-tv-talk').style.display='none';talking=null}
function stop(){if(!active)return;s.tutorialStep=stage;core.persist();voice.pause();close()}
const play=$('start-play');
play?.addEventListener('click',e=>{if(active||s.tutorialCompleted)return;e.preventDefault();e.stopImmediatePropagation();begin()},true);
document.addEventListener('click',e=>{if(s.tutorialCompleted)return;if(e.target?.closest?.('#online-create,#online-join,#online-tab-public,.online-menu-btn,#catcity-online-open')){e.preventDefault();e.stopImmediatePropagation();begin()}},true);
const title=$('catcity-start-menu')?.querySelector('.title-card');
if(title){const b=document.createElement('button');b.id='cc-title-tutorial';b.textContent='🏫 Practice Tutorial';b.style.cssText='font-size:13px;padding:9px;margin:3px;';b.onclick=()=>begin(true);title.append(b)}
const pause=$('pause-panel')?.querySelector('.cc-list');
if(pause){const b=document.createElement('button');b.textContent='🏫 Replay Interactive Tutorial';b.onclick=()=>{$('pause-panel')?.classList.remove('show');begin(true)};pause.append(b)}
// Test/debug helper: stand next to the current step's target.
function standNear(){const st=STEPS[stage];if(!st?.target)return false;const o=O[st.target];x=o.x-(st.target==='gate'?2.5*T:0);y=o.y+(st.target==='shopDoor'?18:st.target==='board'||st.target==='tree'?12:22);if(st.target==='sword'||st.target==='sign'||st.target==='biscuit'||st.target==='forge'){x=o.x-30;y=o.y+4}return true}
window.catCityTutorial={get ghost(){return ghost.on},start:begin,stop,get active(){return active},get step(){return stage},get waiting(){return waiting},tasks:STEPS.length,standNear,act,steps:STEPS.map(s2=>s2.title),get position(){return {x,y}}};
})();

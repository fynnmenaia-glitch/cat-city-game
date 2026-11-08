/* Cat City — playtest wishlist (5 Nov 2026).
 *
 * 1. Hearts in the open world: always shown in the HUD. Wranglers and
 *    infected kitties now hurt (catCityHurt), hearts come back slowly, and at
 *    0 you're knocked out and wake up at home (fires `catcity:knockout`).
 * 2. Clearer "press E" prompts: whatever "E / 🐾 · …" label the game draws,
 *    a big prompt chip shows it at the bottom of the screen and the 🐾 button
 *    glows.
 * 3. Art style setting: Pixel art (default) or Classic smooth (the older,
 *    non-pixel cats and smooth scaling).
 * 4. 📘 How to play: a short illustrated guide (moving, using things,
 *    attacking, bosses, hearts, the story and missions). Opens once for new
 *    players and from Settings / Pause any time.
 * 5. Farming: a village garden with six plots. Plant carrots, catnip or
 *    pumpkins, water them to grow faster, then harvest.
 * 6. Side quests from Marmalade, Pebble, Luna, Forge and SlayCat with
 *    rewards (❕ above them when they have a job for you).
 */
(()=>{'use strict';
const core=window.__catCityEngine,art=window.catCityCatArt;if(!core)return;
const s=core.state,T=core.T,$=id=>document.getElementById(id),HOME={x:17*T,y:18*T};
const coarse=()=>matchMedia('(pointer:coarse)').matches;
const inCave=()=>!!window.catCityCaveState?.().inside;
const busy=()=>core.bossMode||document.getElementById('cc-upd')?.classList.contains('open')||document.body.classList.contains('in-interior')||document.body.classList.contains('cc-in-castle')||document.body.classList.contains('start-menu-open')||$('catcity-start-menu')?.classList.contains('show');
const css=document.createElement('style');css.id='cc-playtest-style';css.textContent=[
 '#cc-prompt{position:fixed;left:50%;bottom:calc(48px + env(safe-area-inset-bottom));min-width:240px;text-align:center;box-sizing:border-box;transform:translateX(-50%);z-index:60;display:none;padding:8px 14px;border-radius:14px;border:3px solid #ffd45c;background:#241a2ce8;color:#fff6e4;font:bold 15px system-ui;box-shadow:0 0 18px #ffd45c88;pointer-events:none;white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis}',
 
 '@media(pointer:coarse){#cc-prompt{bottom:calc(282px + env(safe-area-inset-bottom));font-size:14px}}',
 '#cc-prompt.show{display:block;animation:ccPromptIn .18s ease-out}@keyframes ccPromptIn{from{transform:translate(-50%,8px);opacity:0}}',
 '#interact.cc-pulse{box-shadow:0 0 0 4px #ffd45c,0 0 22px #ffd45c!important;animation:ccPulse 1s ease-in-out infinite}@keyframes ccPulse{50%{transform:scale(1.08)}}',
 '#cc-hurt{position:fixed;inset:0;z-index:55;pointer-events:none;opacity:0;transition:opacity .35s;background:radial-gradient(circle,#ff000000 45%,#ff1a3a99)}#cc-hurt.on{opacity:1;transition:none}',
 '#cc-ko{position:fixed;inset:0;z-index:9000;background:#000;opacity:0;pointer-events:none;transition:opacity .6s;display:flex;align-items:center;justify-content:center;color:#e9dcff;font:bold 22px system-ui}#cc-ko.on{opacity:1}',
 '.cc-pf-dialog{display:none;position:fixed;inset:0;z-index:7700;background:#120b1caa;align-items:center;justify-content:center;padding:12px}.cc-pf-dialog.open{display:flex}',
 '.cc-pf-dialog>div{background:#2a1d3a;color:#fff6e4;border:3px solid #ffd45c;border-radius:16px;padding:16px;max-width:400px;width:100%;font:14px system-ui;text-align:center;line-height:1.45;max-height:88dvh;overflow:auto}',
 '.cc-pf-dialog h3{margin:0 0 6px;font:900 18px system-ui;color:#ffd45c}.cc-pf-dialog .big{font-size:44px;line-height:1.2}',
 '.cc-pf-dialog button{margin:5px;min-height:44px;padding:8px 14px;border-radius:12px;border:2px solid #fff6e4;font:bold 14px system-ui;background:#ffd45c;color:#241a2c}.cc-pf-dialog button.alt{background:#dcc5f7;color:#33224a}',
 'body.cc-art-classic #game{image-rendering:auto!important}'
].join('\n');document.head.append(css);
const el=(tag,id,html)=>{const e=document.createElement(tag);if(id)e.id=id;if(html)e.innerHTML=html;document.body.append(e);return e};
const promptEl=el('div','cc-prompt'),hurtEl=el('div','cc-hurt'),koEl=el('div','cc-ko','💫 Knocked out…');
// A shared little dialog for farming, side quests and the guide.
const dlg=el('div','cc-pf-dlg','<div><div class="big" id="cc-pf-icon"></div><h3 id="cc-pf-title"></h3><div id="cc-pf-body"></div><div id="cc-pf-btns" style="margin-top:8px"></div></div>');dlg.className='cc-pf-dialog';
function dialog(icon,title,body,buttons){$('cc-pf-icon').textContent=icon;$('cc-pf-title').textContent=title;$('cc-pf-body').innerHTML=body;const box=$('cc-pf-btns');box.replaceChildren();
 for(const [label,fn,alt] of buttons){const b=document.createElement('button');b.type='button';b.textContent=label;if(alt)b.className='alt';b.onclick=()=>{dlg.classList.remove('open');fn?.()};box.append(b)}dlg.classList.add('open')}
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.classList.remove('open')});
const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);

// ================================================================== 1. HEARTS
const maxHearts=()=>6+Math.min(3,Math.floor((window.catCityArmorPoints?.()||0)/3));
s.hearts=Number.isFinite(s.hearts)?Math.max(0,Math.min(maxHearts(),s.hearts)):maxHearts();
let invUntil=0,lastHurt=0,lastRegen=Date.now(),koing=false;
window.catCityHurt=(n=1,why='')=>{
 if(busy()||koing)return;const now=Date.now();if(now<invUntil)return;invUntil=now+1200;lastHurt=now;
 s.hearts=Math.max(0,(s.hearts||0)-n);window.catCitySfx?.('hurt');hurtEl.classList.add('on');requestAnimationFrame(()=>requestAnimationFrame(()=>hurtEl.classList.remove('on')));core.persist();
 if(s.hearts<=0)knockOut(why);
};
function knockOut(why){
 koing=true;koEl.classList.add('on');
 setTimeout(()=>{s.x=HOME.x;s.y=HOME.y;s.hearts=maxHearts();core.persist();koEl.classList.remove('on');koing=false;
  core.note('💤 You were knocked out'+(why?' by '+why:'')+' and woke up safe at home. Hearts refilled!');
  window.dispatchEvent(new CustomEvent('catcity:knockout',{detail:{world:true}}))},1500);
}
window.catCityHeal=n=>{s.hearts=Math.min(maxHearts(),(s.hearts||0)+n);window.catCitySfx?.('heal');core.persist()};
setInterval(()=>{const now=Date.now(),mx=maxHearts();if(s.hearts>mx)s.hearts=mx;
 // Hearts come back on their own: faster at home.
 const home=Math.hypot(s.x-HOME.x,s.y-HOME.y)<700,gap=home?4000:12000;
 if(s.hearts<mx&&now-lastHurt>8000&&now-lastRegen>gap){lastRegen=now;s.hearts++;core.persist()}},1000);
window.catCityHealthHud=()=>{const mx=maxHearts(),h=Math.max(0,Math.min(mx,s.hearts||0));return '<br><span class="cc-hearts" aria-label="Hearts '+h+' of '+mx+'">'+'❤️'.repeat(h)+'🤍'.repeat(mx-h)+'</span>'+sideHud()};

// ================================================================== 2. CLEARER PROMPTS
let promptText='',promptAt=0,frameTexts=[];
const PROMPT=/^\s*(E\s*[\/·\-–:]|E\s*🐾|Press E|🐾\s*\/\s*E)/;
const ctx=core.ctx;
if(ctx&&!ctx.__ccPrompt){ctx.__ccPrompt=true;const of=ctx.fillText.bind(ctx);// The engine's own small "E · Talk to …" box at the bottom is replaced by the chip.
 const ofr=ctx.fillRect.bind(ctx);ctx.fillRect=function(x,y,w,h){if(w===224&&h===32&&/^(#342849|rgba\(52, 40, 73)/.test(String(this.fillStyle))&&Math.abs(y-(core.H-85))<1)return;return ofr(x,y,w,h)};
 ctx.fillText=function(t,x,y,mw){if(typeof t==='string'&&PROMPT.test(t)){frameTexts.push({t,x,y});if(/^E · Talk to /.test(t)&&Math.abs(y-(core.H-63))<1)return}return mw===undefined?of(t,x,y):of(t,x,y,mw)}}
// Several prompts can be drawn in one frame (e.g. a door and a cat). Pick the one
// the 🐾 button will actually do: garden plots first, then talking, then the closest.
function pickPrompt(){if(!frameTexts.length)return;let best=frameTexts.find(p=>p.garden)||frameTexts.find(p=>/Talk to/.test(p.t));
 if(!best){let bd=1e9;for(const p of frameTexts){const d=Math.hypot(p.x-core.W/2,p.y-core.H/2);if(d<bd){bd=d;best=p}}}
 promptText=best.t;promptAt=performance.now();frameTexts=[]}
setInterval(()=>{const on=!busy()&&performance.now()-promptAt<260&&!!promptText&&!dlg.classList.contains('open');
 const what=promptText.replace(PROMPT,'').replace(/^[\s·\-–:\/🐾]+/,'').trim();
 if(on){const t=(coarse()?'🐾 ':'Press E · ')+(what||'Interact');if(promptEl.textContent!==t)promptEl.textContent=t}
 if(on&&!promptEl.classList.contains('show'))window.catCitySfx?.('pop');promptEl.classList.toggle('show',on);$('interact')?.classList.toggle('cc-pulse',on)},120);

// ================================================================== 3. ART STYLE
const artStyle=()=>{try{return localStorage.getItem('catcity_art_style')==='classic'?'classic':'pixel'}catch(e){return 'pixel'}};
// Classic smooth also turns off the pixel UI skin (square notched buttons/panels), so switching
// style visibly changes the game straight away, not only the cats (glitch report: "switching does nothing").
const applyArtStyle=v=>{document.body.classList.toggle('cc-art-classic',v==='classic');document.body.classList.toggle('cc-no-pixel-ui',v==='classic')};
applyArtStyle(artStyle());
window.catCityArtStyle=artStyle;

// ================================================================== 4. HOW TO PLAY
const GUIDE=[
 ['🐾','Moving','<b>Computer:</b> WASD or arrow keys. Hold <b>Shift</b> to sprint.<br><b>Phone:</b> drag the joystick. Tap <b>⚡</b> to sprint.'],
 ['✨','Using things','Walk up to cats, shops, chests, taxis and 📜 lore. When a yellow <b>prompt</b> appears at the bottom, press <b>E</b> or tap <b>🐾</b>.'],
 ['⚔️','Attacking','Press <b>Space</b> or <b>⚔️</b> to attack when you\'re close. Equip a <b>bow</b> from your inventory to shoot from further away. In the Poison Wastes, Wranglers guard every area — fight back!'],
 ['❤️','Hearts','Your hearts are in the top-left. Wranglers and infected kitties hurt you. Hearts come back on their own (faster at home). Lose them all and you wake up at home.'],
 ['👑','Boss fights','Run away from <b>red circles</b> before they fill up, then attack up close. Press <b>Jump</b> to dodge. If you\'re knocked out, you can retry straight away.'],
 ['📖','The story','Talk to <b>Biscuit</b> for the main quests. Watch out for taxis in the wild… some rides go somewhere unexpected. Find 📜 lore to learn about the Birman Family.'],
 ['🌱','Side jobs','Cats with a <b>❕</b> have side quests. Grow crops in the <b>Village Garden</b> (beside the Adventure Guild) and cook them at the 🍲 pot, visit shops, buy a house and collect Squishems!']
];
function guide(i=0){const [ic,t,b]=GUIDE[i];dialog(ic,'How to play · '+t+' ('+(i+1)+'/'+GUIDE.length+')',b,[...(i>0?[['◀ Back',()=>guide(i-1),true]]:[]),i<GUIDE.length-1?['Next ▶',()=>guide(i+1)]:['Let\'s play! 🐾',()=>{s.guideSeen=true;core.persist()}]])}
window.catCityGuide=guide;
// (Not in automated browser tests, where it would cover the buttons being tested.)
if(!navigator.webdriver)setTimeout(()=>{const t=setInterval(()=>{if(s.guideSeen){clearInterval(t);return}if(!busy()&&s.tutorialCompleted&&!dlg.classList.contains('open')){clearInterval(t);guide(0)}},2500)},4000);

// Settings: art style, Biscuit guide button. Pause: guide button.
function settingsUI(){
 const panel=$('settings-panel');if(panel&&!$('cc-pf-settings')){const box=document.createElement('div');box.className='settings-section';box.id='cc-pf-settings';
  box.innerHTML='<strong>🎨 Art style</strong><select id="cc-art-style" style="width:100%;margin:6px 0;padding:8px;border-radius:10px"><option value="pixel">🟪 Pixel art (default)</option><option value="classic">🫧 Classic smooth (non-pixel)</option></select><button type="button" id="cc-guide-btn">📘 How to play</button>';
  const saves=$('settings-saves');saves?saves.before(box):panel.append(box);$('cc-art-style').value=artStyle();
  $('cc-art-style').onchange=e=>{try{localStorage.setItem('catcity_art_style',e.target.value)}catch(_){}applyArtStyle(e.target.value);core.note(e.target.value==='classic'?'🫧 Classic smooth art style':'🟪 Pixel art style')};
  $('cc-guide-btn').onclick=()=>guide(0)}
 const pause=$('pause-panel')?.querySelector('.cc-list');if(pause&&!$('cc-guide-pause')){const b=document.createElement('button');b.type='button';b.id='cc-guide-pause';b.textContent='📘 How to play';b.onclick=()=>{$('pause-panel')?.classList.remove('show');guide(0)};pause.append(b)}
}
setInterval(settingsUI,1500);settingsUI();
// Classic style: smooth scaling on the main canvas.
const oldDraw=core.draw;
core.draw=function(){frameTexts=[];if(core.ctx)core.ctx.imageSmoothingEnabled=artStyle()==='classic';oldDraw();if(!busy()&&!inCave())drawWorldExtras();pickPrompt()};

// ================================================================== 5. FARMING
// Harvests go into your pantry (3 per plot) for cooking or selling at the cooking pot.
// Seasonal crops follow the real calendar.
const CROPS={carrot:{name:'Carrot',icon:'🥕',seed:5,mins:3,price:4,col:'#f08a3c'},catnip:{name:'Catnip',icon:'🌿',seed:8,mins:5,price:5,col:'#55c46a'},pumpkin:{name:'Pumpkin',icon:'🎃',seed:15,mins:8,price:12,col:'#f0953c'},
 strawberry:{name:'Strawberry',icon:'🍓',seed:10,mins:5,price:9,col:'#e8394f',season:'spring'},sunflower:{name:'Sunflower',icon:'🌻',seed:10,mins:5,price:9,col:'#ffd23c',season:'summer'},
 mushroom:{name:'Mushroom',icon:'🍄',seed:10,mins:5,price:9,col:'#c9573c',season:'autumn'},snowberry:{name:'Snowberry',icon:'🫐',seed:10,mins:5,price:9,col:'#9fc3ff',season:'winter'}};
const season=()=>['winter','winter','spring','spring','spring','summer','summer','summer','autumn','autumn','autumn','winter'][new Date().getMonth()];
const SEASON_ICON={spring:'🌸',summer:'☀️',autumn:'🍂',winter:'❄️'};
s.pantry=s.pantry&&typeof s.pantry==='object'?s.pantry:{};
// The garden sits on the open grass west of the Adventure Guild.
const GARDEN={x:42,y:726};
const PLOTS=[0,1,2,3,4,5].map(i=>({i,x:GARDEN.x+(i%3)*48,y:GARDEN.y+Math.floor(i/3)*44}));
s.farm=Array.isArray(s.farm)?s.farm.slice(0,6):[];while(s.farm.length<6)s.farm.push(null);
function growth(p){if(!p)return 0;const c=CROPS[p.crop];if(!c)return 0;const now=Date.now(),need=c.mins*60000;
 // Watered time counts double.
 const wet=Math.max(0,Math.min(now,p.wetUntil||0)-p.at),dry=now-p.at;return Math.min(1,(dry+wet)/need)}
const nearPlot=()=>{let best=null,bd=30;for(const P of PLOTS){const d=Math.hypot(s.x-P.x,s.y-P.y);if(d<bd){bd=d;best=P}}return best};
function plotUse(P){const p=s.farm[P.i];
 if(!p){dialog('🌱','Garden plot '+(P.i+1),'What would you like to plant?<br><small>'+SEASON_ICON[season()]+' It\'s '+season()+': '+Object.values(CROPS).find(c=>c.season===season()).name+'s are in season! · You have 🐟 '+Math.floor(s.fish||0)+'</small>',[...Object.entries(CROPS).filter(([k,c])=>!c.season||c.season===season()).map(([k,c])=>[c.icon+' '+c.name+' · '+c.seed+' 🐟 · '+c.mins+' min',()=>{if((s.fish||0)<c.seed){core.note('🐟 Not enough fish for '+c.name+' seeds.');return}s.fish-=c.seed;s.farm[P.i]={crop:k,at:Date.now(),wetUntil:0};core.persist();window.catCitySfx?.('plant');core.note('🌱 Planted '+c.name+'! Water it to grow faster.')}]),['Not now',null,true]]);return}
 const c=CROPS[p.crop],gr=growth(p);
 if(gr>=1){s.farm[P.i]=null;s.pantry[p.crop]=(s.pantry[p.crop]||0)+3;s.fish=(s.fish||0)+2;const got=['3 '+c.icon+' (in your pantry)','2 🐟'];window.catCitySfx?.('harvest');
  s.harvests=(s.harvests||0)+1;if(s.sideQuests?.harvest==='active')s.sideHarvest=(s.sideHarvest||0)+1;window.catCityLevels?.add?.(8,'harvest');core.persist();core.note(c.icon+' Harvested '+c.name+'! +'+got.join(', ')+'. Cook them at the 🍲 pot!');
  window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type:'harvest',crop:p.crop}}));return}
 if((p.wetUntil||0)<Date.now()){p.wetUntil=Date.now()+2*60000;core.persist();window.catCitySfx?.('water');window.dispatchEvent(new CustomEvent('catcity:watered'));core.note('💧 Watered the '+c.name+'! It grows twice as fast for 2 minutes. ('+Math.floor(gr*100)+'%)');return}
 core.note(c.icon+' '+c.name+' is growing… '+Math.floor(gr*100)+'% (already watered)');
}
function drawGarden(g2,cx,cy,t){
 const gx=GARDEN.x-cx,gy=GARDEN.y-cy,vx=GARDEN.x-(s.x-core.W/2),vy=GARDEN.y-(s.y-core.H/2);if(vx<-200||vy<-200||vx>core.W+120||vy>core.H+120)return;
 const near=nearPlot();
 if(gardenLayer!=='beds'){
  g2.font='bold 11px system-ui';g2.textAlign='center';g2.fillStyle='#fff6e4';g2.strokeStyle='#241832';g2.lineWidth=3;g2.strokeText('🌱 Village Garden',gx+48,gy-32);g2.fillText('🌱 Village Garden',gx+48,gy-32);
  if(near){const p2=s.farm[near.i],x=Math.round(near.x-cx),y=Math.round(near.y-cy),lab=!p2?'E / 🐾 · Plant seeds':growth(p2)>=1?'E / 🐾 · Harvest':(p2.wetUntil||0)<Date.now()?'E / 🐾 · Water':'E / 🐾 · Check crop';
   g2.lineWidth=3;g2.strokeStyle='#241832';g2.fillStyle='#fff6e4';g2.strokeText(lab,x,y+30);g2.fillText(lab,x,y+30);frameTexts.push({t:lab,x,y,garden:true})}
  return}
 g2.fillStyle='#6b4b2f';g2.fillRect(Math.round(gx-26),Math.round(gy-26),148,104);g2.fillStyle='#8a5a34';g2.fillRect(Math.round(gx-24),Math.round(gy-24),144,100);
 for(const P of PLOTS){const p=s.farm[P.i],x=Math.round(P.x-cx),y=Math.round(P.y-cy);
  g2.fillStyle=p&&(p.wetUntil||0)>Date.now()?'#3b2616':'#5b3a22';g2.fillRect(x-18,y-15,36,30);g2.fillStyle='#4a2e18';for(let k=0;k<3;k++)g2.fillRect(x-18,y-10+k*10,36,2);
  if(p){const c=CROPS[p.crop],gr=growth(p),st=gr>=1?3:gr>.55?2:gr>.2?1:0;
   for(const [ox,oy] of [[-9,-4],[9,-4],[0,7]]){const px=x+ox,py=y+oy;
    if(st===0){g2.fillStyle='#d9b98a';g2.fillRect(px-1,py-1,3,2)}
    else if(st===1){g2.fillStyle='#55c46a';g2.fillRect(px,py-5,2,5);g2.fillRect(px-2,py-6,2,2);g2.fillRect(px+2,py-6,2,2)}
    else if(st===2){g2.fillStyle='#3b8a4f';g2.fillRect(px,py-8,2,8);g2.fillRect(px-4,py-8,4,3);g2.fillRect(px+2,py-10,4,3)}
    else{g2.fillStyle='#3b8a4f';g2.fillRect(px,py-9,2,5);g2.fillStyle=c.col;if(p.crop==='pumpkin'){g2.fillRect(px-4,py-5,10,7);g2.fillStyle='#c96a1c';g2.fillRect(px-1,py-5,2,7)}else if(p.crop==='carrot'){g2.fillRect(px-1,py-4,4,6)}else{g2.fillRect(px-3,py-10,8,6)}}}
   if(st===3&&Math.floor(t*3)%2){g2.fillStyle='#fff6a0';g2.fillRect(x+14,y-17,2,2)}}
  if(near===P){g2.strokeStyle='#ffd45c';g2.lineWidth=2;g2.strokeRect(x-20,y-17,40,34)}}
}

// ================================================================== 6. SIDE QUESTS
s.materials=s.materials&&typeof s.materials==='object'?s.materials:{};
s.sideQuests=s.sideQuests&&typeof s.sideQuests==='object'?s.sideQuests:{};
const NPC_AT={marmalade:{x:9*T+16,y:13*T+16},pebble:{x:23*T+16,y:13*T+16},luna:{x:38*T+16,y:13*T+16},forge:{x:34*T+16,y:25*T+16},slaycat:{x:38*T+16,y:20*T+16}};
const SIDE=[
 {id:'petals',npc:'marmalade',who:'Marmalade',title:'Petal Delivery',ask:'Could you bring me <b>3 Rosy Petals</b> from the Flower Terrace? They make my shop smell lovely!',prog:()=>Math.min(3,s.materials.rose||0)+'/3 Rosy Petals',ready:()=>(s.materials.rose||0)>=3,take:()=>{s.materials.rose-=3},reward:{fish:60,xp:40},thanks:'Ooh, they smell gorgeous! Here\'s something for your trouble.'},
 {id:'pages',npc:'pebble',who:'Pebble',title:'Lost Pages',ask:'I\'m writing Cat City\'s history. Find <b>3 lore spots</b> (📜) out in the biomes for me!',prog:()=>Math.min(3,(s.loreFound||[]).length)+'/3 lore spots',ready:()=>(s.loreFound||[]).length>=3,reward:{fish:80,xp:60},thanks:'Fascinating… the Birman Family really did live in the sky. Thank you!'},
 {id:'coconut',npc:'luna',who:'Luna',title:'The Moon Flower',ask:'Bring me a rare, glowing <b>Coconut Flower</b> from the Flower Terrace. Look for the beam of light!',prog:()=>Math.min(1,s.materials.coconut||0)+'/1 Coconut Flower',ready:()=>(s.materials.coconut||0)>=1,take:()=>{s.materials.coconut-=1},reward:{fish:100,xp:60},thanks:'It\'s perfect. The moon will be pleased with you!'},
 {id:'camp',npc:'forge',who:'Forge',title:'Scrap Run',ask:'Clear a <b>Wrangler area</b> in the Poison Wastes and grab their loot. I need the scrap metal!',prog:()=>s.sideCamp?'Loot collected!':'Clear a Wrangler area',ready:()=>!!s.sideCamp,reward:{fish:60,xp:60,steel:3},thanks:'Ha! Good metal, this. I\'ll forge something fine.'},
 {id:'harvest',npc:'slaycat',who:'SlayCat',title:'Glow-Up Salad',ask:'Bestie! Grow and <b>harvest 3 crops</b> in the Village Garden. We\'re making a GLOW-UP salad! 🥗',prog:()=>Math.min(3,s.sideHarvest||0)+'/3 harvested',ready:()=>(s.sideHarvest||0)>=3,reward:{fish:70,xp:50},thanks:'Iconic salad. Iconic you. 💜'}
];
window.addEventListener('catcity:wrangler-camp-loot',()=>{if(s.sideQuests.camp==='active'){s.sideCamp=true;core.persist()}});
function sideFor(npc){return SIDE.find(q=>q.npc===npc&&s.sideQuests[q.id]!=='done')}
// Other add-ons can add more side quests (Cat Tok adds a second one for each NPC): catCitySideQuests.add({...same fields}).
window.catCitySideQuests={list:SIDE,add(q){if(q&&q.id&&!SIDE.some(x=>x.id===q.id))SIDE.push(q)},doneFor:npc=>SIDE.filter(q=>q.npc===npc&&s.sideQuests[q.id]==='done').length,done:id=>s.sideQuests[id]==='done'};
function sideHud(){const q=SIDE.find(q=>s.sideQuests[q.id]==='active');return q?'<br>📜 '+q.title+': '+q.prog():''}
function nearNpc(){let best=null,bd=70;for(const [id,p] of Object.entries(NPC_AT)){const d=Math.hypot(s.x-p.x,s.y-p.y);if(d<bd){bd=d;best=id}}return best}
let chatOnce=false;
function sideUse(npc){const q=sideFor(npc);if(!q)return false;const st=s.sideQuests[q.id];
 const chat=['💬 Just chat',()=>{chatOnce=true;core.interact()},true];
 if(!st){dialog('❕',q.who+' · '+q.title,q.ask+'<br><br><small>Reward: '+rewardText(q.reward)+'</small>',[['✅ Accept',()=>{s.sideQuests[q.id]='active';if(q.id==='harvest')s.sideHarvest=0;core.persist();window.catCitySfx?.('quest');core.note('📜 Side quest accepted: '+q.title)}],chat]);return true}
 if(q.ready()){dialog('✅',q.who+' · '+q.title,q.thanks+'<br><br><small>Reward: '+rewardText(q.reward)+'</small>',[['🎁 Hand it in',()=>{q.take?.();s.sideQuests[q.id]='done';window.catCitySfx?.('reward');const r=q.reward;s.fish=(s.fish||0)+(r.fish||0);if(r.steel)s.steel=(s.steel||0)+r.steel;window.catCityLevels?.add?.(r.xp||0,'side quest');core.persist();core.note('🎁 Side quest complete: '+q.title+'! +'+rewardText(r))}],chat]);return true}
 dialog('📜',q.who+' · '+q.title,q.ask+'<br><br><b>'+q.prog()+'</b>',[['👍 On it!',null],chat]);return true}
const rewardText=r=>[r.fish&&r.fish+' 🐟',r.xp&&r.xp+' XP',r.steel&&r.steel+' steel'].filter(Boolean).join(' · ');
function drawSideMarks(g2,cx,cy,t){for(const [id,p] of Object.entries(NPC_AT)){const q=sideFor(id);if(!q)continue;const x=p.x-cx,y=p.y-cy-46+Math.sin(t*4)*2;if(x<-30||y<-30||x>core.W+30||y>core.H+30)continue;
 const ready=s.sideQuests[q.id]==='active'&&q.ready(),active=s.sideQuests[q.id]==='active';g2.fillStyle=ready?'#55e07a':active?'#c9b2ed':'#ffd45c';g2.beginPath();g2.arc(x,y,9,0,7);g2.fill();g2.fillStyle='#241a2c';g2.font='bold 13px system-ui';g2.textAlign='center';g2.fillText(ready?'✓':active?'…':'!',x,y+5)}}

// ================================================================== drawing + using
// The garden beds go under the cats (drawn with the terrain); labels and ❕ marks go on top.
let gardenLayer='beds';
function drawWorldExtras(){const g2=core.ctx,cx=s.x-core.W/2,cy=s.y-core.H/2,t=performance.now()/1000;g2.save();g2.imageSmoothingEnabled=false;gardenLayer='labels';drawGarden(g2,cx,cy,t);drawSideMarks(g2,cx,cy,t);g2.restore()}
const oldTerrain=window.catCityDrawOverhaul;
window.catCityDrawOverhaul=function(ct,st,...rest){const r=oldTerrain?.(ct,st,...rest);if(!busy()){ct.save();ct.imageSmoothingEnabled=false;gardenLayer='beds';drawGarden(ct,0,0,performance.now()/1000) /* the engine has already moved the canvas to world coordinates here */;ct.restore()}return r};
const oldInteract=core.interact;
core.interact=function(){
 if(!busy()&&!dlg.classList.contains('open')&&$('dialog')?.style.display!=='block'){
  const P=nearPlot();if(P){plotUse(P);return}
  if(chatOnce){chatOnce=false}else{const n=nearNpc();if(n&&sideUse(n))return}
 }
 return oldInteract();
};
if($('interact'))$('interact').onclick=()=>core.interact();
window.catCityPlaytest={crops:CROPS,season,garden:GARDEN,hearts:()=>s.hearts,max:maxHearts,hurt:window.catCityHurt,farm:()=>s.farm,plots:PLOTS,side:()=>({...s.sideQuests}),guide};
})();

/* Cat City Online — The Great Tag House. 2D cross-play mini-game, iPhone & Windows. */
(() => {
'use strict';
const core=window.__catCityEngine;
if (!core) {console.error('Tag House: Cat City engine not found');return;}
const names=['Astro','Galaxy','Baby','Harley','Skylar','Pumpkin'];
const outfits=[{fur:'#e9953c',belly:'#f6c68b',ears:'#f7bd79',eye:'#5d3c25'},
              {fur:'#e58c39',belly:'#fff9ef',ears:'#f4b778',eye:'#567c61'},
              {fur:'#8b827e',belly:'#c4b7b1',ears:'#b1a6a0',eye:'#a2cc73'},
              {fur:'#f7f6f1',belly:'#fffdf8',ears:'#29272a',eye:'#aaa462'},
              {fur:'#f6f6f2',belly:'#fffdf8',ears:'#29292b',eye:'#b4a765'},
              {fur:'#f9f1e4',belly:'#fffdfa',ears:'#cc9358',eye:'#78865b'}];
const uiCSS=`
#taghouse-jump{display:none!important;position:fixed;right:10px;top:151px;z-index:57;padding:9px 11px;border:2px solid #fff;background:#ad81ef;color:#fff;border-radius:13px;box-shadow:0 4px 12px #22163877;font-size:12px;font-weight:900;touch-action:manipulation}
#taghouse-world-door{position:fixed;bottom:165px;right:10px;z-index:56;display:none;padding:10px 14px;border:2px solid #fff;border-radius:12px;background:#b7f1dd;color:#25372d}
#taghouse-scene{position:fixed;inset:0;z-index:605;display:none;background:#281d3d;color:white;overflow:hidden;touch-action:none;font-family:system-ui,-apple-system,sans-serif}
#taghouse-scene.active{display:block}#taghouse-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;image-rendering:pixelated}
#taghouse-top{position:absolute;top:calc(env(safe-area-inset-top) + 7px);left:50%;transform:translateX(-50%);width:min(440px,calc(100% - 16px));padding:10px 12px;background:#32224de8;border:2px solid #f8e9ff;border-radius:15px;box-shadow:0 5px 15px #1a102daa;text-align:center;pointer-events:none}
#taghouse-title{font-size:16px;font-weight:900;color:#fff5cb}#taghouse-status{font-weight:850;font-size:13px;margin-top:3px}#taghouse-score{font-size:11px;color:#f4dcff;margin-top:4px}#taghouse-buff{font-size:12px;color:#c0ffe3;margin-top:3px;min-height:13px}
#taghouse-round{position:absolute;top:calc(env(safe-area-inset-top) + 125px);left:10px;display:flex;gap:6px;flex-wrap:wrap;max-width:min(290px,80vw)}
#taghouse-round button,#taghouse-exit,#taghouse-sprint{border:2px solid #fff;border-radius:13px;box-shadow:0 3px 11px #1b123aaa;touch-action:manipulation;font-weight:900}
#taghouse-start:disabled,#taghouse-stop:disabled{opacity:.5;filter:grayscale(.35);pointer-events:none}#taghouse-start{background:#b0f3c6;color:#253833}#taghouse-stop{background:#ffbecf;color:#532844}#taghouse-exit{position:absolute;right:10px;top:calc(env(safe-area-inset-top) + 125px);background:#fff3bc;color:#553e35}
#taghouse-round button,#taghouse-exit{font-size:12px;padding:10px 12px;min-height:43px}
#taghouse-help{position:absolute;bottom:calc(env(safe-area-inset-bottom) + 17px);left:50%;transform:translateX(-50%);font-weight:800;font-size:12px;text-shadow:1px 2px #1d1439;background:#302248c9;border-radius:10px;padding:5px 8px;pointer-events:none;white-space:nowrap;max-width:75vw;overflow:hidden;text-overflow:ellipsis}
#taghouse-stick{position:absolute;left:20px;bottom:calc(env(safe-area-inset-bottom) + 24px);width:136px;height:136px;border:3px solid #f0ddffb4;border-radius:50%;background:#eee2ff40;touch-action:none;box-shadow:0 0 15px #1b143d7a}
#taghouse-knob{position:absolute;left:42px;top:42px;width:47px;height:47px;border-radius:50%;border:2px solid #fff8;background:#f3d3ffb8;box-shadow:0 3px 10px #32184b66;pointer-events:none;transform:translate(0,0)}
#taghouse-sprint{position:absolute;right:19px;bottom:calc(env(safe-area-inset-bottom) + 38px);width:99px;height:87px;background:#ffd884;color:#513b55;font-size:17px;letter-spacing:.3px}
#taghouse-sprint.held{background:#b9f9d8}#taghouse-sprint small{font-size:10px;display:block}
#taghouse-flash{position:absolute;z-index:10;max-width:90vw;text-align:center;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:900;font-size:22px;color:#fff;text-shadow:2px 4px #302248;pointer-events:none;opacity:0;transition:opacity .2s}
@media(pointer:fine){#taghouse-stick,#taghouse-sprint{display:none}#taghouse-help{bottom:15px}}
@media(max-width:420px){#taghouse-round{top:calc(env(safe-area-inset-top) + 112px)}#taghouse-exit{top:calc(env(safe-area-inset-top) + 112px)}#taghouse-title{font-size:14px}#taghouse-status{font-size:12px}}
body.taghouse-inside #mobile,body.taghouse-inside #interact,body.taghouse-inside #sprint{pointer-events:none!important}
#taghouse-mode{position:absolute;inset:0;z-index:25;background:#1f142ed9;display:none;align-items:center;justify-content:center;padding:16px;touch-action:pan-y!important}
#taghouse-mode.open{display:flex;pointer-events:auto}#taghouse-mode-card{width:min(360px,96vw);max-height:83dvh;overflow-y:auto;background:#fff6ec;color:#382747;border:4px solid #b18bcb;border-radius:24px;box-shadow:0 10px 45px #180f35cc;padding:22px;display:flex;flex-direction:column;gap:12px;touch-action:pan-y!important}
#taghouse-mode-card label{font-weight:800}#taghouse-mode-card select{width:100%;height:48px;background:#fff;color:#35243a;border:2px solid #ac81c2;border-radius:12px;font-weight:700;padding:9px;touch-action:manipulation!important}
#taghouse-mode-card button{min-height:48px;border-radius:12px;margin:0;padding:8px 12px;touch-action:manipulation!important}
#taghouse-roulette{position:absolute;inset:0;z-index:23;background:#251c3ad9;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;pointer-events:none}
#taghouse-roulette.show{display:flex}#taghouse-roulette-row{display:flex;gap:7px;justify-content:center;max-width:95vw}
#taghouse-roulette-row span{min-width:90px;padding:22px 6px;border-radius:18px;border:3px solid #d6b6e9;background:#5c4077;font-weight:900;font-size:17px;transition:transform .12s,background .12s}
#taghouse-roulette-row span.selected{background:#ffcb7c;color:#452a36;border-color:#fff5c4;transform:scale(1.1);box-shadow:0 0 22px #ffcd83ab}
#taghouse-roulette-label{font-size:23px;font-weight:900;color:#fff5cc;max-width:90vw;text-shadow:2px 2px #302143}
body.taghouse-inside #start-arrived,body.taghouse-inside #start-arrived.show{display:none!important}
`;
const style=document.createElement('style');style.id='taghouse-styles';style.textContent=uiCSS;document.head.append(style);
const jump=document.createElement('button');jump.id='taghouse-jump';jump.textContent='🏁 Tag House';jump.type='button';jump.title='Enter the giant maze';document.body.append(jump);
const nearDoor=document.createElement('button');nearDoor.id='taghouse-world-door';nearDoor.type='button';nearDoor.textContent='🏠 Enter Tag House';document.body.append(nearDoor);
const scene=document.createElement('div');scene.id='taghouse-scene';scene.setAttribute('role','region');scene.setAttribute('aria-label','Cat City Tag House multiplayer maze');
scene.innerHTML=`<canvas id="taghouse-canvas"></canvas><div id="taghouse-top"><div id="taghouse-title">🐾 THE GREAT TAG HOUSE 🏠</div><div id="taghouse-status">Find another cat to start!</div><div id="taghouse-score">Astro 0 · Galaxy 0 · Baby 0</div><div id="taghouse-buff"></div></div><div id="taghouse-round"><button type="button" id="taghouse-start">▶ Start Tag</button><button type="button" id="taghouse-stop">■ End Round</button></div><button type="button" id="taghouse-exit">↩ Leave</button><div id="taghouse-stick"><div id="taghouse-knob"></div></div><button type="button" id="taghouse-sprint">🐾 RUN!<small>Hold to sprint</small></button><div id="taghouse-help">WASD / arrows · Shift to run</div><div id="taghouse-flash"></div>
<div id="taghouse-roulette"><div id="taghouse-roulette-label">🎲 WHO WILL BE IT?</div><div id="taghouse-roulette-row"><span>🧡 Astro</span><span>🤍 Galaxy</span><span>🤎 Baby</span><span>🤍 Harley</span><span>🖤 Skylar</span><span>🧡 Pumpkin</span></div></div>
<div id="taghouse-mode"><div id="taghouse-mode-card"><h2 style="margin:0">🏁 Choose Tag Mode</h2><p style="margin:0">Play with up to five cats! Any empty spots are filled by clever computer cats.</p><label for="taghouse-mode-select">Game mode</label><select id="taghouse-mode-select"><option value="normal">🐾 Normal Tag · pass IT to someone else</option><option value="freeze">❄️ Freeze Tag · save frozen teammates</option></select><label for="taghouse-duration">Round length</label><select id="taghouse-duration"><option value="60">1 minute</option><option value="120">2 minutes</option><option value="180" selected>3 minutes</option><option value="300">5 minutes</option><option value="600">10 minutes</option></select><button id="taghouse-mode-go" style="background:#b9eeb8;color:#203c28;font-weight:900">🎲 Pick a Tagger & Start!</button><button id="taghouse-mode-cancel" style="background:#e3d8ec;color:#493452">Cancel</button></div></div>`;
document.body.append(scene);
const $=id=>document.getElementById(id);
const canvas=$('taghouse-canvas'),ctx=canvas.getContext('2d',{alpha:false});
const stick=$('taghouse-stick'),knob=$('taghouse-knob');
// A huge dedicated wing at the southern edge of the village, within the accessible map.
const HOUSE={x:10*32,y:28*32,w:21*32,h:6*32,doorX:20.5*32,doorY:33.5*32};
let inside=false,maze=null,loading=false,meX=1496,meY=1984,initialized=false;
let W=innerWidth,H=innerHeight,dpr=1;
let keys=new Set(),joy={x:0,y:0},pointerId=null,sprintHeld=false;
let localBoostUntil=0,lastMoveSend=0,lastFrame=0,frame=0,flashUntil=0,flashText='',previousTagId=null,previousActive=false,previousRound=0,previousPowerups=new Set();
const inOnline=()=>!!window.catCityOnlineConnected?.();
const send=data=>window.catCityOnlineSend?.(data);
const onlinePlayers=()=>window.catCityOnlinePlayers?.()||[];
const myId=()=>inOnline()?(window.catCityOnlineMe?.()||null):'solo-human';
const tag=()=>inOnline()?(window.catCityOnlineTagState?.()||{active:false,phase:'idle',itId:null,players:[],scores:{},pickups:[],remaining:0}):solo;
const emptyScores=()=>Object.fromEntries(names.map((_,i)=>[String(i),0]));
let solo={active:false,phase:'idle',mode:'normal',itId:null,itCat:null,players:[],scores:emptyScores(),remaining:180,pickups:[],round:0,winner:'',duration:180,spinRemaining:0};
const botNames=['bot-0','bot-1','bot-2'];let soloEndsAt=0,soloSpinUntil=0,botTickAt=0;
function soloInit(){
 const now=performance.now();
 solo={active:false,phase:'idle',mode:'normal',itId:null,itCat:null,players:[],scores:emptyScores(),remaining:180,pickups:[],round:0,winner:'',duration:180,spinRemaining:0};
 const soloRoles=[core.state.cat,...names.map((_,i)=>i).filter(i=>i!==core.state.cat)].slice(0,3);
 for(const c of soloRoles){
  const spawn=maze.spawns[c];solo.players.push({id:c===core.state.cat?'solo-human':'bot-'+c,cat:c,bot:c!==core.state.cat,inHouse:true,online:true,x:spawn[0],y:spawn[1],frozen:false,boost:0,shield:0,path:[],repath:0,lastChange:now});
 }
}
function setSoloStart(mode,duration){
 solo.phase='roulette';solo.mode=mode;solo.duration=duration;solo.remaining=duration;solo.scores=emptyScores();solo.active=false;solo.pickups=[];solo.winner='';solo.round++;
 solo.itCat=solo.players[Math.floor(Math.random()*solo.players.length)].cat;solo.itId=solo.players.find(p=>p.cat===solo.itCat).id;
 soloSpinUntil=performance.now()+4600;
 for(const p of solo.players){p.frozen=false;p.shield=0;p.boost=0;p.path=[];}
}

function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;}
addEventListener('resize',resize);resize();
function inRange(a,b){return Math.hypot(core.state.x-a,core.state.y-b)<78;}
function nearHouse(){return false;}
async function loadMap(){
  if(maze)return true;
  if(loading)return false;
  loading=true;
  try{
    const res=await fetch('/tag-map',{cache:'no-store'});
    if(!res.ok)throw Error('Maze not available ('+res.status+')');
    const data=await res.json();
    if(!Array.isArray(data.maze)||!Array.isArray(data.pads)||!Array.isArray(data.spawns))throw Error('Invalid maze data');
    maze=data;return true;
  }catch(err){console.error('Tag House map error:',err);core.note('Tag House did not load. Please refresh Cat City and try again.');return false;}
  finally{loading=false;}
}
function flash(message){flashText=message;flashUntil=performance.now()+1500;const el=$('taghouse-flash');el.textContent=message;el.style.opacity='1';}
async function enter(){
  if(inside)return;
  if(!await loadMap())return;
  const startMenu=$('catcity-start-menu');if(startMenu?.classList.contains('show'))$('start-play')?.click();
  $('catcity-online-panel')?.classList.remove('open');
  for(const panel of document.querySelectorAll('.cc-panel.show')) panel.classList.remove('show');
  $('settings-panel')?.classList.remove('open');
  inside=true;initialized=false;localBoostUntil=0;keys.clear();sprintHeld=false;joy={x:0,y:0};
  const spawn=maze.spawns[core.state.cat]||maze.spawns[0];meX=spawn[0];meY=spawn[1];
  previousTagId=null;previousActive=false;previousRound=0;
  scene.classList.add('active');document.body.classList.add('taghouse-inside');
  if(inOnline())send({type:'tag_enter'});else soloInit();flash('Welcome to Tag House! 🐾');requestAnimationFrame(loop);
}
function leave(){
  if(!inside)return;
  inside=false;scene.classList.remove('active');document.body.classList.remove('taghouse-inside');
  keys.clear();joy={x:0,y:0};sprintHeld=false;if(inOnline())send({type:'tag_leave'});solo.phase='idle';
  if(pointerId!==null){pointerId=null;knob.style.transform='translate(0,0)';}
  core.note('🏡 You left the Great Tag House.');
}
$('taghouse-exit').onclick=leave;
$('taghouse-start').onclick=()=>{if(inside && tag().phase==='idle')$('taghouse-mode').classList.add('open');};
$('taghouse-mode-cancel').onclick=()=>$('taghouse-mode').classList.remove('open');
$('taghouse-mode-go').onclick=()=>{
 const mode=$('taghouse-mode-select').value,duration=Number($('taghouse-duration').value);
 $('taghouse-mode').classList.remove('open');
 if(inOnline())send({type:'tag_start',mode,duration});else setSoloStart(mode,duration);
};
$('taghouse-stop').onclick=()=>{if(!inside)return;if(inOnline())send({type:'tag_stop'});else{solo.active=false;solo.phase='idle';solo.itId=null;solo.winner='Round ended';}};

// Tag House is accessed only through Pause -> Play Tag House.
// No village building, world doorway, title shortcut or floating button.
function drawVillageHouse(){}
function posIsFloor(x,y,r=10){
  if(!maze)return false;
  for(const [xx,yy] of [[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]]){
    const c=Math.floor(xx/maze.tile),row=Math.floor(yy/maze.tile);
    if(maze.maze[row]?.[c]!=='0')return false;
  }
  return true;
}
function move(dx,dy){
  const dist=Math.hypot(dx,dy);if(dist<.0001)return;
  const count=Math.max(1,Math.ceil(dist/7));
  for(let i=0;i<count;i++){
    if(posIsFloor(meX+dx/count,meY))meX+=dx/count;
    if(posIsFloor(meX,meY+dy/count))meY+=dy/count;
  }
}
function drawCat(px,py,which,isIt,boost,shield,t){
  const cat=outfits[which]||outfits[0];const bounce=Math.sin(t*10+which)*1.2;
  if(window.catCityGraphicsPack?.()==='alien'){
    window.catCityDrawGlob?.(ctx,px,py,1.0);
    if(isIt){ctx.save();ctx.strokeStyle='#ff6285';ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,py-4,23,0,7);ctx.stroke();ctx.restore();}return;
  }
  ctx.save();ctx.translate(px,py+bounce);ctx.shadowColor='#24193766';ctx.shadowBlur=3;
  ctx.fillStyle='#3223437f';ctx.beginPath();ctx.ellipse(0,12,13,5,0,0,Math.PI*2);ctx.fill();
  if(boost){ctx.strokeStyle='#e6fc9d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,6);ctx.lineTo(-26-Math.sin(t*12)*4,9);ctx.stroke();}
  ctx.strokeStyle=cat.fur;ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(8,5);ctx.quadraticCurveTo(22,-1,15,-10);ctx.stroke();
  ctx.fillStyle=cat.fur;ctx.fillRect(-8,5,6,9);ctx.fillRect(3,5,6,9);
  ctx.fillStyle=cat.fur;ctx.beginPath();ctx.ellipse(0,1,12,14,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=cat.belly;ctx.beginPath();ctx.ellipse(0,5,6,8,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=cat.ears;ctx.beginPath();ctx.moveTo(-10,-12);ctx.lineTo(-12,-23);ctx.lineTo(-2,-16);ctx.moveTo(10,-12);ctx.lineTo(12,-23);ctx.lineTo(2,-16);ctx.fill();
  ctx.fillStyle=cat.fur;ctx.beginPath();ctx.ellipse(0,-11,12,11,0,0,Math.PI*2);ctx.fill();
  // Animated tag characters carry their own recognizable markings.
  if(which===3){ctx.fillStyle='#25272b';ctx.fillRect(-12,-17,9,12);ctx.fillRect(7,-19,5,6);ctx.fillStyle='#fffefa';ctx.fillRect(-4,-20,8,13);}
  if(which===4){ctx.fillStyle='#25252a';ctx.fillRect(-12,-18,9,13);ctx.fillRect(4,-19,8,13);ctx.fillStyle='#fffefa';ctx.fillRect(-3,-20,6,12);ctx.fillStyle='#232329';ctx.fillRect(-4,-8,8,7);ctx.fillRect(-3,-2,6,3);}
  if(which===5){ctx.fillStyle='#c78c48';ctx.fillRect(-11,-18,10,13);ctx.fillStyle='#56504a';ctx.fillRect(4,-20,8,12);ctx.fillStyle='#fffefa';ctx.fillRect(-4,-10,8,9);}
  ctx.fillStyle=cat.eye;ctx.fillRect(-6,-12,3,4);ctx.fillRect(3,-12,3,4);
  ctx.fillStyle=which===4?'#222127':'#e9a0b5';ctx.fillRect(-1,-7,2,2);
  if(which===2){ctx.fillStyle='#5e5a5d';ctx.fillRect(-7,-19,3,3);ctx.fillRect(3,-19,3,3);}
  if(isIt){ctx.strokeStyle='#ff6c8c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-2,22,0,Math.PI*2);ctx.stroke();ctx.font='18px system-ui';ctx.textAlign='center';ctx.fillText('👑',0,-27);}
  if(shield){ctx.strokeStyle='#a1edff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-4,25,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}
function roundStatus(state){
  const participants=(state.players||[]).filter(p=>p.inHouse&&p.online);
  const active=state.phase==='play';const roulette=state.phase==='roulette';
  const chaser=participants.find(p=>p.id===state.itId);
  const isIt=active&&state.itId===myId();
  const me=participants.find(p=>p.id===myId());
  const mm=String(Math.floor((state.remaining||0)/60)),ss=String((state.remaining||0)%60).padStart(2,'0');
  const title=roulette?'🎲 Choosing who is IT…':active?(state.mode==='freeze'?(isIt?'❄️ YOU ARE THE FREEZER!':'🏃 SAVE YOUR TEAMMATES!'):(isIt?'😼 YOU ARE THE TAGGER!':'🏃 YOU ARE NOT TAGGED — RUN!')):
     state.winner?'🏆 '+state.winner:'🏁 Choose a mode and start a round!';
  $('taghouse-status').textContent=title+(active?' · '+mm+':'+ss:'');
  const scores=state.scores||{};
  $('taghouse-score').textContent=names.map((n,i)=>n+' '+(scores[String(i)]||0)).join(' · ');
  const botCount=participants.filter(p=>p.bot).length;
  $('taghouse-buff').textContent=(me?.frozen?'❄️ FROZEN! Wait for rescue.  ':'')+(me?.boost>0?'⚡ SPEED  ':'')+(me?.shield>0?'🫧 SHIELD  ':'')+(botCount?'🤖 '+botCount+' smart NPC'+(botCount>1?'s':''):'👥 6 player slots')+' · '+(state.mode==='freeze'?'❄️ Freeze Tag':'🐾 Normal Tag');
  $('taghouse-start').disabled=roulette||active;
  $('taghouse-stop').disabled=!roulette&&!active;
  const rouletteLayer=$('taghouse-roulette');rouletteLayer.classList.toggle('show',roulette);
  if(roulette){
    const left=state.spinRemaining||0,elapsed=Math.max(0,4.6-left);
    const pos=elapsed<3.7?Math.floor(elapsed/(.12+.08*(elapsed/4.6)))%(inOnline()?5:3):state.itCat;
    [...$('taghouse-roulette-row').children].forEach((el,i)=>{el.style.display=!inOnline()&&i>=3?'none':'';el.classList.toggle('selected',i===pos)});
    $('taghouse-roulette-label').textContent='🎲 WHO WILL BE THE TAGGER?';
    const beepSlot=Math.floor(elapsed*8);
    if(beepSlot!==window.__tagBeepSlot){window.__tagBeepSlot=beepSlot;window.catCityBeep?.(650+pos*160,.065);}
  }else window.__tagBeepSlot=-1;
  if(state.round!==previousRound){previousRound=state.round;previousTagId=null;}
  if(active && !previousActive){
    flash(isIt?(state.mode==='freeze'?'❄️ YOU ARE THE TAGGER! FREEZE EVERYONE!':'😼 YOU ARE THE TAGGER! GO TAG SOMEONE!'):
      (state.mode==='freeze'?'🏃 YOU ARE NOT THE TAGGER! FREE YOUR TEAMMATES!':'🏃 YOU ARE NOT TAGGED! RUN!'));
    flashUntil=performance.now()+3200;
  }else if(active&&previousTagId!==null&&previousTagId!==state.itId){
    flash(isIt?'😼 YOU ARE THE TAGGER!':'🏃 KEEP RUNNING!');flashUntil=performance.now()+2000;
  }
  if(!active&&!roulette&&previousActive&&state.winner){flash('🏆 '+state.winner);flashUntil=performance.now()+3200;}
  previousTagId=active?state.itId:null;previousActive=active;
}
function wallVisual(x,y,tile,col,row){
  ctx.fillStyle=(col+row)%3===0?'#624279':'#6d4d87';ctx.fillRect(x,y,tile,tile);
  ctx.fillStyle='#8463a0';ctx.fillRect(x+3,y+2,tile-6,5);
  ctx.fillStyle='#4c345d';ctx.fillRect(x,y+tile-5,tile,5);
  if((col*13+row*17)%41===0){ctx.fillStyle='#efcfff';ctx.fillRect(x+10,y+10,5,5);}
}
function floorVisual(x,y,tile,col,row){
  ctx.fillStyle=(col+row)%2?'#ebe2ff':'#e4dafa';ctx.fillRect(x,y,tile,tile);
  if((col*19+row*7)%13===0){ctx.fillStyle='#cfb8ed';ctx.fillRect(x+9,y+12,4,4);ctx.fillRect(x+18,y+16,3,3);}
}
function paint(t){
  if(!maze)return;
  const tile=maze.tile,worldW=maze.cols*tile,worldH=maze.rows*tile;
  const cameraX=Math.max(0,Math.min(Math.max(0,worldW-W),meX-W/2));
  const cameraY=Math.max(0,Math.min(Math.max(0,worldH-H),meY-H/2));
  ctx.fillStyle='#251a39';ctx.fillRect(0,0,W,H);
  const firstCol=Math.max(0,Math.floor(cameraX/tile)-1),lastCol=Math.min(maze.cols-1,Math.ceil((cameraX+W)/tile)+1);
  const firstRow=Math.max(0,Math.floor(cameraY/tile)-1),lastRow=Math.min(maze.rows-1,Math.ceil((cameraY+H)/tile)+1);
  for(let row=firstRow;row<=lastRow;row++)for(let col=firstCol;col<=lastCol;col++){
    const x=Math.round(col*tile-cameraX),y=Math.round(row*tile-cameraY);
    if(maze.maze[row][col]==='1')wallVisual(x,y,tile,col,row);
    else floorVisual(x,y,tile,col,row);
  }
  // Big-room decorations and small whimsical details, NOT collectible clutter.
  for(const [col,row,emoji] of [[46,61,'🐈'],[16,17,'🛋️'],[69,21,'🎨'],[37,38,'🧶'],[9,50,'🎀'],[79,43,'🪴'],[42,12,'🐟'],[53,54,'🌟'],[23,34,'🧩']]){
    if(maze.maze[row]?.[col]!=='0')continue;
    const x=(col+.5)*tile-cameraX,y=(row+.5)*tile-cameraY;
    if(x<-45||x>W+45||y<-45||y>H+45)continue;
    ctx.font='21px system-ui';ctx.textAlign='center';ctx.fillText(emoji,x,y+8);
  }
  for(const pad of maze.pads){
    const x=pad.x-cameraX,y=pad.y-cameraY;
    if(x<-35||x>W+35||y<-35||y>H+35)continue;
    ctx.fillStyle='#87d7d0';ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#e6fff8';ctx.font='17px system-ui';ctx.textAlign='center';ctx.fillText('⚡',x,y+6);
    ctx.strokeStyle='#4aa89f';ctx.lineWidth=2;ctx.strokeRect(x-14,y-14,28,28);
  }
  const state=tag();
  for(const pickup of state.pickups||[]){
    const x=pickup.x-cameraX,y=pickup.y-cameraY;
    if(x<-40||x>W+40||y<-40||y>H+40)continue;
    ctx.fillStyle='#ffffffc9';ctx.beginPath();ctx.arc(x,y,18+Math.sin(t*5)*2,0,Math.PI*2);ctx.fill();
    ctx.font='23px system-ui';ctx.textAlign='center';ctx.fillStyle='#291837';
    ctx.fillText(pickup.kind==='rocket'?'🚀':pickup.kind==='bubble'?'🫧':'🐟',x,y+8);
  }
  const myData=(state.players||[]).find(p=>p.id===myId());
  for(const p of state.players||[]){
    if(!p.inHouse||!p.online||p.id===myId())continue;
    const x=p.x-cameraX,y=p.y-cameraY;
    if(x<-50||x>W+50||y<-50||y>H+50)continue;
    drawCat(x,y,p.cat,state.active&&state.itId===p.id,p.boost>0,p.shield>0,t);
    if(p.frozen){ctx.save();ctx.strokeStyle='#85e8ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y-3,25,0,7);ctx.stroke();ctx.font='22px system-ui';ctx.fillText('❄️',x,y-28);ctx.restore();}
    ctx.textAlign='center';ctx.font='900 13px system-ui';ctx.lineWidth=3;ctx.strokeStyle='#392547';ctx.strokeText(names[p.cat],x,y-36);ctx.fillStyle='#fff';ctx.fillText(names[p.cat],x,y-36);
  }
  const x=meX-cameraX,y=meY-cameraY;
  drawCat(x,y,core.state.cat,state.active&&state.itId===myId(),Math.max(myData?.boost||0,(localBoostUntil-performance.now())/1000)>0,myData?.shield>0,t);
  if(myData?.frozen){ctx.save();ctx.strokeStyle='#91ebff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y-3,25,0,7);ctx.stroke();ctx.font='24px system-ui';ctx.fillText('❄️',x,y-31);ctx.restore();}
  ctx.textAlign='center';ctx.font='900 13px system-ui';ctx.lineWidth=3;ctx.strokeStyle='#392547';ctx.strokeText('YOU · '+names[core.state.cat],x,y-36);ctx.fillStyle='#fff';ctx.fillText('YOU · '+names[core.state.cat],x,y-36);
  // Mini map: only an unobtrusive 93x69 pixel overview in the corner.
  const mw=93,mh=69,mx=W-mw-12,my=Math.max(208,Math.min(H-mh-170,228));
  if(W>350 && H>420 && my>174){
    ctx.fillStyle='#241d36df';ctx.fillRect(mx-5,my-5,mw+10,mh+10);
    for(let r=0;r<maze.rows;r++)for(let c=0;c<maze.cols;c++){
      if(maze.maze[r][c]==='0'){ctx.fillStyle='#c7a9e8';ctx.fillRect(mx+c,my+r,1,1);}
    }
    ctx.fillStyle='#ffde72';ctx.fillRect(mx+meX/worldW*mw-2,my+meY/worldH*mh-2,4,4);
  }
}
function updateUI(){
  if(inside){roundStatus(tag());return;}
  nearDoor.style.display='none';
  const menuOpen=$('catcity-start-menu')?.classList.contains('show');
  jump.style.display='none';
}
setInterval(updateUI,400);
let previousMe=null;

// Local, smart tag bots: BFS finds navigable corridors. Runners flee or rescue frozen allies.
function botPath(a,b){
 if(!maze)return [];
 const C=maze.cols,R=maze.rows,T=maze.tile;
 const key=(x,y)=>y*C+x, sx=Math.floor(a.x/T),sy=Math.floor(a.y/T),tx=Math.floor(b.x/T),ty=Math.floor(b.y/T);
 const from=new Int32Array(C*R).fill(-1),queue=new Int32Array(C*R);
 const start=key(sx,sy),goal=key(tx,ty);let head=0,tail=1;queue[0]=start;from[start]=start;
 while(head<tail){const v=queue[head++];if(v===goal)break;
   const x=v%C,y=Math.floor(v/C);
   for(const [xx,yy] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
     if(xx<0||xx>=C||yy<0||yy>=R||maze.maze[yy]?.[xx]!=='0')continue;
     const next=key(xx,yy);if(from[next]!==-1)continue;from[next]=v;queue[tail++]=next;
   }
 }
 if(from[goal]===-1)return [];
 const path=[];let cur=goal;
 while(cur!==start){path.push({x:((cur%C)+.5)*T,y:(Math.floor(cur/C)+.5)*T});cur=from[cur];if(path.length>C*R)break;}
 return path.reverse();
}
let soloLastTagAt=0,soloNextPickup=0;
function soloUpdate(now,dt){
 if(inOnline()||!inside||!maze)return;
 const me=solo.players.find(p=>p.id==='solo-human');if(!me)return;
 me.x=meX;me.y=meY;
 if(solo.phase==='roulette'){
   solo.spinRemaining=Math.max(0,(soloSpinUntil-now)/1000);
   if(now>=soloSpinUntil){solo.phase='play';solo.active=true;soloEndsAt=now+solo.duration*1000;soloLastTagAt=now;soloNextPickup=now+9000;}
 }
 if(solo.phase!=='play')return;
 solo.remaining=Math.max(0,Math.ceil((soloEndsAt-now)/1000));
 if(solo.remaining<=0){solo.phase='idle';solo.active=false;solo.winner=solo.mode==='freeze'?'Runners win — survived!':('Top score: '+Math.max(...Object.values(solo.scores)));return;}
 const it=solo.players.find(p=>p.id===solo.itId);
 if(!it)return;
 for(const b of solo.players.filter(p=>p.bot)){
   if(b.frozen)continue;
   if(now>b.repath||!b.path.length){
     let dest;
     if(b.id===solo.itId){
       const others=solo.players.filter(p=>p.id!==b.id&&!p.frozen);
       dest=others.sort((x,y)=>Math.hypot(x.x-b.x,x.y-b.y)-Math.hypot(y.x-b.x,y.y-b.y))[0];
     }else if(solo.mode==='freeze'&&solo.players.some(p=>p.frozen&&p.id!==b.id)){
       dest=solo.players.find(p=>p.frozen&&p.id!==b.id);
     }else {
       const candidates=[];
       for(let q=0;q<34;q++){
         const rx=Math.floor(Math.random()*maze.cols),ry=Math.floor(Math.random()*maze.rows);
         if(maze.maze[ry]?.[rx]==='0'&&Math.hypot(rx*32-b.x,ry*32-b.y)<850)candidates.push({x:(rx+.5)*32,y:(ry+.5)*32});
       }
       candidates.sort((a,z)=>(Math.hypot(z.x-it.x,z.y-it.y)-.22*Math.hypot(z.x-b.x,z.y-b.y))-(Math.hypot(a.x-it.x,a.y-it.y)-.22*Math.hypot(a.x-b.x,a.y-b.y)));
       dest=candidates[0];
     }
     if(dest)b.path=botPath(b,dest);
     b.repath=now+500+Math.random()*420;
   }
   const node=b.path[0];if(!node)continue;
   const dd=Math.hypot(node.x-b.x,node.y-b.y);
   if(dd<8){b.path.shift();continue;}
   const spd=b.boost>0?295:b.id===solo.itId?178:170;
   const step=Math.min(dd,spd*dt);
   const nx=b.x+(node.x-b.x)/dd*step,ny=b.y+(node.y-b.y)/dd*step;
   if(posIsFloor(nx,b.y))b.x=nx;
   if(posIsFloor(b.x,ny))b.y=ny;
 }
 // Each role can be tagged or rescued, including computer-controlled roles.
 if(solo.mode==='freeze'){
   for(const p of solo.players.filter(p=>p.frozen)){
     if(solo.players.some(q=>q.id!==p.id&&q.id!==solo.itId&&!q.frozen&&Math.hypot(q.x-p.x,q.y-p.y)<27))p.frozen=false;
   }
 }
 if(now-soloLastTagAt>1450){
   for(const p of solo.players){
     if(p.id===solo.itId||p.frozen||p.shield>0)continue;
     if(Math.hypot(p.x-it.x,p.y-it.y)<27){
       solo.scores[String(it.cat)]++;
       if(solo.mode==='freeze'){p.frozen=true;if(solo.players.filter(q=>q.id!==it.id).every(q=>q.frozen)){solo.phase='idle';solo.active=false;solo.winner='Tagger wins — all frozen!';}}
       else {solo.itId=p.id;solo.itCat=p.cat;p.shield=1.4;}
       soloLastTagAt=now;break;
     }
   }
 }
 for(const p of solo.players){if(p.shield>0)p.shield=Math.max(0,p.shield-dt);if(p.boost>0)p.boost=Math.max(0,p.boost-dt);}
 if(solo.pickups.length<3&&now>soloNextPickup){
   for(let tries=0;tries<40;tries++){
     const c=Math.floor(Math.random()*maze.cols),r=Math.floor(Math.random()*maze.rows);
     if(maze.maze[r]?.[c]!=='0')continue;
     const x=(c+.5)*32,y=(r+.5)*32;
     if(solo.players.some(p=>Math.hypot(p.x-x,p.y-y)<300))continue;
     solo.pickups.push({id:'sp-'+now,kind:['rocket','bubble','fish'][Math.floor(Math.random()*3)],x,y});break;
   }
   soloNextPickup=now+11000+Math.random()*4000;
 }
 for(const p of solo.players){
   for(const pad of maze.pads){if(Math.hypot(p.x-pad.x,p.y-pad.y)<20)p.boost=Math.max(p.boost,2.4);}
   for(const pickup of [...solo.pickups]){
     if(Math.hypot(p.x-pickup.x,p.y-pickup.y)>23)continue;
     solo.pickups.splice(solo.pickups.indexOf(pickup),1);
     if(pickup.kind==='rocket')p.boost=6;
     else if(pickup.kind==='bubble')p.shield=6;
     else if(pickup.kind==='fish')p.boost=3.5;
   }
 }
}
function loop(now){
  if(!inside)return;
  requestAnimationFrame(loop);
  const dt=Math.min(.05,Math.max(.001,(now-(lastFrame||now))/1000));lastFrame=now;frame++;
  const state=tag(),me=(state.players||[]).find(p=>p.id===myId());
  if(me?.inHouse){
    if(!initialized || Math.hypot(me.x-meX,me.y-meY)>78){meX=me.x;meY=me.y;initialized=true;}
  }
  let dx=Number(keys.has('d')||keys.has('ArrowRight'))-Number(keys.has('a')||keys.has('ArrowLeft'))+joy.x;
  let dy=Number(keys.has('s')||keys.has('ArrowDown'))-Number(keys.has('w')||keys.has('ArrowUp'))+joy.y;
  const magnitude=Math.hypot(dx,dy);
  if(magnitude>1){dx/=magnitude;dy/=magnitude;}
  const myBoost=Math.max(me?.boost||0,(localBoostUntil-now)/1000);
  const run=sprintHeld||keys.has('Shift');
  const spd=myBoost>0?296:run?232:186;
  if(!me?.frozen)move(dx*spd*dt,dy*spd*dt);
  if(!inOnline())soloUpdate(now,dt);
  for(const pad of maze?.pads||[]){
    if(Math.hypot(meX-pad.x,meY-pad.y)<22 && now>localBoostUntil){localBoostUntil=now+2400;flash('⚡ SPEED PAD!');}
  }
  if(inOnline() && now-lastMoveSend>95){send({type:'tag_move',x:Math.round(meX*10)/10,y:Math.round(meY*10)/10,sprint:!!run});lastMoveSend=now;}
  // Solo mode runs locally, online mode is authoritative on the server.
  paint(now/1000);
  if(flashUntil<now && $('taghouse-flash').style.opacity==='1')$('taghouse-flash').style.opacity='0';
  if(frame%9===0)updateUI();
}
function keyCapture(ev){
  if(!inside)return;
  const key=String(ev.key||'').length===1?ev.key.toLowerCase():String(ev.key||'');
  if(['a','w','d','s','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Shift',' ','Escape'].includes(key)){
    ev.preventDefault();ev.stopImmediatePropagation();
    if(key==='Escape'&&ev.type==='keydown'){leave();return;}
    if(key===' '&&ev.type==='keydown'){$('taghouse-start').click();return;}
    if(ev.type==='keydown')keys.add(key);else keys.delete(key);
  }
}
document.addEventListener('keydown',keyCapture,true);document.addEventListener('keyup',keyCapture,true);
function updateJoy(e){
  const r=stick.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;
  let x=e.clientX-cx,y=e.clientY-cy;const dist=Math.hypot(x,y);if(dist>49){x=x/dist*49;y=y/dist*49;}
  joy={x:x/49,y:y/49};knob.style.transform=`translate(${x}px,${y}px)`;
}
stick.addEventListener('pointerdown',e=>{if(pointerId!==null)return;pointerId=e.pointerId;stick.setPointerCapture(e.pointerId);updateJoy(e);e.preventDefault();});
stick.addEventListener('pointermove',e=>{if(e.pointerId===pointerId){updateJoy(e);e.preventDefault();}});
const resetJoy=e=>{if(e.pointerId!==pointerId)return;pointerId=null;joy={x:0,y:0};knob.style.transform='translate(0,0)';};
stick.addEventListener('pointerup',resetJoy);stick.addEventListener('pointercancel',resetJoy);
const sprintButton=$('taghouse-sprint');
sprintButton.addEventListener('pointerdown',e=>{sprintHeld=true;sprintButton.classList.add('held');sprintButton.setPointerCapture(e.pointerId);e.preventDefault();});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])sprintButton.addEventListener(ev,()=>{sprintHeld=false;sprintButton.classList.remove('held');});
window.addEventListener('blur',()=>{keys.clear();joy={x:0,y:0};sprintHeld=false;});
// When a teammate enters Tag House, the server places the whole online party
// inside. Each client follows the authoritative state instead of remaining in
// the overworld, and enter() sends an idempotent acknowledgement.
window.addEventListener('catcity:server',event=>{
 const msg=event.detail;if(!msg||msg.type!=='state'||!inOnline()||inside)return;
 const myself=window.catCityOnlineMe?.();
 if((msg.tag?.players||[]).some(p=>p.id===myself&&p.inHouse))enter();
});
window.catCityTagHouse={enter,leave,get inside(){return inside;},get maze(){return maze;},get state(){return tag();},openMode(){if(inside) $('taghouse-mode').classList.add('open');}};
updateUI();
})();

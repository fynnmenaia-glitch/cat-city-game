/* Great Adventure: accessible mining, trees, rare crystals and lucky blocks. */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state, $=id=>document.getElementById(id),CHUNK=core.T*24;
const h=(a,b,k=0)=>{const n=Math.sin(a*127.1+b*311.7+k*53.17)*43758.5453;return n-Math.floor(n)};
const used=new Set(Array.isArray(s.adventureMined)?s.adventureMined:[]);
s.adventureMined=Array.isArray(s.adventureMined)?s.adventureMined:[];
s.resourceRespawns=s.resourceRespawns&&typeof s.resourceRespawns==='object'?s.resourceRespawns:{};
function regrown(id){if(!used.has(id))return false;const date=s.resourceRespawns[id];if(!date||Date.now()<date)return false;
 used.delete(id);delete s.resourceRespawns[id];s.adventureMined=s.adventureMined.filter(x=>x!==id);core.persist();return true}
function emit(type,detail={}){window.dispatchEvent(new CustomEvent('catcity:adventure-action',{detail:{type,...detail}}))}
s.materials=s.materials&&typeof s.materials==='object'?s.materials:{};
const hits=new Map(),RARITIES=[['common',72],['uncommon',18],['rare',7],['epic',2],['legendary',.7],['mythical',.2],['ultra-mythical',.08],['impossible',.02]];
const colors={common:'#fff',uncommon:'#76efa8',rare:'#75caff',epic:'#dba3ff',legendary:'#ffd071',mythical:'#ffa5d5','ultra-mythical':'#f18afa',impossible:'#fff6a4',admin:'#ff9f70'};
function context(){const c=window.catCityCaveState?.();return c?.inside?{id:'cave:'+c.id,x:c.x,y:c.y,cave:true}:{id:'world',x:s.x,y:s.y,cave:false}}
function biome(cx,cy){if(cx<0&&cy>=-1&&cy<=1)return 'wild';let v=h(cx,cy);return v<.17?'cherry':v>.82?'poison':v<.32?'marsh':v>.66?'moonstone':'wild'}
function nodes(){
 const p=context(),out=[];
 if(p.cave){for(let i=0;i<8;i++){
 const spots=window.catCityCaveOreSpots?.()||[];
 const [x,y]=spots[i]||[(17+i%4)*32+16,(10+Math.floor(i/4)*5)*32+16];
 const id=p.id+':ore:'+i;if(used.has(id)||(window.catCityCaveOreSpots&&spots[i]===undefined))continue;const r=h(i,p.id.length,11);
 const type=r<.004?'eligeode':r<.13?'diamond':r<.31?'emerald':r<.58?'amethyst':'crystal';
 out.push({id,x,y,type,icon:type==='eligeode'?'🌈':'💎'});
 }return out}
 const cx=Math.floor(s.x/CHUNK),cy=Math.floor(s.y/CHUNK);
 for(let xx=cx-1;xx<=cx+1;xx++)for(let yy=cy-1;yy<=cy+1;yy++){
 if(!xx&&!yy)continue;const area=biome(xx,yy),tree=area==='wild'||area==='cherry'||area==='marsh';
 const x=xx*CHUNK+(6+h(xx,yy,57)*12)*core.T,y=yy*CHUNK+(6+h(xx,yy,63)*12)*core.T;
 const id='mine:'+xx+':'+yy;regrown(id);if(!used.has(id)&&!window.catCityBotMinedNodes?.has(id)){
 const type=tree?(area==='cherry'?'wood':'wood'):area==='moonstone'?(h(xx,yy,51)<.003?'eligeode':h(xx,yy,52)<.23?'amethyst':'crystal'):area==='poison'?'stone':'stone';
 out.push({id,x,y,type,area,icon:tree?'🌳':type==='eligeode'?'🌈':'🪨'})}
 if(h(xx,yy,90)<.42){const bid='lucky:'+xx+':'+yy;const stage=!!window.catCityAdminStageState?.active;
 const LB=window.catCityLuckyBlocks,rar=LB?LB.rarityAt(xx,yy):null,isAdmin=LB?rar==='admin':stage&&h(xx,yy,97)<.12;
 if(!used.has(bid))out.push({id:bid,rarity:rar,x:xx*CHUNK+(3+h(xx,yy,91)*18)*core.T,y:yy*CHUNK+(3+h(xx,yy,92)*18)*core.T,type:isAdmin?'admin-block':'lucky-block',icon:isAdmin?'👑':'🎲'})}
 }return out;
}
function closestNode(){const p=context();let winner=null,d=70;for(const n of nodes()){let dist=Math.hypot(n.x-p.x,n.y-p.y);if(dist<d){winner=n;d=dist}}return winner}
const names=['Oak Sword','Cherry Blade','Marsh Spear','Amethyst Armour','Crystal Crown','Emerald Helm','Diamond Sword','Eli-geode Blade','Legendary Paws','Moonlight Robe'];
function pickBlockRarity(id,admin){
 if(admin)return'admin';const e=window.catCityGetAdventureEvent?.()||{};
 const luck=[1,2,4,6,8,12,16,20,24].includes(+e.luck)&&e.endsAt>Date.now()/1000?+e.luck:1;
 const weights=RARITIES.map(([tier,w],i)=>w*(i?Math.pow(luck,.8):1));let v=h(id.length,id.charCodeAt(3)||0,21)*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<weights.length;i++){v-=weights[i];if(v<=0)return RARITIES[i][0]}return'common'
}
const notify=msg=>core.note(msg);
function grantBlock(n){
 const admin=n.type==='admin-block',LB=window.catCityLuckyBlocks;
 let tier,item;
 if(LB&&n.rarity){tier=n.rarity;const r=LB.reward(tier,Math.floor(n.x*7+n.y*13));
  item={id:n.id+':reward',...r,name:(tier==='admin'?'👑 ':tier==='playtester'?'🧪 ':(window.catCityGetAdventureEvent?.()?.name==='ghost_parade')?'👻 Ghost ':'')+r.name};}
 else{tier=pickBlockRarity(n.id,admin);const name=names[Math.floor(h(n.x,n.y,71)*names.length)];
 item={id:n.id+':reward',name:(admin?'👑 Admin ':((window.catCityGetAdventureEvent?.()?.name==='ghost_parade')?'👻 Ghost ':''))+name,rarity:tier,color:colors[tier],type:/Sword|Blade|Spear/.test(name)?'weapon':/Crown|Helm/.test(name)?'head':/Paws/.test(name)?'paws':'body',durability:admin?600:100,maxDurability:admin?600:100};}
 s.adventureItems=Array.isArray(s.adventureItems)?s.adventureItems:[];
 const enchanted=window.catCitySquishems?.eventItemEffect(item)||item;
 Object.assign(item,enchanted);
 s.adventureItems.push(item);
 window.catCityInventoryItemAdded?.(item);
 if(Array.isArray(s.adventureHotbar)&&s.adventureHotbar.length<10)s.adventureHotbar.push(item.id);
 emit('lucky',{item,rarity:tier});
 used.add(n.id);s.adventureMined.push(n.id);core.persist();
 const banner=document.createElement('div');banner.setAttribute('role','status');banner.style.cssText='position:fixed;top:25%;left:50%;transform:translateX(-50%);z-index:6800;text-align:center;color:white;background:#33224bf0;border:4px solid #ddc3ff;border-radius:20px;padding:20px;max-width:86vw;font:bold 18px system-ui';
 document.body.append(banner);let counter=0;
 const timer=setInterval(()=>{counter++;const name=names[Math.floor(Math.random()*names.length)];banner.textContent='🎲 '+name+' · '+RARITIES[counter%RARITIES.length][0].toUpperCase();if(counter>=13){clearInterval(timer);banner.textContent='✨ '+item.name+' · '+tier.toUpperCase()+'!';setTimeout(()=>banner.remove(),1900)}},75);
 notify('🎲 Lucky Block opened! '+item.name);window.catCityRefreshHotbar?.();
}
function damageTool(){const id=s.adventureEquipment?.weapon;if(!id)return;const item=s.adventureItems?.find(x=>x.id===id);if(!item||item.durability<=0)return;
 item.durability--;if(item.durability===0){delete s.adventureEquipment.weapon;notify('⚠️ Your '+item.name+' wore out!')}}
function mine(n){
 window.catCitySetPlayerActivity?.(n.type==='wood'?'chop':'mine');
 emit('strike',{material:n.type,tree:n.type==='wood'});
 if(n.type.endsWith('-block')){grantBlock(n);return}
 const strikes=(hits.get(n.id)||0)+1;damageTool();
 if(strikes<3){hits.set(n.id,strikes);notify((n.icon==='🌳'?'🪓 Chopping':'⛏️ Mining')+' '+strikes+'/3 — press E / 🐾 again.');core.persist();return}
 hits.delete(n.id);used.add(n.id);s.adventureMined.push(n.id);
 if(n.id.startsWith('mine:'))s.resourceRespawns[n.id]=Date.now()+8*60*1000;
 emit(n.type==='wood'?'chop':'mine',{material:n.type,amount:1,tree:n.type==='wood'});
 const amount=n.type==='eligeode'?1:1+Math.floor(h(n.x,n.y,44)*2);
 s.materials[n.type]=(s.materials[n.type]||0)+amount;core.persist();
 notify('✨ Gathered '+amount+' '+(n.type==='eligeode'?'Eli-geode':n.type)+'! Saved in Crafting & Materials.');
}
window.catCityMiningNodes=nodes;
window.catCityMiningHitProgress=id=>hits.get(id)||0;
const oldInteract=core.interact;core.interact=function(){const p=context(),n=closestNode();if(n&&(!p.cave||n.type!=='admin-block')){mine(n);return}return oldInteract()};
if($('interact'))$('interact').onclick=()=>core.interact();
const oldDraw=core.draw;core.draw=function(){oldDraw();if(core.bossMode||document.body.classList.contains('start-menu-open')||document.body.classList.contains('taghouse-inside'))return;
 const p=context(),W=core.W,H=core.H;
 const maxW=p.cave?37*32:0,maxH=p.cave?27*32:0;
 const camX=p.cave?Math.max(0,Math.min(maxW-W,p.x-W/2)):p.x-W/2;
 const camY=p.cave?Math.max(0,Math.min(maxH-H,p.y-H/2)):p.y-H/2;
 const ctx=core.ctx;ctx.save();ctx.textAlign='center';
 for(const n of nodes()){const x=n.x-camX,y=n.y-camY;if(x<-95||x>W+95||y<-130||y>H+95)continue;
 if(n.type==='wood'&&window.catCityTreeAsset?.draw){window.catCityTreeAsset.draw(ctx,x,y,n.area||'wild',hits.get(n.id)||0)}
 else if(n.type.endsWith('-block')&&n.rarity&&window.catCityLuckyBlocks){window.catCityLuckyBlocks.draw(ctx,n.rarity,x,y+4)}
 else if(window.catCityDecor&&!n.type.endsWith('-block')){const D=window.catCityDecor,hit=hits.get(n.id)||0,sh=hit?Math.round(Math.sin(Date.now()/40)*hit):0;
  if(n.type==='stone')D.draw(ctx,'rock',x+sh,y+8,4);
  else if(n.type==='eligeode'){const u=window.catCityNatureArt?.material?.('geode');if(u){ctx.imageSmoothingEnabled=false;ctx.drawImage(u,x-20+sh,y-30,40,40)}else D.draw(ctx,'crystal',x+sh,y+8,3)}
  else D.draw(ctx,({crystal:'crystalBlue',diamond:'crystalDiamond',emerald:'crystalEmerald'})[n.type]||'crystal',x+sh,y+8,3);}
 else{ctx.font='26px system-ui';ctx.fillText(n.icon,x,y)}ctx.font='bold 11px system-ui';ctx.strokeStyle='#241832';ctx.lineWidth=3;ctx.fillStyle='#f6f2df';
 const LBr=n.rarity&&window.catCityLuckyBlocks?.byKey[n.rarity];if(LBr)ctx.fillStyle=LBr.key==='impossible'?'#ff6b84':LBr.light;
 const label=LBr?LBr.name+' Lucky Block':n.type==='eligeode'?'Eli-geode':n.type==='lucky-block'?'Lucky Block':n.type==='admin-block'?'ADMIN Block':n.icon==='🌳'?'Choppable Tree':n.type+' Ore';
 ctx.strokeText(label,x,y+17);ctx.fillText(label,x,y+17);ctx.fillStyle='#f6f2df';
 if(Math.hypot(n.x-p.x,n.y-p.y)<70){ctx.font='bold 12px system-ui';ctx.strokeText('E / 🐾',x,y-34);ctx.fillText('E / 🐾',x,y-34)}}
 ctx.restore()};
})();
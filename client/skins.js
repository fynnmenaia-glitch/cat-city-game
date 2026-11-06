/* Cat City — character select and custom characters.
 *
 * "🐱 Characters" on the main menu opens the character select:
 *  - the six main cats (Astro, Galaxy, Baby, Harley, Skylar, Pumpkin);
 *  - "✨ Create your own": needs an account. Pick fur, pattern, white
 *    markings, eyes, nose, ear colour, an accessory and a name, with a live
 *    pixel preview. You still play as one of the six underneath (quests and
 *    roles unchanged); only how your cat looks changes;
 *  - the owner's skin (the catified PNGtuber from the Birman Takeover) is
 *    only shown to, and only works for, the owner's account (Elidagoat).
 *    The creator never offers that round head, happy closed eyes or :3 face,
 *    and the server refuses the owner skin from any other account.
 *
 * State: s.skin = null | 'custom' | 'owner', s.customAvatar = {...}
 * API: catCitySkins.open() · .artId() · .drawMine(ctx,x,y,scale) · .drawPeer(ctx,x,y,p,scale)
 */
(()=>{'use strict';
const core=window.__catCityEngine,art=window.catCityCatArt;if(!core||!art)return;
const s=core.state,$=id=>document.getElementById(id);
const MAIN=['astro','galaxy','baby','harley','skylar','pumpkin'];
const shade=(hex,k)=>{const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return '#'+((f(n>>16&255)<<16)|(f(n>>8&255)<<8)|f(n&255)).toString(16).padStart(6,'0')};
const FUR=[['Ginger','#f0953c'],['Cream','#f2d7b0'],['Chocolate','#7a4f35'],['Black','#3b3443'],['Snow','#fbf7f1'],['Silver','#b9bcc6'],['Blue','#7d8aa6'],['Lilac','#b7a3d6'],['Pink','#f2a6c4'],['Mint','#9fd8b8'],['Sky','#8fc4ef'],['Golden','#e8b84a']];
const PATTERN=[['Plain',{}],['Tabby',{tabby:true}],['Tuxedo',{patch:'tux'}],['Calico',{patch:'calico'}]];
const WHITE=[['None',[]],['Chest',['chest','belly']],['Chest + paws',['chest','belly','paws']],['Socks + muzzle',['paws','muzzle']],['Blaze',['chest','muzzle','blaze']]];
const EYES=[['Amber','#e3a92f'],['Green','#78c25a'],['Blue','#6fa8d8'],['Violet','#b47cf0'],['Gold','#f2d36b'],['Copper','#d9773a'],['Mint','#7fe0c0'],['Pink','#f28fb1']];
const NOSE=[['Pink','#ef8fa3'],['Rose','#e06a8a'],['Brown','#8f6a5a'],['Black','#221c28']];
const EARS=[['Pink','#f4a9a6'],['Peach','#f6c2a0'],['Lilac','#d9b8f0'],['Dark','#5a4a5e']];
const ACC=[['None',null],['Bow','bow'],['Bandana','bandana'],['Glasses','glasses'],['Scarf','scarf'],['Flower crown','flowercrown'],['Leaf crown','leafcrown'],['Goggles','goggles'],['Witch hat','witchhat']];
const def={fur:0,pattern:1,white:1,eyes:0,nose:0,ears:0,acc:0,name:''};
let cfg={...def,...(s.customAvatar&&typeof s.customAvatar==='object'?s.customAvatar:{})};
// The coat the art module draws, from the creator's choices.
function coatOf(c){const base=FUR[c.fur]?.[1]||FUR[0][1];
 return {name:c.name||'My Cat',base,stripe:shade(base,.78),light:shade(base,1.14),...PATTERN[c.pattern]?.[1],white:(WHITE[c.white]?.[1]||[]).slice(),eye:EYES[c.eyes]?.[1],nose:NOSE[c.nose]?.[1],earIn:EARS[c.ears]?.[1],dark:base==='#3b3443',acc:ACC[c.acc]?.[1]?[ACC[c.acc][1]]:[]}}
const hashCoat=o=>'cu_'+[...JSON.stringify(o)].reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,7).toString(36);
function register(coat){const id=hashCoat(coat);if(!art.coats[id])art.coats[id]=coat;return id}
const account=()=>window.catCityAccount?.()||null;
const isOwner=()=>{const a=account();return !!a&&(a.owner===true||String(a.username||'').toLowerCase()==='elidagoat')};
function current(){
 if(s.skin==='owner'&&isOwner())return 'owner';
 if(s.skin==='custom'&&account())return 'custom';
 return null;
}
// For places that draw with the art module directly (cutscenes): your custom coat id.
function artId(){return current()==='custom'?register(coatOf(cfg)):null}
// ------------------------------------------------------------------ drawing your cat and other players
function drawOwner(ctx,x,y,scale,moving){
 const img=window.catCityAdminBirman?.owner?.(false);if(!img)return false;
 const k=scale*1.25,w=img.width*k,h=img.height*k,bob=moving?Math.abs(Math.sin(performance.now()/90))*3*scale:0;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#473b5560';ctx.beginPath();ctx.ellipse(x,y+14*scale,14*scale,4.5*scale,0,0,7);ctx.fill();
 ctx.drawImage(img,Math.round(x-w/2),Math.round(y+16*scale-h-bob),Math.round(w),Math.round(h));ctx.restore();return true;
}
let px0=0,py0=0;
function drawMine(ctx,x,y,scale){
 if(current()!=='owner')return false; // custom cats use the normal art path (artIdFor)
 const moving=Math.abs(s.x-px0)+Math.abs(s.y-py0)>.5;px0=s.x;py0=s.y;
 return drawOwner(ctx,x,y,scale,moving);
}
// cat-art-wire asks which art id to use for a cat; your own cat may be custom.
function artIdFor(cat){if(cat!==core.cats[s.cat])return null;return artId()}
function drawPeer(ctx,x,y,p,scale){
 const sk=p?.skin;if(!sk)return false;
 if(sk.kind==='owner')return drawOwner(ctx,x,y,scale,false);
 if(sk.kind==='custom'){const id=register({name:sk.name||'Cat',base:sk.base,stripe:sk.stripe,light:sk.light,tabby:!!sk.tabby,patch:sk.patch||undefined,white:sk.white||[],eye:sk.eye,nose:sk.nose,earIn:sk.earIn,acc:sk.acc||[]});
  art.draw(ctx,x,y+14*scale,id,'idle',0,{scale:scale*1.2});return true}
 return false;
}
function peerName(p){const sk=p?.skin;return sk?.kind==='owner'?'👑 '+(sk.name||'Owner'):sk?.kind==='custom'&&sk.name?sk.name:null}
// Tell the server what you look like (it checks your account).
let sent='';
setInterval(()=>{if(!window.catCityOnlineConnected?.())return;const k=current();const skin=k==='owner'?{kind:'owner'}:k==='custom'?{kind:'custom',...coatForServer()}:null;const key=JSON.stringify(skin);if(key===sent)return;sent=key;window.catCityOnlineSend?.({type:'set_skin',skin})},1500);
function coatForServer(){const c=coatOf(cfg);return {base:c.base,stripe:c.stripe,light:c.light,eye:c.eye,nose:c.nose,earIn:c.earIn,tabby:!!c.tabby,patch:c.patch||null,white:c.white,acc:c.acc,name:cfg.name||''}}
// ------------------------------------------------------------------ the menus
const css=document.createElement('style');css.textContent=[
 '#cc-chars{display:none;position:fixed;inset:0;z-index:3200;background:#120b1cdd;align-items:center;justify-content:center;padding:10px}','#cc-chars.open{display:flex}',
 '#cc-chars>div{background:#2a1d3a;color:#fff6e4;border:3px solid #ffd45c;padding:14px;width:min(560px,96vw);max-height:92dvh;overflow:auto;font:13px system-ui}',
 '#cc-chars h3{margin:0 0 8px;color:#ffe6ac}','#cc-chars .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}',
 '#cc-chars .tile{background:#3a2a4e;border:2px solid #5a4a6e;color:#fff6e4;padding:6px;display:flex;flex-direction:column;align-items:center;gap:4px;min-height:120px;cursor:pointer}',
 '#cc-chars .tile.on{border-color:#ffd45c;background:#4a3a60}','#cc-chars .tile canvas{width:72px;height:72px;image-rendering:pixelated}',
 '#cc-chars .row{margin:8px 0}','#cc-chars .row b{display:block;margin-bottom:4px;color:#e0c8ff}','#cc-chars .opts{display:flex;flex-wrap:wrap;gap:4px}',
 '#cc-chars .opts button{padding:5px 8px;min-height:32px;background:#3a2a4e;color:#fff6e4;border:2px solid #5a4a6e;font-size:12px}','#cc-chars .opts button.on{border-color:#ffd45c;background:#5a3a7a}',
 '#cc-chars .sw{width:30px;height:30px;padding:0!important}','#cc-chars input{width:100%;padding:8px;font-size:14px;background:#120b1c;color:#fff;border:2px solid #5a4a6e}',
 '#cc-chars .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}','#cc-chars .actions button{padding:8px 12px;min-height:40px;font-weight:900;background:#ffd45c;color:#2a1d36;border:2px solid #fff}',
 '#cc-chars .lock{background:#1a1226;border:2px dashed #ffd45c;padding:12px;margin:8px 0}','#cc-char-preview{display:block;margin:0 auto;width:144px;height:144px;image-rendering:pixelated;background:#1a1226;border:2px solid #5a4a6e}'
].join('');document.head.append(css);
const box=document.createElement('div');box.id='cc-chars';box.innerHTML='<div role="dialog" aria-label="Characters"></div>';document.body.append(box);const card=box.firstChild;
function portrait(id,owner){const c=document.createElement('canvas');c.width=c.height=72;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 if(owner){const img=window.catCityAdminBirman?.owner?.(false);if(img){const k=Math.min(64/img.width,64/img.height);g.drawImage(img,36-img.width*k/2,68-img.height*k,img.width*k,img.height*k)}}
 else art.draw(g,36,66,id,'idle',0,{scale:1.9});return c}
function tile(label,canvas,on,click){const b=document.createElement('button');b.type='button';b.className='tile'+(on?' on':'');b.append(canvas);const t=document.createElement('span');t.textContent=label;b.append(t);b.onclick=click;return b}
function pickMain(i){s.skin=null;core.persist();document.querySelector('#cat-menu [data-cat="'+i+'"]')?.click();if(s.cat!==i){s.cat=i;core.persist()}render();core.note('🐱 You are playing as '+core.cats[i].name+'!')}
function render(){
 card.innerHTML='<h3>🐱 Characters</h3>';const grid=document.createElement('div');grid.className='grid';
 MAIN.forEach((id,i)=>grid.append(tile(core.cats[i].name,portrait(id),!current()&&s.cat===i,()=>pickMain(i))));
 if(isOwner())grid.append(tile('👑 You (owner)',portrait(null,true),current()==='owner',()=>{s.skin='owner';core.persist();render();core.note('👑 Owner skin on! Only your account can use this one.')}));
 grid.append(tile(current()==='custom'?(cfg.name||'My Cat'):'✨ Create your own',portrait(register(coatOf(cfg))),current()==='custom',()=>openCreator()));
 card.append(grid);
 const a=document.createElement('div');a.className='actions';const c=document.createElement('button');c.type='button';c.textContent='✕ Close';c.onclick=()=>box.classList.remove('open');a.append(c);card.append(a);
}
function openCreator(){
 if(!account()){
  card.innerHTML='<h3>✨ Create your own character</h3><div class="lock">🔒 You need a Cat City account to make your own character, so it\'s saved to you and other players can see it online.<br><br>Log in or create a free account, then come back here.</div>';
  const a=document.createElement('div');a.className='actions';
  const l=document.createElement('button');l.type='button';l.textContent='🔐 Log in / Create account';l.onclick=()=>{box.classList.remove('open');window.catCityAccountOpen?.()};
  const back=document.createElement('button');back.type='button';back.textContent='← Back';back.onclick=render;a.append(l,back);card.append(a);return;
 }
 const draft={...cfg};
 card.innerHTML='<h3>✨ Create your own character</h3>';
 const pv=document.createElement('canvas');pv.id='cc-char-preview';pv.width=pv.height=96;card.append(pv);
 let fr=0;const paint=()=>{if(!box.classList.contains('open')||!pv.isConnected)return;const g=pv.getContext('2d');g.clearRect(0,0,96,96);g.imageSmoothingEnabled=false;fr++;
  const pose=Math.floor(fr/60)%3===2?'walk':'idle';art.draw(g,48,88,register(coatOf(draft)),pose,Math.floor(fr/8)%4,{scale:2.4});requestAnimationFrame(paint)};requestAnimationFrame(paint);
 const row=(title,list,key,swatch)=>{const r=document.createElement('div');r.className='row';r.innerHTML='<b>'+title+'</b>';const o=document.createElement('div');o.className='opts';
  list.forEach(([label,val],i)=>{const b=document.createElement('button');b.type='button';b.title=label;if(swatch){b.className='sw';b.style.background=val}else b.textContent=label;if(draft[key]===i)b.classList.add('on');
   b.onclick=()=>{draft[key]=i;[...o.children].forEach((x,j)=>x.classList.toggle('on',j===i))};o.append(b)});r.append(o);card.append(r)};
 row('Fur colour',FUR,'fur',true);row('Pattern',PATTERN,'pattern');row('White markings',WHITE,'white');row('Eyes',EYES,'eyes',true);row('Nose',NOSE,'nose',true);row('Inner ears',EARS,'ears',true);row('Accessory',ACC,'acc');
 const nr=document.createElement('div');nr.className='row';nr.innerHTML='<b>Name</b>';const inp=document.createElement('input');inp.maxLength=14;inp.value=draft.name||'';inp.placeholder='My Cat';inp.oninput=()=>{draft.name=inp.value.replace(/[^A-Za-z0-9 _-]/g,'').slice(0,14)};nr.append(inp);card.append(nr);
 const a=document.createElement('div');a.className='actions';
 const save=document.createElement('button');save.type='button';save.textContent='✅ Play as this cat';
 save.onclick=()=>{let n=(draft.name||'').trim();if(!isOwner()&&/^eli\s*(da|the)?\s*goat$/i.test(n.replace(/[^a-z ]/gi,'')))n='';draft.name=n;cfg={...draft};s.customAvatar={...cfg};s.skin='custom';core.persist();render();core.note('✨ Say hi to '+(cfg.name||'your new cat')+'!')};
 const rnd=document.createElement('button');rnd.type='button';rnd.textContent='🎲 Random';rnd.onclick=()=>{for(const [k,l] of [['fur',FUR],['pattern',PATTERN],['white',WHITE],['eyes',EYES],['nose',NOSE],['ears',EARS],['acc',ACC]])draft[k]=Math.floor(Math.random()*l.length);const n=draft.name;cfg={...cfg};openCreatorWith(draft,n)};
 const back=document.createElement('button');back.type='button';back.textContent='← Back';back.onclick=render;
 a.append(save,rnd,back);card.append(a);
}
function openCreatorWith(d){const keep=cfg;cfg={...d};openCreator();cfg=keep}
function open(){render();box.classList.add('open')}
// The Characters button on the main menu.
function addButton(){const tc=document.querySelector('#catcity-start-menu .title-card');if(!tc||$('cc-characters-btn'))return;const b=document.createElement('button');b.type='button';b.id='cc-characters-btn';b.textContent='🐱 Characters';
 b.style.cssText='font-size:14px;padding:9px 16px;margin:6px auto 2px;display:block;min-height:40px;background:#ffe6ac;color:#3e2d1e;border:2px solid #fff;font-weight:900';
 const play=$('start-play');if(play&&play.parentNode===tc)play.after(b);else tc.append(b);b.onclick=open}
addButton();setInterval(addButton,1500);
window.catCitySkins={open,artId,artIdFor,drawMine,drawPeer,peerName,current,coatOf};
})();

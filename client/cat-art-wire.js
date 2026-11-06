/* Puts the new pixel-art playable cats (cat-pixel-art.js) into the game.
 * Replaces the engine's drawCat for the six playable cats (player,
 * companions, AI teammates, online players, cave/stage/arena) and, since
 * wave 2, every NPC, village neighbour and Wrangler that has a coat in
 * cat-pixel-art.js. Anything else (e.g. boss fallbacks) uses the original.
 *
 * Pose is worked out from how each drawn cat moves between frames:
 *   moving sideways  -> walk (run when fast), flipped when heading left
 *   moving up / down -> walkBack / walkFront
 *   standing still   -> idle (with blinks); sit after a long rest
 */
(()=>{'use strict';
const core=window.__catCityEngine,art=window.catCityCatArt;
if(!core||!art||typeof core.drawCat!=='function')return;
const original=core.drawCat;
const ID={astro:'astro',galaxy:'galaxy',baby:'baby',harley:'harley',skylar:'skylar',skyler:'skylar',pumpkin:'pumpkin'};
const tracks=[];
function track(id,x,y,now,mine=false){
 // Match this draw to the nearest recent cat of the same kind, so two
 // Astros (you and an online friend) keep separate animations.
 let best=null,bd=48;
 for(const t of tracks){if(t.id!==id||now-t.seen<1)continue;const d=Math.hypot(t.x-x,t.y-y);if(d<bd&&now-t.seen<400){bd=d;best=t}}
 if(!best){best={id,x,y,seen:now,vx:0,vy:0,facing:1,still:now,step:0,moving:false,dir:'side',want:null,wantAt:0,turn:null,turnAt:0};tracks.push(best);if(tracks.length>40)tracks.shift()}
 const dt=Math.max(1,now-best.seen);
 // Smoothed velocity. Follower cats make lots of tiny back-and-forth
 // corrections, so turning and pose changes use hysteresis (a change must
 // be clear and last a moment) instead of flipping every frame.
 // Your own cat reacts straight away (playtest: turning felt laggy); the
 // smoothing below is for follower/AI cats.
 const k=Math.min(1,dt/(mine?50:180));
 best.vx+=((x-best.x)/dt*1000-best.vx)*k;best.vy+=((y-best.y)/dt*1000-best.vy)*k;
 best.x=x;best.y=y;best.seen=now;
 // A second, slower average decides walking vs standing, so back-and-forth
 // nudges cancel out instead of toggling idle/walk every frame.
 const k2=Math.min(1,dt/(mine?70:350));best.sx=(best.sx||0)+(best.vx-(best.sx||0))*k2;best.sy=(best.sy||0)+(best.vy-(best.sy||0))*k2;
 const speed=Math.hypot(best.vx,best.vy),slow=Math.hypot(best.sx,best.sy);
 // Wandering cats stroll at only ~20–45 px/s, so the walk threshold is low (glitch report #46: they glided).
 if(slow>14){best.moving=true;best.stopAt=0}else if(best.moving&&slow<8){if(!best.stopAt)best.stopAt=now;else if(now-best.stopAt>150)best.moving=false}
 if(best.moving){best.still=now;best.step+=speed*dt/1000}
 // Facing left/right: only after clearly moving the other way for 220 ms.
 const face=best.sx<-35?-1:best.sx>35?1:best.facing;
 if(face!==best.facing){if(best.turn!==face){best.turn=face;best.turnAt=now}else if(now-best.turnAt>(mine?0:220)){best.facing=face;best.turn=null}}else best.turn=null;
 // Side vs front/back walking: needs a clear lean and 250 ms to switch.
 const ax=Math.abs(best.sx),ay=Math.abs(best.sy);
 const dir=ax>ay*1.25?'side':ay>ax*1.25?(best.sy<0?'back':'front'):best.dir;
 if(dir!==best.dir){if(best.want!==dir){best.want=dir;best.wantAt=now}else if(now-best.wantAt>(mine?40:250)){best.dir=dir;best.want=null}}else best.want=null;
 return best;
}
function pose(t,now){
 const speed=Math.hypot(t.vx,t.vy);
 if(t.moving){
  if(t.dir==='side'){const run=speed>230;return {pose:run?'run':'walk',frame:Math.floor(t.step/(run?14:9))%4,flip:t.facing<0}}
  return {pose:t.dir==='back'?'walkBack':'walkFront',frame:Math.floor(t.step/10)%2,flip:false};
 }
 if(now-t.still>9000)return {pose:'sit',frame:0,flip:false};
 return {pose:'idle',frame:(now%3600)<140?1:0,flip:false};
}
function drawCat(x,y,cat,scale=1,flag=false){
 const key=String(cat?.name||'').toLowerCase();
 // Character skins (skins.js): the owner skin draws itself; custom cats swap the coat.
 if(window.catCitySkins&&cat===core.cats[core.state.cat]&&window.catCitySkins.drawMine(core.ctx,x,y,scale))return;
 let id=window.catCitySkins?.artIdFor(cat)||ID[key]||(art.coats[key]?key:null); // wave 2: NPCs, village neighbours and Wranglers too
 // Story changes (taxi-escape.js): e.g. Biscuit becomes a small Birman after the castle mission.
 let aliasScale=1;const alias=id&&window.catCityArtAlias?.(id);if(alias){if(alias.hide)return;id=alias.id;aliasScale=alias.scale||1}
 // The Alien graphics pack and the Classic smooth art style keep the original cat look.
 if(!id||window.catCityArtStyle?.()==='classic'||document.getElementById('setting-world-pack')?.value==='alien')return original(x,y,cat,scale,flag);
 const now=performance.now(),ctx=core.ctx;
 // The old sprite's feet sit 15px (×scale) below its centre point.
 const fx=x,fy=y+14*scale;
 const t=track(id,fx,Math.round(fy),now,cat===core.cats[core.state.cat]),p=pose(t,now);
 ctx.save();ctx.fillStyle='#473b5560';ctx.beginPath();ctx.ellipse(fx,fy,14*scale,4.5*scale,0,0,Math.PI*2);ctx.fill();ctx.restore();
 // Wave 3: your equipped gear (weapon in paw, head, body, boots) on your own cat.
 const st=core.state,mine=cat===core.cats[st.cat];
 let gear=null,weapon=null;
 if(mine&&st.adventureEquipment){const byId=id=>(st.adventureItems||[]).find(it=>it&&it.id===id);const eq=st.adventureEquipment;gear={head:byId(eq.head),body:byId(eq.body),paws:byId(eq.paws)};weapon=byId(eq.weapon)||null;if(!gear.head&&!gear.body&&!gear.paws)gear=null}
 const at=art.draw(ctx,fx,fy,id,p.pose,p.frame,{scale:scale*1.2*aliasScale,flip:p.flip,gear,weapon});
 // Looks (hats, scarves, badges) for the six playable cats.
 const index=core.cats.indexOf(cat),fit=index>=0?st.catOutfits?.[index]:null;
 if(at&&fit&&(fit.hat||fit.neck||fit.badge)){ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  if(fit.hat){ctx.font=Math.round(17*scale)+'px system-ui';ctx.fillText(fit.hat,at.head.x,at.head.y)}
  if(fit.neck){ctx.font=Math.round(11*scale)+'px system-ui';ctx.fillText(fit.neck,at.neck.x,at.neck.y)}
  if(fit.badge){ctx.font=Math.round(10*scale)+'px system-ui';ctx.fillText(fit.badge,at.chest.x,at.chest.y)}
  ctx.restore()}
}
core.drawCat=drawCat;
window.catCityCatArtWired=true;
})();

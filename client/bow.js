/* Cat City — the Adventurer Bow everywhere (giant update).
 *
 * Shows a pixel arrow flying from you to the target, in boss fights and in the
 * main game, and lets other combat (Wrangler camps, infected kitties) use the
 * bow from range.
 *
 * API: catCityBow.equipped() → true if the bow is your weapon
 *      catCityBow.fire() → uses one arrow; false (with a note) if you have none
 *      catCityBow.shoot(x1,y1,x2,y2) → world-space arrow (main game)
 *      catCityBow.drawArrow(ctx,x1,y1,x2,y2,progress) → draw one arrow
 *      catCityBow.range → 360 px in the main game
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state;
const FLIGHT=180,RANGE=360;
const equipped=()=>s.adventureEquipment?.weapon==='owned:bow';
function fire(){
 if(!(s.ammoArrows>0)){core.note('🏹 No arrows! Craft more in Inventory (1 wood + 1 stone = 5 arrows).');return false}
 s.ammoArrows--;core.persist();window.catCityRefreshHotbar?.();return true;
}
// A small pixel arrow: shaft, steel tip and pink fletching, pointing along the flight.
function drawArrow(ctx,x1,y1,x2,y2,p){
 const x=x1+(x2-x1)*p,y=y1+(y2-y1)*p-Math.sin(p*Math.PI)*18,a=Math.atan2(y2-y1+(p<.5?-24:24)*(1-p),x2-x1);
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(a);ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#2a1d36';ctx.fillRect(-15,-2,28,4);
 ctx.fillStyle='#b98557';ctx.fillRect(-14,-1,24,2);
 ctx.fillStyle='#cfd8e6';ctx.fillRect(10,-2,4,4);ctx.fillStyle='#ffffff';ctx.fillRect(13,-1,2,2);
 ctx.fillStyle='#ff9fc9';ctx.fillRect(-15,-4,5,2);ctx.fillRect(-15,2,5,2);
 ctx.restore();
}
const flying=[];
function shoot(x1,y1,x2,y2){flying.push({x1,y1,x2,y2,at:performance.now()})}
const oldDraw=core.draw;
core.draw=function(){
 oldDraw();if(!flying.length||core.bossMode)return;
 const now=performance.now(),ctx=core.ctx,cx=s.x-core.W/2,cy=s.y-core.H/2;
 for(let i=flying.length-1;i>=0;i--){const f=flying[i],p=(now-f.at)/FLIGHT;if(p>=1){flying.splice(i,1);continue}
  drawArrow(ctx,f.x1-cx,f.y1-cy,f.x2-cx,f.y2-cy,p)}
};
// The first bow comes with a quiver of 10 arrows.
setInterval(()=>{if(s.adventureItems?.some(it=>it.id==='owned:bow')&&!s.bowQuiverGiven){s.bowQuiverGiven=true;s.ammoArrows=(Number(s.ammoArrows)||0)+10;core.persist();window.catCityRefreshHotbar?.();core.note('🏹 Your bow came with a quiver of 10 arrows!')}},1500);
window.catCityBow={equipped,fire,shoot,drawArrow,range:RANGE,flight:FLIGHT};
})();

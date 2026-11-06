/* Cat City HUD layout fix — stops on-screen buttons and panels overlapping.
 * Loaded last. Uses "html body #id" selectors so these rules win over the
 * earlier layered layout rules without editing them.
 *
 * Laptop / desktop (wider than 700px):
 *  - Change Cat and Shop sit below the compass instead of on top of it.
 *  - Keyboard help box moves to the bottom-right so it no longer covers
 *    the Quests button or character names (hidden in boss fights, where the
 *    Jump/Attack buttons sit there).
 *  - Left column is spaced out: Stamina, then Free Play objective, then the
 *    quest tracker card, then Squishems, so they don't stack on top of each
 *    other or touch the Online button on shorter laptop screens.
 * Phone (700px wide or less):
 *  - Compass is narrower and sits below Change Cat / Settings / Pause.
 *  - Squishems button moves into the free gap in the left column, so it no
 *    longer covers the first hotbar slots.
 */
(()=>{'use strict';
if(document.getElementById('cc-hud-layout-fix'))return;
const style=document.createElement('style');style.id='cc-hud-layout-fix';
style.textContent=[
 'html body.boss-fighting #help{display:none!important}',
 // The door hint is only a label: let taps reach the Enter button under it.
 'html body #poi-hint{pointer-events:none!important}',
 'html body.cc-in-interior-room #poi-hint{display:none!important}',
 '@media(min-width:701px){',
 ' html body #cat-switch,html body #shop-switch{top:84px!important}',
 ' html body #help{top:auto!important;bottom:12px!important;right:12px!important;z-index:5!important}',
 ' html body #cc-objective{top:172px!important}',
 ' html body #quest-tracker{top:272px!important}',
 ' html body #cc-sq-open{top:324px!important}',
 '}',
 '@media(max-width:700px){',
 ' html body #cat-compass{top:calc(58px + env(safe-area-inset-top,0px))!important;width:min(186px,48vw)!important;min-width:0!important;padding:3px 6px!important}',
 ' html body #cat-compass .points{font-size:11px!important;letter-spacing:1px!important}',
 ' html body #cat-compass .questdirection{font-size:9px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}',
 ' html body #cc-sq-open{top:calc(167px + env(safe-area-inset-top,0px))!important;left:8px!important;width:min(137px,43vw)!important;min-height:34px!important;padding:6px 8px!important;font-size:11px!important;text-align:left!important}',
 '}'
].join('\n');
document.head.append(style);
})();

// Desktop left column (playtest: "UI overlay on public servers"): the HUD box
// grew (level line), so it covered the stamina bar, and online the room badge
// landed on both. Stack the column so each box sits under the one above it.
(()=>{'use strict';
const ORDER=['hud','stamina-ui','catcity-online-status','cc-objective','cc-sq-open','cc-chat-float','catcity-online-open','cc-bag-button'];
// Narrower desktop windows: a slightly smaller HUD so it doesn't run into Change Cat / the compass.
const narrow=document.createElement('style');narrow.textContent='@media (min-width:761px) and (max-width:1100px){html body #hud{font-size:10.5px!important;line-height:1.35!important;max-width:calc(50vw - 175px)!important;width:auto!important;white-space:normal!important}}';document.head.append(narrow);
function stack(){
 if(innerWidth<=760)return;
 const placed=[];
 for(const id of ORDER){const el=document.getElementById(id);if(!el)continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;
  if(el.dataset.ccTop===undefined)el.dataset.ccTop=String(el.getBoundingClientRect().top);
  // Start from where this box normally sits, then only move it down if it
  // actually overlaps a box placed above it.
  const r0=el.getBoundingClientRect(),h=r0.height;let top=Number(el.dataset.ccTop);
  for(let n=0;n<4;n++){const hit=placed.find(p=>top<p.bottom+4&&top+h>p.top&&r0.left<p.right&&r0.right>p.left);if(!hit)break;top=hit.bottom+6}
  if(Math.abs(r0.top-top)>1){el.style.setProperty('top',top+'px','important');el.style.setProperty('bottom','auto','important')}
  const r=el.getBoundingClientRect();placed.push({top:r.top,bottom:r.bottom,left:r.left,right:r.right});}
}
setInterval(stack,500);addEventListener('resize',()=>{for(const id of ORDER){const el=document.getElementById(id);if(el){delete el.dataset.ccTop;el.style.removeProperty('top')}}stack()});
})();

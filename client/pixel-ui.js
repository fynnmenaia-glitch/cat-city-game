/* Cat City — pixel-art UI skin (giant update, wave 5).
 *
 * One look for every button and panel: square pixel corners with a notch
 * (made from stacked box-shadows, so nothing changes size or moves), a light
 * bevel on top and a dark one underneath, and buttons that press down when
 * tapped. Colours stay as each part already had them.
 * Turn it off with document.body.classList.add('cc-no-pixel-ui').
 */
(()=>{'use strict';
const D='#2a1d36';
// Notched outline: four offset solid shadows make a rectangle with the corner pixel missing.
const notch=(w,c)=>[`${-w}px 0 0 0 ${c}`,`${w}px 0 0 0 ${c}`,`0 ${-w}px 0 0 ${c}`,`0 ${w}px 0 0 ${c}`].join(',');
const bevel=(w,lite,dark)=>`inset ${w}px ${w}px 0 0 ${lite},inset ${-w}px ${-w}px 0 0 ${dark}`;
const PANELS=['#dialog','#settings-panel','#shop-menu','#save-panel','#cat-menu','#map-panel','#pause-panel','#wardrobe-panel','#interior-panel','#tycoon-panel','#activities-panel',
 '#catcity-online-panel','#cc-chat-card','#cc-qb-card','#cc-sq-card','#cc-ti-card','#cc-ti-board','#cc-ea-board','#world-inventory-card','#taghouse-mode-card',
 '#catcity-start-menu .title-card','#hud','#help','#stamina-ui','#toast','#boss-hud','#cc-takeover-say','#cc-global-announcement','#cc-event-chip','#quest-tracker','#day-cycle-label','.cc-panel','.cc-social-modal > div'];
const css=document.createElement('style');css.id='cc-pixel-ui';
css.textContent=`
body:not(.cc-no-pixel-ui) button:not(.pxe):not([data-no-pixel]){border-radius:0!important;box-shadow:${notch(2,D)},${bevel(2,'rgba(255,255,255,.35)','rgba(0,0,0,.22)')},0 5px 0 0 rgba(20,12,30,.55)!important;transition:transform .05s,box-shadow .05s;image-rendering:pixelated}
body:not(.cc-no-pixel-ui) button:not(.pxe):not([data-no-pixel]):active{transform:translateY(3px)!important;box-shadow:${notch(2,D)},${bevel(2,'rgba(0,0,0,.18)','rgba(255,255,255,.25)')},0 2px 0 0 rgba(20,12,30,.55)!important}
body:not(.cc-no-pixel-ui) button:not(.pxe):disabled{box-shadow:${notch(2,D)},0 3px 0 0 rgba(20,12,30,.4)!important}
body:not(.cc-no-pixel-ui) :is(${PANELS.join(',')}){border-radius:0!important;box-shadow:${notch(3,D)},${bevel(3,'rgba(255,255,255,.18)','rgba(0,0,0,.25)')},0 8px 0 0 rgba(12,8,22,.45)!important}
body:not(.cc-no-pixel-ui) :is(input,select,textarea){border-radius:0!important;box-shadow:${notch(2,D)},inset 2px 2px 0 0 rgba(0,0,0,.18)!important}
body:not(.cc-no-pixel-ui) :is(details > summary){border-radius:0!important}
/* Pixel scrollbars. */
body:not(.cc-no-pixel-ui) *::-webkit-scrollbar{width:10px;height:10px}
body:not(.cc-no-pixel-ui) *::-webkit-scrollbar-thumb{background:#bda2df;border:2px solid ${D}}
body:not(.cc-no-pixel-ui) *::-webkit-scrollbar-track{background:#2a1d3644}
`;
document.head.append(css);
})();

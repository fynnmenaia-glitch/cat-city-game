/* Cat City — Admin Abuse state.
 *
 * Admin Abuse is the owner running events live. The old "Admin Show" stage
 * portal was removed (Sofia, 4 Nov 2026); this file now only keeps everyone's
 * copy of the Admin Abuse state in sync, which other features read:
 *   Admin and Playtester lucky blocks, Baby's Squishem, the Birman Takeover.
 * Players still get two Admin Show Looks the first time they're online for
 * each Admin Abuse.
 *
 * API (unchanged names): window.catCityAdminStageState = {active, playtester, takeover, ...}
 *      catCityAdminStageInside() → always false · catCityEnterAdminStage() → no-op
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const $=id=>document.getElementById(id),s=core.state;
let stage={active:false,id:''};
function gift(){
 if(!stage.id)return;
 s.decorUnlocked=Array.isArray(s.decorUnlocked)?s.decorUnlocked:[];
 s.adminStageGiftIds=Array.isArray(s.adminStageGiftIds)?s.adminStageGiftIds:[];
 if(s.adminStageGiftIds.includes(stage.id))return;
 s.adminStageGiftIds.push(stage.id);
 for(const item of ['🎆','🪩'])if(!s.decorUnlocked.includes(item))s.decorUnlocked.push(item);
 core.persist();
 core.note('🎁 Admin Abuse gift: two exclusive Looks, 🎆 Firework Crown and 🪩 Disco Badge!');
}
function accept(next){
 if(!next||typeof next.active!=='boolean')return;
 const before=stage.active;
 stage={...stage,...next};window.catCityAdminStageState=stage;
 const btn=$('cc-admin-abuse');if(btn)btn.textContent=stage.active?'🛑 End Admin Abuse':'👑 Start Admin Abuse';
 if(stage.active&&!before){core.note(stage.takeover?.phase&&stage.takeover.phase!=='none'?'👑 Admin Abuse has started!':stage.playtester?'🧪 Playtester Admin Abuse has started!':'👑 Admin Abuse has started!');gift()}
}
// A small chip so everyone can see when Admin Abuse is on (it used to be easy to forget it was running).
const chip=document.createElement('div');chip.id='cc-abuse-chip';chip.setAttribute('aria-live','polite');
chip.style.cssText='display:none;position:fixed;left:50%;transform:translateX(-50%);bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:70;padding:4px 10px;font:bold 11px system-ui;background:#ffd45c;color:#2a1d36;border:2px solid #2a1d36;pointer-events:none';
document.body.append(chip);
setInterval(()=>{const on=!!stage.active&&!document.body.classList.contains('start-menu-open');chip.style.display=on?'block':'none';
 if(on)chip.textContent=stage.takeover?.phase==='taken'?'🎭 Birman Takeover is on':stage.playtester?'🧪 Playtester Admin Abuse is on':'👑 Admin Abuse is on'},1000);
window.catCityAdminStageState=stage;window.catCityAdminStageInside=()=>false;window.catCityEnterAdminStage=()=>{};
window.addEventListener('catcity:server',e=>{const m=e.detail;if(m?.type==='admin_stage'||m?.type==='admin_stage_position')accept(m.stage);});
async function poll(){try{const r=await fetch('/api/world-state',{cache:'no-store'});if(r.ok){const d=await r.json();if(d.stage)accept(d.stage);}}catch(e){}}
poll();setInterval(poll,4500);
})();

/* Cat City — levels and fair bosses.
 *
 * XP comes from playing: mining 8, chopping 6, picking things up 5, lucky
 * blocks 10, crafting 6, healing an infected kitty 25, each main quest step
 * 40, beating a boss 60–150 (practice fights give none). Each level needs a bit
 * more XP than the last; levelling up gives 10 fish coins per level.
 *
 * Fair bosses: when a boss fight starts, the boss's health (and how often it
 * attacks) is lowered if your level is low for that fight, or your weapon is
 * weak for it. It is never made harder, so good gear still pays off. Online
 * co-op Birman fights keep the shared server health (the Admin Birman, which
 * is always local, is balanced online too).
 *
 * API: catCityLevels.level() · .xp() · .need(level) · .add(amount, why)
 *      .set(level) (owner tools) · .balance(chapter) → {scale, level, weapon}
 */
(()=>{'use strict';
const core=window.__catCityEngine;if(!core)return;
const s=core.state;
s.level=Math.max(1,Math.min(99,Number(s.level)||1));s.xp=Math.max(0,Number(s.xp)||0);
const need=l=>Math.round(60*Math.pow(l,1.4));
function add(amount,why){
 amount=Math.round(amount);if(!(amount>0))return;s.xp+=amount;let up=0;
 while(s.level<99&&s.xp>=need(s.level)){s.xp-=need(s.level);s.level++;up++}
 if(up){const coins=10*s.level*up;s.fish=(Number(s.fish)||0)+coins;core.note('⭐ Level up! You are now level '+s.level+'! (+'+coins+' 🐟)');window.dispatchEvent(new CustomEvent('catcity:level-up',{detail:{level:s.level}}))}
 core.persist();
}
const XP={mine:8,chop:6,pickup:5,lucky:10,craft:6,heal:25};
window.addEventListener('catcity:adventure-action',e=>{const d=e.detail||{};if(d.tutorial)return;const v=XP[d.type];if(v)add(v,d.type)});
// Main quest progress.
let lastStage=Number(s.questStage)||0;
setInterval(()=>{const q=Number(s.questStage)||0;if(q>lastStage){add(40*(q-lastStage),'quest')}lastStage=q},1500);
// ------------------------------------------------------------------ fair bosses
// What each fight expects: a level and a sword damage (see gear-tiers.js).
const EXPECT={7:{level:3,dmg:2.5},11:{level:6,dmg:4},15:{level:9,dmg:5},19:{level:12,dmg:6},99:{level:8,dmg:3}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function balance(chapter){
 const ex=EXPECT[chapter];if(!ex)return {scale:1,level:s.level,weapon:1};
 const dmg=window.catCityHitDamage?.()||1;
 const lf=clamp(.55+.45*s.level/ex.level,.55,1),wf=clamp(dmg/ex.dmg,.5,1);
 return {scale:Math.max(.4,Math.round(lf*wf*100)/100),level:s.level,weapon:dmg,levelPart:lf,weaponPart:wf};
}
function weaponName(){const id=s.adventureEquipment?.weapon,it=(s.adventureItems||[]).find(x=>x&&x.id===id);return it?it.name:'no sword'}
// ------------------------------------------------------------------ level on screen
window.catCityLevelHud=()=>{const n=need(s.level),pct=Math.floor(s.xp/n*100);return '<br>⭐ Level '+s.level+' · '+pct+'% to '+(s.level+1)};
// ------------------------------------------------------------------ owner: skip to the end in practice
const skip=document.createElement('button');skip.type='button';skip.id='cc-skip-end';skip.textContent='⏭ Skip to end';
skip.style.cssText='display:none;position:fixed;right:10px;top:calc(120px + env(safe-area-inset-top,0px));z-index:960;padding:8px 12px;min-height:40px;font-weight:900;background:#ffd45c;color:#2a1d36;border:2px solid #fff';
document.body.append(skip);
skip.onclick=()=>{if(window.catCityBossAPI?.skipToEnd())core.note('⏭ Skipping to the end…')};
setInterval(()=>{const A=window.catCityBossAPI;skip.style.display=core.bossMode&&A?.practice&&window.catCityIsOwner?.()?'block':'none'},400);
window.catCityLevels={level:()=>s.level,xp:()=>s.xp,need,add,balance,weaponName,expect:EXPECT,
 set(l){s.level=clamp(Math.round(Number(l)||1),1,99);s.xp=0;core.persist();core.note('⭐ Level set to '+s.level)}};
})();

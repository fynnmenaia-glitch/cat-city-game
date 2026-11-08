/* Cat Tok part 5: the 🕐 game clock.
 * Cat City already has a day/night cycle (index.html: one day = 300 real seconds, worked out from
 * the real time so every player sees the same sky). This turns it into a clock with hours, minutes
 * and days of the week, shows it next to the day/night label and on the phone's status bar.
 *   window.catCityClock.now()        -> {day, weekday, hour, minute, text, label}
 *   window.catCityClock.realMs(hours) -> how many real milliseconds that many in-game hours take
 *   window.catCityClock.fmt(ms)       -> "about 1 in-game day" style text for a real duration
 * In-game midnight is when the night is darkest; noon is the brightest moment.
 */
(()=>{'use strict';
if(window.catCityClock)return;
const DAY_MS=300000,WEEK=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function now(at=Date.now()){const days=at/DAY_MS,day=Math.floor(days),frac=days-day,mins=Math.floor(frac*1440),hour=Math.floor(mins/60),minute=mins%60;
 const h12=hour%12||12,ampm=hour<12?'am':'pm',text=h12+':'+String(minute).padStart(2,'0')+' '+ampm;
 return{day,weekday:WEEK[((day%7)+7)%7],short:WEEK[((day%7)+7)%7].slice(0,3),hour,minute,frac,text,label:WEEK[((day%7)+7)%7].slice(0,3)+' '+text}}
const realMs=hours=>hours/24*DAY_MS;
function fmt(ms){const h=ms/DAY_MS*24;if(h<1.5)return Math.max(1,Math.round(h*60))+' in-game minutes';if(h<20)return Math.round(h)+' in-game hours';const d=Math.round(h/24*2)/2;return d===1?'1 in-game day':d+' in-game days'}
window.catCityClock={now,realMs,fmt,DAY_MS};

// Show the time next to the day/night label (it updates itself every 850 ms, so we add ours after it).
const css=document.createElement('style');css.textContent='#day-cycle-label .cc-clock{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:8px;background:#0003;font-variant-numeric:tabular-nums}';document.head.append(css);
function tick(){const c=now(),l=document.getElementById('day-cycle-label');
 if(l){let span=l.querySelector('.cc-clock');if(!span||!l.contains(span)){span=document.createElement('span');span.className='cc-clock';l.append(span)}const t='🕐 '+c.label;if(span.textContent!==t)span.textContent=t}
 const pc=document.getElementById('cc-phone-clock');if(pc){const t=c.text.replace(' ','');if(pc.textContent!==t)pc.textContent=t}}
tick();setInterval(tick,1000);
// The label and the phone clock rewrite their own text now and then: put the time straight back.
let busy=false;const mo=new MutationObserver(()=>{if(busy)return;busy=true;tick();busy=false});
function watch(){for(const id of ['day-cycle-label','cc-phone-clock']){const el=document.getElementById(id);if(el&&!el.dataset.ccClock){el.dataset.ccClock='1';mo.observe(el,{childList:true,characterData:true,subtree:true})}}}
watch();setInterval(watch,2000);
window.dispatchEvent(new CustomEvent('catcity:clock-ready'));
})();

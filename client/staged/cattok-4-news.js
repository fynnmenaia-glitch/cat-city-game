/* Cat Tok part 4: 📰 Cat City News, LIVE.
 * Anchor Pebble at the news desk, with field reports from reporter Luna out in the biomes.
 * Stories come from what really happens in your game (raids, knockouts, missions, the castle,
 * updates, events, boss fights, harvests…) plus everyday Cat City news. A red BREAKING NEWS
 * banner shows the story, and a ticker runs along the bottom.
 */
(()=>{'use strict';
const start=()=>{const T=window.CatTok;if(!T?.addLive||T.__news)return;T.__news=true;
const core=window.__catCityEngine,s=core.state,L=T.live;
const KEY='catcity_cattok_news';
let log=(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return []}})();
const me=()=>T.myName();
function add(kind,headline,line,place){if(log[0]?.headline===headline&&Date.now()-log[0].at<60000)return;log.unshift({kind,headline,line,place,at:Date.now()});log=log.slice(0,25);try{localStorage.setItem(KEY,JSON.stringify(log))}catch(e){}}
// Real things that happen in your game become news.
addEventListener('catcity:knockout',e=>{if(e.detail?.world)add('field','LOCAL CAT KNOCKED OUT IN THE WILD',me()+' was knocked out and woke up safe at home. Doctors say: eat a snack!','The Wilds')});
let defeated=0;addEventListener('catcity:wrangler-defeated',()=>{defeated++;if(defeated%3===0)add('field','WRANGLERS ON THE RUN',me()+' has sent '+defeated+' Wranglers packing today. The Poison Wastes are a little safer.','Poison Wastes')});
addEventListener('catcity:adventure-action',e=>{if(e.detail?.type==='harvest')add('desk','BUMPER HARVEST IN THE VILLAGE GARDEN','Fresh '+(e.detail.crop||'crops')+' spotted leaving the Village Garden. Cooking pots are bubbling!')});
addEventListener('catcity:cooked',()=>add('desk','SNACK TIME IN CAT CITY','Delicious smells reported near the cooking pot. Hearts are being refilled across town.'));
addEventListener('catcity:release',e=>{if(!e.detail?.preview)add('desk','NEW UPDATE LANDS IN CAT CITY','Something new has arrived! Cats are asked to look around and explore.')});
let lastEvent='',boss=false,raid=false;
setInterval(()=>{const ev=window.catCityAdminEvent;const name=ev&&ev.endsAt*1000>Date.now()?ev.name:'';
 if(name&&name!==lastEvent){if(name==='wrangler_raid')add('field','⚠ WRANGLER RAID ON THE VILLAGE','Wranglers are storming Cat City! Every cat is asked to defend the village.','Cat City Village');else add('desk','LIVE EVENT: '+String(ev.title||name).replace(/_/g,' ').toUpperCase(),'A special event has started across Cat City. Don\'t miss it!')}lastEvent=name;
 if(core.bossMode&&!boss)add('field','BOSS BIRMAN SIGHTING','Reports of a huge fight with a Birman! Our reporter is keeping a safe distance.','Birman Arena');boss=!!core.bossMode;
 const C=s.castle||{};if(C.m3&&!s.__newsM3){s.__newsM3=true;add('desk','THE BOSS IS DEFEATED','Cat City celebrates after the Boss Birman was beaten at his fortress. Biscuit is home safe.')}
 if(s.villageCastle?.done&&!s.__newsCastle){s.__newsCastle=true;add('field','VILLAGE CASTLE COMPLETE','Builders worked all night. Cat City now has its very own castle walls!','The South Gate')}
 if(s.m4?.stage==='done'&&!s.__newsM4){s.__newsM4=true;add('desk','ADMIN PANEL BACK ONLINE','The Admin\'s panel is working again… and it shows an empty castle in the sky.')}
},4000);
// Everyday Cat City news fills the rest of the bulletin.
const DAILY=[
 ['desk','FISH PRICES SWIM HIGHER','Marmalade says golden fish are flying off the shelves this week.'],
 ['field','SQUISHEMS SPOTTED IN THE MARSH','Witnesses say a Squishem waved at them before hopping into the reeds.','Lily Marsh'],
 ['desk','LIBRARY ANNOUNCES LORE NIGHT','Pebble invites everyone to read about the Birman Family this weekend.'],
 ['field','CHERRY BLOSSOMS IN FULL BLOOM','The Cherry Grove is pink from end to end. Perfect for photos!','Cherry Grove'],
 ['desk','WEATHER: GOLDEN HOUR TONIGHT','Expect warm light, long shadows and very sleepy cats.'],
 ['field','MYSTERY TAXI SEEN AT DUSK','A taxi with no driver was spotted near the wild roads. Locals say: don\'t get in.','The Wild Roads'],
 ['desk','FORGE OPENS NEW ARMOUR LINE','Forge says the new steel is "shinier than a fish scale".'],
 ['field','FLOWER TERRACE BLOOMS GLOW','Luna reports Coconut Flowers glowing under the moon.','Flower Terrace'],
 ['desk','SLAYCAT LAUNCHES GLOW-UP SALAD','SlayCat\'s new salad is "iconic", says SlayCat.'],
 ['desk','BISCUIT STILL THE CUTEST?','A new poll says Biscuit is still Cat City\'s most-loved cat.']
];
function bulletin(){const real=log.slice(0,6).map(x=>[x.kind,x.headline,x.line,x.place]);const r=T.rng(String(Math.floor(Date.now()/600000)));const daily=DAILY.slice().sort(()=>r()-.5).slice(0,6);const out=[];for(let i=0;i<8;i++){const a=real[i],b=daily[i];if(a)out.push(a);if(b)out.push(b)}return out}
const SEG=9; // seconds per story
const PLACES={'Poison Wastes':['#3a2a4a','#6b3f7a','#4f3a5e'],'Cherry Grove':['#f7cfdc','#e998b9','#f2b8cf'],'Lily Marsh':['#9fd1c0','#4f7f6a','#6fa38a'],'Flower Terrace':['#c9e9a8','#6fae5f','#8fd17a'],'Cat City Village':['#bfe3ff','#6fae5f','#d9c39a'],'The South Gate':['#bfe3ff','#8d88a6','#6fae5f'],'Birman Arena':['#3b2557','#7a52b8','#2a1840'],'The Wilds':['#bfe3ff','#4f8f45','#6fae5f'],'The Wild Roads':['#ffb37a','#5d4a6e','#7a6a5a']};
function draw(g,W,Hh,t,live){const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const stories=draw.cache&&Date.now()-draw.cacheAt<20000?draw.cache:(draw.cache=bulletin(),draw.cacheAt=Date.now(),draw.cache);
 const i=Math.floor(t/SEG)%stories.length,st=stories[i],lt=t%SEG,field=st[0]==='field';
 if(!field){
  // The studio: a night-time Cat City view behind the anchor, desk, CC NEWS logo.
  for(let y=0;y<Hh*.62;y+=3){const q=y/(Hh*.62);R(0,y,W,3,'rgb('+Math.round(18+q*30)+','+Math.round(30+q*40)+','+Math.round(70+q*60)+')')}
  R(10,46,W-20,110,'#0d1430');for(let k=0;k<26;k++)R(14+(k*37)%(W-28),50+(k*13)%40,1,1,'#fff8');
  for(const [x,w,h,c] of [[16,30,36,'#f5b4a5'],[52,34,44,'#c9b2ed'],[92,28,32,'#9ad7cf'],[126,36,40,'#f4c879']]){R(x,156-h,w,h,c);R(x+4,156-h+6,6,6,'#ffe9a8');R(x+w-10,156-h+6,6,6,'#ffe9a8');R(x-2,156-h-6,w+4,6,'#5b4a7a')}
  R(10,46,W-20,2,'#7fb0ff');R(10,154,W-20,2,'#7fb0ff');L.studioLight(g,W,Hh,t);
  R(0,Hh*.62,W,Hh*.38,'#141a33');
  const bob=Math.sin(t*2)*.6;L.cat(g,'pebble',W*.5,Hh*.6+bob,2.6,'idle',t);
  // desk
  R(8,Hh*.56,W-16,46,'#1e2a5a');R(8,Hh*.56,W-16,4,'#7fb0ff');R(W/2-34,Hh*.56+12,68,22,'#c9302c');g.font='bold 11px "Cat City Pixel",monospace';g.textAlign='center';g.fillStyle='#fff';g.fillText('CC NEWS',W/2,Hh*.56+27);
  R(W-46,Hh*.56-14,30,14,'#d9d9e8');R(W-44,Hh*.56-12,26,10,'#0d1430');
  if(lt>.6&&lt<SEG-1)L.bubble(g,W,W*.5,Hh*.43,st[2],{size:8});
 }else{
  // Field report: reporter Luna with a microphone, in the place the story happened.
  const pc=PLACES[st[3]]||PLACES['The Wilds'];for(let y=0;y<Hh*.55;y+=3){const q=y/(Hh*.55);g.fillStyle=T.mix(pc[0],'#ffffff',q*.3);g.fillRect(0,y,W,3)}
  R(0,Hh*.55,W,Hh*.45,pc[1]);for(let k=0;k<14;k++)R((k*41+7)%W,Hh*.58+(k*23)%60,6,3,pc[2]);
  if(st[3]==='Poison Wastes'||st[3]==='Cat City Village'){const wx=W*.8+Math.sin(t*1.4)*12;L.cat(g,'wrangler',wx,Hh*.7,1.6,'walk',t,{frame:Math.floor(t*6)%4,flip:true})}
  if(st[3]==='Birman Arena')L.cat(g,'birman:king',W*.78,Hh*.7,2,'idle',t);
  L.cat(g,'luna',W*.36,Hh*.78,2.5,'idle',t);R(W*.36+14,Hh*.78-40,3,14,'#333');R(W*.36+12,Hh*.78-46,7,7,'#111');
  R(8,62,92,14,'#c9302c');g.font='bold 8px "Cat City Pixel",monospace';g.textAlign='left';g.fillStyle='#fff';g.fillText('📍 LIVE · '+(st[3]||'CAT CITY').toUpperCase(),12,72);
  if(lt>.6&&lt<SEG-1)L.bubble(g,W,W*.42,Hh*.6,st[2],{size:8});
 }
 // "LIVE" bug + clock
 if(!live?.inRoom){R(W-40,62,32,13,'#c9302c');g.font='bold 8px "Cat City Pixel",monospace';g.textAlign='center';g.fillStyle='#fff';g.fillText('● LIVE',W-24,72)}
 // Breaking news banner, then the ticker.
 // Inside the live room the bottom is full of comments, so the banner sits up top under the host bar.
 const by=live?.inRoom?Math.round(Hh*.22):Hh-60,slide=Math.min(1,lt/.4);R(0,by,W,30,'#fff');R(0,by,Math.round(70*slide),12,'#c9302c');g.font='bold 7px "Cat City Pixel",monospace';g.textAlign='left';g.fillStyle='#fff';if(slide>.8)g.fillText('BREAKING NEWS',4,by+9);
 g.fillStyle='#111';g.font='bold 9px "Cat City Pixel",monospace';const head=st[1];let hs=9;while(g.measureText(head).width>W-8&&hs>6){hs--;g.font='bold '+hs+'px "Cat City Pixel",monospace'}g.fillText(head,4,by+24);
 L.ticker(g,W,by+30,12,stories.map(x=>x[1]).join('   •   ')+'   •   CAT CITY NEWS — WE COVER EVERY WHISKER',t,{bg:'#1e2a5a',size:7,speed:24});
}
T.addLive({id:'live-news',author:'catcitynews',avatar:'pebble',verified:true,pin:1,caption:'🔴 LIVE: Breaking news from Cat City 📰 #news #catcity #live',viewers:[1800,5200],hourly:'News ranking #1',
 welcome:'Welcome to Cat City News LIVE 📰 Stories update as things happen in your game!',
 comments:['what happened??','is the raid real 😱','go Luna!','Pebble looks so professional','breaking news: I\'m hungry','I was there!!','stay safe everyone','omg the castle','more news pls','first 📰'],
 quickComments:['Was that me?! 😮','Stay safe Luna!','Great report!'],
 draw});
};
if(window.CatTok?.addLive)start();else addEventListener('catcity:cattok-lives-ready',start,{once:true});
})();

/* Cat City — voice lines that play outside the tutorial (Birman Takeover w01–w05).
 *
 * Phones (iPhone especially) block sound that doesn't start from a tap, so a
 * new <audio> made in the middle of a cutscene stays silent. These lines play
 * through the game's Web Audio context instead (the same one as the music,
 * unlocked by your first tap), and are downloaded ahead of time so they start
 * instantly. If Web Audio isn't available, one shared <audio> element that was
 * unlocked on your first tap is used.
 *
 * API: catCityVoice.play('w02') · catCityVoice.preload(['w01', ...])
 */
(()=>{'use strict';
const buffers=new Map(),loading=new Map();
const ctx=()=>{const c=window.catCityAudio?.ctx?.();return c&&c.state==='running'?c:null};
function load(id){
 if(buffers.has(id))return Promise.resolve(buffers.get(id));if(loading.has(id))return loading.get(id);
 const p=fetch('/voice/'+id+'.m4a').then(r=>{if(!r.ok)throw Error('missing');return r.arrayBuffer()}).then(data=>{
  const c=window.catCityAudio?.ctx?.();if(!c)throw Error('no audio yet');
  return new Promise((ok,bad)=>c.decodeAudioData(data,ok,bad))}).then(buf=>{buffers.set(id,buf);loading.delete(id);return buf}).catch(e=>{loading.delete(id);throw e});
 loading.set(id,p);return p;
}
// One shared <audio> element, unlocked on the first tap (fallback only).
// A tiny silent clip: unlocking sound must never play a real line (it used to use w02, which could be heard on start-up).
const SILENCE='data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const el=document.createElement('audio');el.setAttribute('playsinline','');el.preload='auto';let unlocked=false;
function unlock(){if(unlocked)return;unlocked=true;try{el.muted=true;el.src=SILENCE;const p=el.play();if(p&&p.then)p.then(()=>{el.pause();el.muted=false}).catch(()=>{el.muted=false})}catch(e){}}
addEventListener('pointerdown',unlock,{once:true,passive:true});addEventListener('keydown',unlock,{once:true,passive:true});
let current=null;
async function play(id){
 if(!id)return;
 try{
  const c=ctx();
  if(c){const buf=await load(id);if(current){try{current.stop()}catch(e){}}
   const src=c.createBufferSource(),g=c.createGain();g.gain.value=1.1;src.buffer=buf;src.connect(g);g.connect(c.destination);src.start();current=src;src.onended=()=>{if(current===src)current=null};return}
 }catch(e){}
 try{el.muted=false;el.src='/voice/'+id+'.m4a';el.currentTime=0;await el.play()}catch(e){}
}
// Download the Birman lines once sound is unlocked, so they're ready for the cutscenes.
const preload=list=>list.forEach(id=>load(id).catch(()=>{}));
const iv=setInterval(()=>{if(ctx()){preload(['w01','w02','w03','w04','w05']);clearInterval(iv)}},2000);
window.catCityVoice={play,preload};
})();

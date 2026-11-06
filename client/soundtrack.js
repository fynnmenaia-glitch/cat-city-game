/* Cat City — original Terraria-style soundtrack (giant update).
 *
 * A small 16-bit style synth (pulse lead, triangle bass, chord arpeggios, a
 * soft pad, noise drums) plays one original 8-bar song per place. Every
 * melody here was written for Cat City; none are taken from Terraria or any
 * other game, they just share that bouncy chiptune-adventure feel.
 *
 * Themes: menu, town, explore (wild), cherry, marsh, terrace (Flower
 * Terrace), poison, cave, battle, finale (Double Birman, 128 BPM to match its
 * beat) and takeover (Admin Birman).
 * Uses world-overhaul.js's audio context, music switch and volume
 * (window.catCityAudio); while this file is loaded the old 16-note loops stay quiet.
 *
 * Song format: 16 steps per bar. Melody tokens: a note ("C#5"), "-" to hold
 * the previous note, "." for a rest. Drums: k kick, s snare, h hat.
 * API: catCitySoundtrack.songs · catCitySoundtrack.theme() · catCitySoundtrack.extra(name, song)
 */
(()=>{'use strict';
const A=()=>window.catCityAudio;
const NOTE={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
const hz=n=>{const m=/^([A-G](?:#|b)?)(-?\d)$/.exec(n);if(!m)return 0;return 440*Math.pow(2,(NOTE[m[1]]+12*(+m[2]+1)-69)/12)};
const CHORD={'':[0,4,7],m:[0,3,7],'7':[0,4,7,10],m7:[0,3,7,10],maj7:[0,4,7,11],sus4:[0,5,7],dim:[0,3,6]};
function chordNotes(sym,oct){const m=/^([A-G](?:#|b)?)(.*)$/.exec(sym);const root=NOTE[m[1]]+12*(oct+1);return (CHORD[m[2]]||CHORD['']).map(i=>440*Math.pow(2,(root+i-69)/12))}
const bars=s=>s.trim().split(/\s*\|\s*/).map(b=>{const t=b.split(/\s+/);while(t.length<16)t.push('-');return t.slice(0,16)});
// ------------------------------------------------------------------ songs (all original)
const SONGS={
 menu:{name:'Cat City Theme',bpm:100,chords:['Bb','F','Gm','Eb','Bb','F','Eb','F'],lead:'square',pad:true,arp:[0,1,2,1],drums:'k.......s.......',hat:'..h...h...h...h.',
  mel:bars(`D5 - - - F5 - - - Bb5 - - - A5 - G5 - | F5 - - - C5 - - - F5 - G5 - A5 - - - | G5 - - - D5 - G5 - Bb5 - A5 - G5 - F5 - | Eb5 - - - G5 - - - F5 - - - - - . . |
   Bb4 - D5 - F5 - - - Bb5 - - - C6 - D6 - | C6 - - - A5 - F5 - A5 - C6 - - - - - | Bb5 - - - G5 - Eb5 - G5 - Bb5 - Eb6 - D6 - | C6 - - - - - - - . . . . . . . .`)},
 town:{name:'Whisker Lane',bpm:92,chords:['F','Dm','Bb','C','F','Am','Bb','C'],lead:'triangle',pad:true,arp:[0,2,1,2],drums:'k.......k.......',hat:'....h.......h...',soft:true,
  mel:bars(`A4 - - C5 - - F5 - E5 - D5 - C5 - - - | D5 - - F5 - - A5 - G5 - F5 - E5 - D5 - | D5 - - - C5 - Bb4 - C5 - D5 - F5 - - - | E5 - - - G5 - - - E5 - C5 - - - - - |
   A4 - C5 - F5 - - - G5 - A5 - G5 - F5 - | E5 - - - C5 - E5 - A5 - - - G5 - - - | F5 - D5 - Bb4 - D5 - F5 - G5 - A5 - - - | G5 - - - E5 - C5 - F5 - - - - - - -`)},
 explore:{name:'Over the Next Hill',bpm:124,chords:['G','D','Em','C','G','D','C','D'],lead:'square',arp:[0,1,2,1],drums:'k...s...k.k.s...',hat:'h.h.h.h.h.h.h.h.',
  mel:bars(`G4 . B4 D5 - - G5 - F#5 - D5 - B4 - D5 - | A4 - - D5 - - F#5 - A5 - - G5 F#5 - E5 - | E5 - G5 - B5 - - - A5 - G5 - F#5 - E5 - | C5 - E5 - G5 - - - E5 - D5 - C5 - B4 - |
   D5 - - G5 - - B5 - A5 - G5 - D5 - - - | F#5 - A5 - D6 - - - C6 - A5 - F#5 - - - | E5 - G5 - C6 - B5 - A5 - G5 - E5 - G5 - | F#5 - - - A5 - - - D5 - - - . . . .`)},
 cherry:{name:'Petal Breeze',bpm:104,chords:['D','Bm','G','A','D','F#m','G','A'],lead:'sine',bell:true,pad:true,arp:[0,1,2,3],drums:'k.......s.......',hat:'..h...h...h...h.',
  mel:bars(`F#5 - A5 - D6 - - - A5 - F#5 - E5 - D5 - | B4 - D5 - F#5 - - - E5 - D5 - C#5 - B4 - | G5 - - - F#5 - E5 - D5 - E5 - F#5 - G5 - | A5 - - - - - E5 - C#5 - - - - - . . |
   D5 - F#5 - A5 - B5 - A5 - F#5 - D5 - - - | C#5 - F#5 - A5 - - - G#5 - F#5 - E5 - - - | B4 - D5 - G5 - - - F#5 - E5 - D5 - E5 - | C#5 - - - E5 - - - D5 - - - - - - -`)},
 marsh:{name:'Lily Pads',bpm:98,chords:['Bb','Ab','Bb','F','Bb','Ab','Eb','F'],lead:'triangle',arp:[0,2,1,2],drums:'k..k..s.k..k..s.',hat:'h..h..h.h..h..h.',
  mel:bars(`F5 - - D5 - - Bb4 - C5 - D5 - F5 - - - | Eb5 - - C5 - - Ab4 - C5 - Eb5 - - - - - | D5 - F5 - Bb5 - - - Ab5 - F5 - D5 - - - | C5 - - - A4 - - - F4 - - - . . . . |
   Bb4 - D5 - F5 - Ab5 - F5 - D5 - Bb4 - - - | C5 - Eb5 - Ab5 - - - G5 - Eb5 - C5 - - - | Bb4 - - - G5 - - - Eb5 - F5 - G5 - - - | A4 - C5 - F5 - - - - - - - . . . .`)},
 terrace:{name:'Blooming Steps',bpm:116,chords:['C','Am','F','G','C','Em','F','G'],lead:'square',pad:true,arp:[0,1,2,1],drums:'k...s...k...s.k.',hat:'h.h.h.h.h.h.h.h.',
  mel:bars(`E5 - G5 - C6 - - - B5 - G5 - E5 - - - | C5 - E5 - A5 - - - G5 - E5 - C5 - - - | A5 - - - F5 - A5 - C6 - - - A5 - F5 - | G5 - - - D5 - G5 - B5 - - - - - . . |
   C6 - B5 - G5 - E5 - G5 - - - C6 - - - | B5 - G5 - E5 - B4 - E5 - G5 - - - - - | A5 - - - C6 - A5 - F5 - A5 - G5 - F5 - | D5 - G5 - B5 - D6 - C6 - - - - - - -`)},
 poison:{name:'Toxic Bog',bpm:96,chords:['Em','C','Em','B','Em','Am','C','B'],lead:'square',wobble:true,arp:[0,2,1,0],drums:'k.....k.s.......',hat:'......h.......h.',dark:true,
  mel:bars(`E4 - - G4 - - B4 - A#4 - B4 - . . . . | C5 - - B4 - - G4 - E4 - - - . . . . | E4 - G4 - B4 - E5 - D#5 - - - B4 - - - | F#4 - A4 - B4 - - - D#5 - - - . . . . |
   E5 - - D5 - - B4 - G4 - - - A4 - B4 - | C5 - - - A4 - - - E4 - F4 - E4 - - - | G4 - - - E4 - G4 - C5 - B4 - G4 - - - | F#4 - - - D#4 - - - B3 - - - . . . .`)},
 cave:{name:'Crystal Echo',bpm:78,chords:['Am','F','C','G','Am','F','Em','Am'],lead:'triangle',echo:true,pad:true,arp:[0,1,2,3],drums:'................',hat:'................',
  mel:bars(`E5 - - - - - - - C5 - - - D5 - - - | A4 - - - - - - - . . . . C5 - B4 - | G4 - - - - - - - E5 - - - D5 - - - | B4 - - - - - - - . . . . . . . . |
   A5 - - - G5 - - - E5 - - - C5 - - - | F5 - - - - - - - A4 - - - C5 - - - | B4 - - - - - - - G4 - - - E4 - - - | A4 - - - - - - - . . . . . . . .`)},
 battle:{name:'Claws Out',bpm:152,chords:['Cm','Ab','Bb','G','Cm','Ab','Eb','G'],lead:'square',arp:[0,1,2,1],drums:'k...s...k.k.s...',hat:'hhhhhhhhhhhhhhhh',bassOct:true,
  mel:bars(`C5 - C5 . Eb5 - G5 - C6 - - - Bb5 - G5 - | Ab5 - - - G5 - Eb5 - C5 - - - Eb5 - F5 - | D5 - F5 - Bb5 - - - Ab5 - G5 - F5 - D5 - | B4 - D5 - G5 - - - F5 - D5 - B4 - G4 - |
   G5 - - - G5 - Ab5 - G5 - F5 - Eb5 - D5 - | C5 - Eb5 - Ab5 - - - G5 - Ab5 - C6 - - - | Bb5 - - - G5 - Eb5 - G5 - Bb5 - Eb6 - - - | D6 - - - B5 - - - G5 - - - B5 . D6 .`)},
 finale:{name:'Showdown Waltz of Yarn',bpm:128,chords:['Fm','Db','Eb','C','Fm','Db','Bbm','C'],lead:'square',arp:[0,1,2,1],drums:'................',hat:'h.h.h.h.h.h.h.h.',bassOct:true,
  mel:bars(`F5 - Ab5 - C6 - - - Bb5 - Ab5 - G5 - F5 - | Db5 - F5 - Ab5 - - - G5 - F5 - Eb5 - Db5 - | Eb5 - G5 - Bb5 - - - Ab5 - G5 - F5 - Eb5 - | E5 - - - G5 - - - C6 - - - Bb5 - G5 - |
   F5 - - - C6 - - - Ab5 - - - F5 - - - | Db6 - - - Ab5 - - - F5 - Ab5 - Db6 - - - | Bb5 - - - F5 - Db5 - F5 - Bb5 - Db6 - C6 - | C6 - - - - - - - E5 - G5 - C6 - - -`)},
 // Missions (taxi-escape.js): Birman Castle, the floating islands, the Locket, No Return, and the Boss Birman fight.
 castle:{name:'Castle of Whispers',bpm:108,chords:['Dm','Bb','Gm','A','Dm','Bb','Gm','A'],lead:'triangle',pad:true,arp:[0,1,2,1],drums:'k.......k...s...',hat:'..h...h...h...h.',dark:true,
  mel:bars(`D5 - - . F5 - . . A5 - G5 - F5 - E5 - | D5 - - - Bb4 - - - D5 - F5 - - - . . | G4 - Bb4 - D5 - - - C#5 - D5 - E5 - - - | A4 - - - C#5 - E5 - A5 - - - . . . . |
   F5 - - . A5 - . . D6 - C6 - A5 - F5 - | Bb5 - - - A5 - F5 - D5 - - - F5 - G5 - | Bb5 - A5 - G5 - - - E5 - G5 - Bb5 - - - | A5 - - - E5 - - - C#5 - - - . . . .`)},
 islands:{name:'Floating Isles',bpm:132,chords:['G','Em','C','D','G','Bm','C','D'],lead:'square',pad:true,arp:[0,1,2,3],drums:'k...s...k.k.s...',hat:'h.h.h.h.h.h.h.h.',
  mel:bars(`B4 - D5 - G5 - - - A5 - B5 - A5 - G5 - | E5 - G5 - B5 - - - A5 - G5 - E5 - - - | C5 - E5 - G5 - C6 - B5 - A5 - G5 - E5 - | F#5 - - - A5 - - - D6 - - - . . . . |
   G5 - B5 - D6 - - - C6 - B5 - A5 - G5 - | F#5 - B5 - D6 - - - B5 - A5 - F#5 - - - | E5 - G5 - C6 - - - B5 - G5 - E5 - G5 - | A5 - - - F#5 - - - G5 - - - . . . .`)},
 locket:{name:'The Locket',bpm:84,chords:['Am','F','C','E','Am','Dm','E','Am'],lead:'sine',bell:true,pad:true,echo:true,arp:[0,1,2,1],drums:'................',hat:'........h.......',dark:true,
  mel:bars(`E5 - - - - - C5 - A4 - - - B4 - C5 - | C5 - - - A4 - - - F4 - - - . . . . | G4 - C5 - E5 - - - D5 - C5 - G4 - - - | G#4 - - - B4 - - - E5 - - - . . . . |
   A5 - - - G5 - E5 - C5 - - - E5 - - - | F5 - - - D5 - A4 - D5 - F5 - A5 - - - | G#5 - - - E5 - - - B4 - D5 - E5 - - - | A4 - - - - - - - . . . . . . . .`)},
 noreturn:{name:'No Return',bpm:140,chords:['Cm','Ab','Eb','Bb','Cm','Ab','Fm','G'],lead:'square',pad:true,arp:[0,1,2,1],drums:'k...s...k.k.s...',hat:'h.h.h.h.h.h.h.h.',bassOct:true,
  mel:bars(`G4 - C5 - Eb5 - G5 - - - F5 - Eb5 - D5 - | C5 - Eb5 - Ab5 - - - G5 - F5 - Eb5 - - - | Bb4 - Eb5 - G5 - Bb5 - - - Ab5 - G5 - F5 - | D5 - F5 - Bb5 - - - D6 - - - . . . . |
   C6 - - - G5 - Eb5 - C5 - Eb5 - G5 - C6 - | Ab5 - - - Eb5 - C5 - Ab4 - C5 - Eb5 - Ab5 - | F5 - Ab5 - C6 - - - Bb5 - Ab5 - G5 - F5 - | G5 - - - B5 - - - D6 - - - G5 . B5 .`)},
 bossbirman:{name:'Locket Breaker',bpm:160,chords:['Dm','Bb','C','A','Dm','Bb','Gm','A'],lead:'square',arp:[0,1,2,1],drums:'k.k.s...k.k.s.k.',hat:'hhhhhhhhhhhhhhhh',bassOct:true,dark:true,
  mel:bars(`D5 D5 . D5 F5 . A5 . D6 - C6 - A5 - F5 - | Bb5 - - - F5 - D5 - F5 - Bb5 - A5 - F5 - | C6 - G5 - E5 - G5 - C6 - D6 - E6 - - - | C#6 - - - A5 - E5 - A5 - C#6 - E6 - - - |
   F6 - - - D6 - A5 - D6 - F6 - E6 - D6 - | D6 - - - Bb5 - F5 - Bb5 - D6 - C6 - Bb5 - | G5 - Bb5 - D6 - - - C6 - Bb5 - A5 - G5 - | A5 - - - C#6 - - - E6 - - - . . . .`)},
 takeover:{name:'Admin Abuse',bpm:168,chords:['Em','C','D','B','Em','C','Am','B'],lead:'square',glitch:true,arp:[0,1,2,1],drums:'k.k.s...k.k.s.k.',hat:'hhhhhhhhhhhhhhhh',bassOct:true,dark:true,
  mel:bars(`E5 E5 . E5 G5 . B5 . E6 - D6 - B5 - G5 - | C6 - - - G5 - E5 - G5 - C6 - B5 - G5 - | D6 - A5 - F#5 - A5 - D6 - E6 - F#6 - - - | D#6 - - - B5 - F#5 - B5 - D#6 - F#6 - - - |
   G6 - - - E6 - B5 - E6 - G6 - F#6 - E6 - | E6 - - - C6 - G5 - C6 - E6 - D6 - C6 - | A5 - C6 - E6 - - - D6 - C6 - B5 - A5 - | B5 - - - D#6 - - - F#6 - - - . . . .`)}
};
// Which song for where you are.
function theme(){
 const a=A();if(!a)return null;
 const core=window.__catCityEngine,b=document.body;
 // Missions own the music while they're open (taxi-escape.js). Kept separate from the TV Glitch override,
 // which tv-glitch.js resets every 700 ms — sharing one variable made mission music stop and restart.
 if(window.catCityMissionMusic)return window.catCityMissionMusic;
 if(window.catCitySoundtrackOverride)return window.catCitySoundtrackOverride; // e.g. the TV Glitch event
 if(document.getElementById('catcity-start-menu')?.classList.contains('show'))return 'menu';
 if(core?.bossMode){const ch=core.bossChapter;return ch===99?'takeover':ch===19?'finale':'battle'}
 if(window.catCityCaveState?.().inside)return 'cave';
 // Garden, homes and the Wrangler raid (cozy-update.js).
 {const hint=window.catCityMusicHint?.();if(hint&&SONGS[hint])return hint}
 if(b.classList.contains('in-interior'))return 'town';
 const area=a.biome?.()||'town';
 return area==='town'?'town':area==='cherry'?'cherry':area==='poison'?'poison':area==='marsh'?'marsh':area==='moonstone'?'terrace':'explore';
}
// ------------------------------------------------------------------ synth
let noise=null;
function noiseBuf(ctx){if(noise)return noise;const b=ctx.createBuffer(1,ctx.sampleRate*.5,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return noise=b}
let delay=null;
function echoBus(ctx,out){if(delay)return delay;const d=ctx.createDelay(1),fb=ctx.createGain(),wet=ctx.createGain();d.delayTime.value=.36;fb.gain.value=.38;wet.gain.value=.5;d.connect(fb);fb.connect(d);d.connect(wet);wet.connect(out);delay=d;return d}
function tone(ctx,out,freq,when,dur,vol,type,opts={}){
 if(!freq)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,when);
 if(opts.vibrato){const l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=opts.vibrato;lg.gain.value=freq*.012;l.connect(lg);lg.connect(o.frequency);l.start(when+.08);l.stop(when+dur+.05)}
 if(opts.slide)o.frequency.exponentialRampToValueAtTime(freq*opts.slide,when+dur);
 let node=o;if(opts.lp){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=opts.lp;o.connect(f);node=f}
 g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(vol,when+(opts.attack||.008));g.gain.setValueAtTime(vol,when+Math.max(.01,dur*.6));g.gain.exponentialRampToValueAtTime(.0001,when+dur);
 node.connect(g);g.connect(out);if(opts.echo)g.connect(opts.echo);o.start(when);o.stop(when+dur+.05);
}
function drum(ctx,out,kind,when,vol){
 if(kind==='k'){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(150,when);o.frequency.exponentialRampToValueAtTime(42,when+.12);g.gain.setValueAtTime(vol*1.4,when);g.gain.exponentialRampToValueAtTime(.0001,when+.16);o.connect(g);g.connect(out);o.start(when);o.stop(when+.2);return}
 const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=noiseBuf(ctx);
 f.type=kind==='s'?'bandpass':'highpass';f.frequency.value=kind==='s'?1800:7000;
 const len=kind==='s'?.14:.035;g.gain.setValueAtTime(vol*(kind==='s'?.9:.35),when);g.gain.exponentialRampToValueAtTime(.0001,when+len);
 src.connect(f);f.connect(g);g.connect(out);src.start(when);src.stop(when+len+.02);
}
// ------------------------------------------------------------------ scheduler (look-ahead)
// Schedules song steps from `st.step`/`st.nextAt` up to time `until`.
function schedule(ctx,out,song,st,until,vol){
 const sp=60/song.bpm/4,bars=song.mel.length,echo=song.echo?echoBus(ctx,out):null;
 while(st.nextAt<until){
  const total=bars*16,i=st.step%total,bar=Math.floor(i/16),pos=i%16,when=st.nextAt;
  // Lead: hold until the next note or rest.
  const tok=song.mel[bar][pos];
  if(tok!=='-'&&tok!=='.'){let n=1;for(let j=i+1;j<i+total;j++){const t=song.mel[Math.floor((j%total)/16)][j%16];if(t!=='-')break;n++}
   const dur=Math.min(n,8)*sp*.95,f=hz(tok),lv=(song.soft?.10:song.lead==='square'?.075:.13)*vol;
   tone(ctx,out,f,when,dur,lv,song.lead,{vibrato:n>2?(song.wobble?3.5:5.5):0,lp:song.lead==='square'?2600:0,echo});
   if(song.bell)tone(ctx,out,f*2,when,Math.min(dur,.5),lv*.35,'sine',{});
   if(song.glitch&&Math.random()<.18)tone(ctx,out,f*1.5,when+sp*.5,sp*.4,lv*.5,'square',{lp:3200})}
  // Chords: arpeggio on 16ths (8ths when soft), bass on the beat, pad each bar.
  const chord=song.chords[bar%song.chords.length],ar=chordNotes(chord,5),bs=chordNotes(chord,2)[0];
  if(!song.soft||pos%2===0){const k=song.arp[(pos>>(song.soft?1:0))%song.arp.length];tone(ctx,out,ar[k%ar.length],when,sp*.9,(song.dark?.035:.045)*vol,'triangle',{echo})}
  if(pos%4===0){tone(ctx,out,bs,when,sp*3.6,.16*vol,'triangle',{lp:900});if(song.bassOct&&pos%8===4)tone(ctx,out,bs*2,when,sp*1.6,.09*vol,'square',{lp:800})}
  if(pos===0&&song.pad){for(const f of chordNotes(chord,4))tone(ctx,out,f,when,sp*15.5,.022*vol,'sawtooth',{lp:1100,attack:.25})}
  // Game-show stings (a bright chord stab every 4 bars) and bursts of TV static.
  if(song.sting&&pos===0&&bar%4===0)for(const f of chordNotes(chord,5))tone(ctx,out,f,when,sp*3,.06*vol,'square',{lp:3400});
  if(song.static&&(st.step*7919%100)<5)drum(ctx,out,'h',when+sp*.5,.35*vol);
  const dk=song.drums[pos],hh=song.hat[pos];
  if(dk==='k'||dk==='s')drum(ctx,out,dk,when,.22*vol);if(hh==='h')drum(ctx,out,'h',when,.18*vol);
  st.step++;st.nextAt+=sp;
 }
}
let current=null,bus=null,busCtx=null;const st={step:0,nextAt:0};
function ensureBus(ctx,master){if(bus&&busCtx===ctx)return bus;bus=ctx.createGain();bus.gain.value=1;bus.connect(master);busCtx=ctx;delay=null;return bus}
setInterval(()=>{
 const a=A();if(!a)return;const ctx=a.ctx(),master=a.master();
 if(!ctx||!master||ctx.state!=='running'||!a.on()||document.hidden){st.nextAt=0;return}
 const out=ensureBus(ctx,master),name=theme(),song=SONGS[name]||SONGS.explore;
 if(name!==current){current=name;st.step=0;st.nextAt=ctx.currentTime+.08;
  // Quick fade so songs don't clash when you cross into a new area.
  bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setValueAtTime(.0001,ctx.currentTime);bus.gain.exponentialRampToValueAtTime(1,ctx.currentTime+.6)}
 if(st.nextAt<ctx.currentTime-.2)st.nextAt=ctx.currentTime+.05;
 schedule(ctx,out,song,st,ctx.currentTime+.25,a.volume());
},40);
// Render a song to an AudioBuffer offline (for previews and tests).
async function render(name,seconds){
 const song=SONGS[name];if(!song)throw Error('No song '+name);
 const len=seconds||song.mel.length*16*60/song.bpm/4;const ctx=new OfflineAudioContext(1,Math.ceil(44100*(len+1)),44100);
 const comp=ctx.createDynamicsCompressor();comp.threshold.value=-12;comp.ratio.value=10;const g=ctx.createGain();g.gain.value=1.8;g.connect(comp);comp.connect(ctx.destination);
 const saved=delay;delay=null;schedule(ctx,g,song,{step:0,nextAt:.05},len,.7);delay=saved;
 return ctx.startRendering();
}
window.catCitySoundtrack={songs:SONGS,theme,render,extra(name,song){if(song&&Array.isArray(song.mel))SONGS[name]=song;else if(typeof song?.mel==='string')SONGS[name]={...song,mel:bars(song.mel)}},bars};
})();

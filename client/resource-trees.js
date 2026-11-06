/* Original Cat City pixel-tree art. World harvest nodes and autonomous cats use the same geometry. */
(()=>{'use strict';
const cache=new Map();
const palettes={
 wild:{leaf:'#59945b',light:'#87c578',shade:'#366f4b',bark:'#80573b',barkLight:'#bd8a53',fruit:'#d37d4d'},
 cherry:{leaf:'#e998b9',light:'#ffc8db',shade:'#bc658f',bark:'#856176',barkLight:'#b98da2',fruit:'#ffed9d'},
 marsh:{leaf:'#76ac6a',light:'#b8d99b',shade:'#4d8578',bark:'#75634a',barkLight:'#b59c67',fruit:'#b8deff'},
 town:{leaf:'#77b779',light:'#c1e4a1',shade:'#519369',bark:'#8b674b',barkLight:'#b89867',fruit:'#f5c18d'}
};
function palette(name){return palettes[name]||palettes.wild}
function pixelArt(name){
 const key=Object.hasOwn(palettes,name)?name:'wild';
 if(cache.has(key))return cache.get(key);
 const cv=document.createElement('canvas');cv.width=96;cv.height=128;
 const g=cv.getContext('2d'),p=palette(key);
 g.imageSmoothingEnabled=false;
 function block(x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h)}
 // A stable shadow and full trunk, with a proper chop-able base at y=121.
 g.fillStyle='#2a3b3660';g.beginPath();g.ellipse(48,121,32,6,0,0,7);g.fill();
 block(41,49,17,72,p.bark);block(45,51,5,68,p.barkLight);
 block(34,76,8,12,p.bark);block(56,68,8,17,p.bark);
 block(38,101,6,18,p.barkLight);block(56,105,6,14,p.bark);
 // Pixel foliage clusters; square edges make these true art assets rather than emojis.
 const spots=[[20,47,28,24],[41,27,28,31],[11,32,28,31],[56,39,29,26],
 [28,14,39,28],[12,61,27,17],[50,61,31,19],[27,56,39,25]];
 for(const [x,y,w,h] of spots){block(x+3,y+4,w,h,p.shade);block(x,y,w-4,h-4,p.leaf);
   block(x+4,y+3,Math.max(5,w/2),7,p.light);
 }
 for(const [x,y] of [[27,42],[64,53],[49,29],[20,68],[59,73]])
   block(x,y,5,5,p.fruit);
 block(43,98,3,16,p.barkLight);block(52,93,3,25,p.bark);
 cache.set(key,cv);return cv;
}
function drawTree(ctx,x,y,area='wild',progress=0,mode='standing',time=Date.now()){
 if(!ctx||!ctx.drawImage)return;
 const p=palette(area),im=pixelArt(area);
 const shake=progress>0&&mode!=='felled'?Math.sin(time*.055)*Math.min(5,progress*2.3):0;
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.imageSmoothingEnabled=false;
 if(mode==='felled'){
   ctx.globalAlpha=.75;ctx.fillStyle=p.bark;ctx.fillRect(-10,-15,20,14);
   ctx.fillStyle=p.barkLight;ctx.fillRect(-6,-12,6,6);
 }else{
   ctx.drawImage(im,Math.round(-48+shake),-121,96,128);
   if(progress>0){
    // Visible white axe impacts, wood chips and three distinct strike stages.
    ctx.fillStyle='#fff6d5';ctx.fillRect(-9,-34,18,3);
    ctx.fillStyle=p.barkLight;
    ctx.fillRect(-25,-13-progress*4,6,5);ctx.fillRect(18,-23+progress*3,5,5);
    ctx.fillRect(-19,-35,4,6);
   }
 }
 ctx.restore();
}
window.catCityTreeAsset={draw:drawTree,palette,pixelArt,exists:true};
})();
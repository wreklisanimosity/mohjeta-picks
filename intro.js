/* Opening animation (see intro.css). Shown once per visit, never blocks the app: the page loads underneath and the
   intro removes itself after ~2.6 s or on the first tap / key. */
(()=>{
  // plays when the app is opened (again after 30+ minutes away), not on every tab reload
  let seen=false;try{const now=Date.now(),last=+localStorage.getItem('mohjeta.introAt')||0;
    seen=sessionStorage.getItem('mohjeta.intro')==='1'&&now-last<30*60000;sessionStorage.setItem('mohjeta.intro','1');if(!seen)localStorage.setItem('mohjeta.introAt',String(now));}catch(e){}
  if(seen||/[?&]nointro\b/.test(location.search))return;
  const reduce=matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N='http://www.w3.org/2000/svg';
  const box=document.createElement('div');box.id='mjIntro';box.setAttribute('aria-hidden','true');
  // shards: faceted triangles that fly in from all sides, settle in a ring, then burst with the light
  let shards='';const cols=['#b44dff','#ff4fd8','#8a2be2','#e9b8ff','#5b2a99','#ff9be9'];
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2+(i%2?.12:-.08),r=42+(i%3)*7,x=Math.cos(a)*r,y=Math.sin(a)*r,s=5+(i*7%5);
    const far=150+(i*37%60),fx=Math.cos(a)*far-x,fy=Math.sin(a)*far-y,bx=Math.cos(a)*90,by=Math.sin(a)*90,rot=(i*53%180)-90;
    shards+=`<path class="mi-shard" d="M${x} ${y-s}L${x+s*.9} ${y+s*.6}L${x-s*.9} ${y+s*.5}Z" fill="${cols[i%cols.length]}" style="--d:${(.05+i*.03).toFixed(2)}s;--fx:${fx.toFixed(0)}px;--fy:${fy.toFixed(0)}px;--bx:${bx.toFixed(0)}px;--by:${by.toFixed(0)}px;--r:${rot}deg"/>`;}
  box.innerHTML=`<div class="mi-grid"></div><div class="mi-flash"></div>
   <div class="mi-stage"><div class="mi-orbit"><i></i></div><svg class="mi-shards" viewBox="-100 -100 200 200">${shards}</svg><div class="mi-ring"></div>
    <div class="mi-3d">${Array.from({length:14},(_,i)=>`<img src="logo-cut.webp?v=2" alt="" style="transform:translateZ(${-(i+1)*1.4}px);filter:brightness(${(.28+i*-.012).toFixed(2)}) saturate(1.4)">`).reverse().join('')}<img class="face mi-logo" src="logo-cut.webp?v=2" alt=""><img class="shine" src="logo-cut.webp?v=2" alt="" style="transform:translateZ(.6px)"></div>
    <div class="mi-floor"><img src="logo-cut.webp?v=2" alt=""></div></div>
   <div class="mi-word">${[...'MOHJETA'].map((c,i)=>`<span style="--i:${i}">${c}</span>`).join('')}<span class="dot" style="--i:7">.</span></div>
   <div class="mi-tag">AI sports picks</div><div class="mi-skip">TAP TO SKIP</div>`;
  let done=false;
  const end=()=>{if(done)return;done=true;box.classList.add('out');setTimeout(()=>box.remove(),600);removeEventListener('keydown',end);};
  box.addEventListener('pointerdown',end);addEventListener('keydown',end);
  // start when her logo is ready (or after 0.8 s at most), so the reveal never plays over an empty space
  const start=()=>{if(box.classList.contains('go'))return;box.classList.add('go');setTimeout(end,reduce?700:2900);};
  const mount=()=>{(document.body||document.documentElement).append(box);const img=box.querySelector('.mi-logo');
    if(img.complete&&img.naturalWidth)start();else{img.addEventListener('load',start);img.addEventListener('error',start);}setTimeout(start,800);};
  if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
})();

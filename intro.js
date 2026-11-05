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
  // shards: plain triangles (transform / opacity only) that fly in, settle in a ring, then burst with the light
  let shards='';const cols=['#b44dff','#ff4fd8','#8a2be2','#e9b8ff','#5b2a99','#ff9be9'];
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2+(i%2?.12:-.08),r=46+(i%3)*8,x=Math.cos(a)*r,y=Math.sin(a)*r,sz=9+(i*7%6);
    const far=170+(i*37%60),bx=Math.cos(a)*(r+60),by=Math.sin(a)*(r+60),rot=(i*53%180)-90;
    shards+=`<b class="mi-sh" style="--s:${sz}px;--c:${cols[i%cols.length]};--d:${(.05+i*.04).toFixed(2)}s;--x:${x.toFixed(0)};--y:${y.toFixed(0)};--fx:${(Math.cos(a)*far).toFixed(0)};--fy:${(Math.sin(a)*far).toFixed(0)};--bx:${bx.toFixed(0)};--by:${by.toFixed(0)};--r:${rot}deg"></b>`;}
  const L='logo-cut.webp?v=2',DEP='logo-depth.webp?v=1',SH='logo-shine.webp?v=1';
  const depth=[6,5,4,3,2,1].map(i=>`<img src="${DEP}" alt="" style="transform:translateZ(${-i*3}px)">`).join('');
  box.innerHTML=`<div class="mi-grid"></div><div class="mi-flash"></div>
   <div class="mi-stage"><div class="mi-orbit"><i></i></div>${shards}<div class="mi-ring"></div><div class="mi-glow"></div>
    <div class="mi-3d">${depth}<img class="mi-logo" src="${L}" alt=""><div class="mi-band"><span><img src="${SH}" alt=""></span></div></div>
    <div class="mi-floor"><img src="${L}" alt=""></div></div>
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

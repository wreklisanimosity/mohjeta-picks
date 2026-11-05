/* Opening animation (see intro.css). Shown once per visit, never blocks the app: the page loads underneath and the
   intro removes itself after ~2.6 s or on the first tap / key. */
(()=>{
  let seen=false;try{seen=sessionStorage.getItem('mohjeta.intro')==='1';sessionStorage.setItem('mohjeta.intro','1');}catch(e){}
  if(seen||/[?&]nointro\b/.test(location.search))return;
  const reduce=matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N='http://www.w3.org/2000/svg';
  const box=document.createElement('div');box.id='mjIntro';box.setAttribute('aria-hidden','true');
  // shards: faceted triangles that fly in from all sides, settle in a ring, then burst with the light
  let shards='';const cols=['#b44dff','#ff4fd8','#8a2be2','#e9b8ff','#5b2a99','#ff9be9'];
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2+(i%2?.12:-.08),r=42+(i%3)*7,x=Math.cos(a)*r,y=Math.sin(a)*r,s=5+(i*7%5);
    const far=150+(i*37%60),fx=Math.cos(a)*far-x,fy=Math.sin(a)*far-y,bx=Math.cos(a)*90,by=Math.sin(a)*90,rot=(i*53%180)-90;
    shards+=`<path class="mi-shard" d="M${x} ${y-s}L${x+s*.9} ${y+s*.6}L${x-s*.9} ${y+s*.5}Z" fill="${cols[i%cols.length]}" style="--d:${(.05+i*.03).toFixed(2)}s;--fx:${fx.toFixed(0)}px;--fy:${fy.toFixed(0)}px;--bx:${bx.toFixed(0)}px;--by:${by.toFixed(0)}px;--r:${rot}deg"/>`;}
  const M='M3 29V3l13 12L29 3v26l-7-5V15l-6 7-6-7v9Z';
  box.innerHTML=`<div class="mi-grid"></div><div class="mi-flash"></div>
   <div class="mi-stage"><svg class="mi-shards" viewBox="-100 -100 200 200">${shards}</svg><div class="mi-ring"></div>
    <svg class="mi-logo" viewBox="0 0 32 32"><defs>
     <linearGradient id="miStroke" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd6fb"/><stop offset=".5" stop-color="#ff4fd8"/><stop offset="1" stop-color="#b44dff"/></linearGradient>
     <linearGradient id="miFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c77dff"/><stop offset="1" stop-color="#7a22d6"/></linearGradient></defs>
     <path class="body" d="${M}"/><path class="facet" d="m3 3 13 12 6-6-6 13Z"/><path class="trace" d="${M}" pathLength="120"/></svg></div>
   <div class="mi-word">${[...'MOHJETA'].map((c,i)=>`<span style="--i:${i}">${c}</span>`).join('')}<span class="dot" style="--i:7">.</span></div>
   <div class="mi-tag">AI sports picks</div><div class="mi-skip">TAP TO SKIP</div>`;
  let done=false;
  const end=()=>{if(done)return;done=true;box.classList.add('out');setTimeout(()=>box.remove(),600);removeEventListener('keydown',end);};
  box.addEventListener('pointerdown',end);addEventListener('keydown',end);
  const mount=()=>{(document.body||document.documentElement).append(box);setTimeout(end,reduce?700:2600);};
  if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
})();

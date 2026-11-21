/* fix516 - Her voice guide (owner, Nov 18 2026: "audio instructions for the tour and audio instructions for each game they
   can play so they know how to play the games"). Short clips in her ElevenLabs voice, recorded once and served as files:
   voice-tour-01..13.m4a (one per app tour step, played by tour.js) and voice-howto-<game>.m4a (a "🔊 How to play" button on
   each game). One shared player: starting a clip stops the one before; tapping the playing button again stops it.
   The tour only talks when Sound is on (🔊 in the header); a How-to-play tap always plays (the person asked for it). */
(()=>{
  const V='v=2';   // fix538: clips remade in the voice actor's voice
  let au=null,cur=null,curBtn=null;
  const soundOn=()=>{try{return localStorage.getItem('mohjeta.sound')!=='0';}catch(e){return true;}};
  function setBtn(b,on){if(!b)return;b.classList.toggle('playing',on);b.setAttribute('aria-pressed',String(on));
    const t=b.querySelector('.vg-t');if(t)t.textContent=on?'Stop':(b.dataset.label||'How to play');}
  function stop(){if(au){try{au.pause();}catch(e){}}cur=null;setBtn(curBtn,false);curBtn=null;}
  function play(name,btn){
    if(cur===name&&au&&!au.paused){stop();return Promise.resolve(false);}
    stop();if(!au){au=new Audio();au.preload='auto';au.addEventListener('ended',()=>{cur=null;setBtn(curBtn,false);curBtn=null;});}
    au.src='voice-'+name+'.m4a?'+V;cur=name;curBtn=btn||null;setBtn(curBtn,true);
    return au.play().then(()=>true).catch(()=>{cur=null;setBtn(curBtn,false);curBtn=null;return false;});}
  window.MJVoice={play,stop,soundOn,playing:()=>!!(au&&!au.paused)};

  // ---- "🔊 How to play" on every game
  const GAMES=[
    {sel:'.pkcard',name:'howto-pickem',where:'prepend'},
    {sel:'#guess h2',name:'howto-guess',where:'after'},
    {sel:'.sncard',name:'howto-score',where:'prepend'},
    {sel:'.ppcard',name:'howto-prop',where:'prepend'},
    {sel:'#fantasy h2',name:'howto-fantasy',where:'after'},
    {sel:'#weekly .wkhero',name:'howto-weekly',where:'after'},
    {sel:'#sim h2',name:'howto-sim',where:'after'},
    {sel:'#draft h2',name:'howto-draft',where:'after'}   // fix517
  ];
  function css(){if(document.getElementById('vgCss'))return;const st=document.createElement('style');st.id='vgCss';st.textContent=`
.vg-btn{display:inline-flex;align-items:center;gap:6px;margin:6px 0 8px;padding:7px 12px;border-radius:999px;border:1px solid #b44dff88;
 background:#1a0f2c;color:#f3eaff;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.vg-btn .vg-i{font-size:15px}.vg-btn.playing{background:linear-gradient(135deg,#8a2be2,#ff4fd8);border-color:transparent}
.vg-btn.playing .vg-i{animation:vgp 1s ease-in-out infinite}@keyframes vgp{50%{transform:scale(1.25)}}
@media (prefers-reduced-motion:reduce){.vg-btn.playing .vg-i{animation:none}}`;document.head.append(st);}
  function mk(name,label){const b=document.createElement('button');b.type='button';b.className='vg-btn';b.dataset.vg=name;b.dataset.label=label;
    b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',label+' (her voice)');
    b.innerHTML='<span class="vg-i" aria-hidden="true">🔊</span><span class="vg-t"></span>';b.querySelector('.vg-t').textContent=label;
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();play(name,b);});return b;}
  function attach(){for(const g of GAMES){for(const host of document.querySelectorAll(g.sel)){
      const scope=g.where==='after'?host.parentElement:host;if(!scope||scope.querySelector(`.vg-btn[data-vg="${g.name}"]`))continue;
      const b=mk(g.name,'How to play');if(cur===g.name){curBtn=b;setBtn(b,true);}
      if(g.where==='after')host.after(b);else if(host.firstElementChild)host.firstElementChild.after(b);else host.prepend(b);}}}
  let t=null;const soon=()=>{clearTimeout(t);t=setTimeout(attach,120);};
  function startObs(){css();attach();new MutationObserver(soon).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObs);else startObs();
  // leaving the page or hiding the app stops her
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
})();

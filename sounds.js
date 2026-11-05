/* Mohjeta sounds + vibration. Every sound is made right here with the Web Audio API (no sound files, nothing
   licensed). On by default; the 🔊 button in the header (or More > Sound) turns sound and vibration off for this
   phone. Phones only allow sound after the first tap, so anything before that is skipped quietly.
   Use: MJSound.play('win'|'loss'|'badge'|'save'|'lock'|'tick'|'tap'|'intro'), MJSound.on(), MJSound.set(bool). */
(()=>{
  const KEY='mohjeta.sound';let ctx=null,master=null,last={};
  const on=()=>{try{return localStorage.getItem(KEY)!=='0';}catch(e){return true;}};
  function audio(){if(ctx)return ctx;const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;
    ctx=new A();master=ctx.createGain();master.gain.value=1.6;
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-8;comp.ratio.value=4;master.connect(comp).connect(ctx.destination);return ctx;}
  const ready=()=>ctx&&ctx.state==='running';
  function unlock(){const c=audio();if(c&&c.state!=='running')c.resume().catch(()=>{});}
  // ---- building blocks
  function tone(f,t,dur,{type='sine',vol=.2,attack=.004,glide=null,dest=master,detune=0}={}){
    const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.detune.value=detune;
    if(glide)o.frequency.exponentialRampToValueAtTime(glide,t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g).connect(dest);o.start(t);o.stop(t+dur+.05);}
  function bell(f,t,dur,vol=.16){tone(f,t,dur,{vol});tone(f*2.76,t,dur*.45,{vol:vol*.28});tone(f*5.4,t,dur*.2,{vol:vol*.1});}
  let noiseBuf=null;
  function noise(t,dur,{vol=.15,type='bandpass',f=2000,f2=null,q=1,dest=master}={}){
    if(!noiseBuf){noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
    const s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuf;s.loop=true;
    fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.02,dur/3));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(fl).connect(g).connect(dest);s.start(t);s.stop(t+dur+.05);}
  function echo(){const d=ctx.createDelay(),fb=ctx.createGain(),wet=ctx.createGain();d.delayTime.value=.13;fb.gain.value=.28;wet.gain.value=.35;
    d.connect(fb).connect(d);d.connect(wet).connect(master);const inp=ctx.createGain();inp.connect(master);inp.connect(d);return inp;}
  // ---- the sounds
  const SOUNDS={
    tap:t=>{noise(t,.03,{vol:.05,f:3200,q:2});tone(1400,t,.05,{vol:.03,glide:900});},
    tick:t=>{tone(2300,t,.06,{vol:.05,type:'triangle'});},
    save:t=>{tone(784,t,.12,{vol:.12,type:'triangle'});tone(1175,t+.08,.22,{vol:.12,type:'triangle'});},
    lock:t=>{noise(t,.04,{vol:.12,f:1800,q:3});tone(140,t,.16,{vol:.22,glide:90});tone(900,t+.01,.05,{vol:.05,type:'square'});},
    win:t=>{const e=echo();   // ka-ching: register bell + bright coins
      noise(t,.05,{vol:.12,f:5000,q:1.5});bell(1319,t+.03,.5,.14);bell(1976,t+.12,.9,.16);
      for(let i=0;i<5;i++)tone(2600+i*420,t+.12+i*.035,.12,{vol:.035,type:'triangle',dest:e});},
    loss:t=>{tone(330,t,.35,{vol:.13,type:'triangle',glide:220});tone(196,t+.12,.5,{vol:.12,glide:147});},
    badge:t=>{const e=echo();[1047,1319,1568,2093].forEach((f,i)=>bell(f,t+i*.085,.7+i*.1,.12));noise(t+.3,.6,{vol:.03,type:'highpass',f:6000,dest:e});},
    intro:t=>{const e=echo();   // whoosh under the logo spin, then a soft chord as it lands
      noise(t,1.0,{vol:.16,f:300,f2:3400,q:.8});noise(t+.15,.9,{vol:.06,type:'highpass',f:2500,f2:7000});
      tone(110,t,1.1,{vol:.1,type:'sine',glide:220,attack:.5});
      [523,659,784,1047].forEach((f,i)=>bell(f,t+1.0+i*.03,1.6,.09));tone(262,t+1.0,1.4,{vol:.08,type:'triangle',dest:e});},
    land:t=>{const e=echo();[523,659,784,1047].forEach((f,i)=>bell(f,t+i*.03,1.4,.09));tone(262,t,1.2,{vol:.08,type:'triangle',dest:e});}
  };
  const BUZZ={win:[20,50,30],loss:[60],badge:[15,40,15,40,50],save:[18],lock:[12],intro:[10,60,25],land:[25]};
  function play(name){if(!on())return;
    const now=performance.now();if(last[name]&&now-last[name]<(name==='tap'?40:250))return;last[name]=now;
    if(BUZZ[name]&&navigator.vibrate&&document.visibilityState==='visible')try{navigator.vibrate(BUZZ[name]);}catch(e){}
    if(!ready())return;try{SOUNDS[name]&&SOUNDS[name](ctx.currentTime+.01);}catch(e){}}
  function set(v){try{localStorage.setItem(KEY,v?'1':'0');}catch(e){}if(v){unlock();setTimeout(()=>play('save'),60);}else if(navigator.vibrate)try{navigator.vibrate(0);}catch(e){}
    document.querySelectorAll('[data-sound-toggle]').forEach(paint);}
  function paint(b){const v=on();b.textContent=v?'🔊':'🔇';b.setAttribute('aria-pressed',String(v));b.setAttribute('aria-label',v?'Sound on':'Sound off');b.title=v?'Sound on (tap to mute)':'Sound off';}
  window.MJSound={play,on,set,toggle:()=>set(!on()),paint,unlock};
  // first touch anywhere unlocks audio; soft taps on buttons
  addEventListener('pointerdown',e=>{const intro=document.getElementById('mjIntro');unlock();
    if(intro&&!intro._mjSound&&on()){intro._mjSound=1;setTimeout(()=>play('land'),30);return;}   // tapped to skip: just the landing chord
    const b=e.target.closest&&e.target.closest('button,[role=tab],.hubbtn,.htile,a.btn');if(b&&!b.matches('[data-sound-toggle]'))setTimeout(()=>play('tap'),0);},{capture:true,passive:true});
  addEventListener('keydown',unlock,{capture:true,passive:true});
  // opening sound: plays with the logo if the phone allows sound before a tap (the installed app usually does)
  const tryIntro=()=>{const intro=document.getElementById('mjIntro');if(!intro||intro._mjSound||!on())return;const c=audio();if(!c)return;
    c.resume().then(()=>{if(c.state==='running'&&document.getElementById('mjIntro')&&!intro._mjSound){intro._mjSound=1;play('intro');}}).catch(()=>{});};
  const mo=new MutationObserver(()=>{const i=document.getElementById('mjIntro');if(i&&i.classList.contains('go')){tryIntro();mo.disconnect();}});
  mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});setTimeout(()=>mo.disconnect(),5000);
})();

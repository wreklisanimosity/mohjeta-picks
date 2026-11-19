/* fix515 - App tour (owner, Nov 18 2026: "we need a app tour so people know how to maneuver through the app").
   A short guided walkthrough: it opens each tab and spotlights where to tap, with one tip per step.
   Shown once on a first visit (after the opening animation), replayable from My Mohjeta > "Take the app tour" or ?tour.
   Self-contained: it only clicks the page's own nav buttons, so it never needs the page's internal functions. */
(()=>{
  const KEY='mohjeta.tour2';   // new key: everyone who saw the old 3-screen welcome gets the new tour once
  const STEPS=[
    {tab:null,title:'Welcome to Mohjeta 👋',text:'Mohjeta is an AI that picks the winner of every game and grades herself after each one. Here’s a 30-second tour of where everything is.'},
    {tab:'home',el:'#nav [data-tab="home"]',title:'Home',text:'Your dashboard: tonight at a glance, her record, live games and her top picks. Tap the Mohjeta logo anytime to come back here.'},
    {tab:'picks',el:'#nav [data-tab="picks"]',title:'Tonight',text:'Every pick she’s making tonight with her chance for each team. Tap a sport, then tap any game for the full breakdown: injuries, key players and why she picked it.'},
    {tab:'teams',el:'#nav [data-tab="teams"]',title:'Teams',text:'Pick a sport, then a team: her next pick, stats, schedule, injuries and roster. Tap any player to open his card.'},
    {tab:'sim',el:'#nav [data-tab="sim"]',title:'Simulate',text:'Choose any two teams, decide who plays, and run the game 10,000 times, using the same player ratings behind her picks.'},
    {tab:'record',el:'#nav [data-tab="record"]',title:'Results',text:'Her record: every pick, graded after every game. Switch between Today, Last 7 days and Since the start, and see how she does in each sport.'},
    {tab:'play',el:'#nav [data-tab="play"]',title:'Play',text:'Free games between games: Pick’em (try to beat her), Guess her number, Score of the Night and fantasy leagues.'},
    {tab:null,el:'#nav [data-tab="chat"]',title:'Chat',text:'The Fan Lounge: talk games live with other fans and challenge them to fantasy battles.'},
    {tab:'more',el:'#nav [data-tab="more"]',title:'My Mohjeta',text:'Everything that’s yours: trophies, your teams, phone alerts, settings and language. Sports radio, the sports hub and the live feed are in here too.'},
    {tab:null,el:'#qjOpen',title:'Jump anywhere',text:'Tap “All pages” (or swipe up on the bottom bar) to jump straight to any page.'},
    {tab:null,el:'#plFindBtn',title:'Search',text:'Find any team or player, even on nights they don’t play.'},
    {tab:null,el:'#sndBtn',title:'Her voice',text:'Turn sounds and her voice on or off.'},
    {tab:'home',title:'You’re all set ✅',text:'That’s the tour. You can replay it anytime from My Mohjeta → “Take the app tour”.'}
  ];
  let i=0,box,ring,card,onKey,onResize;
  // fix516: her voice reads each step (voice-guide.js), when Sound is on; the 🔊 on the card mutes just the tour
  const VK='mohjeta.tourVoice';
  const voiceOn=()=>{try{return localStorage.getItem(VK)!=='0'&&(!window.MJVoice||MJVoice.soundOn());}catch(e){return true;}};
  const say=()=>{if(window.MJVoice){if(voiceOn())MJVoice.play('tour-'+String(i+1).padStart(2,'0'));else MJVoice.stop();}};
  const $=s=>{try{return s?document.querySelector(s):null;}catch(e){return null;}};
  const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0;};
  function css(){if($('#mjTourCss'))return;const st=document.createElement('style');st.id='mjTourCss';st.textContent=`
#mjTour{position:fixed;inset:0;z-index:120;pointer-events:auto}
#mjTour .tr-ring{position:fixed;border-radius:14px;box-shadow:0 0 0 9999px #05030acc,0 0 0 3px #ff4fd8,0 0 24px 6px #b44dff99;transition:all .35s ease;pointer-events:none}
#mjTour .tr-ring.none{left:50%!important;top:40%!important;width:0!important;height:0!important}
#mjTour .tr-card{position:fixed;left:16px;right:16px;max-width:420px;margin:0 auto;background:linear-gradient(160deg,#1c1030,#0f0819);border:1px solid #b44dff66;border-radius:18px;padding:16px 16px 12px;color:#f3eaff;box-shadow:0 12px 40px #000a;transition:top .35s ease,bottom .35s ease}
#mjTour .tr-card h4{margin:0 0 6px;font-size:18px}
#mjTour .tr-card p{margin:0 0 12px;font-size:15px;line-height:1.45;color:#dccff0}
#mjTour .tr-row{display:flex;align-items:center;gap:8px}
#mjTour .tr-dots{flex:1;display:flex;gap:4px;flex-wrap:wrap}
#mjTour .tr-dots i{width:6px;height:6px;border-radius:50%;background:#ffffff33}#mjTour .tr-dots i.on{background:#ff4fd8}
#mjTour button{font:inherit;border-radius:12px;padding:9px 14px;border:1px solid #b44dff88;background:transparent;color:#f3eaff;cursor:pointer}
#mjTour button.tr-vo{padding:8px 10px;font-size:16px}
#mjTour button.go{background:linear-gradient(135deg,#8a2be2,#ff4fd8);border:0;font-weight:700}
#mjTour .tr-skip{position:fixed;top:calc(env(safe-area-inset-top,0px) + 12px);right:12px;font-size:13px;padding:6px 12px;background:#0008}
@media (prefers-reduced-motion:reduce){#mjTour .tr-ring,#mjTour .tr-card{transition:none}}`;document.head.append(st);}
  function place(){const s=STEPS[i];const el=$(s.el);const card_h=card.offsetHeight||180;
    if(visible(el)){const r=el.getBoundingClientRect(),pad=6;
      el.scrollIntoView&&r.top<0&&el.scrollIntoView({block:'center'});
      Object.assign(ring.style,{left:(r.left-pad)+'px',top:(r.top-pad)+'px',width:(r.width+pad*2)+'px',height:(r.height+pad*2)+'px'});ring.classList.remove('none');
      const below=r.top+r.height/2<innerHeight/2;
      if(below){card.style.top=Math.min(innerHeight-card_h-12,r.bottom+pad+14)+'px';card.style.bottom='';}
      else{card.style.bottom=Math.max(12,innerHeight-r.top+pad+14)+'px';card.style.top='';}}
    else{ring.classList.add('none');card.style.top=Math.max(16,(innerHeight-card_h)/2)+'px';card.style.bottom='';}}
  function render(){const s=STEPS[i];
    if(s.tab){const b=$(`#nav [data-tab="${s.tab}"]`);if(b)b.click();}
    const last=i===STEPS.length-1;
    card.innerHTML='';const h=document.createElement('h4');h.textContent=s.title;const p=document.createElement('p');p.textContent=s.text;
    const row=document.createElement('div');row.className='tr-row';const dots=document.createElement('div');dots.className='tr-dots';
    STEPS.forEach((_,k)=>{const d=document.createElement('i');if(k===i)d.className='on';dots.append(d);});row.append(dots);
    if(window.MJVoice){const vb=document.createElement('button');vb.type='button';vb.className='tr-vo';const lab=()=>{const on=voiceOn();vb.textContent=on?'🔊':'🔇';vb.setAttribute('aria-label',on?'Mute her voice':'Hear her voice');vb.setAttribute('aria-pressed',String(on));};lab();
      vb.onclick=()=>{let on=!voiceOn();try{localStorage.setItem(VK,on?'1':'0');if(on&&!MJVoice.soundOn()){if(window.MJSound&&MJSound.set)MJSound.set(true);else localStorage.setItem('mohjeta.sound','1');}}catch(e){}lab();say();};row.append(vb);}
    if(i>0&&!last){const bk=document.createElement('button');bk.type='button';bk.textContent='Back';bk.onclick=()=>{i--;render();};row.append(bk);}
    const nx=document.createElement('button');nx.type='button';nx.className='go';nx.textContent=i===0?'Start the tour':last?'Done':'Next';nx.onclick=()=>last?end(true):(i++,render());row.append(nx);
    card.append(h,p,row);card.setAttribute('aria-label',s.title);
    say();
    requestAnimationFrame(()=>{place();setTimeout(place,380);});try{nx.focus({preventScroll:true});}catch(e){}
    try{window.MJSound&&MJSound.play&&i>0&&MJSound.play('tap');}catch(e){}}
  function end(done){try{window.MJVoice&&MJVoice.stop();}catch(e){}try{localStorage.setItem(KEY,done?'done':'skipped');}catch(e){}
    if(box)box.remove();box=null;removeEventListener('keydown',onKey);removeEventListener('resize',onResize);
    const b=$('#nav [data-tab="home"]');if(b&&done)b.click();}
  function start(){if(box)return;css();i=0;
    box=document.createElement('div');box.id='mjTour';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','App tour');
    ring=document.createElement('div');ring.className='tr-ring none';card=document.createElement('div');card.className='tr-card';
    const sk=document.createElement('button');sk.type='button';sk.className='tr-skip';sk.textContent='Skip tour';sk.onclick=()=>end(false);
    box.append(ring,card,sk);document.body.append(box);
    onKey=e=>{if(e.key==='Escape')end(false);else if(e.key==='ArrowRight'&&i<STEPS.length-1){i++;render();}else if(e.key==='ArrowLeft'&&i>0){i--;render();}};
    onResize=()=>box&&place();addEventListener('keydown',onKey);addEventListener('resize',onResize);render();}
  window.MJTour={start};
  // the "Take the app tour" button in My Mohjeta (and any other [data-tour] button)
  document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-tour]');if(b){e.preventDefault();start();}});
  // first visit: after the opening animation and once the nav is there; ?tour forces it
  const force=/[?&]tour\b/.test(location.search);let seen=null;try{seen=localStorage.getItem(KEY);}catch(e){}
  if(force||!seen){const wait=()=>{if(!$('#nav')||$('#mjIntro')||$('.gate:not([hidden])'))return setTimeout(wait,700);setTimeout(start,force?300:1200);};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,1500));else setTimeout(wait,1500);}
})();

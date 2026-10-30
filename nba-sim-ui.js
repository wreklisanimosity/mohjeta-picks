function simulationScorecard(box){
  const ev=D&&D.simulation_evaluation;if(!ev)return;
  const card=el('div',null,'card');card.append(el('h4','NBA simulation accuracy'));
  card.append(el('p',ev.graded+' completed games · '+ev.pending+' forecasts awaiting results. First published pregame lineup only; your what-if changes are not graded.','hint small'));
  if(ev.graded){
    card.append(el('p','Average error: margin '+ev.margin_mae.toFixed(1)+' points · total '+ev.total_mae.toFixed(1)+' points. The 80% ranges contained '+pct(ev.margin80_coverage)+' of margins and '+pct(ev.total80_coverage)+' of totals.'));
    card.append(el('p','Win probability error (Brier; lower is better): '+ev.brier.toFixed(3)+'. Forecasts saved an average '+ev.mean_hours_before_start.toFixed(1)+' hours before tipoff.','hint small'));
    for(const [key,c] of Object.entries(ev.comparisons||{})){
      const label={baseline:'Recent team results',market:'Normalized market prices',market_total:'Sportsbook total',market_spread:'Sportsbook margin'}[key]||key;
      card.append(el('p',label+' benchmark ('+c.n+' same games): '+(c.brier!=null?'Brier '+c.brier.toFixed(3)+' vs simulation '+c.sim_brier_same_games.toFixed(3):'point error '+c.mae.toFixed(1)+' vs simulation '+c.sim_mae_same_games.toFixed(1)),'hint small'));
    }
    for(const [key,label] of [['spread_scoring','Spread'],['total_scoring','Total']]){const q=ev[key];if(q&&q.n)card.append(el('p',label+' probabilities, including pushes: three-outcome Brier '+q.brier3.toFixed(3)+' across '+q.n+' games (lower is better).','hint small'));}
    for(const bin of ev.calibration||[])card.append(el('p','Predicted '+pct(bin.predicted)+' home wins; observed '+pct(bin.observed)+' across '+bin.n+' games.','hint small'));
  }
  card.append(el('p',ev.graded<100?'Still gathering evidence. A small sample cannot establish reliable accuracy.':'Evaluate the sample size and calibration before relying on these probabilities.','hint small'));box.append(card);
}
function drawNbaSim(g,box,rerun){
  const s=g.sim,model=s.nba_model;
  const st=simState[simId]||(simState[simId]={sits:{},spread:s.market_spread!=null?String(s.market_spread):'',total:s.market_total!=null?String(s.market_total):'',seed:20261030});
  if(rerun==='resample')st.seed=(st.seed||20261030)+1;
  // Remove choices for players no longer in the current model.
  const keys=new Set(Object.entries(model.teams).flatMap(([team,ps])=>ps.map(p=>team+'|'+p.name)));
  for(const k of Object.keys(st.sits))if(!keys.has(k))delete st.sits[k];
  const result=NbaSim.simulate(model,st.sits,{seed:st.seed||20261030,spread:parseFloat(st.spread),total:parseFloat(st.total)});
  const card=el('div',null,'card');card.append(el('h4','10,000 simulated NBA final scores'));
  if(result.error)card.append(el('p',result.error,'hint'));
  else{
    const tiles=el('div',null,'tiles');const tile=(label,value)=>{const t=el('div',null,'tile');t.append(label,el('b',value));tiles.append(t);};
    tile(s.home+' win',pct(result.p_home));tile(s.away+' win',pct(1-result.p_home));
    tile('Projected score',s.home+' '+result.home.toFixed(1)+' – '+result.away.toFixed(1)+' '+s.away);
    tile('Expected total',result.total.toFixed(1));
    tile('Average margin',(result.margin>=0?s.home:s.away)+' by '+Math.abs(result.margin).toFixed(1));
    if(Number.isFinite(parseFloat(st.spread)))tile(s.home+' '+st.spread+' covers',pct(result.cover)+' · push '+pct(result.push));
    if(Number.isFinite(parseFloat(st.total)))tile('Over '+st.total,pct(result.over)+' · push '+pct(result.total_push));
    card.append(tiles,el('p','Middle 80% of outcomes: home margin '+result.margin80.join(' to ')+'; total '+result.total80.join(' to ')+'. These ranges are provisional until validated.','hint small'));
  }
  card.append(el('p','Lineup inputs updated '+new Date(model.built_at*1000).toLocaleString()+'. Questionable and doubtful players are sampled as plays/sits using estimated availability. Choose Plays or Sits to test a specific lineup.','hint small'));
  if(Date.now()/1000-model.built_at>3600)card.append(el('p','These lineup inputs are over an hour old. Check the latest injury report before interpreting this projection.','hint'));
  const again=el('button','Run again','btn');again.type='button';again.onclick=()=>drawSim('resample');
  const reset=el('button','Reset to injury report','btn');reset.type='button';reset.onclick=()=>{st.sits={};st.seed=20261030;drawSim();};card.append(again,reset);box.append(card);
  const inputs=el('div',null,'simin');for(const [label,key,placeholder] of [[s.home+' spread','spread','e.g. -3.5'],['Total (over/under)','total','Enter a total']]){
    const l=el('label',label),i=el('input');i.type='number';i.step='0.5';i.inputMode='decimal';i.value=st[key];i.placeholder=placeholder;i.onchange=()=>{st[key]=i.value;drawSim();};l.append(i);inputs.append(l);
  }box.append(inputs);
  const lineup=el('div',null,'card');lineup.append(el('h4','Who plays?'),el('p','Changes recalculate replacement minutes and both teams’ offense and defense. Each team shares 240 minutes; no player receives more than 48. Players with no recent model data cannot be added here.','hint small'));
  for(const [team,players] of Object.entries(model.teams)){
    lineup.append(el('b',team+(team===s.home&&!s.neutral?' (home)':'')));
    for(const p of players){const key=team+'|'+p.name,manual=key in st.sits;
      const row=el('div',null,'simrow'),nm=el('div',null,'nm');nm.append(el('span',p.name+(p.role?' · '+p.role:'')),el('small',p.minutes.toFixed(1)+' usual minutes'+(p.status?' · '+p.status:'')+(!manual&&p.sit>0&&p.sit<1?' · estimated '+pct(1-p.sit)+' chance to play':'')));
      const label=manual?(st.sits[key]?'Sits':'Plays'):'Report: '+(p.sit===1?'out':p.sit===0?'plays':'uncertain');
      const b=el('button',label,'tog'+(manual&&st.sits[key]?' sits':''));b.type='button';b.setAttribute('aria-label',p.name+': '+label+'. Change availability');
      b.onclick=()=>{if(!manual)st.sits[key]=false;else if(!st.sits[key])st.sits[key]=true;else delete st.sits[key];drawSim();};row.append(nm,b);lineup.append(row);
    }
  }box.append(lineup);
  box.append(el('p','This is a model of final scores, not a possession-by-possession game. Score variability and injury probabilities remain estimates. Lineup effects do not include every matchup or coaching interaction. Entertainment only.','hint small'));
  simulationScorecard(box);
}

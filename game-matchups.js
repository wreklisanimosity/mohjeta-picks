(function(root){
  const group=p=>({PG:'Guard',SG:'Guard',G:'Guard',SF:'Wing',PF:'Forward',F:'Forward',C:'Center'})[p]||p;
  function pair(left,right){
    const remaining=right.slice(), rows=[];
    for(const a of left){
      let i=a.pos?remaining.findIndex(b=>b.pos===a.pos):-1;
      if(i<0&&a.pos)i=remaining.findIndex(b=>group(b.pos)===group(a.pos));
      rows.push([a,i<0?null:remaining.splice(i,1)[0]]);
    }
    return rows.concat(remaining.map(b=>[null,b]));
  }
  function node(tag,text,cls){const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;}
  let ratings=null, pending=null, ratingsAt=0;
  const key=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  function render(g, enriched=false){
    const box=node('section',null,'starter-matchups');
    const banner=node('header',null,'matchup-banner');banner.append(node('span','MOHJETA / COURTSIDE','matchup-eyebrow'),node('h3','HEAD TO HEAD'),node('span',g.league+' · '+(g.state==='LIVE'?'LIVE MATCHUP':g.state==='FINAL'?'FINAL BREAKDOWN':'PREGAME INTELLIGENCE'),'matchup-kicker'));box.append(banner);
    const lineup=g.lineups, sides=lineup?.teams||g.teams.map(t=>({team:t.name,status:'unavailable',players:[]}));
    box.append(node('p','Position comparisons—not confirmed defensive assignments or past head-to-head results.','matchup-note'));
    const heading=node('div',null,'matchup-teamhead');
    for(const [i,s] of sides.slice(0,2).entries()){const col=node('div');col.style.setProperty('--team-color',root.GameMatchups.theme?.color(s.team)|| (i?'#16b9d4':'#a855f7'));if(root.GameMatchups.theme?.badge)col.append(root.GameMatchups.theme.badge(s.team));col.append(node('strong',s.team),node('span',s.status==='confirmed'?'Provider-listed starters':s.status==='projected'?'Projected · unconfirmed':'Starters not available','matchup-status '+s.status));heading.append(col);}
    box.append(heading);
    let left=sides[0]?.players||[],right=sides[1]?.players||[],keyMode=false;
    // Nov 6 2026: no published starters (college games, most sports): compare her top-rated players by position instead
    if(!left.length&&!right.length&&g.key_players&&g.key_players.teams){const kt=g.key_players.teams,pick=n=>(kt[n]||[]).slice(0,5).map(x=>({name:x.name,pos:x.group||x.pos,rating:x.rating,stats:x.stats}));
      left=pick(sides[0]?.team);right=pick(sides[1]?.team);keyMode=left.length||right.length;}
    if(keyMode)box.append(node('p','No starting lineups are published for this game, so these are each team’s top-rated players by position, from her ratings.','matchup-note'));
    if(!left.length&&!right.length){box.append(node('p','Starting lineups haven’t been provided yet. Check back closer to game time.','matchup-empty'));}
    else {
      if(sides.some(s=>s.status==='projected'))box.append(node('p','Projected five uses the highest expected minutes among available rotation players. It can differ from the coach’s starting lineup.','matchup-note'));
      for(const [index,[a,b]] of pair(left,right).entries()){
        const row=node('article',null,'matchup-duel');row.style.setProperty('--duel-index',Math.min(index,5));const ribbon=node('div',null,'matchup-ribbon');ribbon.append(node('span','MATCHUP '+String(index+1).padStart(2,'0')),node('b',a?.pos&&b?.pos?(group(a.pos)+' / '+group(b.pos)):'LINEUP COMPARISON'));row.append(ribbon);
        const player=(p,team)=>{const card=node('div',null,'matchup-player');card.style.setProperty('--team-color',root.GameMatchups.theme?.color(team)||'#7040a0');if(!p){card.append(node('span','—','matchup-avatar'),node('p','No matching position listed'));return card;}
          const art=node('div',null,'matchup-playerart');art.setAttribute('aria-hidden','true');card.append(art);card.append(node('span',p.name.split(/\s+/).map(n=>n[0]).slice(0,2).join(''),'matchup-avatar'),node('h4',p.name),node('span',p.pos||'Position unavailable','matchup-pos'));
          if(p.status)card.append(node('small',p.status,'matchup-injury'));
          if(Number.isFinite(p.minutes))card.append(node('small',p.minutes.toFixed(0)+' expected min'));
          const season=(ratings?.leagues?.[g.league]?.roster?.players||[]).find(x=>key(x.name)===key(p.name)&&x.team_name&&key(team).endsWith(key(x.team_name)));
          const hasNum=t=>/[1-9]/.test(String(t||''));   // "0 tkl, 0.0 sacks" means no stats yet, not zeros worth showing
          if(season){
            if(Number.isFinite(season.rating))card.append(node('small','Position rating '+season.rating+'/99'));
            if(hasNum(season.stats))card.append(node('small','Season: '+season.stats));
          }else{
            if(Number.isFinite(p.rating))card.append(node('small','Position rating '+p.rating+'/99'));
            if(hasNum(p.stats))card.append(node('small','Season: '+p.stats));
          }
          const model=(g.sim?.players?.[team]||[]).find(x=>x.name===p.name);
          if(model&&Number.isFinite(model.worth))card.append(node('small',model.worth.toFixed(1)+' '+(g.sim.unit||'pts')+' modeled impact'));
          return card;};
        row.append(player(a,sides[0]?.team),node('span','VS','matchup-vs'),player(b,sides[1]?.team));
        const stats=node('div',null,'matchup-stats');
        const keys=[...new Set([...Object.keys(a?.stats||{}),...Object.keys(b?.stats||{})])].filter(k=>/^(PTS|REB|AST|MIN|STL|BLK|TO|FG|3PT|FT|YDS|TD|INT|SACKS|G|A|SOG|SV|H|R|RBI|SO|IP)$/i.test(k)).slice(0,8);
        const meter=(label,av,bv,inverse=false)=>{const x=Number(av),y=Number(bv);if(av==null||bv==null||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0)return;const m=node('div',null,'matchup-meter');const t=node('div',null,'matchup-meterline');t.append(node('b',String(av)),node('span',label),node('b',String(bv)));const track=node('div',null,'matchup-track');const l=node('i'),r=node('i');l.style.width=(x+y?100*x/(x+y):50)+'%';r.style.flex='1';track.append(l,r);m.append(t,track);if(x!==y){const n=(inverse?x<y:x>y)?a?.name:b?.name;m.append(node('small',(n||'Player')+' · '+(inverse?'fewer':'higher')+' '+label.toLowerCase(),'matchup-edge'));}stats.append(m);};
        if(!keys.length&&a&&b){meter('EXPECTED MINUTES',a.minutes,b.minutes);const pool=ratings?.leagues?.[g.league]?.roster?.players||[];const find=(p,t)=>pool.find(x=>key(x.name)===key(p.name)&&x.team_name&&key(t).endsWith(key(x.team_name)));meter('POSITION RATING',find(a,sides[0]?.team)?.rating,find(b,sides[1]?.team)?.rating);}
        if(keys.length){stats.append(node('p',g.state==='FINAL'?'Final game stats':'This game’s stats','matchup-statlabel'));for(const k of keys){const r=node('div',null,'matchup-stat');r.append(node('b',a?.stats?.[k]??'—'),node('span',k),node('b',b?.stats?.[k]??'—'));if(['PTS','REB','AST','STL','BLK','TO'].includes(k)&&a?.stats?.[k]!=null&&b?.stats?.[k]!=null&&Number.isFinite(Number(a.stats[k]))&&Number.isFinite(Number(b.stats[k])))meter(k,a.stats[k],b.stats[k],k==='TO');else stats.append(r);}}
        else stats.append(node('p','Game stats available after tipoff / kickoff.','matchup-statlabel'));
        row.append(stats);box.append(row);
      }
    }
    box.append(node('p','Modeled impact, when available, estimates the team-margin change versus a replacement. It is not a player scoring prediction.','matchup-note'));
    if(lineup?.checked_at)box.append(node('small','Lineups checked '+new Date(lineup.checked_at).toLocaleString(),'matchup-note'));
    if(lineup?.url&&lineup.url.startsWith('https://www.espn.com/')){const a=node('a','Source: ESPN game box score','matchup-source');a.href=lineup.url;a.target='_blank';a.rel='noopener noreferrer';box.append(a);}
    if((ratings?.leagues?.[g.league]?.roster?.players||[]).length)box.append(node('p','Position rating ranks players against others at that position this season (99 is highest). Ratings updated '+new Date(ratings.updated).toLocaleString()+'.','matchup-note'));
    if(!enriched&&typeof root.fetchPublicSnapshot==='function'){
      if(!pending&&Date.now()-ratingsAt>600000)pending=root.fetchPublicSnapshot('ratings.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{ratings=d;ratingsAt=Date.now();}).catch(()=>{}).finally(()=>{pending=null;});
      if(pending)pending.then(()=>{if(box.isConnected)box.replaceWith(render(g,true));});
    }
    return box;
  }
  root.GameMatchups={pair,render};
  if(typeof module!=='undefined')module.exports={pair};
})(typeof window!=='undefined'?window:globalThis);

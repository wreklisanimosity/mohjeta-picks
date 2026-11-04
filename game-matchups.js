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
  function render(g){
    const box=node('section',null,'starter-matchups');
    box.append(node('div','THE MATCHUP LAB','matchup-eyebrow'),node('h3','Starter matchups'));
    const lineup=g.lineups, sides=lineup?.teams||g.teams.map(t=>({team:t.name,status:'unavailable',players:[]}));
    box.append(node('p','Position comparisons—not confirmed defensive assignments or past head-to-head results.','matchup-note'));
    const heading=node('div',null,'matchup-teamhead');
    for(const s of sides.slice(0,2)){const col=node('div');col.append(node('strong',s.team),node('span',s.status==='confirmed'?'Provider-listed starters':s.status==='projected'?'Projected · unconfirmed':'Starters not available','matchup-status '+s.status));heading.append(col);}
    box.append(heading);
    const left=sides[0]?.players||[],right=sides[1]?.players||[];
    if(!left.length&&!right.length){box.append(node('p','Starting lineups haven’t been provided yet. Check back closer to game time.','matchup-empty'));}
    else {
      if(sides.some(s=>s.status==='projected'))box.append(node('p','Projected five uses the highest expected minutes among available rotation players. It can differ from the coach’s starting lineup.','matchup-note'));
      for(const [a,b] of pair(left,right)){
        const row=node('article',null,'matchup-duel');
        const player=(p,team)=>{const card=node('div',null,'matchup-player');if(!p){card.append(node('span','—','matchup-avatar'),node('p','No matching position listed'));return card;}
          card.append(node('span',p.name.split(/\s+/).map(n=>n[0]).slice(0,2).join(''),'matchup-avatar'),node('h4',p.name),node('span',p.pos||'Position unavailable','matchup-pos'));
          if(p.status)card.append(node('small',p.status,'matchup-injury'));
          if(Number.isFinite(p.minutes))card.append(node('small',p.minutes.toFixed(0)+' expected min'));
          const model=(g.sim?.players?.[team]||[]).find(x=>x.name===p.name);
          if(model&&Number.isFinite(model.worth))card.append(node('small',model.worth.toFixed(1)+' '+(g.sim.unit||'pts')+' modeled impact'));
          return card;};
        row.append(player(a,sides[0]?.team),node('span','VS','matchup-vs'),player(b,sides[1]?.team));
        const stats=node('div',null,'matchup-stats');
        const keys=[...new Set([...Object.keys(a?.stats||{}),...Object.keys(b?.stats||{})])].filter(k=>/^(PTS|REB|AST|MIN|STL|BLK|TO|FG|3PT|FT|YDS|TD|INT|SACKS|G|A|SOG|SV|H|R|RBI|SO|IP)$/i.test(k)).slice(0,8);
        if(keys.length){stats.append(node('p',g.state==='FINAL'?'Final game stats':'This game’s stats','matchup-statlabel'));for(const k of keys){const r=node('div',null,'matchup-stat');r.append(node('b',a?.stats?.[k]??'—'),node('span',k),node('b',b?.stats?.[k]??'—'));stats.append(r);}}
        else stats.append(node('p','Game stats available after tipoff / kickoff.','matchup-statlabel'));
        row.append(stats);box.append(row);
      }
    }
    box.append(node('p','Modeled impact, when available, estimates the team-margin change versus a replacement. It is not a player scoring prediction.','matchup-note'));
    if(lineup?.checked_at)box.append(node('small','Lineups checked '+new Date(lineup.checked_at).toLocaleString(),'matchup-note'));
    if(lineup?.url&&lineup.url.startsWith('https://www.espn.com/')){const a=node('a','Source: ESPN game box score','matchup-source');a.href=lineup.url;a.target='_blank';a.rel='noopener noreferrer';box.append(a);}
    return box;
  }
  root.GameMatchups={pair,render};
  if(typeof module!=='undefined')module.exports={pair};
})(typeof window!=='undefined'?window:globalThis);

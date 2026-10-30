/* Shared by the customer browser and forward evaluation. Final-score model,
   not play-by-play. Dispersion and injury-status probabilities remain estimates. */
(function(root){
'use strict';
function rng(seed){let x=seed>>>0;return ()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return (x+0.5)/4294967296;};}
function gaussian(random){return Math.sqrt(-2*Math.log(random()))*Math.cos(2*Math.PI*random());}
function lineup(players, overrides, team, fill, random){
  const rows=players.map(p=>{const key=team+'|'+p.name;
    let sit=key in overrides?(overrides[key]?1:0):p.sit;
    if(random&&sit>0&&sit<1)sit=random()<sit?1:0;
    return {...p,sit,planned:p.minutes*(1-sit)};});
  if(rows.filter(p=>p.planned>0).length<5)return null;
  if(fill)for(const p of rows){if(!p.sit||p.minutes<10)continue;
    const same=rows.filter(q=>q.id!==p.id&&q.role===p.role&&q.planned>0);
    const pool=same.reduce((s,q)=>s+q.planned,0);
    if(pool>0)for(const q of same)q.planned=Math.min(40,q.planned+0.6*p.minutes*p.sit*q.planned/pool);
  }
  // Redistribute all 240 minutes without allowing a player more than 48.
  let remaining=240, pool=rows.filter(p=>p.planned>0), result={};
  while(pool.length){const total=pool.reduce((s,p)=>s+p.planned,0);
    const capped=pool.filter(p=>p.planned*remaining/total>48+1e-9);
    if(!capped.length){for(const p of pool)result[p.id]=p.planned*remaining/total;break;}
    for(const p of capped){result[p.id]=48;remaining-=48;}
    const ids=new Set(capped.map(p=>p.id));pool=pool.filter(p=>!ids.has(p.id));
  }
  let offense=0,defense=0;for(const p of rows){const m=result[p.id]||0;offense+=p.offense*m/48;defense+=p.defense*m/48;}
  return {minutes:result,offense,defense};
}
function project(model, overrides={}, random=null){
  const h=lineup(model.teams[model.home],overrides,model.home,model.fill_in,random);
  const a=lineup(model.teams[model.away],overrides,model.away,model.fill_in,random);
  if(!h||!a)return null;
  const hp=model.home_offset+(h.offense-a.defense)*model.pace/100;
  const ap=model.away_offset+(a.offense-h.defense)*model.pace/100;
  if(!Number.isFinite(hp+ap)||hp<=0||ap<=0)return null;
  return {home:hp,away:ap,margin:hp-ap,total:hp+ap,home_minutes:h.minutes,away_minutes:a.minutes};
}
function simulate(model,overrides={},options={}){
  const n=options.n||10000,random=rng(options.seed==null?20261030:options.seed);
  const center=project(model,overrides);if(!center)return {error:'At least five available players with model data are needed on each team.'};
  const uncertain=Object.entries(model.teams).some(([team,ps])=>ps.some(p=>!(team+'|'+p.name in overrides)&&p.sit>0&&p.sit<1));
  let wins=0,covers=0,pushes=0,overs=0,totalPushes=0,hs=0,as=0;const margins=[],totals=[];
  for(let i=0;i<n;i++){
    const pr=uncertain?project(model,overrides,random):center;
    if(!pr)return {error:'An injury scenario leaves fewer than five available players. Set availability explicitly or wait for a fuller roster.'};
    let h,a;
    // Draw a joint pair of final scores. Conditioning on unequal final scores
    // avoids inventing an overtime winner; this is not an overtime simulator.
    let attempts=0;
    do{const m=pr.margin+model.sd*gaussian(random),t=pr.total+model.total_sd*gaussian(random);
      h=Math.round((t+m)/2);a=Math.round((t-m)/2);
      if(++attempts>1000)return {error:'Score distribution is invalid.'};
    }while(h<0||a<0||h===a);
    const m=h-a,t=h+a;margins.push(m);totals.push(t);hs+=h;as+=a;if(h>a)wins++;
    if(Number.isFinite(options.spread)){if(m+options.spread>0)covers++;else if(m+options.spread===0)pushes++;}
    if(Number.isFinite(options.total)){if(t>options.total)overs++;else if(t===options.total)totalPushes++;}
  }
  const range=xs=>{const ys=xs.slice().sort((a,b)=>a-b);return [ys[Math.floor(n*0.1)],ys[Math.min(n-1,Math.floor(n*0.9))]];};
  return {n,p_home:wins/n,home:hs/n,away:as/n,margin:(hs-as)/n,total:(hs+as)/n,
    cover:covers/n,push:pushes/n,over:overs/n,total_push:totalPushes/n,
    margin80:range(margins),total80:range(totals),margins,totals};
}
const api={project,simulate,lineup};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NbaSim=api;
})(typeof globalThis!=='undefined'?globalThis:this);

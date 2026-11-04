function chatPersonMenu(m,opener){
 const dialog=document.createElement('dialog');dialog.className='gatebox';dialog.setAttribute('aria-label','Options for '+(m.name||'player'));
 const close=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();opener?.focus();});
 dialog.append(el('h3',m.name||'Player'));
 const action=(label,fn)=>{const b=el('button',label,'btn ghost');b.type='button';b.onclick=fn;dialog.append(b);return b;};
 action('Reply in chat',()=>{close();const input=document.querySelector('#chatBox textarea');if(input){input.value='@'+(m.name||'fan')+' ';input.focus();}});
 if(!me)action('Sign in to challenge',()=>{close();document.querySelector('#chatBox input')?.focus();});
 else if(m.user_id&&m.user_id!==me.id){
  const send=action('Challenge to fantasy battle',async()=>{
   send.disabled=true;
   try{const {error}=await sb.rpc('send_fantasy_challenge',{target:m.user_id});if(error)throw error;toast('Challenge sent to '+m.name);close();drawChallenges();}
   catch(e){status.textContent=e.message||'Could not send challenge. Try again.';send.disabled=false;}
  });
  action('Report this message',async()=>{const {error}=await sb.from('reports').insert({message_id:m.id,reason:'reported in chat'});toast(error?'Could not report, or already reported':'Message reported');close();});
 }
 action('Build or view my fantasy team',()=>{close();show('fantasy');});
 dialog.append(el('p','Invitations are private. Both players need a saved team and membership. Accepted challenges create a league for nightly battles. No entry fees or prizes.','hint small'));
 const status=el('p','','hint');status.setAttribute('role','status');dialog.append(status);action('Close',close);document.body.append(dialog);dialog.showModal();
}
let challengesBusy=false;
async function drawChallenges(){
 const box=document.getElementById('challengeInbox');if(!box||!sb||challengesBusy)return;
 if(!me){box.replaceChildren();return;}challengesBusy=true;
 try{
  const {data,error}=await sb.from('fantasy_challenges').select('id,sender,recipient,status,created_at').order('created_at',{ascending:false}).limit(30);if(error)throw error;
  box.replaceChildren();const rows=(data||[]).filter(c=>Date.now()-Date.parse(c.created_at)<7*86400000);if(!rows.length)return;
  const card=el('details',null,'card');card.open=rows.some(c=>c.recipient===me.id&&c.status==='pending');card.append(el('summary','Fantasy invitations'));
  const ids=[...new Set(rows.flatMap(c=>[c.sender,c.recipient]))];const {data:people}=await sb.from('profiles').select('id,display_name').in('id',ids);const names=new Map((people||[]).map(p=>[p.id,p.display_name]));
  for(const c of rows){const incoming=c.recipient===me.id;const row=el('div',null,'challenge-row');row.append(el('b',(incoming?'From ':'To ')+(names.get(incoming?c.sender:c.recipient)||'Player')),el('p',c.status==='accepted'?'Accepted — find your battle in Fantasy → Leagues with friends.':c.status,'hint small'));
   if(c.status==='pending')for(const [label,response] of incoming?[['Accept','accepted'],['Decline','declined']]:[['Cancel','cancelled']]){const b=el('button',label,'btn ghost small');b.type='button';b.onclick=async()=>{row.querySelectorAll('button').forEach(x=>x.disabled=true);try{const {error}=await sb.rpc('respond_fantasy_challenge',{challenge:c.id,response});if(error)throw error;toast(response==='accepted'?'Battle accepted. Your saved teams will play in the nightly league.':'Invitation '+response);drawChallenges();}catch(e){toast(e.message||'Could not update invitation');row.querySelectorAll('button').forEach(x=>x.disabled=false);}};row.append(b);}
   card.append(row);
  }box.append(card);
 }catch(e){box.replaceChildren(el('p','Fantasy invitations are temporarily unavailable. You can still use community chat.','hint small'));}finally{challengesBusy=false;}
}
setInterval(()=>{if(typeof chatOpen==='function'&&chatOpen())drawChallenges();},20000);

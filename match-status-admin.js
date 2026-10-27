import {getPublisherToken} from './auth.js?v=20261018-publish-1';
const S=window.TivvyMatchStatus,$=id=>document.getElementById(id);
let fixtures=[],notices=[],ready=false,busy=false,armed=null;
const selected=()=>fixtures.find(f=>f.id===$('fixture').value);
const existing=f=>notices.find(n=>n.fixtureId===f.id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function localTime(iso){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso)).map(x=>[x.type,x.value]));return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;}
function draft(){const f=selected();return {fixtureId:f.id,fixtureKey:S.key(f),status:$('inspection-status').value,inspectionLocal:$('inspection-local').value,revision:existing(f)?.revision||0};}
function preview(){
 const f=selected();if(!f)return;
 armed=null;$('confirmation').hidden=true;
 const status=$('inspection-status').value;$('time-fields').hidden=status!=='pending';
 // Preview time conversion is for display only; server validates UK time before saving.
 const raw=$('inspection-local').value;
 const n={status,inspectionAt:raw?new Date(raw+'Z').toISOString():null,updatedAt:null};
 let notice='';if(status==='pending')notice=raw?'<div class="inspection-notice inspection-pending"><strong>⚠️ Pending pitch inspection at '+esc(raw.slice(11))+(raw.slice(0,10)===f.date?'':' on '+esc(raw.slice(0,10)))+'</strong></div>':'<p>Choose the inspection date and time to preview the warning.</p>';else notice=S.markup(n,f);
 $('preview').innerHTML='<span class="label">NEXT MATCH · '+(f.homeAway==='H'?'HOME':'AWAY')+'</span><h3>'+esc(f.opposition)+'</h3><p>'+esc(new Date(f.date+'T12:00:00Z').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}))+' · '+esc(f.kickOff)+'</p>'+notice+'<p style="border-top:3px solid #ffe000;padding-top:14px;font-weight:800;color:'+(status==='failed'?'#ff727c':'#ffe000')+'">'+(status==='failed'?'MATCH POSTPONED':'COUNTDOWN TO KICK-OFF')+'</p>';
}
function showSelected(){
 const f=selected();if(!f)return;const n=S.noticeFor(f,notices);
 $('inspection-status').value=n?.status||'none';$('inspection-local').value=n?.inspectionAt?localTime(n.inspectionAt):'';
 $('published').innerHTML=n?S.markup(n,f):'<p>No pitch inspection notice is published for this fixture.</p>';
 preview();
}
function setBusy(value){busy=value;['fixture','inspection-status','inspection-local','review','reload','publish','cancel'].forEach(id=>$(id).disabled=value||(!ready&&id!=='reload'));}
async function load(){
 const previous=$('fixture').value;setBusy(true);$('feedback').textContent='Loading fixtures and current notices…';
 try{
  const responses=await Promise.all([fetch('https://nickabull.github.io/Tiverton-Town-Get-Player-Info/match-centre-fixtures-2026-27.json',{cache:'no-store'}),fetch(S.endpoint,{cache:'no-store'})]);
  if(responses.some(r=>!r.ok))throw Error('Unable to load the publishing connection. Please try Reload.');
  const [feed,data]=await Promise.all(responses.map(r=>r.json()));if(!Array.isArray(data.notices))throw Error('Status service unavailable.');
  fixtures=feed.fixtures.filter(f=>!/^\s*[WDL]\s+\d/.test(f.result||'')&&f.date>=new Date(Date.now()-86400000).toISOString().slice(0,10)).sort((a,b)=>(a.date+a.kickOff).localeCompare(b.date+b.kickOff));notices=data.notices;
  $('fixture').innerHTML=fixtures.map(f=>'<option value="'+esc(f.id)+'">'+esc(f.date+' · '+f.opposition+' · '+(f.homeAway==='H'?'Home':'Away'))+'</option>').join('');
  if(fixtures.some(f=>f.id===previous))$('fixture').value=previous;
  ready=fixtures.length>0;showSelected();$('feedback').textContent=ready?'Connected. Choose a fixture and review your update before publishing.':'No upcoming fixtures are available.';
 }catch(e){ready=false;$('feedback').textContent=e.message;}finally{setBusy(false);}
}
$('fixture').onchange=showSelected;$('inspection-status').onchange=preview;$('inspection-local').oninput=preview;
$('reload').onclick=load;$('cancel').onclick=()=>{$('confirmation').hidden=true;armed=null;};
$('review').onclick=()=>{
 const f=selected(),d=draft();if(d.status==='pending'&&!d.inspectionLocal){$('feedback').textContent='Choose an inspection date and time first.';$('inspection-local').focus();return;}
 armed=JSON.stringify(d);$('confirmation-copy').textContent=f.date+' · '+f.opposition+' ('+(f.homeAway==='H'?'Home':'Away')+') — '+(d.status==='none'?'Remove the pitch inspection notice.':$('preview').querySelector('.inspection-notice')?.textContent||'');$('confirmation').hidden=false;$('publish').focus();
};
$('publish').onclick=async()=>{
 if(busy||!armed||armed!==JSON.stringify(draft()))return;setBusy(true);$('feedback').textContent='Publishing your match status…';
 try{const token=await getPublisherToken();const response=await fetch(S.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:armed});const data=await response.json();if(!response.ok)throw Error(data.error||'Update was not published. Please try again.');notices=notices.filter(n=>n.fixtureId!==data.notice.fixtureId);notices.push(data.notice);showSelected();$('feedback').textContent='Published. The Match Centre will pick up this update within 30 seconds.';}
 catch(e){$('feedback').textContent=e.message;}finally{setBusy(false);}
};
load();

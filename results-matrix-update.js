(function(root){
'use strict';
function runDate(at,zone){return new Intl.DateTimeFormat('en-GB',{timeZone:zone,day:'2-digit',month:'2-digit',year:'2-digit'}).format(new Date(at));}
function textOf(item){return (item.regions||[]).map(r=>r.text||'').join('');}
function planUpdate(feed,binding,current,at=new Date()){
 const order=binding.team_order,n=order.length+1,existing=current||binding.baseline_cells;
 if(order.length!==22||new Set(order).size!==22)throw Error('The approved team order is invalid.');
 if(Object.keys(existing).length!==n*n)throw Error('Read all 529 Canva cells before updating.');
 for(let i=0;i<22;i++)if(existing[String.fromCharCode(66+i)+'1']!==order[i]||existing['A'+(i+2)]!==order[i])throw Error('The Canva table headings have changed. Rebind the table before updating.');
 if(!Array.isArray(feed.teams)||feed.teams.length!==22||feed.teams.some(t=>!order.includes(feed.codes[t])))throw Error('The feed does not match the approved league.');
 const operations=[],conflicts=[],seen=new Map(),formatting=[];
 for(const result of feed.results||[]){
  const home=feed.codes[result.home],away=feed.codes[result.away];
  if(!order.includes(home)||!order.includes(away)||home===away||!/^\d+-\d+$/.test(result.score))throw Error('Invalid result in the feed.');
  const cell=String.fromCharCode(66+order.indexOf(away))+(order.indexOf(home)+2);
  if(seen.has(cell))throw Error('Duplicate fixture in the feed: '+home+' v '+away);
  seen.set(cell,result.score);
  const present=existing[cell],baseline=binding.baseline_cells[cell];
  if(present===result.score)continue;
  if(present.trim()||baseline.trim()){
   conflicts.push({cell,home,away,current:present,feed:result.score,reason:present!==baseline?'Manual Canva edit retained':'Existing score differs; review required'});continue;
  }
  const element_id=binding.page_id+'-'+binding.table_id+'-'+cell;
  operations.push({type:'replace_text',element_id,text:result.score});
  if(home==='TIV'||away==='TIV'){
   const [h,a]=result.score.split('-');formatting.push({element_id,cell,black:'#111111',red:'#d71920',red_start:home==='TIV'?0:h.length+1,red_length:home==='TIV'?h.length:a.length});
  }
 }
 const missing=Object.entries(binding.baseline_cells).filter(([cell,value])=>/^\d+-\d+$/.test(value)&&!seen.has(cell));
 if(missing.length)throw Error('The feed is missing '+missing.length+' previously published results. Canva has not been changed.');
 return {schema_version:1,status:conflicts.length?'review_required':'ready_for_canva',design_id:binding.design_id,page_id:binding.page_id,table_id:binding.table_id,run_at:new Date(at).toISOString(),result_count:seen.size,operations,character_formatting:formatting,conflicts,subtitle_operation:{type:'replace_text',element_id:binding.subtitle_element_id,text:binding.subtitle_pattern.replace('{run_date}',runDate(at,binding.timezone))},instructions:'Read live Canva cells first; regenerate this plan from that snapshot. Apply score operations and Tiverton character formatting, verify every result, then apply the subtitle. Save only on success. Never recreate the table.'};
}
function snapshot(richtexts,binding){const prefix=binding.page_id+'-'+binding.table_id+'-';return Object.fromEntries(richtexts.filter(x=>x.element_id.startsWith(prefix)).map(x=>[x.element_id.slice(prefix.length),textOf(x)]));}
const api={planUpdate,snapshot,runDate};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TivvyMatrixUpdate=api;
})(typeof globalThis!=='undefined'?globalThis:this);

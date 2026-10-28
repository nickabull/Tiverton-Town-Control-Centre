/* Pure issue planning. Canva is changed only by a subsequent connected run. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TivvyIssuePlan=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MASTER='DAHYKUo9Tzo';
function audit(registry,snapshot){
 const errors=[],pages=registry.pages.filter(p=>p.active!==false),seen=new Set(),positions=new Map();
 if(registry.master.canva_design_id!==MASTER||snapshot.design_id!==MASTER)errors.push('Wrong Canva master.');
 for(const p of snapshot.pages){if(positions.has(p.page_id))errors.push('Duplicate live page ID: '+p.page_id);positions.set(p.page_id,p.position);}
 for(const p of pages){if(seen.has(p.master_page_id))errors.push('Duplicate registry page ID: '+p.master_page_id);seen.add(p.master_page_id);if(!positions.has(p.master_page_id))errors.push('Missing active page: '+p.name);}
 for(const p of snapshot.pages)if(!seen.has(p.page_id))errors.push('Unregistered live page: '+p.page_id);
 return {errors,pages:pages.filter(p=>positions.has(p.master_page_id)).map(p=>({...p,position:positions.get(p.master_page_id)})).sort((a,b)=>a.position-b.position)};
}
function plan(registry,snapshot,policy,input={}){
 const checked=audit(registry,snapshot),errors=[...checked.errors],warnings=[],omitted=new Set(),insertions=[],counts=input.counts||{};
 if(policy.design_id!==MASTER)errors.push('Wrong page policy master.');
 const byKey=new Map(checked.pages.map(p=>[p.key,p]));
 for(const g of policy.groups){
  const count=counts[g.key]===undefined?g.default_count:counts[g.key];
  if(!Number.isInteger(count)||count<0||count>g.max_count){errors.push('Invalid page count for '+g.name);continue;}
  g.page_keys.slice(count).forEach(key=>omitted.add(key));
  for(const key of g.page_keys.slice(0,Math.min(count,g.page_keys.length)))if(!byKey.has(key))errors.push('Missing layout '+key);
  if(count>g.page_keys.length){const source=byKey.get(g.extra_page_template_key);if(!source)errors.push('Extra-page template is missing for '+g.name);else insertions.push({group:g.key,count:count-g.page_keys.length,source_master_page_id:source.master_page_id,source_page_number:source.position,after_source_page_id:byKey.get(g.page_keys.at(-1))?.master_page_id,exact_operation_review_required:true,target:'new_issue_copy_only'});}
 }
 const selected=checked.pages.filter(p=>!omitted.has(p.key)),excluded=checked.pages.filter(p=>omitted.has(p.key));
 const date=String(input.fixture?.date||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!input.fixture?.opponent?.trim()||!/^\d{2}:\d{2}$/.test(input.fixture?.kickoff||''))errors.push('Confirm the fixture, date and kick-off in Cover.');
 if(date&&input.today&&date<input.today)errors.push('The saved cover fixture is in the past. Confirm the new programme fixture.');
 if(!selected.length)errors.push('No pages selected.');
 const finalCount=selected.length+insertions.reduce((n,p)=>n+p.count,0);
 if(finalCount%4)warnings.push('Print check: '+finalCount+' pages is not a multiple of four. Review with your printer; no filler has been added.');
 if(insertions.length)warnings.push('Extra layout insertion needs approval of the exact working-copy operation before execution.');
 const absent=registry.pages.filter(p=>p.active===false);if(absent.length)warnings.push('Unavailable old layouts are excluded: '+absent.map(p=>p.name).join(', ')+'.');
 return {schema_version:1,kind:'tivvy_complete_issue_request',status:errors.length?'blocked':insertions.length?'page_insertion_review_required':'connected_run_required',execution_mode:'chatgpt_assisted_connected_run',standalone_canva_write_supported:false,master_design_id:MASTER,audit_captured_at:snapshot.captured_at,fixture:input.fixture,counts,final_page_count:finalCount,errors,warnings,copy:{operation:'copy_design',design_id:MASTER,page_numbers:selected.map(p=>p.position),master_unchanged:true,recheck_live_ids_before_copy:true},selected_pages:selected.map(p=>({key:p.key,master_page_id:p.master_page_id,source_position:p.position,name:p.name,type:p.type})),excluded_pages:excluded.map(p=>({key:p.key,master_page_id:p.master_page_id,source_position:p.position,name:p.name})),extra_page_requests:insertions,copy_mapping_rule:'Read the copied design. Match copied pages to this approved source sequence; never reuse master page or element IDs as write targets. Validate page counts and section content before writing.',overflow_rule:'Exclude unused section pages from this issue only. Never carry stale text, truncate supplied words, shrink fonts, alter template artwork or remove adverts to make a report fit.',proof_required:true,reviewed_by_user:!!input.reviewed};
}
function filename(value){return String(value||'file').replace(/[\\/\x00-\x1f:]/g,'_').replace(/^\.+/,'').slice(0,160)||'file';}
function zip(files){
 const encoder=new TextEncoder(),chunks=[],central=[];let offset=0;
 function u16(d,o,v){d.setUint16(o,v,true)}function u32(d,o,v){d.setUint32(o,v>>>0,true)}
 const table=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
 const crc=bytes=>{let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
 for(const f of files){if(!f.name||f.name.includes('..')||f.name.startsWith('/')||f.name.includes('\\'))throw Error('Unsafe package path.');const name=encoder.encode(f.name),bytes=typeof f.bytes==='string'?encoder.encode(f.bytes):f.bytes,c=crc(bytes),local=new Uint8Array(30+name.length),l=new DataView(local.buffer);u32(l,0,0x04034b50);u16(l,4,20);u16(l,6,0x800);u16(l,12,0x21);u32(l,14,c);u32(l,18,bytes.length);u32(l,22,bytes.length);u16(l,26,name.length);local.set(name,30);chunks.push(local,bytes);const head=new Uint8Array(46+name.length),h=new DataView(head.buffer);u32(h,0,0x02014b50);u16(h,4,20);u16(h,6,20);u16(h,8,0x800);u16(h,14,0x21);u32(h,16,c);u32(h,20,bytes.length);u32(h,24,bytes.length);u16(h,28,name.length);u32(h,42,offset);head.set(name,46);central.push(head);offset+=local.length+bytes.length;}
 const size=central.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);u32(e,0,0x06054b50);u16(e,8,files.length);u16(e,10,files.length);u32(e,12,size);u32(e,16,offset);return new Blob([...chunks,...central,end],{type:'application/zip'});
}
return {MASTER,audit,plan,filename,zip};
});

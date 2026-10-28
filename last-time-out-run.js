(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TivvyLastOut=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MASTER='CHATGPT LEAGUE TEMPLATE';
 function validate(binding){if(binding.design_title!==MASTER||binding.key!=='last_time_out')throw Error('Last Time Out must target CHATGPT LEAGUE TEMPLATE only.');if(binding.pages.length!==4||binding.fields.filter(f=>f.kind==='body').length!==6)throw Error('The saved report spread needs checking.');}
 function flow(binding,text,options={}){
  validate(binding);
  const count=options.page_count??binding.pages.length;if(!Number.isInteger(count)||count<1||count>binding.pages.length)throw Error('Choose between one and four pages, or leave this section out in Build this issue.');
  const active=new Set(binding.pages.slice(0,count).map(p=>p.key));
  const paragraphs=String(text||'').trim().split(/\n\s*\n/).filter(Boolean),slots=binding.fields.filter(f=>f.kind==='body'&&active.has(f.page_key));
  if(!paragraphs.length)throw Error('Paste the complete report first.');
  const sums=[0];for(const p of paragraphs)sums.push(sums[sums.length-1]+p.length+2);
  const total=sums[sums.length-1],capacity=slots.reduce((s,f)=>s+f.estimated_capacity,0),n=paragraphs.length;
  const dp=Array.from({length:slots.length+1},()=>Array(n+1).fill(Infinity)),back=Array.from({length:slots.length+1},()=>[]);dp[0][0]=0;
  for(let k=1;k<=slots.length;k++)for(let end=0;end<=n;end++)for(let start=0;start<=end;start++){
   const chars=sums[end]-sums[start],target=total*slots[k-1].estimated_capacity/capacity;
   const cost=dp[k-1][start]+Math.pow((chars-target)/Math.max(target,1),2)+(chars>slots[k-1].estimated_capacity?10:0);
   if(cost<dp[k][end]){dp[k][end]=cost;back[k][end]=start;}
  }
  let end=n;const out={};for(let k=slots.length;k>0;k--){const start=back[k][end];out[slots[k-1].key]=paragraphs.slice(start,end).join('\n\n');end=start;}
  return out;
 }
 function prepare(binding,input={}){
  validate(binding);
  const count=input.page_count??binding.pages.length;if(!Number.isInteger(count)||count<1||count>binding.pages.length)throw Error('Choose between one and four pages, or leave this section out in Build this issue.');
  const active=new Set(binding.pages.slice(0,count).map(p=>p.key));
  const overrides={...(input.overrides||{})},body=input.report?.trim()?flow(binding,input.report,{page_count:count}):{};
  const bodyFields=binding.fields.filter(f=>f.kind==='body');
  const savedSplit=bodyFields.map(f=>String(overrides[f.key]||'')).filter(Boolean).join('\n\n');
  if(input.report?.trim()&&savedSplit===input.report.trim())bodyFields.forEach(f=>delete overrides[f.key]);
  else if(bodyFields.some(f=>!active.has(f.page_key)&&String(overrides[f.key]||'').trim()))throw Error('An omitted page still contains edited copy. Reconcile it into the complete report, then redistribute; no wording has been discarded.');
  Object.assign(body,overrides);
  if(input.article_headline?.trim()){
   const first=binding.fields.find(f=>f.kind==='body');body[first.key]=input.article_headline.trim()+'\n\n'+(body[first.key]??first.baseline);
  }
  const updates=binding.fields.filter(f=>active.has(f.page_key)&&Object.prototype.hasOwnProperty.call(body,f.key)).map(f=>({type:'replace_text',key:f.key,page_key:f.page_key,field_kind:f.kind,text:String(body[f.key]),preserve_unspecified_live_content:true}));
  const media=binding.media_slots.filter(m=>(!m.page_key||active.has(m.page_key))&&String(input.media?.[m.key]||'').trim()).map(m=>({...m,...(m.page_keys?{page_keys:m.page_keys.filter(k=>active.has(k))}:{}),replacement_reference:String(input.media[m.key]).trim(),action:'resolve_reference_then_replace_fill'}));
  const warnings=[];for(const u of updates){const f=binding.fields.find(f=>f.key===u.key);if(f.kind==='body'&&u.text.length>f.estimated_capacity)warnings.push(f.label+': longer than the baseline box capacity; check fit in Canva.');}
  const source=String(input.source||'').trim(),attachment=String(input.attachment||'').trim();
  if(!updates.length&&!media.length&&!source&&!attachment)throw Error('Supply a report, source reference or an editorial change first.');
  const sourceOnly=!input.report?.trim()&&(source||attachment)&&!updates.some(u=>u.key.startsWith('body_'));
  return {schema_version:1,source_design_id:'DAHYKUo9Tzo',target_policy:'new_issue_copy_only',active_page_keys:[...active],excluded_page_keys:binding.pages.filter(p=>!active.has(p.key)).map(p=>p.key),page_count:count,section:'last_time_out',source_design_title:MASTER,target_design_title:null,target_design_id:null,binding_resolution:'read_live_canva_in_connected_session',execution_mode:'chatgpt_assisted_connected_run',standalone_canva_write_supported:false,status:sourceOnly?'source_import_required':'preview_required',source_url:source,attachment_reference:attachment,article_headline:input.article_headline||'',complete_report:input.report||'',resolve_match_metadata:!!(input.report?.trim()||source||attachment),metadata_targets:binding.fields.filter(f=>f.kind==='metadata'&&active.has(f.page_key)).map(f=>({key:f.key,page_key:f.page_key,explicit_override:Object.prototype.hasOwnProperty.call(overrides,f.key)?overrides[f.key]:null})),text_updates:updates,media_replacements:media,editorial_notes:input.notes||'',warnings,binding,instructions:'Use the named league master as the source only. Copy the approved issue pages first, omit unused report pages from the copy, then resolve fresh page and native element IDs in that issue copy before editing. Never write these updates into the master. Do not publish their content or metadata to the repository. Import a referenced report if needed. For a new report resolve the correct fixture and replace stale score/opponent/date metadata using the source, with explicit overrides taking precedence; never invent a missing date. Preserve supplied wording and paragraph order, then preview every affected page for fit. Apply only explicit media/headline/credit overrides. Preserve native Antonio text, frames, all other manual edits and selected issue page order. Never truncate words or shrink type; request an approved extra layout if needed. Never target the cup design. Flag factual inconsistencies for Nick; do not silently correct names.'};
 }
 return {MASTER,flow,prepare};
});

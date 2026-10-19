(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TivvyOppPreview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MASTER='CHATGPT LEAGUE TEMPLATE';
 function validate(binding){if(binding.design_title!==MASTER||binding.key!=='opposition_preview')throw Error('Meet the Opposition Preview must target CHATGPT LEAGUE TEMPLATE only.');if(binding.pages.length!==4||binding.pages.some((p,i)=>p.key!=='opposition_preview_'+(i+1))||binding.fields.filter(f=>f.kind==='body').length!==6)throw Error('The saved preview spread needs checking.');}
 function flow(binding,text){
  validate(binding);
  const paragraphs=String(text||'').trim().split(/\n\s*\n/).filter(Boolean),slots=binding.fields.filter(f=>f.kind==='body');
  if(!paragraphs.length)throw Error('Paste the complete preview first.');
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
  const overrides=input.overrides||{},body=input.report?.trim()?flow(binding,input.report):{};
  Object.assign(body,overrides);
  if(input.article_headline?.trim()){
   const first=binding.fields.find(f=>f.kind==='body');body[first.key]=input.article_headline.trim()+'\n\n'+(body[first.key]??first.baseline);
  }
  const updates=binding.fields.filter(f=>Object.prototype.hasOwnProperty.call(body,f.key)).map(f=>({type:'replace_text',key:f.key,page_key:f.page_key,field_kind:f.kind,text:String(body[f.key]),preserve_unspecified_live_content:true}));
  const media=binding.media_slots.filter(m=>String(input.media?.[m.key]||'').trim()).map(m=>({...m,replacement_reference:String(input.media[m.key]).trim(),action:'resolve_reference_then_replace_fill'}));
  const warnings=[];for(const u of updates){const f=binding.fields.find(f=>f.key===u.key);if(f.kind==='body'&&u.text.length>f.estimated_capacity)warnings.push(f.label+': longer than the baseline box capacity; check fit in Canva.');}
  const source=String(input.source||'').trim(),attachment=String(input.attachment||'').trim();
  if(!updates.length&&!media.length&&!source&&!attachment)throw Error('Supply a report, source reference or an editorial change first.');
  const sourceOnly=!input.report?.trim()&&(source||attachment)&&!updates.some(u=>u.key.startsWith('body_'));
  return {schema_version:1,section:'opposition_preview',target_design_title:MASTER,binding_resolution:'read_live_canva_in_connected_session',execution_mode:'chatgpt_assisted_connected_run',standalone_canva_write_supported:false,status:sourceOnly?'source_import_required':'preview_required',source_url:source,attachment_reference:attachment,article_headline:input.article_headline||'',complete_report:input.report||'',resolve_match_metadata:!!(input.report?.trim()||source||attachment),metadata_targets:binding.fields.filter(f=>f.kind==='metadata').map(f=>({key:f.key,page_key:f.page_key,explicit_override:Object.prototype.hasOwnProperty.call(overrides,f.key)?overrides[f.key]:null})),text_updates:updates,media_replacements:media,editorial_notes:input.notes||'',warnings,binding,instructions:'Resolve the named standard league design and the four opposition_preview pages only from the existing registry, then read the live native elements before editing. Do not publish their content or metadata to the repository. Import a referenced report if needed. For a new report resolve the correct fixture and replace stale upcoming opponent/date/kick-off/venue/competition metadata using the source, with explicit overrides taking precedence; never invent a missing date. Preserve supplied wording and paragraph order, then preview every affected page for fit. Apply only explicit media/headline/credit overrides. Preserve native Antonio text, frames, all other manual edits and page order. Never target the cup design, club facts/squad/honours pages, Last Time Out or any other section. Flag factual inconsistencies for Nick; do not silently correct names.'};
 }
 return {MASTER,flow,prepare};
});

(function(root){
 'use strict';
 function saturdayBeforeToday(now=new Date()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
  const date=new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day)));
  const back=(date.getUTCDay()+1)%7||7;
  date.setUTCDate(date.getUTCDate()-back);
  return date.toISOString().slice(0,10);
 }
 function prepare(binding,date,notes=''){
  const day=new Date(String(date)+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(day.getTime())||day.toISOString().slice(0,10)!==date||day.getUTCDay()!==6)throw Error('Choose the Saturday you want this round-up to cover.');
  if(binding.story_count!==6||binding.columns!==2||binding.stories_per_column!==3||binding.photo_fields.length!==2||binding.text_fields.length!==4)throw Error('The approved six-story layout could not be verified.');
  return {schema_version:1,section:'around_league',status:'research_and_review_required',coverage_date:date,timezone:'Europe/London',competition:'Southern League Division One South',design_id:binding.design_id,page_id:binding.page_id,layout_binding:binding,editorial_notes:String(notes),standalone_canva_write_supported:false,instructions:[
   'Research six distinct stories from the selected completed Saturday involving Division One South clubs. Exclude Tiverton-led stories and verify the final results against club or league reports. Do not reuse an older round-up as fresh news.',
   'Write original concise summaries in the two existing text columns: three stories per column, uppercase Antonio 18pt headlines and regular Antonio 14pt body text. Tighten copy to fit above the existing photo row.',
   'Choose the best two relevant real photographs, check the subjects and available credits, and replace only the two existing image fills. Update both native captions with accurate photographer credits. Do not pass off archive imagery as action from the selected match.',
   'Read the live Canva page first, preserve manual edits, then update only the four bound text fields and two photo fills. Leave the template background, header, footer and photo positions unchanged. Keep all copy editable.',
   'Verify six stories, typography, factual details, crops, credits and white-area fit before saving. Update the binding baseline only after a successful connected run.'
  ]};
 }
 const api={saturdayBeforeToday,prepare};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.TivvyAroundLeague=api;
})(typeof globalThis!=='undefined'?globalThis:this);

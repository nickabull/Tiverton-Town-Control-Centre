const assert=require('node:assert/strict'),fs=require('node:fs');
const api=require('../last-time-out-run.js'),binding=JSON.parse(fs.readFileSync('data/last-time-out-binding.json'));
const paragraphs=Array.from({length:20},(_,i)=>'Paragraph '+i+'. '+('Report wording stays exactly as supplied. '.repeat(i%4+1)).trim());
const report=paragraphs.join('\n\n'),split=api.flow(binding,report);
assert.equal(Object.values(split).reverse().filter(Boolean).join('\n\n'),report); // reconstruction uses native read-order keys below
const bodies=binding.fields.filter(f=>f.kind==='body');
assert.equal(bodies.map(f=>split[f.key]).filter(Boolean).join('\n\n'),report);
const plan=api.prepare(binding,{report,overrides:{heading_1:'OUR LAST MATCH'},media:{opponent_crest:'Canva asset MAexample'}});
assert.equal(plan.target_design_title,'CHATGPT LEAGUE TEMPLATE');assert.equal(plan.standalone_canva_write_supported,false);
assert.equal(plan.text_updates.find(u=>u.key==='heading_1').text,'OUR LAST MATCH');
assert.equal(plan.media_replacements.length,1);assert.equal(plan.media_replacements[0].preserve_existing_frame,true);
assert.ok(plan.resolve_match_metadata);assert.ok(plan.metadata_targets.every(m=>m.explicit_override===null));
assert.throws(()=>api.prepare({...binding,design_title:'CHATGPT DEVON COUNTY CUP TEMPLATE'},{report}),/LEAGUE TEMPLATE/);
assert.equal(api.prepare(binding,{attachment:'Darren report.docx'}).status,'source_import_required');
assert.equal(api.prepare(binding,{overrides:{score:''}}).text_updates[0].text,'');
assert.equal(api.prepare(binding,{overrides:{heading_2:'CONTINUED'}}).media_replacements.length,0);
assert.throws(()=>api.prepare(binding,{}),/Supply a report/);
assert.ok(api.prepare(binding,{report:'Very long report. '.repeat(8000)}).warnings.length);
console.log('Report wording/order, league-only target, optional replacements, metadata review and overflow checks passed');

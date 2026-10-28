const assert=require('node:assert/strict'),fs=require('node:fs'),P=require('../issue-page-plan.js');
const read=n=>JSON.parse(fs.readFileSync('data/'+n+'.json'));
const registry=read('programme-page-registry'),snapshot=read('canva-page-snapshot'),policy=read('issue-page-policy');
const fixture={date:'2026-11-03',opponent:'Test opposition',kickoff:'19:30'};
const base={fixture,today:'2026-10-28'};
assert.equal(P.audit(registry,snapshot).errors.length,0);assert.equal(P.audit(registry,snapshot).pages.length,52);
let p=P.plan(registry,snapshot,policy,base);assert.equal(p.final_page_count,52);assert.equal(p.copy.page_numbers.length,52);assert.equal(p.status,'connected_run_required');assert(p.copy.master_unchanged);
p=P.plan(registry,snapshot,policy,{...base,counts:{last_time_out:3,opposition_preview:3,opposition_pen_pics:3}});
assert.equal(p.final_page_count,47);assert.equal(p.excluded_pages.length,5);assert(!p.selected_pages.some(p=>p.key==='last_time_out_4'));assert(p.selected_pages.some(p=>p.key==='fixed_18'),'interleaved advert is retained');assert(p.warnings.some(w=>w.includes('multiple of four')));
p=P.plan(registry,snapshot,policy,{...base,counts:{opposition_pen_pics:7}});assert.equal(p.final_page_count,53);assert.equal(p.extra_page_requests.length,1);assert.equal(p.extra_page_requests[0].count,1);assert(p.extra_page_requests[0].exact_operation_review_required);assert.equal(p.status,'page_insertion_review_required');assert.equal(p.copy.page_numbers.length,52,'no invented seventh page ID or duplicate copy index');
const reversed={...snapshot,pages:snapshot.pages.map(p=>({...p,position:53-p.position}))};p=P.plan(registry,reversed,policy,base);assert.equal(p.selected_pages[0].master_page_id,snapshot.pages.at(-1).page_id,'fresh ID mapping controls order');
const missing={...snapshot,pages:snapshot.pages.slice(1)};assert(P.plan(registry,missing,policy,base).errors.some(x=>x.includes('Missing active page')));
assert(P.plan(registry,snapshot,policy,{...base,fixture:{...fixture,date:'2026-10-27'}}).errors.some(e=>e.includes('past')));
assert(P.plan(registry,snapshot,policy,{...base,counts:{opposition_pen_pics:8}}).errors.length);
assert(P.plan(registry,{...snapshot,design_id:'WRONG'},policy,base).errors.length);
for(const file of ['last-time-out-run','opposition-preview-run']){
 const api=require('../'+file+'.js'),binding=read(file==='last-time-out-run'?'last-time-out-binding':'opposition-preview-binding');
 const report=Array.from({length:12},(_,i)=>'Paragraph '+i+' preserves the exact supplied wording.').join('\n\n');
 const split=api.flow(binding,report,{page_count:3});assert.equal(binding.fields.filter(f=>f.kind==='body').map(f=>split[f.key]).filter(Boolean).join('\n\n'),report);
 const plan=api.prepare(binding,{report,page_count:3,overrides:{heading_4:'STALE FOURTH PAGE'}});assert.equal(plan.page_count,3);assert.equal(plan.active_page_keys.length,3);assert.equal(plan.excluded_page_keys.length,1);assert(!plan.text_updates.some(x=>x.page_key.endsWith('_4')));assert.equal(plan.target_policy,'new_issue_copy_only');
}
(async()=>{const zip=P.zip([{name:'issue-request.json',bytes:JSON.stringify({test:'✓'})},{name:'assets/photo.txt',bytes:'image test bytes'}]);fs.writeFileSync('/tmp/tivvy-issue-package-test.zip',Buffer.from(await zip.arrayBuffer()));console.log('52-page identity audit, variable sections, protected pages, stale fixture/ID guards, exact wording and ZIP package passed.');})();
for(const name of ['last-time-out-run','opposition-preview-run']){
 const api=require('../'+name+'.js'),binding=read(name==='last-time-out-run'?'last-time-out-binding':'opposition-preview-binding');
 const report=Array.from({length:30},(_,i)=>'Paragraph '+i+' '+('complete words and facts '.repeat(8))).join('\n\n').trim();
 const old=api.flow(binding,report,{page_count:4});
 const fresh=api.prepare(binding,{report,page_count:3,overrides:old});
 assert.equal(fresh.text_updates.filter(u=>u.field_kind==='body').map(u=>u.text).filter(Boolean).join('\n\n'),report,'old four-page auto-split cannot drop words on reflow');
 const last=binding.fields.filter(f=>f.kind==='body').at(-1);
 assert.throws(()=>api.prepare(binding,{report,page_count:3,overrides:{...old,[last.key]:'A manually edited final paragraph'}}),/omitted page still contains edited copy/);
}

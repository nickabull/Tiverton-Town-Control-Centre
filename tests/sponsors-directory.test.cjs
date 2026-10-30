const assert=require('node:assert/strict'),fs=require('node:fs');
const M=require('../sponsors-directory-model.js'),data=JSON.parse(fs.readFileSync(new URL('../data/sponsors-directory.json','file://'+__filename)));
const active=data.sponsors.filter(r=>M.visible(r,'2026-10-30'));
assert.equal(data.sourceEntryCount,73);assert.equal(data.uniqueSponsorCount,66);assert.equal(data.sponsors.length,data.publishedSponsorCount);assert.equal(new Set(data.sponsors.map(r=>r.id)).size,data.sponsors.length);assert(data.sponsors.every(r=>r.status==='active'&&r.confidence==='confirmed'&&!('reviewNote' in r)));
assert(active.length>=40);assert.equal(M.visible({status:'active',confidence:'needs_confirmation'}),false);
const record={status:'active',confidence:'confirmed',activeFrom:'2026-10-01',activeUntil:'2026-10-30'};
assert(M.visible(record,'2026-10-30'));assert(!M.visible(record,'2026-10-31'));assert(!M.visible(record,'2026-09-30'));
assert(!M.visible({...record,status:'archived'},'2026-10-20'));
assert(M.search(active,'plumber','').every(r=>r.categories.includes('Plumbing & Heating')));
assert(M.search(active,'plumber','').some(r=>r.id==='edwards-plumbing'));
assert(M.search(active,'accountant','').every(r=>r.categories.includes('Accountants & Finance')));
assert(M.search(active,'dog','Pets & Animals').some(r=>r.name.includes('Dog')));
assert.equal(M.url('javascript:alert(1)'), '');assert.equal(M.url('a@example.com','email'),'mailto:a@example.com');assert.equal(M.url('+44 1884 123456','phone'),'tel:+441884123456');
for(const r of active){assert(r.summary&&r.categories.length&&r.sources.length);assert(r.website||r.phone||r.email);if(r.logo)assert(fs.existsSync(new URL('../'+r.logo,'file://'+__filename)));}
console.log('Passed: deduplication, search relevance, identity holds, date/season visibility, contact URL validation and assets.');

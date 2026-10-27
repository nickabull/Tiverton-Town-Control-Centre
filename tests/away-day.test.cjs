const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../away-day-core.js');
const root = path.join(__dirname, '..');
const binding = JSON.parse(fs.readFileSync(path.join(root,'data/away-trip-binding.json')));
const guide = JSON.parse(fs.readFileSync(path.join(root,binding.trip_source)));

test('the Automator-selected guide is Weymouth with the latest shared league record', () => {
  assert.equal(guide.opponent,'Weymouth FC');
  assert.equal(guide.fixture.date,'2026-10-31');
  const r=C.summarise(guide.football,guide.opponent,'2026-10-27');
  assert.deepEqual([r.position,r.p,r.w,r.d,r.l,r.gf,r.ga,r.pts],[1,12,11,1,0,33,9,34]);
  assert.equal(r.latest,'2026-10-27');
  assert.equal(r.lastFive.at(-1).opponent,'Shaftesbury');
});
test('the calendar uses GMT, the selected opponent and the correct ground', () => {
  const calendar=C.calendar(guide.fixture);
  assert.match(calendar,/DTSTART:20261031T150000Z/);
  assert.match(calendar,/SUMMARY:Weymouth FC v Tiverton Town/);
  assert.match(calendar,/LOCATION:Bob Lucas Stadium/);
  assert.doesNotMatch(calendar,/Larkhall|20261024/);
});
test('online ticket totals use the match-specific Weymouth categories', () => {
  assert.equal(C.ticketTotal(guide.ticket_prices,{adult:1}),14);
  assert.equal(C.ticketTotal(guide.ticket_prices,{adult:2,concession:1,youth:1,child:1,junior:1}),48);
});
test('every visible content section and booking link belongs to Weymouth', () => {
  const html=fs.readFileSync(path.join(root,'away-day.html'),'utf8');
  assert.doesNotMatch(html,/Larkhall|Bath|Plain Ham|24 October|active demo/);
  for(const key of ['.trip-hero','.guide-toolbar','.opposition','.travel-section','.practical-grid','.lower-grid','.sources','.footnote'])assert.equal(typeof guide.content[key],'string');
  assert.match(guide.fixture.tickets,/away-tickets.*50261/);
  assert.match(C.drivingUrl('Tiverton',guide.fixture.address),/Weymouth/);
});

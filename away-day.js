(function () {
  'use strict';
  const C = window.AwayDayCore, STORE = 'tivvy-away-larkhall-20261024-v1';
  let guide = null, football = null, snapshot = null;
  const $ = id => document.getElementById(id);
  const esc = text => String(text ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const date = iso => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/London' }).format(new Date(iso + 'T12:00:00Z'));
  const today = () => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/London' }).format(new Date());
  const ordinal = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  function read() { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { return {}; } }
  function save(key, value) { try { const state = read(); state[key] = value; localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* The planner still works without storage. */ } }
  function message(text) { $('feedback').textContent = text; }
  async function copy(text, success) {
    try { await navigator.clipboard.writeText(text); message(success); }
    catch { $('load-error').hidden = false; $('load-error').textContent = 'Clipboard access is unavailable here. Use Print / save PDF to keep a copy of the guide.'; }
  }
  function renderFootball(record, mode) {
    football = record;
    const stats = [[ordinal(record.position), 'Position'], [record.p, 'Played'], [record.w, 'Won'], [record.d, 'Drawn'], [record.l, 'Lost'], [record.pts, 'Points']];
    $('stats').innerHTML = stats.map(([value, label]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join('');
    $('form').innerHTML = record.lastFive.map(r => `<span class="result-${r.outcome.toLowerCase()}" title="${esc(date(r.date) + ' · ' + r.opponent + ' (' + r.venue + ') ' + r.gf + '–' + r.ga)}" aria-label="${esc(r.outcome + ': ' + r.opponent + ', ' + date(r.date))}">${r.outcome}</span>`).join('');
    $('home-record').textContent = `At home: ${record.home.w}W · ${record.home.d}D · ${record.home.l}L   |   Goals ${record.gf} for / ${record.ga} against overall (GD ${record.gd > 0 ? '+' : ''}${record.gd})`;
    $('football-status').textContent = `${mode} · results through ${date(record.latest)} · feed updated ${record.updated || 'date unavailable'}`;
    $('recent-results').innerHTML = `<table><caption class="source-line">Larkhall perspective; oldest first</caption><thead><tr><th>Date</th><th>Opponent</th><th>H/A</th><th>Score</th><th>Result</th></tr></thead><tbody>${record.lastFive.map(r => `<tr><td>${esc(date(r.date))}</td><td>${esc(r.opponent)}</td><td>${r.venue}</td><td>${r.gf}–${r.ga}</td><td>${r.outcome}</td></tr>`).join('')}</tbody></table>`;
    const latestDate = record.latest;
    if (latestDate >= '2026-10-20') document.querySelector('.upcoming').textContent = 'Pre-visit league games on 17 and 20 October are now within the displayed result cut-off. Check the match list and official fixture before travelling.';
  }
  async function fetchJson(url) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
    try { const response = await fetch(url, { cache: 'no-store', signal: controller.signal }); if (!response.ok) throw new Error('HTTP ' + response.status); return await response.json(); }
    finally { clearTimeout(timer); }
  }
  async function refreshFootball() {
    if (!guide) return;
    const button = $('refresh'); button.disabled = true; button.textContent = 'Checking results…';
    try {
      const feed = await fetchJson('https://nickabull.github.io/Tiverton-Town-Get-Results/data.json?v=' + Date.now());
      const next = C.summarise(feed, guide.opponent, today());
      if (next.p < snapshot.p || next.divisionLatest < snapshot.divisionLatest || next.resultCount < snapshot.resultCount) throw new Error('Incomplete or older snapshot');
      renderFootball(next, 'Refreshed from results feed');
    } catch {
      $('football-status').textContent = `Refresh unavailable or incomplete · keeping the displayed snapshot through ${date(football.latest)}. Try again later or check the full league table.`;
    } finally { button.disabled = false; button.textContent = 'Refresh football data'; }
  }
  function updateRoute(event) {
    if (event) event.preventDefault();
    const origin = $('origin').value.trim() || 'Tiverton, Devon';
    $('origin').value = origin; $('drive-link').href = C.drivingUrl(origin, 'Plain Ham, Charlcombe Lane, Bath BA1 8DJ');
    save('origin', origin);
    if (event) message('Route ready from ' + origin + '. Open live directions for traffic, distance and journey time.');
  }
  function planDeparture() {
    for (const id of ['arrive', 'journey', 'buffer']) save(id, $(id).value);
    const time = C.departure($('arrive').value, $('journey').value, $('buffer').value);
    $('leave-time').textContent = time || 'enter an arrival time';
  }
  function tickets() {
    if (!guide) return;
    const party = {};
    for (const key of Object.keys(guide.ticket_prices)) { party[key] = C.count($(key).value); $(key).value = party[key]; }
    $('ticket-total').textContent = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(C.ticketTotal(guide.ticket_prices, party));
    save('party', party);
  }
  function checks() {
    const inputs = [...document.querySelectorAll('[data-check]')];
    $('check-progress').textContent = `${inputs.filter(i => i.checked).length} / ${inputs.length}`;
    save('checks', Object.fromEntries(inputs.map(i => [i.dataset.check, i.checked])));
  }
  function railText() { return `Rail search for Larkhall Athletic v Tiverton Town: Saturday 24 October 2026. ${$('rail-origin').value} to Bath Spa, typically via Bristol Temple Meads. Search arrival at Bath Spa by 13:15 and return departures after 18:00. Allow for the final leg to/from Plain Ham, Charlcombe Lane, BA1 8DJ. Targets only; confirm actual trains, fares and engineering works in the official planner.`; }
  function programmeBrief() {
    return `PLAN YOUR NEXT AWAY TRIP\nLarkhall Athletic v Tiverton Town\nSaturday 24 October 2026, 15:00 BST\nCamella Stadium (Plain Ham), Charlcombe Lane, Bath BA1 8DJ.\n\nTICKETS\nAdult £12; concession £8; Bath Spa student £7; children 5–15 £4; under 5s free. Checked 17 October. Final checkout/eligibility applies. Book: ${guide.fixture.tickets}\n\nROAD & PARKING\nPlan from ${$('origin').value}: ${$('drive-link').href}\nOn-site parking is reported by venue guides; the 24 October fee, availability and accessible arrangements need confirmation. Narrow uphill approach.\n\nRAIL\n${railText()}\nFirst Bus 6a/7 toward Larkhall: check current Bath stops and allow for the steep final walk; taxi is an alternative.\n\nFOOD\nVisitors report a bar, burgers, chips, hot dogs, pasties and filled rolls. Current menu, prices and dietary options need checking.\n\nLEAGUE SNAPSHOT\nThrough ${date(football.latest)}: ${ordinal(football.position)} (results-based rank); P${football.p} W${football.w} D${football.d} L${football.l}, ${football.pts} points. Last five oldest first: ${football.lastFive.map(r => r.outcome).join(' ')}. League games only.\n\nSOURCE LINKS\n${guide.sources.map(s => s.label + ': ' + s.url).join('\n')}\n\nRecheck the fixture and travel before leaving.`;
  }
  function downloadCalendar() {
    if (!guide) return;
    const url = URL.createObjectURL(new Blob([C.calendar(guide.fixture)], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'Larkhall-v-Tiverton-24-Oct-2026.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    message('Calendar file downloaded. Kick-off is 15:00 UK time on 24 October.');
  }
  function restore() {
    const state = read();
    for (const id of ['origin', 'arrive', 'journey', 'buffer', 'trip-notes']) if (typeof state[id] === 'string') $(id).value = state[id];
    if (['Tiverton Parkway', 'Exeter St Davids', 'Taunton'].includes(state.railOrigin)) $('rail-origin').value = state.railOrigin;
    $('rail-start').textContent = $('rail-origin').value;
    for (const el of document.querySelectorAll('[data-check]')) el.checked = state.checks?.[el.dataset.check] === true;
    for (const key of ['adult', 'concession', 'student', 'child', 'infant']) if (state.party && key in state.party) $(key).value = C.count(state.party[key]);
    updateRoute(); planDeparture(); checks();
  }
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    $('road-card').hidden = mode === 'rail'; $('rail-card').hidden = mode === 'road'; document.querySelector('.travel-grid').classList.toggle('single-mode', mode !== 'all');
  }));
  $('road-form').addEventListener('submit', updateRoute);
  $('origin').addEventListener('change', () => updateRoute());
  for (const id of ['arrive', 'journey', 'buffer']) $(id).addEventListener('input', planDeparture);
  for (const key of ['adult', 'concession', 'student', 'child', 'infant']) $(key).addEventListener('change', tickets);
  $('rail-origin').addEventListener('change', () => { $('rail-start').textContent = $('rail-origin').value; save('railOrigin', $('rail-origin').value); });
  document.querySelectorAll('[data-check]').forEach(input => input.addEventListener('change', checks));
  $('trip-notes').addEventListener('input', () => save('trip-notes', $('trip-notes').value));
  $('copy-rail').addEventListener('click', () => copy(railText(), 'Rail search details copied. Paste them into your notes, then use the official planner.'));
  $('copy-guide').addEventListener('click', () => { if (guide && football) copy(programmeBrief(), 'Programme brief copied, including dates and source links.'); });
  $('calendar').addEventListener('click', downloadCalendar); $('print').addEventListener('click', () => window.print()); $('refresh').addEventListener('click', refreshFootball);
  restore();
  (async () => {
    try {
      guide = await fetchJson('data/away-trip-larkhall.json?v=20261017-1');
      snapshot = C.summarise(guide.football, guide.opponent, today()); renderFootball(snapshot, 'Saved verified snapshot');
      $('sources-list').innerHTML = guide.sources.map(s => `<div class="source-item"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a><span>${esc(s.status)}</span></div>`).join('');
      if (today() > guide.fixture.date) { $('demo-label').textContent = 'Larkhall · demo archive'; document.querySelector('.upcoming').textContent = 'This demonstration is for the fixture on 24 October 2026. Its tickets and travel research are retained as a dated guide, not advice for a new fixture.'; }
      $('refresh').disabled = false; $('copy-guide').disabled = false; tickets();
      await refreshFootball();
    } catch {
      $('load-error').hidden = false; $('load-error').textContent = 'The football snapshot could not load. The travel information and official ticket links remain available. Reload the page to retry.';
      $('stats').textContent = 'Football figures unavailable.';
    }
  })();
})();

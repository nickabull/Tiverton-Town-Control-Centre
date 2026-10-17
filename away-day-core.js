/* Shared away-day calculations. No booking or live traffic estimates are inferred. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AwayDayCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function summarise(feed, opponent, cutoff) {
    if (!feed || !Array.isArray(feed.results) || !Array.isArray(feed.teams)) throw new Error('Results feed is incomplete.');
    const table = new Map(feed.teams.map(team => [team, { team, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }]));
    if (!table.has(opponent) || table.size < 22) throw new Error('The full division is not present.');
    const seen = new Map(), results = [];
    for (const r of feed.results) {
      const score = /^(\d{1,2})\s*[-–]\s*(\d{1,2})$/.exec(String(r.score || ''));
      if (!score || !/^202[67]-\d{2}-\d{2}$/.test(r.date || '') || r.date < '2026-07-01' || r.date > '2027-06-30' || r.date > cutoff) continue;
      if (!table.has(r.home) || !table.has(r.away) || r.home === r.away) throw new Error('A result has an unrecognised team.');
      const key = r.date + '|' + r.home + '|' + r.away, canonical = Number(score[1]) + '-' + Number(score[2]);
      if (seen.has(key)) {
        if (seen.get(key) !== canonical) throw new Error('Conflicting scores need checking.');
        continue;
      }
      seen.set(key, canonical);
      const hg = Number(score[1]), ag = Number(score[2]);
      for (const [team, gf, ga] of [[r.home, hg, ag], [r.away, ag, hg]]) {
        const row = table.get(team); row.p++; row.gf += gf; row.ga += ga;
        row.w += Number(gf > ga); row.d += Number(gf === ga); row.l += Number(gf < ga); row.pts += gf > ga ? 3 : gf === ga ? 1 : 0;
      }
      results.push({ ...r, score: canonical, hg, ag });
    }
    if (!results.length) throw new Error('No completed league results were found.');
    const ranked = [...table.values()].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.team.localeCompare(b.team));
    const record = ranked.find(r => r.team === opponent), matches = results.filter(r => r.home === opponent || r.away === opponent).sort((a, b) => a.date.localeCompare(b.date) || a.home.localeCompare(b.home));
    if (!matches.length) throw new Error('No completed opponent matches were found.');
    const perspective = r => {
      const home = r.home === opponent, gf = home ? r.hg : r.ag, ga = home ? r.ag : r.hg;
      return { date: r.date, opponent: home ? r.away : r.home, venue: home ? 'H' : 'A', gf, ga, outcome: gf > ga ? 'W' : gf === ga ? 'D' : 'L' };
    };
    const home = matches.filter(r => r.home === opponent).map(perspective);
    const homeRecord = { p: home.length, w: home.filter(r => r.outcome === 'W').length, d: home.filter(r => r.outcome === 'D').length, l: home.filter(r => r.outcome === 'L').length };
    return { ...record, gd: record.gf - record.ga, position: ranked.indexOf(record) + 1, totalTeams: ranked.length, home: homeRecord, lastFive: matches.slice(-5).map(perspective), latest: matches.at(-1).date, divisionLatest: results.map(r => r.date).sort().at(-1), resultCount: results.length, updated: String(feed.updated || '') };
  }
  function count(value) { return Math.min(30, Math.max(0, Math.floor(Number(value) || 0))); }
  function ticketTotal(prices, party) { return Object.keys(prices).reduce((sum, key) => sum + Number(prices[key]) * count(party[key]), 0); }
  function drivingUrl(origin, destination) { const u = new URL('https://www.google.com/maps/dir/'); u.search = new URLSearchParams({ api: '1', origin: origin.trim() || 'Tiverton, Devon', destination, travelmode: 'driving' }); return u.href; }
  function departure(arrival, journey, buffer) {
    if (!/^\d{2}:\d{2}$/.test(arrival)) return null;
    const [h, m] = arrival.split(':').map(Number); if (h > 23 || m > 59) return null;
    const minutes = h * 60 + m - Math.max(0, Number(journey) || 0) - Math.max(0, Number(buffer) || 0);
    if (minutes < 0) return 'Previous day · ' + String(Math.floor((minutes + 1440) / 60)).padStart(2, '0') + ':' + String((minutes + 1440) % 60).padStart(2, '0');
    return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
  }
  function calendar(fixture) {
    const start = new Date(fixture.kickoff_iso), end = new Date(start.getTime() + 120 * 60000);
    const iso = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = str => String(str).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tiverton Town//Away Day Guide//EN', 'BEGIN:VEVENT', 'UID:larkhall-tiverton-20261024@tivvy-programme', 'DTSTAMP:' + iso(new Date()), 'DTSTART:' + iso(start), 'DTEND:' + iso(end), 'SUMMARY:Larkhall Athletic v Tiverton Town', 'LOCATION:' + esc(fixture.address), 'DESCRIPTION:' + esc('Kick-off 15:00 UK time. Recheck fixture and travel before leaving. ' + fixture.tickets), 'URL:' + fixture.tickets, 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
  }
  return { summarise, ticketTotal, count, drivingUrl, departure, calendar };
});

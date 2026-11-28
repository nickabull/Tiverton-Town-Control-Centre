const origin = 'https://api.ticketsource.io';
const show = 'The Great British Bake Off Musical';
const shop = 'https://www.ticketsource.com/willow-tree-dance-theatre-arts';
const tags = { Facebook: 'BakeOffFacebook', Instagram: 'BakeOffInstagram' };
const postcode = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function reply(body, status = 200, type = 'text/plain') {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': type + '; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src https://willowtreedanceandtheatrearts.com; frame-ancestors 'none'; base-uri 'none'",
    }
  });
}

function api(key) {
  let requestsRemaining = 45;
  return async function records(path) {
    const results = [];
    for (let page = 1; ; page += 1) {
      if (requestsRemaining === 0) throw new Error('The pilot request limit was reached.');
      requestsRemaining -= 1;
      const url = new URL(path, origin);
      url.search = new URLSearchParams({ page, per_page: 100 }).toString();
      const response = await fetch(url, {
        redirect: 'error',
        headers: { Authorization: 'Bearer ' + key, Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('TicketSource returned HTTP ' + response.status + '.');
      const payload = await response.json();
      if (!Array.isArray(payload.data)) throw new Error('TicketSource returned an unexpected response.');
      results.push(...payload.data);
      if (!payload.links?.next) return results;
    }
  };
}

async function snapshot(records, now) {
  const events = (await records('/events')).filter(event =>
    event.attributes?.name?.trim().toLowerCase() === show.toLowerCase());
  if (events.length !== 1) throw new Error('Could not identify one Bake Off event in TicketSource.');
  const dates = await records('/events/' + encodeURIComponent(events[0].id) + '/dates');
  if (!dates.length) throw new Error('No performance dates were returned.');
  const rows = [];
  const matches = { Facebook: 0, Instagram: 0 };
  dates.sort((a, b) => Date.parse(a.attributes.start) - Date.parse(b.attributes.start));
  for (const date of dates) {
    const start = Date.parse(date.attributes.start);
    if (!Number.isFinite(start)) throw new Error('TicketSource returned an invalid performance date.');
    const recordsForDate = await records('/dates/' + encodeURIComponent(date.id) + '/bookings');
    const bookings = new Map(recordsForDate.map(booking => [booking.id, booking.attributes]));
    let recent = 0;
    for (const booking of bookings.values()) {
      const created = Date.parse(booking.created_at);
      if (created > now - 86400000 && created <= now) recent += 1;
      if (!date.attributes.cancelled) {
        for (const [channel, label] of Object.entries(tags)) {
          if (booking.user_booked_by === label) matches[channel] += 1;
        }
      }
    }
    rows.push({ start, records: bookings.size, recent, cancelled: Boolean(date.attributes.cancelled) });
  }
  return { rows, matches };
}

const count = value => value.toLocaleString('en-GB');

function dashboard({ rows, matches }, when) {
  const active = rows.filter(row => !row.cancelled);
  const largest = Math.max(1, ...active.map(row => row.records));
  const total = active.reduce((previous, row) => previous + row.records, 0);
  const latest = active.reduce((previous, row) => previous + row.recent, 0);
  const performances = rows.map(row => {
    const width = row.cancelled ? 0 : Math.round(row.records * 100 / largest);
    const label = postcode.format(row.start) + (row.cancelled ? ' · Cancelled' : '');
    return '<tr><th scope="row">' + label + '</th><td><div class="bar" aria-hidden="true"><i style="width:' + width + '%"></i></div></td><td class="number">' + count(row.records) + '</td><td class="number">' + count(row.recent) + '</td></tr>';
  }).join('');
  const channels = Object.entries(tags).map(([channel, label]) =>
    '<li><a href="' + shop + '?ref=' + label + '">' + channel + ' booking link</a><span>' +
    (matches[channel] ? count(matches[channel]) + ' API label matches' : 'Unconfirmed') + '</span></li>').join('');
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Willow Tree Box Office</title>
<style>:root{--ink:#262037;--muted:#61566c;--paper:#f7f3ed;--line:#dfd5de;--wine:#70274d;--plum:#331c3a;--white:#fffaf8;--peach:#ffd5ab}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.45 system-ui,sans-serif}a{color:#7b2351;text-underline-offset:4px}a:focus-visible{outline:3px solid #a64d09;outline-offset:3px}
main{width:min(1120px,calc(100% - 32px));margin:auto;padding-bottom:32px}header{padding:17px 0;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:.88rem}header span,small{color:var(--muted)}small{display:block;font-size:.82rem}
.hero{display:grid;grid-template-columns:minmax(0,1fr) 116px;align-items:center;gap:24px;background:linear-gradient(122deg,#3b1c42,#6f2b57);color:white;border-radius:22px;padding:clamp(22px,5vw,50px)}.hero img{width:100%;height:auto;border-radius:8px}.series{text-transform:uppercase;font-weight:750;letter-spacing:.11em;color:var(--peach);font-size:.75rem}h1,h2{font-family:Georgia,serif}h1{font-size:clamp(2rem,5vw,4.15rem);line-height:.99;letter-spacing:-.04em;margin:.25em 0}.hero p{color:#f7deef;margin:0}
.totals{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:15px 0}.stat,.panel{background:var(--white);border:1px solid var(--line);border-radius:15px;padding:16px}.stat strong{font-size:clamp(1.66rem,4vw,2.6rem);display:block;line-height:1.05;color:var(--wine);font-variant-numeric:tabular-nums}
.panels{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:14px}.panel h2{font-size:1.55rem;margin:0 0 5px}.panel p{color:var(--muted);font-size:.89rem;margin:0 0 12px}.panel p.note{margin-top:13px;margin-bottom:0}
table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid var(--line);padding:9px 5px;text-align:left}thead th{font-size:.77rem;color:var(--muted)}tbody th{font-size:.94rem;white-space:nowrap}.number{text-align:right;font-variant-numeric:tabular-nums}.bar{background:#eddee9;border-radius:8px;height:9px;min-width:22px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#a63f72,#762651);border-radius:8px}
.campaigns{padding:0;margin:0;list-style:none}.campaigns li{border-bottom:1px solid var(--line);padding:11px 0;display:flex;justify-content:space-between;gap:6px}.campaigns a{font-weight:750}.campaign-number{text-align:right}footer{font-size:.85rem;color:var(--muted);padding-top:14px}footer a{display:inline-block;margin-right:12px}
@media(max-width:750px){.panels{grid-template-columns:1fr}}@media(max-width:490px){.hero{grid-template-columns:minmax(0,1fr) 70px;gap:12px}header{align-items:flex-start}.stat{padding:12px}}
.campaigns span{color:var(--muted);font-size:.87rem}.comparison{overflow-x:auto}.comparison table{min-width:310px}
</style></head><body><main>
<header><strong>Willow Tree Dance &amp; Theatre Arts</strong><span>Private box office</span></header>
<div class="hero"><div><div class="series">Willow Tree Box Office</div><h1>${show}</h1>
<p>TicketSource snapshot · ${postcode.format(when)} UK time</p></div>
<img src="https://willowtreedanceandtheatrearts.com/wp-content/uploads/2026/11/Great-British-Bake-Off-Details-For-Programme.png" width="2481" height="3508" alt="Willow Tree’s Bake Off production poster"></div>
<div class="totals">
<div class="stat"><strong>${count(total)}</strong><small>Booking records</small></div>
<div class="stat"><strong>${count(latest)}</strong><small>New in the last 24 hours</small></div>
<div class="stat"><strong>${active.length}</strong><small>Performances</small></div>
</div>
<div class="panels"><section class="panel"><h2>Performance comparison</h2>
<p>Booking records by show time. Bars are relative to the busiest performance.</p>
<div class="comparison"><table><thead><tr><th scope="col">Performance</th><th scope="col">Comparison</th>
<th scope="col" class="number">Bookings</th><th scope="col" class="number">24h</th></tr></thead>
<tbody>${performances}</tbody></table></div>
<p class="note">A booking may contain several tickets. Cancelled performances are excluded from headline totals.</p></section>
<section class="panel"><h2>Campaign links</h2>
<p>Check these API label matches against a known tagged booking in the Sales Report.</p>
<ul class="campaigns">${channels}</ul>
<p class="note">Reach and link clicks come from social reporting.</p></section></div>
<footer><a href="/">Refresh snapshot</a><a href="${shop}">TicketSource shop</a></footer></main></body></html>`;
}

export default {
  async fetch(request, env, ctx) {
    if (!ctx?.access || !(await ctx.access.getIdentity())?.email) {
      return reply('Sign-in through Cloudflare Access is required.', 403);
    }
    if (new URL(request.url).pathname !== '/') return reply('Not found.', 404);
    if (request.method !== 'GET') return reply('Method not allowed.', 405);
    if (!env.TICKETSOURCE_API_KEY) return reply('Add TICKETSOURCE_API_KEY as a Worker secret.', 503);
    const now = Date.now();
    try {
      const result = await snapshot(api(env.TICKETSOURCE_API_KEY), now);
      return reply(dashboard(result, now), 200, 'text/html');
    } catch (error) {
      const safeMessages = new Set([
        'The pilot request limit was reached.',
        'TicketSource returned an unexpected response.',
        'Could not identify one Bake Off event in TicketSource.',
        'No performance dates were returned.',
        'TicketSource returned an invalid performance date.'
      ]);
      const safe = safeMessages.has(error.message) || /^TicketSource returned HTTP \d{3}\.$/.test(error.message);
      return reply(safe ? error.message : 'Could not load the TicketSource snapshot.', 502);
    }
  },
};

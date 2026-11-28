const origin = 'https://api.ticketsource.io';
const show = 'The Great British Bake Off Musical';
const shop = 'https://www.ticketsource.com/willow-tree-dance-theatre-arts';
const tags = { Facebook: 'BakeOffFacebook', Instagram: 'BakeOffInstagram' };
const batches = 16;
const ukDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' });
const dayLabel = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric' });
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
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; img-src https://willowtreedanceandtheatrearts.com; frame-ancestors 'none'; base-uri 'none'",
    }
  });
}

class SnapshotError extends Error {}

function api(key) {
  let requestsRemaining = 45;
  return async function records(path) {
    const endpoint = path === '/events' ? 'event list' : path.endsWith('/dates') ? 'performance list' : path.endsWith('/seats') ? 'ticket list' : 'booking list';
    const results = [];
    for (let page = 1; ; page += 1) {
      if (requestsRemaining === 0) throw new SnapshotError('The pilot request limit was reached.');
      requestsRemaining -= 1;
      const url = new URL(path, origin);
      url.search = new URLSearchParams({ page, per_page: 100 }).toString();
      let response;
      try {
        response = await fetch(url, {
          redirect: 'manual',
          headers: { Authorization: 'Bearer ' + key, Accept: 'application/json' },
        });
      } catch {
        throw new SnapshotError('TicketSource connection failed while loading the ' + endpoint + '.');
      }
      if (!response.ok) throw new SnapshotError('TicketSource returned HTTP ' + response.status + ' for the ' + endpoint + '.');
      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new SnapshotError('TicketSource returned a non-JSON response for the ' + endpoint + '.');
      }
      if (!Array.isArray(payload?.data)) throw new SnapshotError('TicketSource returned an unexpected response for the ' + endpoint + '.');
      results.push(...payload.data);
      if (!payload.links?.next) return results;
    }
  };
}

async function showDates(records) {
  const events = (await records('/events')).filter(event =>
    event.attributes?.name?.trim().toLowerCase() === show.toLowerCase());
  if (events.length !== 1) throw new SnapshotError('Could not identify one Bake Off event in TicketSource.');
  const dates = await records('/events/' + encodeURIComponent(events[0].id) + '/dates');
  if (!dates.length) throw new SnapshotError('No performance dates were returned.');
  return dates;
}

const bookingsFor = async (records, date) => new Map(
  (await records('/dates/' + encodeURIComponent(date.id) + '/bookings'))
    .map(booking => [booking.id, booking.attributes]),
);

function calendarWeek(now) {
  const last = Date.parse(ukDay.format(now) + 'T00:00:00Z');
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(last - (6 - index) * 86400000);
    return { key: date.toISOString().slice(0, 10), label: dayLabel.format(date) };
  });
}

async function snapshot(records, now) {
  const dates = await showDates(records);
  const week = calendarWeek(now);
  const indexByDay = new Map(week.map((day, index) => [day.key, index]));
  const earliest = Date.parse(week[0].key + 'T00:00:00Z') - 3600000;
  const rows = [];
  const matches = { Facebook: 0, Instagram: 0 };
  dates.sort((a, b) => Date.parse(a.attributes.start) - Date.parse(b.attributes.start));
  for (const date of dates) {
    const start = Date.parse(date.attributes.start);
    if (!Number.isFinite(start)) throw new SnapshotError('TicketSource returned an invalid performance date.');
    const bookings = await bookingsFor(records, date);
    const pace = Array(7).fill(0);
    let recent = 0;
    for (const booking of bookings.values()) {
      const created = Date.parse(booking.created_at);
      if (created > now - 86400000 && created <= now) recent += 1;
      if (created >= earliest && created <= now) {
        const index = indexByDay.get(ukDay.format(created));
        if (index !== undefined) pace[index] += 1;
      }
      if (!date.attributes.cancelled) {
        for (const [channel, label] of Object.entries(tags)) {
          if (booking.user_booked_by === label) matches[channel] += 1;
        }
      }
    }
    rows.push({ start, records: bookings.size, recent, pace, cancelled: Boolean(date.attributes.cancelled) });
  }
  return { rows, matches, week };
}

const count = value => value.toLocaleString('en-GB');

function dashboard({ rows, matches, week }, when) {
  const active = rows.filter(row => !row.cancelled);
  const largest = Math.max(1, ...active.flatMap(row => row.pace));
  const total = active.reduce((previous, row) => previous + row.records, 0);
  const latest = active.reduce((previous, row) => previous + row.recent, 0);
  const performances = rows.map(row => {
    const label = postcode.format(row.start) + (row.cancelled ? ' · Cancelled' : '');
    const bars = row.pace.map((value, index) =>
      '<i style="--height:' + Math.max(8, Math.round(value * 100 / largest)) +
      '%" class="' + (value ? 'has-bookings' : '') + '" title="' + week[index].label + ': ' + value +
      ' bookings"></i>').join('');
    const paceLabel = week.map((day, index) => day.label + ': ' + row.pace[index]).join(', ');
    const tickets = row.cancelled ? '—' : '<span data-ticket-start="' + row.start + '">—</span>';
    return '<tr><th scope="row">' + label + '</th><td><div class="pace" aria-label="' + paceLabel +
      '" role="img">' + bars + '</div><small>' + count(row.pace.reduce((a, b) => a + b, 0)) +
      ' in 7 days</small></td><td class="number">' + count(row.records) +
      '</td><td class="number">' + count(row.recent) + '</td><td class="number">' + tickets + '</td></tr>';
  }).join('');
  const channels = Object.entries(tags).map(([channel, label]) =>
    '<li><a href="' + shop + '?ref=' + label + '">' + channel + ' booking link</a><span>' +
    (matches[channel] ? count(matches[channel]) + ' API label matches' : 'Unconfirmed') + '</span></li>').join('');
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Willow Tree Box Office</title>
<script src="/dashboard.js" defer></script>
<style>:root{--ink:#262037;--muted:#61566c;--paper:#f7f3ed;--line:#dfd5de;--wine:#70274d;--plum:#331c3a;--white:#fffaf8;--peach:#ffd5ab}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.45 system-ui,sans-serif}a{color:#7b2351;text-underline-offset:4px}a:focus-visible{outline:3px solid #a64d09;outline-offset:3px}
main{width:min(1120px,calc(100% - 32px));margin:auto;padding-bottom:32px}header{padding:17px 0;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:.88rem}header span,small{color:var(--muted)}small{display:block;font-size:.82rem}
.hero{display:grid;grid-template-columns:minmax(0,1fr) 116px;align-items:center;gap:24px;background:linear-gradient(122deg,#3b1c42,#6f2b57);color:white;border-radius:22px;padding:clamp(22px,5vw,50px)}.hero img{width:100%;height:auto;border-radius:8px}.series{text-transform:uppercase;font-weight:750;letter-spacing:.11em;color:var(--peach);font-size:.75rem}h1,h2{font-family:Georgia,serif}h1{font-size:clamp(2rem,5vw,4.15rem);line-height:.99;letter-spacing:-.04em;margin:.25em 0}.hero p{color:#f7deef;margin:0}
.totals{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:15px 0}.stat,.panel{background:var(--white);border:1px solid var(--line);border-radius:15px;padding:16px}.stat strong{font-size:clamp(1.66rem,4vw,2.6rem);display:block;line-height:1.05;color:var(--wine);font-variant-numeric:tabular-nums}
.panels{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:14px}.panel h2{font-size:1.55rem;margin:0 0 5px}.panel p{color:var(--muted);font-size:.89rem;margin:0 0 12px}.panel p.note{margin-top:13px;margin-bottom:0}
table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid var(--line);padding:9px 5px;text-align:left}thead th{font-size:.77rem;color:var(--muted)}tbody th{font-size:.94rem;white-space:nowrap}.number{text-align:right;font-variant-numeric:tabular-nums}.bar{background:#eddee9;border-radius:8px;height:9px;min-width:22px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#a63f72,#762651);border-radius:8px}
.campaigns{padding:0;margin:0;list-style:none}.campaigns li{border-bottom:1px solid var(--line);padding:11px 0;display:flex;justify-content:space-between;gap:6px}.campaigns a{font-weight:750}.campaign-number{text-align:right}footer{font-size:.85rem;color:var(--muted);padding-top:14px}footer a{display:inline-block;margin-right:12px}
@media(max-width:750px){.panels{grid-template-columns:1fr}}@media(max-width:490px){.hero{grid-template-columns:minmax(0,1fr) 70px;gap:12px}header{align-items:flex-start}.stat{padding:12px}}
.campaigns span{color:var(--muted);font-size:.87rem}.comparison{overflow-x:auto}.comparison table{min-width:475px}
.pace{display:flex;gap:3px;height:23px;align-items:flex-end;min-width:62px}.pace i{flex:1;height:var(--height);background:#e9dde7;border-radius:2px}.pace i.has-bookings{background:#963666}
button{font:inherit;font-weight:700;color:#fff;background:var(--wine);border:0;border-radius:8px;padding:8px 12px;cursor:pointer}button:disabled{opacity:.72;cursor:wait}
.ticket-controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0}.ticket-controls p{margin:0}
.ticket-total:empty{display:none}
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
<p>Seven UK calendar days of new bookings, oldest to newest. Today is still in progress.</p>
<div class="ticket-controls"><button type="button" id="count-tickets">Count booked tickets</button>
<p id="ticket-status" role="status">Counts active places, including comps where issued.</p></div>
<div class="comparison"><table><thead><tr><th scope="col">Performance</th><th scope="col">7-day pace</th>
<th scope="col" class="number">Bookings</th><th scope="col" class="number">24h</th><th scope="col" class="number">Tickets</th></tr></thead>
<tbody>${performances}</tbody></table></div>
<p class="note">Ticket counts exclude cancelled places. Check these figures against TicketSource’s Sales Report before using them as paid sales totals.</p></section>
<section class="panel"><h2>Campaign links</h2>
<p>Check these API label matches against a known tagged booking in the Sales Report.</p>
<ul class="campaigns">${channels}</ul>
<p class="note">Reach and link clicks come from social reporting.</p></section></div>
<footer><a href="/">Refresh snapshot</a><a href="${shop}">TicketSource shop</a></footer></main></body></html>`;
}

async function ticketBatch(records, url) {
  const start = Number(url.searchParams.get('start'));
  const offset = Number(url.searchParams.get('offset'));
  if (!start || !Number.isInteger(offset) || offset < 0 || offset > 10000) {
    return reply('Invalid performance or position.', 400);
  }
  const dates = await showDates(records);
  const date = dates.find(item => !item.attributes.cancelled && Date.parse(item.attributes.start) === start);
  if (!date) return reply('Performance unavailable.', 404);
  const ids = [...(await bookingsFor(records, date)).keys()].sort();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(ids)));
  const revision = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  if (offset && url.searchParams.get('revision') !== revision) {
    return reply('Bookings changed during the count. Start the count again for this performance.', 409);
  }
  let total = 0;
  const batch = ids.slice(offset, offset + batches);
  // Small groups bound concurrent requests and the Worker subrequest count.
  for (let index = 0; index < batch.length; index += 4) {
    const places = await Promise.all(batch.slice(index, index + 4).map(id =>
      records('/bookings/' + encodeURIComponent(id) + '/seats')));
    for (const seats of places) {
      const active = new Set();
      for (const seat of seats) {
        const state = seat.attributes;
        if (!seat.id || typeof state?.is_booked !== 'boolean' || typeof state?.is_cancelled !== 'boolean') {
          throw new SnapshotError('TicketSource returned a ticket without booking or cancellation status.');
        }
        if (state.is_booked && !state.is_cancelled) active.add(seat.id);
      }
      total += active.size;
    }
  }
  const next = offset + batch.length;
  return reply(JSON.stringify({ total, revision, next: next < ids.length ? next : null }), 200, 'application/json');
}

function installTicketButton() {
  const button = document.getElementById('count-tickets');
  const status = document.getElementById('ticket-status');
  const cells = [...document.querySelectorAll('[data-ticket-start]')];
  let earliestRequest = 0;
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      for (const [index, cell] of cells.entries()) {
        if (cell.dataset.counted) continue;
        status.textContent = 'Counting performance ' + (index + 1) + ' of ' + cells.length + '…';
        let offset = 0;
        let revision = '';
        let total = 0;
        do {
          const pause = earliestRequest - Date.now();
          if (pause > 0) await new Promise(resolve => setTimeout(resolve, pause));
          earliestRequest = Date.now() + 6200;
          const query = new URLSearchParams({ start: cell.dataset.ticketStart, offset, revision });
          const response = await fetch('/api/performance-tickets?' + query);
          if (!response.ok) throw new Error((await response.text()).slice(0, 170));
          if (!response.headers.get('content-type')?.includes('application/json')) {
            throw new Error('Your session may have expired. Reload and sign in again.');
          }
          const batch = await response.json();
          total += batch.total;
          offset = batch.next;
          revision = batch.revision;
        } while (offset !== null);
        cell.textContent = total.toLocaleString('en-GB');
        cell.dataset.counted = 'true';
      }
      status.textContent = 'Active booked tickets counted across ' + cells.length + ' performances.';
      button.textContent = 'Tickets counted';
    } catch (error) {
      status.textContent = error.message + ' Completed performances are kept.';
      button.disabled = false;
      button.textContent = 'Continue ticket count';
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    if (!ctx?.access || !(await ctx.access.getIdentity())?.email) {
      return reply('Sign-in through Cloudflare Access is required.', 403);
    }
    const url = new URL(request.url);
    if (request.method !== 'GET') return reply('Method not allowed.', 405);
    if (url.pathname === '/dashboard.js') {
      return reply('(' + installTicketButton.toString() + ')();', 200, 'text/javascript');
    }
    if (url.pathname !== '/' && url.pathname !== '/api/performance-tickets') return reply('Not found.', 404);
    if (!env.TICKETSOURCE_API_KEY?.trim()) return reply('Add TICKETSOURCE_API_KEY as a Worker secret.', 503);
    const now = Date.now();
    try {
      const records = api(env.TICKETSOURCE_API_KEY.trim());
      if (url.pathname === '/api/performance-tickets') return await ticketBatch(records, url);
      return reply(dashboard(await snapshot(records, now), now), 200, 'text/html');
    } catch (error) {
      return reply(error instanceof SnapshotError ? error.message : 'Could not load the TicketSource snapshot.', 502);
    }
  },
};

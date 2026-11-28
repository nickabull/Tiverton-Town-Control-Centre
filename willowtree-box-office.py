#!/usr/bin/env python3
"""Open a private Willow Tree box-office snapshot from TicketSource or sample data."""
import argparse
import getpass
import json
import os
import sys
import tempfile
import webbrowser
from datetime import datetime, timedelta, timezone
from html import escape
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener
from zoneinfo import ZoneInfo

API = "https://api.ticketsource.io"
SHOW = "The Great British Bake Off Musical"
LONDON = ZoneInfo("Europe/London")
CAMPAIGNS = {"Facebook": "BakeOffFacebook", "Instagram": "BakeOffInstagram"}
SHOP = "https://www.ticketsource.com/willow-tree-dance-theatre-arts"
POSTER = "https://willowtreedanceandtheatrearts.com/wp-content/uploads/2026/11/Great-British-Bake-Off-Details-For-Programme.png"


class NoRedirect(HTTPRedirectHandler):
    # Keep the authentication header on the documented API origin.
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def fetch_records(path, key):
    opener = build_opener(NoRedirect())
    for page in range(1, 101):
        query = urlencode({"page": page, "per_page": 100})
        request = Request(f"{API}{path}?{query}", headers={
            "Authorization": f"Bearer {key}", "Accept": "application/json"
        })
        with opener.open(request, timeout=20) as response:
            payload = json.load(response)
        yield from payload["data"]
        if not payload.get("links", {}).get("next"):
            return
    raise ValueError("The API reported more pages than this pilot can read.")


def timestamp(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def collect(event_name, records, checked_at):
    events = [e for e in records("/events")
              if e["attributes"]["name"].strip().casefold() == event_name.casefold()]
    if len(events) != 1:
        raise ValueError(f"Expected one event called {event_name!r}; TicketSource returned {len(events)} matches.")
    event_id = quote(events[0]["id"], safe="")
    dates = sorted(records(f"/events/{event_id}/dates"),
                   key=lambda item: timestamp(item["attributes"]["start"]))
    if not dates:
        raise ValueError("TicketSource returned no performance dates for this event.")
    counts = dict.fromkeys(CAMPAIGNS, 0)
    channel_by_label = {value: channel for channel, value in CAMPAIGNS.items()}
    performances = []
    for date in dates:
        start = timestamp(date["attributes"]["start"])
        date_id = quote(date["id"], safe="")
        bookings = {}
        for booking in records(f"/dates/{date_id}/bookings"):
            bookings[booking["id"]] = booking["attributes"]
        recent = 0
        for booking in bookings.values():
            created = booking.get("created_at")
            if created and checked_at - timedelta(hours=24) <= timestamp(created) <= checked_at:
                recent += 1
            actor = booking.get("user_booked_by")
            if isinstance(actor, str) and actor in channel_by_label:
                counts[channel_by_label[actor]] += 1
        performances.append((start, len(bookings), recent, bool(date["attributes"].get("cancelled"))))
    return performances, counts


def demo_data():
    rows = [(9, 19, 30, 47, 3), (10, 19, 30, 81, 9), (11, 19, 30, 58, 6),
            (12, 14, 30, 34, 2), (12, 19, 30, 73, 5), (13, 13, 30, 39, 4)]
    return [(datetime(2026, 12, day, hour, minute, tzinfo=LONDON), total, recent, False)
            for day, hour, minute, total, recent in rows], {"Facebook": 9, "Instagram": 5}


def render(event, rows, counts, checked, demo):
    maximum = max([total for _, total, _, cancelled in rows if not cancelled] or [0])
    scale = max(maximum, 1)
    live_rows = [row for row in rows if not row[3]]
    total = sum(row[1] for row in live_rows)
    recent = sum(row[2] for row in live_rows)
    check = "Fictional figures for layout review" if demo else (
        "Read-only TicketSource snapshot · " + checked.astimezone(LONDON).strftime("%d %b %Y, %H:%M %Z"))
    rows_html = []
    for start, booked, today, cancelled in rows:
        local = start.astimezone(LONDON)
        state = "Cancelled" if cancelled else ("Matinee" if local.hour < 17 else "Evening")
        fill = 0 if cancelled else round(booked / scale * 100)
        rows_html.append(f"""
          <tr><th scope="row"><span>{local:%a %d %b}</span><small>{local:%H:%M} · {state}</small></th>
          <td><div class="bar" aria-hidden="true"><i style="width:{fill}%"></i></div></td>
          <td class="number">{booked:,}</td><td class="number">{today:,}</td></tr>""")
    social = []
    examples = {"Facebook": (2480, 112), "Instagram": (1710, 86)}
    for channel, label in CAMPAIGNS.items():
        reach, clicks = examples[channel]
        count = counts[channel]
        match = f"{count:,}" if demo or count else "Unconfirmed"
        source = f"{reach:,} reached · {clicks:,} link clicks" if demo else "Reach and clicks awaiting social data"
        social.append(f"""<li><div><a href="{SHOP}?ref={label}">{channel}</a><small>{source}</small></div>
        <div class="campaign-number"><strong>{match}</strong><small>{'Example bookings' if demo else 'API label matches'}</small></div></li>""")
    poster = f'<img src="{POSTER}" width="2481" height="3508" alt="Willow Tree’s Bake Off production poster">' if event == SHOW else ""
    splash = "Design preview · example data" if demo else "Private report · stored on this computer"
    guide = ("Run the local tool with Willow Tree’s TicketSource key to replace example figures with booking records."
             if demo else "Run the local tool again to refresh this snapshot. Keep the exported report private.")
    social_note = ("These sample figures illustrate the reports Lucy could compare."
                   if demo else "A referral label needs a known booking and a Sales Report comparison before it can be used for attribution.")
    return f"""<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>{escape(event)} · Willow Tree Box Office</title>
<style>
:root{{--ink:#262037;--muted:#61566c;--paper:#f7f3ed;--line:#dfd5de;--wine:#70274d;--plum:#331c3a;--white:#fffaf8;--peach:#ffd5ab}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);color:var(--ink);font:16px/1.45 system-ui,sans-serif}}a{{color:#7b2351;text-underline-offset:4px}}a:focus-visible{{outline:3px solid #a64d09;outline-offset:3px}}
main{{width:min(1120px,calc(100% - 32px));margin:auto;padding-bottom:32px}}header{{padding:17px 0;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:.88rem}}header span,small{{color:var(--muted)}}small{{display:block;font-size:.82rem}}
.hero{{display:grid;grid-template-columns:minmax(0,1fr) 116px;align-items:center;gap:24px;background:linear-gradient(122deg,#3b1c42,#6f2b57);color:white;border-radius:22px;padding:clamp(22px,5vw,50px)}}.hero img{{width:100%;height:auto;border-radius:8px}}.series{{text-transform:uppercase;font-weight:750;letter-spacing:.11em;color:var(--peach);font-size:.75rem}}h1,h2{{font-family:Georgia,serif}}h1{{font-size:clamp(2rem,5vw,4.15rem);line-height:.99;letter-spacing:-.04em;margin:.25em 0}}.hero p{{color:#f7deef;margin:0}}
.totals{{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:15px 0}}.stat,.panel{{background:var(--white);border:1px solid var(--line);border-radius:15px;padding:16px}}.stat strong{{font-size:clamp(1.66rem,4vw,2.6rem);display:block;line-height:1.05;color:var(--wine);font-variant-numeric:tabular-nums}}
.panels{{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:14px}}.panel h2{{font-size:1.55rem;margin:0 0 5px}}.panel p{{color:var(--muted);font-size:.89rem;margin:0 0 12px}}.panel p.note{{margin-top:13px;margin-bottom:0}}
table{{width:100%;border-collapse:collapse}}th,td{{border-bottom:1px solid var(--line);padding:9px 5px;text-align:left}}thead th{{font-size:.77rem;color:var(--muted)}}tbody th{{font-size:.94rem;white-space:nowrap}}.number{{text-align:right;font-variant-numeric:tabular-nums}}.bar{{background:#eddee9;border-radius:8px;height:9px;min-width:22px;overflow:hidden}}.bar i{{display:block;height:100%;background:linear-gradient(90deg,#a63f72,#762651);border-radius:8px}}
.campaigns{{padding:0;margin:0;list-style:none}}.campaigns li{{border-bottom:1px solid var(--line);padding:11px 0;display:flex;justify-content:space-between;gap:6px}}.campaigns a{{font-weight:750}}.campaign-number{{text-align:right}}footer{{font-size:.85rem;color:var(--muted);padding-top:14px}}footer a{{display:inline-block;margin-right:12px}}
@media(max-width:750px){{.panels{{grid-template-columns:1fr}}}}@media(max-width:490px){{.hero{{grid-template-columns:minmax(0,1fr) 70px;gap:12px}}header{{align-items:flex-start}}.stat{{padding:12px}}}}
</style></head>
<body><main><header><strong>Willow Tree Dance &amp; Theatre Arts</strong><span>{splash}</span></header>
<div class="hero"><div><div class="series">Willow Tree Box Office</div><h1>{escape(event)}</h1><p>{check}</p></div>{poster}</div>
<div class="totals">
<div class="stat"><strong>{total:,}</strong><small>Booking records</small></div>
<div class="stat"><strong>{recent:,}</strong><small>New in the last 24 hours</small></div>
<div class="stat"><strong>{len(live_rows)}</strong><small>Performances</small></div>
</div>
<div class="panels"><section class="panel"><h2>Performance comparison</h2>
<p>Booking records by show time. Bars are relative to the busiest performance.</p>
<table><thead><tr><th scope="col">Performance</th><th scope="col">Comparison</th>
<th scope="col" class="number">Bookings</th><th scope="col" class="number">24h</th></tr></thead>
<tbody>{''.join(rows_html)}</tbody></table>
<p class="note">One booking may cover several tickets. Cancelled performances are excluded from the headline totals.</p>
</section><section class="panel"><h2>Campaign links</h2><p>{social_note}</p>
<ul class="campaigns">{''.join(social)}</ul>
<p class="note">Use a tagged link for each post to test which promotion led to a booking.</p>
</section></div>
<footer><p>{guide}</p><a href="{SHOP}">TicketSource shop</a><a href="https://willowtreedanceandtheatrearts.com/shows/">Willow Tree Shows</a></footer>
</main></body></html>
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--event", default=SHOW)
    parser.add_argument("--demo", action="store_true", help="Use fictional figures without contacting TicketSource")
    parser.add_argument("--no-open", action="store_true", help="Write the report without opening the browser")
    args = parser.parse_args()
    checked = datetime.now(timezone.utc)
    try:
        if args.demo:
            rows, counts = demo_data()
        else:
            if not sys.stdin.isatty():
                raise ValueError("Run this command in Terminal so the API key can be entered privately.")
            key = getpass.getpass("TicketSource API key (entry hidden): ").strip()
            if not key:
                raise ValueError("No API key entered.")
            rows, counts = collect(args.event.strip(), lambda path: fetch_records(path, key), checked)
    except HTTPError as error:
        print(f"TicketSource returned HTTP {error.code}. No report was written.", file=sys.stderr)
        return 1
    except (URLError, OSError, KeyError, TypeError, ValueError) as error:
        print(f"Could not prepare the report: {error}", file=sys.stderr)
        return 1
    # The default temporary-file mode permits access to the current user only.
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", prefix="willow-tree-box-office-",
                                     suffix=".html", dir=Path.home(), delete=False) as report:
        report.write(render(args.event.strip(), rows, counts, checked, args.demo))
    print(f"Report saved to {report.name}")
    if not args.no_open:
        webbrowser.open(Path(report.name).as_uri())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

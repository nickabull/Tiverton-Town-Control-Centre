#!/usr/bin/env python3
"""Generate dated, self-contained Tivvy As It Happened match replays.

Verified Southern League match incidents are official. A manually transcribed
Facebook post is separately attributed. Never infer missing X content or claim
the Cloudflare live replay is captured here.
"""
import html
import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

SOURCE = Path("data")
OUTPUT = Path("match-replays")
TIVVY = "Tiverton Town"
LONDON = ZoneInfo("Europe/London")
LEGACY_KICKOFFS = {"2026-11-14": "15:00", "2026-11-21": "15:00", "2026-11-23": "19:45"}


def esc(value):
    return html.escape(str(value if value is not None else ""), quote=True)


def minutes(event):
    value = event.get("minute")
    try:
        return int(value)
    except (TypeError, ValueError):
        return -1


def make_timeline(data, manual):
    items = []
    match_date = data.get("matchDate")
    kickoff = data.get("kickoff") or LEGACY_KICKOFFS.get(match_date)
    try:
        kick_at = datetime.fromisoformat(f"{match_date}T{kickoff}").replace(tzinfo=LONDON)
    except ValueError:
        kick_at = None
    for typ in ("goals", "yellowCards", "redCards", "substitutions"):
        for event in (data.get("incidents") or {}).get(typ, []):
            minute = minutes(event)
            if typ == "goals":
                kind = "GOAL"
                msg = (event.get("player") or "Scorer unknown")
                if event.get("eventType") == "GOAL_FROM_PENALTY":
                    msg += " (penalty)"
                score = event.get("score") or {}
                if isinstance(score.get("home"), int) and isinstance(score.get("away"), int):
                    msg += " · " + str(score["home"]) + "–" + str(score["away"])
            elif typ == "yellowCards":
                kind = "YELLOW CARD"
                msg = event.get("player") or "Player unknown"
            elif typ == "redCards":
                kind = "RED CARD"
                msg = event.get("player") or "Player unknown"
            else:
                kind = "SUBSTITUTION"
                msg = (event.get("player") or "Player on") + " ▲  /  " + (event.get("off") or "Player off") + " ▼"
            team = ""
            # The names below are separate for display, but never assign an
            # unknown source team ID to either side by guesswork.
            items.append({
                "minute": minute, "sort": minute,
                "source": "SOUTHERN LEAGUE · OFFICIAL INCIDENT",
                "kind": kind, "message": msg, "teamId": event.get("teamId"), "team": team,
                "time": "",
            })
    for post in manual:
        text = str(post.get("text") or "").strip()
        time = str(post.get("createdAt") or "")
        try:
            posted_at = datetime.fromisoformat(time.replace("Z", "+00:00"))
            if posted_at.tzinfo is None:
                raise ValueError("missing timestamp offset")
        except ValueError:
            posted_at = None
        relative_minute = (int((posted_at.timestamp() - kick_at.timestamp()) // 60)
                           if posted_at and kick_at else -1)
        lower = text.lower().lstrip()
        kind = ("FULL TIME" if lower.startswith(("full time", "full-time", "fulltime", "ft:"))
                else "HALF TIME" if lower.startswith(("half time", "half-time", "halftime", "ht:"))
                else "COMMENTARY")
        explicit_minute = re.match(r"^(\d{1,3})\s*['’″′\"]", text)
        if kind == "FULL TIME":
            relative_minute = max(relative_minute, 140)
        elif kind == "HALF TIME":
            relative_minute = 49
        elif explicit_minute:
            relative_minute = int(explicit_minute.group(1))
        items.append({
            "minute": None, "sort": relative_minute,
            "source": str(post.get("author") or "Facebook Fans group") + " · MANUALLY RELAYED FACEBOOK",
            "kind": kind, "message": text,
            "time": posted_at.astimezone(LONDON).strftime("%H:%M") if posted_at else "",
        })
    return sorted(items, key=lambda x: (x["sort"], x["kind"] == "FULL TIME"), reverse=True)


def render(data, manual):
    fixture_date = data["matchDate"]
    score = data["score"]
    match = esc(data["home"]) + " " + str(score["home"]) + "–" + str(score["away"]) + " " + esc(data["away"])
    items = make_timeline(data, manual)
    cards = []
    for item in items:
        label = esc(item["kind"])
        when = (str(item["minute"]) + "′") if item["minute"] is not None and item["minute"] >= 0 else esc(item["time"] or "—")
        css = "official" if item["source"].startswith("SOUTHERN LEAGUE") else "facebook"
        text = esc(item["message"])
        cards.append(
            '<article class="event ' + css + '"><div class="eventhead"><span class="moment">' + when +
            '</span><span class="eventtype">' + label + '</span></div>' +
            '<div class="message">' + text + '</div><div class="source">' + esc(item["source"]) + '</div></article>'
        )
    note = (
        "Includes verified Southern League match incidents and " +
        str(len(manual)) + " manually relayed Facebook commentary posts. " +
        "Original X posts and the raw Cloudflare timeline are not preserved in this replay."
    )
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#151515">
<title>{match} | As It Happened · Tivvy</title>
<link href="https://fonts.googleapis.com/css2?family=Antonio:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#151515;color:white;font:16px/1.5 Arial,Helvetica,sans-serif}}
main{{max-width:900px;margin:auto;padding:24px 18px 50px}}
h1,h2,.score,.moment,.eventtype,.back{{font-family:Antonio,Impact,'Arial Narrow',sans-serif;text-transform:uppercase}}
.kicker{{color:#ffda00;letter-spacing:1px;font-weight:700;font-size:13px}}
h1{{color:#ffda00;font-size:clamp(36px,6vw,64px);margin:5px 0 12px;line-height:1.1}}
.score{{font-size:clamp(23px,4vw,40px);line-height:1.15;margin:0 0 18px}}
.info{{padding:12px 14px;border:1px solid #555;border-radius:6px;color:#dedede;font-size:13px;margin-bottom:18px}}
.event{{border:1px solid #454545;border-left:5px solid #419cff;background:#242424;border-radius:6px;padding:13px 15px;margin:0 0 11px}}
.event.facebook{{border-left-color:#ffda00}}
.eventhead{{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:7px}}
.moment{{font-size:24px;color:#ffda00}}.eventtype{{font-size:21px;color:white}}
.message{{font-size:16px;white-space:pre-wrap;overflow-wrap:anywhere}}
.source{{color:#aeb2b9;font-size:11px;letter-spacing:.3px;margin-top:10px;text-transform:uppercase}}
.back{{display:block;background:#ffda00;color:#151515;text-align:center;font-size:24px;text-decoration:none;padding:13px 10px;margin-top:26px}}
@media(max-width:480px){{main{{padding:17px 12px 35px}}.event{{padding:12px}}}}
</style></head><body><main>
<div class="kicker">{esc(fixture_date)} · SOUTHERN LEAGUE DIVISION ONE SOUTH · MATCH ARCHIVE</div>
<h1>AS IT HAPPENED</h1><div class="score">{match}</div>
<p class="info">{esc(note)}</p>
{''.join(cards) if cards else '<p>No verified match incidents or archived commentary are available.</p>'}
<a class="back" href="https://www.tivertontownfc.uk/match-centre" target="_blank" rel="noopener">OPEN THE MATCH CENTRE ↗</a>
</main></body></html>
"""


def main():
    OUTPUT.mkdir(exist_ok=True)
    for path in sorted(SOURCE.glob("tivvy-programme-postmatch-*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("verified") is not True or data.get("status") != "FullTime":
            continue
        if data.get("home") != TIVVY and data.get("away") != TIVVY:
            continue
        if not isinstance(data.get("score", {}).get("home"), int) or not isinstance(data.get("score", {}).get("away"), int):
            continue
        date = str(data.get("matchDate") or "")
        if len(date) != 10 or not date.replace("-", "").isdigit():
            continue
        manual_path = SOURCE / ("tivvy-manual-facebook-" + date + ".json")
        manual_data = json.loads(manual_path.read_text(encoding="utf-8")) if manual_path.exists() else {}
        manual = manual_data.get("posts") if manual_data.get("date") == date else []
        if not isinstance(manual, list):
            manual = []
        content = render(data, manual)
        target = OUTPUT / (date + ".html")
        if target.exists() and target.read_text(encoding="utf-8") == content:
            print("UNCHANGED", target)
            continue
        target.write_text(content, encoding="utf-8")
        print("GENERATED", target, "posts:", len(manual))


if __name__ == "__main__":
    main()

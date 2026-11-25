#!/usr/bin/env python3
"""Generate Wix-ready match-facts panels from verified post-match exports.

Never modify Darren's report copy, programme artwork or hand-crafted embeds.
"""
import html
import json
from pathlib import Path

SOURCE = Path("data")
OUTPUT = Path("match-facts")
TIVVY = "Tiverton Town"


def e(value):
    return html.escape(str(value if value is not None else ""), quote=True)


def minute(value):
    return e(value) + "'" if str(value or "").strip() else ""


def player_row(player):
    bits = []
    if player.get("position") == "GK":
        bits.append('<span class="yellow">🧤 GK</span>')
    if player.get("captain"):
        bits.append('<span class="yellow">(C)</span>')
    for card in player.get("cards") or []:
        icon = "🟥" if "red" in str(card.get("type", "")).lower() else "🟨"
        bits.append('<span class="card">' + icon + " " + minute(card.get("minute")) + "</span>")
    for gm in player.get("goalMinutes") or []:
        pen = str(gm) in set(map(str, player.get("penaltyMinutes") or []))
        bits.append('<span class="goal">⚽ ' + minute(gm) + (" (pen)" if pen else "") + "</span>")
    if player.get("onMinute"):
        bits.append('<span class="on">▲ on ' + minute(player["onMinute"]) + "</span>")
    if player.get("offMinute"):
        bits.append('<span class="off">▼ off ' + minute(player["offMinute"]) + "</span>")
    return "<li>" + e(player.get("name")) + (" " + " ".join(bits) if bits else "") + "</li>"


def event_row(event, label=None):
    return "<li>" + e(label if label is not None else event.get("player")) + (
        ' <span class="goal">⚽ ' if str(event.get("eventType", "")).startswith("GOAL") else ' <span class="card">🟨 '
    ) + minute(event.get("minute")) + (
        " (pen)" if event.get("eventType") == "GOAL_FROM_PENALTY" else ""
    ) + "</span></li>"


def render(data):
    if data.get("verified") is not True or data.get("status") != "FullTime":
        return None
    score = data.get("score") or {}
    if not isinstance(score.get("home"), int) or not isinstance(score.get("away"), int):
        return None
    if TIVVY not in (data.get("home"), data.get("away")):
        return None
    if not data.get("lineupsVerified") or len(data.get("starters") or []) != 11:
        # Do not present an estimated or partial XI as the real match sheet.
        return None
    if not data.get("incidents", {}).get("goals") and score["home"] + score["away"] > 0:
        # A completed-score-only fallback is not a sufficient match-facts feed.
        return None
    date = data.get("matchDate", "")
    if len(date) != 10:
        return None
    # A 0-goal Tivvy match has no Tivvy goal event. Infer the club's
    # incident team ID from a *named Tivvy player's* recorded booking or goal,
    # never by assigning every opponent incident to Tivvy.
    tivvy_names = {str(p.get("name", "")).strip().lower()
                   for p in data["starters"] + (data.get("substitutes") or [])}
    identifying_events = (data.get("incidents") or {}).get("goals", []) + (data.get("incidents") or {}).get("yellowCards", []) + (data.get("incidents") or {}).get("redCards", [])
    tv_team_id = next((x.get("teamId") for x in identifying_events
                       if x.get("teamId") and str(x.get("player", "")).strip().lower() in tivvy_names), None)
    # For this fixture the source event team IDs are present; do not classify any
    # opponent incident without a trustworthy team ID.
    goals = data["incidents"].get("goals") or []
    if tv_team_id:
        tivvy_goals = [g for g in goals if g.get("teamId") == tv_team_id]
        opponent_goals = [g for g in goals if g.get("teamId") != tv_team_id]
    else:
        tivvy_goals, opponent_goals = [], goals
    bookings = data["incidents"].get("yellowCards") or []
    our_bookings = [c for c in bookings if tv_team_id and c.get("teamId") == tv_team_id]
    their_bookings = [c for c in bookings if tv_team_id and c.get("teamId") != tv_team_id]
    names = lambda xs: "".join(player_row(x) for x in xs)
    events = lambda xs: "".join(event_row(x) for x in xs) or '<li class="muted">None recorded</li>'
    def bookings_html(xs):
        return "".join('<li>' + e(x.get("player")) + ' <span class="card">🟨 ' +
                       minute(x.get("minute")) + "</span></li>" for x in xs) or '<li class="muted">None recorded</li>'
    venue = "Home" if data["home"] == TIVVY else "Away"
    source = data.get("source", "verified match record")
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(data["home"])} {score["home"]}–{score["away"]} {e(data["away"])} | Tivvy match facts</title>
<link href="https://fonts.googleapis.com/css2?family=Antonio:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{{box-sizing:border-box}}body{{background:#242424;color:#fff;font:18px/1.55 Arial,Helvetica,sans-serif;margin:0}}
main{{padding:32px 38px;max-width:1100px;margin:auto}}.eyebrow,h2,.score,.cta{{font-family:Antonio,Impact,'Arial Narrow',sans-serif;text-transform:uppercase;font-weight:700}}
.eyebrow,h2{{color:#ffda00}}.eyebrow{{font-size:clamp(18px,2.2vw,25px)}}.score{{font-size:clamp(30px,4.5vw,58px);line-height:1.12;margin:20px 0 30px}}
.score strong{{color:#ed334c}}hr{{border:0;border-top:1px solid #555;margin:0 0 30px}}
.columns{{display:grid;grid-template-columns:1fr 1fr;gap:36px}}h2{{font-size:clamp(27px,3vw,38px);line-height:1.17;margin:6px 0 20px}}
ul{{list-style:none;padding:0;margin:0 0 32px}}li{{margin:0 0 17px}}.yellow{{color:#ffda00}}
.goal{{color:#69aaff}}.card{{color:#ffc16e}}.on{{color:#57e0ad}}.off{{color:#fa6b80}}.muted{{color:#aaa}}
.cta{{display:block;background:#ffda00;color:#111;text-align:center;padding:18px 10px;text-decoration:none;font-size:27px}}
.replay{{border-top:1px solid #555;padding:18px 0 20px;margin-top:14px}}
.replay summary{{font:700 27px Antonio,Impact,'Arial Narrow',sans-serif;color:#ffda00;cursor:pointer}}
.replay p{{font-size:16px;color:#ddd;margin:8px 0 16px}}
.replay-link{{font-size:22px;border-radius:2px}}
.source{{font-size:12px;color:#bbb;margin-top:15px}}
@media(max-width:620px){{main{{padding:23px 21px}}.columns{{grid-template-columns:1fr;gap:0}}li{{margin-bottom:13px}}}}
</style></head><body><main>
<div class="eyebrow">{e(date[8:10])} {e(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][int(date[5:7])-1])} {e(date[:4])} · {venue} · Southern League Div 1 South</div>
<div class="score">{e(data["home"])} <strong>{score["home"]} – {score["away"]}</strong> {e(data["away"])}</div><hr>
<div class="columns"><section><h2>Starting XI</h2><ul>{names(data["starters"])}</ul></section>
<section><h2>Substitutes</h2><ul>{names(data.get("substitutes") or []) or '<li class="muted">None listed</li>'}</ul>
<h2>Tiverton goal scorers</h2><ul>{events(tivvy_goals)}</ul>
{("<h2>Opposition goal scorers</h2><ul>"+events(opponent_goals)+"</ul>") if opponent_goals else ""}
<h2>Tiverton disciplinary</h2><ul>{bookings_html(our_bookings)}</ul>
<h2>{e(data["opponent"])} disciplinary</h2><ul>{bookings_html(their_bookings)}</ul>
</section></div>
<details class="replay"><summary>AS IT HAPPENED · MATCH TIMELINE</summary>
<p>Replay verified Southern League incidents alongside any preserved, attributed matchday commentary.</p>
<a class="cta replay-link" href="https://nickabull.github.io/Tiverton-Town-Control-Centre/match-replays/{e(date)}.html" target="_blank" rel="noopener noreferrer">EXPLORE THE FULL MATCH TIMELINE ↗</a>
</details>
<a class="cta" href="https://www.tivertontownfc.uk/match-centre" target="_blank" rel="noopener">Open the full match centre ↗</a>
<p class="source">Match facts: {e(source)} · Checked {e(data.get("sourceCheckedAt","unknown"))}</p>
</main></body></html>
"""


def main():
    OUTPUT.mkdir(exist_ok=True)
    for path in sorted(SOURCE.glob("tivvy-programme-postmatch-*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        content = render(data)
        if content is None:
            print("SKIP incomplete or unverified match facts:", path)
            continue
        destination = OUTPUT / (data["matchDate"] + ".html")
        if destination.exists() and destination.read_text(encoding="utf-8") == content:
            print("UNCHANGED", destination)
            continue
        destination.write_text(content, encoding="utf-8")
        print("GENERATED", destination)


if __name__ == "__main__":
    main()

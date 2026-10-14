#!/usr/bin/env python3
import html
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

URLS = [
    "https://www.southern-football-league.co.uk/overview/divonesouth",
    "https://slc-www.southern-football-league.co.uk/overview/divonesouth",
]
UA = "Mozilla/5.0 (compatible; TivertonTownControlCentre/2.0; +https://github.com/nickabull/Tiverton-Town-Control-Centre)"

DATE_RE = re.compile(r"^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})$")
SCORE_RE = re.compile(r"^(\d+)\s*[-–]\s*(\d+)$")

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.geturl(), r.read().decode("utf-8", errors="replace")

def clean_text(s):
    s = re.sub(r"<script\b[^>]*>.*?</script>", " ", s, flags=re.I|re.S)
    s = re.sub(r"<style\b[^>]*>.*?</style>", " ", s, flags=re.I|re.S)
    s = re.sub(r"</?(?:p|div|h[1-6]|li|br|section|article|tr|td|th|button)\b[^>]*>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s).replace("\xa0", " ")
    return [re.sub(r"\s+", " ", x).strip() for x in s.splitlines() if re.sub(r"\s+", " ", x).strip()]

def parse_date(line):
    m = DATE_RE.match(line)
    if not m:
        return None
    _, day, mon, year = m.groups()
    try:
        return datetime.strptime(f"{day} {mon} {year}", "%d %B %Y")
    except ValueError:
        return None

def parse_latest_completed_round(lines):
    sections = []
    current_date = None
    current_lines = []
    for line in lines:
        d = parse_date(line)
        if d:
            if current_date is not None:
                sections.append((current_date, current_lines))
            current_date, current_lines = d, []
        elif current_date is not None:
            current_lines.append(line)
    if current_date is not None:
        sections.append((current_date, current_lines))

    completed = []
    for d, block in sections:
        results = []
        i = 0
        while i + 2 < len(block):
            home, score, away = block[i], block[i+1], block[i+2]
            m = SCORE_RE.match(score)
            if m and home and away and not re.search(r"\b(P-P|TBC|LIVE)\b", home + " " + away, re.I):
                hs, aas = map(int, m.groups())
                results.append({"home":home, "home_score":hs, "away_score":aas, "away":away})
                i += 3
            else:
                i += 1
        if results:
            completed.append((d, results))
    if not completed:
        raise RuntimeError("No completed Division One South result block found on overview page")
    completed.sort(key=lambda x:x[0], reverse=True)
    return completed[0]

def sentence_for(r):
    h,a,hs,as_ = r["home"],r["away"],r["home_score"],r["away_score"]
    if hs == as_:
        return f"{h} and {a} shared the points in a {hs}-{as_} draw."
    winner = h if hs > as_ else a
    loser = a if hs > as_ else h
    margin = abs(hs-as_)
    if margin >= 3:
        return f"{winner} recorded a convincing {max(hs,as_)}-{min(hs,as_)} win over {loser}."
    if margin == 1:
        return f"{winner} edged {loser} {max(hs,as_)}-{min(hs,as_)}."
    return f"{winner} beat {loser} {max(hs,as_)}-{min(hs,as_)}."

def tag_for(r):
    if r["home_score"] == r["away_score"]:
        return "Draw"
    if abs(r["home_score"]-r["away_score"]) >= 3:
        return "Big win"
    return "Result"

def make_page(date_label, source_url, results, updated):
    cards="\n".join(
        f'<article class="card"><div class="score">{html.escape(r["home"])} {r["home_score"]}–{r["away_score"]} {html.escape(r["away"])}</div><p>{html.escape(sentence_for(r))}</p><span class="tag">{tag_for(r)}</span></article>'
        for r in results
    )
    full="".join(f'<div>{html.escape(r["home"])} {r["home_score"]}–{r["away_score"]} {html.escape(r["away"])}</div>' for r in results)
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Around the League | Tivvy Control Centre</title>
<style>
:root{{--yellow:#f2c400;--bg:#f3f3f1;--line:#ddd}}*{{box-sizing:border-box}}body{{margin:0;font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:#161616}}header{{background:linear-gradient(115deg,#111 0%,#242424 45%,#111 100%);color:#fff;border-bottom:5px solid var(--yellow)}}.head{{max-width:1180px;margin:auto;padding:18px 22px;display:grid;grid-template-columns:90px 1fr 150px;gap:18px;align-items:center}}.logo{{height:78px;max-width:110px;object-fit:contain}}.league{{width:145px;height:70px;object-fit:cover;border:2px solid rgba(255,255,255,.6);border-radius:6px}}.eyebrow{{color:var(--yellow);font-size:12px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase}}.title{{font-size:clamp(26px,4vw,42px);font-weight:900;margin:3px 0}}.sub{{color:#ddd;font-size:14px}}nav{{max-width:1180px;margin:auto;padding:0 22px 14px}}nav a{{display:inline-block;color:#fff;text-decoration:none;border:1px solid #444;padding:8px 11px;border-radius:7px}}main{{max-width:1180px;margin:auto;padding:26px 22px 50px}}.intro,.results{{background:#fff;border:1px solid var(--line);border-top:5px solid var(--yellow);padding:20px;border-radius:12px;margin-bottom:18px}}.intro h2{{margin:0 0 8px;font-size:28px}}.intro p{{margin:0;color:#555;line-height:1.5}}.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}}.card{{background:#fff;border:1px solid var(--line);border-radius:12px;padding:17px}}.score{{font-size:21px;font-weight:900;margin-bottom:8px}}.card p{{margin:0;color:#555;line-height:1.45;font-size:14px}}.tag{{display:inline-block;margin-top:12px;padding:5px 8px;background:#111;color:#fff;border-radius:999px;font-size:11px;font-weight:800;text-transform:uppercase}}.results{{margin-top:18px;border-top-width:1px}}.results-grid{{columns:2;column-gap:30px}}.results-grid div{{padding:6px 0;border-bottom:1px solid #eee;break-inside:avoid}}.source{{margin-top:18px;color:#777;font-size:13px}}.source a{{color:#555}}@media(max-width:850px){{.grid{{grid-template-columns:1fr 1fr}}.head{{grid-template-columns:70px 1fr}}.league{{display:none}}}}@media(max-width:600px){{.grid{{grid-template-columns:1fr}}.results-grid{{columns:1}}}}
</style></head><body>
<header><div class="head"><img class="logo" src="https://ilcalcio.net/assets/74/79/74798e74ec395fe9614ced7aa31c4dc3.png" alt="Tiverton Town FC"><div><div class="eyebrow">Tiverton Town • Programme Intelligence</div><div class="title">Around the League</div><div class="sub">Division One South · {html.escape(date_label)}</div></div><img class="league" src="https://www.voicenewspapers.co.uk/tindle-static/image/2024/08/30/12/41/Untitled-design-119.jpeg?crop=752%3A500&amp;height=500&amp;width=752" alt="Pitching In Southern League"></div><nav><a href="index.html">← Control Centre</a></nav></header>
<main><section class="intro"><h2>Latest completed Division One South programme</h2><p>This page now uses the latest completed result block on the official Southern League Division One South overview, so midweek rounds appear immediately instead of waiting for the next written league round-up.</p></section><section class="grid">{cards}</section>
<section class="results"><h3>Full Division One South results</h3><div class="results-grid">{full}</div></section>
<p class="source">Updated {html.escape(updated)} · Source: <a href="{html.escape(source_url)}" target="_blank" rel="noopener">Pitching In Southern League Division One South</a></p></main></body></html>'''

def main():
    last = None
    for url in URLS:
        try:
            final_url, body = fetch(url)
            break
        except Exception as e:
            last = e
    else:
        raise last or RuntimeError("Could not fetch Division One South overview")
    lines = clean_text(body)
    round_date, results = parse_latest_completed_round(lines)
    date_label = round_date.strftime("%A %-d %B %Y")
    updated = datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")
    snapshot = {
        "updated_utc": datetime.now(timezone.utc).isoformat(),
        "source_url": final_url,
        "date_label": date_label,
        "results": results,
    }
    Path("data").mkdir(exist_ok=True)
    Path("data/around-the-league.json").write_text(json.dumps(snapshot, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    Path("around-the-league.html").write_text(make_page(date_label, final_url, results, updated), encoding="utf-8")
    print(f"Built Around the League for {date_label} with {len(results)} results")

if __name__ == "__main__":
    main()

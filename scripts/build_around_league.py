#!/usr/bin/env python3
import html
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

OVERVIEWS = [
    "https://www.southern-football-league.co.uk/overview/divonesouth",
    "https://slc-www.southern-football-league.co.uk/overview/divonesouth",
]
UA = "Mozilla/5.0 (compatible; TivertonTownControlCentre/1.0; +https://github.com/nickabull/Tiverton-Town-Control-Centre)"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.geturl(), r.read().decode("utf-8", errors="replace")

def clean_text(s):
    s = re.sub(r"<script\b[^>]*>.*?</script>", " ", s, flags=re.I|re.S)
    s = re.sub(r"<style\b[^>]*>.*?</style>", " ", s, flags=re.I|re.S)
    s = re.sub(r"</?(?:p|div|h[1-6]|li|br|section|article|tr|td|th)\b[^>]*>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    s = s.replace("\xa0", " ")
    lines = [re.sub(r"\s+", " ", x).strip() for x in s.splitlines()]
    return "\n".join(x for x in lines if x)

def strip_tags(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()

def find_latest_roundup(base_url, body):
    candidates = []
    for m in re.finditer(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', body, flags=re.I|re.S):
        href, label = m.group(1), strip_tags(m.group(2))
        low = (href + " " + label).lower()
        if "round-up" in low or "roundup" in low:
            if "/articles/" in href:
                candidates.append((label, urllib.parse.urljoin(base_url, href)))
    if not candidates:
        raise RuntimeError("No round-up article link found on Division One South overview")
    return candidates[0]

def section_div_one_south(article_html):
    text = clean_text(article_html)
    start_markers = [
        "Pitching In Southern League Division One South:",
        "Pitching In Southern League Division One South",
        "Division One South:"
    ]
    start = -1
    marker = None
    for s in start_markers:
        start = text.lower().find(s.lower())
        if start != -1:
            marker = s
            break
    if start == -1:
        raise RuntimeError("Division One South section not found in latest round-up")
    section = text[start + len(marker):]
    next_match = re.search(r"\nPitching In Southern League (?!Division One South)[^\n]*", section, flags=re.I)
    if next_match:
        section = section[:next_match.start()]
    for stop in ["Emirates FA Cup", "Isuzu FA Trophy", "For a look at the table"]:
        p = section.lower().find(stop.lower())
        if p != -1 and p > 100:
            section = section[:p]
    return section.strip()

TEAM_SCORE = re.compile(r"^(.+?)\s+(\d+)\s*[-–]\s*(\d+)\s+(.+?)$")

def parse_results(section):
    candidate = section
    idx = section.lower().find("full results list")
    if idx != -1:
        candidate = section[idx:]
    results = []
    seen = set()
    for line in candidate.splitlines():
        line = line.strip(" \t•")
        m = TEAM_SCORE.match(line)
        if not m:
            continue
        home, hs, as_, away = m.groups()
        if len(home) > 55 or len(away) > 55:
            continue
        key = (home.lower(), away.lower(), hs, as_)
        if key in seen:
            continue
        seen.add(key)
        results.append({"home": home, "home_score": int(hs), "away_score": int(as_), "away": away})
    if not results:
        for m in re.finditer(r"([A-Z][A-Za-z'’&.\- ]{2,45}?)\s+(\d+)\s*[-–]\s*(\d+)\s+([A-Z][A-Za-z'’&.\- ]{2,45})", section):
            home, hs, as_, away = [x.strip() if isinstance(x,str) else x for x in m.groups()]
            key=(home.lower(),away.lower(),hs,as_)
            if key not in seen:
                seen.add(key)
                results.append({"home":home,"home_score":int(hs),"away_score":int(as_),"away":away})
    return results

def sentence_for(r):
    h,a,hs,as_ = r["home"],r["away"],r["home_score"],r["away_score"]
    if hs == as_:
        return f"{h} and {a} shared the points in a {hs}-{as_} draw."
    winner = h if hs > as_ else a
    loser = a if hs > as_ else h
    margin = abs(hs-as_)
    if margin >= 3:
        tone = "recorded a convincing"
    elif margin == 1:
        tone = "edged a"
    else:
        tone = "claimed a"
    return f"{winner} {tone} {max(hs,as_)}-{min(hs,as_)} win over {loser}."

def tag_for(r):
    hs,as_=r["home_score"],r["away_score"]
    if hs==as_: return "Draw"
    if abs(hs-as_)>=3: return "Big win"
    return "Result"

def extract_date_and_title(article_html):
    text=clean_text(article_html)
    title_m=re.search(r"^(.+?Round-Up.+)$", text, flags=re.I|re.M)
    date_m=re.search(r"\b(\d{2}\s+[A-Z][a-z]{2}\s+20\d{2})\b", text)
    return (title_m.group(1).strip() if title_m else "Southern League Round-Up",
            date_m.group(1) if date_m else datetime.now(timezone.utc).strftime("%d %b %Y"))

def make_page(title,date_label,url,results,updated):
    cards="\n".join(
        f'''<article class="card"><div class="score">{html.escape(r["home"])} {r["home_score"]}–{r["away_score"]} {html.escape(r["away"])}</div><p>{html.escape(sentence_for(r))}</p><span class="tag">{tag_for(r)}</span></article>'''
        for r in results
    )
    full="".join(f'<div>{html.escape(r["home"])} {r["home_score"]}–{r["away_score"]} {html.escape(r["away"])}</div>' for r in results)
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Around the League | Tivvy Control Centre</title>
<style>
:root{{--yellow:#f2c400;--bg:#f3f3f1;--line:#ddd}}*{{box-sizing:border-box}}body{{margin:0;font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:#161616}}header{{background:linear-gradient(115deg,#111 0%,#242424 45%,#111 100%);color:#fff;border-bottom:5px solid var(--yellow)}}.head{{max-width:1180px;margin:auto;padding:18px 22px;display:grid;grid-template-columns:90px 1fr 150px;gap:18px;align-items:center}}.logo{{height:78px;max-width:110px;object-fit:contain;filter:drop-shadow(0 4px 5px rgba(0,0,0,.35))}}.league{{width:145px;height:70px;object-fit:cover;border:2px solid rgba(255,255,255,.6);border-radius:6px}}.eyebrow{{color:var(--yellow);font-size:12px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase}}.title{{font-size:clamp(26px,4vw,42px);font-weight:900;margin:3px 0}}.sub{{color:#ddd;font-size:14px}}nav{{max-width:1180px;margin:auto;padding:0 22px 14px}}nav a{{display:inline-block;color:#fff;text-decoration:none;border:1px solid #444;padding:8px 11px;border-radius:7px}}main{{max-width:1180px;margin:auto;padding:26px 22px 50px}}.intro,.results{{background:#fff;border:1px solid var(--line);border-top:5px solid var(--yellow);padding:20px;border-radius:12px;margin-bottom:18px}}.intro h2{{margin:0 0 8px;font-size:28px}}.intro p{{margin:0;color:#555;line-height:1.5}}.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}}.card{{background:#fff;border:1px solid var(--line);border-radius:12px;padding:17px}}.score{{font-size:21px;font-weight:900;margin-bottom:8px}}.card p{{margin:0;color:#555;line-height:1.45;font-size:14px}}.tag{{display:inline-block;margin-top:12px;padding:5px 8px;background:#111;color:#fff;border-radius:999px;font-size:11px;font-weight:800;text-transform:uppercase}}.results{{margin-top:18px;border-top-width:1px}}.results-grid{{columns:2;column-gap:30px}}.results-grid div{{padding:6px 0;border-bottom:1px solid #eee;break-inside:avoid}}.source{{margin-top:18px;color:#777;font-size:13px}}.source a{{color:#555}}@media(max-width:850px){{.grid{{grid-template-columns:1fr 1fr}}.head{{grid-template-columns:70px 1fr}}.league{{display:none}}}}@media(max-width:600px){{.grid{{grid-template-columns:1fr}}.results-grid{{columns:1}}}}
</style></head><body>
<header><div class="head"><img class="logo" src="https://ilcalcio.net/assets/74/79/74798e74ec395fe9614ced7aa31c4dc3.png" alt="Tiverton Town FC"><div><div class="eyebrow">Tiverton Town • Programme Intelligence</div><div class="title">Around the League</div><div class="sub">Division One South · {html.escape(date_label)}</div></div><img class="league" src="https://www.voicenewspapers.co.uk/tindle-static/image/2024/08/30/12/41/Untitled-design-119.jpeg?crop=752%3A500&amp;height=500&amp;width=752" alt="Pitching In Southern League"></div><nav><a href="index.html">← Control Centre</a></nav></header>
<main><section class="intro"><h2>Latest Division One South round-up</h2><p>This page is rebuilt automatically from the latest official Pitching In Southern League round-up. The current automatic layer uses confirmed results only; scorer, transfer and club-news enrichment is the next layer.</p></section><section class="grid">{cards}</section>
<section class="results"><h3>Full Division One South results</h3><div class="results-grid">{full}</div></section>
<p class="source">Updated {html.escape(updated)} · Source: <a href="{html.escape(url)}" target="_blank" rel="noopener">{html.escape(title)}</a></p></main></body></html>'''

def main():
    last_error=None
    overview_url=overview_html=None
    for u in OVERVIEWS:
        try:
            overview_url, overview_html=fetch(u)
            break
        except Exception as e:
            last_error=e
    if overview_html is None:
        raise last_error or RuntimeError("Could not fetch Southern League overview")
    label, roundup_url=find_latest_roundup(overview_url, overview_html)
    final_url, article_html=fetch(roundup_url)
    section=section_div_one_south(article_html)
    results=parse_results(section)
    if len(results) < 2:
        raise RuntimeError(f"Only {len(results)} Division One South result(s) found; refusing to overwrite page")
    title,date_label=extract_date_and_title(article_html)
    updated=datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")
    snapshot={"updated_utc":datetime.now(timezone.utc).isoformat(),"source_url":final_url,"source_title":title,"date_label":date_label,"results":results}
    Path("data").mkdir(exist_ok=True)
    Path("data/around-the-league.json").write_text(json.dumps(snapshot,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    Path("around-the-league.html").write_text(make_page(title,date_label,final_url,results,updated),encoding="utf-8")
    print(f"Built Around the League from {final_url} with {len(results)} results")

if __name__=="__main__":
    main()

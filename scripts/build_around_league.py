#!/usr/bin/env python3
import html
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://www.southern-football-league.co.uk"
HOME = BASE + "/"
OVERVIEW = BASE + "/overview/divonesouth"
UA = "Mozilla/5.0 (compatible; TivertonTownControlCentre/3.0; +https://github.com/nickabull/Tiverton-Town-Control-Centre)"
MAX_ARTICLES = 12
MAX_STORIES = 6

DIV1S_MARKERS = (
    "Pitching In Southern League Division One South:",
    "Southern League Division One South:",
    "Division One South:",
)

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.geturl(), r.read().decode("utf-8", errors="replace")

def strip_tags(s):
    s = re.sub(r"<script\b[^>]*>.*?</script>", " ", s, flags=re.I|re.S)
    s = re.sub(r"<style\b[^>]*>.*?</style>", " ", s, flags=re.I|re.S)
    s = re.sub(r"</?(?:p|div|h[1-6]|li|br|section|article|tr|td|th|blockquote)\b[^>]*>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s).replace("\xa0", " ")
    return [re.sub(r"\s+", " ", x).strip() for x in s.splitlines() if re.sub(r"\s+", " ", x).strip()]

def meta(doc, prop):
    pats = [
        rf'<meta[^>]+property=["\']{re.escape(prop)}["\'][^>]+content=["\']([^"\']+)["\']',
        rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']{re.escape(prop)}["\']',
        rf'<meta[^>]+name=["\']{re.escape(prop)}["\'][^>]+content=["\']([^"\']+)["\']',
        rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']{re.escape(prop)}["\']',
    ]
    for pat in pats:
        m=re.search(pat, doc, flags=re.I)
        if m:
            return html.unescape(m.group(1)).strip()
    return ""

def article_links(home_doc):
    seen=[]
    for m in re.finditer(r'href=["\']([^"\']*/articles/[^"\'#?]+)', home_doc, flags=re.I):
        u=urllib.parse.urljoin(BASE, html.unescape(m.group(1)))
        if u not in seen:
            seen.append(u)
    return seen[:MAX_ARTICLES]

def find_div1s_section(lines):
    start=None
    for i,line in enumerate(lines):
        if any(marker.lower() in line.lower() for marker in DIV1S_MARKERS):
            start=i+1
            break
    if start is None:
        return []
    out=[]
    for line in lines[start:]:
        low=line.lower()
        if line.startswith("Pitching In Southern League ") and "division one south" not in low:
            break
        if low in ("get the latest news straight to your inbox", "southern football league"):
            break
        if low == "results:":
            break
        if line.startswith("© "):
            break
        if len(line) < 15:
            continue
        out.append(line)
    return out

def split_stories(lines):
    # Turn the league section into compact programme-ready story candidates.
    # Group 1-3 consecutive sentences around clear team/result statements.
    stories=[]
    buf=[]
    for line in lines:
        if "Tiverton Town" in line:
            # Around the League deliberately excludes Tiverton-led copy.
            if buf:
                stories.append(" ".join(buf)); buf=[]
            continue
        if re.search(r"\bResults?:\b", line, re.I):
            break
        if re.search(r"\b\d+[-–]\d+\b", line) or re.search(r"\b(top|win|won|winner|unbeaten|streak|brace|hat-trick|signed|manager|award|promot)", line, re.I):
            buf.append(line)
            if len(" ".join(buf)) >= 180 or len(buf) >= 2:
                stories.append(" ".join(buf)); buf=[]
        elif buf and len(buf)<2:
            buf.append(line)
            stories.append(" ".join(buf)); buf=[]
    if buf:
        stories.append(" ".join(buf))
    clean=[]
    for s in stories:
        s=re.sub(r"\s+"," ",s).strip()
        if 70 <= len(s) <= 650 and "Tiverton Town" not in s:
            clean.append(s)
    return clean

def headline_for(text):
    first=re.split(r"(?<=[.!?])\s+", text)[0]
    # Prefer a compact headline generated from the factual first sentence.
    first=re.sub(r"\b(Pitching In|Southern League Division One South)\b","",first,flags=re.I)
    words=first.split()
    if len(words)>15:
        first=" ".join(words[:15]).rstrip(",;:")+"…"
    return first

def parse_article(url):
    final,doc=fetch(url)
    lines=strip_tags(doc)
    section=find_div1s_section(lines)
    if not section:
        return None
    title=meta(doc,"og:title") or next((x for x in lines if len(x)>20), "Southern League story")
    image=meta(doc,"og:image")
    desc=meta(doc,"og:description")
    date=next((x for x in lines if re.fullmatch(r"\d{1,2}\s+[A-Z][a-z]+\s+20\d{2}",x)), "")
    author=next((x[3:] for x in lines if x.lower().startswith("by ") and len(x)<80), "")
    credit=next((x for x in lines if x.lower().startswith("photo by ") or x.lower().startswith("picture by ")), "")
    stories=split_stories(section)
    return {
        "url":final,"article_title":title,"image":image,"description":desc,
        "date":date,"author":author,"credit":credit,"stories":stories
    }

def choose_candidates(articles):
    out=[]
    for a in articles:
        for body in a["stories"]:
            out.append({
                "headline":headline_for(body),
                "body":body,
                "source_title":a["article_title"],
                "source_url":a["url"],
                "image_url":a["image"],
                "date":a["date"],
                "author":a["author"],
                "credit":a["credit"],
            })
            if len(out)>=MAX_STORIES:
                return out
    return out

def render(stories, updated):
    cards=[]
    for i,s in enumerate(stories):
        image_block=""
        if s.get("image_url"):
            image_block=f'<div class="photo"><img src="{html.escape(s["image_url"])}" alt="" loading="lazy"></div>'
        credit=s.get("credit") or ("Southern League" if s.get("image_url") else "")
        cards.append(f'''<article class="story">
{image_block}
<div class="copy"><div class="date">{html.escape(s.get("date") or "")}</div>
<h2>{html.escape(s["headline"])}</h2>
<p>{html.escape(s["body"])}</p>
<div class="meta">Source: <a href="{html.escape(s["source_url"])}" target="_blank" rel="noopener">{html.escape(s["source_title"])}</a>{(" · "+html.escape(credit)) if credit else ""}</div></div>
</article>''')
    body="\n".join(cards) or '<div class="empty">No Division One South article candidates found.</div>'
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Around the League | Tivvy Control Centre</title>
<style>
:root{{--yellow:#f2c400;--bg:#f3f3f1;--line:#ddd;--ink:#171717}}
*{{box-sizing:border-box}}body{{margin:0;font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:var(--ink)}}
header{{background:linear-gradient(115deg,#111,#242424 45%,#111);color:#fff;border-bottom:5px solid var(--yellow)}}
.head{{max-width:1180px;margin:auto;padding:18px 22px}}.ey{{color:var(--yellow);font-size:12px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}}h1{{margin:4px 0}}.sub{{color:#ccc}}
main{{max-width:1180px;margin:auto;padding:22px}}.note{{background:#fff8cf;border-left:5px solid var(--yellow);padding:12px 14px;border-radius:6px;margin-bottom:16px}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}.story{{background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}}
.photo{{height:220px;background:#eee}}.photo img{{width:100%;height:100%;object-fit:cover}}.copy{{padding:16px}}.date{{font-size:11px;font-weight:900;color:#777;text-transform:uppercase;letter-spacing:.08em}}
.story h2{{font-size:21px;margin:5px 0 8px;line-height:1.15}}.story p{{font-size:14px;line-height:1.45;color:#555;margin:0 0 12px}}.meta{{font-size:11px;color:#777}}.meta a{{color:#555}}
.empty{{background:#fff;padding:20px;border:1px solid var(--line);border-radius:10px}}.foot{{margin-top:16px;font-size:12px;color:#777}}
@media(max-width:760px){{.grid{{grid-template-columns:1fr}}.photo{{height:190px}}}}
</style></head><body>
<header><div class="head"><div class="ey">Tiverton Town · Programme Intelligence</div><h1>Around the League — editorial test</h1><div class="sub">Southern League Division One South stories · Tiverton-led items excluded</div></div></header>
<main>
<div class="note"><strong>Test collector:</strong> pulls recent Southern League articles, isolates Division One South material, removes Tiverton-led copy, and presents programme-ready story candidates with source images/credits for approval.</div>
<section class="grid">{body}</section>
<div class="foot">Collector updated {html.escape(updated)} · Images remain attributed to their source and are candidates for editorial approval before programme use.</div>
</main><script src="programme-nav.js"></script></body></html>'''

def main():
    _,home_doc=fetch(HOME)
    articles=[]
    for url in article_links(home_doc):
        try:
            a=parse_article(url)
            if a and a["stories"]:
                articles.append(a)
        except Exception as e:
            print("article failed",url,e)
    stories=choose_candidates(articles)
    updated=datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")
    snapshot={
        "updated_utc":datetime.now(timezone.utc).isoformat(),
        "source_home":HOME,
        "source_overview":OVERVIEW,
        "articles_scanned":len(articles),
        "stories":stories
    }
    Path("data").mkdir(exist_ok=True)
    Path("data/around-the-league.json").write_text(json.dumps(snapshot,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    Path("around-the-league.html").write_text(render(stories,updated),encoding="utf-8")
    print(f"Built Around the League editorial test with {len(stories)} stories from {len(articles)} Division One South articles")

if __name__=="__main__":
    main()

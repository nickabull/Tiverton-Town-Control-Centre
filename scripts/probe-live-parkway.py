#!/usr/bin/env python3
"""Read-only two-source FA Cup probe. No fake live data, no credentials in web page.
Match-night refresh: the GitHub Actions push trigger runs a fresh collection.
"""
import json,re
from datetime import datetime,timezone
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen

DATE="2026-11-09"
SFL="https://api.southern-football-league.co.uk/matches"
FWP="https://www.footballwebpages.co.uk/fa-cup/20261109"
OUT=Path("data/live-test-parkway-berkhamsted.json")
def ts():return datetime.now(timezone.utc).isoformat()
def get(url,headers=None):
 h={"Accept":"application/json,text/html;q=0.9,*/*;q=0.8","User-Agent":"Mozilla/5.0 (compatible; TivvyLiveTrial/1.0)"}
 h.update(headers or {})
 with urlopen(Request(url,headers=h),timeout=22) as r:return r.read(3000000).decode("utf-8","replace")
def name(m,side):
 x=m.get(side+"Team") or {}
 return str(x.get("fullName") or x.get("shortName") or "") if isinstance(x,dict) else str(m.get(side+"TeamName") or "")
def fetch_sfl():
 p={"source":"Southern League public match API","url":SFL,"checkedAt":ts(),"state":"error","matchFound":False,"events":[]}
 try:
  q=urlencode({"withEvents":1,"period":"Custom","startDate":DATE+"T00:00:00.000Z",
               "endDate":DATE+"T23:59:59.999Z","limit":1000,"status":"any"})
  raw=json.loads(get(SFL+"?"+q,{"X-TENANT-ID":"sfl","Origin":"https://www.southern-football-league.co.uk","Referer":"https://www.southern-football-league.co.uk/live"}))
  matches=raw.get("items",[]) if isinstance(raw,dict) else []
  p["matchesInspected"]=len(matches)
  match=next((m for m in matches if isinstance(m,dict) and
    "plymouth parkway" in (name(m,"home")+" "+name(m,"away")).lower() and
    "berkhamsted" in (name(m,"home")+" "+name(m,"away")).lower()),None)
  if not match:
   p.update(state="no-match",message="API responded but did not include this FA Cup fixture.")
  else:
   p.update(state="found",matchFound=True,status=str(match.get("status") or "unknown"),home=name(match,"home"),away=name(match,"away"),apiId=str(match.get("_id") or match.get("id") or ""))
   score=match.get("score") or {}
   p["score"]=score.get("current") if isinstance(score,dict) else None
   for side in ("home","away"):
    for kind,field in (("goal","Goals"),("card","Cards"),("sub","Subs")):
     for ev in match.get(side+field,[]) or []:
      if not isinstance(ev,dict):continue
      p["events"].append({"side":side,"team":name(match,side),"type":kind,"minute":ev.get("minute"),
         "player":ev.get("personName"),"on":ev.get("personOnName"),"off":ev.get("personOffName"),"cardType":ev.get("cardType")})
 except Exception as e:p["message"]=type(e).__name__+": "+str(e)[:170]
 return p
class Text(HTMLParser):
 def __init__(self):super().__init__();self.parts=[];self.links=[]
 def handle_data(self,d):
  t=" ".join(d.split())
  if t:self.parts.append(t)
 def handle_starttag(self,tag,attrs):
  if tag=="a":
   d=dict(attrs);self.links.append(d.get("href",""))
def fetch_fwp():
 p={"source":"Football Web Pages PUBLIC fixtures page (not authenticated API)","url":FWP,"checkedAt":ts(),"state":"error","matchFound":False,"events":[]}
 try:
  raw=get(FWP)
  parser=Text();parser.feed(raw)
  txt=" | ".join(parser.parts)
  teams="plymouth parkway" in txt.lower() and "berkhamsted" in txt.lower()
  p["matchFound"]=teams
  p["state"]="listed" if teams else "no-match"
  p["message"]="Fixture appears on FWP public FA Cup listing. No verified score or events parsed." if teams else "No matching fixture in public listing."
  # Parse only the fixture's adjacent status and score cells, never unrelated games.
  # FWP's text layout is: status | Plymouth Parkway | home score | away score | Berkhamsted
  if teams:
   cells=[x.strip() for x in parser.parts if x.strip()]
   fixture=None
   for i in range(len(cells)-3):
    if cells[i].casefold()=="plymouth parkway" and cells[i+3].casefold()=="berkhamsted":
     fixture=i
     break
   if fixture is not None:
    prev=cells[fixture-1] if fixture>0 else ""
    left,right=cells[fixture+1],cells[fixture+2]
    if re.fullmatch(r"\\d{1,2}",left) and re.fullmatch(r"\\d{1,2}",right):
     p["score"]={"home":int(left),"away":int(right)}
     p["state"]="score-available"
     p["message"]="Confirmed score from FWP fixture listing; incident details not available here."
    if re.fullmatch(r"(?:\\d{1,3}(?:\\+\\d{1,2})?)['′]?",prev):
     p["matchMinute"]=prev
     p["progress"]="in-play"
    elif prev.casefold() in ("ht","half time","ft","full time","aet","pens","postponed","abandoned"):
     p["progress"]=prev
    p["fixtureExcerpt"]=" | ".join(cells[max(0,fixture-2):fixture+5])[:310]
   else:
    idx=txt.casefold().find("plymouth parkway")
    p["fixtureExcerpt"]=txt[max(0,idx-80):idx+200] if idx>=0 else ""

 except Exception as e:p["message"]=type(e).__name__+": "+str(e)[:170]
 return p
def main():
 current={"match":"Plymouth Parkway v Berkhamsted","date":DATE,"kickoff":"19:30 Europe/London",
          "checkedAt":ts(),"kind":"READ_ONLY_SOURCE_DIAGNOSTIC","isLiveCollector":False,
          "southernLeague":fetch_sfl(),"footballWebPages":fetch_fwp()}
 OUT.parent.mkdir(parents=True,exist_ok=True)
 OUT.write_text(json.dumps(current,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print("Southern League:",current["southernLeague"]["state"],"; FWP public:",current["footballWebPages"]["state"])
if __name__=="__main__":main()

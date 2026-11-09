#!/usr/bin/env python3
"""Southern League matchday fixtures for five tabbed competitions.
Official match API, no fabricated results. Public output contains only match facts.
"""
import json
import sys
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen
from zoneinfo import ZoneInfo

API="https://api.southern-football-league.co.uk/matches"
DATE=datetime.now(ZoneInfo("Europe/London")).date().isoformat()
if len(sys.argv)>1: DATE=sys.argv[1]
OUT=Path("data/southern-league-matchday-tabs.json")
def name(row,key):
 x=row.get(key+"Team") or {}
 return str(x.get("fullName") or x.get("shortName") or x.get("name") or "") if isinstance(x,dict) else str(row.get(key+"TeamName") or "")
def safe_comp(row):
 result={}
 for k,v in row.items():
  if any(t in k.lower() for t in ("competition","division","league","tournament","group","stage")):
   if isinstance(v,dict):
    result[k]={i:str(val)[:150] for i,val in v.items() if isinstance(val,(str,int,float))}
   elif isinstance(v,(str,int,float)):result[k]=str(v)[:150]
 return result
def get():
 params=urlencode({"withEvents":1,"period":"Custom",
                    "startDate":DATE+"T00:00:00.000Z","endDate":DATE+"T23:59:59.999Z",
                    "limit":1000,"status":"any"})
 req=Request(API+"?"+params,headers={
 "Accept":"application/json","X-TENANT-ID":"sfl",
 "Origin":"https://www.southern-football-league.co.uk",
 "Referer":"https://www.southern-football-league.co.uk/live",
 "User-Agent":"Mozilla/5.0 (compatible; TivvyMatchday/1.0)"})
 with urlopen(req,timeout=24) as res:return json.load(res)
def classify(row):
 comp=safe_comp(row)
 label=" ".join(str(v) for v in comp.values()).lower()
 if "fa cup" in label or "emirates" in label:return "facup"
 if "premier central" in label or "premier division central" in label:return "premiercentral"
 if "premier south" in label or "premier division south" in label:return "premiersouth"
 if "division one central" in label or "division 1 central" in label or "div one central" in label:return "onecentral"
 if "division one south" in label or "division 1 south" in label or "div one south" in label:return "onesouth"
 return "unclassified"
def main():
 payload={"date":DATE,"checkedAt":datetime.now(timezone.utc).isoformat(),"source":"Official Southern League match API",
          "status":"error","matches":[],"unclassified":[],"apiMatches":0}
 try:
  response=get()
  rows=response.get("items") if isinstance(response,dict) else None
  if not isinstance(rows,list):raise ValueError("API did not return a list of matches")
  payload["apiMatches"]=len(rows)
  for item in rows:
   if not isinstance(item,dict):continue
   c=safe_comp(item)
   score=item.get("score") or {}
   score=score.get("current") if isinstance(score,dict) else {}
   score=score if isinstance(score,dict) else {}
   side_names=[name(item,"home"),name(item,"away")]
   match={"id":str(item.get("_id") or item.get("id") or ""),
          "home":side_names[0],"away":side_names[1],
          "kickoff":str(item.get("kickOff") or item.get("kickoff") or item.get("date") or item.get("startTime") or ""),
          "status":str(item.get("status") or "Unknown"),
          "homeScore":score.get("home"),"awayScore":score.get("away"),
          "competition":classify(item)}
   if match["competition"]=="unclassified":
    payload["unclassified"].append({"home":match["home"],"away":match["away"],"fields":c,
      "availableTopLevelKeys":list(item.keys())[:40]})
   payload["matches"].append(match)
  payload["status"]="ok"
 except Exception as exc:
  payload["error"]=type(exc).__name__+": "+str(exc)[:180]
 OUT.parent.mkdir(parents=True,exist_ok=True)
 OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print("Status:",payload["status"],"matches:",len(payload["matches"]),"classified:",sum(x["competition"]!="unclassified" for x in payload["matches"]))
 print("Competition diagnostics:",json.dumps(payload["unclassified"],ensure_ascii=False)[:6000])
if __name__=="__main__":main()

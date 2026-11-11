#!/usr/bin/env python3
"""Read-only Southern League matchday snapshot, including Tiverton featured fixture."""
import json
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen
from urllib.error import HTTPError

DATE="2026-11-11"
OUT=Path("data/tivvy-live-20261111.json")
URL="https://api.southern-football-league.co.uk/matches"
FEATURED=("paulton rovers","tiverton town")
KNOWN={
 ("paulton rovers","tiverton town"):"onesouth",
 ("larkhall athletic","slimbridge afc"):"onesouth",
 ("willand rovers","shaftesbury"):"onesouth",
 ("frome town","plymouth parkway"):"premiersouth",
}
# Confirmed on 10 November from the official match event feed.
COMPETITION_IDS={"69d0bdf9b616bafb97331d41":"onesouth"}
LABELS={"onesouth":"Division One South","onecentral":"Division One Central",
        "premiersouth":"Premier South","premiercentral":"Premier Central"}
def timestamp():return datetime.now(timezone.utc).isoformat()
def team(m,side):
    t=m.get(side+"Team") or {}
    if isinstance(t,dict):return str(t.get("fullName") or t.get("shortName") or m.get(side+"TeamName") or "").strip()
    return str(m.get(side+"TeamName") or "").strip()
def comp(m,home,away):
    key=(home.casefold().strip(),away.casefold().strip())
    if key in KNOWN:return KNOWN[key]
    vals=[m.get("competition"),m.get("competitionName"),m.get("competitionTitle"),m.get("league")]
    for val in vals:
        if isinstance(val,dict):
            val=" ".join(str(val.get(k) or "") for k in ("name","fullName","shortName","title","division","id","_id"))
        name=str(val or "").lower().replace("-"," ").replace("_"," ")
        if name in COMPETITION_IDS:return COMPETITION_IDS[name]
        if "one" in name and "south" in name:return "onesouth"
        if "one" in name and "central" in name:return "onecentral"
        if "premier" in name and "south" in name:return "premiersouth"
        if "premier" in name and "central" in name:return "premiercentral"
    return "unclassified"
def run():
    doc={"date":DATE,"checkedAt":timestamp(),"status":"error","source":"Southern League public match API",
         "featured":None,"matches":[],"unclassified":[],"apiMatchesInspected":0}
    try:
        query=urlencode({"withEvents":1,"period":"Custom","startDate":DATE+"T00:00:00.000Z",
                         "endDate":DATE+"T23:59:59.999Z","limit":1000,"status":"any"})
        headers={"Accept":"application/json","User-Agent":"Mozilla/5.0 (TivvyLiveMatchdayTest/1.0)",
                 "X-TENANT-ID":"sfl","Origin":"https://www.southern-football-league.co.uk",
                 "Referer":"https://www.southern-football-league.co.uk/live"}
        variants=[
            query,
            urlencode({"withEvents":1,"period":"Today","limit":200,"status":"any"}),
            urlencode({"period":"Custom","startDate":DATE,"endDate":DATE,"limit":200}),
            urlencode({"limit":200}),
        ]
        failures=[]
        payload=None
        for variant in variants:
            try:
                with urlopen(Request(URL+"?"+variant,headers=headers),timeout=20) as response:
                    payload=json.load(response)
                doc["queryVariant"]=variants.index(variant)+1
                break
            except HTTPError as err:
                # Preserve the API's error description, but never expose credentials.
                details=err.read(600).decode("utf-8","replace")
                failures.append("HTTP "+str(err.code)+": "+details[:180])
            except Exception as err:
                failures.append(type(err).__name__+": "+str(err)[:90])
        if payload is None:raise RuntimeError("; ".join(failures))
        if failures:doc["rejectedQueries"]=failures[:3]
        raw=payload.get("items",[]) if isinstance(payload,dict) else []
        # Broad fallback queries can include other dates: never show them as today's matches.
        # Match objects can use kickOffDate rather than date or dateTime.
        raw=[m for m in raw if isinstance(m,dict) and str(m.get("kickOffDate") or m.get("date") or m.get("dateTime") or m.get("kickoffDate") or "").startswith(DATE)]
        doc["apiMatchesInspected"]=len(raw)
        for m in raw:
            if not isinstance(m,dict):continue
            h,a=team(m,"home"),team(m,"away")
            if not h or not a:continue
            category=comp(m,h,a)
            sc=m.get("score") or {}
            sc=sc.get("current") if isinstance(sc,dict) else None
            if not(isinstance(sc,dict) and type(sc.get("home")) is int and type(sc.get("away")) is int):sc=None
            status=str(m.get("status") or "unknown")
            item={"id":str(m.get("_id") or m.get("id") or ""),"home":h,"away":a,
                  "competition":category,"status":status,"score":sc,
                  "events":[e for e in (m.get("events") or []) if isinstance(e,dict)],
                  "kickoff":str(m.get("time") or m.get("dateTime") or ""),
                  "isFeatured":(h.casefold().strip(),a.casefold().strip())==FEATURED}
            if item["isFeatured"]:doc["featured"]=item
            elif category in LABELS:doc["matches"].append(item)
            else:doc["unclassified"].append({"home":h,"away":a,"competitionRaw":str(m.get("competition") or "")[:90]})
        doc["status"]="ok"
        if doc["featured"] is None:doc["warning"]="Featured fixture missing from current official API response"
    except Exception as ex:
        doc["error"]=type(ex).__name__+": "+str(ex)[:1000]
        # Preserve the known schedule for display even if live API temporarily rejects queries.
        schedule=Path("data/southern-league-matchday-tabs.json")
        if schedule.exists():
            try:
                backup=json.loads(schedule.read_text(encoding="utf-8"))
                if backup.get("date")==DATE:
                    for m in backup.get("matches",[]):
                        home,away=str(m.get("home") or ""),str(m.get("away") or "")
                        item={"id":str(m.get("id") or ""),"home":home,"away":away,
                              "competition":m.get("competition") or comp(m,home,away),
                              "status":m.get("status") or "unknown","score":None,
                              "events":[],"kickoff":"","scheduleOnly":True,
                              "isFeatured":(home.casefold().strip(),away.casefold().strip())==FEATURED}
                        if item["isFeatured"]:doc["featured"]=item
                        elif item["competition"] in LABELS:doc["matches"].append(item)
                    doc["status"]="schedule-only"
            except Exception as backupError:
                doc["scheduleError"]=str(backupError)[:130]
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(doc,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(doc["status"],"featured:",bool(doc["featured"]),"matches:",len(doc["matches"]),"unclassified:",len(doc["unclassified"]))
if __name__=="__main__":run()

#!/usr/bin/env python3
"""Read-only other Division One South fixtures for 10 Nov 2026. Excludes Inkberrow."""
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
DATE="2026-11-10"
URL="https://api.southern-football-league.co.uk/matches"
OUT=Path("data/live-other-games-20261110.json")
EXCLUDE={"sporting club inkberrow","hungerford town"}
def now(): return datetime.now(timezone.utc).isoformat()
def name(m,side):
    a=m.get(side+"Team") or {}
    return str(a.get("fullName") or a.get("shortName") or "") if isinstance(a,dict) else str(m.get(side+"TeamName") or "")
def main():
    doc={"date":DATE,"checkedAt":now(),"source":"Southern League public match API","status":"error","matches":[],"excludedFixture":"Sporting Club Inkberrow v Hungerford Town","apiMatchesInspected":0}
    try:
        q=urlencode({"withEvents":1,"period":"Custom","startDate":DATE+"T00:00:00.000Z","endDate":DATE+"T23:59:59.999Z","limit":1000,"status":"any"})
        h={"Accept":"application/json","User-Agent":"Mozilla/5.0 (compatible; TivvyOtherGames/1.0)","X-TENANT-ID":"sfl","Origin":"https://www.southern-football-league.co.uk","Referer":"https://www.southern-football-league.co.uk/live"}
        with urlopen(Request(URL+"?"+q,headers=h),timeout=25) as resp: payload=json.load(resp)
        matches=payload.get("items",[]) if isinstance(payload,dict) else []
        doc["apiMatchesInspected"]=len(matches)
        for m in matches:
            if not isinstance(m,dict): continue
            home,away=name(m,"home"),name(m,"away")
            if not home or not away or {home.casefold(),away.casefold()}==EXCLUDE: continue
            competition=m.get("competition") or m.get("competitionName") or ""
            # Only these three known Division One South fixtures are within this test scope.
            if (home.casefold(),away.casefold()) not in {
                ("barnstaple town","bristol manor farm"),
                ("hartpury fc","bishops cleeve"),
                ("worcester raiders","melksham town")
            }: continue
            raw=m.get("score") or {}
            score=raw.get("current") if isinstance(raw,dict) else None
            valid=isinstance(score,dict) and type(score.get("home"))==int and type(score.get("away"))==int
            status=str(m.get("status") or "unknown")
            event_fields={k:len(v) if isinstance(v,list) else type(v).__name__ for k,v in m.items() if any(word in k.lower() for word in ("goal","card","sub","event","incident","timeline"))}
            doc.setdefault("eventFieldDiagnostics",{})[home+" v "+away]={"availableFields":sorted(m.keys()),"eventRelatedFields":event_fields}
            doc["eventFieldDiagnostics"][home+" v "+away]["eventSamples"]=[ev for ev in (m.get("events") or [])[:3] if isinstance(ev,dict]]
            doc["matches"].append({"id":str(m.get("_id") or m.get("id") or ""),"home":home,"away":away,"status":status,
                "score":score if valid else None,"scoreVerified":bool(valid and status.lower() not in ("notkickedoff","scheduled")),
                "eventsCount":sum(len(m.get(side+kind,[]) or []) for side in ("home","away") for kind in ("Goals","Cards","Subs"))})
        doc["status"]="ok"
    except Exception as exc:
        doc["error"]=type(exc).__name__+": "+str(exc)[:180]
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(doc["status"],len(doc["matches"]),"other fixtures")
if __name__=="__main__": main()

#!/usr/bin/env python3
"""Create verified, non-destructive programme data exports after official full-time.
No Canva/PDF pages or manually edited programme artwork are changed.
"""
import json
from pathlib import Path
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

BASE=Path("data")
DATES=["2026-11-11","2026-11-14"]
URL="https://tivvy-live-collector.nickabull.workers.dev/live?date="
DETAILS="https://raw.githubusercontent.com/nickabull/Tiverton-Town-Get-Player-Info/main/data.json"

def get(url):
    request=Request(url,headers={"Accept":"application/json","User-Agent":"TivvyProgrammeExporter/1.0"})
    with urlopen(request,timeout=30) as response:return json.load(response)

def save(path,value):
    payload=json.dumps(value,indent=2,ensure_ascii=False)+"\n"
    if path.exists() and path.read_text(encoding="utf-8")==payload:
        print("UNCHANGED",path)
    else:
        path.write_text(payload,encoding="utf-8")
        print("UPDATED",path)

def normal(s):return "".join(c for c in str(s).lower() if c.isalnum())

def main():
    BASE.mkdir(exist_ok=True)
    try:details=get(DETAILS).get("fixtures",[])
    except (HTTPError,URLError,TimeoutError,ValueError) as e:
        details=[]
        print("WARN could not fetch enrichment; official event-only export used",type(e).__name__)
    for date in DATES:
        try:payload=get(URL+date)
        except (HTTPError,URLError,TimeoutError,ValueError) as e:
            print("WARN source unavailable",date,type(e).__name__);continue
        matchday=payload.get("matchday") or {}
        match=matchday.get("featured") or {}
        if matchday.get("date")!=date or matchday.get("status")!="ok" or str(match.get("status","")).lower()!="fulltime":
            print("SKIP not officially full-time",date);continue
        score=match.get("score") or {}
        if not all(isinstance(score.get(k),int) for k in ("home","away")):continue
        venue="H" if normal(match.get("home"))==normal("Tiverton Town") else "A"
        opponent=match.get("away") if venue=="H" else match.get("home")
        if not opponent or (venue=="A" and normal(match.get("away"))!=normal("Tiverton Town")):continue
        events=match.get("events") or []
        stats={"goals":[],"yellowCards":[],"redCards":[],"substitutions":[],"other":[]}
        for e in events:
            kind=str(e.get("eventType",""))
            item={"minute":e.get("minute"),"player":(e.get("person") or {}).get("name"),
                  "teamId":e.get("teamId"),"score":e.get("score"),"eventType":kind}
            if kind.startswith("GOAL"):stats["goals"].append(item)
            elif "YELLOW" in kind:stats["yellowCards"].append(item)
            elif "RED_CARD" in kind:stats["redCards"].append(item)
            elif "SUB" in kind:
                item["off"]=(e.get("personOff") or {}).get("name");stats["substitutions"].append(item)
            else:stats["other"].append(item)
        detail=next((x for x in details if x.get("date")==date and normal(x.get("opponent"))==normal(opponent)),None)
        result={
            "schemaVersion":1,"matchDate":date,"status":"FullTime","verified":True,
            "source":"Southern League public API through Tivvy Live collector",
            "sourceCheckedAt":matchday.get("checkedAt"),
            "sourceMatchUrl":"https://www.southern-football-league.co.uk/match/"+str(match.get("id")),
            "competition":"SLD1S","home":match.get("home"),"away":match.get("away"),
            "score":score,"venueForTiverton":venue,"opponent":opponent,"incidents":stats,
            "lineupsVerified":bool(detail and detail.get("starters")),
            "starters":(detail.get("starterDetails") or []) if detail else [],
            "substitutes":(detail.get("subDetails") or []) if detail else [],
            "editorialReview":{
                "leagueTable":"Obtain verified season standings from Results Centre; do not infer from this one match",
                "resultsMatrix":"Import full season league fixture grid separately",
                "matchReport":"Await Darren's reviewed editorial copy",
                "programmeArtwork":"Never overwritten by this export"}
        }
        save(BASE/("tivvy-programme-postmatch-"+date.replace("-","")+".json"),result)
    # The per-date files remain immutable unless a source correction is published.

if __name__=="__main__":main()

#!/usr/bin/env python3
"""Create verified, non-destructive programme data exports after official full-time.
No Canva/PDF pages or manually edited programme artwork are changed.
"""
import json
from pathlib import Path
from datetime import date, datetime, timedelta, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

BASE=Path("data")
FIXTURES="https://raw.githubusercontent.com/nickabull/Tiverton-Town-Get-Player-Info/main/match-centre-fixtures-2026-27.json"

def fixture_dates(fixtures):
    """Discover recent Tiverton league matchdays without hard-coded dates."""
    today=datetime.now(timezone.utc).date()
    earliest=today-timedelta(days=21)
    dates=set()
    for fixture in fixtures.get("fixtures",[]):
        if fixture.get("competition")!="SLD1S":continue
        try:match_date=date.fromisoformat(fixture["date"])
        except (ValueError,KeyError,TypeError):continue
        if earliest<=match_date<=today:dates.add(match_date.isoformat())
    return sorted(dates)
URL="https://tivvy-live-collector.nickabull.workers.dev/live?date="
DETAILS="https://raw.githubusercontent.com/nickabull/Tiverton-Town-Get-Player-Info/main/data.json"
FWP_RESULTS="https://nickabull.github.io/Tiverton-Town-Get-Results/data.json"

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

def fallback_completed(date, fixtures, published):
    """Completed FWP-backed score only, never fabricated player incidents."""
    scheduled=[f for f in fixtures.get("fixtures",[]) if f.get("date")==date and f.get("competition")=="SLD1S"]
    if len(scheduled)!=1:return None
    fixture=scheduled[0]
    venue=fixture.get("homeAway")
    if venue not in ("A","H"):return None
    home="Tiverton Town" if venue=="H" else fixture.get("opposition")
    away=fixture.get("opposition") if venue=="H" else "Tiverton Town"
    matching=[m for m in published if m.get("date")==date and normal(m.get("home"))==normal(home) and normal(m.get("away"))==normal(away)]
    if len(matching)!=1:return None
    import re
    score=re.fullmatch(r"(\\d+)-(\\d+)",str(matching[0].get("score","")))
    if not score:return None
    hg,ag=map(int,score.groups())
    if hg>30 or ag>30:return None
    return {"home":home,"away":away,"status":"fulltime","score":{"home":hg,"away":ag},
            "events":[],"id":None,"sourceUrl":FWP_RESULTS,
            "sourceName":"Football Web Pages completed results"}


def main():
    BASE.mkdir(exist_ok=True)
    try:details=get(DETAILS).get("fixtures",[])
    except (HTTPError,URLError,TimeoutError,ValueError) as e:
        details=[]
        print("WARN could not fetch enrichment; official event-only export used",type(e).__name__)
    try:fixture_catalogue=get(FIXTURES)
    except (HTTPError,URLError,TimeoutError,ValueError,KeyError) as e:
        raise RuntimeError("Fixture discovery failed; preserving published post-match data") from e
    try:
        source=get(FWP_RESULTS+"?postmatch=1")
        if "footballwebpages.co.uk" not in str(source.get("source","")) or len(source.get("results",[]))<20:
            raise ValueError("Invalid Results Centre feed")
        completed=source["results"]
    except (HTTPError,URLError,TimeoutError,ValueError,KeyError) as e:
        completed=[]
        print("WARN FWP completed-result fallback unavailable",type(e).__name__)
    try:dates=fixture_dates(fixture_catalogue)
    except (HTTPError,URLError,TimeoutError,ValueError,KeyError) as e:
        raise RuntimeError("Fixture discovery failed; preserving published post-match data") from e
    if not dates:
        raise RuntimeError("No recent scheduled league fixtures; check fixture feed")
    for date in dates:
        try:payload=get(URL+date)
        except (HTTPError,URLError,TimeoutError,ValueError) as e:
            print("WARN official source unavailable; checking completed-score fallback",date,type(e).__name__)
            payload={}
        matchday=payload.get("matchday") or {}
        match=matchday.get("featured") or {}
        official=(matchday.get("date")==date and matchday.get("status")=="ok" and
                  str(match.get("status","")).lower().replace(" ","").replace("_","")=="fulltime")
        if not official:
            match=fallback_completed(date,fixture_catalogue,completed)
            if match is None:
                print("SKIP no confirmed completed result",date);continue
            print("FWP COMPLETED RESULT FALLBACK",date)
            existing=BASE/("tivvy-programme-postmatch-"+date.replace("-","")+".json")
            if existing.exists():
                try:
                    old=json.loads(existing.read_text(encoding="utf-8"))
                    if old.get("source")=="Southern League public API through Tivvy Live collector":
                        print("PRESERVE existing richer official incident export",date);continue
                except (OSError,ValueError):pass
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
            "source":("Southern League public API through Tivvy Live collector" if official else "Football Web Pages completed results"),
            "sourceCheckedAt":(matchday.get("checkedAt") if official else datetime.now(timezone.utc).isoformat()),
            "sourceMatchUrl":(match.get("sourceUrl") or ("https://www.southern-football-league.co.uk/match/"+str(match.get("id")))),
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

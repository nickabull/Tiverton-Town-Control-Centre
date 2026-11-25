#!/usr/bin/env python3
"""Publish the official Worker matchday snapshot in the existing tab JSON schema."""
import json
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

COLLECTOR = "https://tivvy-live-collector.nickabull.workers.dev/live"
OUT = Path("data/southern-league-matchday-tabs.json")


def snapshot(requested_date, response):
    matchday = response.get("matchday") or {}
    if (response.get("status") != "ok" or matchday.get("status") != "ok"
            or matchday.get("date") != requested_date or not isinstance(matchday.get("matches"), list)):
        raise ValueError("Collector did not return a verified matchday for " + requested_date)
    checked_at = datetime.fromisoformat(matchday["checkedAt"])
    age = (datetime.now(timezone.utc) - checked_at).total_seconds()
    if not -120 <= age <= 600:
        raise ValueError("Southern League collector snapshot is stale")
    rows = matchday["matches"]
    if matchday.get("featured"):
        rows = [matchday["featured"], *rows]
    matches = []
    unclassified = []
    for row in rows:
        if not row.get("id") or not row.get("home") or not row.get("away"):
            raise ValueError("Collector returned a fixture without an ID or teams")
        score = row.get("score") or {}
        competition = row.get("competition") or "unclassified"
        match = {
            "id": row["id"], "home": row["home"], "away": row["away"],
            "kickoff": row.get("kickoff") or "", "status": row.get("status") or "Unknown",
            "homeScore": score.get("home"), "awayScore": score.get("away"), "competition": competition
        }
        matches.append(match)
        if competition == "unclassified":
            unclassified.append({"home": row["home"], "away": row["away"]})
    return {"date": requested_date, "checkedAt": matchday["checkedAt"], "source": matchday["source"],
            "status": "ok", "matches": matches, "unclassified": unclassified,
            "apiMatches": matchday.get("apiMatchesInspected", len(matches))}


def main():
    requested = (date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1
                 else datetime.now(ZoneInfo("Europe/London")).date()).isoformat()
    try:
        request = Request(COLLECTOR + "?" + urlencode({"date": requested}), headers={"Accept": "application/json"})
        with urlopen(request, timeout=25) as response:
            payload = snapshot(requested, json.load(response))
    except Exception as exc:
        payload = {"date": requested, "checkedAt": datetime.now(timezone.utc).isoformat(),
                   "source": "Southern League public match API via Tivvy Live collector",
                   "status": "error", "matches": [], "unclassified": [], "apiMatches": 0,
                   "error": type(exc).__name__ + ": " + str(exc)[:180]}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Status:", payload["status"], "matches:", len(payload["matches"]))


if __name__ == "__main__":
    main()

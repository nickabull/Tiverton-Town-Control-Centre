#!/usr/bin/env python3
"""Check the next away fixture has a date-specific, researched Match Centre travel guide.

Read only: this does not invent directions, ticket prices or travel times.
GitHub Actions surfaces a failure if an imminent away fixture has no approved guide.
"""
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen

SOURCE = Path("match-centre-expand-trial.html")
FIXTURES = "https://raw.githubusercontent.com/nickabull/Tiverton-Town-Get-Player-Info/main/match-centre-fixtures-2026-27.json"


def normal(name):
    return re.sub(r"[^a-z0-9]", "", str(name).lower())


def next_away(fixtures, today):
    matches = [
        f for f in fixtures if f.get("homeAway") == "A"
        and f.get("date", "") >= today and not f.get("result")
    ]
    return min(matches, key=lambda x: x["date"]) if matches else None


def guide_dates(html):
    start = html.find("const AWAY_GUIDES={")
    end = html.find("\n};", start)
    if start < 0 or end < 0:
        raise ValueError("Away guide registry missing")
    block = html[start:end]
    return {key: day for key, day in re.findall(
        r"\b([a-z][a-z0-9]*):\s*\{\s*date:\s*'([0-9]{4}-[0-9]{2}-[0-9]{2})'",
        block,
    )}


def main():
    now = datetime.now(timezone.utc).date()
    req = Request(FIXTURES, headers={"Accept": "application/json", "User-Agent": "TivvyAwayGuideCheck/1.0"})
    with urlopen(req, timeout=25) as response:
        fixtures = json.load(response)["fixtures"]
    fixture = next_away(fixtures, now.isoformat())
    if not fixture:
        print("PASS: No upcoming away fixtures"); return
    guide = guide_dates(SOURCE.read_text(encoding="utf-8"))
    opponent, day = fixture["opposition"], fixture["date"]
    days = (datetime.strptime(day, "%Y-%m-%d").date() - now).days
    available = guide.get(normal(opponent)) == day
    print(json.dumps({
        "fixture": f"{opponent} v Tiverton Town", "date": day,
        "days_until": days, "approved_travel_guide": available,
        "status": "READY" if available else "REVIEW_REQUIRED",
    }, indent=2))
    if not available and days <= 3:
        print("ERROR: Next away match is within 72 hours without a date-specific travel guide.", file=sys.stderr)
        raise SystemExit(1)
    if not available:
        print("WARNING: Guide still requires research before the 72-hour deadline.")


if __name__ == "__main__":
    main()

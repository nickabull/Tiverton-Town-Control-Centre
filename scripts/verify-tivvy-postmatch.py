#!/usr/bin/env python3
"""Read-only public post-match publication audit; never fabricate match data.

Exit nonzero when a verified completed league fixture has not propagated.
The workflow opens one actionable GitHub Issue instead of depending on a
volunteer to manually inspect all consumer pages after every match.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

PLAYER_ROOT = "https://nickabull.github.io/Tiverton-Town-Get-Player-Info"
RESULTS_ROOT = "https://nickabull.github.io/Tiverton-Town-Get-Results"
PROGRAMME_ROOT = "https://nickabull.github.io/Tiverton-Town-Control-Centre"
LONDON = ZoneInfo("Europe/London")
TIMEOUT = 22


def get(url):
    req = Request(url + ("&" if "?" in url else "?") + "postmatch-audit=1",
                  headers={"User-Agent": "TivvyPostMatchAudit/1.0",
                           "Accept": "application/json"})
    with urlopen(req, timeout=TIMEOUT) as response:
        return json.load(response)


def key(value):
    return re.sub(r"[^a-z0-9]", "", str(value).lower())


def score(value):
    match = re.fullmatch(r"\s*(\d+)\s*[-–]\s*(\d+)\s*", str(value or ""))
    return tuple(map(int, match.groups())) if match else None


def fixture_time(f):
    time = str(f.get("kickOff") or "15:00")
    if not re.fullmatch(r"\d{2}:\d{2}", time):
        time = "15:00"
    return dt.datetime.fromisoformat(f["date"] + "T" + time).replace(tzinfo=LONDON)


def inspect(today=None, source=None):
    now = today or dt.datetime.now(dt.timezone.utc)
    statuses, problems = {}, []
    try:
        schedule = source["schedule"] if source else get(PLAYER_ROOT + "/match-centre-fixtures-2026-27.json")
        league_fixtures = [f for f in schedule.get("fixtures", [])
                           if f.get("competition") == "SLD1S"
                           and f.get("result") and f.get("homeAway") in ("H", "A")
                           and f.get("date")]
        recent = [f for f in league_fixtures if dt.timedelta(0) <=
                  now - fixture_time(f).astimezone(dt.timezone.utc) <= dt.timedelta(days=4)]
        if not recent:
            return {"status": "NO_RECENT_FINAL", "problems": [],
                    "checks": {"fixture": "No recently completed league match"}}
        fixture = max(recent, key=lambda f: (f["date"], f.get("kickOff") or ""))
        day = fixture["date"]
        opponent = fixture["opposition"]
        venue = fixture["homeAway"]
        expected = score(re.sub(r"^[WDL]\s+", "", fixture.get("result", "")))
        if expected is None:
            raise ValueError("Fixture has a final flag but not a parsable score")
        home = "Tiverton Town" if venue == "H" else opponent
        away = opponent if venue == "H" else "Tiverton Town"
        statuses["fixture"] = f"{day} {home} {expected[0]}-{expected[1]} {away}"
        # A safety gate, not a claim to have observed the exact FT whistle:
        # begin checking 2h15 after scheduled kick-off (typical FT + ~15min).
        eligible = now >= fixture_time(fixture).astimezone(dt.timezone.utc) + dt.timedelta(minutes=135)
        if not eligible:
            return {"status": "AWAITING_POSTMATCH_WINDOW", "date": day,
                    "checks": statuses, "problems": []}

        try:
            detail = source["players"] if source else get(PLAYER_ROOT + "/data.json")
            row = next((x for x in detail.get("fixtures", [])
                        if x.get("date") == day and x.get("venue") == venue
                        and key(x.get("opponent")) == key(opponent)), None)
            # Detail result is Tiverton goals-for/goals-against (unlike the fixture home-away result).
            wanted = (expected[1], expected[0]) if venue == "A" else expected
            if not row or score(row.get("result")) != wanted:
                problems.append("Match Centre match details missing or wrong full-time result")
            elif len(row.get("starterDetails") or []) != 11:
                problems.append("Match Centre full XI missing; requires a verified source")
            else:
                statuses["match_centre"] = "FULLTIME + verified Starting XI"
        except Exception as e:
            problems.append(f"Match Centre data unavailable: {e}")

        try:
            results = source["results"] if source else get(RESULTS_ROOT + "/data.json")
            matches = [m for m in results.get("results", [])
                       if m.get("date") == day and key(m.get("home")) == key(home)
                       and key(m.get("away")) == key(away)]
            if len(matches) != 1 or score(matches[0].get("score")) != expected:
                problems.append("Results Centre missing latest verified result; results matrix will be stale")
            else:
                statuses["results_matrix"] = "Matching published result"
            if len(results.get("leagueTable") or []) != 22:
                problems.append("Results Centre league table incomplete or unavailable")
            else:
                # A current table must come from a newly built result feed, not a historical fallback.
                updated = results.get("updated") or ""
                match = re.search(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", updated)
                if not match:
                    problems.append("League table lacks a parseable publication timestamp")
                else:
                    stamp = dt.datetime.fromisoformat(match.group()).replace(tzinfo=dt.timezone.utc)
                    if stamp <= fixture_time(fixture).astimezone(dt.timezone.utc):
                        problems.append("Published league table predates kick-off")
                    else:
                        statuses["league_table"] = "22 clubs, rebuilt after kick-off"
        except Exception as e:
            problems.append(f"Results Centre data unavailable: {e}")

        try:
            prog = source["programme"] if source else get(
                PROGRAMME_ROOT + "/data/tivvy-programme-postmatch-" + day.replace("-", "") + ".json")
            if prog.get("matchDate") != day or not prog.get("verified") or prog.get("status") != "FullTime":
                problems.append("Programme Centre verified full-time export missing or unverified")
            elif prog.get("score") != {"home": expected[0], "away": expected[1]}:
                problems.append("Programme Centre score disagrees with fixture")
            else:
                statuses["programme"] = "Verified published full-time export"
        except Exception as e:
            problems.append(f"Programme Centre post-match export unavailable: {e}")

        # This validates published GitHub sources, not classic Wix editor iframe HTML
        # or native Canva page contents. These need separate end-to-end browser QA.
        statuses["not_checked"] = "Wix embed and native Canva pages"
        return {"status": "PASS" if not problems else "REVIEW_REQUIRED",
                "date": day, "opponent": opponent, "checks": statuses, "problems": problems}
    except Exception as e:
        return {"status": "AUDIT_ERROR", "checks": statuses,
                "problems": ["Unable to perform postmatch audit: " + str(e)]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="postmatch-audit.json")
    args = parser.parse_args()
    report = inspect()
    Path(args.output).write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    if report["status"] not in ("PASS", "NO_RECENT_FINAL", "AWAITING_POSTMATCH_WINDOW"):
        raise SystemExit(1)


if __name__ == "__main__":
    main()

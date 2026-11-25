#!/usr/bin/env python3
"""Freeze verified Tivvy full-time snapshots without modifying earlier archives."""
import argparse
import hashlib
import json
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

COLLECTOR = "https://tivvy-live-collector.nickabull.workers.dev"
DATA = Path("data")
ARCHIVE = Path("live/archive")
LONDON = ZoneInfo("Europe/London")


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def fetch(endpoint, match_date):
    request = Request(f"{COLLECTOR}/{endpoint}?" + urlencode({"date": match_date}),
                      headers={"Accept": "application/json"})
    with urlopen(request, timeout=20) as response:
        return json.load(response)


def canonical_name(name):
    return re.sub(r"[^a-z0-9]", "", re.sub(r"\b(?:afc|fc)\b", "", str(name).lower()))


def final(status):
    return re.sub(r"[^a-z]", "", str(status).lower()) == "fulltime"


def qualified(report, match_date):
    return report.get("verified") is True and report.get("matchDate") == match_date and final(report.get("status"))


def verify_match(report, live):
    match_date = report["matchDate"]
    matchday = live.get("matchday") or {}
    fixture = matchday.get("featured") or {}
    if live.get("status") != "ok" or matchday.get("status") != "ok" or matchday.get("date") != match_date:
        raise ValueError("official matchday unavailable")
    match_id = urlsplit(report["sourceMatchUrl"]).path.rstrip("/").split("/")[-1]
    if fixture.get("id") != match_id or not re.fullmatch(r"[0-9a-f]{24}", match_id):
        raise ValueError("official fixture ID does not match verified export")
    if any(canonical_name(fixture.get(side)) != canonical_name(report.get(side)) for side in ("home", "away")):
        raise ValueError("official teams do not match verified export")
    score = fixture.get("score") or {}
    if (not final(fixture.get("status")) or score != report.get("score")
            or any(type(score.get(side)) is not int or score[side] < 0 for side in ("home", "away"))):
        raise ValueError("official full-time score does not match verified export")
    return matchday, fixture


def on_matchday(post, match_date):
    try:
        ts = datetime.fromisoformat(post["createdAt"].replace("Z", "+00:00"))
        return ts.tzinfo is not None and ts.astimezone(LONDON).date().isoformat() == match_date
    except (KeyError, AttributeError, ValueError):
        return False


def revision(fixture, report):
    events = []
    for event in fixture.get("events", []):
        events.append({key: event.get(key) for key in ("eventType", "minute", "phase", "teamId", "score")}
                      | {"player": (event.get("person") or {}).get("name"),
                         "playerOff": (event.get("personOff") or {}).get("name")})
    facts = {"score": fixture["score"], "events": events, "lineupsVerified": report.get("lineupsVerified"),
             "starters": report.get("starters"), "substitutes": report.get("substitutes")}
    return hashlib.sha256(json.dumps(facts, sort_keys=True).encode()).hexdigest()[:16]


def archive_match(report):
    match_date = report["matchDate"]
    live = fetch("live", match_date)
    matchday, fixture = verify_match(report, live)
    existing = sorted(path for path in ARCHIVE.glob(match_date + "-*") if path.is_dir())
    if len(existing) > 1:
        raise ValueError("multiple archive folders for the same date")
    directory = existing[0] if existing else ARCHIVE / f"{match_date}-{fixture['id']}"
    out = directory / f"collector-{revision(fixture, report)}.json"
    if out.exists():
        print(match_date, "official revision already archived", out)
        return

    audit = fetch("log", match_date)
    if audit.get("status") != "ok" or audit.get("date") != match_date:
        raise ValueError("collector audit was not available for this fixture date")
    x = live.get("x") or {}
    posts = [post for post in (x.get("posts") or []) if on_matchday(post, match_date)]
    snapshot = {
        "schemaVersion": 1, "matchDate": match_date,
        "archivedAt": datetime.now(timezone.utc).isoformat(), "sourceCheckedAt": matchday.get("checkedAt"),
        "officialFixture": fixture, "verifiedPostmatch": report,
        "audit": audit, "clubX": {"status": x.get("state") or "unavailable",
                                    "checkedAt": x.get("checkedAt"), "postsOnMatchDate": posts}
    }
    directory.mkdir(parents=True, exist_ok=True)
    with out.open("x", encoding="utf-8") as stream:
        json.dump(snapshot, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    print(match_date, "archived", fixture["id"], "with", len(posts), "date-matched club X posts", out)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--date", type=date.fromisoformat, help="archive a single verified historical fixture")
    args = parser.parse_args()
    today = datetime.now(LONDON).date()
    recent = (args.date,) if args.date else tuple(today - timedelta(days=i) for i in range(7))
    failures = []
    for day in recent:
        match_date = day.isoformat()
        path = DATA / f"tivvy-programme-postmatch-{day:%Y%m%d}.json"
        if not path.exists() and not args.date:
            continue
        try:
            report = read_json(path)
            if qualified(report, match_date):
                archive_match(report)
            elif args.date:
                raise ValueError("no verified full-time export for this date")
        except (KeyError, ValueError, OSError) as exc:
            failures.append(f"{match_date}: {exc}")
    if failures:
        raise SystemExit("Archive incomplete: " + "; ".join(failures))


if __name__ == "__main__":
    main()

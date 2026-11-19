#!/usr/bin/env python3
"""Read-only Southern League API diagnostics; does not publish match data."""
import json
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from pathlib import Path

API = "https://api.southern-football-league.co.uk/matches"
DATES = ("2026-11-10", "2026-11-14", "2026-11-19", "2026-11-21")
HEADERS = {
    "Accept": "application/json", "X-TENANT-ID": "sfl",
    "Origin": "https://www.southern-football-league.co.uk",
    "Referer": "https://www.southern-football-league.co.uk/live",
    "User-Agent": "Mozilla/5.0 (compatible; TivvyMatchday/1.0)",
}

def probe(date, limit, with_events):
    query = urlencode({"withEvents":with_events, "period": "Custom",
        "startDate": date+"T00:00:00.000Z", "endDate": date+"T23:59:59.999Z",
        "limit": limit, "status": "any"})
    row = {"date": date, "limit": limit, "withEvents": with_events,
           "httpStatus": None, "ok": False, "itemCount": None, "error": None}
    try:
        with urlopen(Request(API+"?"+query, headers=HEADERS), timeout=18) as response:
            row["httpStatus"] = response.status
            doc = json.load(response)
            if isinstance(doc, dict) and isinstance(doc.get("items"), list):
                row["ok"] = True
                row["itemCount"] = len(doc["items"])
            else:
                row["error"] = "Unexpected JSON match schema"
    except HTTPError as exc:
        row["httpStatus"] = exc.code
        row["error"] = "HTTP " + str(exc.code)
    except (URLError, TimeoutError, ValueError) as exc:
        row["error"] = type(exc).__name__ + ": " + str(exc)[:180]
    return row

def main():
    rows = [probe(date, limit, events) for date in DATES
            for limit, events in ((1000, 1), (100, 1), (100, 0))]
    report = {"checkedAt":datetime.now(timezone.utc).isoformat(),
              "endpoint":API, "readOnly":True, "results":rows}
    Path("diagnostics").mkdir(exist_ok=True)
    Path("diagnostics/southern-league-api-probe.json").write_text(
        json.dumps(report, indent=2)+"\n", encoding="utf-8")
    for row in rows:
        print(row["date"], "limit", row["limit"], "events", row["withEvents"],
              "HTTP", row["httpStatus"], "matches", row["itemCount"],
              row["error"] or "OK")
    if not any(row["ok"] for row in rows):
        raise SystemExit("All Southern League test queries failed; inspect diagnostic artifact")

if __name__ == "__main__":
    main()

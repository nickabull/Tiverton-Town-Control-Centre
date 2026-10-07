#!/usr/bin/env python3
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

URLS = {
    "division_overview_www": "https://www.southern-football-league.co.uk/overview/divonesouth",
    "division_overview_slc": "https://slc-www.southern-football-league.co.uk/overview/divonesouth",
    "tiverton_club": "https://www.southern-football-league.co.uk/clubs/tiverton-town",
}

CHECKS = [
    "Division One South",
    "Tiverton Town",
    "Hartpury",
    "Fixtures",
    "Results",
    "Player Stats",
]

def fetch(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; TivertonTownControlCentre/1.0)"
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read().decode("utf-8", errors="replace")
        return r.status, body

def main():
    out = {
        "checked_at_utc": datetime.now(timezone.utc).isoformat(),
        "sources": {}
    }
    for name, url in URLS.items():
        entry = {"url": url}
        try:
            status, body = fetch(url)
            entry["http_status"] = status
            entry["bytes"] = len(body.encode("utf-8"))
            entry["contains"] = {s: (s.lower() in body.lower()) for s in CHECKS}
            entry["looks_js_heavy"] = bool(
                re.search(r"__NEXT_DATA__|/_next/|webpack|hydration|react", body, re.I)
            )
            entry["contains_hartpury_result_3_1"] = bool(
                re.search(r"Tiverton Town.{0,500}3\s*[-–]\s*1.{0,500}Hartpury", body, re.I | re.S)
            )
        except Exception as e:
            entry["error"] = repr(e)
        out["sources"][name] = entry

    Path("data").mkdir(parents=True, exist_ok=True)
    Path("data/source-probe.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(out, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()

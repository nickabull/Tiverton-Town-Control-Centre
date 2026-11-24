#!/usr/bin/env python3
"""Offline regression test for full-time publication gate."""
import datetime as dt
import importlib.util
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "scripts" / "verify-tivvy-postmatch.py"
spec = importlib.util.spec_from_file_location("postmatch", path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
now = dt.datetime(2026, 11, 24, 0, 0, tzinfo=dt.timezone.utc)
fixture = {"date": "2026-11-23", "kickOff": "19:45", "opposition": "Swindon Supermarine",
           "homeAway": "A", "competition": "SLD1S", "result": "L 1-0"}
data = {"schedule": {"fixtures": [fixture]},
        "players": {"fixtures": [{"date": "2026-11-23", "venue": "A",
            "opponent": "Swindon Supermarine", "result": "0-1",
            "starterDetails": [{"name": "Player " + str(n)} for n in range(11)]}]},
        "results": {"updated": "2026-11-23 23:00:00 UTC",
            "results": [{"date": "2026-11-23", "home": "Swindon Supermarine",
                         "away": "Tiverton Town", "score": "1-0"}],
            "leagueTable": [{"team": "Team " + str(n)} for n in range(22)]},
        "programme": {"matchDate": "2026-11-23", "verified": True,
            "status": "FullTime", "score": {"home": 1, "away": 0}}}
assert mod.score(" 1-0 ") == (1,0)
assert mod.score("0–1") == (0,1)
assert mod.inspect(now, data)["status"] == "PASS", mod.inspect(now, data)
data["programme"]["verified"] = False
report = mod.inspect(now, data)
assert report["status"] == "REVIEW_REQUIRED" and any("Programme" in q for q in report["problems"])
del data["results"]["results"][0]
report = mod.inspect(now, data)
assert any("results matrix" in q for q in report["problems"])
print("Post-match audit regression tests PASS")

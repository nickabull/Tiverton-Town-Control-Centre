#!/usr/bin/env python3
"""Non-publication smoke tests for signed-in Facebook transcription workflow."""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "publish-manual-facebook-post.py"
for page, date_scoped_fetch in {
    "tivvy-live-tv.html": 'fetch("data/tivvy-manual-facebook-"+date+".json',
    "tivvy-live-saturday-test.html": 'grab("tivvy-manual-facebook-"+EXPECTED_DATE+".json")',
}.items():
    html = (ROOT / page).read_text()
    assert "manualFacebookPosts" in html, page
    assert date_scoped_fetch in html, page
    assert "facebook-manual" in html, page
scratch = (ROOT / "tivvy-facebook-scratchpad.html").read_text()
assert "issues/new?" in scratch and "SUBMIT COMMENTARY" in scratch

with tempfile.TemporaryDirectory() as tmp:
    base = Path(tmp)
    event = base / "event.json"
    def invoke(login, issue_id):
        event.write_text(json.dumps({"issue": {
            "number": issue_id, "title": "[TIVVY FB] 2026-11-23",
            "user": {"login": login}, "created_at": "2026-11-23T19:52:00Z",
            "body": "DATE: 2026-11-23\nTIME: 19:51\nAUTHOR: Darren · Facebook Fans group\nTEXT:\nGreat save by the keeper!",
        }}))
        env = {**os.environ, "GITHUB_EVENT_PATH": str(event)}
        return subprocess.run([sys.executable, str(SCRIPT)], cwd=base, env=env,
                              capture_output=True, text=True, check=True)
    invoke("not-authorised", 1)
    assert not (base / "data/tivvy-manual-facebook-2026-11-23.json").exists()
    invoke("nickabull", 2)
    dest = base / "data/tivvy-manual-facebook-2026-11-23.json"
    items = json.loads(dest.read_text())["posts"]
    assert len(items) == 1 and items[0]["source"] == "facebook-manual"
    assert items[0]["text"] == "Great save by the keeper!"
    invoke("nickabull", 2)
    assert len(json.loads(dest.read_text())["posts"]) == 1
    # Saturday QuickPost must create a separate Hartpury feed, never modify Swindon.
    event.write_text(json.dumps({"issue": {
        "number": 120, "title": "[TIVVY FB] 2026-11-28",
        "user": {"login": "nickabull"}, "created_at": "2026-11-28T15:03:00Z",
        "body": "DATE: 2026-11-28\nTIME: 15:02\nAUTHOR: Darren · Facebook Fans group\nTEXT:\nHartpury commentary test",
    }}))
    env = {**os.environ, "GITHUB_EVENT_PATH": str(event)}
    subprocess.run([sys.executable, str(SCRIPT)], cwd=base, env=env,
                   capture_output=True, text=True, check=True)
    saturday = base / "data/tivvy-manual-facebook-2026-11-28.json"
    assert json.loads(saturday.read_text())["posts"][0]["text"] == "Hartpury commentary test"
    assert len(json.loads(dest.read_text())["posts"]) == 1
    # Unsupported dates never create another JSON feed.
    event.write_text(json.dumps({"issue": {
        "number": 121, "title": "[TIVVY FB] 2026-12-05",
        "user": {"login": "nickabull"}, "created_at": "2026-12-05T15:03:00Z",
        "body": "DATE: 2026-12-05\nTIME: 15:02\nAUTHOR: Darren\nTEXT:\nInvalid fixture",
    }}))
    subprocess.run([sys.executable, str(SCRIPT)], cwd=base, env=env,
                   capture_output=True, text=True, check=True)
    assert not (base / "data/tivvy-manual-facebook-2026-12-05.json").exists()
print("Manual Facebook feed smoke tests PASS")

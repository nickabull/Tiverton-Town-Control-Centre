#!/usr/bin/env python3
"""Publish an approved matchday Facebook transcription from an authorised issue.

Never mutate official Southern League or X source fields. One entry per issue ID.
"""
import datetime as dt
import json
import os
import re
import sys
from pathlib import Path

# Only confirmed fixtures may be published; avoid arbitrary file paths.
ALLOWED_MATCH_DATES = {"2026-11-23", "2026-11-28"}
REQUIRED_AUTHOR = "nickabull"


def main():
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    issue = event.get("issue") or {}
    user = (issue.get("user") or {}).get("login", "")
    if user.lower() != REQUIRED_AUTHOR:
        print("Ignoring unauthorised issue author", file=sys.stderr)
        return
    title_match = re.fullmatch(r"\[TIVVY FB\] (\d{4}-\d{2}-\d{2})", str(issue.get("title", "")).strip())
    if not title_match or title_match.group(1) not in ALLOWED_MATCH_DATES:
        print("Ignoring unrelated or unsupported match date")
        return
    match_date = title_match.group(1)
    dest = Path("data/tivvy-manual-facebook-" + match_date + ".json")
    body = str(issue.get("body") or "")
    m = re.fullmatch(
        r"DATE: (\d{4}-\d{2}-\d{2})\nTIME: (\d{2}:\d{2})\nAUTHOR: ([^\n]{1,75})\nTEXT:\n([\s\S]{1,3000})",
        body.strip(),
    )
    if not m:
        raise ValueError("Unexpected message format; no data changed")
    date, time, author, content = m.groups()
    if date != match_date:
        raise ValueError("Wrong match date")
    hour, minute = (int(v) for v in time.split(":"))
    if hour > 23 or minute > 59:
        raise ValueError("Invalid time")
    date_obj = dt.datetime.fromisoformat(date)
    if date_obj.strftime("%Y-%m-%d") != date:
        raise ValueError("Invalid date")
    text = content.strip()
    if not text:
        raise ValueError("Empty message")
    item = {
        "id": "facebook-manual-" + str(issue["number"]),
        "source": "facebook-manual",
        "author": author.strip(),
        "text": text,
        "createdAt": date + "T" + time + ":00Z",
        "submittedAt": issue.get("created_at") or issue.get("createdAt"),
        "issue": issue["number"],
        "media": [],
    }
    if dest.exists():
        data = json.loads(dest.read_text())
    else:
        data = {"schema": "tivvy.manual-facebook.v1", "date": match_date, "posts": []}
    posts = data["posts"]
    if any(p.get("id") == item["id"] for p in posts):
        print("Already published issue", issue["number"])
        return
    posts.append(item)
    posts.sort(key=lambda p: p["createdAt"], reverse=True)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print("Published", item["id"], "to", dest)


if __name__ == "__main__":
    main()

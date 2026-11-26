#!/usr/bin/env python3
"""Summarise booking counts and check exact campaign labels without exporting customer details."""

import argparse
import getpass
import json
import os
import sys
from datetime import datetime
from urllib.error import URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

API = "https://api.ticketsource.io"
LONDON = ZoneInfo("Europe/London")


def records(path, key):
    page = 1
    while True:
        query = urlencode({"per_page": 100, "page": page})
        request = Request(
            f"{API}{path}?{query}",
            headers={"Authorization": f"Bearer {key}", "Accept": "application/json"},
        )
        with urlopen(request, timeout=20) as response:
            payload = json.load(response)
        yield from payload["data"]
        if not payload["links"]["next"]:
            return
        page += 1


def summarise(event_name, labels, fetch):
    event_matches = [
        event for event in fetch("/events")
        if event["attributes"]["name"].strip().casefold() == event_name.casefold()
    ]
    if len(event_matches) != 1:
        raise ValueError(f"Expected one event called {event_name!r}, found {len(event_matches)}.")
    event_id = quote(event_matches[0]["id"], safe="")
    dates = sorted(
        fetch(f"/events/{event_id}/dates"), key=lambda date: date["attributes"]["start"]
    )
    for date in dates:
        date_id = quote(date["id"], safe="")
        start = datetime.fromisoformat(date["attributes"]["start"]).astimezone(LONDON)
        counts = dict.fromkeys(labels, 0)
        total = 0
        for booking in fetch(f"/dates/{date_id}/bookings"):
            total += 1
            booked_by = booking["attributes"].get("user_booked_by")
            if isinstance(booked_by, str) and booked_by in counts:
                counts[booked_by] += 1
        labels_text = ", ".join(f"{label}={count}" for label, count in counts.items())
        status = " [cancelled]" if date["attributes"].get("cancelled") else ""
        print(f"{start:%a %d %b %Y %H:%M %Z}{status} | booking records={total} | {labels_text}")
    if not dates:
        print("No performances returned.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--event", default="The Great British Bake Off Musical")
    parser.add_argument("--labels", nargs="+", default=["BakeOffFacebook", "BakeOffInstagram"])
    args = parser.parse_args()
    key = os.environ.get("TICKETSOURCE_API_KEY") or getpass.getpass("TicketSource API key: ")
    if not key.strip():
        parser.error("A TicketSource API key is required.")
    try:
        summarise(args.event.strip(), args.labels, lambda path: records(path, key.strip()))
    except (URLError, ValueError, KeyError) as error:
        print(f"TicketSource check failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

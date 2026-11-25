#!/usr/bin/env python3
"""Two verified Tivvy email notices, with persistent GitHub Issue deduplication.

Requires GitHub Actions GH_TOKEN (issues:write) and secrets
TIVVY_SMTP_USER, TIVVY_SMTP_APP_PASSWORD. No credentials in source or logs.
This script deliberately never claims Wix/Canva updates were checked.
"""
import argparse
import datetime as dt
import email.message
import json
import os
from pathlib import Path
import smtplib
import subprocess
import sys

RECIPIENT = "nickabull@gmail.com"
ROOT = "https://nickabull.github.io/Tiverton-Town-Control-Centre"

def gh(*args):
    return subprocess.check_output(["gh", *args], text=True).strip()

def issue_exists(title):
    raw = gh("issue", "list", "--state", "all", "--limit", "200", "--json", "title")
    return title in {item["title"] for item in json.loads(raw)}

def send(subject, content):
    user = os.getenv("TIVVY_SMTP_USER", "").strip()
    password = os.getenv("TIVVY_SMTP_APP_PASSWORD", "").strip()
    if not user or not password:
        raise RuntimeError("Email disabled: missing TIVVY_SMTP_USER or TIVVY_SMTP_APP_PASSWORD GitHub secret")
    msg = email.message.EmailMessage()
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = RECIPIENT
    msg.set_content(content)
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=25) as client:
        client.login(user, password)
        client.send_message(msg)

def mark_sent(title, body):
    gh("issue", "create", "--title", title, "--body", body)

def recent_day(day):
    date = dt.date.fromisoformat(day)
    age = (dt.datetime.now(dt.timezone.utc).date() - date).days
    return 0 <= age <= 4

def report_notice(day):
    if not recent_day(day):
        print("Skipping old or future fixture", day)
        return
    path = Path("match-facts") / (day + ".html")
    export = Path("data") / ("tivvy-programme-postmatch-" + day.replace("-", "") + ".json")
    if not path.is_file() or not export.is_file():
        print("HTML / verified export not yet present")
        return
    data = json.loads(export.read_text())
    if data.get("matchDate") != day or not data.get("verified") or data.get("status") != "FullTime":
        print("Export not verified full-time; no notice")
        return
    title = "[TIVVY EMAIL SENT] Match HTML " + day
    if issue_exists(title):
        print("Report email previously recorded", day)
        return
    url = ROOT + "/match-facts/" + day + ".html"
    message = ("Tivvy match-report HTML has been generated in GitHub and is ready to review.\n\n"
               + "Match date: " + day + "\nHTML: " + url + "\n\n"
               + "This does NOT mean it has been pasted into Wix or Canva.\n")
    send("Tivvy Live: match-report HTML ready — " + day, message)
    mark_sent(title, message)
    print("Match HTML email sent and recorded", day)

def audit_notice(filename):
    audit = json.loads(Path(filename).read_text())
    if audit.get("status") != "PASS" or not audit.get("date"):
        print("Audit is not PASS; no completion email")
        return
    day = audit["date"]
    if not recent_day(day):
        print("Skipping old audit", day)
        return
    required = ("match_centre", "results_matrix", "league_table", "programme")
    checks = audit.get("checks") or {}
    if not all(checks.get(k) for k in required):
        print("Missing required audit checks; no completion email")
        return
    title = "[TIVVY EMAIL SENT] Postmatch published sources " + day
    if issue_exists(title):
        print("Postmatch audit email previously recorded", day)
        return
    message = ("Tivvy post-match GitHub source checks PASS for " + day + ".\n\n"
               + "\n".join(k.replace("_", " ").title() + ": " + str(checks[k]) for k in required)
               + "\n\nWix Editor embeds and Canva pages have NOT been verified. "
                 "Please review those separately.\n")
    send("Tivvy Live: published post-match checks passed — " + day, message)
    mark_sent(title, message)
    print("Postmatch audit email sent and recorded", day)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--report-date")
    parser.add_argument("--audit-file")
    args = parser.parse_args()
    if bool(args.report_date) == bool(args.audit_file):
        parser.error("Provide exactly one of --report-date or --audit-file")
    if args.report_date:
        report_notice(args.report_date)
    else:
        audit_notice(args.audit_file)

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("Notification failed:", exc, file=sys.stderr)
        sys.exit(1)

# Tivvy Editorial Inbox — operator setup and handover

## Live links
- [Programme Studio](https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-studio.html)
- [Editorial Inbox](https://nickabull.github.io/Tiverton-Town-Control-Centre/editorial-inbox.html)

## What is operational (7 November 2026)
- Gmail can be searched and Word attachments extracted by the connected ChatGPT Gmail tools, as demonstrated with Darren's raw and corrected reports.
- Editorial Inbox: browser .docx import; unchanged original retained; editable working text; categorized rule-based findings; per-finding correction/ignore; corrections log; user approval; approved text and Wix-compatible HTML export.
- The approved snapshot is shared through localStorage with Programme Studio at the same GitHub Pages origin. Use Studio > Editorial · Report / Preview > Content & Data to select the article and page.
- Programme Studio retains the earlier page-specific controls, Page 17 live feed, grey editorial warning, and User Guide.
- Data remains local to the browser. Download both Studio and Inbox backups before clearing browser storage or changing computers.

## One-time optional direct Gmail connection
This is a setup task for someone with access to the Google account and Google Cloud Console. It is NOT yet activated by a repository commit.

1. Open Google Cloud Console and create/select a project controlled by Tiverton Town FC/the authorised operator.
2. Enable **Gmail API** for that project.
3. Configure the OAuth consent screen; add the operator's Google account as a test user if the project is in testing mode. Add Gmail read-only permission `https://www.googleapis.com/auth/gmail.readonly`. This permission can require Google's additional verification for broader public distribution.
4. Create an OAuth **Web application** client. Under **Authorised JavaScript origins**, add `https://nickabull.github.io` (the origin only; no path).
5. Open the Editorial Inbox, expand **Connect Gmail directly**, paste the OAuth client ID, choose **Connect Gmail securely**, select the correct Google account and approve read-only access.
6. Review the Gmail query and click **Import new Word attachments**. Duplicates from the same Gmail message and filename are skipped.
7. Review flags and approve the corrected copy. Open Studio on the same browser and choose the article in the Editorial page controls.

The browser's OAuth access token is held in memory and is not embedded in GitHub source, saved to localStorage, or written to the local JSON backup. A Google OAuth Web Client ID is public identification, **not** a password. The direct Gmail import does not use or expose the ChatGPT connector's credentials.

**Important:** Browser import works only while the operator is using the page; it does not keep watching Gmail when the browser is closed. Truly unattended arrival, a shared multi-user editorial inbox, and a full production publishing pipeline require a dedicated authenticated backend or scheduled server job with appropriately restricted access. Do not attempt unofficial WhatsApp scraping.

## Production safeguards
- Keep the raw original unchanged and available for comparison.
- Separate definite mistakes, verification questions, and optional style edits. Preserve Darren Holmes' tone and obtain editorial approval.
- The factual information in opponents' histories and player stats needs independent verification. The rules-based checker is not a complete professional proofreader.
- Approved snapshots do **not** publish directly to the club's Wix website; export is for drafting. Nothing should go live without explicit sign-off.
- The Studio article A4 view is a flowing prototype. It does not yet match the final multi-page report layout, and it currently prints one selected proof page at a time.
- Existing PDF issues must remain immutable after publication.
- Never put raw/unapproved reports, Gmail OAuth tokens, or confidential source attachments into this public GitHub Pages repository.
- Local browser storage is not encrypted and can be cleared by the browser. Regular backup/export matters.

## Editor's matchday checklist
1. Receive Darren's preview and report (the normal arrivals may be on different days).
2. Import the Word document; confirm fixture and attribution.
3. Review the red/amber/grey issues, checking player names and club facts.
4. Approve copy and verify the exact approved snapshot.
5. Select the article in Studio, review each A4 flow page, and complete artwork/photo credits.
6. Build the Wix draft from the exported approved HTML; confirm the article appears correctly.
7. Get final editorial sign-off; only then publish.
8. Download an Inbox backup and Studio edition backup.

## Technical keys and deployment
- GitHub Pages files: `editorial-inbox.html`, `programme-studio.html`
- Inbox localStorage key: `tivvy-editorial-inbox-v1`
- Approved bridge: `tivvy-editorial-approved-v1`
- Studio state key: `tivvy-programme-studio-v02`
- Gmail OAuth client ID storage key: `tivvy-editorial-gmail-client-v1`
- Word extraction in browser: pinned Mammoth library `1.13.0`, client-side.

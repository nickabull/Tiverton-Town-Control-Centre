# TIVVY LIVE — PROJECT HANDOVER
**Last updated:** 16 November 2026 (UK)  
**Strand:** Live alerts / television ticker / match-centre matchday feeds  
**Next test match:** Melksham Town v Tiverton Town, Saturday 21 November 2026, 15:00 (UK). **Scope:** automatic rolling coverage of every future Tivvy match.  
**Status:** Front-end dates/fixture reset in GitHub. Live collector and new external feed integrations **not yet end-to-end verified**.

> This document is the dedicated handover for Tivvy Live. The repository root `PROJECT-HANDOVER.md` already exists and covers the wider programme/editor work; do not overwrite it. Keep this file current after every live-ticker change, test, deployment, source decision or outstanding issue.

## 1. Objective
Create a reliable, attractive, automatically refreshing Tiverton Town matchday experience for both a conventional live match-centre page and an unattended full-screen 16:9 TV / Raspberry Pi / sports-bar view. Show the featured Tivvy game, verified scoring and incidents, relevant official club X posts and scores/fixtures for all four Southern League divisions. Support Saturday **and midweek** games, pre-match fixture information, live updates and historic replay/auditing. Preserve the established UI; do not undertake a redesign while integrating feeds.

Public Wix test page supplied by user:
- https://www.tivertontownfc.uk/live-alerts-tivvy-test-page

## 1A. PERMANENT AUTOMATION — EVERY TIVERTON TOWN MATCH (critical correction, 16 Nov 2026)
**Melksham is only the next integration test, NOT a one-off reset.** User's explicit requirement is an end-to-end rolling system that automatically discovers, schedules, prepares, runs, archives and publishes **every subsequent Tiverton Town match** without an assistant manually editing the date, fixture, hard-coded lists, static JSON filenames or links after each game.

Required lifecycle:
1. **Discover fixtures:** continuously/recurrently ingest current-season Tiverton fixtures from official Southern League / approved FootballWebPages sources, with competition, stable fixture ID, home/away, kickoff in Europe/London, venue, postponements, reschedules, cancellations, and new fixtures. Cover league Saturday, midweek, FA Cup, FA Trophy and other relevant cups where feeds permit. A cup without a live-event feed may still be included in fixture/archive schedule with transparent limitations; removal of the broken FA Trophy *live tab* is not removal of Tivvy cup games.
2. **Prepare automatically:** detect the next fixture, create per-fixture data and archive location, set featured fixture/timeline/scoreboard/countdown/X filters and next match display; fetch all other Southern League fixtures for the calendar day into each of the four division tabs (including midweek). Use dynamic date/fixture IDs instead of present hard-coded `2026-11-21` defaults. Match data should start appearing ahead of kick-off as soon as sources publish it; participant club names are different from confirmed line-ups.
3. **Live operation:** match-aware active/standby polling, 20-second target for verified football events, source health, official X integration and deduplicated same-minute commentary. Keep existing exact visual rules. Observe and audit goals/cards/substitutions/score changes, corrections, outages and match statuses; avoid inaccurate claims of verified data.
4. **Finalise:** upon a trustworthy full-time signal, reconcile final score/events with authoritative source, handle late corrections, mark official/verified status, produce immutable historical snapshots or versioned event history; never silently overwrite earlier records.
5. **Archive & Match Centre:** each match gets a permanent stable URL/ID; automatically publish result, incident timeline, X posts, source attribution, archived replay and (when available) lineups and club report link to Tivvy Match Centre/Last Result and match-by-match archive. Update home page Next Match / Last Result and wider match-centre/player-stats data pipeline if verified data is supported. Avoid creating duplicate entries for postponed/rearranged fixtures. Need to inspect **Tiverton-Town-Get-Player-Info** / **Tiverton-Town-Get-Results** and any Wix embed / Match Centre code before selecting archive integration points; this downstream integration has **not** been implemented in the present task.
6. **Roll forward:** automatically feature the next future game after the previous is finalised/archived; keep historical date overrides for replay and avoid broken old-date links. Allow a manual administrative override for errors, postponements, date changes and data-provider gaps with audit trail.
7. **Observability and alerts:** persist collection timestamps, sources, data quality and changes in collector log; send match-ready, stale-feed, discrepancy and archive-complete alerts only when explicitly configured. Recover after interrupted collectors.
8. **Testing:** test consecutive fixtures (including league midweek, cup, postponed and rearranged) plus season/date rollover; demonstrate that no manual GitHub HTML edits are required between games.

**Implementation status:** This is the committed PRODUCT REQUIREMENT, **not** a statement that automation currently runs. The 16 Nov code changes only hard-code Melksham for a single next test. Replace those hard-coded assumptions with a robust fixture registry/current-featured match service. The engine should drive **both** live displays and the permanent Match Centre from the same fixture record. Establish stable cross-source match IDs / aliases, source permissions, scheduling/retention policy, audit and safe publication workflow. Do not claim this is complete until backend, frontends and archive all pass an end-to-end multi-match test.

## 2. Code, live URLs and ownership
GitHub repo: https://github.com/nickabull/Tiverton-Town-Control-Centre (main branch)
- `tivvy-live-tv.html` — fixed 16:9 no-scroll broadcast display. https://nickabull.github.io/Tiverton-Town-Control-Centre/tivvy-live-tv.html?date=2026-11-21
- `tivvy-live-saturday-test.html` — main multi-tab live match centre with featured match timeline + right-hand league fixture panel. https://nickabull.github.io/Tiverton-Town-Control-Centre/tivvy-live-saturday-test.html
- `tivvy-live-log.html` — read-only collector/audit view, date selector, events, checks and CSV export. https://nickabull.github.io/Tiverton-Town-Control-Centre/tivvy-live-log.html
- `project-hub.html` — hub; its Tivvy Live TV link was observed pointing to 14 Nov and requires date-link update.
- Collector endpoint referenced by pages: `https://tivvy-live-collector.nickabull.workers.dev/live?date=YYYY-MM-DD`
- Audit endpoint referenced: `https://tivvy-live-collector.nickabull.workers.dev/log?date=YYYY-MM-DD`
- Collector described in UI as Cloudflare Worker + Durable Object persistent event/check log. Collector implementation, deployment state, its active schedule and credentials have **not** been independently inspected in this handover.
- Other earlier work: GitHub Actions build/collector, Southern League API, official Tiverton Town X integration; X developer project and paid credits exist, with auto top-up off. No secrets/tokens must appear in code, this document or client-side HTML.

## 3. Feed strategy / trust model
Existing:
1. **Southern League** live match collector — primary official match/incident source. Verify availability and event accuracy.
2. **Tiverton Town FC X** — attributed club commentary/photos, preferably bundled near same-minute verified league incidents. Separate X API polling/rate-limit schedule; never expose bearer tokens. Official scores and team incidents should not be invented from ambiguous social posts.
Planned additions:
3. **Football Web Pages / FootballWebPages** — identified as the likely first new feed for fixture lists / teams / live results, subject to checking actual feed format, permission, timing, reliability and whether a machine-readable endpoint supports this season and these competitions. The user recalls discussing a FootballWebPages API.
4. **ESPN** — investigate availability, especially starting XIs/team sheets/substitutes/goal incidents. **Do not assume** line-ups exist at Southern League level or claim a tested ESPN integration.
The user cannot remember which of FootballWebPages or ESPN was said to provide teams/line-ups. **Unknown until tested with actual fixture payloads**. Do not conflate `teams participating in fixtures` with `starting XI / substitutes`.

Rules:
- Preserve source attribution, provenance, timestamps, observed-vs-estimated minute, and last successful snapshot.
- Deduplicate between Southern League, FootballWebPages, ESPN and X. A single event should not become multiple goals or cards.
- For conflicts, prefer a verified official league score/incident; show a source health/error/freshness indicator and log mismatches rather than silently replacing verified data.
- Do not infer a red card, player, goal minute, scoreline or team sheet from a partial feed.
- Polling target **20 seconds during active matches**; pages currently refresh each 20s, but that alone does not prove backend collector is collecting every 20s. Rate-limit X separately.
- Preserve independent fallback behavior if a source is unavailable. Never label static fixture rows as verified live results.

## 4. UI / formatting rules already agreed
- Gold/yellow `#ffdb00` on black/charcoal; Antonio condensed display headlines, Tivvy identity and swoosh elements.
- TV: proper 16:9 fixed screen; **no page scrolling**, condensed header, large readable newest-first match timeline. Auto-updating without manual refresh.
- Featured match goal/incidents: strong coloured type/icon, minute, named player/team, score **in every update where genuinely available**. Goals blue, penalties pink, captain purple, substitutions with green ON/red OFF arrows, cards with appropriate yellow/red indicators. Respect verified provenance.
- Club X posts: official X attributed clearly; group with corresponding league incident when minute is explicitly present/nearby; expand/full-size associated artwork where available. Avoid a large separate right-side X column on TV; incident uses full width with any relevant club post underneath it.
- Right panel on standard match centre: tabs for **D1 South, D1 Central, Premier South, Premier Central and X Updates**. Fixture/scores should include full relevant day's programme, midweek included. **FA Trophy tab removed** by user request because its feed had not updated.
- Do not rebuild DOM unnecessarily (keep scroll positions / expanded X cards during updates). Preserve mobile styling/crest treatment where present.
- Historic replay possible for Paulton 11 Nov and Bishops Cleeve 14 Nov; do not destroy historical data to prepare next match.

## 5. Previously completed development/testing
- Cloudflare live collector endpoint and X feed designed; 20-second matchday polling target and persistent collector log UI implemented.
- Tests/discussions: SC Inkberrow v Hungerford (as-live); Paulton Rovers v Tiverton Town (real match); Aston Villa Women v Birmingham City Women external stress test (quiet game); Bishops Cleeve 14 Nov. A second Tivvy goal once arrived late; keep an eye on timeliness and source differences.
- Prior user requested tabs across Southern League, then FA Trophy; FA Trophy proved unsuccessful and is now explicitly removed from live front-end.
- X updates grouped by minute; expand/collapse; full-width incident layout; TV adapted for no-scroll 16:9 viewing.
- Collector log view includes source events/HTTP checks, polling state, source errors and CSV download. These are observations from code, **not a statement that the collector is definitely running right now**.

## 6. Changes made on 16 November 2026 — specifically for Melksham
The following edits were committed to `main` in the current conversation:
- `tivvy-live-tv.html`, commit `2aed81731b1b9dc5985c97bcba0a95c6e73b1b21`: default date now `2026-11-21`; added `Melksham Town` (home), `Tiverton Town` (away), 15:00, while allowing old 11/14 Nov dates in query string.
- `tivvy-live-log.html`, commit `e03d8165fcb153ba6130f83f99d462acf8ded838`: default first choice 21 Nov Melksham; legacy date choices retained; TV link updated.
- `tivvy-live-saturday-test.html`, commit `e84148cb2cd6aa0a3b170b5d3bc0c5e7b3ad3780`: selected 21 Nov, updated featured fixture key, live URL and fallback filenames; static Saturday D1 South fixtures populated, FA Trophy tab removed. **These new fallback JSON files may not exist yet**; verify before matchday. Other division boards currently empty, requiring source-backed fixture population.
- Original styles/timeline behaviors retained.
**Caution:** the main match-centre HTML still contains an older hard-coded “Official match centre” external link; verify/replace with the *actual Melksham* match URL before advertising it. The `project-hub.html` link still advertises the earlier date.
- DO NOT claim the live Cloudflare collector route itself was modified by these front-end commits. Its supported 21 Nov data and X collection remain to be verified.

## 7. Exact next actions — highest priority before Saturday 21 November
1. **Verify live collector on both endpoints for 2026-11-21:** check response status, featured Melksham/Tivvy home-away, 15:00 UK kickoff, current league fixtures, fresh `checkedAt`, match events and X posts; check Durable Object persistence and error reporting. If missing, update the actual Worker deployment / route / date selection / schedule safely (no secret exposure).
2. **Find first real pre-match fixture feed** (likely FootballWebPages). Confirm schedule and **participant teams**, especially whether all four Southern League tabs and midweek fixtures are available. Verify FootballWebPages API scope, authentication, cadence and terms. Build server-side mapping from feed to existing standard schema. Do not substitute unsupported guessed results.
3. **Test player team-sheet availability separately** on FootballWebPages and ESPN: XI, bench, player IDs/names, when published, competition coverage. If neither is reliable, defer line-ups and show clear “awaiting confirmed team sheet.”
4. **Complete right-hand fixture boards** for 21 Nov in all four divisions and dynamic next-match/midweek handling. Do not leave tabs blank or imply zero games simply because data has not yet been collected.
5. **Confirm original Southern League event and official X collector still work** with new date; apply deduplication, precedence and cross-source audit alerts. Keep 20s effective polling for football feeds, X on its own safe schedule.
6. **Fix stale links and references** (project hub TV URL, fixed external official match link, title/meta labels and date, Wix embedded script/iframe if it references old versions). Do not accidentally point spectators at the Paulton/Bishops Cleeve game.
7. **Pre-match test**: early fixture/participant feed, status before kick-off, missing lineups, match go-live, goal/score updates, incident-colour rules, multiple same-minute events/X grouping, right-panel 4 tabs, error/fallback/staleness, CSV audit and full-screen + mobile.
8. **Matchday observation**: verify that feed arrival is not noticeably delayed (especially goals), 20s checks persist in audit and retries do not generate duplicates. No false “LIVE” badge for stale snapshots.
9. After successful test, record deployed commit SHA, collector deployment/version, source endpoints (no secret keys), actual sample evidence and unresolved defects below.

## 8. Known risks / open bugs
- Cloudflare backend may not recognise 21 Nov despite front ends now using it; front-end alone cannot create real feed records.
- New `data/tivvy-live-20261121.json`, `data/southern-league-matchday-20261121.json`, and `data/tivvy-x-melksham.json` fallback paths are referenced but not verified in repo.
- Right panel's D1 Central / Premier South / Premier Central static boards cleared pending genuine fixture data; **needs completion**.
- FootballWebPages and ESPN integration **not yet implemented or tested in actual collector**.
- Source-provided teams/line-ups unclear; never promise starting line-ups without data.
- Hard-coded official match-centre link in front end may be for previous fixture; verify before using.
- Project hub links may contain `?date=2026-11-14`.
- Source availability, exact league schedule, match postponements, changes to kickoff, and future live incidents can change: check fresh official listings.
- Collector's coverage for FA Trophy failed; tab removed rather than pretending coverage.
- This handover is based on repository source and prior discussions, not end-to-end browser/Worker deployment QA.

## 9. User expectations and working conventions
The user wants autonomous GitHub edits where access permits, not instructions to make trivial changes manually. Preserve established design exactly unless asked otherwise. Explain what was actually committed and what still requires backend testing; never claim an auto-update was set up or deployed without verification. Prioritise a reliable matchday experience over speculative data provider promises. After changes, verify affected live page(s) and record outcome here.

## 10. Continuity prompt for a new ChatGPT conversation
> Continue the **Tivvy Live** project. Start by reading `live/PROJECT-HANDOVER.md` in GitHub repository `nickabull/Tiverton-Town-Control-Centre`, then inspect `tivvy-live-tv.html`, `tivvy-live-saturday-test.html`, `tivvy-live-log.html` and the Cloudflare collector if accessible. We are implementing a permanent automatic discover → pre-match → live → finalise → archive → Match Centre → next-fixture workflow for **every future Tivvy game**; Melksham Town v Tiverton Town on 21 November 2026 is just the immediate test. Front ends are reset to that date but backend/feeds are not yet verified. Keep the full-screen 16:9 gold/black TV look, current incident/X grouping and 20-second live update target. Add FootballWebPages/ESPN only after confirming actual coverage; distinguish fixture teams from starting XIs. Populate/automate all four Southern League fixture tabs including midweek; FA Trophy tab stays removed. Fix stale links, verify collector/X/audit and test before declaring match-ready. Make changes in GitHub when safe, then update this handover with commits, test findings and remaining work.


## 19 November 2026, 07:31+ UK — Bishops Cleeve preservation and Melksham preparation

User requested: preserve all 14 Nov v Bishops Cleeve data, then prepare both GitHub TV and normal match-centre displays for away match at Melksham on Sat 21 Nov, including the full Division One South Saturday panel and upcoming midweek fixtures.

**Committed / preserved:**
- `live/archive/2026-11-14-tiverton-bishops-cleeve/postmatch.json` created commit `8a97980f480cf8861cf9cf53f6babacf317be689`: exact content copy of existing `data/tivvy-programme-postmatch-20261114.json` (source Git blob `cb629f04abff670d92394f7acc7b7c28500bf7f0`), including final 3–1 score, goals, cards, substitutions and starting/used players. Existing historical source remains untouched. **Not a full audit or X snapshot.**
- `live/archive/2026-11-14-tiverton-bishops-cleeve/README.md` commit `d7bfc81333c12bd332aaf22779a990ea2d8745f3`: explicit preservation manifest and missing raw Cloudflare live/log, X-media data, and immutable replay verification. Raw collector endpoints were not accessible through current web access; **DO NOT CLAIM COMPLETE BACKUP**.
- `tivvy-live-saturday-test.html` commit `e721860798e2a8950ed36778773ea7156f5662f2`: corrected stale 14 Nov/Bishops Cleeve title, header, featured team labels, fallback match metadata, obsolete 14 Nov official match-specific link (now points to generic Southern League live listings), and outdated code comments. Retains source-checked 21 Nov fixtures and current formatting.
- Same HTML commit `da02ad149bd905461167de6e602bccd9d489821c`: right side D1 South adds separate labelled *future schedule* items for Monday 23 Nov Swindon Supermarine v Tiverton (19:45) and Wednesday 25 Nov Willand Rovers v Portland United (19:30). These are not represented as Saturday live results. Saturday's 11 fixtures (10 on right + featured Melksham/Tiverton) were independently cross-checked against FootballWebPages and NonLeagueMatters.
- `.github/workflows/southern-matchday-tabs.yml` commit `46e4de2f6de1be37bc51e2fc1c08b9f60d9cfaf0`: added a post-publication check that fails the workflow if the generated matchday JSON has status != ok. This exposes previously silent HTTP 400 source errors; it does **not** repair API HTTP 400 or prove successful league collection. Next scheduled run must be inspected.

**Preserved:** `tivvy-live-tv.html?date=2026-11-14` remains a valid historical date selection in source; `tivvy-live-tv.html` already defaults to 21 Nov and was not overwritten. No Worker deployment, X configuration changes, purges or historical deletion.

**Verification statuses:** GitHub create/update returned commits above (PASS). Independently listed 21 Nov fixtures on public source (PASS for static schedule). Cloudflare live/log endpoints for 14 and 21 Nov and GitHub Pages/Wix page browser fetching were unavailable in current web access. No in-play collector/20-second cadence, complete 14 Nov backup, actual page render, latest Pages publish, or deployed Wix embed is claimed verified. Source-side hard-coded dates, empty other-division boards, upstream 400 and downstream Match Centre automation remain outstanding.

**Immediate follow-up:** (1) obtain 14 Nov `/live` and `/log` JSON and historical X data for full preservation, checksum them into archive; (2) check the new workflow run's status and diagnose Southern League 400; (3) verify deployed /health and /live 21 Nov; (4) browser-check both pages on desktop, TV and Wix; (5) build permanent next-fixture registry and idempotent postmatch archive to Match Centre.


## 19 November 2026, ~09:17 UK — user to follow Melksham remotely on large upstairs 16:9 television

User clarified they cannot attend Melksham match and the 16:9 TV feed will be their primary match companion, though deployment remains a private test. Therefore accuracy, data age and graceful failure are more important than cosmetic redesign. Never present an anticipated fixture or stale snapshot as confirmed in-play activity.

Read-only code additions:
- `scripts/probe-southern-api-readonly.py`, commit `42b44c149806474a8f12f3fa12d80a97a530e59a`: four-date comparison (10, 14, 19, 21 November), varying 1000/100 result limits and with/without events, log HTTP status, no response body or sensitive headers. Writes `diagnostics/southern-league-api-probe.json`.
- `.github/workflows/diagnose-southern-api.yml`, commit `b4c92a21d1b8131ca8e86af32f9d03d2c8e8ca73`: **manual workflow_dispatch only**, publishes a 30-day diagnostic artifact even when all probes fail; no production data changes. **Not yet executed**; no fresh response claims.
- `tivvy-live-tv.html`, commit `7006fa7989b4c78f9554d8d621741ceed786a84e`: status banner now distinguishes a fresh scheduled/pre-match official fixture snapshot from active match source and full-time result, rather than always claiming 'VERIFIED LIVE SOURCE'. Existing old-score retention and hard-coded historical date selection preserved. Source committed but browser/QC and actual deployed Pages version not verified.

GitHub historical observations: the static four-division snapshot had a successful API result with 37 fixtures for 10 November, but 400s on 11, 13, 14 and 19 November (including 14 Nov at 17:23 during the game). The same diagnostic script request parameters appear unchanged between 10 Nov successful and 19 Nov failed snapshots. This suggests failure not solely due to outside-match hours; **it does not prove why the API returns 400**. Live Cloudflare collector versus GitHub snapshot failures must be investigated independently. Cloudflare endpoints are inaccessible through current web reader; no backend uptime, 20-second cadence or live data is verified today.

Next: execute manual diagnostics workflow via GitHub Actions when available; review artifact, fix any exact request-format issue based on evidence, then check live worker /health /live /log and verify TV screen at 16:9. Preserve Bishops Cleeve archive.

## 19 November 2026 — LG TV short URL

- User supplied and requested preservation of **https://is.gd/TivvyTV26** as the easy-to-type LG Smart TV shortcut for the Melksham away private test on 21 November 2026.
- Intended full URL: `https://nickabull.github.io/Tiverton-Town-Control-Centre/tivvy-live-tv.html?date=2026-11-21`.
- This short URL is **user-provided**, not created by the assistant. Independent redirect verification via web reader failed (cache miss), so test the actual destination in a browser before relying on it. Do not change historical replay URLs.
- Long-term preferred club-owned alias: `tivertontownfc.uk/tv`, with rolling fixture selection (proposed, not implemented).

- **19 Nov 2026, 09:33 UK — user-confirmed short-link PASS:** user reports `https://is.gd/TivvyTV26` works fine. This confirms user-tested URL operation, not full LG browser compatibility, Cloudflare live source or in-play refresh. Previous web-reader redirect check was inconclusive.


## 21 November 2026, morning — confirmed pre-match team sheets requirement

User explicitly expects automatically discovered *confirmed starting XI plus substitutes* before Melksham v Tiverton kick-off (~14:30 for 15:00), analogous to the Aston Villa Women v Birmingham City pre-match test; never confuse fixture participants or squad lists with a confirmed XI.

Repository inspection: `villa-blues-wsl-live-test.html` explicitly calls ESPN public soccer `eng.w.1` scoreboard and match `summary?event=` APIs, then examines `rosters`/players with starter flags. This was the **ESPN** source in that experiment, not proof of Melksham/Southern League coverage. `live-collector/src/index.js` currently has Southern League match incidents and an optional FootballWebPages fixture/results feed, but no ESPN lineup collector or established Melksham XI normalization. FootballWebPages documents `/v2/match.json?match=<id>` match details, but its availability of reliable actual lineups for this fixture has not been verified. Search did not establish ESPN coverage of today's non-league fixture. Historical 14 Nov full post-match export includes actual XI/substitute records from Southern League, so that is a potential official source when available.

Desired robust matchday behaviour: from ~14:15 check actual match sheet availability from approved source(s) on sensible cadence; accept only explicit confirmed starters and substitutes with provenance and timestamp, show 'AWAITING CONFIRMED TEAM SHEETS' otherwise; never use predicted XI, season roster or merely participant teams; retain the last confirmed sheet with source status if provider fails; archive alongside incident timeline. Do not claim this feature is wired into TV or Wix until source payload, deployment and live tests pass. No live worker edits made in this note.

## 21 November 2026 — Match Centre half-time post

The live Melksham collector returned the club's 15:49:27 GMT half-time post. The Saturday Match Centre sent posts without an opening minute to a generic X group at the bottom, while the TV timeline could surface the newest standalone post. Commit `5a12aeeb36d6dfd3b01e50e6d18c320425380419` adds a dedicated HT marker between first- and second-half incidents, keeping the original post link. The headless render check against the captured collector payload put HT between the 46′ substitutions and the 36′ club update, showed it once, and verified the 0–2 score. JavaScript syntax checked. TV and collector code were not changed.

## 22 November 2026 — automate match-facts HTML for every completed Tivvy league game

User confirmed the match-facts panel is already a recurring match-report practice and requested its addition to the **existing** post-match automation, not a separate ChatGPT reminder. After the Melksham Town 0–3 Tiverton Town match of 21 Nov, a manually published `melksham-2026-11-21-match-facts.html` panel was created. The recurring system now additionally has:
- `scripts/generate-tivvy-match-facts.py` (commit `ef398277`), an idempotent GitHub Pages HTML generator reading `data/tivvy-programme-postmatch-YYYYMMDD.json`. It requires verified full-time results, a verified XI with exactly eleven starters and goal events where applicable; it skips incomplete/unverified results without inventing lineups or incidents.
- `.github/workflows/export-tivvy-programme-postmatch.yml` (commit `b32dfca`) invokes the generator **after** official result export, then stages HTML alongside JSON every 15 minutes. No direct Wix article edit and no worker deployment. Output naming: `https://nickabull.github.io/Tiverton-Town-Control-Centre/match-facts/YYYY-MM-DD.html`. For 21 Nov use `.../match-facts/2026-11-21.html`. These HTML pages can be embedded in Wix using an iframe. A confirmed match may take until next successful scheduled run to appear.
- `.github/workflows/check-postmatch-integrations.yml` (commit `a6cb0d18`) syntax-checks generator and builds Melksham HTML from recorded export, checking key labels/players.
- Does not edit Darren's authored headline/report, user-designed match report HTML, Canva/Wix pages or programme artwork; embeds into Wix report still require a page integration. This stage is a **committed automated source change**; actual scheduled run, Pages publication and browser/Wix embed remain to verify. Failures of external sources may prevent new panel.

## 22 November 2026 evening — Swindon Monday rollover and Melksham preservation

User requests fan-facing **As It Happens Live BETA** wording for 23 Nov and the usual post-Melksham changeover, including both Tivvy Live displays and other Southern League games.

Fixture confirmed in both Southern League official match page `https://slc-www.southern-football-league.co.uk/match/6a5a1aacce9ef452b61f42e5` and FootballWebPages: **Mon 23 Nov 2026, Swindon Supermarine v Tiverton Town, 19:45 UK** (Division One South). Only one Division One South fixture appears for Monday; **Wed 25 Nov Willand Rovers v Portland United, 19:30** remains upcoming. Other division panels continue showing source-confirmed current matches if provided; no unverified schedule or results inserted.

Before editing, created immutable GitHub copies:
- `live/archive/2026-11-21-melksham-tiverton/postmatch.json` (commit `6a26850a`, exact source blob `de36a227`)
- `live/archive/2026-11-21-melksham-tiverton/tv-page-2026-11-22-before-rollover.html` (commit `c2e5b898`, exact source blob `13651951`)
- `live/archive/2026-11-21-melksham-tiverton/match-centre-page-2026-11-22-before-rollover.html` (commit `0706faba`, exact source blob `4c9f158c`)
- Archive `README.md` (commit `43045b91`) records gaps and existing content not removed.

Rollover commits:
- `tivvy-live-tv.html` commit `50d2d73f`: default date `2026-11-23`, Swindon home / Tiverton away, kickoff 19:45; explicit historical dates 11/14/21 November preserved for replay and Grubb demonstration.
- `tivvy-live-saturday-test.html` commit `772e5226`: updated title, header, clubs, kick-off 19:45, date filter and collector endpoint for Monday, separate X snapshot fallback path (prevents accidental reuse of Melksham posts), excluded Sat fixture list, Wednesday future fixture retained; collector result must match date and clubs. Commit `1427c5b9`: modest BETA header label and note about potentially delayed/incomplete data. Commit `e98213bb`: explanatory note for only one scheduled D1 South Monday fixture; other tabs retain verified-source dynamic data.
- Static fixture confirmed; actual production cloud response `/live` and `/log` for Melksham were inaccessible through available web reader. **Raw live log, X post/media history, and deployed Wix browser state are not archived.** No Cloudflare Worker deployment or reset; its date-scoped records must remain untouched.
- Note the user-provided `https://is.gd/TivvyTV26` **was originally configured with `?date=2026-11-21`**. That query explicitly selects Melksham historical replay even after the default is moved; we cannot update the is.gd destination from GitHub. For Monday use `https://nickabull.github.io/Tiverton-Town-Control-Centre/tivvy-live-tv.html` (date-less auto default) or `?date=2026-11-23`. Do not claim old short link points at Monday.
- Standard matchday page retains historical file name `tivvy-live-saturday-test.html` for backward compatibility; contents now Monday Swindon.
- Publishing workflow/browser QA, official four-division snapshots, in-play match activity and actual ability of short URL to follow the new date all need testing. Changes are source commits, not Cloudflare Worker deployment.

## 22 November 2026 — As It Happens back navigation

Added a prominent gold **← BACK TO MATCH CENTRE** link in the header of the interactive `tivvy-live-saturday-test.html` (retained path for compatibility) to `https://www.tivertontownfc.uk/match-centre`. The link uses `target="_top"` so the return works from within the Wix iframe rather than opening the Match Centre inside the embedded frame. Responsive header button styling and accessible link label included. Source commit `0d912e67902be8ddd758740ae55a3bf73b1717fe`. No change to 16:9 TV ticker; live Pages deployment and Wix browser click-through are not independently verified.

## 22 November 2026, 21:16 UK — 16:9 TV header overlap fix

User screenshot showed the large away team label (Tiverton Town) visually overlapping the green `OFFICIAL FIXTURE FEED CURRENT` status in the top broadcast strip. In `tivvy-live-tv.html` commit `82b1b011`, widened the reserved status grid column from 12% to 19%, bounded the team-name/matchline containers to their grid cells, enabled proper wrapping for long team labels and multi-line feed status, and constrained the signal container. Kept timeline, official feed, polling and historic replay logic unchanged. GitHub source committed; Pages publication and LG browser QA still require verification.

## 22 November 2026, 21:41 UK — next-away trip content + 72-hour automation guard

User screenshot of Tivvy Match Centre shows automatic next fixture selected as **Swindon Supermarine v Tiverton Town Mon 23 Nov 2026 19:45**, but large Next Away Game section displayed "Travel information for this fixture is being checked." Root cause: `match-centre-expand-trial.html` had only two date-scoped `AWAY_GUIDES` entries (Weymouth, Larkhall). Existing fixture rollover itself works; content was unpopulated and not researched automatically.

**Immediate correction:** Added the precisely dated `swindonsupermarine` entry in `match-centre-expand-trial.html`, commit `a59d3f688474264c0d9752842443f75e6690e768`. Information checked 22 Nov against host club official visitors, admissions and directions pages: `https://swindonsupermarinefc.com/visitors-information`, `https://swindonsupermarinefc.com/admission-prices`, `https://swindonsupermarinefc.com/find-us`. Ground Imagine Cruising/Webbswood Stadium, Supermarine Road, Swindon SN3 4BZ; 300+ free on-site parking, road via A419/A361, rail to Swindon then Stagecoach 7 or taxi, clubhouse/catering. Ticket price notice deliberately warns current club admissions text still references **2025/26**, so prices are published indicative figures and must be checked for the Monday match. No invented live travel time or bus timetable.

**Automation safeguard:** Added `scripts/check-next-away-trip.py`, commit `71372bed43a1d70234f25dc52576e66efef95972`, reading authoritative `Tiverton-Town-Get-Player-Info/match-centre-fixtures-2026-27.json`, determining next unfinished away fixture and requiring an exact opponent/date in the approved Match Centre guide registry. Added `.github/workflows/check-next-away-trip.yml`, commit `11063cf6990ed1b163ca18319c66c8ce3151b408`, scheduled **daily 07:15 UTC** and on relevant code changes; within 72 hours fails Actions conspicuously if no guide. This is a **monitoring / quality gate**: does not automatically research third-party sites or make unverified price claims; new clubs still require approved content. Initial Action and Pages rollout were in progress at last check, not yet browser-verified.

**Follow-up:** ultimately migrate vetted reusable ground info into a source-controlled club venue/visitor directory and auto-populate invariant fields for future fixtures, with date-sensitive tickets, road closures and rail disruptions separately refreshed/flagged. Do not overwrite verified user edits. Ensure Wix embed actually points to the updated repository page and browser-check after Pages completes.

## 22 November 2026 ~21:52 — Ask Tivvy player results must use canonical first-team squad artwork

User screenshot shows Ask Tivvy result “Evander Grubb · Goals scored” with a large generic yellow graphic and no actual player. Root causes traced to linked `nickabull/Tiverton-Town-Get-Player-Info` repository: `player-profiles.js` did not contain Evander’s approved image or placements even though canonical `Tiverton-Town-Control-Centre/first-team-squad.html` did; `stats-centre.html` constructed a *different* simplified hero from photo URL and generic brush instead of using the approved 850px squad artwork component.

Changes in `nickabull/Tiverton-Town-Get-Player-Info`:
- `player-profiles.js` commit `f3d6d1dc` adds exact canonical Evander photo URL, placement `[-35,120,135,0,0,0,0,0,-20,200,0]`, and approved Attacker editorial label (copied directly from `first-team-squad.html`; original files unchanged).
- `stats-centre.html` commit `e92d345e` renders Ask Tivvy scorer/player result artwork through existing `tivvyArtworkHeader`, uses the already existing `player-profiles.css` Studio composition, scales it using existing `fitTivvyExactArtwork` on each answer, and bumps the versioned profile JS reference. Fallback for missing approved artwork is textual (“Official squad artwork not yet available”), never a fake card. Other Ask Tivvy statistics logic unchanged.
- `tests/player-profiles.test.cjs` commit `cd9c3146` asserts photo + placement and shared artwork rendering, so a future regression can be detected.
- This is GitHub source committed. Actual GitHub Pages deploy and Wix/Match Centre browser render have not been independently verified in this session. Page is in Get-Player-Info repository, so Control Centre-only Pages deployment does not validate it.
- Long-term: publish canonical player-artwork metadata as a shared JSON asset from `first-team-squad.html`/squad manager, rather than allowing two hardcoded photo maps to drift. The one-time Evander sync fixes this instance but does NOT yet implement automatic cross-repository card metadata synchronization.

## 22 November 2026 ~21:57 UK — FIX Ask Tivvy VIEW PLAYER PROFILE buttons

User screenshot revealed that the yellow `VIEW PLAYER PROFILE ↗` controls generated in Ask Tivvy search results were inert. Verified source root cause: `stats-centre.html` places Ask Tivvy results outside the `#players` section, whereas `player-profiles.js` registered the delegated click listener **only** on `document.getElementById('players')`. No clicks from Ask Tivvy could reach it.

In `nickabull/Tiverton-Town-Get-Player-Info`:
- `player-profiles.js` commit `99a901b9`: move `[data-player-name]` delegated click handling from `#players` to `document` so both the directory and Ask Tivvy work; after profile opens always scroll its host into view inside the embedded page, instead of suppressing scroll for embeds. Preserves other profile matching, data, back button.
- `stats-centre.html` commit `18a6d988`: bump versioned script query to flush browser cache.
- `tests/player-profiles.test.cjs` commit `65f5c98f`: regression guards for event delegation and iframe scroll.
- GitHub Pages publish in progress at last check; **actual browser click-through still needs confirmation** in Wix, especially frame scrolling. Do not declare live QA passed.

## 22 Nov 2026 22:50 GMT — LIVE Wix away panel still showing placeholder (source mismatch)

User confirms Swindon Supermarine away details still not appearing despite `match-centre-expand-trial.html` commit `a59d3f68`. Verified GitHub Pages has successful builds after that commit; the file in main has an approved `swindonsupermarine` entry for 23 Nov 2026. But user's screenshot of the **actual Wix Match Centre** displays different text, structure and labels — **“NEXT AWAY GAME”**, **“HIDE AWAY TRIP”** and **“Travel information for this fixture is being checked. Please consult the home club before travelling.”** — whereas the GitHub `match-centre-expand-trial.html` source uses `NEXT AWAY TRIP`, `TRAVEL GUIDE`, and `Ground, tickets and travel information for this fixture are being checked.`. Therefore the live screenshot is conclusively **not the HTML component we updated**. Browser network inspection could not access the Wix page (web reader cache miss, browser extension context unavailable). Wix API `GET /embeds/v1/custom-embeds` for Tiverton Town FC site returns zero site-wide custom embeds; this does NOT enumerate or allow editing classic Wix Editor page-level HTML iframe elements. The exact live panel's underlying editor HTML/iframe component source remains unidentified. Do NOT claim that changing the GitHub page fixed the live Wix panel. Next action requires access to the HTML/embed element or its actual src URL via the Wix editor / browser inspect; then update the correct source or replace with the verified GitHub component. Keep no false claims.

## 23 November 2026 ~11:23 GMT — Manual Facebook Fans group commentary intake for tonight's match

User requests easy "scratch" page to copy/paste Darren's Facebook Fans group updates into **both** Tivvy Live 16:9 TV and interactive As It Happens, as a fallback while Facebook API is unavailable. The approach keeps official X and Southern League incidents distinct and does not expose privileged secrets on a public webpage.

Added in `nickabull/Tiverton-Town-Control-Centre`:
- `tivvy-facebook-scratchpad.html` (commit `0cda67db`), phone-friendly form with supplied commentator/UK posting time/text, up to 3000 characters; opens an authenticated GitHub **new issue** with exact structured body, then user clicks GitHub's **Submit new issue**. This is deliberately a two-click publish; it does NOT directly publish from public GitHub Pages without authentication. **Authorisation uses GitHub sign-in `nickabull`** and a locked title.
- `scripts/publish-manual-facebook-post.py` (commit `fd96b33a`), parses GitHub event, rejects non-`nickabull` users and malformed dates, writes one idempotent, source-labelled manual post per issue into `data/tivvy-manual-facebook-2026-11-23.json`.
- `.github/workflows/publish-manual-facebook-post.yml` (commit `57df0f16`), triggers on issues opened, restricts author/title, publishes new JSON via GitHub Actions with rebase/retries. No Worker credentials or write endpoints exposed publicly. Issue must be publicly visible for workflow and posts are published data; only submit with the source author's permission. This workflow has **not yet been end-to-end tested with a real published issue**.
- `data/tivvy-manual-facebook-2026-11-23.json` (commit `400fcb9e`) starts as empty.
- `tivvy-live-tv.html` (commit `0469f2f7`): polls manual JSON snapshot every 20s, merges posts with X for timeline display, attributes them explicitly `FACEBOOK FANS GROUP · MANUALLY RELAYED`, preserves source and recorded time, does not change verified league score; keeps last known manual set across fetch failure.
- `tivvy-live-saturday-test.html` (commit `cfb70db7`): same manual source mixed into incident timeline and author-labelled via existing card rendering, without modifying the independent X tab's official X posts. Distinct source tag.
- `tests/test-manual-facebook.py` (commit `2344434d`): tests authenticated author, rejected unauthorised actor, dedupe and both markup wiring. Appended CI checks in `.github/workflows/check-postmatch-integrations.yml` (commits `ef91767b`, regex fix `4fbcf2ad`) to validate Python importer and inline JS syntax; local GitHub Action logs recorded `Manual Facebook feed smoke tests PASS` and subsequent unrelated `league-so-far.html` JS syntax step failure. **CI workflow overall not green**, investigation still pending.
- Limitations: fixed for **Monday 23 November Swindon game only**; historical or future dates need generalisation before broader reuse. GitHub issue intake isn't instantaneous: allow Actions + Pages publication + 20-sec client poll. No actual Facebook account connection, images, edit/delete/retraction UI, or live authenticated publishing experience tested. Official goals remain source-verified, Facebook transcription may be delayed or inaccurate and must be labelled unofficial. Only the reporter's authorised, publicly shareable Facebook copy should be submitted.

## 23 Nov 2026 ~22:12–22:25 GMT — Swindon full-time verified data and Hartpury travel update

User screenshot shows live Match Centre Swindon Supermarine 1–0 Tiverton Town and attendance 178 but empty summary (“Full teamsheet not currently available”) and stale fixture notes (“Check rearrangement”). Separate user-supplied official Southern League match sheet screenshots establish Tiverton starting XI (Louis Smith GK; Mason Winter; Corey Koerner off 82; Louie Slough; Matt Wood captain; Asa Hall; Dan Koita; Louis Jagger Cane off 20; Jacob Wellington; Aaron Wellington off 67; Ryan Keates), subs (Josh Bissett on 20 off 46; Finn Roberts on 82; Aiden Horne on 46, YC 70; Evander Grubb on 67, YC 74; final unnamed bench slot N/A), attendance 178, final 1–0. Match's only goal credited to **Zach Rugman 60′** in official Tivvy Live incident feed. Don't infer other home players' XI or unverified data.

In `nickabull/Tiverton-Town-Get-Player-Info`:
- `data.json` commit `0708e06d`: replace intentionally empty Swindon starters/subs fields with verified 11 and 4 player records, exact event minutes, attendance 178, source URL, verified-teamsheet flag; no fake fifth player.
- `match-centre-fixtures-2026-27.json` commit `5e83f6d6`: remove obsolete “Check rearrangement” note after completed fixture.
- Root cause: `scripts/sync-official-fulltime.py` historically populated score and an intentionally empty XI shell and discarded available official collector incidents. Commit `0ed01c37` adds conservative official incident storage (goal/card/sub/full-time types, scores, minutes, person and team identifiers) into `officialIncidents` for existing or new full-time match records, without overwriting verified XI or introducing unknown players. Scheduled GitHub Action “Sync Southern League full-time into Match Centre” succeeded; subsequent `data.json` read shows **12 official incidents imported** while XI=11 and subs=4 persisted. Automated post-match integrations check also succeeded.
- `match-centre-expand-trial.html` commit `91937856`: display those separately sourced incident rows on desktop and mobile inside match details; **caution** user’s live Wix screenshot still appears to use a different layout/code than this file. Not verified visually in live Wix; the data now exists, but do not call live Wix presentation fixed without inspecting its actual embed source.
- Hartpury next away trip, Saturday 28 Nov 15:00: `match-centre-expand-trial.html` guide added commit `5cfd0f59`, then updated with actual fixture-specific `Hartpury FC v Tiverton Town` Humanitix pricing and Tiverton supporters coach at commit `43debc70`. Official grounds page confirms 4ED Hartpury Stadium, Hartpury University, Gloucester GL19 3BE, free Sports Academy car park. Fixture-specific ticket page: adult £10 (+£0.19 fee), 65+ £8 (+£0.17 fee), under-18 free, staff/students with ID free, gates 13:00 for 15:00. Tiverton official Away Guide advertised coach seats £15 adults / £10 U16 cash, departure details pending. Sources: https://www.hartpury.ac.uk/hartpury-fc/getting-here/ ; https://events.humanitix.com/hartpury-fc-vs-tiverton-town/tickets ; https://www.tivertontownfc.uk/post/fans-away-guide-three-away-days . Travel guide is **still a date-scoped hardcoded entry** in trial HTML, NOT truly automated research, and live Wix panel source remains unverified. The legacy `away-day.html` and `data/away-trip-binding.json` still point to older trips, and must not be called current.
- No Tivvy Live Worker deployed or edited; neither X nor official live incidents code was modified in this sequence. Remaining: identify actual Wix HTML/embed source; build auto-discovery, alert and publish of verified next away guides from official data source. Confirm GitHub Pages and real-browser production results before claiming final QA.

## 23 Nov 2026 22:20 GMT — Postmatch reliability audit (do not claim entire suite up to date)

User urgently requests confirmation that all match completion updates propagated across Match Centre, Programme Centre table, results matrix and player stats. Audit via repositories and GitHub Actions:
- `nickabull/Tiverton-Town-Get-Player-Info/data.json` updated at `2026-11-23T22:16:40Z`; Swindon has verified XI=11, subs=4, official Tivvy Live incidents=12 and attendance 178. `match-centre-fixtures-2026-27.json` final Swindon L 1–0. GitHub Pages publish success by 22:17:53; Match Centre data source current. Actual Wix embed visually unverified.
- `stats-centre.html` loads `data.json` live and computes player statistics from existing `starterDetails`/`subDetails`: latest data available, visual/render correctness not browser-verified.
- `programme-player-stats.html` was **stale** because it loaded `data.js` (dated 27 Oct 2026, no Swindon). Changed only that HTML page at `nickabull/Tiverton-Town-Get-Player-Info` commit `e50734c2` to fetch current `data.json` with no-store, error feedback. A new Pages build was running at last check; browser test not yet done. `data.js` deliberately unchanged to avoid unexpected effects elsewhere.
- `nickabull/Tiverton-Town-Control-Centre/league-so-far.html` uses live Player Info `data.json` plus FWP fallbacks and should display Swindon final score after data publication. It must not invent lineups; no browser QA.
- `league-table.html` and `results-matrix.html` both fetch `nickabull.github.io/Tiverton-Town-Get-Results/data.json`. Latest successful `Update and deploy Tiverton results` workflow was **12:48:39 UTC**, BEFORE the 19:45 Swindon fixture. Its later 20:14 `FWP League Data Intake` is `STAGING ONLY`, not a publish. Therefore cannot assert the live table or matrix includes Swindon final. Results engine hourly and 15-minute evening schedule may lag; actual publication after Swindon full time not yet seen at audit time. `verified-results.json` stops 14 Nov; `verified-standings-2026-11-11.json` has asOf 14 Nov. League table HTML falls back to those snapshots when live table is older; do not mistake fallback as current.
- Canva native programme bindings `data/league-table-binding.json` and `data/results-matrix-binding.json` have verified_at **27 October**, not automatically synced live Canva edits. Their static values are stale. `data/league-so-far-binding.json` likewise old; distinguish live HTML renderers from native Canva page content.
- Programme `data/tivvy-programme-postmatch-20261123.json` was **absent** at audit; most recent present was 20261121. Export workflow scheduled every 15 min but no verified new export yet; programme source layer not fully flushed.
- The original `match-centre-expand-trial.html` source may differ from actual Wix embed. Hartpury date-scoped guide exists in trial source but actual live Wix display cannot yet be verified.
- Highest priority: consistent single revision/commit of fulltime, live incidents, teamsheets, all Div 1 South results and standings, result matrix, programme player stats, *plus* postmatch visibility audit and failure alerts. No manual "all green" response before programmatic cross-repo checks and real Wix evidence.

## 24 Nov 2026 ~00:10–00:19 GMT — incident response to requested 15-minute unattended FT publication

User demanded no manual error-hunting after FT and correct Hartpury away details in the live Wix page. Current live Wix page HTML element is still inaccessible through the Wix connector; Hartpury is already researched in the *GitHub preview* `match-centre-expand-trial.html` but that is NOT the actual Wix embedded component. Do not claim this live Wix panel is fixed. One-time editor HTML iframe source access is necessary unless another supported route is found.

Implemented cross-repository publication gate:
- `scripts/verify-tivvy-postmatch.py` commits `d89eaac4`, `f727f221`, `2fdbb9b3` reads deployed public fixture, Match Centre detailed XI, Results Centre full results and 22-team table, and Programme Centre full-time export. Checks at kickoff + 135m (PROXY only, not exact FT+15), using real Europe/London zone and known club aliases; never invents results. Native Canva pages and Wix page-level HTML remain outside audit scope.
- `tests/test-postmatch-audit.py` commit `d833838e` validates pass/fail with offline synthetic inputs.
- `.github/workflows/verify-postmatch-publication.yml` commits `e8a1ad93`, `b81e64a4`: scheduled 5-minute match-evening and 15-minute overnight checks; on failure creates/updates GitHub issue and assigns to `nickabull`, on full recovery auto-closes issue. First live audit correctly raised issue #3 https://github.com/nickabull/Tiverton-Town-Control-Centre/issues/3 and was tested against published data. GitHub notifications depend on account settings; this is NOT an independent SMS, email service or guaranteed 15-minute SLA.
- `.github/workflows/export-tivvy-programme-postmatch.yml` commit `a76cd242` now runs 5-minute evening attempts, retains 15-minute daytime cadence. Push triggered an export; new `data/tivvy-programme-postmatch-20261123.json` and `match-facts/2026-11-23.html` generated and published. Export verified official 1–0 result, XI, 1 goal, 4 yellows, 7 substitutions.
- `nickabull/Tiverton-Town-Get-Results/.github/workflows/update-and-deploy.yml` commit `626b2c7b` increases results publication attempts to 5-minute match evenings and Saturday afternoons, hourly fallbacks remain. Commit `a3e8ae63` adds 20s artifact metadata buffer after GitHub Pages upload because multiple runs hit Pages error: upload produced artifact ID but deploy saw zero.
- `nickabull/Tiverton-Town-Get-Results/update_online.py` commits `5cf28e90`, `561ce8f2`, `0839294b`: merge independently verified Tivvy full-time fixture data from live `Get-Player-Info` published fixture and official match detail into shared Results Centre matrix; handle duplicate home/away pair and agree on score, prefer official fixture date when FWP still has outdated scheduled date. Swindon discrepancy verified in logs: FWP had **31 August 2026**, official 23 November 2026. Existing score matched 1–0; no speculative source or result used. Log reports 204 results, 22 league rows. Earlier runs failed due either old date conflict or GitHub Pages artifact metadata race, then later run `45295988800` completed **success** at 00:18:28 UTC. Publication check requires independent readback.
- Rerun publication audit `45296052195` attempt 2 initiated after successful results deploy to verify closure; inspect final result and issue #3 before calling suite green.
- Still not a strict 15-minute FT SLA: GitHub scheduled actions are best-effort and monitor uses kickoff+135m proxy, not exact full-time transition; standings data freshness depends on other league matches and backend baseline; native Canva and Wix are not automatically updated by this solution. Do not overpromise.


### 24 Nov 2026 00:19 GMT — Production source readback PASS (Wix/Canva explicitly excluded)
- GitHub Pages Get Results workflow `45295988800` successfully deployed verified 204-match matrix/result feed after correcting 31 Aug vs 23 Nov rearrangement date.
- Cross-repository publication audit `45296052195`, attempt 2, completed **success** at 00:18:56 UTC, after fetching deployed Player Info details, Get Results full result/matrix + 22-team table, and Programme postmatch Swindon export.
- GitHub issue [#3](https://github.com/nickabull/Tiverton-Town-Control-Centre/issues/3) was **automatically closed** by the PASS step; verified it contains the automatic recovery comment.
- PASS is **published GitHub source consistency only**. Live Wix away-trip placeholder remains unfixed (different page-level HTML), native Canva programme pages unverified/unautomated, and the 15-min exact-fulltime SLA remains not guaranteed. Do NOT misstate these as resolved.

### 24 Nov 2026 ~09:37 GMT — retrospective Darren Facebook commentary archive created

User submitted all 15 permitted manually relayed Facebook Fans group posts (#4–#18) for Swindon Supermarine 1–0 Tiverton Town, original posting times 19:59–22:01 on 23 Nov. User requested archive after posts were all in. Verified all 15 publication issues and live `data/tivvy-manual-facebook-2026-11-23.json` entries, including correction “Scary moment for Supermarine” and trailing “0-0” on the 33′ corner post. Exact clone of the commentary feed exists in `live/archive/2026-11-23-swindon-supermarine-tiverton/facebook-commentary.json`, readback confirmed 15/15 content-identical.

New files in `live/archive/2026-11-23-swindon-supermarine-tiverton/`:
- `postmatch.json` from `data/tivvy-programme-postmatch-20261123.json`, commit `1f3b9abc`.
- `facebook-commentary.json` exact latest approved feed, commit `896065dc`.
- `tv-page-before-rollover.html` copies current TV source, commit `ff110cb6`.
- `match-centre-page-before-rollover.html` copies current As-It-Happened source, commit `acf6734f`.
- `README.md`, commit `07533897`, documents provenance, the source files, source blob SHAs, user corrections and limitations.

Note Darren says goal at 61′ while official Southern League credits Zach Rugman goal at 60′; keep both separately labelled, never silently rewrite original Facebook commentary. This archives the match facts, manual Facebook data and HTML source, **NOT** a complete stand-alone X timeline / raw Cloudflare match history or an immutable browser replay. No live source switched, no Worker touched, no browser QA. For definitive full replay archive still need X raw feed/official collector raw snapshot if retrievable and an independent visual verification. Original manual feed remains editable; later corrections must be synced deliberately into frozen archive as a new revision.

### 24 Nov 2026 ~09:40–09:42 GMT — Darren's 15 Facebook posts wired into both Swindon live display pages

User requested "squirt those through to the two pages" referring to `tivvy-live-tv.html` (non-scrolling 16:9) and `tivvy-live-saturday-test.html` (standard As It Happened).

Current `data/tivvy-manual-facebook-2026-11-23.json` contains all 15 approved user-entered manual Facebook posts (issues #4–#18); full identical copy retained in `live/archive/2026-11-23-swindon-supermarine-tiverton/facebook-commentary.json`. No original historical post modified.

- Standard view `tivvy-live-saturday-test.html` originally used `grab("data/tivvy-manual-facebook-"+EXPECTED_DATE+".json")` although `grab` prepends `https://raw.githubusercontent.com/nickabull/Tiverton-Town-Control-Centre/main/data/`, yielding erroneous `/data/data/...` URL and no Facebook posts. Commit `0227abd0` fixes to `grab("tivvy-manual-facebook-"+EXPECTED_DATE+".json")` and adds read-only immutable archive fallback if editorial feed unavailable.
- TV `tivvy-live-tv.html` already fetched `data/tivvy-manual-facebook-2026-11-23.json` correctly. Commit `7fd41067` adds archive fallback if working JSON HTTP fails. Both retain last known approved posts when unavailable, and original Southern League/X feeds remain independent.
- The original Darren copy records minutes like `33"`, but existing parsers matched apostrophes, causing missed incident grouping. TV commit `47596b5c` and standard view commit `49ae8065` now accept straight double quotation marks as well as apostrophe/prime/curly quotation characters.
- Publication: GitHub Pages prior deploy `45367486786` success 09:41:36 UTC covering earlier fixes; final minute-parser commits triggered subsequent Pages workflows. Inspect final build and actual browser view before claiming visual QA. TV intentionally shows only subset of moments in fixed no-scroll area; **not all 15 concurrently**. Standard page retains full timeline.
- These are source-code updates and automatic Pages publication, NOT editor-level Wix page HTML changes or complete historical X+Cloudflare replay archive.

### 24 Nov 2026 ~09:51 GMT — Darren's full-time comment placement repaired

User reported missing final full-time Facebook commentary in the two Swindon replay pages, remembered time ~22:02. Actual user-supplied published source `facebook-manual-18` exists in `data/tivvy-manual-facebook-2026-11-23.json` with timestamp **2026-11-23T22:01:00Z**, submitted via issue #18, full original text beginning "Full time:Supermarine1 Tiverton 0". No timestamp or original text changed (source states 22:01; user called it 22:02).

Root cause: standard `tivvy-live-saturday-test.html` grouped all posts with no leading minute into the bottom "X" bucket; `Full time:` has no minute and became buried at the bottom of a long historical timeline. Commits `770cc9fa` and `0ef244a6` detect full-time commentary case-insensitively and insert its own `FT` group with order 140, first in displayed chronology, keeping original text and attribution.

In non-scrolling 16:9 `tivvy-live-tv.html`, full-time commentary was one standalone post, potentially too tall for fixed viewport. Commit `32f0375f` renders a compact leading 210-character preview of Darren's unchanged original text for the TV, while complete full-time post remains on standard As It Happened; no raw source altered. Its standalone time-sort already prioritises newest dated posts. Final Pages build `45369470198` was running at last check; verify completed Pages job and visual/browser display before claiming pixel-level QA. Historical archived HTML copies remain preserved and intentionally unmodified.

Separate "Check programme post-match integrations" Action failures observed around same time, not considered evidence against the Facebook source itself; requires later investigation if still ongoing.

### 24 Nov 2026 ~10:00 GMT — Tivvy QuickPost phone-first relay, Saturday 28 Nov

User wants easy phone-based relay of Darren's authorised Facebook group text at Hartpury away on Sat 28 Nov, with potential future self-posting by Darren. New page `tivvy-quickpost.html`, commits `f080680e` and `db7ba621`: responsive yellow/black UI, big Open Facebook link, saved custom group URL in browser localStorage (not GitHub), clipboard Paste with manual long-press fallback, Clear, automatic UK time/default credit, selectable 28 Nov Hartpury vs 23 Nov Swindon, review and open prefilled GitHub issue, explicit user confirmation step, no embedded Facebook/Meta Groups API, no secret tokens. Source attribution remains `Darren · Facebook Fans group`. To use: `https://nickabull.github.io/Tiverton-Town-Control-Centre/tivvy-quickpost.html`.

Backend commits `14f36120`, `bbdcb4a9`: changed `scripts/publish-manual-facebook-post.py` and its GH Action to accept only GitHub issue titles `[TIVVY FB] 2026-11-23` or `[TIVVY FB] 2026-11-28`, only from GitHub account `nickabull`; validate body date equals issue title date; write separate files by safe explicit allowlist; retain id-based deduplication. Created empty `data/tivvy-manual-facebook-2026-11-28.json` commit `11a4901a` so git add both files in workflow is safe. Added isolated Saturday + unauthorized fixture regression cases to `tests/test-manual-facebook.py` commits `1821a326`, `6d04d153`. No actual Saturday commentary issues submitted (avoid fake public match content). No changes to Swindon archived match data or live X and official Southern League feeds.

CRUCIAL remaining integration: Saturday 28 Nov current TV `tivvy-live-tv.html` / standard `tivvy-live-saturday-test.html` remain tuned to Monday 23 Nov Swindon. Hartpury QuickPost posts will be published to the new 28 Nov JSON but **will not appear on both pages until those displays are rolled to 28 Nov and configured to fetch the Saturday manual feed**. This must be done before Saturday testing, using verified live collector fixture and normal matchday rollover checks. Do not claim Saturday end-to-end publication is ready yet. QuickPost still requires GitHub "Submit new issue" confirmation; Github Action not authorised for Darren's separate account. Do not claim direct publishing or actual Facebook integration. Browser/phone visual QA and live issue-to-page test not yet performed.

### 24 Nov 2026 ~10:09 GMT — critical FT timeline grouping bug corrected

User screenshot showed Swindon Match timeline `FT · FACEBOOK FANS MANUALLY RELAYED` incorrectly containing official club X posts from before kick-off. Root cause in `tivvy-live-saturday-test.html`: the original generic unnumbered post grouping code `groups.find(g=>g.minute===minute&&!g.events.length)` selects the new specially labelled `FT` group (both have `minute:null` and no incidents), so subsequent unnumbered official X posts are appended to Darren's FT section. Commit `10655ac4` fixes the actual cause: each unnumbered club or manually relayed post is an independent `POST` group, ordered by its existing `createdAt` relative to verified 19:45 GMT kickoff; numbered posts may group only with explicitly unlabeled minute groups; FT and HT keep separate attribution and chronology. Does not alter the posts or official incidents. The final actual rendered page must be checked following Pages deployment, not merely source. Preserve original 15 commentary posts and historic archive unchanged.

### 25 Nov 2026 ~22:33 GMT — WhatsApp inbound receiver scaffold (NOT DEPLOYED)

User authorised building Meta WhatsApp webhook after successfully sending and receiving a WhatsApp conversation with the existing Tivvy Live Meta business sender. Meta developer app currently at Step 2 > Configure Webhooks with blank Callback URL and Verify token. Created isolated receiver source `integrations/tivvy-whatsapp-webhook/src/index.js` commit `2b0f8d50` and setup/limitations `integrations/tivvy-whatsapp-webhook/README.md` commit `c406f02b`. GET /webhook answers Meta hub.challenge only with private verify-token match; POST /webhook HMAC-SHA256 verifies raw body against Meta app secret, rejects unsupported envelope, dedupes identical payload by sha256 digest and writes to *new private R2 bucket binding* WEBHOOK_ARCHIVE; /health is receiver-only. No raw phone numbers/tokens in GitHub; no user messages submitted to GitHub; no downstream publish without additional approvals/QA. This is a source scaffold only; secret provisioning, private bucket, separately isolated Cloudflare Worker creation/deployment, callback domain, Meta verify-and-save, app publish, actual incoming signed event receipt and editorial ingestion ALL OUTSTANDING. No automated notification or Darren relay works yet. IMPORTANT existing `live-collector/**` workflow triggers automatic deploy of the live collector, therefore intentionally kept new receiver outside this path; live collector and other Worker services untouched. Progress 6/10 pending genuine deployed webhook receipt.

### 25 Nov 2026 ~22:45 GMT — Two post-match email notices implemented (SMTP secrets pending)

User clarified original request: email `nickabull@gmail.com` (1) when match-facts HTML generated and verified, (2) when published cross-repository results, league-table, Match Centre and programme audit PASS. A **manual test email** sent successfully via connected Gmail (Gmail message id `1a214e2434157541`) confirms immediate email sending; it does NOT authenticate GitHub Actions.

Committed `scripts/tivvy-postmatch-email.py` at `8aecf061` and new `.github/workflows/tivvy-postmatch-email.yml` at `043a844a`. The independent Actions workflow is triggered when match-facts HTML is published and by a 15-minute periodic schedule; runs the existing read-only publication auditor; SMTP emails are sent only for verified recent dates (0–4 days) and successful gate; exact per-match email type is deduplicated through GitHub issue titles `[TIVVY EMAIL SENT] ...` created **only after** SMTP accepts the message. A crash between sending SMTP and writing issue may yield a duplicate; zero false success claim. It explicitly warns Wix editor embed and Canva pages are not tested. There is **no change to existing live collector, existing programme deployment, or other workflows**. Requires two yet-unverified GitHub Actions repository secrets `TIVVY_SMTP_USER` and `TIVVY_SMTP_APP_PASSWORD` (Gmail account and Google-generated app password). These must never be pasted into chat or code. Workflow execution and actual scheduled email not yet verified; no claim that automated mail is live until SMTP credentials configured and an Action succeeds. Existing app passwords may require two-step verification. Observe GitHub Actions job output after secrets are provided. Private retention caveat: GitHub issues record notification state and basic factual summary, never secrets.

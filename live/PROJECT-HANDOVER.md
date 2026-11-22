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

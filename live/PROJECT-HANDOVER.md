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

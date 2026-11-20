# Tivvy Live — PROJECT-HANDOVER.md

**Reconstructed project snapshot: 17 November 2026.** This file is an initial consolidation of previously discussed work, not proof that every feature is deployed or that the original separate handover has been found.

## Purpose
Automated Tiverton Town matchday live data for every future match, not just Melksham. Integrate Southern League, FootballWebPages, possible ESPN feed and the Tiverton Town X account; render a match-centre ticker and a 16:9 no-scroll TV view. Archive completed games and feed results, player data and the Match Centre.

## Existing components and design
- GitHub: Tiverton-Town-Control-Centre, Tiverton-Town-Get-Results, Tiverton-Town-Get-Player-Info.
- Cloudflare Worker live collector reported working; GitHub Actions used for builds. Polling target approximately every 20 seconds during matches; actual deployed configuration must be checked.
- X developer API project exists; credits funded, auto top-up off. Group similar X updates by match minute, allow expanding grouped messages, preserve colour conventions and include score in each update.
- Tabs previously included Division One South, Division One Central, Premier South, Premier Central, FA Cup and FA Trophy; user requested removal of FA Trophy because updates were unreliable.
- Right side panel should display current Southern League fixtures, including midweek fixtures.
- 16:9 sports-bar display: fixed viewport, no scrolling; timeline prominent, club crests, match score visible, condensed header. Right X column was proposed for removal.
- Sources are fallible. Record provenance and timestamps; do not invent teams, scores, player names or moments.

## Next steps
1. Inspect deployed Worker, scheduled GitHub Actions, current feed URLs and actual latest commits.
2. Confirm FootballWebPages versus ESPN source for line-ups/teams; use official competition feed for results when possible.
3. Reset fixture state automatically for every Tiverton match; archive previous live feeds and synchronise with Match Centre.
4. Test Saturday Melksham fixture and subsequent midweek matches. Verify goals, delays, line-ups, incident ordering, user-visible retries and source outages.
5. Keep the related main Tivvy Designer handover separate. After each tested change, append version, commit, verification, and remaining risks to this file.

## Guardrails
A proposed API feed is NOT a verified working integration. Do not claim automatic end-to-end Match Centre updates unless measured. Never commit API secrets. Always preserve historical archives.


## Reconciliation and repository audit — 19 November 2026, morning UK

**Canonical detailed handover:** `live/PROJECT-HANDOVER.md` (16 November). This root snapshot is the project-hub entrypoint; the detailed handover carries the full 7-stage fixture lifecycle and formatting/QA rules. Do not confuse this root handover with the unrelated programme-designer `PROJECT-HANDOVER.md`.

**Read-only, source-backed findings (not live match verification):**
- GitHub default-branch tree at `c1032cc96289f5d8c321421b18a8067900ab1c3b` contains `live-collector/src/index.js`, `live-collector/wrangler.toml`, the three TV/matchday/audit HTML pages, scheduled fixture tabs, and post-match export workflows.
- A GitHub Pages build completed successfully on 19 Nov at 04:16 UTC (run 44457121692), but a Pages build success is **not** a live Cloudflare collector, Wix embed, end-to-end Match Centre, or match-data validation.
- `data/southern-league-matchday-tabs.json` at its inspected revision, checked 19 Nov 04:15:54 UTC, reports `status: error`, `HTTPError: HTTP Error 400: Bad Request`, zero matches. The scheduled `Tivvy Southern League matchday tabs` run 44457100710 ended `success` despite the output's error because `scripts/collect-southern-matchday-tabs.py` catches the exception, writes error JSON and exits normally. **Critical monitoring failure:** Actions green is not a successful feed. Fix/test failure signaling without fabricating fixtures, and investigate the upstream request.
- `tivvy-live-tv.html` still permits only the hard-coded 11/14/21 Nov dates and defaults to Melksham; `tivvy-live-saturday-test.html` hard-codes `EXPECTED_DATE=2026-11-21`, a static D1 South board and empty other three division boards. Neither is a proven rolling fixture picker. `project-hub.html` still contains a TV featured link with `date=2026-11-14`.
- Collector source has an independent date-keyed Durable Object, 20-second league/FWP TTL and active alarm interval, one-minute X TTL, and scheduled cron `*/5 10-22 * * *` (UTC). Its default URL date is still 11 Nov; its `FIXTURES` lookup only contains 11 and 14 Nov. Scheduled discovery references the Get-Player-Info fixture JSON, so this path requires a live 21 Nov test and confirmation of a proper fixture registry plus non-default start behavior. There is **no implemented ESPN fetch** in the inspected collector.
- Collector's optional FootballWebPages request depends on server-only `FWP_API_KEY` and `FWP_COMP_ID`. Merely having parsing/source code does **not** verify the secrets, data coverage, match participants, starting XIs, or live delivery. Inspect syntax/actual provider payload and confirmed secret presence before enabling or claiming coverage.
- `.github/workflows/deploy-tivvy-live-service.yml` currently verifies the **14 Nov** endpoints after deploy rather than 21 Nov, and its superficial source check still looks for 14 Nov. Its latest deployment execution and actual worker release could not be established in this review; no live worker changes were made.
- `data/tivvy-programme-postmatch-20261114.json` is present in GitHub with a 3–1 Bishops Cleeve final, goal incidents and line-ups labelled verified from the Southern League collector, source timestamp 19 Nov 00:34 UTC. This proves a **generated historical programme export exists**, not that it automatically updated the deployed Wix Match Centre or that the source payload was independently retested today.
- Public web search corroborates Melksham Town v Tiverton Town, 21 Nov 2026 at 15:00, but Wix test-page/Match Centre embeds and the Cloudflare worker's `/health`, `/live?date=2026-11-21`, `/log?date=2026-11-21` were not accessible to the available web reader. Therefore **no live worker, in-play 20-second cadence, X delivery, cross-provider goal correctness, television layout, or Wix Match Centre sync is claimed as tested**.

**Next implementation order:** (1) source-correct the 400 and make scheduled-data errors fail visibly; (2) independently fetch the actual 21 Nov Worker /health, /live and /log responses with timestamps and compare source values; (3) replace the hard-coded date/fixture assumptions with one cross-source fixture registry and test two consecutive fixtures including a midweek date; (4) verify FWP credentials/real payload and line-up coverage, then investigate ESPN independently; (5) implement idempotent immutable per-fixture archive and Get-Results/Get-Player-Info/Wix Match Centre write-through with audit and a replay/rollback test; (6) test 16:9 browser/no-scroll and source staleness on the deployed page. Preserve existing TV styling and archives. Do not alter the programme-storage Worker.

**Change status:** documentation-only reconciliation; no Worker deployment, GitHub workflow execution, external-feed live test or Wix change performed as part of this audit.


## 19 Nov 2026 — Bishops Cleeve archive / Melksham preparations

See the more detailed `live/PROJECT-HANDOVER.md` update for exact changes and QA statuses. Existing 14 Nov 3–1 post-match export copied unchanged to `live/archive/2026-11-14-tiverton-bishops-cleeve/postmatch.json` (commit `8a97980f`) and archive limitations documented in adjacent `README.md` (commit `d7bfc813`). **Raw historical Cloudflare /live, /log and X objects are NOT backed up or independently retrieved yet; do not call this a complete archive.**

Melksham Saturday page corrected its stale Bishops Cleeve text/link (`e7218607`), added clearly separated 23/25 November D1 South midweek scheduled fixtures (`da02ad14`), and retained 21 November's complete 11-match league schedule (10 on right plus featured). `tivvy-live-tv.html` already defaults to 21 Nov with preserved `?date=2026-11-14` history; no changes to TV file. GitHub fixture workflow now explicitly fails after publishing an `error` JSON instead of claiming success (`46e4de2f`). The upstream 400 remains unresolved; new workflow behavior has not been live-run verified. No Cloudflare Worker deployment, Wix modification or browser QA has been confirmed. Full replay/live checks and durable Match Centre automation remain open.

## 19 November 2026 — short URL for upstairs LG TV

Saved user-provided short address: **https://is.gd/TivvyTV26**. Intended destination: `https://nickabull.github.io/Tiverton-Town-Control-Centre/tivvy-live-tv.html?date=2026-11-21`. Redirect couldn't be independently confirmed by web reader; user should test once on the LG browser. This is for the Saturday Melksham private test; later build a permanent automatically rolling club-owned `/tv` link.

## 20 November 2026 — TV pre-match fallback for Melksham

- User reported 16:9 `tivvy-live-tv.html` showed no Melksham fixture or kick-off prior to Saturday 21 Nov 15:00 GMT.
- Root cause in source: only displayed verified featured fixture from live collector, and an unavailable/early collector response replaced fixture heading with an error; pre-match state showed `NO OFFICIAL FIXTURE`. The static `fixtures` registry already correctly contained Melksham Town v Tiverton Town 21 Nov 15:00.
- GitHub commits `a3d3c37dd250ae81c03019b4d7b54de9407da022` and `db059ca4a8cc8b0655cadf2933324e2b0a40b0cd`: keep confirmed teams, league, date, 15:00 time and live countdown visible even with no collector response or a scheduled fixture. Retain verified-data-only goals, scores and events; mark unverified collector clearly. Refresh countdown locally each second; existing 20-second data poll unchanged. Historical date query support and display structure preserved.
- **Verification scope:** GitHub contents write confirmed. Browser display, GitHub Pages deployment, upstream Worker availability, and source result accuracy not independently verified. Next check user-facing short URL https://is.gd/TivvyTV26 on LG TV and confirm cache reload; then test whether live source switches at kickoff. This fix does **not** make automatic next-fixture selection work beyond hard-coded dates; permanent rolling fixture registry remains outstanding.

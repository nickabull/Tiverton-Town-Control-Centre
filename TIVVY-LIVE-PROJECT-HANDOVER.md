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

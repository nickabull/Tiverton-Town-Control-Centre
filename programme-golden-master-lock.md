# Tiverton Town Matchday Programme — Golden Master Lock

**Approved master:** Canva `DAHYKUo9Tzo` — **CHATGPT TEMPLATE** — 49 pages  
**Page registry:** `data/programme-page-registry.json`  
**Previous 42-page baseline:** retained only as historical reference  
**Master promoted:** 16 October 2026

## Master rule

`CHATGPT TEMPLATE` is the immutable production master.

Future programme runs MUST:
1. Duplicate `CHATGPT TEMPLATE`; never produce an issue by editing the master.
2. Create a run-specific page registry for the duplicated design.
3. Target logical pages by their stable Canva page ID, not by current page number.
4. Treat page position as informational only. Nick may reorder pages without breaking the logical automation mapping.
5. Update only fields explicitly classified as dynamic/content-editable.
6. Preserve manually positioned elements, typography, image crops, spacing and editorial tweaks unless the field is explicitly allowed to change.
7. Preview changed pages before final commit/export.
8. Never overwrite an archived programme issue.

## Page identity model

Every logical programme module has:
- a stable logical key, e.g. `league_table`
- a human-readable nice name, e.g. `League Table`
- the Canva page ID in the master
- its current page position
- an automation type: FIXED / AUTO / GUIDED / EDITORIAL

The authoritative mapping lives in `data/programme-page-registry.json`.

**Critical rule:** page numbers must never be used as the durable automation target.

When a new programme is created from the master, the automator must immediately bind each copied page to the corresponding logical key and store the copied design's page IDs. Reordering after that does not alter page identity.

## Automation classes

### FIXED
Carry forward unchanged unless Nick explicitly promotes the page or an asset expires.

### AUTO
Refresh from verified data sources and write only the approved dynamic fields.

Primary AUTO modules currently include:
- The League So Far — Results pages
- Results Matrix
- Around the League
- League Table
- Tivvy at a Glance
- Player Stats

### GUIDED
Automation prepares/populates the page but Nick supplies or approves an editorial choice such as an image, cover player, roster change or officials.

Primary GUIDED modules currently include:
- Cover
- Latest News
- Club Officials / Honours
- Your Tivvy player/profile pages
- Teams / Officials

### EDITORIAL
Automation gathers and flows copy into the locked page shell, with editorial review before final commit.

Primary EDITORIAL modules currently include:
- Executive Update
- Last Time Out
- Meet the Opposition / opposition preview

## Data protection rules

- Use verified live league/results sources; do not infer missing competition data.
- Player stats and match-event data must come from Get Player Info / approved Tiverton data sources.
- Darren Holmes reports/previews are the editorial cross-check for match narrative and event timing where available.
- Viv Curtis imagery is preferred for dynamic match/report photography.
- Club crests must use approved transparent assets; never generate substitute crests.
- Player photos must match the named player.
- Unknown officials remain TBC; never invent names.
- Missing/conflicting information is a validation warning, not an invitation to guess.

## Validation before a production commit

- League Table, Results Matrix and Tivvy at a Glance must agree on Tiverton league totals.
- Played = Won + Drawn + Lost.
- Goal difference = GF - GA.
- Home + away records reconcile with overall totals.
- Last-five form derives from the latest five league results.
- League So Far substitution OFF/ON timings reconcile.
- Match-event data is cross-checked against Darren's report where available.
- No previous-opponent copy may survive into a new opposition section.
- No automation placeholder/test copy may survive in a production issue.

## Saturday / Tuesday production principle

Development and content preparation do **not** wait for new match data.

Before the Saturday match finishes, the automator should already be able to:
- create a programme copy from the 49-page master
- bind the copied pages to logical page keys
- prepare all fixed/guided/editorial workflow cards
- pre-fill fixture/opponent metadata
- monitor for Darren/Viv/opposition material
- show which AUTO modules are waiting only for fresh match/league data

After the Saturday result/data refresh, only the genuinely data-dependent modules should need rebuilding.

For the Tuesday programme deadline, the objective is a short editorial/proof pass rather than a manual 49-page rebuild.

## Production principle

**Master shell locked. Logical page identity stable. Page order flexible. Automation changes content/data only.**

# Tiverton Town Matchday Programme — Golden Master Lock

**Approved working design:** Canva `DAHXzeMbeBg` — 42 pages  
**Safety copy:** Canva `DAHX0arOyVU`  
**Baseline captured:** 12 October 2026

## Master rule

The current 42-page Canva programme is the golden-master layout.

Future automation MUST NOT replace whole pages, rebuild layouts, reset spacing, reset fonts, move manually positioned elements, change crops, alter image sizing, or overwrite manual editorial changes.

Automation may change only the explicitly permitted content listed below. Everything else is locked.

When creating a new issue:
1. Duplicate the latest approved golden master.
2. Update only approved dynamic/content fields in place.
3. Preserve every other Canva element exactly.
4. Preview every changed page before final commit/export.
5. Never overwrite a previous issue.

## Page classification

### CONTENT UPDATE ONLY — layout and styling locked

**Page 1 — Cover**
- Layout, typography, image treatment and positioning locked.
- May update opponent, fixture date/time, competition, issue number, programme sponsor/player and other match-specific text/images already designed for those slots.
- QR destination remains the programme archive unless explicitly changed.

**Page 4 — Latest News**
- Existing page shell, headings, typography, columns, image positions and spacing locked.
- Only approved news copy, headlines, captions and associated approved imagery may change.
- Do not silently correct editorial copy; flag questionable spellings/wording for review.

**Page 11 — Around the League**
- Existing two-column story layout and lower image treatment locked.
- Replace only story text, captions/bylines and approved images.
- No Tiverton stories.
- Do not redesign based on story count; fit within the approved shell.

**Pages 16–20 — Last Time Out**
- Existing spread geometry, headings, bylines and image/text areas locked.
- Replace only Darren Holmes report copy, verified score/scorers/match data, and approved Viv Curtis imagery.
- Get Player Info match events must be cross-checked against Darren's report where available.
- Never leave automation test/filler text in a production issue.

**Pages 34–39 — Meet the Opposition**
- Existing opposition-preview shell and continuation-page geometry locked.
- Replace only Darren Holmes opposition copy, opponent-specific factual text and approved imagery.
- Waiting/placeholder text is temporary content only and must disappear once verified Portland/opponent material is available.
- Never carry previous-opponent copy into a new issue.

### DYNAMIC DATA ONLY — geometry locked, individual fields update in place

**Page 13 — League Table**
- Current Canva positions, sizes, colours, row bands, headings and Antonio table typography are locked.
- Update individual team/table values only.
- Tiverton row highlight remains yellow.
- Promotion/play-off/relegation bands remain as currently approved.
- Use the verified live league-table source; do not infer missing values.

**Page 14 — Results Matrix**
- Current Canva page geometry and manual positioning are locked.
- Antonio matrix typography remains.
- Update team codes and score cells only.
- Yellow diagonal remains.
- Only Tiverton's score numeral is red in every Tiverton fixture, home or away, including 0.
- Never rebuild or recenter the complete matrix unless specifically requested.

**Page 15 — Tivvy At A Glance**
- The user's CURRENT manually edited Page 15 is now the approved permanent layout baseline.
- Do not rebuild this page from an earlier proof.
- Antonio typography and every current manual spacing/size/position/crop adjustment are locked.
- Update only:
  - league position
  - points
  - played / won / drawn / lost
  - goals for / goals against / goal difference
  - last-five league form
  - home record
  - away record
  - top scorer
  - most appearances
  - most minutes
  - next three league fixtures
  - league-context values
  - the three corresponding player photos
  - club crests in the fixture/context slots
- Team/stat totals must be calculated from the same verified live data that feeds Pages 13/14.
- Player stats must come from Get Player Info.
- Player images must match the named player.
- Club crests must use the approved transparent PNG assets stored in the project repository; no scraped/approximate logos.

**Page 29 — The League So Far**
- Current table geometry, Antonio typography, row treatment and heading positions locked.
- Update only match rows and verified match-event text.
- Starting XI, captain, scorers, goal minutes, starter OFF times and substitute ON times come from Get Player Info, cross-referenced with Darren's report when available.
- Every OFF minute must reconcile with an ON minute. Any mismatch is a validation failure and must be flagged rather than guessed.
- Barnstaple correction is authoritative: Jagger Cane off 67 / Kennell on 67.
- Overflow goes to an approved continuation page; never shrink text to force it onto one page.

**Page 42 — Matchday Teams / Officials**
- Existing layout locked.
- Update only verified Tiverton squad/line-up, opposition squad/line-up, officials and other match-specific values intended for the existing fields.
- Unknown officials remain TBC; never invent names.

### LOCKED BY DEFAULT

**Pages 2–3, 5–10, 12, 21–28, 30–33, 40–41**
- No automatic changes.
- These pages are read-only unless Nick explicitly promotes a page/field to CONTENT UPDATE ONLY or DYNAMIC DATA ONLY.
- Manual edits on these pages are part of the golden master.

## Asset protection

- Existing manually selected/cropped Canva images must not be replaced unless the field is explicitly dynamic.
- For dynamic club crests, use the repository's approved transparent PNG crest set.
- For dynamic player images, use the approved player asset mapped to the actual named player.
- Preserve aspect ratio and current crop/placement.
- Do not generate replacement crests or player likenesses.

## Data validation before programme update

Before any dynamic programme commit:
- Pages 13, 14 and 15 must agree on Tiverton league totals.
- Page 15 Played/W/D/L must reconcile mathematically.
- GF/GA/GD must reconcile.
- Home + away records must equal overall Played/W/D/L/GF/GA.
- Last-five form must be derivable from the most recent five league results.
- Page 29 OFF/ON substitution minutes must reconcile.
- Darren Holmes report should be used as a cross-check for match-event timings when available.
- Missing or conflicting data is flagged for review; it is never filled by assumption.

## Production principle

**Approved design = locked. Page shell = locked. Manual tweaks = locked. Automation changes data/content only.**

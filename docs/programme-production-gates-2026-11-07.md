# Tivvy Programme — End-to-End Production Gates

Audit created 7 November 2026. **This is a gate checklist, not proof of print readiness.**

## Safety decision
Prove a complete, recoverable, single-file 53-page print PDF **before** polishing 53 pages. The approved Canva master is untouched and remains the fallback until the replacement has passed all four gates.

## Gate outcomes (all currently unproven)
- [ ] Gate 1: all 53 live Canva pages represented in programme editor, with correct order, media and identifiers.
- [ ] Gate 2: save edition; close browser; reopen; restore from separately exported backup.
- [ ] Gate 3: export one real 53-page A4 PDF; reopen file; count pages; visually inspect every page.
- [ ] Gate 4: verify printer requirements: fonts, image resolution, safe area, bleed, crops, page order and overall size.
- [ ] Test a long Darren match report across several pages without clipped text.
- [ ] Test a fresh Southern League refresh on actual programme pages (not merely live feed existence).
- [ ] Verify league table, matrix, player stats and Around the League show matching fixture/season dates.
- [ ] Log and resolve EVERY page-specific issue before declaring production ready.

## Live source and registry mismatch
Canva design `DAHYKUo9Tzo` reports 53 pages, while the committed programme registry records 52 at 2026-10-27T23:55:39.381Z. 1 page ID(s) are currently not in the active registry: page 23: PB4Ps6HSdblg1vsN. Do not update the frozen Canva master automatically. Identify the difference and reconcile copied-edition page IDs before writes.

## Shared data and known wiring
- Football results: `https://nickabull.github.io/Tiverton-Town-Get-Results/data.json`.
- Player events: `https://nickabull.github.io/Tiverton-Town-Get-Player-Info/data.json`.
- Programme Automator V32 links both feeds, but integration into the complete print output has NOT been verified.
- Programme Studio's LIVE FOOTBALL DATA / 'Refresh Page 17' uses an Apps Script fixture feed for Around the League. Registry position is page 14; verify UI label and actual placement. Do not infer that all Southern League pages are live.
- Current Studio 'Export A4 PDF' calls `window.print()`, and requires proof of full-edition output, not just an individual-page print.

## Page-by-page audit

*Classification = intended workflow from the registry, NOT verified automation. All output statuses default to NOT TESTED.*

| Live page | Registry name | Intended handling | Identity status | Content proven | Print output proven |
|---:|---|---|---|---|---|
| 1 | Cover | GUIDED | verified_live_id | NOT TESTED | NOT TESTED |
| 2 | Advert / fixed page 02 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 3 | Today In 60 Secs | GUIDED | verified_live_id | NOT TESTED | NOT TESTED |
| 4 | Advert / fixed page 03 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 5 | Latest News | GUIDED | verified_live_id | NOT TESTED | NOT TESTED |
| 6 | Club Officials / Honours | GUIDED | verified_live_id | NOT TESTED | NOT TESTED |
| 7 | Advert / fixed page 06 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 8 | The League So Far — Results 1 | AUTO | verified_live_id | NOT TESTED | NOT TESTED |
| 9 | The League So Far — Results 2 | AUTO | verified_live_id | NOT TESTED | NOT TESTED |
| 10 | The League So Far — Results 3 | AUTO | verified_live_content | NOT TESTED | NOT TESTED |
| 11 | Advert / fixed page 08 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 12 | Results Matrix | AUTO | verified_live_id | NOT TESTED | NOT TESTED |
| 13 | Fixed page 13 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 14 | Around the League | AUTO | verified_live_id | NOT TESTED | NOT TESTED |
| 15 | League Table | AUTO | verified_live_id | NOT TESTED | NOT TESTED |
| 16 | Tivvy at a Glance | AUTO | verified_live_id | NOT TESTED | NOT TESTED |
| 17 | Last Time Out 1 | EDITORIAL | verified_live_id | NOT TESTED | NOT TESTED |
| 18 | Fixed / advert page 18 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 19 | Last Time Out 2 | EDITORIAL | verified_live_id | NOT TESTED | NOT TESTED |
| 20 | Opposition archive photograph 1 | GUIDED | verified_live_id | NOT TESTED | NOT TESTED |
| 21 | Last Time Out 3 | EDITORIAL | verified_live_id | NOT TESTED | NOT TESTED |
| 22 | Last Time Out 4 | EDITORIAL | verified_live_id | NOT TESTED | NOT TESTED |
| 23 | UNMAPPED — identify content | UNCLASSIFIED | NOT REGISTERED | NOT TESTED | NOT TESTED |
| 24 | Fixed page 23 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 25 | Fixed page 24 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 26 | Your Tivvy 1 | GUIDED | verified_live_id | NOT TESTED | NOT TESTED |
| 27 | Your Tivvy 2 | GUIDED | verified_live_id | NOT TESTED | NOT TESTED |
| 28 | Fixed page 27 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 29 | Your Tivvy 3 | GUIDED | verified_live_id | NOT TESTED | NOT TESTED |
| 30 | Your Tivvy 4 | GUIDED | verified_live_id | NOT TESTED | NOT TESTED |
| 31 | Commercial Opportunities | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 32 | Sponsors | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 33 | Feature Slot | GUIDED | reidentified_by_unique_live_content | NOT TESTED | NOT TESTED |
| 34 | Local Independents | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 35 | Meet the Opposition — Club Facts | EDITORIAL | verified_live_id | NOT TESTED | NOT TESTED |
| 36 | Opposition archive photograph 2 | GUIDED | verified_live_id | NOT TESTED | NOT TESTED |
| 37 | Meet the Opposition — Pen Pics 1 | EDITORIAL | verified_live_id | NOT TESTED | NOT TESTED |
| 38 | Meet the Opposition — Pen Pics 2 | EDITORIAL | verified_live_id | NOT TESTED | NOT TESTED |
| 39 | Meet the Opposition — Pen Pics 3 | EDITORIAL | verified_live_id | NOT TESTED | NOT TESTED |
| 40 | Meet the Opposition — Pen Pics 4 | EDITORIAL | verified_live_content | NOT TESTED | NOT TESTED |
| 41 | Meet the Opposition — Pen Pics 5 | EDITORIAL | verified_live_content | NOT TESTED | NOT TESTED |
| 42 | Meet the Opposition — Pen Pics 6 | EDITORIAL | verified_live_content | NOT TESTED | NOT TESTED |
| 43 | Fixed / advert page 37 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 44 | Meet the Opposition — Preview 1 | EDITORIAL | verified_live_id | NOT TESTED | NOT TESTED |
| 45 | Meet the Opposition — Preview 2 | EDITORIAL | verified_live_id | NOT TESTED | NOT TESTED |
| 46 | Meet the Opposition — Preview 3 | EDITORIAL | verified_live_id | NOT TESTED | NOT TESTED |
| 47 | Meet the Opposition — Preview 4 | EDITORIAL | verified_live_id | NOT TESTED | NOT TESTED |
| 48 | Fixed page 43 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 49 | Fixed page 44 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 50 | Fixed page 45 | FIXED | verified_live_id | NOT TESTED | NOT TESTED |
| 51 | Next Away Trip | GUIDED | verified_live_id | NOT TESTED | NOT TESTED |
| 52 | Teams / Officials | GUIDED | verified_live_id | NOT TESTED | NOT TESTED |
| 53 | Protected image-only / non-text page | FIXED | id_verified_artwork_review_required | NOT TESTED | NOT TESTED |

## Publication stop rule
Do not call an issue 'oven-ready' unless all gates pass. A correct browser preview is never print approval. If a deadline approaches and any gate fails, use the approved Canva route, without attempting emergency migration.

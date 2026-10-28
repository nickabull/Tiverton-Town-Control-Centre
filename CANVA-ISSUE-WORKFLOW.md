# Canva master audit and issue workflow

The audit reads CHATGPT LEAGUE TEMPLATE (`DAHYKUo9Tzo`). It made no Canva changes. `data/canva-page-snapshot.json` records the 52 live page IDs and order. The registry covers all 52 live pages exactly once; five absent legacy entries remain marked unavailable. The Feature Slot was reidentified by its unique current content, with its previous ID retained for the audit trail.

## Variable-length sections

In the Automator, use **Build this issue** to choose report, preview, pen-picture and optional page counts. Reports and previews have four existing layouts each. Pen pictures have six existing layouts and can request a seventh. A request for seven does not invent a page ID: the connected run must obtain approval for the exact insertion into the working copy, then reread it.

Unused pages are omitted when copying the approved source-page list into a new issue. No master pages are hidden, deleted or cleared. Interleaved adverts stay included. An included editorial page must receive current copy; do not leave last week's text in unused fields. Font size, page geometry and surrounding artwork must never be changed to force a fit. Overflow requires another approved layout, not truncation.

## One complete request

1. Confirm the new fixture and issue in Cover. The old saved default is Dorchester, 27 October; it must not silently become the next issue.
2. Enter current section copy, source references, editorial changes and photo choices. Add Word/PDF source documents through the issue document selector; locally selected images are retained in IndexedDB.
3. Choose the page counts, review the complete page list and warnings, then confirm the ZIP request download. It includes `issue-request.json`, selected local images and source documents. Nothing is sent to Canva by downloading it.
4. Attach the ZIP in the connected ChatGPT conversation and request the build. The connected run refreshes the shared Match Centre feeds, resolves missing source information, rereads the live master, and copies the reviewed pages. The stored positions are a snapshot: resolve current positions by page ID immediately before copying.
5. Read the NEW working design, mapping its new page IDs to the approved source sequence. Master page IDs, table IDs and native element IDs must not be assumed to survive copying. Retired cached locators require live resolution. Preserve all unspecified manual edits and update only the approved editable content areas.
6. Proof the complete copy, including text fit, photos, credits, page references and print pagination. Respect the existing preview/confirmation workflow before any save/export. Report every unresolved item. Do not claim publication when only a request has been downloaded.

## Known decisions

Executive Update, the previous Player Stats page, an older fixed page and the Your Tivvy / League Context page are absent from the live master. They are unavailable, not silently rebound to another page. Restore or supply an approved layout if those sections are wanted in a future issue.

Page 52 is a live protected non-text page. The connector returns no editable text or image fills for it. It is retained and flagged for proof; it is not available as a blank overflow page.

The previous page-number-only Planner has been migrated to the audited unique IDs. Old local notes without IDs are kept in a downloadable local backup and never assigned to new pages merely because their numbers match.

## Validation

Run `node tests/issue-page-plan.test.cjs`, the existing report/preview tests, and `node --test tests/results-matrix-update.test.cjs`. The issue planner tests cover 52-page identity reconciliation, 3-page reports, 3/7-page pen pictures, retained adverts, changed page order, missing IDs, stale fixtures, full wording and ZIP output.

# Tivvy Programme Designer V3 — migration blueprint

**Created:** 16 November 2026
**Status:** Architecture agreed; page reconstruction not yet complete
**Reference programme:** 54-page *Tiverton v Bishops Cleeve League 141126.pdf* (14 November 2026)
**Do not overwrite:** `programme-designer-v2.html`, `tivvy-latest-news-layer-test.html`, `tivvy-latest-news-chat-test.html`, `tivvy-latest-news-darren-report-test.html`, the Canva master, or production Wix pages.

## Vision: two become one

V3 becomes the single full-programme, multipage editor, using Test 2 V2.9.2 as the **editor interaction and layout baseline**, with the existing Programme Designer/Programme Centre's page management, data bindings, proofreading and production workflow restored and improved.

**Retain editor strengths:** true layers (text, images, blocks, results matrix), editing selected words, rich text and 14/18pt typography, resize handles, duplicate and rename, locked base art, multi-selection, snapping/red guide feedback, precise keyboard nudging, non-destructive stroke options, undo/redo, browser autosave, JSON export.

**Retain Programme Centre strengths:** mapped pages, reusable club assets, current league data, scheduled updating, Darren report handling, proofing rules, approval/protected artwork, output gates and final print checks.

## Fundamental page model

Each of the 54 source PDF pages has a permanent ID in `data/programme-v3-page-manifest.json`. A page holds ordered independent editable layer objects; existing image assets may be referenced as locked photographic/artwork layers. Native tables are stored as data structures with cell values and formatting, not screenshots. A page can be **fixed**, **hybrid**, **editable**, or **data-driven** (definitions in manifest).

**Caution:** The older Canva registry currently describes a **52-page master**. The uploaded Bishops Cleeve issue has **54 pages**. Never use an old page number as an ID, and do not rewrite or migrate the master in place.

## Rebuild sequence

1. **V3 safe shell:** new `programme-designer-v3.html` development entrypoint; 54-page navigation; current page canvas; strong SAVE, DUPLICATE PAGE, ADD PAGE, RENAME PAGE, REMOVE PAGE controls; separate V3 browser storage; import/export; no impact on V2 or tests.
2. **Reference fidelity:** create 54 page previews from the supplied PDF and classify layers/page-by-page. Fixed advertising artwork stays flat/locked; editable copy, captions, logos, tables and section headers are reconstructed. Use actual brand art, not invented approximations. Keep image attribution.
3. **First acceptance pages:** page 6 Latest News, page 14 results matrix, page 19 league table, page 21+ Darren report pages, and page 54 line-ups. Achieve visual QA against the uploaded PDF before broadening. Preserve source text verbatim initially, flag issues separately.
4. **Broader rebuild:** grouped page templates (headings, yellow footer, black/gold section variations, player cards, tables, sponsor advertising). Every page can be moved/renamed/reordered while retaining stable IDs.
5. **Data bindings:** connect approved existing `Tiverton-Town-Get-Results` feeds and Programme Centre policies. Show source, last refreshed date, data conflicts and manual overrides. Never silently overwrite authored cells or mistakenly include future fixtures.
6. **Proofreading assistant:** live word-range highlighting for repeated words (e.g. "the the"), British English spelling, punctuation, grammar/style issues, inconsistent team/player names, score/time discrepancies, duplicate content. Clearly distinguish deterministic checks from AI suggestions. **Every issue must link to its precise page/layer/text span**, with actions Ignore, Accept, Recheck and mark resolved; don't modify text without review.
7. **Detailed audit/history log:** append-only change events for page/layer creation, deletion, reordering, text edits, formatting, table-cell changes, imported results, user feedback, undo/redo, approvals, preview/export/publish. Each event: `event_id, timestamp_utc, actor_id, action, issue_id, page_id, layer_id, target_path, old_value, new_value, source, session_id, result, reason`. Provide searchable, filterable, per-page/per-user timeline and CSV/JSON export. A real multi-user trail must be server-backed; browser-only logs must be visibly marked local/unverified and cannot guarantee identity, completeness or tamper resistance.
8. **Production & Google Drive:** design separately from chat/browser autosave. Versioned draft saves, immutable snapshots, issue-level locks, image asset storage, Drive permissions, failed-save warnings, revision/restore, conflict detection and optional print-ready PDF export. Only promote to production after a visual QA pass and explicit user approval.

## Audit log UI design

One **DETAILS / ACTIVITY LOG** area in the workspace, not scattered records: filter by date/time, contributor, page, action, component/layer, issue severity and source; search changed values, export CSV/JSON, click an event to locate its page and relevant layer. Log automatic imports and regeneration as well as manual work; show differences and what changed, not merely "saved".

## Existing files / sources

- Interaction reference: `tivvy-latest-news-chat-test.html?v=2.9.2`
- Older editor (read-only reference): `programme-designer-v2.html`
- Current Programme Centre page registry: `data/programme-page-registry.json`
- Existing style/data policies: `data/programme-data-policy.json`
- Editable results matrix library: `tivvy-results-matrix-layer.js`
- Existing spreadsheet-like source binding: `data/results-matrix-binding.json`
- Previous change history: `PROJECT-HANDOVER.md`

## Definition of finished

- Every one of 54 pages is represented; source-to-V3 comparison complete.
- All appropriate editorial content actually editable. Advertisements intact, with protection.
- Editing/selection behavior matches the proven Test 2.
- Text proofing identifies precise issues and proposed fixes, without silently rewriting.
- Audit log is filterable, exportable, attributable; publishing failures visible.
- Versioned save to production storage, full export and issue restore tested.
- Production remains untouched until approved.

## Important honesty

This blueprint and manifest are **not** a completed V3 editor or a migrated 54-page programme. PDF images and extractable assets still need ingestion and reconciliation. The source PDF may have typography/image positioning that cannot be recovered automatically as individual layer objects; those pages need deliberate reconstruction.

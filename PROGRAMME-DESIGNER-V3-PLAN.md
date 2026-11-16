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

## Flexible page management and export rules (confirmed 16 Nov 2026)

A programme issue must support **any number of pages**, not be fixed to the 54-page Bishops Cleeve reference. Add blank pages before/after any selected page; duplicate all layers and layout while issuing a *new stable page ID*; rename; reorder by drag/drop or keyboard controls; delete only with confirmation and reversible history; and **exclude a page from export without deleting it or its draft**.

Store `include_in_export: true` independently of `visible_in_editor`. Excluded pages remain accessible, can still be edited and are displayed clearly as *EXCLUDED* in the page sidebar. A deleted page goes to a recoverable issue-level recycle area rather than being immediately destroyed. Numbering is derived from the visible export sequence, not static page positions; allow additional report continuation pages (Darren) without overwriting the source page. Show both **total editor pages** and **exportable pages** in the header, and provide an explicit preview of the exact ordered export set before PDF generation.

Log create/duplicate/rename/reorder/exclude/include/delete/restore events with previous and new values in the DETAILS audit trail.

## V3.0.0 Shell Implementation — 16 November 2026

**Independent development URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.0.0

- Created `programme-designer-v3.html`: the full issue shell with all 54 PDF-based page titles/IDs, page counts, publish inclusion, drag-to-reorder, move up/down, add/duplicate/rename/delete/restore page actions, export-order preview, all-issue JSON backup and a searchable/filterable/exportable **local-only** DETAILS activity log.
- Created `programme-designer-v3-editor.html`: a separate copy of the proven V2.9.2 layer engine, with per-page browser draft keys `tivvy-v3-draft-page-<id>` and the existing text, graphics, image, matrix, pointer/keyboard alignment and editor tools. It sends local change events to the shell.
- Starter content is intentionally limited: **PDF page 6** starts with the Latest News editor example; **page 14** starts with the editable matrix; **other pages** currently display a blank map-backed editing canvas for reconstruction. Source PDF artwork has **not** been uploaded or faithfully migrated yet. This is a *shell*, not a completed programme.
- Built-in art `map/header/footer` is deduplicated in stored JSON using reference tokens to reduce browser localStorage exhaustion. User-added images still remain data URLs in this prototype; production requires object storage.
- Existing V2 and the three experimental test files were not edited. The 52-page old Canva registry was not used as V3 page-order authority.
- This shell is **NOT secure cloud saving**. All draft state and the log remain browser localStorage. It is not safe to treat it as a multi-user system or authoritative audit history. Backup JSON downloads are local; there is no backend, Google integration, durable asset upload, PDF output, or reliable other-device sync yet.
- **QA:** both new inline JS scripts passed JavaScript syntax compilation checks. Full browser interaction, source-layout fidelity, and cross-browser testing remain pending. Critical first checks: page switching persistence, page 6 versus page 14 independence, duplicate and hide, reorder, local backup and restoration.
- Commits: page-editor `be0053d6f9acad8c83921e35df8e5a2c99386d03`, compact asset patch `bc001d8fb65ac80055a008815dc3171319c9ff06`; shell `c94030c2b775be8f622613560ebbc0862c735511`, initial page/log fix `29068fa2bc143be94d2c61ea976e6420aa26c079`.

**Next gate:** test the V3 shell in-browser, resolve any runtime issues, then design D1/R2/identity/server audit storage before reconstructing the remaining pages.

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

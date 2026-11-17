# Tivvy Programme Designer — project handover

## V3.6.8 — COMPACT STEPPERS + WIDER ZOOM SLIDER (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.8

- User's visual QA screenshot revealed V3.6.6 +/- controls were too wide, clipped numbers at 3+ digits, and left X/Y label/slider rows misaligned. CSS updated inspector's two-column layout to use narrower 22px +/- buttons, a flexible full-width readable input with tabular digits, compact labels kept on one line, and consistent top-alignment for X/Y and all other paired controls.
- User also asked for the zoom slider to match the physical length of inspector sliders. Toolbar zoom now uses flexible width up to 190px while shrinking gracefully at narrower workspace widths, preserving exact percent field and FIT PAGE. Existing two-row toolbar and page content remain intact.
- Only editor CSS and V3 dev shell cache version changed. Editor commit `a36630d71cb862c86d7242e93974b365a6d31fc6`, shell commit `4a75ac6337b8dd999de310503694682609555fe0`. Browser QA needed on user's browser/viewport for 100, 223, -180 and 1000 values; ensure rows align, number field isn't clipped, and toolbar doesn't wrap.
- User reduced shirt background opacity in their browser and appreciates visual continuity with Ryan's social designs; browser master artwork remains user-controlled and was not modified in GitHub.


## V3.6.7 — SLOWER PRECISION SLIDERS (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.7

- User noted that position/size inspector sliders whip abruptly from very large to small values. V3 editor pointer drag now uses **relative, fine increments**, starting at the current layer setting rather than snapping to the clicked rail position. Each horizontal screen pixel dragged changes the value by 0.2 units (Shift: 0.05 units/pixel), rounded to inspector's integer unit. The full range remains available through manual numeric input and side-by-side +/- controls. Keyboard accessibility and existing save/undo mechanisms remain, as the existing input event handler is used.
- Applies to x/y/width/height/scale/rotation/transparency inspector sliders; does not modify artwork, zoom, image stroke or text stroke controls. Test in browser for smooth pointer capture, keyboard sliders, disabled/locked fields, and high-DPI behaviour.
- Editor commit `758e0ca311c3343cc68cd70c61fc0d761bc203b0`; shell commit `6e0605ebd01194e6761a47e45423af6146d9c300`. Development only, other versions untouched.


## V3.6.6 — ZOOM AND PRECISION INPUT USABILITY (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.6

- User screenshot shows tiny native spinner arrows on numeric exact-value fields, difficult to use. Replaced the browser-native arrow affordance on inspector exact X/Y/width/height/scale/rotation/transparency fields with large side-by-side **minus / plus** buttons (one unit per click) while retaining direct numeric entry, range sliders, validation and existing save/undo handlers. This is an editor UI-only change, not an edit to any existing layer.
- Zoom toolbar now includes a directly editable **exact zoom percentage** (25–400%, 1% increments), alongside range slider and a **FIT PAGE** button which computes available stage width/height and scales 595 x 842 page to fit. Clicking FIT PAGE returns stage scrolling to top-left. Zoom remains view-only; it does not modify page content, snapshots or PDF output.
- Development editor commit `fb12a84a535981c0880c1de07cf1060d8e674868`, shell cache version commit `280a086d127e9103d6a500fb0ebc590dbfc23c2f`. Browser QA still required at user's display resolution: verify buttons don't wrap toolbar, steppers fire a single change and save, disabled fields respect locks, and fit shows entire A4 page below sticky toolbar. No production/other versions/page artworks modified.


## V3.6.5 — EDITABLE TEXT OUTLINE / STROKE (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.5

- User wishes to make final manual design tweaks to page 7 master prior to wider rollout; specifically enlarge Tivvy gold/top heading and apply a **black stroke around white text** to improve contrast.
- Development editor only: added independent **TEXT OUTLINE WIDTH** slider and exact numeric field (0–8 px in 0.5 px steps), and **TEXT OUTLINE COLOUR** picker under TEXT BOX OPTIONS. Defaults: width 0, colour black; existing text layers retain unchanged appearance until user opts in. Stroke applies to glyphs, not a rectangle around the layer, and follows text during edits/drag/resize. The setting is stored in the existing JSON/IndexedDB draft for each text layer and restores through the normal inspector.
- Uses CSS `-webkit-text-stroke` and `paint-order:stroke fill` to protect white fill legibility; independent from pre-existing transparent **image** stroke. No page 7 artwork, existing browser drafts, V2, Canva, Wix, or production pages modified. Shell cache version advanced to 3.6.5 for the development editor.
- **Browser QA pending:** open p7, select white headline, test 1–2 px black stroke and confirm saved draft after reload. Check printed/export appearance and that legacy text with zero width is unaffected. Do not bulk-apply page 7 style until user finishes refinements.
- Editor commit `41e699e5216d2eb8f70f30586af612ede4a8c135`; shell commit `da66c48795e475ea46bd7195ac551be9156dc5fe`.


## V3.6.4 — PAGE 6 SHIRT LOOK + PAGE 19 LEGEND AND CRESTS (16 NOV 2026, 23:48 GMT)

**Dev:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.4

- User requested **direct code implementation**, not merely a brief or instructions: take **exact saved page 7 artwork** (shirt background, top brush graphics, **including black bottom/footer brush**) and apply to **page 6 LATEST NEWS**, while keeping existing page 6 headline, two-column article text and any imported photo layers independently editable. User also requested to **finish the page 19 trial** (missing crests + broken legend). Prior assistant erroneously claimed inability to edit repo; corrected via GitHub connector and pushed code.
- In shell `programme-designer-v3.html` under **MORE TOOLS**, added:
  - `APPLY PAGE 7 LOOK TO PAGE 6`: user-triggered trial generator `makePage6ShirtTrial()`, reads actual saved P7 and P6 layers from IndexedDB (or legacy localStorage), validates shirt + bottom black footer artwork, clones P7 **all visible image/shape artwork including bottom**, removes page 6 old map/yellow header/yellow footer, retains P6 editable text and non-base imported photos, restyles white LATEST NEWS heading, keeps two-column article text, adds editable white bottom/footer caption, downloads full P6/P7 source safety JSON, writes **PAGE 6 · SHIRT LATEST NEWS TRIAL** to IndexedDB, inserts the trial immediately after original page 6 with `include:false` (excluded from publication). Original page 6 and page 7 are untouched. **Browser click needed** because live page designs reside only in user's local IndexedDB; server does not have their layers.
  - `FIX PAGE 19 TRIAL KEY`: user-triggered fix to **existing** page 19 trial draft, validates editable standings, downloads full trial JSON first, replaces uncoloured flat text legend with independent `standingsLegend` layer containing three separately editable label/swatch pairs: green automatic promotion, blue promotion play-offs, pink relegation. Saves trial draft to IndexedDB and reloads editor. Original PDF page 19 remains untouched.
- Editor `programme-designer-v3-editor.html` now renders `standingsLegend` with 3 swatches editable using native colour inputs and individual text labels editable inline; draggable and blue resize handles supported. Maintains table data/colour bands. Editor commits `82dc258a5666ebcbdf7e3b6a87af4ed4b4550a95` and `2d2cb6605777775e08fad94aad8952f743844163`.
- Missing crests: existing table module `tivvy-v3-league-table-layer.js` tries original locked-crest URL and short-code alternative; if unavailable **reads already-imported page-19 reference JPEG from `tivvy-v3-reference-art-v1/images/page-19`**, crops the existing 22 crest illustrations based on their original page positions, and uses the correct corresponding crop. Ultimate fallback is a labelled club-code medallion rather than blank. This restores real club-badge images where local original reference is available. Note that raster fallback quality is limited by original reference JPEG. Module commits `fac50810c9c53860d2f9feb901b55e5e8e8758d4` and `0a9deacd0bcb9f485bd1aa040475af753a0f93ef`.
- Shell commits `925e4f7b816771c05cae8d6767500161b6a84082` (new actions) and `eee5d9f8a6632b7a38d503531fb8995eeda53e29` (future page-19 trials start directly with the improved editable colour-swatch key). JavaScript parser checks passed on shell, editor and table module; duplicate HTML IDs checked (none). **Browser QA still needed**: P19 crest images appear with fallback and key text/colour are individually editable; P6 trial should show full shirt background, white LATEST NEWS headline, black top/bottom brushes and editable two-column text, preserve imported photos; PDF original and other pages unaffected; verify saving and page switching. If P6 has no imported photo layers, conversion cannot magically reconstruct original picture assets from the old PDF; import original photo artwork as independent layers. Current user screenshot for page19 previously showed broken plaintext key and blank logos, now addressed in code.
- Guardrails: Do not modify V2, Canva, Wix or browser drafts. Never claim server-side execution of a client IndexedDB conversion. End result only appears after user clicks the two new tools in their browser, as in prior P14/P19 trial flow. Existing V3.6.0 compact toolbar and source page artwork preserved. Cloud storage still not connected.


## V3.6.3 — USER CONFIRMED PAGE 19 VISUAL SUCCESS; CRESTS/KEY FOLLOW-UP (16 NOV 2026, 23:37 GMT)

- User tested **PAGE 19 · SHIRT LEAGUE TABLE TRIAL** in V3.6.3 and sent full-page screenshot. Visual design highly approved ("OOOOHHH.. and ANOTHER shoot to win!"). White LEAGUE TABLE title, black-and-yellow header brush, shirt-fabric background, transparent standard rows, pale green automatic promotion row, blue play-off rows, pink relegation rows and Tivvy in yellow 8th position all visible.
- **Follow-up defects reported:** a few club crest images are missing (determine exact team names and correct existing locked-crest asset paths or fallback), and the **legend/key is broken**: currently plain words "PROMOTION PLAY-OFFS RELEGATION" instead of the supplied example with three coloured swatches and labels **Automatic promotion** (green), **Promotion play-offs** (blue), **Relegation** (pink). User supplied a separate reference image for legend. Rebuild the key as a proper independent, movable, editable native layer; do not flatten into a bitmap. Ensure colours reflect actual zones on current table.
- These defects **are not yet fixed**. Preserve existing browser-local trial page and original PDF page 19. Before editing, check saved artwork and date source, and use the V3 development code only.
- This completes the key proof of concept of reusable page-7 aesthetic across editorial page 7, editable results matrix page 14 and editable standings page 19. Do not bulk-propagate until user defines final master variations.


## V3.6.3 — PAGE 19 EDITABLE SHIRT-STYLE LEAGUE TABLE TRIAL (16 NOV 2026, 23:31 GMT)

**Development URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.3

- User requested one more test before bed: convert original **PDF page 19** to the exact saved **page 7 shirt/background and black/yellow top brush design**, white league-table title, dated to the **Saturday 14 November 2026** completed league round, all 22 crests repositioned with standings, Tiverton Town **8th** with yellow row, ordinary formerly-white rows **transparent** showing shirt fabric, preserve promotion/play-off/relegation colour bands, and keep standings individually editable.
- Verified 22-team league table with Football Web Pages `https://www.footballwebpages.co.uk/southern-football-league-division-one-south` (timestamp updated **14 Nov 2026 17:22:57**) and full statistics W/D/L/GF/GA on `https://www.nonleagueranking.com/leaguerank.php?League=SL+1S&view=table`, consistent with NonLeagueMatters `https://www.nonleaguematters.co.uk/divisions/9/`. Tiverton: rank 8, P17 W7 D4 L6 GF29 GA25 GD+4 Pts25. Important distinction: this is a **dated snapshot**, not yet live automatic updating.
- Added `tivvy-v3-league-table-layer.js`: structured 22-row standings data with editable (click and edit) team names/stat fields, crests from existing locked club assets, with yellow Tivvy row, green promotion, blue play-off and red relegation category highlights, transparent ordinary rows. Scores and all table data remain HTML DOM text and JSON, not a flattened image. Initial new-file commit `0274257ef9349cd5ce29bd7a02b4e22386457c53`, regex correction `e13c336ab026240c74491b0e23507a1fba1ee92d`.
- Editor `programme-designer-v3-editor.html` commit `601e85202d626725d5f6d5270794f2a196fafe18`: load external league table script and render `standings` layer; blue resize handles; CSS rows and crests. No changes to shared live matrix renderer.
- Shell `programme-designer-v3.html` commit `f8b3e7060306dd8c005016f152051f08093a69c8`: new menu action **MORE TOOLS > TRY PAGE 7 LOOK ON PAGE 19**, with two confirmations. On user click, reads saved page 7 artwork from IndexedDB, filters out bottom/footer art, captures existing page 19 layer draft if present, downloads complete safety JSON for original pages 7 and 19, creates new **PAGE 19 · SHIRT LEAGUE TABLE TRIAL**, `include:false` (not in programme export), after original p19, with shirt brush art, white title, date, and new editable standings layer. **Never overwrites original pages 7 or 19.** New layer draft verified via IndexedDB write before adding trial page entry. Code checks: inline scripts parse, HTML ids unique, all 22 W/D/L/GF/GA/Pts rows arithmetic valid.
- **Interactive browser QA not yet confirmed**, and screenshot received from user around 23:31 during development may be an in-progress screen; clarify any errors they show. Need inspect layout, column legibility at 95% zoom, all 22 crests, Tivvy yellow and promotion/play-off/relegation bands, and transparent rows. Only declare success after user tests. The category colour bands represent intended visual labels; confirm actual league promotion rules before live publishing.
- Previous approved V3.6.0 compact toolbar and V3.6.2 matrix transparency remain; server/cloud not deployed and browser draft JSON backup still important.


## V3.6.2 — PAGE 14 TRIAL TRANSPARENT TABLE / AUTOMATION ROADMAP (16 NOV 2026, 23:21 GMT)

**URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.2

- User approved page 14 shirt-design experiment (screenshot and enthusiastic confirmation) and now requested **all normal matrix cells transparent**, retaining solid **yellow diagonal / Tivvy heading** and **grey Tivvy bands**. Implemented in development editor with a CSS class applied only to separate-legend matrix copies on `v3-` trial pages. Ordinary axis/score cells allow Tivvy shirt texture to show; yellow/grey retain colours; focused score-edit cell keeps a pale yellow edit background. Existing matrix data and editable cell handlers unchanged. Existing original page 14 and standard matrices are not recoloured. Commit editor `89df5be1b06180e39c5302b9ce0645d8a0056251`, narrow class guard `bdd710786b01246c23aee93466b1f5a2d0b6f6c2`; shell cache/version `0f355a7e6dde6fff5400b1acab4fd8b922a0bfaa`. JavaScript syntax checked; **browser QA pending**.
- User plans to apply page 7 visual language to most existing pages next, preserving their editable text/tables; exceptions: front cover and club honours. Page 14 demonstrates a variant without bottom black footer. This is NOT yet a one-click universal page converter; each page's content needs sensible type-based conversion and layout checks. Before bulk changes, back up/download JSON and take a single-page sample for each major layout family.
- User asked about **text quality alerts** (repeated phrases e.g. `the the`, spelling, grammar, punctuation), **automatic intake of Darren's reports from Gmail**, **Viv's image discovery/selection**, and eventually sweep updates across all pages. **Do NOT imply those have been implemented** in V3 as of this handover: need staged integration, source rights/access checks, review queue, draft/preflight checks, and explicit publish approval. Club auto-update workflows are broader than the V3 designer. The user asked if the remaining work is around a day: give a grounded qualification, avoiding fixed delivery ETA.
- Next visual QA: open V3.6.2 trial, verify shirt texture visible behind the matrix with score text readable, yellow/grey cells opaque, key remains independent/editable. Key bottom edge and tiny title can be tuned next.


## V3.6.1 — BROWSER TRIAL SUCCESS CONFIRMED (16 NOV 2026 23:15 GMT)

- User ran the first **PAGE 14 · SHIRT DESIGN TRIAL** based on page 7's browser-local decorative artwork. Screenshot in chat confirms visually successful **THE LEAGUE SO FAR** layout: white title in the black/yellow paint-stroke header, shirt fabric background, a full results matrix with Tivvy highlighted scores, date strap `SOUTHERN LEAGUE DIVISION ONE SOUTH RESULTS · UP TO 14/11/2026`, and 22-club key/crests below. Bottom black brush/footer is absent as specifically requested.
- User reacted enthusiastically (`YESSSSSSSSSSS!!`) — **visual design concept accepted as successful**. Do not yet claim interactive testing of individual matrix scores or legend editing beyond the existence of their editable-layer architecture; verify these separately if requested.
- This conversion is an **experiment**, NOT approval to impose a final master on all pages. Preserve original page 7, original page 14, trial page and browser drafts; await user design guidance for the broader template. Potential polish: heading prominence and key clearance from bottom edge, but do not change without user direction.
- Source changes for V3.6.1 were previously recorded above. No additional production pages or artwork altered by this handover update.


## V3.6.1 — FIRST PAGE-14 CONVERSION FROM LIVE PAGE-7 ARTWORK (16 NOV 2026)

**Development link:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.1

- User explicitly requested **building a page 14 conversion BEFORE defining the final reusable master**. The design is a test to learn whether the master style suits tables, with variant artwork (remove the BLACK bottom brush/strap), **white headline**, results date based on existing page-14 data, fully editable results matrix and **editable club legend/key**. Page 7's current shirt backdrop, top black/yellow brush art and styling come from BROWSER IndexedDB, NOT GitHub files.
- Added `MORE TOOLS > TRY PAGE 7 LOOK ON PAGE 14` in V3 shell (`programme-designer-v3.html`). This is a safe user-initiated conversion tool: it reads saved page 7 and page 14 layers from `tivvy-v3-drafts-idb-v1/pageDrafts` (falling back to legacy localStorage); requires a valid saved page-14 `matrix`; selects separately editable page-7 images/shapes other than bottom/footer graphics; rejects unrecognisable backgrounds. It preserves page 14 editable non-decorative layers/data, restyles the heading to white, formats the stored matrix date, and splits the key into an independently movable `legendOnly` matrix layer.
- Conversion **creates a new trial page just after page 14**, named `PAGE 14 · SHIRT DESIGN TRIAL`, `include:false` (excluded from print/export) and `source:null`; **ORIGINAL pages 7 and 14 are NOT overwritten**. Confirmation prompts precede execution, and complete page7/page14 safety layer JSON automatically downloads before new IndexedDB draft is written. The trial is written and confirmed in IndexedDB before its shell page entry is added. If the matrix page has not been saved, the tool tells user to open original page 14 in EDIT LAYERS, confirm save, and retry.
- Editor (`programme-designer-v3-editor.html`) now supports matrix layer flags `hideLegend` (grid-only matrix) and `legendOnly` (club key without grid). It uses existing `window.TivvyMatrix.draw` to keep crests/names; club-name fields on the key are inline editable on click and saved to `legendNames` on blur, with draggable/resizable key via existing layer inspector. Scores remain independently editable in the original results matrix layer. No change to shared matrix JS, no flattening or PDF scraping.
- Commits shell `1951fd62070e95d97413a1d46223afe4573b5308` and date fix `1dbd13684096dc8102e3e89c21f83cbc74e2f28f`; editor `83348309097d190e0b3899f0b357cbba3166dbf5` (key rendering), plus `62b51d0fa1c7b3e2eebf5cee4aede55e00044df4` (blue resize handles for matrix and key layers). JavaScript syntax validated, **browser trial still to be run by user**. Date remains existing matrix date; NO fresh-match claims. Visual/layout fit of 22-club key, scores and white headline to be assessed from actual browser screenshot; reposition if needed. Some page-14 supporting text layers may need manual adjustment after seeing result.
- Explicit guardrails: do not assert direct server-side access to user's IndexedDB contents. Preserve existing local data and V3.6.0 approved GUI; do not create final master template until user approves trial. Keep GitHub GUI archival branches and `PROJECT-HANDOVER.md` current.


## V3.6.0 — TWO-ROW COMPACT EDITOR + TOOLS MENU (16 NOV 2026)

**Development URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.0

- User screenshot of V3.5.9 showed the editor floating toolbar still occupying too much height: Snap checkbox wrapped onto a standalone line, LAYERS and INSPECTOR pushed typography controls rightward, VIEW dropdown displayed an oversized cut-off box, yellow standard-size explanation took space, and the yellow ? button floated at the bottom. User explicitly requested reclaiming ~5–6 rows so more of the actual page is visible.
- **Before modification, archived current V3.5.9 GUI code** on GitHub branch `archive/programme-designer-v3-5-9-gui-20261116` from main. Earlier archive branches for V3.5.7 and V3.5.8 also retained. **Note**: archive branches store source code only, not user's browser-local art/layer drafts.
- V3.6.0 editor reformats sticky toolbar as **two fixed non-wrapping rows** on desktop: (1) compact EDIT TEXT controls, B/U/S, four alignment options, UNDO, REDO, and tiny SNAP checkbox directly beside REDO; (2) BODY/HEAD font presets, custom font size, APPLY, Zoom, plus **⚙ TOOLS**. Removed LAYERS/INSPECTOR from primary toolbar and moved them to dropdown. Moved Original Trace toggle and opacity into same menu, with **? HELP & GUIDE** at its bottom. The formerly visible oversized VIEW panel is gone. The long yellow font-size status indicator is visually hidden but retained as DOM/state for existing JS; editor status is screen-reader-only. Existing element IDs and actions preserved, with editor draft persistence untouched.
- Dropdown is positioned as an overlay under its own narrow TOOLS trigger and right-aligned, not an inline block consuming a new toolbar row. Print CSS hides the dropdown. Focus is screen estate while retaining black/yellow Tivvy design.
- Editor commit `98d5b82ef4600802bfbbaed4bac02a0948d52f43`; V3 shell commit `ce684e37fc7f04dd2be7784bca9eacba59006bed`. Inline JS syntax checks passed; unique HTML IDs verified. **Interactive browser QA pending:** verify toolbar exactly two rows at the user's screen width; Snap directly after Redo; TOOLS dropdown opens without clipping and its LAYERS, INSPECTOR, TRACE and HELP controls work; toolbar remains sticky; existing editor layers, undo/redo, save and reference PDF unaffected. If wrapping persists at a very narrow editor width, further responsive refinements needed.
- User page 7 master with Tiverton shirt artwork, black/yellow brush strokes and placeholder text remains browser-only. **Do not clear, reset, overwrite or migrate page data** as part of cosmetic UI changes.


## V3.5.9 — SINGLE CANVAS-FIRST TOOLBAR + COLLAPSE BUG FIX (16 NOV 2026)

**Test URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.5.9

- User screenshot of V3.5.8 indicated **SHOW PAGES button / collapsed navigation broken**, with the workspace shrinking into a thin left column. Root cause: `body.nav-collapsed .main` retained a zero-width first grid column while `nav` was display:none, causing `#workspace` to be auto-placed in that zero-width track. Corrected the collapsed grid to **one full-width column**, explicitly assigning `#workspace` to grid-column:1, and tightened the page-title bar.
- Independently, V3 editor `.layout.hide-layers` / `.layout.hide-inspector` had the same grid-auto-placement risk when hiding sidebars. Explicitly set `.stage` grid-column for each visibility state; sidebar/inspector toggles now preserve the canvas track.
- User asked to remove `V3.1 EDITABLE PAGE A4` stagebar, take Original Trace out of the always-visible row, place **Undo/Redo and RED GUIDES + SNAP** inside sticky EDIT TEXT bar, and move it just below the programme page label. V3.5.9 **removes stagebar**, places layer/inspector toggle buttons plus EDIT TEXT formatting, Undo, Redo, Snap in compact primary row; second row retains text sizes, Zoom and a small **VIEW** dropdown housing Original Trace toggle/opacity. All original inputs and JS bindings retained; no duplicate HTML ids.
- Redundant lengthy white help below the page was already removed in V3.5.8 source; V3.5.9 cache-buster forces a reload of the editor. The yellow `?` Quick Guide remains. Keep storage diagnostics, IndexedDB save controls, reference art, locked layers, matrix, and print styling unchanged.
- **Archived V3.5.8 GUI** first as branch `archive/programme-designer-v3-5-8-gui-20261116` (earlier V3.5.7 archive remains). Current shell commit `c4d36ce0ecde394df54c0493907b9eef231352a6`; editor commit `48f3136faed3e0032609c24053ac892e08a7ddc8`. Both inline scripts checked with JavaScript parser and editor duplicate HTML IDs checked (none). **No browser QA yet.**
- User page 7 contains the Tivvy shirt yellow fabric background and two black/yellow brush-stroke straps, editable titles and placeholders. These page layers remain **browser-only** and NOT archived by GitHub branches. User should keep BACKUP JSON; do not reset or overwrite page 7.
- Test: SHOW/HIDE PAGES should reveal a usable full-width editor; independent LAYERS and INSPECTOR buttons work; toolbar remains just below programme page name; Undo/Redo work; toggle SNAP, VIEW trace, Zoom; help `?`; verify the page still saves and appears after refresh. If any trouble, stop edits and use the archived V3.5.8 code or backup to recover the interface.


## V3.5.8 — ARCHIVED ORIGINAL GUI + SPACE-SAVING WORKSPACE (16 NOVEMBER 2026)

**New test URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.5.8

- User showed a much-loved **V3.5.7 GUI** screenshot on page 7. Page art is their own reusable master editorial concept, with a yellow Tiverton shirt fabric background, black/yellow rough paint-stroke top and bottom, editable headline/title/body placeholders; user intends little or no printed page numbering. USER STRONGLY REQUESTED THAT THE WORKING GUI BE ARCHIVED BEFORE CHANGING IT. Screenshot is in 16 Nov conversation. **Actual current page design is browser IndexedDB data**, not part of GitHub source and NOT archived in code branch. User should download BACKUP JSON separately; never imply GitHub contains their artwork/layers.
- Created dedicated **GitHub archive branch** `archive/programme-designer-v3-5-7-gui-20261116` FROM `main` before V3.5.8 edits, preserving the complete prior code layout. Do not delete that branch. This is the explicit GUI archive. GitHub revisions from before remain available too.
- User feedback: two duplicated Programme Designer title bars plus toolbar and descriptive prose leave the actual A4 page tiny. Wants editor toolbar near top, other tools unobtrusively in sides, collapsible programme pages, help `?` with a guide/screenshots, less white instructional text, and preservation of the beloved Tivvy black/yellow style.
- V3.5.8 shell `programme-designer-v3.html` change commit `d137e248fd894b7b1dbf5a5b43b9a7b79f7dda88`: compact single-line product header, collapse/expand `PROGRAMME PAGES` navigation via `☰ HIDE/SHOW PAGES`, retain local UI preference `tivvy-v3-ui-navcollapsed` (NOT page data), move infrequently used import/storage/log/export controls into **MORE TOOLS** menu, keep BACKUP JSON and save indicator visible, slim page top strip and sidebar rows. All original element IDs and actions retained.
- V3.5.8 editor `programme-designer-v3-editor.html` commits `0ec1d1db2b5e6c6b45c8b92cf92e7db43d03a754` and print fix `a5397ff5dec1e5fb89df64b579e19799abcc0516`: remove redundant 75px editor header; move Undo/Redo/Reset/Export Layers JSON/Print to right **PAGE ACTIONS** accordion; compact and keep sticky stagebar + two-row EDIT TEXT toolbar; add dedicated `☰ LAYERS` and `⚙ INSPECTOR` toggles to independently collapse side panels (UI preference key `tivvy-v3-ui-panels-v1`); remove always-visible long under-page explanatory paragraph and repetitive layer sidebar hints; add yellow `?` button opening **TIVVY DESIGNER QUICK GUIDE** dialog for help, editing, keyboard, saving and original tracing. Illustrated screenshots for the full manual are a FOLLOW-UP, not shipped in V3.5.8. Existing editing inputs, control IDs, print/export and save code preserved.
- **Checks:** JS parser checks passed for shell and editor; duplicate HTML ids checked and none found; printing CSS explicitly restored A4/no sidebar. **No hands-on browser QA yet.** Ask user to test toggle PAGES; collapse LAYERS and INSPECTOR independently and reopen them; try EDIT TEXT toolbar; open HELP; confirm Undo and other page action buttons in inspector; save indicator; one test colour block persists after reload; A4 print if feasible. In particular, watch layout widths, tool overflow at smaller resolutions, overlay resize handles after panel collapses.
- Critical guardrails: do not change previous V2, production Wix, Canva, existing V3 page drafts or reference assets. V3 remains browser-only for draft persistence, no deployed cloud backend. Avoid touching local IndexedDB except normal draft autosave; new UI prefs live in independent localStorage keys.


## V3.5.7 — EXPLICIT RECOVERY / START NEW DRAFT (16 NOVEMBER 2026)

**Dev URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.5.7

- User's V3.5.6 screenshot shows **"OLD DRAFT ARCHIVED BUT NO VALID LAYERS FOUND — saving paused to prevent data loss"**. This confirms V3 found an invalid IndexedDB record and no valid legacy localStorage page draft. Automatic recovery cannot restore missing/lost artwork. The archive was retained in IndexedDB.
- Added an **explicit user-controlled recovery panel** in the V3 page editor's right inspector whenever saved data is unusable. Actions:
  1. **DOWNLOAD SAVED-RECORD DIAGNOSTICS** downloads the unreadable stored record as JSON; includes archive key when available, not guaranteed to be a usable page.
  2. **START NEW DRAFT ON PAGE 7** (dynamic page number) requires a confirmation, preserves unreadable archived draft, resets that one page to its default starter layout, persists a verified new draft to IndexedDB before unblocking, and displays a confirmed saved status. Does not clear browser data or other pages. **Only advise this if user is comfortable abandoning the unreadable draft.** Never claim a lost original can be recovered by this action.
- Commit editor `c9ce0c9472cd821ce32bd6ca8976358b9b0e4beb`, shell `b23477f655121c27740911ef781084b0d45de5f1`. JS syntax checks passed; browser test not yet done.
- User explicitly stated no new design was made since the failure and planned to replace page-7 Asa article with a new reusable editorial master. This is why an informed fresh page-7 draft is a reasonable option. Do not reset any page automatically.
- Further work: clean up old blank/invalid drafts when authorised, ensure duplicate-page handling uses IndexedDB instead of only localStorage, and verify backups/imports fully preserve large assets. Cloud backend still undeployed.


## V3.5.6 — INVALID INDEXEDDB DRAFT RECOVERY (16 NOVEMBER 2026)

**Dev:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.5.6

- User opened V3.5.5 diagnostics. Exact browser warning: **"BROWSER SAVE UNAVAILABLE — DO NOT CLOSE THIS TAB. EXPORT JSON. Stored IndexedDB draft is invalid"**. Root cause: recovery code threw whenever IndexedDB snapshot parsed as an empty/non-array draft; its outer catch blocked all saving even where a valid older localStorage draft could be available. Why the IndexedDB snapshot is invalid is still unknown; do not assert storage quota as confirmed.
- New recovery checks IndexedDB draft validity, **archives invalid IndexedDB record in the same object store under `recovery-archive:<original-key>:<timestamp>:<random>`**, then attempts to restore any valid legacy localStorage layers without deleting the original. On valid legacy recovery it writes a verified IndexedDB snapshot and displays recovery status; otherwise saving stays blocked with a clear archive/protection message (no silent reset/overwriting).
- Kept original `tivvy-v3-draft-page-*` browser keys, page artwork, and reference database. Shell save-error popup now has proper line breaks rather than literal backslash-n text.
- Commits editor `b45b0f08cab73717575c3e6f94b418e93c302c1c` and shell `234ed525b8f90fc090c465af19d071ab16b70ef3`; inline script syntax checks passed. Browser QA still pending: ask user to open V3.5.6 and report status. If warning remains, **do not reset, clear site data, or edit in that tab**; investigate archived record and explicit recovery path. Existing backup/export mechanisms should be scrutinised for malformed IndexedDB records.
- V3.5.5 text toolbar two-row improvement retained; V3-native page-7 master redesign remains the design goal, but persistence takes precedence.


## V3.5.5 — SAVE-DIAGNOSTIC VISIBILITY + TEXT TOOLBAR TIDY (16 NOVEMBER 2026)

**Development URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.5.5

- User reported **SAVE FAILED** in the main header on V3.5.4 before starting the redesigned page 7. Screenshot displays red parent badge, but does not expose underlying iframe storage error. Cause **not yet established**; do not say the browser save is fixed.
- V3.5.5 parent shell now labels failed state **SAVE FAILED — CLICK FOR DETAILS** and makes badge clickable to display the precise `tivvy-v3-storage.detail` diagnostic from the page editor. This is diagnostic-only; it does not reset/clear/migrate drafts or modify local storage. Commit: `e79411f9189fdbb5fb2e49931f8c7b538ee74c3a`.
- User also requested the floating/sticky **EDIT TEXT** bar be tidied because controls overflowed horizontally and yellow explanatory text was too long. Reworked into compact **two rows**: edit and inline formatting/alignment in row one; 14pt body, 18pt heading, custom size and apply in row two; concise help underneath. Existing control IDs/JS commands preserved. Toolbar constrained to available stage width and allowed to wrap instead of horizontal scrolling. Editor commit: `1cf12ed8a33e09a47f7443b72e4f5b54b53999aa`.
- Inline script syntax verified, real browser QA **pending** for toolbar and error display. **Next step:** user should click red diagnostic badge and report the exact message; do not encourage further design work until error diagnosed or user has exported a verified backup. Preserve all existing V3 browser drafts; no changes to V2/production.


## V3.5.4 — SHAPE HANDLES / ACCESSIBLE RESIZING OUTSIDE A4 (16 NOVEMBER 2026)

**Development URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.5.4

- User designing the reusable V3 page-7 master directly with existing artwork. They found that **colour block/shape** layers lacked blue resize controls and that handles were unreachable when objects touched or extended beyond the A4 page into the grey workspace.
- Replaced clipped, per-layer resize handles with a dedicated `#resizeOverlay` sibling of the printed `.paper` in `.pagebox` (z-index 10000, pointer events only on the handle nodes). This leaves actual printed artwork clipped to A4 while making three blue handles accessible above the grey stage. Supports unlocked text, image **and shape/colour block** layers; width, height and corner handles; image-corner Shift-drag proportional scaling; honors 1600×2200 layer limits.
- Overlay positions follow selected layer's real on-screen geometry and update on drag and zoom. At print time overlay is hidden. Locked and hidden layers get no handles; inspector numeric dimensions remain available.
- Changed `programme-designer-v3-editor.html` in commit `247924d7763b6373669f93a1e3d8f947103fea66`, shell `programme-designer-v3.html` in commit `80355057f7fabb25326efbfde71fd6c02da3afaa`. Inline JavaScript syntax checks passed; **real browser QA still required**. Ask user to check block handles, edge crossing into grey, text/image handles, save verification and refresh. Never touch V2 or production.
- Caveat: positioning uses selected layer's bounding rectangle, so rotated/scaled layers may show handles on their screen-aligned bounding box rather than geometrically rotated corners. If user reports that, refine this separately.


## V3.5.3 — IMAGE RESIZE HANDLES / V3-NATIVE MASTER (16 NOVEMBER 2026)

**Dev URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.5.3

- User confirmed all seven V3.5.2 persistence/recovery checks passed: Asa layer survived changes, page switching and refresh. Browser QA confirmed by user (not independently automated).
- New direction: stop reverse-engineering the flattened 54-page PDF and **build a reusable editorial master directly in V3 on page 7**. User already owns all needed decorative assets and prefers not to return to Canva. The PDF remains reference content, not the template source. Other layouts (cover, honours, data/table, profiles, protected adverts) will branch from the master.
- User observed blue resize handles were present on text boxes but not images. Changed editor to show the same bottom-middle height, right-middle width, and bottom-right combined handles on **unlocked image layers**, and use updated layer size bounds (width 1600px, height 2200px). Shift held while dragging image corner preserves original aspect ratio. Existing layer storage keys and page data remain unchanged.
- Commits: `programme-designer-v3-editor.html` `13cde5465dcec294981731c001b72acc52c99cf1`; shell `programme-designer-v3.html` `25ce3c688e4fc10e63a9a86f54d5f71a871ab705`. Syntax checked, interactive image-handle test pending.
- Do not change older V2 or production pages; preserve IndexedDB save verification and all V3 drafts.


## MATCH CENTRE — BISHOPS CLEEVE MATCH REPORT LINK REQUEST (16 NOVEMBER 2026)

- User screenshot shows Match details for Tiverton Town 3–1 Bishops Cleeve (14 November 2026), attendance 194, starting XI, substitutes, Tiverton scorers and an **Official match record** link.
- **Requested:** add a clear link to the club's full published match report in that match-details panel, distinct from the official match sheet. This is a **Match Centre feature**, not a Programme Designer canvas/page change; locate the exact rendering source before editing.
- At handover update time, the correct published Bishops Cleeve match-report URL and responsible source repository/file are **not yet verified**. Do not invent a link, substitute the preview story, or modify unrelated V3 editor / production pages.
- Once identified, add link to the fixture's match-details view only, validate the destination, test desktop/mobile and record the exact commit and URL here. This request is **logged but not implemented**.


## V3.5.2 — SAVE PROTECTION / INDEXEDDB RECOVERY (16 NOVEMBER 2026)

**Development URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.5.2

- User reported that page 7 Asa Hall layers had disappeared on reopening V3.5.1: screenshot showed only Map Background layer. **No confirmed recovery of those unsaved images.** Likely cause: large Canva PNG data URLs exceeded localStorage quota, while old save() displayed failure only in small status text. Do not assert recovery or a guaranteed root cause.
- New V3 editor reads any existing per-page `tivvy-v3-draft-page-<id>` localStorage JSON and **migrates it without deleting it** into an IndexedDB page-draft store (`tivvy-v3-drafts-idb-v1` / `pageDrafts`). The IndexedDB record becomes authoritative on subsequent loads. The original reference art remains separately in `tivvy-v3-reference-art-v1`.
- Changed page edits to queued, latest-snapshot IndexedDB transactions with an explicit **SAVING / SAVED / FAILED** status. A save is only confirmed after the IndexedDB transaction completes. Failed writes retain the in-memory page in that tab and display a prominent red `SAVE FAILED — DO NOT CLOSE THIS TAB, EXPORT JSON` status. If an existing legacy draft is malformed and no IndexedDB copy exists, automatic persistence is blocked rather than overwriting it with a starter page.
- Whole-programme **BACKUP JSON** now reads per-page snapshots from IndexedDB, with legacy localStorage fallback; large page images are included. Browser page-switching waits for a `tivvy-v3-flushed` acknowledgement carrying an actual save outcome; a missing/failed acknowledgement blocks switching and warns user. Photo crop dispatch waits for `tivvy-v3-ready`, avoiding a race with draft recovery. **Do not clear browser data.**
- This is **local browser storage, not cloud backup**; backing up via downloaded JSON and eventual Cloudflare R2/D1 migration remain essential. No multi-device synchronisation yet. Many high-resolution data URLs can still make backups large and memory-heavy.
- Revisions changed only `programme-designer-v3-editor.html` (commits `b1f156a6347350b949eaf9d545579640200c00e7`, `ee160112633366566d3f203675de8fa7e3affa6e`) and `programme-designer-v3.html` (commits `153e81af8313f4a5e1596bc1d3fdbba45cbb277b`, `5b73de7432d319db82a722b22a4a40dfea772163`, `91c27d77394079dba6974cb96a1d3811cd255124`). Syntax checks passed for inline scripts, **no interactive/browser QA yet**. V2, older tests, Wix production and existing programme drafts were not directly modified.
- **Critical QA:** before re-importing artwork, download available backup; on page 7 import a small original transparent Canva PNG; wait for `BROWSER SAVE VERIFIED`; navigate to page 6 and back; reload; confirm new layer survives. Repeat with a larger PNG, verify backup contains layer data, inspect an intentional failed-save case in browser developer tools if available. If any regression appears, stop editing and export page JSON immediately.
- Outstanding: secure cloud storage, durable server history, automatic transparent asset migration to R2, richer revision recovery, and testing that storage/migration works with very large pages. The earlier lost layers cannot be reconstructed solely from a screenshot.


## V3.5.1 — ASA IMAGE SCALE / WHOLE-TEXT FONT FIX (16 NOVEMBER 2026)

**Development URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.5.1

- User screenshots from Asa Hall page 7 confirmed tracing and layered reconstruction working, but Asa player photo could not enlarge sufficiently; changing text font size could show a saved value while rich inline sizes still overrode the visible base text.
- Raised **image/layer scale slider and exact entry** maximum from 250% to 600%, WIDTH maximum from 800 to 1600 design pixels, HEIGHT maximum from 900 to 2200 pixels. Existing saved dimensions remain unchanged; the user must enlarge explicitly.
- Labelled inspector font field **WHOLE TEXT SIZE (pt)**, extended its maximum to 150pt. Changing this explicitly removes conflicting embedded font-size declarations from this layer's rich HTML while retaining bold/underline/paragraph alignment and other styling. **Caution:** intentionally resets prior per-word size variations within that text layer, but only when user explicitly changes whole text size; partial word size edits in the top rich-text toolbar are still separate.
- Only V3 `programme-designer-v3-editor.html` (commit `2e01137dc2dc3d188dcb06979b23c1373aa666f2`) and `programme-designer-v3.html` (commit `f32bcea94d2069c9b1b557cf993e4eaa2b3c3016`) changed. JavaScript syntax checked. Browser UI verification pending. No browser drafts wiped or other versions / production pages edited.


## V3.5.0 — ORIGINAL-PAGE TRACING AND ASA CANVA SOURCE ASSETS (16 NOVEMBER 2026)

**Development URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.5.0

- User supplied five extracted original Canva PNG components for PDF page 7 **A Hundred for Hall**: `Top Black.png` (981x360, transparent margins), `Bottom Black.png` (960x156, opaque black), `Asa 100 with Shadow.png` (926x2048, transparent player cut-out with shadow), `16_subtle_diagonal_a.png` and `39_tall_flare_b.png` (both 1600x1000, transparent yellow brush effects). These are conversation attachments, **not uploaded to GitHub or imported into user browser draft**; use editor's existing ADD PHOTO control to import them individually. No automatic source-file transfer is implied.
- Added **ORIGINAL TRACE** on/off and **TRACE** opacity slider (5-100%) to the existing page editor's stagebar. Loads the original PDF page's JPEG blob from the separate `tivvy-v3-reference-art-v1` IndexedDB store using page's stable PDF-number ID, creates an object URL and places a pointer-events-none tracing image **behind editable content**. When tracing is enabled and available, hides the legacy `map` background in the rendered DOM only; never changes the saved layer data, original reference image, or image assets. It preserves source print page visually for positioning new layers. Slider/toggle state is stored under an independent per-page localStorage settings key. Defaults on at 40% for page 7, off for other pages. User may switch tracing off to see independent reconstructed elements.
- Source images remain stored only in browser; users must have imported V3.3 reference ZIP beforehand. The first display and interactions are **awaiting user browser QA**. Check page 7 trace at 40/100/off, import five Canva elements via ADD PHOTO, move/resize independently, and verify page 6 and page 14 unchanged. The editor's local image storage is still browser localStorage and may run out of quota for large PNGs, so perform a JSON backup before uploading numerous assets; server R2 migration remains pending.
- Changed only `programme-designer-v3-editor.html` (commit `939ce2d1c0d5874f859dbf9e6e63da4ce42470c4`) and `programme-designer-v3.html` (commit `5ec51c29c630c178b55c77706cc5cdd401dd1f86`). Syntax checked inline scripts. Existing V2/test and production files remain untouched. No claims of automatically extracted editable Canva shapes: the PNG layers are raster assets with transparency; recolouring individual strokes requires a future feature or replacement PNG.


## V3.4.0 — EXTRACT ARTWORK TO IMAGE LAYERS (16 NOVEMBER 2026)

**Development URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.4.0

- User verified original 54-page reference images display, and page 6 Latest News/page 14 editable results matrix remain functional with partial rich-text formatting in V3.3.
- User requested a first page-by-page editable artwork workflow, starting from PDF page 7 **A Hundred for Hall** and its brush-stroke graphics. Source inspection confirmed its print-page composition: black/yellow 100 GAME HALL header, white central article, Asa player cut-out, and black/yellow CONGRATULATIONS ASA footer.
- V3.4 adds **EXTRACT ARTWORK** to the read-only original reference view. Drag a rectangle over source art; name the crop; the image becomes a separate **unlocked, moveable, resizable** image layer in the existing V3 editor for that page. The editor accepts only same-origin, matching-page messages and PNG data URLs, and saves via the pre-existing per-page local draft mechanism. The original page reference and all other page drafts are not overwritten.
- **LIMITATION:** This is a rectangular pixel crop, not automatic vector deconstruction, background removal, text extraction or precise yellow brush stroke isolation. Crops include their rectangular printed background. Full separation of Asa's swooshes/headline/player and native article text remains future work; do not call page 7 fully rebuilt.
- Wrapped top toolbar now uses flexible page layout to avoid hiding the editor area when controls span rows.
- Changed **only** `programme-designer-v3.html` and `programme-designer-v3-editor.html`. Commits: editor `b85e0801c3db46d962f4acaa2013bce0ce3f6b36`, shell `46484d321030b9f2eea4f7ffb9124dd7c91b0d8f`, shell layout `5a8d49e1db4eb015b18203150eafcd9d20eb74ca`. Legacy tests, V2, Wix production, PDFs, Cloudflare and existing storage keys unchanged.
- JavaScript syntax checked before commit. **Interactive/browser QA pending:** on page 7 choose EXTRACT ARTWORK, drag a tight rectangle, name it, confirm EDIT LAYERS gains unlocked image, move/resize/undo/reload; verify page 6 and page 14 unaffected. A large crop might exceed localStorage; back up drafts first and watch for the visible save error. Source images remain separately stored in browser IndexedDB.


## V3.3.0 — 54-PAGE SOURCE REFERENCE IMPORT (16 NOVEMBER 2026)

**Test URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.3.0

- Updated **only** `programme-designer-v3.html` for the V3 development test. Source commit `1541153bd1385ef23a748f02eeb9cd21471e4964`.
- Added **IMPORT 54 PAGES**, using the user-provided reference ZIP `Tivvy-V3-Programme-Reference-54-Pages.zip` (containing `pages/page-01.jpg` through `pages/page-54.jpg`). The archive must be downloaded locally and selected once; reference images are **not** embedded or uploaded into GitHub.
- Added **ORIGINAL PAGE** (faithful, read-only PDF reference image per page) and **EDIT LAYERS** (existing V3 editor iframe). Images are stored as blobs in a separate browser IndexedDB database `tivvy-v3-reference-art-v1`, so original artwork does **not** overwrite or flatten editable layer data or the current V3 localStorage keys. The source page is found by stable manifest `source` reference; new/duplicated pages without a source show an explanatory message.
- Once the ZIP has been imported, default to the reference view for ordinary source pages, but keep pages 6 Latest News and 14 results matrix in the existing layer editor by default.
- Before completing an import, verify all 54 `pages/page-NN.jpg` entries exist; a failed import leaves the existing editor drafts untouched. Browsers with IndexedDB disabled or unable to load the JSZip CDN may need an alternate import path.
- Source PDF 54 pages was found in the user's file library and a reference pack/contact sheet was generated in the 16 November conversation. This is a **source preview import**, not automatic decomposition of editable objects, print-ready output, server sync, or R2 asset migration.
- The inline JS was syntax checked before commit. Live GitHub Pages/interactive browser QA is still required. Crucial checks: import ZIP, original page views 1/13/54, switch to EDIT LAYERS on pages 6 and 14, reload persistence, verify no overwritten V3 layers or page-management changes.
- Cloudflare progress reported by user on 16 November: D1 database `c1b9d190-7d76-45bd-95d9-6822ab514817`, R2 bucket `tivvy-programme-v3-assets`, five D1 tables verified via `/tables`, Zero Trust Free activated; Cloudflare Access domain and Worker deployment still pending. This status has **not** been independently verified by an authenticated connector. Do not represent cloud save as operational.
- **No edits** to V2, V2.9 test pages, production, or V3 layer editor.


Last updated: 16 November 2026 (UK)
Repository: `nickabull/Tiverton-Town-Control-Centre`

## V3.2.0 — SERVER STORAGE FOUNDATION CODED (16 NOVEMBER 2026)

**URL:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.2.0

- Created `v3-backend/migrations/0001_initial.sql`: D1 tables for issue metadata, numbered immutable snapshots, audit events, private asset records and staff roles.
- Created `v3-backend/src/index.js`: private Cloudflare Worker API; Access JWT signature verification against team JWKS, audience/issuer/expiry, staff allowlist/roles, create/read/save issues, list/restore revisions, audit listing, private R2 asset upload/download; D1 transactional saves with optimistic `expected_version` and independent revision ID check to prevent false-success on a conflict.
- Created `v3-backend/wrangler.example.toml`, `v3-backend/package.json`, and `v3-backend/README.md` with deployment checklist, limits, security controls and migration prerequisites.
- Updated `programme-designer-v3.html` to **V3.2.0** with a **STORAGE STATUS** dialog that links to the backend notes and offers existing JSON backup. **The editor is NOT yet cloud connected.** The visible badge still explicitly reads local draft/no cloud save. Commit `375c4d0b42554927569bb424fc15ab717c41fa6c`.
- JS syntax checks pass for both the storage Worker and shell. **No Cloudflare account/API connection is available in the current tools, so D1 and R2 haven't been provisioned, Worker has not been deployed, Access isn't configured, and no real end-to-end storage verification has occurred.**
- The first live migration will import V3 browser drafts only after secure login and backup; do not wipe or overwrite any old drafts. Test open on second computer and restore to new revision before treating this as production storage.
- The detailed per-layer before/after audit entries, Drive archive, asset content validation and live-editor API wiring remain future work; initial API records save events plus page/layer targets and immutable full issue snapshots.

**Next external dependency:** authorised Cloudflare operator must create D1 database/R2 bucket/Cloudflare Access app and provide binding IDs/AUD and secure domain. See `v3-backend/README.md`.

## V3.1.0 — STICKY FORMAT TOOLBAR + 400% ZOOM (16 NOV 2026)

User screenshot revealed that zooming and scrolling made rich text controls disappear because they lived in the scrollable stage. Updated `programme-designer-v3-editor.html`: stagebar and rich text formatting toolbar now use sticky positioning above page content while the page canvas scrolls, with high z-indices; zoom slider raised from 120% to 400% (5% steps), retaining the proven zoom scaling and keyboard/pointer movement. Outer `programme-designer-v3.html` now displays **V3.1.0** and cache-busts the embedded editor. URLs: https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.1.0. Git commits editor `d06e451283580d8de497934c90969c25bf1ced1f`, shell `ad745ac6408a65271f5138ecf139834b79e0a1bf`. Both inline scripts pass syntax checks; live browser interaction QA pending. **Version distinction:** GitHub commit history protects application code; programme document revisions and multi-user server-backed versioning are not connected yet; V3 drafts remain localStorage only.

## V3 follow-up (16 November, 13:51 UTC)

- User tested two page edits successfully and asked for **Ctrl/Cmd+C** on selected blue-box layer(s) followed by **Ctrl/Cmd+V** to paste duplicates, plus clicking the **grey workspace** to deselect and remove outlines. Implemented in `programme-designer-v3-editor.html` using per-session clipboard, preserved native text copying when editing text, multi-layer duplication with +15px offsets and Undo via save. Commits `ef82f7df9072b36586c4f212c9132ddcf52cd243` and follow-up grey stage click `b8d32cfb1fe1c8645fecaa81bb6cef3e24f72780`. Syntax verified, browser behaviour awaiting user test.
- **Fixed advert pages are protected, not immutable.** Eg Diamond Estate Agents should be locked by default with a clear **Unlock Artwork — Are you sure?** step, and support **Replace Image** preserving frame/position while retaining the old image in version history. This requirement has been added to `PROGRAMME-DESIGNER-V3-PLAN.md` and V3 page manifest; UI/backing storage implementation remains pending.

## V3 minor UI clean-up (16 Nov 2026)

Removed redundant legacy `v2.7.0` badge from V3 editor header and updated leftover V2.8.2 title/subtitle to `TIVVY PROGRAMME DESIGNER V3 · PAGE LAYERS`. **Only** `programme-designer-v3-editor.html` modified, commit `5778158a8c59991a6080fad8d97cde98e902c5b8`. User testing other functionality; no other functionality changed. The outer shell URL remains `programme-designer-v3.html?v=3.0.0` (reload to see editor change).

## V3.0.0 SHELL BUILT (16 NOV 2026)

Two new GitHub Pages development files now exist: `programme-designer-v3.html` (multipage shell) and `programme-designer-v3-editor.html` (the isolated proven page-layer engine). URL: https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.0.0. They support navigating 54 reference pages, independent page drafts, add/duplicate/rename/reorder/exclude/delete/restore, JSON backup, export-page-order preview and local searchable/CSV export DETAILS log. V3 initially seeds page 6 Latest News and page 14 matrix; other pages are blank map-background starter canvases. Changes are currently browser-local ONLY; cloud save, durable audit, Google Drive and faithful full-PDF reconstruction remain unbuilt. Both JS scripts passed syntax compile checks; browser QA pending. Details and commits in `PROGRAMME-DESIGNER-V3-PLAN.md`.

## V3 PAGE MANAGEMENT REQUIREMENT (16 NOVEMBER 2026)

User confirmed that pages must be dynamically added, duplicated, reordered, renamed, excluded from PDF export (without losing draft), deleted with recovery and re-included. This is essential when Darren's match reports run long or short. **54 pages is the reference issue, not a fixed V3 page limit.** Stable IDs remain unchanged when order changes; exporting recalculates page numbering from included pages only. Both editor page count and export count must be shown. Recorded in `PROGRAMME-DESIGNER-V3-PLAN.md` and `data/programme-v3-page-manifest.json`. Behaviour is specified but not yet built.

## V3 PROGRAMME REBUILD — NEW ACTIVE DIRECTION (16 NOVEMBER 2026)

User confirmed **Test 2 V2.9.2 is the preferred editor UI and layer engine**, and wants a genuinely new Programme Designer V3 combining it with the former V2 page navigation, Programme Centre automation, Darren report proofreading/grammar alerts, and a searchable/exportable DETAILS audit log. The source is the **54-page Bishops Cleeve programme PDF**, attached in the 16 November chat.

**Architectural documents created on GitHub:**
- [`PROGRAMME-DESIGNER-V3-PLAN.md`](PROGRAMME-DESIGNER-V3-PLAN.md) — migration principles, editor/proofing/audit/Drive specification.
- [`data/programme-v3-page-manifest.json`](data/programme-v3-page-manifest.json) — all 54 source pages with stable IDs and fixed/hybrid/editable/data classifications, initially not started.

The old Canva master registry is 52 pages, **not the same ordinal page mapping** as the 54-page uploaded PDF. Do not mutate the old master or old tests; new V3 should be a separate entrypoint with its own drafts and stable IDs. **V3 has not yet been coded as a complete editor; this is the foundation and implementation plan, not a finished migration.**

- First acceptance pages: 6 Latest News, 14 results matrix, 19 league table, 21+ report, 54 team sheet.
- Adverts can be protected full-page imagery; editorial content should be native editable objects.
- Proofreading must highlight exact ranges and support click-to-jump and accept/ignore, including repeated words, punctuation, spelling and grammar.
- DETAILS log must include actor/time/page/layer/action/before/after/source; searchable, filterable, exportable. For genuine multi-user audit, use a durable server-backed event log rather than claiming browser localStorage is authoritative.
- Google Drive saving and production promotion come after page QA, with versioning and recoverability.

## READ THIS FIRST — legacy test guardrails

**PREVIOUS ACTIVE EXPERIMENT (retain for reference):** `tivvy-latest-news-layer-test.html`.
**Current labelled test version:** **V2.9.2 for Test 2** (Test 1 and Test 3 are V2.8.3). (three separate tests).
**Open:** https://nickabull.github.io/Tiverton-Town-Control-Centre/tivvy-latest-news-layer-test.html?v=2.8.2

**DO NOT MODIFY `programme-designer-v2.html`**, `programme-studio.html`, the master production templates, or other programme files unless explicitly requested. The Latest News experiment is deliberately isolated. Despite the page's "V2" branding, it is NOT the same file as `programme-designer-v2.html`. When changing chats, inspect the actual file and recent commits before touching code; never infer the target from a generic phrase like "the designer".

## Goal

Develop a visual WYSIWYG layer designer for Tiverton Town programme artwork, testing it against the **Latest News** layout first, before any decision to integrate into wider programme production. Preserve the existing artwork, typography and safe master workflow.

## Latest work (16 November 2026)

- **Test 2 V2.9.2:** User confirmed arrow-key nudging works beautifully but wanted the red guides to appear when arrow nudging reaches exact alignment. Added `showExactNudgeGuides()` after keyboard repaint: compares left/centre/right and top/middle/bottom of all selected unlocked visible layers against other visible layers and page guide references, within 0.5px; shows red lines on exact matches only. Keyboard movement remains 1px or Shift+10px without magnetic position adjustment. Only Test 2 was changed; no edits to Test 1, Test 3, or production. Commit `3a81e43d892520592ec648283a3c6fe728fd45bb`. Browser verification pending.


- **Keyboard nudging (16 November):** In all three tests, Arrow Left/Right/Up/Down moves each selected *unlocked visible layer* by exactly 1 design pixel; Shift+Arrow moves it by 10px. Works for group selection. Keyboard nudging deliberately bypasses magnetic snapping for precise control; pointer dragging retains red snapping guides. Ctrl/Cmd+Z Undo preserves nudges, with closely spaced nudge keypresses grouped into a single undo step; normal text and score-cell editing are not intercepted. Code committed: Test 1 `591c8208fdd838a8d890f10b9a6a0d90e0b8a360` (V2.8.3), Test 2 `5cd45210b613134cbfc6865d3bf484012a8c6487` (V2.9.1), Test 3 `e86ab1a23a94e3be2f85d78f106e8ac94b4df541` (V2.8.3). Browser QA pending.


- **TEST 2 · V2.9.0 — EDITABLE RESULTS MATRIX:** User supplied screenshots of the League So Far original (22×22 results table, 22 crests across and down, grey Tiverton row/column, yellow diagonal and Tivvy header, Tiverton score numeral in red, seven-column club key with 22 club names/crests). Implemented in `tivvy-latest-news-chat-test.html` with new supporting `tivvy-results-matrix-layer.js`. Test 2 now automatically inserts a **single movable editable matrix layer**, with individually editable score cells (click to edit; Enter confirms), working club crests from the locked-crests library, and a club-code key that moves with the table. The editor has `+ RESULTS MATRIX` and `REFRESH PROGRAMME RESULTS` controls. Baseline scores derive from `data/results-matrix-binding.json` (approved home-columns/away-rows layout) and November 14 verified results in `nickabull/Tiverton-Town-Get-Results/verified-results.json`. Includes 10 verified November 14 scores, Tiverton 3–1 Bishops Cleeve. Browser refresh requests the existing `Tiverton-Town-Get-Results/data.json` Programme Centre feed and verified overlay, preserving marked manually edited cells. The results subtitle changes to the latest date where an existing text layer contains the expected title/date string. Updates only Test 2; Test 1 and Test 3 are unchanged. Commits: support script `1030a6eb0c24a5ed2bdc6b81e964a6ad7814bfed`; Test 2 page `57f5074e453df0e1d9073ddca6be225f685cc5e7`, date adjustment `0359bbde3dc4ae9da7140d68f18b825ed7884547`. **Browser visual QA and feed refresh behaviour NOT yet confirmed**. Page: https://nickabull.github.io/Tiverton-Town-Control-Centre/tivvy-latest-news-chat-test.html?v=2.9.2. User expects geometry, crests, club key and editing to closely match supplied screenshot; adjust based on their screenshots without flattening into a bitmap.


- **V2.8.2:** User observed unlocked original Yellow Footer still could not be deleted because `base` blocked all deletion. Now Delete Layer button deletes any **unlocked** selected layer including original artwork, with confirmation naming it and noting Undo; locked layers remain protected. The keyboard **Delete** or **Backspace** performs the same action unless editing text or an input; text editing keys retain their normal behaviour. Valid fallback selection after deleting the last heading. All 3 independent tests updated; no existing browser state or assets reset. Commits: Test 1 `48df8c3c7e915f0aa0c86f66fed6c60894665fc4`; Test 2 `3ace8fe5de99e5ba69316f6a72acf20bd0cc520b`; Test 3 `5a7026850dcd8bcbdb4177dab2a880a47a30afe0`. Live browser testing pending.


- **V2.8.1:** User requested Bring Forward and Send Back aligned in the two-column layer menu, and clearer delete wording. Reordered action buttons so **Bring Forward** and **Send Back** share a row on all three tests; changed label from 'REMOVE NEW LAYER' to **DELETE LAYER** and confirmation identifies the highlighted layer by name and indicates Undo is available. Protected original base artwork remains non-deletable/disabled. No existing browser-saved layers were modified. Commits: Test 1 `ac8fdf1429275d7f04dc3e1a0ea0efabe0fd9c12`, Test 2 `3b59b8bd6b6fed6355b1992a648cdfd8e8d9e36e`, Test 3 `6fef65e2b9a2eb92a3651577b4d53b25b6864077`. Browser QA pending.


- **V2.8.0 three-test structure:** User approved finished formatting proof and requests future work on chat integration, Darren's report, and an editable movable table. The left sidebar now links three separate HTML test files:
  - Test 1 · Formatting: `tivvy-latest-news-layer-test.html?v=2.8.2` (original browser autosave key preserved: `tivvy-v2-actual-artwork-test`).
  - Test 2 · Chat Add-In: `tivvy-latest-news-chat-test.html?v=2.8.2` (isolated autosave: `tivvy-v2-actual-artwork-chat-test`).
  - Test 3 · Darren Report: `tivvy-latest-news-darren-report-test.html?v=2.8.2` (isolated autosave: `tivvy-v2-actual-artwork-darren-report-test`).
  - Tests 2/3 clone the Test 1 layer state **the first time they open in the same browser**; they then save independently. They do not import browser-local state from other devices.
  - Keyboard shortcuts outside edit fields: Ctrl/Cmd+Z undo; Ctrl+Y or Ctrl/Cmd+Shift+Z redo; Ctrl/Cmd+A selects every visible unlocked layer. Shift-click selection and red guides retained.
  - Commit refs: Test 1 `6f7610812a7b3c542c5a78ee0d2f520c12d8e88a`; Test 2 `f32e7f3da28cef561ee54b6bf917bd8a97918ad8`; Test 3 `06535d9901d2084032ba281c487decfd5cea6ccf`.
  - Test 1 considered user-approved visually from screenshot (16 Nov 2026); no claim of pixel-perfect QA. Tests 2/3 are cloned workspaces ONLY — chat integration, Darren-report import, and editable/movable table have NOT been built yet. Browser QA for shortcuts and test switching pending.


- **V2.7.5:** User reported red snapping guides stopped working after multi-select. Root cause: group dragging bypassed `snapPosition()` and called `clearSnapGuides()` every move. Restored snap positioning for single and grouped drags, excluding all moving selected layers from snap targets; Alt still bypasses snapping. Commit `0c8eaf3dcd2a7d7e35c9c0f1e13532bc89739807`. Browser verification needed.


- **V2.7.4:** Added non-destructive colour and 0–30px width controls for an image-layer silhouette stroke using a browser SVG alpha-dilation filter; default stroke 0px. A transparent PNG is required for a player outline rather than an outline around a rectangular opaque photo. Commit `4dbd12ba182efc14f0866fe174c1b2ec53179c00`. Browser QA still pending; Remove Background itself is *not* yet implemented.
- **Verified by user:** V2.7.3 multi-selection is working well (16 November 2026). Retain this behaviour in future versions.


- **V2.7.3:** Added Shift+click selection of multiple layers from canvas or sidebar, visual selection for each layer, and dragging selected unlocked/visible layers together. Normal click selects one; double click still edits text. Commit `c9013ed257f29bc7862b6a30b55fdebe13e226ac`. Browser QA pending. Selection is not persisted as a layer property. Group resize is not yet implemented. User has also asked whether a "Remove Background" feature could be offered for images; feasibility discussion pending, do not claim it is built.


- **V2.7.2:** Fixed inconsistent rich-text size interpretation in the Latest News test. Layer font sizes render at 0.84 of design-point values, and selection formatting now follows the same factor rather than creating oversized words. Added two clear toolbar presets (**14pt BODY** and **18pt HEADING**) and a contrasting **CUSTOM · MODIFIED** indication for other sizes. Commit `1a5c29d99e0ff60cfbb25a6fef965ce7ab0b3ec5`. Browser testing is still needed; pre-existing saved oversized spans are not silently rewritten. A user can select their wording and apply the standard size explicitly. Next request: test inserting three article images using existing image buttons, without changing the page template.


- The user requested three independent blue resize handles for selected text boxes:
  - **Bottom centre:** vertical (height only).
  - **Right centre:** horizontal (width only).
  - **Bottom right:** both height and width together (existing behaviour).
- Implemented in the **test page** as labelled **V2.7.1**, GitHub commit `5027f05624cea1a91fa898351328c56a94b3b082`. Zoom and layer scale are accounted for in pointer resizing. **Needs live browser verification**; a commit is not proof the behaviour is correct.
- An earlier chat-continuity error caused these controls to be applied to `programme-designer-v2.html` instead. That mistake was **reverted**; V2's blob was restored to its original hash `31a793a02fa824c4ca4fe8c9766f04d404e32946` in commit `09a22397564214cdaf63d61b22e404473874253e`. Do not repeat this.

## Features and feedback carried over from “Update league matrix”

- The test-page editor uses the actual exported Latest News artwork and layered objects.
- Layer selection, lock/hide, ordering, movement, size and scale controls.
- Inline precision numeric boxes should visually match the corresponding slider widths; user specifically called out values such as "9" and "200".
- Separate editing toolbar above the artwork supports selectively applying bold, underline, strikethrough and alignment *within* text, instead of applying formatting to the whole text box.
- User confirmed they could bold a single word (e.g. “Evander”) and centre only part of the text; preserve this.
- The bold/underline/other active controls should visually turn Tivvy yellow when appropriate to selected text.
- Left, centre, right and justify buttons should have intelligible icons and truthful behaviour; user found left/right icons confusing.
- Layer renaming and duplication were requested. The current test file includes RENAME LAYER and DUPLICATE LAYER controls; duplication names the new layer `Copy of [original name]`. Retest after changes.
- Layer width/height must change box geometry, not unexpectedly alter font sizes or adjacent layers.
- The editor uses browser `localStorage` key `tivvy-v2-actual-artwork-test`; retaining saved user test-state matters. Avoid changes that delete local state without explicit permission.
- The user's wider programme aesthetic uses Antonio, Tivvy gold/black and carefully maintained layouts. Do not redesign the template during functional testing.

## Next steps

1. Ask user to test V2.7.4's three resize handles on the blue selected text box; check that each moves only the intended dimension, and that handles work at varying zoom.
2. If issues appear, change **only** `tivvy-latest-news-layer-test.html`, then supply a new cache-busted version URL.
3. Continue refining text-format active state, alignment controls and matching slider/numeric boxes as feedback requires.
4. Update this handover after every significant edit, including exact filenames, versions, commits, pass/fail findings, and outstanding issues.

## New-chat startup procedure

1. Read this file first.
2. Fetch the GitHub version of `tivvy-latest-news-layer-test.html` and inspect recent commits; treat those as authoritative, not a remembered "V2" version.
3. Confirm the exact target file and version *internally* before making edits.
4. Preserve the isolated experiment and protected templates.
5. Make the requested change, verify what can be verified, identify untested parts honestly, update this document, and provide the precise test URL.

## Notes

This is a working handover, not a claim that every feature has passed browser QA. The earlier chat “Update league matrix” contains additional screenshots and incremental feedback that may need consulting for design detail.

# Tivvy Programme Designer — project handover

## V3.7.2 AVIF original artwork support — 18 Nov 2026, 01:17 GMT

- User ran the deployed `/cloud-import` **ANALYSE BACKUP — NO UPLOAD** with `tivvy-programme-v3-issue14-local-backup-2026-11-18_01-13-30.json` (316.1 MB). Screenshot confirms **60 active pages**, **0 deleted-page recovery**, **66 embedded image occurrences**, **17 distinct data URL values**. MIME occurrence counts: `image/png:63`, `image/avif:2`, `image/jpeg:1`.
- Both blockers were original AVIF images from `Cover – Louis Smith`, specifically `/5/src` and `/6/src`. **AVIF is an expected supported original photography format**, not damaged content; user explicitly forbids conversion/compression/resizing of Viv Curtis original art.
- Updated the storage Worker API allowed media types and the embedded importer list to include `image/avif` and preserve original bytes; commit `370f482c3e237f591873fbb5ccd8f3795759d9da`. Parsed Worker JS and nested importer client JS successfully (**STATIC PASS**).
- Updated Designer shell readiness scanner to accept AVIF and version label V3.7.2, commit `33f89c3a41271eed14d9057068d6e9b5a8e079e2`; shell syntax **STATIC PASS**. Existing PNG/JPEG/AVIF inputs will not be modified by this change. No browser local draft writes performed.
- **Deployment PENDING:** GitHub Actions auto-push remains intentionally off and connector lacks workflow dispatch; user needs one explicit `deploy` run of `.github/workflows/deploy-tivvy-programme-storage.yml`. Next check /cloud-import can re-analyse the 316.1MB backup as zero unsupported assets. No cloud artwork upload has occurred.
- **Caution:** the importer currently loads the full 316.1 MB JSON into browser memory and copies decoded blobs during upload; quality preservation is guaranteed by intended byte-identical R2 transfer/checksum but actual performance/recovery with this complete backup has NOT been verified. Keep original browser draft and full JSON backup safe, test small disposable upload and cloud read-back before migrating actual images. Reference PDF page source artwork remains outside the JSON archive and not yet cloud-migrated. Claiming full cloud editor sync or print-ready backup would be premature.


## Cloud Import live screen QA PASS — 18 November 2026, 01:12 GMT

- User screenshot from deployed `/cloud-import`: heading `TIVVY · SAFE CLOUD MIGRATION`, green `Authenticated · admin`, complete backup file input, active `ANALYSE BACKUP — NO UPLOAD` control, correctly disabled `UPLOAD VERIFIED CLOUD COPY` control, `No backup selected` and `No cloud upload started`. Confirms new code deployed and administrator identity route functional. No import file selected, no image or issue migrated, no archive validation or recovery QA yet.
- GitHub run #3 previously confirmed Wrangler deploy of Worker version `df93d953-c646-4e92-8033-15208fc19259`; separate recent workflow patch `preview_urls:false` still requires next explicit deploy.
- Next user task: in existing browser Designer use `BACKUP JSON` to download FULL draft; then on Cloud Import choose that full local backup and click `ANALYSE BACKUP — NO UPLOAD` only. This is a read-only preview; migration cannot proceed until cover MIME types and full PDF reference-art scope are resolved. Warn not to click upload. Screenshot only confirms initial UI, not full save.


## First GitHub Actions Programme storage deployment VERIFIED — 18 Nov 2026, 01:03 GMT

- User successfully added `TIVVY_PROGRAMME_CLOUDFLARE_API_TOKEN` and `TIVVY_PROGRAMME_D1_DATABASE_ID` encrypted GitHub Actions secrets; previously configured `CLOUDFLARE_ACCOUNT_ID` existed. User manually dispatched new isolated Programme Worker workflow #2 dry-run and #3 deploy.
- GitHub workflow run **#3**, run ID `44212815903`, job ID `134495168117`, has conclusion `success`; connector retrieved job steps and full logs. All checks passed, including final **Deploy this Worker only when explicitly enabled**. Wrangler logs explicitly confirm `Uploaded tivvy-programme-v3-storage`, binding `ASSETS` to `tivvy-programme-v3-assets` R2, binding `DB` to D1, deployed named worker to `https://tivvy-programme-v3-storage.nickabull.workers.dev` at 2026-11-18T01:03:49Z, Worker version ID `df93d953-c646-4e92-8033-15208fc19259`. This validates autonomous **GitHub→Cloudflare Worker deployment** with no manual code paste. Deployment source includes V3.7 cloud importer and streamed 95MB single upload route; **authenticated runtime QA still pending**, so do not claim artwork sync is complete.
- GitHub logs WARNED that default preview URLs were enabled. Immediately patched generated Wrangler configuration to `preview_urls: False` in workflow, commit `8d8c5cb8ba8c9f1367dc732091ed803209a5c93b`; that patch **has not yet been deployed**, as push auto-deployment remains intentionally off. On next explicit deployment, verify preview URLs disabled. Security audit for Access protection on any existing preview deployments may be needed.
- Next check: refresh live `/cloud-vault` and load `/cloud-import` in authenticated browser and confirm Access identity, D1 issue list, artwork routes; run safe disposable test only, do not upload real artwork until cover MIME, full reference artwork, and rollback readiness handled. Keep other Workers unchanged. Later only consider enabling auto-deploy after smoke-check gate is built.


## Tivvy Programme dedicated GitHub-to-Cloudflare deployment workflow and reusable Skill — 18 November 2026, 00:31 GMT

- User approved creating a way for ChatGPT-led GitHub code updates to deploy to Cloudflare without repeated manual copy/paste. Investigated existing repo workflow `.github/workflows/deploy-tivvy-live-service.yml`; it is **specifically for unrelated Tivvy Live collector** and must remain untouched.
- Created NEW isolated `.github/workflows/deploy-tivvy-programme-storage.yml`, committed at `dd7ce56997648472552fd5a626759d85e4f7ed8f`. Workflow manually dispatches with `dry-run` default or `deploy` explicit option, and can later be enabled on code pushes with repository variable `TIVVY_PROGRAMME_AUTO_DEPLOY=true` (OFF unless intentionally configured). Runs source syntax preflight; generates ephemeral Wrangler JSON with only existing Worker name `tivvy-programme-v3-storage`, D1 `DB` binding using secret `TIVVY_PROGRAMME_D1_DATABASE_ID`, existing R2 `ASSETS` bucket, `workers_dev:true`, `keep_vars:true`; runs Wrangler dry-run before any live deploy. Keeps Access runtime variables configured on Worker and does not expose the Access AUD. Source was re-fetched and basic path/guard checks passed.
- Deployment still requires user/admin **one-time secret setup**: account ID (`CLOUDFLARE_ACCOUNT_ID`, may already exist), specific D1 UUID (`TIVVY_PROGRAMME_D1_DATABASE_ID`), scoped existing Worker Editor API token (`TIVVY_PROGRAMME_CLOUDFLARE_API_TOKEN`). Never send secrets in chat. Verify Cloudflare Access protection, Worker bindings/routes and first dry-run before initiating first live automated deploy. No deployment run has been triggered; CI test status **PENDING**. The GitHub connector currently available cannot dispatch workflow runs or manage repo Actions secrets.
- Created validated and packaged reusable `tivvy-cloud-deploy` skill ZIP, with source-safety and handover instructions and one-time setup guide. Package `skill.zip` generated for user; not installed automatically. Skill alone does not grant access or perform deployments.
- Web-verified Cloudflare documentation: Wrangler CI requires API token and account ID; granular Editor permission can target one Worker; `keep_vars` helps preserve dashboard-defined variables, but route and binding config still requires inspection. First live deployment requires manual QA. User's full-resolution originals, browser drafts, and unrelated Cloudflare Workers untouched.
- **Next action:** configure secrets in GitHub UI, run named workflow `dry-run` and validate logs, then first `deploy` and authenticated Cloud Vault/browser recovery tests. Only thereafter enable automatic push deployments. Record actual run URL/result and post-deploy smoke tests before declaring automation operational.


## V3.7.1 — READ-ONLY UNSUPPORTED ARTWORK DIAGNOSTICS (18 NOVEMBER 2026, 00:24 GMT)

- Extended the existing browser-cloud readiness checker to record the **exact MIME type, nested layer-property path and size** for unsupported embedded data URLs. Also flags embedded `data:` markers inside longer text strings for manual review rather than silently treating them as safe. This permits identifying the two previously opaque cover assets without modifying, compressing or exporting the actual private artwork bytes.
- Upgraded V3 shell badge/dialog to V3.7.1; updated manifest/editor cache-busting link. Read-only cloud readiness JSON now includes `unsupportedDetails` and `embeddedDataInText` per page; the dialog summary lists unsupported MIME/path items when found. V3 shell commit `89df56c39eec2f8dd7134d9cd3f1a760ffb22e17`.
- V3.7.1 JS inline syntax parsed successfully in V8 (**STATIC PASS**). Live browser QA, worker migration deployment and actual full issue transfer are pending. No artwork or browser drafts changed.
- Continue prioritising the 60-page programme's full original quality and source-reference pages; do not claim the archival copy replaces editable local drafts or original full issue PDF. Existing storage Worker requires deployment before `/cloud-import` works.


## V3.7.0 — protected staged cloud archival migration coded (18 November 2026, 00:24 GMT)

- User explicitly authorised proceeding with cloud migration without repeated approval pauses. Implemented a separate authenticated and role-gated `/cloud-import` screen on the existing Programme storage Worker source, reachable from Cloud Vault and V3.7.0 shell > MORE TOOLS > CLOUD STORAGE. This is a **source-code implementation, NOT a live deployment**.
- Cloud importer accepts a **FULL `tivvy-v3-draft-v2` BACKUP JSON**, not the small readiness report; validates issue structure and page IDs; inventories data-URL assets and MIME types and explicitly blocks unsupported media or >95MB originals before any cloud transfer. User first runs **ANALYSE BACKUP — NO UPLOAD**. Its browser page also warns that separate PDF reference-page images stored in `tivvy-v3-reference-art-v1` are not contained in this backup.
- A distinct **UPLOAD VERIFIED CLOUD COPY** action creates a NEW, uniquely named `import_<uuid>` D1 staging issue with version 1 and no pages; for supported base64 assets it sends the ORIGINAL byte buffers as Blob to the authenticated same-origin R2 asset route, downloads them back, checks SHA-256, deduplicates by MIME+hash, and only then creates a D1 version-2 document referencing asset IDs, SHA-256, MIME and sizes. The importer verifies issue version and page count via server read-back. Original IndexedDB/localStorage state is **read only** throughout. If errors arise, the staged issue remains incomplete, with no false save success. The browser input's explicit confirm only authorises a separate cloud copy, never overwriting the existing browser programme.
- New archive document captures active editable pages, page attributes/positions, deleted-page recovery pages and their artwork, source activity history and active page ID. The document is marked `migrationState: ARCHIVAL_COPY_NOT_EDITOR_READY` and `referencePdfArtIncluded:false`. It is NOT yet directly consumable as a complete editor draft or final printed issue and does not include independently stored 54-page reference PDF imagery. Real editor cloud sync/restore, full source-reference images, multi-part >95MB transfers, unattended resume after disconnection, Google Drive backup, and PDF-quality checks remain TODO.
- Existing two unsupported embedded cover assets were only counted by prior readiness report, not identified by exact MIME; importer will block and report their MIME/page/layer path rather than losing or transcoding Viv's originals. Note full backup may be hundreds of MB; a browser memory-safe streaming parser/resumable upload is still needed for genuinely huge files. Current code uses `File.text()` then JSON.parse and should be trialled first on a small disposable/limited backup, not immediately treated as safe for a huge production asset migration. No actual user image bytes were uploaded in this development turn.
- Backend commits `c554adb03d6aebe1f144e259f05de0a4676cda51`, `01fb4b4e864d6bfdf4d9cdc55e2957e5f6ab0bc8`, `0699c47004749239ad1fb49eefea6aecaa023b2b`; V3.7.0 shell commit `bedb2397d4bded319fbf818d6a8bb90d7ab5ca6e`. Re-fetched source: Worker JS static syntax **PASS**; extracted browser cloud import client script syntax **PASS**; shell JS static syntax **PASS**; route declared after JWT/member auth **PASS**; shell link **PRESENT**. **LIVE DEPLOYMENT/BROWSER QA NOT RUN**. Existing protected Worker is still previous deployed version until updated; therefore `/cloud-import` can return 404. Do NOT claim migration is complete.
- Next: deploy only updated `v3-backend/src/index.js` to existing Access-protected storage Worker, preserve all D1/R2/Access bindings; verify protected importer UI and small harmless staging backup; use full backup PREVIEW to identify unsupported cover MIME/path, design safe handling and ensure source reference pages are included; then run verified cloud clone with size/memory and resume safeguards. Only enable live cloud primary storage when entire issue including original assets can be opened across devices and recovered. Keep original artwork and browser data until proven recoverable.


## V3.6.23 — LOSSLESS LARGE ORIGINAL ARTWORK UPLOAD (18 NOVEMBER 2026, 00:19 GMT)

- User explicitly requires original Viv Curtis photography preserved without any compression, downsampling, pixel modification, or image recompression. The previous 12,000,000-byte limit was an arbitrary application constant, **not** an R2 capacity limit. Official Cloudflare docs confirm Workers Free/Pro incoming request body 100 MB, worker memory 128 MB, streaming R2 `put()` for known-length request body, and multipart R2 up to 5 TiB. Do not claim a single HTTP upload supports multi-GB without multipart infrastructure.
- Updated `v3-backend/src/index.js`: changed single-asset route from full `request.arrayBuffer()` buffering and 12MB cap to `env.ASSETS.put(key, request.body, ...)` streaming with a deliberate **95,000,000-byte** ceiling to leave headroom below commonly applicable 100MB Cloudflare request cap. Requires valid positive Content-Length, verifies returned R2 `object.size` matches declared size, then records exact original byte count in D1 metadata, with R2 cleanup on mismatch or D1 failure. No image transforms or compression introduced; original bytes passed through untouched. JSON issue 3MB snapshot limit unchanged because images belong in R2.
- Existing MIME allowlist remains PNG, JPEG, WebP, GIF, PDF. The two unsupported content types on cover are still unresolved; do not make unsafe SVG executable inline or silently transcode originals. Future proper multipart upload for original files >95MB remains required. For truly large photos, consider direct R2 multipart or separate approved original archival storage, with checksum verification and secure access.
- Backend commit `643f817b40d12d9d4ee453ad44c9f671f77d5088` and shell V3.6.23 readiness cap/status commit `6c61c071265f5bbfae54067cb9322ede5dae2d65`. Both JavaScript scripts passed V8 static syntax checks. **NOT YET DEPLOYED** to Cloudflare, **NOT LIVE TESTED** with a larger image. Need deploy only the existing `tivvy-programme-v3-storage` Worker, preserving Access, DB/R2 bindings and secrets, and then run disposable checksum test on an image larger than old 12MB cap before marking complete. Existing pages, user drafts, originals, and unrelated Workers not changed.
- Existing readiness report estimated five >12MB occurrences: once on the cover and four Page39 copies, all well under 95MB. V3.6.23 re-scan should report no >95MB occurrences (provided no additional image data changed), but 2 unsupported types remain; rescan is unverified. Distinguish **CODE COMMITTED** from **LIVE QA PENDING**.


## V3.6.22 detailed browser readiness report inspected — 18 November 2026, 00:16 GMT

- User uploaded `tivvy-v3-cloud-readiness-2026-11-18_00-16-27.json`, checked at `2026-11-18T00:16:22.771Z`. Report is read-only and records 60 pages, 46 saved drafts, 14 no-draft entries, 66 embedded data-URL occurrences, estimated embedded bytes 236,898,508 (~236.90 MB), 5 over 12 MB, 2 unsupported. All listed page `error` fields null. The report does not contain actual artwork bytes, asset content hashes, MIME details, or downloadable backups.
- Exact oversized occurrences: original cover `issue-20261114-p01` (largest 12,217,326 B, 1 over limit, 2 unsupported, 12 asset occurrences), original Meet the Opposition P39 `issue-20261114-p39` (largest 13,840,266 B, 1 over limit, 8 asset occurrences), and three excluded Swindon P39 trial drafts `v3-mwl9k3s7-5w4eec`, `v3-mwl95b6f-1b6vta`, `v3-mwl71hli-kdk9j3` (each largest 13,840,266 B, 1 over limit, 8 asset occurrences). These exactly account for all five over-limit asset occurrences.
- Page 6 Shirt Latest News trial, Page 7 A Hundred for Hall, Page 8 Club Officials and Honours, Page 14 Shirt trial and Page 19 Shirt trial also contain sizeable artwork but none exceeds individual 12 MB limit. Some report values repeat identically between trial and source; this strongly suggests duplicate artwork **but does NOT verify byte-for-byte equality or content hashes**. Plan content-addressed deduplication only after hashing actual bytes and checking permissions.
- Important: 14 no-draft pages must not be treated as damaged or deleted; untouched fixed/reference pages may legitimately lack individual editable draft records. Unmodified adverts with one small starter draft may still rely on separately stored read-only reference PDF pages, which are NOT included in this migration report. End-to-end cloud completeness must account for reference images as well as editable draft layer data.
- Next code phase should safely inventory each embedded asset by location, MIME, bytes and SHA-256 hash (do not put private base64 in report), check reference art archive separately, preserve all originals and user browser drafts, and stage uploads in reversible batches with verified R2 download/checksum before any D1 document references are promoted. Do not silently compress/crop oversized originals or claim cloud save works.
- This is an analysis of the user's uploaded report, not a new live upload or actual asset-hash check.


## V3.6.21 user browser cloud readiness scan + V3.6.22 status fix — 18 November 2026, 00:13 GMT

- Screenshot of user's actual V3 storage dialog after pressing CHECK ALL PAGES FOR CLOUD SAVE shows **read-only scan complete** and **REVIEW REQUIRED**. 60 programme pages, 46 saved page drafts, 14 pages without stored layers, 66 embedded data-URL assets estimated at 236.90 MB, 5 individual assets over 12 MB Worker R2 upload limit, 2 assets with unsupported MIME types. Screenshot does not identify which pages/assets; obtaining the exported detailed readiness JSON is the next step. Note 14 pages without saved layers are not proven lost/damaged; could be untouched reference/fixed pages. Estimate counts occurrences of data URLs, not necessarily unique binary assets.
- Screenshot also exposed stale V3.6.20 modal label and incorrect text claiming Cloud Vault Worker not yet deployed. Updated ONLY V3 shell textual status to **V3.6.22**, accurately noting previously verified live Cloud Vault deployment, admin login, issue listing and revision display. Shell commit `3c2a2e8c3bec8f184bf00fb3a7958fff43e67a8c`; JavaScript static syntax PASS. Browser QA for V3.6.22 pending. No artwork or IndexedDB edits made.
- **Migration gating:** 236.90MB cannot fit as one D1 issue snapshot; need per-image R2 uploads and smaller D1 layer references. Inspect detailed report for the exact oversized and unsupported assets before deciding whether to increase backend upload limit, optimise originals, or change handling. Preserve user originals pixel-for-pixel and record checksums. Actual R2 storage for real artwork and recovery are NOT tested; no real cloud upload conducted.
- Readiness scan itself **LIVE BROWSER PASS** (user screenshot); readiness result **REVIEW REQUIRED**; full issue cloud save **NOT READY**; production PDF **NOT READY**.


## V3.6.21 — READ-ONLY CLOUD MIGRATION PREFLIGHT (18 NOV 2026, 00:10 GMT)

- User approved continuing to cloud-backed issue saving, without pausing for repeated approvals. Inspected V3 shell's per-page IndexedDB draft schema and existing full JSON backup: browser pages live under `tivvy-v3-drafts-idb-v1/pageDrafts`, current page is flushed before backup, and rich layer snapshots can contain embedded base64 artwork. Existing backend limits issue JSON to 3,000,000 bytes and a single R2 upload to 12,000,000 bytes. Do not pretend a whole legacy 168MB backup fits directly in D1.
- Added V3 shell **V3.6.21** under MORE TOOLS > CLOUD STORAGE > **CHECK ALL PAGES FOR CLOUD SAVE**. Reads all saved V3 page layer drafts (with legacy localStorage fallback) after confirming editor flush; produces per-page layer counts, byte sizes, embedded data-URL asset counts/estimated sizes, over-12MB asset count, unsupported media count and malformed draft errors. Summary appears inside the storage dialog; **DOWNLOAD READINESS REPORT** exports timestamped, read-only JSON. No API fetch, R2 upload, local draft write, master/artwork alteration, page reset or cloud-save acknowledgement is performed.
- The audit is an initial **migration inventory**, not a full validator of all image representations or cloud sync. Data URLs and raw page JSON may still contain references that require mapping or manual review; cannot know actual success without testing user's browser drafts. It does not provide image deduplication, asset-referencing, multi-user conflict handling or print-PDF QA.
- Shell commit `6dc774f198ea0133da6947c2bbf8a4f42248e73a`. Re-fetched and parsed updated inline shell JS with V8: **STATIC SYNTAX PASS**; checked UI and no audit write paths. **BROWSER QA PENDING** on user's existing browser. No backend deployment needed for this UI-only change. Development source and existing drafts isolated.
- Next: obtain readiness scan results without exposing large embedded assets; use those results to design staged, reversible R2 asset uploads and D1 metadata references, then cloud save/verify/restore and cross-device checks. Do not call anything cloud-saved until a complete issue clone and its assets can be recovered reliably.


## V3.6.20 Cloud Vault issue selection and revisions live QA PASS — 18 November 2026, 00:09 GMT

- User provided screenshot of authenticated deployed Cloud Vault after selecting `DISPOSABLE R2 ARTWORK TEST · v1`. UI displays `Version 1 · 1 pages · cloud record only`, enables DOWNLOAD SELECTED ISSUE JSON, enables LOAD REVISIONS, and after loading displays `Version 1 · 2026-11-17T23:59:16.254Z · Initial issue`.
- **Screenshot-confirmed browser PASS**: selecting an existing cloud issue, fetching/displaying the issue document version and page count, enabling appropriate controls, fetching/displaying D1 revision history. **JSON download availability PASS, actual file download/content NOT VERIFIED**. This does not test restore or cloud persistence of user's browser artwork. Source artwork and local drafts unchanged.
- Next: maintain explicit separation of live-tested cloud API functionality versus UI-only/source-committed code; build non-destructive migration under tested backup/restore and large-R2-image constraints. Anonymous asset GET still pending.
- No code changes made in this checkpoint.


## V3.6.20 Cloud Vault deployed: live screenshot PASS — 18 November 2026, 00:08 GMT

- User deployed updated `v3-backend/src/index.js` to the existing Access-protected `tivvy-programme-v3-storage` Worker through Cloudflare editor. Screenshot of `/cloud-vault` displays `TIVVY · CLOUD VAULT`, green `Protected connection verified · role: admin`, issue chooser, and `2 cloud issue(s) found. Browser-only artwork is not included.` This proves **live Worker route deployment, protected admin API identity and D1 issue-list fetch, and basic Cloud Vault HTML render PASS**.
- The screenshot shows issue chooser at `Select an issue` and the download/revision buttons still disabled as designed; **issue selection, revision-list retrieval and JSON download have NOT yet been browser-QA-tested**. Do not claim a full production cloud save or image migration. No evidence of modification to browser drafts or original page artwork.
- Next staged verification: choose disposable D1 test issue; confirm version/pages and click LOAD REVISIONS; download selected issue JSON and inspect contents. Separately test that anonymous R2 asset requests are blocked. Only afterward design reversible upload/reference migration and conflicts/recovery controls. Keep existing IndexedDB backups and all source masters intact.
- Status: code COMMITTED; live deployed route + authenticated admin/list PASS (user screenshot); selected-issue/revision/download PENDING; full browser artwork cloud sync and PDF PENDING.


## V3.6.20 deployability check — 18 November 2026, 00:02 GMT

- User authorised continuing without repeated approvals. Inspected available connected tools and repository GitHub Actions. There is **no Cloudflare Worker deployment tool/connection**; existing `.github/workflows/deploy-tivvy-live-service.yml` targets unrelated live collector, and there is no dedicated authenticated Programme V3 Worker deployment workflow. Do not repurpose it, overwrite the live collector, or claim the storage Worker was deployed.
- Re-fetched GitHub `v3-backend/src/index.js` and `programme-designer-v3.html`. Independently compiled both Worker JavaScript and shell inline JavaScript with the V8 JavaScript parser: **SYNTAX PASS**. Checked `/cloud-vault` route is after JWT+member validation: **STATIC PASS**. Checked shell's Cloud Vault link: **STATIC PASS**. Neither Worker runtime behaviour nor UI browser QA could be executed by available read-only browser tools. The Cloudflare protected Worker live deployment **remains pending**.
- Attempted container-based remote source download for additional checks, but container networking could not resolve GitHub. Used connected GitHub fetch and V8 parsing instead. No code changes in this check. Browser-draft artwork and existing Cloudflare bindings remain untouched.
- Deployment should be limited to the existing `tivvy-programme-v3-storage` Worker, using verified GitHub `v3-backend/src/index.js` while retaining Cloudflare Access All Traffic, D1 `DB`, R2 `ASSETS`, ACCESS_AUD secret and ACCESS_TEAM_DOMAIN; do NOT deploy the outdated `wrangler.example.toml`. Before declaring operational, test protected `/cloud-vault`, issue list, revision display and JSON download, and separate forbidden asset GET. Keep cloud save/sync disabled until safe reversible migration.


## V3.6.20 — first cloud storage controls staged (18 November 2026, 00:00 GMT)

- Following user approval to proceed after six passing live R2 tests, committed a first **read-only and non-destructive** Cloud Vault integration stage: V3 shell now labels **V3.6.20**, MORE TOOLS > **CLOUD STORAGE** opens a truthful status panel, retains local BACKUP JSON, and links to an authenticated Cloud Vault at `https://tivvy-programme-v3-storage.nickabull.workers.dev/cloud-vault`. Shell commit `6ee596f7633d5bdc3962882ef68d3cff2b65f58c`.
- Backend `v3-backend/src/index.js` now has a `/cloud-vault` HTML route **after Access JWT and D1 member verification**; browser-only same-origin UI shows authenticated role, cloud issue list, chosen snapshot version/page count, revision history and explicit JSON download. It provides no editing, uploading or restore operations and does not touch IndexedDB. Backend commit `b50a13d825f87c2accf792b13c389a9d2aa5862d`.
- **IMPORTANT DEPLOYMENT LIMITATION:** GitHub backend source is committed, but Cloudflare Worker deployment was **NOT performed**. Do not claim the `/cloud-vault` route works on the live Worker until explicitly deployed and browser-tested. A user visiting its link before deployment should expect an HTTP 404/Not found. Existing live backend and unrelated Workers were not changed.
- **QA state:** GitHub changes committed, source re-fetched for spot-check; actual JS compile, browser UI test, cross-origin behaviour and live Worker deployment **NOT TESTED**. The implementation deliberately avoids direct fetch from GitHub Pages into Access-protected Worker, since the deployed Worker only accepts same-origin mutations and does not offer cross-origin credentials/CORS. A proper full editor save/sync needs a separate, secure reviewed design.
- Next steps: safely deploy only the updated backend source to existing protected `tivvy-programme-v3-storage` Worker (preserve D1 `DB`, R2 `ASSETS`, existing Access runtime secrets and edge access). Verify `/cloud-vault` identity/issue listing/revisions/download and unauthorised asset rejection; then phase in explicit backups, reversible issue and image migration, conflict UX and cross-device testing without destroying the user's existing browser drafts. Full PDF and master page designs remain untouched.


## Live R2 disposable artwork round-trip — 17 November 2026, 23:59 GMT

- User provided a Chrome DevTools screenshot of the approved same-origin live test on the Cloudflare Access-protected `tivvy-programme-v3-storage.nickabull.workers.dev` Worker. **All SIX visible checks PASS**: (1) create a new disposable issue HTTP 201; (2) upload 1x1 PNG to private R2 HTTP 201; (3) download from private R2 HTTP 200; (4) downloaded image has the original exact byte count **68 bytes**; (5) downloaded SHA-256 matches uploaded image; (6) downloaded MIME is `image/png`. This is **screenshot-confirmed real D1 issue and R2 object storage success** for disposable data.
- Test generated a fresh `test_r2_<uuid>` issue and 68-byte disposable PNG; no real programme page, browser IndexedDB draft, source artwork, production PDF, or approved master was changed. Leave test data for audit until separately authorised cleanup.
- The test ran in an authenticated session and does **not** independently test unauthenticated/forbidden R2 GET, large photographs/PDFs, image-library quota, concurrent writers, repeated transfers, cross-device identity, or cloud editor integration. Pre-existing Cloudflare Access login challenge had been screenshot-tested earlier, but private asset rejection still requires a dedicated check.
- **Next work:** non-destructive unauthorised asset access check; then integrate explicit cloud connection/save/revisions/recovery and user-controlled image upload UI in development-only V3. Keep downloadable local JSON backup and browser IndexedDB untouched until end-to-end cloud round trip has been verified with a cloned issue and user approval. Note backend allows 12 MB per individual asset and 3 MB per issue document: real image data must be stored in R2 references rather than embedded in D1 JSON.
- Test status: R2 upload/download/bytes/checksum/MIME **LIVE PASS (user screenshot)**; unauthorised GET **NOT TESTED**; editor sync **NOT BUILT**; browser QA of V3.6.19 preflight **PENDING**; print-ready PDF **NOT VERIFIED**.


## V3.6.19 continuity audit and R2-first next stage — 17 November 2026, 23:54 GMT

- Resumption verified current full handover (652 lines at beginning of check), recent GitHub commits, and current source of V3 shell, V3 editor, backend Worker, backend README and V3 plan. This was a **repository/code inspection**, NOT new browser QA. Current shell/editor label: V3.6.19.
- Latest verified live test remains the 23:53 **disposable D1 six-PASS round trip** (issue creation, read, versioned save, stale-edit 409, restore, original text verification), recorded in commit `05aac04d1dbbb0fd6978b1f4c31a3b6fd5c2fe0b`. This does NOT verify private R2 asset uploads, or full Designer cloud integration.
- Current browser artwork/layers remain local IndexedDB with legacy localStorage fallback; versioned local JSON backup and recovery controls exist. Editor exposes read-only PROGRAMME PREFLIGHT for text clipping/overlap, but its **in-browser V3.6.19 visual QA is pending**. Print-ready whole-issue PDF, bleed, image collision/licensing, final export validation are **not yet implemented/verified**. The shell explicitly says cloud saving and print-ready PDF are not connected.
- Code inspection confirms `v3-backend/src/index.js` provides authenticated same-origin `POST /api/issues/{id}/assets` and `GET /api/issues/{id}/assets/{assetId}`, with allowed MIME types, a 12 MB per-asset limit, private R2 storage and D1 metadata. An authenticated browser session on the Worker origin is required for mutation; GitHub code inspection cannot substitute for a live R2 test. No R2 PASS is claimed.
- **Approved next sequence:** (1) finish a strictly disposable R2 image upload/download byte-or-checksum equality test on the disposable D1 issue; check unauthorised access, without touching real artwork; (2) after PASS, build clear cloud-connection, save, revision, conflict/recovery, download-backup and image storage controls **inside Programme Designer**, with staged reversible integration; (3) migrate cloned issue and images only with explicit backups and user approval; (4) then cross-device and PDF preflight/print QA.
- Keep approved masters, source pages, Page 39 trials, cover/honours, original reference assets, all live Wix/Canva pages, unrelated Cloudflare Workers, browser IndexedDB and user backups untouched. **No application code or browser drafts changed in this continuity audit.** Test status: static inspection PASS; live R2 NOT RUN; browser QA NOT RUN; full issue sync/PDF NOT READY.


## Cloudflare D1 full disposable issue recovery test — 17 November 2026, 23:53 GMT

- In an authenticated same-origin browser DevTools Console at `https://tivvy-programme-v3-storage.nickabull.workers.dev/api/issues`, user ran the approved test script that creates a uniquely named disposable `test_<uuid>` issue named `DISPOSABLE STORAGE TEST`. The test uses a trivial non-exporting single-page document. It deliberately never touches the real programme or local browser drafts.
- Screenshot shows all six result rows **PASS**: (1) Create issue (HTTP 201), (2) Read issue (version 1), (3) Save revision (version 2), (4) Reject stale edit (HTTP 409), (5) Restore version one (version 3), and (6) Verify recovered original text. This is an independently screenshot-verified successful D1 create/read/revision/conflict/restore round trip.
- Earlier authenticated `/api/me` admin test and `/api/issues` empty list test passed. Access protected Worker, D1 `DB`, R2 `ASSETS`, audience secret and team domain configured.
- **Still pending:** R2 private asset upload/download/checksum round trip; application/editor migration from IndexedDB and embedded base64 to D1/R2 references; proper UX for save acknowledgement and conflicts; cross-device test; comprehensive security audit; backup export and production print/PDF. The disposable `test_<uuid>` record remains in D1 for audit and can be cleaned up later by an approved administrative cleanup process. Do not assert image storage or whole-issue sync is complete.
- User explicitly dislikes Cloudflare/dashboard and developer-console juggling. Next phase should offer a proper safe in-app storage test/sync interface, with carefully staged migration and a reversible local backup. Preserve source assets/masters and keep all unrelated Cloudflare Workers unaffected.


## First authenticated D1 issue-list read PASS — 17 November 2026, 23:46 GMT

- User opened `https://tivvy-programme-v3-storage.nickabull.workers.dev/api/issues` while signed in through Cloudflare Access. Screenshot shows exact response `{"ok":true,"issues":[]}`.
- This is a positive **authenticated API → D1 read** result, confirms issue list currently empty, and makes it safe to run a **disposable** create/read/save/conflict/restore test next. It does **not** establish writes, version history, restore, asset storage or Designer cloud sync.
- User wants to leave Cloudflare dashboard/browser complexity soon. Prefer one carefully scoped same-origin Chrome test script or a proper dedicated test UI over more dashboard steps; never place user email or credentials in scripts. New issue IDs must be clearly disposable and safe. Keep existing local backups untouched.


## Protected storage API /api/me test passed — 17 November 2026, 23:43 GMT

- User pasted `v3-backend/src/index.js` into latest Cloudflare Worker code editor, clicked Deploy, and reported "Version saved".
- User's screenshot of `/api/` returned `{"ok":false,"error":"Not found"}`, the exact route fallback from our storage source, establishing the real code had replaced Hello World.
- Then user opened `https://tivvy-programme-v3-storage.nickabull.workers.dev/api/me` and verbally confirmed receiving the expected successful response (context: `ok:true` and `role:admin`). The user correctly declined to share a screenshot containing their account email. Treat as **user-confirmed authenticated API identity / administrator lookup success**, not an independently inspected screenshot. Do not request or record email address.
- Worker Access-protected on workers.dev; production secrets `ACCESS_AUD` and `ACCESS_TEAM_DOMAIN` configured; D1 `DB` and R2 `ASSETS` bindings present. One active admin row verified earlier. Real storage API deployed and identity test passed.
- **NEXT CRITICAL TASK**: test disposable issue CRUD, versioned saves, stale-write 409, historical revision read and restore, audit events, private R2 upload/get; no real programme data or browser backup should be migrated until round-trip checks pass. GET `/api/issues` is safe first. Mutations require an `Origin` matching the request's origin, so browser console `fetch` from the protected Worker origin or an equivalent same-origin test harness is necessary; sending POST from GitHub Pages or external tools will not work by design. Verify backend's response statuses and ensure failures never masquerade as saves.
- Full Designer cloud save integration, R2 de-embedding and project production workflow remain pending.


## Cloudflare web editor opened / backend source checked — 17 November 2026, 23:29 GMT

- User screenshot shows the newly created protected storage Worker web code editor `worker.js` still contains the Cloudflare stock Hello World program. Nothing has been pasted or deployed yet. Right-hand editor Preview shows a broken placeholder icon; do not mistake this for a backend failure.
- Re-fetched GitHub `v3-backend/src/index.js` (single ~14KB JavaScript Worker source; blob SHA `d23fe35ea394f4f0ea5f1bfe3e5aba72edaf0db8`). Existing API includes cryptographic Cloudflare Access token checking, membership via D1, read/write issue revision endpoints, and R2 asset endpoints. Public `/api/health` within source still sits behind edge Access for unauthenticated visitors on protected Worker.
- Fetched `v3-backend/wrangler.example.toml`. WARNING: example currently defines **a different Worker name** `tivvy-programme-v3-api`, `workers_dev=false`, a placeholder custom-domain deployment model, placeholders for database ID, team domain/AUD, and a public-looking `ACCESS_AUD` vars entry. This is OUTDATED relative to tonight's `tivvy-programme-v3-storage.nickabull.workers.dev` deployment behind Access. **Do not deploy that example unchanged** or create a second Worker; it may also supersede existing bindings and should never put confidential config into GitHub. Prefer controlled browser code editor deployment for first proof or a corrected secure deploy config after review.
- User asked to proceed; provided GitHub source link `https://github.com/nickabull/Tiverton-Town-Control-Centre/blob/main/v3-backend/src/index.js` and requested confirming it opens with the comment `// Tivvy Programme Designer V3.2 storage API.` before copying to Cloudflare editor. This code has NOT been deployed and no API request has been verified.
- Once Worker source deployed under retained edge Access config, test authenticated `/api/me` expecting `ok:true` and role admin. A 401 could mean Access JWT assertion unavailable/malformed or AUD/issuer mismatch, and a 403 D1 membership mismatch; debug safely without weakening edge Access. Then disposable issue save/version/restore and R2 asset tests. The browser editor and GitHub Pages Designer are not yet connected; full cloud save remains pending.


## Cloudflare Access JWT settings all present — 17 November 2026, 23:28 GMT

- User screenshot definitively verifies production Runtime variables/secrets on new `tivvy-programme-v3-storage` Worker: `ACCESS_AUD` as encrypted **Secret** (value intentionally not logged to GitHub) and `ACCESS_TEAM_DOMAIN=quiet-bird-5421.cloudflareaccess.com` as plain runtime variable.
- The same screenshot verifies existing production bindings remain intact: D1 `DB` → `tivvy-programme-v3`, R2 `ASSETS` → `tivvy-programme-v3-assets`.
- Prior screenshots proved unauthenticated Access login challenge, authorised post-login Hello World response, D1 schema tables present, and exactly one active programme_members administrator. **Configuration is present, but the actual storage API has NOT yet been deployed or round-trip tested.** Don't say cloud saving works yet.
- Next: audit `v3-backend/src/index.js`, migration schema and Wrangler configuration; ensure any deployment preserves Access protection, D1/R2 bindings, team domain and `ACCESS_AUD` secret. Use a least-privilege Cloudflare deployment path and verify authenticated / unauthenticated behaviour, identity match, issue create/read/version conflict/restore/assets using **disposable** data only. Keep local browser backups and existing four unrelated Workers untouched.


## Cloudflare Access AUD supplied — 17 November 2026, 23:25 GMT

- User supplied a 64-character hexadecimal Application Audience (AUD) Tag obtained from Cloudflare Zero Trust's `tivvy-programme-v3-storage - Cloudflare Workers` app. For privacy and configuration hygiene the full AUD is **not copied into the GitHub handover**.
- User instructed to set **production** Worker variable `ACCESS_AUD` to that exact user-supplied value (as a secret) and deploy. This operation is **pending user screenshot/confirmation**, not yet verified.
- `ACCESS_TEAM_DOMAIN` already saved: `quiet-bird-5421.cloudflareaccess.com`. Worker bindings `DB` to D1 `tivvy-programme-v3`, `ASSETS` to R2 `tivvy-programme-v3-assets`. Admin allowlist previously verified one active administrator, and protected Hello World login passed.
- After `ACCESS_AUD` is confirmed, ensure actual application AUD matches the token `aud` and Cloudflare certificate issuer; deploy API source only after configuring Wrangler to retain bindings and vars. Test authenticated and unauthenticated access, then disposable issue save, read, conflict, restore and asset round trip. Do not yet claim functioning cloud save or touch browser backups.


## Cloudflare Access team variable confirmed — 17 November 2026, 23:15 GMT

- User screenshot of dedicated Worker production Settings confirms `ACCESS_TEAM_DOMAIN` is successfully saved as plain text `quiet-bird-5421.cloudflareaccess.com`. The same screenshot confirms both resource bindings remain intact: D1 `DB` → `tivvy-programme-v3`, R2 `ASSETS` → `tivvy-programme-v3-assets`.
- The **application-specific `ACCESS_AUD` is still missing** and must not be guessed. Next user action: Cloudflare Zero Trust → Access → Applications → the `tivvy-programme-v3-storage - Cloudflare Workers` app → find/copy Application Audience (AUD) Tag; set `ACCESS_AUD` on this Worker's production variables, then verify settings. No live API deployment yet, protected placeholder remains Hello World. No issue/cloud-save claim yet.


## First programme administrator verified — 17 November 2026, 23:09 GMT

- User executed initial authorised-user SQL in D1 `tivvy-programme-v3` for their normal Cloudflare account email (email was **not** shared in conversation). Follow-up aggregate query `SELECT role, active, COUNT(*) AS users FROM programme_members GROUP BY role, active;` returned **admin | 1 | 1**, confirmed by screenshot. Hence exactly one active administrator is currently present in programme_members.
- This verifies the D1 allowlist row, not yet that Cloudflare Access's authenticated JWT `email` exactly matches it. Do not insert a second admin or disclose email. The actual service remains the Hello World placeholder; no live API/cloud save proven.
- Next: inspect Worker Settings > Variables and Secrets, configure `ACCESS_TEAM_DOMAIN` to `quiet-bird-5421.cloudflareaccess.com` and `ACCESS_AUD` using the actual Cloudflare Access application audience tag (not guessed); verify Access JWT authentication and D1 member match after deploying source API. Keep existing `DB` and `ASSETS` bindings and preserve local backups.


## D1 initial administrator bootstrap pending — 17 November 2026, 23:05 GMT

- User ran `SELECT role, active, COUNT(*) AS users FROM programme_members GROUP BY role, active;` on D1 `tivvy-programme-v3`. Screenshot showed **"This query returned no data."** The table exists but has **zero registered members**, so nobody is authorised by the backend D1 allowlist yet.
- Advised user to register ONLY their own authenticated Cloudflare account email, kept private, via D1 Console:
  `INSERT INTO programme_members(email,role,active,added_at) VALUES ('YOUR_CLOUDFLARE_EMAIL','admin',1,datetime('now'));`
  The placeholder must be replaced locally, never executed literally. Do not paste passwords or private emails into chat. This SQL action has **not been confirmed executed**.
- Next verify with the same aggregate read-only count expecting `admin | 1 | 1`. Do not assert admin bootstrap succeeded before screenshot/confirmation. Then configure and verify Access JWT variables for the real API and deploy/test the API with secure read/write controls. Existing Worker remains stock Hello World with D1 `DB` and R2 `ASSETS` bindings; production cloud saving has NOT been enabled.


## Existing D1 schema confirmed installed — 17 November 2026, 23:04 GMT

- On the Cloudflare D1 Console for `tivvy-programme-v3`, Cloudflare's `/tables` shortcut initially returned an internal error, reference `h8qrc0t0hpbob25oclt8dd9u`. Standard read-only SQL succeeded:
  `SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;`
- Screenshot confirmed five Programme Designer tables already EXIST: `activity_events`, `issue_revisions`, `programme_assets`, `programme_issues`, `programme_members`; plus Cloudflare internal `_cf_KV`. Do **NOT** reinstall schema or recreate these tables by default. Existence does not independently confirm column structures, indexes, membership rows, or completed migrations, so check those only when needed, non-destructively.
- Immediate next step: in D1 Console run read-only `SELECT role, active, COUNT(*) AS users FROM programme_members GROUP BY role, active;` to establish if any authorised admin/editor is already bootstrapped without printing personal emails. If missing, bootstrap the exact authorised account using trusted D1 tooling and an email supplied privately by operator; don't invent it. Then configure Access AUD/team domain, deploy real API and test isolated issue CRUD/revisions/asset round trip. Existing Worker is still Hello World until explicitly replaced and verified.


## Cloudflare storage bindings verified — 17 November 2026, 23:00 GMT

User's Cloudflare Workers dashboard screenshot definitively confirms BOTH production bindings on dedicated `tivvy-programme-v3-storage` Worker:

| Type | Variable | Existing Cloudflare resource |
| --- | --- | --- |
| D1 database | `DB` | `tivvy-programme-v3` |
| R2 bucket | `ASSETS` | `tivvy-programme-v3-assets` |

D1 binding was added first, then the R2 binding was deployed. The final screenshot lists both rows. Cloudflare highlighted a Wrangler configuration sync notice after D1 was bound: ensure both bindings and the correct D1 database ID / R2 bucket name appear in deployed Wrangler config when deploying the actual API so dashboard and code remain in sync. Record ID from authenticated dashboard rather than guessing; do not repurpose other projects' resources.

Cloudflare Access challenge and post-sign-in Hello World were already visually verified, with protected workers.dev address and team `quiet-bird-5421.cloudflareaccess.com`. **The Worker is still the harmless Hello World placeholder**; no cloud storage API has been deployed and no issue read/write test has been completed. **NEXT:** inspect D1 tables / schema and existing remote migrations non-destructively; then reconcile backend schema, configure `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`, bootstrap the known authorised editor with trusted D1 tooling, deploy protected backend source, test auth and create/read/save/409/restore/asset round-trip on disposable data; only afterward migrate artwork to R2 and connect the Designer. Do not disable local backups. User explicitly requested ongoing handover updates.


## Cloudflare Access end-to-end placeholder login PASS — 17 November 2026, 22:51 GMT

- User signed in through the Cloudflare Access challenge and captured a screenshot of `https://tivvy-programme-v3-storage.nickabull.workers.dev` returning the exact response **Hello World!**. The signed-in browser successfully reached the newly deployed protected Worker. Previously, an unauthenticated incognito browser received the Cloudflare Access login form, team `quiet-bird-5421.cloudflareaccess.com`. Hence *Access-protected placeholder deployment and successful authorised login have been visually verified*.
- This is **not** proof the custom production API, staff D1 allowlist, JWT verification, session/API-origin behaviour or editor sync are configured or working. No D1/R2 bindings existed in the initial deployment screenshot; only stock Hello World is deployed.
- The user's next action: Worker dashboard > **Bindings > Add a binding**; inspect D1 options, choose the correct existing database once confirmed and bind as `DB`; similarly R2 as `ASSETS`. Run remote migrations with Cloudflare tooling, configure Access team domain and AUD in worker environment, bootstrap authorised staff and deploy/test the backend from GitHub. Confirm unauthorised requests denied and complete save/read/revision/restore/asset round trip before any production data migration. Preserve original IndexedDB backups and avoid changes to existing unrelated Workers.


## Cloudflare Access login checkpoint — 17 November 2026, 22:50 GMT

- User confirmed the new fifth Worker `tivvy-programme-v3-storage` exists and shows deployment ready at `https://tivvy-programme-v3-storage.nickabull.workers.dev`; dashboard topology reports **Domains 1**, **Bindings 0**, Worker Logs enabled. It is still the stock **Hello World** placeholder, not the programme storage API.
- Crucial successful unauthenticated incognito test: visiting the Worker address displayed **Cloudflare Access** sign-in instead of Hello World. Login page identified the previously configured Zero Trust team hostname `quiet-bird-5421.cloudflareaccess.com`, application “tivvy-programme-v3-storage - Cloudflare Workers”, and “Sign in with Cloudflare”. This confirms the login challenge exists for unauthenticated users, **not yet that successful authorised login or backend API JWT validation works**.
- App was created with Cloudflare Access enabled for **All traffic**, preconfigured **Cloudflare account** allow policy, 24-hour session. Custom Tiverton domain not needed for bootstrap.
- NEXT: user signs in to the protected placeholder using normal Cloudflare credentials and confirms the page returns “Hello World!”; then inspect deployed Access application's settings / audience, existing D1 and R2 names and migrations, securely configure binding names `DB` and `ASSETS`, Access JWT settings and staff allowlist, deploy GitHub `v3-backend/src/index.js`, test forbidden/allowed requests and disposable create/save/conflict/restore/asset round trip, and only then connect programme editor. Keep all four existing unrelated Workers untouched. Record evidence of every stage. Never request login secrets in chat.


## Cloudflare programme storage bootstrap — 17 November 2026, 22:47 GMT

User specifically asked to log this work. Cloudflare Workers & Pages originally showed four existing unrelated Workers: `bampton-fair-mapping`, `tivvy-live-collector`, `bulls-rail-radar`, and `willow-tree-vocal-remover`. DO NOT change these four.

User entered Create application → Start with Hello World. New fifth Worker name: `tivvy-programme-v3-storage`, expected endpoint `https://tivvy-programme-v3-storage.nickabull.workers.dev`. Enabled **Protect with Cloudflare Access**, selected **All traffic** (not Previews only), preconfigured **Cloudflare account** Allow policy and 24-hour session. Screenshots confirmed these choices immediately before Deploy. The next screenshot may show deployment; check it and explicitly verify live status before declaring success. Do not confuse the harmless placeholder with the production storage API.

This appears to bypass the former custom-domain hurdle; no Tiverton domain is required for this bootstrap. The source API in `v3-backend/src/index.js` is separate and not yet confirmed deployed. It verifies Access JWT and requires `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, D1 staff membership, D1 binding and R2 binding. Prior user reports D1 and R2 were provisioned but actual database/bucket names, bindings and remote migrations have not yet been verified. Never expose private issue data until Access enforcement is tested. No cloud-save success claims until read-back tests succeed. Next: confirm Worker deployment, test logged-in versus logged-out access, inspect D1/R2, configure bindings and JWT settings, run schema migrations, deploy source, test read/write and recovery on a disposable issue, then migrate image data out of browser backups into R2. Existing local backups must remain untouched.


## V3.6.19 — PREFLIGHT 2.0 AND CONCISE OPPOSITION TRIAL (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.19

- User confirmed the V3.6.18 text-fit checker was extremely useful, but showed six warning lines: Box 1 clipped 43px, Box 3 clipped 40px, and two text-box frame collisions each counted twice. They want a persistent checker and are looking ahead to a whole-issue run.
- Inspected uploaded complete backup's original Page 39 geometry: Text Box 1 x297 y149 w276 h184; Text Box 2 x13 y306 w570 h199; Text Box 3 x13 y459 w325 h263. The source template's box 2/3 frames *already* intersect by 46px, regardless of actual printed glyphs. Blind frame collision testing is therefore misleading.
- Replaced CHECK TEXT FIT's browser alert with an interactive **PROGRAMME PREFLIGHT** floating panel: shows FAIL/REVIEW/PASS counts; flags clipped copy using element scroll dimensions, tests rendered text paragraph rectangles for true text-text overlap (once per unordered pair), and has clickable warnings to select/jump to the offending layer and a **RECHECK PAGE** button. Automatic editorial REVIEW item remains for the Swindon 2026/27 photograph, kits and last-season finishing position. Read-only; no saved artwork mutation; closable panel; no green/print-ready claim if review is pending. Tool remains EDIT LAYERS > TOOLS > CHECK TEXT FIT.
- Updated `data/swindon-supermarine-page39-trial-patch.json` with substantially shorter verifiable prose in all three text boxes. It does not fabricate a 2025/26 final league position. New trials use 106% line-height, 0.02em fact box paragraph gap and 0.08em history gap to reduce overflow; the unchanged source Page 39 is copied into a new excluded page named TRIAL V3.6.19. User must generate a NEW trial; existing V3.6.18 trial is preserved.
- Editor commit `f9e28c9d3ffec2c4cee8b6e7b202ea4e9e81e960`, content patch commit `0d856e731a42ffb0e0c58b295984d84e791908f6`, shell commit `a02de54aed2a10ccc6c5da9dbc9b5d146a3c6a74`. Both scripts parsed in V8 where modified. Browser visual QA and possible layout iteration are still required. Preflight does NOT yet check image/text collision, licensing, colour profiles, bleed, or print-PDF output. Source images intentionally retained.
- Whole-issue update is NOT one-click production-ready: first prove P39 layout; then full issue clone/mapping for fixture, standings, matrix, editorial, player stats, dated photos, approvals and PDF; secure backend/restore remains a prerequisite for durable production.


## V3.6.18 — INTELLIGENT TEXT REPLACEMENT / FIT AUDIT (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.18

- Following visual QA of V3.6.17 Swindon Page 39 trial, user showed severe enlarged/re-spaced body copy, text collisions with photograph and neighbouring text, and last paragraph cut off. Treat this as a genuine failed production layout and never classify it as print ready.
- Changed MORE TOOLS > **CREATE SWINDON PAGE 39 TRIAL** in V3 shell: the source text layers' actual saved richHtml font sizes are inspected, so the replacements use the original heading/body sizes (typically 15.12pt heading and 11.76pt body). The new trial strips erroneous nested paragraph wrappers; preserves bold label / normal body distinction; sets compact optional paragraph gaps (0.18em club facts, 0.12em history) and 110% line-height *only on the cloned trial's three replaced text boxes*. Saves flag `autoSweepTrial=true`. Source Page 39, original approved masters and eight photo/artwork/kit image sources remain unchanged. An existing malformed V3.6.17 trial isn't retroactively modified: create a fresh V3.6.18 trial.
- Added **EDIT LAYERS > TOOLS > CHECK TEXT FIT** in page editor: read-only DOM inspection of every visible text layer's scroll height/width relative to its frame, plus trial-text-frame intersection checks against other text layers. Alerts with measured warnings and red dashed outlines; does not alter persisted draft. This is a first safety gate, not a complete layout/print checker: clipped text can be detected; collisions with photographs, body glyph contours, intentional overlaid layers and generated PDF still require human visual QA. No automatic fit-to-box shrink, no silent moving, and no publishing.
- Shell commit `8c9324f50f68c17fc5216a9bd6d72d2f88555906`; editor commit `06cc7bcab0300b0618168093da000e7856fd4013`. Both inline JavaScript parsed through V8. Actual in-browser click/render/fit measurements are NOT tested, user should inspect a NEW trial and send screenshot.
- The 5 December full issue simulation, real artwork swaps, audited approval process, PDF print production and cloud storage remain pending.


## V3.6.17 — AUTOMATIC PAGE 39 SWINDON CONTENT TRIAL (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.17

- User supplied both 57-page audit (43 drafts, 10 stale references on Page 39, 4 proposed fact replacements, zero errors) and the full 168MB programme JSON backup, which was inspected: page 39 contains 15 layers, including 8 image layers and exactly three old Bishops Cleeve content boxes (`Text Box 1`, `Text Box 2`, `Text Box 3`). Cover and honours pages are preserved. The backup also revealed review-only typos: `Solictors` in the cover stadium line, and `Commercail Manager` in honours; neither master should be silently changed.
- V3.6.17 now has MORE TOOLS -> **CREATE SWINDON PAGE 39 TRIAL**. It reads the CURRENT browser IndexedDB page 39, loads `data/swindon-supermarine-page39-trial-patch.json`, verifies source ID and unique target text boxes, clones all layers, replaces ONLY the three editorial text boxes with Swindon facts and history, verifies 8 image sources are byte-for-byte unchanged, and after user confirmation writes a new independent IndexedDB page record. New page is `include:false` (excluded from output). Existing Page 39 and master artwork are untouched.
- The copied images include a Bishops Cleeve photograph and unverified kits: these require explicit image replacement and licensing check. The original layout can have overflow and must be browser-QA'd. The `2025/26` final league position has NOT been invented. Neither complete issue conversion nor PDF publishing is finished.
- Created optional external, self-contained fallback `tivvy-swindon-opposition-P39-TRIAL-2026-11-17.json` (46.7MB) and a review diff file from supplied backup in the working container, not committed to GitHub. The GitHub in-app workflow is preferable because it uses the user's current saved draft instead of a stale snapshot.
- Browser interaction and save/reopen of the new trial page still require QA; full simulation, Darren report error-detection workflow, print PDF and cloud persistence remain pending.


## V3.6.16 — 5 DEC SWINDON SUPERMARINE AUTOMATION DRY-RUN STARTED (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.16

- User approved four design families and asked to attempt the complete simulated production sweep for Tiverton Town v Swindon Supermarine, Saturday 5 December 2026, 15:00. User's approved master artwork and source pages are in browser IndexedDB and are NOT accessible via GitHub connector. Do not claim actual browser content has been updated or that a full PDF has been produced.
- Created sourced opposition content pack `data/swindon-supermarine-sweep-2026-12-05.json` containing verified fixture, 1992 merger, Marine nickname, official stadium name and location, manager, draft history copy and explicit open verification items (photo licence, 2026/27 kits, actual previous finish, squad). Club's own official pages and FootballWebPages December fixtures are cited within it.
- Added MORE TOOLS > **5 DEC · DRY-RUN SWEEP**, available in V3.6.16. It flushes the active page to IndexedDB, loads fixture pack, scans every saved browser page's TEXT layers for Bishops Cleeve / Kayte Lane / Mitres / Malvern Town references and proposed exact fact replacements; downloads a timestamped JSON report listing affected pages and layers, and tells user what needs review.
- This first pass is deliberately READ-ONLY, changesApplied=0. It does not silently replace history, image assets, kits or other page artwork, and does not mutate the four masters. A second approved step should use the report to clone an issue and update verified content, with diff and rollback. Existing full JSON backups remain strongly recommended.
- Content pack commit `4505ca19761a496aad5aa03333e15fa52b2c0f5d`; V3 shell audit feature commit `20975308e57e32c51a93842006ee2561903d736a`. JavaScript syntax parsing passed. Interactive browser QA still required, and no live dry-run report could be collected from user's IndexedDB by connector.
- This is not complete end-to-end production: automatic replacement, dated complete issue clone, Darren report ingestion, validation/approval UI, print PDF export and cloud storage are pending.


## V3.6.15 — TEXT LINE HEIGHT AND PARAGRAPH ROW GAP (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.15

- User designing an honours/club officials list asked to control row spacing for multiline text layers. Previously text used default line-height 1.17 and each paragraph had extra 0.8em bottom margin, with no editor controls.
- Added independent LINE HEIGHT slider/direct number input (70-250%, default 117%) and PARAGRAPH / ROW GAP slider/direct number input (0-2.5em, default 0.8em) in text inspector.
- Live preview changes active text box immediately, saves to new optional per-layer fields lineHeightPct and paragraphGapEm, uses existing slider history/undo. Copy/paste and JSON backup naturally preserve these properties. All existing pages keep the original defaults when fields are absent; no master artwork was changed.
- For separate paragraph entries (e.g. President, Chairman, etc.), reduce ROW GAP towards 0 to tighten vertical spacing; for wrapped lines inside one paragraph, adjust LINE HEIGHT.
- Editor commit e06222c8b2b1abc3567e11544b0a7b3e9be8399c. Shell version commit c55d6da125845e478aa4797c5fe5a25ce4cbe790. JavaScript parse verified; browser visual QA still required before claiming fully tested.


## V3.6.14 — COPY ELEMENTS BETWEEN V3 PAGES (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.14

- New COPY SELECTED and PASTE LAYERS buttons in the editor left sidebar; Ctrl+C and Ctrl+V now use the same cross-page copy/paste workflow. Shift-click supports multi-layer selection.
- Clipboard is a distinct IndexedDB database named tivvy-v3-cross-page-transfer-v1, not the page draft database. It survives moving between V3 page URLs in the same browser/origin, and carries image data, shapes, fonts, text formatting, outline settings, layer sizing and positions. For small copies a sessionStorage compatibility copy is also kept. Source page ID and copy time recorded.
- When pasting onto a different page, original coordinates are retained and z-order goes above current layers; same-page pastes offset 15px to distinguish from originals. Each pasted element receives a fresh ID, is editable/unlocked, is selected after insertion, and is committed through the existing draft save + undo mechanism. No source page or saved template is altered.
- Clipboard operations show status in a sidebar panel; paste is blocked when a draft storage error is unresolved. Image-heavy copies may exceed browser storage quotas and should be checked before navigating away.
- Editor commit 8f5f53718a95a34d2e261ffaf0f742e0849e67de; shell cache bump d112fabd3cb24cefcc5328e57b125f5ca5436888. Inline script parsed successfully. Browser QA pending: copy cover/brand art, switch page, paste, confirm position/images/styling, undo, switch back and verify originals; test multi-select and larger images.
- No production pages or other version files changed. Cloud storage is still pending.


## V3.6.13 — TIMESTAMPED JSON + FONT SIZE CORRECTION + NUMERIC SPINNERS (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.13

- User requested identifiable date/time JSON backups; native spinner removal; live reliable text sizing instead of text unexpectedly becoming tiny on APPLY.
- Editor per-page EXPORT LAYERS JSON now includes page ID and browser-local YYYY-MM-DD_HH-mm-ss in filename. Payload includes UTC exportedAt, local exportedLocal, pageId, and existing layers. The full V3 shell backup and trial safety JSON downloads also get timestamped filenames via a shared download helper.
- Native browser numeric spinner arrows hidden throughout V3 editor. Existing independently clickable +/- controls kept on inspector inputs.
- Replaced execCommand fontSize=7 conversion with direct span styling on selected text. CUSTOM field now live-previews whole text layer size or selected words; selection formatting reuses same span while values change. APPLY and 14/18pt presets kept. Whole-layer size clears stale embedded font sizes. Uses existing 0.84 rendering ratio; bounds 6 to 150pt.
- Editor commits a0a705872da5ca3083cb2946349bab095ff4c3ed and 94bcb82148034b4140637bbc61d4027039bca644; shell commits aa50cb3ddb9b744169d10f9c43e04f4729ffda45 and a9a1757d9e32d7d79cf3563c7ae325d3dd9776b8.
- Inline editor/shell script syntax verified through V8 parse. Browser QA still necessary: numerical changes, selection edits, APPLY, undo, PDF output, no native arrows, timestamped downloads and reload integrity. No browser drafts, cover artwork, other versions or production pages edited.


## V3.6.12 — TEXT OUTLINE SNAP + REMAINING NATIVE NUMBER ARROWS (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.12

- User reported native tiny spinner arrows remain and stroked text isn't snapping visually. Added small separate - / + controls to whole text font size, text stroke width (0.5px steps), and image stroke width (1px steps), while retaining direct numeric entry. Native browser arrows are explicitly hidden on those fields. Previous position, scale and tracking steppers remain.
- Previously snapping used only layer-frame edges, which can differ from the rendered glyph edges for stroked text. Added `visibleTextAnchors()` for unrotated text layers; reads DOM range bounding rectangle (including a half-stroke margin), converts to page coordinates and adds glyph left/centre/right/top/middle/bottom anchors to both target and neighbouring-layer snap candidates. Frame anchors remain for other layers, and normal existing SNAP toggle, drag, save and alignment feedback remain. Rotated text continues to use its frame because bounding in transformed coordinates needs separate QA.
- Editor commit `dac9bc5888203cb904491ace8ed0af9c7e5905d6`; shell commit `642346e852091bfc075abd0bd6d670cbe092af62`. **Browser QA required**: ensure text with 1-2px black stroke snaps visibly with red guides near neighbouring text/boxes, text without stroke is unaffected, and tiny native numeric arrows are gone; test at zoom 85/100 and on rotated cover headlines. No artwork or production page modifications.


## V3.6.11 — TEXT INSPECTOR LAYOUT FIX + EQUAL SPACING GUIDES (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.11

- User screenshot showed severely overlapping labels/values in TEXT BOX OPTIONS (WHOLE TEXT SIZE, WEIGHT, COLOUR, ALIGNMENT) and old tracking control squeezed/partly hidden. Applied scoped `#textControls` CSS with two equal minmax(0,1fr) columns, stacked labels/fields, safe wrapping, compact bold-selection button, consistent 34px field height, and full-width tracking +/- stepper. Does not alter page objects or text itself.
- User wants smart spacing feedback like red double-ended arrows in supplied example: when dragging a middle object between two neighbours, with sufficient cross-axis overlap and matching left/right gaps within 2 canvas px, draw paired red dashed gap lines with arrowheads and numeric equal-distance labels; analogous vertical above/below spacing. This supplements existing red alignment snap guides; never changes layer geometry or persists guides in artwork. Only shown with SNAP enabled during layer drag. Single central moving layer only; rotated objects use simple unrotated bounding boxes (limitation).
- Editor commit `96b7280b43b51c0039565844d46ef4af4cfba815`, shell cache version commit `580819e011561ba702d3a1a07bed6e32a1eea962`. Browser QA pending: verify text settings no overlap on user viewport; tracking controls visible; equal-gap feedback shows for three boxes when exactly balanced, disappears otherwise and on drag release; existing alignment/snap save remains intact.
- Development only, preserve browser drafts and cover artwork, other versions, Wix, Canva and production pages.


## V3.6.10 — TRACKING CONTROL MATCHES NUMERIC STEPPERS (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.10

- User reported the newly added LETTER SPACING/TRACKING numeric input still had the undesirable native browser number arrows, unlike compact +/- controls elsewhere. Wrapped the exact value box in matching small side-by-side minus/input/plus layout, with each click adjusting by exactly 0.5px, preserving negative tracking, MODIFIED indicator, RESET TO 0, and per-layer draft save. Buttons disable when layer is locked. No page artwork or other versions modified.
- Editor commit `333c3e65bf87e234099896c81e5e5d6bc34db9e4`; shell cache-version commit `c1563f205562c49a85b4eead6f1f51b5050712c0`. Browser QA pending for readability, ±0.5 adjustments, lock handling and reset on Page 1 cover.


## V3.6.9 — TEXT TRACKING AND MODIFIED INDICATOR (17 NOV 2026)

**Development:** https://nickabull.github.io/Tiverton-Town-Control-Centre/programme-designer-v3.html?v=3.6.9

- During front cover design user requested editable left/right kerning, interpreted as **whole-layer letter spacing/tracking**. Added text-layer tracking slider from -5px to +20px with half-pixel increments, exact numeric box, and persisted optional `letterSpacing` layer property. Default 0px preserves all existing text. This is tracking on the entire editable text layer, not per-character kerning pairs. Applied to CSS letter-spacing in editor rendering. Initial tracking code commit `50ac81135b40ab4809d875c43c272eb3ed83f216`.
- Follow-up request: show when tracking is "off default". Added gold **MODIFIED** badge, gold outline on numeric control, and **RESET TO 0** action, all driven by the selected text layer's current tracking. Indicator clears when restored to zero. Code commit `ad8ecd5160e72669d2f611e9647a1dde097645a5`; shell cache version commit `0d39d67f876ba90022be22967c63f701d8f3032e`.
- Browser QA needed on page 1: set positive and negative tracking; confirm the modified badge, reset, save and reload, and inherited source artwork unchanged. No page artwork or production pages were modified; changes only to development editor and shell.


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

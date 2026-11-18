# Tivvy Programme Designer cloud storage — current status (18 November 2026)

**Current state:** the `tivvy-programme-v3-storage` Worker is deployed behind Cloudflare Access with signed JWT verification and a D1 approved-members table. GitHub Actions automatically deploys scoped storage Worker changes after a Wrangler dry-run and unauthenticated-access rejection check. The historical 60-page 316.1 MB browser archive was successfully migrated to D1/R2 with 19 original image assets and a 316.0 MB portable recovery download verified in a live browser.

## V3.9 capabilities and limits

- **Original artwork library:** `/artwork-library`, with `/api/library/assets`; private R2 original-byte uploads up to 95 MB per request, immutable upload source metadata, filename/title/tags/description/credit/category search, and cloud-workspace insertion as a referenced image (no second upload). Client SHA-256 read-back verification implemented in source.
- **Retention:** `trash` status on deletion, 90-day `purge_after`, RESTORE during that period, daily Worker scheduled cleanup at 04:15 UTC. Unreferenced expired assets may be irreversibly purged; any asset ID referenced by an issue revision is retained to prevent breaking historical programmes. Metadata and audit events retain their history. Do not promise unconditional storage forever; this is private R2 under the account's storage and billing policies, not a substitute for independent backups.
- **Cloud working copy:** `/cloud-workspace`, separate from the original archive and from browser IndexedDB. Debounced autosave with D1 expected-version conflict checks, read-back of document revisions, and a local emergency copy while edits are pending. First-stage controls cover text, layer position and insert-by-reference from library; not the entire original canvas editor.
- **Detailed audit:** D1 immutable `activity_events` logs issue revisions and per-field page/layer before/after data (max 250 details per revision, no embedded original image bytes); `asset_library_events` logs uploads, metadata edits, trash and restores. `/activity-log` combines both with search, pagination and CSV export; signed-in project notes are linked to an existing issue. ChatGPT chat messages are not automatically copied to the app; engineering decisions are also recorded in `PROJECT-HANDOVER.md`.
- **Source discovery:** `/source-hub` reuses the existing Tivvy Live collector's Southern League API, optional FootballWebPages verification and authorised X API, avoiding duplicate polling and paid token consumption. `/api/sources/viv` uses the existing hourly Flickr public index with source credit/licence, available via the artwork library. The public Flickr JSON files were empty when inspected; the index must actually populate before searches yield photographs. ESPN is NOT yet connected.
- **Outstanding:** live signed-in browser QA of the new library, 90-day trash restore, autosave conflict/reload, audit pagination and source feeds; independent Google Drive backup; multi-part upload for originals larger than 95 MB; reference PDF artwork migration; complete original Designer cloud-primary integration; print-quality PDF.

### Version control and production safety

Source: `v3-backend/src/index.js`. Scoped deployment workflow: `.github/workflows/deploy-tivvy-programme-storage.yml`. Initial schema: `v3-backend/migrations/0001_initial.sql`; library schema definition: `0002_asset_library.sql` (the Worker currently uses idempotent D1 schema initialization because the deploy token is limited to Worker code permissions).

The following original README section was written before the first deployment and is preserved as historical documentation. Its claims about the Worker *not being deployed* and missing initial credentials are **obsolete**.

---

# Tivvy Programme Designer V3.2 — storage service

**Status:** IMPLEMENTED IN SOURCE; **NOT PROVISIONED, DEPLOYED, OR CONNECTED**. Existing V3.1 browser drafts and original experiments are untouched.

## Architecture

- Cloudflare Worker: private JSON API, strict Cloudflare Access JWT verification (RSA SHA-256, JWKS `kid`, `iss`, `aud`, `exp`, `iat`) **plus** a separate D1 staff allowlist and roles.
- Cloudflare D1: programme issues, immutable numbered issue revisions, audit events, asset records, user-role entries.
- Cloudflare R2: private original images, backgrounds, PDFs and future cut-out assets. Uploaded objects are stored under random IDs, not user-provided paths.
- **One issue snapshot per version**: page order, page IDs, export inclusion, editable layers and source references in one JSON document. No image data URLs in saved snapshots. Binary data belongs in R2.
- **Optimistic concurrency**: every save includes `expected_version`; conditional batched SQL prevents stale drafts from replacing newer ones. The service verifies its own revision ID exists before claiming success.
- **Recovery**: list revisions, retrieve any historical version, admin restore creates a *new revision* instead of erasing newer history.
- Audit has issue save / create / asset events and target page/layer IDs. Detailed before-after attribute diffs are a later integration step; currently high-level save metadata is captured.

## Explicit blockers before live saving

1. **Cloudflare Access**: choose the private studio/API hostname and establish the Access application, identity provider and AUD tag. A public GitHub Pages editor cannot simply call a private cross-origin Access endpoint without configuring session/CORS/authentication; eventually serve the app on the same Access-protected origin or use an explicitly designed authenticated proxy.
2. **Cloudflare resources**: create a new D1 database and R2 bucket. No connector is available to provision either on the user's behalf in this session.
3. **Staff permission bootstrap**: the first admin must be inserted via trusted Cloudflare D1 tooling. Never accept a self-proclaimed editor or admin from the browser.
4. **Schema migration and deployment**: run Wrangler commands below; secure the Worker with an Access policy, verify JWT enforcement before allowing user data.
5. **Client migration and QA**: back up existing local V3 draft JSON, convert to the documented `document.pages` shape, import through authenticated API and check the returned version on another browser. Don't disable local backup until round-trip and restore tests pass.
6. **Production hardening**: per-field before/after audit entries, asset quotas, image file magic validation and malware review, backup export automation, roles for publishing, PDF generation, integration testing and monitoring.

## Deployment (operator steps — not yet executed)

In a local checkout of this repository:

```bash
cd v3-backend
npm install
npx wrangler login
npx wrangler d1 create tivvy-programme-v3
npx wrangler r2 bucket create tivvy-programme-v3-assets
cp wrangler.example.toml wrangler.toml
```

Fill the D1 `database_id`, Access `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` values in `wrangler.toml`. Keep private values in encrypted deployment settings as appropriate; the Access AUD identifies an application but is not itself a secret. Configure your private custom domain and Cloudflare Access policy first; do not enable `workers_dev` for this private service.

```bash
npx wrangler d1 migrations apply tivvy-programme-v3 --remote
npx wrangler deploy
```

Provision an initial staff entry **manually from your authenticated Cloudflare operator account**:

```sql
INSERT INTO programme_members(email,role,active,added_at)
VALUES ('APPROVED_EDITOR_EMAIL','admin',1,datetime('now'));
```

Do not use a placeholder email without first replacing it with the actual authorised user. Staff emails are a permission table, not a way of registering accounts publicly.

### API (all routes other than /api/health require Access + approved role)

| Method | Route | Role | Purpose |
|---|---|---|---|
| GET | /api/me | all staff | Verified identity and role |
| GET | /api/issues | all staff | Recent issues |
| POST | /api/issues | admin/editor | Create initial issue (v1) |
| GET | /api/issues/:id | all staff | Current revision snapshot |
| PUT | /api/issues/:id | admin/editor | Save with expected_version |
| GET | /api/issues/:id/revisions | all staff | Revision list |
| GET | /api/issues/:id/revisions/:version | all staff | Previous snapshot |
| POST | /api/issues/:id/restore?version=N | admin | Restore to new version |
| GET | /api/issues/:id/activity | all staff | Audit events |
| POST | /api/issues/:id/assets | admin/editor | Private asset upload |
| GET | /api/issues/:id/assets/:assetId | all staff | Authenticated asset download |

No browser-supplied identity is trusted. Mutating requests require an `Origin` matching the request host. No public CORS allowlist is configured.

### Example issue save

```json
{
  "expected_version": 7,
  "summary": "Updated League So Far text",
  "page_id": "issue-20261114-p14",
  "layer_id": "heading",
  "document": {
    "pages": [
      {
        "id": "issue-20261114-p14",
        "name": "The League So Far",
        "include": true,
        "layers": [{"id":"heading","type":"text","x":18,"y":15,"text":"THE LEAGUE SO FAR"}]
      }
    ],
    "trash": []
  }
}
```

**Important**: The current V3.1 local JSON backup format separates `pages` and `layerData`; conversion must occur in a tested migration step. Do not POST a local file blindly and assume it is ready to publish.

### Save conflict behaviour

A successful PUT returns a fresh `version` number. A stale PUT returns HTTP 409 with `current_version`; the client must display a conflict, retain the unsaved draft, and offer review/reload or an explicit merge. Never silently retry with the latest number.

### Recovery test checklist

- Login with Access as allowed staff; unapproved user -> 403 and missing login -> 401.
- Create a copy of a test programme; GET returns revision 1.
- Make a change; PUT expected_version=1 -> version 2.
- Repeat PUT expected_version=1 -> 409 and stored version 2 remains intact.
- Retrieve version 1; restore it as version 3, preserving versions 1 and 2.
- Upload one asset; GET returns its original bytes to an authenticated approved user.
- Verify another computer sees exactly the same saved issue.
- Verify the local V3.1 test draft and existing GitHub templates are unchanged.

## No invented credentials / deployment

No D1 database ID, R2 bucket, Cloudflare Access AUD or domain has been supplied. They must be created and verified by the account operator before the storage service is usable. **Do not show “Cloud Saved” in the editor until an authenticated, verified server acknowledgment has been received.**

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

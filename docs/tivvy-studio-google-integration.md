# Tivvy Studio - Google integration and asset safety

Status: FOUNDATION ONLY (2026-11-07). No automatic Gmail import, Drive sync, or new asset backup is active.

## Existing project architecture
- Static GitHub Pages application in this public repository.
- `programme-studio.html` uses approved editorial snapshots from `editorial-inbox.html`.
- `auth.js` uses Firebase email/password for the existing publisher gate; do not replace it without explicit migration testing.
- Google Cloud project "Thesis" has a separately configured external OAuth client and authorised test user.
- Gmail API and Drive API are enabled.
- Requested OAuth scopes: `https://www.googleapis.com/auth/gmail.messages.readonly` and `https://www.googleapis.com/auth/drive.file`.
- Gmail readonly is restricted; Google OAuth testing authorisations expire and are not suitable for unattended production ingestion.

## Drive asset repository
Private folder: `TIVVY STUDIO - MASTER ASSETS` (created 2026-11-07).
Subfolders: 01 Club Branding and Logos; 02 Player Photos and Graphics; 03 Match Reports - Darren; 04 Match Previews - Darren; 05 Match Photography - Viv; 06 Programme Artwork and Templates; 07 Sponsors and Advertisements; 08 Published Programmes and PDFs; 09 Editorial and Website Archive; 10 Studio Configuration and Exports; 11 Club Contacts - Private.
Keep originals immutable on import, keep approved editorial snapshots separate, store photographer credits and source metadata, and do not make asset folders public by default. Do not place contact lists, incoming copyrighted Word documents or OAuth secrets in this public repository.

## Connection design
1. Initial interactive browser integration may use Google Identity Services with a public OAuth client ID, but never a client secret.
2. Use the Drive `drive.file` scope with explicit file selection through Google Picker or app-created files, not blanket access to every existing folder.
3. Gmail import uses `gmail.messages.readonly`; filter allowed sender(s), retrieve attachments, deduplicate by Gmail message ID plus attachment ID or content hash. The permission itself is mailbox-wide; restrict processing in app logic.
4. Store unmodified original .docx, with immutable source metadata. Create separate proposed corrections; user approval is required before Wix or programme publishing.
5. For scheduled/unattended import, use a secure backend with confidential credentials and token storage, a proper redirect URI, and least-privilege access. GitHub Pages alone is not a secure backend.
6. Do not enable automatic email send; future fixture-secretary distribution needs separate Gmail send permission and explicit approval.

## Backup acceptance gates
Existing `.github/workflows/bulls-backup.yml` mirrors nine public GitHub repositories, verifies git connectivity and checksum, retains a 90-day Actions artifact, and optionally copies the archive to Drive. This does NOT back up the new asset library.
Before importing production assets:
- Choose an independent protected backup destination (not merely another folder in the same Google Drive account).
- Configure read access for a backup service identity to the explicitly selected asset library, and encrypted credentials in private secret storage.
- Capture all nested folders and file versions using a versioned archive or snapshots; safely export native Google files, and include bytes plus manifest/checksums for uploaded .docx/PDF/PNG.
- Use an isolated private execution environment, NOT public GitHub Actions artifacts for confidential assets.
- Schedule daily incremental backups, monitor failures, apply retention, and verify sample restore and a full manifest comparison.
- Distinguish source sync, backup snapshot, and restore test; do not claim success until each is verified.

## Deployment safety
No existing Programme Studio, Firebase login, live website or backup workflow is modified by this document. Production activation requires integration code and end-to-end tests.

# Tivvy Media Archive — Maximum Metadata Preservation Policy

Adopted: 2026-11-07. Status: design contract, NOT a claim that WeTransfer downloads or Drive ingestion already work.

## Non-negotiable intake rules
1. Save the ORIGINAL bytes unchanged to a private backed-up Google Drive archive before WeTransfer expiry. Never replace original with resized/compressed derivative.
2. Extract and preserve all metadata available in original file: EXIF, IPTC, XMP, ICC profile (when present), image size, pixel orientation, camera make/model, lens, focal length, shutter speed, aperture, ISO, GPS (private/restricted), original capture time and timezone uncertainty, software, colour space, rights/license/credit. Preserve the raw metadata payload/sidecar where feasible, as well as normalised searchable fields.
3. Record source email message and thread IDs, sender, recipient, received timestamp, email subject, original email note, original filename and path, WeTransfer transfer ID, batch description, expiry and delivery date. Store signed/private download URLs only in restricted records and avoid exposing tokens in public GitHub Pages.
4. Associate match metadata: home/away, fixture date, opposition, competition, season, venue, reference to verified fixture ID, source for identification.
5. Preserve photographer's annotations separately from editorial guesses: player name(s), bib/shirt number, photograph sequence number, captions, visual subject, special moment; include confidence/source/provenance per claim. Never silently overwrite Viv's supplied text.
6. Record immutable SHA-256 checksum, file size, MIME, dimensions, import timestamp, Google Drive file ID, version/revision, and original filename. Generate thumbnails and smaller web derivatives separately, with direct pointer to the original.
7. Track editorial lifecycle: selection, approved caption and credit ('Photo: Viv Curtis'), permissions and licensing status, expiry/restrictions, crop parameters, derivatives, published issue/edition IDs, page IDs, use dates, location, and archive decisions.
8. De-duplicate by exact SHA-256 first; propose possible visually similar Flickr/WeTransfer duplicates for review, never merge on filename alone. Preserve both source histories on a deduplicated original.
9. Make full-text search/filter possible by match, player, date, team, venue, competition, photographer, filename, photo number, editorial keywords, image orientation, used/unused, approved/pending.
10. Photos and metadata remain private until authorised publication; omit GPS, private email addresses, signed transfer links, and full EXIF from public web assets unless explicitly approved.

## Record model (example, not fabricated camera data)
- `asset_id`: stable Tivvy UUID
- `sha256`: null until original bytes are downloaded
- `original`: {filename, mime_type, size_bytes, width, height, google_drive_id, original_downloaded_at}
- `capture`: {taken_at, timezone_source, raw_exif, raw_iptc, raw_xmp, camera, lens, orientation, gps_private}
- `source_deliveries[]`: {provider, email_message_id, email_thread_id, transfer_id, received_at, expires_at, batch_name, filename_in_batch, source_url_private, notes_raw}
- `fixture`: {date, home, away, competition, verified_fixture_id, stadium}
- `subjects[]`: {name, role, identification_source, certainty, checked_by}
- `editorial`: {photographer_credit, caption, keywords, status, rights_status, photo_number, flagged_issues}
- `usage[]`: {edition_id, programme_page_key, page_number_snapshot, selected_at, approved_at, published_at, crop, derivative_id}
- `links`: {flickr_photo_id, flickr_album_id, other_source_references}

## Initial known WeTransfer deliveries (7 Nov 2026)
- 'Tivvy V Sporting Club Inkberrow': 9 JPG, 94.7 MB. Email says 019/021/022 Corey Koerner; 037 Louis Smith; 046 Mason Winter; 067 Toby Stephens; 104 Josh Bissett; 163 Jacob Wellington; 199 Corey Koerner. These are email-supplied labels; verify against actual JPGs.
- 'Jacob Bard with Mark': 5 JPG, 42.5 MB. Do not assume subject is a match player without evidence.
- Links expire 10 Nov 2026. Gmail message discovery and link extraction verified; actual WeTransfer binary downloading and Drive import NOT YET PROVEN.

## Release gates
- [ ] Successful download of one original WeTransfer JPG.
- [ ] Hash and full metadata extraction with RAW metadata preservation.
- [ ] Upload and read-back of original in approved Google Drive archive.
- [ ] Store searchable metadata index with provenance, and test searching by player/fixture.
- [ ] Check same asset submitted via Flickr is linked, not duplicated.
- [ ] Test thumbnails and programme media selection with correct licensing and photo credit.
- [ ] Demonstrate weekly intake end-to-end including expiry warning and failure recovery.

No 'automatic' status until all relevant gates are proven.

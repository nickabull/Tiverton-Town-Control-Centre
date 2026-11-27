# Tivvy Sponsors Directory

The sponsor list supplied on 30 October 2026 has 73 rows representing 66 unique sponsors. The first research pass identifies 47 confidently; 19 abbreviated or ambiguous names remain drafts until the club confirms the correct business.

## Website

Embed `sponsors-directory.html` in a duplicate of the Wix Match Centre page. Keep the existing Wix header, footer and mobile layout. Change only the embed on the duplicate. The directory uses the same Anton font, yellow (#ffd800), black, alternating white/yellow panels and charcoal detail dialogs. Search supports business names, advertised services and categories. Six entries appear per page.

`data/sponsors-directory.json` contains only the 47 identified businesses and their public details. The 19 unresolved records and research notes are retained in the private review JSON supplied separately; do not commit that private review file. Only records with status `active`, confirmed identity and applicable optional start/end dates appear. No sponsorship expiry date was invented. The club must agree dates or archive records when sponsorship ends.

## Maintaining records

The Programme Centre's Sponsors link opens `sponsors-admin.html`, using its existing Firebase sign-in screen. It supports editing, adding, archiving, dates and season renewal history. Import the private review file to see all 66 records on that browser. Draft saves are explicitly local to that browser, not a backend publication. Download the reviewed JSON and send it to ChatGPT for a checked GitHub publication. Publish only confirmed active business records and their public display fields; keep unresolved records and internal notes private. The saved-draft preview is on the same origin and browser. No credentials, payment details or private sponsor agreements belong in the JSON.

For a later direct-publish version, use an authenticated service with server-side validation, revision checks and separate draft/published records. Do not put a GitHub write credential into this static editor. The initial editor intentionally has no pretend publish button.

## Business information and logos

Each researched record retains its official sources and check date. Public business contacts only; do not substitute registered residential offices or infer emails. The supplied sponsor list establishes sponsorship; business websites establish services and contact details. Ambiguous identities stay unpublished.

Logos are copied from official business sources. Vector originals are faithfully rasterised into PNGs; transparency is preserved where supplied. Opaque backgrounds remain opaque rather than removing brand artwork. White/yellow variants use dark backing. Missing logos use a plain Tivvy Sponsor placeholder, not an invented business logo. Logo source URLs and transparency metadata are retained per record.

## Validation

Run `node tests/sponsors-directory.test.cjs`. This checks all source rows, unique IDs, identity holds, expiry boundaries, category/service search, safe contact URLs and local asset presence. Browser checks cover search, pop-up contacts, pagination, empty search, close/focus, desktop presentation and a 390px iframe view.

The Wix page still needs the club's final content review and embed sizing on desktop and mobile before publication.

## 27 November 2026 — club sponsor corrections

Club supplied 11 website/social destinations; matched to existing records. 63 public records after removing LIFT / Tony Wheeley, Rapid Scaffolding and Yeo PSA Testing from public JSON. Orchard and Bull replaces Paul Orchard, retaining old ID and search alias; no invented business services. Axon, Orchard and Bull, R & M Cars, R White & Son Ltd and Rob Barton retained without website links. Briarwood Products and H2O Plumbing & Heating official sites independently inspected; remaining nine supplied destinations could not be fetched by this chat, not verified broken. Removed unverified C&R telephone and Axon address; R White summary neutralised. Social button labels distinguish Facebook/Instagram. Existing logos/layout preserved. Data commit f906a24, labels 95c042b, adjusted validation 08256ca. JSON readback checked 63 unique IDs, exclusions and URL schemes; full browser test and local Node asset regression not run. [Directory](https://nickabull.github.io/Tiverton-Town-Control-Centre/sponsors-directory.html) · [Data](data/sponsors-directory.json). Wix embed publication and sponsor link click-through checks outstanding.

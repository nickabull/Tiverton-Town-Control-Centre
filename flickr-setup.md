# Viv's public Tiverton photo catalogue

Add Viv's API **key** as an encrypted repository Actions secret named `FLICKR_API_KEY` in Settings → Secrets and variables → Actions. No shared secret, password or OAuth token is used for public albums. Never put the key in HTML, JSON, workflow inputs, an issue, or chat.

Run **Update Viv Flickr catalogue** from Actions. For a first test, use album ID `72177720331265672` (Tiverton v Taunton, 3 January 2026, Viv Curtis). Leave the album ID blank for the newest Tiverton album by creation time. The account is `90186291@N04`, verified from Viv's public Tiverton albums; an older dashboard link points to a different account and is not used by this collector.

The first run lists all public albums whose title or description contains Tiverton/Tivvy, then indexes photos in the selected album. Further runs retain previously indexed albums and add/refresh the selected album. Albums outside the Tiverton list are excluded. Failed requests leave the catalogue untouched. There is no scheduled job yet.

`data/flickr-catalogue.json` contains public metadata only: titles, dates, photo sizes, Flickr links and Viv's credit. The key stays in GitHub Actions. Unknown dates remain blank. Date taken is camera metadata and must be checked against match history before using it as an anniversary. Album creation/upload dates are not treated as fixture dates.

The Photo Library searches the catalogue by opponent, title and date taken; a month/day filter supports anniversary research. Available original/large links and Flickr bylines are retained. Photos are not automatically identified or approved, and the existing player tags and usage records are not changed. A public Flickr listing does not itself alter the club's permission to use Viv's images.

Flickr API references: https://www.flickr.com/services/api/flickr.photosets.getList.html and https://www.flickr.com/services/api/flickr.photosets.getPhotos.html.

## Full archive indexing

Select **all_albums** when running the workflow to index all public Tiverton albums. This reads album photos in pages of up to 500, with a short pause between requests and bounded retries. After the first full run, unchanged indexed albums are reused; a changed album is refreshed. The saved catalogue has per-album completion markers and full-index status. A failed album leaves the previous catalogue untouched. No player tags or usage records are modified. The dashboard reads the latest public catalogue directly and offers Show more photos for long results.

Connected runs can also update `.github/triggers/flickr.json` with `{"all_albums": true}` to request a full index; no key belongs in that file.

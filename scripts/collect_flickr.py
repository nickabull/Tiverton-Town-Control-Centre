#!/usr/bin/env python3
"""Index public Tiverton albums. API key is read only from the environment."""
import argparse
import json
import os
import re
import sys
import tempfile
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

OWNER = '90186291@N04'
EXTRAS = 'license,date_upload,date_taken,owner_name,tags,original_format,url_sq,url_m,url_l,url_o'

class FlickrError(Exception):
    pass

class Flickr:
    def __init__(self, key, owner=OWNER):
        self.key, self.owner = key, owner

    def call(self, method, **params):
        body = urllib.parse.urlencode(dict(method=method, api_key=self.key,
            user_id=self.owner, format='json', nojsoncallback=1, **params)).encode()
        request = urllib.request.Request('https://api.flickr.com/services/rest/', data=body)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                result = json.load(response)
        except Exception:
            # Never print request bodies, URLs or credentials in logs.
            raise FlickrError('Flickr could not be reached or returned an unreadable response.') from None
        if result.get('stat') != 'ok':
            raise FlickrError('Flickr rejected the request (code %s). Check the API key and album access.' % result.get('code', 'unknown'))
        return result

    def pages(self, method, root, item, **params):
        page = 1
        while True:
            result = self.call(method, page=page, per_page=500, **params)[root]
            yield from result.get(item, [])
            if page >= int(result.get('pages', 1)):
                break
            page += 1
            if page > 100:
                raise FlickrError('Pagination limit reached; catalogue left unchanged.')

    def albums(self):
        albums = []
        for raw in self.pages('flickr.photosets.getList', 'photosets', 'photoset'):
            title = raw.get('title', {}).get('_content', '')
            description = raw.get('description', {}).get('_content', '')
            if not re.search(r'\b(tiverton|tivvy)\b', title + ' ' + description, re.I):
                continue
            albums.append(dict(album_id=str(raw['id']), title=title, description=description,
                photo_count=int(raw.get('photos', 0)), created_at=raw.get('date_create'),
                updated_at=raw.get('date_update'), source_url=f"https://www.flickr.com/photos/{self.owner}/albums/{raw['id']}/"))
        return albums

    def photos(self, album):
        photos = []
        for raw in self.pages('flickr.photosets.getPhotos', 'photoset', 'photo',
                              photoset_id=album['album_id'], extras=EXTRAS, media='photos'):
            if str(raw.get('ispublic', '1')) != '1':
                continue
            taken = raw.get('datetaken')
            if str(raw.get('datetakenunknown', '0')) == '1':
                taken = None
            photos.append(dict(photo_id=str(raw['id']), album_id=album['album_id'],
                album_title=album['title'], title=raw.get('title', ''),
                date_taken=taken, date_uploaded=raw.get('dateupload'),
                credit='Photo: Viv Curtis', owner_id=self.owner, license=raw.get('license'),
                tags=raw.get('tags', ''),
                thumbnail_url=raw.get('url_m') or raw.get('url_sq'),
                large_url=raw.get('url_l'), original_url=raw.get('url_o'),
                source_url=f"https://www.flickr.com/photos/{self.owner}/{raw['id']}/"))
        return photos


def collect(client, previous, album_id=''):
    albums = client.albums()
    if not albums:
        raise FlickrError('No public Tiverton albums found for this account. Existing catalogue left unchanged.')
    selected = next((a for a in albums if a['album_id'] == album_id), None) if album_id else max(albums, key=lambda a: int(a.get('created_at') or 0))
    if not selected:
        raise FlickrError('The selected album is not in the public Tiverton album list.')
    fresh = client.photos(selected)
    if not fresh:
        raise FlickrError('No public photos returned. Existing catalogue left unchanged.')
    valid_ids = {a['album_id'] for a in albums}
    photos = [p for p in previous.get('photos', []) if p['album_id'] in valid_ids and p['album_id'] != selected['album_id']]
    photos.extend(fresh)
    return dict(schema_version=1, status='connected', owner_id=client.owner,
        owner_name='Viv Curtis', credit='Photo: Viv Curtis',
        updated_at=datetime.now(timezone.utc).isoformat(), albums=albums, photos=photos,
        last_indexed_album_id=selected['album_id'],
        date_note='Date taken is camera metadata, not a verified fixture date. Unknown dates are left blank.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--album-id', default='')
    parser.add_argument('--output', default='data/flickr-catalogue.json')
    args = parser.parse_args()
    key = os.environ.get('FLICKR_API_KEY', '').strip()
    if not key:
        raise FlickrError('Add the repository Actions secret FLICKR_API_KEY before running the collector.')
    if args.album_id and not re.fullmatch(r'\d+', args.album_id):
        raise FlickrError('Album ID must contain digits only.')
    path = Path(args.output)
    old = json.loads(path.read_text()) if path.exists() else {}
    result = collect(Flickr(key), old, args.album_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', dir=path.parent, delete=False) as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
        handle.write('\n')
    os.replace(handle.name, path)
    print(f"Indexed {len(result['albums'])} public Tiverton albums; {len(result['photos'])} catalogue photos. No player tags or usage records changed.")

if __name__ == '__main__':
    try:
        main()
    except FlickrError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

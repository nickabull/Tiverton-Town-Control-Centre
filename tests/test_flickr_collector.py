import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('collector', Path(__file__).parents[1]/'scripts/collect_flickr.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class Fake(m.Flickr):
    def __init__(self):
        super().__init__('TEST-NOT-A-KEY')
        self.calls=[]
    def call(self, method, **params):
        self.calls.append((method,params))
        if method.endswith('getList'):
            page=params['page']
            rows=[{'id':'1','title':{'_content':'Tiverton v Taunton'},'date_create':'10','photos':'3'},
                  {'id':'9','title':{'_content':'Family holiday'},'date_create':'90'}] if page==1 else [{'id':'2','title':{'_content':'Tivvy v Bideford'},'date_create':'20','photos':'1'}]
            return {'photosets':{'pages':2,'photoset':rows}}
        rows=[{'id':'100','title':'Player action','ispublic':1,'datetaken':'2020-10-19 15:00:00','url_m':'https://live.staticflickr.com/a.jpg'},
              {'id':'101','ispublic':0}, {'id':'102','ispublic':1,'datetaken':'2020-10-19 15:00:00','datetakenunknown':1}]
        return {'photoset':{'pages':1,'photo':rows}}

class CollectorTests(unittest.TestCase):
    def test_pagination_scope_and_dates(self):
        client=Fake();albums=client.albums()
        self.assertEqual([a['album_id'] for a in albums],['1','2'])
        photos=client.photos(albums[0])
        self.assertEqual([p['photo_id'] for p in photos],['100','102'])
        self.assertEqual(photos[0]['date_taken'],'2020-10-19 15:00:00')
        self.assertIsNone(photos[1]['date_taken'])
        self.assertNotIn('TEST-NOT-A-KEY',str(photos))
        self.assertEqual(photos[0]['credit'],'Photo: Viv Curtis')
    def test_incremental_catalogue(self):
        old={'photos':[{'photo_id':'old','album_id':'1'}, {'photo_id':'stale','album_id':'9'}]}
        result=m.collect(Fake(),old)
        self.assertEqual(result['last_indexed_album_id'],'2')
        self.assertIn('old',[p['photo_id'] for p in result['photos']])
        self.assertNotIn('stale',[p['photo_id'] for p in result['photos']])
        self.assertEqual(old['photos'][1]['photo_id'],'stale')
    def test_non_tiverton_album_rejected(self):
        with self.assertRaises(m.FlickrError):m.collect(Fake(),{},'9')
    def test_api_failure_has_no_key(self):
        from unittest.mock import patch
        with patch.object(m.urllib.request,'urlopen',side_effect=RuntimeError('TEST-NOT-A-KEY')):
            with self.assertRaises(m.FlickrError) as error:m.Flickr('TEST-NOT-A-KEY').call('flickr.photosets.getList')
        self.assertNotIn('TEST-NOT-A-KEY',str(error.exception))

if __name__=='__main__':unittest.main()

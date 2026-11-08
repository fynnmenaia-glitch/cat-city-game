"""📱 Cat Tok server: videos, the owner's verification and LIVE streams."""
import base64
import unittest

from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

import cattok
from social import clean

JPEG = b'\xff\xd8\xff\xe0' + b'\x00' * 80 + b'\xff\xd9'
GUEST_A = 'a' * 32
GUEST_B = 'b' * 32


class FakeAccounts:
    """X-Test-User: Sofia (owner) or any name signs you in; nothing = guest."""
    def user(self, request):
        name = request.headers.get('X-Test-User')
        if not name:
            return None
        return {'username': name, 'admin': name == 'Sofia', 'owner': name == 'Sofia'}

    def require(self, request, admin=False):
        user = self.user(request)
        if not user or (admin and not user['admin']):
            raise web.HTTPForbidden()
        return user


class CatTokTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        cattok.STATE.update({'videos': cattok.OrderedDict(), 'verified': {}, 'likes': {}, 'loaded': True})
        cattok.LIVES.clear()
        cattok.BLOBS.clear()
        cattok.LOCAL = cattok.Path('/tmp/cattok_test_state.json')
        from accounts import LOGIN_ATTEMPTS
        LOGIN_ATTEMPTS.clear()
        app = web.Application(client_max_size=262_144)
        cattok.install(app, FakeAccounts(), clean)
        self.client = TestClient(TestServer(app))
        await self.client.start_server()

    async def asyncTearDown(self):
        await self.client.close()

    async def post(self, path, data, guest=None, user=None):
        headers = {}
        if guest:
            headers['X-CatTok-Id'] = guest
        if user:
            headers['X-Test-User'] = user
        return await self.client.post(path, json=data, headers=headers)

    async def test_guest_posts_a_set_video_and_others_see_it(self):
        r = await self.post('/api/cattok/video', {'caption': 'my first video #catcity', 'template': 'dance', 'set': 'cherry',
                                                   'cat': 'galaxy', 'name': 'galaxyfan', 'duration': 12, 'boost': 2, 'sponsor': 'marmalade'}, guest=GUEST_A)
        self.assertEqual(r.status, 200)
        video = (await r.json())['video']
        self.assertEqual(video['template'], 'dance')
        self.assertEqual(video['boost'], 2)
        self.assertFalse(video['verified'])
        self.assertTrue(video['uid'].startswith('g'))
        self.assertNotIn(GUEST_A, str(video))  # the secret never leaves the server
        listing = await (await self.client.get('/api/cattok/videos')).json()
        self.assertEqual(listing['videos'][0]['id'], video['id'])

    async def test_needs_an_id_and_friendly_captions(self):
        r = await self.post('/api/cattok/video', {'caption': 'hi'})
        self.assertEqual(r.status, 403)
        r = await self.post('/api/cattok/video', {'caption': 'visit www.example.com now'}, guest=GUEST_A)
        self.assertEqual(r.status, 400)

    async def test_gameplay_frames_and_voice(self):
        frames = 'data:image/jpeg;base64,' + base64.b64encode(JPEG).decode()
        r = await self.post('/api/cattok/video', {'caption': 'gameplay!', 'frames': frames,
                                                   'frameInfo': {'cols': 10, 'rows': 9, 'n': 90, 'fw': 90, 'fh': 160, 'fps': 3}}, guest=GUEST_A)
        video = (await r.json())['video']
        self.assertEqual(video['mode'], 'game')
        got = await self.client.get('/api/cattok/video/%s/frames' % video['id'])
        self.assertEqual(await got.read(), JPEG)
        bad = await self.post('/api/cattok/video', {'frames': 'data:image/jpeg;base64,' + base64.b64encode(b'nope').decode()}, guest=GUEST_A)
        self.assertEqual(bad.status, 400)
        voice = 'data:audio/mp4;base64,' + base64.b64encode(b'\x00\x00\x00\x18ftypM4A ').decode()
        self.assertEqual((await self.post('/api/cattok/video/%s/audio' % video['id'], {'audio': voice}, guest=GUEST_B)).status, 404)  # not yours
        self.assertEqual((await self.post('/api/cattok/video/%s/audio' % video['id'], {'audio': voice}, guest=GUEST_A)).status, 200)
        self.assertEqual((await self.client.get('/api/cattok/video/%s/audio' % video['id'])).status, 200)

    async def test_only_the_owner_verifies_and_only_verified_go_live(self):
        r = await self.post('/api/cattok/video', {'caption': 'please verify me'}, guest=GUEST_A)
        uid = (await r.json())['video']['uid']
        self.assertEqual((await self.post('/api/cattok/live', {'title': 'hi'}, guest=GUEST_A)).status, 403)
        self.assertEqual((await self.post('/api/cattok/verify', {'uid': uid, 'on': True}, guest=GUEST_B)).status, 403)
        self.assertEqual((await self.post('/api/cattok/verify', {'uid': uid, 'on': True}, user='Bob')).status, 403)
        self.assertEqual((await self.post('/api/cattok/verify', {'uid': uid, 'on': True}, user='Sofia')).status, 200)
        listing = await (await self.client.get('/api/cattok/videos')).json()
        self.assertTrue(listing['videos'][0]['verified'])
        me = await (await self.client.get('/api/cattok/me', headers={'X-CatTok-Id': GUEST_A})).json()
        self.assertTrue(me['verified'])
        live = await self.post('/api/cattok/live', {'title': 'My first LIVE', 'set': 'cherry', 'cat': 'baby', 'name': 'babyfan'}, guest=GUEST_A)
        self.assertEqual(live.status, 200)
        lives = await (await self.client.get('/api/cattok/lives')).json()
        self.assertEqual(lives['lives'][0]['uid'], uid)
        # removing the tick ends the live
        await self.post('/api/cattok/verify', {'uid': uid, 'on': False}, user='Sofia')
        self.assertEqual((await (await self.client.get('/api/cattok/lives')).json())['lives'], [])

    async def test_owner_is_always_allowed_live_and_viewers_gift_fish(self):
        r = await self.post('/api/cattok/live', {'title': 'Owner LIVE', 'set': 'admin'}, user='Sofia')
        self.assertEqual(r.status, 200)
        uid = 'u:Sofia'
        self.assertEqual((await self.post('/api/cattok/live/%s/comment' % uid, {'text': 'Hello! 👋', 'name': 'viewer1'}, guest=GUEST_B)).status, 200)
        self.assertEqual((await self.post('/api/cattok/live/%s/comment' % uid, {'text': 'go to www.bad.com'}, guest=GUEST_B)).status, 400)
        self.assertEqual((await self.post('/api/cattok/live/%s/gift' % uid, {'gift': 'crown', 'name': 'viewer1'}, guest=GUEST_B)).status, 200)
        self.assertEqual((await self.post('/api/cattok/live/%s/gift' % uid, {'gift': 'free-money'}, guest=GUEST_B)).status, 400)
        state = await (await self.client.get('/api/cattok/live/%s?since=0' % uid, headers={'X-CatTok-Id': GUEST_B})).json()
        kinds = [e['kind'] for e in state['events']]
        self.assertIn('comment', kinds)
        self.assertIn('gift', kinds)
        update = await (await self.post('/api/cattok/live', {'title': 'Owner LIVE'}, user='Sofia')).json()
        self.assertEqual(update['fish'], 50)  # the crown's fish go to the streamer once
        update = await (await self.post('/api/cattok/live', {'title': 'Owner LIVE'}, user='Sofia')).json()
        self.assertEqual(update['fish'], 0)
        await self.post('/api/cattok/live/end', {}, user='Sofia')
        self.assertTrue((await (await self.client.get('/api/cattok/live/%s' % uid)).json())['ended'])

    async def test_likes_and_removal(self):
        r = await self.post('/api/cattok/video', {'caption': 'like me'}, guest=GUEST_A)
        vid = (await r.json())['video']['id']
        liked = await (await self.post('/api/cattok/video/%s/like' % vid, {}, guest=GUEST_B)).json()
        self.assertEqual(liked['video']['likes'], 1)
        self.assertTrue(liked['video']['liked'])
        self.assertEqual((await self.post('/api/cattok/video/%s/remove' % vid, {}, guest=GUEST_B)).status, 403)
        self.assertEqual((await self.post('/api/cattok/video/%s/remove' % vid, {}, user='Sofia')).status, 200)
        self.assertEqual((await (await self.client.get('/api/cattok/videos')).json())['videos'], [])

    async def test_state_survives_a_restart(self):
        await self.post('/api/cattok/video', {'caption': 'saved'}, guest=GUEST_A)
        data = cattok.snapshot()
        cattok.STATE.update({'videos': cattok.OrderedDict(), 'verified': {}, 'likes': {}})
        cattok.restore(data)
        self.assertEqual(len(cattok.STATE['videos']), 1)


if __name__ == '__main__':
    unittest.main()

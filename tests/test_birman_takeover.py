"""Birman Takeover: the owner's 3 announcements, then the Birman Family take over."""
import asyncio
import json
import unittest
from unittest.mock import patch

import social


class FakeAccounts:
    def require(self, request, admin=False):
        return {'username': 'Eli the Goat', 'admin': True, 'owner': True}


class FakeRequest:
    remote = '127.0.0.1'

    def __init__(self, data):
        self._data = data

    async def json(self):
        return self._data


class TakeoverTests(unittest.IsolatedAsyncioTestCase):
    async def call(self, svc, data):
        response = await svc.admin(FakeRequest(data))
        return json.loads(response.text)

    async def test_takeover_after_three_announcements(self):
        svc = social.SocialService(FakeAccounts(), {})
        real_sleep = asyncio.sleep
        with patch('social.same_origin', return_value=True), patch('social.limited', return_value=False), \
                patch('social.asyncio.sleep', new=lambda s: real_sleep(0)):
            r = await self.call(svc, {'action': 'admin_abuse', 'enabled': True, 'takeover': True})
            self.assertTrue(r['ok'])
            self.assertEqual(svc.stage['takeover']['phase'], 'armed')
            for i in range(3):
                r = await self.call(svc, {'action': 'announce', 'scope': 'global', 'message': 'Are you guys ready for admin abuse? %d' % i})
                self.assertTrue(r['ok'])
                self.assertEqual(social.LATEST_ANNOUNCEMENT['by'], 'Eli the Goat')
            for _ in range(20):
                await real_sleep(0)
            self.assertEqual(svc.stage['takeover']['phase'], 'taken')
            self.assertEqual(social.LATEST_ANNOUNCEMENT['by'], 'The Birman Family')
            self.assertTrue(social.LATEST_ANNOUNCEMENT['glitch'])

    async def test_normal_admin_abuse_announcements_unchanged(self):
        svc = social.SocialService(FakeAccounts(), {})
        with patch('social.same_origin', return_value=True), patch('social.limited', return_value=False):
            await self.call(svc, {'action': 'admin_abuse', 'enabled': True})
            self.assertEqual(svc.stage['takeover']['phase'], 'none')
            await self.call(svc, {'action': 'announce', 'scope': 'global', 'message': 'Hello cats'})
            self.assertNotIn('by', social.LATEST_ANNOUNCEMENT)


class CustomPollTests(unittest.IsolatedAsyncioTestCase):
    async def test_owner_custom_poll(self):
        svc = social.SocialService(FakeAccounts(), {})
        with patch('social.same_origin', return_value=True), patch('social.limited', return_value=False):
            r = json.loads((await svc.admin(FakeRequest({'action': 'custom_poll', 'question': 'What should we add next?',
                                                           'choices': ['More cats', 'More bosses', '']}))).text)
            self.assertTrue(r['ok'], r)
            packet = svc.poll_packet()
            self.assertTrue(packet['custom'])
            self.assertEqual(packet['labels'], {'c0': 'More cats', 'c1': 'More bosses'})
            svc.poll['votes']['c1'] = 3
            svc.poll['voters'].add('someone')
            r = json.loads((await svc.admin(FakeRequest({'action': 'event_poll_finish'}))).text)
            self.assertTrue(r['ok'])
            self.assertIsNone(svc.poll)

    async def test_custom_poll_needs_two_choices(self):
        svc = social.SocialService(FakeAccounts(), {})
        with patch('social.same_origin', return_value=True), patch('social.limited', return_value=False):
            response = await svc.admin(FakeRequest({'action': 'custom_poll', 'question': 'Yes?', 'choices': ['Only one']}))
            self.assertEqual(response.status, 400)


if __name__ == '__main__':
    unittest.main()


class SkinTests(unittest.TestCase):
    def test_owner_skin_only_for_owner(self):
        from server import clean_skin
        self.assertEqual(clean_skin({'kind': 'owner'}, {'username': 'Elidagoat', 'owner': True})['kind'], 'owner')
        self.assertEqual(clean_skin({'kind': 'owner'}, {'username': 'elidagoat'})['kind'], 'owner')
        self.assertIsNone(clean_skin({'kind': 'owner'}, {'username': 'someoneelse', 'owner': False}))
        self.assertIsNone(clean_skin({'kind': 'owner'}, None))

    def test_custom_skin_needs_account_and_is_cleaned(self):
        from server import clean_skin
        good = {'kind': 'custom', 'base': '#B7A3D6', 'stripe': '#8f7fa7', 'light': '#d1baf4', 'eye': '#e3a92f', 'nose': '#ef8fa3',
                'earIn': '#f4a9a6', 'tabby': False, 'patch': 'calico', 'white': ['chest', 'nope'], 'acc': ['glasses', 'crown'], 'name': 'Eli the Goat'}
        self.assertIsNone(clean_skin(good, None))
        out = clean_skin(good, {'username': 'tester'})
        self.assertEqual(out['base'], '#b7a3d6')
        self.assertEqual(out['white'], ['chest'])
        self.assertEqual(out['acc'], ['glasses'])
        self.assertEqual(out['name'], '')
        self.assertIsNone(clean_skin({**good, 'base': 'red'}, {'username': 'tester'}))


class ServerScopeAnnouncementTests(unittest.IsolatedAsyncioTestCase):
    async def test_this_server_announcement_reaches_only_that_room(self):
        from server import Room
        from types import SimpleNamespace

        class Sock:
            closed = False

            def __init__(self):
                self.sent = []

            async def send_json(self, msg):
                self.sent.append(msg)

        mine, other = Sock(), Sock()
        rooms = {'ABCDEF': Room(code='ABCDEF', players={'p1': SimpleNamespace(ws=mine)}),
                 'ZZZZZZ': Room(code='ZZZZZZ', players={'p2': SimpleNamespace(ws=other)})}
        svc = social.SocialService(FakeAccounts(), rooms)
        with patch('social.same_origin', return_value=True), patch('social.limited', return_value=False):
            r = json.loads((await svc.admin(FakeRequest({'action': 'announce', 'scope': 'server', 'roomCode': 'abcdef',
                                                           'message': 'Hello this server'}))).text)
        self.assertTrue(r['ok'], r)
        self.assertTrue(any(m.get('type') == 'announcement' and m.get('text') == 'Hello this server' for m in mine.sent), mine.sent)
        self.assertFalse(any(m.get('type') == 'announcement' for m in other.sent))


class AdminAbuseExpiryTests(unittest.IsolatedAsyncioTestCase):
    async def test_admin_abuse_switches_off_after_three_hours_and_clears_birman_message(self):
        svc = social.SocialService(FakeAccounts(), {})
        svc.stage = {'active': True, 'id': 'x', 'startedAt': 1, 'takeover': {'phase': 'taken', 'count': 3, 'at': 1}}
        social.LATEST_ANNOUNCEMENT = {'id': 'b', 'by': 'The Birman Family', 'glitch': True, 'text': 'Hello', 'at': 1}
        await svc.expire_stage()
        self.assertFalse(svc.stage['active'])
        self.assertIsNone(social.LATEST_ANNOUNCEMENT)

    async def test_ending_admin_abuse_clears_birman_message(self):
        svc = social.SocialService(FakeAccounts(), {})
        with patch('social.same_origin', return_value=True), patch('social.limited', return_value=False):
            await svc.admin(FakeRequest({'action': 'admin_abuse', 'enabled': True, 'takeover': True}))
            social.LATEST_ANNOUNCEMENT = {'id': 'b', 'by': 'The Birman Family', 'glitch': True, 'text': 'Hello', 'at': 1}
            await svc.admin(FakeRequest({'action': 'admin_abuse', 'enabled': False}))
        self.assertIsNone(social.LATEST_ANNOUNCEMENT)
        self.assertFalse(svc.stage['active'])

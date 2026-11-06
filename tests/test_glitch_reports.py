"""Glitch reports: required fields, "I don't know", and the GitHub issue text."""
import unittest

from glitch_reports import build_report, issue_body


class GlitchReportTests(unittest.TestCase):
    def test_needs_what_and_how_or_dont_know(self):
        self.assertIsNotNone(build_report({'what': 'hi'}, None, '1.2.3.4')[1])
        self.assertIsNotNone(build_report({'what': 'My cat went through a wall'}, None, '1.2.3.4')[1])
        report, error = build_report({'what': 'My cat went through a wall', 'dontKnow': True}, None, '1.2.3.4')
        self.assertIsNone(error)
        self.assertEqual(report['how'], "I don't know")
        self.assertEqual(report['by'], 'guest')

    def test_issue_body_has_details(self):
        report, _ = build_report({'what': 'Double speed', 'how': 'Pressed sprint twice',
                                  'context': {'cat': 'Astro', 'area': 'town', 'screen': '390x844'}},
                                 {'username': 'Elidagoat'}, '1.2.3.4')
        body = issue_body(report)
        self.assertIn('Double speed', body)
        self.assertIn('Pressed sprint twice', body)
        self.assertIn('Cat: Astro', body)
        self.assertIn('Elidagoat', body)


if __name__ == '__main__':
    unittest.main()


class FakeConn:
    def __init__(self, store):
        self.store = store

    async def execute(self, sql, *args):
        if sql.startswith('INSERT'):
            self.store[args[0]] = (args[1], args[2])

    async def fetch(self, sql, limit):
        rows = sorted(self.store.values(), key=lambda r: -r[0])[:limit]
        return [{'report': r[1]} for r in rows]


class FakePool:
    def __init__(self):
        self.store = {}

    def acquire(self):
        pool = self

        class Ctx:
            async def __aenter__(self):
                return FakeConn(pool.store)

            async def __aexit__(self, *exc):
                return False
        return Ctx()


class PersistenceTests(unittest.IsolatedAsyncioTestCase):
    async def test_reports_survive_in_the_database(self):
        import glitch_reports
        glitch_reports.TABLE_READY = False
        pool = FakePool()
        report, _ = build_report({'what': 'Cat stuck in a tree', 'dontKnow': True}, None, '1.2.3.4')
        self.assertTrue(await glitch_reports.save(pool, report))
        glitch_reports.REPORTS.clear()  # a restart wipes memory…
        loaded = await glitch_reports.load(pool)
        self.assertEqual(loaded[0]['what'], 'Cat stuck in a tree')  # …but the database still has it

    async def test_no_database_means_memory_only(self):
        import glitch_reports
        self.assertIsNone(await glitch_reports.load(None))
        report, _ = build_report({'what': 'Something odd', 'dontKnow': True}, None, '1.2.3.4')
        self.assertFalse(await glitch_reports.save(None, report))


from aiohttp import web  # noqa: E402
from aiohttp.test_utils import AioHTTPTestCase  # noqa: E402

import glitch_reports  # noqa: E402


class FakeAccounts:
    pool = None
    who = None

    def user(self, _request):
        return self.who

    def require(self, request, admin=False):
        raise web.HTTPForbidden()


class OwnerCooldownTests(AioHTTPTestCase):
    """Glitch report #71: the owner could only send 4 reports per 10 minutes."""

    async def get_application(self):
        self.accounts = FakeAccounts()
        app = web.Application()
        glitch_reports.install(app, self.accounts)
        return app

    async def send(self):
        return await self.client.post('/api/glitch-report', json={'what': 'Something odd happened', 'dontKnow': True})

    async def test_owner_can_send_many_reports(self):
        self.accounts.who = {'username': 'OwnerCooldownTest', 'admin': True, 'owner': True}
        for _ in range(10):
            self.assertEqual((await self.send()).status, 200)

    async def test_guests_still_have_a_cooldown(self):
        self.accounts.who = None
        statuses = [(await self.send()).status for _ in range(5)]
        self.assertEqual(statuses[:4], [200] * 4)
        self.assertEqual(statuses[4], 429)

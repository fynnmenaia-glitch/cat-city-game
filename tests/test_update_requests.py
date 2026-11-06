"""Owner update requests: only the verified owner, sensible text, and the issue text."""
import unittest

from update_requests import MARKER, build_request, issue_body, issue_title


class UpdateRequestTests(unittest.TestCase):
    def test_only_owner(self):
        self.assertIsNotNone(build_request({'text': 'Add a new hat please'}, None)[1])
        self.assertIsNotNone(build_request({'text': 'Add a new hat please'}, {'username': 'Someone', 'admin': False})[1])
        req, error = build_request({'text': 'Add a new hat please'}, {'username': 'Elidagoat', 'admin': True})
        self.assertIsNone(error)
        self.assertEqual(req['by'], 'Elidagoat')

    def test_needs_text(self):
        self.assertIsNotNone(build_request({'text': 'hi'}, {'username': 'Elidagoat', 'admin': True})[1])

    def test_issue_text(self):
        req, _ = build_request({'text': 'Make the taxi purple\nand faster'}, {'username': 'Elidagoat', 'admin': True})
        self.assertTrue(issue_title(req).startswith('🛠️ Update request: Make the taxi purple and faster'))
        body = issue_body(req)
        self.assertIn('Make the taxi purple', body)
        self.assertIn('verified owner account', body)
        self.assertIn(MARKER, body)


if __name__ == '__main__':
    unittest.main()

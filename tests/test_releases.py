"""Staged updates: only ids in the manifest can be released, and released ids stay released."""
import json
import tempfile
import unittest
from pathlib import Path

from releases import parse_body, body_for, read_manifest, release


class ReleaseTests(unittest.TestCase):
    def manifest(self, data):
        tmp = Path(tempfile.mkdtemp()) / 'manifest.json'
        tmp.write_text(json.dumps(data), 'utf-8')
        return read_manifest(tmp)

    def test_manifest_skips_bad_entries(self):
        m = self.manifest({'updates': [
            {'id': 'u57-purple-hat', 'title': 'Purple hat', 'issue': 57, 'files': ['u57-purple-hat.js', '../server.py', 'x.html']},
            {'id': 'Bad ID!', 'files': ['a.js']},
            'nope']})
        self.assertEqual(m, [{'id': 'u57-purple-hat', 'title': 'Purple hat', 'kind': 'feature', 'issue': 57, 'files': ['u57-purple-hat.js']}])

    def test_release_only_known_and_new(self):
        m = [{'id': 'u1-a', 'title': 'a', 'issue': 1, 'files': []}, {'id': 'u2-b', 'title': 'b', 'issue': 2, 'files': []}]
        state = {'released': ['u1-a'], 'history': []}
        self.assertEqual(release(state, ['u1-a', 'u2-b', 'u9-ghost'], m, 'Elidagoat'), ['u2-b'])
        self.assertEqual(state['released'], ['u1-a', 'u2-b'])
        self.assertEqual(state['history'][-1]['ids'], ['u2-b'])
        self.assertEqual(release(state, ['u2-b'], m, 'Elidagoat'), [])

    def test_store_round_trip(self):
        state = {'released': ['u1-a', 'u2-b'], 'history': [{'at': 1, 'by': 'Elidagoat', 'ids': ['u2-b']}]}
        self.assertEqual(parse_body(body_for(state)), state)
        self.assertIsNone(parse_body('no json here'))


if __name__ == '__main__':
    unittest.main()

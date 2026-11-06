"""📸 Glitch report screenshots: only small real JPEGs, only for the player's own fresh report."""
import base64
import time
import unittest

import glitch_reports
from glitch_screens import decode_image, find_report, PREFIX

JPEG = b'\xff\xd8\xff\xe0' + b'\x00' * 50 + b'\xff\xd9'


class ScreenshotTests(unittest.TestCase):
    def test_decode_accepts_small_jpeg_only(self):
        self.assertEqual(decode_image(PREFIX + base64.b64encode(JPEG).decode()), JPEG)
        self.assertIsNone(decode_image('data:image/png;base64,' + base64.b64encode(JPEG).decode()))
        self.assertIsNone(decode_image(PREFIX + base64.b64encode(b'<script>').decode()))
        self.assertIsNone(decode_image(PREFIX + 'not base64!!'))
        self.assertIsNone(decode_image(PREFIX + base64.b64encode(b'\xff\xd8' + b'a' * 500_000 + b'\xff\xd9').decode()))
        self.assertIsNone(decode_image(None))

    def test_only_own_recent_report(self):
        glitch_reports.REPORTS.appendleft({'id': 'abc123', 'at': int(time.time()), 'by': 'guest', 'remote': '1.2.3.4'})
        self.assertIsNotNone(find_report('abc123', '1.2.3.4', None))
        self.assertIsNone(find_report('abc123', '9.9.9.9', None))
        self.assertIsNone(find_report('abc123', '1.2.3.4', None, now=time.time() + 3600))
        self.assertIsNone(find_report('nope', '1.2.3.4', None))
        glitch_reports.REPORTS.appendleft({'id': 'def456', 'at': int(time.time()), 'by': 'Elidagoat', 'remote': '5.5.5.5'})
        self.assertIsNotNone(find_report('def456', '6.6.6.6', 'Elidagoat'))


if __name__ == '__main__':
    unittest.main()

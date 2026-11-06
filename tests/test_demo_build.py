"""The demo website build: four biomes, no comments, nothing that gives away how it was made."""
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))

from jsstrip import strip_js  # noqa: E402


class DemoBuildTests(unittest.TestCase):
    def test_strip_keeps_strings_and_regexes(self):
        src = "const a='// not a comment';// gone\nconst r=/\\/\\/x/g; /* gone */ const t=`x ${a/2} // kept`;\n"
        out = strip_js(src)
        self.assertIn("'// not a comment'", out)
        self.assertIn('/\\/\\/x/g', out)
        self.assertIn('`x ${a/2} // kept`', out)
        self.assertNotIn('gone', out)

    def test_build_passes_its_own_checks(self):
        result = subprocess.run([sys.executable, str(ROOT / 'tools' / 'build_demo.py')], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        index = (ROOT / 'demo' / 'index.html').read_text('utf-8')
        self.assertIn('CAT_CITY_DEMO', index)
        overhaul = (ROOT / 'demo' / 'world-overhaul.js').read_text('utf-8')
        self.assertNotIn('<.17', overhaul)


if __name__ == '__main__':
    unittest.main()

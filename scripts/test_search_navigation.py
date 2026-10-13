import tempfile
import unittest
from pathlib import Path
from audit_search_navigation import destination


class SearchNavigationTests(unittest.TestCase):
    def test_redirect_fragment_and_rewrite_resolve_to_current_section(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'page.html').write_text('<section id="current"></section>')
            rules = {'/old': ('/canonical#current', 308), '/canonical': ('/page.html', 200)}
            file, fragment = destination(root, '/old#obsolete', rules)
            self.assertEqual(file.name, 'page.html')
            self.assertEqual(fragment, 'current')

    def test_missing_section_fails_even_when_page_exists(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'page.html').write_text('<h2 id="current">Heading</h2>')
            with self.assertRaisesRegex(ValueError, 'Missing search section'):
                destination(root, '/page#removed', {})

    def test_loops_and_missing_pages_fail(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaisesRegex(ValueError, 'redirect loop'):
                destination(root, '/one', {'/one': ('/two', 308), '/two': ('/one', 308)})
            with self.assertRaisesRegex(ValueError, 'Missing search page'):
                destination(root, '/absent', {})

    def test_directory_and_non_html_resource_are_valid_destinations(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'area').mkdir()
            (root / 'area/index.html').write_text('<h2 id="section">Heading</h2>')
            (root / 'feed.xml').write_text('<feed/>')
            self.assertEqual(destination(root, '/area/#section', {})[1], 'section')
            self.assertEqual(destination(root, '/feed.xml', {})[0].name, 'feed.xml')


if __name__ == '__main__':
    unittest.main()

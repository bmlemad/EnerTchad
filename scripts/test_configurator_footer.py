import unittest
from apply_configurator_footer import patch

class FooterTests(unittest.TestCase):
    def test_fragment_keeps_footer_outside_app_root(self):
        page = '<div id="root"></div><script src="app.js"></script>\n'
        reference = '<main>Published source</main><footer><a href="/contact">Contact</a></footer>'
        result = patch(page, reference)
        self.assertIn('<footer><a href="/contact">Contact</a></footer>', result)
        self.assertLess(result.index('</div>'), result.index('<footer'))
        self.assertEqual(patch(result, reference), result)

    def test_existing_footer_is_preserved(self):
        page = '<html><body><footer>Existing footer</footer></body></html>'
        self.assertEqual(patch(page, '<footer>Other footer</footer>'), page)

    def test_document_footer_is_inside_body(self):
        result = patch('<body><div id="root"></div></body>', '<footer>Published footer</footer>')
        self.assertLess(result.index('<footer>'), result.index('</body>'))
        self.assertEqual(result.count('<footer>'), 1)

    def test_missing_reference_fails_explicitly(self):
        with self.assertRaises(ValueError):
            patch('<div id="root"></div>', '<main>No footer</main>')

if __name__ == '__main__':
    unittest.main()

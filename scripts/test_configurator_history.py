import unittest
from apply_configurator_history import patch

class ExportTests(unittest.TestCase):
    def test_fragment_export_includes_handler_once(self):
        page = '<div id="root"></div>\n<script src="app.js"></script>\n'
        result = patch(page)
        self.assertEqual(result.count('id="et-config-history"'), 1)
        self.assertIn(page.strip(), result)
        self.assertEqual(patch(result), result)

    def test_complete_document_keeps_handler_inside_body(self):
        page = '<html><body><div id="root"></div></body></html>'
        result = patch(page)
        self.assertLess(result.index('id="et-config-history"'), result.index('</body>'))
        self.assertEqual(patch(result), result)

if __name__ == '__main__':
    unittest.main()

"""Protect scripts, existing anchors and content boundaries during copy changes."""
import re
import unittest
from html.parser import HTMLParser
from align_commercial_coherence import ROOT, PAIRS, transform, insert_note, outside_scripts, brochure_script_copy
from align_b2b_strategy import customers, introduction, customer_blocks


class Identifiers(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        identifier = dict(attrs).get('id')
        if identifier:
            self.ids.append(identifier)


class CommercialCoherenceTests(unittest.TestCase):
    def test_journal_note_ignores_tag_like_css_and_javascript(self):
        head = '<style>/* <main> is not a page boundary */</style><script>var t="<main>";</script>'
        source = head + '<article role="main"><h1>Dated title</h1><p>Body</p></article>'
        result = insert_note(source, 'journal-test.html', False)
        self.assertTrue(result.startswith(head + '<article role="main"><section'))
        self.assertEqual(insert_note(result, 'journal-test.html', False), result)

    def test_executable_copy_is_preserved(self):
        source = '<script>var label="0 fraud";</script><style>/* 0 fraud */</style><p>0 fraud</p>'
        result = outside_scripts(source, True)
        self.assertIn('<script>var label="0 fraud";</script>', result)
        self.assertIn('<style>/* 0 fraud */</style>', result)
        self.assertIn('<p>Controls</p>', result)

    def test_journal_preserves_title_and_date_before_the_update(self):
        source = '<article role="main"><div class="jhero"><h1>Title</h1><p>Original date</p></div><div class="jbody"><p>Body</p></div></article>'
        result = insert_note(source, 'journal-test.html', False)
        self.assertLess(result.index('Original date'), result.index('id="commercial-scope"'))
        self.assertLess(result.index('id="commercial-scope"'), result.index('<p>Body</p>'))
        self.assertEqual(insert_note(result, 'journal-test.html', False), result)

    def test_missing_boundary_fails_without_guessing(self):
        with self.assertRaises(ValueError):
            insert_note('<style>/* <main> */</style><div>Other</div>', 'unknown.html', False)

    def test_customer_preparation_keeps_the_removed_summary_optional(self):
        for en in (False, True):
            source = introduction(en) + ''.join(customer_blocks(en).values())
            result = customers(source, en)
            self.assertNotIn('id="comparer"', result)
            self.assertEqual(customers(result, en), result)

    def test_reviewed_pages_keep_anchors_and_scripts_and_are_idempotent(self):
        for pair in PAIRS:
            for en, path in enumerate(pair):
                with self.subTest(page=path):
                    source = (ROOT / path).read_text(encoding='utf-8')
                    result = transform(source, path, bool(en))
                    self.assertEqual(transform(result, path, bool(en)), result)
                    before, after = Identifiers(source).ids, Identifiers(result).ids
                    self.assertTrue(set(before).issubset(after), set(before) - set(after))
                    self.assertEqual(len(after), len(set(after)))
                    pattern = r'<(?:script|style)\b[^>]*>.*?</(?:script|style)>'
                    before_scripts = re.findall(pattern, source, re.S | re.I)
                    if path.startswith('brochure'):
                        before_scripts = [brochure_script_copy(item, bool(en)) if item.lower().startswith('<script') else item for item in before_scripts]
                    self.assertEqual(before_scripts, re.findall(pattern, result, re.S | re.I))


if __name__ == '__main__':
    unittest.main()

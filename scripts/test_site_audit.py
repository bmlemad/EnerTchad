"""Regression checks for the audited user journeys."""
import re
import unittest
from apply_site_audit import ROOT, transform


class SiteAuditTests(unittest.TestCase):
    def test_tool_presets_and_existing_disclosures_survive(self):
        source = '<a href="/configurateur-service-integre#p=operateur&amp;d=geo" aria-label="Configure"><strong>Configure</strong></a><a href="/amont/calculateur-baril-additionnel">Calculator (in French)</a><script>const x="/atlas/";</script>'
        result = transform(source, 'example-en.html')
        self.assertIn('#p=operateur&amp;d=geo', result)
        self.assertIn('aria-label="Configure (in French)"', result)
        self.assertEqual(result.count('(in French)'), 3)
        self.assertIn('<script>const x="/atlas/";</script>', result)
        self.assertEqual(transform(result, 'example-en.html'), result)
        self.assertEqual(transform(source, 'example.html'), source)

    def test_prepared_english_atlas_and_tools(self):
        for path in ('index-en.html', 'projets-en.html', 'amont/services-ep-en.html', 'intermediaire/collecte-en.html', 'intermediaire/services-en.html', 'pole-aval-en.html'):
            source = (ROOT / path).read_text()
            self.assertNotRegex(source, r'href="/atlas/?"', path)
            for opening, body in re.findall(r'(<a\b[^>]*>)(.*?)</a>', source, re.S):
                if re.search(r'href="/(?:configurateur-service-integre|amont/calculateur-baril-additionnel)(?:["#?])', opening):
                    self.assertRegex(body, r'in French|\(FR\)', path)

    def test_prepared_catalogue_has_no_blanket_tariff_claim(self):
        for path in ('aval/boutique.html', 'aval/boutique-en.html'):
            source = (ROOT / path).read_text()
            hero = re.search(r'<p class="pp-sublead">(.*?)</p>', source, re.S)[1]
            self.assertNotIn('ARSAT', hero)
            self.assertNotIn('quote at the ARSAT price', source)
            self.assertNotRegex(source, r'(?:ARSAT price|Prix ARSAT) · transparent')
            self.assertIn('ARSAT', source)  # Product-specific reference information remains.

    def test_journal_eiti_destination(self):
        source = (ROOT / 'journal-gouvernance-avant-actifs-en.html').read_text()
        self.assertIn('/glossaire-petrolier-en#t-eiti', source)
        self.assertNotIn('/glossaire-petrolier-en#t-itie', source)


if __name__ == '__main__':
    unittest.main()

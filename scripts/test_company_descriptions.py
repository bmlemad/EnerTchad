import json
import unittest
from align_company_descriptions import DESCRIPTIONS, HOME_PREVIEWS, ORGANIZATION_ID, transform


class CompanyDescriptionTests(unittest.TestCase):
    def test_formation_stage_is_consistent_and_other_fields_are_preserved(self):
        for lang in ('fr', 'en'):
            node = {'@type': 'Organization', '@id': ORGANIZATION_ID, 'description': 'Old company description', 'legalName': 'EnerTchad S.A.', 'identifier': {'value': 'Registration in progress'}}
            text = '<html lang="' + lang + '"><script type="application/ld+json">' + json.dumps(node) + '</script></html>'
            result = transform(text, 'societe.html')
            updated = json.loads(result.split('application/ld+json">')[1].split('</script>')[0])
            self.assertEqual(updated['description'], DESCRIPTIONS[lang])
            self.assertEqual(updated['legalName'], node['legalName'])
            self.assertEqual(updated['identifier'], node['identifier'])
            self.assertEqual(result, transform(result, 'societe.html'))

    def test_home_preview_channels_and_webpage_description_agree(self):
        text = '<html lang="en"><meta name="description" content="Old"><meta property="og:description" content="Old"><meta name="twitter:description" content="Old"><script type="application/ld+json">{"@type":"WebPage","description":"Old"}</script></html>'
        result = transform(text, 'index-en.html')
        self.assertEqual(result.count(HOME_PREVIEWS['en']), 4)
        self.assertNotIn('content="Old"', result)

    def test_references_other_organizations_and_arabic_are_preserved(self):
        for lang, node in [('en', {'@type': 'Organization', '@id': ORGANIZATION_ID}), ('en', {'@type': 'Organization', '@id': 'https://other.example/#organization', 'description': 'Other organization'}), ('ar', {'@type': 'Organization', '@id': ORGANIZATION_ID, 'description': 'Existing Arabic description'})]:
            text = '<html lang="' + lang + '"><script type="application/ld+json">' + json.dumps(node) + '</script></html>'
            self.assertEqual(transform(text, 'page.html'), text)

    def test_subsite_homepage_keeps_its_own_preview(self):
        text = '<html lang="en"><meta name="description" content="Subsite preview"></html>'
        self.assertEqual(transform(text, 'area/index.html'), text)


if __name__ == '__main__':
    unittest.main()

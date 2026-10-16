"""Guard language switches while updating shared engineering navigation."""
import unittest
from align_engineering_offer import navigation


class EngineeringNavigation(unittest.TestCase):
    def test_english_menu_preserves_french_destination(self):
        html = ('<html lang="en"><a href="/enerconseils/">'
                '<strong>Advisory</strong><em>EnerConseils: studies, audits</em></a>'
                '<a href="/enerconseils/" lang="fr">Français</a></html>')
        result = navigation(html)
        self.assertIn('href="/pole-enerconseils-en"><strong>Engineering &amp; Advisory</strong>', result)
        self.assertIn('href="/enerconseils/" lang="fr">Français</a>', result)

    def test_french_menu_preserves_english_destination(self):
        html = ('<html lang="fr"><a href="/enerconseils/">Conseil</a>'
                '<a href="/pole-enerconseils-en" lang="en">English</a></html>')
        result = navigation(html)
        self.assertIn('href="/enerconseils/">Ingénierie &amp; Conseil</a>', result)
        self.assertIn('href="/pole-enerconseils-en" lang="en">English</a>', result)
        self.assertEqual(navigation(result), result)

    def test_contextual_advisory_anchors_survive(self):
        html = '<html lang="fr"><a href="/enerconseils/#audits">Conseil</a></html>'
        self.assertIn('href="/enerconseils/#audits"', navigation(html))


if __name__ == '__main__':
    unittest.main()

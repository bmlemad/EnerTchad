"""Guard language switches while updating shared engineering navigation."""
import unittest
from align_engineering_offer import navigation, homepage_access, activity_access, ACTIVITIES, section


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

    def test_homepage_keeps_four_industrial_segments(self):
        for en, href in [(False, '/enerconseils/#ingenierie'), (True, '/pole-enerconseils-en#ingenierie')]:
            cards = '<article>Industrial segment</article>' * 4
            html = '<section id="chaine"><div class="et-inner"><div class="et-segments">' + cards + '</div></div></section>'
            result = homepage_access(html, en)
            self.assertEqual(result.count('<article>'), 4)
            self.assertIn('href="' + href + '"', result)
            self.assertEqual(result.count('id="engineering-home-access"'), 1)
            self.assertEqual(homepage_access(result, en), result)

    def test_activity_links_target_engineering_without_changing_header(self):
        for activity in ACTIVITIES:
            for en in (False, True):
                route = '/pole-enerconseils-en' if en else '/enerconseils/'
                anchor = '<a href="' + route + '"><b>Engineering</b><span>Old advisory description</span></a>'
                html = '<nav>' + anchor + '</nav><main>' + anchor + '</main>'
                result = activity_access(html, activity[1 if en else 0])
                self.assertIn('<nav>' + anchor + '</nav>', result)
                self.assertIn('href="' + route + '#ingenierie"', result)
                self.assertNotIn('Old advisory description</span></a></main>', result)
                self.assertEqual(activity_access(result, activity[1 if en else 0]), result)

    def test_engineering_links_back_to_each_activity_in_its_language(self):
        for en in (False, True):
            html = section(en)
            for activity in ACTIVITIES:
                self.assertIn('href="' + activity[3 if en else 2] + '"', html)


if __name__ == '__main__':
    unittest.main()

"""Checks for misleading subscription actions and language-specific routing."""
import unittest
from align_investor_journeys import transform


class InvestorJourneyTests(unittest.TestCase):
    def test_french_menu_and_header_routes(self):
        text = '<html lang="fr"><a href="/investisseurs#souscrire">Investir</a><a href="/investisseurs#souscrire"><span>Passer à l’acte</span><b>Souscrire au capital</b><small>De 100 M à 10 Md FCFA, par paliers</small></a></html>'
        output = transform(text)
        self.assertEqual(output.count('/contact?profil=invest'), 2)
        self.assertNotIn('#souscrire', output)
        self.assertIn('Statut, conditions et prochaines étapes', output)
        self.assertEqual(output, transform(output))

    def test_same_page_subscription_action(self):
        text = '<html lang="en"><a href="#souscrire">Subscribe</a></html>'
        self.assertIn('/contact-en?profil=invest', transform(text))

    def test_english_absolute_destination_keeps_its_host(self):
        text = '<html lang="en"><a href="https://enertchad.com/investisseurs-en#souscrire">Subscribe to the capital</a></html>'
        output = transform(text)
        self.assertIn('https://enertchad.com/contact-en?profil=invest', output)
        self.assertIn('Contact investor relations', output)

    def test_informational_links_and_other_languages_are_preserved(self):
        for text in ['<html lang="ar"><a href="/investisseurs#souscrire">Invest</a></html>', '<html lang="fr"><a href="/investisseurs#souscrire">Participation au capital</a><a href="/projets">Projets</a></html>']:
            self.assertEqual(transform(text), text)


if __name__ == '__main__':
    unittest.main()

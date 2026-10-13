import unittest
from align_arabic_readiness import transform

class ArabicReadinessTests(unittest.TestCase):
    def test_form_reuses_existing_visible_heading_and_receives_focus(self):
        source = '<html lang="ar"><head></head><body><h2 id="contact-form-title">أرسل طلبك إلى إينيرتشاد</h2><form id="ctForm"></form></body></html>'
        result = transform(source, 'ar-contact.html')
        self.assertIn('aria-labelledby="contact-form-title"', result)
        self.assertIn('tabindex="-1"', result)
        self.assertIn('contact_profiles.js?b=2026101310', result)
        self.assertEqual(result, transform(result, 'ar-contact.html'))

    def test_investor_action_and_document_languages(self):
        source = '<html lang="ar"><a href="/ar-contact">تواصل معنا</a><a href="/Fiche_Investisseur_EnerTchad.pdf">PDF</a><a href="/Fiche_EnerTchad_AR.pdf">Arabic PDF</a></html>'
        result = transform(source, 'ar-investisseurs.html')
        self.assertIn('/ar-contact?profil=invest#ctForm', result)
        self.assertEqual(result.count('بالفرنسية'), 1)
        self.assertIn('<a href="/Fiche_EnerTchad_AR.pdf">Arabic PDF</a>', result)
        self.assertEqual(result, transform(result, 'ar-investisseurs.html'))

    def test_other_languages_unchanged(self):
        source = '<html lang="fr"><form id="ctForm"></form></html>'
        self.assertEqual(source, transform(source, 'contact.html'))

if __name__ == '__main__':
    unittest.main()

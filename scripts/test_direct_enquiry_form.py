import unittest
from direct_enquiry_form import transform


class DirectEnquiryTests(unittest.TestCase):
    def test_known_enquiries_open_the_form_and_preserve_url_details(self):
        source = '<html lang="en"><a href="/contact-en?profil=invest&amp;source=menu">Investor contact</a><a href="https://enertchad.com/contact?profil=fournisseur">Supplier</a></html>'
        result = transform(source, 'page.html')
        self.assertIn('/contact-en?profil=invest&amp;source=menu#ctForm', result)
        self.assertIn('https://enertchad.com/contact?profil=fournisseur#ctForm', result)
        self.assertEqual(result, transform(result, 'page.html'))

    def test_general_contact_existing_fragments_and_external_destinations_stay_unchanged(self):
        source = '<html lang="fr"><a href="/contact">Contact</a><a href="/contact?profil=invest#ecrire">Details</a><a href="https://other.example/contact?profil=invest">Other</a><a href="/contact?profil=unknown">Unknown</a></html>'
        self.assertEqual(transform(source, 'page.html'), source)

    def test_form_has_a_name_and_can_receive_fragment_focus(self):
        source = '<html lang="en"><head></head><h2>Write to us</h2><form id="ctForm"></form></html>'
        result = transform(source, 'contact-en.html')
        self.assertIn('id="ctFormTitle"', result)
        self.assertIn('aria-labelledby="ctFormTitle"', result)
        self.assertIn('tabindex="-1"', result)
        self.assertIn('scroll-margin-top', result)
        self.assertEqual(result, transform(result, 'contact-en.html'))

    def test_arabic_pages_are_unchanged(self):
        source = '<html lang="ar"><a href="/contact?profil=invest">Contact</a></html>'
        self.assertEqual(transform(source, 'page.html'), source)


if __name__ == '__main__':
    unittest.main()

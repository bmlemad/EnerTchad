"""Protect surrounding page content when replacing nested editorial blocks."""
import unittest
from align_b2b_strategy import replace_node, introduction, customer_blocks


class B2BPreparationTests(unittest.TestCase):
    def test_nested_nodes_do_not_consume_the_next_section(self):
        source = '<main><div id="offer"><div><div>Old</div></div></div><div id="next">Keep</div></main>'
        self.assertEqual(replace_node(source, 'offer', '<div id="offer">New</div>'),
                         '<main><div id="offer">New</div><div id="next">Keep</div></main>')

    def test_unknown_or_incomplete_boundary_fails_explicitly(self):
        for source in ('<main>Other</main>', '<div id="offer"><div>Unclosed</div>'):
            with self.assertRaises(ValueError):
                replace_node(source, 'offer', 'New')

    def test_customer_paths_preserve_language_and_explicit_contact_profiles(self):
        for en in (False, True):
            suffix = '-en' if en else ''
            intro = introduction(en)
            self.assertIn('href="/achats' + suffix + '"', intro)
            self.assertNotIn('profil=fournisseur', intro)
            blocks = customer_blocks(en)
            self.assertIn('/contact' + suffix + '?profil=b2b#ctForm', blocks['industriels'])
            self.assertIn('/contact' + suffix + '?profil=ep#ctForm', blocks['operateurs'])
            self.assertIn('/pole-enerconseils-en#ingenierie' if en else '/enerconseils/#ingenierie', blocks['operateurs'])


if __name__ == '__main__':
    unittest.main()

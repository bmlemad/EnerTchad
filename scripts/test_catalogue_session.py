import unittest
from align_catalogue_session import patch

class CatalogueTests(unittest.TestCase):
    def test_bilingual_initialisation_is_preserved(self):
        for label in ('Aucun article', 'No item'):
            source = "var cart={},cur='tous';\nfunction renderCart(){\n var label='" + label + "';\n}"
            result = patch(source)
            self.assertIn(label, result)
            self.assertIn('EnerTchadCatalogueSession.read(window.sessionStorage,P)', result)
            self.assertIn('EnerTchadCatalogueSession.save(window.sessionStorage,cart,P)', result)
            self.assertEqual(patch(result), result)

    def test_changed_catalogue_structure_requires_review(self):
        with self.assertRaises(ValueError):
            patch('An unrelated page')

if __name__ == '__main__':
    unittest.main()

import unittest
from align_catalogue_quantity import patch, OLD, OLD_SUM, INPUT

class QuantityMigrationTests(unittest.TestCase):
    def test_bilingual_validation_and_idempotence(self):
        source = OLD + OLD_SUM + INPUT
        for english, message in ((False, 'Saisissez un nombre entier'), (True, 'Enter a whole number')):
            result = patch(source, english)
            self.assertIn(message, result)
            self.assertIn('reportValidity()', result)
            self.assertIn('required', result)
            self.assertIn('Number.isSafeInteger(cart[key].q+q)', result)
            self.assertEqual(patch(result, english), result)

    def test_unknown_structure_rejected(self):
        with self.assertRaises(ValueError):
            patch('unrelated')

if __name__ == '__main__':
    unittest.main()

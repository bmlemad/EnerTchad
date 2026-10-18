import unittest
from align_mobile_sheet_focus import patch_js
class FocusPreparationTests(unittest.TestCase):
    def test_idempotent_and_keeps_original_dialog(self):
        source="(function(){s.id='nezSheet';/* original */})();"
        result=patch_js(source,'focus_code();')
        self.assertIn(source,result)
        self.assertEqual(patch_js(result,'focus_code();'),result)
    def test_unknown_layout_requires_review(self):
        with self.assertRaises(ValueError):patch_js('unrelated','code')
if __name__=='__main__':unittest.main()

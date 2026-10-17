import unittest
from apply_visual_polish import block,page_patch
class VisualTests(unittest.TestCase):
    def test_repeated_preparation_keeps_one_patch(self):
        for kind in ('config','engineering','contact',None):
            page='<html lang="fr"><body><script src="/assets/chrome/coherence-20261013.js"></script></body></html>'
            result=page_patch(page,kind)
            self.assertEqual(page_patch(result,kind),result)
            self.assertIn('coherence-20261013.js?b=2026101703',result)
        source=block('published','et-visual','new code')
        self.assertEqual(block(source,'et-visual','new code'),source)
if __name__=='__main__':unittest.main()

import unittest
from align_mobile_quick_nav import transform

class MobileNavigationTests(unittest.TestCase):
    def test_routes_and_full_accessible_names_are_preserved(self):
        links=''.join('<a href="/'+str(i)+'"><svg aria-hidden="true"></svg>'+name+'</a>' for i,name in enumerate(['Accueil','Clients','Investisseurs','Fournisseurs','Contact']))
        source='<html><head></head><nav id="nezBar">'+links+'</nav></html>'
        result=transform(source)
        self.assertIn('aria-label="Investisseurs"',result)
        self.assertIn('aria-label="Fournisseurs"',result)
        self.assertIn('>Invest.</span>',result)
        self.assertIn('>Fourn.</span>',result)
        for i in range(5):self.assertIn('href="/'+str(i)+'"',result)
        self.assertEqual(result.count('<svg'),5)
        self.assertEqual(result,transform(result))

    def test_english_labels_do_not_gain_french_abbreviations(self):
        source='<html><head></head><nav id="nezBar">'+''.join('<a href="/">'+x+'</a>' for x in ['Home','Customers','Investors','Suppliers','Contact'])+'</nav></html>'
        result=transform(source)
        self.assertNotIn('class="et-mobile-label-long et-has-short"',result)
        self.assertIn('aria-label="Suppliers"',result)

    def test_other_navigation_is_not_reformatted(self):
        source='<html><head></head><nav id="nezBar"><a href="#one">One</a></nav></html>'
        self.assertEqual(source,transform(source))

if __name__=='__main__':unittest.main()

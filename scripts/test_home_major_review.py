"""Acceptance checks for the bilingual homepage review."""
import re
import unittest
from apply_home_major_review import ROOT, home, progress, plain

class HomepageReview(unittest.TestCase):
 # Lot 27 (m16, voie B) : les sources committees sont deja transformees ; plus de transformation ici.
 def test_bilingual_structure_and_idempotence(self):
  for en in (False,True):
   with self.subTest(en=en):
    s=(ROOT/('index-en.html' if en else 'index.html')).read_text()
    self.assertEqual(home(s,en),s)
    main=re.search(r'<main\b.*?</main>',s,re.S)[0]
    self.assertEqual(len(re.findall(r'<h1\b',main)),1)
    ids=re.findall(r'\bid="([^"]+)"',s)
    self.assertEqual(len(ids),len(set(ids)))
    order=['id="besoin-client"','id="home-progress"','id="chaine"','id="programme-cible"','id="mod-equipe"','id="home-hse"','id="home-publications"']
    offsets=[main.index(x) for x in order]
    self.assertEqual(offsets,sorted(offsets))
    self.assertEqual(main.count('class="et-seg-img"'),4)
    self.assertIn('href="#besoin-client"',main)
    suffix='-en' if en else ''
    client='/boutique/en/clients' if en else '/boutique/clients'
    for anchor in ('industriels','flottes','operateurs'):
     self.assertIn(f'href="{client}#{anchor}"',main)
    for profile in ('b2b','ep'):
     self.assertIn(f'/contact{suffix}?profil={profile}#ctForm',main)
    self.assertIn('id="commercial-scope"',main)
    self.assertNotIn('class="et-metrics"',main)
    self.assertIn('80%',main) if en else self.assertIn('80 %',main)
    self.assertIn('not a measured result' if en else 'pas un résultat mesuré',main)
    self.assertIn('Sources reviewed' if en else 'Sources consultées',main)
    self.assertIn('datetime="2026-10-22"',main)
 def test_atlas_link_preserves_homepage_language(self):
  for en in (False,True):
   with self.subTest(en=en):
    s=(ROOT/('index-en.html' if en else 'index.html')).read_text()
    publications=re.search(r'<section id="home-publications".*?</section>',s,re.S)[0]
    expected='/atlas-en' if en else '/atlas/'
    self.assertIn(f'href="{expected}"',publications)
    if en:self.assertNotIn('href="/atlas/"',publications)
    target=ROOT/('atlas-en.html' if en else 'atlas/index.html')
    self.assertTrue(target.is_file())
    language='en' if en else 'fr'
    self.assertRegex(target.read_text(),r'<html[^>]*lang="'+language+'"')
 def test_project_cards_preserve_source(self):
  for en in (False,True):
   s=(ROOT/('projets-en.html' if en else 'projets.html')).read_text()
   table=re.search(r'<table class="et-project-table">.*?</table>',s,re.S)[0]
   rows=re.findall(r'<tr>(.*?)</tr>',table,re.S)[1:]
   cards=progress(en)
   self.assertEqual(cards.count('<article '),3)
   for i in (0,3,4):
    cells=re.findall(r'<(?:td|th)\b[^>]*>(.*?)</(?:td|th)>',rows[i],re.S)
    for cell in cells[:3]: self.assertIn(plain(cell),plain(cards))
   self.assertIn('2026-10-08',cards)
   self.assertEqual(cards.count('milestone evidence not published' if en else 'Pièce spécifique au jalon non publiée'),3)

if __name__=='__main__':unittest.main()

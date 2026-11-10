"""Acceptance checks for the homepage.

Lots 106-A et 106-B (8 novembre 2026) : l'accueil FR puis l'accueil EN adoptent la structure du brief du DG (héros, bande des
trois besoins, vision, quatre maillons, repères, gouvernance, feuille de route, impact, centre investisseurs).
Les faits publiés restent sourcés : cible de 80 % « pas un résultat mesuré », sources HSE datées, article du 22 octobre 2026."""
import re
import unittest
from apply_home_major_review import ROOT, home, progress, plain

# Lot 112 (10 novembre 2026, direction immersive choisie par le DG) : repères en bande de données sous le héros, premier projet phare après les trois besoins.
NEW_ORDER=['id="reperes"','id="besoin-client"','id="projet-phare"','id="vision"','id="chaine"','id="gouvernance-accueil"','id="feuille-de-route"','id="impact"','id="home-publications"']

class HomepageReview(unittest.TestCase):
 def check_common(self,s,main,en):
  self.assertEqual(len(re.findall(r'<h1\b',main)),1)
  ids=re.findall(r'\bid="([^"]+)"',s)
  self.assertEqual(len(ids),len(set(ids)))
  self.assertEqual(main.count('class="et-seg-img"'),4)
  self.assertIn('<header class="et-hero"',main)  # crochet de la dernière publication (scripts/next/critical.mjs)
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
  # la section de confiance garde exactement cinq liens (qa/site.spec.js)
  trust=re.search(r'<section id="home-publications".*?</section>',main,re.S)[0]
  self.assertEqual(len(re.findall(r'<a\b[^>]*\bhref=',trust)),5)

 def check_structure(self,en):
  s=(ROOT/('index-en.html' if en else 'index.html')).read_text()
  main=re.search(r'<main\b.*?</main>',s,re.S)[0]
  self.check_common(s,main,en)
  offsets=[main.index(x) for x in NEW_ORDER]
  self.assertEqual(offsets,sorted(offsets))
  # héros : titre du brief, libellés d'action du contrat CTA (qa/cta-vocabulary-contract.spec.js)
  h1='<h1 id="ph-h1">Chad’s energy. Integrated.</h1>' if en else '<h1 id="ph-h1">L’énergie du Tchad. Intégrée.</h1>'
  self.assertIn(h1,main)
  primary='Discuss a business requirement' if en else 'Présenter un besoin professionnel'
  self.assertIn(f'<a class="et-primary" href="#besoin-client">{primary}</a>',main)
  self.assertIn('href="/projets-en#avancement">Projects and status' if en else 'href="/projets#avancement">Projets et avancement',main)
  # repères : trois chiffres, tous publiés ailleurs sur le site, aucun contenu « à fournir » en ligne
  reperes=re.search(r'<section id="reperes".*?</section>',main,re.S)[0]
  self.assertEqual(reperes.count('<li>'),3)
  for banned in ('à fournir','À FOURNIR','to be provided','[NOM','Artificial Lift'):
   self.assertNotIn(banned,main)
  # feuille de route : cinq étapes, une seule datée
  route=re.search(r'<ol class="hm-route">.*?</ol>',main,re.S)[0]
  self.assertEqual(route.count('<details'),5)
  self.assertEqual(route.count('<time '),1)
  self.assertEqual(route.count('Timetable not published' if en else 'Calendrier non publié'),3)
  # feuilles : la nouvelle feuille remplace les feuilles propres à l'ancien accueil
  self.assertIn('/assets/chrome/home-2026.css',s)
  for gone in ('home-inline-premium.css','home-photos.css','qa-premium-20261003'):
   self.assertNotIn(gone,s)

 def test_fr_structure_lot_106(self):
  self.check_structure(False)

 def test_en_structure_lot_106_b(self):
  self.check_structure(True)

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

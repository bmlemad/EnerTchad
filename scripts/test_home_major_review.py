"""Acceptance checks for the homepage.

Lots 106-A et 106-B (8 novembre 2026) : l'accueil FR puis l'accueil EN adoptent la structure du brief du DG (héros, bande des
trois besoins, vision, quatre maillons, repères, gouvernance, feuille de route, impact, centre investisseurs).
Les faits publiés restent sourcés : cible de 80 % « pas un résultat mesuré », sources HSE datées, article du 22 octobre 2026."""
import re
import unittest
from apply_home_major_review import ROOT, home, progress, plain

# Lot 112 (10 novembre 2026, direction immersive choisie par le DG) : repères en bande de données sous le héros, premier projet phare.
# Lot 116 (10 novembre 2026, décision du DG : accueil allégé de moitié) : six blocs. Les trois besoins restent sur la page Clients ;
# la feuille de route et l'impact sont déplacés tels quels sur la page Projets, la vision sur la page Société ; une bande finale
# de quatre liens mène aux pages internes.
# Six blocs (12 novembre 2026, décision du DG) : l'accueil ne garde que vision, activités, impact, leadership, investisseurs et
# contact. Les repères, le projet phare, le tableau « Cadre · état publié » et la bande « Dernière publication » sont au Centre
# de Connaissances (/savoirs) ou sur les pages qu'il indexe.
NEW_ORDER=['id="vision"','id="chaine"','id="impact"','id="gouvernance-accueil"','id="investisseurs-accueil"','id="contact-accueil"']
GONE=['id="besoin-client"','id="reperes"','id="projet-phare"','id="aller-plus-loin"','id="feuille-de-route"','id="home-publications"','class="im-glass im-board"','class="hm-latest"']

class HomepageReview(unittest.TestCase):
 def check_common(self,s,main,en):
  self.assertEqual(len(re.findall(r'<h1\b',main)),1)
  ids=re.findall(r'\bid="([^"]+)"',s)
  self.assertEqual(len(ids),len(set(ids)))
  self.assertEqual(main.count('class="et-seg-img"'),4)
  self.assertIn('<header class="et-hero"',main)  # crochet de la dernière publication (scripts/next/critical.mjs)
  suffix='-en' if en else ''
  client='/boutique/en/clients' if en else '/boutique/clients'
  # lot 116 : les trois besoins se lisent sur la page Clients ; le héros y mène
  self.assertIn(f'href="{client}#besoin-client"',main)
  clients=(ROOT/f'clients{suffix}.html').read_text()
  for identity in ('besoin-client','industriels','flottes','operateurs'):
   self.assertIn(f'id="{identity}"',clients)
  for profile in ('b2b','ep'):
   self.assertIn(f'/contact{suffix}?profil={profile}',clients)
  for gone in GONE:
   self.assertNotIn(gone,main)
  self.assertNotIn('class="et-metrics"',main)
  self.assertIn('80%',main) if en else self.assertIn('80 %',main)
  self.assertIn('not a measured result' if en else 'pas un résultat mesuré',main)
  # six blocs : exactement six sections, dans l'ordre, et rien d'autre
  self.assertEqual(re.findall(r'<section id="([^"]+)"',main),[x[4:-1] for x in NEW_ORDER])
  # contact : quatre sorties, dont le besoin professionnel et le formulaire
  exits=re.search(r'<nav class="hm-exits".*?</nav>',main,re.S)[0]
  targets=re.findall(r'<a href="([^"]+)"',exits)
  self.assertEqual(targets,[f'{client}#besoin-client',f'/contact{suffix}#ctForm',f'/contact{suffix}?profil=invest#ctForm',f'/presse{suffix}'])
  # le reste est au Centre de Connaissances : la page existe dans les deux langues et l'accueil y mène
  hub=f'/savoirs{suffix}'
  self.assertIn(f'href="{hub}"',main)
  self.assertIn(f'href="{hub}#savoirs-investisseurs"',main)
  centre=(ROOT/f'savoirs{suffix}.html').read_text()
  for identity in ('comprendre','outils','documents','gouvernance','investisseurs','conformite','hse'):
   self.assertIn(f'<section id="savoirs-{identity}"',centre)

 def check_structure(self,en):
  s=(ROOT/('index-en.html' if en else 'index.html')).read_text()
  main=re.search(r'<main\b.*?</main>',s,re.S)[0]
  self.check_common(s,main,en)
  offsets=[main.index(x) for x in NEW_ORDER]
  self.assertEqual(offsets,sorted(offsets))
  # héros : titre du brief, libellés d'action du contrat CTA (qa/cta-vocabulary-contract.spec.js)
  h1='<h1 id="ph-h1">Chad’s energy. <em>Integrated.</em></h1>' if en else '<h1 id="ph-h1">L’énergie du Tchad. <em>Intégrée.</em></h1>'
  self.assertIn(h1,main)
  primary='Discuss a business requirement' if en else 'Présenter un besoin professionnel'
  client='/boutique/en/clients' if en else '/boutique/clients'
  self.assertIn(f'<a class="et-primary" href="{client}#besoin-client">{primary}</a>',main)
  self.assertIn('href="/projets-en#avancement">Projects and status' if en else 'href="/projets#avancement">Projets et avancement',main)
  # vision : trois piliers ; impact : cinq cartes, chacune avec son état de publication ; investisseurs : trois lignes de repères
  vision=re.search(r'<section id="vision".*?</section>',main,re.S)[0]
  self.assertEqual(vision.count('<li>'),3)
  home_impact=re.search(r'<section id="impact".*?</section>',main,re.S)[0]
  self.assertEqual(home_impact.count('<li>'),5)
  self.assertNotIn('class="hm-card"',main)  # les cartes .hm-card relèvent du contrat de design partagé (rayon 16 px) : l'accueil éditorial n'en porte pas
  self.assertEqual(home_impact.count('class="hm-flag'),5)
  investors=re.search(r'<section id="investisseurs-accueil".*?</section>',main,re.S)[0]
  self.assertEqual(investors.count('<li>'),3)
  self.assertIn('No subscription open to date' if en else 'Aucune souscription ouverte à ce jour',investors)
  # leadership : les deux mandats désignés, sans autre carte
  leadership=re.search(r'<section id="gouvernance-accueil".*?</section>',main,re.S)[0]
  self.assertEqual(leadership.count('<article class="mod-card'),2)
  for banned in ('à fournir','À FOURNIR','to be provided','[NOM','Artificial Lift'):
   self.assertNotIn(banned,main)
  # feuille de route (page Projets depuis le lot 116) : cinq étapes, une seule datée ; impact : cinq cartes avec leur état
  projects=(ROOT/('projets-en.html' if en else 'projets.html')).read_text()
  route=re.search(r'<section id="feuille-de-route".*?</section>',projects,re.S)[0]
  self.assertEqual(route.count('<div class="pp-cell">'),5)
  self.assertEqual(route.count('<time '),1)
  self.assertEqual(route.count('Timetable not published' if en else 'Calendrier non publié'),3)
  impact=re.search(r'<section id="impact-pays".*?</section>',projects,re.S)[0]
  self.assertEqual(impact.count('<div class="pp-cell">'),5)
  self.assertLess(projects.index('id="feuille-de-route"'),projects.index('id="avancement"'))
  # vision : la page Société garde le texte long ; l'accueil en reprend le titre et y renvoie
  self.assertIn('href="/societe-en#vision"' if en else 'href="/societe#vision"',main)
  company=(ROOT/('societe-en.html' if en else 'societe.html')).read_text()
  self.assertIn('<h4>A national ambition.</h4>' if en else '<h4>Une ambition nationale.</h4>',company)
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
    # lot 116 : l'atlas n'est plus lié depuis le corps de l'accueil ; le contrôle porte sur toute la page (navigation comprise)
    expected='/atlas-en' if en else '/atlas/'
    self.assertIn(f'href="{expected}"',s)
    if en:self.assertNotIn('href="/atlas/"',re.search(r'<main\b.*?</main>',s,re.S)[0])
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

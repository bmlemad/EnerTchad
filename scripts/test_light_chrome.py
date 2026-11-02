"""Lot 102 (choix du DG, 2 novembre 2026) : chrome allégé. Contrôle après « npm run build » :
  - chaque page exportée qui porte la barre principale ou une sous-navigation de pôle met en ligne la feuille
    assets/chrome/allege-2026.css (<style data-et-allege>) juste après la feuille de verre (couche et-allege
    déclarée la deuxième), une seule fois ;
  - la feuille porte les trois règles du lot : fusion à partir de 1 536 px, barre utilitaire masquée au
    défilement en dessous, sous-navigation non collante ;
  - les scripts publiés portent leur part : nav_a.js (déplacement des liens fusionnés), audience-consent.js
    (bande fine, barre basse mobile visible, plus de second paragraphe), coherence-20261013.js (commande
    Mouvement au pied de page à toutes les largeurs — mécanisme de pause conservé, WCAG 2.2.2).
Usage : python3 scripts/test_light_chrome.py"""
import pathlib
import re
import sys

OUT = pathlib.Path('out')
SURFACE = re.compile(r'<nav\b[^>]*\bid="nav"|<nav\b[^>]*\bpp-sub\b')
RULES = ['@layer et-allege;', '@media(min-width:1536px){', '#nav .nx-util{display:none!important}', '#nav .nx-cta .nx-fused{display:inline-flex!important',
         '@media(max-width:1535px){', '#nav.nx.scrolled .nx-util{display:none!important}', 'nav.pp-sub{position:static!important;top:auto!important}']
failures = []
pages = 0
for path in sorted(OUT.rglob('*.html')):
    text = path.read_text(encoding='utf-8', errors='replace')
    if not SURFACE.search(text):
        continue
    pages += 1
    n = text.count('<style data-et-allege>')
    if n != 1:
        failures.append(f'{path} : {n} feuille(s) allégée(s) au lieu de 1')
        continue
    verre, allege = text.find('<style data-et-verre>'), text.find('<style data-et-allege>')
    if verre < 0 or allege < verre or text.find('</style>', verre) + len('</style>') != allege:
        failures.append(f'{path} : la feuille allégée ne suit pas immédiatement la feuille de verre')
    sheet = text[allege:text.find('</style>', allege)]
    for rule in RULES:
        if rule not in sheet:
            failures.append(f'{path} : règle absente « {rule} »')
            break

def script(name, musts, bans=()):
    src = (OUT / 'assets/chrome' / name).read_text(encoding='utf-8')
    for m in musts:
        if m not in src:
            failures.append(f'{name} : « {m} » absent')
    for b in bans:
        if b in src:
            failures.append(f'{name} : « {b} » encore présent')

script('nav_a.js', ["matchMedia('(min-width:1536px)')", "classList.add('nx-fused')"])
script('audience-consent.js', ['@media(max-width:768px){#et-consent{', 'bottom:var(--et-nez-h,68px)', 'display:flex;align-items:center;flex-wrap:wrap'],
       bans=['Tag Manager se charge', 'Tag Manager loads only', 'min-width:601px', '#nezBar{display:none!important}'])
script('coherence-20261013.js', ['media={matches:true'])

print(f'{pages} page(s) avec barre ou sous-navigation contrôlée(s), {len(failures)} défaut(s)')
for f in failures[:40]:
    print(' ', f)
sys.exit(1 if failures else 0)

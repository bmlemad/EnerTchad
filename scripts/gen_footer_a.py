# -*- coding: utf-8 -*-
"""Aligne les colonnes de liens du pied de page sur l'IA « Direction A »
(la grille « Nos pôles » est conservée). Usage : python3 scripts/gen_footer_a.py"""
import re, glob

FR_OLD = re.compile(r'<div class="foot-col"><h3>Clients &amp; marchés</h3>.*?Calculateur du baril</a></div>', re.S)
EN_OLD = re.compile(r'<div class="foot-col"><h3>Clients &amp; markets</h3>.*?Barrel calculator</a></div>', re.S)

FR_NEW = (
    '<div class="foot-col"><h3>Clients &amp; innovation</h3>'
    '<a href="/clients">Clients &amp; solutions</a>'
    '<a href="/boutique">Boutique en ligne</a>'
    '<a href="/innovation">Innovation</a>'
    '<a href="/enerconseils/atlas#donnees-secteur">Atlas du secteur</a>'
    '<a href="/enertech/outils#apps">Outils interactifs</a></div>'
    '<div class="foot-col"><h3>Groupe</h3>'
    '<a href="/societe">La Société</a>'
    '<a href="/cibles-2030">Cibles 2030</a>'
    '<a href="/carnets">Médias &amp; carnets</a>'
    '<a href="/carrieres">Carrières</a>'
    '<a href="/contact">Contact</a></div>'
    '<div class="foot-col"><h3>Durabilité &amp; investisseurs</h3>'
    '<a href="/engagements">Engagements</a>'
    '<a href="/communautes">Communautés</a>'
    '<a href="/investisseurs">Espace investisseurs</a>'
    '<a href="/projets">Feuille de route</a>'
    '<a href="/Calculateur_Baril_Additionnel">Calculateur du baril</a>'
    '<a href="/Configurateur_Service_Integre" target="_blank" rel="noopener">Configurateur de service</a></div>'
)
EN_NEW = (
    '<div class="foot-col"><h3>Clients &amp; innovation</h3>'
    '<a href="/clients-en">Clients &amp; solutions</a>'
    '<a href="/boutique">Online store</a>'
    '<a href="/innovation">Innovation</a>'
    '<a href="/enerconseils/atlas#donnees-secteur">Sector atlas</a>'
    '<a href="/enertech/outils#apps">Interactive tools</a></div>'
    '<div class="foot-col"><h3>Company</h3>'
    '<a href="/societe-en">The Company</a>'
    '<a href="/cibles-2030">2030 targets</a>'
    '<a href="/carnets-en">Media &amp; journal</a>'
    '<a href="/carrieres">Careers</a>'
    '<a href="/contact-en">Contact</a></div>'
    '<div class="foot-col"><h3>Sustainability &amp; investors</h3>'
    '<a href="/engagements-en">Commitments</a>'
    '<a href="/communautes">Communities</a>'
    '<a href="/investisseurs-en">Investor relations</a>'
    '<a href="/projets-en">Roadmap</a>'
    '<a href="/Calculateur_Baril_Additionnel">Barrel calculator</a>'
    '<a href="/Configurateur_Service_Integre" target="_blank" rel="noopener">Service configurator</a></div>'
)

fr = en = 0
for p in sorted(glob.glob('*.html')) + sorted(glob.glob('*/*.html')):
    h = open(p, encoding='utf-8').read()
    h2, n1 = FR_OLD.subn(FR_NEW, h)
    h2, n2 = EN_OLD.subn(EN_NEW, h2)
    if n1 or n2:
        open(p, 'w', encoding='utf-8').write(h2)
        fr += n1; en += n2
print(f'{fr} pieds de page FR et {en} EN alignés.')

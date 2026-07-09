# -*- coding: utf-8 -*-
"""Migration navigation « Direction A » — remplace le bloc <nav id="nav"> de
chaque page (FR/EN) par la nouvelle structure : barre utilitaire + 5 rubriques.
Usage : python3 scripts/gen_nav_a.py   (à la racine du dépôt)"""
import re, glob, os, sys

BUILD = "202607092100"
CHEV = ('<svg aria-hidden="true" focusable="false" width="11" height="11" viewBox="0 0 12 12" '
        'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '
        'stroke-linejoin="round"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>')

def link(href, strong, em):
    return f'<a href="{href}"><strong>{strong}</strong><em>{em}</em></a>'

def feat(href, tag, strong, em, arr, grad=None):
    style = f' style="background-image:linear-gradient(160deg,{grad},rgba(6,11,20,.72))"' if grad else ''
    return (f'<a class="nx-feat" href="{href}"{style}><span class="tag">{tag}</span>'
            f'<strong>{strong}</strong><em>{em}</em><span class="arr">{arr}</span></a>')

def item(n, label, act, col1, col2, ft):
    cls = ' is-active' if act else ''
    cur = ' aria-current="page"' if act else ''
    return (f'<div class="nav-item nx-item"><button class="nav-trigger{cls}"{cur} aria-expanded="false" '
            f'aria-haspopup="true" aria-controls="nxm-{n}">{label} {CHEV}</button>'
            f'<div class="nx-mega" id="nxm-{n}" role="region" aria-label="{label}">'
            f'<div class="nx-col"><h4>{col1[0]}</h4>{"".join(col1[1])}</div>'
            f'<div class="nx-col"><h4>{col2[0]}</h4>{"".join(col2[1])}</div>{ft}</div></div>')

# ---------------- FR ----------------
def nav_fr(brand, lang, act):
    a = lambda k: act == k
    items = [
        item(1, 'Groupe', a(1),
             ('Identité', [link('/societe', 'La Société', 'Gouvernance · repères'),
                           link('/societe#vision', 'Mission &amp; Vision', 'Valeur ancrée au Tchad'),
                           link('/societe#voie', 'La Voie EnerTchad', 'Le cercle vertueux')]),
             ('Structure', [link('/societe#gouvernance', 'Gouvernance', 'Une SA OHADA'),
                            link('/#poles', 'Nos 7 pôles', "Nos domaines d'activité"),
                            link('/cibles-2030', 'Cibles 2030', 'Tableau de bord · KPIs')]),
             feat('/societe#voie', 'À la une', 'La Voie EnerTchad',
                  'De la roche-mère à la pompe — une chaîne intégrée bâtie au pays.', 'Découvrir →')),
        item(2, 'Nos activités', a(2),
             ('Amont', [link('/amont/', 'Exploration-Production', 'Le cœur E&amp;P'),
                        link('/amont/services-ep#services-ep', 'Services parapétroliers', 'Du sismique à la pompe'),
                        link('/amont/eor#eor', 'Récupération assistée', 'EOR à intrants locaux')]),
             ('Intermédiaire &amp; Aval', [link('/intermediaire/', 'Transport &amp; stockage', 'Corridor · dépôts · camions'),
                                           link('/aval/raffinage', 'Raffinage &amp; mini-raffinerie', 'Modulaire · 500–2 000 b/j'),
                                           link('/aval/reseau#reseau', 'Distribution &amp; stations', 'Réseau « Le Relais »')]),
             feat('/aval/produits#produits', 'Transversal', 'Produits · Pétrochimie · GreenTech',
                  'Carburants, GPL, lubrifiants, bitume &amp; énergie bas-carbone.', 'Voir la chaîne →',
                  'rgba(27,140,61,.22)')),
        item(3, 'Innovation', a(3),
             ('Technologies', [link('/aval/raffinage', 'Mini-raffinerie 2.0', 'Modulaire · pilotée par IA'),
                               link('/enertech/socle#robotique', 'Robotique', 'Drones, racleurs, crawlers'),
                               link('/enertech/socle#donnees-ia', 'Données, IA &amp; jumeaux', 'Capteurs · modèles · décision')]),
             ('Socle &amp; outils', [link('/enertech/socle#cybersecurite', 'Cybersécurité OT/IT', 'Sécurité par conception'),
                                     link('/enerconseils/atlas#atlas', 'Atlas du secteur', 'Géologie · réserves · cadastre'),
                                     link('/enertech/outils#apps', 'Outils interactifs', 'Configurateur · simulateurs')]),
             feat('/enertech/innovations#innovations', 'Signature', 'Six signatures',
                  'Une pétrolière née autrement, numérique et frugale.', 'Explorer →', 'rgba(46,134,222,.24)')),
        item(4, 'Durabilité', a(4),
             ('Cadre', [link('/engagements', 'Engagements', 'Notre cadre de durabilité'),
                        link('/greentech/impact#impact', 'ESG &amp; ODD', 'La rente qui reste au pays'),
                        link('/greentech/hseq#hseq', 'HSE-Q &amp; conformité', 'Zéro accident')]),
             ('Territoires &amp; planète', [link('/communautes', 'Communautés', 'Contenu local · désenclavement'),
                                            link('/greentech/transition#transition', 'Eau &amp; transition', 'Cycle fermé · décarbonation'),
                                            link('/greentech/patrimoine#patrimoine', 'Faune &amp; patrimoine', 'Biodiversité · sites UNESCO')]),
             feat('/greentech/', 'Priorité', 'Contenu local',
                  "Former avant d'extraire — priorité aux Tchadiens.", 'Nos engagements →', 'rgba(27,140,61,.26)')),
        item(5, 'Investisseurs', a(5),
             ('La thèse', [link('/investisseurs#modele', "Modèle d'affaires", 'Chaque étage finance le suivant'),
                           link('/investisseurs#these', "Thèse d'investissement", 'Pourquoi le Tchad, maintenant'),
                           link('/enertalents/partenariats#partenaires', 'Partenariats', 'GCIC · OT · État · académique')]),
             ('Preuves &amp; outils', [link('/projets', 'Feuille de route', '8 chantiers phares datés'),
                                       link('/Calculateur_Baril_Additionnel', 'Calculateur du baril', 'Le baril additionnel, chiffré'),
                                       link('/investisseurs#publications', 'Dossier &amp; publications', 'Mémorandum · notes · PPTX')]),
             feat('/investisseurs#souscrire', "Passer à l'acte", 'Souscrire au capital',
                  '10 M → 20 Md FCFA : rejoindre le tour de table.', 'Investir →', 'rgba(232,195,106,.2)')),
    ]
    return f'''<nav class="nav nx" id="nav" aria-label="Navigation principale">
  <div class="nx-util"><div class="nx-util-in">
    <a href="/clients">Espace clients</a>
    <a href="/carnets">Médias</a>
    <a href="/carrieres">Carrières</a>
    <a href="/contact">Contact</a>
    <a href="{lang}" class="nx-lang" aria-label="English version" title="English">FR&nbsp;·&nbsp;<b>EN</b></a>
    <a href="/investisseurs#souscrire" class="nx-invest">Investir</a>
  </div></div>
  <div class="nav-in nx-bar">
    <a href="{brand}" class="brand" aria-label="EnerTchad — Accueil" title="Accueil">
      <span class="brand-mk"><span class="logo-img" role="img" aria-label="EnerTchad"></span></span>
      <span class="brand-tx">Ener<span class="s">Tchad</span></span>
    </a>
    <div class="nav-links" id="navLinks">
      {chr(10).join(items)}
      <div class="nx-util-m">
        <a href="/clients">Espace clients</a><a href="/carnets">Médias</a><a href="/carrieres">Carrières</a>
        <a href="/contact">Contact</a><a href="{lang}">English</a>
        <a href="/investisseurs#souscrire" class="cta">Investir</a>
      </div>
    </div>
    <div class="nav-cta nx-cta">
      <button class="nav-search" id="navSearch" aria-label="Rechercher (Ctrl+K)" title="Rechercher (Ctrl+K)" onclick="window.openCmdk&amp;&amp;window.openCmdk()"><svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10.5" cy="10.5" r="6.6" stroke-width="1.7"/><path d="M19.8 19.8l-4.6-4.6" stroke-width="1.7" stroke-linecap="round"/></svg></button>
      <button class="nav-tog" id="navTog" aria-label="Menu"><span class="bz" aria-hidden="true"></span><span class="bz" aria-hidden="true"></span><span class="bz" aria-hidden="true"></span></button>
    </div>
  </div>
</nav>'''

# ---------------- EN ----------------
def nav_en(brand, lang, act):
    a = lambda k: act == k
    items = [
        item(1, 'Company', a(1),
             ('Identity', [link('/societe-en', 'The Company', 'Governance · key facts'),
                           link('/societe-en', 'Mission &amp; Vision', 'Value rooted in Chad'),
                           link('/societe-en', 'The EnerTchad Way', 'The virtuous circle')]),
             ('Structure', [link('/societe-en', 'Governance', 'An OHADA company'),
                            link('/index-en', 'Our 7 poles', 'Our business areas'),
                            link('/cibles-2030', '2030 Targets', 'Dashboard · KPIs')]),
             feat('/societe-en', 'Featured', 'The EnerTchad Way',
                  'From source rock to the pump — an integrated chain built in Chad.', 'Discover →')),
        item(2, 'Our business', a(2),
             ('Upstream', [link('/pole-amont-en', 'Exploration-Production', 'The E&amp;P core'),
                           link('/amont/services-ep#services-ep', 'Oilfield services', 'From seismic to the pump'),
                           link('/amont/eor#eor', 'Enhanced oil recovery', 'EOR with local inputs')]),
             ('Midstream &amp; Downstream', [link('/pole-intermediaire-en', 'Transport &amp; storage', 'Corridor · depots · trucking'),
                                             link('/aval/raffinage', 'Refining &amp; mini-refinery', 'Modular · 500–2,000 b/d'),
                                             link('/aval/reseau#reseau', 'Distribution &amp; stations', '“Le Relais” network')]),
             feat('/aval/produits#produits', 'Cross-cutting', 'Products · Petrochemicals · GreenTech',
                  'Fuels, LPG, lubricants, bitumen &amp; low-carbon energy.', 'See the chain →', 'rgba(27,140,61,.22)')),
        item(3, 'Innovation', a(3),
             ('Technologies', [link('/aval/raffinage', 'Mini-refinery 2.0', 'Modular · AI-driven'),
                               link('/enertech/socle#robotique', 'Robotics', 'Drones, pigs, crawlers'),
                               link('/enertech/socle#donnees-ia', 'Data, AI &amp; twins', 'Sensors · models · decisions')]),
             ('Foundation &amp; tools', [link('/enertech/socle#cybersecurite', 'OT/IT cybersecurity', 'Secure by design'),
                                         link('/enerconseils/atlas#atlas', 'Sector atlas', 'Geology · reserves · cadastre'),
                                         link('/enertech/outils#apps', 'Interactive tools', 'Configurator · simulators')]),
             feat('/enertech/innovations#innovations', 'Signature', 'Six signatures',
                  'An oil company born differently — digital and frugal.', 'Explore →', 'rgba(46,134,222,.24)')),
        item(4, 'Sustainability', a(4),
             ('Framework', [link('/engagements-en', 'Commitments', 'Our sustainability framework'),
                            link('/greentech/impact#impact', 'ESG &amp; SDGs', 'Rent that stays in Chad'),
                            link('/greentech/hseq#hseq', 'HSE-Q &amp; compliance', 'Zero accident')]),
             ('Land &amp; planet', [link('/communautes', 'Communities', 'Local content · opening up regions'),
                                    link('/greentech/transition#transition', 'Water &amp; transition', 'Closed loop · decarbonisation'),
                                    link('/greentech/patrimoine#patrimoine', 'Wildlife &amp; heritage', 'Biodiversity · UNESCO sites')]),
             feat('/pole-greentech-en', 'Priority', 'Local content',
                  'Train before extracting — Chadians first.', 'Our commitments →', 'rgba(27,140,61,.26)')),
        item(5, 'Investors', a(5),
             ('The thesis', [link('/investisseurs-en', 'Business model', 'Each tier funds the next'),
                             link('/investisseurs-en', 'Investment thesis', 'Why Chad, why now'),
                             link('/enertalents/partenariats#partenaires', 'Partnerships', 'GCIC · OT · State · academia')]),
             ('Proof &amp; tools', [link('/projets-en', 'Roadmap', '8 dated flagship projects'),
                                    link('/Calculateur_Baril_Additionnel', 'Barrel calculator', 'The additional barrel, quantified'),
                                    link('/investisseurs-en', 'Deck &amp; publications', 'Memorandum · notes · PPTX')]),
             feat('/investisseurs-en', 'Take action', 'Subscribe to the capital',
                  'FCFA 10M → 20Bn: join the round.', 'Invest →', 'rgba(232,195,106,.2)')),
    ]
    return f'''<nav class="nav nx" id="nav" aria-label="Main navigation">
  <div class="nx-util"><div class="nx-util-in">
    <a href="/clients-en">Client area</a>
    <a href="/carnets-en">Media</a>
    <a href="/carrieres">Careers</a>
    <a href="/contact-en">Contact</a>
    <a href="{lang}" class="nx-lang" aria-label="Version française" title="Français"><b>FR</b>&nbsp;·&nbsp;EN</a>
    <a href="/investisseurs-en" class="nx-invest">Invest</a>
  </div></div>
  <div class="nav-in nx-bar">
    <a href="{brand}" class="brand" aria-label="EnerTchad — Home" title="Home">
      <span class="brand-mk"><span class="logo-img" role="img" aria-label="EnerTchad"></span></span>
      <span class="brand-tx">Ener<span class="s">Tchad</span></span>
    </a>
    <div class="nav-links" id="navLinks">
      {chr(10).join(items)}
      <div class="nx-util-m">
        <a href="/clients-en">Client area</a><a href="/carnets-en">Media</a><a href="/carrieres">Careers</a>
        <a href="/contact-en">Contact</a><a href="{lang}">Français</a>
        <a href="/investisseurs-en" class="cta">Invest</a>
      </div>
    </div>
    <div class="nav-cta nx-cta">
      <button class="nav-search" id="navSearch" aria-label="Search (Ctrl+K)" title="Search (Ctrl+K)" onclick="window.openCmdk&amp;&amp;window.openCmdk()"><svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10.5" cy="10.5" r="6.6" stroke-width="1.7"/><path d="M19.8 19.8l-4.6-4.6" stroke-width="1.7" stroke-linecap="round"/></svg></button>
      <button class="nav-tog" id="navTog" aria-label="Menu"><span class="bz" aria-hidden="true"></span><span class="bz" aria-hidden="true"></span><span class="bz" aria-hidden="true"></span></button>
    </div>
  </div>
</nav>'''

# ------------- rubrique active par page -------------
FR_ACT = [
    (1, ('societe.html', 'cibles-2030.html', 'charte.html')),
    (2, ('amont/', 'intermediaire/', 'aval/', 'petrochimie/', 'activites.html')),
    (3, ('enertech/', 'enerconseils/', 'innovation.html')),
    (4, ('greentech/', 'engagements.html', 'communautes.html', 'enertalents/')),
    (5, ('investisseurs.html', 'projets.html')),
]
EN_ACT = [
    (1, ('societe-en.html',)),
    (2, ('pole-amont-en.html', 'pole-intermediaire-en.html', 'pole-aval-en.html',
         'pole-enerchimie-en.html', 'activites-en.html')),
    (3, ('pole-enertech-en.html', 'pole-enerconseils-en.html')),
    (4, ('pole-greentech-en.html', 'engagements-en.html', 'pole-enertalents-en.html')),
    (5, ('investisseurs-en.html', 'projets-en.html')),
]

def active_for(path, table):
    for n, prefixes in table:
        for p in prefixes:
            if path == p or (p.endswith('/') and path.startswith(p)):
                return n
    return 0

NAV_RE = re.compile(r'(?:<link[^>]*nav_a\.css[^>]*>\s*)?<nav class="nav(?: nx)?" id="nav"[^>]*>.*?</nav>(?:\s*<script src="/assets/chrome/nav_a\.js[^>]*></script>)?', re.S)

def main():
    pages = sorted(glob.glob('*.html')) + sorted(glob.glob('*/*.html'))
    done = skipped = 0
    for p in pages:
        h = open(p, encoding='utf-8').read()
        if 'id="navLinks"' not in h:
            skipped += 1
            continue
        m = NAV_RE.search(h)
        if not m:
            print(f'!! bloc nav introuvable : {p}'); continue
        en = bool(re.search(r'<html[^>]*lang="en"', h))
        # lien de langue : réutilise la cible existante de la page
        ml = re.search(r'<a href="([^"]+)" class="n[xa][-v]?-?lang"', h) or re.search(r'<a href="([^"]+)" class="nav-lang"', h)
        lang = ml.group(1) if ml else ('/index' if en else '/index-en')
        path = p.replace('\\', '/')
        brand = '#top' if path in ('index.html', 'index-en.html') else ('/index-en' if en else '/')
        act = active_for(path, EN_ACT if en else FR_ACT)
        nav = nav_en(brand, lang, act) if en else nav_fr(brand, lang, act)
        block = (f'<link rel="stylesheet" href="/assets/chrome/nav_a.css?b={BUILD}">\n'
                 f'{nav}\n<script src="/assets/chrome/nav_a.js?b={BUILD}" defer></script>')
        h2 = h[:m.start()] + block + h[m.end():]
        open(p, 'w', encoding='utf-8').write(h2)
        done += 1
        print(f'ok  {"EN" if en else "FR"} act={act or "-"} lang={lang}  {p}')
    print(f'\n{done} pages migrées, {skipped} sans nav standard.')

if __name__ == '__main__':
    main()

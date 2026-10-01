# -*- coding: utf-8 -*-
"""Refonte premium, etape 2 : accueils FR et EN.

Reconstruit le corps de index.html et index-en.html dans la mise en page premium
(heros photographique, manifeste, la chaine en quatre chapitres, capacites,
chapitre investisseurs, actualites, durabilite, acces directs) a partir des
contenus deja publies sur le site. Conserve l en-tete de la page (meta, donnees
structurees, hreflang), la navigation, le pied de page et les scripts communs
(menu mobile, recherche, theme, avis cookies, newsletter, service worker).
Retire les feuilles et scripts propres a l ancien accueil.

Usage : python3 scripts/gen_premium_home.py   (apres gen_premium_chrome.py)
"""
import re

BUILD = '202610011600'
DROP_CSS = ['x_9e73ac04de58', 'x_efffae1a94e5', 'x_ccf230b9a3a4', 'x_dd3f8c61af27', 'x_8fabe2089c24',
            's_0c793eb7ae', 'x_a5f948c9bac5', 'x_fd494c68ff2b', 'modern-inner-2026', 'x_77d650c4a7a2',
            'home-inline-2026', 'home-inline-en-2026', 'u_057e77b5b4cf', 'plight_extrait', 'fond647',
            'modern-ui-2026', 'home-corporate-2026']
# Scripts et blocs propres a l ancien accueil, retires apres le pied de page
DROP_TAIL = ['hx-slide', 'hxShuffle', 'prem-home-js', 'id="subbar-fix"', 'id="flip-js"', 'id="flip2-js"', 'tilehub-js',
             'id="pl-close"', 'id="scrollguard"', 'id="kpi-count"', 'id="tchad-heure-js"', 'id="fil-js"', 'id="et640-js"',
             's_bded434d4e', 's_321e9a1a41', 's_1d29ed9395', 'id="cue-tact-js"']

T = {
 'fr': dict(
  eyebrow='N’Djamena · 12° 08′ N · 15° 03′ E',
  h1='De la roche-mère à la pompe.',
  sub='EnerTchad bâtit la chaîne pétrolière complète du Tchad, pour que la valeur du brut se raffine, se distribue et demeure au pays.',
  cta1=('Parcourir la chaîne', '#chaine'), cta2=('Espace investisseurs', '/investisseurs'),
  figs=[('144 → 250 kb/j', 'Production nationale, 2024 → objectif 2030'), ('80 %', 'De valeur tchadienne visée'),
        ('100 M → 10 Md', 'FCFA, capital levé par paliers')],
  note=('Société en constitution : des objectifs datés, pas des actifs en exploitation.', 'Statut, dates et limites', '/avertissements'),
  m_k='Notre mission',
  m_big='« Nos ressources naturelles doivent servir de levier de croissance et de développement. » Que la valeur du brut <em>demeure au pays</em>.',
  m_lead='Améliorer l’accès à une énergie compétitive, renforcer la sécurité d’approvisionnement et former la relève avant d’accélérer : c’est la Voie EnerTchad.',
  m_link=('Qui sommes-nous', '/societe'), m_cap='Le lac Tchad, vu de l’orbite.', m_alt='Le lac Tchad photographié depuis l’orbite',
  c_k='La chaîne intégrée', c_h='Quatre maillons, une même molécule.',
  c_lead='Dans l’ordre du baril : l’extraire, l’acheminer, le raffiner, le transformer. Chaque étage finance le suivant.',
  chapters=[
   ('I', 'Exploration & Production', 'Extraire davantage de chaque gisement.',
    'Récupération assistée sur champs matures, relance des blocs marginaux et force parapétrolière intégrée : neuf domaines de compétence, l’Artificial Lift en expertise phare.',
    '+8–17 %', 'd’huile en place additionnelle visée', 'chantier-ferraillage', '/amont/', 'Équipe sur un chantier'),
   ('II', 'Transport & stockage', 'La valeur ne compte que si elle circule.',
    'Corridor d’export, réserve stratégique distribuée et intégrité des ouvrages : le maillon qui relie le puits au pays, du comptage au dépôt.',
    '1 070 km', 'corridor Doba–Kribi', 'pipeline', '/intermediaire/', 'Pipeline traversant une vallée'),
   ('III', 'Raffinage & distribution', 'Que la valeur du brut demeure au pays.',
    'Mini-raffinerie modulaire, réseau de stations et distribution jusqu’au dernier kilomètre : carburants, GPL et dérivés, aux prix ARSAT.',
    '2 000 b/j', 'par train de raffinage', 'raffinerie-jour', '/aval/', 'Colonnes de raffinerie'),
   ('IV', 'Pétrochimie', 'Transformer la molécule au Tchad.',
    'Méthanol, urée et bitume : un complexe pensé pour l’agriculture, le BTP et l’industrie du pays.',
    '6 unités', 'en 3 phases', 'unite-petrochimie', '/petrochimie/', 'Unité pétrochimique'),
  ], discover='Découvrir',
  k_k='Capacités intégrées', k_h='Ce qui fait tourner la chaîne.',
  caps=[('GreenTech', 'Durabilité, HSE-Q, transition énergétique.', '/greentech/'),
        ('TchadiTech', 'Socle numérique, données, R&D.', '/tchaditech/'),
        ('Tchaditude', 'Capital humain, académie, relève.', '/tchaditude/'),
        ('EnerConseils', 'Atlas du secteur, conseil, audits.', '/enerconseils/')],
  i_k='Investisseurs', i_h='Un capital levé par paliers, des jalons publiés.',
  i_lead='Un marché à reconquérir, une intégration verticale de bout en bout et une trajectoire de capital séquencée, de 100 M à 10 Md FCFA, sous une gouvernance OHADA auditable.',
  i_cta1=('Souscrire au capital', '/investisseurs#souscrire'), i_cta2=('La thèse d’investissement', '/investisseurs#these'),
  a_k='Prochains rendez-vous', a_note='Dates indicatives d’une société en constitution ; chaque confirmation est publiée.',
  a_all=('L’agenda complet', '/investisseurs#agenda'),
  agenda=[('2026-11-17', '17 nov. 2026', 'Data room & rencontres', 'Ouverte aux investisseurs qualifiés, rencontres bilatérales avec GCIC.'),
          ('2027-03-30', '30 mars 2027', 'Point d’étape annuel', 'Revue des jalons franchis et actualisation des cibles.')],
  n_k='Actualités', n_h='Le fil daté.', n_all=('Toutes les actualités', '/carnets'),
  news=[('2026-09-08', '8 septembre 2026', 'La refonte pôles est en ligne : la home en chapitres, les hubs devenus portails', 'Communiqué', '/communiques'),
        ('2026-08-23', '23 août 2026', 'Première du genre : une chaîne intégrée pensée au Tchad', 'Carnet', '/journal-premiere-du-genre'),
        ('2026-08-23', '23 août 2026', 'Dans la salle de contrôle : l’interview de l’opérateur de conduite', 'Interview', '/journal-interview-controle'),
        ('2026-08-22', '22 août 2026', 'Dans la cabine de comptage : l’interview du jaugeur-mesureur', 'Interview', '/journal-interview-comptage')],
  t_k='Centre de confiance', t_h='Rapports, données, gouvernance.',
  t_lead='Un point d’entrée unique vers les informations vérifiables et les ressources utiles à chaque partie prenante.',
  t_all=('Tous les documents', '/publications'), t_note=('Statut documentaire :', '/avertissements', 'les avertissements et limites des données'),
  trust=[('Reporting', 'Investisseurs & rapports', 'Fiche investisseur, dossier, point d’étape, data book et agenda.', 'Ouvrir le centre documentaire →', '/publications#pub-inv', False),
         ('Données', 'Data book ouvert', 'Le classeur publié par EnerTchad, directement téléchargeable.', 'Télécharger le classeur →', '/Data_Book_EnerTchad.xlsx', True),
         ('Gouvernance', 'Éthique & transparence', 'Conformité, anti-corruption, canal d’alerte et paiements aux États.', 'Voir le cadre →', '/ethique', False),
         ('Actualités', 'Newsroom & archives', 'Communiqués officiels et publications datées.', 'Voir les publications →', '/communiques', False),
         ('Portefeuille', 'Projets & jalons', 'Feuille de route, chantiers et étapes publiées.', 'Explorer les projets →', '/projets', False)],
  d_k='Durabilité', d_h='Des règles posées avant le premier baril.',
  d_lead='Engagements HSE-Q, contenu local et transparence des revenus, mesurés et datés.',
  d_links=[('Nos engagements', '/engagements'), ('Cibles 2030', '/cibles-2030'), ('Paiements aux États', '/paiements-etats')],
  d_alt='Panneaux solaires sous un ciel nuageux',
  q_label='Accès directs',
  quick=[('Investisseurs', 'Thèse, feuille de route, documents et agenda.', '/investisseurs'),
         ('Carrières', 'Familles de métiers et académie Tchaditude.', '/carrieres'),
         ('Clients', 'Carburants, services pétroliers, solutions intégrées.', '/clients'),
         ('Fournisseurs', 'Référencement et appels d’offres.', '/achats')],
  past='Les prochains rendez-vous seront publiés sur l’agenda investisseur.'),
 'en': dict(
  eyebrow='N’Djamena · 12° 08′ N · 15° 03′ E',
  h1='From source rock to the pump.',
  sub='EnerTchad is building Chad’s complete oil chain, so that the value of crude is refined, distributed and kept in the country.',
  cta1=('Explore the chain', '#chaine'), cta2=('Investor relations', '/investisseurs-en'),
  figs=[('144 → 250 kb/d', 'National output, 2024 → 2030 objective'), ('80%', 'Chadian value targeted'),
        ('100M → 10bn', 'FCFA, capital raised in tiers')],
  note=('A company under formation: dated objectives, not producing assets.', 'Status, dates and limits', '/avertissements-en'),
  m_k='Our mission',
  m_big='“Our natural resources must serve as a lever of growth and development.” Keep the value of crude <em>in the country</em>.',
  m_lead='Competitive energy for Chadians, stronger security of supply, and training the next generation before scaling up: that is the EnerTchad Way.',
  m_link=('About us', '/societe-en'), m_cap='Lake Chad, seen from orbit.', m_alt='Lake Chad photographed from orbit',
  c_k='The integrated chain', c_h='Four links, one molecule.',
  c_lead='In the order of the barrel: extract it, move it, refine it, transform it. Each stage funds the next.',
  chapters=[
   ('I', 'Exploration & Production', 'Extract more from every field.',
    'Enhanced recovery on mature fields, marginal-block revival and an integrated oilfield-services force: nine competence domains, with Artificial Lift as the flagship expertise.',
    '+8–17%', 'additional oil in place targeted', 'chantier-ferraillage', '/pole-amont-en', 'Crew on a work site'),
   ('II', 'Transport & storage', 'Value only counts if it moves.',
    'Export corridor, distributed strategic reserve and asset integrity: the link that ties the well to the country, from custody metering to the depot.',
    '1,070 km', 'Doba–Kribi corridor', 'pipeline', '/pole-intermediaire-en', 'Pipeline crossing a valley'),
   ('III', 'Refining & distribution', 'Keep the value of crude in the country.',
    'Modular mini-refinery, a station network and distribution to the last mile: fuels, LPG and derivatives, at ARSAT prices.',
    '2,000 b/d', 'per refining train', 'raffinerie-jour', '/pole-aval-en', 'Refinery columns'),
   ('IV', 'Petrochemicals', 'Transform the molecule in Chad.',
    'Methanol, urea and bitumen: a complex designed for the country’s agriculture, construction and industry.',
    '6 units', 'in 3 phases', 'unite-petrochimie', '/pole-enerchimie-en', 'Petrochemical unit'),
  ], discover='Discover',
  k_k='Integrated capabilities', k_h='What keeps the chain running.',
  caps=[('GreenTech', 'Sustainability, HSE-Q, energy transition.', '/pole-greentech-en'),
        ('TchadiTech', 'Digital backbone, data, R&D.', '/pole-tchaditech-en'),
        ('Tchaditude', 'Human capital, academy, next generation.', '/pole-tchaditude-en'),
        ('EnerConseils', 'Sector atlas, advisory, audits.', '/pole-enerconseils-en')],
  i_k='Investors', i_h='Capital raised in tiers, milestones published.',
  i_lead='A market to win back, end-to-end vertical integration and a sequenced capital trajectory, from FCFA 100M to 10bn, under auditable OHADA governance.',
  i_cta1=('Subscribe to the capital', '/investisseurs-en#souscrire'), i_cta2=('The investment case', '/investisseurs-en#these'),
  a_k='Upcoming events', a_note='Indicative dates for a company under formation; every confirmation is published.',
  a_all=('Full calendar', '/investisseurs-en#agenda'),
  agenda=[('2026-11-17', '17 Nov 2026', 'Data room & meetings', 'Open to qualified investors, bilateral meetings with GCIC.'),
          ('2027-03-30', '30 Mar 2027', 'Annual progress review', 'A review of milestones passed and updated targets.')],
  n_k='News', n_h='The dated thread.', n_all=('All news', '/carnets-en'),
  news=[('2026-09-08', '8 September 2026', 'The pole overhaul is live: the home in chapters, the hubs turned portals', 'Press release', '/communiques-en'),
        ('2026-08-23', '23 August 2026', 'First of its kind: EnerTchad’s integrated chain, built in Chad', 'Journal', '/journal-premiere-du-genre-en'),
        ('2026-08-23', '23 August 2026', 'Inside the control room: the operations controller’s interview', 'Interview', '/journal-interview-controle-en'),
        ('2026-08-22', '22 August 2026', 'Inside the metering cabin: the gauger’s interview', 'Interview', '/journal-interview-comptage-en')],
  t_k='Trust center', t_h='Reports, data, governance.',
  t_lead='One entry point to published information and practical resources for every stakeholder.',
  t_all=('All documents', '/publications-en'), t_note=('Document status:', '/avertissements-en', 'data limits and disclaimers'),
  trust=[('Reporting', 'Investors & reports', 'Investor factsheet, deck, progress report, data book and calendar.', 'Open the reporting center →', '/publications-en#pub-inv', False),
         ('Data', 'Open data book', 'The published EnerTchad workbook, available for download.', 'Download workbook →', '/Data_Book_EnerTchad.xlsx', True),
         ('Governance', 'Ethics & transparency', 'Compliance, anti-corruption, alert channel and state payments.', 'View the framework →', '/ethique-en', False),
         ('News', 'Newsroom & archives', 'Official releases and dated publications.', 'View publications →', '/communiques-en', False),
         ('Portfolio', 'Projects & milestones', 'Roadmap, workstreams and published milestones.', 'Explore projects →', '/projets-en', False)],
  d_k='Sustainability', d_h='Rules set before the first barrel.',
  d_lead='HSE-Q commitments, local content and revenue transparency, measured and dated.',
  d_links=[('Our commitments', '/engagements-en'), ('2030 targets', '/cibles-2030-en'), ('Payments to governments', '/paiements-etats-en')],
  d_alt='Solar panels under a cloudy sky',
  q_label='Quick access',
  quick=[('Investors', 'Investment case, roadmap, documents and calendar.', '/investisseurs-en'),
         ('Careers', 'Job families and the Tchaditude academy.', '/carrieres-en'),
         ('Clients', 'Fuels, oilfield services, integrated solutions.', '/clients-en'),
         ('Suppliers', 'Vendor listing and tenders.', '/achats-en')],
  past='Upcoming events will be published in the investor calendar.'),
}


AGENDA_JS = r'''<script id="ph-agenda-js">(function(){try{var u=document.getElementById('ph-agenda');if(!u)return;var t=new Date();t.setHours(0,0,0,0);
[].slice.call(u.querySelectorAll('li[data-date]')).forEach(function(li){if(new Date(li.getAttribute('data-date')+'T23:59:59')<t)li.remove()});
if(!u.children.length){var li=document.createElement('li');li.textContent=u.getAttribute('data-past');u.appendChild(li)}}catch(e){}})();</script>'''


def img(name, alt, sizes, eager=False, w=1400, h=934):
    return (f'<img src="/assets/img/p/{name}-1400.webp" srcset="/assets/img/p/{name}-700.webp 700w, '
            f'/assets/img/p/{name}-1400.webp 1400w" sizes="{sizes}" alt="{alt}" width="{w}" height="{h}" '
            + ('' if eager else 'loading="lazy" ') + 'decoding="async">')


def body(t):
    figs = ''.join(f'<div><b>{a}</b><span>{b}</span></div>' for a, b in t['figs'])
    ch = ''.join(f'''<li class="ph-chapter">
<a class="ph-ph" href="{href}" tabindex="-1" aria-hidden="true">{img(im, alt, '(max-width:760px) 100vw, 55vw')}</a>
<div class="ph-tx"><p class="ph-num">{n}</p><p class="ph-eyebrow">{pole}</p><h3>{title}</h3><p>{text}</p>
<div class="ph-kf"><b>{kf}</b><span>{kfs}</span></div>
<p><a class="ph-link" href="{href}">{t['discover']} {pole}</a></p></div></li>''' for n, pole, title, text, kf, kfs, im, href, alt in t['chapters'])
    caps = ''.join(f'<a href="{h}"><b>{a}</b><span>{b}</span></a>' for a, b, h in t['caps'])
    ag = ''.join(f'<li data-date="{d}"><time datetime="{d}">{lab}</time><div><b>{a}</b><span>{b}</span></div></li>' for d, lab, a, b in t['agenda'])
    news = ''.join(f'<li><a href="{h}"><time datetime="{d}">{lab}</time><strong>{tt}</strong><em>{k}</em></a></li>' for d, lab, tt, k, h in t['news'])
    dl = ''.join(f'<li><a href="{h}">{a}</a></li>' for a, h in t['d_links'])
    trust = ''.join(f'<a class="et-proof-card" href="{h}"{" download" if dl_ else ""}><span class="ph-eyebrow">{k}</span><b>{a}</b><span>{b}</span><em>{c}</em></a>' for k, a, b, c, h, dl_ in t['trust'])
    quick = ''.join(f'<a href="{h}"><b>{a}</b><span>{b}</span></a>' for a, b, h in t['quick'])
    return f'''<main id="main-content" tabindex="-1" class="php">
<header class="ph-hero" id="top"><div class="ph-wrap">
<p class="ph-eyebrow">{t['eyebrow']}</p>
<h1 id="ph-h1">{t['h1']}</h1>
<p class="ph-sub">{t['sub']}</p>
<div class="ph-actions"><a class="ph-btn ph-btn-light" href="{t['cta1'][1]}">{t['cta1'][0]}</a><a class="ph-link" href="{t['cta2'][1]}">{t['cta2'][0]}</a></div>
<div class="ph-figs">{figs}</div>
<p class="ph-note">{t['note'][0]} <a href="{t['note'][2]}">{t['note'][1]}</a></p>
</div></header>

<section aria-labelledby="ph-mission"><div class="ph-wrap ph-manifesto">
<div class="ph-sig"><h2 id="ph-mission" class="ph-eyebrow">{t['m_k']}</h2>
<p class="ph-big">{t['m_big']}</p>
<p class="ph-lead">{t['m_lead']}</p>
<p><a class="ph-link" href="{t['m_link'][1]}">{t['m_link'][0]}</a></p></div>
<figure><img src="/assets/img/p/lac-tchad-espace-1200.webp" srcset="/assets/img/p/lac-tchad-espace-700.webp 700w, /assets/img/p/lac-tchad-espace-1200.webp 1200w" sizes="(max-width:760px) 100vw, 40vw" alt="{t['m_alt']}" width="1200" height="900" loading="lazy" decoding="async"><figcaption>{t['m_cap']}</figcaption></figure>
</div></section>

<section id="chaine" class="ph-mist" aria-labelledby="ph-chaine"><div class="ph-wrap">
<div class="ph-head"><div><p class="ph-eyebrow">{t['c_k']}</p><h2 id="ph-chaine">{t['c_h']}</h2><p class="ph-lead">{t['c_lead']}</p></div></div>
<ol class="ph-chapters">{ch}</ol>
</div></section>

<section aria-labelledby="ph-caps"><div class="ph-wrap">
<div class="ph-head"><div><p class="ph-eyebrow">{t['k_k']}</p><h2 id="ph-caps">{t['k_h']}</h2></div></div>
<div class="ph-caps">{caps}</div>
</div></section>

<section class="ph-night" aria-labelledby="ph-inv"><div class="ph-wrap">
<div style="display:grid;gap:24px;align-content:start"><p class="ph-eyebrow">{t['i_k']}</p>
<h2 id="ph-inv">{t['i_h']}</h2>
<p class="ph-lead">{t['i_lead']}</p>
<div class="ph-actions"><a class="ph-btn ph-btn-gold" href="{t['i_cta1'][1]}">{t['i_cta1'][0]}</a><a class="ph-link" href="{t['i_cta2'][1]}">{t['i_cta2'][0]}</a></div></div>
<div><p class="ph-eyebrow" style="margin-bottom:18px">{t['a_k']}</p>
<ul class="ph-agenda" id="ph-agenda" data-past="{t['past']}">{ag}</ul>
<p style="margin-top:18px;font-size:.85rem">{t['a_note']} <a href="{t['a_all'][1]}" style="color:#fff">{t['a_all'][0]}</a></p></div>
</div></section>

<section aria-labelledby="ph-actu"><div class="ph-wrap">
<div class="ph-head"><div><p class="ph-eyebrow">{t['n_k']}</p><h2 id="ph-actu">{t['n_h']}</h2></div><a class="ph-link" href="{t['n_all'][1]}">{t['n_all'][0]}</a></div>
<ul class="ph-edlist">{news}</ul>
</div></section>

<section class="et-proof-center ph-mist" aria-labelledby="ph-trust"><div class="ph-wrap">
<div class="ph-head"><div><p class="ph-eyebrow">{t['t_k']}</p><h2 id="ph-trust">{t['t_h']}</h2><p class="ph-lead">{t['t_lead']}</p></div><a class="ph-link" href="{t['t_all'][1]}">{t['t_all'][0]}</a></div>
<div class="ph-trust">{trust}</div>
<p class="ph-tnote">{t['t_note'][0]} <a href="{t['t_note'][1]}">{t['t_note'][2]}</a></p>
</div></section>

<section class="ph-split" aria-labelledby="ph-dur">
<img src="/assets/img/p/solaire-champ-1400.webp" srcset="/assets/img/p/solaire-champ-700.webp 700w, /assets/img/p/solaire-champ-1400.webp 1400w" sizes="(max-width:760px) 100vw, 50vw" alt="{t['d_alt']}" width="1400" height="931" loading="lazy" decoding="async">
<div class="ph-txt"><p class="ph-eyebrow">{t['d_k']}</p><h2 id="ph-dur">{t['d_h']}</h2>
<p class="ph-lead">{t['d_lead']}</p>
<ul class="ph-links">{dl}</ul></div>
</section>

<section aria-label="{t['q_label']}"><div class="ph-wrap"><div class="ph-quick">{quick}</div></div></section>
</main>
'''+AGENDA_JS


def rebuild(path, lang):
    h = open(path, encoding='utf-8').read()
    if 'class="php"' in h:
        return 'deja migre'
    head, rest = h[:h.find('<body')], h[h.find('<body'):]
    if 'bundle_core_a1' not in head:
        head = head.replace('<link rel="stylesheet" href="/assets/chrome/bundle_head_b2.css">',
                            '<link rel="stylesheet" href="/assets/chrome/bundle_head_b2.css">\n<link rel="stylesheet" href="/assets/chrome/bundle_core_a1.css">', 1)
    for k in DROP_CSS:
        head = re.sub(r'<link[^>]*' + re.escape(k) + r'[^>]*>\s*', '', head)
    head = head.replace('<link rel="stylesheet" id="premium-chrome"',
                        f'<link rel="preload" as="image" href="/assets/img/p/pompe-petrole-1900.webp" media="(min-width:761px)" fetchpriority="high">\n'
                        f'<link rel="preload" as="image" href="/assets/img/p/pompe-petrole-1000.webp" media="(max-width:760px)" fetchpriority="high">\n'
                        f'<link rel="stylesheet" id="home-premium" href="/assets/chrome/home-inline-premium.css?b={BUILD}">\n'
                        '<link rel="stylesheet" id="premium-chrome"', 1)
    body_tag = re.match(r'<body[^>]*>', rest).group(0)
    new_body_tag = re.sub(r'class="([^"]*)"', lambda m: f'class="{m.group(1)} php-body"', body_tag) if 'class="' in body_tag else body_tag.replace('<body', '<body class="php-body"')
    skip = re.search(r'<a [^>]*href="#main-content"[^>]*>[^<]*</a>', rest).group(0)
    nav = re.search(r'<nav class="nav nx pn" id="nav"[\s\S]*?</nav>', rest).group(0)
    navjs = re.search(r'<script src="/assets/chrome/nav_a\.js[^>]*></script>', rest).group(0)
    footer = re.search(r'<footer class="pft">[\s\S]*?</footer>', rest).group(0)
    tail = rest[rest.find('</footer>') + len('</footer>'):rest.rfind('</body>')]
    tail = re.sub(r'<script[^>]*>[\s\S]*?</script>',
                  lambda m: '' if any(k in m.group(0)[:400] for k in DROP_TAIL) else m.group(0), tail)
    tail = re.sub(r'<div class="rootland"[^>]*></div>', '', tail)
    tail = re.sub(r'\n{3,}', '\n\n', tail)
    out = (head + new_body_tag + '\n' + skip + '\n<div id="readbar" aria-hidden="true"></div>\n' + nav + '\n' + navjs + '\n' + body(T[lang]) + '\n'
           + footer + tail + '\n</body>\n</html>\n')
    open(path, 'w', encoding='utf-8').write(out)
    return len(out)


if __name__ == '__main__':
    for p, lang in (('index.html', 'fr'), ('index-en.html', 'en')):
        print(p, rebuild(p, lang))

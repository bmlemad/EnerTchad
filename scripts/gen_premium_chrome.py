# -*- coding: utf-8 -*-
"""Refonte premium, etape 1 : en-tete, menu et pied de page communs.

Remplace, sur chaque page FR/EN dotee de la navigation standard, le bloc
<nav id="nav"> et le <footer> par la nouvelle structure en six rubriques
(Qui sommes-nous, Nos activites, Durabilite, Investisseurs, Actualites, Carrieres),
ajoute la feuille premium-chrome.css et rend le theme clair par defaut.

Le contrat du DOM est conserve (#navLinks > .nav-item > .nav-trigger + .nx-mega,
.nx-col, .nxh, .nx-feat, .nx-util, .nx-util-m, #navTog, .foot-col, .foot-legal-links)
pour que les scripts de navigation existants et la QA continuent de fonctionner.
Les elements propres a chaque page (lien de la marque, lien de langue, marqueur
data-eh, boutons recherche/menu) sont repris de la page ; le bloc newsletter, les
coordonnees, les reseaux et l adresse sont repris du pied de page de l accueil de la
meme langue, sans etre retapes.

Usage : python3 scripts/gen_premium_chrome.py   (a la racine du depot ; idempotent)
"""
import glob
import html
import re
import sys

BUILD = '202610011500'
CSS = f'<link rel="stylesheet" id="premium-chrome" href="/assets/chrome/premium-chrome.css?b={BUILD}">'
CHEV = ('<svg aria-hidden="true" focusable="false" width="11" height="11" viewBox="0 0 12 12" fill="none" '
        'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'
        '<path d="M2.5 4.5L6 8l3.5-3.5"/></svg>')

# ---------------------------------------------------------------- contenu
# (titre, intro, hub, [(libelle, sous-titre, lien)], (etiquette, titre, sous-titre, lien))
FR = [
    ('Qui sommes-nous', 'Une société pétrolière intégrée, à capitaux tchadiens, en constitution à N’Djamena.', '/societe', [
        ('La Société', 'Mission, vision, repères', '/societe'),
        ('Gouvernance', 'Société anonyme OHADA', '/gouvernance'),
        ('Éthique & conformité', 'Code de conduite, canal d’alerte', '/ethique'),
        ('Innovation & R&D', 'Ingénierie frugale, IA', '/innovation'),
        ('Achats & fournisseurs', 'Centrale d’achat, référencement', '/achats'),
        ('Brochure institutionnelle', 'L’essentiel en six pages', '/brochure'),
        ('Questions fréquentes', 'Centre d’aide', '/faq'),
        ('Contact', 'Écrire, appeler, venir', '/contact'),
    ], ('La Voie EnerTchad', 'Bâtir et retenir la valeur au pays', 'Mission, vision et cercle vertueux', '/societe#voie')),
    ('Nos activités', 'Trois pôles de cœur et la pétrochimie, prolongés par quatre capacités intégrées.', '/nos-activites', [
        ('Exploration & Production', 'Extraire davantage de chaque gisement', '/amont/'),
        ('Transport & stockage', 'Corridor d’export, réserve distribuée', '/intermediaire/'),
        ('Raffinage & distribution', 'Mini-raffinerie, stations, dernier km', '/aval/'),
        ('Pétrochimie', 'Méthanol, urée, bitume', '/petrochimie/'),
        ('Technologies', 'TchadiTech : numérique, données', '/tchaditech/'),
        ('Conseil & Atlas', 'EnerConseils : études, audits', '/enerconseils/'),
        ('Solutions par besoin', 'Produire, acheminer, transformer', '/solutions'),
        ('Devenir client', 'Carburants, services, boutique', '/clients'),
    ], ('Outil', 'Calculateur du baril additionnel', 'Estimer le gain d’une récupération assistée', '/amont/calculateur-baril-additionnel')),
    ('Durabilité', 'Des règles posées avant le premier baril : climat, territoires, sécurité, transparence.', '/greentech/', [
        ('Engagements & indicateurs', 'Base, réalisé, cible, échéance', '/engagements'),
        ('Cibles 2030', 'Tableau de bord', '/cibles-2030'),
        ('Communautés & territoires', 'Contenu local, désenclavement', '/communautes'),
        ('Capital humain', 'Tchaditude : académie, relève', '/tchaditude/'),
        ('Paiements aux États', 'Les sept catégories ITIE', '/paiements-etats'),
        ('Éthique & conformité', 'Anti-corruption, alerte', '/ethique'),
    ], ('Transition', '30 % et plus de renouvelables visés', 'Climat et énergie', '/greentech/#transition')),
    ('Investisseurs', 'Un capital levé par paliers, de 100 M à 10 Md FCFA, avec des jalons datés.', '/investisseurs', [
        ('Thèse d’investissement', 'Pourquoi le Tchad, maintenant', '/investisseurs#these'),
        ('Modèle d’affaires', 'Chaque étage finance le suivant', '/investisseurs#modele'),
        ('Feuille de route', '8 chantiers phares datés', '/projets'),
        ('Cibles 2030', 'Tableau de bord', '/cibles-2030'),
        ('Publications & documents', 'Fiche, data book, mémorandum', '/publications'),
        ('Agenda investisseur', 'Prochains rendez-vous', '/investisseurs#agenda'),
        ('Gouvernance', 'Société anonyme OHADA', '/gouvernance'),
        ('Partenariats', 'GCIC, OT, État, académique', '/tchaditude/#partenariats'),
    ], ('Passer à l’acte', 'Souscrire au capital', 'De 100 M à 10 Md FCFA, par paliers', '/investisseurs#souscrire')),
    ('Actualités', 'Communiqués, enquêtes techniques et interviews métier, datés.', '/carnets', [
        ('Carnets', 'Articles et interviews', '/carnets'),
        ('Communiqués officiels', 'Annonces datées', '/communiques'),
        ('Espace presse', 'Contacts et ressources', '/presse'),
        ('Atlas du secteur', 'Le secteur pétrolier du Tchad', '/enerconseils/atlas'),
        ('Glossaire pétrolier', 'Les termes du métier', '/glossaire-petrolier'),
    ], ('Carnet', 'Première du genre', 'Une chaîne intégrée pensée au Tchad', '/journal-premiere-du-genre')),
    ('Carrières', 'Du puits à la pompe, une chaîne entière à faire tourner, avec la relève tchadienne d’abord.', '/carrieres', [
        ('Métiers & candidatures', 'Géosciences, forage, HSE, digital', '/carrieres'),
        ('Académie Tchaditude', 'Former avant d’extraire', '/tchaditude/'),
        ('Former avant d’extraire', 'Carnet · l’académie', '/journal-former-avant-extraire'),
        ('Chef de chantier wellpads', 'Interview métier', '/journal-interview-wellpads'),
    ], ('Nous rejoindre', 'Les talents tchadiens d’abord', 'Familles de métiers ouvertes', '/carrieres')),
]
EN = [
    ('About us', 'An integrated oil company with Chadian capital, being incorporated in N’Djamena.', '/societe', [
        ('The Company', 'Mission, vision, milestones', '/societe'),
        ('Governance', 'OHADA public limited company', '/gouvernance'),
        ('Ethics & compliance', 'Code of conduct, alert line', '/ethique'),
        ('Innovation & R&D', 'Frugal engineering, AI', '/innovation'),
        ('Procurement & suppliers', 'Central purchasing, vendor listing', '/achats'),
        ('Corporate brochure', 'The essentials in six pages', '/brochure'),
        ('FAQ', 'Help centre', '/faq'),
        ('Contact', 'Write, call, visit', '/contact'),
    ], ('The EnerTchad Way', 'Building and keeping value in Chad', 'Mission, vision and virtuous circle', '/societe#voie')),
    ('What we do', 'Three core divisions and petrochemicals, extended by four integrated capabilities.', '/nos-activites', [
        ('Exploration & Production', 'More from every field', '/amont/'),
        ('Transport & storage', 'Export corridor, distributed reserve', '/intermediaire/'),
        ('Refining & distribution', 'Mini-refinery, stations, last mile', '/aval/'),
        ('Petrochemicals', 'Methanol, urea, bitumen', '/petrochimie/'),
        ('Technologies', 'TchadiTech: digital, data', '/tchaditech/'),
        ('Advisory & Atlas', 'EnerConseils: studies, audits', '/enerconseils/'),
        ('Solutions by need', 'Produce, move, transform', '/solutions'),
        ('Become a client', 'Fuels, services, shop', '/clients'),
    ], ('Tool', 'Additional barrel calculator', 'Estimate the gain from enhanced recovery', '/amont/calculateur-baril-additionnel')),
    ('Sustainability', 'Rules set before the first barrel: climate, territories, safety, transparency.', '/greentech/', [
        ('Commitments & indicators', 'Baseline, actual, target, deadline', '/engagements'),
        ('2030 targets', 'Dashboard', '/cibles-2030'),
        ('Communities & territories', 'Local content, opening up regions', '/communautes'),
        ('Human capital', 'Tchaditude: academy, next generation', '/tchaditude/'),
        ('Payments to governments', 'The seven EITI categories', '/paiements-etats'),
        ('Ethics & compliance', 'Anti-corruption, alert line', '/ethique'),
    ], ('Transition', '30%+ renewables targeted', 'Climate and energy', '/greentech/#transition')),
    ('Investors', 'Capital raised in tiers, from FCFA 100 M to 10 bn, with dated milestones.', '/investisseurs', [
        ('Investment case', 'Why Chad, why now', '/investisseurs#these'),
        ('Business model', 'Each stage funds the next', '/investisseurs#modele'),
        ('Roadmap', '8 dated flagship projects', '/projets'),
        ('2030 targets', 'Dashboard', '/cibles-2030'),
        ('Publications & documents', 'Fact sheet, data book, memorandum', '/publications'),
        ('Investor calendar', 'Upcoming events', '/investisseurs#agenda'),
        ('Governance', 'OHADA public limited company', '/gouvernance'),
        ('Partnerships', 'GCIC, OT, State, academia', '/tchaditude/#partenariats'),
    ], ('Take action', 'Subscribe to the capital', 'From FCFA 100 M to 10 bn, in tiers', '/investisseurs#souscrire')),
    ('News', 'Press releases, technical features and job interviews, all dated.', '/carnets', [
        ('Journal', 'Articles and interviews', '/carnets'),
        ('Press releases', 'Dated announcements', '/communiques'),
        ('Press room', 'Contacts and resources', '/presse'),
        ('Sector atlas', 'Chad’s oil sector', '/enerconseils/atlas'),
        ('Oil glossary', 'The terms of the trade', '/glossaire-petrolier'),
    ], ('Journal', 'A first of its kind', 'An integrated chain designed in Chad', '/journal-premiere-du-genre')),
    ('Careers', 'From wellhead to pump, a whole chain to run, with Chad’s next generation first.', '/carrieres', [
        ('Jobs & applications', 'Geoscience, drilling, HSE, digital', '/carrieres'),
        ('Tchaditude academy', 'Train before we extract', '/tchaditude/'),
        ('Train before we extract', 'Journal · the academy', '/journal-former-avant-extraire'),
        ('Wellpad site manager', 'Job interview', '/journal-interview-wellpads'),
    ], ('Join us', 'Chadian talent first', 'Open job families', '/carrieres')),
]
UI = {
    'fr': dict(all='Vue d’ensemble', util=[('Contact', '/contact'), ('Carrières', '/carrieres')], search='Rechercher',
               invest='Investir', aria='Navigation principale', foot_desc='Société pétrolière intégrée à capitaux tchadiens, de la roche-mère à la pompe.',
               h_sections='Rubriques', h_access='Accès directs', h_info='Informations', top='Haut de page',
               access=[('Devenir client', '/clients'), ('Fournisseurs', '/achats'), ('Espace presse', '/presse'),
                       ('Questions fréquentes', '/faq'), ('Contact', '/contact'), ('Plan du site', '/plan-du-site')],
               info=[('Mentions légales', '/mentions-legales'), ('Confidentialité', '/confidentialite'), ('Cookies', '/cookies'),
                     ('Accessibilité', '/accessibilite'), ('Avertissements', '/avertissements'), ('Signalement éthique', '/ethique#alerte')],
               legal=[('Mentions légales', '/mentions-legales'), ('Confidentialité', '/confidentialite'), ('Cookies', '/cookies'), ('Signalement éthique', '/ethique#alerte')],
               motto='De la roche-mère à la pompe.'),
    'en': dict(all='Overview', util=[('Contact', '/contact'), ('Careers', '/carrieres')], search='Search',
               invest='Invest', aria='Main navigation', foot_desc='An integrated oil company with Chadian capital, from source rock to pump.',
               h_sections='Sections', h_access='Quick access', h_info='Information', top='Back to top',
               access=[('Become a client', '/clients'), ('Suppliers', '/achats'), ('Press room', '/presse'),
                       ('FAQ', '/faq'), ('Contact', '/contact'), ('Site map', '/plan-du-site')],
               info=[('Legal notice', '/mentions-legales'), ('Privacy', '/confidentialite'), ('Cookies', '/cookies'),
                     ('Accessibility', '/accessibilite'), ('Disclaimers', '/avertissements'), ('Ethics alert line', '/ethique#alerte')],
               legal=[('Legal notice', '/mentions-legales'), ('Privacy', '/confidentialite'), ('Cookies', '/cookies'), ('Ethics alert line', '/ethique#alerte')],
               motto='From source rock to pump.'),
}

# Rubrique de chaque page (pour l etat actif du menu)
SECTIONS = [
    (0, r'^(societe|gouvernance|ethique|innovation|achats|brochure|faq|contact)(-en)?\.html$'),
    (1, r'^(nos-activites|solutions|clients)(-en)?\.html$|^(amont|intermediaire|aval|petrochimie|tchaditech)/|^enerconseils/index\.html$'
        r'|^pole-(amont|intermediaire|aval|enerchimie|tchaditech|enerconseils)-en\.html$|^Calculateur|^Configurateur'),
    (2, r'^(engagements|cibles-2030|communautes|paiements-etats)(-en)?\.html$|^(greentech|tchaditude)/|^pole-(greentech|tchaditude)-en\.html$'),
    (3, r'^(investisseurs|projets|publications)(-en)?\.html$'),
    (4, r'^(carnets|communiques|presse|glossaire-petrolier)(-en)?\.html$|^journal-|^enerconseils/atlas'),
    (5, r'^carrieres(-en)?\.html$'),
]

EN_HUB = {'/amont/': '/pole-amont-en', '/intermediaire/': '/pole-intermediaire-en', '/aval/': '/pole-aval-en',
          '/petrochimie/': '/pole-enerchimie-en', '/tchaditech/': '/pole-tchaditech-en', '/enerconseils/': '/pole-enerconseils-en',
          '/greentech/': '/pole-greentech-en', '/tchaditude/': '/pole-tchaditude-en', '/enerconseils/atlas': '/enerconseils/atlas-en'}
NO_EN = {'/amont/calculateur-baril-additionnel'}


def en_href(href):
    path, frag = (href.split('#', 1) + [''])[:2]
    frag = '#' + frag if frag else ''
    if path in NO_EN:
        return href
    if path in EN_HUB:
        return EN_HUB[path] + frag
    return path + '-en' + frag


def esc(s):
    return html.escape(s, quote=False)


def nav_items(data, lang, current_path, active):
    out = []
    for i, (title, intro, hub, links, (ftag, ftitle, fsub, fhref)) in enumerate(data):
        L = (lambda h: h) if lang == 'fr' else en_href
        cur = lambda h: ' aria-current="page"' if L(h).split('#')[0] == current_path and '#' not in L(h) else ''
        lis = ''.join(f'<a href="{L(h)}"{cur(h)}><strong>{esc(t)}</strong><em>{esc(s)}</em></a>' for t, s, h in links)
        trig_cls = 'nav-trigger is-active' if i == active else 'nav-trigger'
        trig_cur = ' aria-current="true"' if i == active else ''
        n = 'abcdef'[i]
        out.append(
            f'<div class="nav-item pn-item"><button type="button" class="{trig_cls}"{trig_cur} aria-expanded="false" '
            f'aria-haspopup="true" aria-controls="nxm-{n}">{esc(title)} {CHEV}</button>'
            f'<div class="nx-mega pn-mega" id="nxm-{n}" role="region" aria-label="{esc(title)}">'
            f'<div class="nx-col pn-intro"><p class="nxh">{esc(title)}</p><p class="pn-d">{esc(intro)}</p>'
            f'<a class="pn-all" href="{L(hub)}"{cur(hub)}><strong>{UI[lang]["all"]}</strong><em>{esc(title)}</em></a></div>'
            f'<div class="nx-col pn-links">{lis}</div>'
            f'<a class="nx-feat pn-feat" href="{L(fhref)}"><span class="tag">{esc(ftag)}</span><strong>{esc(ftitle)}</strong>'
            f'<em>{esc(fsub)}</em><span class="arr">→</span></a></div></div>')
    return ''.join(out)


def build_nav(lang, page, old):
    ui = UI[lang]
    data = FR if lang == 'fr' else EN
    path = '/' + page.replace('index.html', '').replace('.html', '')
    active = next((n for n, rx in SECTIONS if re.search(rx, page)), -1)
    brand = re.search(r'<a [^>]*class="brand"[\s\S]*?</a>', old).group(0)
    nl = re.search(r'<div([^>]*)\bid="navLinks"', old)
    eh = re.search(r'data-eh="[^"]*"', nl.group(1)) if nl else None
    eh_attr = eh.group(0) + ' ' if eh else ''
    lang_a = re.search(r'<a href="[^"]*" class="nx-lang"[\s\S]*?</a>', old).group(0)
    lang_x = re.search(r'<a href="[^"]*" class="nx-langx"[\s\S]*?</a>', old)
    lang_x = lang_x.group(0) if lang_x else ''
    lang_target = re.search(r'href="([^"]*)"', lang_a).group(1)
    cta = re.search(r'<div class="nav-cta nx-cta">[\s\S]*?id="navTog"[\s\S]*?</button>\s*</div>', old).group(0)
    L = (lambda h: h) if lang == 'fr' else en_href
    util = ''.join(f'<a href="{L(h)}">{t}</a>' for t, h in ui['util'])
    inv = L('/investisseurs#souscrire')
    srch = L('/recherche')
    other = 'English' if lang == 'fr' else 'Français'
    util_m = (''.join(f'<a href="{L(h)}">{t}</a>' for t, h in ui['util'])
              + f'<a href="{lang_target}">{other}</a><a href="/ar" lang="ar">العربية</a>'
              + f'<a href="{inv}" class="cta">{ui["invest"]}</a>')
    return (f'<nav class="nav nx pn" id="nav" aria-label="{ui["aria"]}">\n'
            f'  <div class="nx-util"><div class="nx-util-in">{util}{lang_a}{lang_x}'
            f'<a href="{srch}" class="nx-search" aria-label="{ui["search"]}">{ui["search"]}</a>'
            f'<a href="{inv}" class="nx-invest">{ui["invest"]}</a></div></div>\n'
            f'  <div class="nav-in nx-bar">\n    {brand}\n'
            f'    <div {eh_attr}class="nav-links" id="navLinks">'
            + nav_items(data, lang, path, active)
            + f'<div class="nx-util-m">{util_m}</div></div>\n    {cta}\n  </div>\n</nav>')


def build_footer(lang, src):
    ui = UI[lang]
    L = (lambda h: h) if lang == 'fr' else en_href
    news = re.search(r'<div class="foot-news">[\s\S]*?</form>\s*(?:<p class="fn-alt">[\s\S]*?</p>)?\s*</div>', src).group(0)
    brand = re.search(r'<div class="foot-brand">\s*(<a [^>]*class="brand"[\s\S]*?</a>)', src).group(1)
    social = re.search(r'<div class="foot-social"[^>]*>[\s\S]*?</div>', src).group(0)
    mail = re.search(r'<a href="mailto:[^"]*"[^>]*>[^<]*</a>', src).group(0)
    tel = re.search(r'<a href="tel:[^"]*"[^>]*>[^<]*</a>', src).group(0)
    clean = lambda a: re.sub(r'\sstyle="[^"]*"', '', a)
    legal = re.search(r'(©[^<]*)', src).group(1).strip()
    data = FR if lang == 'fr' else EN
    secs = ''.join(f'<a href="{L(d[2])}">{esc(d[0])}</a>' for d in data)
    acc = ''.join(f'<a href="{L(h)}">{t}</a>' for t, h in ui['access'])
    inf = ''.join(f'<a href="{L(h)}">{t}</a>' for t, h in ui['info'])
    leg = ''.join(f'<a href="{L(h)}">{t}</a>' for t, h in ui['legal'])
    return (f'<footer class="pft">\n  <div class="wrap">\n    <p class="pft-motto">{ui["motto"]}</p>\n    {news}\n'
            f'    <div class="foot-grid pft-grid">\n'
            f'      <div class="foot-brand">{brand}<p class="foot-desc">{ui["foot_desc"]}</p>'
            f'<div class="pft-contact">{clean(mail)}{clean(tel)}</div>{social}</div>\n'
            f'      <div class="foot-col"><h3>{ui["h_sections"]}</h3>{secs}</div>\n'
            f'      <div class="foot-col"><h3>{ui["h_access"]}</h3>{acc}</div>\n'
            f'      <div class="foot-col"><h3>{ui["h_info"]}</h3>{inf}</div>\n'
            f'    </div>\n'
            f'    <div class="foot-legal"><span class="pft-legal">{legal}</span>'
            f'<span class="foot-legal-links">{leg}</span>'
            f'<a class="pft-top" href="#top">{ui["top"]} ↑</a></div>\n  </div>\n</footer>')


NAV_RE = re.compile(r'<nav class="nav nx[^"]*" id="nav"[\s\S]*?</nav>')
FOOT_RE = re.compile(r'<footer[\s\S]*?</footer>')
SYS_OLD = 'function etSysClair(){try{return !window.matchMedia||!matchMedia("(prefers-color-scheme: dark)").matches}catch(e){return true}}'
SYS_NEW = 'function etSysClair(){return true}'


def main():
    src = {'fr': open('index.html', encoding='utf-8').read(), 'en': open('index-en.html', encoding='utf-8').read()}
    foot_src = {k: FOOT_RE.search(v).group(0) for k, v in src.items()}
    if 'class="pft"' in foot_src['fr']:
        sys.exit('Les accueils ont deja le pied de page premium : relancer sur une copie non migree.')
    footers = {k: build_footer(k, v) for k, v in foot_src.items()}
    pages = sorted(glob.glob('*.html')) + sorted(glob.glob('*/*.html'))
    n = 0
    for p in pages:
        if p.startswith(('qa/', 'docs', 'scripts/')):
            continue
        h = open(p, encoding='utf-8').read()
        m = NAV_RE.search(h)
        if not m or 'id="navLinks"' not in m.group(0):
            continue
        lang = 'en' if re.search(r'<html[^>]*\blang="en', h) else 'fr'
        h = h[:m.start()] + build_nav(lang, p, m.group(0)) + h[m.end():]
        if FOOT_RE.search(h):
            h = FOOT_RE.sub(lambda _: footers[lang], h, count=1)
        h = h.replace(SYS_OLD, SYS_NEW)
        if 'id="premium-chrome"' not in h:
            h = h.replace('</head>', CSS + '\n</head>', 1)
        open(p, 'w', encoding='utf-8').write(h)
        n += 1
    print(f'{n} pages migrees')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lot 99 (revue ExxonMobil, écart « communiqués sans page propre ») : une page par communiqué, FR et EN.

Source unique : la liste des communiqués de communiques.html / communiques-en.html (<ol class="pp-releases">,
un <li id="cp-0NN"> par communiqué : date, référence, titre, paragraphes, notes de correction, liens). Ce script
en dérive, pour chaque communiqué, une page autonome au gabarit premium de la page de liste :
  communique/cp-2026-0NN.html  (route /communique/cp-2026-0NN)  et  communique/cp-2026-0NN-en.html
(dossier au singulier : l'export Next.js ne peut pas écrire à la fois la page /communiques et un dossier communiques/)
avec : fil d'Ariane, référence et date (dateline N'Djaména), corps intégral, liens « pour aller plus loin »,
communiqué précédent / suivant, « À propos d'EnerTchad S.A. » (le paragraphe prêt à citer de la page de liste),
contact presse (le même bloc que la page de liste), bouton Imprimer / enregistrer en PDF, feuille d'impression,
balises title/description/canonical/hreflang/Open Graph et JSON-LD NewsArticle + BreadcrumbList.
Rien n'est rédigé ici : chaque texte vient de la liste ou des sections presse de la page de liste.

Il met aussi à jour : les titres de la liste (lien vers la page), feed.xml / feed-en.xml (<link> vers la page ;
<guid> inchangé pour ne pas republier les entrées chez les abonnés) et sitemap.xml (24 URL avec hreflang).

Usage : python3 scripts/gen_communique_pages.py            (écrit les fichiers)
        python3 scripts/gen_communique_pages.py --check    (sort 1 si un fichier généré diffère : contrôle CI)
Relançable (idempotent)."""
import datetime
import html as htmlmod
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://enertchad.com'
CHECK = '--check' in sys.argv
changed = []

MOIS = {'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
        'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12,
        'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12}

T = {
    'fr': dict(suffix='', home='/', home_label='Accueil', list='/communiques', list_label='Communiqués', crumb_aria='Fil d’Ariane',
               kicker='Communiqué de presse', place='N’Djaména, Tchad', ref='Référence', body='Le communiqué',
               more='Pour aller plus loin', print='Imprimer ou enregistrer en PDF', prev='Communiqué précédent',
               next='Communiqué suivant', all='Tous les communiqués', about='À propos d’EnerTchad S.A.',
               about_k='La société en bref', contact='Contact presse', contact_k='Une seule porte, réponse rapide',
               read='Lire le communiqué', inpage='Dans cette page', title_suffix=' | EnerTchad', locale='fr_TD',
               lang='fr', section='Communiqués', updated='Formulation corrigée le', og_site='EnerTchad — Accès aux Énergies'),
    'en': dict(suffix='-en', home='/index-en', home_label='Home', list='/communiques-en', list_label='Press releases', crumb_aria='Breadcrumb',
               kicker='Press release', place='N’Djamena, Chad', ref='Reference', body='The release',
               more='Further reading', print='Print or save as PDF', prev='Previous release',
               next='Next release', all='All press releases', about='About EnerTchad S.A.',
               about_k='The company in brief', contact='Press contact', contact_k='One door, fast answers',
               read='Read the release', inpage='On this page', title_suffix=' | EnerTchad', locale='en_GB',
               lang='en', section='Press releases', updated='Wording corrected on', og_site='EnerTchad — Access to Energy'),
}


def rd(rel):
    return open(os.path.join(ROOT, rel), encoding='utf-8').read()


def put(rel, text):
    path = os.path.join(ROOT, rel)
    cur = open(path, encoding='utf-8').read() if os.path.exists(path) else None
    if cur == text:
        return
    changed.append(rel)
    if not CHECK:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, 'w', encoding='utf-8').write(text)


def strip(s):
    return re.sub(r'\s+', ' ', htmlmod.unescape(re.sub(r'<[^>]+>', '', s))).strip()


def iso_from_text(text, lang):
    m = re.search(r'(\d{1,2})(?:er|st|nd|rd|th)?\s+([A-Za-zéû]+)\s+(\d{4})', text)
    if not m or m.group(2).lower() not in MOIS:
        return None
    return f'{int(m.group(3)):04d}-{MOIS[m.group(2).lower()]:02d}-{int(m.group(1)):02d}'


def parse_list(lang):
    t = T[lang]
    page = rd(f'communiques{t["suffix"]}.html')
    ol = re.search(r'<ol class="pp-releases">(.*?)</ol>', page, re.S).group(1)
    items = []
    for li in re.findall(r'<li id="cp-\d+">.*?</li>', ol, re.S):
        num = re.search(r'<li id="cp-(\d+)">', li).group(1)
        time_m = re.search(r'<time datetime="([^"]+)">([^<]+)</time>', li)
        ref = re.search(r'<span>(CP-\d{4}-\d{3})</span>', li).group(1)
        body = re.search(r'<div class="pp-rel-body">(.*)</div></li>$', li, re.S).group(1)
        title = re.search(r'<h2>(.*?)</h2>', body, re.S).group(1)
        links_m = re.search(r'<div class="pp-rel-links">(.*?)</div>$', body, re.S)
        links = links_m.group(1) if links_m else ''
        paras = body[body.find('</h2>') + 5:links_m.start() if links_m else len(body)]
        # lien « lire le communiqué » éventuellement déjà posé par ce script : retiré de la copie
        title_text = strip(re.sub(r'</?a\b[^>]*>', '', title))
        note = re.search(rf'<em>[^<]*{t["updated"]}\s+([^—<]+)', paras)
        modified = iso_from_text(note.group(1), lang) if note else None
        items.append(dict(num=num, ref=ref, slug=ref.lower(), date=time_m.group(1), date_text=time_m.group(2), title=title_text,
                          paras=paras.strip(), links=re.sub(r'<a class="pp-link" href="/communique/cp-[^"]*">[^<]*</a>', '', links),
                          modified=modified or time_m.group(1)))
    items.sort(key=lambda d: d['num'])
    about = re.search(r'<section id="presse" .*?<div lang="\w+">(.*?)</div>', page, re.S).group(1)
    box = re.search(r'<section id="presse" .*?<p class="pp-box">(.*?)</p>', page, re.S).group(1)
    contact = re.search(r'<section id="presse-contact"[^>]*>.*?<div class="pp-grid">(.*?)</div>\s*</div></div></section>', page, re.S).group(1)
    return page, items, about, box, contact


def head_for(page, lang, it, desc):
    t = T[lang]
    head = page[:page.find('<body')]
    route = f'/communique/{it["slug"]}{t["suffix"]}'
    url = BASE + route
    other = BASE + f'/communique/{it["slug"]}{"-en" if lang == "fr" else ""}'
    fr_url, en_url = (url, other) if lang == 'fr' else (other, url)
    title = f'{it["ref"]} — {it["title"]}'
    h = head
    h = re.sub(r'<title>.*?</title>', '<title>' + htmlmod.escape(title) + t['title_suffix'] + '</title>', h, count=1, flags=re.S)
    h = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="' + htmlmod.escape(desc, quote=True) + '">', h, count=1)
    h = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', h, count=1)
    h = re.sub(r'<link rel="alternate" hreflang="fr" href="[^"]*">', f'<link rel="alternate" hreflang="fr" href="{fr_url}">', h, count=1)
    h = re.sub(r'<link rel="alternate" hreflang="en" href="[^"]*">', f'<link rel="alternate" hreflang="en" href="{en_url}">', h, count=1)
    h = re.sub(r'<link rel="alternate" hreflang="x-default" href="[^"]*">', f'<link rel="alternate" hreflang="x-default" href="{fr_url}">', h, count=1)
    h = re.sub(r'<meta property="og:type" content="[^"]*">', '<meta property="og:type" content="article">', h, count=1)
    h = re.sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="' + htmlmod.escape(title, quote=True) + '">', h, count=1)
    h = re.sub(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="' + htmlmod.escape(desc, quote=True) + '">', h, count=1)
    h = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">', h, count=1)
    h = re.sub(r'<meta name="twitter:title" content="[^"]*">', '<meta name="twitter:title" content="' + htmlmod.escape(title, quote=True) + '">', h, count=1)
    h = re.sub(r'<meta name="twitter:description" content="[^"]*">', '<meta name="twitter:description" content="' + htmlmod.escape(desc, quote=True) + '">', h, count=1)
    # la liste EN écrit ses icônes en chemin relatif (valable à la racine seulement) : chemin absolu dans un sous-dossier
    h = h.replace('href="apple-touch-icon.png"', 'href="/apple-touch-icon.png"').replace('href="favicon-32.png"', 'href="/favicon-32.png"')
    # héros sans image : les préchargements de la photo de la liste n'ont plus d'objet
    h = re.sub(r'<link rel="preload" as="image"[^>]*>\n?', '', h)
    h = h.replace('<meta property="og:type" content="article">',
                  f'<meta property="og:type" content="article"><meta property="article:published_time" content="{it["date"]}"><meta property="article:modified_time" content="{it["modified"]}"><meta property="article:section" content="{t["section"]}">', 1)
    # JSON-LD : Organization et WebSite conservés ; CollectionPage → NewsArticle ; fil d'Ariane à trois niveaux
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', h, re.S)
    graph = json.loads(m.group(1))
    keep = [g for g in graph if g.get('@type') in ('Organization', 'WebSite')]
    website = next((g['@id'] for g in graph if g.get('@type') == 'WebSite'), BASE + '/#website')
    article = {'@context': 'https://schema.org', '@type': 'NewsArticle', '@id': url + '#article', 'url': url, 'mainEntityOfPage': url,
               'headline': it['title'], 'identifier': it['ref'], 'datePublished': it['date'], 'dateModified': it['modified'],
               'inLanguage': lang, 'articleSection': t['section'], 'description': desc,
               'author': {'@id': BASE + '/#organization'}, 'publisher': {'@id': BASE + '/#organization'},
               'isPartOf': {'@id': website}, 'contentLocation': {'@type': 'Place', 'name': t['place']}}
    crumbs = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': t['home_label'], 'item': BASE + t['home']},
        {'@type': 'ListItem', 'position': 2, 'name': t['list_label'], 'item': BASE + t['list']},
        {'@type': 'ListItem', 'position': 3, 'name': it['ref'], 'item': url}]}
    h = h[:m.start(1)] + json.dumps(keep + [article, crumbs], ensure_ascii=False, separators=(',', ':')) + h[m.end(1):]
    return h


PRINT_CSS = ('<style id="cp-print">@media print{#nav,#nezBar,.pp-sub,.pft,.cp-actions,.cp-nav,.et-consent,#et-audience-consent{display:none!important}'
             'main.ppl{padding-top:0!important}.pp-hero{min-height:0!important;padding:0 0 12mm!important}.pp-prose{max-width:none!important}'
             'a[href^="http"]::after{content:" (" attr(href) ")";font-size:.85em}}</style>')
PRINT_JS = '<script id="cp-print-js">(function(){var b=document.getElementById("cp-print-btn");if(b)b.addEventListener("click",function(){window.print()})})();</script>'


def main_for(lang, it, prev_it, next_it, about, box, contact):
    t = T[lang]
    route = f'/communique/{it["slug"]}{t["suffix"]}'
    links = f'<div class="pp-rel-links">{it["links"]}</div>' if it['links'].strip() else ''
    nav = ['<nav class="cp-nav pp-rel-links" aria-label="' + ('Autres communiqués' if lang == 'fr' else 'Other releases') + '">']
    if prev_it:
        nav.append(f'<a class="pp-link" rel="prev" href="/communique/{prev_it["slug"]}{t["suffix"]}">← {t["prev"]} · {prev_it["ref"]}</a>')
    nav.append(f'<a class="pp-link" href="{t["list"]}">{t["all"]}</a>')
    if next_it:
        nav.append(f'<a class="pp-link" rel="next" href="/communique/{next_it["slug"]}{t["suffix"]}">{t["next"]} · {next_it["ref"]} →</a>')
    nav.append('</nav>')
    return (
        '<main id="main-content" tabindex="-1" class="ppl">\n'
        f'<header class="pp-hero pp-hero-s pp-hero-plain" id="top-pole"><div class="pp-wrap"><nav class="pp-crumb" aria-label="{t["crumb_aria"]}">'
        f'<a href="{t["home"]}">{t["home_label"]}</a><span aria-hidden="true">›</span><a href="{t["list"]}">{t["list_label"]}</a><span aria-hidden="true">›</span>'
        f'<span aria-current="page">{it["ref"]}</span></nav><p class="pp-k">{t["kicker"]} · {it["ref"]}</p><h1>{htmlmod.escape(it["title"])}</h1>'
        f'<p class="pp-sublead"><time datetime="{it["date"]}">{it["date_text"]}</time> · {t["place"]} · {t["ref"]} {it["ref"]}</p></div></header>\n'
        f'<nav class="pp-sub" aria-label="{t["inpage"]}"><div class="pp-wrap"><a href="#communique">{t["body"]}</a><a href="#a-propos">{t["about"]}</a><a href="#contact-presse">{t["contact"]}</a></div></nav>\n'
        f'<section id="communique" class="pp-compact" aria-labelledby="cp-h2"><div class="pp-wrap"><h2 id="cp-h2" class="visually-hidden" style="position:absolute;left:-9999px">{t["body"]}</h2>'
        f'<div class="pp-prose pp-prose-w cp-article" lang="{lang}">{it["paras"]}</div>'
        + (f'<p class="pp-k" style="margin-top:32px">{t["more"]}</p>{links}' if links else '')
        + f'<p class="cp-actions"><button type="button" class="pp-btn pp-btn-ink" id="cp-print-btn">{t["print"]}</button></p>'
        + ''.join(nav) + '</div></section>\n'
        f'<section id="a-propos" class="pp-mist" aria-labelledby="cp-h3"><div class="pp-wrap"><div class="pp-head"><p class="pp-k">{t["about_k"]}</p><h2 id="cp-h3">{t["about"]}</h2></div>'
        f'<div class="pp-prose pp-prose-w"><div lang="{lang}">{about}</div><p class="pp-box">{box}</p></div></div></section>\n'
        f'<section id="contact-presse" aria-labelledby="cp-h4"><div class="pp-wrap"><div class="pp-head"><p class="pp-k">{t["contact_k"]}</p><h2 id="cp-h4">{t["contact"]}</h2></div>'
        f'<div class="pp-prose pp-prose-w"><div class="pp-grid">{contact}</div></div></div></section>\n'
        + PRINT_CSS + PRINT_JS + '\n</main>')


def build(lang):
    t = T[lang]
    page, items, about, box, contact = parse_list(lang)
    pre = page[page.find('<body'):page.find('<main id="main-content"')]
    post = page[page.find('</main>') + len('</main>'):]
    # le script de la sous-navigation collante est dans <main> de la liste : repris dans les pages
    sub_js = re.search(r'<script id="pp-sub-js">.*?</script>', page, re.S).group(0)
    for i, it in enumerate(items):
        desc = strip(re.search(r'<p>(.*?)</p>', it['paras'], re.S).group(1))
        if len(desc) > 158:
            desc = desc[:155].rsplit(' ', 1)[0] + '…'
        head = head_for(page, lang, it, desc)
        main = main_for(lang, it, items[i - 1] if i else None, items[i + 1] if i + 1 < len(items) else None, about, box, contact)
        main = main.replace('</main>', sub_js + '\n</main>')
        put(f'communique/{it["slug"]}{t["suffix"]}.html', head + pre + main + post)
    # liste : titre cliquable + lien « lire le communiqué » (idempotent)
    new = page
    for it in items:
        route = f'/communique/{it["slug"]}{t["suffix"]}'
        li_rx = re.compile(rf'(<li id="cp-{it["num"]}">.*?)(</li>)', re.S)
        m = li_rx.search(new)
        li = m.group(0)
        li2 = re.sub(r'<h2>(?!<a )(.*?)</h2>', rf'<h2><a href="{route}">\1</a></h2>', li, count=1, flags=re.S)
        if f'href="{route}"' not in re.search(r'<div class="pp-rel-links">(.*?)</div>', li2, re.S).group(1):
            li2 = li2.replace('<div class="pp-rel-links">', f'<div class="pp-rel-links"><a class="pp-link" href="{route}">{t["read"]} →</a>', 1)
        new = new[:m.start()] + li2 + new[m.end():]
    put(f'communiques{t["suffix"]}.html', new)
    # flux : <link> vers la page ; <guid> inchangé
    feed_rel = 'feed.xml' if lang == 'fr' else 'feed-en.xml'
    feed = rd(feed_rel)
    for it in items:
        feed = feed.replace(f'<link>{BASE}{t["list"]}#cp-{it["num"]}</link>', f'<link>{BASE}/communique/{it["slug"]}{t["suffix"]}</link>')
    put(feed_rel, feed)
    return items


def sitemap(items):
    sm = rd('sitemap.xml')
    today = datetime.date.today().isoformat()
    entries = []
    for it in items:
        fr = f'{BASE}/communique/{it["slug"]}'
        en = fr + '-en'
        alts = f'<xhtml:link rel="alternate" hreflang="fr" href="{fr}"/><xhtml:link rel="alternate" hreflang="en" href="{en}"/><xhtml:link rel="alternate" hreflang="x-default" href="{fr}"/>'
        for loc in (fr, en):
            if f'<loc>{loc}</loc>' in sm:
                continue
            entries.append(f'<url><loc>{loc}</loc><lastmod>{today}</lastmod>{alts}</url>')
    if entries:
        sm = sm.replace('</urlset>', ''.join(entries) + '</urlset>')
    put('sitemap.xml', sm)


if __name__ == '__main__':
    fr_items = build('fr')
    en_items = build('en')
    assert [i['ref'] for i in fr_items] == [i['ref'] for i in en_items], 'listes FR et EN désalignées'
    sitemap(fr_items)
    print(f'{len(fr_items)} communiqués × 2 langues ; {len(changed)} fichier(s) {"à régénérer" if CHECK else "écrit(s)"}')
    for c in changed:
        print('  ', c)
    sys.exit(1 if CHECK and changed else 0)

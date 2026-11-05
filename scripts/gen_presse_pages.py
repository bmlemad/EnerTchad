#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lot 99, suite (revue ExxonMobil, écarts A4 et E5 « espace presse réduit à une ancre, sans version arabe ») :
une page presse autonome en trois langues, assemblée à partir de textes déjà publiés.

  presse.html     (/presse)     et  presse-en.html  (/presse-en) : coquille de la page de liste des communiqués
      (tête, navigation, pied), héros texte, puis les cinq sections presse de cette liste reprises telles quelles
      (paragraphe prêt à citer, kit, logo, photos, contact — mêmes identifiants #presse… : les liens /communiques#presse
      existants restent valables), le délai de réponse publié sur la page Contact, et les derniers communiqués
      (titres de la liste, liens vers les pages /communique/…, flux RSS).
  ar-presse.html  (/ar-presse) : coquille d'ar-contact.html ; la société en bref (premier paragraphe d'ar-societe.html),
      le kit (mêmes fichiers), les derniers communiqués (titres FR, lang="fr"), le contact (cellules d'ar-contact.html).
      Seuls les intitulés de sections et deux phrases de liaison sont écrits ici, en arabe ; aucun fait nouveau.

Met aussi à jour : navigation.json (« Espace presse » → /presse, « Press room » → /presse-en), redirects.json et
_redirects (la redirection /presse → /communiques#presse n'a plus d'objet), sitemap.xml (3 URL avec hreflang),
ar-contact.html (la cellule « صحافة » renvoie à /ar-presse). Les liens « Espace presse » des pieds de page
(243 pages) sont réécrits à l'export par scripts/next/critical.mjs (pressRoom), comme le menu l'est par lib/main-nav.js.

Usage : python3 scripts/gen_presse_pages.py            (écrit)
        python3 scripts/gen_presse_pages.py --check    (sort 1 si un fichier diffère : contrôle CI)
Idempotent."""
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


def rd(rel):
    return open(os.path.join(ROOT, rel), encoding='utf-8').read()


def put(rel, text):
    path = os.path.join(ROOT, rel)
    cur = open(path, encoding='utf-8').read() if os.path.exists(path) else None
    if cur == text:
        return
    changed.append(rel)
    if not CHECK:
        open(path, 'w', encoding='utf-8').write(text)


def strip(s):
    return re.sub(r'\s+', ' ', htmlmod.unescape(re.sub(r'<[^>]+>', '', s))).strip()


T = {
    'fr': dict(src='communiques.html', out='presse.html', route='/presse', home='/', home_label='Accueil', crumb='Fil d’Ariane',
               list='/communiques', list_label='Communiqués', kicker='Espace presse · société en constitution',
               h1='L’espace presse d’EnerTchad S.A.',
               sublead='Le paragraphe officiel, le kit, le logo, les photos, le contact presse — et les derniers communiqués.',
               title='Espace presse | EnerTchad', desc='Espace presse d’EnerTchad S.A. (société en constitution) : paragraphe prêt à citer, kit média, logo, photos, contact presse et derniers communiqués.',
               og_title='Espace presse · EnerTchad S.A.', inpage='Dans cette page', releases_k='06 · Derniers communiqués', releases_h='Les communiqués, du plus récent au premier.',
               releases_p='Chaque communiqué a sa page, datée et référencée ; la liste complète et les notes de correction sont sur la page des communiqués.',
               all='Tous les communiqués', rss='Flux RSS des communiqués et carnets', delay='Réponse sous trois jours ouvrés, comme sur la page Contact.',
               contact_page='/contact', locale='fr_TD', lang='fr', page_name='Espace presse'),
    'en': dict(src='communiques-en.html', out='presse-en.html', route='/presse-en', home='/index-en', home_label='Home', crumb='Breadcrumb',
               list='/communiques-en', list_label='Press releases', kicker='Press room · company in formation',
               h1='The EnerTchad S.A. press room',
               sublead='The official boilerplate, the media kit, the logo, the photos, the press contact — and the latest releases.',
               title='Press room | EnerTchad', desc='EnerTchad S.A. press room (company in formation): ready-to-quote paragraph, media kit, logo, photos, press contact and latest press releases.',
               og_title='Press room · EnerTchad S.A.', inpage='On this page', releases_k='06 · Latest releases', releases_h='The releases, newest first.',
               releases_p='Each release has its own dated, referenced page; the full list and correction notes are on the press releases page.',
               all='All press releases', rss='RSS feed of releases and notebooks', delay='Reply within three business days, as stated on the Contact page.',
               contact_page='/contact-en', locale='en_GB', lang='en', page_name='Press room'),
}
AR = dict(out='ar-presse.html', route='/ar-presse', title='الصحافة — إينيرتشاد ش.م.',
          desc='فضاء الصحافة لإينيرتشاد ش.م. (شركة قيد التأسيس): الشركة باختصار، ملف الصحافة والشعار، آخر البيانات الصحفية، والاتصال بالصحافة — بالعربية.',
          crumb='الصحافة', kicker='الصحافة · شركة قيد التأسيس', h1='فضاء الصحافة', s1_k='01 · الشركة باختصار', s1_h='إينيرتشاد في فقرة.',
          s2_k='02 · ملف الصحافة', s2_h='الشعار والوثائق، في تنزيل واحد.', s3_k='03 · آخر البيانات الصحفية', s3_h='البيانات الصحفية، من الأحدث إلى الأول.',
          s3_p='البيانات الصحفية متاحة بالفرنسية والإنجليزية؛ كل بيان له صفحته المؤرَّخة والمرقَّمة.', s4_k='04 · الاتصال بالصحافة', s4_h='باب واحد، ردّ سريع.',
          kit=[('/kit-presse-enertchad.zip', 'ملف الصحافة الكامل', 'الشعار (SVG + PNG)، لافتة 1200×630، صور توضيحية، الفقرة الرسمية FR/EN، الورقة الصحفية، الكتيّبات.', 'ZIP'),
               ('/Fiche_EnerTchad_AR.pdf', 'الورقة التعريفية بالعربية', 'الورقة التعريفية — أساسيات الشركة بالعربية.', 'PDF'),
               ('/Brochure_EnerTchad.pdf', 'الكتيّب (FR)', 'الشركة في وثيقة واحدة: السلسلة، الأقطاب، الطريق والمراحل.', 'PDF'),
               ('/presse', 'فضاء الصحافة (FR)', 'الفقرة الرسمية، الشعار، الصور والاتصال — الصفحة الكاملة بالفرنسية.', 'صفحة'),
               ('/feed.xml', 'تغذية RSS', 'البيانات الصحفية والمدوّنات، لقارئ التغذيات.', 'RSS')],
          inpage='في هذه الصفحة', nav=[('#sharika', 'الشركة باختصار'), ('#milaf', 'ملف الصحافة'), ('#bayanat', 'آخر البيانات'), ('#ittisal', 'الاتصال')])


def releases(lang):
    page = rd(T[lang]['src'] if lang != 'ar' else 'communiques.html')
    ol = re.search(r'<ol class="pp-releases">(.*?)</ol>', page, re.S).group(1)
    items = []
    for li in re.findall(r'<li id="cp-\d+">.*?</li>', ol, re.S):
        num = re.search(r'<li id="cp-(\d+)">', li).group(1)
        time_m = re.search(r'<time datetime="([^"]+)">([^<]+)</time>', li)
        ref = re.search(r'<span>(CP-\d{4}-\d{3})</span>', li).group(1)
        title = strip(re.search(r'<h2>(.*?)</h2>', li, re.S).group(1))
        items.append(dict(num=num, ref=ref, date=time_m.group(1), date_text=time_m.group(2), title=title,
                          route=f'/communique/{ref.lower()}' + ('-en' if lang == 'en' else '')))
    return page, sorted(items, key=lambda d: d['num'], reverse=True)


def set_head(head, repl):
    for pat, new in repl:
        head, n = re.subn(pat, new, head, count=1, flags=re.S)
        # la liste EN n'a pas de twitter:title / twitter:description : rien à remplacer
        assert n == 1 or pat.startswith('<meta name="twitter:'), pat
    return head


def build(lang):
    t = T[lang]
    page, items = releases(lang)
    head = page[:page.find('<body')]
    pre = page[page.find('<body'):page.find('<main id="main-content"')]
    post = page[page.find('</main>') + len('</main>'):]
    sub_js = re.search(r'<script id="pp-sub-js">.*?</script>', page, re.S).group(0)
    url = BASE + t['route']
    fr_url, en_url = BASE + '/presse', BASE + '/presse-en'
    e = lambda s: htmlmod.escape(s, quote=True)
    head = set_head(head, [
        (r'<title>.*?</title>', '<title>' + e(t['title']) + '</title>'),
        (r'<meta name="description" content="[^"]*">', '<meta name="description" content="' + e(t['desc']) + '">'),
        (r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">'),
        (r'<link rel="alternate" hreflang="fr" href="[^"]*">', f'<link rel="alternate" hreflang="fr" href="{fr_url}">'),
        (r'<link rel="alternate" hreflang="en" href="[^"]*">', f'<link rel="alternate" hreflang="en" href="{en_url}"><link rel="alternate" hreflang="ar" href="{BASE}/ar-presse">'),
        (r'<link rel="alternate" hreflang="x-default" href="[^"]*">', f'<link rel="alternate" hreflang="x-default" href="{fr_url}">'),
        (r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="' + e(t['og_title']) + '">'),
        (r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="' + e(t['desc']) + '">'),
        (r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">'),
        (r'<meta name="twitter:title" content="[^"]*">', '<meta name="twitter:title" content="' + e(t['og_title']) + '">'),
        (r'<meta name="twitter:description" content="[^"]*">', '<meta name="twitter:description" content="' + e(t['desc']) + '">'),
    ])
    head = re.sub(r'<link rel="preload" as="image"[^>]*>\n?', '', head)
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', head, re.S)
    graph = json.loads(m.group(1))
    keep = [g for g in graph if g.get('@type') in ('Organization', 'WebSite')]
    website = next((g['@id'] for g in graph if g.get('@type') == 'WebSite'), BASE + '/#website')
    webpage = {'@context': 'https://schema.org', '@type': 'WebPage', '@id': url + '#webpage', 'url': url, 'name': t['og_title'], 'description': t['desc'],
               'inLanguage': lang, 'isPartOf': {'@id': website}, 'publisher': {'@id': BASE + '/#organization'}, 'breadcrumb': {'@id': url + '#breadcrumb'}}
    crumbs = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': t['home_label'], 'item': BASE + t['home']},
        {'@type': 'ListItem', 'position': 2, 'name': t['page_name'], 'item': url}]}
    head = head[:m.start(1)] + json.dumps(keep + [webpage, crumbs], ensure_ascii=False, separators=(',', ':')) + head[m.end(1):]
    # sections presse de la liste, reprises telles quelles (ids conservés)
    secs = {sid: re.search(rf'<section id="{sid}"[^>]*>.*?</section>', page, re.S).group(0) for sid in ('presse', 'presse-kit', 'presse-logo', 'presse-photos', 'presse-contact')}
    contact = secs['presse-contact'].replace('<div class="pp-prose pp-prose-w"><div class="pp-grid">',
                                             f'<div class="pp-prose pp-prose-w"><p>{t["delay"]} <a class="pp-link" href="{t["contact_page"]}">Contact</a></p><div class="pp-grid">', 1)
    assert contact != secs['presse-contact']
    sub = ''.join(f'<a href="#{sid}">{strip(re.search(r"<h2[^>]*>(.*?)</h2>", secs[sid], re.S).group(1))}</a>' for sid in secs) + f'<a href="#communiques">{strip(t["releases_h"])}</a>'
    lis = ''.join(f'<li><div class="pp-rel-meta"><time datetime="{it["date"]}">{it["date_text"]}</time><span>{it["ref"]}</span></div>'
                  f'<div class="pp-rel-body"><h3><a href="{it["route"]}">{htmlmod.escape(it["title"])}</a></h3></div></li>' for it in items)
    main = ('<main id="main-content" tabindex="-1" class="ppl">\n'
            f'<header class="pp-hero pp-hero-s pp-hero-plain" id="top-pole"><div class="pp-wrap"><nav class="pp-crumb" aria-label="{t["crumb"]}"><a href="{t["home"]}">{t["home_label"]}</a><span aria-hidden="true">›</span><span aria-current="page">{t["page_name"]}</span></nav>'
            f'<p class="pp-k">{t["kicker"]}</p><h1>{t["h1"]}</h1><p class="pp-sublead">{t["sublead"]}</p></div></header>\n'
            f'<nav class="pp-sub" aria-label="{t["inpage"]}"><div class="pp-wrap">{sub}</div></nav>\n'
            + secs['presse'] + '\n' + secs['presse-kit'] + '\n' + secs['presse-logo'] + '\n' + secs['presse-photos'] + '\n' + contact + '\n'
            f'<section id="communiques" aria-labelledby="pp-h7"><div class="pp-wrap"><div class="pp-head"><p class="pp-k">{t["releases_k"]}</p><h2 id="pp-h7">{t["releases_h"]}</h2></div>'
            f'<div class="pp-prose pp-prose-w"><p>{t["releases_p"]}</p><ol class="pp-releases pp-releases-short">{lis}</ol>'
            f'<div class="pp-rel-links"><a class="pp-link" href="{t["list"]}">{t["all"]}</a><a class="pp-link" href="/feed{"-en" if lang == "en" else ""}.xml">{t["rss"]}</a></div></div></div></section>\n'
            + sub_js + '\n</main>')
    put(t['out'], head + pre + main + post)
    return items


def build_ar(items):
    a = AR
    page = rd('ar-contact.html')
    head = page[:page.find('<body')]
    pre = page[page.find('<body'):page.find('<main id="main-content"')].replace(' aria-current="page"', '')
    post = page[page.find('</main>') + len('</main>'):]
    url = BASE + a['route']
    e = lambda s: htmlmod.escape(s, quote=True)
    head = set_head(head, [
        (r'<title>.*?</title>', '<title>' + e(a['title']) + '</title>'),
        (r'<meta name="description" content="[^"]*">', '<meta name="description" content="' + e(a['desc']) + '">'),
        (r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">'),
        (r'<link rel="alternate" hreflang="fr" href="[^"]*">', f'<link rel="alternate" hreflang="fr" href="{BASE}/presse">'),
        (r'<link rel="alternate" hreflang="en" href="[^"]*">', f'<link rel="alternate" hreflang="en" href="{BASE}/presse-en">'),
        (r'<link rel="alternate" hreflang="ar" href="[^"]*">', f'<link rel="alternate" hreflang="ar" href="{url}">'),
        (r'<link rel="alternate" hreflang="x-default" href="[^"]*">', f'<link rel="alternate" hreflang="x-default" href="{BASE}/presse">'),
        (r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="' + e(a['title']) + '">'),
        (r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="' + e(a['desc']) + '">'),
        (r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">'),
        (r'<meta name="twitter:title" content="[^"]*">', '<meta name="twitter:title" content="' + e(a['title']) + '">'),
        (r'<meta name="twitter:description" content="[^"]*">', '<meta name="twitter:description" content="' + e(a['desc']) + '">'),
    ])
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', head, re.S)
    graph = json.loads(m.group(1))
    keep = [g for g in graph if g.get('@type') in ('Organization', 'WebSite')]
    website = next((g['@id'] for g in graph if g.get('@type') == 'WebSite'), BASE + '/#website')
    webpage = {'@context': 'https://schema.org', '@type': 'WebPage', '@id': url + '#webpage', 'url': url, 'name': a['title'], 'description': a['desc'],
               'inLanguage': 'ar', 'isPartOf': {'@id': website}, 'publisher': {'@id': BASE + '/#organization'}, 'breadcrumb': {'@id': url + '#breadcrumb'}}
    crumbs = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'العربية', 'item': BASE + '/ar'},
        {'@type': 'ListItem', 'position': 2, 'name': a['crumb'], 'item': url}]}
    head = head[:m.start(1)] + json.dumps(keep + [webpage, crumbs], ensure_ascii=False, separators=(',', ':')) + head[m.end(1):]
    # matière existante : héros (image) et cellules de contact d'ar-contact.html, premier paragraphe d'ar-societe.html
    cmain = page[page.find('<main id="main-content"'):page.find('</main>')]
    hero_pic = re.search(r'<header class="pp-hero pp-hero-s" id="top-pole">(<picture>.*?</picture>)', cmain, re.S).group(1)
    cells = re.search(r'<section id="qanawat".*?<div class="pp-grid">(.*?)</div><p class="pp-chips">(.*?)</p>', cmain, re.S)
    grid, chips = cells.group(1), cells.group(2)
    presse_cell = re.search(r'<div class="pp-cell"><div>صحافة</div><div>(.*?)</div></div>', cmain, re.S).group(1)
    presse_text = re.sub(r'\s*<a [^>]*>.*?</a>\s*$', '', presse_cell, flags=re.S)
    societe = rd('ar-societe.html')
    about = re.search(r'<section id="hawiya".*?<div class="pp-prose pp-prose-w"><p>(.*?)</p>', societe, re.S).group(1)
    sub_js = re.search(r'<script id="pp-sub-js">.*?</script>', page, re.S).group(0)
    kit = ''.join(f'<a class="pp-cell"{" download=\"\"" if href.endswith((".zip", ".pdf")) else ""} href="{href}"><b>{b}</b><span>{s}</span><em>{em}</em></a>' for href, b, s, em in a['kit'])
    lis = ''.join(f'<li><div class="pp-rel-meta"><time datetime="{it["date"]}" dir="ltr">{it["date_text"]}</time><span dir="ltr">{it["ref"]}</span></div>'
                  f'<div class="pp-rel-body"><h3 lang="fr" dir="ltr"><a href="{it["route"]}">{htmlmod.escape(it["title"])}</a></h3></div></li>' for it in items)
    sub = ''.join(f'<a href="{h}">{l}</a>' for h, l in a['nav'])
    main = ('<main id="main-content" tabindex="-1" class="ppl" dir="rtl">\n'
            f'<header class="pp-hero pp-hero-s" id="top-pole">{hero_pic}<div class="pp-wrap"><nav class="pp-crumb" aria-label="مسار التنقل"><a href="/ar">الرئيسية</a><span aria-hidden="true">‹</span><span aria-current="page">{a["crumb"]}</span></nav>'
            f'<p class="pp-k">{a["kicker"]}</p><h1>{a["h1"]}</h1><p class="pp-sublead">{presse_text}</p></div></header>\n'
            f'<nav class="pp-sub" aria-label="{a["inpage"]}"><div class="pp-wrap">{sub}</div></nav>\n'
            f'<section id="sharika" aria-labelledby="pp-h1"><div class="pp-wrap"><div class="pp-head"><p class="pp-k">{a["s1_k"]}</p><h2 id="pp-h1">{a["s1_h"]}</h2></div><div class="pp-prose pp-prose-w"><p>{about}</p>'
            f'<p><a class="pp-link" href="/ar-societe">صفحة الشركة بالعربية</a> · <a class="pp-link" href="/Fiche_EnerTchad_AR.pdf">الورقة التعريفية (PDF) ↓</a></p></div></div></section>\n'
            f'<section id="milaf" aria-labelledby="pp-h2" class="pp-mist"><div class="pp-wrap"><div class="pp-head"><p class="pp-k">{a["s2_k"]}</p><h2 id="pp-h2">{a["s2_h"]}</h2></div><div class="pp-prose pp-prose-w"><div class="pp-grid">{kit}</div></div></div></section>\n'
            f'<section id="bayanat" aria-labelledby="pp-h3"><div class="pp-wrap"><div class="pp-head"><p class="pp-k">{a["s3_k"]}</p><h2 id="pp-h3">{a["s3_h"]}</h2></div><div class="pp-prose pp-prose-w"><p>{a["s3_p"]}</p><ol class="pp-releases pp-releases-short">{lis}</ol></div></div></section>\n'
            f'<section id="ittisal" aria-labelledby="pp-h4" class="pp-mist"><div class="pp-wrap"><div class="pp-head"><p class="pp-k">{a["s4_k"]}</p><h2 id="pp-h4">{a["s4_h"]}</h2></div><div class="pp-prose pp-prose-w"><p>{presse_text}</p><div class="pp-grid">{grid}</div><p class="pp-chips">{chips}</p></div></div></section>\n'
            + sub_js + '\n</main>')
    put('ar-presse.html', head + pre + main + post)
    # la cellule « صحافة » de la page de contact renvoie à la page presse
    new = page.replace('<div class="pp-cell"><div>صحافة</div><div>' + presse_cell + '</div></div>',
                       '<div class="pp-cell"><div>صحافة</div><div>' + presse_text + ' <a class="pp-link" href="/ar-presse">فضاء الصحافة</a></div></div>', 1) if '/ar-presse' not in presse_cell else page
    put('ar-contact.html', new)


def wiring():
    nav = rd('assets/data/navigation.json')
    nav2 = nav.replace('"/communiques#presse"', '"/presse"').replace('"/communiques-en#presse"', '"/presse-en"')
    put('assets/data/navigation.json', nav2)
    red = json.loads(rd('redirects.json'))
    key = 'redirects' if 'redirects' in red else None
    rules = red[key] if key else red
    before = len(rules)
    rules[:] = [r for r in rules if r.get('source') not in ('/presse', '/presse-en')]
    if len(rules) != before:
        put('redirects.json', json.dumps(red, ensure_ascii=False, indent=2) + '\n')
    sm = rd('sitemap.xml')
    today = datetime.date.today().isoformat()
    alts = (f'<xhtml:link rel="alternate" hreflang="fr" href="{BASE}/presse"/><xhtml:link rel="alternate" hreflang="en" href="{BASE}/presse-en"/>'
            f'<xhtml:link rel="alternate" hreflang="ar" href="{BASE}/ar-presse"/><xhtml:link rel="alternate" hreflang="x-default" href="{BASE}/presse"/>')
    add = ''.join(f'<url><loc>{BASE}{r}</loc><lastmod>{today}</lastmod>{alts}</url>' for r in ('/presse', '/presse-en', '/ar-presse') if f'<loc>{BASE}{r}</loc>' not in sm)
    if add:
        sm = sm.replace('</urlset>', add + '</urlset>')
    put('sitemap.xml', sm)


if __name__ == '__main__':
    items = build('fr')
    build('en')
    build_ar(items)
    wiring()
    print(f'page presse FR, EN, AR ; {len(changed)} fichier(s) {"à régénérer" if CHECK else "écrit(s)"}')
    for c in changed:
        print('  ', c)
    sys.exit(1 if CHECK and changed else 0)

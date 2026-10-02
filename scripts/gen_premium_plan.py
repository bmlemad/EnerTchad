# -*- coding: utf-8 -*-
"""Refonte premium (phase 10) : plan du site (FR et EN), complet et aligne sur le menu.

Le plan du site reprend les six rubriques du menu principal (memes intitules, meme texte
d introduction, memes entrees), et place sous chaque entree les pages qui en dependent
(sous-pages d un pole, carnets). Les pages restantes de la langue sont listees ensuite,
puis les autres langues (plan dans l autre langue, mini-site arabe). Toute page du plan du
site XML de la langue figure ainsi dans le plan (controle a la generation).
Gabarit premium (scripts/gen_premium_institution.py pour l en-tete, le heros et le pied).
Usage : python3 scripts/gen_premium_plan.py
"""
import os
import re
import sys
from html import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_premium_institution as G  # noqa: E402
from gen_premium_pole import sp, inner, SUBNAV_JS, BeautifulSoup  # noqa: E402

G.ALT.setdefault('lac-tchad-espace', ('Le lac Tchad photographié depuis l’orbite', 'Lake Chad photographed from orbit'))
L = {
    'fr': {'page': 'plan-du-site.html', 'nav': 'societe.html', 'other': ('/plan-du-site-en', 'Site map in English', 'en'),
           'more': 'Autres pages', 'more_d': 'Pages de référence, aide et informations légales.',
           'lang': 'Autres langues', 'lang_d': 'Le plan du site en anglais et le mini-site en arabe.',
           'ar': 'Mini-site en arabe', 'sub': 'Rubriques du plan du site', 'search': ('/recherche', 'Rechercher dans le site')},
    'en': {'page': 'plan-du-site-en.html', 'nav': 'societe-en.html', 'other': ('/plan-du-site', 'Plan du site en français', 'fr'),
           'more': 'Other pages', 'more_d': 'Reference pages, help and legal information.',
           'lang': 'Other languages', 'lang_d': 'The site map in French and the Arabic mini-site.',
           'ar': 'Arabic mini-site', 'sub': 'Site map sections', 'search': ('/recherche-en', 'Search the site')},
}


def norm(u):
    return u.split('#')[0].split('?')[0]


REWRITE = {}
if os.path.exists('_redirects'):
    for line in open('_redirects', encoding='utf-8'):
        f = line.split()
        if len(f) >= 3 and f[2] == '200' and f[1].startswith('/'):
            REWRITE[f[0]] = f[1][1:]
HOME = {'/': 'Accueil', '/index-en': 'Home'}


def path_of(u):
    u = u.split('#')[0]
    if u in REWRITE:
        return REWRITE[u]
    if u == '/':
        return 'index.html'
    if u.endswith('/'):
        return u[1:] + 'index.html'
    return u[1:] + '.html'


def lang_of(u):
    p = u.rstrip('/').split('/')[-1]
    if u.startswith('/ar'):
        return 'ar'
    return 'en' if p.endswith('-en') or p == 'index-en' else 'fr'


def title_of(u):
    if u in HOME:
        return HOME[u]
    f = path_of(u)
    if not os.path.exists(f):
        return u
    h = open(f, encoding='utf-8').read()
    m = re.search(r'<title[^>]*>([^<]+)</title>', h)
    t = sp(BeautifulSoup(m.group(1), 'html.parser').get_text()) if m else u
    return re.split(r'\s+[|—–]\s+', t)[0].strip() or t


def sitemap_urls():
    return [re.sub(r'^https://[^/]+', '', x) for x in re.findall(r'<loc>([^<]+)</loc>', open('sitemap.xml', encoding='utf-8').read())]


def link(u, label, extra=''):
    return f'<a href="{escape(u)}"{extra}>{label}</a>'


def build_sections(lang):
    cfg = L[lang]
    urls = [u for u in sitemap_urls() if lang_of(u) == lang]
    ar = [u for u in sitemap_urls() if lang_of(u) == 'ar']
    placed = set()
    nav = BeautifulSoup(open(cfg['nav'], encoding='utf-8').read(), 'html.parser').select_one('#nav')
    secs = []
    for i, mg in enumerate(nav.select('.nx-mega')):
        title = sp(mg.select_one('.nxh').get_text())
        desc = mg.select_one('.pn-d')
        groups = []
        entries = [a for a in mg.select('a[href]') if not a.get('href', '').startswith('#')]
        for a in entries:
            u = a['href']
            lab = inner(a.strong) if a.strong is not None else escape(sp(a.get_text()))
            em = a.find('em')
            if 'pn-all' in (a.get('class') or []):
                em = None
            nu = norm(u)
            placed.add(nu)
            kids = []
            base = u.split('#')[0]
            if base.endswith('/') and base != '/':
                kids = [x for x in urls if x.startswith(base) and norm(x) != nu]
            elif base in ('/carnets', '/carnets-en'):
                kids = [x for x in urls if x.startswith('/journal-')]
            kids = [x for x in kids if norm(x) not in placed]
            for x in kids:
                placed.add(norm(x))
            def kid_label(x):
                # « Forage & completion · Exploration & Production » : le pole est deja le titre du groupe
                return re.sub(r'\s+·\s+[^·]+$', '', title_of(x)) if base.endswith('/') else title_of(x)
            kid_h = ''.join(f'<li>{link(x, escape(kid_label(x)))}</li>' for x in sorted(kids, key=lambda z: kid_label(z).lower()))
            groups.append(f'<div class="pp-smg">{link(u, lab)}' + (f'<p>{inner(em)}</p>' if em is not None and sp(em.get_text()) else '')
                          + (f'<ul>{kid_h}</ul>' if kid_h else '') + '</div>')
        hid = f'pp-hs{i + 1}'
        secs.append((f'plan-{i + 1}', title,
                     f'<div class="pp-wrap">{G.head(f"{i + 1:02d}", hid, escape(title), inner(desc) if desc is not None else "")}'
                     f'<div class="pp-smgrid">{"".join(groups)}</div></div>'))
    # pages restantes de la langue
    rest = [u for u in urls if norm(u) not in placed and path_of(u) != cfg['page']]
    rest = sorted(rest, key=lambda z: title_of(z).lower())
    s_url, s_lab = cfg['search']
    more = (f'<div class="pp-smg">{link(s_url, escape(s_lab))}<ul>'
            + ''.join(f'<li>{link(x, escape(title_of(x)))}</li>' for x in rest if norm(x) != norm(s_url)) + '</ul></div>')
    n = len(secs) + 1
    secs.append(('plan-autres', cfg['more'], f'<div class="pp-wrap">{G.head(f"{n:02d}", f"pp-hs{n}", cfg["more"], cfg["more_d"])}'
                 f'<div class="pp-smgrid pp-smgrid-wide">{more}</div></div>'))
    for x in rest:
        placed.add(norm(x))
    # autres langues
    ou, olab, olang = cfg['other']
    ar_attr = ' lang="ar" dir="rtl"'
    o_attr = f' lang="{olang}" hreflang="{olang}"'
    ar_h = ''.join(f'<li>{link(x, escape(title_of(x)), ar_attr)}</li>' for x in ar)
    n += 1
    secs.append(('plan-langues', cfg['lang'], f'<div class="pp-wrap">{G.head(f"{n:02d}", f"pp-hs{n}", cfg["lang"], cfg["lang_d"])}'
                 f'<div class="pp-smgrid"><div class="pp-smg">{link(ou, escape(olab), o_attr)}</div>'
                 f'<div class="pp-smg"><a href="/ar" lang="ar" dir="rtl" hreflang="ar">{escape(title_of("/ar"))}</a><p>{cfg["ar"]}</p><ul>{ar_h}</ul></div></div></div>'))
    missing = [u for u in urls if norm(u) not in placed and path_of(u) != cfg['page']]
    if missing:
        raise SystemExit(f'{cfg["page"]} : pages absentes du plan : {missing}')
    out = []
    for i, (sid, label, html) in enumerate(secs):
        cls = ' class="pp-mist"' if i % 2 else ''
        m = re.search(r'<h2 id="([^"]+)"', html)
        out.append(f'<section id="{sid}"{cls} aria-labelledby="{m.group(1)}">{html}</section>')
    sub = (f'<nav class="pp-sub" aria-label="{cfg["sub"]}"><div class="pp-wrap">'
           + ''.join(f'<a href="#{sid}">{escape(label)}</a>' for sid, label, _ in secs) + '</div></nav>')
    return sub, '\n\n'.join(out), len(urls)


def rebuild(lang):
    cfg = L[lang]
    path = cfg['page']
    if 'class="ppl"' in open(path, encoding='utf-8').read():
        return 'deja migre'
    res = G.rebuild(path, lang, 'lac-tchad-espace')
    h = open(path, encoding='utf-8').read()
    i0 = h.find('<main')
    hero_end = h.find('</header>', i0) + len('</header>')
    js = h.find(SUBNAV_JS, hero_end)
    assert i0 > 0 and hero_end > i0 and js > hero_end
    sub, secs, n = build_sections(lang)
    h = h[:hero_end] + '\n' + sub + '\n' + secs + '\n' + h[js:]
    h = re.sub(r'[ \t]+\n', '\n', h)
    open(path, 'w', encoding='utf-8').write(h)
    return f'{res} ; {n} pages de la langue au plan'


if __name__ == '__main__':
    for lang in ('fr', 'en'):
        print(L[lang]['page'], rebuild(lang))

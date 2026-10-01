# -*- coding: utf-8 -*-
"""Refonte premium (phase 5) : pages institutionnelles (Societe, Investisseurs, Carrieres), FR et EN.

Ces pages sont des textes longs, sans gabarit commun. Le generateur conserve tout leur
contenu (convertisseur « prose ») : chaque section garde ses paragraphes, listes,
citations, graphiques et liens ; seules les classes et les styles historiques sont
retires, et la structure est reconnue pour la mise en page premium :
  - les groupes (section.grp568) deviennent des chapitres, leurs sous-sections des blocs
    a deux colonnes (titre a gauche, texte a droite) ;
  - les conteneurs d elements comparables deviennent des grilles de cartes ;
  - les encadres (note) deviennent des notes a filet or ; les chiffres, des chiffres serif.
Heros photographique repris du heros de la page (fil d Ariane, sur-titre, titre, chapeau,
boutons, mentions). L en-tete, le pied de page, les metadonnees et les donnees
structurees restent inchanges ; la boite de recherche (#cmdk) est conservee.
Controle : le texte visible de la page doit etre conserve (au moins 97 %).
Idempotent : une page deja migree (class="ppl") est ignoree.
Usage : python3 scripts/gen_premium_institution.py
"""
import os
import re
import sys
from html import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_premium_pole as P  # noqa: E402
from gen_premium_pole import sp, inner, text, SUBNAV_JS, BeautifulSoup  # noqa: E402

PAGES = [
    ('societe.html', 'fr', 'dunes-sahara'), ('investisseurs.html', 'fr', 'flamme-gaz'), ('carrieres.html', 'fr', 'camion-route'),
    ('nos-activites.html', 'fr', 'complexe-industriel'), ('nos-activites-en.html', 'en', 'complexe-industriel'),
    ('carnets.html', 'fr', None), ('carnets-en.html', 'en', None),
    ('societe-en.html', 'en', 'dunes-sahara'), ('investisseurs-en.html', 'en', 'flamme-gaz'), ('carrieres-en.html', 'en', 'camion-route'),
]
ALT = {'dunes-sahara': ('Dunes du Sahara', 'Sahara dunes'), 'flamme-gaz': ('Flamme de gaz', 'Gas flame'),
       'camion-route': ('Camion sur une route du Sahel', 'Truck on a Sahel road'),
       'complexe-industriel': ('Complexe industriel de transformation', 'Industrial processing complex')}
ISLANDS = {'explorateur', 'explorer'}  # widgets interactifs gardes tels quels (classes, styles et scripts d origine)
KEEP = {'id', 'href', 'role', 'datetime', 'download', 'target', 'rel', 'title', 'lang', 'dir', 'colspan', 'rowspan',
        'scope', 'alt', 'src', 'srcset', 'sizes', 'width', 'height', 'loading', 'decoding', 'open', 'type', 'name', 'value',
        'for', 'placeholder', 'required', 'autocomplete', 'method', 'action', 'hidden', 'tabindex', 'cite'}
K_RX = re.compile(r'(^|-)(k|sk|kick|kicker|eyebrow)$')
BUILD = '202610012100'  # version propre ; les pages deja migrees gardent la leur
DROP = ('aurail', 'secrail')
DROP_TAIL = P.DROP_TAIL + ['// progress bar', 'id="minv-js"', '/*inv-toc*/', 'id="investor-light-runtime-loader"', 'id="idx563-js"']


def is_k(el):
    return any(K_RX.search(c) for c in (el.get('class') or []))


def is_empty(t):
    return not sp(t.get_text()) and t.find(['svg', 'img', 'input', 'select', 'textarea', 'iframe', 'canvas', 'video']) is None \
        and not t.get('id') and t.name not in ('br', 'hr', 'td', 'th', 'img', 'input')


def prose(nodes):
    """HTML conserve, nettoye et structure pour la feuille premium."""
    html = ''.join(str(n) for n in nodes)
    soup = BeautifulSoup(f'<div id="pp-root">{html}</div>', 'html.parser')
    root = soup.find(id='pp-root')
    for t in root.find_all(['style', 'script', 'link']):
        t.decompose()
    for t in root.find_all(True):
        if t.find_parent('svg') is not None or t.name == 'svg':
            continue
        cls = ' '.join(t.get('class') or [])
        role = ''
        if 'note' in cls.split() or re.search(r'(^|[ -])(note|callout|warn)\b', cls) or t.get('role') == 'note':
            role = 'pp-box'
        elif t.name == 'p' and re.search(r'\b(lead|intro)\b', cls):
            role = 'pp-lp'
        elif t.name == 'a' and re.search(r'\b(btn2?|cta|rublink|go|more)\b', cls):
            role = 'pp-link'
        elif is_k(t) and len(sp(t.get_text())) < 90:
            role = 'pp-k'
        t.attrs = {k: v for k, v in t.attrs.items() if k in KEEP or k.startswith('aria-') or k == 'onclick'
                   or (k.startswith('data-') and k not in ('data-eh', 'data-d'))}
        if role:
            t['class'] = [role]
    # titres internes : h2 -> h3 (le titre de section est porte par l en-tete)
    for h in root.find_all('h2'):
        h.name = 'h3'
    # pictos decoratifs (fleches, puces) caches aux lecteurs d ecran
    for t in list(root.find_all(attrs={'aria-hidden': 'true'})):
        if t.name != 'svg' and t.find_parent('svg') is None and t.find(True) is None and len(sp(t.get_text())) <= 3:
            t.decompose()
    # elements decoratifs vides
    for t in list(root.find_all(True)):
        if t.parent is not None and t.find_parent('svg') is None and t.name != 'svg' and is_empty(t):
            t.decompose()
    # carte entierement cliquable : <div><a>...</a></div> devient <a>...</a>
    for t in list(root.find_all('div')):
        kids = [c for c in t.children if getattr(c, 'name', None) or sp(str(c))]
        if len(kids) == 1 and getattr(kids[0], 'name', None) == 'a' and not t.get('id') \
                and len([x for x in kids[0].find_all(recursive=False) if x.name]) >= 2:
            t.replace_with(kids[0])
    # grilles d elements comparables (du plus profond au plus haut)
    for t in reversed(root.find_all(['div', 'ul', 'ol', 'dl'])):
        kids = [c for c in t.find_all(recursive=False) if c.name]
        if len(kids) < 2 or t.find_parent('svg') is not None or 'pp-box' in (t.get('class') or []):
            continue
        if all(c.name in ('div', 'li', 'span', 'article', 'a', 'figure') and len([x for x in c.find_all(recursive=False) if x.name]) >= 2
               for c in kids):
            t['class'] = (t.get('class') or []) + ['pp-grid']
            for c in kids:
                c['class'] = (c.get('class') or []) + ['pp-cell']
                first = next((x for x in c.find_all(recursive=False) if x.name), None)
                if first is not None and first.name in ('b', 'strong', 'span', 'div', 'time', 'i', 'em') and len(sp(first.get_text())) <= 40 \
                        and re.search(r'\d', first.get_text()) and first.name in ('b', 'strong'):
                    c['class'] = c['class'] + ['pp-fig']
    # rangees de liens simples : pastilles
    for t in root.find_all(['div', 'p', 'nav']):
        kids = [c for c in t.children if getattr(c, 'name', None) or sp(str(c))]
        if len(kids) >= 2 and all(getattr(c, 'name', None) == 'a' and c.find(True) is None for c in kids) \
                and 'pp-grid' not in (t.get('class') or []):
            t['class'] = (t.get('class') or []) + ['pp-chips']
    return root.decode_contents()


def head(k, hid, h2, lead=''):
    return (f'<div class="pp-head">' + (f'<p class="pp-k">{k}</p>' if k else '') + f'<h2 id="{hid}">{h2}</h2>'
            + (f'<p class="pp-lead">{lead}</p>' if lead else '') + '</div>')


def split_head(sec):
    """Separe sur-titre, titre et chapeau du reste du contenu d une section."""
    kids = [c for c in sec.children if getattr(c, 'name', None) or sp(str(c))]
    # descendre dans un enveloppeur unique (div.wrap, div sans titre)
    while len([c for c in kids if getattr(c, 'name', None)]) == 1 and kids[0].name in ('div',) and kids[0].find('h2') is not None \
            and not kids[0].get('id'):
        kids = [c for c in kids[0].children if getattr(c, 'name', None) or sp(str(c))]
    k = h2 = lead = None
    rest = []
    for c in kids:
        name = getattr(c, 'name', None)
        if h2 is None and name and is_k(c) and len(sp(c.get_text())) < 90:
            k = c; continue
        if h2 is None and name == 'h2':
            h2 = c; continue
        if h2 is None and name in ('div', 'header') and c.find('h2') is not None and len(sp(c.get_text())) < 700:
            # bloc d en-tete (svc-head, biz-head...)
            for x in c.find_all(True, recursive=False):
                if x.name == 'h2' and h2 is None:
                    h2 = x
                elif h2 is None and is_k(x):
                    k = x
                elif h2 is not None and x.name == 'p' and lead is None:
                    lead = x
                else:
                    rest.append(x)
            continue
        if h2 is not None and lead is None and name == 'p' and not rest and re.search(r'\b(lead|intro)\b', ' '.join(c.get('class') or [])):
            lead = c; continue
        rest.append(c)
    return k, h2, lead, rest


def block(sec, n):
    """Sous-section d un chapitre : titre a gauche, texte a droite."""
    k, h2, lead, rest = split_head(sec)
    if h2 is None:
        return f'<div class="pp-block pp-block-solo"{id_attr(sec)}><div class="pp-prose">{prose([sec])}</div></div>'
    nodes = ([lead] if lead is not None else []) + rest
    return (f'<div class="pp-block"{id_attr(sec)}><div class="pp-bh">' + (f'<p class="pp-k">{text(k)}</p>' if k is not None else '')
            + f'<h3>{inner(h2)}</h3></div><div class="pp-prose">{prose(nodes)}</div></div>')


def id_attr(el):
    return f' id="{escape(el["id"])}"' if el.get('id') else ''


def units(container):
    """Unites de contenu d un conteneur : sections, groupes, et sequences libres decoupees aux h2."""
    out, cur = [], None
    for c in container.children:
        name = getattr(c, 'name', None)
        if name is None:
            if sp(str(c)) and cur is not None:
                cur['nodes'].append(c)
            continue
        if name in ('style', 'script', 'link') or c.get('id') in DROP:
            continue
        cls = set(c.get('class') or [])
        if name == 'div' and 'wrap' in cls and not c.get('id'):
            out.extend(units(c)); cur = None; continue
        if name == 'section' or (name == 'div' and (c.get('id') or c.find('h2') is not None) and cur is None):
            out.append({'kind': 'grp' if 'grp568' in cls else 'sec', 'el': c}); cur = None; continue
        if name == 'h2':
            cur = {'kind': 'seq', 'h2': c, 'nodes': []}; out.append(cur); continue
        if cur is None:
            cur = {'kind': 'seq', 'h2': None, 'nodes': []}; out.append(cur)
        cur['nodes'].append(c)
    return out


def hero_html(hero, lang, img, crumb=None):
    li = 0 if lang == 'fr' else 1
    h1 = hero.find('h1')
    crumb = hero.select_one('nav') or crumb
    crumb_h = ''
    if crumb is not None:
        parts = []
        for x in crumb.find_all(['a', 'span'], recursive=False):
            if x.name == 'a':
                parts.append(f'<a href="{escape(x["href"])}">{inner(x)}</a>')
            elif x.get('aria-current'):
                parts.append(f'<span aria-current="page">{inner(x)}</span>')
        crumb_h = (f'<nav class="pp-crumb" aria-label="{"Fil d’Ariane" if lang == "fr" else "Breadcrumb"}">'
                   + '<span aria-hidden="true">›</span>'.join(parts) + '</nav>')
    kick = hero.select_one('.kick, [class*="kick"]') or next((x for x in hero.find_all(True) if is_k(x)), None)
    lead = hero.select_one('p.lead, p[class*="lead"]') or hero.find('p')
    btns = ''
    a = hero.select('.cta-row a, a.btn, a.btn2')
    seen = set()
    for i, x in enumerate(a):
        if id(x) in seen:
            continue
        seen.add(id(x))
        if not btns:
            btns += f'<a class="pp-btn pp-btn-light" href="{escape(x["href"])}">{escape(sp(x.get_text()).rstrip(" →↓").strip())}</a>'
        else:
            btns += f'<a class="pp-link pp-link-l" href="{escape(x["href"])}">{escape(sp(x.get_text()).rstrip(" →↓").strip())}</a>'
    trust = hero.select_one('.trust')
    trust_h = ''
    if trust is not None:
        trust_h = '<ul class="pp-trust">' + ''.join(f'<li>{escape(sp(s.get_text()).lstrip("○◆ ").strip())}</li>' for s in trust.find_all('span', recursive=False)) + '</ul>'
    figs = ''
    aside = hero.find('aside')
    if aside is not None:
        steps = [x for x in aside.find_all('div') if x.find('b', recursive=False) is not None and x.find('i', recursive=False) is not None]
        if steps:
            figs = '<div class="pp-figs">' + ''.join(f'<div><b>{inner(x.b)}</b><span>{inner(x.i)}</span></div>' for x in steps[:3]) + '</div>'
            hd = aside.find(class_=re.compile(r'-h$'))
            nt = aside.find(class_=re.compile(r'note'))
            figs = ((f'<p class="pp-k pp-figk">{text(hd)}</p>' if hd is not None else '') + figs
                    + (f'<p class="pp-fignote">{inner(nt)}</p>' if nt is not None else ''))
    himg = (f'<img class="pp-hero-img" src="/assets/img/p/{img}-1400.webp" srcset="/assets/img/p/{img}-800.webp 800w, '
            f'/assets/img/p/{img}-1400.webp 1400w" sizes="100vw" alt="{ALT[img][li]}" width="1400" height="934" fetchpriority="high" decoding="async">')
    return (f'<header class="pp-hero pp-hero-s" id="top-pole">{himg}<div class="pp-wrap">{crumb_h}'
            + (f'<p class="pp-k">{text(kick)}</p>' if kick is not None else '') + f'<h1>{inner(h1)}</h1>'
            + (f'<p class="pp-sublead">{inner(lead)}</p>' if lead is not None else '')
            + (f'<div class="pp-actions">{btns}</div>' if btns else '') + trust_h + figs + '</div></header>')


def build_inst(region, lang, img, keep_cmdk=True):
    """region : le HTML entre la navigation et le pied de page (heros + main)."""
    soup = BeautifulSoup(region, 'html.parser')
    hero = soup.select_one('div.hero')
    main = soup.find('main')
    journal = ''
    mast = main.select_one('.jn-mast')
    if mast is not None:
        # gabarit journal (Carnets) : la une, les rubriques et le fil restent tels quels, en tete de page
        jw = mast.find_parent('div', class_='wrap') or mast.parent
        journal = (f'<section id="journal" class="pp-journal" aria-label="{escape(sp(mast.get_text(" "))[:80])}">'
                   f'{str(jw)}</section>')
        jw.decompose()
        if hero is not None:
            hero.decompose()
        hero = None
    elif hero is None:
        hero = main.find(['header', 'div'], class_=re.compile('hero|mast')) or main
    for f in soup.find_all('footer'):
        f.decompose()
    crumb = soup.select_one('nav.bcrumb')
    hero_h = hero_html(hero, lang, img, crumb) if hero is not None else journal
    if crumb is not None:
        crumb.decompose()
    if hero is not None and hero.find_parent('main') is not None:
        hero.decompose()
    t = P.L[lang]

    # sommaire de page : nav du sommaire d origine (corp-nav, inv-toc)
    toc = []
    for n in soup.select('nav.corp-nav, nav#inv-toc, nav.toc'):
        for x in n.find_all('a'):
            if x.get('href', '').startswith('#') and (x['href'], ) not in [(h,) for h, _ in toc]:
                toc.append((x['href'], sp(x.get_text()).rstrip(' →')))
        n.decompose()
    for x in soup.select('#aurail, #secrail, #ckn, div.share'):
        x.decompose()
    for x in soup.find_all('script'):
        if 'ckn' in (x.string or ''):
            x.decompose()

    secs = []
    idx = 0
    for u in units(main):
        idx += 1
        hid = f'pp-h{idx}'
        if u['kind'] == 'grp':
            g = u['el']
            gh = g.select_one('.g568-h')
            gk = gh.select_one('[class*="k"]') if gh is not None else None
            gt = gh.find(['h2', 'h3']) if gh is not None else None
            blocks = ''.join(block(c, i) for i, c in enumerate(g.find_all(['section', 'div', 'aside'], recursive=False))
                             if 'g568-h' not in (c.get('class') or []))
            secs.append((g.get('id'), sp(gt.get_text()) if gt is not None else '',
                         f'<div class="pp-wrap">{head(text(gk) if gk is not None and gk is not gt else "", hid, inner(gt) if gt is not None else "")}'
                         f'<div class="pp-blocks">{blocks}</div></div>'))
        elif u['kind'] == 'sec' and u['el'].get('id') in ISLANDS:
            s = u['el']
            k, h2, lead, rest = split_head(s)
            raw = ''.join(str(x) for x in rest)
            secs.append((s.get('id'), sp(h2.get_text()) if h2 is not None else '',
                         f'<div class="pp-wrap">{head(text(k) if k is not None else "", hid, inner(h2) if h2 is not None else "", inner(lead) if lead is not None else "")}'
                         f'<div class="pp-island">{raw}</div></div>'))
        elif u['kind'] == 'sec':
            s = u['el']
            k, h2, lead, rest = split_head(s)
            if h2 is None:
                secs.append((s.get('id'), '', f'<div class="pp-wrap"><div class="pp-prose pp-prose-w">{prose(list(s.children))}</div></div>'))
                continue
            secs.append((s.get('id'), sp(h2.get_text()),
                         f'<div class="pp-wrap">{head(text(k) if k is not None else "", hid, inner(h2), inner(lead) if lead is not None else "")}'
                         f'<div class="pp-prose pp-prose-w">{prose(rest)}</div></div>'))
        else:
            h2 = u['h2']
            if h2 is None:
                secs.append((None, '', f'<div class="pp-wrap"><div class="pp-prose pp-prose-w">{prose(u["nodes"])}</div></div>'))
                continue
            nodes = u['nodes']
            lead = nodes[0] if nodes and getattr(nodes[0], 'name', None) == 'p' and 'lead' in (nodes[0].get('class') or []) else None
            if lead is not None:
                nodes = nodes[1:]
            secs.append((h2.get('id'), sp(h2.get_text()),
                         f'<div class="pp-wrap">{head("", hid, inner(h2), inner(lead) if lead is not None else "")}'
                         f'<div class="pp-prose pp-prose-w">{prose(nodes)}</div></div>'))

    out = []
    for i, (sid, label, html) in enumerate(secs):
        mist = ' class="pp-mist"' if i % 2 else ''
        sid_a = f' id="{escape(sid)}"' if sid else ''
        m = re.search(r'<h2 id="([^"]+)"', html)
        lab = f' aria-labelledby="{m.group(1)}"' if m else (' aria-label="' + escape(label) + '"' if label else '')
        out.append(f'<section{sid_a}{mist}{lab}>{html}</section>')
    if not toc:
        toc = [(f'#{sid}', lab) for sid, lab, _ in secs if sid and lab and len(lab) <= 40]
    subnav = ''
    if toc:
        subnav = f'<nav class="pp-sub" aria-label="{t["sub"]}"><div class="pp-wrap">' + ''.join(
            f'<a href="{escape(h)}">{escape(lb)}</a>' for h, lb in toc[:12]) + '</div></nav>'
    # identifiants : la section garde l identifiant, ses descendants le perdent
    html_out = '\n\n'.join(out)
    seen = set()
    def dedup(mm):
        i = mm.group(1)
        if i in seen:
            return ''
        seen.add(i)
        return mm.group(0)
    html_out = re.sub(r' id="([^"]+)"', dedup, html_out)
    out = [html_out]
    cmdk = soup.find(id='cmdk')
    keep = str(cmdk) if keep_cmdk and cmdk is not None and cmdk.find_parent('main') is None else ''
    return (keep + f'\n<main id="main-content" tabindex="-1" class="ppl">\n{hero_h}\n{subnav}\n' + '\n\n'.join(out)
            + f'\n{SUBNAV_JS}\n</main>')


def visible_text(html):
    s = BeautifulSoup(html, 'html.parser')
    for t in s.find_all(['script', 'style', 'svg', 'nav', 'footer']):
        t.decompose()
    for t in s.select('#aurail, #secrail, #cmdk, #ckn'):
        t.decompose()
    return re.sub(r'[\s→↓◆○·]+', ' ', s.get_text(' ')).strip()


def rebuild(path, lang, img):
    h = open(path, encoding='utf-8').read()
    if 'class="ppl"' in h:
        h2 = P.fix_skip(h)
        if h2 != h:
            open(path, 'w', encoding='utf-8').write(h2)
            return 'deja migre, mis a jour'
        return 'deja migre'
    head_, rest = h[:h.find('<body')], h[h.find('<body'):]

    # widget conserve tel quel : sa feuille de theme clair d origine reste liee
    hints = [h_ for h_, mark in (('.vcx', 'id="explor'), ('.jn-mast', 'class="jn-mast"')) if mark in rest]

    def css(mm):
        tag = mm.group(0)
        if any(k in tag for k in P.KEEP_CSS):
            return tag
        if hints:
            hm = re.search(r'href="/([^"?]+)', tag)
            if hm and os.path.exists(hm.group(1)):
                body = open(hm.group(1), encoding='utf-8', errors='ignore').read()
                if any(h_ in body for h_ in hints):
                    return tag
        return ''
    head_ = re.sub(r'<link\b[^>]*rel="stylesheet"[^>]*>\s*', css, head_)
    head_ = re.sub(r'<link\b[^>]*rel="preload"[^>]*as="image"[^>]*>\s*', '', head_)
    base = ''.join(f'<link rel="stylesheet" href="/assets/chrome/{b}.css">\n' for b in ('bundle_head_b2', 'bundle_core_a1') if b not in head_)
    if base:
        anchor = r'(<link\b[^>]*bundle_core_a1[^>]*>)' if 'bundle_core_a1' in head_ else r'(<link\b[^>]*nav_a\.css[^>]*>)'
        head_ = re.sub(anchor, lambda mm: base + mm.group(1), head_, count=1)
    head_ = head_.replace('<link rel="stylesheet" id="premium-chrome"',
                          '<link rel="preload" href="/assets/fonts/InstrumentSerif-latin.woff2" as="font" type="font/woff2" crossorigin>\n'
                          f'<link rel="stylesheet" id="pole-premium" href="/assets/chrome/pole-premium.css?b={BUILD}">\n'
                          '<link rel="stylesheet" id="premium-chrome"', 1)
    body_tag = re.match(r'<body[^>]*>', rest).group(0)
    skip = re.search(r'<a [^>]*href="#main-content"[^>]*>[^<]*</a>', rest).group(0)
    navm = re.search(r'<nav class="nav nx pn" id="nav"[\s\S]*?</nav>\s*(?=<script src="/assets/chrome/nav_a)', rest)
    nav = navm.group(0).rstrip()
    navjs = re.search(r'<script src="/assets/chrome/nav_a\.js[^>]*></script>', rest).group(0)
    footer = re.search(r'<footer class="pft">[\s\S]*?</footer>', rest).group(0)
    nav_end = rest.find(navjs) + len(navjs)
    main_end = rest.find('</main>') + len('</main>')
    region = rest[nav_end:main_end]
    # partie avant le menu (heros ou cmdk places avant la navigation)
    pre = rest[len(body_tag):navm.start()]
    pre_soup = BeautifulSoup(pre, 'html.parser')
    pre_keep = ''.join(str(x) for x in pre_soup.select('#cmdk, div.hero'))
    region = pre_keep + region
    tail = rest[max(rest.find('</footer>') + len('</footer>'), main_end):rest.rfind('</body>')]
    tail = re.sub(r'<script[^>]*>[\s\S]*?</script>',
                  lambda mm: '' if any(k in mm.group(0)[:400] for k in DROP_TAIL) else mm.group(0), tail)
    tail = re.sub(r'<link\b[^>]*rel="stylesheet"[^>]*>\s*', css, tail)
    tail = re.sub(r'<div class="(rootland|subland)"[^>]*></div>', '', tail)
    tail = re.sub(r'<button type="button" id="scrollcue"[\s\S]*?</button>', '', tail)
    tail = re.sub(r'\n{3,}', '\n\n', tail)
    main = build_inst(region, lang, img, keep_cmdk='id="cmdk"' not in tail)
    before, after = visible_text(region), visible_text(main)
    ratio = len(after) / max(1, len(before))
    out = (head_ + body_tag + '\n' + skip + '\n<div id="readbar" aria-hidden="true"></div>\n' + nav + '\n' + navjs + '\n'
           + main + '\n' + footer + tail + '\n</body>\n</html>\n')
    out = P.fix_skip(re.sub(r'\n{4,}', '\n\n\n', out))
    if ratio < 0.97:
        raise SystemExit(f'{path} : texte conserve a {ratio:.1%} seulement, page non ecrite')
    open(path, 'w', encoding='utf-8').write(out)
    return f'{len(out)} octets, texte conserve {ratio:.1%}'


if __name__ == '__main__':
    for p, lang, img in PAGES:
        print(p, rebuild(p, lang, img))

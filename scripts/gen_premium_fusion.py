# -*- coding: utf-8 -*-
"""Refonte premium (phase 9) : fusions de pages et redirections.

1. « Nos solutions par besoin » (/solutions, /solutions-en) rejoint « Nos activites » :
   les six besoins (et les entrees par profil et par partenariat) deviennent la section
   #besoins de /nos-activites (meme texte, blocs premium). /solutions -> /nos-activites#besoins.
2. L espace presse (/presse, /presse-en) rejoint les communiques : la page /communiques
   passe au gabarit premium et devient la salle de presse (registre des communiques, puis
   paragraphe a citer, kit, logo et couleurs, photos, contact presse : #presse).
   /presse -> /communiques#presse.
3. Liens internes (pages, index de recherche, palette de commandes, llms.txt) reecrits vers
   les nouvelles adresses ; plan du site sans les adresses redirigees ; redirections 308.
Les fichiers d origine restent dans le depot (inaccessibles : redirection forcee).
Controle : au moins 97 % du texte visible conserve pour chaque page reconstruite.
Usage : python3 scripts/gen_premium_fusion.py
"""
import glob
import os
import re
import sys
from html import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_premium_institution as G  # noqa: E402
from gen_premium_pole import sp, inner, text, BeautifulSoup  # noqa: E402

G.ALT.setdefault('village-sahel', ('Village du Sahel', 'Sahel village'))
MAP = {'solutions': ('nos-activites', 'besoins'), 'presse': ('communiques', 'presse')}
SUB = {'fr': 'Par besoin', 'en': 'By need'}
TITLE = {'fr': ('Communiqués officiels', 'Communiqués et espace presse'),
         'en': ('Official press releases', 'Press releases and press room')}


def soup_of(path):
    return BeautifulSoup(open(path, encoding='utf-8').read(), 'html.parser')


# ---------------------------------------------------------------- 1. solutions -> nos-activites
def merge_solutions(sfx, lang):
    na_path = f'nos-activites{sfx}.html'
    h = open(na_path, encoding='utf-8').read()
    if 'id="besoins"' in h:
        return 'deja fusionne'
    sol = soup_of(f'solutions{sfx}.html')
    m = sol.find('main')
    intro = m.find(id='intro')
    g = m.find(id='g568-ai')
    profils = m.find(id='profils')
    part = [s for s in m.find_all('section', recursive=False) if s.find('h2') is not None][-1]
    before = G.visible_text(str(intro) + str(g) + str(profils) + str(part))
    # cartes : etiquette sans numero ni pastille ; carte isolee -> lien dans le texte
    for ms in m.select('.mseg'):
        lab = sp(''.join(x for x in ms.contents if isinstance(x, str)))
        ms.clear()
        ms.append(lab)
    for pr in m.select('.profiles'):
        cards = pr.select('a.prof')
        if len(cards) == 1:
            c = cards[0]
            np_ = BeautifulSoup(f'<p><a href="{escape(c["href"])}">{inner(c.b)}</a> — {inner(c.p) if c.p else ""}</p>', 'html.parser')
            pr.replace_with(np_)
    # bandeau partenariats : remis en section simple (sur-titre, titre, texte, lien)
    pk = part.find('span')
    pa = part.find('a', href=True)
    part = BeautifulSoup(f'<section><div class="sk">{inner(pk)}</div><h2>{inner(part.h2)}</h2><p>{inner(part.p)}</p>'
                         f'<p><a href="{escape(pa["href"])}">{escape(ARROW_RX.sub("", sp(pa.get_text())))}</a></p></section>',
                         'html.parser').section
    # tete : sur-titre et titre du groupe, chapeau = le mode d emploi
    gh = g.select_one('.g568-h')
    gk, gt = gh.select_one('[class*="k"]'), gh.find(['h2', 'h3'])
    _, _, lead, rest = G.split_head(intro)
    lead_nodes = ([lead] if lead is not None else []) + rest
    lead_h = ' '.join(inner(x) for x in lead_nodes if getattr(x, 'name', None) == 'p')
    blocks = ''.join(G.block(c, i) for i, c in enumerate(g.find_all(['section', 'div', 'aside'], recursive=False))
                     if 'g568-h' not in (c.get('class') or []))
    blocks += G.block(profils, 90) + G.block(part, 91)
    sec = (f'<section id="besoins" aria-labelledby="pp-hb"><div class="pp-wrap">'
           f'{G.head(text(gk), "pp-hb", inner(gt), lead_h)}<div class="pp-blocks">{blocks}</div></div></section>')
    after = G.visible_text(sec)
    ratio = len(after) / max(1, len(before))
    if ratio < 0.97:
        raise SystemExit(f'{na_path} : texte des besoins conserve a {ratio:.1%} seulement')
    # insertion avant « Aller plus loin » (4e section), puis fonds alternes recalcules
    i0, i1 = h.find('<main'), h.find('</main>')
    main = h[i0:i1]
    tops, depth, pos = [], 0, 0
    for mm in re.finditer(r'<(/?)section\b', main):
        if mm.group(1):
            depth -= 1
        else:
            if depth == 0:
                tops.append(mm.start())
            depth += 1
    assert len(tops) >= 4
    main = main[:tops[3]] + sec + '\n\n' + main[tops[3]:]
    k = [0]

    def alt(mm):
        tag = mm.group(0)
        cm = re.search(r' class="([^"]*)"', tag)
        classes = [c for c in (cm.group(1).split() if cm else []) if c != 'pp-mist']
        if k[0] % 2 == 1:
            classes.append('pp-mist')
        k[0] += 1
        tag = re.sub(r' class="[^"]*"', '', tag)
        return tag[:-1] + (f' class="{" ".join(classes)}"' if classes else '') + '>'
    out, depth, last = [], 0, 0
    for mm in re.finditer(r'<(/?)section\b[^>]*>', main):
        out.append(main[last:mm.start()])
        if mm.group(1):
            depth -= 1
            out.append(mm.group(0))
        else:
            out.append(alt(mm) if depth == 0 else mm.group(0))
            depth += 1
        last = mm.end()
    out.append(main[last:])
    main = ''.join(out)
    # sous-navigation : entree « Par besoin »
    link = f'<a href="#besoins">{SUB[lang]}</a>'
    if 'class="pp-sub"' in main:
        main = re.sub(r'(<nav class="pp-sub"[^>]*><div class="pp-wrap">)', r'\1' + link, main, count=1)
    else:
        lab = 'Sections de la page' if lang == 'fr' else 'Page sections'
        main = main.replace('</header>', f'</header>\n<nav class="pp-sub" aria-label="{lab}"><div class="pp-wrap">{link}</div></nav>', 1)
    h = h[:i0] + main + h[i1:]
    open(na_path, 'w', encoding='utf-8').write(h)
    return f'section #besoins ajoutee, texte conserve {ratio:.1%}'


# ---------------------------------------------------------------- 2. presse -> communiques
SWATCH = '@@pp-swatches@@'
ARROW_RX = re.compile(r'\s*[→←]\s*$')


def merge_presse(sfx, lang):
    path = f'communiques{sfx}.html'
    h = open(path, encoding='utf-8').read()
    if 'class="ppl"' in h:
        return 'deja migre'
    pr = soup_of(f'presse{sfx}.html')
    pm = pr.find('main')
    i0, i1 = h.find('<main'), h.find('</main>') + len('</main>')
    s = BeautifulSoup(h[i0:i1], 'html.parser')
    main = s.find('main')
    w = main.select_one('div.wrap')
    kids = [c for c in w.find_all(recursive=False) if c.name != 'style']
    # registre : sur-titre, note, abonnement et communiques
    reg = s.new_tag('section', id='registre')
    for c in kids[:3]:
        reg.append(c.extract())
    reg_h = registre(kids[:3], lang)
    # le contact presse des communiques double celui de l espace presse : retire
    for c in kids[3:]:
        c.decompose()
    w.append(reg)
    # sections de l espace presse
    ids = ['presse', 'presse-kit', 'presse-logo', 'presse-photos', 'presse-contact']
    swatches = []
    for i, sec in enumerate(pm.find_all('section', recursive=False)):
        new = BeautifulSoup(str(sec), 'html.parser').section
        new.attrs = {'id': ids[i] if i < len(ids) else f'presse-{i}'}
        wrap = new.select_one('.pr-wrap')
        if wrap is not None:
            wrap.unwrap()
        row = new.select_one('.sw-row')
        if row is not None:
            for sw in row.select('.sw'):
                st = (sw.i or {}).get('style', '') if sw.i is not None else ''
                bg = re.search(r'background:([^;"]+)', st)
                swatches.append((bg.group(1).strip() if bg else '', inner(sw.b), inner(sw.span)))
            p = s.new_tag('p')
            p.string = SWATCH
            row.replace_with(p)
        w.append(new)
    h2 = h[:i0] + str(main) + h[i1:]
    # heros : le lien vers l espace presse pointe dans la page
    j0 = h2.find('class="hero"')
    j1 = h2.find('<main', j0)
    assert 0 < j0 < j1
    h2 = h2[:j0] + re.sub(r'href="/presse(-en)?"', 'href="#presse"', h2[j0:j1], count=1) + h2[j1:]
    old_t, new_t = TITLE[lang]
    h2 = re.sub(r'(<title>)' + re.escape(old_t), r'\g<1>' + new_t, h2, count=1)
    for prop in ('og:title', 'twitter:title'):
        h2 = re.sub(r'(<meta (?:property|name)="' + prop + r'" content=")' + re.escape(old_t), r'\g<1>' + new_t, h2, count=1)
    open(path, 'w', encoding='utf-8').write(h2)
    G.PRELOAD_HERO.add(path)  # LCP mobile mesure a 2,6 s sans prechargement de la photo
    res = G.rebuild(path, lang, 'village-sahel')
    out = open(path, encoding='utf-8').read()
    sw_h = '<ul class="pp-swatches">' + ''.join(
        f'<li><i aria-hidden="true" style="background:{escape(bg)}"></i><b>{b}</b><span>{t}</span></li>' for bg, b, t in swatches) + '</ul>'
    out = re.sub(r'<p>\s*' + re.escape(SWATCH) + r'\s*</p>', sw_h, out, count=1)
    assert SWATCH not in out
    # registre : rendu propre (liste datee) a la place de la conversion generique
    r0 = out.find('<section id="registre"')
    r1 = out.find('</section>', r0) + len('</section>')
    assert r0 > 0
    sec = out[r0:r1]
    while sec.count('<section') > sec.count('</section>'):
        r1 = out.find('</section>', r1) + len('</section>')
        sec = out[r0:r1]
    cls = re.search(r' class="([^"]*)"', sec[:200])
    reg_h = reg_h.replace('<section id="registre"', '<section id="registre"' + (f' class="{cls.group(1)}"' if cls else ''), 1)
    if G.visible_text(reg_h).__len__() < 0.97 * len(G.visible_text(sec)):
        raise SystemExit(f'{path} : registre incomplet')
    out = out[:r0] + reg_h + out[r1:]
    open(path, 'w', encoding='utf-8').write(out)
    return res


def registre(nodes, lang):
    """Registre des communiques : sur-titre, note, abonnement, puis une ligne par communique."""
    sk, note, lst = nodes
    abo = lst.select_one('.cp-abo')
    abo_h = ''
    if abo is not None:
        abo_h = (f'<p class="pp-rel-abo"><b>{inner(abo.b)}</b>'
                 + ''.join(f'<a href="{escape(a["href"])}">{inner(a)}</a>' for a in abo.find_all('a')) + '</p>')
    rows = ''
    for art in lst.select('article.cp'):
        meta = art.select_one('.cp-meta')
        links = ''.join(f'<a class="pp-link" href="{escape(a["href"])}">{escape(ARROW_RX.sub("", sp(a.get_text())))}</a>'
                        for a in art.select('.cp-links a'))
        paras = ''.join(f'<p>{inner(p)}</p>' for p in art.find_all('p', recursive=False))
        anchors = ''.join(f'<span id="{escape(x["id"])}"></span>' for x in art.find_all(id=True))
        rows += (f'<li id="{escape(art.get("id", ""))}"><div class="pp-rel-meta">{anchors}{str(meta.time)}<span>{inner(meta.select_one(".ref"))}</span></div>'
                 f'<div class="pp-rel-body"><h2>{inner(art.h2)}</h2>{paras}'
                 + (f'<div class="pp-rel-links">{links}</div>' if links else '') + '</div></li>')
    note_h = re.sub(r' style="[^"]*"', '', inner(note))
    return (f'<section id="registre" aria-label="{escape(sp(sk.get_text()))}"><div class="pp-wrap">'
            f'<p class="pp-k">{text(sk)}</p><p class="pp-note pp-rel-note">{note_h}</p>{abo_h}'
            f'<ol class="pp-releases">{rows}</ol></div></section>')


# ---------------------------------------------------------------- 3. liens, plan du site, redirections
URL_RX = re.compile(r'(?<![\w/.-])/(solutions|presse)(-en)?(#[\w-]+)?(?=["\')\s?<,\]])')
ABS_RX = re.compile(r'(https://enertchad\.netlify\.app)/(solutions|presse)(-en)?(?=[)"\s<])')
SKIP_ANCHOR = {'#intro', '#breadcrumb', '#webpage', '#ensemble'}


def new_url(page, en, anchor):
    dest, default = MAP[page]
    if not anchor or anchor in SKIP_ANCHOR:
        anchor = '#' + default
    return f'/{dest}{en or ""}{anchor}'


def rewrite(txt):
    txt = URL_RX.sub(lambda mm: new_url(mm.group(1), mm.group(2), mm.group(3)), txt)
    return ABS_RX.sub(lambda mm: f'{mm.group(1)}{new_url(mm.group(2), mm.group(3), None)}', txt)


def rewrite_links():
    files = [f for f in glob.glob('**/*.html', recursive=True) if not re.match(r'(solutions|presse)(-en)?\.html$', f)]
    files += ['assets/data/recherche-fr.json', 'assets/data/recherche-en.json', 'assets/chrome/cmdk_en.js',
              'assets/chrome/cmdk_extra.js', 'assets/chrome/ftx_fr.json', 'assets/chrome/ftx_en.json', 'llms.txt']
    n = 0
    changed = []
    for f in files:
        if not os.path.exists(f):
            continue
        t = open(f, encoding='utf-8').read()
        t2 = rewrite(t)
        if t2 != t:
            open(f, 'w', encoding='utf-8').write(t2)
            n += 1
            changed.append(f)
    return n


def sitemap():
    t = open('sitemap.xml', encoding='utf-8').read()
    t2 = re.sub(r'\s*<url>(?:(?!</url>)[\s\S])*?<loc>https://[^<]*/(?:solutions|presse)(?:-en)?</loc>[\s\S]*?</url>', '', t)
    # alternates eventuels d autres pages
    t2 = rewrite(t2)
    open('sitemap.xml', 'w', encoding='utf-8').write(t2)
    return t.count('<url>') - t2.count('<url>')


def redirects():
    t = open('_redirects', encoding='utf-8').read()
    lines = ['/solutions /nos-activites#besoins 308!', '/solutions-en /nos-activites-en#besoins 308!',
             '/presse /communiques#presse 308!', '/presse-en /communiques-en#presse 308!']
    add = [x for x in lines if x.split()[0] + ' ' not in t]
    if add:
        anchor = '/explorateur-chaine-en /nos-activites-en 308!\n'
        assert anchor in t
        t = t.replace(anchor, anchor + '\n'.join(add) + '\n', 1)
        open('_redirects', 'w', encoding='utf-8').write(t)
    return len(add)


if __name__ == '__main__':
    for sfx, lang in (('', 'fr'), ('-en', 'en')):
        print(f'nos-activites{sfx}', merge_solutions(sfx, lang))
        print(f'communiques{sfx}', merge_presse(sfx, lang))
    print('liens reecrits dans', rewrite_links(), 'fichier(s)')
    print('plan du site :', sitemap(), 'adresse(s) retiree(s)')
    print('redirections ajoutees :', redirects())

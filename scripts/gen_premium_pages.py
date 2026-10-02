# -*- coding: utf-8 -*-
"""Refonte premium (phase 12) : les pages courantes restantes (FR et EN).

Contact, Clients, FAQ, Projets, Publications, Cibles 2030, Gouvernance, Engagements,
Communautes, Ethique, Paiements aux Etats, Achats, Innovation, Brochure, Glossaire, pages
legales (mentions, confidentialite, cookies, accessibilite, avertissements) et recherche.
La charte graphique n est pas convertie : elle montre l ancien langage visuel (nuanciers,
grille, boutons dessines) et doit etre reecrite pour la refonte. Le corps est converti par scripts/gen_premium_institution.py (contenu conserve,
outils et formulaires gardes en ilots). Ce script prepare les gabarits que ce generateur ne
reconnait pas seul :
  - heros en <section class="hero"> ou <header class="hero"> -> <div class="hero"> ;
  - heros « dsh » (charte) ;
  - script du menu deplace juste apres le menu quand une page l a range plus loin ;
  - brochure : heros a diaporama -> heros fixe (message 1) et une section reprenant les
    autres messages, la chaine et les chiffres.
Heros photographique pour les pages de contenu ; heros sobre (bandeau nuit, sans photo) pour
les pages de reference et d information legale.
Usage : python3 scripts/gen_premium_pages.py
"""
import os
import re
import sys
from html import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_premium_institution as G  # noqa: E402
from gen_premium_pole import sp, inner, BeautifulSoup  # noqa: E402

G.ALT.update({'pompe-petrole': ('Pompe à balancier au couchant', 'Pumpjack at sunset'),
              'solaire-champ': ('Champ de panneaux solaires', 'Solar panel field'),
              'village-sahel': ('Village du Sahel', 'Sahel village')})
PHOTO = {'clients': 'pompe-petrole', 'contact': 'dunes-sahara', 'projets': 'chantier-ferraillage',
         'cibles-2030': 'lac-tchad-espace', 'engagements': 'solaire-champ', 'communautes': 'village-sahel',
         'achats': 'camion-route', 'innovation': 'code-numerique', 'brochure': 'complexe-industriel'}
PLAIN = ['faq', 'publications', 'gouvernance', 'ethique', 'paiements-etats', 'glossaire-petrolier',
         'mentions-legales', 'confidentialite', 'cookies', 'accessibilite', 'avertissements', 'recherche']
PLAIN_IMG = 'lac-tchad-espace'  # sert seulement au gabarit ; la photo est retiree ensuite


def pages():
    for base in list(PHOTO) + PLAIN:
        for sfx, lang in (('', 'fr'), ('-en', 'en')):
            p = base + sfx + '.html'
            if os.path.exists(p):
                yield p, base, lang


def close_of(h, start, tag):
    """Index juste apres la balise fermante correspondant a la balise ouvrante a `start`."""
    depth = 0
    for m in re.finditer(rf'<(/?){tag}\b[^>]*>', h[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return start + m.end()
    raise ValueError(tag)


def retag_hero(h):
    m = re.search(r'<(section|header)\b([^>]*\bclass="[^"]*\bhero\b[^"]*"[^>]*)>', h)
    if not m or 'pghero' in m.group(2):
        return h
    tag = m.group(1)
    end = close_of(h, m.start(), tag)
    inner_h = h[m.end():end - len(f'</{tag}>')]
    attrs = re.sub(r'\bclass="[^"]*"', 'class="hero"', m.group(2))
    return h[:m.start()] + f'<div{attrs}>' + inner_h + '</div>' + h[end:]


def fix_navjs(h):
    if re.search(r'<nav class="nav nx pn" id="nav"[\s\S]*?</nav>\s*<script src="/assets/chrome/nav_a', h):
        return h
    m = re.search(r'<script src="/assets/chrome/nav_a\.js[^>]*></script>', h)
    n = re.search(r'<nav class="nav nx pn" id="nav"', h)
    if not (m and n):
        return h
    tag = m.group(0)
    h = h[:m.start()] + h[m.end():]
    n = re.search(r'<nav class="nav nx pn" id="nav"', h)
    end = close_of(h, n.start(), 'nav')
    return h[:end] + '\n' + tag + h[end:]


def brochure(h, lang):
    m = re.search(r'<header class="hero"[^>]*>', h)
    if not m:
        return h
    end = close_of(h, m.start(), 'header')
    s = BeautifulSoup(h[m.start():end], 'html.parser')
    hero = s.header
    crumb = hero.select_one('nav.bcrumb')
    kick = hero.select_one('.hx-kick')
    slogan = hero.select_one('.hx-slogan')
    slides = hero.select('.hx-slide')
    first = slides[0]
    h1 = first.find('h1')
    sub = first.select_one('.hx-sub')
    dl = first.find('a', href=True)
    btns = ([dl] if dl else []) + [a for a in hero.select('a.btn') if a.get('href')]
    btn_h = ''.join(f'<a href="{escape(a["href"])}">{escape(sp(a.get_text()) or a.get("aria-label", ""))}</a>' for a in btns)
    stats = ''.join(f'<div class="pgh-kpi"><b>{inner(x.b)}</b><i>{inner(x.i)}</i></div>' for x in hero.select('.hx-stat'))
    hero_h = (f'<div class="hero"><div class="wrap">{str(crumb) if crumb else ""}<span class="kick">{inner(kick)}</span>'
              f'<h1>{inner(h1)}</h1><p class="lead">{inner(sub)}</p><div class="cta-row">{btn_h}</div>{stats}</div></div>')
    # messages 2 a n, chaine integree : premiere section du contenu
    cards = ''.join(f'<div class="card"><div class="t">{inner(x.select_one(".hx-h1"))}</div><div class="d">{inner(x.select_one(".hx-sub"))}</div></div>'
                    for x in slides[1:])
    chain = hero.select_one('.hchain')
    chain_h = ''
    if chain is not None:
        chain_h = ('<p>' + f'<b>{inner(chain.select_one(".hc-k"))}</b> : '
                   + ' → '.join(f'<a href="{escape(a["href"])}">{escape(sp(a.get_text()))}</a>' for a in chain.find_all('a'))
                   + (f' → {inner(chain.em)}' if chain.em else '') + '</p>')
    sec = (f'<section id="messages"><div class="sk">{inner(slogan)}</div><div class="grid">{cards}</div>{chain_h}</section>')
    h = h[:m.start()] + hero_h + h[end:]
    mm = re.search(r'<main\b[^>]*>', h)
    return h[:mm.end()] + sec + h[mm.end():]


def glossaire(h):
    """Recherche et filtres du glossaire : sortis du heros, places en tete de la liste (ilot)."""
    m = re.search(r'<section class="hero"[^>]*>', h)
    end = close_of(h, m.start(), 'section')
    hero = h[m.start():end]
    tools = re.search(r'<div class="tools">[\s\S]*?</div>\s*', hero)
    cm = re.search(r'<div\b[^>]*\bclass="cats"[^>]*>', hero)
    cats_end = close_of(hero, cm.start(), 'div')
    moved = tools.group(0) + hero[cm.start():cats_end]
    hero = hero[:tools.start()] + hero[tools.end():cm.start()] + hero[cats_end:]
    hero = hero.replace(tools.group(0), '')
    h = h[:m.start()] + hero + h[end:]
    end2 = m.start() + len(hero)
    nxt = re.search(r'<section\b[^>]*>', h[end2:])
    at = end2 + nxt.end()
    return h[:at] + moved + h[at:]


def head_links(h):
    """Feuilles du menu (nav_a.css, palette de commandes) rangees dans le corps avant le
    menu : remontees dans l en-tete, ou le generateur les conserve."""
    hb = h.find('<body')
    nav = h.find('<nav class="nav nx pn" id="nav"')
    if hb < 0 or nav < hb:
        return h
    seg = h[hb:nav]
    links = re.findall(r'<link\b[^>]*rel="stylesheet"[^>]*>\s*', seg)
    keep = [l for l in links if any(k in l for k in G.P.KEEP_CSS)]
    if not keep:
        return h
    for l in keep:
        seg = seg.replace(l, '', 1)
    h = h[:hb] + seg + h[nav:]
    return h.replace('</head>', ''.join(l.strip() + '\n' for l in keep) + '</head>', 1)


def contact(h):
    """Bloc contact (contact rapide, coordonnees, formulaire en trois etapes) : mis dans une
    section pour etre garde en ilot, avec son habillage et son script d origine."""
    m = re.search(r'<div class="layout"[^>]*>', h)
    if not m:
        return h
    end = close_of(h, m.start(), 'div')
    return h[:m.start()] + '<section id="ecrire">' + h[m.start():end] + '</section>' + h[end:]


COUNT_RX = re.compile(r'(<(\w+)\b[^>]*\bdata-count="([^"]*)"[^>]*>)\s*0\s*(</\2>)')


def counters(h):
    """Compteurs animes (data-count) : leur script n est pas repris ; la valeur finale est
    ecrite dans la page au lieu du « 0 » de depart."""
    def rep(m):
        tag = m.group(1)
        pre = re.search(r'data-prefix="([^"]*)"', tag)
        suf = re.search(r'data-suffix="([^"]*)"', tag)
        return tag + (pre.group(1) if pre else '') + m.group(3) + (suf.group(1) if suf else '') + m.group(4)
    return COUNT_RX.sub(rep, h)


def prepare(path, base, lang):
    h = open(path, encoding='utf-8').read()
    if 'class="ppl"' in h:
        return False
    h = counters(head_links(fix_navjs(h)))
    if base == 'brochure':
        h = brochure(h, lang)
    elif base == 'glossaire-petrolier':
        h = retag_hero(glossaire(h))
    elif base == 'contact':
        h = retag_hero(contact(h))
    elif base == 'charte':
        h = h.replace('class="dsh" role="region"', 'class="hero" role="region"', 1)
    else:
        h = retag_hero(h)
    open(path, 'w', encoding='utf-8').write(h)
    return True


def drop_legacy_js(path):
    """Script historique de barre de progression et de sommaire (#prog, .toc-in) : ses
    elements n existent plus dans la page premium (erreur console sinon)."""
    h = open(path, encoding='utf-8').read()
    h2 = re.sub(r'<script>(?:(?!</script>)[\s\S])*?getElementById\(\'prog\'\)[\s\S]*?</script>\n?', '', h)
    if h2 != h:
        open(path, 'w', encoding='utf-8').write(h2)


FLIP_RX = re.compile(r'<button aria-label="[^"]*" aria-pressed="false" type="button">((?:(?!</?button)[\s\S])*?)</button>')
CUE_RX = re.compile(r'<span>(?:Notre réponse|See our answer|Our answer)\s*⟶</span>')


def flip_static(path):
    """Cartes « enjeu / notre reponse » (Clients) : leur script de bascule n existe plus dans
    la page premium ; les deux faces sont affichees l une sous l autre, sans faux bouton."""
    h = open(path, encoding='utf-8').read()
    h2 = FLIP_RX.sub(lambda m: '<div class="pp-flip">' + CUE_RX.sub('', m.group(1)) + '</div>', h)
    if h2 != h:
        open(path, 'w', encoding='utf-8').write(h2)


def plain(path):
    h = open(path, encoding='utf-8').read()
    h = re.sub(r'<img class="pp-hero-img"[^>]*>', '', h, count=1)
    h = re.sub(r'<link rel="preload" as="image" href="/assets/img/p/[^"]*"[^>]*>\n?', '', h, count=1)
    h = h.replace('<header class="pp-hero pp-hero-s"', '<header class="pp-hero pp-hero-s pp-hero-plain"', 1)
    open(path, 'w', encoding='utf-8').write(h)


if __name__ == '__main__':
    for p, base, lang in pages():
        if not prepare(p, base, lang):
            print(p, 'deja migre')
            continue
        img = PHOTO.get(base, PLAIN_IMG)
        if base in PHOTO:
            G.PRELOAD_HERO.add(p)
        res = G.rebuild(p, lang, img)
        drop_legacy_js(p)
        if base == 'clients':
            flip_static(p)
        if base not in PHOTO:
            plain(p)
        print(p, res, '(heros sobre)' if base not in PHOTO else f'({img})')

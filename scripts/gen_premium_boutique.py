# -*- coding: utf-8 -*-
"""Refonte premium (phase 11) : boutique en ligne (aval/boutique, aval/boutique-en).

La boutique avait son propre gabarit (pas de <main>, heros, barre panier, catalogue rendu
par script, etapes, bandeau final). Le generateur la remet dans le gabarit premium :
  - heros photographique du pole Raffinage & distribution (fil d Ariane, sur-titre, titre,
    chapeau, avertissement « apercu », engagements, liens « etre prevenu ») ;
  - le catalogue et le panier restent un ilot (balisage, feuilles et script d origine,
    sprite d icones compris), dans une section #boutique ;
  - « Comment ca marche » converti en section premium ; un vrai <main> pour la page.
Les fenetres de devis (modales) et le script du catalogue restent en fin de page.
Usage : python3 scripts/gen_premium_boutique.py
"""
import os
import re
import sys
from html import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_premium_institution as G  # noqa: E402
from gen_premium_pole import sp, inner, BeautifulSoup  # noqa: E402

PAGES = [('aval/boutique.html', 'fr'), ('aval/boutique-en.html', 'en')]
G.ISLANDS.add('boutique')
G.PRELOAD_HERO.update(p for p, _ in PAGES)


def prepare(path, lang):
    h = open(path, encoding='utf-8').read()
    if 'class="ppl"' in h or re.search(r'<main\b[^>]*\bid="main-content"', h):
        return None
    navjs = re.search(r'<script src="/assets/chrome/nav_a\.js[^>]*></script>', h)
    foot = h.find('<footer class="pft">')
    assert navjs and foot > navjs.end()
    body0 = h.find('<body')
    pre, region = h[body0:navjs.end()], h[navjs.end():foot]
    s = BeautifulSoup(region, 'html.parser')
    ps = BeautifulSoup(pre, 'html.parser')
    sprite = ps.find('svg', recursive=True)
    hero = s.select_one('section.bhero')
    bbar = s.select_one('div.bbar519')
    crumb = bbar.select_one('nav.crumb') if bbar is not None else None
    tools = bbar.select_one('.btop-r') if bbar is not None else None
    shop = s.select_one('div.shop')
    steps = s.select_one('section.steps')
    # heros au format attendu par le generateur (div.hero)
    k = hero.select_one('.bk')
    h1 = hero.find('h1')
    lead = h1.find_next_sibling('p')
    note = hero.select_one('.bnote')
    trust = hero.select_one('.btrust')
    note_txt = ''
    btns = ''
    if note is not None:
        spans = note.find_all('span', recursive=False)
        txt = next((x for x in spans if x.get('aria-hidden') != 'true' and not x.find('a') and sp(x.get_text())), None)
        if txt is not None:
            note_txt = inner(txt)
        btns = ''.join(f'<a href="{escape(a["href"])}"' + (' rel="noopener" target="_blank"' if a.get('target') else '')
                       + f'>{escape(sp(a.get_text()).rstrip(" →").strip())}</a>' for a in note.find_all('a'))
    crumb_h = ''
    if crumb is not None:
        parts = []
        for x in crumb.find_all(['a', 'span'], recursive=False):
            if 'crumb-sep' in (x.get('class') or []):
                continue
            parts.append(f'<a href="{escape(x["href"])}">{inner(x)}</a>' if x.name == 'a' else f'<span aria-current="page">{inner(x)}</span>')
        crumb_h = '<nav class="bcrumb">' + ''.join(parts) + '</nav>'
    trust_h = ''
    if trust is not None:
        trust_h = '<div class="trust">' + ''.join(f'<span>{escape(sp(x.get_text()))}</span>' for x in trust.find_all('span', recursive=False)) + '</div>'
    hero_h = (f'<div class="hero"><div class="wrap">{crumb_h}<span class="kick">{inner(k)}</span><h1>{inner(h1)}</h1>'
              f'<p class="lead">{inner(lead)}</p>' + (f'<p class="pgc-def">{note_txt}</p>' if note_txt else '')
              + (f'<div class="cta-row">{btns}</div>' if btns else '') + trust_h + '</div></div>')
    # ilot boutique : sprite, barre panier, catalogue et commande
    label = 'Catalogue et commande' if lang == 'fr' else 'Catalogue and order'
    island = (f'<section id="boutique" aria-label="{label}">' + (str(sprite) if sprite is not None else '')
              + (str(tools) if tools is not None else '') + str(shop) + '</section>')
    if sprite is not None:
        pre = pre.replace(str(sprite), '', 1) if str(sprite) in pre else re.sub(r'<svg\b[\s\S]*?</svg>', '', pre, count=1)
    main = f'<main id="main-content">\n{island}\n{str(steps)}\n</main>\n'
    out = h[:body0] + pre + '\n' + hero_h + '\n' + main + h[foot:]
    open(path, 'w', encoding='utf-8').write(out)
    return True


def rebuild(path, lang):
    if prepare(path, lang) is None:
        return 'deja migre'
    return G.rebuild(path, lang, 'raffinerie-jour')


if __name__ == '__main__':
    for p, lang in PAGES:
        print(p, rebuild(p, lang))

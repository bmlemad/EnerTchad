# -*- coding: utf-8 -*-
"""Refonte premium (phase 13) : corrections de pages deja converties.

1. Restes de commentaires : quatre commentaires de l ancien code (« MINI-RAFFINERIE — foyer
   canonique », « EXPLORATEUR CHAINE DE VALEUR (page autonome) »...) etaient devenus du texte
   visible a la conversion (aval/produits, tchaditech/outils, FR et EN) ; ils sont retires.

2. Mise en page de « Produits raffines & derives » (aval/produits, FR et EN).

A la conversion (phase 7), toute la section #produits de l ancienne page etait devenue une
seule grille de cartes : sous-parties (le probleme, l opportunite, le bitume, le cout de la
vie, le gaz associe, acheter, le cadre reglementaire...) rangees en colonnes etroites, titres
qui debordent. Ce script la restructure, sans toucher au texte :
  - en-tete de section (sur-titre, titre, chapeau) puis la grille des six familles de produits ;
  - chaque sous-partie titree devient un bloc a deux colonnes (titre a gauche, texte a droite) ;
    une grille sans titre qui suit une tete seule (ou tete + chapeau) s y rattache ;
  - les grilles sans titre qui suivent un bloc complet deviennent des rangees pleine largeur ;
  - la partie « La mini-raffinerie », qui avait son propre titre de niveau 2, devient une section.
Controle : le texte visible de la section doit etre conserve a l identique (mots dans l ordre).
Idempotent (marqueur id="produits-blocs").
Usage : python3 scripts/fix_premium_pages.py
"""
import re
import sys

from bs4 import BeautifulSoup, Comment, NavigableString

PAGES = ['aval/produits.html', 'aval/produits-en.html']
REMNANTS = {
    'aval/produits.html': 'MINI-RAFFINERIE — foyer canonique (Raffinage &amp; distribution)',
    'aval/produits-en.html': 'MINI-RAFFINERIE — foyer canonique (Aval)',
    'tchaditech/outils.html': ('EXPLORATEUR CHAINE DE VALEUR (page autonome)', 'OUTILS DE RENDEZ-VOUS (pages autonomes)'),
    'tchaditech/outils-en.html': ('EXPLORATEUR CHAINE DE VALEUR (page autonome)', 'OUTILS DE RENDEZ-VOUS (pages autonomes)'),
}


def remnants(path):
    """Retire les commentaires devenus texte visible (texte seul entre deux balises)."""
    phrases = REMNANTS[path]
    if isinstance(phrases, str):
        phrases = (phrases,)
    h = open(path, encoding='utf-8').read()
    n = 0
    for ph in phrases:
        h, k = re.subn(r'>\s*' + re.escape(ph) + r'\s*<', '>\n<', h)
        n += k
    if n:
        open(path, 'w', encoding='utf-8').write(h)
    return n


def cls(t):
    return t.get('class') or [] if hasattr(t, 'get') else []


def kids(t):
    return [c for c in t.children if getattr(c, 'name', None)]


def words(t):
    if isinstance(t, NavigableString):
        return ' '.join(str(t).split())
    return ' '.join(' '.join(x for x in t.find_all(string=True) if not isinstance(x, Comment)).split())


def is_head(c):
    """Cellule qui porte un titre de sous-partie : sur-titre .pp-k ou <h3>, directement ou dans
    son premier <div> ; ou cellule qui commence par un titre en gras suivi de texte ; ou petit
    libelle seul en tete (« Segment specialise »)."""
    if c.name != 'div' or 'pp-grid' in cls(c):
        return False
    k = kids(c)
    if not k:
        return False
    if any(x.name == 'h3' or 'pp-k' in cls(x) for x in k[:2]):
        return True
    if k[0].name == 'span' and len(k) > 1 and k[1].name == 'div':
        return is_head(k[1])
    if k[0].name == 'strong' and len(k) == 1 and len(words(c)) > len(words(k[0])) + 40:
        return True
    if k[0].name == 'span' and not cls(k[0]) and 0 < len(words(k[0])) <= 40 and len(k) > 1 and k[1].name == 'p':
        return True
    return False


def head_container(c):
    k = kids(c)
    if k[0].name == 'span' and len(k) > 1 and k[1].name == 'div':
        return k[1]
    return c


def grid_head(c):
    """Grille-cellule dont le premier element est une tete : bloc (tete + suite)."""
    return 'pp-grid' in cls(c) and kids(c) and is_head(kids(c)[0])


def linearize(nodes):
    """Aplatit les grilles-cellules qui regroupent plusieurs sous-parties titrees."""
    out = []
    for c in nodes:
        if 'pp-grid' in cls(c) and 'pp-cell' in cls(c):
            k = kids(c)
            heads = [x for x in k if is_head(x) or grid_head(x)]
            if len(heads) >= 2:
                out.extend(linearize(k))
                continue
        out.append(c)
    return out


def split_head(cell, soup):
    """(sur-titre, titre h3, reste) d une cellule de tete."""
    box = head_container(cell)
    k = kids(box)
    kick = title = None
    rest = []
    if k and k[0].name == 'strong' and len(k) == 1:
        title = soup.new_tag('h3')
        title.string = words(k[0]).rstrip()
        txt = ''.join(str(x) for x in box.contents if x is not k[0] and not isinstance(x, Comment)).strip()
        p = BeautifulSoup('<p>' + txt + '</p>', 'html.parser').p
        return None, title, [p]
    for x in box.contents:
        if isinstance(x, Comment) or (isinstance(x, NavigableString) and not x.strip()):
            continue
        if kick is None and title is None and getattr(x, 'name', None) in ('span', 'div', 'p') and ('pp-k' in cls(x) or (x.name in ('span', 'div') and not cls(x) and not x.find(True) and 0 < len(words(x)) <= 40)):
            kick = x
            continue
        if title is None and getattr(x, 'name', None) == 'h3':
            title = x
            continue
        rest.append(x)
    return kick, title, rest


def bh(kick, title, soup):
    h = soup.new_tag('div', attrs={'class': 'pp-bh'})
    if kick is not None:
        p = soup.new_tag('p', attrs={'class': 'pp-k'})
        for x in list(kick.contents):
            p.append(x)
        h.append(p)
    if title is not None:
        h.append(title)
    return h


def as_body(x):
    """Element du corps d un bloc : grille-cellule -> grille ; encadre -> note."""
    if getattr(x, 'name', None) == 'div' and 'pp-grid' in cls(x) and 'pp-cell' in cls(x):
        x['class'] = [c for c in cls(x) if c != 'pp-cell']
    elif getattr(x, 'name', None) == 'div' and cls(x) == ['pp-cell']:
        x['class'] = ['pp-box']
    return x


def restructure(path):
    h = open(path, encoding='utf-8').read()
    if 'id="produits-blocs"' in h:
        return 'deja restructure'
    i0 = h.find('<section id="produits"')
    i1 = h.find('</section>', i0) + len('</section>')
    assert i0 > 0 and h.count('<section', i0, i1) == 1, path
    soup = BeautifulSoup(h[i0:i1], 'html.parser')
    sec = soup.select_one('#produits')
    prose = sec.select_one(':scope > .pp-wrap > .pp-prose')
    before = words(sec)
    parts = kids(prose)
    grid, lub, mini = parts[0], parts[1], parts[2]
    assert 'pp-grid' in cls(grid) and mini.find('h2') is not None, path
    wrap = soup.new_tag('div', attrs={'class': 'pp-wrap'})
    intro = []
    blocks = []  # (bloc, ouvert)
    items = linearize(kids(grid))
    # sous-partie Lubrifiants (grille tete + produits) et lien « Continuer »
    lgrid = lub.find('div', class_='pp-grid', recursive=False)
    items.append(lgrid)
    cont = [x for x in kids(lub) if x is not lgrid]
    head_done = False
    for it in items:
        if it.name == 'a' and 'pp-cell' in cls(it) and not head_done:
            del it['class']
            intro.append(('back', it))
            continue
        if not head_done and it.find('h2', recursive=False) is not None:
            k = kids(it)
            ph = soup.new_tag('div', attrs={'class': 'pp-head'})
            kick = soup.new_tag('p', attrs={'class': 'pp-k'})
            for x in list(k[0].contents):
                kick.append(x)
            h2 = k[1]
            h2['id'] = 'produits-t'
            lead = k[2]
            lead['class'] = ['pp-lead']
            ph.extend([kick, h2, lead])
            intro.append(('head', ph))
            head_done = True
            continue
        if not blocks and not is_head(it) and not grid_head(it):
            it['class'] = [c for c in cls(it) if c != 'pp-cell']
            intro.append(('grid', it))
            continue
        if is_head(it) or grid_head(it):
            if grid_head(it):
                k = kids(it)
                kick, title, rest = split_head(k[0], soup)
                rest = rest + [as_body(x) for x in k[1:]]
            else:
                kick, title, rest = split_head(it, soup)
            blk = soup.new_tag('div', attrs={'class': 'pp-block'})
            if it.get('id'):
                blk['id'] = it['id']
            elif kids(it) and kids(it)[0].get('id'):
                blk['id'] = kids(it)[0]['id']
            body = soup.new_tag('div', attrs={'class': 'pp-prose'})
            for x in rest:
                body.append(x)
            blk.append(bh(kick, title, soup))
            blk.append(body)
            # bloc « ouvert » : tete seule ou tete + chapeau ; la grille sans titre qui suit s y rattache
            opened = len(kids(body)) <= 1 and not any('pp-grid' in cls(x) for x in body.find_all('div'))
            blocks.append([blk, opened])
            continue
        # element sans titre : rattache au bloc ouvert, sinon rangee pleine largeur
        if blocks and blocks[-1][1]:
            blocks[-1][0].find('div', class_='pp-prose', recursive=False).append(as_body(it))
            if 'pp-grid' in cls(it):
                blocks[-1][1] = False
        else:
            blk = soup.new_tag('div', attrs={'class': 'pp-block pp-block-solo'})
            body = soup.new_tag('div', attrs={'class': 'pp-prose'})
            body.append(as_body(it))
            blk.append(body)
            blocks.append([blk, False])
    for kind, x in intro:
        if kind == 'back':
            p = soup.new_tag('p', attrs={'class': 'pp-back'})
            p.append(x)
            wrap.append(p)
        elif kind == 'grid':
            # les grilles de cartes sont mises en forme dans un bloc de texte
            pr0 = soup.new_tag('div', attrs={'class': 'pp-prose pp-prose-w'})
            pr0.append(x)
            wrap.append(pr0)
        else:
            wrap.append(x)
    bl = soup.new_tag('div', attrs={'class': 'pp-blocks', 'id': 'produits-blocs'})
    for b, _ in blocks:
        bl.append(b)
    wrap.append(bl)
    for x in cont:
        wrap.append(x)
    old = sec.select_one(':scope > .pp-wrap')
    old.replace_with(wrap)
    sec['aria-labelledby'] = 'produits-t'
    # La mini-raffinerie : section a part
    mk = kids(mini)
    ns = soup.new_tag('section', attrs={'id': 'mini-raffinerie-prod', 'aria-labelledby': 'mini-raffinerie-t'})
    w2 = soup.new_tag('div', attrs={'class': 'pp-wrap'})
    ph = soup.new_tag('div', attrs={'class': 'pp-head'})
    kick = soup.new_tag('p', attrs={'class': 'pp-k'})
    for x in list(mk[0].contents):
        kick.append(x)
    h2 = mk[1]
    h2['id'] = 'mini-raffinerie-t'
    lead = mk[2]
    lead['class'] = ['pp-lead']
    ph.extend([kick, h2, lead])
    pr = soup.new_tag('div', attrs={'class': 'pp-prose pp-prose-w'})
    for x in mk[3:]:
        pr.append(x)
    w2.extend([ph, pr])
    ns.append(w2)
    after = words(sec) + ' ' + words(ns)
    if after != before:
        a, b = before.split(), after.split()
        i = next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))
        raise SystemExit(f'{path} : texte modifie pres de « {" ".join(a[max(0, i - 5):i + 5])} » / « {" ".join(b[max(0, i - 5):i + 5])} »')
    out = h[:i0] + str(sec) + '\n\n' + str(ns) + h[i1:]
    out = re.sub(r'[ \t]+\n', '\n', out)
    out = re.sub(r'\n{4,}', '\n\n\n', out)
    open(path, 'w', encoding='utf-8').write(out)
    return f'{len(blocks)} blocs, texte identique'


if __name__ == '__main__':
    for p in REMNANTS:
        print(p, remnants(p), 'reste(s) de commentaire retire(s)')
    for p in PAGES:
        print(p, restructure(p))

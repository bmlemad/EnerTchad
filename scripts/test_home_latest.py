# -*- coding: utf-8 -*-
"""Lot 100 : la bande « Dernière publication » de l'accueil (FR et EN) montre bien la pièce datée la plus récente.
Après « npm run build » : recalcule, depuis les sources, la dernière date au jour parmi les communiqués
(communiques(-en).html) et les carnets (datePublished des journal-*.html), puis vérifie que out/index.html
et out/index-en.html portent une seule bande .hm-latest, placée après le héros, avec cette date, le lien
attendu et le titre attendu. Exit 1 au premier écart."""
import glob
import html as htmlmod
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors = []


def rd(rel):
    return open(os.path.join(ROOT, rel), encoding='utf-8').read()


def latest(lang):
    en = lang == 'en'
    items = []
    lst = rd('communiques-en.html' if en else 'communiques.html')
    for li in re.findall(r'<li id="cp-\d+">.*?</li>', lst, re.S):
        date = re.search(r'<time datetime="([^"]+)"', li).group(1)
        ref = re.search(r'<span>(CP-\d{4}-\d{3})</span>', li).group(1)
        title = re.sub(r'<[^>]+>', '', re.search(r'<h2>(.*?)</h2>', li, re.S).group(1)).strip()
        items.append((date, f'/communique/{ref.lower()}{"-en" if en else ""}', title))
    for p in glob.glob(os.path.join(ROOT, 'journal-*.html')):
        if p.endswith('-en.html') != en:
            continue
        t = open(p, encoding='utf-8').read()
        d = re.search(r'"datePublished":"(\d{4}-\d{2}-\d{2})"', t)
        h = re.search(r'"headline":"([^"]+)"', t)
        if d and h:
            items.append((d.group(1), '/' + os.path.basename(p)[:-5], h.group(1)))
    items.sort(key=lambda x: (x[0], x[1]))
    return items[-1]


for page, lang in (('index.html', 'fr'), ('index-en.html', 'en')):
    date, href, title = latest(lang)
    out = rd(os.path.join('out', page))
    n = out.count('class="hm-latest"')
    if n != 1:
        errors.append(f'{page} : {n} bande(s) .hm-latest (1 attendue)')
        continue
    hero = out.find('<header class="et-hero"')
    band = out.find('<aside class="hm-latest"')
    if hero < 0 or band < out.find('</header>', hero):
        errors.append(f'{page} : la bande n’est pas placée après le héros')
    a = re.search(r'<aside class="hm-latest".*?</aside>', out, re.S).group(0)
    if f'<time datetime="{date}">' not in a:
        errors.append(f'{page} : date {date} absente de la bande')
    if f'href="{href}"' not in a:
        errors.append(f'{page} : lien {href} absent de la bande')
    if htmlmod.escape(title, quote=False).replace('&#x27;', '’') not in htmlmod.unescape(a) and title not in htmlmod.unescape(a):
        errors.append(f'{page} : titre « {title} » absent de la bande')
    print(f'{page} : {date} · {href}')
for e in errors:
    print('KO', e)
print(f'{len(errors)} écart(s)')
sys.exit(1 if errors else 0)

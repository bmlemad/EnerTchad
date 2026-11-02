# -*- coding: utf-8 -*-
"""Lot 98 : les chiffres répétés d'une surface à l'autre restent égaux.
Contrôle sur les sources (pas besoin de out/) :
 - nombre de carnets (fichiers journal-*.html hors -en) = compteurs de Publications et de la FAQ (FR, EN) ;
   bandeau des Carnets = date du dernier carnet (datePublished) et nombre de carnets ;
 - CP-2026-007 : même nombre de carnets sur la page Communiqués et dans le flux RSS (FR, EN) ;
 - CSV ESG ouvert = tableau de /cibles-2030 (indicateur et cible 2030) ;
 - Data Book : taux d'utilisation de l'oléoduc égal à celui de /investisseurs, aucune « source a confirmer »,
   organisation « 4 segments + 4 capacités » ; fiche investisseur et point d'étape (docs-sources) alignés.
Exit 1 au premier groupe d'écarts."""
import glob
import html
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors = []


def rd(rel):
    return open(os.path.join(ROOT, rel), encoding='utf-8').read()


def text(fragment):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', fragment))).replace(' ', ' ').strip()


def check(cond, msg):
    if not cond:
        errors.append(msg)


# 1. carnets
journals = sorted(p for p in glob.glob(os.path.join(ROOT, 'journal-*.html')) if not p.endswith('-en.html'))
n = len(journals)
dates = []
for p in journals:
    m = re.search(r'"datePublished":"(\d{4}-\d{2}-\d{2})"', open(p, encoding='utf-8').read())
    check(m, f'{os.path.basename(p)} : datePublished absent')
    if m:
        dates.append(m.group(1))
last = max(dates)
y, mo, d = (int(x) for x in last.split('-'))
MOIS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
MOIS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
for rel, pat in (('publications.html', rf'<span>{n} articles</span><h3>Les Carnets</h3>'),
                 ('publications-en.html', rf'<span>{n} articles</span><h3>The Notebooks</h3>'),
                 ('faq.html', rf'Carnets</a>, {n} articles pédagogiques'),
                 ('faq-en.html', rf'Notebooks</a>, {n} educational articles'),
                 ('carnets.html', rf'<span>{d} {re.escape(MOIS_FR[mo - 1])} {y}</span><span>n° {n}</span>'),
                 ('carnets-en.html', rf'<span>{d} {MOIS_EN[mo - 1]} {y}</span><span>no\. {n}</span>')):
    check(re.search(pat, rd(rel)), f'{rel} : compteur ou bandeau des carnets différent de {n} carnets, dernier le {last}')

# 2. CP-2026-007 : page et flux
for page, feed, pat_page, pat_feed in (('communiques.html', 'feed.xml', r'Les (\d+) carnets sont accessibles', r'(\d+) carnets accessibles'),
                                       ('communiques-en.html', 'feed-en.xml', r'All (\d+) stories are freely available', r'(\d+) stories available')):
    a, b = re.search(pat_page, rd(page)), re.search(pat_feed, rd(feed))
    check(a and b and a.group(1) == b.group(1), f'{page} / {feed} : nombre de carnets du CP-2026-007 différent')

# 3. CSV ESG = tableau Cibles 2030
csv_rows = [line.split(';') for line in rd('assets/data/indicateurs-esg-2030.csv').lstrip('﻿').splitlines()[1:] if line.strip()]
page = rd('cibles-2030.html')
rows = re.findall(r'<tr><th scope="row">(.*?)</th><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td></tr>', page, re.S)
page_map = {text(r[0]): text(r[2]) for r in rows}
check(len(csv_rows) == len(rows) == 5, f'cibles-2030 : {len(rows)} lignes de tableau, {len(csv_rows)} lignes CSV (5 attendues)')
for r in csv_rows:
    ind, cible = text(r[0].replace("'", '’')), text(r[2])
    check(ind in page_map, f'CSV ESG : indicateur « {ind} » absent du tableau /cibles-2030')
    if ind in page_map:
        check(page_map[ind] == cible, f'CSV ESG : cible « {cible} » ≠ page « {page_map[ind]} » ({ind})')

# 4. Data Book, fiche, point d'étape
with zipfile.ZipFile(os.path.join(ROOT, 'Data_Book_EnerTchad.xlsx')) as z:
    # chaînes partagées ou en ligne (openpyxl écrit des inlineStr)
    strings = []
    for name in z.namelist():
        if name == 'xl/sharedStrings.xml' or name.startswith('xl/worksheets/sheet'):
            strings += [text(s) for s in re.findall(r'<t[^>]*>(.*?)</t>', z.read(name).decode('utf-8'), re.S)]
inv = text(rd('investisseurs.html'))
m = re.search(r'~(\d+) %taux d’utilisation du pipeline', inv) or re.search(r'~(\d+) % taux d’utilisation du pipeline', inv)
check(m, 'investisseurs.html : taux d’utilisation du pipeline introuvable')
if m:
    check(f'~{m.group(1)}' in strings, f'Data Book : taux d’utilisation de l’oléoduc différent de ~{m.group(1)} % (/investisseurs)')
check(not any('source a confirmer' in s or 'source à confirmer' in s for s in strings), 'Data Book : une ligne reste « source a confirmer »')
check(any('4 segments industriels + 4' in s for s in strings), 'Data Book : organisation 4 + 4 absente')
fiche = rd('docs-sources/fiche_investisseur.html')
check('8 pôles' not in fiche and '<b>4 + 4</b>' in fiche, 'fiche_investisseur.html : organisation ≠ 4 + 4')
pe = rd('docs-sources/point_etape_print.html')
check('nommément' not in pe and 'Gag Pinabei' in pe, 'point_etape_print.html : titulaires non nommés')
check(f'{n} carnets pédagogiques' in pe, f'point_etape_print.html : nombre de carnets ≠ {n}')

for e in errors:
    print('KO', e)
print(f'{n} carnets (dernier : {last}), {len(csv_rows)} indicateurs ESG, {len(strings)} chaînes du Data Book, {len(errors)} écart(s)')
sys.exit(1 if errors else 0)

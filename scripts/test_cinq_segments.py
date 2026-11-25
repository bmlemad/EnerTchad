# -*- coding: utf-8 -*-
"""Organisation en cinq segments (25 novembre 2026). Depuis les décisions du DG des 24 et 25 novembre (#300, #306),
EnerTchad compte cinq segments — Exploration & Production, Transport & Logistique, Raffinage & Distribution,
Pétrochimie, Ingénierie & Services — et trois fonctions techniques. L'inspection visuelle du 25 novembre a trouvé
des restes de l'ancienne organisation (« 4 segments », « Raffinage & pétrochimie » comme nom de segment) et un
compteur animé qui finissait sur 4 alors que le texte disait 5.

Échoue si une page, une donnée ou un index de recherche publié :
  1. nomme encore le segment « Raffinage & pétrochimie » / « Refining & Petrochemicals » ;
  2. annonce « 4 / quatre / four » segments ;
  3. porte un compteur data-count dont la valeur diffère du nombre affiché.
Exceptions : communiqués et articles datés (jamais réécrits), étiquettes de catégorie d'articles datés reprises
dans les listes, notes « formulation corrigée le 23 octobre 2026 », pages arabes (en attente de relecture native).
"""
import html, re, subprocess, sys

EXEMPT = re.compile(r'^(communique/|docs/|docs-sources/|carnets/|_subsites/|out/|node_modules/|scripts/|lib/|qa/|ar[-.])|journal-')
OLD_NAME = re.compile(r'(?i)Raffinage[\s ]*(?:&amp;|&)[\s ]*p[ée]trochimie|Refining[\s ]*(?:&amp;|&)[\s ]*petrochemicals')
# étiquette « date · catégorie » ou « rubrique · catégorie » d'un article daté, reprise telle quelle dans une liste
DATED_TAG = re.compile(r'(?:\d{4}|Industrie|Industry)[\s ]*·[\s ]*$|class="jn-kick">$')
FOUR = re.compile(r'(?i)(?<![\d.,])(?:4|quatre|four)(?:\s|&nbsp;|&#160;| |<[^>]+>)*(?:industrial\s+)?segments?\b')
FOUR_OK = re.compile(r'formulation corrigée le 23 octobre|wording corrected on 23 October|Cette doctrine oriente les quatre segments|This doctrine guides the four segments')

gaps, n = [], 0
files = subprocess.run(['git', 'ls-files', '*.html', '*.json', '*.js', '*.txt', '*.md'],
                       capture_output=True, text=True, check=True).stdout.split()
for f in files:
    if EXEMPT.search(f):
        continue
    s = open(f, encoding='utf-8', errors='ignore').read()
    n += 1
    for m in OLD_NAME.finditer(s):
        if DATED_TAG.search(s[max(0, m.start() - 30):m.start()]):
            continue
        gaps.append(f'{f}: « {m.group(0)} » — le segment s’appelle Raffinage & Distribution (/aval/) ou Pétrochimie (/petrochimie/)')
    for m in FOUR.finditer(s):
        if FOUR_OK.search(s[max(0, m.start() - 160):m.end() + 40]):
            continue
        gaps.append(f'{f}: « {re.sub(r"<[^>]+>", " ", m.group(0))} » — cinq segments depuis le 25 novembre 2026')
    for m in re.finditer(r'<(\w+)[^>]*\bdata-count="([^"]+)"[^>]*>(.*?)</\1>', s, re.S):
        txt = html.unescape(re.sub(r'<[^>]+>', '', m.group(3))).replace(' ', ' ').replace(' ', ' ')
        num = re.search(r'\d[\d ]*(?:[.,]\d+)?', txt)
        try:
            ok = num is not None and abs(float(num.group(0).replace(' ', '').replace(',', '.')) - float(m.group(2))) < 1e-9
        except ValueError:
            ok = False
        if not ok:
            gaps.append(f'{f}: compteur data-count="{m.group(2)}" mais texte « {txt.strip()[:40]} »')

print('\n'.join(gaps) or f'Cinq segments : OK ({n} fichiers lus)')
sys.exit(1 if gaps else 0)

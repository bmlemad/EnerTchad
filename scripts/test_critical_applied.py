# -*- coding: utf-8 -*-
"""Lot 85 : chaque jeu de CSS critique (scripts/critical/*.json listé dans CRITICAL_FILES) doit rester
appliqué à ses pages exportées. La garde de scripts/next/critical.mjs laisse une page intacte dès qu'une
feuille change d'empreinte (?v=) sans ré-extraction : la page redevient bloquante sans qu'aucun contrôle
ne le signale (constaté sur /boutique/clients après le lot 81, mesure du 1er novembre 2026).
Contrôle après « npm run build » : pour chaque jeu, chaque page listée porte un <style data-et-crit>,
chaque feuille du jeu a l'empreinte publiée (.generated/fingerprints.json), et la page existe dans out/."""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'scripts/next/critical.mjs'), encoding='utf-8').read()
files = re.findall(r"'(scripts/critical/[^']+\.json)'", src.split('CRITICAL_FILES')[1].split(';')[0])
fp = json.load(open(os.path.join(ROOT, '.generated/fingerprints.json'), encoding='utf-8'))
errors, pages = [], 0
for f in files:
    path = os.path.join(ROOT, f)
    if not os.path.exists(path):
        errors.append(f'{f} : fichier absent')
        continue
    s = json.load(open(path, encoding='utf-8'))
    for name, sheet in s['sheets'].items():
        if fp.get(name) != sheet['v']:
            errors.append(f'{f} : {name} extrait avec ?v={sheet["v"]}, feuille publiée ?v={fp.get(name)} — ré-extraire le jeu')
    for page in s['pages']:
        out = os.path.join(ROOT, 'out', page)
        if not os.path.exists(out):
            errors.append(f'{f} : page {page} absente de out/')
            continue
        pages += 1
        if 'data-et-crit' not in open(out, encoding='utf-8').read():
            errors.append(f'{f} : {page} sans CSS critique en ligne')
for e in errors:
    print('KO', e)
print(f'{len(files)} jeux, {pages} pages, {len(errors)} défaut(s)')
sys.exit(1 if errors or pages < 100 else 0)

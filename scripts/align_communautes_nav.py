#!/usr/bin/env python3
"""Communautés (FR, EN), 22 novembre 2026 : la grille « Parcourir cette page » répétait 5 des 6 entrées de la barre
« Dans cette page » (même défaut que sur Engagements). La grille part ; la barre gagne l'entrée manquante (#enjeux). Rejouable."""
import re
for f, label in [('communautes.html', 'Enjeux'), ('communautes-en.html', 'Stakes')]:
    s = open(f, encoding='utf-8').read(); o = s
    s = re.sub(r'<section class="pp-mist pp-compact"><div class="pp-wrap"><div class="pp-prose pp-prose-w"><p class="pp-k">(?:Parcourir cette page|Browse this page) · \d+ [^<]*</p>.*?</section>\n*', '', s, count=1, flags=re.S)
    if '<a href="#enjeux">' not in s.split('</nav>', 1)[0][-2000:]:
        s = s.replace('<div class="pp-wrap"><a href="#contenu-local">', f'<div class="pp-wrap"><a href="#enjeux">{label}</a><a href="#contenu-local">', 1)
    if s != o: open(f, 'w', encoding='utf-8').write(s)
    print(f, 'grille' if 'Parcourir cette page' in s or 'Browse this page' in s else 'sans grille', s.count('href="#enjeux"'))

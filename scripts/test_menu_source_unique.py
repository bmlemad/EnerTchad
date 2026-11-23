# -*- coding: utf-8 -*-
"""Menu à source unique (24 novembre 2026). Les entrées du menu principal sont écrites au build par
lib/main-nav.js à partir d'assets/data/navigation.json. Chaque page source ne garde qu'un emplacement vide
dans <nav id="nav"> : <div class="nav-item pn-item"></div>. Échoue si une page réintroduit des entrées
(ancien méga-menu recopié, ou relance de scripts/gen_premium_chrome.py), ce qui obligerait à nouveau à
modifier des centaines de pages pour changer le menu."""
import re, subprocess, sys
SLOT = '<div class="nav-item pn-item"></div>'
gaps = []; n = 0
for f in subprocess.run(['git', 'ls-files', '*.html'], capture_output=True, text=True, check=True).stdout.split():
    h = open(f, encoding='utf-8').read()
    m = re.search(r'<nav\b[^>]*\bid="nav"[^>]*>', h)
    if not m: continue
    nav = h[m.start():h.find('</nav>', m.start())]
    n += 1
    k = nav.count('<div class="nav-item pn-item">')
    if k == 0: gaps.append(f'{f}: emplacement du menu absent'); continue
    if k > 1 or SLOT not in nav: gaps.append(f'{f}: entrées de menu dans la page ({k}) — le menu vient de assets/data/navigation.json')
print('\n'.join(gaps) or f'Menu à source unique : OK ({n} pages)')
sys.exit(1 if gaps else 0)

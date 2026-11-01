# -*- coding: utf-8 -*-
"""Lot 90, étape 1 : le verre unique du chrome est en ligne, en tête, sur chaque page exportée qui porte
une des surfaces concernées (en-tête #nav, en-tête arabe .arh, en-tête Espace clients, barre mobile #nezBar,
sous-navigation .pp-sub). Contrôle après « npm run build » :
 - assets/chrome/verre-2026.css commence par la déclaration de couche « @layer et-verre; » (l'ordre des
   couches fait l'effet, pas la spécificité) et ne contient qu'une couche ;
 - chaque page concernée de out/ a <style data-et-verre> comme PREMIER enfant de <head>, une seule fois,
   avec les huit sélecteurs de chrome et les trois jetons ;
 - aucune page sans surface ne le porte.
Les styles calculés (teinte 80 %, flou 16/10 px, replis) sont vérifiés dans le navigateur par
qa/glass-chrome-contract.spec.js. Exit 1 au premier défaut."""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'assets/chrome/verre-2026.css'), encoding='utf-8').read()
body = re.sub(r'/\*[\s\S]*?\*/', '', src).strip()
errors = []
if not body.startswith('@layer et-verre;'):
    errors.append('verre-2026.css : doit commencer par « @layer et-verre; »')
if body.count('@layer') != 2:
    errors.append('verre-2026.css : une déclaration et un bloc @layer attendus')
SURFACE = re.compile(r'<nav\b[^>]*\bid="nav"|<header class="arh|<nav\b[^>]*\bet-space-header\b|id="nezBar"|<nav\b[^>]*\bpp-sub\b')
NEEDED = ['#nav.nx', '#nav.nx .nx-util', '#nav.nx.scrolled', '#nav.nx .pn-mega', 'nav.pp-sub', 'header.arh', 'nav.et-space-header', '#nezBar',
          '--et-verre:', '--et-verre-plein:', '--et-verre-menu:', '--et-verre-filet:', 'prefers-reduced-transparency', '@supports not', 'max-width:760px']
with_glass, without = 0, 0
for dirpath, dirs, files in os.walk(os.path.join(ROOT, 'out')):
    dirs[:] = [d for d in dirs if d != '_next']
    for name in files:
        if not name.endswith('.html'):
            continue
        rel = os.path.relpath(os.path.join(dirpath, name), ROOT)
        html = open(os.path.join(dirpath, name), encoding='utf-8').read()
        n = html.count('data-et-verre')
        if SURFACE.search(html):
            if n != 1:
                errors.append(f'{rel} : <style data-et-verre> présent {n} fois (1 attendu)')
                continue
            m = re.search(r'(?:<head>|<html\b[^>]*>)\s*<style data-et-verre>(.*?)</style>', html, re.S)
            if not m:
                errors.append(f'{rel} : le style du verre n’est pas le premier enfant de <head>')
                continue
            css = m.group(1)
            missing = [k for k in NEEDED if k not in css]
            if missing or not css.startswith('@layer et-verre;'):
                errors.append(f'{rel} : style du verre incomplet ({", ".join(missing) or "couche absente"})')
            with_glass += 1
        else:
            if n:
                errors.append(f'{rel} : style du verre sur une page sans surface de chrome')
            without += 1
if with_glass < 200:
    errors.append(f'{with_glass} pages avec le verre, au moins 200 attendues (export incomplet ?)')
for e in errors:
    print('KO', e)
print(f'{with_glass} pages avec le verre en tête, {without} pages sans surface de chrome, {len(errors)} défaut(s)')
sys.exit(1 if errors else 0)

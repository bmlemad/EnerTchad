"""Lot 103 (2 novembre 2026) : les vecteurs du bouton « Haut de page » (#toTop) sont décoratifs — le bouton porte
l'aria-label — et doivent tous être masqués (aria-hidden="true"), sur chaque page exportée. Contrôle après
« npm run build » de la règle decorativeIcons (scripts/next/critical.mjs). Usage : python3 scripts/test_decorative_icons.py"""
import pathlib
import re
import sys

failures, pages = [], 0
for path in sorted(pathlib.Path('out').rglob('*.html')):
    text = path.read_text(encoding='utf-8', errors='replace')
    m = re.search(r'<button\b[^>]*\bid="toTop"[^>]*>([\s\S]*?)</button>', text)
    if not m:
        continue
    pages += 1
    for svg in re.findall(r'<svg\b[^>]*>', m.group(1)):
        if 'aria-hidden="true"' not in svg:
            failures.append(f'{path} : {svg[:80]}')
print(f'{pages} page(s) avec le bouton « Haut de page », {len(failures)} vecteur(s) exposé(s)')
for f in failures[:20]:
    print(' ', f)
sys.exit(1 if failures else 0)

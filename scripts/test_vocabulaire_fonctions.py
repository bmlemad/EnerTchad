# -*- coding: utf-8 -*-
"""Vocabulaire (PR #276, #278, #279) : les quatre fonctions de soutien s'appellent
« fonctions techniques » / « technical functions ». Échoue si l'ancien terme
(« capacités intégrées / transversales », « integrated / built-in / cross-functional
capabilities ») revient dans une page, une donnée ou un générateur.

Exceptions voulues, parce que le texte est publié et daté :
- les communiqués (communique/*) et leurs reprises (presse, ar-presse, flux RSS),
  sauf la phrase-type « À propos » de communiques(-en).html #presse, contrôlée ;
- les carnets et les articles du journal, datés ;
- les sources des PDF (docs-sources/), à régénérer avec les PDF ;
- les scripts de migration historiques (align_*.py) et la documentation (docs/).
"""
import re, subprocess, sys

OLD = re.compile(r'capacit[ée]s?\s+(?:sont\s+)?int[ée]gr[ée]es?|capacit[ée]s? transversales?|'
                 r'(?:integrated|built-in|cross-functional) capabilit(?:y|ies)', re.I)
EXEMPT = re.compile(r'^(communique/|presse(-en)?\.html$|ar-presse\.html$|feed(-en)?\.xml$|'
                    r'carnets(-en)?\.html$|journal-[^/]*\.html$|docs-sources/|docs/|'
                    r'scripts/align_[^/]*\.py$|scripts/test_vocabulaire_fonctions\.py$|'
                    r'scripts/test_capability_labels\.py$|scripts/next/critical\.mjs$|out/)')
PRESSE = ('communiques.html', 'communiques-en.html')

files = subprocess.run(['git', 'ls-files', '*.html', '*.json', '*.xml', '*.js', '*.mjs', '*.py', '*.md'],
                       capture_output=True, text=True, check=True).stdout.split()
gaps = []
for f in files:
    base = 0
    if f in PRESSE:
        s = open(f, encoding='utf-8').read()
        i = s.find('id="presse"')
        if i < 0:
            gaps.append(f'{f}: section #presse introuvable')
            continue
        base = s.count('\n', 0, i)
        s = s[i:s.find('</section>', i)]
    elif EXEMPT.match(f) or f.startswith('node_modules/'):
        continue
    else:
        try:
            s = open(f, encoding='utf-8').read()
        except (UnicodeDecodeError, FileNotFoundError):
            continue
    for m in OLD.finditer(s):
        line = base + s.count('\n', 0, m.start()) + 1
        gaps.append(f'{f}:{line}: « {m.group(0)} » → « fonctions techniques » / « technical functions »')

# 24 novembre 2026 : le kit presse (zip) reprend la phrase-type, la fiche presse et les brochures ; ses textes sont contrôlés aussi.
import zipfile
with zipfile.ZipFile('kit-presse-enertchad.zip') as kit:
    for name in kit.namelist():
        if name.endswith(('.txt', '.md')):
            for m in OLD.finditer(kit.read(name).decode('utf-8')):
                gaps.append(f'kit-presse-enertchad.zip:{name}: « {m.group(0)} »')

print('\n'.join(gaps) or f'Vocabulaire « fonctions techniques » : OK ({len(files)} fichiers lus)')
sys.exit(1 if gaps else 0)

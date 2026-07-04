# -*- coding: utf-8 -*-
"""Contrôle d'intégrité du site publié (exécuté par GitHub Actions)."""
import re, glob, os, json, sys
pages = sorted(glob.glob('*.html')) + sorted(glob.glob('*/*.html'))
allf = set()
for r, d, fs in os.walk('.'):
    if '.git' in r: continue
    for f in fs: allf.add(os.path.normpath(os.path.join(r, f)).replace('\\', '/'))
def exists(t): return t in allf or (t.rstrip('/') + '/index.html') in allf or (t + '.html') in allf
errs = []
sm = open('sitemap.xml', encoding='utf-8').read() if os.path.exists('sitemap.xml') else ''
for p in pages:
    h = open(p, encoding='utf-8').read()
    for m in re.finditer(r'(?:href|src)="([^"#?{$]+?)(?:[#?][^"]*)?"', h):
        u = m.group(1)
        if u.startswith(('http', 'mailto', 'tel', '//', 'data:', 'javascript:')) or "'" in u: continue
        t = u.lstrip('/') if u.startswith('/') else os.path.normpath(os.path.join(os.path.dirname(p), u)).replace('\\', '/')
        if t in ('', '.') or t.startswith('photos/'): continue
        if not exists(t): errs.append(f'{p}: lien cassé {u}')
    ids = re.findall(r'\sid="([^"]+)"', h)
    for i in set(x for x in ids if ids.count(x) > 1): errs.append(f'{p}: id dupliqué {i}')
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
        try: json.loads(m.group(1))
        except Exception as e: errs.append(f'{p}: JSON-LD invalide ({e})')
if errs:
    print('\n'.join(errs[:50])); print(f'\nECHEC : {len(errs)} probleme(s)'); sys.exit(1)
print(f'OK : {len(pages)} pages, 0 probleme')

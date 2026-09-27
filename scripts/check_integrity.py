# -*- coding: utf-8 -*-
"""Contrôle d'intégrité du site publié (exécuté par GitHub Actions)."""
import re, glob, os, json, sys
pages = sorted(glob.glob('**/*.html', recursive=True))
# Fichiers techniques/non-SEO exclus du contrôle éditorial.
EXCLUDED = {'404.html', 'google9146d41010c5e702.html'}
pages = [p for p in pages if p not in EXCLUDED and not p.startswith('docs-sources/')]
allf = set()
for r, d, fs in os.walk('.'):
    if '.git' in r: continue
    for f in fs: allf.add(os.path.normpath(os.path.join(r, f)).replace('\\', '/'))
# Ch628 : les redirections et reecritures de vercel.json sont des destinations valides (cleanUrls : /x et /x.html)
redir = set()
if os.path.exists('vercel.json'):
    vj = json.load(open('vercel.json', encoding='utf-8'))
    for r in vj.get('redirects', []) + vj.get('rewrites', []):
        src = r.get('source', '')
        if src and not re.search(r'[:*(]', src): redir.add(src.lstrip('/'))
def exists(t): return t in allf or (t.rstrip('/') + '/index.html') in allf or (t + '.html') in allf or t in redir or (t + '.html') in redir
errs = []
sm = open('sitemap.xml', encoding='utf-8').read() if os.path.exists('sitemap.xml') else ''
for p in pages:
    h = open(p, encoding='utf-8').read()
    for m in re.finditer(r'(?:href|src)="([^"#?{$]+?)(?:[#?][^"]*)?"', h):
        u = m.group(1)
        if u.startswith(('http', 'mailto', 'tel', 'webcal:', '//', 'data:', 'javascript:', '/_vercel/')) or "'" in u: continue
        t = u.lstrip('/') if u.startswith('/') else os.path.normpath(os.path.join(os.path.dirname(p), u)).replace('\\', '/')
        if t in ('', '.') or t.startswith('photos/'): continue
        if not exists(t): errs.append(f'{p}: lien cassé {u}')
    ids = re.findall(r'\sid="([^"]+)"', h)
    for i in set(x for x in ids if ids.count(x) > 1): errs.append(f'{p}: id dupliqué {i}')
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
        try: json.loads(m.group(1))
        except Exception as e: errs.append(f'{p}: JSON-LD invalide ({e})')
for p in pages:
    h = open(p, encoding='utf-8').read()
    if not re.search(r'<html\b[^>]*\blang=["\'][^"\']+["\']', h, re.I):
        errs.append(f'{p}: attribut lang absent')
    if not re.search(r'<title\b[^>]*>\s*[^<]+\s*</title>', h, re.I | re.S):
        errs.append(f'{p}: title absent ou vide')
    if not re.search(r'<meta\b[^>]*name=["\']description["\'][^>]*content=["\'][^"\']+["\']', h, re.I):
        errs.append(f'{p}: meta description absente ou vide')
    if not re.search(r'<link\b[^>]*rel=["\'][^"\']*canonical[^"\']*["\'][^>]*href=["\'][^"\']+["\']', h, re.I):
        errs.append(f'{p}: canonical absent')
    if p in ('index.html', 'index-en.html', 'ar.html'):
        if re.search(r'<style\b', h, re.I):
            errs.append(f'{p}: style inline restant sur une page d\'entrée')
        if not re.search(r'<link\b[^>]*href=["\'][^"\']*home-inline-', h, re.I):
            errs.append(f'{p}: feuille CSS homepage externalisée absente')
        if not re.search(r'<h1\b', h, re.I):
            errs.append(f'{p}: H1 absent')

# QA structurelle du sitemap et des ressources responsive.
if sm:
    urls = re.findall(r'<loc>(.*?)</loc>', sm, re.S | re.I)
    if len(urls) != len(set(urls)):
        errs.append('sitemap.xml: URLs dupliquées')
    if not urls:
        errs.append('sitemap.xml: aucune URL')
for p in pages:
    h = open(p, encoding='utf-8').read()
    for m in re.finditer(r'\bsrcset=["\\\']([^"\\\']+)["\\\']', h, re.I):
        for candidate in re.findall(r'(?:^|,)\\s*([^,\\s]+)', m.group(1)):
            u = candidate.strip()
            if u.startswith(('http', '//', 'data:', 'blob:')): continue
            t = u.lstrip('/') if u.startswith('/') else os.path.normpath(os.path.join(os.path.dirname(p), u)).replace('\\', '/')
            if t and not exists(t):
                errs.append(f'{p}: srcset cassé {u}')

# Contrôles structurels supplémentaires : erreurs HTML introduites par des injections/transformations.
for p in pages:
    h = open(p, encoding='utf-8').read()
    if re.search(r'</a>\\s+class="[^"]+">', h, re.I):
        errs.append(f'{p}: attribut class orphelin après une balise </a>')

# Vérification finale après toutes les règles QA.
if errs:
    print('\n'.join(errs[:80])); print(f'\nECHEC : {len(errs)} probleme(s)'); sys.exit(1)
print(f'OK : {len(pages)} pages, 0 probleme')

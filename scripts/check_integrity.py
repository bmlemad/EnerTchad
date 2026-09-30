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
def exists(t):
    # Supports clean URLs, explicit .html files, directory indexes and Vercel rewrites.
    candidates = {t, t.rstrip('/') + '/index.html', t + '.html'}
    if t.endswith('/index'): candidates.add(t[:-6] + '/index.html')
    if t.endswith('/'): candidates.add(t + 'index.html')
    return any(x in allf for x in candidates) or t in redir or (t + '.html') in redir
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

# Cohérence des cibles hreflang : les URLs déclarées doivent correspondre à
# une route/fichier réellement présent. Les variantes manquantes restent
# autorisées, mais une cible explicitement déclarée ne peut pas être morte.
for p in pages:
    h = open(p, encoding='utf-8').read()
    for m in re.finditer(r"""<link\b[^>]*rel=['"]alternate['"][^>]*hreflang=['"]([^'"]+)['"][^>]*href=['"]([^'"]+)['"]""", h, re.I):
        href = m.group(2)
        if not href.startswith(('http://', 'https://')): continue
        path = re.sub(r'^https?://[^/]+', '', href) or '/'
        path = path.split('#', 1)[0].split('?', 1)[0]
        route = path.lstrip('/') or 'index.html'
        if route == 'index': route = 'index.html'
        if not exists(route):
            errs.append(f'{p}: cible hreflang introuvable {href}')


# Cohérence du domaine public : signaler un éventuel conflit CNAME/SEO sans imposer
# automatiquement une migration de domaine.
if os.path.exists('CNAME') and sm:
    cname = open('CNAME', encoding='utf-8').read().strip().lower()
    hosts = {re.sub(r'^https?://', '', u).split('/')[0].lower() for u in re.findall(r'<loc>(.*?)</loc>', sm, re.S | re.I)}
    if cname and hosts and cname not in hosts:
        print(f'AVERTISSEMENT: CNAME={cname} mais sitemap utilise {sorted(hosts)[0]}')

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
        for candidate in re.findall(r'(?:^|,)\s*([^,\s]+)', m.group(1)):
            u = candidate.strip()
            if u.startswith(('http', '//', 'data:', 'blob:')): continue
            t = u.lstrip('/') if u.startswith('/') else os.path.normpath(os.path.join(os.path.dirname(p), u)).replace('\\', '/')
            if t and not exists(t):
                errs.append(f'{p}: srcset cassé {u}')

# Le sitemap ne doit jamais publier une URL qui fait elle-même l’objet d’une redirection permanente.
if sm and os.path.exists('vercel.json'):
    try:
        vj = json.load(open('vercel.json', encoding='utf-8'))
        redirected = {x.get('source','').rstrip('/') for x in vj.get('redirects', []) if x.get('permanent')}
        for u in re.findall(r'<loc>(.*?)</loc>', sm, re.S | re.I):
            path = re.sub(r'^https?://[^/]+', '', u).rstrip('/')
            if path in redirected:
                errs.append(f'sitemap.xml: URL canonique redirigée {path}')
        for u in re.findall(r'<xhtml:link[^>]+href="([^"]+)"', sm, re.I):
            path = re.sub(r'^https?://[^/]+', '', u).rstrip('/')
            if path in redirected:
                errs.append(f'sitemap.xml: hreflang redirigé {path}')
    except Exception as e:
        errs.append(f'vercel.json: impossible de vérifier les redirections ({e})')

# Contrôles structurels supplémentaires : erreurs HTML introduites par des injections/transformations.
for p in pages:
    h = open(p, encoding='utf-8').read()
    if re.search(r'</a>\\s+class="[^"]+">', h, re.I):
        errs.append(f'{p}: attribut class orphelin après une balise </a>')

# Vérification légère des formulaires : éviter les formulaires sans nom d'action
# ou sans mécanisme de soumission explicite.
for p in pages:
    h = open(p, encoding='utf-8').read()
    for fm in re.finditer(r'<form\\b([^>]*)>', h, re.I):
        attrs = fm.group(1)
        if 'mailto:' in attrs.lower() or 'action=' in attrs.lower() or 'onsubmit=' in attrs.lower():
            continue
        # Les formulaires sans action explicite soumettent vers la page courante :
        # on les signale seulement si aucune logique JS n'est attachée à la page.
        if 'addEventListener' not in h and 'onsubmit' not in h.lower():
            errs.append(f'{p}: formulaire sans action ni gestionnaire de soumission détectable')

# Hreflang : chaque déclaration doit avoir un href absolu et un code reconnu.
for p in pages:
    h = open(p, encoding='utf-8').read()
    for m in re.finditer(r'<link\\b[^>]*rel=["\\\']alternate["\\\'][^>]*hreflang=["\\\']([^"\\\']+)["\\\'][^>]*>', h, re.I):
        tag = m.group(0)
        hm = re.search(r'href=["\\\']([^"\\\']+)', tag, re.I)
        if not hm or not re.match(r'^https?://', hm.group(1)):
            errs.append(f'{p}: hreflang sans URL absolue')
        if m.group(1).lower() not in ('fr','en','ar','x-default'):
            errs.append(f'{p}: hreflang non standard {m.group(1)}')


# Contrôle des routes institutionnelles et des principaux pôles.
EXPECTED_ROUTES = [
    'index.html', 'index-en.html', 'ar.html',
    'ar-poles.html',
    'amont/index.html', 'intermediaire/index.html', 'aval/index.html',
    'petrochimie/index.html', 'greentech/index.html',
    'tchaditech/index.html', 'tchaditude/index.html', 'enerconseils/index.html',
]
for route in EXPECTED_ROUTES:
    if not exists(route):
        errs.append(f'route attendue absente: {route}')

# Hubs institutionnels : points d’entrée majeurs couverts par la QA navigateur.
EXPECTED_HUBS = [
    'societe.html', 'investisseurs.html', 'clients.html', 'achats.html',
    'carrieres.html', 'projets.html', 'publications.html',
]
for route in EXPECTED_HUBS:
    if not exists(route):
        errs.append(f'hub institutionnel attendu absent: {route}')

# Pages polaires anglaises : de vraies pages servies en anglais depuis le Ch742
# (cibles hreflang « en » des pages françaises) — elles ne doivent plus être redirigées.
EXPECTED_EN_POLES = [
    '/pole-amont-en', '/pole-intermediaire-en', '/pole-aval-en',
    '/pole-enerchimie-en', '/pole-greentech-en', '/pole-tchaditech-en',
    '/pole-tchaditude-en', '/pole-enerconseils-en',
]
redirect_sources = set()
if os.path.exists('vercel.json'):
    redirect_sources = {r.get('source', '').lstrip('/') for r in json.load(open('vercel.json', encoding='utf-8')).get('redirects', [])}
for route in EXPECTED_EN_POLES:
    name = route.lstrip('/')
    if name + '.html' not in allf:
        errs.append(f'page polaire anglaise absente: {route}')
    if name in redirect_sources or name + '.html' in redirect_sources:
        errs.append(f'page polaire anglaise redirigee vers une autre page: {route}')

# Vérification finale après toutes les règles QA.
if errs:
    print('\n'.join(errs[:80])); print(f'\nECHEC : {len(errs)} probleme(s)'); sys.exit(1)
print(f'OK : {len(pages)} pages, 0 probleme')

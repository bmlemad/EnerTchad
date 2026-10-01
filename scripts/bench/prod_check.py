#!/usr/bin/env python3
"""Controle leger de la production (une trentaine de requetes) : ce que le labo ne voit pas.

Pour quelques pages : statut, temps jusqu au premier octet (mediane de 3), compression
servie, en-tetes de securite, et contenu identique au fichier du depot. Pour les
ressources partagees : compression et duree de cache (polices en cache long).

Usage : python3 scripts/bench/prod_check.py --site https://enertchad.netlify.app --root . \
          [--md reports/bench/prod.md]
Sort en erreur (code 1) si un controle echoue ; le temps de reponse est seulement rapporte.
"""
import argparse, gzip, http.client, re, statistics, sys, time
from pathlib import Path
from urllib.parse import urlsplit

PAGES = ['/', '/amont/', '/ar', '/carnets', '/investisseurs']
UA = 'EnerTchad-benchmark/1.0 (+controle hebdomadaire)'


def fetch(site, path, method='GET', enc='gzip'):
    u = urlsplit(site)
    c = http.client.HTTPSConnection(u.hostname, timeout=30)
    t0 = time.perf_counter()
    c.request(method, path, headers={'Accept-Encoding': enc, 'User-Agent': UA})
    r = c.getresponse()
    ttfb = (time.perf_counter() - t0) * 1000
    body = r.read()
    h = {k.lower(): v for k, v in r.getheaders()}
    c.close()
    if h.get('content-encoding') == 'gzip':
        body = gzip.decompress(body)
    return r.status, h, body, ttfb


def repo_file(root, path):
    p = path.strip('/')
    for cand in ([p + '/index.html'] if path.endswith('/') else [p, p + '.html']) if p else ['index.html']:
        f = root / cand
        if f.is_file():
            return f
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--site', default='https://enertchad.netlify.app')
    ap.add_argument('--root', default='.')
    ap.add_argument('--md')
    a = ap.parse_args()
    root = Path(a.root).resolve()
    fails, rows = [], []

    for path in PAGES:
        times, st, h, body = [], None, {}, b''
        for _ in range(3):
            st, h, body, t = fetch(a.site, path)
            times.append(t)
        _, hb, _, _ = fetch(a.site, path, 'HEAD', 'br, gzip')
        f = repo_file(root, path)
        same = f is not None and f.read_bytes() == body
        checks = {
            'statut 200': st == 200,
            'brotli servi': hb.get('content-encoding') == 'br',
            'HSTS': 'strict-transport-security' in h,
            'X-Content-Type-Options': h.get('x-content-type-options') == 'nosniff',
            'identique au depot': same,
        }
        for k, ok in checks.items():
            if not ok:
                fails.append(f'{path} : {k}')
        rows.append((path, round(statistics.median(times)), st, hb.get('content-encoding', '-'),
                     'oui' if same else 'NON'))

    # Ressources partagees : une feuille commune et une police de l accueil.
    home = (root / 'index.html').read_text(encoding='utf-8', errors='ignore')
    font = next(iter(re.findall(r'href="(/assets/fonts/[^"]+\.woff2)"', home)), None)
    assets = [('/assets/chrome/nav_a.css', 'br', None), ('/sw.js', 'br', None)]
    if font:
        assets.append((font, None, 'immutable'))
    arows = []
    for path, want_enc, want_cache in assets:
        st, h, _, _ = fetch(a.site, path, 'HEAD', 'br, gzip')
        enc, cache = h.get('content-encoding', '-'), h.get('cache-control', '-')
        if st != 200:
            fails.append(f'{path} : statut {st}')
        if want_enc and enc != want_enc:
            fails.append(f'{path} : compression {enc}')
        if want_cache and want_cache not in cache:
            fails.append(f'{path} : cache « {cache} »')
        arows.append((path, st, enc, cache))

    md = ['## Controle de la production', '', f'Site : {a.site}', '',
          '| Page | Premier octet, connexion comprise (mediane de 3) | Statut | Compression | Identique au depot |',
          '|---|---:|---:|---|---|']
    md += [f'| `{p}` | {t} ms | {s} | {e} | {same} |' for p, t, s, e, same in rows]
    md += ['', '| Ressource | Statut | Compression | Cache |', '|---|---:|---|---|']
    md += [f'| `{p}` | {s} | {e} | {c} |' for p, s, e, c in arows]
    md += ['', '### Echecs', ''] + ([f'- {x}' for x in fails] or ['Aucun.'])
    text = '\n'.join(md) + '\n'
    if a.md:
        Path(a.md).parent.mkdir(parents=True, exist_ok=True)
        Path(a.md).write_text(text, encoding='utf-8')
    print(text)
    for x in fails:
        print(f'::error::Production : {x}')
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()

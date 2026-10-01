#!/usr/bin/env python3
"""Budget statique par page, calcule sur les fichiers du depot (aucune requete reseau).

Mesures par page HTML :
  html_gz      HTML compresse (gzip -9), styles et scripts en ligne compris
  css_gz       feuilles locales liees, @import compris, compressees (chaque fichier une fois)
  js_gz        scripts locaux references, compresses
  blocking_css feuilles <link rel=stylesheet> qui bloquent le premier affichage
  blocking_js  scripts synchrones (sans async, defer ni module) dans <head>
  import_depth longueur de la plus longue chaine @import
  has_sel      selecteurs :has( dans le CSS charge (feuilles + <style>)
  important    declarations !important dans le CSS charge
  img_nodim    <img> sans width ET height (risque de decalage de mise en page)

Usage :
  python3 scripts/bench/static_budget.py --root . --out reports/bench/static-head.json
  python3 scripts/bench/static_budget.py --compare reports/bench/static-base.json reports/bench/static-head.json \
      --md reports/bench/static.md
La comparaison sort en erreur (code 1) si une regression bloquante est trouvee.
"""
import argparse, gzip, json, re, sys
from pathlib import Path

SKIP_PARTS = {'.git', 'node_modules', 'reports', 'docs-sources', 'qa'}
LINK_RX = re.compile(r'<link\b[^>]*>', re.I)
SCRIPT_RX = re.compile(r'<script\b([^>]*)>', re.I)
STYLE_RX = re.compile(r'<style\b[^>]*>([\s\S]*?)</style>', re.I)
IMPORT_RX = re.compile(r'@import\s+(?:url\(\s*)?["\']?([^"\')\s;]+)', re.I)
ATTR = lambda tag, name: (re.search(r'\b' + name + r'\s*=\s*["\']([^"\']*)["\']', tag, re.I) or [None, None])[1]

# Seuils : (part relative, valeur absolue) -- les deux doivent etre depasses.
BLOCKING = {'html_gz': (0.05, 2048), 'css_gz': (0.05, 2048), 'js_gz': (0.05, 2048),
            'blocking_css': (0, 0), 'blocking_js': (0, 0), 'import_depth': (0, 0)}
WARNING = {'has_sel': (0, 0), 'important': (0.05, 20), 'img_nodim': (0, 0)}
LABELS = {'html_gz': 'HTML (gzip)', 'css_gz': 'CSS (gzip)', 'js_gz': 'JS (gzip)',
          'blocking_css': 'feuilles bloquantes', 'blocking_js': 'scripts bloquants (head)',
          'import_depth': 'profondeur @import', 'has_sel': ':has()', 'important': '!important',
          'img_nodim': 'images sans dimensions'}
gz = lambda b: len(gzip.compress(b, 9, mtime=0))


def measure(root: Path):
    cache = {}

    def css_info(path: Path, depth=1, seen=None):
        """(fichiers, profondeur max) pour une feuille et ses @import."""
        seen = seen or set()
        if path in seen or not path.is_file():
            return set(), depth - 1
        seen.add(path)
        files, best = {path}, depth
        for ref in IMPORT_RX.findall(path.read_text(encoding='utf-8', errors='ignore')):
            if ref.startswith(('http:', 'https:', '//', 'data:')):
                continue
            target = (root / ref.lstrip('/')) if ref.startswith('/') else (path.parent / ref)
            f, d = css_info(target.resolve(), depth + 1, seen)
            files |= f
            best = max(best, d)
        return files, best

    def local(ref):
        if not ref or ref.startswith(('http:', 'https:', '//', 'data:', '#')):
            return None
        p = (root / ref.split('?')[0].split('#')[0].lstrip('/')).resolve()
        return p if p.is_file() and root in p.parents else None

    def size(p):
        if p not in cache:
            data = p.read_bytes()
            text = data.decode('utf-8', 'ignore')
            cache[p] = (gz(data), text.count(':has('), text.count('!important'))
        return cache[p]

    out = {}
    for page in sorted(root.rglob('*.html')):
        rel = page.relative_to(root)
        if SKIP_PARTS & set(rel.parts) or page.name.startswith('google'):
            continue
        raw = page.read_bytes()
        html = raw.decode('utf-8', 'ignore')
        head = html.split('</head>', 1)[0]
        css_files, depth, blocking_css = set(), 0, 0
        for tag in LINK_RX.findall(html):
            if (ATTR(tag, 'rel') or '').lower() != 'stylesheet':
                continue
            p = local(ATTR(tag, 'href'))
            media = (ATTR(tag, 'media') or 'all').lower()
            if media != 'print' and not re.search(r'\bdisabled\b', tag, re.I):
                blocking_css += 1
            if p:
                f, d = css_info(p)
                css_files |= f
                depth = max(depth, d)
        js_files, blocking_js = set(), 0
        for m in SCRIPT_RX.finditer(html):
            attrs = m.group(1)
            src = ATTR('<' + attrs + '>', 'src')
            if not src:
                continue
            p = local(src)
            if p:
                js_files.add(p)
            sync = not re.search(r'\b(async|defer)\b', attrs, re.I) and (ATTR('<' + attrs + '>', 'type') or '') != 'module'
            if sync and m.start() < len(head):
                blocking_js += 1
        inline_css = ''.join(STYLE_RX.findall(html))
        has_sel = inline_css.count(':has(') + sum(size(f)[1] for f in css_files)
        important = inline_css.count('!important') + sum(size(f)[2] for f in css_files)
        imgs = re.findall(r'<img\b[^>]*>', html, re.I)
        out[rel.as_posix()] = {
            'html_gz': gz(raw), 'css_gz': sum(size(f)[0] for f in css_files),
            'js_gz': sum(size(f)[0] for f in js_files), 'blocking_css': blocking_css,
            'blocking_js': blocking_js, 'import_depth': depth, 'has_sel': has_sel,
            'important': important,
            'img_nodim': sum(1 for t in imgs if not (ATTR(t, 'width') and ATTR(t, 'height'))),
        }
    return out


def worse(metric, b, h, table):
    rel, ab = table[metric]
    d = h - b
    return d > ab and d > b * rel


def compare(base, head):
    blocking, warnings = [], []
    for page, h in head.items():
        b = base.get(page)
        if not b:
            continue
        for m in BLOCKING:
            if worse(m, b[m], h[m], BLOCKING):
                blocking.append((page, m, b[m], h[m]))
        for m in WARNING:
            if worse(m, b[m], h[m], WARNING):
                warnings.append((page, m, b[m], h[m]))
    return blocking, warnings


def fmt(m, v):
    return f'{v / 1024:.1f} Ko' if m.endswith('_gz') else str(v)


def report(base, head, blocking, warnings):
    keys = list(BLOCKING) + list(WARNING)
    common = [p for p in head if p in base]
    tot = lambda d, m: sum(d[p][m] for p in common)
    md = ['## Budget statique (fichiers du depot)', '',
          f'{len(head)} pages mesurees ; {len(common)} comparees a la reference.', '',
          '| Mesure (somme des pages comparees) | Reference | Version | Ecart |', '|---|---:|---:|---:|']
    for m in keys:
        b, h = tot(base, m), tot(head, m)
        md.append(f'| {LABELS[m]} | {fmt(m, b)} | {fmt(m, h)} | {"+" if h >= b else ""}{fmt(m, h - b)} |')
    new = sorted(set(head) - set(base))
    gone = sorted(set(base) - set(head))
    if new:
        md += ['', f'Pages nouvelles (non comparees) : {", ".join(new[:20])}{" ..." if len(new) > 20 else ""}']
    if gone:
        md += ['', f'Pages retirees : {", ".join(gone[:20])}{" ..." if len(gone) > 20 else ""}']
    for title, rows in (('Regressions bloquantes', blocking), ('Avertissements', warnings)):
        md += ['', f'### {title}', '']
        if not rows:
            md.append('Aucune.')
        for m in LABELS:
            hits = [r for r in rows if r[1] == m]
            if not hits:
                continue
            md.append(f'- **{LABELS[m]}** : {len(hits)} page(s)')
            for page, _, b, h in hits[:8]:
                md.append(f'  - `{page}` : {fmt(m, b)} -> {fmt(m, h)}')
            if len(hits) > 8:
                md.append(f'  - ... et {len(hits) - 8} autres')
    return '\n'.join(md) + '\n'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default='.')
    ap.add_argument('--out')
    ap.add_argument('--compare', nargs=2, metavar=('BASE', 'HEAD'))
    ap.add_argument('--md')
    a = ap.parse_args()
    if a.compare:
        base, head = (json.loads(Path(p).read_text()) for p in a.compare)
        blocking, warnings = compare(base, head)
        md = report(base, head, blocking, warnings)
        if a.md:
            Path(a.md).parent.mkdir(parents=True, exist_ok=True)
            Path(a.md).write_text(md, encoding='utf-8')
        print(md)
        for kind, rows in (('error', blocking), ('warning', warnings)):
            for m in LABELS:
                hits = [r for r in rows if r[1] == m]
                if hits:
                    page, _, b, h = hits[0]
                    print(f'::{kind}::{LABELS[m]} en hausse sur {len(hits)} page(s), ex. {page} : {fmt(m, b)} -> {fmt(m, h)}')
        sys.exit(1 if blocking else 0)
    data = measure(Path(a.root).resolve())
    if a.out:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out).write_text(json.dumps(data, indent=0, sort_keys=True), encoding='utf-8')
    print(f'{len(data)} pages mesurees')


if __name__ == '__main__':
    main()

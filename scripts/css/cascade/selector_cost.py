# -*- coding: utf-8 -*-
"""Cascade étape 3 (lot 109) : coût des sélecteurs CSS, mesuré par Chromium.

Pour chaque page × largeur × thème × essai : trace « SelectorStats » (catégorie
disabled-by-default-blink.debug) pendant le chargement ; temps passé par sélecteur, nombre
d'essais de correspondance et de correspondances. Chaque sélecteur est rattaché à sa source
(feuille /assets/chrome/… ou bloc <style id>) depuis document.styleSheets, avec la
sérialisation de Chromium (la même que celle de la trace).

Sortie : <sortie>.json (par sélecteur : ms médianes cumulées, essais, correspondances, pages
où il correspond, sources, famille de la partie droite) et <sortie>.md (synthèse, 40 premiers).

Usage : python3 scripts/css/cascade/selector_cost.py <base> <sortie> [--runs 3] <page> [<page>…]
"""
import argparse
import collections
import json
import os
import re
import statistics
import tempfile

from playwright.sync_api import sync_playwright

INIT = ("try{localStorage.setItem('et-plight','%s');localStorage.setItem('et-jlight','%s');"
        "localStorage.setItem('et-audience-consent-v3',JSON.stringify({value:'denied',time:Date.now()}))}catch(e){}")
CONTEXTS = ((390, 844, True), (1440, 900, False))
THEMES = ('1', '0')

# Sélecteurs du document → source, sérialisés par Chromium, découpés aux virgules de premier niveau.
SOURCES_JS = r"""() => {
  const split = s => { const out = []; let d = 0, cur = '';
    for (const ch of s) { if (ch === '(' || ch === '[') d++; else if (ch === ')' || ch === ']') d--;
      if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) out.push(cur.trim()); return out; };
  const map = {};
  const walk = (rules, src) => { for (const r of rules) {
    if (r.selectorText) for (const s of split(r.selectorText)) (map[s] = map[s] || new Set()).add(src);
    if (r.cssRules) walk(r.cssRules, src); } };
  for (const sh of document.styleSheets) {
    let src = 'inline';
    if (sh.href) src = sh.href.split('?')[0].split('/').pop();
    else if (sh.ownerNode) { const n = sh.ownerNode; src = n.id ? '#' + n.id : (n.hasAttribute('data-et-crit') ? 'critique' : (n.hasAttribute('data-et-design-system') ? 'design-system' : 'style')); }
    try { walk(sh.cssRules, src); } catch (e) {}
  }
  const o = {}; for (const k in map) o[k] = [...map[k]]; return o;
}"""


def key_family(sel):
    """Famille de la partie droite (le composé le plus à droite, testé contre chaque élément candidat)."""
    depth, cut = 0, 0
    for i, ch in enumerate(sel):
        if ch in '([':
            depth += 1
        elif ch in ')]':
            depth -= 1
        elif depth == 0 and ch in ' >+~':
            cut = i + 1
    key = sel[cut:].strip()
    if key.startswith('::') or re.match(r'^:{1,2}[\w-]+$', key):
        return 'pseudo', key
    if re.match(r'^(\*|:not\(#[^)]*\))+$', key.replace('*', '*')) or key.startswith('*'):
        return 'universelle', key
    if key.startswith((':is(', ':where(')):
        return 'is-where', key
    if key.startswith(':has(') or ':has(' in key:
        return 'has', key
    if re.match(r'^[a-z]', key) and not re.search(r'[.#\[]', key):
        return 'balise', key
    return 'classe-id-attribut', key


def one(browser, base, page, w, h, mob, theme):
    ctx = browser.new_context(viewport={'width': w, 'height': h}, is_mobile=mob)
    ctx.add_init_script(INIT % (theme, theme))
    pg = ctx.new_page()
    fd, path = tempfile.mkstemp(suffix='.json')
    os.close(fd)
    browser.start_tracing(page=pg, path=path, categories=['disabled-by-default-blink.debug', 'devtools.timeline'])
    pg.goto(base + page, wait_until='load', timeout=90000)
    pg.wait_for_timeout(1500)
    browser.stop_tracing()
    sources = pg.evaluate(SOURCES_JS)
    ctx.close()
    data = json.load(open(path))
    os.unlink(path)
    ev = data['traceEvents'] if isinstance(data, dict) else data
    agg = collections.defaultdict(lambda: [0.0, 0, 0])
    for e in ev:
        if e.get('name') != 'SelectorStats':
            continue
        for s in e.get('args', {}).get('selector_stats', {}).get('selector_timings', []):
            a = agg[s['selector']]
            a[0] += s.get('elapsed (us)', 0) / 1000.0
            a[1] += s.get('match_attempts', 0)
            a[2] += s.get('match_count', 0)
    return agg, sources


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('base')
    ap.add_argument('out')
    ap.add_argument('pages', nargs='+')
    ap.add_argument('--runs', type=int, default=3)
    a = ap.parse_args()
    per = collections.defaultdict(lambda: collections.defaultdict(list))  # sel -> contexte -> [ms par essai]
    att = collections.defaultdict(int)
    hit_pages = collections.defaultdict(set)
    src = collections.defaultdict(set)
    totals = collections.defaultdict(list)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for page in a.pages:
            for w, h, mob in CONTEXTS:
                for theme in THEMES:
                    ctxkey = f'{page}|{w}|{theme}'
                    for r in range(a.runs):
                        agg, sources = one(b, a.base, page, w, h, mob, theme)
                        totals[ctxkey].append(sum(v[0] for v in agg.values()))
                        for s, (ms, at, mc) in agg.items():
                            per[s][ctxkey].append(ms)
                            if r == 0:
                                att[s] += at
                                if mc:
                                    hit_pages[s].add(page)
                        for s, ss in sources.items():
                            src[s].update(ss)
                    print(f'{ctxkey} : {statistics.median(totals[ctxkey]):.0f} ms', flush=True)
        b.close()
    rows = []
    for s, ctxs in per.items():
        ms = sum(statistics.median(v + [0.0] * (a.runs - len(v))) for v in ctxs.values())
        fam, key = key_family(s)
        rows.append({'selector': s, 'ms': round(ms, 2), 'attempts': att[s], 'pages_hit': sorted(hit_pages[s]),
                     'sources': sorted(src.get(s, [])), 'family': fam, 'key': key[:120]})
    rows.sort(key=lambda r: -r['ms'])
    total = sum(r['ms'] for r in rows)
    fam = collections.Counter()
    for r in rows:
        fam[r['family']] += r['ms']
    dead = sum(r['ms'] for r in rows if not r['pages_hit'])
    bysrc = collections.Counter()
    for r in rows:
        for s in r['sources'] or ['(source inconnue)']:
            bysrc[s] += r['ms'] / max(1, len(r['sources']))
    report = {'pages': a.pages, 'runs': a.runs, 'total_ms': round(total, 1),
              'per_context_ms': {k: round(statistics.median(v), 1) for k, v in totals.items()},
              'family_ms': {k: round(v, 1) for k, v in fam.most_common()},
              'no_match_ms': round(dead, 1), 'source_ms': {k: round(v, 1) for k, v in bysrc.most_common()},
              'selectors': rows}
    json.dump(report, open(a.out + '.json', 'w'), ensure_ascii=False, indent=1)
    with open(a.out + '.md', 'w', encoding='utf-8') as f:
        f.write(f'# Coût des sélecteurs\n\nPages : {", ".join(a.pages)} ; 390 et 1440 px ; clair et sombre ; médiane de {a.runs} essais.\n\n')
        f.write(f'Total : {total:.0f} ms (somme des {len(totals)} contextes). Sans aucune correspondance sur ces pages : {dead:.0f} ms.\n\n')
        f.write('Par famille de partie droite : ' + ', '.join(f'{k} {v:.0f} ms' for k, v in fam.most_common()) + '\n\n')
        f.write('Par source : ' + ', '.join(f'{k} {v:.0f} ms' for k, v in bysrc.most_common(12)) + '\n\n')
        f.write('| ms | essais | pages touchées | famille | sources | sélecteur |\n|---:|---:|---:|---|---|---|\n')
        for r in rows[:40]:
            f.write(f"| {r['ms']:.1f} | {r['attempts']} | {len(r['pages_hit'])} | {r['family']} | {' '.join(r['sources'])[:40]} | `{r['selector'][:110]}` |\n")
    print(f'total {total:.0f} ms ; sans correspondance {dead:.0f} ms ; familles {dict(fam)}')


if __name__ == '__main__':
    main()

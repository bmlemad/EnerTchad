"""Refonte de la cascade — vérification par styles calculés, à conditions égales.
Pour chaque page × thème × largeur (× états sur l'échantillon), relève A (export actuel) puis B (export allégé)
l'un après l'autre ; en cas d'écart, recommence jusqu'à 3 fois (le site a quelques états transitoires : feuilles
différées, observateurs d'intersection). Seuls les écarts persistants sont retenus, avec le détail des propriétés.
usage : python3 cs_verify.py <baseA> <baseB> <dossier> [pages…]   |   python3 cs_verify.py report <dossier>"""
import collections
import glob
import json
import os
import sys

import cstyle_dump as c
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))


def props_diff(A, B):
    out = collections.Counter(); ex = {}
    for k in set(A) | set(B):
        if k.startswith('__'):
            continue
        a, b = A.get(k), B.get(k)
        if a == b:
            continue
        if a is None or b is None:
            out['(élément absent)'] += 1; ex.setdefault('(élément absent)', (k, a and a['p'], b and b['p'])); continue
        da = dict(x.split(':', 1) for x in a['s'].split(';') if ':' in x); db = dict(x.split(':', 1) for x in b['s'].split(';') if ':' in x)
        for p in set(da) | set(db):
            if da.get(p) != db.get(p):
                out[p] += 1; ex.setdefault(p, (a['p'][-80:], da.get(p, '')[:60], db.get(p, '')[:60]))
    return out, ex


def run(baseA, baseB, dest, only):
    os.makedirs(dest, exist_ok=True)
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        for page in (only or c.pages()):
            f = os.path.join(dest, page.replace('/', '__') + '.json')
            if os.path.exists(f):
                continue
            res = {}
            for theme, width, state in c.loads_for(page):
                key = f'{theme}_{width}_{state}'
                verdict = None
                for attempt in range(3):
                    A = c.one(br, baseA, page, theme, width, state, False)
                    B = c.one(br, baseB, page, theme, width, state, False)
                    if '__error__' in A or '__error__' in B:
                        verdict = {'error': A.get('__error__') or B.get('__error__')}; continue
                    diff = [k for k in set(A) | set(B) if not k.startswith('__') and A.get(k) != B.get(k)]
                    if not diff:
                        verdict = {'same': True, 'attempts': attempt + 1}; break
                    verdict = {'same': False, 'attempts': attempt + 1, 'n': len(diff)}
                if verdict and not verdict.get('same') and 'error' not in verdict:
                    DA = c.one(br, baseA, page, theme, width, state, True); DB = c.one(br, baseB, page, theme, width, state, True)
                    cnt, ex = props_diff(DA, DB)
                    if not cnt:
                        verdict = {'same': True, 'attempts': verdict['attempts'], 'transient': verdict.get('n')}
                    else:
                        verdict['props'] = cnt.most_common(12); verdict['examples'] = [(p, v) for p, v in list(ex.items())[:12]]
                res[key] = verdict
            json.dump(res, open(f, 'w'), ensure_ascii=False)
            bad = [k for k, v in res.items() if not v.get('same')]
            print(page, len(res), 'écarts' if bad else 'ok', bad, flush=True)
        br.close()


def report(dest):
    total = same = 0; bad = []
    for f in sorted(glob.glob(os.path.join(dest, '*.json'))):
        for k, v in json.load(open(f)).items():
            total += 1
            if v.get('same'):
                same += 1
            else:
                bad.append((os.path.basename(f), k, v))
    print(f'{same}/{total} chargements identiques ; {len(bad)} écarts persistants')
    agg = collections.Counter()
    for f, k, v in bad:
        for p, n in v.get('props', []):
            agg[p] += n
    print('propriétés :', agg.most_common(20))
    for f, k, v in bad[:40]:
        print(' ', f, k, v.get('n'), v.get('error', ''), (v.get('examples') or [])[:3])
    return len(bad)


if __name__ == '__main__':
    if sys.argv[1] == 'report':
        sys.exit(1 if report(sys.argv[2]) else 0)
    run(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:])

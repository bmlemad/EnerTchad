"""Refonte de la cascade par étapes (2 novembre 2026) : veto par sur-approximation sur toutes les pages de l'export.
Pour chaque règle candidate (work/cands.json, produit par scripts/css/cascade_candidates.mjs), cherche dans chaque page un
concurrent qui l'emporterait après retrait du !important ou de la chaîne :not(#…) — media queries ignorées, états
transitoires (survol, focus, classes et attributs posés par script, state_tokens.json) ignorés (veto_page.js).
usage : EXPORT_DIR=out CASCADE_DIR=scripts/css/cascade/work python3 scripts/css/cascade/veto.py run <base> [pages…]
        python3 scripts/css/cascade/veto.py merge   → work/decisions.json (règles dures : hard_rules.json)"""
import glob, json, os, re, sys
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); D = os.environ.get('CASCADE_DIR', os.path.join(HERE, 'work'))
OUT_DIR = os.environ.get('EXPORT_DIR', 'out')
JS = open(os.path.join(HERE, 'veto_page.js'), encoding='utf-8').read()
JS = re.sub(r'^//.*$', '', JS, flags=re.M).strip()
CANDS = json.load(open(os.path.join(D, 'cands.json')))  # node scripts/css/cascade_candidates.mjs a.css,b.css > work/cands.json
TOK = json.load(open(os.path.join(HERE, 'state_tokens.json')))
KEEP = {'et-plight', 'et-jlight'}  # thèmes : états de page, évalués séparément
STATE_CLASSES = [c for c in TOK['classes'] if c not in KEEP]
STATE_ATTRS = ['aria-expanded', 'aria-hidden', 'aria-pressed', 'aria-selected', 'aria-current', 'aria-modal', 'hidden', 'open', 'checked', 'disabled', 'tabindex',
               'data-etui', 'data-et-cue', 'data-cv', 'data-f', 'data-fond', 'data-m', 'data-kind', 'data-delivery-ready', 'data-share-ready', 'data-tt-init', 'data-et-bound', 'style']

def pages():
    out = []
    for f in sorted(glob.glob(os.path.join(OUT_DIR, '**/*.html'), recursive=True)):
        r = os.path.relpath(f, OUT_DIR)
        if r.startswith(('_next/', '_subsites/', 'assets/')) or r in ('404.html', '_not-found.html'): continue
        out.append(r)
    return out

def run(base, only):
    os.makedirs(D, exist_ok=True)
    todo = only or pages()
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        for page in todo:
            dest = os.path.join(D, page.replace('/', '__') + '.json')
            if os.path.exists(dest): continue
            res = {}
            for theme, vp in (('1', 1440), ('0', 1440), ('1', 412)):
                ctx = br.new_context(viewport={'width': vp, 'height': 900}, service_workers='block')
                pg = ctx.new_page()
                pg.add_init_script(f"try{{localStorage.setItem('et-plight','{theme}');localStorage.setItem('et-jlight','{theme}')}}catch(e){{}}")
                try:
                    pg.goto(base + page, wait_until='load', timeout=45000); pg.wait_for_timeout(1200)
                    # créer les éléments construits à la demande
                    pg.evaluate("()=>{try{window.openCmdk&&window.openCmdk()}catch(e){} const b=document.querySelector('#nezBar a[aria-controls=nezSheet]'); if(b&&innerWidth<760) b.click(); }")
                    pg.wait_for_timeout(400)
                    r = pg.evaluate(JS, {'cands': CANDS, 'stateClasses': STATE_CLASSES, 'stateAttrs': STATE_ATTRS})
                except Exception as e:
                    r = {'error': str(e)[:300]}
                ctx.close()
                if 'results' in r:  # compacter : ne garder que les vetos
                    vet = {}
                    for x in r['results']:
                        for d in x.get('decls', []):
                            v = {k: w for k, w in d['veto'].items() if w}
                            if v: vet.setdefault(x['sheet'], {}).setdefault(str(x['ordinal']), {})[d['prop']] = v
                    r = {'vetos': vet, 'absent': [[x['sheet'], x['ordinal']] for x in r['results'] if x.get('absent')], 'n': len(r['results']), 'dropped': r['dropped'], 'misaligned': r['misaligned'], 'badSelectors': r['badSelectors'], 'rules': r['rules']}
                res[f'{theme}_{vp}'] = r
            json.dump(res, open(dest, 'w'), ensure_ascii=False)
            st = {k: (v.get('error') or f"{v['n']} cand, drop {v['dropped']}, mis {v['misaligned']}, bad {v['badSelectors']}") for k, v in res.items()}
            print(page, st, flush=True)
        br.close()

if __name__ == '__main__':
    if sys.argv[1] == 'run': run(sys.argv[2], sys.argv[3:])

def merge():
    cands = CANDS
    hard = json.load(open(os.path.join(HERE, 'hard_rules.json')))
    animated = set(hard['animated'])
    def is_animated(p):
        p = p.lower()
        if p in animated: return True
        if any(a.startswith(p + '-') for a in animated): return True
        if p in ('inset', 'inset-inline', 'inset-inline-start', 'all') and 'left' in animated: return True
        return False
    veto = {}  # sheet -> ordinal -> prop -> set(variants)
    loads = errs = 0
    for f in glob.glob(os.path.join(D, '*.html.json')):
        for k, r in json.load(open(f)).items():
            if 'error' in r: errs += 1; continue
            loads += 1
            for sheet, ords in r['vetos'].items():
                for o, props in ords.items():
                    for p, vs in props.items():
                        veto.setdefault(sheet, {}).setdefault(int(o), {}).setdefault(p, set()).update(vs.keys())
    absent = {tuple(x) for x in json.load(open(os.path.join(D, 'absent.json')))} if os.path.exists(os.path.join(D, 'absent.json')) else set()
    decisions, stats = {}, {}
    for sheet, rules in cands.items():
        out = {}; st = {'rules': len(rules), 'chain_rules': 0, 'chain_ok': 0, 'imp': 0, 'imp_ok': 0, 'animated_kept': 0}
        for o, rule in enumerate(rules):
            if (sheet, o) in absent:
                continue  # règle écartée par le navigateur : laissée telle quelle
            v = veto.get(sheet, {}).get(o, {})
            chain_ok = rule['hasChain'] and rule['decls'] and not any('chain' in v.get(d['prop'], set()) for d in rule['decls'])
            if rule['hasChain']: st['chain_rules'] += 1
            if chain_ok: st['chain_ok'] += 1
            imp, both = [], []
            for d in rule['decls']:
                if not d['important']: continue
                st['imp'] += 1
                if is_animated(d['prop']): st['animated_kept'] += 1; continue
                vs = v.get(d['prop'], set())
                if 'imp' not in vs: imp.append(d['prop'])
                if 'both' not in vs: both.append(d['prop'])
            st['imp_ok'] += len(both) if chain_ok else len(imp)
            if chain_ok or imp:
                out[o] = {'chain': bool(chain_ok), 'imp': imp, 'both': both}
        decisions[sheet] = out; stats[sheet] = st
    json.dump(decisions, open(os.path.join(D, 'decisions.json'), 'w'), ensure_ascii=False)
    print('chargements', loads, 'erreurs', errs)
    for s, st in stats.items(): print(s, st)

if __name__ == '__main__' and sys.argv[1] == 'merge':
    merge()

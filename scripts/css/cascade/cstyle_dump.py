"""Refonte de la cascade — vérification par styles calculés (recommandation de l'advisor, 2 nov. 2026).
Pour chaque page × thème × largeur (+ états forcés sur un échantillon), relève getComputedStyle de chaque élément et
de ses ::before/::after, empreinte par élément. Comparaison avant/après : égalité stricte attendue.
Animations figées à t=0 (Animation.setPlaybackRate 0) pour que deux relevés du même site soient identiques.
usage : python3 cstyle_dump.py run <base> <dossier> [pages…]   |   python3 cstyle_dump.py diff <dossierA> <dossierB>
        python3 cstyle_dump.py detail <base> <page> <theme> <width> <state>  (liste complète pour un chargement)"""
import glob
import json
import os
import sys

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLE = ['index.html', 'amont/index.html', 'investisseurs.html', 'boutique/clients.html', 'ar.html', 'publications.html',
          'communique/cp-2026-012.html', 'presse.html', 'journal-gouvernance-avant-actifs.html', 'carnets.html', 'contact.html', 'index-en.html']
WIDTHS = (412, 1440)

DUMP_JS = """(detail) => {
  // attributs et classes volatils retirés du chemin ; relevé en une passe, sans sérialisation JSON côté Python
  const start = performance.now();
  const h = s => { let x = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x.toString(36); };
  const path = e => { const p = []; for (let n = e; n && n.nodeType === 1 && p.length < 6; n = n.parentElement) { let s = n.tagName.toLowerCase(); if (n.id) s += '#' + n.id; else if (n.classList.length) s += '.' + [...n.classList].slice(0, 2).join('.'); p.unshift(s); } return p.join('>'); };
  const sp = e => { const p = []; for (let n = e; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) { let k = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) k++; p.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + ':' + k); } return p.join('/') || 'html'; };
  const out = {};
  for (const e of [document.documentElement, ...document.body.querySelectorAll('*'), document.body]) {
    if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT|LINK|META)$/.test(e.tagName)) continue;
    const i = sp(e);
    for (const pe of [null, '::before', '::after']) {
      const cs = getComputedStyle(e, pe);
      if (pe && (cs.content === 'none' || cs.content === 'normal')) continue;
      let s = '';
      const names = []; for (let k = 0; k < cs.length; k++) names.push(cs[k]); names.sort(); // l'ordre des propriétés personnalisées n'est pas stable
      for (const n of names) s += n + ':' + cs.getPropertyValue(n).split(location.origin).join('') + ';';
      for (const n of ['--et-verre', '--et-verre-plein', '--et-verre-menu']) s += n + ':' + cs.getPropertyValue(n) + ';';
      const key = i + (pe || '');
      out[key] = detail ? { p: path(e), s } : h(s) + '|' + path(e);
    }
  }
  return out;
}"""


def pages():
    out = []
    out_dir = os.environ.get('EXPORT_DIR', 'out')
    for f in sorted(glob.glob(os.path.join(out_dir, '**/*.html'), recursive=True)):
        r = os.path.relpath(f, out_dir)
        if r.startswith(('_next/', '_subsites/', 'assets/')) or r in ('404.html', '_not-found.html'):
            continue
        out.append(r)
    return out


def loads_for(page):
    states = [('1', 1440, 'top'), ('0', 412, 'top')]
    if page in SAMPLE:
        states += [('0', 1440, 'top'), ('1', 412, 'top'), ('1', 1024, 'top'), ('0', 1024, 'top'), ('1', 1440, 'menu'), ('0', 1440, 'menu'),
                   ('1', 1440, 'hover'), ('1', 1440, 'focus'), ('0', 412, 'hover'), ('1', 412, 'navsheet'), ('1', 1440, 'scrolled')]
    return states


def one(br, base, page, theme, width, state, detail=False):
    ctx = br.new_context(viewport={'width': width, 'height': 900}, service_workers='block')
    pg = ctx.new_page()
    pg.add_init_script(f"try{{localStorage.setItem('et-plight','{theme}');localStorage.setItem('et-jlight','{theme}')}}catch(e){{}}")
    cdp = ctx.new_cdp_session(pg)
    cdp.send('Animation.enable'); cdp.send('Animation.setPlaybackRate', {'playbackRate': 0})
    try:
        pg.goto(base + page, wait_until='load', timeout=45000)
        # toutes les feuilles différées appliquées et chargées, polices prêtes
        try:
            pg.wait_for_function("() => [...document.querySelectorAll('link[rel=stylesheet]')].every(l => l.sheet && (!l.hasAttribute('data-et-defer') || l.media === 'all')) && document.fonts.status === 'loaded'", timeout=15000)
        except Exception:
            pass
        pg.wait_for_timeout(1500)
        if state == 'scrolled':
            pg.evaluate('scrollTo(0,1000)'); pg.wait_for_timeout(600)
        elif state == 'menu':
            t = pg.query_selector('#nav .nav-trigger')
            if t:
                t.click(); pg.wait_for_timeout(600)
        elif state == 'navsheet':
            b = pg.query_selector('#nezBar a[aria-controls=nezSheet]')
            if b:
                b.click(); pg.wait_for_timeout(600)
        elif state in ('hover', 'focus'):
            cdp.send('DOM.enable'); cdp.send('CSS.enable')
            doc = cdp.send('DOM.getDocument', {'depth': -1})
            ids = cdp.send('DOM.querySelectorAll', {'nodeId': doc['root']['nodeId'], 'selector': 'a, button, summary, [tabindex], input, select, textarea, .nav-item, li, .card, [class*=card]'})['nodeIds']
            forced = ['hover'] if state == 'hover' else ['focus', 'focus-visible', 'focus-within']
            for n in ids:
                try:
                    cdp.send('CSS.forcePseudoState', {'nodeId': n, 'forcedPseudoClasses': forced})
                except Exception:
                    pass
            pg.wait_for_timeout(300)
        # attendre un état stable : deux relevés identiques à 800 ms d'intervalle (scripts différés, chargement sous charge)
        prev = pg.evaluate(DUMP_JS, False); stable = 0
        for _ in range(10):
            pg.wait_for_timeout(600)
            cur = pg.evaluate(DUMP_JS, False)
            stable = stable + 1 if cur == prev else 0
            prev = cur
            if stable >= 2:
                break
        else:
            prev['__unstable__'] = '1'
        return pg.evaluate(DUMP_JS, True) if detail else prev
    except Exception as e:
        return {'__error__': str(e)[:300]}
    finally:
        ctx.close()


def run(base, dest, only):
    os.makedirs(dest, exist_ok=True)
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        for page in (only or pages()):
            f = os.path.join(dest, page.replace('/', '__') + '.json')
            if os.path.exists(f):
                continue
            res = {}
            for theme, width, state in loads_for(page):
                res[f'{theme}_{width}_{state}'] = one(br, base, page, theme, width, state)
            json.dump(res, open(f, 'w'))
            print(page, len(res), flush=True)
        br.close()


def diff(a, b):
    total = same = 0
    bad = []
    for f in sorted(glob.glob(os.path.join(a, '*.json'))):
        g = os.path.join(b, os.path.basename(f))
        if not os.path.exists(g):
            bad.append((os.path.basename(f), 'absent')); continue
        A, B = json.load(open(f)), json.load(open(g))
        for k in A:
            total += 1
            x, y = A[k], B.get(k)
            if y is None or '__error__' in x or '__error__' in y:
                bad.append((os.path.basename(f), k, 'erreur ou absent')); continue
            d = [e for e in set(x) | set(y) if x.get(e) != y.get(e)]
            if d:
                bad.append((os.path.basename(f), k, len(d), [(e, (x.get(e) or '').split('|', 1)[-1]) for e in sorted(d)[:4]]))
            else:
                same += 1
    print(f'{same}/{total} chargements identiques ; {len(bad)} différents')
    for x in bad[:60]:
        print('  ', x)
    return len(bad)


if __name__ == '__main__':
    if sys.argv[1] == 'run':
        run(sys.argv[2], sys.argv[3], sys.argv[4:])
    elif sys.argv[1] == 'diff':
        sys.exit(1 if diff(sys.argv[2], sys.argv[3]) else 0)
    elif sys.argv[1] == 'detail':
        with sync_playwright() as pw:
            br = pw.chromium.launch()
            print(json.dumps(one(br, sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5]), sys.argv[6], True))[:200])
            br.close()

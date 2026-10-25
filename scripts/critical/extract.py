# -*- coding: utf-8 -*-
"""CSS critique v4 — union sur plusieurs pages d'un gabarit, clé = nom de feuille.
collect(base, path, acc) ajoute à acc les règles appliquées au-dessus du pli (CDP, texte source),
pour 412×915 et 1440×900, thèmes clair et sombre. emit(acc) rend {nom: css} en ordre source.
python3 crit4.py <base> <sortie.json> <page> [<page>…]"""
import gzip
import json
import re
import sys
from playwright.sync_api import sync_playwright

MARK = r"""
(() => { const H = innerHeight;
  const box = el => { let e = el; while (e && e.nodeType === 1) { const r = e.getBoundingClientRect(); if (r.width > 0 || r.height > 0) return r; e = e.parentElement; } return null; };
  for (const el of document.querySelectorAll('[data-et-af]')) el.removeAttribute('data-et-af');
  let n = 0; for (const el of document.querySelectorAll('body *')) { const r = box(el); if (r && r.top < H) { el.setAttribute('data-et-af', '1'); n++; } }
  document.body.setAttribute('data-et-af', '1'); document.documentElement.setAttribute('data-et-af', '1');
  return n; })()
"""
INIT = "try{localStorage.setItem('et-plight','%s');localStorage.setItem('et-jlight','%s');localStorage.setItem('et-audience-consent-v3',JSON.stringify({value:'denied',time:Date.now()}))}catch(e){}"
CONTEXTS = ((412, 915, True), (1440, 900, False))


def new_acc():
    return {'kept': {}, 'texts': {}, 'order': []}


def name_of(url):
    return url.split('?')[0].split('/')[-1]


def collect(b, base, path, acc):
    for w, h, mob in CONTEXTS:
        for light in ('1', '0'):
            c = b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, device_scale_factor=2.6 if mob else 1)
            c.add_init_script(INIT % (light, light))
            p = c.new_page(); p.goto(base + path, wait_until='networkidle'); p.wait_for_timeout(300)
            p.evaluate(MARK)
            cdp = c.new_cdp_session(p)
            sheets = {}
            cdp.on('CSS.styleSheetAdded', lambda e: sheets.__setitem__(e['header']['styleSheetId'], e['header']))
            cdp.send('DOM.enable'); cdp.send('CSS.enable')
            doc = cdp.send('DOM.getDocument', {'depth': -1})
            ids = cdp.send('DOM.querySelectorAll', {'nodeId': doc['root']['nodeId'], 'selector': '[data-et-af]'})['nodeIds']
            names = {}
            for sid, hd in sheets.items():
                u = hd.get('sourceURL') or ''
                if '/assets/chrome/' in u and u.split('?')[0].endswith('.css') and not hd.get('isInline'):
                    n = name_of(u); names[sid] = n
                    if n not in acc['texts']:
                        acc['texts'][n] = cdp.send('CSS.getStyleSheetText', {'styleSheetId': sid})['text']
                        acc['order'].append(n)
            lines = {}
            for n in set(names.values()):
                a = [0]
                for ln in acc['texts'][n].split('\n'):
                    a.append(a[-1] + len(ln) + 1)
                lines[n] = a

            def take(rule):
                sid = rule.get('styleSheetId')
                if sid not in names:
                    return
                n = names[sid]; rg = rule['style'].get('range')
                if not rg:
                    return
                s = lines[n][rg['startLine']] + rg['startColumn']; e = lines[n][rg['endLine']] + rg['endColumn']
                chain = tuple([('layer', l['text']) for l in reversed(rule.get('layers', []))]
                              + [('supports', q['text']) for q in reversed(rule.get('supports', []))]
                              + [('container', q['text']) for q in reversed(rule.get('containerQueries', []))]
                              + [('media', m['text']) for m in reversed(rule.get('media', [])) if m.get('source') in ('mediaRule', None)])
                acc['kept'].setdefault(n, {})[(s, e)] = (rule['selectorList']['text'], chain)
            for nid in ids:
                try:
                    m = cdp.send('CSS.getMatchedStylesForNode', {'nodeId': nid})
                except Exception:
                    continue
                for r in m.get('matchedCSSRules', []):
                    take(r['rule'])
                for pe in m.get('pseudoElements', []):
                    for r in pe.get('matches', []):
                        take(r['rule'])
            c.close()


def emit(acc):
    out = {}
    for n in acc['order']:
        t = acc['texts'][n]
        rules = sorted(acc['kept'].get(n, {}).items())
        parts = [m.group(0) for m in re.finditer(r'@layer\s+[^{;]+;', t[:400])]
        parts += [m.group(0) for m in re.finditer(r'@font-face\s*\{[^}]*\}', t)]
        cur = (); buf = []
        for (s, e), (sel, chain) in rules:
            k = 0
            while k < len(cur) and k < len(chain) and cur[k] == chain[k]:
                k += 1
            buf.append('}' * (len(cur) - k))
            for kind, txt in chain[k:]:
                buf.append('@%s %s{' % (kind, txt))
            cur = chain
            buf.append(sel + '{' + t[s:e].strip() + '}')
        buf.append('}' * len(cur))
        css = ''.join(parts) + ''.join(buf)
        for nm in sorted(set(re.findall(r'animation(?:-name)?\s*:\s*([A-Za-z_][\w-]*)', css))):
            m = re.search(r'@keyframes\s+' + re.escape(nm) + r'\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}', t)
            if m:
                css += m.group(0)
        bad = [u for u in re.findall(r'url\(\s*["\']?([^"\')]+)', css) if not u.startswith(('/', 'data:', 'http', '#', '%23'))]
        assert not bad, (n, bad[:3])
        out[n] = css
    return out


if __name__ == '__main__':
    base, outp, pages = sys.argv[1], sys.argv[2], sys.argv[3:]
    acc = new_acc()
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for i, pg in enumerate(pages):
            collect(b, base, pg, acc); print(f'[{i+1}/{len(pages)}] {pg}', flush=True)
            import pickle; pickle.dump(acc, open(outp + '.acc.pkl', 'wb'))
        b.close()
    res = emit(acc)
    tot = ''.join(res.values())
    json.dump(res, open(outp, 'w'), ensure_ascii=False)
    print('feuilles', len(res), 'brut', len(tot) // 1024, 'Ko gzip', len(gzip.compress(tot.encode())) // 1024, 'Ko')
    for k, v in res.items():
        print('   %-36s %6d o' % (k, len(v)))

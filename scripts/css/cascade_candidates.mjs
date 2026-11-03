// Refonte de la cascade, étape 1 : liste des règles des feuilles cibles, dans l'ordre (hors @keyframes), avec leurs
// déclarations et la présence d'une chaîne :not(#…). Sert d'entrée au veto (m76/veto_page.js).
// Usage : node scripts/css/cascade_candidates.mjs pole-premium.css,premium-chrome.css,bundle_core_a1.css > cands.json
import postcss from 'postcss';
import { readFileSync } from 'node:fs';
const NOTID = /:not\(#[\w-]+\)/;
export const normSel = t => t.replace(/\s+/g, '').replace(/["']/g, '').replace(/(^|[^:]):(before|after|first-line|first-letter)\b/gi, '$1::$2');
if (process.argv[1] && process.argv[1].endsWith('cascade_candidates.mjs')) {
const out = {};
for (const f of process.argv[2].split(',')) {
  const root = postcss.parse(readFileSync('assets/chrome/' + f, 'utf8'));
  const list = [];
  root.walkRules(rule => {
    for (let p = rule.parent; p; p = p.parent) if (p.type === 'atrule' && /keyframes/i.test(p.name)) return;
    const decls = [];
    rule.each(n => { if (n.type === 'decl') decls.push({ prop: n.prop.toLowerCase(), important: !!n.important }); });
    list.push({ selNorm: normSel(rule.selector), hasChain: NOTID.test(rule.selector), decls });
  });
  out[f] = list;
}
process.stdout.write(JSON.stringify(out));
}

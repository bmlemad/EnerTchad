// Cascade étape 3 (lot 109, choix du DG le 9 novembre 2026) : retrait des sélecteurs morts.
// Un sélecteur est retiré d'une liste seulement s'il figure dans <morts.json>, établi par deux preuves
// indépendantes (scripts/css/cascade/selector_cost.py puis m76/sc) :
//   1. aucune correspondance sur les 248 pages du plan du site (1440 clair et sombre, 390 clair ;
//      pseudo-classes dynamiques retirées, jetons d'état posés par script comptés vivants) ;
//   2. au moins une classe requise par le sélecteur n'est posée par aucun code du dépôt
//      (attribut class, className, classList, setAttribute, générateurs Python).
// Retirer un sélecteur sans correspondance d'une liste ne change ni la correspondance des autres, ni leur
// spécificité : aucun effet sur le rendu. Une règle dont tous les sélecteurs sont morts disparaît ; une
// @media ou @supports devenue vide aussi. Les sélecteurs sont comparés dans la sérialisation de Chromium
// (celle de la trace), obtenue en faisant analyser chaque sélecteur par le navigateur.
// Les copies critiques (scripts/critical/*.json) reçoivent les mêmes retraits ; empreintes ?v= recalculées.
// Usage : node scripts/css/prune_dead_selectors.mjs <morts.json> <feuille.css>[,<feuille.css>…] [--apply]
import postcss from 'postcss';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { minifyCss } from '../next/harden.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const dead = new Set(JSON.parse(readFileSync(process.argv[2], 'utf8')));
const sheets = process.argv[3].split(',');
const apply = process.argv.includes('--apply');
const digest = text => createHash('sha256').update(text).digest('hex').slice(0, 12);
const inKeyframes = rule => { for (let p = rule.parent; p; p = p.parent) if (p.type === 'atrule' && /keyframes/i.test(p.name)) return true; return false; };

const roots = {};
const items = new Set();
for (const sheet of sheets) {
  roots[sheet] = postcss.parse(readFileSync('assets/chrome/' + sheet, 'utf8'));
  roots[sheet].walkRules(r => { if (!inKeyframes(r)) for (const s of r.selectors) items.add(s); });
}
const copies = {};
for (const f of readdirSync('scripts/critical').filter(f => f.endsWith('.json'))) {
  const set = JSON.parse(readFileSync('scripts/critical/' + f, 'utf8'));
  for (const name of sheets) {
    if (!set.sheets[name]) continue;
    const root = postcss.parse(set.sheets[name].css);
    root.walkRules(r => { if (!inKeyframes(r)) for (const s of r.selectors) items.add(s); });
    (copies[f] = copies[f] || { set, roots: {} }).roots[name] = root;
  }
}

// Sérialisation de Chromium, sélecteur par sélecteur (un sélecteur que le navigateur refuse reste intact).
const browser = await chromium.launch();
const page = await browser.newPage();
const list = [...items];
const ser = await page.evaluate(list => list.map(s => {
  try { const sh = new CSSStyleSheet(); sh.replaceSync(s + '{}'); const r = sh.cssRules[0]; return r && r.selectorText ? r.selectorText : null; }
  catch (e) { return null; }
}), list);
await browser.close();
const serOf = new Map(list.map((s, i) => [s, ser[i]]));

function prune(root, stats) {
  root.walkRules(rule => {
    if (inKeyframes(rule)) return;
    const keep = rule.selectors.filter(s => { const k = serOf.get(s); return !(k && dead.has(k)); });
    if (keep.length === rule.selectors.length) return;
    stats.selectors += rule.selectors.length - keep.length;
    if (keep.length) rule.selectors = keep; else { rule.remove(); stats.rules++; }
  });
  let again = true;
  while (again) { again = false; root.walkAtRules(a => { if (/^(media|supports|layer|container)$/i.test(a.name) && a.nodes && a.nodes.length === 0) { a.remove(); again = true; } }); }
}

const total = {};
for (const sheet of sheets) {
  const st = { selectors: 0, rules: 0, before: 0, after: 0 };
  st.before = readFileSync('assets/chrome/' + sheet, 'utf8').length;
  prune(roots[sheet], st);
  const out = roots[sheet].toString();
  st.after = out.length;
  total[sheet] = st;
  if (apply) writeFileSync('assets/chrome/' + sheet, out);
}
let sets = 0, copyStats = { selectors: 0, rules: 0 };
for (const [f, { set, roots: rs }] of Object.entries(copies)) {
  for (const [name, root] of Object.entries(rs)) {
    prune(root, copyStats);
    set.sheets[name].css = root.toString();
    set.sheets[name].v = digest(minifyCss(apply ? readFileSync('assets/chrome/' + name, 'utf8') : roots[name].toString()));
  }
  sets++;
  if (apply) writeFileSync('scripts/critical/' + f, JSON.stringify(set));
}
const matched = list.filter(s => dead.has(serOf.get(s))).length;
console.log(JSON.stringify(total), `copies critiques : ${copyStats.selectors} sélecteurs, ${copyStats.rules} règles, ${sets} jeu(x) ; formes retrouvées ${matched}${apply ? ' — écrit' : ' — à blanc'}`);

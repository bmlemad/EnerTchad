// Refonte de la cascade par étapes — étape 1 (choix du DG, 2 novembre 2026). Applique les décisions du veto
// (m76/veto/decisions.json) aux feuilles cibles : retrait d'un !important ou d'une chaîne :not(#…) seulement si
// aucune page, aucun thème, aucune largeur n'a trouvé de concurrent qui l'emporterait après retrait, toutes media
// queries et tous états transitoires confondus (sur-approximation, m76/veto_page.js), et si la propriété n'est
// animée par aucun @keyframes du site. Les règles sont identifiées par leur rang dans la feuille (même parcours que
// scripts/css/cascade_candidates.mjs). Les copies critiques en ligne (scripts/critical/*.json) reçoivent les mêmes
// retraits quand leur règle source est identifiable sans ambiguïté ; sinon elles restent intactes (même valeur que
// la feuille : aucun effet). Empreintes ?v= recalculées (même calcul que scripts/css/strip_glass.mjs).
// Usage : node scripts/css/prune_by_decisions.mjs <decisions.json> [--apply]
import postcss from 'postcss';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { minifyCss } from '../next/harden.mjs';
import { normSel } from './cascade_candidates.mjs';

const decisions = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const apply = process.argv.includes('--apply');
const NOTID = /(?::not\(#[\w-]+\))+/g;
const digest = text => createHash('sha256').update(text).digest('hex').slice(0, 12);
const inKeyframes = rule => { for (let p = rule.parent; p; p = p.parent) if (p.type === 'atrule' && /keyframes/i.test(p.name)) return true; return false; };

// Propriétés longues couvertes par une déclaration écrite (abrégée ou non) : deux déclarations d'un même bloc qui se
// recouvrent (border puis border-top, margin puis margin-left, background puis background-color…) se départagent par
// l'ordre ET l'importance ; elles gardent ou perdent leur !important ensemble.
const SIDES = ['top', 'right', 'bottom', 'left'];
const EXP = {
  border: SIDES.flatMap(s => ['width', 'style', 'color'].map(k => `border-${s}-${k}`)).concat(['border-image']),
  'border-color': SIDES.map(s => `border-${s}-color`), 'border-style': SIDES.map(s => `border-${s}-style`), 'border-width': SIDES.map(s => `border-${s}-width`),
  'border-radius': ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
  margin: SIDES.map(s => `margin-${s}`), padding: SIDES.map(s => `padding-${s}`), inset: SIDES, 'inset-inline': ['left', 'right'], 'inset-block': ['top', 'bottom'],
  'margin-inline': ['margin-left', 'margin-right'], 'margin-block': ['margin-top', 'margin-bottom'], 'padding-inline': ['padding-left', 'padding-right'], 'padding-block': ['padding-top', 'padding-bottom'],
  background: ['background-color', 'background-image', 'background-position', 'background-size', 'background-repeat', 'background-attachment', 'background-origin', 'background-clip'],
  font: ['font-style', 'font-variant', 'font-weight', 'font-stretch', 'font-size', 'line-height', 'font-family'],
  flex: ['flex-grow', 'flex-shrink', 'flex-basis'], 'flex-flow': ['flex-direction', 'flex-wrap'], gap: ['row-gap', 'column-gap'],
  outline: ['outline-width', 'outline-style', 'outline-color'], overflow: ['overflow-x', 'overflow-y'], transition: ['transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay'],
  animation: ['animation-name', 'animation-duration', 'animation-timing-function', 'animation-delay', 'animation-iteration-count', 'animation-direction', 'animation-fill-mode', 'animation-play-state'],
  'text-decoration': ['text-decoration-line', 'text-decoration-style', 'text-decoration-color', 'text-decoration-thickness'], 'list-style': ['list-style-type', 'list-style-position', 'list-style-image'],
  'place-items': ['align-items', 'justify-items'], 'place-content': ['align-content', 'justify-content'], 'place-self': ['align-self', 'justify-self'],
  grid: ['grid-template-rows', 'grid-template-columns', 'grid-template-areas', 'grid-auto-rows', 'grid-auto-columns', 'grid-auto-flow'], 'grid-template': ['grid-template-rows', 'grid-template-columns', 'grid-template-areas'],
  'grid-area': ['grid-row-start', 'grid-column-start', 'grid-row-end', 'grid-column-end'], 'grid-row': ['grid-row-start', 'grid-row-end'], 'grid-column': ['grid-column-start', 'grid-column-end'],
  columns: ['column-width', 'column-count'], mask: ['mask-image', 'mask-position', 'mask-size', 'mask-repeat'], 'scroll-margin': SIDES.map(s => `scroll-margin-${s}`), 'scroll-padding': SIDES.map(s => `scroll-padding-${s}`),
};
for (const s of SIDES) { EXP[`border-${s}`] = ['width', 'style', 'color'].map(k => `border-${s}-${k}`); }
EXP['border-inline'] = [...EXP['border-left'], ...EXP['border-right']]; EXP['border-block'] = [...EXP['border-top'], ...EXP['border-bottom']];
const longhands = prop => { const p = prop.toLowerCase(); if (EXP[p]) return new Set(EXP[p].flatMap(x => EXP[x] || [x])); return new Set([p]); };

function editRule(rule, dec, stats) {
  if (dec.chain) { const before = rule.selector; rule.selector = before.replace(NOTID, ''); if (rule.selector !== before) stats.chains++; }
  const ok = new Set(dec.chain ? dec.both : dec.imp);
  const decls = []; rule.each(n => { if (n.type === 'decl') decls.push(n); });
  // groupes de déclarations qui se recouvrent (union-find simple)
  const lh = decls.map(n => longhands(n.prop));
  const group = decls.map((_, i) => i);
  const find = i => group[i] === i ? i : (group[i] = find(group[i]));
  const hasAll = decls.some(n => n.prop.toLowerCase() === 'all');
  for (let i = 0; i < decls.length; i++) for (let j = i + 1; j < decls.length; j++) {
    if (hasAll || decls[i].prop.toLowerCase() === decls[j].prop.toLowerCase() || [...lh[i]].some(x => lh[j].has(x))) group[find(i)] = find(j);
  }
  const allowed = {};
  decls.forEach((n, i) => { if (!n.important) return; const g = find(i); if (!(g in allowed)) allowed[g] = true; if (!ok.has(n.prop.toLowerCase())) allowed[g] = false; });
  decls.forEach((n, i) => { if (n.important && allowed[find(i)]) { n.important = false; stats.important++; } });
}

const total = {};
const bySel = {}; // sheet -> normSel -> [decision]
for (const [sheet, rules] of Object.entries(decisions)) {
  const path = 'assets/chrome/' + sheet;
  const root = postcss.parse(readFileSync(path, 'utf8'));
  const stats = { chains: 0, important: 0 };
  let ordinal = -1;
  bySel[sheet] = {};
  root.walkRules(rule => {
    if (inKeyframes(rule)) return;
    ordinal++;
    const dec = rules[ordinal] || { chain: false, imp: [], both: [] };
    const key = normSel(rule.selector);
    (bySel[sheet][key] = bySel[sheet][key] || []).push(JSON.stringify(dec));
    editRule(rule, dec, stats);
  });
  total[sheet] = stats;
  if (apply) writeFileSync(path, root.toString());
}
let sets = 0, copies = 0, ambiguous = 0;
for (const f of readdirSync('scripts/critical').filter(f => f.endsWith('.json'))) {
  const path = 'scripts/critical/' + f;
  const set = JSON.parse(readFileSync(path, 'utf8'));
  let changed = false;
  for (const [name, sheet] of Object.entries(set.sheets)) {
    if (!decisions[name]) continue;
    const root = postcss.parse(sheet.css);
    const st = { chains: 0, important: 0 };
    root.walkRules(rule => {
      if (inKeyframes(rule)) return;
      const list = bySel[name][normSel(rule.selector)];
      if (!list) return;
      if (new Set(list).size !== 1) { ambiguous++; return; }
      editRule(rule, JSON.parse(list[0]), st);
      copies++;
    });
    sheet.css = root.toString();
    sheet.v = digest(minifyCss(readFileSync('assets/chrome/' + name, 'utf8')));
    changed = true;
  }
  if (changed) { sets++; if (apply) writeFileSync(path, JSON.stringify(set)); }
}
console.log(JSON.stringify(total), `copies critiques ${copies}, ambiguës laissées ${ambiguous}, ${sets} jeu(x)${apply ? ' — écrit' : ' — à blanc'}`);

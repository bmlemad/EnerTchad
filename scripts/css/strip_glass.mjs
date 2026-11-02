// Lot 90, étape 2 (2 novembre 2026) : retrait des déclarations devenues mortes depuis l'étape 1.
// L'étape 1 (assets/chrome/verre-2026.css, couche @layer et-verre déclarée la première, !important) fixe pour
// les surfaces de chrome le fond, le flou, le filet et l'ombre ; pour le méga-menu, la bande de chiffres et
// les cartes de l'accueil, le fond et le flou. Toute déclaration de ces propriétés dont le SUJET du sélecteur
// (dernier composé) est une de ces surfaces ne peut plus s'appliquer : elle est retirée ici, feuille par feuille,
// et la même transformation est appliquée aux CSS critiques extraites (scripts/critical/*.json), dont l'empreinte
// (?v=) est alors mise à jour. Les règles vidées et les blocs @media/@supports vidés disparaissent.
// Ne touche ni aux pseudo-éléments (::before…), ni aux descendants (.nav .brand), ni aux autres propriétés.
// Usage : node scripts/css/strip_glass.mjs            (compte, sans écrire)
//         node scripts/css/strip_glass.mjs --apply    (écrit les feuilles et les jeux critiques)
import postcss from 'postcss';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { minifyCss } from '../next/harden.mjs';

const CHROME = [/#nav(?![\w-])/, /\.nav(?![\w-])/, /\.nx(?![\w-])/, /\.pn(?![\w-])/, /\.nx-util(?![\w-])/, /\.pp-sub(?![\w-])/, /\.arh(?![\w-])/, /\.et-space-header(?![\w-])/, /#nezBar(?![\w-])/];
const SOLID = [/\.pn-mega(?![\w-])/, /\.nx-mega(?![\w-])/, /\.pp-figs(?![\w-])/];
const CHROME_PROPS = new Set(['background', 'background-color', 'background-image', 'backdrop-filter', '-webkit-backdrop-filter', 'border-bottom', 'border-bottom-color', 'box-shadow']);
const SOLID_PROPS = new Set(['background', 'background-color', 'background-image', 'backdrop-filter', '-webkit-backdrop-filter']);

export function subject(selector) {
  let depth = 0, last = 0;
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
    if (c === '(') depth++; else if (c === ')') depth--; else if (depth === 0 && /[\s>+~]/.test(c)) last = i + 1;
  }
  return selector.slice(last).trim();
}
export function kind(selector) {
  const s = subject(selector);
  if (!s || /::?(before|after|marker|placeholder|selection)/.test(s)) return null;
  if (CHROME.some(r => r.test(s))) return 'chrome';
  if (SOLID.some(r => r.test(s))) return 'solid';
  // cartes de l'accueil : .et-segments > * et .et-paths > * (sujet « * » ou « a/article » après ces parents)
  if (/\.et-(segments|paths)\s*>\s*[\w*]+$/.test(selector.trim())) return 'solid';
  return null;
}
export function strip(css) {
  const root = postcss.parse(css);
  let removed = 0;
  root.walkRules(rule => {
    if (rule.parent && rule.parent.type === 'atrule' && /keyframes/i.test(rule.parent.name)) return;
    const kinds = rule.selectors.map(kind);
    if (!kinds.length || kinds.some(k => !k)) return;
    const props = kinds.every(k => k === 'chrome') ? CHROME_PROPS : SOLID_PROPS;
    rule.walkDecls(d => { if (props.has(d.prop)) { d.remove(); removed++; } });
    if (!rule.nodes.length) rule.remove();
  });
  root.walkAtRules(at => { if (/^(media|supports|layer)$/.test(at.name) && at.nodes && !at.nodes.length) at.remove(); });
  return { css: root.toString(), removed };
}

const apply = process.argv.includes('--apply');
const digest = text => createHash('sha256').update(text).digest('hex').slice(0, 12);
let total = 0;
const report = {};
for (const f of readdirSync('assets/chrome').filter(f => f.endsWith('.css') && f !== 'verre-2026.css')) {
  const path = 'assets/chrome/' + f;
  const before = readFileSync(path, 'utf8');
  const { css, removed } = strip(before);
  if (!removed) continue;
  report[f] = { removed, bytes: before.length - css.length };
  total += removed;
  if (apply) writeFileSync(path, css);
}
// jeux critiques : même transformation, nouvelle empreinte (même calcul que scripts/next/fingerprint.mjs)
let sets = 0;
for (const f of readdirSync('scripts/critical').filter(f => f.endsWith('.json'))) {
  const path = 'scripts/critical/' + f;
  const set = JSON.parse(readFileSync(path, 'utf8'));
  let changed = false;
  for (const [name, sheet] of Object.entries(set.sheets)) {
    if (!report[name]) continue;
    const { css, removed } = strip(sheet.css);
    const full = readFileSync('assets/chrome/' + name, 'utf8');
    sheet.v = digest(minifyCss(apply ? full : strip(full).css));
    if (removed) sheet.css = css;
    changed = true;
  }
  if (changed) { sets++; if (apply) writeFileSync(path, JSON.stringify(set)); }
}
console.log(JSON.stringify(report, null, 1));
console.log(`${total} déclaration(s) morte(s) dans ${Object.keys(report).length} feuille(s) ; ${sets} jeu(x) critique(s) réalignés${apply ? ' — écrit' : ' — à blanc'}`);

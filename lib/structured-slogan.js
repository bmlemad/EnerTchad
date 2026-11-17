// Lot 144 (17 novembre 2026, remarque de relecture) : l'en-tête et le pied de page disent « L’énergie du Tchad. Intégrée. »
// (« Chad’s energy. Integrated. »), mais le JSON-LD Organization des pages gardait l'ancien slogan « Accès aux Énergies »
// (« Access to Energy »). Au build, la propriété "slogan" du JSON-LD reprend le slogan de l'en-tête, lu dans
// assets/data/navigation.json (clé header) : une seule source. Les titres de page et le reste du texte ne changent pas.
import { readFileSync } from 'node:fs';

let header = null;
try { header = JSON.parse(readFileSync(`${process.cwd()}/assets/data/navigation.json`, 'utf8')).header; } catch { header = null; }
const PAIRS = header ? [['Accès aux Énergies', header.fr?.slogan], ['Access to Energy', header.en?.slogan]].filter(([, slogan]) => slogan) : [];

export function withStructuredSlogan(html) {
  if (!html.includes('"slogan":"')) return html;
  let out = html;
  for (const [former, slogan] of PAIRS) out = out.split(`"slogan":"${former}"`).join(`"slogan":${JSON.stringify(slogan)}`);
  return out;
}

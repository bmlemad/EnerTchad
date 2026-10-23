// Lot 26 (constat m10) : versions de cache automatiques pour les feuilles et scripts de
// /assets/chrome/. Les parametres ?b=AAAAMMJJ.. poses a la main dans les sources (ou leur
// absence) sont remplaces, dans l'export uniquement, par ?v=<12 premiers caracteres hex du
// SHA-256 du contenu publie> : un changement de contenu change l'URL, un contenu identique
// garde la meme URL d'un build a l'autre. Meme convention que coherence-20261013.js?v= des
// sous-sites (scripts/next/subsites.mjs).
//  - prepare.mjs calcule les empreintes sur public/assets/chrome (copie publiee, feuilles
//    minifiees comme dans out/) et ecrit
//    .generated/fingerprints.json ; une ressource qui en appelle une autre (nav_a.js ->
//    audience-consent.js, fournisseur-form.js -> fournisseur-form.css) recoit d'abord l'URL
//    versionnee de sa dependance, puis sa propre empreinte : la modification d'une feuille
//    change aussi l'URL du script qui la charge.
//  - harden-export.mjs reecrit les references des pages HTML de out/ AVANT le calcul de la
//    politique CSP de page (empreintes SHA-256 des scripts en ligne) : un script en ligne qui
//    cite une URL versionnee est empreinte dans sa forme finale.
//  - lib/fingerprint.js applique la meme table aux pages React (essentiel, investor-center).
// Les noms de fichiers ne changent pas : regles de cache de _headers / .htaccess inchangees.
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const FINGERPRINTS = '.generated/fingerprints.json';
// /assets/chrome/<nom>.css|js, suivi d'une eventuelle chaine de requete (remplacee).
const REF = /\/assets\/chrome\/([A-Za-z0-9_.-]+\.(?:css|js))(?:\?[^"'`\s<>)\\]*)?(?![A-Za-z0-9_.-])/g;

export const digest = text => createHash('sha256').update(text).digest('hex').slice(0, 12);

export function rewriteRefs(text, versions) {
  if (!versions || !text.includes('/assets/chrome/')) return text;
  return text.replace(REF, (match, name) => versions[name] ? `/assets/chrome/${name}?v=${versions[name]}` : match);
}

// contents : { nom: texte publie }. Renvoie { versions, rewritten } ; rewritten ne contient
// que les ressources dont le texte change (references internes versionnees). published(nom,
// texte) donne les octets reellement servis (feuilles minifiees par harden-export.mjs) : une
// modification du minifieur change donc aussi l'URL.
export function fingerprintContents(contents, published = (name, text) => text) {
  const versions = {}, rewritten = {}, visiting = new Set();
  const resolve = name => {
    if (versions[name]) return versions[name];
    if (visiting.has(name)) return null; // cycle : la dependance garde son URL d'origine
    visiting.add(name);
    const table = {};
    for (const [, dep] of contents[name].matchAll(REF)) {
      if (dep !== name && dep in contents) { const v = resolve(dep); if (v) table[dep] = v; }
    }
    const text = rewriteRefs(contents[name], table);
    if (text !== contents[name]) rewritten[name] = text;
    visiting.delete(name);
    return (versions[name] = digest(published(name, text)));
  };
  for (const name of Object.keys(contents).sort()) resolve(name);
  return { versions, rewritten };
}

export async function readChrome(root) {
  const dir = join(root, 'assets/chrome'), contents = {};
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isFile() && /\.(?:css|js)$/.test(entry.name)) contents[entry.name] = await readFile(join(dir, entry.name), 'utf8');
  }
  return contents;
}

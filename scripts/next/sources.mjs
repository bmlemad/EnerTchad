// Lot 26 (constat m16, partie sure) : le build ne laisse plus l'arbre de travail modifie.
// prepare.mjs execute toujours scripts/apply_readiness_20261013.py sur les sources (Next.js,
// lib/strategic.jsx et les sous-sites lisent l'arbre transforme pendant le build), mais :
//  1. snapshotSources() retient le contenu des fichiers suivis AVANT la transformation ;
//  2. recordTransformed() garde, pour chaque fichier que la transformation a modifie, la
//     version d'origine (.generated/source-restore/) et la version transformee
//     (.generated/transformed/, lue par verify.mjs : check:migration compare l'export a ce
//     que le build a reellement rendu) ;
//  3. restoreSources(), appele en fin de finalize.mjs, remet chaque fichier dans son etat
//     d'avant le build, sauf s'il a ete modifie entre-temps (alors laisse tel quel et signale).
// `npm run dev` (prepare sans finalize) laisse l'arbre transforme ; le prochain prepare le
// restaure d'abord. Le rendu de out/ est inchange : seul l'etat de l'arbre apres build change.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const STATE = '.generated/source-restore';
export const TRANSFORMED = '.generated/transformed';
const TEXT = /\.(?:html|css|js|jsx|mjs|cjs|json|xml|txt|md|py|svg|webmanifest|ics|csv)$/;
const sha = buffer => createHash('sha256').update(buffer).digest('hex');

function trackedFiles() {
  try {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (resolve(root) !== resolve(process.cwd())) return [];
    return execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(p => p && TEXT.test(p));
  } catch { return []; } // archive sans .git : rien a restaurer (comportement d'origine)
}

export async function restoreSources() {
  const manifest = STATE + '/manifest.json';
  if (!existsSync(manifest)) return { restored: 0, kept: [] };
  const { files } = JSON.parse(await readFile(manifest, 'utf8'));
  let restored = 0; const kept = [];
  for (const { path, transformed } of files) {
    let current = null;
    try { current = await readFile(path); } catch {}
    if (current && sha(current) !== transformed) { kept.push(path); continue; }
    await writeFile(path, await readFile(STATE + '/pristine/' + path));
    restored++;
  }
  await rm(STATE, { recursive: true, force: true });
  return { restored, kept };
}

export async function snapshotSources() {
  // Build precedent interrompu (ou `npm run dev`) : revenir d'abord aux sources d'origine.
  const previous = await restoreSources();
  if (previous.restored) console.log(`Restored ${previous.restored} source files left transformed by a previous preparation.`);
  const before = new Map();
  for (const path of trackedFiles()) { try { before.set(path, await readFile(path)); } catch {} }
  return before;
}

// copies = false : tests qui executent la transformation hors build (pas de copie pour verify.mjs).
export async function recordTransformed(before, { copies = true } = {}) {
  if (copies) await rm(TRANSFORMED, { recursive: true, force: true });
  const files = [];
  for (const [path, original] of before) {
    let now;
    try { now = await readFile(path); } catch { continue; }
    if (now.equals(original)) continue;
    for (const [dir, body] of [[STATE + '/pristine/', original], ...(copies ? [[TRANSFORMED + '/', now]] : [])]) {
      await mkdir(dirname(dir + path), { recursive: true });
      await writeFile(dir + path, body);
    }
    files.push({ path, transformed: sha(now) });
  }
  if (files.length) {
    await mkdir(STATE, { recursive: true });
    await writeFile(STATE + '/manifest.json', JSON.stringify({ files }, null, 1));
  }
  return files.length;
}

// Source effectivement rendue par le dernier build (transformee si besoin).
export const builtSource = path => existsSync(TRANSFORMED + '/' + path) ? TRANSFORMED + '/' + path : path;

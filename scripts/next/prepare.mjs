import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { snapshotSources, recordTransformed } from './sources.mjs';
import { FINGERPRINTS, readChrome, fingerprintContents } from './fingerprint.mjs';

// Lot 27 (m16, voie B) : les sources suivies sont deja dans leur etat publie. La chaine
// apply_readiness_20261013.py (27 scripts apply_*/align_*) a ete appliquee une fois et
// committee, puis retiree du build. Seule etape restante : le registre des documents publics
// (tailles, empreintes, date « generated » du jour), qui depend des fichiers et de la date.
// Lot 26 (m16) : contenu d'origine retenu, restaure en fin de build (scripts/next/sources.mjs).
const pristine = await snapshotSources();
if (existsSync('scripts/refresh_document_metadata.py')) {
  execFileSync('python3', ['scripts/refresh_document_metadata.py'], { stdio: 'inherit' });
}

// Only tracked, explicitly public assets enter the generated public directory.
const ignored = new Set(['.git','.github','node_modules','public','out','.next','.generated','reports','docs-sources','app','lib','scripts']);
function inventory(directory = '.') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (ignored.has(entry.name) || (entry.name.startsWith('.') && entry.name !== '.well-known')) return [];
    const path = directory === '.' ? entry.name : directory + '/' + entry.name;
    return entry.isDirectory() ? inventory(path) : entry.isFile() ? [path] : [];
  });
}
let tracked;
try {
  const root = execFileSync('git', ['rev-parse','--show-toplevel'], { encoding:'utf8', stdio:['ignore','pipe','ignore'] }).trim();
  if(resolve(root)!==resolve(process.cwd()))throw new Error('Not the project Git root');
  tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
} catch {
  // A downloaded source ZIP has no .git directory; apply the same public allowlist.
  tracked = inventory();
}
const excluded = /^(?:\.github|scripts|qa|docs-sources|app|lib|reports)\//;
const html = tracked.filter(p => p.endsWith('.html') && !excluded.test(p));
const native = []; // lot 79 : Essentiel passe au gabarit commun (plus de page Next.js)
const pages = html.map(source => ({ source, route: source === 'index.html' ? '/' : '/' + source.slice(0, -5), native: native.includes(source.slice(0, -5)) }));
const extensions = new Set(['.css','.js','.webp','.woff2','.jpg','.pdf','.png','.svg','.xlsx','.pptx','.zip','.webmanifest','.ics','.csv','.xml','.txt']);
const publicWellKnown = new Set(['.well-known/security.txt']);
// Public documents linked from the site (press kit); other Markdown files stay internal.
const publicDocuments = new Set(['EnerTchad-fiche-presse.md']);
const assets = tracked.filter(p => publicWellKnown.has(p) || publicDocuments.has(p) || ( !excluded.test(p) && !p.startsWith('.') && (p.startsWith('assets/') || extensions.has(extname(p)) || ['_headers','_redirects','CNAME'].includes(p)) && !['package-lock.json','package.json'].includes(p)));
await rm('public', { recursive: true, force: true });
// A clean export avoids retaining old chunks when rebuilding in the same workspace.
await rm('out', { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
await mkdir('public', { recursive: true });
await mkdir('.generated', { recursive: true });
for (const path of assets) {
  await mkdir(dirname('public/' + path), { recursive: true });
  await copyFile(path, 'public/' + path);
}
await writeFile('.generated/site.json', JSON.stringify({ pages, assets }, null, 2));
// Lot 26 (m10) : empreintes de contenu des feuilles et scripts de /assets/chrome/.
const chrome = existsSync('public/assets/chrome') ? await readChrome('public') : {};
// Import differe : prepare.test.mjs s'execute avant `npm ci` (htmlparser2 absent), sans /assets/chrome.
const { minifyCss } = Object.keys(chrome).length ? await import('./harden.mjs') : { minifyCss: css => css };
const { versions, rewritten } = fingerprintContents(chrome, (name, text) => name.endsWith('.css') ? minifyCss(text) : text);
for (const [name, text] of Object.entries(rewritten)) await writeFile('public/assets/chrome/' + name, text);
await writeFile(FINGERPRINTS, JSON.stringify(versions, null, 1));
const transformed = await recordTransformed(pristine);
console.log(`Fingerprinted ${Object.keys(versions).length} /assets/chrome resources; ${transformed} source files transformed for this build (restored by finalize).`);
console.log(`Prepared ${pages.length} pages (${native.length} native React pages) and ${assets.length} public resources.`);

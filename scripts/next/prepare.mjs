import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';

// Only tracked, explicitly public assets enter the generated public directory.
const ignored = new Set(['.git','.github','node_modules','public','out','.next','.generated','reports','docs-sources','app','lib','scripts']);
function inventory(directory = '.') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (ignored.has(entry.name) || entry.name.startsWith('.')) return [];
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
const native = ['essentiel', 'essentiel-en', 'investor-center', 'investor-center-en'];
const pages = html.map(source => ({ source, route: source === 'index.html' ? '/' : '/' + source.slice(0, -5), native: native.includes(source.slice(0, -5)) }));
const extensions = new Set(['.css','.js','.webp','.woff2','.jpg','.pdf','.png','.svg','.xlsx','.pptx','.zip','.webmanifest','.ics','.csv','.xml','.txt']);
const assets = tracked.filter(p => !excluded.test(p) && !p.startsWith('.') && (p.startsWith('assets/') || extensions.has(extname(p)) || ['_headers','_redirects','CNAME'].includes(p)) && !['package-lock.json','package.json'].includes(p));
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
console.log(`Prepared ${pages.length} pages (${native.length} native React pages) and ${assets.length} public resources.`);

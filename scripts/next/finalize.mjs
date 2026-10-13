import { readFile, copyFile, mkdir, stat, rm, writeFile } from 'node:fs/promises';
import { deploymentRevision } from './revision.mjs';
import { dirname } from 'node:path';
import { buildSubsites } from './subsites.mjs';
const manifest = JSON.parse(await readFile('.generated/site.json', 'utf8'));
async function exists(path) { try { return (await stat(path)).isFile(); } catch { return false; } }
for (const page of manifest.pages) {
  const target = `out/${page.source}`;
  if (page.native && await exists(target)) continue;
  if (await exists(target) && (await readFile(target)).equals(await readFile(page.source))) continue;
  const route = page.route === '/' ? 'index' : page.route.slice(1);
  const candidates = [`out/${route}`, `out/${route}/index.html`];
  const generated = (await Promise.all(candidates.map(exists))).findIndex(Boolean);
  if (generated < 0) throw new Error(`Next.js did not export ${page.route}`);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(candidates[generated], target);
  // Extensionless Route Handler outputs cannot be served as HTML reliably by every CDN.
  if (generated === 0) await rm(candidates[generated]);
}
console.log(`Normalized ${manifest.pages.length} Next.js exports for Netlify pretty URLs.`);
await buildSubsites();
const revision = await deploymentRevision(manifest);
await writeFile('out/deploy-version.txt', revision + '\n');

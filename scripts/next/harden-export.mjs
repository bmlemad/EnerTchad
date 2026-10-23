import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { minifyCss, hardenHtml, CSP_MARK } from './harden.mjs';
import { FINGERPRINTS, rewriteRefs, readChrome, digest } from './fingerprint.mjs';
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== '_next') yield* walk(path); }
    else yield path;
  }
}
export async function hardenExport(root) {
  // Lot 26 (m10) : URL versionnees par empreinte, posees avant la politique CSP de page.
  const versions = JSON.parse(await readFile(FINGERPRINTS, 'utf8'));
  // Ressources creees apres prepare (subsites-core.js de subsites.mjs) : empreinte ajoutee ici.
  const generated = Object.entries(await readChrome(root)).filter(([name]) => !versions[name]);
  for (const [name, text] of generated) versions[name] = digest(name.endsWith('.css') ? minifyCss(text) : text);
  if (generated.length) await writeFile(FINGERPRINTS, JSON.stringify(versions, null, 1));
  let versioned = 0;
  let css = 0, cssBefore = 0, cssAfter = 0, pages = 0, policies = 0;
  for await (const path of walk(root)) {
    if (path.endsWith('.css')) {
      const text = await readFile(path, 'utf8'), min = minifyCss(text);
      cssBefore += Buffer.byteLength(text); cssAfter += Buffer.byteLength(min);
      if (min !== text) await writeFile(path, min);
      css++;
    } else if (path.endsWith('.html')) {
      const text = await readFile(path, 'utf8'), fp = rewriteRefs(text, versions), out = hardenHtml(fp);
      if (fp !== text) versioned++;
      if (out !== text) await writeFile(path, out);
      pages++; if (out.includes(CSP_MARK)) policies++;
    }
  }
  return `Hardened export: ${css} stylesheets minified (${cssBefore} -> ${cssAfter} bytes), ${policies}/${pages} HTML pages with a per-page script policy, ${versioned} with content-hashed /assets/chrome URLs.`;
}

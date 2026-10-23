import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { minifyCss, hardenHtml, CSP_MARK } from './harden.mjs';
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== '_next') yield* walk(path); }
    else yield path;
  }
}
export async function hardenExport(root) {
  let css = 0, cssBefore = 0, cssAfter = 0, pages = 0, policies = 0;
  for await (const path of walk(root)) {
    if (path.endsWith('.css')) {
      const text = await readFile(path, 'utf8'), min = minifyCss(text);
      cssBefore += Buffer.byteLength(text); cssAfter += Buffer.byteLength(min);
      if (min !== text) await writeFile(path, min);
      css++;
    } else if (path.endsWith('.html')) {
      const text = await readFile(path, 'utf8'), out = hardenHtml(text);
      if (out !== text) await writeFile(path, out);
      pages++; if (out.includes(CSP_MARK)) policies++;
    }
  }
  return `Hardened export: ${css} stylesheets minified (${cssBefore} -> ${cssAfter} bytes), ${policies}/${pages} HTML pages with a per-page script policy.`;
}

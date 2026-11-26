#!/usr/bin/env node
// Pre-compressed Brotli copies (file.ext.br) for the OVH export.
// The OVH shared hosting has no mod_brotli: Apache serves these copies itself
// when the browser accepts "br" (rules written by scripts/ovh/package.py),
// and keeps serving the original, compressed on the fly in gzip, otherwise.
// Usage: node scripts/ovh/precompress.mjs <export directory>
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve(process.argv[2] || 'out');
// Text types only; images, fonts, PDF and archives are already compressed.
const TYPES = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg', '.xml', '.txt', '.md',
  '.webmanifest', '.csv', '.ics']);
const MIN_BYTES = 1024;

let written = 0, skipped = 0, before = 0, after = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!entry.isFile() || !TYPES.has(path.extname(entry.name).toLowerCase())) continue;
    const source = fs.readFileSync(full);
    const target = full + '.br';
    if (source.length < MIN_BYTES) { if (fs.existsSync(target)) fs.unlinkSync(target); skipped++; continue; }
    const compressed = zlib.brotliCompressSync(source, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: source.length,
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      },
    });
    // A copy that does not shrink the file is useless: no copy, the original is served.
    if (compressed.length >= source.length) { if (fs.existsSync(target)) fs.unlinkSync(target); skipped++; continue; }
    if (!zlib.brotliDecompressSync(compressed).equals(source)) throw new Error('Brotli round trip failed: ' + full);
    fs.writeFileSync(target, compressed);
    written++; before += source.length; after += compressed.length;
  }
}
walk(root);
console.log(JSON.stringify({ brotli_copies: written, skipped, original_bytes: before, brotli_bytes: after }));

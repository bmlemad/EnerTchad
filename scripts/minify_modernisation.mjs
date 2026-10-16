import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { minify } = require('next/dist/compiled/terser');
for (const name of ['modernisation-ui', 'modernisation-contact']) {
  const source = await readFile(new URL('./' + name + '.js', import.meta.url), 'utf8');
  const result = await minify(source, { compress: true, mangle: true });
  await writeFile(new URL('./' + name + '.min.js', import.meta.url), result.code + '\n');
}

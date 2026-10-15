import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { compactCss } from './compact-css.mjs';

function rules(css) {
  function semantic(node) {
    if (node.type === 'comment') return null;
    const result = {};
    for (const [key, value] of Object.entries(node.toJSON())) {
      if (!['raws', 'source', 'inputs', 'nodes'].includes(key)) result[key] = value;
    }
    if (node.nodes) result.nodes = node.nodes.map(semantic).filter(Boolean);
    return result;
  }
  return semantic(postcss.parse(css));
}

test('preserves custom values, escapes, selector comments, conditions and cascade order', () => {
  const css = `/*! License notice */
/* Editorial explanation, retained in the source file. */
@layer first, second;
@media (min-width: 600px) {
  .one/**/.two, :is(.a, .b) {
    --tokens:  10px  20px;
    --label: "/* content, not a comment */";
    background: url("data:image/svg+xml,%3Csvg%3E%3Cpath/%3E%3C/svg%3E");
    width: calc(100% - 2 * var(--gap, 8px));
    color: red !important;
    color: blue !important;
  }
}
@supports (display: grid) { a::before { content: "\\\\/*"; } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
`;
  const compact = compactCss(css);
  assert.deepEqual(rules(compact), rules(css));
  assert(compact.includes('/*! License notice */'));
  assert(!compact.includes('Editorial explanation'));
  assert(compact.includes('/* content, not a comment */'));
  assert.equal(compactCss(compact), compact);
});

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(path => path.endsWith('.css'));
test('every tracked stylesheet retains exactly the same parsed CSS rules', () => {
  assert(files.length > 20);
  let originalBytes = 0, compactBytes = 0;
  for (const file of files) {
    const original = readFileSync(file, 'utf8');
    const compact = compactCss(original);
    assert.deepEqual(rules(compact), rules(original), file);
    originalBytes += Buffer.byteLength(original);
    compactBytes += Buffer.byteLength(compact);
  }
  assert(compactBytes < originalBytes);
  console.log(`CSS corpus: ${files.length} stylesheets, ${originalBytes} → ${compactBytes} bytes; rule trees unchanged.`);
});

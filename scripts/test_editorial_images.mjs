import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EDITORIAL_IMAGES, withEditorialImages } from '../lib/editorial-images.js';
import { withImageCollection } from '../lib/image-collection.js';

for (const item of EDITORIAL_IMAGES) for (const [index, route] of item.routes.entries()) {
  test(`editorial collection preserves content and adds a disclosed responsive image: ${route}`, () => {
    const file = route.endsWith('/') ? `${route.slice(1)}index.html` : `${route.slice(1)}.html`;
    const source = fs.readFileSync(file, 'utf8');
    const out = withImageCollection(source);
    assert.equal((out.match(/data-et-editorial-image=/g) || []).length, 1);
    assert.ok(out.includes(`data-et-editorial-image="${item.key}"`));
    assert.ok(out.includes(`alt="${item.alt[index]}"`));
    assert.ok(out.includes('loading="lazy" decoding="async"'));
    assert.ok(out.includes('width="720" height="405"'));
    assert.ok(out.includes(index ? 'fictional scene' : 'scène fictive'));
    assert.ok(out.includes(`/credits-photos${index ? '-en' : ''}#collection-20261125`));
    assert.equal(withEditorialImages(out), out);
    assert.equal((out.match(/<h1\b/g) || []).length, (source.match(/<h1\b/g) || []).length);
    assert.equal(out.match(/<header\b[^>]*id="top-pole"[\s\S]*?<\/header>/)?.[0], source.match(/<header\b[^>]*id="top-pole"[\s\S]*?<\/header>/)?.[0]);
    for (const variant of ['1400.webp', '800.webp', 'mobile720.webp', 'mobile720.avif']) {
      const file = `assets/img/collection-20261125/${item.key}-${variant}`;
      assert.ok(fs.statSync(file).size > 1000);
    }
  });
}
for (const lang of ['', '-en']) test(`editorial collection credits retain the earlier collection ${lang || 'fr'}`, () => {
  const out = withImageCollection(fs.readFileSync(`credits-photos${lang}.html`, 'utf8'));
  assert.ok(out.includes('id="collection-20261117"'));
  assert.ok(out.includes('id="collection-20261125"'));
  const section = out.split('id="collection-20261125"')[1].split('</section>')[0];
  assert.equal((section.match(/class="cr-item"/g) || []).length, 6);
});
test('unrelated pages are unchanged', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.equal(withEditorialImages(html), html);
});

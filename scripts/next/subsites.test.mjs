import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { htmlToDOM } from 'html-react-parser';
import { renderSubsite, commercialPages, atlasPages, commercialSitemap } from './subsites.mjs';

function elements(html) { const all = []; const walk = n => { if(n.name && n.attribs)all.push(n); (n.children || []).forEach(walk); }; htmlToDOM(html).forEach(walk); return all; }
for (const [space, pages] of [['boutique', commercialPages], ['atlas', atlasPages]]) {
  for (const page of pages) {
    test(`dedicated space preserves content, widgets and language: ${page.source}`, async () => {
      const original = await readFile(page.source, 'utf8');
      const output = renderSubsite(original, page, space, true);
      const before = elements(original), after = elements(output);
      const text = node => node.data || (node.children || []).map(text).join('');
      assert.equal(text(after.find(n => n.name === 'h1')), text(before.find(n => n.name === 'h1')));
      assert.equal(after.filter(n => n.attribs.id === 'nav').length, 1);
      assert.equal(after.find(n => n.name === 'html').attribs.lang, page.language);
      const origin = space === 'boutique' ? 'https://clients.enertchad.com' : 'https://atlas.enertchad.com';
      assert.equal(after.find(n => n.attribs.rel === 'canonical').attribs.href, origin + page.local);
      assert.equal(after.filter(n => n.attribs.hreflang).length, 3);
      const nav = after.find(n => n.attribs.id === 'nav');
      const navHtml = output.slice(output.indexOf('<nav id="nav"'), output.indexOf('</nav>', output.indexOf('<nav id="nav"')));
      assert(nav && navHtml.includes('aria-current="page"'));
      assert(navHtml.includes('https://enertchad.com'));
      assert(!after.some(n => n.attribs.id === 'sw-reg'));
      for (const script of before.filter(n => n.name === 'script' && !n.attribs.src && n.attribs.id !== 'sw-reg' && n.attribs.type !== 'application/ld+json')) {
        assert(after.some(n => n.name === 'script' && text(n) === text(script)), page.source + ' lost widget script');
      }
      for (const n of after.filter(n => n.name === 'script' && n.attribs.type === 'application/ld+json')) JSON.parse(text(n));
    });
  }
}
test('sitemap migrates exact commercial URLs without corrupting English paths', () => {
  const result = commercialSitemap('<urlset><loc>https://enertchad.com/clients</loc><loc>https://enertchad.com/clients-en</loc><loc>https://enertchad.com/aval/boutique</loc></urlset>');
  assert(result.includes('<loc>https://clients.enertchad.com/</loc>'));
  assert(result.includes('<loc>https://clients.enertchad.com/en/</loc>'));
  assert(result.includes('<loc>https://clients.enertchad.com/boutique</loc>'));
});
test('host routing mounts exact pages before generic legacy redirects', async () => {
  const rules = await readFile('_redirects', 'utf8');
  for (const [host, space, pages] of [['clients', 'boutique', commercialPages], ['atlas', 'atlas', atlasPages]]) {
    for (const p of pages) {
      const file = p.local.endsWith('/') ? p.local.slice(1) + 'index.html' : p.local.slice(1) + '.html';
      assert(rules.includes(`https://${host}.enertchad.com${p.local} /_subsites/${space}/${file} 200!`));
    }
  }
  assert(rules.indexOf('https://clients.enertchad.com/') < rules.indexOf('/clients /boutique/clients'));
  assert(rules.includes('https://boutique.enertchad.com/* https://clients.enertchad.com/boutique 301!'));
  assert(rules.includes('https://enertchad.com/clients https://clients.enertchad.com/ 301!'));
  assert(rules.includes('https://enertchad.com/atlas/ https://atlas.enertchad.com/ 301!'));
});

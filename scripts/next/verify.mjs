import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { htmlToDOM } from 'html-react-parser';
import { withYouTubeBadge } from '../../lib/youtube.js';
import { withNewsletterStatus } from '../../lib/newsletter.js';
import { atlasPages, renderSubsite, commercialSitemap } from './subsites.mjs';
import { hardenHtml, minifyCss } from './harden.mjs';
import { inlineCritical, earlyConsent, deferScripts, navCapabilities, glassChrome } from './critical.mjs';
import { FINGERPRINTS, rewriteRefs } from './fingerprint.mjs';
import { builtSource } from './sources.mjs';
// Lot 26 : l'export est compare a la source que le build a rendue (transformee, m16) et
// porte des URL /assets/chrome versionnees par empreinte (m10).
const versions = JSON.parse(await readFile(FINGERPRINTS, 'utf8'));
const manifest = JSON.parse(await readFile('.generated/site.json', 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
function elements(html) {
  const result = [];
  function walk(nodes) { for (const node of nodes) { if(node.name)result.push(node); if(node.children)walk(node.children); } }
  walk(htmlToDOM(html)); return result;
}
function text(node) { return node.data || (node.children || []).map(text).join(''); }
let preserved=0, native=0;
for (const page of manifest.pages) {
  const before = await readFile(builtSource(page.source));
  const after = await readFile(`out/${page.source}`);
  const exported = elements(after.toString());
  if (/^en(?:-|$)/i.test(exported.find(el => el.name === 'html')?.attribs.lang || '')) {
    const scripts = exported.filter(el => el.name === 'script').map(el => el.attribs.src || '');
    const palette = scripts.findIndex(src => /\/c_(?:abd9013c3955|df4f446df566)\.js(?:\?|$)/.test(src));
    if (palette >= 0) {
      const english = scripts.findIndex(src => /\/cmdk_en\.js(?:\?|$)/.test(src));
      assert(english >= 0 && english < palette, page.source+' must load the English index before search initializes');
      assert(!scripts.some(src => /\/cmdk_extra\.js(?:\?|$)/.test(src)), page.source+' loads the French search index');
      assert.equal(exported.find(el => el.attribs?.id === 'cmdk')?.attribs['aria-label'], 'Search', page.source+' search dialog language');
    }
  }
  if (!page.native) {
    let expected = withYouTubeBadge(withNewsletterStatus(before.toString()));
    const atlas = atlasPages.find(p => p.source === page.source);
    if (atlas) expected = renderSubsite(expected, atlas, 'atlas');
    assert.equal(hash(after),hash(hardenHtml(inlineCritical(rewriteRefs(deferScripts(earlyConsent(glassChrome(navCapabilities(expected, page.source)))), versions), page.source, versions))),page.source); preserved++; continue;
  }
  native++;
  assert(after.toString().includes('/assets/chrome/audience-consent.js') && after.toString().includes('et-audience-consent'), page.source+' missing consent loader');
  assert(!elements(after.toString()).some(el => el.name === 'script' && /googletagmanager\.com/.test(el.attribs.src || '')), page.source+' loads Google before visitor consent');
  const original = elements(before.toString());
  for(const style of original.filter(el => el.name === 'style')) {
    assert(exported.some(el => el.name === 'style' && [text(style), minifyCss(text(style))].includes(text(el))),page.source+' lost editorial style');
  }
  assert.equal(text(exported.find(el => el.name === 'title')),text(original.find(el => el.name === 'title')));
  assert.equal(exported.find(el => el.name === 'meta' && el.attribs.name === 'description')?.attribs.content,original.find(el => el.name === 'meta' && el.attribs.name === 'description')?.attribs.content);
  const robots = original.find(el => el.name === 'meta' && el.attribs.name === 'robots');
  assert.equal(exported.find(el => el.name === 'meta' && el.attribs.name === 'robots')?.attribs.content, robots?.attribs.content, page.source+' robots directive changed');
  for (const stylesheet of original.filter(el => el.name === 'link' && el.attribs.rel === 'stylesheet' && !el.attribs.href?.split('?')[0].endsWith('/strategic-premium.css'))) {
    assert(exported.some(el => el.name === 'link' && el.attribs.rel === 'stylesheet' && el.attribs.href === rewriteRefs(stylesheet.attribs.href, versions)), page.source+' lost stylesheet '+stylesheet.attribs.href);
  }
  const headings = exported.filter(el => el.name === 'h1');
  assert.equal(headings.length,1,page.source+' heading count');
  assert.equal(text(headings[0]),text(original.find(el => el.name === 'h1')));
  const canonical = exported.filter(el => el.name === 'link' && el.attribs.rel === 'canonical');
  assert.equal(canonical.length,1);
  assert.equal(canonical[0].attribs.href,'https://enertchad.com'+page.route);
  assert.equal(exported.find(el => el.name === 'html').attribs.lang,page.source.endsWith('-en.html')?'en':'fr');
  assert(exported.some(el => el.name === 'details' && el.attribs.class === 'sp-mobile-menu'));
  const hrefs = new Set(exported.filter(el => el.name==='a').map(el => el.attribs.href));
  for(const anchor of original.filter(el => el.name==='a'))assert(hrefs.has(anchor.attribs.href),page.source+' lost link '+anchor.attribs.href);
  const schemas = exported.filter(el => el.name==='script' && el.attribs.type==='application/ld+json');
  assert.equal(schemas.length,1);
  for(const script of schemas)JSON.parse(text(script));
  for(const tag of exported.filter(el => ['script','link'].includes(el.name))) {
    const path = tag.name === 'script' ? tag.attribs.src : tag.attribs.rel === 'stylesheet' ? tag.attribs.href : null;
    if(path?.startsWith('/'))assert((await stat('out'+path.split('?')[0])).isFile(),page.source+' missing built resource '+path);
  }
}
for(const asset of manifest.assets) {
  let original = await readFile(builtSource(asset));
  if (/^assets\/chrome\/[^/]+\.(?:css|js)$/.test(asset)) original = Buffer.from(rewriteRefs(original.toString(), versions));
  const expected = asset === 'sitemap.xml' ? commercialSitemap(original.toString()) : asset.endsWith('.css') ? minifyCss(original.toString()) : original;
  assert.equal(hash(await readFile('out/'+asset)),hash(expected),asset);
}
// Lot 27 (m10) : _headers et le .htaccess OVH figent un an (immutable) /assets/chrome/*.css|js,
// en ciblant l'extension (Apache ne voit pas la query string). Cela suppose qu'AUCUNE reference
// publiee a une feuille ou un script de /assets/chrome ne soit sans ?v=<empreinte>, y compris
// les URL construites en JavaScript ('/assets/chrome/'+nom).
const { readdir } = await import('node:fs/promises');
const scanned = /\.(?:html|js|css|json|txt|xml|webmanifest|svg)$/;
let versionedRefs = 0;
for (const entry of await readdir('out', { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !scanned.test(entry.name)) continue;
  const file = (entry.parentPath || entry.path) + '/' + entry.name;
  const body = (await readFile(file)).toString();
  for (const m of body.matchAll(/assets\/chrome\/([^"'`\s<>)\\?#*]*)(\?[^"'`\s<>)\\]*)?/g)) {
    const [, name, query = ''] = m;
    if (/\.(?:css|js)$/.test(name)) {
      assert.match(query, /^\?v=[0-9a-f]{12}$/, `${file}: /assets/chrome/${name} sans ?v= (cache immutable)`);
      versionedRefs++;
    } else if (!name) {
      // URL construite : le reste de l'expression ne doit pas designer une feuille ou un script.
      const tail = body.slice(m.index + m[0].length, m.index + m[0].length + 120).split(/[);]/)[0];
      assert(!/\.(?:css|js)\b/.test(tail), `${file}: URL /assets/chrome/ construite vers une feuille ou un script`);
    }
  }
}
assert(versionedRefs > 0);
console.log(`PASS: ${versionedRefs} /assets/chrome .css/.js references, all with ?v=<content hash>.`);
console.log(`PASS: ${preserved} HTML pages preserved with the YouTube footer badge; ${native} React pages verified; ${manifest.assets.length} assets preserved.`);

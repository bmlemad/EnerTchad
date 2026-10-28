import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { htmlToDOM } from 'html-react-parser';
import { withNavigationReview } from '../lib/navigation-review.js';
import { withYouTubeBadge } from '../lib/youtube.js';
import { renderSubsite, commercialPages, atlasPages } from './next/subsites.mjs';

function nodes(html) {
  const all = [], walk = n => { all.push(n); (n.children || []).forEach(walk); };
  htmlToDOM(html, {withStartIndices:true, withEndIndices:true}).forEach(walk); return all;
}
const digest = value => createHash('sha256').update(value).digest('hex');
const fragments = (html, tag) => nodes(html).filter(n => n.name === tag).map(n => digest(html.slice(n.startIndex, n.endIndex + 1)));
const read = path => readFileSync(path, 'utf8');
const pages = execFileSync('git', ['ls-files', '-z'], {encoding:'utf8'}).split('\0').filter(p => p.endsWith('.html') && !/^(?:scripts|qa|docs-sources)\//.test(p));

test('shared review preserves main content, scripts, contact data and remains idempotent', () => {
  assert(pages.length > 230);
  for (const page of pages) {
    const before = read(page), after = withNavigationReview(before);
    assert.equal(withNavigationReview(after), after, page + ' idempotence');
    assert.deepEqual(fragments(after, 'main'), fragments(before, 'main'), page + ' main content');
    assert.deepEqual(fragments(after, 'script'), fragments(before, 'script'), page + ' scripts');
    assert.deepEqual(after.match(/href="(?:tel:|mailto:)[^"]*"/g), before.match(/href="(?:tel:|mailto:)[^"]*"/g), page + ' contact data');
  }
});

test('corporate resources expose documents and preserve investor-specific enquiries', () => {
  for (const en of [false, true]) {
    const source = read(en ? 'index-en.html' : 'index.html'), output = withNavigationReview(source);
    const all = nodes(output), cta = all.find(n => n.name === 'a' && n.attribs?.class === 'nx-invest');
    assert.equal(cta.attribs.href, '/contact' + (en ? '-en' : '') + '#ctForm');
    assert(all.some(n => n.name === 'a' && n.attribs?.href === '/contact' + (en ? '-en' : '') + '?profil=invest#ctForm'));
    const groups = all.filter(n => n.name === 'section' && n.attribs?.class === 'nx-resource-group');
    assert.equal(groups.length, 3);
    const docs = groups[1].children.flatMap(n => [n, ...(n.children || [])]);
    assert(docs.some(n => n.name === 'a' && n.attribs?.href === '/publications' + (en ? '-en' : '')));
    assert.match(output, /et-footer-pending/);
    assert(!output.includes('id="fnForm"'));
  }
});

test('Arabic footers expose the ethical reporting destination with a language disclosure', () => {
  for (const page of pages.filter(p => p.startsWith('ar') && /<footer\b/.test(read(p)))) {
    const output = withNavigationReview(read(page));
    assert.match(output, /href="\/ethique#alerte" hreflang="fr">الإبلاغ الأخلاقي \(FR\)/, page);
  }
});

test('dedicated headers use generic requirements while retaining language pairs and footer access', () => {
  for (const [space, set] of [['boutique', commercialPages], ['atlas', atlasPages]]) {
    for (const page of set) {
      const output = renderSubsite(withYouTubeBadge(read(page.source)), page, space);
      assert(output.includes('/contact' + (page.language === 'en' ? '-en' : '') + '#ctForm'), page.source);
      assert.equal((output.match(/<footer\b/g) || []).length, 1);
      assert(output.includes('et-al-lang'), page.source);
      const nav = nodes(output).find(n => n.attribs?.id === 'nav');
      const links = nodes(output.slice(nav.startIndex,nav.endIndex+1)).filter(n => n.name === 'a');
      assert(!links.some(n => n.attribs?.href?.startsWith('https://enertchad.com')), 'public space navigation must stay on the current host');
    }
  }
});

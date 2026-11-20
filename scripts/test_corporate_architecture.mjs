import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {htmlToDOM} from 'html-react-parser';
import {corporateSections,withArchitectureWayfinding,withEditorialType,withAccessibleBackToTop} from '../lib/corporate-architecture.js';
import {withNavigationReview} from '../lib/navigation-review.js';
function nodes(html){const out=[],walk=n=>{out.push(n);(n.children||[]).forEach(walk);};htmlToDOM(html).forEach(walk);return out;}
test('six corporate sections have independent entry points and complete project and sector access',()=>{
  for(const en of [false,true]){
    const sections=corporateSections(en),s=en?'-en':'';
    assert.equal(sections.length,6);assert.equal(new Set(sections.map(x=>x.href)).size,6);
    assert.equal(sections[2].href,'/projets'+s);assert.equal(sections[3].href,'/engagements'+s);assert.equal(sections[5].href,'/investisseurs'+s);
    assert.deepEqual(sections[1].groups.map(x=>x.links.length),[4,4,5]);
    assert.equal(sections[2].groups[0].links.length,8);
    for(const section of sections){const links=section.groups.flatMap(g=>g.links.map(x=>x[0]));assert.equal(new Set(links).size,links.length,section.id);}
  }
});
test('rendered navigation has five plain header links (lot 124, then 20 Nov. 2026: two spaces), a common footer and no duplicate ids',()=>{
  for(const en of [false,true]){
    const output=withNavigationReview(readFileSync(en?'index-en.html':'index.html','utf8')),all=nodes(output);
    const links=all.filter(n=>n.name==='a'&&n.attribs.class==='nav-trigger nx-direct');assert.equal(links.length,5);
    assert.equal(all.filter(n=>n.name==='button'&&n.attribs.class==='nav-trigger').length,0);
    assert.equal(all.filter(n=>n.attribs&&'aria-controls' in n.attribs&&/^nxm-/.test(n.attribs['aria-controls'])).length,0);
    const ids=all.filter(n=>n.attribs?.id).map(n=>n.attribs.id);assert.equal(ids.length,new Set(ids).size);
    assert.equal(all.filter(n=>'data-et-corporate-sections' in (n.attribs||{})).length,0);assert(output.includes('data-et-footer-columns="2"'));
    assert.equal(withNavigationReview(output),output);
  }
});
test('hub wayfinding preserves source content and connects related sections without adding claims',()=>{
  for(const [file,href]of [['projets.html','/investisseurs'],['projets-en.html','/investisseurs-en'],['engagements.html','/communautes'],['savoirs-en.html','/communiques-en']]){
    const source=readFileSync(file,'utf8'),out=withArchitectureWayfinding(source);assert(out.includes('id="et-architecture-context"'));assert(out.includes('href="'+href+'"'));assert.equal(withArchitectureWayfinding(out),out);
    assert.equal(out.replace(/<nav id="et-architecture-context"[\s\S]*?<\/nav>/,''),source);
  }
});
test('editorial labels reuse only the actual publication date and remain separate from official news',()=>{
  const source='<html lang="fr"><head><link rel="canonical" href="https://enertchad.com/journal-test"><script type="application/ld+json">{"datePublished":"2025-03-08"}</script></head><body><main><p>Texte conservé</p></main></body></html>';
  const out=withEditorialType(source);assert(out.includes('data-et-content-kind="analysis"'));assert(out.includes('datetime="2025-03-08"'));assert.equal(withEditorialType(out),out);
  const undated=withEditorialType(source.replace('"2025-03-08"','null'));assert(!undated.includes('<time'));
  const official=withEditorialType(source.replace('/journal-test','/communiques'));assert(official.includes('data-et-content-kind="official"'));assert(!official.includes('<time'));
});
test('the named back-to-top button keeps its label while its decorative arrow is hidden from assistive technology',()=>{
 const input='<button id="toTop" aria-label="Back to top"><svg viewBox="0 0 24 24"><path d="M1 2"/></svg></button><svg aria-label="Diagram"></svg>';
 const out=withAccessibleBackToTop(input);assert(out.includes('aria-label="Back to top"'));assert(out.includes('<svg aria-hidden="true" focusable="false" viewBox='));assert(out.endsWith('<svg aria-label="Diagram"></svg>'));assert.equal(withAccessibleBackToTop(out),out);
});
// 17 novembre 2026 : ligne « Dernier communiqué » sous le héros de l'accueil, lue dans la liste officielle (lib/latest-release.js).
import {withLatestRelease} from '../lib/latest-release.js';
test('home shows the latest press release from the official list, once, and other pages are untouched',()=>{
  for(const en of [false,true]){
    const list=readFileSync(en?'communiques-en.html':'communiques.html','utf8');
    const first=list.match(/<ol class="pp-releases">\s*<li id="cp-\d+">[\s\S]*?<\/li>/)[0];
    const date=first.match(/<time datetime="([^"]+)">/)[1],ref=first.match(/<span>(CP-\d{4}-\d+)<\/span>/)[1],href=first.match(/<h2><a href="([^"]+)">/)[1];
    const out=withLatestRelease(readFileSync(en?'index-en.html':'index.html','utf8'));
    const line=out.match(/<aside class="et-cp"[\s\S]*?<\/aside>/)[0];
    assert(line.includes('datetime="'+date+'"'));assert(line.includes(ref));assert(line.includes('href="'+href+'"'));
    assert(line.includes('<span class="et-nw">'+ref+'</span>'),'lot 144 : la référence ne se coupe pas');
    assert(out.indexOf('<aside class="et-cp"')>out.indexOf('<header class="et-hero"'));
    assert.equal(out.match(/class="et-cp"/g).length,1);assert.equal(withLatestRelease(out),out);
  }
  for(const page of ['societe.html','communiques.html','ar.html']){const src=readFileSync(page,'utf8');assert.equal(withLatestRelease(src),src,page);}
});

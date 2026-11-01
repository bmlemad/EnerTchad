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
    assert.deepEqual(sections[1].groups.map(x=>x.links.length),[4,4,6]);
    assert.equal(sections[2].groups[0].links.length,8);
    for(const section of sections){const links=section.groups.flatMap(g=>g.links.map(x=>x[0]));assert.equal(new Set(links).size,links.length,section.id);}
  }
});
test('rendered navigation has six matching disclosure regions, a common footer and no duplicate ids',()=>{
  for(const en of [false,true]){
    const output=withNavigationReview(readFileSync(en?'index-en.html':'index.html','utf8')),all=nodes(output);
    const buttons=all.filter(n=>n.name==='button'&&n.attribs.class==='nav-trigger');assert.equal(buttons.length,6);
    for(const b of buttons){assert.equal(b.attribs['aria-expanded'],'false');assert.equal(all.filter(n=>n.attribs?.id===b.attribs['aria-controls']).length,1);}
    const ids=all.filter(n=>n.attribs?.id).map(n=>n.attribs.id);assert.equal(ids.length,new Set(ids).size);
    assert.equal(all.filter(n=>'data-et-corporate-sections' in (n.attribs||{})).length,1);
    assert.equal(withNavigationReview(output),output);
  }
});
test('hub wayfinding preserves source content and connects related sections without adding claims',()=>{
  for(const [file,href]of [['projets.html','/investisseurs'],['projets-en.html','/investisseurs-en'],['engagements.html','/communautes'],['publications-en.html','/communiques-en']]){
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

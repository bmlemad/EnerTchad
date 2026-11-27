import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {withMainNav} from '../lib/main-nav.js';
import {withStructureReview} from '../lib/structure-review.js';
import {htmlToDOM} from 'html-react-parser';
const nav=JSON.parse(readFileSync('assets/data/navigation.json','utf8'));
const read=p=>readFileSync(p,'utf8');
const files=readdirSync('.',{recursive:true}).filter(p=>p.endsWith('.html')&&!/^(?:node_modules|out|public|\.next|\.generated|qa|scripts|docs-sources)\//.test(p));
const nodes=html=>{const out=[];const walk=n=>{out.push(n);(n.children||[]).forEach(walk);};htmlToDOM(html).forEach(walk);return out;};
const exists=href=>{const p=href.split('#')[0];return p==='/'||existsSync(p.slice(1)+'.html')||existsSync(p.replace(/\/$/,'').slice(1)+'/index.html')||['/atlas-en','/atlas/','/boutique/clients','/boutique/en/clients'].includes(p);};
test('six global entries and five business segments in both languages',()=>{
 assert.deepEqual(nav.header.fr.links.map(l=>l[0]),['Le Groupe','Activités','Solutions clients','Impact','Investisseurs','Ressources']);
 assert.deepEqual(nav.header.en.links.map(l=>l[0]),['The Group','Activities','Client solutions','Impact','Investors','Resources']);
 for(const lang of ['fr','en']){
  const cfg=nav.header[lang];assert.equal(cfg.panels.length,4);
  for(const [,href] of cfg.links)assert(exists(href),href);
  const business=cfg.panels.find(p=>p.id==='activites');assert.equal(business.links.length,5);
  assert.equal(business.links.at(-1)[0],lang==='en'?'Engineering & Services':'Ingénierie & Services');
  for(const p of cfg.panels){assert(cfg.links.some(l=>l[1]===p.for));for(const l of [...p.links,...(p.extra?[p.extra]:[])])assert(exists(l[2]),l[2]);assert(exists(p.overview[1]));}
 }
});
test('all shared headers keep unique controls, one current section and contact details',()=>{
 let checked=0;
 for(const file of files){
  const source=read(file);if(!/<nav\b[^>]*class="nav nx pn"/.test(source))continue;
  const out=withMainNav(source),lang=/<html\b[^>]*lang="en"/.test(source)?'en':'fr',all=nodes(out);
  const links=all.filter(n=>n.name==='a'&&/\bnx-direct\b/.test(n.attribs?.class||''));
  assert.deepEqual(links.map(n=>n.attribs.href),nav.header[lang].links.map(l=>l[1]),file);
  assert(links.filter(n=>n.attribs['aria-current']).length<=1,file+' current section');
  const toggles=all.filter(n=>n.attribs?.class==='et-sub-tog');assert.equal(toggles.length,4,file);
  for(const t of toggles)assert.equal(all.filter(n=>n.attribs?.id===t.attribs['aria-controls']).length,1,file+' panel');
  assert.equal(withMainNav(out),out,file+' idempotence');
  assert.deepEqual(out.match(/href="(?:tel:|mailto:)[^"]*"/g),source.match(/href="(?:tel:|mailto:)[^"]*"/g),file+' contacts');checked++;
 }assert(checked>220);
});
test('business, group and resource pages mark their owning section',()=>{
 for(const [file,href] of [['amont/index.html','/nos-activites'],['enerconseils/index.html','/nos-activites'],['societe.html','/groupe'],['leadership.html','/groupe'],['publications.html','/savoirs'],['journal-prix-litre.html','/savoirs'],['investisseurs.html','/investisseurs']]){
  const marked=nodes(withMainNav(read(file))).filter(n=>n.name==='a'&&/\bnx-direct\b/.test(n.attribs?.class||'')&&n.attribs['aria-current']);
  assert.deepEqual(marked.map(n=>n.attribs.href),[href],file);
 }
});
test('footer legal links are deduplicated; Arabic fallback is explicit',()=>{
 const source='<html lang="fr"><head><link rel="canonical" href="https://enertchad.com/savoirs"></head><main><h1>Ressources</h1></main><footer><a href="/cookies">Cookies</a><a href="/cookies">Cookies</a><a href="/contact">Contact</a></footer></html>';
 const out=withStructureReview(source);
 assert.equal((out.match(/href="\/cookies"/g)||[]).length,1);assert(out.includes('href="/publications"'));assert(out.includes('href="/contact"'));assert.equal(withStructureReview(out),out);
 const ar=withStructureReview(read('ar.html'));assert(ar.includes('hreflang="en">Resources (EN)'));assert(ar.includes('hreflang="fr">Solutions clients (FR)'));
});
test('search data deduplicates hub aliases and uses segment labels',()=>{
 for(const lang of ['fr','en']){
  const data=JSON.parse(read('assets/data/recherche-'+lang+'.json')),hrefs=data.map(e=>e.u.replace(/\/$/,''));
  assert.equal(new Set(hrefs).size,hrefs.length);assert(!hrefs.some(u=>/^\/aval\/index(?:#|$)/.test(u)));
  const hub=data.find(e=>e.u.replace(/\/$/,'')===(lang==='fr'?'/aval':'/pole-aval-en'));
  assert.equal(hub?.t,lang==='fr'?'Raffinage & Distribution':'Refining & Distribution');
 }
});

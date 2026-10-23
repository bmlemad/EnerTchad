import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {snapshotSources,recordTransformed,restoreSources} from './next/sources.mjs';
// Lot 26 (m16) : la transformation est executee sur l'arbre, puis les sources sont restaurees.
const pristine=await snapshotSources();
execFileSync('python3',['scripts/apply_readiness_20261013.py']);
await recordTransformed(pristine,{copies:false});
after(()=>restoreSources());
import {moderniseClients} from './next/clients.mjs';
const read=p=>readFileSync(p,'utf8');
test('priority search is short and bilingual without truncating the searchable index',()=>{
 for(const file of ['c_abd9013c3955.js','c_df4f446df566.js']){
  const s=read('assets/chrome/'+file);
  const fn=s.match(/function priorityRoutes\(\)\{[\s\S]*?\n  \}/)[0];
  for(const EN of [false,true]){
   const routes=vm.runInNewContext(fn+';priorityRoutes()',{EN});
   assert.equal(routes.length,6);assert.equal(new Set(routes.map(r=>r.url)).size,6);
   assert.equal(routes[0].url,EN?'/boutique/en/clients':'/boutique/clients');
  }
  assert(s.includes('idx.forEach(it=>'));assert(s.includes('current=sc.map'));
 }
});
test('customer reference links open all enclosing disclosures, including encoded hashes',()=>{
 let handler;
 const outer={tagName:'DETAILS',open:false,parentElement:null};
 const inner={tagName:'DETAILS',open:false,parentElement:outer};
 const target={parentElement:inner,scrollIntoView(){this.scrolled=true;}};
 vm.runInNewContext(read('assets/chrome/clients-reference.js'),{document:{getElementById:id=>id==='opérateurs'?target:null,addEventListener(){}},location:{hash:'#op%C3%A9rateurs'},addEventListener:(n,fn)=>{handler=fn;},requestAnimationFrame:fn=>fn()});
 assert(outer.open&&inner.open&&target.scrolled);assert.equal(typeof handler,'function');
});
test('both customer layouts expose three direct enquiry contacts and preserve legacy anchors',()=>{
 for(const en of [false,true]){
  // Sources are prepared by the readiness migration in CI's existing subsites check.
  const html=read(en?'clients-en.html':'clients.html');
  assert(html.includes('id="besoin-client"'));
  const result=moderniseClients(html,en);
  assert.equal((result.match(/class="ec-contact"/g)||[]).length,3);
  assert.equal((result.match(/class="ec-reference"/g)||[]).length,2);
  for(const id of ['industriels','flottes','operateurs','particuliers','programmes','parcours'])assert(result.includes('id="'+id+'"'));
  assert(result.includes('?profil=ep#ctForm'));
 }
});

test('published editorial copy and evidence match the six QA decisions in both languages',()=>{
 for(const en of [false,true]){
  const suffix=en?'-en':'';
  const products=read('aval/produits'+suffix+'.html');
  assert.match(products,en?/local refining is a future project/:/le raffinage local est un projet futur/);
  assert(!products.includes('every product refined and distributed in-country'));
  assert(!products.includes('chaque produit raffiné et distribué au pays'));
  const contact=read('contact'+suffix+'.html');
  assert.match(contact,/<option[^>]*data-contact-profile="ep"[^>]*>/);
  const shop=read('aval/boutique'+suffix+'.html');
  assert(!shop.includes('My order'));assert(!shop.includes('Ma commande'));
  const projects=read('projets'+suffix+'.html').match(/<section id="avancement"[\s\S]*?<\/section>/)[0];
  assert.equal((projects.match(/data-project-evidence="unpublished"/g)||[]).length,16);
  assert(projects.includes(en?'22 October 2026':'22 octobre 2026'));
 }
});

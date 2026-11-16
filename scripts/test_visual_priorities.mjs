import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {withVisualPriorities} from '../lib/visual-priorities.js';
const read=p=>readFileSync(p,'utf8');
for(const path of ['amont/index.html','pole-amont-en.html'])test(`upstream groups retain every technical item and deep link: ${path}`,()=>{
  const source=read(path),out=withVisualPriorities(source);
  const section=s=>s.match(/<section id="offre"[\s\S]*?<\/section>/)[0];
  const items=s=>[...s.matchAll(/<li>[\s\S]*?<\/li>/g)].map(m=>m[0]);
  assert.deepEqual(items(section(out)),items(section(source)));
  assert.equal((section(out).match(/<details>/g)||[]).length,3);
  for(const id of [...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]))assert(out.includes(`id="${id}"`),id);
  assert(out.includes('activite=amont&amp;profil=ep&amp;service=faisabilite#ctForm'));
  assert.equal(withVisualPriorities(out),out);
});
for(const path of ['contact.html','contact-en.html'])test(`contact shortcut preserves the form and receiver: ${path}`,()=>{
  const source=read(path),out=withVisualPriorities(source);
  const form=s=>s.match(/<form id="ctForm"[\s\S]*?<\/form>/)[0];
  assert.equal(form(out),form(source));
  assert(out.match(/<header[^>]+min-height:0!important[\s\S]*?href="#ctForm"/));
  assert.equal(withVisualPriorities(out),out);
});
test('engineering image and preloads use existing fingerprinted technical assets; unrelated pages stay unchanged',()=>{
  for(const path of ['enerconseils/index.html','pole-enerconseils-en.html']){
    const out=withVisualPriorities(read(path));
    assert(!out.includes('lac-tchad-espace'));
    assert(out.includes('complexe-industriel-1400.webp?v='));
    assert(out.includes('complexe-industriel-m720.avif?v='));
    assert.equal(withVisualPriorities(out),out);
  }
  const source=read('index.html');assert.equal(withVisualPriorities(source),source);
});

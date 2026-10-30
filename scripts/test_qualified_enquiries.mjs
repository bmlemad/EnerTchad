import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {htmlToDOM} from 'html-react-parser';
import {withQualifiedEnquiries} from '../lib/qualified-enquiries.js';
import {renderSubsite,commercialPages} from './next/subsites.mjs';
const require=createRequire(import.meta.url);
const {kindFor,summary}=require('../assets/chrome/qualified-enquiries.js');
const read=p=>readFileSync(p,'utf8');
function nodes(html){const all=[],walk=n=>{all.push(n);(n.children||[]).forEach(walk);};htmlToDOM(html).forEach(walk);return all;}

test('engineering assignments retain limits and outputs, add four scoping briefs, and use the engineering profile',()=>{
  for(const p of ['enerconseils/index.html','pole-enerconseils-en.html']){
    const before=read(p),after=withQualifiedEnquiries(before),all=nodes(after);
    assert.equal(withQualifiedEnquiries(after),after);
    assert.equal(all.filter(n=>n.attribs&&'data-engineering-brief' in n.attribs).length,4);
    for(const key of ['faisabilite','conception','assistance','suivi'])assert(after.includes('profil=ep&amp;service='+key));
    assert(after.includes('Livrables envisagés')||after.includes('Expected outputs'));
    assert(after.includes('société en constitution')||after.includes('company in formation'));
    assert.equal((after.match(/id="ingenierie"/g)||[]).length,1);
  }
});
test('optional qualification keeps existing fields and contact routing intact in both languages',()=>{
  for(const p of ['contact.html','contact-en.html']){
    const before=read(p),after=withQualifiedEnquiries(before),all=nodes(after);
    assert.equal(withQualifiedEnquiries(after),after);
    for(const id of ['ctType','ctName','ctOrg','ctMail','ctMsg','ctSend'])assert.equal(all.filter(n=>n.attribs?.id===id).length,1);
    assert.equal(all.filter(n=>n.name==='fieldset'&&n.attribs?.disabled!==undefined).length,3);
    const root=all.find(n=>n.attribs?.id==='et-enquiry');
    const descendants=[];const walk=n=>{descendants.push(n);(n.children||[]).forEach(walk);};walk(root);
    assert(!descendants.some(n=>n.attribs&&'required' in n.attribs));
    assert(after.includes('name="requirements"'));
    assert.equal((after.match(/qualified-enquiries\.js/g)||[]).length,1);
    assert.deepEqual(after.match(/href="(?:mailto:|tel:)[^"]*"/g),before.match(/href="(?:mailto:|tel:)[^"]*"/g));
  }
  assert.equal(withQualifiedEnquiries(read('ar-contact.html')),read('ar-contact.html'));
});
test('fleet enquiries retain their B2B profile and distinguish the fleet requirement',()=>{
  for(const p of commercialPages.filter(p=>p.kind==='clients')){
    const result=renderSubsite(withQualifiedEnquiries(read(p.source)),p,'boutique');
    assert(result.includes('profil=b2b&amp;besoin=flotte#ctForm'));
    assert(result.includes('profil=ep#ctForm'));
  }
});
test('only the selected business context contributes to the receiver summary',()=>{
  assert.equal(kindFor('ep','supply'),'engineering');
  assert.equal(kindFor('b2b','fleet'),'fleet');
  assert.equal(kindFor('b2b','unknown'),'supply');
  for(const profile of ['invest','partenariat','','unknown'])assert.equal(kindFor(profile,'fleet'),'');
  assert.equal(summary('fleet',{'eq-vehicles':'12','eq-fleet-location':'N’Djamena','eq-product':'Diesel'},true),'Requirement: Fleet management\nVehicles: 12\nOperating areas: N’Djamena');
  assert.equal(summary('supply',{'eq-product':'Diesel','eq-volume':'2 000 L/mois'},false),'Besoin : Approvisionnement en carburants\nProduit: Diesel\nVolume et unité: 2 000 L/mois');
  assert.equal(summary('fleet',{},false),'Besoin : Gestion de flottes');
  assert.equal(summary('',{'eq-product':'Diesel'},false),'');
  assert(read('scripts/ovh/contact.php').includes("$requirements = $field('requirements', 1600)"));
});

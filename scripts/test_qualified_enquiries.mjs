import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {htmlToDOM} from 'html-react-parser';
import {withQualifiedEnquiries} from '../lib/qualified-enquiries.js';
import {renderSubsite,commercialPages} from './next/subsites.mjs';
const require=createRequire(import.meta.url);
const {kindFor,summary,contextFor}=require('../assets/chrome/qualified-enquiries.js');
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
    assert(after.includes(p==='contact.html'?'Ingénierie / services techniques — étude / projet':'Engineering / technical services — study / project'));
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

function formFixture(lang='fr',search='?profil=ep&service=faisabilite',contextData) {
  const controls={},events={},capture={},links=[{href:'/contact-en?profil=ep#ctForm',getAttribute(){return this.href;},setAttribute(k,v){this.href=v;}}];
  function field(id,value=''){return controls[id]={id,value,tagName:'INPUT',required:false};}
  for(const id of ['eq-product','eq-volume','eq-frequency','eq-supply-location','eq-supply-date','eq-vehicles','eq-fleet-location','eq-fleet-needs','eq-fleet-date','eq-installation','eq-phase','eq-engineering-location','eq-deliverable','eq-engineering-date','et-enquiry-summary'])field(id);
  field('et-enquiry-mode','supply');field('et-enquiry-business');
  const service=field('eq-service');service.tagName='SELECT';service.options=[{value:'',textContent:'À définir'},...['faisabilite','conception','assistance','suivi'].map(value=>({value,textContent:value}))];
  Object.defineProperty(service,'selectedIndex',{get(){return this.options.findIndex(o=>o.value===this.value);}});
  const type=field('ctType',new URLSearchParams(search).get('profil')==='b2b'?'Approvisionnement':'Engineering');
  type.options=[{value:'',dataset:{}},{value:'Approvisionnement',dataset:{}},{value:'Engineering',dataset:{contactProfile:'ep'}},{value:'Investment',dataset:{}}];type.dispatchEvent=()=>{};
  const groups=['supply','fleet','engineering'].map(kind=>({hidden:false,disabled:false,getAttribute(){return kind;}}));
  const help={hidden:false};controls['et-enquiry']={querySelectorAll(){return groups;},querySelector(){return help;}};
  if(contextData){controls['et-enquiry-context-data']={textContent:JSON.stringify(contextData)};controls['et-enquiry-context']={hidden:true,textContent:''};}
  controls.ctForm={addEventListener(name,fn,phase){events[name]=fn;capture[name]=phase;}};
  runInNewContext(read('assets/chrome/qualified-enquiries.js'),{module:{exports:{}},URL,URLSearchParams,Event:class{},location:{search,origin:'https://enertchad.com'},setTimeout(fn){fn();},document:{documentElement:{lang},getElementById(id){return controls[id];},querySelectorAll(){return links;}}});
  return {controls,groups,links,capture,events,change(id,value){controls[id].value=value;events.change({target:controls[id]});},input(id,value){controls[id].value=value;events.input({target:controls[id]});}};
}
test('visible context prepares only its own fields and discards hidden groups from the receiver summary',()=>{
  const f=formFixture();
  assert.deepEqual(f.groups.map(g=>g.disabled),[true,true,false]);
  f.input('eq-installation','QA engineering');f.input('eq-vehicles','99');
  assert.match(f.controls['et-enquiry-summary'].value,/QA engineering/);
  assert(!f.controls['et-enquiry-summary'].value.includes('99'));
  f.change('ctType','Approvisionnement');f.change('et-enquiry-mode','fleet');
  assert.deepEqual(f.groups.map(g=>g.disabled),[true,false,true]);
  assert.match(f.controls['et-enquiry-summary'].value,/Véhicules: 99/);
  assert(!f.controls['et-enquiry-summary'].value.includes('QA engineering'));
  f.change('ctType','Investment');
  assert(f.groups.every(g=>g.disabled&&g.hidden));assert.equal(f.controls['et-enquiry-summary'].value,'');
});
test('language links preserve the chosen service or fleet kind without including entered text',()=>{
  const f=formFixture();
  f.input('eq-installation','QA engineering');
  assert(f.links[0].href.includes('service=faisabilite'));assert(!f.links[0].href.includes('QA'));
  f.change('eq-service','');assert(!f.links[0].href.includes('service='));
  f.change('ctType','Approvisionnement');f.change('et-enquiry-mode','fleet');assert(f.links[0].href.includes('besoin=flotte'));
  const en=formFixture('en','?profil=b2b&besoin=flotte');assert.equal(en.controls['et-enquiry-mode'].value,'fleet');
  assert.equal(en.controls['et-enquiry-summary'].value,'Requirement: Fleet management');
});
test('submit preparation precedes the receiver and reset clears context',()=>{
  const f=formFixture();f.controls['eq-installation'].value='Last entered detail';
  assert.equal(f.capture.submit,true);f.events.submit();assert.match(f.controls['et-enquiry-summary'].value,/Last entered detail/);
  f.controls.ctType.value='';f.controls['eq-service'].value='';f.events.reset();
  assert.equal(f.controls['et-enquiry-summary'].value,'');assert(f.groups.every(g=>g.disabled));
});
test('project and sector context is localized, restricted to known references, and sent with the active details',()=>{
  const data=JSON.parse(read('assets/data/business-journeys.json'));
  const project=contextFor('?projet=pilotes-eor&secteur=operateurs-petroliers',data,true);
  assert(project.label.includes(data.projects['pilotes-eor'].en));assert(project.label.includes(data.sectors['operateurs-petroliers'].en));
  for(const query of ['?projet=unknown','?secteur=__proto__','?projet=constructor'])assert.equal(contextFor(query,data,false).label,'');
  const f=formFixture('fr','?profil=b2b&besoin=flotte&secteur=transport-flottes',data);
  assert.equal(f.controls['et-enquiry-context'].hidden,false);
  assert(f.controls['et-enquiry-summary'].value.includes('Secteur : Transport & flottes'));
  assert(f.links[0].href.includes('secteur=transport-flottes'));
  f.input('eq-vehicles','18');assert(f.controls['et-enquiry-summary'].value.includes('Véhicules: 18'));assert(!f.links[0].href.includes('18'));
  f.controls.ctType.value='';f.events.reset();assert.equal(f.controls['et-enquiry-context'].hidden,true);assert.equal(f.controls['et-enquiry-summary'].value,'');assert(!f.links[0].href.includes('secteur='));
});

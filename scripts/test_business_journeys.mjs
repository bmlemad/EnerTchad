import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {htmlToDOM} from 'html-react-parser';
import {withBusinessJourneys} from '../lib/business-journeys.js';
import {withYouTubeBadge} from '../lib/youtube.js';
import {renderSubsite,commercialPages} from './next/subsites.mjs';
const read=p=>readFileSync(p,'utf8');
const data=JSON.parse(read('assets/data/business-journeys.json'));
function nodes(html){const all=[],walk=n=>{all.push(n);(n.children||[]).forEach(walk);};htmlToDOM(html).forEach(walk);return all;}
const text=n=>n?.data||(n?.children||[]).map(text).join('');

test('eight project records preserve status, prerequisites and evidence while exposing dates and contextual contacts',()=>{
  for(const lang of ['fr','en']){
    const before=read(lang==='fr'?'projets.html':'projets-en.html'),after=withBusinessJourneys(before),all=nodes(after);
    assert.equal(withBusinessJourneys(after),after);
    const cards=all.filter(n=>n.attribs?.['data-project-reference']);assert.equal(cards.length,8);
    assert.equal(all.filter(n=>n.attribs?.class==='et-project-date').length,8);
    assert.equal(all.filter(n=>n.attribs?.class==='et-project-proof').length,8);
    assert.equal(all.filter(n=>n.name==='time'&&n.attribs.datetime==='2026-10-08').length,8);
    for(const key of Object.keys(data.projects)){
      assert(all.some(n=>n.attribs?.id==='projet-'+key));
      assert(all.some(n=>n.name==='a'&&n.attribs.href===`/contact${lang==='en'?'-en':''}?profil=partenariat&projet=${key}#ctForm`));
    }
    assert.equal((after.match(/data-project-evidence="unpublished"/g)||[]).length,(before.match(/data-project-evidence="unpublished"/g)||[]).length);
    for(const node of nodes(before).filter(n=>n.name==='article'&&n.attribs?.class==='mod-card')){
      const title=text(node.children.find(n=>n.name==='h3'));
      const parts=node.children.map(text).filter(s=>s.trim());
      assert(cards.some(n=>text(n).includes(title)&&parts.every(part=>text(n).includes(part))),title+' lost existing status or evidence text');
    }
    for(const a of nodes(before).filter(n=>n.name==='a'&&n.attribs.href))assert(all.some(n=>n.name==='a'&&n.attribs.href===a.attribs.href));
  }
});
test('review date is read from the published text and existing anchors remain intact',()=>{
  const source='<html lang="fr"><head></head><body><section id="avancement"><p>Informations revues le 9 novembre 2028.</p><article id="existing" class="mod-card"><h3>Water-to-Value</h3><p>Statut inchangé</p></article></section></body></html>';
  const output=withBusinessJourneys(source);
  assert(output.includes('datetime="2028-11-09"'));assert(output.includes('id="existing"'));assert(output.includes('Statut inchangé'));
  assert(!output.includes('class="et-project-proof"'),'do not invent an evidence state');
});
test('three sector pathways retain source details, useful resources and scoped enquiry links',()=>{
  for(const page of commercialPages.filter(p=>p.kind==='clients')){
    const source=read(page.source),decorated=withBusinessJourneys(source);
    assert.equal(withBusinessJourneys(decorated),decorated);
    const all=nodes(decorated),blocks=all.filter(n=>n.attribs?.['data-sector-journey']);assert.equal(blocks.length,3);
    assert.equal(all.filter(n=>n.attribs?.class==='et-sector-resources').length,3);
    const output=renderSubsite(withYouTubeBadge(source),page,'boutique'),rendered=nodes(output);
    for(const key of Object.keys(data.sectors))assert(rendered.some(n=>n.name==='a'&&(n.attribs.href||'').includes('secteur='+key)));
    assert(rendered.some(n=>n.name==='b'&&text(n)===data.sectors['industrie-chantiers'][page.language]));
    const ids=rendered.map(n=>n.attribs?.id).filter(Boolean);assert.equal(ids.length,new Set(ids).size);
    const before=nodes(source);
    for(const id of ['industriels','flottes','operateurs'])assert(text(all.find(n=>n.attribs?.id===id)).includes(text(before.find(n=>n.attribs?.id===id))));
  }
});
test('public contact pages receive safe localized context data once; Arabic remains unchanged',()=>{
  for(const page of ['contact.html','contact-en.html']){
    const output=withBusinessJourneys(read(page)),all=nodes(output);
    const contexts=all.filter(n=>n.attribs?.id==='et-enquiry-context-data');assert.equal(contexts.length,1);
    assert.deepEqual(JSON.parse(text(contexts[0])),data);
    assert.equal(withBusinessJourneys(output),output);
    assert(withYouTubeBadge(read(page)).includes('id="et-enquiry-context"'));
  }
  assert.equal(withBusinessJourneys(read('ar-contact.html')),read('ar-contact.html'));
});

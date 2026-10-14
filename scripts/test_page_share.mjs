import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {withPageShare} from '../lib/page-share.js';
const client = readFileSync('assets/chrome/page-share.js','utf8');
for(const [lang,label] of [['fr','Partager cette page'],['en','Share this page'],['ar','مشاركة هذه الصفحة']]) {
  test(`footer sharing ${lang}: server button is localized, adjacent and unique`,()=>{
    const source=`<html lang="${lang}"><body><footer><div class="foot-social"><a href="https://example.test">Network</a></div></footer></body></html>`;
    const html=withPageShare(source);
    assert(html.includes(`aria-label="${label}"`));
    assert(html.indexOf('<button')>html.indexOf('</a>'));
    assert.equal((html.match(/data-page-share/g)||[]).length,1);
    assert.equal((html.match(/page-share\.js/g)||[]).length,1);
    assert.equal(withPageShare(html),html);
    assert.equal(withPageShare('<html><body>Plain page</body></html>'),'<html><body>Plain page</body></html>');
  });
}
function harness(navigator,lang='fr',canonical='https://enertchad.com/boutique/') {
  const nodes=[];
  function element(){return {style:{},hidden:false,setAttribute(){},insertAdjacentElement(_,node){nodes.push(node)},focus(){this.focused=true},select(){this.selected=true}}}
  const button=element();button.dataset={};button.disabled=true;button.parentElement=element();button.addEventListener=(_,fn)=>{button.click=fn};
  const document={documentElement:{lang},title:'Boutique | EnerTchad',querySelectorAll:()=>[button],querySelector:()=>canonical?{href:canonical}:null,createElement:element};
  vm.runInNewContext(client,{document,navigator,location:{origin:'https://enertchad.com',pathname:'/boutique/',href:'https://enertchad.com/boutique/?utm_source=qa#order'},URL});
  return {button,status:nodes[0],input:nodes[1]};
}
test('native sharing passes the page title and canonical URL without tracking parameters',async()=>{
 let data,copied=0;const h=harness({share:async d=>{data=d},clipboard:{writeText:async()=>copied++}});
 assert(!h.button.disabled);await h.button.click();assert.equal(data.url,'https://enertchad.com/boutique/');assert.equal(data.title,'Boutique | EnerTchad');assert.equal(copied,0);assert(h.status.hidden);
});
test('native cancellation does not copy a link or show a failure',async()=>{
 let copies=0;const h=harness({share:async()=>{throw {name:'AbortError'}},clipboard:{writeText:async()=>copies++}});
 await h.button.click();assert.equal(copies,0);assert(h.status.hidden);assert(h.input.hidden);
});
test('unsupported or rejected native sharing copies the link',async()=>{
 for(const share of [undefined,async()=>{throw {name:'NotAllowedError'}}]) {
  let value;const h=harness({share,clipboard:{writeText:async v=>{value=v}}},'en');
  await h.button.click();assert.equal(value,'https://enertchad.com/boutique/');assert.equal(h.status.textContent,'Link copied');assert(!h.status.hidden);
 }
});
test('clipboard refusal displays a selectable link without reporting a false copy',async()=>{
 const h=harness({clipboard:{writeText:async()=>{throw Error('denied')}}},'ar');
 await h.button.click();assert(h.input.focused&&h.input.selected);assert(!h.input.hidden);assert.equal(h.input.value,'https://enertchad.com/boutique/');assert.equal(h.status.textContent,'انسخ هذا الرابط لمشاركة الصفحة.');
});
test('external canonical URL is ignored',async()=>{
 let value;const h=harness({clipboard:{writeText:async v=>{value=v}}},'fr','https://external.invalid/tracker');
 await h.button.click();assert.equal(value,'https://enertchad.com/boutique/');
});
test('repeated clicks while the share sheet is open do not start a second request',async()=>{
 let requests=0,finish;const h=harness({share:()=>{requests++;return new Promise(r=>{finish=r})}});
 const pending=h.button.click();await h.button.click();assert.equal(requests,1);finish();await pending;
});

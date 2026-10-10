import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

for (const lang of ['fr', 'en']) test(`Boutique ${lang}: packaging, quote and dialog regressions`, () => {
  const html = readFileSync(`aval/boutique${lang === 'en' ? '-en' : ''}.html`, 'utf8');
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('var CATS='));
  const listeners = {}, elements = new Map();
  const document = {
    addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
    querySelectorAll() { return []; },
    getElementById(id) { if (!elements.has(id)) elements.set(id, element(id)); return elements.get(id); },
    body: { children: [], style: { overflow: 'auto' } },
  };
  function element(id) {
    const classes = new Set();
    return { id, value: '1', innerHTML: '', textContent: '', isConnected: true, inert: false,
      classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
      addEventListener() {}, scrollIntoView() {}, getClientRects: () => [1],
      focus() { document.activeElement = this; },
      querySelectorAll() { return this.controls || []; },
      contains(el) { return (this.controls || []).includes(el); },
    };
  }
  const opener = element('oCta'), background = element('main'), preInert = element('already-inert');
  preInert.inert = true; elements.set('oCta', opener);
  const quote = document.getElementById('modal'), detail = document.getElementById('dmodal');
  quote.controls = [element('close-quote'), element('mail'), element('understood')];
  detail.controls = [element('close-detail'), element('add-detail')];
  document.body.children = [background, preInert, quote, detail];
  document.activeElement = opener;
  const context = vm.createContext({ document, window: { innerWidth: 1200 }, encodeURIComponent });
  vm.runInContext(script, context);
  const diesel = context.P[0];
  document.getElementById('pk0').value = diesel[11][1];
  document.getElementById('q0').value = '2'; context.add(0);
  document.getElementById('pk0').value = diesel[11][0];
  document.getElementById('q0').value = '5'; context.add(0);
  assert.equal(Object.keys(context.cart).length, 2);
  assert.equal(context.cart['0:1'].q, 2); assert.equal(context.cart['0:0'].q, 5);
  assert.match(document.getElementById('olist').innerHTML, /data-cart-key="0:1"/);
  context.checkout();
  const body = new URL(document.getElementById('mMail').href).searchParams.get('body');
  assert(body.includes(`2 × ${diesel[11][1]}`)); assert(body.includes(`5 × ${diesel[11][0]}`));
  assert(context.window.__qtxt.includes(`2 × ${diesel[11][1]}`));
  assert.equal(document.activeElement, quote.controls[0]); assert(background.inert); assert(detail.inert);
  function key(key, shiftKey = false) {
    const event = { key, shiftKey, prevented: false, preventDefault() { this.prevented = true; }, stopPropagation() {} };
    listeners.keydown.forEach(fn => fn(event)); return event;
  }
  quote.controls.at(-1).focus(); assert(key('Tab').prevented); assert.equal(document.activeElement, quote.controls[0]);
  assert(key('Tab', true).prevented); assert.equal(document.activeElement, quote.controls.at(-1));
  key('Escape'); assert.equal(document.activeElement, opener); assert(!background.inert); assert(preInert.inert);
  assert.equal(document.body.style.overflow, 'auto'); assert(!quote.classList.contains('on'));
  document.getElementById('q0').value = '3'; context.add(0);
  assert.equal(context.cart['0:0'].q, 8); assert.equal(context.cart['0:1'].q, 2);
  context.rm('0:0'); assert.equal(Object.keys(context.cart).length, 1); assert.equal(context.cart['0:1'].q, 2);
  context.openDetail(4); assert.equal(document.activeElement, detail.controls[0]);
  key('Escape'); assert.equal(document.activeElement, opener); assert(!background.inert);
  assert.equal(context.P[4][3], lang === 'fr' ? 'Bouteille GPL' : 'LPG cylinder');
});

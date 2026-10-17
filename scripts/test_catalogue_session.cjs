const test = require('node:test');
const assert = require('node:assert/strict');
const {read, save} = require('./catalogue-session.js');
function products(labels) { return labels.map(packs => {const p = []; p[11] = packs; return p;}); }
function storage(raw) {return {raw, getItem() {return this.raw;}, setItem(key, value) {this.raw = value;}};}
test('language changes retain quantities and variants with translated labels', () => {
  const s = storage();
  const fr = products([['Litre', 'Fût 200 L'], ['Bouteille 6 kg']]);
  const en = products([['Litre', '200 L drum'], ['6 kg cylinder']]);
  save(s, {'0:1': {id: 0, q: 3, pack: 'Fût 200 L'}, '1:0': {id: 1, q: 2, pack: 'Bouteille 6 kg'}}, fr);
  const translated = read(s, en);
  assert.deepEqual(translated, {'0:1': {id: 0, q: 3, pack: '200 L drum'}, '1:0': {id: 1, q: 2, pack: '6 kg cylinder'}});
  save(s, translated, en);
  assert.equal(read(s, fr)['0:1'].pack, 'Fût 200 L');
});
test('removing the final selection persists an empty cart', () => {
  const s = storage(); const p = products([['Litre']]);
  save(s, {'0:0': {id: 0, q: 2, pack: 'Litre'}}, p);
  save(s, {}, p);
  assert.deepEqual(read(s, p), {});
});
test('invalid or stale stored items cannot create broken products', () => {
  const p = products([['Litre']]);
  const items = [{id: 4, variant: 0, q: 1}, {id: 0, variant: 3, q: 1}, {id: 0, variant: 0, q: -1}, {id: 0, variant: 0, q: 1.5}];
  assert.deepEqual(read(storage(JSON.stringify({version: 1, items})), p), {});
  for (const raw of ['{broken', 'null', '{"version":2,"items":[]}', 'x'.repeat(65537)]) assert.deepEqual(read(storage(raw), p), {});
});
test('blocked session storage leaves the catalogue usable', () => {
  const blocked = {getItem() {throw Error('blocked');}, setItem() {throw Error('blocked');}};
  assert.deepEqual(read(blocked, []), {});
  assert.doesNotThrow(() => save(blocked, {}, []));
});

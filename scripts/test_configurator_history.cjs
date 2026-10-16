const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = fs.readFileSync(__dirname + '/configurator-history.js', 'utf8');
function fixture(hash) {
  const listeners = new Map();
  let reloads = 0;
  const window = {location: {hash, reload() {reloads++;}}, addEventListener(type, fn) {listeners.set(type, fn);}};
  vm.runInNewContext(code, {window, URLSearchParams});
  return {window, change(hash) {window.location.hash = hash; listeners.get('hashchange')();}, count() {return reloads;}};
}
test('opening a shared configuration does not cause a second load', () => {
  assert.equal(fixture('#p=operateur&d=for%2Cint').count(), 0);
});
test('changing configurations reloads the compiled app with the current URL', () => {
  const f = fixture('#p=operateur&d=geo');
  f.change('#p=operateur&d=for%2Cint');
  assert.equal(f.count(), 1);
  assert.equal(f.window.location.hash, '#p=operateur&d=for%2Cint');
  f.change('#p=industriel&d=om');
  f.change('#p=etat&d=eau');
  assert.equal(f.count(), 3);
});
test('unrelated anchors and unrecognised profiles do not reload the app', () => {
  const f = fixture('');
  for (const hash of ['#root', '', '#p=unknown', '#d=geo']) f.change(hash);
  assert.equal(f.count(), 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync('assets/chrome/contact-delivery.js', 'utf8');
function fixture(fetcher) {
  let submit, expire, cleared = false, resets = 0, events = 0;
  const status = { focus() {} }, button = { disabled: false };
  const form = {
    action: 'https://example.test/contact-received',
    getAttribute: () => 'enertchad-contact-fr', setAttribute() {}, reportValidity: () => true,
    addEventListener: (_name, fn) => { submit = fn; },
    reset() { resets++; }, dispatchEvent() { events++; }
  };
  vm.runInNewContext(source, {
    document: { documentElement: { lang: 'fr' }, getElementById: id => ({ ctForm: form, ctDeliveryStatus: status, ctSend: button })[id] },
    URLSearchParams, AbortController, CustomEvent: class {},
    FormData: class { constructor() { return new Map([['name', 'Test'], ['message', 'Texte conservé'], ['website', '']]); } },
    fetch: fetcher,
    setTimeout(fn, ms) { assert.equal(ms, 30000); expire = fn; return 1; },
    clearTimeout(id) { assert.equal(id, 1); cleared = true; }
  });
  return { submit: () => submit({ preventDefault() {} }), expire: () => expire(), button, status, get cleared() { return cleared; }, get resets() { return resets; }, get events() { return events; } };
}
test('stalled delivery expires, preserves the draft and permits retry', async () => {
  let calls = 0;
  const f = fixture((_url, { signal }) => {
    calls++;
    if (calls > 1) return Promise.resolve({ ok: true });
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Error('Timeout'))));
  });
  const pending = f.submit();
  assert.equal(f.button.disabled, true);
  f.expire(); await pending;
  assert.equal(f.button.disabled, false);
  assert.equal(f.resets, 0); assert.equal(f.events, 0); assert(f.cleared);
  assert.match(f.status.textContent, /texte est conservé/);
  await f.submit();
  assert.equal(f.resets, 1); assert.equal(f.events, 1);
});
test('server failure preserves the draft and success prevents duplicate submission', async () => {
  const failed = fixture(async () => ({ ok: false }));
  await failed.submit();
  assert.equal(failed.button.disabled, false); assert.equal(failed.resets, 0); assert(failed.cleared);
  let calls = 0;
  const success = fixture(async () => { calls++; return { ok: true }; });
  await success.submit(); await success.submit();
  assert.equal(calls, 1); assert.equal(success.resets, 1); assert(success.cleared);
});

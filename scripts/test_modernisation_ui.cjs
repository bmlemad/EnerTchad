const { test } = require('node:test');
const assert = require('node:assert/strict');
for (const file of ['./modernisation-ui.js', './modernisation-ui.min.js']) {
  const { matches } = require(file);
  test(file + ': document filters combine category, language, format and accent-insensitive search', () => {
    const doc = { text: 'Études pétrolières — fiche amont', category: 'operations', language: 'fr', format: 'PDF' };
    assert.equal(matches(doc, { query: 'etudes', category: 'operations', language: 'fr', format: 'PDF' }), true);
    assert.equal(matches(doc, { query: 'etudes', language: 'en' }), false);
    assert.equal(matches(doc, { format: 'XLSX' }), false);
    assert.equal(matches(doc, {}), true);
  });
}
for (const file of ['./modernisation-contact.js', './modernisation-contact.min.js']) {
  const { serviceName } = require(file);
  test(file + ': enquiry context accepts only published service keys', () => {
    assert.equal(serviceName('depot', false), 'Étude de dépôt et de logistique');
    assert.equal(serviceName('depot', true), 'Storage and logistics study');
    assert.equal(serviceName('<script>bad</script>', false), '');
    assert.equal(serviceName('__proto__', false), '');
    assert.equal(serviceName('constructor', true), '');
  });
}

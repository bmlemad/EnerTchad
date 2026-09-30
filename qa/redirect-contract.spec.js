const { test, expect } = require('@playwright/test');
const fs = require('fs');

function loadConfig() {
  return JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
}

test('redirects — legacy route map has no duplicate sources or direct self-loops', () => {
  const config = loadConfig();
  const redirects = Array.isArray(config.redirects) ? config.redirects : [];
  const sources = redirects.map(rule => rule.source);

  expect(new Set(sources).size, 'redirect sources must be unique').toBe(sources.length);

  for (const rule of redirects) {
    expect(rule.source, 'redirect source').toBeTruthy();
    expect(rule.destination, rule.source).toBeTruthy();
    expect(rule.source === rule.destination, rule.source).toBeFalsy();
    expect(rule.permanent, rule.source).toBe(true);
  }
});

test('redirects — wildcard migrations preserve their captured path', () => {
  const redirects = loadConfig().redirects || [];
  const wildcardRules = redirects.filter(rule => String(rule.source).includes(':path*'));

  for (const rule of wildcardRules) {
    expect(String(rule.destination), rule.source).toContain(':path*');
  }
});

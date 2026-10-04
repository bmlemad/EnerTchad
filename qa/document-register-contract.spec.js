const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';

test('document register — catalog is valid and every published file resolves', async ({ request }) => {
  const response = await request.get(new URL('/assets/data/document-register.json', base).href, { timeout: 30000 });
  expect(response.status()).toBe(200);

  const catalog = await response.json();
  expect(catalog.schema_version).toBe('1.0');
  expect(catalog.company_status).toBe('in_formation');
  expect(Array.isArray(catalog.documents)).toBeTruthy();
  expect(catalog.documents.length).toBeGreaterThanOrEqual(8);

  const ids = new Set();
  for (const doc of catalog.documents) {
    expect(doc.id).toMatch(/^[a-z0-9-]+$/);
    expect(ids.has(doc.id), 'duplicate document id ' + doc.id).toBeFalsy();
    ids.add(doc.id);

    expect(doc.href).toMatch(/^\//);
    expect(doc.format).toMatch(/^(PDF|PPTX|XLSX|CSV|ICS)$/);
    expect(doc.status).toBe('published');
    expect(Array.isArray(doc.language) && doc.language.length > 0).toBeTruthy();

    const file = await request.get(new URL(doc.href, base).href, { timeout: 30000 });
    expect(file.status(), doc.href + ' should resolve').toBe(200);
  }
});

test('publications — document register remains discoverable', async ({ page }) => {
  for (const path of ['/publications', '/publications-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await expect(page.locator('a[href="/assets/data/document-register.json"]')).toHaveCount(1);
  }
});

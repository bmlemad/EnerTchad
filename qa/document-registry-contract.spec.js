const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';

test('public document registry — inventory is unique, typed and resolvable', async ({ request }) => {
  const response = await request.get(new URL('/assets/data/document-registry.json', base).href, { timeout: 30000 });
  expect(response.status()).toBe(200);
  const registry = await response.json();

  expect(registry.schema_version).toBeTruthy();
  expect(Array.isArray(registry.documents)).toBeTruthy();
  expect(registry.documents.length).toBeGreaterThanOrEqual(14);

  const ids = registry.documents.map(d => d.id);
  const paths = registry.documents.map(d => d.path);
  expect(new Set(ids).size, 'document IDs must be unique').toBe(ids.length);
  expect(new Set(paths).size, 'document paths must be unique').toBe(paths.length);

  for (const doc of registry.documents) {
    expect(doc.id).toMatch(/^[a-z0-9-]+$/);
    expect(doc.path).toMatch(/^\//);
    expect(doc.format).toMatch(/^(PDF|PPTX|XLSX|CSV|ICS)$/);
    expect(doc.language).toMatch(/^(fr|en|ar|multi)$/);
    expect(doc.category).toMatch(/^(investors|operations|esg|corporate)$/);
    expect(doc.status).toMatch(/^(published|progress-update|target-data)$/);
    expect(doc.bytes).toBeGreaterThan(0);

    const asset = await request.get(new URL(doc.path, base).href, { timeout: 30000 });
    expect(asset.status(), doc.path).toBe(200);
  }
});

test('publications — data room exposes registry and core evidence files', async ({ page }) => {
  for (const path of ['/publications', '/publications-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await expect(page.locator('#data-room')).toHaveCount(1);
    const hrefs = await page.locator('#data-room a[href]').evaluateAll(nodes => nodes.map(a => a.getAttribute('href')));
    expect(hrefs).toContain('/Fiche_Investisseur_EnerTchad.pdf');
    expect(hrefs).toContain('/Data_Book_EnerTchad.xlsx');
    expect(hrefs).toContain('/Point_Etape_EnerTchad_2026.pdf');
    expect(hrefs).toContain('/assets/data/document-registry.json');
  }
});

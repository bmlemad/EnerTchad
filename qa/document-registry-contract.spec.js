const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.com/';

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
    expect(doc.git_blob_sha, doc.path + ' git blob fingerprint').toMatch(/^[a-f0-9]{40}$/);

    const asset = await request.get(new URL(doc.path, base).href, { timeout: 30000 });
    expect(asset.status(), doc.path).toBe(200);
  }
});

// Lot 104 (2 nov. 2026) : depuis les lots 27-28, /publications expose les fichiers dans la bibliothèque filtrable
// #mod-library (grille a[data-document-format], formulaire [data-document-filter], document-room.js) ; la data room
// (#data-room) garde le lien vers le registre JSON. L'ancien explorateur .et-dr-card n'existe plus.
test('publications — data room and library expose registry and core evidence files', async ({ page, request }) => {
  const registry = await (await request.get(new URL('/assets/data/document-registry.json', base).href, { timeout: 30000 })).json();
  for (const path of ['/publications', '/publications-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await expect(page.locator('#data-room')).toHaveCount(1);
    const roomHrefs = await page.locator('#data-room a[href]').evaluateAll(nodes => nodes.map(a => a.getAttribute('href')));
    expect(roomHrefs, path + ' registre').toContain('/assets/data/document-registry.json');
    const cards = await page.locator('#mod-library a[data-document-format]').evaluateAll(nodes => nodes.map(a => a.getAttribute('href')));
    expect(cards, path + ' fiche investisseur').toContain('/Fiche_Investisseur_EnerTchad.pdf');
    expect(cards, path + ' data book').toContain('/Data_Book_EnerTchad.xlsx');
    expect(cards, path + ' point d’étape').toContain('/Point_Etape_EnerTchad_2026.pdf');
    expect(new Set(cards), path + ' une carte par document du registre').toEqual(new Set(registry.documents.map(d => d.path)));
  }
});

test('publications — library filters the registry by category', async ({ page, request }) => {
  const registry = await (await request.get(new URL('/assets/data/document-registry.json', base).href, { timeout: 30000 })).json();
  const operations = registry.documents.filter(d => d.category === 'operations').length;
  for (const path of ['/publications', '/publications-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
    const form = page.locator('#mod-library [data-document-filter]');
    await expect(form, path + ' formulaire de filtre révélé par document-room.js').toBeVisible({ timeout: 15000 });
    const visible = () => page.locator('#mod-library a[data-document-format]').evaluateAll(nodes => nodes.filter(a => a.getClientRects().length > 0).length);
    expect(await visible(), path + ' toutes les cartes').toBe(registry.documents.length);
    await form.locator('select[name="category"]').selectOption('operations');
    await page.waitForTimeout(300);
    expect(await visible(), path + ' cartes Activités').toBe(operations);
    await form.locator('button[type="reset"]').click();
    await page.waitForTimeout(300);
    expect(await visible(), path + ' retour à toutes les cartes').toBe(registry.documents.length);
  }
});

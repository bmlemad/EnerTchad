const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';

test('claim proof layer — critical target and status claims expose nearby evidence', async ({ page }) => {
  const cases = [
    ['/cibles-2030', 1],
    ['/cibles-2030-en', 1],
    ['/projets', 1],
    ['/projets-en', 1],
    ['/investisseurs', 1],
    ['/investisseurs-en', 1],
    ['/societe', 1],
    ['/societe-en', 1],
  ];

  for (const [path, minimum] of cases) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const proofs = page.locator('.et-proofline');
    expect(await proofs.count(), path + ' proof lines').toBeGreaterThanOrEqual(minimum);

    const hrefs = await proofs.locator('a[href]').evaluateAll(nodes => nodes.map(a => a.getAttribute('href')));
    expect(hrefs, path + ' Data Book evidence').toContain('/Data_Book_EnerTchad.xlsx');
    expect(hrefs.some(h => h === '/Point_Etape_EnerTchad_2026.pdf'), path + ' progress evidence').toBeTruthy();
  }
});

test('capital proof — investor pages connect target figures to assumptions and risk context', async ({ page }) => {
  for (const path of ['/investisseurs', '/investisseurs-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const proof = page.locator('[data-et-proof="capital"]');
    await expect(proof).toHaveCount(1);
    const hrefs = await proof.locator('a').evaluateAll(nodes => nodes.map(a => a.getAttribute('href')));
    expect(hrefs.some(h => h && h.includes('investor-center')), path + ' investor center link').toBeTruthy();
  }
});

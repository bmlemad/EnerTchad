const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.com/';

const strategicPages = [
  ['/essentiel', 'https://enertchad.com/essentiel'],
  ['/essentiel-en', 'https://enertchad.com/essentiel-en'],
  ['/investor-center', 'https://enertchad.com/investor-center'],
  ['/investor-center-en', 'https://enertchad.com/investor-center-en']
];

test('strategic pages — canonical, title and primary content are present', async ({ page }) => {
  for (const [path, canonical] of strategicPages) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).not.toHaveText('');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect((description || '').trim().length, path + ' substantive description').toBeGreaterThanOrEqual(40);
  }
});

test('strategic overview — signature chain keeps eight named links in both languages', async ({ page }) => {
  for (const path of ['/essentiel', '/essentiel-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const nodes = page.locator('.sp-chain .sp-node');
    await expect(nodes).toHaveCount(8);
    const names = await nodes.locator('b').allTextContents();
    expect(new Set(names.map(x => x.trim())).size, path + ' unique chain labels').toBe(8);
  }
});

test('project roadmap — all eight flagship projects expose an explicit target status', async ({ page }) => {
  for (const path of ['/projets', '/projets-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await expect(page.locator('.et-proj-legend')).toHaveCount(1);
    await expect(page.locator('.et-proj-state')).toHaveCount(8);
  }
});

test('investor command center — evidence and risk exits remain visible', async ({ page }) => {
  for (const path of ['/investor-center', '/investor-center-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const hrefs = await page.locator('a[href]').evaluateAll(nodes => nodes.map(a => a.getAttribute('href')));
    expect(hrefs).toContain('/Fiche_Investisseur_EnerTchad.pdf');
    expect(hrefs).toContain('/Data_Book_EnerTchad.xlsx');
    expect(hrefs.some(h => h && h.includes('avertissements')), path + ' risk disclosure link').toBeTruthy();
    expect(hrefs.some(h => h === 'mailto:invest@enertchad.com'), path + ' investor contact').toBeTruthy();
  }
});

test('shared navigation — strategic shortcut is available on representative internal pages', async ({ page }) => {
  for (const path of ['/societe', '/gouvernance', '/aval/reseau']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(100);
    const shortcut = page.locator('.nx-util-in a[href="/essentiel"]');
    await expect(shortcut, path + ' 90-second shortcut').toHaveCount(1);
  }
});

test('strategic SVGs — exposed vectors have a semantic name or are hidden', async ({ page }) => {
  const paths = ['/essentiel', '/essentiel-en', '/projets', '/projets-en', '/aval/reseau', '/aval/reseau-en'];
  for (const path of paths) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const report = await page.locator('svg').evaluateAll(nodes => nodes.map((svg, index) => {
      const hiddenAncestor = svg.closest('[aria-hidden="true"]');
      return {
        index,
        hidden: svg.getAttribute('aria-hidden') === 'true' || !!hiddenAncestor,
        label: svg.getAttribute('aria-label') || '',
        role: svg.getAttribute('role') || ''
      };
    }));
    for (const svg of report) {
      expect(
        svg.hidden || svg.label.trim().length > 0 || ['img', 'group'].includes(svg.role),
        path + ' svg ' + svg.index + ' must be hidden or named'
      ).toBeTruthy();
    }
  }
});

const { test, expect } = require('@playwright/test');

// Lot 124 : le tiroir mobile affiche les cinq liens simples (plus de rubriques à déplier) et le bouton « Investisseurs ».
const base = process.env.SITE_URL || 'https://enertchad.com/';
const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/contact'];

test.describe('mobile navigation — drawer, five links and keyboard state', () => {
  for (const path of paths) {
    test(path + ' — drawer states stay truthful', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

      const toggle = page.locator('#navTog');
      const links = page.locator('#navLinks');
      await expect(toggle).toBeVisible();
      await expect(links).toHaveAttribute('class', /nav-links/);
      expect(await toggle.getAttribute('aria-expanded'), path + ' mobile menu initial aria-expanded').toBe('false');

      await toggle.click();
      await expect(links).toHaveClass(/open/);
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      const items = page.locator('#navLinks .nav-item > a.nx-direct');
      await expect(items).toHaveCount(5);
      for (let i = 0; i < 5; i++) await expect(items.nth(i)).toBeVisible();
      await expect(page.locator('#navLinks .nav-trigger[aria-controls]')).toHaveCount(0);
      await expect(page.locator('#navLinks .nx-util-m a.cta')).toBeVisible();
      await expect(page.locator('#navLinks .nx-util-m a.cta')).toHaveText(/^(Investisseurs|Investors)$/);

      await page.keyboard.press('Escape');
      await expect(links).not.toHaveClass(/open/);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });
  }

  test('mobile drawer does not create document-level horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(new URL('/', base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    await page.locator('#navTog').click();
    const report = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      navScrollWidth: document.getElementById('navLinks')?.scrollWidth || 0,
      navClientWidth: document.getElementById('navLinks')?.clientWidth || 0
    }));

    expect(report.scrollWidth, 'document must not overflow horizontally on mobile').toBeLessThanOrEqual(report.viewport + 2);
    expect(report.navScrollWidth, '#navLinks must not overflow its own viewport').toBeLessThanOrEqual(report.navClientWidth + 2);
  });
});

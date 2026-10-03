const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/contact'];

test.describe('mobile navigation — menu, mega-menu and keyboard state', () => {
  for (const path of paths) {
    test(path + ' — drawer and disclosure states stay truthful', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

      const toggle = page.locator('#navTog');
      const links = page.locator('#navLinks');
      await expect(toggle).toBeVisible();
      await expect(links).toHaveAttribute('class', /nav-links/);

      const initialExpanded = await toggle.getAttribute('aria-expanded');
      expect(initialExpanded, path + ' mobile menu initial aria-expanded').toBe('false');

      await toggle.click();
      await expect(links).toHaveClass(/open/);
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      const triggers = page.locator('#navLinks .nav-item > .nav-trigger');
      const triggerCount = await triggers.count();
      expect(triggerCount, path + ' mobile mega-menu trigger count').toBeGreaterThan(0);

      const first = triggers.first();
      await first.click();
      await expect(first).toHaveAttribute('aria-expanded', 'true');

      if (triggerCount > 1) {
        const second = triggers.nth(1);
        await second.click();
        await expect(second).toHaveAttribute('aria-expanded', 'true');
        await expect(first).toHaveAttribute('aria-expanded', 'false');
      }

      await page.keyboard.press('Escape');
      await expect(links).not.toHaveClass(/open/);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });
  }

  test('mobile mega-menu does not create document-level horizontal overflow', async ({ page }) => {
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

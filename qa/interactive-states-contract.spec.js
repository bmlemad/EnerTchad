const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.com/';
const hubs = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/'];

test.describe('interactive states — hub controls and CTA integrity', () => {
  for (const path of hubs) {
    test(path + ' — controls expose valid targets and links', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

      const report = await page.locator('button, a').evaluateAll(nodes => nodes.map((el, index) => ({
        index,
        tag: el.tagName.toLowerCase(),
        href: el.getAttribute('href'),
        text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ').slice(0, 100),
        ariaLabel: el.getAttribute('aria-label'),
        expanded: el.getAttribute('aria-expanded'),
        controls: el.getAttribute('aria-controls')
      })));

      for (const item of report) {
        if (item.tag === 'a' && item.href !== null) {
          expect(item.href.trim(), path + ' link ' + item.index).not.toBe('');
          expect(item.href.trim(), path + ' link ' + item.index).not.toMatch(/^javascript:/i);
          expect(item.href.trim(), path + ' link ' + item.index).not.toBe('#');
        }

        if (item.tag === 'button' && item.expanded !== null) {
          expect(item.controls, path + ' button ' + item.index + ' aria-controls').toBeTruthy();
          const target = page.locator('#' + item.controls);
          await expect(target, path + ' button ' + item.index + ' controlled target').toHaveCount(1);
        }

        if (item.controls !== null && item.tag !== 'button') {
          const target = page.locator('#' + item.controls);
          await expect(target, path + ' control target').toHaveCount(1);
        }
      }

      // Lot 124 : cinq liens simples, sans déroulant ni aria-expanded ; chacun garde une cible valide.
      const triggers = page.locator('#navLinks .nav-item > a.nx-direct');
      await expect(triggers, path + ' nav link count').toHaveCount(5);
      await expect(page.locator('#navLinks [aria-expanded]'), path + ' no expandable entry left').toHaveCount(0);
      for (let i = 0; i < 5; i++) {
        const href = await triggers.nth(i).getAttribute('href');
        expect(href && href.startsWith('/'), path + ' nav link target ' + i).toBeTruthy();
      }
      await page.keyboard.press('Escape');
    });
  }
});

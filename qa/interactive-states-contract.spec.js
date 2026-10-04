const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
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

      const triggers = page.locator('#navLinks .nav-item > .nav-trigger');
      const count = await triggers.count();
      expect(count, path + ' nav trigger count').toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        await triggers.nth(i).click();
        await expect(triggers.nth(i)).toHaveAttribute('aria-expanded', 'true');
        for (let j = 0; j < count; j++) {
          if (j !== i) await expect(triggers.nth(j)).toHaveAttribute('aria-expanded', 'false');
        }
      }

      await page.keyboard.press('Escape');
      for (let i = 0; i < count; i++) {
        await expect(triggers.nth(i)).toHaveAttribute('aria-expanded', 'false');
      }
    });
  }
});

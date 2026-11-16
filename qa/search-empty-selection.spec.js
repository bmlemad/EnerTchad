const { test, expect } = require('@playwright/test');
const base = process.env.SITE_URL || 'https://enertchad.com/';

for (const [language, route] of [['fr', '/'], ['en', '/index-en']]) {
  for (const width of [320, 1440]) {
    test(`mobile navigation — search clears stale selection — ${language} ${width}`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
      const trigger = page.locator('#navSearch');
      await trigger.click();
      const input = page.locator('#cmdk-input');
      await expect(input).toBeFocused();
      await expect(input).toHaveAttribute('aria-activedescendant', 'cmdk-option-0');
      await expect(page.locator('#cmdk-option-0')).toBeVisible();

      await input.fill('zzqaaucunresultat');
      await expect(page.locator('#cmdk-results [role="option"]')).toHaveCount(0);
      await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/);
      await expect(input).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('#cmdk-results')).toHaveAttribute('role', 'region');
      await expect(page.locator('#cmdk [role="status"]')).toHaveText(language === 'en' ? '0 results' : '0 résultats');
      for (const word of await page.locator('#cmdk-results b').all()) {
        await expect(word).toHaveCSS('color', 'rgb(234, 240, 248)');
      }
      await input.press('ArrowDown');
      await input.press('Enter');
      await expect(page.locator('#cmdk')).toBeVisible();
      await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/);

      await input.fill('');
      await expect(input).toHaveAttribute('aria-activedescendant', 'cmdk-option-0');
      await expect(page.locator('#cmdk-option-0')).toBeVisible();
      await input.press('Escape');
      await expect(page.locator('#cmdk')).toBeHidden();
      await expect(trigger).toBeFocused();
      await page.locator('#etThemeHdr').click();
      await trigger.click();
      await input.fill('zzqaaucunresultat');
      await expect(page.locator('#cmdk-results [role="option"]')).toHaveCount(0);
      for (const word of await page.locator('#cmdk-results b').all()) {
        await expect(word).toHaveCSS('color', 'rgb(234, 240, 248)');
      }
      await page.screenshot({ path: `artifacts/search-empty-${language}-${width}.png` });
      await page.close();
    });
  }
}

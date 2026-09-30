const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';
const paths = ['/', '/amont/', '/aval/', '/greentech/', '/contact'];

test('interaction — visible buttons are named and enabled states are truthful', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const buttons = await page.locator('button').evaluateAll(nodes => nodes.map((button, index) => {
      const rect = button.getBoundingClientRect();
      return {
        index,
        visible: rect.width > 0 && rect.height > 0 && getComputedStyle(button).visibility !== 'hidden',
        disabled: button.disabled,
        ariaDisabled: button.getAttribute('aria-disabled'),
        name: (button.innerText || button.getAttribute('aria-label') || button.getAttribute('title') || '').trim()
      };
    }));

    for (const button of buttons.filter(item => item.visible)) {
      expect(button.name.length, path + ' button ' + button.index + ' accessible name').toBeGreaterThan(0);
      if (button.disabled) expect(button.ariaDisabled, path + ' button ' + button.index).toBe('true');
    }

    await page.close();
  }
});

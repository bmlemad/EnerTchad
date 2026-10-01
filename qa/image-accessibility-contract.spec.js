const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/contact'];

test('images — visible content images have meaningful alt text and decorative images are explicit', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const report = await page.locator('img').evaluateAll(nodes => nodes.map((img, index) => ({
      index,
      alt: img.getAttribute('alt'),
      role: img.getAttribute('role'),
      ariaHidden: img.getAttribute('aria-hidden'),
      src: img.currentSrc || img.src
    })));

    for (const image of report) {
      const decorative = image.role === 'presentation' || image.ariaHidden === 'true';
      if (decorative) {
        expect(image.alt === '' || image.alt === null, path + ' decorative image ' + image.index).toBeTruthy();
      } else {
        expect(image.alt !== null, path + ' image ' + image.index + ' missing alt').toBeTruthy();
        expect(image.alt.trim().length, path + ' image ' + image.index).toBeGreaterThan(0);
      }
    }

    await page.close();
  }
});

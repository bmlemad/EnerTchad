const { test, expect } = require('@playwright/test');

// Remarques de relecture du 17 novembre 2026 : dans le bloc de marque du pied de page, l'e-mail, le téléphone et l'adresse sont chacun
// sur leur ligne (ils partageaient une ligne à l'ordinateur), et le slogan est celui de l'en-tête.

const base = process.env.SITE_URL || 'https://enertchad.com/';

for (const [path, slogan] of [['/', 'L’énergie du Tchad. Intégrée.'], ['/societe-en', 'Chad’s energy. Integrated.']]) {
  for (const width of [390, 1440]) {
    test(`${path} footer contact stacked and slogan at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const report = await page.evaluate(async () => {
        const footer = document.querySelector('footer');
        footer.scrollIntoView({ block: 'end' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const links = [...footer.querySelectorAll('.foot-brand .pft-contact a')].map(a => Math.round(a.getBoundingClientRect().top));
        return { links, slogan: footer.querySelector('.foot-brand .et-tag small')?.textContent.trim(), overflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      expect(report.links.length).toBe(3);
      expect(new Set(report.links).size, `three distinct lines: ${report.links}`).toBe(3);
      expect(report.slogan).toBe(slogan);
      expect(report.overflow).toBe(false);
    });
  }
}

const { test, expect } = require('@playwright/test');

// QA Engagements du 22 novembre 2026 (scripts/align_engagements_qa.py). Chaque test échoue sur la version précédente.
const base = process.env.SITE_URL || 'https://enertchad.com/';

for (const [path, proof] of [['/engagements', 'assurance-esg'], ['/engagements-en', 'esg-assurance']]) {
  test(`disclosure controls keep — engagements content follows the doctrine and current standards ${path}`, async ({ page }) => {
    await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
    const text = await page.locator('main').innerText();
    expect(text, 'no export corridor among value drivers').not.toMatch(/Kribi/);
    expect(text, 'TCFD only named as the former framework').not.toMatch(/(Cadre visé|Framework targeted)\s*:\s*TCFD/);
    expect(await page.locator('#plan-environnemental .pp-grid').first().locator('.pp-cell').count(), 'four plan steps').toBe(4);
    const order = await page.evaluate(id => {
      const proof = document.getElementById(id);
      const cta = document.querySelector('main a[data-et-action="contact"]').closest('section');
      return proof.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING ? 'proof-first' : 'cta-first';
    }, proof);
    expect(order).toBe('proof-first');
  });

  test(`mobile navigation — engagements indicator table fits a phone screen ${path}`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
    const fit = await page.locator('#indicateurs table').evaluate(t => ({ table: t.scrollWidth, box: t.parentElement.clientWidth }));
    expect(fit.table).toBeLessThanOrEqual(fit.box);
    const cards = await page.locator('#plan-environnemental .pp-cell').evaluateAll(cells =>
      cells.filter(c => c.scrollWidth > c.clientWidth + 1).length);
    expect(cards, 'no text overflows a plan card').toBe(0);
    await page.close();
  });
}

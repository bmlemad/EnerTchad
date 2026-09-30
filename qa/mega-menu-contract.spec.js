const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';
const pages = ['/', '/index-en', '/ar'];
const widths = [1280, 1440];

test('mega-menu — visual geometry and surface coherence', async ({ browser }) => {
  for (const path of pages) {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
      const response = await page.goto(new URL(path, base).href, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });
      expect(response && response.status(), path + ' @' + width).toBe(200);

      const report = await page.evaluate(() => {
        const items = [...document.querySelectorAll('#navLinks > .nav-item')];
        const visible = el => {
          const s = getComputedStyle(el);
          return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > .01;
        };
        const panels = items.map((item, index) => {
          const trigger = item.querySelector('.nav-trigger');
          const mega = item.querySelector('.nx-mega');
          if (!trigger || !mega) return null;
          trigger.click();
          const r = mega.getBoundingClientRect();
          const t = trigger.getBoundingClientRect();
          const cs = getComputedStyle(mega);
          const links = [...mega.querySelectorAll('a[href]')].filter(visible);
          const headings = [...mega.querySelectorAll('.nxh')].filter(visible);
          const overflow = mega.scrollWidth > mega.clientWidth + 1;
          const itemOverflow = [...mega.querySelectorAll('*')].some(el => {
            const er = el.getBoundingClientRect();
            return er.right > window.innerWidth + 1 || er.left < -1;
          });
          return {
            index,
            trigger: { x:t.x, y:t.y, w:t.width, h:t.height },
            panel: { x:r.x, y:r.y, w:r.width, h:r.height },
            surface: {
              backgroundColor: cs.backgroundColor,
              borderRadius: cs.borderRadius,
              borderTop: cs.borderTopWidth,
              borderBottom: cs.borderBottomWidth,
              boxShadow: cs.boxShadow,
              backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter
            },
            links: links.length,
            headings: headings.length,
            overflow,
            itemOverflow,
            expanded: trigger.getAttribute('aria-expanded')
          };
        }).filter(Boolean);

        items.forEach(item => {
          const btn = item.querySelector('.nav-trigger');
          if (btn) btn.click();
        });

        return {
          viewport: { width: innerWidth, height: innerHeight },
          panels,
          triggerCount: items.length
        };
      });

      expect(report.triggerCount, path + ' trigger count').toBeGreaterThanOrEqual(5);
      expect(report.panels.length, path + ' panel count').toBe(report.triggerCount);

      const surfaces = report.panels.map(p => p.surface);
      expect(new Set(surfaces.map(s => s.backgroundColor)).size, path + ' background coherence').toBe(1);
      expect(new Set(surfaces.map(s => s.borderRadius)).size, path + ' radius coherence').toBe(1);

      for (const p of report.panels) {
        expect(p.panel.w, path + ' panel width').toBeGreaterThan(240);
        expect(p.panel.x, path + ' panel left').toBeGreaterThanOrEqual(-1);
        expect(p.panel.x + p.panel.w, path + ' panel right').toBeLessThanOrEqual(width + 1);
        expect(p.panel.y, path + ' panel top').toBeGreaterThanOrEqual(0);
        expect(p.panel.y + p.panel.h, path + ' panel bottom').toBeLessThanOrEqual(900 + 1);
        expect(p.overflow, path + ' internal scroll overflow').toBeFalsy();
        expect(p.itemOverflow, path + ' child clipping').toBeFalsy();
        expect(p.links, path + ' visible links').toBeGreaterThan(0);
        expect(p.expanded, path + ' aria-expanded').toBe('true');
      }

      await page.screenshot({ path: 'artifacts/mega-' + path.replace(/\W+/g, '-') + '-' + width + '.png', fullPage: false });
      await page.close();
    }
  }
});

test('mega-menu — keyboard escape closes without leaving a stale visual state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(new URL('/', base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

  const trigger = page.locator('#navLinks > .nav-item .nav-trigger').first();
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  const state = await page.evaluate(() => {
    const item = document.querySelector('#navLinks > .nav-item');
    const mega = item?.querySelector('.nx-mega');
    if (!mega) return null;
    const cs = getComputedStyle(mega);
    return {
      className: item.className,
      visibility: cs.visibility,
      opacity: parseFloat(cs.opacity),
      pointerEvents: cs.pointerEvents
    };
  });

  expect(state).not.toBeNull();
  expect(state.visibility).not.toBe('visible');
  expect(state.opacity).toBeLessThanOrEqual(.5);
});

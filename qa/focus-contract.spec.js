const { test, expect } = require('@playwright/test');

const url = process.env.SITE_URL || 'https://enertchad.netlify.app/';

test('shared chrome — focus-visible declarations expose a real visible treatment', async ({ page }) => {
  await page.goto(new URL('/', url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

  const report = await page.evaluate(async () => {
    const sheets = [
      '/assets/chrome/nav_a.css',
      '/assets/chrome/modern-ui-2026.css',
      '/assets/chrome/modern-inner-2026.css'
    ];
    const css = await Promise.all(
      sheets.map(href => fetch(href).then(response => {
        if (!response.ok) throw new Error(href + ' returned ' + response.status);
        return response.text();
      }))
    );

    return {
      focusRules: css.map(text => (text.match(/:focus-visible/g) || []).length),
      hasVisibleFocusStyle: css.some(text =>
        /:focus-visible\s*\{[^}]*\b(?:outline|box-shadow)\s*:/s.test(text)
      )
    };
  });

  expect(report.hasVisibleFocusStyle, 'shared chrome should define a visible :focus-visible treatment').toBeTruthy();
  expect(report.focusRules.reduce((sum, count) => sum + count, 0), 'focus-visible rule count').toBeGreaterThan(0);
});

test('navigation — keyboard focus produces a visible indicator on representative mobile routes', async ({ browser }) => {
  const paths = ['/', '/amont/', '/aval/', '/contact/'];

  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const report = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')]
        .filter(el => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return rect.width > 0 && rect.height > 0 &&
            style.display !== 'none' && style.visibility !== 'hidden' &&
            !el.matches('[disabled],[aria-disabled="true"]');
        });

      const target = candidates.find(el => el.matches('a,button,input,select,textarea,[tabindex]'));
      if (!target) return { checked: false, visible: false };

      target.focus();
      const style = getComputedStyle(target);
      const visible =
        style.outlineStyle !== 'none' ||
        style.outlineWidth !== '0px' ||
        style.boxShadow !== 'none';

      return { checked: true, visible };
    });

    expect(report.checked, path + ' should expose a focusable control').toBeTruthy();
    expect(report.visible, path + ' should expose a visible keyboard focus indicator').toBeTruthy();
    await page.close();
  }
});

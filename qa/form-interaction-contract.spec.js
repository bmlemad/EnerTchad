const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
const paths = ['/contact', '/investisseurs', '/carrieres', '/clients'];

test('forms — required fields expose native validation semantics and usable submit controls', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);

    const forms = await page.locator('form').evaluateAll(nodes => nodes.map((form, index) => ({
      index,
      noValidate: form.hasAttribute('novalidate'),
      submitControls: [...form.querySelectorAll('button[type="submit"],input[type="submit"]')].map(el => ({
        disabled: el.disabled,
        text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim()
      })),
      required: [...form.querySelectorAll('input[required],select[required],textarea[required]')].map(el => ({
        name: el.getAttribute('name') || '',
        type: el.getAttribute('type') || el.tagName.toLowerCase()
      }))
    })));

    for (const form of forms) {
      expect(form.submitControls.length, path + ' form ' + form.index).toBeGreaterThan(0);
      expect(form.submitControls.some(control => !control.disabled && control.text.length > 0), path + ' form ' + form.index + ' submit').toBeTruthy();
      if (form.required.length > 0) expect(form.noValidate, path + ' form ' + form.index).toBeFalsy();
    }

    await page.close();
  }
});

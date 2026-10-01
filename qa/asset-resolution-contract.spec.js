const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
const paths = ['/', '/index-en', '/ar', '/amont/', '/aval/', '/greentech/', '/contact'];

test('assets — document stylesheet and script references resolve successfully', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage();
    const failures = [];
    page.on('response', response => {
      if (response.status() >= 400 && /\.(css|js)(\?|$)/i.test(response.url())) failures.push(response.url() + ' [' + response.status() + ']');
    });

    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(750);
    expect(failures, path + ' broken CSS/JS assets').toEqual([]);
    await page.close();
  }
});

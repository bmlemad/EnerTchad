const { test, expect } = require('@playwright/test');

const url = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';

test('homepage desktop', async ({ page }) => {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await expect(page).toHaveTitle(/EnerTchad/i);
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator('nav').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBeFalsy();
});

test('homepage mobile', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await expect(page.locator('h1').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBeFalsy();
  await page.screenshot({ path: 'artifacts/home-mobile.png', fullPage: true });
});

test('representative inner pages — desktop and mobile', async ({ browser }) => {
  const paths = ['/amont/', '/intermediaire/', '/aval/', '/greentech/', '/societe.html', '/investisseurs.html', '/clients.html', '/carrieres.html', '/contact.html', '/faq.html'];
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
    page.on('pageerror', err => errors.push('pageerror: ' + err.message));
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'networkidle', timeout: 45000 });
    expect(response, path).not.toBeNull();
    expect(response.status(), path).toBeLessThan(400);
    await expect(page.locator('h1').first(), path).toBeVisible();
    await expect(page.locator('nav').first(), path).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow, path).toBeFalsy();
    expect(errors, path).toEqual([]);
    await page.close();
  }
});

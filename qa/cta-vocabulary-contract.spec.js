const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';

const cases = [
  ['/', [
    ['a[data-et-action="invest"][href="/investisseurs#souscrire"]', 'Investir'],
    ['a[data-et-action="explore"][href="#chaine"]', 'Explorer la chaîne'],
  ]],
  ['/index-en', [
    ['a[data-et-action="invest"][href="/investisseurs-en#souscrire"]', 'Invest'],
    ['a[data-et-action="explore"][href="#chaine"]', 'Explore the chain'],
  ]],
  ['/projets', [['a[data-et-action="contact"][href="/contact"]', 'Nous contacter']]],
  ['/projets-en', [['a[data-et-action="contact"][href="/contact-en"]', 'Contact us']]],
  ['/gouvernance', [['a[data-et-action="contact"][href="/contact"]', 'Nous contacter']]],
  ['/gouvernance-en', [['a[data-et-action="contact"][href="/contact-en"]', 'Contact us']]],
  ['/solutions', [
    ['a[data-et-action="contact"][href="/contact"]', 'Nous contacter →'],
    ['a[data-et-action="explore"][href="/clients"]', 'Explorer par profil'],
  ]],
  ['/solutions-en', [
    ['a[data-et-action="contact"][href="/contact-en"]', 'Contact us →'],
    ['a[data-et-action="explore"][href="/clients-en"]', 'Explore by profile'],
  ]],
];

test('CTA vocabulary — core actions use canonical labels and semantic action tags', async ({ page }) => {
  for (const [path, expected] of cases) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    for (const [selector, label] of expected) {
      const target = page.locator(selector).filter({ hasText: label }).first();
      await expect(target, path + ' ' + label).toBeVisible();
    }
  }
});

test('CTA vocabulary — deprecated contact labels do not return', async ({ page }) => {
  const deprecated = [
    'Discuter d’un partenariat',
    'Contacter la gouvernance',
    'Talk to an expert',
    'Discuss a partnership',
    'Contact governance',
    'Join the journey',
    'Rejoindre la démarche',
  ];

  for (const path of ['/investisseurs', '/investisseurs-en', '/projets', '/projets-en', '/gouvernance', '/gouvernance-en', '/solutions', '/solutions-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const text = await page.locator('body').innerText();
    for (const phrase of deprecated) {
      expect(text, path + ' deprecated CTA ' + phrase).not.toContain(phrase);
    }
  }
});

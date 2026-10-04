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
  ['/societe', [
    ['a[data-et-action="evidence"][href="/engagements"]', 'Voir nos engagements'],
  ]],
  ['/societe-en', [
    ['a[data-et-action="evidence"][href="/engagements-en"]', 'View our commitments'],
  ]],
  ['/projets', [['a[data-et-action="contact"][href="/contact"]', 'Nous contacter']]],
  ['/projets-en', [['a[data-et-action="contact"][href="/contact-en"]', 'Contact us']]],
  ['/gouvernance', [['a[data-et-action="contact"][href="/contact"]', 'Nous contacter']]],
  ['/gouvernance-en', [['a[data-et-action="contact"][href="/contact-en"]', 'Contact us']]],
  ['/engagements', [
    ['a[data-et-action="contact"][href="/contact"]', 'Nous contacter'],
    ['a[data-et-action="explore"][href="/societe"]', 'Voir la société'],
  ]],
  ['/engagements-en', [
    ['a[data-et-action="contact"][href="/contact-en"]', 'Contact us'],
    ['a[data-et-action="explore"][href="/societe-en"]', 'View the company'],
  ]],
  ['/solutions', [
    ['a[data-et-action="contact"][href="/contact"]', 'Nous contacter'],
    ['a[data-et-action="explore"][href="/clients"]', 'Explorer par profil'],
  ]],
  ['/solutions-en', [
    ['a[data-et-action="contact"][href="/contact-en"]', 'Contact us'],
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


test('CTA density — investor evidence entry stays compact and exposes two distinct actions', async ({ page }) => {
  for (const path of ['/investisseurs', '/investisseurs-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const entry = page.locator('.et-quick-entry.et-quick-dual');
    await expect(entry, path + ' compact investor evidence entry').toHaveCount(1);
    await expect(entry.locator('.et-quick-actions a')).toHaveCount(2);
  }
});


test('CTA vocabulary — primary labels remain concise', async ({ page }) => {
  for (const path of ['/societe', '/societe-en', '/gouvernance', '/gouvernance-en', '/solutions', '/solutions-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const labels = await page.locator('a.pp-btn, a.pp-link, a.btn, a.cta').evaluateAll(nodes =>
      nodes.map(a => (a.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean)
    );
    for (const label of labels) {
      expect(label.length, path + ' CTA length: ' + label).toBeLessThanOrEqual(48);
      expect(label, path + ' decorative arrow suffix: ' + label).not.toMatch(/[→›]\s*$/);
    }
  }
});


test('CTA density — investor topic index stays collapsed by default and keeps all 13 destinations', async ({ page }) => {
  for (const path of ['/investisseurs', '/investisseurs-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const details = page.locator('details.et-topic-index');
    await expect(details, path + ' topic index').toHaveCount(1);
    await expect(details).not.toHaveAttribute('open', '');
    await expect(details.locator('a.pp-cell')).toHaveCount(13);
  }
});

test('CTA vocabulary — editorial, data-room and RSS labels stay canonical', async ({ page }) => {
  const cases = [
    ['/societe', ['Ouvrir la data room']],
    ['/societe-en', ['Open the data room']],
    ['/investisseurs', ['Lire l’éditorial stratégique', 'Ouvrir le flux RSS des Carnets']],
    ['/investisseurs-en', ['Read the strategic editorial', 'Open Stories RSS feed']],
  ];
  for (const [path, labels] of cases) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const visible = await page.locator('a.pp-btn, a.pp-link, a.btn, a.cta').allInnerTexts();
    const normalized = visible.map(x => x.replace(/\s+/g, ' ').trim());
    for (const label of labels) expect(normalized, path + ' canonical CTA ' + label).toContain(label);
  }
});

#!/usr/bin/env node
// Benchmark de laboratoire A/B : la meme liste de pages, servie localement en deux
// versions (reference et version mesuree), chargee en alternance sur la meme machine,
// cache vide a chaque chargement. Mediane de N chargements par page et par profil.
// Aucune requete vers la production : tout hote autre que 127.0.0.1 est bloque et compte.
//
// Usage : node scripts/bench/lab.mjs --base http://127.0.0.1:8701 --head http://127.0.0.1:8702
//         [--runs 5] [--profiles mobile,desktop] [--pages /,/amont/] [--out reports/bench] [--no-fail]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('base'), HEAD = arg('head');
if (!HEAD) { console.error('--head requis'); process.exit(2); }
const RUNS = +arg('runs', 5);
const OUT = arg('out', 'reports/bench');
const FAIL = !process.argv.includes('--no-fail');

// Un representant par gabarit du site.
const PAGES = arg('pages', [
  '/', '/index-en', '/ar', '/amont/', '/amont/eor', '/carnets', '/journal-gaz-torche',
  '/investisseurs', '/enerconseils/atlas', '/aval/boutique',
  '/configurateur-service-integre', '/amont/calculateur-baril-additionnel',
].join(',')).split(',');

// Mobile « N Djamena » : hypothese de reseau mobile lent a forte latence, processeur
// d entree de gamme (CPU ralenti x4). Desktop : connexion fixe correcte.
const PROFILES = {
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    net: { latency: 300, down: 1.6e6, up: 750e3 }, cpu: 4 },
  desktop: { viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1,
    net: { latency: 40, down: 10e6, up: 5e6 }, cpu: 1 },
};
const profiles = arg('profiles', 'mobile,desktop').split(',');

// Seuils de regression : la mediane doit se degrader de plus de « pct » ET de plus de « abs ».
const METRICS = {
  fcp: { label: 'FCP', unit: 'ms', pct: 0.10, abs: 100 },
  lcp: { label: 'LCP', unit: 'ms', pct: 0.10, abs: 100 },
  tbt: { label: 'TBT', unit: 'ms', pct: 0.10, abs: 100 },
  cls: { label: 'CLS', unit: '', pct: 0, abs: 0.02 },
  style: { label: 'Recalcul de style', unit: 'ms', pct: 0.10, abs: 100 },
  bytes: { label: 'Octets transferes', unit: 'Ko', pct: 0.05, abs: 5 },
  requests: { label: 'Requetes', unit: '', pct: 0.10, abs: 3 },
};

const INIT = `(() => {
  const s = window.__bench = { lcp: 0, cls: 0, lt: [] };
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) s.lcp = e.startTime; })
    .observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) s.cls += e.value; })
    .observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) s.lt.push([e.startTime, e.duration]); })
    .observe({ type: 'longtask', buffered: true }); } catch (e) {}
})();`;

const median = a => { const b = [...a].sort((x, y) => x - y); const n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : NaN; };

async function measure(browser, origin, pagePath, prof) {
  const P = PROFILES[prof];
  const ctx = await browser.newContext({ viewport: P.viewport, isMobile: P.isMobile, hasTouch: P.hasTouch,
    deviceScaleFactor: P.deviceScaleFactor, serviceWorkers: 'block', colorScheme: 'dark' });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  let bytes = 0, requests = 0, external = 0;
  const local = new Set();
  cdp.on('Network.requestWillBeSent', e => {
    const u = e.request.url;
    if (u.startsWith('data:') || u.startsWith('blob:')) return;
    if (!u.startsWith(origin)) external++; else { requests++; local.add(e.requestId); }
  });
  cdp.on('Network.loadingFinished', e => { if (local.has(e.requestId)) bytes += e.encodedDataLength; });
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: P.net.latency,
    downloadThroughput: P.net.down / 8, uploadThroughput: P.net.up / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: P.cpu });
  await cdp.send('Performance.enable');
  await page.goto(origin + pagePath, { waitUntil: 'load', timeout: 180000 });
  await page.waitForTimeout(3000); // fenetre calme apres « load »
  const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const r = await page.evaluate(() => {
    const s = window.__bench;
    const fcp = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0;
    const tbt = s.lt.filter(([t]) => t >= fcp).reduce((a, [, d]) => a + Math.max(0, d - 50), 0);
    return { fcp, lcp: s.lcp || fcp, cls: s.cls, tbt };
  });
  await ctx.close();
  return { fcp: Math.round(r.fcp), lcp: Math.round(r.lcp), tbt: Math.round(r.tbt), cls: +r.cls.toFixed(4),
    style: Math.round((m.RecalcStyleDuration || 0) * 1000), bytes: Math.round(bytes / 1024), requests,
    external };
}

const versions = BASE ? [['base', BASE], ['head', HEAD]] : [['head', HEAD]];
// Tout hote autre que 127.0.0.1 est rendu introuvable : aucune charge sur la production
// ni sur des tiers, sans intercepter les requetes (ce qui fausserait les temps).
const browser = await chromium.launch({
  args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const raw = {}; // raw[prof][page][version] = [mesures]
for (const prof of profiles) {
  raw[prof] = {};
  for (const p of PAGES) {
    raw[prof][p] = Object.fromEntries(versions.map(([v]) => [v, []]));
    // chargement d echauffement, non compte
    for (const [, o] of versions) await measure(browser, o, p, prof).catch(() => {});
    for (let k = 0; k < RUNS; k++) {
      const order = k % 2 ? [...versions].reverse() : versions; // alternance A/B puis B/A
      for (const [v, o] of order) raw[prof][p][v].push(await measure(browser, o, p, prof));
    }
    const h = median(raw[prof][p].head.map(x => x.lcp));
    console.log(`${prof} ${p} LCP mediane ${h} ms` + (BASE ? ` (reference ${median(raw[prof][p].base.map(x => x.lcp))} ms)` : ''));
  }
}
await browser.close();

// Synthese
const rows = [], regressions = [], improvements = [];
let external = 0;
for (const prof of profiles) for (const p of PAGES) {
  const r = raw[prof][p];
  const med = v => Object.fromEntries(Object.keys(METRICS).map(k => [k, median(r[v].map(x => x[k]))]));
  const h = med('head'), b = BASE ? med('base') : null;
  external += r.head.reduce((a, x) => a + x.external, 0);
  rows.push({ prof, page: p, head: h, base: b });
  if (!b) continue;
  // Un ecart ne compte que s il depasse les deux seuils ET qu il est constant : au moins
  // 80 % des chargements de la version mesuree sont du meme cote de la mediane de reference.
  const need = Math.ceil(0.8 * RUNS);
  for (const [k, t] of Object.entries(METRICS)) {
    const d = h[k] - b[k];
    const above = r.head.filter(x => x[k] > b[k]).length, below = r.head.filter(x => x[k] < b[k]).length;
    if (d > t.abs && d > b[k] * t.pct && above >= need) regressions.push({ prof, page: p, metric: k, base: b[k], head: h[k] });
    else if (-d > t.abs && -d > b[k] * t.pct && below >= need) improvements.push({ prof, page: p, metric: k, base: b[k], head: h[k] });
  }
}

const fmt = (k, v) => v == null || Number.isNaN(v) ? '—' : k === 'cls' ? v.toFixed(3) : String(Math.round(v));
const cell = (k, row) => row.base ? `${fmt(k, row.head[k])} <sub>(${fmt(k, row.base[k])})</sub>` : fmt(k, row.head[k]);
const md = ['## Benchmark de laboratoire', '',
  `Serveur local, cache vide, mediane de ${RUNS} chargements par page${BASE ? ', reference entre parentheses' : ''}. ` +
  'Mobile : latence 300 ms, 1,6 Mb/s, CPU x4. Desktop : latence 40 ms, 10 Mb/s.', ''];
for (const prof of profiles) {
  md.push(`### ${prof}`, '', '| Page | FCP ms | LCP ms | TBT ms | CLS | Style ms | Ko | Req. |', '|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const row of rows.filter(x => x.prof === prof))
    md.push(`| \`${row.page}\` | ${['fcp', 'lcp', 'tbt', 'cls', 'style', 'bytes', 'requests'].map(k => cell(k, row)).join(' | ')} |`);
  md.push('');
}
const list = (title, a) => { md.push(`### ${title}`, ''); if (!a.length) md.push('Aucune.', ''); else { for (const x of a) md.push(`- ${x.prof} \`${x.page}\` — ${METRICS[x.metric].label} : ${fmt(x.metric, x.base)} -> ${fmt(x.metric, x.head)} ${METRICS[x.metric].unit}`); md.push(''); } };
if (BASE) { list('Regressions', regressions); list('Ameliorations', improvements); }
md.push(`Requetes vers d autres hotes (bloquees) : ${external}.`, '');

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'lab.json'), JSON.stringify({ base: BASE, head: HEAD, runs: RUNS, profiles, rows, regressions, improvements, raw }, null, 1));
fs.writeFileSync(path.join(OUT, 'lab.md'), md.join('\n'));
console.log(md.join('\n'));
if (regressions.length) for (const x of regressions) console.log(`::warning::Regression ${x.prof} ${x.page} ${METRICS[x.metric].label} ${fmt(x.metric, x.base)} -> ${fmt(x.metric, x.head)}`);
process.exit(FAIL && regressions.length ? 1 : 0);

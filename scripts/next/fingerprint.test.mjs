import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fingerprintContents, rewriteRefs, digest } from './fingerprint.mjs';

test('a content change changes the URL; identical content keeps it', () => {
  const a = fingerprintContents({ 'site.css': 'a{color:red}' }).versions['site.css'];
  const b = fingerprintContents({ 'site.css': 'a{color:blue}' }).versions['site.css'];
  assert.match(a, /^[0-9a-f]{12}$/);
  assert.notEqual(a, b);
  assert.equal(a, fingerprintContents({ 'site.css': 'a{color:red}' }).versions['site.css']);
  assert.equal(a, digest('a{color:red}'));
});

test('hand-set ?b= versions are replaced; unknown files and other extensions are left alone', () => {
  const versions = { 'nav_a.css': '0123456789ab', 'x.js': 'ba9876543210' };
  const html = '<link href="/assets/chrome/nav_a.css?b=202608300720"><script src="/assets/chrome/x.js"></script>' +
    '<link href="/assets/chrome/other.css?b=1"><a href="/assets/chrome/x.json">';
  assert.equal(rewriteRefs(html, versions),
    '<link href="/assets/chrome/nav_a.css?v=0123456789ab"><script src="/assets/chrome/x.js?v=ba9876543210"></script>' +
    '<link href="/assets/chrome/other.css?b=1"><a href="/assets/chrome/x.json">');
  assert.equal(rewriteRefs(rewriteRefs(html, versions), versions), rewriteRefs(html, versions));
});

test('the version follows the published bytes (minified stylesheet)', () => {
  const min = (name, text) => text.replace(/\s+/g, '');
  assert.equal(fingerprintContents({ 'a.css': 'a { }' }, min).versions['a.css'], digest('a{}'));
});

test('a resource that loads another one changes URL when its dependency changes', () => {
  const v1 = fingerprintContents({ 'form.js': "l.href='/assets/chrome/form.css?b=1'", 'form.css': 'a{}' });
  const v2 = fingerprintContents({ 'form.js': "l.href='/assets/chrome/form.css?b=1'", 'form.css': 'b{}' });
  assert.notEqual(v1.versions['form.js'], v2.versions['form.js']);
  assert.equal(v1.rewritten['form.js'], `l.href='/assets/chrome/form.css?v=${v1.versions['form.css']}'`);
});

test('the build restores the sources it transformed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'enertchad-sources-'));
  try {
    await mkdir(join(root, 'scripts'));
    await writeFile(join(root, 'page.html'), '<!doctype html><title>Source</title>');
    // Etape de generation du build (registre des documents) simulee par un script factice.
    await writeFile(join(root, 'scripts/refresh_document_metadata.py'),
      "from pathlib import Path\np=Path('page.html');p.write_text(p.read_text().replace('Source','Built'))\n");
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    execFileSync('git', ['add', '.'], { cwd: root });
    execFileSync(process.execPath, [join(process.cwd(), 'scripts/next/prepare.mjs')], { cwd: root });
    assert.match(await readFile(join(root, 'page.html'), 'utf8'), /Built/);
    assert.match(await readFile(join(root, '.generated/transformed/page.html'), 'utf8'), /Built/);
    const script = `import { restoreSources } from ${JSON.stringify(join(process.cwd(), 'scripts/next/sources.mjs'))};console.log(JSON.stringify(await restoreSources()))`;
    const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: root, encoding: 'utf8' }));
    assert.equal(result.restored, 1);
    assert.equal(await readFile(join(root, 'page.html'), 'utf8'), '<!doctype html><title>Source</title>');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

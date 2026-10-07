import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const prepare = resolve('scripts/next/prepare.mjs');
for (const tracked of [false, true]) {
  test('public security contact survives ' + (tracked ? 'Git checkout' : 'source ZIP') + ' export', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enertchad-public-'));
    try {
      await mkdir(join(root, '.well-known'));
      await writeFile(join(root, 'index.html'), '<!doctype html><title>Fixture</title>');
      await writeFile(join(root, '.well-known/security.txt'), 'Contact: mailto:security@example.com\n');
      await writeFile(join(root, '.well-known/private.txt'), 'private fixture');
      await writeFile(join(root, '.env'), 'PRIVATE_FIXTURE=true');
      if (tracked) {
        execFileSync('git', ['init', '--quiet'], { cwd: root });
        execFileSync('git', ['add', '.'], { cwd: root });
      }
      execFileSync(process.execPath, [prepare], { cwd: root });
      assert.equal(await readFile(join(root, 'public/.well-known/security.txt'), 'utf8'), 'Contact: mailto:security@example.com\n');
      await assert.rejects(access(join(root, 'public/.well-known/private.txt')));
      await assert.rejects(access(join(root, 'public/.env')));
      const manifest = JSON.parse(await readFile(join(root, '.generated/site.json'), 'utf8'));
      assert(manifest.assets.includes('.well-known/security.txt'));
      assert(!manifest.assets.includes('.well-known/private.txt'));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deploymentRevision } from './revision.mjs';

test('source ZIP revision is deterministic, changes with content, and honours COMMIT_REF', async () => {
  const original = process.cwd(), commit = process.env.COMMIT_REF;
  const root = await mkdtemp(join(tmpdir(), 'enertchad-revision-'));
  try {
    process.chdir(root);
    delete process.env.COMMIT_REF;
    await writeFile('index.html', 'First version');
    await writeFile('style.css', 'body{}');
    const manifest = { pages: [{ source: 'index.html' }], assets: ['style.css'] };
    const first = await deploymentRevision(manifest);
    assert.match(first, /^source-[a-f0-9]{64}$/);
    assert.equal(await deploymentRevision(manifest), first);
    await writeFile('style.css', 'body{color:red}');
    assert.notEqual(await deploymentRevision(manifest), first);
    process.env.COMMIT_REF = 'explicit-revision';
    assert.equal(await deploymentRevision(manifest), 'explicit-revision');
  } finally {
    process.chdir(original);
    if (commit === undefined) delete process.env.COMMIT_REF;
    else process.env.COMMIT_REF = commit;
    await rm(root, { recursive: true, force: true });
  }
});

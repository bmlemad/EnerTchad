import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export async function deploymentRevision(manifest) {
  if (process.env.COMMIT_REF?.trim()) return process.env.COMMIT_REF.trim();
  try {
    // Do not borrow the revision of an unrelated parent repository for a ZIP.
    await readFile('.git/HEAD').catch(async () => {
      const gitfile = await readFile('.git', 'utf8');
      if (!gitfile.startsWith('gitdir: ')) throw Error('Missing Git metadata');
    });
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    const hash = createHash('sha256');
    const files = [...new Set([...manifest.pages.map(page => page.source), ...manifest.assets])].sort();
    for (const file of files) {
      const content = await readFile(file);
      hash.update(JSON.stringify([file, content.length]) + '\n');
      hash.update(content);
    }
    return 'source-' + hash.digest('hex');
  }
}

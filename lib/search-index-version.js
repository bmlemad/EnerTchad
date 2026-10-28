import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// The search index is public static data: change its URL whenever its bytes change.
export function withSearchIndexVersion(html) {
  return html.replace(/(\/assets\/data\/recherche-(fr|en)\.json)\?v=[^'"\s<>]+/g, (_, path, language) => {
    const data = readFileSync(new URL(`../assets/data/recherche-${language}.json`, import.meta.url));
    return path + '?v=' + createHash('sha256').update(data).digest('hex').slice(0, 12);
  });
}

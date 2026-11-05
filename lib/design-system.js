// A single first-paint component contract. Kept inline so the existing critical
// stylesheet sets and their fingerprints remain valid; no additional request.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const css = readFileSync(resolve(process.cwd(), 'assets/chrome/design-system.css'), 'utf8');
export function withDesignSystem(html) {
  if (html.includes('data-et-design-system') || !/<body\b/i.test(html)) return html;
  const head = /<head\b[^>]*>/i.exec(html) || /<html\b[^>]*>/i.exec(html);
  if (!head) return html;
  const at = head.index + head[0].length;
  return html.slice(0, at) + '<style data-et-design-system="1">' + css + '</style>' + html.slice(at);
}

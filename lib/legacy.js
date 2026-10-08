import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withYouTubeBadge } from './youtube.js';
import { withNewsletterStatus } from './newsletter.js';
import manifest from '../.generated/site.json';

export const legacyPages = manifest.pages.filter(page => !page.native && page.route !== '/');
export function legacyHtml(route) {
  const page = manifest.pages.find(page => page.route === route && !page.native);
  if (!page) return null;
  return withYouTubeBadge(withNewsletterStatus(readFileSync(resolve(process.cwd(), page.source), 'utf8')));
}
export function htmlResponse(html) {
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

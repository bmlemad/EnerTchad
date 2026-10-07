import { legacyHtml, legacyPages, htmlResponse } from '../../lib/legacy';
export const dynamic = 'force-static';
export const dynamicParams = false;
export function generateStaticParams() {
  return legacyPages.map(page => ({ slug: page.route.slice(1).split('/') }));
}
export async function GET(_request, { params }) {
  const { slug } = await params;
  const html = legacyHtml('/' + slug.join('/'));
  return html === null ? new Response('Not found', { status: 404 }) : htmlResponse(html);
}

import { legacyHtml, htmlResponse } from '../lib/legacy';
export const dynamic = 'force-static';
export function GET() { return htmlResponse(legacyHtml('/')); }

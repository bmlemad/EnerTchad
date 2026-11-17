import { withPageShare } from './page-share.js';
import { withDesignSystem } from './design-system.js';
import { withClientQaFixes } from './client-qa-fixes.js';
import { withVisualPriorities } from './visual-priorities.js';
import { withNavigationReview } from './navigation-review.js';
import { withMainNav } from './main-nav.js';
import { withArNav } from './ar-nav.js';
import { withImmersifPoles } from './immersif-poles.js';
import { withImmersifAmont } from './immersif-amont.js';
import { withImmersifJournal } from './immersif-journal.js';
import { withPoleFolds } from './pole-folds.js';
import { withBlockFolds } from './block-folds.js';
import { withSearchIndexVersion } from './search-index-version.js';
import { withQualifiedEnquiries } from './qualified-enquiries.js';
import { withBusinessJourneys } from './business-journeys.js';
import { withArchitectureWayfinding, withEditorialType, withAccessibleBackToTop } from './corporate-architecture.js';
// The EnerTchad channel is pending Google verification. Do not link a personal channel.
// Text colours carry !important inline: the light-theme sheets repaint every footer span (#2a3648 !important),
// which left "— Bientôt disponible" at 1.25:1 on the badge background (WCAG 1.4.3).
const YOUTUBE_BADGE = false;
export function withYouTubeBadge(html) {
  html = withDesignSystem(html);
  html = withClientQaFixes(html);
  html = withVisualPriorities(html);
  html = withBusinessJourneys(html);
  html = withQualifiedEnquiries(html);
  html = withSearchIndexVersion(html);
  html = withMainNav(html); // lot 80 : menu principal unique, avant la revue de navigation
  html = withArNav(html); // lot 108 : menu mobile des pages arabes
  html = withImmersifPoles(html); // lot 113 : scène et pastilles d'état sur les pages d'entrée des pôles
  html = withImmersifAmont(html); // lot 122 : scène « ce que nous mettons en œuvre » sur dix pages sous /amont
  html = withImmersifJournal(html); // lot 138 : scène immersive dans les articles du journal (33 FR, 33 EN)
  html = withPoleFolds(html); // lot 136 : le détail des pages de pôle se replie sous son titre
  html = withBlockFolds(html); // lot 137 : la suite des blocs longs se replie (Investisseurs, Services parapétroliers)
  html = withNavigationReview(html);
  html = withArchitectureWayfinding(html);
  html = withEditorialType(html);
  html = withAccessibleBackToTop(html);
  html = withPageShare(html);
  // 17 novembre 2026 (décision du DG) : la pastille « YouTube — Bientôt disponible » n'est plus ajoutée au pied de page ;
  // elle reviendra, comme lien, quand la chaîne sera vérifiée. Le reste de la chaîne de transformations ne change pas.
  if (!YOUTUBE_BADGE || html.includes('data-social="youtube"') || !/<\/footer>/i.test(html)) return html;
  const language = html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1] || 'fr';
  const status = language.startsWith('ar') ? 'قريبًا' : language.startsWith('en') ? 'Coming soon' : 'Bientôt disponible';
  const badge = `<div data-social="youtube" style="display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap;width:fit-content;max-width:calc(100% - 40px);margin:16px auto;padding:10px 16px;border-radius:12px;background:#172638;font:500 13px/1.5 system-ui,sans-serif;color:#f5f7fa"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="20" viewBox="0 0 28 20" aria-hidden="true" focusable="false"><rect width="28" height="20" rx="5" fill="#ff0000"/><path d="M11 5.5v9l8-4.5z" fill="#fff"/></svg><span style="color:#f5f7fa!important;-webkit-text-fill-color:#f5f7fa!important">YouTube</span><span style="color:#c9d3df!important;-webkit-text-fill-color:#c9d3df!important">— ${status}</span></div>`;
  return html.replace(/<\/footer>/i, badge + '</footer>');
}

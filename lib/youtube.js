// The EnerTchad channel is pending Google verification. Do not link a personal channel.
// Text colours carry !important inline: the light-theme sheets repaint every footer span (#2a3648 !important),
// which left "— Bientôt disponible" at 1.25:1 on the badge background (WCAG 1.4.3).
export function withYouTubeBadge(html) {
  if (html.includes('data-social="youtube"') || !/<\/footer>/i.test(html)) return html;
  const language = html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1] || 'fr';
  const status = language.startsWith('ar') ? 'قريبًا' : language.startsWith('en') ? 'Coming soon' : 'Bientôt disponible';
  const badge = `<div data-social="youtube" style="display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap;width:fit-content;max-width:calc(100% - 40px);margin:16px auto;padding:10px 16px;border-radius:12px;background:#172638;font:500 13px/1.5 system-ui,sans-serif;color:#f5f7fa"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="20" viewBox="0 0 28 20" aria-hidden="true" focusable="false"><rect width="28" height="20" rx="5" fill="#ff0000"/><path d="M11 5.5v9l8-4.5z" fill="#fff"/></svg><span style="color:#f5f7fa!important;-webkit-text-fill-color:#f5f7fa!important">YouTube</span><span style="color:#c9d3df!important;-webkit-text-fill-color:#c9d3df!important">— ${status}</span></div>`;
  return html.replace(/<\/footer>/i, badge + '</footer>');
}

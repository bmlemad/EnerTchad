// Apply the same sharing control to every footer that contains social links.
export function withPageShare(html) {
  if (html.includes('data-page-share')) return html;
  const language = html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1] || 'fr';
  const label = language.startsWith('ar') ? 'مشاركة هذه الصفحة' : language.startsWith('en') ? 'Share this page' : 'Partager cette page';
  const button = `<button type="button" data-page-share disabled aria-label="${label}" title="${label}" style="display:inline-grid;place-items:center;flex:none;width:38px;height:38px;padding:0;margin:0;box-sizing:border-box;border:1px solid var(--pf-line,var(--hair,currentColor));border-radius:50%;background:transparent;color:var(--pf-ink,var(--muted,currentColor));cursor:pointer;appearance:none"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.27 3.27 0 0 0 0-1.4l7.05-4.11A3 3 0 1 0 15 5c0 .23.03.46.08.68L8.03 9.79a3 3 0 1 0 0 4.42l7.12 4.16a3 3 0 1 0 2.85-2.29Z"/></svg></button>`;
  let inserted = false;
  html = html.replace(/(<div\b[^>]*\bclass=["'][^"']*\bfoot-social\b[^"']*["'][^>]*>)([\s\S]*?)(<\/div>)/gi,
    (_, open, links, close) => { inserted = true; return open + links + button + close; });
  if (!inserted) return html;
  return html.replace(/<\/body>/i, '<script src="/assets/chrome/page-share.js?v=20261015-2" defer></script></body>');
}

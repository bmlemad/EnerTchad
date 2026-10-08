// The EnerTchad channel is pending Google verification. Do not link a personal channel.
export function withYouTubeBadge(html) {
  if (html.includes('data-social="youtube"') || !/<\/footer>/i.test(html)) return html;
  const language = html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1] || 'fr';
  const status = language.startsWith('ar') ? 'قريبًا' : language.startsWith('en') ? 'Coming soon' : 'Bientôt disponible';
  const badge = `<div data-social="youtube" style="display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap;width:fit-content;max-width:calc(100% - 40px);margin:16px auto;padding:10px 16px;border-radius:12px;background:#172638;font:500 13px/1.5 system-ui,sans-serif;color:#f5f7fa"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="20" viewBox="0 0 28 20" aria-hidden="true" focusable="false"><rect width="28" height="20" rx="5" fill="#ff0000"/><path d="M11 5.5v9l8-4.5z" fill="#fff"/></svg><span>YouTube</span><span style="opacity:.8">— ${status}</span></div>`;
  return html.replace(/<\/footer>/i, badge + '</footer>');
}

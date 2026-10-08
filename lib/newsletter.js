// Replace the old mail-composer subscription with an honest status until Brevo is connected.
export function withNewsletterStatus(html) {
  const en = /<html\b[^>]*\blang=["']en/i.test(html);
  const ar = /<html\b[^>]*\blang=["']ar/i.test(html);
  const label = ar ? 'النشرة الإخبارية قيد الإعداد' : en ? 'Newsletter registration is being prepared' : 'Inscription à la newsletter en préparation';
  const href = en ? '/newsletter-en' : '/newsletter';
  html = html.replace(/<form\b[^>]*\bid=["']fnForm["'][^>]*>[\s\S]*?<\/form>/gi, `<p class="fn-alt"><a href="${href}">${label} →</a></p>`);
  return html.replace(/<p\b[^>]*class=["']fn-alt["'][^>]*>[\s\S]*?<\/p>/gi, match => match.includes('href="/newsletter') ? match : '');
}

// 28 novembre 2026 (proposition « communiqués par mois », lancée par le DG) : la liste des communiqués grandit chaque mois.
// Une ligne « Par mois » suit la ligne « S'abonner » de /communiques et /communiques-en : chaque mois renvoie à son premier
// communiqué, avec le nombre de communiqués du mois. Rien n'est écrit dans la source : la ligne est recalculée au build à
// partir des dates de la liste officielle (<time datetime>), et les générateurs qui lisent communiques.html sont inchangés.
const MONTHS = {
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const LABELS = {
  fr: { title: 'Par mois', aria: 'Communiqués par mois' },
  en: { title: 'By month', aria: 'Press releases by month' },
};

export function withReleasesByMonth(html) {
  if (html.includes('pp-rel-mois')) return html;
  const route = html.match(/<link[^>]*rel="canonical"[^>]*href="https:\/\/enertchad.com([^"]*)"/)?.[1]?.replace(/\/$/, '');
  const lang = route === '/communiques' ? 'fr' : route === '/communiques-en' ? 'en' : null;
  if (!lang) return html;
  const start = html.indexOf('<ol class="pp-releases">');
  if (start < 0) return html;
  const end = html.indexOf('</ol>', start);
  if (end < 0) return html;
  const months = [];
  const list = html.slice(start, end);
  for (const [, id, year, month] of list.matchAll(/<li id="(cp-\d+)">\s*<div class="pp-rel-meta">(?:(?!<\/div>)[\s\S])*?<time datetime="(\d{4})-(\d{2})-\d{2}">/g)) {
    const key = `${year}-${month}`;
    const last = months[months.length - 1];
    if (last && last.key === key) last.count++;
    else months.push({ key, id, label: `${MONTHS[lang][Number(month) - 1]} ${year}`, count: 1 });
  }
  // Une liste d'un seul mois, ou des dates hors d'ordre, ne justifient pas d'index.
  // Chaque communiqué doit être compté une fois : sinon la ligne n'est pas ajoutée.
  const total = months.reduce((n, m) => n + m.count, 0);
  if (total !== (list.match(/<li id="cp-\d+">/g) || []).length) return html;
  if (months.length < 2 || new Set(months.map(m => m.key)).size !== months.length) return html;
  const links = months.map(m => `<a href="#${m.id}">${m.label}&nbsp;(${m.count})</a>`).join('');
  const nav = `<nav class="pp-rel-abo pp-rel-mois" aria-label="${LABELS[lang].aria}"><b>${LABELS[lang].title}</b>${links}</nav>`;
  return html.slice(0, start) + nav + html.slice(start);
}

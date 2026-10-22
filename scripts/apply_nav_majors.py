"""Close the navigation QA majors of 22 October 2026 after every other migration.

Idempotent, run at build time by scripts/apply_readiness_20261013.py (last step):
  1. /carnets(-en): the masthead starts below the fixed header (--nav-h);
  4. Arabic footers: complete legal column (5 links), no duplicate legal bar, X link;
  5. service (svc) and short-page (sp) footers: the five legal links, © line on sp;
  6. service header: wraps on narrow screens (no horizontal scroll on /404).
Footer « Rubriques » and the active section are handled in scripts/modernise_site.py.
Each transform checks the structure it expects and fails loudly when it is missing.
"""
from pathlib import Path
import html
import re

ROOT = Path(__file__).resolve().parents[1]
LEGAL = {
    'fr': [('/mentions-legales', 'Mentions légales'), ('/confidentialite', 'Confidentialité'), ('/cookies', 'Cookies'),
           ('/accessibilite', 'Accessibilité'), ('/avertissements', 'Avertissements')],
    'en': [('/mentions-legales-en', 'Legal notice'), ('/confidentialite-en', 'Privacy'), ('/cookies-en', 'Cookies'),
           ('/accessibilite-en', 'Accessibility'), ('/avertissements-en', 'Disclaimers')],
    'ar': [('/mentions-legales', 'الإشعارات القانونية (FR)'), ('/confidentialite', 'سياسة الخصوصية (FR)'), ('/ar-cookies', 'ملفات الارتباط'),
           ('/accessibilite', 'إمكانية الوصول (FR)'), ('/avertissements', 'إخلاء المسؤولية (FR)')],
}
LEGAL_PATHS = {h for rows in LEGAL.values() for h, _ in rows}
OFFSET = 'padding-top:calc(var(--nav-h,120px) + clamp(24px,4vw,56px))!important'
CSS_START, CSS_END = '/* nav-majors:start */', '/* nav-majors:end */'
SVC_CSS = ('.svc-top{flex-wrap:wrap;row-gap:10px}.svc-top>a{min-width:0}'
           '.svc-top nav{flex-wrap:wrap;row-gap:8px;column-gap:16px;min-width:0}')


def edit(path, transform):
    p = ROOT / path
    old = p.read_text(encoding='utf-8')
    new = transform(old)
    if new != old:
        p.write_text(new, encoding='utf-8')


def links(rows):
    return ''.join(f'<a href="{h}">{html.escape(t, quote=False)}</a>' for h, t in rows)


def year():
    m = re.search(r'©\s*(\d{4})', (ROOT / 'index.html').read_text(encoding='utf-8'))
    if not m:
        raise ValueError('Copyright year missing from the main footer')
    return m[1]


def carnets(s):
    if 'data-nav-offset' in s:
        return s
    tag = re.compile(r'<section id="journal" class="pp-journal"')
    if len(tag.findall(s)) != 1:
        raise ValueError('carnets: journal masthead section not found exactly once')
    return tag.sub(f'<section id="journal" class="pp-journal" data-nav-offset style="{OFFSET}"', s, count=1)


def x_link():
    page = (ROOT / 'index.html').read_text(encoding='utf-8')
    m = re.search(r'<a\b[^>]*data-social="x"[^>]*>(<svg\b.*?</svg>)</a>', page, re.S)
    if not m:
        raise ValueError('X link missing from the main footer')
    return ('<a aria-label="X" data-social="x" href="https://x.com/enertchad" rel="noopener" target="_blank" title="X">'
            + m[1] + '</a>')


def arabic(s, xa):
    if 'class="pft pft-ar"' not in s:
        raise ValueError('Arabic premium footer missing')
    col = re.compile(r'<div class="foot-col"><h3>معلومات</h3>.*?</div>', re.S)
    if len(col.findall(s)) != 1:
        raise ValueError('Arabic information column not found exactly once')
    s = col.sub(lambda m: '<div class="foot-col"><h3>معلومات</h3>' + links(LEGAL['ar']) + '</div>', s, count=1)
    s = re.sub(r'<span class="foot-legal-links">.*?</span>', '', s, count=1, flags=re.S)
    if 'data-social="x"' not in s:
        tiktok = re.compile(r'(<a\b[^>]*data-social="tiktok"[^>]*>.*?</a>)', re.S)
        if len(tiktok.findall(s)) != 1:
            raise ValueError('Arabic footer: TikTok link not found exactly once')
        s = tiktok.sub(lambda m: m[1] + xa, s, count=1)
    return s


def service(s, lang):
    foot = re.compile(r'(<footer class="svc-foot"><span>[^<]*</span>).*?(</footer>)', re.S)
    if len(foot.findall(s)) != 1:
        raise ValueError('service footer not found exactly once')
    return foot.sub(lambda m: m[1] + links(LEGAL[lang]) + m[2], s, count=1)


def short_page(s, lang, yr):
    foot = re.compile(r'<footer class="sp-footer"><div class="sp-wrap"><span>(?:© \d{4} )?([^<]*)</span><span>(.*?)</span></div></footer>', re.S)
    m = foot.search(s)
    if not m or len(foot.findall(s)) != 1:
        raise ValueError('short-page footer not found exactly once')
    kept = [a for a in re.findall(r'<a\b[^>]*>.*?</a>', m[2], re.S)
            if re.search(r'href="([^"?#]*)', a)[1] not in LEGAL_PATHS]
    body = ' · '.join(kept + [f'<a href="{h}">{html.escape(t, quote=False)}</a>' for h, t in LEGAL[lang]])
    return s[:m.start()] + (f'<footer class="sp-footer"><div class="sp-wrap"><span>© {yr} {m[1]}</span>'
                            f'<span>{body}</span></div></footer>') + s[m.end():]


def service_css():
    p = ROOT / 'assets/chrome/service-20261013.css'
    css = p.read_text(encoding='utf-8')
    clean = re.sub(re.escape(CSS_START) + r'.*?' + re.escape(CSS_END) + r'\n?', '', css, flags=re.S)
    new = clean.rstrip('\n') + '\n' + CSS_START + SVC_CSS + CSS_END + '\n'
    if new != css:
        p.write_text(new, encoding='utf-8')


def main():
    for name in ('carnets.html', 'carnets-en.html'):
        edit(name, carnets)
    xa = x_link()
    arabic_pages = sorted(p.name for p in ROOT.glob('ar*.html'))
    if len(arabic_pages) != 9:
        raise ValueError(f'expected 9 Arabic pages, found {len(arabic_pages)}')
    for name in arabic_pages:
        edit(name, lambda s: arabic(s, xa))
    for name, lang in (('404.html', 'fr'), ('newsletter.html', 'fr'), ('contact-received.html', 'fr'),
                       ('newsletter-en.html', 'en'), ('contact-received-en.html', 'en'), ('contact-received-ar.html', 'ar')):
        edit(name, lambda s, lang=lang: service(s, lang))
    yr = year()
    for name, lang in (('essentiel.html', 'fr'), ('investor-center.html', 'fr'),
                       ('essentiel-en.html', 'en'), ('investor-center-en.html', 'en')):
        edit(name, lambda s, lang=lang: short_page(s, lang, yr))
    service_css()
    print('Navigation QA majors aligned: carnets offset, Arabic, service and short-page footers, service header wrap')


if __name__ == '__main__':
    main()

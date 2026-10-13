"""Give typed enquiry links a direct, accessible form destination."""
import html
import re
from pathlib import Path
from urllib.parse import parse_qs, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
PROFILES = {'ep', 'b2b', 'partenariat', 'b2g', 'invest', 'talents', 'presse', 'autre', 'particulier', 'fournisseur', 'centrale-achat', 'achats'}


def transform(text, page_name):
    lang = re.search(r'<html\b[^>]*\blang=["\']([^"\']+)', text)
    if not lang or lang[1].split('-')[0] not in ('fr', 'en'):
        return text

    def route(match):
        anchor = match.group()
        href = re.search(r'href=["\']([^"\']+)', anchor)
        if not href:
            return anchor
        url = urlsplit(html.unescape(href[1]))
        if url.scheme not in ('', 'https') or url.netloc not in ('', 'enertchad.com', 'www.enertchad.com'):
            return anchor
        if url.path not in ('/contact', '/contact-en') or url.fragment:
            return anchor
        profile = parse_qs(url.query).get('profil', [''])[0]
        if profile not in PROFILES:
            return anchor
        target = urlunsplit((url.scheme, url.netloc, url.path, url.query, 'ctForm'))
        return anchor.replace(href[1], html.escape(target, quote=True), 1)

    text = re.sub(r'<a\b[^>]*>.*?</a>', route, text, flags=re.S)
    if page_name in ('contact.html', 'contact-en.html'):
        title = 'Write to us' if lang[1].startswith('en') else 'Écrivez-nous'
        text = re.sub(r'(<h2\b)([^>]*>)' + re.escape(title) + r'(</h2>)',
                      lambda m: m[0] if 'id=' in m[2] else m[1] + ' id="ctFormTitle"' + m[2] + title + m[3], text, count=1)
        def accessible_form(match):
            tag = match.group()
            if 'aria-labelledby=' not in tag:
                tag = tag[:-1] + ' aria-labelledby="ctFormTitle">'
            if 'tabindex=' not in tag:
                tag = tag[:-1] + ' tabindex="-1">'
            return tag
        text = re.sub(r'<form\b[^>]*\bid="ctForm"[^>]*>', accessible_form, text, count=1)
        style = '<style id="et-enquiry-access">#ctForm{scroll-margin-top:18rem}#ctForm:focus{outline:2px solid var(--gold,#dbc17b);outline-offset:8px}@media(max-width:760px){#ctForm{scroll-margin-top:14rem}}</style>'
        if 'id="et-enquiry-access"' not in text:
            text = text.replace('</head>', style + '</head>', 1)
    return text


def main():
    excluded = {'.git', '.next', 'out', 'node_modules', 'public', 'reports', 'qa'}
    changed = 0
    for page in ROOT.rglob('*.html'):
        if any(part in excluded for part in page.relative_to(ROOT).parts):
            continue
        old = page.read_text(encoding='utf-8')
        name = page.name if page.parent == ROOT else str(page.relative_to(ROOT))
        new = transform(old, name)
        if new != old:
            page.write_text(new, encoding='utf-8')
            changed += 1
    keys = '|'.join(sorted(PROFILES, key=len, reverse=True))
    for name in ('lib/strategic.jsx', 'scripts/next/subsites.mjs'):
        page = ROOT / name
        old = page.read_text(encoding='utf-8')
        new = re.sub(r'(/contact(?:-en)?\?profil=(?:' + keys + r'))(?![a-z-]|#)', r'\1#ctForm', old)
        new = re.sub(r'(/contact\$\{suffix\}\?profil=invest)(?!#)', r'\1#ctForm', new)
        new = re.sub(r"(/contact\$\{en \? '-en' : ''\}\?profil=invest)(?!#)", r'\1#ctForm', new)
        if new != old:
            page.write_text(new, encoding='utf-8')
    print(f'Direct enquiry-form access aligned: {changed} source pages and generated headers')


if __name__ == '__main__':
    main()

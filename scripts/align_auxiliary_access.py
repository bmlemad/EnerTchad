"""Provide keyboard bypass links on lightweight forms and confirmation pages."""
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
LABELS = {'fr': 'Aller au contenu principal', 'en': 'Skip to main content', 'ar': 'انتقل إلى المحتوى الرئيسي'}

def main():
    count = 0
    for name in ('contact-received.html', 'contact-received-en.html', 'contact-received-ar.html', 'newsletter.html', 'newsletter-en.html'):
        page = ROOT / name
        text = page.read_text(encoding='utf-8')
        lang = re.search(r'<html\b[^>]*lang="([^"]+)"', text)[1]
        if 'id="main-content"' not in text:
            text = re.sub(r'<main\b', '<main id="main-content" tabindex="-1"', text, count=1)
        if 'href="#main-content"' not in text:
            label = LABELS[lang]
            text = re.sub(r'(<body\b[^>]*>)', r'\1<a class="et-aux-skip" href="#main-content">' + label + '</a>', text, count=1)
            style = '<style id="et-aux-access">.et-aux-skip{position:fixed;top:8px;left:8px;z-index:99999;padding:12px 18px;background:#fff;color:#111;transform:translateY(-200%)}.et-aux-skip:focus{transform:none;outline:3px solid #dbc17b}#main-content{scroll-margin-top:2rem}</style>'
            text = text.replace('</head>', style + '</head>', 1)
        if text != page.read_text(encoding='utf-8'):
            page.write_text(text, encoding='utf-8')
            count += 1
    print(f'Auxiliary keyboard access aligned: {count} pages')

if __name__ == '__main__':
    main()

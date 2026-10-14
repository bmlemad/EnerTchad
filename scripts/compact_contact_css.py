"""Keep explanatory CSS comments in source templates, compact their build copies."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
# Quoted strings and escapes win over comment markers inside CSS values.
TOKEN = re.compile(r'''"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\\[\s\S]|/\*[\s\S]*?\*/''')


def compact(css):
    # Retain the comment delimiter: token boundaries and whitespace remain exact.
    return TOKEN.sub(lambda m: '/**/' if m[0].startswith('/*') else m[0], css)


def transform(html):
    return re.sub(r'(<style\b[^>]*>)([\s\S]*?)(</style>)',
                  lambda m: m[1] + compact(m[2]) + m[3], html, flags=re.I)


def main():
    for name in ('contact.html', 'contact-en.html'):
        page = ROOT / name
        old = page.read_text(encoding='utf-8')
        new = transform(old)
        if old != new:
            page.write_text(new, encoding='utf-8')
        print(f'Contact CSS comments compacted: {name}, {len(old.encode()) - len(new.encode())} bytes removed')


if __name__ == '__main__':
    main()

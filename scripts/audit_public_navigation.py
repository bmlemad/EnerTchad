"""Check public internal links; report browser-generated destinations separately."""
import html
import posixpath
import re
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from audit_search_navigation import destination, read_rules
root = Path('out')
rules = read_rules(Path('_redirects'))
count = 0
errors = set()
dynamic = set()

@lru_cache(None)
def check(url):
    parsed = urlsplit(url)
    # #top is a standard browser jump, even without an element id.
    if parsed.fragment == 'top':
        return destination(root, parsed.path, rules)
    # These pages deliberately generate their destination elements/state in JS.
    if re.fullmatch(r'/glossaire-petrolier(?:-en)?(?:\.html)?', parsed.path) and re.fullmatch(r't-[a-z0-9-]+', parsed.fragment):
        dynamic.add(url)
        return destination(root, parsed.path, rules)
    if parsed.path == '/configurateur-service-integre' and parsed.fragment.startswith('p='):
        dynamic.add(url)
        return destination(root, parsed.path, rules)
    return destination(root, url, rules)

for page in root.rglob('*.html'):
    rel = page.relative_to(root).as_posix()
    if rel.startswith('_subsites/'):
        continue
    route = '/' if rel == 'index.html' else '/' + rel[:-5]
    # Historical documents replaced by redirects are not public source pages.
    if any(300 <= rules.get(key, ('', 0))[1] < 400 for key in (route, '/' + rel)):
        continue
    for href in re.findall(r'<a\b[^>]*href=["\']([^"\']+)', page.read_text(encoding='utf-8'), re.I):
        parsed = urlsplit(html.unescape(href))
        if parsed.scheme not in ('', 'https', 'http') or parsed.netloc not in ('', 'enertchad.com', 'www.enertchad.com'):
            continue
        path = parsed.path or '/' + rel
        if not path.startswith('/'):
            path = '/' + posixpath.normpath(posixpath.dirname(rel) + '/' + path).lstrip('/')
        count += 1
        url = urlunsplit(('', '', path, parsed.query, parsed.fragment))
        try:
            check(url)
        except ValueError as error:
            errors.add(str(error))
for name in ('contact-received.html', 'contact-received-en.html', 'contact-received-ar.html', 'newsletter.html', 'newsletter-en.html'):
    text = (root / name).read_text(encoding='utf-8')
    assert 'href="#main-content"' in text and 'id="main-content"' in text, name
if errors:
    raise SystemExit('\n'.join(sorted(errors)))
print(f'Public navigation verified: {count} internal link occurrences; {len(dynamic)} distinct JS-driven destinations checked for page availability; five keyboard bypass links')

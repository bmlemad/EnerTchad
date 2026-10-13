"""Verify direct enquiry targets and accessible contact forms in the export."""
import html
import re
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from direct_enquiry_form import PROFILES

count = 0
errors = []
for page in Path('out').rglob('*.html'):
    text = page.read_text(encoding='utf-8')
    if not re.search(r'<html\b[^>]*\blang=["\'](?:fr|en)(?:-[^"\']*)?["\']', text):
        continue
    for tag in re.findall(r'<a\b[^>]*>', text):
        match = re.search(r'href=["\']([^"\']+)', tag)
        if not match:
            continue
        url = urlsplit(html.unescape(match[1]))
        if url.netloc not in ('', 'enertchad.com', 'www.enertchad.com') or url.path not in ('/contact', '/contact-en'):
            continue
        if parse_qs(url.query).get('profil', [''])[0] not in PROFILES:
            continue
        if not url.fragment:
            errors.append(str(page) + ': enquiry link has no direct destination')
        if url.fragment == 'ctForm':
            count += 1
for name in ('contact.html', 'contact-en.html'):
    text = (Path('out') / name).read_text(encoding='utf-8')
    form = re.search(r'<form\b[^>]*\bid="ctForm"[^>]*>', text)
    assert form, name + ': missing contact form'
    assert 'aria-labelledby="ctFormTitle"' in form[0], name + ': form has no accessible title'
    assert 'tabindex="-1"' in form[0], name + ': form cannot receive focus'
    assert 'id="ctFormTitle"' in text, name + ': missing visible form title'
if errors:
    raise SystemExit('\n'.join(errors))
assert count > 0, 'No direct enquiry links found'
print(f'Direct enquiry access verified: {count} links and both named, focusable forms')

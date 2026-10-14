"""Check Arabic contact access and foreign-document disclosures in the export."""
import re
from pathlib import Path
from align_arabic_readiness import FRENCH_DOCUMENTS
root = Path('out')
count = 0
for page in root.glob('ar*.html'):
    text = page.read_text(encoding='utf-8')
    for tag in re.findall(r'<a\b[^>]*>.*?</a>', text, re.S):
        if any('href="' + name + '"' in tag for name in FRENCH_DOCUMENTS):
            assert 'بالفرنسية' in tag, str(page)
            count += 1
text = (root / 'ar-contact.html').read_text(encoding='utf-8')
form = re.search(r'<form\b[^>]*id="ctForm"[^>]*>', text)[0]
assert 'aria-labelledby="contact-form-title"' in form
assert 'tabindex="-1"' in form
assert 'class="et-contact-inner"' in text
assert 'padding-inline:24px' in text
assert 'contact_profiles.js?b=2026101310' in text
assert '/ar-contact?profil=invest#ctForm' in (root / 'ar-investisseurs.html').read_text(encoding='utf-8')
assert count == 2, count
print(f'Arabic readiness verified: named contact form, investor destination, {count} foreign-document labels')

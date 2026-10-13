"""Check visible foreign-document labels throughout the English export."""
import html
import json
import re
from pathlib import Path

root = Path('out')
documents = {doc['path']: doc for doc in json.loads((root / 'assets/data/document-registry.json').read_text())['documents']}
count = 0
errors = []
for page in root.rglob('*.html'):
    text = page.read_text(encoding='utf-8')
    if not re.search(r'<html\b[^>]*\blang=["\']en(?:-[^"\']*)?["\']', text):
        continue
    for anchor in re.findall(r'<a\b[^>]*>.*?</a>', text, re.S):
        href = re.search(r'href=["\']([^"\']+)', anchor)
        if not href:
            continue
        doc = documents.get(html.unescape(href[1]))
        if not doc or doc['language'] not in ('fr', 'ar'):
            continue
        count += 1
        language = 'French' if doc['language'] == 'fr' else 'Arabic'
        visible = html.unescape(re.sub(r'<[^>]+>', ' ', anchor))
        if not re.search(r'\b' + language + r'\b|\b' + doc['language'].upper() + r'\b', visible, re.I):
            errors.append(str(page) + ': missing ' + language + ' label for ' + doc['path'])
brochure = (root / 'brochure-en.html').read_text(encoding='utf-8')
if 'href="/Brochure_EnerTchad_EN.pdf"' not in brochure:
    errors.append('English brochure landing page does not link to the English PDF')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'English download languages verified: {count} registered foreign-language document links')

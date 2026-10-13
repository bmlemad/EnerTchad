"""Check the formation-stage description throughout the production export."""
import html
import json
import re
from pathlib import Path
from align_company_descriptions import DESCRIPTIONS, HOME_PREVIEWS, ORGANIZATION_ID


def objects(node):
    if isinstance(node, list):
        for value in node:
            yield from objects(value)
    elif isinstance(node, dict):
        yield node
        for value in node.values():
            if isinstance(value, (dict, list)):
                yield from objects(value)


count = 0
for page in Path('out').rglob('*.html'):
    text = page.read_text(encoding='utf-8')
    match = re.search(r'<html\b[^>]*\blang=["\']([^"\']+)', text)
    if not match or match[1].split('-')[0] not in DESCRIPTIONS:
        continue
    lang = match[1].split('-')[0]
    homepage = str(page) in ('out/index.html', 'out/index-en.html')
    for raw in re.findall(r'<script\b[^>]*\btype=["\']application/ld\+json["\'][^>]*>(.*?)</script>', text, re.S):
        for node in objects(json.loads(raw)):
            if node.get('@type') == 'Organization' and node.get('@id') == ORGANIZATION_ID and node.get('description'):
                assert node['description'] == DESCRIPTIONS[lang], str(page) + ': inconsistent company description'
                count += 1
            if homepage and node.get('@type') == 'WebPage' and node.get('description'):
                assert node['description'] == HOME_PREVIEWS[lang], str(page) + ': inconsistent WebPage preview'
    if homepage:
        previews = {}
        for tag in re.findall(r'<meta\b[^>]*>', text):
            name = re.search(r'(?:name|property)=["\']([^"\']+)', tag)
            content = re.search(r'content="([^"]*)"', tag)
            if name and content:
                previews[name[1]] = html.unescape(content[1])
        for name in ('description', 'og:description', 'twitter:description'):
            assert previews.get(name) == HOME_PREVIEWS[lang], str(page) + ': inconsistent ' + name
assert count > 0, 'No full company descriptions found'
print(f'Formation-stage descriptions verified: {count} records and both homepage preview sets')

"""Align search previews and company descriptions with the published stage."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORGANIZATION_ID = 'https://enertchad.com/#organization'
DESCRIPTIONS = {
    'fr': 'EnerTchad est une société en constitution qui prépare un programme pétrolier intégré au Tchad. Les projets et capacités sont des objectifs soumis aux études, autorisations, financements et partenariats nécessaires.',
    'en': 'EnerTchad is a company in formation developing a proposed integrated oil programme in Chad. Projects and capacities remain targets, subject to the necessary studies, approvals, financing and partnerships.',
}
HOME_PREVIEWS = {
    'fr': 'EnerTchad, société en constitution, prépare un programme pétrolier intégré au Tchad. Projets, conditions et documents publics.',
    'en': 'EnerTchad is a company in formation developing a proposed integrated oil programme in Chad. Explore project status, conditions and public documents.',
}


def transform(text, page_name):
    match = re.search(r'<html\b[^>]*\blang=["\']([^"\']+)', text)
    if not match or match[1].split('-')[0] not in DESCRIPTIONS:
        return text
    lang = match[1].split('-')[0]
    homepage = page_name in ('index.html', 'index-en.html')

    def graph(node):
        if isinstance(node, list):
            for value in node:
                graph(value)
        elif isinstance(node, dict):
            if node.get('@type') == 'Organization' and node.get('@id') == ORGANIZATION_ID and node.get('description'):
                node['description'] = DESCRIPTIONS[lang]
            if homepage and node.get('@type') == 'WebPage' and node.get('description'):
                node['description'] = HOME_PREVIEWS[lang]
            for value in node.values():
                if isinstance(value, (dict, list)):
                    graph(value)

    def structured(match):
        data = json.loads(match[2])
        before = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        graph(data)
        after = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        if after == before:
            return match.group()
        return match[1] + after.replace('</', '<\\/') + match[3]

    text = re.sub(r'(<script\b[^>]*\btype=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', structured, text, flags=re.S)
    if homepage:
        def preview(match):
            tag = match.group()
            name = re.search(r'(?:name|property)=["\']([^"\']+)', tag)
            if not name or name[1] not in ('description', 'og:description', 'twitter:description'):
                return tag
            return re.sub(r'content=["\'][^"\']*["\']', 'content="' + html.escape(HOME_PREVIEWS[lang], quote=True) + '"', tag, count=1)
        text = re.sub(r'<meta\b[^>]*>', preview, text)
    return text


def main():
    excluded = {'.git', '.next', 'out', 'node_modules', 'public', 'reports', 'qa'}
    changed = 0
    for page in ROOT.rglob('*.html'):
        if any(part in excluded for part in page.relative_to(ROOT).parts):
            continue
        old = page.read_text(encoding='utf-8')
        # Only the corporate homepages receive the shared homepage preview.
        name = page.name if page.parent == ROOT else str(page.relative_to(ROOT))
        new = transform(old, name)
        if new != old:
            page.write_text(new, encoding='utf-8')
            changed += 1
    print(f'Formation-stage company descriptions aligned: {changed} source pages')


if __name__ == '__main__':
    main()

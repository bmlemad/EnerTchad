"""Check complete exported pages, including dedicated-space copies."""
import re
from pathlib import Path

count = menus = 0
for path in Path('out').rglob('*.html'):
    if path.name in ('404.html', '_not-found.html') or path.name.startswith('google'):
        continue
    source = path.read_text()
    assert len(re.findall(r'<footer\b', source)) == 1, f'{path}: expected one footer'
    if 'id="navLinks"' in source and 'data-et-modern="industrial"' in source:
        # 20 novembre 2026 (décision du DG) : deux espaces. Site principal : cinq liens ; Centre de Connaissances : sept.
        expected = 7 if 'data-et-space="centre"' in source else 5
        assert len(re.findall(r'class="nav-trigger(?: [^"]*)?"', source)) == expected, f'{path}: {expected} header links'
        menus += 1
    if 'class="et-space-header' in source:
        assert 'et-al-back' in source and 'et-al-lang' in source, f'{path}: subsite return and language switch'
    count += 1
assert count > 230
print(f'Footer and menu coherence verified: {count} exported pages, {menus} corporate menus')

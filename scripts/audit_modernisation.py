"""Verify the approved modernisation in the static export."""
import re
from pathlib import Path

ROOT = Path('out')
count = 0
for path in ROOT.rglob('*.html'):
    text = path.read_text()
    if 'data-et-modern="industrial"' not in text:
        continue
    if 'id="navLinks"' in text:
        assert len(re.findall(r'class="nav-trigger(?: [^"]*)?"', text)) == 4, str(path)
    for bar in re.findall(r'<nav\b[^>]*id="nezBar"[^>]*>.*?</nav>', text, re.S):
        assert len(re.findall(r'<a\b', bar)) == 3, str(path)
    count += 1
for suffix in ('', '-en'):
    home = (ROOT / ('index' + suffix + '.html')).read_text()
    assert 'id="mod-equipe"' in home
    assert home.count('class="et-seg-img"') == 4
    assert home.index('id="chaine"') < home.index('id="programme-cible"')
    library = (ROOT / ('publications' + suffix + '.html')).read_text()
    assert 'data-document-filter' in library
    assert len(re.findall('data-document-format=', library)) >= 10
    progress = (ROOT / ('projets' + suffix + '.html')).read_text()
    module = re.search(r'<!-- modern-projects:start -->(.*?)<!-- modern-projects:end -->', progress, re.S)[1]
    assert module.count('class="mod-card"') == 8
    assert 'class="et-project-table"' in progress
for path in ['amont/index.html', 'intermediaire/index.html', 'aval/index.html', 'petrochimie/index.html', 'pole-amont-en.html', 'pole-intermediaire-en.html', 'pole-aval-en.html', 'pole-enerchimie-en.html']:
    text = (ROOT / path).read_text()
    assert 'id="offre-services"' in text, path
    assert re.search(r'service=\w+#ctForm', text), path
assert count > 200
print(f'Modernisation verified: {count} pages; 4 menus, 3 mobile actions, 8 service pages, 16 project cards and 2 document libraries')

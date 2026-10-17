"""Preserve quote selections across the bilingual catalogue in the same tab."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
CODE = Path(__file__).with_name('catalogue-session.js').read_text()

def patch(source):
    source = re.sub(r'\n?/\* et-catalogue-session:start \*/.*?/\* et-catalogue-session:end \*/\n?', '', source, flags=re.S)
    source = re.sub(r'\n?/\* et-catalogue-save:start \*/.*?/\* et-catalogue-save:end \*/\n?', '', source, flags=re.S)
    marker = "var cart={},cur='tous';"
    if source.count(marker) != 1 or source.count('function renderCart(){') != 1:
        raise ValueError('Review catalogue initialisation before applying session preservation')
    boot = '/* et-catalogue-session:start */' + CODE + '\ntry{cart=EnerTchadCatalogueSession.read(window.sessionStorage,P)}catch(_){}\n/* et-catalogue-session:end */\n'
    save = '/* et-catalogue-save:start */try{EnerTchadCatalogueSession.save(window.sessionStorage,cart,P)}catch(_){}/* et-catalogue-save:end */\n'
    source = source.replace(marker, marker + '\n' + boot)
    return source.replace('function renderCart(){', 'function renderCart(){\n' + save)

if __name__ == '__main__':
    for name in ('boutique.html', 'boutique-en.html'):
        path = ROOT / 'aval' / name
        old = path.read_text()
        new = patch(old)
        if old != new:
            path.write_text(new)

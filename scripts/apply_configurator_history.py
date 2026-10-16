"""Restore shared configurator state on same-document URL navigation."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'Configurateur_Service_Integre_v2.html'
CODE = Path(__file__).with_name('configurator-history.js').read_text()
def patch(source):
    source = re.sub(r'<script id="et-config-history">.*?</script>\s*', '', source, flags=re.S)
    tag = '<script id="et-config-history">' + CODE + '</script>\n'
    if '</body>' in source:
        return source.replace('</body>', tag + '</body>')
    return source.rstrip() + '\n' + tag

if __name__ == '__main__':
    source = patch(PAGE.read_text())
    if PAGE.read_text() != source:
        PAGE.write_text(source)

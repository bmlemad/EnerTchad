"""Reuse the published corporate footer outside the compiled application root."""
import re
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- shared-config-footer:start -->'
END = '<!-- shared-config-footer:end -->'
STYLE = '<style id="configurator-footer">' + Path(__file__).with_name('configurator-footer.css').read_text() + '</style>'

def patch(page, reference):
    page = re.sub(re.escape(START) + r'.*?' + re.escape(END) + r'\s*', '', page, flags=re.S)
    if re.search(r'<footer\b', page):
        return page
    footer = re.search(r'<footer\b[^>]*>.*?</footer>', reference, re.S)
    if not footer:
        raise ValueError('Published corporate footer missing')
    # Text labels preserve the same social destinations without requiring the
    # corporate icon stylesheet in the independently compiled configurator.
    footer = re.sub(r'(<a\b[^>]*aria-label="([^"]+)"[^>]*>)\s*<svg\b.*?</svg>',
                    lambda m: m[1] + html.escape(m[2].split(' sur ')[-1]), footer[0], flags=re.S)
    footer = re.sub(r'<div class="foot-news">.*?(?=<div class="foot-grid)',
                    '<div class="foot-news"><p>Newsletter mensuelle</p><a href="/newsletter">Inscription à la newsletter en préparation →</a></div>',
                    footer, flags=re.S)
    block = START + STYLE + footer + END + '\n'
    if '</body>' in page:
        return page.replace('</body>', block + '</body>')
    return page.rstrip() + '\n' + block + '</body></html>'

if __name__ == '__main__':
    path = ROOT / 'Configurateur_Service_Integre_v2.html'
    source = patch(path.read_text(), (ROOT / 'amont/index.html').read_text())
    if source != path.read_text():
        path.write_text(source)

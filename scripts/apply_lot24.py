"""Lot 24 : corrections techniques mineures appliquées au build (audit technique du 22 octobre 2026).

Lancé par apply_readiness_20261013.py après apply_tech_lot20.py, donc relançable : chaque
transformation est idempotente et vérifie la structure attendue.
- m12 : nom accessible du sélecteur de langue (a.nx-lang) : il commence par le texte visible
  (« FR · EN ») puis garde l'indication de destination (WCAG 2.5.3) ;
- m3 : nœud JSON-LD Organization : plus d'« identifier » tant que le RCCM n'est pas attribué
  (« En cours d'immatriculation » n'est pas un identifiant), service client en français et en
  anglais (les deux formulaires de contact existent), pays « Chad » sur les pages anglaises ;
- m11 : voile renforcé sous les lignes de héros mesurées sous 4,5:1 sur mobile (bloc et-lot24
  de premium-chrome.css, source scripts/tech-lot24.css).
"""
import html
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = re.compile(r'^(?:\.github|scripts|qa|docs-sources|app|lib|reports|node_modules|public|out)/')
START, END = '/* et-lot24:start */', '/* et-lot24:end */'
RCCM = '"identifier":{"@type":"PropertyValue","propertyID":"RCCM","value":"En cours d’immatriculation"}'
CUSTOMER = '"contactType":"customer service","areaServed":"TD","availableLanguage":["fr"]'


def pages():
    try:
        out = subprocess.run(['git', '-C', str(ROOT), 'ls-files', '*.html'], capture_output=True, text=True, check=True).stdout.split()
    except Exception:
        out = [str(p.relative_to(ROOT)) for p in ROOT.rglob('*.html')]
    return [p for p in out if not EXCLUDED.match(p) and (ROOT / p).is_file()]


def lang_label(m):
    tag, inner = m.group(1), m.group(2)
    label = re.search(r'\baria-label="([^"]*)"', tag)
    visible = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', inner)).replace(' ', ' ')).strip()
    if not label or not visible or label.group(1).startswith(visible):
        return m.group(0)
    rest = label.group(1)
    rest = rest[0].lower() + rest[1:] if rest[:1].isupper() and not rest.startswith('English') else rest
    return tag.replace(label.group(0), f'aria-label="{visible}, {rest}"', 1) + inner + '</a>'


def organization(s, en):
    s = s.replace(',' + RCCM, '').replace(RCCM + ',', '')
    if RCCM in s:
        raise ValueError('Organization identifier: unexpected position')
    s = s.replace(CUSTOMER, CUSTOMER[:-5] + '"fr","en"]')
    if en:
        s = s.replace('"areaServed":{"@type":"Country","name":"Tchad"}', '"areaServed":{"@type":"Country","name":"Chad"}')
    return s


def css_block():
    src = ROOT / 'scripts/tech-lot24.css'
    if not src.exists():
        return
    sheet = ROOT / 'assets/chrome/premium-chrome.css'
    old = sheet.read_text(encoding='utf-8')
    block = START + '\n' + src.read_text(encoding='utf-8').strip() + '\n' + END
    if START in old:
        assert old.count(START) == 1 and old.count(END) == 1, 'et-lot24 block markers'
        new = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda _: block, old, flags=re.S)
    else:
        new = old.rstrip('\n') + '\n' + block + '\n'
    if new != old:
        sheet.write_text(new, encoding='utf-8')


def main():
    n_lang = n_org = 0
    for rel in pages():
        p = ROOT / rel
        old = p.read_text(encoding='utf-8')
        en = bool(re.search(r'<html\b[^>]*\blang="en', old))
        new = re.sub(r'(<a\b[^>]*\bclass="nx-lang"[^>]*>)(.*?)</a>', lang_label, old, flags=re.S)
        n_lang += new != old
        mid = new
        new = organization(new, en)
        n_org += new != mid
        if new != old:
            p.write_text(new, encoding='utf-8')
    css_block()
    print(f'Lot 24: language switch name on {n_lang} pages, Organization JSON-LD on {n_org} pages, et-lot24 CSS block')


if __name__ == '__main__':
    main()

# -*- coding: utf-8 -*-
"""Harmonisation des pages premium (main.ppl) : la feuille premium dessine la fleche des
liens (.pp-link::after) ; une fleche ecrite en fin de libelle faisait donc double emploi.
Retire la fleche finale (→ ← ↗) du libelle des liens .pp-link / .pp-btn. Idempotent.
Usage : python3 scripts/harmonize_premium.py
"""
import glob
import re

A_RX = re.compile(r'(<a\b[^>]*\bclass="[^"]*\bpp-(?:link|btn)\b[^"]*"[^>]*>)((?:(?!</a>|<a\b).)*?)(</a>)', re.S)
END_RX = re.compile(r'(?:\s|&nbsp;)*[→←↗](\s*(?:</(?:span|b|strong|em)>\s*)*)$')


def fix(html):
    i = html.find('class="ppl"')
    if i < 0:
        return html, 0
    start = html.rfind('<main', 0, i)
    end = html.find('</main>', i)
    body = html[start:end]
    n = 0

    def rep(m):
        nonlocal n
        inner = END_RX.sub(r'\1', m.group(2))
        if inner != m.group(2) and re.sub(r'<[^>]+>', '', inner).strip():
            n += 1
            return m.group(1) + inner + m.group(3)
        return m.group(0)
    body2 = A_RX.sub(rep, body)
    return html[:start] + body2 + html[end:], n


if __name__ == '__main__':
    tot = 0
    for f in sorted(glob.glob('**/*.html', recursive=True)):
        h = open(f, encoding='utf-8').read()
        h2, n = fix(h)
        if n:
            open(f, 'w', encoding='utf-8').write(h2)
            print(f, n)
            tot += n
    print(tot, 'fleche(s) retiree(s)')

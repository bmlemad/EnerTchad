# -*- coding: utf-8 -*-
"""Genere assets/chrome/pole-premium.css depuis scripts/pole-premium.src.css (pages de pole).

Les feuilles historiques imposent en theme clair des couleurs et des fonds avec
!important sur tout le contenu. Chaque regle des pages de pole premium est donc prefixee
d une chaine de :not(#id) et chaque declaration recoit !important (hors variables).
Usage : python3 scripts/pole_premium_css.py
"""
import re
NOTS = ''.join(f':not(#q{i})' for i in range(24))
M = f'html{NOTS} body main.ppl'
MD = f'html:not(.et-plight){NOTS} body main.ppl'


def imp(block):
    out = []
    for decl in re.split(r';(?![^()]*\))', block):
        d = decl.strip()
        if not d:
            continue
        if d.startswith('--') or d.endswith('!important'):
            out.append(d)
        else:
            out.append(d + '!important')
    return ';'.join(out)


def main():
    src = open('scripts/pole-premium.src.css', encoding='utf-8').read()
    src = src.replace('@MD', MD).replace('@M', M)
    # !important sur les declarations des regles (pas dans @font-face)
    def rule(m):
        sel, body = m.group(1), m.group(2)
        if '@font-face' in sel:
            return m.group(0)
        return sel + '{' + imp(body) + '}'
    out = re.sub(r'([^{}]+)\{([^{}]*)\}', rule, src)
    open('assets/chrome/pole-premium.css', 'w', encoding='utf-8').write(out)
    print(len(out), 'octets')


if __name__ == '__main__':
    main()

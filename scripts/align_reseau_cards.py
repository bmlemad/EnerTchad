#!/usr/bin/env python3
"""Réseau de stations (FR, EN) : cartes ramenées à l'arrondi maison de 18 px (22 novembre 2026).

Mesure : 11 arrondis différents dans le contenu de /aval/reseau (13 à 22 px), contre 1 ou 2 (18 px) sur les autres pages de
pôle. On remplace les arrondis de 12 à 22 px par 18 px dans les styles en ligne du <main> et dans les règles des blocs <style>
de la page, sauf l'en-tête, la navigation, le pied de page, la bande image et la carte du réseau (#reseau-carte, avnet).
Pastilles (2 à 10 px, 999 px) et cercles inchangés. Rejouable.
"""
import re, sys

RAD = re.compile(r'border-radius:\s*(1[2-9]|2[0-2])px')
SKIP_SEL = re.compile(r'#nav|\.nav|\.nx|header|footer|\.pft|#nezBar|#toTop|\.pp-sub|reseau-carte|avnet|\.vi-band')


def fix_css(css):
    """Réécrit les déclarations de chaque règle (at-rules comprises) dont le sélecteur n'est pas exclu."""
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            out.append(css[i:]); break
        head = css[i:j]
        if head.strip().startswith('@'):
            depth, k = 1, j + 1
            while k < n and depth:
                depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
            out.append(head + '{' + fix_css(css[j + 1:k - 1]) + '}'); i = k
        else:
            k = css.find('}', j)
            body = css[j + 1:k]
            if not SKIP_SEL.search(head):
                body = RAD.sub('border-radius:18px', body)
            out.append(head + '{' + body + '}'); i = k + 1
    return ''.join(out)


def fix_main(main):
    a = main.find('id="reseau-carte"')
    b = main.find('</section>', a) if a >= 0 else -1
    inline = lambda part: re.sub(r'style="([^"]*)"', lambda m: 'style="%s"' % RAD.sub('border-radius:18px', m.group(1)), part)
    if a < 0:
        return inline(main)
    return inline(main[:a]) + main[a:b] + inline(main[b:])


for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read(); before = s
    i, j = s.find('<main'), s.find('</main>')
    s = s[:i] + fix_main(s[i:j]) + s[j:]
    s = re.sub(r'<style((?: [^>]*)?)>(.*?)</style>',
               lambda m: m.group(0) if 'avnet' in m.group(1) else '<style%s>%s</style>' % (m.group(1), fix_css(m.group(2))), s, flags=re.S)
    if s != before:
        open(f, 'w', encoding='utf-8').write(s)
    left = [x for x in RAD.findall(s) if x != '18']
    print(f, 'arrondis 12-22 px restants hors 18 :', len(left))

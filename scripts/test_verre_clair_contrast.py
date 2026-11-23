# -*- coding: utf-8 -*-
"""Lot verre clair (23 novembre 2026) : bornes de contraste du fond de lumières et du verre de contenu.

Le fond (assets/chrome/verre-2026.css, couche et-verre) mêle la couleur de papier et trois lumières (or, bleu,
vert) ; le verre des surfaces y ajoute une teinte à 50 %. Un flou ou un fondu ne produit que des moyennes : le
fond effectif sous un texte reste entre le plus clair et le plus sombre de ces arrêts. On vérifie donc, par
calcul et pour chaque thème, le pire arrêt :
 - en clair, chaque arrêt du fond (seul ou sous le verre) garde une luminance relative >= 0,78 ;
 - en sombre, chaque arrêt reste <= 0,015 ;
 - les couleurs de texte relevées sur 24 pages le 23 novembre 2026 (texte posé sur le papier) tiennent 4,5:1
   sur le pire arrêt.
Une couleur ajoutée aux pages sans passer ce contrôle n'est pas couverte : la relève est à refaire quand la
palette change (qa/ : captures et axe). Exit 1 au premier défaut."""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
css = re.sub(r'/\*[\s\S]*?\*/', '', open(os.path.join(ROOT, 'assets/chrome/verre-2026.css'), encoding='utf-8').read())

# Texte posé sur le papier, relevé le 23 novembre 2026 (24 pages, 1 440 px) : le plus clair des thèmes clairs,
# le plus sombre des thèmes sombres, et les couleurs fréquentes.
TEXT = {
    'clair': [(10, 26, 47), (42, 54, 72), (75, 88, 112), (122, 90, 18), (90, 100, 114), (14, 65, 114), (21, 95, 168), (118, 85, 15)],
    'sombre': [(241, 243, 246), (169, 180, 196), (217, 181, 103), (195, 208, 224), (147, 161, 184), (124, 138, 162), (90, 167, 240)],
}
BOUND = {'clair': ('>=', 0.78), 'sombre': ('<=', 0.015)}


def lum(c):
    f = lambda x: x / 255 / 12.92 if x / 255 <= 0.04045 else ((x / 255 + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])


def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def color(v):
    v = v.strip()
    if v.startswith('#'):
        h = v[1:]
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)), 1.0
    n = [float(x) for x in re.findall(r'[\d.]+', v)]
    return tuple(n[:3]), (n[3] if len(n) > 3 else 1.0)


def tokens(selector):
    m = re.search(re.escape(selector) + r'\{([^}]*--vc-fond[^}]*)\}', css)
    if not m:
        return None
    return {k: v for k, v in re.findall(r'(--vc-[\w-]+):([^;}]+)', m.group(1))}


errors = []
for theme, sel in (('clair', 'html.et-plight'), ('sombre', 'html:not(.et-plight)')):
    t = tokens(sel)
    if not t:
        errors.append(f'{theme} : jetons --vc-* introuvables ({sel})')
        continue
    stops = [color(t[k])[0] for k in ('--vc-fond', '--vc-or', '--vc-bleu', '--vc-vert')]
    glass, alpha = color(t['--vc-verre'])
    under = [tuple(alpha * g + (1 - alpha) * s for g, s in zip(glass, st)) for st in stops]
    op, bound = BOUND[theme]
    for st in stops + under:
        L = lum(st)
        if (op == '>=' and L < bound) or (op == '<=' and L > bound):
            errors.append(f'{theme} : arrêt {tuple(round(x) for x in st)} luminance {L:.4f} hors borne {op} {bound}')
    worst = min(stops + under, key=lum) if theme == 'clair' else max(stops + under, key=lum)
    for c in TEXT[theme]:
        r = ratio(c, worst)
        if r < 4.5:
            errors.append(f'{theme} : texte {c} sur {tuple(round(x) for x in worst)} = {r:.2f}:1 (< 4,5)')
    print(f'{theme} : pire arrêt {tuple(round(x) for x in worst)} (L = {lum(worst):.4f}) ; contraste minimal '
          f'{min(ratio(c, worst) for c in TEXT[theme]):.2f}:1')

if errors:
    print('\n'.join(errors))
    sys.exit(1)
print('verre clair : bornes de contraste tenues')

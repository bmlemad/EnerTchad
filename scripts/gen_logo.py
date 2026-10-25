# -*- coding: utf-8 -*-
"""Lot 29 (B3) : logotype horizontal vectoriel d'EnerTchad.

Produit assets/brand/enertchad-logo-h.svg (couleurs du theme : « Ener » en currentColor,
« Tchad » en or) et assets/brand/enertchad-logo-h-sombre.svg (variante pour les pieds de page
nuit, couleurs explicites). Le pictogramme est celui de enertchad-logo.svg (quatre pales) ;
le mot est vectorise depuis Inter Display SemiBold (fontTools), donc identique partout,
sans dependre des polices du visiteur. Le balisage en ligne est fourni par
scripts/logo_markup.py (Python) et lib/logo.js (pages React).

Usage : python3 scripts/gen_logo.py  (idempotent ; ecrit les deux SVG et scripts/logo_paths.json)
"""
import json
import os
import sys

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = '/usr/share/fonts/opentype/inter/InterDisplay-SemiBold.otf'
OUT_DIR = os.path.join(ROOT, 'assets', 'brand')
WORD = ('Ener', 'Tchad')

# Pictogramme : quatre pales de enertchad-logo.svg, sans le carton de fond.
PICTO = (
    '<path d="M100 96 L126.98 67.9 A37.4 37.4 0 1 0 73.02 67.9 Z" fill="url(#{gid})"/>'
    '<path d="M96 100 L67.9 73.02 A37.4 37.4 0 1 0 67.9 126.98 Z" fill="#1E6EC2"/>'
    '<path d="M104 100 L132.1 126.98 A37.4 37.4 0 1 0 132.1 73.02 Z" fill="#218A2C"/>'
    '<path d="M100 104 L73.02 132.1 A37.4 37.4 0 1 0 126.98 132.1 Z" fill="#E8CD7F"/>'
)
GRAD = ('<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0" stop-color="#DBAE4A"/><stop offset="1" stop-color="#C2922E"/></linearGradient>')

# Geometrie (unites SVG) : hauteur 44, pictogramme 44 x 44, mot en corps 24 (capitales ~ 17,5),
# capitales calees en haut (y = 6) : l'accroche « Acces aux Energies » reste en HTML sous le mot.
H = 44.0
PICTO_SIZE = 44.0
GAP = 10.0
FONT_SIZE = 24.0
CAP_TOP = 6.0  # haut des capitales (laisse 20 unites sous le mot pour l'accroche en HTML)


def word_paths():
    f = TTFont(FONT)
    gs = f.getGlyphSet()
    cmap = f.getBestCmap()
    upem = f['head'].unitsPerEm
    scale = FONT_SIZE / upem
    asc = f['OS/2'].sCapHeight * scale
    # ligne de base : haut des capitales a CAP_TOP
    baseline = CAP_TOP + asc
    kern = {}
    try:
        from fontTools.ttLib.tables import otTables  # noqa: F401
        gpos = f['GPOS'].table
        for lk in gpos.LookupList.Lookup:
            for st in lk.SubTable:
                if getattr(st, 'LookupType', lk.LookupType) == 2 and st.Format == 1:
                    cov = st.Coverage.glyphs
                    for i, ps in enumerate(st.PairSet):
                        for pvr in ps.PairValueRecord:
                            v = getattr(pvr.Value1, 'XAdvance', 0)
                            if v:
                                kern[(cov[i], pvr.SecondGlyph)] = v
    except Exception:
        pass
    x = PICTO_SIZE + GAP
    parts = []
    prev = None
    for word in WORD:
        d = []
        for ch in word:
            g = cmap[ord(ch)]
            if prev is not None:
                x += kern.get((prev, g), 0) * scale
            pen = SVGPathPen(gs, ntos=lambda v: ('%.2f' % v).rstrip('0').rstrip('.'))
            tp = TransformPen(pen, (scale, 0, 0, -scale, x, baseline))
            gs[g].draw(tp)
            d.append(pen.getCommands())
            x += gs[g].width * scale
            prev = g
        parts.append(''.join(d))
        # espace fine entre « Ener » et « Tchad » : aucune (mot compose)
    return parts, round(x + 1.0, 2)


def build(theme):
    (ener, tchad), width = word_paths()
    gid = 'etlg' + ('d' if theme == 'sombre' else 'l')
    if theme == 'sombre':
        c_ener, c_tchad = '#F8F5EA', '#E8C36A'
    else:
        c_ener, c_tchad = 'currentColor', 'var(--et-logo-or,#7A5A12)'
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{wi}" height="{hi}" '
           'role="img" aria-label="EnerTchad"><title>EnerTchad</title><defs>{grad}</defs>'
           '<g transform="translate(0 0) scale({ps})">{picto}</g>'
           '<path d="{ener}" fill="{ce}"/><path d="{tchad}" fill="{ct}"/></svg>').format(
        w=width, h=int(H), wi=int(round(width)), hi=int(H), grad=GRAD.format(gid=gid),
        ps=round(PICTO_SIZE / 200.0, 4), picto=PICTO.format(gid=gid), ener=ener, tchad=tchad,
        ce=c_ener, ct=c_tchad)
    return svg, width


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    data = {}
    for theme, name in (('clair', 'enertchad-logo-h.svg'), ('sombre', 'enertchad-logo-h-sombre.svg')):
        svg, width = build(theme)
        with open(os.path.join(OUT_DIR, name), 'w', encoding='utf-8') as fh:
            fh.write(svg + '\n')
        data[theme] = {'svg': svg, 'width': width, 'height': H}
    (ener, tchad), width = word_paths()
    data['paths'] = {'ener': ener, 'tchad': tchad, 'width': width, 'height': H,
                     'picto_scale': round(PICTO_SIZE / 200.0, 4)}
    with open(os.path.join(ROOT, 'scripts', 'logo_paths.json'), 'w', encoding='utf-8') as fh:
        json.dump(data['paths'], fh, ensure_ascii=False, separators=(',', ':'))
    print('logo : largeur %.1f, %d octets (clair), %d octets (sombre)' % (
        width, len(data['clair']['svg']), len(data['sombre']['svg'])))


if __name__ == '__main__':
    sys.exit(main())

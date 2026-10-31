# -*- coding: utf-8 -*-
"""Lot 83 : sacs d'intrants EOR de /petrochimie/chimie-eor(-en) — huit SVG générés depuis un gabarit (assets/images/intrant-sac-*.svg).
Textes convertis en tracés (polices du site : National Park Bold, Instrument Serif, JetBrains Mono, Inter)
pour un rendu identique sur tout navigateur, sans police à charger. Relançable : python3 scripts/img/intrants_sacs.py (dépendances : fonttools, brotli, uharfbuzz).
Sources des mentions : petrochimie/chimie-eor.html (gamme 25 kg → big-bag, « designs · cibles horizon 2030 »),
amont/eor.html #intrants-eor (rôle ASP, nom scientifique, origine), images actuelles intrant-sac-*.webp (index PC·0n, rôles)."""
import os, io, sys, json
from xml.sax.saxutils import escape
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.basePen import BasePen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONTS = os.path.join(ROOT, 'assets', 'fonts') + os.sep
OUT = os.path.join(ROOT, 'assets', 'images')
os.makedirs(OUT, exist_ok=True)
_cache = {}

class RelPen(BasePen):
    """Tracé SVG compact : commandes relatives, une décimale, sans blancs superflus."""
    def __init__(self, gs):
        super().__init__(gs); self.c = []; self.p = (0, 0); self.s = (0, 0)
    def n(self, v):
        r = ('%.1f' % v).rstrip('0').rstrip('.'); return '0' if r in ('-0', '') else r
    def rel(self, pt):
        d = (pt[0] - self.p[0], pt[1] - self.p[1]); self.p = pt; return d
    def pair(self, d):
        x, y = self.n(d[0]), self.n(d[1]); return x + (y if y.startswith('-') else ' ' + y)
    def _moveTo(self, pt):
        d = self.rel(pt); self.s = pt; self.c.append('m' + self.pair(d))
    def _lineTo(self, pt):
        d = self.rel(pt)
        if abs(d[1]) < .05: self.c.append('h' + self.n(d[0]))
        elif abs(d[0]) < .05: self.c.append('v' + self.n(d[1]))
        else: self.c.append('l' + self.pair(d))
    def _curveToOne(self, p1, p2, p3):
        p0 = self.p; a = (p1[0] - p0[0], p1[1] - p0[1]); b = (p2[0] - p0[0], p2[1] - p0[1]); d = self.rel(p3)
        self.c.append('c' + self.pair(a) + ' ' + self.pair(b) + ' ' + self.pair(d))
    def _qCurveToOne(self, p1, p2):
        p0 = self.p; a = (p1[0] - p0[0], p1[1] - p0[1]); d = self.rel(p2)
        self.c.append('q' + self.pair(a) + ' ' + self.pair(d))
    def _closePath(self):
        self.p = self.s; self.c.append('z')
    def getCommands(self):
        return ''.join(self.c)


def font(name, wght=None):
    key = (name, wght)
    if key in _cache: return _cache[key]
    t = TTFont(FONTS + name)
    if wght is not None and 'fvar' in t: t = instantiateVariableFont(t, {'wght': wght})
    t.flavor = None
    buf = io.BytesIO(); t.save(buf); data = buf.getvalue()
    face = hb.Face(data); f = hb.Font(face); f.scale = (t['head'].unitsPerEm, t['head'].unitsPerEm)
    _cache[key] = (t, f, t['head'].unitsPerEm); return _cache[key]

def text(name, s, size, x, y, anchor='start', wght=None, fill='#111', letter=0, extra=''):
    """Chaîne → <path> ; x,y = point de base. Retourne (svg, largeur)."""
    t, f, upm = font(name, wght)
    b = hb.Buffer(); b.add_str(s); b.guess_segment_properties(); hb.shape(f, b, {'kern': True, 'liga': True})
    gs = t.getGlyphSet(); order = t.getGlyphOrder(); k = size / upm
    pen = RelPen(gs)
    cx = 0.0; n = 0
    for info, pos in zip(b.glyph_infos, b.glyph_positions):
        gname = order[info.codepoint]
        tp = TransformPen(pen, (k, 0, 0, -k, cx + pos.x_offset * k, -pos.y_offset * k))
        gs[gname].draw(tp)
        cx += pos.x_advance * k + letter; n += 1
    w = cx - (letter if n else 0)
    dx = {'start': 0, 'middle': -w / 2, 'end': -w}[anchor]
    d = pen.getCommands()
    return (f'<path transform="translate({x + dx:.2f} {y:.2f})" fill="{fill}"{extra} d="{d}"/>' if d else ''), w

def width(name, s, size, wght=None, letter=0):
    return text(name, s, size, 0, 0, wght=wght, letter=letter)[1]

# Intrants : (fichier, index, nom [lignes], nom scientifique / nature, rôle (chip), origine, teinte, teinte texte chip)
BAGS = [
 ('natron', '01', ['NATRON'], 'Carbonate de sodium · natron du Lac', 'ALCALIN · A (ASP)', 'Lac Tchad & Borkou', '#1E5FB3', '#fff'),
 ('gomme-arabique', '02', ['GOMME', 'ARABIQUE'], 'Acacia senegal · exsudat', 'BIOPOLYMÈRE · P', 'Bande sahélienne', '#B8860B', '#fff'),
 ('coton', '03', ['COTON'], 'Cellulose de coton · linters', 'POLYMÈRE · P', 'Zone cotonnière sud', '#1E8A4E', '#fff'),
 ('neem-karite', '04', ['NEEM &', 'KARITÉ'], 'Huiles d’Azadirachta & Vitellaria', 'BIOSURFACTANT · S', 'Sahel · sud', '#6E7F1F', '#fff'),
 ('spiruline', '05', ['SPIRULINE'], 'Biomasse cyanobactérienne', 'MEOR · MICROBIEN', 'Lacs natronés du Kanem', '#15857A', '#fff'),
 ('sel', '06', ['SEL'], 'Halite du Kanem', 'SALINITÉ · A', 'Kanem', '#5B86C8', '#fff'),
 ('argiles', '07', ['ARGILES'], 'Bentonite locale', 'BOUE DE FORAGE', 'Bassins pétroliers', '#B0592A', '#fff'),
 ('soufre', '08', ['SOUFRE'], 'Soufre granulé · co-produit', 'BRUT ACIDE · CO-PRODUIT', 'Raffinage', '#C9A30F', '#1c1a12'),
]

W, H = 380, 520
MARK = ('<g transform="translate(%s %s) scale(%s)"><path d="M100 96 L126.98 67.9 A37.4 37.4 0 1 0 73.02 67.9 Z" fill="#D0A23C"/>'
        '<path d="M96 100 L67.9 73.02 A37.4 37.4 0 1 0 67.9 126.98 Z" fill="#1E6EC2"/><path d="M104 100 L132.1 126.98 A37.4 37.4 0 1 0 132.1 73.02 Z" fill="#218A2C"/>'
        '<path d="M100 104 L73.02 132.1 A37.4 37.4 0 1 0 126.98 132.1 Z" fill="#E8CD7F"/></g>')

def mark(x, y, size):
    s = size / 200.0
    return MARK % (x - 100 * s, y - 100 * s, s)

def bag(slug, idx, lines, sci, role, origin, hue, chipfg):
    p = []
    a = p.append
    a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="t">')
    a('<title id="t">' + escape(f'Sac d’intrant {" ".join(lines).title()} 25 kg — Pétrochimie EnerTchad, fabriqué au Tchad (design, cible 2030)') + '</title>')
    a('<defs>'
      '<linearGradient id="body" x1="0" x2="1"><stop offset="0" stop-color="#DDD5BF"/><stop offset=".12" stop-color="#F1ECDD"/><stop offset=".5" stop-color="#F7F3E7"/><stop offset=".88" stop-color="#EFE9D8"/><stop offset="1" stop-color="#D6CDB5"/></linearGradient>'
      '<linearGradient id="seam" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#E4DCC6"/><stop offset="1" stop-color="#CFC5AA"/></linearGradient>'
      '<pattern id="weave" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 1.5H3M1.5 0V3" stroke="#8C7F62" stroke-width=".35" opacity=".28"/></pattern>'
      '<radialGradient id="sh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#2A2416" stop-opacity=".35"/><stop offset="1" stop-color="#2A2416" stop-opacity="0"/></radialGradient>'
      '<clipPath id="face"><path d="M44 62 Q190 50 336 62 L340 470 Q190 482 40 470 Z"/></clipPath>'
      '</defs>')
    # ombre portée
    a('<ellipse cx="190" cy="500" rx="150" ry="12" fill="url(#sh)"/>')
    # corps du sac (toile PP) : léger bombé, soufflets latéraux
    a('<path d="M44 62 Q190 50 336 62 L340 470 Q190 482 40 470 Z" fill="url(#body)" stroke="#B9AE93" stroke-width="1.2"/>')
    a('<path d="M44 62 Q190 50 336 62 L340 470 Q190 482 40 470 Z" fill="url(#weave)"/>')
    # plis des soufflets
    a('<path d="M62 70 L60 466 M318 70 L320 466" stroke="#C9BFA4" stroke-width="1" fill="none" opacity=".9"/>')
    # coutures haute et basse : bande + surjet (points) + bord dentelé
    a('<path d="M44 62 Q190 50 336 62 L336 80 Q190 68 44 80 Z" fill="url(#seam)"/>')
    a('<path d="M44 62 Q190 50 336 62" stroke="#A89C7E" stroke-width="2.2" stroke-dasharray="3 2.4" fill="none"/>')
    a('<path d="M44 62 ' + ' '.join(f'l3.65 {"-3" if i % 2 == 0 else "3"}' for i in range(80)) + '" transform="translate(0 -2)" stroke="#B9AE93" stroke-width=".8" fill="none"/>')
    a('<path d="M40 470 Q190 482 340 470 L340 456 Q190 468 40 456 Z" fill="url(#seam)"/>')
    a('<path d="M40 470 Q190 482 340 470" stroke="#A89C7E" stroke-width="2.2" stroke-dasharray="3 2.4" fill="none"/>')
    # ------- impression (flexo) dans le cadre 70..310
    g = []
    L, R = 70, 310
    # en-tête : marque + index
    g.append(mark(L + 11, 110, 22))
    s, _ = text('NationalPark-Bold-latin.woff2', 'ENERTCHAD', 11, L + 26, 108, fill='#1C1A12', letter=1.2); g.append(s)
    s, w = text('NationalPark-Bold-latin.woff2', 'PÉTROCHIMIE', 11, L + 26 + width('NationalPark-Bold-latin.woff2', 'ENERTCHAD', 11, letter=1.2) + 8, 108, fill=hue, letter=1.2); g.append(s)
    s, _ = text('JetBrainsMono-latin.woff2', f'PC·{idx}', 11, R, 108, anchor='end', wght=600, fill='#5A5240'); g.append(s)
    g.append(f'<rect x="{L}" y="118" width="{R - L}" height="7" fill="{hue}"/>')
    # nom du produit : taille ajustée à la largeur, 1 ou 2 lignes
    y = 128
    maxw = R - L
    sizes = []
    for ln in lines:
        w1 = width('NationalPark-Bold-latin.woff2', ln, 100, letter=0)
        sizes.append(min(60 if len(lines) == 1 else 50, 100 * maxw / w1))
    size = min(sizes)
    for ln in lines:
        y += size * 0.98
        s, _ = text('NationalPark-Bold-latin.woff2', ln, size, L - 1, y, fill='#1C1A12'); g.append(s)
    y += 20
    s, _ = text('InstrumentSerif-latin.woff2', sci, 17, L, y, fill='#3E3828'); g.append(s)
    y += 24
    # pastille rôle ASP
    rw = width('JetBrainsMono-latin.woff2', role, 10.5, wght=700, letter=.6) + 20
    g.append(f'<rect x="{L}" y="{y - 14}" width="{rw:.1f}" height="21" rx="3" fill="{hue}"/>')
    s, _ = text('JetBrainsMono-latin.woff2', role, 10.5, L + 10, y + 1, wght=700, fill=chipfg, letter=.6); g.append(s)
    s, _ = text('JetBrainsMono-latin.woff2', origin.upper(), 8.5, R, y, anchor='end', wght=500, fill='#6A6250', letter=.4); g.append(s)
    # filet
    # filigrane de marque dans la zone libre
    g.append(f'<g opacity=".10">{mark(R - 24, 298, 44)}</g>')
    y2 = 322
    g.append(f'<path d="M{L} {y2}H{R}" stroke="#1C1A12" stroke-width="1"/>')
    # poids net
    s, _ = text('JetBrainsMono-latin.woff2', 'POIDS NET · NET WEIGHT', 8, L, y2 + 16, wght=500, fill='#6A6250', letter=.5); g.append(s)
    s, w = text('NationalPark-Bold-latin.woff2', '25', 54, L - 2, y2 + 66, fill='#1C1A12'); g.append(s)
    s, _ = text('NationalPark-Bold-latin.woff2', 'kg', 26, L + w + 6, y2 + 66, fill='#1C1A12'); g.append(s)
    # fabriqué au Tchad : drapeau + mention
    fx = R - 96
    g.append(f'<rect x="{fx}" y="{y2 + 14}" width="32" height="21" fill="#002664"/><rect x="{fx + 32}" y="{y2 + 14}" width="32" height="21" fill="#FECB00"/><rect x="{fx + 64}" y="{y2 + 14}" width="32" height="21" fill="#C60C30"/>')
    s, _ = text('NationalPark-Bold-latin.woff2', 'FABRIQUÉ AU TCHAD', 10.5, R, y2 + 50, anchor='end', fill='#1C1A12', letter=.5); g.append(s)
    s, _ = text('JetBrainsMono-latin.woff2', 'MADE IN CHAD', 8, R, y2 + 63, anchor='end', wght=500, fill='#6A6250', letter=.8); g.append(s)
    # ligne basse : pictogrammes + lot + mention de maquette
    yb = y2 + 86
    g.append(f'<path d="M{L} {yb - 4}H{R}" stroke="#1C1A12" stroke-width=".6" opacity=".5"/>')
    # pictos : garder au sec, ce côté vers le haut, PP recyclable
    g.append(f'<g transform="translate({L} {yb + 2})" fill="none" stroke="#3E3828" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">'
             '<path d="M2 10a8 8 0 0 1 16 0zM10 10v8a2 2 0 0 1-4 0"/><path d="M4 1l2 3M12 1l-2 3" stroke-width=".9"/>'
             '<path d="M30 15V3M26 7l4-4 4 4M38 15V3M34 7l4-4 4 4M24 18h18"/>'
             '<path d="M58 2l-7 13h14zM58 6l-3.6 6.5h7.2z" stroke-width="1"/></g>')
    s, _ = text('JetBrainsMono-latin.woff2', 'PP 05', 6.5, L + 58, yb + 23, anchor='middle', wght=600, fill='#3E3828'); g.append(s)
    s, _ = text('JetBrainsMono-latin.woff2', 'LOT', 8, L + 92, yb + 12, wght=600, fill='#3E3828', letter=.5); g.append(s)
    g.append(f'<rect x="{L + 114}" y="{yb + 1}" width="{R - L - 114}" height="15" fill="none" stroke="#3E3828" stroke-width=".8" stroke-dasharray="2 1.5"/>')
    s, _ = text('JetBrainsMono-latin.woff2', 'INTRANT EOR · SOURCING TCHADIEN · DESIGN, CIBLE 2030', 7, L, yb + 33, wght=500, fill='#6A6250', letter=.25); g.append(s)
    a('<g clip-path="url(#face)">' + ''.join(g) + '</g>')
    # reflet de la toile par-dessus l'impression (léger)
    a('<path d="M44 62 Q190 50 336 62 L340 470 Q190 482 40 470 Z" fill="url(#weave)" opacity=".35"/>')
    a('</svg>')
    svg = ''.join(p)
    open(os.path.join(OUT, f'intrant-sac-{slug}.svg'), 'w', encoding='utf-8').write(svg)
    return len(svg.encode())

if __name__ == '__main__':
    for b in BAGS:
        print(b[0], bag(*b), 'octets')

# -*- coding: utf-8 -*-
"""Atlas (enerconseils/atlas.html, atlas-en.html) : barre de repartition 11 / 38 / 8 sous le
cadastre. Sur mobile, le segment « attribues » (19 % de la largeur) est trop etroit pour
afficher le chiffre et son libelle : le « 11 » est rogne par overflow:hidden. Correctif :
ajoute la classe atl-dbar a la barre et, sous 640 px, masque visuellement les libelles
(ils restent lus par les lecteurs d ecran et repetes dans les cartes en dessous) et recentre
le chiffre. Corrige aussi le title EN « 16 blocks awarded » -> « 11 blocks awarded ».
Idempotent. Usage : python3 scripts/fix_atlas_bar.py
"""
import re

FILES = ('enerconseils/atlas.html', 'enerconseils/atlas-en.html')
BAR = '<div style="display:flex;height:48px;border-radius:12px;overflow:hidden;border:1px solid var(--hair)">'
BAR_NEW = '<div class="atl-dbar" style="display:flex;height:48px;border-radius:12px;overflow:hidden;border:1px solid var(--hair)">'
CSS = ('/* atl-dbar : barre de repartition, mobile */'
       '@media(max-width:640px){'
       '.atl-dbar>div{position:relative!important;gap:0!important;padding:0 2px!important}'
       '.atl-dbar>div>span+span{position:absolute!important;width:1px!important;height:1px!important;'
       'overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important}}')


def fix(h):
    n = 0
    if BAR in h:
        h = h.replace(BAR, BAR_NEW, 1); n += 1
    if '/* atl-dbar' not in h and '<style id="atl-maps-fix">' in h:
        h = h.replace('<style id="atl-maps-fix">', '<style id="atl-maps-fix">' + CSS, 1); n += 1
    if 'title="16 blocks awarded"' in h:
        h = h.replace('title="16 blocks awarded"', 'title="11 blocks awarded"'); n += 1
    return h, n


if __name__ == '__main__':
    for f in FILES:
        h = open(f, encoding='utf-8').read()
        h2, n = fix(h)
        if n:
            open(f, 'w', encoding='utf-8').write(h2)
        print(f, n, 'modification(s)')

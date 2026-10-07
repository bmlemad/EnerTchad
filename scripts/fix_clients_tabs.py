# -*- coding: utf-8 -*-
"""Page Clients (clients.html, clients-en.html) : retire la reglette d onglets « Profils
clients » (Particuliers · Industriels B2B · Flottes · Operateurs E&P · Collectivites ·
Etat & B2G · Fournisseurs) ajoutee par le bloc <style id="cw-tabs-css"> et le script
<script id="cw-tabs-js">. Sans ce script, les sept sections de profil s affichent a la
suite, la sous-navigation .pp-sub (ancres) reste, et le script compagnon (cartes a.prof,
tableau #comparer) ne fait rien puisqu il verifie l absence de #cw-tabs. Idempotent.
Usage : python3 scripts/fix_clients_tabs.py
"""
import re

FILES = ('clients.html', 'clients-en.html')
STYLE_RX = re.compile(r'<style id="cw-tabs-css">.*?</style>\n?', re.S)
SCRIPT_RX = re.compile(r'<script id="cw-tabs-js">.*?</script>\n?', re.S)


def fix(html):
    n = 0
    html, k = STYLE_RX.subn('', html, count=1); n += k
    html, k = SCRIPT_RX.subn('', html, count=1); n += k
    return html, n


if __name__ == '__main__':
    for f in FILES:
        h = open(f, encoding='utf-8').read()
        h2, n = fix(h)
        if n:
            open(f, 'w', encoding='utf-8').write(h2)
        print(f, n, 'bloc(s) retire(s)')

# -*- coding: utf-8 -*-
"""Bascule l'origine du site (canonical, og:url, sitemap, robots, JSON-LD).

Provisoire tant que enertchad.td n'est pas actif ; réversible :
  python3 scripts/set_site_origin.py https://enertchad-delta.vercel.app   # aujourd'hui
  python3 scripts/set_site_origin.py https://enertchad.td                 # au lancement du domaine

Ne touche que les URL préfixées « https:// » — les adresses e-mail
(contact@enertchad.td) et numéros restent intacts.
"""
import glob, re, sys

KNOWN = ('https://enertchad.td', 'https://enertchad-delta.vercel.app')

def main():
    if len(sys.argv) != 2 or not sys.argv[1].startswith('https://'):
        print(__doc__); sys.exit(1)
    new = sys.argv[1].rstrip('/')
    files = sorted(glob.glob('*.html')) + sorted(glob.glob('*/*.html')) + ['sitemap.xml', 'robots.txt', 'site.webmanifest']
    total = changed = 0
    for p in files:
        try:
            h = open(p, encoding='utf-8').read()
        except FileNotFoundError:
            continue
        h2, n = h, 0
        for old in KNOWN:
            if old == new:
                continue
            h2, k = re.subn(re.escape(old) + r'(?=[/"\s<])', new, h2)
            n += k
        if n:
            open(p, 'w', encoding='utf-8').write(h2)
            changed += 1; total += n
    print(f'{total} URL réécrites vers {new} dans {changed} fichiers.')

if __name__ == '__main__':
    main()

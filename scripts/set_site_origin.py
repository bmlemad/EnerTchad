# -*- coding: utf-8 -*-
"""Bascule l'origine du site (canonical, og:url, sitemap, robots, JSON-LD).

Provisoire tant que enertchad.td n'est pas actif ; réversible :
  python3 scripts/set_site_origin.py https://enertchad.com               # aujourd'hui (domaine propre sur Netlify, 7 octobre 2026)
  python3 scripts/set_site_origin.py https://enertchad.netlify.app       # avant le 7 octobre 2026
  python3 scripts/set_site_origin.py https://enertchad-delta.vercel.app   # avant le 1er octobre 2026
  python3 scripts/set_site_origin.py https://enertchad.td                 # au lancement du domaine

Ne touche que les URL préfixées « https:// » — les adresses e-mail
(contact@enertchad.td) et numéros restent intacts.
"""
import glob, re, sys

KNOWN = ('https://enertchad.td', 'https://enertchad-delta.vercel.app', 'https://enertchad.netlify.app', 'https://enertchad.com')

def main():
    if len(sys.argv) != 2 or not sys.argv[1].startswith('https://'):
        print(__doc__); sys.exit(1)
    new = sys.argv[1].rstrip('/')
    files = sorted(glob.glob('*.html')) + sorted(glob.glob('*/*.html')) + ['sitemap.xml', 'robots.txt', 'site.webmanifest', '.well-known/security.txt', 'llms.txt', 'feed.xml', 'feed-en.xml'] + sorted(glob.glob('*.ics'))
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
            # webcal:// (agenda) et mention du nom d hote seul dans le texte
            host_old, host_new = old[len('https://'):], new[len('https://'):]
            h2, k = re.subn(r'webcal://' + re.escape(host_old) + r'(?=[/"\s<])', 'webcal://' + host_new, h2)
            n += k
            if p.endswith('.html') and not host_old.endswith('.td'):
                h2, k = re.subn(r'(?<![/.\w-])' + re.escape(host_old) + r'(?![\w-])', host_new, h2)
                n += k
        if n:
            open(p, 'w', encoding='utf-8').write(h2)
            changed += 1; total += n
    print(f'{total} URL réécrites vers {new} dans {changed} fichiers.')

if __name__ == '__main__':
    main()

# -*- coding: utf-8 -*-
"""Regenere _redirects (Netlify) depuis vercel.json, pour que les deux hebergeurs
appliquent les memes redirections. Usage : python3 scripts/gen_netlify_redirects.py"""
import json, os, re

HEAD = [
    "# Regles Netlify generees depuis vercel.json (meme ordre, memes cibles).",
    "# Hebergement principal : Netlify (enertchad.com, sous-domaine enertchad.netlify.app) depuis le 1er octobre 2026,",
    "# Vercel etant suspendu. Toute redirection s ajoute d abord dans vercel.json, puis",
    "# ce fichier se regenere : python3 scripts/gen_netlify_redirects.py",
    "# Redirections : 308 forcees (!), comme Vercel qui les applique avant les fichiers.",
    "# Reecritures : 200 non forcees, comme Vercel qui sert d abord un fichier existant.",
    "# Domaine : l ancienne adresse enertchad.netlify.app redirige (301) vers enertchad.com,",
    "# pour qu une seule adresse soit indexee. Les apercus de deploiement ne sont pas touches.",
    "",
    "https://enertchad.netlify.app/* https://enertchad.com/:splat 301!",
    "",
]

def main():
    vj = json.load(open('vercel.json', encoding='utf-8'))
    # These files are built from the existing editorial sources by finalize.mjs.
    # Exact host rules precede generic legacy redirects, including /clients.
    lines = ["# Sous-sites : alias Netlify actifs avec HTTPS."]
    commercial = [('/', 'index.html'), ('/en/', 'en/index.html'),
                  ('/boutique', 'boutique.html'), ('/en/boutique', 'en/boutique.html')]
    atlas = [('/', 'index.html'), ('/en/', 'en/index.html')]
    for slug in ['carte', 'bassins-champs', 'infrastructures', 'cadre-sectoriel', 'sources']:
        atlas.extend([('/' + slug, slug + '.html'), ('/en/' + slug, 'en/' + slug + '.html')])
    for host, space, pages in [('clients', 'boutique', commercial), ('atlas', 'atlas', atlas)]:
        origin = 'https://' + host + '.enertchad.com'
        # TLS is required; aliases must be included in the site's certificate.
        lines.append('http://' + host + '.enertchad.com/* ' + origin + '/:splat 301!')
        for route, file in pages:
            lines.append(origin + route + ' /_subsites/' + space + '/' + file + ' 200!')
            if route.endswith('/') and route != '/':
                lines.append(origin + route.rstrip('/') + ' /_subsites/' + space + '/' + file + ' 200!')
            elif not route.endswith('/'):
                lines.append(origin + route + '/ /_subsites/' + space + '/' + file + ' 200!')
                lines.append(origin + route + '.html ' + origin + route + ' 301!')
        for name in ['sitemap.xml', 'robots.txt']:
            lines.append(origin + '/' + name + ' /_subsites/' + space + '/' + name + ' 200!')
    # Retain old paths on the new hosts, then land on the matching local page.
    for old, target in [('/clients', '/'), ('/clients-en', '/en/'),
                        ('/aval/boutique', '/boutique'), ('/aval/boutique-en', '/en/boutique'),
                        ('/boutique-en', '/en/boutique')]:
        lines.append('https://clients.enertchad.com' + old + ' https://clients.enertchad.com' + target + ' 301!')
    for old, target in [('/atlas', '/'), ('/atlas/', '/'), ('/atlas-en', '/en/')]:
        lines.append('https://atlas.enertchad.com' + old + ' https://atlas.enertchad.com' + target + ' 301!')
    for slug in ['carte', 'bassins-champs', 'infrastructures', 'cadre-sectoriel', 'sources']:
        for suffix, prefix in [('', ''), ('-en', '/en')]:
            lines.append('https://atlas.enertchad.com/atlas/' + slug + suffix + ' https://atlas.enertchad.com' + prefix + '/' + slug + ' 301!')
    # Optional boutique alias always lands on the catalogue, never the group home.
    lines.extend(['https://boutique.enertchad.com/en/* https://clients.enertchad.com/en/boutique 301!',
                  'https://boutique.enertchad.com/* https://clients.enertchad.com/boutique 301!',
                  'http://boutique.enertchad.com/* https://clients.enertchad.com/boutique 301!', ''])
    # Only production group hosts migrate; PR previews keep their test routes.
    migrations = [('/boutique/', '/aval/boutique', 'clients', '/boutique'),
                  ('/boutique/en/', '/aval/boutique-en', 'clients', '/en/boutique'),
                  ('/boutique/clients', '/clients', 'clients', '/'),
                  ('/boutique/en/clients', '/clients-en', 'clients', '/en/'),
                  ('/atlas/', '/atlas/index', 'atlas', '/'),
                  ('/atlas-en', '/atlas-en', 'atlas', '/en/')]
    for slug in ['carte', 'bassins-champs', 'infrastructures', 'cadre-sectoriel', 'sources']:
        migrations.extend([('/atlas/' + slug, '/atlas/' + slug, 'atlas', '/' + slug),
                           ('/atlas/' + slug + '-en', '/atlas/' + slug + '-en', 'atlas', '/en/' + slug)])
    for route, source, host, local in migrations:
        for old in sorted({route, route.rstrip('/'), source, source + '.html'}):
            for group_host in ['enertchad.com', 'www.enertchad.com']:
                lines.append('https://' + group_host + old + ' https://' + host + '.enertchad.com' + local + ' 301!')
    for group_host in ['enertchad.com', 'www.enertchad.com']:
        lines.append('https://' + group_host + '/boutique-en https://clients.enertchad.com/en/boutique 301!')
    lines.append('')
    lines.extend(HEAD)
    lines.append('/boutique/ /boutique/index.html 200!')
    for r in vj.get('redirects', []):
        src = re.sub(r'/:(\w+)\*$', '/*', r['source'])
        dst = re.sub(r':(\w+)\*', ':splat', r['destination'])
        # Netlify ajoute la barre finale aux dossiers par une seconde redirection :
        # on vise directement /dossier/ quand la cible est un repertoire du site.
        path, frag = (dst.split('#', 1) + [''])[:2]
        if path and not path.endswith('/') and os.path.isfile(path.lstrip('/') + '/index.html'):
            dst = path + '/' + ('#' + frag if frag else '')
        lines.append('%s %s %s' % (src, dst, '308!' if r.get('permanent', True) else '307!'))
    for r in vj.get('rewrites', []):
        dst = r['destination']
        if not dst.endswith(('.html', '/')):
            dst += '.html'
        lines.append('%s %s 200' % (r['source'], dst))
    open('_redirects', 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(len(lines) - len(HEAD), 'regles ecrites dans _redirects (plus la redirection de domaine)')

if __name__ == '__main__':
    main()

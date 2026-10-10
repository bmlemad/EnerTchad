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
    # Espaces Clients et Atlas : servis sous enertchad.com (/boutique/, /atlas/).
    # L hebergement OVH gratuit n accepte que enertchad.com et www ; les sous-domaines
    # ouverts le 9 octobre 2026 redirigent donc vers les chemins du site principal.
    lines = ["# Anciens sous-domaines -> chemins du site principal (301)."]
    group = 'https://enertchad.com'
    clients = [('/', '/boutique/clients'), ('/en/', '/boutique/en/clients'), ('/en', '/boutique/en/clients'),
               ('/boutique', '/boutique/'), ('/boutique/', '/boutique/'),
               ('/boutique.html', '/boutique/'), ('/en/boutique', '/boutique/en/'),
               ('/en/boutique/', '/boutique/en/'), ('/en/boutique.html', '/boutique/en/')]
    atlas = [('/', '/atlas/'), ('/en/', '/atlas-en'), ('/en', '/atlas-en')]
    for slug in ['carte', 'bassins-champs', 'infrastructures', 'cadre-sectoriel', 'sources']:
        atlas.extend([('/' + slug, '/atlas/' + slug), ('/' + slug + '.html', '/atlas/' + slug),
                      ('/en/' + slug, '/atlas/' + slug + '-en'), ('/en/' + slug + '.html', '/atlas/' + slug + '-en')])
    for host, pages, fallback, fallback_en in [('clients', clients, '/boutique/clients', '/boutique/en/clients'),
                                               ('atlas', atlas, '/atlas/', '/atlas-en'),
                                               ('boutique', [], '/boutique/', '/boutique/en/')]:
        for scheme in ['https', 'http']:
            origin = scheme + '://' + host + '.enertchad.com'
            for route, target in pages:
                lines.append(origin + route + ' ' + group + target + ' 301!')
            lines.append(origin + '/en/* ' + group + fallback_en + ' 301!')
            lines.append(origin + '/* ' + group + fallback + ' 301!')
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

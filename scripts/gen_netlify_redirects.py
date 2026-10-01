# -*- coding: utf-8 -*-
"""Regenere _redirects (Netlify) depuis vercel.json, pour que les deux hebergeurs
appliquent les memes redirections. Usage : python3 scripts/gen_netlify_redirects.py"""
import json, os, re

HEAD = [
    "# Regles Netlify generees depuis vercel.json (meme ordre, memes cibles).",
    "# Hebergement principal : Netlify (enertchad.netlify.app) depuis le 1er octobre 2026,",
    "# Vercel etant suspendu. Toute redirection s ajoute d abord dans vercel.json, puis",
    "# ce fichier se regenere : python3 scripts/gen_netlify_redirects.py",
    "# Redirections : 308 forcees (!), comme Vercel qui les applique avant les fichiers.",
    "# Reecritures : 200 non forcees, comme Vercel qui sert d abord un fichier existant.",
    "",
]

def main():
    vj = json.load(open('vercel.json', encoding='utf-8'))
    lines = list(HEAD)
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
    print(len(lines) - len(HEAD), 'regles ecrites dans _redirects')

if __name__ == '__main__':
    main()

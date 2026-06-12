# Déployer EnerTchad sur GitHub Pages

Ce dossier est le site **prêt à publier**. Build relatif : tous les liens sont en
`.html` relatif, donc le site fonctionne aussi bien à la racine d'un domaine
(`enertchad.td`) qu'en sous-chemin (`tonpseudo.github.io/enertchad/`). Aucune
configuration serveur nécessaire.

> Tu fais toi-même le `push` (je ne manipule pas tes identifiants GitHub).

---

## Option A — interface web GitHub (sans ligne de commande)

1. **github.com → New repository**. Nom : `enertchad` (public). Ne coche pas « Add a README ».
2. Page du dépôt vide → **« uploading an existing file »**.
3. **Glisse-dépose tout le CONTENU de ce dossier** (les `.html`, `assets/`, `photos/`,
   le fichier caché **`.nojekyll`**, `robots.txt`, `sitemap.xml`…). Vérifie que
   `.nojekyll` est bien inclus.
4. **Commit changes** (bouton vert).
5. **Settings → Pages** : *Source* = **Deploy from a branch**, *Branch* = **main /(root)** → **Save**.
6. 1–2 min plus tard, le site est en ligne sur `https://TONPSEUDO.github.io/enertchad/`.

## Option B — en ligne de commande

```bash
cd EnerTchad-github-pages
git init -b main
git add -A           # inclut .nojekyll
git commit -m "EnerTchad — site multipage (8 pôles + HSE-Q)"
git remote add origin https://github.com/TONPSEUDO/enertchad.git
git push -u origin main
```
Puis **Settings → Pages → Branch: main /(root) → Save**.

---

## Domaine personnalisé enertchad.td (recommandé)

1. Renomme `CNAME.exemple` en **`CNAME`** (édite-le si besoin : `www.enertchad.td`).
2. Chez ton registrar : `CNAME www → TONPSEUDO.github.io` ; et pour l'apex, 4 `A` vers
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
3. **Settings → Pages → Custom domain** : `www.enertchad.td` → coche **Enforce HTTPS**.

Le `sitemap.xml` cible déjà `https://www.enertchad.td`.

---

## Mettre à jour plus tard

```bash
cd site-v2
REL=1 OUT=dist-local python3 build.py
```
Recopie le contenu de `dist-local/` dans le dépôt, puis `push`.

## Notes
- `.nojekyll` est indispensable (sinon GitHub peut ignorer certains fichiers).
- `_redirects` / `_headers` / `vercel.json` ne sont pas inclus : ils ne servent qu'à
  Netlify / Cloudflare / Vercel.
- Pour des URL **sans** `.html`, Cloudflare Pages ou Vercel le font nativement à
  partir du build `dist/` (dossier `EnerTchad-github-export/`).

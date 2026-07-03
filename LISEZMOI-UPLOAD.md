# Uploader ce dossier sur github.com/bmlemad/EnerTchad (sans Terminal)

*Contenu : le site complet prêt à servir — 86 pages, version EN, PWA (sw.js), CI (.github/workflows), sitemap, CNAME `enertchad.td`, `.nojekyll`.*

## Étapes (5 min)

1. Ouvre **github.com/bmlemad/EnerTchad** (connecté à ton compte).
2. **Add file → Upload files**, puis glisse **tout le CONTENU de ce dossier** (Cmd+A à l'intérieur du dossier, puis glisser — pas le dossier lui-même).
3. Message de commit : `EnerTchad — release 2-3 juillet` → **Commit changes**.
4. ⚠️ Les fichiers cachés passent parfois mal en glisser-déposer. Vérifie sur GitHub que ces 3 éléments existent, sinon crée-les via **Add file → Create new file** :
   - `.nojekyll` — fichier vide (tape juste le nom) ;
   - `CNAME` — une seule ligne : `enertchad.td` ;
   - `.github/workflows/integrity.yml` — copie le contenu depuis ce dossier (affiche les fichiers cachés dans le Finder : Cmd+Shift+.).
5. **Settings → Pages** : Source = branche `main`, dossier `/ (root)` · Custom domain = `enertchad.td`.
6. 2-3 minutes plus tard, le site est en ligne. La CI « Intégrité du site » tourne à chaque futur upload.

## Alternative encore plus simple

Installer **GitHub Desktop** (desktop.github.com), se connecter, cloner `bmlemad/EnerTchad`, remplacer le contenu du clone par celui de ce dossier, puis *Commit* + *Push* — les fichiers cachés passent sans étape manuelle.

*(Un zip du dossier — `UPLOAD-GitHub-EnerTchad.zip` — est aussi à la racine du dossier de travail, pour archive ou transfert.)*

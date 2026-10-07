# EnerTchad — site officiel

Site institutionnel d'**EnerTchad S.A.**, société pétrolière intégrée du Tchad — *de la roche-mère à la pompe*. Site statique multipage, sans dépendance externe (polices, icônes et illustrations embarquées).

## Pages

`/` · `/entreprise/` · `/activites/` · `/atlas/` · `/technologies/` · `/engagements/` · `/investisseurs/` · `/carnets/` · `/contact/`

## Déploiement

Dépôt = site (fichiers statiques à la racine). Aucune étape de build côté hôte.

- **Vercel** : Framework *Other*, build command vide, output = racine. `vercel.json` applique en-têtes de sécurité + cleanUrls + trailingSlash.
- **Cloudflare Pages** : build command vide, output `/`. `_redirects` + `_headers` natifs.

Domaine : `enertchad.com`.

## Régénérer le site

Le site est généré depuis un canon unique par `build.py` (non inclus dans ce dépôt de production). Contact interne pour la source.

---
*Unité · Innovation · Durabilité*

## Harmoniser la structure corporate

Après toute régénération des pages FR/EN, exécuter `python3 scripts/align_corporate_structure.py`, puis `python3 scripts/check_integrity.py`. Cette migration conserve les routes et harmonise les quatre segments industriels, les capacités de soutien, les accès clients/fournisseurs et le Centre investisseurs.

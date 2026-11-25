# EnerTchad — site officiel

Site institutionnel d'**EnerTchad S.A.**, société pétrolière intégrée du Tchad — *de la roche-mère à la pompe*. Site statique multipage, sans dépendance externe (polices, icônes et illustrations embarquées).

## Pages

`/` · `/entreprise/` · `/activites/` · `/atlas/` · `/technologies/` · `/engagements/` · `/investisseurs/` · `/carnets/` · `/contact/`

## Déploiement

Dépôt = site (fichiers statiques à la racine). Aucune étape de build côté hôte.

- **OVH (hébergement principal)** : export `out/` publié sur la branche `ovh-static` par le workflow *corporate-readiness-ovh*, puis déployé depuis le manager. `redirects.json` est la source unique des redirections, réécritures et en-têtes (ancien `vercel.json`, lot 84) ; `python3 scripts/gen_netlify_redirects.py` en régénère `_redirects`, dont `scripts/ovh/package.py` dérive le `.htaccess`.
- **Netlify** : ne sert plus que la redirection 301 de l'ancienne adresse `enertchad.netlify.app`.

Domaine : `enertchad.com`.

## Régénérer le site

Le site est généré depuis un canon unique par `build.py` (non inclus dans ce dépôt de production). Contact interne pour la source.

---
*Unité · Innovation · Durabilité*

## Harmoniser la structure corporate

Historique : la migration d’octobre 2026 (`scripts/align_corporate_structure.py`) a harmonisé les pages sur l’organisation de l’époque. **Ne plus la relancer** : elle réécrirait l’ancienne organisation. L’organisation en vigueur depuis les 24 et 25 novembre 2026 compte cinq segments (Exploration & Production, Transport & Logistique, Raffinage & Distribution, Pétrochimie, Ingénierie & Services) et trois fonctions techniques ; `scripts/test_cinq_segments.py` la vérifie à chaque construction. Après toute régénération des pages FR/EN, exécuter `python3 scripts/check_integrity.py`.

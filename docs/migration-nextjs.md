# EnerTchad : migration Next.js et Netlify

La construction du site utilise Next.js 16.3.8, React 19.3.0 et App Router. L'export statique `out/` se publie sur le projet Netlify existant. Le domaine canonique reste `https://enertchad.com`.

## Périmètre

- 214 pages publiques sont générées : 212 pages éditoriales et deux pages techniques.
- `/essentiel`, `/essentiel-en`, `/investor-center` et `/investor-center-en` utilisent des Server Components React, un en-tête partagé et l'API Metadata Next.js.
- Les 210 autres pages passent par des Route Handlers statiques de compatibilité. Leur HTML reste identique, ce qui préserve les menus, les outils et les scripts existants. Elles ne sont pas encore réécrites en composants React.
- Les documents, images, polices, données et règles Netlify sont copiés dans `public/` à partir d'une liste de fichiers suivis par Git. Aucun répertoire de dépendances ou de travail n'entre dans cet export.
- Les fichiers HTML éditoriaux restent les sources de contenu, y compris pour les quatre pages React. Ils peuvent être modifiés sans éditer une copie générée.

## Commandes

Utiliser Node.js 22 ou supérieur.

```sh
npm ci
npm run dev
npm run build
npm run check:migration
```

`prepare:site` crée le manifeste et les ressources publiques. Next.js génère les routes. `finalize.mjs` normalise les réponses HTML des Route Handlers en fichiers `.html` pour les adresses Netlify existantes et restaure la page 404 du site. `verify.mjs` compare les empreintes des 210 pages compatibles et de toutes les ressources, puis contrôle les titres, langues, liens, menus, canoniques et données structurées des quatre pages React.

Les dossiers `public/`, `.generated/`, `.next/` et `out/` sont régénérés. Ne pas les modifier directement. La préparation utilise les fichiers suivis dans un checkout Git ou la même liste de types publics dans le ZIP des sources extrait.

## Publication

La configuration `netlify.toml` utilise `npm run build && npm run check:migration` et publie `out/`. Le runtime Next.js Netlify est désactivé pour cet export entièrement statique. Les redirections sont définies dans `_redirects` et les en-têtes dans `_headers` et `netlify.toml`.

Le ZIP de publication contient le contenu de `out/`, avec `index.html` à sa racine. Il peut être envoyé au déploiement manuel du projet `enertchad`. Le ZIP des sources contient l'application et les fichiers éditoriaux, sans dépendances ni sorties de construction.

Cette migration n'ajoute pas de backend aux formulaires et ne configure pas le DNS ou les boîtes e-mail. Les tests de construction et de préservation ne remplacent pas une validation visuelle et interactive dans Safari iOS et Chrome. La publication de ce lot et ces contrôles navigateur restent à vérifier.

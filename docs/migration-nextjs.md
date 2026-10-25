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

## Build : versions de cache et sources transformées (lot 26)

**Versions de cache (`scripts/next/fingerprint.mjs`).** Dans l'export, chaque appel d'une feuille ou d'un script de `/assets/chrome/` porte `?v=` suivi des 12 premiers caractères hexadécimaux du SHA-256 du fichier publié. Cette valeur remplace les `?b=AAAAMMJJ…` saisis à la main dans les sources, ainsi que les appels sans version. `prepare.mjs` calcule la table (`.generated/fingerprints.json`). Une ressource qui en charge une autre, par exemple `nav_a.js` → `audience-consent.js` ou `fournisseur-form.js` → `fournisseur-form.css`, reçoit d'abord l'URL versionnée de sa dépendance, puis sa propre empreinte. `harden-export.mjs` réécrit les pages avant de calculer la politique CSP de page, si bien que les empreintes des scripts en ligne portent sur le texte final. Les pages React passent par `lib/fingerprint.js`. Les noms de fichiers ne changent pas. Les règles de cache sont décrites dans la section du lot 27. L'empreinte porte sur les octets publiés (feuilles minifiées). Les `?b=` des sources n'ont plus d'effet sur l'export. On peut les retirer progressivement.

**Sources transformées (`scripts/next/sources.mjs`, lot 26).** Jusqu'au lot 26, `scripts/apply_readiness_20261013.py` et les 26 scripts qu'il enchaînait modifiaient 248 fichiers suivis pendant chaque build, puis `finalize.mjs` les restaurait. Le mécanisme de restauration reste en place (voir ci-dessous).

## Build : sources = publié, cache long de `/assets/chrome/` (lot 27)

**Sources converties une fois (m16, voie B).** Le 23 octobre 2026, la chaîne `apply_readiness_20261013.py` a été appliquée une fois. Les 248 fichiers transformés (233 pages HTML, 13 feuilles et scripts de `/assets/chrome/`, `assets/data/document-registry.json`, `lib/strategic.jsx`) ont été committés tels quels. Ils sont identiques, octet pour octet, aux copies `.generated/transformed/` du build de la base `2f499a094`. Aucun texte n'a été réécrit à la main. Les fichiers suivis sont désormais ce qui est publié : `prepare.mjs` n'exécute plus la chaîne.

**Preuve.** La base `2f499a094` et ce lot ont été construits dans le même répertoire, avec le même identifiant de build Next.js (`generateBuildId` temporaire, non committé) et le même `COMMIT_REF`. Les deux arbres `out/` sont identiques, octet pour octet, à un fichier près : `_headers`, modifié volontairement pour le cache (voir plus bas). Sans ces deux réglages, les seules différences sont générées : `deploy-version.txt` (commit construit), l'identifiant de build Next.js (nom de dossier `_next/static/<id>/`, mentionné dans les pages React et les fichiers RSC `.txt`) et, par conséquent, l'empreinte CSP du script en ligne de Next.js dans les 5 pages React. Les numéros de module webpack dépendent aussi du chemin du checkout.

**Idempotence.** Une seconde exécution de la chaîne sur les sources converties n'était pas neutre : `apply_visual_polish.py` et `apply_nav_minors.py` déplaçaient le bloc `et-visual` à la fin de `premium-chrome.css` et supprimaient le marqueur `/* nav-minors:start */`. Exécutés seuls, la plupart des scripts `align_*` réécrivaient aussi des pages que des scripts suivants remettaient en forme. Ces scripts ne doivent donc plus être relancés sur les sources.

**Scripts retirés** (aucun test ne les importait) : `apply_readiness_20261013.py`, `align_auxiliary_access.py`, `compact_contact_css.py`, `align_liquid_glass.py`, `align_navigation_accessibility.py`, `apply_qa_majors.py`, `apply_nav_majors.py`, `apply_nav_minors.py`, `apply_tech_lot20.py` et `apply_lot24.py`, ainsi que leurs blocs CSS sources (`scripts/liquid-glass.css`, `scripts/tech-lot20.css`, `scripts/tech-lot24.css`). Leurs effets sont dans `assets/chrome/premium-chrome.css` et dans les pages. `align_corporate_structure.py` ne relance plus la chaîne.

**Scripts gardés hors du build**, car des tests ou des audits importent leurs fonctions : `align_investor_journeys`, `align_company_descriptions`, `direct_enquiry_form`, `align_arabic_readiness`, `align_mobile_quick_nav`, `align_engineering_offer`, `modernise_site`, `apply_configurator_history`, `apply_configurator_footer`, `align_catalogue_session`, `align_catalogue_quantity`, `apply_visual_polish`, `align_mobile_sheet_focus`, `align_b2b_strategy`, `align_commercial_coherence` et `apply_home_major_review`. Les tests vérifient désormais que leurs transformations ne changent plus les sources committées. Par exemple, `home(index.html) == index.html`. `test_home_major_review.py`, `test_qa_majors.mjs` et `subsites.test.mjs` ne lancent plus la chaîne.

**Rejeu de la PR #130 (`scripts/apply_site_audit.py`).** La PR #130 (`81f7a7e0c`, fusionnée le 24 octobre 2026) ajoutait `apply_site_audit.py` à la chaîne retirée et le faisait relancer par `nextjs-build.yml` avant `test_site_audit.py`. Son intention a été rejouée une fois sur les sources converties : 107 pages (`hreflang="fr"` et mention « (in French) » sur les liens anglais vers `/configurateur-service-integre` et `/amont/calculateur-baril-additionnel`, `/atlas` → `/atlas-en` dans les pages `-en`, « Prix confirmé selon le produit » / « Pricing confirmed by product » dans `aval/boutique(-en).html`, ancre `#t-eiti` dans `journal-gouvernance-avant-actifs-en.html`). Le script est idempotent (0 page au second passage) et reste dans le dépôt parce que `test_site_audit.py` importe sa fonction `transform` ; le workflow n'exécute plus que le test.

**Étape gardée dans le build : `scripts/refresh_document_metadata.py`.** Elle recalcule les tailles et empreintes des documents publics, ainsi que les cartes de `publications` et d'`investor-center`, et écrit la date du jour dans le champ `generated` de `assets/data/document-registry.json`. Cette date en fait une étape non idempotente d'un jour à l'autre. `prepare.mjs` l'appelle seule, et `sources.mjs` restaure le registre en fin de build, de sorte que `git status` reste propre. Elle ne réécrit plus le `?b=` de `document-room.js`, car la version vient de l'empreinte (lot 26).

**Régénérer des pages.** Les générateurs `gen_*` (non lancés par le build) produisent des pages sans les ajouts de la chaîne retirée. Après une régénération, il faut reporter ces ajouts depuis la version committée. Ne pas relancer les anciens scripts `align_*` et `apply_*`.

**Cache long de `/assets/chrome/` (m10).** Toutes les références publiées à une feuille ou à un script de `/assets/chrome/` portent `?v=<empreinte>` : 4 732 sur 4 732 dans `out/`, aucune URL construite en JavaScript vers un `.css` ou un `.js`. `npm run check:migration` échoue sinon. `_headers` donne donc `Cache-Control: public, max-age=31536000, immutable` à `/assets/chrome/*.css` et `/assets/chrome/*.js`. Le reste du dossier, appelé sans version (`ftx_fr.json`, `ftx_en.json`, chargés par `fetch('/assets/chrome/'+…)`, et `ener-symbols.svg`), garde `max-age=3600, stale-while-revalidate=86400`. La règle cible l'extension et non la query string, invisible pour Apache dans `<FilesMatch>` et dans `%{REQUEST_URI}`. `scripts/ovh/package.py` la convertit en `Header always set … "expr=%{REQUEST_URI} =~ m#^/assets/chrome/.*\.css$#"`, et la dernière règle applicable l'emporte, comme dans `scripts/bench/serve.mjs`. `vercel.json` porte les deux mêmes règles, avec des motifs disjoints. `scripts/ovh/check_apache.py` vérifie, sur un Apache 2.4 réel, chaque fichier de `/assets/chrome/` (avec et sans `?v=`), le registre de `/assets/data/` et une page HTML. Un nouveau fichier `.css` ou `.js` de `/assets/chrome/` doit être appelé avec `?v=` : le build l'ajoute dans `out/` à partir des sources.

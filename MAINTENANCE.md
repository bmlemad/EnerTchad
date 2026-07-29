# Guide de maintenance — site EnerTchad

*Dernière mise à jour : 29 juillet 2026. Ce guide documente l'architecture réelle du site et les conventions à respecter pour le faire évoluer sans régression. Il condense les leçons apprises pendant sa construction.*

## 1. Architecture générale

Site **100 % statique** : 159 pages HTML (FR intégral, EN étendu, AR une page), déployé sur Vercel depuis la branche `main` (chaque commit sur `main` déclenche un déploiement). `vercel.json` porte : `cleanUrls`, 97 redirections héritées (anciens noms de pôles → nouveaux, toujours en un saut, y compris les variantes avec barre oblique finale), les en-têtes de sécurité (CSP, HSTS, nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy) et le cache (`/assets/` : 1 an immuable ; `/assets/chrome/` : 1 h + stale-while-revalidate — voir §4).

Ressources partagées dans `assets/chrome/` (~55 feuilles CSS + scripts). Les pages n'embarquent pas toutes les mêmes feuilles : la famille « index » (accueils, pages héritées à diapo) ne charge pas toutes les feuilles du reste du site — d'où le fichier `plight_extrait.css` (§2).

## 2. Système de thèmes — le point le plus délicat

**Sombre** = thème par défaut. **Clair** = deux mécanismes distincts :

- `html.et-plight` : thème « verre clair » du site (bouton ☀ `#plightBtn`, clés localStorage `et-plight`/`et-jlight`, auto si l'OS est en clair). Le JS `assets/chrome/u_cd226c00eb4b.js` applique la classe (liste `PAGES` en tête de fichier) et injecte quelques styles (dégagement mobile du pied de page, masquages à l'impression).
- `html.et-jlight` : mode « lecture claire » propre aux pages du **journal** (`journal-*.html`), avec sa propre palette papier. Les correctifs destinés aux journaux doivent cibler `et-jlight` (ou les deux) — cibler seulement `et-plight` n'a aucun effet sur un article.

**Le verre clair (v2)** vit à la fin de `assets/chrome/bundle_core_a1.css` :
- l'aurore (4 radiaux or/bleu/vert/rose + dégradé crème) est posée sur **`html.et-plight` lui-même** avec `background-attachment:fixed` — sur `html` et non `body`, car plusieurs pages héritées forcent `body{background:transparent!important}` ;
- `main` et `body>section` ne portent qu'un voile léger (~.40/.48) : l'aurore transparaît et glisse au défilement ;
- les cartes (`.card`, `[class*="card"]`, `[class*="panel"]`, `article`) reçoivent le verre givré (blanc .58→.32 + `backdrop-filter: blur(26px) saturate(185%)`) ;
- les couches photo sombres sont éteintes en clair : `.subland`, `.rootland`, `.diapo` + `#diapo-cap` (`display:none`), et le héros d'accueil devient un îlot sombre en dégradé.

**Îlots sombres assumés** en thème clair : héros photo (`header.pghero`, `header.hero`), figure « Parcours du baril » (`.vcx`), barre des journaux (`.jtop`), cartes communiqués. Leurs encres claires sont restaurées par des règles d'exception à spécificité supérieure (`:not(#_):not(#__)`). **Ne jamais élever la spécificité des règles d'encre globales** : l'écosystème d'exceptions (pghero, .fp-card, .adx, .cp-ct…) repose sur un ordre de cascade précis — le commentaire « PRINCIPE DE CASCADE » dans le bundle fait foi.

**Lifts d'encres inline** : les sélecteurs `[style*="E8C36A"]`, `[style*="F0CE82"]`, `[style*="var(--gold-l"]` (sans parenthèse fermante : il faut attraper `var(--gold-l,#…)` avec repli) assombrissent en clair les encres or posées en style inline — avec exceptions pour les îlots. Piège vécu : un **fond** inline contenant `#F0CE82` déclenche aussi le lift de **couleur** ; pour un bouton doré inline, utiliser une teinte voisine non interceptée (ex. `#EFCC7E`).

**`plight_extrait.css`** : pour les pages qui ne chargent pas le bundle, ce fichier contient uniquement les règles `et-plight`/`et-jlight` extraites du bundle. **À régénérer après chaque modification des règles claires du bundle** : créer une page hôte qui charge le bundle, parcourir `document.styleSheets` en CSSOM et ne garder que les sélecteurs dont chaque partie contient `.et-plight`/`.et-jlight` (reconstruire les `@media`). Ne jamais l'éditer à la main.

## 3. Service worker (`sw.js`)

Constante `V='et-AAAAMMJJHHMM'`. Stratégie : HTML réseau d'abord (repli cache), assets cache d'abord **mais revalidés en `cache:'no-cache'`** — c'est ce qui protège des caches HTTP immuables périmés.

**Règle : bumper `V` à chaque modification d'un fichier `assets/chrome/*`** (CSS ou JS). Les modifications HTML seules n'exigent pas de bump.

## 4. Cache CDN

`/assets/` est servi 1 an immuable — sûr pour les images (on ne réécrit pas une image sous le même nom sans raison), dangereux pour les fichiers chrome réécrits sous le même nom : c'est pourquoi `/assets/chrome/` est ramené à 1 h + revalidation. Après un déploiement, les lectures de bord peuvent rester périmées 2 à 4 minutes et alterner selon les nœuds : **ne jamais conclure à un échec sur une seule lecture** ; re-vérifier avec `fetch(url,{cache:'reload'})` (l'en-tête `age: 0` signale une lecture d'origine fraîche).

## 5. Procédure de publication

Publication par l'interface web GitHub (upload de fichiers) :
- le formulaire d'upload committe **dans un seul répertoire** (`/upload/main` ou `/upload/main/<dossier>`) — un commit par répertoire touché ;
- plafond ~100 fichiers par commit (au-delà, dépôt silencieusement partiel) ;
- messages de commit en ASCII ;
- le formulaire ne crée pas de dossiers : pour un nouveau dossier, passer par « Create new file » avec `nom-dossier/fichier` (les paramètres d'URL `?filename=…&value=…` préremplissent le formulaire) ;
- l'upload **ajoute** mais ne supprime jamais : les suppressions passent par la page du fichier → « ⋯ → Delete file » ;
- après commit : attendre ~1 min, vérifier via `git fetch` que le commit est sur `origin/main`, attendre le déploiement (~1-2 min) puis vérifier en production.

## 6. Conventions éditoriales du journal

Un nouvel article = **une paire FR/EN** sur le gabarit des articles existants. Liste de contrôle complète :
1. métadonnées : `<title>`, description, canonical, OG (title/description/url/locale), `article:published_time`, JSON-LD `Article` **et** `BreadcrumbList`, paire `hreflang` FR↔EN ;
2. **cohérence des dates** sur toutes les surfaces : signature visible, JSON-LD, `published_time`, flux RSS, cartes des hubs (une seule vérité — des incohérences ont déjà dû être réparées) ;
3. héros : photo de `assets/img/` (préchargée `fetchpriority=high`), compressée fort (elle est sous un voile sombre .54/.66 — viser < 90 Ko) ;
4. liens frères entrants et sortants (« Pour aller plus loin ») ;
5. insertion : cartes en tête des deux hubs Carnets (ordre chronologique après l'article à la une), entrée en tête de `feed.xml` et `feed-en.xml` (tri décroissant strict, XML valide), `sitemap.xml` (+2 URL), `plan-du-site.html` (+2 liens), rafraîchir le « fil daté » des deux accueils (cartes statiques !), lien retour depuis la page thématique concernée.

## 7. Documents PDF

Brochures FR/EN (6 p.) et fiche AR (2 p.) : générées depuis les sources HTML paginées (`@page A4`) archivées dans `docs-sources/`, rendues en PDF (Chromium headless, `printBackground:true`, marges nulles). Pour mettre à jour : éditer la source, régénérer, republier le PDF **et** la source. Ne pas imprimer la page `/brochure` du site en PDF : elle sort à ~45 pages et 45 Mo.

## 8. Vérifications avant publication (rituel minimal)

- liens internes + ancres du dépôt (0 mort attendu — attention aux liens relatifs des hubs et aux fragments d'état `#p=…` du Configurateur, qui ne sont pas des ancres) ;
- rendu des pages touchées dans **les deux thèmes** + mobile 390 px ;
- contraste : en cas de doute, mesure au pixel (masquer l'encre, médiane de luminance du fond réel) — les mesures « computed » mentent sur les fonds semi-transparents ;
- artefacts d'audit connus (à ne pas « corriger ») : pages à `content-visibility` (brochure), échantillonnage d'éléments sticky en haut de page, éléments occultés (double lien du Configurateur), logos/textes de marque échantillonnés sur photo ;
- les captures pleine page mentent : `background-attachment:fixed` ne se peint que sur le premier écran, et les révélations au défilement (`.rv` → classe `in`) laissent des blocs vides — forcer `in` et défiler progressivement avant capture.

## 9. Pièges divers vécus

- `scroll-behavior:smooth` fausse les mesures scriptées (forcer `auto` dans les instruments) ;
- l'effet d'estompage au défilement des pages pôle rend le contenu flou/dim **pendant** le scroll : c'est voulu, tout redevient net à l'arrêt ;
- les pages héritées à diapo (`index-en`, `pole-*-en`, légales…) posent `html{background:#070c15!important}` + `body` transparent : toute règle de fond claire doit viser `html.et-plight` avec une spécificité supérieure ;
- ne pas minifier les feuilles chrome : les commentaires documentent la cascade, et Brotli rend le gain négligeable ;
- boutons flottants (☀, ↑, barre mobile, bandeau cookies) : masqués à l'impression via le style injecté par `u_cd226c00eb4b.js` ;
- le pied de page mobile garde 76 px de dégagement pour que les liens légaux restent tapables sous les boutons flottants.

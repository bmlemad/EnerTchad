# Guide de maintenance — site EnerTchad

*Dernière mise à jour : 30 juillet 2026.*

## 1. Architecture générale

Site **100 % statique** : 159 pages HTML (FR intégral, EN étendu, AR une page), déployé sur Vercel depuis la branche `main` (chaque commit sur `main` déclenche un déploiement). `vercel.json` porte : `cleanUrls`, 97 redirections héritées (anciens noms de pôles → nouveaux, toujours en un saut, y compris les variantes avec barre oblique finale), les en-têtes de sécurité (CSP, HSTS, nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy) et le cache (`/assets/` : 1 an immuable ; `/assets/chrome/` : 1 h + stale-while-revalidate — voir §4).

Ressources partagées dans `assets/chrome/` (~55 feuilles CSS + scripts). Les pages n'embarquent pas toutes les mêmes feuilles : la famille « index » (accueils, pages héritées à diapo) ne charge pas toutes les feuilles du reste du site — d'où le fichier `plight_extrait.css` (§2).

**Recherche (palette Ctrl+K)** : voir §10 — c'est un sous-système bilingue à part entière. La palette n'existe que sur les **96 pages qui portent la navigation principale** (`nav_a.js`) : les pages « sans chrome » — articles du journal, outils autonomes, boutique, explorateur, pages légales, `/ar` — en sont dépourvues **par construction de gabarit**. Exception délibérée : `404.html` embarque le balisage `#cmdk` + les deux scripts et un bouton « Rechercher sur le site », pour qu'un visiteur égaré ne soit pas en cul-de-sac ; comme cette page ne déclare aucune variable CSS, le bloc y est autonome (variables redéclarées sur `#cmdk`, icône en couleur littérale, styles de bouton pour les deux thèmes).

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
6. **index de recherche — les deux langues** : ajouter `{c:'Carnets', id:'cn-<slug>', t:'<titre> — Carnet', k:'<mots-clés>', url:'/journal-<slug>'}` dans `assets/chrome/cmdk_extra.js` **et** `{c:'Stories', id:'cn-<slug>', t:'<title> — Story', k:'<keywords>', url:'/journal-<slug>-en'}` dans `assets/chrome/cmdk_en.js`, puis bumper `V` dans `sw.js`. Deux oublis constatés, chacun rendant des pages entières introuvables : 23 articles sur 25 absents de la palette FR, puis 14 pages FR absentes alors que leurs équivalents EN étaient indexés. Vérifier en tapant un mot distinctif dans la palette, **dans les deux langues**. Voir §10 pour les catégories admises.

## 7. Documents PDF

Brochures FR/EN (6 p.) et fiche AR (2 p.) : générées depuis les sources HTML paginées (`@page A4`) archivées dans `docs-sources/`, rendues en PDF (Chromium headless, `printBackground:true`, marges nulles). Pour mettre à jour : éditer la source, régénérer, republier le PDF **et** la source. Ne pas imprimer la page `/brochure` du site en PDF : elle sort à ~45 pages et 45 Mo.

## 8. Vérifications avant publication (rituel minimal)

- liens internes + ancres du dépôt (0 mort attendu — attention aux liens relatifs des hubs et aux fragments d'état `#p=…` du Configurateur, qui ne sont pas des ancres) ;
- rendu des pages touchées dans **les deux thèmes** + mobile 390 px ;
- contraste : en cas de doute, mesure au pixel (masquer l'encre, médiane de luminance du fond réel) — les mesures « computed » mentent sur les fonds semi-transparents ;
- artefacts d'audit connus (à ne pas « corriger ») : pages à `content-visibility` (brochure), échantillonnage d'éléments sticky en haut de page, éléments occultés (double lien du Configurateur), logos/textes de marque échantillonnés sur photo ;
- les captures pleine page mentent : `background-attachment:fixed` ne se peint que sur le premier écran, et les révélations au défilement (`.rv` → classe `in`) laissent des blocs vides — forcer `in` et défiler progressivement avant capture.

**Audit métadonnées (SEO).** Passer tout le dépôt et vérifier, page par page : `<title>` ≤ 70 caractères, `description` entre 70 et 170, `canonical` **et** `og:url` égaux à l'URL propre de la page (`.html` retiré, `/index` → `/`), présence de `lang`, `og:title`, `og:image`, un seul `<h1>`, `alt` sur chaque image, présence dans `sitemap.xml` et réciprocité des `hreflang`. Puis les contrôles croisés, qui sont ceux qui rapportent le plus : aucun titre ni aucune description identiques sur deux pages, et **aucune première phrase de description partagée par trois pages ou plus** — la troncature en SERP tombe vers 155 caractères, donc une phrase d'accroche mutualisée fait disparaître précisément ce qui distingue les pages. Trois défauts réels trouvés ainsi : deux `og:url` copiés d'un autre article (le partage résolvait vers une page tierce et fusionnait les trois en un seul objet social), et six pages menant sur le même chapeau de 96 caractères. Piège d'outillage : une regex sur `content="…"` doit **capturer le guillemet ouvrant et le rappeler** (`content=(["'])([\s\S]*?)\1`) — une classe `["']` aux deux bouts s'arrête à la première apostrophe ASCII du texte et fabrique des descriptions de neuf caractères, donc des faux positifs en série.

**Audit accessibilité.** Charger chaque page dans un navigateur réel (les défauts intéressants sont dans le DOM rendu, pas dans la source : le Configurateur est un bundle React d'un seul fichier dont tous les titres sauf un sont générés à l'exécution) et vérifier : aucun `id` dupliqué, aucun saut de niveau de titre, aucun intitulé de lien vague (« ici », « en savoir plus »), un nom accessible sur chaque lien et chaque bouton, **un `aria-label` ou un `<label for>` sur chaque contrôle de formulaire** — un texte simplement posé à côté du champ ne compte pas, et un `placeholder` n'est pas un nom accessible —, un `title` sur chaque `iframe`, un JSON-LD qui parse, et **aucune ancre interne morte** : tout `href="#x"` dont la cible `id`/`[name]` est absente de la page. Cette dernière règle a révélé un lien mort dans la barre de navigation mobile des deux pages `parc` — invisible au bureau, cassé au doigt. Corollaire bilingue : les fragments ne se traduisent pas mécaniquement, la section FR `#services-ep` a pour équivalent EN `#catalogue`. Quand un correctif doit toucher un bundle minifié, poser la rustine sur une chaîne exacte (les deux builds `module`/`nomodule` sont présents, donc deux occurrences attendues), vérifier que **la longueur du fichier ne change pas**, et comparer avant/après les styles calculés des titres : la base Tailwind ramenant `h1`–`h6` à `inherit`, changer `h1` en `h2` est visuellement inerte — mais cela se démontre, cela ne se suppose pas.

## 9. Pièges divers vécus

- `scroll-behavior:smooth` fausse les mesures scriptées (forcer `auto` dans les instruments) ;
- l'effet d'estompage au défilement des pages pôle rend le contenu flou/dim **pendant** le scroll : c'est voulu, tout redevient net à l'arrêt ;
- les pages héritées à diapo (`index-en`, `pole-*-en`, légales…) posent `html{background:#070c15!important}` + `body` transparent : toute règle de fond claire doit viser `html.et-plight` avec une spécificité supérieure ;
- ne pas minifier les feuilles chrome : les commentaires documentent la cascade, et Brotli rend le gain négligeable ;
- boutons flottants (☀, ↑, barre mobile, bandeau cookies) : masqués à l'impression via le style injecté par `u_cd226c00eb4b.js` ;
- le pied de page mobile garde 76 px de dégagement pour que les liens légaux restent tapables sous les boutons flottants.

## 10. Recherche — sous-système bilingue

**Quatre fichiers, trois rôles.** `assets/chrome/c_abd9013c3955.js` et `c_df4f446df566.js` sont les deux variantes du moteur (rendu, scoring, raccourcis) ; chacune embarque le même index de base FR de 76 entrées dans une IIFE non exposée — **leurs littéraux de tableau sont octet pour octet identiques**, le second fichier ne diffère que par son enveloppe `try{…}catch(_e){}`. Toute modification de l'un doit être appliquée à l'autre, sans exception : les 96 pages portant la palette se répartissent entre les deux (54 / 42), donc un correctif posé sur un seul fichier ne corrige que la moitié du site. `assets/chrome/cmdk_extra.js` porte les compléments FR (`window.CMDK_EXTRA`, 166 entrées) et `assets/chrome/cmdk_en.js` l'index anglais complet (138 entrées) — même contrat, même variable globale. Chaque page charge exactement **un** fichier de compléments, celui de sa langue.

**Le portail de langue.** L'index de base est neutralisé côté anglais par `const idx=(EN?[]:[…]).concat(window.CMDK_EXTRA||[])`, où `EN` ne se contente pas de lire `<html lang>` : il vérifie aussi que le tableau global chargé ressemble bien à l'index anglais (plus de 20 entrées, dont au moins une URL en `-en`). Cette double condition évite le pire scénario — une page anglaise qui aurait chargé le complément français afficherait un index vide plutôt qu'une palette entièrement en français. Corollaire opérationnel : une page `-en` doit charger `cmdk_en.js`, jamais `cmdk_extra.js`. Un oubli sur ce point a fait servir l'index français à 35 pages anglaises.

**Scoring pondéré par le titre.** Un jeton trouvé dans le titre vaut 3, +1 s'il tombe sur une frontière de mot ; trouvé seulement dans les mots-clés il vaut 1 ; une requête multi-mots dont tous les jetons sont trouvés reçoit +2. `Array.prototype.sort` étant stable, les égalités conservent l'ordre du tableau. Conséquence pratique : **pour qu'une page gagne sur une requête, le mot doit être dans son titre**, pas seulement dans ses mots-clés — une entrée dont le titre contient le mot par accident (« Du premier contact à la livraison ») bat autrement la page réellement visée (`/contact`). Deux titres ont dû être retouchés pour cette raison.

**Taxonomie bilingue à 17 noms, en miroir.** FR : `Groupe, Clients & solutions, Amont, Intermédiaire, Aval, Pétrochimie, Durabilité, Technologie, Talents & formation, Conseil, Investisseurs, Journal, Carnets, Outils, Références, Contact, Légal`. EN, créneau par créneau : `Group, Clients & solutions, Upstream, Midstream, Downstream, Petrochemicals, Sustainability, Technology, Talent & training, Advisory, Investors, Journal, Stories, Tools, Reference, Contact, Legal`. **N'inventer aucune catégorie** : une valeur hors liste tombe en fin de palette dans un en-tête isolé. L'ancienne taxonomie comptait 25 noms dont un fourre-tout de 97 entrées, et produisait 39 en-têtes entrelacés pour 25 catégories.

**Tri d'ordre à l'exécution.** Juste après le `.concat(window.CMDK_EXTRA||[])`, une table `CPOS` associe chaque nom — français **et** anglais — au même numéro de créneau, et un `sort` stable regroupe les entrées. C'est ce qui garantit un seul en-tête par catégorie et un ordre éditorial fixe, **quel que soit l'endroit où une nouvelle entrée est insérée** : plus besoin de la ranger au bon endroit du tableau. Piège vécu : une première version utilisait un simple tableau ordonné de noms, ce qui plaçait les trois noms communs aux deux langues (`Clients & solutions`, `Journal`, `Contact`) aux positions françaises et cassait l'ordre anglais. La table doit rester un **dictionnaire créneau → deux noms**.

**Icônes.** `ICON[c]` fournit le glyphe par catégorie, `ICON._` un simple disque de repli (`<circle cx="12" cy="12" r="4">`). Les deux langues partagent les mêmes tracés : une catégorie ajoutée sans glyphe se voit immédiatement (188 lignes françaises sur 219 affichaient le disque de repli alors que l'anglais n'en avait aucun). Sonde : compter les `a.cmdk-item` dont le `.ci-ic svg` a exactement ce contenu.

**Toute nouvelle page a besoin d'une entrée dans l'index de sa langue** — et une page ayant un équivalent dans l'autre langue en a besoin dans les deux. Audit de couverture : lister les pages qui chargent `nav_a.js`, les convertir en URL propres (`cleanUrls`) et les diffuser contre l'union des URL indexées, ancres retirées. Seul manque attendu : `/404`, volontairement absent de l'index tout en portant la palette. Repères actuels : 242 lignes et 17 en-têtes en FR, 138 lignes et 17 en-têtes en EN, 0 icône de repli, 0 fuite d'URL d'une langue dans l'autre.

**Sondes DOM utiles** (le balisage des lignes n'a **pas** d'attribut `data-url` — se servir de `href`) : lignes `a.cmdk-item`, icône `.ci-ic svg`, titre `.ci-t`, mots-clés `.ci-k`, en-têtes `div.cmdk-group`, champ `#cmdk-input`, conteneur `#cmdk-results`, ouverture programmée `window.openCmdk()`.

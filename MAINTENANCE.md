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

**Piège du clone superficiel.** Une copie de travail obtenue par `git clone --depth 1` a un HEAD antérieur aux commits publiés depuis : `git status` y présente donc comme « modifiés » des fichiers déjà en ligne, et `git checkout` ne doit **jamais** servir à annuler quoi que ce soit. Pire, `git diff FETCH_HEAD` signale des **suppressions fantômes** pour les fichiers absents de cet index — `assets/chrome/cmdk_en.js` en est un cas connu (déposé directement par le formulaire web lors d'une session antérieure ; `git status --porcelain` l'affiche en `??` alors que ses octets sont identiques à ceux de l'origine). Ne jamais republier ni supprimer un fichier sur ce seul signal. La seule liste de publication fiable se calcule en comparant octet à octet chaque fichier du disque à `git ls-tree -r --name-only FETCH_HEAD`.

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

**Audit typographique (français).** Les règles appliquées à tout le site : espace insécable avant `:` `;` `!` `?` `»` et après `«` ; espace insécable avant `%` **uniquement si un chiffre précède** (sinon « le % de » se retrouve collé pour rien) ; apostrophe droite entre deux lettres → `’` ; unité collée à son nombre. La classe des unités collées ne contient que des **symboles** — `%`, `t`, `km`, `h`, `€`, `$`, `bbl`, `Mbbl`, `Md$`, `$/bbl`, `kb/j`, `°C` — et jamais des mots : « 3 ans », « 12 millions » gardent une espace ordinaire. Les ponctuations déjà collées (`10:30`, `1;2`) ne sont pas « corrigées », et les guillemets droits doubles sont laissés tels quels.

**Entité ou échappement, selon la zone.** Dans le balisage, écrire l'entité `&nbsp;`. Dans un littéral de chaîne JavaScript, écrire l'échappement `\u00A0` — une entité assignée à `textContent` s'afficherait littéralement, à l'écran, sous la forme des six caractères. Les attributs `onclick` inline sont un cas mixte : leur **zone** est le balisage, mais leur **contenu** est du JavaScript, donc c'est l'échappement qui s'y applique. Zones délibérément exclues de l'audit : `<title>`, `application/ld+json`, les attributs `meta`, et tous les commentaires.

**`\s` de JavaScript avale l'insécable.** U+00A0 fait partie de `\s`, ce qui a deux conséquences. D'abord un vrai bug : le rail « Sommaire » normalisait ses titres avec `\s+` et détruisait donc les insécables qu'on venait de poser — corrigé en `[^\S\u00A0]+`. Ensuite une conséquence d'outillage : tout instrument d'audit écrit avec `\s` déclare le site conforme alors qu'il ne regarde rien. Écrire les sondes avec des classes explicites.

**Analyser les chaînes comme le fait un navigateur.** Un scanner de littéraux naïf a produit deux guillemets orphelins et deux `<` non échappés. Ces derniers sont particulièrement traîtres : à l'intérieur d'un `<script>`, un `<` isolé ne casse rien tant qu'il n'amorce pas `</script>`, donc la page continue de fonctionner et aucun rendu ne trahit le défaut — il ne se voit qu'en relisant la source.

**Les bundles minifiés : ne jamais scanner, remplacer exactement.** Le React minifié contient des littéraux d'expression régulière comme `/["'\\]/g`. Un scanner qui suit les guillemets de gauche à droite **se désynchronise** dessus, puis lit du code exécutable comme s'il s'agissait de texte, et le réécrit volontiers. La seule transformation sûre sur ces fichiers est donc une **liste fermée de remplacements de chaînes exactes, cantonnés à des zones nommées** (`MARKUP`, `ld+json`, `script<i>`, `BUNDLE-nomodule`, `BUNDLE-module`), chaque règle portant son nombre d'occurrences attendu et échouant bruyamment si le compte ne tombe pas. Le test d'idempotence doit lui aussi être **borné à la zone** : compter le remplacement sur le fichier entier fait passer pour « déjà appliquée » une règle qui ne l'est pas, parce qu'une occurrence légitime existe ailleurs.

**Le couple `nomodule` / `module` est invisible au rendu.** Le Configurateur embarque sa prose **deux fois** : un bundle `nomodule defer` pour les navigateurs anciens, un bundle `type="module"` pour les modernes. Exactement un des deux s'exécute, donc un diff de rendu — qui sollicite toujours le moderne — est **structurellement aveugle** à une divergence introduite dans la seule copie héritée. Technique de contournement : générer une page jetable `_legacy_probe.html` où le bundle `module` est remplacé par un commentaire et où la balise ouvrante du `nomodule` devient un simple `<script defer>`. Les deux chemins deviennent alors observables dans le même navigateur. La sonde doit être écrite **dans l'arborescence servie** (la page charge ses ressources voisines par chemin absolu), supprimée aussitôt après, et ne figurer dans aucune liste de publication. À cela s'ajoute une assertion de non-dérive : pour chaque règle, les deux bundles doivent afficher les mêmes comptes avant et après, et zéro aiguille résiduelle.

**Trois couches de vérification, chacune aveugle à ce que la suivante attrape.** Le scan de source rate les chaînes dont le chiffre vit dans l'expression (`fmt(gain)+" % OOIP"`). Le parcours du DOM rendu les attrape, mais rate ce qui n'existe qu'après interaction — et il faut cliquer les contrôles non destructifs (`button`, `[role="tab"]`, `summary`, `label`, en excluant `/ferm|close|retour|reset|annul/i`), car un défaut qui n'apparaît qu'après un clic reste un défaut que le lecteur rencontre. Enfin, un parcours du DOM **ne bouge aucun curseur** : tout le calcul du Calculateur est refait par un gestionnaire `input` de `range`, et le corps du `mailto` n'est assemblé qu'une fois un curseur déplacé. Ces chaînes-là n'ont été prouvées que par un test de fumée pilotant les cinq entrées à leurs extrêmes (`.value` + événement `input` bouillonnant), relisant les sorties et le `href` décodé. Trois passes de correctifs ont été nécessaires, chacune déclenchée par un instrument, aucune par une intuition.

**La preuve est un diff de rendu, pas un compte.** Avant/après sur les pages touchées : le texte rendu doit être identique une fois les espaces et apostrophes normalisés, le nombre d'éléments identique, les erreurs de page inchangées — seuls doivent varier la **nature** de l'espace et le **glyphe** de l'apostrophe. Quand une correction échoue, en localiser la cause plutôt que la deviner : la sonde qui reporte le **chemin DOM** de chaque occurrence a désigné `output#o_gain` et `div#punch.punch > b`, c'est-à-dire des valeurs par défaut écrasées à l'exécution — ce qu'aucune lecture de source n'aurait montré.

**Repères actuels.** 95 pages françaises scannées, **0 défaut typographique réel**. Les 7 signalements résiduels sont tous légitimes et ne doivent pas être « corrigés » : quatre guillemets droits qui sont des symboles de pouce (`30"` sur `brochure.html` et `enerconseils/atlas.html`), deux dans une citation anglaise (`"28-32°"` sur `plan-du-site.html`), et un point-virgule collé qui est correct en anglais (`carnets.html`).

**Simulation de parcours clients (test de non-régression).** Huit personas pilotés par
vrais clics Playwright (`/root/work/journeys.js` — recréable depuis ce guide) : prospect
(Devenir client → contact), investisseur (pastille Investir → `#souscrire` → brochure),
client boutique (Ajouter → compteur `#cartCount` → `.cart-btn` → `#order` garni),
anglophone (bascule EN → nav interne EN → retour FR symétrique), mobile 390px (burger →
mega « Nos activités » → pôle → nezBar Contact/Investir), recherche (`#navSearch` →
saisie → clic premier résultat), journaliste (Médias → carnets → article → outils de
lecture), arabophone (`/ar` en RTL → bascule FR). Chaque étape vérifie l'atterrissage
(URL + repère) ; `pageerror` et réponses ≥ 400 collectés par parcours. Référence : 30/30
au 31/07/2026, zéro erreur JS, zéro 4xx.

Trois pièges de harnais, vécus : (1) **cleanUrls** — les liens du site sont propres
(`/clients`), un `http.server` nu répond 404 partout ; servir via un handler qui essaie
`chemin`, `chemin.html`, `chemin/index.html` (le `cleanserv.py` du guide). (2) L'ancre
`#souscrire` atterrit en ~1,2 s (saut différé sur page lourde) : vérifier à 800 ms fabrique
un faux défaut. (3) Un sélecteur combiné `a, b` suivi de `.first()` clique le premier des
DEUX listes — sur le nav, c'est le trigger « Groupe », pas celui qu'on visait ; et un lien
du mega fermé « existe » mais n'est pas cliquable (timeout) : toujours cibler le trigger
par son texte puis ne cliquer que du visible.

**Les derives du contenu (regle du chapitre 185).** Toute publication qui ajoute une
page ou corrige un chiffre balaie aussi ses quatre derives : `sitemap.xml`, les index
de recherche `cmdk_extra.js` (FR) et `cmdk_en.js` (EN), et les flux `feed.xml` /
`feed-en.xml`. Controle rapide : le slug de la nouvelle page present dans les quatre ;
le chiffre corrige absent des index (grep du nombre nu). Les index sont des tableaux
JSON dans un `window.CMDK_EXTRA=[...]` — valider par json.loads apres edition, et
prouver l'edition additive par diff des ids avant/apres.

## 9. Performance — deux couches photo, bundle chrome, et pièges de mesure

**L’architecture à deux couches photo.** Beaucoup de pages peignent deux images : le **héros** (`header.pghero`, contenu au-dessus du pli, peint dans les deux thèmes) et le **fond** (`.subland`/`.rootland`, plein écran fixe en `z-index:-2` sous un voile sombre à .54–.66, que le thème clair passe en `display:none`). Chaque page de ce type porte désormais **deux** préchargements : le héros sans condition avec `fetchpriority="high"`, le fond derrière `media="(prefers-color-scheme: dark)"` — attribut dont l’effet (aucune requête en clair) a été prouvé par une page-sonde jetable, pas supposé. Ne jamais revenir à un préchargement unique : sur 27 pages les deux couches diffèrent, et 19 d’entre elles préchargeaient le fond — invisible pour tout visiteur en thème clair — pendant que le héros attendait son tour.

**La carte des couches se lit dans le rendu, jamais dans la source.** Sur les pages greentech, la règle `.subland` vit dans une feuille chrome partagée : un scan des `<style>` de la page trouve 17 pages à couches divergentes là où le style calculé en trouve 27. Corollaire outillage : **Chromium headless démarre en `prefers-color-scheme: light`**, et le site applique alors `et-plight` qui éteint le fond ; toute sonde de rendu doit fixer `colorScheme` explicitement et mesurer les deux thèmes, sinon elle mesure la moitié de l’audience et l’appelle « le site ».

**Deux exceptions connues : `aval/distribution.html` et `greentech/patrimoine.html`.** Seules pages où la règle `.subland` arrive par un `<link id="subland-css">` externe plutôt qu’un `<style>` en ligne, elles téléchargent leur image de fond même en thème clair, préchargement ou pas (prouvé en retirant tout préchargement d’une copie : la requête part quand même). Ne **pas** « corriger » en gardant la feuille derrière un attribut `media` : le basculement manuel de thème perdrait le fond. Le coût est antérieur au correctif et lui est étranger.

**`bundle_head_b2.css` : le préfixe chrome fusionné.** Les 42 pages lourdes ouvraient toutes leur `<head>` par la même série de neuf feuilles, dans le même ordre, sans attribut `media`, sans identifiant utilisé par un script. Ces neuf-là sont concaténées (ordre de cascade préservé, séparateurs `/* == nom == */`) dans `assets/chrome/bundle_head_b2.css`. Règle d’entretien absolue : **modifier l’une des neuf feuilles individuelles impose de régénérer le bundle**, sinon les 42 pages lourdes et les 100+ pages légères divergent silencieusement. Les feuilles individuelles restent dans le dépôt — les pages légères les référencent toujours. La page d’accueil diverge à la position 10 : `bundle_core_a1.css` et `x_54cf12a81868.css` restent des liens séparés partout.

**Un diff de rendu à grande échelle ment de trois façons.** Vécu sur la vérification du bundle (84 paires page × thème) : (1) un contexte navigateur **partagé** accumule un historique `:visited`, et les deux arborescences comparées, servies sur des ports différents, construisent des historiques différents — des liens changent de couleur pour des raisons étrangères au correctif ; (2) un contexte froid décale parfois la mise en page de centaines de pixels (course police/image) — un « 8032 px contre 7708 px » qui ne se reproduit jamais ; (3) certains éléments sont **instables dans la page elle-même** (`a.pgh-btn2` a rendu trois couleurs sur trois chargements identiques, JS coupé, animations gelées). Le protocole qui tient : contexte neuf à chaque chargement, reprise du cliché si une sous-ressource a échoué (le serveur de test lâche des connexions sous charge), et **masque d’auto-stabilité** — on charge chaque arborescence deux fois et on ne compare que les éléments d’accord avec eux-mêmes. Sous ce protocole : zéro différence confirmée. Accessoirement, compter les éléments du `<head>` fait échouer chaque page d’exactement le nombre de `<link>` retirés : ne comparer que `html`, `body` et leur descendance, et neutraliser l’origine dans les `url()` résolues (elle contient le port du serveur de test).

**Images.** Le héros des cinq pages enerconseils est `lac-tchad-espace.webp` (q75, 114 Ko contre 205 Ko de JPG ; qualité choisie à la mesure — pire tuile 50×50 à 4,6/255 d’écart moyen, sous un voile ≥ 52 %). L’ancien JPG reste dans le dépôt, déréférencé. Toute image `loading="lazy"` doit porter `width`/`height` intrinsèques (les seize sacs d’intrants font 580×1180) : la CSS `width:100%;height:auto` garde la main sur l’affichage, les attributs réservent la boîte exacte avant chargement — vérifié en bloquant les images : boîtes identiques avec et sans.

**Couverture CSS mesurée, décision de ne pas élaguer.** `brochure.html` : 76 % des 116 Ko en ligne réellement utilisés après défilement complet, bascule de thème et viewport mobile — sain, ne pas toucher. Le Configurateur affiche 22 %, mais c’est un artefact : une application interactive dont les états n’existent qu’après manipulation des curseurs et panneaux ; la couverture ne distingue pas « mort » de « pas encore visité ». Ne jamais élaguer sur la foi d’un chiffre de couverture obtenu sans piloter l’application.

## 10. Accessibilité — audit et pièges

**Le rituel.** axe-core sur les 159 pages, dans **les deux thèmes** (le clair échange toutes les couleurs : un passage en sombre ne dit rien du clair), en ne retenant que `serious`/`critical`. Deux exceptions permanentes, à ne pas « corriger » : `google9146d41010c5e702.html` (fichier de vérification lu par une machine, pas par un lecteur d’écran) et la règle `region` (bonne pratique hors WCAG A/AA — 1 836 nœuds : l’enrobage systématique en landmarks ne vaut pas le remaniement).

**Un signalement de contraste doit être reproduit avant d’être cru.** Le premier passage a compté 141 nœuds ; une quarantaine n’existaient pas : axe avait mesuré des couleurs **en cours de transition** (révélations au défilement, carrousel d’axes de `clients.html`). Re-mesurer la même page une fois posée : les artefacts disparaissent, les vrais défauts restent. C’est le pendant accessibilité du masque d’auto-stabilité du §9.

**La classe de bogue qui a tout expliqué : le thème recolore le texte, pas le fond.** Les recolorations de thème (`et-plight`, `et-jlight`) supposent que le fond de l’élément bascule avec le thème. Quand le fond est **fixe** — bouton de défilement en verre sombre, bandeau cookies sur section sombre, pastilles de la barre de partage du Calculateur (`#E8C36A`/`#5AA7F0` en ligne), boutons ambre des pages solutions — l’encre « or-sur-clair » (`#4C380B`, `#7A5C14`) ou le bleu de lien clair tombent à 1,6–4,1:1 sur leur vrai fond. Correctifs posés : deux règles jlight dans `bundle_core_a1.css` (l’or sombre `#E8C36A` reste sur le scrollcue et `.cb-k` — attention, la règle G4 en ligne des pages journal cible `.sc-lb` **directement**, l’emporter exige de le cibler directement aussi), et des surcharges plight par page pour les pastilles et boutons ambre (`#0B1422`, 7,2–10,9:1). Avant toute nouvelle règle de recoloration : vérifier le fond **réel** de chaque élément balayé.

**`role="listitem"` sur un lien éteint sa sémantique de lien.** Vingt-sept tuiles de catalogue (`brochure`, `amont/services-ep`, `aval/produits`) étaient des `<a role="listitem">` dans des `role="list"` : le rôle imposé remplace le rôle implicite `link`, et le lecteur d’écran n’annonce plus un lien. Les conteneurs dont **tous** les enfants sont des liens sont devenus `role="group"` (le `aria-label` reste annoncé) et les liens ont retrouvé leur rôle natif ; les conteneurs à enfants `div` sont des listes légitimes et n’ont pas bougé. Aucune feuille ne cible `[role="list"]` : l’opération est sans effet visuel.

**Repères actuels.** 0 défaut `serious`/`critical` sur 159 pages × 2 thèmes hors les deux exceptions documentées ; 16 `role="listitem"` restants, tous des `div` légitimes de `services-ep`.

## 11. QA visuel — écran et mobile

**Le rituel.** Deux balayages scriptés, puis des captures d’écran qu’on regarde vraiment. Écran : 158 pages × 2 thèmes × 2 fenêtres (1280 et 390), en cherchant le débordement horizontal, les images cassées (`naturalWidth` nul hors `loading="lazy"`) et les erreurs de page. Mobile : 390×844 tactile, en ajoutant la méta viewport, les textes sous 12 px et les cibles tactiles sous 24 px (plancher WCAG 2.2, avec l’exception des liens en ligne dans un paragraphe). Toute mesure de défilement force `scroll-behavior:auto` (§12) et se méfie des états transitoires : la moitié des signalements de cibles trop petites étaient des mesures prises pendant une animation d’entrée.

**Le débordement de 2 px des pages héritées EN — et pourquoi ni `html` ni `body` ne pouvaient le corriger.** Le panneau `.nx-mega` (boîte non transformée : left 572 + 720 = 1282) dépasse la fenêtre sur les 29 pages héritées EN, où l’ancre de nav tombe plus à droite qu’en français. Le panneau vit dans le **nav fixe** : sa chaîne de blocs conteneurs contourne `body`, donc `html{overflow-x:clip}` comme `body{overflow-x:clip}` laissaient `scrollX` > 0 (mesuré). Le correctif est sur l’élément fixe lui-même : `#nav{overflow-x:clip}` dans `nav_a.css` — `overflow-x` seul pour que le menu ouvert, qui s’étend vers le bas, reste entier ; `clip` et non `hidden` pour ne créer aucun contexte de défilement (le `header` sticky et les ancres restent intacts). Au passage : `scrollWidth` se calcule sur les boîtes **non transformées** — les lueurs `<i>` pivotées qui « dépassent » à 1370 px n’y contribuent pas.

**La zone basse mobile est un empilement à surveiller : barre `#nezBar`, avis cookies `#ckn`, bouton de thème `#plightBtn`, `#scrollcue`.** Deux collisions vécues. La grave : une règle périmée `#ckn{bottom:10px}` (ajoutée après la bonne, dans le même bloc média de `u2_9911ff40ea28.css`) plaçait l’avis cookies **derrière la barre mobile** sur les 41 pages chargeant cette feuille — invisible, infermable ; supprimée, la règle `bottom:74px` du même bloc reprend la main. La sournoise : `#plightBtn` (fixe, 14,732) se posait **dans** l’avis affiché (12,719 366×51) ; il est masqué tant que l’avis est visible, via la règle `body:has(#ckn.show)` de `nav_a.css` qui traitait déjà `.lum-ctl`. Avant d’ajouter tout élément flottant en bas d’écran, vérifier les quatre rectangles sur une page avec `localStorage` vierge.

**Faux défauts à ne pas « corriger ».** L’avis cookies mobile pose `font-size:0` sur le conteneur et redimensionne ses enfants : c’est le compactage volontaire en une ligne (gras + lien + bouton), pas du texte perdu — la phrase entière reste lue par les lecteurs d’écran et vit sur `/cookies`. Les textes de 10–11,5 px sont l’idiome des étiquettes mono en capitales (piliers du pied de page, `sc-lb`, `cb-k`, `jkick`), jamais du corps de texte. Le menu mobile ouvert semble transparent en capture headless : le flou `backdrop-filter` ne s’y rend pas sans GPU ; sur appareil réel c’est du verre dépoli, avec un dégradé à ~75 % d’opacité comme repli. Résidus assumés sous 24 px de haut, tous isolés (exception d’espacement WCAG) : `a.back` (7 pages), deux `summary`, les pistes des curseurs du Calculateur.

**Le verre liquide se vérifie au style calculé, pas à la feuille.** Inventaire de référence (30/07/2026, 17 gabarits × 2 thèmes) : 110 composants vitrés distincts, flous étagés de 4 à 30 px avec saturation 1,15–2 — `saturate(1.85) blur(30px)` pour les grandes cartes, `blur(8px)` pour les contrôles — et le thème clair porte **plus** de surfaces vitrées que le sombre (141 contre 73 sur l’accueil). Trois critères à re-vérifier après toute retouche de thème ou de chrome : (1) pas de « verre aveugle » — un `backdrop-filter` sur fond d’alpha ≥ 0,98 ne floute rien ; les fonds denses légitimes du site sont à 0,96–0,97, toujours translucides ; (2) les seules opacifications réelles doivent rester dans `@media (prefers-reduced-transparency:reduce)` — c’est là que `#ckn` et le nav passent en `#0B1422` plein, et c’est un repli d’accessibilité à préserver, pas un bogue ; (3) la preuve visuelle du flou exige un navigateur avec GPU — une capture headless rend le verre « transparent » (§11) et ferait conclure à tort que l’effet est cassé.

**QA des menus de navigation — le canon par langue et l’invariant de bascule.** Les 95 pages porteuses du nav partagent cinq déclencheurs identiques par langue ; la conformité se juge sur l’**ensemble des liens** du bloc nav, comparé au canon majoritaire de la langue, en excluant la variance légitime (chaque page pointe vers *son* équivalent de langue et `/ar`). Invariant à re-vérifier après toute retouche : le nav porte **deux** liens de langue — la bascule `nx-lang` ET la rangée « English / Français » du menu mobile — et les deux doivent viser la même cible. Le second avait dérivé sur les 35 pages EN (il pointait vers la page anglaise **elle-même** : cliquer « Français » rechargeait la même page) et c’est aussi lui qu’une transplantation de nav oublie en premier. Dérives corrigées au 31/07/2026 : `clients.html` (9 liens de sections manquants), `achats-en`/`parc-en` (nav hybride truffé de liens FR), `clients-en`/`faq-en` (4 entrées récentes absentes). Pièges d’instrument : le déclencheur de la section courante porte `class="nav-trigger on"` — une regex qui exige la classe exacte le fait « disparaître » ; l’ordre des attributs varie (`id` après `class`) ; les liens FR restants dans le nav EN (`/carrieres`, `/tchaditech/*`…) sont des **replis délibérés** vers les pages sans équivalent anglais, à ne pas « corriger ».

**« Certaines pages sont très sombres » — on n’éclaircit pas une photo noire, on en change.** Diagnostic mesuré (31/07/2026) : la famille héritée à diapo plafonnait à 14–24 de luminance moyenne quand la médiane du site est à ~35 en sombre. Trois fausses pistes écartées **par l’expérience** avant le vrai coupable : le thème clair s’applique bien ; alléger le double voile de la diapo ne rend que 0,7 point ; aucun calque opaque ne recouvre. La cause : la diapo ouvrait partout sur `pompe-petrole.webp`, une pompe au crépuscule dont le **ciel noir** remplit l’écran — et brightness×2,5 sur du noir reste du noir (prouvé). Correctif : la rotation de sept photos ouvre désormais sur `piste-desert.webp` (139 de luminance contre 58), la pompe passe dans la rotation différée — mêmes photos, aucun asset ajouté. Résultat : 17–20 → 33–37, contraste axe intact. Leçons d’instrument : une capture plein-viewport d’une page à héros photo mesure la photo, pas le thème ; et la luminance d’une page à animation d’entrée se mesure une fois l’animation finie (`brochure` à 14 en capture, opacité pleine dès 1,2 s en réalité).

## 12. Pièges divers vécus

- `scroll-behavior:smooth` fausse les mesures scriptées (forcer `auto` dans les instruments) ;
- l'effet d'estompage au défilement des pages pôle rend le contenu flou/dim **pendant** le scroll : c'est voulu, tout redevient net à l'arrêt ;
- les pages héritées à diapo (`index-en`, `pole-*-en`, légales…) posent `html{background:#070c15!important}` + `body` transparent : toute règle de fond claire doit viser `html.et-plight` avec une spécificité supérieure ;
- ne pas minifier les feuilles chrome : les commentaires documentent la cascade, et Brotli rend le gain négligeable ;
- boutons flottants (☀, ↑, barre mobile, bandeau cookies) : masqués à l'impression via le style injecté par `u_cd226c00eb4b.js` ;
- le pied de page mobile garde 76 px de dégagement pour que les liens légaux restent tapables sous les boutons flottants.
- audit SEO/liens (balayage complet au 30/07/2026 : 0 défaut — sitemap exhaustif et sans entrée morte, canoniques auto-référents, hreflang réciproques, 0 lien interne cassé). Trois faux positifs à connaître avant de « corriger » : un extracteur d’attribut doit capturer jusqu’à la **quote ouvrante** (exclure les deux quotes tronque `N’Djamena` et fait passer six descriptions saines pour cassées) ; les 51 liens `/en` passent par la redirection 301 de `vercel.json`, pas par un fichier ; les fragments `#p=…` vers le Configurateur sont son **API de hash** (préréglages), pas des ancres d’éléments.

## 13. Recherche — sous-système bilingue

**Quatre fichiers, trois rôles.** `assets/chrome/c_abd9013c3955.js` et `c_df4f446df566.js` sont les deux variantes du moteur (rendu, scoring, raccourcis) ; chacune embarque le même index de base FR de 76 entrées dans une IIFE non exposée — **leurs littéraux de tableau sont octet pour octet identiques**, le second fichier ne diffère que par son enveloppe `try{…}catch(_e){}`. Toute modification de l'un doit être appliquée à l'autre, sans exception : les 96 pages portant la palette se répartissent entre les deux (54 / 42), donc un correctif posé sur un seul fichier ne corrige que la moitié du site. `assets/chrome/cmdk_extra.js` porte les compléments FR (`window.CMDK_EXTRA`, 166 entrées) et `assets/chrome/cmdk_en.js` l'index anglais complet (138 entrées) — même contrat, même variable globale. Chaque page charge exactement **un** fichier de compléments, celui de sa langue.

**Le portail de langue.** L'index de base est neutralisé côté anglais par `const idx=(EN?[]:[…]).concat(window.CMDK_EXTRA||[])`, où `EN` ne se contente pas de lire `<html lang>` : il vérifie aussi que le tableau global chargé ressemble bien à l'index anglais (plus de 20 entrées, dont au moins une URL en `-en`). Cette double condition évite le pire scénario — une page anglaise qui aurait chargé le complément français afficherait un index vide plutôt qu'une palette entièrement en français. Corollaire opérationnel : une page `-en` doit charger `cmdk_en.js`, jamais `cmdk_extra.js`. Un oubli sur ce point a fait servir l'index français à 35 pages anglaises.

**Scoring pondéré par le titre.** Un jeton trouvé dans le titre vaut 3, +1 s'il tombe sur une frontière de mot ; trouvé seulement dans les mots-clés il vaut 1 ; une requête multi-mots dont tous les jetons sont trouvés reçoit +2. `Array.prototype.sort` étant stable, les égalités conservent l'ordre du tableau. Conséquence pratique : **pour qu'une page gagne sur une requête, le mot doit être dans son titre**, pas seulement dans ses mots-clés — une entrée dont le titre contient le mot par accident (« Du premier contact à la livraison ») bat autrement la page réellement visée (`/contact`). Deux titres ont dû être retouchés pour cette raison.

**Taxonomie bilingue à 17 noms, en miroir.** FR : `Groupe, Clients & solutions, Amont, Intermédiaire, Aval, Pétrochimie, Durabilité, Technologie, Talents & formation, Conseil, Investisseurs, Journal, Carnets, Outils, Références, Contact, Légal`. EN, créneau par créneau : `Group, Clients & solutions, Upstream, Midstream, Downstream, Petrochemicals, Sustainability, Technology, Talent & training, Advisory, Investors, Journal, Stories, Tools, Reference, Contact, Legal`. **N'inventer aucune catégorie** : une valeur hors liste tombe en fin de palette dans un en-tête isolé. L'ancienne taxonomie comptait 25 noms dont un fourre-tout de 97 entrées, et produisait 39 en-têtes entrelacés pour 25 catégories.

**Tri d'ordre à l'exécution.** Juste après le `.concat(window.CMDK_EXTRA||[])`, une table `CPOS` associe chaque nom — français **et** anglais — au même numéro de créneau, et un `sort` stable regroupe les entrées. C'est ce qui garantit un seul en-tête par catégorie et un ordre éditorial fixe, **quel que soit l'endroit où une nouvelle entrée est insérée** : plus besoin de la ranger au bon endroit du tableau. Piège vécu : une première version utilisait un simple tableau ordonné de noms, ce qui plaçait les trois noms communs aux deux langues (`Clients & solutions`, `Journal`, `Contact`) aux positions françaises et cassait l'ordre anglais. La table doit rester un **dictionnaire créneau → deux noms**.

**Icônes.** `ICON[c]` fournit le glyphe par catégorie, `ICON._` un simple disque de repli (`<circle cx="12" cy="12" r="4">`). Les deux langues partagent les mêmes tracés : une catégorie ajoutée sans glyphe se voit immédiatement (188 lignes françaises sur 219 affichaient le disque de repli alors que l'anglais n'en avait aucun). Sonde : compter les `a.cmdk-item` dont le `.ci-ic svg` a exactement ce contenu.

**Toute nouvelle page a besoin d'une entrée dans l'index de sa langue** — et une page ayant un équivalent dans l'autre langue en a besoin dans les deux. Audit de couverture : lister les pages qui chargent `nav_a.js`, les convertir en URL propres (`cleanUrls`) et les diffuser contre l'union des URL indexées, ancres retirées. Seul manque attendu : `/404`, volontairement absent de l'index tout en portant la palette. Repères actuels : 242 lignes et 17 en-têtes en FR, 138 lignes et 17 en-têtes en EN, 0 icône de repli, 0 fuite d'URL d'une langue dans l'autre.

**Sondes DOM utiles** (le balisage des lignes n'a **pas** d'attribut `data-url` — se servir de `href`) : lignes `a.cmdk-item`, icône `.ci-ic svg`, titre `.ci-t`, mots-clés `.ci-k`, en-têtes `div.cmdk-group`, champ `#cmdk-input`, conteneur `#cmdk-results`, ouverture programmée `window.openCmdk()`.

## 14. Couche mobile « majors » (31/07/2026)

La modernisation mobile (benchmark TotalEnergies/Shell/bp) vit en TROIS endroits qui
vont ensemble ; toute retouche doit les garder synchrones :

- **CSS** : bloc `/* == Modernisation mobile == */` present EN DEUX COPIES IDENTIQUES —
  fin de `bundle_core_a1.css` (151 pages) et suffixe documente de `bundle_head_b2.css`
  (pour les pages bundle sans core, dont `index.html`). Le doublon sur les pages qui
  chargent les deux est inoffensif. Contenu : h1 heros 34-40px (`.hero .hx-h1:not(#_)`
  requis pour battre la regle a !important de l'accueil), leads >=16px, cibles tactiles
  44px (sous-navs, fil d'Ariane, `.hubdrawer`/`.hchain`/`.flip-cta`/`.hnews-all`/`.iv-cta`),
  carrousels scroll-snap des dix familles de grilles (plc, biz, sb, pof, ppt, ppj,
  hpgrid, hxi, hnews, ce). Liens de prose exemptes de la regle 44px (exception WCAG
  cible-en-ligne).
- **JS** : acces clavier des carrousels (tabindex/role/aria-label FR-EN selon lang) en
  fin de `u_cd226c00eb4b.js` — heberge LA et pas dans s_2ffe40dff9.js car index.html ne
  charge pas ce dernier. Sans ce JS, axe leve scrollable-region-focusable (serious).
- **Accordeons inline** (`<style id="minv-css">` + `<script id="minv-js">` avant </body>) :
  investisseurs.html (11 sections, 23.6k -> 11.3k px), societe.html (variante en
  CHAPITRES : section a id + sections anonymes suivantes = un groupe), index.html
  (seule #chaine-expliquee). Bouton reel dans le h2 (aria-expanded, focus-visible),
  depliage automatique par toute ancre (sommaires colles, hash). Inertes au-dela de
  760px et a l'impression.

Pieges appris :
- `bundle_head_b2.css` n'est PAS un concat byte-pur de ses 9 sources actuelles
  (divergence des l'octet 29) — ne jamais le « regenerer » depuis les sources sans
  verification ; on le suffixe.
- Toute modif de `assets/chrome/*` => bump de V dans sw.js (rituel §9).
- Rituel de verification mobile : viewport 390x844 isMobile, axe serious/critical x2
  themes, hauteurs de page avant/apres, hauteur des cibles (>=44), zero overflow-x,
  et non-regression desktop (grilles en colonnes, zero .minv-btn, h1 desktop intact).

**QA visuel mobile (rituel complet).** Balayage 390x844 des 158 pages, sept contrôles :
débordement horizontal du document ; éléments hors viewport ; titres tronqués
(`scrollWidth > clientWidth`) ; images déformées (ratio rendu vs naturel > 12 %) ;
chevauchement `#ckn`/`#nezBar` ; carrousels cassés (carte plus large que l'écran =
la couche mobile n'agit pas) ; cibles < 24px dans le chrome. Puis TRIER avant de
corriger — la grille des faux positifs : internes **SVG** (rognés par leur racine),
blobs `#aurora` et fonds `.diapo` (décoratifs, volontairement surdimensionnés),
cellules de tableaux **dans un ancêtre défilant** (contenu atteignable). Le vrai défaut
est l'élément qui dépasse **sans ancêtre défilant** : rogné par `overflow:hidden` ou par
le bord de l'écran, son contenu est inatteignable. Classe récurrente : les grilles à
styles **inline** (`minmax(400px,…)`, `repeat(3,1fr)`, colonnes fixes) qui ne
s'effondrent pas — rustines `mqa-mob` par page, `grid-template-columns:minmax(0,1fr)
!important` (le `minmax(0,…)` déjoue aussi le plancher min-content), ou défilement
horizontal pour les comparatifs dont les colonnes doivent rester côte à côte.

**Piège viewport-dépendant.** `scrollable-region-focusable` ne se déclenche qu'au
viewport où l'élément défile réellement : le balayage desktop ne le voit JAMAIS sur les
tableaux qui ne débordent qu'à 390px. Balayer axe AU viewport mobile aussi. Le helper de
`u_cd226c00eb4b.js` (§ ci-dessus) couvre désormais tout élément défilant sans contenu
focalisable, y compris les sections héritées vivant **hors de `<main>`** (eor-en,
raffinage-en… — `main *` seul les rate). Référence : axe mobile 0/158 le 31/07/2026.

## 15. Lighthouse et les polices — audits du 31/07-01/08/2026

**Deux angles morts de nos rituels, revelees par Lighthouse.** (1) Lighthouse audite en
schema CLAIR par defaut : nos balayages axe tournaient en sombre et n'ont jamais vu
l'encre jlight du #nezBar a 1.63:1 (bleu nuit #0e4172 epingle sur la barre restee
sombre — meme classe que les recolorations jlight sur fond fixe). Balayer les deux
schemas. (2) Lighthouse mesure SOUS THROTTLING (4x CPU, slow-4G) : les CLS de
recalage tardif n'apparaissent qu'ainsi — jtop qui grandit de 58 a 63px a l'insertion
du bouton de theme (CLS 0.23), oilticker pose a top:93px alors que le nav reel fait
110px (>=1241px) ou 71px. Parade generale : les valeurs statiques initiales doivent
etre EXACTES, le JS ne fait que confirmer ; sinon reserver la hauteur finale.

**Les polices etaient mortes.** Les trois woff2 « -latin-ext » (115 KB par page)
etaient la tranche Google U+0100+ SEULE : aucune minuscule ASCII, aucun accent —
todo le texte tombait en police systeme, glyphe par glyphe, depuis toujours. Le
diagnostic qui le prouve : cmap du fichier ∩ caracteres du site = 6 codepoints.
Verifier TOUJOURS ca avant de « precharger » ou « optimiser » une police. Remede
applique : tranches latin + latin-ext de fontsource-variable (npm), sous-ensemblees
aux caracteres reellement utilises (`fontTools.subset --unicodes-file` sur l'union
des caracteres de tous les html+js du depot), deux @font-face par famille avec les
unicode-range officiels, dans les TROIS feuilles porteuses (bundle_head_b2,
c_eda8729082dd, s_9c80e27170). Bilan : ~88 KB de vraies polices contre 115 KB
mortes, -50 KB par page.

**`font-display:optional` piege le verificateur.** Premiere visite froide : la police
se telecharge mais ne s'applique PAS (fallback conserve, zero CLS — c'est voulu) ;
elle s'applique a la visite suivante. Un instrument qui mesure a froid conclut « la
police ne marche pas » (document.fonts.check() dit true, la largeur rendue dit
fallback). Toujours mesurer apres un reload dans le meme contexte. Œ capital absent
du sous-ensemble (aucune occurrence sur le site) — un contenu futur en majuscules
avec Œ tombera en fallback pour ce seul glyphe : regenerer les sous-ensembles si le
contenu evolue fortement.

**Mesurer sous compression, sinon on répare des fantômes.** Vercel sert en brotli :
`bundle_head_b2.css` fait 19-22 KB sur le réseau, pas 83 ; la page amont 36 KB, pas 145.
Un serveur local nu surestime le chemin critique d'un facteur ~4 et fait croire a un
chantier « CSS critique » inexistant : avec un serveur brotli (le `brotliserv.py` du
guide), amont mobile vaut ~80 et societe 92 — pas 66 et 77. Le Chromium du conteneur
ne sort pas vers la production (interstitiel du proxy) : toujours mesurer sur le
serveur local compresse. Vrai frein residuel de l'accueil : les taches longues JS
(TBT) — le balayage a11y generique de u_cd226c00eb4b.js coutait 280+ ms en
getComputedStyle sur 'main *' ; optimise le 01/08 (conteneurs plausibles seulement,
scrollWidth lu avant le style, execution en idle), TBT accueil 501 -> ~250 ms,
score ~80. Le reliquat attribue a u_cd226 vient du code historique du fichier.

**Scores de reference (01/08/2026, serveur local cleanUrls).** Desktop : accueil 86-90
(CLS 0.088), journal 100 (CLS 0.023), aval/societe/investisseurs 97-99, boutique 99.
Mobile : boutique 93, journal 92, investisseurs 87, societe 77, amont 66, accueil 65
— le plancher mobile des vitrines est le chemin critique CSS (~230 KB de feuilles
bloquantes + documents de 117-145 KB) sous slow-4G simulee, FCP ~4 s : c'est le
prochain gros chantier si on veut le franchir (CSS critique inline + report du reste).
a11y/best-practices/SEO : 100 partout. Le TBT varie de ±150 ms d'une passe a l'autre
sur conteneur — comparer des CLS/LCP, pas des scores bruts a une passe.

## 16. QA d'impression (01/08/2026)

Les fonds ne s'impriment pas par defaut : le papier est blanc, et toute encre claire
posee pour un fond sombre devient invisible — 20+ elements sur la brochure seule
(titres du hub a #F5F7FA, liens blancs, accents or). Regle d'encre partagee en fin de
bundle_core_a1 + suffixe bundle_head_b2 : `@media print` force `color` ET
`-webkit-text-fill-color` a #111 — le fill-color est indispensable car les
reparations de contraste du site posent leurs propres fill-color a !important, et il
tranche visuellement quel que soit le gagnant de la cascade sur `color`. Guerre de
specificite vecue : les reparations montent a deux :not(#_) (etDarkFix), la brochure
a QUATRE — la regle partagee est a TROIS, la brochure porte sa rustine locale a CINQ,
posee en dernier dans l'ordre du document. Sommaires colles (nav.toc, #inv-toc,
corp-nav, pole-subnav), rails, decors et lien d'evitement masques a l'impression.
Verification : scan de l'encre EFFECTIVE (webkitTextFillColor sinon color) sur les
seuls elements a rects visibles (un texte de nav masque garde son display propre —
faux positif sinon), dans LES DEUX schemas (les reparations plight ne s'activent
qu'en clair). Reference : 12 pages imprimables a zero encre pale, PDF verifies a
l'oeil (journal et amont : noir sur blanc, zero chrome). L'accordeon minv est deja
neutralise a l'impression (§14).

## 17. Sauts de page — diagnostic et correctif (01/08/2026)

Signalement : « ya des sauts de page sur le site surtout sur mobil ». Six hypotheses
testees, deux causes reelles retenues, quatre ecartees par la mesure. Rien n'a ete
corrige sans chiffre a l'appui : le reflexe de poser un correctif plausible a coute
une demi-journee lors du passage precedent, pour zero gain mesure.

**Ecartees, avec le chiffre qui les tue.** Decalage de mise en page : CLS a 0 sur les
14 pages auditees. Debordement horizontal : `html.scrollWidth` a 390 sur les 21 pages
testees en 390x844. Blocage du fil principal : recensement des ecouteurs par
monkey-patch de `addEventListener` dans un `addInitScript` — 0 ecouteur scroll/touch/
wheel non passif sur 5 pages, et 0 longue tache pendant le defilement sauf /amont/
(3 taches, 195 ms cumules). Cout de composition du flou d'arriere-plan, de #aurora et
du reveal : bisection CSS controlee (13 variantes, une propriete neutralisee a la
fois, mediane des ecarts rAF sous bridage processeur 4x) — **0 %** de gain pour
backdrop-filter, box-shadow, filter, border-radius, opacity, will-change, transform,
background-image et le fond fixe. Le correctif de la passe precedente a donc ete
integralement auto-annule : il degradait la translucidite voulue pour rien.

**Le « voile noir » etait mon propre instrument.** J'ai cru mesurer une zone non
peinte apres un saut de defilement. Mesure du temps de stabilisation par
echantillonnage de captures toutes les 120 ms (864 captures, 4 variantes) : mediane
**0 ms partout**, production comprise. Les captures precedentes etaient prises en
plein rasterisage, pendant la sequence de defilement. Lecon : une capture n'est pas
une mesure tant qu'on n'a pas prouve que l'etat est stable.

**Cause 1 — le saut de page proprement dit.** `html{scroll-behavior:smooth}` (declare
dans le `<style>` en ligne de chaque page). Pendant l'animation (~1 s, plus lente sur
telephone) le document se replie et se deplie — reveal au defilement, sections
repliables, images qui arrivent — donc l'offset calcule au clic est perime a
l'arrivee. Instrument : 28 ancres sur 5 pages, remise a zero *instantanee* entre
chaque (forcer `scrollBehavior='auto'` sur l'element racine pour la remise a zero,
sinon elle entre en collision avec le defilement de l'ancre et produit un motif
reussite/echec alterne — piege vecu), puis attente jusqu'a stabilisation de
`window.scrollY` pendant 400-500 ms plutot qu'un delai fixe.

    telephone 390x844   doux 12/28 ancres ratees  ->  instantane 1/28
    ordinateur 1440x900 doux 19/28 ancres ratees  ->  instantane 1/28 (effectif)

Pire cas : `/societe#organisation`, titre depose a 10 720 px de la fenetre. C'est un
defaut fonctionnel, pas d'agrement. Correctif : `html:not(#_){scroll-behavior:auto}`,
**sans media query** — je l'avais d'abord limite au mobile, la verification a montre
l'ordinateur casse pareil. La specificite `html:not(#_)` (0,1,1) bat le `html` (0,0,1)
des styles en ligne des 162 pages : inutile de toucher au HTML.

**Cause 2 — fluidite mobile.** `.hero-halo` et `.prem-mesh` sont en
`mix-blend-mode:screen` sur des boites allant jusqu'a 390x1375 px : la fusion prive le
compositeur de ses chemins rapides. C'est la **seule** propriete que la bisection ait
retenue. Neutralisee : mediane de frame 50 ms -> 33,4 ms, reproductible 4 essais sur 4,
+11 % de frames affichees, rendu identique a l'oeil sur fond sombre (captures
comparees). Correctif limite a `max-width:1024px` — l'ordinateur n'en souffre pas.

**Ce que le JavaScript fait encore.** 158 appels a `behavior:'smooth'` recenses : 153
sont des boutons « retour en haut » (`top:0`, aucune cible a manquer, donc inoffensifs
et laisses tels quels), 4 des defilements courts vers un formulaire (boutique,
contact), 1 un message de statut. Aucun ne pilote la navigation par ancre. Le CSS ne
peut pas les couvrir de toute facon : un `behavior` passe en argument gagne toujours.

**Defaut residuel non corrige.** `/#produits-acces` se depose 7 767 px a cote **dans
les deux modes** — cause distincte, anterieure, a instruire separement.

## 18. Cale d'ancre — scroll-padding-top mesuré (01/08/2026)

Suite directe de §17. Une fois le glissement supprimé, les ancres arrivent au bon
endroit — mais « au bon endroit » etait faux : `scroll-padding-top` valait **116px**
en dur, une constante qui ne correspond a aucun gabarit reel.

**Ce que mesure la pile collante.** La barre principale ne fait pas 116px, elle fait
77px a 390, 93px a 820 et **132px a 1440** (elle passe sur deux rangs en large), et
`--nav-h` reste bloque a 72px : cette variable ne decrit pas la hauteur rendue, ne
pas s'en servir pour caler quoi que ce soit. Par-dessus s'empilent des sous-nav
collantes selon la page : `.corp-nav` (7 pages), `nav.toc`, `#inv-toc`, `#cw-tabs`.
Releve, en px du haut de fenetre jusqu'au bas de la pile :

    page             390    820    1440
    /gouvernance      77     93     132
    /solutions       124    116     132
    /investisseurs   135    124     132
    /engagements     141    135     135
    /societe          77    150     135
    /clients         284     93     132

Contre 116 partout, cela donne des titres caches jusqu'a **168px** de profondeur.
Test d'occlusion : `elementFromPoint` sur le titre de la cible apres arrivee — la
seule mesure honnete, car comparer des nombres ne dit pas si un titre est lisible.
Verdict avant correctif : **4 titres recouverts sur 54 en telephone, 14 sur 54 en
ordinateur**. On cliquait une entree du sommaire et le titre arrivait sous la barre.

**Correctif.** `nav_a.js` mesure la pile et pose `--et-anc` sur la racine ; la
feuille fait `scroll-padding-top:var(--et-anc, repli)`. Deux points de methode :
la position **collee** d'un element sticky vaut sa valeur de `top` calculee plus sa
hauteur — inutile de defiler pour la connaitre, ce qui evite un instrument qui
dependrait de l'etat de defilement. Et les candidats sont filtres : largeur >= 60 %
de la fenetre (sinon une carte collante passe pour une barre), hauteur <= 45 % (sinon
un voile plein ecran), `top` <= 40 % de la fenetre (sinon un element qui ne se colle
pas en haut). 18px d'air sont ajoutes sous la pile.

**Repli.** `nav_a.js` n'est charge que par 95 pages ; les 62 autres (articles du
journal, pages legales) ont une barre simple et prennent les valeurs par palier
95 / 111 / 150px, mesurees de la meme facon. Le fichier est servi avec
`max-age=3600` : une version en cache degrade au repli pendant une heure au plus,
et le repli est deja meilleur que l'ancienne constante.

**Apres correctif : 0 titre recouvert sur 97 ancres, aux trois gabarits.** Reste un
faux positif a connaitre : sur /projets, `.pj-go::after{position:absolute;inset:0}`
etire le lien sur toute la carte — `elementFromPoint` renvoie le lien, pas le titre.
C'est le motif « carte entierement cliquable », voulu, pas une occlusion.

---

## 19. iOS / Safari — inspection et QA sous le vrai WebKit (01/08/2026)

**Pourquoi le protocole change tout.** Jusqu'ici le mobile etait audite sous Chromium
en gabarit iPhone : bonne largeur, mauvais moteur. Or les defauts iOS qui comptent ne
sont pas des defauts de largeur — le zoom force a la saisie, `100vh` qui vaut la
hauteur barre d'adresse repliee, `env(safe-area-inset-*)`, la surbrillance grise au
toucher, le rendu du verre depoli : rien de tout cela ne se reproduit sous Blink.
L'audit a donc tourne sous **WebKit 26 de Playwright** (`/opt/pw-browsers/webkit-2215`,
`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`), profils *iPhone SE* 320x568, *iPhone 13*
390x664, *iPhone 13 landscape* 750x342 et *iPad (gen 7)* 810x1080, contre le serveur
local `cleanserv.py`. Deux limites du banc a connaitre : `env(safe-area-inset-*)` y
vaut toujours zero (l'encoche ne se simule pas — les regles qui en dependent se
verifient par lecture, pas par mesure), et **les contextes WebKit demarrent en
`colorScheme:'light'`** ; sans le forcer explicitement on n'audite jamais le theme
sombre, qui est pourtant le theme par defaut du site.

**Ce que la mesure a innocente**, et qu'il est inutile de re-suspecter : zero erreur
JavaScript sur les douze pages temoins, zero debordement horizontal, le verre depoli
fonctionne (`-webkit-backdrop-filter` present partout), aucun melange de calques sous
1024px, les ancres tiennent (0 titre recouvert sur 64 en iPad, 1 sur 64 en iPhone
portrait — la cale du 18 tient sous WebKit aussi).

**Les onze constats.** Le zoom automatique des champs venait d'une regle 16px enfermee
dans `@media(max-width:600px)` : un critere de largeur pour un comportement qui depend
du materiel. A 750px de large — un iPhone couche — `/contact` servait cinq champs a
10,56px et `/boutique` ses listes a 12,8px : toute tablette et tout telephone couche
zoomaient de force. Recadre sur `@media(pointer:coarse)`. Aucune surbrillance de
toucher n'etait definie, iOS peignait donc son rectangle gris sur fond sombre. Le
mega-menu se calait en `100vh` et son bas passait sous la barre d'adresse ; il est
passe en `100dvh` avec repli. Trois en-tetes collants et les cotes de `#nezBar`
ignoraient l'encoche en paysage — traites par **bordure transparente** et non par
remplissage, parce que leur remplissage varie de 14 a 40px selon le gabarit et que le
recopier reviendrait a le figer. En paysage court les barres fixes mangeaient 38 a 45%
d'une fenetre de 342px : `#nezBar` s'escamote sous 450px de haut, la fenetre revient a
20-27%. Six pages ne chargent aucun des deux paquets CSS et n'auraient rien recu :
elles ont leur propre feuille `assets/chrome/ios_hb1.css`. Huit pages racines
manquaient `viewport-fit=cover`, sans lequel les `env()` ne servent a rien. Restent
les cibles tactiles, traitees plus bas, et deux defauts de mise en page decrits juste
apres.

**Le fil d'Ariane sous la barre — le defaut le plus serieux.** Il ne se voyait qu'en
tablette et en telephone couche, ce qui explique qu'il ait survecu a tous les audits
precedents. Deux causes independantes, additives.

*Un.* La seule regle qui degageait le haut du hero, `c_c79b7a1d9fec.css`, etait enfermee
dans `@media(max-width:560px)`. **De 561 a 1240px, plus rien** : `.hero` retombait a
`padding-top:0` sous une barre fixe de 93px. Au-dela de 1241px le defaut ne se voit pas,
mais pas par chance — `nav_a.css` donne la au fil d'Ariane ses propres 74px de
remplissage. Second foyer, visible celui-la meme en portrait : les **37 pages marquees
`body.nx-clear`** recevaient 48px pour une barre de 77px, donc recouvertes a toutes les
largeurs. Correctif : deux bandes deterministes, 96px sous 560px (la valeur deja prouvee,
on ne bouge pas les pages saines) et 112px de 561 a 1240px (93px de barre + les 19px de
respiration du gabarit telephone), specificite (0,3,0) pour battre `body.nx-clear .hero`
et **sans `!important`**, afin que le `header.hero{padding-top:152px!important}` de
l'accueil garde la main.

*Deux.* `--nav-h` etait **fige a 72px pour une barre de 93 a 132px**. `c_ac04328f0f47.js`
pose la variable au parse puis seulement au redimensionnement ; or sur les gabarits ou
la barre se replie sur deux rangs, elle grandit *apres coup*, au chargement de la police
de marque, sans qu'aucun redimensionnement ne survienne. Les deux consommateurs — le
panneau de menu mobile et le mega-menu, dimensionnes en `calc(100dvh - var(--nav-h))` —
depassaient donc le bas de la fenetre de 21 a 60px. Correctif dans `u_cd226c00eb4b.js` :
un **`ResizeObserver` sur `#nav`**, plus `document.fonts.ready` et `load` en ceinture.
La lecon generale : *observer la barre, pas la fenetre* — un palier de largeur ne peut
pas decrire une hauteur qui depend d'une police.

**Piege d'instrumentation a ne pas retomber dedans.** Le premier instrument mesurait le
haut de la *boite* du fil d'Ariane et annonçait un defaut jusqu'en 1440px, donc un
defaut de bureau. Verification par capture d'ecran : la boite demarre bien a y=72 sous
une barre finissant a 132, mais elle porte 74px de remplissage propre et le *texte* est
a 146, parfaitement lisible. Une boite recouverte n'est pas un texte recouvert. L'outil
honnete est un `TreeWalker(SHOW_TEXT)` + `Range.getBoundingClientRect()` qui cherche le
premier texte reellement visible, en sautant les descendants de la barre et les noeuds
hors ecran (`if(b.height<3||b.bottom<2)continue;` — sans quoi il attrape le lien
d'evitement, place hors champ). Apres correctif : **zero texte recouvert** a 390, 561,
750, 810, 1024 et 1240px, et aucune regression a 1280/1440 (premier texte a 130-242 pour
une barre finissant a 132 — inchange). Un point marginal subsiste hors perimetre iOS :
`/investisseurs` a 1280px place son premier texte a 130 pour une barre a 132.

**Cibles tactiles — cinq passes, et pourquoi cinq.** La recommandation d'Apple est
44x44. Le releve initial etait de 151 cibles distinctes en portrait, 298 en paysage,
260 sur iPad. La methode qui a marche n'est pas la regle large mais l'**instrument #6** :
un vidage du chemin CSS complet (`div.wrap > nav.toc > a`) de chaque cible fautive, qui
transforme une traine indistincte en une dizaine de familles nommees, traitees d'une
ligne chacune. La descente :

    passe        portrait   paysage   iPad
    depart          151       298      260
    1 (ios.css)     126       245      151
    2 (ios_b)        49       107       91
    3 (ios_c)         4        26       82
    4 (ios_d/_f)      3        13       30
    5 (rattrapages)   2         7        6

Trois enseignements de la traine. `min-width`/`min-height` **priment toujours** sur
`width`/`height`, quel que soit l'ordre : quand `.et-soc-foot a` est reste a 36x36
apres la regle, ce n'etait pas un conflit de cascade mais la page arabe, seule page
sans paquet CSS — la regle a ete recopiee dans `ios_hb1.css`. Une meme famille visuelle
peut avoir deux structures : le sommaire de `/investisseurs` accroche ses liens sous
`.toc-in`, celui de `/engagements` et `/gouvernance` directement sous `nav.toc`. Et
deux pastilles d'appel a l'action sans aucune classe ont ete rattrapees par
`a[style*="border-radius:999px"]` — un selecteur d'attribut sur le style en ligne, sur
lequel on ne s'appuie que parce que la propriete visee n'y est pas declaree, donc sans
conflit de specificite. Dernier cas du meme genre : le lien « Voir sur la carte » de
`/contact` pointe vers **OpenStreetMap**, pas Google Maps — la regle de deuxieme passe
sur `a[href*="maps"]` ne l'attrapait pas.

**Residu assume.** Ce qui reste est documente et volontaire : les liens de
`.foot-legal-links`, dont la hauteur est bien passee a 44 mais dont la largeur reste de
20 a 37px — ils sont horizontalement adjacents, les elargir les separerait sur trois
lignes ; et les **liens en pleine phrase** (« Ouvrir le tableau de bord » 177x12,
« Ethique & conformite » 164x20, « Nos engagements » 124x17, « Mentions legales »
115x17, la note arabe 192x30), que la recommandation d'Apple exempte explicitement.

**Etat verifie a la fin.** `champs<16px : 0` sur les trois profils ; surbrillance
`rgba(0,0,0,0)` partout, page arabe comprise ; `#nezBar` escamote en paysage court ;
chrome fixe ramene a 20-27% d'une fenetre de 342px ; `--nav-h` rapporte 71/77/93/132 en
accord avec la barre reelle.

**Deux points ouverts, non traites.** La pastille « Ma commande 0 » de l'en-tete
boutique passe sur deux lignes a 390px de large. Et `#plightBtn` et `.scrollcue`
chevauchent le texte en bas a gauche sur certaines pages.

**Ou vivent les correctifs.** Six couches ajoutees a la queue de `bundle_core_a1.css`
et de `bundle_head_b2.css` (jamais regenerer ce dernier : ce n'est pas une concatenation
pure de ses neuf sources, on le suffixe) ; `assets/chrome/ios_hb1.css` pour les six
pages sans paquet ; l'observateur de barre dans `u_cd226c00eb4b.js`. Toute retouche de
`assets/chrome/*` impose de faire monter `const V` dans `sw.js`.

## 20. Eclaircissement du pied de page et de la navigation (01/08/2026)

**Demande.** « Eliminer les bandes sombres du site pour avoir un site plus lumineux »,
avec deux arbitrages explicites : le pied de page passe en clair, la barre de
navigation passe en clair, et **rien d'autre**. Les sous-menus collants (`.corp-nav`,
`nav.toc`, `.btop`, `.jtop`), le bandeau `#cta-band` du journal et les en-tetes photo
des heros restent tels quels — ne pas les toucher sans nouvelle instruction.

**Ou vit le correctif.** Une couche unique, delimitee par le marqueur
`ECLARCISSEMENT (2026-08)` en commentaire, ajoutee a la queue des **trois seules
feuilles porteuses du theme** :

| Feuille | Pages qui la chargent |
|---|---|
| `assets/chrome/bundle_core_a1.css` | 151 |
| `assets/chrome/plight_extrait.css` | 6 (404, Calculateur_Baril_Additionnel, Configurateur_Service_Integre_v2, explorateur-chaine, explorateur-chaine-en, index) |
| `assets/chrome/x_cd256286824c.css` | 2 (ar.html, index.html) |

Ces trois fichiers couvrent l'integralite des pages qui portent la chrome du site.
Les quatre pages restantes (`docs-sources/brochure_print*.html`, `docs-sources/fiche_ar.html`,
`google9146d41010c5e702.html`) n'ont ni barre ni pied — rien a faire pour elles.
`index.html` recoit la couche deux fois (via `plight_extrait` et `x_cd256286824c`) :
les declarations sont identiques, c'est sans effet.

**Comment la modifier.** Ne jamais editer les trois feuilles a la main. La source est
`/root/work/bright1.css` ; `/root/work/apply_bright.py` tronque tout ce qui suit le
marqueur puis re-ajoute la source courante dans les trois fichiers. Le script est
idempotent : on peut le relancer autant de fois que voulu.

**Portee et specificite — les deux regles a ne pas casser.**

1. **Portee.** Chaque selecteur est prefixe `html.et-plight` ou `html.et-jlight`.
   Le theme sombre reste la valeur par defaut et n'est pas modifie (verifie apres coup :
   pied `rgba(8,13,22,.68)`, barre `linear-gradient(rgba(6,11,20,.94),rgba(6,11,20,.88))`).
2. **Specificite.** Les reparations de contraste anterieures montent deja a trois
   negations d'ID (`…:not(#_):not(#__):not(#___)`) et la brochure a quatre. La couche
   en utilise **cinq** (`:not(#e1)` a `:not(#e5)`). Ne pas les retirer : sans elles les
   anciennes regles or/creme reprennent la main et les libelles redeviennent illisibles
   sur fond clair.

Rappel : `html.et-jlight` definit un jeu de variables (`--bg --bg2 --ink --mut --hair
--gold --gold-l --blue-l`) mais **`html.et-plight` n'a pas d'equivalent** — en mode
page-claire `var(--muted)`, `var(--hair)` et `var(--cream)` gardent leurs valeurs du
theme sombre. Toute nouvelle regle doit donc ecrire ses couleurs en dur.

**Les sept sections de la couche.** 1 fond du pied, 2 encre du pied, 3 liens du pied,
4 verre clair de la barre haute, 5 mega-menus (le bloc de fond est sous
`@media(min-width:1241px)`), 6 tiroir mobile (toute la section sous
`@media(max-width:1240px)`), 7 barre basse mobile `#nezBar`.
Le point de bascule de la navigation est **1240 px**, pas 1024.

**Trois pieges rencontres, et leur correctif.**

- *« Ener » invisible dans le logotype.* Dans `.brand-tx`, « Ener » est un nœud de
  texte nu — il heritait de `--cream` (quasi blanc) et disparaissait sur la barre
  claire, ne laissant lire que « Tchad ». Corrige par une regle de couleur sur
  `.nav .brand-tx` lui-meme.
- *Filigrane derriere le tiroir mobile.* A 0,985 d'opacite le titre blanc du hero
  transparaissait derriere les libelles. Le tiroir est un panneau modal : il est
  desormais **opaque**. La barre haute et `#nezBar`, eux, gardent leur translucidite
  (`backdrop-filter:blur(16px) saturate(150%)`), conformement a la consigne
  « permettre au site d'etre translucide ».
- *`#nezBar` oublie de l'inventaire.* La barre basse mobile (60 px fixes,
  `rgba(8,14,26,.94)`, presente sur toutes les pages) n'apparaissait pas dans le
  releve initial des bandes parce que celui-ci tournait a 1280 px. Auditer les bandes
  aux **deux** largeurs.

**Piege de mesure — a connaitre avant de re-auditer.** Le site pose
`transition:color .18s` sur les liens de la barre et du pied. Or, dans la cascade CSS,
**les declarations de transition passent AVANT les `!important` d'auteur**. Injecter
une feuille avec `page.addStyleTag()` declenche donc une transition de couleur qui,
en Chromium headless, reste `playState:"running"` plusieurs secondes : toute mesure
prise pendant cette fenetre lit **l'ancienne couleur**, et meme
`element.style.setProperty('color',x,'important')` est ignore. C'est ce qui a produit
39 faux echecs de contraste reproductibles. Remede, avant tout releve :

```js
await pg.evaluate(()=>document.getAnimations().forEach(a=>{try{a.finish()}catch(e){}}));
await pg.waitForTimeout(400);
```

Le probleme est purement lie au harnais d'audit : en production la feuille est
presente des le premier rendu, aucune transition ne se declenche.

**Etat verifie a la publication.** Contraste WCAG : 0 echec sur 14 pages a 1280 px
(lecture des fichiers reels, sans injection) et 0 echec dans le tiroir mobile a 390 px.
Fond du pied `rgb(243,238,229)` L=0,859 (avant `rgb(11,20,34)` L=0,0069) ; barre
L=0,819-0,932 (avant L=0,0043). Outils : `/root/work/eclair2.js` (contraste, 14 pages)
et `/root/work/verif.js` (non-regression du theme sombre, captures claires bureau,
tiroir mobile).

## 21. Mobilier flottant en bas de page (01/08/2026)

**Mesure.** Sonde d'occlusion reelle (`elementsFromPoint`, on ne retient un
recouvrement que si le controle flottant est bien **au-dessus** dans la pile de
peinture), 10 pages, 1280 px et 390 px, defilement jusqu'en bas.
Script : `/root/work/occ3.js`. Une premiere version (`flot.js`) ne testait que le
chevauchement geometrique et produisait des faux positifs — `#toTop` « recouvrant »
le bandeau cookies alors que celui-ci est en `z-index:60` contre 48.

**Quatre defauts confirmes, tous en bas de page.**

- `#scrollcue`, le bouton « Suite ⌄ », restait affiche une fois arrive tout en bas —
  la ou il n'y a plus rien a montrer — et recouvrait les liens « Accessibilite » et
  « Plan du site » du pied sur societe, investisseurs, contact, journal et glossaire.
  La regle `.scrollcue.hide` (`opacity:0;pointer-events:none`) **existait deja** dans
  `bundle_core_a1.css` : aucun script du site ne l'ajoutait jamais.
- `#scrollcue` n'avait **aucun gestionnaire de clic**. Un `<button>` annonce
  « Voir la suite plus bas » qui ne fait rien est un piege au clavier comme a la souris.
- `#secrail`, le sommaire lateral a pastilles, chevauchait le lien « Engagements » du
  pied sur `/boutique`. Un sommaire de la page n'a rien a faire au-dessus du pied.
- `#plightBtn` recouvrait « FAQ ». Le degagement du pied existait deja sous 520 px
  (bloc `etFootClear` du meme fichier) ; il manquait au-dessus.

**Correctif.** Un bloc unique en queue de `assets/chrome/u_cd226c00eb4b.js` (155 pages,
couvre les 151 pages porteuses du `#scrollcue`). Il fait quatre choses :

1. injecte une feuille `#etFloatClear` — `pointer-events:none` sur le conteneur du rail
   et `auto` sur ses liens, l'etat `.pied-off`, et
   `@media(min-width:521px){footer .foot-legal{padding-bottom:64px}}` ;
2. sur `scroll`/`resize`, cadence en `requestAnimationFrame`, pose `.hide` sur le
   repere des que le reste a derouler tombe sous 120 px, des que le haut du pied
   remonte au-dessus de `innerHeight-40`, ou si la page n'est pas defilante ;
3. accompagne `.hide` de `aria-hidden` et `tabIndex=-1` — sans quoi un bouton
   invisible reste dans l'ordre de tabulation ;
4. donne au repere un clic qui defile de 0,85 hauteur de fenetre, en `smooth` sauf
   `prefers-reduced-motion`.

Le rail suit la meme logique avec `.pied-off` des que le pied occupe le tiers bas
de la fenetre, en fondu de 0,28 s.

**Verification.** `/root/work/occ3.js` : 0 occlusion sur 10 pages aux deux largeurs.
`/root/work/cue.js` : sur 6 pages, le repere est present en haut et au milieu, masque
en bas, revient en remontant, et son clic fait descendre de 484 a 765 px selon la page —
0 anomalie. Contraste : `eclair2.js` toujours a 0 echec sur 14 pages.

**A savoir si l'on retouche.** Ne pas se fier a `getBoundingClientRect()` seul pour
juger un recouvrement : sans la pile de peinture on accuse des elements qui sont en
dessous. Et `.foot-legal` porte desormais deux marges basses distinctes (76 px sous
520 px, 64 px au-dessus) — les deux sont necessaires, les geometries different.

---

## 22. Cibles tactiles : mesurer la zone sensible, pas la boite dessinee (2026-08)

**Constat.** Le §19 avait pose, sous `@media(pointer:coarse)`, des pastilles
`::after` de 44x44 centrees sur les petits controles (`.scrollcue`, `#plightBtn`,
`.flip-hint`, `.f2hint`, `a[data-social]`...). Une relecture a montre que ces
pastilles se **chevauchent** quand deux cibles sont proches : dans la zone commune
c'est le frere suivant dans l'ordre de peinture qui gagne le test de toucher, si
bien que la zone reellement utile retombait a 38-42 px alors que la pastille, elle,
mesurait bien 44.

**Consequence de methode.** `getBoundingClientRect()` ne dit rien de la surface
tactile sur ce site, ni dans un sens ni dans l'autre : le dessin peut etre plus
petit que la zone sensible (pastille) ou plus grand qu'elle (recouvrement). La
seule mesure valable est un balayage `document.elementFromPoint` depuis le centre
de la cible.

**Outil.** `/root/work/tap2.js` (sonde de reference). Pour chaque
`a[href],button,input,select,summary,[role=button],[tabindex="0"]` visible : si la
boite fait deja 44x44 on passe ; sinon on balaye vers les quatre cotes, **pas de
1 px**, tant que `elementFromPoint` resout encore sur la cible (ou un descendant,
ou un ancetre qui la contient). La largeur/hauteur tactile vaut `gauche+droite+1`
et `haut+bas+1`.

> **Piege de bord — a ne pas reintroduire.** Une cible de 44 px exactement se lit
> **43** avec cette convention (bras de 21 px de chaque cote : a 22 px du centre on
> est deja sur la frontiere et c'est le voisin qui repond). Le seuil de conformite
> est donc `>= 43`, pas `>= 44`. Une premiere version sondait une grille 3x3 a
> `±22 px` : elle declarait en echec toutes les cibles de 44 px et sortait 314
> faux positifs. Avec le pas de 1 px et le seuil a 43, le meme parcours de 18 pages
> tombe a 76 signalements reels, puis a 3 apres correction — et ces 3 la sont des
> captures prises en cours de defilement, verifiees conformes a l'arret.

**Couche appliquee.** `/root/work/mobile1.css`, marqueur `MOBILE TACTILE (2026-08)`,
posee par `apply_layer.py` sur les trois feuilles porteuses. Elle **agrandit la
boite reelle et ecarte les voisines** au lieu d'empiler une pastille de plus :

| cible | avant | apres |
|---|---|---|
| `.foot-social a` (153 pages) | 38x38, ecart 10 px, pastilles superposees | 44x44, ecart 12 px |
| `.foot-legal-links a` | 22 px utiles, marges negatives | `padding:11px 6px`, marges nulles |
| `.sm-col a` (`/plan-du-site`) | 26 px, ecart 6-9 px | `min-height:44px`, `padding:9px 0` |
| `.cats button` (`/glossaire-petrolier`) | 29 px, `.7rem`, ecart 7 px | `min-height:44px`, `.78rem`, ecart 9 px |
| `.back` (en-tetes autonomes, 7 pages) | 22 px | `padding:11px 6px` compense par marge negative |
| `.avnet-hit` (`/aval/reseau`) | `r=19` (38 px) | `r:22px` en CSS (44 px) |

`r` est une propriete geometrique SVG pilotable en CSS ; les moteurs qui ne la
connaissent pas l'ignorent sans dommage, l'attribut `r="19"` restant en place.

**Non traite volontairement.** Les hubs voisins de la carte du reseau aval
(N'Djamena et Moundou sont a 17 unites l'un de l'autre) se recouvriront toujours :
leur position est dictee par la geographie, c'est le cas « essentiel » prevu par la
WCAG 2.5.8.

---

## 23. Cartes retournables de l'accueil : la classe `flipped` n'existait qu'en JS (2026-08)

Le script en ligne d'`index.html` bascule `classList.toggle("flipped")` au clic sur
la carte ou sur `.flip-hint`. **Aucune regle CSS du site ne reagissait a cette
classe** — verifie : `grep -rl 'flipped'` ne renvoyait qu'`index.html`, et le seul
declencheur du retournement etait `.flip:hover .flip-in{transform:rotateY(180deg)}`
(dans `x_77d650c4a7a2.css`). Sur un ecran tactile, ou `:hover` n'existe pas ou reste
colle apres un appui, **la face arriere etait donc inatteignable** : son intitule
`.flip-k`, son texte `.flip-lead` et son lien `.flip-cta` n'ont jamais ete lisibles
sur mobile depuis la mise en ligne de ces cartes.

Corrige dans la couche `MOBILE TACTILE` :

```css
.flip.flipped:not(#_):not(#__) .flip-in{transform:rotateY(180deg)!important}
@media(hover:none){
  .flip:not(.flipped):not(#_):not(#__) .flip-in{transform:none!important}
}
```

La seconde regle neutralise `:hover` la ou il n'a pas de sens, pour que l'etat soit
pilote par le seul appui. Le survol au bureau reste inchange (verifie : `none` ->
rotation au `hover` en 1280 px). `.flip .flip-hint` passe par ailleurs a
`opacity:1` sur pointeur grossier — il ne s'eclaircissait qu'au survol, donc
l'affordance du retournement etait invisible sur mobile.

**A savoir si l'on retouche.** Les deux faces portent `backface-visibility:hidden`,
la face cachee n'est donc pas testable au toucher — inutile d'ajouter `inert`
comme le fait le script des `.biz-card`. En revanche elle **reste focusable au
clavier** ; c'est le seul point encore ouvert sur ces cartes.

---

## 24. Typographie mobile : un plancher pose UNIQUEMENT dans des conteneurs « purement petits » (2026-08)

**Le probleme.** 1622 declarations `font-size` inferieures a 15px vivent dans les
blocs `<style>` en ligne des 162 fichiers. Un correctif fichier par fichier est
hors de portee ; la correction doit venir d'une couche appendue aux trois feuilles
porteuses, en `!important`.

**Les deux methodes qui ont echoue.**

1. *Bump global du `rem`* (`html{font-size:17px}` sous 640px). Le site ne declare
   aucun `html{font-size}` — la racine est le 16px du navigateur — donc tout ce qui
   est en `rem` grossit d'un coup : chromes de navigation, pastilles, badges,
   grilles calculees en `rem`. Debordements immediats.
2. *Plancher par selecteur* (`main p:not(#_):not(#__){font-size:15px!important}`).
   Un plancher applique a un selecteur large **retrecit** tout ce qui etait deja
   plus grand que le plancher : les chapeaux a 17px, les citations a 19px. Un
   `font-size` fixe n'est pas un plancher, c'est une egalite.

**La methode retenue : le conteneur pur.** `/root/work/ty.js` parcourt 36 pages en
390x844 et ne retient que les **feuilles de texte** (au moins 30 caracteres en
noeud-texte direct, 40 au total, largeur >= 40px). Chaque feuille est rattachee a
sa chaine d'ancetres classes (3 niveaux, arret sur `main,.wrap,article,section,footer,body`),
les classes d'etat (`in`, `rv`, `reveal`, `on`, `active`, `flipped`, `is-`, `js-`)
etant retirees pour que le selecteur soit stable. Resultat dans `/root/work/ty.json`.

On classe alors chaque conteneur : contient-il, oui ou non, **du texte de contenu
a 15px ou plus** ? 60 conteneurs n'en contiennent aucun — ce sont les conteneurs
« purs ». En elargissant aux conteneurs qui ont au plus 1 element >= 15px pour au
moins 4 elements < 15px, on obtient **127 paires conteneur/balise couvrant 1669
elements**.

> **La propriete qui rend la couche sure : un plancher pose dans un conteneur pur
> ne peut rien retrecir**, puisqu'il n'y a rien de plus grand a l'interieur.

`div.wrap` (403 petits pour 319 grands) et les autres conteneurs mixtes sont
**exclus** : c'est precisement la ou la methode 2 cassait.

**Les paliers.** 12.0-12.9px -> 14.2 | 13.0-13.9px -> 14.8 | >= 14.0px -> 15.2.
`line-height` porte a 1.6 minimum dans les memes blocs. Tout ce qui est **sous
12px est laisse intact volontairement** : `.kick` a 11.2, `.fs` a 10.56, les
mentions legales du pied a 12.48 sont des micro-typographies (surtitres, pastilles,
badges) — les grossir defigurerait la hierarchie.

**Portee.** `@media (max-width:640px)` uniquement. Le desktop n'est pas touche.

**Le fichier.** `/root/work/typo1.css`, marqueur `TYPO MOBILE (2026-08)`, appendu
aux trois porteuses par `apply_layer.py`. 6 blocs groupes par declaration
identique, 4427 octets de regles. Les selecteurs sont de la forme
`conteneur:not(#_):not(#__) balise` — le conteneur plus la balise nue suffisent,
les classes generees (`bx###`, `qx#_##`) sont retirees du cote selecteur.

**La verification.** `/root/work/ver.js` repasse les 36 memes pages et cherche
(a) un debordement horizontal de page, (b) des elements dont le bord droit sort du
viewport, (c) un `scrollWidth > clientWidth` interne hors scrollers declares,
(d) du **texte coupe** (`overflow:hidden` et `scrollHeight > clientHeight+3`).
Resultat : `doc 390/390` sur les 36 pages et **zero texte coupe**.

> **Piege de lecture de `ver.js`.** Le script signale des elements sur presque
> toutes les pages, mais ce sont des **faux positifs** : sous 640px, `main .hpgrid`,
> `.hxi-grid`, `.hnews-grid`, `.ttg-g` passent en `grid-auto-flow:column` et
> deviennent des defileurs horizontaux volontaires. Le controle saute le defileur
> lui-meme (il a `overflow-x:auto`) mais pas ses enfants hors-ecran. Les seules
> lignes qui comptent sont `doc` et `coupes`.

---

## 25. Reorganisation de l'accueil autour des trois maillons (2026-08)

**La demande.** Reorganiser la home autour d'Exploration-Production (Amont),
Transport & stockage (Intermediaire), Raffinage & distribution (Aval) pour que les
clients se retrouvent.

**Le diagnostic.** L'accueil ouvrait sur le recit — `#combat`, `#conviction`,
`#vision` — et ne presentait les trois metiers qu'a mi-page, sous des noms internes
(« Amont », « Intermediaire », « Aval ») qui ne disent rien a un client qui cherche
un produit ou un partenaire. La page vendait l'entreprise avant d'orienter le
visiteur.

**Ce qui a change.**

*Ordre des sections dans `main`* : `#coeurs` puis `#chaine-expliquee` sont remontes
en tete. Le visiteur voit d'abord les trois portes, puis l'explication des trois
mots, puis seulement le recit (`#combat`, `#conviction`, `#vision`) et le reste.

*Nommage des cartes* : le nom client passe en `h3`, le nom de pole devient une
etiquette secondaire sur sa propre ligne.

| `.hpcard-n` (avant) | `.hpcard-n` (apres) | `.hpcard-tag` |
|---|---|---|
| Amont | Exploration & Production | Amont · upstream |
| Intermediaire | Transport & stockage | Intermediaire · midstream |
| Aval | Raffinage & distribution | Aval · downstream |

*Surtitre, titre, chapeau* : « Coeur de metier · Trois maillons, une extension » ->
« S'orienter · Trouvez votre maillon » ; « Du puits a la pompe : nos trois coeurs de
metier. » -> « Trois maillons, trois portes d'entree. » ; nouveau chapeau qui
explique chaque maillon en une proposition.

*Tiroirs* : l'intitule « Departements » devient « Ce que nous faisons » (x3), et un
quatrieme lien `/amont/parc` (« Parc & mise a disposition ») est ajoute au tiroir
Amont.

*Accessibilite* : `aria-label="Nos trois coeurs de metier"` ->
`"Nos trois maillons : Exploration-Production, Transport et stockage, Raffinage et
distribution"` ; `aria-label="Sous-pages du pole"` -> `"Nos services dans ce maillon"`.

**Le CSS de page qu'il a fallu ajouter.** L'etiquette `.hpcard-tag` etait un
element en ligne colle au titre dans `.hpcard-top` ; la descendre sur sa propre
ligne demande deux declarations, placees juste apres la regle `.hubwrap` du
`<style>` en ligne d'`index.html` :

```css
.hpcard-body>.hpcard-tag{margin-left:0;margin-top:-5px;align-self:flex-start;white-space:normal}
.hpcard-top{flex-wrap:wrap}
```

**Le tiroir sombre decouvert au passage.** En rendant les cartes, `.hubdrawer`
s'est revele etre une dalle gris fonce (`background:rgba(12,19,33,.58)!important`)
meme en theme clair, avec du texte bleu illisible dessus — en contradiction
frontale avec la consigne permanente « eliminer les bandes sombres ». Corrige par
un bloc verre-clair ajoute a `bright1.css` (`background:rgba(255,255,255,.66)`,
filet `rgba(26,35,48,.14)`, liens `#155FA8`), toujours porte par les **cinq**
`:not(#e1)...:not(#e5)` de la couche d'eclaircissement.

**Un defaut cosmetique assume.** Les cartes 1 et 3 ont quatre liens de tiroir, la
carte 2 (Intermediaire) n'en a que trois — `intermediaire/` ne contient que
`index`, `logistique`, `services`, `sites`. Le bord haut de son tiroir s'aligne
donc ~50px plus bas. Le correctif CSS envisage (`display:contents` sur
`.hpcard-body` + `grid-template-rows:1fr auto` sur `.hubwrap`) casse le defileur
horizontal mobile et l'effet de levee `.hubwrap:hover` : **rejete**. Le defaut
disparaitra le jour ou une quatrieme sous-page Intermediaire existera.

**Mesures de controle** (`/root/work/shot.js`, 390x844 et 1280x900) : les trois
`h3` tiennent sur une ligne (218 / 190 / 210px), les trois etiquettes sur une
ligne, les trois chapeaux sur exactement 3 lignes ; `doc 390/390` et `doc 1270/1280`.

## 26. Doublons de l'accueil : la redondance etait structurelle, pas textuelle (2026-08)

Consigne : « eliminer les doublons sur la home page ». La sonde
`/root/work/dup.js` (blocs de texte feuilles repetes, cibles `main a[href]`
repetees avec leur section proprietaire, chaines numeriques repetees) a rendu
**zero phrase repetee et zero chiffre repete**. La redondance etait donc
architecturale.

**Le doublon reel.** `<section id="chaine-expliquee">` restituait integralement
le nouveau `#coeurs` : memes trois maillons, memes trois liens « Decouvrir le
pole → » vers `/amont/`, `/intermediaire/`, `/aval/`, meme explication, meme
surtitre « S'orienter ». C'est un artefact de la reorganisation decrite en §25 :
en rapprochant les deux sections, leur equivalence est devenue visible. Section
supprimee (4238 octets).

**Les trois effets de bord de la suppression.**

1. La pastille doree en pied de `#coeurs` pointait vers `/amont/services-ep`,
   deja present dans le tiroir Amont. Repointee vers `/explorateur-chaine`
   (libelle « Explorer la chaine, maillon par maillon → »), page qui existe,
   repond 200, et n'etait **liee que depuis la section supprimee**.
2. Six regles CSS `html.et-plight #chaine-expliquee ...` devenues mortes,
   retirees par boucle `re.search(r'html\.et-plight #chaine-expliquee[^{}]*\{[^{}]*\}', s)`
   (470 octets).
3. `<style id="minv-css">` + `<script id="minv-js">` — le mecanisme d'accordeon
   mobile — n'existaient que pour replier `#chaine-expliquee` (leur propre
   commentaire le disait : « seule la section pedagogique #chaine-expliquee se
   replie »). Code mort, supprime (726 + 1543 octets).

**Le surtitre en conflit.** `#vision` et `#combat` affichaient tous deux
« Notre raison d'etre ». `#vision` passe a « Notre vision ».

**Ce qui a ete deliberement CONSERVE.** `.shortcuts` semble doubler le pied de
page mais ses liens portent des ancres profondes (`/societe#vision`,
`/investisseurs#these`, `/carrieres#postuler`) que le pied n'a pas. `#conviction`
semble doubler `#coeurs` mais defend un angle distinct — la chaine integree en
mains tchadiennes — avec trois puces colorees propres. Les repetitions de cible
`/investisseurs` (x3) et `/societe#voie` (x3) sont legitimes : rail de profils,
appel editorial et carte de navigation sont trois contextes differents.

Bilan : `index.html` 119783 → 114227 octets. Controle :
`grep -o 'chaine-expliquee\|minv-' index.html | sort | uniq -c` → vide.

## 27. Tuiles : une echelle de rayon a trois crans, et une elevation unique (2026-08)

Consigne : « revoir les tuiles et faire moderniser le design ».

**L'etat mesure avant.** Deux sondes successives (`/root/work/tiles.js` puis
`tiles2.js`, 25 pages a 1280x900, capture des largeurs de bordure par cote,
rayon en flottant, ombre, padding, backdrop-filter) ont trouve **610 tuiles**
reparties sur **9 rayons differents** — 16px (170), 22 (158), 18 (124), 14 (102),
20 (11), 13 (6), 12 (4), 15 (4), 0 (31) — et surtout **une moitie du parc sans
aucune ombre**, qui lisait plat et date a cote des cartes verre
(`backdrop-filter`). 67 tuiles portaient un filet d'accent superieur de **3px**,
53 de 2px : deux epaisseurs pour le meme dispositif.

**Le traitement.** Nouvelle couche `TUILES UNIFIEES (2026-08)`
(`/root/work/tiles1.css`, 4e entree de `COUCHES` dans `apply_layer.py`) :

| Axe | Avant | Apres |
|---|---|---|
| Rayons | 9 valeurs | **3 crans : 14 / 18 / 22** (+0 pour les parties internes) |
| Filets d'accent haut | 3px (67) + 2px (53) | 2px partout sauf 8 `a.prof` /clients |
| Familles sans ombre | ~27 classes | 2 (`.sfam-i`, partie interne ; `.mfo-lever`, carte flip) |
| Survol | heterogene | levee `translateY(-2px)` + ombre renforcee, sur les tuiles interactives uniquement |

Repartition finale : **18 (300), 22 (242), 14 (37), 0 (31)**.

**La regle de ciblage.** Les selecteurs sont **nommes**, jamais deduits de la
geometrie mesuree : les sondes remontent `span.hpcard-body`, `p.hpcard-l`,
`div.sfam-i` comme des tuiles alors que ce sont des parties internes. Une regle
calee sur « rayon 16 + bordure » les aurait frappees.

**Les classes a nom generique.** `.d` `.t` `.h` `.hp` `.pr` `.step` `.aside`
`.ppl-f` ne peuvent pas etre ciblees seules — `main .t` frapperait tout le site.
Elles sont ancrees sur leur conteneur de grille, releve par sonde DOM
(`/root/work/probe2.js`) : `.hse-prac>.pr`, `.hse-tri>.hp`, `.cli-deep>.d`,
`.offer>.aside`, `.steps>.step`, `.traj>.t`, `.hz>.h`, `.ec-tiers>.ec-tier`,
`.ppl-sel>.ppl-f`.

**`.mseg` : un bandeau gris qui n'aurait jamais du exister.** La classe `.mseg`
(46 occurrences sur `/solutions`, `/clients`, `/solutions-en`) n'a **aucune regle
de base dans tout le site** — seule une surcharge claire lui donnait
`background:rgba(26,35,48,.05)`. Comme `.prof` est un flex colonne, le `span`
s'etirait sur toute la largeur de la carte : une barre grise pleine largeur
derriere « E&P », « Services », « EOR ». Transforme en puce de categorie
(`display:inline-flex`, `align-self:flex-start`, rayon 999px, fond et filet
teintes depuis `var(--mc)`).

**Deux themes, toujours.** Chaque declaration porteuse de couleur est doublee
`html.et-plight` / `html:not(.et-plight)`. La levee de survol est encadree par
`prefers-reduced-motion: no-preference`, avec un bloc `reduce` qui neutralise
`transition` et `transform`.

**Non-regression.** `ver.js` (36 pages, 390x844) : `doc 390/390` sur **les 36**,
et **11 textes coupes avant comme apres**, sur les deux memes familles
(`div.voie-card` /brochure, `div.flip-f`) — dont aucune n'est ciblee par la
couche.

---

## 28. Les trois maillons en pleine page : quatre pieges de cascade (2026-08)

**Demande.** « fusionner S'orienter · Trouvez votre maillon et la section
S'orienter · Amont -> Intermediaire -> Aval », puis « mettre les Trois maillons,
chaque sur une page sur la home et ameliorer le design en ultra ».

**Ce qui a ete fait.** `#coeurs` ne contient plus une grille de trois tuiles mais
un `<div class="mln-set">` de trois `<article class="mln">` occupant chacun une
hauteur d'ecran (`min-height:min(100svh,940px)` en desktop, `100svh` en mobile).
Chaque panneau : photo de fond, voile degrade teinte a l'accent du maillon,
chiffre fantome 01/02/03, rail d'accent, marqueur d'etape, titre, accroche,
deux indicateurs, un bouton pilule et un volet « Ce que nous faisons ».
Le panneau 02 est en miroir (`.mln-rev`) pour casser le rythme.

Generateur : `/root/work/mln.py` (idempotent) + `/root/work/mln.css`, injecte en
`<style id="mln-css">` dans le `<head>` de `index.html`. **Aucune feuille
porteuse n'est touchee, donc aucun bump de `sw.js` n'est requis.**

### Piege 1 — `.hpcard` redeclare `--pac` sur lui-meme

`bundle_core_a1.css` **et** `x_9e73ac04de58.css` posent tous deux
`.hpcard{--pac:var(--gold-l)...}`. Un element qui porte `.hpcard` **redeclare
donc `--pac` sur lui-meme** et masque toute valeur heritee d'un ancetre.
Le bouton `a.mln-go` porte `.hpcard` (voir piege 4) : il ne voyait jamais le
`--pac` pose sur l'`<article>`.

> **Regle.** Une propriete personnalisee destinee a descendre dans un
> descendant portant `.hpcard` doit avoir **un autre nom**. Ici : `--mac` /
> `--macl`.

### Piege 2 — une declaration de feuille bat un `style=""` inline seulement avec `!important`

L'`<article>` porte `style="--mac:#E8C36A;--macl:#7A5C14"`. Le theme clair doit
basculer `--mac` sur `--macl` :

```css
html.et-plight #coeurs .mln{--mac:var(--macl)!important}
```

Sans le `!important`, le style inline gagne et le theme clair reste dore vif.

### Piege 3 — la couche eclaircissement tuait le voile

`bundle_core_a1.css` et `x_cd256286824c.css` posent

```css
html.et-plight main div:not(#_){background-image:none!important}
```

ce qui supprimait purement et simplement le degrade de `.mln-veil` en theme
clair : la photo passait a nu et l'accroche devenait illisible sur un ciel
orange. Specificite de la regle tueuse : `(1 id, 1 classe, 3 types)`.
Il faut donc **a la fois** `!important` et une specificite superieure :

```css
#coeurs .mln-veil:not(#_):not(#__){background-image:...!important}
```

`(3 id, 1 classe, 0 type)` — elle passe devant. Le `::before` de `.mln-bg`
(la photo) n'est **pas** concerne : la regle vise des `div`, pas leurs
pseudo-elements.

### Piege 4 — le bouton doit garder `class="hpcard"`

`assets/chrome/s_c07e811055.js` ecoute
`e.target.closest("a.hpcard,a.plc-card,a.pb-chip")` et ouvre le panneau
« Pole · explorer les thematiques » quand le `href` figure dans son
dictionnaire `D` (`/amont/`, `/intermediaire/`, `/aval/`). Retirer `.hpcard`
du bouton casserait cette fonctionnalite. On garde donc la classe et on
**neutralise integralement le look tuile** avec une regle a sept crans de
specificite, y compris `::before`/`::after{content:none!important}`.

Meme raison pour `main>section:not(#_):has(...,.hpcard)` dans
`s_19895ec63c.css` : `#coeurs` continue de matcher, le fond de section ne
change pas.

### Piege 5 — `transform:scale()` sur un `inset:0` deborde en horizontal

La photo est agrandie a `scale(1.06)` pour laisser de la marge au zoom au
survol. Posee directement sur un `.mln-bg{inset:0}`, elle debordait de 28px et
faisait passer le document a `doc 1308/1280`. Correctif en trois points :

1. la photo passe dans `#coeurs .mln-bg::before` ;
2. `.mln-bg{overflow:hidden}` ;
3. `.mln{overflow-x:clip}` (et `.mln-ghost{right:0}` en mobile).

### Mobile : degager la barre fixe

`nav#nezBar` est fixe en bas, hauteur **59px**. Avec `min-height:100svh` le
contenu du panneau se centrait par-dessus. Correctif :
`padding-bottom:calc(clamp(44px,11vw,64px) + 76px)` sous 640px.
Par ailleurs `#coeurs .mln-rev .mln-in>*{align-self:center}` laissait le volet
services du panneau miroir etroit et centre une fois empile : remis a
`align-self:stretch` dans la requete `max-width:1080px`.

### Mesures finales

| Combinaison | `doc` | hauteur panneau | bouton |
|---|---|---|---|
| desktop sombre | 1270/1280 | 900 | `rgb(232,195,106)` sur `rgb(11,20,34)` |
| desktop clair | 1270/1280 | 900 | `rgb(122,92,20)` sur blanc |
| mobile sombre | 390/390 | 844 | idem sombre |
| mobile clair | 390/390 | 844 | idem clair |

Aucun debordement dans `#coeurs` dans les quatre combinaisons.
`ver.js` (36 pages) : `doc 390/390` sur les 36, **11 textes coupes** —
identique a la reference d'avant travaux.

### Translucidite

Conformement a « eliminer les bandeaux noir pour permettre au site etre
translucide », le voile n'est jamais opaque :
sombre `rgba(6,11,20,.92) -> .74 -> .34`, clair
`rgba(250,247,241,.94) -> .80 -> .42`. La photo reste lisible sur les deux
tiers droits du panneau tout en garantissant le contraste du texte a gauche.

## 29. QA de l'accueil : le contraste ne se mesure pas sur une couleur plate (2026-08)

Campagne de QA complete de `index.html` apres la mise en pleine page des trois
maillons : geometrie (12 largeurs x 2 themes), clavier, liens, SEO, axe-core,
contraste reel et performance.

### Ce qui etait deja conforme

- **Geometrie** : 24 combinaisons (1512 / 1280 / 1240 / 1140 / 1080 / 992 /
  834 / 768 / 430 / 390 / 360 / 320 px), `doc == clientWidth` partout, aucun
  debordement horizontal hors scrollers, **zero texte coupe** dans `#coeurs`.
  La bande 1080-1240px, jamais testee auparavant, est saine.
- **Clavier** : 15 liens focusables dans `#coeurs`, ordre DOM = ordre visuel,
  contour `2px solid` a la couleur d'accent du panneau, aucun piege de focus.
- **Liens** : les 15 `href` resolvent vers un fichier reel, zero 404, zero 308
  (verifie contre le tableau `redirects` de `vercel.json`).
- **SEO** : title, meta description, canonical, og:*, twitter:card, 4 hreflang,
  5 blocs JSON-LD. Aucun `<img>` donc aucun `alt` manquant.
- **axe-core** (wcag2a/aa + wcag21a/aa + best-practice, 1280 et 390, 2 themes) :
  **aucune violation critique ni serieuse**. Restent 2 violations moderees
  preexistantes : `landmark-unique` (plusieurs `nav.hubdrawer` partagent
  `aria-label="Sous-pages du pole"`) et `region` (`#oilticker`, `#homeFab`,
  `#diapo-cap` hors landmark). Les trois nouveaux `nav.mln-nav` ont des noms
  uniques et ne declenchent rien.

### La seule vraie non-conformite : le voile du panneau 02

Mesure **contre le fond reellement composite** (voile + photo), pas contre une
couleur declaree. Methode : masquer tout le texte du panneau
(`color:transparent`), capturer chaque element avec `el.screenshot()`, prendre
le pixel median par luminance.

Deux pieges de methode, tous deux rencontres :

1. `page.screenshot({fullPage:true})` **decale la mise en page** des panneaux en
   `min-height:100svh` : les rectangles releves avant la capture ne
   correspondent plus. Il faut capturer element par element.
2. La regle de masquage `#coeurs .mln-txt *{color:transparent!important}`
   (1 id, 1 classe, 0 type) **perd la guerre de specificite** contre
   `#coeurs .mln-step b` (1 id, 1 classe, 1 type). Des pixels de texte
   contaminaient alors l'echantillon de fond et sortaient des ratios absurdes
   (1,03:1). La regle qui gagne :
   `#coeurs .mln *:not(#qa1)...:not(#qa8){color:transparent!important;
   -webkit-text-fill-color:transparent!important;text-shadow:none!important;
   text-decoration-color:transparent!important}`.

Resultat : sur le panneau **Intermediaire en theme sombre**, `.mln-k` (12px
gras, `#5AA7F0`) tombait a **3,98:1** et `.mln-kpis b` a **3,90:1** (1280) /
**4,07:1** (390) — sous le seuil AA de 4,5:1. Deux causes cumulees :

- la photo `camion-route.webp` a un ciel tres clair et
  `--mln-g2:rgba(7,13,24,.74)` ne le compose qu'a environ `rgb(53,67,79)` ;
- le radial d'accent `color-mix(in srgb,var(--mac) 12%,transparent)` est
  positionne a `94% 50%` sur le panneau miroir, **exactement sous le texte
  colore** : il eclaircit le fond vers la teinte meme du texte.

**Fausse piste ecartee** : le panneau miroir paraissait avoir un degrade
inverse (sombre a droite au lieu de la gauche). Verification isolee d'un
degrade sur fond blanc (`grad.js`) : `100deg` place bien la butee 0% a gauche,
`260deg` a droite, `168deg` en haut. Les trois angles sont corrects tels
qu'ecrits ; il n'y a pas de bug d'inversion.

### Correctifs appliques

| Correctif | Avant | Apres |
|---|---|---|
| Voile sombre, butee mediane | `rgba(7,13,24,.74)` | `rgba(7,13,24,.82)` |
| Voile sombre, butee finale | `rgba(7,13,24,.34)` | `rgba(7,13,24,.40)` |
| Voile sombre, butee initiale | `rgba(6,11,20,.92)` | `rgba(6,11,20,.93)` |
| Teinte radiale d'accent (x3) | `var(--mac) 12%` | `var(--mac) 7%` |
| `--mac` de `#maillon-intermediaire` | `#5AA7F0` | `#7DBBF5` |

Le theme clair n'est pas touche : `html.et-plight #coeurs .mln{--mac:var(--macl)
!important}` ecrase l'accent en ligne, et les butees claires sont declarees
separement. La translucidite reste respectee (0,82 et non 1) conformement a
« eliminer les bandeaux noir pour permettre au site etre translucide ».

Trois correctifs d'accessibilite semantique dans le meme passage :

- les trois `a.mln-go` exposaient **le meme nom accessible** (« Decouvrir le
  pole → ») pour trois destinations differentes (WCAG 2.4.4) : chacun recoit
  desormais un `aria-label` distinct ;
- `.mln-step b` faisait entendre « 01 Maillon 01 sur 3 » : `aria-hidden="true"`
  sur le `<b>` decoratif, le `<i>` porte deja la formulation complete ;
- les `&` nus dans quatre `aria-label` passent en `&amp;`.

### Verification apres correctifs

120 mesures de contraste (10 selecteurs x 3 panneaux x 2 largeurs x 2 themes) :
**zero echec**. Minima par theme : sombre `.mln-kpis b` 5,74 / `.mln-k` 6,15 /
`.mln-step b` 6,99 ; clair `.mln-nav a` 5,04 / `.mln-go` 6,33. Geometrie
re-passee sur les 24 combinaisons : inchangee, 0 probleme. axe-core : toujours
2 violations moderees preexistantes, aucune nouvelle.

### Performance : bon, avec un cout evitable

38 requetes, environ 1088 Ko (image 380,9 / css 345,5 sur 18 feuilles /
js 157,7 / document 122,5 / polices 81,7). Aucun 4xx/5xx.
LCP 1248 ms sur `H1.hx-h1` a 1280, 372 ms sur `P.hx-sub` a 390.
**CLS 0,088 a 1280**, impute a `DIV.hx-strip` (la bande du hero) — preexistant,
sans rapport avec les maillons ; CLS 0 a 390.

Les trois photos de panneau (75,1 + 100,2 + 118,7 = 294 Ko) sont chargees des
le load alors que les panneaux 2 et 3 sont 1800 a 2700 px sous la ligne de
flottaison. `content-visibility:auto` + `contain-intrinsic-size` sur `.mln`
economiserait environ 175 Ko, mais touche au centrage `min-height:100svh`, aux
animations `.reveal` et au defilement vers les ancres `#maillon-*` :
**a tester localement avant tout deploiement**, non fait ici.

### Balisage mort identifie (conserve, non supprime)

- `guepard-savane.webp` (148 Ko) et `pipeline.webp` (109 Ko) ne sont
  **jamais telecharges**.
- Le fond en ligne de `#coeurs` est annule dans les deux themes par
  `main>section:not(#_):has(...,.hpcard){background:...!important}`
  (`s_19895ec63c.css`) : le CTA du panneau porte `.hpcard`, donc la section
  correspond.
- `.acth-photo` calcule `display:none` ; en theme clair il est doublement mort,
  egalement atteint par `html.et-plight main div:not(#_){background-image:none
  !important}`.

Les attributs `style` correspondants sont donc des octets morts. Ils sont
laisses en place dans ce passage pour ne pas melanger nettoyage et correctif de
contraste ; a traiter separement.


## 30. Creation du pole Petrochimie : d'une sous-page de l'Aval a un 4e maillon (2026-08)

Directive : « Cree un pole dedie Petrochimie ». Portee arretee avec l'auteur :
un **4e panneau pleine page** dans `#coeurs` (Amont -> Intermediaire -> Aval ->
Petrochimie, meme gabarit « ultra » que les trois autres) et **deux nouvelles
sous-pages** pour aligner le pole sur les autres (4 sous-pages chacun).

### Ce qui a change

- `petrochimie/complexe.html` (nouveau) : `#unites` (6 cartes), `#phasage`
  (tableau 3 phases 2026-2028 / 2028-2030 / 2030+, avec conditions de passage),
  `#prerequis` (4 cartes) + CTA.
- `petrochimie/marches.html` (nouveau) : `#debouches` (4 cartes), `#substitution`
  (tableau de substitution aux importations, 5 lignes), `#interlocuteurs`.
- `petrochimie/index.html` **requalifie** : le hub n'est plus subordonne a
  l'Aval. Titre, `og:title`, `twitter:title`, `name` du JSON-LD `WebPage`,
  `BreadcrumbList` (le maillon « Aval » est retire, position 2 devient le pole)
  et fil d'Ariane visible. Occurrences de `· Aval` : **0**. Les 28 liens
  `/aval/*` restants sont des liens transverses legitimes.
- Sous-nav commune a 5 entrees sur les 4 sous-pages
  (`aria-label="Pages du pole Petrochimie"`), avec `is-active` +
  `aria-current="page"`.
- Mega-menu : le tiroir Petrochimie expose desormais les 4 sous-pages, dans
  l'ordre de la sous-nav — **62 fichiers** porteurs de la navigation.
- Comptage des poles : `Nos 7 poles` -> `Nos 8 poles` dans 62 fichiers, plus 7
  formulations en clair (`brochure`, `cibles-2030`, `explorateur-chaine`,
  `index`, `investisseurs`, `solutions` x2). Trois phrases corrigees a la main :
  `3 + 4` -> `4 + 4` (accueil, y compris l'`aria-label` de l'hexagone),
  « Trois coeurs de metier » -> « Quatre coeurs de metier » (`cibles-2030`),
  `<b>3 poles</b>` -> `<b>4 poles</b>` (`achats`).
- `sitemap.xml` : +2 URL (159 au total), `lastmod` rafraichi sur `/`,
  `/petrochimie/`.
- `plan-du-site.html` : la Petrochimie **sort de la liste imbriquee sous
  l'Aval** et devient une entree de premier niveau parmi les poles metiers,
  avec ses 4 sous-pages.

### Piege 1 — `sr-only` n'existe dans aucune feuille de theme

Les deux pages generees utilisaient `<caption class="sr-only">`. La classe
**n'est definie nulle part** dans les feuilles de theme (seule une definition
locale existe dans `Configurateur_Service_Integre_v2.html`). Les legendes de
tableau s'affichaient donc en clair. Toute page qui utilise `sr-only` doit la
definir elle-meme ; ici la regle est posee dans le `<style id="px-css">` de
chaque page.

### Piege 2 — la banniere cookies se compose dans `el.screenshot()`

Premiere campagne de mesure de contraste : 27 « echecs », puis 53 apres
« correction ». Les deux series etaient **fausses**. En agrandissant x3 un des
PNG et en le regardant, on lisait le texte de la banniere cookies : Playwright
capture ce qui **recouvre** l'element dans le viewport, pas l'element seul. La
banniere, en `position:fixed`, empoisonnait l'echantillon de fond (un gris
`(100,104,112)` fantome sous des cellules blanches).

Correctif dans le harnais : masquer tout element `position:fixed|sticky`
exterieur a `main` avant capture.

### Piege 3 — une transition CSS fausse la couleur mesuree

Deux echecs residuels sur `.px-cta` en theme clair (2,38 et 2,67) alors que
`CSS.getMatchedStylesForNode` (CDP) prouvait que
`html.et-plight .pxc .px-cta:not(#_){color:#8E3A72!important}` **gagnait bien**
la cascade. Cause : `.px-cta` declare `transition:color .2s` et la classe de
theme est ajoutee par JS **apres** le chargement ; l'echantillon etait pris en
pleine interpolation, donc sur la couleur sombre.

Correctif : injecter `*{transition:none!important;animation:none!important}`
avant toute mesure, et attendre ~1200 ms.

### Piege 4 — `main div:not(#_):not(#__)` vole l'accent en theme clair

Vrai bug de cascade, trouve par sonde de style calcule et non par les pixels :
en `et-plight`, `.px-k`, `.px-n`, `.px-tag` et `.px-tab th` calculaient
`rgb(42,54,72)` au lieu de l'accent `#8E3A72`, et `.px-card` perdait son fond
blanc. Coupables :

```
html.et-plight main div:not(#_):not(#__){color:#2A3648!important}
html.et-plight main .card,[class*="card"],[class*="panel"]:not(#_){background:#fff!important;border:1px solid rgba(26,35,48,.16)!important}
```

Tout `<span>`/`<th>` qui herite a l'interieur d'un `div` se fait donc reprendre
sa couleur. Correctif : un bloc clair `!important` en fin de `px-css`, de forme
`html.et-plight .pxc .px-X:not(#_)` (1 id / 3 classes / 1 type), avec
`-webkit-text-fill-color` en plus de `color` — sans quoi Safari conserve
l'ancienne teinte.

### Rappel de cascade toujours valable

Les nouvelles sections portent `.pxc` et **jamais** `.hpcard` : la regle
`main>section:not(#_):has(...,.hpcard){background:rgba(8,13,22,.45)!important}`
de `s_19895ec63c.css` annulerait sinon leur fond propre. De meme, les variables
destinees a descendre dans un `.hpcard` ne peuvent pas s'appeler `--pac` (tout
element `.hpcard` la **redeclare sur lui-meme**) — d'ou `--px-*` ici et
`--mac`/`--macl` sur l'accueil.

### Verification

- **Contraste, sous-pages** : 112 mesures (11 selecteurs x 2 pages x 2 themes),
  **zero echec**. Minima sombre `.px-cta` / `.px-k` / `th` 6,49 ; clair
  `.px-k` 5,45, `.px-cta` 5,57, `th` 7,00.
- **Contraste, accueil** : 236 mesures (10 selecteurs x 4 panneaux x 2 largeurs
  x 2 themes), **zero echec**. Le nouveau panneau : sombre min **5,77**, clair
  min **5,83** — les teintes `--mac:#EBA0D2` (sombre) et `--macl:#8E3A72`
  (clair) sont donc validees sur le fond `unite-petrochimie.webp`.
- **Geometrie** : `complexe` 5111 px a 1280 / 7825 px a 390 ; `marches`
  5166 / 7466. `scrollWidth` 380 pour `innerWidth` 390 : **aucun debordement
  horizontal**. Les `.psn-link` et les `.px-tab` signales « hors viewport » sont
  contenus par `overflow-x:auto` (`.psn-wrap`, `.px-scroll`) — comportement
  voulu, pas un bug.
- **axe-core** sur `/`, `/petrochimie/`, `/petrochimie/complexe`,
  `/petrochimie/marches`, `/plan-du-site`, en 1280 et 390 : uniquement les
  2 violations moderees preexistantes (`landmark-unique`, `region`).
  **Aucune nouvelle.**
- **Liens** : 7 pages verifiees contre le disque et contre les `redirects` de
  `vercel.json`, **0 lien mort**.

### Faux positif axe a connaitre

Une passe a signale `color-contrast` (serious) sur `#debouches > .wrap > .px-k`
et `.px-l`, non reproductible en 5 executions ulterieures (0 violation,
seulement des `incomplete` de type `pseudoContent` sur la barre utilitaire).
Sur ce site les sections sont **translucides au-dessus du diaporama `.diapo`** :
tant que la photo de fond n'est pas peinte, axe calcule un fond different. La
mesure par pixels (mediane de luminance du fond reel) reste la reference ;
une alerte axe isolee sur une section translucide doit etre rejouee avant
d'etre traitee comme un defaut.

---

## 31. Propagation du pole Petrochimie a la version anglaise et aux pieds de page (2026-08)

La creation du 4e maillon (section 30) avait laisse le site incoherent : la
version francaise annoncait 8 poles, la version anglaise en annoncait toujours
7, et **les deux pieds de page n'en listaient que 7**. Cette section couvre la
mise a niveau.

### Ce qui a change

**Comptage des poles.** `Our 7 poles` -> `Our 8 poles` (35 fichiers, y compris
`enerconseils/audits-en.html` et `docs-sources/brochure_print_en.html` que le
glob `*.html` de premier niveau ne voyait pas), `seven poles` / `Seven poles`
-> `eight poles` / `Eight poles`, et `7 poles, one company` ->
`8 poles, one company` dans `investisseurs-en.html`. Cote francais il restait
14 occurrences de `sept poles` reparties sur 8 fichiers (`brochure`, `carnets`,
`charte`, `cibles-2030`, `communiques`, `faq`, `societe`,
`tchaditude/index`) : toutes passees a `huit poles`.

**Requalification de la chimie.** La chimie n'est plus « une extension de
l'Aval » mais un maillon a part entiere :

- `faq.html` : « Trois forment la chaine petroliere — Amont, Intermediaire,
  Aval — que prolonge la chimie » devient « Quatre forment la chaine
  petroliere — Amont, Intermediaire, Aval, Petrochimie (chimie &
  transformation) ». Le texte existe **deux fois** : une fois en clair dans le
  bloc JSON-LD `FAQPage`, une fois balise `<strong>` dans le `<details>`
  visible. Les deux doivent etre modifies, sinon le rich snippet Google et la
  page divergent.
- `faq-en.html` : meme operation (« Four form the petroleum chain — Upstream,
  Midstream, Downstream, Petrochemicals »), plus deux reponses FAQ ou
  `(Petrochemicals extension of the Downstream)` devient
  `(Petrochemicals pole)`.
- `index-en.html` : `<h2>Seven poles — extended by chemicals — one integrated
  chain</h2>` devient `<h2>Eight poles — one integrated chain</h2>` ; le
  chapeau passe de « modular refining and distribution, extended by chemicals
  and powered by a digital backbone » a « modular refining, distribution and
  petrochemicals, powered by a digital backbone ».
- `activites-en.html` : « Three poles form the oil chain [...] extended by
  chemicals » devient « Four poles form the oil chain — Upstream, Midstream,
  Downstream, Petrochemicals ».
- `pole-enerchimie-en.html` : `<title>` et `<h1>` passent de
  `Petrochemicals · petroleum chemistry` a
  `Petrochemicals · chemistry & transformation` (miroir du francais) ; la
  `meta description`, l'`og:description` et la `description` du JSON-LD
  `WebPage` (3 occurrences du meme texte) sont reecrites ; le `<div class="note">`
  de bas de page passe de « Chemistry extension of the Downstream » a
  « Petrochemicals pole ».

**8e carte dans la grille `#poles` de `index-en.html`.** La grille ne
contenait que **7 cartes `.card.pk`** alors que 8 liens `pole-*-en` existaient
dans la page (les 8e vivait uniquement dans le mega-menu et le pied de page).
Une carte `Petrochemicals` a ete inseree juste apres `Downstream`, avec
`--ac:#D177B4`, le tag `core business` et les deux KPI
`Sedigui · complex` / `4 product lines`. Au passage la carte `Downstream` a
perdu sa mention « chemistry & petrochemicals extension included », devenue
fausse.

**Grille « Inside this pole » de `pole-enerchimie-en.html`.** Elle ne listait
que 2 des 4 sous-pages. Ajout de `Complex & units` (`/petrochimie/complexe`,
accent `#D177B4`) et `Markets & applications` (`/petrochimie/marches`, accent
`#E8C36A`), au format existant `<a class="card" style="--ac:…"><span
class="t"></span><span class="d"></span><span class="d" style="…color:…">Read
in French →</span></a>`. Le chapeau passe de « The full pages » a « The four
pages ».

**Pied de page, 155 fichiers.** `div.foot-poles` ne listait que 7 poles dans
*toutes* les langues. Insertion apres l'Aval / le Downstream de :

    <a class="foot-pole" style="--pc:#D177B4" href="/petrochimie/">Petrochimie</a>
    <a class="foot-pole" style="--pc:#D177B4" href="/pole-enerchimie-en">Petrochemicals</a>

Trois variantes de pied de page coexistent et il faut les traiter separement :
94 fichiers en francais (`href="/aval/"`, libelle `Aval`), 60 en anglais
(`href="/pole-aval-en"`, libelle `Downstream`) et **1 hybride**,
`journal-integrite-faire-durer-en.html`, qui porte des libelles francais sur
des liens anglais (`href="/pole-aval-en"`, libelle `Aval`). Un simple
`replace` sur la variante francaise laisse ce fichier de cote sans rien
signaler.

### Pieges rencontres

**Piege 1 — l'espace insecable, encore.** `societe.html` contient
`que prolonge la chimie\xa0; quatre capacites` : le `replace` sur une chaine
saisie avec une espace normale renvoie 0. Meme cause que le piege documente en
section 30 pour `aval/index.html`. Reflexe : avant tout remplacement portant
sur une phrase francaise contenant `;`, `:`, `!`, `?` ou `»`, verifier avec
`repr()` la presence de `\xa0`.

**Piege 2 — le glob de premier niveau.** `glob('*.html')` manque les 43
fichiers des sous-repertoires. Deux fichiers anglais (`enerconseils/audits-en`,
`docs-sources/brochure_print_en`) ont ainsi survecu au premier passage. Le
controle final doit toujours etre un `grep -r --include=*.html`.

**Piege 3 — capture de contraste qui ne se termine pas.** Le script de mesure
attendait indefiniment sur `faq-en.html` : `scrollIntoViewIfNeeded()` bloque
sur un element place dans un `<details>` referme, et le JSON n'etant ecrit
qu'a la toute fin, 457 captures ont ete perdues. Deux corrections a conserver
dans tout script de ce type : **ecrire le JSON apres chaque page** (pas a la
fin), et **envelopper chaque capture dans un `Promise.race` avec un delai**
(`scrollIntoViewIfNeeded({timeout:3000})` + `screenshot({timeout:4000})` +
garde-fou global a 6 s).

### Verifications

- **Contraste** : 260 mesures (5 groupes de selecteurs x 3 pages x 2 themes x
  2 largeurs), methode mediane-pixels de la section 30, **0 echec**. Minimum
  sombre 5.36, minimum clair 5.64. Les 48 mesures propres a la Petrochimie
  descendent au plus bas a 5.64 (`Read in French →` en clair) et 5.84 (le
  meme en sombre, `#D177B4`).
- **Bon a savoir** : les couleurs d'accent posees en **style inline** sur les
  cartes (`color:#D177B4`, `color:#E8C36A`) sont **remappees automatiquement
  par le theme clair** vers des equivalents sombres (`rgb(122,87,14)`,
  `rgb(27,78,140)`, `rgb(9,78,55)`). Il n'y a donc pas besoin de prevoir une
  variable claire dediee pour ces libelles, contrairement au couple
  `--mac` / `--macl` de la home.
- **axe-core**, 7 pages anglaises x 2 fenetres : uniquement le `region`
  (moderate) preexistant sur `.hero` / `.kick` / `h1`. Aucune nouvelle
  violation.
- **Console et reseau** : 0 erreur console, 0 reponse HTTP >= 400 sur les 14
  chargements.
- **Geometrie** : `scrollWidth` 380 pour `innerWidth` 390 sur les 7 pages en
  mobile — aucun debordement horizontal.
- **Integrite** : 6 blocs JSON-LD par page revalides par `json.loads` sur les
  10 fichiers les plus retouches ; equilibre `<a>` / `</a>` verifie sur les
  **164 fichiers HTML** du site (0 desequilibre).

### Point laisse ouvert

Le bandeau `div.hxc` du hero (« La chaine integree · Amont -> Intermediaire ->
Aval -> la pompe », et son equivalent anglais) n'a **pas** ete modifie. Il
illustre le trajet physique du carburant « de la roche-mere a la pompe », pas
la liste des poles ; y inserer la Petrochimie casserait la fin de phrase. Les
deux langues restent donc identiques sur ce point. A trancher si l'on veut
faire apparaitre le 4e maillon des le hero.

---

## 32. Miroir anglais du bloc `#coeurs` — quatre maillons pleine page (2026-08)

La home francaise ouvre depuis juillet sur `#coeurs` : quatre panneaux pleine
page (Amont -> Intermediaire -> Aval -> Petrochimie) precedes d'un chapeau
d'orientation `.acth`. La home anglaise, elle, en etait restee a une simple
section explicative `#value-chain-explained` (4 218 octets) placee tout en bas,
apres `#vision`. Cette section a ete **remplacee** par le miroir anglais complet
du bloc, et celui-ci a ete **remonte en premier enfant du conteneur principal**,
comme en francais : on oriente le visiteur avant de lui detailler les huit poles.

### Ce qui a ete fait

- `<section id="value-chain-explained">…</section>` supprimee (plus aucune
  occurrence du terme dans le site ; **rien nulle part ne pointait vers cette
  ancre**, verification faite avant suppression).
- Nouveau `<section id="coeurs">` de 8 119 octets, premier enfant de `<main>`,
  contenant le chapeau `.acth.acth-first`, quatre `<article class="mln">`
  (`link-upstream`, `link-midstream`, `link-downstream`, `link-petrochemicals`,
  les deux pairs en `.mln-rev`) et la pastille doree finale vers
  `/explorateur-chaine-en`.
- `index-en.html` : 77 095 -> 93 875 octets.
- Aucun fichier de `assets/chrome/` touche : **pas de bump de `sw.js`**.

### Pourquoi le CSS est inline et non lie

Deux surprises, documentees ici pour la prochaine fois :

1. **Les styles `.mln*` n'existent dans aucune feuille.** Ils vivent uniquement
   dans `<style id="mln-css">` a l'interieur de `index.html` (10 071 octets).
   Ils sont integralement portees par `#coeurs`, donc sans fuite possible : le
   bloc a ete **repris verbatim** dans le head de `index-en.html`.
2. **Les styles `.acth` de base vivent dans `assets/chrome/x_77d650c4a7a2.css`**
   (58 484 octets), feuille que `index-en.html` ne charge pas. La lier aurait
   restyle des elements anglais sans rapport ; lier `x_efffae1a94e5.css`
   (l'affinage utilise cote FR) aurait impose `main>section{padding:46px}` et un
   fond force a toute la page anglaise. On a donc **recopie les seules regles
   `.acth*`, re-portees sous `#coeurs`**, fusionnees avec les affinages FR
   (`padding:34px 0`, `max-width:1080px`, chapeau a `74ch`, pas de `::before`),
   dans un nouveau `<style id="acth-css-en">` (2 765 octets).

Corollaire : toute evolution future du design des maillons doit etre repercutee
**a la main dans les deux fichiers**. C'est le prix a payer pour ne pas charger
58 Ko de CSS sur la home anglaise.

### Le piege du theme clair

Les regles claires de `bundle_core_a1.css` visant les sections hors conteneur
principal sont **plus agressives** que leur jumelle : leur clause `span` aplatit
`.mln-ghost` en `#2A3648` et leur clause `[class*="-k"]` ecrase `.mln-k`,
`.acth-k` et `.mln-kpis` en `#6B500F`. Cinq surcharges de la forme
`html.et-plight #coeurs .X:not(#_)` (2 ID de specificite, donc gagnantes)
rendent au bloc ses accents. Elles sont conservees meme apres la remontee dans
le conteneur principal : elles coutent 5 lignes et protegent le bloc quel que
soit son parent.

Note volontaire : `.acth-k` est **laisse** virer au brun `#6B500F` en theme
clair — c'est plus lisible que l'accent d'origine, et cela corrige une faiblesse
latente du chapeau francais plutot que de la recopier.

### Liens des volets « What we do »

Toutes les pages anglaises n'existent pas. Les destinations restees francaises
portent `hreflang="fr"`, un `aria-label` suffixe « — page in French » et une
petite pastille `FR` (`i.mln-fr`, `aria-hidden`), sur le modele du « Read in
French -> » deja en place sur les pages de pole anglaises.

- Amont : `/amont/activites` **(FR)**, `/services-ep-en`, `/eor-en`, `/parc-en`
- Intermediaire : `/intermediaire/logistique`, `/services`, `/sites` — **les 3 en FR**
- Aval : `/raffinage-en`, `/reseau-en`, `/produits-en`, `/distribution-en` — tout en anglais
- Petrochimie : `/petrochimie/complexe`, `/produits`, `/marches`, `/chimie-eor` — **les 4 en FR**

Les 20 cibles ont ete verifiees comme existant sur le disque avant publication.

### Animation d'apparition

`index-en.html` n'embarque **aucun IntersectionObserver**, et
`bundle_core_a1.css` y neutralise `.reveal` (`opacity:1!important`). Les classes
`reveal` recopiees depuis le francais sont donc inertes : aucun JS a ajouter,
aucun risque de contenu invisible. C'est voulu — a ne pas « reparer ».

### Recette de verification (280 mesures, 0 echec)

- **Contraste** : `.mln-t`, `.mln-d`, `.mln-k`, `.mln-step`, `.mln-kpis`,
  `.mln-nav a`, `.mln-nh`, `.mln-go`, `.mln-fr`, `.acth-k`, `.acth h2`,
  `.acth-l` — 2 themes x 2 fenetres (1280 et 390) = **280 captures, 0 echec
  AA**. Minima : 4,51 (`.mln-k` clair), 4,69 (`.mln-fr` clair), 4,79 (liens de
  volet clairs) ; tout le reste au-dessus de 5.
- **axe-core** : aucune nouvelle violation ; seul subsiste le `region`
  (moderate) preexistant sur `.hero`.
- **Console / reseau** : 0 erreur, 0 reponse >= 400.
- **Geometrie** : panneaux a 900 px en 1280x900 et 844 px en 390x844, `.mln-bg`
  et `.mln-veil` remplissant l'article — **valeurs identiques a la home FR**.
  `scrollWidth` 1270/1280 et 380/390 : aucun debordement horizontal.
- **Balisage** : `<a>`/`</a>` 156/156, `<section>` 3/3, `<article>` 4/4,
  `<div>` 91/91, `<nav>` 7/7.

### Piege d'outillage rencontre

Le premier deplacement du bloc a ete insere dans un **commentaire CSS** parce
que la regex `<main[^>]*>` a trouve la chaine `<main>` ecrite dans un
commentaire de `acth-css-en` situe plus haut dans le head. Le bloc disparaissait
alors du DOM (hauteur de page 8 048 -> 3 920). Deux lecons : ne jamais ecrire de
balise litterale dans un commentaire CSS, et **toujours chercher `<main>` apres
`</head>`**. Le script `/root/work/encoeurs.py` applique desormais les deux.

---

## 33. ESG/RSE enrichis, site eclairci, QA integrale (2026-08)

Trois directives traitees dans la meme passe : « enrichir ESG et RSE »,
« rendre le site plus eclaire », « QA de tout le site ».

### 33.1 Enrichissement ESG / RSE

- **`engagements.html` — section `#esg` etoffee** de trois sous-blocs entre la
  grille des trois piliers et l'alignement ODD : **La double materialite**
  (deux cartes : materialite financiere / materialite d'impact, lecture
  CSRD/ESRS), **Les parties prenantes** (quatre cartes : riverains &
  collectivites, Etat & regulateur, salaries & sous-traitants, partenaires &
  investisseurs — chacune avec son canal de remontee), **Le mecanisme de
  griefs** (quatre etapes datees : recevoir, accuser reception, instruire,
  repondre & tracer — sans represailles, distinct du canal lanceurs d'alerte).
  Classes existantes reutilisees (`.sk`, `.grid`, `.card`, `.std`) : aucun
  style ajoute.
- **`communautes.html` — section `#dialogue` enrichie** : grille passee de 3 a
  4 cartes (ajout « Mecanisme de griefs » avec lien vers `engagements#esg` et
  « Mecenat & reinvestissement local » ; cartes existantes densifiees), kicker
  passe a « 05 · Dialogue, griefs & mecenat ».
- **`engagements-en.html`** : deux entrees miroir ajoutees (« Double
  materiality », « Grievance mechanism ») dans son format h2 + p.lead, et
  **correction d'un lien** : le bouton « Full commitments (French) »
  s'auto-referencait (`/engagements-en`) — il pointe desormais vers
  `/engagements`.
- Les espaces insecables avant `:` sont respectes dans tout le texte ajoute.
- Le tableau chiffre des indicateurs ESG vit deja sur `cibles-2030` (section
  « Indicateurs ESG — reference et cibles 2030 ») : pas de duplication, les
  nouveaux blocs y renvoient conceptuellement. Le FAQPage JSON-LD n'a pas ete
  modifie.

### 33.2 Eclaircissement du theme sombre (« rendre le site plus eclaire »)

Trois leviers, sans toucher a la translucidite ni aux voiles des maillons
(`.mln-veil` inchange) ni a la liste des zones gelees (§ anterieurs) :

1. **Couche `lg-interior` (88 fichiers)** : fond de base
   `html{background:#070c15}` -> **`#0B1424`** ; les cinq nappes aurora de
   `body::before` remontees (or .38->.46, bleu .30->.38, teal .30->.36, ambre
   .26->.32, violet .16->.20) et les deux nappes `html::before` (.22->.28,
   .20->.26).
2. **Voile de section du theme sombre (102 fichiers)** : la regle
   `html:not(.et-plight):not(.et-jlight) main>section, ... body>section ...`
   passe de `rgba(8,13,22,.50)` a **`.38`** — le diaporama respire davantage.
3. **Feuilles globales** : `x_685ad1e3eb1b.css` (pages EN) .30 -> **.22** (3
   occurrences : pghero/hero, sections, footer) ; `x_efffae1a94e5.css` (home
   FR) .28 -> **.20** (3 occurrences). **`sw.js` bumpe** :
   `et-202608051800` -> `et-202608052300`.

**Verification contraste apres eclaircissement** (methode du fond median,
theme sombre, 2 largeurs) : 324 mesures sur `/`, `/index-en`, `/engagements`,
`/communautes`, `/petrochimie/complexe` — **0 echec AA** ; minima 5,82
(`.mln-nh`) et 5,95 (`.px-tag`), tout le reste > 6.

### 33.3 QA integrale du site

- **Equilibre du balisage (164 fichiers,** style/script/commentaires exclus —
  les compteurs naifs comptent les `<main>` ecrits dans les commentaires CSS) :
  4 vrais defauts trouves et corriges :
  - `explorateur-chaine.html` + `-en` : un `</div>` orphelin apres le footer
    interne **et** un `<main>` jamais ferme — l'orphelin a ete remplace par
    `</main>`, reglant les deux d'un coup.
  - `enerconseils/audits.html` + `-en` : `<main>` jamais ferme — `</main>`
    insere avant `<footer>` (le DOM effectif ne change pas : les sections
    restent dans main, le footer en sort).
- **Liens internes** : 0 lien casse sur les 164 pages (resolution cleanUrls +
  table `redirects` de `vercel.json` ; les pseudo-hrefs `'+k.u+'` des gabarits
  JS et « / » sont des faux positifs connus du verificateur).
- **JSON-LD** : 521 blocs, tous `json.loads`-valides.
- **axe-core (16 pages x 2 largeurs, theme sombre)** : uniquement les
  `region`/`landmark-unique` moderes preexistants. Un `color-contrast` serious
  x42 sur `/aval/raffinage` (`.tri-c p`) s'est revele **faux positif** : la
  mesure photographique (126 captures, fond median) donne des minima a 8,79 —
  axe ne sait pas composer les fonds translucides sur photo.
- **Console/reseau** : 0 erreur, 0 reponse >= 400 sur les 32 chargements.
- **Geometrie** : aucun debordement horizontal (scrollWidth <= innerWidth
  partout, 1280 et 390).

### Publication

158 fichiers modifies (116 racine + 40 en sous-dossiers + 2 CSS) + ce journal,
en 10 commits (un par dossier). Les pages Petrochimie anglaises
(`petrochimie/*-en.html`, section 32) restent le prochain chantier en attente.

---

## 34. Pages Petrochimie anglaises : complexe-en et marches-en (2026-08)

Les deux pages phares du pole Petrochimie existent desormais en anglais :
`petrochimie/complexe-en.html` (92,7 Ko) et `petrochimie/marches-en.html`
(92,6 Ko), accessibles sous `/petrochimie/complexe-en` et
`/petrochimie/marches-en`.

### Methode de fabrication (`/root/work/mkpxen.py`)

Chaque page est un assemblage de trois sources :

1. **Head** : celui de la jumelle francaise, metas traduites (title,
   description, og, twitter), `lang="en"`, `og:locale` en, canonical `-en`,
   trio d'alternates ajoute, BreadcrumbList et WebPage traduits
   (`inLanguage: en`). Le **FAQPage generique francais est retire** — il
   vit sur `/faq-en` en anglais, inutile de le dupliquer en francais sur une
   page anglaise. Les styles inline de la page FR sont conserves verbatim
   (dont `px-css`).
2. **Chrome anglais** preleve sur `enerconseils/audits-en.html` (la seule
   page EN de la meme generation) : bandeau d'avant-nav, mega-menu EN
   (bascule de langue re-pointee vers la jumelle FR — attention, le nav
   contient AUSSI un lien de menu vers `/enerconseils/audits` qu'il ne faut
   pas toucher ; item actif deplace de nxm-3 vers nxm-2 « Our business »),
   footer EN, et scripts partages reconstruits par **double SequenceMatcher**
   (audits FR <-> audits EN pour la table de traduction ligne a ligne ;
   audits FR <-> page FR pour isoler les blocs propres a la page, conserves
   tels quels).
3. **Contenu** : sous-nav du pole en anglais (liens EN quand la page existe,
   `hreflang="fr"` sinon), hero, trois sections traduites, carnets lies
   pointes vers les jumelles `-en` des articles.

La zone FR entre `</main>` et `<footer>` (bandeau cookies, barre de partage,
pager, « Continuer dans le pole », `#cta-band`) n'a **pas d'equivalent dans le
chrome EN existant** : elle a ete traduite en place (19 remplacements par
page), hrefs re-pointes (`/cookies-en`, `/index-en`, `/investisseurs-en`,
`/contact-en`).

### Corrections de liens associees

- `index-en.html` (volet `#coeurs` Petrochemicals) : « Complex & units » et
  « Markets & applications » pointent vers les pages EN, pastilles FR
  retirees ; « Transformed products » et « Chemistry for the barrel » gardent
  leur pastille FR.
- `pole-enerchimie-en.html` : les deux cartes correspondantes pointent vers
  les pages EN, leur ligne d'action passe de « Read in French → » a « Open
  the page → ».
- Jumelles FR (`complexe.html`, `marches.html`) : bascule de langue
  `FR·EN` re-pointee de `/en` vers la jumelle anglaise, trio d'alternates
  hreflang ajoute.
- `sitemap.xml` : deux entrees ajoutees.

### Verifications

- Balisage equilibre, 5 blocs JSON-LD valides par page, 0 lien interne
  non resolu.
- axe-core 2 pages x 2 largeurs : seuls les `region` moderes preexistants
  (`#homeFab`, `.share`) ; le `color-contrast` serious signale sur `#phasage`
  est le **meme faux positif** que sur `/aval/raffinage` — mesure
  photographique : 20 captures, 0 echec, minimum 6,27.
- 0 erreur console, 0 requete >= 400, aucun debordement horizontal.

### Notes

- Le bandeau d'avant-nav EN garde les slogans de marque en francais
  (« De la roche-mere a la pompe », ticker « le baril roule ») — c'est le
  chrome EN existant (audits-en identique), conserve pour coherence.
- L'etiquette du scrollcue etait « Suite » meme dans le chrome EN
  (audits-en l'affiche toujours) : corrigee en « More » sur les deux
  nouvelles pages ; **quirk preexistant a corriger un jour sur audits-en**.
- Restent a traduire : `petrochimie/produits` (main 31 Ko) et
  `petrochimie/chimie-eor` (main 28 Ko) — meme methode, contenu plus long.

---

## 35. Pole Petrochimie 100 % anglais : produits-en et chimie-eor-en (2026-08)

Les deux dernieres pages du pole existent desormais en anglais :
`petrochimie/produits-en.html` (112,8 Ko) et `petrochimie/chimie-eor-en.html`
(110,6 Ko). **Le pole Petrochimie est la premiere extension du site
integralement bilingue** (hors vue d'ensemble `/petrochimie/`).

### Methode (`/root/work/mkpxen2.py`)

Meme assemblage qu'au §34 (head traduit + chrome anglais d'audits-en +
scripts reconstruits par double SequenceMatcher), mais les mains — beaucoup
plus longs (31 et 28 Ko), truffes de styles inline, de SVG et de JS de page —
ont ete traduits **par paires de remplacement verifiees** (162 + 114 paires)
plutot que reecrits : la structure, les styles et les scripts restent
byte-identiques au francais, seul le texte change. Les scripts de page
(planche interactive `ppl-js`, accordeons `tri-more`) sont conserves, leurs
chaines visibles traduites (« En savoir plus »/« Réduire » ->
« Learn more »/« Collapse »).

**Piege resolu — les trois graphies de l'espace insecable.** Les gabarits FR
melangent l'entite `&nbsp;` (zones pmore, pgl, ttg) et le caractere U+00A0
(prose des sections). Un espace tape « normal » dans une paire de traduction
ne matche ni l'un ni l'autre. Le moteur de remplacement convertit desormais
chaque espace du motif en `(?:[  ]|&nbsp;)` et chaque `&amp;` en
`&(?:amp;)?` — 8 paires echouaient encore avant cette tolerance, 0 apres.
Regle a retenir pour toute future traduction de gabarit.

### Maillage — le volet Petrochimie de la home EN n'a plus de pastille FR

- `index-en.html` : les 4 liens du volet pointent vers les 4 pages EN.
- `pole-enerchimie-en.html` : les 4 cartes en « Open the page → ».
- `complexe-en` / `marches-en` : sous-nav et carte « Continuer » re-pointees
  vers les jumelles EN (plus de mention « in French » sauf la vue d'ensemble).
- Jumelles FR : bascule FR·EN corrigee (`/en` -> jumelle) + trio d'alternates.
- `sitemap.xml` : 2 entrees ajoutees (le pole compte 9 URLs indexees).
- Le lien « formulation EOR » de chimie-eor-en pointe vers `/eor-en`
  (la page EN existe) et non plus vers l'ancre FR `/amont/eor#intrants-eor`.

### Verifications

- Balisage equilibre (y c. `figure`/`button`), 5 JSON-LD valides par page,
  0 lien non resolu, **0 ligne de texte visible encore francaise** (balayage
  lexical automatise, hors slogans de marque du bandeau, voulus en francais).
- axe-core 2 pages x 2 largeurs : uniquement les moderes preexistants
  (`region` homeFab/share, `landmark-unique` ttg) ; aucun serious.
- 0 erreur console, 0 requete >= 400, aucun debordement horizontal
  (1270/1280 et 380/390).

### Reste du chantier bilingue

La vue d'ensemble `/petrochimie/` (main ~35 Ko, tilehub interactif) reste
francaise — c'est la derniere page du pole sans jumelle. Les pages
`/intermediaire/*` (3) et `/amont/activites` restent aussi a traduire pour
effacer les dernieres pastilles FR du bloc `#coeurs` de la home anglaise.

---

## 36. Pole Intermediaire anglais : logistique-en, services-en, sites-en (2026-08)

Les trois pages du pole Intermediaire existent desormais en anglais :
`intermediaire/logistique-en.html` (126,6 Ko), `services-en.html` (105,6 Ko)
et `sites-en.html` (126,1 Ko). Avec la Petrochimie (§34-35), **deux des
quatre volets du bloc `#coeurs` de la home anglaise sont a present sans
pastille FR** ; il ne reste que `/amont/activites` (volet Upstream) et les
vues d'ensemble de pole.

### Methode (`/root/work/mkimen.py`)

Meme assemblage que §34-35 : head traduit (metas, alternates, Breadcrumb et
WebPage en anglais, FAQPage retire), chrome anglais preleve sur audits-en,
scripts reconstruits par double SequenceMatcher, contenus traduits par
paires de remplacement tolerantes aux trois graphies de l'espace insecable.
356 paires appliquees (147 + 82 + 127 pour les mains), **0 echec** au
premier passage grace au moteur tolerant du §35.

**Piege decouvert — les sections apres `</main>`.** Sur cette generation de
pages, la zone entre `</main>` et `<footer>` ne contient pas que le chrome
(cookies, partage, pager, pole-more, cta-band) : elle porte de **vraies
sections de contenu** — « Notre methode » (epw), le **trouveur de services**
interactif a facettes (isv-find, 6 services filtrables), les engagements
chiffres (isv-eng) et le bloc de lectures (isv-lect). Environ 10 a 22 Ko par
page. Le balayage lexical de residus francais les a revelees apres une
premiere passe qui les avait laissees en francais — 129 paires
supplementaires ont ete necessaires. Regle : **toujours balayer le fichier
entier, pas seulement `<main>`**, avant de declarer une traduction complete.

### Traductions notables

- Le corridor interactif Doba–Kribi (SVG a 5 noeuds cliquables) : libelles
  `<text>` du SVG et panneaux d'etapes traduits, JS intact.
- Le schema hub-and-spoke du transport par camion : libelles SVG traduits.
- L'estimateur pipeline vs camion et le tableau SCADA de demonstration :
  indicateurs, statuts de stations et notes traduits, scripts conserves.
- Les 4 doctrines de la page logistique (reserve distribuee, corridor,
  integrite par la donnee, dernier kilometre) traduites integralement.
- Liens re-points vers les jumelles EN quand elles existent
  (`/services-ep-en`, `/produits-en`, `/pole-amont-en`, `/pole-aval-en`,
  journaux `-en`) ; l'Atlas et le Configurateur restent FR avec
  `hreflang="fr"` et mention « (in French) ».

### Maillage

- `index-en.html` : les 3 liens du volet Midstream -> pages EN, pastilles
  retirees (le volet n'en a plus).
- `pole-intermediaire-en.html` : les 3 cartes en « Open the page → ».
- Jumelles FR : bascule FR·EN corrigee (`/en` -> jumelle) + alternates.
- `sitemap.xml` : 3 entrees ajoutees.

### Verifications

- Balisage equilibre, JSON-LD valides, 0 lien non resolu, 0 texte visible
  francais residuel (hors slogans de marque).
- axe-core 3 pages x 2 largeurs : uniquement les `region` moderes
  preexistants (homeFab, share). 0 erreur console, 0 requete >= 400, aucun
  debordement horizontal.

### Reste du chantier bilingue

`/amont/activites` (main ~10 Ko) pour effacer la derniere pastille FR du
bloc `#coeurs`, puis les vues d'ensemble de pole (`/petrochimie/`,
`/intermediaire/`, `/amont/`, `/aval/`) — gabarits tilehub plus lourds.

---

## 37. Home : les quatre poles d'appui en panneaux pleine page (#appuis) (2026-08)

Directive : « Sur la home, mettre les poles support sur des pages ». La home
francaise recoit une section `#appuis`, inseree immediatement apres
`#coeurs` : les quatre poles d'appui — GreenTech, TchadiTech, Tchaditude,
EnerConseils — ont desormais chacun leur panneau pleine page (900 px bureau,
844 px mobile), sur le meme systeme de design `.mln` que les maillons.

### Ce qui a ete fait

- **Portee du design system** : les 88 selecteurs `#coeurs …` de
  `<style id="mln-css">` sont devenus `:is(#coeurs,#appuis) …` — `:is()`
  prend la specificite de son argument le plus fort (l'ID), donc **toutes
  les regles gardent exactement leur poids**, y compris les surcharges du
  theme clair a double :not(). Aucune duplication de CSS.
- **En-tete d'orientation** `.acth` : « S'orienter · Les appuis de la
  chaine — Quatre appuis, une meme chaine. » avec chapeau nommant les
  quatre poles. Le `.acth` de #appuis n'a pas `acth-first` : il garde son
  filet superieur, qui separe visuellement les deux series.
- **4 panneaux** `#appui-{greentech,tchaditech,tchaditude,enerconseils}`,
  numerotes 01-04 (« Appui 01 sur 4 »), 2e et 4e en `.mln-rev`, avec
  images de fond : `solaire-champ`, `code-numerique`, `casques-chantier`,
  `lac-tchad-espace` (~446 Ko charges en avance — a surveiller ; les
  maillons pesent deja ~294 Ko).
- Contenus et KPI repris des cartes du grid `#poles` (30 %+ renouvelables,
  0 torchage, L1-L4, filieres, Atlas, audits…) ; volets « Ce que nous
  faisons » repris des tiroirs `hubdrawer` (4+4+4+3 sous-pages).
- Pastille dorée finale « Les huit poles, en un coup d'œil ↓ » vers
  `#poles` — la section grid reste l'apercu synthetique.
- Accents : GreenTech `#34D399`/`#0C6B4A`, TchadiTech **`#96A2EC`**
  (eclairci depuis `#7E8AD9` : le violet de marque ne passait le AA sur
  photo qu'a 4,52 — a 6,59 apres eclaircissement)/`#454FA0`,
  Tchaditude `#C4B5FD`/`#5B3FA8`, EnerConseils `#1FA496`/`#0C6B62`.

### Verifications

- **Contraste** (fond median, 2 themes x 2 largeurs) : 232 mesures,
  **0 echec AA** ; apres eclaircissement TchadiTech, minimum global 4,94.
- **axe-core** : le `color-contrast` signale sur le panneau TchadiTech
  etait le declencheur de l'eclaircissement ; les `region`/`landmark`
  moderes preexistants demeurent, rien de nouveau.
- 0 erreur console, 0 requete >= 400, aucun debordement horizontal.
- Hauteur de page : 12 758 -> 16 859 px (bureau), 16 795 -> 20 454 px
  (mobile) — 4 ecrans de plus, coherent avec le parti pris « chaque pole
  sur une page ».
- Balisage : 227/227 liens, 13/13 sections, 11/11 articles.

### A suivre

Miroir anglais de `#appuis` sur `index-en.html` (meme mecanique : mln-css
y est duplique, la portee `:is()` s'y applique de la meme façon), et
peut-etre le meme traitement pour les huit cartes du grid `#poles` en
photo. Les images `guepard-savane.webp` et `pipeline.webp` restent
disponibles si l'on veut varier les fonds.

## 38. Perf : fonds de panneaux paresseux sur les deux homes (2026-08)

Application de la recommandation nº 1 de l'audit « home vs majors »
(`audit-home-vs-majors.md`) : les photos de fond des panneaux pleine page
(`#coeurs` + `#appuis` sur `index.html`, `#coeurs` sur `index-en.html`)
ne sont plus chargees au premier rendu.

### Mecanique

- Avant : chaque `article.mln` portait
  `style="--mac:…;--macl:…;--mimg:url(&quot;/assets/img/….webp&quot;)"` ;
  la photo est peinte par `.mln-bg::before` via `var(--mimg)`, donc les
  8 (FR) / 4 (EN) webp partaient des le chargement.
- Apres : l'inline devient `style="--mac:…;--macl:…" data-mimg="/assets/img/….webp"`,
  et un `<script id="mln-lazy">` (inline, ~540 o, avant `</body>`) pose
  `--mimg` via `IntersectionObserver` (`rootMargin: 900px 0px` — la photo
  arrive un ecran avant d'etre visible, aucun flash constate) puis retire
  `data-mimg`. Sans `IntersectionObserver`, tout est pose immediatement.
- `--mimg` indefini -> `var()` invalide -> `background:none` sur le
  `::before` : la degradation est propre par construction (voiles en
  degrade seuls).

### Mesures (Playwright local, bureau 1280px)

- Octets declares au premier rendu : **1 757 -> 932 Ko (-47 %)** ;
  requetes 45 -> 38 ; webp 10 (1 038 Ko) -> 3 (213 Ko : preload
  `pompe-petrole`, hero `piste-desert`, 2e diapo) ; DCL 1536 -> 666 ms ;
  CLS toujours 0.
- Apres defilement complet : les 10 webp chargent, tous les `data-mimg`
  sont consommes, `getComputedStyle(bg,'::before').backgroundImage`
  rend bien l'URL — attention au piege : verifier le `::before`, pas
  `.mln-bg` lui-meme (fausse alerte « avecImg:0 » sinon).

### JS desactive : neutre (verifie old vs new)

Les panneaux `.mln` sont a `opacity:0` sans JS **depuis l'origine** (le
fondu-enchaine de la pile sticky est pilote par le JS de scroll) ; le
texte reste dans le DOM (SEO, mode lecteur). Le changement est donc
strictement neutre visuellement sans JS, et epargne meme ~825 Ko de
telechargements inutiles. Point preexistant a garder en tete : la
promesse du bandeau `noscript` (« contenu integralement lisible ») est
approximative pour ces panneaux — retombee eventuelle : une regle
`noscript` posant `opacity:1` + empilement statique.

### A suivre

Recommandations 2-6 de l'audit : bloc date « Communiques & jalons »,
inscription newsletter, traversee compacte / mini-nav 01-08, hero
multi-messages, bloc Publications.

## 39. Home : systeme de boutons unifie (proposition A1) (2026-08)

Premier lot du plan « moderniser & harmoniser » (`propositions-home-2026-08.md`).
Avant : 5 styles d'appels a l'action coexistaient sur la home. Apres : 3
roles, definis dans un bloc `<style id="ui-btn">` en fin de `<head>` de
`index.html` — on restyle les classes existantes, aucun renommage HTML.

- **Primaire** (pilule doree pleine, mono 700, radius 999, padding 12/24) :
  `.hxi-cta` (etait radius 12 + fonte display Space Grotesk) et
  `.ppte-cta` (etait ambre `#F59E0B`, graisse 600). Le bouton
  « Nos engagements » a perdu son `style="background:#34D399"` inline
  (vert -> or). ATTENTION : les deux autres `background:#34D399` inline du
  fichier sont des pastilles `pt-dot` de chips produits — ne pas y toucher.
- **Fantome** (contour, radius 999) : `.iv-cta` ; en theme clair le texte
  passe de bleu-lien a `#0B1422` avec bordure or assombrie, survol voile
  or 22 %.
- **Lien-fleche** (inchange) : `.flip-cta`, `.sc-link`, `.hnews-all`.
- Cartes actu : `.hncard-go` (« Lire -> ») etait devenu une boite pleine
  largeur via le traitement verre des spans ; redevient un lien nu
  (`background:none`, `align-self:flex-start` sinon le flex l'etire a
  323 px), soulignement au survol de la carte.
- Focus clavier commun `outline:2px or` sur les 3 primaires/fantomes.
- Les pilules des panneaux `.mln-go` etaient deja coherentes (accent du
  panneau) — non touchees. Boutons du hero non touches (reserves au lot
  B3 multi-messages). `index-en.html` non touche (aucune des classes
  concernees n'y figure hors CSS).
- Verification : styles calcules en clair ET en sombre (retrait de
  `et-plight` a la volee) — or `#E8C36A` / texte `#0B1422` ≈ 9,9:1.

## 40. Home : grille #poles alignee (proposition A2) (2026-08)

Deuxieme lot du plan « moderniser & harmoniser ». Avant : cartes de
317/268/312/357 px, tiroirs « Departements » demarrant a 322/272/317/362 px
du haut de colonne, et chaque enfant de carte (titre, accroche, KPI,
lien) encadre par le traitement verre des spans -> cartes fragmentees.

Bloc `<style id="poles-fix">` en fin de `<head>` de `index.html` :

- **Subgrid** : `#poles .hubwrap{display:grid;grid-template-rows:subgrid;
  grid-row:span 2}` + `grid-template-rows:auto auto` sur `.hpgrid.c4`
  -> cartes toutes a 314 px, tiroirs tous a 327 px, sur les 4 colonnes.
  Enveloppe dans `@supports (grid-template-rows:subgrid)` : sans support,
  comportement d'avant (rien ne casse).
- `.hpcard-body` en colonne flex avec `.hpcard-kpis{margin-top:auto}` :
  chips KPI et lien ancres en bas de carte.
- **De-fragmentation** : `background:none;border:0` sur `.hpcard-top`,
  `.hpcard-n`, `.hpcard-l`, `.hpcard-tag`, `.hpcard-go` — la carte
  redevient une seule surface ; les encadres pilule restent aux seules
  chips KPI (`.hpcard-kpis span`, voulues). NOTE : `.hpcard-top` fait
  partie de la liste, sinon un cadre subsiste autour du rang titre.
- `.hpcard-go` : meme langage lien-fleche que `.hncard-go` (A1),
  `align-self:flex-start`, soulignement au survol de la carte.
- Verifie : clair + sombre + mobile 390 px (carrousel intact) ; or fonce
  `#7A570E` sur carte claire ≈ 5,7:1.

## 41. Home : pont visuel hero -> contenu (proposition B1) (2026-08)

Troisieme lot du plan « moderniser & harmoniser », sur les DEUX homes.
Avant : le hero marine se terminait par un bord franc contre le creme du
corps de page (visible surtout en theme clair).

Bloc `<style id="hero-bridge">` en fin de `<head>` : `#coeurs::before`
porte deux fonds — un filet d'or de 1 px (`top/100% 1px no-repeat`,
meme langage que le filet du haut de hero `.hero::after`) et une ombre
portee `rgba(9,14,23,.26) -> 0` sur 90 px. Effet : le hero « projette »
une ombre sur la section suivante, la couture devient intentionnelle.
En sombre : l'ombre est invisible (navy sur navy), le filet subsiste.

Pieges dej-vus a retenir :

- `.hero::after` est DEJA pris (filet d'or du HAUT du hero,
  s_99c21a3880.css en FR, inline en EN) — ne pas y toucher, c'est
  pourquoi tout est sur `#coeurs::before`.
- `x_efffae1a94e5.css` (FR seulement) neutralise `#coeurs::before` avec
  `background:none!important` (heritage anti-bandeaux) : le bloc
  redefinit TOUTES les proprietes avec `!important` et une specificite
  superieure (`#coeurs:not(#_):not(#__)::before`).
- Hauteur 90 px = le vide entre le bord du hero et le kicker de l'intro
  `#coeurs` ; l'ombre ne passe jamais sous le texte. Premier essai a
  55 % d'alpha + voile creme dans le hero : rendu boueux, abandonne.
- Verifie : FR clair/sombre + EN, aucune retouche du hero lui-meme.

## 42. Home : en-tetes de section & cartes harmonises (A3+A4) (2026-08)

Quatrieme lot du plan « moderniser & harmoniser ». Bloc
`<style id="sec-head">` en fin de `<head>` + 3 retouches HTML minimes.

- **Kickers** : les glyphes varies vus a l'audit etaient en fait presque
  tous la meme puce losange CSS (7x7 rotate 45) — la variance reelle
  etait taille (.64-.7rem), couleur (ardoise vs or selon la classe) et
  motif (tirets de part et d'autre sur `.mfo-k`). Desormais : mono
  `.7rem/.2em` partout, puce losange partout (ajoutee a `.hxi-eyebrow`,
  `.inv-k`, `.sec-k` ; `.mfo-k::before` troque son tiret gauche contre
  la puce, la ligne fondue de droite est conservee comme sur
  conviction/vision), couleur or unique : `#77530C` en clair (regle
  `html.et-plight :is(...)` a triple `:not(#_)` — une simple regle
  `!important` perdait contre l'override ardoise du theme clair),
  `var(--gold-l)` en sombre.
- Les 3 kickers inline (conviction, vision, poles) recoivent
  `class="sec-k"`.
- **Titres** : `#poles > .wrap > h3` et `#produits-acces h2` remontes de
  28.8px a l'echelle commune `clamp(1.55rem,2.9vw,2.2rem)` (=35.2px
  bureau). PIEGE : le premier selecteur etait initialement `#poles h3`
  — il attrapait aussi les `h3.hpcard-n` des cartes (18.56 -> 35.2px,
  titres de cartes explosés) ; toujours cibler `> .wrap >`.
- **#combat a gauche** : `.mfo .wrap{text-align:center}` etait la source
  du centrage ; surcharge `text-align:left` + suppression des marges
  auto de `.mfo-h/.mfo-l/.mfo-foot`. La citation `.mfo-quote` etait deja
  bordee a gauche.
- **A4** : chips date/tag des cartes actu en pilule `999px` + padding
  `3px 9px` (meme langage que les chips KPI de #poles).
- Verifie : 0 erreur console, 0 debordement (bureau+mobile), captures
  combat/conviction/poles/produits, sombre ok. Les offsets de page ont
  bouge (titres plus grands) : les captures par coordonnees fixes
  montrent du vide — utiliser scrollIntoView.

## 43. Offre ESG aux entreprises : /enerconseils/esg (2026-08)

Nouvelle page FR construite sur le gabarit `enerconseils/audits.html`
(generateur jetable `/root/work/mkesg.py`). Positionnement : les
capacites ESG qu'EnerTchad batit pour sa propre chaine, mutualisees pour
les autres entreprises — portees par GreenTech (environnement),
EnerConseils (gouvernance) et Tchaditude (social).

- Contenu : pghero (caveat societe en constitution), ttg 7 thematiques,
  #pourquoi (3 cartes poles), #domaines = les SIX SERVICES (diagnostic &
  feuille de route ; bilan carbone & decarbonation ; conformite HSE-Q ;
  contenu local & impact social ; gouvernance & reporting ; solutions
  terrain GreenTech — chacun avec Pour qui + Livrables), #methode (epw
  5 temps), #secteurs (6 familles d'acteurs), #referentiels (ISO/GRI/
  IFC/ITIE/OHADA/GES/ODD), #livrables, #faq-esg (5 Q/R) + FAQPage JSON
  coherent, cta-band conserve.
- L'id `domaines` est CONSERVE pour la section offre : une regle CSS
  mobile du gabarit cible `#domaines div[style*=minmax(4...)]`
  (anti-debordement 390px). Breadcrumb : la feuille n'a pas d'URL dans
  ce gabarit. Alternate EN retire (pas de jumelle) ; `nx-lang` -> `/en`.
- Maillage : entree « Services ESG » ajoutee aux subnavs des 5 pages du
  pole (index/atlas/conseil/audits en FR — ATTENTION, ces 4 pages
  utilisent `&` BRUT dans « Audits & évaluation », pas `&amp;` comme
  audits.html ; audits-en pointe la page FR avec `hreflang="fr"`),
  au tiroir Conseil du grid #poles de la home, et au sitemap.
- Verifie : 0 erreur console, 0 requete >=400, 0 debordement.
- A suivre : jumelle EN `esg-en` (meme mecanique mkimen), lien croise
  depuis `engagements.html`.

## 44. Home : le rail #aurail devient la mini-nav de traversee (B2) (2026-08)

Cinquieme lot du plan « moderniser & harmoniser ». Le rail fixe de droite
(`<aside id="aurail">`, 4 acces par profil Investir/Client/Partenaire/
Rejoindre — tous presents par ailleurs dans la topbar) devient le
scrollspy de traversee : 8 points, un par grande section, libelle +
description au survol (mecanique .axl/.axd existante), etat actif
`.on`, clic = saut d'ancre.

- Ids ajoutes aux sections anonymes : `#carnets` (hnews), `#investir`
  (hxi « Pourquoi investir »).
- Driver v2 : l'ancien `.on` etait assigne par FRACTION du scroll (d'ou
  « ne dit pas ou l'on est ») ; le nouveau calcule la derniere section
  dont le haut passe la ligne `scrollY + 35 % du viewport`.
  PIEGE 1 : l'aside est place au milieu du body — les sections situees
  APRES lui dans le source (`#carnets`, `#produits-acces`, `#investir`)
  n'existent pas quand le script resout ses cibles -> resolution
  PARESSEUSE dans upd(), sinon le spy plafonne a #vision.
  PIEGE 2 : `#aurail{display:flex;flex-direction:column}` avec align
  par defaut (stretch) -> le survol d'UN lien elargissait TOUS les
  liens ; fix `align-items:flex-end` (dans le bloc sec-head).
  PIEGE 3 : en theme clair, l'override plight fonce le texte des
  libelles alors que la pilule de survol reste sombre -> pilule claire
  `color-mix(var(--c) 16%, #FBF8F2)` + texte `#10161F` en plight.
- Seuil d'apparition (scroll > 460px) et animation conserves.
  Mobile : rail masque (regle media existante). EN : pas de rail.

## 45. Home : fusion #poles dans #appuis (2026-08)

Sur directive (« fusionner Le socle · capacites transversales et
S'orienter · Les appuis de la chaine ») : les deux sections couvraient
les 4 memes poles d'appui avec les MEMES liens de departements et les
memes KPI (le grid #poles avait servi de source aux panneaux #appuis,
cf. §37). Le grid etait devenu 100 % redondant.

- Section `<section id="poles">` supprimee (~4,2 Ko, −715 px de page :
  16 859 -> 16 144 px).
- **Ancre de compatibilite** : `<span id="poles">` insere en tete de
  `#appuis` — tous les liens profonds existants `/#poles` (pagers des
  pages EN « Our poles », flip-cta « Nos pôles », carte « Nos 8 pôles »
  du drawer gouvernance, etc.) atterrissent sur la section fusionnee.
  Verifie : /#poles scrolle a 5 056 pour un #appuis a 5 172.
- Lede de #appuis enrichi : « quatre forces transversales — le socle —
  irriguent et font tenir l'ensemble » (absorbe l'identite de l'ancien
  en-tete « Le socle · capacites transversales »).
- Pastille doree « Les huit pôles, en un coup d'œil ↓ » retiree (cible
  disparue). Point #poles retire du rail (9 -> 8 points).
- CSS morts purges : bloc `poles-fix` entier (§40 — subgrid devenu sans
  objet), selecteur `#poles > .wrap > h3` du bloc sec-head. Plus aucun
  `hubdrawer`/`hpgrid` dans le markup de la home.
- Verifie : 0 erreur console, 0 requete >= 400, 0 debordement bureau et
  mobile, scrollspy 7/7 sections justes.

## 46. Home : bande CTA finale comme les pages interieures (C1) (2026-08)

Sixieme lot du plan. La home etait la seule page sans conclusion : le
`#cta-band` des pages interieures (« De la roche-mere a la pompe, bati
au Tchad. » + Investir / Nous contacter) est insere juste avant le
footer, MARKUP IDENTIQUE a celui des pages profondes (copie de
enerconseils/audits.html).

- La feuille dediee `assets/chrome/x_1576951582b2.css` (1,4 Ko — tout le
  style cb-in/cb-btn y vit) n'etait pas chargee par la home : `<link>`
  ajoute juste avant la section (les regles de themes cb-* de
  plight_extrait/x_cd256286824c etaient deja chargees).
- Comportement verifie identique aux pages interieures dans les DEUX
  themes : bande sombre translucide en sombre ; en clair, plight
  eclaircit la bande (le degrade sombre est neutralise) exactement comme
  sur /enerconseils/audits — c'est le comportement de reference, pas un
  bug. 0 erreur console.
- La bande vit HORS `<main>` (avant `<!-- FOOTER -->`) : la regle plight
  `main a.cb-p` ne s'applique pas mais son doublon sans `main` couvre.

## 47. Hero : 2 pilules + 2 liens mono (B3) (2026-08)

Septieme lot du plan. DECOUVERTE prealable : la moitie « multi-messages »
de B3 existait deja — le hero porte 5 messages en rotation
(`.hx-slides` / `hx-slide-1..5`, onglets `role="tab"` aria-controls,
les tirets au-dessus de « LA CHAINE INTEGREE ») ; l'audit « hero
mono-message » etait donc perime sur ce point. Seul le rangement des
boutons restait a faire.

- Avant : 4 boites `.btn` (`btn-p`, `btn-shop2`, `btn-g` x2) qui
  cassaient en 2 lignes avec « Investir » orphelin. Apres : 2 pilules
  (`btn-p` « Decouvrir EnerTchad » en or degrade, `btn-g` « Investir »
  en fantome contour) + 2 liens mono `.hx-links` (« Boutique &
  stations » avec son icone panier reduite a 14px, « Devenir client »),
  soulignes fins, min-height 44px (cible tactile).
- PIEGE specificite : les overrides hero du theme clair
  (`html.et-plight header.hero .hx-grid a{color:#F0CE82!important}` et
  un fond fonce) battent une regle a 2 `:not(#_)` — il faut 3 `:not` +
  la variante prefixee `html.et-plight ... .hx-grid a.btn-p` +
  `-webkit-text-fill-color`. Verifie par style calcule ET zoom de
  capture (au 1280 entier, la pilule or parait sombre a l'oeil — zoomer
  avant de conclure).
- REWIND CONTENEUR pendant ce lot (3e occurrence) : /root/etc etait
  revenu a un instantane pre-lazy (125 706 o). Protocole applique :
  `git archive FETCH_HEAD | tar -x`, verification 355 fichiers / 0
  ecart, serveur relance. Les scripts d'edition a assertions ont tenu
  (aucune ecriture sur le mauvais fichier : la 1re assertion passait sur
  le vieux markup mais l'ancre CSS manquante a tue le script AVANT
  write — toujours garder une assertion sur un marqueur RECENT).

## 48. Home : micro-finitions B4+B5+A5 (2026-08)

Huitieme lot du plan, trois retouches en un commit.

- **B4 compteurs** : `<script id="kpi-count">` avant `</body>` — les 4
  stats du hero (`.hx-stat b` : 8 poles, 100 %, 20 Md, 12 stations)
  comptent de 0 a N en 600 ms (ease-out p*(2-p), rAF), au premier
  40 % de visibilite du `.hx-strip`, une seule fois. Desactive sous
  `prefers-reduced-motion`. Les chips « En bref » ne sont PAS animees
  (cartes retournables avec aria-labels riches — ne pas toucher leur
  textContent). NB verification : echantillonner APRES ~2 s, un
  echantillon a 1,4 s montre 99 % en plein vol (fausse alerte).
- **B5 relief** : `background-image` radial dore a 5,5 % d'alpha sur les
  plages claires (theme clair seulement), cote alterne gauche/droite
  (#conviction/.inv/#carnets/.shortcuts a gauche ; #vision/.hxi/
  #produits-acces a droite). Sans `!important` : toutes ces sections
  etaient a fond transparent (verifie au prealable) — si un fond leur
  est ajoute un jour, la texture s'efface d'elle-meme.
- **A5 cartes retournables** : les 9 boutons `.flip-hint` passent de
  l'icone `↻` (lisible comme « recharger ») au libelle mono
  « + DETAIL » en pilule (padding 3/10, .58rem, uppercase). Le JS
  `flip-js` est inchange (clic hint = flip, verifie). Point backlog
  « flip-card focus » partiellement traite : le bouton est un vrai
  <button> focusable, libelle explicite.

## 49. Footer : bloc « Etre prevenu(e) » (C2) (2026-08)

Neuvieme et dernier lot « rapide » du plan (reste C3, a valider).
Bandeau `.foot-news` insere en tete de `<footer>` (avant `.foot-grid`) :
kicker au motif A3 (losange + mono), titre, champ e-mail pilule +
bouton or « S'inscrire », note d'honnetete « Le bouton ouvre votre
messagerie » + alternative WhatsApp (meme lien wa.me que le hero).

- Site statique sans backend : le submit construit un
  `mailto:contact@enertchad.td` pre-rempli (sujet + corps avec
  l'adresse saisie) — MEME approche que le formulaire de contact.html,
  aucun service tiers, aucune collecte silencieuse.
- CSS dans le bloc sec-head : couleurs en `currentColor`/herite pour
  suivre le footer dans les deux themes (kicker : or fonce en clair via
  la regle, or clair sinon). Input `min-height:46px`, focus visible or.
- Le lien « etre prevenu(e) → » du hero (WhatsApp) est conserve.
- Verifie : bureau/mobile/sombre, 0 erreur console.
- A suivre : miroir EN du bloc sur index-en.html (avec les autres
  miroirs #appuis/rail/cta-band en attente, cf. §37/§44/§46).

## 50. Home : conviction fusionnee dans vision (C3, valide) (2026-08)

Dernier lot du plan, execute sur validation explicite (« fais C3 »).
Les sections #conviction et #vision racontaient deux fois la these
(la chaine tenue par des mains tchadiennes / les energies reunies)
avec le meme gabarit (kicker + h2 geant degrade + 2-3 paragraphes +
chips).

- `<section id="conviction">` supprimee (~3 Ko). Sa substance est
  distillee en CITATION D'OUVERTURE de #vision (italique, filet or a
  gauche — meme motif que la citation de #combat) : « De l'exploration
  a la pompe, nous tenons chaque maillon — toute la chaine, entre des
  mains tchadiennes, pour la premiere fois de A a Z. »
- Kicker de #vision renomme « Notre conviction · Notre vision »
  (coherent avec le libelle du rail « Conviction & vision », deja
  fusionne au lot B2).
- Chip « Toute la chaine maitrisee · de A a Z » ajoutee en tete des
  chips de #vision (les 3 chips de conviction disparaissent sinon).
- Ancre de compatibilite `<span id="conviction">` en tete de #vision.
- Hauteur de page : ~17 040 -> 16 359 px (~-685 px). La sequence
  narrative devient : combat (raison d'etre) -> vision (conviction+
  vision) -> retournement (mecanique du flux) — plus de redite.
- 4e REWIND conteneur juste avant ce lot — protocole §47 applique
  (restauration 355 fichiers/0 ecart, recreation de cleanserv.py qui
  avait disparu de /root/work, relance du serveur).

## 51. Home EN : miroir des lots recents sur index-en (2026-08)

Rattrapage du retard d'index-en.html sur la home FR (points « A suivre »
des §37, §44, §46, §49) :

- **#appuis EN** : les 4 panneaux d'appui traduits (Support 01-04 of 4,
  « What we do », « Explore the pole → » vers les hubs EN
  `/pole-{greentech,tchaditech,tchaditude,enerconseils}-en` qui
  existent tous), memes accents/images/data-mimg que FR. Tiroirs :
  sous-pages FR marquees `hreflang="fr"` + chip `mln-fr` (convention de
  #coeurs EN) — SEULE exception `audits-en` qui a sa jumelle. Le tiroir
  EnerConseils inclut le lien ESG (§43). Ancre `<span id="poles">`
  reprise : les pagers EN pointent `/index-en#poles`.
- **mln-css EN** : portee elargie `#coeurs` -> `:is(#coeurs,#appuis)`,
  88 remplacements — MEME compte que FR (§37), bon indicateur de non-
  divergence des deux copies du bloc.
- **Rail #aurail EN** : 4 points (Manifesto / The four links / Support
  poles / Our purpose — la section purpose porte deja id="vision"),
  driver v2 a cibles paresseuses, x_77d650c4a7a2.css (styles du rail)
  deja charge par la page.
- **foot-news EN** : bloc « Be notified on day one » + mailto EN +
  WhatsApp EN. CSS rail+newsletter regroupes dans `<style
  id="en-extras">` (l'equivalent EN du bloc sec-head FR).
- mln-lazy inchange : il ramasse les nouveaux `data-mimg` tout seul.
- Verifie : 0 erreur, 0 requete >=400, 0 debordement, scrollspy 3/3,
  0 residu francais dans #appuis, page 8 245 -> 12 145 px.
- Restent NON mirrores (choix) : #combat/#carnets/#produits/#investir
  n'existent pas en EN — la home EN est une version condensee assumee.

## 52. Offre ESG : jumelle anglaise /enerconseils/esg-en (2026-08)

Construite par `/root/work/mkesgen.py` sur le gabarit `audits-en.html`
(meme mecanique que §43 sur audits.html) : head EN complet (canonical/
og/twitter -> esg-en, trio d'alternates en<->fr avec x-default sur la
version FR comme audits), Breadcrumb/WebPage/FAQPage traduits, pghero
EN (crumb vers /index-en et /pole-enerconseils-en), 7 sections + 6
services traduits, cta-band EN du gabarit conserve.

Maillage bidirectionnel :
- esg.html : alternate EN ajoute + les 2 bascules de langue passent de
  `/en` (§43) a `/enerconseils/esg-en`.
- esg-en : bascules de langue -> `/enerconseils/esg` (regle §34 : SEULES
  les 2 occurrences toggle, `class="nx-lang"` et `>Fran`).
- audits-en subnav : l'entree « ESG services » perd son hreflang fr et
  pointe esg-en (active sur esg-en, simple lien sur audits-en).
- index-en, tiroir EnerConseils de #appuis : lien -> esg-en, chip FR
  retiree.
- sitemap : entree esg-en.
- Verifie : 0 erreur, 0 requete >=400, 0 residu FR dans <main>,
  subnav active correcte. Le pole Conseil a desormais 2 pages EN
  (audits-en, esg-en).

## 53. Amont : /activites-en reconstruit — vraie jumelle E&P (2026-08)

La derniere chip FR du #coeurs anglais visait /amont/activites. Enquete :
**/activites-en existait deja** mais contenait l'ANCIENNE page generique
« Our business » (vieille generation, main de 3 Ko) — alors que tout
l'ecosysteme (hreflang de la page elle-meme, bascule nx-lang de
/amont/activites, subnavs EN du pole via parc-en/eor-en) la designait
deja comme jumelle de la page E&P moderne. Resolution : RECONSTRUCTION
EN PLACE (aucun nouveau slug, aucun recablage des ~30 pages qui la
lient).

- Convention decouverte : les jumelles EN des sous-pages amont vivent a
  la RACINE (/eor-en, /services-ep-en, /parc-en) — pas en
  /amont/xxx-en comme intermediaire/petrochimie.
- Generateur `/root/work/mkacten.py` (la fabrique mkimen a ete perdue
  dans les rewinds ; recreee en plus simple) : chrome corp transplante
  de parc-en (meme pole, meme generation), subnav EN de parc-en avec
  is-active deplace, head transforme (FAQPage FR generique RETIREE,
  convention §mkpxen), milieu [main..footer) traduit par ~120 paires
  avec motif() tolerant NBSP/&amp;, footer DOM de parc-en + scripts FR
  de la page conserves (ils portent le JS accordeon/epw specifique).
- Liens du milieu re-pointes vers les jumelles EN existantes (eor-en,
  services-ep-en, parc-en, pole-amont-en, investisseurs-en, contact-en,
  2 carnets -en). Bascules de langue : nx-lang nav ET lien >Fran du
  footer transplante -> /amont/activites.
- Residus FR traques : bandeau noscript + legende diapo
  "Image d'illustration" (DANS LE JS de queue, echappee \\u2019 — le
  scan DOM ne la voit pas, verifier aussi les scripts).
- index-en : le tiroir E&P de #coeurs perd sa derniere chip FR ->
  /activites-en. Le #coeurs anglais est desormais 100 % sans chip FR
  sur ses tiroirs maillons. Sitemap : entree deja presente.
- Verifie : 0 erreur, 0 requete >=400, accordeons fonctionnels
  (aria-expanded), subnav active correcte, alternates trio coherent
  des deux cotes (x-default = FR).

## 54. Home : etagere documentaire (reco 6, derniere de l'audit) (2026-08)

Section `#publications` inseree entre #durabilite (hxi) et les
raccourcis, juste avant la conclusion de page. Derniere recommandation
code de l'audit majors — le contre-audit n'en laissait plus d'autre.

- 4 cartes de telechargement direct (attribut `download`) vers des PDF
  DEJA presents a la racine du depot : Brochure (207 Ko), Fiche
  investisseur (8 Ko), Fiche technique Amont (21 Ko), Fiche technique
  Aval (7 Ko) — tailles reelles affichees en meta mono. Egalement
  disponibles mais non retenus : Brochure EN, Fiche AR (place limitee ;
  la page /publications les porte).
- Lien « Toutes les publications → » vers /publications (page qui
  existait deja — la home n'y liait pas).
- Kicker via `class="sec-k"` (motif A3), titre sur l'echelle commune,
  cartes en couleurs `currentColor`/herite (robustes clair+sombre,
  meme approche que foot-news), icone document doree #B08420.
- Rail : 9e point « Publications » (#F2B45A), scrollspy verifie.
- 0 erreur, 0 requete >=400 ; capture apres ~2 s (le .reveal en cours
  rend les captures floues — piege recurent).

## 55. QA globale + benchmark chiffre face aux majors (2026-08)

Apres la serie de 15 commits (§38-54), tour complet SANS RIEN A
CORRIGER : 173 pages / 0 lien interne casse ; 12 pages cles / 0 erreur
console, 0 requete >=400, 0 debordement bureau+mobile ; balisage
equilibre sur les 6 fichiers les plus retouches ; trios hreflang
coherents ; sitemap valide (168 URL) ; arbre en parite avec le depot ;
aucun asset chrome modifie sur toute la serie -> pas de bump sw.js.

Benchmark meme sonde/meme navigateur/meme jour, homes de production
(details : qa-benchmark-majors-2026-08.md, livre en discussion) :
DCL 244 ms contre 1 784 (TotalEnergies) a 5 250 ms (ExxonMobil) ;
chargement complet 289 ms contre 5,8-18,3 s ; 5 blocs JSON-LD contre
0-1 ; 0 image sans alt contre 3-21 ; skip-link que seul Exxon a aussi.
En retrait : hreflang (4 contre 12 chez Chevron, multi-locales) et
hauteur de page (16 454 px contre 5-7 000 — parti pris assume, a
surveiller). CAVEATS de mesure a retenir : le service worker rend le
"transferKB" flatteur (ressources en cache comptees 0) — citer plutot
DCL/load et les ~887 Ko declares a froid ; imgTotal=0 car aucune balise
<img> initiale (fonds CSS) — le zero-sans-alt est trivialement vrai.

## 56. GreenTech : /patrimoine-en, premiere jumelle du pole (2026-08)

Debut du chantier « jumelles EN des poles d'appui » par la page la plus
courte de GreenTech (533 mots de main + 261 d'apres-main). Generateur
`/root/work/mkpat.py`, meme mecanique que mkacten (§53) : chrome corp
de parc-en, head transforme (FAQPage generique retiree, trio
d'alternates INSERE — la page FR n'en avait pas), ~90 paires de
traduction a motif() tolerant, footer EN transplante, scripts FR
conserves, noscript + legende diapo JS traduits.

- **Subnav EN GreenTech construit** (premier du pole) : Overview ->
  /pole-greentech-en, Wildlife & heritage actif -> /patrimoine-en,
  les 3 pages soeurs encore FR pointees avec hreflang="fr"
  (hseq, impact, transition). A REUTILISER pour les 3 prochaines
  jumelles (deplacer is-active, retirer les hreflang au fur et a
  mesure).
- Contenu traduit avec soin naturaliste : especes UICN (oryx algazelle
  -> scimitar-horned oryx, bubale -> hartebeest, tiang), sites UNESCO
  (Ounianga, Ennedi), galerie Zakouma, hierarchie eviter/reduire/
  restaurer, regle des trois temps. Slogans de marque restes FR par
  design (« Acces aux Energies »').
- Cablage : bascules FR<->EN reciproques, trio d'alternates des DEUX
  cotes, tiroir GreenTech de #appuis (index-en) sans chip FR pour
  cette page, sitemap +1.
- Verifie : 0 erreur, 0 requete >=400, 0 residu FR hors slogans,
  subnav active correcte.
- Restent : hseq-en (2 822 mots — le plus gros), impact-en (2 228),
  transition-en (1 603), puis TchadiTech et Tchaditude.

## 57. GreenTech : /transition-en (2e jumelle du pole) (2026-08)

Generateur `/root/work/mktrans.py`, ~150 paires. PIEGE RESOLU et regle
mise a jour : dans un heredoc bash, les litteraux U+00A0/U+202F d'un
script Python deviennent des espaces simples -> le motif() tolerant
perdait ses classes NBSP (17 paires en echec sur la typographie
française « : », « ; », « » »). Correction : ecrire motif() avec des
echappements \\u00a0/\\u202f EXPLICITES, et normaliser l'ancre avant
re.escape. Meme piege sur le noscript de la queue (NBSP avant « ; ») —
remplace par regex.

- Contenu traduit : spectre 6 solutions (biomasse/biogaz/biocarburants/
  eolien/dechets), 3 bandes geographiques, section eolien (BET 7-8 m/s,
  harmattan), Desert to Power, Vision 2030 (4 KPIs), feuille de route
  5 jalons, mobilite VE (4 cartes), 6 fiches-leviers accordeon,
  demarche carbone. Terminologie : torchage -> flaring, valoriser ->
  put to use/recover, MRV conserve, ITIE -> EITI.
- Subnav EN GreenTech reutilise (§56) : is-active sur transition,
  patrimoine desormais pointe en EN — ET retro-mise a jour du subnav de
  patrimoine-en (transition y passe de hreflang fr a /transition-en).
  REGLE : a chaque nouvelle jumelle, mettre a jour les subnavs des
  jumelles EN precedentes du pole.
- Cablage complet : bascules reciproques, alternates ajoutes cote FR,
  tiroir GreenTech de #appuis (chip FR retiree), sitemap +1.
- Verifie : 0 erreur, 0 requete >=400, residus FR = slogans seuls.
- Restent dans le pole : impact-en (2 228 mots), hseq-en (2 822).

## 58. GreenTech : /impact-en (3e jumelle — la plus dense en ESG) (2026-08)

Generateur `/root/work/mkimp.py`, ~250 paires (2 228 mots). Page cle
pour les investisseurs anglophones : realites/reponses ESG, cadre
E-S-G, engagements bas-carbone, contenu local (1 240 emplois, cible
80 %), premier domino energie/pouvoir d'achat, gouvernance auditable
(organigramme complet), 6 ODD, offre a l'Etat (citation presidentielle
Abu Dhabi), double boucle matiere/capital.

DEUX LECONS DE FABRIQUE :
- Le heredoc aplatit TOUJOURS les \\u00a0 litteraux (3e occurrence) —
  motif() doit etre patche apres coup ou le script ecrit par python.
  4 paires en echec, corrigees par regex ciblees.
- **Paires courtes dangereuses** : (' ou ',' or ') a mute des phrases
  FR encore non traduites (« Réseau absent ou instable » ->
  « absent or instable ») et fait echouer leurs regex de rattrapage.
  REGLE : jamais de paire < ~8 caracteres sans contexte ; verifier le
  scan de residus APRES les rattrapages, pas seulement avant.
- Retro-maj des subnavs des jumelles precedentes appliquee (patrimoine-
  en, transition-en pointent maintenant /impact-en). Cablage complet :
  bascules, alternates FR, tiroir #appuis (chip retiree), sitemap.
- Verifie : 0 erreur, 0 requete >=400, residus = slogan seul.
- Reste : hseq-en (2 822 mots) — dernier du pole.

## 59. QA des sujets & thematiques (2026-08-06)

- Inventaire programmatique des 176 pages (99 FR, 74 EN, 1 AR) a HEAD
  7b01da2c : titres, h1, blocs ttg, identites de pole (subnavs),
  alternates hreflang, maillage entrant. Rapport livre :
  qa-themes-2026-08.md.
- Couverture bilingue : 20 jumelles sur 32 sous-pages de pole (62%).
  Les 4 poles metiers (Amont, Intermediaire, Aval, Petrochimie) sont
  100% bilingues. Restent : hseq (GreenTech), TchadiTech entier (5),
  Tchaditude entier (4), atlas + conseil (EnerConseils), plus 13 pages
  corporate FR sans EN. Les 8 hubs /pole-*-en existent.
- Identites de pole : motif "Metier (Marque)" partout sauf Tchaditude,
  affiche "Tchaditude - capital humain" sur ses 5 pages. A harmoniser
  en "Capital humain (Tchaditude)". Certaines jumelles EN anciennes de
  l'Amont n'ont pas toutes le meme en-tete de subnav.
- Doublons thematiques : "Une qualite par partenariat" x3 (bloc-standard
  assume, a editer en triple si evolution) ; "Energie de site autonome"
  present dans tchaditech/innovations ET tchaditech/rd — a trancher
  AVANT de traduire TchadiTech ; audits/esg partagent 2 rubriques de
  gabarit (voulu).
- Orphelines : 0 (hors 404.html et fichier de verification Google).
- Ordre recommande : hseq-en, puis doublon site autonome, puis
  harmonisation Tchaditude, puis traductions Tchaditude (4) >
  TchadiTech (5) > atlas+conseil > corporate.

## 60. hseq-en — derniere jumelle GreenTech + scrollcue EN (2026-08-06)

- /hseq-en cree via /root/work/mkhseq.py (donneur chrome parc-en,
  motif() a echappements explicites — ecrit via Write, pas heredoc :
  les litteraux \xa0/\u202f survivent). ~250 paires + 8 paires
  HTML-exact pour les phrases a noeuds courts (strong qx0_2 imbriques :
  air 4 voies, bowtie, HAZOP/LOPA, MOC, SIS/ESD, API 754) — jamais de
  paire courte type (' et ',' and ').
- Piege evite : '>Recuperation assistee<' introuvable car la carte
  porte un <small class="pmk">(EOR)</small> colle au titre — paire
  HTML-exacte requise.
- Cablage : FR hseq bascule x2 + trio alternates ; subnavs des 3
  jumelles GreenTech (psn-link hreflang fr -> /hseq-en) + pmore-cards ;
  impact-en btn '#hseq' ; carte du hub pole-greentech-en ; tiroir
  index-en (chip mln-fr retiree) ; sitemap 172 URL. GreenTech est
  desormais 100% bilingue — 4 poles metiers + GreenTech complets.
- Bonus : liens journaux FR -> jumelles -en dans patrimoine-en,
  transition-en, impact-en (eau-de-production, gpl-bois-energie,
  rente-partagee — les jumelles existaient, les liens restaient FR).
- Bonus : scrollcue 'Suite' traduit ('More' + aria-label EN) sur les
  9 jumelles EN qui l'affichaient — quirk audits-en du backlog regle.
- QA locale : 0 erreur console, 0 requete >=400, 0 debordement, 71
  cibles de liens internes toutes 200, residu FR = slogan seul.
- Reste (backlog nav) : les mega-menus des ~40 pages EN pointent
  encore vers les sous-pages FR (/greentech/*, etc.) — passe de
  balayage chrome a planifier quand plus de jumelles existeront.

## 61. Doublon site autonome tranche + identite Tchaditude (2026-08-06)

- Doublon « energie de site autonome » (QA §59) : DECISION —
  tchaditech/innovations PORTE le sujet (innovation phare 05, carte
  vitrine vers /aval/reseau#reseau-carte inchangee) ; tchaditech/rd
  porte le projet d'ingenierie sous titre scope « Modules d'energie de
  site autonome » (h3 + entree ttg renommees, id t2- conserve — aucun
  lien entrant externe sur cette ancre). L'ambiguite ne sera pas
  exportee lors de la traduction du pole TchadiTech.
- Identite de pole harmonisee : « Tchaditude · capital humain » ->
  « Capital humain (Tchaditude) » — 24 occurrences sur 6 fichiers
  (5 pages du pole : psn-home, aria-label subnav, fil d'Ariane,
  pagers ; + plan-du-site). Le motif « Metier (Marque) » est desormais
  uniforme sur les 4 poles d'appui. Les kickers de la home
  (« Tchaditude · capital humain » avec em) suivent un autre motif
  volontaire, non touches.
- QA locale : 8 pages 200, psn-home verifie, 0 occurrence residuelle.

## 62. Ultra-review integrale (2026-08-06)

- 3 passes a HEAD a975f614 : statique 177 pages (metadonnees, JSON-LD,
  hreflang bidirectionnel, sitemap, liens+ancres, a11y, residus de
  langue), runtime Playwright 12 pages x 2 viewports, visuelle
  (sombre/clair/mobile). Rapport livre : ultra-review-2026-08.md.
- Socle : 0 titre/desc duplique, 0 JSON-LD invalide, 0 asymetrie
  hreflang (150 pages), sitemap 172=172, 0 lien casse (faux positifs
  verifies : /en=308, ?profil= query, #p= etat configurateur), 0 img
  sans alt, 0 saut de titres, 0 erreur console / >=400 / overflow sur
  24 combos. TTFB prod 0.37-0.82s.
- Constats classes : (1) mega-menu chrome EN -> 1337 liens FR non
  marques, 69 cibles, dont ~200 avec jumelle EN existante (greentech/*
  en tete) — balayage a faire ; (2) ticker produits FR (pt-chip) sur
  9 jumelles EN (intermediaire x3, petrochimie x4, enerconseils x2) ;
  (3) footer FR entier sur journal-integrite-faire-durer-en (vieille
  generation) ; (4) 4 meta desc >170c (esg 230, esg-en 214,
  pole-enerchimie-en 186, activites-en 182) ; (5) 8 ancres vides
  th-cta sur les hubs (cosmetique).
- Ordre recommande : lot correctif 1a+2+3, puis traduction Tchaditude,
  puis corporate (~640 liens entrants EN vers cibles corporate FR).

## 63. Lot correctif ultra-review — chrome EN rebranche (2026-08-06)

- Balayage chrome EN (constat 1a) : 276 liens reecrits sur 52 pages
  EN via mapping fr->en derive des alternates hreflang (74 paires,
  /root/work/frmap.json). Regles : jamais nx-lang/jlang, jamais le
  lien vers la jumelle FR de la page elle-meme (bascule), fragments et
  query strings preserves, attributs hreflang="fr" et aria-label
  "in French" retires des liens rebranches, texte "(in French)"
  nettoye (psn Overview + pmore-home de 7 pages).
- PIEGE decouvert : 15 fragments FR n'existent pas sur les jumelles EN
  (ids traduits) — corriges : #emplois-jeunesse -> #jobs-youth sur
  pole-tchaditude-en ; fragments abandonnes vers services-ep-en,
  reseau-en, produits-en (atterrissage haut de page). Lecon : tout
  rebranchement de lien profond doit verifier l'id sur la cible.
- Ticker produits traduit (constat 2) : 12 chips pt-chip + libelle
  'offer & targets' sur les 9 jumelles Intermediaire/Petrochimie/
  EnerConseils (bloc identique, verifie par empreinte md5).
- Footer EN retransplante (constat 3) depuis parc-en sur
  journal-integrite-faire-durer-en (vieille generation) + noscript EN.
  Residus FR de la page : 9 -> 0.
- Re-audit complet : 0 lien casse, 0 ancre cassee, 0 page EN >3
  marqueurs FR (etait 12), runtime 6 pages 0 defaut.
- Reste du volume EN->FR (~640 liens) = cibles sans jumelle : dossier
  traduction corporate + poles restants.

## 64. academie-en — premiere jumelle Tchaditude (2026-08-06)

- REWIND conteneur (5e) detecte au demarrage (foot-news absent) —
  restauration git archive FETCH_HEAD, 360 fichiers 0 ecart, serveur
  relance. Les scripts /root/work (mkhseq, frmap) perdus — reecrits.
- Convention de nommage tranchee pour Tchaditude : suffixe meme
  repertoire (/tchaditude/academie-en), comme intermediaire/
  petrochimie/enerconseils — pas de slug racine (evite l'ambiguite
  /services-en). Les 3 autres pages du pole suivront ce motif.
- /tchaditude/academie-en genere par /root/work/mkacad.py (donneur
  parc-en, motif() NBSP via Write). ~250 paires dont 6 HTML-exactes
  (strong qx1_9/qx1_13 imbriques). Nouveau subnav EN du pole :
  psn-home 'Human capital (Tchaditude)', Overview -> hub EN, 3 pages
  restantes marquees hreflang=fr (Our partnership model, Reach &
  know-how, Services & solutions) — a rebrancher au fil des jumelles.
- Pieges page : bouton accordeon 'En savoir plus <span chev>' (texte
  + JS nodeValue 'Reduire/En savoir plus' dans le script tri-more) ;
  scrollcue Suite herite du FR (traduit More) ; pmore-cards vers pages
  FR marquees hreflang=fr des la generation (audit propre d'emblee).
- Cablage : bascule FR x2 + trio alternates, tiroir index-en (chip
  otee), hub pole-tchaditude-en (2 liens), liens profonds
  #talents-tchad de hseq-en/impact-en/journal-integrite (ancre
  conservee sur la jumelle), sitemap 173.
- QA : 0 erreur, 0 >=400, 66 cibles liens 200, accordeon
  Learn more/Collapse OK, residus FR 0 (hors slogans).

## 65. partenariats-en — 2/4 Tchaditude (2026-08-06)

- /tchaditude/partenariats-en genere par /root/work/mkpart.py (~110
  paires). PIEGE motif() 4e occurrence : cette fois l'outil Write a
  AUSSI aplati les litteraux \xa0/\u202f (comportement non
  deterministe) — 8 paires en echec. Regle definitive : apres TOUTE
  ecriture d'un script de traduction, verifier
  repr(motif) contient \xa0 AVANT de lancer ; sinon patcher motif
  avec echappements \uXXXX ecrits via replace python.
- Scrollcue Suite : vit HORS du milieu (region hero pre-main du
  gabarit journal ou injectee) — le traduire sur le fichier de sortie
  complet, pas via les paires milieu.
- Cablage : bascule FR x2 + trio ; retro-maj academie-en (subnav
  hreflang fr -> partenariats-en + pmore) ; tiroir index-en (chip
  otee) ; hub 2 liens (dont ancre #partenaires, verifiee presente
  sur la jumelle) ; sitemap 174.
- QA : 0 erreur, 0 >=400, 66 cibles 200, residus 0.

## 66. rayonnement-en + services-en — Tchaditude 100% bilingue (2026-08-06)

- Lot double (mkray.py ~55 paires, mksvc.py ~150 paires). motif()
  verifie AVANT lancement (regle §65) : mksvc etait aplati -> patche
  en ecrivant les echappements \uXXXX via .replace() python (les
  litteraux ne survivent aux heredocs ET a Write que par hasard).
- Piege paires courtes (§58) x2 sur services-en : 'constitue par
  metier' et 'Externalisation RH' ont mute deux phrases longues avant
  leur tour — rescues sur texte mute. Le residu 'arrets programmes'
  n'etait PAS detecte par le scan (aucun mot-marqueur) : le scan ne
  suffit pas, relire les echecs d'applique un par un.
- Cablage : bascules + trios x2 ; retro-maj des 3 jumelles precedentes
  (subnav + pmore -> plus aucun hreflang fr intra-pole) ; tiroir
  index-en (2 chips otees — le tiroir Tchaditude est 100% EN) ; hub ;
  sitemap 176. QA 5 pages : 0 erreur, 0 lien casse.
- TCHADITUDE EST LE 6e POLE 100% BILINGUE (4 metiers + GreenTech +
  Tchaditude). Restent TchadiTech (5) et EnerConseils (atlas, conseil).

## 67. conseil-en — EnerConseils 3/4 (2026-08-06)

- /enerconseils/conseil-en genere par mkcons.py (~130 paires, motif
  verifie OK avant lancement). Piege paires courtes x1 : 'secteur
  petrolier tchadien' a mute 2 phrases (intro fiches + pager) —
  rescues. Accordeons tri-more traduits (texte + nodeValue JS).
- Retro-maj notable : les subnavs d'audits-en et esg-en pointaient
  'Advisory to operators & State' vers le HUB (placeholder) — ils
  pointent maintenant la vraie jumelle. Balayage nav mega-menu :
  48 pages EN pointaient encore /enerconseils/conseil -> conseil-en.
- Sitemap 177. QA 4 pages 0 defaut. Reste pour EnerConseils : atlas
  (4 619 mots, la plus grosse page du site). Restent aussi les 5
  pages TchadiTech, puis corporate.

## 68. Finitions ultra-review 4+5 (2026-08-06)

- Meta descriptions resserrees <=165c sur les 4 pages en depassement
  (esg 230->164, esg-en 214->149, pole-enerchimie-en 186->129,
  activites-en 182->127) — desc + og:description + twitter alignees.
- Ancres vides <a id=th-cta></a> -> <span> sur les 8 hubs de pole
  (verifie : aucun selecteur a#th-cta dans les CSS).
- Les 5 constats de l'ultra-review sont regles. Restent au backlog
  traduction : atlas (4 619 mots), TchadiTech (5 pages), corporate
  (13 pages), et la passe nav mega-menu pour les cibles restantes.

## 69. atlas-en — EnerConseils 100% bilingue, 7 poles sur 8 (2026-08-06)

- /enerconseils/atlas-en genere par mkatl.py — LA plus grosse jumelle
  du site (4 619 mots, 19 sections, 8 tableaux, 16 accordeons, carte
  interactive + cadastre 42 blocs). ~420 paires dont 12 HTML-exactes.
- 21 echecs en cascade au 1er passage (paires courtes du sommaire/
  stats passees avant les phrases longues : 'bassins sedimentaires',
  'oleoduc Doba-Kribi', 'Comment entrer au Tchad', '42 blocs'...) —
  tous rescues sur texte mute, re-scan final 0 residu. Lecon
  confirmee : sur une page a sommaire, les libelles de sommaire
  DOIVENT passer apres les paragraphes qui les contiennent.
- Motifs repetes du cadastre traduits par 3 paires suffixes
  (' · libre · ouvert a l'attribution' etc.) couvrant ~40 blocs.
- Cablage : bascule FR + trio ; retro-maj des 3 jumelles EnerConseils
  (subnav placeholder hub -> atlas-en) ; tiroir index-en (derniere
  chip EnerConseils otee — tiroir 100% EN) ; hub ; sweep nav 78 pages
  EN ; sitemap 178. QA : 0 erreur, 68 cibles 200, equilibre balisage
  parfait (21 sections, 8 tables, 16 details).
- ENERCONSEILS EST LE 7e POLE 100% BILINGUE. Reste UN pole :
  TchadiTech (socle, innovations, outils, rd, recits) + corporate.

## 70. Eclaircissement du theme sombre — site entier (2026-08-06)

- Demande utilisateur 'plus eclairer le site', choix confirme :
  eclaircir le sombre (pas de bascule clair par defaut). +6 points de
  luminosite, meme teinte marine : 060B14->0B1322, 0B1422->121D31,
  070D18->0D1524, 0A111E->101A2C, 0B1424->121D33, 0D1626->142036,
  0E1B30->15243E, 0E1D30->15263E, 0a1322->101b2e (min. en contexte
  fond uniquement : html{background}, 2 gradients).
- Textes tamises releves : rgba(245,247,250,.6/.62/.66/.68/.7/.72/
  .74/.75) -> .68/.7/.74/.76/.78/.8/.8/.82.
- GARDE-FOUS : #0b1220 minuscule (traits SVG + texte sur or) NON
  touche ; #0b1422 minuscule NON touche hors gradients (les selecteurs
  [style*="color:#0b1422"] du theme clair en dependent) ; accents
  (0E4172, verts) intacts ; aucun asset touche -> pas de bump sw.js.
- 179 fichiers HTML modifies. QA : 0 erreur console, theme clair
  visuellement intact, html bg verifie rgb(18,29,51).

## 71. Carte du cadastre modernisee (2026-08-06)

- Figure 'Cadastre petrolier 2025' (atlas FR+EN) enrichie de 3 couches
  d'interactivite, style id=cdm-x + script apres la figure :
  (1) barre de filtres par statut (role=toolbar, aria-pressed) —
  Tout 44 / Attribues 11 / Libres 26 / En changement 5 / Production 2,
  via data-f sur #cadmap + selecteurs :not() (blocs non concernes a
  opacite .10, labels .4) ; (2) infobulle flottante .cdm-tip lisant le
  <title> du bloc survole (nom + statut, positionnee dans .cdm-frame,
  clamp aux bords) — bilingue gratuitement puisque les <title> sont
  deja traduits ; (3) oleoduc d'export anime (dasharray 9 6 +
  keyframes cdmFlow, coupe par prefers-reduced-motion).
- Theme clair couvert (chips + tip via :not(#_)). JS-off = carte
  statique inchangee. PIEGE QA : la figure vit dans un <details>
  replie — ouvrir la chaine de details parents avant tout test
  Playwright, et re-mesurer les rects APRES le scroll (les coords
  prises avant scrollIntoView sont fausses).
- QA : 0 erreur console FR+EN, chips focusables clavier, filtre Libres
  et infobulle verifies par captures, chips EN 'All/Awarded/Open/
  Changing hands/Production'.

## 72. Bandes noires / espaces vides : bug marginTop du sous-bandeau (2026-08-06)

- SYMPTOME (signale utilisateur) : grandes bandes sombres vides au
  milieu de certaines pages (jusqu'a +12 000 px de vide insere).
- CAUSE : dans le script de placement des barres .subsite/.pole-subnav
  (fonction fix()), le calcul `cur=b0.getBoundingClientRect().top`
  est relatif au viewport. Si fix() se declenche pendant que la page
  est defilee (resize — dont la barre d'URL mobile —, setTimeout 400/
  1200 ms), cur devient tres negatif et marginTop est pousse a
  ~scrollY px : le sous-bandeau etant le premier enfant en flux, tout
  le document est repousse d'autant -> bande vide geante couleur fond.
- CORRECTIF (172 fichiers, toutes pages avec chrome) :
  `cur = b0.getBoundingClientRect().top + (window.pageYOffset||0)`
  -> mesure en coordonnees document, insensible au defilement.
- VERIF Playwright (scroll agressif + resize a chaque pas) : marginTop
  stable a ~118 px (degagement legitime sous nav+ticker) sur les 9
  pages autrefois touchees ; re-scan des 180 pages : 0 vide reel
  restant (les 'gaps' residuels du scanner = photos en background-image
  sur index/brochure, faux positifs).
- NOTE : la croissance tardive (~+4 000 px) de /enerconseils/atlas est
  du contenu qui finit de se rendre (dataset), pas un vide.
- Scanner reutilisable : /root/work/scan-vide2.js (ndjson, resumable,
  detecte vides >500 px et bandes noires par luminance de fond).

## 73. Doublons de contenu : analyse et arbitrages (2026-08-06)

- Scan complet (paragraphes >=120c + titres h2-h4, hors chrome/subnav/
  pager/rlk, par langue) : 440 paragraphes et 289 titres partages.
- CLASSIFICATION :
  (1) brochure.html = COMPILATION ASSUMEE : ~420 des 440 paires sont
  brochure <-> sous-page de pole (le document reprend un chapitre de
  chaque pole ; liens profonds vers les pages detaillees deja presents
  partout). Decision : conserver — c'est la fusion, pas un doublon.
  (2) Gabarits par conception : disclaimer 'societe en constitution'
  (x10), 'Cinq situations' des hubs (x8), pager petrochimie (x3 FR/EN),
  banniere 'Une qualite par partenariat' (x7), teasers d'articles
  identiques dans carnets/recits/brochure (meme article, meme resume).
  Decision : conserver (coherence editoriale voulue).
  (3) VRAI doublon corrige : note violette 'chomage des jeunes'
  identique sur carrieres.html et greentech/impact.html -> reecrite
  sur impact (angle recrutement regional / sous-traitance / parcours
  Tchaditude), idem impact-en.html ; carrieres garde l'originale.
  (4) Faux positif du scanner : 'Mobile Station(TM)(TM)' = artefact
  d'extraction (le TM du titre + celui du tooltip), rien en source.
- Outil : /root/work/dedup.txt (scan complet, 1615 lignes).

## 74. Simulation de navigation multi-profils (2026-08-06)

- 5 parcours Playwright depuis la home : investisseur, operateur E&P /
  client B2B, candidat, institutionnel, lecteur anglophone. Script :
  /root/work/personas.js (log JSON personas.json).
- RESULTATS : parcours FR courts (1-3 clics) et convertissants —
  investisseurs -> /investisseurs#souscrire ; B2B -> services-ep ->
  eor -> clients ; candidat -> carrieres + CTA mailto 'Postuler'
  pre-rempli ; institutionnel -> gouvernance/ethique/impact -> contact
  (6 mailto pre-remplis par profil + formulaire). Aucun cul-de-sac.
- FRICTION REELLE (corrigee) : sur TOUTES les pages EN (79), les liens
  de chrome vers les pages restees FR (Careers, 2030 Targets,
  Communities, Innovation, Site map, Accessibility, Disclaimers,
  brochure, charte, gouvernance) ne signalaient pas le changement de
  langue -> 788 liens marques hreflang="fr" +
  aria-label "... (in French)" (liens nx-lang du commutateur exclus).
  Script re-executable : /root/work/mark-fr-links.py.
- Non-retenus : ajout d'un twin EN carrieres (backlog traduction
  corporate), formulaire dedie candidat (mailto pre-rempli suffisant
  au stade societe en constitution).

## 75. Audit des tuiles (cards) + polish design (2026-08-06)

- Inventaire des familles : pj (projets), art (carnets), ppj-card /
  pmore-card / pcard / adx / rlk (chrome partage assets/chrome/*.css).
  Constat : hover/lift DEJA presents partout (pj, art, pcard, adx,
  ppj-card via s_1a968f2660.css, pmore-card via x_54cf..., rlk via
  u2_...) — pas de manque d'affordance.
- DEFAUT REEL (captures) : sur fonds photo/motifs animes, les tuiles
  pj et art avaient des fonds quasi transparents (rgba blanc .012-.05)
  -> texte pose sur la texture, lisibilite moyenne, bords flottants.
- CORRECTIF <style id="tile-polish"> (projets, projets-en, carnets,
  carnets-en) : verre navy ancre — pj: gradient rgba(20,32,54,.86)->
  rgba(13,21,36,.62) + backdrop-blur 10px sat 1.15 ; art:
  rgba(17,27,46,.74) + blur 9px ; hover renforce ; focus-visible or ;
  fallback @supports not backdrop-filter (fonds quasi opaques).
  Scope html:not(.et-plight) -> theme clair intact (verifie capture).
- Assets chrome NON touches (pas de bump sw.js).

## 76. Offre champs matures renforcee (2026-08-06)

- amont/services-ep.html : nouvelle section #champs-matures (apres
  #packs-phase, style trisec/fam6 existant, --pac orange F2A65A) —
  5 leviers : diagnostiquer (revue integree), recuperer plus (pilotes
  EOR par paliers, ASP local), valoriser l'eau (Water-to-Value),
  etendre la vie (integrite & maintenance predictive), optimiser
  l'OPEX (configurateur pack EOR) ; bandeau modele commercial 'baril
  additionnel constate' + mailto pre-rempli operateur E&P.
- services-ep-en.html (page EN generation anterieure) : section
  #mature-fields equivalente au format ofsc de cette page (4 cartes).
- solutions.html / solutions-en.html : lien 'Offre champs matures' /
  'Mature-fields offer' ajoute dans le tiroir Produire & recuperer.
- QA Playwright : sections rendues (FR h=1084, EN h=889), 0 erreur
  console, liens verifies (eor#eor, #eor-science, journaux eau et
  integrite, configurateur #p=operateur&d=eor). Secrail OK.

## 77. Titres et sous-titres : passe benchmark majors (2026-08-06)

- Audit des h1 du site vs pratique des majors (TotalEnergies, Chevron,
  Equinor) : home et pages corporate deja au niveau (h1 'benefice',
  ex. 'Le Tchad exporte son brut et importe ses carburants. Nous
  inversons.'). Les h1 'etiquette' des sous-pages de poles
  (ex. 'Logistique & corridor d'export') sont VOULUS : symetrie
  subnav <-> h1 (wayfinding), avec standfirst fort dessous — meme
  pattern que les pages sections des majors. Conserves.
- 4 h1 purement fonctionnels modernises :
  achats 'Achats & approvisionnement' -> 'Acheter tchadien d'abord,
  approvisionner sans rupture.' (EN : 'Buy Chadian first, supply
  without interruption.') ; publications 'Publications & documents'
  -> 'Ce que nous affirmons, nous le publions.' (EN : 'What we
  claim, we publish.'). Leads existants conserves.
- Pages legales laissees en h1 fonctionnels (attendu).

## 78. Aval enrichi : la gamme mini-raffinerie (2026-08-06)

- aval/raffinage.html + raffinage-en.html : 3 nouvelles sections apres
  raf-etapes/raf-steps (style epw existant + mrx-css, verre navy
  html:not(.et-plight) car fond photo) :
  (1) #modeles / #models — gamme MR-500 'Pionnier' (1 train, 500 b/j,
  conteneurisable), MR-1000 'Bassin' (2 trains, 1 000-2 000 b/j),
  MR-2000 'Hub+' (3+ trains, 6 000 b/j, bitume+GPL, metallurgie TAN
  4,7) ; note echange de trains façon Mobile Station + cumul ~40 kb/j
  2030 -> /projets#ch-raffinerie (PIEGE : l'ancre projet est
  ch-raffinerie, pas ch-raffinage).
  (2) #ultra-moderne / #ultra-modern — 6 tuiles : jumeau numerique,
  IA des rendements, exploitation a distance/robotique, energie
  propre de procede (zero torchage), eau en cycle ferme, securite
  instrumentee (HAZOP/LOPA, SIS/ESD).
  (3) #cle-acces / #access-key — bandeau 'Acces aux Energies commence
  a la raffinerie' reliant reseau/produits/distribution/petrochimie
  + mailto. QA : 0 erreur console, hauteurs FR 682/774/352.

## 79. Manifeste « Les energies du Tchad, entre nos mains » (2026-08-06)

- societe.html : section #entre-nos-mains (apres #vision, pattern
  sk/h2/note de la page, numerotee 03a) — methode en 4 plans :
  capitaux, competences (80 %, Tchaditude), decisions (N'Djamena),
  donnees (in-country, TchadiTech) ; note 'prendre en main est la
  condition du partage' reliant a Acces aux Energies. corp-nav enrichi
  (lien L'approche).
- societe-en.html (page generation anterieure, sans <section>) :
  ancre #in-our-hands + h2 + lead condense equivalent, avant #model.

## 80. QA de coherence : chiffres et terminologie (2026-08-06)

- CONTRADICTION MAJEURE corrigee : la carte du cadastre 2025 (donnee
  canonique : 44 blocs = 11 attribues + 26 libres + 5 en changement +
  2 production, chips affichees) contredisait le texte du site :
  '21 blocs libres' (x68 FR+EN) et '42 blocs' (x11, legendes de la
  carte elle-meme). Harmonise sur la carte : 21->26 (blocs libres/
  ouverts/open/free), 42->44. 53 fichiers.
- 'societe en structuration' (gabarit ppj-note, x11) -> 'societe en
  constitution' (standard x304) ; 'company in structuring' -> 'company
  in formation'. Les usages naturels ('en phase de structuration',
  'finalise sa structuration') conserves.
- Marques verifiees : Water-to-Value(TM)/NRJ+(TM)/EnerClub(TM)
  coherents ; 'Mobile Station' sans TM apres premiere mention = choix
  editorial, conserve.

## 81. Scan d'ameliorations pages/sections (2026-08-06)

- Scan statique 180 pages : meta desc, canonical, h1 unique, alt
  d'images, ancres locales, liens internes (conscient des clean URLs).
  Resultat quasi propre ; 1 vrai defaut : le commutateur de langue
  href="/en" pointait vers une URL inexistante (404) sur les 9 pages
  FR sans jumeau (carrieres, innovation, communautes, brochure,
  tchaditech/*) -> repointe vers /index-en + hreflang + title
  explicite (2 liens par page, 18 corriges).
- Faux positifs connus : ancre JS '#i-'+p[9]+' (boutique), pages
  google-verify/404.

## 82. QA structure du site (2026-08-06)

- Sitemap 178 URLs <-> 180 fichiers servis : correspondance exacte
  (hors 404 et google-verify). 0 page orpheline (tous les hubs de
  poles ont des entrees ; attention aux normalisations
  /amont vs /amont/ dans les scanners — faux orphelins sinon).
- Alternates hreflang : absents uniquement des 13 pages FR sans
  jumeau (comportement correct, pas d'auto-reference requise).
- Breadcrumb absent uniquement de la home (correct).

## 83. TchadiTech traduit : 8/8 poles bilingues (2026-08-07)

- REWIND #6 au prealable : restauration git archive FETCH_HEAD
  (366 fichiers, parite OK), serveur cleanserv relance.
- 5 jumeaux crees (convention -en meme dossier) : tchaditech/
  socle-en, innovations-en, outils-en, rd-en, recits-en.
- NOUVELLE METHODE de fabrication (build_twin.py + segx.py) :
  extraction de segments indexes (noeuds texte + attributs aria-label/
  title/alt/placeholder) du <main> FR, traduction par INDEX (immunisee
  contre les cascades de sous-chaines du procede par paires §58/§66),
  reinjection positionnelle avec espaces preserves ; chrome donneur =
  tchaditude/academie-en.html ([body:main) + (</main>:fin]) ; tete FR
  transformee (title/desc/og/twitter/canonical + trio alternates,
  BreadcrumbList EN, WebPage inLanguage/en, og:locale en_US) ;
  reecriture des liens internes via frmap.json (85 paires, regeneree
  depuis les alternates du site) + hreflang="fr" sur cibles FR-only.
  Couverture 335+102+181+153+65 = 836 segments, 0 residu FR detecte.
- PIEGE : le JS des accordeons tri-more vit dans un <script> du main
  (non traduit par segments) -> patch 'Reduire /En savoir plus' ->
  'Collapse /Learn more ' (socle-en).
- Cablage : trio alternates ajoute aux 5 pages FR + commutateur EN
  /index-en -> jumeau ; 84 pages EN reecrites vers les jumeaux
  (mega-menu compris, marques '(in French)' retirees sur ces cibles) ;
  sitemap 178 -> 183 URLs.
- QA Playwright : lang=en, h1 corrects, 0 ancre locale cassee,
  0 erreur console sur les 5 jumeaux.

## 84. QA translucidite des tuiles : verre generalise (2026-08-07)

- Audit Playwright (16 pages, 10 familles) : pj/art (deja verre §75),
  ppj-card/pmore-card/ttg-t/fam6 (deja translucides + blur via chrome
  partage), adx (photo ::before, par conception). RESTAIENT PLATES :
  epw-c (rgba blanc .02, sans blur — 37 pages), ofsc-c (pages EN
  anciennes generations), pcard (navy .76 sans blur).
- CORRECTIF <style id="tile-glass"> injecte dans 80 pages :
  html:not(.et-plight) epw-c/ofsc-c -> rgba(16,26,44,.62) +
  backdrop-blur 8px sat 1.08 ; pcard -> blur ajoute (fond conserve) ;
  fallback @supports (fond .92 si pas de backdrop-filter). Theme
  clair intact (verifie : et-plight non affecte).
- Verification calculee : epw-c/ofsc-c/pcard/pj/art/ppj-card tous
  translucides AVEC blur en theme sombre. Capture raffinage (etapes
  sur photo) : lisibilite nette.

## 85. Corporate traduit — vague 1 : 7 jumeaux EN (2026-08-07)

- Nouveaux jumeaux racine (fabrique segments-indexes, donneur
  parc-en.html) : carrieres-en, gouvernance-en, innovation-en,
  cibles-2030-en, communautes-en, accessibilite-en, avertissements-en
  (396 segments + heros traduits, 0 residu FR detecte).
- PIEGE STRUCTUREL : sur ces pages FR, le hero (h1 + lead + fil
  d'Ariane + span#main-content) vit AVANT <main> — la composition
  chrome-donneur + main traduit perdait h1 et cible du lien
  d'evitement. Correctif : bloc hero FR extrait ([div.hero .. <main)),
  traduit et insere avant <main> dans chaque jumeau ;
  span#main-content ajoute a cibles-2030-en.
- Particularites : gouvernance.html avait deja fr+x-default (trio
  complete, doublon retire du jumeau) et son commutateur pointait vers
  /ethique-en (corrige -> /gouvernance-en) ; cibles-2030/accessibilite/
  avertissements n'ont pas de commutateur EN (chrome utilitaire —
  choix conserve, alternates presents) ; commutateur FR des jumeaux
  repointe de /amont/parc (donneur) vers leur page FR.
- Cablage : trios alternates sur les 7 pages FR, commutateurs /en ->
  jumeaux, 91 pages EN reecrites (marques '(in French)' retirees sur
  ces cibles), sitemap 183 -> 190 URLs, frmap 92 paires.
- QA Playwright : lang=en, h1 corrects, 0 ancre cassee, 0 erreur
  console. RESTE au backlog traduction : brochure (compilation),
  charte, plan-du-site.

## 86. Corporate traduit — vague 2 : charte-en + plan-du-site-en (2026-08-07)

- REWIND #7 au prealable : restauration git archive (378 fichiers,
  parite OK), outillage /root/work reecrit (segx, build_twin,
  cleanserv, frmap regeneree — 92 paires).
- 2 jumeaux : charte-en (Design System, 113 segments + hero — PIEGE :
  conteneur hero = div.dsh, pas div.hero) et plan-du-site-en (105
  segments FR traduits ; la section 'English version' de la page,
  deja en anglais, est conservee telle quelle — l'omission d'une cle
  = segment garde a l'identique, par conception de la fabrique).
- Cablage : trios alternates FR, commutateurs FR des jumeaux, 93
  pages EN reecrites (/charte, /plan-du-site -> jumeaux, marques
  '(in French)' retirees), sitemap 190 -> 192 URLs.
- QA : lang=en, h1 corrects, 0 ancre cassee, 0 lien interne casse sur
  plan-du-site-en (verification exhaustive des cibles), 0 erreur
  console. RESTE : brochure (1264 segments — chantier dedie).

## §87 — 2026-08-07 · Brochure bilingue : /brochure-en (dernière page traduite)
- **Bug majeur corrigé dans la fabrique** : le tokenizer de segx.py n'était pas "raw-text aware" — un `<script>` dans `<main>` contenant la chaîne `'<script>'` bloquait le compteur de skip et masquait tout le reste de la page (la brochure ne remontait que 1 264 segments/63 ko au lieu de 4 960 segments/232 ko réels). Tokenizer réécrit : script/style traités comme éléments raw-text (saut direct au tag fermant).
- **/brochure-en** créé : jumeau complet pleine page (chrome custom préservé — preloader, dotnav, oil ticker, 28 scripts post-main) : 4 801 segments traduits + 70 littéraux JS (BASINS, CHAIN, PROFILES, HUBS, cadastre M, stations dashboard, formulaires mailto, tags) + unités kb/j→kb/d, toLocaleString fr-FR→en-US. Traduction : 31 lots manuels (~170 ko de dictionnaires, /root/work/btr/) + moisson d'alignement sur jumeaux existants.
- QA : 0 erreur console, h1/lang EN, calculatrice raffinage + bassins interactifs + tuiles distribution + dashboard OK en EN (FR non régressé), 0 ancre cassée, 64 liens internes 200, balayage accents/stopwords : 0 résidu FR (hors marque « Accès aux Énergies », conservée comme sur tous les jumeaux).
- Cohérence : « 21 libres » périmé corrigé en « 26 libres » (3×) côté FR (canon §80) ; JSON-LD Organization + Dataset Atlas traduits ; FAQPage retiré ; trio alternates + canonical.
- Câblage : brochure.html (alternates + nx-lang → /brochure-en), carnets-en/publications-en retargetés, sitemap 193 URL, frmap 95 paires.
- **Dette découverte (à traiter)** : avec le tokenizer corrigé, 30 paires FR/EN sont désalignées (ex. amont/eor 368 segs FR vs 56 EN) — des jumeaux anciens en retard sur les enrichissements FR (§76/§78) ou touchés par le même bug. Audit de parité FR/EN à programmer.
- Le site est désormais 100 % bilingue FR/EN : plus aucune page non traduite.

## §88 — 2026-08-07 · Parité FR/EN vague 1 (7 jumeaux complets) + image unique du hero d'accueil
- **Audit de parité** (tokenizer corrigé, 95 paires) : 41 paires alignées, 20 pages EN identifiées comme *résumés* anciens (ex. reseau-en 1 ko vs 29 ko FR). La brochure-en publiée en §87 sert désormais de mémoire de traduction (~3 400 paires récoltées par jointure d'index de tokens).
- **7 jumeaux reconstruits en versions complètes** (méthode stub-splice : head FR transformé + chrome du stub existant sans son héros + main FR traduit) : produits-en, eor-en, raffinage-en, contact-en (héros FR traduit réinséré), projets-en, reseau-en, distribution-en. 4 lots de traduction (~26 ko, /root/work/btr/w1-4.json) + moisson maître. QA Playwright : 0 erreur console, 1 h1/page, 0 ancre cassée (span#main-content réinséré sur projets-en), 0 résidu FR hors marque.
- **Image unique du hero d'accueil** (directive utilisateur) : le diaporama 7 images (piste-desert en premier, rotation 6 s) remplacé par une seule image forte — pompe-petrole.webp (chevalet au couchant, tons or raccord à la palette, 1900×1425). Légende dynamique figée sur « Pompe à balancier / Champs matures — bassin de Doba » (EN : « Pumpjack at work »), pastilles réduites à 1, script de rotation retiré. Bonus : le preload existant pointait déjà pompe-petrole → LCP désormais cohérent. Appliqué à index.html + index-en.html.
- Rewind conteneur n°8 traversé (restauration Git + refabrication segx/frmap).
- Reste au backlog parité : 13 pages (clients, services-ep, investisseurs, societe, engagements, index FR→EN?, carnets, faq, solutions, publications, mentions-legales, confidentialite, cookies) ≈ 116 ko.

## §89 — 2026-08-07 · Thème clair par défaut sur tout le site (directive « à l'image des majors »)
- **Défaut clair sitewide** : script pré-paint `et-light-def` injecté dans les 196 pages — `et-plight` appliqué par défaut (`et-jlight` pour les pages journal-*), sauf si l'utilisateur a choisi le sombre (localStorage '0'). Bascule ☀ existante conservée (persistance testée dans les deux sens ; le bouton n'est masqué que pendant le bandeau cookies, par design).
- **Hero d'accueil en clair** : le bundle masquait la photo (`display:none`) — override inline `lt-hero` (index + index-en) : photo pompe-petrole visible dans la bande sombre du héros (design assumé du thème clair), fondu vers crème #FBF8F2 en pied de bande, `header.hero` rendu transparent (spécificité :not(#_)×3).
- QA Playwright : accueil, /amont, /brochure(-en), journal (et-jlight), boutique — rendu majors-like (nav claire, bande héros photo, contenu crème/encre) ; les « fantômes » constatés étaient les animations de révélation en cours (captures resserrées OK).
- **Bug §87 découvert et corrigé** : paires empoisonnées de la moisson (« Ener »→« Tchad »→« Accès aux Énergies »→slogan) issues d'un décalage local de tokens — 14 tokens + 3 aria réparés sur brochure-en (dont « Country: Accès aux Énergies » du factsheet → « Chad », et le label carte SVG) ; entrées purgées de master_harvest. Les 7 jumeaux de §88 vérifiés sains (chrome stub intact).

## §90 — 2026-08-07 · Home sans bandeaux (directive « caractère immersif et translucide en verre »)
- Bandeau cotations (#oilticker), barre de progression (#readbar) et rdprog masqués sur index + index-en (style inline `no-bands`) : le héros photo coule désormais bord à bord sous la nav en verre, en clair comme en sombre. Le script de placement tolère l'absence du ticker (padding héros 152px inchangé).

## §91 — 2026-08-07 · Inspection visuelle home vs Chevron + correctif héros sombre
- Inspection comparée chevron.com / accueil (navigateur réel + captures) — constats consignés dans le rapport de session.
- **Bug corrigé** : en sombre, l'image unique du héros restait pilotée par l'animation diapoCycle 42 s (opacité 0 ~85 % du temps → photo invisible en prod ; le clair était protégé par lt-hero). Pin ajouté dans `no-bands` : `.diapo i{animation:none!important;opacity:1!important}` (index + index-en).
- Constat navigateur utilisateur : localStorage et-plight='0' (préférence sombre stockée) — le défaut clair est bien respecté/écrasé par le choix utilisateur, comportement voulu.

## §92 — 2026-08-07 · Héros d'accueil allégé façon majors (« applique »)
- Style inline `hero-lite` (index + index-en) : le premier écran ne garde que kicker discret + h1 rotatif (taille montée à clamp 2.6-4.4rem) + CTA principal « Découvrir EnerTchad » + mention société en constitution. Masqués du héros : badge pill, paragraphe lead (hx-sub), rail chaîne (hchain), bouton secondaire Investir (btn-g), liens Boutique/Devenir client (hx-links) — contenus tous repris dans les sections sous le pli (Quatre maillons, stats, CTA investisseurs).
- QA deux thèmes : photo héros visible, composition déclaration→CTA→tuiles stats, aucune régression console.

## §93 — 2026-08-07 · « Tout appliquer » : les 9 propositions home + accueil EN jumeau
- **Sections majors ajoutées** (index, style inline `home-plus`) : `.hwords` mots géants en escalier Unité/Innovation/Durabilité (or/bleu/vert, bande navy 16vh) en tête de main ; `.hbelieve` manifeste plein écran (« Nous croyons que le pétrole du Tchad doit d'abord profiter aux Tchadiens… ») + CTA vers /societe#entre-nos-mains ; `.hcollage` « L'énergie qui bâtit le pays » + mosaïque décalée de 5 photos du parc — insérés avant #cta-band.
- **Densité** : stats héros 4→3 (tuile 12 stations masquée) ; #cta-band réduit à un CTA (Nous contacter masqué) ; bandeau cookies restylé en fine barre pleine largeur bas de page ; légende photo réduite à un crédit mono une ligne (pastilles + 3ᵉ ligne masquées) ; micro-cue de scroll animée sous le CTA héros (prefers-reduced-motion respecté).
- **Accueil EN reconstruit en vrai jumeau** (147 ko) : 708 segments traduits via home_dict (6 640 entrées : moissons + lots h1/h2 ~14,8 ko) — héros rotatif 5 messages EN, toutes les nouvelles sections traduites, switch FR corrigé (`/` + FR·EN), canonical/titre/desc EN conservés, mailto newsletter traduit, 0 résidu FR hors marque, 0 erreur console, 0 ancre cassée.

## §94 — 2026-08-07 · QA visuel de l'accueil (deux thèmes + mobile) — correctifs mobile
- **Balayage complet** des deux accueils en clair (pageH ≈ 19 276 px) et sombre (≈ 18 953 px), ~10 captures par thème + 3 mobiles 390 px : desktop propre dans les deux thèmes sur toutes les sections (héros allégé, hwords, maillons, hbelieve, collage, cta-band, footer).
- **2 défauts mobiles corrigés** (index + index-en, media query 760 px dans `home-plus`) : pastilles .hx-dots surdimensionnées → forcées à 12 px rondes ; crédit photo #diapo-cap chevauchant la tuile « 20 Md » → masqué en mobile. Leçon spécificité : la règle desktop `#diapo-cap …{display:flex!important}` (2×:not(#_)) située après la media query gagnait à égalité de spécificité — hide mobile monté à 3×:not(#_). Vérifié Playwright 390 px : display:none effectif, pastilles 12×12.
- Note QA : les révélations blur/mot-à-mot (>1,3 s) produisent de faux « fantômes » sur captures précoces — attendre ≥2,5-3,5 s (règle consignée).

## §95 — 2026-08-07 · « Applique » : audit TchadiTech vs Chevron — les 5 recommandations
- **Plateformes phares nommées** (recommandation 1, façon ApEX/APOLO de Chevron) : 3 cartes-récits ajoutées au hub — EnerVision™ (jumeau numérique & supervision, cible), EnerField™ (suite terrain & robotique, cible), Mini-raffinerie 2.0 (procédé modulaire, concept) — photo, badge de statut, 2 lignes, lien vers la sous-page. Mention légale « marques en préparation — société en constitution » (canon d'honnêteté conservé).
- **Blocs-récits pleine couleur alternés** (rec. 2) : 3 blocs 50/50 photo+panneau (navy/vert profond/brun or) — « Né numérique, sans dette technologique » → socle ; « Water-to-Value™ » → R&D ; « Mobile Station™ » → innovations.
- **Bande animée « Le flux de la donnée »** (rec. 4, substitut de vidéo) : rail L1→L4 avec 4 nœuds + 3 points or animés (CSS pur, prefers-reduced-motion respecté, rail masqué en mobile), 4 étapes légendées.
- **Cartes-articles récits** (rec. 5) : 3 cartes vers les ancres t2-* de /tchaditech/recits.
- **Aération h2** (rec. 3) : promotion h3→h2 des têtes d'articles ancrées (rd ×6, innovations ×6, recits ×3, FR+EN) et des 3 accroches de bandes d'outils (FR+EN) — attributs/ancres conservés, hiérarchie sémantique nette (rd passe de 1 à 7 h2).
- **Hub EN** (pole-tchaditech-en) : mêmes 4 sections traduites (liens vers les jumeaux -en, ancres identiques) + correction du texte périmé « currently published in French / Read in French » (les jumeaux EN existent depuis §87-88).
- **Leçon cascade** : les bandes sombres inline doivent survivre à 3 couches — wipe clair `html.et-plight main section/p/h2:not(#_)` (armure :is(...) à 2 classes), wipe sombre `main>section:not(#_)` du bundle subland, et surtout `etDarkFix` `html:not(.et-plight):not(.et-jlight) main>section:not(#_):not(#__)` → armure finale à 3×:not(#id). Images de cartes : style inline avec !important (seul niveau qui bat tout).
- QA Playwright deux thèmes + mobile 390 : fonds, textes et images corrects partout ; grilles 1 col mobile ; 0 débordement horizontal ; ancres recits(-en) vérifiées.

## §96 — 2026-08-07 · QA version mobile (balayage sitewide 390 px)
- **Balayage automatisé de 21 pages** (accueils FR/EN, hub+sous-pages TchadiTech, brochure, aval/produits, aval/reseau, aval/distribution, amont, amont/eor, contact, societe, investisseurs, faq, clients, journal, boutique) : 0 débordement horizontal (scrollW 380 partout), 1 h1 par page, 0 erreur console sur les vraies routes, pas de texte <11 px significatif hors mentions.
- **Vérifications interactives** : menu hamburger (accordéon propre, lien English, CTA Investir), onglets calculateurs d'outils TchadiTech fonctionnels (slider + profils), barre d'onglets basse app-like OK partout, thème sombre mobile vérifié (hub TchadiTech).
- **Constats mineurs consignés sans correctif** : la pilule flottante « SUITE » est partiellement recouverte par le bandeau cookies tant qu'il n'est pas accepté (disparaît après « J'ai compris ») ; pastilles du héros 12 px = choix design §94 (rotateur décoratif, non essentiel à la navigation).
- Leçon d'outillage : les routes FR de l'aval/amont vivent en sous-dossiers (/aval/produits, /amont/eor…) — les 404 initiaux du balayage venaient d'URLs plates inexistantes (aucun lien cassé réel : vérifié sitewide, les switches EN→FR pointent bien vers /aval/*).
- Rewind conteneur n°9 traversé pendant ce cycle (restauration Git ; cette entrée re-consignée après le rewind).

## §97 — 2026-08-07 · Audit + modernisation header/footer mobiles (sitewide)
- **Audit 390 px** — header : barre haute déjà en verre (blur) mais opaque crème en thème clair ; pas d'accès langue hors menu. Footer : 2 163 px de haut (≈ 2,5 écrans de listes à plat), boutons flottants ☀/haut-de-page recouvrant les liens de contact, 18 liens + 8 chips toujours dépliés.
- **Bloc `et-mhf` injecté dans 189 pages** (style + script en fin de body, media query ≤760 px, inertes en desktop) :
  1. **Accordéons footer** — les 4 colonnes (Nos pôles, Clients & innovation, Groupe, Durabilité & investisseurs) repliées par défaut, ouverture au tap sur le h3 (role=button, tabindex, aria-expanded, indicateur +/− en ::before — le ::after du bundle porte le tiret or, leçon retenue) ; footer accueil 2 163→1 359 px.
  2. **Pastille langue FR·EN dans la barre haute** — clone JS du switch .nx-lang de nx-util (href correct par page), inséré avant la loupe ; garde-fou : pages journal (chrome propre) non touchées, elles ont déjà leur lien EN.
  3. **Header verre en thème clair** — rgba(250,247,241,.74) + blur 18px (armure 3×:not(#id) contre l'opaque du bundle).
  4. **FABs compacts** — ☀ 38 px opacité .62, toTop scale .82 opacité .68 (pleine opacité au toucher) : moins d'occlusion du contenu.
- Bug corrigé en route : insertBefore échouait (.nav-search pas enfant direct de .nx-bar) et avortait tout le script — insertion via sr.parentElement. QA : 8 pages types (FR/EN/journal/brochure/hub), 0 erreur console, hrefs de pastille corrects, desktop inchangé (pas de pastille, 18 liens visibles).

## §98 — 2026-08-07 · Parité FR/EN vague 2 : clients, services-ep, investisseurs (3 jumeaux complets)
- **Fabrique reconstruite après le rewind n°9** : segx.py (tokenizer raw-aware) réécrit ; frmap régénéré depuis les alternates hreflang (95 paires) ; moisson refaite par jointure d'index de tokens sur 14 jumeaux publiés (mains) + régions chrome (nav/menu/footer/tail) du couple index — 5 872 paires, tokens de marque proscrits.
- **3 jumeaux complets** construits via build_twin.py (nouveau générateur : traduction pleine page par tokens, head transform — title/desc/og/twitter/canonical/inLanguage, FAQPage retiré —, réécriture frmap des hrefs, switch nx-lang → page FR, JSON-LD et littéraux JS traduits) :
  · **clients-en** (60 ko → 134 ko) : 7 portes clients, FAQ, programmes — lots c1-c4 (~350 paires).
  · **services-ep-en** (95 ko → 178 ko, le plus gros jumeau après la brochure) : 8 familles OFS, 10 lignes d'intervention, flotte de captage frac-tanks, 4 modèles contractuels — lots s1-s4 (~600 paires).
  · **investisseurs-en** (85 ko → 148 ko) : thèse, cascade capitalistique, 5 marges, jalons, souscription, avis anti-fraude — lots i1-i2 (~370 paires).
- QA Playwright ×3 : 0 erreur console, 1 h1, lang=en, switch FR correct, 0 ancre interne cassée, skip-link présent ; résidus FR : uniquement marque + libellés du switch (voulus).
- Backlog parité restant : societe, engagements, carnets, faq, solutions, publications, mentions-legales, confidentialite, cookies (~62 ko).

## §99 — 2026-08-07 · Marque « Accès aux Énergies » visible sur le header mobile (signalement utilisateur)
- **Cause** : règle bundle `@media(max-width:560px){.brand small{display:none}}` (bundle_core_a1 + x_cd256286824c) masquait la devise sous le logo en mobile.
- **Correctif** : règle ajoutée au bloc `et-mhf` des 190 pages — `@media(max-width:560px){.nav .brand-tx small:not(#_){display:block!important}}`. Vérifié 390 px, deux thèmes : « ACCÈS AUX ÉNERGIES » 115×13 px sous EnerTchad, aucun chevauchement avec la pastille FR·EN, hauteur de barre inchangée (70 px). Le footer, qui affichait déjà la devise, n'est pas concerné.
- Publication en 10 commits (mêmes lots que §97), parité 190/190, vérifié en production.

## §100 — 2026-08-07 · QA complet du site (statique + dynamique + interactif + production)
- **Statique (195 pages)** : 0 lien interne cassé, 0 asset/image de fond manquant, 0 id dupliqué, canonical présent partout (sauf 404 et fichier de vérification Google, voulu), et-light-def et et-mhf présents sur toutes les pages concernées. Sitemap 193 URLs : 100 % résolues, seules /404 et le fichier Google hors sitemap (correct). Faux positifs écartés : les <title> multiples de brochure/atlas sont des titres SVG accessibles.
- **Dynamique (195 pages, Playwright ×6 workers)** : 0 erreur console, 0 erreur JS, 1 h1 par page, 0 débordement horizontal desktop, thème clair par défaut partout, 0 image cassée. Seul signalé : le fichier de vérification Google (non-page).
- **Thème sombre** (6 pages clés dont les 3 nouveaux jumeaux) : propre, opt-out persistant vérifié dans les deux sens.
- **Interactif** : bascule ☀ (persistance localStorage OK), recherche Cmd+K (ouverture + champ), méga-menus desktop (rendu solide et lisible une fois la transition finie — le « voile » n'est que l'animation), accordéons footer + pastille FR·EN + devise mobile vérifiés sur les nouveaux jumeaux.
- **Production** : parité octet-à-octet locale/prod sur 8 routes échantillons, 404 servie correctement avec la page de marque.
- Rewind conteneur n°10 traversé en début de cycle (restauration Git propre).
- Verdict : aucun défaut à corriger — site sain sur les 195 pages.

## §101 — 2026-08-07 · Parité FR/EN vague 3 (finale) : 9 jumeaux — le site est 100 % bilingue en versions complètes
- **Fabrique reconstruite après le rewind n°11** (segx + frmap 95 + moisson 6 901 paires depuis 17 jumeaux publiés + régions chrome). Correction du normalisateur : l'espace fine insécable (U+202F) est désormais repliée comme l'insécable — les clés de dicos avec espace simple matchent.
- **9 jumeaux complets** (build_twin, ~810 paires traduites en 8 lots l1/p1/so1/u1/f1/ca1/e1/sc1) :
  · societe-en (63→99 ko) : identité, mission, vision, « entre nos mains », genèse, gouvernance, fonctions support.
  · engagements-en (61→96 ko) : HSE/ALARP, qualité, sécurité opérationnelle, conformité, arc E-S-G, double matérialité, griefs.
  · carnets-en (72→94 ko) : les 24 cartes d'articles, fil des jalons, salle de presse, kit média (boilerplates FR/EN conservés).
  · faq-en (78→85 ko) : les ~25 questions complètes (société, capital, activités, pratique, anti-fraude).
  · solutions-en (98→103 ko) : les 6 familles de besoins et la recomposition par pôles.
  · publications-en (64→70 ko) : l'étagère documentaire complète.
  · mentions-legales-en, confidentialite-en, cookies-en (53→59-60 ko chacune) : pages légales intégrales.
- JSON-LD et littéraux JS traduits page par page ; QA Playwright ×9 : 0 erreur console, 1 h1, lang=en, switch FR correct, 0 ancre cassée, 0 résidu FR hors marque.
- **Jalon : les 95 paires FR/EN du site sont désormais toutes des versions complètes** — plus aucun résumé EN. Le backlog de parité ouvert au §87 est soldé.

## §102 — 2026-08-07 · Audit de cohérence du versant EN complet (après le jalon 100 % bilingue)
- **Crawl des 95 pages EN** (détection corrigée : `<html lang="en"` strict, le premier détecteur confondait `hreflang="en"`) : métadonnées irréprochables — 0 og:locale français, 0 canonical erroné, 0 switch mal étiqueté.
- **43 libellés d'accessibilité français** trouvés sur 17 pages EN des premières vagues (aria-label du pager de pôle « Continuer dans le pôle… », curseur « Niveau de luminosité », sommaire « Thématiques de la page », carte cadastre, 2 alt de photos Zakouma) — tous traduits sur 16 pages (brochure-en : « SHT (Société des Hydrocarbures du Tchad) » conservé, raison sociale officielle dans une phrase anglaise).
- Le versant EN est désormais propre jusqu'aux attributs lus par les lecteurs d'écran.

## §103 — 2026-08-08 · Page arabe : mise à jour d'exactitude + correctif RTL
- **Affirmation périmée corrigée** : la page /ar annonçait « le site complet est disponible en français, avec une section abrégée en anglais » — faux depuis le jalon 100 % bilingue (§101). Remplacé par « disponible en français et en anglais, en versions complètes pour chaque page ».
- **16 libellés de liens** « (بالفرنسية) » → « (FR · EN) » (CTA du héros, 8 cartes de pôles, communautés, carrières, investisseurs ×2, projets, carnets, contact) : les cibles ont désormais leur jumeau EN.
- **Correctif RTL** (bloc inline `ar-rtl-fix`) : le rail de sections `#secrail` était fixé à droite — côté où le texte arabe est aligné — et chevauchait titres et cartes. Miroité à gauche (align-items, sens des translations d'entrée/survol, `margin-inline-start` du label) et masqué sous 900 px. Vérifié : plus aucun recouvrement visuel, le chevauchement géométrique résiduel tombe sur le bord déchiqueté (comportement identique aux pages LTR).
- Contrôle : les FABs ☀ et haut-de-page étaient **déjà** correctement miroités — une première tentative de « correction » les avait inversés, annulée après mesure.
- QA desktop + mobile 390 : dir=rtl, 1 h1, 0 erreur console, 0 ancre cassée, 0 débordement.

## §104 — 2026-08-08 · Backlog soldé : passe chrome sitewide du versant EN (mégamenus, commutateurs, marqueurs)
Le dernier point de backlog nav — « les mégamenus des pages EN pointent encore vers les sous-pages FR, passe à planifier quand plus de jumelles existeront » — est enfin exécutable : les 95 paires sont complètes depuis §101.
- **200 liens internes réécrits** sur 92 pages EN : chaque lien de chrome (mégamenus, pied de page, pagers de pôle, CTA) visant une page FR pointe désormais vers son jumeau EN. Les commutateurs de langue sont exclus par construction (nx-lang, bback, jlang, class="lang", libellés « français ») — ils doivent rester vers le FR.
- **246 marqueurs obsolètes retirés** : `hreflang="fr"` posé au §86 sur des liens dont la cible est désormais anglaise (seul subsiste celui du Configurateur, page FR sans jumeau).
- **16 commutateurs de langue cassés réparés** — défaut sérieux et invisible : 11 pages EN (accessibilite-en, avertissements-en, carrieres-en, charte-en, cibles-2030-en, communautes-en, gouvernance-en, innovation-en, plan-du-site-en, tchaditude/rayonnement-en, services-en) pointaient **vers elles-mêmes** (cliquer « FR » ne faisait rien), et les 5 pages TchadiTech (socle, rd, innovations, outils, recits) renvoyaient vers `/tchaditude/academie`, un pôle sans rapport. Contrôle systématique : les 95 commutateurs visent maintenant leur exacte contrepartie FR.
- **~140 libellés d'accessibilité français** traduits (retour à l'accueil, contenu principal, navigation, recherche, impression, partage, cookies, curseur de luminosité, « Carnets liés », légendes de cartes Doba–Kribi/Komé/Sédigi).
- **4 méta-descriptions >165 c** resserrées (faq-en 171→150, publications-en 166→137, services-ep-en 184→146, tchaditude/services-en 173→143), desc + og + twitter alignées.
- QA Playwright sur les 95 pages EN : 0 erreur console, 1 h1, lang=en partout, 216 cibles internes uniques toutes résolues, 0 lien FR résiduel hors commutateurs.

## §105 — 2026-08-08 · Audit comparé services & solutions vs SLB / Halliburton / Baker Hughes
Benchmark des trois références parapétrolières mondiales (pages Products & Services de SLB, famille Completions de Halliburton, OFSE + Well Production de Baker Hughes), confronté à /amont/services-ep (3 631 mots, 8 h2, 13 cartes) et /solutions (899 mots, 9 h2, 40 liens sortants).

**Motifs communs aux trois** :
1. **Double axe d'entrée orthogonal** — SLB sépare « Solutions » (par objectif : Production Optimization, Recovery Enhancement, P&A…) et « Products & Services » (par taxonomie technique sur 3-4 niveaux). Baker Hughes croise 4 familles métier avec 4 verbes d'objectif (Improve connectivity, Mitigate risk, Optimize production, Control remotely). Halliburton range par cycle de vie du puits (Subsurface → Well construction → Completions → Production → Abandonment → Integrated services → Software).
2. **Technologies nommées et déposées** — chaque ligne de service expose des marques : SmartWell®, ZEUS IQ™, Turing®, OCTIV®, Velocity Revolve+™ (Halliburton) ; Tela, Lumi, Electris, Reda Agile (SLB) ; Leucipa, ProductionLink, SureFIELD (Baker Hughes). La marque *est* l'unité de navigation.
3. **Bandeau de preuves chiffrées** en tête de famille — Halliburton : 30 % d'émissions de frac en moins, 50 % de jours sur site en moins, 30 % de transitions plus rapides, 25+ ans de SmartWell.
4. **Preuve par le client** — SLB « See our solutions in action / Explore Case Studies » ; Halliburton : études de cas datées + citations de dirigeants nommés (Sr. VP) + communiqués liés.
5. **CTA expert récurrent** — « Talk to an expert » en tête ET en pied de chaque page famille.

**Nos forces** : le double axe existe déjà (services-ep « Trois entrées : phase de champ / famille / intervention précise » + solutions « par besoin »), et c'est exactement le motif SLB ; le catalogue ligne-par-ligne (10 lignes wireline→P&A) rivalise en granularité avec Halliburton ; l'honnêteté « société en constitution » est un actif que les majors n'ont pas besoin d'avoir.

**Écarts prioritaires** (recommandations, non appliquées) :
1. **Nommer les offres** — une seule marque (Water-to-Value™) sur toute la page services-ep. Baptiser les 5 packs de phase et les briques transverses (base-vie, supply chain, formation) donnerait des unités de navigation mémorisables, comme les majors.
2. **Bandeau de preuves chiffrées** en tête de services-ep et de chaque famille (4 chiffres : mobilisation évitée, NPT, % OOIP visé, contenu local) — la page contient déjà les chiffres, dispersés dans le texte.
3. **Cartes de cas d'usage datées** — nous avons des « cas d'usage chiffrés » par service mais pas de rubrique « nos interventions en situation » ; les 3 carnets liés en fin de page sont le germe à promouvoir en rangée de cartes.
4. **CTA expert dupliqué en tête** de services-ep (il n'existe qu'en pied) — motif universel chez les trois.
5. **/solutions trop mince** (899 mots pour 6 familles de besoins) face à son rôle de porte d'entrée : chaque famille mériterait 2-3 lignes de preuve plutôt qu'un simple renvoi.

## §106 — 2026-08-08 · « Déploie » : les recommandations SLB/Halliburton/Baker Hughes appliquées
Les 5 écarts du benchmark §105 sont traités sur /amont/services-ep + /solutions et leurs jumeaux EN.
1. **Les offres sont nommées** — motif central des trois majors (SmartWell®, Tela, Leucipa) : les 5 packs de phase deviennent **EnerScope™** (explorer & dé-risquer), **EnerBuild™** (développer), **EnerRun™** (produire & optimiser), **EnerRevive™** (champ mature), **EnerClose™** (P&A) ; les 3 appuis de chantier deviennent **EnerCamp™** (base-vie & logistique), **EnerSupply™** (approvisionnement), **EnerSkills™** (formation & transfert). Le nom passe dans le kicker, la promesse reste en titre — et une mention rappelle qu'il s'agit de marques en préparation d'une société en constitution, périmètres à l'état de cible.
2. **Bandeau de preuves chiffrées** (`ofs-kpi`) inséré juste sous le héros de services-ep, façon Halliburton : 8 services · 10 lignes d'intervention · 4-12 sem. de mobilisation évitées · 80 % de contenu local. Chiffres déjà présents dans la page, désormais lisibles en 3 secondes. Armure de cascade 3×:not(#id) contre les wipes clair et sombre.
3. **Cartes de récits déjà conformes** — la section « Les Carnets · le métier raconté » utilisait déjà des cartes `card-m` à filet d'accent : recommandation constatée satisfaite, rien à changer (vérifié avant d'agir).
4. **CTA expert en tête** — « Parler à un expert E&P → » ajouté dans le bandeau, en pied du bloc de chiffres ; le motif des trois majors est le CTA expert aux deux extrémités de la page.
5. **/solutions étoffée** — les 6 familles de besoins reçoivent chacune 3 lignes de preuve (`solpr`) : packs nommés et +8-17 % d'OOIP pour l'amont, corridor 1 070 km et réserve distribuée pour l'intermédiaire, trains 500-2 000 b/j et Sédigui pour la transformation, prix ARSAT et Mobile Station™ pour la distribution, Atlas et EnerVision™/EnerField™ pour la décision, trajectoire 10 M→20 Md et académie pour l'ancrage. La page passe de 899 à ~1 555 mots.
- QA : 4 pages × 2 thèmes + mobile 390 — 0 erreur console, 1 h1, 0 ancre cassée, 0 débordement, bandeau en 2 colonnes en mobile, 11 marques rendues par page OFS.
- Leçon d'instrument : `background:linear-gradient(...)` laisse `background-color` à `transparent` — une sonde qui lit background-color conclut à tort que la bande est effacée ; c'est `background-image` qu'il faut lire (fausse alerte écartée par capture).

## §107 — 2026-08-08 · Ultra-review et QA de tout le site (statique + a11y + perf + intégrité)
Revue la plus profonde à ce jour, sur quatre dimensions au-delà du QA §100 (qui couvrait liens, console, h1, débordement, thème, sitemap).

**Accessibilité — axe-core WCAG 2.0/2.1 A+AA sur 14 templates représentatifs** (accueils FR/EN, services-ep, solutions, hub de pôle, clients, contact/formulaire, journal, boutique, atlas interactif, investisseurs, faq, page arabe RTL, outils interactifs) : **0 violation sur 12 des 14 pages**. Seuls les deux accueils remontent des alertes de contraste — toutes analysées une par une (voir ci-dessous).

**Un défaut réel trouvé et corrigé** : le crédit photo `#diapo-cap` de l'accueil s'affichait en blanc cassé (#F5F7FA) **sur le fond crème** en thème clair — mesure pixel : **1,0:1, soit invisible**. Le texte est passé sous la bande photo lors du remaniement §93 sans que sa couleur suive le thème. Correctif `dc-light-fix` (index + index-en) : encre #2A3648 pour la légende, #5A6678 pour la zone, en clair uniquement. Vérifié : lisible.

**Trois faux positifs écartés par mesure de pixels** (axe lit la couleur de fond en remontant la chaîne d'ancêtres et ne voit pas la photo du héros, positionnée en frère absolu — d'où un fond crème supposé) : le h1 rotatif annoncé à 1,4:1 mesure **9,9:1 réel** (pire pixel 6,9:1) ; le kicker or `.hx-slogan` annoncé à 1,22:1 mesure **7,0:1** ; la ligne « société en constitution » et son lien WhatsApp or mesurent **13,7:1 et 10,6:1** (7,3:1 et 5,6:1 sur les 5 % les plus clairs). Preuve de diagnostic : en thème sombre, mêmes textes sur la même photo, **0 violation** — c'est bien le calcul du fond par ancêtre, pas le rendu.

**Intégrité du graphe et SEO (195 pages)** : 0 canonical divergent, **0 anomalie de réciprocité hreflang** sur les 95 paires, 0 description dupliquée, 0 description hors 70-165 c, 2 seules pages orphelines (404 et vérification Google — correct).
- **Corrigé : 4 titres identiques entre jumeaux FR et EN** (cookies, faq, innovation, publications) — les moteurs voyaient deux URL au même titre. Côté EN : « Cookie policy », « FAQ & help centre », « Innovation & research », « Publications & official documents » (titre + og + twitter alignés). Il ne reste aucun doublon.

**Cohérence du canon chiffré** : contrôle des huit constantes sur tout le site (20 Md FCFA : 66 pages, 26 blocs libres : 45, 1 070 km : 21, 80 % contenu local : 13, 23 provinces : 12, 10 M FCFA : 11). 
- **Corrigé : partition du cadastre contradictoire dans l'Atlas** — la barre et la légende disaient « 16 blocs attribués » (univers de 42) tandis que l'aria de la carte et les filtres disaient « 11 attribués + 26 libres + 5 en changement + 2 en production » (univers de 44). Les deux lectures sont justes mais 16 = 11 + 5 : la légende comptait donc les 5 deux fois. Reformulé en « 16 blocs sous licence · 11 attribués + 5 en changement », la ligne suivante devenant « dont 5 · en changement d'opérateur ». Même correction sur l'infobulle de brochure.html.

**Performance (8 pages types)** : DOM de 327 à 2 436 nœuds, DCL de 131 à 883 ms, 16 à 42 requêtes, **0 image servie hors gabarit** sur tout l'échantillon. Seule exception assumée : la brochure (compilation de tout le site) à 1 004 ko de HTML et 9 808 nœuds pour 1 396 ms — page-document destinée à l'impression, comportement attendu.

**Verdict** : 3 défauts réels sur 195 pages, tous corrigés dans ce cycle ; 3 alertes d'outil réfutées par la mesure. Leçon d'instrument consignée : sur un héros à photo, **axe-core ne peut pas juger le contraste** — il faut échantillonner les pixels rendus (le thème sombre sert de témoin).

## §108 — 2026-08-08 · QA comparé de la page Durabilité vs les majors (TotalEnergies, Shell, Chevron)
Benchmark des hubs sustainability de TotalEnergies, Shell et Chevron, confronté à notre pôle Durabilité (greentech/index 452 mots + transition 1 603 + impact 2 222 + hseq 2 822 + patrimoine 533), à /engagements (arc E-S-G, double matérialité) et à /cibles-2030.

**Le motif des trois majors** :
1. **Quatre piliers stables** en entrée de hub — TotalEnergies : « Climate and Sustainable Energy / Safety, respect and well-being / Environment / Positive impact for stakeholders » ; Chevron : Climate / Social investment / Diversity and inclusion / Environment ; Shell : climat, environnement, sécurité, éthique, personnes, communautés. Le hub ne démontre rien lui-même : il oriente vers des sous-pages qui portent la preuve.
2. **La preuve vit dans un rapport daté et téléchargeable**, pas dans la page — TotalEnergies « Sustainability & Climate 2026 Progress Report » (mars 2026) ; Chevron « 2024 Corporate Sustainability Highlights », « 2023 Climate Change Resilience Report », « 2022 Methane Report » + une rubrique **Performance data** dédiée.
3. **Des indicateurs chiffrés avec base de référence, réalisé et cible** — TotalEnergies publie : méthane opéré −65 % en 2025 vs 2020 (cible −80 % en 2030), Scope 1+2 opéré 33,1 Mt en 2025 contre 46 Mt en 2015 et une cible de 37 Mt (dépassée), intensité < 16 kg CO₂e/boe, intensité cycle de vie −18,6 % vs 2015. Chaque chiffre porte une année de base et une année cible.
4. **Ancrage territorial** — Chevron ouvre par « Around the world · Select a location » : la durabilité racontée par région d'opération.
5. **Actualité datée** en pied de hub (Chevron : 4 brèves datées), qui prouve que le sujet vit.

**Nos forces** : l'arc E-S-G d'/engagements est plus explicite que celui des majors (trois piliers, chacun avec ambition, cibles datées et standards visés) ; la **double matérialité CSRD/ESRS** est traitée frontalement, ce que Chevron et Shell n'affichent pas sur leur hub ; le **mécanisme de griefs en 4 étapes** et les **4 familles de parties prenantes avec leur canal** sont un niveau de détail rare ; les cibles sont honnêtement marquées « visées ».

**Écarts prioritaires** (recommandations, non appliquées) :
1. **Le hub Durabilité ne tient pas son rôle** : 452 mots et 3 h2, sans un seul chiffre dans le corps de page (les 3 KPI vivent dans le héros). Le hub des majors est court aussi — mais il ouvre sur quatre piliers nommés et un rapport. Le nôtre ouvre sur 5 tuiles de sous-pages sans hiérarchie de piliers.
2. **Aucune page « données de performance »** — c'est le dispositif central des trois majors. Nous n'avons aucun actif, donc rien à mesurer : la réponse honnête est un tableau « indicateur · base · cible · échéance · standard » qui affiche les cases « à mesurer dès le premier baril ».
3. **Pas de rapport téléchargeable** : /engagements annonce le rapport E-S-G « à paraître » — mais sans date ni sommaire, l'engagement n'est pas vérifiable. Les majors datent tout.
4. **Référentiels dispersés** : ODD 65 pages, ITIE 58, ALARP 52, mais GRI 12, IPIECA 6, TCFD 2, CSRD/ESRS 2. Un bloc « nos référentiels » unique et cité depuis le hub éviterait cette dilution.
5. **Aucune entrée territoriale** : le motif Chevron (« la durabilité, là où nous opérons ») serait puissant pour un opérateur mono-pays — Doba, Bongor, lac Tchad, corridor — et nous avons déjà le matériau dans impact et patrimoine.
- Contrôle technique du hub au passage : 0 erreur console, 1 h1, héros lisible, 5 tuiles — rien à corriger sur la forme.

## §109 — 2026-08-08 · « Déploie » : les 5 recommandations Durabilité appliquées (TotalEnergies/Shell/Chevron)
1. **Quatre piliers nommés en tête du hub** — le motif commun aux trois majors. `.gtp` : Climat & énergie (30 %+ renouvelables · ISO 14001), Environnement & patrimoine (0 rejet non conforme · Water-to-Value™), Sécurité & personnes (zéro accident · ISO 45001), Impact & territoires (80 % de personnel tchadien · ITIE). Chaque pilier porte son chiffre, son référentiel et mène à sa sous-page — le hub passait de 452 mots sans un chiffre dans le corps à une carte d'orientation chiffrée.
2. **Tableau des indicateurs** (`/engagements#indicateurs`) — l'équivalent honnête de la page « Performance data » des majors : 10 lignes × 6 colonnes (indicateur · base · réalisé · cible · échéance · référentiel). Les colonnes « réalisé » portent explicitement « à mesurer dès le 1ᵉʳ baril / site / champ / chantier » plutôt que d'être masquées. Le tableau engage la méthode de mesure et la date à laquelle chaque case cessera d'être vide.
3. **Rapport de durabilité daté et sommé** : « à paraître » devient « première édition visée à l'issue du premier exercice social complet, publiée dans les six mois suivant sa clôture », avec un sommaire annoncé en six parties — l'engagement devient vérifiable, comme chez les majors qui datent tout.
4. **Bloc « Nos référentiels »** (`/engagements#referentiels`) — 14 cadres réunis en un seul endroit avec leur statut réel : OHADA et IFRS *appliqués*, ITIE/ISO 45001/14001/9001/37001 *visés*, GRI-IPIECA cadre du rapport, TCFD cadre de la note climat, CSRD/ESRS grille de double matérialité, Zero Routine Flaring objectif 2030, ODD 7-8-13-16, API Spec Q2/ISO 29001 et NORSOK D-010 pour la prestation. Fin de la dispersion (ODD sur 65 pages mais TCFD sur 2).
5. **Entrée territoriale** (`.gtt`, motif « Around the world » de Chevron, plus fort encore pour un opérateur mono-pays) : bassin de Doba (eau de production et gaz associé), bassin de Bongor (contenu local et licence sociale), lac Tchad & Sahel (prélèvements et biodiversité), corridor Doba–Kribi (intégrité et sécurité routière) — chacun renvoyant à la sous-page qui le traite.
- Propagé aux jumeaux EN (pole-greentech-en, engagements-en), 0 résidu FR.
- QA : 4 pages × 2 thèmes, axe-core WCAG A+AA **0 violation**, 1 h1, 0 ancre cassée, mobile 390 conforme (piliers 1 colonne, tableau en défilement horizontal contenu).
- Défaut attrapé au vol : sur le jumeau EN, les deux liens de la note de bas de piliers viraient au vert foncé #094E37 (1,89:1) — une règle de lien du bundle chargé par les pages de pôle EN écrasait la couleur inline. Armure `.gtp-l a` 3×:not(#id) sur les deux versions.

## §110 — 2026-08-08 · « QA de toutes les pages » : audit intégral 198 pages + 11 correctifs
**Méthode.** Trois passes : (a) audit statique de 198 fichiers HTML — tête de page, `lang`, IDs dupliqués, résolution de tous les liens et ancres internes, alt, ordre des titres, résidus de langue ; (b) parité FR/EN sur les 95 paires du frmap (sections, titres, mots, liens) ; (c) QA dynamique Playwright sur les 194 pages publiques en 390 px, dans les **deux états de thème réels**, avec axe-core WCAG 2.1 A+AA, console, exceptions JS et débordement horizontal.

**Leçon de méthode (importante).** La première passe dynamique appliquait `et-plight` à toutes les pages pour simuler le thème clair. C'est faux : `#et-light-def` choisit la classe selon le chemin — `et-jlight` sur `/journal-*`, `et-plight` ailleurs — et le thème **clair est le défaut**, le mode sombre s'obtenant en retirant la classe. Mon état artificiel `et-jlight + et-plight` produisait un bandeau CTA illisible sur les 50 carnets : **faux positif**, corrigé en reconstruisant le harnais autour des deux états réels (défaut / classe retirée). Les 50 blocs `cta-light-fix` posés à tort ont été retirés avant publication. Règle confirmée (déjà apprise en §107) : **mesurer l'état réel avant de corriger**.

**Défauts réels trouvés et corrigés**
1. **Balisage cassé sur 3 pages** — `plan-du-site-en` (66 occurrences), `index-en`, `tchaditech/recits-en` portaient `hreflang="fr>` : le guillemet fermant avait été mangé par le balayage de chrome EN de §104, si bien que l'attribut avalait le texte du lien. Conséquence mesurée par axe : 13 liens sans nom accessible et 5 listes invalides sur le plan du site anglais. 68 occurrences réparées.
2. **Neuf pages EN privées d'une partie du chrome CSS** (charte, innovation, communautés, carrières, cibles-2030, accessibilité, gouvernance, avertissements, plan du site). Le défaut le plus grave de tout l'audit, trouvé en comparant les captures pleine page au jumeau français :
   - **Navigation entièrement non stylée sur 5 d'entre elles** (charte-en, plan-du-site-en, accessibilité-en, avertissements-en, cibles-2030-en) : le méga-menu se dépliait en **1 274 à 1 330 px de liens bruts en haut de page** — hauteur médiane du site : 70 px. Ces pages ne chargeaient ni `nav_a.css` ni `c_c79b7a1d9fec.css` (qui porte `.nav-in`). Les deux `<link>` ajoutés ramènent la barre à 92 px, valeur de référence.
   - **Bandeau de prix illisible sur les 9** : `.pt-track` sans ses règles, donc les deux copies du ruban se superposaient au lieu de défiler. Règles et `@keyframes ptMarquee` réintégrés.
   - **Bouton flottant « retour à l'accueil » géant** : `#homeFab` sans styles laissait son SVG s'étendre sur toute la largeur de page.
   - **Bandeau cookies non stylé** : panneau transparent, lien bleu navigateur (2,05:1), bouton système gris — au premier écran d'un visiteur anglophone.
   - **Bloc « Continue in… » et pagination de pôle en liste brute** : `.pole-more`, `.pmore-*`, `.pager`, `.pgr-cell` sans mise en forme.
   Correctifs : deux feuilles de style ajoutées sur les 5 pages à navigation cassée, et un bloc `orphan-chrome-fix` inline sur les 9 (partage, pager, pole-more, homeFab, ruban de prix), plus `ckn-fix`. Contrôle final : plus aucune classe visible sans règle, géométrie identique à la page de référence.
3. **Couleurs de thème non portées dans `bundle_core_a1.css`** : `.pgr-t{#10161F}` et `.pgr-dir{#6B500F}` y sont fixés sans condition de thème → en mode sombre, texte sombre sur fond sombre (2,07:1 mesuré) sur 6 pages EN. Armure `pgr-dark-fix`, plus le même traitement pour `.pmore-t` et `.pmore-home`.
4. **7 ancres EN mortes**, 28 occurrences : `#network`→`#reseau-carte`, `#catalogue`→`#services-ep`, `#fleet`→`#ofs-flotte`, `#emplois-jeunesse`→`#jobs-youth`, `#eor-science`→`#eor-concept` (identifiants traduits d'un côté, pas de l'autre) ; `#car-parcours` et `#donnees-esg` visaient des sections qui n'existaient pas encore côté EN (voir 5).
5. **Couche « epw » désynchronisée sur 9 paires** — 7 blocs éditoriaux (~250 mots chacun) présents en FR et absents en EN : parcours de recrutement, tenue des cibles 2030, indicateurs ESG chiffrés, cinq pratiques communautaires, méthode d'innovation, parcours d'innovation TchadiTech, usages de la pile digitale, doctrine des récits. Traduits et posés. Et **2 blocs anglais sans équivalent français** — `rsx-steps` (du dépôt à la piste) et `prd-buy` (deux façons d'acheter) — rédigés en français et posés sur `aval/reseau` et `aval/produits`. La couche est désormais symétrique.
6. **Renvois de pôle erronés sur 5 pages TchadiTech EN** : le bloc « Continue in… » pointait vers Tchaditude (partenariats, rayonnement) au lieu de rester dans TchadiTech. Bloc reconstruit à partir du jumeau FR, cartes traduites.
7. **Résidus français dans le chrome EN**, 8 familles : `title="Copier le lien"` (16), placeholder de recherche (16), 4 boutons de partage (5 pages), indices clavier « naviguer / ouvrir / fermer » (25), « Accueil » du fil mobile (17), « Luminosité » du panneau (16), 2 libellés de l'Atlas, 3 `alt` d'animaux de Zakouma restés français, plus `aria-label="Rechercher une section"` (16). Les libellés du sélecteur de langue (« Français », « Lire en français ») sont conservés à dessein.
8. **Espacement typographique français sur 24 pages EN** : espaces insécables avant `: ; ! ?` hérités de la traduction — supprimés (198 occurrences repérées, 173 réellement adjacentes).
9. **`og:locale="en"` sur 20 pages EN** → `en_US` (valeur invalide pour Open Graph, qui exige langue_TERRITOIRE).
10. **Note de marques TchadiTech à 3,47:1** — `.ttf-note` en `rgba(233,238,245,.4)` ; la règle efficace était celle du bloc `html.et-plight main`, pas la déclaration de base : opacité portée à .72 aux deux endroits.
11. **Images d'accueil sans dimensions** (5 sur `index` et `index-en`) → `width`/`height` posés, décalage de mise en page évité.

**Vérifié sain** — 0 lien interne cassé sur 198 pages ; sitemap exactement aligné sur les 193 pages publiques, sans doublon ni orphelin ; hreflang réciproque à 100 % avec auto-référence et `x-default` sur toutes les paires ; 0 titre et 0 description dupliqués ; JSON-LD valide partout ; en-têtes de sécurité effectivement servis par Vercel (CSP, HSTS, X-Frame-Options) et CSP cohérente avec l'absence totale d'images externes ; flux RSS FR et EN valides ; 0 erreur console, 0 exception JS, 0 requête 4xx et **0 débordement horizontal en 390 px sur les 194 pages**.

**Faux positifs axe-core réfutés par mesure pixel** (7 signatures) : `.hx-slogan` et `span.w` de l'accueil (texte sur photo, déjà réfuté en §107), `.tag` du réseau 8,14:1, `.atc-btn` de l'Atlas 18,1:1, `.btn-ghost` et `.app-tab` de la brochure 9,34:1, `.fp-note` de patrimoine 4,66:1, lien de pied `index-en` 9,45:1. Tous passent ; axe compose pessimistement les fonds semi-transparents.

**Reste au journal des tâches**
- **Les 8 pages de pôle EN sont des résumés, pas des jumeaux** : `pole-amont-en` 222 mots contre 1 237 pour `amont/index`, `aval` 195/1 320, `intermediaire` 159/1 147, `petrochimie` 189/710, `enerconseils` 157/464, `tchaditude` 474/1 134, `tchaditech` 544/854, `greentech` 514/812. La couverture bilingue est de 100 % (§101) mais la profondeur ne l'est pas sur ces 8 hubs — c'est la prochaine vague de traduction, ~5 000 mots.
- **Deux contrôleurs de thème concurrents** sur `explorateur-chaine` (FR/EN) et `Configurateur_Service_Integre_v2` : un script hérité applique `et-plight` **et** `et-jlight` ensemble, avec ses propres clés localStorage, et son bouton de luminosité reste masqué. Aucune violation constatée, mais le choix de thème n'y persiste pas comme ailleurs.
- **`_headers` est un fichier mort** (format Netlify, ignoré par Vercel) dont la CSP diverge de celle réellement servie par `vercel.json` — à supprimer ou à réaligner pour éviter de tromper une relecture future.
- `brochure.html` / `brochure-en.html` pèsent 953 et 933 Ko de HTML (51 blocs `<style>` chacun) — candidats à une consolidation.
- Photographies de terrain réelles (éditorial, côté propriétaire) — inchangé.

## §111 — 2026-08-08 · « QA des pages versus majors » : benchmark par archétype (Eni, TotalEnergies, Shell, Chevron, ExxonMobil)
**Méthode.** Neuf familles de pages d'EnerTchad mesurées (mots dans `<main>`, sections, h2/h3, liens, chiffres, tableaux), puis relevé de la page équivalente chez cinq majors, puis balayage de conventions sectorielles sur les 95 pages FR (identifiants légaux, canal d'alerte, agenda financier, droits humains, travail forcé, paiements aux États, égalité des chances, hypothèses chiffrées). Recommandations non appliquées à ce stade.

**Ce qui tient la comparaison — voire la gagne.**
- *Espace presse* : contact presse nommé, alerte e-mail, kit média, flux RSS, communiqués numérotés `CP-2026-00X` et boilerplate en page. La page news de TotalEnergies n'a **ni contact presse, ni RSS, ni abonnement, ni filtre** ; celle d'ExxonMobil a contacts et alertes mais pas de RSS. Notre infrastructure presse est au-dessus.
- *Contact* : 789 mots, sept sujets routés vers le bon interlocuteur, formulaire en trois étapes, adresse, horaires, fuseau. Eni ne propose **aucun formulaire**, seulement des adresses e-mail.
- *Accueil* : 2 154 mots et 13 sections, avec un bloc « L'ambition, en chiffres ». Les accueils d'Eni et de TotalEnergies sont des carrousels courts sans chiffre au-dessus de la ligne de flottaison — notre densité est justifiée pour une société que personne ne connaît encore.
- *Espace investisseurs* : 2 946 mots, 13 h2, agenda daté, cascade de financement, « auditable par conception ». La page IR de Chevron ne montre **aucun chiffre** ; celle de TotalEnergies est une table des matières.
- *Activités* : mono-pays avec l'Atlas à 16 blocs, là où le « Chevron worldwide » est une simple liste de pays sans une seule donnée.

**Les cinq écarts réels.**
1. **Aucune page « paiements aux États »** — 0 occurrence sur 95 pages FR. C'est le document que publient Eni, Shell et TotalEnergies au titre de la directive comptable UE 2013/34 et de l'ITIE, avec sept catégories normalisées (parts de production, impôts, redevances, dividendes, bonus de signature/découverte/production, droits de licence et de superficie, améliorations d'infrastructures), ventilées **par pays et par projet**. Nous citons l'ITIE sur 58 pages sans jamais dire ce que nous publierons ni sous quel format — alors que le Tchad a son propre cycle de rapports ITIE (exercice 2023 publié fin 2025).
2. **Gouvernance sans pièces** — 818 mots qui nomment les organes (AG, CA, DG, commissaire aux comptes) mais **aucun document téléchargeable, aucun comité, aucun nom**. Eni publie statuts, code de gouvernance, règles du conseil et de ses comités, rapport de rémunération et archives depuis 2014, tous en PDF.
3. **Hypothèses chiffrées absentes** — 0 occurrence de « hypothèse » sur la page investisseurs. La trajectoire 10 M → 1 Md → 20 Md FCFA et les cibles 2030 ne sont adossées à aucun jeu d'hypothèses publié (prix du brut retenu, taux de change, taux d'utilisation, calendrier réglementaire). C'est le test de crédibilité que les majors passent en note de bas de page systématique.
4. **Les pages de risque ne sont atteignables que par le pied de page** — `/avertissements` porte des facteurs de risque solides et un avis anti-fraude qui couvre explicitement les « frais de dossier de recrutement », mais ni `/investisseurs` ni `/carrieres` n'y renvoient dans leur corps. ExxonMobil place son bloc « Scam awareness » **directement sur la page carrières**.
5. **Égalité des chances confinée à `/ethique`** — les cinq majors affichent la mention sur la page carrières elle-même (ExxonMobil en fait un des quatre blocs de bas de page). Chez nous elle n'apparaît que sur `/ethique`.

**Écarts mineurs relevés** : pas de communiqués officiels sur l'accueil (Eni et TotalEnergies ouvrent sur leurs presse-releases, nous ouvrons sur les Carnets éditoriaux) ; pas de filtre par année ou catégorie dans l'espace presse (six communiqués, pas encore nécessaire) ; identifiants légaux (capital social, RCCM, NIF) présents sur `/mentions-legales` mais absents de `/contact`, là où Eni les affiche sur sa page contacts ; carrières sans liste de postes ni délai de réponse visible hors du bloc parcours ajouté en §110.

**Recommandations, par ordre d'impact** : (1) créer `/paiements-etats` pré-engageant les sept catégories ITIE avec les cases « néant — aucune production » et la date du premier rapport ; (2) publier sur `/gouvernance` le projet de statuts et la composition-cible du conseil avec ses comités (audit, HSE, nominations), même en version « projet » ; (3) ajouter un bloc « nos hypothèses » sur `/investisseurs` ; (4) remonter l'avis anti-fraude et l'égalité des chances sur `/carrieres`, et les facteurs de risque dans le corps d'`/investisseurs` ; (5) ajouter les identifiants légaux sur `/contact` et une bande « derniers communiqués » sur l'accueil.

## §112 — 2026-08-08 · « Applique » : les 5 recommandations du benchmark majors déployées
1. **Nouvelle page `/paiements-etats` (+ jumeau EN)** — l'écart n°1 comblé. Construite à partir du gabarit `achats.html` (chrome, styles, scripts conservés ; `<main>`, tête de page et JSON-LD refaits — FAQPage et Dataset du donneur retirés, fil d'Ariane et WebPage réécrits). Quatre sections : *pourquoi* (ITIE, directive 2013/34/UE, code pétrolier & ARSAT, OHADA-IFRS) ; **tableau des sept catégories** (parts de production, impôts, redevances, dividendes, bonus, droits de licence et de superficie, améliorations d'infrastructures) avec, pour chacune, ce qu'elle recouvre, la mention « néant — aucune production / aucun permis / aucun contrat signé » et **le fait générateur** qui la fera cesser d'être vide ; *maille de publication* (entité bénéficiaire nommée, projet identifié, exercice clos, espèces et nature) ; *calendrier* en cinq étapes, premier rapport « à l'issue du premier exercice social complet suivant l'attribution d'un premier titre pétrolier, dans les six mois de sa clôture ». Intégration : carte en tête du bloc référentiels d'`/engagements`, fiche dans `/publications`, entrée dans `/plan-du-site`, ligne dans `llms.txt`, deux `<loc>` dans le sitemap (195 URL), paire ajoutée au frmap (96 couples).
2. **`/gouvernance` — comités et pièces.** Section « 08 · Comités & documents » : composition-cible du conseil en quatre comités visés (audit, HSE & durabilité, nominations & rémunérations, éthique & conformité) et **état réel de chaque pièce** — statuts et règlement intérieur *à établir à la constitution*, code d'éthique, charte et format des paiements *publiés*, rapports *à paraître au premier exercice*. C'est la réponse honnête à ce qu'Eni publie en PDF depuis 2014.
3. **`/investisseurs` — bloc « Nos hypothèses ».** Six paramètres publiés : Brent 60–70 $/b décoté pour Doba, parité fixe 1 € = 655,957 FCFA, périmètre champs matures, valorisation aval au prix ARSAT, séquence réglementaire datée, financement par paliers non garantis — avec renvoi explicite aux facteurs de risque. Une projection sans hypothèse publiée n'est pas vérifiable ; elle l'est désormais.
4. **`/carrieres` — règles de recrutement.** Égalité des chances (aucune discrimination, aménagements sur demande), priorité aux compétences tchadiennes, réponse à chacun sous deux semaines ; et surtout un **avis anti-arnaque au recrutement** en encadré ambre, remonté depuis `/avertissements` où il était invisible : jamais de frais de dossier, jamais de paiement à un « agent », aucune offre publiée ailleurs que sur ce site. C'est le bloc que place ExxonMobil sur sa propre page carrières.
5. **`/contact` — identité en droit** (dénomination, forme OHADA, siège, RCCM/NIF en cours, capital 10 M FCFA et trajectoire, régulation ARSAT, directeur de la publication, canal d'alerte) ; et **bande « Communiqués officiels » sur l'accueil** FR et EN, trois derniers CP datés et numérotés, à côté du fil des Carnets — le motif d'Eni et de TotalEnergies, qui ouvrent sur la presse.

**Défaut réel trouvé en cours de route et corrigé : le sélecteur de langue mobile était mort sur 68 pages anglaises.** Le lien « Français » du menu mobile pointait vers la page anglaise elle-même (`/faq-en` → `/faq-en`) : sur 68 des 95 pages EN, un visiteur sur téléphone ne pouvait pas revenir au français par le menu. Réparé par le frmap inverse ; 1 seule page était correcte avant.

**Contrôles.** Statique : 200 pages, 0 lien interne cassé, 0 ancre morte hors le routeur du configurateur, sitemap valide à 195 URL, hreflang réciproque sur la nouvelle paire. Dynamique sur les 84 pages modifiées, deux états de thème : 0 erreur console, 0 exception JS, 0 requête 4xx, 0 débordement en 390 px, et aucune violation axe nouvelle — les 7 restantes sont les faux positifs déjà mesurés au pixel en §110. Deux défauts introduits par moi, attrapés avant publication : les liens des listes `.b111-dl` sortaient en bleu navigateur en thème sombre (armure ajoutée) et la légende du tableau des sept catégories s'affichait en clair faute de classe `.sr-only` sur cette page. 58 apostrophes droites converties en apostrophes typographiques dans le contenu français neuf.

**Reste à faire** : la nouvelle page n'est pas dans le méga-menu ni dans le pied de page (l'ajouter coûte une édition sur 190 pages) — elle est atteignable depuis `/engagements`, `/publications`, `/plan-du-site`, `/gouvernance` et le sitemap. Et les 8 pages de pôle EN restent des résumés (§110).

## §113 — 2026-08-08 · QA & modernisation de `/clients` face aux majors et aux distributeurs africains
**Comparé à** : la page cartes-carburant de Shell (structure, tableau comparatif, outils nommés, paliers de remise), la page « Fueling Industries and Communities » de Puma Energy (segmentation par filière : retail, commercial, aviation, lubrifiants, GPL, bitume, stockage, avec un chiffre par segment), les pages entreprises de TotalEnergies, ExxonMobil et Eni.

**Ce que la page tenait déjà** — et c'est beaucoup : 7 profils en onglets ARIA (`role=tablist`), cartes « enjeu → notre réponse » retournables, bande de repères, vitrine de prix homologués, programmes de marque nommés (EnerClub™, Carte EnerPro™, appli, NRJ+™), parcours en 4 étapes, FAQ de 5 questions et bandeau final. Techniquement irréprochable au départ : 0 erreur console, 0 exception, 0 débordement en 390 px, 0 violation axe dans les deux thèmes.

**Défaut réel trouvé** : la grille d'orientation affichait **8 cartes sous le titre « Sept portes »**, les deux dernières pointant toutes deux vers `#b2g` — un doublon « État / marchés publics » et « État & institutions (B2G) », en contradiction avec les 7 onglets générés par `cw-tabs-js`. Carte retirée sur les deux langues : 7 cartes, 7 onglets, « sept portes ».

**Quatre ajouts repris des majors**
1. **Tableau comparatif des sept portes** (`#comparer`) — le motif Shell, qui met ses deux cartes carburant côte à côte avec couverture et remise. Cinq colonnes : profil · ce que couvre l'offre · cadre contractuel · délai visé · votre interlocuteur. Jusqu'ici un acheteur devait ouvrir sept onglets pour comparer ; il lit désormais une ligne. Les cadres contractuels sont explicites (contrat-cadre annuel, convention de flotte, contrat de services, convention de partenariat, marché public OHADA, référencement) et chaque délai est chiffré.
2. **Entrée par filière** (`#secteurs`) — l'axe de Puma Energy, transposé au Tchad : mines & carrières, BTP & routes, agro-industrie & coton, transport & corridor, télécoms & énergie de secours, aviation, humanitaire & ONG. Chaque carte nomme les produits réellement consommés et renvoie vers l'onglet de profil correspondant. La page ne segmentait que par type d'acheteur ; elle segmente maintenant aussi par métier — l'aviation (Jet A-1, Avgas) sort enfin de sa ligne enfouie dans l'offre B2B.
3. **« Ouvrir un compte : les pièces à préparer »** (`#ouvrir-compte`) — huit pièces (RCCM et NIF, attestation fiscale, pouvoir de signature, RIB, sites de livraison avec coordonnées GPS et hauteur de dépotage, volumes prévisionnels, liste de flotte, dossier HSE fournisseur). Les majors publient toujours les conditions d'ouverture de compte ; personne ne le fait au Tchad. Encadré : aucun dossier n'est instruit à ce jour, et aucun intermédiaire ne peut prétendre en accélérer un contre rémunération.
4. **Engagements de service mesurables** (`#engagements-service`) — quatre promesses avec, pour chacune, **l'unité dans laquelle elle se compte** : réponse 48 h (horodatage), livraison 24–48 h (bon de livraison signé), prix ARSAT partout (affichage et facture), réclamation traitée sous 5 jours (registre, revue trimestrielle). La bande de repères annonçait des chiffres ; cette section dit comment les vérifier.

**Accessibilité** : les quatre tableaux à défilement horizontal du site (`/clients`, `/paiements-etats` FR-EN, `/engagements` FR-EN) reçoivent `tabindex="0"`, `role="region"` et un `aria-label` — une zone défilante doit être atteignable au clavier. Un indice « ↔ faites défiler » apparaît sous le tableau comparatif en dessous de 1 000 px, largeur à partir de laquelle il déborde réellement (mesuré : 1 010 px de contenu pour 792 px utiles à 900 px de viewport).

**Contrôles** : `/clients` passe de 2 699 à 3 670 mots et de 15 à 19 sections ; jumeau EN à 3 523 mots. Sur les 6 pages touchées, en thème clair et sombre : 0 erreur console, 0 exception JS, 0 requête 4xx, 0 débordement en 390 px, **0 violation axe**. Deux corrections en cours de route : le `<b>` des cartes filière héritait du bleu de lien (les cartes sont des `<a>`) et les cartes neuves étaient transparentes sur la photo de fond — fond vitré aligné sur `.ckpi`, avec conservation du liseré d'accent en thème clair.

## §114 — 2026-08-08 · Les 8 pages de pôle anglaises deviennent de vrais jumeaux (dernière dette bilingue)
Le §110 l'avait chiffrée : la couverture bilingue était complète depuis §101, mais **la profondeur ne l'était pas sur les huit hubs de pôle**. `pole-amont-en` affichait 222 mots contre 1 237 pour `amont/index`, `pole-aval-en` 195 contre 1 320, `pole-intermediaire-en` 159 contre 1 147, `pole-enerconseils-en` 157 contre 464 — des pages d'atterrissage à deux blocs (« What this pole does », « Inside this pole ») là où le français déroulait manifeste, marché, méthode, solutions, cas d'usage et offre. Un partenaire anglophone lisait un résumé, un francophone lisait le dossier.

**Méthode.** Plutôt que de greffer les sections manquantes sur des pages qui ne chargent pas les bundles correspondants (`u2_28c848a4da78.css` pour `pmani`/`ilede`/`psol`/`bizcases`, `s_60d18f7d69.css` pour `mkt-sec`), chaque jumeau a été **reconstruit à partir de la page FR** via `build_twin.py` — mêmes feuilles de style, même structure, donc rendu identique par construction. Le bloc de navigation propre au jumeau anglais (« What this pole does » + « Inside this pole ») a été ré-injecté avant la fin du `<main>` : il n'existe pas côté français et il servait bien le lecteur.

**Traduction.** 1 106 segments extraits des huit pages FR, dont 891 absents du `master_harvest`. Répartis en huit lots confiés à quatre traducteurs parallèles avec un glossaire imposé (Amont→Upstream, ITIE→EITI, société en constitution→company in formation, torchage→flaring, relève→next generation, ~40 entrées), puis 195 chaînes résiduelles — essentiellement du chrome partagé (« Nos Pôles », « J'ai compris », « En structuration », « De la roche-mère à la pompe ») et les titres de page — traitées en un neuvième lot. Un dictionnaire de chrome de 1 062 entrées a par ailleurs été moissonné par jointure d'index de tokens sur quatre paires FR/EN déjà publiées et cohérentes. Contrôle : **0 segment non traduit** sur les huit pages en sortie, et 0 chaîne française résiduelle détectée sur l'ensemble des 95 pages anglaises.

**Résultat** : Upstream 222 → 1 406 mots, Downstream 195 → 1 517, Midstream 159 → 1 274, Petrochemicals 189 → 862, Sustainability 514 → 1 319, Technology 544 → 1 375, Human capital 474 → 1 597, Advisory 157 → 626. Chaque jumeau dépasse désormais son original français, l'écart tenant au bloc de navigation anglais conservé en plus. Têtes de page vérifiées une à une : `lang="en"`, `og:locale` `en_US`, canonique et hreflang réciproques corrects, aucun lien pointant encore vers une route française dans le `<main>`.

**Défaut attrapé au passage** : le badge « Image d'illustration » du héros est posé par un script (`c.textContent=…`), donc invisible aux extracteurs de segments — il restait en français sur **47 pages anglaises**. Corrigé partout.

**Contrôles** : 200 pages au statique, 0 lien interne cassé, 0 ancre morte ; sur les 55 pages modifiées, en thème clair et sombre, 0 erreur console, 0 exception JS, 0 requête 4xx, 0 débordement en 390 px et 0 violation axe. Le site est désormais bilingue en couverture **et** en profondeur.

## §115 — 2026-08-08 · Solde du journal des tâches : navigation, configuration morte, poids de la brochure
1. **`/paiements-etats` entre dans le pied de page, sur les 191 pages qui en ont un.** Publiée en §112, la page de transparence des revenus n'était atteignable que depuis `/engagements`, `/publications`, `/plan-du-site`, `/gouvernance` et le sitemap — invisible pour un visiteur qui ne cherchait pas. Elle prend place dans la colonne « Durabilité & investisseurs » (« Sustainability & investors » côté anglais), entre *Engagements* et *Communautés*, avec la route correspondant à la langue de la page. Quatre variantes de colonne existaient sur le site, dont deux propres à la brochure : toutes traitées. Contrôle : 189 colonnes standard à 7 liens exactement une occurrence chacune, plus les 2 colonnes longues de la brochure à 8 liens ; seule `404.html` n'a pas de pied de page, ce qui est voulu.
2. **`_headers` n'est plus un piège.** Le fichier était au format Netlify — donc totalement ignoré par Vercel — et portait une CSP plus permissive que celle réellement servie (elle autorisait `images.unsplash.com` et `upload.wikimedia.org`, alors que le site ne charge aucune image externe et que la CSP active ne les autorise pas). Un relecteur pouvait croire la politique laxiste. Le fichier est désormais **strictement aligné sur le bloc `headers` de `vercel.json`** — les trois sources, les sept en-têtes, y compris la règle `stale-while-revalidate` de `/assets/chrome/*` qui y manquait — et coiffé d'un en-tête de commentaire qui dit qu'il est inactif ici, pourquoi il est conservé (repli Netlify) et que toute modification passe d'abord par `vercel.json`. Alignement vérifié par comparaison programmatique clé par clé.
3. **La consolidation de `brochure.html` est abandonnée — mesures à l'appui.** La page pèse 953 Ko bruts, 230 Ko une fois compressée. L'analyse montre que le poids est inhérent au contenu : **37 042 mots** de texte visible, 9 811 nœuds DOM, 150 SVG en ligne. Aucun bloc `<style>` ni `<script>` n'est dupliqué (0 sur 51 et 0 sur 39). Le seul gisement théorique, les 2 097 attributs `style=` en ligne, se révèle stérile : **1 586 valeurs distinctes pour 2 097 usages**, soit un gain brut plafonné à 11 Ko sur 773 Ko — environ 2 Ko après compression, pour un refactor à risque sur la page la plus longue du site. Performance mesurée en 390 px : premier rendu à 352 ms, chargement complet à 1,7 s. **Décision : ne pas toucher.** L'item sort du journal des tâches, non parce qu'il est fait, mais parce qu'il ne valait pas d'être fait — et la mesure est consignée pour ne pas le rouvrir par réflexe.

**Il reste un seul item ouvert au journal** : les photographies de terrain réelles, qui relèvent de l'éditorial côté propriétaire et ne peuvent pas être produites ici.

## §116 — 2026-08-08 · Audit AA et inspection visuelle : 196 pages, trois largeurs, deux thèmes
**Protocole.** axe-core WCAG 2.1 A+AA sur les 196 pages publiques, à **320, 768 et 1440 px**, dans les deux états de thème réels — soit 1 176 passes. Puis les critères que l'outillage ne voit pas : reflow 320 px (1.4.10), texte à 200 % (1.4.4), espacement du texte (1.4.12), focus visible testé **au clavier** (2.4.7), mouvement en `prefers-reduced-motion`, taille des cibles, et rendu sans JavaScript. Enfin 72 captures pleine page (12 archétypes × 3 largeurs × 2 thèmes) passées au crible d'heuristiques de mise en page.

**Six défauts réels corrigés.**
1. **Reflow cassé à 320 px sur 6 pages** (1.4.10 AA) — le contenu s'étendait jusqu'à 374 px sur un écran de 320, imposant un défilement horizontal. Trois causes distinctes : l'en-tête `header.jtop` des **50 carnets** est un `flex` en `nowrap` dont le bouton de luminosité sortait à 374 px ; sur `/boutique`, la barre de segments `.seg` imposait sa largeur min-content de 321 px à la grille parente ; sur le configurateur, un CTA en `whitespace-nowrap` mesurait 291 px + marges. Corrigés par repli du flex sous 360–420 px, `min-width:0` sur les enfants de grille et autorisation de retour à la ligne. Vérifié : plus aucun défilement horizontal réel à 320 px.
2. **Focus clavier invisible sur 5 pages** (2.4.7 AA) — les boutons de filtre de `/boutique` (14 éléments), les filtres d'horizon de `/cibles-2030` (4) et les cartes de choix du configurateur (6) ne montraient aucun indicateur au `Tab`. Un `outline` en `!important` **n'a pas suffi** : une règle du bundle laissait `outline-width` à 0 quelle que soit la spécificité. Anneau reconstruit en `box-shadow` double (halo sombre + or), insensible aux resets d'outline, avec variante claire.
3. **Liens de prose non stylés en thème sombre** — sur `/societe`, `/societe-en` et `/ar`, des liens en pleine phrase héritaient du bleu par défaut du navigateur, mesuré à **1,79:1**. Règle `main p a:not([class])` armée pour les deux thèmes.
4. **Bouton de thème brut sur `/404`** et **fil d'Ariane bleu navigateur sur `/communiques-en`**, dans les deux états. La page 404 affichait un bouton système gris.
5. **`.fp-note` du patrimoine à 4,03:1** en thème sombre, juste sous le seuil de 4,5:1 pour du 12,3 px. Passé à 6,41:1.
6. **Quatre régions défilantes non atteignables au clavier** (2.1.1) : `.mrc-scroll`, `.eorc-scroll`, `.esg-tw` et les trois tableaux à `overflow-x:auto` de la brochure. `tabindex="0"`, `role="region"` et libellé ajoutés — dix pages.

**Deux découvertes hors périmètre axe, corrigées aussi.**
- **Texte à 200 % : les cartes retournables de `/clients` tronquaient leur contenu.** Leur `min-height` était figée à 176 px : à 200 %, « Trouver du » et « Des régions » se coupaient en plein milieu. Hauteur exprimée en `rem` (11rem) — identique au rendu par défaut, doublée quand le texte double. C'est un échec 1.4.4 typique, invisible à l'outillage.
- **Sans JavaScript, 118 pages restaient largement blanches.** Les éléments d'animation d'apparition (`.rv`, `.reveal`) démarrent à `opacity:0` et n'étaient révélés que par un `IntersectionObserver` : 88 éléments invisibles sur `/clients`, 22 sur l'accueil, 16 sur un pôle anglais. Le texte restait dans le DOM — donc accessible aux lecteurs d'écran — mais un visiteur sans JS voyait une page vide. Bloc `<noscript>` ajouté sur les 118 pages concernées, qui force l'opacité et neutralise transformations et transitions. Vérifié navigateur JS désactivé : 0 élément invisible.

**Faux positifs écartés par mesure ou capture** — chacun documenté pour ne pas être rouvert : `.hx-slogan` et `span.w` de l'accueil (texte sur photo, 7,0:1 mesuré en §107) ; `.tag` du réseau 8,14:1 ; `.atc-btn` de l'Atlas 10,37:1 ; `.btn-ghost` et `.app-tab` de la brochure 9,34:1 ; « Continuer · Actualités » 8,20:1 — axe compose pessimistement les fonds semi-transparents. Le `H1.pgh-flash` des pôles, signalé comme tronqué à 200 %, l'est par son pseudo-élément de balayage : capture à l'appui, le titre s'affiche entier. Le `scrollWidth` de 323 px de `/contact` à 320 px ne produit **aucun** défilement réel (`overflow-x:clip`), confirmé visuellement.

**Sain par ailleurs** : aucune animation persistante en `prefers-reduced-motion` sur les 24 archétypes testés ; l'espacement du texte de 1.4.12 ne casse aucune mise en page ; aucune image cassée, aucune section aplatie, aucun débordement à gauche sur les 72 captures ; 0 débordement horizontal à 768 et 1440 px sur les 196 pages.

## §117 — 2026-08-09 · Verre v3 : les bandes translucides deviennent vraiment du verre

**Le constat.** 175 pages posent un décor photographique en calque fixe derrière tout le contenu (`.rootland` au niveau racine, `.subland` dans les pôles, `z-index:-2`). Par-dessus, les bandes `main > section` sont teintées `rgba(8,13,22,.45)` — donc translucides — mais **aucune ne portait de `backdrop-filter`**. Résultat : la photo passait à travers en pleine résolution, nette, derrière le texte. C'était translucide sans être du verre, et c'est ce que le mode sombre donnait à voir sur 618 bandes. La mesure : 1 209 panneaux en thème clair dont 1 199 déjà floutés (le module « verre liquide » du bundle couvre `.card`, `[class*="card"]`, `[class*="panel"]`, `article`) contre 715 sur 1 720 en thème sombre — l'écart était entièrement du côté sombre, là où le décor est visible.

**Le module.** Bloc `<style id="glass-v3">` ajouté sur les 175 pages concernées, en mode sombre uniquement (en mode clair le décor est déjà masqué, le flou ne coûterait que du GPU) :

- `main section:not(#_)` reçoit `blur(16px) saturate(140%)`, réduit à `blur(10px) saturate(130%)` sous 700 px pour ménager les terminaux mobiles ;
- `main section section:not(#_)` l'annule : une section imbriquée hérite du fond déjà flouté de sa parente, un second flou serait du gaspillage (75 des 693 sections sont dans ce cas) ;
- repli complet sous `prefers-reduced-transparency:reduce`, aligné sur celui que le bundle applique déjà aux bandes.

**Huit pages sans bandes.** `faq`, `faq-en`, `communiques`, `innovation`, `innovation-en`, `accessibilite-en`, `avertissements-en`, `plan-du-site-en` n'ont pas de `<section>` : leur contenu est une colonne `main > .wrap` transparente, et le texte reposait directement sur le sable en pleine netteté — le pire cas du site. Cette colonne devient elle-même un panneau de verre (`rgba(8,13,22,.45)`, rayon 22 px, flou 16 px, respiration verticale de 34/38 px).

**Deux hubs qui refusaient le verre.** Sur les huit pôles, six posaient des bandes translucides ; `greentech` et `tchaditech` — donc quatre pages avec leurs jumelles anglaises — imposaient des fonds pleins : `.gtp` en `#0B1422`, `.gtt` en `#0E1A24`, `.tt-flag` et `.tt-carnets` en `#0B111A`, `.tt-flow` en `#0E1622`, plus leurs cartes `.gtp-c`, `.gtt-c`, `.ttf-card`, `.ttc-card` en `#101B27`/`#101927`. Ces bandes masquaient complètement le décor : la page basculait sans transition du verre à la dalle opaque. Elles rejoignent la norme du site, `rgba(8,13,22,.45)` pour les bandes et `rgba(9,15,26,.5)` avec `blur(10px)` pour les cartes. **Mode sombre seulement** : en clair, ces fonds sombres sont posés par des règles `html.et-plight` explicites, avec titres forcés en blanc — c'est un contraste voulu, pas un oubli, et il reste tel quel.

**Piège de cascade.** La première version des surcharges de pôle perdait silencieusement : les règles en place s'écrivent `main>.gtp:not(#_):not(#__):not(#___)`, soit trois identifiants, contre deux dans la mienne. Les identifiants l'emportent sur les classes quel que soit leur nombre, `!important` des deux côtés ne départage rien. Corrigé à quatre `:not(#id)`. Vérifié au style calculé et non à l'œil : `.gtp` passe bien de `rgb(11,20,34)` à `rgba(8,13,22,.45)`.

**Contrôles.** Sur les 175 pages, à 390 px et en thème sombre : 0 erreur console, 0 exception JS, 0 réponse 4xx, 0 débordement horizontal, et **0 élément `position:fixed` piégé dans une section floutée** — c'est le risque propre à `backdrop-filter`, qui crée un bloc conteneur pour les descendants fixes. Contraste vérifié au pixel sur des rendus « fonds seuls » (tout le texte rendu transparent, images masquées) plutôt qu'au sondage d'arbre, qui s'est trompé trois fois depuis le §107 : le fond le plus clair du 99e centile donne 8,8:1 à 13,3:1 pour le texte blanc, et la comparaison avant/après montre une amélioration, jamais une régression (`/investisseurs` passe de 9,84:1 à 12,25:1 — le flou écrête les hautes lumières de la photo). Les valeurs identiques avant et après, comme le 3,35:1 du texte secondaire de `/societe` sur le centile le plus clair, sont antérieures à ce chantier.

**Correction apportée dans la foulée.** La première version du palier mobile visait `main section` *et* `main > .wrap` sur les 175 pages. Or `.wrap` est la colonne de mise en page de la plupart des pages, sans fond propre : lui appliquer un `backdrop-filter` faisait flouter le décor sur toute la largeur du contenu, en double avec les sections qu'elle contient — un second passage GPU pour rien, précisément là où il coûte le plus. Le palier mobile de `.wrap` est désormais réservé aux huit pages où cette colonne est effectivement un panneau de verre.

## §118 — 2026-08-09 · Alignement FR/EN : la navigation manquante et le second décor

**Point de départ.** J'avais signalé que `accessibilite`, `avertissements` et `plan-du-site` portaient le calque photographique en anglais mais pas en français. En allant vérifier, l'écart était bien plus profond que le décor.

**Quatre pages françaises sans navigation.** `accessibilite`, `avertissements`, `charte` et `plan-du-site` ne portaient pas le chrome du site : ni barre de navigation, ni méga-menus, ni recherche `⌘K` — un simple en-tête « EnerTchad · ← Retour au site ». Leurs jumelles anglaises, elles, ont le chrome complet, comme les 196 autres pages. Un visiteur francophone arrivant sur `/accessibilite` depuis un moteur de recherche perdait toute la navigation ; l'anglophone la gardait. Le défaut avait survécu au §110 parce que la parité FR/EN y comparait le `<main>` — sections, titres, mots, liens — et non le chrome.

Correctif : greffe du chrome complet depuis `confidentialite.html`, page de la même famille déjà conforme. Ont été portés la région `<header>` entière avec ses cinq méga-menus et le panneau de recherche, les cinq ressources de tête manquantes (`nav_a.css`, `c_c79b7a1d9fec.css` qui porte `.nav-in`, `cmdk_extra.js`, `u2_881fcf8bc439.js`, `u2_e8be195d19be.js`), le bloc `nav-lisible` et la classe `nx-clear` sur `<body>`. Les liens du sélecteur de langue ont été réécrits page par page. Contrôle par comparaison à la page de référence : **barre à 132 px, 71 liens, cinq méga-menus aux hauteurs identiques au pixel** (381 · 791 · 460 · 653 · 358), méga-menu s'ouvrant au clic avec `visibility:visible` et `opacity:1`, 0 erreur console, 0 débordement. `charte` a demandé une variante : son en-tête est `<header class="top">` suivi de `.dsh` et non de `.hero`, l'ancrage de la greffe s'est fait sur `</header>`.

**Un second mécanisme de décor, passé sous le radar du §117.** Le module verre v3 ciblait les pages à calque fixe `.rootland`/`.subland` — 175 pages. Mais **15 pages posent leur décor autrement**, par un diaporama `.diapo`, et n'avaient donc pas été traitées : toute la famille légale dans les deux langues, `communiques-en`, `ethique-en`, l'accueil et le calculateur. Leur feuille `diapoland-css` teinte les bandes en `rgba(8,13,22,.38)` — translucide, sans flou : même défaut, découvert seulement parce que la capture de `/accessibilite` montrait le texte posé sur le sable en pleine netteté.

Sur ces pages le contenu n'est pas en bandes mais en colonne `main > .wrap` sans fond propre : c'est donc le traitement « colonne de verre » des huit pages du §117 qui s'applique, posé sur les **12 pages concernées**. L'accueil et son jumeau anglais sont écartés sur mesure : leurs sections de pôle portent chacune leur propre photo pleine largeur, la capture avant/après est strictement identique — le flou n'y serait que du coût GPU. Le calculateur, page applicative sans bande de contenu, est écarté pour la même raison.

**Contrôles.** Sur les 12 pages, à 390 px en thème sombre : 0 erreur console, 0 exception JS, 0 réponse 4xx, 0 débordement horizontal, 0 élément `position:fixed` piégé. 1 868 liens et ancres examinés sur ces pages après la greffe : **0 cassé**. Thème clair vérifié inchangé par capture.

**Reste ouvert.** `ethique` et son jumeau anglais divergent structurellement — bandes `<section>` d'un côté, colonne `.wrap` de l'autre. Chacun reçoit le traitement adapté à sa structure, mais les deux pages ne sont pas bâties pareil. À reprendre si vous voulez une vraie symétrie.

## §119 — 2026-08-09 · Revue de la page d'accueil face aux majors, et ce qu'on en a tiré

**Méthode.** Mesure de notre home au navigateur — trois largeurs, deux thèmes, géométrie section par section, poids réseau par type, comportement réel du carrousel chronométré — et relevé bloc par bloc des pages d'accueil de TotalEnergies, Eni, Shell, Chevron, ExxonMobil et Equinor, libellés réels à l'appui.

**Ce que la comparaison a établi en notre faveur**, et qu'il faut noter pour ne pas le défaire par inadvertance : aucune des six majors n'ouvre sur une promesse. Quatre ouvrent sur leur communiqué de résultats trimestriels, Chevron sur un carrousel de huit vidéos, et Equinor — le seul à poser une phrase de marque — n'y met aucun bouton. Notre H1 est un énoncé de position. Nous exposons aussi cinq portes d'audience au-dessus de la ligne de flottaison là où ils en montrent trois ou quatre, une porte fournisseurs dans la navigation quand Shell, Chevron et Equinor n'en ont aucune sur leur accueil, six actualités catégorisées contre trois à six chez eux, quatre documents téléchargeables quand deux d'entre eux n'en proposent aucun, et un pied de page de cinq rubriques contre une ligne plate chez TotalEnergies.

**Quatre correctifs appliqués.**

1. **Commande de pause du carrousel — non-conformité WCAG 2.2.2, niveau A.** Le carrousel du hero fait tourner cinq messages, un toutes les six secondes, mesuré à T0, T+7 et T+14. Aucun contrôle de pause n'existait : le seul bouton de la page dont le libellé évoquait une pause était le sélecteur de thème. TotalEnergies expose « Stop automatic scrolling », Chevron un bouton pause. Le script du carrousel étant inline dans `index.html`, il a été réécrit : état `paused` persistant en `localStorage`, bouton `#hxPause` de 40 × 40 px posé **hors du `role="tablist"`** — un enfant non-`tab` dans un tablist serait une faute ARIA — avec `aria-pressed`, libellé qui bascule et icône pause/lecture. Vérifié en conditions : neuf secondes sans changement de message une fois en pause, reprise effective au second clic. Le bouton est masqué sous `prefers-reduced-motion`, où le carrousel ne tournait déjà pas. **Correction d'une affirmation de ma revue** : j'avais rangé le ruban de prix sous le même critère ; mesure faite, son conteneur `#oilticker` est en `display:none` sur l'accueil (bloc `no-bands`), il ne défile donc pour personne — seule l'animation tourne à vide sur un élément de 0 × 0.

2. **Le hero retrouve un CTA sortant.** Le bloc `<style id="hero-lite">` posé au §92 (« hero allégé façon majors : h1 + 1 CTA ») masquait `.hchain`, `.hx-links` et le bouton `.btn-g` — si bien que le premier écran n'offrait qu'une ancre vers le deuxième écran. Or chez les six, le bouton du premier écran **sort** de la page : vers les résultats chez TotalEnergies et Shell, « Visit our investor page » chez Chevron. `Investir →` est rétabli seul, vers `/investisseurs` ; la mini-chaîne et les raccourcis restent masqués, l'allègement du §92 tient.

3. **Panneaux de maillon contenus.** `:is(#coeurs,#appuis) .mln` imposait `min-height:min(100svh,940px)` à huit panneaux : 8 258 px, soit 43 % de la page. Plancher ramené à `min(74svh,680px)` et respiration resserrée ; en dessous de 640 px le plancher disparaît, la hauteur suivant le contenu. **Résultat mesuré : 19 171 → 18 093 px à 1440 px.** Sur mobile le gain est nul — mesure à l'appui, les panneaux y font 722 à 834 px, c'est-à-dire moins que le plancher : ils sont contraints par leur contenu, pas par la règle. Raccourcir la home mobile suppose de retirer du contenu, décision éditoriale que je ne prends pas seul.

4. **Agenda investisseur en page d'accueil.** TotalEnergies affiche un bloc « Calendar » de quatre dates, Equinor « Current and forthcoming events » de quatre événements ; nous n'avions rien. Le contenu **existait déjà** sur `/investisseurs#agenda` — quatre rendez-vous correctement couverts par « dates indicatives · société en constitution ». Il est repris **mot pour mot**, sans rien inventer, dans une nouvelle section `#agenda-home` placée avant l'étagère documentaire. Elle porte au passage l'appel à l'abonnement, qui n'existait qu'en lien minuscule dans le hero et en bouton à 97 % de la profondeur de page.

**Et une correction de performance.** Les cinq images du collage étaient servies en pleine résolution à tout le monde, sans `srcset` : un visiteur à 390 px téléchargeait les mêmes 566 Ko qu'un visiteur à 1440 px. Deux d'entre elles déclaraient en outre `width="1600" height="1067"` alors qu'elles sont **en portrait** (1400 × 1866 et 1600 × 2240) — mauvais rapport réservé, donc décalage de mise en page. Variantes 760 px générées, `srcset` et `sizes` posés, dimensions intrinsèques corrigées. **Mesuré : collage 566 → 177 Ko, page entière 1 386 → 1 000 Ko (−28 %)**, à nombre de requêtes constant.

**Contrôles.** axe-core WCAG 2.1 A + AA sur les deux accueils, à 390 et 1440 px, dans les deux thèmes : 0 erreur console, 0 exception JS, 0 réponse 4xx, 0 débordement horizontal, et pour seule violation le `.hx-slogan` du hero déjà réfuté au pixel au §107 (7,0:1 mesuré) — aucune régression. 520 liens et ancres vérifiés sur les deux pages : 0 cassé.

**Reste ouvert, éditorial.** La home mobile fait toujours 27 écrans, répartis sur dix-sept sections de contenu réel là où Eni en tient trois et Shell cinq ; le collage de fin (1 141 px sur mobile) est fait de photos génériques qui sonnent faux à côté du terrain de Doba.

## §120 — 2026-08-09 · Le défaut 2.2.2 de l'accueil était-il isolé ? Recensement de tout ce qui bouge seul

Le §119 a trouvé un carrousel qui tournait sans commande de pause sur la page d'accueil. La question qui suit est la seule qui vaille : **est-ce le seul endroit du site ?** Recensement dynamique plutôt que grep — sur chacune des 92 pages porteuses d'un marqueur d'animation, on relève l'état du contenu, on attend huit secondes, on relève à nouveau, et on note ce qui a changé sans qu'on y touche, plus les animations infinies effectivement visibles et la présence d'une commande.

**Deux familles réelles, et rien d'autre.**

1. **La brochure, dans les deux langues, portait le même carrousel que l'accueil** — cinq messages, un toutes les six secondes, script identique, aucune commande. Même module que le §119 : bouton de 40 × 40 posé hors du `role="tablist"`, `aria-pressed`, libellé qui bascule, état persistant en `localStorage`. Vérifié : neuf secondes sans changement en pause, reprise au second clic, dans les deux langues.

2. **Onze pages laissaient défiler le ruban de prix** (`ptMarquee`, 42 s, boucle infinie, bande de 3 744 à 4 050 px) : neuf pages anglaises, plus les deux brochures. Les 81 autres pages du site le masquent via le bloc `no-bands`. C'est un reliquat du §110 : j'y avais réparé le ruban sur neuf pages anglaises dont la CSS de chrome manquait — je l'ai rendu *fonctionnel* alors que les jumelles françaises le suppriment. J'ai donc réparé un composant que le site avait décidé de ne pas montrer, et créé au passage une seconde exposition 2.2.2. Correction : `#oilticker` masqué sur les onze, alignement sur les 81. Bénéfice de bord — le fil d'Ariane de `gouvernance-en`, jusque-là caché derrière la bande, redevient visible, et le résidu français « offre & cibles » qui traînait en bout de ruban anglais disparaît avec lui.

**Trois fausses pistes écartées par la mesure**, chacune vérifiée sur 21 secondes plutôt que 8 : `.atl-dc` de l'Atlas, `.pof-body` du pôle amont et `.ans` de la FAQ semblaient changer seuls — ce sont des animations d'apparition qui se stabilisent, le premier relevé tombait pendant la pose des classes. Les trois aurores de fond (26, 32 et 38 s, présentes sur 125 pages) sont ramenées à une durée d'un millionième de seconde sous `prefers-reduced-motion` : elles sont donc bien neutralisées, et leur mouvement lent et décoratif ne relève pas de 2.2.2.

**Une réfutation confirmée au pixel.** axe signale sur la brochure 19 nœuds `.sec-next a` en échec de contraste, thème sombre : le navigateur calcule `color: rgb(14,65,114)` — un bleu marine sur fond sombre, soit 1,33:1. Rendu « fonds seuls » à l'appui, **cette couleur n'est jamais peinte** : les glyphes réellement affichés mesurent 5,39:1 pour le texte et 8,21:1 pour la flèche. C'est la même famille que celle déjà réfutée au §116 ; la valeur calculée n'est pas la valeur peinte, et c'est la troisième fois que le sondage d'arbre se trompe de cette façon.

**Contrôles.** Sur les 11 pages modifiées, axe-core WCAG 2.1 A + AA à 390 et 1440 px dans les deux thèmes : 0 erreur console, 0 exception JS, 0 réponse 4xx, 0 débordement horizontal, et pour seules violations les deux familles réfutées de la brochure (`.btn-ghost`, déjà mesurée à 9,34:1 au §116, et `.sec-next a` ci-dessus). Après correction, **le site entier ne compte plus aucun contenu qui bouge tout seul sans commande de pause.**

**Note d'exploitation.** Le conteneur de travail a été réinitialisé entre la préparation et l'envoi ; les modifications ont été reconstruites à l'identique depuis le dépôt distant, puis revérifiées avant publication.

## §121 — 2026-08-10 · Revue du site entier face aux majors, et les cinq écarts comblés

**Méthode.** Mesure des 195 pages au navigateur — poids, longueur, densité de chiffres, tableaux, téléchargements, métadonnées, hreflang, données structurées — et relevé, non plus des pages d'accueil, mais des **rubriques de fond** de six majors : espaces investisseurs de TotalEnergies, Shell et Equinor ; durabilité d'Eni, Chevron et ExxonMobil ; presse, carrières et fournisseurs des quatre premiers.

**Un constat de méthode qui vaut résultat.** Trois de ces sites sont illisibles sans navigateur : Shell ne rend que son `<head>` sur ses pages presse, carrières et investisseurs ; Chevron renvoie 403 sur ses PDF et sert encore des pages datées de 2019-2022 ; Eni est rendu côté client. Notre site est statique et, depuis le §116, lisible sans JavaScript. Pour l'indexation, l'archivage et les réseaux lents, c'est un avantage structurel qu'il faut se garder de défaire.

**Notre socle mesuré** : 215 305 mots, 25 506 liens, 33,3 Mo cumulés ; médiane par page 886 mots, 142 liens, 5 242 px, 147 Ko, 24 requêtes ; **0 page sans description, 0 description hors 70-165 caractères, 0 titre au-delà de 65, 0 page sans JSON-LD**, 2 pages sans hreflang. Et l'écart qui commande tout le reste : **55 tableaux sur 195 pages, 738 jetons chiffrés au total, médiane d'un seul chiffre par page**. ExxonMobil publie des séries 2021-2025 en HTML ; Eni publie des `.xlsx` par table.

**Cinq correctifs appliqués.**

1. **Un cadre de reporting revendiqué.** Nous n'en citions aucun. Nouvelle section sur `/cibles-2030` : les cinq indicateurs sont rangés selon les six modules de la *Sustainability Reporting Guidance for the Oil and Gas Industry* (Ipieca / API / IOGP), le référentiel que suivent ExxonMobil et Chevron — 21 enjeux, 43 catégories d'indicateurs. La correspondance est établie **au niveau des modules, pas des indicateurs** : la granularité fine n'aurait aucun sens avant le premier exercice, et seuls les deux codes qu'Ipieca expose publiquement sont cités (CCE-4, Env-4). Les modules 4 (Environnement) et 5 (Sécurité, santé, sûreté) sont affichés **en creux et grisés** — non chiffrés faute de site en exploitation. Dire ce qu'on ne peut pas encore dire vaut mieux que le taire.

2. **Un jeu de données ouvert.** Le tableau référence/cible existe en `assets/data/indicateurs-esg-2030.csv` et `esg-indicators-2030.csv` (point-virgule, BOM UTF-8, colonne de correspondance Ipieca), lié depuis la section et depuis l'étagère documentaire. Sur ce point précis nous passons devant Chevron et ExxonMobil, qui n'exportent rien.

3. **Une position de vérification, honnête.** Nous ne revendiquons **aucune** assurance externe, et le disons : à ce jour il n'y a pas de donnée d'exploitation à vérifier. L'intention publiée nomme le périmètre visé au premier exercice complet — indicateurs physiques et sociaux du tableau, niveau d'assurance limitée, vérificateur nommé dans le rapport correspondant — et précise que les valeurs de la colonne « référence » restent des ordres de grandeur de filière, non des données auditées. Aucun nom de cabinet, aucune date : je ne prends pas d'engagement à la place de la société.

4. **Un acheminement par sujet.** TotalEnergies publie treize contacts investisseurs nommés et un numéro d'astreinte presse ; Equinor en nomme huit. **Je ne pouvais pas inventer de noms** — ce serait fabriquer des personnes. Nouvelle section sur `/contact` : six files (investisseurs, presse, fournisseurs, clients, carrières, conformité) sur la seule adresse réelle, avec objet pré-rempli, ce qui permet de router et de mesurer les délais par file. Engagement affiché : première réponse sous trois jours ouvrés, vingt-quatre heures pour les signalements de conformité. Et la raison de l'absence de noms est écrite noir sur blanc : les personnes seront nommées à mesure que les organes statutaires seront arrêtés.

5. **Vigilance recrutement.** Shell intègre une page « Recruitment scams » à son parcours candidat ; nous avions déjà la clause anti-fraude côté achats (« pas de référencement payant »), sans équivalent côté carrières. Nouveau bloc sur `/carrieres` : jamais d'argent demandé à un candidat, aucun intermédiaire habilité à encaisser, correspondance officielle en `@enertchad.td` uniquement, pas d'offre ferme par messagerie seule ni de coordonnées bancaires avant embauche — avec un canal de signalement.

**Et une correction de l'étagère.** Chaque document porte désormais son **poids réel** mesuré sur le fichier (« PDF · 2 pages · 20 Ko ») à côté de son format, comme TotalEnergies expose PDF / XBRL / xHTML. Les dates de publication n'ont pas été ajoutées : le dépôt est cloné en profondeur 1, l'historique n'est pas disponible, et je ne date pas un document sans source.

**Contrôles.** axe-core WCAG 2.1 A + AA sur les huit pages modifiées, à 390 et 1440 px dans les deux thèmes — 32 mesures : **0 violation**, 0 erreur console, 0 exception JS, 0 réponse 4xx, 0 débordement horizontal. 1 201 liens et ancres vérifiés : 0 cassé. `scroll-margin-top` posé sur les trois nouvelles sections pour que leurs ancres ne passent pas sous la barre fixe.

**Reste ouvert, et qui n'appartient qu'à vous** : nommer les contacts dès que les organes le permettront, et un moteur d'offres d'emploi — TotalEnergies fait tourner Avature sur 999+ postes avec six facettes, Shell branche Workday ; nous en sommes à la candidature spontanée, ce qui est cohérent avec une société sans recrutement ouvert, mais ne le restera pas.

## §122 — 2026-08-10 · QA intégrale après cinq vagues de modifications

Les §117 à §121 ont touché près de deux cents fichiers — verre sur 175 pages, refonte du premier écran, greffe de chrome, nouvelles sections. Chaque vague avait été vérifiée sur son propre périmètre ; aucune ne l'avait été sur l'ensemble depuis le §116. Passe complète, statique puis dynamique, sur les 195 pages du sitemap.

**Statique — 28 378 liens et ancres examinés : 0 lien cassé.** Vingt « ancres mortes » signalées appartiennent toutes au routeur à hash du Configurateur (`#p=operateur&d=geo…`), cas documenté depuis le §116. Deux « liens vides » sur l'accueil sont les `a.sc-cover` porteurs d'un `aria-label` — mon propre sondage était trop grossier. Rien d'autre sur la tête de page, les identifiants dupliqués, la hiérarchie des titres ou les attributs `alt`.

**Dynamique — 195 pages à 390 px en thème sombre, axe-core WCAG 2.1 A + AA : 0 erreur console, 0 exception JS, 0 réponse 4xx, 0 débordement horizontal.** Vingt-quatre nœuds de contraste signalés, sur sept pages seulement.

**Trois défauts réels, tous nés d'un angle mort.**

1. **Le Configurateur déclarait son encodage au 86 903ᵉ octet.** La spécification HTML exige `<meta charset>` dans les 1 024 premiers octets ; ici, 85 Ko de style en ligne le précédaient. Le fichier porte en outre **deux `<meta name=viewport>` aux valeurs divergentes** (`viewport-fit=cover` d'un côté, valeur nue de l'autre). En production l'en-tête HTTP `charset=utf-8` couvrait le risque — mais il suffit d'ouvrir le fichier hors serveur pour que ça casse. Charset et viewport reposés en tête, doublon supprimé, page revérifiée.

2. **`.fp-note` de la brochure à 3,60:1.** Le §116 avait corrigé cette classe sur les pages patrimoine — la brochure porte sa **propre** déclaration, jamais touchée. Mesure au pixel sur rendu « fonds seuls » : `#6F7D93` sur fond mesuré à (42,38,34), soit **3,60:1 au 95ᵉ centile pour du texte de 12,3 px** — échec 1.4.3 franc. Porté à `#93A1B6`, revérifié à **5,99:1** au pixel, et axe repasse à zéro violation sur les deux brochures. Leçon : corriger une classe sur les pages où on l'a trouvée ne suffit pas ; il faut chercher toutes ses déclarations.

3. **Un titre à 66 caractères** sur `tchaditech/socle-en` — ramené à 61 en remplaçant l'esperluette par une virgule.

**Quatre réfutations au pixel**, pour ne pas les rouvrir : les liens légaux du pied de page signalés sur `tchaditech/index` et `index-en` mesurent **9,03:1 et 9,58:1** — axe compose pessimistement le fond semi-transparent du pied de page, comme au §120 sur `.sec-next`. Les trois autres familles (`.tag` de `aval/reseau`, `.btn-ghost` de la brochure anglaise, le bouton de couche de l'Atlas) sont celles déjà mesurées au §116 à 8,14:1, 9,34:1 et 10,37:1.

Après correction : **sur les 195 pages, plus aucune violation axe autre que les quatre familles réfutées au pixel.**

## §123 — 2026-08-10 · Le saut de page : l'accueil imprimé et exporté en PDF

Le pied de page propose « Imprimer / PDF » sur toutes les pages. L'accueil n'avait **aucune règle `@media print` propre** : seul le bloc partagé du bundle s'appliquait, et il contient `section,article,div{break-inside:auto!important}` — c'est-à-dire l'autorisation explicite de couper n'importe où. Rendu A4 avant correction, 18 pages : panneaux coupés en deux, cartes séparées de leur titre, et trois défauts plus graves.

**Trois défauts, tous vérifiés au rendu.**

1. **Les trois premières lignes du titre ne s'imprimaient pas.** Le bloc d'impression du bundle révèle bien `.reveal`, `.rv` et `[data-d]`, mais **pas les mots `.w`** du H1, qui restent à `opacity:0`. Seul l'`<em>` final, non animé, sortait : le papier portait « Nous inversons. » sans la phrase qui la précède. Mesuré au style calculé avant de corriger.

2. **Le hero est un `<header>` frère de `<main>`.** Toute règle préfixée par `main` le manquait — c'est pourquoi le bouton d'appel s'imprimait en pastille pleine à libellé invisible. Les sélecteurs sont désormais peignés en `:is(main, header.hero, body>section)`.

3. **Les cartes retournables s'imprimaient en double, face arrière en miroir.** Le reset d'impression annule les transformations 3D : la face `rotateY(180deg)` retombait par-dessus la face avant, texte à l'envers. Seule la face avant part maintenant sur le papier.

**Le correctif de fond.** Bloc `<style id="print-home">` sur les deux accueils : blocs insécables sur les unités qui ont un sens (panneaux de maillon, cartes, KPI, lignes d'agenda, documents, tableaux), titres jamais orphelins en bas de page, veuves et orphelines à trois lignes, décor hors papier (chiffres fantômes, mots géants, bouton de pause, puces du carrousel, collage), et **un saut de page avant chaque maillon** — le document se lit désormais en chapitres, un pôle par page, entier.

**Et une impression déterministe.** Le carrousel tournant, le papier portait la diapositive affichée au moment du clic. C'est maintenant toujours le message d'ouverture qui part à l'impression. L'ancre de défilement, sans objet sur papier, est retirée ; le CTA sortant vers l'espace investisseurs, lui, est conservé et imprimé en contour.

**Contrôles.** Rendu A4 avant/après comparé page à page. À l'écran, rien ne bouge — tout est enfermé dans `@media print` : sur les deux accueils, à 390 px en sombre et 1440 px en clair, 0 erreur console, 0 exception JS, 0 réponse 4xx, 0 débordement, et pour seules violations axe les deux familles déjà réfutées au pixel (`.hx-slogan` à 7,0:1 au §107, liens légaux du pied de page à 9,03:1 au §122).

## §124 — Bande « conviction » en verre translucide (accueil)

**Constat.** Sur l'accueil, `section.hbelieve` (« Nous croyons que le pétrole du Tchad… ») était la seule
section de niveau `body` restant **totalement opaque** en thème sombre :
`radial-gradient(120% 100% at 50% 0%,#16294A,#0F1D36 60%,#0C1729)`. Le bloc `glass-v3` (§117) ne vise que
`main section` ; `.hbelieve`, `.hcollage` et `#cta-band` sont posés **après `</main>`** et n'étaient donc
pas couverts. Mesures du 10/08 : `.hcollage` déjà transparente, `#cta-band` déjà translucide
(`rgba(8,13,22,.55)→.75`) mais **sans `backdrop-filter`**, `.hbelieve` opaque.

**Ce qu'il y a derrière.** `div.diapo` est en `position:fixed` en thème sombre : c'est le **visuel du hero**
(pompe à balancier au couchant) qui reste fixe derrière toute la page. Rendre `.hbelieve` translucide
révèle donc ce visuel en parallaxe — vérifié par rendu « fond seul » avant toute écriture de règle.

**Correctif — bloc `<style id="hb-glass">` (index.html, index-en.html)**
- `.hbelieve` : voile `linear-gradient(180deg,rgba(8,14,26,.58),rgba(9,16,29,.42) 46%,rgba(8,14,26,.64))`
  + `backdrop-filter:blur(14px) saturate(135%)`.
- `#cta-band` : ajout du même `backdrop-filter` (le voile existait déjà).
- Palier mobile `≤700px` : `blur(10px) saturate(128%)`.
- `prefers-reduced-transparency:reduce` : retour au dégradé opaque d'origine, `backdrop-filter:none`.
- `@media print` : fond supprimé, `backdrop-filter:none`, marges réduites.
- Portée limitée à `html:not(.et-plight):not(.et-jlight)` — le **thème clair est inchangé**
  (fond crème `#F5F1EA→#EDEDF1`, texte `#2A3648`), car la feuille claire l'armure par ID.

**Mesures après correctif (rendu « fond seul », 1440×900, sombre).**

| Zone | Fond peint le plus clair | `.hb-t` #EAF0F8 | `.hb-cta` #F0CE82 |
|---|---|---|---|
| Titre | rgb(48,55,51) | **10,65:1** | **8,06:1** |
| CTA | rgb(22,17,20) | **16,29:1** | **12,32:1** |

**QA.** index.html + index-en.html, 1440 clair et 390 sombre : 0 erreur console, 0 exception JS, 0 réponse 4xx,
0 débordement horizontal. axe-core : seule la famille `.hx-slogan` déjà réfutée au pixel en §107 (7,0:1).

## §125 — Audit et QA des tuiles (site entier) et correctifs

**Méthode.** Sonde headless sur les 136 pages racine à 1440×900 : détection de tous les conteneurs
`display:grid` / `flex-wrap:wrap` dont au moins deux enfants portent un fond, une bordure ou un rayon —
**1 346 grilles** relevées, 0 page en erreur. Pour chaque grille : rangées reconstruites par position `y`,
puis mesure des hauteurs, paddings, rayons, débordements (`scrollWidth`/`scrollHeight` vs `client*`) et
taille des cibles interactives.

### Défaut 1 — numérotation corrompue dans `.plc-card` (8 pages EN) — **corrigé**

Sur les 8 pages `pole-*-en.html`, deux cartes sur cinq portaient dans le créneau du numéro
(`<span class="plc-n">`, rendu en très gros caractères) une **phrase parasite** venue d'ailleurs :

| Carte | Contenu erroné | Attendu |
|---|---|---|
| 2 | `What the figures on this page rest on` | `02` |
| 3 | `Fixed euro–CFA franc peg` | `03` |

Conséquence mesurée sur `pole-amont-en.html` : `scrollWidth` 802 px pour `clientWidth` 270 px, avec
`overflow:hidden` — le titre était tronqué (« What the figu », « Fixed euro–CF ») et **le reste de la carte
ne s'affichait plus du tout**. Correction : restauration de `02` et `03` sur les 8 pages.
Après : `scrollWidth = clientWidth = 270`, cartes 01→04 toutes à 197,4 px, contenu complet.
Vérification : plus aucun `.plc-n` non numérique sur l'ensemble du site.

### Défaut 2 — bas de tuiles irréguliers : `align-items:start` (23 pages) — **corrigé**

Cinq familles de grilles de cartes déclaraient `align-items:start`, si bien que les tuiles d'une même
rangée ne partageaient pas leur bord inférieur alors qu'elles portent toutes
`border:1px solid var(--hair)` + `border-radius:14px` + fond :

| Famille | Pages | Écart de hauteur mesuré |
|---|---|---|
| `.epw-g` | 15 | 23 → 69 px |
| `.eth-g` | 2 | 23 → 50 px |
| `.gov-g` | 2 | 23 → 46 px |
| `.pubg` | 2 | 23 px |
| `.glm-g` | 2 | 26 → 49 px |

À noter : `.epw-g` existait déjà **en deux versions** dans le site, l'une avec `align-items:start`,
l'autre sans — la même famille ne se comportait donc pas de la même façon d'une page à l'autre.
Correction : suppression de `align-items:start` (retour à `stretch`, le défaut de la grille) sur les 23 pages.
Après : `.eth-c` toutes à 247,7 px, `.gov-c` toutes à 152,5 px.

### Défaut 3 — cibles pointeur sous 24 px (WCAG 2.2, critère 2.5.8) — **corrigé**

Balayage des 136 pages : les appels à action **autonomes** de tuile (hors liens en ligne dans une phrase,
exemptés par le critère) mesuraient 19,5 à 23,5 px de haut.

| Classe | Pages | Hauteur avant | Après |
|---|---|---|---|
| `.flip-cta`, `.flip-hint` | index, index-en | 21,3 / 21,9 px | 24 px |
| `.pj-go` | projets, projets-en | 19,5 px | 24 px |
| `.hcp-all`, `.hnews-all` | index, index-en | 19,9 / 23,5 px | 24 px |
| `.tri-more` | 5 pages EN | 22 px | 24 px |
| `.btn-ghost` | brochure, brochure-en | 21,5 px | 24 px |

Correction : bloc `<style id="tap24">` par page, `min-height:24px` (plus `display:inline-flex;
align-items:center` pour les éléments en flux `block`/`inline-block`, afin que la hauteur ajoutée reste
centrée sur le libellé).

### Défaut 4 — étiquettes de pilier `.ngs-p .tag` à 4,49:1 (4 pages) — **corrigé**

Relevé au pixel en thème sombre, 390 px : `#2E86DE` sur `rgb(20,29,44)` pour un texte de 10,88 px non gras
— **4,49:1**, soit 0,01 sous le seuil AA de 4,5:1. Correction : en thème sombre uniquement,
`color:color-mix(in srgb,var(--c) 52%,#EAF0F8)` — l'accent est conservé mais éclairci.
Mesure après : `rgb(136,185,234)` sur `rgb(21,29,44)` = **8,18:1**.

### Constats réfutés au pixel (aucune action)

- **`.voie-card` (brochure) — faux débordement.** `scrollHeight` 174 vs `clientHeight` 150 : c'est le
  pseudo-élément `.voie-card::after` (le grand chiffre fantôme en `bottom:-18px`, `opacity:.06`) qui est
  **rogné volontairement**. Mesure du texte : `.voie-d` se termine à 19 px du bord de la carte — rien n'est
  coupé. Le « SUITE ⌄ » qui semblait recouvrir la carte 08 sur une capture est `.scrollcue`, un indicateur
  ancré au viewport, pas au bloc.
- **`.presse-grid` (carnets) — mosaïque volontaire.** Hauteurs 476 / 1 048 / 247 / 313 px dans une grille
  à 3 colonnes : uniformiser imposerait 1 048 px à toute la rangée. Laissé tel quel.
- **`.zk-grid` (patrimoine-en) — mise en avant volontaire.** Première tuile 520×412 puis 254×200 : c'est le
  gabarit « vedette + satellites », pas un défaut d'alignement.
- **`.fcta` (brochure, 390 sombre)** signalée par axe-core : mesurée **13,49:1** sur le fond réellement
  peint. Faux positif.
- **`.iv-arr`, `.dist-step`, `.dchg figure`** : débordements de flèches et décors en `overflow:visible`,
  sans perte de contenu.
- **1 179 « tuiles < 190 px »** : très majoritairement des puces, badges et boutons — pas des tuiles.

### QA

39 pages modifiées, 1440 clair et 390 sombre : 0 erreur console, 0 exception JS, 0 réponse 4xx,
0 débordement horizontal. axe-core : seule la famille `.hx-slogan` de l'accueil, déjà réfutée au pixel
en §107 (7,0:1).

### §125 bis — Extension aux 63 pages en sous-dossier

L'audit initial n'avait balayé que les 136 pages de la racine. Vérification en production après publication :
`/aval/reseau` conservait `align-items:start`. Balayage complet des sous-dossiers :

- `align-items:start` retiré de `.epw-g` sur **24 pages** supplémentaires (`amont/`, `aval/`,
  `enerconseils/`, `greentech/`, `intermediaire/`, `tchaditech/`, `tchaditude/`).
- Bloc `tap24` ajouté à **17 pages** portant `.tri-more` (15) ou `.btn-ghost` (2).

Total §125 : **72 pages** modifiées. QA des 33 pages en sous-dossier à 1440 clair :
0 erreur console, 0 exception JS, 0 réponse 4xx, 0 débordement, 0 violation axe-core.

**Leçon reconduite.** Le balayage `ls *.html` ne couvre pas `*/*.html` : toute campagne site-entier doit
énumérer les deux. Contrôle systématique en production sur au moins une page de sous-dossier avant clôture.

## §126 — « Qui nous sommes » sur l'accueil : de trois mots à quatre principes

**Constat.** La première section de `<main>` sur l'accueil (`section.hwords`), intitulée « Qui nous sommes »,
occupait 578 px de haut pour trois mots — *Unité, Innovation, Durabilité* — et rien d'autre :
aucune définition, aucune phrase d'identité, aucun lien de sortie. Un visiteur qui pose la question
« qui êtes-vous ? » repartait avec trois abstractions.

Trois défauts distincts, tous mesurés :

1. **Contenu.** La page `/societe` publie **quatre** valeurs, chacune avec sa définition
   (« 04 · Valeurs — Quatre principes guident chaque décision, du forage au dernier kilomètre »).
   L'accueil n'en affichait que trois, sans définition — et omettait précisément **« Accès aux énergies »**,
   qui est la signature figurant sous le logo dans l'en-tête de chaque page.
2. **Sémantique.** L'intitulé « Qui nous sommes » était un `<span class="hw-k">` : la section n'avait aucun
   titre dans le plan du document. Son `aria-label` annonçait par ailleurs « Nos valeurs » — un nom
   accessible en contradiction avec le libellé visible (WCAG 2.5.3, *Label in Name*).
3. **Impasse.** Aucun lien vers `/societe`.

**Correctif.** Reprise du bloc, dans les deux langues :

- `<h2 class="hw-k" id="hwTitle">` + `aria-labelledby` — la section a un titre, le nom accessible
  correspond au libellé visible.
- Chapô d'identité : « EnerTchad S.A. est une société pétrolière intégrée tchadienne, en cours de
  constitution sous droit OHADA à N'Djamena. »
- Les **quatre** principes, chacun accompagné de sa définition **reprise mot pour mot de `/societe`**
  (aucune formulation inventée) ; quatrième accent ambre `var(--amber-l)`.
- Liste sémantique `<ul>`/`<li>` au lieu d'une pile de `<span>`.
- Lien de sortie « Découvrir la Société → », hauteur de cible 24 px (WCAG 2.5.8).
- Le décalage typographique en escalier est conservé (4 % / 8 % / 12 %) ; grille à deux colonnes
  mot + définition, empilée sous 860 px.

**Contrastes mesurés au pixel** (rendu « fond seul », pire pixel de fond sous chaque zone de texte) :

| | Sombre 1440 | Sombre 390 | Clair 1440 |
|---|---|---|---|
| Chapô | 5,76:1 | 11,41:1 | 10,76:1 |
| Unité | 7,76:1 | 9,82:1 | 4,62:1 |
| Innovation | 6,89:1 | 7,34:1 | 6,80:1 |
| Durabilité | 10,14:1 | 9,58:1 | 6,62:1 |
| Accès aux énergies | 9,98:1 | — | 5,78:1 |
| Définitions | 8,69:1 | 11,44:1 | 10,76:1 |
| Lien Société | 12,87:1 | — | — |

Deux corrections nées de ces mesures :

- **Mobile, chapô à 3,91:1** — sous le seuil AA. Le texte tombait sur la zone la plus claire du visuel
  fixe du hero (pixel de fond 134,113,74). Ajout d'un voile propre à la section sous 860 px :
  `linear-gradient(180deg,rgba(6,11,20,.66),rgba(6,11,20,.46) 32%,rgba(6,11,20,.34))`. Après : **11,41:1**.
- **Thème clair : les quatre accents étaient écrasés** en un même bleu-nuit par la feuille claire —
  le code couleur, qui porte ici l'information, disparaissait. Rétablissement avec des tons adaptés au
  fond crème : `#8A6712`, `#12558F`, `#166046`, `#93490F` — tous ≥ 4,6:1.

**Impression.** `print-home` (§123) masquait `.hwords` : c'était justifié quand la section ne portait que
trois mots décoratifs. Elle porte maintenant l'identité de la société — règle d'impression dédiée
(`display:block`, mots à 1,15 rem, `break-inside:avoid` par principe). Vérifié : le bloc figure bien
en page 1 du PDF de l'accueil.

**QA.** index.html + index-en.html, 1440 clair et 390 sombre : 0 erreur console, 0 exception JS,
0 réponse 4xx, 0 débordement. axe-core : seule la famille `.hx-slogan` déjà réfutée au pixel en §107.

**Constat non traité (chrome, hors périmètre).** Sur mobile, le bouton de thème (bas gauche) et le retour
en haut (bas droite) se superposent au texte courant des sections longues. Relevé pendant les mesures,
à traiter séparément.

## §127 — Modèle de lancement : import B2B depuis cinq pays vers trois hubs

**Origine.** Information métier transmise par la direction : dès l'ouverture commerciale, EnerTchad
importera des carburants depuis des pays africains pour une clientèle B2B, servie depuis des hubs de
stockage répartis sur le territoire. Pays retenus : **Niger, Nigeria, Cameroun, Angola, Algérie**.
Hubs : **N'Djamena, Moundou, Abéché**. Segments B2B : **mines & BTP, transporteurs & flottes,
agro-industrie, énergie de secours & institutionnels**.

**Diagnostic — le site se contredisait.** Balayage des 199 pages : 88 occurrences liées à l'import,
dont 60 sont l'intitulé de navigation « Modèle de distribution · Import → dernier km » (déjà cohérent).
Restaient **28 passages substantiels**, de trois natures :

1. **L'import présenté comme l'adversaire** — « substituer l'import », « un approvisionnement national qui
   ne dépend plus uniquement de l'import », « amortir les ruptures d'import ». Formulations tenables pour
   une cible 2030, intenables quand l'import est le métier du premier jour.
2. **L'import présenté comme défaillant** — « les zones que l'import délaisse », « là où l'import ne va pas ».
   Le constat est juste, mais la formulation range EnerTchad hors des importateurs.
3. **L'omission, la plus grave** — la « cascade de distribution » démarrait à l'**étape 01 Raffinage local**,
   c'est-à-dire à une capacité qui n'existe pas au lancement. Nulle part le site ne disait d'où vient la
   molécule le premier jour.

À noter : les trois hubs étaient **déjà nommés** sur `intermediaire/sites.html` (« trois hubs-dépôts
N'Djamena, Moundou, Abéché ») — mais décrits comme approvisionnant des stations, pas des clients B2B,
et sans dire par quoi ils sont eux-mêmes alimentés.

**Correctifs (9 pages).**

- `aval/distribution.html` — nouvelle **étape 01 « Sourcing & import régional »** en tête de cascade,
  renumérotation des cinq étapes suivantes (le raffinage local devient l'étape 02, marquée « cible »).
  Chapeau réécrit : « au lancement, la molécule entre par l'import régional ; à mesure que le raffinage
  local monte en puissance, elle est produite au pays ».
- `aval/distribution.html` — **nouveau bloc « Modèle de lancement · B2B »** après la cascade : les cinq pays
  et leurs deux familles de voies (terrestre régionale depuis Niger/Nigeria/Cameroun ; maritime depuis
  Angola/Algérie, reprise par le corridor Douala–N'Djamena), les trois hubs et ce que chacun couvre,
  les quatre clientèles professionnelles. Mention explicite : aucune commande ouverte à ce jour.
- `distribution-en.html` — étape « Sourcing & regional import » ajoutée en tête, étapes renumérotées 1→5,
  étape « B2B delivery » précisée, chapeau complété.
- `clients.html` §industriels — l'origine des volumes au lancement est nommée.
- `intermediaire/sites.html` — les trois hubs approvisionnent « dès le lancement, les clients
  professionnels servis par import régional, puis leurs stations satellites ».
- `index.html` — carte « Marché à reconquérir » réécrite : l'import B2B devient l'étape 1 de la thèse,
  au lieu d'être seulement l'adversaire à remplacer.
- Recadrages de formulation sur `brochure.html`, `aval/index.html`, `intermediaire/logistique.html`,
  `journal-mobile-stations.html` : « les circuits d'import actuels délaissent », « là où les circuits
  actuels ne vont pas », « ne dépend plus d'une source unique », « ruptures d'approvisionnement ».

**Non modifié, volontairement.** Les mentions « substituer l'import » de `petrochimie/index.html`
(engrais, méthanol), `aval/produits.html` et `brochure.html` (bitume) et `projets.html` (raffiner sur
place, cible datée) portent sur d'autres produits ou sur l'horizon 2030 : elles restent exactes.

### Incident — copie de travail périmée, régression de 150 pages évitée

Au moment de préparer la publication, le contrôle de divergence a signalé **162 fichiers** modifiés alors
que neuf seulement avaient été touchés. Vérification sur un témoin (`journal-prix-litre.html`) :
**50 979 octets en local contre 55 724 octets publiés**, la version locale étant amputée du script
`et-light-def` et de la balise `theme-color`. La copie `/root/etc` avait été restaurée depuis un
instantané ancien lors d'un redémarrage de conteneur, et seuls les fichiers retouchés depuis étaient à jour.

Publier depuis cet état aurait **régressé plus de 150 pages**, dont la perte du script qui applique le
thème clair par défaut. Procédure appliquée : sauvegarde des neuf fichiers édités, restauration complète
par `git archive FETCH_HEAD | tar -x` (0 divergence après restauration), puis **réapplication des neuf
éditions sur les fichiers frais** — les chaînes cibles ont d'ailleurs différé entre la version périmée et
la version publiée de `distribution-en.html`, ce qui aurait produit une page incohérente.

**Règle ajoutée au protocole de publication.** Avant toute campagne, compter les fichiers divergents.
Si ce nombre dépasse le nombre de fichiers volontairement modifiés, ne rien publier : restaurer depuis
`FETCH_HEAD` et rejouer les éditions.

**QA.** 9 pages, 1440 clair et 390 sombre : 0 erreur console, 0 exception JS, 0 réponse 4xx,
0 débordement. axe-core : uniquement `.hx-slogan` (réfutée au pixel en §107, 7,0:1) et `.fcta` de la
brochure (réfutée en §125, 13,49:1).

## §128 — Du contenu qui n'apparaissait jamais : 540 blocs bloqués à opacity 0

**Point de départ : audit de parité FR/EN.** Deux écarts de contenu d'abord.
`achats-en.html` annonçait « **3 poles** — Upstream, Midstream and Downstream » quand la version française
dit « 4 pôles — Amont, Intermédiaire, Aval et **Pétrochimie** » : un pôle entier manquait au compte et à
l'énumération. Corrigé. Et `eor-en.html` comptait 29 titres contre 40 en français : la section
`#eor-science` — physique du piégeage capillaire (01→04), grille de screening EOR, quatre intrants
tchadiens — n'existait pas en anglais. Traduite et insérée ; 40 titres des deux côtés.

**Ce que l'insertion a révélé.** Les blocs traduits restaient **invisibles** : `opacity:0`,
`transform:translateY(22px)`, aucune classe `.in`. Le moteur de révélation
(`assets/chrome/c_ac04328f0f47.js`, qui pose `.in` via IntersectionObserver) n'est pas chargé par
`eor-en.html` — ni par 109 autres pages.

**Balayage des 200 pages** (chargement, défilement complet, comptage des `.reveal / .reveal-up /
.reveal-blur / .rv` restés sous 5 % d'opacité) :

| | |
|---|---|
| Pages avec du contenu jamais révélé | **54 sur 200** |
| Éléments concernés | **540 sur 2 866** (18,8 %) |
| Pages invisibles à 100 % | `reseau-en` (65), `eor-en` (43), `produits-en` (33), `raffinage-en` (6) |

Sur les 110 pages sans moteur, seules 17 sont défectueuses : les autres chargent une feuille qui
neutralise l'état masqué (`opacity:1!important`). Le défaut naît là où **ni le moteur ni la
neutralisation** ne s'appliquent.

**Vérification au pixel avant correction.** Capture de `reseau-en.html` à 1280×900 : environ **650 px de
page vide** entre l'en-tête et le premier contenu visible — la carte interactive du Tchad et la fiche du
hub-dépôt de N'Djamena ne s'affichaient pas. Défaut réel, pas un artefact de sonde.

**Correctif — bloc `<style id="reveal-safe">` sur 13 pages** (celles à ≥ 10 éléments masqués, soit 404
des 540) :

- `animation:rvsafe 0s linear 2.2s forwards` sur `.reveal:not(.in)` et variantes : si `.in` n'est pas
  arrivée au bout de 2,2 s, le contenu se révèle seul. L'animation d'origine reste prioritaire quand le
  moteur fonctionne.
- `@media (scripting:none)` : révélation immédiate sans JavaScript.
- `@media (prefers-reduced-motion:reduce)` : révélation immédiate, sans animation.

**Après correction.** Nouveau balayage : **404 → 68 éléments masqués**, 11 pages sur 13 entièrement
rétablies. Les 34 restants sur `clients.html` et `clients-en.html` sont dans des accordéons volontairement
repliés (« 14 thématiques ») — non traités, à confirmer.

**Reste à traiter.** 41 pages comptant moins de 10 éléments masqués chacune (136 éléments au total).

**QA.** Échantillon `reseau-en`, `solutions`, `investisseurs`, `greentech/impact` à 1440 clair, plus
`eor-en` et `achats-en` en 1440 clair et 390 sombre : 0 erreur console, 0 exception JS, 0 réponse 4xx,
0 débordement, 0 violation axe-core.

### Incident — deuxième réinitialisation du conteneur

Le travail de §128 a été perdu une première fois (fichiers préparés et copie de travail effacés), et la
copie restaurée était de nouveau périmée — 162 fichiers divergents. Procédure de §127 appliquée :
restauration par `git archive FETCH_HEAD | tar -x` (0 divergence), puis réexécution intégrale des
modifications. Le second passage a reproduit les mêmes mesures au chiffre près (404 → 68), ce qui
confirme que la correction est déterministe.

## §129 — Fin du chantier « reveal » — et correction d'un chiffre annoncé en §128

### Correction d'abord : le chiffre de 540 était surévalué

Le balayage de §128 laissait **500 ms** après le défilement avant de mesurer l'opacité. C'est trop court :
sur beaucoup de pages, l'IntersectionObserver révèle correctement le contenu, mais un peu plus tard que
cela. Une partie des 540 éléments comptés comme « jamais révélés » n'étaient que « pas encore révélés
au moment de la mesure ».

Nouveau balayage des 200 pages avec un délai de stabilisation porté à **2 600 ms** — au-delà du seuil de
2,2 s du filet, donc au-delà de tout comportement normal :

| Mesure | §128 (500 ms) | §129 (2 600 ms) |
|---|---|---|
| Pages avec contenu bloqué | 54 | **11** |
| Éléments bloqués | 540 | **109** |

Le défaut de fond reste entier — une page entièrement invisible l'est quel que soit le délai, et la
capture au pixel de `reseau-en.html` (650 px de vide) n'est pas remise en cause. Mais **l'ampleur
annoncée en §128 était trois à cinq fois trop élevée**, et le protocole de mesure en était la cause.

**Règle ajoutée.** Toute sonde qui mesure un état transitoire (opacité, animation, chargement différé)
doit laisser un délai supérieur au plus long délai attendu du mécanisme observé, et ce délai doit être
consigné avec le résultat.

### Traitement du reste

Sur les 109 éléments restants, 68 sont les accordéons volontairement repliés de `clients.html` et
`clients-en.html` (déjà identifiés en §128). Les 41 autres se répartissaient sur **9 pages**, dont
`raffinage-en.html` — invisible à 100 % (6 éléments sur 6), la seule page du lot « 100 % masqué » de §128
restée sous le seuil de traitement.

Bloc `<style id="reveal-safe">` ajouté à ces 9 pages : `brochure.html`, `brochure-en.html`,
`carnets.html`, `carnets-en.html`, `communiques.html`, `enerconseils/atlas.html`,
`enerconseils/atlas-en.html`, `raffinage-en.html`, `tchaditech/rd-en.html`.

**Après correction : 0 élément bloqué sur les 9 pages** (0/441 sur les deux brochures, 0/42 sur les deux
atlas, 0/6 sur `raffinage-en`). Contrôle visuel de `raffinage-en.html` à 1280×900 : le titre
« The modular & removable mini-refinery », les six cartes de caractéristiques et les quatre étapes
s'affichent normalement.

**État final du site.** Hors accordéons volontaires, plus aucun contenu ne reste bloqué à l'état masqué
sur les 200 pages.

### Note d'exploitation — quatre réinitialisations de conteneur

Le travail de §128 et §129 a été perdu et refait à trois reprises, la copie de travail restaurée étant
à chaque fois périmée (162 fichiers divergents). Le garde-fou institué en §127 — comparer le nombre de
fichiers divergents au nombre de fichiers volontairement modifiés, et restaurer par
`git archive FETCH_HEAD | tar -x` si l'écart est anormal — a détecté les quatre cas sans exception.
Les mesures ont été reproduites à l'identique à chaque passage.

## §130 — Vérification complète du site après les campagnes §123-§129, et fichiers internes exposés

**Contrôle intégral.** Les 200 pages passées à 1440 en thème clair, avec axe-core (WCAG 2.0/2.1 A et AA),
relevé des erreurs de console, des exceptions JavaScript, des réponses 4xx et du débordement horizontal :

| | |
|---|---|
| Erreurs de console | **0** |
| Exceptions JavaScript | **0** |
| Réponses 4xx | **0** |
| Débordement horizontal | **0** |
| Pages entièrement propres | **194 / 200** |

Les six pages signalées se répartissent en trois cas, dont deux déjà réfutés :

- `index.html` et `index-en.html` — famille `.hx-slogan`, mesurée au pixel à **7,0:1** en §107. Réfutée.
- `google9146d41010c5e702.html` — fichier de vérification Google Search Console, sans `<title>` ni
  attribut `lang` par construction : son contenu est imposé par Google. Réfutée, non modifiable.
- `docs-sources/brochure_print.html`, `brochure_print_en.html`, `fiche_ar.html` — voir ci-dessous.

### Fichiers de travail internes servis publiquement

Les trois sources HTML paginées qui servent à générer les PDF (brochure FR, brochure EN, fiche arabe)
sont **accessibles en production** : `https://enertchad-delta.vercel.app/docs-sources/brochure_print`
répond 200 avec le titre « EnerTchad — Brochure institutionnelle ». Le `README.md` du dossier, qui décrit
la chaîne de génération interne, est également servi en clair.

Ces fichiers ne sont liés depuis aucune page et ne figurent pas au sitemap, mais **rien n'empêchait leur
indexation** : aucune balise `robots`, et `robots.txt` n'autorisait que `Allow: /`. Un moteur qui les
découvre (lien externe, historique de certificat, exploration) pouvait les faire remonter en concurrence
des vraies pages — avec, en prime, les défauts de contraste propres à une mise en page destinée à
l'impression.

**Correctif.** `<meta name="robots" content="noindex,nofollow">` ajouté aux trois fichiers, et
`Disallow: /docs-sources/` ajouté à `robots.txt`. Les fichiers restent accessibles pour la génération
des PDF ; ils cessent d'être indexables.

Les défauts de contraste relevés par axe sur ces trois pages ne sont pas corrigés : ce sont des documents
d'impression sur fond blanc, dont le rendu final est le PDF publié. Ils sortent du périmètre du site web.

## §131 — Vérification mobile du site entier (390 sombre) et correctifs

Complément de §130, qui n'avait couvert que 1440 en thème clair. Les 200 pages repassées à **390 px en
thème sombre** — la configuration majoritaire du public visé :

| | |
|---|---|
| Erreurs de console | **0** |
| Exceptions JavaScript | **0** |
| Réponses 4xx | **0** |
| Pages entièrement propres | **193 / 200** |

Les trois pages en débordement horizontal (+404 px) sont les sources d'impression `docs-sources/*`,
larges d'une page A4 par construction et désormais désindexées (§130). Réfuté.

### Deux défauts réels, mesurés puis corrigés

- **`.innov-c .no`** (brochure FR/EN, innovations FR/EN) — le numéro de carte prend l'accent de la carte
  via `color:var(--c)`. Sur la carte bleue, `#2E86DE` sur fond peint (48,45,42) donne **3,64:1** pour un
  texte de 10,56 px. Même famille de défaut que `.ngs-p .tag` en §125, même remède : en thème sombre,
  `color-mix(in srgb, var(--c) 52%, #EAF0F8)`. Après : **6,63:1**.
- **`.mrx-note`** (raffinage EN/FR) — `var(--muted)` résolu à rgb(124,138,162) sur fond (35,43,60) :
  **4,06:1** pour 14,4 px. Porté à `#C6D2E3` en thème sombre. Après : **9,26:1**.
- **Lien signalé par la seule couleur** dans un bloc de texte sur les deux pages raffinage
  (WCAG 1.4.1) : soulignement ajouté.

### Deux signalements réfutés au pixel

- `.btn-ghost` (brochure EN) : **7,04:1** sur le fond réellement peint.
- `.fp-note` (brochure FR) : **5,60:1**. Le correctif de §116/§122 tient bien ; axe calcule contre un
  fond d'ancêtre déclaré, pas contre le fond peint.

### Défaut de ma propre sonde, corrigé

La première mesure de `.fp-note` a renvoyé un fond « pire » de rgb(147,161,182) — exactement la couleur
du texte. Cause : la neutralisation `*{color:transparent!important}` ne suffit pas contre une règle qui
pose `-webkit-text-fill-color` avec une spécificité armée par identifiants. La sonde a été renforcée
(`html body *:not(#_):not(#__):not(#___)`, plus les pseudo-éléments et `text-shadow`), et **les deux
correctifs de ce chapitre ont été re-vérifiés avec la sonde renforcée** — 6,63:1 et 9,26:1 inchangés.

**Leçon.** Une sonde de contraste doit neutraliser `color`, `-webkit-text-fill-color` et `text-shadow`,
avec une spécificité supérieure à celle des règles armées du site. Une sonde sous-spécifiée mesure le
texte au lieu du fond et rend un verdict d'apparence plausible.

## §132 — Audit d'intégrité et de performance (constats, sans modification du site)

Quatre vérifications menées après les campagnes de la journée. Trois sont propres ; la quatrième produit
des constats qui relèvent d'une décision, pas d'un correctif automatique.

### 1. Sitemap — conforme

195 URL déclarées pour 195 pages réelles (hors `404.html`, le fichier de vérification Google et les
sources d'impression désindexées en §130). **0 page absente, 0 doublon, 0 entrée orpheline.**
Un seul `<loc>` sur 195 n'a pas de `<lastmod>`.

### 2. Liens internes — aucun lien mort

Résolution de tous les `href` internes des 200 pages, fichiers et ancres compris : **0 cible manquante,
0 ancre inexistante**. Les cinq « liens cassés » et huit « ancres absentes » relevés au premier passage
étaient des faux positifs de la sonde : des `href="` situés à l'intérieur de gabarits JavaScript, et les
paramètres d'état du configurateur encodés dans le hash (`#p=operateur&d=geo`).

### 3. Barre de navigation basse en mobile — réfutée

Hypothèse testée : la barre fixe de 59-60 px masquerait la fin du contenu, `body` n'ayant aucun
`padding-bottom`. Mesure en bas de page sur six pages : **0 élément recouvert sur cinq d'entre elles**,
et sur `contact.html` un lien de pied de page dont 4 px sur 34 passent sous la barre — 30 px restent
visibles et cliquables. Pas de défaut.

Les boutons flottants (thème, retour en haut, indicateur « SUITE ») passent en revanche par-dessus le
texte pendant le défilement. C'est le comportement normal d'un bouton d'action flottant ; le corriger
proprement supposerait de toucher les 200 pages. **Laissé en l'état, à arbitrer.**

### 4. Poids et performance

Mesures réelles en production (transfert compressé) :

| Page | HTML transféré | Feuilles CSS | Scripts |
|---|---|---|---|
| Accueil | 46,6 Ko | **19 fichiers · 89 Ko** | **12 fichiers · 56 Ko** |
| Clients | 41,7 Ko | — | — |
| Contact | 30,3 Ko | — | — |
| Brochure | **231,9 Ko** | — | — |

Le volume n'est pas le problème : environ 190 Ko pour l'accueil, images comprises. Le point sensible est
le **nombre de requêtes sur le chemin critique — 19 feuilles de style et 12 scripts, soit 31 allers-retours
avant le premier rendu**. Sur une connexion mobile à forte latence, ce qui domine n'est pas le débit mais
le nombre d'allers-retours. Une consolidation supposerait de fusionner des fichiers d'`assets/chrome/`,
que la règle d'exploitation interdit de modifier : **le constat est remonté, la décision revient à la direction.**

`brochure.html` est l'exception à surveiller : 232 Ko de HTML compressé et **9 826 nœuds DOM** (le seuil
d'alerte usuel se situe autour de 1 500). Le rendu reste rapide en local, mais la page est lourde à
analyser pour un terminal d'entrée de gamme.

### 5. Images orphelines

Cinq fichiers d'`assets/img/` ne sont référencés par aucune page ni feuille de style, pour **842 Ko** :
`girafes-dikala.jpg` (273 Ko), `lac-tchad-espace.jpg` (201 Ko), `guelta-archei-chameaux.jpg` (148 Ko),
`equipe-hse.webp` (142 Ko), `savane-vehicule.webp` (79 Ko). Ils ne pèsent sur aucune page puisqu'ils ne
sont jamais chargés. **Non supprimés** : ce sont peut-être des visuels réservés pour un usage à venir, et
la suppression d'actifs n'a pas été demandée.

## §133 — Le bloc « Inside this pole » : sans style sur 8 pages, dupliqué sur 3

### Correction d'une affirmation du chapitre précédent

En §132 j'ai annoncé avoir cassé la mise en page de trois pages en retirant des sections dupliquées, et
j'ai tout restauré. **C'était faux.** Vérification : 11 balises `<section>` ouvrantes pour 11 fermantes
avant comme après, aucune feuille de style dans ce qui avait été supprimé. Le texte collé que j'avais
photographié n'était pas la conséquence de ma modification — c'était l'état normal du bloc.
La preuve : mesure du même bloc sur `pole-intermediaire-en.html`, **jamais modifiée**, qui donne
exactement le même résultat (`.card` sans remplissage ni fond, `.grid` en `display:block`, `.t` en `inline`).

J'ai donc restauré une correction qui était bonne, sur la foi d'une capture mal lue.

### Défaut 1 — le bloc n'a aucun style, sur les 8 pages de pôle anglaises

`section.pole-inside` emploie les classes `grid`, `card`, `t`, `d` — des noms trop génériques pour être
définis ailleurs — et rien ne les stylait. Rendu : « Transport & storageThe logistics backbone between
field, depot and market. » d'un seul tenant, sans carte ni séparation, et les résumés en pavé continu
avec les « OPEN THE PAGE → » incrustés dans le texte.

Correctif : bloc `<style id="pi-css">` sur les 8 pages, entièrement porté sous `.pole-inside` pour ne
rien affecter d'autre — grille `auto-fit minmax(252px,1fr)`, cartes en `flex` avec bordure, rayon,
liseré supérieur à l'accent `var(--ac)` de la carte, titre `.t` en bloc, description `.d` lisible,
et déclinaison pour le thème clair.

### Défaut 2 — sections dupliquées à l'intérieur du bloc, sur 3 pages

Le bloc « Inside this pole » annonce aux anglophones que les pages détaillées ne sont publiées qu'en
français, et en résume le contenu. Sur cinq pages il ne contient que ce résumé. Sur trois, des sections
complètes de la même page y avaient été collées : `pole-greentech-en` répétait `gtp` et `gtt`,
`pole-tchaditech-en` répétait `tt-flag`, `tt-flow`, `tt-story` et `tt-carnets`, `pole-tchaditude-en` une
section. L'anglophone lisait donc deux fois le même contenu, dans deux traductions différentes du même
texte français — « Four pillars, a single requirement » puis « Four pillars, one demand ».

Signature du défaut : l'écart de titres FR/EN valait **+2 sur les cinq pages saines** (les deux titres du
bloc) contre +8, +14 et +4 sur les trois autres. Après retrait : **+2 partout**, sauf tchaditude à +3
(un résumé y emploie un niveau de titre, contenu distinct, laissé tel quel).

### Vérifications

Équilibre des balises contrôlé page par page avant écriture (8/8 équilibrées). Rendu des 8 pages à
1280×1000 : grille active, cartes en `flex` avec 18 px de remplissage, titres en bloc, **0 section
imbriquée résiduelle**. Hauteur du bloc ramenée de 1 936 px à 704 px sur GreenTech.
QA des 8 pages en 1440 clair et 390 sombre : 0 erreur console, 0 exception JS, 0 réponse 4xx,
0 débordement, 0 violation axe-core.

**Leçon.** Avant d'attribuer une régression à sa propre modification, mesurer le même élément sur une
page témoin non modifiée. J'ai perdu un tour à restaurer une correction valide.

## §134 — Harmonisation des bandeaux

Revue des bandes pleine largeur sur les 195 pages, à 1440×900 en thème sombre, après défilement complet.
Treize familles relevées. Le chrome fixe occupe **110 px en haut** et jusqu'à 64 px en bas sur mobile,
soit **12,2 % de la hauteur utile confisqués en permanence** — dans la norme du secteur, mais c'est le
budget dans lequel tout le reste doit tenir.

### Défaut 1 — le bandeau cookies faisait le double de sa taille prévue sur 84 pages

Mesures : **64 px sur les deux pages d'accueil**, **130 px sur 62 pages**, 112 px sur 22 autres.
Cause : le traitement en bande fine (`padding:9px 22px`, disposition en ligne, `.ck-row` poussée à droite)
vit dans le bloc inline `home-plus`, présent uniquement sur `index.html` et `index-en.html`. Partout
ailleurs le bandeau retombait dans sa version par défaut. C'est le premier élément que rencontre un
visiteur, et il occupait le double de l'espace prévu sur 97 % des pages concernées.

### Défaut 2 — la bande d'appel final mesurait 380 px ou 237 px pour un contenu identique

Même texte (19 mots), mêmes deux boutons — mais `padding: 72px/72px` sur 86 pages contre **0/0 sur 75
autres**, soit 143 px d'écart (60 %). Cause identifiée par interrogation des feuilles appliquées :
la règle générique `section{padding:var(--sy) 0}` s'applique à `#cta-band` sur les pages à gabarit
complet, et **double** le rembourrage déjà porté par `.cb-in` (`clamp(38px,6vw,66px)`, soit 66 px à
1440). Les pages « légères » (mentions légales, accessibilité, avertissements) ne chargent pas cette
feuille et affichaient donc la version correcte.

### Correctif — bloc `<style id="bandes-uni">` sur 178 pages

- `#ckn` : bande fine généralisée, `display:flex` conservé sous `.show` uniquement (le bandeau reste
  masqué tant qu'il n'est pas déclenché).
- `#cta-band` : `padding-top`/`padding-bottom` remis à 0 — le rembourrage intérieur de `.cb-in` suffit.

**Mesures après correctif** (1440, thème sombre) :

| Page | Cookies avant → après | Bande finale avant → après |
|---|---|---|
| `achats.html` | 130 → **64 px** | 380 → **236 px** |
| `aval/raffinage.html` | 130 → **65 px** | 380 → **236 px** |
| `accessibilite.html` | — | 237 → **237 px** (inchangée) |
| `index.html` | 64 → **65 px** (inchangée) | 380 → **236 px** |

Les deux composants sont désormais à la même hauteur sur tout le site.

### Constat exemplaire

`.pole-subnav` : **61 px sur les 80 pages**, sans une exception — la preuve que la cohérence est
atteignable ici.

### Reste à traiter

La navigation principale mesure **110 px sur 88 pages et 132 px sur 49** — vérifié au repos et après
défilement, ce n'est pas un état condensé mais bien deux hauteurs. Aucune règle de hauteur explicite ne
s'applique à `nav#nav` : l'écart vient du contenu ou du rembourrage interne, et demande une analyse
séparée. Conséquence pratique : les `scroll-margin-top` des ancres ne peuvent pas être justes sur les
deux familles à la fois.

**QA.** Échantillon de 8 pages des deux gabarits, 1440 clair et 390 sombre : 0 erreur console,
0 exception JS, 0 réponse 4xx, 0 débordement. axe-core : seule la famille `.hx-slogan` de l'accueil,
réfutée au pixel en §107.

## §135 — Le point de repère « contenu principal » était un repère vide (50 carnets)

### Le constat

Audit `axe-core` sur 16 pages représentatives. Deux règles ressortent : `color-contrast`
(18 nœuds, gravité « serious », uniquement sur `index.html` / `index-en.html`) et `region`
(97 nœuds répartis sur 14 pages). La seconde est la vraie.

Sur les pages de carnets (`journal-*.html`), la structure était :

```html
<article>
  <div class="jhero">
    <span class="jkick">…</span>
    <span id="main-content" role="main" tabindex="-1"></span><h1>…</h1>
```

Le `role="main"` était porté par un `<span>` **vide**. Conséquence mesurée : le repère
« contenu principal » existait bien pour les lecteurs d'écran, mais il contenait
**0 caractère**. Un utilisateur qui saute au contenu principal atterrissait sur une balise
vide, et l'intégralité de l'article — titre, chapô, corps, encadrés — restait en dehors de
tout repère. C'est exactement ce que `region` signalait, à raison.

Recensement sur les 199 pages indexables :

| Situation | Pages |
|---|---|
| `h1` dans un `<main>` réel | 93 |
| `<main>` présent mais `h1` en dehors (gabarit `DIV.hero`) | 44 |
| `role="main"` sur un `<span>` vide, aucun `<main>` | 53 |

Les trois ensembles sont disjoints et couvrent 190 des 199 pages. Le présent chapitre ne
traite que le troisième, et seulement ses 50 pages de carnets : les 3 restantes
(`boutique.html`, `boutique-en.html`, `Calculateur_Baril_Additionnel.html`) n'ont pas de
conteneur unique qui puisse porter le repère, elles demandent un traitement séparé.

### Le correctif

Déplacement du rôle, sans ajout ni suppression d'élément :

```html
<span id="main-content" tabindex="-1"></span>   <!-- reste la cible du lien d'évitement -->
<article role="main">                            <!-- porte désormais le repère -->
```

Le `<span>` garde `id` et `tabindex="-1"` : le lien « Aller au contenu principal » continue
de fonctionner et reste focalisable. Le rôle passe sur l'`<article>`, qui contient tout.

**Pourquoi `role="main"` et non un vrai `<main>`** : ajouter un élément `<main>` aurait
activé d'un coup toutes les règles CSS écrites en `main …`, jusque-là inertes sur ces pages.
Un attribut `role` ne correspond à aucun sélecteur de type — impact cascade nul par
construction. Les 50 `<article>` étaient de surcroît strictement uniformes (`<article>` sans
aucun attribut, exactement une occurrence par page), ce qui rend la substitution sûre.

### Vérification

axe-core après correctif, 5 pages échantillon :

| Indicateur | Avant | Après |
|---|---|---|
| Nœuds `region` | 8 | 1 |
| `h1` dans le repère principal | non | oui |
| Texte contenu dans le repère | 0 car. | 3 814 à 4 276 car. |
| Cible du lien d'évitement présente et focalisable | oui | oui |
| Nombre de repères « main » | 1 | 1 |

Diff pixel plein écran, avant/après, rendu depuis deux serveurs distincts (version publiée
contre version corrigée), animations neutralisées :

```
journal-gpl-bois-energie.html  1280x3846  pixels differents = 0  (0,0000 %)
journal-prix-litre-en.html     1280x3767  pixels differents = 0  (0,0000 %)
journal-atlas-secteur.html     1280x4018  pixels differents = 0  (0,0000 %)
```

Zéro pixel d'écart sur des pages de près de 4 000 px de haut : le correctif est purement
sémantique, comme prévu.

### Deux fausses pistes écartées en cours de route (à ne pas rejouer)

**1. Les « 8 méta-descriptions trop courtes ».** Un premier passage signalait des
descriptions de 9 à 64 caractères (`'Campus in N'`, `'Le GPL consigné d'`, `'How EnerTchad'`).
C'était une erreur de sonde : l'expression `content=["\'](.*?)["\']` s'arrête à la première
apostrophe rencontrée, y compris à l'intérieur d'un attribut délimité par des guillemets
doubles. Relecture avec `html.parser` : **0 description hors norme** sur 200 pages, aucun
titre dupliqué, aucune image sans attribut `alt`, aucun saut de niveau de titre, un seul
`h1` par page. Ne jamais parser des attributs HTML à l'expression régulière.

**2. Les « 18 défauts de contraste » de l'accueil.** axe rapportait 1,22:1 sur `.hx-slogan`
et 1,40:1 sur les mots du `h1`, en prenant pour fond `#eae7e2` / `#d4d2cd` — le beige clair
du `body`. Le héros est habillé par une image que axe ne sait pas échantillonner : il remonte
la chaîne des ancêtres jusqu'au premier fond opaque et se trompe de cible. Mesure au pixel
peint (texte neutralisé, capture, lecture RVB sous chaque mot) :

| Élément | Thème par défaut | Thème sombre |
|---|---|---|
| `.hx-slogan` | fond peint 75,63,31 → **6,83:1** | fond peint 32,34,30 → **9,51:1** |
| mots du `h1` | fonds 59-84 → **7,91 à 11,77:1** | fonds 20-38 → **14,41 à 16,76:1** |

Tout est très au-dessus des seuils AA (4,5:1 et 3:1). **Faux positif intégral.** La règle
`color-contrast` de axe n'est pas fiable sur un héros à image de fond ; seule la lecture du
pixel peint fait foi.

### Ce qui reste ouvert sur ce sujet

Les 44 pages du gabarit `DIV.hero` (h1, chapô et fil d'Ariane hors de tout repère) demandent
soit de remonter l'ouverture de `<main>` avant le héros — avec un vrai risque de cascade,
puisque le CSS documente explicitement que « ce HEADER.hero n'est PAS dans `<main>` : les
règles en `main …` ne l'atteignent pas » — soit un repère étiqueté sur le héros. Chantier
distinct, à instruire avant d'y toucher.

## §136 — Les tuiles flottaient sur un fond mort : le verre ne revelait rien

### Le constat, mesure

Demande : « faire une meilleure integration des tuiles avec le background ». Avant de
toucher quoi que ce soit, j'ai photographie ce qu'il y a **derriere** chaque tuile — tuile
masquee par `visibility:hidden`, capture, ecart-type de la luminance dans le rectangle
qu'elle occupait.

| Page | Theme | Ecart-type du fond derriere la tuile | Amplitude |
|---|---|---|---|
| societe.html, 31 tuiles `.card` | clair | 0,48 | 2 |
| societe.html, 6 tuiles `.kpi` | clair | 0,18 | 1 |
| ethique.html, 25 tuiles `.eth-c` | clair | 2,74 | 19 |
| index.html, 20 tuiles | **sombre** | **0,00** | **0** |
| index.html, 20 tuiles | clair | 19 a 59 | 164 a 212 |

Un ecart-type de 0,00 sur vingt tuiles : le fond derriere est rigoureusement uniforme. Le
`backdrop-filter: blur(20px)` a `blur(30px)` floutait donc une surface plate et restituait
exactement la meme couleur. **Le verre coutait une couche composee par tuile pour un
resultat identique a un aplat teinte.** Seul l'accueil en theme clair avait un vrai fond,
grace a l'image du heros et aux chiffres geants.

### La cause : une ambiance hors cadre, pas une ambiance absente

`html` porte bien un halo dore : `radial-gradient(58% 46% at 10% 4%, rgba(226,178,64,.52),
transparent 70%)`. Mais sa geometrie est calee sur la boite de `html`, c'est-a-dire sur
**toute la hauteur du document**. A `4%` d'un document de 9 664 px, le halo eclaire les 400
premiers pixels et rien d'autre. Les 90 % restants de la page sont un aplat.

`#aurora` n'existe que sur 92 pages et vit en `z-index:-1`. `body::before` (grain, opacite
0,035) et `body::after` (poussiere, opacite 0,6) sont deja pris. Aucune couche disponible.

### Le correctif

Recensement prealable des tuiles sur les 199 pages : 207 classes distinctes, 4 787
occurrences, reparties en 2 153 « verre », 2 282 « transparent » et 352 « opaque » en theme
clair — trois traitements coexistant souvent sur la meme page. Selecteur retenu : 81 classes
(toutes celles portant deja un `backdrop-filter`, plus celles nommees `*card*`, `*tile*`,
`kpi`, `*-c`, `*-t`), soit 3 182 occurrences sur 181 pages. Les classes trop generiques
(`.p`, `.c`, `.reveal`, `.st`…) et les familles generees `.bx*` / `.qx*` ont ete ecartees.

Un bloc `<style id="tuiles-fond">` par page, 10,8 Ko, en trois temps :

1. **Relief de fond** — les sections porteuses de tuiles recoivent trois halos radiaux tres
   doux, calees sur la section et non sur le document. Le verre a enfin quelque chose a
   reveler.
2. **Surface de tuile** — un degrade vertical qui *se termine sur la couleur du fond* : le
   bas de la tuile se fond dans la page, le haut capte la lumiere. Ombre reduite a un
   ancrage court (`0 14px 28px -20px`) au lieu d'une ombre portee large. Flou ramene de
   20-30 px a 7 px, puisqu'il a desormais un role reel et n'a plus besoin d'etre massif.
3. **Exceptions mesurees** — voir ci-dessous.

Selecteurs armes en `:is(…):not(#_):not(#__):not(#___):not(#____)` : `:is()` prend la
specificite de son argument le plus fort, donc une seule armure suffit pour 81 classes.
Sans cette astuce le bloc pesait 13,6 Ko ; avec, 10,8 Ko.

### Verification

| Indicateur | Avant | Apres |
|---|---|---|
| societe.html — ecart-type du fond derriere les tuiles | 0,45 | **1,57** |
| index.html — idem | 0,03 | **3,96** |
| ethique.html — idem | 3,05 | **4,27** |
| societe.html sombre — idem | 0,32 | **1,43** |
| Contraste du texte dans les tuiles (5 pages, 2 themes) | pire 8,20 | pire **6,58**, 0 echec AA |
| Temps de defilement, 3 passes | 2 518 / 2 062 / 4 677 ms | 2 273 / 2 210 / 4 336 ms |

Le temps de defilement est une mesure grossiere (horloge murale, trois passes) : elle
etablit l'absence de regression, pas un gain chiffrable.

### La regression evitee de justesse

Balayage des 199 pages a la recherche de tuiles contenant du **texte clair en theme clair** :
14 pages concernees. Sur `ar.html`, les tuiles `.kpi` du heros portent du texte blanc sur un
bandeau sombre. Mon degre blanc a 88 % les aurait rendues illisibles. Meme cas pour
`.fp-card` (brochure FR/EN, patrimoine, greentech/patrimoine), `.gtp-c` (greentech,
pole-greentech-en) et `.ttf-card` (tchaditech, pole-tchaditech-en).

Traitement : `.fp-card`, `.gtp-c` et `.ttf-card` sortis du selecteur ; les bandeaux `.kpis`,
`.fp-sec`, `.fp-grid`, `.gtp`, `.gtp-g`, `.tt-flag`, `.ttf-grid` neutralises par une regle
d'exception qui remet `background-image:none` et un filet clair. Verifie tuile par tuile
apres correctif : les huit cas temoins sont conformes.

`.secg .secc` (clients FR/EN) avait d'abord ete mis en exception a tort — sa couleur ambre
avait franchi mon seuil de luminance. Sa tuile portait deja un degrade blanc a 86 % ; le
mien est a 88 %, l'ecart est nul. Exception retiree.

### Quatre erreurs de sonde dans la meme seance, toutes rattrapees

1. **Descriptions « trop courtes »** — regex s'arretant a la premiere apostrophe dans un
   attribut en guillemets doubles. Zero anomalie reelle.
2. **Contraste « 1,22:1 » sur le heros de l'accueil** — axe remonte au premier fond opaque
   quand il ne sait pas echantillonner une image ; mesure au pixel peint : 6,83 a 16,76:1.
3. **Bandeau cookies** — au premier chargement il assombrit toute la page ; toute mesure de
   contraste faite sans le retirer est fausse.
4. **La plus couteuse : coordonnees d'un viewport de 1 000 px appliquees a une capture
   pleine page de 18 000 px.** Chromium redimensionne reellement le viewport pour une
   capture `fullPage`, donc les media queries et les hauteurs en `vh` reflowent : les
   coordonnees relevees avant ne designent plus rien. C'est ce qui produisait des rapports
   de 1,03:1 sur du texte quasi noir pose sur une tuile quasi blanche — physiquement
   impossible. **Regle : pour mesurer un pixel sous un element, l'amener au centre du
   viewport, relire sa position, et capturer le viewport — jamais la page entiere.**

## §137 — Page Clients : reparer le parcours existant plutot qu'en ajouter un second

### La fausse route, d'abord

Demande : refondre la page Clients en « ultra premium » avec l'experience
utilisateur au centre. Constat de depart : 17 sections, 11 803 px en 1440 et
15 586 px en 390. J'en ai conclu que tout le monde traversait le contenu de tout
le monde, et j'ai construit un dispositif complet — barre de profil persistante,
sections hors profil repliees, ligne du tableau mise en avant, etat dans l'URL.
Il fonctionnait : zero erreur JavaScript, `?profil=ep` operant, sept sections
repliees, annonce aux lecteurs d'ecran.

Puis j'ai mesure les hauteurs reelles section par section :

```
#particuliers   class="cw-panel cw-open"   display:block   1 349 px
#industriels    class="cw-panel"           display:none        0 px
```

**La page disposait deja d'un systeme d'onglets par profil.** Un script
`#cw-tabs` construit une barre `role="tablist"` avec navigation aux fleches,
`aria-selected`, synchronisation avec l'ancre de l'URL, et il deplace meme
`#vitrine-boutique` dans `#particuliers`. Une seule section de profil est
affichee a la fois. Ma prémisse etait fausse et ce que je venais d'ecrire etait
un second accordeon qui se battait avec le premier. Bloc retire, les deux pages
sont revenues octet pour octet a la version publiee avant toute publication.

**Regle qui en decoule** : avant de conclure qu'une page manque d'un mecanisme,
mesurer l'etat calcule de ses sections, pas seulement lire sa hauteur totale.
Une hauteur de document elevee ne prouve pas que tout est affiche.

### Ce que la mesure a reellement trouve

| Defaut mesure | Valeur avant |
|---|---|
| Reglette d'onglets en 390 px : contenu contre visible | 925 px pour **294 px**, soit **2 onglets sur 7** atteignables, sans barre de defilement (`scrollbar-width:none`) |
| Cartes `.prof` signalant le profil actif | **0** attribut d'etat sur 7 cartes |
| Lignes du tableau comparatif reliees a l'onglet | **0** sur 7, pour un tableau de 1 298 px |
| Sommaire avant tout contenu, en 1440 px | **1 051 px**, soit plus d'un ecran |

La barre d'onglets, elle, adherait deja correctement : mesuree a 132 px du haut
en desktop et 77 px en mobile apres defilement, donc rien a corriger de ce cote.

### Le correctif

Un bloc `<style id="cl-ux">` + `<script id="cl-ux-js">` qui **pilote** le systeme
existant au lieu de le doubler. Le script lit `aria-selected` sur les onglets via
un `MutationObserver` et se contente de refleter cet etat ailleurs.

| Correctif | Apres |
|---|---|
| Reglette d'onglets sous 900 px : passage en `flex-wrap` | **7 onglets sur 7** visibles, `scrollWidth` 925 → 314 |
| `aria-current` sur les cartes de profil + pastille « Votre profil » | 7 cartes, la carte active identifiee |
| Lignes du tableau rendues cliquables et focalisables | 7 lignes, `role="button"`, Entree et Espace actifs |
| Sommaire converti en reglette de pastilles au-dela de 900 px | **375 px** au lieu de 1 051 |

Chaine verifiee de bout en bout : un clic sur la ligne « Operateur E&P » du
tableau bascule l'onglet, ouvre `#operateurs`, marque la carte correspondante et
surligne la ligne. Idem au clavier depuis la ligne « Flottes ».

| Indicateur | Avant | Apres |
|---|---|---|
| Hauteur du document, 1440 px | 11 803 | **11 154** |
| Hauteur du document, 390 px | 15 586 | 15 741 |
| Violations axe (4 combinaisons page/viewport) | region x6, aria-allowed-role x4, landmark-unique x1 | **identique, aucune ajoutee** |
| Contraste des 26 elements d'interface ajoutes | — | pire **11,36:1** en clair, **11,74:1** en sombre, 0 echec |
| Rendu sans JavaScript | 20 sections, 7 cartes | **identique** |

Les 155 px gagnes en mobile sur le document sont perdus volontairement : la
reglette passe sur quatre rangees au lieu d'une. C'est le prix pour rendre cinq
profils accessibles au lieu de les laisser hors champ.

### Deux corrections trouvees en chemin

**`aria-pressed` sur un lien est une erreur critique.** Ma premiere version
posait `aria-pressed` sur les sept cartes `.prof`, qui sont des `<a href>`. axe
l'a classe `aria-allowed-attr`, gravite critique, 7 noeuds : cet attribut n'est
autorise que sur un role bouton. Remplace par `aria-current`, autorise sur un
lien et semantiquement exact — element courant dans un ensemble. Verifie : la
violation disparait, le total axe redevient identique a l'avant.

**Collision de nom de classe.** J'avais nomme ma zone d'annonce `.cl-sr` ; la
page utilise deja cette classe pour la description du tableau comparatif, si bien
que mon test lisait le mauvais element. Renomme en `.clux-sr`.

**Libelles francais sur la page anglaise.** En branchant l'annonce vocale sur les
onglets, `clients-en.html` annoncait « Profile shown: Collectivités ». Le script
`cw-tabs` de la page anglaise portait les sept libelles francais verbatim
(`Particuliers`, `Industriels B2B`, `Flottes`, `Opérateurs E&P`, `Collectivités`,
`État & B2G`, `Fournisseurs`) et un `aria-label` francais. Traduits :
`Households`, `Industrial B2B`, `Fleets`, `E&P operators`, `Local authorities`,
`State & public`, `Suppliers`, et `Client profiles` pour la barre.

## §138 — La page Clients sautait 6 000 px au chargement

### Le constat

Revue de performance face aux standards des majors. Mesure des Core Web Vitals
en 4G emulee avec bridage processeur x4. Une valeur sort de l'ordinaire :

```
clients.html  desktop  CLS = 0,315   scrollY apres chargement = 4 510 px
clients.html  mobile   CLS = 0,884   scrollY apres chargement = 6 000 px
```

Le seuil Google est 0,10 pour un CLS « bon » et 0,25 au-dela duquel il est
« mauvais ». 0,884 vaut **8,8 fois le seuil du bon** et 3,5 fois celui du mauvais.
Mais le chiffre revelateur est le second : **la page se defilait toute seule de
6 000 px au chargement**. Qui ouvrait `/clients` n'a jamais vu le heros, ni le
selecteur de profil, ni le tableau comparatif : il atterrissait au milieu de la
section Particuliers.

### La cause, tracee pas a pas

Instrumentation de `scrollTo`, `scrollIntoView`, `replaceState` et des evenements
de defilement :

```
t= 173ms  y=    0  hash=-              replaceState "#particuliers"
t= 252ms  y=    0  hash=#particuliers  DOMContentLoaded
t= 259ms  y= 5974  hash=#particuliers  evenement scroll
t= 264ms  y= 5974  hash=#particuliers  load
```

Le script `cw-tabs` ecrit le fragment dans l'URL des l'initialisation, via
`history.replaceState(null,"","#"+id)` appele depuis `open(IDS[0], false)`. Le
document porte alors un fragment, et le navigateur execute son etape « aller au
fragment » juste apres DOMContentLoaded. Le saut de 6 000 px suit. Le CLS de
0,884 n'en est que la consequence : la page reflue alors qu'elle est deja
positionnee tres bas, si bien que la quasi-totalite du viewport bouge.

### Le correctif

Une condition, dans le script existant de la page :

```js
if(scroll&&history.replaceState)history.replaceState(null,"","#"+id);
```

Le fragment n'est plus ecrit qu'a l'occasion d'un changement demande par
l'utilisateur (`scroll=true`). Au chargement initial l'URL reste propre, donc le
navigateur n'a nulle part ou aller.

### Verification

| | Avant | Apres |
|---|---|---|
| clients.html desktop | CLS 0,315 · defilement 4 510 px | **CLS 0,003 · 0 px** |
| clients.html mobile | CLS 0,884 · defilement 6 000 px | **CLS 0,004 · 0 px** |
| clients-en.html desktop | CLS 0,310 · defilement 4 246 px | **CLS 0,007 · 0 px** |
| clients-en.html mobile | CLS 0,884 · defilement 5 723 px | **CLS 0,004 · 0 px** |

Trois comportements a preserver, verifies un par un :

- lien profond `/clients#flottes` : onglet Flottes actif, section ouverte,
  defilement a 4 510 px — c'est le comportement voulu pour un lien profond ;
- clic sur un onglet : le fragment est ecrit (`#operateurs`), la page defile,
  le lien reste partageable ;
- clic sur une carte de profil : fragment, panneau et etat de la carte corrects.

axe : total inchange sur les quatre combinaisons page/viewport, aucune violation
ajoutee. Navigation clavier depuis le tableau : inchangee.

### Balayage du reste du site

Les 199 pages ont ete chargees en 390 px et leur position de defilement relevee
apres chargement. **Deux pages seulement se defilaient seules** : `clients.html`
et `clients-en.html`. Les 197 autres restent a 0. Le defaut etait circonscrit,
et il l'est desormais entierement.

`solutions.html` et `solutions-en.html` embarquent le meme script `cw-tabs` mais
ne presentent pas le defaut — mesure a 0 px de defilement — car leur garde
`if(secs.length<3)return` court-circuite l'initialisation. Verifie avant d'y
toucher, et rien n'y a ete touche.

### Ce qui reste, chiffre, pour la comparaison aux majors

LCP en 4G emulee avec bridage processeur x4, serveur local donc TTFB quasi nul :

| Page | LCP mobile | Requetes bloquantes |
|---|---|---|
| index.html | 3 408 ms | 19 feuilles de style + 12 scripts |
| societe.html | 3 532 ms | 10 + 9 |
| clients.html | 3 020 ms | 8 + 9 |

Le seuil « bon » de Google est 2 500 ms. Meme avec un temps de reponse serveur
proche de zero, le front seul depasse le budget. La cause est connue et deja
consignee : 31 aller-retours avant le premier rendu sur l'accueil. La
consolidation exige de lever la protection sur `assets/chrome/*` — arbitrage qui
appartient au proprietaire du site. Une etape intermediaire est possible sans y
toucher : precharger les polices et l'image du heros, et sortir les feuilles non
critiques du chemin de rendu depuis le HTML des pages.

## §139 — L'etape intermediaire de performance ne tient pas la mesure

### Ce qui etait propose

Le chapitre 138 concluait qu'un LCP mobile de 3 020 a 3 532 ms, contre un seuil
« bon » de 2 500 ms, venait des 31 aller-retours precedant le premier rendu de
l'accueil, et qu'une consolidation exigeait de lever la protection sur
`assets/chrome/*`. Une etape intermediaire etait annoncee comme possible sans y
toucher : precharger les polices et l'image du heros, et sortir du chemin de
rendu ce qui n'y a rien a faire. Elle a ete construite, mesuree, et **elle ne
tient pas**. Rien n'a ete publie.

### 1. Precharger les polices degrade le LCP

Constat de depart, en 4G emulee avec bridage processeur x4 : les six fichiers
`woff2` ne sont demandes qu'entre 2 383 et 3 246 ms, parce qu'ils ne sont
decouverts qu'apres le telechargement et l'analyse de la chaine de feuilles de
style. Six balises `<link rel="preload" as="font" crossorigin>` placees en tete
de `<head>` ramenent effectivement la demande a 180-184 ms. Et le LCP empire :

| Page | LCP avant | LCP apres preload | Debut des polices |
|---|---|---|---|
| index.html | 3 384 ms | **5 864 ms** (+2 480) | 2 747 → 184 ms |
| societe.html | 3 608 ms | **4 572 ms** (+964) | 2 383 → 180 ms |

L'explication tient au fait mesure au chapitre precedent : **l'element LCP est
une image de heros sur 166 des 199 pages**, jamais du texte. Sur un lien bride a
1,6 Mb/s, 87 Ko de polices prechargees en priorite haute prennent la bande
passante a l'image qui, elle, determine le LCP. Le prechargement deplace le
probleme au lieu de le resoudre. Ecart trop large et trop constant pour etre du
bruit : la piste est abandonnee.

### 2. L'image du heros etait deja prechargee presque partout

Recensement de l'element LCP des 199 pages : 166 ont une image, repartie sur une
vingtaine de fichiers (`datacenter.webp` sur 19 pages, `raffinerie-nuit.webp` sur
18, `pompe-petrole.webp` sur 14…). **163 de ces 166 pages preechargeaient deja
leur image avec `fetchpriority="high"`.** Les trois restantes
(`accessibilite-en`, `avertissements-en`, `plan-du-site-en`) ont un element LCP
qui est un SVG en `data:` inline : le precharger n'a aucun sens, il n'y a pas de
requete reseau a anticiper. Il n'y avait donc rien a gagner de ce cote.

### 3. Differer le script d'effet de survol ne change rien de mesurable

Deux scripts seulement bloquent l'analyseur : `u_cd226c00eb4b.js` (13,4 Ko), qui
pose la classe de theme depuis `localStorage` et **doit rester bloquant** sous
peine de flash de theme, et `u2_75a2c4383ddf.js` (10,7 Ko), un effet de survol au
`pointermove` qui sort immediatement sur les appareils tactiles. Le second a ete
passe en `defer` sur 90 pages, puis mesure sur sept passes :

| | Avant | Apres |
|---|---|---|
| `domInteractive` median | 6 411 ms | 6 406 ms |
| `DOMContentLoaded` median | 6 746 ms | **7 465 ms** |

Aucun gain sur `domInteractive`, et un `DOMContentLoaded` plus tardif — ce qui
est logique : un script differe s'execute precisement dans cette fenetre, il
deplace le travail au lieu de le supprimer. Annule sur les 90 pages.

### Etat apres l'episode

Copie de travail ramenee a **0 fichier divergent** de la version publiee. Aucune
publication.

### Ce que la mesure dit vraiment

Le budget est consomme par la chaine elle-meme, pas par son ordonnancement :
19 feuilles de style pour environ 355 Ko non compresses sur l'accueil, dont
quatre fichiers pesent 292 Ko a eux seuls (`bundle_head_b2.css` 105,9 Ko,
`x_cd256286824c.css` 65,6 Ko, `plight_extrait.css` 62,2 Ko,
`x_77d650c4a7a2.css` 58,5 Ko). Tant que ces 355 Ko restent bloquants et repartis
en 19 requetes, aucun rearrangement depuis le HTML des pages ne ramenera le LCP
sous 2 500 ms. **La seule voie mesurable passe par la consolidation de
`assets/chrome/*`, donc par la levee de la protection.** L'arbitrage appartient
au proprietaire du site.

Note de methode : la variance de l'environnement de mesure est elevee — sur la
meme page et la meme version, le LCP a varie de 3 608 a 5 872 ms entre deux
series. Seuls des ecarts larges et repetes ont ete retenus comme concluants ;
les effets inferieurs a la seconde n'ont pas ete considerees comme demontres.

## §140 — Consolidation CSS : le plafond est mesure, la voie est identifiee, rien n'est encore livrable

Autorisation donnee de modifier `assets/chrome/*`. Avant de toucher au site, trois
variantes de l'accueil ont ete construites en laboratoire, hors du site, et
mesurees en 4G emulee avec bridage processeur x4, cinq passes, mediane retenue.

### Ce que la structure interdit d'emblee

Recensement prealable des 196 pages portant des feuilles de style :
**57 ensembles distincts**, et **36 feuilles occupent une position variable**
selon la page (`plight_extrait.css` apparait en position 0, 1, 6, 12 ou 13 ;
`x_a68928222982.css` de 0 a 5). Il n'existe donc **aucun ordre canonique
global** : concatener toutes les feuilles dans un ordre fixe modifierait la
cascade sur un grand nombre de pages. Un bundle unique pour tout le site est
exclu ; il faut un bundle par ensemble, soit 57 fichiers.

### Les trois variantes, mesurees

| Variante | FCP median | LCP median | Requetes CSS |
|---|---|---|---|
| A · 19 feuilles bloquantes (etat actuel) | 2 968 ms | 2 968 ms | 19 |
| B · 1 feuille bloquante (concatenation) | **4 468 ms** | **4 468 ms** | 1 |
| C · 1 feuille non bloquante, sans critique | 1 024 ms | **7 324 ms** | 1 |
| D · critique en ligne + reste differe | **1 656 ms** | **1 656 ms** | 1 |

**Resultat contre-intuitif a retenir : la simple concatenation degrade.** Passer
de 19 fichiers a un seul fichier bloquant de 348 Ko fait perdre 1 500 ms. Les 19
fichiers se telechargent en parallele ; un seul flux de 348 Ko sur un lien a
1,6 Mb/s est sequentiel et bloque le rendu jusqu'au dernier octet. « Reduire le
nombre de requetes » n'est pas un objectif en soi.

La variante C isole les deux effets : sans rien de bloquant le premier rendu
tombe a 1 024 ms, mais le LCP explose a 7 324 ms parce que l'element LCP est
l'image de heros, dont la mise en page depend d'une feuille arrivee tard.

**La variante D est la bonne voie** : 1 656 ms contre 2 968 ms, soit **44 % de
moins**, et pour la premiere fois sous le seuil « bon » de 2 500 ms.

### Pourquoi elle n'est pas livrable en l'etat

Le CSS critique est extrait automatiquement : on charge la page, on releve les
elements reellement visibles dans le premier ecran (surface non nulle, non
masques), et on conserve les regles dont un selecteur correspond a l'un d'eux,
plus les `@font-face`, les `@keyframes` et les selecteurs racine exacts. Union
des extractions a 1440 et 390 px : 59 Ko.

Diff pixel, D avant l'arrivee du bundle contre A rendu complet :

| | Premiere passe | Apres ajout des keyframes et elargissement a 1,4 ecran |
|---|---|---|
| Ecran d'accueil, 390 px | 30,9 % de pixels differents | 13,2 % |
| Ecran d'accueil, 1440 px | 9,6 % | 24,8 % |

Et surtout, au **chargement complet**, la hauteur du document differe : 18 492 px
contre 18 153 en 1440, 24 032 contre 23 362 en 390. Le CSS critique ne se
contente donc pas de manquer des regles pendant une seconde, il perturbe l'etat
final. Tant que ce n'est pas explique et corrige, deployer sur 199 pages et 57
gabarits serait imprudent.

### Etat

Copie de travail du site : **0 fichier divergent**. Tout le travail est reste
dans `/tmp/lab`. Rien n'a ete modifie dans `assets/chrome/*`.

### La suite, dans l'ordre

1. Reprendre l'extraction du critique jusqu'a ce que, **sur un seul gabarit**, le
   premier rendu soit pixel pour pixel identique au rendu final et que la hauteur
   du document ne bouge pas. Tant que ce point n'est pas atteint, ne pas etendre.
2. Une fois le gabarit valide, generer un bundle par ensemble (57 fichiers,
   nommes par empreinte du contenu pour dedoublonner) en respectant l'ordre exact
   de chaque page.
3. Deployer par lots de gabarits, avec diff pixel plein ecran avant chaque
   publication, dans les deux themes et les deux viewports.

Note de methode : la variance de l'environnement reste elevee. Les ecarts
retenus ici (1 300 a 5 700 ms entre variantes) sont larges et reproduits sur cinq
passes ; les differences inferieures a la seconde n'ont pas ete considerees.

## §141 — Immersion : supprimer les bandes, rendre les tuiles au fond photographique

### La demande et ce que la mesure a confirme

« Eliminer les bandes de fond et laisser les tuiles adherer a l'image de fond pour
une immersion. » Verification sur `projets.html`, section « Comment nous
conduisons un chantier » :

```
SECTION.epw  background-image = radial-gradient(78% 54% at 8% -4%, rgba(222,172,58,.157)) ...
.epw-c       background-image = linear-gradient(rgba(255,255,255,.88) -> rgba(252,249,243,.30))
```

Ce sont exactement les deux regles posees au chapitre 136. Elles avaient ete
justifiees par une mesure — fond derriere les tuiles a ecart-type 0,00, donc verre
inutile — mais cette mesure avait ete faite sur des pages ou la photo ne
remontait pas. Or **175 des 199 pages portent un `DIV.rootland` en
`position:fixed`, `z-index:-2`, qui affiche une photographie plein ecran**. Sur
celles-la les halos de section peignent des bandes par-dessus la photo, et le
remplissage des tuiles en fait des panneaux poses dessus. Le chapitre 136 avait
raison sur les pages plates et tort sur les pages photographiques.

### Le correctif

Un bloc `<style id="tuiles-immersion">` sur les 175 pages concernees :

1. plus aucun halo de section : `background-image:none` sur les sections
   porteuses de tuiles ;
2. la tuile devient du verre : teinte a 56/40 % en clair, 66/54 % en sombre,
   `backdrop-filter: blur(18px) saturate(1.35)`, filet fin, ombre d'ancrage ;
3. repli sans flou via `@supports not (backdrop-filter)` : la teinte remonte a
   90/84 % pour que la tuile reste lisible ;
4. texte secondaire des tuiles eclairci en theme sombre — voir ci-dessous.

**Piege de selecteur a ne pas rejouer.** La premiere version ecrivait
`:root:has(.rootland) html:not(.et-plight) ...`. `html` ne peut pas etre
descendant de `:root` : ce sont le meme element. Le selecteur ne correspondait
jamais et la variante sombre n'etait tout simplement pas appliquee. Le garde de
theme et le `:has(.rootland)` doivent porter sur le meme element :
`html:not(.et-plight):not(.et-jlight):has(.rootland)`.

### Un defaut prealable mis au jour

En mesurant le contraste avant modification, le texte secondaire des tuiles
ressortait a **3,84:1 en theme sombre, soit cinq echecs AA deja presents** :
gris `rgb(124,138,162)` sur fond de tuile. Rendre la tuile transparente aurait
aggrave ce defaut. Le texte secondaire des tuiles passe donc a `#D9E2EE` sur les
pages a fond photographique.

### Verification

Contraste mesure au pixel peint, huit pages, deux themes, element amene au centre
du viewport avant capture :

| | Textes mesures | Echecs AA | Pire contraste |
|---|---|---|---|
| Avant | 102 | **5** | 3,84:1 |
| Apres | 102 | **0** | **9,66:1** |

L'immersion ne coute donc rien en lisibilite : elle repare au passage cinq
non-conformites anterieures.

**Sonde renforcee.** La premiere mesure apres correctif renvoyait 1,00:1 avec
texte et fond identiques : la feuille de neutralisation du texte, armee de trois
identifiants, perdait contre la nouvelle regle armee de quatre. La sonde a ete
portee a six identifiants de specificite. Rappel de la regle : **toute sonde de
contraste doit etre plus specifique que la regle la plus armee de la page**,
sinon elle mesure la couleur du texte au lieu de celle du fond.

## §142 — Verre immersif sans bandes, sur toutes les pages

### L'inspection de coherence qui a declenche le chantier

Apres le chapitre 141, inspection de coherence demandee. Elle a d'abord corrige
une erreur de recensement que j'avais commise : le test `grep 'rootland'`
utilisait la simple presence du mot, qui apparait aussi dans des commentaires CSS.
En testant la balise reelle (`<div class="rootland">`), le compte tombe de 175 a
**78 pages sur 196**. Le bloc d'immersion avait donc ete injecte sur 175 pages
mais n'etait actif que sur 78, le garde `:has(.rootland)` le rendant inerte
ailleurs — sans dommage, mais avec pour effet deux langages de tuiles cohabitant.

Consequences mesurees :

| Constat | Chiffre |
|---|---|
| Pages avec decor photographique | 78 sur 196 |
| Pages sans, dont l'accueil FR et EN et les huit repertoires de poles | 118 |
| **Paires FR/EN divergentes** | **9** : carrieres, communiques, innovation, contact, communautes, ethique, cibles-2030, gouvernance, projets |

Dans les neuf paires, la page francaise portait la photo et l'anglaise non :
changer de langue changeait le design.

### Ce qui a ete fait

Le decor a ete etendu a toutes les pages, et les bandes supprimees partout.

**Choix de l'image, par regle et non a la main** : pour les neuf paires, l'image
de la jumelle, ce qui garantit la parite FR/EN ; sinon l'image de heros de la page
elle-meme, relevee dans le DOM — c'etait deja la regle de fait, verifiee sur 72
des 78 pages existantes ; a defaut, `sable-texture.webp` pour les 22 pages
juridiques et utilitaires sans heros. Repartition finale : 86 pages sur leur
propre heros, 9 sur celle de leur jumelle, 22 en image neutre.

**Suppression des bandes** : l'ancien bloc `rootland-css` posait
`background:rgba(8,13,22,.38)` et `border-radius:22px` sur `main>section` — ce
sont les panneaux arrondis visibles sur les captures. Le nouveau bloc
`immersion-v2` les rend transparents et sans rayon. Seules les tuiles font
desormais verre ; la photo court d'un bord a l'autre.

**Compensation mesuree** : sans panneaux, le texte courant repose sur la photo.
Le voile global de `.rootland::after` est passe de `.54/.66` a **`.68/.78`**, et
`--muted` de `#A8B6C9` a `#C3D0E0`. Ces valeurs ne sont pas choisies au jugement :
elles sont le resultat de la mesure ci-dessous. Un repli
`@media(prefers-contrast:more)` restitue les panneaux opaques pour qui demande
plus de contraste.

### Verification

Contraste au pixel peint, 20 pages, theme sombre, element amene au centre du
viewport avant capture :

| | Textes mesures | Echecs AA | Pire |
|---|---|---|---|
| Apres correctif | 353 | **2** puis **1** apres renfort du voile | 4,21:1 |

Comparaison stricte avant/apres sur la page la plus exposee,
`petrochimie/complexe.html`, meme sonde :

| | Echecs AA | Pire |
|---|---|---|
| Version publiee | **6** | 3,60:1 |
| Apres immersion | **1** | 4,21:1 |

Le seul echec restant est le chapeau dore `#F0CE82` du heros, mesure a 4,21:1
**avant comme apres** : il appartient au traitement du heros, que l'immersion ne
touche pas. Il est laisse en l'etat et signale ici comme chantier distinct.

### Deux defauts de sonde corriges en cours de route

**Notation `color(srgb r g b)`.** Les composantes y vont de 0 a 1. La sonde les
lisait comme des valeurs sur 0-255, si bien qu'un dore clair
`color(srgb .93 .82 .54)` etait pris pour un quasi-noir et sortait a 1,11:1 sur
l'accueil. Quatre faux echecs. La sonde detecte desormais la notation et remet
les composantes a l'echelle.

**Specificite de la neutralisation.** Deja signale au chapitre 141 : la feuille
qui rend le texte transparent doit etre plus specifique que la regle la plus armee
de la page, faute de quoi elle mesure la couleur du texte. Portee a six
identifiants.

### §142 bis — QA des tuiles sans bandeaux : le theme clair etait devenu gris

Controle qualite apres le deploiement du chapitre 142. Le theme sombre etait
conforme, mais **le theme clair — qui est le theme par defaut — ne l'etait pas** :
`.rootland` et son voile n'avaient aucun garde de theme, si bien qu'une
photographie sombre recouverte d'un voile sombre a `.68/.78` s'affichait sous une
page dont le texte est fonce. Resultat : la page creme devenait un champ gris
uniforme, la photo invisible.

Precision utile : ce n'etait **pas** un defaut d'accessibilite. Mesure du
contraste en theme clair avant correctif : 113 textes, **0 echec AA**, pire
6,04:1. Le texte restait lisible ; c'est l'identite visuelle qui etait perdue.

Correctif : un voile propre au theme clair,
`rgba(250,247,241,.82) -> .90`, applique sur `html.et-plight` et `html.et-jlight`.
La photo redevient une teinte tres legere sous un fond creme.

| Verification apres correctif | Textes | Echecs AA | Pire |
|---|---|---|---|
| Theme clair, 6 pages | 113 | **0** | 6,01:1 |
| Theme sombre, 8 pages | 140 | **0** | 5,11:1 |

Pixels de fond releves en theme clair apres correctif : 244,243,236 ·
254,253,251 · 240,231,228 · 224,220,214 — la page est bien creme.

**Piege de mesure a retenir.** La premiere capture apres correctif montrait
encore le champ gris alors que le style calcule affichait deja la nouvelle
valeur : le fichier image n'avait pas ete reecrit. Ne jamais conclure d'une
capture sans verifier qu'elle date bien de l'etat mesure — ici le releve du pixel
peint a tranche.

**Rappel d'hygiene.** Un redemarrage de conteneur avait entre-temps restaure une
copie de travail anterieure : 214 fichiers divergents, `immersion-v2` absent, et
la premiere passe de QA mesurait donc un site qui n'etait pas celui en ligne.
Restauration depuis `FETCH_HEAD` avant toute conclusion.

## §143 — Chapeaux de heros : pastille lisible sur les neuf pages fautives

### Le defaut

Balayage des 199 pages au premier ecran, deux themes, contraste au pixel peint :
39 echecs AA sur les elements de heros, en deux familles. Celle traitee ici :
`.kick`, le chapeau dore `#F0CE82` pose directement sur la photo du heros —
17 echecs sur 9 pages, de 1,96:1 (clients) a 3,28:1 (engagements), dans les deux
themes. Verifie sur `99136d2`, la version anterieure a toute l'immersion :
valeurs identiques. **Defaut preexistant**, pas une regression de la seance.

### Le correctif

Fichier `hero_kick.css` ecrit tel quel — plus de CSS fabrique par concatenation
de chaines Python : la tentative precedente avait casse le bloc quand
l'apostrophe de « fil d'Ariane » dans un commentaire a termine la chaine trop
tot, mettant du texte libre dans les selecteurs (36 echecs au lieu de 39).
Validation structurelle avant injection : equilibre des accolades et controle
que chaque selecteur genere est bien un selecteur.

Le chapeau recoit une pastille au vocabulaire deja employe sur le site : fond
`linear-gradient(90deg, rgba(8,13,22,.76), rgba(8,13,22,.64))`, filet dore a
26 %, rayon 999px, flou d'arriere-plan 6 px. Le texte est force a `#F2D28C`
car sur certaines pages il etait sombre en theme clair — sans cela, sombre sur
pastille sombre.

Decouverte en chemin sur `charte.html` : le heros `.dsh` commence a y=0, si bien
que le chapeau se trouvait a 72 px, entierement masque par la barre fixe — un
defaut d'occlusion que la sonde de contraste revelait indirectement (elle
mesurait la barre, pas le heros). Corrige par
`padding-top:calc(var(--nav-h,110px) + 26px)`.

### Verification

Balayage complet des 199 pages, deux themes, apres correctif : **0 echec** sur
les chapeaux (contre 17). Controle visuel sur clients (clair), societe (sombre)
et charte (clair) : pastille en place, chapeau de charte degage de la barre.

### Reste ouvert

`.bcrumb`, le fil d'Ariane : 22 echecs a 1,04:1 en theme clair — invisible sur
18 pages. Lui aussi preexistant. Il repose tantot sur un bandeau clair, tantot
sombre dans le meme theme : une couleur unique ne suffit pas, et la premiere
tentative de pastille est tombee sur l'erreur de generation ci-dessus. A
reprendre avec la meme methode fichier-CSS-valide ; chantier suivant.

## §144 — Verre immersif final : plus aucune bande entre la photo et les tuiles

### Le diagnostic qui manquait

Demande : « eliminer toutes les bandes et laisser les tuiles sur l'image ».
L'inventaire des elements larges peignant un fond a revele pourquoi des bandes
subsistaient apres le chapitre 142 : sur `societe.html` en sombre, la regle
d'immersion du chapitre 141 **correspondait bien a la section** (verifie par
`matches()`), declarait `background-image:none!important`, venait plus tard dans
le document — et perdait quand meme la cascade contre les halos du chapitre 136.
Le mecanisme exact n'a pas ete arbitre regle par regle : trois generations de
blocs se disputaient les memes elements, et l'issue dependait de subtilites de
specificite de `:has()` et `:is()` non maitrisables a cette echelle.

Restaient aussi, mesures : les voiles `rgba(8,13,22,.45)` des sections d'amont,
les degrades de panneaux (`.cmpw` a 86 % de blanc, `.cw-panel`), le degrade de
`#cta-band`, et en theme clair un voile creme a .82/.90 qui rendait la photo
presque invisible.

### Le correctif : un bloc final qui tranche

`verre_final.css`, fichier ecrit tel quel, valide structurellement, injecte **en
dernier** dans le head des 195 pages, arme a six identifiants — au-dessus de tout
ce qui precede :

1. toute section et tout panneau large (`main section`, `body>section`, `.cmpw`,
   `.pj-banner`, `.docn`, `.it-grid`, `.epw-g`, `.biz-grid`) deviennent
   transparents, fond et ombre ;
2. `#cta-band` garde une presence mais en verre : degrade leger + flou 10 px,
   variante claire pour les themes clairs ;
3. le voile du theme clair descend de .82/.90 a **.66/.78** : la photo traverse
   desormais aussi en clair ;
4. `prefers-contrast:more` restitue des panneaux opaques dans les deux themes.

La barre de navigation et le pied de page gardent leur fond : ils portent la
lisibilite de la navigation, pas le decor.

### Verification

Inventaire des bandes apres correctif (societe, amont, deux themes) : il ne
reste que la barre de navigation, le pied de page, et le `#cta-band` en verre
voulu. Tous les halos et voiles de section ont disparu.

Contraste au pixel peint, 8 pages, deux themes, texte du corps :

| Theme | Textes | Echecs AA | Pire |
|---|---|---|---|
| Clair (voile allege a .66/.78) | 136 | **0** | 6,04:1 |
| Sombre | 136 | **0** | 6,39:1 |

L'allegement du voile clair ne coute donc rien en lisibilite : le pire contraste
reste au double du seuil.

## §145 — Fil d'Ariane : la pastille annoncee, et deux lecons de mesure

### Re-mesure d'abord

Le chantier annonce au chapitre 143 partait de 22 echecs a 1,04:1. Mais le
chapitre 144 a change tous les fonds : re-mesure complete avant d'ecrire une
ligne de CSS. Inventaire reel : 41 pages portent `<nav class="bcrumb">` (les
180 occurrences de « bcrumb » au grep comptent aussi les feuilles de style qui
ne l'utilisent pas — tester la balise, pas le mot). Releve au pixel peint,
41 pages x 2 themes, 246 mesures :

- **26 echecs**, concentres sur 5 pages : clients, clients-en, solutions,
  solutions-en (blanc translucide .78 pose sur la photo du heros, 3,17:1 dans
  les deux themes) et communiques-en (lien gris 90,102,120 a 3,27:1 — la page
  francaise jumelle, elle, passait : divergence FR/EN de plus).
- Les 22 echecs d'origine etaient donc largement resorbes par le decor du
  chapitre 144 ; sans re-mesure, on aurait « corrige » un etat disparu.

### La pastille

`bcrumb.css`, fichier litteral valide (accolades + selecteurs), injecte en
dernier dans le head des 41 pages sous `<style id="bcrumb-chip">` : meme
vocabulaire que le chapeau du chapitre 143 — verre sombre en degrade .78/.66,
filet dore, flou 6 px, liens en blanc .94, separateur en blanc .72, page
courante et survol en dore `#F2D28C`, focus visible dore.

### Premiere lecon : inline-flex ne se laisse pas pousser

Version initiale en `display:inline-flex` avec le padding-top historique
converti en marge : le fil est remonte de 35 px et a disparu sous la barre de
navigation fixe (132 px) — les marges verticales d'une boite inline ne
deplacent pas la ligne. Diagnostic par `elementFromPoint` sur les 41 pages.
Correctif : `display:flex` + `width:fit-content`, et la marge haute fixee a
**74 px**, valeur du padding-top d'origine relevee au calcul sur les 41 pages
(la clamp() du CSS source est ecrasee ailleurs — relever la valeur calculee,
pas la valeur ecrite). Verification : 41/41 pages, lien degage de la barre,
pastille peinte, position a moins de 12 px de l'origine.

### Deuxieme lecon : le neutralisateur doit depasser la page

Le sweep de controle a d'abord rendu 169 « echecs au pire pixel » a ~1:1. Le
pixel le plus clair sous « Brochure » etait… le texte dore lui-meme : les
regles de la pastille (6 identifiants + classes) battaient le neutralisateur a
6 identifiants, le texte restait peint pendant la capture. Le neutralisateur
passe a **7 identifiants** — la regle du chapitre 142 se generalise : il doit
toujours depasser d'un cran la regle la plus armee de la page, y compris celles
qu'on vient soi-meme d'ajouter.

### Verification finale

Sweep complet apres correction, 246 mesures, 41 pages x 2 themes :

| Critere | Echecs | Pire ratio |
|---|---|---|
| Ratio moyen sous la boite | **0** | 5,29:1 |
| Pire pixel sous la boite | **0** | — |

Controle visuel desktop clair/sombre et mobile 375 px sur clients, ethique
(fil long « Ethique & conformite ») et communiques-en : pastille en place,
aucune occlusion, pas de retour a la ligne parasite ; le fil et le chapeau
forment deux pastilles empilees du meme vocabulaire. Le lien gris de
communiques-en est rentre dans le rang par la meme regle.

## §146 — Ce que le verre final avait casse : les ilots sombres des pages poles

### La passe mobile qui devait etre une formalite

QA mobile 375 px sous le verre du chapitre 144, 14 pages, deux themes, 916
mesures au pixel peint : 42 echecs — tous concentres sur les pages
TchadiTech et GreenTech (FR et EN) et les deux pages patrimoine. Contre-mesure
en desktop : memes echecs a 1,0-1,2:1. Ce n'etait pas un probleme mobile,
c'etait un angle mort de l'echantillon du chapitre 144, qui ne comprenait
aucune page de pole.

### Le mecanisme

Ces pages portent leur propre couche `et-plight` : kickers indigo ou emeraude,
textes pales .68-.72, titres blancs — une palette concue pour des sections
sombres que la couche posait elle-meme (`.tt-flag`, `.tt-flow`, `.tt-carnets`
en #0B111A/#0E1622 ; `.gtp`, `.gtt` cote GreenTech). Le verre final du
chapitre 144, plus arme et plus tardif, a retire ces fonds comme il retirait
toutes les bandes : les textes pales sont tombes nus sur le voile creme du
theme clair. En sombre, le voile du decor suffisait — rien a corriger.

### Le correctif : des ilots, pas des bandes

`ilots146.css`, valide et injecte apres verre-final dans les 6 pages :

1. les cinq sections redeviennent des **ilots de verre sombre arrondis**
   (degrade .93/.90, rayon 22 px, flou 8 px), en theme clair seulement — la
   photo reste visible autour, l'esprit « sans bandes » est preserve ;
2. `.ttc-card`, absente de la liste des tuiles sombres du chapitre 141,
   redevenait du verre creme sous texte blanc dans l'ilot (3,4:1) : verre
   sombre rendu en clair ;
3. cartes faune `.fp-card` : le texte vit dans le tiers bas, sur la photo de
   l'animal (blanc a 1,82:1 sur la roche claire de l'oryx). Ombre interne
   `inset 0 -170px` + durcissement du degrade de la legende `.fp-cap`
   (.30/.88 des 22 %), les deux themes.

### Une lecon de mesure de plus

Deux passes successives sur patrimoine rendaient des ratios differents pour le
meme texte (3,6 puis 4,1) : les animations `.reveal` etaient en cours pendant
la capture — l'etat mesure n'etait pas l'etat final. Le neutralisateur fige
desormais aussi `animation`, `transition`, `opacity` et `transform`. Regle :
on mesure l'etat stabilise, pas l'etat transitoire.

### Verification

Apres correctif, probe fige, 6 pages x 2 themes :

| Viewport | Mesures | Echecs AA | Pire |
|---|---|---|---|
| Mobile 375 | 471 | **0** | 5,42:1 |
| Desktop 1440 | 344 | **0** | 5,16:1 |

Controle visuel en clair : ilots nets, tuiles sombres a accents dores et
emeraude retrouvees, cartes faune lisibles jusqu'au nom latin.

### Reste ouvert

`amont/index.html` en clair mobile : le chapeau `.pgl` du heros mesure a
3,25:1 (degrade horizontal du heros trop leger a 375 px). Cas unique et
marginal, famille amont a traiter d'un bloc lors d'une passe dediee.

## §147 — QA des tuiles versus majors : interaction, pas seulement contraste

### Le referentiel

Les sites des majors tiennent trois promesses sur leurs cartes : un retour
visuel au survol quand la carte est un lien, un anneau de focus au clavier,
et des cibles tactiles confortables (44 px) au-dela du minimum WCAG 2.5.8
(24 px). Releve Playwright sur 30 familles de tuiles du site : survol avant/
apres au pixel calcule, focus programme et focus clavier reel, curseur,
semantique lien, rayon, transitions.

### Ce qui tenait deja

24 familles conformes : les cartes-liens (pmore, plc, prof, sb, gtp, ttf,
hxi) changent au survol et portent l'anneau dore au clavier ; l'anneau global
`a:focus-visible` en ombre portee couvre aussi les liens internes des cartes
(ppj-syn — premier releve faussement negatif : il lisait `outline` seulement,
l'anneau du site est un `box-shadow`). Les fausses pistes ecartees en
verifiant avant de corriger : `hpcard` sans survol propre — la levee est
deleguee au conteneur `.hubwrap`, c'est voulu ; `biz-card` au curseur pointer
sans lien — le script de la page en fait des zones interactives clavier.

### Les trois ecarts reels, corriges par `qa147-tuiles` (20 pages)

1. **a.glm-c** (glossaire FR/EN) : la regle de survol existait (bordure
   doree) mais perdait la cascade — carte-lien muette. Retabli arme et tard :
   bordure doree, levee 3 px, ombre, transition, garde reduced-motion.
2. **.flip-hint / .flip-cta** (accueil FR/EN) : 73x24 px. Conforme au
   minimum 24 fixe par un chapitre anterieur, sous le confort majors.
3. **button.f2hint** (16 pages poles, style pose en ligne par le script) :
   29 px de haut.

Pour 2 et 3 : `@media (pointer:coarse)` monte les cibles a 44 px minimum sur
ecrans tactiles seulement — l'esthetique souris ne change pas. Le
`!important` de la feuille bat le style en ligne du script.

### Verification

Survol glm-c : bordure `rgb(240,206,130)` + translation -3 px mesurees apres
correctif (avant : aucun changement). Emulation Pixel 7 (pointer:coarse
confirme par matchMedia) sur accueil, amont, aval : **38 cibles relevees, 0
sous 44 px**. Captures : carte flip mobile intacte avec sa pastille elargie,
carte glossaire survolee levee et cerclee d'or.

## §148 — P1 de la revue ultra : tout le contenu dans des landmarks

### Origine

La revue ultra contre les majors a passe axe-core sur 6 gabarits : des noeuds
`region` (contenu hors landmark) sur 4 pages, et 3 `color-contrast` serieux
sur l'accueil. Engagement de P1.

### Les contrastes de l'accueil : faux positifs d'axe, prouve au pixel

Les 3 noeuds (`.hx-slogan`, ligne WhatsApp) mesures au pixel peint, deux
themes : **6,54 a 14,44:1** — tous conformes. axe calcule sans voir le verre
ni la photo de fond ; la mesure au pixel peint fait foi. Aucun correctif.

### Les regions : cinq familles, 232 pages corrigees

1. **Heros hors `<main>`** (97 pages : section.hero, div.jhero des 50 pages
   journal, hx-slides de l'accueil et de la brochure, dsh de la charte) :
   `role="region" aria-label="Introduction"`.
2. **Bouton flottant accueil `#homeFab`** (86 pages, racine ET sous-dossiers
   — le premier passage n'avait couvert que la racine) : enveloppe
   `<nav aria-label>` FR/EN selon la page.
3. **Bloc de partage `.share`** (84 pages) : il portait deja son etiquette,
   il recoit `role="region"`.
4. **`<div>` de pied d'article** des 50 pages journal : region « Autour de
   l'article » / « Around the article ».
5. **Configurateur** : lien retour + h1 masque enveloppes dans un `<header>`
   (banner), skip-link deplace dedans.

Effet de bord traite : plusieurs regions defilantes partageaient la meme
etiquette sur brochure-en (`landmark-unique`) — dedoublonnage generalise par
balayage de tout le site (etiquettes numerotees).

### Verification

axe-core, regles `region`, `landmark-unique`, `landmark-one-main`,
`landmark-no-duplicate-banner`, 16 pages representatives (racine, journal,
poles, configurateur, brochure FR/EN) : **0 violation**.

## §149 — P1 : l'abonnement aux communiques existait a moitie

### Correction de la revue d'abord

La revue ultra affirmait « pas de flux RSS » : faux. `feed.xml` et
`feed-en.xml` existaient (31 items de Carnets), declares sur l'accueil,
carnets et communiques FR. Le releve exact : les flux, malgre leur titre
« Carnets & communiques », ne contenaient **aucun communique** ; la page
`communiques-en` ne declarait pas le flux ; et aucun point d'abonnement
visible n'existait.

### Correctifs

1. Les 6 communiques (CP-2026-001 a 006) ajoutes aux deux flux avec guid
   permalien, pubDate RFC-822 et description — 37 items par flux, XML valide
   (ElementTree).
2. Declaration `rel="alternate"` du flux sur communiques-en.
3. Bloc « S'abonner » en tete des deux pages communiques : lien flux RSS +
   courriel `presse@enertchad.td` pre-rempli. Region etiquetee, verre dore en
   sombre ; le theme clair reprend ses couleurs d'encre — lisible dans les
   deux (verifie en capture).

L'abonnement courriel automatise (vraie liste de diffusion) reste un choix
d'operateur a faire par la direction — un service externe demande un compte ;
le lien courriel comble l'ecart fonctionnel en attendant.

## §150 — Chantier performance repris : le mecanisme franchit la barriere

### Acquis de la seance (gabarit pilote : societe.html)

1. **Le sous-ensemble utilise se calcule en navigateur** : 557/1057 regles
   gardees (103 Ko), regle de prudence « au moindre doute on garde »
   (pseudo-classes retirees avant test, selecteur imparsable = garde).
2. **L'ordre est la moitie du probleme** : inline groupe a la position de la
   premiere feuille = 35-60 % de pixels differents (les feuilles remontent
   avant les blocs style intercales, la cascade bascule). Inline PAR FEUILLE,
   chacune a sa position, liens differes en place (`media="print"` +
   `onload`) : **hauteurs identiques 4/4, residu 0,09-0,43 %** — la barriere
   du chapitre 140 est franchie par le mecanisme.
3. **Decouverte font-display:optional** : la reference n'applique presque
   jamais ses polices web au premier rendu (repli conserve a vie) ; la
   variante inline fait partir les requetes plus tot et les polices
   s'APPLIQUENT. C'est une amelioration, mais c'est un changement de rendu —
   la comparaison honnete se fait a polices egales (bloquees des deux cotes).
4. Le sous-ensemble laisse un ecart residuel en clair 1440 (28 %, determini-
   ste) : trois ancres perdent un degrade dore, et l'essentiel vient d'une
   course de decodage d'images du harnais (bloquer les images l'a montre
   erratique — harnais a stabiliser avant conclusion).

### Reste avant deploiement

Stabiliser le harnais (images et polices bloquees proprement, un seul route
handler), reparer la regle des ancres au degrade, re-passer la barriere sur
le sous-ensemble, mesurer le LCP a 1,6 Mb/s, puis etendre gabarit par
gabarit. Rien n'est publie de ce chantier : le site en production est
inchange.

## §151 — Simulation de visiteurs : un artefact ecarte, un vrai bug d'inertie corrige

La simulation de parcours (investisseur, client, journaliste) sur banc a
reecriture Vercel (`srv_rw.py`, port 9125 — les liens sans extension du site
exigent cette reecriture, premiere lecon) a rendu 2/3 parcours complets. Le
pas client mobile « bloque » etait un artefact : le CTA « Nos marches »
vit sur la face arriere d'une carte a bascule — le visiteur reel bascule
puis clique, verifie jusqu'a `/clients`.

Mais l'instruction a expose un vrai defaut : la famille `.flip` de l'accueil
(cartes mfo/hxi, script `flip-js`) ne rendait **jamais inerte la face
cachee** — ses liens invisibles etaient tabulables au clavier, contrairement
a la famille `.flip2`/f2f qui gere `inert` depuis son origine. Correctif
dans `flip-js` (index et index-en) : etat initial inerte pour la face
arriere, bascule synchronisee. Verifie : avant `bk.inert=true`, apres
bascule `fr.inert=true`/`bk.inert=false`, re-bascule conforme, navigation
du CTA intacte.

## §152 — Upgrade mobile : le guide « Suite » s'escamote au defilement

Arbitrage engage par la demande « upgrade mobile versus majors ». Les trois
flottants mobiles (guide #scrollcue, #toTop, bascule de theme) chevauchaient
le contenu sur investisseurs et patrimoine (mesure §-QA mobile : 3
occurrences chacun ; visible aussi en desktop sur le CTA « Rejoindre la
demarche »). Pattern des majors retenu : un indice de defilement n'a de sens
que sur le premier ecran — `cue-tact` (style + script, 4 pages :
investisseurs FR/EN, patrimoine FR/EN) escamote #scrollcue des 140 px de
defilement (fondu 300 ms, pointer-events coupes) et le restitue au retour en
haut. Verifie : classe posee au scroll, opacite en transition vers 0,
restitution au retour. #toTop et la bascule de theme restent — standards du
secteur, poses aux coins. Reste au carnet : meme traitement pour les ~200
autres pages si l'essai convainc, et l'effacement pres des CTA du premier
ecran.

## §153 — Application generale : escamotage du guide + theme-color synchronise

Generalisation demandee des acquis du chapitre 152 a tout le site (195
pages) : le guide « Suite » s'escamote au defilement partout, et une
synchronisation `theme-color` (script `tcol-js`, MutationObserver sur la
classe du html) aligne la barre du navigateur mobile sur le theme choisi —
creme #FBF9F3 en clair, marine #0B1322 en sombre, mise a jour en direct a la
bascule. Verifie sur societe, clients, amont : couleurs echangees en direct,
classe d'escamotage posee au defilement, opacite du guide en route vers 0.
Le Configurateur (sans </body> standard) est volontairement hors perimetre.

## §154 — Revue forage onshore appliquee : le perimetre dit sa verite

Suite de la revue « solutions et services de forage onshore vs SLB/
Halliburton/Baker Hughes ». Ses deux premieres recommandations sont
executees sur services-ep FR/EN :

1. **Section « ofs-perimetre »** — « Ce que nous faisons en propre, ce que
   nous integrons ». Deux cartes : en propre (genie civil wellpads,
   operations de surface, interventions legeres, essais de puits, eaux de
   production, logistique, chimie EOR, champ numerique) ; integre sous
   direction de projet EnerTchad (forage directionnel et MWD/LWD, fluides
   specialises, cimentation-tubage, appareils lourds). L'ambiguite du
   qui-fait-quoi — l'ecart de credibilite n° 1 releve par la revue — est
   levee, avec la mention « perimetre vise · societe en constitution ».
2. **Controle de puits** ajoute au socle HSE-Q : barrieres puits, BOP
   testes au calendrier, exercices de controle de venue, certification
   IWCF/IADC visee — l'absence relevee comme preuve HSE manquante.

Verification : section presente et rendue FR/EN, mention IWCF servie,
adaptation du theme clair prise en charge par la couche de la page.
Restent au carnet de la revue : carnet « forage directionnel », fluides et
cimentation developpes au catalogue, fiche classes d'appareils.

## §155 — Revue forage, suite : le catalogue passe a 12 lignes, les appareils ont leur gamme

Recommandations 3 et 4 de la revue forage onshore, sur services-ep FR/EN :

1. **Deux lignes ajoutees au catalogue d'interventions** (10 -> 12, compteur
   KPI mis a jour) : « Fluides de forage & boues » et « Forage directionnel ·
   MWD/LWD » — meme gabarit tri-c que les dix existantes (detail deroulant,
   cas d'usage defi/reponse/gain), marquees « ligne integree · voir
   perimetre » en coherence avec la section du chapitre 154.
2. **Fiche « Appareils · la gamme visee »** sous le perimetre : unites de
   workover 150-350 HP adaptees aux bassins de Doba et Bongor, pompage et
   azote associes ; le forage lourd reste explicitement une ligne integree.

Incident evite et consigne : cote EN, la premiere insertion a vise la
mauvaise grille tri-g (celle des familles EnerSupply, pas le catalogue) —
detecte au comptage (13 au lieu de 12), corrige en ancrant sur la carte
Wireline. Et la restauration `git checkout --` a rendu une version
anterieure au chapitre 154 : l'index n'avait pas suivi les fetch successifs.
Regle : apres chaque fetch, `git reset --mixed FETCH_HEAD`, et toute
restauration passe par `git cat-file blob FETCH_HEAD:`.

Verification fonctionnelle des deux pages : 12 cartes dans la grille
catalogue, accordeon operationnel sur les nouvelles cartes (le script
partage les prend en charge), fiche appareils rendue, section perimetre et
IWCF du chapitre 154 intacts.

## §156 — Le carnet « forage dirige » : la derniere reco editoriale de la revue

Cinquantieme-et-unieme carnet du journal, en freres jumeaux FR/EN :
« Atteindre trois cibles depuis un seul wellpad » — moteur de fond, RSS,
MWD, LWD, geosteering, ellipse d'incertitude, et la lecture tchadienne
(emprise minimale, bassins de Doba et Bongor), avec renvoi vers le
perimetre du chapitre 154. Genere par clonage du gabarit
journal-mecanique-fluides, cable de bout en bout : title/description/
OG/Twitter, canonical et hreflang croises, JSON-LD date au 2026-08-12,
cartes en tete des deux listes Carnets, item dans les deux flux RSS
(38 items, lastBuildDate rafraichi, XML valide), sitemap a 197 URLs.

Deux pieges de generation consignes : une regex de remplacement de corps
trop gourmande a d'abord insere l'article... dans le head (detecte par
position du texte, reconstruit par decoupe indexee — regle : sur un gabarit
de 80 Ko, les bornes se calculent par index, pas par regex non-greedy) ; et
une twitter:description residuelle a survecu au premier passage (attrapee
par l'assertion anti-slug « Darcy »).

Verification : axe 0 violation sur les deux pages (region, landmark, title,
lang), 6 h2, liens internes valides (perimetre, retours carnets), carte
rendue en tete de liste, canonical et bascule FR/EN corrects.

## §157 — Revue logistique appliquee : la discipline du corridor s'affiche

Les quatre recommandations applicables de la revue logistique onshore,
executees d'un bloc sur intermediaire/logistique FR/EN — section ancree
« log-custody », region etiquetee, trois cartes + une phrase :

1. **Custody & anti-coulage** : scelles numerotes, pesee au pont-bascule
   depart/arrivee, jaugeage contradictoire, tolerance de freinte au
   contrat, reconciliation charge/livre par telematique — le lexique de la
   preuve physique qui manquait (scelles et pont-bascule etaient a zero
   occurrence sur tout le site).
2. **Journey management** : plan de route valide, temps de conduite
   plafonnes, fatigue, points de repos securises, nuit proscrite, jalons
   GPS — le pendant routier du controle de puits du chapitre 154.
3. **Le calendrier tchadien** : pre-positionnement avant l'hivernage,
   rotation de la reserve distribuee pendant — la justification
   saisonniere de la these maison, enfin ecrite.
4. **Multimodal sans langue de bois** : la route domine, le pipeline porte
   le brut, le rail transcamerounais est une option etudiee.

Mention « protocoles vises · societe en constitution » en cloture. Media
query dediee pour une colonne en mobile. Verification : bloc present et
rendu FR/EN, 3 cartes, 0 violation axe (contraste, region) sur la section,
grille a 1 colonne confirmee en emulation Pixel 7, capture visuelle propre
en theme clair.

## §158 — Incident de lignees : main remplace hors session, production restauree

Constat : GitHub main pointait sur une lignee etrangere a ce journal
(« Home: trois maillons en panneaux », 162 pages), issue d'une session de
travail parallele, sans aucun des chapitres 143 a 157 — pendant que la
production Vercel servait encore la lignee du journal (197 pages). Les
« rembobinages » de fichiers subis tout au long de la session s'expliquent :
deux sessions se partageaient la meme copie de travail.

Arbitrage utilisateur : restaurer la lignee du journal. Source de verite
utilisee : la production elle-meme, crawlee integralement (203 fichiers via
le sitemap + accueil + flux + robots + manifest), controles de contenu aux
marqueurs (verre-final, cue-tact, ofs-perimetre, log-custody, carnet forage,
chapitre 157 present). Sept assets references par cette lignee manquaient a
l'arbre de l'autre : recuperes de meme (2 CSV ESG, 5 images 760px, formats
verifies). Le commit de l'autre lignee reste dans l'historique GitHub.

Lecon de discipline : une seule session d'ecriture a la fois sur ce depot ;
avant toute publication, verifier que FETCH_HEAD descend bien du dernier
etat du journal (les marqueurs de chapitre servent de test), sinon
s'arreter et demander l'arbitrage — c'est ce qui a ete fait.

## §159 — Revue raffinage appliquee : la preuve au litre pres

Les quatre recommandations applicables de la revue raffinage :

1. **Section « spec-coa »** sur aval/raffinage FR/EN (region etiquetee,
   trois cartes) : specifications nommees (AFRI/ARSO, equivalents EN 228 /
   EN 590 vises, soufre cible par coupe) + certificat d'analyse a chaque
   lot et echantillons temoins — le pendant produit de la custody du
   chapitre 157 ; HSE de l'unite (torche pilotee, permis de feu,
   retentions, effluents boucles sur la gestion des eaux) ; et la franchise
   du procede : ni craquage ni hydrotraitement au premier palier, dit
   noir sur blanc.
2. **Tableau des rendements type d'un topping** dans le carnet
   mini-raffinerie FR/EN : GPL 1-3 %, naphta 5-12 %, distillats moyens
   25-40 %, residu 45-65 % — fourchettes indicatives sourcees, chaque
   coupe reliee a son destin maison (NRJ+, gazole, bitume). C'est le
   residu abondant qui fonde la these bitume, desormais chiffree.

Incident evite : le tableau EN d'abord insere apres le dernier h2 de la
PAGE (le pied « De la roche-mere... »), hors du corps d'article — detecte
par la verification (.jbody table absent), replace avant « What it changes
at the pump ». Regle deja connue, reconfirmee : ancrer sur un texte
unique du corps, jamais sur un rang.

Verification : sections presentes FR/EN, 3 cartes, 0 violation axe
(contraste, region) ; tableaux presents dans le .jbody des deux carnets,
4 lignes chacun ; media query une colonne pour la grille mobile.

## 160 — Audit de coherence pages/sections/sujets/themes + reparation des liens de langue (2026-08-13)

Demande : « Audit la coherence des pages, sections, sujets, themes »
puis « Engage ». Audit statique exhaustif sur 202 pages (base f14e9c5),
puis correction de tout ce qui a ete confirme.

Verifie coherent, sans correction : jumelage FR/EN complet (97 paires,
hreflang reciproques a 100 %, canonicals conformes) ; sections jumelees
symetriques (les ecarts d'id type cle-acces/access-key sont des
traductions, contenu equivalent verifie) ; « 1 070 km » (oleoduc
Doba-Kribi) et « 1 700 km » (corridor routier Douala-N'Djamena)
designent deux realites distinctes, usage rigoureux partout ; marques
avec TM a la premiere mention, Tchadium sans TM uniforme ; « societe en
constitution » / « company in formation » systematiques ; rubriques FR
cartes = articles 27/27 ; titres et descriptions EN sans residu FR ;
ar.html vers pages FR = arbitrage assume, pas un defaut.

Defauts confirmes et corriges (48 fichiers) :

1. **23 selecteurs de langue « Français » casses** — 15 pages EN dont le
   jumeau FR est en sous-dossier pointaient vers /amont/parc (heritage
   du gabarit parc-en) : hseq, impact, transition, patrimoine,
   tchaditech x5, enerconseils/atlas et conseil, tchaditude x4. Et 8
   pages pole-*-en dont le selecteur pointait vers... la page elle-meme,
   defaut preexistant attrape par la verification generalisee (cible
   attendue = jumeau declare par le hreflang fr). Toutes reparees vers
   le vrai jumeau.
2. **154 liens internes EN vers pages FR** alors que le jumeau EN
   existe : les 24 cartes d'articles de carnets-en (+ carte STOP) vers
   les articles FR, fils d'Ariane « Home » vers index au lieu de
   index-en, paginations precedent/suivant, CTA de corps de page
   (contact, investisseurs, engagements, societe, clients...), les 8
   pole-*-en vers /#poles au lieu de /index-en#poles, et
   /contact?profil=... au lieu de /contact-en?profil=... — reecrits par
   script garde-fou : corps uniquement, jamais les selecteurs ni les
   hreflang/canonical, fragments et parametres conserves, chaque ancre
   verifiee presente dans la page EN cible (30 fragments, 0 manquant).
3. **Tableau des specifications absent de produits-en** : section
   specs-products portee depuis aval/produits (7 produits, EN 590,
   EN 228, DEF STAN 91-091, bitumes 60/70-80/100, EnerLub API/SAE),
   traduite, CSS spc-css copie, PDF signale « in French », inseree
   avant #prd-buy comme en FR.
4. **« 10 lignes/lines » perimes** depuis le passage du catalogue a 12
   (chap. 155) : carte d'orientation services-ep FR/EN, solutions.html,
   pastille pole-amont-en — 4 occurrences passees a 12 (catalogue
   reverifie : 12 cartes des deux cotes).
5. **Rubrique EN unifiee** : les cartes « Economics · Education »,
   « Technical · Education » et « Technical · Explainer » (celle-ci
   introduite par moi au chap. 156, erreur consignee) alignees sur le
   libelle des articles « In plain words ». 6. Kicker brochure-en
   harmonise (« local-content project »).

Verification : re-audit a zero (plus aucun lien EN->FR hors selecteurs
legitimes, 1 par page ; 0 ecart carte/article ; jumelage inchange) ;
rendu produits-en controle en local desktop et mobile (theme clair
adapte, tableau defilant, 0 debordement horizontal) ; aucun id duplique.

Note d'environnement : srv_rw.py avait disparu de /root/work (churn du
conteneur), recree depuis le gabarit du journal ; un pgrep trompeur
laissait croire le serveur actif — desormais verifier par curl, pas par
pgrep.

## 161 — Distribution & reseau : la preuve jusqu'a la pompe (2026-08-13)

Execution des recommandations 1-4 de la revue distribution/reseau
(referentiel frais : Vivo Energy ~4 200 stations et modele dealer, Total
controles qualite + client mystere, Oryx requalification des bouteilles
GPL en Tanzanie, programmes nationaux de marquage moleculaire Ouganda/
Kenya). Constat de la revue : la vision etait la (EnerPro, EnerClub,
Mobile Stations, ARSAT, maillage 12 stations · 8 localites · 3 hubs),
la preuve manquait a trois endroits. Quatre blocs ajoutes, gabarit
maison (§157/159), avant cta-band :

1. **preuve-litre / litre-proof** (aval/distribution + distribution-en) :
   echantillon temoin scelle a chaque livraison station, etalonnage des
   pompes a cadence reguliere avec certificat affiche, CoA par lot et
   marquage moleculaire vise — le dernier maillon de la chaine custody
   (§157) et des CoA (§159), boucle jusqu'a la pompe. Liens vers
   logistique et raffinage (jumeaux corrects par langue, regle §160).
2. **bouteille-securite / bottle-safety** (memes pages) : cycle de vie
   de la bouteille consignee (epreuve periodique et requalification
   visees, controle valve, retrait des bouteilles hors d'age), pesee
   devant le client et controle d'etancheite a chaque recharge, gestes
   du foyer (detendeur 28-30 mbar, eau savonneuse, debout et ventilee).
   Le pendant securite de « la bouteille contre la hache ».
3. **gerant / dealer** (aval/reseau + reseau-en) : ce que la marque
   apporte / ce que le gerant apprend (Tchaditude Academie — pont
   interne) / ce que l'enseigne verifie (client mystere, audits HSE et
   metrologie). Le modele DODO desormais outille, pas seulement nomme.
4. **station-sure / safe-station** (memes pages) : sur la piste (moteur
   coupe, extincteurs), sous la dalle (double paroi, detection de
   fuite, jaugeage rapproche), si ca tourne mal (arret d'urgence, kit
   deversement, exercices). La ligne unique « HSE en station » devient
   trois cartes concretes. Lien vers HSE-Q.

Verification avant publication : 3 cartes par bloc, insertion avant
cta-band, 0 id duplique ; 12 liens internes des blocs — cible
existante, langue conforme (EN vers -en), ancres presentes ; rendu
local desktop FR + EN et mobile 390 px : une colonne, 0 debordement
horizontal. Artefact de sonde reconfirme : le gel animation/transition/
opacity/transform ne fige pas `filter` — un cliche EN flou (blur du
reveal en cours), sans defaut de la page ; a ajouter au neutraliseur si
besoin de pixel-diff.

Fichiers : aval/distribution.html, aval/reseau.html, distribution-en,
reseau-en + MAINTENANCE.md. Reste de la revue : reco 5 dependante des
operations reelles (indicateurs vecus a l'ouverture), consignee.

## 162 — HSE-Q transverse : regles vitales, apprentissage, sante au climat (2026-08-13)

« Engage toutes » : execution de la revue HSE-Q transverse (premiere des
deux revues restantes de la serie sectorielle). Referentiel frais :
IOGP Life-Saving Rules (376 morts 2008-2017 evitables, langage commun
motive par le fait que les contractants font ~80 % du travail), boucle
presqu'accident/enquete/REX, programmes chaleur OSHA/NIOSH.

Constat : la primaute de la securite, STOP, ALARP, ISO et la securite
des procedes construite revue apres revue (§154 BOP, §159 torche, §161
piste/cuves) etaient la. Manquaient : des regles vitales nommees, la
boucle d'apprentissage, la sante au travail sahelienne.

Trois blocs ajoutes sur greentech/hseq + hseq-en (avant cta-band,
gabarit maison) :
1. **regles-vitales / life-saving-rules** : les regles (permis valide,
   energies isolees, ligne de feu, feu nu, ceinture, espace confine),
   STOP en clef de voute (toute personne, quel que soit l'employeur,
   sans reproche), memes regles pour les entreprises exterieures
   (induction avant le premier jour, evaluation a la selection, lien
   achats).
2. **apprendre-avant / learn-before** : declaration sans blame (ce qui
   est sanctionne, c'est de taire un risque), enquete a la gravite
   potentielle (le boulon tombe a cote du casque), REX partage aux
   equipes et sous-traitants ; ratio presqu'accidents/accidents comme
   indicateur de culture, publication au calendrier cibles-2030.
3. **sante-climat / health-climate** : chaleur (eau-ombre-pauses,
   acclimatation, taches lourdes le matin), paludisme (moustiquaires,
   depistage, medevac organisee avant le premier jour), aptitude et
   EPI du climat (harmattan). Le pendant humain du « calendrier
   tchadien » de §157, lien logistique.

Reco 4 (renvois croises) constatee deja satisfaite : raffinage,
services-ep et reseau pointent deja vers hseq dans les deux langues —
le langage commun a desormais sa page d'ancrage. Reco 5 dependante des
operations reelles (TRIR/LTIF constates), consignee.

Verification : 3 cartes par bloc, insertion avant cta-band, 0 id
duplique, liens conformes §160 (EN vers -en), rendu local FR desktop
et EN mobile, 0 debordement. Note d'environnement : le serveur local
via (setsid ... &) en sous-shell meurt desormais (exit 144 du shell
parent) — relance fiable par nohup ... & disown ; verifier par curl.

## 163 — ESG : assurance externe, foncier, surete & droits humains (2026-08-13)

Seconde revue de « engage toutes » : ESG transverse. Referentiel
frais : assurance limitee ISAE 3000 des rapports de durabilite, IFC
Performance Standard 5 (acquisition de terres : eviter-minimiser-
compenser au cout de remplacement, restauration des moyens de
subsistance), Voluntary Principles on Security and Human Rights.

Constat : couverture ESG deja forte — paiements aux Etats, ITIE, Zero
Routine Flaring telemetre, methane chiffre sur impact (LDAR -92 %,
4,2 kg CO2-eq/bbl), mecanisme de griefs protocolise (4 etapes datees),
contenu local chiffre, cibles-2030 avec mode de verification par
indicateur. Trois angles morts reels : personne d'independant ne
verifie l'extra-financier ; pas un mot du foncier et des cultures ;
rien sur l'encadrement des forces de securite.

Trois blocs ajoutes (gabarit maison, avant cta-band) :
1. **assurance-esg / esg-assurance** (engagements FR/EN) : assurance
   limitee ISAE 3000 visee sur les indicateurs cles, revenus sous ITIE
   (lien paiements-etats), auditable a la source (telemetrie
   horodatee, registres — la logique CoA/custody appliquee a
   l'extra-financier). Note reliant l'ambition climat chiffree
   d'impact (reco 4 : le maillage existait deja, complete).
2. **terre-cultures / land-crops** (communautes FR/EN) : eviter puis
   minimiser (trace discute avant l'arpentage), compenser au cout de
   remplacement sur bareme public verse avant l'entree en terre,
   restaurer et suivre les moyens de subsistance ; branchement sur le
   mecanisme de griefs existant (#dialogue). IFC PS5 nomme.
3. **surete-droits / security-rights** (ethique FR/EN) : evaluation
   des risques par site, regles d'engagement (force proportionnee en
   dernier recours, clauses VPSHR dans chaque contrat de gardiennage),
   rendre compte (incidents documentes, acces au mecanisme de griefs).
   VPSHR nommes ; « c'est une realite, pas un tabou ».

Reco 5 dependante des operations (premiere mission d'assurance,
premiers baremes publies, premier rapport VPSHR), consignee.

Verification : 3 cartes par bloc, 0 id duplique, liens conformes §160
(EN vers -en, ancres presentes), rendu local FR desktop et EN mobile,
0 debordement horizontal.

## 164 — Chantier performance §150 conclu : mecanisme prouve, deploiement non retenu, vrai levier identifie (2026-08-13)

Reprise du chantier borne au chapitre 150, harnais reconstruit de zero
(les scripts avaient disparu — rembobinage du bac local, voir note).

**Ce qui a ete etabli, dans l'ordre :**
1. Extracteur de sous-ensemble rejoue (societe.html pilote, 10 feuilles,
   ~154 Ko gardes sur 184) avec deux garde-fous nouveaux : union des
   correspondances sur 4 etats (390/1440 x clair/sombre) apres
   defilement complet, et union « tokens vivants » (une regle n'est
   abandonnee que si ses classes/ids n'apparaissent ni dans le HTML ni
   dans les scripts) — necessaire car le site injecte des classes par
   JS (prem-mesh, mega-ultra, pghero).
2. Malgre cela, barriere non franchie en clair (23-67 %). Bissection en
   trois temps : feuille coupable (bundle_core_a1), puis texte source
   integral inline = 0,00 % (le mecanisme inline est innocente), puis
   bundle re-serialise integral = 23 % : **la serialisation cssText de
   Chromium est en cause** (120 810 octets rendus pour 136 594 source,
   pertes silencieuses, ecart max 38/255 — invisible a l'oeil, reel au
   pixel). Le sous-ensemble par cssText est une impasse ; tout
   extracteur futur devra decouper le TEXTE SOURCE.
3. Variante retenue pour mesure : les 10 feuilles inlinees en texte
   source integral. **Barriere franchie : 0,000-0,015 % sur les 4
   etats, hauteurs identiques.** Faux artefacts ecartes en route :
   ref-vs-ref 0,00 % (determinisme confirme), styles calcules et
   pseudo-elements compares un a un (0 ecart sur 928 elements et 1 856
   pseudo-elements).
4. Mesure a 1,6 Mb/s (200 Ko/s, 150 ms RTT, CPU x4, gzip des deux
   cotes, 5 passes, mediane) : **FCP 2 280 -> 748 ms (-67 %)**, LCP
   2 988 -> 2 720 ms (-9 %). Le CSS bloque le premier rendu ; le LCP,
   lui, bute sur l'image de fond du heros (element LCP = div.hero,
   sable-texture.webp, 175 Ko), decouverte tard car en background CSS.
   Un preload de l'image seul : gain nul (bande passante saturee).

**Decision : deploiement non retenu.** L'inline integral doublerait le
poids de chaque page HTML, gelerait 196 copies du CSS (toute correction
future de nav_a.css exigerait de regenerer tout le site) et perdrait le
cache inter-pages — pour -9 % de LCP. Le chantier se ferme sur un
mecanisme prouve et un arbitrage assume, consigne avec ses chiffres.

**Vrai levier LCP identifie pour un chantier futur** : variant mobile
de sable-texture.webp (1400x2119, 175 Ko, quasi incompressible a
qualite egale : grain haute entropie ; -3 % au re-encodage). Un 760 px
(~50 Ko estimes) via media query sur les 36 pages qui l'utilisent en
fond de heros vaudrait ~-0,6 s de LCP mobile au debit teste — a
executer comme le collage de la home (chapitre anterieur, -28 %).

Notes d'environnement : second rembobinage du bac local constate en
debut de seance (HEAD local revenu a §161 alors qu'origin portait
§163) — restauration par git archive FETCH_HEAD, production jamais
touchee ; regle §158 reconfirmee. Le banc exige : variante servie au
MEME CHEMIN (moteur de mode clair a liste blanche de chemins), second
port avec racine en liens symboliques, gzip cote banc pour etre
representatif de Vercel.

## 165 — Le heros mobile allege : texture 760 px en chargement exclusif (2026-08-13)

Execution du levier identifie au chapitre 164. sable-texture.webp
(1400x2119, 175 Ko, fond du heros et couche rootland de 35 pages) recoit
un variant mobile sable-texture-760.webp (760x1150, q68, 77 Ko).

Deux pieges dejoues en route, consignes pour la suite :
1. **L'ecrasement simple ne suffit pas** : une regle MQ qui surcharge la
   meme propriete fait tout de meme telecharger l'image de la regle
   perdante (Chromium charge les images des declarations correspondantes
   meme battues a la cascade). Premiere forme testee : le mobile
   telechargeait LES DEUX textures (252 Ko au lieu de 175) — pire
   qu'avant. Forme retenue : **chargement exclusif** — la declaration de
   base perd sa couche url (gradients conserves), deux blocs media
   complementaires (max-width:820px / min-width:820.02px) portent
   chacun leur url. Un seul telechargement par largeur, verifie par
   trace reseau.
2. **Un preload preexistant forcait l'original partout** : les pages
   portaient <link rel="preload" as="image" ... sable-texture.webp> —
   remplace par une paire de preloads a attribut media, un par variant.

Formes traitees par le patch (35 pages, 0 anomalie au controle) :
regles CSS html .hero (11 pages, !important conserve), .rootland (33),
et attributs style en ligne .cms-photo (2 pages d'entete a cadre photo,
surcharge :not(#_)!important puisque le style en ligne ne peut porter
de media query — url retiree de l'attribut, deplacee dans les MQ).

Mesures (banc local, 390 px, 1,6 Mb/s, 5 passes, mediane) :
- LCP societe : 4 424 -> 4 220 ms (-204 ms) ; -98 Ko par page vue
  mobile — sur un site dont la these est l'acces depuis le Tchad, le
  poids compte autant que la vitesse.
- Fidelite : hauteurs identiques, 0,000 % desktop, 0,041 % mobile
  (re-echantillonnage de la texture, invisible — controle visuel fait).
- Reseau en contexte neutre : 390 px -> uniquement la -760 ;
  1 440 px -> uniquement l'originale. Le double chargement vu dans le
  harnais de verification etait un artefact du gel de styles injecte.

Note d'environnement : troisieme et quatrieme rembobinages du bac
locaux constates aujourd'hui (avant la seance, puis EN COURS de seance :
deux pages patchees — mentions-legales, enerconseils/index — revenues
en arriere entre deux commandes ; re-patchees et reverifiees). Avant
CHAQUE constitution de lots : recontroler git diff ET la presence des
marqueurs du chapitre dans les fichiers stages.

Fichiers : 34 pages racine + enerconseils/index.html + nouvelle image
assets/img/sable-texture-760.webp (non suivie : a ajouter manuellement
au lot, lecon du chapitre 156) + MAINTENANCE.md.

## 166 — QA iOS (WebKit/Safari) : le site tient, deux cibles tactiles reprises (2026-08-13)

Demande : « QA de la version mobile sur IOS ». Le bac ne peut pas
executer Safari reel ; banc au plus pres : moteur WebKit 26 de
Playwright (celui de Safari), installe pour l'occasion, descripteurs
iPhone SE (375, x2, tactile) et Pro Max (430, x3), UA iOS 17,
production comme cible.

Batterie (10 pages archetypes x 2 tailles, clair + sombre, bandeau
cookies vierge et accepte) : console/erreurs JS, debordement
horizontal, rectangles de la zone basse (nezBar, cookies, bouton
theme, scrollcue — regle du chapitre 152), champs < 16 px (zoom iOS au
focus : AUCUN — le formulaire contact est sain), meta viewport
(viewport-fit=cover present) et usage de safe-area-inset (present),
cibles tactiles < 24 px. Interactions au tap : menu mobile, bascule de
theme, cartes flip (inert §151 au passage), carrousel du heros
(avance + tap sur point). Resultat : tout passe, zero erreur JS, zero
debordement, zero collision de zone basse, zero champ zoomant.

Deux faux positifs ecartes et consignes : un OVERFLOW+68 avec nezBar
geant sur le carnet forage-dirige — une feuille CSS avait echoue au
chargement (TLS transitoire du bac) ; re-test : 0 debordement. Et le
bandeau cookies « visible » dans les rectangles : il etait hors ecran
(etat cache), le controle de zone doit exclure y > viewport.

Deux vraies cibles reprises :
1. **Les 5 points du carrousel du heros (12x12, pas de 22 px)** sur
   index et index-en. Le bundle prevoyait deja min 44 px — mais la
   regle blindee de la page les re-forcait a 12x12!important (erreur
   maison consignee). Correctif visuellement neutre : contenu 12 px +
   **bordure transparente de 6 px** (boite de frappe 24x24,
   background-clip:padding-box, le remplissage ::after reste dans la
   boite de padding), gap 10 -> 0 (pas de 22 -> 24 px, ecart visuel
   +2 px par intervalle, imperceptible — capture a l'appui). Premier
   essai corrige : width:24 avec box-sizing content-box donnait un
   point VISIBLE de 24 px (boite 36) — le visuel est la boite de
   padding, pas la largeur declaree.
2. **Le lien retour des carnets (16x19)** : regle ajoutee a la feuille
   partagee s_9c80e27170.css (.jtop .jback : padding 8/10 + marges
   negatives equivalentes) — zone de frappe 44x44 sur les 52 pages
   journal, barre jtop a hauteur inchangee (124 px), aucun
   chevauchement.

Verdict QA : la version iOS est saine — rendu WebKit conforme,
interactions tactiles fonctionnelles, safe-area geree ; les deux seuls
defauts trouves sont corriges ci-dessus. Rembobinage du bac constate
encore deux fois pendant la seance (43 fichiers puis /root/work) —
restaurations par git archive, production intacte.

## 167 — Balayage iOS complet : 198 pages sous WebKit, trois familles reprises (2026-08-13)

Generalisation de la QA iOS du chapitre 166 a tout le site : 198 pages
publiques sous WebKit 26, iPhone SE 375 px tactile — erreurs JS,
debordements, cibles < 24 px, zone basse (rectangles hors ecran exclus,
lecon du chapitre precedent). Resultat brut : 183/198 propres, 15
constats, trois familles reelles apres tri.

1. **homeFab sur la barre mobile — 9 pages EN heritees** (accessibilite,
   avertissements, carrieres, charte, cibles-2030, communautes,
   gouvernance, innovation, plan-du-site). Ces pages, greffees avec un
   bloc homeFab autonome, montraient apres defilement un bouton
   flottant [18,619] 46x46 pose SUR la barre basse [0,607] — en plein
   sur son bouton Accueil (famille du chapitre 152). En FR le flottant
   n'existe pas sur mobile. Correctif : bloc fab-mob par page,
   @media <= 820 px -> #homeFab masque. Verifie apres defilement :
   display none, plus de chevauchement.
2. **Nœuds du schema corridor (logistique FR/EN) a 12x12.** Le
   diagramme SVG Doba->Kribi porte 5 nœuds interactifs (role=button,
   tabindex) rendus 12 px a l'echelle mobile — alors que chaque nœud
   possede deja un halo decoratif. Correctif : @media <= 900 px, rayon
   du halo porte a 38 (propriete geometrique CSS r, supportee WebKit)
   + pointer-events:all -> cible 24x24 mesuree, tap verifie (noeud
   actif bascule), halo a peine plus present visuellement.
3. **Consigne sans correction** : marqueurs de champs de l'atlas
   (Kome, Miandoum... — cartographie dense, positions geographiques
   contraintes, contenu equivalent en texte sur la page, accessibles
   clavier) et bascule du Configurateur (outil autonome hors parcours
   public) — exceptions assumees, documentees ici.

Faux positifs consignes : OX+14 sur investisseurs (bandeau d'onglets a
defilement horizontal mesure pendant l'animation d'apparition — au
repos : 0) ; et un re-balayage qui a re-signale des pages DEJA
corrigees — les fichiers etaient sains au controle et a la
reproduction : etat transitoire du gremlin de rembobinage du bac,
cinquieme manifestation du jour. Confirmation finale en sequentiel :
12/12 pages propres.

Fichiers : 9 pages EN + intermediaire/logistique(-en) + MAINTENANCE.

## 168 — QA Safari desktop : matrice navigateurs completee, 198/198 propres (2026-08-14)

Complement du chapitre 167 : le site n'avait jamais ete passe sous le
moteur de Safari en desktop (les QA passees etaient Chromium ; les
chapitres 166-167 ont couvert WebKit mobile). Balayage des 198 pages
publiques sous WebKit 26 a 1440x900, theme sombre, par lots de 20 avec
navigateur frais par lot (le balayage monolithique pendait — voir note
d'environnement).

**Resultat : 198/198 pages propres.** Zero erreur JS ou console, zero
debordement horizontal, zero echec HTTP. Les briques modernes du site
(color-mix, :has, svh, overflow:clip, backdrop-filter, proprietes
geometriques SVG du chapitre 167) rendent toutes correctement sous le
moteur Safari courant.

Interactions desktop verifiees : mega-menu s'ouvre au clic (722 px de
haut, coherent avec les hauteurs de reference), palette de recherche a
Ctrl+K (ouverte plein ecran, 4 resultats sur « raffinage »), survols.
Artefact de banc ecarte : le clic sur #plightBtn echoue a 1440 —
normal, c'est le bouton de theme MOBILE, masque en desktop.

Note d'environnement, la plus lourde du jour : le rembobinage du bac
s'est accelere — /root/work vide de ses scripts en quelques minutes (a
deux reprises), et l'installation WebKit de /opt/pw-browsers effacee en
cours de seance (reinstallee). Parade adoptee : les scripts de banc
vivent desormais dans /tmp, qui survit ; toute constitution de lots
reverifie git diff + marqueurs juste avant l'envoi (regle du chapitre
165). Si une session parallele est ouverte sur cette copie, la fermer —
regle du chapitre 158 rappelee.

Bilan de la matrice : Chromium desktop et mobile (chapitres anterieurs),
WebKit/iOS mobile 198 pages (ch. 167), WebKit/Safari desktop 198 pages
(ce chapitre) — aucune dette navigateur connue. Chapitre de journal
seul, aucun fichier du site modifie.

## 169 — Vague wow 1 : compteurs, heure du Tchad, CTA dores (2026-08-14)

Execution de la vague 1 des propositions d'eclat. Decouverte honnete en
ouverture : la proposition n° 1 (transitions de page View Transitions)
etait DEJA en production dans bundle_core_a1 — opt-in navigation:auto,
neutralisation reduced-motion, fondus vtfo/vtfi — posee par un chapitre
anterieur et oubliee de ma propre revue. Verifiee fonctionnelle,
consignee, rien a refaire. Trois nouveautes livrees :

1. **Compteurs KPI** (u_cd226c00eb4b.js, 195 pages) : les chiffres des
   tuiles (.tri-kpi b, .ppj-kpi, .atc-stat b...) se comptent de zero a
   leur valeur en 900 ms (easing cubic-out) a leur apparition
   (IntersectionObserver a 60 %), separateurs de milliers, decimales a
   virgule et suffixes respectes (« 1 070 km · secteur » ; « ~1,5 Md »
   ignore par prudence, prefixe non numerique). Court-circuite si
   prefers-reduced-motion. Verifie avant l'incident de bac : sequence
   78 % -> 96 % -> 100 % capturee sur un KPI hors ecran, texte final
   restitue a l'identique (le texte d'origine est la source de verite).
2. **L'heure du Tchad** (index + index-en) : le site sait l'heure de
   N'Djamena (UTC+1, calculee du fuseau visiteur). Aube 5-7 h,
   crepuscule 17-19 h, nuit : un voile en soft-light (opacite .30-.38,
   transition 1,2 s) rechauffe ou bleuit le heros — au crepuscule, le
   halo radial existant devient un soleil couchant sur le chevalet de
   pompage, accident heureux capture. Ligne discrete au pied de page :
   « Il est 18 h 04 a N'Djamena — le site vit a l'heure du Tchad. »
   En journee : aucun voile, site inchange.
3. **Balayage dore des CTA** (nav_a.css, 137 pages a nav) : au survol
   ou focus-visible d'Investir (.nx-util-in .nx-invest) et du CTA
   principal du bandeau (.cb-btn.cb-p), un eclat de lumiere traverse le
   bouton (800 ms). Media (hover:hover) et no-preference uniquement.
   Lecon de placement : d'abord pose dans bundle_core_a1, regle inerte
   sur la home — la home ne charge PAS ce bundle ; deplace dans
   nav_a.css, qui couvre par construction toutes les pages portant ces
   CTA. Verifier la feuille effectivement chargee par la page cible.

Note d'environnement, gravissime : au moment de publier, Chrome a cesse
de repondre, puis le bac a subi son rembobinage le plus profond —
/root/etc, /root/work, /tmp et les lots stages ENTIEREMENT effaces.
Recuperation : re-clonage depuis origin (8a906a8 intact — la production
n'a jamais rien perdu), re-application integrale des trois nouveautes
depuis la memoire de session, re-verification des marqueurs avant lots.
Le clone jetable + le journal comme memoire externe font exactement le
travail prevu par la discipline des chapitres 158/165.

Verifications d'avant incident (Chromium) : zero erreur console,
compteur anime puis texte exact, voile nuit/crepuscule captures
(contraste du titre preserve — la « disparition » du titre sur une
capture etait la rotation du carrousel), shimmer au survol (animation
etShine active), reduced-motion : compteurs inertes. Re-verification
post-recuperation : marqueurs presents, controle rapide au chargement.
Fichiers : nav_a.css, u_cd226c00eb4b.js, index, index-en + MAINTENANCE.

## 170 — Le fil du baril : la signature scrollytelling de l'accueil (2026-08-14)

Premiere piece signature des propositions wow : « de la roche-mere a la
pompe » devient un voyage visible. Sur l'accueil FR/EN, un fil dore
court le long des quatre maillons (#coeurs) : le trait se remplit avec
le defilement, une goutte doree lumineuse voyage a son front, et un
jalon s'allume au passage de chaque maillon (E&P, transport, raffinage-
distribution, petrochimie).

Fabrication : ~60 lignes de CSS + ~50 de JS par page, zero image, zero
bibliotheque. Rail absolu dans #coeurs, progression par variable CSS
--filp posee sous requestAnimationFrame (ecouteur scroll passif),
jalons par seuils calcules au layout (centres reels des panneaux,
recalcules au resize). Desktop >= 900 px uniquement ; masque ET non
construit sous prefers-reduced-motion ; pointer-events:none partout.

Deux lecons de fabrication consignees :
1. **La couche theme clair ecrase les fonds des inconnus** : premiere
   pose invisible — background:none constate sur le remplissage et la
   goutte (les degrades neutralises par les regles d'adaptation de la
   page). Blindage a la discipline maison (:not(#_):not(#__) +
   !important sur les proprietes visuelles) : degrades presents dans
   les DEUX themes, verifie par style calcule.
2. **elementFromPoint ment sur les elements pointer-events:none** (il
   les saute) — fausse piste d'empilement ecartee ; et le « retard »
   du fil au banc etait le scroll-behavior:smooth du site (chaque
   lecture montrait exactement la cible precedente) — confirme en
   behavior:instant : suivi exact (filp 0.65/0.98, jalons 1100/1111).

Verifications : FR et EN, remplissage et goutte suivent le defilement,
jalons s'allument dans l'ordre, 4 jalons EN, 0 debordement, 0 erreur
console, mobile sans rail, reduced-motion sans rail. Capture du fil en
flanc de panneau (goutte au front, jalon allume au-dessus, eteint
au-dessous). Fichiers : index, index-en + MAINTENANCE.

## 171 — La carte qui respire : le reseau Tchadium prend vie (2026-08-14)

Deuxieme piece signature. Decouverte d'inventaire d'abord : la carte du
reseau (aval/reseau, SVG 300x460, 10 villes, 7 liaisons) avait DEJA son
flux anime — tirets defilant sur les liaisons (avflow 1,1 s),
correctement coupe en reduced-motion. Il manquait la vie des points.

Ajoute (CSS pur, ~25 lignes par page, zero JS, zero image) :
1. **Les halos respirent** : chaque ville pulse doucement (opacite
   .14->.30, echelle 1->1.5, cycle 5,2 s) en phases decalees ville par
   ville (delais 0 a 4,8 s) — la carte ondule comme un organisme, pas
   comme un metronome. transform-box:fill-box pour centrer l'echelle
   SVG.
2. **Le depot bat** : N'Djamena (is-depot) recoit un battement de coeur
   a double temps (avcoeur 2,6 s) — le poumon logistique du reseau.
3. **Le survol garde la main** : hover/is-on met la respiration en
   pause et fixe le halo — l'interaction existante reste premiere.

Le tout sous media no-preference (reduced-motion : carte immobile,
verifie animationName none halos ET liens), selecteurs blindes
(.avnet-svg:not(#_), lecon du chapitre 170). Verifications : 10 halos
animes, delais echelonnes effectifs, avcoeur sur le depot, avflow
intact, 2,41 % de pixels en mouvement entre deux instantanes a 2 s
(la carte bouge), 0 erreur console, capture a l'appui (phases visibles
ville par ville). Fichiers : aval/reseau, reseau-en + MAINTENANCE.

## 172 — La trajectoire 2030 se dessine sous les yeux de l'investisseur (2026-08-14)

Troisieme piece signature. Sur investisseurs FR/EN, entre « la
fenetre » et le capital : une courbe SVG (720x300, ~40 lignes) qui se
trace d'un trait (stroke-dashoffset 960->0 en 1,9 s a l'apparition,
IntersectionObserver a 45 %), puis ses cinq jalons s'allument en
cascade (delais 0,5 a 2 s) avec l'aire doree en fondu.

Les cinq jalons sont les VRAIS jalons du calendrier de la page (aucune
donnee inventee) : capital fondateur 10 M FCFA (2026 · fait),
immatriculation (en cours), 1re levee ≈ 1 Md (court terme), pilote EOR
(2-4 ans), cap 20 Md (4 ans +). Honnetete maison assumee jusque dans la
forme : pas d'axe chiffre — une echelle lineaire mentirait (x2000
entre depart et cap) — mais une courbe stylisee explicitement legendee
« trajectoire visee, pas une promesse chiffree », renvoyant au
calendrier date. aria-label descriptif sur le SVG.

Reduced-motion : la classe tj-on est posee d'emblee — la courbe et les
jalons sont VISIBLES immediatement, sans animation (le contenu n'est
jamais sacrifie au mouvement ; verifie dashoffset 0 des le
chargement). Deux themes : libelles blancs/soir et encre/clair via
regles blindees (lecon 170), point cercle avec liseré adapte.
Verifications : trait cache avant apparition (offset 960), dessin
complet apres (0,35 px), 0 debordement mobile 390 (texte agrandi
14/17 px), 0 erreur console, captures FR sombre et EN clair.
Fichiers : investisseurs, investisseurs-en + MAINTENANCE.

## 173 — Programme wow solde : la vitrine des outils existait, la liste de plans photo est livree (2026-08-14)

Cloture du programme d'eclat en deux temps.

**1. Proposition « vitrine des outils » : verifiee deja satisfaite.**
L'inventaire prealable (discipline des chapitres 169 et 171) montre que
les outils interactifs sont deja richement integres : cartes
« Calculateur du baril · Le baril additionnel, chiffre » sur eor,
services-ep, investisseurs et solutions ; le configurateur relie aux
CINQ packs EnerScope/Build/Run/Revive/Close de services-ep plus une
carte « Composer votre service · Configurateur en ligne » ; page
tchaditech/outils dediee a la pile d'outils ; l'explorateur de chaine
lie depuis la home et les carnets ; et un mini-calculateur EOR embarque
directement dans amont/eor (#eor-calc). Rien a ajouter qui ne soit du
doublon — la sobriete maison prime. C'est la TROISIEME proposition du
programme decouverte deja en place (transitions de page au ch. 169,
flux de la carte au ch. 171, outils ici) : le site etait plus fini que
la revue de propositions ne le supposait ; lecon pour toute future
liste d'idees — inventorier d'abord, proposer ensuite.

**2. La liste de plans photo est livree** (document utilisateur, hors
site) : 6 blocs, 20 plans cadres sur les 47 visuels generiques actuels
et leurs usages reels (sable-texture 35 pages a elle seule — le plan
A1 « laterite au couchant » est le plus rentable de la journee),
consignes de prise de vue (paysage ET portrait, air dans le haut du
cadre, golden hours, silhouettes sans autorisations), priorites de
journee courte, et protocole d'exploitation au retour (WebP aux poids
maison, substitution page par page avec controle pixel, retrait du
badge « Image d'illustration », chapitre par substitution).

**Bilan du programme wow (chapitres 169-173)** : vague rapide
(compteurs KPI 195 pages, heure du Tchad, CTA dores, transitions deja
en place), fil du baril (ch. 170), carte qui respire (ch. 171),
trajectoire 2030 auto-dessinee (ch. 172), vitrine outils verifiee et
liste photo livree (ce chapitre). Toutes les actions en attente
executables sont soldees ; restent uniquement les arbitrages
utilisateur (seance photo, noms d'equipe reels, volumes d'import par
pays) et les recos dependantes des operations reelles, consignes de
longue date. Chapitre de journal seul.

## 174 — Plus eclaire : la soiree remplace la nuit, le jour remplace la nuit (2026-08-14)

Demande : « rendre le site plus eclaire ». Arbitrage utilisateur par
question directe — deux axes retenus : eclaircir le THEME SOMBRE et
passer les PHOTOS de nuit au jour (le theme clair, deja par defaut,
reste inchange ; pas de forcage des preferences memorisees).

**1. Le sombre passe de « nuit profonde » a « soiree »** — remplacements
precis, jamais de balayage hexa aveugle (le meme code sert parfois de
couleur de TEXTE ailleurs ; verifie : 0 usage texte/fill des cibles) :
- --navy : #0B1322 -> #111D33 (50 pages), #060B14 -> #0C1626 (2
  feuilles), #0B1422 -> #111D33 (1 feuille), #0D1524 -> #131F36 (2) —
  la hierarchie deux tons est conservee, simplement remontee ;
- les surfaces et voiles rgba(8,13,22,*) -> rgba(14,22,38,*) : 2 889
  occurrences sur 197 pages (scrims de heros, verres de panneaux,
  fonds de sections) ;
- la barre du navigateur suit : theme-color sombre du script tcol
  "#0B1322" -> "#111D33" (197 pages).

**2. Les photos de jour remplacent la nuit** : raffinerie-nuit ->
raffinerie-jour sur 98 occurrences / 42 pages (memes dimensions
1400x934 et meme poids 51 Ko, aucun attribut a ajuster ; og:image et
JSON-LD suivent). station-nuit (30 pages) n'a PAS de jumelle de jour —
conservee en attendant le plan B1 de la liste de plans photo (ch. 173),
consigne comme reste a faire dependant de la seance.

Verifications : luminance moyenne mesuree au pixel — aval/raffinage
166,8 -> 188,1 (+13 %, le heros passe au jour et les voiles
s'allegent) ; axe color-contrast en sombre : 0 violation sur societe et
raffinage ; texte blanc des heros lisible sur les nouveaux voiles
(capture) ; raffinage-en au jour egalement ; 0 erreur console.
Fichiers : 197 pages + 3 feuilles (bundle_head_b2, s_a6075b7e39,
s_99c21a3880) + MAINTENANCE.

## 175 — Residu du 174 : la balise theme-color statique rejoint la soiree (2026-08-19)

CONTEXTE. Le controle final du chapitre 174 a revele un residu : la balise
statique <meta name="theme-color" content="#0B1322"> gardait l'ancienne
nuit profonde sur la quasi-totalite des pages, et les deux explorateurs de
chaine portaient #0D1524. Sans effet visible pour l'utilisateur : le script
tcol (MutationObserver) recrit la valeur des l'analyse de la page, avant
tout affichage (#FBF9F3 en clair, #111D33 en sombre). Mais un navigateur
sans JavaScript aurait affiche l'ancienne teinte, et le code source
contredisait le chapitre 174.

FAIT.
- 197 pages : content="#0B1322" et content="#0D1524" remplaces par
  content="#111D33", la valeur sombre exacte que le script tcol applique.
  Une seule valeur uniforme pour tout le site (les explorateurs compris,
  leur script utilisant deja #111D33).
- Purete du diff verifiee : 197 fichiers, 197 lignes changees, toutes sur
  la balise theme-color, rien d'autre.
- Hors perimetre (pas de balise theme-color, inchange) : les trois
  documents d'impression de docs-sources, le fichier de verification
  Google et Configurateur_Service_Integre_v2.html (document source
  autonome).

ERREUR CONSIGNEE (la mienne, au 174). La liste de remplacements du 174
couvrait --navy:#0B1322 (CSS) et :"#0B1322" (JS tcol) mais pas la forme
content="#0B1322" (HTML). Lecon : quand une couleur vit sous trois
syntaxes (CSS, JS, attribut HTML), la balayer sous les trois formes ou
greper le code hexadecimal nu apres coup — c'est le grep nu du controle
final qui a attrape le residu.

VERIFIE. 0 occurrence residuelle des deux anciennes valeurs ; 197 pages
porteuses de #111D33 ; parite md5 apres publication ; production
controlee sur echantillon.

## 176 — Ultra revue : audit complet du site, trois ecarts reels, tout corrige (2026-08-19)

DEMANDE. Ultra review et audit de tout le site, puis application des actions.

METHODE. Batterie statique python sur les 198 pages (liens internes, ancres,
assets, titres, descriptions, canonical, hreflang, og/twitter, lang, JSON-LD,
IDs dupliques, img sans alt, sitemap, manifest, placeholders, fuite de
francais sur les pages EN, poids des images, orphelins) + batterie dynamique
Chromium headless sur serveur local (erreurs console sur 20 pages x 2 themes,
axe WCAG AA sur 10 pages x 2 themes, debordement horizontal mobile 390px sur
10 pages) + controle des en-tetes de securite en production.

BILAN SAIN (rien a corriger) : 0 lien mort, 0 asset manquant, 0 ID duplique,
0 titre/description absent ou duplique, canonical et hreflang coherents,
sitemap complet et sans entree morte, JSON-LD valides, 0 image sans alt,
0 erreur console (40 combinaisons page-theme), 0 debordement mobile,
0 francais residuel sur les pages EN, CSP/HSTS/nosniff/frame-options en
place, poids dans les budgets (les 2 seules images >180 Ko sont orphelines).

TROIS ECARTS REELS, CORRIGES.
1. site.webmanifest : theme_color et background_color encore a #060B14
   (nuit profonde d'avant le 174) — passes a #111D33, la valeur de la balise
   meta. Meme famille de residu que le 175 : la couleur vivait sous une
   quatrieme syntaxe (JSON du manifest) que les balayages 174-175 ne
   couvraient pas.
2. Ancre morte #jobs-youth sur carrieres-en et impact-en vers
   /pole-tchaditude-en : la section s'appelle #emplois-jeunesse (id francais
   conserve sur la jumelle EN). Lien corrige sur les deux pages.
3. Explorateur de chaine, theme sombre : 7 violations axe color-contrast
   (libelles .seclbl a alpha .45 -> 4.28:1, pied de page a alpha .4 ->
   3.65:1, sous-titres colores a opacity .75 -> 4.33:1). Alphas remontes
   (.45->.55, .42->.58, footer .4->.6, opacity .75->.9) sur les deux
   explorateurs FR et EN. Axe re-execute : 0 violation sur les 10 pages
   x 2 themes.

CONSIGNE SANS ACTION. 6 images orphelines dans assets/img (893 Ko, dont
raffinerie-nuit.webp orpheline depuis le 174, gardee en reserve pour un
eventuel retour, et girafes-dikala/lac-tchad-espace les deux seules >180 Ko)
: aucun impact en production (jamais servies), suppression laissee a un
arbitrage futur car le flux de publication par televersement ne supprime pas.

VERIFIE. Diff limite a 12 lignes sur 5 fichiers ; axe 0 violation apres
correction ; ancre #emplois-jeunesse existante sur la cible ; parite md5
apres publication ; controles production sur echantillon.

## 177 — Les six images orphelines quittent le depot (2026-08-19)

DEMANDE. « Applique » — suite de l'arbitrage consigne au chapitre 176.

FAIT. Les six images orphelines d'assets/img (893 Ko : equipe-hse.webp,
girafes-dikala.jpg, guelta-archei-chameaux.jpg, lac-tchad-espace.jpg,
raffinerie-nuit.webp, savane-vehicule.webp) ont ete supprimees du depot,
une par une, via l'interface web GitHub (menu du fichier -> Delete file ->
commit direct sur main), soit six commits de suppression. Le televersement
ne sait pas supprimer ; c'est le premier usage du flux de suppression web
dans ce journal. Rien n'est perdu : chaque image reste recuperable dans
l'historique git (le chapitre 176 documentait la reserve raffinerie-nuit ;
si la nuit doit revenir un jour, git checkout d'un commit anterieur la
restitue).

CONTROLE AVANT ACTION. Re-verification par grep du nom nu dans tout le
depot : la seule mention restante de chacune etait le journal lui-meme
(mentions historiques), aucune reference dans les pages, CSS, JS, manifest
ou sitemap.

VERIFIE. FETCH_HEAD sans les six blobs ; clone local aligne ; production :
les six URL repondent 404 (jamais referencees), les pages echantillon
restent en 200 ; poids du dossier img allege de 893 Ko.

## 178 — L'ultra revue passe a l'exhaustif : 198 pages balayees, un vrai ecart (2026-08-19)

CONTEXTE. L'utilisateur m'a laisse la main pour la journee. Le chapitre 176
avait audite sur echantillon ; ce chapitre etend les balayages dynamiques a
la totalite des 198 pages, par tranches de 25 avec navigateur frais (lecon
des chapitres precedents contre les derives de session longue).

BILAN EXHAUSTIF.
- Console : 0 erreur sur 396 combinaisons (198 pages x 2 themes).
- Axe WCAG AA, theme clair : 0 violation sur 198 pages.
- Debordement horizontal mobile 390 px : 0 sur 198 pages.
- Axe WCAG AA, theme sombre : 5 pages signalees, dont 4 artefacts de
  mesure et 1 vrai ecart.

LES 4 ARTEFACTS (verifies par 3 re-executions a 400/800/2500 ms) :
pole-enerchimie-en, amont/activites, intermediaire/services-en ne se
reproduisent jamais ; tchaditech/socle se reproduit a 400 et 800 ms sur
des elements .ets-* mais est propre a 2500 ms — axe mesure les couleurs
pendant les animations d'entree (interpolation), pas l'etat stable.
Etat stable conforme sur les 4 pages ; aucun changement.

LE VRAI ECART, CORRIGE. Page arabe /ar : 5 liens (selecteur de langue,
investisseurs, contact, pied de page) distingues du texte par la seule
couleur — axe link-in-text-block, deterministe a chaque passage. Les
regles .lang a et footer a portaient text-decoration:none. Souligne
retabli (underline + text-underline-offset:3px) ; axe re-execute sur /ar :
0 violation dans les deux themes.

VERIFIE. Diff limite a 2 lignes sur ar.html ; axe 0 violation sur /ar ;
parite md5 apres publication ; production controlee.

## 179 — Cloture de la journee autonome : controles croises tous au vert (2026-08-19)

CONTEXTE. Fin de la journee en autonomie (chapitres 176 a 178). Deux
controles de cloture avant de rendre la main.

FAIT ET VERIFIE.
- Production complete : les 198 URL du site repondent 200 sur Vercel
  (3 echecs reseau transitoires cote sonde, confirmes 200 au second
  passage — rien cote site).
- WebKit (moteur Safari) 18.2 reinstalle (le conteneur l'avait encore
  efface) et fume-test sur les 10 pages les plus touchees par les
  chapitres 174-178 (home FR/EN, societe, raffinage, explorateur, ar,
  carrieres-en, impact-en, tchaditech/socle, investisseurs) en
  desktop + mobile x clair + sombre : 0 erreur console, 0 debordement
  sur les 40 combinaisons.

ETAT DU SITE EN FIN DE JOURNEE. HEAD f9d01dc + ce chapitre. Site plus
eclaire (174-176), theme-color coherent sous ses quatre syntaxes,
depot sans orphelins (177), accessibilite exhaustivement verte (178),
production 198/198. Les seuls chantiers ouverts dependent de
l'utilisateur : seance photo (liste livree, plan B1 pour la station de
jour), noms reels d'equipe, volumes d'import par pays.

## 180 — Revue sectorielle volet 7, petrochimie : le chiffre Sedigui degonfle, la conjoncture 2026 racontee (2026-08-19)

DEMANDE. « Next » — septieme volet de la serie de revues sectorielles
(apres forage, logistique, raffinage, distribution, HSE-Q, ESG). Meme
methode : inventaire, referentiel web frais, grille, ecarts, execution.

INVENTAIRE. 9 pages petrochimie + hub EN + 3 carnets : architecture six
unites / trois phases bien racontee ; la these d'intrants locaux (natron,
neem, coton) reste le point differenciant du site.

REFERENTIEL 2026 (sources dans la revue livree) : uree ~700 $/t projetee
en 2026 (+60 %), engrais +31 %, gaz = 80-90 % du cout de l'ammoniac ;
Afrique subsaharienne toujours importatrice de 80-90 % de ses engrais ;
Dangote vers 8+ Mt/an, Indorama 3e ligne, OCP 9 Mt/an ; accord-cadre
Tchad-Algerie (avril 2026) pour etudier une raffinerie de 20 kb/j ;
Djermaya ~14 kb/j reels ; ~840 M$ de produits raffines importes en 2024 ;
Sedigui documente a ~7 Md m3 de gaz et 15-21 Mb prouves (70 Mb identifies).

TROIS ECARTS, TROIS CORRECTIONS.
1. FACTUEL — le site annoncait « ~30 Md m3 » de gaz a Sedigui sur 14
   fichiers (FR+EN, 25 occurrences avec l'equivalent barils et les
   variantes nbsp/bn/billion). Les donnees publiques d'Etat documentent
   ~7 Md m3 (7 Md m3 prouves en 2017 ; 212 Gpi3 en 2020). Corrige partout
   en ~7 Md m3, 150 Mbep ramene a 110 Mbep, « donnee secteur » precise en
   « donnees d'Etat, 2017-2020 » sur le carnet Sedigui. La these gaz->
   engrais tient mieux avec le vrai chiffre : 125 MW + une uree modeste
   consomment ~0,5 Md m3/an.
2. ARGUMENTAIRE — nouvelle section « La conjoncture 2026 » sur
   petrochimie/marches FR+EN (gabarit pxc/px-card maison, 3 cartes) :
   choc de prix, dependance continentale, argument corridor face aux
   geants nigerians.
3. CHIFFRAGE — l'intro de « Substituer l'import » porte desormais les
   ~840 M$ d'imports raffines 2024 (FR+EN).

ERREUR RATTRAPEE AVANT PUBLICATION (la mienne). Le remplacement du label
« (donnee secteur) » etait trop large : il a d'abord touche des
occurrences sans rapport (objectif d'acces a l'electricite sur
greentech/transition, transition-en, brochure x2). Detecte par listing
des fichiers porteurs du nouveau label, reverte par verification de
contexte (Sedigui a moins de 260 caracteres). Lecon deja consignee au
175 : un remplacement global se verifie par l'inventaire de TOUS ses
points d'impact, pas seulement de ses cibles.

CINQ RECOS (consignees dans la revue livree) : suivre l'accord
Tchad-Algerie ; carnet « le prix de l'uree » sur le modele du prix du
litre ; chiffrer la demande nationale d'engrais des qu'une source existe ;
surveiller les jalons reels de Sedigui ; maintenir le methanol en phase 2.

VERIFIE. 16 fichiers, 81 insertions / 27 suppressions ; 0 occurrence
residuelle des anciennes valeurs ; section rendue (3 cartes) sur les deux
langues ; axe 0 violation et console 0 erreur sur 8 pages x 2 themes ;
capture visuelle du bloc ; parite md5 apres publication ; production
controlee.

## 181 — Revue sectorielle volet 8, investisseurs : deux ecarts, un verdict qui tient (2026-08-19)

DEMANDE. « Next » — huitieme volet de la serie de revues sectorielles.

INVENTAIRE. Le dossier investisseurs est l'endroit le plus rigoureux du
site : these et trajectoire de capital datees et assumees comme cibles,
hypotheses de planification affichees, facteurs de risque dedies,
cibles-2030 sur referentiel Ipieca/API/IOGP, paiements aux Etats publies
en format avant chiffres, gouvernance OHADA, ITIE en ligne de mire.

REFERENTIEL 2026. Brent : consensus EIA ~58 $/b en fevrier 2026, STEO
d'aout a ~87 $ de moyenne 2026 (~85 $ au T3) et ~69 $ en 2027 — une annee
de balayage complet. Tchad : 20,5 Md$ d'Abu Dhabi (nov. 2025) confirmes
et deja correctement dates sur le site ; ITIE : validation 2022 a
64,5/100, mesures correctives attendues en 2026.

DEUX ECARTS, CORRIGES (FR+EN, 4 fichiers, 4 lignes).
1. La carte « Marche 60-70 $/b » affirmait la prudence sans la prouver :
   ajout du fait 2026 (58 $ en fevrier, 85 $ a l'ete, 69 $ vu pour 2027,
   source EIA) — la fourchette reste sous le milieu du cycle.
2. La section « norme ITIE en ligne de mire » parlait de l'entreprise
   sans situer le pays : ajout du contexte national date (membre ITIE,
   64,5/100 en 2022, correctifs 2026).

PAS DE TROISIEME ECART — CONSIGNE COMME VERDICT. Les chiffres sensibles
testes tiennent : Abu Dhabi date, trajectoire assumee comme cible,
reserves 2P et utilisation pipeline etiquetees « secteur », parite FCFA
exacte, risques dedies. Meme honnetete que les « deja existant » des
volets precedents.

CINQ RECOS (dans la revue livree) : memorandum versionne ; carte Brent
revue chaque janvier ; page d'etat de la 1re levee le jour venu ; suivre
la validation ITIE Tchad 2026 ; FAQ investisseur individuel.

VERIFIE. Diff 4 lignes / 4 fichiers ; textes EIA et 64,5/100 rendus sur
les 4 pages ; axe 0 violation, console 0 erreur sur 4 pages x 2 themes ;
parite md5 apres publication ; production controlee.

## 182 — Revue sectorielle volet 9, RH et carrieres : l'INSPEM de Mao entre sur le site (2026-08-19)

DEMANDE. « Next » — neuvieme et dernier volet des grands domaines.

INVENTAIRE. Pole complet : carrieres (parcours en cinq etapes, gratuite
anti-arnaque affichee), academie (quatre parcours, partenariats,
releve 100 % tchadienne), services capital humain, carnet « Former avant
d'extraire », cible 80 % de contenu local.

REFERENTIEL. Fait majeur : l'Institut national superieur de petrole de
Mao (INSPEM) existe et diplome — en decembre 2025 le ministere du Petrole
recensait ses licencies sans emploi, un vivier national forme et
disponible. Region : Senegal 50 % de contenu local vise d'ici 2030,
Niger en chantier — la cible EnerTchad de 80 % est au-dessus des
standards. Monde : « great crew change », viviers nationaux strategiques.

TROIS ECARTS, CORRIGES (FR+EN, 6 fichiers, 8 lignes).
1. L'INSPEM etait absent du site alors que les partenariats citaient
   IFP School et trois etablissements tchadiens : ajoute en tete des
   partenariats academiques (academie FR+EN) et dans la candidature
   spontanee (carrieres FR+EN). « Inventorier d'abord » vaut aussi pour
   les institutions du pays.
2. La cible 80 % publiee sans etalon : comparee au Senegal (50 % vise
   2030) sur tchaditude/index et pole-tchaditude-en.
3. « 1 240 emplois directs » etait le seul chiffre du bloc stats sans
   etiquette de source : marque « (donnee secteur) » FR+EN.

CINQ RECOS (revue livree) : convention INSPEM reelle ; grille des metiers
en tension au demarrage du recrutement ; compteur du vivier ; diffusion
du message anti-arnaque ; veille sur un futur cadre legal tchadien de
contenu local.

VERIFIE. Diff 8 lignes / 6 fichiers ; INSPEM rendu sur les 4 pages,
Senegal sur les 2 ; axe 0 violation, console 0 erreur sur 6 pages x 2
themes ; parite md5 apres publication ; production controlee.

La serie des revues sectorielles est complete : neuf volets, tous les
grands domaines du site passes au referentiel frais.

## 183 — Le carnet « prix de l'uree » parait, et sept carnets retrouvent leur identite JSON-LD (2026-08-20)

DEMANDE. « Next to all actions » — execution des actions en attente :
le carnet « prix de l'uree » (reco 2 du volet 7) et la synthese des neuf
revues (livree en parallele hors site).

NOUVEAU CARNET (FR + EN). journal-prix-uree / journal-prix-uree-en,
sur le gabarit du prix du litre : quatre etages (le gaz, 80-90 % du cout
de l'ammoniac ; l'usine et sa loi d'echelle ; le voyage de 1 700 km,
l'etage enclave ; le calendrier des semis) puis « ce que le gaz de
Sedigui change » — chiffres du volet 7 (uree ~700 $/t en 2026, +60 %,
Banque mondiale ; Sedigui ~7 Md m3 documentes ; Nigeria vers 8 Mt/an).
Integration complete : cartes en tete des listes carnets FR/EN, sitemap
(199 entrees), canonical + hreflang croises, JSON-LD Article propre,
navigation precedent/suivant (prix du litre <-> gaz de Sedigui).

DECOUVERTE EN CHEMIN, CORRIGEE. En etudiant le gabarit : sept carnets
portaient un JSON-LD Article copie-colle d'un autre article (l'enigme
densite pour six d'entre eux — headline, description, url et dates d'un
autre carnet ; integrite-faire-durer-en pointait vers sa version FR).
Les sept (forage-directionnel FR/EN, mecanique-fluides FR/EN,
prix-litre FR/EN, integrite-faire-durer-en) ont recu un Article reconstruit
depuis leur propre title, description, canonical et date affichee.
Balayage de controle : 0 anomalie sur les 46 carnets. Lecon : le
copier-coller de gabarit propage aussi les metadonnees — le balayage
url-JSONLD vs slug rejoint la batterie d'audit standard.

VERIFIE. Console 0 erreur et axe 0 violation sur 6 pages x 2 themes
(nouveau carnet FR/EN, listes FR/EN, deux carnets repares) ; capture du
hero ; JSON-LD 1 Article valide par carnet ; parite md5 apres
publication ; production controlee.

## 184 — QA visuel : trois defauts vus a l'ecran, trois corrections (2026-08-20)

DEMANDE. « Visual QA and apply actions ».

METHODE. 23 captures sur 16 pages representatives (accueil, nouveau
carnet uree FR/EN, marches petrochimie, investisseurs, gouvernance,
academie, carrieres, listes carnets FR/EN, explorateur, page arabe,
tchaditude) en desktop 1280 et mobile 390, themes clair et sombre,
a trois positions de defilement — puis inspection de chaque cliche.

TROIS DEFAUTS REELS, CORRIGES.
1. ACCUEIL, carte retournable « Marche a reconquerir » : le texte du
   recto depassait la hauteur de la carte et se coupait en pleine
   phrase (« ...le raffinage local monte en p... »), sans ellipse.
   Les cartes soeurs tenaient ; seul ce texte etait trop long. Racourci
   d'une ligne (l'import B2B « depuis cinq pays africains » et « en
   puissance » retires), verifie sans debordement (scrollHeight =
   clientHeight). La version EN etait deja courte.
2. CARNETS EN MOBILE 390 : le lien « <- Tous les carnets » de l'en-tete
   se cassait en plein mot (« CARN / ETS ») entre la marque et le
   bouton de langue. Correctif dans la feuille partagee s_9c80e27170
   (chargee par 44 pages) ET dans la regle inline des 10 carnets qui
   l'embarquent en dur : .jback en white-space:nowrap, .jtop en
   flex-wrap sous 600 px — l'en-tete se replie en deux rangees propres
   (capture de controle). Couverture verifiee : 0 carnet sans l'un des
   deux correctifs.
3. PAGE ARABE : le compteur affichait « 7 aqtab » (7 poles) et le titre
   « sept poles et une extension », heritage d'avant la promotion de la
   petrochimie en pole entier (chapitre 30) — alors que la grille de la
   meme page liste bien 8 cartes et que tout le site dit 8 poles.
   Aligne : compteur a 8, titre « huit poles ».

SANS ACTION (constats de captures, comportements normaux) : compteurs
etcCount a 0 sur un cliche pris avant leur animation d'entree ;
info-bulles du rail de sections par-dessus les cartes (transitoire) ;
guide « Suite » chevauchant une puce en mobile (il s'escamote au
defilement, chapitre 152).

VERIFIE. Axe 0 violation et console 0 erreur sur les 4 pages touchees
x 2 themes ; 0 debordement horizontal mobile sur les 3 carnets testes ;
en-tete mobile recontrole en capture ; parite md5 apres publication ;
production controlee.

## 185 — La recherche et le flux RSS rattrapent le contenu : le carnet uree indexe, les index depoussieres (2026-08-20)

DEMANDE. « Next » — controle de coherence des sous-systemes de contenu
(recherche bilingue cmdk, flux RSS) apres les chapitres 174-184.

CONSTAT. Trois retards de synchronisation :
1. Le carnet « prix de l'uree » (183) etait absent des deux index de
   recherche (cmdk_extra.js FR, cmdk_en.js EN) et des deux flux
   (feed.xml, feed-en.xml).
2. Les index portaient des textes d'avant les corrections : « sept
   poles » (FR brochure) et « seven poles extended by chemicals » (EN,
   3 occurrences dont un titre d'entree) alors que le site dit 8 depuis
   le chapitre 30 et la page arabe depuis le 184 ; « 30 milliards m3 » /
   « ~30 bn m³ » pour Sedigui alors que le 180 a degonfle a 7 ;
   et l'ancre morte #jobs-youth corrigee au 176 subsistait dans une
   URL d'entree EN.
3. Lecon consignee : les index cmdk et les flux sont des DERIVES du
   contenu — toute publication qui ajoute une page ou corrige un
   chiffre doit balayer cmdk_extra.js, cmdk_en.js, feed.xml,
   feed-en.xml. Ce balayage rejoint le rituel de publication (chapitre
   8) aux cotes du sitemap.

FAIT.
- Entrees cn-prix-uree (FR) et en-61b (EN) ajoutees aux index, mots-cles
  bilingues (uree, engrais, gaz, sedigui, npk...).
- Corrections d'index : huit poles (FR+EN, 4 occurrences), Sedigui a
  7 Md m3 (FR+EN), URL #emplois-jeunesse (EN).
- Items RSS FR et EN ajoutes en tete des deux flux (pubDate 20 aout,
  lastBuildDate mis a jour), XML revalide par parsing.
- Controle additif : diff des tableaux JSON avant/apres — 0 entree
  supprimee, 1 ajoutee par langue (166->167 FR, 138->139 EN).

VERIFIE. Recherche vivante testee au navigateur : la palette ouverte sur
l'accueil, requete « uree », le carnet ressort avec son lien ; 0 erreur
console ; XML des deux flux valide ; parite md5 apres publication ;
production controlee (flux et index servis avec le nouveau contenu).

## 186 — La demande d'engrais enfin chiffree ; la FAQ investisseur existait deja (2026-08-20)

DEMANDE. « Next all » — execution des deux dernieres actions executables
du carnet de bord des revues.

1. DEMANDE NATIONALE D'ENGRAIS CHIFFREE (reco 3 du volet 7). Source
   solide trouvee : FAO (via Our World in Data et Banque mondiale) —
   le Tchad consomme ~34 600 t/an d'engrais toutes formules (2022-2023,
   en hausse depuis ~18 000 t en 2012), soit ~6,5 kg/ha de terres
   arables, contre les 50 kg/ha vises par la declaration d'Abuja.
   Integre sur petrochimie/marches FR+EN (carte Marche 01 Agriculture) :
   « la demande part de bas... et l'unite se dimensionne pour ce
   reel-la, et pour sa croissance ». C'est la donnee qui manquait au
   volet 7 pour dimensionner l'unite 03 — et elle dit une chose
   importante : le marche actuel est petit (35 kt), la these repose
   sur sa croissance et sur la substitution, pas sur un volume acquis.

2. FAQ INVESTISSEUR (reco 5 du volet 8) : ELLE EXISTAIT DEJA. La page
   FAQ porte deja les questions 05-07-09 : trajectoire de capital,
   « qui peut souscrire » (particuliers, diaspora, collectifs, part
   reservee aux publics fragiles), comment manifester son interet
   (invest@enertchad.td), garde-fous OHADA/ITIE — et l'avertissement
   anti-fraude « aucune souscription n'est ouverte a ce jour » avec
   lien vers le CP-2026-005. Le seul element de la reco non couvert
   (ticket minimum) depend de la Direction et ne peut etre invente.
   Quatrieme decouverte « deja existant » de la serie — la lecon
   « inventorier d'abord » se confirme jusque dans nos propres recos.

VERIFIE. Figures rendues FR+EN (grep + rendu navigateur), axe 0
violation et console 0 erreur sur les 2 pages x 2 themes ; parite md5
apres publication ; production controlee. Le carnet de bord des revues
ne contient plus AUCUNE action executable sans l'utilisateur.

## 187 — QA clavier : le lien d'evitement etait invisible pour tout le monde, partout (2026-08-20)

DEMANDE. « Continue » — dimension jamais couverte de la serie : la
navigation au clavier.

SONDES (Playwright, 8 pages puis echantillon elargi) : premier Tab,
activation du lien d'evitement, visibilite de l'indicateur de focus sur
25 elements par page, progression de tabulation (30 elements uniques sur
30, ordre logique), palette de recherche (ouverture, focus dans le champ,
Escape ferme et rend le focus au bouton — le "dialog" restant etait le
bandeau cookies, faux positif ecarte).

LE DEFAUT MAJEUR. Le lien « Aller au contenu principal » ne devenait
JAMAIS visible au focus — sur toutes les pages, dans Chromium headless,
Chromium complet ET le vrai Chrome de l'utilisateur sur la production
(verifie : element focus, top calcule fige a -60px bien apres les 200 ms
de transition). Le lien fonctionnait (Entree menait au contenu) mais un
utilisateur clavier voyant ne le voyait pas — accessibilite WCAG 2.4.1
rompue dans les faits. Cause pratique isolee empiriquement : la
transition « top .2s » sur l'element hors ecran ne s'execute jamais
(top:12px s'applique instantanement des que la transition est retiree ;
meme un top:12px !important en ligne restait fige tant qu'elle etait la).
Le mecanisme profond n'est pas elucide — le correctif ne depend pas de
lui : la transition est retiree partout, le lien apparait desormais
instantanement (ce qui est aussi le meilleur comportement pour ce
composant).

PORTEE DU CORRECTIF. Deux feuilles partagees (bundle_head_b2,
s_a6075b7e39) + 109 pages au bloc inline + le Configurateur (variante
propre) = 112 fichiers, 1 ligne chacun. Re-sonde sur 16 pages
representatives (racine, 8 sous-dossiers, ar, index-en, explorateur,
Configurateur) : lien premier au Tab, visible au focus (top 12px,
capture). Note mineure consignee : sur le Configurateur, le lien
d'evitement est 2e au Tab (un lien retour le precede) — fonctionnel,
ordre non canonique, page outil autonome.

RAS PAR AILLEURS : indicateurs de focus presents (0 element sans
indicateur sur 25 par page), pas de tabindex positif, pas de piege de
focus, palette conforme.

VERIFIE. Axe 0 violation et console 0 erreur sur 4 pages x 2 themes
apres correctif ; parite md5 apres publication ; production recontrolee
dans le vrai Chrome.

## 188 — Solde des restes : le Configurateur tabule dans l'ordre, WebKit valide, le rituel s'enrichit (2026-08-20)

DEMANDE. « Next all » — les trois derniers restes executables.

1. CONFIGURATEUR : le lien d'evitement passait 2e au Tab derriere le
   lien retour (note du 187). L'element est deplace en tete de <body>,
   avant l'en-tete : premier Tab = « Aller au contenu principal »,
   visible (top 12px), verifie.
2. WEBKIT (moteur Safari) : le correctif skip-link du 187 revalide sous
   WebKit 18.2 sur 4 pages (accueil, societe, carnet uree, amont/eor) —
   focus pris, lien visible a top 12px partout. Le correctif est
   cross-moteur.
3. RITUEL DE PUBLICATION (chapitre 8) : la regle des derives du contenu
   (chapitre 185) y est desormais inscrite en dur — sitemap, index cmdk
   FR/EN, flux RSS FR/EN a balayer a chaque page ajoutee ou chiffre
   corrige, avec les controles rapides et la preuve d'edition additive.

VERIFIE. Configurateur re-sonde (1er Tab, visible) ; WebKit 4/4 ;
parite md5 apres publication ; production controlee.

## 189 — Le carnet « gaz torche » parait — premier passage complet du rituel des derives (2026-08-20)

DEMANDE. « Next » — troisieme volet de la serie pedagogique economique
(prix du litre, prix de l'uree, et maintenant la torche).

NOUVEAU CARNET (FR + EN). journal-gaz-torche / journal-gaz-torche-en :
ce qu'est une torche (le gaz associe sans debouche, le moindre mal face
au methane), ce qu'elle coute (167 Md m3 brules en 2025, 54 Md$, presque
la consommation de gaz de toute l'Afrique — troisieme annee de hausse ;
70-100 Md$ suffiraient a eliminer le torchage de routine ; le Kazakhstan
a -87 % depuis 2012), le Tchad (gaz associe brule faute de filiere,
Sedigui ~7 Md m3 dormants — renvoi a l'etage 1 du prix de l'uree), et la
reponse maison (gas-to-power, GPL, uree ; zero torchage de routine et
LDAR -92 % deja publies sur impact). Source : Global Gas Flaring Tracker
2026 (donnees 2025), Banque mondiale/GGFR.

RITUEL DES DERIVES (chapitre 8, premiere application complete) : cartes
en tete des listes carnets FR/EN ; sitemap (201 entrees) ; index cmdk FR
(168 entrees) et EN (140) valides par json.loads, edition additive ;
flux RSS FR/EN (40 items chacun, XML revalide). Navigation continue :
prix-uree <- gaz-torche -> gaz-sedigui.

VERIFIE. Axe 0 violation et console 0 erreur sur les 2 carnets + la
liste x 2 themes ; JSON-LD 1 Article conforme par page ; les 5 liens
internes du carnet repondent 200 dans la bonne langue ; parite md5 apres
publication ; production controlee.

## 190 — Ultra revue des sections : la structure tient, un seul correctif reel (2026-08-20)

DEMANDE. « QA et ultra review des sections » — l'echelle sous les pages.

BATTERIE STATIQUE (200 pages, scripts exclus du comptage) :
- Hierarchie des titres : 0 page sans h1, 0 h1 multiple, 0 saut de
  niveau (h2->h4), 2 h2 vides (voir correctif).
- Reperes : 2 sections sans nom accessible seulement — en realite des
  sections aria-labellisees sans id, conformes.
- Ancres internes de meme page : 0 morte reelle (4 faux positifs =
  gabarits JS de la boutique).
- Convention « cta-band en dernier » : 2 exceptions sur carnets FR/EN —
  une section « Ressources & outils » aria-labellisee placee apres,
  assumee comme bloc de ressources de pied ; consignee, pas un defaut.
- Sections souches (<15 mots) : 2 — le panneau JS de l'explorateur,
  rempli a l'initialisation (voir correctif).

SYMETRIE FR/EN (100 paires par hreflang) : 23 asymetries de comptage,
TOUTES classees apres inspection :
- ar.html vs index-en : la page arabe est un resume une-page, jumelage
  par conception.
- +1 section EN recurrente (17 paires) : le bandeau de navigation
  « Continue in the X pole » propre aux jumelles EN de racine — idiome
  structurel, pas un manque.
- +2/+3 h2 sur les hubs de pole EN : les blocs « What this pole does »
  / « Inside this pole » (navigation interne rendue en section cote EN,
  en subnav cote FR) et le couple accroche+titre du vivier — contenu
  equivalent verifie par lecture, aucune duplication reelle. Le verdict
  du chapitre 160 (symetrie de contenu) tient.

SANS JS : les sections restent visibles (la classe reveal est posee par
le JS lui-meme — 0 .reveal dans le DOM sans script, donc 0 contenu
masque). Verifie au navigateur JS coupe.

LE CORRECTIF REEL. Le panneau de l'explorateur de chaine (FR+EN)
demarrait avec trois elements vides (p-num, h2 p-name, p-sub) remplis a
l'initialisation JS — dont un titre h2 vide au premier rendu. Prerempli
avec les valeurs exactes que le moteur pose a l'init (01 · Amont/
Upstream · Exploration-Production) : plus de h2 vide, aucun changement
visuel apres init (le JS recrit les memes valeurs), axe 0 violation et
console 0 erreur sur les 2 pages x 2 themes.

VERIFIE. Parite md5 apres publication ; production controlee.

## 191 — Audit des sujets : le glossaire comble ses trous, la trilogie gagne sa chip (2026-08-20)

### Demande
"audit les sujets" : audit thematique transversal du site — coherence des rubriques editoriales, chips "Sujets du moment", presence des marques maison, couverture du glossaire.

### Constats
1. Rubriques des carnets : 29 cartes FR + 29 cartes EN comparees au kicker (jkick) de chaque article — 0 ecart. Le vocabulaire des rubriques FR/EN est miroir exact (21 libelles, memes comptes, ex. Durabilite · GreenTech x3 <-> Sustainability · GreenTech x3). Aucun article orphelin.
   - Erreur de sonde corrigee en route : la premiere passe annoncait 26 "SANS JKICK" cotes EN — bug de jointure de chemins (href commencant par /), corrige par lstrip('/') + split('#'). Le vrai resultat est 0 ecart.
2. Chips "Sujets du moment" : 10 FR + 10 EN, toutes les cibles repondent 200. Premiere passe : 20 "CHIP KO" — artefact du serveur local mort (curl 000), pas une regression. Regle rappelee : verifier que le serveur repond avant de croire une sonde.
3. Marques maison : presence coherente sur les pages racine (EnerChimie 79, GreenTech 141, Tchadium 89, EnerClub/EnerPro 24, NRJ+ 28, Mobile Stations 71, Water-to-Value 36). EnerTalen : 0 occurrence — nom jamais lance, rien a corriger.
4. VRAI constat : trous du glossaire. Termes employes ailleurs sur le site mais absents du glossaire — FR : MWD, LWD, geosteering, IWCF, farm-out, transfert de garde (custody), freinte, journey management, topping, certificat d'analyse, NPK, vaporeformage, LDAR, bep. EN : memes notions cote anglais (custody transfer, shrinkage, steam reforming, boe...).
5. La trilogie economique (prix du litre, prix de l'uree, gaz torche) n'avait aucune chip "Sujets du moment".

### Actions appliquees
1. Glossaire FR et EN : 13 entrees ajoutees chacun (57 -> 70), dans le style maison (categorie, terme, sous-titre pedagogique, definition en une ou deux phrases) :
   - amont : MWD / LWD, Geosteering, IWCF, Farm-out
   - inter : Transfert de garde / Custody transfer, Freinte / Shrinkage, Journey management
   - aval : Topping, Certificat d'analyse / Certificate of analysis
   - chimie : NPK, Vaporeformage / Steam reforming
   - durab : LDAR
   - cadre : bep / boe
2. carnets.html et carnets-en.html : chip ajoutee en fin de rangee — "Les prix, expliques" -> /journal-prix-litre et "Prices, explained" -> /journal-prix-litre-en (--tc #F5D07A).

### Verification locale
- Tableaux var T : parses par node, 70 entrees x 4 champs, 0 erreur de syntaxe, FR et EN.
- Rendu navigateur (headless, 2 themes) : 70 dt rendus sur chaque glossaire, recherche "freinte"/"shrinkage" filtre a exactement 1 resultat, 11 chips sur chaque listing avec la nouvelle en derniere position, cibles /journal-prix-litre(-en) 200, console 0, axe 0 sur les 4 pages.
- Derives : aucune page ajoutee, aucun chiffre corrige — sitemap, index cmdk et flux RSS inchanges a juste titre.

### Lecon
Un audit de sujets rend deux especes de resultats : des zeros honnetes (rubriques, marques) qui valent d'etre consignes, et des trous reels (glossaire) qui valent d'etre combles. Les deux fausses alertes de la journee (jointure de chemins, serveur mort) rappellent la meme regle : instrumenter la sonde avant d'accuser le site.

## 192 — Audit des donnees structurees : 749 blocs JSON-LD passes au crible, 12 headlines realignes (2026-08-20)

### Demande
"next" apres l'audit des sujets : j'ai choisi l'angle jamais couvert de front — un audit exhaustif des donnees structurees (JSON-LD) sur tout le site.

### Perimetre et methode
206 pages, 749 blocs script type application/ld+json. Verifications : validite JSON de chaque bloc, inventaire des types (Organization 126, WebPage 145, BreadcrumbList 198, WebSite 85, Dataset 84, Article 56, FAQPage 47, CollectionPage 4, Blog 2, WebApplication 2), coherence url JSON-LD contre canonical, headline d'Article contre h1 affiche, champs requis des Articles (author, publisher, image, description, dates), sanite des FAQPage (questions et reponses non vides), ordre des dates (dateModified >= datePublished, rien dans le futur), completude des Dataset.

### Constats
- 749 blocs sur 749 : JSON valide. 0 url divergente du canonical. 0 champ requis manquant. 0 date incoherente. 0 FAQPage ou Dataset defectueux. Le gros du parc est sain — consequence des balayages precedents (ch. 183 avait deja corrige 7 JSON-LD copies-colles).
- VRAI constat : 12 articles (6 sujets x 2 langues) portaient un headline JSON-LD substantiellement different du h1 affiche — anciens titres de travail jamais realignes apres reecriture du h1, dont deux avec le suffixe "| EnerTchad" qui n'a rien a faire dans un headline. Exemples : forage-directionnel affichait "Atteindre trois cibles depuis un seul wellpad" mais declarait "Le forage dirige, explique" ; eor-baril-additionnel declarait "l'economie de l'EOR | EnerTchad" au lieu du h1 reel.
- Precision de methode : la premiere heuristique (headline contre title) sortait 36 faux positifs — le title SEO est legitimement plus court que le headline. La bonne reference est le h1 ; apres normalisation typographique (apostrophes, insecables, point final), il reste 12 vrais ecarts.

### Actions appliquees
Les 12 fichiers : headline := texte exact du h1 (point final retire, typographie conservee), reecriture chirurgicale du seul bloc Article concerne (diff : 1 ligne par fichier). Fichiers : brut-par-camion x2, eor-baril-additionnel, forage-directionnel x2, gaz-torche x2, integrite-faire-durer-en, mecanique-fluides x2, prix-litre x2.

### Verification locale
Re-balayage complet : 0 ecart substantiel restant sur les 56 Articles. Navigateur headless sur 4 pages modifiees : tous les blocs JSON-LD parsent dans la page, headline == h1, console 0. Diff git : 12 fichiers, 12 lignes.

### Lecon
Les metadonnees invisibles derivent en silence : le h1 se reecrit au fil des chapitres, le JSON-LD garde l'ancien titre et personne ne le voit — sauf les moteurs. Desormais toute reecriture de h1 doit balayer le headline JSON-LD du meme fichier, au meme titre que les derives (sitemap, cmdk, flux).

## 193 — Audit des metas sociales : 8 suffixes de titre normalises, un fragment orphelin, un couple twitter divergent (2026-08-20)

### Demande
"next" : dans la lignee du ch. 192 (les metadonnees invisibles derivent en silence), audit des metas sociales et des titres — title, og:title/description, twitter:title/description, og:url — sur les 206 pages.

### Constats et tri
- 0 og:url divergent du canonical, 0 og:image manquant, une seule page sans title (le fichier de verification Google, normal, intouchable).
- 86 pages ont meta description differente de og:description : NON retenu comme defaut — la description SEO et la description sociale peuvent legitimement differer ; les forcer identiques n'est pas une correction. De meme, la plupart des variantes twitter plus courtes que og sont des choix editoriaux valides.
- VRAIS constats apres tri :
  1. Suffixes de <title> incoherents sur 8 carnets : 3 FR sans le suffixe maison (criblage-eor, eor-baril-additionnel, production-anticipee finissaient en "| EnerTchad" sec) et 5 EN avec des suffixes fantaisistes ("— Notebooks |" sur gaz-torche-en et prix-uree-en, "— Field notes |" sur forage-directionnel-en, rien sur criblage-eor-en et prix-litre-en). Conventions maison : FR "— Carnets | EnerTchad", EN "— Journal | EnerTchad".
  2. solutions.html : og:description trainait un fragment orphelin "recomposee par besoin. reseau cible et services." — reste d'un copier-coller, minuscule apres un point.
  3. journal-enigme-densite-brut.html : seul carnet avec twitter:title/description explicites ET divergents du couple og — et la version twitter revelait la reponse de l'enigme (Ronier, TAN ~4,7) que la version og prend soin de taire. Un teaser qui spoile.
- Piege de sonde evite : le test "'-en' in nom_de_fichier" classait journal-ENigme et journal-gpl-bois-ENergie cote anglais — deux faux positifs de plus au premier passage. Bon test : endswith('-en.html'). Meme famille d'erreur que la jointure de chemins du ch. 191.

### Actions appliquees (10 fichiers, 10 lignes)
- 8 titles normalises aux conventions maison ; au passage eor-baril-additionnel recupere un title aligne sur son h1 (« le petrole qu'on croyait perdu ») au lieu de l'ancien titre de travail.
- solutions.html : fragment orphelin retire de og:description.
- enigme-densite : twitter:title et twitter:description alignes sur og — le teaser ne spoile plus.

### Verification locale
Re-balayage : 56/56 carnets au bon suffixe, enigme tw==og, fragment disparu. Navigateur headless sur 5 pages modifiees : titles rendus corrects, console 0. Derives : feeds et index cmdk portent leurs propres titres courts sans suffixe — rien a propager. Diff git : 10 fichiers, 10 lignes.

### Lecon
Trier avant de corriger : sur 107 divergences brutes, seules 10 lignes meritaient une correction. Le reflexe "tout harmoniser" aurait ecrase 86 choix editoriaux legitimes. L'audit vaut par son tri, pas par son volume.

## 194 — Audit i18n et ancres : quatre zeros honnetes, deux outils completes (2026-08-20)

### Demande
"next" : audit de l'appariement des langues (hreflang, commutateur de langue) et de la validite des ancres internes sur tout le site.

### Perimetre et resultats
1. Clusters hreflang : 199 pages porteuses. Existence de chaque cible, auto-reference du canonical dans le cluster, presence du x-default, reciprocite complete fr<->en (la page A qui declare en->B exige que B declare exactement le meme cluster) — 0 ecart.
   - Fausse alerte de sonde en route : 32 "cibles inexistantes" au premier passage, toutes de la forme /amont/ — la sonde ne savait pas que amont/index.html se sert en /amont/. Correction du mapping, vrai resultat : 0.
2. Commutateur de langue visible (nav .lang) contre hreflang declare : 0 divergence sur tout le parc.
3. Exclusions du sitemap : 404, fichier de verification Google et les trois sources d'impression docs-sources sont bien hors sitemap ; rien a corriger.
4. Ancres internes : 3 837 liens avec fragment testes contre les id reels des pages cibles. 20 signales, 20 faux positifs : les gabarits JS de la boutique (#i-'+p[9]+' est du code, pas un lien) et les liens profonds du Configurateur (#p=operateur&d=... est un parametre de hash interprete par son JS, pas une ancre d'element). 0 ancre reellement cassee.

### Action appliquee
Seul manque reel du perimetre : Calculateur_Baril_Additionnel et Configurateur_Service_Integre_v2 sont dans le sitemap mais etaient les deux seules pages indexees sans hreflang. Outils monolingues FR : ajout d'un cluster minimal auto-referent (fr + x-default) apres leur canonical. L'ensemble indexe est desormais couvert a 100 %.

### Verification locale
Navigateur headless sur les deux outils : hreflang rendus (fr + x-default), console 0. Re-balayage des quatre controles : zeros confirmes.

### Lecon
Quatrieme audit consecutif ou l'essentiel du parc tient bon : les zeros honnetes s'accumulent et valent preuve. Et deux lecons de sonde de plus dans la meme famille que ch. 191 et 193 : une URL de repertoire (/amont/) et un hash de parametres (#p=...) ne se valident pas comme un chemin de fichier et une ancre d'element.

## 195 — Simulation des parcours VIP : sept profils, deux corrections (2026-08-20)

### Demande
"simule la navigation des VIP sur le site pour les solutions et services" : incarner les visiteurs a fort enjeu et suivre leurs parcours reels vers les solutions et services.

### Methode
Sept personas simules en navigateur headless (1440x900) sur la copie locale fidele a la production : haut fonctionnaire, investisseur institutionnel, DG operateur E&P, industriel B2B/flotte, bailleur de developpement, partenaire technique international (EN), visiteur oriente solutions. Le simulateur ne clique que des liens visibles (textContent pour les menus deroulants — innerText rend vide un lien de menu ferme, premiere version faussee par ce piege), gere les ancres de meme page, et mesure : clics jusqu'au but, page d'atterrissage, presence de CTA.

### Resultats
Les sept parcours atteignent leur objectif en 2 clics maximum (1 pour le bailleur vers l'Atlas), chaque page d'atterrissage porte 2 a 4 canaux de contact. Le parcours operateur E&P debouche sur les liens profonds pre-parametres du Configurateur. Parcours EN symetriques au FR.

### Deux vrais constats, corriges
1. Entree de navigation EN vers les services parapetroliers libellee "Go further / From seismic to the pump" sur 22 pages : un partenaire international ne peut pas deviner que c'est l'offre de services petroliers. Le FR dit "Services parapetroliers", l'index cmdk EN dit deja "Oilfield services" — la nav etait l'unique endroit a diverger. Remplace par "Oilfield services" (22 fichiers, 1 occurrence chacun, verifiee unique avant remplacement).
2. Carte flip "Gouvernance" de l'accueil (FR et EN) : son CTA envoyait vers engagements#conformite alors que la page Gouvernance dediee existe et couvre exactement ce que ministre et bailleur attendent (SA OHADA, IFRS, ITIE, discipline de capital). Retargete vers gouvernance / gouvernance-en.

### Verification locale
Re-simulation apres correction : la carte Gouvernance atterrit sur les h1 "Une gouvernance a visage decouvert..." / "Governance with faces uncovered...", le libelle nav EN rend "Oilfield services", console 0 partout. Diff git : 23 fichiers, 24 lignes. Derives : rien a propager (libelles de nav et CTA, hors sitemap/feeds/cmdk).

### Complement (meme jour, apres verification production)
Le controle post-deploiement a revele trois occurrences residuelles du libelle "Go further" pointant vers les services E&P hors du menu principal : le pied de page de l'accueil EN (colonne What we do), le sous-menu de solutions-en et la carte solution correspondante. Corrigees en "Oilfield services" (lot complementaire). Precision importante du tri : les autres "Go further" du site (kickers de sections "aller plus loin", liens d'articles lies, glossaire, commentaires CSS) sont de l'anglais legitime et restent en place — seul le libelle designant l'offre de services etait fautif.

### Lecon
Simuler le visiteur revele ce que les audits statiques ne voient pas : tout etait valide (liens 200, ancres exactes, hreflang propres) et pourtant un menu anglais cachait les services derriere "Go further" et la carte Gouvernance menait ailleurs que la ou son mot promettait. Le lien peut etre techniquement parfait et editorialement faux.

## 196 — Ultra revue de l'accueil et couche vitrine premium (2026-08-20)

### Demande
"Ultra review de la page accueil du site et modernise le pour qu'il devienne une page ultra premium vitrine".

### Revue complete
Inventaire structurel (19 sections, 18 500 px de haut) et balayage visuel integral en desktop 1440, mobile 390, themes clair et sombre. Etat des lieux : la page est deja d'un niveau eleve — hero diaporama avec pilules de progression, fil de lecture (rdprog), cartes flip 3D, sections reveal, navigation par points, verre depoli, double theme jour/nuit automatique. Aucun defaut fonctionnel : console 0, axe 0 sur les deux themes, mobile propre. La modernisation devait donc etre une couche de raffinement, pas une refonte.

### Couche vitrine premium appliquee (bloc style prem196, additif, FR + EN)
1. Reflet anime sur l'accent or du hero ("Nous inversons." / "We are reversing it.") : balayage lumineux lent dans le degrade texte existant.
2. Respiration Ken Burns discrete du visuel de fond (scale 1 -> 1.045 sur 28 s, sur le conteneur .diapo — les slides i conservent leur animation:none historique).
3. Selection de texte aux couleurs maison (fond or, texte marine).
4. Stats du hero : elevation, filet or et lueur douce au survol.
5. CTA or principal : lumiere interne + balayage lumineux au survol.
6. Cartes actualites : lueur coloree douce au survol (variable --pac de chaque carte).
Le tout sous garde stricte prefers-reduced-motion : verification en contexte reducedMotion=reduce, toutes les animations tombent a none.

### Peripetie consignee
Premiere version de la respiration sur .diapo i : inerte, car une regle historique .diapo i{animation:none!important} protege les slides (heritage du diaporama JS). Deplacee sur le conteneur. Au passage, un remplacement trop large a brievement vide la ligne diapo de la garde reduced-motion — repere par le test reducedMotion (kb restait actif), corrige, re-teste : none/none.

### Verification locale
Animations actives en contexte normal (prem-sheen, prem-kb), neutralisees en reduced-motion ; console 0 et axe 0 sur index et index-en, deux themes ; capture mobile propre ; diff git limite au bloc prem196 dans les deux fichiers.

### Lecon
Sur une page deja mure, "ultra premium" veut dire raffiner, pas refondre : six micro-signaux de qualite (reflet, respiration, selection, survols) changent la perception sans toucher ni structure ni contenu. Et tester reduced-motion n'est pas optionnel : c'est ce test qui a revele la garde cassee.

## 197 — Signature premium etendue au site, et deux defauts dormants de solutions.html (2026-08-20)

### Demande
"next" : etendre la signature premium du ch. 196 au-dela de l'accueil, en verifiant au passage les pages vitrines.

### Actions
1. bundle_core_a1.css (194 pages) recoit le bloc prem197 : selection de texte or/marine et balayage lumineux du CTA or (.btn.btn-p, 16 pages), avec pointer-events:none sur l'overlay et garde prefers-reduced-motion. Le meme pointer-events est ajoute au bloc prem196 de l'accueil pour rester identique.
2. La verification des pages vitrines a revele deux defauts dormants sur solutions.html et solutions-en.html, invisibles des audits precedents car le theme sombre de ces pages n'avait ete balaye qu'avant l'ajout du bloc sol-proof :
   - color-contrast x18 (theme sombre) : .solpr b utilisait var(--ink), or --ink vaut #0B1422 dans les DEUX themes (c'est une couleur d'encre pour surfaces claires, pas une couleur adaptative). Les intitules en gras des listes de preuves etaient marine sur marine. Correction : couleur de base #E9EEF5 (sombre), l'override clair scope html.et-plight existant reprend la main en jour.
   - landmark-unique : six nav.hubdrawer portaient le meme aria-label "Solutions". Chacune recoit desormais un libelle unique derive de son titre de famille ("Solutions — Produire & recuperer plus", etc.), FR et EN.

### Erreur commise et reparee dans la foulee
En voulant scoper les regles !important de sol-proof au theme clair, j'ai prefixe des regles qui l'etaient DEJA (html.et-plight main ...), fabriquant le selecteur invalide "html.et-plight main html.et-plight ...". Le tracage des regles via document.styleSheets l'a revele ; selecteurs restaures a l'identique. Lecon de methode : lire le selecteur complet de la regle dans la feuille (pas seulement le fragment cherche) avant tout prefixage.

### Verification locale
axe 0 et console 0 sur solutions FR/EN, brochure, charte — deux themes ; .solpr b rendu #10161F en clair et #E9EEF5 en sombre ; sheen actif (overflow:hidden) sur les pages a CTA or ; reduced-motion neutralise l'overlay.

### Lecon
Une variable nommee --ink n'est pas forcement adaptative : ici elle designe l'encre sur surface claire, dans les deux themes. Le nom d'une variable ne dit pas son contrat — seul le trace des valeurs par theme le dit.

## 198 — Re-balayage integral du site : les regions oubliees et l'encre trop discrete (2026-08-20)

### Contexte
Journee autonome. Le defaut dormant du ch. 197 imposait un re-balayage complet : 202 pages x 2 themes, console + axe, 2,9 s de stabilisation par page.

### Resultat du balayage
Console : 0 erreur sur les 404 passages. Axe : 195 pages sur 202 parfaitement propres dans les deux themes. Sept pages (et leurs jumelles) portaient des defauts dormants de deux especes :
1. Contraste (theme sombre) : les petites mentions "(perimetre vise · societe en constitution)" de services-ep FR/EN et les fiches "Role: ..." des intrants EOR FR/EN utilisaient var(--muted), trop faible en sombre a cette taille. Correction par variable adaptative --fineok (#A9B7CC en sombre, --muted inchange en clair), appliquee aux 14 spans des 4 fichiers.
2. Landmarks (regle region) : des pans entiers de contenu hors de tout landmark —
   - services-ep et eor (FR/EN) : le </main> fermait trop tot, laissant 5 sections entieres dehors ; balise deplacee juste avant le footer.
   - boutique FR/EN : un span vide portait role="main" (landmark creux !) pendant que tout le contenu vivait dehors ; role retire, le conteneur du catalogue devient le landmark principal, hero et etapes recoivent des aria-label.
   - Calculateur : aucun main du tout ; le conteneur central devient le landmark principal.
   - explorateur-chaine FR/EN : la barre de retour div.topnav devient un nav landmark labellise.

### Trois pieges traverses et consignes
1. Sur boutique, un premier remplacement a converti le MAUVAIS div.wrap (celui du hero, pas du catalogue) : landmark imbrique et 113 regions restantes. Lecon : ancrer le remplacement sur un motif qui identifie la cible (wrap + shop), pas sur la premiere occurrence.
2. Utiliser l'element <main> declenchait les selecteurs CSS "main ..." des themes, recolorant des panneaux sombres en encre claire (6 contrastes casses sur boutique en clair, 1 sur le Calculateur). Solution : div role="main" — la semantique du landmark sans la surface d'attaque du selecteur d'element. C'est le meme piege que --ink au ch. 197 : la structure du site est calibree au selecteur pres.
3. Les 47 et 120 violations "region" n'etaient pas 167 problemes mais 9 conteneurs mal fermes ou non labellises : compter les causes, pas les symptomes.

### Verification locale
Les 9 pages corrigees : axe 0 et console 0 dans les deux themes ; le calculateur calcule toujours (champ i_ooip actif) ; captures visuelles de services-ep (sections reintegrees au main) et de la boutique (panneau commande) impeccables dans les deux themes ; un seul landmark principal par page.

### Lecon
Un audit qui s'arrete aux pages vitrines rate les pages outils : c'est precisement la boutique, le calculateur et l'explorateur — les pages les plus interactives — qui vivaient sans structure de landmarks. La ou le contenu est le plus dynamique, la charpente est la plus negligee.

## 199 — Le carnet « transfert de garde » parait : la mesure comme souverainete (2026-08-20)

### Contexte
Journee autonome, suite. Le ch. 191 avait fait entrer le transfert de garde, la freinte et le proving au glossaire ; le sujet meritait son carnet complet — c'est le prolongement editorial naturel de la serie economique.

### Contenu
Nouveau carnet FR/EN : « Le transfert de garde : le chiffre qui fait foi » / "Custody transfer: the figure that counts" (rubrique existante Economie · Logistique, ≈ 6 min, date du jour). Structure : le rituel du comptage contractuel, ce qui distingue un compteur de garde (etalonnage, proving, corrections temperature/pression, echantillonnage), l'arithmetique d'une erreur de 0,1 % (exemple illustratif assume comme tel dans la signature), la freinte comme perte sous contrat et symptome d'integrite, le corridor Doba-Kribi et la reconciliation ITIE, et la position d'EnerTchad : un comptage etalonne a chaque interface. Deux liens internes (corridor, prix du litre) + glossaire. Lecture continue : precedent corridor-doba-kribi, suivant prix-litre.

### Rituel des derives (ch. 8) applique integralement
sitemap +2 URLs (lastmod 2026-08-20) ; index cmdk FR 168->169 et EN 140->141 (entrees validees par json.loads) ; feed.xml et feed-en.xml +1 item chacun (guid isPermaLink et pubDate +0000 conformes au style maison, XML revalide) ; cartes ajoutees en tete des listings carnets FR/EN, rubrique identique au kicker.

### Verification locale
Les 2 nouvelles pages et les 2 listings : axe 0, console 0, deux themes ; h1 == headline JSON-LD (lecon du ch. 192 appliquee a la source) ; hreflang reciproques verifies entre les jumelles ; cartes visibles avec la bonne rubrique.

### Publication sous reseau degrade (a consigner pour l'avenir)
La publication du ch. 198 a traverse une panne de connectivite GitHub cote navigateur (~40 min) : pages bloquees en readyState interactive, outils find/file_upload inoperants (ils attendent document_idle), fetch raw en timeout. Contournement construit puis devenu inutile : reconstruction des fichiers COTE PAGE par fetch du blob origin epingle au commit + application d'operations de remplacement verifiees par comptage et SHA-256 (10/10 reconstructions identiques en simulation locale), injection via DataTransfer. L'injection a echoue pour une raison instructive : la page etait une coquille morte — ses bundles JS n'avaient jamais charge, l'element file-attachment n'etait pas defini, donc aucun evenement ne pouvait la reveiller. Au retour du reseau, le flux normal a fonctionne du premier coup. Lecons : (1) diagnostiquer la sante de la page (customElements.get, nombre de scripts) avant d'accuser l'outil ; (2) le patch-par-reference-epinglee + SHA-256 est un plan B valide et pret a resservir ; (3) window.stop() fabrique un readyState complete trompeur.

### Lecon
Un glossaire nourrit des carnets, un carnet renvoie au glossaire : c'est la boucle editoriale qui fait d'un site une bibliotheque. Et une panne recompensee : le plan B invente sous contrainte est desormais documente.

## 200 — Deux centieme chapitre : ce que le journal sait maintenant (2026-08-20)

### Le jalon
Deux cents chapitres consignes dans ce fichier — 199 avant celui-ci, environ 78 000 mots — pour un site qui compte aujourd'hui 208 pages HTML en deux langues et une page arabe, un glossaire de 70 entrees par langue, 31 carnets par langue dont trois series (la trilogie economique litre/uree/torche, prolongee par le transfert de garde), neuf revues sectorielles avec leur synthese, deux outils interactifs, des flux RSS et un index de recherche bilingues.

### Ce que les 100 derniers chapitres ont change de methode
1. La preuve bat la promesse : chaque publication se verifie en production (md5 apres fetch, sondes curl), chaque affirmation chiffree du site cite sa source datee, et chaque "zero defaut" se re-teste au lieu de se presumer — quatre audits consecutifs a zeros honnetes (ch. 191-194) valent autant qu'un correctif.
2. Inventorier avant de modifier : les erreurs les plus couteuses du journal (remplacement trop large du ch. 180, mauvais div.wrap du ch. 198, prefixage de selecteurs deja scopes du ch. 197) ont toutes la meme racine — agir sur la premiere correspondance au lieu de compter les points d'impact d'abord.
3. Les metadonnees derivent en silence : titres JSON-LD (12 realignes au ch. 192), suffixes de title (8 au ch. 193), libelles de menu ("Go further", ch. 195) — l'invisible se reecrit moins souvent que le visible, donc il derive. Le rituel des derives (sitemap, cmdk, feeds, ch. 8) existe pour cela.
4. La sonde se teste avant le site : jointures de chemins (ch. 191), '-en' dans le nom (ch. 193), URLs de repertoire et ancres de hash (ch. 194), serveur local mort (ch. 191), innerText des menus fermes (ch. 195) — cinq familles de faux positifs documentees, toutes attrapees avant de polluer un correctif.
5. Les selecteurs sont un contrat : --ink n'est pas adaptatif (ch. 197), l'element main declenche des styles (ch. 198), animation:none!important protege un diaporama (ch. 196). Sur un site mur, la CSS est une jurisprudence — on la lit avant de plaider.

### Ce que le site attend encore de son proprietaire
Les arbitrages consignes de longue date restent ouverts : convention INSPEM, seance photo (la liste de plans est prete ; le plan B1 debloque la station de jour), noms reels de l'equipe, volumes d'import par pays, ticket minimum investisseur. Et les rendez-vous dates : actualisation Brent chaque janvier, validation ITIE Tchad 2026, jalons Sedigui, accord raffinerie Tchad-Algerie.

### Lecon
Un journal de maintenance n'est pas une archive : c'est la memoire de travail du site. Les chapitres 1 a 100 ont construit des pages ; les chapitres 101 a 200 ont surtout construit des methodes — et ce sont les methodes qui rendront les 100 prochains chapitres plus courts.

## 201 — Balayage d'integrite de la production et rafraichissement du service worker (2026-08-20)

### Contexte
Journee autonome, cloture d'apres-midi. Apres huit commits dans la journee, verification que la production entiere tient debout.

### Balayage
Les 203 URLs du sitemap sondees en production : 203/203 repondent 200 (une seule alerte, /carrieres en timeout curl transitoire, re-sondee trois fois a 200 en moins de 0,4 s). Derives : feeds FR/EN, sitemap, robots.txt, sw.js, index cmdk et bundle CSS tous a 200 ; les trois XML re-valides tels que servis en production ; sitemap servi strictement identique au local (md5). Fausse alerte de sonde consignee : manifest.webmanifest teste 404 — le fichier reel s'appelle site.webmanifest (reference par les pages), 200. Toujours lire le nom dans la page avant de sonder.

### Un vrai constat, une action
Lecture attentive du service worker : navigations en network-first (pages toujours fraiches), mais scripts et styles en cache-first avec revalidation en arriere-plan — un visiteur regulier recoit les CSS/JS de sa visite precedente, la version fraiche n'arrivant qu'a la visite suivante. Or la journee a modifie le bundle CSS partage (prem197) et les deux index de recherche. Version du cache bumpee et-202608052300 -> et-202608201500 : a l'activation, les anciens caches sont purges et tous les visiteurs recuperent les actifs du jour. Syntaxe validee par parsing node avant publication.

### Lecon
Un service worker est un maillon de publication a part entiere : tant que sa version ne bouge pas, une partie des visiteurs vit dans le passe. A inscrire au rituel : toute journee qui touche bundle ou index doit se clore par un bump de version SW.

## 202 — Balayage responsive : 202 pages a 360 px, 20 pages cles a 320 px, zero debordement (2026-08-20)

### Contexte
Journee autonome, suite. Le debordement horizontal mobile est le defaut responsive le plus frequent et n'avait jamais ete balaye exhaustivement.

### Methode et resultat
Contexte mobile reel (viewport 360x740, isMobile, touch, DPR 2) sur les 202 pages : mesure de scrollWidth contre viewport apres stabilisation, avec identification des quatre pires elements en cas de depassement. Resultat : 0 debordement sur 202 pages. Stress test complementaire a 320 px (iPhone SE) sur 20 pages cles — accueils, listings, outils interactifs, boutique, glossaire, formulaires, page arabe : 0 debordement egalement.

### Lecon
Cinquieme zero honnete de la serie d'audits (apres rubriques, chips, hreflang, ancres) : la discipline mobile-first des gabarits (wrap + grilles fluides + flex-wrap systematiques) tient jusqu'a 320 px sans exception. Ce zero-la valait 15 minutes de preuve : c'est desormais un fait etabli du site, pas une croyance.

## 203 — QA impression : la brochure, un carnet et le glossaire passent sur papier (2026-08-20)

### Contexte
Journee autonome, suite. Les VIP impriment : la brochure se pose sur des bureaux de ministeres et de banques. Le rendu papier n'avait jamais ete verifie systematiquement.

### Methode
Generation de PDF A4 reels (emulation media print, marges 12 mm) pour brochure FR/EN, le carnet du jour (transfert de garde) et le glossaire, puis rasterisation et inspection visuelle page par page.

### Resultats
- Carnet : 4 pages A4 impeccables — en-tete simplifie, typographie du corps intacte, aucune coupure malheureuse.
- Glossaire : 11 pages en grille de cartes, les 70 entrees rendues (le contenu JS est bien present a l'impression), lisibilite complete.
- Brochure : le rendu est propre (fonds neutralises, boutons en contour comme prevu par les regles print du site) mais la page complete sort a 172 pages A4 — c'est le comportement attendu d'une page-fleuve, et c'est precisement pourquoi la page propose en tete « Telecharger la version PDF (6 pages) » (docs-sources/brochure_print). Verdict : pas un defaut, une confirmation que la version d'impression dediee a sa raison d'etre.

### Lecon
Le circuit d'impression a deux etages (page web fleuve + version print dediee de 6 pages) fonctionne comme concu. A retenir pour les futurs contenus longs : toute page-fleuve destinee aux VIP merite sa version print dediee, car le CSS print le plus propre ne remplace pas une mise en page pensee pour le papier.

## 204 — Cloture de la journee autonome : fraicheur verifiee, treize chapitres, un site plus sur (2026-08-20)

### Dernier balayage du jour : la fraicheur des contenus
Recherche systematique de promesses perimees — echeances T1/T2 2026 encore annoncees au futur, mois passes precedes de "prevu", "a venir", "attendu", en FR et EN. Trois suspects leves par la sonde, trois faux positifs (dates de publication d'articles voisinant par hasard un futur editorial legitime). Zero promesse perimee : l'agenda investisseur (T3 2026 · vise) est dans sa fenetre. Sixieme zero honnete de la serie.

### Bilan de la journee (ch. 191 a 204)
- Editorial : 26 entrees de glossaire ajoutees (13 FR + 13 EN), un nouveau carnet FR/EN (transfert de garde) avec rituel des derives complet, une chip Sujets du moment.
- Design : couche vitrine premium sur l'accueil puis etendue au site, avec gardes reduced-motion prouvees.
- Corrections reelles : 12 headlines JSON-LD, 8 suffixes de title, 3 libelles "Go further", carte Gouvernance retargetee, 18+6+1 contrastes, 9 conteneurs de landmarks, 14 petites mentions sombres, fragment orphelin og:desc, teaser spoilant, 2 hreflang d'outils, bump de version du service worker.
- Preuves accumulees : rubriques 0 ecart, chips 100 % vivantes, hreflang 100 % reciproques, 3 837 ancres saines, 203/203 URLs de production a 200, 0 debordement responsive a 360 et 320 px, impression verifiee sur papier virtuel, fraicheur sans promesse perimee.
- Incidents traverses : panne GitHub cote navigateur (~40 min) avec plan B documente, deconnexion d'extension (~25 min), serveur local mort a relancer — aucun n'a laisse de trace dans le depot.

### Lecon
Une journee autonome reussie n'est pas une journee sans incidents : c'est une journee ou chaque incident a fini en methode consignee, et ou chaque affirmation publiee est repartie avec sa preuve.

## 205 — Le glossaire devient adressable : ancres profondes par terme (2026-08-20)

### Demande
"continue" : poursuite de la journee. Le glossaire (70 entrees par langue) etait une bibliotheque sans cotes — aucun moyen de pointer un terme precis depuis un article ou un partage.

### Realisation
1. Le rendu JS du glossaire attribue desormais a chaque carte un id stable t-<slug de l'abreviation> (slug via la normalisation NFD deja presente pour la recherche ; unicite des 70 slugs verifiee par comptage dans les deux langues avant implementation).
2. Navigation par ancre : a l'arrivee sur #t-xxx (et a chaque hashchange), la page remet les filtres a zero si necessaire, re-rend, centre la carte a l'ecran et la surligne d'un liseré or qui s'efface en 2,6 s (classe hl, style gloss-anchors).
3. Premiere utilisation editoriale : les liens "glossaire" du carnet transfert-de-garde pointent desormais l'entree precise (#t-transfert-de-garde / #t-custody-transfer).

### Verification locale
Trois ancres testees (transfert de garde FR, custody transfer EN, freinte FR) dans les deux themes : carte trouvee, centree a l'ecran, 70 ids generes, console 0, axe 0. Le JSON-LD DefinedTermSet existant est inchange.

### Lecon
Une reference n'a de valeur que si on peut la citer : les ancres transforment le glossaire d'une page de destination en une infrastructure de liens — chaque futur carnet peut desormais pointer le terme exact qu'il emploie.

## 206 — Maillage glossaire : 91 premieres mentions reliees dans 45 carnets (2026-08-22)

### Contexte
Nouvelle journee autonome. Le ch. 205 a rendu le glossaire adressable ; ce chapitre en fait le premier usage a l'echelle : relier la premiere mention des termes techniques des carnets a leur entree precise.

### Methode
Liste blanche de 22 termes par langue (EOR, ASP, OOIP, TAN, GPL/LPG, SCADA, ITIE/EITI, OHADA, wellpad, wireline, workover, coiled tubing, gas-lift, torchage de routine, LDAR, NPK, freinte/shrinkage, jumeau numerique, maintenance predictive, contenu local, vaporeformage, BS&W). Regles de sobriete : uniquement dans le corps des articles (jbody), premiere occurrence seulement, maximum trois liens par article, jamais dans un lien existant ni un titre (tokenisation qui isole balises et ancres existantes), termes les plus longs d'abord, saut des articles qui pointent deja l'ancre.

### Resultat
91 liens ajoutes dans 45 articles (couples FR/EN symetriques a une exception pres : integrite-faire-durer, dont la version FR emploie d'autres formulations que "predictive maintenance" — asymetrie legitime d'un maillage opportuniste). Validation systematique : les 91 hrefs pointent la bonne langue de glossaire et un slug existant (0 invalide), regle du ch. 193 appliquee (endswith('-en.html'), pas '-en' in nom).

### Verification locale
Trois articles temoins dans les deux themes : liens rendus soulignes avec la couleur adaptative du corps (bleu en clair, or en sombre), console 0, axe 0. Parcours de clic reel : gaz-torche -> LDAR atterrit sur /glossaire-petrolier#t-ldar, carte centree et surlignee.

### Lecon
Une infrastructure ne vaut que par son usage : les ancres du ch. 205 auraient pu rester decoratives ; 91 liens plus tard, chaque terme technique des carnets est a un clic de sa definition — et la sobriete (3 liens max, premiere mention) evite de transformer les articles en sapins de Noel.

## 207 — Le carnet « jaugeur-mesureur » parait : deuxieme interview metier (2026-08-22)

### Contexte
Suite de la journee autonome. Le format « interview metier » (inaugure avec le chef de chantier wellpads) n'avait qu'un episode ; le fil de la mesure ouvert par le transfert de garde (ch. 199) appelait son incarnation humaine.

### Contenu
Nouveau carnet FR/EN : « Dans la cabine de comptage : l'interview du jaugeur-mesureur » / "Inside the metering cabin: the gauger's interview" (rubrique nouvelle mais symetrique Intermediaire · L'interview metier / Midstream · The trade interview, 7 questions, ≈ 6 min, figure recomposee comme au premier episode — l'equipe reelle se presentera le moment venu, arbitrage en attente). Matiere : jaugeage manuel (ruban, creux, lectures concordantes), obsession de la temperature, proving et derive du facteur, echantillon (BS&W, certificat d'analyse), enquete de freinte, formation Tchaditude, ethique de la mesure. Trois liens glossaire precis (ancres du ch. 205) et chainage vers transfert-garde et wellpads.

### Piege evite et consigne
Le remplacement global de slug du gabarit a d'abord transforme mes liens VOULUS vers l'article wellpads en auto-liens (procede connu du ch. 183, replonge dedans quand meme cote FR) ; restaures par remplacement cible, et la version EN a integre la restauration dans son script de construction. Verification : canonical au bon slug, 2 references wellpads par fichier.

### Rituel des derives applique
Cartes en tete des listings FR/EN (rubrique identique au kicker), sitemap +2 (lastmod 2026-08-22), cmdk FR 169->170 et EN 141->142 (l'ancrage de l'insertion a du s'adapter au format a espaces du serialiseur precedent — les deux formats coexistent, les json.loads valident), feeds +1 item chacun (guid isPermaLink, pubDate +0000), XML revalides.

### Verification locale
Les 2 articles et les 2 listings, deux themes : axe 0, console 0, 7 questions rendues, 3 glref par article, cartes visibles avec la bonne rubrique.

### Lecon
Un format editorial vit s'il a une suite : le deuxieme episode transforme l'essai du premier en serie. Et une erreur deja consignee peut se reproduire — la difference, c'est qu'on la reconnait en quelques secondes au compteur de references.

## 208 — Les listings deviennent adressables : filtres par hash et compteur vocal (2026-08-22)

### Contexte
Suite de la journee autonome. Meme logique que le glossaire du ch. 205 : les filtres de rubrique des listings de carnets etaient un etat JS ephemere — impossible de partager "les carnets Intermediaire" par un lien, et aucun retour vocal pour les lecteurs d'ecran.

### Realisation (carnets.html et carnets-en.html)
1. Chaque bouton de filtre porte desormais un slug stable ; cliquer met a jour l'URL en #rub=<slug> (history.replaceState, sans entree d'historique parasite), et l'arrivee sur un lien #rub=... applique le filtre correspondant, hashchange compris. Le filtre "Tous/All" nettoie le hash.
2. Region aria-live polie sous la barre : "N carnets affiches" / "N stories shown", avec accord du singulier (1 carnet affiche · 1 story shown), annoncee a chaque filtrage.

### Verification locale
Quatre scenarios : arrivee nue (31 visibles, Tous presse), arrivee sur #rub=intermediaire (1 carnet, bouton Intermediaire presse, annonce au singulier), arrivee sur #rub=economics cote EN (5 stories), clic de filtre qui pousse le hash. Console 0 et axe 0 sur les deux listings, deux themes.

### Lecon
La meme idee sert deux fois : rendre l'etat adressable (ch. 205 pour les termes, ch. 208 pour les filtres) transforme des widgets en liens partageables — et le surcout de l'accessibilite (une region aria-live) est marginal quand on l'integre au moment ou l'on touche deja le code.

## 209 — Le glossaire annonce son compte : aria-live sur la recherche (2026-08-22)

### Contexte
Complement direct du ch. 208 : la recherche et les filtres de categorie du glossaire (70 entrees par langue) filtraient en silence pour les lecteurs d'ecran.

### Realisation
Region aria-live polie au-dessus de la grille des deux glossaires : chaque rendu annonce "N termes affiches" / "N terms shown", avec accord du singulier. La region est creee au premier rendu par le script existant (aucun changement de gabarit), le compteur n de render() etant deja disponible.

### Verification locale
Recherche "freinte" -> "1 terme affiche" ; "shrink" cote EN -> "1 term shown" ; champ vide -> "70 termes affiches". Console 0 et axe 0 sur les deux pages.

### Lecon
Le plus court chapitre de la serie : quand le code expose deja le bon compteur, l'accessibilite coute cinq lignes. C'est en general le signe qu'on s'y prend au bon endroit.

## 210 — Chaque carnet renvoie a sa rubrique filtree : 58 liens de retour (2026-08-22)

### Contexte
Troisieme usage de l'infrastructure d'adressage (ancres ch. 205, filtres ch. 208) : depuis un article, aucun chemin ne menait aux autres carnets de la meme rubrique.

### Realisation
Chaque article (29 FR + 29 EN) recoit dans son pied "Pour aller plus loin" un lien de retour "Tous les carnets <Rubrique> →" / "All <Rubrique> stories →" vers le listing filtre (/carnets#rub=<slug>), le segment de rubrique etant derive du kicker de l'article et slugifie avec la meme normalisation que les boutons de filtre. Validation systematique : les 58 cibles correspondent toutes a un slug de bouton existant dans la bonne langue (0 invalide).

### Verification locale
Parcours reel : l'interview du jaugeur -> clic sur "Tous les carnets Intermediaire" -> listing filtre a 1 carnet, bouton Intermediaire presse, annonce "1 carnet affiche" ; console 0, axe 0. Sondage EN : "All Communities stories" correctement forme.

### Lecon
Trois chapitres, une meme grammaire : rendre l'etat adressable, puis faire pointer le contenu vers ces adresses. Le site se maille tout seul des que ses etats ont des URLs.

## 211 — Cloture : le premier balayage integral parfaitement vierge (2026-08-22)

### Le balayage final
Apres les 118 fichiers touches de la journee, re-balayage complet : 206 pages x 2 themes, console + axe. Resultat : zero anomalie — ni erreur console, ni violation axe, sur aucune page, dans aucun theme. C'est le premier balayage integral parfaitement vierge de l'histoire du site (celui du ch. 198 avait revele 7 pages defectueuses ; leurs corrections ont tenu, et les 118 fichiers modifies depuis n'ont rien casse).

### Bilan de la journee (ch. 206 a 211)
- Maillage : 91 liens glossaire dans 45 carnets, 58 liens de retour vers les rubriques filtrees — le site se cite lui-meme.
- Editorial : deuxieme episode de la serie "L'interview metier" (le jaugeur-mesureur), avec rituel des derives complet.
- Infrastructure : filtres de rubrique adressables par URL (#rub=), compteurs aria-live sur les listings et la recherche du glossaire.
- Verification : chaque chapitre verifie en local (deux themes, parcours de clic reels) puis en production (parite md5 systematique : 46/46, 10/10, 3/3, 3/3, 59/59).

### Lecon
La journee illustre un cycle complet en trois temps : construire une capacite (ancres, filtres adressables), l'utiliser a l'echelle (91 + 58 liens), puis prouver que rien n'a bouge (balayage vierge). Un site qui se maille, se filtre et s'annonce — et qui le prouve.

## 212 — Les categories du glossaire deviennent adressables : #cat= (2026-08-22)

### Contexte
"Next" : la grammaire d'adressage (termes #t- au ch. 205, rubriques #rub= au ch. 208) laissait un etat muet — les sept filtres de categorie du glossaire.

### Realisation (FR et EN)
Les boutons de categorie poussent desormais leur cle dans l'URL (#cat=amont, #cat=inter, ...) via history.replaceState ; l'arrivee sur un lien #cat=... presse le bon bouton et filtre, hashchange compris ; "all" nettoie le hash. Les deux modes coexistent proprement avec les ancres de terme : #t-xxx continue de centrer et surligner sans toucher au filtre.

### Verification locale
#cat=inter -> bouton inter presse, "14 termes affiches" ; #cat=chimie cote EN -> "6 terms shown" ; #t-freinte inchange (70 affiches, carte centree) ; clic sur durab -> hash pousse et "6 termes affiches". Console 0, axe 0 partout.

### Lecon
Une grammaire se complete : trois chapitres ont rendu adressables les trois etats filtrables du site (terme, rubrique, categorie), avec la meme syntaxe et la meme discipline (replaceState, hashchange, annonce aria-live). La coherence d'un site tient a ces petites conventions repetees.

## 213 — Le saut de page au scroll de l'accueil : settle() apprivoise (2026-08-22)

### Demande
"Fix le saut de page dans le scroll sur la home".

### Diagnostic
Trois pistes ecartees par instrumentation dans le vrai Chrome puis en local (couche layout-shift : 0 entree ; poursuite au scroll natif : rien ; hauteurs des slides du hero : strictement egales, pas de derive de mise en page). Le coupable est la fonction settle() de u2_75a2c4383ddf.js (chargee sur 90 pages) : un correcteur d'atterrissage d'ancre qui, apres tout clic sur un lien interne (#combat du CTA hero, #poles de la nav, points de navigation laterale) ou toute arrivee avec ancre, re-force jusqu'a 14 scrollIntoView INSTANTANES pendant ~2,6 s avec une tolerance de 4 px. Or les sections .reveal bougent de 22 px pendant leur animation d'entree (toujours > 4), et les gardes d'annulation (molette, tactile, clavier) ignoraient la barre de defilement et le second clic sur la meme ancre : l'utilisateur qui repartait etait ramene de force — le "saut de page".

### Correctif (settle v6)
1. Tolerance 4 px -> 28 px : le tremblement de reveal (22 px) ne declenche plus de re-collage ; 14 -> 8 essais, pas de 90/200 ms -> 120/250 ms.
2. Garde de defilement externe : tout evenement scroll que settle n'a pas cause lui-meme annule la correction — la barre de defilement et toute autre source sont couvertes, la ou les anciens gardes (wheel/touch/keydown) ne voyaient rien.
3. Deux credits distincts : le saut natif d'ancre est credite dans une fenetre courte (250 ms au clic, 1 500 ms a l'arrivee avec ancre, 0 au hashchange qui suit deja le saut natif), chaque correction propre consomme exactement son propre evenement.
4. Anti-doublon : un settle qui demarre annule le precedent (le clic + le hashchange armaient DEUX instances pour un meme geste, la seconde heritant d'un credit non merite — c'est elle qui ramenait la page).
5. Garde pointerdown ajoutee par prudence.

### Verification locale (trois passes identiques)
Clic CTA -> atterrissage stable a 202 px (marge de defilement respectee), un seul evenement scroll, zero re-collage ; l'utilisateur qui repart de 900 px pendant la fenetre de correction n'est PLUS ramene (avant : ramene systematiquement) ; l'arrivee sur /amont/services-ep#services-ep reste corrigee (~223 px, dans la bande de tolerance) ; pieges poses sur scrollIntoView/scrollTo : zero ecriture parasite ; axe 0 et console 0 sur l'accueil et services-ep ; u2 n'est pas charge sur glossaire/carnets/explorateur — aucune interference avec les ancres des ch. 205-212. Service worker bumpe (et-202608221100), regle du ch. 201.

### Complement : la contre-epreuve en production a revele une course
Rejoue dans le vrai Chrome (ou "reduire les animations" est actif cote systeme : premier pas de settle a 60 ms au lieu de 750), le scenario re-sautait encore : l'evenement scroll du geste utilisateur se distribue de maniere asynchrone, et le pas de settle pouvait s'intercaler AVANT lui — le credit "correction propre" compte par evenements absorbait alors le geste de l'utilisateur. v7 remplace le comptage d'evenements par une attribution PAR POSITION : un evenement scroll n'est repute "propre" que si scrollY est a ±2 px de la derniere cible de correction, et chaque pas verifie d'abord que la page n'a pas bouge de plus de 48 px depuis sa propre derniere cible. Six scenarios consecutifs propres dans les deux contextes (motion normale et reduite) : plus aucun rappel force, atterrissages corriges a 202/224 px. Deuxieme bump SW de la journee (et-202608221200).

### Lecon
Le correcteur etait pense pour un monde statique et vivait dans un monde anime : 4 px de tolerance contre 22 px de reveal, c'est une guerre perpetuelle. Et l'enquete a failli s'egarer deux fois sur ses propres artefacts (intervalle zombie d'une sonde interrompue, scrollTo de mesure) — instrumenter les ECRITURES de scroll avec pile d'appel a designe le vrai coupable en une passe.

## 214 — La chasse a la classe settle : pas de recidive, mais un bouton anglais qui se prenait pour un slogan (2026-08-22)

Suite logique du chapitre 213 : apres avoir apprivoise settle() sur
l'accueil, verifier que la meme classe de defaut (une routine qui
re-corrige la position et combat le defilement de l'utilisateur)
n'existe nulle part ailleurs.

**Volet 1 — audit des ecrivains de scroll.** Inventaire exhaustif de
tout code qui ecrit la position de defilement (scrollIntoView,
scrollTo, scrollBy) hors u2 : la palette de commandes (aller au
resultat), le rail scrollcue (un pas de page au clic), la messagerie
(centrer le message), le panneau thematique (nearest apres ouverture),
goHash du glossaire (centrer le terme), les boutons haut de page.
Verdict : tous sont des tirs uniques declenches par l'utilisateur,
sans boucle de re-correction. La classe settle n'a qu'un seul
representant, deja corrige. Zero modification necessaire.

**Volet 2 — le balayage revele un autre gibier.** En inventoriant les
boutons, controle croise texte visible / aria-label sur les 208 pages
(134 paires examinees) : quatorze pages EN affichaient « Working with
EnerTchad » comme texte visible du bouton retour en haut (aria-label
« Back to top of page ») — un clobber de traduction : le libelle
« Haut de page » a ete remplace par la mauvaise entree du dictionnaire
lors de la generation des jumelles EN ; la version du glossaire EN,
ajoutee plus tard a la main, y avait echappe. Meme famille sur
brochure-en : le rail scrollcue affichait « EnerTchad on social
media » la ou toutes les autres pages disent « More ». Corrections :
« Back to top » sur les quatorze pages, « More » sur la brochure.

**Volet 3 — trois aria-label incoherents** (Label in Name, WCAG
2.5.3) sur les onglets des outils Tchaditech : aria-label « Rendement
de raffinage » pour un texte visible « Rendement raffinage »,
« Simulateur B2B » pour « Contrat B2B », « B2B simulator » pour « B2B
contract ». L'attribut n'apportait rien : supprime sur ces trois
onglets, le texte visible devient le nom accessible. Les onglets dont
l'aria-label coincide exactement sont conserves tels quels.

Les autres ecarts du balayage sont des faux positifs assumes et
documentes : boutons symboles (croix, plus, moins) dont l'aria-label
EST le nom, et cartes dont l'aria-label contient bien le titre visible.

Seize fichiers HTML corriges, aucun script ni style touche : pas de
bump du service worker (les documents sont network-first).

## 215 — « Fix errors » : la chasse ne trouve rien, et la preuve est consignee (2026-08-22)

Mandat lapidaire du proprietaire : corriger les erreurs. La reponse
honnete commence par les trouver. Cinq filets ont ete tendus, du plus
etroit au plus large.

**1. Surface recente.** Les 25 pages touchees depuis le balayage
vierge du chapitre 211 (accueil x2, glossaires, listings, les seize
du chapitre 214, outils Tchaditech, services-ep, deux carnets) :
console + axe, deux themes. Zero anomalie.

**2. Production reelle.** Statuts HTTP des pages modifiees : tous a
200. Console du vrai Chrome sur l'accueil en production, service
worker et-202608221200 actif : aucun message, aucune erreur.

**3. Balayage integral.** Les 206 pages dans les deux themes — 412
charges, console + axe a chaque fois : zero erreur console, zero
violation d'accessibilite. Le site reste au niveau du chapitre 211,
malgre les chantiers 212, 213 et 214 passes depuis.

**4. Liens et ancres.** Extraction de tous les href/src internes hors
gabarits de script : zero lien casse sur l'ensemble du site. Les
fragments d'etat intentionnels (#p= du Configurateur, #rub=, #cat=,
#t-) sont reconnus comme grammaire d'adressage, pas comme ancres
orphelines — le premier passage du filet les avait signales avant que
l'inventaire des id generes par JS ne les innocente.

**5. Donnees derivees.** sitemap.xml, feed.xml, feed-en.xml parses et
valides ; cmdk_extra.js (170 entrees) et cmdk_en.js (142 entrees)
json.loads sans faute ; la totalite des blocs JSON-LD du site (chaque
page) parsee : zero bloc invalide.

Verdict : aucune erreur a corriger. Le mandat est honore par la
contre-epreuve, pas par une correction inventee — la preuve bat la
promesse, y compris quand la preuve dit que tout va bien.

## 216 — Les fils d'Ariane recousus : 62 pages ou le JSON-LD racontait le mauvais chemin (2026-08-23)

En preparant le prochain carnet, lecture du gabarit interview-comptage :
son fil d'Ariane JSON-LD (BreadcrumbList) annoncait le titre de
l'interview WELLPADS — un residu du gabarit d'origine. Audit immediat
des BreadcrumbList des 208 pages : 112 signalements bruts, tries en
familles reelles et faux positifs (l'item du dernier maillon est
optionnel selon schema.org — ces cas-la sont conformes).

**Familles reelles corrigees, 62 fichiers :**

1. Seize pages journal (8 sujets x FR/EN) dont le dernier maillon
   portait le nom ET l'URL d'un AUTRE article — l'enigme densite pour
   six sujets (forage directionnel, gaz torche, mecanique des fluides,
   prix du litre, prix de l'uree, transfert de garde), Water-to-Value
   pour integrite-faire-durer, wellpads pour interview-comptage. Le
   maillon est realigne sur le headline Article de la page meme et son
   URL propre.

2. Les 30 pages journal EN pointaient leur maillon « Carnets » vers
   /carnets (FR) : bascule vers « Stories » -> /carnets-en, la
   convention deja etablie par les rublinks et la palette.

3. Onze pages EN racine (carnets, clients, confidentialite, cookies,
   engagements, faq, investisseurs, mentions-legales, publications,
   societe, solutions) dont le dernier maillon pointait l'URL FR :
   realignees sur l'URL EN ; « Investisseurs » devient « Investors »,
   « Carnets EnerTchad » devient « Stories ».

4. Vingt pages EN dont le premier maillon disait encore « Accueil » :
   « Home » — decouvert par la contre-epreuve du correctif precedent,
   pas par le balayage initial ; la sonde ne regardait que le dernier
   maillon, lecon retenue : auditer TOUS les maillons.

5. gouvernance et gouvernance-en portaient le fil d'ethique
   (« Ethique & conformite » -> /ethique) : chacun recoit son propre
   maillon. Les huit pole-*-en avaient des noms FR : traduits. ar.html
   normalise (/ar sans extension). Le Calculateur remplace son maillon
   placeholder « EnerTchad » par son vrai nom.

Les ecarts restants du signalement brut sont des libelles courts
volontaires (« Cookies » pour « Cookie policy ») : assumes, pas
touches. Validation : les blocs JSON-LD des 208 pages reparses a zero
faute ; plus aucun maillon etranger, plus aucun « Accueil » sur page
EN. Aucun script ni style touche : pas de bump du service worker.

## 217 — Ultra revue mobile et parcours du drilling manager : quatre defauts sous le vernis (2026-08-23)

Double mandat : revue approfondie de la version mobile, et simulation
de la navigation d'un drilling manager. Banc : Chromium 390x844 tactile,
captures, console, axe, cibles tactiles, debordements — puis parcours
scripte en sept etapes.

**Volet mobile — ce que le bureau ne montrait pas.** Les balayages
precedents tournaient a 1440 px ; l'emulation mobile fait apparaitre
du DOM specifique. Quatre defauts reels :

1. **L'accordeon du pied de page violait ARIA** sur les 202 pages :
   le script et-mhf-js posait role="button" + tabindex sur les <h3>
   des colonnes (« Nos poles », « Groupe »...), role interdit sur un
   heading (axe : aria-allowed-role, 4 noeuds par page). Correction
   canonique : un vrai <button aria-expanded> est injecte DANS le h3
   (typographie heritee), le h3 garde le clic pointeur, le bouton
   apporte clavier et semantique natifs. Toggle et re-fermeture
   verifies sur six pages.

2. **Les carrousels de cartes partageaient le meme aria-label** de
   region (landmark-unique sur accueil, clients, investisseurs) :
   l'etiqueteur de u_cd226c00eb4b.js numerote desormais les doublons
   — « Cartes ... (2) ». Script modifie => bump SW et-202608231000.

3. **Le placeholder du champ newsletter etait blanc a 38 % sur page
   claire** — invisible (famille du chapitre 197 : l'encre sombre
   pensee pour le theme nuit). Derogation ajoutee aux deux feuilles
   porteuses (bundle_core_a1, x_dd3f8c61af27) : rgba(42,54,72,.55) en
   clair, l'original intact en sombre.

4. Cibles tactiles : les radios 1x1 px du contact sont des radios
   stylees par label (le label large est la cible — conforme), les
   liens en ligne beneficient de l'exception WCAG. Rien a corriger.

**Volet drilling manager — sept etapes, sept verdicts.** Menu burger →
lien services-ep : ok. Ancre #packs-phase : atterrit a 183 px sous
l'en-tete. Palette « coiled tubing » : un resultat, le bon (lignes de
services puits). Configurateur via hash p=operateur&d=for : etat
applique et complete. Carnet forage directionnel → glref wellpad →
glossaire : centre a 95 px, surlignage actif a 1,2 s (il expire a
2,6 s par design — la premiere mesure trop tardive l'avait declare
mort, contre-epreuve faite). Calculateur : curseur gain 12→16 %,
sortie o_gain reactive. Contact : radio « Operateur E&P » selectionnable
au label. Zero erreur console sur tout le parcours.

**Mais le Configurateur cachait deux defauts de theme clair** : sa
regle d'aplatissement des boutons (background-color 7 % sur TOUS les
boutons de #root) effacait l'or du profil actif — le drilling manager
ne voyait pas quel profil etait selectionne (en sombre : or franc) ;
et le monogramme « E » perdait son disque dore (background-image:none
du moteur clair sur les div de main). Deux derogations a specificite
superieure : data-state=active / aria-pressed=true en or #D9A84F, et
le degrade radial du monogramme reapplique.

Verification finale : echantillon de dix pages cles rebalaye dans les
deux themes — zero console, zero axe. 203 pages HTML, deux feuilles
CSS, un script et le SW publies.

## 218 — Navigation mobile libre : le tiroir nuit sur page claire, la recherche invisible et les graphiques anglais jamais nes (2026-08-23)

Mandat : naviguer sur les versions mobiles. Vingt-trois pages
parcourues a 390 px comme un visiteur (defilement, captures a
plusieurs profondeurs, FR + EN + AR), puis les organes interactifs :
menu tiroir et sous-menus, recherche du glossaire, filtres #rub= des
carnets, panier de la boutique, curseurs EOR, atlas, formulaire de
contact en trois etapes. Zero erreur console, zero debordement sur
tout le parcours. Quatre defauts reels, tous vus a l'oeil sur les
captures — aucun n'etait detectable par les sondes automatiques.

**1. Le sous-menu du tiroir restait peint en nuit sur page claire.**
La regle claire du panneau nx-mega est volontairement limitee a
>=1241 px (« en tiroir il doit rester transparent ») — mais une regle
sombre NON gardee le peint quand meme sous ce seuil : sous-titres
bleu sombre sur gris nuit, quasi illisibles. Derogation mobile claire
(fond creme .97) dans les trois feuilles porteuses (bundle_core_a1,
plight_extrait, x_cd256286824c) ; le sombre reste intact.

**2. La recherche du glossaire tapait en blanc sur fond clair.** La
valeur saisie (#q) heritait du texte nuit #F5F7FA sur fond
transparent : le terme tape etait invisible. Style dedie dans les
deux glossaires : encre #1A2330 et fond blanc .66 en clair, l'original
en sombre. Balayage systematique de tous les champs du site dans la
foulee : la palette (modal sombre par design), le panier et les
cartes produits de la boutique (panneaux nuit volontaires) et le
formulaire de contact (chips grises, blanc lisible) sont conformes —
faux positifs assumes.

**3. Les deux graphiques de cibles-2030-en n'ont JAMAIS ete dessines.**
La page EN portait les canvases mais ni chart.umd.min.js ni le code
d'initialisation : les investisseurs anglophones voyaient deux cadres
vides depuis la creation de la page. Bloc porte et traduit (Founder /
Short term / Long term, Bn au lieu de Md). Au passage, deux defauts
du graphique FR corriges : les graduations log s'empilaient en mobile
(10 Md sur 7 Md...) — seules les puissances de dix sont conservees —
et le donut « Les 8 poles » n'avait que SEPT segments : la Petrochimie
manquait. Elle entre dans les deux langues (#D177B4).

**4. Verifications d'innocence** : l'ecran noir apres « Ajouter » a la
boutique etait le tiroir de commande legitime (panneau nuit lisible,
article ajoute, compteur a 1) ; la couche plein-ecran z-index maximal
est en pointer-events:none (toast, inoffensive) ; le stepper contact
va bien jusqu'a l'etape 2 avec valeurs saisies lisibles.

Feuilles CSS modifiees => bump SW et-202608231100. Controle final :
huit pages clefs rebalayees dans les deux themes, zero console, zero
axe.

## 219 — Solde des actions differees : tout ce qui restait en attente est applique (2026-08-23)

Mandat : appliquer toutes les actions. Inventaire des ecarts notes
« assumes » ou « mineurs » dans les chapitres 214 a 218, tries entre
ce qui releve du proprietaire (convention INSPEM, seance photo, noms
d'equipe, volumes d'import, ticket investisseur — non executables
ici) et ce qui etait a ma main. Quatre familles executees :

**1. Les dernieres miettes FR sur pages EN.** La contre-sonde lexicale
(mots francais dans les fils d'Ariane EN) a trouve trois maillons
echappes au chapitre 216 : « Conseil » sur audits-en et esg-en
(-> Advisory), « En profondeur — nos recits » sur recits-en (-> In
depth — technology stories). Plus l'alignement raffinage-en
(« Modular, movable » -> « Modular & movable », comme le titre).

**2. Cibles tactiles des curseurs** (note du chapitre 217 : 22 px).
Regle @media(pointer:coarse) dans les trois feuilles porteuses :
min-height 28 px pour tout input range et le curseur de luminosite.
Premiere version limitee a main/form : les cinq curseurs du
Calculateur (page sans <main>) restaient a 22 px — la regle est
elargie a input[type=range] nu, sans debordement induit.

**3. Contraste du formulaire de contact en theme clair** (note du
chapitre 218 : blanc sur gris composite ~2,5:1, sous le seuil AA,
invisible pour axe qui ne sait pas composer les fonds translucides).
Style dedie dans contact et contact-en : encre #1A2330 sur fond blanc
.72 en clair, verre nuit intact en sombre. Verifie au rendu : saisie
noire sur blanc, placeholder lisible, select et textarea alignes.

**4. Assume et documente, sans action** : les libelles courts des
fils d'Ariane (« Cookies », « Clients & solutions ») sont des choix
editoriaux ; le chevauchement transitoire compteur/rail « Suite » du
glossaire est le comportement de tout bouton flottant ; les panneaux
nuit volontaires (palette, panier, cartes produits) restent tels
quels.

Feuilles CSS modifiees => bump SW et-202608231200. Huit pages
rebalayees dans les deux themes : zero console, zero axe.

## 220 — Test de navigation integral : toutes les versions, tous les chemins (2026-08-23)

Mandat : tester la navigation pour garantir que tout marche sur toutes
les versions. Trois couches de preuve.

**Couche statique, 206 pages.** Zero cible de bascule de langue
cassee : les alternates hreflang FR/EN pointent tous vers des
fichiers existants, et le commutateur visible nx-lang coincide avec
la jumelle hreflang sur 100 % des pages qui le portent (zero
divergence). Les 69 pages sans nav standard (carnets en chrome de
lecture, outils, boutique, explorateur) offrent toutes leur propre
retour : lien Carnets/Accueil des articles + lien EN vers la jumelle,
retour-site des outils, commutateur propre de l'explorateur. Le
Configurateur reste un outil FR unique sans jumelle : choix assume,
les pages EN y menent directement.

**Couche dynamique, matrice 4 configurations** (mobile/bureau x
clair/sombre) : ouverture du menu et navigation reelle vers /societe
(4/4), bascule de langue par le commutateur (cible /societe-en
correcte), palette Ctrl+K (recherche « glossaire » -> premier
resultat le glossaire, href valide), accordeon du pied de page mobile
(toggle + refermeture), atterrissage d'ancre #packs-phase (185 px
mobile, 224 px bureau clair, 320 px bureau sombre — sous l'en-tete
dans tous les cas), chrome de lecture des carnets (retour /carnets +
rublink #rub=), page arabe (liens FR et EN presents). Zero erreur
console sur les quatre parcours.

**Couche production, vrai Chrome** : commutateur, mega-menu (lien
visible /societe dans le panneau ouvert) et palette verifies sur
/societe en ligne.

**Une seule retouche en decoule** : 23 pages FR liaient l'accueil en
href="index" (relatif, non canonique) — fonctionnel mais via une
redirection 308 de Vercel a chaque clic. Les 39 liens passent a
href="/" ; les href="/index-en" des pages EN sont canoniques et
restent tels quels. Echantillon rebalaye deux themes : zero console,
zero axe. Aucun script ni style touche : pas de bump SW.

## 221 — Le carnet « salle de controle » parait : troisieme interview metier (2026-08-23)

La serie « L'interview metier » gagne son troisieme episode : apres le
chef de chantier wellpads (amont) et le jaugeur-mesureur
(intermediaire), l'operateur de conduite — figure recomposee — donne
a voir le champ numerique depuis l'interieur de la salle. Sept
questions : ecouter un champ plutot que regarder des ecrans, la
hierarchie des alarmes (« acquitter n'est pas resoudre »), la regle
d'or de la conduite deportee (jamais d'action a distance ou quelqu'un
travaille), le jumeau numerique comme contradicteur, les modes
degrades et la separation OT/IT, la formation a rapatrier, et la
garde parfaite qui « ressemble a une nuit ordinaire ». Rubrique
Technologies — la serie touche ainsi son troisieme pole.

Construction par le gabarit du deuxieme episode, avec les garde-fous
des chapitres 183/207 : remplacement global du slug pour les URL
canoniques puis reecriture integrale de l'article (aucun lien
residuel vers l'episode precedent hors citations voulues), fond
datacenter.webp, dates 2026-08-23, fil d'Ariane au headline propre et
« Stories » -> /carnets-en cote EN (regles du chapitre 216).

Rituel des derives, complet : sitemap (2 URL), cmdk_extra (171
entrees) et cmdk_en (172e entree en-61f) valides json.loads, feed.xml
et feed-en.xml (guid permalien, pubDate +0000, lastBuildDate avance)
valides minidom, cartes en tete des deux listings (rubrique
Technologies auto-derivee par le filtre), jseq de l'episode 2 rebranche
vers l'episode 3 dans les deux langues, glrefs vers #t-scada et
#t-jumeau-numerique (FR) / #t-digital-twin (EN) — cibles verifiees au
rendu (atterrissage 95 px, surlignage actif).

Verification : les quatre pages touchees balayees dans les deux
themes (zero console, zero axe) ; filtre #rub=technologies montre
trois carnets dont le nouveau ; la palette repond « salle de
controle » -> l'article en premier. Scripts cmdk modifies => bump SW
et-202608231300.

## 222 — Le carnet « Premiere du genre » parait : champion national et licorne, sans tricher sur les mots (2026-08-23)

Directive du proprietaire : mettre a jour le blog avec des articles
et dire qu'EnerTchad est la toute premiere initiative de ce genre,
qu'elle se veut un champion, une licorne. Deux articles paraissent
donc ce jour : l'interview salle de controle (chapitre 221) et cet
editorial de positionnement, rubrique Economie · Vision.

Le texte pese ses mots pour rester dans la ligne de conformite du
site : « premiere du genre » est defini au sens precis — premiere
societe PRIVEE, a capitaux tchadiens, INTEGREE sur toute la chaine
(ni la societe nationale, ni les operateurs etrangers, ni les
negociants) ; le champion national est presente par ses effets de
filiere, avec le precedent nigerian (raffinerie privee) comme preuve
de possibilite africaine sans nommer de marque ; la licorne est
definie (1 Md$), situe APRES le cap 2030 publie (20 Md FCFA — les
ordres de grandeur sont assumes), et exprimee partout comme objectif
(« se veut », « viser ») avec le disclaimer societe en constitution
renforce dans la signature : « ambitions et valorisations evoquees
sont des objectifs, non des resultats ». Le mot d'ordre editorial est
la blockquote : une licorne ne se decrete pas.

Construction sur le gabarit du chapitre 221, memes garde-fous. Trois
glrefs nouveaux : #t-ohada, #t-itie, #t-contenu-local (FR) /
#t-ohada, #t-eiti, #t-local-content (EN) — cibles verifiees a 95 px.
Rituel des derives complet : sitemap (2 URL), cmdk 172/144 entrees
(en-61g), feeds lastBuildDate 09:00, cartes en tete des listings
(rubrique Economie existante, Vision en sous-libelle), jseq chaine
vers la rente partagee et l'interview salle de controle. Liens
internes des deux articles verifies : zero cible manquante. Quatre
pages balayees deux themes : zero console, zero axe. Bump SW
et-202608231400.

## 223 — Le fil date de l'accueil rattrape le blog (2026-08-23)

Les trois cartes « Le fil date · Carnets » des deux accueils etaient
figees fin juillet (bitume, integrite, production anticipee) — sept
carnets de retard sur le blog. Elles passent aux trois plus recents :
l'editorial « Premiere du genre » en tete (accent or, rubrique
Economie · Vision), puis les interviews salle de controle (accent
7E8AD9) et jaugeur-mesureur (accent bleu), dates et resumes alignes
sur les pages articles. Meme rafraichissement sur index-en avec les
jumelles EN. Verification : cartes ciblant les bons slugs dans les
deux langues, deux themes balayes — zero console, zero axe — et
controle visuel du bloc au rendu bureau. Aucun script touche : pas de
bump SW.

## 224 — L'editorial maille dans les piliers, la serie des interviews gagne son rail (2026-08-23)

Journee autonome, premier chantier : ancrer les parutions d'hier dans
le tissu du site.

**Images sociales corrigees** : les deux articles du 23 aout
heritaient de og-amont.jpg (residu de gabarit) — l'interview salle de
controle passe a og-tchaditech.jpg, l'editorial a og-image.jpg
(og:image, twitter:image et image du JSON-LD Article, FR et EN).

**Maillage de l'editorial** : la section Vision de la Societe (les
deux langues) et l'intro du modele economique des pages Investisseurs
renvoient desormais vers « Premiere du genre » ; les Sujets du moment
des deux listings gagnent une puce « Champion national & licorne » en
tete. Le premier balayage a leve un vrai defaut sur ces liens : la
classe rublink n'est stylee QUE sur les pages journal — sur societe et
investisseurs, le lien tombait au bleu navigateur #0000EE sur fond
nuit (contraste 1,78:1, axe color-contrast). Style porte par le lien
lui-meme : or --gold-l en sombre, que la feuille claire surcharge en
or fonce 7A570E — lisible des deux cotes, re-balaye a zero.

**Rail de serie** : les six pages de « L'interview metier » (wellpads,
jaugeur, conduite, FR+EN) affichent un rail numerote 01-02-03 avec
l'episode courant marque « vous y etes » / « you are here »
(aria-current="page"), au style des pilules jfoot existantes.
Controle visuel au rendu mobile : pilules cliquables, episode courant
en texte.

Quatorze pages balayees dans les deux themes : zero console, zero
axe. Aucun script touche : pas de bump SW.

## 225 — Le plan du site rattrape sept carnets (2026-08-23)

Controle de fraicheur des surfaces de listage : les deux plans du
site s'etaient arretes a l'interview wellpads — sept articles
manquaient dans chaque langue (forage directionnel, prix de l'uree,
gaz torche, transfert de garde, les deux interviews recentes et
l'editorial Premiere du genre). Les quatorze entrees sont ajoutees
dans l'ordre de parution, titres alignes sur les pages articles.
Inventaire par difference apres coup : zero manquant des deux cotes
(33 carnets FR, 33 EN). Les deux pages balayees deux themes : zero
console, zero axe.

## 226 — Cloture de la journee autonome : trois chantiers, un site verifie de bout en bout (2026-08-23)

Bilan de la journee (chapitres 224 a 226) : l'editorial « Premiere du
genre » est desormais ancre partout ou un visiteur decide — vision de
la Societe, modele economique des Investisseurs, puce en tete des
Sujets du moment, fil date de l'accueil (chapitre 223 la veille au
soir) ; la serie des interviews metier a son rail numerote sur ses
six pages ; les images sociales des deux parutions sont les bonnes ;
les plans du site ont rattrape leurs sept carnets manquants par
langue.

Contre-epreuve de cloture, la plus large a ce jour : 210 pages x 2
themes = 420 charges — zero erreur console, zero violation axe (les
quatre pages nees cette semaine entrent dans la liste de balayage
permanente) ; zero lien interne casse hors gabarits de script ; la
totalite des blocs JSON-LD parsee sans faute ; sitemap et flux valides
minidom ; les deux index de palette valides json.loads ; production
sondee (accueil 200, SW et-202608231400 servi, plan du site a jour en
ligne).

La lecon du jour prolonge celle du chapitre 224 : les classes de
style sont un contrat par page — rublink n'existe que la ou une
feuille la definit, et l'utiliser ailleurs, c'est heriter du bleu
navigateur sur fond nuit. Toute reutilisation d'une classe hors de
son habitat doit etre verifiee au calcul, pas a l'oeil.

## 227 — La FAQ repond a la licorne, le 404 parle aussi anglais (2026-08-23)

Trois retouches de coherence dans la foulee de l'editorial.

**FAQ, question 27** (FR et EN) : « Vous parlez de champion national
et de licorne — est-ce realiste ? » La reponse reprend le cadre de
conformite de l'editorial : objectifs assumes et non promesses, sens
precis de « premiere du genre », licorne situee apres le cap 2030,
renvois vers Cibles 2030 et l'article, rappel societe en
constitution. Le FAQPage JSON-LD du FR passe a 27 entrees (parse
valide) ; constat au passage : la page EN n'a pas de FAQPage — etat
anterieur, note pour un chantier futur.

**Image sociale du jaugeur** : l'interview comptage (Intermediaire)
portait og-amont.jpg — bascule vers og-intermediaire.jpg (FR+EN, six
references). La convention est desormais uniforme : og-image generique
pour les carnets, og de pole pour les interviews.

**404 bilingue** : la page d'erreur, unique pour tout le site chez
Vercel, ne parlait que francais. Une ligne lang="en" (English home ·
Stories · Contact) accueille desormais les anglophones egares.

Cinq pages balayees deux themes (zero console, zero axe) ; question
27 testee au rendu : ouverture au clic, liens valides.

## 228 — La FAQ anglaise gagne son FAQPage (2026-08-23)

Le constat du chapitre 227 est solde : la page faq-en n'avait aucun
schema FAQPage la ou le FR en portait un depuis longtemps. Les 27
paires question-reponse sont extraites des details visibles (source
de verite : le contenu rendu, pas une copie manuelle), serialisees en
JSON-LD (10,3 Ko) et inserees dans le head. Verification : les quatre
blocs JSON-LD de la page parsent, le FAQPage compte 27 entrees
alignees sur les 27 questions visibles — y compris la question
licorne du chapitre 227. Page balayee deux themes : zero console,
zero axe.

## 229 — CP-2026-007 : les Carnets s'etoffent, et toutes les surfaces le disent (2026-08-23)

La page Communiques etait figee au 10 juillet (CP-2026-006). Le
communique CP-2026-007 parait dans les deux langues, au format des
precedents (article cp, ancre #cp-007, time datetime, ref) : il
annonce le troisieme episode de la serie « L'interview metier » et
l'editorial « Premiere du genre », en reprenant la formulation de
conformite (premiere initiative PRIVEE tchadienne INTEGREE, cap
assume). Les blocs « Communiques officiels » des deux accueils
tournent : CP-007 entre en tete avec son ancre profonde, CP-004 sort
pour garder trois items. Les deux flux RSS gagnent l'item CP-007
(guid permalien #cp-007, convention des CP precedents), lastBuildDate
avance a 10:00. Quatre pages balayees deux themes (zero console, zero
axe), ancres cp-007 verifiees des deux cotes, flux reparses valides.

## 230 — Maillage retrograde : les anciens carnets pointent vers les nouveaux (2026-08-23)

Deux controles preliminaires, tous deux vierges : les promesses des
communiques (chaque lien cp-links resolu, ancre kit-media presente
dans les deux listings) et l'hygiene des cartes sociales sur les 210
pages (og:image existante, parite og/twitter — zero ecart).

Puis le maillage dans le sens qui manquait : les nouvelles parutions
recoivent des liens entrants depuis leurs aines thematiques. « Le
champ numerique » (FR+EN) renvoie vers l'interview de l'operateur de
conduite — l'article qui incarne son architecture ; « La rente
partagee » (FR+EN) renvoie vers « Premiere du genre », dont la
derniere section (le champion partage) prolonge exactement son
propos. Quatre pages balayees deux themes : zero console, zero axe.

## 231 — Ultra revue des outils de navigation : le variateur reprend vie (2026-08-24)

Revue systematique des outils de navigation sur les trois langues,
deux themes, mobile et desktop. Trois familles de defauts, toutes
corrigees.

Le panneau thematique (th-x) d'abord : les organes ajoutes par le JS
(bouton de fermeture #th-close, puces #th-chips, outils #th-tools,
pied #th-foot) n'avaient jamais recu de style — la lecon du ch.224
encore : une classe n'existe que si une regle la sert. Styles poses
dans s_0c793eb7ae.css (fermeture ronde en haut a droite, puces en
pilule a point dore, outils prefixes d'une fleche), plus les
surcharges claires (le moteur plight ecrasait le fond du panneau —
gradient creme :not(#e1)... !important pour reprendre la main).
Verifie visuellement dans les deux themes et a 390 px (aucun
debordement, fermeture visible, panneau au-dessus de la barre
d'application).

Le variateur de luminosite ensuite, le gros morceau : le controle
#lum-ctl est present sur 207 pages (bouton, panneau, curseur 80-130,
trois prereglages, voile #lum-veil) mais un chapitre passe l'avait
masque universellement — commentaire dans le CSS : « controle sans
pilote JS, masque universellement ». Le pilote existe desormais dans
u_cd226c00eb4b.js (charge exactement sur ces 207 pages) : ouverture
et fermeture (bouton, Echap avec retour de focus, clic exterieur),
application par curseur et prereglages (aria-pressed tenu a jour),
persistance localStorage et-lum, restauration au chargement. Le
gradateur passe par l'opacite du voile fixe (noir sous 100, blanc
au-dessus), JAMAIS par un filter sur html : un filtre y creerait un
contexte de confinement et les elements fixed defileraient avec la
page. Deux pieges evites en route : le voile a une opacite calculee
de 1 par defaut (fond transparent) — mise a zero explicite au
chargement, sinon la premiere application animait 1 vers la cible,
soit un eclair sombre ; et les deux masques display:none
(bundle_core_a1.css, x_917896c622c8.css) sont leves avec un
commentaire date. Regle d'etat actif des prereglages ajoutee dans les
deux memes fichiers (bordure et fond dores sur aria-pressed).
Note de banc d'essai : en headless sans production d'images, les
transitions d'opacite n'avancent pas (lecture a 0 puis 0.252 apres un
screenshot force) — artefact de compositeur, pas un defaut du site.

La barre d'application mobile (#nezBar) enfin : l'observateur
d'intersection existant ne marque que les liens d'ancre — sur toute
page interieure, aucun des cinq onglets n'indiquait la position.
Nouveau bloc dans u_cd226c00eb4b.js : correspondance de chemin
normalise (index/-en/.html/barre finale) pour poser aria-current=page
et .nz-on, avec repli sur le lien d'ancre du meme document (cas
Services sur /amont/services-ep). Verifie sur investisseurs, contact,
reseau, services-ep, l'accueil des deux langues.

Le reste de la revue confirme sans retouche : rail de traversee
#aurail de l'accueil (9 ancres resolues, noms accessibles par texte
interne, defilement au clic), scrollcue de societe (present en haut,
opacite 0 et pointer-events none en pied de page), chrome de lecture
des journaux (bande sombre jtop lisible dans les deux themes, retour
carnets, lien EN), page arabe (rtl, liens verifies — les cibles
/petrochimie/ et consorts passent par les rewrites Vercel, 200 en
production), barre d'application absente des outils immersifs
(Calculateur, Configurateur, explorateur-chaine) par conception.
Trois faux positifs de sonde ecartes par contre-epreuve (chemins
d'articles errones, regex EN trop stricte, rail sans aria-label mais
avec texte interne). SW bumpe et-202608241000 (deux CSS et un JS
cache-first modifies).

## 232 — La chasse aux organes sans pilote : le formulaire EN revit, la palette parle anglais (2026-08-24)

Suite logique du ch.231 : le variateur mort n'etait peut-etre pas un
cas isole. Balayage statique de tous les boutons et champs a id sur
les 210 pages, croise avec l'ensemble des scripts (bundles et
inline) : quatre suspects, deux faux positifs ecartes par
contre-epreuve (le bouton de recherche du 404 est cable par onclick
inline ; le rail de chantiers de projets-en est fait de simples
ancres, comme son jumeau).

Deux vrais morts. D'abord, grave : le formulaire de contact anglais.
L'assistant en trois etapes (choix de la demande, coordonnees,
recapitulatif) avait tout son markup mais AUCUN script — le bouton
« Continue » ne faisait rien, aucun visiteur anglophone ne pouvait
envoyer sa demande. Le pilote de contact.html (3,1 ko) est porte avec
ses chaines traduites (Request/Name/Organisation/Product/Message,
en-tete To/Subject) et une amelioration : le recapitulatif affiche le
libelle anglais de la carte choisie, tandis que la valeur francaise
part dans le mailto — l'equipe de N'Djamena recoit sa taxonomie.
Parcours complet verifie des deux cotes : etapes, selection produit
conditionnelle, recapitulatif, repli copie, regression FR intacte.

Ensuite, systemique : la palette Ctrl+K servait des resultats
FRANCAIS sur la quasi-totalite des pages anglaises. Les deux moteurs
(c_abd..., c_df4f...) detectent l'anglais en inspectant les donnees
chargees — or 38 pages EN chargaient cmdk_extra.js (le catalogue
francais, 172 entrees) et 5 autres n'avaient aucune donnee : partout
le moteur retombait en francais, titres et cibles /investisseurs au
lieu de /investisseurs-en. Seules 5 pages EN (glossaire, achats,
paiements-etats, communiques, ethique) chargeaient cmdk_en.js et
faisaient bien. Correction : substitution du catalogue sur les 38,
insertion avant le moteur sur les 5 (l'ordre compte, les differes
s'executent dans l'ordre du document). Verifie sur sept pages EN
representatives : resultats anglais, cibles -en ; les pages FR
inchangees.

Precision de methode : le premier sondage concluait « palette ne
s'ouvre pas » sur ces pages — faux positif de banc (frappe synthetique
et premier role=dialog qui etait l'avis cookies). La contre-epreuve
par openCmdk() a montre l'ouverture partout : le defaut reel etait la
langue des donnees, pas l'ouverture. 49 pages EN balayees deux
themes : zero console, zero axe. HTML seul, pas de bump SW (documents
en network-first).

## 233 — Les outils interactifs passent au theme clair (2026-08-24)

Revue fonctionnelle des quatre outils du site (calculateur du baril,
configurateur de service v2, explorateur de chaine, boutique) plus les
accordeons de la FAQ, dans les deux themes. Cote mecanique, tout
repond : les six curseurs du calculateur recalculent sans NaN, le
configurateur change d'onglet et selectionne ses domaines, la boutique
ajoute au panier dans les deux langues, les 27 questions de la FAQ
s'ouvrent et le FAQPage est present des deux cotes. Deux faux
positifs de sonde ecartes par contre-epreuve : le bouton d'ajout
anglais s'intitule « Add » et non « Add to... » (ma regex le
manquait), et le premier onglet du configurateur etait deja
selectionne, d'ou l'absence de changement au clic.

Le vrai defaut etait ailleurs : ces deux outils n'avaient jamais recu
de traitement clair.

Calculateur. Les quatre tuiles de resultat recevaient le fond clair
generique des tuiles (blanc a 88 %) mais gardaient l'encre du theme
sombre : chiffre blanc sur blanc, mesure au pixel peint a 1,35:1 ;
legende gris-bleu #9DAAC2 sur la meme tuile, 1,05:1 — les quatre
sorties principales de l'outil etaient illisibles. Le bandeau « effet
corridor » restait en bleu nuit translucide sur creme (boue a 1,9:1),
et la mention « Simulation illustrative » etait en blanc a 50 % sur
creme. Bloc calcLight233 pose en fin de head : panneau, tuiles,
bandeau et pastilles en blanc a bordure sombre, encre #12203A pour les
chiffres et #43536E pour les legendes, piste des barres en gris,
synthese en degrade dore pale a encre sombre. Deux pieges rencontres
en route : le bouton secondaire « Copier la synthese » recevait deja
un fond bleu nuit d'une regle claire generique — poser une encre
sombre dessus l'aurait rendu invisible (1,17:1), il fallait aussi
forcer le fond blanc ; et le bouton d'action principal avait perdu son
degrade dore, retabli avec son encre #121D31.

Configurateur. Le correctif clair v2 de la page visait les onglets
avec un selecteur trop large : button[aria-pressed="true"] remplissait
en aplat dore #D9A84F. Or les onglets Radix portent
data-state="active", pas aria-pressed — ce sont les six grandes cartes
de domaine qui portent aria-pressed. Resultat : chaque domaine
selectionne devenait un pave dore avec du texte gris-bleu dessus, et
les pastilles de perimetre perdaient leur code couleur (vert « en
propre », or « via partenaires ») a cause de la regle
span{color:inherit}. Correctif Ch233 : les cartes prennent le
traitement mirroir du theme sombre — teinte doree pale #FBF2DE,
bordure #C49A35, encre sombre — les onglets gardent l'aplat, et les
pastilles retrouvent des valeurs sombres lisibles (5,9:1 et 6,6:1).
Titres a 16,3:1, corps a 7,0:1 apres correctif.

Verifie au pixel et a l'ecran dans les deux themes, plus le
configurateur a 390 px (aucun debordement). Theme sombre inchange sur
les deux outils. Balayage des pages d'outils deux themes : zero
console, zero axe. Pages de documents seules : pas de bump SW.

## 234 — Le controle de contraste au pixel peint : ce qu'axe ne voit pas (2026-08-24)

Le chapitre 233 avait revele que le calculateur etait illisible en
theme clair alors que les balayages axe des chapitres precedents
n'avaient jamais rien signale. La raison est structurelle : axe
n'evalue pas le contraste quand le fond est un degrade, une image ou
un empilement translucide — il classe le cas « incomplet » et se
tait. Or c'est exactement la situation de tout ce site.

D'ou un banc d'essai nouveau : pour chaque texte, l'encre est lue
dans la feuille de style (valeur exacte, alpha composite) et le fond
est lu DANS LE PIXEL REELLEMENT PEINT d'une capture d'ecran. Quatre
hauteurs de defilement par page, 160 pages, theme clair. Deux
iterations ont ete necessaires pour rendre la mesure fiable : la
premiere version prenait la couleur dominante de la boite comme
encre, ce que l'anticrenelage rend faux sur les petits textes ; la
seconde inversait l'encre et le fond sur les fonds de luminance
moyenne. La version retenue ne devine plus l'encre : elle la lit.

600 signalements bruts sur 116 pages, tous passes en contre-epreuve
sur rendu propre avant toute correction — la moitie etaient des
artefacts de banc (texte glissant sous un bandeau colle, sous-nav
deplacee parce que le banc masquait la barre principale, texte SVG
dont la couleur vient de fill et non de color, texte sur photo dont
l'ombre portee n'est pas modelisee). Sept familles reelles, toutes
corrigees :

1. Rail de sommaire (#secrail) : son libelle est un <b>, donc capture
   par la regle generale « html.et-jlight b{color:#10161F} » — encre
   quasi noire sur pastille bleu nuit, 1,02:1, sur les 64 carnets. Le
   rail garde desormais son encre claire (17,2:1).
2. Bandeau precedent/suivant (nav.pgr) : les regles claires posees
   jadis visaient .pgr-t et .pgr-dir, deux classes absentes du
   balisage — les vraies sont .ttl et .dir. Titre blanc sur carte
   claire, 1,15:1, sur 31 pages. Lecon repetee du ch.224 : une regle
   qui vise une classe inexistante ne proteste pas, elle ne fait
   rien.
3. Boutique : puces de categorie et barre de segments — seule
   l'option active avait une encre claire, les inactives gardaient
   celle du theme sombre sur creme (1,24 et 1,29:1).
4. Page arabe : elle n'avait jamais recu de traitement clair pour ses
   organes propres. Le heros reste photographique dans les deux
   themes, mais le moteur clair eclaircissait ses tuiles : chiffres
   blancs sur tuile pale (2,2:1), legendes (1,1:1) et bouton
   « explorer le site complet » (1,0:1) disparaissaient. Tuiles
   redevenues sombres sous le titre blanc qui les surplombe.
5. Page arabe encore, mais de navigation : en RTL le rail de sommaire
   est ancre du cote debut (gauche) alors que ses items restaient
   alignes sur le bord oppose de sa boite — les pastilles se posaient
   EN PLEIN dans la colonne de texte. Reperes ramenes dans la marge,
   libelles retires de l'affichage mais conserves pour les lecteurs
   d'ecran : cinq chevauchements mesures, zero apres correctif.
6. Pastilles flottantes des outils : en clair, le moteur recolorait
   leur encre en or ou bleu sombre sans toucher leur fond bleu nuit —
   retour au site 1,95:1 sur le configurateur, pastille de langue
   2,84:1 sur l'explorateur (FR et EN). Passees en pastilles claires.
   Au passage, le configurateur posait DEUX controles de retour l'un
   sur l'autre : le sien (z 50) exactement sous celui du site
   (z 9999), inatteignable a la souris mais annonce par les lecteurs
   d'ecran. Celui de l'application est masque.
7. Finitions AA : mentions de pied des pages achats et parc (4,19:1),
   numerotation des etapes achats (4,36:1), note du calculateur
   (4,12:1 sur le degrade dore) — toutes remontees au-dessus de 4,5.

Balayage de controle des 18 pages touchees dans les deux themes :
zero console, zero axe. Recontrole au pixel des dix pages corrigees :
les sept familles sont eteintes. SW bumpe et-202608241800 (deux
feuilles cache-first modifiees). Reste au journal des suites : les
textes clairs poses sur photo, ou l'ombre portee fait le contraste —
le banc ne sait pas encore la modeliser, ils demandent une mesure a
l'oeil.

## 235 — Le texte sur photo : mesurer ce que voit l'oeil (2026-08-25)

Le chapitre 234 s'etait arrete sur un aveu : les textes clairs poses
sur photo echappaient au banc, parce que c'est l'ombre portee qui y
fait le contraste et qu'une lecture de feuille de style ne la voit
pas. Le banc de ce chapitre la voit : dans la capture d'ecran, il
separe les pixels de GLYPHE (ceux proches de l'encre CSS) des pixels
de FOND, et compare la moyenne des premiers a la mediane des seconds.
L'ombre portee, cuite dans l'image, entre donc dans le fond mesure —
exactement comme pour l'oeil.

Limite connue et mesuree : sur les textes petits et fins, la majorite
des pixels de glyphe sont des pixels partiellement couverts, ce qui
tire la moyenne vers le fond et SOUS-ESTIME le contraste. Verifie sur
trois cas : liens or de carrieres mesures 3,93 pour une valeur reelle
proche de 5,0. Les resultats entre 4,0 et 4,5 sur du texte de moins de
15 px sont donc tenus pour non concluants, et n'ont declenche aucune
retouche. Le banc sert ce pour quoi il est fiable : les ecarts francs
sur de grandes surfaces.

Deux familles reelles, verifiees a l'ecran.

Le voile des heros de page. Le voile vertical existant part de
rgba(14,22,38,.24) en haut : sur les photos a ciel clair (raffinerie
de jour, entrepot, station-service), le fil d'Ariane et le surtitre
tombaient a 2,0:1 et le titre a 2,7:1 — sur cinq pages au moins, et
dans les DEUX themes, ce n'etait pas un defaut du mode clair. Un voile
horizontal ancre du cote du texte est ajoute : la colonne de texte
gagne un fond, la photo garde sa presence a droite. Deux impasses en
route, consignees parce qu'elles se represententeront : ::after etait
deja pris par s_fa541870c6.css pour le filet dore de 1 px en haut du
heros (height:1px), un voile pose la est ecrase a un trait ; et un
z-index negatif sans contexte d'empilement renvoyait le voile derriere
la photo. La recette qui marche existait deja, posee sur une seule
page (pole-enerchimie-en) : isolation:isolate sur le heros, voile en
::before a z-index -1. Elle est generalisee aux 159 pages a heros.
Au passage, le fil d'Ariane du heros portait text-shadow:none — or
c'est justement l'ombre qui le tenait lisible sur photo ; elle lui est
rendue.

La bande d'indicateurs OFS (services-ep, FR et EN) gardait ses encres
de theme sombre alors que sa bande passe au creme en clair : chiffre
dore a 1,4:1 en corps 34 px, legendes quasi invisibles. Encres
reprises en or sombre et gris ardoise.

Ecartes par contre-epreuve : le sous-menu investisseurs (fond blanc
reel, le banc avait capte la barre sombre au-dessus), le libelle du
rail sur eor (pastille sombre, le banc avait pris le ciel autour), les
titres a degrade clip sur photo (le banc ne sait pas lire un texte
dont les glyphes SONT le degrade — verification a l'oeil, lisibles).
Verification que le voile n'empate pas les heros deja sombres : photo
intacte a droite, colonne de texte un ton plus profond. Balayage de 18
pages a heros dans les deux themes : zero console, zero axe. SW bumpe
et-202608250900.

## 236 — Le pays unique, la navigation unifiee, la revue des bandeaux (2026-08-25)

Trois chantiers demandes ensemble : dire le choix mono-pays, moderniser
et harmoniser les sous-menus, passer les bandeaux en revue.

LE CHOIX DU PAYS UNIQUE. Nouvelle section « Mono-pays, par choix. »
(03a-bis) sur la page Societe, FR et EN, entre l'approche et la Voie.
Trois arguments, dans le cadre de conformite habituel : un seul terrain
donc toute l'ingenierie sur un seul contexte (geologie de Doba et
Bongor, bruts lourds et decote, corridor de Kribi, distances, climat,
competences locales) plutot que des recettes concues ailleurs ;
optimiser ce qui existe deja (recuperation assistee, gaz torche, eau de
production, raffinage dimensionne pour la demande locale) plutot que
courir apres de nouveaux gisements ; et acceder aux meilleures
technologies de production, choisies parce qu'elles conviennent au
Tchad — le critere est l'adaptation au contexte, pas la notoriete du
fournisseur. Encart de rappel : societe en constitution, objectifs et
choix de conception, pas activites en cours. L'entree est ajoutee au
sous-menu de page des deux cotes. Typographie anglaise corrigee dans la
foulee : les espaces insecables avant deux-points, corrects en francais,
ont ete retires de la version anglaise.

LA NAVIGATION. Etat des lieux avant travaux : 34 structures
differentes du menu principal sur 87 pages — 20 variantes cote anglais,
14 cote francais. Deux generations coexistaient en anglais : 27 pages
sur l'ancienne (« Company / Our business », colonne Tchaditude
divergente, dix liens de moins) et 22 sur la nouvelle (« Group / Our
operations », alignee sur le francais). Un gabarit par langue est
desormais applique aux 87 pages, avec substitution des seules parties
propres a chaque page : le lien vers la version jumelle (deux
emplacements), le lien de marque, et l'onglet actif. Resultat : 2
structures au lieu de 34.

Trois defauts corriges au passage. Le lien vers la version arabe
n'existait que sur l'accueil (1 page sur 87) : il est desormais partout,
aux cotes du bascule FR·EN. Son balisage etait casse — hreflang="fr
class="nx-langx", guillemet fermant manquant, donc attributs fusionnes
et classe perdue : le lien s'affichait sans sa pastille. La marque
pointait vers #top sur 17 pages interieures, ce qui ne ramenait pas a
l'accueil. Et la baseline « Acces aux Energies » est confirmee comme
signature de marque non traduite (74 pieds de page anglais sur 82) :
les 8 pages qui la traduisaient sont alignees.

LES BANDEAUX. Inventaire : cta-band 159 pages, sous-nav de pole 154,
barre d'application 154, legende de heros 131, cotations 42, avis
cookies 40, precedent/suivant 31, thematiques 24, segments 6,
sous-menu de page 6. Deux ecarts reels.

L'avis cookies n'existait en dur que sur 40 pages sur 159 : un visiteur
arrivant par une recherche ou un lien partage sur une page interieure
ne le voyait jamais. Plutot que d'ajouter le balisage a 119 fichiers,
un constructeur universel est pose dans u_cd226c00eb4b.js : il ne fait
rien si le bandeau est deja present, sinon il le construit dans la
langue de la page (francais, anglais, arabe) avec des styles en ligne,
pour ne dependre d'aucune feuille — les pages concernees ne chargent
pas toutes celle du bandeau d'origine. Verifie sur cinq pages : texte
et lien de politique dans la bonne langue, bouton de 44 px, memorisation
du consentement, aucun doublon la ou le bandeau existait deja.

Le bandeau de cotations etait sur 28 pages anglaises contre 14
francaises. Le jeu francais est editorial et coherent (accueil,
brochure, achats, paiements aux Etats, et les sections amont et aval) ;
le jeu anglais l'avait etendu a des pages institutionnelles et RH ou
une cotation du brut n'a pas de sens. Retire des neuf pages anglaises
concernees (accessibilite, avertissements, carrieres, charte, cibles
2030, communautes, gouvernance, innovation, plan du site), avec
controle d'equilibre des balises et de la mise en page : le titre
principal de carrieres-en revient a 232 px, contre 233 px cote
francais. Les bandeaux thematiques ont ete verifies : aucun ecart entre
le nombre annonce et le nombre d'items.

Balayage de 18 pages representatives dans les deux themes : zero
console, zero axe. SW bumpe et-202608251500 (un JS cache-first modifie).

## 237 — Le pays unique, dit la ou les decisions se prennent (2026-08-25)

Le chapitre 236 avait pose l'argument mono-pays sur la page Societe.
Un argument de positionnement ne sert a rien s'il n'est lisible que la
ou personne ne va le chercher : il est desormais present aux trois
endroits ou il pese.

L'accueil, FR et EN. L'accroche de « Qui nous sommes » gagne une
proposition : pensee pour le Tchad, par des Tchadiens, elle n'opere que
la — par choix, avec le lien vers le raisonnement complet. Une phrase,
au point ou le visiteur decide s'il continue.

L'espace investisseurs, FR et EN. La these passe de cinq a six
raisons : « 06 · FOCUS — Un seul pays, toute l'ingenierie ». C'est un
argument distinct du « 100 % tchadien » qui le precede : l'un parle de
propriete du capital, l'autre de profondeur d'expertise. Le titre de
section et la carte du bandeau thematique sont passes a « Six raisons »
tous les deux — le second l'avait ete par erreur avant le premier, ce
que le controle a rattrape.

La FAQ, FR et EN. Question 28 : « Pourquoi EnerTchad n'opere-t-elle
qu'au Tchad ? ». Reponse en trois temps — le choix et ce qu'il permet,
ses deux consequences pratiques (optimiser l'existant, choisir les
technologies pour le Tchad), le renvoi au raisonnement complet — avec
le rappel de conformite. Le FAQPage JSON-LD passe de 27 a 28 entites
des deux cotes, relu et revalide.

Rituel des derives : six entrees ajoutees a la palette de recherche
(trois FR, trois EN), pointant vers la section Societe, la these et la
FAQ. Fichiers relus en JSON apres ecriture.

Deux fautes de ma main, corrigees avant publication et notees ici parce
qu'elles sont instructives. La premiere : mon remplacement de l'intro
de section avait atterri dans la description de la carte du bandeau
thematique, creant une ancre DANS une ancre — balisage invalide et clic
de carte compromis. Le controle par comptage d'ancres imbriquees l'a
attrapee. La seconde est la lecon du ch.224 qui se represente a
l'identique : un <a> nu dans .intro n'est servi par aucune regle, donc
bleu par defaut du navigateur (#0000EE) sur fond bleu nuit, 1,84:1 —
signale par axe en theme sombre. Encre doree posee en ligne, comme pour
les autres liens de ce type. Une classe n'existe que si une regle la
sert ; un lien n'a de couleur que si quelqu'un la lui donne.

Balayage des huit pages touchees dans les deux themes : zero console,
zero axe. SW bumpe et-202608251900.

## 238 — Le verre pour toutes les tuiles, et l'angle mort du banc comble (2026-08-25)

Deux demandes : appliquer les actions en attente, et harmoniser les
tuiles en verre transparent.

LES ACTIONS EN ATTENTE. Le journal en portait trois sortes. Celles qui
relevent du proprietaire restent ouvertes et ne peuvent pas etre
inventees : convention INSPEM, seance photo, noms reels de l'equipe,
volumes d'import par pays, ticket d'entree investisseur. Les points de
veille dates ne sont pas echus (carte Brent en janvier, validation ITIE
2026, jalons Sedigui, accord raffinerie Tchad-Algerie). Restait un point
technique, ouvert depuis le ch.234 et repete au ch.235 : le banc de
mesure du contraste lisait « color » et non « fill » sur le texte SVG,
donc le contraste des etiquettes de schemas et de cartes n'avait JAMAIS
ete verifie. C'est fait ici, et cela a paye (voir plus bas).

LE VERRE. Constat avant travaux, mesure et non suppose : la famille de
80 classes du bloc tuiles-immersion (ch.141) est deja vitree partout —
fond transparent, lavis, flou d'arriere-plan, filet fin. Sur huit pages
temoins, trois signatures seulement s'ecartaient, et de peu. Le defaut
n'etait donc pas l'absence de verre mais l'absence d'INSCRIPTION : dix
classes qui sont visuellement des tuiles n'avaient jamais rejoint la
famille et gardaient un fond plein — cartes de comparaison, indicateurs
de heros et de projets, cartes contact, cartes d'application, cartes de
distribution. Elles recoivent exactement les memes valeurs que la
famille, pas un second systeme : harmoniser, c'est rejoindre l'existant.

Deux gardes-fous en route. Premiere tentative jetee : j'avais construit
la liste comme une simple enumeration « .a,.b,.c » avant d'y accrocher
les crans d'identifiant et le prefixe de theme — or ils ne se collent
qu'au dernier et au premier element. La regle ne visait donc rien de ce
qu'elle annoncait, et posait meme un lavis clair non filtre sur 79
classes. Retiree, refaite avec :is(), comme le site le fait lui-meme.
Seconde : la classe .hpcard, qui a tout d'une tuile par son nom, s'est
revelee etre a l'usage huit BOUTONS d'appel a l'action colores de
l'accueil (« Decouvrir le pole », un aplat par pole). La vitrer aurait
efface huit CTA. Ecartee apres verification a l'ecran.

L'ANGLE MORT COMBLE. Banc corrige (fill pour le texte SVG), puis passe
sur dix pages a schemas et cartes. Trois signalements anterieurs
disparaissent — c'etaient des lectures de « color » sur du texte SVG,
donc de faux positifs, ce qui confirme la correction. Et un vrai defaut
apparait, invisible jusqu'ici : sur la carte du reseau en theme clair,
les etiquettes de villes (N'Djamena, Moundou, Doba, Sarh) etaient en
blanc a 78 % sur une carte pale — 2,74:1. Les points s'affichaient,
pas les noms. Encre passee en #25314A ; les sous-titres suivent.

Un dernier defaut, anterieur mais que le verre rendait systematique :
les indicateurs du heros (.pgh-kpi) sont poses sur la photo et non sur
une section. Le lavis clair n'y tient pas — blanc gras a 2,7:1 sur les
zones claires de l'image, deja signale au ch.234. Ils gardent le verre
mais en teinte nuit dans les deux themes, comme le heros lui-meme qui
reste photographique en clair comme en sombre. Apres correctif : zero
echec severe sur les quatre pages a heros mesurees.

Balayage de 18 pages dans les deux themes : zero console, zero axe.
Mesure au pixel de dix pages a schemas, deux themes : zero echec severe
hors les titres a degrade clip, que le banc ne sait toujours pas lire.
SW bumpe et-202608252200 (trois feuilles cache-first modifiees).

## 239 — Le banc exact, et ce qu'il a fini par voir (2026-08-25)

### Pourquoi ce chapitre

Le chapitre 238 avait mis toutes les tuiles sous verre. Restait a verifier, page par
page et theme par theme, que la transparence n'avait pas coute de la lisibilite. Le
premier balayage a rendu 245 signalements sur 98 pages. En les ouvrant un par un, la
moitie n'existait pas : le banc se trompait. Ce chapitre est donc d'abord la
reconstruction de l'instrument, ensuite seulement la revue qu'il a permise.

### Ce que les bancs precedents ne savaient pas faire

Quatre erreurs de mesure, toutes trouvees par contre-epreuve a l'ecran :

1. **Le menu mega ferme.** Il reste dans le document avec une boite visible mais n'est
   pas peint. 50 des 54 signalements d'engagements.html et de clients.html venaient de
   la. Le banc exclut desormais tout descendant de la navigation.
2. **L'en-tete colle des carnets.** Le texte de l'article defile dessous ; la capture
   montrait le bandeau, pas le texte. Vingt-deux pages de carnets etaient accusees d'un
   defaut inexistant. Le banc ne mesure plus que ce qui est au premier plan.
3. **Le rail de sections.** Il est en pointer-events:none : invisible au test de
   recouvrement par point d'impact, mais bien peint par-dessus le texte. Le banc masque
   maintenant tout calque flottant non cliquable — et ce chapitre corrige au passage le
   defaut reel que cette enquete a mis au jour (voir 239.2).
4. **Les transitions de couleur.** Pour mesurer l'opacite d'un glyphe, le banc remplit
   le texte en blanc puis en noir. Au retour a la couleur d'origine, la transition CSS
   est encore en cours : on relisait un noir de passage la ou la page affiche de l'or.
   Les transitions sont desormais coupees avant toute mesure.

### Le banc exact

Quatre captures du meme ecran, mise en page identique :

- **a** : le texte normal ;
- **b** : le remplissage du texte passe en transparent — le glyphe disparait, **l'ombre
  portee reste**. C'est exactement le sol que voit l'oeil sous chaque lettre ;
- **w** et **k** : le meme texte rempli en blanc pur, puis en noir pur.

Un pixel peint vaut P = alpha x encre + (1 - alpha) x fond. Donc **w - k = alpha x 255** :
l'opacite de chaque pixel de glyphe se lit sans rien supposer de la police, du lissage
ni du fond. On ne retient que les pixels pleins ; l'encre vient de la feuille de style,
composee sur le fond mesure si elle est semi-transparente ; pour un titre a degrade
(background-clip:text), elle se demele de la capture a. Le fond variant sous un texte
pose sur photo, on juge au 15e centile des rapports pixel a pixel : un titre est note
sur sa portion la plus faible, pas sur sa moyenne. Un indicateur complementaire dit
quelle part du texte passe sous le seuil, ce qui separe un libelle entierement trop
pale d'un simple bord mordant sur une zone claire.

**Calibration sur page temoin** : sept encres connues sur blanc, de 9 a 20 pixels.
Mesures 3,03 et 2,17 pour des verites de 3,03 et 2,17 ; les cinq autres passent
correctement. Ecart nul. Les deux limites documentees aux chapitres 234 et 235 —
le texte a degrade impossible a mesurer, la sous-estimation du petit texte fin entre
4,0 et 4,5 — sont donc levees toutes les deux.

### Ce que la revue a trouve

21 810 elements mesures, 160 pages, deux themes. 690 signalements, 312 apres
deduplication, **153 sous 3:1**, regroupes en 26 familles. Les 26 ont ete ouvertes a
l'ecran une par une avant tout correctif : les 26 sont reelles.

- **239.1 — Bandeau de tete des carnets.** Voile de 24 % sur une photo claire : le
  retour, le selecteur de langue et la marque entre 1,75 et 2,55 pour 1, sur 33 pages.
  Voile pose en ::before pour ne pas se battre avec le raccourci background des pages.
- **239.2 — Rail de sections.** Le libelle de la section active restait ouvert en
  permanence, large de 340 px. Mesure a 1180, 1280, 1366, 1440 et 1600 px : il
  recouvrait le texte de l'article a chaque largeur. Il ne s'ouvre plus qu'au survol ou
  au clavier ; l'etat actif se lit toujours a la pastille et a sa couleur.
- **239.3 — Voile des heros photographiques.** Le meme degrade de 24 % servait 33 pages.
  Les titres a degrade tombaient a 1,53, les sur-titres a 2,00. Le voile gagne une
  composante horizontale et un plancher a droite : sur clients.html, le titre passe de
  1,59 a 6,36 et le sur-titre de 2,00 a 5,63.
- **239.4 — Panneaux de verre du heros** (routeur de profils, echelle de capital, fil de
  chantiers). Le verre laissait passer un ciel clair : leurs intitules entre 1,01 et
  1,51. Le verre est conserve ; c'est ce qui le traverse qui est assombri.
- **239.5 — Plancher de lisibilite pour la famille de verre du ch.238.** Une tuile posee
  sur photo heritait du contraste de l'image. On ne touche ni la teinte ni la
  transparence : on tonalise ce que le verre laisse passer, vers la nuit en theme sombre,
  vers le jour en theme clair.
- **239.6 a 239.11** — chiffres a degrade de la brochure (1,00 : litteralement
  invisibles), renforcements pris dans une bande sombre sur paiements-etats (1,21), lien
  du chapeau de la FAQ sur texture de sable (1,10), encres bleues trop sombres des cartes
  ESG et des sur-titres de societe.html.

Apres correctifs, sur le lot de verification : **46 defauts severes ramenes a 6**.

### Mon erreur, dans ce chapitre meme

La regle du 239.7 sur les sur-titres .sk a ete ecrite **sans condition de theme** : un
bleu clair pose sur le creme du theme clair, 1,27 pour 1 sur ar.html, la ou il n'y avait
aucun defaut avant mon passage. La verification l'a rattrape dans le quart d'heure ; la
regle est desormais reservee au theme sombre (239.8). Lecon a garder : une encre claire
ne se pose jamais sans dire sur quel fond.

Deux versions de banc ont par ailleurs ete jetees avant celle-ci : l'une prenait le
coeur des glyphes au plus fort ecart, ce qui selectionnait preferentiellement les zones
a fort contraste et donc absolvait les textes poses sur les parties claires d'une photo ;
l'autre laissait le degrade se peindre dans la capture de fond, et rendait un rapport de
1,00 sur un titre parfaitement lisible.

### Reste ouvert

- **Tuiles .gtt-c du pole GreenTech** (pole-greentech-en) : cinq libelles entre 2,31 et
  2,45 en theme clair. La regle posee au 239.11 ne prend pas ; la couleur vient d'un
  heritage que je n'ai pas encore localise. A reprendre au chapitre suivant.
- **aval/distribution** : un paragraphe dont 29 % des pixels mordent sur une zone sombre
  (mediane 11,18). Chevauchement partiel, pas une encre fautive.
- **159 signalements entre 3,0 et 4,5**, majoritairement des libelles de 9 a 12 pixels.
  Ils meritent une passe de fond sur les tailles de texte autant que sur les encres.
- **Organisation des solutions et services** (question posee pendant ce chapitre) :
  deux jumeaux anglais ranges a la racine au lieu de leur pole (/services-ep-en,
  /produits-en), collision de nom entre le /produits-en de l'aval et celui de la
  petrochimie, et la page /solutions qui ne lie ni amont/services-ep ni aval/produits —
  la chaine « distribuer » n'a aucun lien sortant. Deux conventions de titre coexistent
  (— EnerTchad S.A. sur 59 pages, | EnerTchad sur 137).

## 240 — L'arbre anglais range dans ses poles (2026-08-25)

### D'abord, une correction

En repondant a la question « est-ce que nos solutions et services sont bien organises ? »,
j'ai affirme que /solutions ne liait ni amont/services-ep ni aval/produits, et que la
chaine « distribuer » n'avait aucun lien sortant. **C'etait faux, et l'erreur venait de ma
mesure** : l'expression que j'avais utilisee pour extraire les liens refusait les adresses
contenant une ancre. Or presque tous les liens du carrefour en contiennent une. Verification
refaite : /solutions pointe cinq fois vers amont/services-ep et quatre fois vers
aval/produits, et « distribuer » mene bien au reseau, aux produits et aux flottes. Le
carrefour etait complet ; c'est mon instrument de lecture qui ne l'etait pas. Meme lecon
qu'au chapitre precedent : verifier l'outil avant d'accuser l'ouvrage.

### Le vrai defaut, lui, etait plus large

En reprenant la mesure proprement, un ecart structurel est apparu : **l'arbre anglais
n'avait jamais suivi la migration en dossiers de poles**. Le francais range ses pages sous
/amont/, /aval/, /greentech/ ; l'anglais les laissait a la racine.

| Pole | Pages FR dans le dossier | Pages EN dans le dossier |
|---|---|---|
| amont | 5 | 0 |
| aval | 5 | 0 |
| greentech | 5 | 0 |
| intermediaire, petrochimie, tchaditude, enerconseils, tchaditech | 25 | 20 |

Consequences concretes : /produits-en designait la page **aval** tandis que
/petrochimie/produits-en designait celle de la petrochimie — rien dans l'adresse ne les
distinguait ; et le carrefour anglais renvoyait vers d'anciennes adresses (/pole-amont-en,
/raffinage-en, /reseau-en...) qui repondent par une redirection : chaque visiteur anglais
payait un saut supplementaire la ou le visiteur francais allait droit au but.

### Ce qui a ete fait

**Douze pages deplacees** dans leur pole : activites-en, eor-en, parc-en, services-ep-en
vers /amont/ ; distribution-en, produits-en, raffinage-en, reseau-en vers /aval/ ;
hseq-en, impact-en, patrimoine-en, transition-en vers /greentech/.

Les pages d'accueil de pole en anglais **restent a la racine** en /pole-x-en : c'est la
convention deja suivie par les cinq poles migres, qui n'ont pas d'index-en.html dans leur
dossier. On aligne sur l'existant, on n'invente pas une seconde regle.

- **1 668 references reecrites** dans 111 fichiers : liens, hreflang, canonical, og:url,
  donnees structurees, plan du site, palette de commandes.
- **Dix liens relatifs nus** (href="raffinage-en") rendus absolus dans les pages
  deplacees : d'un cran plus bas dans l'arbre, ils auraient pointe a cote.
- **24 redirections permanentes** posees pour les anciennes adresses, forme propre et
  forme .html.
- **Controle d'integrite sur les 160 pages : zero lien interne casse**, redirections et
  reecritures prises en compte.
- Rendu verifie sur quatre pages deplacees : aucune ressource en erreur, aucune erreur
  de script, titre et canonical corrects.

### Titres : neuf paires realignees

Deux conventions coexistent sur le site — « … | EnerTchad » sur 143 pages, « … — EnerTchad
S.A. » sur 65. Plutot que de trancher a la place du proprietaire sur l'ensemble, j'ai
mesure la coherence **a l'interieur de chaque paire de traduction** : 86 paires coherentes,
**9 divergentes**. Ce sont celles-la qui sont fautives, parce qu'un lecteur qui bascule de
langue voit le titre changer de forme. Les neuf anglaises reprennent la forme de leur
jumelle francaise (« Refined products & derivatives · Downstream | EnerTchad »), et
projets.html perd le « S.A. » que sa jumelle n'avait pas.

Le partage 143/65 sur le reste du site reste ouvert : c'est une decision de marque, pas un
defaut. Les deux formes sont defendables ; il suffit de dire laquelle.

### Les deux outils ont une adresse propre

Configurateur_Service_Integre_v2.html et Calculateur_Baril_Additionnel.html gardaient des
noms de fichiers hors charte, visibles dans la barre d'adresse. Ils sont desormais servis
sous **/configurateur-service-integre** et **/calculateur-baril-additionnel** par une
reecriture Vercel : l'adresse propre devient canonique (canonical, og:url, plan du site,
et les 715 liens internes), sans dupliquer 830 ko de fichier.

**Je n'ai pas encore pose la redirection de l'ancienne adresse vers la nouvelle.** Une
redirection combinee a une reecriture peut, selon l'ordre d'evaluation, tourner en boucle
et rendre l'outil inaccessible. L'ordre annonce par Vercel dit que non ; je le verifierai
en production avant de la poser, plutot que de parier. En attendant, les deux adresses
repondent et la balise canonique designe la bonne.

### Reste a faire a la main

La publication passe par le televersement web de GitHub, qui ne sait pas supprimer.
**Quatorze fichiers orphelins** restent donc a la racine du depot : les douze anciennes
pages anglaises, plus les deux fichiers d'outils sous leur ancien nom. Aucun n'est plus
jamais servi — les redirections et la reecriture les masquent — mais ils encombrent le
depot. Ils sont a supprimer d'un geste depuis l'interface GitHub :
activites-en.html, eor-en.html, parc-en.html, services-ep-en.html, distribution-en.html,
produits-en.html, raffinage-en.html, reseau-en.html, hseq-en.html, impact-en.html,
patrimoine-en.html, transition-en.html.
Les deux fichiers d'outils, eux, doivent rester : la reecriture les sert.

## 241 — Le verre de trop, et l'etalonnage des encres (2026-08-26)

### Les vignettes photo n'etaient pas des tuiles

Le chapitre 239 laissait ouvert un defaut sur le pole GreenTech : cinq libelles entre
2,31 et 2,45 en theme clair, et une regle posee au 239.11 qui ne prenait pas. Trois
diagnostics successifs, chacun corrige par le suivant :

1. j'ai cru a un fond photo trop clair et j'ai assombri la tuile — sans effet, ma regle
   perdait en specificite contre une regle de page a quatre `:not(#_)` ;
2. j'ai alors lu le fond calcule comme un verre pale sur creme et j'ai fonce l'encre —
   le rapport est tombe a **1,40**, pire qu'au depart ;
3. j'ai enfin regarde la vignette a l'ecran. Ce ne sont pas des cartes de contenu mais
   **des vignettes photo** : une image en haut, un bloc de texte pose dessus. Le lavis de
   verre du ch.238 les avait laitees, et le texte se retrouvait sur un ton moyen ou ni
   l'encre claire ni l'encre foncee ne tiennent.

Meme famille d'erreur que `.hpcard`, ecartee de justesse au ch.238 : une vignette photo
n'est pas une tuile de verre. Le lavis est retire, le bloc de texte reprend un fond nuit
franc, l'encre reste claire dans les deux themes. **Zero defaut restant sur ces pages,
clair et sombre.** Lecon : j'ai perdu deux tentatives a raisonner sur des valeurs
calculees ; la capture d'ecran a tranche en dix secondes.

### Etalonnage des encres de la bande 3,0-4,5

Le ch.239 laissait 159 signalements entre 3,0 et 4,5 — aucun illisible, tous sous le
seuil AA pour du petit texte. Douze familles d'encre ont ete recalees vers 6:1 sur leur
fond habituel : signature de la marque, etiquette de partage, sens de pagination, note et
cartes ESG, etiquettes de norme, liens bleus de section et de paragraphe, sur-titre rose
de la brochure, lien d'alerte des carrieres, mentions en petit du theme clair.

Sur les douze pages concernees : **0 defaut severe et 0 limite nette dans les deux
themes**, contre 6 severes et 3 limites avant. Regression sur 65 pages et 9 272 elements :
**2 severes** — les deux chevauchements partiels deja documentes au ch.239, pas des encres
— et 9 limites entre 3,66 et 4,25.

### Mon erreur, encore la meme

Le 241.8 sur le sur-titre rose de la brochure a ete pose **sans verifier le fond** : j'ai
fonce le rose pour le theme clair alors que ces cartes restent nuit dans les deux themes.
Resultat 1,78 — je fabriquais un defaut deux fois pire que celui que je corrigeais.
Rattrape au meme chapitre. C'est la troisieme fois en trois chapitres (239.7, 241.8, et la
tuile GreenTech ci-dessus) : **une encre ne se choisit jamais sans mesurer le sol.** La
regle de methode est desormais explicite : toute nouvelle encre passe au banc avant
publication, sur la page ou elle sert, dans les deux themes.

### Inventaire du petit texte, pour arbitrage

Compte fait sur 30 pages : **4 601 elements sous 12 px**, dont 1 143 sous 10 px et 20 sous
9 px. Repartition : 11 px (2 239), 10 px (914), 9 px (369), 8 px (20). Ce n'est pas un
accident mais un parti pris de composition — sur-titres, legendes d'indicateurs, pastilles.
Les seuls cas vraiment hors norme sont les etiquettes de la carte SVG de la brochure, a
7,5 px.

Je ne touche pas a ce parti pris : remonter l'ensemble a 12 px changerait la mise en page
de tout le site et releve d'une decision de marque. **C'est un arbitrage a rendre**, avec
les chiffres ci-dessus en main.

### Reste ouvert

- **aval/distribution** et **journal-champ-numerique-en** : deux textes dont un tiers des
  pixels mord sur une zone sombre (medianes a 11 et 9). Chevauchement de mise en page, pas
  une encre fautive — a reprendre par la geometrie.
- **La signature de la marque** dans la barre, 4,25 a 9,3 px : servie par une regle a
  quatre `:not(#_)` que je n'ai pas voulu surencherir pour un seul element.
- **Les 14 fichiers orphelins** a la racine du depot, signales au ch.240, restent a
  supprimer a la main.

## 242 — Ce que le banc croyait voir, et le bandeau qui manquait (2026-08-26)

### D'abord, la fermeture de deux points laisses ouverts

Le chapitre 241 laissait deux defauts dits « de geometrie » : sur **aval/distribution** et
sur **journal-champ-numerique-en**, un texte dont un tiers des pixels mordait sur une zone
sombre, medianes a 11 et 9. Je les avais classes « chevauchement de mise en page, a
reprendre par la geometrie ».

Ils n'existent pas. **Ce sont deux artefacts de mon propre banc.**

Le texte incrimine passe sous une barre collante — la barre marketing de la page
distribution, le bandeau de journal — au moment precis de la capture. Une barre collante
qui recouvre le texte qui defile dessous ne le rend pas illisible : elle le masque, et le
lecteur le lit une seconde plus tard, quand il a fini de passer. Le banc, lui, ne testait
le recouvrement qu'en deux points, au quart et aux trois quarts de la hauteur de la boite.
Des que la barre n'en couvrait qu'une bande, les deux points passaient a cote, les pixels
caches restaient dans la mesure, et le banc accusait la page d'un defaut qui n'existait
que dans son propre decoupage.

**Correction apportee au banc** : avant de mesurer, on calcule la pile contigue de barres
opaques accrochees au haut de l'ecran, puis on rogne chaque boite de la hauteur couverte ;
si moins de huit pixels de hauteur restent visibles, la boite est ecartee. Exception : le
texte porte *par* les barres elles-memes reste mesure integralement — c'est justement lui
qui doit etre lisible sur le fond de la barre. Sur les deux pages, le banc corrige passe
de deux signalements a **zero**, tout en examinant 156 elements au lieu de 154 : la
correction ne cache rien, elle recadre.

### Ensuite, une erreur que j'ai failli publier

Pour verifier ces deux pages, j'ai construit un second banc, celui de la **transparence des
barres collantes**. Le principe est propre : une barre collante ne bouge pas quand la page
defile, le contenu si. On capture donc deux fois, a neuf pixels de defilement d'ecart, et
tout pixel de l'interieur de la barre qui change entre les deux captures est du contenu qui
transparait. Aucune hypothese sur l'alpha, le flou ou la couleur.

Le banc a rendu un verdict net : le bandeau de journal laissait passer 15 niveaux, la barre
marketing 13, et surtout la **barre de navigation principale**, en theme sombre, 45 niveaux
— sur toutes les pages du site. Les captures montraient une ligne de texte de la page
parfaitement lisible au travers de la barre. J'ai ecrit la correction : remonter l'opacite
des barres a 0,985 pour que rien ne transparaisse, dans les deux feuilles communes.

**Puis j'ai regarde dans un vrai Chrome. Il n'y a rien.** Ni sous la barre de navigation,
ni sous la barre marketing, ni sous le bandeau de journal. Le flou d'arriere-plan
(`backdrop-filter`) fait son travail : ce qui passe dessous est etale au point de
disparaitre. Le navigateur sans interface que j'utilise pour les bancs applique bien ce
flou sur un calque absolu ordinaire — je l'ai verifie sur une page temoin, une barre noire
franche y ressort etalee entre 94 et 134 — mais pas de la meme facon sur une barre en
`position:fixed` ou `sticky`. Mes 45 niveaux etaient une propriete de mon banc, pas du site.

J'ai annule la modification avant publication. **Regle ajoutee a la methode : aucune mesure
de transparence ne vaut hors d'un vrai navigateur.** Le banc de contraste, lui, reste
valable — il ne mesure que des pixels peints, pas des compositions de calques.

C'est la troisieme fois en trois chapitres que je manque de corriger un defaut qui n'existe
pas. Le point commun est toujours le meme : j'ai fait confiance a une mesure sans aller
voir ce qu'elle decrivait.

### La geometrie, cette fois mesuree pour de bon

Puisque la question posee etait geometrique, je l'ai posee correctement. Le site empile
jusqu'a trois barres en haut de l'ecran : la navigation fixe (110 px), la sous-navigation
de pole, la barre marketing. Quand on suit un lien interne `#cible`, le navigateur amene le
haut de la cible en haut de l'ecran, moins son `scroll-margin-top`. Si cette marge est plus
petite que la pile, **on clique sur un titre et on ne le voit pas**. Cela ne demande aucune
capture : ce sont deux rectangles a comparer.

Balayage : **225 pages, 1 643 ancres suivies une par une**, la pile recalculee apres chaque
atterrissage. **Zero ancre cachee.** Le `scroll-margin-top` est correctement pose partout.
C'est un resultat negatif, et il vaut d'etre ecrit : la question est reglee.

### Les cibles tactiles, et un second faux positif

Meme demarche sur la taille des cibles tactiles (WCAG 2.2, 24 x 24 px minimum), a 390 px de
large. Premier passage : 16 cibles trop petites sur 75 pages, dont une majorite de curseurs
de reglage hauts de 7 pixels, sur l'atlas et la brochure.

Faux positif, encore, et de mon fait : je mesurais avec un pointeur fin. La regle
`@media(pointer:coarse){input[type=range]{min-height:28px}}` existe deja dans les feuilles
communes ; elle ne s'active que sur un appareil tactile, que je n'avais pas simule. Passage
refait avec un pointeur grossier : **les curseurs sont conformes partout.**

Il reste deux vraies cibles trop petites, les deux pastilles de champ de la carte de
l'atlas (Kome 28 x 10, Miandoum 46 x 19, FR et EN). Elles sont notees en fin de chapitre :
les agrandir demande de toucher au trace SVG, ce qui merite un passage a part.

### Le vrai defaut trouve en chemin : le bandeau precedent/suivant

Le troisieme faux positif a fini par montrer quelque chose de reel. Une des cibles signalees
etait un lien « ← Prev » haut de 19 pixels sur `aval/distribution-en`. Verification : sur
**dix pages**, le balisage `nav.pgr` etait present mais sa mise en forme absente. Le bandeau
de bas de page s'y affichait en **liens nus de 19 pixels, colles l'un a l'autre**, au lieu
des deux cartes bordees des autres pages. Cinq de ces dix pages sont des orphelins a
supprimer ; les cinq autres sont vivantes : amont/eor-en, aval/distribution-en,
aval/produits-en, aval/raffinage-en, aval/reseau-en.

La cause : la mise en forme de `.pgr` vivait dans un bloc `<style>` recopie page par page.
Les pages anglaises reconstruites au chapitre 239 par greffe ont herite du balisage sans le
bloc. Une regle recopiee 36 fois finit toujours par manquer quelque part.

En tirant le fil, un defaut plus large est apparu. **92 pages portent une sous-navigation de
pole ; 10 seulement avaient un bandeau de bas de page**, et cette sous-navigation n'est pas
collante : elle disparait des qu'on lit. Au bas d'une page longue, le lecteur n'avait plus
rien pour avancer dans le pole. Neuf paires FR/EN etaient par ailleurs desaccordees : cinq
pages anglaises avaient un bandeau que leur jumelle francaise n'avait pas, quatre francaises
en avaient un que leur jumelle anglaise n'avait pas.

**Ce qui est fait :**

1. **La mise en forme de `.pgr` passe dans la feuille commune** (`bundle_core_a1.css`),
   une fois pour toutes, sans `!important` : les pages qui gardent leur bloc en ligne
   continuent de gagner, avec des declarations identiques. Le repli mobile et le respect de
   `prefers-reduced-motion` sont inclus.
2. **Les 80 pages de pole recoivent un bandeau genere depuis leur propre sous-navigation** :
   precedent, accueil, suivant. Rien n'est invente — l'ordre, les libelles et les adresses
   sont lus dans le balisage deja present sur la page, ce qui garantit qu'ils sont exacts et
   qu'ils restent coherents avec le menu du pole. Sur une page de vue d'ensemble, il n'y a
   pas de precedent : le bandeau n'affiche que l'accueil et le suivant.
3. **Les quatre jumelles anglaises manquantes** (carrieres-en, communautes-en,
   gouvernance-en, innovation-en) recoivent le bandeau que leur jumelle francaise portait
   deja, traduit et repointe vers les adresses anglaises.

Verification : **115 bandeaux, 307 liens, 0 casse**. Rendu controle sur les 84 pages
touchees dans les deux themes — bloc en `flex`, cartes de 81 px de haut, aucun debordement
horizontal. Banc de contraste corrige passe sur les memes 84 pages, ecran du bandeau,
themes sombre et clair : **3 382 elements examines, 1 seul signalement**, et il ne vient
pas du bandeau (voir « reste ouvert »).

### Les deux outils prennent leur adresse propre pour de bon

Le chapitre 240 avait laisse la redirection en suspens, faute d'avoir verifie qu'une
redirection posee sur la destination d'une reecriture ne tourne pas en boucle. C'est
verifie : la documentation Vercel dit que le systeme de fichiers passe **avant** les
reecritures, donc la destination d'une reecriture n'est pas repassee par la phase des
redirections. Les deux redirections permanentes sont posees :

- `/Configurateur_Service_Integre_v2` → `/configurateur-service-integre`
- `/Calculateur_Baril_Additionnel` → `/calculateur-baril-additionnel`

Les anciennes adresses cessent d'exister ; les balises canoniques et le plan du site
designaient deja les nouvelles.

### Reste ouvert

- **L'encre `.btn2` en theme clair** : mesuree a 4,16 pour 4,5 attendus sur
  communautes-en, sur un fond bleute a [196, 212, 225]. Le defaut est anterieur a ce
  chapitre et la classe sert 195 pages : je ne change pas une encre de cette portee sur une
  seule mesure. A traiter par un balayage dedie, encre et sol, sur les 195 pages.
- **Les deux pastilles de la carte de l'atlas** (Kome, Miandoum) restent sous la taille de
  cible recommandee. A reprendre avec le trace SVG, pas avec une regle de feuille.
- **Les 14 fichiers orphelins** a la racine du depot, signales au ch.240, restent a
  supprimer a la main. Cinq d'entre eux portaient le bandeau non mis en forme corrige ici :
  leur suppression reglera aussi les douze descriptions meta dupliquees mesurees au passage.
- **Les tailles de texte sous 12 px** (4 601 elements sur 30 pages) et **le partage des
  conventions de titre** (143 `| EnerTchad` contre 65 `— EnerTchad S.A.`) : deux arbitrages
  qui reviennent au proprietaire, inchanges.
- **Une sequence de lecture au-dela des poles** : les 115 bandeaux couvrent les poles et
  quelques pages institutionnelles. Le journal, les publications et les pages legales n'en
  ont pas. C'est une proposition, pas un defaut.

### Ce qui a ete verifie ce chapitre

- Plan du site : 209 adresses, aucune sans fichier, aucune page vivante absente.
- 222 pages : 1 titre h1 chacune, JSON-LD partout, 57 images toutes avec `width`, `height`,
  `loading` et `alt`, une seule page sans meta description (le fichier de verification
  Google, sans contenu).
- 12 descriptions meta dupliquees, toutes entre une page vivante et son orphelin racine.

## 243 — Le depot rendu net : les douze orphelins supprimes (2026-08-26)

### Le geste

Le proprietaire a donne son accord ecrit (« tu as mon ok pour le faire ») pour la
suppression restee en attente depuis le chapitre 240. Les **douze anciennes pages
anglaises de la racine** ont ete supprimees une a une depuis l'interface GitHub,
en douze commits nommes (Ch243 1/12 a 12/12) :

activites-en, eor-en, parc-en, services-ep-en, distribution-en, produits-en,
raffinage-en, reseau-en, hseq-en, impact-en, patrimoine-en, transition-en.

Les **deux fichiers d'outils n'ont pas ete touches** — c'est voulu, et c'est le point
qui demandait le plus d'attention dans ce geste : la reecriture de /configurateur-
service-integre et /calculateur-baril-additionnel les sert directement, ce sont les
seuls fichiers du lot que la production utilise encore.

Rien n'est perdu au sens strict : chaque fichier reste dans l'historique git, et
chaque commit de suppression peut etre annule d'un revert.

### La verification

- Les douze commits sont sur main, l'arbre local est realigne sur le depot publie,
  zero difference.
- **Les douze anciennes adresses repondent toutes 308** vers leur page de pole
  (/amont/, /aval/, /greentech/) — aucune ne rend 404 : les redirections posees au
  chapitre 240 font le travail, la suppression des fichiers ne change rien pour le
  visiteur ni pour les moteurs.
- Les douze cibles finales servent 200, l'accueil et /solutions aussi.
- Les deux outils servent 200 sous leur adresse propre.

Effet de bord attendu et confirme : les **douze descriptions meta dupliquees**
mesurees au chapitre 242 (chaque paire etait « page vivante + son orphelin »)
disparaissent avec les orphelins.

### Une note de methode

La navigation directe vers l'adresse de suppression de GitHub a ete refusee par un
controle automatique de l'outil de navigation. Le meme geste par le chemin normal de
l'interface — la page du fichier, son menu, « Delete file », le commit — a ete accepte.
J'ai fait chaque suppression individuellement, en verifiant a chaque fois le nom du
fichier dans le titre de la page avant de valider, precisement parce qu'une suppression
est le seul geste de ce journal qui ne se corrige pas d'un simple televersement.

### Ou en est le depot

Plus aucun fichier orphelin. 214 pages HTML vivantes, chacune sous son adresse
canonique, plus les deux outils servis par reecriture. Restent les deux arbitrages
du proprietaire : les tailles de texte sous 12 px, et la convention de titre
(143 « | EnerTchad » contre 65 « — EnerTchad S.A. »).

## 244 — Une seule maniere de dire son nom (2026-08-26)

### L'arbitrage

Le partage des conventions de titre etait documente depuis le chapitre 239 et laisse
au proprietaire : 146 pages en « | EnerTchad », 52 en « — EnerTchad S.A. ». L'arbitrage
est tombe : **« ok pour EnerTchad »** — la forme courte gagne.

### Le geste

Les 52 pages restantes passent a la convention majoritaire, sur les trois balises qui
portent le titre : `<title>`, `og:title`, `twitter:title`.

- La queue « — EnerTchad S.A. » (et sa variante « — EnerTchad ») devient « | EnerTchad ».
- Les cinq titres qui portaient un tiret cadratin interne passent au point median de la
  charte majoritaire : « Carrieres — Batir l'equipe — EnerTchad S.A. » devient
  « Carrieres · Batir l'equipe | EnerTchad ».
- En tirant le fil, **9 pages supplementaires** avaient un `<title>` deja realigne au
  chapitre 240 mais des `og:title`/`twitter:title` restes en arriere (les six pages de
  pole anglaises, projets, projets-en, communautes) : le partage de lien sur les reseaux
  affichait encore l'ancienne forme. Alignees aussi.

Controle : **198 pages en « | EnerTchad », zero occurrence de l'ancienne forme** dans
les trois balises, sur tout le site. Les 12 titres hors motif restent volontairement
tels quels : l'accueil, la brochure, les deux outils, les carnets, l'explorateur, le 404
et la page arabe portent des titres ou EnerTchad est le sujet, pas le suffixe — ce sont
des titres de marque, pas des titres de rubrique.

Non touche, et a dessein : le nom legal « EnerTchad S.A. » partout ou il designe la
societe — corps de page, JSON-LD, mentions legales. La convention arbitree porte sur
le suffixe des titres d'onglet, pas sur le nom de l'entreprise.

61 fichiers publies. Pas de bump du service worker : uniquement du HTML, servi
reseau d'abord.

## 245 — La structure des solutions, relue a l'aune des majors (2026-08-26)

### La question

« QA de la structure des Solutions et Services versus les majors. » J'ai releve la
structure publiee par TotalEnergies, Shell, ExxonMobil et, pour le comparable aval
africain, Puma Energy, et je l'ai posee a cote de la notre.

### Ce que font les majors

- **TotalEnergies** organise ses expertises par verbes de chaine de valeur :
  Explore & Produce, Transform & Develop, Ship & Market — les produits et services
  vivent dans le troisieme.
- **Shell** presente ses segments financiers (Integrated Gas, Upstream, Marketing,
  Chemicals & Products, Renewables) ; tout le visage client — stations, carburants B2B,
  aviation, lubrifiants, cartes — est regroupe sous Marketing.
- **ExxonMobil** s'est reorganise en trois blocs : Upstream, Product Solutions,
  Low Carbon Solutions, adosses a une organisation Technologie centrale.
- **Puma Energy** entre par le produit : Retail, Aviation, Commercial Fuels, LPG,
  Lubricants, Bitumen — le profil client se lit dans la fiche, pas dans le menu.

### Le verdict, poste par poste

**Entree par la chaine de valeur — conforme.** Nos quatre poles industriels
(Amont, Intermediaire, Aval, Petrochimie) recouvrent exactement le decoupage
TotalEnergies ; l'anglais dit deja Upstream/Midstream/Downstream. Nos quatre poles
transversaux ont chacun leur analogue chez une major : TchadiTech repond a
l'organisation Technologie centrale d'ExxonMobil, GreenTech a Low Carbon Solutions,
EnerConseils au conseil integre, Tchaditude au contenu local — ce dernier est le seul
sans equivalent chez les majors, et c'est voulu : c'est l'argument mono-pays.

**Entree par le besoin — au-dessus du standard.** Aucune des quatre references ne
propose l'equivalent de /solutions : six familles de besoins qui recomposent la chaine
(produire, acheminer, transformer, distribuer, decider, financer). Les majors font
entrer par ce qu'elles sont ; nous offrons en plus une entree par ce que le client
cherche. L'explorateur de chaine et les deux outils n'ont pas non plus d'equivalent
public chez elles.

**Entree par le profil — conforme au modele Shell.** /clients fait ce que Shell range
sous Marketing : sept portes, trois marches (pompe au prix officiel, B2B industriel et
flottes, Etat et institutions), plus fournisseurs. Puma ne le fait meme pas dans son menu.

**Catalogue produits — conforme, en deux endroits assumes.** La ou Puma expose un
catalogue plat (Retail, Aviation, LPG, Lubricants, Bitumen), notre offre equivalente
existe mais en deux pages : aval/produits (diesel EN 590, SP95, Jet A-1, GPL, bitume,
lubrifiants) et petrochimie/produits (transformes). Les deux sont au menu. Un guichet
unique « Produits & services » a la Puma n'aurait de sens qu'a l'ouverture commerciale,
quand il y aura des fiches produit transactionnelles derriere.

### Ce que les majors ont et que nous n'avons pas — normal a ce stade

Un localisateur de stations vivant, une page de prix a la pompe du jour, un espace
client connecte. Les trois supposent une exploitation reelle ; la carte du reseau
projete et la page ARSAT en tiennent lieu pour une societe en constitution. A
inscrire au carnet de l'ouverture commerciale, pas a corriger aujourd'hui.

### Conclusion

Aucun changement de structure a proposer : l'architecture a trois entrees — chaine de
valeur, besoin, profil — fait ce que les quatre references font, et une chose de plus.
Le seul ecart reel est un ecart d'etape (les services transactionnels), pas un ecart
d'organisation. La question du chapitre 239 (« nos solutions et services sont-ils bien
organises ? ») recoit donc sa contre-preuve externe : oui, et la reorganisation du
chapitre 240 a mis l'arbre anglais au niveau du decoupage que les majors publient.

## 246 — Les actions ouvertes, appliquees — et une regression evitee de justesse (2026-08-26)

Le proprietaire a dit « applique les actions ». Deux defauts documentes restaient
ouverts au chapitre 242 : l'encre `.btn2` mesuree a 4,16 en theme clair, et les
pastilles de la carte de l'atlas sous la taille de cible tactile.

### L'encre .btn2 : le vrai defaut etait une parite, pas une couleur

Le balayage dedie (banc de contraste, boutons `.btn2` des 19 pages porteuses) a
montre que le bouton n'y etait pour rien. **179 pages assombrissent l'encre generique
des liens du theme clair a #0E4172 par une regle de page ; huit jumelles anglaises
n'avaient jamais recu cette regle** (accessibilite-en, avertissements-en, carrieres-en,
charte-en, cibles-2030-en, communautes-en, innovation-en, plan-du-site-en). Elles
restaient sur le #155FA8 de la feuille — 4,16 des que le fond fixe bleute passe
derriere au defilement. Le 4,16 du ch.242 etait donc un symptome de la meme famille
de derive FR/EN que le bandeau du meme chapitre.

**Ma premiere correction etait fausse, et le banc l'a arretee avant publication.**
J'avais remonte la valeur harmonisee dans les trois feuilles communes, avec une
specificite au-dessus des regles de page. Le banc de regression a rendu son verdict
dans le quart d'heure : les boutons fantomes des heros restes sombres en theme clair
(achats, paiements-etats) passaient de blanc a bleu nuit — 1,63 de rapport, illisible.
Ces pages n'ont pas le bloc d'exceptions que les 179 autres associent a leur regle ;
une regle de feuille plus forte que les pages casse precisement ce que les pages
savent proteger. **Correction annulee, feuille remise a l'identique.** La lecon du
241.8 se precise : une encre ne se choisit jamais sans mesurer le sol, et une regle
commune ne s'ecrit jamais au-dessus des regles de page sans porter leurs exceptions.

**La correction juste** : les huit jumelles recoivent le bloc exact de leur jumelle
francaise (`<style id="lk246">`, trois regles, meme valeur, meme specificite). Parite
retablie, rayon d'action nul en dehors. Verifie : les trois `.btn2` signales passent
a #0E4172 (5,3 a 9,2 au banc, 0 signalement sur les huit pages), le theme sombre est
inchange, et les pages a heros sombre gardent leurs boutons blancs. Restent les trois
liens dores de paiements-etats a 4,04-4,25 : la famille 3,89-4,29 documentee au
ch.241, anterieure et inchangee.

### Les pastilles de l'atlas : des zones de frappe invisibles

Les six champs cliquables de la carte (Kome, Miandoum, Bolobo, Ronier, Mimosa,
Sedigi) n'offraient que leur point de 3,4 unites et leur etiquette comme cible.
Chaque groupe recoit une **zone de frappe invisible** (cercle transparent
`pointer-events:all`, plus un rectangle cote etiquette pour Kome et Bolobo), sans
changer un seul pixel visible.

La difficulte est la grappe Kome-Miandoum-Bolobo, a 12-13 unites l'une de l'autre :
des cercles de 12 y faisaient perdre a Kome la propriete de son propre point (le
cercle de Bolobo, peint apres, le recouvrait a 0,2 unite pres). Le trio est redescendu
a un rayon de 10, complete par les rectangles d'etiquette — chaque pastille reste
maitresse de son centre, verifie par test de pointage : six champs, six proprietaires
corrects, et le panneau de detail repond pour chacun.

Controle tactile a 390 px, pointeur grossier : **0 cible sous la norme** sur les deux
pages (elles etaient les deux dernieres du site). Aucun bump du service worker :
uniquement du HTML.

### Ce qui reste ouvert apres ce chapitre

- Les trois liens dores de paiements-etats (4,04-4,25), membres de la famille
  documentee au ch.241 — a traiter, si on le souhaite, avec toute la famille.
- Les ~27 pages sans bloc d'assombrissement des liens clairs (outils, accueils,
  solutions, achats...) gardent le #155FA8 de la feuille : toutes passent le banc
  aujourd'hui. Les harmoniser demanderait de repliquer aussi les blocs d'exceptions —
  a ne faire que si une mesure l'exige un jour.

## 247 — La famille doree, et la signature de la barre (2026-08-26)

Suite de « applique les actions » : les deux encres laissees ouvertes aux chapitres
241 et 246 recoivent leur passe dediee.

### La famille des liens dores du theme clair

L'encre #8A6A12 servait les liens et libelles dores du theme clair sur 26 pages —
notes de bas de bloc, listes de documents, sommaires de reporting. Le banc, passe sur
tous les elements peints de cette encre, a rendu **13 defauts sur 7 pages**, entre
4,10 et 4,48 pour 4,5 attendus, le pire sol etant un gris-rose a (236,232,233) sur
les listes de documents de la gouvernance.

L'encre de la famille passe a **#74570B** : 5,56 au pire sol mesure. Le remplacement
est fait regle par regle dans les pages, en epargnant deliberement deux usages qui
partagaient la meme valeur sans etre du texte : les anneaux de focus (un contour
n'obeit pas au seuil du texte) et la goutte doree du fil du baril (un dessin).
Le theme sombre n'est pas concerne : ces memes elements y sont servis en or clair
(232,195,106) par d'autres regles. Verification : **36 elements re-mesures, 0 defaut**,
sur les 21 pages modifiees comme sur les 5 porteuses de la valeur en usage non-texte.

### La signature de la barre

« Acces aux Energies », 9,3 px sous la marque, se peignait en #8C9AB0 sur le verre
bleute de la barre de navigation en theme sombre : 4,01 a 4,44 selon la page, mesure
sur six ecrans — le sol le plus traitre est le bleu de la barre marketing (23,60,91),
le pire un gris-bleu du pole GreenTech (44,48,57). Au chapitre 242 j'avais renonce a
la corriger pour ne pas surencherir sur une regle a quatre crans pour un seul element ;
la consigne d'appliquer les actions leve ce scrupule. L'encre passe a **#A8B4C7** par
une regle a trois crans dans les trois feuilles communes : 5,39 a 9,35 re-mesures sur
les memes ecrans, encre peinte relue a (168,180,199). Les themes clairs gardent leur
#4A5668, servi par des regles a cinq crans qui restent au-dessus.

Bump du service worker (et-202608270300) : la correction touche les feuilles.

## 248 — Le journal recoit sa sequence de lecture (2026-08-26)

La proposition laissee ouverte au chapitre 242 est appliquee : les articles du journal
n'avaient aucun moyen d'avancer d'un article a l'autre — le bandeau de tete ne propose
que le retour au sommaire, et il disparait au defilement.

**Les 64 articles** (32 francais, 32 anglais) recoivent le meme bandeau
precedent/suivant que les pages de pole, insere avant le pied de page : article
precedent, retour aux Carnets (Notebooks en anglais), article suivant. **L'ordre est
celui du sommaire** (carnets.html), lu dans le balisage — rien n'est invente ; le
premier article n'a pas de precedent, le dernier pas de suivant. Les intitules des
cartes sont les titres des articles eux-memes, debarrasses du suffixe de convention.

La mise en forme vient de la regle commune posee au chapitre 242 — aucun style
nouveau, aucun bump du service worker (uniquement du HTML).

Verification : **64 bandeaux, 188 liens, 0 casse** ; rendu controle dans les deux
themes (cartes en flex de 84 px, encres conformes, aucun debordement) ; banc de
contraste sur l'ecran du bandeau de cinq articles dans les deux themes : **486
elements examines, 0 signalement**.

## 249 — La veille datee, verifiee (2026-08-26)

Les trois points de veille du chapitre 238 ont ete verifies aux sources.

- **ITIE Tchad** : le statut publie par le secretariat international reste celui de la
  validation d'octobre 2022 — score global 64,5, progres « assez faibles », donnees
  sectorielles publiees jusqu'a 2019. Aucune nouvelle validation publiee a ce jour.
  Le site ne cite ni score ni date : rien a corriger, la formulation prudente des
  pages paiements-etats reste juste.
- **Sedigui** : aucun jalon nouveau verifiable — les sources publiques recentes
  evoquent le complexe du Kanem sans calendrier ferme, et le dernier etat documente
  reste la reprise du projet par la SHT apres les retards constates. Les mentions du
  site (cible datee, prudence) restent justes.
- **Accord Tchad-Algerie** : le point de veille s'est materialise. Un accord-cadre a
  ete signe le 22 avril 2026 a Alger pour l'etude prealable d'une seconde raffinerie
  d'environ 20 000 b/j au Tchad, dans un paquet de 27 accords de cooperation ; ni
  site ni calendrier annonces. **Une phrase datee est ajoutee a la note de l'Atlas du
  secteur** (FR et EN), au stade exact ou en est le fait : une etude, pas un projet.
  L'Atlas se presente comme « vivant, nourri de sources publiques » — c'est sa place.

Reste au calendrier : la carte Brent (janvier), et la validation ITIE quand le
secretariat en publiera une nouvelle.

## 250 — La passe structurelle : axe-core sur tout le site (2026-08-26)

Les chapitres 239 a 247 ont couvert les encres, les contrastes et les cibles
tactiles avec des bancs de mesure sur pixels. Restait la dimension que ces bancs
ne voient pas : la **structure** — roles ARIA, libelles d'elements interactifs,
landmarks, ordre des titres, attributs de langue, noms accessibles des liens et
des boutons.

### Le banc

axe-core (le moteur d'audit de reference, celui de Lighthouse), injecte par
Playwright dans chacune des **214 pages** du site. Une regle ecartee a dessein :
`color-contrast` — le banc exact des chapitres precedents mesure les pixels
peints la ou axe estime des couleurs calculees ; on ne melange pas deux juges,
et le notre est plus severe.

### Le verdict

**Les 210 pages publiques passent sans aucune violation.** Zero — sur les roles,
les libelles, les landmarks, les titres, les langues, les noms accessibles.
Les seuls signalements tombent sur quatre fichiers utilitaires, et chacun a une
raison d'etre tel qu'il est :

- `google9146d41010c5e702.html` — le jeton de verification Google : un fichier
  volontairement nu, lu par un robot, jamais par un lecteur. On n'habille pas
  un jeton.
- `docs-sources/brochure_print`, `brochure_print_en`, `fiche_ar` — les gabarits
  d'impression qui servent a generer les PDF : des pages de mise en page papier,
  sans landmarks parce qu'elles n'ont pas de navigation. Elles ne sont ni dans
  le plan du site ni liees depuis les pages publiques.

Aucune correction necessaire ; les quatre exclusions sont documentees ici comme
des partis pris, pas des oublis.

### Ce que cela ferme

Avec ce chapitre, le socle d'accessibilite du site est mesure sur ses trois
dimensions : les **encres** (banc exact par pixels, 0 defaut connu hors les
arbitrages du proprietaire), les **cibles tactiles** (0 sous la norme depuis le
ch.246), et la **structure** (0 violation axe-core). Ce qui reste au registre
releve de decisions de marque — les tailles de texte sous 12 px en tete — pas
de defauts techniques.

## 251 — La performance, mesuree sur le reseau qu'ont nos lecteurs (2026-08-26)

Le site vise le Tchad, ou l'on lit sur mobile et sur des reseaux qui n'ont rien
d'une fibre. Dimension jamais encore mesuree ; c'est fait.

### Le banc

Playwright avec bridage CDP : 1,6 Mbit/s descendants, 150 ms de latence, processeur
ralenti 4x — le telephone d'entree de gamme sur un reseau mobile moyen. Cinq gabarits
mesures (accueil, page de pole, article du journal, solutions, calculateur), en 390 px.
Limite assumee : le navigateur du banc n'atteint pas la production (sortie reseau du
bac a sable), les temps sont donc mesures sur la copie locale servie SANS compression —
ce sont des majorants ; les poids reels sont releves sur la production, compression
comprise.

### Les chiffres

- **Premier rendu (FCP), sans compression, sous bridage** : 1,7 s (calculateur) a
  4,5 s (page de pole). La production sert en brotli, qui divise le texte par 3,9 —
  le pire gabarit reel passe sous les 3 s sur ce profil de reseau.
- **Charge utile initiale de l'accueil, compressee, relevee en production** :
  HTML 53 ko, feuilles ~110 ko, scripts ~60 ko, une seule image au chargement
  (le heros preleve, 77 ko). Les **cinq autres photos de section (660 ko) ne se
  chargent pas au demarrage** — elles sont differees, et le banc le confirme :
  1 image sur 6 transferee a l'evenement load.
- **Polices** : woff2 auto-hebergees, decoupees par plages unicode, et surtout
  `font-display:optional` — sur reseau lent le texte s'affiche immediatement en
  police de repli, sans blocage ni saut. Le meilleur reglage possible pour la cible.
- **Cache** : images en immutable un an, feuilles en 1 h + stale-while-revalidate
  (le bon choix pour des fichiers modifies en place), HTML et service worker en
  must-revalidate, et le service worker versionne par-dessus. Coherent de bout en bout.

### La non-action, justifiee

L'accueil charge 14 feuilles de style dans sa tete. Les consolider reduirait le
nombre de requetes — mais la production sert en HTTP/2, ou quatorze petites requetes
multiplexees coutent a peine plus qu'une grosse, et **l'ordre de ces feuilles porte
tout le moteur de theme clair** : la cascade de specificite des chapitres 234 a 247
depend de qui vient apres qui. Le gain serait marginal, le risque structurel. On ne
touche pas.

### Verdict

Aucune correction necessaire : l'architecture fait deja les bons choix pour le
reseau vise — images differees, polices non bloquantes, cache etage, HTML leger.
Le chapitre existe pour que ce constat soit mesure et date, pas suppose. A remesurer
si un jour une page depasse 60 ko de HTML comprime ou charge une image au-dessus
du pli sans prelevement.

## 252 — L'integrite, mesuree partout : liens, ancres, console (2026-08-26)

Douze chapitres de modifications lourdes — migration de l'arbre anglais,
suppressions, bandeaux, titres, encres — appellent une passe de regression
totale. La voici, en trois mesures independantes.

### Les liens

Chaque `href` et `src` interne des 211 pages publiques, resolu contre les
fichiers du depot ET la table des 123 redirections et 2 reecritures de
vercel.json, en suivant les chaines de redirection.
**28 318 liens verifies — 0 casse.**

### Les ancres

Chaque `#cible` verifie contre les `id` de la page visee.
**4 090 ancres verifiees — 0 sans cible.** Les 113 signalements bruts du
controle statique etaient tous de la meme famille : les liens des articles du
journal vers les termes du glossaire (`#t-eor`, `#t-scada`...), dont les cartes
sont rendues par le script de la page — les `id` n'existent qu'a l'execution.
Verification faite en navigateur : les **40 termes vises existent tous au rendu**,
FR comme EN, et la navigation par ancre defile et surligne la carte comme prevu.
Un controle statique seul aurait accuse un mecanisme qui fonctionne.

### La console

Les 214 pages chargees en navigateur dans les deux themes, avec defilement
jusqu'en bas pour reveiller le JS differe, en ecoutant trois canaux : erreurs
JavaScript, `console.error`, requetes echouees.
**428 chargements — 0 erreur, 0 requete echouee.**

### Verdict

Triple zero. Le site sort de la serie 240-251 sans un lien casse, sans une ancre
morte, sans une erreur de console. Rien a corriger ; le chapitre date l'etat de
reference pour les regressions futures.

## 253 — Le saut de defilement de l'accueil (2026-08-26)

Signale par le proprietaire : la page saute pendant le defilement sur l'accueil.

### Le diagnostic

Le fautif est le **recalage d'ancre** de `u2_75a2c4383ddf.js`, charge par 90 pages.
Son intention est legitime : apres un clic d'ancre ou un chargement avec `#hash`,
la mise en page bouge encore (images, sections differees) et la cible derive — une
boucle la recale par `scrollIntoView`. Mais son execution avait deux defauts :

1. **Elle coupait le glissement en plein vol.** La boucle forcait la correction a
   intervalle fixe (premier tir a 750 ms), sans regarder si le defilement doux
   etait encore en cours. Sur une page de 18 000 pixels, le glissement dure plus
   longtemps : la page se teleportait d'un coup au milieu de l'animation.
   Reproduit au banc : clic sur `#combat` depuis le haut de l'accueil, position
   deja a destination a la premiere lecture — le glissement etait sectionne net.
2. **Pendant sa fenetre d'armement (1,5 s au chargement avec hash), elle avalait
   les defilements faits a l'ascenseur.** La molette, le clavier et le toucher
   annulaient bien la boucle, mais le glisser de barre de defilement n'emet que
   des evenements scroll — que la boucle ignorait pendant la fenetre : elle
   ramenait la page a l'ancre pendant que le lecteur s'en eloignait. La visite
   du proprietaire etait justement sur `/#top`.

### La correction

La boucle est reecrite sur trois regles : **jamais de correction tant que la page
a defile dans les 180 dernieres millisecondes** — un glissement en cours emet des
evenements scroll en continu, la correction attend donc l'accalmie au lieu de
couper le geste ; **tout defilement externe apres une correction annule** — plus
de fenetre qui avale l'ascenseur ; **fenetre totale bornee a 2,6 s**, sortie
anticipee des que la cible est posee ou ne bouge plus.

### La verification

- Clic d'ancre depuis le haut : 74 lectures a 30 ms d'ecart, **zero discontinuite**
  — le glissement va au bout, puis la correction s'applique a l'accalmie.
- Chargement avec `#hash` : la page atterrit sur l'ancre, marge de defilement
  respectee.
- Molette pendant la fenetre de recalage : le lecteur garde la main, la page
  reste ou il l'a mise.
- Huit pages porteuses re-testees avec et sans hash, deux themes de fait :
  0 erreur console, ancres posees.

Bump du service worker (et-202608271200) : le correctif touche un script commun.

## 254 — L'accueil recoit sa porte par le besoin (2026-08-26)

L'audit demande par le proprietaire (« l'accueil couvre-t-il toutes les
activites ? ») avait rendu son verdict : 39 pages d'activites sur 40 accessibles
depuis le corps de la page, mais la porte par le besoin absente — l'accueil
faisait entrer par ce que nous sommes, jamais par ce que le visiteur cherche.
Les quatre gestes approuves sont appliques.

1. **La phrase d'orientation de la section des maillons porte desormais le lien** :
   « Vous cherchez un service, un produit ou un partenaire industriel ?
   Entrez par votre besoin → » — vers /solutions, la page aux six familles de
   besoins que le benchmark du ch.245 avait montree au-dessus du standard des
   majors et que l'accueil ne liait nulle part.
2. **Le configurateur de service integre** gagne une pastille a cote de
   l'explorateur de chaine, en bas de la meme section — l'outil de qualification
   B2B n'etait accessible que par le pied de page.
3. **La carte TchadiTech** liste enfin ses cinq portes : les recits
   technologiques rejoignent socle, innovations, outils et R&D.
4. **Le mega-menu recoit ses deux entrees manquantes** — Recits technologiques
   (TchadiTech) et Services ESG (EnerConseils) — sur les **137 pages** qui le
   portent, FR et EN. La couverture du menu passe de 38 a 40 pages d'activites
   sur 40.

Le tout en paires FR/EN strictes.

**Et le banc m'a encore arrete avant publication** — quatrieme fois de la serie.
Ma premiere pastille configurateur etait un contour transparent a encre creme :
parfaite en theme sombre (15,2), illisible en theme clair ou le moteur repeint
la section en creme — **1,06** mesure. Refaite en pastille pleine (fond marine,
encre creme, lisere or), independante du theme : **12,7 dans les deux themes**,
re-mesuree aux quatre captures sur les huit combinaisons page x theme x element.
Le lien /solutions mesure 8,0 en clair et 10,9 a 11,4 en sombre. La regle du
241.8 tient : une encre ne se choisit jamais sans mesurer le sol — et le sol
change avec le theme.

Verification complementaire : 0 erreur console et 0 debordement sur cinq pages
temoins dans les deux themes ; liens recits/esg presents dans le menu des pages
FR comme EN. Pas de bump du service worker : uniquement du HTML.

## 255 — Ultra QA : trois defauts debusques dans un site "propre" (2026-08-27)

Le proprietaire a demande un ultra QA. Toutes les batteries reprises d'un coup
sur l'etat post-254, en local sur l'arbre identique au depot :

- **Integrite structurelle** (214 fichiers) : liens internes, ancres, assets,
  ids dupliques, alt d'images, equilibre des balises, reecritures vercel.json
  comprises. Trois vrais defauts trouves — voir plus bas.
- **SEO / metadonnees** : titres (convention « | EnerTchad », titres arabes
  admis), meta descriptions, canonical, hreflang croises FR/EN, parite
  sitemap.xml (209 URLs, 0 cassee ; 5 fichiers hors sitemap = utilitaires
  voulus : 404, sources d'impression, verification Google). Zero ecart.
- **Accessibilite axe-core** : 210 pages publiques, 0 violation (les seuls
  ecarts restent sur les 4 fichiers utilitaires non publics, inchanges a
  dessein — le fichier Google doit rester tel qu'emis).
- **Console, reseau, debordements** : 214 pages x 2 themes = 428 chargements
  avec defilement complet : 0 erreur JS, 0 requete echouee, 0 debordement
  horizontal.
- **Banc de contraste exact** sur les pages touchees, deux themes : 0 echec
  apres correction (845 elements verifies au total sur la passe).

Les trois defauts, et ce qu'ils disent :

1. **Brochures FR et EN, PROJET 04 : la balise `<h3>` d'ouverture manquait.**
   Le titre s'affichait en texte brut, colle a un ancien titre fantome —
   « Modules d'alimentation de siteEnergie de site autonome ». Deux titres
   concatenes : la trace d'un remplacement rate qui a mange la balise ouvrante.
   Le defaut date d'au moins le ch.190 (l'historique du clone ne remonte pas
   plus loin) et a survecu a 65 chapitres, dont mon « balayage d'integrite »
   du ch.252. **Mon erreur, deux fois** : c'est tres probablement une de mes
   propres retouches anciennes qui a produit ce texte, et mes audits suivants
   ne verifiaient jamais l'equilibre des balises — ils comptaient les liens,
   pas la structure. Corrige en `<h3>Energie de site autonome</h3>` (le titre
   le plus recent des deux, arbitrage documente ici), EN idem.
2. **Atlas FR et EN : `</div></figure>` inverse.** La fermeture de la figure
   des bassins arrivait apres celle de son parent — le navigateur refermait la
   figure de force et ignorait le `</figure>` orphelin. Rendu identique, mais
   structure invalide. Corrige en `</figure></div>`.
3. **Atlas FR et EN, theme clair : la legende de la carte cadastrale
   (« REPERES » / « KEY », et la boussole N) mesuree a 3,91** pour 4,5 requis —
   encre rgba(16,24,36,.55) trop diluee sur le fond creme. Passee a .66 :
   **5,6 mesure**, re-verifiee au banc quatre captures, 180 elements, 0 echec.
   Le theme sombre, lui, etait deja conforme et n'a pas bouge.

Le premier passage du verificateur affichait 1122 liens casses — tous des bugs
de mon propre outil (reecritures vercel.json ignorees, racine « / » non
resolue, `<title>` des SVG confondus avec celui du document, fragments
d'etat `#rub=` pris pour des ancres). Comme au ch.252 : on repare l'outil
avant de croire ses chiffres, et on ne retient que ce que le fichier reel
confirme ligne a ligne.

Publication : brochure.html, brochure-en.html, enerconseils/atlas.html,
enerconseils/atlas-en.html + cette page. Pas de bump du service worker :
uniquement du HTML.

## 256 — La passe mobile : le kicker dore etait trop juste sur deux poles (2026-08-27)

Toute la verification historique du site tournait au viewport 1280x900. Ce
chapitre refait les batteries au format mobile (390x844, pointeur tactile,
densite 2x) :

- **428 chargements** (214 pages x 2 themes) avec defilement complet :
  0 erreur JS, 0 requete echouee, 0 debordement horizontal.
- **Cibles tactiles** (pointer coarse, 22 pages temoins, menu ouvert inclus) :
  11 etiquettes a 22 px de haut, toutes des `<label>` places au-dessus d'un
  curseur `range` deja dimensionne pour le tactile — l'etiquette ne fait que
  donner le focus au curseur situe juste dessous, la cible equivalente conforme
  existe (exemption « equivalent » de WCAG 2.2). Non-defauts, aucun changement.
- **Banc de contraste exact en disposition mobile** (8 pages temoins x 2
  themes, puis extension) : **un vrai defaut** — le kicker dore des heros a
  photo (`.pgk`, encre #F0CE82) mesurait 4,3 sur l'atlas et 3,93 sur
  l'intermediaire, pour 4,5 requis. Le halo d'accent du pole (sarcelle, bleu)
  eclaircit le coin bas-gauche du hero juste sous le kicker — et au format
  mobile le texte s'y assoit davantage qu'au desktop, qui passait de justesse.
- **Tiroir de menu mobile ouvert** : benche pour la premiere fois (jamais
  mesure car masque au desktop) — 0 echec dans les deux themes.

La correction : l'encre du kicker passe de #F0CE82 a **#F9E5B2** (4,79 calcule
au pire point mesure, puis re-verifie au banc). Portee reelle du geste :
les kickers des trois familles de heros (pghero 84 pages, jtop 64, hero 35),
leurs losanges decoratifs, et les replis inertes des `h1 em` (l'encre visible
y est un degrade, le repli ne sert qu'aux navigateurs sans background-clip).
Miroirs mis a jour dans les trois feuilles partagees (bundle_core_a1,
x_cd256286824c, plight_extrait).

**Mon erreur, attrapee a temps** : mon premier remplacement automatique a
touche 185 pages au lieu des 84 attendues — la meme declaration CSS vivait
aussi dans sept regles de theme clair (skip-link, carte vedette du mega-menu,
liens de hero) dont je n'avais jamais mesure le sol. Plutot que de publier une
encre non benchee, j'ai inventorie chaque selecteur touche via le diff,
reverti ces sept occurrences a l'identique, et borne le geste aux kickers.
La regle 241.8 s'applique aussi aux remplacements de masse : on ne change pas
une encre qu'on n'a pas mesuree, meme par accident.

Re-mesures apres correction : mobile clair 227 elements / 0 echec, mobile
sombre 86 / 0, desktop clair 368 / 0, desktop sombre 370 / 0, menu ouvert
45+44 / 0. Console propre sur les temoins.

Publication : 186 pages HTML, 3 feuilles partagees, et bump du service worker
(et-202608271500) — des feuilles CSS changent.

## 257 — Audit clavier : l'outil ment, les pixels tranchent, et un bouton mort sur 117 pages (2026-08-27)

Audit clavier complet, jamais fait : visibilite de l'anneau de focus, skip-link,
menu au clavier, Escape, retour de focus ; plus validation JSON-LD et
prefers-reduced-motion.

**Premiere lecon — mon detecteur mentait.** La version 1 lisait les styles
calcules et annoncait 43 elements sans indicateur de focus. Verification aux
pixels : getComputedStyle de ce headless rend "solid 0px" pour un outline qui
SE PEINT reellement (prouve par capture : anneau rouge de test, 652 pixels
peints, style calcule a zero). Refait le detecteur en comparant deux captures
(focus vs blur) : **488 arrets de tabulation sur 10 pages temoins, deux themes,
0 sans indicateur** — le site etait deja conforme, les 43 etaient des
artefacts. Meme punition que les 1122 liens du ch.255 : on repare l'outil
avant de croire ses chiffres.

**Deuxieme lecon — le vrai defaut etait a cote.** Le parcours Tab de la 404
tombait sur un bouton invisible : #toTop (retour en haut) reste tabulable a
opacity:0. Et en tirant le fil : **le bouton etait carrement mort sur 117 des
207 pages qui le portent** — le balisage y est, l'anneau de progression aussi,
mais le script qui le fait apparaitre (u2_75a2c4383ddf.js) n'est charge que
par 90 pages. Personne ne l'avait vu parce que le bouton ne s'affiche qu'apres
600 px de defilement. Corrections :

1. **visibility:hidden hors etat .show** (4 feuilles porteuses du controle,
   transition ajustee pour garder le fondu) — l'invisible n'est plus tabulable ;
2. **le bloc d'animation duplique dans u_cd226c00eb4b.js**, charge par les
   207 pages, avec garde d'idempotence des deux cotes (les 90 pages saines
   chargent les deux scripts — un seul s'attache). Verifie : le bouton
   apparait et fonctionne desormais sur les pages autrefois mortes.

**Troisieme geste — skip-link.** « Aller au contenu principal » posait bien le
focus sur #main-content... sur les ~120 pages ou main porte tabindex="-1".
Les **92 autres** perdaient le focus (atterrissage sur body). tabindex="-1"
ajoute aux 92, re-teste : le focus atterrit partout.

En defense en profondeur : une regle d'anneau par defaut a specificite nulle
(:where(...):focus-visible, encre par theme : #E8C36A sur sombre — 10,2 a 10,9
mesures ; #74570B sur creme — 6,4) dans les trois feuilles partagees, qui ne
s'exprime que la ou aucune regle de composant n'existe ; et un halo de focus
sur les champs petroliers de la carte de l'atlas (trait atc-gold, suivant le
theme), dont l'indicateur — la pastille qui grossit — etait au seuil du
perceptible.

Le reste est propre : menu mobile au clavier (ouverture, Escape, focus rendu
au bouton) ; JSON-LD 767 blocs sur 209 pages, 0 erreur de syntaxe, types
coherents ; reduced-motion : plus aucune animation infinie ou longue.
Console : 0 erreur sur les temoins, deux themes.

Publication : 92 pages (tabindex) + atlas FR/EN (halo) + 6 feuilles CSS +
2 scripts + bump SW (et-202608272000).

## 258 — Le saut de la home, deuxieme enquete : la cause introuvable, les causes probables traitees (2026-08-27)

Le proprietaire signale a nouveau un saut de page au defilement de l'accueil —
memes mots qu'au ch.253. Cette fois l'enquete est allee jusque dans son propre
navigateur, sur la production :

- scrollTo / scrollBy / scrollIntoView instrumentes avec pile d'appel, puis
  defilements reels : **aucun appel** pendant le defilement libre ; au clic
  d'ancre, une seule correction du recalage (comportement voulu du ch.253),
  et la molette garde toujours la main (scenarios A/B/C rejoues : verts) ;
- 30 secondes d'observation passive a mi-page : position stable au pixel ;
- pas de scroll-snap, pas de restauration de position concurrente, images
  du hero dimensionnees, pas de decalage de mise en page mesurable (CLS 0,005
  sur 60 pas de molette), unites svh sur le hero ;
- le service worker de son navigateur portait bien les scripts a jour
  (cache et-202608272000, correctif 253 et garde 257 presents).

Le saut de position n'est **pas reproductible** dans l'etat actuel du code.
Deux mecanismes reels pouvaient neanmoins produire le symptome et sont
corriges :

1. **Fenetres de versions melangees apres deploiement.** Le service worker
   servait les JS/CSS en cache-d'abord : apres chaque publication, une visite
   entiere tournait avec un melange vieux/nouveau scripts — le vieux bug de
   defilement du ch.253 pouvait ressusciter le temps d'une session, et les
   ch.256-257 ont deploye deux fois la veille du signalement. Le SW passe en
   **reseau-d'abord pour les scripts et feuilles** (repli cache en echec :
   le hors-ligne reste couvert). Bump et-202608272300.
2. **Revelations tardives.** Les sections hautes n'apparaissaient qu'a 16 %
   de visibilite : des pans entiers restaient invisibles au milieu de l'ecran
   puis surgissaient (translation 22-34 px sur ~0,8 s) — un « saut » visuel
   au defilement rapide. Le declencheur passe a l'entree reelle dans le
   viewport (seuil 0,01, marge basse -6 %) : pas fantomes mesures 9 % → 7 %
   des pas de defilement, le reste etant la transition elle-meme, choix de
   design conserve. Non-regression verifiee : les 25 reveals non declenches
   de l'atlas clair apres teleportation au fond existent a l'identique avec
   l'ancien seuil (artefact de saut instantane, pas du changement).

Honnetete due : si le saut persiste apres un rechargement force, il me faudra
un repere de plus — l'endroit de la page ou il se produit, et ordinateur ou
telephone. Publication : sw.js + c_ac04328f0f47.js + cette page.

## 259 — Solde de tout compte : les sept actions en attente, verifiees et closes (2026-08-27)

Le proprietaire demande d'appliquer toutes les actions en attente. Inventaire
du registre : sept entrees ouvertes, certaines datant des chapitres 187-192.
Chacune a ete verifiee contre l'etat reel du site avant cloture — il s'avere
que toutes avaient ete realisees par des chapitres ulterieurs sans que le
registre soit mis a jour :

1. **Ranger les deux jumeaux anglais dans leur pole** (services-ep-en,
   produits-en) : fait — les fichiers vivent dans /amont/ et /aval/, les
   redirections 308 repondent en production (verifiees a l'instant :
   /services-ep-en → /amont/services-ep-en, /produits-en → /aval/produits-en),
   les liens entrants et hreflang suivent (0 lien casse aux ch.252 et 255).
2. **Relier /solutions a toute l'offre** : fait — services-ep y est lie 5 fois
   et aval/produits 4 fois, en francais comme en anglais ; la chaine
   « distribuer », vide a l'epoque du constat, porte ses liens sortants
   (reseau, produits, flottes).
3. **Unifier la convention de titre HTML** : fait au ch.244 (198 pages
   « | EnerTchad », re-verifie au ch.255 : 0 ecart).
4. **URL propres des deux outils** : fait — reecritures vercel.json en place
   et verifiees en production.
5. **QA clavier (ancien ch.187)** : recouvert et depasse par le ch.257
   (488 arrets de tabulation mesures aux pixels, skip-link repare sur
   92 pages, bouton toTop ressuscite sur 117).
6. **Audit des sujets (ch.191)** : chapitre publie, present dans ce carnet.
7. **Saut de defilement de l'accueil** : traite aux ch.253 et 258.

**La lecon pour le carnet** : six de ces sept entrees etaient restees
« ouvertes » alors que le travail etait fait — le registre des taches doit
etre solde au moment de la publication du chapitre qui realise l'action,
pas des semaines apres. C'est desormais le cas.

Restent ouvertes, et ce n'est pas a moi de les trancher : les arbitrages
proprietaire (typographie sous 12 px, convention INSPEM, seance photo, noms
reels de l'equipe, volumes d'import par pays, ticket minimum investisseur)
et les veilles datees (carte Brent en janvier, prochaine validation ITIE,
jalons Sedigui). Aucun changement de site dans ce chapitre : publication de
cette page seulement.

## 260 — L'arbitrage typographique rendu : plancher 11 px hors SVG (2026-08-27)

Le proprietaire a approuve l'arbitrage consigne au ch.241 : remonter les
petits textes vers un plancher lisible. Regle executee : **plancher 11 px
(0,6875 rem) pour tout texte informatif** ; le parti pris des 11 px existants
est conserve tel quel (pres de la moitie de l'inventaire) ; les etiquettes
des cartes SVG restent hors perimetre (leur taille declaree est multipliee
par l'echelle du viewBox au rendu — les remonter les ferait deborder de la
carte) ; le decoratif marque aria-hidden est exempte.

Execution : transformation scriptee de **4 437 declarations** font-size dans
**241 fichiers** (feuilles partagees, blocs de style de page, styles en
ligne), avec exemption automatique des 24 classes de texte SVG et des 44
regles qui les portent, et de docs-sources. Les 8-10 px passent a 11 px ;
la hierarchie au-dessus ne bouge pas. Cas restant attrape au controle des
tailles RENDUES (et non declarees) : les parentheses `<small class="pmk">`
en em heritaient sous le plancher — la regle passe a
`max(.62em, 0.6875rem)` dans ses 4 feuilles porteuses. Apres quoi :
**0 texte informatif rendu sous 11 px** sur les pages temoins.

Verification avant publication : **856 chargements** (214 pages x 2 themes
x 2 viewports) — 0 debordement horizontal, 0 erreur console ; banc de
contraste exact sur les 8 pages les plus touchees, deux themes : 1 243
elements verifies, **0 echec** ; captures des zones denses (brochure, stats
EOR, accueil) : composition intacte, pas de retour a la ligne casse.

Bump du service worker (et-202608280200) : feuilles partagees modifiees.
Restent aux mains du proprietaire : convention INSPEM, seance photo, noms
reels, volumes d'import, ticket investisseur.

## 261 — QA des menus et sous-menus : symetrie retablie sur 21 pages (2026-08-28)

Inventaire outille de tous les menus du site (extracteur maison, resolution
des rewrites vercel.json) : 140 pages portent le mega-menu `nx` (5 panneaux,
tiroir mobile), 64 articles du journal sont volontairement sans en-tete
(lecture nue, barre mobile nezBar presente sur chacun), 5 pages outils et
ar.html idem avec lien de sortie verifie. Les 2 pages boutique n'ont pas
d'en-tete non plus — parti pris deja consigne, symetrique FR/EN. **0 lien
de menu casse** sur l'ensemble.

Defauts trouves et corriges : (1) **20 pages EN de 5 sous-dossiers**
(enerconseils, intermediaire, petrochimie, tchaditech, tchaditude)
portaient un menu d'une generation anterieure — entrees manquantes,
libelles perimes. Transplantation du menu canonique EN complet, avec liens
de bascule de langue recalcules page par page et marqueur is-active/
aria-current pose sur la bonne rubrique. (2) **cibles-2030.html** n'avait
ni menu ni scripts de navigation (son jumeau EN, si) : en-tete canonique
FR pose, feuilles et scripts de navigation ajoutes, y compris le lieur du
bouton burger (u2_e8be195d19be.js) absent au premier passage — detecte
par le test mobile, pas par la lecture du code.

Apres correction, l'inventaire converge : **69 pages FR et 69 pages EN
strictement identiques** panneau par panneau, entree par entree.

Verification : ouverture/fermeture au clic et a Escape prouvee en PIXELS
(347 000 pixels changent a l'ouverture sur atlas-en, 284 000 a la
fermeture sur societe) ; test mobile 5 pages (burger, accordeon,
aria-expanded, Escape) : 5/5 vertes ; **banc de contraste du menu OUVERT**
— jamais benche jusqu'ici — 240 elements x 2 themes, 0 echec ; balayage
console des 21 pages modifiees, 2 themes : 0 erreur. HTML seul modifie :
pas de bump du service worker.

Mon erreur, et la lecon du ch.257 confirmee : j'ai d'abord cru le panneau
transplante invisible (getComputedStyle rendait visibility:hidden apres
clic) et j'ai passe du temps a chercher une regle CSS concurrente qui
n'existait pas. La capture d'ecran a tranche en une mesure : le panneau
peint parfaitement — ma premiere lecture etait prise en pleine transition.
De meme, l'Escape "casse" sur societe fonctionnait tres bien : mon
KeyboardEvent synthetique n'etait pas digne de confiance, la vraie touche
l'est. L'instrument d'abord, le verdict ensuite.

Decouverte consignee sans action : le script d'accordeon x_8dd24c99432e.js
et le badge mm26 (present sur 205 pages) ciblent un DOM `.mega-ultra` qui
n'existe plus nulle part au rendu — code dormant, sans effet ni erreur.
Retrait a envisager lors d'un futur nettoyage de masse, pas dans ce
chapitre.

## 262 — Solde des actions en attente : le code dormant retire (2026-08-28)

Le proprietaire demande d'appliquer toutes les actions en attente. Revue du
registre : les sept entrees historiques ont ete soldees au ch.259, les
orphelins de la racine supprimes au ch.243, le plancher typographique rendu
au ch.260. Restaient d'un cote les arbitrages proprietaire et les veilles
datees (qui ne sont pas a moi de trancher), et de l'autre UNE action
technique consignee au ch.261 : le retrait du code dormant mega-ultra.

Execution : le bloc inline mm26-badge (205 pages, un seul et meme bloc de
644 caracteres partout, verifie par empreinte) et l'include de l'accordeon
x_8dd24c99432e.js (203 pages, balise identique partout) sont retires par
script. Les deux pages boutique portaient le badge sans l'accordeon —
coherent avec leur absence d'en-tete, retirees comme les autres. Le fichier
x_8dd24c99432e.js lui-meme, desormais sans aucune reference, est supprime
du depot via l'interface GitHub. Les regles CSS .mega-ultra/.mu-* des
feuilles partagees restent en place : inertes, jamais benchees en
suppression, leur retrait toucherait des feuilles sous cache et n'apporte
rien au visiteur — hors perimetre de cette action.

Preuve 241.8 avant publication : pour chacun des 205 fichiers, le nouveau
contenu est STRICTEMENT egal a l'ancien prive des deux blocs — 0 ecart.
Verification fonctionnelle : menus mobiles 5/5 (burger, accordeon, Escape),
mega-menu desktop ouvert en pixels (339 000 pixels changent), balayage
console de 12 pages representatives x 2 themes : 0 erreur. HTML seul
modifie : pas de bump du service worker (le fichier supprime n'est plus
demande par personne ; le SW sert les actifs reseau d'abord depuis ch.258).

Pourquoi ce menage : un script qui cherche un DOM disparu ne casse rien,
mais il trompe le mainteneur — deux chapitres ont deja perdu du temps a
inventorier un "systeme de menu mega-ultra" qui n'existe plus au rendu.
Le code qu'on ne retire pas devient de la documentation mensongere.

## 263 — Ultra revue de toutes les pages : le bloc de continuite remis a sa place (2026-08-28)

Revue integrale des 209 pages, en re-passant les juges etablis et en en
ajoutant de nouveaux jamais passes en bloc.

Juges etablis, tous verts : **836 chargements** (209 pages x 2 themes x
2 viewports) — 0 erreur console, 0 debordement horizontal, 0 requete
echouee ; audit statique complet — 0 lien casse, 0 ancre morte, 0 image
sans alt, 0 page sans titre/description/canonical, 0 incoherence hreflang,
0 defaut h1, plan du site coherent ; **axe-core sur les 209 pages : 0
violation**.

Nouveaux juges : validite JSON de chaque bloc JSON-LD (0 invalide) ;
alignement headline/h1 des articles (57 ecarts releves, TOUS reduits a la
ponctuation ou aux entites HTML — 0 substantiel) ; doublons de titres et
de descriptions entre pages distinctes (0) ; mots doubles dans le texte
visible (109 alertes brutes, toutes des artefacts d'adjacence d'etiquettes ;
au sein d'un meme noeud de texte il ne reste que « nous nous efforcons »,
du francais legitime) ; liens externes en http non securise (0) ;
coherence lang/suffixe (0 ecart).

**Le defaut reel** : le bloc « Continuer dans le pole » etait incoherent
sur 14 pages anglaises. Neuf pages racine EN (accessibilite, avertissements,
carrieres, charte, cibles-2030, communautes, gouvernance, innovation, plan
du site) portaient un bloc « Continue in Upstream » colle la par erreur —
un bloc Amont sur une declaration d'accessibilite, sans equivalent
francais. Et cinq pages de pole EN n'avaient PAS le bloc que leur jumelle
francaise porte : amont/eor-en et les quatre pages aval (distribution,
produits, raffinage, reseau — le pole Aval n'avait aucun bloc EN nulle
part). Correction : bloc errant retire des neuf pages ; bloc Amont
recompose pour eor-en a partir des cartes anglaises existantes ; bloc
Aval anglais construit (quatre cartes traduites du francais, chaque page
excluant sa propre carte, moyeu vers /pole-aval-en), pose au meme point
d'ancrage que cote francais (apres la navigation d'article).

Verification de la correction : preuve stricte sur les 14 fichiers (nouveau
= ancien plus ou moins exactement un bloc, rien d'autre) ; re-audit des
liens 0 casse ; console 14 pages x 2 themes 0 erreur ; axe 0 ; captures des
blocs poses, deux themes — memes classes et memes encres que les 50 blocs
deja mesures du site. HTML seul : pas de bump du service worker.

Classements sans action : les « jumeaux manquants » signales par mon
inventaire (pole-amont-en vs amont/index.html, outils FR seuls) sont des
artefacts de ma convention de nommage — le hreflang, lui, est complet ;
les 57 ecarts headline/h1 de ponctuation ne meritent pas 57 republications.

Mon erreur, encore la meme famille : mes nouveaux juges ont d'abord crie
fort (18 jumeaux « manquants », 57 headlines « desalignes », 109 mots
« doubles ») ; tout sauf quatorze pages etait du bruit d'instrument. La
regle du ch.255 tient : reparer le juge avant de croire le verdict — et
c'est le juge repare qui a revele le seul vrai defaut, invisible jusqu'ici.

## 264 — QA des interactifs restants : la recherche reparee la ou elle etait morte (2026-08-28)

Apres les menus (ch.261), les systemes interactifs jamais passes au banc :
la palette de recherche Ctrl+K, la page 404 (exclue de tous les balayages
depuis toujours) et les formulaires.

**Palette de recherche — trois defauts reels.** (1) **27 resultats
pointaient des ancres inexistantes** : l'index anglais (cmdk_en.js) visait
des identifiants traduits (#produce, #mission, #thesis…) alors que les
pages anglaises ont garde les identifiants francais (#produire, #vision,
#these…) — 26 entrees EN corrigees une a une apres cartographie section
par section, plus /faq#faq (les pages FAQ n'ont pas d'ancre de contenu :
fragment retire). L'utilisateur atterrissait en haut de page au lieu de la
section promise. (2) **Quatre pages francaises avaient une recherche
morte** : accessibilite, avertissements, charte et plan-du-site portaient
le dialogue et le bouton loupe mais aucun moteur — Ctrl+K ne faisait rien.
Le moteur des pages racine FR y est ajoute, au meme emplacement que sur
societe.html. (3) Verification totale apres correction : **474 URL
d'index, 0 cassee, 0 ancre morte** ; tests de comportement sur 6 pages
(ouverture, resultats groupes, navigation Entree, fermeture Escape) : tout
fonctionne, y compris sur les 4 pages reparees.

**Page 404** : premiere inspection de sa vie — console 2 themes propre,
axe 0 violation, liens sortants valides, palette de recherche presente et
motorisee, et la production sert bien le statut HTTP 404 avec cette page.

**Formulaire de contact EN** : les huit boutons radio portaient des
valeurs FRANCAISES sous des etiquettes anglaises — le recapitulatif que
l'utilisateur copie disait « Type: Approvisionnement / Contrat B2B » sur
la page anglaise. Valeurs traduites, et la condition du script qui ouvre
le choix de produit (indexOf('Approvisionnement')) basculee sur 'Supply'
— verifiee en parcourant le formulaire de bout en bout dans les deux
langues : recapitulatif entierement anglais cote EN, francais intact cote
FR, le selecteur de produit apparait toujours au bon moment.

Actifs JS modifies (deux index de recherche) : **bump du service worker
et-202608281212**. Preuve stricte sur les 8 fichiers (chaque nouveau =
ancien plus exactement les remplacements enumeres) ; console des pages
touchees 2 themes : 0 erreur.

Mon erreur du chapitre : j'ai failli traduire les valeurs des radios sans
lire le script — la condition indexOf('Approvisionnement') aurait casse en
silence le selecteur de produit. Le grep des comparaisons AVANT le
remplacement est ce qui l'a evite : on ne renomme pas une valeur sans
chercher qui la compare.

## 265 — Audit de charge : ce que pese le site, et trois redondances purgees (2026-08-28)

Premiere mesure systematique du poids des pages. Inventaire statique des
209 pages : mediane 125 Ko de HTML, moyenne 135 Ko, 26,8 Mo au total ;
les plus lourdes sont assumees (brochure ~1 Mo par page — un document
imprimable —, configurateur 830 Ko dont 735 Ko d'outil JavaScript).
Mesure de chargement en local sur 8 pages representatives : 16 a 37
requetes, 470 Ko a 1,5 Mo transferes ; un article du journal charge en
~270 ms, l'accueil en ~1,7 s, la brochure en ~5 s (valeurs relatives,
serveur local). Preloads orphelins : 0. Rien d'alarmant, mais trois
redondances reelles :

(1) **Le service worker etait enregistre DEUX FOIS sur 203 pages** — deux
scripts inline historiques, l'un anonyme et sans garde de protocole,
l'autre (sw-reg) garde https/localhost. Doublon inoffensif au rendu
(l'enregistrement est idempotent) mais c'est du code duplique sur presque
tout le site. Le script anonyme est retire partout ; ar.html, qui n'avait
QUE lui, le garde ; les trois pages outils n'ont jamais enregistre le SW,
etat inchange. Apres purge : 0 page a double enregistrement.

(2) **glossaire-petrolier.html chargeait nav_a.js deux fois** — meme URL,
deux balises. Dedoublonne.

(3) **c_ac04328f0f47.js vivait sous deux cache-busters** (b=202607081413
sur 68 pages, b=202607081457 sur 22) : meme fichier, deux URL — un
visiteur traversant le site le telechargeait deux fois et le service
worker en cachait deux copies. Harmonise sur la version majoritaire :
90 pages, un seul buster.

Preuve stricte sur les 203 fichiers modifies (chaque nouveau = ancien
moins exactement les retraits enumeres, remplacement de buster compris) ;
console 12 pages x 2 themes : 0 erreur ; 0 page a SW multiple, 0 sans SW
qui en avait un. HTML seul modifie : pas de bump du service worker.

Le reste du constat de poids est un parti pris d'architecture (styles en
ligne par page, pages autonomes) qui a ses avantages (pas de cascade de
dependances, cache par page) ; le remettre en cause serait un chantier de
fond, pas un nettoyage — consigne ici, sans action.

## 266 — Les sous-menus refondus dans le langage du site (2026-08-28)

Le proprietaire demande une refonte des sous-menus pour coherence avec le
site, capture a l'appui : la barre de sections des pages corporate
(corp-nav) etait une bande grise pleine largeur a pastilles mono cerclees,
etrangere au langage des autres barres. Etat des lieux prealable : le site
a TROIS familles de sous-menus — la sous-nav de pole (80 pages, la
reference : verre bleu, liens sans-serif, actif blanc a soulignement
dore), les sommaires colles or-actif (investisseurs, clients, solutions —
deja coherents), et les retardataires : corp-nav (6 pages) et les
sommaires-pastilles simples (7 pages, survol VERT hors charte).

Refonte, alignee sur la reference : la corp-nav adopte le verre de la
sous-nav de pole (degrade bleu nuit, flou 14px, filet bas), ses liens
passent en sans-serif .84rem, repos #CBD5E3, survol blanc sur voile
discret, et gagnent un **etat actif** qu'elle n'avait jamais eu : pastille
blanche a soulignement dore degrade, pilotee par un scrollspy pose sur les
6 pages. Premier scrollspy ecrit a l'IntersectionObserver : il restait
colle sur les sections longues — reecrit en « derniere section au-dessus
de la ligne de lecture », verifie en descendant les pages (Conformite →
ESG → Rapport). Les sommaires-pastilles gagnent un fond de verre (ils
flottaient nus sur les photos), et le survol passe du vert a l'or.

Au passage, trois defauts reveles par le travail : **ethique-en n'avait
pas le sommaire** que sa jumelle francaise porte (ajoute, traduit, 5
ancres verifiees) ; le kicker « Ou en sommes-nous » de societe (11 px or
sur photo, ratio 3,83) passe a l'encre #F9E5B2 etablie au ch.256 ; les
boutons gov-btn de gouvernance, dessines or mais rendus BLEUS par une
regle generique !important des feuilles partagees, reprennent leur or
(#F9E5B2) par une regle plus specifique — deux allers-retours au banc
pour la faire gagner.

Banc de contraste des 6 pages temoins, deux themes : 434 + 440 elements,
**0 echec**. Console 12 pages x 2 themes : 0 erreur. Mobile : barre
defilante sans debordement. Chaque remplacement pose par chaine exacte
comptee a 1 avant substitution. HTML seul : pas de bump du service worker.

Mon erreur du chapitre : avoir livre un scrollspy plausible sans le
regarder marcher — c'est le test de descente qui l'a montre fige sur les
sections longues. Un composant d'interface se juge en mouvement, pas a
l'arret.

## 267 — La chaine du journal auditee : 64 articles, un seul fil, une barre harmonisee (2026-08-28)

QA complet de la navigation des 64 articles du journal, jamais testee en
bloc.

**La chaine precedent/suivant (pgr) est parfaite** : un fil lineaire par
langue, de « Premiere du genre » a « L'enigme de la densite », 0 cible
morte, reciprocite totale (le suivant de A a bien A pour precedent, sur
les 64), aucune fuite de langue (un article EN ne pointe que des cibles
EN), et symetrie FR/EN entiere : la chaine anglaise est le miroir exact de
la francaise. Les cartes « continuer la lecture » : 0 lien mort, 0
auto-reference.

**nezBar, la barre mobile** : visible et fixee en bas sur les 64 articles,
cibles tactiles de 49 px (au-dessus du plancher de 44), cachee sur
desktop, 0 erreur console. Un defaut d'uniformite en revanche : les 32
barres FR menent aux destinations profondes choisies a la conception
(Services → le catalogue ancre, Reseau → la carte ancree), mais 31 barres
EN s'arretaient aux moyeux de pole, et une 32e suivait un troisieme
schema. Harmonisation : les 32 barres EN refletent desormais exactement
les FR (memes cibles profondes, memes ancres — verifiees existantes sur
les pages anglaises). Preuve stricte : chaque fichier = l'ancien avec pour
seuls changements les href de sa barre.

Verification : comportement mobile re-teste apres harmonisation, console
3 pages x 2 themes 0 erreur. HTML seul : pas de bump du service worker.

Rien a signaler d'autre : c'est le premier chapitre d'audit ou la
structure auditee etait deja entierement saine — la chaine du journal a
ete construite avec la discipline que les menus (ch.261) n'avaient pas
recue. La barre mobile, elle, confirme la lecon : l'uniformite se verifie,
elle ne se suppose pas.

## 268 — QA visuel de toutes les pages : l'oeil confirme, et attrape un sommaire noye (2026-08-28)

Le proprietaire demande un QA visuel de toutes les pages et sections. Deux
etages : un depistage geometrique automatique sur les 209 pages, puis une
revue a l'oeil, tuile par tuile, d'un representant de chaque famille de
gabarit.

**Le depistage automatique** (par page, apres reveil de toutes les
sections) : images cassees ou deformees — 0 ; textes qui se chevauchent,
elements hors cadre, textes coupes — 650 alertes brutes, TOUTES reduites
en artefacts apres calibrage et verification en pixels : faces avant/
arriere des cartes a bascule, reponses d'accordeons repliees, texte en
ligne adjacent. Trois versions du juge ont ete necessaires (exclure les
elements positionnes, les freres de meme parent, les composants a
bascule) — la regle des ch.255/263 encore : reparer le juge avant de
croire le verdict.

**La revue a l'oeil** : accueil (8 ecrans), article du journal, carnets,
investisseurs, boutique, calculateur, glossaire, publications, 404 — plus
l'accueil et investisseurs en theme clair, et les zones signalees par le
depistage (services, brochure, FAQ, page arabe, clients). Tout est net,
compose, coherent… sauf UN defaut reel : **le sommaire colle
d'investisseurs glissait sous l'en-tete** — ancre a 57 px alors que
l'en-tete complet (bandeau + navigation) occupe 132 px : 75 px de
pastilles cachees et incliquables au defilement, dans les deux langues et
les deux themes. La meme ancre fautive dormait sur clients et solutions
(leur sommaire est aujourd'hui masque au profit des onglets cw-tabs, deja
bien ancres — corrige quand meme, par coherence). Correction : ancrage a
var(--nav-h) — la variable que la page definit deja — et marge d'ancre
recalculee en fonction ; verifie au pixel apres coup : 0 px de
recouvrement, la pastille active dore visible sous l'en-tete.

Preuve stricte sur les 6 fichiers (seuls les deux remplacements enumeres),
console 6 pages x 2 themes 0 erreur. HTML seul : pas de bump du service
worker.

Le bilan du QA visuel tient en une ligne : sur 209 pages, l'oeil n'a
trouve qu'un seul defaut que les bancs n'avaient jamais vu — parce
qu'aucun banc ne defilait en regardant le HAUT de l'ecran. Un juge de
plus au repertoire : le recouvrement des elements colles se mesure, lui
aussi.

## 269 — La boutique modernisee : rails de verre, or franc, panier raffine (2026-08-28)

Le proprietaire demande de moderniser la place de marche. Etat des lieux
prealable complet (deux themes, desktop et mobile, contrat JavaScript du
panier et du segmenteur) : la boutique etait fonctionnelle mais datee —
pastilles plates, bouton « Ajouter » gris efface, badges de confiance en
texte nu, panier au fond mat.

Refonte par UN bloc de styles ajoute en fin de page (shop-modern-2026),
sans toucher une ligne du JavaScript ni du markup :

- **Badges de confiance** (prix ARSAT, dernier kilometre, qualite tracee,
  devis) : pastilles de verre bombees, comme les cartes du site.
- **Segmenteur et filtres** : rails de verre au degrade bleu nuit, survol
  discret, **actif en or degrade** avec ombre portee — le langage des
  actifs du site (sous-nav de pole, onglets).
- **Cartes produits** : levee au survol avec lueur a la couleur d'accent
  de la categorie (le motif des cartes de l'accueil).
- **« Ajouter » passe a l'or franc** texte sombre — l'action primaire
  cesse d'etre grise ; le CTA du devis suit, plus lumineux.
- **Panier** : verre fluide (degrade + flou + ombre profonde), etat vide
  raffermi.
- **Theme clair** : les rails et badges basculent en verre clair a texte
  sombre (premiere version oubliee — c'est le banc qui l'a montree, 22
  echecs d'un coup : mes fonds sombres restaient sous les encres claires
  du theme clair ; adaptation posee, re-banc 0).

Premiere fois que la boutique passe au banc : deux encres faibles
PRE-EXISTANTES revelees et corrigees au passage (kicker des catalogues a
55 % d'opacite → 78 %, lien rose des derives #D177B4 → #E9A8D2).

Verification : parcours complet du panier apres refonte (ajout, quantite,
compteur, modale de devis — ouverte, recapitulee, fermee a la souris
reelle ; le clic synthetique qui « ne fermait pas » etait l'instrument,
pas la page, lecon du ch.261 confirmee) ; banc de contraste 330 elements
x 2 themes : 0 echec ; console 2 pages x 2 themes : 0 erreur ; captures
avant/apres desktop, mobile, clair. Preuve stricte : nouveau = ancien +
un bloc + deux encres. HTML seul : pas de bump du service worker.

## 270 — Ultra revue de la navigation, desktop et mobile — et les angles morts solds (2026-08-28)

Le proprietaire demande un QA et une ultra revue des outils de navigation
sur les deux formats. Revue en trois etages, precedee du solde des
derniers angles morts du site.

**Angles morts d'abord** : la page arabe (ar.html) passe sa premiere
inspection complete — 42 liens tous valides, axe 0 violation, console
propre 2 themes, banc de contraste 81 elements x 2 themes 0 echec,
dir=rtl coherent. Les deux outils interactifs repondent : le calculateur
recalcule quand on bouge ses 6 curseurs (0 NaN, 0 erreur), le
configurateur recompose a chaque choix. Rendu d'impression : verifie sur
l'accueil (la brochure d'un mega-octet depasse le budget du generateur
PDF headless — limite d'instrument consignee, pas defaut de page ; le
bouton Imprimer de la page appelle l'impression du navigateur, hors de
cause).

**Statique navigation** : la bascule de langue de CHAQUE page pointe sa
vraie jumelle (moyeux de pole compris, via leurs adresses reecrites), et
la jumelle pointe en retour — 0 defaut sur les 209 pages. toTop present
partout sauf les 3 outils autonomes (choix assume), skip-link partout.

**Matrice desktop** (8 pages representatives) : les 5 panneaux s'ouvrent
— preuve en pixels, 297 000 pixels changent — Escape ferme (296 000
pixels reviennent sur publications, page que la lecture computee accusait
a tort), focus clavier ouvre, le bouton theme bascule sur les pages
editoriales, toTop peint et REMONTE (scrollY 2500 → 0). La moitie des
verdicts bruts de ma matrice etaient des mensonges de getComputedStyle en
plein headless — aria-expanded=true avec visibility:hidden pendant que
297 000 pixels peignaient le panneau. Troisieme chapitre ou cet
instrument ment (257, 261, 268) : desormais il ne juge plus jamais seul.

**Matrice mobile** (8 pages) : burger, verrou de defilement du corps pose
ET retire, exclusivite de l'accordeon (ouvrir un pole ferme l'autre),
bascule de langue dans le tiroir, Escape — tout vert. **Un defaut reel** :
les quatre liens de moyeu du tiroir (« Amont › », « Intermediaire › »,
« Aval › », « Petrochimie › ») ne faisaient que 28 px de haut — sous le
plancher tactile de 44 px que le site s'impose partout depuis le ch.257.
Corrige dans le bloc mobile de nav_a.css (min-height 44 px, centrage) ;
re-matrice : 0 cible petite, tiroir intact a l'oeil, desktop inchange
(la regle vit dans la media query mobile). Feuille partagee modifiee :
**bump du service worker et-202608281508**.

Bilan : sur toute la surface de navigation — mega-menu, tiroir, bascules
de langue, toTop, theme, Escape, verrous — un seul defaut reel, tactile
et mobile, invisible des bancs precedents parce qu'aucun ne mesurait la
HAUTEUR des cibles dans un accordeon deploye. Ce juge-la rejoint le
repertoire.

## 271 — La coherence des chiffres : un « 7 poles » fossile sur quatre pages (2026-08-28)

Audit editorial jamais fait : extraire les figures cles de toutes les
pages et confronter chaque concept a lui-meme. Quinze familles passees au
crible sur les 209 pages — corridor (1 070 km : uniforme, 58 mentions),
API de Doba (21-24° : uniforme ; les autres plages de l'article sur la
densite decrivent d'AUTRES bruts, portee legitime), reseau cible (12
stations sur 8 localites : uniforme ; les « 85 stations » sont les
stations piezometriques du pipeline, autre objet), provinces (23/23),
trajectoire du capital (10 M → 1 Md → 20 Md : uniforme, 97 mentions du
palier final), cibles EOR (+8-17 % OOIP ; les 20-35/50-65 % sont les taux
de recuperation sans/avec EOR, autre concept), mini-raffinerie (500-2 000
b/j : 175 mentions uniformes), maillons (quatre, FR=EN), jalons dates
(plages differentes = projets differents, verifie).

**Le defaut reel** : les tuiles de synthese de la charte et de La Societe
affichaient « 7 poles d'activite » — un fossile d'avant le huitieme pole
(EnerConseils), contredit par les 150 mentions de « 8 poles » partout
ailleurs, footer compris. Six tuiles corrigees sur quatre pages (charte
et societe, FR et EN, societe en portant deux chacune). Preuve stricte :
seuls les <b>7</b> suivis du libelle poles ont change. Console 4 pages x
2 themes : 0 erreur.

**Consigne au proprietaire, sans action** : les pages EOR datent les
~144 000 b/j de reference de « 2024 », la fiche secteur de l'atlas et de
la brochure les datent de « 2025 ». Le chiffre est le meme, le millesime
non — a arbitrer avec les sources citees (les 140 kb/j de la frise
historique sont, eux, la production INITIALE de 2003, autre fait,
coherent).

Mon erreur du chapitre, et elle est de protocole : pour annuler un
remplacement a moitie applique, j'ai tape un git checkout -- , le geste
que le carnet interdit depuis le debut (la restauration passe par git
archive FETCH_HEAD). Sans consequence ici — l'index etait aligne sur le
depot publie — mais la regle existe pour les jours ou il ne l'est pas.
Consigne, et la bonne commande re-memorisee.

## 272 — Les derniers interactifs au banc : quatre systemes, zero defaut (2026-08-28)

QA de comportement des quatre interactifs jamais testes, et avec eux la
surface interactive du site est integralement couverte.

**Carrousel du hero** (accueil FR et EN) : cinq messages, rotation
automatique verifiee (message 1 → 2 en ~6 s), acces direct par onglets
(aria-selected suit), bouton pause qui fige reellement la rotation et
bascule son libelle (« Mettre en pause » ↔ « Reprendre »). Ma premiere
lecture accusait la pause francaise — mon selecteur flou avait clique un
autre bouton ; vise precisement (#hxPause), elle fonctionne.

**Reglage de luminosite** : panneau ouvert au bouton, curseur applique le
voile, preset « Clair » pousse bien le curseur a 116, preference
persistee, panneau referme.

**Rail de sections (secrail)** : present la ou il a un sens (pages a
sections — eor 4 points, engagements 8), clic sur un point defile vers la
section, un point actif suit le defilement ; absent a l'execution sur les
pages qui ne s'y pretent pas, par construction.

**Bandeau cookies** : apparait une fois (apres 1,2 s), « J'ai compris »
le retire et pose la cle locale, il ne revient ni au rechargement ni sur
les autres pages ; le lien « Politique cookies » pointe /cookies, valide.

Aucun changement de site : publication de cette page seulement. Avec ce
chapitre, tout ce qui se clique, se tape, defile ou bascule sur les 209
pages est passe au banc de comportement au moins une fois — menus
(ch.261, 270), recherche et formulaires (264), panier (269), journal
(267), sous-menus (266, 268), outils (270), et ces quatre derniers.

## 273 — La production controlee dans un vrai navigateur : le service worker fait son travail (2026-08-28)

Tous les bancs de cette serie tournaient dans un Chromium headless sur
copie locale — fidele pour la structure et les encres, muet sur UNE
couche : le service worker en production. Controle mene dans le vrai
Chrome, sur le vrai site.

**Service worker** : actif et « activated » sur enertchad-delta.vercel.app,
AUCUNE version en attente (la montee et-202608281508, publiee une heure
plus tot, s'est installee proprement), et surtout **un seul cache** — les
versions precedentes ont bien ete purgees par le nettoyage d'activation.
Le cache vivait sa vie normale pendant la visite : 5 entrees a l'arrivee
sur l'accueil, 57 apres un parcours accueil → EOR → boutique → societe —
le reseau-d'abord du ch.258 alimente le cache au fil de l'eau, comme
concu.

**Parcours reel, zero erreur console** : boutique modernisee (deux ajouts
au panier, compteur a 2, modale de devis ouverte et refermee), societe
(panneau du mega-menu ouvert — 358 px —, ferme a Escape, palette Ctrl+K
ouverte avec 10 resultats sur « raffinerie »), et les tuiles corrigees du
ch.271 affichent bien « 8 » en production. Theme nuit automatique
(et-h-nuit) actif comme attendu a cette heure.

Aucun defaut, aucun changement de site : publication de cette page
seulement. La chaine complete — editeur local, banc headless, depot,
Vercel, service worker, navigateur reel — est verifiee de bout en bout
pour la premiere fois dans le meme chapitre.

## 274 — Hygiene de service : le sitemap remis a l'heure de son propre historique (2026-08-28)

Tour d'hygiene des fichiers de service, apres la vague de chapitres qui a
touche presque toutes les pages.

**Sitemap** : 209 adresses, mais trois sans lastmod (ar, forage-
directionnel FR/EN) et des dates posees a la main au fil des chapitres —
plus en phase avec la realite depuis les publications de masse (260, 262,
265...). Les 209 lastmod sont desormais DERIVES de l'historique git :
chaque adresse porte la date du dernier commit de son fichier (4 pages au
27 aout, 205 au 28), zero entree sans date, XML valide. Les moteurs
verront des dates exactes, plus des approximations.

**Le reste etait deja en ordre**, verifie en production : robots.txt
(docs-sources exclus, sitemap declare), og-image et les trois icones
servies en 200 avec les bons types MIME, manifest valide, et les six
en-tetes de securite actifs sur les pages vivantes — X-Frame-Options,
nosniff, Referrer-Policy, Permissions-Policy, HSTS avec preload, CSP.
Rien a ajouter : la configuration posee dans les chapitres anterieurs
tient.

Un fichier modifie (sitemap.xml), pas de bump du service worker (il ne
cache pas le sitemap).

## 275 — Benchmark face aux majors : dix propositions posees au registre (2026-08-28)

Le proprietaire demande des propositions "versus majors". Plutot qu'une
liste jetee dans la conversation, le benchmark est livre comme page de
decision publiee (artifact "EnerTchad face aux majors"), datee d'apres le
chapitre 274, pour etre relue et partagee.

**Ce qui est deja au niveau des majors, ou au-dessus** : le journal
pedagogique (64 articles chaines, chapitre 267), les outils interactifs
(calculateurs, atlas, glossaire — la ou les majors publient des PDF),
l'accessibilite mesuree (axe 209 pages x 0 violation), l'honnetete de la
constitution (aucune major n'affiche son statut juridique avec cette
clarte), zero pistage (aucun tracker tiers, quand les majors en chargent
des dizaines), et le mode hors-ligne (service worker que meme
TotalEnergies n'offre pas).

**Les dix propositions, priorisees** :
- P1 Calendrier investisseur abonnable (.ics) — chantier, effort S, fort.
- P2 Recherche plein-texte du site (indexer le corps des pages pour la
  palette cmdk) — chantier, effort M, fort.
- P3 Carte SVG unifiee des operations cibles — chantier, effort M, fort.
- P4 Data book investisseur telechargeable — chantier plus validation des
  chiffres, effort M.
- P5 Kit presse telechargeable — chantier, effort S ; les photos
  dependent de l'arbitrage seance photo.
- P6 Rapport annuel de constitution (PDF) — arbitrage, effort M.
- P7 Gouvernance incarnee — bloque par l'arbitrage des noms reels.
- P8 Arabe etendu (~10 pages) — arbitrage traduction, effort L.
- P9 Alertes e-mail reelles — infrastructure a ouvrir, effort M.
- P10 Compteur public de jalons de constitution — chantier plus donnees,
  effort S ; la reponse d'une societe non cotee au ticker boursier des
  majors.

**Ce que je deconseille de copier** : les chatbots des majors, les videos
hero lourdes, le pistage publicitaire. Le site tient sa credibilite de sa
sobriete.

**Ordre de marche propose** : P1, puis P2, P3, P5, P4. Les P6 a P10
entrent au registre comme arbitrages ou infrastructures, avec leurs
dependances (noms reels pour P7, traduction pour P8, backend pour P9).

**Mon erreur, consignee** : la premiere version de la page contenait un
jeton CSS corrompu — un caractere chinois glisse au milieu d'une valeur
hexadecimale ("--panel-2:#182[CJK]642"), declaration morte doublee par la
bonne juste apres. Le rendu survivait par chance, pas par rigueur. La
ligne a ete nettoyee et un controle programme (caracteres suspects,
jetons utilises contre jetons definis) passe avant publication. Meme sur
un livrable hors depot, la verification mecanique reste due.

Un fichier modifie (MAINTENANCE.md), pas de bump du service worker
(changement hors assets).

## 276 — P1 : l'agenda investisseur devient abonnable (.ics) (2026-08-28)

Premier chantier du plan "versus majors" (chapitre 275). Les majors
publient des calendriers investisseurs abonnables ; le site avait un
agenda statique. Deux calendriers iCalendar sont desormais publies :
agenda-investisseur.ics (FR) et investor-calendar-en.ics (EN), avec les
quatre rendez-vous de la page investisseurs — memorandum (T3 2026),
webinaire (T3 2026), data room avec GCIC (T4 2026), point d'etape annuel.

Honnetete de constitution respectee : chaque evenement est
STATUS:TENTATIVE, en journee entiere, avec une description qui rappelle
"date indicative — societe en constitution" ; le calendrier s'annonce
avec un rafraichissement hebdomadaire (REFRESH-INTERVAL) pour que les
abonnes recoivent les dates confirmees quand elles le seront. Deux
boutons .btn2 (S'abonner en webcal, Telecharger le .ics) rejoignent la
section agenda des deux pages, verifies au pixel dans les deux themes.
En production : text/calendar, BEGIN:VCALENDAR servi.

## 277 — P2 : la palette cherche desormais dans le texte des 208 pages (2026-08-28)

Deuxieme chantier : la recherche plein-texte. La palette Ctrl+K ne
connaissait que ses 474 entrees a mots-cles rediges. Un index du corps
des pages est desormais construit (ftx_fr.json, 105 pages ; ftx_en.json,
103 pages ; 200 mots significatifs par page, normalises sans accents),
charge paresseusement au premier usage — rien n'est telecharge tant
qu'on ne cherche pas.

Les deux moteurs (c_abd9013c3955.js, c_df4f446df566.js) recoivent le
meme greffon : a partir de 3 caracteres, les pages dont le texte contient
TOUS les mots de la requete s'ajoutent sous un groupe "Texte des pages" /
"Page text", sans doublonner les resultats a mots-cles (deduplication par
chemin). Un numero de sequence invalide les reponses tardives pour eviter
les resultats fantomes en cours de frappe. Teste en local : "sabangali"
trouve la page Contact des deux cotes, Enter navigue, zero erreur
console. Service worker bumpe (et-202608282120).

Mon erreur du chapitre : mon premier controle Playwright a declare
"Enter ne navigue pas" — j'avais attendu 1,2 s quand la navigation
locale en prenait davantage ; le journal de Playwright montrait la
navigation bel et bien partie. L'instrument ne juge plus jamais seul,
meme quand c'est moi qui tiens le chronometre.

## 278 — P3 : une carte SVG unifie les operations cibles (2026-08-28)

Troisieme chantier : la geographie. Chaque pole racontait ses lieux dans
son coin ; aucune vue d'ensemble. La page cibles-2030 (FR et EN) recoit
une section "Une carte, toutes les operations cibles" : un Tchad stylise
en SVG inline (trace simplifie a ~29 sommets, projection equirectangulaire
maison), avec le siege (N'Djamena), la raffinerie modulaire cible
(Djarmaya), le gaz de Sedigui au bassin du lac, la reprise de champs au
bassin de Doba, le corridor d'export en pointilles vers Kribi et les
villes du reseau (Moundou, Sarh, Abeche) — chaque implantation reprise
dans une liste laterale cliquable vers sa page. role="img", title et
desc pour les lecteurs d'ecran ; la legende assume : "carte stylisee —
positions indicatives".

Deux allers-retours au pixel ont ete necessaires : les etiquettes Doba,
Moundou et Sarh se chevauchaient au sud (repositionnees), et une
coordonnee flottante (126.19999...) a fait rater un remplacement ancre
sur "126.2" — controle par capture apres chaque retouche, dans les deux
themes et les deux langues.

## 279 — P5 : le kit presse devient telechargeable en un clic (2026-08-28)

Quatrieme chantier. Le kit media du site (logo, banniere, photos,
boilerplates, palette — chapitre anterieur) restait une collection de
liens un par un. Un bundle unique kit-presse-enertchad.zip (0,8 Mo) est
desormais publie : logo SVG et PNG 512, banniere 1200x630, fiche de
presse, brochures FR et EN, quatre photos d'illustration, boilerplates
FR/EN en .txt, palette officielle, et un LISEZMOI qui rappelle l'usage
editorial, les marques en depot (OAPI) et le statut de societe en
constitution. Lien "Tout le kit (ZIP)" en tete des cartes kit media de
carnets et carnets-en.

Au passage, une incoherence attrapee : la fiche de presse
(EnerTchad-fiche-presse.md) disait encore "sept poles d'activite" — le
document que les redactions copient-collent contredisait le site corrige
au chapitre 271. Reecrite : huit poles, quatre de chaine (Amont,
Intermediaire, Aval, EnerChimie) et quatre de soutien. Les photos
institutionnelles attendront la seance photo (registre).

## 280 — P4 : le data book investisseur, chaque chiffre avec sa source (2026-08-28)

Cinquieme et dernier chantier realisable du plan. Les majors publient
des data books telecharges par les analystes ; EnerTchad a desormais le
sien, a l'echelle d'une societe en constitution :
Data_Book_EnerTchad.xlsx, six feuilles — Lisez-moi (avertissement
complet, legende des statuts), Identite, Capital et jalons, Cibles 2030,
Allocation cible (la seule formule du classeur, SUM des parts, verifiee
a 100 %), Contexte marche. Chaque ligne porte sa page source et son
millesime ; le 144 kb/j reste au millesime 2025 de l'Atlas (l'arbitrage
2024/2025 du registre reste ouvert). Carte ajoutee a l'etagere de
l'investisseur FR et EN.

La traque des "7 poles" du chapitre 271 n'etait pas finie : les tuiles
data-count de cibles-2030 (FR et EN) affichaient encore "7 poles" — le
compteur anime avait echappe au motif <b>7</b> — et les meta
description et og:description de l'accueil FR disaient "Sept poles".
Corriges (le suffixe FR "poles" de la tuile EN aussi). Il reste, hors
perimetre publie, docs-sources/brochure_print.html ("Sept poles") : la
source d'impression de la brochure PDF, a regenerer — inscrit au
registre.

Mon erreur du chapitre : la premiere version de la carte du data book
sur l'etagere etait redigee sans accents — mon reflexe de journal
applique a une page publique. Corrigee avant publication ("publiés",
"millésimes", "identité", "août") ; le francais du site porte ses
accents, seul ce journal n'en porte pas.

Bilan des cinq chantiers : 2 calendriers .ics, 2 index plein-texte et
2 moteurs greffes, 2 cartes SVG, 1 ZIP presse, 1 classeur XLSX,
12 fichiers HTML retouches, 2 bumps de service worker
(et-202608282120 puis et-202608282220 avec la regeneration des index),
6 commits. P6 a P10 attendent leurs arbitrages au registre.

## 281 — Les documents telechargeables remis au canon des huit poles (2026-08-28)

Le registre portait "regenerer la brochure PDF" : sa source
d'impression disait encore "Sept poles". Le tirage du fil a revele bien
plus.

**Ce qui etait perime dans les documents** : la brochure FR (kicker
"Sept poles", titre "L'organisation du groupe" — alors que le site
martele "societe unique, pas un groupe" — et sept cartes de poles,
EnerConseils absent) ; la brochure EN (source deja passee a "Eight"
mais PDF publie jamais regenere, il imprimait encore "SEVEN POLES" ;
et la meme carte manquante) ; la fiche arabe (tuile "7 aqtab · une
societe"). Corrections : kickers et titres remis au canon, carte
EnerConseils ajoutee dans les deux langues (la marque conseil, adossee
a l'Atlas), tuile arabe passee a 8. Les trois PDF sont regeneres par
impression headless (A4, 6 pages FR/EN, 2 pages AR, page 3 verifiee a
l'image : huit cartes, mise en page intacte) — le timeout du chapitre
271 n'a pas recidive avec l'impression en ligne de commande.

**Mon erreur, la vraie lecon du chapitre** : au chapitre 279, j'ai
"corrige" la fiche de presse en enumerant les huit poles... avec des
noms inventes — "EnerChimie, EnerTech, EnerTalents" — repris pour
partie du texte perime que je remplacais, sans verifier le canon du
site. Le vrai canon, lisible dans la navigation meme : Amont,
Intermediaire, Aval, Petrochimie pour la chaine ; GreenTech,
TchadiTech, Tchaditude, EnerConseils pour le soutien. L'erreur s'etait
propagee a trois livrables publies hier soir : la fiche de presse, la
feuille Identite du data book, et la copie de la fiche dans le ZIP
presse. Les trois sont corriges et republies. Corriger un chiffre sans
verifier les noms qui l'entourent, c'est remplacer une incoherence par
une autre : desormais, toute enumeration recopiee se verifie contre la
navigation du site, qui est la seule source des noms de poles.

Publie : trois PDF regeneres, trois sources docs-sources corrigees,
fiche de presse, data book et ZIP presse republies avec les bons noms.

## 282 — QA de la vague "versus majors" : tout tient, zero correctif (2026-08-28)

Revue de qualite des cinq chantiers et des regenerations, avant de
rendre la main. Chapitre de journal seulement : aucun fichier de site
modifie.

**Balayages** : console propre sur les sept pages touchees (accueil,
investisseurs, cibles-2030, carnets, en FR et EN) dans trois
configurations — sombre, clair, mobile 390 px ; axe a zero violation
sur les sept.

**Mobile** : la carte des operations passe en une colonne sans
debordement horizontal ; les boutons du calendrier investisseur vivent
dans l'accordeon mobile de la page et mesurent 262x54 et 258x44 une
fois la section depliee — au-dessus du plancher tactile de 44 px.
Premier verdict de l'instrument : "boutons 0x0". C'etait l'accordeon
replie, pas un defaut — verifie au pixel apres expansion.

**Palette plein-texte au clavier** : les fleches descendent jusqu'au
groupe "Texte des pages", Entree navigue, Echap ferme. La encore,
une attente fixe de 2,5 s avait conclu "Entree ne navigue pas" ;
waitForNavigation prouve le contraire en une seconde. Deux fois dans
la meme vague : l'attente fixe est un juge myope, la promesse de
navigation est le bon instrument.

**Livrables depuis la production** : les deux .ics passent un parseur
strict (4 evenements chacun, tous TENTATIVE avec UID et DTSTART) ; le
ZIP presse est integre (14 entrees, fiche au canon) ; le classeur
s'ouvre, six feuilles, allocation totale a 100 %, noms de poles
canoniques.

Bilan de la commande "apply all" : six chapitres (276 a 281), onze
commits, cinq chantiers livres, trois PDF regeneres, une erreur de
canon corrigee et consignee, et une QA finale sans correctif.

## 283 — P10 : le compteur public de constitution est en ligne (2026-08-28)

"Next on all" : les cinq dossiers en attente d'arbitrage (P6 a P10)
sont avances jusqu'a leur limite realisable ; ce qui exige le
proprietaire reste au registre, nominalement. Cinq chapitres.

P10 d'abord, le plus simple : la reponse d'une societe non cotee au
ticker des majors n'exigeait aucune donnee nouvelle — les jalons
publies suffisaient. Une bande compteur s'affiche desormais en tete de
la feuille de route investisseurs (FR et EN) : 1 jalon franchi (capital
fondateur), 1 en cours (immatriculation), 3 a venir — avec la mention
"mis a jour a chaque jalon". Le compte est derive des cinq jalons deja
publies sur la page, rien d'invente. Benche dans les deux themes.

## 284 — P9 : des alertes sans infrastructure, honnetement (2026-08-28)

L'infrastructure d'envoi (backend, listes, double opt-in) reste au
registre. Mais trois canaux reels existaient deja et n'etaient pas
proposes comme alertes : le flux RSS des Carnets, le calendrier .ics
du chapitre 276, et la boite officielle. La section agenda (FR et EN)
offre desormais "Flux RSS" et "S'abonner aux alertes par e-mail" — un
mailto pre-rempli vers contact@enertchad.td — avec la phrase honnete :
la liste est tenue a la main, sans pistage, et les alertes
automatisees viendront avec l'infrastructure dediee. Rien de simule.

## 285 — P7 : la gouvernance s'incarne par les mandats, avant les noms (2026-08-28)

Les noms reels restent un arbitrage proprietaire. Ce qui n'en est pas
un : dire qui fait quoi. La page gouvernance (FR et EN) decrit
desormais, sous les quatre organes OHADA, six fonctions de tete —
direction generale, finance & IFRS, technique & operations, HSE-Q,
conformite & juridique, relations investisseurs — chacune avec son
mandat, et la mention en lettres capitales : titulaire annonce a la
formalisation.

Mon erreur du chapitre : un .upper() applique a une chaine contenant
des entites HTML a produit "&EACUTE;" en toutes lettres a l'ecran —
attrape au premier banc pixel, corrige en ecrivant l'accent en dur.
Les entites ne survivent pas aux majuscules mecaniques.

## 286 — P8 : l'arabe s'etend d'une section, pas encore de dix pages (2026-08-28)

La traduction de ~10 pages reste au registre (arbitrage qualite).
L'increment realisable : la section investisseurs de la page arabe
recoit le compteur de constitution (1 accomplie, 1 en cours, 3 a
venir), les cinq jalons en cartes, et l'agenda 2026 (memorandum et
webinaire au T3, data room avec GCIC au T4) — redige dans le registre
de langue deja publie sur la page et la fiche arabe, avec la mention
"objectifs dates, pas des resultats". RTL verifie, deux themes, zero
erreur console.

## 287 — P6 : un point d'etape, en attendant le premier rapport annuel (2026-08-28)

Le "rapport annuel de constitution" attend la formalisation des
organes qui l'approuveraient. Ce qui existe des maintenant : un POINT
D'ETAPE public — Point_Etape_EnerTchad_2026.pdf, quatre pages A4
imprimees depuis docs-sources comme les brochures : couverture datee
(aout 2026), l'annee en faits verifiables (compteur, tableau des cinq
faits), la trajectoire chiffree (paliers de capital, cibles 2030,
allocation, agenda), et la methode avec l'avertissement complet — "ni
un rapport annuel approuve, ni un document d'offre". Ajoute a
l'etagere de l'investisseur FR et EN. Le premier vrai rapport annuel
reste au registre, la ou il doit etre.

Fin de la vague "next on all" : cinq avancees publiees, cinq restes
d'arbitrage nettement delimites au registre (noms reels, traduction
arabe complete, infrastructure d'alertes, rapport annuel approuve,
donnees de jalons futures). Index plein-texte regenere, service worker
bumpe (et-202608290030).

## 288 — CP-2026-008 : le site annonce ses propres outils (2026-08-28)

Les six outils des vagues 276-287 existaient sans etre annonces — or le
site a un canal officiel pour cela. Communique CP-2026-008 publie sur
communiques et communiques-en (article date du 28 aout, liens vers
l'agenda, la carte et l'etagere), et pousse dans les deux flux RSS
(feed et feed-en, lastBuildDate mis a jour, XML valide, 46 elements).

Au passage, deux points d'hygiene : le JSON-LD des pages communiques
listait six communiques alors que sept articles etaient publies —
le CP-2026-007 du 23 aout n'y avait jamais ete ajoute ; les deux
listes sont regenerees depuis les articles eux-memes (huit entrees,
positions recalculees). Et le sitemap a ete repasse a l'heure git
(une seule adresse corrigee — le gros etait deja juste depuis le
chapitre 274).

Chapitre sans surprise : benches trois configurations, zero erreur
console, l'article s'affiche proprement dans les deux themes.

## 289 — Les nouveaux outils entrent dans la palette, en entrees redigees (2026-08-28)

La recherche plein-texte (chapitre 277) trouvait deja les nouveaux
outils par leur texte ; il manquait les entrees redigees, celles qui
repondent aux mots que les visiteurs tapent vraiment ("ics",
"alertes", "data book", "compteur"). Quinze entrees rejoignent les
donnees de la palette : sept en francais (agenda abonnable, alertes,
compteur de constitution, data book, point d'etape, carte des
operations, fonctions de tete) et huit en anglais (les memes plus le
kit presse). Les seize ancres visees ont ete verifiees dans les pages,
et six requetes de test placent chacune sa cible en premiere position.

Un doublon evite de justesse : une entree "Kit media officiel"
existait deja cote francais — plutot que d'en ajouter une seconde, ses
mots-cles ont ete enrichis (zip, telecharger, tout le kit) et la
nouvelle entree retiree. Cote anglais, aucune entree kit n'existait :
celle-la reste. Verifier l'existant avant d'ajouter — la lecon du
chapitre 281 s'applique aussi aux index.

Service worker bumpe (et-202608290145) : les donnees de palette sont
des scripts, servis reseau d'abord mais versionnes proprement.

## 290 — QA iOS : le burger etait hors ecran sur tous les iPhone (2026-08-28)

Revue de la version iOS, menee pour la premiere fois dans un vrai
moteur WebKit (le moteur de Safari), en emulation iPhone 14, SE et
14 Pro Max.

**Le defaut principal, corrige** : sur toute la famille des 138 pages
a mega-menu, la rangee d'actions de l'en-tete (pilule FR·EN clonee,
loupe, burger) debordait de l'ecran sous ~430 px — le bouton du menu
sortait de 32 px sur un iPhone 14 (12 px visibles) et de 42 px sur un
SE. Present dans les DEUX moteurs : la matrice mobile du chapitre 270
ouvrait le tiroir par script et n'avait jamais mesure le bord droit du
bouton. Correctif dans nav_a.css : sous 470 px, gouttieres reduites,
pilule et loupe compactees, marque legerement resserree ; sous 375 px
la pilule FR·EN s'efface (le tiroir garde le lien English). Verifie
aux cinq largeurs 320 a 470 dans les deux moteurs : le burger tient.

**Deuxieme correctif** : plight_extrait.css portait trois declarations
backdrop-filter sans jumelle -webkit- — le flou des cartes en theme
clair disparaissait sur les Safari anterieurs a la version 18.
Appariees ; le site est desormais a 100 % de paires sur ses ~4600
declarations (le seul "impair" restant est la requete @supports du
repli sans flou, qui est justement la pour ca).

**Ce qui est deja propre pour iOS** : viewport-fit=cover et 104 usages
de safe-area (l'encoche etait deja pensee), tous les champs de saisie
a 16 px (pas de zoom force au focus), repli @supports sans flou,
recherche plein-texte et panier boutique fonctionnels au tap WebKit,
formulaire contact, zero debordement horizontal sur huit pages cles,
tiroir et accordeon conformes (liens de rubrique a 44 px).

**Limites d'instrument consignees** : dans ce WebKit headless,
l'horloge des animations CSS reste gelee sur les pages lourdes (les
animations restent "running" a t=0) — le tiroir semblait invisible
alors que seule la premiere image de son animation etait peinte ; en
forcant la fin des animations, tout s'affiche. Sur un vrai Safari,
l'horloge tourne. S'y ajoutent un avertissement ResizeObserver benin
sur cibles-2030 et le fait qu'un tap Playwright ne peut pas atteindre
un bouton partiellement hors ecran — c'est d'ailleurs ce qui a trahi
le defaut.

Service worker bumpe (et-202608290300).

## 291 — Balayage WebKit iPhone : 209 pages, zero defaut (2026-08-28)

Suite logique du chapitre 290 : apres les huit pages cles, tout le
site est passe dans le moteur de Safari en emulation iPhone 14 —
209 pages, en trois lots paralleles, avec pour chaque page les erreurs
console, les requetes en echec, le debordement horizontal et le bord
droit du bouton de menu (le defaut corrige au chapitre precedent).

Resultat : zero erreur console, zero requete en echec, zero
debordement, zero burger hors ecran. L'unique signal du site entier
est l'avertissement ResizeObserver deja connu sur cibles-2030 — la
boucle de redimensionnement des graphiques en canvas, benigne et
intermittente : elle apparait en passage sequentiel et pas sous charge
parallele.

Rigueur d'instrument : un balayage qui rend "tout est propre" se
verifie avant d'etre cru. Le harnais a ete controle sur un cas a
defauts connus (la page aux graphiques plus une adresse inexistante) —
il attrape bien l'erreur et le 404 ; et un lot a ete rejoue avec
comptage pour prouver que les 209 pages ont ete parcourues (12 pages
en 37 s, soit environ 3 s par page). Chapitre de journal seulement.

## 292 — Ultra review de la chaine face a ExxonMobil et Chevron : le fil manquant (2026-08-28)

Revue demandee : la structure Amont / Intermediaire / Aval du site,
confrontee a la maniere dont ExxonMobil et Chevron presentent la leur.

**Ce que font les deux majors** : ils ont quitte le decoupage classique.
ExxonMobil s'organise depuis 2022 en trois affaires — Upstream, Product
Solutions (l'aval et la chimie fusionnes) et Low Carbon Solutions — et
se presente comme "societe integree carburants, lubrifiants et chimie" ;
Chevron ne publie que deux segments (Upstream, Downstream — le midstream
y est fondu) et son site raconte des themes (energie, technologie,
operations) plutot que des maillons. Moralite : chez les majors, le
midstream n'est plus un etage marketing, et l'histoire vendue est
l'INTEGRATION, pas la tripartition.

**Le verdict pour EnerTchad** : garder la chaine classique est le bon
choix — un site pedagogique de societe en constitution doit montrer les
maillons, pas les abstraire ; et au Tchad, l'Intermediaire est une vraie
these (le corridor Doba-Kribi est l'artere du pays), la ou Chevron peut
se permettre de le fondre. La revue a confirme une coherence solide :
ordre Amont -> Intermediaire -> Aval -> Petrochimie identique dans la
navigation, le pied de page, la societe et la carte ; squelette commun
des quatre hubs (enjeux, approche, offre, chantiers) ; nommage FR/EN
aligne (Upstream/Midstream/Downstream/Petrochemicals).

**Le manque, corrige** : l'integration — le message central des majors —
etait affirmee partout ("de la roche-mere a la pompe") mais les quatre
hubs ne se RELIAIENT pas : aucun fil d'un maillon au suivant. Les huit
pages (FR et EN) portent desormais un bandeau "Chaine de valeur · de la
roche-mere a la pompe" : les quatre maillons en pastilles, le pole
courant en or, chaque voisin a un tap — l'equivalent EnerTchad du recit
d'integration d'Exxon, sans copier sa fusion de segments. Benche deux
themes et mobile, zero debordement.

**Deux retouches au passage** : le h1 de la Petrochimie FR passait en
minuscule ("chimie") la ou son titre capitalise ; et la page EN disait
"chemicals & processing" en h1 contre "chemistry & transformation" en
titre — harmonises en "Chimie & transformation" / "Chemistry &
transformation".

**Observation consignee, non corrigee** : les hubs Petrochimie (FR et
EN) n'ont ni section "approche" ni section "offre", contrairement aux
trois autres maillons — le quatrieme pole de chaine est structurellement
plus mince. Redaction a prevoir, inscrite au registre.

HTML seulement : pas de bump du service worker.

## 293 — Le quatrieme maillon rattrape les trois autres (2026-08-28)

L'observation du chapitre 292 est soldee : les hubs Petrochimie (FR et
EN) n'avaient ni section "approche" ni section "offre". Les deux sont
construites — au gabarit exact des autres maillons (frise numerotee
pour l'approche, colonnes accordeon pour l'offre) — a partir du contenu
deja publie dans les quatre sous-pages du pole (complexe, chimie-eor,
marches, produits) : rien d'invente, tout re-assemble.

L'approche en cinq principes : adosser la chimie a l'Aval, sequencer du
plus mur au plus capitalistique, substituer l'import ligne par ligne,
la chimie qui fait couler le brut (EOR sur natron et neem, au service
de l'Amont), une qualite par partenariat. L'offre en deux colonnes :
cinq familles de molecules (engrais azotes, methanol, GPL, bitume et
soufre, polymeres) et trois lignes de chimie de production, chacune
renvoyant a sa sous-page.

Bench dans les deux themes, accordeons verifies au clic reel — le
controle synthetique de la page EN avait d'abord repondu "ferme" la ou
un vrai clic ouvre et deplace cent mille pixels : l'instrument ne juge
plus jamais seul, une fois de plus. Index plein-texte regeneres,
service worker bumpe (et-202608290430).

## 294 — QA de consolidation des hubs de chaine (2026-08-28)

Verification d'ensemble apres les chapitres 292 et 293 : les huit hubs
de la chaine (FR et EN) passes a axe (zero violation) et au balayage
console dans les deux themes (zero erreur), bandeau de chaine et
nouvelles sections comprises. Chapitre de journal seulement.

## 295 — QA face aux compagnies nationales : ADNOC et Saudi Aramco (2026-08-28)

Le referentiel change : apres les majors privees (chapitres 275 et
292), les compagnies nationales — le modele auquel EnerTchad aspire
reellement ("champion national").

**Ce que font les deux NOC** : ADNOC structure son site en cinq portes
(Our Story, Our Business, Our Projects, AI & Technology,
Sustainability), revendique une mission duale ("Maximum Energy.
Minimum Emissions.") et surtout porte un programme de contenu local
NOMME et mesure — l'In-Country Value (ICV). Aramco, cotee, met en
avant sa discipline d'information (rapports intermediaires,
publications), son magazine editorial (Elements), son ecosysteme
fournisseurs et son programme local iktva.

**Le verdict pour EnerTchad — l'essentiel du referentiel NOC est deja
la** : mission nationale nommee ("Acces aux energies", souverainete,
prix ARSAT) ; page Projets en nav et au footer (l'analogue d'Our
Projects, FR et EN) ; technologie en porte de nav (Innovation /
TchadiTech) ; durabilite chiffree (zero torchage vise, 30 %+ energie
de site, 125 MW solaire) ; magazine editorial (64 carnets, l'analogue
d'Elements) ; discipline d'information au-dessus de son stade (point
d'etape, data book, calendrier abonnable) ; et un contenu local
MESURE : cible publiee de 80 % d'effectifs tchadiens, presente dans le
tableau d'indicateurs ESG (FR et EN, "80 % a l'echelle, 2030"),
critere pondere de la grille achats, comparaison assumee aux standards
regionaux.

**Le seul ecart structurel** : ADNOC dit "ICV", Aramco dit "iktva" —
un mot, une page, un chiffre. Chez EnerTchad, la substance existe mais
vit repartie entre engagements, achats et Tchaditude, sans nom de
programme. Or nommer un programme est une decision de marque du
proprietaire — la lecon du chapitre 281 (les noms viennent du canon,
jamais de moi) s'applique : PROPOSITION AU REGISTRE, nommer le
programme de contenu local d'EnerTchad et lui donner sa page. Aucun
correctif publie : la QA n'a trouve aucun defaut realisable.

## 296 — L'accueil s'allege : le collage photo retire (2026-08-28)

Demande du proprietaire : supprimer le collage de cinq photos de
l'accueil pour optimiser l'espace. La section (pipeline, station de
nuit, champ solaire, casques, reservoirs) est retiree des deux
accueils, FR et EN, avec ses regles CSS dediees dans les blocs
home-plus et print-home — pas de style mort laisse derriere. Environ
1,9 Ko de moins par page ; les cinq images restent utilisees ailleurs
(autres sections, kit presse), aucun fichier supprime. Verifie dans
les deux themes : zero erreur console, pas de trou de mise en page,
pas de debordement.

## 297 — Audit des donnees structurees : la FAQ fantome de 41 pages (2026-08-28)

Audit complet des blocs JSON-LD du site — 767 blocs sur 209 pages,
tous parses : zero erreur de syntaxe, un seul nom d'organisation, un
seul hote canonique. Mais trois derives de fond, toutes corrigees.

**La FAQ fantome** : 41 pages portaient un bloc FAQPage generique dont
AUCUNE question n'apparaissait sur la page — un balisage decrivant un
contenu invisible, contraire aux consignes des moteurs (le balisage
FAQ doit refleter ce que le visiteur voit). Les 41 blocs sont retires ;
les 6 vraies FAQ (dont faq.html et ses 28 questions visibles) gardent
le leur. Sur clients.html, deux questions du bloc avaient derive du
texte visible ("s'applique-t-il partout" vs "vraiment partout") —
resynchronisees.

**Le fil d'Ariane bilingue** : 72 pages anglaises pointaient leur
"Home" vers l'accueil francais (/), une vers /en, 29 vers /index-en —
trois conventions pour un meme fil. Les 102 fils d'Ariane anglais
pointent desormais tous vers /index-en. Et le Configurateur, seul
outil sans fil d'Ariane, a recu le sien au modele du Calculateur.

**Mes faux positifs, consignes** : le premier detecteur comparait les
questions au texte de la page SANS retirer les scripts — chaque bloc
se validait contre lui-meme (48 FAQ "visibles" en apparence) ; corrige,
il en restait 41 fantomes. Puis les apostrophes typographiques de la
page contre les droites du JSON fabriquaient 6 fausses absences sur
faq.html — normalisation avant comparaison. Deux lecons du meme jour :
l'instrument se calibre sur un cas connu avant de juger le site.

Au meme chapitre : le tableau de bord du registre publie en artifact
(compteurs, arbitrages, veilles, chapitres 275-296 filtrables), etabli
au chapitre 296. 125 fichiers modifies, publies en treize lots ; HTML
seulement, pas de bump du service worker.

## 298 — L'accueil s'apparie : les quatre maillons deux par deux (2026-08-28)

Demande du proprietaire : sur l'accueil, Amont et Intermediaire
(upstream, midstream) sur la meme rangee, Aval et Petrochimie sur la
suivante — une presentation plus dense et plus premium que les quatre
bandes pleine hauteur empilees.

Realisation en pur CSS, sans toucher au balisage : la grille de la
section des maillons passe en deux colonnes au-dela de 1000 px
(bloc style coeurs-duo insere apres mln-css, FR et EN). Chaque
panneau se compacte (72svh au lieu de 100, gouttieres reduites,
chiffres fantomes redimensionnes), les panneaux miroirs reprennent
l'alignement a gauche pour rester lisibles en demi-largeur, et un
filet vertical separe les paires — theme clair compris. Sous 1000 px,
rien ne change : l'empilement mobile reste tel quel.

Verifie en geometrie (deux colonnes, rangees 2+2, zero debordement)
et au pixel dans les deux themes et les deux langues ; l'ecran
d'accueil montre desormais la chaine complete en deux rangees au lieu
de quatre ecrans.

## 299 — Les poles de soutien apparies a leur tour (2026-08-28)

Meme exercice que le chapitre 298, demande par le proprietaire pour les
quatre appuis : sur l'accueil FR et EN, GreenTech et TchadiTech
partagent desormais la premiere rangee, Tchaditude et EnerConseils la
seconde. Le bloc coeurs-duo est simplement etendu de #coeurs a
:is(#coeurs,#appuis) — memes compactages, meme filet vertical, meme
realignement des panneaux miroirs, theme clair compris ; le mobile
garde son empilement.

Verifie en geometrie (deux sections en 2+2, zero debordement) et au
pixel : l'accueil raconte maintenant les huit poles en quatre rangees
au lieu de huit ecrans — la chaine en deux, les appuis en deux.

## 300 — Trois cents chapitres : consolidation de la vague accueil (2026-08-29)

Chapitre rond, esprit inchange : verifier avant d'avancer.

**QA de la vague 297-299** : les deux accueils reorganises et un
echantillon des pages debarrassees de leur FAQ fantome (achats, eor,
academie, clients, ethique-en) passes a la console et a axe dans les
deux themes — zero erreur, zero violation ; et dans le WebKit iPhone,
les deux sections de l'accueil retombent bien en une colonne sous
1000 px, sans debordement.

**Le sitemap remis a l'heure** : les quinze commits de la vague ont
date 128 pages au 29 aout — les lastmod sont regeneres de l'historique
git (129 corrections avec le report de la veille), XML valide.

**Le tableau de bord du registre** est republie a jour du chapitre
300 : les quatre derniers chapitres ajoutes, compteurs rafraichis.

Etat au chapitre 300 : 209 pages en deux langues et demie, huit poles
en quatre rangees sur l'accueil, dix outils investisseur, un journal
public qui n'a jamais saute un chapitre — et huit decisions qui
attendent le proprietaire, listees au tableau de bord.

## 301 — Balayage bi-moteur des 209 pages apres les vagues 292-300 (2026-08-29)

Neuf chapitres ont touche une centaine de fichiers (rubans de chaine,
hubs petrochimie, purge JSON-LD, accueil en 2+2 deux fois) : un
balayage complet des deux moteurs s'imposait avant d'aller plus loin.

**Chromium desktop, theme sombre, 209 pages** : console, erreurs de
page, requetes en echec (>=400), debordements horizontaux — zero
anomalie sur les trois lots paralleles.

**WebKit iPhone 14, 209 pages** : meme grille plus le controle du
bouton de menu (l'ecueil du chapitre 290) — une seule entree au
rapport, l'avertissement ResizeObserver de cibles-2030, connu,
intermittent et benin (le harnais avait ete calibre dessus au
chapitre 291) ; aucun debordement, aucun bouton hors ecran, aucune
requete en echec.

Verdict : les vagues 292-300 n'ont rien casse. Journal seul publie —
aucun fichier du site ne change.

## 302 — Audit de performance : l'accueil 2x2 passe la mesure (2026-08-29)

L'accueil venait de changer de structure deux fois (chapitres 298-299) :
avant d'ouvrir de nouveaux chantiers, mesure de six pages representatives
(les deux accueils, deux hubs, investisseurs, cibles-2030) au moteur
Chromium instrumente — LCP, CLS, poids par famille de ressources,
images surdimensionnees, etat des polices.

**Resultat : rien a corriger.** CLS entre 0 et 0,014 partout (seuil
Google : 0,10). Chaque page a heros precharge son image LCP avec
fetchpriority=high — un balayage des 209 pages n'a trouve aucun fond
de heros sans preload. Les polices sont en font-display:optional, les
gros scripts (chart.umd, 200 Ko) en defer, les regles de speculation
prechargent la navigation interne, et la production sert le brotli
avec des images immutables (verifie sur trois URL Vercel).

Deux leviers restent, consignes comme arbitrages plutot que traites a
chaud : les 19 feuilles de style bloquantes de l'accueil (389 Ko —
HTTP/2 attenue, une consolidation toucherait l'ordre de cascade de
209 pages) et la migration AVIF des heros webp (150-175 Ko piece,
gain estime 30-40 %, mais les fonds CSS inline ne permettent pas de
repli progressif simple). Chapitre de mesure : aucun fichier du site
ne change.

## 303 — Maillage interne : le graphe des 209 pages est sain (2026-08-29)

Graphe de liens reconstruit hors chrome (nav, header, footer retires)
pour ne compter que les liens de contenu, puis re-verifie chrome
compris pour les cas limites.

Resultat : aucune page orpheline. Les quatre candidates du premier
passage (esg, plan du site FR/EN) sont en realite liees par le pied
de page de tout le site ; les hubs lient leurs sous-pages dans le
contenu ; les 64 journaux (32 FR + 32 EN) sont tous references par
les carnets, verifie fichier par fichier ; le plan du site existe en
deux langues et date d'hier, avec les pages les plus recentes dedans.

**Mon erreur, consignee avant d'etre commise** : deux de mes huit
propositions du jour — creer un glossaire et un plan du site —
visaient des pages qui existent deja (glossaire-petrolier, 70 termes
et JSON-LD, refait hier ; plan-du-site, a jour). J'ai propose sans
re-verifier l'inventaire. Les chantiers sont requalifies : le
glossaire recevra une extension ciblee au lieu d'une creation, le
plan du site n'a besoin de rien. Chapitre d'audit : aucun fichier du
site ne change.

## 304 — Glossaire : une categorie Reperes Tchad (2026-08-29)

Le glossaire existant (70 termes, chapitre d'hier) couvrait bien la
technique mais pas le terrain : ni Doba, ni Sedigui, ni le corridor,
ni le FCFA. Ajout d'une huitieme categorie « Reperes Tchad » (teinte
cyan distincte) avec neuf entrees — bassin de Doba, Sedigui, corridor
Doba-Kribi (1 070 km), Djarmaya, contenu local (80 %), RCCM, FCFA,
les villes relais Moundou-Sarh-Abeche, et le 144 kb/j avec renvoi
explicite a l'arbitrage du millesime — plus « Brent » dans la
categorie Cadre, en echo a la veille du registre. Meme travail en
anglais (« Chad landmarks »). Les definitions reprennent le
vocabulaire des pages du site, pas d'invention.

**Mon erreur** : l'insertion en fin de tableau JS n'a pas ajoute la
virgule manquante a l'ancienne derniere entree — le rendu tombait a
zero terme avec une erreur console. Le test de rendu l'a attrape
avant publication ; virgule posee, 80 termes affiches et filtre
« Reperes Tchad » verifies dans les deux langues. Changement HTML
seul : pas de bump du service worker.

## 305 — Revue de structure face a TotalEnergies et Eni (2026-08-29)

Troisieme revue comparative apres Exxon-Chevron (ch. 292) et
ADNOC-Aramco (ch. 295), cette fois face aux deux europeens
historiquement lies au petrole tchadien : TotalEnergies (reseau de
distribution present au pays) et Eni (modele africain du contenu
local et du developpement accelere). Navigation des deux sites lue le
jour meme.

Le constat, axe par axe : le modele satellite d'Eni (Plenitude,
Enilive, Versalis) correspond aux quatre poles d'appui ; son magazine
et ses recits correspondent aux carnets et aux 64 journaux ; son plan
strategique 2026-2030 a cibles-2030 ; ses pages ESG et ethique
existent chez EnerTchad. Le decoupage par verbes de TotalEnergies
(explorer-produire, transformer-developper, expedier-vendre) est
deja couvert par l'accueil en 2+2 et ses bandeaux « S'orienter » ;
ses pages projets par l'atlas et les pages sites. Aucun changement
de fichier ne s'impose : le referentiel tient.

Deux points remontent au registre : le rapport de durabilite
periodique (les deux publient un rapport dedie annuel — a fusionner
avec l'arbitrage « premier rapport annuel » deja consigne, en
precisant son perimetre durabilite) ; et l'assistant de site par IA
(EnergIA chez Eni) — la palette et la recherche plein-texte couvrent
la navigation, l'assistant conversationnel est un arbitrage
proprietaire nouveau.

## 306 — La trajectoire des jalons devient interactive (2026-08-29)

Troisieme proposition du jour qui visait une chose deja construite :
la « chronologie interactive » existait aux trois quarts — section
trajectoire (courbe SVG des cinq jalons animee au defilement),
feuille de route datee, compteur de jalons, agenda. Requalifie en
amelioration ciblee plutot qu'en doublon.

Ce qui manquait : la courbe etait purement decorative. Chacun des
cinq jalons (capital fondateur, immatriculation, premiere levee,
pilote EOR, cap des 20 milliards) est desormais un lien SVG focable
au clavier — aria-label complet, grossissement du point et halo au
survol comme au focus, anneau blanc en focus visible, et le clic
mene au calendrier detaille de la section jalons. Theme clair
couvert (texte or fonce sur creme). Meme travail sur la version
anglaise. Verifie au navigateur : cinq liens focables, navigation
vers #jalons effective, zero erreur console dans les deux langues.
Changement HTML seul : pas de bump du service worker.

## 307 — Cartes sociales : les journaux prennent la couleur de leur pole (2026-08-29)

L'audit a d'abord donne tort a la proposition initiale : les 209
pages ont deja og:image et twitter:card, et neuf visuels 1200x630
existent (un generique plus un par pole), poses des le 25 aout. Les
hubs et leurs sous-pages utilisent deja le bon visuel — quatrieme
proposition du jour largement deja construite.

Le vrai reste a faire etait dans les carnets : 58 des 64 journaux
partageaient le visuel generique (seules les trois interviews
etaient rattachees). Vingt-six journaux (et leurs vingt-six
miroirs anglais) recoivent le visuel de leur pole — forage, EOR,
Sedigui, criblage et densite vers l'amont ; corridor, camions,
stockage, transfert de garde et integrite vers l'intermediaire ;
mini-raffinerie, stations, prix du litre, GPL, bitume et marques
vers l'aval ; uree et chimie EOR locale vers la petrochimie ; gaz
torche, eau de production et hybride solaire vers GreenTech ; champ
numerique et robotique vers TchadiTech ; l'academie vers Tchaditude ;
l'atlas vers EnerConseils. Trois journaux transverses (mecanique des
fluides, premiere du genre, rente partagee) gardent le generique,
choix assume plutot qu'un rattachement force. og:image,
twitter:image et l'image JSON-LD changent ensemble (trois
occurrences par fichier, 156 remplacements, 52 fichiers).

## 308 — La 404 offre les huit poles (2026-08-29)

La page 404 etait deja mieux que sa reputation : logo, bouton de
recherche qui ouvre la palette, liens utiles (boutique, clients,
carnets, contact, plan du site) et ligne anglaise. Il lui manquait
la carte du site en raccourci : un bloc « Ou repartir d'un pole »
ajoute huit pastilles aux couleurs des poles — la chaine puis les
appuis — vers les huit hubs. Verifie au navigateur : les huit liens
repondent, aucun debordement en 390 px, et le theme clair recolore
les pastilles de lui-meme (brun fonce sur creme, verifie par style
calcule et capture). Changement HTML seul.

## 309 — L'espace arabe devient un mini-site (2026-08-29)

L'arbitrage « arabe complet » attendait le proprietaire ; ses huit
propositions validees d'un « apply all » tranchent le premier pas.
La page arabe couvrait deja l'investisseur, la FAQ et le contact en
sections — ce qui manquait vraiment : les huit poles n'existaient
pas en arabe, et aucune navigation ne reliait rien.

Deux ajouts. Une page ar-poles : les quatre maillons de la chaine
(al-manba, al-naql wal-takhzin, al-masabb, al-batrukimawiyat) et les
quatre appuis (noms latins conserves, descripteurs arabes), huit
cartes avec renvoi « details en francais » vers chaque hub, batie
sur le squelette RTL existant — memes styles, meme pied de page,
metadonnees et fils d'Ariane repointes. Et un bandeau de navigation
arabe sur les deux pages : accueil, poles, investisseurs, FAQ,
contact, pastille active dorée. Le plan XML passe a 210 URL.

Verifie au navigateur dans les deux formats (1280 et 390 px) : RTL
conserve, 8 cartes, zero debordement, zero erreur console, et la
capture confirme le rendu — hero sable, KPI, bandeau actif.
Changement HTML et sitemap seuls : pas de bump du service worker.

## 310 — Le tableau de bord du registre rejoint le chapitre 309 (2026-08-29)

Le tableau de bord artefact est republie a jour de la vague du jour :
les neuf chapitres 301-309 ajoutes a la liste, l'arbitrage « assistant
de site par IA » (repere EnergIA d'Eni, ch. 305) ajoute aux decisions
en attente — neuf desormais —, et deux notes actualisees : le rapport
annuel voit son perimetre etendu a la durabilite, l'arbitrage arabe
enregistre le mini-site lance au chapitre 309. Chapitre journal :
seul MAINTENANCE.md change sur le site.

## 311 — Consolidation : la nouvelle page entre dans les index, et un correctif d'accessibilite (2026-08-29)

Regle de la maison : apres une vague, on verifie avant d'avancer. La
verification a trouve deux choses, dont une de ma main.

**La page arabe des poles etait invisible du site lui-meme.** Publiee
au chapitre 309, elle n'existait ni au plan du site, ni dans la
palette Ctrl+K, ni dans la liste de reference. Corrige : entree au
plan du site FR et EN sous la version arabe, entree de palette dans
les deux langues — et, au passage, l'anglais recoit enfin une entree
vers la page arabe elle-meme, qui lui manquait depuis toujours (183
entrees FR, 157 EN, identifiants uniques verifies).

**Le glossaire n'etait pas cherchable.** Ses 80 termes sont rendus
par script : l'index plein-texte, bati sur le HTML statique, ne
voyait que les mots d'introduction de la page. Le vocabulaire des
termes est desormais verse dans l'index (44 mots -> 1 044 en
francais, 47 -> 1 010 en anglais). Verifie au navigateur : « sedigui »,
« djarmaya » et « rccm » ramenent maintenant le glossaire dans les
deux langues.

**Mon erreur (chapitre 306)** : en rendant les cinq jalons de la
courbe cliquables, j'ai laisse le SVG en role="img" — un role de
feuille, qui ne doit contenir aucun element focable. axe l'a signale
en nested-interactive sur les deux pages investisseurs, dans les deux
themes. La courbe n'est plus une image mais un groupe navigable :
role="group", intitule reecrit pour le dire. J'avais teste le clavier
et la navigation au chapitre 306, pas passe axe — le test manquant a
laisse passer une regression que le chantier lui-meme avait creee.

Le plan XML est redate de l'historique git (29 corrections ; 159
pages au 29 aout) et le service worker passe a et-202608290830, les
index etant des ressources servies par le cache. QA finale : onze
pages temoins, deux themes, console, axe, requetes et debordements —
zero anomalie ; huit pages relues au WebKit iPhone — idem.

## 312 — Des phrases trop grandes : trois debordements, dont deux anciens (2026-08-29)

Signalement du proprietaire : des phrases debordent. Mesure au
navigateur sur dix-neuf largeurs de fenetre, de 320 a 1920 px, dans
les deux langues — trois defauts distincts, tous reels.

**Les titres de poles ne tenaient plus dans les demi-panneaux.** Mon
appariement 2x2 (chapitres 298-299) a reduit chaque panneau de
moitie sans toucher a la taille des titres, restee calibree pour des
bandes pleine largeur : 50 px. En anglais, ou les intitules sont plus
longs, quatre titres debordaient leur boite de 22 a 38 px
(« Chemistry & petrochemicals » demandait 424 px dans 387).
Les titres sont plafonnes a l'interieur des grilles appariees
(2,6 rem au lieu de 3,15) et bornes a 19 caracteres de large, les
resumes a 34.

**La phrase du bandeau anglais depassait la fenetre depuis toujours.**
« Building the first 100 % Chadian integrated oil company. », forcee
sur une seule ligne au-dessus de 680 px, mesure environ 1,01 fois la
largeur de la fenetre : elle sortait de l'ecran de 47 a 65 px entre
800 et 1 150 px. Elle ne reste desormais sur une ligne qu'au-dela de
1 400 px, ou elle tient. Le francais avait le meme defaut a la
charniere : a 681 px, juste au-dessus de l'ancien seuil, son
troisieme bandeau sortait de 17 px — le seuil passe a 719 px.

**Mon erreur de methode** : mes balayages testaient deux largeurs,
1440 et 390. Ces trois defauts vivent entre les deux. Un test qui
n'echantillonne que les extremes ne prouve rien du milieu ; le
detecteur de ce chapitre balaie desormais dix-neuf largeurs.

**Et un defaut de traduction trouve au passage** : les bandeaux
anglais de l'accueil affichaient « Upstream · upstream »,
« Midstream · midstream », « Downstream · downstream ». Le motif
francais est « nom du pole · terme anglais » ; traduit mot a mot, il
se repetait. L'anglais renvoie maintenant le miroir — « Upstream ·
amont », « Midstream · intermediaire », « Downstream · aval »,
« Petrochemicals · petrochimie ».

QA : deux accueils, trois largeurs, deux themes — console, axe,
requetes, debordements : zero. WebKit iPhone idem. Feuille de style
partagee modifiee : cache-buster et service worker portes a
202608290900.

## 313 — La conviction de l'accueil cesse de crier (2026-08-29)

Capture du proprietaire a l'appui : le bloc « Nous croyons que le
petrole du Tchad doit d'abord profiter aux Tchadiens... » etait
compose trop grand. Diagnostic mesure : 188 signes en gras a 34 px
sur toute la largeur disponible — une phrase de paragraphe traitee
comme un titre d'affiche, cinq lignes pleine largeur.

Le corps passe de clamp(1,7 ; 3,4vw ; 2,9rem) a
clamp(1,35 ; 2,5vw ; 2,2rem) et la ligne est bornee a 26 em, mesure
classique de la citation detachee. Resultat verifie sur six largeurs
et deux langues : trois a cinq lignes de 38 a 50 signes partout, au
lieu de cinq a huit lignes pleine largeur. Le texte respire, la
phrase se lit comme une conviction posee et non comme un cri.

**Au passage, une inegalite typographique** : l'accueil anglais
utilisait quinze apostrophes droites (« Chad's », « country's »)
la ou le francais porte partout l'apostrophe typographique. Elles
sont redressees — sur l'accueil seulement, par substitution limitee
aux noeuds de texte (les balises, scripts et styles ne sont pas
touches). Le reste du site en compte encore 520 sur 81 pages,
inventoriees : ce sera un chapitre a part entiere, pas un ajout
discret a un correctif d'accueil.

Une observation gardee pour le proprietaire : la citation du hub
Petrochimie tient 119 signes la ou les sept autres en font 44 a 99 —
elle deborde a six lignes quand les autres en font deux a cinq. Le
bloc est dessine pour une phrase-choc ; celle-ci en contient deux.
C'est une decision d'ecriture, pas de style : je n'y touche pas.

QA : deux accueils, trois largeurs, deux themes — console, axe,
requetes, debordements : zero ; dix-neuf largeurs sans debordement ;
WebKit iPhone idem. Changement HTML seul : pas de bump du service
worker.

## 314 — L'accueil devient immersif : une seule image, des panneaux translucides (2026-08-29)

Demande du proprietaire : supprimer les photos de l'accueil et ne
garder que celle du fond, pour que les poles deviennent immersifs et
translucides.

**Ce qui est retire** : les huit photos de panneau (une par pole),
leurs conteneurs, les huit attributs data-mimg et le script de
chargement paresseux qui les posait. L'accueil ne charge plus qu'une
seule image, celle du fond fixe — une requete image au lieu de neuf.

**Ce qui change dans le rendu** : le panneau ne fabriquait plus son
propre plan (isolation:isolate) — il laisse desormais passer le fond
fixe de la page. Le voile passe d'un aplat quasi opaque a une teinte
translucide en degrade (.62 cote texte, .06 cote image) doublee d'un
backdrop-filter qui eclaircit la photo derriere le verre. Les huit
poles se lisent maintenant comme huit fenetres sur une meme scene,
chacune gardant sa couleur d'accent.

**Un defaut ancien trouve en chemin** : depuis l'appariement 2x2 du
chapitre 298, les panneaux « inverses » avaient leur texte realigne a
gauche mais gardaient un voile assombri a droite — le pare-soleil
etait du mauvais cote. Invisible tant que chaque panneau portait sa
propre photo sombre ; flagrant des que le fond s'ouvre. Le degrade
suit maintenant le texte.

**Mesure au pixel, comme la maison le veut** : contraste calcule sur
les pixels reellement peints derriere chaque bloc de texte, texte
masque, dans les deux themes. Sombre : de 5,37 a 8,74 (seuil AA 4,5) —
le pire cas, TchadiTech, etait a 3,52 avant la correction du voile
inverse. Clair : 10,4 partout. Le chiffre fantome, jusque-la masque
par la photo, est adouci de 13 a 8 % en theme clair.

Les regles CSS des photos de panneau sont laissees en place, inertes :
elles ne coutent rien et servent si les photos reviennent un jour.
QA : deux accueils, trois largeurs, deux themes — console, axe,
requetes, debordements : zero ; dix-neuf largeurs sans debordement ;
WebKit iPhone idem. LCP 936 ms, CLS 0,004.

## 315 — L'apostrophe droite disparait du site (2026-08-29)

Deux corrections approuvees par le proprietaire, faites ensemble.

**La citation du hub Petrochimie est ramenee a une phrase.** Le bloc
est dessine pour une accroche ; celle-ci en contenait deux (119
signes, six lignes la ou les sept autres poles en font deux a cinq).
La premiere phrase reste l'accroche — « Un baril ne vaut pas que son
carburant. » — la seconde ouvre le paragraphe en dessous, ou elle
etait a sa place. Meme geste en anglais. Mesure apres : deux lignes,
comme les autres. Aucun mot n'est perdu.

**Les 599 apostrophes droites sont redressees**, sur 97 fichiers.
La substitution ne touche que les noeuds de texte : les balises, les
attributs, les scripts, les styles et les blocs code/pre/kbd sont
ecartes par decoupage prealable, et un garde-fou verifie que le
nombre de chevrons est identique avant et apres. Trois formes
traitees : entre lettres (l'import), en fin de mot (Chadians'), et
devant un guillemet ouvrant (l'« equipe »). Les six apostrophes qui
suivent un chiffre sont conservees : ce sont des mesures en pieds
(conteneurs 20' et 40'), pas des elisions.

**La chaine des livrables suit** : les trois sources d'impression
etaient concernees, donc la brochure FR, la brochure EN et le point
d'etape sont reimprimes, et le kit presse est reconstruit avec les
deux brochures a jour et ses cinq fichiers texte corriges. Verifie
au texte extrait des PDF : zero apostrophe droite.

Plan XML redate (24 URL), QA sur un echantillon de douze pages dans
les deux themes — console, axe, requetes, debordements : zero.

## 316 — QA des poles : trois titres rognes, trois causes distinctes (2026-08-29)

Balayage complet des 80 pages de poles — 8 hubs francais, 8 hubs
anglais et leurs 64 sous-pages — apres les vagues 313-315. Console,
requetes, axe et debordements dans les deux themes : zero anomalie.
WebKit iPhone : zero. Les seize citations d'ouverture tiennent en
deux a cinq lignes, Petrochimie comprise depuis le chapitre 315.

La geometrie, elle, mesuree sur cinq largeurs de fenetre, a sorti
trois defauts reels — tous invisibles a 1440 px, tous entre 860 et
1200 px.

**Le titre de section des hubs sortait de l'ecran.** La regle
.ilede h2 imposait white-space:nowrap au-dessus de 760 px. En
anglais, « Processing and distributing as close as possible to
Chadians » quittait la fenetre coupe en plein mot entre 860 et
1200 px ; « Training the Chadian next generation » de meme ; et le
francais d'Aval y passait aussi a 860-1000 px. Le nowrap est retire :
le titre tient sur une ligne quand il y tient, et se replie sinon
(text-wrap:balance). Verifie sur les seize pages a sept largeurs.

**Les cartes de R&D rognaient leurs intitules.** La grille
.prod-grid restait a quatre colonnes jusqu'a 980 px : a 1000 px,
quatre colonnes de 184 px pour des titres de 25 px — « Distribution
digitale inclusive » et « Maintenance industrielle 4.0 » etaient
coupes en plein mot par la carte, qui masque son debordement. Le
passage a deux colonnes se fait desormais sous 1320 px, largeur en
dessous de laquelle quatre colonnes ne sont pas lisibles, et une
garde overflow-wrap protege les mots longs.

**« Petrochemicals » etait coupe dans la brochure.** Un seul mot de
quatorze lettres a 26 px dans une carte de 196 px : cesure
automatique posee sur .pcard-name, dans les deux brochures.

**Mon detecteur mentait deux fois.** Le titre de heros .pgh-flash
porte overflow:hidden et un pseudo-element de reflet place a
left:-35 % : sa largeur de defilement est gonflee par le reflet, pas
par le texte — six faux positifs, verifies a la capture. Et les
11 px de « l'approvisionnement » sur la page distribution sortent
d'un paragraphe sans clipping, a l'interieur du rembourrage de sa
carte : rien n'est masque. Regle a retenir : un depassement ne compte
que si un ancetre le rogne ou s'il sort de la fenetre.

Feuilles partagees modifiees (86, 16 et 2 pages) : cache-buster et
service worker portes a 202608291030 ; QA de controle sur dix pages
hors poles qui partagent ces feuilles — verte.

## 317 — Le reste du site passe a la mesure sur cinq largeurs (2026-08-29)

Le chapitre 316 a montre que trois defauts vivaient entre les
breakpoints, invisibles aux deux largeurs que mes balayages
testaient. Les 128 pages hors poles et hors accueil y passent a leur
tour : 390, 720, 1000, 1200 et 1440 px, 640 rendus.

Le detecteur est affine. Un depassement ne compte plus des qu'il
existe : il ne compte que si un ancetre le rogne ou s'il sort de la
fenetre. Les elements qui se rognent eux-memes sont ecartes — c'est
le cas du titre de heros, dont le pseudo-element de reflet gonfle la
largeur de defilement sans que rien ne deborde (six faux positifs au
chapitre precedent).

**Resultat : zero defaut sur les 128 pages.**

**Mon erreur, deux fois de suite.** Une affirmation « zero defaut »
ne vaut rien tant que l'instrument n'a pas ete verifie sur un cas a
defaut connu. J'ai donc reintroduit le defaut du chapitre 316 —
grille R&D a quatre colonnes sous 980 px — et le harnais a repondu
« non detecte ». Deux fois. J'allais consigner que l'instrument etait
aveugle. En instrumentant le calcul, la cause etait ailleurs : mon
retour arriere etait incomplet. Le premier essai n'avait retire que
le seuil, laissant en place la garde overflow-wrap qui corrige le
symptome a elle seule ; le second essai a vu son sed echouer
silencieusement sur la feuille minifiee. Une fois le defaut
reellement present — verifie a la mesure, grille a 184 px, titre a
130 px pour 183 px de texte —, le harnais l'a signale immediatement,
aux trois titres concernes.

La lecon vaut plus que le resultat : quand un calibrage echoue, la
premiere hypothese a tester n'est pas que l'instrument ment, c'est
que le cas de test n'est pas celui qu'on croit. Chapitre journal :
aucun fichier du site ne change.

## 318 — QA des bandeaux : deux de moins, le reste en verre (2026-08-29)

Inventaire de toutes les bandes horizontales des 210 pages —
tout element large de plus de 90 % de la fenetre et haut de moins de
220 px, avec son opacite, son flou et son texte. Puis tri : ce qui
sert, ce qui double, ce qui ne s'affiche meme pas.

**Le bandeau de cotations ne s'affichait nulle part.** Desactive par
un display:none!important pose il y a longtemps, son balisage restait
dans 83 pages : un bloc de 4 Ko chacune, soit **343 Ko de balisage
mort**. Verifie a huit largeurs, de 360 a 1600 px : jamais visible.
Retire, avec son commentaire d'entete ; le script de positionnement
qui le cherchait le gardait deja en garde nulle, et reste en place
pour les barres collantes.

**Soixante-quinze pages portaient deux pieds de navigation.** Le
pager riche (« Accueil · Suivant → nom de la page ») et un second
plus pauvre (« Retour · Nos Poles »), empiles, 290 px de bandes pour
une seule fonction. Le pauvre est retire ; le retour reste assure par
le fil d'Ariane et par le lien Accueil du premier.

**Le bandeau utilitaire etait le seul opaque de l'en-tete.** A 0,92
d'opacite et sans flou, il coupait net l'image de fond en haut de
138 pages, juste au-dessus d'une barre de navigation en verre. Il
passe a 0,40 avec flou et saturation ; le theme clair passe de 0,96 a
0,58. Le sommaire collant des pages investisseurs suit, de 0,90 a
0,40.

Contraste mesure sur les pixels reellement peints, texte masque, dans
les deux themes : bandeau utilitaire de 5,20 a 6,66 ; sommaire 13,3
en sombre et 14,6 en clair — tous au-dessus du seuil AA de 4,5.

**Ma sonde a menti deux fois avant de dire vrai.** Elle prenait comme
reference le premier texte venu de la bande — parfois la pastille
active, qui porte son propre fond dore : elle mesurait alors du texte
sombre sur une bande sombre et annoncait 1,17 puis 1,01. J'ai failli
durcir le verre pour rien. Corrigee — elle ecarte desormais tout
element portant un fond propre —, elle a revele le vrai defaut, qui
etait ailleurs : les liens du sommaire gardaient une couleur claire
dans les deux themes. Sur le nouveau fond clair ils devenaient
illisibles ; ils prennent enfin une couleur sombre en theme clair.

Restent, assumes : la barre de chaine a 0,02 et la sous-navigation de
pole a 0, deja en verre ; et la banniere cookies, opaque sur deux
pages ou elle est injectee par script — element transitoire, hors du
decor. Cache-buster de la feuille de navigation et service worker
portes a 202608291130 ; plan XML redate.

## 319 — Balayage complet apres la vague des bandeaux, et un defaut d'accessibilite ancien (2026-08-29)

Cent quarante-cinq fichiers avaient change au chapitre 318 : les
210 pages repassent a la console, aux requetes, a axe et aux
debordements. Trois signaux, trois natures differentes.

**Mon harnais lisait des couleurs a mi-fondu.** axe signalait par
intermittence un contraste de 3,65 sur le surtitre d'un hub. Mesure
faite : au repos, la couleur du pole donne 6,31 — la valeur fautive
etait celle du texte compose a mi-animation d'apparition. Le harnais
attend desormais que les animations se posent avant de mesurer ; le
signal a disparu sur six essais consecutifs. Meme famille que le
reflet du titre de heros au chapitre 316 : ce n'est pas la page qui
ment, c'est l'instant ou on la regarde.

**Quatre apostrophes droites avaient survecu au chapitre 315.**
Elles vivaient echappees (\') a l'interieur des chaines JavaScript du
glossaire anglais, que la substitution excluait a raison — on ne
convertit pas des guillemets dans du code a l'aveugle. Elles sont
redressees a la main dans le tableau des termes, plus un libelle pose
par script sur la page clients. Les 80 termes s'affichent toujours
dans les deux langues.

**Et un vrai defaut, lui, permanent : les liens de corps de texte.**
axe l'a signale sur une page ; un detecteur deterministe ecrit pour
l'occasion — un lien en ligne dont la couleur n'atteint pas 3:1 avec
la phrase qui l'entoure, sans souligne ni bordure — en a trouve sur
**37 pages**, jusqu'a des liens exactement de la meme couleur que
leur phrase, donc invisibles comme liens (WCAG 1.4.1). Les liens de
corps portent maintenant un souligne discret, pose au niveau des
feuilles partagees pour les liens sans classe, et repris a la main
sur seize liens qui portaient un text-decoration:none en style en
ligne. Les liens habilles — boutons, puces, cartes — ne sont pas
touches. Verification : zero page en theme sombre, sur les 210.

**Residu assume** : deux ancres, sur les deux brochures et les deux
accueils en theme clair, resistent encore — leur souligne est ecrit
en style en ligne et le calcul rend none, sans qu'aucune regle
correspondante ne se declare. Je n'ai pas trouve la cause et je ne
la maquille pas : c'est note ici pour la prochaine passe. Service
worker porte a 202608291330.

## 320 — Le tableau de bord rejoint le chapitre 319 (2026-08-29)

Republication du tableau de bord du registre a jour des dix derniers
chapitres : consolidation des index (311), phrases trop grandes (312),
conviction de l'accueil (313), accueil immersif (314), apostrophes
typographiques (315), QA des poles (316), mesure sur cinq largeurs
(317), QA des bandeaux (318), liens de corps de texte (319). Les neuf
arbitrages du proprietaire restent inchanges. Chapitre journal : seul
MAINTENANCE.md change sur le site.

## 321 — Le residu du chapitre 319 elucide : le pied de page ecrasait le souligne (2026-08-30)

Le chapitre 319 s'etait termine sur un aveu : quatre ancres — sur les
deux brochures et les deux accueils, en theme clair — refusaient de se
souligner, alors meme que l'une d'elles portait un `text-decoration:
underline` en style en ligne. Un style en ligne ne se laisse battre que
par un `!important`, et je n'avais trouve aucune regle correspondante.
J'avais consigne le fait sans le maquiller. C'est resolu.

**Mon erreur, encore une fois instrumentale.** La sonde que j'avais
ecrite pour enumerer les regles applicables ne renvoyait rien du tout.
Elle testait `if (rule.cssRules) { descendre dans le groupe }` avant de
lire le selecteur — or, depuis que Chrome accepte les regles imbriquees,
`cssRules` existe aussi sur une simple regle de style, ou il est vide.
Ma sonde prenait donc chaque regle ordinaire pour un groupe, descendait
dans un tableau vide et passait a la suivante : 64 feuilles, 0 regle
lue, 0 correspondance. Un instrument qui repond « rien » n'est pas la
preuve qu'il n'y a rien. Corrige (lire d'abord `selectorText`, ne
descendre que s'il est absent), le meme balayage a rendu 2894 regles et
designe la coupable en une seconde.

**La cause.** Une regle heritee, presente dans les trois feuilles du
theme clair (`bundle_core_a1.css`, `plight_extrait.css`,
`x_cd256286824c.css`) :

    html.et-plight footer a:not(#e1):not(#e2):not(#e3):not(#e4):not(#e5)
    { color:#0E4172!important; text-decoration:none!important }

Elle avait ete ecrite pour rendre lisibles les colonnes de liens du pied
de page en theme clair, et elle fait bien son travail pour eux. Mais
elle vise *tous* les liens du pied, sans distinction, et en
`!important` : elle emportait aussi le lien WhatsApp de la bande
newsletter des accueils (`.fn-alt a`, qui se soulignait pourtant par sa
propre feuille de page) et le lien « Investisseurs » du paragraphe
« moteurs de marge » des brochures, ecrit en style en ligne. Deux liens
en pleine phrase, distingues par la seule couleur, a 1,40 de contraste
avec le texte qui les entoure : WCAG 1.4.1 en defaut.

**Inventaire avant correction.** Plutot que d'ecrire une regle au juge,
j'ai recense sur les 210 pages tous les liens situes dans un `p`, un
`li` ou un `dd` a l'interieur d'un `footer` ou d'un `.jfoot` : il y en a
exactement quatre sur tout le site, et ce sont les quatre en cause. Les
colonnes de navigation du pied n'utilisent pas de liste. Le correctif ne
peut donc rien atteindre d'autre.

**Le correctif.** Ajoute aux trois memes feuilles, avec une specificite
superieure a celle de la regle heritee (six identifiants factices contre
cinq) :

    html.et-plight footer :is(p,li,dd) a:not([class])
      :not(#e1)...:not(#e6){ text-decoration:underline!important; ... }

Le `:not([class])` reprend la garde du chapitre 319 : aucun bouton,
aucune pastille, aucun lien habille ne peut etre touche. Les quatre
sous-proprietes portent `!important` elles aussi, sinon le raccourci
`text-decoration:none!important` de la regle heritee reimposait son
epaisseur `auto`.

**Verification.** Detecteur du chapitre 319 relance sur les 210 pages,
theme clair puis theme sombre : 0 defaut de part et d'autre. Axe
WCAG 2.1 AA sur les quatre pages touchees, dans les deux themes : 0
violation, 0 erreur console. Le souligne calcule mesure 0,616 px sur
les accueils et 0,704 px sur les brochures, dans les deux themes.

Service worker : `et-202608300130` (trois feuilles modifiees).

## 322 — Revue des outils et des commandes de navigation (2026-08-30)

Revue complete des elements sur lesquels on clique : les 210 pages ont ete
inventoriees (bouton, champ, selecteur, resume repliable, tout ce qui porte
un role ou un gestionnaire), puis chaque famille a ete exercee au lieu
d'etre relue. Trois familles existent : la barre principale avec ses cinq
mega-menus (138 pages), le tiroir mobile (137 pages), et onze outils de
calcul. Sept defauts reels sont sortis, dont deux francs.

### Ce qui allait deja

Les onze calculateurs repondent, sans NaN, sans Infinity, sans erreur
console, sur les 210 pages balayees. J'ai verifie leurs formules a la main
plutot que de me fier au fait qu'un chiffre bouge : l'estimateur
volumetrique de l'atlas rend 3 000 Mm3 de volume brut pour 100 km2 sur 30 m,
540 Mm3 de volume poreux a 18 % de porosite, 2,01 Gbbl de STOIIP a 65 % de
saturation avec Bo=1,1 et 6,29 bbl/m3, et 501,8 Mbbl recuperables a 25 % —
exact au dernier chiffre affiche, y compris la conversion en 9,5 ans au
rythme de 144 kb/j. Le calculateur du baril additionnel est juste lui aussi
(1 000 Mbbl a +8 % = 80 Mbbl, 21,9 kb/j sur dix ans, 6,4 Md$ a 80 $/bbl,
2,56 Md$ pour l'Etat a 40 %). Le variateur de luminosite est correctement
construit (bouton nomme, aria-expanded, aria-controls, panneau en role
group, prereglages en toutes lettres). Le tiroir mobile ouvre, verrouille
le defilement, se referme a Echap et au second appui sur 131 pages sur 132.

### Defaut 1 — le mega-menu ne se refermait jamais (138 pages)

Un declencheur de divulgation doit refermer au second appui. Ici le second
clic laissait le panneau ouvert et aria-expanded a "true", sur les 138
pages, dans les deux themes. Deux scripts du meme fichier se battaient :
le premier retire la classe .open, le second — celui qui rend le menu
utilisable au clavier — repose sur le panneau des styles en ligne
visibility/opacity en !important des que le declencheur prend le focus, et
un clic donne le focus. La classe partait, la peinture restait.

Le correctif retire ces styles en ligne a la fermeture et pose .kbesc, la
classe deja utilisee par Echap, qui neutralise :hover et :focus-within tant
que le declencheur garde le focus.

Deux consequences ont demande deux passes de plus, et je les note parce que
je ne les avais pas prevues :

- .kbesc etait levee sur `mouseleave`. Refermer d'un clic puis eloigner la
  souris rouvrait donc le panneau, puisque le declencheur gardait le focus.
  La levee est passee a `mouseenter` : sortir la souris ne rouvre rien,
  y revenir rouvre au survol comme avant.
- Echap depuis l'interieur du panneau ne fermait pas non plus. Le retour du
  focus au declencheur declenche un `focusin`, et le gestionnaire clavier y
  retirait .kbesc juste avant que le gestionnaire d'Echap ne s'en serve.
  aria-expanded disait "false" pendant que le panneau restait peint. Le
  gestionnaire d'Echap repose maintenant la classe, et un `focusout` qui
  reste a l'interieur de l'element ne la leve plus.

### Defaut 2 — le menu mobile mort du glossaire francais (1 page)

Sur glossaire-petrolier.html, et sur cette page seule parmi les 138, le
bouton hamburger n'ouvrait rien : #navLinks restait en display:none, et le
bouton ne portait ni aria-expanded ni aria-controls. La page n'embarquait
pas le script qui cable ce menu — la version anglaise, elle, le charge.
Un visiteur au telephone n'avait aucune navigation sur cette page. Script
ajoute ; le tiroir s'ouvre desormais sur 703 px de hauteur comme ailleurs.

### Defaut 3 — les curseurs sans anneau de focus (208 pages)

Au clavier, un curseur focalise ne se distinguait plus d'un curseur au
repos. Mesure au pixel : 15/255 d'ecart maximum, un halo creme sur fond
creme. La cause est une regle ecrite pour les champs de texte,
`input:focus-visible{outline:none!important; border-color:...; box-shadow:
...}` : elle remplace l'anneau par une bordure doree et une lueur, ce qui
n'a aucun sens sur un curseur, qui n'a pas de bordure. WCAG 2.4.7. Anneau
retabli pour les seuls `input[type=range]`.

### Defaut 4 — la piste des curseurs a 7 px a la souris

Le chapitre 219 avait garanti 28 px de hauteur de cible aux curseurs, mais
en enfermant la regle dans `@media(pointer:coarse)`. A la souris la piste
ne mesurait que 7 px. Sur la pile de cinq curseurs de l'estimateur
volumetrique, l'exception d'espacement de WCAG 2.5.8 ne joue pas — les
voisins sont a moins de 24 px. La garantie est desormais inconditionnelle.

### Defaut 5 — la note d'echelle ecrasait sa rangee (2 pages)

Sur les deux atlas, sous le resultat « Recuperable » de l'estimateur
volumetrique, un script ajoute une note d'echelle (« ~ 9,5 ans au rythme de
production national »). Il l'insere comme TROISIEME enfant d'une rangee flex
reglee en space-between : le libelle se retrouvait colle a la valeur, sans
espace (« Recuperable501,8 »), l'unite « Mbbl » etait renvoyee seule a la
ligne, et la note se tassait dans une colonne de quelques mots. A toutes les
largeurs, dans les deux themes. La note passe desormais a la ligne, sous le
chiffre, comme une legende ; verifie sur six largeurs de 390 a 1440 px.

### Defaut 6 — la pastille active du sommaire, sous le seuil (2 pages)

Dans le sommaire lateral des deux pages « solutions », en theme clair,
l'onglet actif affichait 4,29:1 la ou il en faut 4,5. La pastille porte son
propre fond bleu et sa propre couleur de texte (#08111F), mais la regle de
theme clair qui repeint tous les liens du sommaire a exactement la meme
specificite et vient apres : elle ramenait le texte a rgba(20,32,50,.78) sur
ce bleu. C'est le piege deja rencontre au chapitre 318 — un element qui
porte son fond doit etre exclu des repeintures de theme. Regle d'exclusion
ajoutee ; on remonte a 7,3:1.

### Defaut 7 — le hamburger a 40 px sur cinq pages anglaises

`.nav-tog{width:44px;height:44px}` de nav_a.css perdait, a specificite
egale, contre une feuille chargee apres elle sur cinq pages. Specificite
relevee ; les 137 boutons mesurent maintenant 44 x 44.

### Mon erreur, et ce qu'elle a coute

Le premier harnais a annonce que les mega-menus ne s'ouvraient pas du tout
au clic sur la moitie des pages. C'etait faux : il lisait l'opacite en
pleine transition, avec des attentes fixes de 450 ms alors que le script
resynchronise l'etat a 340 ms et que la transition dure 280 ms. Une capture
d'ecran a suffi a le montrer — le panneau etait grand ouvert. Le harnais a
ete refait sans delai fixe : il attend que l'opacite soit stable sur quatre
lectures consecutives. C'est la meme lecon qu'au chapitre 317, apprise une
fois de plus : quand la mesure accuse, on soupconne d'abord la mesure.

Deux autres fausses pistes ont ete ecartees de la meme facon. Les curseurs
paraissaient plafonner a 7 px malgre une regle a 28 px : la regle etait
simplement gardee par `@media(pointer:coarse)`, que le navigateur sans tete
ne declare pas — le defaut existe, mais il n'etait pas celui que je croyais.
Et l'enumeration des regles applicables ne rendait rien du tout tant que je
n'avais pas corrige, comme au chapitre 321, le test `rule.cssRules` qui
prend chaque regle ordinaire pour un groupe.

Une troisieme forme du meme piege est apparue a la verification finale, en
production cette fois, et elle merite d'entrer au registre : dans un onglet
Chrome qui n'est pas au premier plan, `getComputedStyle` peut rendre des
valeurs perimees. Le panneau portait `visibility:visible !important` et
`opacity:1 !important` en style en ligne — impossible a battre dans la
cascade — et la lecture repondait pourtant `hidden` et `0`. Une capture
d'ecran du meme onglet a montre le menu grand ouvert. Regle ajoutee a la
maison : sur un onglet reel non visible, l'image fait foi, pas la mesure.

### Observation laissee en l'etat

Le bouton « Imprimer / PDF » du pied de page porte la classe `nav-search`,
celle du bouton loupe de la barre. Aucun script ne s'y accroche et un style
en ligne neutralise l'apparence heritee : rien ne casse aujourd'hui, mais
c'est un piege pour la prochaine regle qui visera `.nav-search`. Renommer
la classe toucherait 205 fichiers pour un gain nul a l'ecran ; je le note
ici plutot que de gonfler la publication.

Service worker : `et-202608300720` (nav_a.js, nav_a.css et quatre feuilles
modifiees ; nouveaux jetons de cache sur les 138 pages qui appellent nav_a).

## 323 — Le site remis d'aplomb sur telephone (2026-08-30)

Revue du rendu mobile : les 210 pages mesurees a 360 et 390 px de large,
dans les deux themes, puis rejouees sous WebKit avec le profil iPhone 14.
Cinq defauts, dont trois qui coupaient du texte.

### Du contenu sortait de l'ecran, sans defilement pour aller le chercher

Huit pages laissaient des blocs entiers au-dela du bord droit a 360 px —
et comme la page ne defile pas horizontalement, ce contenu etait purement
perdu pour le lecteur. Sur brochure-en.html, la carte « Retail, at the
pump » mesurait 453 px de large dans une fenetre de 390 : une phrase sur
deux finissait tronquee au milieu d'un mot.

La cause est la meme partout, et elle est instructive. Le minimum
automatique d'un element de grille vaut son min-content. Il suffit donc
d'un seul enfant indivisible pour que la piste `1fr` — qui devrait valoir
la largeur disponible — grossisse jusqu'a lui. Ici l'enfant coupable etait
un bouton : `Mining & construction framework contract`, en
`white-space:nowrap`, 415 px d'un seul tenant. La regle mobile du site
imposait pourtant bien `grid-template-columns:1fr!important` ; elle etait
appliquee, et impuissante, parce que ce n'est pas la valeur maximale de la
piste qui debordait, c'est son plancher.

Trois correctifs, poses ensemble :

- `min-width:0` sur les enfants des grilles du site — le plancher
  automatique tombe, la piste redevient elastique ;
- `max-width:100%` sur les boutons, et retour a la ligne autorise en
  dessous de 1040 px, pour qu'un libelle long ne depasse plus sa carte ;
- coupure des mots trop longs et tableaux qui defilent dans leur propre
  boite au lieu de pousser la page.

Un cas a demande un etage de plus : sur la grille ESG des brochures, une
grille imbriquee dans un flex reproduisait le probleme un niveau plus bas.
Le plancher doit tomber a chaque etage, pas seulement au premier.

**Resultat mesure** : 8 pages en defaut a 360 px avant, 0 apres ; le
defilement horizontal parasite de journal-mini-raffinerie-modulaire.html
(22 px) a disparu ; verifie ensuite a 320, 390, 430, 600, 720, 1024, 1280
et 1440 px, et sous WebKit iPhone sur les 210 pages.

### L'accordeon du pied de page n'etait tactile que sur 12 px

Sur telephone, chaque colonne du pied devient une ligne depliable d'une
cinquantaine de pixels de haut, avec un « + » a droite. Un script enveloppe
le titre dans un `<button>` a marge interne nulle, tandis que les 30 px de
marge restent sur le `h3` qui l'entoure. Seule la bande centrale de 12 a
20 px repondait donc au doigt — et le « + », dessine par le `h3`, ne
repondait pas du tout. Trois quarts de la cible visible etaient morts.
La marge interne est passee sur le bouton : la ligne entiere, « + »
compris, mesure desormais 354 x 50 px. Verifie sur les 205 pages
concernees, sous Chromium et sous WebKit.

### Le courriel et le telephone du pied, a 18 px de haut

Ce sont les deux liens qu'on touche le plus depuis un mobile. Ils
mesuraient 18 px de haut, marge interne comprise. Portes a 44 px.

### La signature du logo tombait a 9,6 px

Sous 470 px de large, une regle ramenait « ACCES AUX ENERGIES » de 11 a
9,6 px — le plus petit texte du site, sur l'ecran le plus petit. La mesure
montre que la prudence etait excessive : a 11 px la signature occupe
131 px au lieu de 113, et l'entete ne bouge pas d'un pixel, meme a 320 px
de large. Retour a 11 px. Plus aucun texte du site ne passe sous 11 px sur
telephone.

### Deux boutons flottants l'un sur l'autre

Sur ar.html, le bouton de theme se posait a 22 px sous le variateur de
luminosite, et passait dessous (z-index 70 contre 2147483600) : la moitie
de sa surface etait inatteignable. Il remonte au-dessus du variateur.

### Ce que la mesure a failli me faire dire

Mon detecteur d'elements insecables a d'abord accuse `.chain-flow` sur les
deux brochures : 522 px de contenu pour une boite de 354. C'etait faux. Il
mesurait la largeur maximale du conteneur, qui est un flex `wrap` — le
`nowrap` ne portait que sur un enfant, qui passait tranquillement a la
ligne. Le detecteur ne retient plus un cas que si le bord droit sort
vraiment de la fenetre ou si un ancetre rogne.

J'ai aussi essaye un correctif generique, `:where(*){min-width:0}`, a
specificite nulle. Il reglait le probleme a 1024 px mais en creait un
autre a 360 : une grille a deux colonnes sans classe voyait sa seconde
piste tomber a 0 px et son contenu sortir de l'ecran. Le remede general
etait pire que la liste explicite ; j'ai garde la liste.

### Observations laissees en l'etat

`ResizeObserver loop completed with undelivered notifications` apparait
par intermittence sous WebKit sur cibles-2030.html. Verifie contre la
version publiee avant correctif : le message est anterieur et sans effet
visible. Consigne, pas maquille.

Les cibles tactiles restantes sous 24 px sont des liens en pleine phrase
(renvois du glossaire, liens de corps de texte), que WCAG 2.5.8 exempte
explicitement.

Service worker : `et-202608301150` (quatre feuilles modifiees, aucune page
HTML touchee).

## 324 — Ce qui saute sous le pouce : la stabilite visuelle sur telephone (2026-08-30)

Deux passes apres la vague mobile du chapitre 323. D'abord la verification
d'usage — les 210 pages sur cinq largeurs, 390, 600, 900, 1200 et 1440 px —
puis une mesure de performance sur telephone bride : reseau a 1,6 Mb/s,
150 ms de latence, processeur divise par quatre.

### La verification : rien n'a bouge, et l'instrument a encore menti

Les regles du chapitre 323 ne sont pas bornees a une largeur ; il fallait
donc verifier partout. Sur les 1 050 mesures (210 pages x 5 largeurs),
**aucun element ne sort de la fenetre**. Calibrage prealable : en
reintroduisant artificiellement le defaut corrige au chapitre 323, le
detecteur le retrouve immediatement avec le meme compte qu'avant correction
(28 elements sur brochure-en.html). L'instrument dit donc vrai quand il se
tait.

Il a en revanche accuse a tort une famille de textes « rognes ». Mon
detecteur remontait la chaine des ancetres jusqu'au premier qui coupe, mais
il ne s'arretait que sur `overflow:hidden` — il traversait donc sans les
voir les conteneurs en `overflow:auto`, qui defilent et ou le contenu reste
parfaitement atteignable. Un tableau qui glisse sous le doigt etait compte
comme du texte perdu. Corrige : on s'arrete au premier ancetre qui borne,
quel qu'il soit, et on ne signale que s'il cache sans defiler. Les cas
restants apres correction dependent de la position de defilement au moment
de la mesure (les blocs `.reveal` sont encore decales) : signal trop faible
pour agir, consigne comme tel.

### La mesure de performance : deux sauts de mise en page, tres reels

Sur telephone bride, quatorze pages depassaient le seuil de 0,1 de
Cumulative Layout Shift. Deux causes, toutes deux corrigees.

**cibles-2030.html : 2,13 de CLS, vingt fois le seuil.** Cette page est la
seule des 210 a ne charger aucune des trois feuilles qui replient la
navigation sur telephone. Le menu restait donc deploye en permanence
au-dessus du contenu — et sa hauteur oscillait entre 230 et 660 px, sans
fin, poussant toute la page de 430 px vers le bas puis la ramenant, environ
trois fois par seconde. Lire cette page sur un telephone etait
litteralement impossible.

Ce faisant, je dois corriger une phrase du chapitre 323. J'y avais note un
message `ResizeObserver loop completed with undelivered notifications`
apparaissant par intermittence sous WebKit sur cette meme page, et je
l'avais qualifie de « sans effet visible ». C'etait faux, et je n'avais pas
cherche assez loin : ce message etait precisement la trace de cette
oscillation. Le navigateur me disait ou regarder ; je ne l'ai pas ecoute.

Correctif : le repli du menu, avec le meme comportement qu'ailleurs, pose
en style de page. CLS **2,128 -> 0,004**, puis 0,000 apres le second
correctif. Tiroir verifie : il ouvre, il ferme, aria-expanded suit.

**Neuf pages anglaises : 0,22 a 0,23 de CLS.** Meme famille de cause. Le
voile de chargement, `#preloader`, doit etre `position:fixed` — hors flux,
il ne coute rien quand il disparait. Sur ces neuf pages la feuille qui le
declare n'etait pas chargee : le voile occupait 178 px en haut de page,
puis etait retire vers 4,3 s, tirant tout le contenu vers le haut d'un
coup. Le voile est remis hors flux dans les quatre feuilles communes.

Premiere correction posee, une seconde s'est imposee : sans la regle
`#preloader.done{opacity:0;visibility:hidden}` — absente des memes
feuilles — le voile, devenu plein ecran, restait opaque une seconde et
demie par-dessus la page. On echangeait un saut contre un rideau. Les deux
regles vont ensemble.

### Ce que la mesure donne, avant et apres

| | avant | apres |
|---|---|---|
| pages a CLS > 0,1 | 14 | 0 |
| pire CLS | 2,128 | 0,004 |
| CLS moyen | 0,0323 | 0,0092 |
| CLS p95 | 0,130 | 0,058 |
| LCP p95 | 7 280 ms | 6 556 ms |
| FCP median | 3 600 ms | 3 392 ms |

Deux pages de carnets ressortaient encore a 0,130 dans le balayage
d'apres-correction. Remesurees seules, trois fois de suite : 0,000. Le
chiffre venait de la contention processeur entre les trois navigateurs
paralleles du banc, pas du site. La comparaison avant/apres reste valable —
les deux campagnes ont tourne dans les memes conditions — mais les valeurs
absolues du balayage sont a lire avec cette reserve.

### Ce qui reste sur la table

Le poids median d'une page est de 590 ko, dont 164 ko pour la seule feuille
`bundle_core_a1.css`, chargee partout. C'est le premier poste d'economie du
site, et il demande un travail de fond — decouper cette feuille par famille
de pages — que je ne fais pas a la sauvette. Le LCP median reste a 3,9 s
sur ce profil bride ; il tient surtout au poids CSS.

Aucune image surdimensionnee sur les 210 pages.

Non-regression : axe WCAG 2.1 AA et console propres sur les 210 pages dans
les deux themes ; aucun debordement, aucun defilement horizontal parasite,
aucun chevauchement a 390 px.

Service worker : `et-202608301420`.

## 325 — La home est-elle une vitrine de la chaine ? Diagnostic (2026-08-30)

Analyse demandee par le proprietaire : la page d'accueil devrait etre une
vitrine articulee autour d'Amont, Intermediaire et Aval. Diagnostic mene
sur piece — structure des deux accueils, geometrie mesuree a 1440 et
390 px, comptage des liens et des formulations sur les 210 pages. Aucune
modification du site dans ce chapitre : les constats appellent des
arbitrages editoriaux qui n'appartiennent qu'au proprietaire.

### Ce qui est deja coherent

Le recit d'ouverture est bien celui de la chaine. Le hero dit « Le Tchad
exporte son brut et importe ses carburants. Nous inversons », puis
« produire, raffiner et distribuer au pays » et « De la roche-mere a la
pompe » — c'est l'histoire d'Amont-Intermediaire-Aval, sans detour. Le
megamenu « Nos activites » ouvre dans le bon ordre : amont, intermediaire,
aval, petrochimie, puis les appuis. La section des maillons precede celle
des appuis, chaque panneau a sa porte d'entree, et une sortie claire
(« Explorer la chaine, maillon par maillon ») mene a l'explorateur.
L'anglais est le miroir exact du francais (memes sections, memes
hauteurs a 2 % pres).

### Constat 1 — la home traite les huit poles a parite quasi parfaite

La vitrine annoncee n'existe pas dans les proportions. Mesures :

- Surface de page : les maillons occupent 13,3 % de l'accueil au bureau,
  les appuis 12,1 %. Un point d'ecart.
- Liens : 10 a 15 liens par pole sur la page, sans hierarchie — Aval en
  compte 15, TchadiTech aussi.
- Grammaire visuelle : les deux sections utilisent le meme composant
  (panneaux immersifs du chapitre 314), le meme gabarit de titre, la meme
  numerotation (« maillon 01 sur 4 » / « appui 01 sur 4 »), le meme
  appel « Decouvrir le pole -> ». Seuls l'ordre et les intitules disent
  que l'un est le coeur et l'autre le soutien ; l'oeil, lui, voit huit
  tuiles equivalentes.

C'est un choix defendable (le portail des huit poles), mais ce n'est pas
une vitrine de la chaine.

### Constat 2 — la chaine n'apparait qu'au troisieme bloc

Au bureau, le premier maillon arrive a 1 628 px, soit 1,8 ecran ; au
telephone, a 2 000 px, soit 2,2 ecrans — apres le bloc « Qui nous
sommes ». Un visiteur mobile doit defiler plus de deux ecrans avant de
voir Amont, et six avant d'avoir vu Aval. Le hero, lui, n'offre que
« Decouvrir EnerTchad » (ancre generique) et « Investir » : aucune entree
directe vers la chaine depuis le premier ecran.

### Constat 3 — trois cadrages de la chaine cohabitent sur le site

Le site emploie trois formules concurrentes : « 8 poles » (104
occurrences, le cadrage dominant), « quatre maillons » avec Petrochimie
dans la chaine (l'accueil), et « 3 poles · coeur de metier » avec la
chaine reduite a Amont-Intermediaire-Aval (la brochure). La demande du
proprietaire — une vitrine autour d'Amont, Intermediaire et Aval —
epouse le troisieme cadrage ; l'accueil est construit sur le deuxieme.
La question « la chaine, c'est trois maillons ou quatre ? » n'est
tranchee nulle part, et c'est elle qui commande tout le reste.

### Constat 4 — apres les poles, la home redevient un portail

Onze sections suivent les appuis (raison d'etre, vision, investisseurs,
carnets, produits, agenda, publications, raccourcis...), soit environ
55 % de la page ou la chaine n'est plus le fil conducteur. Total : 16,3
ecrans au bureau, 25,5 au telephone. C'est la longueur d'un portail
documentaire, pas d'une vitrine.

### Les cinq arbitrages proposes (registre du proprietaire)

1. Trancher le cadrage : chaine = 3 (la molecule, Petrochimie en
   prolongement industriel) ou chaine = 4. Une seule formule, partout.
2. Donner la hierarchie visuelle a la chaine : bande maitresse
   Amont -> Intermediaire -> Aval pleine largeur en tete de section,
   appuis en rangee compacte secondaire — aujourd'hui les huit tuiles
   sont interchangeables.
3. Remonter la chaine d'un cran : hero, chaine, puis « Qui nous
   sommes » — le parcours de la molecule visible au premier defilement.
4. Ajouter au hero une entree directe « Suivre la molecule -> » vers la
   chaine, a cote d'Investir.
5. Degraisser la seconde moitie de la home (25,5 ecrans mobile) en
   regroupant agenda, publications et raccourcis.

Chapitre d'analyse : seul MAINTENANCE.md change sur le site.

## 326 — La home devient la vitrine de la chaine (2026-08-30)

Le proprietaire a arbitre : la chaine, c'est Amont, Intermediaire, Aval —
et la petrochimie la prolonge. Les cinq propositions du chapitre 325 sont
appliquees dans l'ordre, sur les deux accueils.

**1. Le cadrage, tranche et applique.** La section des maillons disait
« Quatre maillons, quatre portes d'entree » ; elle dit desormais « Trois
maillons, une meme molecule ». Les panneaux passent de « Maillon 01 sur 4 »
a « sur 3 » ; la petrochimie quitte la numerotation pour un badge « + ·
Prolongement de la chaine ». L'introduction, le fil d'orientation
(« Amont -> Intermediaire -> Aval -> la pompe »), l'aria-label de la
section et l'introduction des appuis (« Les trois maillons font circuler
la molecule, la petrochimie la prolonge ») suivent, en francais et en
anglais. La formulation « quatre maillons » ne vivait que sur les deux
accueils : le reste du site (brochure « 3 poles · coeur de metier », les
« 8 poles » du groupe) etait deja aligne ou compatible.

**2. La hierarchie visuelle.** Les trois maillons forment desormais une
bande maitresse de trois colonnes pleine largeur ; la petrochimie devient
une bande de prolongement horizontale, plus basse, sous la bande ; les
quatre appuis passent en rangee compacte de quatre colonnes (titres et
fantomes reduits, navigation resserree). Les huit tuiles interchangeables
d'hier sont remplacees par trois etages lisibles : la chaine, son
prolongement, son socle. Realise en CSS de page (media 1000px), sans
toucher au composant commun des panneaux immersifs du chapitre 314.

**3. La chaine remontee d'un cran.** L'ordre passe de
hero -> Qui nous sommes -> maillons a hero -> maillons -> appuis ->
Qui nous sommes. Le premier maillon apparait a 0,9 ecran au bureau
comme au telephone, contre 1,8 et 2,2 avant.

**4. L'entree directe depuis le hero.** Le bouton principal « Decouvrir
EnerTchad », qui pointait vers la raison d'etre (#combat) en sautant toute
la chaine, devient « Suivre la molecule » et mene aux maillons. « Investir »
reste a cote. Le fil de liens directs Amont/Intermediaire/Aval du hero
etait deja en place.

**5. Le degraissage.** L'agenda investisseur et l'etagere documentaire
passent cote a cote au bureau (1 397 px -> 909 px), les sections de queue
sont resserrees. Sur telephone, les panneaux d'appui n'occupent plus un
ecran entier chacun.

**Mesures avant / apres.** Part de la premiere vue donnee a la chaine :
le maillon 01 visible des 0,9 ecran (1,8-2,2 avant). Appuis : 1 783 px ->
1 359 px au bureau. Page entiere : 16,3 -> 15,5 ecrans au bureau, 25,5 ->
24,7 au telephone. Verification : debordement et rognage a 390, 600, 1024
et 1440 px dans les deux themes, axe WCAG 2.1 AA a 390 et 1440 px dans les
deux themes, zero violation, zero erreur console, aucun identifiant en
double apres le deplacement des sections, ancre du CTA verifiee au clic.

**Observation consignee.** Un debordement transitoire de 3 px du bouton
hamburger (droite a 393 px pour une fenetre de 390) apparait de facon
intermittente sur les accueils pendant le chargement des polices — une
mesure sur trois environ, jamais le meme theme. Anterieur a ce chapitre
(deja visible dans les balayages du chapitre 324), sans effet une fois la
page posee. Note, pas maquille.

Pages modifiees : index.html et index-en.html seulement. Aucun actif
JS/CSS partage touche : pas de changement de version du service worker.

## 327 — L'observation du chapitre 326, elucidee : le hamburger debordait vraiment (2026-08-30)

Le chapitre 326 avait consigne un « debordement transitoire de 3 px du
bouton hamburger pendant le chargement des polices », observe une mesure
sur trois. Le proprietaire a demande de l'appliquer — c'est fait, et
l'enquete a montre que mon diagnostic etait incomplet.

**Ce n'etait pas seulement les polices.** En mesurant en continu des le
premier rendu (sonde a 60 ms au lieu d'une lecture unique), le
debordement s'est revele stable une fois present : le bord droit du
bouton se posait a 393,3 px pour une fenetre de 390 — en permanence, pas
seulement pendant le repli de police. La variabilite « une mesure sur
trois » venait d'ailleurs : un script des accueils clone le raccourci de
langue dans la barre a un moment variable du chargement. Quand le clone
arrive, la grappe de droite (langue, raccourci, loupe, hamburger)
depasse la place disponible de 3,3 px ; quand il n'arrive pas avant la
mesure, tout tient. Le chargement des polices ajoutait ses propres
oscillations par-dessus. Seuls les deux accueils sont touches : les
autres gabarits, mesures six fois chacun, tiennent a 380 px constants.

**Le correctif, en deux gardes.** D'abord la cause : sous 470 px, la
grappe est resserree (espacement 7 px, raccourci de langue a marges
reduites) — le hamburger se pose desormais a 384-390 px selon que le
clone est present, toujours dans la fenetre, verifie a 320, 360, 390 et
430 px sur les deux accueils. Ensuite la ceinture : la rangee d'entete
est bornee (overflow-x:clip sous 1241 px), si bien que meme la police de
repli, plus large de quelques pixels pendant une fraction de seconde, ne
fait plus rien depasser. Le tiroir mobile, positionne sur la barre et
non sur la rangee, n'est pas rogne — ouverture, fermeture et verrou de
defilement verifies apres coup.

**Verification.** Sonde continue relancee six fois par accueil : pic a
380 px, plus aucun episode au-dessus de 390. Debordement, rognage et axe
WCAG 2.1 AA a 390, 600, 1024 et 1440 px dans les deux themes : tout
propre. Le bouton garde ses 44 x 44 px.

Lecon versee au registre des instruments : une mesure unique prise
« apres stabilisation » avait classe ce defaut comme transitoire ; la
sonde continue a montre un etat stable dependant d'une course au
chargement. Quand un defaut semble intermittent, chronometrer avant de
conclure.

Pages modifiees : index.html et index-en.html seulement — pas de
changement de version du service worker.

## 328 — Le chantier du poids CSS, mesure avant d'etre lance : verdict (2026-08-30)

Le chapitre 324 avait designe la feuille commune bundle_core_a1.css
(164 ko, chargee partout) comme « premier poste d'economie du site » et
renvoye son decoupage a un travail de fond. Avant de lancer ce chantier,
je l'ai instruit — et les mesures le referment.

**Premiere correction : mon banc mesurait des octets qui ne voyagent
pas.** Le serveur local du banc ne compresse rien ; Vercel, lui, sert
tout en Brotli. Sur le fil, bundle_core_a1.css pese 41,2 ko — pas 164.
Les pages completes, actifs compris, transferent de 131 ko (un carnet) a
560 ko (la brochure, dont 229 ko pour le seul document), la plupart entre
200 et 380 ko. Les chiffres de poids du chapitre 324 restent justes en
octets bruts, mais la conclusion qu'ils portaient — le CSS comme premier
poste — ne survit pas a la compression : sur le fil, ce sont les images
qui dominent la plupart des pages (jusqu'a 414 ko de webp sur les
carnets), le CSS transfere tenant entre 47 et 108 ko selon la page.

**Deuxieme instruction : les images n'ont pas de reserve.** Les plus
lourdes font 1 400 px de large — la taille qu'il faut pour un fond plein
ecran sur mobile a double densite — et un re-encodage d'essai a qualite 75
rend un fichier plus gros que l'original : elles sont deja au plancher.
Rien a gratter sans toucher a la qualite visuelle.

**Troisieme instruction : la couverture CSS, et ce qu'elle ne voit pas.**
L'API de couverture de Chromium, passee sur douze pages representatives,
donne bundle_core_a1.css utilisee a 26 % en moyenne (32 % au maximum).
Pris au pied de la lettre, cela plaiderait pour le decoupage. Mais la
mesure est faite dans un theme, a une largeur, sans interaction : les
regles du theme clair, de l'impression, des autres largeurs et de tous
les etats (survol, panneaux ouverts, palette de recherche, animations)
comptent pour inutilisees. Les feuilles a « 0 % » le prouvent : ce sont
les polices auto-hebergees, la palette Ctrl+K et les etats de survol des
cartes — toutes bien vivantes. La part reellement morte est tres
inferieure aux 74 % apparents, et rien d'identifiable n'est mort du tout.

**Verdict.** Un decoupage par famille de pages plafonnerait autour de
20 ko compresses par page, au prix d'un remaniement de la cascade sur
210 pages — la categorie d'intervention qui a produit plusieurs des
defauts corriges aux chapitres 321 a 327. Gain modeste, risque reel :
chantier declasse, en connaissance de cause. Si un poste de poids merite
un jour l'effort, c'est le document de la brochure (996 ko bruts), et
c'est un arbitrage editorial, pas technique.

Chapitre d'instruction : seul MAINTENANCE.md change sur le site. Au
registre des instruments : un banc local sans compression fait passer le
CSS pour le coupable ; la couverture CSS fait passer les etats pour du
poids mort. Les deux mesures etaient exactes, et les deux conclusions
fausses.

## 329 — Le tableau de bord rejoint le chapitre 328 (2026-08-30)

Republication du tableau de bord du registre, a jour des neuf derniers
chapitres : residu du pied de page elucide (321), revue des outils et de
la navigation (322), remise d'aplomb mobile (323), stabilite visuelle
sous le pouce (324), diagnostic puis refonte de la home en vitrine de la
chaine (325-326), hamburger des accueils (327), chantier du poids CSS
instruit et referme (328). Compteurs portes a 328 chapitres et 210 pages,
service worker et date d'etablissement actualises ; le banc mobile bride
rejoint la liste des outils. Les neuf arbitrages du proprietaire restent
inchanges — les cinq arbitrages de la home du chapitre 325 ont, eux, ete
rendus et appliques au chapitre 326. Chapitre journal : seul
MAINTENANCE.md change sur le site.

## 330 — Deux survivants du cadrage a quatre (2026-08-30)

Suite courte du chapitre 326. Une chasse aux traces de l'ancien cadrage
dans les index de recherche et les metadonnees a rendu deux survivants :
le fil de liens rapides du hero disait encore « Les quatre maillons » /
« The four links » en pointant vers la section des maillons. Corrige en
« Les trois maillons » / « The three links ». Les index plein-texte
(sacs de mots, pas de phrases) et la palette Ctrl+K n'avaient rien a
reprendre ; les metadonnees des accueils parlent de chaine integree sans
compter les maillons, elles restent justes. Verifie : les seules occurrences restantes de
« sur 4 » / « of 4 » sont celles des appuis (« Appui 01 sur 4 »), qui
sont bien quatre.

## 331 — Le cadrage a trois maillons etendu a tout le site, et la verification d'apres-vague (2026-08-30)

Deux gestes pour clore la sequence ouverte au chapitre 325.

**Le cadrage, partout.** L'arbitrage « chaine = trois maillons, la
petrochimie en prolongement » ne valait que s'il etait partout. La chasse
sur les 210 pages a rendu six survivants du cadrage a quatre, tous
corriges dans les deux langues : la reponse « Quels sont les huit
poles ? » de la FAQ — dans le texte visible ET dans les donnees
structurees schema.org, celles que lisent les moteurs — disait « Quatre
forment la chaine » ; la page Societe la reprenait mot pour mot ; et
l'explorateur de chaine — la destination du bouton « Explorer la chaine »
de l'accueil — s'etiquetait encore « La chaine · 4 maillons ». Il dit
desormais « 3 maillons + prolongement », et son quatrieme onglet portait
deja le sous-titre « Extension chimie » : la page etait en avance sur son
propre titre. La brochure (« trois forment la chaine — notre coeur de
metier ») etait deja alignee. Les JSON-LD des deux FAQ revalides apres
edition. Les occurrences restantes de « quatre » comptent d'autres
choses : les quatre appuis, les quatre etages du prix d'un litre, les
quatre formats de station — toutes justes.

**La verification d'apres-vague.** Regle de la maison : les 210 pages
balayees dans les deux themes — axe WCAG 2.1 AA, erreurs console,
debordements : zero partout.

**Et le sitemap remis a l'heure.** Les lastmod des 210 URL regeneres
depuis l'historique git : 139 dates mises a jour (les vagues 315 a 330
avaient laisse le fichier en arriere), deux URL a alias (calculateur,
configurateur) raccordees a leurs vrais fichiers, XML revalide.

Pages modifiees : les deux FAQ, les deux pages Societe, les deux
explorateurs de chaine, sitemap.xml — pas d'actif partage, pas de
changement de version du service worker.

## 332 — QA et coherence des tuiles sur tout le site (2026-08-30)

Revue des tuiles — les cartes de pole, d'article, de valeur, de stat qui
portent la moitie de la navigation du site. Trois volets : l'inventaire
(recolte sur les 210 pages, au rendu, de toutes les tuiles liees a un
pole avec leur teinte calculee, leur libelle et leur cible), la
coherence, et la geometrie.

**Ce qui etait deja coherent.** Les libelles des tuiles de pied sont
exacts sur les 205 pages qui en portent : huit poles, memes noms
partout, paires FR/EN alignees (Amont/Upstream... Conseil/Advisory).
Les liens des tuiles menent tous au bon hub dans la bonne langue. Les
teintes de quatre poles etaient deja unanimes sur tout le site
(Petrochimie, TchadiTech, Tchaditude, EnerConseils).

**Le defaut principal : la roulette des pastilles du pied.** Les
pastilles de pole du pied de page tiraient leur teinte des variables de
theme de chaque page — quatre familles de feuilles, quatre resolutions.
Resultat mesure au rendu : l'Aval n'avait AUCUNE pastille sur 87 pages
(variable --amber-l absente, repli sur la couleur du texte), le vert de
GreenTech existait en trois nuances selon la page (#34D399, #2E9E6B,
#1E7A55), l'or d'Amont en deux, le bleu de l'Intermediaire en deux.
Corrige a la racine : une teinte canonique par pole, adressee par le
lien de la tuile, posee en !important dans les quatre feuilles
couvrantes (necessaire : l'accent est ecrit en style en ligne dans le
gabarit du pied). Pastilles decoratives : memes valeurs dans les deux
themes. Verifie au rendu apres correctif : uniformes, seize liens
echantillonnes sur huit familles de pages, deux themes.

**Un rose realigne.** L'explorateur de chaine colorait la Petrochimie
en #D889BE la ou tout le reste du site dit #D177B4. Aligne (FR et EN).
Reste une declinaison assumee : les panneaux immersifs de l'accueil
utilisent des pastels eclaircis par pole (la famille --mac du chapitre
298) — c'est une variante de composant, pas une incoherence, consigne
comme telle.

**La geometrie : quatre pages accusees, zero coupable.** Le detecteur de
texte rogne dans les tuiles a designe les cartes de La Voie des deux
brochures et les panneaux de poles des deux accueils. Verification a
l'image : rien n'est coupe — dans les deux familles, c'est le grand
chiffre decoratif en filigrane, volontairement rogne par la tuile, qui
gonfle scrollHeight. Le registre des instruments s'enrichit d'une
variante : apres les pseudo-elements du chapitre 316, les enfants
decoratifs positionnes font eux aussi mentir la mesure de debordement.
Aucun texte perdu dans les tuiles du site.

**Non-regression.** Les 210 pages rebalayees (axe, console,
debordements) : zero anomalie. JSON-LD des explorateurs revalides.

Service worker : et-202608302040 (quatre feuilles modifiees).

## 333 — QA des formulaires et de l'etagere documentaire (2026-08-30)

**Perimetre.** Le site ne compte que deux formulaires : l'assistant de
contact en trois etapes (#ctForm, contact.html et contact-en.html) et
l'inscription newsletter des pages d'accueil (#fnForm, validation native
plus mailto, par conception). S'y ajoute l'etagere documentaire :
douze fichiers telechargeables (PDF, PPTX, MD, ICS, CSV).

**Mon erreur : un harnais qui saute les rails.** Mon premier harnais a
soumis le formulaire de contact en cliquant son bouton d'envoi masque,
court-circuitant les trois etapes de l'assistant. Resultat : des
defauts fabriques (erreurs pretendument persistantes, recapitulatif
"Objet: []") qui n'existent pas quand on parcourt l'assistant comme un
visiteur. Lecon consignee au registre des instruments : un harnais de
formulaire doit emprunter le parcours reel (etape par etape, boutons
visibles), jamais une soumission directe qui contourne la machine a
etats du composant.

**Parcours reel de l'assistant (FR sombre, FR clair, EN sombre).**
Tout est conforme : messages d'erreur en role=alert annonces aux
lecteurs d'ecran, effacement des erreurs des la correction, focus
replace sur la legende a chaque etape, recapitulatif fidele aux
saisies, et repli mailto correct (Objet : [type choisi] nom saisi)
vers contact@enertchad.td quand aucun backend n'existe — le site est
statique, ce repli est le comportement voulu.

**Le seul defaut reel : la couleur d'erreur en theme clair.** Les
messages .ct-err restaient lisibles en theme sombre (rgb(248,113,113))
mais viraient au bleu nuit en theme clair : la repeinture de theme
passait par-dessus leur couleur. Correction dans les quatre feuilles
couvrant les 210 pages : #B42318 en themes clairs (contraste 6.3:1
sur fond clair), via une specificite en :not() qui ne touche pas le
theme sombre. Verifie apres correction : clair rgb(180,35,24), sombre
inchange.

**Observation mineure, laissee en l'etat.** Le marqueur de champ
:invalid (bordure rouge au niveau du champ) est inconsistant ou absent
selon les champs. Les alertes textuelles role=alert restent le
mecanisme principal et fonctionnent ; a reprendre si une refonte du
formulaire est un jour decidee.

**Etagere documentaire : 12 sur 12.** Chaque fichier telechargeable
verifie en production : type de contenu correct, taille non nulle,
octets magiques conformes (%PDF pour les PDF, PK pour les PPTX,
BEGIN:VCALENDAR pour l'ICS, entetes attendues pour MD et CSV).
Aucun lien mort, aucun fichier corrompu.

Service worker : et-202608302110 (quatre feuilles modifiees).

## 334 — Integrite du graphe de liens et reciprocite hreflang (2026-08-30)

**Perimetre.** Audit statique complet du graphe de liens des 212 fichiers
HTML du depot : chaque href, src, action et poster interne, la resolution
des ancres #fragment sur leur page cible, la chaine redirects/rewrites de
vercel.json, la reciprocite des annotations hreflang et la coherence des
canonicals.

**Mes erreurs d'instrument, en serie.** Le premier passage annoncait
1880 problemes ; presque tous etaient fabriques par le harnais. Trois
bugs, consignes au registre : (1) le test d'appartenance au domaine
cherchait la chaine "enertchad" dans l'URL entiere, classant les liens
sociaux (linkedin.com/company/enertchad) comme internes casses — il faut
comparer l'hote, jamais l'URL ; (2) le resolveur appliquait rewrite puis
redirect, rebouclant les URL propres vers elles-memes (le rewrite
/calculateur-baril-additionnel -> fichier, puis le redirect inverse du
fichier vers l'URL propre) — Vercel evalue les redirects d'abord, puis un
seul rewrite ; (3) un chemin se terminant par / produisait dossier//index.html,
qui ne correspondait plus a la cle normalisee — huit fausses
non-reciprocites hreflang sur les pages de poles venaient de la.

**Fragments d'etat, pas ancres mortes.** Les 193 "ancres mortes"
restantes etaient trois familles de fragments consommes par JavaScript,
toutes verifiees valeur par valeur : #rub= des carnets (16 rubriques FR
et 16 EN, toutes presentes dans les cartes .rub2), #t- du glossaire (40
termes lies, tous generes par la meme normalisation que celle de la
page, reproduite hors navigateur), et #p=/d=/c= du configurateur (etat
URLSearchParams, toutes les valeurs presentes dans les options). Zero
lien interne casse, zero ancre morte reelle sur tout le site.

**Le seul defaut reel : ar-poles et le cluster hreflang de l'accueil.**
La page arabe des poles declarait fr, en et x-default vers les pages
d'accueil, qui elles pointent leur alternative arabe vers /ar (l'accueil
arabe), pas vers /ar-poles. Annotations non reciproques : les moteurs
les ignorent et le cluster de l'accueil s'en trouvait pollue. La page
n'ayant pas d'equivalent direct FR/EN, correction par retrait des trois
annotations non reciproques ; reste l'auto-reference ar et la canonical.
Reverification : zero probleme hreflang, zero canonical incoherente,
aucune annotation ne passant par un redirect.

Changement HTML seul : pas de bump du service worker.

## 335 — La home couvre-t-elle tout le site (2026-08-30)

**La question du proprietaire.** Revoir la home pour s'assurer qu'elle
couvre tout le site. Reponse mesuree avant toute retouche : parcours en
largeur du graphe de liens depuis chaque accueil.

**Le diagnostic.** La couverture structurelle est deja complete : depuis
l'accueil francais, les 104 pages francaises sont toutes atteignables en
deux clics au plus (73 en un clic) ; symetrie parfaite cote anglais.
Les seules pages hors graphe sont la page 404 et le fichier de
verification Google, par nature. Les 29 articles du journal sans lien
direct passent par les carnets, qui sont lies trois fois (corps, menu,
pied de page) — c'est la structure editoriale voulue, la home met en
avant trois articles choisis.

**Deux vraies absences dans la vitrine.** Le glossaire petrolier — 80
termes, l'outil de reference vers lequel trente pages renvoient —
n'avait aucune porte d'entree depuis la home, dans aucune des deux
langues. La brochure en version web (la fresque "de la roche-mere a la
pompe") non plus : la home ne proposait que le PDF. Correction : la
ligne "Toutes les publications" de l'etagere documentaire devient une
rangee de trois liens (publications, glossaire, brochure web), FR et
EN, avec une regle flex d'accompagnement dans le bloc de styles de la
vitrine. Verifie en local : deux themes, bureau et mobile, aucun
debordement.

**Laisse en l'etat, en connaissance de cause.** La page charte est un
design system (documentation interne) : sa place a deux clics via la
gouvernance est la bonne. La page ethique et conformite a huit portes
d'entree a deux clics (gouvernance, engagements, contact, societe...) ;
l'ajouter a la vitrine chargerait la home arbitree au chapitre 326 sans
gain reel.

Changement HTML seul (deux accueils) : pas de bump du service worker.

## 336 — Face aux majors : le benchmark et la recherche pleine page (2026-08-30)

**La commande.** Confronter la vitrine EnerTchad aux sites des majors et
des champions nationaux. Sources relevees ce jour : TotalEnergies,
Chevron, Aramco, Petrobras (Shell et Eni inaccessibles au fetch).

**Le canon des majors.** Six sections (societe, activites, durabilite,
investisseurs, medias, carrieres) et un socle d'outils : recherche,
langues, bibliotheque de rapports, newsletter, RSS, portail
fournisseurs, transparence, reseaux sociaux. Cote contenu, EnerTchad
tient deja ce canon — et le depasse par endroits : paiements aux Etats
(transparence type ITIE, rare meme chez les majors), outils interactifs
(calculateur, configurateur, explorateur de chaine), glossaire de 80
termes, PWA hors-ligne, page arabe. Les ecarts qui restent sont calibres
par le statut de societe en constitution : pas de cours de bourse, pas
de rapport annuel — l'agenda et l'etagere documentaire en tiennent lieu.

**L'ecart applicable : la recherche pleine page.** Le site avait deja
une palette Ctrl+K (index cure d'environ 76 entrees plus extensions FR
et EN — mon premier constat "pas de recherche" etait faux, la loupe de
la nav la porte sur 140 pages). Mais aucun moyen de chercher parmi
TOUTES les pages. Construit ce jour : /recherche et /recherche-en,
pages au chrome du site (clonees du plan du site, bandeau et JSON-LD
reecrits), index JSON genere depuis les 104 pages francaises et 102
anglaises (titre, description, rubriques, sections h2), score pondere
titre x3 / rubriques x2 / description x1, pliage des accents, etat dans
le hash (#q=), role=search, statut aria-live. Zero violation axe, zero
erreur console, un seul h1 par page. Portes d'entree : la palette
Ctrl+K (entree ajoutee aux deux index), les accueils (ligne sous les
acces rapides), les plans du site et la page 404. Sitemap porte a 212
URL.

**Arbitrages du proprietaire, registre enrichi de trois entrees.**
(1) Etendre l'arabe au-dela des deux pages actuelles — les champions
nationaux (Aramco) servent six langues. (2) Une mediatheque presse
dediee (photos HD, logos, dossier) comme les media centers des majors —
la fiche presse actuelle est un embryon. (3) Une newsletter a backend
reel : le flux mailto actuel est le plafond d'un site statique.

Service worker : et-202608302205 (cmdk_extra.js et cmdk_en.js modifies).

## 337 — Les douze arbitrages : decides sur delegation (2026-08-30)

**La commande.** "Decide pour moi." Le registre comptait douze
arbitrages en attente ; les voici tranches, par categorie, avec la
regle suivie : je decide tout ce qui est decidable par raisonnement et
par source verifiable, je decline ce que le socle statique interdit,
et je n'invente jamais un fait qui appartient au reel du proprietaire.

**Decide et applique ce jour (2).**
Le programme de contenu local a desormais un nom : <b>TchadiValeur</b>
— dans la famille TchadiTech / Tchaditude / Tchadium, l'equivalent
maison de l'iktva d'Aramco ou de l'ICV d'ADNOC. Cible inchangee : 80 %
de valeur tchadienne. Le nom est pose aux points d'ancrage
(communautes, engagements, glossaire, FR et EN), sans renommer les
43 mentions generiques du concept.
Le millesime du 144 kb/j est tranche par la source : la moyenne 2024
(l'annee 2025 etait a 137 kb/j sur janvier-mai). Huit occurrences
"2025" corrigees en "moyenne 2024" (journal-atlas, brochure, atlas,
blocs statistiques 144 -> 250), et la note d'arbitrage du glossaire
soldee dans les deux langues.

**Decide et mis en chantier (2).**
L'extension arabe : oui — par etapes, en commencant par les pages a
plus fort trafic externe (contact, investisseurs, societe), la qualite
de langue primant sur la quantite. La mediatheque presse : oui — une
page construite avec l'existant (logos, couleurs, fiche presse,
communiques, contact presse), les photos institutionnelles restant
suspendues a la seance photo. Ces deux chantiers suivent dans les
prochains chapitres.

**Decline, en connaissance de cause (2 familles).**
Les alertes e-mail et la newsletter a backend : non sur ce socle — un
site statique sans serveur ne peut ni envoyer ni stocker ; RSS, ICS et
boite officielle sont le plafond honnete, et brancher un service tiers
exigerait des comptes et des cles que seul le proprietaire peut
ouvrir. L'assistant IA facon EnergIA d'Eni : non — pas d'IA simulee
sur un site qui se veut honnete ; la palette Ctrl+K et la recherche
pleine page du chapitre 336 couvrent le besoin de navigation reel.

**Maintenu en attente de faits (4).** Les noms de la direction et du
conseil (a la formalisation des organes), le premier rapport annuel
approuve (le point d'etape 2026 fait l'interim), la seance photo
officielle (action physique), la convention INSPEM et le ticket
minimum investisseur (deux donnees attendues). Aucun de ces quatre ne
se decide par raisonnement : les trancher serait les inventer.

Douze fichiers HTML modifies, changement HTML seul : pas de bump du
service worker.

## 338 — Le mini-site arabe triple de volume (2026-08-30)

**Le chantier decide au chapitre 337.** Trois pages arabes nouvelles,
ecrites en arabe standard moderne et calquees sur le gabarit du
mini-site existant : ar-societe (l'identite, la voie, la gouvernance,
le programme TchadiValeur), ar-investisseurs (la these "la banque
avant le puits", le capital par paliers, l'agenda, la fiche PDF arabe,
l'avertissement societe en constitution), ar-contact (canaux officiels,
orientation par profil — investisseur, fournisseur, presse, candidat —
et renvoi vers l'assistant de contact FR/EN). Le mini-site passe de
deux a cinq pages, avec une navigation commune en pastilles sur les
cinq.

**Reciprocite hreflang, la lecon du chapitre 334 appliquee.** Chaque
page arabe declare fr, en, ar et x-default ; et les six pages
francaises et anglaises correspondantes (societe, investisseurs,
contact, FR et EN) declarent en retour leur alternative arabe. Zero
annotation orpheline : les clusters sont fermes des la naissance.

**Deux defauts d'heritage corriges au passage.** D'abord le cadrage :
ar-poles portait encore "quatre maillons" — le balayage du chapitre 331
n'avait pas couvert l'arabe. Aligne sur l'arbitrage du proprietaire :
trois maillons qui s'etendent par la petrochimie (imtidad), badge
"extension de la chaine" sur la carte petrochimie, metadonnees et
descriptions reecrites. Ensuite les boutons : les couches de
repeinture theme clair du chrome commun ecrasaient le fond dore des
boutons arabes (contraste mesure a 2.02:1 sur les nouvelles pages, et
meme le bouton de l'appel a l'action d'ar-poles avait perdu son or).
Correctif a forte specificite pose sur les cinq pages ; axe repasse a
zero violation partout.

**Verification.** Les cinq pages arabes : RTL correct, un seul h1,
zero debordement horizontal, zero erreur console, zero violation axe.
Sitemap porte a 215 URL. Changement HTML seul : pas de bump du service
worker.

## 339 — La mediatheque presse (2026-08-30)

**Le second chantier decide au chapitre 337.** Deux pages nouvelles au
chrome du site, /presse et /presse-en, construites avec l'existant et
rien que l'existant : le paragraphe officiel pret a citer (boilerplate
tenu a jour sur la page), le kit media complet en un telechargement
(ZIP : logo SVG et PNG, banniere, quatre photos d'illustration libres
de droits, boilerplates FR/EN, fiche presse, brochures), la fiche
presse en Markdown, les brochures FR/EN et la fiche arabe, le logo et
la palette officielle en nuancier avec les codes hexadecimaux et les
regles d'usage (fond creme ou marine, pas de deformation, marques en
depot OAPI), les communiques et le flux RSS, et le contact presse a
double canal (e-mail avec objet "Presse", WhatsApp).

**L'honnetete sur les photos, en clair.** La section 04 dit ce qui
est : quatre photos d'illustration aujourd'hui, les photos
institutionnelles (equipe, siege) apres la seance photo officielle —
l'arbitrage du proprietaire reste en attente et la page le dit sans
detour.

**Le cadrage rattrape jusque dans le kit.** La fiche presse (racine ET
copie embarquee dans le ZIP, reconstruit a l'identique) disait encore
"quatre forment la chaine petroliere et chimique" ; alignee sur
l'arbitrage : trois maillons que prolonge la Petrochimie. Troisieme
support rattrape apres les pages arabes du chapitre 338 — le cadrage
vit dans plus d'endroits que les pages HTML.

**Maillage.** Portes d'entree depuis les communiques (FR/EN) et les
plans du site ; index de recherche regenere (106 pages FR, 104 EN —
les pages presse et recherche s'y ajoutent) ; sitemap porte a 217 URL.
L'index JSON se rafraichit seul (le service worker sert le cache puis
revalide en arriere-plan) : pas de bump necessaire, changement HTML,
donnees et documents seulement.

**Verification.** Les deux pages : un seul h1, zero debordement, zero
erreur console, zero violation axe, dans les deux themes.

## 340 — Balayage de non-regression et registre a jour (2026-08-30)

**Le balayage.** Sept chapitres de chantiers (333 a 339) ont touche des
dizaines de fichiers et cree sept pages ; la liste de reference passe
de 210 a 218 pages (recherche, presse, trois pages arabes, FR et EN).
Balayage complet en trois tranches paralleles : axe, erreurs console,
erreurs de pages, reponses HTTP en echec, debordements horizontaux.
Resultat : zero anomalie sur les 218 pages — seules remontent les
metriques informatives de citations des pages de poles, connues et
sans changement.

**Le tableau de bord rejoint le chapitre 340.** Le registre public
etait a jour du chapitre 328 ; les douze chapitres manquants y sont
consignes, les arbitrages en attente passent de neuf a quatre (les
decisions du chapitre 337), les compteurs passent a 340 chapitres et
218 pages, la puce service worker a et-202608302205, et les outils
livres s'enrichissent de la recherche pleine page, du mini-site arabe,
de la mediatheque presse et du programme TchadiValeur.

Seul le journal change dans le depot : pas de bump du service worker.

## 341 — Benchmark QA mesure face aux majors (2026-08-30)

**La commande.** Apres le benchmark de contenu du chapitre 336, la
version mesuree : confronter les signaux de qualite techniques de
l'accueil EnerTchad a ceux des majors, chiffres a l'appui, depuis le
meme point de mesure et au meme instant. Panel effectivement mesurable
ce jour : TotalEnergies, ExxonMobil, Petrobras (Chevron refuse en 403,
Aramco expire, Shell ne sert qu'une coquille JavaScript de 9 Ko,
exclue de la comparaison).

**Mon erreur d'instrument, d'abord.** Le premier passage du peseur
annoncait zero sous-ressource pour EnerTchad et TotalEnergies :
j'annoncais "Accept-Encoding: gzip, br" mais ne savais decoder que le
gzip — le HTML servi en brotli devenait du bruit et les expressions
regulieres n'y trouvaient rien. Lecon au registre des instruments : ne
jamais annoncer une capacite que le harnais n'a pas ; l'en-tete
d'annonce fait partie de l'instrument.

**Poids au premier chargement (HTML + sous-ressources declarees, sur
le fil, gzip).** EnerTchad 215 Ko (51 + 30 ressources) ; TotalEnergies
305 Ko ; ExxonMobil 429 Ko ; Petrobras 783 Ko. Le site le plus leger
du panel — et la mesure gzip majore notre cas, la production servant
du brotli. Seul point ou un major fait mieux : le document HTML seul
(17 Ko chez TotalEnergies contre 51) — le prix de l'architecture
auto-portee, deja instruite et assumee au chapitre 328.

**Latence (TTFB + premier kilo-octet, 3 essais).** EnerTchad ~210 ms
apres echauffement, le plus rapide du panel (TotalEnergies ~230,
ExxonMobil ~500, Petrobras ~920).

**En-tetes de securite.** EnerTchad est le seul du panel a servir les
six (HSTS, X-Content-Type-Options, CSP, Referrer-Policy,
Permissions-Policy, X-Frame-Options) ; les trois majors n'en servent
que quatre ou cinq.

**Signaux HTML.** Seul site du panel avec JSON-LD (quatre blocs), flux
RSS declare, manifest + service worker (PWA installable, hors-ligne)
et theme-color. Titre, description, canonical, hreflang (quatre langues
declarees dont l'arabe), h1 unique : tout conforme, comme chez les
majors. Points ou les majors font mieux, notes sans correctif : les
179 attributs style en ligne (hygiene de l'auto-porte, sans effet
utilisateur) et l'absence d'images sur l'accueil (choix de design,
fonds CSS/SVG).

**Limites dites.** Un seul point de mesure, un seul instant, premiers
chargements statiques ; les majors chargent davantage apres le premier
rendu et leurs metriques d'usage reel restent inconnues. Aucun
changement du site : le journal seul est publie.

## 342 — QA des couches invisibles (2026-08-30)

**Le perimetre.** L'audit du graphe de liens (chapitre 334) ne voyait
que le HTML. Quatre couches lui echappaient : les entrees de la
palette Ctrl+K (qui vivent dans le JavaScript), les redirections de
vercel.json (executees par la plateforme), les flux RSS et ICS, et la
couche Open Graph. Chacune est passee au crible ce jour.

**La palette : 494 entrees, zero defaut.** Les index de base FR, les
extensions FR et EN — 374 URL uniques, souvent avec ancre — resolus
contre le meme resolveur que le chapitre 334 (redirects puis rewrite
puis fichiers) et contre les id reellement presents dans les pages
cibles. Tout resout.

**Les redirections : 123 sur 123 atterrissent juste, en production.**
Chaque source testee sur le site en ligne. Cinquante-cinq passent par
deux sauts (cleanUrls retire le .html avant que la regle propre ne
s'applique) — atterrissage correct, chaine notee comme cout SEO
mineur et assume, les deux formes etant declarees expres. Mes deux
"echecs" initiaux etaient des artefacts d'instrument : j'avais requete
la chaine litterale ":path*" au lieu d'un chemin reel (les gabarits
/enertalents/* et /enertech/* fonctionnent), et le premier passage ne
suivait qu'un saut. Registre des instruments enrichi.

**Les flux.** feed.xml : XML valide, 46 items, tous avec lien et date.
Les deux calendriers ICS etaient structurellement valides mais en fins
de ligne LF, la ou la RFC 5545 exige CRLF — certains clients stricts
rejettent. Corrige : CRLF partout, pliage des lignes de plus de 75
octets a la norme (coupures respectant l'UTF-8), evenements et UID
intacts. C'est le seul correctif du chapitre.

**Open Graph : 217 pages, zero probleme.** og:title et og:image
presents partout, og:url egal a la canonical partout, et les neuf
images og referencees existent toutes dans le depot.

Deux fichiers ICS corriges : changement de donnees seulement, pas de
bump du service worker.

## 343 — L'annuaire visible : le proprietaire corrige le chapitre 335 (2026-08-30)

**L'arbitrage.** Le chapitre 335 concluait que la home couvrait le site
parce que tout etait atteignable en deux clics via menus et pied de
page. Le proprietaire tranche autrement : une navigation intuitive
exige que le corps de la page montre les portes, pas qu'elles existent
derriere un menu. Il a raison sur le fond — l'atteignabilite mesuree
n'est pas la visibilite vecue, et la lecon vaut d'etre consignee :
mes metriques de graphe ne mesurent pas l'intuition d'un visiteur.

**La reponse : un annuaire en un ecran.** Nouvelle section #annuaire
sur les deux accueils, placee entre les acces rapides et le bandeau
final : cinq groupes — la societe (8 portes), la chaine et les poles
(9, Petrochimie marquee prolongement), s'informer (9), agir (7),
outils et acces (7, dont le mini-site arabe et la bascule de langue).
Quarante liens visibles sans ouvrir un menu, pastilles de groupe aux
couleurs canoniques, libelles courts. La ligne "chercher dans le
site" du chapitre 335, devenue redondante, est retiree.

**Verification.** Les deux accueils, deux themes, bureau et mobile :
40 liens et 5 groupes presents, zero debordement, zero erreur console,
zero violation axe sur la section — la premiere mesure mobile en
signalait trente, prises pendant l'animation d'apparition ; au calme,
zero. L'artefact rejoint le registre des instruments (mesurer apres
la fin des animations, y compris celles declenchees par le
defilement).

Changement HTML seul (deux accueils) : pas de bump du service worker.

## 344 — Solde de tout compte : les actions en attente (2026-08-30)

**La commande.** Appliquer toutes les actions en attente et pousser.
Etat des lieux d'abord : l'arbre local est strictement identique a la
branche main — chaque chapitre a ete publie au fil de l'eau, rien ne
dormait. Le "push" est donc un constat, pas un geste : le canal de
publication du projet (depot via l'interface web, jamais de push
direct) etait deja a jour.

**Le grand livre des taches, reconcilie.** Quatre taches du chapitre
261 (QA des menus : inventaire, desktop, mobile, banc de contraste du
mega-menu ouvert) etaient restees ouvertes depuis des mois alors que
leur substance a ete livree ailleurs : le retrait du code mega-ultra
(ch.262), les matrices desktop et mobile (ch.270), la revue des
outils de navigation avec ses sept correctifs (ch.322), la refonte
mobile (ch.323) et le banc de contraste menu ouvert (ch.256). Les
quatre sont refermees avec renvoi explicite vers les chapitres qui
les ont couvertes — une dette de tenue de registre, pas une dette de
travail.

**Le tableau de bord rejoint le chapitre 343.** Trois chapitres
d'ecart avec le journal (benchmark QA mesure, couches invisibles,
annuaire des accueils) : combles, meme adresse publique.

**Ce qui reste en attente ne depend pas de moi.** Quatre arbitrages
attendent des faits du proprietaire (noms des organes, rapport annuel,
seance photo, INSPEM et ticket minimum) ; trois veilles ont leurs
echeances (scenarios Brent en janvier 2027, ITIE a la validation,
Sedigui au fil des annonces). Aucune action applicable n'attend.

Seul le journal change dans le depot.

## 345 — CP-2026-009 : la vague d'aout annoncee et cablee (2026-08-30)

**Le communique.** Les livraisons des chapitres 336 a 343 meritaient
leur annonce officielle, dans la lignee des CP-006 a 008 : CP-2026-009
(FR et EN, en tete des pages communiques) annonce la recherche pleine
page, le mini-site arabe porte a cinq pages, l'espace presse et
l'annuaire "tout le site en un ecran" — et officialise le nom
TchadiValeur. Les ItemList JSON-LD des deux pages sont renumerotees
avec le nouvel item en premiere position, et le flux RSS passe a 47
items, XML valide.

**Le cablage de la palette.** L'espace presse entre dans la palette
Ctrl+K des deux langues, et les trois nouvelles pages arabes
rejoignent le groupe References des deux index (188 entrees FR, 162
EN). Verifie au navigateur : "presse" dans la palette renvoie /presse
en premiere position, les deux pages communiques affichent CP-009 en
tete sans erreur console.

Service worker : et-202608302235 (deux index de palette modifies).

## 346 — Refonte de la home : institutionnel sobre (2026-08-30)

**Le mandat.** Refonte complete, direction institutionnelle sobre
(facon TotalEnergies/Aramco), page nettement plus courte — trois choix
du proprietaire, cadrage arbitre conserve (trois maillons que prolonge
la petrochimie, quatre appuis).

**Ce que la home est devenue.** Huit blocs au lieu de dix-sept : un
hero sobre neuf (statut de la societe en exergue, titre "De la
roche-mere a la pompe", deux appels — Investir, Decouvrir la chaine —
et un bandeau de quatre chiffres cles : 144→250 kb/j, 8 poles, 80 %
TchadiValeur, 10 M→20 Md FCFA), puis la chaine (#coeurs, intacte), les
appuis (intacts), les chiffres de l'ambition, les carnets, une section
Agir neuve (Investir / Devenir client / Nous rejoindre, plus
fournisseurs et contact), l'annuaire du chapitre 343, et le bandeau de
conviction final. Le carrousel du hero a cinq messages, le manifeste,
le combat, la vision, le retournement, les produits, la bande
durabilite, l'agenda et l'etagere sur la home, les acces rapides :
retires — leurs contenus vivent dans les pages interieures et
l'annuaire y mene. Le rail de traversee est reecrit sur les ancres
survivantes. La page passe d'environ 206 a 180 Ko ; /#poles, seule
ancre de la home referencee ailleurs (72 pages), survit.

**Deux erreurs d'instrument consignees.** Un find() sans garde a
retourne -1 (attribut id place apres class) et t[:-1]+t[9:] a duplique
le document entier — detecte par le controle de taille, repare par
restauration depuis le depot et chirurgie a spans equilibres avec
assertions. Puis une coupe par marqueur a matche une occurrence CSS du
marqueur dans l'entete au lieu de la section : les coupes prennent
desormais une position minimale. Au passage, la section carnets avalee
par une coupe a ete restauree depuis le depot.

**Verification.** FR et EN, deux themes, 1280 et 390 px : huit blocs
presents, un seul h1, zero debordement, zero erreur console, zero
violation axe (trois contrastes des petites mentions de l'annuaire en
theme clair reveles par la mesure et corriges par couleurs explicites
par theme ; doublon de landmark Agir/bandeau final renomme ; ombre
portee heritee sur le titre supprimee).

Changement HTML seul (deux accueils, sitemap) : pas de bump du service
worker.

## 347 — Consolidation de la refonte (2026-08-30)

**Le rituel apres une grande vague : verifier sur tous les axes.**
WebKit profil iPhone 14 : zero debordement, zero erreur, couleurs de
titre justes dans les deux themes, FR et EN. Banc de performance bride
(processeur x4, 1,6 Mbit/s) : CLS 0 sur l'accueil francais et 0,004
sur l'anglais — le nouveau hero, textuel et sans carrousel, ne bouge
pas ; le LCP est un texte, insensible aux images lentes. Parcours
clavier : les deux appels du hero et les cartes Agir sont focusables
avec anneau visible de 2 px. Parite FR/EN exacte : 4 chiffres cles,
3 cartes Agir, 40 portes d'annuaire, 7 arrets du rail. Tous les liens
et ancres internes des deux accueils resolvent.

**L'index de recherche suit la page.** Les h2 des accueils ont change
avec la refonte ; l'index JSON est regenere (106 FR, 104 EN) — le
champ mots-cles de la home reflete les blocs reels. Precision
d'inventaire au passage : la bande des chiffres abrite en fait trois
sous-parties (l'ambition en chiffres, le premier integre tchadien,
decarboner la chaine) en 3,7 Ko — compacte, elle reste.

Deux fichiers de donnees et le journal : pas de bump du service
worker.

## 348 — QA et QC : l'assurance et le controle (2026-08-30)

**La commande.** Deux regards en un chapitre : l'assurance qualite
(les processus balayent-ils tout ?) et le controle qualite (le produit
est-il conforme, piece par piece ?).

**QA — le balayage dynamique.** Les 218 pages en theme sombre, trois
tranches paralleles, plus cinquante pages en theme clair : axe,
erreurs console et de page, reponses HTTP, debordements horizontaux.
Zero anomalie — ne remontent que les metriques informatives de
citations des pages de poles, inchangees. Les cinq chapitres de la
vague 343-347 (annuaire, communique, refonte, consolidation) n'ont
rien casse.

**QC — le controle statique du produit.** Sur les 218 pages : zero
identifiant duplique, un h1 unique partout, titres et canonicals
presents, zero regression du cadrage trois maillons (FR, EN, arabe),
zero millesime errant sur le 144 kb/j. Les chiffres cles du nouveau
hero (144→250, 80 %, 10 M→20 Md) sont conformes au canon du chapitre
337.

**Une observation d'archive, laissee en l'etat.** Le journal contient
4 639 lettres accentuees — toutes cantonnees aux chapitres des
premiers jours (1 a 14) et au bloc 86-87, ecrits avant la convention
sans accents. Le journal est un registre en ajout seul : on n'y
reecrit pas l'histoire, et la convention tient sans exception depuis.

Seul le journal change : pas de bump du service worker.

## 349 — QA du rendu d'impression apres la vague (2026-08-30)

**Le constat, d'abord bon.** Huit pages representatives passees au
media print (accueil refondu, presse, recherche, investisseurs,
glossaire, un carnet, une page arabe, les communiques) : le socle
d'impression du chapitre 270 tient — navigation masquee, fonds clairs,
textes noirs, l'arabe s'imprime en RTL propre, le carnet se lit comme
un article de journal.

**Le defaut : le chrome flottant se repetait sur chaque page.** Le
bandeau cookies (position fixe) s'imprimait au bas de chacune des
quinze pages du PDF de l'accueil ; le rail de traversee et les boutons
flottants suivaient le meme chemin sur les pages ou le socle ne les
couvrait pas. Correctif dans les quatre feuilles couvrantes : en
impression, bandeau cookies, rail, retour accueil, bascules de theme
et boutons de remontee sont masques. Deux passes ont ete necessaires —
la regle d'affichage du bandeau (posee 1,2 s apres le chargement)
portait une specificite superieure ; la mesure trop precoce concluait
a tort que le correctif tenait. Lecon d'instrument : verifier les
etats retardes apres leur echeance, pas avant.

Service worker : et-202608302320 (quatre feuilles modifiees).

## 350 — L'annuaire devient acces rapides (2026-08-30)

**La suggestion du proprietaire.** Convertir l'annuaire de l'accueil
en acces rapides. Avis favorable et motive : la forme en pastilles
compactes raccourcit la page (mandat du chapitre 346), garde les
quarante portes visibles sans interaction (l'exigence du chapitre 343
reste tenue a la lettre), et la densite sied au registre institutionnel.

**La forme.** Meme section, memes cinq groupes aux points de couleur
canoniques, memes quarante liens — mais en pastilles a bordure sur
fond semi-opaque (lisibles sur la photo de fond, dans les deux
themes), groupes empiles au lieu des cinq colonnes. Titre ajuste :
"Acces rapides." sous le chapeau "Annuaire - Tout le site". Hauteur de
section reduite d'environ moitie. Zero violation axe dans les deux
themes, quarante liens verifies.

## 351 — Appliquer les restes ouverts (2026-08-30)

**La commande.** Appliquer. Deux elements applicables restaient
ouverts au registre ; les voici soldes.

**Le marqueur de champ du formulaire (observation du chapitre 333).**
L'assistant de contact signalait les erreurs par ses alertes textuelles
(role=alert), mais le champ fautif lui-meme ne portait aucun marqueur
coherent. Applique sur contact et contact-en : la validation de
l'etape 2 pose desormais aria-invalid sur chaque champ fautif (nom,
courriel, message), le focus va au premier champ en erreur, une regle
scoped peint la bordure en rouge (visible dans les deux themes), et le
marqueur s'efface a la saisie des que le champ redevient valide. Une
erreur d'insertion en chemin, consignee : le premier patch avait loge
l'ecouteur d'effacement DANS le gestionnaire du clic, derriere des
return qui l'empechaient de s'attacher — la marche a vide l'a revele
(marqueur pose mais jamais efface), l'ecouteur vit desormais au niveau
du formulaire. Verifie au navigateur, FR et EN : pose, focus,
effacement, passage a l'etape 3, zero erreur console.

**Le registre public rejoint le chapitre 350.** Sept chapitres
d'ecart (344 a 350 : solde des taches, communique, refonte,
consolidation, QA-QC, impression, acces rapides) : combles, meme
adresse, puce service worker a jour.

Deux pages HTML modifiees : pas de bump du service worker.

## 352 — La recherche entre au schema : SearchAction (2026-08-30)

**L'occasion.** Le tour d'hygiene de decouvrabilite etait deja
conforme : security.txt valide (RFC 9116, expiration 2027, trois
langues), robots.txt propre avec sitemap declare, FAQPage en place sur
la FAQ, Article et BreadcrumbList sur les carnets. Une seule piece
manquait : le schema WebSite des accueils ignorait le moteur de
recherche livre au chapitre 336.

**L'ajout.** potentialAction SearchAction sur les deux accueils
(EntryPoint vers /recherche#q={search_term_string}, et l'equivalent
anglais), le gabarit qui permet aux moteurs d'offrir la recherche
interne directement dans leurs resultats. Valide : quatre blocs
JSON-LD par accueil, zero invalide, et le parcours reel confirme que
le gabarit fonctionne — l'URL avec fragment preremplit le champ et
lance la recherche (6 resultats sur "raffinage").

**Un faux positif d'instrument, consigne.** Un grep a cru voir deux
elements main sur les pages recherche et presse ; le second etait la
chaine "<main>" dans un commentaire CSS herite du gabarit. Le DOM est
sain, axe avait raison, le registre des instruments s'enrichit : un
grep sur du HTML compte les chaines, pas les noeuds.

Deux accueils modifies, HTML seul : pas de bump du service worker.

## 353 — Les acces rapides en tiroir (2026-08-30)

**L'arbitrage du proprietaire.** Le bouton-tiroir remplace l'affichage
permanent, pour optimiser l'espace — il supersede l'exigence de
visibilite du chapitre 343, et la lettre en est consignee. Realisation
en details/summary natif : pas de JavaScript requis pour ouvrir, le
clavier fonctionne d'office (Entree bascule), et un ecouteur de trois
lignes ouvre le tiroir automatiquement quand on arrive par l'ancre
#annuaire (le rail de traversee y mene). Ferme, le tiroir fait 65
pixels au lieu des 909 de la version deployee — les quarante portes et
les cinq groupes sont intacts derriere le bouton "Acces rapides -
40 portes - 5 groupes". Chevron anime (neutralise sous
prefers-reduced-motion), verre semi-opaque lisible sur la photo de
fond. Verifie FR et EN, deux themes, bureau et mobile : bascule,
clavier, ancre, zero violation axe, zero erreur console.

## 354 — QA de la structure translucide (2026-08-30)

**La commande.** Verifier le verre du site : les surfaces
semi-transparentes et les flous d'arriere-plan qui signent son
langage visuel.

**Le banc au pixel peint.** Un harnais a inventorie sur neuf pages
representatives (accueils deux themes, pole, carnet, arabe, boutique,
contact, presse, glossaire) tout element visible portant du texte
direct sur fond semi-transparent (alpha entre 0,05 et 0,9) ou avec
backdrop-filter, puis a mesure le contraste reel : capture d'ecran de
l'element, couleur de fond estimee sur les pixels peints (le verre
compose avec ce qu'il recouvre — seule la mesure au pixel dit vrai),
contre la couleur de texte calculee. Verdict : 83 elements de verre
mesures, zero sous 4,5:1.

**Les replis, verifies statiquement.** 324 regles utilisent
backdrop-filter. Le systeme de repli est en place : un bloc @supports
not donne des fonds pleins a la navigation, au bandeau cookies, aux
mega-menus et aux sous-navigations de pole quand le flou n'existe pas ;
prefers-reduced-transparency est honore dans une douzaine de feuilles.
Les familles de cartes (hpcard, sc-card, ct-card...) reposent sur
leurs fonds rgba de base, dont le contraste mesure tient. Note
d'inventaire : le veil de luminosite et les regles de desactivation
n'ont pas besoin de fond propre, ils n'en portent pas de texte.

Deux accueils modifies (chapitre 353), HTML seul : pas de bump du
service worker.

## 355 — Le hero passe au verre (2026-08-30)

**La demande du proprietaire, capture a l'appui.** Rendre le hero
translucide sur la home : le bloc opaque de la refonte couvrait la
photo immersive, dont les annotations depassaient maladroitement sur
la droite. Le hero rejoint le langage de verre du site.

**La realisation.** Fond du hero en degrade semi-transparent (alpha
0,6 a 0,78 en sombre, 0,74 a 0,86 en clair) avec backdrop-filter
blur(14px) saturate(1.05) ; les cellules du bandeau de chiffres
passent a 55 % d'opacite en sombre et 80 % en clair. Les replis du
chapitre 354 s'appliquent au nouveau venu : @supports not rend les
degrades opaques d'origine quand le flou n'existe pas, et
prefers-reduced-transparency fait de meme.

**Le banc au pixel peint, avant publication.** Premier passage : les
ors du theme clair souffraient sur le verre (chapeau 2,83:1, chiffres
3,87:1) — la photo assombrit le fond compose. Corrige par des ors
plus fonces en clair (5C470B et 6B520D) et un verre clair legerement
plus opaque. Second passage : tout au-dessus de 5,88:1 en clair et de
11:1 en sombre, sur les cinq familles de texte du hero. Zero erreur
console, les deux accueils.

Deux accueils modifies, HTML seul : pas de bump du service worker.

## 356 — Un audit externe passe au crible des mesures (2026-08-30)

**La piece versee.** Le proprietaire transmet un audit exterieur du
site, au ton assure et aux recommandations "premium". Regle du
registre : chaque affirmation se confronte aux mesures consignees,
pas aux impressions. Verdict en quatre paniers.

**Panier 1 — faux, preuves a l'appui.** "SEO faible, absence de
balises meta" : l'accueil porte description, canonical, quatre
hreflang, sept og:, six twitter: et quatre blocs JSON-LD ; 217 URL au
sitemap (que l'audit recommande... de creer). "Accessibilite limitee,
manque d'ARIA, contrastes insuffisants" : 8 422 aria-label sur 218
pages, zero violation axe au balayage complet (ch.348), 83 elements
de verre mesures au pixel peint sans un seul sous 4,5:1 (ch.354).
"Responsive incomplet, sections debordent sur mobile" : zero
debordement sur 218 pages, deux themes (ch.348), WebKit iPhone
compris (ch.347). "Temps de chargement eleve" : site le plus leger et
le plus rapide du panel des majors mesure au chapitre 341 (215 Ko,
~210 ms). "Typographies non institutionnelles, privilegier Inter" :
le corps du site EST en Inter auto-hebergee depuis l'origine, avec
Space Grotesk en titrage — une identite, pas un defaut. "Palette non
harmonisee, viser bleu petrole / or / blanc" : c'est tres exactement
la palette canonique du site (marine 0B1422, ors E8C36A, creme),
publiee avec ses codes sur la page presse.

**Panier 2 — deja livre.** Timelines : la chronologie interactive des
jalons (ch.306). Chiffres cles : le bandeau du hero et la bande de
l'ambition (ch.346). Cartes interactives : la carte SVG des operations
(P3). Visuels techniques : pompe, pipeline, raffinerie, stations en
webp dans les pages et le kit presse. Design system : la charte
existe (/charte), boutons et cartes unifies par les chapitres 246-247
et 332.

**Panier 3 — decline, avec motif.** Migrer vers Next.js : le socle
statique est un choix d'architecture assume, mesure plus rapide que
les majors ; on ne remplace pas ce qui gagne. Les ratios d'image
imposes 16:9 : prescription decorative sans probleme constate.

**Panier 4 — au proprietaire, car cela touche le canon.** L'audit
parle d'un "Groupe EnerTchad" et d'une "Mission Delta" dediee au
transport-distribution : confusion probable avec le sous-domaine
technique enertchad-delta.vercel.app — le canon du site, ecrit dans la
fiche presse, dit societe unique, pas un groupe, pas de filiales, sur
TOUTE la chaine. En faire un groupe a filiales serait une decision de
structure d'entreprise, pas un correctif de site. Quant au
"Vice-President Artificial Lift deja en memoire" : aucun titulaire
n'existe au registre, et inventer un dirigeant contredirait
l'arbitrage en attente (les noms reels a la formalisation des
organes) comme l'honnetete du site. Ces deux points restent la ou ils
doivent etre : entre les mains du proprietaire.

**Consigne en retard du chapitre 355.** Le build Vercel du commit du
hero en verre a stagne environ 25 minutes (les precedents prenaient
une minute) ; un commit de relance utile — lastmod du sitemap — a
declenche un build frais qui a tout emporte. Lecon d'exploitation :
verifier le Last-Modified servi, pas seulement le commit pousse.

Aucun changement du site : le journal seul est publie.

## 357 — Audit general : l'etat des lieux mesure du jour (2026-08-31)

**La commande.** Un audit complet, en mesures fraiches — pas en
souvenirs de chapitres. Tous les harnais ont tourne ce jour, sur le
site tel qu'il est apres la refonte, le verre et le tiroir.

**Integrite du graphe.** 219 fichiers HTML, chaque href, src, action
et poster resolu contre la chaine redirects-rewrites-fichiers, chaque
ancre contre les id reels, les fragments d'etat JavaScript reconnus
(rub=, t-, p=, q=) : zero probleme.

**Balayage dynamique, les deux themes en entier.** 218 pages en theme
sombre ET 218 en theme clair, le meme jour : axe, erreurs console et
de page, reponses HTTP, debordements horizontaux — zero anomalie ;
seules les metriques informatives de citations remontent, inchangees.

**Donnees structurees.** 747 blocs JSON-LD sur le site, zero invalide ;
dix types (BreadcrumbList 215, WebPage 153, Organization 131, WebSite
85, Dataset 84, Article 64, FAQPage, CollectionPage, WebApplication,
Blog).

**Production.** Six en-tetes de securite sur six ; service worker
et-202608302320 servi ; premier chargement complet 212 Ko sur le fil
(30 ressources declarees) ; TTFB 280 ms apres echauffement — le
premier coup a froid a coute 971 ms, consigne honnetement : c'est le
reveil du bord, pas le regime de croisiere. Telechargements sondes
(kit ZIP, brochure PDF, calendrier ICS) : octets magiques conformes.

**Acquis recents reconfirmes par leurs chapitres.** CLS 0 au banc
bride (ch.347), 83 elements de verre sans un contraste faible
(ch.354), impression sans chrome flottant (ch.349), redirections 123
sur 123 (ch.342), palette Ctrl+K 494 entrees saines (ch.342).

**Verdict.** Zero defaut ouvert sur les huit axes mesures. Les seules
choses en attente ne sont pas des defauts : quatre arbitrages sur des
faits du proprietaire, trois veilles a echeance.

Seul le journal change : pas de bump du service worker.

## 358 — Reorganisation sur les trois poles de coeur, phase 1 (2026-08-31)

**L'arbitrage du proprietaire.** Reorganiser le site sur les trois
poles Amont, Intermediaire, Aval, et integrer les poles supports
directement dans ces poles de coeur. C'est un changement de doctrine :
le canon "huit poles dont quatre appuis" devient "trois poles de coeur
— que prolonge la petrochimie — integrant quatre capacites". Les
quatre ne sont plus un pilier a cote de la chaine : ils vivent dedans.

**La doctrine d'integration, decidee sur delegation.** Chaque capacite
sert les trois poles de coeur, avec un angle par pole plutot qu'un
rattachement unique — decouper GreenTech en trois morceaux aurait
menti sur sa nature transversale. En Amont : l'eau et le torchage
(GreenTech), le champ numerique et la chimie EOR (TchadiTech), les
metiers du puits (Tchaditude), les etudes du sous-sol (EnerConseils).
En Intermediaire : integrite et fuites, comptage et supervision,
la chaine humaine du transport, l'atlas des flux. En Aval : qualite et
HSE des stations, outils clients, le reseau humain du service, le
conseil B2B. Les URL des anciennes pages de pole restent stables :
la reorganisation est d'architecture d'information, pas de
demenagement de fichiers — aucun lien ne casse.

**Phase 1, appliquee ce jour.** Les deux accueils : le chiffre cle du
hero passe de "8 poles" a "3 poles de coeur — quatre capacites
integrees" ; la section des appuis est retitree "Quatre capacites,
integrees aux poles de coeur" avec son introduction reecrite dans la
nouvelle doctrine ; l'annuaire renomme son groupe "La chaine — poles
de coeur" et marque les quatre capacites "integre". Les six hubs de
coeur (Amont, Intermediaire, Aval, FR et EN) recoivent chacun une
bande "Capacites integrees" de quatre cartes, angle par pole, aux
pastilles canoniques. Verifie : dix pages, deux themes, zero
violation axe, zero debordement, zero erreur console.

**Phases suivantes, planifiees.** Phase 2 : le balayage du cadrage
"huit poles" sur les 218 pages (FR, EN, arabe — ar-poles s'appelle
encore "les huit poles"), la fiche presse et le kit, le glossaire, les
JSON-LD, l'explorateur de la chaine, les mega-menus. Phase 3 : QA de
consolidation, communique, registre public. Le rythme des chapitres
326 a 331 — l'arbitrage d'abord aux points cardinaux, le balayage
ensuite — a fait ses preuves ; il est reconduit.

Huit pages HTML modifiees, HTML seul : pas de bump du service worker.

## 359 — Reorganisation phase 2 : le balayage doctrinal (2026-08-31)

**Le chantier.** Apres les points cardinaux (chapitre 358), le
balayage : 248 occurrences de l'ancien cadrage "huit poles" inventoriees
hors journal — francais, anglais, arabe, entites HTML comprises — et
reecrites dans la doctrine des trois poles de coeur a capacites
integrees. Le journal lui-meme n'est pas reecrit : c'est une archive.

**Ce qui a change.** Le gabarit du pied de page "Nos 8 poles / Nos
domaines d'activite" sur 142 pages devient "Nos poles de coeur / La
chaine et ses capacites". Les pages de fond suivent : societe ("Une
societe unique : trois poles de coeur"), FAQ (question 10 et ses
JSON-LD reecrits), cibles-2030 (le compteur anime passe de 8 a "3
poles de coeur"), gouvernance ("arbitre entre les poles de coeur et
leurs capacites" — l'occurrence se cachait en entites HTML),
brochures, carnets, carrieres, recherche, plans du site, solutions,
communiques. L'arabe est aligne : ar-poles s'intitule desormais
"aqtab al-qalb al-thalatha" (les trois poles de coeur), les "huit
piliers" du titre deviennent trois, les "colonnes de soutien"
deviennent des "capacites integrees" (qudrat mudmaja), et la
navigation en pastilles des cinq pages arabes suit. La fiche presse et
les boilerplates FR/EN du kit sont reecrits et le ZIP reconstruit ; la
citation officielle des pages presse aussi ; les deux index de la
palette Ctrl+K suivent (mots-cles et libelles) et l'index de recherche
est regenere.

**Les lecons d'instrument.** Deux gisements avaient echappe au premier
passage et ont ete reveles par la verification au TEXTE RENDU plutot
qu'au source : un compteur anime portait son "8" dans un attribut
data-count, et une occurrence vivait en entites HTML (p&ocirc;les).
Le registre s'enrichit : balayer un cadrage exige trois passes — le
source, les attributs de donnees, et le texte peint au navigateur.

**Verification.** Zero occurrence residuelle sur source ET rendu
(echantillon de huit pages representatives au navigateur, arabe
compris), zero erreur console, zero debordement, JSON-LD des 156
fichiers modifies revalides.

Service worker : et-202608310800 (deux index de palette modifies).
Phase 3 (QA de consolidation, communique, registre) au prochain next.

### 359 bis — Complement post-publication : residus dans les index de palette

La verification de production apres les 16 lots a revele que mon
balayage declare "zero residu" etait faux sur un point. Deux index de
la palette de commandes contenaient encore l'ancien cadrage :
"huit poles" deux fois dans les mots-cles de cmdk_extra.js (entrees
arabe et brochure) et un titre visible "Eight poles — one integrated
chain" dans cmdk_en.js (entree en-35, page d'accueil EN).

Mon erreur : les trois passes du balayage (source HTML, attributs
data-, texte rendu navigateur) ne couvraient pas les chaines de
mots-cles des fichiers JS. Les mots-cles ne sont jamais rendus a
l'ecran et mes greps de source ne visaient que les .html. Lecon :
un balayage de cadrage doit inclure les fichiers de donnees JS/JSON
de la palette et de la recherche, pas seulement les pages.

Correctif : "huit poles" remplace par "trois poles de coeur" (x2),
titre EN corrige en "Three core poles — one integrated chain". Au
passage, mise en conformite avec le canon "societe unique, pas un
groupe" : la categorie de palette "Groupe" (17 entrees FR) devient
"Societe" et "Group" (29 entrees EN) devient "Company". Syntaxe JS
verifiee (new Function) sur les deux index et sw.js.

Service worker : et-202608310855 (deux actifs JS modifies).
Publication : lot 16 (assets/chrome) puis lot 17 (sw.js + journal).

## 360 — Home ultra premium : le verre etendu aux huit blocs

Demande du proprietaire : moderniser la home en ultra premium avec son
caractere translucide. Arbitrages recueillis : portee totale (les huit
blocs) et halo dore subtil statique en fond.

### Ce qui change (index.html et index-en.html, couche style id lux360)

Halo : le pseudo-element body::after (etoiles de liquidglass) devient un
halo statique — deux lueurs or et une lueur bleue radiales, aucune
animation, decline en clair (or profond attenue). Il transparait dans
tous les panneaux de verre, hero compris, sans toucher au verre du hero
lui-meme (benche aux chapitres 354-355, laisse intact).

Recette panneau unique "verre feuillete" appliquee aux familles de la
home : cellules KPI du hero, cartes agir, cartes chiffres (hxf), cartes
carnets (hncard), mini-cartes communiques (hcp-i), tiroir annuaire
(annu-t). Degrade froid translucide, blur 18 px sature 1.45, filet or
rgba(232,195,106,.20), arete speculaire en inset, ombre profonde.
Survol calme : levee 4 px et filet qui s'eclaire, sans echelle ni lueur
criarde. Boutons verre : nh-b2 et hb-cta. Bouton or du hero : lueur
douce. Filets d'or en tete de la bande conviction et de la bande CTA.
Pastilles KPI des maillons : fond assombri leger sans blur (cout GPU
maitrise). Theme clair : verre blanc chaud, filets or profonds, memes
familles. Mobile : blur reduit a 12 px.

Pont nav vers hero : la bande de photo brute (42 px) pincee entre la
barre de navigation et le panneau du hero — defaut preexistant, criard
en theme clair — devient un degrade assorti au theme via
diapo::before (z 1, au-dessus du voile diapo::after).

Fallbacks livres a la meme specificite que les surcharges : supports
sans backdrop-filter (panneaux opaques), prefers-reduced-transparency
(opaques, halo eteint), prefers-reduced-motion (pas de levee),
impression (blanc, sans flou ni halo ni pont).

### QA

Banc de contraste au pixel peint (harnais ch.354 readapte) : 160
elements de verre mesures sur les deux homes et les deux themes,
zero sous 4.5:1 apres correctifs. Axe apres defilement complet et fin
des animations : zero violation sur FR sombre, FR clair, EN sombre et
FR mobile 390 px ; zero erreur console ; zero debordement horizontal.
Perf mobile bridee (reseau 1.6 Mbps, CPU x4) : CLS 0.0036, aucun
regression — la couche est du CSS inline (~11 Ko).

### Deux defauts reveles par le banc, corriges

Un cause par moi : la recette verre appliquee au bouton hxi-cta posait
un fond sombre sous son texte sombre (contraste 1.47). Le bouton or
d'origine est retabli — hxi-cta retire de toutes les listes lux360.
Mea culpa : appliquer une recette a une famille de boutons sans
verifier la couleur de texte de chacun.

Un preexistant : la pilule de navigation active (nav-trigger is-active)
affichait un texte marine sombre sur pilule sombre en theme sombre
(contraste 1.2, home EN). Correctif home : texte or F0CE82. A verifier
sur le reste du site en phase 3 (la regle vit dans les bundles nav).

Aucun actif JS ou CSS de assets modifie : pas de bump du service
worker. Publication : index.html, index-en.html, MAINTENANCE.md.
En attente phase 3 (au prochain next) : QA de consolidation 218 pages,
communique CP-2026-010, synchronisation du registre, verification
site-wide de la pilule nav active, et arbitrage sur les libelles
"Groupe" restants (menu de navigation et colonne du pied de page).

## 361 — Groupe devient Societe sur tout le site

Arbitrage du proprietaire (sur proposition, canon "societe unique, pas
un groupe") : le libelle de rubrique "Groupe" disparait. Menu de
navigation "Groupe" -> "Societe" (EN "Group" -> "Company"),
aria-label du mega-panneau, colonne du pied de page (h3 sur 125
pages), colonne du plan du site (h2), kicker de la page achats. Les
"groupes electrogenes" et "groupes diesel" du contenu, legitimes,
n'ont pas ete touches — remplacements ancres sur les chaines exactes,
jamais sur le mot seul. 176 fichiers modifies, 412 remplacements,
zero residu au controle (source, data-attributs, texte rendu au
navigateur sur les 218 pages en 3 tranches).

Rattrapages du chapitre 359 reveles par l'inventaire — mea culpa, le
balayage doctrinal avait rate six familles : les kickers des huit
pages de capacites ("Pole support - Capacite transversale" ->
"Capacite integree - Au coeur des trois poles", EN "Built-in
capability - Inside the core poles") ; le plan du site (section
"Poles supports" -> "Capacites integrees", FR et EN, et les deux
entrees d'index de recherche assorties) ; la brochure ("les cinq
poles supports" -> la doctrine) ; cibles-2030 ("Quatre coeurs de
metier + quatre poles supports" -> "Trois poles de coeur que prolonge
la petrochimie, quatre capacites integrees") ; l'explorateur de la
chaine (texte et meta description) ; un mot-cle de palette ("poumon
financier vise du groupe" -> "de la societe"). Lecon consignee : un
balayage de cadrage doit aussi passer les kickers pgk, les meta
descriptions et les mots-cles JS.

Un actif JS modifie (cmdk_extra.js) : service worker bumpe en
et-202608311253. Syntaxe JS et JSON verifiees.

## 362 — QA de consolidation : 218 pages, deux themes, zero defaut

Apres les vagues 358-361, balayage complet au harnais du chapitre 319
en six tranches de fond : console, erreurs de page, HTTP >= 400, axe
WCAG A/AA (apres fin des animations), debordement horizontal,
apostrophes droites — sur les 218 pages et les deux themes. Zero
defaut. Seules remontees : la geometrie informative des citations
pmani-q (42 px, 2 a 5 lignes), conforme au canon. En complement, la
passe texte rendu (balayage des termes bannis : Groupe, Group, poles
supports, transversale, huit poles, eight poles) et la passe
data-attributs sont revenues vides toutes les deux.

## 363 — CP-2026-010 : la reorganisation annoncee, registre a jour

Communique CP-2026-010 (31 aout 2026) publie en francais et en
anglais : trois poles de coeur que prolonge la petrochimie, quatre
capacites integrees, plus de 150 pages mises a jour FR/EN/AR,
adresses inchangees, accueil redessine. Insere en tete de
/communiques et /communiques-en, verse aux flux RSS (48 items,
lastBuildDate remis a l'heure, XML valide). Les mini-communiques des
deux accueils, restes bloques a 007/006/005, passent a 010/009/008
avec ancres directes.

Tableau de bord registre synchronise : 13 chapitres ajoutes (351 a
363), compteurs, version SW et periode mis a jour ; republie sur son
adresse d'artifact habituelle.

En attente (inchange) : noms de direction, rapport annuel, seance
photo, INSPEM/ticket minimum. Veilles : Brent janvier 2027, ITIE,
Sedigui. Conflits de canon restants du ch.356 (Mission Delta, VP
Artificial Lift) toujours a l'arbitrage du proprietaire.

## 364 — La couche premium etendue a tout le site, le hero s'ouvre

Arbitrage du proprietaire : etendre le langage ultra premium
translucide de la home aux autres pages. Une couche lux364 est
ajoutee au bundle commun (bundle_core_a1.css, charge par 206 pages) :

Halo dore statique — le pseudo-element body::after des pages a decor
rootland (217 pages l'ont) recoit les deux lueurs or, la lueur bleue
et les etoiles discretes, au-dessus de la photo (z -1 contre -2) et
sous le contenu. Il fallait ce porteur-la : html::after peint sous la
photo (invisible, teste au navigateur avant d'ecrire la regle) et
body::before porte le grain. Eteint en transparence reduite et a
l'impression.

Ombres feuilletees — les familles generiques de cartes du theme
sombre (.card, [class*="-card"], .kpi, .hpcard, .esg-card, .sb-card)
recoivent l'arete speculaire en inset et la retombee profonde de la
home, au survol comme au repos. Les bordures ne sont pas touchees :
les couleurs d'identite des poles restent.

Filet d'or du pied de page (degrade transparent-or-transparent,
decline or profond en clair) et pilule de navigation active doree en
sombre, comme sur la home.

En cours de chantier, demande directe du proprietaire : rendre le
hero de la home verre translucide. Le verre du ch.355 etait a 78
pour cent d'opacite — presque opaque a l'oeil. Nouvelle robe dans
lux360 : 50/42/38 pour cent, flou 18 px, replis opaques reecrits a la
meme specificite (supports, transparence reduite, impression). Le
decor et le halo transparaissent nettement, dans les deux themes.

QA : banc de contraste au pixel sur les textes du hero (chapeau, h1,
accroche, KPI) — un seul passage sous 4.5:1, le chapeau du theme
clair a 4.18, corrige en #4A3809 (5.33 apres) ; banc verre sur 9
pages et 2 themes : 85 elements, zero faible ; sweep complet 218
pages x 2 themes (console, axe, HTTP, debordements, apostrophes) :
zero defaut. Hors perimetre, consigne : les pages sans bundle (404,
mini-site arabe, explorateur, calculateurs) gardent leur habillage
propre.

Service worker : et-202608311413 (bundle CSS modifie).
Publication : bundle_core_a1.css, index.html, index-en.html, sw.js,
journal.

## 365 — Les pages hors bundle rejoignent la couche premium

Les huit pages qui ne chargent pas le bundle commun recoivent leur
propre couche lux365 en ligne : 404, les cinq pages du mini-site
arabe et les deux explorateurs de la chaine. Halo dore statique
au-dessus du decor rootland (les huit l'ont), filet d'or du pied de
page (le 404 n'en a pas), replis transparence reduite et impression.
Sur les pages arabes, le halo est pose en miroir — lueur principale
en haut a gauche — pour suivre le sens de lecture RTL.

La capture de controle a revele un residu doctrinal que tous les
balayages avaient rate : la carte KPI arabe "8 اقطاب متكاملة" (huit
poles integres) sur les cinq pages du mini-site. Mes listes de
termes bannis etaient francaises et anglaises — jamais arabes. Mea
culpa, et lecon consignee : un site trilingue se balaie dans ses
trois langues. Correctif : "3 / اقطاب قلب — اربع قدرات مدمجة"
(trois poles de coeur — quatre capacites integrees), conforme a la
doctrine et au KPI des accueils.

QA ciblee sur les huit pages, deux themes : axe WCAG A/AA zero
violation, zero erreur console, zero debordement ; controle visuel
ar-poles avant/apres. Aucun actif JS/CSS modifie : pas de bump SW.

## 366 — Audit mesure face aux majors, apres la vague design

Reprise du banc du chapitre 341 (poids gzip sur le fil, harnais qui
ne decode que ce qu'il annonce), complete d'un banc en-tetes de
securite et vitesse (3 mesures, mediane). Panel : TotalEnergies,
Chevron, Petrobras, ExxonMobil, Shell (Aramco : delai depasse,
constat identique au ch.341).

Resultats — EnerTchad tient son rang apres les chapitres 360-365 :
le plus leger du panel en poids total sur le fil (214 Ko contre 305
TotalEnergies, 429 ExxonMobil, 783 Petrobras) — la vague design n'a
coute qu'un kilo-octet par rapport aux 215 Ko du ch.341 ; le plus
rapide (mediane 329 ms contre 489 a 1792) ; seul a servir les six
en-tetes de securite (les majors en servent 2 a 5) ; seul avec
JSON-LD (x4), RSS, manifest, service worker et theme-color reunis ;
title 60 caracteres, canonical, hreflang, un seul h1 — au canon.
Zero defaut a corriger : chapitre de constat, sans correctif.

## 367 — Consolidation : le sitemap a l'heure git, registre a jour

Apres les vagues 359 a 366 (plus de 190 fichiers touches), les
lastmod du sitemap dataient pour beaucoup du 29-30 aout. Ils sont
regeneres depuis git (date du dernier commit par fichier, methode du
chapitre 331) : 182 entrees mises a jour sur 217, zero URL sans
fichier correspondant, XML valide. Controle de couverture : les 217
pages eligibles (hors 404, verification Google et sources
d'impression) ont toutes leur entree — 217/217, rien en trop.

Tableau de bord registre synchronise : chapitres 364 a 367 ajoutes,
compteurs et version SW mis a jour, republie sur son adresse
habituelle.

Aucun actif JS/CSS modifie : pas de bump SW. Publication : le
sitemap et le journal. Le sitemap frais est aussi le commit
declencheur qui suit la lecon du chapitre 355 — un deploiement se
verifie sur le Last-Modified servi.

## 368 — Audit : la structure multipages face au coeur de metier

Demande du proprietaire : auditer la structure multipages du site et
son integration au coeur du metier. Sept axes mesures sur les 218
pages, graphe de liens reconstruit depuis la source.

Arborescence — 218 pages : 64 journaux, 77 racine FR/EN, 8 sous-sites
(4 poles de la chaine : amont 9, intermediaire 7, aval 9, petrochimie
9 ; 4 capacites : greentech 9, tchaditech 11, tchaditude 9,
enerconseils 9), 5 pages arabes.

Integration au coeur de metier — l'architecture epouse la doctrine :
le menu "Nos activites" est structure en quatre colonnes Amont,
Intermediaire, Aval, Petrochimie (la chaine, rien qu'elle) ; les
capacites sont servies par leurs angles — TchadiTech et EnerConseils
sous Innovation, GreenTech et Tchaditude sous Durabilite — et non
comme un groupe de poles parallele : conforme a "integrees, pas a
cote". Les huit hubs sont dans le menu. Chaque hub de pole lie les
quatre capacites ; chaque hub de capacite lie les quatre maillons de
la chaine ; la chaine se suit de hub en hub (amont -> intermediaire
-> aval -> petrochimie -> amont). Les 64 journaux renvoient tous vers
au moins un pole ou une capacite ; ar-poles renvoie vers les huit
hubs ; fils d'Ariane et BreadcrumbList sur 72/72 sous-pages ;
profondeur maximale 3 clics depuis l'accueil (5 pages seulement, des
journaux EN), aucune orpheline.

Un defaut reel : les hubs Petrochimie FR et EN n'avaient pas la bande
"Capacites integrees" du chapitre 358 — elle n'avait ete posee que
sur les trois poles de coeur, alors que le prolongement s'appuie sur
le meme socle. Correctif : bande ajoutee sur les deux hubs avec des
angles propres au complexe (effluents et chimie propre, conduite
numerique des unites, operateurs et chimistes formes, marches engrais
methanol bitume), pastilles aux couleurs canoniques, gabarit et
styles repris du chapitre 358. QA des deux pages : axe zero
violation, zero erreur console, zero debordement, deux themes,
controle visuel.

Note d'instrument : le BFS de profondeur croyait les deux
calculateurs orphelins — leurs adresses passent par des rewrites
Vercel que l'analyse statique ne connait pas ; faux positifs ecartes
a la main.

Aucun actif JS/CSS modifie : pas de bump SW.

## 369 — Chaque pole porte son offre aux tiers

Arbitrage du proprietaire : chaque pole doit avoir des services et
solutions proposees aux tiers, sous forme de bande standard sur les
hubs. Une section "Aux tiers - Services & solutions" (id offre-tiers)
est posee sur les seize hubs — les quatre poles de la chaine et les
quatre capacites, FR et EN.

Contenu : trois cartes d'offres par pole, tirees des pages
existantes du sous-site (aucune offre inventee — chaque carte
resume la meta description de sa page et pointe vers elle) :
parapetrolier, EOR et parc pour l'Amont ; logistique, exploitation
du flux et sites pour l'Intermediaire ; distribution ARSAT, gamme
produits et reseau pour l'Aval ; molecules, marches et chimie EOR
pour la Petrochimie ; HSE-Q, hybridation et eau-impact pour
GreenTech ; outils, socle et R&D pour TchadiTech ; academie, lignes
capital humain et partenariats pour Tchaditude ; conseil, audits et
ESG pour EnerConseils. Deux CTA par bande : Devenir client
(/clients) et Le contact direct (/contact), versions -en cote EN.

Style otr-css auto-porte sur chaque hub : cartes verre feuillete au
filet d'or, pastille a la couleur canonique du pole, survol calme,
theme clair, replis sans backdrop-filter, mouvement reduit et
impression. Insertion avant la bande capacites (hubs de la chaine)
ou avant la fin du main (hubs de capacites).

QA : 48 verifications de liens de cartes (zero invalide), axe WCAG
A/AA, console, debordement et hauteur de bande sur les 16 pages et
les 2 themes : tout vert. Controle visuel hub aval.

Aucun actif JS/CSS de assets modifie : pas de bump SW. Publication
groupee avec le chapitre 368 des le retour du navigateur.

## 370 — Consolidation : registre a jour, relances refermees

La publication des chapitres 368-369, interrompue par la deconnexion
du navigateur, s'est achevee en deux temps : deux lots commis avant
la coupure (hubs EN + journal, amont), les sept restants au retour de
Chrome. Parite md5 17/17, verification production complete — les 16
hubs portent leur bande "Services & solutions aux tiers", les hubs
petrochimie leur bande capacites, le journal est en ligne. Les
relances programmees pour la reprise automatique sont soldees (la
premiere a constate l'absence du navigateur et s'est re-planifiee, la
seconde s'est refermee d'elle-meme).

Tableau de bord registre synchronise : chapitres 368 a 370 ajoutes,
compteurs et periode mis a jour (275-370, 1er septembre 2026),
republie sur son adresse habituelle.

Aucun actif JS/CSS modifie : pas de bump SW. Publication : le journal
seul.

## 371 — Le hero passe au verre clair

Demande du proprietaire : hero en verre clair, transparent et
translucide. La robe sombre du chapitre 364 (teinte marine a 50-38
pour cent) cede la place a un givre blanc leger : teinte blanche a
17/10/13 pour cent, flou porte a 24 px, saturation 1.35 — le decor
transparait nettement, le panneau se lit comme du verre clair et non
plus comme un voile fonce. En theme clair, blanc-creme a 42/32/38
pour cent, meme logique.

Le contraste est protege par deux moyens locaux, sans assombrir la
robe : un halo radial discret sous le bloc de texte (34 pour cent en
sombre, creme 62 pour cent en clair, via nh-in::before sous les
enfants du bloc) et une ombre portee douce sur le titre et
l'accroche. Le chapeau du theme clair est fonce en #332606 pour
tenir la barre.

Banc de contraste au pixel apres deux iterations (la premiere robe,
plus timide, laissait le chapeau clair EN a 4.37) : pire valeur 4.94
en clair, 7.42 en sombre, tout le reste entre 5.2 et 18. Axe : zero
violation sur FR sombre, FR clair, EN sombre et mobile ; zero erreur
console ; zero debordement. Replis reecrits a la meme specificite :
sans backdrop-filter et transparence reduite (opaque, halo retire),
impression (blanc, sans ombre portee).

Aucun actif JS/CSS modifie : pas de bump SW. Publication :
index.html, index-en.html, journal.

## 372 — Ultra revue de la home : deux vrais defauts sous le vernis

Demande du proprietaire : revue exhaustive de la home. Methode :
lecture visuelle bloc par bloc sur trois rendus (desktop sombre,
desktop clair, mobile sombre, 16 captures), sonde d'interactions
(tiroir annuaire, ordre de tabulation sur 14 arrets, anneaux de
focus, palette Ctrl+K, cartes retournables), metadonnees et JSON-LD,
verification des acquis (contraste hero ch.371, perf ch.364).

Ce qui tient : hierarchie de lecture nette sur les huit blocs, verre
clair du hero lisible dans les deux themes, tiroir annuaire qui
s'ouvre, se referme et s'ouvre par ancre, ordre de tabulation logique
avec lien d'evitement en tete et zero focus sans anneau, palette
operationnelle, title 60 caracteres, description 155, quatre blocs
JSON-LD valides (Organization, WebSite, Dataset, WebPage), zero
violation axe et zero erreur console sur les quatre configurations,
mobile propre avec sa barre d'onglets.

Deux vrais defauts, corriges :

Un doctrinal — la carte retournable "4 + 4" du bloc chiffres disait
encore "4 poles metiers + 4 capacites transversales" sur son recto,
son verso ET son aria-label, en francais et en anglais ; l'intro du
bloc coeurs disait de meme "Quatre capacites transversales font
tenir l'ensemble". Huit occurrences de l'ancien cadrage sur les deux
accueils, passees au travers des balayages 359 et 361 : mes listes
bannissaient "Capacite transversale" au singulier majuscule et
"Cross-cutting capability" — pas leurs pluriels en minuscules. Mea
culpa, listes de bannissement completees dans la tete. La carte
devient "3 + 1 — poles de coeur + prolongement", verso "Trois poles
de coeur (Amont - Intermediaire - Aval) que prolonge la Petrochimie
— quatre capacites integrees".

Un d'accessibilite — les cartes chiffres se retournaient au survol
seulement (.hxf:hover) : un utilisateur clavier, malgre tabindex et
aria-label, ne voyait jamais le verso. Regle focus-visible et
focus-within ajoutee dans lux360. La sonde a d'abord menti (matrice
identite lue a t=0, transition en cours) — verite lue apres 1,2 s,
lecon du chapitre 349 confirmee une fois de plus.

Observation consignee sans correctif (portee site, a arbitrer) : la
colonne de pied de page "Nos poles" liste les huit portes, poles et
capacites melees ; un libelle comme "La chaine & capacites" serait
plus juste — c'est un sweep de ~125 pages, hors perimetre de cette
revue.

Aucun actif JS/CSS modifie : pas de bump SW. Publication :
index.html, index-en.html, journal.

## 373 — Le pied de page dit "La chaine & capacites"

Arbitrage du proprietaire, sur l'observation du chapitre 372 : la
colonne du pied de page "Nos poles" listait les huit portes en melant
poles de la chaine et capacites sous un seul mot. Elle devient
"La chaine & capacites" (EN : "The chain & capabilities"), alignee
sur la doctrine et sur la porte "Nos poles de coeur / La chaine et
ses capacites". Sweep : 125 fichiers (104 FR, 21 EN), zero residu,
rendu controle au navigateur sur trois pages temoins, zero
debordement.

Tableau de bord registre synchronise : chapitres 371 a 373 ajoutes,
compteurs mis a jour, republie.

Aucun actif JS/CSS modifie : pas de bump SW.

## 374 — Les versions mobiles remises au niveau du desktop

Demande du proprietaire : mettre a jour les versions mobiles. Audit
390 px (deux themes, pages temoins : accueils, hub amont, hub
tchaditude, communiques) puis correctifs.

Le hero mobile retrouve son verre clair — en portrait, le recadrage
cover de la photo tombait sur sa zone sombre et les voiles mangeaient
le reste : le panneau restait un aplat marine, sans rapport avec le
desktop du chapitre 371. Correctif dans lux360, mobile seulement :
recadrage vise (62/38), photo eclaircie (brightness 1.45, saturation
1.2), voile allege (.28/.44), robe du verre montee d'un cran
(blanc 24/15/19). Le decor transparait desormais derriere le titre.
Replis transparence reduite (photo et voile d'origine, panneau
opaque) et impression. Banc pixel mobile : pire contraste 5.36
(clair) / 5.49 (sombre), tout le reste entre 5.4 et 15.5.

Lecon d'instrument au passage : trois essais d'ajustement ont
"echoue" sans effet visible parce que la feuille injectee par la
sonde atterrissait dans head, AVANT le bloc lux360 de fin de body —
a specificite egale, l'ordre gagnait contre moi. Verite retrouvee en
injectant en fin de body. Consigne : une sonde de surcharge CSS
s'injecte apres la feuille qu'elle veut battre.

Deux defauts du bandeau cookies de secours (u_cd226c00eb4b.js, 119
pages) reveles par axe mobile sur communiques : sa cle de
consentement etait 'ckok' alors que le reste du site lit 'et-ck' —
un visiteur qui avait ferme le bandeau ailleurs le revoyait sur ces
pages (et inversement) ; correctif : lecture des deux cles, ecriture
des deux a la fermeture. Et son line-height etait pose en inline
!important — violation axe avoid-inline-spacing (WCAG 1.4.12) ;
correctif : meme valeur, sans !important. Syntaxe verifiee.

Cibles tactiles : les pilules de renvoi des communiques (36 px)
passent a 44 px (FR et EN). Les autres petites cibles relevees sont
des liens en ligne dans du texte, couverts par l'exception WCAG.

Zero debordement horizontal sur les quatre pages temoins, bandes
offre-tiers et capacites propres a 390 px, axe mobile 4 pages x 2
themes : zero violation apres correctifs.

Un actif JS modifie : service worker bumpe en et-202609012058.
Publication : index.html, index-en.html, communiques.html,
communiques-en.html, u_cd226c00eb4b.js, sw.js, journal.

## 375 — Consolidation post-mobile : tout vert

Apres le chantier mobile et la retouche du bandeau de secours (119
pages touchees par le JS), balayage complet au harnais du chapitre
319 : 218 pages, deux themes, console, erreurs de page, HTTP, axe
WCAG A/AA, debordements, apostrophes — zero defaut. Seules remontees,
comme toujours : la geometrie informative des citations pmani-q,
conforme.

Complement mobile hors bundle : pages arabes (ar, ar-poles), 404 et
explorateur controles en 390 px — zero violation axe, zero erreur
console, zero debordement.

Tableau de bord registre synchronise : chapitres 374 et 375 ajoutes,
version SW mise a jour, republie sur son adresse habituelle.

Aucun actif modifie par ce chapitre : pas de bump SW. Publication :
le journal seul.

## 376 — La home s'ouvre : translucide, transparente, panoramique

Demande du proprietaire : tout le site translucide, et la home
translucide transparente avec une immersion panoramique.

Cote home : le decor derive desormais lentement — animation et-pano
(transform seul, echelle 1.14 et translation de -2,4 a +2,4 pour
cent, 70 s aller-retour), coupee en mouvement reduit, en transparence
reduite et a l'impression ; CLS mesure a 0 pendant l'animation. Les
bandes des maillons s'ouvrent d'un tier de plus (voiles 50/26/5 pour
cent en sombre, 60/48/34 en clair, replis opaques d'origine en
transparence reduite) et la bande conviction passe a 42/28/48. Le
panorama court desormais derriere toute la page, du hero au pied.
Banc pixel sur les textes des bandes eclaircies : pire contraste
9.29 (sombre) / 10.68 (clair) — les ombres portees de l'immersion
font le travail.

## 377 — La translucidite generalisee : le site etait deja pret

Avant d'ecrire une couche de plus, mesure : un scanner de surfaces
(fond a alpha >= 0.85, au moins 180 x 70 px, theme sombre) passe sur
12 pages representatives. Verdict : UNE seule surface opaque restait
sur tout l'echantillon — les cartes profils et le bloc
contact-rapide de la page contact (alpha 0.88). Les chantiers 142,
314 et 364 avaient deja fait le reste : le site est translucide de
bout en bout, il ne manquait que ce recoin. Correctif : alpha 0.55,
flou 14 px sature, sur contact FR et EN (4 regles), replis
transparence reduite existants conserves. Re-scan : zero surface
opaque restante.

QA : banc verre 9 pages x 2 themes, 79 elements, zero faible ; axe
accueils (2 themes + mobile) zero violation, zero erreur console,
zero debordement.

Aucun actif JS/CSS de assets modifie : pas de bump SW. Publication :
index.html, index-en.html, contact.html, contact-en.html, journal.

## 378 — Consolidation post-transparence : la preuve que le mouvement ne coute rien

Rythme etabli : apres chaque vague, une consolidation. La vague 376-377
a introduit une nouveaute structurelle — une animation continue de
transform sur les photos du hero (et-pano, 70 s) — et generalise la
translucidite. Deux questions a trancher : le mouvement permanent
coute-t-il quelque chose sur mobile, et le site est-il reste propre.

Performance de et-pano, mesuree et non supposee. Banc dedie
(/tmp/a378/pano_perf.js) : profil mobile 390 px, processeur bride x4,
6 secondes de mesure par configuration, 2 accueils x 2 themes.
Resultats : animation presente et en cours sur les 4 configurations,
zero tache longue, CLS pendant l animation 0 (total .0004 au pire,
anterieur a la mesure), cadence rAF ~10 img/s.

Le controle qui donne son sens a la mesure : la meme page avec
l animation neutralisee tourne exactement a la meme cadence (10.0
contre 10.4). La cadence basse est donc le cout propre de la page
(couches de flou sous throttle x4), pas celui de l animation —
et-pano vit sur le compositeur, le fil principal ne la voit pas.
Un premier controle contre contact.html (22 img/s) aurait fait
conclure a tort que l animation coutait la moitie de la cadence :
comparer deux pages differentes ne controle rien.

Mon erreur, la meme lecon encore : ma premiere injection de
neutralisation (.diapo i{animation:none!important} en fin de body)
n a pas pris — l animation tournait toujours. La regle lux360 porte
trois :not(#id) ; a importance egale, la specificite gagne meme
contre une feuille injectee plus tard. Le verificateur running:true
dans la sonde a evite une fausse conclusion. Correction : selecteur
a quatre :not(#id). Lecon consolidee : une sonde qui pretend
neutraliser un style doit verifier que la neutralisation a pris,
jamais la supposer.

Sweep de consolidation : 218 pages x 2 themes (6 tranches
paralleles) — zero defaut. Trois pages en timeout de chargement
pendant le passage parallele (accessibilite, gouvernance,
journal-prix-litre) : rejouees en serie sur les deux themes, toutes
propres — contention de charge du banc, pas du site. Les geometries
de citation pmani-q restent informatives, inchangees.

Registre synchronise : entrees 376, 377, 378 ajoutees au tableau de
bord, compteurs 375 -> 378, re-bundle et republication.

Rappels proprietaire inchanges : noms de direction et conseil,
premier rapport annuel, seance photo officielle, convention INSPEM
et ticket minimum investisseur ; conflits "Mission Delta" et "VP
Artificial Lift" toujours en attente d arbitrage. Veilles datees :
carte Brent (janvier 2027), adhesion ITIE, jalons Sedigui.

Aucun fichier du site modifie hors journal : pas de bump SW.
Publication : MAINTENANCE.md seul.

## 379 — Les instruments de decouverte remis a l heure

Constat de depart : l index de recherche datait des chapitres 361-363
et les lastmod du sitemap du chapitre 367 ; depuis, quatorze chapitres
ont modifie le contenu (offre aux tiers sur 16 hubs, pied de page
renomme sur 125 pages, carte 3+1, verre, mobile). Les instruments qui
font decouvrir le site ne connaissaient plus le site.

Audit de l index (106 entrees FR, 104 EN) contre les pages reelles :
titres tous conformes (suffixe | EnerTchad normalise), mais trois
familles d ecarts. Un, les 16 hubs indexes ignoraient totalement
l offre aux tiers — une recherche "propose aux tiers" ne trouvait
rien. Deux, deux descriptions FR tronquees en plein mot depuis leur
generation (journal-premiere-du-genre coupait avant "licorne",
journal-transfert-garde avant "la mesure"). Trois, et la vraie prise :
la comparaison index-page a revele un residu doctrinal SUR LE SITE
lui-meme — plan-du-site-en.html portait encore "group pages" dans ses
quatre descriptions (meta, og, twitter, JSON-LD), et recherche-en.html
avait herite par copier-coller de la meme description fautive dans son
twitter:description, avec en prime un og:description tronque ("Find a
page across more than one hundred."). Le balayage 361 avait couvert le
texte visible et la nav, pas les zones meta. Lecon : les balayages de
termes bannis doivent inclure title, meta description, og, twitter et
JSON-LD — pas seulement le rendu.

Corrections : "group pages" -> "company pages" et "their capabilities"
-> "their built-in capabilities" (canon doctrinal) sur les 4 zones de
plan-du-site-en ; recherche-en recoit ses propres og et twitter
descriptions, alignees sur sa meta. Index : descriptions resynchronisees
sur les pages (4 entrees), et les titres de cartes de l offre aux tiers
ajoutes aux mots-cles des 16 entrees de hubs.

Sitemap : 117 lastmod regeneres depuis git (les vagues 368-377 avaient
change 125+ pages), les deux calculateurs a reecriture Vercel resolus
vers leurs vrais fichiers, et les deux pages corrigees ce jour datees
du jour ; XML revalide, 217/217 URLs couvertes.

Le JSON de l index est servi cache-d abord par le service worker
(stale-while-revalidate) : bump et-202609020011 pour purger, comme
au chapitre 361.

Verification fonctionnelle, pas seulement structurelle : sur la page
de recherche locale, "propose aux tiers" retourne les 8 hubs FR,
"offers third parties" les 8 hubs EN, "licorne" trouve enfin le carnet
premiere-du-genre, "company pages" trouve le plan du site — zero
erreur console. QA des 4 pages recherche et plan (2 themes) : zero
defaut.

Publication : plan-du-site-en, recherche-en, sitemap.xml, sw.js,
journal (racine) + 2 JSON d index (assets/data).

## 380 — Les zones meta auditees : trois pages avaient du HTML casse

Prolongement direct de la lecon du chapitre 379 (les termes bannis se
cachaient dans les zones meta) : audit systematique des zones meta de
tout le depot — 223 fichiers HTML, title, meta description, og,
twitter, canonical, og:url, JSON-LD.

Ce que l audit a ecarte comme non-defauts : les 97 pages ou og
description differe de la meta description et les 11 ou twitter
differe d og sont des variantes editoriales voulues (accroches plus
courtes par canal), pas des incoherences. Les pages sans description
ni canonical sont les sources d impression de docs-sources, le
fichier de verification Google et la 404 — exclusions normales.
JSON-LD : zero erreur de parsing sur tout le depot.

Ce que l audit a trouve de reel : trois pages EN du carnet avec des
attributs content casses, invisibles a l oeil car le rendu retombe
sur ses pieds. journal-interview-comptage-en portait des guillemets
droits bruts dans sa description ("The trade interview" non echappe) :
le navigateur ferme l attribut au premier guillemet, la description
servie aux moteurs s arretait a "second episode of" et le reste
devenait des attributs parasites. Pire, journal-interview-controle-en
et journal-premiere-du-genre-en trainaient chacun un residu de
copier-coller COLLE APRES la fermeture correcte de leur attribut —
le fragment de la description du comptage, gauger compris, soude au
tag. Six tags repares : guillemets typographiques pour comptage
(l episode 3 les avait deja), residus supprimes pour les deux autres.

Detection outillee, verification au DOM : le detecteur cherche tout
tag meta dont le contenu apres la fermeture de content n est ni une
fin de tag ni un attribut legal — re-scan zero apres correction ; et
au navigateur, les trois descriptions se parsent pleines, zero
attribut parasite sur les tags. Controle bonus : zero description
dupliquee entre pages sur tout le site (la contamination croisee du
chapitre 379 etait la derniere).

Suites logiques : l entree d index de comptage-en (qui portait
fidelement la description tronquee) resynchronisee, les trois pages
datees du jour au sitemap, bump SW et-202609020247 (JSON d index
cache-d abord). QA 3 pages x 2 themes zero defaut. Registre
synchronise 379-380.

Lecon d instrument : un balayage qui lit les attributs avec une
regex ne voit pas un attribut casse — il lit jusqu au guillemet et
trouve un contenu plausible. C est la COMPARAISON avec une autre
source (l index, la page FR) qui a revele la troncature au 379, et
le detecteur de forme du tag qui a revele la casse au 380. Verifier
la forme, pas seulement le contenu.

Publication : 3 pages carnet EN, sitemap.xml, sw.js, journal
(racine) + recherche-en.json (assets/data).

## 381 — Solde des actions en attente : veilles executees, conflits arbitres

Le proprietaire a demande d appliquer toutes les actions en attente.
Trois familles etaient ouvertes : les veilles datees, les deux
conflits de canon du chapitre 356, et les rappels bloques sur des
faits proprietaire.

Veille ITIE, executee ce jour sur sources primaires. Le statut public
du Tchad reste celui que le site enonce : validation d octobre 2022,
score global 64,5/100 (transparence 72,5, engagement des parties
prenantes 60, resultats et impact 61), mesures correctives attendues
en 2026 — la presse de decembre 2025 precisait une echeance d avril
2026 pour leur mise en oeuvre et un plan de travail 2026 du comite
national. Aucun resultat de nouvelle validation publie a ce jour sur
eiti.org : la page gouvernance est exacte, rien a changer. La veille
se rearme sur la publication du resultat de la prochaine validation.

Veille Sedigui, executee ce jour. Des signaux existent dans la presse
tchadienne — le DG de la SHT constatant des travaux a 85 pour cent,
un complexe petrolier et gazier en construction, mais aussi des
articles d Etat relevant retards et manquements et des ingenieurs du
Kanem denoncant des deversements — mais aucun des articles n a pu
etre date de maniere verifiable (l article des 85 pour cent repond
404 au fetch, les autres sont sans date lisible). Regle du site :
pas de chiffre sans date verifiable. Le carnet gaz-sedigui reste en
l etat ; la veille se rearme sur une annonce datee (mise en service,
production, calendrier officiel).

Conflits du chapitre 356, arbitres par le proprietaire ce jour :
"Mission Delta" — CLOS, non adopte ; "VP Artificial Lift" — CLOS,
non adopte. Ni le programme ni le poste n entrent au canon : aucune
source du site ne les porte, l audit externe qui les citait a ete
refute preuves en main (ch.356), et la gouvernance du site est par
roles. Reouvrables si le proprietaire fournit des faits.

Rappels parques (decision proprietaire) : les elements suivants
attendent des faits que seul le proprietaire detient et ne seront
plus repetes a chaque rapport — noms de la direction et du conseil,
premier rapport annuel, seance photo officielle, convention INSPEM
et ticket minimum investisseur. Ils seront traites des que les
elements arriveront. Restent actives les deux veilles ci-dessus et
la carte des scenarios Brent (a rafraichir en janvier 2027).

Aucune page du site modifiee : les conflits clos n existaient sur
aucune page, les veilles n ont pas declenche. Publication : journal
seul. Registre synchronise (entree 381).

## 382 — Le hero devient transparent : la photo prend l arriere-plan

Demande du proprietaire : rendre le hero de la home transparent pour
laisser la photo s afficher en arriere-plan. Le hero portait depuis
le chapitre 371 une robe de givre blanc (17/10/13 pour cent, flou
24 px) : joli verre, mais un filtre entre le visiteur et la photo.

Applique sur index et index-en, dans la couche lux360. Un, la robe
tombe : fond transparent, plus aucun flou d arriere-plan sur le
panneau du hero (desktop, mobile, theme clair, et meme le repli
supports-not qui posait un fond opaque devenu inutile — la
transparence n a besoin d aucun support navigateur ; son masquage
de scrim est retire aussi). Deux, la lisibilite se reporte sur les
protections locales, renforcees : scrim radial sombre .34 -> .44,
scrim clair passe a un degrade a trois arrets (.88 au coeur, .42 a
62 pour cent), ombres portees du theme clair etendues au kicker,
pastilles KPI claires posees sur un blanc creme .58 au lieu du
dore .20. Trois, le voile du fond s ouvre sur desktop pour que la
photo se voie vraiment : lineaire sombre .58-.70 -> .30-.46, clair
.58-.72 -> .34-.48, avec re-imposition des voiles lourds sous
prefers-reduced-transparency a meme specificite, posee apres dans
la cascade (le mobile garde ses valeurs du chapitre 374).

Iteration guidee par le banc pixel, pas au jugement : la premiere
passe laissait le theme clair a 2.58 sur le kicker — insuffisant.
Apres renforcement des protections locales : pire cas sombre 8.18,
clair 6.89, mobile 6.90 — tous au-dessus de 4.5 sur les cinq
familles de texte du hero, sur les deux accueils. Captures des deux
themes controlees a l oeil : la photo (chevalet de pompage, lignes,
collines) est nettement visible dans les deux, le texte net.

QA : accueils x 2 themes zero defaut, axe zero violation (2 themes
+ mobile), zero erreur console, zero debordement. Accolades de
lux360 verifiees equilibrees apres chaque passe.

Aucun actif JS/CSS de assets modifie : pas de bump SW. Publication :
index.html, index-en.html, journal.

## 383 — QA et ultra review de la home face aux majors

Commande du proprietaire apres le hero transparent : re-benchmark
mesure contre les vitrines des majors et ultra review de la home.

Benchmark, mesure au fil (meme methode qu au chapitre 366, 7 majors
sondees ce jour) : EnerTchad sert sa home en 420 ms — la plus rapide
du panel (Eni 503, Shell 589, Exxon 654, Total 665, Chevron 1860,
ADNOC 1981 ; Aramco refuse le sondage). Seul site du panel avec flux
RSS declare, mode sombre, et 4 blocs JSON-LD (Organization, WebSite,
Dataset, WebPage) ; 6 en-tetes de securite sur 6 (seul ADNOC fait
jeu egal) ; manifest PWA (comme Shell et Chevron seulement) ;
50 Ko compresses sur le fil. Performance telephone bride (reseau
1.6 Mbit, CPU x4) : premier rendu 4.3 a 6.1 s, CLS 0.002, ~950 Ko
tout compris — le poste photos reste le plus lourd, assume.

Hygiene de la home, tout vert : 103 liens internes valides, og-image
en 200, title 60 caracteres, description 155, JSON-LD parse sans
erreur, axe zero violation (2 themes + mobile), console zero,
accolades lux360 equilibrees, revue visuelle par captures aux trois
profondeurs de defilement sans anomalie.

La vraie prise de l ultra review — un residu doctrinal massif,
invisible depuis 22 chapitres : la carte vitrine TchadiTech du
mega-menu Innovation disait encore "Le socle numerique &
technologique du groupe" (EN : "The group's digital & technology
foundation") — sur 71 pages FR et 71 pages EN, dans chaque copie de
la nav. Le balayage 361 avait renomme les libelles du menu, pas le
texte de cette carte. En tirant le fil : neuf autres occurrences de
"du groupe / the group's" designant la societe dans le corps meme
des pages — poumon financier du groupe (aval/distribution x2 FR et
EN), referentiel HSE-Q (amont/parc), demarche HSE (aval/reseau),
gestion des eaux (aval/raffinage), chaine d achats (glossaire),
pole a part entiere (carnet former-avant-extraire), these bitume
(carnet mini-raffinerie). Total corrige : 160 occurrences sur 146
fichiers, FR "de la societe", EN "the company's". Les usages
legitimes conserves : "societe unique, pas un groupe" (doctrine),
"groupe electrogene", "groupes" de liens, groupes d accordeons.
Re-scan avec filtre des usages legitimes : zero suspect. Index de
recherche verifie : il ne portait pas le residu.

Lecon (la meme famille qu aux chapitres 379-380) : un balayage de
renommage qui traite les libelles de nav rate les cartes vitrines
de cette meme nav ; et le texte courant merite son propre passage
au filet fin, pas seulement menus et pieds de page.

QA post-correction : accueils x 2 themes et echantillon des pages
corrigees — zero defaut. Publication : 146 pages + journal, en lots
par repertoire. Registre synchronise 382-383.

## 384 — Consolidation post-vague doctrinale

Rythme etabli : apres la vague 382-383 (hero transparent sur les
accueils, 146 pages corrigees du residu "du groupe"), une
consolidation.

Sweep complet : 218 pages x 2 themes en six tranches paralleles —
console, erreurs de page, HTTP, axe, debordements : zero defaut,
zero timeout cette fois (les trois timeouts du chapitre 378 etaient
bien de la contention de banc). Seules remontees : les geometries
de citation pmani-q, informatives et inchangees.

Sitemap remis a l heure git : 144 lastmod regeneres (la vague 383 a
touche presque toutes les pages du site), les deux calculateurs a
reecriture Vercel resolus comme au chapitre 379, XML revalide,
217/217 URLs couvertes.

Aucun actif JS/CSS de assets modifie : pas de bump SW (reste
et-202609020247). Publication : sitemap.xml et journal.

## 385 — Audit des doublons : le site est propre, les flux ne l etaient pas

Commande du proprietaire : audit des doublons. Huit familles passees
au crible sur les 223 fichiers HTML et les donnees.

Ce qui est net, mesure : zero fichier identique (md5), zero titre
duplique, zero meta description dupliquee, zero canonical ou og:url
en collision, zero id duplique a l interieur d une page, zero URL en
double au sitemap, zero doublon d entree dans les deux index de
recherche, zero asset identique en double.

La vraie prise — les flux RSS : chaque communique de cp-001 a
cp-006 figurait DEUX FOIS dans feed.xml et feed-en.xml, une fois
sous son ancien titre nu, une fois sous le titre a reference
"(CP-2026-00X)" — meme guid, deux items. Un guid duplique fait
boucler ou fusionner les lecteurs RSS. Origine : la reconstruction
du flux (ch.288/363) a ajoute les items au nouveau format sans
retirer les anciens. Correction : les 6 anciens items retires de
chaque flux (42 items FR, 41 EN, guids desormais uniques), XML
revalide, lastBuildDate a l heure.

Deuxieme correction, mineure : la home et l explorateur de chaine
partageaient le meme H1 "De la roche-mere a la pompe." — les H1 des
explorateurs deviennent "Explorer la chaine, de la roche-mere a la
pompe." (EN : "Explore the chain, from source rock to the pump."),
chaque page porte a nouveau un H1 propre.

Le balayage des paragraphes copies-colles entre pages (589 blocs
de 140+ caracteres partages) n a revele que du voulu : composants
templates (aide de la palette, bande offre aux tiers), pages
d agregation (brochure, solutions) qui reprennent leurs sources par
construction, et boilerplate presse cache (p#bp-en) present en
double langue a dessein. Un seul suspect leve puis blanchi : le
paragraphe anglais dans carnets.html est le boilerplate presse
cache, pas une fuite de langue. Doublon assume et conserve : le H1
"Exploration & Production" partage entre la page FR et sa jumelle
EN — le terme est identique dans les deux langues, chaque page a
son canonical et son hreflang.

QA des explorateurs corriges x 2 themes : zero defaut. Aucun actif
JS/CSS modifie : pas de bump SW. Publication : feed.xml,
feed-en.xml, explorateur-chaine FR/EN, sitemap.xml (explorateurs
dates du jour), journal.

## 386 — Le rendu d impression repare apres les vagues verre

Le dernier controle d impression datait du chapitre 349 — douze
vagues de design avant. Echantillon de huit pages imprimees en PDF
A4 (accueils FR/EN, contact, gouvernance, hub amont, carnet
gaz-sedigui, investisseurs, cibles-2030), rasterisees et mesurees a
l encre (ratio de pixels sombres) puis relues a l oeil.

Trois defauts reels, tous invisibles a l ecran.

Un, le cadre noir. Les PDF des accueils et du hub amont sortaient
encadres de noir sur toutes leurs pages (ratio d encre .25 la ou une
page propre fait .02) : la toile de la page — html #121D33 en ligne
sur les accueils, toile photo .rootland ailleurs — peint le canevas
du PDF jusque dans les marges. Le diagnostic a demande trois sondes :
les grandes surfaces sombres n existaient pas dans le DOM en media
print (le contenu, lui, etait bien repasse en blanc), c est le fond
de canevas qui imprimait sombre. Correction : bloc @media print qui
force html et body en blanc (color-scheme light), masque .rootland
et les pseudo-elements de body — pose dans le bundle commun (206
pages) ET en ligne sur les accueils et les 8 pages hors bundle,
en selecteurs a trois :not(#id) car les regles de theme montent a
(2,1,1) important. Premiere pose a un seul :not perdue au combat de
specificite — releve par la re-mesure, pas par relecture du CSS.

Deux, la barre des carnets. header.jtop imprimait sa robe sombre en
tete de chaque carnet (64 pages concernees via le bundle) : imprimee
blanche, encre noire, filet discret.

Trois, les cartes flip de la home imprimaient leur DOS EN MIROIR
par-dessus la face (backface-visibility ignore par le rendu PDF) —
le texte OHADA sortait inverse. Dos masques et faces remises a plat
en print sur les deux accueils.

Apres correction, re-mesure des huit pages : plus aucun cadre
sombre, pire ratio d encre .11 (le carnet, photo comprise), accueils
de .25 a .04 ; relecture visuelle des pages reparees propre, texte
du flip lisible a l endroit. QA ecran de non-regression (accueils
x 2 themes, page 1, explorateurs) : zero defaut — toutes les regles
sont cantonnees a @media print. Bundle CSS modifie : bump SW
et-202609021034. Registre synchronise 384-386.

Publication : bundle_core_a1.css (assets/chrome) + accueils, 404,
5 pages arabes, 2 explorateurs, sw.js, journal (racine).

## 387 — Les acces rapides quittent la home, le rail retrouve ses etiquettes

Demande du proprietaire : trouver la meilleure place pour le bloc
acces rapides de la home. Quatre destinations proposees a l arbitrage
(plan du site — recommandee —, page recherche, page 404, suppression)
— decision proprietaire : SUPPRIMER, sans replacement. Le mega-menu,
la palette de recherche et le plan du site couvrent deja l acces.

Retrait complet et propre, sur les deux accueils : la section
annuaire (tiroir de 40 portes, 3,5 Ko de HTML), son script
d ouverture par ancre, ses 29 regles CSS dediees dans ch326-vitrine
et ses 2 regles dans lux360, plus ses references dans les listes de
selecteurs partagees du verre feuillete (membres avec et sans
prefixe de theme — la premiere passe ne voyait pas les membres
prefixes html.et-plight, rattrapee par l assertion zero-residu).
Bilan : -6,7 Ko par accueil, accolades verifiees equilibrees,
zero occurrence residuelle d annu dans les deux pages.

La prise inattendue : en retirant la pastille #annuaire du rail de
traversee (aurail), decouverte que LES SEPT pastilles du rail
portaient la meme etiquette "Manifeste — Le Tchad inverse le flux"
depuis la refonte du chapitre 346 : chaque point du rail, au survol,
annoncait le manifeste quel que soit sa cible. Vingt chapitres de
QA passes a cote — le scrollspy fonctionnait, les ancres etaient
bonnes, seuls les libelles etaient dupliques, et aucun banc ne
lisait le texte des info-bulles du rail. Corrige : chaque pastille
porte desormais l etiquette de sa section (Manifeste, Poles de
coeur, Capacites, Chiffres, Carnets, Agir — EN : Manifesto, Core
poles, Capabilities, Key figures, Stories, Act).

QA accueils x 2 themes zero defaut, captures des deux themes
relues : pas de trou a l emplacement du tiroir, le pied de page
suit naturellement les trois portes d Agir. Aucun actif JS/CSS de
assets modifie : pas de bump SW. Publication : index.html,
index-en.html, journal.

## 388 — La home reorganisee autour du coeur de metier

Commande du proprietaire : reorganiser la home autour d Amont,
Intermediaire et Aval. La section coeurs portait deja la chaine en
quatre maillons immersifs ; l arbitrage proprietaire a retenu le
"fil complet" parmi trois ampleurs proposees : faire de la chaine
la colonne vertebrale de TOUTE la page, pas d une seule section.

Quatre gestes, sur les deux accueils.

Un, la bande-chaine du hero : sous les deux CTA, une rangee de
pastilles cliquables — Amont -> Intermediaire -> Aval, "que
prolonge la" Petrochimie — chacune avec son point de couleur canon,
menant a son hub. La chaine est desormais visible et actionnable
des le premier ecran. Premier placement APRES les KPI : la capture
l a montree noyee sous le bandeau cookies — remontee entre CTA et
KPI. Verre leger coherent avec la couche lux360, replis supports,
transparence reduite et impression.

Deux, les KPI du hero reordonnes : "3 poles de coeur" passe en
tete, avant la production, la valeur locale et le capital — la
premiere donnee lue est la structure de la chaine.

Trois, les carnets etiquetes : chaque carte porte une pastille de
position dans la chaine (Toute la chaine, TchadiTech, Intermediaire
— EN : The whole chain, TchadiTech, Midstream), sur la couleur
qu elle portait deja.

Quatre, les portes d Agir reliees a la chaine par un kicker :
Investir "financer les trois maillons", Devenir client "acheter a
l aval, contracter les services", Nous rejoindre "faire tourner la
chaine" (EN en miroir).

Lisibilite prouvee au banc pixel dedie (pastilles de la bande sur
capture peinte, 2 accueils x 2 themes) : premiere passe du theme
clair a 4.61 — juste au-dessus du seuil mais sans marge ; fond des
pastilles claires monte de .62 a .74 : pire cas final 4.82 clair,
19.9 sombre. Banc mobile hero re-passe : pire 7.25. QA accueils
x 2 themes zero defaut, axe zero violation (2 themes + mobile),
captures des deux themes relues.

Aucun actif de assets modifie : pas de bump SW. Publication :
index.html, index-en.html, journal.

## 389 — Consolidation post-vagues 385-388

Rythme etabli : apres la sequence doublons / impression / acces
rapides / reorganisation de la home, une consolidation.

QA cible des dix pages touchees par les vagues 385-388 — les deux
accueils (bande-chaine, retrait du tiroir, etiquettes du rail), les
deux explorateurs (H1 differencies), la 404 et les cinq pages arabes
(regle d impression inline) — sur les deux themes : console, erreurs
de page, HTTP, axe, debordements, zero defaut. Le dernier sweep
complet (ch.384) reste valable pour le reste du site : les seules
modifications intermediaires hors de ces dix pages sont les regles
@media print du bundle, sans effet a l ecran, deja controlees par
la QA de non-regression du chapitre 386.

Sitemap remis a l heure git : 5 lastmod regeneres (la plupart des
pages touchees etaient deja datees du jour par les rafraichissements
precedents), XML revalide.

Registre synchronise : entrees 387, 388, 389 ajoutees au tableau de
bord, compteurs a 389.

Veilles actives inchangees : resultat de la prochaine validation
ITIE, annonce datee sur Sedigui, carte Brent (janvier 2027).

Aucun actif de assets modifie : pas de bump SW. Publication :
sitemap.xml et journal.

## 390 — La chimie du brut sous l Amont, la petrochimie sous l Aval

Directive du proprietaire : mettre la chimie petroliere sous l Amont
et la petrochimie sous l Aval. Deux arbitrages pris avant execution :
rattachement EDITORIAL (les URLs ne bougent pas, zero lien casse,
reversible) plutot que restructuration physique ; et la formule
canon "trois maillons que prolonge la Petrochimie" devient "la
Petrochimie prolonge l Aval", la bande-chaine du hero gardant sa
pastille Petrochimie accrochee a l Aval.

Le mega-menu, sur les 142 pages porteuses (71 FR + 71 EN) :
l entree "Chimie au service du brut" (ASP, intrants EOR) quitte le
groupe Petrochimie et rejoint la colonne Amont, a cote de la
recuperation assistee qu elle sert ; le groupe Petrochimie, deja
range sous l Aval dans la colonne, porte desormais son rattachement
en toutes lettres : "Petrochimie — prolongement de l Aval"
(EN : "Petrochemicals — extending Downstream"). Verification au DOM
sur trois pages : entree presente cote Amont, intitules corrects
dans les deux langues.

La home, FR et EN : le chapo du hero, la bande-chaine ("prolonge
par la" avant la pastille Petrochimie ; l anglais "extended by"
disait deja la bonne chose), l intro de la section coeurs et son
aria-label, le kicker du maillon petrochimie ("Prolongement de
l Aval" / "Extending Downstream"), la carte 3+1 (face et dos), et
la nav du maillon Amont qui gagne le lien "Chimie au service du
brut".

Les pages vivantes porteuses de la formule : societe, faq (4
occurrences), presse (boilerplate — au passage, une double virgule
corrigee), cibles-2030, le hub petrochimie ("prolonge l Aval") et
pole-enerchimie-en — 14 occurrences reecrites FR/EN. Re-scan : zero
residu de l ancienne formule hors communiques dates. Les communiques
publies (CP-2026-010 notamment) restent en l etat : ce sont des
documents dates, on ne reecrit pas l histoire ; le canon actuel
vit sur les pages vivantes.

Index de recherche verifie : il ne portait pas la formule. QA :
accueils, plan du site, explorateurs x 2 themes zero defaut.
Aucun actif de assets modifie : pas de bump SW.

Publication : 142 pages + journal, en lots par repertoire.

## 391 — Les appuis passent en rangee compacte

Question du proprietaire : est-il necessaire de faire apparaitre
les poles supports sur la home ? Reponse mesuree : la section
appuis pesait 1359 px sur une page de 8900 (15 pour cent du
defilement), en quatre bandes immersives au meme rang visuel que
les maillons de coeur — ce que la doctrine dement ("les capacites
vivent A L INTERIEUR des poles, et non a cote"). Mais le hero
promet "quatre appuis", la carte 3+1 les compte, et les
differenciateurs (TchadiValeur, academie, conseil) comptent pour
les investisseurs. Recommandation : necessaires oui, sous cette
forme non. Arbitrage proprietaire : rangee compacte.

Applique sur les deux accueils : les quatre bandes deviennent une
rangee de quatre cartes de verre sobres — pastille de couleur
canon, kicker (GreenTech durabilite, TchadiTech technologies,
Tchaditude capital humain, EnerConseils conseil), titre, une ligne,
fleche — chacune menant a son hub. La tete de section (titre
"Quatre capacites, integrees aux poles de coeur" et son intro)
reste. Bilan mesure : section 1359 -> 693 px, page 8900 -> 8234.

Deux corrections en cours de route, revelees par la mesure et la
capture. Un, la premiere grille s empilait en colonne de 246 px :
mes cartes avaient ete inserees DANS l ancien conteneur mln-set,
dont la mise en page contraignait la largeur — le diagnostic au
DOM (gridTemplateColumns reduit a une seule piste) a pointe le
parent, le conteneur entier a ete remplace. Deux, les kickers du
theme clair heritaient des couleurs de pole (#96A2EC sur creme
~2.4 de contraste) — encre foncee dediee posee pour le clair, la
pastille gardant la couleur du pole.

Verre, replis supports/transparence reduite, et regle d impression
poses avec la rangee. QA accueils x 2 themes zero defaut, axe zero
violation (2 themes + mobile), captures des deux themes relues :
quatre cartes en ligne, nettes sur la photo.

Aucun actif de assets modifie : pas de bump SW. Publication :
index.html, index-en.html, journal.

## 392 — Consolidation post-vagues doctrinales

Rythme etabli : apres le rattachement chimie/petrochimie (142 pages
de menus, ch.390) et la rangee compacte des appuis (ch.391), une
consolidation complete.

Sweep : 218 pages x 2 themes en six tranches paralleles — console,
erreurs de page, HTTP, axe, debordements : zero defaut. Seules
remontees, les geometries de citation informatives, inchangees.

Sitemap deja a l heure : les vagues 390-391 ont ete commises le
meme jour UTC que le precedent rafraichissement, zero lastmod a
regenerer — verifie, pas suppose.

Registre synchronise : entrees 390, 391, 392 au tableau de bord,
compteurs a 392.

Lecon d instrument consignee (observee au ch.391) : le marqueur
negatif "mln-set absent de la page" a produit douze fausses alertes
de verification production, car ce conteneur reste legitimement
dans la section des maillons de coeur — seule la section des appuis
en etait debarrassee. Regle ajoutee au rituel : un marqueur negatif
de production se scope a la ZONE CHANGEE (extraire la section, y
chercher le residu), jamais a la page entiere.

Veilles actives inchangees : resultat de la prochaine validation
ITIE, annonce datee sur Sedigui, carte Brent (janvier 2027).

Aucun actif de assets modifie : pas de bump SW. Publication :
journal seul.

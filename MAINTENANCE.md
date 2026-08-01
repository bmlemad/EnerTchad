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

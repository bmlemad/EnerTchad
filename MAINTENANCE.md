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

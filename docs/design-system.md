# EnerTchad — référentiel visuel v1

Ce référentiel relie l’accueil, les activités, l’espace clients et les pages
éditoriales. Source des règles : `assets/chrome/design-system.css`. Leur insertion
au premier affichage est assurée par `lib/design-system.js`, avant les styles
historiques. Les sous-sites héritent du même contrat lors de leur génération.

## Règles communes

| Élément | Règle | Usage |
| --- | --- | --- |
| Texte clair | Encre #0a1a2f, secondaire #4b5870 | Cartes et formulaires sur fond blanc |
| Texte sombre | Encre #f1f3f6, secondaire #b5c0d0 | Cartes sur fond #172536 |
| Accent | Or #80611e en clair, #e0bd70 en sombre | Focus et repères ; pas de texte doré pâle sur blanc |
| Titres de pages | 34 à 58 px, graisse 600, interligne 1,12 | Activités et espace clients |
| Titre d’accueil | 40 à 80 px, interligne 1,05 | Introduction institutionnelle |
| Titres de sections | 26 à 36 px, interligne 1,2 | Sections comparables des modèles de référence |
| Arabe | Noto Sans Arabic, espacement naturel, interligne 1,5 | Préserver la lecture RTL |
| Lecture | Interligne 1,7 | Texte courant des introductions et blocs éditoriaux |
| Conteneur | 1 240 px au maximum | Alignements éditoriaux ; cartes et applications gardent leur propre espace |
| Sections | 48 à 80 px ; 40 px sur mobile | Sections compactes et offres clients |
| Cartes | Arrondi 16 px, ombre légère, sans flou | Offres, fiches, informations utiles |
| Cartes sur photo | Verre de contenu : teinte 58 %, flou 18 px, filet 1 px ; sous 760 px, teinte 88 % sans flou ; opaque 96 % si transparence réduite | Seulement dans une scène à photo de fond (`.im-scene .im-glass`, lot 112) |
| Contrôles | Arêtes vives (rayon 0) ; hauteur d’action 48 px | Boutons et champs de contact (direction éditoriale, 11 novembre 2026) |
| Groupes d’actions | Écart 12 px, retour à la ligne | Éviter les boutons coupés sur mobile |
| Focus | Contour visible 3 px, écart 4 px | Liens, boutons, champs, résumés, curseurs |

## Direction éditoriale (décision du DG, 10 novembre 2026)

Elle remplace la direction immersive du lot 112 sur l’accueil et fixe l’allure des titres, de la barre de
navigation et du pied de page sur le reste du site.

| Élément | Règle | Source |
| --- | --- | --- |
| Accueil | Bandes pleines alternées : papier #FAF8F3, le crème des pages intérieures depuis le 21 novembre 2026 (papier nuit #101B2E en thème sombre) et encre #0A1220 ; plus de photo de fond ni de carte en verre dans « Quatre maillons » et « Direction et gouvernance » ; filets 1 px | `immersif-2026.css`, bloc « direction éditoriale » |
| Titres | Instrument Serif, graisse 400 : `h1` et `h2` du gabarit `.ppl` (hors `.pp-k`), titres de l’accueil ; pages arabes : Noto Sans Arabic, graisse 600, échelle antérieure | `design-system.css` (`--et-ui-display`, `--et-ui-h1`, `--et-ui-h2`, `--et-ui-heading-weight`) ; accueil : `immersif-2026.css` |
| Actions | Arêtes vives ; action principale des héros en or #E3BC62 sur encre #0A1220 | `design-system.css` (`--et-ui-control-radius`, `--et-ui-accent`, `--et-ui-accent-text`) |
| Barre de navigation | Rubriques à plat, sans pilule, à partir de 1241 px ; rubrique survolée ou ouverte soulignée, rubrique courante soulignée d’un filet or ; halo de focus clavier d’origine conservé ; tiroir mobile inchangé | `premium-chrome.css`, règles d’origine de `@layer verre` réécrites sur place (plus de surcharge) |
| Pied de page | Devise en grand serif (hors pages arabes), colonnes à plat sur filets | `premium-chrome.css` |

Titres et actions sont des composants du contrat (`@layer et-design-system`) : les gabarits ne les surchargent plus.
L’accueil et le pied de page restent écrits dans `@layer et-verre`, première couche déclarée
des pages construites, en attendant d’entrer à leur tour dans le contrat. Le verre de
contenu reste la règle des scènes des pôles (`.im-scene .im-glass` hors accueil).

## Hiérarchie et états

Un bouton principal sert l’action de la section. Les liens secondaires conservent
un traitement plus discret et un libellé explicite. Les cartes de lecture utilisent
des fonds solides. Le verre reste réservé aux surfaces de navigation déjà gérées
par `verre-2026.css`, dont le repli sans transparence est conservé, et, depuis le lot 112
(choix du DG, 10 novembre 2026), aux cartes posées sur une photo de fond (`immersif-2026.css`) :
une carte de lecture sur fond uni garde un fond solide. L’immersif s’applique aux scènes « conviction » des 16 pages d’entrée
des pôles (lot 113) et, depuis le lot 122 (12 novembre 2026, pilote), à la scène « Ce que nous mettons en œuvre » de dix
pages sous `/amont` puis, au lot 123, à une section choisie de chacune des douze autres (activités, EOR, parc, méthane et torchage, services E&P, titulaire de droits pétroliers ; `lib/immersif-amont.js`) puis, au lot 130 (phase C), à une section choisie de treize pages sous `/aval`, `/petrochimie`, `/intermediaire` et `/tchaditech`, en FR et en EN (table `PICK_130` : mêmes sections dans les deux langues, texte inchangé, photo déjà publiée et différente du héros ; `aval/boutique` et `aval/commercialisation` restent sans scène) ; puis, au lot 133 (phase C, première série de pages racine), à une section choisie de neuf pages narratives — société, engagements, innovation, projets, carrières, communautés, cibles 2030, savoirs, achats —, en FR et en EN (table `PICK_133`, mêmes règles ; pages juridiques, formulaires, articles du journal et pages arabes exclus, ce que le contrat vérifie) , puis, au lot 134 (phase C, espace Clients), à la section « Comment vous situer avant de nous écrire » de la page Clients, en FR et en EN (table `PICK_134`, copie `/boutique/clients` comprise) ; l’Atlas (cartes, estimateur, tableaux de données) et la Boutique (catalogue et demande de devis) restent sans scène, car ce sont des pages d’outils ; une section rangée dans un repli fermé ne peut pas porter de scène, et le contrat exige une scène visible d’au moins 200 px; les autres pages du gabarit de pôle n’en ont pas. Dans ces scènes, tout texte (étiquettes, `summary`, légendes, texte de schéma) prend l’encre claire de la carte ; le contrat `qa/immersif-phase-c-contract.spec.js` refuse tout texte sombre restant. Aucun flou n’est
ajouté aux blocs de texte. Les animations des composants harmonisés sont supprimées
si le visiteur demande une réduction des mouvements. Les couleurs système restent
disponibles en contraste forcé.

Les photographies de couverture conservent leur cadrage adaptatif. Le choix de
nouvelles photographies doit être validé sur des documents dont les droits et le
lien avec l’activité sont établis ; ce lot ne change pas les images éditoriales.

## Extension et validation

Réutiliser les variables `--et-ui-*` pour les nouveaux composants ; éviter de
recréer une échelle d’arrondis ou d’ombres par page. Les règles ciblent les composants
éditoriaux connus plutôt que tous les `h1`, `section` ou `button`, afin de préserver
les tableaux, les cartes, les petits libellés et les outils intégrés.

La couche nommée résout les conflits des anciens styles sans augmenter la
spécificité des sélecteurs. Les styles restent en ligne pour préserver les jeux
CSS critiques existants et éviter une requête bloquante supplémentaire. Les règles
marquées importantes ne concernent que les propriétés déjà verrouillées par les
modèles historiques. La migration vers les variables communes peut ensuite retirer
ces anciens verrouillages composant par composant.

Contrôler les modèles de référence en français, anglais et arabe, en clair et en
sombre, sur petit écran et ordinateur : hiérarchie, contraste, débordements, focus,
navigation et formulaires sans envoi. Les captures de validation accompagnent la PR.

## Accueil en six blocs (12 novembre 2026)

Décision du DG : sous le héros, l’accueil FR/EN ne garde que six blocs — vision, activités, impact, leadership,
investisseurs, contact — en bandes papier et encre alternées (`home-2026.css`, bloc « Six blocs », sélecteurs `section#…`).
Les repères, le projet phare, le tableau « Cadre · état publié » et la bande « Dernière publication » ne sont plus sur
l’accueil : la bande est sous le héros du Centre de connaissances (`/savoirs`), qui gagne quatre entrées — gouvernance,
investisseurs, conformité, HSE & durabilité — vers des pages et ancres déjà publiées. L’impact de l’accueil est une liste
(`.hm-impact`), pas des cartes `.hm-card` : le rayon de 16 px du contrat partagé ne s’y applique donc pas.

## En-tête minimaliste (lot 124, 14 novembre 2026)

L’en-tête principal (`#nav`, 267 pages françaises et anglaises) se limite au logo, au slogan « L’énergie du Tchad. Intégrée. », à cinq liens simples (Vision, Activités, Impact, Investisseurs, Contact) et au bouton « Investisseurs » ; la barre d’outils garde les langues et la recherche. Sa définition vit dans la clé `header` de `assets/data/navigation.json` (posée par `lib/main-nav.js`) ; les six menus complets restent dans le même fichier pour le pied de page et le repérage. Gouvernance, Publications, Atlas, FAQ, Carrières et Communiqués passent dans la rangée « Ressources » du pied de page (`lib/navigation-review.js`). L’en-tête arabe suit la même logique depuis le lot 125 (`lib/ar-nav.js`) : cinq liens simples (الرئيسية، الرؤية، الأنشطة، المستثمرون، اتصل بنا), sans lien de recherche dans la barre (il reste dans le pied de page) ; il n’y a pas d’« Impact » en arabe, aucune page d’engagements n’existant dans cette langue. Lot 143 (17 novembre 2026) : le pied de page arabe passe, comme le français, à deux colonnes (`data-et-footer-columns="2"`, `lib/navigation-review.js` ; règle de grille dans `ar-nav.css`) : la colonne qui répétait l’en-tête est retirée, « بحث (FR) » rejoint la colonne d’informations, aucun autre lien n’est supprimé. L’en-tête arabe garde sa forme (81 px, liens en 19 px, bouton plein) : décision du DG de ne pas l’aligner sur le style français ; le slogan n’existant pas en arabe dans les sources, il n’est pas inventé. Lot 144 (17 novembre 2026) : le JSON-LD Organization des pages reprend le slogan de l’en-tête (`lib/structured-slogan.js`, lu dans la clé `header` de `assets/data/navigation.json`) au lieu de « Accès aux Énergies » / « Access to Energy » ; les titres de page ne changent pas.

### Bande d'outils supprimée (lot 127, 14 novembre 2026)

La bande d'outils au-dessus de l'en-tête (FR · EN, ع, Rechercher, bouton « Investisseurs ») n'existe plus à aucune largeur : avec cinq liens au lieu de six menus, la fusion du lot 102 tient dès 1 241 px (seuil ramené de 1 536 px dans `allege-2026.css` et `nav_a.js`), les liens de langue et le bouton rejoignent la droite de la barre principale, la recherche reste l'icône de la barre. Sous 1 241 px, le tiroir mobile est inchangé. En passant : le « EN » de FR · EN reprend la couleur du lien (il était presque blanc sur fond clair en thème clair).

### Tiroir arabe : bouton « إبداء الاهتمام » (lot 128, 15 novembre 2026)

Le tiroir mobile arabe (sous 768 px, lot 108) reprend le bouton « إبداء الاهتمام » vers `/ar-investisseurs`, comme le tiroir français son bouton « Investisseurs » : une ligne entière sous les langues et le thème (`ar-nav.css`). La règle qui le cachait sous 900 px (`home-inline-ar-premium.css`) ne vaut plus que de 768 à 900 px ; au-dessus de 900 px, le bouton reste dans l'en-tête comme avant. Les trois jeux critiques arabes (`ar-home`, `ar-pole`, `ar-investisseurs`) sont ré-extraits pour ces deux feuilles.


### Repère d'ouverture du menu mobile commun (lot 131)

Demande du DG (16 novembre 2026) : un même repère d'ouverture et de fermeture sur le site principal, l'espace Clients et l'Atlas. Le bouton « Menu + » de `details.et-al-tog` (Atlas, Clients ; `scripts/next/subsites.mjs`, `assets/chrome/subsites.css`) et de `details.sp-mobile-menu` (`lib/strategic.jsx`, `assets/chrome/strategic-premium.css`) prend la forme du bouton `#navTog` du site principal : trois barres de 18 × 2 px dans un carré de 44 × 44 px, qui deviennent une croix à l'ouverture (transition coupée si le visiteur réduit les mouvements). Le nom accessible reste « Menu » (`aria-label`) ; Échap referme le menu. Contrat : `qa/menu-icon-contract.spec.js`.


### Replis mobiles des pages Amont et Contact (lot 132)

Choix du DG (16 novembre 2026, après relecture de la PR #159). Page Amont : sur mobile (≤ 760 px), les cinq cas d'usage et les cinq principes de la méthode se replient sous leur titre dans un `details[data-mobile-fold]` ; sur ordinateur ils restent ouverts, sans bouton, et sans JavaScript tout reste ouvert. Page Contact : « Contact rapide — choisissez votre sujet » devient un `details.ct-fold` replié sur tous les écrans (liens WhatsApp et e-mail conservés), et le bandeau est resserré sur mobile par des variables d'espacement (`--ct-pt`, `--ct-pb`). Mesures sur mobile : formulaire de Contact 3 610 → 2 747 px, page Amont 19 850 → 18 716 px. Source : `lib/visual-priorities.js` ; contrat : `qa/mobile-folds-contract.spec.js`.

### FAQ de la page Clients (lot 135)

La règle héritée `#reperes-clients,#faq-clients{max-width:1012px;margin:0 auto}` de `clients.html` et `clients-en.html` bornait la FAQ à 1012 px, collée à gauche, avec un bloc blanc à droite à 1440 px. `#faq-clients` n'y figure plus : la section prend la largeur de `<main>` et son contenu (`.pp-wrap`) s'aligne sur celui des sections voisines. Le contrat `qa/clients-faq-contract.spec.js` le vérifie à 390 et 1440 px, en FR et en EN, sur `/clients` et sur la copie `/boutique/clients` (il amène la FAQ à l'écran avant de mesurer, car `content-visibility:auto` laisse une section hors écran sans contenu mesurable).

## Navigation épurée : le Centre de connaissances comme index (16 novembre 2026)

Décision du DG : épurer la navigation sans supprimer de contenu. L’en-tête porte six liens simples — Vision, Activités,
Impact, Investisseurs, Contact, Centre de connaissances (clé `header` de `assets/data/navigation.json`). Le pied de page
reprend ces six liens, garde quatre accès par public (clients, fournisseurs, presse, carrières) et la colonne d’information ;
la rangée « Ressources » du lot 124 disparaît.

Rubrique active (17 novembre 2026, revue des menus) : la page d’une entrée porte `aria-current="page"` ;
une page secondaire marque l’entrée de sa rubrique avec `aria-current="true"`. Les deux reçoivent la classe `is-active`, que
`premium-chrome.css` habille du filet d’or de la direction éditoriale (les règles `[aria-current]` du lot 124 ne s’appliquaient pas :
elles sont hors couche `verre` et les règles `!important` de la couche `et-glass` les écrasent). La rubrique se déduit de
`navigation.json` (Entreprise → Vision, Engagements → Impact, Centre de connaissances → Centre, Investisseurs), sans table à tenir
à jour ; les carnets (`journal-…`) et les communiqués individuels relèvent du Centre. Jamais deux entrées marquées à la fois ; Projets,
qui n’a pas d’entrée d’en-tête, ne marque rien.

Le Centre (`/savoirs`, `/savoirs-en`) devient l’index de toutes les pages secondaires : ses sections de cartes restent, et
la section `#savoirs-index` (« Toutes les pages, rubrique par rubrique », composant `.pp-smgrid` du plan du site) liste
chaque pôle avec ses sous-pages, l’atlas, la société et les informations pratiques. Un champ de filtre
(`[data-savoirs-filter]`, script en ligne `savoirs-filter-js`) réduit cartes et entrées à la frappe, sans accent ni
casse ; sans résultat, il renvoie à la recherche du site. Sans JavaScript, le champ reste masqué et tout l’index s’affiche.

## Pages de pôle : le détail se replie (lot 136, 17 novembre 2026)

Décision du DG : alléger les quatre pages d’entrée de pôle (FR et EN) sans rien supprimer. Restent visibles le statut, le
métier, les offres, les enjeux, les projets et le contact. Le détail — offre détaillée, méthode, cas d’usage, chiffres,
capacités, référentiel d’expertise, documents — est regroupé avant le chapitre de contact sous « Le détail, rubrique par
rubrique » et chaque rubrique se replie sous son titre (`details.pp-dfold`, transformation d’export `lib/pole-folds.js`).

Chaque rubrique garde son identifiant : un lien d’ancre (sous-navigation, recherche, lien profond) l’ouvre et s’y place ;
l’impression ouvre tout ; sans JavaScript le repli natif fonctionne. Sur la page Amont, l’offre technique condensée au
lot 131 reste visible, et le repli mobile du lot 132 sur les cas et la méthode est remplacé par ce repli.

Lot 141 (17 novembre 2026) : la même règle s’applique aux quatre pôles de service, FR et EN, soit cinq rubriques repliées chacun :
GreenTech (`cas`, `hseq`, `impact`, `transition`, `patrimoine`), EnerConseils (`cas`, `conseil`, `audits`, `esg` ; « Ingénierie » reste ouverte, lot 142),
TchadiTech (`cas`, `socle`, `rd`, `innovations`, `recits`) et TchadiTude (`emplois-jeunesse`, `cas`, `academie`, `rayonnement`,
`partenariats`). Le bloc replié se place avant le chapitre `carnets-…` ou, sur TchadiTech qui n’en a pas, avant `offre-tiers`.

## Articles du journal : une scène par article (lot 138, 17 novembre 2026)

Phase C, articles du journal (33 en français, 33 en anglais). Un article est une colonne de lecture sans section pleine largeur :
`lib/immersif-journal.js` coupe la colonne (`div.jbody`) avant un intertitre et la rouvre après son passage, qui se pose dans la carte
de verre (`section.im-scene.im-journal`) sur une illustration de fond déjà publiée, texte clair, liens dorés. Le passage est déjà dans
l'article : aucun texte n'est ajouté ni retiré, les liens et identifiants sont conservés. Une seule scène par article ; le passage est
le dernier intertitre, au plus l'avant-dernier, dont le contenu ne comporte que des paragraphes, listes ou citations (ni chiffre clé,
tableau ni figure) et compte de 40 à 170 mots ; il est identique en français et en anglais. Illustration choisie par article
(table `PHOTOS`), jamais la planche. La page Carnets (index) n'est pas concernée. Contrats : `scripts/test_immersif_journal.mjs`
(66 pages) et `qa/immersif-journal-contract.spec.js` (390 et 1440 px, thèmes clair et sombre).

## Pages longues en blocs : la suite se replie (lot 137, 17 novembre 2026)

Décision du DG, dans la suite du lot 136 : sur Investisseurs et Services parapétroliers (FR et EN), chaque bloc
`.pp-block` garde son titre (colonne de gauche) et son premier paragraphe ; la suite de la colonne de texte se replie sous
« Lire la suite » (`details.pp-bfold`, transformation d’export `lib/block-folds.js`). Un bloc dont la suite fait moins de
soixante mots, ou sans titre, reste ouvert. Aucun texte n’est supprimé : un lien d’ancre vers le bloc ou vers un élément
replié l’ouvre, l’impression ouvre tout, le repli natif fonctionne sans JavaScript. Le style reprend l’accordéon existant de
`.pp-prose details`.

### Extension du repli des blocs (lot 140, 17 novembre 2026)

La règle du lot 137 s’applique aussi à Engagements, Société et Produits raffinés (FR et EN). Le seuil de mots est propre à chaque langue (58 en français, 53 en anglais) pour que les
deux versions d’un même bloc se replient ensemble ; un test le vérifie sur les dix pages. Clients n’est pas concerné
(déjà replié par section au lot 134), ni Réseau de stations, dont douze rubriques sont déjà repliées (`details.rsx-more`).

## Page Distribution : grille réparée (lot 142, 17 novembre 2026)

La section principale de `/aval/distribution` rangeait quatre conteneurs entiers comme quatre cartes d’une grille : tout le
détail tenait dans une colonne de 266 px, haute de près de 10 000 px. `lib/legacy-grids.js` rend à chaque conteneur toute la
largeur et aux listes de cartes leur grille (styles en ligne à l’export, aucun texte modifié). La section passe d’environ
10 100 à 5 100 px à 1440 px ; sur mobile la mise en page reste sur une colonne.

### Récupération assistée, même réparation (lot 143, 17 novembre 2026)

`/amont/eor` (FR et EN) rejoint `lib/legacy-grids.js`. La page ne raccourcit presque pas — ses quatre colonnes de 266 px étaient
remplies en parallèle — mais chaque chapitre se lit maintenant de haut en bas sur toute la largeur. Règles ajoutées : une
carte fait au moins 240 px de large (quatre par ligne à 1440 px), et une carte seule à côté de blocs pleine largeur prend la
ligne entière.

L’Espace Clients et l’Atlas, qui ont leur propre barre de navigation, reçoivent un lien « Centre de connaissances » dans la
colonne d’information de leur pied de page (lot 143) : c’est leur accès à Carrières et aux pages secondaires.

### Chapitres repliés sur Distribution et Récupération assistée (lot 146, 17 novembre 2026)

Une fois en pleine largeur, les chapitres de ces deux pages se replient sous leur titre et leur premier paragraphe
(« Afficher le détail », même composant `details.pp-bfold` que `lib/block-folds.js`). Deux formes sont reconnues : un bloc qui
porte son titre puis son détail, ou un bloc de titre suivi de blocs frères. Le premier chapitre de la section reste ouvert,
comme tout chapitre qui porte un lien d’action. Lien d’ancre, impression et navigation sans JavaScript : comme les autres replis.

### Produits raffinés et Réseau de stations (lot 147, 17 novembre 2026)

`lib/page-folds.js` applique le même repli « Afficher le détail » aux deux dernières pages longues du pôle. Produits raffinés :
les chapitres « GPL & gaz » et « Lubrifiants, bitumes & produits spéciaux » gardent leur titre et leurs repères chiffrés.
Réseau de stations : cinq encadrés de la section principale gardent leur titre et leur introduction ; schémas et tableaux se
replient avec le composant déjà présent sur cette page (`details.rsx-more`). L’en-tête de la section reste ouvert.

### Liens d’action et replis des pages de pôle (correctif de recette, 20 novembre 2026)

La règle des lots 137 et suivants — un lien d’action ne se cache pas dans un repli — s’applique aussi à `lib/pole-folds.js`.
La rangée d’actions qui termine une rubrique (« La boutique », « Composer votre service intégré », « Tous les documents »…)
sort du repli et reste visible sous le titre de sa rubrique (`.pp-dfold-a`). Une rubrique dont les actions sont réparties dans
le texte reste ouverte, à sa place : c’est le cas de « Emplois & jeunesse » sur TchadiTude, qui passe de cinq à quatre replis.

## Replis de texte : un seul vocabulaire (harmonisation du 20 novembre 2026)

Décision du DG. Les replis de texte ajoutés depuis le lot 137 (`details.pp-bfold`, sur seize pages) utilisaient deux libellés
— « Lire la suite » et « Afficher le détail » — et un signe « + » repoussé à droite, à côté du composant `.pp-more`
(« En savoir plus », 70 blocs) qui existait déjà. Tous prennent désormais le libellé et l’apparence de `.pp-more` :

- fermé : « En savoir plus + » (EN « Learn more + »), corps 500 à 0,92 rem, signe doré juste après le libellé ;
- ouvert : « Replier − » (EN « Close − »), comme les rubriques des pages de pôle ;
- sur fond sombre (sections nuit, scènes immersives, encadrés), le signe prend la couleur du texte.

Libellés et style sont définis une seule fois, dans `lib/block-folds.js` (`LABEL`, `CLOSE`, `SUMMARY_STYLE`, `STYLE`), et repris
par `lib/legacy-grids.js` et `lib/page-folds.js`. Les replis dont le libellé nomme leur contenu — rubriques de pôle, FAQ,
atlas, pièces d’un dossier — gardent ce libellé : c’est lui qui dit ce qu’on va ouvrir.

## Défauts visibles sur mobile (audit design du 20 novembre 2026)

Audit mesuré sur le site en ligne (18 pages types, 390 et 1440 px). Quatre défauts corrigés, sans règle ajoutée aux feuilles :
les corrections sont des styles en ligne posés à l’export (`lib/mobile-fixes.js`, `lib/latest-release.js`), hors budget de dette CSS.

- **Slogan du pied de page** : `.brand-tx{max-width:145px}` (mobile) coupait « L’énergie du Tchad. Intégrée. » après « Tchad. »
  hors accueil. Le slogan du pied de page n’a plus de largeur maximale ; celui de l’en-tête n’est pas touché.
- **Image des bandes immersives** (`.vi-band-img`) : une règle `height:auto!important` la ramenait à sa hauteur naturelle sur
  mobile ; la bande, plus haute, montrait une couture au milieu du texte. L’image couvre de nouveau toute la bande.
- **Ligne « Dernier communiqué » de l’accueil** : elle touchait le bord de l’écran sous 1 240 px. Elle reprend la gouttière des
  sections voisines (`max(20px,4vw)`).
- **Lien du bandeau de mesure d’audience** : 18 px de haut ; il passe à 25 px (cible tactile de 24 px au moins).

- **Bouton « retour en haut »** : sur mobile il recouvrait du contenu au-dessus de la barre du bas. Décision du DG : il est masqué
  là où cette barre est affichée (≤ 768 px) et reste disponible au-delà. Son `display` lit la variable `--et-totop`
  (style en ligne), que la feuille posée par `assets/chrome/audience-consent.js` met à `none` sous 769 px — une règle sans
  `!important` ni chaîne de sélecteurs, hors feuilles liées (leurs jeux de CSS critique ne bougent pas).

Contrôle : `qa/mobile-audit-fixes.spec.js`.

## Boutons d’action : un seul gabarit (audit design du 20 novembre 2026)

Le bouton d’action maison est `.pp-btn` : angles vifs, 56 px de haut, Inter 16 px / 600 — or clair sur fond sombre
(`.pp-btn-light`), or ou encre sur fond clair (`.pp-btn-gold`, `.pp-btn-ink`). Inventaire mesuré sur 25 pages : 115 boutons,
19 variantes, dont trois écarts ramenés au gabarit par `lib/button-coherence.js` (styles en ligne à l’export, feuilles liées
intactes) :

- `.mod-button` (« Discuter de cette étude → ») : rayon de 8 px → angles vifs ;
- `#ctSend` (envoi du formulaire de contact) : rayon de 10 px, police système, 48 px, collé au texte → angles vifs, Inter, 56 px,
  16 px d’air au-dessus ;
- `.et-primary` du héros de l’accueil : 54 px → 56 px, comme ses deux voisins.

Seules des propriétés sans état de survol sont posées en ligne ; les couleurs restent aux feuilles. Ne sont pas des boutons
d’action et gardent leur forme : les pastilles (filtres de la boutique, canaux de la page Contact) et les tuiles de liens.
Contrôle : `qa/button-coherence.spec.js`.

## Petits textes : 12 px au moins pour ce qui se lit (audit design du 20 novembre 2026)

Mesure sur 24 pages : 863 textes sous 12 px à 390 px, dont 770 sont des étiquettes en capitales (`.pp-k` et libellés de
cartes, 11,5 px) — un jeton du design system, conservé. Les 93 textes en minuscules se trouvaient presque tous sur deux pages :
Réseau de stations (84) et Nos activités (13), dans des styles écrits dans la page (0,6875 à 0,74 rem).

- `aval/reseau(-en).html` et `nos-activites(-en).html` : toute taille en rem sous 0,75 passe à 0,75 rem (12 px).
- Nos activités : plus aucun texte en minuscules sous 12 px. Réseau de stations : 84 → 21 ; les 21 restants tiennent à des
  feuilles liées (`premium-chrome.css`, `.et-product-specs span` à 0,72 rem…), non modifiées ici pour ne pas ré-extraire les
  jeux de CSS critique.

Contrôles : `scripts/test_small_text.mjs`, `qa/mobile-audit-fixes.spec.js`.

## Panneau « Activités » de l’en-tête (21 novembre 2026, décision du DG)

Question posée : migrer vers un méga-menu comme les majors ? Relevé des en-têtes le 21 novembre (Eni ~400 liens, TotalEnergies
~100 derrière 11 panneaux, BP six entrées à panneau, Shell et Equinor un bouton « Menu ») : réponse non, le site n’a ni le volume
ni les actifs qui justifient un méga-menu. Option retenue par le DG : **un seul panneau, sous « Activités »**.

- Contenu : les quatre métiers de l’accueil (Produire, Transporter, Raffiner & distribuer, Transformer, avec leur segment) et la
  vue d’ensemble. Données : clé `panel` de l’en-tête dans `assets/data/navigation.json` (FR et EN). Site principal seulement :
  le Centre de Connaissances garde son en-tête à sept liens.
- Balisage (`lib/main-nav.js`) : « Activités » reste un lien ; un bouton voisin `button.et-sub-tog` (`aria-expanded`,
  `aria-controls`, nom accessible) ouvre `div.et-sub` ; les deux portent `hidden` jusqu’à ce que `nav_a.js` révèle le bouton —
  sans JavaScript, l’en-tête est celui d’avant. Classes neuves : la logique des méga-menus du lot 80, encore dans `nav_a.js`, ne
  les voit pas. Le métier de la page courante est marqué `aria-current="page"`.
- Comportement (`nav_a.js`) : à partir de 1 241 px, ouverture au survol (pointeur souris seulement, `pointerType`) et au clic, fermeture par Échap (focus rendu au bouton),
  clic ailleurs ou sortie du focus ; le panneau part du bas de la barre, un pont invisible garde le survol. Dans le tiroir mobile :
  accordéon, bouton de 44 px.
- Styles : bloc `#et-sub-css` écrit dans l’en-tête (2 541 octets, aucun `!important`, aucune chaîne `:not(#…)`) ; spécificité
  mesurée au-dessus des deux règles concurrentes (`html #nav.pn .pn-item`, liens `html.et-jlight a:not(#_)…`). Fond crème et
  encre en thème clair, encre et textes clairs en thème sombre ; contrastes mesurés de 5,9:1 à 17:1. Plafonds de CSS dans la page
  relevés d’autant sur les sept pages du site principal du budget.

Contrôles : `scripts/test_main_nav.mjs`, `qa/activities-panel.spec.js` (préfixe « mega-menu — », tourne sur chaque PR),
`qa/mega-menu-contract.spec.js`.

## Crème unique (21 novembre 2026)

Les bandes papier des deux accueils (`#vision`, `#impact`, `#investisseurs-accueil`) passent de #F5F0E6 à #FAF8F3, le crème
déjà peint sur les pages intérieures (Société, Amont, Contact mesurées). Une seule valeur change : `--ed-paper` du thème clair
dans `immersif-2026.css` ; le thème sombre garde #101B2E. Les trois jeux de CSS critique qui embarquent cette feuille
(`home-fr`, `home-en`, `gouvernance`) portent la nouvelle empreinte, et les deux accueils la nouvelle valeur. Contrastes
mesurés sur #FAF8F3 : or #76550F 6,43:1, encre #0A1220 17,66:1, gris #3F4A5C 8,44:1 (tous au-dessus de 4,5:1).

## Longueur de page stable (22 novembre 2026)

Le rendu différé (`content-visibility:auto`) est retiré du site. Il réservait aux sections hors écran une hauteur estimée
(680 px en bureau, 760 px sur mobile, ou des hauteurs relevées page par page en octobre) qui ne suivait plus le contenu, replié
ou réécrit depuis. Relevé avant correction, à 1 440 et 390 px, sur les 293 pages exportées hors Centre : 89 pages
annonçaient une longueur fausse de plus de 600 px. La barre de défilement mentait, puis sautait pendant la lecture (Réseau de
stations : 43 620 px annoncés, 20 249 px réels sur mobile). Mesure avec processeur ralenti ×4 sur six pages longues : LCP et
temps de mise en page identiques à l'erreur de mesure près, avec ou sans rendu différé. Aucun gain à garder.

- Retiré : la règle commune de `premium-chrome.css` (bureau), celle de `modern-inner-2026.css` (mobile) et sa dérogation
  Atlas, celle de `modern-ui-2026.css` (identifiants de l'ancien accueil, et `#cta-band`), et les blocs `cv506`, `cv579` et
  `et-projets-rendu` de 36 pages sources.
- Gardé : `html:has(:target) main *{content-visibility:visible!important}` et les règles d'impression, désormais sans effet.
- Jeux de CSS critique : empreintes mises à jour sur les 31 jeux. Aucun n'embarquait les règles retirées.

Contrôle : `qa/page-length-stable.spec.js` (préfixe « mobile navigation — », tourne sur chaque PR).

## QA Engagements (22 novembre 2026)

Pages `/engagements` et `/engagements-en`, script `scripts/align_engagements_qa.py` (rejouable).

- Doctrine : la « continuité du corridor Doba ↔ Kribi » quitte la matérialité financière, remplacée par l'approvisionnement
  fiable du marché national (la stratégie exclut le pipeline d'export).
- Référentiels : TCFD, dissoute en 2023, remplacée par IFRS S2 (ISSB) pour la note climat, ici et sur Rapports ; ajout du
  décret tchadien n° 630/PR/PM/MEERH/2010 (études d'impact) et des Normes de performance de la SFI.
- Tableau des indicateurs : base « 100 % (équipe fondatrice) » confirmée par le DG et gardée ; base « 0 % »
  renouvelables devient « Néant — aucun site ». Sous 640 px, chaque ligne devient une carte étiquetée (`data-label`).
- Nouvelle section 06 « Plan environnemental » au conditionnel : étude d'impact, consultation publique, PGES, suivi et
  publication ; eau, air, sols, biodiversité, urgence, fin de vie.
- Structure : la grille « Parcourir cette page » doublait la barre de navigation et part ; numérotation 01 à 10 ; la section
  « Preuve » passe avant l'appel final.
- Petits textes : sous la règle du site (hors étiquettes en capitales), aucun texte de lecture sous 12 px ; rien changé.

Contrôle : `qa/engagements-qa.spec.js` (préfixes « disclosure controls keep » et « mobile navigation — », sur chaque PR).

## Boutons face aux majors (22 novembre 2026)

Mesure des pages d'accueil d'ExxonMobil, TotalEnergies, bp, Eni, Chevron et Shell : chacun une seule géométrie de bouton, une
hauteur, au plus trois niveaux, des libellés de 2 à 5 mots. Relevé EnerTchad avant correction (293 pages, 1 440 et 390 px,
hors Boutique et Atlas en sous-sites) : 48 styles de boutons d'action, arrondis 0, 8, 10 px, pilule ; hauteurs 40 à 56 px ;
deux ors (#E3BC62, #D9B567), deux encres (#0A1A2F, #172638), un bleu, un or #C9A227 ; flèches sans règle.

Règle : angles vifs, 56 px, Inter 16 px / 600 ; or plein #E3BC62 (action principale), encre pleine #0A1A2F (secondaire),
texte (lien). Flèche seulement vers l'extérieur (↗) ou pour un téléchargement (↓). Libellés : « Nous contacter » /
« Contact us », « Discuter de ce projet » / « Discuss this project ».

- `lib/button-coherence.js` (styles en ligne et libellés posés à l'export) : `.pp-btn-gold`, héros de l'accueil, `.isv-cta`,
  `.btn` (Atlas, Carnets, Outils), `.fl-cta` (Réseau), envois des formulaires Contact et Achats (or principal), accusé de
  réception arabe, pilules E-mail / WhatsApp de Contact portées à 44 px.
- `premium-chrome.css` : `.mod-button`, `.mod-preview`, boutons des filtres de Publications à angles vifs et 56 px ;
  empreinte mise à jour dans les 31 jeux critiques, règle mise à jour dans le jeu `pole`.
- `scripts/next/clients.mjs` : bouton principal de l'espace Clients, sans flèche ↗ (ancre interne).
- Laissé tel quel : le configurateur de service intégré (outil à part), les pilules de contact (canaux, pas actions).

Contrôles : `qa/button-coherence.spec.js` (géométrie, couleurs, flèches et libellés sur 12 pages, pilules), et
`scripts/test_button_coherence.mjs`.

## Réseau de stations et Communautés (22 novembre 2026)

- Réseau de stations (FR, EN) : 11 arrondis différents dans le contenu (13 à 22 px) contre 1 ou 2 (18 px) sur les autres pages
  de pôle. `scripts/align_reseau_cards.py` ramène à 18 px les arrondis de 12 à 22 px des styles en ligne et des blocs `<style>`
  de la page (hors carte du réseau, navigation, bande image) ; le bloc `#reseau-cartes-18` couvre les grandes cartes stylées par
  les feuilles partagées (`.card-m`, `.divc`, `.flagship`, `.ngs-stage`, tableau). Les éléments imbriqués gardent 14 px, les
  pastilles et cercles ne changent pas. Après : 18 px sur 129 éléments, plus 14 px imbriqués.
- Communautés (FR, EN) : la grille « Parcourir cette page » répétait 5 des 6 entrées de la barre ; elle part, la barre gagne
  « Enjeux » (`scripts/align_communautes_nav.py`).

Contrôle : `qa/reseau-communautes.spec.js`.

## Trois polices maison (22 novembre 2026)

Inter (texte, étiquettes), Instrument Serif (titres), JetBrains Mono (données). Relevé avant correction sur 278 pages :
l'ancienne police d'affichage (`Space Grotesk`, fichiers NationalPark) sur 81 pages (854 éléments : Carnets, planches des
articles du journal, carte de l'Atlas) et téléchargée sur toutes les pages (1 à 3 fichiers, 11 à 16 Ko chacun) ; la signature
des accueils en Georgia (une règle `!important` partagée écrasait `var(--ed-serif)`) ; le bouton des préférences d'audience en
police système.

- `--fd` (police d'affichage historique) vaut Inter dans `bundle_head_b2.css`, `c_ac3d961d5d38.css`, `fond647.css`,
  `s_9c80e27170.css`, comme déjà dans `pole-premium.css` ; empreintes et valeur mises à jour dans 28 jeux critiques.
- `lib/mobile-fixes.js` : signature des accueils en `var(--ed-serif)` (style en ligne).
- `audience-consent.js` : bandeau et bouton des préférences en Inter, bouton à angles vifs.
- Reste : des étiquettes en `ui-monospace` (police à chasse fixe du système) au lieu de JetBrains Mono sur 88 pages.

Contrôles : `qa/typography-house.spec.js`, `scripts/test_mobile_fixes.mjs`.

## Refonte de l'accueil « société pétrolière intégrée » (23 novembre 2026)

Maquette validée par le DG (canevas « EnerTchad — refonte de l'accueil »), logo et en-tête inchangés. Accueils FR et EN ;
l'accueil arabe garde ses six blocs jusqu'à son lot.

- Ordre : héros pleine largeur sur l'illustration de la raffinerie → vision et quatre chiffres clés → quatre métiers en grandes
  cartes illustrées, numérotées 01 à 04 (première implantation retenue : Moussoro) → Actualités (trois derniers communiqués,
  écrits au build depuis la liste officielle par `withLatestNews`, `lib/latest-release.js`) → Impact et engagements (bande
  illustrée ; Environnement remplace Formation) → Leadership (monogrammes, aucun portrait publié) → Investisseurs et Carrières
  côte à côte → Contact.
- Source : `scripts/apply_home_refonte.py` (rejouable). Styles : fin de `immersif-2026.css` ; les couleurs passent par les
  variables lues par la couche et-glass, les surcharges `!important` sont écrites dans `@layer et-verre`. Cartes opaques
  (contrat `glass-chrome`).
- CSS critique des deux accueils ré-extrait (`scripts/critical/extract.py`) ; premier écran identique avec ou sans feuilles liées.
- Légende corrigée : « Illustrations dessinées », et non plus « Photographies d'illustration ».

Contrôles : `scripts/test_home_major_review.py` (structure en sept sections), `qa/glass-chrome-contract.spec.js`.

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
| Accueil | Bandes pleines alternées : papier #F5F0E6 (papier nuit #101B2E en thème sombre) et encre #0A1220 ; plus de photo de fond ni de carte en verre dans « Quatre maillons » et « Direction et gouvernance » ; filets 1 px | `immersif-2026.css`, bloc « direction éditoriale » |
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

L’en-tête principal (`#nav`, 267 pages françaises et anglaises) se limite au logo, au slogan « L’énergie du Tchad. Intégrée. », à cinq liens simples (Vision, Activités, Impact, Investisseurs, Contact) et au bouton « Investisseurs » ; la barre d’outils garde les langues et la recherche. Sa définition vit dans la clé `header` de `assets/data/navigation.json` (posée par `lib/main-nav.js`) ; les six menus complets restent dans le même fichier pour le pied de page et le repérage. Gouvernance, Publications, Atlas, FAQ, Carrières et Communiqués passent dans la rangée « Ressources » du pied de page (`lib/navigation-review.js`). L’en-tête arabe suit la même logique depuis le lot 125 (`lib/ar-nav.js`) : cinq liens simples (الرئيسية، الرؤية، الأنشطة، المستثمرون، اتصل بنا), sans lien de recherche dans la barre (il reste dans le pied de page) ; il n’y a pas d’« Impact » en arabe, aucune page d’engagements n’existant dans cette langue.

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

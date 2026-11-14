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
pages sous `/amont` puis, au lot 123, à une section choisie de chacune des douze autres (activités, EOR, parc, méthane et torchage, services E&P, titulaire de droits pétroliers ; `lib/immersif-amont.js`) ; les autres pages du gabarit de pôle n’en ont pas. Aucun flou n’est
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

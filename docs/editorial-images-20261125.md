# Collection complémentaire du 25 novembre 2026

Six illustrations de synthèse originales, créées avec l’outil intégré de génération d’images. Scènes fictives, sans représentation d’un actif, d’une équipe ou d’une réalisation existante d’EnerTchad. Elles ne constituent pas des plans techniques.

## Intégration

Les images sont ajoutées dans le contenu des douze pages françaises et anglaises suivantes, sans remplacement des dessins au trait des en-têtes :

| Image | Page FR | Page EN |
|---|---|---|
| station-service | /aval/reseau | /aval/reseau-en |
| projet-modulaire | /aval/raffinage | /aval/raffinage-en |
| inspection-hse | /cadre-hse | /cadre-hse-en |
| formation-talents | /carrieres | /carrieres-en |
| supervision-numerique | /tchaditech/ | /pole-tchaditech-en |
| communautes-eau | /communautes | /communautes-en |

Les deux pages de crédits présentent les six images et leur nature conceptuelle. Chaque image éditoriale possède une description alternative localisée, une légende visible et un lien vers les crédits.

## Formats

24 fichiers sous `assets/img/collection-20261125/` : WebP 1400 et 800 pixels, WebP et AVIF 720 pixels pour mobile. La composition complète est préservée. Chargement différé et dimensions explicites pour limiter le poids initial et les déplacements de contenu. Total des 24 fichiers : 1 386 552 octets. Les six fichiers AVIF mobiles pèsent entre 14 366 et 24 975 octets chacun.

Les originaux PNG et les consignes de génération restent dans le dossier de livraison local `enertchad-visuels-20261125`, avec la galerie et l’archive complète.

## Vérification et retour arrière

Contrôles structurels : `node --test scripts/test_editorial_images.mjs` (15 cas). QA navigateur ciblée : `qa/editorial-images.spec.js` (12 pages, deux largeurs, deux langues, crédits, chargement, proportions et débordements). Construction et validation de l’export existantes.

Si une image ne se charge pas ou masque du contenu, retirer l’appel à `withEditorialImages` de `lib/image-collection.js` puis reconstruire et republier. La mise à jour ne modifie aucun contenu source des pages ni aucune destination commerciale.

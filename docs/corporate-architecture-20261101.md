# Architecture corporate — 1 novembre 2026

La navigation française et anglaise suit six rubriques : Entreprise ; Activités & Ingénierie ; Projets ; Engagements ; Actualités & Documents ; Investisseurs. Le portail investisseur et le portefeuille de projets ont chacun une entrée propre.

La définition commune reste dans `assets/data/navigation.json`, rendue par `lib/main-nav.js` ; `lib/corporate-architecture.js` la réutilise pour les pieds de page et les liens associés. Les pages corporate sont rendues par `withNavigationReview`, les pages natives Essentiel réutilisent les mêmes destinations, et les pieds de page donnent accès aux six rubriques. Les espaces Atlas et Clients conservent leur navigation de service et un retour explicitement nommé « Site corporate EnerTchad ».

Activités distingue les quatre segments industriels, les quatre capacités transversales et les trois parcours clients. Les huit fiches projets existantes restent les références uniques. Engagements réunit HSE, environnement, communautés, compétences et transparence. Actualités & Documents distingue les annonces officielles, les analyses et les références documentaires.

Les six pages centrales disposent de liens vers les rubriques associées. Les Carnets sont identifiés comme analyses et entretiens ; leur date est reprise uniquement lorsqu’une date de publication figure dans les métadonnées de la page. Aucune date nouvelle, nomination, donnée de performance ou réalisation de projet n’est créée.

Les scripts d’ouverture et de fermeture des menus restent les contrôles partagés du site. Chaque bouton possède une région distincte, un identifiant unique et un état `aria-expanded`. Les tests couvrent les six menus au clavier et leurs dimensions en français et anglais à 320, 390, 1241 et 1440 pixels, ainsi que les entrées centrales. Les contrôles de navigation exportée vérifient les destinations et les ancres.

Les pages arabes conservent leur organisation existante : cette évolution bilingue ne crée pas de traductions arabes non validées. Les liens de langue sont conservés. Aucun formulaire réel n’est soumis pendant la vérification.

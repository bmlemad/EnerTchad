# EnerTchad — architecture cible 2026

## Principe directeur

Le site conserve ses URLs publiques stables pendant la phase de modernisation. L’architecture éditoriale devient la référence de navigation et de classement, tandis que les anciennes variantes sont redirigées vers les pages canoniques.

## Navigation primaire

1. **Nos métiers**
   - Exploration & Production
   - Transport & stockage
   - Raffinage & distribution
2. **Nos capacités**
   - GreenTech
   - TchadiTech
   - Tchaditude
   - EnerConseils
3. **Entreprise**
   - Société
   - Gouvernance
   - Vision
   - Cibles 2030
   - Engagements
   - Communautés
   - Paiements aux États
4. **Investir**
   - Thèse
   - Modèle de capital
   - Feuille de route
   - Data room
   - Documents
   - Agenda investisseurs
5. **Clients & fournisseurs**
   - Solutions
   - Clients
   - Achats
   - Appels d’offres
   - Référencement
6. **Médias & connaissances**
   - Communiqués
   - Presse
   - Carnets
   - Atlas
   - Publications
   - Glossaire
7. **Carrières**
   - Métiers
   - Académie Tchaditude
   - Candidatures
8. **Outils**
   - Calculateur
   - Configurateur
   - Outils sectoriels
9. **Informations**
   - Contact
   - FAQ
   - Accessibilité
   - Confidentialité
   - Cookies
   - Mentions légales
   - Avertissements

## URLs canoniques

Les chemins déjà utilisés et référencés par le site restent les canoniques pendant cette phase :

| Domaine | Canonique |
|---|---|
| Accueil FR | `/` |
| Accueil EN | `/index-en` |
| Accueil AR | `/ar` |
| Exploration & Production | `/amont/` |
| Transport & stockage | `/intermediaire/` |
| Raffinage & distribution | `/aval/` |
| GreenTech | `/greentech/` |
| TchadiTech | `/tchaditech/` |
| Tchaditude | `/tchaditude/` |
| EnerConseils | `/enerconseils/` |
| Pétrochimie | `/petrochimie/` |

Les noms « Amont / Intermédiaire / Aval » restent des conventions d’URL historiques ; ils ne constituent plus la nomenclature éditoriale principale affichée à l’utilisateur.

## Internationalisation

- FR/EN/AR restent séparés tant que la migration URL n’est pas complètement cartographiée.
- Les balises `hreflang` doivent pointer vers des pages réellement équivalentes.
- Toute future migration vers `/fr/`, `/en/`, `/ar/` devra être accompagnée d’une table 301 exhaustive avant mise en production.

## Règles de migration

- Ne pas supprimer une ancienne page uniquement parce qu’elle est conceptuellement remplacée.
- Préférer une redirection 301 vers une destination équivalente.
- Ne pas rediriger plusieurs pages sans équivalence claire vers l’accueil.
- Conserver les ancres lorsqu’elles représentent une section réelle.
- Mettre à jour les liens internes vers les URLs canoniques.
- Garder le sitemap centré sur les URLs canoniques.

## Structure technique

La couche UI moderne est conservée comme couche de compatibilité pendant la consolidation. Toute future consolidation CSS/JS doit se faire par lots fonctionnels (tokens → base → composants → pages → responsive) avec QA entre chaque lot, plutôt qu’en supprimant immédiatement les anciens fragments.

## QA obligatoire

Chaque modification structurelle doit passer :

- contrôle des liens et ressources ;
- contrôle des IDs dupliqués ;
- validation JSON-LD ;
- `lang`, `title`, `description`, `canonical` ;
- cohérence sitemap ;
- QA navigateur desktop/mobile ;
- contrôle de débordement horizontal ;
- vérification des redirections historiques.

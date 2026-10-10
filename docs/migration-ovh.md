# EnerTchad : transfert de Netlify vers OVHcloud

Le domaine `enertchad.com` est déjà enregistré chez OVHcloud. Au 9 octobre 2026,
sa zone DNS est hébergée sur `dns1.p08.nsone.net` à `dns4.p08.nsone.net` (Netlify).
Le compte OVH ne comporte pas encore d'hébergement actif.

## Export prêt à transférer

Le site utilise l'export statique de Next.js ; aucun serveur Node.js n'est nécessaire
sur l'hébergement OVH. Construire et vérifier l'export avant de le préparer pour Apache :

```sh
npm ci
npm run build
npm run check:migration
python3 scripts/ovh/package.py --output /tmp/EnerTchad-OVH.zip
```

Le ZIP contient `index.html`, les ressources et le fichier `.htaccess` à sa racine.
Le générateur convertit les règles existantes de `_redirects` et les en-têtes de
`_headers` pour Apache 2.4, puis ajoute HTTPS et la résolution des URL sans `.html`.
Les chemins publics et les copies dédiées Clients/Atlas restent ceux de l'export
Next.js. Les fichiers de configuration propres à Netlify ne sont pas inclus dans le ZIP.

## Hébergement et domaines

État au 10 octobre 2026 : l'hébergement **Free 100M** `enertcp.cluster129.hosting.ovh.net`
est actif (PHP 8.4, 100 Mo), relié en Git à la branche `ovh-static` (dossier `www`).
Cette offre n'accepte que `enertchad.com` et `www.enertchad.com` : OVH refuse
d'attacher un autre domaine (« the attached domain must be enertchad.com or
www.enertchad.com »).

Les espaces dédiés sont donc servis sous le domaine du groupe, avec leur navigation
propre : `/boutique/`, `/boutique/clients` (et `/boutique/en/…`), `/atlas/` et
`/atlas/<chapitre>` (et `-en`). Les sous-domaines ouverts le 9 octobre redirigent
(301) vers ces chemins tant qu'ils pointent encore vers Netlify :

| Domaine | Rôle |
| --- | --- |
| `enertchad.com` | Site du groupe, espaces Clients et Atlas (OVH) |
| `www.enertchad.com` | Redirection vers `enertchad.com` (OVH) |
| `clients.enertchad.com` | Redirection vers `/boutique/clients` (Netlify, transition) |
| `atlas.enertchad.com` | Redirection vers `/atlas/` (Netlify, transition) |
| `boutique.enertchad.com` | Redirection vers `/boutique/` (Netlify, transition) |

Le formulaire de contact n'a plus Netlify Forms : `.htaccess` envoie les POST vers
`contact-handler.php` (généré depuis `scripts/ovh/contact.php`, destinataire repris
de `contact.html`), qui envoie le message par `mail()` puis redirige vers la page
d'accusé de réception. En cas d'échec d'envoi, il répond 502 et la page propose
l'e-mail et WhatsApp. Aucun message n'est conservé sur le serveur.

La sélection « aucune modification DNS » est conservée dans la commande préparée.
Le DNS web et les MX ne doivent pas être changés pendant le provisionnement.

## Basculement

1. Activer l'hébergement, vérifier les alias et charger le ZIP extrait par SFTP/FTP,
   y compris `.htaccess`. Ne transférer ni `node_modules`, ni le dépôt source.
2. Vérifier l'export sur le serveur OVH, ses redirections, ses ressources et le 404.
   L'IP cible doit provenir de cet hébergement ; ne pas utiliser une IP d'exemple.
3. Exporter la zone DNS complète de Netlify et conserver ses enregistrements mail,
   TXT, CAA et autres services. Créer une zone OVH gratuite et y recopier la zone,
   sans copier le SOA ni les NS Netlify. Remplacer uniquement les cibles web par
   celles de l'hébergement OVH et conserver les autres enregistrements.
4. Utiliser les serveurs DNS **réellement attribués** à cette zone OVH. Contrôler les
   A/AAAA/CNAME et la délivrance des certificats avant de finaliser la migration.
5. Vérifier les cinq hôtes en HTTPS, les pages FR/EN, Clients, Atlas, les ressources,
   les redirections et `deploy-version.txt` pendant et après la propagation.

Netlify reste disponible pour le retour arrière jusqu'à la validation du transfert.
L'activation d'une offre ou la création du ZIP ne constitue pas un basculement DNS.

## Références

- [Migration d'un site vers OVHcloud](https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/hosting-migrating-to-ovh)
- [Réécriture des URL sur OVHcloud](https://docs.ovhcloud.com/fr/guides/web-cloud/web-hosting/htaccess-url-rewriting-using-mod-rewrite)
- [Apache mod_rewrite](https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html)

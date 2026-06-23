# Tastify PFA Demo Runbook

## Lancement local

1. Ouvrir Docker Desktop.
2. Double-cliquer sur `start-demo-local.bat` a la racine du projet.
3. Attendre le message `Tastify demo is ready`.
4. Le script ouvre automatiquement:
   - Client: `http://localhost:3003`
   - Back-office: `http://localhost:3000`

Par defaut, le script lance la demo en mode rapide: il garde les volumes Docker et reutilise les donnees deja seed pour accelerer les relancements. Il configure toujours les liens QR avec l'adresse IP locale du PC.

Commandes utiles:

- `start-demo-local.bat`: lancement rapide, conserve les volumes pour le prochain lancement.
- `start-demo-local.bat -Reset`: remet une base propre, seed toutes les donnees demo, puis supprime les volumes a la fin.
- `start-demo-local.bat -Rebuild`: force la reconstruction des images Docker.
- `start-demo-local.bat -Reset -Rebuild`: reset propre complet avec reconstruction des images.

## Acces telephone

Le PC et le telephone doivent etre sur le meme Wi-Fi.

Le script affiche les URLs:

- Client telephone: `http://<IP_DU_PC>:3003`
- Back-office telephone: `http://<IP_DU_PC>:3000`

Il ouvre aussi une page locale avec deux QR codes: un pour le portail client et un pour le back-office staff.

Pour le paiement QR: depuis le back-office serveur, ouvrir une table avec commande payable, afficher le QR, puis scanner avec le telephone. Le lien doit pointer vers `http://<IP_DU_PC>:3003/pay/<token>`.

## Comptes demo

Mot de passe commun: `password123`

- Gerant: `gerant_test`
- Serveur: `serveur_test`
- Cuisinier: `cuisinier_test`
- Client: `client_test`

## Scenario 15 minutes

1. Client: ouvrir le portail, montrer l'accueil, la carte, les categories et les plats apprecies.
2. Expliquer que les plats apprecies sont classes par analyse de sentiment des avis clients.
3. Back-office gerant: montrer dashboard, stats, avis clients et stock.
4. Back-office serveur: ouvrir le plan de salle, selectionner une table libre, ajouter des plats, envoyer en cuisine.
5. Back-office cuisinier: ouvrir KDS, passer un plat en preparation puis pret.
6. Back-office serveur: montrer la notification, marquer le plat servi si necessaire.
7. Paiement: generer le QR depuis la table, scanner avec telephone, confirmer le paiement.
8. Verifier que la table repasse libre et que la commande devient payee.
9. Client: se connecter, ouvrir le compte, laisser un avis sans etoiles.
10. Gerant: montrer l'avis analyse et l'impact sur les statistiques/recommandations.

## Checklist avant jury

- Docker Desktop demarre correctement.
- Lancer `start-demo-local.bat -Reset` une fois avant la presentation si une base totalement propre est necessaire.
- Relancer ensuite `start-demo-local.bat` en mode rapide au moins 10 minutes avant la presentation.
- Garder ouverts: client, back-office gerant, back-office cuisinier, back-office serveur.
- Telephone sur le meme Wi-Fi que le PC.
- Desactiver VPN si le telephone ne rejoint pas l'IP du PC.
- Si le QR ouvre `localhost`, relancer `start-demo-local.bat` pour regenerer les URLs avec l'IP du PC.
- Si HuggingFace n'est pas configure, la demo continue avec l'analyse locale.

## Points a dire simplement

- "Le projet fonctionne en local avec Docker Compose: backend Django ASGI, MySQL, Redis, Celery et deux interfaces React."
- "Le QR contient un token signe et temporaire lie a la table et a la commande."
- "L'analyse de sentiment utilise HuggingFace quand la cle est disponible, sinon un fallback local multilingue pour assurer la continuite de service."
- "Le stock est lie aux recettes: quand un plat part en preparation, les ingredients diminuent; si un ingredient manque, le plat devient indisponible."

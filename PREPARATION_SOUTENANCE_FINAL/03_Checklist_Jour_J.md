# Checklist veille et jour J

## Ce soir

- [ ] Relire le script slide par slide.
- [ ] Répéter au moins deux fois en chronométrant 10 minutes.
- [ ] Tester les transitions entre Mehdi et Ibtihal.
- [ ] Ouvrir la présentation finale et vérifier les 21 slides.
- [ ] Tester la vidéo `docs/demo-videos/tastify-demo-presentation.mp4`.
- [ ] Exporter une copie PDF de la présentation si nécessaire.
- [ ] Lancer une fois `start-demo-local.bat`.
- [ ] Vérifier les comptes : `gerant_test`, `serveur_test`, `cuisinier_test`, `client_test`, mot de passe `password123`.
- [ ] Préparer les captures d’écran de secours.
- [ ] Préparer chargeur, souris, adaptateur HDMI/USB-C, clé USB.
- [ ] Couper notifications et mises à jour automatiques.
- [ ] Réviser les 10 questions les plus dangereuses.

## Demain matin

- [ ] Charger l’ordinateur.
- [ ] Brancher le chargeur pendant la soutenance.
- [ ] Ouvrir la présentation avant d’entrer en salle.
- [ ] Ouvrir la vidéo dans un lecteur local.
- [ ] Lancer Docker Desktop si une démo live est prévue.
- [ ] Lancer `start-demo-local.bat` au moins 10 minutes avant.
- [ ] Garder ouverts : back-office gérant, salle serveur, KDS cuisinier, portail client.
- [ ] Vérifier la connexion Internet seulement si Hugging Face doit être montré.
- [ ] Prévoir le fallback local si Internet ne marche pas.
- [ ] Respirer, parler lentement, regarder le jury et non l’écran.

## Démo normale : slide 18, 45 secondes à 1 minute 30

1. Portail client : ouvrir le menu et montrer les plats recommandés.
2. Back-office serveur : ouvrir la salle, choisir une table et créer une commande.
3. KDS cuisinier : montrer l’arrivée de la commande et changer un statut.
4. Paiement : montrer le QR ou la page de paiement simulé.
5. Avis : laisser ou montrer un avis analysé.
6. Dashboard ou page avis : montrer le sentiment exploité côté gérant.

## Parcours ultra-court : 45 secondes

1. Montrer la salle et dire : "Ici, le serveur crée une commande liée à une table."
2. Montrer le KDS et dire : "La cuisine reçoit le flux via WebSocket."
3. Montrer les avis et dire : "Les commentaires sont analysés en arrière-plan par Celery."
4. Conclure : "La valeur du projet est la centralisation des flux métier."

## Si la vidéo ne fonctionne pas

Phrase de secours : "Nous avons prévu un plan B : je vais commenter le parcours directement à partir des écrans déjà ouverts. Le scénario reste le même : client, commande, cuisine, paiement simulé et avis analysé."

## 10 erreurs qui font perdre des points

1. Lire les slides au lieu d’expliquer.
2. Dépasser 10 minutes.
3. Dire que le paiement est réel.
4. Dire que les modèles IA ont été entraînés localement.
5. Présenter les métriques IA comme définitives.
6. Ne pas savoir expliquer Redis et Celery.
7. Alterner la parole trop souvent sans logique.
8. Oublier les limites du projet.
9. Faire une démo trop longue.
10. Défendre une fonctionnalité absente au lieu d’être honnête.

## 5 points à réviser absolument

- Différence API REST / WebSocket.
- Rôle de Redis et Celery.
- Pipeline d’analyse de sentiment et fallback.
- Cycle commande -> KDS -> paiement simulé.
- Limites honnêtes : paiement, corpus IA, tests de charge, production.

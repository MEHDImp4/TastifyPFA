# Questions possibles du jury

## Pourquoi deux applications frontend ?

Il y a deux contextes d'utilisation differents. Le client a besoin d'une interface simple pour consulter le menu, payer et donner un avis. Le staff a besoin d'un outil operationnel avec salle, KDS, stock, statistiques et gestion.

## Pourquoi Docker ?

Docker garantit que la base MySQL, Redis, le backend, Celery et les deux frontends demarrent avec la meme configuration sur n'importe quelle machine. Pour la soutenance, cela evite les problemes d'installation locale.

## Comment fonctionne le paiement QR ?

Le serveur genere un token signe pour une table et une commande. Le client scanne le QR, ouvre une page publique securisee, puis confirme le paiement. Quand le montant restant est totalement paye, la commande passe a `PAYEE` et la table redevient libre.

## Est-ce un vrai paiement bancaire ?

Non, c'est une simulation de paiement adaptee au PFA. L'architecture est prete pour integrer un prestataire comme Stripe, CMI ou PayPal, car la logique met deja a jour les paiements, les commandes et les tables.

## Comment marche l'analyse de sentiment ?

Chaque avis client est analyse a partir du commentaire. Si une cle HuggingFace est configuree, Tastify utilise un modele de sentiment multilingue. Sinon, un fallback local classe l'avis en positif, neutre ou negatif pour garder la demo fonctionnelle.

## Pourquoi supprimer les etoiles ?

Pour eviter un biais explicite. Le systeme juge le ressenti a partir du texte du client, ce qui met mieux en valeur la partie IA/NLP du projet.

## Comment les plats recommandes sont-ils choisis ?

Les plats disponibles sont classes selon le score moyen des avis analyses et le nombre d'avis. Cela permet de mettre en avant les plats reellement apprecies par les clients.

## Que se passe-t-il si un ingredient est en rupture ?

Les recettes lient les plats aux ingredients. Quand le stock devient insuffisant, le plat est marque indisponible. Le client ne peut plus le commander et le staff voit clairement son etat.

## Quand le stock diminue-t-il ?

Le stock diminue quand un plat part en preparation, pas simplement quand il est ajoute au panier. Cela correspond mieux a la realite d'un restaurant.

## Comment gerez-vous les roles ?

Le backend applique des permissions par role: gerant, serveur, cuisinier et client. Le frontend cache les menus non autorises, mais la vraie securite reste cote API.

## Pourquoi Redis et Celery ?

Redis sert aux WebSockets et a la file de messages. Celery permet de traiter des taches asynchrones comme l'analyse de sentiment, l'orchestration cuisine et certains traitements de fond.

## Comment les notifications arrivent-elles ?

Le backend diffuse des evenements temps reel via WebSocket au groupe staff. Le back-office ecoute ces evenements et met a jour les notifications, commandes et alertes stock.

## Que se passe-t-il si HuggingFace ne repond pas ?

Le systeme bascule automatiquement vers l'analyse locale. C'est un choix de robustesse: la fonctionnalite reste disponible meme sans Internet.

## Quelles sont les limites actuelles ?

Le paiement est simule, les modeles IA sont appeles via API ou fallback local, et la prevision avancee de stock pourrait etre enrichie avec plus de donnees historiques. L'architecture permet ces evolutions.

## Quelle amelioration prioritaire apres le PFA ?

Brancher un prestataire de paiement reel, enrichir le modele de recommandation avec plus d'historique, et ajouter un mode production cloud avec monitoring.

# 50 questions-réponses de jury

Mise à jour présentation : la version finale analysée contient 21 slides. La slide 18 est dédiée à la démonstration de l'application Tastify : menu client, commande staff, KDS cuisine, avis et sentiment.

## A. Compréhension globale du projet

1. **Pourquoi avoir choisi un restaurant comme domaine ?**  
Risque : faible. Réponse courte : parce que le restaurant regroupe plusieurs flux liés : table, commande, cuisine, stock, paiement et avis. Réponse approfondie : Tastify montre comment centraliser ces flux dans une application web modulaire. À éviter : dire que le projet couvre tous les cas d’un vrai ERP industriel.

2. **Quelle est la problématique exacte ?**  
Risque : faible. Réponse courte : centraliser les opérations d’un restaurant tout en améliorant la coordination entre salle, cuisine, gestion et clients. Réponse approfondie : la solution répond aux erreurs de transmission, ruptures, réservations dispersées et avis peu exploités.

3. **Qui sont les utilisateurs cibles ?**  
Risque : faible. Réponse courte : gérant, serveur, cuisinier et client. Réponse approfondie : chaque rôle a des écrans et permissions différents.

4. **Quelle est la valeur ajoutée par rapport à un menu numérique ?**  
Risque : faible. Réponse courte : Tastify relie menu, commandes, KDS, stock, réservations, paiements, fidélité et avis. Réponse approfondie : le projet montre un flux métier complet, pas seulement une carte en ligne.

5. **Pourquoi parler de mini-ERP ?**  
Risque : moyen. Réponse courte : parce que plusieurs domaines métier sont centralisés dans un même système. Réponse approfondie : c’est un prototype académique, donc il reprend l’idée d’intégration d’un ERP sans prétendre remplacer une solution commerciale complète.

6. **Quelle est la principale limite fonctionnelle ?**  
Risque : moyen. Réponse courte : le paiement est simulé et le déploiement production reste une perspective. Réponse approfondie : le socle est prêt pour intégrer un prestataire réel, mais ce n’est pas encore fait.

7. **Quelle est votre contribution personnelle ?**  
Risque : élevé. Réponse courte : Mehdi a porté backend, intégration, tests et déploiement ; Ibtihal a porté interfaces, UX, documentation, UML et validation fonctionnelle. Réponse approfondie : les deux ont validé les scénarios ensemble.

8. **Quels éléments du rapport sont vraiment implémentés ?**  
Risque : élevé. Réponse courte : les modules listés dans le code existent : menu, tables, commandes, KDS, stock, RH, réservations, paiements, avis, analytics, fidélité et configuration. Réponse honnête : paiement réel, production cloud et tests de charge complets restent des perspectives.

## B. Conception et architecture

9. **Pourquoi Django ?**  
Risque : faible. Réponse courte : pour bénéficier d’un framework backend structuré, ORM, sécurité, admin et intégration DRF. Réponse approfondie : Django facilite la modélisation relationnelle et les permissions.

10. **Pourquoi Django REST Framework ?**  
Risque : faible. Réponse courte : pour exposer des API REST propres consommées par les deux frontends React. Réponse approfondie : viewsets, serializers et permissions réduisent le code répétitif.

11. **Pourquoi React ?**  
Risque : faible. Réponse courte : pour créer des interfaces interactives séparées staff/client. Réponse approfondie : React avec Vite et TypeScript rend les frontends modulaires et testables.

12. **Pourquoi deux applications frontend ?**  
Risque : moyen. Réponse courte : parce que le staff et les clients n’ont pas les mêmes besoins. Réponse approfondie : le back-office est opérationnel ; le portail client est public et centré sur menu, réservation, paiement, fidélité.

13. **Pourquoi MySQL ?**  
Risque : faible. Réponse courte : les données sont relationnelles : utilisateurs, commandes, tables, paiements, avis. Réponse approfondie : MySQL est stable et adapté au modèle Django.

14. **Quel est le rôle de Redis ?**  
Risque : moyen. Réponse courte : Redis sert au channel layer WebSocket et au broker Celery. Réponse approfondie : il relie les événements staff/KDS et les traitements de fond.

15. **Quel est le rôle de Celery ?**  
Risque : moyen. Réponse courte : exécuter les tâches longues ou secondaires, comme l’analyse de sentiment. Réponse approfondie : cela évite de bloquer la réponse API.

16. **Comment fonctionne le temps réel ?**  
Risque : moyen. Réponse courte : via Django Channels, WebSocket et Redis pour diffuser les événements staff. Réponse approfondie : le KDS reçoit les changements de commandes sans rechargement manuel.

17. **Comment sécurisez-vous les rôles ?**  
Risque : élevé. Réponse courte : les frontends cachent les menus, mais la sécurité réelle est côté API avec permissions DRF. Réponse approfondie : les rôles gérant, serveur, cuisinier et client sont portés par le modèle utilisateur.

18. **Où sont définies les routes API principales ?**  
Risque : moyen. Réponse courte : dans le routeur backend qui enregistre catégories, plats, tables, commandes, réservations, avis, fidélité, settings et paiements. Réponse approfondie : chaque domaine garde ses viewsets et serializers.

## C. Fonctionnalités métier

19. **Décrivez le cycle complet d’une commande.**  
Risque : moyen. Réponse courte : le serveur choisit une table, ajoute les plats, la commande est enregistrée, envoyée au KDS, préparée, servie puis payée. Réponse approfondie : les statuts de lignes pilotent le suivi cuisine.

20. **Quand le stock diminue-t-il ?**  
Risque : moyen. Réponse courte : selon les règles du module stock liées aux recettes et aux mouvements. Réponse approfondie : le rapport explique la consommation lors de la préparation.

21. **Que se passe-t-il si un ingrédient manque ?**  
Risque : moyen. Réponse courte : les seuils et disponibilités aident le gérant à surveiller les ruptures. Réponse approfondie : la logique relie plats et ingrédients.

22. **Comment fonctionne le KDS ?**  
Risque : faible. Réponse courte : il affiche les commandes cuisine et permet au cuisinier de changer les statuts. Réponse approfondie : les événements sont propagés vers le staff.

23. **Comment fonctionne la réservation ?**  
Risque : faible. Réponse courte : le client choisit date, heure et informations ; le backend vérifie les disponibilités. Réponse approfondie : le staff peut confirmer ou annuler.

24. **Le paiement est-il réel ?**  
Risque : élevé. Réponse courte : non, c’est une simulation de paiement pour le PFA. Réponse approfondie : le token signé permet un parcours réaliste, mais aucun prestataire bancaire n’est branché.

25. **Comment fonctionne le QR de paiement ?**  
Risque : moyen. Réponse courte : il contient un token signé lié à une table et une commande. Réponse approfondie : le portail client résout ce token via `/pay/:token`.

26. **Comment fonctionne la fidélité ?**  
Risque : faible. Réponse courte : le client possède un profil, des points, transactions et récompenses. Réponse approfondie : c’est un module de relation client.

27. **Comment les avis sont-ils exploités ?**  
Risque : moyen. Réponse courte : les commentaires sont analysés en positif, neutre ou négatif puis affichés au gérant. Réponse approfondie : les scores alimentent aussi des statistiques et recommandations.

28. **Quelles pages montrer en démo ?**  
Risque : faible. Réponse courte : suivre la slide 18 : menu client, commande staff, KDS cuisine, avis et sentiment. Réponse approfondie : garder la démo entre 45 secondes et 1 minute 30.

## D. Analyse de sentiment et IA

29. **Qu’est-ce que l’analyse de sentiment ?**  
Risque : faible. Réponse courte : classer un commentaire en positif, neutre ou négatif. Réponse approfondie : c’est une tâche NLP de classification de texte.

30. **Quelle donnée entre dans le modèle ?**  
Risque : faible. Réponse courte : le champ commentaire de l’avis client. Réponse approfondie : la note existe mais l’analyse actuelle se base sur le texte.

31. **Avez-vous entraîné les modèles ?**  
Risque : élevé. Réponse courte : non, nous utilisons des modèles pré-entraînés/fine-tunés via Hugging Face. Réponse approfondie : nous avons intégré, routé et normalisé leurs sorties.

32. **Pourquoi BERT ?**  
Risque : moyen. Réponse courte : parce que les modèles de type BERT comprennent mieux le contexte que des règles simples. Réponse approfondie : NLP Town est adapté aux avis courts multilingues.

33. **Pourquoi MARBERT ?**  
Risque : moyen. Réponse courte : pour les textes contenant des caractères arabes. Réponse approfondie : MARBERT est orienté arabe et dialectes.

34. **Comment choisissez-vous entre BERT et MARBERT ?**  
Risque : moyen. Réponse courte : détection simple de caractères arabes ; arabe vers MARBERT, sinon modèle multilingue. Réponse approfondie : c’est simple et perfectible.

35. **Que se passe-t-il sans clé Hugging Face ?**  
Risque : moyen. Réponse courte : le fallback local lexical est utilisé. Réponse approfondie : la fonctionnalité continue, mais avec des limites.

36. **Pourquoi le fallback a seulement 0,53 d’accuracy ?**  
Risque : élevé. Réponse courte : il repose sur des mots-clés et comprend mal les avis mixtes ou la darija latinisée. Réponse approfondie : il sert de secours, pas de moteur principal.

37. **Comment justifiez-vous 0,93 d’accuracy ?**  
Risque : élevé. Réponse courte : c’est un résultat indicatif sur un corpus manuel de 15 avis. Réponse approfondie : il faut plus de données pour conclure en production.

38. **Quelle différence entre precision et recall ?**  
Risque : moyen. Réponse courte : precision mesure la qualité des prédictions d’une classe ; recall mesure combien de vrais cas de cette classe sont retrouvés. Réponse approfondie : pour les avis négatifs, le recall indique si on rate des retours critiques.

39. **Pourquoi les avis neutres sont difficiles ?**  
Risque : moyen. Réponse courte : ils contiennent souvent des sentiments mélangés. Réponse approfondie : exemple : cadre agréable mais nourriture sans goût.

40. **Pourquoi parler de Deep Learning si vous utilisez une API ?**  
Risque : élevé. Réponse courte : parce que les modèles appelés sont des modèles de Deep Learning, même si l’inférence est faite via API. Réponse approfondie : notre contribution est l’intégration applicative et la validation indicative.

## E. Développement, tests et déploiement

41. **Comment lance-t-on la démo ?**  
Risque : faible. Réponse courte : avec Docker Desktop puis `start-demo-local.bat`. Réponse approfondie : le script lance backend, frontends, base, Redis, worker et données de démo.

42. **Quels comptes utiliser ?**  
Risque : faible. Réponse courte : `gerant_test`, `serveur_test`, `cuisinier_test`, `client_test`, mot de passe `password123`.

43. **Quels tests avez-vous ?**  
Risque : moyen. Réponse courte : pytest backend, Vitest frontend, Playwright end-to-end. Réponse approfondie : le rapport indique 346 tests backend, 121 e2e back-office et 81 e2e client.

44. **La couverture 93 % concerne quoi ?**  
Risque : moyen. Réponse courte : le backend selon le rapport. Réponse approfondie : elle ne veut pas dire que tout comportement utilisateur est parfait.

45. **Que se passe-t-il si Celery est indisponible ?**  
Risque : élevé. Réponse courte : les traitements de fond comme sentiment peuvent être retardés. Réponse approfondie : l’avis peut être créé, mais l’analyse asynchrone dépend du worker.

46. **Que se passe-t-il si Redis est indisponible ?**  
Risque : élevé. Réponse courte : les WebSocket et la file Celery sont impactés. Réponse approfondie : l’API REST peut rester partiellement utilisable, mais les flux staff/KDS se dégradent.

47. **Quelles difficultés avez-vous rencontrées ?**  
Risque : faible. Réponse courte : séparation des rôles, synchronisation salle-cuisine, cohérence paiements-commandes-stocks, intégration sentiment. Réponse approfondie : les tests ont aidé à stabiliser ces flux.

48. **Pourquoi Docker Compose ?**  
Risque : faible. Réponse courte : pour lancer MySQL, Redis, backend, Celery et deux frontends de manière reproductible. Réponse approfondie : c’est important pour la soutenance.

49. **Qu’est-ce qui manque pour la production ?**  
Risque : moyen. Réponse courte : HTTPS, monitoring, sauvegardes, secrets, tests de charge, prestataire de paiement. Réponse approfondie : ces points sont des perspectives réalistes.

50. **Que feriez-vous avec un mois de plus ?**  
Risque : moyen. Réponse courte : paiement réel, corpus IA plus large, tests de charge, monitoring et déploiement cloud. Réponse approfondie : prioriser d’abord la fiabilité et la sécurité.

## 10 questions les plus dangereuses

1. Avez-vous réellement entraîné les modèles BERT/MARBERT ?
2. Le paiement QR est-il un vrai paiement bancaire ?
3. Comment justifiez-vous 0,93 d’accuracy avec seulement 15 avis ?
4. Que se passe-t-il si Redis tombe ?
5. Que se passe-t-il si Celery ne tourne pas ?
6. Quels éléments sont seulement des perspectives ?
7. Où la sécurité des rôles est-elle appliquée ?
8. Quelle est votre contribution personnelle exacte ?
9. Pourquoi appeler Tastify un ERP ?
10. Pourquoi parler de Deep Learning si Hugging Face fait l’inférence ?

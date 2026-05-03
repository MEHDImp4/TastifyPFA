# Défis Techniques & Résolutions

Ce document répertorie les problèmes complexes rencontrés durant le développement et les solutions d'ingénierie apportées. Idéal pour la partie "Réalisation" du rapport.

## 1. Race Condition : Orchestration vs DB Commit (Phase 15)
- **Défi** : Celery lançait les tâches avant que les lignes de commande ne soient persistées en base (MySQL), causant des erreurs `DoesNotExist`.
- **Solution** : Utilisation de `transaction.on_commit()` pour différer l'envoi vers Redis uniquement après le succès de la transaction SQL.

## 2. Synchronisation Temps Réel (Phase 13)
- **Défi** : Gérer l'authentification JWT sur des WebSockets persistants.
- **Solution** : Middleware personnalisé Django Channels pour valider le token via Query String au handshake.

## 3. Performance du Timer KDS (Phase 14)
- **Défi** : Éviter le re-render massif du tableau KDS à chaque seconde.
- **Solution** : Composant `KdsTimer` isolé avec état local et `setInterval` optimisé.

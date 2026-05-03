# Module: Kitchen Display System (KDS)

Le KDS (Kitchen Display System) est l'interface dédiée au personnel de cuisine (**Cuisiniers**). Il remplace les tickets papier par un flux numérique temps réel synchronisé via WebSockets.

## 1. Affichage Temps Réel
- **Connexion** : Se connecte automatiquement à `ws://host/ws/staff/` au chargement.
- **Synchronisation** : Mise à jour instantanée des tickets sans rechargement de page.
- **Cartes Tickets** : Affiche le numéro de table, l'identifiant de commande, le serveur et la liste des plats.

## 2. Orchestration Just-in-Time (JIT)
Le backend calcule automatiquement le moment optimal pour lancer chaque plat afin qu'ils soient tous prêts simultanément pour une même table.

### Logique de Calcul
- `MaxPrepTime` = Temps de préparation le plus long de la commande.
- `TargetReadyTime` = Heure de commande + `MaxPrepTime`.
- `heure_lancement` = `TargetReadyTime` - Temps de préparation du plat spécifique.

### États Visuels (Color Coding)
- **EN_ATTENTE (Gris/Opacité 80%)** : Le plat est programmé mais pas encore lancé. Un compte à rebours ("In 2:30") indique le temps restant avant le lancement.
- **EN_PREPARATION (Teal/Vibrant)** : Le plat a été lancé (soit automatiquement par Celery à `heure_lancement`, soit manuellement). Un chronomètre affiche le temps écoulé depuis le lancement.
- **URGENT (Amber/Red)** : 
    - **Amber** : Préparation dépassant 10 minutes.
    - **Red Pulse** : Préparation dépassant 20 minutes (retard critique).

## 3. Événements WebSocket Spécifiques
- **`order_created` / `order_updated`** : Ajoute ou met à jour un ticket complet sur le tableau de bord.
- **`line_launched`** : Événement chirurgical envoyé par le worker Celery à l'heure exacte de `heure_lancement`. Il déclenche le passage visuel de "Programmé" à "En préparation" sans rafraîchir tout le ticket.

## 4. Cycle de Vie des Plats
1. **Lancement Automatique** : Celery exécute `launch_item_task` à `heure_lancement`, passe le statut à `EN_PREPARATION` et notifie le KDS.
2. **Fin de Préparation** : Le cuisinier clique sur "Terminer le Ticket" (UC en cours de finalisation) pour libérer l'espace sur le rail KDS.

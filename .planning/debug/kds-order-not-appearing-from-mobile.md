---
status: completed
trigger: "KDS ouvert sur PC, interface serveur sur téléphone, création d'une commande, la commande n'apparaît pas sur le KDS."
created: 2026-05-02
updated: 2026-05-02
---

# Debug Session: kds-order-not-appearing-from-mobile

## Symptoms
- **Expected:** Une commande créée depuis l'interface serveur sur téléphone doit apparaître immédiatement sur le KDS ouvert sur le PC.
- **Actual:** La commande est créée depuis le téléphone, mais elle n'apparaît pas sur le KDS.
- **Error Messages:** Aucun message d'erreur fourni pour l'instant.
- **Timeline:** Toujours en cours le 2026-05-02 après le correctif précédent `H-14-01`.
- **Reproduction:** Ouvrir le KDS sur le PC, ouvrir l'interface serveur sur le téléphone, créer une commande, observer que le KDS ne se met pas à jour.

## Current Focus
- **hypothesis:** Le KDS ne resynchronise ses commandes qu'au montage initial et dépend ensuite uniquement des événements websocket; dès qu'un `order_created` est raté pendant une phase de `WSREJECT`/reconnexion, l'écran reste bloqué sur une liste vide.
- **test:** Vérifier les logs backend pendant une création depuis téléphone, relire le flux `KdsPage`/`KdsSocketManager`, puis ajouter une resynchronisation backend à l'ouverture du socket et après les événements de commande.
- **expecting:** Voir un `POST /api/commandes/ 201` suivi d'un KDS resté vide malgré une instabilité websocket, et corriger ce manque de resync côté front.
- **next_action:** "completed"

## Evidence
- timestamp: 2026-05-02 16:51:22
  finding: Les logs backend montrent que la commande créée depuis le téléphone est bien persistée via `POST /api/commandes/ 201`.
- timestamp: 2026-05-02 16:49:17 - 16:54:17
  finding: Les connexions staff websocket du back-office alternent entre `WSCONNECT` et `WSREJECT`, ce qui rend crédible la perte d'un événement temps réel pendant une reconnexion.
- timestamp: 2026-05-02 16:58:00
  finding: `frontend/back-office/src/pages/Kds/KdsPage.tsx` ne charge les commandes qu'au montage, et `KdsSocketManager.tsx` se contente d'appliquer `lastEvent` sans refetch de sécurité.
- timestamp: 2026-05-02 17:00:52
  finding: Le correctif côté KDS ajoute une resynchronisation sur `connectionStatus === 'open'` et après `order_created`/`order_updated`, avec validation via `npm run test -- src/pages/Kds/KdsSocketManager.test.tsx --run`.

## Eliminated
- La création backend de la commande depuis l'interface serveur.
- Le filtrage KDS `EN_COURS` / `EN_CUISINE` corrigé précédemment dans `CommandeViewSet`.

## Resolution
- **root_cause:** Le KDS ne rechargeait pas l'état backend après une reconnexion websocket ni après les événements de commande. Quand l'événement `order_created` était raté pendant les `WSREJECT` observés, la page cuisine restait figée sur l'état chargé au premier montage.
- **fix:** Mise à jour de `frontend/back-office/src/pages/Kds/KdsSocketManager.tsx` pour refetch `fetchOrders()` à l'ouverture du websocket staff et après `order_created` / `order_updated`.
- **validation:** `npm run test -- src/pages/Kds/KdsSocketManager.test.tsx --run`

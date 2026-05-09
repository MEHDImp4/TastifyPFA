---
phase: 34
slug: kds-advanced-operations
status: research
---

# Phase 34 Research: KDS Advanced Operations

## UC19: Modification Rapide
- **Current State**: `CommandeLigne` status governs its visibility in KDS.
- **WebSocket wiring**: `commandes.signals` likely handles KDS notifications.
- **Permissions**: Only `GERANT` or `SERVEUR` (owner) should modify.

## UC20_bis: Signalement Rupture
- **KDS UI**: Needs a way to list "Frequently Used Dishes" or just the active ones to mark them as unavailable.
- **Backend API**: `patch /api/menu/plats/{id}/` with `est_disponible=False`.
- **WS Event**: `MENU_ITEM_UNAVAILABLE`.

## Real-time Sync
- Need to ensure `OrderingPage` in Salle listens to `MENU_ITEM_UNAVAILABLE` to update the list of selectable dishes without a refresh.
- Shared `WebSocketProvider` is already in place.

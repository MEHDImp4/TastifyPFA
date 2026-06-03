---
phase: 34
slug: kds-advanced-operations
status: complete
---

# Phase 34 Summary: KDS Advanced Operations

## Work Completed

### 1. UC19: Modification Rapide (Salle -> Cuisine)
- **Backend**: Updated `CommandeLigneViewSet` to allow `SERVEUR` (owner) to cancel lines that are in `EN_ATTENTE` status.
- **Frontend**: Added "Annuler" button to `OrderingPage` for pending items. Integrated real-time sync via `line_cancelled` WebSocket event.
- **Real-time**: Implemented broadcast of `line_cancelled` to ensure KDS tickets update immediately.

### 2. UC20_bis: Signalement Rupture (Cuisine -> Salle)
- **Backend**: Enhanced `PlatViewSet` to allow `CUISINIER` to perform partial updates on dish availability (`est_disponible`).
- **Signals**: Created `apps/menu/signals.py` to broadcast `menu_item_unavailable` and `menu_item_available` events when a dish status changes.
- **Frontend**: Added "Rupture" (Ban icon) to KDS ticket cards for immediate kitchen-to-floor signaling.
- **Sync**: Updated `OrderingPage` to listen for availability events and grey-out dishes in real-time.

## Verification Results
- **Automated Tests**: New test suite `test_advanced_ops.py` verified:
  - Cuisinier can mark plat as unavailable.
  - Serveur can cancel pending lines.
  - Serveur cannot cancel lines already in preparation (400 Bad Request).
- **Build**: Production build passes for Back-Office.

## Next Steps
- **Phase 35**: Click & Collect E-commerce (UC24).

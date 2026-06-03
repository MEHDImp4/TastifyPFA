---
phase: 34
slug: kds-advanced-operations
status: discussion
---

# Phase 34: KDS Advanced Operations

## Goal
Implement advanced operational capabilities for Salle and KDS teams: UC19 (Modification rapide) and UC20_bis (Signalement rupture immédiate).

## Context
In a real restaurant, orders change after being sent to the kitchen (e.g., "Change the drink", "Cancel that appetizer").
Conversely, the kitchen might run out of a dish and needs to immediately inform the staff to stop taking orders for it.

## Proposed Scope

### 1. UC19: Modification Rapide (Salle -> Cuisine)
- **UI**: Allow editing a `Commande` that is `EN_CUISINE`.
- **Logic**:
    - Adding a line: Should be sent to KDS normally.
    - Modifying quantity: If increased, show the diff to KDS. If decreased, KDS must "Acknowledge" the change (to avoid wasted food).
    - Removing a line: KDS must confirm if the dish hasn't started yet.
- **Simplification for MVP**: If `CommandeLigne` is `EN_ATTENTE`, allow immediate removal. If `EN_PREPARATION`, require "Cancellation Request" that KDS approves/rejects.

### 2. UC20_bis: Signalement Rupture (Cuisine -> Salle)
- **UI**: KDS interface adds a "Mark as Unavailable" button on dishes.
- **Logic**: 
    - Update `Plat.est_disponible = False` in the DB.
    - Push a WebSocket notification to all Staff (Salle & Manager).
    - Salle UI should immediately grey-out or hide the dish in the ordering screen.

## Questions for Discussion
- [ ] For UC19, should we allow "Direct Cancellation" of pending lines without kitchen approval? (Yes, if `statut == EN_ATTENTE`).
- [ ] For UC20_bis, should it also auto-cancel existing `EN_ATTENTE` lines for that dish? (Probably safer to let the staff handle it via notification).

## Success Criteria
1.  Staff can remove a `pending` line from an active order.
2.  Chef can mark a dish as "Out of Stock" from the KDS.
3.  Salle UI reflects the "Out of Stock" state in real-time.

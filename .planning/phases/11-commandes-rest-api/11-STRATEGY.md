# Phase 11 Strategy: Commandes REST API

## Overview
This phase exposes the order models via a REST API, ensuring atomic creation of orders and automatic synchronization with table states.

## Execution Plans

### 11-01-PLAN.md: Serializers & ViewSet Foundation
- **Goal**: Implement nested serializers and the core `CommandeViewSet`.
- **Tasks**:
  - Create `CommandeLigneSerializer`.
  - Create `CommandeSerializer` with nested `lignes` support and atomic `create()`.
  - Implement `CommandeViewSet` with `get_queryset` ownership filtering.
  - Register URLs in `api_router.py`.
  - Add initial API tests for order creation and RBAC.

### 11-02-PLAN.md: Table State Synchronization
- **Goal**: Automate table status transitions based on order lifecycle.
- **Tasks**:
  - Add `post_save` signals for `Commande` in `apps/commandes/signals.py`.
  - Implement `sync_table_status` logic:
    - New Order -> Table `OCCUPEE`.
    - Status `PAYEE`/`ANNULEE` -> Table `LIBRE`.
  - Add unit tests for signal-driven table sync.

### 11-03-PLAN.md: Custom Actions & Final Verification
- **Goal**: Add refinement features and verify the full API suite.
- **Tasks**:
  - Implement `@action add_items` for adding lines to existing orders.
  - Implement soft-delete logic in `CommandeViewSet.destroy()`.
  - Add final integration tests covering complex scenarios (multiple lines, status transitions, RBAC edge cases).
  - Verify 100% test coverage for the `commandes` API.

## Success Criteria
- `POST /api/commandes/` creates an order and its lines atomically.
- Creating an order marks the table as `OCCUPEE`.
- Paying/Cancelling an order marks the table as `LIBRE`.
- Servers only see their own orders; Gérants see all.
- All integration tests pass.

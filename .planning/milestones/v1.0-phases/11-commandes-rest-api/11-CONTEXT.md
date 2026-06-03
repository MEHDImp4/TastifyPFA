# Phase 11: Commandes REST API - Context

## Goal
Expose the `Commande` and `CommandeLigne` models via a REST API to allow servers and managers to manage orders, with a focus on atomic creation and automatic table state synchronization.

## Locked Decisions
- **Atomic Creation**: The API MUST support creating an order and its associated lines in a single `POST /api/commandes/` request using nested serializers.
- **Personal Ownership**: Users with the `SERVEUR` role can only see and manage orders they personally created. `GERANT` retains full visibility across all orders.
- **Automatic Table Sync**: 
  - Creating a `Commande` automatically updates the associated `Table.statut` to `OCCUPEE`.
  - Paying (`statut=PAYEE`) or Cancelling (`statut=ANNULEE`) an order automatically sets the `Table.statut` back to `LIBRE`.
- **Soft-Delete Logic**: 
  - `DELETE /api/commandes/{id}` sets `est_active=False` (soft-delete).
  - Business-level cancellation MUST be done via a `PATCH` request setting `statut=ANNULEE`.
- **RBAC**:
  - `SERVEUR`: Create, Read (Own), Update (Own status/lines).
  - `GERANT`: Full CRUD on all orders.
  - `CUISINIER`: Read-only access to active orders.

## Requirements
- **CMD-API-01**: `CommandeViewSet` with nested `CommandeLigneSerializer` for `create`.
- **CMD-API-02**: Automatic table state transitions via Django signals or ViewSet logic (signals preferred for decoupling).
- **CMD-API-03**: `CommandeViewSet.get_queryset` must filter by `serveur=request.user` for non-GERANTs.
- **CMD-API-04**: Validation: 
  - Ensure `table` is not already `OCCUPEE` when creating a new order.
  - Ensure `est_active=True` for all operations.
- **CMD-API-05**: Custom action `/api/commandes/{id}/add_items/` to allow adding lines to an existing order.

## Technical Strategy
- Use `rest_framework.serializers.ModelSerializer` with `lignes = CommandeLigneSerializer(many=True)`.
- Override `create()` in `CommandeSerializer` to handle atomic creation within a `transaction.atomic()` block.
- Implement a dedicated signal in `apps.commandes.signals` to handle `Table` status updates.
- Use `apps.users.permissions` to enforce the ownership rules.

## References
- `apps/commandes/models.py`: Current model definitions.
- `apps/tables/models.py`: `Table` and `Statut` definitions.
- `apps/users/permissions.py`: RBAC base classes.

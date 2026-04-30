# Phase 11 Research: Commandes REST API

## Domain: DRF ViewSets, Nested Serializers, Django Signals, RBAC

## 1. Technical Baseline
- **Existing Signal Pattern**: Phase 10 implemented `apps/commandes/signals.py` for total calculation. It follows the pattern of importing the signals module in `apps.py` `ready()`.
- **Table Integration**: `apps/tables/models.py` defines `Table.Statut` as `LIBRE`, `OCCUPEE`, `RESERVEE`, `ENCAISSEMENT`.
- **Permissions**: `apps/users/permissions.py` provides role-based permission classes.

## 2. Implementation Research

### 2.1 Nested Serializers (Atomic Order Creation)
- **Goal**: Support `POST /api/commandes/` with a body like:
  ```json
  {
    "table": 1,
    "lignes": [
      {"plat": 5, "quantite": 2},
      {"plat": 12, "quantite": 1, "notes": "No spicy"}
    ]
  }
  ```
- **Strategy**: 
  - `CommandeSerializer` will have `lignes = CommandeLigneSerializer(many=True)`.
  - Override `create(self, validated_data)`:
    - Extract `lignes_data = validated_data.pop('lignes')`.
    - Create `commande` instance with `validated_data` (including `serveur=request.user`).
    - Bulk create or loop through `lignes_data` to create `CommandeLigne` instances linked to the new `commande`.
    - Wrap in `django.db.transaction.atomic()`.

### 2.2 Table State Synchronization (Signals)
- **Requirement**:
  - `Commande` created -> `Table.statut = OCCUPEE`.
  - `Commande.statut` becomes `PAYEE` or `ANNULEE` -> `Table.statut = LIBRE`.
- **Strategy**:
  - Add `post_save` signal on `Commande` in `apps/commandes/signals.py`.
  - On create: `instance.table.statut = Table.Statut.OCCUPEE; instance.table.save(update_fields=['statut'])`.
  - On update (if `statut` changed to `PAYEE` or `ANNULEE`): `instance.table.statut = Table.Statut.LIBRE; instance.table.save(update_fields=['statut'])`.
  - **Risk**: Need to ensure we don't accidentally free a table if there are multiple active orders (though typically one table = one active order in this project's scope).

### 2.3 RBAC & Filtering
- **Requirement**: `SERVEUR` only sees their own orders.
- **Strategy**: 
  - Override `get_queryset()` in `CommandeViewSet`:
    ```python
    def get_queryset(self):
        user = self.request.user
        qs = Commande.objects.active()
        if user.role == User.Role.GERANT:
            return qs
        return qs.filter(serveur=user)
    ```
- **Custom Permission**: `IsOwnerOrGerant` (if needed for detail views).

### 2.4 Custom Action: `add_items`
- **Goal**: `POST /api/commandes/{id}/add_items/` to add more lines to an existing order.
- **Strategy**: 
  - Use `@action(detail=True, methods=['post'])`.
  - Accepts a list of items.
  - Reuses `CommandeLigneSerializer`.

## 3. Risks & Mitigations
- **Transaction Safety**: Atomic creation is critical. Mitigation: Use `transaction.atomic()`.
- **Signal Loops**: Ensure `update_fields` is used.
- **Table Overwrite**: If a table is set to `LIBRE` but another order (e.g. from another waiter) is still active on it. Mitigation: For now, assume 1 active order per table. In future, could check `active_orders_count`.

## 4. Patterns to Follow
- **Serializers**: Follow `apps/menu/serializers.py`.
- **Views**: Follow `apps/menu/views.py`.
- **Signals**: Follow `apps/commandes/signals.py` (wired in `apps.py`).
- **Tests**: Use `rest_framework.test.APITestCase`.

# Phase 16-04 Summary: KDS Queryset Filtering & Ownership Guard (Wave 1)

## Implementation Details

### `backend/apps/commandes/views.py`
- **Tightened KDS Filter**: Narrowed the `CUISINIER` queryset to strictly include only `EN_CUISINE` and `PRETE` statuses. `EN_COURS` (draft) orders are now invisible to the kitchen until "fired".
- **Ownership Guard**: Overrode `update` and `partial_update` methods in `CommandeViewSet` to enforce ownership.
  - `SERVEUR` can only modify their own orders.
  - `GERANT` can modify any order.
  - Attempts by unauthorized users (including `CUISINIER` via these standard endpoints) return `403 Forbidden`.
- **Consistency**: Used `get_object_or_404` on the `active()` queryset in `update`/`partial_update` to ensure a `403` response for unauthorized access instead of a `404` (matching the `add_items` pattern).
- **Cleanup**: Removed the now-redundant `statut` carve-out for `CUISINIER` in `get_queryset`.

## Test Results
- **RED -> GREEN**:
  - `apps/commandes/tests/test_kds_permissions.py::KDSPermissionsTestCase::test_cuisinier_queryset_excludes_en_cours`
  - `apps/commandes/tests/test_kds_permissions.py::KDSPermissionsTestCase::test_cuisinier_queryset_includes_en_cuisine_and_prete`
  - `apps/commandes/tests/test_api.py::FireOrderPatchTestCase::test_fire_order_non_owner_serveur_forbidden`
- **Full Backend Suite**: 52 tests passed.

## Commit
- `feat(16): tighten kds queryset and gate commande PATCH on ownership`

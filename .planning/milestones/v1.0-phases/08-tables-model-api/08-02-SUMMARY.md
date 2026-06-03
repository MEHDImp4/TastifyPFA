---
phase: 08-tables-model-api
plan: 02
type: summary
status: complete
completed: 2026-04-28
---

# Plan 08-02 Summary: TableSerializer + TableViewSet + URL Wiring

## Endpoints Registered

| Method | URL | Action | Permission |
|--------|-----|--------|------------|
| GET | `/api/tables/` | list | IsAuthenticated |
| POST | `/api/tables/` | create | IsAuthenticated + IsGerant |
| GET | `/api/tables/{id}/` | retrieve | IsAuthenticated |
| PUT/PATCH | `/api/tables/{id}/` | update | IsAuthenticated + IsGerant |
| DELETE | `/api/tables/{id}/` | destroy (soft) | IsAuthenticated + IsGerant |

## RBAC Rules Applied

- `list` / `retrieve` → `IsAuthenticated` only
- `create` / `update` / `partial_update` / `destroy` → `IsAuthenticated` + `IsGerant`
- GERANT `get_queryset` → `Table.objects.all()` (includes soft-deleted)
- Non-GERANT `get_queryset` → `Table.objects.active()` (est_active=True only)
- `destroy` → calls `instance.delete()` (soft-delete), returns HTTP 204
- No `changer_statut` action (deferred to Phase 12 per D-08-02)

## Artifacts Created

| File | Content |
|------|---------|
| `backend/apps/tables/serializers.py` | `TableSerializer` — 9 fields, 3 read-only |
| `backend/apps/tables/views.py` | `TableViewSet` with split RBAC + visibility |
| `backend/apps/tables/urls.py` | `DefaultRouter` registered at `tables` |
| `backend/tastify_backend/urls.py` | `apps.tables.urls` mounted under `api/` |
| `backend/apps/tables/tests/test_rbac.py` | `TableRBACTest` — 8 tests |

## Test Results

```
Ran 8 tests in 5.368s
OK
```

All 8 RBAC tests pass green:
- `test_unauthenticated_list_returns_401` ✓
- `test_serveur_can_list_tables` ✓
- `test_serveur_cannot_create_table` ✓
- `test_serveur_cannot_delete_table` ✓
- `test_gerant_can_create_table` ✓
- `test_gerant_can_soft_delete_table` ✓
- `test_soft_deleted_table_hidden_from_serveur` ✓
- `test_gerant_sees_soft_deleted_table` ✓

## Deviations from Plan

None. Implementation matches plan specification exactly.

---
phase: "18-ingredients-stock-model"
plan: "18-02"
subsystem: "backend/stock"
tags: ["django", "drf", "viewset", "serializer", "rbac", "soft-delete", "active-filter"]
dependency_graph:
  requires:
    - "apps.stock.Ingredient model (18-01)"
    - "apps.stock.PlatIngredient model (18-01)"
    - "apps.users.permissions.IsGerant"
  provides:
    - "GET /api/stock/ingredients/ — list active ingredients (authenticated)"
    - "POST/PATCH/PUT/DELETE /api/stock/ingredients/ — write ops (GERANT only)"
    - "IngredientSerializer and PlatIngredientSerializer"
    - "IngredientViewSet with soft-delete destroy and active filtering"
  affects:
    - "app/backend/tastify_backend/urls.py"
tech_stack:
  added: []
  patterns:
    - "ModelViewSet with get_permissions() split (read=IsAuthenticated, write=IsGerant)"
    - "get_queryset() role-aware filtering (GERANT sees inactive, others do not)"
    - "Soft-delete via overridden destroy() calling instance.delete()"
key_files:
  created:
    - "app/backend/apps/stock/serializers.py"
    - "app/backend/apps/stock/views.py"
    - "app/backend/apps/stock/urls.py"
    - "app/backend/apps/stock/tests/test_api.py"
  modified:
    - "app/backend/tastify_backend/urls.py"
decisions:
  - "Stock URLs included at /api/stock/ from tastify_backend/urls.py (parallel to other api/ includes, keeping stock namespace isolated)"
  - "Non-GERANT read access permitted for list/retrieve to match menu pattern (Categorie/Plat are also readable by all authenticated users)"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-05"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
  tests_added: 13
  tests_passed: 13
---

# Phase 18 Plan 02: Stock API — Serializers, ViewSet, Routing & Tests Summary

**One-liner:** DRF IngredientViewSet with GERANT-only writes, active-filter get_queryset, and 13 passing API tests.

## What Was Built

### Task 1: API Serializers and Views (commit e0f3fb0)

**`apps/stock/serializers.py`:**
- `IngredientSerializer` — ModelSerializer exposing all Ingredient fields; `id`, `created_at`, `updated_at` are read-only.
- `PlatIngredientSerializer` — ModelSerializer exposing all PlatIngredient fields; `id` is read-only.

**`apps/stock/views.py`:**
- `IngredientViewSet(ModelViewSet)` — `get_permissions()` returns `[IsAuthenticated]` for list/retrieve and `[IsAuthenticated, IsGerant]` for create/update/delete.
- `get_queryset()` — GERANT sees all rows; other authenticated users see only `est_active=True`.
- `destroy()` — calls `instance.delete()` (soft-delete) and returns 204.

**`apps/stock/urls.py`:**
- `DefaultRouter` registers `IngredientViewSet` at `ingredients/`.

**`tastify_backend/urls.py`:**
- Added `path('api/stock/', include('apps.stock.urls'))` ahead of the generic `api/` router include.

**Verification:** `docker compose exec backend python manage.py check` → 0 issues.

### Task 2: API Tests (commit 649e67a)

13 pytest tests in `apps/stock/tests/test_api.py` organized in 3 classes:

**TestIngredientCRUD (5 tests):**
- `test_list_ingredients_as_gerant` — GERANT sees both active and inactive
- `test_retrieve_ingredient` — 200 with correct data
- `test_create_ingredient` — 201 with DB persistence check
- `test_update_ingredient` — PATCH updates stock_actuel
- `test_soft_delete_via_api` — DELETE returns 204, row persists with est_active=False

**TestIngredientPermissions (5 tests):**
- `test_serveur_can_list` — 200 read allowed
- `test_serveur_cannot_create` — 403
- `test_serveur_cannot_update` — 403
- `test_serveur_cannot_delete` — 403
- `test_unauthenticated_cannot_list` — 401

**TestIngredientActiveFiltering (3 tests):**
- `test_non_gerant_sees_only_active` — Levure (inactive) absent for SERVEUR
- `test_gerant_sees_inactive` — Levure present for GERANT
- `test_soft_deleted_hidden_from_non_gerant` — after delete(), Farine gone from SERVEUR list

All 13 tests pass: `13 passed in 9.18s`.

## Deviations from Plan

None — plan executed exactly as written. URL routing placed in `tastify_backend/urls.py` at `/api/stock/` as specified.

## Known Stubs

None — all endpoints are wired to live DB-backed models. No placeholder data.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: new-endpoint | app/backend/apps/stock/views.py | New authenticated read endpoint /api/stock/ingredients/ — write ops protected by IsGerant |

## Self-Check

- [x] `app/backend/apps/stock/serializers.py` — FOUND
- [x] `app/backend/apps/stock/views.py` — FOUND
- [x] `app/backend/apps/stock/urls.py` — FOUND
- [x] `app/backend/apps/stock/tests/test_api.py` — FOUND
- [x] commit e0f3fb0 — FOUND (feat(18-02): add stock API serializers, viewset, and URL routing)
- [x] commit 649e67a — FOUND (feat(18-02): add stock API tests)

## Self-Check: PASSED

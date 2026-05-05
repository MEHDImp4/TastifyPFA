---
phase: "18-ingredients-stock-model"
plan: "18-04"
subsystem: "backend/stock"
tags: ["django", "drf", "admin", "viewset", "migrations", "rbac"]
dependency_graph:
  requires:
    - "apps.stock.Ingredient model (18-01)"
    - "apps.stock.PlatIngredient model (18-01)"
    - "PlatIngredientSerializer (18-02)"
    - "IngredientViewSet + stock URLs (18-02)"
  provides:
    - "GET/POST /api/stock/plat-ingredients/ — recipe-ingredient link management (GERANT)"
    - "GET/PUT/PATCH/DELETE /api/stock/plat-ingredients/{id}/"
    - "Django admin for Ingredient and PlatIngredient"
    - "stock.0001_initial and menu.0003_plat_ingredients applied to live MySQL DB"
  affects:
    - "app/backend/apps/stock/views.py"
    - "app/backend/apps/stock/urls.py"
    - "app/backend/apps/stock/tests/test_api.py"
tech_stack:
  added: []
  patterns:
    - "ModelViewSet with class-level permission_classes (all actions GERANT-only — differs from IngredientViewSet which splits read/write)"
    - "select_related on queryset for plat+ingredient FK joins"
    - "@admin.register decorator pattern — mirrors apps/menu/admin.py"
key_files:
  created:
    - "app/backend/apps/stock/admin.py"
  modified:
    - "app/backend/apps/stock/views.py"
    - "app/backend/apps/stock/urls.py"
    - "app/backend/apps/stock/tests/test_api.py"
decisions:
  - "PlatIngredientViewSet uses class-level permission_classes=[IsAuthenticated, IsGerant] for all actions — no read splitting, recipe links are GERANT-only operations"
  - "Test setUp uses autouse fixture on class-level to share gerant/serveur/plat/ingredient across all 4 test methods"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-05"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 3
  tests_added: 4
  tests_passed: 38
---

# Phase 18 Plan 04: PlatIngredientViewSet, Admin Registration, and Migrations Summary

**One-liner:** PlatIngredientViewSet exposing `/api/stock/plat-ingredients/` with GERANT-only RBAC, Django admin for both stock models, and stock migrations applied to live MySQL DB.

## What Was Built

### Task 1: PlatIngredientViewSet and admin registration (commit c5db43e)

**`apps/stock/views.py` extended:**
- Added `PlatIngredientViewSet(ModelViewSet)` with `permission_classes = [IsAuthenticated, IsGerant]` and `queryset = PlatIngredient.objects.select_related('plat', 'ingredient').all()`.
- Updated imports to include `PlatIngredient` and `PlatIngredientSerializer`.
- `IngredientViewSet` is unchanged.

**`apps/stock/urls.py` extended:**
- Added `router.register(r'plat-ingredients', PlatIngredientViewSet, basename='platIngredient')`.
- Produces all 6 standard DRF router endpoints under `/api/stock/plat-ingredients/`.

**`apps/stock/admin.py` created:**
- `IngredientAdmin` — `list_display`: nom, unite_mesure, stock_actuel, seuil_alerte, est_active, created_at. `list_filter`: unite_mesure, est_active. `search_fields`: nom.
- `PlatIngredientAdmin` — `list_display`: plat, ingredient, quantite_requise. `list_filter`: ingredient__unite_mesure. `search_fields`: plat__nom, ingredient__nom.

`docker compose exec backend python manage.py check` → 0 issues.

### Task 2: Apply migrations and extend API tests (commit d10b866)

**Migrations applied:**
- `makemigrations stock` → "No changes detected" (migrations already created in plan 18-01).
- `migrate` → `stock.0001_initial` OK, `menu.0003_plat_ingredients` OK.
- `migrate --check` → exit 0 (no pending migrations).

**`apps/stock/tests/test_api.py` extended with `TestPlatIngredientAPITest` (4 tests):**
- `test_gerant_can_create_link` — POST `/api/stock/plat-ingredients/` → 201, DB row created.
- `test_non_gerant_cannot_create` — SERVEUR POST → 403.
- `test_gerant_can_delete` — DELETE `/api/stock/plat-ingredients/{id}/` → 204, row removed.
- `test_unique_together_violation` — Second POST same plat+ingredient → 400.

Full suite: **38 passed in 13.35s** (4 new PlatIngredient API tests + 13 existing API tests + 14 model tests + 7 signal tests).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all endpoints wired to live DB-backed models. No placeholder data.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: new-endpoint | app/backend/apps/stock/views.py | New GERANT-only write endpoint /api/stock/plat-ingredients/ — protected by IsAuthenticated + IsGerant |

## Self-Check: PASSED

- [x] `app/backend/apps/stock/admin.py` — FOUND
- [x] `app/backend/apps/stock/views.py` has `PlatIngredientViewSet` — FOUND (line 33)
- [x] `app/backend/apps/stock/urls.py` has `plat-ingredients` — FOUND (line 6)
- [x] `app/backend/apps/stock/tests/test_api.py` has `TestPlatIngredientAPITest` — FOUND
- [x] `app/backend/apps/stock/migrations/0001_initial.py` — FOUND
- [x] `manage.py check` — 0 issues
- [x] `migrate --check` — 0 pending
- [x] 38 tests pass
- [x] commit c5db43e — FOUND (feat(18-04): add PlatIngredientViewSet, router registration, and admin)
- [x] commit d10b866 — FOUND (feat(18-04): add PlatIngredientAPITest and apply stock migrations)

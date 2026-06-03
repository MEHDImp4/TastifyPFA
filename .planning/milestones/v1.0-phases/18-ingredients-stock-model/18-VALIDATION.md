---
phase: "18"
status: PASSED
criteria_checked: 9
criteria_passed: 9
criteria_failed: 0
---

# Phase 18: Ingredients & Stock Model — Verification Report

**Phase Goal:** Build the Ingredients & Stock Model: Ingredient model with stock tracking, alert thresholds, and soft-delete; PlatIngredient M2M through-table linking dishes to ingredients; REST API with GERANT-only writes; real-time WebSocket low-stock alerts via Django signals; Django admin registration; migrations applied.

**Verified:** 2026-05-05
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Criterion-by-Criterion Results

### SC-1: Ingredient model with required fields ✅ PASS

`app/backend/apps/stock/models.py:4-31`

All required fields present and correctly typed:
- `nom = CharField(max_length=100, unique=True)` — line 11
- `unite_mesure = CharField(choices=[g/ml/pcs])` — line 12
- `stock_actuel = DecimalField(default=0)` — line 13
- `seuil_alerte = DecimalField(default=0)` — line 14
- `est_active = BooleanField(default=True)` — line 15 (soft-delete flag)
- `created_at = DateTimeField(auto_now_add=True)` — line 16
- `updated_at = DateTimeField(auto_now=True)` — line 17

Soft-delete implemented at lines 27-30: overrides `delete()` to set `est_active=False` and save rather than remove the row.

---

### SC-2: PlatIngredient through-table with FK, quantite_requise, unique_together ✅ PASS

`app/backend/apps/stock/models.py:33-52`

- FK to `menu.Plat` via `ForeignKey('menu.Plat', on_delete=CASCADE, related_name='plat_ingredients')` — line 34
- FK to `Ingredient` via `ForeignKey(Ingredient, on_delete=CASCADE, related_name='ingredient_plats')` — line 39
- `quantite_requise = DecimalField(max_digits=10, decimal_places=2)` — line 44
- `unique_together = ('plat', 'ingredient')` — line 47

---

### SC-3: Plat model has ingredients M2M via PlatIngredient ✅ PASS

`app/backend/apps/menu/models.py:71-76`

```python
ingredients = models.ManyToManyField(
    'stock.Ingredient',
    through='stock.PlatIngredient',
    related_name='plats',
    blank=True,
)
```

Through-table correctly specified. Migration `0003_plat_ingredients.py` wires this at the database level.

---

### SC-4: REST API GET /api/stock/ingredients/ (authenticated), write ops GERANT-only ✅ PASS

`app/backend/apps/stock/views.py:10-30`

`IngredientViewSet.get_permissions()` returns `[IsAuthenticated()]` for `list`/`retrieve` actions and `[IsAuthenticated(), IsGerant()]` for all other actions (create, update, destroy).

`app/backend/tastify_backend/urls.py:11`: `path('api/stock/', include('apps.stock.urls'))` mounts the stock router under `/api/stock/`.

`app/backend/apps/stock/urls.py:5`: `router.register(r'ingredients', IngredientViewSet, basename='ingredient')` makes the endpoint `/api/stock/ingredients/`.

---

### SC-5: REST API GET/POST/PATCH/DELETE /api/stock/plat-ingredients/ (GERANT-only) ✅ PASS

`app/backend/apps/stock/views.py:33-36`

`PlatIngredientViewSet` sets `permission_classes = [IsAuthenticated, IsGerant]` covering all actions. Registered at `router.register(r'plat-ingredients', ...)` in `urls.py:6`, resolving to `/api/stock/plat-ingredients/`.

---

### SC-6: Django signals fire WebSocket broadcast on threshold crossing only ✅ PASS

`app/backend/apps/stock/signals.py:7-36`

Two-signal pattern prevents alert spam:

1. `pre_save` handler (`capture_previous_stock`, line 7) captures `instance._old_stock` from DB before the update.
2. `post_save` handler (`alert_low_stock`, line 17) computes:
   - `is_now_low = instance.stock_actuel <= instance.seuil_alerte`
   - `was_low = old_stock is not None and old_stock <= instance.seuil_alerte`
   - Broadcasts **only if** `is_now_low and not was_low` — fires exactly on the crossing event.

Signals are auto-connected via `StockConfig.ready()` in `apps.py:10`: `import apps.stock.signals`.

`broadcast_staff_event` is imported lazily inside the handler (line 20) — patch path `core.realtime.broadcast_staff_event` used by tests is correct.

---

### SC-7: Django admin registers Ingredient and PlatIngredient ✅ PASS

`app/backend/apps/stock/admin.py`

- `@admin.register(Ingredient)` — line 5, with `list_display`, `list_filter`, `search_fields`
- `@admin.register(PlatIngredient)` — line 12, with `list_display`, `list_filter`, `search_fields`

Both models are fully registered with display configuration, not bare stubs.

---

### SC-8: Migrations 0001_initial (stock) and 0003_plat_ingredients (menu) present ✅ PASS

`app/backend/apps/stock/migrations/0001_initial.py`: Django 5.0.14 generated migration. Creates `Ingredient` and `PlatIngredient` models with all fields and `unique_together` constraint. Depends on `('menu', '0002_plat')`.

`app/backend/apps/menu/migrations/0003_plat_ingredients.py`: Adds `ingredients` ManyToManyField to `Plat` via `through='stock.PlatIngredient'`. Depends on both `('menu', '0002_plat')` and `('stock', '0001_initial')` — dependency chain is correct.

Static verification of `migrate --check` passes: both migration files are complete, non-empty, and have no `RunPython` stubs or `TODO` markers.

---

### SC-9: All 38 tests present (14 model + 13 API IngredientViewSet + 4 API PlatIngredientViewSet + 7 signals) ✅ PASS

Test count verified by grep across all three test files:

| File | Tests | Breakdown |
|------|-------|-----------|
| `test_models.py` | 14 | `TestIngredientModel` (8) + `TestPlatIngredientModel` (6) |
| `test_api.py` | 17 | `TestIngredientCRUD` (5) + `TestIngredientPermissions` (5) + `TestIngredientActiveFiltering` (3) = 13 IngredientViewSet; `TestPlatIngredientAPITest` (4) |
| `test_signals.py` | 7 | `TestStockAlertSignal` (7) |
| **Total** | **38** | matches criterion exactly |

Tests cover all critical behaviors: model constraints, soft-delete, permission enforcement (GERANT/non-GERANT/unauthenticated), active filtering, threshold-crossing logic (both directions, exact threshold, creation below threshold, payload structure).

---

## Summary

All 9 success criteria verified against actual source code. No stubs, placeholders, or disconnected wiring found. The phase goal is fully achieved.

_Verified: 2026-05-05_
_Verifier: Claude (gsd-verifier)_

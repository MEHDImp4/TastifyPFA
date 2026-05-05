---
phase: "18-ingredients-stock-model"
plan: "18-01"
subsystem: "backend/stock"
tags: ["django", "models", "soft-delete", "m2m", "migrations", "tdd"]
dependency_graph:
  requires: []
  provides:
    - "apps.stock.Ingredient model with soft-delete and base-unit constraints"
    - "apps.stock.PlatIngredient through-table with unique_together"
    - "apps.menu.Plat M2M ingredients field via PlatIngredient"
    - "Initial migrations for stock app and menu.Plat"
    - "Signal scaffolding for low-stock WebSocket alerts"
  affects:
    - "apps/menu/models.py"
    - "tastify_backend/settings/base.py"
tech_stack:
  added:
    - "apps.stock Django app"
  patterns:
    - "Soft-delete override of Model.delete() — mirrors Categorie and Plat patterns"
    - "ManyToManyField(through=...) — D-01 direct through-table approach"
    - "pre_save + post_save signals for threshold-crossing WebSocket alert (D-05, D-06)"
key_files:
  created:
    - "app/backend/apps/stock/__init__.py"
    - "app/backend/apps/stock/apps.py"
    - "app/backend/apps/stock/models.py"
    - "app/backend/apps/stock/signals.py"
    - "app/backend/apps/stock/migrations/__init__.py"
    - "app/backend/apps/stock/migrations/0001_initial.py"
    - "app/backend/apps/stock/tests/__init__.py"
    - "app/backend/apps/stock/tests/test_models.py"
    - "app/backend/apps/menu/migrations/0003_plat_ingredients.py"
  modified:
    - "app/backend/apps/menu/models.py"
    - "app/backend/tastify_backend/settings/base.py"
decisions:
  - "Used 'menu.Plat' string FK in PlatIngredient to avoid circular import — stock app cannot import from menu at module level"
  - "Signals import broadcast_staff_event lazily inside the handler to prevent AppRegistry issues at startup"
  - "Test settings (SQLite) used for model tests because MySQL test DB requires GRANT CREATE — confirmed consistent with existing test infrastructure"
metrics:
  duration: "~30 minutes"
  completed: "2026-05-05"
  tasks_completed: 2
  tasks_total: 2
  files_created: 9
  files_modified: 2
  tests_added: 14
  tests_passed: 14
---

# Phase 18 Plan 01: Stock App — Ingredient & PlatIngredient Models Summary

**One-liner:** `apps.stock` Django app with Ingredient soft-delete model, PlatIngredient through-table M2M, and 14 passing pytest model tests.

## What Was Built

### Task 1: Stock App and Models (commit f88ef33)

Created the full `apps/stock/` Django app scaffolding:

- **`Ingredient` model** — fields: `nom` (unique), `unite_mesure` (choices: g/ml/pcs), `stock_actuel` (Decimal), `seuil_alerte` (Decimal), `est_active` (Bool), `created_at`, `updated_at`. Custom `delete()` sets `est_active=False` without removing the row (matches existing Categorie/Plat pattern).
- **`PlatIngredient` through-model** — FK to `menu.Plat` (string reference to avoid circular import), FK to `Ingredient`, `quantite_requise` (Decimal), `unique_together = ('plat', 'ingredient')`.
- **`Plat` M2M update** — Added `ingredients = ManyToManyField('stock.Ingredient', through='stock.PlatIngredient', related_name='plats', blank=True)` to `apps/menu/models.py` per D-01.
- **Signals** — `pre_save` captures old stock level; `post_save` broadcasts `stock.alert` via `broadcast_staff_event` only when the threshold is newly crossed (prevents alert spam per Research Pitfall 2).
- **Migrations** — `apps/stock/migrations/0001_initial.py` and `apps/menu/migrations/0003_plat_ingredients.py` generated and verified with `makemigrations --dry-run`.
- **INSTALLED_APPS** — `apps.stock` registered in `tastify_backend/settings/base.py`.

### Task 2: Model Tests (commit d2ed131)

14 pytest tests in `apps/stock/tests/test_models.py`:

**TestIngredientModel (8 tests):**
- `test_creation` — record created with correct defaults
- `test_nom_unique_constraint` — IntegrityError on duplicate nom
- `test_soft_delete_sets_inactive` — `delete()` sets `est_active=False`
- `test_soft_delete_preserves_row` — DB row survives `delete()`
- `test_str_representation` — `__str__` returns nom
- `test_default_stock_and_alert` — defaults to 0 for stock/alert
- `test_unite_mesure_choices` — g, ml, pcs all accepted
- `test_ordering_by_nom` — queryset is alphabetically ordered

**TestPlatIngredientModel (6 tests):**
- `test_creation` — record created with quantite_requise
- `test_unique_together_constraint` — IntegrityError on duplicate (plat, ingredient)
- `test_plat_m2m_relation` — `plat.ingredients.all()` resolves correctly
- `test_ingredient_plats_reverse_relation` — `ingredient.plats.all()` resolves correctly
- `test_multiple_ingredients_per_plat` — plat can link to many distinct ingredients
- `test_str_representation` — includes ingredient nom and quantite

All 14 tests pass: `14 passed in 2.31s`.

## Deviations from Plan

### Auto-added: Signal scaffolding (Rule 2 — Missing critical functionality)

The plan specified creating the `stock` app but did not explicitly include `signals.py`. Per D-05 and D-06 (locked decisions from CONTEXT.md), the low-stock WebSocket alert is a correctness requirement for this domain. The `pre_save`/`post_save` signal implementation was added during Task 1 as an essential part of the model layer (signals wired via `apps.py`'s `ready()` hook).

### No architectural deviations.

## Known Stubs

None — models are fully wired with real DB-backed fields. No placeholder data.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced in this plan.

## Self-Check

- [x] `app/backend/apps/stock/models.py` — FOUND
- [x] `app/backend/apps/stock/apps.py` — FOUND
- [x] `app/backend/apps/stock/signals.py` — FOUND
- [x] `app/backend/apps/stock/migrations/0001_initial.py` — FOUND
- [x] `app/backend/apps/menu/migrations/0003_plat_ingredients.py` — FOUND
- [x] `app/backend/apps/stock/tests/test_models.py` — FOUND
- [x] commit f88ef33 — FOUND (feat(18-01): create stock app)
- [x] commit d2ed131 — FOUND (feat(18-01): add model tests)

## Self-Check: PASSED

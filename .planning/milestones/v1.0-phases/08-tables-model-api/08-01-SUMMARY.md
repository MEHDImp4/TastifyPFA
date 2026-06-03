---
phase: 08-tables-model-api
plan: 01
subsystem: backend/tables
tags: [django, model, soft-delete, tables]
requires: [apps.menu pattern]
provides: [Table model, TableQuerySet, TableManager, 0001_initial migration]
affects: [backend/tastify_backend/settings/base.py, backend/apps/tables/]
tech-stack:
  added: []
  patterns: [soft-delete, TextChoices enum, custom QuerySet manager]
key-files:
  created:
    - backend/apps/tables/__init__.py
    - backend/apps/tables/apps.py
    - backend/apps/tables/models.py
    - backend/apps/tables/admin.py
    - backend/apps/tables/migrations/__init__.py
    - backend/apps/tables/migrations/0001_initial.py
    - backend/apps/tables/tests/__init__.py
    - backend/apps/tables/tests/test_model.py
    - backend/apps/tables/management/__init__.py
    - backend/apps/tables/management/commands/__init__.py
  modified:
    - backend/tastify_backend/settings/base.py
key-decisions:
  - Table.delete() sets est_active=False + save(), no super().delete() — mirrors Categorie/Plat pattern exactly
  - Statut.ENCAISSEMENT max_length=20 covers 12-char value with headroom
  - pos_x/pos_y as FloatField(default=0.0) for Phase 9 map dependency (D-08-01)
requirements-completed: []
duration: 8 min
completed: 2026-04-28
---

# Phase 8 Plan 01: Tables App Scaffold & Model Summary

Table model with Statut TextChoices (4 values), soft-delete via delete() override, pos_x/pos_y FloatFields, and TableQuerySet.active() manager — mirrors Categorie/Plat pattern exactly.

**Duration:** 8 min | **Tasks:** 3 | **Files:** 11

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Scaffold apps/tables/ directory structure | 83df7ae | 10 files |
| 2 | Define Table model, soft-delete pattern, Wave 0 tests | 83df7ae | models.py, test_model.py |
| 3 | Register TableAdmin and generate migration | 83df7ae | admin.py, 0001_initial.py |

## Model Fields

| Field | Type | Default |
|-------|------|---------|
| numero | PositiveIntegerField(unique=True) | — |
| capacite | PositiveIntegerField | — |
| statut | CharField(max_length=20, choices=Statut) | LIBRE |
| pos_x | FloatField | 0.0 |
| pos_y | FloatField | 0.0 |
| est_active | BooleanField | True |
| created_at | DateTimeField(auto_now_add=True) | — |
| updated_at | DateTimeField(auto_now=True) | — |

## Test Results

- `test_delete_sets_inactive` — PASS
- `test_delete_does_not_remove_row` — PASS
- `test_active_manager_filters_inactive` — PASS

**3/3 tests green.**

## Deviations

None. `apps.tables` was already present in INSTALLED_APPS and the scaffold __init__ files already existed (prior partial work). Task 1 criteria were fully met at plan start.

## Next

Ready for 08-02 (serializer + viewset + URL).

## Self-Check: PASSED

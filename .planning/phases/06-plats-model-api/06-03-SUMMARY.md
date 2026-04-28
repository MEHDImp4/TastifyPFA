---
phase: 06-plats-model-api
plan: 03
subsystem: backend
tags:
  - seeding
  - testing
  - management-command
requires:
  - 06-02
provides:
  - seed_menu
  - integration-tests
affects:
  - apps.menu.management
  - apps.menu.tests
tech_stack:
  - django-management-commands
  - rest-framework-test
key_files_created:
  - backend/apps/menu/management/__init__.py
  - backend/apps/menu/management/commands/__init__.py
  - backend/apps/menu/management/commands/seed_menu.py
  - backend/apps/menu/tests/test_plats_api.py
key_files_modified: []
key_decisions:
  - Implemented idempotent seeding using get_or_create scoped to (categorie, nom).
  - Used force_authenticate in tests to avoid JWT overhead.
duration: 20 minutes
completed_date: 2026-04-28
---

# Phase 06 Plan 03: Plat API Seeding and Integration Tests Summary

Implemented the dev seeding command (`seed_menu`) and integration tests for the Plat API.

## Seeding Command

- Created standard Django `management/commands/` directory structure.
- Implemented `seed_menu.py` with idempotent behavior (no duplicate records on re-run).
- Seeded 3 categories and 9 dishes (3 per category).

## Integration Tests

- Created `test_plats_api.py` with 6 integration tests.
- Verified successful list operations, creation, RBAC checks (GERANT only for creation).
- Verified soft-delete (`DELETE` sets `est_active=False` without DB row removal).
- Verified dual-flag visibility: non-GERANTs cannot see `est_active=False` or `est_disponible=False` dishes in list, nor via direct ID lookup (404).

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
- FOUND: backend/apps/menu/management/__init__.py
- FOUND: backend/apps/menu/management/commands/__init__.py
- FOUND: backend/apps/menu/management/commands/seed_menu.py
- FOUND: backend/apps/menu/tests/test_plats_api.py
- Commits verified.

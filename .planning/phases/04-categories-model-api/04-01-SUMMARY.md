---
phase: 04-categories-model-api
plan: 01
subsystem: backend
tags: [django, model, soft-delete, media, pillow, django-cleanup]
dependency_graph:
  requires: [apps.users, core]
  provides: [apps.menu.Categorie, CategorieManager, CategorieQuerySet]
  affects: [backend/tastify_backend/settings/base.py, docker-compose.yml]
tech_stack:
  added: [Pillow==11.2.1, django-cleanup==8.1.0]
  patterns: [soft-delete via override, custom QuerySet/Manager, ImageField with upload_to]
key_files:
  created:
    - backend/apps/menu/__init__.py
    - backend/apps/menu/apps.py
    - backend/apps/menu/admin.py
    - backend/apps/menu/migrations/__init__.py
    - backend/apps/menu/migrations/0001_initial.py
    - backend/apps/menu/models.py
    - backend/apps/menu/tests/__init__.py
    - backend/apps/menu/tests/test_soft_delete.py
  modified:
    - backend/requirements.txt
    - backend/tastify_backend/settings/base.py
    - backend/apps/users/models.py
    - docker-compose.yml
decisions:
  - "Soft delete implemented via model-layer delete() override (not middleware or signal) — keeps deletion logic co-located with the model per D-07"
  - "Bind mount ./media:/app/media chosen over named volume so uploaded images are host-accessible for debugging"
  - "django_cleanup placed after apps.menu in INSTALLED_APPS to ensure post_delete signals are registered on Categorie"
metrics:
  duration: "6 minutes"
  completed: "2026-04-28T09:38:08Z"
  tasks_completed: 2
  files_created: 8
  files_modified: 4
---

# Phase 4 Plan 01: Categories Model & App Scaffold Summary

**One-liner:** Categorie Django model with 7 fields, soft-delete override, CategorieManager.active(), Pillow/django-cleanup installed, media storage configured.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Scaffold menu app, install dependencies, configure media | `4ae911e` | Done |
| 2 | Implement Categorie model with soft delete and Wave 0 test stubs | `d3934fe` | Done |

## Files Created

| File | Purpose |
|------|---------|
| `backend/apps/menu/__init__.py` | Django app package marker |
| `backend/apps/menu/apps.py` | MenuConfig with name='apps.menu' |
| `backend/apps/menu/admin.py` | CategorieAdmin with list_display, list_filter, search_fields |
| `backend/apps/menu/migrations/__init__.py` | Migrations package marker |
| `backend/apps/menu/migrations/0001_initial.py` | Initial migration — creates menu_categorie table |
| `backend/apps/menu/models.py` | Categorie model, CategorieQuerySet, CategorieManager |
| `backend/apps/menu/tests/__init__.py` | Tests package marker |
| `backend/apps/menu/tests/test_soft_delete.py` | Wave 0 — 4 soft-delete tests (all green) |

## Files Modified

| File | Change |
|------|--------|
| `backend/requirements.txt` | Added Pillow==11.2.1, django-cleanup==8.1.0 |
| `backend/tastify_backend/settings/base.py` | Added 'apps.menu', 'django_cleanup' to INSTALLED_APPS; added MEDIA_URL, MEDIA_ROOT |
| `docker-compose.yml` | Added ./media:/app/media bind mount to backend volumes |
| `backend/apps/users/models.py` | Bug fix: removed invalid 3rd tuple element from TextChoices (see Deviations) |

## Migration Generated

**Name:** `apps/menu/migrations/0001_initial.py`
**Creates:** `menu_categorie` table with columns: id, nom, description, ordre_affichage, image, est_active, created_at, updated_at

## Libraries Added

| Library | Version | Purpose |
|---------|---------|---------|
| Pillow | 11.2.1 | ImageField validation — ensures uploaded files are real images |
| django-cleanup | 8.1.0 | Auto-deletes image files from disk when Categorie is hard-deleted |

## Test Results

```
Ran 4 tests in 0.046s — OK
test_active_manager_after_soft_delete ... ok
test_active_manager_filters_inactive  ... ok
test_delete_does_not_remove_row       ... ok
test_delete_sets_inactive             ... ok
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 3-tuple TextChoices incompatible with Python 3.12**
- **Found during:** Task 2 (migration run — `manage.py check` crashed)
- **Issue:** `apps/users/models.py` used 3-tuple TextChoices values (`'GERANT', 'Gérant', 'gerant'`). Python 3.12 `enum.__new__` only accepts `(value, label)` 2-tuples; the 3rd element caused `TypeError: decoding str is not supported`.
- **Fix:** Removed 3rd tuple element from all 4 Role choices, leaving standard `(value, label)` pairs.
- **Files modified:** `backend/apps/users/models.py`
- **Commit:** `d3934fe`

## Known Stubs

None — all model fields are wired to real DB columns; no placeholder data flows to UI at this layer.

## Threat Surface Scan

No new network endpoints or auth paths introduced. The `ImageField(upload_to='categories/')` restricts upload paths as per T-04-02. `django_cleanup` post-delete signals are attached by placing it after `apps.menu` in INSTALLED_APPS (T-04-04 accepted risk verified).

## Self-Check: PASSED

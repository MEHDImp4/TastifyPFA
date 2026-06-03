---
phase: 06-plats-model-api
plan: 02
subsystem: backend/menu
tags: [api, rbac, plats]
requires: [06-01]
provides: [plat-api]
affects: [backend]
tech-stack: [django, drf]
key-files:
  modified:
    - backend/apps/menu/serializers.py
    - backend/apps/menu/views.py
    - backend/apps/menu/urls.py
key-decisions:
  - "Used `use_url=True` on `PlatSerializer.image` for absolute URLs."
  - "Implemented dual-flag filtering logic for non-GERANTs: `Plat.objects.active().filter(est_disponible=True)`."
  - "Ensured `destroy()` performs a soft-delete (setting `est_active=False`) mimicking the `Categorie` implementation."
  - "Allowed optional `categorie` filtering logic in `get_queryset` for all authenticated users."
metrics:
  duration: 45
  tasks-completed: 2
  tasks-total: 2
  files-modified: 3
  files-created: 0
---

# Phase 06 Plan 02: Plat Model API Implementation Summary

Implemented the REST API layer for Plats, exposing complete CRUD for GERANT and restricted, filtered reads for other roles.

## Deviations from Plan

None - plan executed exactly as written.

## Implementation Details

### API Endpoints (`/api/plats/`)

- `GET /api/plats/`
  - Required permission: Authenticated
  - Behavior: GERANT receives all dishes (including soft-deleted). Non-GERANTs receive only `est_active=True` AND `est_disponible=True`.
- `POST /api/plats/`
  - Required permission: GERANT
  - Behavior: Creates a new dish. 403 for non-GERANT roles.
- `GET /api/plats/{id}/`
  - Required permission: Authenticated
  - Behavior: GERANT can view any. Non-GERANT gets 404 if dish is inactive or unavailable.
- `PATCH / PUT /api/plats/{id}/`
  - Required permission: GERANT
  - Behavior: Update dish fields. 403 for others.
- `DELETE /api/plats/{id}/`
  - Required permission: GERANT
  - Behavior: Soft deletes by setting `est_active=False`. Returns 204.

### Query Parameters

- `?categorie=<id>`: Filters dishes strictly to the specified category. Applicable to all roles (adheres to visibility rules).

### Code Changes

1. **`backend/apps/menu/serializers.py`**
   - Added `PlatSerializer` exposing all 11 model fields.
   - Enforced `read_only_fields` for `id`, `created_at`, `updated_at`.
   - Set `image` to use absolute URL strings.
2. **`backend/apps/menu/views.py`**
   - Added `PlatViewSet` and imported `Plat`, `PlatSerializer`.
   - Applied role-based authorization branching via `get_permissions()`.
   - Replaced default queryset with dynamic dual-flag visibility filters.
   - Overrode `destroy()` to maintain data integrity (soft delete).
3. **`backend/apps/menu/urls.py`**
   - Registered `PlatViewSet` onto the existing default router.

## Threat Flags

None found. All modifications correspond to mitigated trust boundaries as specified in the threat model.

## Self-Check: PASSED

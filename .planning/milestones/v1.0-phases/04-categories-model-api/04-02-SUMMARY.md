---
phase: 04-categories-model-api
plan: 02
subsystem: backend
tags: [django, drf, viewset, rbac, visibility, serializer, url-routing, media]
dependency_graph:
  requires: [apps.menu.Categorie, apps.users.permissions.IsGerant, tastify_backend.settings.MEDIA_URL]
  provides: [GET /api/categories/, POST /api/categories/, PATCH /api/categories/{id}/, DELETE /api/categories/{id}/]
  affects: [backend/tastify_backend/urls.py]
tech_stack:
  added: []
  patterns: [ModelViewSet with action-based permissions, queryset filtering by role, soft-delete via destroy() override]
key_files:
  created:
    - backend/apps/menu/serializers.py
    - backend/apps/menu/views.py
    - backend/apps/menu/urls.py
    - backend/apps/menu/tests/test_api.py
    - backend/apps/menu/tests/test_rbac.py
    - backend/apps/menu/tests/test_visibility.py
  modified:
    - backend/tastify_backend/urls.py
decisions:
  - "get_permissions() uses explicit action whitelist ('list', 'retrieve') — any new custom action defaults to requiring IsGerant (fail-secure per T-04-09)"
  - "get_queryset() uses string comparison user.role == 'GERANT' matching the TextChoices value stored in DB"
  - "destroy() calls instance.delete() (soft-delete override) and returns 204 — super().destroy() never called (T-04-08)"
  - "Both 'api/' include() entries are intentional — core.urls only has '' root path, no conflict with 'categories/' prefix"
metrics:
  duration: "15 minutes"
  completed: "2026-04-28T09:42:58Z"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
---

# Phase 4 Plan 02: Categories API Layer Summary

**One-liner:** CategorieViewSet (ModelViewSet) with RBAC (D-05), visibility filtering (D-06), soft-delete (D-07), wired at /api/categories/ via DefaultRouter, 16 tests green.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Create CategorieSerializer and integration test stubs | `c34a635` | Done |
| 2 | Implement CategorieViewSet, URL wiring, all tests green | `34aafa4` | Done |

## Files Created

| File | Purpose |
|------|---------|
| `backend/apps/menu/serializers.py` | CategorieSerializer with ImageField use_url=True — generates absolute URLs when request context present |
| `backend/apps/menu/views.py` | CategorieViewSet: action-based permissions (D-05), role-filtered queryset (D-06), soft-delete destroy() (D-07) |
| `backend/apps/menu/urls.py` | DefaultRouter registering CategorieViewSet at 'categories' prefix |
| `backend/apps/menu/tests/test_api.py` | CategorieAPITest — 4 tests: list, create, patch, soft-delete via API |
| `backend/apps/menu/tests/test_rbac.py` | RBACTest — 5 tests: serveur/cuisinier/client forbidden, gerant allowed, unauthenticated 401 |
| `backend/apps/menu/tests/test_visibility.py` | VisibilityTest — 3 tests: non-gerant sees only active, gerant sees all, 404 on inactive by ID |

## Files Modified

| File | Change |
|------|--------|
| `backend/tastify_backend/urls.py` | Added `from django.conf import settings`, `from django.conf.urls.static import static`, `path('api/', include('apps.menu.urls'))`, and DEBUG media serving |

## API Endpoint List

| Method | URL | Permission | Notes |
|--------|-----|-----------|-------|
| GET | /api/categories/ | IsAuthenticated | Non-GERANT sees only est_active=True |
| POST | /api/categories/ | IsAuthenticated + IsGerant | 403 for SERVEUR/CUISINIER/CLIENT |
| GET | /api/categories/{id}/ | IsAuthenticated | 404 for non-GERANT on inactive category |
| PUT | /api/categories/{id}/ | IsAuthenticated + IsGerant | 403 for non-GERANT |
| PATCH | /api/categories/{id}/ | IsAuthenticated + IsGerant | 403 for non-GERANT |
| DELETE | /api/categories/{id}/ | IsAuthenticated + IsGerant | Soft delete — sets est_active=False, returns 204 |

## Test Results

```
Ran 16 tests in 8.915s — OK

test_create_category ... ok
test_list_categories ... ok
test_partial_update_category ... ok
test_soft_delete_via_api ... ok
test_client_cannot_write ... ok
test_cuisinier_cannot_write ... ok
test_gerant_can_create ... ok
test_serveur_cannot_write ... ok
test_unauthenticated_cannot_access ... ok
test_active_manager_after_soft_delete ... ok
test_active_manager_filters_inactive ... ok
test_delete_does_not_remove_row ... ok
test_delete_sets_inactive ... ok
test_gerant_sees_all_categories ... ok
test_inactive_category_not_directly_accessible_by_non_gerant ... ok
test_non_gerant_sees_only_active ... ok
```

Total: 16/16 (4 soft_delete + 4 api + 5 rbac + 3 visibility)

## URL Routing Notes

No conflicts: `core.urls` only exposes `path('', health)` at the `api/` prefix root. The `apps.menu.urls` patterns use the `categories/` prefix, which does not overlap. Both `path('api/', include(...))` entries coexist correctly — Django evaluates patterns in order and both resolve independently.

## Deviations from Plan

None — plan executed exactly as written. The container-based test run required `docker cp` to sync files since the worktree lacks the `.env` file needed by `docker compose exec`. This is normal for parallel worktree execution.

## Known Stubs

None — all endpoints are fully wired to real DB data. No placeholder values in responses.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: auth-boundary | `backend/apps/menu/views.py` | New write endpoints (POST/PATCH/DELETE) at /api/categories/ enforced by IsAuthenticated + IsGerant (T-04-05 mitigated) |
| threat_flag: information-disclosure | `backend/apps/menu/views.py` | get_queryset() ORM filter enforces row-level visibility (T-04-06 mitigated) |

## Self-Check: PASSED

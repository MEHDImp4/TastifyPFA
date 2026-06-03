phase: 04-categories-model-api
verified: 2026-05-01
status: passed
score: 13/13 must-haves verified
re_verification: true
human_verification:
  - test: "POST /api/categories/ with a multipart image file (e.g. a JPEG)"
    expected: "201 response, file appears under backend/media/categories/, image field in response is an absolute URL (http://testserver/media/categories/filename.jpg)"
    status: ✅ PASS (Confirmed by user 2026-05-06)
  - test: "PATCH /api/categories/{id}/ with a new image, then verify the old file is removed from media/"
    expected: "Old image file is deleted from disk by django-cleanup; new file is present"
    status: ✅ PASS (Confirmed by user 2026-05-06)
---

# Phase 4: Categories Model & API — Verification Report

**Phase Goal:** Category DB and REST API — API allows CRUD on categories with RBAC and soft-delete.
**Verified:** 2026-05-01
**Status:** passed
**Re-verification:** Yes — reconciled via UAT audit

---

## Step 0: Previous Verification

Initial verification marked as `human_needed`. Reconciled on 2026-05-01 after confirming code presence and integration.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The `menu` app exists as a Django app under backend/apps/menu/ | VERIFIED | `backend/apps/menu/__init__.py`, `apps.py`, `models.py`, `serializers.py`, `views.py`, `urls.py` all present |
| 2 | The `Categorie` model has all 7 fields: nom, description, ordre_affichage, image, est_active, created_at, updated_at | VERIFIED | models.py lines 18-24 define all 7 fields with correct types and options |
| 3 | Calling .delete() on a Categorie instance sets est_active=False without removing the DB row | VERIFIED | models.py lines 36-39: override sets `est_active=False` and calls `self.save(update_fields=[...])` — no `super().delete()` call |
| 4 | The CategorieManager exposes .active() returning only est_active=True rows | VERIFIED | models.py lines 4-14: CategorieQuerySet.active() and CategorieManager.active() both implemented and chained correctly |
| 5 | MEDIA_ROOT and MEDIA_URL are defined in base.py and the media volume is in docker-compose.yml | VERIFIED | base.py lines 124-125: `MEDIA_URL = '/media/'`, `MEDIA_ROOT = BASE_DIR / 'media'`; docker-compose.yml line 39: `./media:/app/media` |
| 6 | django-cleanup is installed and listed in INSTALLED_APPS after apps.menu | VERIFIED | base.py lines 26-27: `'apps.menu'` then `'django_cleanup'` in correct order |
| 7 | Pillow is in requirements.txt | VERIFIED | requirements.txt line 12: `Pillow==11.2.1` |
| 8 | GET /api/categories/ returns 200 for any authenticated user | VERIFIED | views.py get_permissions(): list action returns `[IsAuthenticated()]` only; test_api.py test_list_categories and test_visibility.py test_non_gerant_sees_only_active confirm HTTP 200 |
| 9 | POST /api/categories/ returns 403 for SERVEUR, CUISINIER, CLIENT | VERIFIED | views.py get_permissions(): non-list/retrieve actions return `[IsAuthenticated(), IsGerant()]`; test_rbac.py _assert_write_forbidden covers all three roles |
| 10 | DELETE /api/categories/{id}/ returns 204 for GERANT and sets est_active=False (no row removed) | VERIFIED | views.py destroy() calls instance.delete() and returns HTTP_204_NO_CONTENT; test_api.py test_soft_delete_via_api asserts both conditions |
| 11 | GET /api/categories/ returns only est_active=True categories for non-GERANT users | VERIFIED | views.py get_queryset() returns `Categorie.objects.active()` for non-GERANT; test_visibility.py test_non_gerant_sees_only_active confirmed |
| 12 | GET /api/categories/ returns ALL categories (including est_active=False) for GERANT | VERIFIED | views.py get_queryset() returns `Categorie.objects.all()` for GERANT role; test_visibility.py test_gerant_sees_all_categories confirmed |
| 13 | /api/categories/ is routed and reachable (not 404) | VERIFIED | urls.py registers DefaultRouter with `categories` prefix; tastify_backend/urls.py line 10 includes `apps.menu.urls` at `api/` prefix |

**Score:** 13/13 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `backend/apps/menu/models.py` | Categorie model, CategorieQuerySet, CategorieManager | VERIFIED | All three classes present; 40 lines of substantive code |
| `backend/apps/menu/serializers.py` | CategorieSerializer with image URL generation | VERIFIED | CategorieSerializer with `use_url=True` on ImageField |
| `backend/apps/menu/views.py` | CategorieViewSet with RBAC and visibility filtering | VERIFIED | get_permissions(), get_queryset(), destroy() all implemented |
| `backend/apps/menu/urls.py` | Router-based URL config for CategorieViewSet | VERIFIED | DefaultRouter with `categories` registration |
| `backend/tastify_backend/settings/base.py` | MEDIA_ROOT, MEDIA_URL, INSTALLED_APPS with apps.menu and django_cleanup | VERIFIED | All three present; django_cleanup correctly ordered after apps.menu |
| `backend/apps/menu/tests/test_soft_delete.py` | SoftDeleteTest class with 4 tests | VERIFIED | class SoftDeleteTest with 4 test methods covering D-07 |
| `backend/apps/menu/tests/test_rbac.py` | RBACTest class | VERIFIED | class RBACTest with 5 test methods covering D-05 |
| `backend/apps/menu/tests/test_visibility.py` | VisibilityTest class | VERIFIED | class VisibilityTest with 3 test methods covering D-06 |
| `backend/apps/menu/tests/test_api.py` | CategorieAPITest class | VERIFIED | class CategorieAPITest with 4 test methods covering D-04 |
| `backend/apps/menu/migrations/0001_initial.py` | Initial migration creating menu_categorie | VERIFIED | Migration generated 2026-04-28, all 7 fields present |
| `docker-compose.yml` | Media bind mount in backend volumes | VERIFIED | `./media:/app/media` on line 39 |
| `backend/requirements.txt` | Pillow and django-cleanup | VERIFIED | Pillow==11.2.1 and django-cleanup==8.1.0 present |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `backend/tastify_backend/settings/base.py` | `backend/apps/menu` | `INSTALLED_APPS` entry `'apps.menu'` | WIRED | Line 26 of base.py: `'apps.menu'` |
| `backend/apps/menu/models.py` | `backend/media/categories/` | `ImageField upload_to='categories/'` | WIRED | Line 21 of models.py: `upload_to='categories/'` |
| `backend/apps/menu/views.py` | `backend/apps/users/permissions.py` | `from apps.users.permissions import IsGerant` | WIRED | Line 5 of views.py; IsGerant used on line 17 |
| `backend/apps/menu/views.py" | `backend/apps/menu/models.py` | `Categorie.objects.all()` and `Categorie.objects.active()` | WIRED | Lines 23-24 of views.py |
| `backend/tastify_backend/urls.py` | `backend/apps/menu/urls.py` | `include('apps.menu.urls')` | WIRED | Line 10 of urls.py |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `backend/apps/menu/views.py` (CategorieViewSet) | queryset returned by get_queryset() | `Categorie.objects.all()` / `Categorie.objects.active()` — ORM queries against `menu_categorie` DB table | Yes — live DB query via CategorieManager | FLOWING |
| `backend/apps/menu/serializers.py" (CategorieSerializer) | image field | `ImageField(use_url=True)` — generates URL from stored file path, absolute URL when request context present | Yes — DRF resolves URL using request.build_absolute_uri | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: PASS (Manual verification complete 2026-05-05)

The following logic-path checks were confirmed by code inspection and manual verification:

| Behavior | Evidence | Status |
|----------|----------|--------|
| `destroy()` never calls `super().destroy()` | views.py: destroy() calls `instance.delete()` then `return Response(HTTP_204)` — no `super()` call | PASS |
| `get_queryset()` branches on exact string `'GERANT'` matching TextChoices stored value | views.py line 22: `user.role == 'GERANT'` matches `User.Role.GERANT = 'GERANT'` | PASS |
| `django_cleanup` ordered after `apps.menu` in INSTALLED_APPS | base.py lines 26-27 confirm ordering | PASS |
| `CategorieSerializer.image` produces absolute URLs | `use_url=True` on ImageField; DRF ModelViewSet passes request context automatically | PASS (human verify for live URL) |
| Unauthenticated access returns 401 | test_rbac.py test_unauthenticated_cannot_access; global DRF config `IsAuthenticated` default | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| D-01 | 04-01-PLAN.md | Create `menu` Django app in backend/apps/ | SATISFIED | backend/apps/menu/ exists with apps.py, MenuConfig registered in INSTALLED_APPS |
| D-02 | 04-01-PLAN.md | Model named `Categorie` | SATISFIED | `class Categorie(models.Model)` in models.py |
| D-03 | 04-01-PLAN.md | 7 fields: nom, description, ordre_affichage, image, est_active, created_at, updated_at | SATISFIED | All 7 fields present in models.py with correct types (CharField max_length=100 unique, TextField blank=True, PositiveIntegerField default=0, ImageField upload_to=categories/, BooleanField default=True, auto_now_add, auto_now) |
| D-04 | 04-02-PLAN.md | Endpoints: GET/POST /api/categories/, PATCH/DELETE /api/categories/{id}/ | SATISFIED | DefaultRouter registers all standard CRUD actions; included at api/ in root urls.py |
| D-05 | 04-02-PLAN.md | RBAC: GERANT full CRUD; SERVEUR/CUISINIER/CLIENT read-only | SATISFIED | get_permissions() returns IsGerant for write actions; test_rbac.py covers all 4 role permutations |
| D-06 | 04-02-PLAN.md | Visibility: non-GERANT sees only est_active=True; GERANT sees all | SATISFIED | get_queryset() returns `Categorie.objects.active()` for non-GERANT; test_visibility.py covers both paths including 404 on inactive by ID |
| D-07 | 04-01-PLAN.md | Soft delete: DELETE sets est_active=False, does not remove DB row | SATISFIED | model delete() override; ViewSet destroy() calls it; test_soft_delete.py (4 tests) and test_api.py test_soft_delete_via_api both verify |

All 7 declared requirement IDs (D-01 through D-07) are satisfied. Note: D-08 (dependency impact on Plats API) is defined in CONTEXT.md but was NOT claimed by any plan in this phase and is correctly deferred to Phase 6.

---

### Anti-Patterns Found

No anti-patterns detected. Scan of all backend/apps/menu/ files found:
- Zero TODO/FIXME/PLACEHOLDER/HACK comments
- Zero `return null` / `return []` / `return {}` stubs
- Zero empty handler implementations
- No hardcoded empty data flowing to rendering paths

---

### Human Verification Required

#### 1. Image Upload — Absolute URL in API Response

**Test:** POST to `http://localhost/api/categories/` with a multipart body containing a valid JPEG image file and `Content-Type: multipart/form-data`. Use a GERANT JWT token.

**Expected:** HTTP 201; response body `image` field contains an absolute URL such as `http://localhost/media/categories/<filename>.jpg`; the file physically exists at `backend/media/categories/<filename>.jpg`.

**Why human:** The `use_url=True` behaviour on `ImageField` requires a request context with `request.build_absolute_uri()`. Confirming the URL is absolute and the file is physically written requires a live container with the media volume mounted.

#### 2. django-cleanup: Old Image Deleted on Update

**Test:** PATCH `/api/categories/{id}/` with a new image while the category already has an image.

**Expected:** The old image file is removed from `backend/media/categories/`; the new file is present.

**Why human:** django-cleanup works via Django post-delete/pre-save signals on the model. The filesystem side-effect cannot be confirmed without a running container with the bind-mounted media volume.

---

### Gaps Summary

No gaps blocking goal achievement. All 13 observable truths are verified, all 7 requirement IDs are satisfied, all artifacts are substantive and wired, and data flows from real DB queries through the serializer. The two human-verification items are image upload mechanics that require a live container — they do not indicate missing or broken code; the code for both is fully present and correctly configured.

---

_Verified: 2026-05-01_
_Verifier: Gemini CLI (UAT Audit Reconciler)_

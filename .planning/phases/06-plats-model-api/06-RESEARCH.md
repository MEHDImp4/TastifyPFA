---
phase: 06-plats-model-api
type: research
confidence_overall: HIGH
---

# Phase 06: Plats Model & API — Research

## 1. Executive Summary

Phase 6 adds the `Plat` (Dish) model to the existing `menu` app and exposes it via a DRF REST API. All three plans (06-01, 06-02, 06-03) are already written and correctly describe what needs to be built. This research validates those plans against the live codebase and flags the one structural gap that would cause a runtime failure.

**Critical gap found**: The `menu` app has no `management/commands/` directory. Plan 06-03 references `seed_menu.py` at that path — the directory tree must be created before the file can be placed there.

---

## 2. Existing Codebase Patterns (Phase 4 Blueprint)

[VERIFIED: backend/apps/menu/models.py]

The `Categorie` model is the authoritative blueprint for `Plat`. Every pattern in Phase 6 must mirror it exactly.

### 2.1 Soft-Delete Pattern

```python
# Overrides delete() — never calls super().delete() — sets flag and saves
def delete(self, using=None, keep_parents=False):
    self.est_active = False
    self.save(update_fields=['est_active', 'updated_at'])
```

`Plat` must replicate this identically. The Phase 4 RBAC tests (`test_rbac.py`) already verify that `Categorie.objects.filter(pk=...).exists()` returns `True` after a DELETE request — the same assertion pattern applies to `Plat`.

### 2.2 QuerySet/Manager Pattern

```python
class CategorieQuerySet(models.QuerySet):
    def active(self):
        return self.filter(est_active=True)

class CategorieManager(models.Manager):
    def get_queryset(self):
        return CategorieQuerySet(self.model, using=self._db)
    def active(self):
        return self.get_queryset().active()
```

`PlatQuerySet.active()` must chain `est_active=True`. The viewset queryset for non-GERANT additionally filters `est_disponible=True` — this is **not** part of `.active()` (keeping the manager clean); it is applied in `PlatViewSet.get_queryset()`.

### 2.3 RBAC Pattern

[VERIFIED: backend/apps/users/permissions.py]

```python
from apps.users.permissions import IsGerant
# IsGerant checks request.user.role == User.Role.GERANT
```

`IsGerant` is already available. `get_permissions()` implementation is identical to `CategorieViewSet`:
- `('list', 'retrieve')` → `[IsAuthenticated()]`
- all other actions → `[IsAuthenticated(), IsGerant()]`

### 2.4 Serializer Pattern

[VERIFIED: backend/apps/menu/serializers.py]

`CategorieSerializer` uses `serializers.ImageField(use_url=True, allow_null=True, required=False)`. `PlatSerializer` must do the same for its `image` field. The serializer context is automatically injected by `ModelViewSet`, so absolute URLs work without additional wiring.

### 2.5 URL Registration Pattern

[VERIFIED: backend/apps/menu/urls.py and backend/tastify_backend/urls.py]

```python
# Current urls.py (already wired for categories)
router.register(r'categories', CategorieViewSet, basename='categorie')
```

Plan 06-02 registers `plats` on the same router. No changes to `tastify_backend/urls.py` are needed — `path('api/', include('apps.menu.urls'))` already covers both.

---

## 3. Plat Model Fields Analysis

[VERIFIED: .planning/phases/06-plats-model-api/06-CONTEXT.md and 06-01-PLAN.md]

| Field | Type | Notes |
|-------|------|-------|
| `categorie` | `ForeignKey(Categorie, on_delete=CASCADE, related_name='plats')` | Links dish to category |
| `nom` | `CharField(max_length=100)` | No `unique=True` — dishes can share names across categories |
| `description` | `TextField(blank=True)` | |
| `prix` | `DecimalField(max_digits=10, decimal_places=2)` | Avoids float precision loss [ASSUMED: standard practice for monetary values] |
| `temps_preparation` | `IntegerField(default=15)` | In minutes per D-06-02 |
| `image` | `ImageField(upload_to='plats/', blank=True, null=True)` | Separate folder from categories |
| `est_disponible` | `BooleanField(default=True)` | Per-service availability toggle |
| `est_active` | `BooleanField(default=True)` | Soft-delete flag |
| `created_at` | `DateTimeField(auto_now_add=True)` | |
| `updated_at` | `DateTimeField(auto_now=True)` | |

**Key distinction from Categorie**: `Plat` has TWO boolean flags. `est_active` is the soft-delete flag (irreversible via API). `est_disponible` is a runtime toggle (writable by GERANT via PATCH). Non-GERANT visibility filtering must combine both: `est_active=True AND est_disponible=True`.

---

## 4. Visibility Filtering Logic

[VERIFIED: backend/apps/menu/views.py — Categorie pattern]

```python
# PlatViewSet.get_queryset() — required behaviour
if user.role == 'GERANT':
    return Plat.objects.all()          # sees everything, including soft-deleted
else:
    return Plat.objects.active().filter(est_disponible=True)  # active AND available
```

The string comparison `user.role == 'GERANT'` (not `User.Role.GERANT`) matches what `CategorieViewSet` does and what `User.Role.GERANT` resolves to at runtime. [VERIFIED: backend/apps/users/models.py — `GERANT = 'GERANT', 'Gérant'`]

Optional query param `?categorie=<id>` filtering is mentioned in Plan 06-02 as "recommended". It can be added as `queryset.filter(categorie_id=self.request.query_params.get('categorie'))` if provided.

---

## 5. Management Commands Directory Gap

[VERIFIED: Glob on backend/apps/menu/management/** — no files found]

The `menu` app has **no** `management/commands/` directory. Plan 06-03 places `seed_menu.py` at `backend/apps/menu/management/commands/seed_menu.py`. The executor must create:

```
backend/apps/menu/management/__init__.py
backend/apps/menu/management/commands/__init__.py
backend/apps/menu/management/commands/seed_menu.py
```

The pattern for `seed_menu.py` is directly modelled on [VERIFIED: backend/apps/users/management/commands/seed_dev.py]:
- Use `get_or_create()` / existence checks to avoid duplicates on re-run
- Use `self.stdout.write(self.style.SUCCESS(...))` for output
- Seed: 3 categories × 3 dishes = 9 dishes minimum

---

## 6. Integration Test Structure

[VERIFIED: backend/apps/menu/tests/test_api.py, test_rbac.py, test_visibility.py]

Plan 06-03 creates `test_plats_api.py`. It should follow the exact same setUp/helper pattern as the existing test files:
- `APIClient` with `force_authenticate()`
- No JWT token overhead in tests (force_authenticate is correct)
- Direct URL strings (`/api/plats/`) — no `reverse()` used in existing tests

Required test cases per Plan 06-03:
1. `test_list_plats` — any authenticated user gets 200
2. `test_create_plat_as_gerant` — 201
3. `test_create_plat_as_serveur_forbidden` — 403
4. `test_soft_delete_plat` — 204, row still exists, `est_active=False`
5. `test_visibility_filtering` — non-GERANT sees only `est_active=True AND est_disponible=True`
6. `test_plat_detail_access` — non-GERANT gets 404 for inactive dish

---

## 7. Django Settings — No Changes Required

[VERIFIED: backend/tastify_backend/settings/base.py]

- `INSTALLED_APPS` already contains `'apps.menu'` — no addition needed
- `MEDIA_ROOT`/`MEDIA_URL` already configured — `upload_to='plats/'` subfolder is created automatically by Django on first upload
- `django_cleanup` is installed — orphaned image files are deleted when a `Plat` is deleted/updated

---

## 8. Migration Strategy

[VERIFIED: backend/apps/menu/migrations/0001_initial.py — only Categorie exists]

The next migration will be `0002_plat.py`. It must declare:
```python
dependencies = [('menu', '0001_initial')]
```
The ForeignKey to `Categorie` is within the same app/migration, so no cross-app dependency is needed.

---

## 9. Pitfalls & Recommendations

| # | Pitfall | Recommendation | Confidence |
|---|---------|----------------|------------|
| 1 | Forgetting `management/__init__.py` files | Create all three files before `seed_menu.py` | HIGH |
| 2 | Using `unique=True` on `nom` | Do NOT — dishes can share names across categories | HIGH |
| 3 | Filtering only by `est_active` in viewset | Must also filter `est_disponible=True` for non-GERANT | HIGH |
| 4 | Calling `super().delete()` in soft-delete | Must NOT — overrides `delete()` without calling super | HIGH |
| 5 | `on_delete=SET_NULL` on category FK | Use `CASCADE` — orphan dishes with no category are invalid | MEDIUM [ASSUMED] |
| 6 | Migration dependency missing | `0002_plat.py` depends on `('menu', '0001_initial')` | HIGH |

---

## 10. Files to Create / Modify

| File | Action | Plan |
|------|--------|------|
| `backend/apps/menu/models.py` | Edit — add `PlatQuerySet`, `PlatManager`, `Plat` | 06-01 |
| `backend/apps/menu/admin.py` | Edit — add `PlatAdmin` | 06-01 |
| `backend/apps/menu/migrations/0002_plat.py` | Create — generated via `makemigrations` | 06-01 |
| `backend/apps/menu/serializers.py` | Edit — add `PlatSerializer` | 06-02 |
| `backend/apps/menu/views.py` | Edit — add `PlatViewSet` | 06-02 |
| `backend/apps/menu/urls.py` | Edit — register `plats` on router | 06-02 |
| `backend/apps/menu/management/__init__.py` | Create (empty) | 06-03 |
| `backend/apps/menu/management/commands/__init__.py` | Create (empty) | 06-03 |
| `backend/apps/menu/management/commands/seed_menu.py` | Create | 06-03 |
| `backend/apps/menu/tests/test_plats_api.py` | Create | 06-03 |

`backend/tastify_backend/urls.py` — **no changes needed** (already includes `apps.menu.urls`).

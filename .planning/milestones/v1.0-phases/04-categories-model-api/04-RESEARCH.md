# Phase 4: Categories Model & API - Research

**Researched:** 2026-04-28
**Domain:** Django Models, DRF API, Image Management, RBAC
**Confidence:** HIGH

## Summary

This research establishes the implementation strategy for the `menu` app's `Categorie` model and its corresponding API. The primary focus is on implementing a lightweight soft-delete mechanism, managing image uploads and cleanup in a Dockerized environment, and enforcing Role-Based Access Control (RBAC) for data visibility.

**Primary recommendation:** Use a custom `QuerySet` and `Manager` for the `Categorie` model to handle soft deletes via the `est_active` flag, and integrate `django-cleanup` to automate image file deletion upon model updates or hard deletions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01: App Name:** Create a new Django app named `menu` in `backend/apps/`.
- **D-02: Model Name:** `Categorie`.
- **D-03: Fields:** `nom`, `description`, `ordre_affichage`, `image`, `est_active`, `created_at`, `updated_at`.
- **D-04: Endpoints:** `GET /api/categories/`, `POST /api/categories/`, `PATCH /api/categories/{id}/`, `DELETE /api/categories/{id}/`.
- **D-05: RBAC:** `GERANT` (CRUD), others (Read-only).
- **D-06: Visibility Logic:** Non-Gerants only see `est_active=True`.
- **D-07: Soft Delete:** `DELETE` action sets `est_active=False`.

### the agent's Discretion
- Implementation details of soft deletes (custom vs library).
- Image cleanup mechanism (`django-cleanup` suggested).
- Organization of filtering logic within DRF.

### Deferred Ideas (OUT OF SCOPE)
- Multilingual support.
- Slug-based URLs.
- Automatic reordering logic.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| D-01 | Create `menu` app | Standard Django `startapp` pattern. |
| D-03 | `Categorie` model fields | Defined fields with `ImageField` and `est_active` boolean. |
| D-05 | RBAC permissions | Use existing `IsGerant` from `apps.users.permissions`. |
| D-06 | Visibility filtering | Overriding `get_queryset` in DRF ViewSets. |
| D-07 | Soft Delete | Custom `delete()` override and Manager/QuerySet filtering. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Category Data Persistence | Database (MySQL) | — | Storing names, descriptions, and metadata. |
| Business Logic (Soft Delete) | API (Django) | — | Intercepting DELETE requests to toggle `est_active`. |
| Visibility Filtering (RBAC) | API (Django) | — | Restricting inactive categories from non-Gerant users at the source. |
| Image Storage | Storage (Media Root) | API (Django) | Files reside in storage; API manages links and upload flow. |
| Access Control | API (Django) | — | DRF Permissions determine who can edit vs read. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django | 5.0.x | Web Framework | Project standard. |
| DRF | 3.15.x | API Toolkit | Project standard. |
| Pillow | 12.2.0 | Image Processing | Required for Django `ImageField`. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| django-cleanup | 8.1.0+ | Image Cleanup | Automatically deletes old files when updating/deleting models. |

**Installation:**
```bash
pip install django-cleanup
```

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── apps/
│   └── menu/
│       ├── migrations/
│       ├── models.py      # Categorie model + Manager
│       ├── serializers.py # CategorieSerializer
│       ├── urls.py        # API routes
│       └── views.py       # ModelViewSet with RBAC filtering
```

### Pattern 1: Explicit Soft Delete (Manager/QuerySet)
Instead of a heavy library, use an explicit `est_active` boolean with a custom `QuerySet` to ensure consistency.

```python
# apps/menu/models.py
class CategorieQuerySet(models.QuerySet):
    def active(self):
        return self.filter(est_active=True)

class CategorieManager(models.Manager):
    def get_queryset(self):
        return CategorieQuerySet(self.model, using=self._db)
    
    def active(self):
        return self.get_queryset().active()
```

### Pattern 2: RBAC Filtering in ViewSet
Filter the queryset based on the user's role to ensure non-Gerants never see inactive categories.

```python
# apps/menu/views.py
class CategorieViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == User.Role.GERANT:
            return Categorie.objects.all()
        return Categorie.objects.active()
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image Deletion | Custom Signals | `django-cleanup` | Handles edge cases like transaction rollbacks and field updates better than simple signals. |
| File Storage | OS path manipulation | `FileSystemStorage` | Django's built-in storage abstraction is Docker-friendly via volumes. |

## Common Pitfalls

### Pitfall 1: Media Configuration in Docker
**What goes wrong:** Uploaded images are lost when the container restarts or are not accessible via URL.
**How to avoid:** 
1. Ensure `MEDIA_ROOT` and `MEDIA_URL` are defined in `base.py`.
2. Add a Docker volume mapping for the media directory in `docker-compose.yml`.
3. Configure `urls.py` to serve media files in `DEBUG=True` mode.

### Pitfall 2: Atomic Transactions and Image Deletion
**What goes wrong:** A database update fails and rolls back, but the image file was already deleted from disk.
**How to avoid:** `django-cleanup` handles this by waiting for the transaction to commit before deleting the file.

## Code Examples

### Custom Soft Delete override
```python
# apps/menu/models.py
class Categorie(models.Model):
    # ... fields ...
    def delete(self, using=None, keep_parents=False):
        """Soft delete: set inactive instead of deleting from DB."""
        self.est_active = False
        self.save()
```

### Media serving in development
```python
# tastify_backend/urls.py
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... paths ...
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom signals for file cleanup | `django-cleanup` | Ongoing | Reduced boilerplate and higher reliability. |
| Manual visibility checks in views | Overriding `get_queryset` | DRF Standard | Centralized security/visibility logic. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `IsGerant` permission is available in `apps.users.permissions` | Phase Requirements | Need to re-implement if missing or misnamed. |
| A2 | No existing `menu` app exists | Architectural Responsibility | Name collision if app already exists. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| MySQL | Data layer | ✓ | 8.0 | — |
| Pillow | ImageField | ✓ | 12.2.0 | — |
| django-cleanup | File management | ✗ | — | Custom signals |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Django TestCase / Pytest |
| Config file | `backend/tastify_backend/settings/test.py` |
| Quick run command | `python manage.py test apps.menu` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-05 | Gerant has CRUD | Integration | `python manage.py test apps.menu.tests.test_rbac` | ❌ Wave 0 |
| D-06 | Client sees only active | Integration | `python manage.py test apps.menu.tests.test_visibility` | ❌ Wave 0 |
| D-07 | Delete = Soft Delete | Unit | `python manage.py test apps.menu.tests.test_soft_delete` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | Yes | DRF `IsGerant` permission class. |
| V5 Input Validation | Yes | DRF Serializers (`nom` uniqueness, image validation). |
| V12 File Upload | Yes | `ImageField` validation, `upload_to` restriction. |

### Known Threat Patterns for Django/DRF

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized Modification | Spoofing | Enforce `IsGerant` on POST/PATCH/DELETE. |
| Data Leak (Inactive Categories) | Information Disclosure | Filter `get_queryset` for non-privileged users. |
| Malicious File Upload | Tampering | Use `ImageField` (Pillow) to verify file integrity. |

## Sources

### Primary (HIGH confidence)
- `/django/django` - Model signals and Manager documentation.
- `/websites/django-rest-framework` - Filtering and `get_queryset` documentation.
- `django-cleanup` GitHub - Compatibility with Django 5.0.

### Secondary (MEDIUM confidence)
- Official Django documentation on serving media files.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified Django 5.0 and DRF 3.15 compatibility.
- Architecture: HIGH - Follows project-specific RBAC and app structure.
- Pitfalls: HIGH - Common Docker/Django media issues addressed.

**Research date:** 2026-04-28
**Valid until:** 2026-05-28

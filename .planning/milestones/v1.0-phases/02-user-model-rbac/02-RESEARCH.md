<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Model named `Utilisateur` (or `User`) extending `AbstractUser`.
- **D-02:** Fields: `role` (ENUM/Choices: GERANT, SERVEUR, CUISINIER, CLIENT).
- **D-03:** No extra operation-specific fields (like telephone) for now; stick to standard `AbstractUser` fields.
- **D-04:** Deletion strategy: standard Django `is_active=False` (no true soft-delete for now).
- **D-05:** **Hierarchical roles**: `GERANT` inherits all permissions of other staff roles. `CLIENT` is the base role.
- **D-06:** Permission classes localized in `backend/apps/users/permissions.py`.
- **D-07:** Implement a management command `seed_dev` to automatically create one test user for each role.

### the agent's Discretion
- Use a clean `TextChoices` class for roles to ensure type safety in the backend.
- Ensure the `seed_dev` command uses the `create_superuser` and `create_user` methods correctly to handle hashing.

### Deferred Ideas (OUT OF SCOPE)
- **JWT Auth:** Deferred to Phase 3.
- **Detailed Staff Profiles:** (e.g. `date_embauche`) Deferred to Phase 21 (HR Model).
</user_constraints>

# Phase 2: User Model & RBAC - Research

**Researched:** 2026-04-27
**Domain:** Django Custom User Model & Django REST Framework Permissions
**Confidence:** HIGH

## Summary

This phase establishes the foundational identity and access control layer for TastifyPFA. Django's robust authentication framework requires the custom user model (`Utilisateur`) to be implemented immediately as it hooks directly into `AUTH_USER_MODEL`, affecting all future database relations. 

By subclassing `AbstractUser` and utilizing `models.TextChoices`, we achieve strict type safety and built-in password handling without reinventing the wheel. The RBAC logic relies on custom DRF `BasePermission` classes that codify the hierarchical roles (`GERANT` inheriting staff privileges). This ensures route-level security for upcoming API phases.

**Primary recommendation:** Define the `Utilisateur` model and set `AUTH_USER_MODEL` before executing any Django migrations to avoid foreign-key conflicts in the database.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| User Data Persistence | Database / Storage | API / Backend | MySQL stores the user data safely; Django ORM queries it. |
| User Identity & Auth | API / Backend | — | Django's ORM model (`AbstractUser`) handles user representation, `is_active` soft-deletion, and PBKDF2 password hashing. |
| Role Definition | API / Backend | — | `TextChoices` in the Django model standardizes roles across the application stack. |
| API Access Control | API / Backend | — | DRF `BasePermission` classes enforce RBAC locally on views/viewsets. |
| Test Data Seeding | API / Backend | Database | Django Management Commands (`BaseCommand`) automate programmatic data insertion into the database. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django | 5.0.14 | Web Framework & ORM | Core framework, native custom user model support. |
| Django REST Framework | 3.15.2 | REST API | Industry standard for Django APIs, provides robust `BasePermission` classes for RBAC. |

**Installation:**
Already present in `backend/requirements.txt`.

## Architecture Patterns

### System Architecture Diagram

```
[Incoming Request]
       │
       ▼
[Django Router / urls.py]
       │
       ▼
[DRF View / ViewSet]
       │
       ├─► [Authentication Classes] -> Resolves `request.user` (Phase 3)
       │
       ├─► [Permission Classes: apps.users.permissions.py]
       │     ├─► `IsGerant` (Checks user.role == GERANT)
       │     ├─► `IsServeurOrGerant` (Checks user.role in [SERVEUR, GERANT])
       │     └─► `IsCuisinierOrGerant` (Checks user.role in [CUISINIER, GERANT])
       │
       ▼
[Business Logic & ORM] (Utilisateur Model)
       │
       ▼
[JSON Response]
```

### Recommended Project Structure
```text
backend/
├── apps/
│   └── users/
│       ├── __init__.py
│       ├── apps.py
│       ├── models.py           # Utilisateur model with Role TextChoices
│       ├── permissions.py      # IsGerant, IsServeurOrGerant, etc.
│       ├── admin.py            # UtilisateurAdmin extending UserAdmin
│       └── management/
│           └── commands/
│               └── seed_dev.py # Command to create default role users
└── tastify_backend/
    └── settings/
        └── base.py             # Add: AUTH_USER_MODEL = 'users.Utilisateur'
```

### Pattern 1: Custom User Model with TextChoices
**What:** Subclassing `AbstractUser` and enforcing strict role enumeration using `models.TextChoices`.
**When to use:** Defining application-specific user hierarchies while preserving standard auth features.
**Example:**
```python
# Source: Verified via Context7 Django Docs
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class Utilisateur(AbstractUser):
    class Role(models.TextChoices):
        GERANT = "GERANT", _("Gérant")
        SERVEUR = "SERVEUR", _("Serveur")
        CUISINIER = "CUISINIER", _("Cuisinier")
        CLIENT = "CLIENT", _("Client")
        
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
    )
```

### Pattern 2: Hierarchical DRF Permissions
**What:** Writing custom permission classes extending `BasePermission` that implement the role hierarchy.
**When to use:** When evaluating if a `request.user` is authorized to access a ViewSet.
**Example:**
```python
# Source: Verified via Context7 DRF Docs
from rest_framework import permissions

class IsServeurOrGerant(permissions.BasePermission):
    """Allows access only to Serveur or Gerant roles."""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['SERVEUR', 'GERANT']
        )
```

### Anti-Patterns to Avoid
- **Anti-pattern:** Modifying `AUTH_USER_MODEL` *after* running initial `migrate`. **Why it's bad:** Causes catastrophic foreign-key failures in the database schema since tables like `django_admin_log` bind to the first active user model.
- **Anti-pattern:** Writing plaintext roles `role == "GERANT"`. **Why it's bad:** Prevents refactoring. Use the enum: `request.user.role == Utilisateur.Role.GERANT` or a defined list of allowed roles.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| User Hashing/Auth | Custom hashing logic in `save()` | `AbstractUser` and `UserManager.create_user()` | Built-in methods securely handle PBKDF2 hashing, salting, and upgrades. |
| User Administration | Custom CRUD views for backend admins | Django Admin (`UserAdmin`) | Out of the box, secure interface for managing users with specialized hashed password widgets. |
| Soft Deletion | Custom `deleted_at` field | built-in `is_active` field | Native Django mechanisms tie `is_active=False` directly into authentication backends (rejecting login automatically). |
| Database Seeding | Standalone python scripts | Django Management Commands (`BaseCommand`) | Sets up the Django environment and ORM correctly without manual path hacks. |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | No migrations applied yet (Greenfield DB for users) | Must execute `makemigrations` and `migrate` only after defining `Utilisateur` |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | `AUTH_USER_MODEL` not set | Code edit: Update `backend/tastify_backend/settings/base.py` |
| Build artifacts | None | None |

## Common Pitfalls

### Pitfall 1: Failing to Update Admin for Custom User Model
**What goes wrong:** Creating users via the Django Admin panel saves their passwords as plaintext.
**Why it happens:** The default `ModelAdmin` does not use the `set_password()` method like `UserAdmin` does.
**How to avoid:** You must extend `django.contrib.auth.admin.UserAdmin` in `admin.py` and register it with the custom `Utilisateur` model, overriding `fieldsets` to include the `role` field.

### Pitfall 2: Premature Migrations
**What goes wrong:** Django raises a `ValueError` about lazy references.
**Why it happens:** `python manage.py migrate` was run before `AUTH_USER_MODEL` was configured in settings.
**How to avoid:** The very first `makemigrations` and `migrate` must happen *after* defining `Utilisateur` and setting `AUTH_USER_MODEL = 'users.Utilisateur'`. 

## Code Examples

### Customizing UserAdmin properly
```python
# Source: Verified via Context7 Django Customizing Authentication Docs
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur

@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    # Add 'role' to the fieldsets so it's editable in admin
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `models.CharField(choices=TUPLE)` | `models.TextChoices` | Django 3.0+ | Provides a formal Enum class with `.choices` and `.labels`, improving type safety and readability. |

## Assumptions Log

*(All claims verified via Context7 Django & DRF docs or project mandates. No assumptions.)*

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python | Backend execution | ✓ | 3.14 (local) | — |
| Django | Backend framework | ✓ | 5.0.14 | — |
| DRF | API framework | ✓ | 3.15.2 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Django `unittest` wrapper |
| Config file | none — uses standard Django discovery |
| Quick run command | `python backend/manage.py test apps.users` |
| Full suite command | `python backend/manage.py test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-02-1 | `Utilisateur` extends `AbstractUser` with Role choices | unit | `python backend/manage.py test apps.users.tests.test_models` | ❌ Wave 0 |
| REQ-02-2 | Role default is CLIENT | unit | `python backend/manage.py test apps.users.tests.test_models` | ❌ Wave 0 |
| REQ-02-3 | `IsGerant` permission allows GERANT only | unit | `python backend/manage.py test apps.users.tests.test_permissions` | ❌ Wave 0 |
| REQ-02-4 | `IsServeurOrGerant` allows both roles | unit | `python backend/manage.py test apps.users.tests.test_permissions` | ❌ Wave 0 |
| REQ-02-5 | `seed_dev` command creates 4 distinct test users | unit | `python backend/manage.py test apps.users.tests.test_commands` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `backend/apps/users/tests/test_models.py`
- [ ] `backend/apps/users/tests/test_permissions.py`
- [ ] `backend/apps/users/tests/test_commands.py`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | PBKDF2 hashing handled by `AbstractUser.set_password()` |
| V3 Session Management | no | Deferred to Phase 3 (JWT) |
| V4 Access Control | yes | DRF `BasePermission` + strict checking of `request.user.role` |
| V5 Input Validation | yes | `models.TextChoices` enforces strictly allowed enum values at the DB level |
| V6 Cryptography | yes | Django's built-in hashing utilized inherently |

### Known Threat Patterns for Django/DRF

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Privilege Escalation | Elevation of Privilege | Ensure backend API endpoints cannot modify `role` parameter freely. Protect role assignment to `GERANT` or Superuser only via permissions. |
| Insecure Direct Object Reference (IDOR) | Information Disclosure | `has_object_permission` checking ownership if necessary (will be relevant in future phases). |

## Sources

### Primary (HIGH confidence)
- `[VERIFIED: Context7]` - Django Custom User Model (`/websites/djangoproject_en_5_2`)
- `[VERIFIED: Context7]` - DRF BasePermission Customization (`/websites/django-rest-framework`)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified via project requirements.txt and standard Django ecosystem defaults.
- Architecture: HIGH - Follows strict Django best practices for custom auth.
- Pitfalls: HIGH - Documented common Django ecosystem failures when dealing with AUTH_USER_MODEL.

**Research date:** 2026-04-27
**Valid until:** Stable

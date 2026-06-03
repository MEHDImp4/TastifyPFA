# Phase 21: Employees (HR) Model & API

## Goal
Implement the core HR data structure and REST API to manage employees, salaries, and positions, with strict RBAC.

## Requirements
- `Employe` model linked 1:1 with `Utilisateur`.
- Fields: `poste`, `salaire`, `date_embauche`, `cin`, `telephone`, `adresse`.
- RBAC: Only `GERANT` can access HR endpoints.
- Features: Automatic User creation on Employee creation, Soft Delete (deactivate user).

## Artifacts
- `app/backend/apps/hr/`: New Django app.
- `app/backend/apps/hr/models.py`: `Employe` model.
- `app/backend/apps/hr/serializers.py`: `EmployeSerializer` with nested User management.
- `app/backend/apps/hr/views.py`: `EmployeViewSet` with custom `destroy` and queryset filtering.
- `app/backend/apps/hr/urls.py`: App-level routing.
- `app/backend/tastify_backend/api_router.py`: Registered `employes` endpoint.

## Verification
- [x] Automated tests in `apps.hr.tests` (5/5 passing).
- [x] RBAC verified: Gerant can CRUD, others blocked (403).
- [x] User creation verified.
- [x] Soft delete (is_active=False) verified.

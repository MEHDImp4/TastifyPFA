---
phase: 4
slug: categories-model-api
status: ready
created: 2026-04-28
---

# Phase 4: Categories Model & API - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the database model and REST API for product categories. This phase focuses on the backend infrastructure required to manage categories (Gérant CRUD) and serve them to all authenticated users. It serves as the foundation for the Dishes (Plats) module in Phase 6.

</domain>

<decisions>
## Implementation Decisions

### 1. Backend Structure
- **D-01: App Name:** Create a new Django app named `menu` in `backend/apps/`.
- **D-02: Model Name:** `Categorie`.
- **D-03: Fields:**
    - `nom` (CharField, max_length=100, unique=True).
    - `description` (TextField, blank=True).
    - `ordre_affichage` (PositiveIntegerField, default=0, duplicates allowed).
    - `image` (ImageField, upload_to='categories/').
    - `est_active` (BooleanField, default=True).
    - `created_at`, `updated_at` (Auto-managed timestamps).

### 2. API & Permissions
- **D-04: Endpoints:** `GET /api/categories/`, `POST /api/categories/`, `PATCH /api/categories/{id}/`, `DELETE /api/categories/{id}/`.
- **D-05: RBAC:**
    - `GERANT`: Full CRUD access.
    - `SERVEUR`, `CUISINIER`, `CLIENT`: Read-only (`GET`) access.
- **D-06: Visibility Logic:**
    - The List API filters out `est_active=False` for all roles EXCEPT `GERANT`.
    - Gérant sees all categories to allow reactivation.
- **D-07: Soft Delete:** `DELETE` action will perform a partial update setting `est_active=False`.

### 3. Data Integrity
- **D-08: Dependency Impact:** If a category is `est_active=False`, its associated dishes should be filtered out in the upcoming Plats API (to be enforced in Phase 6).

</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — Phase 4: Category DB and REST API.
- `docs/cahier_de_charge_tastify.md` — Section 3.2 (Module Menu) and 5.1.2 (Gestion Menu).
- `docs/brain/03_Architecture/DATABASE_SCHEMA.md` — Global rules for Soft Deletes and Timestamps.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps.core.permissions` — Should house/support `IsGerant` permission class as defined in the spec.
- `backend/tastify_backend/settings/base.py` — Already has `MEDIA_URL` (to be verified) and `INSTALLED_APPS` structure.

### Integration Points
- `backend/apps/menu/urls.py` must be included in `backend/tastify_backend/urls.py`.
- `backend/apps/menu/serializers.py` will handle JSON serialization and image URL generation.

</code_context>

<specifics>
## Specific Ideas

- Use `django-cleanup` if available or manually handle old image deletion when updating/deleting (though soft delete keeps images).
- Ensure `MEDIA_ROOT` and `MEDIA_URL` are correctly configured in `dev.py` and `base.py` to allow local testing of image uploads.

</specifics>

<deferred>
## Deferred Ideas

- **Multilingual Support:** Stick to a single language (French) for now.
- **Slug-based URLs:** Use standard IDs for now as per spec `PATCH /api/categories/{id}/`.
- **Automatic Reordering:** Reordering logic is manual via `ordre_affichage` integer for now.

</deferred>

---

*Phase: 04-categories-model-api*
*Context gathered: 2026-04-28*

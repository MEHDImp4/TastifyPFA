---
phase: 08
phase_name: Tables Model & API
timestamp: 2026-04-28T12:00:00Z
status: gaps_found
score: 1/21
---

# Phase 8 Verification Report — Tables Model & API

## Goal

**Phase Goal:** Table DB and REST API.
**Success Criterion:** Tables state is queryable via `GET /api/tables/`.

---

## Summary

Phase 8 plans exist (3 plans prepared) but execution is **incomplete**. The basic app scaffold (`apps.py`, `__init__.py`, empty subdirectories) was created and `apps.tables` is registered in `INSTALLED_APPS`. However, **all implementation files are missing** — no model, no serializer, no viewset, no URLs, no migrations, no tests, no seed command.

---

## Must-Have Truths

### Plan 08-01 (App scaffold + Model)

| # | Truth | Status |
|---|-------|--------|
| 1 | `backend/apps/tables/` directory exists with full app scaffold | ⚠️ PARTIAL — scaffold only (apps.py + __init__.py), no models/admin/migrations |
| 2 | Table model has Statut TextChoices with 4 values: LIBRE, OCCUPEE, RESERVEE, ENCAISSEMENT | ✗ MISSING |
| 3 | Table model has all 7 required fields (numero, capacite, statut, pos_x, pos_y, est_active, created_at, updated_at) | ✗ MISSING |
| 4 | `Table.delete()` sets `est_active=False` (soft-delete) | ✗ MISSING |
| 5 | `TableQuerySet.active()` returns only `est_active=True` rows | ✗ MISSING |
| 6 | `apps.tables` registered in `INSTALLED_APPS` | ✓ VERIFIED |
| 7 | Migration `0001_initial.py` generated and applies without errors | ✗ MISSING |
| 8 | 3 soft-delete model tests pass green | ✗ MISSING |

### Plan 08-02 (Serializer + ViewSet + URLs)

| # | Truth | Status |
|---|-------|--------|
| 9 | `GET /api/tables/` returns 200 for any authenticated user | ✗ MISSING |
| 10 | `POST /api/tables/` returns 403 for SERVEUR, CUISINIER, CLIENT | ✗ MISSING |
| 11 | `DELETE /api/tables/{id}/` returns 204 for GERANT, sets `est_active=False` | ✗ MISSING |
| 12 | `GET /api/tables/` returns only active tables for non-GERANT | ✗ MISSING |
| 13 | `GET /api/tables/` returns all tables (incl. soft-deleted) for GERANT | ✗ MISSING |
| 14 | `GET /api/tables/{inactive_id}/` returns 404 for non-GERANT | ✗ MISSING |
| 15 | Unauthenticated `GET /api/tables/` returns 401 | ✗ MISSING |
| 16 | `TableSerializer` exposes all required fields | ✗ MISSING |

### Plan 08-03 (Seed + Integration tests)

| # | Truth | Status |
|---|-------|--------|
| 17 | `seed_tables` command is idempotent | ✗ MISSING |
| 18 | `seed_tables` creates 12 tables numbered 1–12 with mixed capacities | ✗ MISSING |
| 19 | All seeded tables have `statut=LIBRE` and `est_active=True` | ✗ MISSING |
| 20 | API integration tests cover full CRUD lifecycle | ✗ MISSING |
| 21 | All integration tests pass green | ✗ MISSING |

**Score: 1 / 21**

---

## Artifact Table

| Artifact | Exists | Substantive | Wired | Status |
|----------|--------|-------------|-------|--------|
| `backend/apps/tables/__init__.py` | ✓ | — | — | ✓ VERIFIED (scaffold) |
| `backend/apps/tables/apps.py` | ✓ | ✓ | ✓ | ✓ VERIFIED |
| `backend/apps/tables/models.py` | ✗ | — | — | ✗ MISSING |
| `backend/apps/tables/admin.py` | ✗ | — | — | ✗ MISSING |
| `backend/apps/tables/migrations/0001_initial.py` | ✗ | — | — | ✗ MISSING |
| `backend/apps/tables/serializers.py` | ✗ | — | — | ✗ MISSING |
| `backend/apps/tables/views.py` | ✗ | — | — | ✗ MISSING |
| `backend/apps/tables/urls.py` | ✗ | — | — | ✗ MISSING |
| `backend/apps/tables/tests/test_model.py` | ✗ | — | — | ✗ MISSING |
| `backend/apps/tables/tests/test_rbac.py` | ✗ | — | — | ✗ MISSING |
| `backend/apps/tables/tests/test_api.py` | ✗ | — | — | ✗ MISSING |
| `backend/apps/tables/management/commands/seed_tables.py` | ✗ | — | — | ✗ MISSING |

---

## Key Links

| From | To | Via | Status |
|------|----|-----|--------|
| `backend/tastify_backend/settings/base.py` | `backend/apps/tables/apps.py` | `INSTALLED_APPS` | ✓ WIRED |
| `backend/apps/tables/views.py` | `backend/apps/users/permissions.py` | `from apps.users.permissions import IsGerant` | ✗ NOT_WIRED (views.py missing) |
| `backend/apps/tables/views.py` | `backend/apps/tables/models.py` | `Table.objects.all()` | ✗ NOT_WIRED (views.py missing) |
| `backend/tastify_backend/urls.py` | `backend/apps/tables/urls.py` | `include('apps.tables.urls')` | ✗ NOT_WIRED |

---

## Anti-Pattern Scan

No implementation files to scan.

---

## Test Quality Audit

No test files exist — no audit possible.

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|----------------|---------|
| `test_model.py` | Truths 2–5, 8 | 0 | 0 | — | — | ✗ MISSING |
| `test_rbac.py` | Truths 9–16 | 0 | 0 | — | — | ✗ MISSING |
| `test_api.py` | Truths 17–21 | 0 | 0 | — | — | ✗ MISSING |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** N/A

---

## Gaps Summary

**Root cause:** Phase 8 plans are prepared but the implementation plans (08-01, 08-02, 08-03) have not been executed. Only the empty app scaffold was created.

| Gap | Severity |
|-----|----------|
| `models.py` not created — no Table model, no Statut enum, no soft-delete | 🛑 Blocker |
| Migration `0001_initial.py` missing — DB table does not exist | 🛑 Blocker |
| `serializers.py`, `views.py`, `urls.py` all missing — API does not exist | 🛑 Blocker |
| `tastify_backend/urls.py` does not include tables routes | 🛑 Blocker |
| `tests/test_model.py`, `test_rbac.py`, `test_api.py` all missing | 🛑 Blocker |
| `management/commands/seed_tables.py` missing | 🛑 Blocker |

---

## Fix Plans

### Fix Plan A: Execute 08-01 — App Scaffold + Table Model

**Objective:** Create `models.py` with Table model, Statut enum, soft-delete, migration, register in admin, write 3 model tests.

**Tasks:**
1. Create `backend/apps/tables/models.py` — `Statut` TextChoices (4 values), `TableQuerySet` with `.active()`, `Table` model with all 8 fields, soft-delete `delete()` override
2. Create `backend/apps/tables/admin.py` — register Table
3. Run `python manage.py makemigrations tables` → `migrations/0001_initial.py`
4. Create `backend/apps/tables/tests/test_model.py` — 3 tests: model creation, soft-delete, `active()` queryset filter

**Re-verify:** `models.py` exists and is substantive; migration exists; 3 tests pass.

---

### Fix Plan B: Execute 08-02 — Serializer + ViewSet + URL Wiring

**Objective:** Expose `GET /api/tables/` endpoint with full RBAC.

**Tasks:**
1. Create `backend/apps/tables/serializers.py` — `TableSerializer` with all 9 fields
2. Create `backend/apps/tables/views.py` — `TableViewSet` using `IsGerant` permission, visibility logic in `get_queryset`, soft-delete in `destroy()`
3. Create `backend/apps/tables/urls.py` — register router with `TableViewSet`
4. Add `path('api/', include('apps.tables.urls'))` to `backend/tastify_backend/urls.py`
5. Create `backend/apps/tables/tests/test_rbac.py` — 7 RBAC tests

**Re-verify:** `GET /api/tables/` returns 200 for authenticated user; 403 for non-GERANT on POST; key links WIRED.

---

### Fix Plan C: Execute 08-03 — Seed Command + Integration Tests

**Objective:** Provide idempotent seed data and full CRUD integration test coverage.

**Tasks:**
1. Create `backend/apps/tables/management/commands/seed_tables.py` — `get_or_create` loop for 12 tables, mixed capacities, `statut=LIBRE`
2. Create `backend/apps/tables/tests/test_api.py` — full CRUD lifecycle tests
3. Run all tests: `python manage.py test apps.tables`

**Re-verify:** All tests pass green; seed command is idempotent.

---

## Human Verification Required

| Test | Action | Expected | Why |
|------|--------|----------|-----|
| Visual map data contract | After Phase 9 starts, confirm `/api/tables/` JSON includes `pos_x`, `pos_y` and they are used by the SVG map | Coordinates visible on canvas | Cannot verify Phase 9 wiring programmatically before it exists |

---

## Metadata

- **Verified by:** GSD Phase Verifier
- **Date:** 2026-04-28
- **Plans checked:** 08-01-PLAN.md, 08-02-PLAN.md, 08-03-PLAN.md
- **Summaries found:** None (phase not executed)
- **Decision:** `gaps_found` — all 3 plans must be executed before this phase can pass

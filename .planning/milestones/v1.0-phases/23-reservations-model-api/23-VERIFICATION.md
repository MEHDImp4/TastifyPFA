---
phase: 23-reservations-model-api
verified: 2026-05-06T12:00:00Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
gaps: []
deferred: []
human_verification: []
re_verification:
  previous_status: gaps_found
  previous_score: 4/6
  gaps_closed:
    - "A reservation cannot be persisted if the table is already booked within the requested slot plus the 15-minute cleanup buffer."
    - "Clients can list only their own reservations and create new ones without being able to impersonate another client."
  gaps_remaining: []
  regressions: []
---

# Phase 23: Reservations Model & API Verification Report

**Phase Goal:** Reservation model and API with availability logic, RBAC, client ownership, staff management, and dynamic table status.
**Verified:** 2026-05-06
**Status:** passed
**Re-verification:** Yes — after gap closure via Plan 23-03

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A reservation cannot be persisted if the table is already booked within the requested slot plus the 15-minute cleanup buffer. | VERIFIED | `Reservation.clean()` calls `has_active_conflict()` which applies `RESERVATION_CLEANUP_BUFFER`. `_compute_statut_effectif` in `tables/serializers.py` now compares full `datetime.datetime` objects (`start_dt = datetime.datetime.combine(today, reservation.heure_debut)`, `end_dt = ...combine(...) + RESERVATION_CLEANUP_BUFFER`) — midnight-straddling windows (e.g., 23:55+15min=00:10) are correctly detected. CR-02 closed. |
| 2 | A reservation cannot be persisted when `nombre_personnes` exceeds the selected table capacity. | VERIFIED | `Reservation.clean()` lines 107-110 validates `table.capacite < self.nombre_personnes` and raises `ValidationError`. `save()` calls `full_clean()`. Tests in `test_models.py` confirm rejection. |
| 3 | Simultaneous creation attempts for the same table and time slot resolve safely instead of allowing duplicate active bookings. | VERIFIED | `create_reservation()` wraps in `transaction.atomic()` + `Table.objects.select_for_update()`. `test_services.py` verifies double-booking is rejected. `TestConcurrentCreateConflict` in `test_api.py` verifies at the API layer. |
| 4 | Clients can list only their own reservations and create new ones without being able to impersonate another client. | VERIFIED | `get_queryset()` scopes clients to `filter(client=user)`. `client` field is read-only. `create()` binds `client=request.user`. `validate_statut` now has `if not self._is_staff()` as the **outermost** condition (line 41); if `self.instance is None` (create path), non-staff users receive HTTP 400 before the record is created — CR-01 closed. `self.instance is not None` outer gate is confirmed absent. |
| 5 | Staff roles can manage all reservations, including status transitions such as confirmation, presence, absence, and cancellation. | VERIFIED | `get_queryset()` returns all reservations for `STAFF_ROLES`. `validate_statut` exits early via `_is_staff()` for staff. `TestStaffVisibility` and `TestClientStatusTransition.test_staff_can_set_any_status` confirm all status values can be set by GERANT. |
| 6 | Table API responses expose reservation-aware status dynamically instead of relying on a background sync or direct writes to `Table.statut`. | VERIFIED | `statut_effectif` `SerializerMethodField` added to `TableSerializer` calls `_compute_statut_effectif()` at read time without mutating `Table.statut`. Prefetch attribute `_today_reservations` is now consumed via `hasattr(table, '_today_reservations')` guard (WR-03 fixed). `test_stored_table_statut_unchanged_by_reservation` confirms no DB mutation. |

**Score:** 6/6 truths verified

---

### Gap Closure Verification (Plan 23-03)

**Gap 1 (CR-01) — serializers.py `validate_statut` create-path guard:**

- `grep "if not self._is_staff" apps/reservations/serializers.py` → line 41 (outermost condition confirmed)
- `grep "self.instance is not None" apps/reservations/serializers.py` → no results (create-gate removed)
- `grep "self.instance is None" apps/reservations/serializers.py` → line 42 (create guard present inside staff check)
- Status: CLOSED

**Gap 2 (CR-02) — tables/serializers.py midnight-wrap bug:**

- `grep "current_time" apps/tables/serializers.py` → no results (time-object comparison removed)
- `grep "start_dt = datetime.datetime.combine" apps/tables/serializers.py` → line 37 (full datetime comparison present)
- `grep "hasattr.*_today_reservations" apps/tables/serializers.py` → line 28 (prefetch branch wired)
- Status: CLOSED

**Advisory WR-03 — Dead prefetch:** `_today_reservations` consumed via `hasattr` guard in `_compute_statut_effectif`. Status: FIXED

**Advisory CR-03 — Deadlock risk in `update_reservation`:**

- `grep "sorted(" apps/reservations/services.py` → line 76 (`pks_to_lock = sorted({old_table_pk, new_table_pk})`)
- Status: FIXED

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/backend/apps/reservations/models.py` | Reservation model, statuses, clean/save validation, queryset helpers | VERIFIED | Full model with `Statut` choices, FK to Table and AUTH_USER_MODEL, `clean()` enforces capacity/time/overlap, `save()` calls `full_clean()`, `ReservationManager`/`QuerySet` with `.active()` and `.for_table_day()` |
| `app/backend/apps/reservations/services.py` | Buffered availability queries and transactional creation path | VERIFIED | `is_table_available()`, `create_reservation()` with `transaction.atomic` + `select_for_update`, `update_reservation()` with deterministic ascending-PK lock ordering via `sorted()` |
| `app/backend/apps/reservations/tests/test_models.py` | Model validation coverage for overlap, capacity, status exclusions | VERIFIED | 5 tests covering app install, invalid time window, capacity overflow, ANNULEE/ABSENTE exclusion, overlap detection, buffer boundary |
| `app/backend/apps/reservations/tests/test_services.py` | Availability and race-safety coverage | VERIFIED | Tests for blocked/free slot, self-exclusion on update, double-booking prevention under concurrent attempts |
| `app/backend/apps/reservations/permissions.py` | Object-level and role-level rules | VERIFIED | `IsStaffOrOwnReservation`: `has_permission` checks authentication, `has_object_permission` checks STAFF_ROLES or `obj.client_id == request.user.pk` |
| `app/backend/apps/reservations/serializers.py` | Input/output validation and client/staff field restrictions | VERIFIED | `client` is read-only; `validate_statut` outermost guard `if not self._is_staff()` covers both create and update paths; `create()`/`update()` delegate to service layer |
| `app/backend/apps/reservations/views.py` | Reservation queryset scoping and action-level RBAC | VERIFIED | `ModelViewSet`, `IsStaffOrOwnReservation` permission, `get_queryset()` branches on role, `select_related('client', 'table')` |
| `app/backend/apps/reservations/tests/test_api.py` | RBAC, overlap, cancel/status-rule, concurrent-create coverage | VERIFIED | 18 tests: ownership scoping, staff visibility, client create binding, status transitions, overlap 400, inactive reservations don't block, concurrent conflict, table derived status |
| `app/backend/apps/tables/serializers.py` | Derived reservation-aware table status field | VERIFIED | `statut_effectif` SerializerMethodField; `_compute_statut_effectif` uses full `datetime.datetime` objects, reads `_today_reservations` prefetch attribute when available |
| `app/backend/apps/reservations/migrations/0001_initial.py` | Initial migration with indexes | VERIFIED | Migration with all fields; 3 composite indexes for table/date/time, table/date/status, and client/date queries |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `reservations/models.py` | `tables/models.py` | FK to Table + capacity check against `table.capacite` | WIRED | FK to `'tables.Table'`, `clean()` checks `self.table.capacite < self.nombre_personnes` |
| `reservations/services.py` | `reservations/models.py` | Overlap filtering excluding ANNULEE and ABSENTE | WIRED | `create_reservation()` calls `reservation.save()` → `full_clean()` → `has_active_conflict()` → `Reservation.objects.active()` (excludes ANNULEE and ABSENTE) |
| `settings/base.py` | `reservations/apps.py` | `'apps.reservations'` in INSTALLED_APPS | WIRED | Confirmed present |
| `reservations/views.py` | `reservations/services.py` | Create/update flows call transactional reservation service | WIRED | `serializer.create()` calls `create_reservation()`, `serializer.update()` calls `update_reservation()` |
| `api_router.py` | `reservations/views.py` | `router.register(r'reservations', ReservationViewSet, basename='reservation')` | WIRED | Confirmed in api_router.py |
| `tables/serializers.py` | `reservations/models.py` + `constants.py` | `_compute_statut_effectif` uses `RESERVATION_CLEANUP_BUFFER` with full datetime objects | WIRED | `RESERVATION_CLEANUP_BUFFER` imported from `apps.reservations.constants`; `_today_reservations` prefetch consumed via `hasattr` guard; no `.time()` wrapping |
| `tables/views.py` | `tables/serializers.py` | `_today_reservations_prefetch()` populates `table._today_reservations` via `to_attr` | WIRED | `get_queryset()` applies `prefetch_related(_today_reservations_prefetch())`; serializer reads `hasattr(table, '_today_reservations')` |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `reservations/views.py` | Reservation queryset | `Reservation.objects.filter(client=user)` or `.all()` | Yes — DB query scoped by role | FLOWING |
| `tables/serializers.py` `statut_effectif` | `active_today` reservations | Prefetch `_today_reservations` (list) or DB queryset (retrieve) | Yes — DB-backed, full datetime comparison, no midnight wrap | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Result | Status |
|----------|--------|--------|
| Full test suite: `python -m pytest apps/reservations/ apps/tables/ -q` | 49 passed, 2 warnings in 55.17s | PASS |
| `validate_statut` outermost guard present | Line 41: `if not self._is_staff()` | PASS |
| `self.instance is not None` create-gate absent | No matches | PASS |
| `current_time` variable absent from `_compute_statut_effectif` | No matches | PASS |
| `start_dt = datetime.datetime.combine` present | Line 37 | PASS |
| `hasattr.*_today_reservations` branch present | Line 28 | PASS |
| `sorted(` in `update_reservation` | Line 76 | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| REQ-23-01 | 23-01-PLAN.md | Reservation model with overlap/capacity validation | SATISFIED | `models.py` `Reservation` with `clean()`, `has_active_conflict()`, `RESERVATION_CLEANUP_BUFFER` |
| REQ-23-02 | 23-01-PLAN.md | Buffered availability service (15-minute cleanup window) | SATISFIED | `services.py` `is_table_available()`, `RESERVATION_CLEANUP_BUFFER` constant |
| REQ-23-03 | 23-01-PLAN.md | Transactional race-safe reservation creation | SATISFIED | `create_reservation()` uses `transaction.atomic` + `select_for_update` |
| REQ-23-04 | 23-02-PLAN.md | Client ownership scoping and anti-impersonation | SATISFIED | `get_queryset()` scopes to `client=user`; `validate_statut` outermost guard blocks status escalation on create (CR-01 closed) |
| REQ-23-05 | 23-02-PLAN.md | Staff RBAC for full reservation management | SATISFIED | `IsStaffOrOwnReservation`, `STAFF_ROLES` check in `get_queryset` and `validate_statut` |
| REQ-23-06 | 23-02-PLAN.md | Dynamic table status without persistent `Table.statut` mutation | SATISFIED | `statut_effectif` field present, `_compute_statut_effectif` uses datetime objects (midnight-wrap CR-02 closed), prefetch wired (WR-03 closed) |

---

## Anti-Patterns Found

None blocking. All four anti-patterns identified in the previous verification have been resolved:

| File | Pattern | Resolution |
|------|---------|-----------|
| `apps/reservations/serializers.py` | `if self.instance is not None` create-path guard missing | FIXED — outermost `if not self._is_staff()` guard in `validate_statut` |
| `apps/tables/serializers.py` | `.time()` midnight-straddling comparison | FIXED — full `datetime.datetime` objects used throughout |
| `apps/tables/views.py` | Dead prefetch `_today_reservations` | FIXED — `hasattr` guard consumes prefetch attribute in serializer |
| `apps/reservations/services.py` | Deadlock risk from unordered table lock acquisition | FIXED — `sorted({old_pk, new_pk})` + single `filter(pk__in=...)` call |

---

## Human Verification Required

None — all must-have truths verified statically and confirmed by test suite (49 passed).

---

## Gaps Summary

No gaps. Phase 23 goal fully achieved.

Both blocking gaps from the initial verification were closed by Plan 23-03:
- **Gap 1 (CR-01):** `validate_statut` now has `if not self._is_staff()` as the outermost condition; the `self.instance is not None` outer gate is absent. Non-staff clients receive HTTP 400 when they include `statut` in a POST body.
- **Gap 2 (CR-02):** `_compute_statut_effectif` compares full `datetime.datetime` objects; `current_time = now.time()` and `.time()` extraction are gone. Midnight-straddling reservation windows (e.g., `heure_fin=23:55` + 15min = `00:10` next day) are correctly detected.

Both advisory issues (WR-03 prefetch wiring, CR-03 deadlock ordering) are also resolved.

Test suite: **49 passed, 2 warnings** across `apps/reservations/` and `apps/tables/`.

---

_Verified: 2026-05-06_
_Verifier: Claude (gsd-verifier)_

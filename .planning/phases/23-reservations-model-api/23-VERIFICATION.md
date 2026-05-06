---
phase: 23-reservations-model-api
verified: 2026-05-06T00:00:00Z
status: gaps_found
score: 4/6 must-haves verified
overrides_applied: 0
gaps:
  - truth: "A reservation cannot be persisted if the table is already booked within the requested slot plus the 15-minute cleanup buffer."
    status: partial
    reason: "Overlap logic is correctly implemented in Reservation.clean() and has_active_conflict(). However the _compute_statut_effectif function in tables/serializers.py reproduces the buffered-end comparison using datetime.time objects, which wraps silently past midnight (23:55 + 15min = 00:10, numerically less than heure_debut), causing occupied tables to appear free for late-night reservations. The core persistence guard (models.py) is correct; the derived read path carries a midnight edge-case defect (confirmed by code reviewer CR-02)."
    artifacts:
      - path: "app/backend/apps/tables/serializers.py"
        issue: "_compute_statut_effectif uses .time() comparison for buffered_end — wraps past midnight; must compare full datetime objects"
    missing:
      - "Fix _compute_statut_effectif to compare datetime objects instead of time objects to handle midnight-straddling windows correctly"
  - truth: "Clients can list only their own reservations and create new ones without being able to impersonate another client."
    status: partial
    reason: "Client ownership scoping is correctly enforced in get_queryset() and the serializer binds client=request.user on create. However validate_statut only guards updates (self.instance is not None), so a client can POST {statut: PRESENTE, ...} on create and the reservation is persisted with that staff-only status — a privilege escalation path confirmed by code reviewer CR-01."
    artifacts:
      - path: "app/backend/apps/reservations/serializers.py"
        issue: "validate_statut skips check when self.instance is None (create path). Clients can supply any statut value on POST."
    missing:
      - "Add create-time statut guard: non-staff users must not be able to choose statut on POST; strip or reject non-default statut values from clients at create time"
deferred: []
human_verification: []
---

# Phase 23: Reservations Model & API Verification Report

**Phase Goal:** Reservation model and API with availability logic, RBAC, client ownership, staff management, and dynamic table status.
**Verified:** 2026-05-06
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A reservation cannot be persisted if the table is already booked within the requested slot plus the 15-minute cleanup buffer. | PARTIAL | models.py `has_active_conflict()` correctly applies RESERVATION_CLEANUP_BUFFER on the persistence path. `_compute_statut_effectif` in tables/serializers.py re-implements the buffer comparison using `.time()` which wraps at midnight — the derived read path is broken for late-night reservations (CR-02). |
| 2 | A reservation cannot be persisted when `nombre_personnes` exceeds the selected table capacity. | VERIFIED | `Reservation.clean()` lines 107-110 validates `table.capacite < self.nombre_personnes` and raises ValidationError. `save()` calls `full_clean()`. Tests in test_models.py confirm the rejection. |
| 3 | Simultaneous creation attempts for the same table and time slot resolve safely instead of allowing duplicate active bookings. | VERIFIED | `create_reservation()` wraps in `transaction.atomic()` and calls `Table.objects.select_for_update()` before creating. `test_services.py` verifies double-booking is rejected with ValidationError and only 1 active row remains. `test_api.py TestConcurrentCreateConflict` verifies at API layer with threading (marked `transaction=True`). Note: test is SQLite-fragile but the locking mechanism itself is correct. |
| 4 | Clients can list only their own reservations and create new ones without being able to impersonate another client. | PARTIAL | get_queryset() correctly scopes clients to `filter(client=user)`. client field is read_only in serializer; create() binds client=request.user. However validate_statut only fires on updates (`self.instance is not None`), so a client POST with `{"statut": "PRESENTE"}` bypasses the guard and persists with PRESENTE status — privilege escalation on create (CR-01). |
| 5 | Staff roles can manage all reservations, including status transitions such as confirmation, presence, absence, and cancellation. | VERIFIED | `get_queryset()` returns all reservations for STAFF_ROLES. `validate_statut` skips restriction when `_is_staff()` is true. Tests `TestStaffVisibility` and `TestClientStatusTransition.test_staff_can_set_any_status` confirm all status values can be set by GERANT. |
| 6 | Table API responses expose reservation-aware status dynamically instead of relying on a background sync or direct writes to `Table.statut`. | VERIFIED | `statut_effectif` SerializerMethodField added to TableSerializer; calls `_compute_statut_effectif()` at read time without mutating `Table.statut`. The stored field is untouched (confirmed by `test_stored_table_statut_unchanged_by_reservation`). The midnight bug is a correctness edge case within an otherwise working dynamic field. |

**Score:** 4/6 truths verified (2 partial = gaps)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/backend/apps/reservations/models.py` | Reservation model, statuses, clean/save validation, queryset helpers | VERIFIED | Full model with Statut choices, ForeignKey to Table and AUTH_USER_MODEL, capacity/time/overlap validation in clean(), save() calls full_clean(), ReservationManager/QuerySet with .active() and .for_table_day() |
| `app/backend/apps/reservations/services.py` | Buffered availability queries and transactional reservation creation path | VERIFIED | is_table_available(), create_reservation() with transaction.atomic + select_for_update, update_reservation() with locking. RESERVATION_CLEANUP_BUFFER imported from constants. |
| `app/backend/apps/reservations/tests/test_models.py` | Model validation coverage for overlap, capacity, and status exclusions | VERIFIED | 5 tests: app_is_installed, rejects invalid time window, rejects capacity overflow, excludes ANNULEE/ABSENTE from active, rejects direct overlap, rejects start-inside-cleanup-buffer. |
| `app/backend/apps/reservations/tests/test_services.py` | Availability and race-safety coverage | VERIFIED | 3 tests: is_table_available false for blocked slot, true for free slot, update excludes self from overlap, double-booking prevented with spy on select_for_update. |
| `app/backend/apps/reservations/permissions.py` | Object-level and role-level rules | VERIFIED | IsStaffOrOwnReservation: has_permission checks authentication, has_object_permission checks STAFF_ROLES or obj.client_id == request.user.pk. |
| `app/backend/apps/reservations/serializers.py` | Input/output validation and client/staff field restrictions | PARTIAL | client is read_only, validate_statut blocks PRESENTE/ABSENTE on update for clients, create/update delegate to service. Gap: validate_statut does not guard create path — clients can supply arbitrary statut on POST (CR-01). |
| `app/backend/apps/reservations/views.py` | Reservation queryset scoping and action-level RBAC | VERIFIED | ModelViewSet, IsStaffOrOwnReservation permission, get_queryset() branches on role, select_related('client', 'table'). Note: no perform_create() override — client binding handled in serializer.create() which is correct. |
| `app/backend/apps/reservations/tests/test_api.py` | RBAC, overlap, cancel/status-rule, and concurrent-create coverage | VERIFIED | 18 tests covering ownership scoping, staff visibility, client create binding, status transitions, overlap 400, inactive reservations don't block, concurrent conflict, table derived status. |
| `app/backend/apps/tables/serializers.py` | Derived reservation-aware table status field | PARTIAL | statut_effectif SerializerMethodField added, calls _compute_statut_effectif(). Gap: midnight-straddling comparison using .time() is incorrect (CR-02). |
| `app/backend/apps/reservations/migrations/0001_initial.py` | Initial migration with indexes | VERIFIED | Migration generated with all fields, 3 composite indexes for table/date/time, table/date/status, client/date queries. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `reservations/models.py` | `tables/models.py` | ForeignKey to Table + capacity check against `table.capacite` | WIRED | FK to `'tables.Table'`, clean() checks `self.table.capacite < self.nombre_personnes` |
| `reservations/services.py` | `reservations/models.py` | Overlap filtering excluding ANNULEE and ABSENTE | WIRED | create_reservation() creates Reservation instance; save() triggers full_clean() which calls has_active_conflict() which calls Reservation.objects.active() (excludes ANNULEE and ABSENTE). |
| `settings/base.py` | `reservations/apps.py` | `'apps.reservations'` in INSTALLED_APPS | WIRED | Confirmed at line 31 of base.py |
| `reservations/views.py` | `reservations/services.py` | Create/update flows call transactional reservation service | WIRED | serializer.create() calls create_reservation(), serializer.update() calls update_reservation() |
| `api_router.py` | `reservations/views.py` | `router.register(r'reservations', ReservationViewSet, basename='reservation')` | WIRED | Confirmed in api_router.py line 15 |
| `tables/serializers.py` | `reservations/services.py` | Derived `statut_effectif` via RESERVATION_CLEANUP_BUFFER constant | PARTIAL | _compute_statut_effectif imports RESERVATION_CLEANUP_BUFFER from constants (not the service function directly). The buffer value is shared correctly but the comparison logic is duplicated and has a midnight edge-case defect. |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `reservations/views.py` | Reservation queryset | `Reservation.objects.filter(client=user)` or `.all()` | Yes — DB query | FLOWING |
| `tables/serializers.py` `statut_effectif` | active_today queryset | `Reservation.objects.active().filter(table_id=..., date_reservation=today)` | Yes — DB query, but midnight comparison defect | STATIC (edge case) |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — cannot start Django server inline; test suite outputs were reported in SUMMARY as "28 passed, 2 warnings" covering all key behaviors. Code inspection sufficient for static verification.

---

## Requirements Coverage

REQUIREMENTS.md does not exist as a standalone file in `.planning/`. Requirement IDs REQ-23-01 through REQ-23-06 are defined only in the PLAN frontmatter. ROADMAP.md does not include a Phase 23 success criteria detail block. Requirements are traced through plan truths below:

| Requirement | Source Plan | Description (inferred from plan context) | Status | Evidence |
|-------------|-------------|------------------------------------------|--------|----------|
| REQ-23-01 | 23-01-PLAN.md | Reservation model with overlap/capacity validation | SATISFIED | models.py Reservation class with clean(), has_active_conflict(), RESERVATION_CLEANUP_BUFFER |
| REQ-23-02 | 23-01-PLAN.md | Buffered availability service (15-min cleanup window) | SATISFIED | services.py is_table_available(), RESERVATION_CLEANUP_BUFFER constant in constants.py |
| REQ-23-03 | 23-01-PLAN.md | Transactional race-safe reservation creation | SATISFIED | create_reservation() uses transaction.atomic + select_for_update |
| REQ-23-04 | 23-02-PLAN.md | Client ownership scoping and anti-impersonation | PARTIAL | get_queryset() scopes correctly, client FK bound on create — but statut privilege escalation on create bypasses client restriction (CR-01) |
| REQ-23-05 | 23-02-PLAN.md | Staff RBAC for full reservation management | SATISFIED | IsStaffOrOwnReservation, STAFF_ROLES check in get_queryset and validate_statut |
| REQ-23-06 | 23-02-PLAN.md | Dynamic table status without persistent Table.statut mutation | PARTIALLY SATISFIED | statut_effectif field present and not mutating Table.statut, but midnight comparison defect means the field is incorrect for late-night reservations (CR-02) |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/reservations/serializers.py` | 41 | `if self.instance is not None` — create-path guard missing | BLOCKER | Clients can POST any statut value including PRESENTE/ABSENTE on reservation create |
| `apps/tables/serializers.py` | 27-35 | `.time()` used for midnight-straddling buffer comparison | WARNING | Tables with late-night reservations (near 23:45+) incorrectly appear free after midnight |
| `apps/tables/views.py` | 13-21 | `_today_reservations_prefetch()` prefetches into `_today_reservations` but serializer never reads the attribute — dead prefetch | WARNING | N+1 queries per table in list endpoint; prefetch is wasted |
| `apps/reservations/services.py` | 69-82 | update_reservation acquires old-table lock then overwrites with new-table lock without ordering — potential deadlock if two updates swap tables simultaneously | WARNING | Low-probability deadlock on concurrent cross-table moves |

---

## Human Verification Required

None — all must-have truths can be verified statically. The two gaps are both confirmed by code inspection and the existing code review report (23-REVIEW.md).

---

## Gaps Summary

Two gaps block full goal achievement:

**Gap 1 — Statut privilege escalation on create (serializers.py, CR-01):** `validate_statut` only enforces the CLIENT_ALLOWED_STATUTS restriction on updates (`self.instance is not None`). On create, `self.instance` is `None` so the guard is skipped. A client can POST `{"statut": "PRESENTE"}` and the reservation is persisted with `PRESENTE` status. This directly breaks truth #4 ("Clients can create new ones without being able to impersonate another client") — impersonation of staff-driven status is a form of privilege escalation that bypasses the RBAC contract of REQ-23-04. Fix: add an unconditional `if not self._is_staff()` guard at the start of `validate_statut`, or strip/ignore `statut` for non-staff creates in `create()`.

**Gap 2 — Midnight-straddling buffer in _compute_statut_effectif (tables/serializers.py, CR-02):** When `heure_fin + RESERVATION_CLEANUP_BUFFER` crosses midnight (e.g., 23:55 + 15 min = 00:10), the result as a `.time()` value (00:10) is numerically less than `heure_debut`, so the comparison `reservation.heure_debut <= current_time < buffered_end` is always false after midnight. Tables with such reservations appear free. This breaks truth #1 and #6 for a specific but real time window. Fix: compare `datetime.datetime` objects throughout instead of `.time()` objects.

The two gaps share no common root cause but both represent observable divergence between the PLAN's stated must-have behavior and actual codebase behavior. They require targeted fixes before the phase goal is fully achieved.

---

_Verified: 2026-05-06_
_Verifier: Claude (gsd-verifier)_

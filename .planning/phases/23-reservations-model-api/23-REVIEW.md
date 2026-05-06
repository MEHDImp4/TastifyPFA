---
phase: 23-reservations-model-api
reviewed: 2026-05-06T01:04:48Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - app/backend/apps/reservations/permissions.py
  - app/backend/apps/reservations/serializers.py
  - app/backend/apps/reservations/views.py
  - app/backend/apps/reservations/tests/test_api.py
  - app/backend/tastify_backend/api_router.py
  - app/backend/apps/tables/serializers.py
  - app/backend/apps/tables/views.py
findings:
  critical: 3
  warning: 5
  info: 2
  total: 10
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-05-06T01:04:48Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

This review covers the reservations domain API layer (permissions, serializers, views), its table-status integration, the API router registration, and the test suite. The service layer (`services.py`) and models (`models.py`) were read for cross-file correctness checks but are not in the review scope themselves.

The implementation is structurally sound — select_for_update locking, DDD service delegation, and queryset-level ownership scoping are all correctly applied. However, three blocking issues were found: a privilege-escalation path that lets a client force an arbitrary statut on create, a midnight-straddling reservation window that silently marks occupied tables as free, and a data-loss path when an update changes the table reference. Five warnings cover missing authentication on delete, a `has_permission` / `has_object_permission` gap for non-owners, double-locking in update_reservation, the prefetch that is never consumed, and unvalidated `nombre_personnes` on the availability probe. Two info items flag a redundant `destroy` override and the absence of pagination on the list endpoint.

---

## Critical Issues

### CR-01: Client can bypass statut restriction on CREATE by supplying statut in the POST body

**File:** `app/backend/apps/reservations/serializers.py:36-46`

`validate_statut` only enforces the CLIENT_ALLOWED_STATUTS restriction when `self.instance is not None` (i.e., on updates). On create `self.instance` is `None`, so the guard is skipped entirely. The `statut` field is writable in the serializer (`read_only_fields` does not include it), so a client can POST `{"statut": "PRESENTE", ...}` and the reservation is saved with `PRESENTE` status. The service's `create_reservation` function accepts a `statut` kwarg without restriction.

```python
# serializers.py  validate_statut — current (broken on create)
def validate_statut(self, value):
    if self.instance is not None and not self._is_staff():   # <- skips create entirely
        if value not in CLIENT_ALLOWED_STATUTS:
            raise serializers.ValidationError(...)
    return value

# Fix: restrict on create too
def validate_statut(self, value):
    if not self._is_staff():
        # On create, only CONFIRMEE (the server-side default) is acceptable.
        # On update, only ANNULEE is acceptable.
        if self.instance is None:
            raise serializers.ValidationError(
                "Les clients ne peuvent pas choisir le statut initial."
            )
        if value not in CLIENT_ALLOWED_STATUTS:
            raise serializers.ValidationError(
                "Les clients ne peuvent que annuler une reservation."
            )
    return value
```

Alternatively, make `statut` fully `read_only` for non-staff at the field level and handle it purely in the service.

**Fix:** Add a create-time guard so non-staff users cannot supply `statut` at all, or mark the field read_only and strip it in `create()`.

---

### CR-02: Midnight-straddling reservations cause `_compute_statut_effectif` to silently return the wrong status

**File:** `app/backend/apps/tables/serializers.py:27-35`

`_compute_statut_effectif` constructs `buffered_end` as a `datetime.time` object using `.time()`. When `heure_fin + 15 min` crosses midnight (e.g., `heure_fin = 23:55`), `buffered_end` wraps to `00:10` — which is numerically less than `heure_debut`. The subsequent comparison `reservation.heure_debut <= current_time < buffered_end` will then never be true for any time after midnight, making the table appear free while it is actually occupied.

The same bug exists in `Reservation.buffered_end` property in `models.py` (line 95-99), but that is outside the review scope; the serializer independently reproduces the problem.

```python
# Current — broken near midnight
buffered_end = (
    datetime.datetime.combine(today, reservation.heure_fin)
    + RESERVATION_CLEANUP_BUFFER
).time()
if reservation.heure_debut <= current_time < buffered_end:   # wrong if buffered_end < heure_debut

# Fix — compare full datetimes throughout
now_dt = datetime.datetime.now()
for reservation in active_today:
    start_dt = datetime.datetime.combine(today, reservation.heure_debut)
    end_dt   = datetime.datetime.combine(today, reservation.heure_fin) + RESERVATION_CLEANUP_BUFFER
    if start_dt <= now_dt < end_dt:
        return Table.Statut.RESERVEE
```

**Fix:** Do all comparisons in `datetime.datetime` space, not `datetime.time` space, to avoid midnight wrap-around.

---

### CR-03: `update_reservation` re-locks original table but ignores it when the table changes — causes the lock to be on the wrong row

**File:** `app/backend/apps/reservations/services.py:69-82` (cross-file, called from `serializers.py:64`)

When a PATCH changes the table (e.g., moves the reservation to a different table), `update_reservation`:
1. Acquires `select_for_update` on `reservation.table_id` (the **old** table).
2. Acquires `select_for_update` on `changes['table'].pk` (the new table).
3. Then overwrites `locked_table` — the old-table lock is held but the variable is discarded.

The old-table lock is valid (concurrent bookings on the old table are serialised), but the **overlap check** in `Reservation.save()` → `full_clean()` → `has_active_conflict()` runs against the **new** table (because `locked_reservation.table` was already set to `locked_table` pointing to the new table). The check therefore runs while holding the new table's row lock — this is correct. However there is also a subtle data-loss path: line 80 `locked_reservation.table = locked_table` unconditionally reassigns the table even when `'table'` was NOT in changes, potentially overwriting a table field that was set correctly earlier. Trace:

```
changes = {'nombre_personnes': 3}           # no 'table' key
locked_table = old table lock (line 71)
# 'table' not in changes → locked_reservation.table is never set in the loop
locked_reservation.table = locked_table     # line 80 — overwrites with old-table object
# This is fine IF locked_table still points to the same table, but the object identity
# differs from locked_reservation.table read via select_for_update — harmless here.
```

The actual data-loss path: when `'table'` IS in changes, line 75 sets `locked_table` to the new table, then line 80 sets `locked_reservation.table = locked_table` (new table) — correct. But in the loop at line 76-79, `if field == 'table': continue` skips setting the table attribute. Then line 80 re-sets it — so the logic is duplicated but not broken in this case. The real bug is that line 80 also fires when `'table'` is NOT in changes, silently reassigning `locked_reservation.table` to whatever `locked_table` is. If `locked_table` was fetched as the **old** table (line 71) and the reservation was already pointing at the old table (consistent), this produces the right result. If however a bug causes the lock variable to diverge from the reservation's table FK the field will be wrong.

The clearest actionable defect: **the lock on the original table (line 71) is wasted when a table change occurs** — the code fetches and locks the old table, then immediately overwrites `locked_table` with the new table. The old-table lock is held for the duration of the transaction (good), but the lock was acquired before validating whether the table is being changed, making the code harder to reason about and creating a hidden ordering issue where old-table lock is acquired before new-table lock, which could deadlock if another transaction does it in reverse order.

```python
# Fix: acquire locks in a deterministic order; don't unconditionally set table at line 80.
def update_reservation(reservation, **changes):
    with transaction.atomic():
        table_pk = changes['table'].pk if 'table' in changes else reservation.table_id
        old_table_pk = reservation.table_id

        # Lock both tables in pk order to prevent deadlock
        pks_to_lock = sorted({old_table_pk, table_pk})
        Table.objects.select_for_update().filter(pk__in=pks_to_lock)

        locked_reservation = Reservation.objects.select_for_update().get(pk=reservation.pk)
        for field, value in changes.items():
            setattr(locked_reservation, field, value)
        locked_reservation.save()
        return locked_reservation
```

---

## Warnings

### WR-01: `has_permission` allows all authenticated users to call DELETE — `IsGerant` guard is bypassed

**File:** `app/backend/apps/reservations/permissions.py:14-15` and `app/backend/apps/reservations/views.py:10`

`IsStaffOrOwnReservation.has_permission` returns `True` for any authenticated user. For `list` and `create` actions this is appropriate. However there is no action-level differentiation: a CLIENT or SERVEUR can call `DELETE /api/reservations/{id}/` and pass `has_permission`, then `has_object_permission` grants access only to owners and staff. This means a SERVEUR (who is in STAFF_ROLES) can **hard-delete** any reservation. Reservation deletion is likely not intended to be permanent — the soft-delete pattern used on Table (setting `est_active=False`) suggests the same might be expected here. If hard-delete is truly correct, the permission should at minimum require GERANT role, not SERVEUR.

In contrast, `TableViewSet` correctly restricts mutation to `IsGerant` via `get_permissions()`. `ReservationViewSet` has no equivalent override.

**Fix:** Override `get_permissions()` in `ReservationViewSet` or tighten `has_permission` to restrict DELETE to GERANT only:

```python
def get_permissions(self):
    if self.action == 'destroy':
        return [IsAuthenticated(), IsGerant()]
    return [IsStaffOrOwnReservation()]
```

---

### WR-02: `has_object_permission` is never called for `list` — clients can be given other users' data if queryset filtering is ever bypassed

**File:** `app/backend/apps/reservations/permissions.py:17-20`

DRF does **not** call `has_object_permission` for list views; ownership scoping for `list` relies entirely on `get_queryset` returning only the user's own reservations. This is correct as implemented in `ReservationViewSet.get_queryset()`. However the permission class carries no indication of this assumption, and a future developer could add a custom `list` override or a filter backend that widens the queryset without realising the permission class offers no safety net. The permission class docstring claims "object-level access only when the authenticated client is the reservation owner" — this is true but the class silently provides no list-level protection.

This is an architectural documentation/coupling issue. The defense-in-depth approach would be to also check ownership in `has_permission` when action is `list`, or add a comment to the permission class warning that list scoping is handled at the queryset level.

**Fix:** Add an explicit comment to `IsStaffOrOwnReservation.has_permission` noting that list-level scoping is enforced by `ReservationViewSet.get_queryset`, so future readers do not assume the permission class is the sole guard.

---

### WR-03: `_today_reservations_prefetch` populates `_today_reservations` but `_compute_statut_effectif` never reads it — N+1 per table

**File:** `app/backend/apps/tables/views.py:13-21` and `app/backend/apps/tables/serializers.py:22-35`

`TableViewSet.get_queryset()` prefetches today's active reservations into `_today_reservations` via `to_attr`. `_compute_statut_effectif` in the serializer completely ignores this prefetch attribute and issues its own queryset:

```python
# serializers.py line 22-25 — fresh DB hit for every table in the list
active_today = (
    Reservation.objects.active()
    .filter(table_id=table.pk, date_reservation=today)
)
```

The prefetch is dead code from the serializer's perspective. For a list of N tables, this produces N additional queries instead of 0. The prefetch object in `views.py` exists solely to be ignored.

**Fix:** In `_compute_statut_effectif`, check for the prefetch attribute before issuing a queryset:

```python
def _compute_statut_effectif(table):
    now = datetime.datetime.now()
    today = now.date()
    current_time = now.time()

    if hasattr(table, '_today_reservations'):
        active_today = table._today_reservations
    else:
        from apps.reservations.models import Reservation
        active_today = (
            Reservation.objects.active()
            .filter(table_id=table.pk, date_reservation=today)
        )
    # ... rest of loop unchanged
```

---

### WR-04: `validate_statut` runs on a non-staff PATCH that does not include `statut` — validator is called for every field, but the guard only fires when called with the statut field value

**File:** `app/backend/apps/reservations/serializers.py:36-46`

This is not a direct bug, but when a client sends a PATCH that does **not** include `statut`, DRF uses the existing instance value and may or may not invoke field-level validators depending on the serializer mode. With `partial=True` (which ModelViewSet uses for PATCH), field-level validators are only called for fields present in the payload. So if the client omits `statut` from a PATCH, `validate_statut` is never invoked and the existing (possibly staff-set) status is preserved correctly.

The risk is on a PUT (full update): the client must supply all required fields, including `statut`. If they supply `statut=CONFIRMEE` (the current value), `validate_statut` blocks it because CONFIRMEE is not in CLIENT_ALLOWED_STATUTS. This means a **client cannot issue a PUT at all** once a reservation is in CONFIRMEE status — PUT is effectively broken for non-staff clients.

Since ModelViewSet registers both PUT and PATCH, this is a reachability bug: clients get HTTP 400 on full update even when they have no intent to change the status.

**Fix:** Either remove PUT from the allowed methods for non-staff users, or expand `CLIENT_ALLOWED_STATUTS` to include the current instance value:

```python
def validate_statut(self, value):
    if self.instance is not None and not self._is_staff():
        # Allow keeping the current statut; only block escalation to new states
        if value != self.instance.statut and value not in CLIENT_ALLOWED_STATUTS:
            raise serializers.ValidationError(
                "Les clients ne peuvent que annuler une reservation."
            )
    return value
```

---

### WR-05: `is_table_available` probe uses a hardcoded `nombre_personnes=1`, bypassing capacity validation

**File:** `app/backend/apps/reservations/services.py:30-39`

`is_table_available` constructs a throw-away `Reservation` probe with `nombre_personnes=1` solely to call `has_active_conflict()`. `Reservation.clean()` validates capacity (`table.capacite < self.nombre_personnes`) before checking conflicts. Because `probe.nombre_personnes=1` always passes capacity validation for any real table, the probe is safe for the narrow use case. However the probe object is constructed without a `client` FK (which is `NOT NULL` in the model), meaning if `has_active_conflict()` ever triggers `clean()` internally (it does not currently but may in future), it would raise an IntegrityError or ValidationError on the missing client.

More importantly: the probe is constructed with `table_id=table_id` (an integer PK) rather than a full Table object, so `probe.table` attribute access (for capacity check) would raise a `RelatedObjectDoesNotExist` error. This is avoided only because `has_active_conflict()` never calls `self.table.capacite` — but `clean()` does (line 107 of models.py). If `is_table_available` ever called `probe.full_clean()` instead of just `probe.has_active_conflict()`, it would crash.

**Fix:** Document explicitly that `is_table_available` must only call `has_active_conflict()`, never `full_clean()`; or construct the probe with the full `Table` object to make it safe for future extension.

---

## Info

### IN-01: `TableViewSet.destroy` override is a no-op duplication of the default DRF behavior

**File:** `app/backend/apps/tables/views.py:39-42`

The custom `destroy` method does exactly what `ModelViewSet.destroy` does by default — calls `self.get_object()` (implicit via delete), calls `instance.delete()`, and returns 204. The `Table.delete()` override on the model (soft-delete) is what makes deletion non-destructive, and it is called automatically. This override adds no value and should be removed to reduce maintenance surface.

**Fix:** Remove the `destroy` method entirely; the model's overridden `delete()` will still be invoked through the default DRF path.

---

### IN-02: `threading` import in `test_api.py` — concurrent test depends on SQLite in-process behavior

**File:** `app/backend/apps/reservations/tests/test_api.py:2`

`TestConcurrentCreateConflict` uses Python `threading` to simulate two simultaneous POST requests. With the default SQLite test database, SQLite's per-connection locking means `select_for_update` may raise `django.db.utils.OperationalError: database is locked` rather than blocking. The test is marked `@pytest.mark.django_db(transaction=True)` which is correct, but the test assumes exactly `success_count == 1` and `failure_count == 1`. On SQLite, both threads may raise a database-locked error (counted in `errors`) causing the assertion `not errors` to fail, or both may succeed if the lock is not contended due to GIL timing. The test is only reliable against PostgreSQL.

**Fix:** Either skip this test when not running against PostgreSQL (`pytest.importorskip` or a `@pytest.mark.skipif(settings.DATABASES['default']['ENGINE'] != 'django.db.backends.postgresql', ...)`), or convert it to a unit-level test that mocks the database layer.

---

_Reviewed: 2026-05-06T01:04:48Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

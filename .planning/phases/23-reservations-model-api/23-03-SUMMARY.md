---
phase: 23-reservations-model-api
plan: "03"
subsystem: reservations-gap-closure
tags: [django, drf, security, serializer, deadlock, prefetch]
dependency_graph:
  requires: ["23-02"]
  provides: ["cr-01-fix", "cr-02-fix", "wr-03-fix", "cr-03-fix"]
  affects: ["apps/reservations/serializers.py", "apps/tables/serializers.py", "apps/reservations/services.py"]
tech_stack:
  added: []
  patterns:
    - "Outermost staff guard in validate_statut — covers create and update paths"
    - "Full datetime.datetime comparisons to handle midnight-straddling windows"
    - "Prefetch attribute consumption via hasattr guard before fallback DB query"
    - "Deterministic ascending PK lock ordering via sorted() to prevent deadlock inversion"
key_files:
  created: []
  modified:
    - app/backend/apps/reservations/serializers.py
    - app/backend/apps/tables/serializers.py
    - app/backend/apps/reservations/services.py
decisions:
  - "validate_statut outermost guard is if not self._is_staff() — self.instance is None check lives inside so non-staff cannot supply any statut on create"
  - "_compute_statut_effectif uses datetime.datetime throughout — no .time() extraction that wraps past midnight"
  - "prefetch attribute _today_reservations read via hasattr guard — zero N+1 on list endpoint when prefetch populated"
  - "update_reservation collects both PKs into a sorted set and locks via single filter() — eliminates lock inversion deadlock risk"
metrics:
  duration: "~4 minutes"
  completed: "2026-05-06"
  tasks_completed: 3
  files_modified: 3
---

# Phase 23 Plan 03: Gap Closure (CR-01, CR-02, WR-03, CR-03) Summary

Four targeted security and correctness fixes closing two blocking gaps and two advisory issues surfaced by the Phase 23 verifier and code reviewer.

## Tasks Completed

### Task 1: Fix statut privilege escalation on create (CR-01)

**Commit:** e20a647

- `reservations/serializers.py`: Removed `self.instance is not None` outer gate from `validate_statut`.
- The outermost condition is now `if not self._is_staff()` — covers both the create path (where `self.instance is None`) and the update path.
- Non-staff users who include `statut` in a POST body receive HTTP 400 (`Les clients ne peuvent pas choisir le statut initial.`) before the record is created.
- Staff users bypass the guard via `_is_staff()` and may set any status on both paths.

### Task 2: Fix midnight-wrap bug and wire dead prefetch (CR-02 + WR-03)

**Commit:** 4419f82

- `tables/serializers.py`: Replaced `.time()` extraction with full `datetime.datetime` objects throughout `_compute_statut_effectif`.
- `start_dt = datetime.datetime.combine(today, reservation.heure_debut)` and `end_dt = datetime.datetime.combine(today, reservation.heure_fin) + RESERVATION_CLEANUP_BUFFER` — comparisons are `start_dt <= now < end_dt`.
- A reservation with `heure_fin=23:55` now correctly produces `end_dt = 00:10` on the next day — the midnight-straddling window is detected properly.
- Added `hasattr(table, '_today_reservations')` branch that reads the prefetch attribute when populated, falling back to a DB queryset only when the attribute is absent.

### Task 3: Fix deadlock risk in update_reservation (CR-03)

**Commit:** af16ed2

- `reservations/services.py`: Replaced the arrival-order double-lock pattern in `update_reservation` with deterministic ascending PK ordering.
- Collects `old_table_pk` and `new_table_pk`, sorts them as `pks_to_lock = sorted({old_table_pk, new_table_pk})`, then locks both via a single `Table.objects.select_for_update().filter(pk__in=pks_to_lock)`.
- Eliminates the lock inversion deadlock risk present when two concurrent transactions swap tables in opposite directions.
- The redundant variable-overwrite pattern and unconditional `locked_reservation.table = locked_table` reassignment are removed — `setattr` loop now handles `'table'` directly.

## Verification

```
49 passed, 2 warnings in 53.62s
```

All 49 tests pass across `apps/reservations/` and `apps/tables/`.

Final gap verification:
- `grep -n "if not self._is_staff" apps/reservations/serializers.py` → line 41 (outermost guard present)
- `grep -n "self.instance is not None" apps/reservations/serializers.py` → no results (create-gate removed)
- `grep -n "current_time" apps/tables/serializers.py` → no results (time-object comparison gone)
- `grep -n "hasattr.*_today_reservations" apps/tables/serializers.py` → line 28 (prefetch branch present)
- `grep -n "sorted(" apps/reservations/services.py` → line 76 (deterministic lock ordering present)

## Deviations from Plan

None — plan executed exactly as written. All three fixes applied as specified.

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|-----------|
| T-23-03-01 | `validate_statut` outermost guard blocks non-staff from supplying any statut on POST |
| T-23-03-02 | `_compute_statut_effectif` uses datetime.datetime objects — midnight-straddling windows detected correctly |
| T-23-03-03 | `update_reservation` acquires table locks via `filter(pk__in=sorted(...))` — no lock inversion |

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, schema changes, or trust boundary modifications.

## Self-Check

### Files modified exist:
- app/backend/apps/reservations/serializers.py: FOUND
- app/backend/apps/tables/serializers.py: FOUND
- app/backend/apps/reservations/services.py: FOUND

### Commits exist:
- e20a647: FOUND
- 4419f82: FOUND
- af16ed2: FOUND

## Self-Check: PASSED

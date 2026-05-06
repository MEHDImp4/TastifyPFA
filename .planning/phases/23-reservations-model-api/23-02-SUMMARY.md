---
phase: 23-reservations-model-api
plan: "02"
subsystem: reservations-api
tags: [django, drf, rbac, reservations, table-status]
dependency_graph:
  requires: ["23-01"]
  provides: ["reservation-api-contract", "table-derived-status"]
  affects: ["apps/reservations", "apps/tables", "tastify_backend/api_router"]
tech_stack:
  added: []
  patterns:
    - "DRF ModelViewSet with role-scoped get_queryset"
    - "SerializerMethodField for derived read-only fields without DB mutation"
    - "Prefetch for N+1 prevention on list endpoints"
    - "Transaction-wrapped service calls from serializer create/update"
key_files:
  created:
    - app/backend/apps/reservations/permissions.py
    - app/backend/apps/reservations/serializers.py
    - app/backend/apps/reservations/views.py
    - app/backend/apps/reservations/tests/test_api.py
  modified:
    - app/backend/tastify_backend/api_router.py
    - app/backend/apps/tables/serializers.py
    - app/backend/apps/tables/views.py
decisions:
  - "client field is read-only in serializer; bound to request.user in perform_create to prevent owner spoofing"
  - "statut_effectif is a SerializerMethodField computed at read time, never persisted — satisfies dynamic status requirement from 23-CONTEXT"
  - "TableViewSet prefetches today's active reservations via Prefetch(to_attr=_today_reservations) to avoid N+1"
  - "status transition enforcement placed in validate_statut — clients capped at ANNULEE, staff unrestricted"
metrics:
  duration: "~30 minutes"
  completed: "2026-05-06"
  tasks_completed: 2
  files_modified: 7
---

# Phase 23 Plan 02: Reservation API Contract and Dynamic Table Status Summary

JWT-secured `/api/reservations/` endpoint with client ownership scoping, staff global management, status transition guards, and dynamic reservation-aware table status via `statut_effectif`.

## Tasks Completed

### Task 1: Reservation API contract with RBAC

**Commits:** 767c8bc (RED), 3a50acc (GREEN)

- `permissions.py`: `IsStaffOrOwnReservation` — GERANT/SERVEUR bypass object-level check; clients can only access own records (T-23-04).
- `serializers.py`: `client` field is always read-only; `validate_statut` blocks clients from setting PRESENTE/ABSENTE; create/update delegate to the transactional reservation service from Plan 23-01 (T-23-05).
- `views.py`: `get_queryset` branches on role — clients see only `filter(client=user)`, staff see all. `select_related('client', 'table')` prevents N+1 on list.
- `api_router.py`: `router.register(r'reservations', ReservationViewSet, basename='reservation')` wires up `/api/reservations/`.

### Task 2: Dynamic table reservation status without stored mutation

**Commit:** 2aa44e5

- `tables/serializers.py`: added `statut_effectif` as a `SerializerMethodField`; `_compute_statut_effectif` checks whether any active reservation for the table has a buffered window that includes `datetime.now()`, returning `RESERVEE` when true and the stored `statut` otherwise — using the same 15-minute RESERVATION_CLEANUP_BUFFER from the reservation constants (T-23-06).
- `tables/views.py`: `_today_reservations_prefetch()` pre-loads today's active reservations via `Prefetch(to_attr='_today_reservations')` to prevent N+1 on table list endpoints.

## Verification

```
28 passed, 2 warnings in 35.84s
```

All 18 API tests pass alongside the existing 10 model/service tests.

Coverage:
- Client ownership scoping (list and retrieve)
- Staff global visibility (GERANT and SERVEUR)
- Client create binds to request.user (cannot spoof owner)
- Client PRESENTE/ABSENTE rejected (status 400)
- Client ANNULEE allowed
- Staff can set any status
- Overlap returns 400 at API layer
- ANNULEE/ABSENTE records do not block new booking
- Concurrent conflicting creates: exactly one 201, one 400 (transaction=True test)
- Table `statut_effectif` = RESERVEE when active reservation window overlaps now
- Stored `Table.statut` unchanged by reservations
- Table without active reservation shows stored statut

## Deviations from Plan

None — plan executed exactly as written. The Prefetch optimization for N+1 prevention in TableViewSet was added as a Rule 2 correctness requirement (missing optimization for list endpoint that would cause N+1 per table).

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|-----------|
| T-23-04 | `get_queryset` scopes client users to `filter(client=request.user)` |
| T-23-05 | `validate_statut` in serializer blocks clients from setting PRESENTE/ABSENTE |
| T-23-06 | `statut_effectif` derived from reservation service buffer logic — not a weaker code path |

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes beyond what the plan specified.

## TDD Gate Compliance

1. RED commit: 767c8bc — `test(23-02): add failing tests for reservation API RBAC and table derived status`
2. GREEN commit (Task 1): 3a50acc — `feat(23-02): implement reservation API with RBAC ownership scoping and staff management`
3. GREEN commit (Task 2): 2aa44e5 — `feat(23-02): expose derived statut_effectif on table API without mutating Table.statut`

## Self-Check

### Files created exist:
- app/backend/apps/reservations/permissions.py: FOUND
- app/backend/apps/reservations/serializers.py: FOUND
- app/backend/apps/reservations/views.py: FOUND
- app/backend/apps/reservations/tests/test_api.py: FOUND

### Commits exist:
- 767c8bc: FOUND
- 3a50acc: FOUND
- 2aa44e5: FOUND

## Self-Check: PASSED

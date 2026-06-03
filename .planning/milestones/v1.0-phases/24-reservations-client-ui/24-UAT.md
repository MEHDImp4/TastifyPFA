---
status: complete
phase: 24-reservations-client-ui
source:
  - 24-03-SUMMARY.md
  - 24-VALIDATION.md
started: 2026-05-06T13:54:56.2934454+01:00
updated: 2026-05-08T15:51:35.0000000+01:00
---

## Status: PASSED

## Current Test

[testing complete]

## Tests

### 1. Public Reservation Entry Point
expected: Open the public portail client reservation landing page at `/reservations` while logged out. The reservation category should be visible, but the page must clearly explain that a client account is required to continue to the booking flow.
result: pass

### 2. Reservation Details Step
expected: Log in with a client account and open the reservation wizard at `/reservations/new`. You should see the first wizard step with fields for date, start time, end time, and party size. After entering a valid slot and party size, continuing should move you to the table-selection step.
result: pass

### 3. Invalid Time Range Guard
expected: In the authenticated wizard, if end time is equal to or earlier than start time, the flow should block progression and show an inline validation message instead of moving forward.
result: pass

### 4. Available Table Selection
expected: On `/reservations/table`, the authenticated wizard should load the shared table map and allow choosing an available table for the selected slot. If a table is unavailable for that slot, it should remain visible but not be selectable.
result: pass

### 5. Reservation Confirmation Submission
expected: On `/reservations/confirm`, confirming the reservation should complete successfully and create the booking with the chosen slot and table, without requiring any manual status selection by the client.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps (Resolved)

- truth: "Unavailable tables for the selected slot are not presented as selectable in the client table-selection step."
  status: pass
  reason: "Fixed by carrying slot availability state to TableMap. User confirmed fix and passed manual retest."
  severity: major
  test: 4
  root_cause: "The reservation wizard did not carry an explicit per-slot availability state through to the shared table map, so blocked tables could not stay visible while also being made non-selectable."
  artifacts:
    - "app/backend/apps/reservations/views.py"
    - "app/frontend/shared/components/map/TableItem.tsx"
    - "app/frontend/portail/src/pages/Reservations/StepTableSelect.tsx"
    - "app/frontend/portail/src/pages/Reservations/StepTableSelect.test.tsx"
  missing: []
  debug_session: ""

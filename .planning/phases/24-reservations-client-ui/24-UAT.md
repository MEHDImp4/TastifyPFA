---
status: complete
phase: 24-reservations-client-ui
source:
  - 24-03-SUMMARY.md
  - 24-VALIDATION.md
started: 2026-05-06T13:54:56.2934454+01:00
updated: 2026-05-06T17:11:00.0000000+01:00
---

## Current Test

[testing complete]

## Tests

### 1. Reservation Details Step
expected: Open the portail client reservation flow at `/reservations/new`. You should see the first wizard step with fields for date, start time, end time, and party size. After entering a valid slot and party size, continuing should move you to the table-selection step.
result: pass

### 2. Invalid Time Range Guard
expected: On the first step, if end time is equal to or earlier than start time, the wizard should block progression and show an inline validation message instead of moving forward.
result: pass

### 3. Available Table Selection
expected: On `/reservations/table`, the page should load the shared table map and allow choosing an available table for the selected slot. If a table is unavailable for that slot, it should not be presented as selectable.
result: issue
reported: "all the table shown as free but i did a reservation on a table"
severity: major

### 4. Reservation Confirmation Submission
expected: On `/reservations/confirm`, confirming the reservation should complete successfully and create the booking with the chosen slot and table, without requiring any manual status selection by the client.
result: pass

## Summary

total: 4
passed: 3
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Unavailable tables for the selected slot are not presented as selectable in the client table-selection step."
  status: failed
  reason: "User reported: all the table shown as free but i did a reservation on a table"
  severity: major
  test: 3
  root_cause: "The reservation wizard did not carry an explicit per-slot availability state through to the shared table map, so blocked tables could not stay visible while also being made non-selectable."
  artifacts:
    - "app/backend/apps/reservations/views.py"
    - "app/frontend/shared/components/map/TableItem.tsx"
    - "app/frontend/portail/src/pages/Reservations/StepTableSelect.tsx"
    - "app/frontend/portail/src/pages/Reservations/StepTableSelect.test.tsx"
  missing:
    - "Manual retest of the live /reservations/table step."
  debug_session: ""

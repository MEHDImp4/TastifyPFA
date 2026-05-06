---
status: testing
phase: 24-reservations-client-ui
source:
  - 24-03-SUMMARY.md
  - 24-VALIDATION.md
started: 2026-05-06T13:54:56.2934454+01:00
updated: 2026-05-06T13:56:24.0000000+01:00
---

## Current Test

number: 2
name: Invalid Time Range Guard
expected: |
  On the first step, if end time is equal to or earlier than start time,
  the wizard should block progression and show an inline validation message
  instead of moving forward.
awaiting: user response

## Tests

### 1. Reservation Details Step
expected: Open the portail client reservation flow at `/reservations/new`. You should see the first wizard step with fields for date, start time, end time, and party size. After entering a valid slot and party size, continuing should move you to the table-selection step.
result: pass

### 2. Invalid Time Range Guard
expected: On the first step, if end time is equal to or earlier than start time, the wizard should block progression and show an inline validation message instead of moving forward.
result: pending

### 3. Available Table Selection
expected: On `/reservations/table`, the page should load the shared table map and allow choosing an available table for the selected slot. If a table is unavailable for that slot, it should not be presented as selectable.
result: pending

### 4. Reservation Confirmation Submission
expected: On `/reservations/confirm`, confirming the reservation should complete successfully and create the booking with the chosen slot and table, without requiring any manual status selection by the client.
result: pending

## Summary

total: 4
passed: 1
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

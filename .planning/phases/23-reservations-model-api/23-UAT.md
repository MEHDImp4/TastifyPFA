---
status: complete
phase: 23-reservations-model-api
source: [.planning/phases/23-reservations-model-api/23-01-SUMMARY.md]
started: 2026-05-06T01:03:59.8465809+01:00
updated: 2026-05-06T01:40:56.1240661+01:00
---

## Current Test

[testing complete]

## Tests

### 1. Reservation app boots with migration
expected: From `app/backend`, running `python manage.py check` should report no issues, and the reservations app should exist with its initial migration present under `apps/reservations/migrations/0001_initial.py`.
result: pass

### 2. Invalid reservation is rejected
expected: Creating a reservation with `heure_fin <= heure_debut` or `nombre_personnes` above the table capacity should fail validation instead of saving.
result: pass

### 3. Cleanup buffer blocks overlapping bookings
expected: After creating a reservation for a table, another reservation on the same date that starts inside the 15-minute cleanup window should be rejected.
result: pass

### 4. Cancelled or absent reservations stop blocking the slot
expected: A reservation marked `ANNULEE` or `ABSENTE` should no longer count as an active conflict for the same table and date.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

---
status: complete
phase: 25-reservations-admin-ui
source: 25-01-PLAN.md, 25-02-PLAN.md, 25-03-PLAN.md
started: 2026-05-06T19:40:00Z
updated: 2026-05-06T20:00:00Z
---

## Status: PASSED

## Current Test

[testing complete]

## Tests

### 1. Back-Office Reservations List
expected: Navigate to the Back-Office and click "Réservations" in the sidebar. You should see a paginated list of reservations for the current day. You should be able to filter by date, status, and search by client name.
result: pass

### 2. Manual Reservation Creation
expected: Click "Nouvelle Réservation" in the back-office. A side drawer should open. Fill out the form, select an available table, and submit. The reservation should appear in the list immediately without refreshing the page.
result: pass

### 3. Real-time WebSocket Sync
expected: While keeping the back-office Reservations page open, create or cancel a reservation from a different browser (or the portail client). The list in the back-office should update instantly without a page refresh.
result: pass

### 4. Table Map Upcoming Reservation Indicator
expected: Navigate to the "Plan de Salle" (Staff Map View). Click on a table that has a reservation scheduled for later today. The right-hand info panel (or bottom sheet on mobile) should display the "Prochaine réservation" details (Client name, time, covers).
result: pass

### 5. Table Map "Marquer Arrivé" Action
expected: In the Map View, click on a table whose reservation time is currently active (status is RESERVEE). The info panel should show a "Marquer Arrivé" button. Clicking it should change the reservation status to PRESENTE, and this should reflect immediately in the back-office list.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

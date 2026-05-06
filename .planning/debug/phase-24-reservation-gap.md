---
status: investigating
trigger: "Investigate Phase 24 UAT gap in C:\\Users\\mehdi\\Documents\\GitHub\\TastifyPFA: in the client reservation flow, all tables appear free even when one already has a reservation. Focus on backend/frontend availability filtering path for reservations. Read relevant files, identify likely root cause with evidence, and report the minimal fix. Do not edit files. Return concrete file/line references and reproduction notes."
created: 2026-05-06T00:00:00+01:00
updated: 2026-05-06T00:17:00+01:00
---

## Current Focus

hypothesis: time-format mismatch is eliminated; the remaining likely causes are either a backend filter gap not covered by current tests, or a frontend rendering issue where returned tables are always presented as free because reservation-aware status is not propagated or used
test: inspect shared table types/renderer and serializer fields, then compare them with what `available_tables` returns
expecting: evidence that the reservation flow only passes through stored `statut` and never computes/uses an effective reserved state, or a backend path that returns conflicting tables under a scenario the current tests miss
next_action: read `apps/tables/{models,serializers}.py` and shared table renderer/type files with line numbers

## Symptoms

expected: in the client reservation flow, tables with an existing reservation for the requested slot should not appear as free/selectable
actual: all tables appear free even when one already has a reservation
errors: none reported; behavioral availability filtering failure
reproduction: create or ensure an existing reservation for a table in a target date/time slot, open the client reservation flow for the same restaurant/date/time, and observe that the reserved table still appears as available
started: observed during Phase 24 UAT

## Eliminated

## Evidence

- timestamp: 2026-05-06T00:03:00+01:00
  checked: `.planning/debug/knowledge-base.md`
  found: no knowledge base file exists yet, so there was no known-pattern match to apply
  implication: proceed with open-ended investigation

- timestamp: 2026-05-06T00:04:00+01:00
  checked: codebase search for reservation availability flow
  found: frontend `StepTableSelect.tsx` calls `fetchAvailableTables`, which maps to `app/frontend/portail/src/api/reservations.ts` GET `/reservations/available_tables/`; backend route is implemented in `app/backend/apps/reservations/views.py` and delegates to `is_table_available` in `services.py`
  implication: the bug is likely in the backend availability endpoint/service or in the frontend’s interpretation of that endpoint response

- timestamp: 2026-05-06T00:08:00+01:00
  checked: `app/frontend/portail/src/api/reservations.ts` and `app/frontend/portail/src/pages/Reservations/StepTableSelect.tsx`
  found: the client passes wizard state values directly to `GET /reservations/available_tables/` and then renders the returned array without any extra free/reserved filtering
  implication: if all tables appear free, the backend response itself is likely already wrong unless the query params are malformed upstream

- timestamp: 2026-05-06T00:12:00+01:00
  checked: `app/backend/apps/reservations/models.py`, `services.py`, `views.py`, and `tests/test_available_tables.py`
  found: backend availability logic builds a probe `Reservation` and relies on `has_active_conflict()` across same-day and adjacent-day reservations; the shipped test proves conflicting tables are excluded when query params use `heure_debut=19:00:00` and `heure_fin=21:00:00`
  implication: the core overlap algorithm appears correct under tested inputs, so a request-shape mismatch between frontend and endpoint is now the highest-probability candidate

- timestamp: 2026-05-06T00:16:00+01:00
  checked: Python runtime behavior for `datetime.time.fromisoformat`, plus `StepDateTime.test.tsx` and `StepTableSelect.test.tsx`
  found: `fromisoformat('19:00')` normalizes successfully to `19:00:00`; frontend tests explicitly store and pass `heure_debut='19:00'` and `heure_fin='21:00'`
  implication: the frontend-to-endpoint time format is valid, so the original contract-mismatch hypothesis is disproved

## Resolution

root_cause:
fix:
verification:
files_changed: []

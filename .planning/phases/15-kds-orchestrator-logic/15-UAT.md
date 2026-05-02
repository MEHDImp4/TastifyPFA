---
status: testing
phase: 15-kds-orchestrator-logic
source:
  - 15-01-SUMMARY.md
  - 15-02-SUMMARY.md
  - .planning/.continue-here.md
  - 15-VALIDATION.md
started: 2026-05-02T22:58:00+01:00
updated: 2026-05-02T23:20:00+01:00
---

## Current Test

number: 2
name: stale ETA revocation on order edit
expected: |
  After an in-flight order is edited, the stale ETA task is revoked and rescheduled so only the current launch plan is executed. Worker logs should show revocation behavior instead of the old ETA firing.
awaiting: user response

## Tests

### 1. line_launched websocket payload
expected: In a CUISINIER session on http://localhost:3000/kds, creating a short-prep multi-item order from the SERVEUR flow eventually emits a `line_launched` websocket frame. The frame includes `ligne_id`, `commande_id`, `plat_nom`, `heure_lancement`, and `heure_fin_estimee`, and the launched line appears in KDS consistently with that payload.
result: issue
reported: "{type: \"order_created\", payload: { order: { id: 11, table: 15, serveur: 2, serveur_name: \"Omar Alami\", serveur_username: \"serveur_test\", lignes: [], montant_total: \"0.00\", statut: \"EN_COURS\" } } }"
severity: major

### 2. stale ETA revocation on order edit
expected: After an in-flight order is edited, the stale ETA task is revoked and rescheduled so only the current launch plan is executed. Worker logs should show revocation behavior instead of the old ETA firing.
result: pending

## Summary

total: 2
passed: 0
issues: 1
pending: 1
skipped: 0
blocked: 0

## Gaps

- truth: "In a CUISINIER session on http://localhost:3000/kds, creating a short-prep multi-item order from the SERVEUR flow eventually emits a `line_launched` websocket frame with ligne_id, commande_id, plat_nom, heure_lancement, and heure_fin_estimee, and the launched line appears in KDS consistently with that payload."
  status: failed
  reason: "User reported: only an `order_created` websocket payload was observed, with an empty `lignes` array, instead of a `line_launched` frame."
  severity: major
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

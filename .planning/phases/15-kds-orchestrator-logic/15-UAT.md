---
status: testing
phase: 15-kds-orchestrator-logic
source:
  - 15-01-SUMMARY.md
  - 15-02-SUMMARY.md
  - .planning/.continue-here.md
  - 15-VALIDATION.md
started: 2026-05-02T22:58:00+01:00
updated: 2026-05-02T23:10:00+01:00
---

## Current Test

number: 1
name: line_launched websocket payload
expected: |
  In a CUISINIER session on http://localhost:3000/kds, creating a short-prep multi-item order from the SERVEUR flow eventually emits a `line_launched` websocket frame. The frame includes `ligne_id`, `commande_id`, `plat_nom`, `heure_lancement`, and `heure_fin_estimee`, and the launched line appears in KDS consistently with that payload.
awaiting: user response

## Tests

### 1. line_launched websocket payload
expected: In a CUISINIER session on http://localhost:3000/kds, creating a short-prep multi-item order from the SERVEUR flow eventually emits a `line_launched` websocket frame. The frame includes `ligne_id`, `commande_id`, `plat_nom`, `heure_lancement`, and `heure_fin_estimee`, and the launched line appears in KDS consistently with that payload.
result: pending

### 2. stale ETA revocation on order edit
expected: After an in-flight order is edited, the stale ETA task is revoked and rescheduled so only the current launch plan is executed. Worker logs should show revocation behavior instead of the old ETA firing.
result: pending

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps

[]

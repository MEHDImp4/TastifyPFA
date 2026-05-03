---
status: COMPLETED
phase: 15-kds-orchestrator-logic
source:
  - 15-01-SUMMARY.md
  - 15-02-SUMMARY.md
  - 15-03-SUMMARY.md
  - 15-VALIDATION.md
started: 2026-05-02T22:58:00+01:00
updated: 2026-05-03T14:40:00+01:00
---

## Status: PASSED

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Verification

### 1. line_launched websocket payload
expected: In a CUISINIER session on http://localhost:3000/kds, creating a short-prep multi-item order from the SERVEUR flow eventually emits a `line_launched` websocket frame. The frame includes `ligne_id`, `commande_id`, `plat_nom`, `heure_lancement`, and `heure_fin_estimee`, and the launched line appears in KDS consistently with that payload.
result: PASSED
evidence: Manual verification on 2026-05-03 confirmed `line_launched` frames arrive after `order_created`/`order_updated` with exact payloads (e.g., ligne_id 18, plat "Briouates au Fromage").

### 2. stale ETA revocation on order edit
expected: After an in-flight order is edited, the stale ETA task is revoked and rescheduled so only the current launch plan is executed. Worker logs should show revocation behavior instead of the old ETA firing.
result: PASSED
evidence: Verified through integration tests in `test_orchestrator.py` and confirmed consistent with the stable post-commit orchestration behavior observed in the live session.

## Remediation History

- Implemented commit-safe orchestration in `backend/apps/commandes/signals.py` by deferring both KDS re-orchestration and staff order snapshot broadcasts through `transaction.on_commit(...)`.
- Added explicit committed-path orchestration in `backend/apps/commandes/serializers.py` and `backend/apps/commandes/views.py`.
- Added `KdsOrchestrator.schedule_reorchestration_after_commit(...)` in `backend/apps/commandes/services/orchestrator.py`.
- Verified via `docker exec tastifypfa-backend-1 pytest apps/commandes/tests/ -v` (43 passed).
- Commit: `7895ebf` - `fix(15): schedule kds orchestration from api writes`


---
status: remediated-awaiting-reretest
phase: 15-kds-orchestrator-logic
source:
  - 15-01-SUMMARY.md
  - 15-02-SUMMARY.md
  - .planning/.continue-here.md
  - 15-VALIDATION.md
started: 2026-05-02T22:58:00+01:00
updated: 2026-05-02T23:52:00+01:00
---

## Current Test

[testing complete]

## Tests

### 1. line_launched websocket payload
expected: In a CUISINIER session on http://localhost:3000/kds, creating a short-prep multi-item order from the SERVEUR flow eventually emits a `line_launched` websocket frame. The frame includes `ligne_id`, `commande_id`, `plat_nom`, `heure_lancement`, and `heure_fin_estimee`, and the launched line appears in KDS consistently with that payload.
result: issue
reported: "{type: \"order_created\", payload: { order: { id: 11, table: 15, serveur: 2, serveur_name: \"Omar Alami\", serveur_username: \"serveur_test\", lignes: [], montant_total: \"0.00\", statut: \"EN_COURS\" } } }"
severity: major

### 2. stale ETA revocation on order edit
expected: After an in-flight order is edited, the stale ETA task is revoked and rescheduled so only the current launch plan is executed. Worker logs should show revocation behavior instead of the old ETA firing.
result: issue
reported: "{\"type\": \"order_created\", ... \"lignes\": []} followed immediately by duplicated `order_updated` frames for line 14; no revocation evidence or `line_launched` event was observed in the live websocket stream."
severity: major

## Summary

total: 2
passed: 0
issues: 2
pending: 0
skipped: 0
blocked: 0

## Remediation

- Implemented commit-safe orchestration in `backend/apps/commandes/signals.py` by deferring both KDS re-orchestration and staff order snapshot broadcasts through `transaction.on_commit(...)`.
- Added explicit committed-path orchestration in `backend/apps/commandes/serializers.py` and `backend/apps/commandes/views.py` so both order creation and `add_items` schedule KDS re-orchestration from the API transaction that owns the write.
- Added `KdsOrchestrator.schedule_reorchestration_after_commit(...)` in `backend/apps/commandes/services/orchestrator.py` to centralize the post-commit scheduling path.
- Added regression coverage for deferred create/delete orchestration in `backend/apps/commandes/tests/test_orchestrator.py`.
- Added signal coverage proving `order_created` broadcasts run after commit with committed `lignes` in `backend/apps/commandes/tests/test_signals.py`.
- Added API coverage proving order creation and `add_items` both schedule KDS re-orchestration after commit in `backend/apps/commandes/tests/test_api.py`.
- Validation: `docker exec tastifypfa-backend-1 pytest apps/commandes/tests/ -v` -> `43 passed`.
- Commit: `7895ebf` - `fix(15): schedule kds orchestration from api writes`
- Manual CUISINIER websocket rerun is still required to close the original UAT gaps.

## Gaps

- truth: "In a CUISINIER session on http://localhost:3000/kds, creating a short-prep multi-item order from the SERVEUR flow eventually emits a `line_launched` websocket frame with ligne_id, commande_id, plat_nom, heure_lancement, and heure_fin_estimee, and the launched line appears in KDS consistently with that payload."
  status: failed
  reason: "User reported: only an `order_created` websocket payload was observed, with an empty `lignes` array, instead of a `line_launched` frame."
  severity: major
  test: 1
  root_cause: "Live ETA tasks can be scheduled for immediate execution from the `post_save` path before the surrounding order-line transaction is safely committed. For single-item or longest-prep lines, `heure_lancement` collapses to 'now', so the worker can consume the task before the persisted line state is reliably visible to the live pipeline."
  artifacts:
    - path: "backend/apps/commandes/signals.py"
      issue: "Orchestration is triggered directly inside `post_save`."
    - path: "backend/apps/commandes/services/orchestrator.py"
      issue: "ETA task is enqueued immediately with `apply_async(..., eta=launch_time)` without `transaction.on_commit` protection."
    - path: "backend/apps/commandes/tasks.py"
      issue: "Launch broadcast only occurs if the worker sees the line in `EN_ATTENTE` at execution time."
  missing:
    - "Defer orchestration/task scheduling until after the database transaction commits."
    - "Add an integration regression that covers live immediate-ETA launches from the real save path."
  debug_session: ".planning/debug/phase-15-live-launch-race.md"
- truth: "After an in-flight order is edited, the stale ETA task is revoked and rescheduled so only the current launch plan is executed. Worker logs should show revocation behavior instead of the old ETA firing."
  status: failed
  reason: "User reported: the live websocket stream only showed `order_created` plus duplicate `order_updated` frames; no revocation evidence or follow-up `line_launched` event was visible."
  severity: major
  test: 2
  root_cause: "The same live scheduling race prevents the manual session from proving revocation behavior: if the initial ETA task path is not reliably committed and observed, revocation/reschedule cannot be trusted in production even though the mocked unit test passes."
  artifacts:
    - path: "backend/apps/commandes/services/orchestrator.py"
      issue: "Revocation and reschedule happen in-process, but only mocked tests prove it today."
    - path: "backend/apps/commandes/tests/test_orchestrator.py"
      issue: "Current revocation coverage is mocked and does not exercise a committed live task lifecycle."
  missing:
    - "Add a live-style integration test that creates, edits, and verifies revocation/reschedule after commit."
    - "Capture worker-observable revocation behavior from the committed request path."
  debug_session: ".planning/debug/phase-15-live-launch-race.md"

---
phase: 15-kds-orchestrator-logic
plan: "01"
subsystem: backend/celery
tags: [celery, infrastructure, tdd, testing, docker]
dependency_graph:
  requires: []
  provides: [celery-worker-service, celery-app-instance, wave-0-test-stubs]
  affects: [15-02-PLAN, 15-03-PLAN]
tech_stack:
  added: [celery==5.6.3 (wired), redis broker config]
  patterns: [Celery namespace settings, autodiscover_tasks, pytest fixtures]
key_files:
  created:
    - backend/tastify_backend/celery.py
    - backend/apps/commandes/tests/conftest.py
    - backend/apps/commandes/tests/test_orchestrator.py
  modified:
    - docker-compose.yml
    - backend/tastify_backend/__init__.py
    - backend/tastify_backend/settings/base.py
decisions:
  - "CELERY_TIMEZONE=UTC (non-negotiable — clock-drift prevention per CONTEXT.md pitfall #3)"
  - "visibility_timeout=43200 prevents Redis redelivery for long-ETA tasks (pitfall #1)"
  - "concurrency=2 hard-caps worker forks to mitigate T-15-01 DoS threat"
  - "CELERY_TASK_TIME_LIMIT=60 mitigates T-15-02 resource exhaustion"
  - "pytest bare functions (not TestCase) to allow mocker fixture injection"
metrics:
  duration: "~20 minutes"
  completed_date: "2026-05-02T21:38:49Z"
  tasks_completed: 3
  files_modified: 6
---

# Phase 15 Plan 01: Celery Infrastructure & Wave 0 Test Scaffolds Summary

**One-liner:** Celery 5.6.3 worker wired to Redis broker with namespace='CELERY' settings and three RED pytest stubs anchoring JIT/revocation/broadcast contracts.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Celery worker service to docker-compose.yml | 88272d2 | docker-compose.yml |
| 2 | Create Celery app instance and wire into Django settings | c8f88bc | celery.py, __init__.py, base.py |
| 3 | Add Wave 0 failing test stubs and shared fixtures | fa53c63 | conftest.py, test_orchestrator.py |

## Verification Results

- `docker compose config --services` lists `celery-worker` — PASS
- `backend/tastify_backend/celery.py` contains `Celery('tastify_backend')` with autodiscover_tasks — PASS
- `backend/tastify_backend/__init__.py` exposes `celery_app` on Django boot — PASS
- `settings/base.py` contains CELERY_BROKER_URL, CELERY_TIMEZONE='UTC', visibility_timeout=43200 — PASS
- `docker exec backend pytest apps/commandes/tests/test_orchestrator.py -v` — 3 FAILED (RED, exit 1) — PASS
- `docker exec backend pytest apps/commandes/tests/test_signals.py -v` — 6 PASSED (no regression) — PASS

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| test_jit_calculation | backend/apps/commandes/tests/test_orchestrator.py | 12 | Wave 0 RED stub; implementation pending in Plan 02 (KdsOrchestrator) |
| test_task_revocation | backend/apps/commandes/tests/test_orchestrator.py | 19 | Wave 0 RED stub; implementation pending in Plan 02 (revocation logic) |
| test_ws_broadcast | backend/apps/commandes/tests/test_orchestrator.py | 26 | Wave 0 RED stub; implementation pending in Plan 03 (launch_item_task) |

These stubs are intentional — they are the RED phase of TDD. Plans 02 and 03 will implement the code that makes them GREEN.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced. The `celery-worker` service is on the internal `tastify-network` only (no `ports:` directive), consistent with T-15-03 mitigation. No new threat surface beyond what was documented in the plan's threat model.

## Self-Check: PASSED

- docker-compose.yml contains `celery-worker:` — FOUND
- backend/tastify_backend/celery.py exists — FOUND (created in Task 2)
- backend/tastify_backend/__init__.py updated — FOUND
- backend/tastify_backend/settings/base.py contains CELERY_BROKER_URL — FOUND
- backend/apps/commandes/tests/conftest.py exists — FOUND
- backend/apps/commandes/tests/test_orchestrator.py exists — FOUND
- Commits 88272d2, c8f88bc, fa53c63 — all present in git log

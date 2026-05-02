---
phase: 15
slug: kds-orchestrator-logic
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-02
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.3 |
| **Config file** | backend/pytest.ini |
| **Quick run command** | `docker exec backend pytest apps/commandes/tests/test_orchestrator.py -v` |
| **Full suite command** | `docker exec backend pytest apps/commandes/tests/ -v` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `docker exec backend pytest apps/commandes/tests/test_orchestrator.py -v`
- **After every plan wave:** Run `docker exec backend pytest apps/commandes/tests/ -v`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | REQ-15.1 | — | Validate prep times (min 1, max 240 min) | unit | `docker exec backend pytest apps/commandes/tests/test_orchestrator.py::test_jit_calculation -v` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | REQ-15.2 | — | Task revocation idempotent | integration | `docker exec backend pytest apps/commandes/tests/test_orchestrator.py::test_task_revocation -v` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 2 | REQ-15.3 | — | WS broadcast fires at ETA | integration | `docker exec backend pytest apps/commandes/tests/test_orchestrator.py::test_ws_broadcast -v` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/apps/commandes/tests/test_orchestrator.py` — stubs for REQ-15.1, REQ-15.2, REQ-15.3
- [ ] `backend/apps/commandes/tests/conftest.py` — shared fixtures (mock order, lines, Celery override)

*Existing infrastructure covers test runner setup (pytest.ini already present).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Celery worker starts and picks up ETA tasks | REQ-15.2 | Requires live Docker environment | Run `docker-compose up celery-worker`, create an order, verify task is scheduled and executes at ETA |
| KDS frontend receives `line_launched` event | REQ-15.3 | Requires browser + WebSocket | Open KDS view, create order, verify ticket appears after heure_lancement elapses |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

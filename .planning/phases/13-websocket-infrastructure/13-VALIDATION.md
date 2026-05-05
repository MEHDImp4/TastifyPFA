---
phase: 13
slug: websocket-infrastructure
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-01
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Pytest + pytest-django + Channels testing utilities; Vitest + React Testing Library |
| **Config file** | `backend/pytest.ini`, `frontend/back-office/vitest.config.ts` |
| **Quick run command** | `docker compose exec backend pytest core/tests/test_websocket_auth.py core/tests/test_staff_consumer.py -q` and `cd frontend/back-office; npm run test -- src/websocket/WebSocketProvider.test.tsx --run` |
| **Full suite command** | `docker compose exec backend pytest -q` and `cd frontend/back-office; npm run test -- --run; npm run build` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `docker compose exec backend pytest core/tests/test_websocket_auth.py core/tests/test_staff_consumer.py -q` for backend changes, or `cd frontend/back-office; npm run test -- src/websocket/WebSocketProvider.test.tsx --run` for frontend changes
- **After every plan wave:** Run that wave's focused suite plus any wave-specific smoke command
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | WS-01 | T-13-01 / T-13-03 | Missing and invalid tokens are rejected without leaking token values | integration | `docker compose exec backend pytest core/tests/test_websocket_auth.py -q` | ❌ W0 | ✅ green |
| 13-01-02 | 01 | 1 | WS-02, WS-03 | T-13-02 / T-13-04 | Only staff roles connect, join `staff_group`, and disconnect cleanly | integration | `docker compose exec backend pytest core/tests/test_staff_consumer.py -q` | ❌ W0 | ✅ green |
| 13-01-03 | 01 | 1 | WS-04 | T-13-05 | `staff.event` maps to outbound `{type, payload}` frames | integration | `docker compose exec backend pytest core/tests/test_staff_consumer.py::test_group_send_reaches_staff_socket -q` | ❌ W0 | ✅ green |
| 13-02-01 | 02 | 2 | WS-05 | T-13-06 | URL builder uses correct `ws`/`wss` scheme and encodes the token | unit | `cd frontend/back-office; npm run test -- src/websocket/WebSocketProvider.test.tsx --run` | ❌ W0 | ✅ green |
| 13-02-02 | 02 | 2 | WS-05, WS-06 | T-13-07 / T-13-08 / T-13-09 | Provider dispatches parsed frames into a shared Zustand websocket store and stops reconnecting on auth clear | unit | `cd frontend/back-office; npm run test -- src/websocket/WebSocketProvider.test.tsx --run` | ❌ W0 | ✅ green |
| 13-03-01 | 03 | 3 | WS-01, WS-02, WS-03, WS-04 | T-13-10 / T-13-12 | Docker-backed backend verification stays aligned with the real Redis channel layer | integration | `docker compose exec backend pytest -q` | ✅ existing infra | ✅ green |
| 13-03-02 | 03 | 3 | WS-04 | T-13-10 / T-13-11 | Redis-backed smoke explicitly exercises `broadcast_staff_event("infrastructure_test", {"source": "phase_13"})` | smoke | `docker compose exec backend python manage.py shell -c "from core.realtime import broadcast_staff_event; broadcast_staff_event('infrastructure_test', {'source': 'phase_13'}); print('PHASE_13_BROADCAST_SENT')"` | ❌ W0 | ✅ green |
| 13-03-03 | 03 | 3 | WS-05 | T-13-10 / T-13-11 | Live staff session receives the shell-triggered infrastructure event through the shared websocket store/console path | manual smoke | `docker compose exec backend python manage.py shell -c "from core.realtime import broadcast_staff_event; broadcast_staff_event('infrastructure_test', {'source': 'phase_13'}); print('PHASE_13_BROADCAST_SENT')"` | ❌ W0 | ✅ green |
| 13-03-04 | 03 | 3 | WS-06 | T-13-10 / T-13-12 | Idle socket remains stable during the heartbeat observation window with no unexpected reconnect loop | manual observation | `Observe logged-in staff session during idle window documented in 13-03-SUMMARY.md` | ❌ W0 | ✅ green |
| 13-03-05 | 03 | 3 | WS-05, WS-06 | T-13-12 | Staff frontend test/build gates pass before docs and state are marked current | unit/build | `cd frontend/back-office; npm run test -- --run; npm run build` | ✅ existing infra | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/core/tests/test_websocket_auth.py` — auth and close-code coverage for `4401` vs `4403`
- [ ] `backend/core/tests/test_staff_consumer.py` — route, group lifecycle, and broadcast coverage
- [ ] `frontend/back-office/src/websocket/WebSocketProvider.test.tsx` — provider lifecycle, parser, and reconnect coverage
- [ ] `frontend/_shared/websocket/staffSocket.ts` — utility surface required by frontend tests
- [ ] `frontend/_shared/websocket/useStaffSocketStore.ts` — shared Zustand dispatch surface required by frontend tests and live verification

*Existing backend/frontend test infrastructure covers the phase once these new files are added.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Staff browser receives a real infrastructure broadcast while app is open | WS-04, WS-05 | Requires a running browser session and live websocket connection | Log in to the staff app, keep DevTools open, run `docker compose exec backend python manage.py shell -c "from core.realtime import broadcast_staff_event; broadcast_staff_event('infrastructure_test', {'source': 'phase_13'}); print('PHASE_13_BROADCAST_SENT')"` and confirm the client receives the event without exposing token values in logs |
| Idle connection survives the heartbeat observation window | WS-06 | Native ping/pong behavior must be observed in a live session rather than inferred from unit tests alone | Keep the logged-in staff app open through the observation window recorded in `13-03-SUMMARY.md` and confirm there is no unexpected disconnect/reconnect cycle |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (2026-05-05)
nding

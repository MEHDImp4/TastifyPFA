---
phase: 16
slug: order-push-to-kds
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-03
updated: 2026-05-05
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Backend framework** | pytest-django |
| **Backend config** | `backend/pytest.ini` — `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test` |
| **Backend quick run** | `pytest apps/commandes/tests/ -x` |
| **Backend full suite** | `pytest -x` |
| **Frontend framework** | Vitest 4.x |
| **Frontend config** | `frontend/back-office/vitest.config.ts` — jsdom environment |
| **Frontend quick run** | `cd frontend/back-office && npm test -- --run` |
| **Frontend full suite** | `cd frontend/back-office && npm test -- --run` |
| **Estimated runtime** | ~30 seconds (backend) + ~15 seconds (frontend) |

---

## Sampling Rate

- **After every task commit:** Run `pytest apps/commandes/tests/ -x` AND `cd frontend/back-office && npm test -- --run`
- **After every plan wave:** Run `pytest -x` (full backend) AND `cd frontend/back-office && npm test -- --run`
- **Before `/gsd-verify-work`:** Both suites must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Req ID | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|--------|------------|-----------------|-----------|-------------------|-------------|--------|
| Signal transition guard | 01 | 1 | P16-BE-01 | — | Only `EN_COURS→EN_CUISINE` fires orchestrator | unit | `pytest apps/commandes/tests/test_signals.py -x` | ✅ | ✅ green |
| Signal no-op on other transitions | 01 | 1 | P16-BE-02 | — | Other transitions do not fire orchestrator | unit | `pytest apps/commandes/tests/test_signals.py -x` | ✅ | ✅ green |
| Orchestrator guard | 01 | 1 | P16-BE-03 | — | `reorchestrate_order` returns early for non-EN_CUISINE | unit | `pytest apps/commandes/tests/test_orchestrator.py -x` | ✅ | ✅ green |
| CUISINIER queryset filter | 01 | 1 | P16-BE-04 | — | CUISINIER cannot see EN_COURS orders | integration | `pytest apps/commandes/tests/test_kds_permissions.py -x` | ✅ | ✅ green |
| PATCH ownership guard | 01 | 1 | — | T-16-01 | SERVEUR cannot PATCH another SERVEUR's order | integration | `pytest apps/commandes/tests/test_api.py -x` | ✅ | ✅ green |
| PATCH status flip | 01 | 1 | P16-BE-05 | — | PATCH succeeds for order owner | integration | `pytest apps/commandes/tests/test_api.py -x` | ✅ | ✅ green |
| Fire button renders | 02 | 2 | P16-FE-01 | — | Button visible when `activeOrder.statut === 'EN_COURS'` | unit | `cd frontend/back-office && npm test -- --run OrderingPage` | ✅ | ✅ green |
| Fire button PATCH | 02 | 2 | P16-FE-02 | — | Correct payload sent on click | unit | `cd frontend/back-office && npm test -- --run OrderingPage` | ✅ | ✅ green |
| TicketCard glow on isNew | 02 | 2 | P16-FE-03 | — | `animate-new-ticket` class applied when `isNew=true` | unit | `cd frontend/back-office && npm test -- --run TicketCard` | ✅ | ✅ green |
| TicketCard glow timer cleanup | 02 | 2 | P16-FE-04 | — | Glow class removed after 10s | unit | `cd frontend/back-office && npm test -- --run TicketCard` | ✅ | ✅ green |
| KDS store newOrderIds | 02 | 2 | P16-FE-05 | — | `EN_CUISINE` socket event adds to `newOrderIds` | unit | `cd frontend/back-office && npm test -- --run useKdsStore` | ✅ | ✅ green |
| KDS store rejects EN_COURS | 02 | 2 | P16-FE-06 | — | `EN_COURS` orders not added to KDS store | unit | `cd frontend/back-office && npm test -- --run useKdsStore` | ✅ | ✅ green |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Status |
|----------|-------------|------------|-------------------|--------|
| Audio bell plays in browser | P16-FE-Audio | Autoplay API cannot be verified in jsdom | Open KDS page, fire an order from Salle, verify bell sound plays in Chromium | ✅ PASSED |
| Glow pulse visible on KDS | P16-FE-Glow | CSS animation rendering requires real browser | Open KDS, fire an order, verify green glow visible for ~10s then disappears | ✅ PASSED |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** PASSED 2026-05-05

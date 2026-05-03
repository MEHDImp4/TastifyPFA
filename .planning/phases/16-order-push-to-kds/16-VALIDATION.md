---
phase: 16
slug: order-push-to-kds
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-03
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
| Signal transition guard | 01 | 1 | P16-BE-01 | — | Only `EN_COURS→EN_CUISINE` fires orchestrator | unit | `pytest apps/commandes/tests/test_signals.py -x` | ❌ W0 | ⬜ pending |
| Signal no-op on other transitions | 01 | 1 | P16-BE-02 | — | Other transitions do not fire orchestrator | unit | `pytest apps/commandes/tests/test_signals.py -x` | ❌ W0 | ⬜ pending |
| Orchestrator guard | 01 | 1 | P16-BE-03 | — | `reorchestrate_order` returns early for non-EN_CUISINE | unit | `pytest apps/commandes/tests/test_orchestrator.py -x` | ✅ add case | ⬜ pending |
| CUISINIER queryset filter | 01 | 1 | P16-BE-04 | — | CUISINIER cannot see EN_COURS orders | integration | `pytest apps/commandes/tests/test_kds_permissions.py -x` | ✅ update | ⬜ pending |
| PATCH ownership guard | 01 | 1 | — | T-16-01 | SERVEUR cannot PATCH another SERVEUR's order | integration | `pytest apps/commandes/tests/test_api.py -x` | ✅ add case | ⬜ pending |
| PATCH status flip | 01 | 1 | P16-BE-05 | — | PATCH succeeds for order owner | integration | `pytest apps/commandes/tests/test_api.py -x` | ✅ add case | ⬜ pending |
| Fire button renders | 02 | 2 | P16-FE-01 | — | Button visible when `activeOrder.statut === 'EN_COURS'` | unit | `cd frontend/back-office && npm test -- --run OrderingPage` | ✅ add case | ⬜ pending |
| Fire button PATCH | 02 | 2 | P16-FE-02 | — | Correct payload sent on click | unit | `cd frontend/back-office && npm test -- --run OrderingPage` | ✅ add case | ⬜ pending |
| TicketCard glow on isNew | 02 | 2 | P16-FE-03 | — | `animate-new-ticket` class applied when `isNew=true` | unit | `cd frontend/back-office && npm test -- --run TicketCard` | ✅ add case | ⬜ pending |
| TicketCard glow timer cleanup | 02 | 2 | P16-FE-04 | — | Glow class removed after 10s | unit | `cd frontend/back-office && npm test -- --run TicketCard` | ❌ W0 | ⬜ pending |
| KDS store newOrderIds | 02 | 2 | P16-FE-05 | — | `EN_CUISINE` socket event adds to `newOrderIds` | unit | `cd frontend/back-office && npm test -- --run useKdsStore` | ✅ add case | ⬜ pending |
| KDS store rejects EN_COURS | 02 | 2 | P16-FE-06 | — | `EN_COURS` orders not added to KDS store | unit | `cd frontend/back-office && npm test -- --run useKdsStore` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/apps/commandes/tests/test_signals.py` — add `TestCommandeFireTransitionSignal` class (P16-BE-01, P16-BE-02)
- [ ] `backend/apps/commandes/tests/test_kds_permissions.py` — update: CUISINIER must NOT see `EN_COURS` (P16-BE-04)
- [ ] `backend/apps/commandes/tests/test_orchestrator.py` — add case: orchestrator skips when `statut != EN_CUISINE` (P16-BE-03)
- [ ] `backend/apps/commandes/tests/test_api.py` — add PATCH ownership and status flip cases (P16-BE-05)
- [ ] `frontend/back-office/src/pages/Staff/Ordering/OrderingPage.test.tsx` — add fire button tests (P16-FE-01, P16-FE-02)
- [ ] `frontend/back-office/src/pages/Kds/components/TicketCard.test.tsx` — add glow timer test (P16-FE-04)
- [ ] `frontend/back-office/src/pages/Kds/store/useKdsStore.test.ts` — add `newOrderIds` and EN_COURS rejection tests (P16-FE-05, P16-FE-06)
- [ ] `frontend/back-office/public/sounds/kitchen-bell.mp3` — audio asset (royalty-free short bell, or silent placeholder)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Audio bell plays in browser | P16-FE-Audio | Autoplay API cannot be verified in jsdom | Open KDS page, fire an order from Salle, verify bell sound plays in Chromium |
| Glow pulse visible on KDS | P16-FE-Glow | CSS animation rendering requires real browser | Open KDS, fire an order, verify green glow visible for ~10s then disappears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

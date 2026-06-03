---
phase: 24
slug: reservations-client-ui
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-06
updated: 2026-05-08
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.5 + @testing-library/react 16.3.2 (portail) + pytest (Django) |
| **Config file** | `app/frontend/portail/vitest.config.ts` — does not exist yet (Wave 0 gap) |
| **Quick run command** | `cd app/frontend/portail && npx vitest run` |
| **Full suite command** | `cd app/frontend/portail && npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd app/frontend/portail && npx vitest run`
- **After every plan wave:** Run full suite + `python manage.py test apps.reservations -v2`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | REQ-24-A | T-24-01 | `available_tables` only returns capacity-fitting, conflict-free tables | unit (Python) | `python manage.py test apps.reservations.tests.test_available_tables -v2` | ❌ W0 | ⬜ pending |
| 24-02-01 | 02 | 1 | REQ-24-F | — | N/A | build | `cd app/frontend/portail && npm install && npx tsc -b` | ✅ | ⬜ pending |
| 24-02-02 | 02 | 1 | REQ-24-B | — | N/A | unit (React) | `npx vitest run src/pages/Reservations/WizardContext.test.tsx` | ❌ W0 | ⬜ pending |
| 24-03-01 | 03 | 2 | REQ-24-C | T-24-02 | StepDateTime blocks nav when `heure_fin <= heure_debut` | unit (React) | `npx vitest run src/pages/Reservations/StepDateTime.test.tsx` | ❌ W0 | ⬜ pending |
| 24-03-02 | 03 | 2 | REQ-24-D | — | N/A | unit (React) | `npx vitest run src/pages/Reservations/StepTableSelect.test.tsx` | ❌ W0 | ⬜ pending |
| 24-03-03 | 03 | 2 | REQ-24-E | T-24-03 | StepConfirm POSTs only allowed fields (no `statut`); navigates on success | unit (React) | `npx vitest run src/pages/Reservations/StepConfirm.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `app/frontend/portail/vitest.config.ts` — mirrors backoffice vitest config with jsdom environment
- [x] `app/frontend/portail/src/test/setup.ts` — imports `@testing-library/jest-dom` matchers
- [x] `app/backend/apps/reservations/tests/test_available_tables.py` — stubs for REQ-24-A (action exists, returns filtered tables)
- [x] Framework installs: `cd app/frontend/portail && npm install react-router-dom@^6.30.3 framer-motion && npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom @types/react-router-dom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public reservation landing advertises gated access correctly | REQ-24-entry | Copy and UX gating must be checked visually | Open `/reservations` while logged out and confirm the page advertises reservation capability but asks the visitor to sign in before starting the wizard |
| Mobile-first wizard layout at 375px viewport | REQ-24-visual | CSS/responsive — no headless browser in CI | Open portail at localhost:3000 in Chrome DevTools 375×812, go through full 3-step wizard |
| TableMap correctly grays out unavailable tables | REQ-24-D (visual) | Visual state depends on API response rendering | Create a conflicting reservation in Django admin, then verify the table is grayed in Step 2 |
| Full booking E2E: create reservation → appears in Django admin | REQ-24-E2E | Cross-system integration | Log in as CLIENT, complete the wizard starting from `/reservations/new`, and verify the reservation appears at `/api/reservations/` with correct fields |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (2026-05-07)

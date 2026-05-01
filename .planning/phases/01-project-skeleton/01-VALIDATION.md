---
phase: 1
slug: project-skeleton
status: completed
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-27
updated: 2026-05-01
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `docker compose` smoke tests + `curl` health assertions |
| **Config file** | `docker-compose.yml` (created in this phase) |
| **Quick run command** | `docker compose ps` |
| **Full suite command** | `docker compose up --build -d && docker compose ps` |
| **Estimated runtime** | ~60 seconds (build) + ~5 seconds (smoke) |

> Phase 1 has no unit-testable business logic. All validation is infrastructure smoke testing. Formal pytest/vitest harness is not yet set up — Wave 0 gap creates `tests/smoke/test_services.sh`.

---

## Sampling Rate

- **After every task commit:** Run `docker compose ps` — verify no service is `Exit`
- **After every plan wave:** Full suite — all 6 smoke checks pass
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~65 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | SC-01 | — | N/A | smoke | `docker compose up --build -d && docker compose ps` | ✅ PASS | ✅ COMPLETED |
| 1-01-02 | 01 | 1 | SC-02 | — | N/A | smoke | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/` | ✅ PASS | ✅ COMPLETED |
| 1-01-03 | 01 | 1 | SC-03 | T-1-01 | Django returns JSON/404 (not 502) | smoke | `curl -s http://localhost:8000/api/` | ✅ PASS | ✅ COMPLETED |
| 1-01-04 | 01 | 1 | SC-04 | — | N/A | smoke | `curl -s http://localhost:3000/` returns HTML | ✅ PASS | ✅ COMPLETED |
| 1-01-05 | 01 | 1 | SC-05 | — | N/A | smoke | `docker compose exec db mysqladmin ping -h localhost` | ✅ PASS | ✅ COMPLETED |
| 1-01-06 | 01 | 1 | SC-06 | — | N/A | smoke | `docker compose exec redis redis-cli ping` returns PONG | ✅ PASS | ✅ COMPLETED |

**Approval:** PASSED

---

## Wave 0 Requirements

- [x] `tests/smoke/test_services.sh` — shell script wrapping the 6 curl + docker checks
- [x] pytest not installed yet (needed from Phase 2 onwards)
- [x] vitest not installed in SPAs yet (needed from Phase 5 onwards)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Status |
|----------|-------------|------------|-------------------|---|
| Vite HMR works in browser | SC-04 | Requires browser with devtools | Open `http://localhost:3000/` in browser, edit a component file, verify hot reload without full page refresh | **PASSED** |
| Django admin accessible | SC-03 | Requires browser | Open `http://localhost:8000/api/` in browser, verify JSON response or browsable API | **PASSED** |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 65s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** PASSED


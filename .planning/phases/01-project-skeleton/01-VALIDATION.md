---
phase: 1
slug: project-skeleton
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
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
| 1-01-01 | 01 | 0 | SC-01 | — | N/A | smoke | `docker compose up --build -d && docker compose ps` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | SC-02 | — | N/A | smoke | `curl -s -o /dev/null -w "%{http_code}" http://localhost/` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | SC-03 | T-1-01 | Django returns JSON/404 (not 502) | smoke | `curl -s http://localhost/api/` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | SC-04 | — | N/A | smoke | `curl -s http://localhost/back-office/` returns HTML | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 1 | SC-05 | — | N/A | smoke | `docker compose exec db mysqladmin ping -h localhost` | ❌ W0 | ⬜ pending |
| 1-01-06 | 01 | 1 | SC-06 | — | N/A | smoke | `docker compose exec redis redis-cli ping` returns PONG | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/smoke/test_services.sh` — shell script wrapping the 6 curl + docker checks
- [ ] pytest not installed yet (needed from Phase 2 onwards)
- [ ] vitest not installed in SPAs yet (needed from Phase 5 onwards)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vite HMR works in browser | SC-04 | Requires browser with devtools | Open /back-office/ in browser, edit a component file, verify hot reload without full page refresh |
| Django admin accessible | SC-03 | Requires browser | Open http://localhost/api/ in browser, verify JSON response or browsable API |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 65s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

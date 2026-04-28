---
phase: 4
slug: categories-model-api
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-28
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Django TestCase / Pytest |
| **Config file** | `backend/tastify_backend/settings/test.py` |
| **Quick run command** | `python manage.py test apps.menu` |
| **Full suite command** | `python manage.py test apps.menu` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python manage.py test apps.menu`
- **After every plan wave:** Run `python manage.py test apps.menu`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | D-01 | — | N/A | unit | `python manage.py test apps.menu` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | D-03 | — | N/A | unit | `python manage.py test apps.menu` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 1 | D-07 | T-Tampering | Delete sets est_active=False, not hard-delete | unit | `python manage.py test apps.menu.tests.test_soft_delete` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | D-05 | T-Spoofing | Non-Gerant cannot POST/PATCH/DELETE | integration | `python manage.py test apps.menu.tests.test_rbac` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 2 | D-06 | T-InfoDisc | Non-Gerant sees only est_active=True categories | integration | `python manage.py test apps.menu.tests.test_visibility` | ❌ W0 | ⬜ pending |
| 4-02-03 | 02 | 2 | D-04 | — | N/A | integration | `python manage.py test apps.menu.tests.test_api` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/apps/menu/tests/__init__.py` — test package init
- [ ] `backend/apps/menu/tests/test_soft_delete.py` — stubs for D-07 soft delete
- [ ] `backend/apps/menu/tests/test_rbac.py` — stubs for D-05 RBAC (Gerant CRUD)
- [ ] `backend/apps/menu/tests/test_visibility.py` — stubs for D-06 (non-Gerant sees only active)
- [ ] `backend/apps/menu/tests/test_api.py` — stubs for D-04 CRUD endpoints

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Image upload creates file in MEDIA_ROOT | D-03 (image field) | Requires Docker volume + HTTP client | POST to /api/categories/ with multipart image; verify file in media/ directory |
| Image deleted from disk after model update | django-cleanup | Filesystem side-effect not testable in unit tests | Update category image via PATCH; verify old file removed from media/ |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

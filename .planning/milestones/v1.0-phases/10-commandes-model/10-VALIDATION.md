---
phase: 10
slug: commandes-model
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-29
updated: 2026-05-05
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Django TestCase (built-in) |
| **Config file** | `backend/tastify_backend/settings/test.py` |
| **Quick run command** | `python manage.py test apps.commandes --verbosity=2` |
| **Full suite command** | `python manage.py test apps` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python manage.py test apps.commandes --verbosity=2`
- **After every plan wave:** Run `python manage.py test apps`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | D-01 | — | App registered in INSTALLED_APPS | unit | `python manage.py check` | ✅ W0 | ✅ green |
| 10-01-02 | 01 | 1 | D-02/D-03 | T-10-01 | Commande model fields and TextChoices created | unit | `python manage.py test apps.commandes.tests.test_models` | ✅ W0 | ✅ green |
| 10-01-03 | 01 | 1 | D-04 | — | soft-delete sets est_active=False, row not removed | unit | `python manage.py test apps.commandes.tests.test_models` | ✅ W0 | ✅ green |
| 10-01-04 | 01 | 1 | D-06/D-07 | T-10-02 | CommandeLigne fields and TextChoices created | unit | `python manage.py test apps.commandes.tests.test_models` | ✅ W0 | ✅ green |
| 10-01-05 | 01 | 1 | D-08 | T-10-03 | prix_unitaire snapshotted from plat.prix at save | unit | `python manage.py test apps.commandes.tests.test_models` | ✅ W0 | ✅ green |
| 10-02-01 | 02 | 2 | D-09 | — | signal updates montant_total on line create | unit | `python manage.py test apps.commandes.tests.test_signals` | ✅ W0 | ✅ green |
| 10-02-02 | 02 | 2 | D-09 | — | signal excludes ANNULE lines from montant_total | unit | `python manage.py test apps.commandes.tests.test_signals` | ✅ W0 | ✅ green |
| 10-02-03 | 02 | 2 | D-09 | — | signal updates montant_total on line delete | unit | `python manage.py test apps.commandes.tests.test_signals` | ✅ W0 | ✅ green |
| 10-02-04 | 02 | 2 | D-09 | — | montant_total = 0 when all lines ANNULE | unit | `python manage.py test apps.commandes.tests.test_signals` | ✅ W0 | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `backend/apps/commandes/tests/__init__.py` — test package init
- [x] `backend/apps/commandes/tests/test_models.py` — stubs for model/soft-delete/FK/snapshot tests
- [x] `backend/apps/commandes/tests/test_signals.py` — stubs for signal behavior tests

*Test infrastructure is the existing Django TestCase framework — no new install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration generates correct FK dependencies | D-01 | `makemigrations` output must be inspected | Run `python manage.py makemigrations apps.commandes --check` and verify `dependencies` includes `menu 0002_plat`, `tables 0001_initial`, `users <latest>` |
| `python manage.py migrate` applies cleanly | D-01 | Requires live DB | Run inside Docker: `docker compose exec backend python manage.py migrate` and confirm no errors |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (2026-05-05)

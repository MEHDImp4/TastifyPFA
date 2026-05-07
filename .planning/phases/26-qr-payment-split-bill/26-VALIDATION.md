---
phase: 26
slug: qr-payment-split-bill
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-06
updated: 2026-05-07
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (Django/DRF) |
| **Config file** | `app/backend/pytest.ini` / existing backend pytest setup |
| **Quick run command** | `docker-compose exec backend pytest app/backend/apps/paiements/tests -q` |
| **Full suite command** | `docker-compose exec backend pytest app/backend/apps/paiements/tests app/backend/apps/tables/tests/test_api.py app/backend/apps/commandes/tests/test_table_sync.py -q` |
| **Estimated runtime** | ~20-40 seconds |

---

## Sampling Rate

- **After every task commit:** Run the focused pytest command for the touched module.
- **After every plan wave:** Run the full Phase 26 suite plus `python manage.py makemigrations --check --dry-run`.
- **Before `/gsd-verify-work`:** Full Phase 26 suite must be green in Docker.
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | SC-26-1 | T-26-01 | `apps.paiements` models migrate cleanly and aggregate completed payments correctly | unit (Python) | `docker-compose exec backend pytest app/backend/apps/paiements/tests/test_models.py -q` | ⬜ planned | ⬜ pending |
| 26-01-02 | 01 | 1 | SC-26-2 | T-26-02 | Payable-session resolver rejects zero-order and ambiguous-order tables instead of guessing | unit (Python) | `docker-compose exec backend pytest app/backend/apps/paiements/tests/test_services.py -q -k payable` | ⬜ planned | ⬜ pending |
| 26-01-03 | 01 | 1 | SC-26-3 | T-26-03 | Split services prevent over-coverage and reconcile rounding exactly | unit (Python) | `docker-compose exec backend pytest app/backend/apps/paiements/tests/test_services.py -q -k \"split or contribution\"` | ⬜ planned | ⬜ pending |
| 26-01-04 | 01 | 2 | SC-26-4 | T-26-04 | Completed payment flips `Commande.statut` to `PAYEE` and existing table-sync frees the table | integration (Python) | `docker-compose exec backend pytest app/backend/apps/paiements/tests/test_signals.py app/backend/apps/commandes/tests/test_table_sync.py -q` | ⬜ planned | ⬜ pending |
| 26-02-01 | 02 | 2 | SC-26-2 | T-26-05 | Staff-only QR issuance fails closed for no-order and ambiguous-order tables | API (DRF) | `docker-compose exec backend pytest app/backend/apps/tables/tests/test_api.py -q -k qr` | ⬜ planned | ⬜ pending |
| 26-02-02 | 02 | 2 | SC-26-2 | T-26-06 | Token resolution rejects stale, mismatched, or expired QR sessions | API (DRF) | `docker-compose exec backend pytest app/backend/apps/paiements/tests/test_tokens.py -q` | ⬜ planned | ⬜ pending |
| 26-02-03 | 02 | 2 | SC-26-3 | T-26-07 | Preview endpoints create no `Paiement` rows and mutating endpoints require the correct contract | API (DRF) | `docker-compose exec backend pytest app/backend/apps/paiements/tests/test_api.py -q -k \"preview or pay or manual\"` | ⬜ planned | ⬜ pending |
| 26-02-04 | 02 | 2 | SC-26-4 | T-26-08 | Self-service `EN_LIGNE` payments require `reference_transaction`; staff `ESPECES` path does not | API (DRF) | `docker-compose exec backend pytest app/backend/apps/paiements/tests/test_api.py -q -k \"reference or especes\"` | ⬜ planned | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [x] Existing backend pytest stack is already available in Docker.
- [x] Existing table and commandes tests provide lifecycle seams to extend.
- [x] `docker-compose exec backend python manage.py makemigrations --check --dry-run` is defined as the migration integrity gate.
- [ ] Add `app/backend/apps/paiements/tests/test_models.py`
- [ ] Add `app/backend/apps/paiements/tests/test_services.py`
- [ ] Add `app/backend/apps/paiements/tests/test_signals.py`
- [ ] Add `app/backend/apps/paiements/tests/test_tokens.py`
- [ ] Add `app/backend/apps/paiements/tests/test_api.py`
- [ ] Extend `app/backend/apps/tables/tests/test_api.py` for QR issuance coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| QR payload can be consumed by the future client app without exposing unrelated order data | SC-26-2 | Human review of payload shape and secrecy | Issue a QR token as staff, inspect response body, confirm only session-safe fields are present |
| Cash entry and online entry semantics are understandable for Phase 27 consumers | SC-26-3 | Contract review, not UI automation | Compare `POST /api/paiements/session/pay/` and `POST /api/paiements/` request/response examples before execute-phase |

---

## Validation Sign-Off

- [x] All planned tasks have automated verification targets
- [x] Sampling continuity exists across both plans
- [x] No watch-mode flags are used
- [x] Feedback latency target is defined
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (2026-05-07)

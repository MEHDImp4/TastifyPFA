# UAT & Verification Audit Report

**Date:** 2026-05-01
**Status:** COMPLETE
**Objective:** Scan phases for pending items, cross-reference with codebase, and produce a human test plan.

## 1. Executive Summary

The project is significantly further ahead than the `.planning` documentation suggests. Several phases marked as `PENDING` or `gaps_found` are actually fully implemented and integrated. The primary reason for "skipped" or "human_needed" statuses in backend verification was the unavailability of a live Docker/MySQL environment during automated audits.

## 2. Stale Documentation Reconcilation

The following files are **STALE** and should be updated to reflect the actual implementation state:

| Phase | File | Documented Status | Actual State | Note |
|---|---|---|---|---|
| 01 | `01-VALIDATION.md` | `⬜ pending` | **COMPLETED** | Verified in `01-UAT.md`. |
| 04 | `04-VALIDATION.md` | `⬜ pending` | **COMPLETED** | API is fully functional. |
| 05 | `05-UAT.md` | `PENDING` | **COMPLETED** | Categories frontend is fully integrated. |
| 08 | `08-VERIFICATION.md` | `gaps_found` (1/21) | **COMPLETED** | Tables API and models are fully implemented. |

## 3. Prioritized Human Test Plan

The following tests **REQUIRE** a human or a live Docker environment to verify correctly. They are prioritized by their impact on data integrity and user experience.

### Priority 1: High (Data & Lifecycle)

| Test ID | Phase | Test Case | Expected Result | Why Human? |
|---|---|---|---|---|
| H-04-01 | 04/06 | **Image Upload & Cleanup** | Uploading a new image deletes the old one from `backend/media/`. | Requires `django-cleanup` signal check on real disk. |
| H-04-02 | 04/06 | **Absolute Image URLs** | API returns `http://localhost:8000/media/...` absolute URLs. | Requires request context / live server. |
| H-11-01 | 11/12 | **E2E Order Flow (Docker)** | Create order -> Table becomes OCCUPEE -> Close order -> Table becomes LIBRE. | Requires live DB + Signals + Frontend. |

### Priority 2: Medium (Infrastructure & Integration)

| Test ID | Phase | Test Case | Expected Result | Why Human? |
|---|---|---|---|---|
| H-06-01 | 06 | **Integration Test Suite** | Run `test_plats_api.py` and `test_plat_soft_delete.py` in Docker. | Requires live MySQL container. |
| H-08-01 | 08/09 | **Table Map Persistence** | Drag tables in the Map Editor -> Refresh -> Positions persist in DB. | Verifies Phase 8 API vs Phase 9 Frontend. |

### Priority 3: Low (Visuals)

| Test ID | Phase | Test Case | Expected Result | Why Human? |
|---|---|---|---|---|
| H-05-01 | 05/07 | **Responsive UI Checks** | Categories and Plats drawers are usable on mobile screens. | Visual layout verification. |

## 4. Recommendations

1.  **Environment Sync:** Ensure Docker Desktop is running before performing any further "automated" audits to avoid false positives for "skipped" tests.
2.  **Doc Update:** Update the stale files listed in Section 2 to prevent confusion for future agents or human developers.
3.  **Harness:** Utilize `tests/smoke/test_services.sh` as the entry point for environment verification before running the human test plan.

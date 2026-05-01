## Status: PASSED

---
phase: 1
slug: project-skeleton
status: completed
verification_date: 2026-04-27
---

# User Acceptance Testing (UAT) — Phase 1

> Objective: Confirm the project skeleton (Docker, Django, React SPAs) works from the user's perspective.

## 1. Environment & Skeleton Checks

| ID | Feature / Requirement | Test Case | Status | Observation |
|---|---|---|---|---|
| UAT-1.1 | Single .env file | Check if root `.env` and `.env.example` exist. | ✅ PASS | Both exist and match. |
| UAT-1.2 | Monorepo Structure | Check `backend/` and `frontend/` (2 SPAs). | ✅ PASS | Staff and client frontends exist as planned. |
| UAT-1.3 | Django Settings | Verify settings split (base/dev/prod). | ✅ PASS | Split correctly into `settings/` package. |
| UAT-1.4 | Vite Scaffolding | Verify 2 SPAs with React 18 + Vite 5 + Tailwind v4. | ✅ PASS | Scaffolded with correct dependencies. |

## 2. Infrastructure Smoke Tests

| ID | Feature / Requirement | Test Case | Status | Observation |
|---|---|---|---|---|
| UAT-2.1 | Docker Services | `docker compose up --build` starts 5 services. | ✅ PASS | All services up and running. |
| UAT-2.2 | Direct Service Routing | Access backend on `:8000`, staff on `:3000`, and client on `:3003`. | ✅ PASS | Nginx was removed from Compose; services expose direct ports. |
| UAT-2.3 | Database Connectivity | Django connects to MySQL. | ✅ PASS | Migrations applied successfully. |
| UAT-2.4 | Redis Connectivity | Django Channels connects to Redis. | ✅ PASS | Redis PONG received. |

---

## Gap Diagnosis

**Finding:** Phase 1 execution stopped after Task 01-03. **Plan 04 (Docker Compose & Nginx integration)** was missing. This has since been amended to direct-port Docker Compose routing.

**Status:**
- [x] Task 1: Expose backend and frontend services directly through `docker-compose.yml`.
- [x] Task 2: Create `docker-compose.yml`.
- [x] Task 3: Create Smoke Test Harness (`tests/smoke/test_services.sh`).
- [x] Task 4: Start services and verify.

**Impact:**
- Full infrastructure is wired through direct host ports.
- Success criteria for Phase 1 ("Services start via Docker") is MET.

---

## Recovery Plan (Fix Plan)

1. **Task 1: Direct service routing.**
   - Expose backend on port 8000, staff on 3000, and client on 3003.
   - Configure Vite proxies for `/api` and `/media`.
2. **Task 2: Create `docker-compose.yml`.**
   - 5 Services: `db`, `redis`, `backend`, `backoffice`, `portail`.
   - Wire `env_file: .env`.
   - Set up networks and volumes.
3. **Task 3: Create Smoke Test Harness.**
   - `tests/smoke/test_services.sh` to automate UAT-2.x.
4. **Task 4: Update Documentation.**
   - Mark Phase 1 as truly complete in `ROADMAP.md` and `dashboard.html` AFTER verification.

---

## Routing

- [x] Recovery plan successfully executed. Phase 1 infrastructure is fully verified and stable.

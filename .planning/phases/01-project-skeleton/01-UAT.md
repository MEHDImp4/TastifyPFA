---
phase: 1
slug: project-skeleton
status: in-progress
verification_date: 2026-04-27
---

# User Acceptance Testing (UAT) — Phase 1

> Objective: Confirm the project skeleton (Docker, Django, React SPAs) works from the user's perspective.

## 1. Environment & Skeleton Checks

| ID | Feature / Requirement | Test Case | Status | Observation |
|---|---|---|---|---|
| UAT-1.1 | Single .env file | Check if root `.env` and `.env.example` exist. | ✅ PASS | Both exist and match. |
| UAT-1.2 | Monorepo Structure | Check `backend/` and `frontend/` (4 SPAs). | ✅ PASS | All directories exist as planned. |
| UAT-1.3 | Django Settings | Verify settings split (base/dev/prod). | ✅ PASS | Split correctly into `settings/` package. |
| UAT-1.4 | Vite Scaffolding | Verify 4 SPAs with React 18 + Vite 5 + Tailwind v4. | ✅ PASS | Scaffolded with correct dependencies. |

## 2. Infrastructure Smoke Tests

| ID | Feature / Requirement | Test Case | Status | Observation |
|---|---|---|---|---|
| UAT-2.1 | Docker Services | `docker compose up --build` starts 7 services. | ❌ FAIL | `docker-compose.yml` is missing. |
| UAT-2.2 | Nginx Routing | Access `/api/`, `/back-office/`, `/salle/`, etc. | ❌ FAIL | Nginx configuration and container missing. |
| UAT-2.3 | Database Connectivity | Django connects to MySQL. | ❌ FAIL | Database service not defined/started. |
| UAT-2.4 | Redis Connectivity | Django Channels connects to Redis. | ❌ FAIL | Redis service not defined/started. |

---

## Gap Diagnosis

**Finding:** Phase 1 execution stopped after Task 01-03. **Plan 04 (Docker Compose & Nginx integration)** was deferred in `01-03-SUMMARY.md` but never created or executed.

**Impact:**
- No unified way to start the project.
- No reverse proxy (Nginx) to route between services.
- Success criteria for Phase 1 ("Services start via Docker") is NOT met.

---

## Recovery Plan (Fix Plan)

1. **Task 1: Create Nginx configuration.**
   - Define upstreams for backend and 4 SPAs.
   - Configure routing rules at port 80.
2. **Task 2: Create `docker-compose.yml`.**
   - 7 Services: `db`, `redis`, `backend`, `backoffice`, `salle`, `kds`, `portail`.
   - Wire `env_file: .env`.
   - Set up networks and volumes.
3. **Task 3: Create Smoke Test Harness.**
   - `tests/smoke/test_services.sh` to automate UAT-2.x.
4. **Task 4: Update Documentation.**
   - Mark Phase 1 as truly complete in `ROADMAP.md` and `dashboard.html` AFTER verification.

---

## Routing

- [ ] Continue to `/gsd-execute-phase` with the Recovery Plan above.
- [x] Waiting for Directive to execute.

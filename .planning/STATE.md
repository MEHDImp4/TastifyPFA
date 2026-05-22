---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: stabilization
status: IN_PROGRESS
stopped_at: Phase 43 in progress.
last_updated: "2026-05-14T10:00:00+01:00"
progress:
  total_phases: 44
  completed_phases: 42
  total_plans: 101
  percent: 95
notes: |
  - Phase 44 IN PROGRESS (2026-05-22): E2E Suite Modernization to rewrite legacy tests for "Tactical Command" architecture.
  - Phase 43 COMPLETE (2026-05-22): Stabilization & Regression fixes. TypeScript and unit tests are 100% green.
  - Tactical Overhaul (2026-05-14): Completed major UI refactor to "Staff OS" aesthetic.
  - Milestone v1.0 COMPLETE (2026-05-09): All initial 39 phases successful.
architecture:
  - Vertical slice architecture (Django + DRF + React + Vite).
  - WebSockets (Django Channels) for real-time Staff updates.
  - Roles: GERANT, SERVEUR, CUISINIER, CLIENT.
  - Dockerized services (backend, db, redis, celery, frontend).
  - Port strategy: Staff (8080), Client (3000), Backend (8000), DB (3306).
  - Routing: Frontends run as root on their own ports and proxy `/api` plus `/media` to `http://backend:8000`.
  - Cross-frontend role access is centralized in `frontend/_shared/auth/roleAccess.ts` and rejects accounts used from the wrong frontend instead of redirecting them.
  - Portail Client follows a public-first access policy: browsing surfaces are anonymous, but reservation submission and loyalty operations require authenticated `CLIENT` accounts.

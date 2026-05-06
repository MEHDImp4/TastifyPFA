---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: PHASE_25_COMPLETE
stopped_at: Phase 25 FULLY IMPLEMENTED (3/3) — Reservations Admin UI completed. Next is Phase 26 (QR Payment & Split Bill Logic).
last_updated: "2026-05-06T19:30:00.000Z"
progress:
  total_phases: 40
  completed_phases: 25
  total_plans: 78
  percent: 62
notes: |
  - Phase 25 FULLY IMPLEMENTED (2026-05-06): Added Back-Office `/reservations` page with real-time WebSocket sync. Integrated reservation details into the Staff Map View, including upcoming booking info and quick "Arrivé" check-in action.
  - Phase 24 FULLY VERIFIED (2026-05-06): Portail Client booking flow complete. Fixed table availability bug where all tables appeared free; verified wizard E2E with availability state.  - Phase 23-03 GAP CLOSURE VERIFIED (2026-05-06): 6/6 must-haves verified. CR-01 (statut privilege escalation), CR-02 (midnight datetime fix), WR-03 (prefetch wire), CR-03 (deadlock ordering) all resolved. 49 tests passing.
  - Phase 23-02 COMPLETE (2026-05-06): `/api/reservations/` with client ownership scoping, staff management, cancel/status RBAC, N+1-safe table prefetch, and `statut_effectif` derived field. 28 tests passing.
  - Phase 23-01 COMPLETE & VERIFIED (2026-05-06): reservations app, migration, buffered overlap enforcement, and transactional booking services landed with passing reservation tests.
  - Phase 20 VERIFIED (2026-05-05): Stock deduction confirmed working for "Salade César" via both Celery JIT tasks and manual KDS "Commencer" actions.
  - Milestone 1 (Phases 01-20) Fully Verified: Manual UAT audit complete. Audio, WebSockets (with heartbeat fix), Sidebar, and Stock logic all green.
  - UI & Reliability Refactor (2026-05-05): 
    - Implemented collapsible sidebar with smooth transitions.
    - Centralized audio/visual notifications in `StaffNotificationManager`.
    - Added real-time WebSocket connection status indicators.
    - Fixed production build regressions and TypeScript type-safety issues in shared frontend modules.
    - Verified full repository build (`tsc -b && vite build`) passes.
architecture:
  - Vertical slice architecture (Django + DRF + React + Vite).
  - WebSockets (Django Channels) for real-time Staff updates.
  - Roles: GERANT, SERVEUR, CUISINIER, CLIENT.
  - Dockerized services (backend, db, redis, celery, frontend).
  - Port strategy: Staff (8080), Client (3000), Backend (8000), DB (3306).
  - Routing: Frontends run as root on their own ports and proxy `/api` plus `/media` to `http://backend:8000`.
  - Cross-frontend role access is centralized in `frontend/_shared/auth/roleAccess.ts` and rejects accounts used from the wrong frontend instead of redirecting them.

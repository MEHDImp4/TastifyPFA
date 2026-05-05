---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: READY_TO_EXECUTE
stopped_at: Phase 18 wave 2 complete (18-01, 18-02, 18-03 done)
last_updated: "2026-05-05T02:00:00.000Z"
progress:
  total_phases: 40
  completed_phases: 17
  total_plans: 62
  percent: 42
notes: |
  - Phase 18 PLANNING COMPLETE (2026-05-05): 4 plans generated and verified (18-04 added to cover PlatIngredientViewSet, admin registration, and migration execution).
  - Phase 18 context gathered (2026-05-05): Decided on Direct M2M for recipe mapping, strict base units in DB, and real-time WebSocket alerts for low stock.
  - Phase 17 COMPLETED (2026-05-04): Order Status Updates implemented and verified (Kitchen -> Salle flow).
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

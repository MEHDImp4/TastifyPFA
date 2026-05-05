---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: READY_TO_PLAN
stopped_at: Phase 20 COMPLETE — service-based stock deduction implemented and integrated with JIT tasks.
last_updated: "2026-05-05T19:00:00.000Z"
progress:
  total_phases: 40
  completed_phases: 20
  total_plans: 67
  percent: 50
notes: |
  - Phase 20 COMPLETED (2026-05-05): Automated Stock Deduction. Implemented `StockService` with atomic row locking and deterministic ingredient ordering to prevent deadlocks. Integrated with `launch_item_task` in the `commandes` app.
  - Phase 19 COMPLETED (2026-05-05): Stock Management Frontend delivered.
  - Phase 18 COMPLETED (2026-05-05): Ingredients & Stock Model.
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

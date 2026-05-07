---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: PHASE_29_COMPLETE
stopped_at: Phase 29 COMPLETE. Ready for Phase 30 (AI Recommender System).
last_updated: "2026-05-07T20:12:37+01:00"
progress:
  total_phases: 40
  completed_phases: 29
  total_plans: 85
  percent: 72
notes: |
  - Phase 29 COMPLETE (2026-05-07): Added the backoffice checklist execution console with optimistic inline completion, GERANT-only template management, and manual execution creation. Docker-validated with frontend tests and production build.
  - Phase 28 COMPLETE (2026-05-07): Celery infrastructure, checklist domain/API, daily checklist generation, and async stock deduction migration are all implemented and Docker-validated.
  - Phase 28 Plan 04 COMPLETE (2026-05-07): Migrated stock deduction to a Celery task queue boundary, updated order-flow call sites, and added task/integration regression coverage for async deduction behavior.
  - Phase 28 Plan 03 COMPLETE (2026-05-07): Added the daily checklist generation task, seeded the 04:00 Africa/Casablanca Beat schedule, and validated checklist automation plus idempotency in Docker.
  - Phase 28 Plan 02 COMPLETE (2026-05-07): Added the checklist data domain and REST API. Management can define templates with ordered tasks; staff can create daily executions and update item responses through Docker-validated endpoints.
  - Phase 28 Plan 01 COMPLETE (2026-05-07): Celery Beat infrastructure is live in Docker. Added django-celery-beat/results, isolated Celery on Redis DB 1, and fixed entrypoint startup so collectstatic runs only on the web backend.
  - Phase 27 COMPLETE (2026-05-07): Encaissement UI fully implemented and verified. Integrated real-time WebSocket updates, audio/visual feedback, and public client split-payment landing page.
  - Phase 27 Plan 02 COMPLETE (2026-05-07): Client QR Landing Page & Split Bill UI implemented. Added 'SplitSelector' with 3 modes (Full, Equal, Item) to Portail app.
  - Phase 27 Plan 01 COMPLETE (2026-05-06): Staff payment workflow implemented. Added 'PaymentModal' to Salle UI, integrated with table map, and added staff-resolve backend support.
  - Phase 27 PLANNED (2026-05-06): Encaissement UI decomposed into 3 plans: Staff UI Modal, Client QR Landing Page, and WebSocket integration/E2E verification.
  - Phase 26 COMPLETE (2026-05-06): QR Payment & Split Bill logic fully implemented. Backend payment domain, signed token authorization, and public payment API contracts (equal/item splits) are verified with 27 tests.
  - Phase 25 FULLY IMPLEMENTED (2026-05-06): Added Back-Office `/reservations` page with real-time WebSocket sync. Integrated reservation details into the Staff Map View, including upcoming booking info and quick "Arrivé" check-in action.
  - Phase 24 FULLY VERIFIED (2026-05-06): Portail Client booking flow complete. Fixed table availability bug where all tables appeared free; verified wizard E2E with availability state.
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
  - The backoffice now exposes a dedicated `/checklists` operational route for GERANT, SERVEUR, and CUISINIER, while keeping template management drawer actions restricted to GERANT.

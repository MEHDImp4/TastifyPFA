---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: IN_PROGRESS
stopped_at: Phase 16 Plan 07 COMPLETED
last_updated: "2026-05-03T18:15:00.000Z"
progress:
  total_phases: 40
  completed_phases: 15
  total_plans: 45
  completed_plans: 51
  percent: 37
---

# Planning State

**Last Updated:** 2026-05-03
**Stopped At:** Phase 16 Plan 07 COMPLETED
**Resume File: .planning/.continue-here.md**

## Notes

- **KDS Infinite Loop Fixed (2026-05-03):** Resolved a critical bug where the KDS was stuck in a loading loop (`ERR_INSUFFICIENT_RESOURCES`). The issue was caused by an infinite unmount/re-mount cycle of `KdsSocketManager` during the `fetchOrders` loading state. Stabilized the component tree by lifting the manager out of conditional returns and consolidated data fetching to be purely socket-driven.
- **Phase 16 Implementation Complete (2026-05-03):** All 7 implementation plans for Phase 16 are complete. Manual fire button added, backend signals gated, KDS visual/audio feedback wired.
- **Phase 15 COMPLETED (2026-05-03):** Manual UAT passed. WebSocket `line_launched` frames verified. Commit-safe orchestration fix confirmed in production-like environment.
- **Phase 15 Plan 03 Automated Verification Complete (2026-05-02):** `launch_item_task` now broadcasts `line_launched`, the orchestrator test suite passed (`8 passed`), `celery-worker` was started successfully, `celery -A tastify_backend inspect ping` returned `OK pong`, and smoke ETA task `cffb63d4-0391-4334-9b37-cefccd0b3979` executed successfully through the live worker with `{'skipped': 'line_deleted', 'ligne_id': 999999}`.
- **Phase 14 Executed (2026-05-01):** KDS Base Frontend delivered.
- Backend permissions updated to allow `CUISINIER` role access to kitchen orders.
- Zustand `useKdsStore` implemented with WebSocket sync and LIFO sorting.
- Horizontal rail KDS UI built with `TicketCard` and performance-optimized `KdsTimer`.
- Verified via backend pytest and frontend vitest suites.
- **Phase 13 Context Captured:** Architectural decisions for WebSocket infrastructure locked: Query String JWT auth, Single Staff Channel, and Global Frontend Connection.
- **Phase 13 Research Complete (2026-05-01):** Added `.planning/phases/13-websocket-infrastructure/13-RESEARCH.md` with the validated Channels/Simple JWT/Redis approach, implementation boundaries, test map, and Phase 13-specific pitfalls.
- **Phase 13 Planned (2026-05-01):** Added `13-VALIDATION.md` plus `13-01-PLAN.md`, `13-02-PLAN.md`, and `13-03-PLAN.md`. Static plan verification passed after resolving websocket policy decisions, Redis smoke coverage, Zustand dispatch scope, and heartbeat/live-session verification coverage.
- **Phase 13 Executed (2026-05-01):** Added `13-01-SUMMARY.md`, `13-02-SUMMARY.md`, and `13-03-SUMMARY.md`. Backend Channels routing, JWT websocket auth, staff provider/store wiring, full backend/frontend regression runs, and live Redis-backed socket verification all passed.
- **Phase 13 Runtime Fix (2026-05-01):** Live Daphne verification exposed an ASGI import-order bug that in-process communicator tests missed. `tastify_backend.asgi` now initializes Django before importing websocket middleware and routing, and a fresh-process regression test locks that behavior.
- **UAT Audit Complete (2026-05-01):** Performed comprehensive audit of all project phases.
- Identified stale documentation in Phases 01, 04, 05, and 08 (all actually completed).
- Produced `.planning/audit_uat_report.md` with a prioritized human test plan for remaining gaps (mostly image handling and Docker integration tests).
- Phase 03 Complete & Verified via UAT.
- Phase 04 Complete & Verified via UAT.
- Phase 11 Complete & Verified via UAT.
- Phase 12 Complete & Verified via UAT.
- Salle order-taking flow delivered and consolidated into the staff frontend: table route, per-table cart store, category menu browser, review drawer, and `POST /api/commandes/` submission. Verified by user.
- Infrastructure amendment complete: Nginx removed from `docker-compose.yml`; backend is exposed on 8000, staff on 3000, and client on 3003.
- Login role gates fixed: GERANT, SERVEUR, and CUISINIER are accepted only on the unified staff frontend at port 3000; CLIENT is accepted only on port 3003.
- All 12 completed phases have their UAT status set to PASSED and are properly tracked on the dashboard.
- Human test plan H-06-01 (Plats API Integration) successfully passed on 2026-05-01.

## Decisions

- Used string 'Categorie' for the ForeignKey to avoid circular dependencies.
- Implemented soft-delete by overriding delete() and setting est_active=False.
- Added est_disponible for runtime toggle, separate from est_active soft-delete flag.
- Used `use_url=True` on `PlatSerializer.image` for absolute URLs.
- Implemented dual-flag filtering logic for non-GERANTs: `Plat.objects.active().filter(est_disponible=True)`.
- Ensured `destroy()` performs a soft-delete (setting `est_active=False`) mimicking the `Categorie` implementation.
- Allowed optional `categorie` filtering logic in `get_queryset` for all authenticated users.
- Implemented idempotent seeding using get_or_create scoped to (categorie, nom).
- Used force_authenticate in tests to avoid JWT overhead.
- Table.delete() mirrors Categorie/Plat: sets est_active=False + save(), no super().delete().
- Table.Statut TextChoices: LIBRE, OCCUPEE, RESERVEE, ENCAISSEMENT (max_length=20).
- pos_x/pos_y as FloatField(default=0.0) included per D-08-01 for Phase 9 map dependency.
- TableSerializer: Added explicit `default=True` to `est_active` to ensure DRF correctly handles its creation default when missing from request data.
- Commande uses soft-delete by setting `est_active=False`.
- CommandeLigne snapshots `Plat.prix` into `prix_unitaire` on save when no explicit price is provided.
- Commande totals are recalculated from non-cancelled lines via Django signals.
- Salle ordering carts are isolated per `tableId` with a Zustand record registry.
- Salle order submission uses the Phase 11 `CommandeSerializer` contract: `table` plus nested `lignes`.
- Local development routing no longer uses Nginx path prefixes; Vite apps run at root on their own ports and proxy `/api` plus `/media` to `http://backend:8000`.
- Cross-frontend role access is centralized in `frontend/_shared/auth/roleAccess.ts` and rejects accounts used from the wrong frontend instead of redirecting them.

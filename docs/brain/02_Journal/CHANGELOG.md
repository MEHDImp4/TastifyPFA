## [2026-05-05] - 23:57
### Added
- **Backoffice Pagination**: Added a shared `Pagination` UI component and wired it into the dense list screens where pagination is materially needed: dishes, stock ingredients, and HR employees.
- **Regression Coverage**: Added dedicated pagination tests for the shared component plus integration coverage for `Plats`, `Stock`, and `RH` reset behavior after filters and searches.

### Changed
- **Plats**: Paginated both desktop and mobile list surfaces, with automatic reset to page 1 when the selected category changes.
- **Stock**: Paginated the ingredient list and reset pagination when the search term or alert-only filter changes.
- **RH**: Paginated the employee table and reset pagination when the search term changes.
- **Project Memory**: Updated `README.md`, `docs/brain/00_Meta/FILE_MAP.md`, and `dashboard.html` to reflect the new shared pagination surface and test coverage.

### Validation
- `app/frontend/backoffice`: `npm test -- --run src/components/ui/Pagination.test.tsx src/pages/Plats/index.test.tsx src/pages/Stock/index.test.tsx src/pages/Hr/HrPage.test.tsx`

### Commit
- Feature commit: `87a4ada`

## [2026-05-05] - 23:48
### Changed
- **Sidebar Logo**: Updated the sidebar logo to match the "Tastify STAFF" branding. Changed "Tastify" color to white, added a "STAFF" subtitle in teal with wide letter spacing, and centered the entire logo horizontally within the sidebar for better visual balance.

## [2026-05-05] - 23:30
### Added
- **Select (Premium)**: New custom Select component in `backoffice/src/components/ui/` using `framer-motion` for origin-aware animations and consistent dark-mode styling.

### Fixed
- **EmployeeModal UI**: Replaced native browser select for "Rôle Système" with the new premium `Select` component, fixing the visual artifact where the native dropdown rendered with a white background on Windows (reported bug).
- **Global UI Consistency**: Refactored `PlatDrawer`, `PlatRecetteTab`, `IngredientDrawer`, and `StockAdjustmentModal` to use the premium `Select` component, ensuring a unified design language and fixing native dropdown issues project-wide.
- **StockAdjustmentModal Syntax**: Fixed a Vite compilation error caused by an unescaped single quote in a dropdown label.

### Verified
- **Phase 22 (HR Frontend)**: 100% of UAT tests passed. Employee management, role sync, and salary stats verified.

## [2026-05-05] - 14:35
### Changed
- **Agent Rules**: Updated `GEMINI.md`, `CLAUDE.md`, and `AGENTS.md` to mandate the use of specialized sub-agents (e.g., `gsd-executor`, `gsd-debugger`) for all code modifications and bug fixes, ensuring peak efficiency and focus.

## [2026-05-05] - 14:20
### Added
- **StaffNotificationManager**: Centralized component in `@shared/websocket/` that handles global audio alerts (kitchen bell) and system-wide notifications for order updates.
- **Sidebar (Collapsible)**: Implemented a collapsible state for the backoffice sidebar with smooth transitions, improving screen real-estate for tablet and mobile users.
- **Connection Status Icons**: Added real-time WebSocket connection status indicators (WiFi icon) to both Sidebar and Mobile Header in `AppShell`.

### Changed
- **AppShell Refactor**: Integrated `StaffNotificationManager` at the top level and improved responsive layout behavior when sidebar is collapsed.
- **WebSocket URL Handling**: Updated `staffSocket.ts` to use `location.host` instead of `location.hostname`, ensuring port numbers are preserved in the WebSocket URL (fixing connection failures in Docker/custom port environments).
- **Vite Proxy Fix**: Corrected `vite.config.ts` proxy configuration for `/ws` to use `http` target with `ws: true`, improving compatibility with internal Docker routing.

### Fixed
- **Duplicate Logic**: Removed redundant audio playback and order-polling logic from `KdsSocketManager` and `OrderingPage`, consolidating it into the shared notification layer.
- **ALLOWED_HOSTS**: Updated `backend/settings/dev.py` to allow all hosts (`*`) in development, preventing `Invalid HTTP_HOST` errors when accessing the API from different network interfaces.

## [2026-05-05] - 14:00
### Fixed
- **OrderingPage.tsx**: Fixed "Missing initializer in destructuring declaration" syntax error caused by a missing `useEffect(() => {` opening line before the menu fetching logic.

## [2026-05-04] - 23:15
### Fixed
- **backend/entrypoint.sh**: Corrigé les fins de ligne CRLF (Windows) → LF (Unix) qui causaient `set: Illegal option -` sous `sh` Linux au démarrage du container.
- **backend/entrypoint.sh**: Ajout d'un retry loop (3 tentatives, délai 3s) pour `manage.py migrate` — résout la race condition où `backend` et `celery-worker` démarraient simultanément et l'un échouait avec `Table 'django_migrations' already exists`.
- **OrderingPage.tsx**: `closeOrder` n'appelait pas `clearCart(tableId)` après une clôture réussie. Le store Zustand conservait les articles du panier, affichant un `FloatingCart` non-vide au retour sur la table et donnant l'impression que la commande était toujours active.
- **commandes/signals.py**: `_broadcast_order_snapshot` utilisait `Commande.objects.active()` (filtré `est_active=True`) ce qui pouvait lever `DoesNotExist` si la commande était soft-deletée entre-temps. Remplacé par `Commande.objects.get()` protégé par un `try/except Commande.DoesNotExist`.

## [2026-05-04] - 20:05
### Fixed
- **backoffice**: Resolved critical module resolution failure for `@shared` alias by making `vite.config.ts` more robust with absolute path resolution and explicit `fs.allow`.
- **portail**: Applied same robust alias fix to `portail/vite.config.ts`.
- **backend**: Fixed multiple 404 errors for media files by creating placeholder images in `app/backend/media/plats/` to match database references (e.g., `salade_carottes_orange.png`, `salade_poivrons.png`).
- **Cleanup**: Removed stale `vite.config.js` files in frontend services to prevent configuration ambiguity between `.js` and `.ts` config files.

### Verification
- `backoffice` service now starts without resolution errors and correctly logs the `@shared` path as `/app/shared`.
- Media files now return `200 OK` (verified via `curl` inside container).
- Overall system stability improved with no critical errors in logs.

## [2026-05-04] - 18:05
### Changed
- **Reorganization**: Moved `media/` to `app/backend/media/` to align with the backend container structure. Removed the root `tests/` directory (deprecated smoke harness).
- **Docs**: Updated `FILE_MAP.md` to reflect the new repository structure.
- **Cleanup**: Removed `assets/tastify_logo_simple.svg` (unused asset).
- **Seeding**: Replaced the broken standalone `seed_all.py` script with a proper Django management command `python manage.py seed_all` inside the backend container. Fixed database connectivity issues by moving the logic into the Dockerized environment.
- **Fix**: Resolved a bug in the staff interface where closed (paid/canceled) orders would still appear on tables. Updated the `CommandeViewSet` to exclude terminal statuses when filtering by table ID.

## [2026-05-04] - 17:25
### Changed
- **Chore**: Improved `.gitignore` with comprehensive patterns for Django, React, Docker, Windows, and Agent-specific artifacts (`.claude/`, `.codex-tmp/`, etc.). Fixed paths for `app/backend/media/` and `app/backend/staticfiles/` to ensure correct ignoring.

## [2026-05-04] - 14:35
### Fixed
- **KDS Audio Feedback**: Replaced the silent 427-byte placeholder `kitchen-bell.mp3` with a real 18.5KB "ding" sound from a public domain repository. This restores the audio notification when an order is fired to the kitchen.

## [2026-05-03] - 22:30
### Fixed
- Unified frontend reload protection by moving the render crash boundary into `frontend/_shared/ui/AppErrorBoundary.tsx`, wiring `frontend/portail-client/src/App.tsx` through `AuthBootstrap`, and reusing the same fallback in `frontend/back-office/src/App.tsx`.

### Added
- Added shared-boundary regression coverage from the back-office test suite while keeping the client portal on the same auth bootstrap path.

### Validation
- `frontend/back-office`: `npm test -- --run src/App.test.tsx src/components/ui/AppErrorBoundary.test.tsx src/components/layout/AppShell.test.tsx src/authBootstrap.test.tsx`
- `frontend/portail-client`: `npm run build`

### Commit
- Fix commit: `d453cd8`

## [2026-05-03] - 22:20
### Fixed
- Hardened auth bootstrap JWT parsing so corrupted or non-string persisted access tokens no longer throw during back-office startup.
- Added a back-office render error boundary so runtime crashes now surface as a visible fallback instead of a blank green screen.

### Added
- Added regression coverage for the new render error boundary and isolated app routing tests from auth bootstrap timing.

### Validation
- `frontend/back-office`: `npm test -- --run src/App.test.tsx src/components/ui/AppErrorBoundary.test.tsx src/components/layout/AppShell.test.tsx src/pages/Kds/KdsPage.test.tsx src/pages/Kds/KdsSocketManager.test.tsx src/authBootstrap.test.tsx`

### Commit
- Fix commit: `16b39c3`

## [2026-05-03] - 22:14
### Fixed
- Stopped the back-office bootstrap from calling `/api/users/refresh/` on every hard reload when the persisted staff access token is still valid, which was incorrectly forcing `CUISINIER` sessions into a failing refresh path.
- Limited bootstrap refresh to expired or near-expiry JWT access tokens so a missing refresh cookie no longer breaks a fresh reload immediately after login.

### Added
- Added regression coverage for valid, expired, and malformed persisted JWT access tokens in the auth bootstrap flow.

### Validation
- `frontend/back-office`: `npm test -- --run src/authBootstrap.test.tsx src/authPersistence.test.ts src/authRefreshSync.test.ts src/components/layout/AppShell.test.tsx`

### Commit
- Fix commit: `daeefbb`

## [2026-05-03] - 22:03
### Fixed
- Hardened the KDS order store against malformed API and websocket payloads so a stale or incomplete `commande` can no longer crash the `CUISINIER` screen after a hard reload.
- Sanitized invalid `created_at` values and non-array `lignes` payloads inside the KDS UI, preventing timer and ticket rendering from producing the blank green shell.

### Added
- Added regression coverage for malformed KDS fetch payloads, malformed websocket orders, and invalid ticket/timer dates so the reload crash path remains covered.

### Validation
- `frontend/back-office`: `npm test -- --run src/pages/Kds/store/useKdsStore.test.ts src/pages/Kds/components/TicketCard.test.tsx src/pages/Kds/components/KdsTimer.test.tsx src/pages/Kds/KdsPage.test.tsx src/pages/Kds/KdsSocketManager.test.tsx`

### Commit
- Fix commit: `7e23154`

## [2026-05-03] - 21:54
### Fixed
- Restored the staff auth store correctly after a hard reload by unwrapping Zustand's persisted `state` envelope before validating the cached session.
- Prevented the back-office shell from mounting with an authenticated session missing a valid role, avoiding the blank green screen seen by `CUISINIER` users after refresh.

### Added
- Added a regression test that covers the real persisted storage shape produced by Zustand so the reload bug cannot silently return.

### Validation
- `frontend/back-office`: `npm test -- --run authPersistence.test.ts authBootstrap.test.tsx authRefreshSync.test.ts AppShell.test.tsx`

### Commit
- Fix commit: `b5fbb66`

## [2026-05-03] - 20:05
### Added
- **Phase 16 (Order Push to KDS)**: Added "Tout Envoyer en Cuisine" button to `OrderingPage`. The button is gated by ownership and `EN_COURS` status, and triggers the `EN_CUISINE` PATCH transition.
- Updated `dashboard.html` with Phase 15 UAT status and Phase 16 progress.
- Synchronized `FILE_MAP.md` with Phase 16 planning artifacts.

## [2026-05-03] - 19:52
### Fixed
- **Back-Office Hydration Watchdog**: Completed the `AuthBootstrap` hardening by allowing the staff SPA to render after a hydration deadline even if Zustand persistence never finishes, eliminating the last `hasHydrated` gate that could still hold the app on a blank green shell.
- Kept the persisted-session refresh timeout and transient proxy retry behavior from the earlier hardening so a slow backend still resolves into a rendered app rather than an indefinite splash screen.

### Changed
- Updated `README.md` and `dashboard.html` to describe the hydration watchdog fallback now in place for the back-office SPA.

## [2026-05-03] - 19:43
### Fixed
- **Back-Office Bootstrap Resilience**: Hardened `frontend/_shared/auth/AuthBootstrap.tsx` so persisted-session bootstrap now times out safely, never blocks the initial render indefinitely, and preserves the session when the Vite proxy/backend startup path is only temporarily unavailable.
- Updated `frontend/_shared/auth/axiosInstance.ts` with a 5s request timeout plus bounded retries for transient proxy startup failures (`502/503/504`, transport timeouts, and network errors) before surfacing the error to the UI.
- Sanitized persisted auth hydration in `frontend/_shared/auth/useAuthStore.ts` so invalid or incompatible local storage payloads are discarded instead of leaving Zustand hydration in an inconsistent startup state.
- Relaxed both Vite dev-server configs (`frontend/back-office/vite.config.ts`, `frontend/portail-client/vite.config.ts`) to allow all hosts during Docker/local-network access, removing host filtering as a proxy-side startup variable.

### Added
- Added focused regression coverage in `frontend/back-office/src/authBootstrap.test.tsx`, `frontend/back-office/src/authPersistence.test.ts`, and `frontend/back-office/src/axiosInstance.test.ts` for bootstrap deadlines, persisted-auth sanitization, and transient proxy retry classification.

### Changed
- Updated `README.md`, `docs/brain/00_Meta/FILE_MAP.md`, and `dashboard.html` to reflect the auth-bootstrap resilience hardening and the expanded shared-auth test surface.

## [2026-05-03] - 19:19
### Fixed
- **Refresh Endpoint Hardening**: Updated `backend/apps/users/views/auth.py` so `/api/users/refresh/` no longer mutates parser-owned `request.data` and now converts invalid refresh-cookie `TokenError` cases into a proper `401 token_not_valid` response instead of a server-side `500`.
- Added backend coverage in `backend/apps/users/tests/test_auth.py` for the invalid refresh-cookie regression path.

## [2026-05-03] - 19:05
### Fixed
- **KDS Auth Bootstrap**: Added a startup refresh gate in the staff SPA so persisted staff sessions renew their access token from the refresh cookie before the KDS page and WebSocket layer mount, preventing reload-time `401 Unauthorized` API failures and rejected `/ws/staff/` handshakes with stale JWTs.
- Added a reusable `refreshPersistedSession()` path in `frontend/_shared/auth/AuthBootstrap.tsx` and wired `frontend/back-office/src/App.tsx` through `AuthBootstrap`.
- Extended auth-store hydration state in `frontend/_shared/auth/useAuthStore.ts` so the bootstrap only runs after persisted auth state is available.
- Hardened `frontend/back-office/src/pages/Kds/KdsSocketManager.tsx` with a typed payload guard for `order.statut`, eliminating the latent TypeScript build error in KDS websocket handling.
- Added focused frontend coverage in `frontend/back-office/src/authBootstrap.test.tsx` for the bootstrap refresh success/failure paths.

## [2026-05-03] - 18:33
### Fixed
- **KDS Frontend**: Restored the initial `fetchOrders()` call in `KdsPage` so the kitchen board hydrates on first load instead of waiting for a later websocket state change.
- Restored the defensive `fetchOrders()` resync in `KdsSocketManager` for `order_created` and `order_updated` frames so missed or partial realtime updates do not leave the board stale.
- Updated the KDS frontend regression tests to lock the restored hydration and order-event resync behavior.

## [2026-05-03] - 17:58
### Fixed
- **Backend Infrastructure**: Resolved broken static files serving (404 errors) for the Django admin and other assets by integrating `WhiteNoise`.
- Added `whitenoise==6.9.0` to `backend/requirements.txt`.
- Added `WhiteNoiseMiddleware` to `MIDDLEWARE` in `backend/tastify_backend/settings/base.py`.
- Updated `backend/entrypoint.sh` to run `python manage.py collectstatic --noinput` on startup.
- Verified fix via browser subagent and confirmed 162 static files collected in `backend-1` logs.

### Changed
- Updated `dashboard.html` to reflect the current state and progress.

## [2026-05-03] - 17:50
### Added
- **Phase 16 (Order Push to KDS)**: Tightened KDS queryset to strictly exclude `EN_COURS` orders and gated `Commande` PATCH operations on ownership.
- **Phase 16 (Manual Fire Logic)**: Gated JIT orchestration to only trigger on the `EN_COURS` -> `EN_CUISINE` transition.
- Added `16-03-SUMMARY.md` and `16-04-SUMMARY.md` to document implementation waves.

### Changed
- Updated `backend/apps/commandes/views.py` to enforce KDS visibility and ownership-based PATCH gates.
- Updated `backend/apps/commandes/signals.py` and `orchestrator.py` to support the "Manual Fire" transition logic.

## [2026-05-03] - 16:30
### Added
- **Phase 16 (Order Push to KDS) Wave 0**: Scaffolded backend regression tests (RED state).
- Added `TestCommandeFireTransitionSignal` in `test_signals.py` to verify fire-to-kitchen signal logic.
- Added orchestrator guard tests in `test_orchestrator.py` to ensure only `EN_CUISINE` orders are processed.
- Updated `KDSPermissionsTestCase` in `test_kds_permissions.py` to exclude `EN_COURS` orders from the kitchen view.
- Added `FireOrderPatchTestCase` in `test_api.py` to verify PATCH ownership and fire flow.
- Added Rule 11 to `GEMINI.md` to mandate planning with Gemini 3.1 PRO.

### Changed
- Updated `backend/tastify_backend/settings/test.py` to use in-memory Celery broker (`memory://`) and channel layer to allow faster, isolated backend testing on host.
- Updated `.planning/ROADMAP.md` to reflect Phase 15 completion and Phase 16 initiation.

## [2026-05-03] - 15:10
### Added
- **KDS Frontend Timing Logic**: Integrated `heure_lancement` into the KDS UI.
- Updated `KdsTimer` to support countdowns for future launches (e.g., "In 2:30").
- Updated `TicketCard` to distinguish between "EN_ATTENTE" (grayscale, countdown) and "EN_PREPARATION" (highlighted, active timer).
- Updated `useKdsStore` to handle `line_launched` WebSocket events for real-time status updates without full order refreshes.

## [2026-05-03] - 14:40
### Verified
- **Phase 15 (KDS Orchestrator Logic) COMPLETED**: Manual UAT passed.
- Confirmed `line_launched` WebSocket frames arrive as expected after `order_created`/`order_updated`.
- Verified commit-safe orchestration stability in a live session (240ms delay from creation to launch frame).
- Mark UAT-15-01 and UAT-15-02 as PASSED.

### Changed
- Updated `.planning/STATE.md` to reflect Phase 15 completion and incremented progress to 15/21 phases.
- Updated `.planning/phases/15-kds-orchestrator-logic/15-UAT.md` to reflect full verification.
- Updated `dashboard.html` with final Phase 15 status, updated stats (38% completion), and activity logs.

## [2026-05-02] - 23:52
### Fixed
- Added an explicit post-commit KDS orchestration path in `backend/apps/commandes/serializers.py` and `backend/apps/commandes/views.py` so live order creation and `add_items` rescheduling no longer depend solely on `CommandeLigne` signal timing.
- Centralized the committed scheduling callback in `backend/apps/commandes/services/orchestrator.py` with `KdsOrchestrator.schedule_reorchestration_after_commit(...)`.

### Added
- Added API regressions in `backend/apps/commandes/tests/test_api.py` covering committed create-path scheduling and committed `add_items` rescheduling.
- Updated `.planning/phases/15-kds-orchestrator-logic/15-UAT.md` with the second remediation step and current rerun requirement.
- Updated `dashboard.html` to reflect the new Phase 15 fix commit and the remaining manual websocket rerun.

### Validation
- `docker exec tastifypfa-backend-1 pytest apps/commandes/tests/ -v`: 43 passed.

### Commit
- `7895ebf` - `fix(15): schedule kds orchestration from api writes`

## [2026-05-02] - 23:36
### Fixed
- Deferred Phase 15 KDS re-orchestration and order snapshot broadcasting in `backend/apps/commandes/signals.py` so ETA scheduling and websocket emissions only happen after the surrounding transaction commits.
- Removed the premature order websocket path that could publish `order_created` with empty `lignes` and race immediate ETA launches against uncommitted line state.

### Added
- Added deferred-orchestration regression coverage in `backend/apps/commandes/tests/test_orchestrator.py`.
- Added post-commit broadcast coverage in `backend/apps/commandes/tests/test_signals.py`.
- Added API coverage that order creation defers broadcast scheduling until commit in `backend/apps/commandes/tests/test_api.py`.

### Validation
- `docker exec tastifypfa-backend-1 pytest apps/commandes/tests/ -v`: 40 passed.

### Commit
- `1841535` - `fix(15): defer kds orchestration until commit`

## [2026-05-02] - 23:30
### Changed
- Completed Phase 15 manual UAT session in `.planning/phases/15-kds-orchestrator-logic/15-UAT.md` with two recorded issues and inline diagnosis.
- Documented a likely live transaction/ETA race: orchestration is triggered from `post_save` and can enqueue immediate Celery launches before the surrounding write path is safely committed.
- Updated `dashboard.html` to reflect that Phase 15 UAT is diagnosed rather than merely in progress.

### Commit
- `[PENDING]`

## [2026-05-02] - 23:20
### Changed
- Updated `.planning/phases/15-kds-orchestrator-logic/15-UAT.md` after manual Test 1 failed: the CUISINIER socket received `order_created` with an empty `lignes` array instead of the expected `line_launched` payload.
- Updated `dashboard.html` to reflect that Phase 15 UAT is still in progress with one manual issue recorded and Test 2 now active.

### Commit
- `[PENDING]`

## [2026-05-02] - 23:10
### Added
- Created `.planning/phases/15-kds-orchestrator-logic/15-UAT.md` to persist the Phase 15 manual websocket verification session reconstructed from `.planning/.continue-here.md` and `STATE.md`.

### Changed
- Updated `dashboard.html` to show that the Phase 15 UAT session file now exists and that the active checkpoint is the live `line_launched` websocket verification.
- Updated `docs/brain/00_Meta/FILE_MAP.md` and `README.md` to reflect the persisted Phase 15 UAT artifact in the planning layout.

### Commit
- `[PENDING]`

## [2026-05-02] - 22:58
### Checkpointed
- Completed the automated portion of Phase 15 Plan 03 by validating `line_launched` websocket broadcasting and fixing the stale-fixture assertion in `backend/apps/commandes/tests/test_orchestrator.py`.
- Verified `backend/apps/commandes/tests/test_orchestrator.py -v` with `8 passed`.
- Started `celery-worker`, confirmed `celery -A tastify_backend inspect ping` returned `OK pong`, and confirmed live ETA smoke task `cffb63d4-0391-4334-9b37-cefccd0b3979` succeeded with `{'skipped': 'line_deleted', 'ligne_id': 999999}`.
- Added `.planning/.continue-here.md` and updated dashboard/state tracking so the repo now stops on the remaining manual Phase 15 websocket UAT.

### Pending
- Browser verification is still required for the CUISINIER websocket flow and revocation observation before `15-03` can be marked complete.

### Commit
- `[PENDING]`

## [2026-05-02] - 20:55
### Verified (Phase 14: KDS Base Frontend)
- **Manual UAT Success**:
    - **Order Flow to KDS**: Confirmed that new orders from the staff API appear instantly in the KDS board via WebSocket.
    - **UX/UI**: Verified horizontal scrolling, densed kitchen ticket layout, and ECO-FRESH color compliance (Ardoise/Teal/Amber).
    - **KDS Timer**: Verified logic for 10m (Amber) and 20m (Red Pulse) thresholds.
- **Automated Tests**:
    - Backend KDS permissions tests (5/5 PASSED).
    - Frontend KDS components and store tests (27/27 PASSED).
- **Documentation**:
    - Updated `14-UAT.md` to PASSED.
    - Updated project dashboard with new metrics and status.
- **Commit**: `[PENDING]`

## [2026-05-02] - 20:45
### Verified (Phase 13: WebSocket Infrastructure)
- **Manual UAT Success**:
    - **Live Event Reception**: Successfully broadcasted an `infrastructure_test` event from the backend and confirmed reception in the staff browser (Network tab).
    - **Automatic Reconnection**: Verified that the frontend automatically reconnects to the WebSocket after a backend restart, with exponential backoff and jitter.
- **Automated Tests**:
    - Re-ran the full suite of backend WebSocket auth and consumer tests (10/10 PASSED).
    - Re-ran the frontend `WebSocketProvider` unit tests (9/9 PASSED).
- **Documentation**:
    - Updated `13-UAT.md` to PASSED.
    - Updated project dashboard to reflect verified status.
- **Commit**: `e94b8bd6eb8428f6ff5b62ce7d6051f108c78ea0`

## [2026-05-02] - 17:50
### Redesigned (KDS UI - ECO-FRESH Alignment)
- **Frontend**: 
  - Redesigned `KdsPage` with standard `ECO-FRESH` colors and `Organic Efficiency` layout.
  - Redesigned `TicketCard` component with improved typography, borders, and interactive feedback.
  - Standardized `KdsTimer` colors (`teal`, `amber`, `error`) and refined display.
- **Testing**:
  - Updated `KdsTimer.test.tsx` and `TicketCard.test.tsx` to match the new UI structure and labels.
- **Commit**: `824deca8ce9aa02225d84c0a446033c5be5d3934`

## [2026-05-02] - 17:42
### Fixed
- Reworked `frontend/back-office/src/pages/Kds/KdsPage.tsx` to stop the jittery horizontal rail behavior by intercepting dominant vertical wheel input, removing the old smooth-snap feel, and tightening the KDS viewport density.
- Redesigned `frontend/back-office/src/pages/Kds/components/TicketCard.tsx` into a denser kitchen ticket layout so more active orders fit on screen without the oversized card feel.
- Reduced the visual bulk of `frontend/back-office/src/pages/Kds/components/KdsTimer.tsx` so timing remains readable without wasting ticket header space.

### Added
- Added a focused scroll-rail regression test in `frontend/back-office/src/pages/Kds/KdsPage.test.tsx`.
- Extended `frontend/back-office/src/pages/Kds/components/TicketCard.test.tsx` with coverage for the new compact ticket metadata.

### Validation
- `npm run test -- src/pages/Kds/KdsPage.test.tsx src/pages/Kds/components/TicketCard.test.tsx src/pages/Kds/components/KdsTimer.test.tsx --run`: passed.
- `npm run build`: passed for `frontend/back-office`.

## [2026-05-02] - 17:03
### Fixed
- Normalized staff websocket payloads in `backend/core/realtime.py` before `group_send`, preventing order events with nested `Decimal` values from failing JSON websocket delivery to the KDS.
- Routed commande signals through the shared realtime helper so future staff broadcasts use the same JSON-safe path.

### Added
- Added websocket coverage for Decimal-bearing staff payloads in `backend/core/tests/test_staff_consumer.py`.

### Validation
- Passed lightweight serialization check with `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test` and `make_json_safe(...)`.
- Full Django test run blocked locally because `db` is only resolvable inside Compose; Docker API access is denied from this shell; Vitest startup is blocked by Tailwind oxide `spawn EPERM`.
- Auto-commit blocked by sandbox ACL: `git add` cannot create `.git/index.lock` and exits with `Permission denied`.

## [2026-05-02] - 17:01
### Fixed
- Updated `frontend/back-office/src/pages/Kds/KdsSocketManager.tsx` so the KDS re-syncs its order list whenever the staff websocket opens and after `order_created` / `order_updated`, preventing missed mobile-created orders from leaving the kitchen board empty after websocket reconnects.

### Added
- Extended `frontend/back-office/src/pages/Kds/KdsSocketManager.test.tsx` with coverage for websocket-open resyncs and command-event refetch behavior.

### Validation
- `npm run test -- src/pages/Kds/KdsSocketManager.test.tsx --run`: passed.

## [2026-05-02] - 16:46
### Fixed
- Updated `backend/apps/commandes/views.py` so CUISINIER requests using `statut=EN_CUISINE` still include freshly created `EN_COURS` orders, preventing the KDS board from missing new tickets during `H-14-01`.

### Added
- Added a focused regression test in `backend/apps/commandes/tests/test_kds_permissions.py` covering the KDS compatibility case where `?statut=EN_CUISINE` must still surface new kitchen work.

### Validation
- `docker compose exec backend pytest -q apps/commandes/tests/test_kds_permissions.py`: passed.

## [2026-05-02] - 01:57
### Fixed
- Returned `username` and `role` from `POST /api/users/refresh/` so the shared auth layer can no longer keep a stale staff identity after a cross-portal session refresh.
- Updated `frontend/_shared/auth/axiosInstance.ts` and `frontend/_shared/auth/useAuthStore.ts` so refreshes synchronize the persisted user alongside the new access token, preventing KDS `403 Forbidden` failures caused by auth-state drift.

### Added
- Added `frontend/back-office/src/authRefreshSync.test.ts` to lock the regression where a refreshed token changes role identity across the shared client/staff auth store.

### Changed
- Updated `README.md`, `docs/brain/00_Meta/FILE_MAP.md`, and `dashboard.html` to reflect the shared auth refresh synchronization coverage.

### Validation
- `npm run test -- src/authRefreshSync.test.ts --run`: passed.
- `docker compose exec backend pytest -q apps/users/tests/test_auth.py apps/commandes/tests/test_kds_permissions.py`: passed.

### Commit
- `44f067d` - `fix(auth): sync refreshed role identity`

## [2026-05-01] - 20:49
### Fixed
- Suppressed the dev-only staff websocket false positive by deferring `WebSocketProvider` connection setup until after the transient React `StrictMode` remount window, so the cleanup path no longer closes a socket that is still in `CONNECTING`.

### Added
- Added a `StrictMode` regression case to `frontend/back-office/src/websocket/WebSocketProvider.test.tsx` to verify the provider does not open and immediately close a connecting socket during development remounts.

### Validation
- `npm run test -- src/websocket/WebSocketProvider.test.tsx --run`: passed.

### Commit
- `6694c01` - `fix(websocket): avoid strict mode early close noise`

## [2026-05-01] - 20:46
### Fixed
- Restored the back-office staff websocket dev path by proxying `/ws` from Vite to `ws://backend:8000`, so `ws://localhost:3000/ws/staff/` now reaches Django Channels during local development.

### Added
- Added `frontend/back-office/src/viteConfig.test.ts` to guard the `/ws` proxy regression in the back-office Vite config.

### Validation
- `npm run test -- src/viteConfig.test.ts --run`: passed.
- `npm run test -- src/websocket/WebSocketProvider.test.tsx --run`: passed.

### Commit
- `0327c1a` - `fix(back-office): proxy staff websocket in dev`

## [2026-05-01] - 18:51
### Added
- Added `.planning/phases/13-websocket-infrastructure/13-03-SUMMARY.md` to capture the final verification wave for the websocket infrastructure phase.
- Added a fresh-process ASGI regression test in `backend/core/tests/test_websocket_auth.py` so Phase 13 covers live Daphne import behavior rather than only in-process communicator paths.

### Fixed
- Corrected `backend/tastify_backend/asgi.py` import order so Django app initialization happens before websocket middleware imports touch auth models.

### Changed
- Marked Phase 13 complete in `.planning/ROADMAP.md` and `.planning/STATE.md`, with execution progress advanced to 13/40 phases and 36/36 planned slices completed.
- Updated `README.md` and `docs/brain/00_Meta/FILE_MAP.md` to reflect completed Phase 13 execution summaries and the shared websocket surface.

### Validation
- `docker compose exec backend pytest -q`: 92 passed.
- `npm run test -- --run`: 76 passed.
- `npm run build`: passed.
- Live smoke passed after rebuilding the backend container and connecting to `ws://localhost:8000/ws/staff/` with a valid staff JWT plus `Origin: http://localhost`, then receiving `{"type":"infrastructure_test","payload":{"source":"phase_13"}}`.

## [2026-05-01] - 18:27
### Changed
- **Synchronization**: Finalized project state synchronization and dashboard health check.
- **Dashboard**: Updated `dashboard.html` timestamp and verified progress (30%).

## [2026-05-01] - 18:45
### Verified
- **Manual UAT Success**: The user has manually verified and passed all 5 key testing areas from the Human Test Plan:
    1. **Real-time WebSockets**: Connection, reconnection, and multi-tab sync verified.
    2. **E2E Order Flow**: Full lifecycle from table selection to order closure verified.
    3. **Media Management**: Image uploads, previews, and cleanup verified.
    4. **Interactive Floor Plan**: Grid snapping and collision detection in editor verified.
    5. **Mobile & Responsive**: Sidebar accessibility and drawer layouts verified on mobile.

## [2026-05-01] - 18:15
### Changed
- **Roadmap Expansion**: Extended the project roadmap from 35 to 40 phases to ensure 100% compliance with the technical specifications.
- **UC Integration**: Added specific phases for Click & Collect (UC24), Staff Scheduling (UC05), Weather-aware Stock Prediction (UC29), and Advanced KDS Controls (UC19/20_bis).
- **Dashboard**: Updated `dashboard.html` and project progress stats to reflect the expanded scope (Phases 12/40).

## [2026-05-01] - 18:02
### Added
- Created `.planning/phases/13-websocket-infrastructure/13-VALIDATION.md` for Nyquist coverage of the Phase 13 WebSocket slice.
- Added `.planning/phases/13-websocket-infrastructure/13-01-PLAN.md`, `13-02-PLAN.md`, and `13-03-PLAN.md` covering backend Channels infrastructure, shared staff WebSocket provider/store integration, and final Redis-backed verification plus project-state synchronization.

### Changed
- Resolved the remaining Phase 13 websocket policy decisions in `13-RESEARCH.md`, including handshake-only authentication scope and the `4401` vs `4403` close-code split.
- Updated `.planning/ROADMAP.md` and `.planning/STATE.md` to mark Phase 13 as planned with 3 execution slices.
- Updated `README.md` and `docs/brain/00_Meta/FILE_MAP.md` to reflect the new Phase 13 validation and planning artifacts.

### Validation
- Ran static plan verification against the revised Phase 13 artifact set and cleared requirement coverage, context compliance, Nyquist validation presence, AGENTS.md compliance, dependency ordering, and verification completeness.

## [2026-05-01] - 17:43
### Added
- Completed technical research for Phase 13: WebSocket Infrastructure.
- Added `.planning/phases/13-websocket-infrastructure/13-RESEARCH.md` covering the validated Django Channels, Redis channel layer, Simple JWT query-string authentication, staff broadcast architecture, frontend connection strategy, security constraints, and test map.

### Changed
- Updated `.planning/STATE.md` to resume from the new Phase 13 research artifact.
- Updated `docs/brain/00_Meta/FILE_MAP.md` and `README.md` to reflect the new Phase 13 planning artifact and current roadmap depth.

### Validation
- Verified the research against the current codebase integration points in `backend/tastify_backend/asgi.py`, `backend/tastify_backend/settings/base.py`, `backend/requirements.txt`, `docker-compose.yml`, and `frontend/_shared/auth/`.

## [2026-05-01] - 12:15
### Added
- Completed the final pending item on the Human Test Plan (`H-06-01`).
- Successfully executed the integration test suite for `apps.menu` inside the live Docker container, achieving a 100% pass rate.
- Verified Phase 6 Plats API and Soft Delete model integration against the live MySQL database.
- Updated `.planning/audit_uat_report.md` to reflect that all prioritized human test plan items are now PASSED.

### Validation
- `docker exec tastifypfa-backend-1 pytest apps/menu/tests/test_plats_api.py apps/menu/tests/test_plat_soft_delete.py`: 10/10 passed.
- Human test plan is now fully resolved and closed out.

## [2026-05-01] - 12:00
### Fixed
- Resolved Pytest test database creation error (1044 Access Denied) by granting explicit privileges to the `tastify` user for `test_%` databases.
- Fixed `apps/users/tests/test_commands.py` where `SeedTests` expected 4 seeded users instead of the updated 10 users generated by the `seed_dev` command.

### Validation
- Executed `GRANT ALL PRIVILEGES` via Docker on the `tastifypfa-db-1` container.
- `docker exec tastifypfa-backend-1 pytest apps/users/tests/test_commands.py` ran successfully.

## [2026-05-01] - 11:30
### Added
- Integrated the **Human Test Plan** into the project dashboard (`dashboard.html`).
- Updated `scripts/update_dashboard.py` to automatically parse Section 3 of `.planning/audit_uat_report.md` and render it in the dashboard.
- Created a new "Human Test Plan" card with priority-based badges (High, Medium, Low) for better visibility of manual verification tasks.

### Validation
- `python scripts/update_dashboard.py`: Successfully synchronized the new section.
- Manual verification of the dashboard layout and parsing logic.
- **Fixed**: Made the left column scrollable (`overflow-y-auto`) to ensure all cards, including the new Human Test Plan, are visible.
- **Fixed**: Restored visibility of the "Roadmap Overview" by giving the phases list a fixed height (`h-96`), preventing it from collapsing in the new scrollable column layout.

## [2026-05-01] - 10:00
### Added
- Performed a project-wide UAT & Verification Audit.
- Created `.planning/audit_uat_report.md` identifying stale documentation and pending human verification items.
- Discovered that Phases 01, 04, 05, and 08 are fully implemented despite documentation indicating otherwise.
- Produced a prioritized human test plan to close verification gaps caused by previous environment constraints (Docker unavailability).

### Validation
- Cross-referenced all phase UAT/Verification files with the actual codebase and frontend integration state.
- Verified Categories and Plats frontend integration in `App.tsx`.
- Verified Tables API and models existence in `backend/apps/tables`.
- Updated project dashboard to reflect the current unified progress (34%).

## [2026-04-30] - 23:25
### Added
- Completed User Acceptance Testing (UAT) for Phase 11: Commandes REST API.
- Verified nested order creation, table status synchronization, ownership filtering, and table availability guards.
- Updated `11-UAT.md` with final PASSED status and completion timestamps.

### Fixed
- Fixed `CommandeViewSet` to properly filter active orders by `table_id` and allow cross-server visibility for active service coordination.
- Fixed `CommandeSerializer` to return `serveur_name` and `plat_details` (id, nom, prix) for enriched frontend display.
- Fixed `OrderingPage.tsx` state persistence bug where active orders were not cleared when navigating between occupied and free tables.

### Validation
- User verified all UAT test cases and bug fixes in a live conversational session.
- `dashboard.html` and `STATE.md` updated to reflect verified completion.

## [2026-04-30] - 23:26
### Added
- Generated and seeded professional high-quality images for all 21 dishes and 4 categories.
- Updated `seed_menu` to correctly map image paths in the media directory.

### Validation
- `seed_menu`: All categories and dishes now have valid image paths.
- Manual verification of `media/plats/` and `media/categories/` contents.

## [2026-04-30] - 23:19
### Changed
- Updated `seed_dev` to use `update_or_create`, ensuring all fields (names, emails, roles) are synced for existing users.
- Added realistic Moroccan names (Mehdi, Omar, Sara, Fatine, etc.) to all test accounts for better presentation.
- Synchronized documentation (`user.md`, `DEV_CREDENTIALS.md`) with the new full names.

### Validation
- `seed_dev`: Successfully updated all 10 existing users with new field data.

## [2026-04-30] - 23:16
### Changed
- Enriched database seeding with a comprehensive menu: 21 dishes across 4 categories (Entrées, Plats Principaux, Desserts, Boissons).
- Expanded table seeding to 20 tables with varied capacities.
- Unified seeding logic to use `update_or_create` for better idempotency across all scripts.

### Validation
- `seed_dev`: 10 test accounts created.
- `seed_menu`: 4 categories and 21 dishes created.
- `seed_tables`: 20 tables created.

## [2026-04-30] - 22:08
### Changed
- Reverted to a single Gérant account (`gerant_test`) to better align with real restaurant structures.
- Kept 3 accounts for each operational role (SERVEUR, CUISINIER, CLIENT) for concurrency testing.
- Cleaned up development database and updated documentation.

### Validation
- `Utilisateur.objects.filter(username__in=['gerant2_test', 'gerant3_test']).delete()`: Successfully removed extra manager accounts.
- `seed_dev`: Verified state matches new configuration.

## [2026-04-30] - 22:05
### Added
- Created 12 test users (3 for each role: GERANT, SERVEUR, CUISINIER, CLIENT) to support extensive multi-user and concurrency testing.
- Updated `seed_dev` management command to maintain all 12 test accounts.
- Updated `user.md` and `DEV_CREDENTIALS.md` documentation.

### Validation
- `docker compose exec backend python manage.py seed_dev`: All 12 users confirmed in database.

## [2026-04-30] - 20:55
### Added
- Created a new server (waiter) user `serveur2_test` to support multi-user testing scenarios.
- Updated `seed_dev` management command to include the new user in the dev environment.
- Updated `user.md` and `DEV_CREDENTIALS.md` documentation.

### Validation
- `docker compose exec backend python manage.py seed_dev`: User `serveur2_test` created successfully.
- Manual verification of documentation files.

## [2026-04-30] - 19:55
### Added
- Completed User Acceptance Testing (UAT) for Phase 12: Order Taking Frontend.
- Verified 5 core UAT scenarios: Table Navigation, Category Browsing, Cart Management, Order Review, and Order Submission.
- Confirmed end-to-end integration between the Salle UI (Serveur role) and the Phase 11 Commandes REST API.
- Updated `12-UAT.md` with final PASSED status and completion timestamps.

### Validation
- User verified all 5 UAT test cases in a live conversational session.
- `dashboard.html` and `STATE.md` updated to reflect verified completion.

## [2026-04-30] - 19:38
### Fixed
- Applied pending `commandes.0001_initial` migration to the running MySQL database after `/api/commandes/` failed with missing table `commandes_commande`.
- Added `backend/entrypoint.sh` and wired the backend Docker image to run pending Django migrations before Daphne starts, preventing fresh/recreated volumes from serving traffic with missing app tables.

### Validation
- `docker compose exec backend python manage.py migrate --noinput`: applied `commandes.0001_initial`.
- `docker compose exec backend python manage.py test apps.commandes.tests.test_api.CommandeAPITestCase.test_create_commande_atomic`: 1/1 passed before the startup hardening change.
- `docker compose up -d --build backend`: rebuilt and restarted backend with migration entrypoint.
- `docker compose logs --tail=40 backend`: confirmed startup runs migrations before Daphne (`No migrations to apply` after rebuild).
- `docker compose exec backend python manage.py test apps.commandes`: 23/23 passed.
- Commit: `fa5a75d`

## [2026-04-30] - 19:30
### Fixed
- Verrouillage des routes staff par role: `SERVEUR` est redirige vers `/salle`, `CUISINIER` vers `/kds`, et les routes gerant restent reservees a `GERANT`.
- Filtrage de la sidebar staff selon le role pour ne plus afficher les entrees gerant aux serveurs.
- Commit: `529fb0e`

### Validation
- `npm run test -- src/App.test.tsx src/roleAccess.test.ts --run` dans `frontend/back-office`: 8/8 passed.
- `npm run build` dans `frontend/back-office`: passed avec l'avertissement Vite preexistant de chunk > 500 kB.

## [2026-04-30] - 19:13
### Added
- Ajout d'un bouton de déconnexion dans la barre latérale (Sidebar) du back-office.
- Intégration de la logique de déconnexion (appel API `/users/logout/` et nettoyage de l'état local via `useAuthStore`).
- Mise à jour du style pour inclure un feedback tactile (`scale-97`) et des effets de survol conformes au système de design.

### Fixed
- Correction des chemins `@shared` dans les fichiers `tsconfig.json` des deux frontends pour permettre la résolution des modules partagés lors des builds dans Docker.

### Validation
- `npm run build` dans `frontend/back-office`: 100% succès.
- `npm run build` dans `frontend/portail-client`: 100% succès.
- Vérification visuelle du bouton avec icône `LogOut` et comportement au clic.

## [2026-04-30] - 19:06
### Fixed
- Resolved TypeScript `baseUrl` deprecation warnings in `portail-client` by removing the deprecated option and normalizing configuration with `back-office`.
- Verified that retired frontend directories (`salle`, `kds`) are successfully removed from the project structure to address stale IDE errors.

### Validation
- `npm run build` in `frontend/portail-client`: 100% success.
- `npm run build` in `frontend/back-office`: 100% success.
- `Test-Path` confirmed `frontend/salle` and `frontend/kds` are deleted.

## [2026-04-30] - 18:56
### Fixed
- Normalized backend media URLs returned as `http://backend:8000/media/...` into browser-safe `/media/...` paths.
- Applied media URL normalization to category thumbnails, plat list/card images, plat drawer previews, and order-taking dish cards.

### Validation
- `npm run test -- src/mediaUrl.test.ts --run` in `frontend/back-office`: 2/2 passed.
- `npm run build` in `frontend/back-office`: passed with existing Vite chunk-size warning.
- Commit: `5b4aac4`

## [2026-04-30] - 18:45
### Changed
- Replaced cross-frontend login redirection with role gates.
- Staff frontend now accepts only `GERANT`, `SERVEUR`, and `CUISINIER`; Portail Client accepts only `CLIENT`.
- Differentiated login screens: staff login uses the staff label and teal accent, client login uses the client label and amber accent.
- Removed the obsolete `roleRedirect.ts` helper in favor of `roleAccess.ts`.

### Validation
- `npm run build` in `frontend/back-office`: passed with existing Vite chunk-size warning.
- `npm run build` in `frontend/portail-client`: passed.
- `npm run test -- src/roleAccess.test.ts --run` in `frontend/back-office`: 2/2 passed.
- Commit: `ae89637`

## [2026-04-30] - 18:35
### Changed
- Consolidated runtime frontends to one staff app on `3000` and one client app on `3003`.
- Moved Salle order-taking and KDS entry routes into `frontend/back-office`.
- Removed `salle` and `kds` services from Docker Compose and deleted the retired frontend directories.
- Updated shared role redirects so GERANT, SERVEUR, and CUISINIER stay on staff port `3000`, while CLIENT uses port `3003`.
- Updated README, FILE_MAP, GSD state/roadmap/UAT/direct-port amendment, and smoke test documentation for the two-frontend topology.

### Validation
- `npm run build` in `frontend/back-office`: passed with existing Vite chunk-size warning.
- `npm run test -- src/roleRedirect.test.ts --run` in `frontend/back-office`: 3/3 passed.
- `npm run build` in `frontend/portail-client`: passed.
- `docker compose config`: passed.
- `docker compose up -d --build --remove-orphans`: recreated backend, backoffice, portail, db, and redis.
- `docker compose ps`: only backend `8000`, backoffice `3000`, portail `3003`, db, and redis are running.
- Commit: `24dd423`

## [2026-04-30] - 18:19
### Fixed
- Added shared role-to-frontend redirect logic so GERANT, SERVEUR, and CUISINIER sessions land on their canonical direct-port apps.
- Updated Salle, KDS, Portail Client, and Back-Office login flows to redirect authenticated users to the correct frontend port after login.
- Fixed GERANT login from Salle so it redirects from `http://localhost:3001/` to `http://localhost:3000/`.

### Validation
- `npm run test -- src/roleRedirect.test.ts --run` in `frontend/salle`: 3/3 passed.
- `npm run build` in `frontend/salle`: passed with existing Vite chunk-size warning only.
- `npm run build` in `frontend/kds`: passed.
- `npm run build` in `frontend/portail-client`: passed.
- `npm run build` in `frontend/back-office`: passed.
- Commit: `c148cde`

## [2026-04-30] - 18:05
### Fixed
- Recreated the direct-port frontend containers with fresh `/app/node_modules` volumes after Salle reported a Vite import-analysis error for `react-router-dom`.
- Documented the stale frontend volume recovery command in the direct-port GSD amendment.

### Validation
- `docker compose exec salle npm ls react-router-dom`: resolved `react-router-dom@7.14.2`.
- `docker compose logs --tail=80 salle`: Vite ready on `http://localhost:3001/` with no import-analysis error.
- `docker compose ps salle`: Salle running on host port `3001`.
- Commit: `8b7e979`

## [2026-04-30] - 12:16
### Changed
- Removed the Nginx service from `docker-compose.yml`.
- Exposed backend on `8000` and frontends directly on `3000`, `3001`, `3002`, and `3003`.
- Removed Vite base paths and Nginx HMR `clientPort: 80` settings.
- Added Vite `/api` and `/media` proxies to `http://backend:8000`.
- Updated portal role redirects to absolute direct-port URLs.
- Removed the back-office router basename so it runs at the root of port `3000`.
- Added GSD direct-port infrastructure amendment.

### Validation
- `docker compose config`: passed.
- `npm run test -- src/App.test.tsx --run` in `frontend/back-office`: 3/3 passed.
- `npm run build` in `frontend/back-office`: passed.
- `npm run build` in `frontend/salle`: passed with Vite chunk-size warning only.
- `npm run build` in `frontend/kds`: passed.
- `npm run build" in `frontend/portail-client`: passed.
- Commit: `1951ea9`

## [2026-04-30] - 00:38
### Added
- Completed Phase 12: Order Taking Frontend.
- Added Salle routing for `/tables/:id/order` and table activation from the map.
- Added `useOrderStore` with isolated per-table carts, item counts, totals, and clear behavior.
- Added category tabs, dish grid, dish cards, floating cart, and mandatory order review drawer.
- Added order submission to `POST /api/commandes/` using `table` and nested `lignes`.
- Added Phase 12 summaries and verification report.

### Validation
- `npm run test -- useOrderStore.test.ts`: 5/5 passed.
- `npm run test -- OrderingPage.test.tsx`: 2/2 passed.
- `npm run test -- DishGrid.test.tsx`: 3/3 passed.
- `npm run test -- OrderReview.test.tsx`: 3/3 passed.
- `npm run test -- MapView.test.tsx`: 7/7 passed.
- `npm test` in `frontend/salle`: 20/20 passed.
- `npm run build` in `frontend/salle`: passed.
- Backend commandes regression was blocked because Docker Desktop is not running and local Django cannot resolve Docker host `db`.
- Commit: `ab9ec57`

## [2026-04-30] - 00:20
### Added
- Completed Phase 11: Commandes REST API.
- Implemented `CommandeViewSet` with support for atomic nested creation of order lines.
- Implemented ownership-based filtering ensuring `SERVEUR` only sees their own orders.
- Added Django signals to synchronize `Table.statut` with the order lifecycle (OCCUPEE on create, LIBRE on pay/cancel).
- Added custom `@action add_items` for appending lines to existing orders.
- Verified with 23 unit and integration tests covering nested CRUD, RBAC, and table sync.

### Validation
- `python backend/manage.py test apps.commandes`: 23/23 passed.
- Verified automatic table state transitions and atomic transaction safety.

## [2026-04-30] - 00:20
### Added
- Completed Phase 11: Commandes REST API.
- Implemented `CommandeViewSet` with support for atomic nested creation of order lines.
- Implemented ownership-based filtering ensuring `SERVEUR` only sees their own orders.
- Added Django signals to synchronize `Table.statut` with the order lifecycle (OCCUPEE on create, LIBRE on pay/cancel).
- Added custom `@action add_items` for appending lines to existing orders.
- Verified with 23 unit and integration tests covering nested CRUD, RBAC, and table sync.

### Validation
- `python backend/manage.py test apps.commandes`: 23/23 passed.
- Verified automatic table state transitions and atomic transaction safety.

## [2026-04-29] - 16:45
### Added
- Completed Phase 10: Commandes Model.
- Added `apps.commandes` with `Commande` soft-delete model and `CommandeLigne` price snapshot model.
- Added Django signals to recalculate `Commande.montant_total` from non-cancelled order lines.
- Added initial `commandes` migration and 13 unit tests covering model defaults, soft-delete, price snapshots, and signal-driven totals.
- Added Phase 10 execution summaries and verification report.

### Validation
- `python backend\manage.py check`: passed.
- `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test python backend\manage.py check`: passed.
- `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test python backend\manage.py makemigrations --check --dry-run`: passed.
- `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test python backend\manage.py test apps.commandes`: 13/13 passed.
- Default MySQL-backed tests were blocked because Docker Desktop was not running and host `db` was unreachable.
- Commit: `53fdeda`

## [2026-04-29] - 15:25
### Changed
- **Planned Phase 10: Commandes Model**:
  - Completed technical research on Django signals and recursive total calculation.
  - Mapped implementation patterns (soft-delete, managers, enums) from existing apps.
  - Generated executable plans `10-01-PLAN.md`, `10-02-PLAN.md`, and `10-03-PLAN.md` covering model scaffolding, signals, and migrations.
- Updated `ROADMAP.md` and `STATE.md` to reflect that Phase 10 is ready for execution.

### Validation
- Research confirmed pattern consistency for soft-delete and status enums.
- Pitfalls like signal recursion documented in `10-RESEARCH.md`.
- Patterns mapped in `10-PATTERNS.md`.

## [2026-04-29] - 15:10
### Added
- **Category Visual Enrichment**: Generated and integrated premium professional images for core categories ("Entrées", "Plats Principaux", "Desserts").
- Updated `seed_menu.py` with `update_or_create` logic to ensure existing categories are enriched with images.
- Created `backend/media/categories/` and synchronized 3 high-quality AI-generated assets.

### Validation
- Database seeding logic verified with idempotent update support.
- Filesystem synchronization confirmed for all 3 assets.
- ROADMAP and Dashboard updated to reflect enrichment.
- Commit: `8d7c67a`

## [2026-04-29] - 01:15
### Added
- **Centralized Back-Office**: Integrated the Table Map management directly into the Back-Office application.
- Moved `TableItem` and `TableMap` components to `frontend/_shared/components/map` to allow code reuse between apps.
- Created `TablesPage` in `back-office` with a consistent sidebar and UI experience.
- Updated `back-office` navigation to use internal routing for Tables.

### Fixed
- Resolved `framer-motion` resolution issues in shared components by adding the dependency to `back-office` and updating Vitest configs.
- Refactored `salle` app to use the shared map components.

### Validation
- `npm run test -- --run` in `frontend/salle`: 7/7 tests passed.
- `docker logs` for both `salle` and `back-office` confirm clean hot-reloads and dependency optimization.
- Commit: `9e3f4a1`

## [2026-04-29] - 01:00
### Fixed
- Resolved Vite import analysis error: `Failed to resolve import "framer-motion" from "src/components/map/TableItem.tsx"`.
- Installed `framer-motion` inside the running `tastifypfa-salle-1` Docker container to update its persistent `node_modules` volume.
- Verified that the Vite dev server hot-reloaded and optimized the new dependency successfully.

### Validation
- Checked `docker logs tastifypfa-salle-1`: Vite confirmed optimization and successful reload.
- Dashboard updated with the activity.
- Commit: `253347e`

## [2026-04-29] - 00:33
### Fixed
- Fixed the back-office **Tables** navigation entry, which was still a dead `#` link.
- Tables now opens `/salle/`, the existing Salle table map app where the interactive table page is implemented.
- Added a regression test to ensure the Tables sidebar link points to `/salle/`.

### Validation
- `npm run test -- --run src/components/layout/AppShell.test.tsx` in `frontend/back-office`: 4/4 tests passed.
- `npm run build` in `frontend/back-office`: passed.
- Commit: `a6890dc`

## [2026-04-29] - 00:17
### Fixed
- Fixed Salle table activation by switching SVG table selection to pointer-up and keyboard activation instead of relying on brittle SVG click behavior.
- Replaced the temporary browser alert with an in-page selected-table details panel so users get visible feedback after selecting a table.
- Added regression tests for pointer and keyboard table activation plus selected table details rendering.

### Validation
- `npm run test -- --run` in `frontend/salle`: 15/15 tests passed.
- `npm run build` in `frontend/salle`: passed.
- Commit: `dae5c1f`

## [2026-04-28] - 23:58
### Added
- Completed Phase 9 Plan 02: GERANT-only Salle table map editor.
- Added capacity-based SVG table shapes, pointer-driven drag placement, 20px grid snapping, bounds clamping, red collision warnings, dirty state tracking, cancel, and batch PATCH persistence.
- Added Salle Vitest setup with 12 tests covering map geometry, RBAC editor visibility, polling guard, save/cancel behavior, and failed-save handling.
- Added `09-02-SUMMARY.md` and `09-VERIFICATION.md` for GSD execution traceability.

### Fixed
- Corrected Salle Vite `@shared` alias to `../_shared` and deduped `react`, `react-dom`, and `zustand` to prevent duplicate React hook failures.

### Validation
- `npm run test -- --run` in `frontend/salle`: 12/12 tests passed.
- `npm run build` in `frontend/salle`: passed.
- Commits: `27352be`, `a25919e`

## [2026-04-28] - 23:43
### Changed
- Planned the remaining Phase 9 Map Editor execution slice.
- Expanded `09-02-PLAN.md` with executable TDD tasks for Salle Vitest setup, dynamic SVG table geometry, GERANT-only edit mode, 20px drag snapping, collision feedback, batch PATCH persistence, and final build verification.
- Updated `.planning/ROADMAP.md`, `.planning/STATE.md`, `FILE_MAP.md`, and `dashboard.html` to reflect that Phase 9 Plan 02 is ready to execute.
- Commit: `dcad5e6`


## [2026-04-28] - 23:55
### Changed
- Finalized Phase 9 Context and Implementation Strategy.
- Locked decisions for **Map Editor**:
  - 20px grid snapping for alignment.
  - Batch-save persistence logic.
  - Dynamic shapes (Circles/Rects) based on table capacity.
  - Red glow feedback for table collisions.
- Updated `09-CONTEXT.md` and `09-02-PLAN.md` with final requirements.

## [2026-04-28] - 23:45
### Added
- Completed Foundation of Phase 9: Tables Map Frontend (Plan 01).
- Implemented core SVG map visualization in the Salle UI.
- Created `TableItem` and `TableMap` components with status-based coloring and fallback grid logic.
- Integrated `MapView` page with initial polling (10s) and error handling.
- Verified authenticated users in Salle UI see the visual grid/map of tables.

## [2026-04-28] - 23:35
### Added
- **Visual Assets & Data**:
  - Generated 13 high-quality AI images for the dishes menu using `generate_image`.
  - Created `media/plats/` directory and synchronized 13 assets with appropriate naming.
  - Renamed test dish `hgfx` (id: 10) to "Zaalouk" for a more professional menu.
  - Added 3 new premium dishes: "Mechoui", "Rfissa", and "Tanjia Marrakchia".
  - Updated the database to link all 13 active dishes with their respective professional images.
  - Verified 100% database/filesystem synchronization for image assets.

## [2026-04-28] - 20:50
### Fixed
- **React Router Maintenance**:
  - Resolved console warnings by opting in to React Router v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`) in `back-office`.
  - Fixed `ignoreDeprecations: "6.0"` error in all `tsconfig.json` files by reverting to `"5.0"` (compatible with current TS 5.9.3).
  - Corrected broken `@shared` alias path in `back-office/vite.config.ts` to allow successful production builds.
  - Verified 100% build success in `back-office`.

## [2026-04-28] - 23:35
### Added
- Completed Phase 8: Tables Model & API.
- Implemented `apps/tables` Django app with `Table` model supporting soft-delete.
- Added `TableSerializer` and `TableViewSet` with hierarchical RBAC (GÃ©rant Full CRUD, Others Read-only).
- Consolidated `categories`, `plats`, and `tables` endpoints into a unified `api_router.py`.
- Created idempotent `seed_tables` command providing 12 test tables with mixed capacities.
- Verified with 21 automated tests (3 model, 8 rbac, 10 api) passing in Docker.

### Fixed
- Fixed `est_active` default behavior in `TableSerializer` by adding explicit `default=True` to resolve a DRF creation issue.

## [2026-04-28] - 21:25
### Added
- Completed Phase 7: Plats Frontend.
- Implemented `PlatDrawer` with grouped fields and strict inline validation (name, category, price, prep time).
- Integrated image upload support with instant preview in the drawer.
- Added context-aware creation (preselects active category filter).
- Implemented scoped empty states for better user guidance in filtered views.
- Finalized full management workflow (Create, Read, Update, Delete, Toggle Status).

### Validation
- Verified full Phase 7 suite with 17 automated tests (100% pass rate).
- Verified responsive behavior (Desktop Table vs Mobile Cards) and category filtering.

## [2026-04-28] - 20:55
### Added
- Completed Responsive Plats Surfaces (Sub-phase 02).
- Built `PlatListTable` (Desktop) and `PlatMobileCard` (Mobile) with integrated status controls and actions.
- Implemented `PlatStatusControls` for dual management of `est_disponible` and `est_active`.
- Added optimistic updates and processing states for inline status toggles and deletions.
- Improved `Switch` UI component with accessibility and disabled state support.

### Validation
- Verified with 13 automated tests across `Switch`, `PlatListTable`, and `PlatMobileCard`.

## [2026-04-28] - 20:45
### Added
- Completed Foundation of Phase 7: Plats Frontend (Sub-phase 01).
- Implemented `useResponsiveListView` hook for desktop/mobile list mode switching based on a 768px breakpoint.
- Created typed contracts for `Category` and `Plat` in `types.ts` aligned with the backend API.
- Implemented `PlatsPage` scaffold with:
  - Category filter state and UI (horizontal scrollable chips).
  - Data loading from `/api/categories/` and `/api/plats/` (with filtering).
  - Error handling and loading states.
- Registered `/plats" route in `App.tsx` and updated `Sidebar.tsx` navigation.

### Fixed
- Fixed `@shared` alias resolution in Vitest by dynamically switching between `../_shared` (local) and `./_shared` (Docker) paths in `vite.config.ts`.
- Updated `App.test.tsx` to include `/back-office` basename in route testing.

### Validation
- Verified foundation with automated tests:
  - `App.test.tsx` (3/3 passed)
  - `useResponsiveListView.test.ts` (3/3 passed)
  - `PlatsPage/index.test.tsx` (4/4 passed)

## [2026-04-28] - 20:35
### Added
- Added `.planning/phases/07-plats-frontend/07-RESEARCH.md` to document the verified frontend baseline, API contract, risks, and recommended plan split for dishes management.
- Added `.planning/phases/07-plats-frontend/07-01-PLAN.md`, `07-02-PLAN.md`, and `07-03-PLAN.md` as the executable plan set for Phase 7: Plats Frontend.

### Changed
- Updated `.planning/ROADMAP.md` to replace the Phase 7 `TBD` placeholder with the three planned execution slices.
- Updated `.planning/STATE.md` to resume from `07-01-PLAN.md` with Phase 7 marked as planned.
- Updated `docs/brain/00_Meta/FILE_MAP.md`, `README.md`, and `dashboard.html` to reflect the new Phase 7 planning artifacts and state shift.

## [2026-04-28] - 20:01
### Added
- Captured the full GSD context for Phase 7: Plats Frontend in `.planning/phases/07-plats-frontend/07-CONTEXT.md`.
- Added `.planning/phases/07-plats-frontend/07-DISCUSSION-LOG.md` to preserve the locked alternatives and final user choices for the dishes UI.

### Changed
- Updated `.planning/STATE.md` to resume from the new Phase 7 context artifact.
- Updated `docs/brain/00_Meta/FILE_MAP.md` to include the new Phase 7 planning directory.
- Updated `dashboard.html` to reflect the current project state: Phase 7 context captured.

## [2026-04-28] - 19:31
### Fixed
- Fixed 404 error on categories API by removing redundant /api prefix in back-office requests.
## [2026-04-28] - 18:19
### Added
- Captured the full GSD context for Phase 6: Plats Model & API in `.planning/phases/06-plats-model-api/06-CONTEXT.md`.
- Added `.planning/phases/06-plats-model-api/06-DISCUSSION-LOG.md` to preserve the locked alternatives and final user choices.
- Added `.planning/STATE.md` with the canonical resume point for the planning workflow.

### Changed
- Replaced the older placeholder Phase 6 context with the standard downstream-ready format, including canonical references and code-context sections.
- Updated `dashboard.html` to reflect the new project state: Phase 6 context captured.

### Commit
- `39d19df` - `docs(06): capture phase context`

## [2026-04-28] - 13:25
### Fixed
- **Definitive TypeScript Maintenance**:
  - Silenced `baseUrl` deprecation warnings in all frontend apps using `ignoreDeprecations: "5.0"` (compatible with TS 5.x).
  - Fixed project-wide build regressions in `salle`, `kds`, and `portail-client` by installing missing `@types/node`.
  - Corrected broken `@shared` alias paths in `vite.config.ts` for all apps.
  - Fixed CSS `@import` paths for `theme.css` in all frontend applications.
  - Resolved named import errors for `axiosInstance` by switching to default imports and using `@shared` aliases.
  - Fixed strict type inference issues in `_shared/auth/useAuthStore.ts` by adding explicit type casts for initial state.
  - Removed unused imports (`List`) in `Sidebar.tsx`.
  - Verified 100% build success across all 4 frontend SPAs.

## [2026-04-28] - 11:10
### Added
- Completed Execution of Phase 4: Categories Model & API.
- Implemented `menu` app with `Categorie` model supporting soft-delete (`est_active`).
- Configured REST API for categories with hierarchical RBAC (GÃ©rant Full CRUD, Others Read-only).
- Verified visibility logic for active/inactive categories via custom `CategorieManager`.
- Seeded development environment with test categories.
- Synchronized `dashboard.html` and `ROADMAP.md` (Progress: 11%).

## [2026-04-28] - 09:55
### Changed
- UI Refinement: Removed the "Tastify Portail" title and description text.
- Rebalanced Login UI: Rescaled hero logo to `320px` and adjusted vertical spacing.
- Fixed: Definitive fix for TypeScript `baseUrl` deprecation warnings by updating `ignoreDeprecations` to `"6.0"` in all apps.
- Updated all SPAs to remove redundant title properties from Login component usage.

## [2026-04-28] - 09:15
### Added
- Phase 4 Context Captured: Categories Model & API.
- Established implementation strategy for the `menu` app:
  - Confirmed `Categorie` model fields: `nom`, `description`, `ordre_affichage`, `image`, `est_active`.
  - Defined strict RBAC: GÃ©rant (Full CRUD), Others (Read-only).
  - Resolved visibility logic: Inactive categories hidden for all except GÃ©rant.
  - Mandated soft delete behavior (`est_active=False`) to preserve data integrity for dishes.
- Created `.planning/phases/04-categories-model-api/04-CONTEXT.md` to guide research and planning.

## [2026-04-28] - 09:09
### Fixed
- Definitively resolved all IDE TypeScript errors in `frontend/_shared/`:
  - Created a Windows directory junction `frontend/_shared/node_modules -> frontend/back-office/node_modules` so TypeScript resolves `react`, `lucide-react`, `zustand`, `axios` from the shared folder without symlink admin rights.
  - Created `frontend/_shared/tsconfig.json` as a standalone TypeScript context for IDE support.
  - Created `frontend/_shared/declarations.d.ts` to declare `*.svg` and other asset modules.
  - `tsc --noEmit` in `back-office` now exits with code 0. (Commit: `472da9b`)

## [2026-04-28] - 07:55
### Fixed
- Hardened shared frontend infrastructure against IDE resolution errors:
  - Created `frontend/_shared/tsconfig.json` to establish a dedicated TypeScript context for shared components.
  - Updated all sub-app `tsconfig.json` files (`back-office`, `kds`, `portail-client`, `salle`) to include the `../_shared` directory.
  - Eliminated implicit `any` errors in `Login.tsx` and `useAuthStore.ts` by adding explicit types for props, selectors, and event handlers.
  - Corrected `handleSubmit` to use `React.FormEvent<HTMLFormElement>` for better DOM event typing.

## [2026-04-28] - 00:36
### Fixed
- Resolved widespread IDE "Module not found" and JSX type errors across all SPAs:
  - Corrected `@shared` path alias in `tsconfig.json` files to point to the correct `../_shared/` directory.
  - Restored missing `node_modules` by running `npm install` in each frontend application.

## [2026-04-28] - 00:35
### Changed
- UI Refinement: Massive +50% logo scale increase across all applications (Login: `w-72`, Dashboard: `w-48`) for high-impact brand presence.

## [2026-04-28] - 00:40
### Added
- Created `docs/brain/05_Resources/DEV_CREDENTIALS.md` containing the usernames and passwords for the 4 development test roles (`gerant_test`, `serveur_test`, `cuisinier_test`, `client_test`).
- Synchronized `FILE_MAP.md` to include the new credentials resource.

## [2026-04-28] - 00:30
### Changed
- Rewrote `DESIGN.md` to strictly follow the **ECO-FRESH** color palette defined in the Cahier des Charges (`#264653`, `#2A9D8F`, `#E9C46A`, `#F4A261`).
- Integrated **Emil Kowalski's** design engineering principles:
  - Enforced `scale(0.97)` press states on interactive elements.
  - Mandated explicit property transitions (no `transition: all`).
  - Implemented origin-aware popover logic and avoided `scale(0)` on entry animations.
  - Added a **Responsive & Fluid Strategy** (Mobile-first, fluid layouts, `clamp()` typography).
  - Enforced `44px` minimum touch targets and removed hover-only dependencies.
  - Added a **Design Audit** framework for high-end UI reviews.
- Synchronized project dashboard with the updated design system state. (Commit: `be2b5bb`)

## [2026-04-28] - 00:25
### Fixed
- Silenced TypeScript `baseUrl` deprecation warnings in all frontend `tsconfig.json` files (`back-office`, `kds`, `portail-client`, `salle`) by adding `ignoreDeprecations: "6.0"`.

## [2026-04-27] - 23:55
### Added
- Completed Execution of Phase 3: Auth API & Login Page.
- Implemented secure JWT backend with `djangorestframework-simplejwt`:
  - HttpOnly cookies for refresh tokens to prevent XSS.
  - Refresh token rotation and blacklisting for enhanced security.
  - Custom claims (role, username) in access tokens.
- Developed shared frontend auth infrastructure in `frontend/_shared/`:
  - Zustand `useAuthStore` for global authentication state.
  - Axios `axiosInstance` with automatic token refresh interceptors and request queueing.
- Created premium `Login.tsx` shared component with "Eco-Fresh" branding.
- Integrated auth flow into all 4 SPAs (`back-office`, `salle`, `kds`, `portail-client`) with role-based UI and session persistence.
- Verified entire flow with automated tests (4/4 passed) and manual E2E checks.

## [2026-04-27] - 23:45
### Added
- Generated execution plans for Phase 3: Auth API & Login Page.
- Created `03-01-PLAN.md`, `03-02-PLAN.md`, and `03-03-PLAN.md` covering backend JWT security, shared frontend infrastructure, and multi-SPA integration.

## [2026-04-27] - 23:35
### Added
- Completed technical research for Phase 3: Auth API & Login Page.
- Generated `.planning/phases/03-auth-api-login/03-RESEARCH.md` detailing implementation strategy for HttpOnly refresh tokens in SimpleJWT and race-condition-safe Axios interceptors.

## [2026-04-27] - 23:30
### Added
- Extracted and structured critical knowledge from `cahier_de_charge_tastify.md` into the Obsidian Brain.
- Populated `03_Architecture/` with `DATABASE_SCHEMA.md`, `API_DESIGN.md`, and `TECH_STACK.md`.
- Populated `04_Features/` with `RBAC_MODEL.md`, `BACKOFFICE_GERANT.md`, `KDS_CUISINE.md`, `SALLE_SERVEUR.md`, and `PORTAIL_CLIENT.md`.
- Populated `01_Inbox/IDEAS.md` and `05_Resources/LINKS.md`.
- Updated `Home.md` to link to the new knowledge base files.

## [2026-04-27] - 23:30
### Added
- Completed Execution of Phase 2: User Model & RBAC.
- Implemented custom `Utilisateur" model extending `AbstractUser` with a `Role` `TextChoices` ENUM (`GERANT`, `SERVEUR`, `CUISINIER`, `CLIENT`).
- Configured Django settings to use `users.Utilisateur` as the default auth model.
- Created robust DRF permission classes (`IsGerant`, `IsServeurOrGerant`, `IsCuisinierOrGerant`) enforcing a hierarchical RBAC.
- Implemented `seed_dev` management command to seamlessly create test users for all 4 roles.

## [2026-04-27] - 23:15
### Added
- Generated execution plans for Phase 2: User Model & RBAC.
- Created `02-01-PLAN.md`, `02-02-PLAN.md`, and `02-03-PLAN.md` covering model creation, RBAC logic, and dev seeding.

## [2026-04-27] - 23:00
### Added
- Completed technical research for Phase 2: User Model & RBAC.
- Generated `.planning/phases/02-user-model-rbac/02-RESEARCH.md` detailing implementation strategy for custom User model, TextChoices for roles, and DRF permissions.

## [2026-04-27] - 22:45
### Added
- Captured context for Phase 2: User Model & RBAC in `.planning/phases/02-user-model-rbac/02-CONTEXT.md`.
- Resolved hierarchical role structure and localized permission strategy.

## [2026-04-27] - 22:30
### Added
- Completed Phase 1: Project Skeleton.
- Verified all 8 Docker services are running and healthy.
- Applied initial Django database migrations.
- Verified Nginx routing for all services (API + 4 SPAs).

### Fixed
- Fixed backend `Dockerfile` by switching to `python:3.12-slim-bookworm` to resolve repository issues.

## [2026-04-27] - 22:00
### Added
- Created `nginx/nginx.conf` for reverse proxy and HMR support.
- Created `docker-compose.yml` for orchestrating all 7 services.
- Created `tests/smoke/test_services.sh` for automated infrastructure verification.

### Fixed
- Scaffolded missing Plan 04 infrastructure.

### Changed
- Updated `dashboard.html` to reflect Infrastructure Ready state.
- Updated `01-UAT.md` with progress on recovery plan.

## [2026-04-28] - 16:58
### Added
- Created `frontend/back-office/vitest.config.ts` so Vitest settings no longer force a runtime `vitest` import during `vite dev`.

### Fixed
- Updated `frontend/back-office/vite.config.ts` to use Vite's config entrypoint instead of `vitest/config`, resolving the back-office dev-server startup failure caused by `ERR_MODULE_NOT_FOUND: Cannot find package 'vitest'`.

### Changed
- Updated `dashboard.html` activity stream to reflect the current back-office dev-server fix instead of the stale "100% build success" note.
- Updated `docs/brain/00_Meta/FILE_MAP.md` and `README.md` to record the dedicated Vitest config in the back-office SPA.

### Validation
- Confirmed the Vitest package resolution error is gone when Vite loads `frontend/back-office/vite.config.ts`.
- `npm run build` still fails on a pre-existing TypeScript configuration issue: `tsconfig.json` uses an invalid `ignoreDeprecations` value, and sandboxed `vite` startup hits `esbuild` `spawn EPERM` after config load.

## [2026-04-27] - 21:00
### Added
- Created `.planning/phases/01-project-skeleton/01-UAT.md` for User Acceptance Testing.

### Fixed
- N/A

### Changed
- Updated `dashboard.html` to reflect Phase 1 UAT gap.

### Discovered
- **Critical Gap:** Phase 1 execution stopped before Plan 04 (Docker Compose & Nginx integration). `docker-compose.yml` and `nginx/` are missing. Recovery plan documented in `01-UAT.md`.

---

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to semantic tracking for development.

## [Unreleased]
### Added
- Initialize project structure.
- Add `GEMINI.md` defining core behavioral mandates and operational workflows.
- Add `DESIGN.md` outlining the design system, colors, typography, and UI anti-patterns.
- Add `dashboard.html` for real-time project status and health tracking.
- Add `docs/brain/` Obsidian architecture (Inbox, Journal, Architecture, Features, Resources).
- Add `FILE_MAP.md` and `Home.md` to establish knowledge base anchors.
- Add `CLAUDE.md` mirroring `GEMINI.md` rules for compatibility.
- Ingested `cahier_de_charge_tastify.md` specifications and created `PROJECT_OVERVIEW.md`.
- Initialized `.planning/` GSD framework with 6 architectural phases mapped from the specifications.
- Restructured GSD Roadmap into 35 hyper-granular, vertical-slice phases as per user instruction.

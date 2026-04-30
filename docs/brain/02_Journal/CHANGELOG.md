
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
- `npm run build` in `frontend/portail-client`: passed.
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
  - Corrected `@shared` alias path in `back-office/vite.config.ts` to allow successful production builds.
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
- Registered `/plats` route in `App.tsx` and updated `Sidebar.tsx` navigation.

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
- Implemented custom `Utilisateur` model extending `AbstractUser` with a `Role` `TextChoices` ENUM (`GERANT`, `SERVEUR`, `CUISINIER`, `CLIENT`).
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


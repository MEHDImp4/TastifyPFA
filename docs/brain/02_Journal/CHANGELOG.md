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

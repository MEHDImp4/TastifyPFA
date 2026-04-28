# Roadmap: TastifyPFA

## Overview

Tastify is an AI-powered ERP for Moroccan restaurants. This roadmap breaks down the development into highly decoupled, vertical-slice phases, ensuring that each feature (model, API logic, frontend UI) is built step-by-step.

## Phases

- [x] **Phase 1: Project Skeleton** - Docker, Django, React Vite, MySQL, Redis base config.
- [x] **Phase 2: User Model & RBAC** - AbstractUser, Roles (GERANT, SERVEUR, CUISINIER, CLIENT).
- [x] **Phase 3: Auth API & Login Page** - JWT setup, Login UI across all apps.
- [x] **Phase 4: Categories Model & API** - Database model and DRF endpoints.
- [x] **Phase 5: Categories Frontend** - Back-Office UI for managing categories.
- [x] **Phase 6: Plats Model & API** - Dishes, pricing, prep times.
- [x] **Phase 7: Plats Frontend** - Back-Office UI for managing dishes.
- [x] **Phase 8: Tables Model & API** - Table status, capacities. (completed 2026-04-28)
- [/] **Phase 9: Tables Map Frontend** - Interactive SVG/Canvas map in Salle UI.
- [ ] **Phase 10: Commandes Model** - DB constraints, lines, signals for `montant_total`.

- [ ] **Phase 11: Commandes REST API** - Endpoints for creating orders.
- [ ] **Phase 12: Order Taking Frontend** - Salle UI for selecting dishes and validating orders.
- [ ] **Phase 13: WebSocket Infrastructure** - Django Channels, Daphne, Redis Layer.
- [ ] **Phase 14: KDS Base Frontend** - Cuisine SPA base, WebSocket connection.
- [ ] **Phase 15: KDS Orchestrator Logic** - Backend calculation of `heure_lancement`.
- [ ] **Phase 16: Order Push to KDS** - Real-time push from Salle to Cuisine.
- [ ] **Phase 17: Order Status Updates** - Cuisine marks dishes as ready -> real-time push to Salle.
- [ ] **Phase 18: Ingredients & Stock Model** - Alerts, thresholds.
- [ ] **Phase 19: Stock Management Frontend** - Back-Office UI for entering stock.
- [ ] **Phase 20: Automated Deductions** - Django signals linking orders to stock decrementation.
- [ ] **Phase 21: Employees (HR) Model & API** - Employee profiles linked to Users.
- [ ] **Phase 22: HR Frontend** - Back-office HR UI.
- [ ] **Phase 23: Reservations Model & API** - Availability logic.
- [ ] **Phase 24: Reservations Client UI** - Portail Client booking flow.
- [ ] **Phase 25: Reservations Admin UI** - Validation via Back-Office/Salle.
- [ ] **Phase 26: QR Payment & Split Bill Logic** - Backend calculation for equal/individual splits.
- [ ] **Phase 27: Encaissement UI** - Salle UI modal and Client QR landing page.
- [ ] **Phase 28: Celery Infrastructure & Check-list Model** - Async workers, beat schedules.
- [ ] **Phase 29: Check-list UI & Cron Job** - Back-Office daily check-list execution.
- [ ] **Phase 30: AI Recommender System** - scikit-learn model, API, and Portail Client integration.
- [ ] **Phase 31: AI Sentiment Analysis** - HuggingFace BERT integration for reviews.
- [ ] **Phase 32: Back-Office Dashboard KPIs** - Real-time stats and Recharts integration.
- [ ] **Phase 33: Loyalty Program** - Points logic, Bronze/Silver/Gold tiers in Client UI.
- [ ] **Phase 34: PWA Offline Capabilities** - Service Workers for Salle & KDS.
- [ ] **Phase 35: Load Testing & Optimization** - Locust scripts, Nginx proxy fine-tuning.

## Phase Details

### Phase 1: Project Skeleton
**Goal**: Establish Docker, Django, React Vite, MySQL, Redis.
**Depends on**: Nothing
**Success Criteria**: 1. Services start via Docker.
**Plans**: TBD

### Phase 2: User Model & RBAC
**Goal**: Custom User model with roles.
**Depends on**: Phase 1
**Success Criteria**: 1. `GERANT`, `SERVEUR`, `CUISINIER`, `CLIENT` roles exist.
**Plans**:
- [x] 02-01-PLAN.md — Custom User model with Role field.
- [x] 02-02-PLAN.md — RBAC logic and DRF permissions.
- [x] 02-03-PLAN.md — Dev seeding for all roles.

### Phase 3: Auth API & Login Page
**Goal**: JWT endpoints and Login UI.
**Depends on**: Phase 2
**Success Criteria**: 1. Users can log in and receive JWT.
**Plans**:
- [x] 03-01-PLAN.md — Backend JWT & Secure Endpoints.
- [x] 03-02-PLAN.md — Shared Frontend Auth Infrastructure.
- [x] 03-03-PLAN.md — Multi-SPA Integration & Verification.

### Phase 4: Categories Model & API
**Goal**: Category DB and REST API.
**Depends on**: Phase 3
**Success Criteria**: 1. API allows CRUD on categories with RBAC and soft-delete.
**Plans**: 2 plans
- [x] 04-01-PLAN.md — menu app scaffold, Categorie model, soft delete, media config.
- [x] 04-02-PLAN.md — CategorieSerializer, CategorieViewSet (RBAC + visibility), URL wiring, tests.

### Phase 5: Categories Frontend
**Goal**: Back-office UI for categories.
**Depends on**: Phase 4
**Success Criteria**: 1. Manager can visually add/edit categories.
**Plans**:
- [x] 05-01-PLAN.md — AppShell and Routing setup.
- [x] 05-02-PLAN.md — Categories CRUD UI implementation.

### Phase 6: Plats Model & API
**Goal**: Dish DB and REST API.
**Depends on**: Phase 4
**Success Criteria**: 1. API allows CRUD on dishes with RBAC and soft-delete.
**Requirements**: [PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05]
**Plans**: 3 plans
- [x] 06-01-PLAN.md — Plat model definition, associations, and migrations.
- [x] 06-02-PLAN.md — PlatSerializer, PlatViewSet (RBAC + visibility), URL registration.
- [x] 06-03-PLAN.md — Dev seeding command and integration tests.

### Phase 7: Plats Frontend
**Goal**: Back-office UI for dishes.
**Depends on**: Phase 6
**Success Criteria**: 1. Manager can visually manage dishes.
**Plans**:
- [x] 07-01-PLAN.md — Route wiring, typed contracts, page scaffold, category filter state.
- [x] 07-02-PLAN.md — Desktop/mobile list renderers, inline statuses, row/card actions.
- [x] 07-03-PLAN.md — Drawer form, strict validation, category-aware create/edit, empty-state flow.

### Phase 8: Tables Model & API
**Goal**: Table DB and REST API.
**Depends on**: Phase 3
**Success Criteria**: 1. Tables state is queryable.
**Plans**:
- [x] 08-01-PLAN.md — Table app scaffold, model, migration, soft-delete tests.
- [x] 08-02-PLAN.md — TableSerializer, TableViewSet (RBAC + visibility), URL registration.
- [x] 08-03-PLAN.md — Seed command and integration tests.

### Phase 9: Tables Map Frontend
**Goal**: Visual table map in Salle UI.
**Depends on**: Phase 8
**Success Criteria**: 1. Waiters see tables map.
**Plans**:
- [x] 09-01-PLAN.md — Table map foundation with SVG visualization, status colors, fallback grid, and polling.
- [ ] 09-02-PLAN.md — GERANT-only map editor with dynamic shapes, 20px snapping, collision feedback, batch save, and Salle tests.

### Phase 10: Commandes Model
**Goal**: Order database tables and constraints.
**Depends on**: Phase 6, Phase 8
**Success Criteria**: 1. Signals calculate `montant_total`.
**Plans**: TBD

... [rest of file remains unchanged] ...

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 35

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Skeleton | 3/3 | Completed | 2026-04-26 |
| 2. User Model & RBAC | 3/3 | Completed | 2026-04-27 |
| 3. Auth API & Login Page | 3/3 | Completed | 2026-04-28 |
| 4. Categories Model & API | 2/2 | Completed | 2026-04-28 |
| 5. Categories Frontend | 2/2 | Completed | 2026-04-28 |
| 6. Plats Model & API | 3/3 | Completed | 2026-04-28 |
| 7. Plats Frontend | 3/3 | Completed | 2026-04-28 |
| 8. Tables Model & API | 3/3 | Complete    | 2026-04-28 |
...

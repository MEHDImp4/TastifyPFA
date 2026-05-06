# Roadmap: TastifyPFA

## Overview

Tastify is an AI-powered ERP for Moroccan restaurants. This roadmap breaks down the development into highly decoupled, vertical-slice phases, ensuring that each feature (model, API logic, frontend UI) is built step-by-step.

## Phases

- [x] **Phase 1: Project Skeleton** - Docker, Django, React Vite, MySQL, Redis base config. Direct-port routing amendment completed 2026-04-30; runtime simplified to staff and client frontends.
- [x] **Phase 2: User Model & RBAC** - AbstractUser, Roles (GERANT, SERVEUR, CUISINIER, CLIENT).
- [x] **Phase 3: Auth API & Login Page** - JWT setup, Login UI across all apps.
- [x] **Phase 4: Categories Model & API** - Database model and DRF endpoints.
- [x] **Phase 5: Categories Frontend** - Back-Office UI for managing categories.
- [x] **Phase 6: Plats Model & API** - Dishes, pricing, prep times.
- [x] **Phase 7: Plats Frontend** - Back-Office UI for managing dishes.
- [x] **Phase 8: Tables Model & API** - Table status, capacities. (completed 2026-04-28)
- [x] **Phase 9: Tables Map Frontend** - Interactive SVG/Canvas map in staff UI. (completed 2026-04-28)
- [x] **Phase 10: Commandes Model** - DB constraints, lines, signals for `montant_total`. (completed 2026-04-29)
- [x] **Phase 11: Commandes REST API** - Endpoints for creating orders. (completed 2026-04-30)
- [x] **Phase 12: Order Taking Frontend** - Staff UI for selecting dishes and validating orders. (completed 2026-04-30)
- [x] **Phase 13: WebSocket Infrastructure** - Django Channels, Daphne, Redis Layer. (completed 2026-05-01)
- [x] **Phase 14: KDS Base Frontend** - Cuisine view inside the staff SPA, WebSocket connection. (completed 2026-05-01)
- [x] **Phase 15: KDS Orchestrator Logic** - Backend calculation of `heure_lancement`. Manual UAT passed; websocket frames and orchestration stability confirmed (completed 2026-05-03).
- [x] **Phase 16: Order Push to KDS** - Real-time push from Salle to Cuisine. (completed 2026-05-04)
- [x] **Phase 17: Order Status Updates** - Cuisine marks dishes as ready -> real-time push to Salle. (completed 2026-05-04)
- [x] **Phase 18: Ingredients & Stock Model** - Alerts, thresholds. (completed 2026-05-05)
- [x] **Phase 19: Stock Management Frontend** - Back-Office UI for entering stock. (completed 2026-05-05)
- [x] **Phase 20: Automated Deductions** - Service-based stock deduction triggered by JIT orchestration task. (completed 2026-05-05)
- [x] **Phase 21: Employees (HR) Model & API** - Employee profiles linked to Users. (completed 2026-05-05)
- [x] **Phase 22: HR Frontend** - Back-office HR UI. (completed 2026-05-05)
- [x] **Phase 23: Reservations Model & API** - Availability logic, RBAC, client ownership, dynamic table status. All 3 plans complete, fully verified 6/6 (completed 2026-05-06).
- [x] **Phase 24: Reservations Client UI** - Portail Client booking flow. Three plans complete, backend availability endpoint wired, wizard verified with 16 frontend tests plus backend availability coverage (completed 2026-05-06).
- [x] **Phase 25: Reservations Admin UI** - Validation via Back-Office/Salle.
- [ ] **Phase 26: QR Payment & Split Bill Logic** - Backend calculation for equal/individual splits.
- [ ] **Phase 27: Encaissement UI** - Salle UI modal and Client QR landing page.
- [ ] **Phase 28: Celery Infrastructure & Check-list Model** - Async workers, beat schedules.
- [ ] **Phase 29: Check-list UI & Cron Job** - Back-Office daily check-list execution.
- [ ] **Phase 30: AI Recommender System** - scikit-learn model, API, and Portail Client integration.
- [ ] **Phase 31: AI Sentiment Analysis** - HuggingFace BERT integration for reviews.
- [ ] **Phase 32: Back-Office Dashboard KPIs** - Real-time stats and Recharts integration.
- [ ] **Phase 33: Loyalty Program** - Points logic, Bronze/Silver/Gold tiers in Client UI.
- [ ] **Phase 34: PWA Offline Capabilities** - Service Workers for Salle & KDS.
- [ ] **Phase 35: KDS Advanced Operations** - UC19 (Modification rapide) and UC20_bis (Signalement rupture immédiate).
- [ ] **Phase 36: Click & Collect E-commerce** - UC24 (Commande en ligne, panier, validation retrait).
- [ ] **Phase 37: Staff Scheduling & Recruitment** - UC05 (Plannings horaires, gestion des offres d'emploi).
- [ ] **Phase 38: AI Weather-Aware Stock Forecasting** - UC29 (Integration API Météo + Modèle de prédiction historique).
- [ ] **Phase 39: Multilingual BERT Expansion** - UC38 optimization for Arabic/French sentiment nuances.
- [ ] **Phase 40: Load Testing & Optimization** - Locust scripts, Nginx proxy fine-tuning.

## Phase Details

### Phase 1: Project Skeleton
**Goal**: Establish Docker, Django, React Vite, MySQL, Redis.
**Depends on**: Nothing
**Success Criteria**: 1. Services start via Docker.

### Phase 2: User Model & RBAC
**Goal**: Custom User model with roles.
**Depends on**: Phase 1
**Success Criteria**: 1. `GERANT`, `SERVEUR`, `CUISINIER`, `CLIENT` roles exist.

### Phase 3: Auth API & Login Page
**Goal**: JWT endpoints and Login UI.
**Depends on**: Phase 2
**Success Criteria**: 1. Users can log in and receive JWT.

### Phase 4: Categories Model & API
**Goal**: Category DB and REST API.
**Depends on**: Phase 3
**Success Criteria**: 1. API allows CRUD on categories with RBAC and soft-delete. 2. Premium images added for core categories.

### Phase 5: Categories Frontend
**Goal**: Back-office UI for categories.
**Depends on**: Phase 4
**Success Criteria**: 1. Manager can visually add/edit categories.

### Phase 6: Plats Model & API
**Goal**: Dish DB and REST API.
**Depends on**: Phase 4
**Success Criteria**: 1. API allows CRUD on dishes with RBAC and soft-delete.

### Phase 7: Plats Frontend
**Goal**: Back-office UI for dishes.
**Depends on**: Phase 6
**Success Criteria**: 1. Manager can visually manage dishes.

### Phase 8: Tables Model & API
**Goal**: Table DB and REST API.
**Depends on**: Phase 3
**Success Criteria**: 1. Tables state is queryable.

### Phase 9: Tables Map Frontend
**Goal**: Visual table map in staff UI.
**Depends on**: Phase 8
**Success Criteria**: 1. Waiters see tables map.

### Phase 10: Commandes Model
**Goal**: Order database tables and constraints.
**Depends on**: Phase 6, Phase 8
**Success Criteria**: 1. Signals calculate `montant_total`.

### Phase 11: Commandes REST API
**Goal**: REST endpoints for order management.
**Depends on**: Phase 10
**Success Criteria**: 1. Nested creation works. 2. Table status syncs automatically.

### Phase 12: Order Taking Frontend
**Goal**: Build the interactive interface in the staff UI for selecting dishes and validating orders.
**Depends on**: Phase 11
**Success Criteria**: 1. Servers can select items from the menu, review the cart, and submit orders for specific tables.

### Phase 13: WebSocket Infrastructure
**Goal**: Establish a reliable, real-time communication layer using Django Channels and Redis to push updates from the backend to the frontend SPAs.
**Depends on**: Phase 12
**Success Criteria**: 1. `JWTAuthMiddleware` authenticates staff WebSocket connections. 2. `StaffConsumer` manages `staff_group` membership. 3. Staff frontend establishes a persistent `/ws/staff/` connection.

### Phase 14: KDS Base Frontend
**Goal**: Cuisine view inside the staff SPA, WebSocket connection.
**Depends on**: Phase 13
**Success Criteria**: 1. Cuisinier sees real-time orders in a horizontal rail interface.

### Phase 15: KDS Orchestrator Logic
**Goal**: Implement backend JIT orchestration — calculate `heure_lancement` per dish line so all items in an order finish simultaneously. Celery ETA tasks schedule launches; WebSocket broadcasts notify the KDS frontend.
**Depends on**: Phase 14
**Success Criteria**: 1. Celery worker service defined in `docker-compose.yml`. 2. `CommandeLigne` gains `heure_lancement`, `heure_fin_estimee`, `temps_preparation_snapshot`, `celery_task_id` fields with migration. 3. `KdsOrchestrator` correctly calculates JIT timing for all lines. 4. Existing pending Celery tasks are revoked and rescheduled on order update. 5. `line_launched` WebSocket event is broadcast to the `cuisine` group at the correct ETA.

### Phase 16: Order Push to KDS
**Goal**: Implement the "Manual Fire" workflow — a server explicitly sends an order to the kitchen via PATCH (`EN_COURS → EN_CUISINE`), triggering JIT orchestration only on that transition, filtering the KDS to show only fired orders, and delivering audio+visual feedback on ticket arrival.
**Depends on**: Phase 15
**Success Criteria**: 1. PATCH `/commandes/{id}/` with `{"statut":"EN_CUISINE"}` succeeds for order owner and triggers `KdsOrchestrator`. 2. CUISINIER queryset strictly excludes `EN_COURS` (only `EN_CUISINE | PRETE` visible). 3. "Envoyer en Cuisine" button renders on `OrderingPage` when order is `EN_COURS`. 4. KDS plays audio bell on new ticket arrival via WebSocket. 5. `TicketCard` shows green glow pulse for 10 seconds on new ticket arrival, then stops.

### Phase 21: Employees (HR) Model & API
**Goal**: Employee profiles linked to Users.
**Depends on**: Phase 2
**Success Criteria**: 1. Employee CRUD with Gerant-only access. 2. Automated user creation. 3. Soft delete.

### Phase 25: Reservations Admin UI
**Goal**: Provide staff with tools to manage reservations, including listing, creating, confirming, and tracking upcoming bookings on the table map.
**Depends on**: Phase 23, Phase 24
**Success Criteria**: 1. Staff can view a paginated list of reservations filtered by date and status. 2. Staff can create a manual reservation and assign a table. 3. The Table Map info panel shows the "Next Reservation" for a selected table. 4. WebSocket notifications broadcast new client reservations to the staff dashboard.

Plans:
- [x] 25-01-PLAN.md — Backend Enriched API & Real-time Signals. (completed)
- [x] 25-02-PLAN.md — Back-Office Reservations Management. (completed)
- [x] 25-03-PLAN.md — Salle/Map Integration & Status Lifecycle. (completed)

### Phase 26: QR Payment & Split Bill Logic
**Goal**: Provide the backend payment domain for QR-based checkout, including equal and item/fraction splits, token-authorized client payment access, and lifecycle completion that frees the table once the order is fully paid.
**Depends on**: Phase 11, Phase 12
**Success Criteria**: 1. `apps.paiements` models and migrations land cleanly. 2. The backend rejects ambiguous or stale payable sessions. 3. Equal and item/fraction split flows validate and persist without double-payment. 4. Fully paid orders transition to `PAYEE` and existing table sync frees the table.

Plans:
- [ ] 26-01-PLAN.md — Payment Domain, Payable Session Resolution & Lifecycle Integrity.
- [ ] 26-02-PLAN.md — QR Token Authorization & Payment API Contracts.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 40

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
| 9. Tables Map Frontend | 2/2 | Complete | 2026-04-28 |
| 10. Commandes Model | 3/3 | Complete | 2026-04-29 |
| 11. Commandes REST API | 3/3 | Complete | 2026-04-30 |
| 12. Order Taking Frontend | 3/3 | Complete | 2026-04-30 |
| 13. WebSocket Infrastructure | 3/3 | Completed | 2026-05-01 |
| 14. KDS Base Frontend | 3/3 | Complete | 2026-05-01 |
| 15. KDS Orchestrator Logic | 3/3 | Completed | 2026-05-03 |
| 16. Order Push to KDS | 8/8 | Completed | 2026-05-04 |
| 17. Order Status Updates | 1/1 | Completed | 2026-05-04 |
| 18. Ingredients & Stock Model | 4/4 | Complete | 2026-05-05 |
| 19. Stock Management Frontend | 4/4 | Complete | 2026-05-05 |
| 20. Automated Deductions | 1/1 | Complete | 2026-05-05 |
| 21. Employees (HR) Model & API | 1/1 | Completed | 2026-05-05 |
| 22. HR Frontend | 1/1 | Completed | 2026-05-05 |
| 23. Reservations Model & API | 3/3 | Completed | 2026-05-06 |
| 24. Reservations Client UI | 3/3 | Completed | 2026-05-06 |
| 25. Reservations Admin UI | 3/3 | Completed | 2026-05-06 |
| 26. QR Payment & Split Bill Logic | 0/2 | Planned | — |



### Phase 20: Automated Deductions
**Goal**: Implement service-based stock deduction triggered by the JIT orchestration task (launch_item_task). Ensures ingredients are subtracted from inventory only when production begins.
**Depends on**: Phase 15, Phase 18
**Success Criteria**: 1. Stock decreases correctly per plat recipe on line launch. 2. Race conditions prevented via atomic row locking. 3. Low-stock alerts broadcast via WebSockets.

Plans:
- [x] 20-01-PLAN.md — Atomic stock deduction service and task integration. (completed 2026-05-05)
- [x] 20-UAT.md — Automated and integration test verification. (passed 2026-05-05)

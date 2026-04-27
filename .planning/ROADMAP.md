# Roadmap: TastifyPFA

## Overview

Tastify is an AI-powered ERP for Moroccan restaurants. This roadmap breaks down the development into highly decoupled, vertical-slice phases, ensuring that each feature (model, API logic, frontend UI) is built step-by-step.

## Phases

- [x] **Phase 1: Project Skeleton** - Docker, Django, React Vite, MySQL, Redis base config.
- [ ] **Phase 2: User Model & RBAC** [CONTEXT] - AbstractUser, Roles (GERANT, SERVEUR, CUISINIER, CLIENT).
- [ ] **Phase 3: Auth API & Login Page** - JWT setup, Login UI across all apps.
- [ ] **Phase 4: Categories Model & API** - Database model and DRF endpoints.
- [ ] **Phase 5: Categories Frontend** - Back-Office UI for managing categories.
- [ ] **Phase 6: Plats Model & API** - Dishes, pricing, prep times.
- [ ] **Phase 7: Plats Frontend** - Back-Office UI for managing dishes.
- [ ] **Phase 8: Tables Model & API** - Table status, capacities.
- [ ] **Phase 9: Tables Map Frontend** - Interactive SVG/Canvas map in Salle UI.
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
- [ ] **Phase 22: HR Frontend** - Back-Office UI for employee management.
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
**Plans**: TBD

### Phase 3: Auth API & Login Page
**Goal**: JWT endpoints and Login UI.
**Depends on**: Phase 2
**Success Criteria**: 1. Users can log in and receive JWT.
**Plans**: TBD

### Phase 4: Categories Model & API
**Goal**: Category DB and REST API.
**Depends on**: Phase 3
**Success Criteria**: 1. API allows CRUD on categories.
**Plans**: TBD

### Phase 5: Categories Frontend
**Goal**: Back-office UI for categories.
**Depends on**: Phase 4
**Success Criteria**: 1. Manager can visually add/edit categories.
**Plans**: TBD

### Phase 6: Plats Model & API
**Goal**: Dish DB and REST API.
**Depends on**: Phase 4
**Success Criteria**: 1. API allows CRUD on dishes.
**Plans**: TBD

### Phase 7: Plats Frontend
**Goal**: Back-office UI for dishes.
**Depends on**: Phase 6
**Success Criteria**: 1. Manager can visually manage dishes.
**Plans**: TBD

### Phase 8: Tables Model & API
**Goal**: Table DB and REST API.
**Depends on**: Phase 3
**Success Criteria**: 1. Tables state is queryable.
**Plans**: TBD

### Phase 9: Tables Map Frontend
**Goal**: Visual table map in Salle UI.
**Depends on**: Phase 8
**Success Criteria**: 1. Waiters see tables map.
**Plans**: TBD

### Phase 10: Commandes Model
**Goal**: Order database tables and constraints.
**Depends on**: Phase 6, Phase 8
**Success Criteria**: 1. Signals calculate `montant_total`.
**Plans**: TBD

### Phase 11: Commandes REST API
**Goal**: API to create and read orders.
**Depends on**: Phase 10
**Success Criteria**: 1. Waiters can create orders via POST.
**Plans**: TBD

### Phase 12: Order Taking Frontend
**Goal**: UI for waiters to input orders.
**Depends on**: Phase 11
**Success Criteria**: 1. Waiter can select dishes and validate order.
**Plans**: TBD

### Phase 13: WebSocket Infrastructure
**Goal**: Daphne and Django Channels.
**Depends on**: Phase 1
**Success Criteria**: 1. WS connection successful.
**Plans**: TBD

### Phase 14: KDS Base Frontend
**Goal**: Kitchen display base UI.
**Depends on**: Phase 13
**Success Criteria**: 1. Kitchen app connects to WS.
**Plans**: TBD

### Phase 15: KDS Orchestrator Logic
**Goal**: `heure_lancement` calculation.
**Depends on**: Phase 10
**Success Criteria**: 1. Prep times synchronized for simultaneous serving.
**Plans**: TBD

### Phase 16: Order Push to KDS
**Goal**: WS push from order creation to kitchen.
**Depends on**: Phase 14, Phase 15
**Success Criteria**: 1. New orders appear live on KDS.
**Plans**: TBD

### Phase 17: Order Status Updates
**Goal**: Status loop back to Salle.
**Depends on**: Phase 16
**Success Criteria**: 1. Cook marks dish ready, waiter notified live.
**Plans**: TBD

### Phase 18: Ingredients & Stock Model
**Goal**: Stock DB schema.
**Depends on**: Phase 1
**Success Criteria**: 1. Threshold logic exists.
**Plans**: TBD

### Phase 19: Stock Management Frontend
**Goal**: Back-Office Stock UI.
**Depends on**: Phase 18
**Success Criteria**: 1. Manager can do stock entries.
**Plans**: TBD

### Phase 20: Automated Deductions
**Goal**: Orders deduct stock.
**Depends on**: Phase 17, Phase 18
**Success Criteria**: 1. Dishes served decrement stock automatically.
**Plans**: TBD

### Phase 21: Employees (HR) Model & API
**Goal**: HR profiles and endpoints.
**Depends on**: Phase 2
**Success Criteria**: 1. API serves employees list.
**Plans**: TBD

### Phase 22: HR Frontend
**Goal**: Back-office HR UI.
**Depends on**: Phase 21
**Success Criteria**: 1. Manager can manage employee records.
**Plans**: TBD

### Phase 23: Reservations Model & API
**Goal**: Booking logic.
**Depends on**: Phase 8
**Success Criteria**: 1. API prevents overbooking tables.
**Plans**: TBD

### Phase 24: Reservations Client UI
**Goal**: Portal for customers.
**Depends on**: Phase 23
**Success Criteria**: 1. Client can book a table online.
**Plans**: TBD

### Phase 25: Reservations Admin UI
**Goal**: Back-office/Salle validation.
**Depends on**: Phase 23
**Success Criteria**: 1. Waiter/Manager approves bookings.
**Plans**: TBD

### Phase 26: QR Payment & Split Bill Logic
**Goal**: Complex payment endpoints.
**Depends on**: Phase 11
**Success Criteria**: 1. Split bill calculates correctly.
**Plans**: TBD

### Phase 27: Encaissement UI
**Goal**: Payment interfaces.
**Depends on**: Phase 26
**Success Criteria**: 1. Client scans QR to see bill.
**Plans**: TBD

### Phase 28: Celery Infrastructure & Check-list Model
**Goal**: Background tasks.
**Depends on**: Phase 1
**Success Criteria**: 1. Celery workers process background jobs.
**Plans**: TBD

### Phase 29: Check-list UI & Cron Job
**Goal**: Daily checklists for managers.
**Depends on**: Phase 28
**Success Criteria**: 1. Checklist generates automatically.
**Plans**: TBD

### Phase 30: AI Recommender System
**Goal**: Collaborative filtering API & UI.
**Depends on**: Phase 11
**Success Criteria**: 1. Client sees dish recommendations.
**Plans**: TBD

### Phase 31: AI Sentiment Analysis
**Goal**: BERT model evaluating reviews.
**Depends on**: Phase 28
**Success Criteria**: 1. Reviews are scored positive/negative.
**Plans**: TBD

### Phase 32: Back-Office Dashboard KPIs
**Goal**: Dashboard UI metrics.
**Depends on**: Phase 11
**Success Criteria**: 1. Recharts renders CA over 7 days.
**Plans**: TBD

### Phase 33: Loyalty Program
**Goal**: Tiers and points logic.
**Depends on**: Phase 11
**Success Criteria**: 1. Clients earn points on payment.
**Plans**: TBD

### Phase 34: PWA Offline Capabilities
**Goal**: Service workers.
**Depends on**: Phase 12, Phase 14
**Success Criteria**: 1. Salle and KDS installable as apps.
**Plans**: TBD

### Phase 35: Load Testing & Optimization
**Goal**: Locust scripts and fine-tuning.
**Depends on**: Phase 34
**Success Criteria**: 1. P95 latency < 300ms.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 35

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Skeleton | 0/0 | Not started | - |
| 2. User Model & RBAC | 0/0 | Not started | - |
| 3. Auth API & Login Page | 0/0 | Not started | - |
| 4. Categories Model & API | 0/0 | Not started | - |
| 5. Categories Frontend | 0/0 | Not started | - |
| 6. Plats Model & API | 0/0 | Not started | - |
| 7. Plats Frontend | 0/0 | Not started | - |
| 8. Tables Model & API | 0/0 | Not started | - |
| 9. Tables Map Frontend | 0/0 | Not started | - |
| 10. Commandes Model | 0/0 | Not started | - |
| 11. Commandes REST API | 0/0 | Not started | - |
| 12. Order Taking Frontend | 0/0 | Not started | - |
| 13. WebSocket Infrastructure | 0/0 | Not started | - |
| 14. KDS Base Frontend | 0/0 | Not started | - |
| 15. KDS Orchestrator Logic | 0/0 | Not started | - |
| 16. Order Push to KDS | 0/0 | Not started | - |
| 17. Order Status Updates | 0/0 | Not started | - |
| 18. Ingredients & Stock Model | 0/0 | Not started | - |
| 19. Stock Management Frontend | 0/0 | Not started | - |
| 20. Automated Deductions | 0/0 | Not started | - |
| 21. Employees (HR) Model & API | 0/0 | Not started | - |
| 22. HR Frontend | 0/0 | Not started | - |
| 23. Reservations Model & API | 0/0 | Not started | - |
| 24. Reservations Client UI | 0/0 | Not started | - |
| 25. Reservations Admin UI | 0/0 | Not started | - |
| 26. QR Payment & Split Bill Logic | 0/0 | Not started | - |
| 27. Encaissement UI | 0/0 | Not started | - |
| 28. Celery Infrastructure & Check-list Model | 0/0 | Not started | - |
| 29. Check-list UI & Cron Job | 0/0 | Not started | - |
| 30. AI Recommender System | 0/0 | Not started | - |
| 31. AI Sentiment Analysis | 0/0 | Not started | - |
| 32. Back-Office Dashboard KPIs | 0/0 | Not started | - |
| 33. Loyalty Program | 0/0 | Not started | - |
| 34. PWA Offline Capabilities | 0/0 | Not started | - |
| 35. Load Testing & Optimization | 0/0 | Not started | - |

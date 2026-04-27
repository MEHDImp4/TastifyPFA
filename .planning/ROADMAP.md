# Roadmap: TastifyPFA

## Overview

Tastify is a full-stack, AI-powered ERP designed for Moroccan restaurants, enabling management, order taking, kitchen synchronization (KDS), and customer engagement. The journey spans from foundational dockerization to final load testing and deployment.

## Phases

- [ ] **Phase 1: Setup Infrastructure** - Docker, MySQL, Redis, Django structure.
- [ ] **Phase 2: Core Backend & Auth** - Django models, JWT, RBAC, Menu and Auth endpoints.
- [ ] **Phase 3: Advanced Backend & WebSockets** - Orders (REST + WS), KDS orchestrator, Stocks, HR, Reservations.
- [ ] **Phase 4: Frontend SPA Implementation** - Back-Office, Salle, KDS, Portail Client React interfaces.
- [ ] **Phase 5: AI & Payment Integration** - Recommender system, Sentiment analysis, Split Bill, Loyalty, PWA.
- [ ] **Phase 6: Finalization & Deployment** - Load testing, optimization, API docs, production deployment.

## Phase Details

### Phase 1: Setup Infrastructure
**Goal**: Establish the base dockerized environment and Django skeleton.
**Depends on**: Nothing
**Requirements**: Sprint 0 definitions
**Success Criteria** (what must be TRUE):
  1. `docker-compose up` runs MySQL, Redis, and Django successfully.
  2. The Django skeleton is created with `settings.py` configured for environment variables.
**Plans**: TBD

Plans:

### Phase 2: Core Backend & Auth
**Goal**: Build the database schema, RBAC, JWT auth, and core Menu API.
**Depends on**: Phase 1
**Requirements**: Sprint 1 definitions
**Success Criteria** (what must be TRUE):
  1. Users can authenticate via JWT and receive role-based access tokens.
  2. The Gérant can CRUD menu categories and items.
  3. RBAC permissions block unauthorized endpoints.
**Plans**: TBD

Plans:

### Phase 3: Advanced Backend & WebSockets
**Goal**: Implement real-time websocket communication and complex business logic.
**Depends on**: Phase 2
**Requirements**: Sprint 2 definitions
**Success Criteria** (what must be TRUE):
  1. WebSockets successfully push new orders to the KDS group.
  2. KDS Orchestrator calculates `heure_lancement` correctly for staggered dishes.
  3. Stock ingredients deduct based on order status signals.
**Plans**: TBD

Plans:

### Phase 4: Frontend SPA Implementation
**Goal**: Develop the four decoupled React Vite SPAs.
**Depends on**: Phase 3
**Requirements**: Sprint 3 definitions
**Success Criteria** (what must be TRUE):
  1. Gérant can view the dashboard and manage stock alerts visually.
  2. KDS displays live orders via WebSocket without manual page refresh.
  3. Salle can interact with a table map and place orders.
  4. Client portal allows online table reservations.
**Plans**: TBD

Plans:

### Phase 5: AI & Payment Integration
**Goal**: Add smart recommendations, sentiment analysis, and advanced payment handling.
**Depends on**: Phase 4
**Requirements**: Sprint 4 definitions
**Success Criteria** (what must be TRUE):
  1. Client portal recommends top 5 dishes based on the scikit-learn model.
  2. Reviews are analyzed by BERT for positive/negative sentiment.
  3. QR code endpoints return correct Split Bill values.
**Plans**: TBD

Plans:

### Phase 6: Finalization & Deployment
**Goal**: Polish, test, and deploy to production.
**Depends on**: Phase 5
**Requirements**: Sprint 5 definitions
**Success Criteria** (what must be TRUE):
  1. Unit tests and RBAC tests pass with >=80% coverage.
  2. Locust load testing shows < 300ms P95 latency.
  3. Application is deployed and served behind Nginx reverse proxy.
**Plans**: TBD

Plans:

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Setup Infrastructure | 0/0 | Not started | - |
| 2. Core Backend & Auth | 0/0 | Not started | - |
| 3. Advanced Backend & WebSockets | 0/0 | Not started | - |
| 4. Frontend SPA Implementation | 0/0 | Not started | - |
| 5. AI & Payment Integration | 0/0 | Not started | - |
| 6. Finalization & Deployment | 0/0 | Not started | - |

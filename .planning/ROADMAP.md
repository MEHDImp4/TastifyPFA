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
- [x_] **Phase 20: Automated Deductions** - Service-based stock deduction triggered by JIT orchestration task. (completed 2026-05-05)
- [x] **Phase 21: Employees (HR) Model & API** - Employee profiles linked to Users. (completed 2026-05-05)
- [x] **Phase 22: HR Frontend** - Back-office HR UI. (completed 2026-05-05)
- [x] **Phase 23: Reservations Model & API** - Availability logic, RBAC, client ownership, dynamic table status. All 3 plans complete, fully verified 6/6 (completed 2026-05-06).
- [x] **Phase 24: Reservations Client UI** - Portail Client booking flow. Three plans complete, backend availability endpoint wired, wizard verified with 16 frontend tests plus backend availability coverage (completed 2026-05-06).
- [x] **Phase 25: Reservations Admin UI** - Validation via Back-Office/Salle.
- [x] **Phase 26: QR Payment & Split Bill Logic** - Backend calculation for equal/individual splits.
- [x] **Phase 27: Encaissement UI** - Salle UI modal and Client QR landing page.
- [x] **Phase 28: Celery Infrastructure** - Async workers and beat schedules. (completed 2026-05-07)
- [x] **Phase 29: AI Recommender System** - scikit-learn model, API, and Portail Client integration. (completed 2026-05-08)
- [x] **Phase 30: AI Sentiment Analysis** - HuggingFace BERT integration for reviews. (completed 2026-05-08)
- [x] **Phase 31: Back-Office Dashboard KPIs** - Real-time stats and Recharts integration. (completed 2026-05-08)
- [x] **Phase 32: Loyalty Program** - Points logic, Bronze/Silver/Gold tiers in Client UI. (completed 2026-05-08)
- [ ] **Phase 33: PWA Offline Capabilities** - Service Workers for Salle & KDS.
- [ ] **Phase 34: KDS Advanced Operations** - UC19 (Modification rapide) and UC20_bis (Signalement rupture immédiate).
- [ ] **Phase 35: Click & Collect E-commerce** - UC24 (Commande en ligne, panier, validation retrait).
- [ ] **Phase 36: Staff Scheduling & Recruitment** - UC05 (Plannings horaires, gestion des offres d'emploi).
- [ ] **Phase 37: AI Weather-Aware Stock Forecasting** - UC29 (Integration API Météo + Modèle de prédiction historique).       
- [ ] **Phase 38: Multilingual BERT Expansion** - UC38 optimization for Arabic/French sentiment nuances.
- [ ] **Phase 43: Stabilization & Regression Fixes** - Fix TypeScript errors and unit test regressions from the tactical overhaul.
- [ ] **Phase 44: E2E Suite Modernization** - Rewrite the Playwright E2E suite to align with the "Tactical Command" architecture and semantic locators.

## Phase Details

### Phase 44: E2E Suite Modernization
**Goal**: Align the E2E test suite with the modern UI architecture and remove legacy hacks.
**Depends on**: Phase 43
**Success Criteria**: 1. 100% E2E pass rate across both apps. 2. Semantic locators used everywhere. 3. New features (Delivery Hub, Avis) covered.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 44

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1-39 | 96/96 | Complete | 2026-05-09 |
| 40. Frontend Completion | 1/1 | Complete | 2026-05-12 |
| 41. Premium Portal Refinement | 1/1 | Complete | 2026-05-14 |
| 42. Tactical Compact Overhaul | 1/1 | Complete | 2026-05-14 |
| 43. Stabilization & Fixes | 1/1 | Complete | 2026-05-22 |
| 44. E2E Modernization | 0/1 | In Progress | — |
| Total | 100/101 | 99% | 2026-05-22 | faire | — |
/1 | à faire | — |
 faire | — |
 faire | — |
 faire | — |

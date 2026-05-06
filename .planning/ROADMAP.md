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
- [x] **Phase 26: QR Payment & Split Bill Logic** - Backend calculation for equal/individual splits.
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

### Phase 26: QR Payment & Split Bill Logic
**Goal**: Provide the backend payment domain for QR-based checkout, including equal and item/fraction splits, token-authorized client payment access, and lifecycle completion that frees the table once the order is fully paid.
**Depends on**: Phase 11, Phase 12
**Success Criteria**: 1. `apps.paiements` models and migrations land cleanly. 2. The backend rejects ambiguous or stale payable sessions. 3. Equal and item/fraction split flows validate and persist without double-payment. 4. Fully paid orders transition to `PAYEE` and existing table sync frees the table.

Plans:
- [x] 26-01-PLAN.md — Payment Domain, Payable Session Resolution & Lifecycle Integrity. (completed 2026-05-06)
- [x] 26-02-PLAN.md — QR Token Authorization & Payment API Contracts. (completed 2026-05-06)

### Phase 27: Encaissement UI
**Goal**: Implement the frontend interfaces for payment management, enabling staff to handle payments and generate QR codes, and providing clients with a dedicated self-service payment landing page with split-bill support.
**Depends on**: Phase 26
**Success Criteria**: 1. Staff can generate QR codes and record manual payments via a modal on the table map. 2. Clients can resolve their session via QR and choose a split strategy (Total, Equal, Item). 3. Staff UI updates in real-time when clients pay.

Plans:
- [x] 27-01-PLAN.md — Staff Payment Modal & QR Issuance UI. (completed 2026-05-06)
- [x] 27-02-PLAN.md — Client QR Landing Page & Split Bill UI. (completed 2026-05-07)
- [ ] 27-03-PLAN.md — Final Integration & End-to-End Verification.

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
| 26. QR Payment & Split Bill Logic | 2/2 | Completed | 2026-05-06 |
| 27. Encaissement UI | 2/3 | In Progress | — |

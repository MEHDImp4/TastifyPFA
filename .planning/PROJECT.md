# Project: TastifyPFA

## Purpose
Tastify is an ERP web full-stack dedicated to the management of Moroccan restaurants (PME). It serves as an accessible, high-performance alternative to expensive POS systems on the market, incorporating modern UI paradigms, real-time Kitchen Display Systems, and AI-driven recommendations.

## Tech Stack
- **Backend:** Django 5.0, Django REST Framework 3.15, Celery 5.x, Daphne (WebSockets).
- **Frontend:** React 18, Vite 5.x, Tailwind CSS (ECO-FRESH Palette).
- **Database:** MySQL 8.0, Redis 7 (Broker & Channel Layer).
- **AI/ML:** scikit-learn (collaborative filtering), HuggingFace Transformers (BERT sentiment analysis).
- **Infra:** Docker Compose 3.9 with direct host ports for backend and two Vite SPAs.

## Architecture Rules
- **Strict Decoupling:** The Django backend must NEVER return HTML templates in production. All communication is exclusively via JSON REST or WebSocket.
- **JWT Auth:** Access and refresh tokens are managed by the frontend, with refresh tokens securely stored in HttpOnly cookies to prevent XSS.
- **RBAC:** Four distinct roles (`GERANT`, `SERVEUR`, `CUISINIER`, `CLIENT`) governing access across a staff React SPA and a client React SPA.
- **Event-Driven:** Orders are pushed in real-time via Django Channels and Redis to the KDS (`ws://host/ws/cuisine/`).

## Project Context
The project operates under strict adherence to `GEMINI.md` mandates, emphasizing atomic commits, self-documenting code without boilerplate comments, and the GSD `.planning/` framework.

## Current State

Phase 12 complete (2026-04-30) — Order Taking Frontend delivered and now consolidated into the staff SPA. Servers can open a table-specific order route, browse categories and dishes, build isolated per-table carts, review totals, and submit nested orders to `/api/commandes/`.

Infrastructure amendment complete (2026-04-30) — Removed the Nginx Compose service and consolidated runtime frontends. Backend is exposed on `localhost:8000`; the staff frontend is exposed on `localhost:3000`; the client frontend is exposed on `localhost:3003`. Each Vite app proxies `/api` and `/media` to `http://backend:8000`. Login gates reject accounts used from the wrong frontend.

## Validated Requirements

- **D-01** — `menu` app registered in Django. Validated in Phase 04.
- **D-02** — `Categorie` model exists with correct structure. Validated in Phase 04.
- **D-03** — All 7 fields (nom, description, ordre_affichage, image, est_active, created_at, updated_at). Validated in Phase 04.
- **D-04** — CRUD endpoints at `/api/categories/`. Validated in Phase 04.
- **D-05** — RBAC: GERANT write, others read-only. Validated in Phase 04.
- **D-06** — Visibility filtering: non-GERANT sees only active categories. Validated in Phase 04.
- **D-07** — Soft-delete: `delete()` sets `est_active=False`, no row removal. Validated in Phase 04.
- **D-08** — Back-Office AppShell with routing and sidebar. Validated in Phase 05.
- **D-09** — Categories CRUD UI with inline delete confirmation. Validated in Phase 05.
- **D-10** — Image upload with preview for categories. Validated in Phase 05.
- **D-11** — Optimistic status toggles for categories. Validated in Phase 05.
- **D-12** — Form validation (required Nom field). Validated in Phase 05.
- **D-13** — `Plat` model with pricing and prep time. Validated in Phase 06.
- **D-14** — `Plat` CRUD endpoints with RBAC and visibility filtering. Validated in Phase 06.
- **D-15** — `Plats` management UI in Back-Office (Desktop/Mobile). Validated in Phase 07.
- **D-16** — `Table` model with status and capacity. Validated in Phase 08.
- **D-17** — `Table` CRUD endpoints with RBAC. Validated in Phase 08.
- **D-18** — Interactive Table Map in Salle UI with editor. Validated in Phase 09.
- **D-19** — `Commande` and `CommandeLigne` models. Validated in Phase 10.
- **D-20** — Soft-delete for orders and price snapshotting for lines. Validated in Phase 10.
- **D-21** — Automatic total calculation via signals. Validated in Phase 10.
- **D-22** — Atomic nested order creation via `POST /api/commandes/`. Validated in Phase 11.
- **D-23** — Ownership-based filtering for `SERVEUR` role. Validated in Phase 11.
- **D-24** — Automatic table status sync (OCCUPEE/LIBRE) via signals. Validated in Phase 11.
- **D-25** — Custom `add_items` action for existing orders. Validated in Phase 11.
- **D-26** — Salle table activation routes to a table-specific ordering page. Validated in Phase 12.
- **D-27** — Per-table cart state is isolated in the Salle frontend. Validated in Phase 12.
- **D-28** — Servers can browse dishes by category and add/remove quantities. Validated in Phase 12.
- **D-29** — Servers must review an itemized cart before confirming an order. Validated in Phase 12.
- **D-30** — Salle order submission posts nested order lines to the commandes API. Validated in Phase 12.
- **D-31** — Local Docker routing uses direct host ports without Nginx, with Vite API/media proxies. Validated by infrastructure amendment.

Last updated: 2026-04-30

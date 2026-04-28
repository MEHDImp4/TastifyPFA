# Project: TastifyPFA

## Purpose
Tastify is an ERP web full-stack dedicated to the management of Moroccan restaurants (PME). It serves as an accessible, high-performance alternative to expensive POS systems on the market, incorporating modern UI paradigms, real-time Kitchen Display Systems, and AI-driven recommendations.

## Tech Stack
- **Backend:** Django 5.0, Django REST Framework 3.15, Celery 5.x, Daphne (WebSockets).
- **Frontend:** React 18, Vite 5.x, Tailwind CSS (ECO-FRESH Palette).
- **Database:** MySQL 8.0, Redis 7 (Broker & Channel Layer).
- **AI/ML:** scikit-learn (collaborative filtering), HuggingFace Transformers (BERT sentiment analysis).
- **Infra:** Docker Compose 3.9, Nginx alpine.

## Architecture Rules
- **Strict Decoupling:** The Django backend must NEVER return HTML templates in production. All communication is exclusively via JSON REST or WebSocket.
- **JWT Auth:** Access and refresh tokens are managed by the frontend, with refresh tokens securely stored in HttpOnly cookies to prevent XSS.
- **RBAC:** Four distinct roles (`GERANT`, `SERVEUR`, `CUISINIER`, `CLIENT`) governing access across four independent React SPAs.
- **Event-Driven:** Orders are pushed in real-time via Django Channels and Redis to the KDS (`ws://host/ws/cuisine/`).

## Project Context
The project operates under strict adherence to `GEMINI.md` mandates, emphasizing atomic commits, self-documenting code without boilerplate comments, and the GSD `.planning/` framework.

## Current State

Phase 04 complete (2026-04-28) — Categories model & REST API delivered. `Categorie` model with soft-delete, RBAC-gated ViewSet at `/api/categories/`, 16/16 tests green.

## Validated Requirements

- **D-01** — `menu` app registered in Django. Validated in Phase 04: categories-model-api.
- **D-02** — `Categorie` model exists with correct structure. Validated in Phase 04: categories-model-api.
- **D-03** — All 7 fields (nom, description, ordre_affichage, image, est_active, created_at, updated_at). Validated in Phase 04: categories-model-api.
- **D-04** — CRUD endpoints at `/api/categories/`. Validated in Phase 04: categories-model-api.
- **D-05** — RBAC: GERANT write, others read-only. Validated in Phase 04: categories-model-api.
- **D-06** — Visibility filtering: non-GERANT sees only active categories. Validated in Phase 04: categories-model-api.
- **D-07** — Soft-delete: `delete()` sets `est_active=False`, no row removal. Validated in Phase 04: categories-model-api.

Last updated: 2026-04-28

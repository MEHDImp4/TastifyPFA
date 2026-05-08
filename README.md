# TastifyPFA

AI-powered ERP for Moroccan restaurants. Docker-orchestrated monorepo.

The project features a high-fidelity unified branding across all touchpoints, including a custom logo asset and a consistent dark-mode design system.

## Stack
Django 5.0 + Daphne (ASGI) + Celery/Beat | MySQL 8 | Redis 7 | 2× React 18 + Vite 5 + Tailwind v4 SPAs | Docker Compose direct ports

## Quick start
```
cp .env.example .env
# edit .env: replace SECRET_KEY, MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD with real values
docker compose up --build
```

### Seeding
To populate the database with initial users, tables, menu, ingredients, and recipes:
```bash
docker-compose exec backend python manage.py seed_all
```

This command seeds:
- **Users**: 16 test accounts (1 manager, 4 servers, 4 chefs, 6 clients)
- **Tables**: 26 tables with varied capacities (2–12 seats)
- **Menu**: 29 Moroccan dishes across 4 categories (Entrées, Plats Principaux, Desserts, Boissons)
- **Ingredients**: 51 cooking ingredients (vegetables, proteins, grains, spices, oils, nuts, beverages)
- **Recipes**: 129 dish-ingredient mappings with realistic quantities

See `user.md` for all test account credentials (default password: `password123`).

Then visit:
- `http://localhost:3003/` → Portail Client SPA
- `http://localhost:3000/` → Staff SPA (GERANT, SERVEUR, CUISINIER)
- `http://localhost:8000/api/` → Django REST API

Each frontend Vite dev server proxies `/api` and `/media` to `http://backend:8000` inside the Docker network.
Both Vite dev servers now accept all hosts during development so `localhost`, `127.0.0.1`, Docker bridge names, and direct LAN-IP access reuse the same proxy path.
Each frontend rejects accounts outside its allowed role family: the staff app accepts GERANT, SERVEUR, and CUISINIER; the client app accepts CLIENT only.
Shared auth persistence is now portal-scoped: `app/frontend/shared/auth/portalContext.ts` namespaces the persisted Zustand key and sends an `X-Tastify-Portal` header so staff and client refresh cookies no longer overwrite each other in the same browser.
The backend container runs pending Django migrations before starting Daphne, while Celery worker and Beat reuse the same migration path without re-running `collectstatic`.
Celery now uses Redis DB `1` for broker traffic and `django-celery-results` for task results, leaving Redis DB `0` available for Channels/WebSocket traffic.

## Layout
See `docs/brain/00_Meta/FILE_MAP.md`.

The back-office SPA keeps Vite runtime config in `app/frontend/backoffice/vite.config.ts` and test-only settings in `app/frontend/backoffice/vitest.config.ts`.
The client portail now follows a public-first access model: `/`, `/menu`, `/reservations`, and `/fidelite` are visible without authentication, while the live reservation wizard remains behind client login at `/reservations/new`, `/reservations/table`, and `/reservations/confirm`.
The public portail shell and gated notices now live in `app/frontend/portail/src/App.tsx`, `app/frontend/portail/src/components/ProtectedFeatureNotice.tsx`, and `app/frontend/portail/src/pages/Home/PortalHomePage.tsx`, while the authenticated booking flow stays backed by `app/frontend/portail/src/pages/Reservations/` and `app/frontend/portail/src/api/reservations.ts`.
The portail test surface now mirrors the backoffice setup through `app/frontend/portail/vitest.config.ts` and `app/frontend/portail/src/test/setup.ts`.
The back-office SPA now hosts GERANT, SERVEUR, and CUISINIER workflows under `/categories`, `/plats`, `/tables`, `/salle`, `/tables/:id/order`, and `/kds`.
Dense back-office list views now use a shared client-side pagination surface in `app/frontend/backoffice/src/components/ui/Pagination.tsx`, currently wired into dishes, stock, and HR screens.
Cross-frontend role gates live in `app/frontend/shared/auth/roleAccess.ts`, with focused coverage in `app/frontend/backoffice/src/roleAccess.test.ts`.
Shared auth refreshes now also resynchronize `username` and `role` from the backend response, preventing cross-portal staff/client identity drift inside the persisted Zustand store.
Persisted auth bootstrap now has a hard render deadline and transient proxy-error tolerance, so a slow backend startup cannot leave the staff SPA frozen on a blank or theme-colored shell.
If Zustand hydration itself stalls, the staff SPA now falls back to rendering after a short watchdog delay instead of waiting forever on `hasHydrated`.
Both frontend entrypoints now bootstrap persisted auth through `app/frontend/shared/auth/AuthBootstrap.tsx`, keeping reload behavior aligned between the back-office and portail client.
Public QR payment pages are intentionally excluded from that bootstrap and call payment endpoints through `app/frontend/shared/auth/publicClient.ts`, which keeps the client portal header without requiring a logged-in session.
The backend JWT views in `app/backend/apps/users/views/auth.py` now issue separate refresh cookies for the staff and client portals, allowing simultaneous logins on both SPAs without cross-logout.

## Planning
See `.planning/ROADMAP.md` and `.planning/phases/`.
Current planning artifacts now extend through `.planning/phases/26-qr-payment-split-bill/`, with Phase 26 split into two backend waves for the payment domain and the later QR/API contract.
Infrastructure amendment `01-DIRECT-PORTS-AMENDMENT.md` records the removal of the Nginx Compose service and the direct-port routing model.

## Backend domains
- `apps.users` — custom users and RBAC.
- `apps.menu` — categories and dishes.
- `apps.tables` — restaurant tables.
- `apps.reservations` — reservation domain, buffered availability checks, `available_tables` filtering, and transactional booking services.
- `apps.commandes` — orders, order lines, price snapshots, and total recalculation signals.
- `apps.paiements` — payment records, line-level split contributions, payable-session resolution, and payment-to-order reconciliation that leaves table release in `apps.commandes` signals.
- `apps.stock` — ingredients inventory (51 Moroccan cooking items), dish-recipe mappings (129 plat-ingredient links), async stock deduction tasks/services, and soft-delete.
- `apps.hr` — employees linked to users, salary, position, personal details, and soft-delete.
- `app/backend/entrypoint.sh` — applies pending migrations before the ASGI server starts.

## Realtime staff channel
- `app/backend/core/middleware.py` authenticates `/ws/staff/` with a Simple JWT access token passed in the query string.
- `app/backend/core/consumers.py` exposes `StaffConsumer`, which accepts GERANT, SERVEUR, and CUISINIER into the shared `staff_group`.
- `app/frontend/shared/websocket/` owns the shared staff websocket provider, reconnection policy, payload parsing, and Zustand socket state used by the staff SPA.
- `app/frontend/shared/ui/` owns the shared render crash boundary used by both SPAs so reload-time exceptions surface visibly instead of failing to a blank screen.

## Salle order-taking
- `app/frontend/backoffice/src/pages/Staff/Ordering/` contains the table-specific order route, menu browser, per-table Zustand cart store, floating cart, review drawer, and commandes API submission flow.

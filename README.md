# TastifyPFA

AI-powered ERP for Moroccan restaurants. Docker-orchestrated monorepo.

## Stack
Django 5.0 + Daphne (ASGI) | MySQL 8 | Redis 7 | 2× React 18 + Vite 5 + Tailwind v4 SPAs | Docker Compose direct ports

## Quick start
```
cp .env.example .env
# edit .env: replace SECRET_KEY, MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD with real values
docker compose up --build
```

### Seeding
To populate the database with initial users, tables, and a full menu:
```bash
docker-compose exec backend python manage.py seed_all
```

Then visit:
- `http://localhost:3003/` → Portail Client SPA
- `http://localhost:3000/` → Staff SPA (GERANT, SERVEUR, CUISINIER)
- `http://localhost:8000/api/` → Django REST API

Each frontend Vite dev server proxies `/api` and `/media` to `http://backend:8000` inside the Docker network.
Both Vite dev servers now accept all hosts during development so `localhost`, `127.0.0.1`, Docker bridge names, and direct LAN-IP access reuse the same proxy path.
Each frontend rejects accounts outside its allowed role family: the staff app accepts GERANT, SERVEUR, and CUISINIER; the client app accepts CLIENT only.
The backend container runs pending Django migrations before starting Daphne, keeping fresh or recreated MySQL volumes aligned with the current apps.

## Layout
See `docs/brain/00_Meta/FILE_MAP.md`.

The back-office SPA keeps Vite runtime config in `app/frontend/backoffice/vite.config.ts` and test-only settings in `app/frontend/backoffice/vitest.config.ts`.
The back-office SPA now hosts GERANT, SERVEUR, and CUISINIER workflows under `/categories`, `/plats`, `/tables`, `/salle`, `/tables/:id/order`, and `/kds`.
Dense back-office list views now use a shared client-side pagination surface in `app/frontend/backoffice/src/components/ui/Pagination.tsx`, currently wired into dishes, stock, and HR screens.
Cross-frontend role gates live in `app/frontend/shared/auth/roleAccess.ts`, with focused coverage in `app/frontend/backoffice/src/roleAccess.test.ts`.
Shared auth refreshes now also resynchronize `username` and `role` from the backend response, preventing cross-portal staff/client identity drift inside the persisted Zustand store.
Persisted auth bootstrap now has a hard render deadline and transient proxy-error tolerance, so a slow backend startup cannot leave the staff SPA frozen on a blank or theme-colored shell.
If Zustand hydration itself stalls, the staff SPA now falls back to rendering after a short watchdog delay instead of waiting forever on `hasHydrated`.
Both frontend entrypoints now bootstrap persisted auth through `app/frontend/shared/auth/AuthBootstrap.tsx`, keeping reload behavior aligned between the back-office and portail client.

## Planning
See `.planning/ROADMAP.md` and `.planning/phases/`.
Current planning artifacts now extend through `.planning/phases/15-kds-orchestrator-logic/`, where Phase 15 now includes context, research, validation, execution plans, execution summaries, and a persisted `15-UAT.md` manual verification session for websocket launch behavior.
Infrastructure amendment `01-DIRECT-PORTS-AMENDMENT.md` records the removal of the Nginx Compose service and the direct-port routing model.

## Backend domains
- `apps.users` — custom users and RBAC.
- `apps.menu` — categories and dishes.
- `apps.tables` — restaurant tables.
- `apps.commandes` — orders, order lines, price snapshots, and total recalculation signals.
- `app/backend/entrypoint.sh` — applies pending migrations before the ASGI server starts.

## Realtime staff channel
- `app/backend/core/middleware.py` authenticates `/ws/staff/` with a Simple JWT access token passed in the query string.
- `app/backend/core/consumers.py` exposes `StaffConsumer`, which accepts GERANT, SERVEUR, and CUISINIER into the shared `staff_group`.
- `app/frontend/shared/websocket/` owns the shared staff websocket provider, reconnection policy, payload parsing, and Zustand socket state used by the staff SPA.
- `app/frontend/shared/ui/` owns the shared render crash boundary used by both SPAs so reload-time exceptions surface visibly instead of failing to a blank screen.

## Salle order-taking
- `app/frontend/backoffice/src/pages/Staff/Ordering/` contains the table-specific order route, menu browser, per-table Zustand cart store, floating cart, review drawer, and commandes API submission flow.

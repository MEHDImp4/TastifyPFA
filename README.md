# TastifyPFA

AI-powered ERP for Moroccan restaurants. Docker-orchestrated monorepo.

## Stack
Django 5.0 + Daphne (ASGI) | MySQL 8 | Redis 7 | 4× React 18 + Vite 5 + Tailwind v4 SPAs | Docker Compose direct ports

## Quick start
```
cp .env.example .env
# edit .env: replace SECRET_KEY, MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD with real values
docker compose up --build
```

Then visit:
- `http://localhost:3003/` → Portail Client SPA
- `http://localhost:3000/` → Back-Office (GERANT)
- `http://localhost:3001/` → Salle (SERVEUR)
- `http://localhost:3002/` → KDS (CUISINIER)
- `http://localhost:8000/api/` → Django REST API

Each frontend Vite dev server proxies `/api` and `/media` to `http://backend:8000` inside the Docker network.
Shared login redirection sends GERANT, SERVEUR, and CUISINIER users to their canonical direct-port apps (`3000`, `3001`, and `3002`) even if they authenticate from another frontend.

## Layout
See `docs/brain/00_Meta/FILE_MAP.md`.

The back-office SPA keeps Vite runtime config in `frontend/back-office/vite.config.ts` and test-only settings in `frontend/back-office/vitest.config.ts`.
The Salle SPA now mirrors that split with `frontend/salle/vite.config.ts` and `frontend/salle/vitest.config.ts`; run Salle component tests from `frontend/salle` with `npm run test -- --run`.
Cross-frontend role redirects live in `frontend/_shared/auth/roleRedirect.ts`, with focused coverage in `frontend/salle/src/roleRedirect.test.ts`.

## Planning
See `.planning/ROADMAP.md` and `.planning/phases/`.
Current planning artifacts now extend through `.planning/phases/12-order-taking-frontend/` with context, research, execution summaries, and verification for the Salle order-taking flow.
Infrastructure amendment `01-DIRECT-PORTS-AMENDMENT.md` records the removal of the Nginx Compose service and the direct-port routing model.

## Backend domains
- `apps.users` — custom users and RBAC.
- `apps.menu` — categories and dishes.
- `apps.tables` — restaurant tables.
- `apps.commandes` — orders, order lines, price snapshots, and total recalculation signals.

## Salle order-taking
- `frontend/salle/src/pages/Ordering/` contains the table-specific order route, menu browser, per-table Zustand cart store, floating cart, review drawer, and commandes API submission flow.

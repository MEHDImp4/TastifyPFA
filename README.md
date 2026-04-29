# TastifyPFA

AI-powered ERP for Moroccan restaurants. Docker-orchestrated monorepo.

## Stack
Django 5.0 + Daphne (ASGI) | MySQL 8 | Redis 7 | 4× React 18 + Vite 5 + Tailwind v4 SPAs | Nginx (reverse proxy)

## Quick start
```
cp .env.example .env
# edit .env: replace SECRET_KEY, MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD with real values
docker compose up --build
```

Then visit:
- `http://localhost/`            → Portail Client SPA
- `http://localhost/back-office/` → Back-Office (GERANT)
- `http://localhost/salle/`       → Salle (SERVEUR)
- `http://localhost/kds/`         → KDS (CUISINIER)
- `http://localhost/api/`         → Django REST API

## Layout
See `docs/brain/00_Meta/FILE_MAP.md`.

The back-office SPA keeps Vite runtime config in `frontend/back-office/vite.config.ts` and test-only settings in `frontend/back-office/vitest.config.ts`.
The Salle SPA now mirrors that split with `frontend/salle/vite.config.ts` and `frontend/salle/vitest.config.ts`; run Salle component tests from `frontend/salle` with `npm run test -- --run`.

## Planning
See `.planning/ROADMAP.md` and `.planning/phases/`.
Current planning artifacts now extend through `.planning/phases/10-commandes-model/` with context, research, execution summaries, and verification for the order model foundation.

## Backend domains
- `apps.users` — custom users and RBAC.
- `apps.menu` — categories and dishes.
- `apps.tables` — restaurant tables.
- `apps.commandes` — orders, order lines, price snapshots, and total recalculation signals.

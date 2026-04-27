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

## Planning
See `.planning/ROADMAP.md` and `.planning/phases/`.

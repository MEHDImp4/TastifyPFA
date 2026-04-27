# Phase 1: Project Skeleton - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 01-project-skeleton
**Areas discussed:** Frontend SPA layout, Docker Compose topology, Django project structure, Environment config

---

## Frontend SPA layout

| Option | Description | Selected |
|--------|-------------|----------|
| 4 subdirs in frontend/ | Each SPA is a fully independent Vite project with own vite.config.ts, package.json | ✓ |
| Monorepo with pnpm workspaces | Shared node_modules, shared Tailwind/TS config, enables shared component library | |
| Single Vite app, multi-entry | One Vite project with 4 entrypoints | |

**User's choice:** 4 subdirs in frontend/ (back-office, salle, kds, portail-client)

| Option | Description | Selected |
|--------|-------------|----------|
| Vite + React + TS + Tailwind configured | DESIGN.md tokens pre-wired from day 1 | ✓ |
| Bare Vite + React + TS only | Tailwind added in later phase | |
| You decide | Claude picks | |

**User's choice:** Full setup with Tailwind and DESIGN.md tokens pre-configured in skeleton

---

## Docker Compose topology

| Option | Description | Selected |
|--------|-------------|----------|
| Nginx from day 1 | Production-like reverse proxy, catches misconfiguration early | ✓ |
| Nginx added later | Django dev server directly on :8000 for now | |

**User's choice:** Nginx included from day 1

| Option | Description | Selected |
|--------|-------------|----------|
| Vite dev servers as Docker services | vite --host inside containers, HMR works in Docker | ✓ |
| Frontend on host outside Docker | Only backend stack Dockerized | |
| You decide | Claude picks | |

**User's choice:** Vite dev servers inside Docker

| Option | Description | Selected |
|--------|-------------|----------|
| Port 80 via Nginx | Single entry point, URL-based routing to each SPA | ✓ |
| Each service on its own port | Multiple ports, requires CORS config | |

**User's choice:** Port 80 via Nginx as single entry point

---

## Django project structure

| Option | Description | Selected |
|--------|-------------|----------|
| Project: tastify_backend, app: core | Clear separation of project config and domain apps | ✓ |
| Project: tastify, app: api | Shorter naming | |
| You decide | Claude picks | |

**User's choice:** tastify_backend / core naming

| Option | Description | Selected |
|--------|-------------|----------|
| apps/ subdirectory | backend/apps/users/, INSTALLED_APPS: 'apps.users' | ✓ |
| Flat at backend root | backend/users/ alongside project folder | |
| You decide | Claude picks | |

**User's choice:** apps/ subdirectory for domain apps

| Option | Description | Selected |
|--------|-------------|----------|
| Wire Daphne from day 1 | asgi.py configured, Daphne as Docker app server | ✓ |
| Add Daphne in Phase 13 | runserver until WebSockets needed | |

**User's choice:** Daphne from day 1

---

## Environment config

| Option | Description | Selected |
|--------|-------------|----------|
| Single .env at repo root | env_file: .env in Docker Compose, .env.example committed | ✓ |
| Per-service .env files | .env.backend, .env.db, .env.redis | |

**User's choice:** Single .env at root

| Option | Description | Selected |
|--------|-------------|----------|
| base/dev/prod split from day 1 | settings/base.py, dev.py, prod.py — DJANGO_SETTINGS_MODULE env var | ✓ |
| Single settings.py for now | Split later when prod deployment is closer | |

**User's choice:** base/dev/prod split from day 1

---

## Claude's Discretion

- Docker network name and subnet
- MySQL and Redis volume naming
- Nginx worker configuration
- Exact Vite port assignments
- Health check timing
- SECRET_KEY generation in .env.example

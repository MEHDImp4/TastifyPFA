# Phase 1: Project Skeleton - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the Docker-orchestrated monorepo so all services (Nginx, Django/Daphne, MySQL, Redis, and 4 React Vite SPAs) start cleanly and communicate. No business logic — pure infrastructure scaffold.

</domain>

<decisions>
## Implementation Decisions

### Frontend SPA layout
- **D-01:** 4 independent SPAs live under `frontend/`: `back-office/` (GERANT), `salle/` (SERVEUR), `kds/` (CUISINIER), `portail-client/` (CLIENT) — each is a fully independent Vite project with its own `package.json` and `vite.config.ts`.
- **D-02:** Each SPA skeleton includes: `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`, `src/index.css` — with DESIGN.md color tokens, typography (Inter), and dark mode configured from day 1.

### Docker Compose topology
- **D-03:** Nginx is included from day 1 as the reverse proxy — production-like from the start to avoid a disruptive server swap mid-project.
- **D-04:** Each Vite SPA runs inside Docker as its own service (`vite --host`) so hot module reload works inside containers. SPAs get ports 3000–3003 internally.
- **D-05:** Port 80 is the single host entry point via Nginx. Routing: `/api/` and `/ws/` → Django (Daphne on :8000), `/back-office/` → Vite:3000, `/salle/` → Vite:3001, `/kds/` → Vite:3002, `/` → Vite:3003 (Portail Client).

### Django project structure
- **D-06:** Django project folder: `backend/tastify_backend/`. Root config app: `backend/core/` (settings, base models, middleware stubs).
- **D-07:** Domain apps go under `backend/apps/` (e.g., `backend/apps/users/`, `backend/apps/orders/`). `INSTALLED_APPS` references them as `apps.users`, `apps.orders`, etc.
- **D-08:** Daphne (ASGI) wired from day 1 — `asgi.py` configured, Daphne is the Docker app server. Django Channels installed but no consumers yet. Avoids a disruptive WSGI→ASGI swap in Phase 13.

### Environment configuration
- **D-09:** Single `.env` at repo root, read by Docker Compose via `env_file: .env`. `.env.example` is committed to git with placeholder values. No per-service env files.
- **D-10:** Django settings split from day 1: `backend/tastify_backend/settings/base.py`, `dev.py`, `prod.py`. `DJANGO_SETTINGS_MODULE` env var controls which loads. Avoids messy `if DEBUG` blocks later.

### Claude's Discretion
- Exact Docker network name and subnet
- MySQL and Redis volume naming conventions
- Nginx worker configuration (worker_processes, worker_connections)
- Exact Vite port assignments (3000–3003 is a guideline)
- Health check intervals and retry counts
- Django `SECRET_KEY` generation method in `.env.example`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design system
- `DESIGN.md` — Color tokens (ECO-FRESH palette), typography (Inter), component standards, dark mode as default, animation principles. All frontend scaffolding MUST pre-wire these tokens.

### Project architecture rules
- `.planning/PROJECT.md` — Tech stack specs (Django 5.0, React 18, Vite 5.x, MySQL 8.0, Redis 7, Docker Compose 3.9, Nginx alpine), architecture mandates (JWT in HttpOnly cookies, strict JSON-only API, 4-role RBAC, WebSocket via Django Channels).

### Project mandates
- `GEMINI.md` — Behavioral mandates: atomic commits, no boilerplate comments, fail-fast on errors, auto-commit after every successful change.

### Roadmap
- `.planning/ROADMAP.md` — Phase dependencies and success criteria (Phase 1 success: all services start via Docker).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — this is the first phase. The skeleton created here becomes the reusable foundation for all future phases.

### Established Patterns
- This phase establishes all foundational patterns: directory layout, Docker service naming, Django app registration convention (`apps.<name>`), settings module selection via env var.

### Integration Points
- Nginx config defines the URL prefix each SPA owns — future frontend phases must respect these prefixes.
- `asgi.py` channel routing will be extended in Phase 13 (WebSocket infrastructure).
- `backend/apps/` directory is where all future domain apps (users, orders, etc.) will be created.

</code_context>

<specifics>
## Specific Ideas

- Each SPA should have an `<APP_NAME>` placeholder in its `index.html` title so it's clear which SPA is loading during development.
- The Nginx config should have clear comments marking which upstream block corresponds to which role (GERANT, SERVEUR, etc.) so future contributors can orient quickly.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-project-skeleton*
*Context gathered: 2026-04-27*

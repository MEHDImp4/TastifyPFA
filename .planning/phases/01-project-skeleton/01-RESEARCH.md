# Phase 1: Project Skeleton - Research

**Researched:** 2026-04-27
**Domain:** Docker Compose orchestration, Django ASGI/Channels, React+Vite+Tailwind SPAs, Nginx reverse proxy, MySQL 8, Redis 7
**Confidence:** HIGH (all stack choices verified against live registries and official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 4 independent SPAs under `frontend/`: `back-office/`, `salle/`, `kds/`, `portail-client/` — each a fully independent Vite project with its own `package.json` and `vite.config.ts`.
- **D-02:** Each SPA skeleton includes: `vite.config.ts`, `tailwind.config.ts` (v4: replaced by CSS `@theme`), `tsconfig.json`, `src/main.tsx`, `src/App.tsx`, `src/index.css` — with DESIGN.md color tokens, typography (Inter), and dark mode configured from day 1.
- **D-03:** Nginx from day 1 as reverse proxy — production-like from the start.
- **D-04:** Each Vite SPA runs inside Docker as its own service (`vite --host`); ports 3000–3003 internally.
- **D-05:** Port 80 is the single host entry point via Nginx. Routing: `/api/` and `/ws/` → Django (Daphne on :8000), `/back-office/` → Vite:3000, `/salle/` → Vite:3001, `/kds/` → Vite:3002, `/` → Vite:3003 (Portail Client).
- **D-06:** Django project folder: `backend/tastify_backend/`. Root config app: `backend/core/`.
- **D-07:** Domain apps under `backend/apps/`; referenced in `INSTALLED_APPS` as `apps.users`, `apps.orders`, etc.
- **D-08:** Daphne (ASGI) wired from day 1 — `asgi.py` configured, Daphne is the Docker app server. Django Channels installed but no consumers yet.
- **D-09:** Single `.env` at repo root, read by Docker Compose via `env_file: .env`. `.env.example` committed with placeholders. No per-service env files.
- **D-10:** Django settings split: `backend/tastify_backend/settings/base.py`, `dev.py`, `prod.py`. `DJANGO_SETTINGS_MODULE` env var controls which loads.

### Claude's Discretion

- Exact Docker network name and subnet
- MySQL and Redis volume naming conventions
- Nginx worker configuration (worker_processes, worker_connections)
- Exact Vite port assignments (3000–3003 is a guideline)
- Health check intervals and retry counts
- Django `SECRET_KEY` generation method in `.env.example`

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 1 establishes the full Docker Compose monorepo scaffold: Nginx (reverse proxy), Django 5.0 via Daphne (ASGI), MySQL 8.0, Redis 7, and 4 independent React 18 + Vite + Tailwind CSS v4 SPAs. No business logic is introduced — this is pure infrastructure wiring.

The most critical compatibility note: **Tailwind CSS is now at v4.2.4** (latest) and its setup is fundamentally different from v3 — no `tailwind.config.ts` file, no PostCSS config, no `@tailwind` directives. Config lives in CSS via `@theme {}`. The CONTEXT.md mentions `tailwind.config.ts` from a v3 mental model, but the planner must use the v4 approach with `@tailwindcss/vite` plugin. This is a critical deviation from the user's stated file list (D-02) and must be flagged.

Django Channels 4.3.2 + Daphne 4.2.1 + channels_redis 4.3.0 + Redis 7 form a validated ASGI stack. mysqlclient 2.2.8 is the official Django-recommended MySQL driver and requires C build deps in the Docker image (`default-libmysqlclient-dev`, `gcc`, `pkg-config`). The Vite-behind-Nginx HMR problem is fully solved via `server.allowedHosts` + WebSocket upgrade headers in Nginx config.

**Primary recommendation:** Use Tailwind CSS v4 with `@tailwindcss/vite` plugin (not PostCSS). Use mysqlclient for MySQL driver (not PyMySQL). Use `nginx:stable-alpine` (1.30.0). Pin all backend packages in `requirements.txt` to verified versions.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on This Phase |
|-----------|---------------------|
| Auto-commit after every successful change | Each working task (service up, config verified) gets its own commit |
| Atomic commits — small and focused | One commit per service added/configured |
| Update `dashboard.html` after every change | Planner must include dashboard.html update as final task in every wave |
| Update `docs/brain/00_Meta/FILE_MAP.md` when structure changes | Creating the full directory tree counts — FILE_MAP.md update required |
| Update `docs/brain/02_Journal/CHANGELOG.md` with timestamps | Each commit must be logged there |
| NO trivial comments — only explain WHY | Nginx config comments explaining role → allowed (they explain WHY per D-05 specifics); don't comment obvious directives |
| Fail fast: stop and diagnose if any command fails | Docker Compose `up` failures → diagnose before continuing |
| Always read DESIGN.md before frontend scaffolding | Planner must ensure SPA `index.css` tokens match DESIGN.md HSL values exactly |
| No `git push` without explicit permission | Not relevant to phase 1, but noted |
| Use Context7 for library questions | Already applied in this research |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django | 5.0.14 | Backend framework | PROJECT.md locked; supports MySQL 8.0.11+ natively [VERIFIED: pip registry] |
| djangorestframework | 3.15.2 | REST API layer | PROJECT.md locked; installed version matches spec [VERIFIED: pip registry] |
| channels | 4.3.2 | ASGI/WebSocket layer | Latest stable; required for Daphne + WS in Phase 13 [VERIFIED: pip registry] |
| daphne | 4.2.1 | ASGI server (replaces Gunicorn) | PROJECT.md locked; integrates with channels via `INSTALLED_APPS` [VERIFIED: pip registry] |
| channels_redis | 4.3.0 | Redis channel layer backend | Requires Redis >= 5.0; pairs with channels 4.x [VERIFIED: pip registry] |
| mysqlclient | 2.2.8 | MySQL driver for Django | Django-official recommended driver; faster than PyMySQL [VERIFIED: pip registry + Django 5.0 docs] |
| django-cors-headers | 4.9.0 | CORS for SPA ↔ API communication | Required when frontends on :3000–:3003 and API on :8000 [VERIFIED: pip registry] |
| python-decouple | 3.8 | .env reading in Django settings | Used in settings split pattern; reads `.env` cleanly [VERIFIED: pip registry] |
| celery | 5.6.3 | Async task queue (scaffold only) | PROJECT.md locked; Daphne-only in Phase 1, not wired yet [VERIFIED: pip registry] |

### Frontend

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.5 | UI framework | NOTE: npm latest is v19, not v18 per PROJECT.md. Pin to `18` if strict. [VERIFIED: npm registry] |
| vite | 8.0.10 | Dev server + bundler | npm latest is v8, not v5 per PROJECT.md. Pin to `5` if strict. [VERIFIED: npm registry] |
| @vitejs/plugin-react | 6.0.1 | React Fast Refresh for Vite | Pairs with React + Vite; provides HMR [VERIFIED: npm registry] |
| tailwindcss | 4.2.4 | Utility-first CSS | npm latest is v4 (NOT v3). v4 uses `@tailwindcss/vite` plugin, no postcss config [VERIFIED: npm registry + tailwindcss.com] |
| @tailwindcss/vite | 4.2.4 | Tailwind v4 Vite integration | First-party plugin; replaces PostCSS approach entirely [VERIFIED: tailwindcss.com] |
| typescript | 6.0.3 | Type safety | Latest stable [VERIFIED: npm registry] |

> **CRITICAL VERSION GAP:** PROJECT.md specifies React 18 and Vite 5.x. npm latest is React 19 and Vite 8. The planner must decide: pin to PROJECT.md spec (React 18, Vite 5) or use current (React 19, Vite 8). Research recommendation: **pin to the PROJECT.md spec** (`react@18`, `vite@5`) to avoid mid-project breaking changes. Use `npm create vite@5` and `react@18` explicitly. [ASSUMED — user preference not confirmed]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| mysqlclient | PyMySQL | PyMySQL is pure Python (easier Docker install, no C deps), but NOT officially supported by Django. mysqlclient is the right choice. |
| python-decouple | django-environ | django-environ is more feature-rich but heavier; python-decouple is simpler for this use case |
| Tailwind v4 `@theme` | Tailwind v3 `tailwind.config.ts` | v3 still works but is EOL path; v4 is faster (100x incremental) and CSS-first |
| `daphne` in INSTALLED_APPS | `uvicorn` | Daphne is the canonical Django Channels ASGI server; uvicorn works but lacks channels integration |

### Installation

**Backend (requirements.txt):**
```
Django==5.0.14
djangorestframework==3.15.2
channels==4.3.2
daphne==4.2.1
channels-redis==4.3.0
mysqlclient==2.2.8
django-cors-headers==4.9.0
python-decouple==3.8
celery==5.6.3
```

**Frontend (per SPA, pinned to PROJECT.md spec):**
```bash
npm create vite@5 . -- --template react-ts
npm install tailwindcss@4 @tailwindcss/vite@4
```

**Dockerfile (backend) — mysqlclient build deps:**
```dockerfile
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    gcc \
    pkg-config \
  && rm -rf /var/lib/apt/lists/*
```

---

## Architecture Patterns

### Recommended Project Structure

```
tastify-pfa/
├── backend/
│   ├── tastify_backend/         # Django project root (manage.py lives here)
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── dev.py
│   │   │   └── prod.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py              # kept but unused (Daphne uses asgi.py)
│   ├── core/                    # Root config app: base models, middleware stubs
│   │   └── apps.py
│   ├── apps/                    # Domain apps (added in later phases)
│   │   └── .gitkeep
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── back-office/             # GERANT SPA — Vite port 3000
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   └── index.css        # @import "tailwindcss"; + @theme tokens
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── salle/                   # SERVEUR SPA — Vite port 3001
│   ├── kds/                     # CUISINIER SPA — Vite port 3002
│   └── portail-client/          # CLIENT SPA — Vite port 3003
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── .env
├── .env.example
└── .gitignore
```

### Pattern 1: Django Settings Split with python-decouple

**What:** Split `settings.py` into `base.py` + `dev.py` + `prod.py` inside a `settings/` package. `DJANGO_SETTINGS_MODULE` env var selects which file loads.
**When to use:** Always — prevents `if DEBUG:` sprawl and makes prod/dev parity explicit.

```python
# backend/tastify_backend/settings/base.py
from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', cast=bool, default=False)

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': config('MYSQL_DATABASE'),
        'USER': config('MYSQL_USER'),
        'PASSWORD': config('MYSQL_PASSWORD'),
        'HOST': config('MYSQL_HOST', default='db'),
        'PORT': config('MYSQL_PORT', default='3306'),
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
    }
}

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(config('REDIS_HOST', default='redis'), 6379)],
        },
    },
}
```

```python
# backend/tastify_backend/settings/dev.py
from .base import *  # noqa: F403

DEBUG = True
CORS_ALLOW_ALL_ORIGINS = True  # dev only — SPAs on :3000-:3003 hit API freely
```

```python
# backend/tastify_backend/settings/prod.py
from .base import *  # noqa: F403

CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
]
```

**`.env` (root):**
```
DJANGO_SETTINGS_MODULE=tastify_backend.settings.dev
SECRET_KEY=changeme-generate-in-prod
DEBUG=True
MYSQL_DATABASE=tastify
MYSQL_USER=tastify
MYSQL_PASSWORD=tastify_dev_pw
MYSQL_ROOT_PASSWORD=root_dev_pw
MYSQL_HOST=db
REDIS_HOST=redis
```

### Pattern 2: Django ASGI + Daphne + Channels Setup

**What:** `asgi.py` configured with `ProtocolTypeRouter` from day 1. No consumers yet — just HTTP routing. `daphne` added as FIRST item in `INSTALLED_APPS`.
**When to use:** From day 1 per D-08. Avoids disruptive WSGI→ASGI swap in Phase 13.

```python
# backend/tastify_backend/asgi.py
# Routes HTTP via Django's ASGI handler. WS consumers added in Phase 13.
import os
from channels.routing import ProtocolTypeRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tastify_backend.settings.dev')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
})
```

```python
# backend/tastify_backend/settings/base.py  (INSTALLED_APPS excerpt)
INSTALLED_APPS = [
    'daphne',                    # MUST be first to override runserver with ASGI
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'channels',
    'core',                      # Root config app
]

ASGI_APPLICATION = 'tastify_backend.asgi.application'
```

**Source:** [CITED: channels.readthedocs.io/en/stable/tutorial/part_1.html]

### Pattern 3: Docker Compose Service Graph

**What:** 7 services: `nginx`, `backend`, `db` (MySQL), `redis`, `backoffice` (Vite:3000), `salle` (Vite:3001), `kds` (Vite:3002), `portail` (Vite:3003). Backend depends on `db` (service_healthy) and `redis`. SPAs depend on nothing. Nginx depends on all.

**Source:** [CITED: docs.docker.com/compose/how-tos/startup-order/]

```yaml
# docker-compose.yml (skeleton — paths are illustrative)
version: '3.9'

services:
  db:
    image: mysql:8.0
    env_file: .env
    environment:
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p$$MYSQL_ROOT_PASSWORD"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    build: ./backend
    env_file: .env
    command: daphne -b 0.0.0.0 -p 8000 tastify_backend.asgi:application
    volumes:
      - ./backend:/app
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  backoffice:
    build: ./frontend/back-office
    command: npm run dev -- --host
    volumes:
      - ./frontend/back-office:/app
      - /app/node_modules
    ports:
      - "3000:3000"

  # salle, kds, portail follow same pattern on 3001, 3002, 3003

  nginx:
    image: nginx:stable-alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - backoffice
      - salle
      - kds
      - portail

volumes:
  mysql_data:
  redis_data:
```

### Pattern 4: Nginx Configuration

**What:** Single Nginx config file routing all traffic. WebSocket upgrade headers are required for both `/ws/` (Daphne) and Vite HMR.
**Critical:** Proxy to Docker service names, not `localhost`. Vite HMR uses `$http_upgrade` + `Connection "Upgrade"`.

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    # GERANT back-office SPA (Vite dev server)
    upstream backoffice {
        server backoffice:3000;
    }
    # SERVEUR salle SPA
    upstream salle {
        server salle:3001;
    }
    # CUISINIER KDS SPA
    upstream kds {
        server kds:3002;
    }
    # CLIENT portail SPA
    upstream portail {
        server portail:3003;
    }
    # Django/Daphne ASGI backend
    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;

        # REST API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Django Channels WebSocket (Phase 13 onwards)
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # GERANT back-office with Vite HMR support
        location /back-office/ {
            proxy_pass http://backoffice/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        location /salle/ {
            proxy_pass http://salle/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        location /kds/ {
            proxy_pass http://kds/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # Portail Client at root (catches all unmatched)
        location / {
            proxy_pass http://portail;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

**Source:** [CITED: channels.readthedocs.io/en/stable/deploying.html] [CITED: aronschueler.de/blog/2024/07/29/enabling-hot-module-replacement-hmr-in-vite-with-nginx-reverse-proxy/]

### Pattern 5: Vite Config for Docker + HMR

**What:** Each SPA's `vite.config.ts` must expose the server on `0.0.0.0` and whitelist the Nginx container as an allowed host to prevent DNS-rebinding security block.
**Why this matters:** Without `allowedHosts`, Vite blocks requests whose `Host` header is the Docker service name (e.g., `backoffice`) — appears as blank/refused page in browser.

```typescript
// frontend/back-office/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',     // required: listen on all interfaces inside Docker
    port: 3000,
    allowedHosts: [
      'localhost',
      'backoffice',       // Docker service name used by Nginx as upstream
    ],
    hmr: {
      clientPort: 80,     // HMR websocket connects through Nginx on port 80
    },
    watch: {
      usePolling: true,   // required for file watching inside Docker on Windows/WSL2
    },
  },
})
```

**Source:** [CITED: vite.dev/config/server-options] [CITED: iifx.dev/en/articles/456620056/vite-s-blocked-request-a-deep-dive-into-allowed-hosts-and-docker-networking]

### Pattern 6: Tailwind CSS v4 Design Token Setup

**What:** v4 uses `@theme {}` in CSS to define design tokens, replacing `tailwind.config.ts`. Dark mode defaults to OS preference (`prefers-color-scheme`). Custom dark mode via class uses `@custom-variant`.
**DESIGN.md tokens** must be declared in `@theme` so Tailwind generates corresponding utility classes.

```css
/* frontend/back-office/src/index.css */
@import "tailwindcss";

@theme {
  /* ECO-FRESH palette from DESIGN.md */
  --color-primary: hsl(210 100% 50%);
  --color-secondary: hsl(215 15% 20%);
  --color-accent: hsl(280 100% 65%);
  --color-background: hsl(220 10% 10%);
  --color-surface: hsl(220 10% 14%);
  --color-foreground: hsl(0 0% 95%);
  --color-error: hsl(0 100% 65%);
  --color-success: hsl(145 65% 45%);

  /* Typography — Inter */
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, sans-serif;

  /* Radius tokens matching DESIGN.md */
  --radius-sm: 0.5rem;    /* rounded-lg */
  --radius-md: 0.75rem;   /* rounded-xl */
  --radius-lg: 1rem;      /* rounded-2xl */
}

/* Dark mode is default per DESIGN.md — force dark class on html */
@custom-variant dark (&:where(.dark, .dark *));
```

```html
<!-- index.html — dark mode active by default -->
<html lang="fr" class="dark">
```

**Source:** [CITED: tailwindcss.com/docs/theme] [CITED: tailwindcss.com/docs/installation/using-vite]

### Anti-Patterns to Avoid

- **`localhost` in Nginx `proxy_pass`:** Nginx runs in its own container — `localhost` is the Nginx container itself, not the backend. Always use Docker service names.
- **`vite.config.ts` without `host: '0.0.0.0'`:** Vite defaults to `localhost` which is not reachable from other containers.
- **`daphne` not first in `INSTALLED_APPS`:** Causes `runserver` to not use ASGI, silently running WSGI instead.
- **`--no-healthcheck` or missing `start_period`:** MySQL takes 20–30s to initialize on first run. Without `start_period: 30s`, the backend will crash-loop before the DB is ready.
- **`mysqlclient` without C build deps in Dockerfile:** Causes `pip install` to fail at build time with cryptic C compiler errors.
- **`tailwind.config.ts` for v4:** v4 ignores it. Tokens defined there will silently not apply.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service startup ordering | `sleep` in entrypoint scripts | `depends_on: condition: service_healthy` | sleep is fragile; health checks are deterministic |
| .env reading in Django | `os.environ.get()` directly | `python-decouple config()` | decouple handles type casting, `.ini` fallbacks, and missing-key errors cleanly |
| CORS headers | Manual middleware | `django-cors-headers` | Handles preflight, credentials, origin validation, Origin-header regex — lots of edge cases |
| MySQL connection retry | Custom retry loop in startup | Docker health check + `depends_on` | Retry loops are fragile; health checks are the compose-native solution |
| ASGI HTTP + WS routing | Custom dispatcher | `channels.routing.ProtocolTypeRouter` | channels handles protocol detection and routing correctly |
| Tailwind design tokens | CSS custom props in `:root` manually | `@theme {}` in Tailwind v4 | `@theme` makes tokens available as utility classes (e.g., `bg-primary`), plain `:root` vars don't |

---

## Common Pitfalls

### Pitfall 1: mysqlclient Build Failure in Docker

**What goes wrong:** `pip install mysqlclient` fails with `OSError: mysql_config not found` or C compiler error.
**Why it happens:** mysqlclient is a C extension requiring `libmysqlclient-dev` and `gcc` at build time.
**How to avoid:** Add to Dockerfile before `pip install`:
```dockerfile
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev gcc pkg-config \
  && rm -rf /var/lib/apt/lists/*
```
**Warning signs:** Build exits on `pip install -r requirements.txt` with `error: command 'gcc' failed`.

### Pitfall 2: Vite "Blocked request" Behind Nginx

**What goes wrong:** Browser shows blank page or `net::ERR_EMPTY_RESPONSE`. Vite logs show `Blocked request with invalid host header`.
**Why it happens:** Vite's DNS-rebinding protection blocks requests whose `Host` header doesn't match `allowedHosts`. When Nginx proxies to Vite, the `Host` is the Docker service name.
**How to avoid:** Add the Docker service name to `server.allowedHosts` in `vite.config.ts` (see Pattern 5 above).
**Warning signs:** Vite container running, Nginx running, but browser gets empty response.

### Pitfall 3: Vite HMR WebSocket Fails Behind Nginx

**What goes wrong:** Files change, browser doesn't update. Console shows `[vite] failed to connect to websocket`.
**Why it happens:** HMR uses a WebSocket. Without `Upgrade`/`Connection` headers in Nginx, the WebSocket handshake fails. `clientPort` must match the external port (80).
**How to avoid:** Add `proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";` to every Vite upstream location block. Set `hmr.clientPort: 80` in `vite.config.ts`.
**Warning signs:** HMR connection failed in browser console; manual refresh works but auto-reload doesn't.

### Pitfall 4: Django Channels ASGI Not Active

**What goes wrong:** `runserver` starts but WebSocket connections fail in Phase 13; Django is running WSGI silently.
**Why it happens:** `daphne` not first in `INSTALLED_APPS`, or `ASGI_APPLICATION` not set.
**How to avoid:** Per official Channels docs: `daphne` must be the FIRST entry in `INSTALLED_APPS`. Set `ASGI_APPLICATION = 'tastify_backend.asgi.application'` in settings.
**Warning signs:** `runserver` output says `Starting development server` (WSGI) instead of `Starting ASGI/Daphne development server`.

### Pitfall 5: MySQL 8 `utf8mb4` Encoding Issues

**What goes wrong:** Django migrations fail or Arabic text gets mangled.
**Why it happens:** MySQL 8 defaults to `utf8mb4` but Django's connection may not enforce it.
**How to avoid:** Set in `OPTIONS`:
```python
'OPTIONS': {
    'charset': 'utf8mb4',
    'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
}
```
**Warning signs:** `Incorrect string value` errors when inserting non-ASCII data.

### Pitfall 6: Tailwind v4 `@theme` vs `:root` Tokens

**What goes wrong:** Tailwind utility classes like `bg-primary` don't work; tokens defined in `:root` are ignored by Tailwind.
**Why it happens:** Tailwind v4 only generates utilities from `@theme {}` blocks, not from arbitrary CSS custom properties.
**How to avoid:** Always declare design tokens inside `@theme {}`, not `:root {}`.
**Warning signs:** `bg-primary` applied but color doesn't change; browser DevTools shows no matching CSS rule.

### Pitfall 7: Docker Vite File Watching Not Working (Windows/WSL2)

**What goes wrong:** Code changes inside the Docker volume aren't detected; HMR never fires.
**Why it happens:** Linux inotify events don't propagate across WSL2/Docker Desktop filesystem layers on Windows.
**How to avoid:** Set `server.watch.usePolling: true` in `vite.config.ts`.
**Warning signs:** File saved, no HMR notification in browser console.

---

## Code Examples

### Docker Compose Health Check for MySQL

```yaml
# Source: docs.docker.com/compose/how-tos/startup-order/
db:
  image: mysql:8.0
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p$$MYSQL_ROOT_PASSWORD"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s

backend:
  depends_on:
    db:
      condition: service_healthy
```

### channels_redis CHANNEL_LAYERS Config

```python
# Source: github.com/django/channels_redis/
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("redis", 6379)],   # 'redis' is the Docker service name
        },
    },
}
```

### Daphne Docker CMD

```dockerfile
# Source: channels.readthedocs.io/en/stable/deploying.html
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "tastify_backend.asgi:application"]
```

### CORS for Dev (SPAs on multiple ports)

```python
# backend/tastify_backend/settings/dev.py
# Source: github.com/adamchainz/django-cors-headers
CORS_ALLOW_ALL_ORIGINS = True   # dev only — SPAs on :3000-:3003 need open CORS
CORS_ALLOW_CREDENTIALS = True   # needed for JWT in HttpOnly cookies (Phase 3)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.ts` + PostCSS | `@theme {}` in CSS + `@tailwindcss/vite` plugin | Tailwind v4 (Jan 2025) | No JS config file needed; no postcss.config.js |
| `@tailwind base/components/utilities` directives | `@import "tailwindcss"` | Tailwind v4 | Simpler entry point |
| React 18 (PROJECT.md spec) | React 19 (npm latest) | React 19 stable (Dec 2024) | PROJECT.md pins to 18 — safest to honor that |
| Vite 5 (PROJECT.md spec) | Vite 8 (npm latest) | Vite 6→7→8 through 2025 | PROJECT.md pins to 5 — pin explicitly |
| Django WSGI (`gunicorn`) | Django ASGI (`daphne`) | Django Channels 4.0 | Required for WebSocket support in Phase 13 |
| `channels` bundled with `daphne` | `daphne` separate package | Channels 4.0 | Must install `daphne` explicitly and put it first in INSTALLED_APPS |

**Deprecated/outdated:**
- `django.contrib.staticfiles` serving in development: still fine; production needs whitenoise or S3 (not Phase 1 concern)
- PyMySQL as Django driver: not deprecated, but never officially supported — mysqlclient is correct choice
- Tailwind v3 PostCSS approach: still functional but v4 is now the standard for new projects

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Planner should pin React to v18 and Vite to v5 to match PROJECT.md spec | Standard Stack | If using v19/v8, some plugins or guides may diverge; manageable but creates noise |
| A2 | `server.watch.usePolling: true` is needed for Windows/WSL2 Docker | Pitfall 7 | If running on Linux Docker natively, polling adds CPU overhead unnecessarily |
| A3 | `CORS_ALLOW_ALL_ORIGINS = True` in dev settings is sufficient | Code Examples | If browsers enforce stricter CORS in dev context, may need explicit origins |

---

## Open Questions

1. **React + Vite version: pin to PROJECT.md spec or use latest?**
   - What we know: PROJECT.md says React 18, Vite 5.x; npm latest is React 19, Vite 8
   - What's unclear: Whether the project intends to stay on v18/v5 for stability or upgrade to latest
   - Recommendation: Pin to PROJECT.md spec (React 18, Vite 5) and open a separate ticket to upgrade when ready

2. **Vite base path for sub-path SPAs (`/back-office/`, `/salle/`)**
   - What we know: D-05 routes `/back-office/` → Vite:3000, `/salle/` → Vite:3001, etc.
   - What's unclear: Whether each Vite app needs `base: '/back-office/'` in `vite.config.ts` so asset paths resolve correctly when proxied under a sub-path
   - Recommendation: Set `base: '/'` in dev (Nginx handles the prefix strip), set `base: '/back-office/'` for prod builds. For Phase 1 dev-only scaffold, `base: '/'` is fine.

3. **Nginx WebSocket port for Vite HMR: use `clientPort: 80` or dedicated port?**
   - What we know: `hmr.clientPort: 80` routes HMR WS through Nginx on port 80 (cleaner, fewer ports exposed)
   - What's unclear: Whether the path `/back-office/@vite/client` correctly matches the Vite HMR path after proxy
   - Recommendation: Use `clientPort: 80` approach; test with `docker compose up` and verify HMR fires.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | All services | ✓ | 29.4.0 | — |
| Docker Compose | Orchestration | ✓ | v5.1.2 | — |
| Node.js | Frontend SPA build | ✓ | v24.14.0 | — |
| npm | Frontend packages | ✓ | 11.9.0 | — |
| Python | Backend | ✓ | 3.14.3 | — |
| pip | Backend packages | ✓ (via Python) | — | — |

**Note on Docker Compose version:** PROJECT.md specifies "Docker Compose 3.9" (schema version). The installed Docker Compose CLI is v5.1.2, which supports schema `3.9` — fully compatible. The `version: '3.9'` key in `docker-compose.yml` is the YAML schema version, not the CLI version. [VERIFIED: docker.com docs]

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

> `workflow.strictNyquist: true` is set in `.planning/config.json` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `docker compose` smoke tests + `curl` health assertions |
| Config file | `docker-compose.yml` (already defined) |
| Quick run command | `docker compose up --build -d && sleep 5 && curl -s http://localhost/api/ \| grep -i "Not Found\|404"` |
| Full suite command | `docker compose ps` — all 7 services in `healthy` or `running` state |

> Phase 1 has no unit-testable business logic. All validation is infrastructure smoke testing (services up, ports reachable, DB accessible). Formal pytest/vitest harness is not yet set up. Wave 0 gap: create `tests/` structure for Phase 2.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-01 | All services start via Docker | smoke | `docker compose up --build -d && docker compose ps` | ❌ Wave 0 |
| SC-02 | Nginx responds on :80 | smoke | `curl -s -o /dev/null -w "%{http_code}" http://localhost/` | ❌ Wave 0 |
| SC-03 | Django API responds on /api/ | smoke | `curl -s http://localhost/api/` returns JSON or 404 (not 502) | ❌ Wave 0 |
| SC-04 | Back-office SPA loads at /back-office/ | smoke | `curl -s http://localhost/back-office/` returns HTML | ❌ Wave 0 |
| SC-05 | MySQL accepts connections | smoke | `docker compose exec db mysqladmin ping -h localhost` | ❌ Wave 0 |
| SC-06 | Redis accepts connections | smoke | `docker compose exec redis redis-cli ping` returns PONG | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `docker compose ps` — verify no service is `Exit`
- **Per wave merge:** Full suite — all 6 smoke checks pass
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/smoke/test_services.sh` — shell script wrapping the 6 curl + docker checks
- [ ] pytest not yet installed (needed from Phase 2 onwards)
- [ ] vitest not yet installed in SPAs (needed from Phase 5 onwards)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No — not in Phase 1 | — |
| V3 Session Management | No — not in Phase 1 | — |
| V4 Access Control | No — not in Phase 1 | — |
| V5 Input Validation | No — no endpoints yet | — |
| V6 Cryptography | Partial | `SECRET_KEY` must be generated securely; `.env` not committed to git |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `.env` with secrets committed to git | Information Disclosure | `.env` in `.gitignore`; only `.env.example` committed |
| `CORS_ALLOW_ALL_ORIGINS = True` in prod | Spoofing | Use only in `dev.py`; `prod.py` must use `CORS_ALLOWED_ORIGINS` whitelist |
| `DEBUG=True` in production | Information Disclosure | `DEBUG` read from `.env` via decouple; default `False` in `base.py` |
| Daphne `--proxy-headers` missing | Spoofing | Add `--proxy-headers` flag to Daphne command when behind Nginx to correctly read `X-Forwarded-For` |

---

## Sources

### Primary (HIGH confidence)
- [pip registry — Django 5.0.14, channels 4.3.2, daphne 4.2.1, channels_redis 4.3.0, mysqlclient 2.2.8, django-cors-headers 4.9.0, python-decouple 3.8, celery 5.6.3] — all verified via `pip index versions` live
- [npm registry — vite 8.0.10, react 19.2.5, tailwindcss 4.2.4, @tailwindcss/vite 4.2.4] — verified via `npm view` live
- [channels.readthedocs.io/en/stable/tutorial/part_1.html](https://channels.readthedocs.io/en/stable/tutorial/part_1.html) — INSTALLED_APPS order, ASGI_APPLICATION, asgi.py pattern
- [channels.readthedocs.io/en/stable/deploying.html](https://channels.readthedocs.io/en/stable/deploying.html) — Daphne CLI flags, Nginx WebSocket headers
- [tailwindcss.com/docs/installation/using-vite](https://tailwindcss.com/docs/installation/using-vite) — v4 Vite plugin setup
- [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme) — `@theme {}` design token syntax
- [vite.dev/config/server-options](https://vite.dev/config/server-options) — `allowedHosts`, `hmr.clientPort`, `watch.usePolling`
- [docs.djangoproject.com/en/5.0/ref/databases/](https://docs.djangoproject.com/en/5.0/ref/databases/) — MySQL driver recommendation, DATABASES config
- [docs.docker.com/compose/how-tos/startup-order/](https://docs.docker.com/compose/how-tos/startup-order/) — depends_on service_healthy syntax
- [github.com/django/channels_redis/](https://github.com/django/channels_redis/) — CHANNEL_LAYERS config, Redis >= 5.0 requirement

### Secondary (MEDIUM confidence)
- [iifx.dev — Vite allowedHosts / DNS rebinding issue in Docker](https://iifx.dev/en/articles/456620056/vite-s-blocked-request-a-deep-dive-into-allowed-hosts-and-docker-networking) — verified against vite.dev docs
- [aronschueler.de — HMR behind Nginx](https://aronschueler.de/blog/2024/07/29/enabling-hot-module-replacement-hmr-in-vite-with-nginx-reverse-proxy/) — cross-verified with Channels deploying docs

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified live against npm and pip registries
- Architecture: HIGH — patterns sourced from official Django Channels, Vite, and Tailwind docs
- Pitfalls: HIGH — each pitfall cross-referenced with at least one official source or live verification

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (30 days — stack is moderately stable; Tailwind and Vite move fast)

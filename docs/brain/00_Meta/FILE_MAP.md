# FILE_MAP — TastifyPFA

> Updated when repo structure changes. Source of truth for layout.

## Repository layout

```
tastify-pfa/
├── app/
│   ├── backend/                    # Django + Daphne + Channels
│   │   ├── media/                  # User-uploaded content (images)
│   │   ├── tastify_backend/
│   │   │   ├── settings/{base,dev,prod}.py
│   │   │   ├── urls.py           # API routes + OpenAPI/Swagger/ReDoc endpoints
│   │   │   ├── asgi.py            # Daphne entry — ProtocolTypeRouter
│   │   │   └── wsgi.py
│   │   ├── core/                  # Root config app, Channels middleware/consumers/helpers/tests (incl. API docs smoke tests)
│   │   ├── apps/                  # Domain apps
│   │   │   ├── users/             # Custom User model, Auth (Phase 2 & 3)
│   │   │   ├── menu/              # Categories & Dishes (Phase 4+)
│   │   │   ├── tables/            # Table model, API, and seed data
│   │   │   ├── reservations/      # Reservation domain
│   │   │   ├── commandes/         # Orders, order lines, total signals, and KDS orchestration
│   │   │   ├── paiements/         # Payment domain, payable-session services
│   │   │   ├── stock/             # Ingredients inventory
│   │   │   ├── hr/                # Employees (HR) domain
│   │   │   ├── analytics/         # Dashboard KPIs, aggregation logic
│   │   │   ├── avis/              # Customer reviews & sentiment analysis
│   │   │   ├── loyalty/           # Loyalty points & rewards system
│   │   │   └── configuration/      # Establishment personalization (SaaS)
│   │   ├── requirements.txt       # Backend runtime deps
│   │   ├── entrypoint.sh          # Migrations + optional empty-DB seed + Server start
│   │   └── Dockerfile
│   └── frontend/                  # 2 independent Vite SPAs
│       ├── backoffice-app/        # Staff — Vite :3000 — GERANT/SERVEUR/CUISINIER
│       │   ├── src/api/           # API wrappers (including configuration.ts)
│       │   ├── src/layouts/       # AppShell, Sidebar, Topbar
│       │   └── src/pages/
│       │       ├── Dashboard/     # Strategic Intelligence (High-End Motion)
│       │       ├── Settings/      # Establishment personalize (SaaS)
│       │       ├── HR/            # Personnel management
│       │       ├── Inventory/     # Stock & Ingredients
│       │       ├── Menu/          # Categories & Dishes management
│       │       ├── Staff/         # Table map & Reservations
│       │       └── Kds/           # Kitchen Display System
│       └── client-app/            # CLIENT — Vite :3003 — Public portal
│           ├── src/api/           # API wrappers
│           ├── src/store/         # Zustand stores (including configStore.ts)
│           ├── src/components/    # Shared UI/auth/branding primitives
│           ├── src/layouts/       # PublicLayout (Dynamic branding)
│           └── src/pages/
│               ├── Home/          # Bento-Command Landing (Horizontal Scroll)
│               ├── Menu/          # Cinematic Catalog
│               └── Reservations/  # Multi-step booking wizard
├── docs/                          # Obsidian Brain
│   ├── brain/                     # Knowledge base
│   └── cahier_de_charge_tastify.md
├── .planning/                     # GSD framework
│   ├── ROADMAP.md                 # Current phase tracking
│   ├── STATE.md                   # Current execution state
│   └── phases/                    # Phase-specific files
├── docker-compose.yml             # Single root Compose configuration
└── dashboard.html                 # Live project health dashboard
```

## Service routing (direct host ports)
| URL                  | Service            | Role          |
|----------------------|--------------------|---------------|
| `localhost:8000/api/`   | backend:8000       | Django REST   |
| `localhost:8000/api/docs/` | backend:8000    | Swagger UI    |
| `localhost:8000/api/redoc/` | backend:8000   | ReDoc         |
| `localhost:8000/api/schema/` | backend:8000  | OpenAPI schema |
| `localhost:8000/ws/`    | backend:8000       | Channels WS (Phase 13+) |
| `localhost:3000/`       | backoffice:3000    | GERANT / SERVEUR / CUISINIER |
| `localhost:3003/`       | portail:3003       | CLIENT        |

### SaaS Pivot & Design Philosophy
Tastify is an intelligent restaurant SaaS platform. Every establishment instance can be personalized via the `configuration` module for branding and contact identity, with the client portal now resolving a shared `BrandWordmark` fallback to `Tastify` when no custom restaurant name exists.
The current visual language follows the **Organic Sophistication** design system: warm parchment and terracotta surfaces, editorial serif display typography, Bricolage utility labels, and tonal card hierarchy rather than cold glass-heavy minimalism.
All services are containerized and orchestrated via Docker Compose, with a shared backend serving multiple specialized frontend interfaces.

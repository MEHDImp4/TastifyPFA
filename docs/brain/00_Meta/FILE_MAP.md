# FILE_MAP — TastifyPFA

> Updated when repo structure changes. Source of truth for layout.

## Repository layout

```
tastify-pfa/
├── backend/                       # Django + Daphne + Channels
│   ├── tastify_backend/
│   │   ├── settings/{base,dev,prod}.py
│   │   ├── urls.py
│   │   ├── asgi.py                # Daphne entry — ProtocolTypeRouter
│   │   └── wsgi.py
│   ├── core/                      # Root config app, Channels middleware/consumers/helpers/tests
│   ├── apps/                      # Domain apps
│   │   ├── users/                 # Custom User model, Auth (Phase 2 & 3)
│   │   │   ├── views/auth.py      # Cookie-based JWT views
│   │   │   ├── serializers.py     # Custom JWT claims
│   │   │   ├── urls.py
│   │   │   └── tests/test_auth.py
│   │   ├── menu/                  # Categories & Dishes (Phase 4+)
│   │   │   ├── models.py          # Soft-delete Categorie and Plat models
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── tables/                # Table model, API, and seed data
│   │   └── commandes/             # Orders, order lines, price snapshots, total signals
│   │       ├── models.py          # Commande and CommandeLigne
│   │       ├── signals.py         # montant_total recalculation
│   │       ├── migrations/
│   │       └── tests/
│   │           └── test_kds_permissions.py
│   ├── requirements.txt
│   ├── entrypoint.sh              # Applies pending migrations before Daphne starts
│   └── Dockerfile
├── frontend/                      # 2 independent Vite SPAs
│   ├── _shared/                   # Shared UI & Logic (Added Phase 3)
│   │   ├── auth/                  # Zustand Store, Login UI, Axios instance, role access gates
│   │   ├── websocket/             # Shared staff socket provider, store, and parsing helpers
│   │   ├── components/map/        # Shared TableMap/TableItem SVG components (Shared Phase 9)
│   │   ├── assets/                # Shared logo, icons
│   │   └── types/                 # Shared TypeScript interfaces
│   ├── back-office/               # Staff — Vite :3000 — GERANT/SERVEUR/CUISINIER
│   │   ├── vite.config.ts         # Dev server config without Vitest runtime dependency
│   │   ├── vitest.config.ts       # Vitest-only config for test environment setup
│   │   └── src/pages/
│   │       ├── Categories/        # Categories management (Phase 5)
│   │       ├── Plats/             # Plats management (Phase 7)
│   │       ├── Tables/            # Centralized Table map management (Added Phase 9)
│   │       └── Kds/               # Kitchen Display System (Phase 14)
│   │           ├── components/    # TicketCard, KdsTimer
│   │           ├── store/         # useKdsStore
│   │           ├── KdsPage.tsx
│   │           └── KdsSocketManager.tsx
│   └── portail-client/            # CLIENT  — Vite :3003 — /
├── nginx/                         # Legacy reverse-proxy config, not used by docker-compose.yml
│   └── nginx.conf
├── media/                         # User-uploaded content (images)
├── tests/
│   └── smoke/test_services.sh     # Wave 0 smoke harness
├── docs/                          # Obsidian Brain
│   ├── brain/                     # Knowledge base
│   │   └── 05_Resources/DEV_CREDENTIALS.md # Test logins
│   └── cahier_de_charge_tastify.md
├── .planning/                     # GSD framework
│   ├── ROADMAP.md                 # Current phase tracking
│   ├── PROJECT.md                 # Tech stack and decisions
│   ├── STATE.md                   # Current execution state
│   ├── audit_uat_report.md        # UAT audit results and human test plan
│   └── phases/                    # Phase-specific files
│       ├── 01-project-skeleton/
│       ├── 02-user-model-rbac/
│       ├── 03-auth-api-login/
│       ├── 04-categories-model-api/
│       ├── 05-categories-frontend/
│       ├── 06-plats-model-api/
│       ├── 07-plats-frontend/
│       ├── 08-tables-model-api/
│       ├── 09-tables-map-frontend/
│       ├── 10-commandes-model/
│       ├── 11-commandes-rest-api/
│       ├── 12-order-taking-frontend/
│       ├── 13-websocket-infrastructure/
│       └── 14-kds-base-frontend/
├── docker-compose.yml             # 5 services exposed directly on host ports
├── .env / .env.example            # Single root env
├── README.md
├── DESIGN.md
├── GEMINI.md
├── CLAUDE.md
├── AGENTS.md
└── dashboard.html
```

## Service routing (direct host ports)
| URL                  | Service            | Role          |
|----------------------|--------------------|---------------|
| `localhost:8000/api/`   | backend:8000       | Django REST   |
| `localhost:8000/ws/`    | backend:8000       | Channels WS (Phase 13+) |
| `localhost:3000/`       | backoffice:3000    | GERANT / SERVEUR / CUISINIER |
| `localhost:3003/`       | portail:3003       | CLIENT        |

Each Vite service proxies browser requests for `/api` and `/media` to `http://backend:8000` over the Compose network.
Shared login and staff route access use `frontend/_shared/auth/roleAccess.ts`: the staff frontend accepts GERANT/SERVEUR/CUISINIER, then redirects each role to its allowed home route and blocks direct access to unauthorized staff pages. The client frontend accepts only CLIENT. Ports `3001` and `3002` are retired.
The backend container starts through `backend/entrypoint.sh`, which runs `python manage.py migrate --noinput` before Daphne to prevent missing-table failures after new app migrations.

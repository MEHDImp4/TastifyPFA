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
│   ├── core/                      # Root config app
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
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                      # 4 independent Vite SPAs
│   ├── _shared/                   # Shared UI & Logic (Added Phase 3)
│   │   ├── auth/                  # Zustand Store, Login UI, Axios instance
│   │   ├── components/map/        # Shared TableMap/TableItem SVG components (Shared Phase 9)
│   │   ├── assets/                # Shared logo, icons
│   │   └── types/                 # Shared TypeScript interfaces
│   ├── back-office/               # GERANT  — Vite :3000 — /
│   │   ├── vite.config.ts         # Dev server config without Vitest runtime dependency
│   │   ├── vitest.config.ts       # Vitest-only config for test environment setup
│   │   └── src/pages/
│   │       ├── Categories/        # Categories management (Phase 5)
│   │       ├── Plats/             # Plats management (Phase 7)
│   │       └── Tables/            # Centralized Table map management (Added Phase 9)
│   ├── salle/                     # SERVEUR — Vite :3001 — /
│   │   ├── vite.config.ts         # Salle Vite config with shared alias and dependency dedupe
│   │   ├── vitest.config.ts       # Vitest-only config with framer-motion inlining
│   │   └── src/
│   │       └── pages/
│   │           ├── Map/           # MapView page and editor tests (Uses shared map components)
│   │           └── Ordering/      # Table-specific order-taking flow, cart store, menu browser, review drawer
│   ├── kds/                       # CUISINIER — Vite :3002 — /
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
│   └── phases/                    # Phase-specific files
│       ├── 01-project-skeleton/   # Wave 1: Infrastructure
│       ├── 02-user-model-rbac/    # Wave 2: User Core
│       ├── 03-auth-api-login/     # Wave 3: JWT & Login
│       ├── 04-categories-model-api/ # Wave 4: Menu Core (Finalized)
│       ├── 05-categories-frontend/ # Wave 5: Back-office Categories UI
│       ├── 06-plats-model-api/    # Wave 6: Dish API and backend rules
│       ├── 07-plats-frontend/     # Wave 7: Back-office Dishes UI context, research, and plans
│       ├── 08-tables-model-api/   # Wave 8: Table model, API, seed data, and tests
│       ├── 09-tables-map-frontend/ # Wave 9: Salle table map context, research, summaries, verification
│       ├── 10-commandes-model/    # Wave 10: Order model, signals, summaries, verification
│       ├── 11-commandes-rest-api/ # Wave 11: Commandes API plans, summaries, verification
│       └── 12-order-taking-frontend/ # Wave 12: Salle ordering context, plans, summaries, verification
├── docker-compose.yml             # 7 services exposed directly on host ports
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
| `localhost:3000/`       | backoffice:3000    | GERANT        |
| `localhost:3001/`       | salle:3001         | SERVEUR       |
| `localhost:3002/`       | kds:3002           | CUISINIER     |
| `localhost:3003/`       | portail:3003       | CLIENT        |

Each Vite service proxies browser requests for `/api` and `/media` to `http://backend:8000` over the Compose network.

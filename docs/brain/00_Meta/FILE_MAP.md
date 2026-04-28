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
│   │   └── menu/                  # Categories & Dishes (Phase 4+)
│   │       ├── models.py          # Soft-delete Categorie
│   │       ├── serializers.py
│   │       ├── views.py
│   │       └── urls.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                      # 4 independent Vite SPAs
│   ├── _shared/                   # Shared UI & Logic (Added Phase 3)
│   │   ├── auth/                  # Zustand Store, Login UI, Axios instance
│   │   └── assets/                # Shared logo, icons
│   ├── back-office/               # GERANT  — Vite :3000 — /back-office/
│   │   ├── vite.config.ts         # Dev server config without Vitest runtime dependency
│   │   ├── vitest.config.ts       # Vitest-only config for test environment setup
│   │   └── src/pages/
│   │       ├── Categories/        # Categories management (Phase 5)
│   │       └── Plats/             # Plats management (Phase 7)
│   ├── salle/                     # SERVEUR — Vite :3001 — /salle/
│   ├── kds/                       # CUISINIER — Vite :3002 — /kds/
│   └── portail-client/            # CLIENT  — Vite :3003 — /
├── nginx/
│   └── nginx.conf                 # Reverse proxy
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
│       └── 07-plats-frontend/     # Wave 7: Back-office Dishes UI context, research, and plans
├── docker-compose.yml             # 8 services (inc. db, redis)
├── .env / .env.example            # Single root env
├── README.md
├── DESIGN.md
├── GEMINI.md
├── CLAUDE.md
├── AGENTS.md
└── dashboard.html
```

## Service routing (Nginx :80)
| Path prefix       | Upstream            | Role          |
|-------------------|---------------------|---------------|
| `/api/`           | backend:8000        | Django REST   |
| `/ws/`            | backend:8000        | Channels WS (Phase 13+) |
| `/back-office/`   | backoffice:3000     | GERANT        |
| `/salle/`         | salle:3001          | SERVEUR       |
| `/kds/`           | kds:3002            | CUISINIER     |
| `/`               | portail:3003        | CLIENT        |

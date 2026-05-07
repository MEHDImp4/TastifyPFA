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
│   │   │   ├── urls.py
│   │   │   ├── asgi.py            # Daphne entry — ProtocolTypeRouter
│   │   │   └── wsgi.py
│   │   ├── core/                  # Root config app, Channels middleware/consumers/helpers/tests
│   │   ├── apps/                  # Domain apps
│   │   │   ├── users/             # Custom User model, Auth (Phase 2 & 3)
│   │   │   │   ├── views/auth.py  # Cookie-based JWT views
│   │   │   │   ├── serializers.py # Custom JWT claims
│   │   │   │   ├── urls.py
│   │   │   │   └── tests/test_auth.py
│   │   │   ├── menu/              # Categories & Dishes (Phase 4+)
│   │   │   │   ├── models.py      # Soft-delete Categorie and Plat models
│   │   │   │   ├── serializers.py
│   │   │   │   ├── views.py
│   │   │   │   └── urls.py
│   │   │   ├── tables/            # Table model, API, and seed data
│   │   │   ├── reservations/      # Reservation domain, migration, buffered availability services, and tests
│   │   │   ├── commandes/         # Orders, order lines, total signals, and KDS orchestration
│   │   │       ├── models.py      # Commande and CommandeLigne + Phase 15 scheduling fields
│   │   │       ├── signals.py     # montant_total recalculation + commit-safe orchestrator/broadcast triggers
│   │   │       ├── services/      # KDS orchestration services
│   │   │       ├── tasks.py       # Celery ETA launch tasks + staff broadcasts
│   │   │       ├── migrations/
│   │   │       └── tests/         # API, signal, permission, and orchestration regression coverage
│   │   │   ├── paiements/         # Payment domain, payable-session services, reconciliation logic, and split-bill tests
│   │   │   ├── stock/             # Ingredients inventory, JIT stock deduction, and seeding
│   │   │       ├── models.py      # Ingredient and PlatIngredient models with soft-delete
│   │   │       ├── serializers.py
│   │   │       ├── views.py
│   │   │       ├── tests/
│   │   │       └── services.py    # JIT stock deduction service triggered during KDS orchestration
│   │   │   ├── hr/                # Employees (HR) domain, salary, position, and personal details
│   │   │       ├── models.py      # Employe model linked to User
│   │   │       ├── serializers.py
│   │   │       ├── views.py
│   │   │       └── tests/
│   │   ├── requirements.txt
│   │   ├── entrypoint.sh          # Applies pending migrations before Daphne starts
│   │   └── Dockerfile
│   └── frontend/                  # 2 independent Vite SPAs
│       ├── shared/                # Shared UI & Logic (Added Phase 3)
│       │   ├── auth/              # Zustand Store, Login UI, authenticated/public Axios clients, portal scoping, role access gates
│       │   ├── ui/                # Shared crash boundary for both SPAs
│       │   ├── websocket/         # Shared staff socket provider, store, and parsing helpers
│       │   │   ├── StaffNotificationManager.tsx # Centralized audio/toast alerts
│       │   │   ├── staffSocket.ts
│       │   │   └── WebSocketProvider.tsx
│       │   ├── components/map/    # Shared TableMap/TableItem SVG components (Shared Phase 9)
│       │   ├── assets/            # Shared logo, icons
│       │   └── types/             # Shared TypeScript interfaces
│       │       ├── paiements.ts   # Payment-related types (Phase 27)
│       │       ├── reservations.ts
│       │       └── tables.ts
│       ├── backoffice/            # Staff — Vite :3000 — GERANT/SERVEUR/CUISINIER
│       │   ├── vite.config.ts     # Dev server config without Vitest runtime dependency
│       │   ├── vitest.config.ts   # Vitest-only config for test environment setup
│       │   ├── src/components/ui/Pagination.tsx # Shared client-side pagination controls for dense backoffice lists
│       │   ├── src/components/ui/Pagination.test.tsx
│       │   ├── src/authBootstrap.test.tsx # Covers non-blocking persisted-session bootstrap deadlines
│       │   ├── src/authPersistence.test.ts # Guards persisted auth-state sanitization on hydrate
│       │   ├── src/authRefreshSync.test.ts # Guards shared auth refresh role synchronization
│       │   ├── src/axiosInstance.test.ts # Verifies transient proxy startup retry classification + portal header resolution
│       │   └── src/pages/
│       │       ├── Categories/    # Categories management (Phase 5)
│       │       ├── Plats/         # Plats management (Phase 7)
│       │       │   └── index.test.tsx # Includes pagination reset coverage by category
│       │       ├── Stock/         # Ingredients and stock management with paginated list views
│       │       │   └── index.test.tsx
│       │       ├── Hr/            # HR management with paginated employee table
│       │       │   └── HrPage.test.tsx
│       │       ├── Tables/        # Centralized Table map management (Added Phase 9)
│       │       └── Kds/           # Kitchen Display System (Phase 14)
│       │           ├── components/ # TicketCard, KdsTimer
│       │           ├── store/     # useKdsStore
│       │           ├── KdsPage.tsx
│       │           └── KdsSocketManager.tsx
│       └── portail/               # CLIENT — Vite :3003 — login + reservation wizard SPA
│           ├── vitest.config.ts   # Vitest config for portail jsdom tests
│           └── src/
│               ├── api/reservations.ts # Client reservation API wrapper + time normalization
│               ├── test/setup.ts  # Testing Library / jest-dom setup
│               └── pages/Reservations/ # Wizard state, steps, and route shell for client booking
├── docs/                          # Obsidian Brain
│   ├── brain/                     # Knowledge base
│   │   └── 05_Resources/DEV_CREDENTIALS.md # Test logins
│   └── cahier_de_charge_tastify.md
├── .planning/                     # GSD framework
│   ├── ROADMAP.md                 # Current phase tracking
│   ├── PROJECT.md                 # Tech stack and decisions
│   ├── STATE.md                   # Current execution state
│   ├── .continue-here.md          # Active manual checkpoint / resume instructions
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
│       ├── 14-kds-base-frontend/
│       ├── 15-kds-orchestrator-logic/
│       ├── 16-order-push-to-kds/
│       ├── 23-reservations-model-api/
│       ├── 24-reservations-client-ui/
│       └── 26-qr-payment-split-bill/
├── docker-compose.yml             # Single root Compose configuration (consolidated)
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

Each Vite service proxies browser requests for `/api` and `/media` to `http://backend:8000` over the Compose network, and both dev servers now allow all hosts so Docker bridge access, `localhost`, and direct LAN-IP testing follow the same proxy path.
Shared login and staff route access use `app/frontend/shared/auth/roleAccess.ts`: the staff frontend accepts GERANT/SERVEUR/CUISINIER, then redirects each role to its allowed home route and blocks direct access to unauthorized staff pages. The client frontend accepts only CLIENT. Both SPAs now bootstrap persisted auth through `app/frontend/shared/auth/AuthBootstrap.tsx`, scope their persisted auth state through `app/frontend/shared/auth/portalContext.ts`, and surface render failures through `app/frontend/shared/ui/AppErrorBoundary.tsx`. Public QR payment pages bypass that bootstrap and use `app/frontend/shared/auth/publicClient.ts` so `/pay/:token` can resolve payment sessions without any JWT refresh. The backend mirrors that split with portal-specific refresh cookies in `app/backend/apps/users/views/auth.py`. Ports `3001` and `3002` are retired.
The backend container starts through `app/backend/entrypoint.sh`, which runs `python manage.py migrate --noinput` before Daphne to prevent missing-table failures after new app migrations.
`app/backend/apps/paiements/services.py` owns the payment-side invariant for `Table -> exactly one payable Commande`, while `app/backend/apps/commandes/signals.py` remains the only place that frees the table when the order reaches `PAYEE` or `ANNULEE`.

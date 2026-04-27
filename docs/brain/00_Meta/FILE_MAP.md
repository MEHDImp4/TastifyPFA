# FILE_MAP — TastifyPFA

> Updated when repo structure changes. Source of truth for layout.

## Repository layout

```
tastify-pfa/
├── backend/                       # Django + Daphne + Channels (Phase 1 Plan 02)
│   ├── tastify_backend/
│   │   ├── settings/{base,dev,prod}.py
│   │   ├── urls.py
│   │   ├── asgi.py                # Daphne entry — ProtocolTypeRouter
│   │   └── wsgi.py
│   ├── core/                      # Root config app (base models, middleware stubs)
│   ├── apps/                      # Domain apps (added Phase 2+)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                      # 4 independent Vite SPAs (Phase 1 Plan 03)
│   ├── back-office/               # GERANT  — Vite :3000 — /back-office/
│   ├── salle/                     # SERVEUR — Vite :3001 — /salle/
│   ├── kds/                       # CUISINIER — Vite :3002 — /kds/
│   └── portail-client/            # CLIENT  — Vite :3003 — /
├── nginx/
│   └── nginx.conf                 # Reverse proxy (Phase 1 Plan 04)
├── tests/
│   └── smoke/test_services.sh     # Wave 0 smoke harness (Phase 1 Plan 04)
├── docs/                          # Obsidian Brain
├── .planning/                     # GSD framework
├── phases/                    # Phase-specific plans, summaries, and UAT
│   ├── 01-project-skeleton/   # Phase 1 files
│   ├── 02-user-model-rbac/    # Phase 2 files (02-CONTEXT.md, 02-RESEARCH.md, 02-01-PLAN.md, 02-02-PLAN.md, 02-03-PLAN.md)
│   └── 03-auth-api-login/     # Phase 3 files (03-CONTEXT.md, 03-RESEARCH.md)├── docker-compose.yml             # 7 services (Phase 1 Plan 04)
├── .env / .env.example            # Single root env (Phase 1 Plan 01)
├── README.md
├── DESIGN.md
├── GEMINI.md
└── CLAUDE.md
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

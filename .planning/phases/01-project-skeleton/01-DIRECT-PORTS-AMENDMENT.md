---
phase: 1
slug: project-skeleton
status: complete
date: 2026-04-30
---

# Direct Ports Infrastructure Amendment

## Goal

Remove the Nginx service from local Docker Compose routing and expose each application service directly.

## Final Routing

| Service | Host URL |
|---------|----------|
| Back-Office | `http://localhost:3000/` |
| Salle | `http://localhost:3001/` |
| KDS | `http://localhost:3002/` |
| Portail Client | `http://localhost:3003/` |
| Backend API | `http://localhost:8000/api/` |
| Backend media | `http://localhost:8000/media/` |

## Implementation Notes

- `docker-compose.yml` now publishes backend and all four frontend ports directly.
- The Nginx service is removed from Compose.
- Each frontend Vite config runs at root and proxies `/api` and `/media` to `http://backend:8000`.
- Portal role redirects now use absolute URLs with direct frontend ports.
- Back-office routing no longer uses the `/back-office` basename.

## Validation

- Run `docker compose config` to validate Compose syntax.
- Run focused frontend tests for routing changes.
- Run frontend production builds where feasible.

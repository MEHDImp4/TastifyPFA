---
phase: 1
slug: project-skeleton
status: complete
date: 2026-04-30
---

# Direct Ports Infrastructure Amendment

## Goal

Remove the Nginx service from local Docker Compose routing and expose the backend plus the two active frontend applications directly.

## Final Routing

| Service | Host URL |
|---------|----------|
| Staff Frontend | `http://localhost:3000/` |
| Portail Client | `http://localhost:3003/` |
| Backend API | `http://localhost:8000/api/` |
| Backend media | `http://localhost:8000/media/` |

## Implementation Notes

- `docker-compose.yml` now publishes backend, staff frontend, and client frontend ports directly.
- The Nginx service is removed from Compose.
- Each frontend Vite config runs at root and proxies `/api` and `/media` to `http://backend:8000`.
- Shared role gates reject accounts used from the wrong frontend instead of redirecting between Portail Client and the unified staff frontend.
- Back-office routing no longer uses the `/back-office` basename.
- Salle and KDS runtime flows are consolidated into `frontend/back-office`, under `/salle`, `/tables/:id/order`, and `/kds`.

## Validation

- Run `docker compose config` to validate Compose syntax.
- Run focused frontend tests for routing changes.
- Run frontend production builds where feasible.
- `npm run test -- src/roleAccess.test.ts --run` in `frontend/back-office`: validates staff-only access on port `3000` and client-only access on port `3003`.

## Runtime Recovery

If a frontend reports missing dependencies after Compose routing changes, recreate frontend containers with fresh anonymous dependency volumes:

```powershell
docker compose up -d --build --force-recreate -V --remove-orphans backoffice portail
```

This preserves source bind mounts while replacing stale `/app/node_modules` volumes.

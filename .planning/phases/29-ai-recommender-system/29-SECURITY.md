---
phase: 29
title: AI Recommender System
status: secured
threats_open: 0
threats_closed: 5
updated: 2026-05-08T03:00:00Z
---

## Threat Register

| Threat ID | Category | Component | Disposition | Status | Evidence |
|-----------|----------|-----------|-------------|--------|----------|
| T-29-01-01 | Denial of Service | Celery Task | mitigate | CLOSED | `app/backend/apps/menu/views.py:65` (reads from cache instead of triggering task) and `app/backend/apps/menu/tasks.py:6` (`@shared_task` asynchronous task) |
| T-29-01-02 | Tampering | Redis Cache | mitigate | CLOSED | `app/backend/apps/menu/tasks.py:10` and `app/backend/apps/menu/ml/recommender.py:30` (cache contains only `{int: [int]}` similarities dictionary) |
| T-29-02-01 | Information Disclosure | `PlatViewSet` | mitigate | CLOSED | `app/backend/apps/menu/views.py:71` (`Plat.objects.active().filter(..., est_disponible=True)`) |
| T-29-03-01 | Spoofing | `MenuPage` | accept | CLOSED | React automatically escapes string bindings in JSX. |
| T-29-04-01 | Tampering | `menu.ts` | accept | CLOSED | Static frontend change, no new security boundaries introduced. |

## Accepted Risks

- **T-29-03-01**: Spoofing via `MenuPage`. React automatically escapes string bindings in JSX.
- **T-29-04-01**: Tampering via `menu.ts`. Static frontend change, no new security boundaries introduced.

## Security Audit 2026-05-08
| Metric | Count |
|--------|-------|
| Threats found | 5 |
| Closed | 5 |
| Open | 0 |

---
phase: 12-order-taking-frontend
status: passed
verified_at: "2026-04-30T00:38:00+01:00"
requirements: [ORD-FE-01, ORD-FE-02, ORD-FE-03, ORD-FE-04, ORD-FE-05]
---

# Phase 12 Verification: Order Taking Frontend

## Verdict

PASSED. The Salle UI now supports selecting a table, browsing dishes by category, building an isolated per-table cart, reviewing the order, and submitting it to the Phase 11 commandes API.

## Must-Haves

| Requirement | Status | Evidence |
| --- | --- | --- |
| Navigating to `/tables/:id/order` renders the ordering page | Passed | `OrderingPage.test.tsx` verifies route params render the table context. |
| `useOrderStore` manages separate carts per table | Passed | `useOrderStore.test.ts` covers isolation, totals, counts, decrement, and clear behavior. |
| Clicking a table redirects to its ordering page | Passed | `MapView.test.tsx` verifies navigation to `/tables/{id}/order`. |
| Horizontal category tabs switch menu categories | Passed | `CategoryTabs.tsx` and `DishGrid.test.tsx` verify category filtering behavior. |
| Dish cards show price, image/fallback, and quantity controls | Passed | `DishCard.tsx` renders price and +/- actions wired to the store. |
| Floating cart shows count and subtotal | Passed | `FloatingCart.tsx` reads count and total from the table cart. |
| Order review drawer itemizes the cart before confirmation | Passed | `OrderReview.test.tsx` verifies item rendering and confirmation callback. |
| Submission posts to `/api/commandes/` | Passed | `OrderingPage.tsx` sends `table` and nested `lignes` matching `CommandeSerializer`. |
| Success clears cart and returns to map | Passed | `OrderingPage.tsx` clears the table cart, shows success feedback, then redirects to `/`. |

## Automated Checks

| Command | Result |
| --- | --- |
| `npm run test -- useOrderStore.test.ts` | Passed, 5 tests |
| `npm run test -- OrderingPage.test.tsx` | Passed, 2 tests |
| `npm run test -- DishGrid.test.tsx` | Passed, 3 tests |
| `npm run test -- OrderReview.test.tsx` | Passed, 3 tests |
| `npm run test -- MapView.test.tsx` | Passed, 7 tests |
| `npm test` in `frontend/salle` | Passed, 5 files / 20 tests |
| `npm run build` in `frontend/salle` | Passed |

## Regression Notes

- `python manage.py test apps.commandes.tests` from `backend/` was attempted and blocked by environment: local Django uses MySQL host `db`, which is only resolvable inside Docker.
- `docker compose ps` was attempted next, but Docker Desktop is not running (`dockerDesktopLinuxEngine` pipe missing).
- This does not block the Phase 12 frontend verification because the UI submission payload was checked against the Phase 11 serializer contract in `backend/apps/commandes/serializers.py`.

## Residual Risk

- Full browser E2E against a live Docker stack remains pending until Docker Desktop is available.

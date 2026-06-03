---
phase: 12-order-taking-frontend
plan: 01
subsystem: salle-ordering
tags: [frontend, routing, state, tests]
key-files:
  created:
    - frontend/salle/src/pages/Ordering/store/useOrderStore.ts
    - frontend/salle/src/pages/Ordering/store/useOrderStore.test.ts
    - frontend/salle/src/pages/Ordering/OrderingPage.tsx
    - frontend/salle/src/pages/Ordering/OrderingPage.test.tsx
  modified:
    - frontend/salle/src/main.tsx
    - frontend/salle/src/App.tsx
    - frontend/salle/src/pages/Map/MapView.tsx
    - frontend/salle/src/pages/Map/MapView.test.tsx
metrics:
  tests_added: 7
  build: passed
---

# Plan 12-01 Summary: Infrastructure & State

## Completed

- Wrapped Salle in `BrowserRouter` and routed `/` to the map plus `/tables/:id/order` to the ordering flow.
- Added `useOrderStore` with isolated per-table carts, quantity increment/decrement, total calculation, and table-specific clearing.
- Added the `OrderingPage` controller scaffold with table id parsing, menu loading, cart wiring, and map return navigation.
- Updated `MapView` to navigate directly to the ordering page when a table is activated.

## Verification

| Check | Result |
| --- | --- |
| `npm run test -- useOrderStore.test.ts` | Passed |
| `npm run test -- OrderingPage.test.tsx` | Passed |
| `npm run test -- MapView.test.tsx` | Passed |
| `npm run build` | Passed |

## Deviations

- `react-router-dom`, `zustand`, and `framer-motion` were already present in `frontend/salle/package.json`, so no package installation was required.

## Self-Check

PASSED. Routing, table navigation, and isolated cart state satisfy the plan must-haves.

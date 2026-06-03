---
phase: 12-order-taking-frontend
plan: 03
subsystem: salle-ordering
tags: [frontend, cart, submission, tests]
key-files:
  created:
    - frontend/salle/src/pages/Ordering/components/FloatingCart.tsx
    - frontend/salle/src/pages/Ordering/components/OrderReview.tsx
    - frontend/salle/src/pages/Ordering/components/OrderReview.test.tsx
  modified:
    - frontend/salle/src/pages/Ordering/OrderingPage.tsx
metrics:
  tests_added: 3
  build: passed
---

# Plan 12-03 Summary: Cart Review & Submission

## Completed

- Added a fixed floating cart summary with item count, subtotal, and `AnimatePresence` entry/exit.
- Added the mandatory order review drawer with itemized quantities, subtotals, total, close action, and confirmation control.
- Implemented order submission to `POST /api/commandes/` using the backend serializer contract: `table` plus nested `lignes`.
- Added success handling that clears the table cart, shows confirmation feedback, and redirects back to the map after 1.5 seconds.
- Added retry-safe error handling that keeps the cart intact after a failed submission.

## Verification

| Check | Result |
| --- | --- |
| `npm run test -- OrderReview.test.tsx` | Passed |
| `npm run build` | Passed |

## Deviations

- The submission payload uses `table` rather than `table_id` because Phase 11 exposes the DRF `CommandeSerializer` field as `table`.

## Self-Check

PASSED. Floating cart, review drawer, and order submission behavior satisfy the plan must-haves.

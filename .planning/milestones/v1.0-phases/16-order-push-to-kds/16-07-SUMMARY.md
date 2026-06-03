# Phase 16-07 Summary: OrderingPage Fire Button (Wave 2)

## Implementation Details

### `frontend/back-office/src/pages/Staff/Ordering/OrderingPage.tsx`
- Added `isFiring` state to track the status of the "fire" request.
- Implemented `fireOrderToKitchen` handler which PATCHes the order status to `EN_CUISINE` and optimistically updates the local `activeOrder` state.
- Added the "Tout Envoyer en Cuisine" button JSX, gated by `activeOrder?.statut === 'EN_COURS' && isOwnOrder`.
- The button is positioned above the "Clôturer et Encaisser" button and shows a spinner during the request.

## Test Results
- **RED -> GREEN**:
  - `renders the "Tout Envoyer en Cuisine" button for an EN_COURS owned order (P16-FE-01)`
  - `hides the fire button when the order is not owned (P16-FE-01)`
  - `hides the fire button once order is EN_CUISINE (P16-FE-01)`
  - `PATCHes /commandes/{id}/ with {statut:"EN_CUISINE"} on click (P16-FE-02)`
- **Full Frontend Suite**: 119 tests passed.

## Verification
- `npm test -- --run OrderingPage` passed.
- `npx tsc --noEmit` passed.

## Commit
- `feat(16): add Tout Envoyer en Cuisine button to OrderingPage`

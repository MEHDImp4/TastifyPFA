# Phase 16-02 Summary: Frontend Test Scaffolding (Wave 0)

## Tests Added

### `frontend/back-office/src/pages/Staff/Ordering/OrderingPage.test.tsx`
- `renders the "Tout Envoyer en Cuisine" button for an EN_COURS owned order (P16-FE-01)` (RED)
- `hides the fire button when the order is not owned (P16-FE-01)` (PASSED - Button absent by default)
- `hides the fire button once order is EN_CUISINE (P16-FE-01)` (PASSED - Button absent by default)
- `PATCHes /commandes/{id}/ with {statut:"EN_CUISINE"} on click (P16-FE-02)` (RED)

### `frontend/back-office/src/pages/Kds/components/TicketCard.test.tsx`
- `applies animate-new-ticket class when isNew=true (P16-FE-03)` (RED)
- `does NOT apply animate-new-ticket when isNew=false (P16-FE-03)` (PASSED - Class absent by default)
- `removes animate-new-ticket class after 10 seconds (P16-FE-04)` (RED)

### `frontend/back-office/src/pages/Kds/store/useKdsStore.test.ts`
- `rejects EN_COURS orders on order_created (P16-FE-06)` (RED)
- `rejects EN_COURS orders on order_updated (P16-FE-06)` (RED)
- `adds the order id to newOrderIds when EN_CUISINE arrives via order_updated (P16-FE-05)` (RED)
- `clearNewOrder removes the id from newOrderIds (P16-FE-05)` (RED)
- `fetchOrders does NOT populate newOrderIds (P16-FE-05 / Pitfall 5)` (PASSED)

## Audio Asset
- Placeholder silent MP3 created at `frontend/back-office/public/sounds/kitchen-bell.mp3`.
- Size: 427 bytes.
- Header: Valid ID3/MPEG.
- **TODO for production deployment**: Replace with a real bell sound before launch.

## Status
- **RED count**: 8 failing tests out of 12 new tests.
- This is the expected state for Wave 0.

## Commit
- `test(16): scaffold Phase 16 wave-0 frontend tests + audio asset placeholder`

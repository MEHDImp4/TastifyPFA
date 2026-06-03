# Phase 16-05 Summary: KDS Store & WebSocket Integration (Wave 1)

## Implementation Details

### `frontend/back-office/src/pages/Kds/store/useKdsStore.ts`
- **New State**: Added `newOrderIds: Set<number>` to track orders that just arrived in the kitchen.
- **New Action**: Added `clearNewOrder(orderId)` to remove an order from the "new" set once its visual feedback is handled.
- **Tightened Filter**: Updated `isKitchenStatus` to strictly include `EN_CUISINE` and `PRETE`. `EN_COURS` orders are now ignored by the KDS store.
- **WebSocket Logic**: 
  - `order_updated` events with `statut: 'EN_CUISINE'` now populate `newOrderIds`.
  - Orders moving out of kitchen scope (e.g. `PAYEE`, `ANNULEE`) are removed from state AND `newOrderIds`.
  - `order_created` events do NOT trigger the "new" glow (since they are drafts until fired).

### `frontend/_shared/theme.css`
- **Animation**: Added `@keyframes new-ticket-glow` alternating box-shadow with a teal pulse.
- **Utility Class**: Added `.animate-new-ticket` utility class to apply the glow animation.

## Test Results
- **RED -> GREEN**:
  - `rejects EN_COURS orders on order_created (P16-FE-06)`
  - `rejects EN_COURS orders on order_updated (P16-FE-06)`
  - `adds the order id to newOrderIds when EN_CUISINE arrives via order_updated (P16-FE-05)`
  - `clearNewOrder removes the id from newOrderIds (P16-FE-05)`
  - `fetchOrders does NOT populate newOrderIds (P16-FE-05 / Pitfall 5)`
- **Updated Test**: `should remove order on order_updated if NOT isKitchenStatus anymore` now uses `PAYEE` status instead of `PRETE` (as `PRETE` is now a valid KDS status).

## Commit
- `feat(16): add newOrderIds tracking and new-ticket glow keyframe`

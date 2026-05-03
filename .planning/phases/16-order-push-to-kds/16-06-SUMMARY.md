# Phase 16-06 Summary: KDS Ticket Glow & Audio Feedback (Wave 3)

## Implementation Details

### `frontend/back-office/src/pages/Kds/components/TicketCard.tsx`
- Added `isNew` prop to support highlighting fresh arrivals.
- Implemented a 10-second glow lifecycle using `useState` and `useEffect`.
- Applies the `.animate-new-ticket` CSS class (defined in Plan 05) when `showGlow` is active.
- Ensures the glow timer is cleaned up on unmount.

### `frontend/back-office/src/pages/Kds/KdsPage.tsx`
- Refactored `useKdsStore` consumption to use individual selectors for better performance and to satisfy the new `newOrderIds` / `clearNewOrder` contract.
- Added a coordination effect that auto-clears `newOrderIds` membership 10 seconds after an order's arrival, ensuring consistency with the visual glow duration.
- Passed `isNew={newOrderIds.has(order.id)}` to the `TicketCard` component in the rendering loop.

### `frontend/back-office/src/pages/Kds/KdsSocketManager.tsx`
- Added audio feedback for manual fire events.
- Preloads `/sounds/kitchen-bell.mp3` on mount and stores it in a persistent `audioRef`.
- Plays the bell sound whenever an `order_updated` event delivers an `EN_CUISINE` order (manual fire).
- Gracefully handles browser autoplay policies by catching and swallowing `.play()` rejections.

## Test Results
- **RED -> GREEN**:
  - `src/pages/Kds/components/TicketCard.test.tsx`: All 3 glow lifecycle tests passing.
  - `src/pages/Kds/KdsPage.test.tsx`: Updated mock to handle individual store selectors; all tests passing.
- **Still RED (Expected for Plan 07)**:
  - `src/pages/Staff/Ordering/OrderingPage.test.tsx`: "Fire" button tests still failing as implementation is pending.

## Commit
- `feat(16): wire kds visual + audio feedback for fired tickets`

# Phase 12: Order Taking Frontend - Context

## Goal
Build the interactive interface in the Salle UI that allows servers to browse the menu, manage a cart for a specific table, and validate orders via the Phase 11 REST API.

## Locked Decisions
- **Routing Strategy**: Use separate routes for the ordering flow (e.g., `/tables/:id/order`). This ensures state isolation and a clean back-button experience.
- **Menu Layout**: Use horizontal scrollable tabs for categories at the top, with a responsive grid of dish cards below (showing images, names, and prices).
- **Cart State Management**: Use a dedicated Zustand store (`useOrderStore`) to persist the draft order for the active table. This prevents data loss during navigation or accidental refreshes.
- **Confirmation Flow**: Implement a mandatory summary review step. Before sending the `POST` request, the server must see a clear list of all items, quantities, and the total amount.
- **UI Aesthetic**: Follow the "Eco-Fresh" design system (Teal/Coral palette, Emil Kowalski's micro-interactions, responsive fluid layouts).

## Requirements
- **ORD-FE-01**: Dynamic routing to capture `tableId`.
- **ORD-FE-02**: Menu browser with category filtering (reuse pattern from Plats management but mobile-optimized).
- **ORD-FE-03**: Interactive dish cards:
  - Click to add to cart.
  - Quick quantity adjustments (+/-) if already in cart.
- **ORD-FE-04**: Floating Cart Summary:
  - Shows current item count and subtotal.
  - Clicking opens the full Summary Review.
- **ORD-FE-05**: Integration with `POST /api/commandes/`:
  - Atomic submission of the order and its lines.
  - On success: Show a "Success" animation and redirect back to the Map View.
  - On failure: Show clear error feedback.

## Technical Strategy
- **Store**: `useOrderStore` will track `currentTableId`, `items` (Array of `{platId, quantite, platData}`), and `isSubmitting`.
- **Navigation**: Use `react-router-dom` `useNavigate` and `useParams`.
- **Animations**: Use `framer-motion` for page transitions and cart slide-ins.

## References
- `frontend/salle/src/pages/Map/MapView.tsx`: Entry point from the table map.
- `backend/apps/commandes/serializers.py`: API contract for order submission.
- `DESIGN.md`: Visual and interaction guidelines.

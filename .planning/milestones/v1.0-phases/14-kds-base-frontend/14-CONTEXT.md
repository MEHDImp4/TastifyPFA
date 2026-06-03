# Phase 14 Context: KDS Base Frontend

## 1. Objective
Establish the foundational Kitchen Display System (KDS) interface for the `CUISINIER` role, integrating real-time WebSocket updates with an initial REST API data load.

## 2. Decision Log

### 2.1. Data Strategy
- **Initial Load:** The KDS will perform a `GET /api/commandes/?statut=EN_CUISINE` fetch on mount to populate existing orders.
- **Real-Time Sync:** WebSocket events (established in Phase 13) will be used to add new orders or update existing ones without page reloads.
- **Permissions:** The `CommandeViewSet` permissions will be updated to include `IsCuisinierOrGerant` for read operations.

### 2.2. User Interface (UI)
- **Layout:** **Horizontal Scroll**. Tickets will be displayed as vertical columns in a horizontally scrollable container, optimizing for touch-screen kitchen monitors.
- **Sorting:** **LIFO (Newest First)**. Newly arrived orders will appear at the "beginning" (left-most position) of the scrollable area.
- **Information Density:** **Lean Production**. 
    - **Visible:** Table Number, Elapsed Time (Timer), Item Names, Quantities, and Preparation Notes.
    - **Hidden:** Prices, Server Names (unless notes require it), and Order IDs (unless used for display).

### 2.3. Technical Logic
- **Timer:** Each ticket must have a client-side timer calculating elapsed time from `created_at`.
- **WebSocket Handling:** The `WebSocketProvider` (from Phase 13) is already available. The `KdsPage` will consume events from the `useStaffSocketStore`.
- **State Management:** A local state or a specialized Zustand store will manage the list of active kitchen tickets to ensure smooth transitions and avoid unnecessary re-renders.

## 3. Constraints
- **Role Lock:** The `/kds` route must remain restricted to `CUISINIER` and `GERANT` roles.
- **Performance:** Ensure that the horizontal scroll is hardware-accelerated and smooth even with 20+ active tickets.

## 4. Next Steps
- **Research Phase:** Investigate the best horizontal scroll implementation for React and how to efficiently update the timer without re-rendering the entire ticket list.
- **Planning Phase:** Break down the UI component architecture (KdsPage -> TicketList -> TicketCard).

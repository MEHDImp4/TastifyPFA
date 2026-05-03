# Phase 16 Context: Order Push to KDS

## 1. Objective
Introduce a professional "Manual Fire" workflow where servers explicitly send orders to the kitchen, ensuring the KDS only displays actionable tickets and orchestrates timing from the moment of dispatch.

## 2. Decided Architecture (Locked)

### 2.1 Workflow: Manual Fire
- **Draft State**: Orders created in the Salle UI start with status `EN_COURS`.
- **Action**: A "Tout Envoyer en Cuisine" button will be added to the `OrderingPage`.
- **Transition**: Clicking this button performs a `PATCH` request to flip the status to `EN_CUISINE`.
- **Scope**: The "Fire" action applies to the **entire order** (all lines) to maintain JIT orchestration stability.

### 2.2 KDS Visibility Filter
- **Filtering**: The KDS frontend and backend queries for CUISINIER must strictly exclude orders in `EN_COURS`.
- **Visibility**: Tickets only appear on the KDS rail when status is `EN_CUISINE` or `PRETE`.

### 2.3 Orchestration Trigger
- **Timing**: JIT Orchestration (calculation of `heure_lancement`) must only trigger when the order status transitions from `EN_COURS` to `EN_CUISINE`.
- **Logic**: This prevents stale timers if a server takes a long time to finalize a draft order at the table.

### 2.4 Kitchen UX (Feedback)
- **Audio**: Play a "Ticket Print" or "Bell" notification sound when a new ticket is added to the KDS via WebSocket.
- **Visual**: Apply a "New Ticket" pulse animation (e.g., green outer glow) to `TicketCard` for the first 10 seconds after arrival.

## 3. Implementation Targets

### 3.1 Backend (Django)
- Update `Commande` model/signals to trigger `KdsOrchestrator` specifically on `EN_CUISINE` transition.
- Ensure `CommandeViewSet` list view for CUISINIER role excludes `EN_COURS`.

### 3.2 Frontend (React)
- **OrderingPage**: Add "Envoyer en Cuisine" button and handling.
- **KDS**: Implement sound notification logic using a browser-compatible audio asset.
- **TicketCard**: Add entry animation and glow effect for new arrivals.

## 4. Reusable Patterns
- Use `broadcast_staff_event` for all WebSocket notifications.
- Use `transaction.on_commit` for orchestration triggers.
- Follow `ECO-FRESH` design system for the "Fire" button and glow effects.

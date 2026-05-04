# Phase 17: Order Status Updates - Context

## 1. Objective
Enable the Kitchen (Cuisine) to signal when dishes or entire orders are ready, and push these updates in real-time to the Dining Room (Salle) staff.

## 2. User Constraints
- **Cuisine Action**: In the KDS, a "Prêt" button must be added to each `CommandeLigne`.
- **Order Completion**: A "Terminer le Ticket" button in the KDS marks the entire `Commande` as `PRETE`.
- **Real-time Push**: Any status change (line or order) must be broadcasted via WebSocket using `broadcast_staff_event`.
- **Salle Feedback**: The Salle UI (OrderingPage or TablesMap) must display visual cues when an order is `PRETE` or has ready items.
- **Audio Notification**: Salle should play a notification sound when an order becomes `PRETE`.

## 3. Tech Stack
- **Backend**: Django, Channels, `broadcast_staff_event`.
- **Frontend**: React, Zustand, WebSocket events.

## 4. Dependencies
- **Phase 16**: Order must be in `EN_CUISINE` to be processed in KDS.
- **WebSocket Infrastructure**: `broadcast_staff_event` must be operational.

## 5. Out of Scope
- Customer-facing notifications (Phase 33+).
- Automated SMS/Push notifications.

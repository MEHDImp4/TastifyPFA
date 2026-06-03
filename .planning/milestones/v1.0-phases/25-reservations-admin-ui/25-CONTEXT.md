# Phase 25: Reservations Admin UI

## Context
Phase 25 focuses on the staff-side administration of reservations. This follows the implementation of the Reservations Model/API (Phase 23) and the Client UI (Phase 24). Staff (GERANT and SERVEUR) need to be able to manage the full lifecycle of a booking from the Back-Office and track upcoming reservations on the Salle map.

## Requirements
- **Back-Office Management**:
    - Centralized list of all reservations with pagination and filtering.
    - Status management: Staff can confirm, cancel, or mark clients as present/absent.
    - Creation/Edit form for staff to manually add bookings (e.g., phone reservations).
- **Salle UI Integration**:
    - Visibility of upcoming reservations in the Table Map.
    - Quick check-in action ("Marquer présent") from the table info panel.
- **Real-time Sync**:
    - Staff UI must update immediately when a client makes a new reservation on the portail.

## Actors
- **GERANT**: Full CRUD on all reservations.
- **SERVEUR**: Can view, create, and update statuses, but cannot delete.

## Tech Stack
- **Backend**: Django REST Framework, Django Channels (WebSockets).
- **Frontend**: React (Staff SPA), Zustand (Auth/WS stores), Framer Motion (UI).

## SUCCESS CRITERIA
1. Staff can view a paginated list of reservations filtered by date and status.
2. Staff can create a manual reservation and assign a table.
3. The Table Map info panel shows the "Next Reservation" for a selected table.
4. WebSocket notifications broadcast new client reservations to the staff dashboard.

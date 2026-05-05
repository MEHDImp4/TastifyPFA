# Phase 23 Research: Reservations Model & API

## Context & Constraints
- **Goal**: Implement a robust reservation system that allows clients to book tables for specific time slots.
- **Constraints**: 
    - A table cannot be reserved twice for the same time slot (overlapping check).
    - Table status should ideally reflect reservations (e.g., changing to `RESERVEE` shortly before the reservation time).
    - Clients can only see their own reservations.
    - Gérants and Serveurs can see and manage all reservations.

## Proposed Data Model: `apps.reservations`

### `Reservation` Model
- `client`: ForeignKey to `users.Utilisateur` (Role: CLIENT).
- `table`: ForeignKey to `tables.Table`.
- `date_reservation`: Date field.
- `heure_debut`: Time field.
- `heure_fin`: Time field (estimated).
- `nombre_personnes`: PositiveIntegerField.
- `statut`: Choices (CONFIRMEE, ANNULEE, PRESENT, ABSENT).
- `notes`: TextField (optional).
- `created_at`: DateTimeField.
- `updated_at`: DateTimeField.

## Business Logic: Availability Check
To check if a table is available for a given `date`, `start_time`, and `end_time`:
1. Query existing reservations for the same `table` and `date`.
2. Filter for reservations that are not `ANNULEE` or `ABSENT`.
3. Check for overlaps:
    - `existing_start < new_end` AND `existing_end > new_start`.

## API Endpoints (`/api/reservations/`)
- `GET /api/reservations/`:
    - Clients: Filtered by `client=request.user`.
    - Staff: All reservations.
- `POST /api/reservations/`:
    - Create a reservation.
    - Must validate table capacity against `nombre_personnes`.
    - Must perform the availability check.
- `PATCH /api/reservations/{id}/`:
    - Cancel (Client/Staff).
    - Update status (Staff).

## Risks & Edge Cases
- **Table Capacity**: Ensure the selected table can accommodate the requested number of people.
- **Buffer Time**: Do we need a buffer between reservations? (e.g., 15 mins for cleanup).
- **Table Status Sync**: How and when does `Table.statut` change to `RESERVEE`? 
    - Option A: Manual by Staff.
    - Option B: Celery task (beat) runs every X minutes to update status.
    - Option C: Dynamic calculation in the frontend map.

## Implementation Plan (Draft)
1. Scaffold `apps.reservations`.
2. Implement model with validation logic (clean/save).
3. Create serializers and viewsets with RBAC.
4. Add unit tests for overlap logic.

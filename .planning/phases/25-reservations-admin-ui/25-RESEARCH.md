# Phase 25 Research: Reservations Admin UI

## 1. Backend Extensions
- **Serializers**: `ReservationSerializer` needs to provide more info for the list view.
    - `client_details`: Nested field with `username` and `full_name`.
    - `table_details`: Nested field with `numero` and `capacite`.
- **Signals**: Need a `post_save` signal on `Reservation` to broadcast events to the `staff` group.
    - Events: `reservation_created`, `reservation_updated`.
- **Permissions**: `IsStaffOrOwnReservation` already exists, but we should verify it correctly allows `SERVEUR` to create and update status.

## 2. Frontend List View (Back-Office)
- **Pattern**: Follow `HrPage.tsx` and `Stock/index.tsx`.
- **Columns**: ID, Client, Table, Date, Slot (Start-End), Covers, Status, Actions.
- **Filters**:
    - `date`: Date picker (default: today).
    - `status`: Select dropdown.
    - `search`: Search input for client name/username.
- **Actions**:
    - `Check-in`: PATCH status to `PRESENTE`.
    - `No-show`: PATCH status to `ABSENTE`.
    - `Cancel`: PATCH status to `ANNULEE`.

## 3. Map View Integration (Salle)
- **Goal**: Help servers know when a table will be occupied.
- **API Change**: `TableSerializer` already has `statut_effectif`. We might want to add `prochaine_reservation` to the table details if it's within a certain window (e.g., next 2 hours).
- **UI**: In `MapView.tsx`, when a table is clicked:
    - If `statut_effectif === 'RESERVEE'`, show the active reservation details (Client name, End time).
    - If `statut_effectif !== 'RESERVEE'` but there's a booking soon, show "Réservée à HH:MM".

## 4. WebSocket Payload
- `type`: `reservation_updated`
- `payload`: The serialized reservation object.
- Group: `staff`.

## 5. Implementation Roadmap
- **Wave 1**: Backend signals and enriched Serializer.
- **Wave 2**: Back-office Reservations page (List + Drawer).
- **Wave 3**: Map View integration and real-time updates.

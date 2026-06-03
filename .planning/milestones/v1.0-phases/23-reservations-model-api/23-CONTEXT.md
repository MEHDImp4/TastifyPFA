# Phase 23 Context: Reservations Model & API

## Goal
Establish the backend infrastructure for table reservations, enabling clients to book tables and staff to manage those bookings.

## Key Requirements
- **Model**: `Reservation` linked to `Utilisateur` and `Table`.
- **Validation**: Strict overlap prevention and table capacity checks.
- **RBAC**: 
    - Clients: CRUD their own (with cancellation only via status update).
    - Staff: Full management.
- **API**: DRF ViewSet for `/api/reservations/`.

## Dependencies
- `Phase 2: User Model & RBAC` (Utilisateur model).
- `Phase 8: Tables Model & API` (Table model).

## User Choice Logic
- **Overlap Threshold**: Should we allow a 15-minute buffer? **Yes, default to 15 mins.**
- **Automatic Status Sync**: Should `Table.statut` change automatically? **Yes, via a lightweight check in the Table viewset or a periodic task.** For now, we'll implement it as a property or a dynamic check to keep it simple without adding too much background overhead.

## Verification Baseline
- [ ] Model unit tests (overlap, capacity).
- [ ] API integration tests (CRUD, RBAC).
- [ ] Edge case: Simultaneous booking attempts for the same table.

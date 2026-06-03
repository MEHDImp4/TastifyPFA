# Phase 27: Encaissement UI - Context

## Goal
Implement the frontend interfaces for payment management, enabling staff to handle cash/card payments and generate QR codes, and providing clients with a dedicated self-service payment landing page with split-bill support.

## Scope
- **Staff Frontend (Salle UI)**: A payment modal accessible from the table map and ordering page.
- **Client Frontend (Portail Client)**: A landing page reached via QR code for session resolution and splitting.
- **Real-time Sync**: Automated UI updates via WebSockets when payments are completed.

## Constraints
- Must use existing Phase 26 backend endpoints.
- Must adhere to the `ECO-FRESH` design system.
- QR tokens must be handled securely (signed, time-limited).

## Deliverables
- `PaymentModal.tsx` in `@backoffice/salle/components/`
- `/pay/:token` route and page in `@portail/pages/`
- Integration with `@shared/api/paiements` (if not already existing).

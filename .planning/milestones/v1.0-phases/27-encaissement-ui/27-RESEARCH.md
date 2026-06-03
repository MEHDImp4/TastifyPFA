# Phase 27: Encaissement UI - Research

## 1. Staff Workflow (Salle/Backoffice)
- **Entry Point**: The table map sidebar already has an "Actions" section. A "Régler l'addition" button will be added.
- **QR Generation**: The `TableViewSet` has a `GET /api/tables/{id}/qr/` endpoint. The frontend will fetch this and use a QR code library (e.g., `qrcode.react`) to display it.
- **Manual Payment**: Staff can select "Espèces" or "Carte". This will call `POST /api/paiements/` with the selected method.

## 2. Client Workflow (Portail Client)
- **Token Resolution**: The `/pay/:token` route will immediately call `POST /api/paiements/session/resolve/`.
- **Split Logic**:
    - **Total**: Pay the whole `montant_restant`.
    - **Partage Égal**: Client inputs number of guests. Frontend calls `POST /api/paiements/session/equal-split/` to preview shares.
    - **Partage par Article**: Frontend displays a list of unpaid lines. Client selects lines. Frontend calls `POST /api/paiements/session/item-split/` to preview.

## 3. Real-time Feedback
- **WebSocket**: The staff UI already listens to `staff_group`. When an order is paid, a message is broadcast. The `PaymentModal` should subscribe to these updates to close itself or show a success message.

## 4. Design & Components
- **Modal**: Use `@shared/ui/Modal`.
- **Split Cards**: Use `@shared/ui/Card` with distinctive icons (User, Group, List).
- **Progressive Disclosure**: Only show payment method selection after a split type is chosen.

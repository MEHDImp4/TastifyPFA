# Module: Interface Serveur (Salle)

This SPA is used by waiters on tablets or mobile devices to manage floor operations, take orders, and process payments.

## 1. Interactive Floor Plan
- **Visualization**: SVG or Canvas based representation of the restaurant layout.
- **Real-time Status**: Color-coded tables based on WebSocket updates.
  - Green: `libre`
  - Red: `occupée`
  - Blue: `réservée`
  - Amber: `encaissement`
- Clicking a free table opens a "New Order" modal.
- Clicking an occupied table opens the "Current Order Status" modal.

## 2. Order Taking
- Browsing menu by categories.
- Adding items with quantities and custom free-text notes.
- **Workflow**: 
  1. `POST /api/commandes/` creates the draft.
  2. `PATCH /api/commandes/{id}/envoyer/` sends it to the KDS.

## 3. Payments & Split Bill
- **QR Code Payments**: Waiter transitions table to `encaissement` which displays a static QR code tied to the table URL (e.g. `/client/table/{id}/paiement/`).
- **Split Bill Types**:
  - `split-egal`: Divides the total by N guests.
  - `split-individuel`: Guests pay for specific `ligne_id`.
- **Validation**: `PATCH /api/paiement/{commande_id}/valider/` marks order as `payee` and table as `libre`.

# Phase 27: Encaissement UI - Specification

## 1. Visual Language (ECO-FRESH)
- **Primary Color**: `#264653` (Ardoise)
- **Secondary Color**: `#2A9D8F` (Teal)
- **Accent Color**: `#E9C46A` (Amber) for splitting/partial actions.
- **Typography**: Inter (400, 600)

## 2. Components

### A. `PaymentModal` (Staff)
- **Header**: "Règlement - Table {numero}"
- **Body**:
    - **Order Summary**: Scrollable list of items with prices.
    - **Total Remaining**: Large display of `montant_restant`.
    - **QR Code Section**: "Générer QR de paiement" button -> fetches token -> displays QR.
    - **Manual Actions**: Row of buttons: [Espèces] [Carte].
- **Footer**: [Annuler]

### B. `PaymentPage` (Client)
- **URL**: `/pay/:token`
- **States**:
    - **Loading**: Pulse loader while resolving token.
    - **Selection**: 3 cards: "Payer le total", "Diviser la note", "Payer mes articles".
    - **Split Configuration**:
        - Equal split: Counter for guests.
        - Item split: Checkbox list of items.
    - **Summary**: Displays the amount to pay based on selection.
    - **Mock Payment**: "Confirmer le paiement" button (simulating external payment success).

## 3. Real-time Interactions
- **Table Release**: When a payment is confirmed, the table map should reflect the table becoming "LIBRE" (handled by existing Phase 11/26 signals + WebSocket).
- **Audio**: Staff UI plays a subtle "success" chime on full payment completion.

## 4. Technical Integration
- **Token Handling**: Tokens extracted from URL params in the Client UI.
- **Validation**: Frontend must check `montant_restant` before allowing split initiation.

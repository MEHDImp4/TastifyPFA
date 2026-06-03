# Phase 26 Plan 02 Summary: QR Token Authorization & Payment API Contracts

## Goal
Implement QR token authorization and public payment API contracts.

## Completed Tasks

### 1. QR Token System
- Implemented signed payment tokens in `tokens.py` using `django.core.signing.TimestampSigner`.
- Tokens are scoped to a specific `table_id` and `commande_id` with a configurable TTL (default 4 hours).
- Added `issue_payment_token` and `validate_payment_token` helpers.

### 2. Staff QR Issuance
- Added `GET /api/tables/{id}/qr/` endpoint to `TableViewSet` in `apps.tables`.
- Allows `SERVEUR` and `GERANT` to generate payment tokens for active, unique payable orders on a table.
- Enforces the single-payable-order rule during issuance.

### 3. Public Payment API Contracts
- Implemented several endpoints in `PaiementViewSet`:
  - `POST /api/paiements/session/resolve/`: Resolves a token to order details (total, paid, remaining).
  - `POST /api/paiements/session/equal-split/`: Returns calculated equal split shares for a token.
  - `POST /api/paiements/session/item-split/`: Validates and returns a preview of item-based contributions.
  - `POST /api/paiements/session/pay/`: Processes a payment using a token and transaction reference.
- Updated staff manual payment creation to support cash/card entries while rejecting self-service methods (QR).

### 4. Security & Safety
- Anonymous but token-authorized access for client-facing endpoints.
- Cross-check during payment to ensure the token's `commande_id` still matches the current payable session for the table.
- Atomic locking and reconciliation ensure order lifecycle integrity even with concurrent payments.

### 5. Verification
- 11 automated tests implemented and passed:
  - `test_tokens.py`: Verification of signer, TTL, and validation logic.
  - `test_api.py`: Verification of all payment endpoints, including split logic and staff manual paths.
  - Table QR endpoint verification.

## Verification Results
- **Automated**: All 11 tests passed.
- **Behavioral**: Clients can safely resolve tokens and pay for orders without a full staff account; staff can still manage payments traditionally.

## Next Step
- **Phase 27**: Encaissement UI (Salle UI modal and Client QR landing page).

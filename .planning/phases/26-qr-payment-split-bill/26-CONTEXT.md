# Phase 26: QR Payment & Split Bill Logic

## Context
Phase 26 introduces the payment and bill-splitting logic. This allows clients to pay their addition directly via a QR code at their table. The system supports equal splits (N parts) and individual splits (by item, including fractional contributions to items).

## Decisions
- **New App**: A dedicated `paiements` app will be created (`apps.paiements`) to handle all transaction-related logic.
- **Data Models**:
    - **Paiement**: Records a single financial transaction.
        - `commande` (FK to Commande)
        - `montant` (Decimal)
        - `methode` (ENUM: CARTE, ESPECES, EN_LIGNE)
        - `statut` (ENUM: EN_ATTENTE, COMPLETE, ECHOUE)
        - `reference_transaction` (String, for online payments)
    - **PaiementItem**: Links a `Paiement` to a `CommandeLigne`.
        - `paiement` (FK to Paiement)
        - `commande_ligne` (FK to CommandeLigne)
        - `montant_contribue` (Decimal) - Allows fractional payment of a single line.
- **Split Logic**:
    - **Equal Split**: Backend calculates `total / N`. Clients pay one or more "shares".
    - **Individual Split**: Clients select specific items to pay for. `PaiementItem` records which parts of which lines are covered.
- **QR Code Security**:
    - `GET /api/tables/{id}/qr/` will generate a signed URL using `django.core.signing`.
    - The token will include `table_id` and `commande_id` to ensure it only applies to the current session.
    - Expired orders or changed tables will invalidate old tokens.
- **Automation & Lifecycle**:
    - A signal or service method will check if `sum(Paiements) >= Commande.montant_total`.
    - Upon full payment:
        - `Commande.statut = 'PAYEE'`
        - `Table.statut = 'LIBRE'` (via existing or new signal).
- **Self-Service**:
    - Clients are authorized to initiate splits and post payments via the QR-signed route without staff intervention.

## Actors
- **CLIENT**: Initiates split and pays via QR.
- **SERVEUR / GERANT**: Can view payment progress and manually record payments (ESPECES).

## Success Criteria
1. `paiements` app registered and models migrated.
2. Endpoints for splitting (Equal/Individual) verified with unit tests.
3. Fractional payment logic prevents double-paying for the same line.
4. QR token generation and validation logic prevents cross-table or stale-order payment attempts.
5. Commande and Table statuses update automatically when the balance reaches zero.

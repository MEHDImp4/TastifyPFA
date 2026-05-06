# Phase 26 Plan 01 Summary: Payment Domain, Payable Session Resolution & Lifecycle Integrity

## Goal
Establish the backend payment domain and its non-UI invariants: persistent payment models, a single authoritative payable-session rule for table-to-order resolution, atomic split/lifecycle services, and backend validation.

## Completed Tasks

### 1. Scaffolded Payment App and Models
- Created `apps.paiements` app.
- Implemented `Paiement` and `PaiementItem` models.
- `Paiement` handles `commande`, `montant`, `methode`, `statut`, and `reference_transaction`.
- `PaiementItem` supports fractional item splits by linking a payment to a `CommandeLigne` with a `montant_contribue`.
- Added integrity constraints and indexes.
- Registered the app in settings.

### 2. Implemented Domain Services
- Created `PayableSession` resolver in `services.py`:
  - Enforces the "single-payable-order" rule for a table.
  - Rejects ambiguous states (multiple orders) or missing orders.
- Implemented split calculations:
  - Equal split with rounding absorption in the final share.
  - Item/fraction split with over-coverage validation.
- Wrapped operations in `transaction.atomic()` with `select_for_update()` to handle concurrency.

### 3. Lifecycle Signals
- Implemented signals in `signals.py`:
  - `recalculate_order_payment_status`: Triggered on payment completion to check if the total paid amount covers the order total.
  - Automatically transitions `Commande.statut` to `PAYEE`.
- Leveraged existing `apps.commandes.signals` to free the table once the order is paid.

### 4. Verification
- 16 automated tests implemented and passed:
  - `test_models.py`: Basic persistence and constraint validation.
  - `test_services.py`: Split math, rounding, and payable session resolution.
  - `test_signals.py`: Lifecycle transition from payment completion to `PAYEE`.
  - `test_table_sync.py`: Verification that table is freed after payment.

## Verification Results
- **Automated**: All 16 tests passed across models, services, and signals.
- **Behavioral**: Rounding is handled correctly; double-payment is prevented via atomic locking; table-to-order resolution is authoritative.

## Next Step
- **Phase 26 Plan 02**: QR Token Authorization & Payment API Contracts.

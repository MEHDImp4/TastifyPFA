# Phase 26: QR Payment & Split Bill Logic - Research

## 1. Domain Models & App Structure
The `paiements` app will be structured as a standard Django app within `app/backend/apps/`.

### Models
#### `Paiement`
- `commande`: FK(commandes.Commande, related_name='paiements', PROTECT)
- `montant`: DecimalField(10, 2)
- `methode`: CharField(choices=['CARTE', 'ESPECES', 'EN_LIGNE'])
- `statut`: CharField(choices=['EN_ATTENTE', 'COMPLETE', 'ECHOUE'], default='EN_ATTENTE')
- `reference_transaction`: CharField(max_length=255, blank=True)
- `created_at`, `updated_at`

#### `PaiementItem` (Fractional Split Support)
- `paiement`: FK(Paiement, related_name='items', CASCADE)
- `commande_ligne`: FK(commandes.CommandeLigne, related_name='paiement_items', PROTECT)
- `montant_contribue`: DecimalField(10, 2) - Supports partial payment of a line.

## 2. Split Logic Algorithms
### Equal Split (Part-based)
- Given `total` and `N` parts.
- Each part `amount = round(total / N, 2)`.
- The last part absorbs the rounding difference: `last_amount = total - (amount * (N-1))`.
- Clients can pay one or multiple "parts".

### Individual Split (Item-based)
- Clients select `CommandeLigne` IDs.
- For each selected line, they can specify a `contribution_amount`.
- **Validation Rule**: `sum(PaiementItem.montant_contribue) for ligne_id` must NOT exceed `ligne.quantite * ligne.prix_unitaire`.

## 3. Secure QR Payment Flow
### Token Generation
Using `django.core.signing.TimestampSigner`:
```python
from django.core.signing import TimestampSigner
signer = TimestampSigner()
token = signer.sign_object({
    "table_id": table.id,
    "commande_id": active_commande.id
})
```
- URL format: `http://portail.tastify.ma/pay/{signed_token}`.

### Token Validation
- Unsign with `max_age` (e.g., 2 hours).
- Verify `table_id` is still `OCCUPEE` and the `commande_id` matches the current active order for that table.
- If the table is `LIBRE` or has a new order, the token is invalid even if the signature is valid.

## 4. Lifecycle Hooks (Signals)
- **`post_save` on `Paiement`**:
    - If `statut == 'COMPLETE'`, check `sum(paiements)` for the associated `Commande`.
    - If `total_paid >= commande.montant_total`:
        - `commande.statut = 'PAYEE'`
        - `commande.save()`
- **Existing `sync_table_status_and_broadcast`**:
    - Already handles `table.statut = 'LIBRE'` when `commande.statut` becomes `PAYEE`.

## 5. Pattern Scouting
- **Service Pattern**: leverage `apps.stock.services.StockService` as a template for `PaiementService`.
- **Atomic Operations**: use `transaction.atomic()` and `select_for_update()` for financial calculations (especially item-level contribution checks).
- **RBAC**: 
    - `SERVEUR/GERANT`: Full access to all payments.
    - `CLIENT`: Access only via signed QR token (anonymous but token-authorized).

## 6. Technical Risks
- **Concurrency**: Multiple clients trying to pay for the same item in an individual split.
- **Rounding**: Ensuring total payments exactly match `montant_total`.
- **QR Stale Data**: Table turnover between token generation and payment. (Mitigated by signed `commande_id`).

## 7. Next Steps (Planning)
- [ ] Scaffold `paiements` app.
- [ ] Implement `Paiement` and `PaiementItem` models.
- [ ] Create `PaiementService` for split calculations and verification.
- [ ] Develop `QRTokenService` for signed payment URLs.
- [ ] Add REST API endpoints for split initiation and payment confirmation.

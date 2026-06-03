---
phase: 35
slug: click-and-collect
status: research
---

# Phase 35 Research: Click & Collect

## Model Changes
- `apps.commandes.models.Commande`:
  - `type`: `SUR_PLACE` (default), `EMPORTER`.
  - `client`: ForeignKey to `User`, optional (already exists in some form?). Wait, it doesn't.
  - `client_nom`: String for guest pickup.

## Pickup Identification
- For `EMPORTER` orders, instead of a table number, we use an `order_number` or the customer name.
- In KDS, the "Table" badge can show "E" (Emporter) or "BAG".

## Cart Logic (Frontend)
- `zustand` store for the cart.
- Persist in `localStorage`? (Yes, better UX).
- Cart items: `plat_id`, `quantite`, `notes`.

## Payment Integration
- Click & Collect usually requires prepayment.
- Reuse `apps.paiements` logic.

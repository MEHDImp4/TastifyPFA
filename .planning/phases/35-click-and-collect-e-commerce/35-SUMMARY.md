---
phase: 35
slug: click-and-collect
status: complete
---

# Phase 35 Summary: Click & Collect E-commerce

## Work Completed

### 1. Multi-Type Order Architecture
- **Backend**: Updated `Commande` model with a `type` field (`SUR_PLACE`, `EMPORTER`) and an optional `client_nom`.
- **Database**: Applied migrations to make `table` nullable for takeaway orders.
- **API**: Enhanced `CommandeSerializer` to validate that `table` is required only for dine-in orders.

### 2. Portail Shopping Cart
- **Store**: Implemented `useCartStore` with persistence to handle the customer's selection.
- **Menu UI**: Added "Ajouter" buttons to dish cards in the `MenuPage`.
- **Cart Interface**: Created `CartOverlay` drawer with:
  - Item quantity management.
  - Identification field for pickup name.
  - Switch for "Retrait" (Takeaway) selection.
  - Immediate checkout and kitchen submission.

### 3. KDS Identification
- **Store**: Updated `useKdsStore` to fetch and normalize `type` and `client_nom`.
- **UI**: Modified `TicketCard` in KDS to display a prominent "A EMPORTER" badge and show the client's name instead of a table number when applicable.

## Verification Results
- **Build**: Both `backoffice` and `portail` production builds pass.
- **Model**: `Commande` table successfully updated in DB.
- **Workflow**: E2E Click & Collect flow (Add to cart -> Checkout -> KDS View) technically verified.

## Next Steps
- **Phase 36**: Staff Scheduling & Recruitment (UC05).

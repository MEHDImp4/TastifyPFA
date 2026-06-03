---
phase: 35
slug: click-and-collect
status: discussion
---

# Phase 35: Click & Collect E-commerce

## Goal
Implement Click & Collect (Takeaway) ordering capabilities for customers via the Portail Client.

## Context
Currently, orders are tied to a physical `Table`. Click & Collect orders are not tied to a table but to a customer.
We need to support "Emporter" (Takeaway) orders that appear in the KDS but don't occupy a table on the map.

## Proposed Scope

### 1. Data Model Enhancement
- **Commande**: Add `type` field (SUR_PLACE, EMPORTER).
- **Table**: Allow `table` to be null for `EMPORTER` orders, or create a virtual "Click & Collect" table. (Roadmap suggests virtual table or null). Let's go with `table` being optional if `type=EMPORTER`.

### 2. Portail Client: Shopping Cart
- **Store**: Create a `useCartStore` in `portail`.
- **UI**: Add a shopping cart icon and drawer.
- **Workflow**: Browse menu -> Add to cart -> Checkout -> Payment -> Order Confirmed.

### 3. Staff UI: Pickup Validation
- **KDS**: Pickup orders should be clearly labeled as "A EMPORTER".
- **Validation**: Staff needs a way to mark a pickup order as "RETIRÉ" (Collected). We can use the existing `SERVI` status for this.

## Questions for Discussion
- [ ] Should we force online payment for Click & Collect? (Yes, for MVP to avoid no-shows).
- [ ] How to identify the customer for pickup? (Using `user` if authenticated, or a `pickup_name` field).

## Success Criteria
1.  Customer can add dishes to a cart in Portail Client.
2.  Customer can submit an "Emporter" order.
3.  Staff sees the "Emporter" order in KDS.
4.  Staff can mark it as "Ready" and "Collected".

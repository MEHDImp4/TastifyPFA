---
status: investigating
trigger: "Stock for ingredients (Ingredient.stock_actuel) does not decrease when an order is pushed to the kitchen in the real application, despite shell tests working."
created: 2026-05-14T10:00:00Z
updated: 2026-05-14T10:00:00Z
---

## Current Focus

hypothesis: Stock deduction logic is bypassed or rolled back during the real API request lifecycle.
test: Add logging to trace the flow in StockService and CommandeViewSet during a real API call.
expecting: Identify where the flow breaks or if a rollback occurs.
next_action: Identify the exact file paths for StockService and CommandeViewSet and add logging.

## Symptoms

expected: Ingredient.stock_actuel should decrease when a Commande is set to 'EN_CUISINE'.
actual: Stock remains unchanged in the real application.
errors: No explicit errors in logs (returns 200), but data is not updated.
reproduction: Use API to transition a Commande with items containing ingredients to 'EN_CUISINE'.
started: Unknown, persistent issue.

## Eliminated

## Evidence

## Resolution

root_cause: 
fix: 
verification: 
files_changed: []

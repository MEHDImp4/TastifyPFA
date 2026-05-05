# UAT Report: Phase 19 - Stock Management Frontend

## 1. Overview
**Phase**: 19 - Stock Management Frontend
**Date**: Tuesday, May 5, 2026
**Environment**: Local Development (staff frontend)

## 2. Test Cases

| ID | Description | Role | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| T1 | Sidebar Navigation | GERANT | "Stock" link exists and points to `/stock`. | PASSED | Verified in `Sidebar.tsx`. Access restricted to `['GERANT', 'CUISINIER']`. |
| T2 | Ingredient List | GERANT | Lists all ingredients with Nom, Unité, Stock, and Seuil. | PASSED | Verified in `Stock/index.tsx` and `IngredientList.tsx`. |
| T3 | Create Ingredient | GERANT | Can add a new ingredient with correct unit. | PASSED | Verified in `IngredientDrawer.tsx`. |
| T4 | Update Ingredient | GERANT | Can edit ingredient details (nom, seuil). | PASSED | Verified in `IngredientDrawer.tsx`. |
| T5 | Stock Adjustment | GERANT | Can update `stock_actuel` via adjustment modal. | PASSED | Verified in `StockAdjustmentModal.tsx`. Supports relative and absolute adjustments. |
| T6 | Low Stock Alerts | GERANT | Items below threshold are highlighted (Amber/Terracotta). | PASSED | Verified in `IngredientRow.tsx`. Uses `text-terracotta` and `text-amber` with animated pulses. |
| T7 | Alerts Filter | GERANT | "Alertes uniquement" toggle works. | PASSED | Verified in `Stock/index.tsx`. Filters by `stock_actuel <= seuil_alerte * 1.2`. |
| T8 | Recipe Management | GERANT | Can link ingredients to a dish in `PlatDrawer`. | PASSED | Verified in `PlatRecetteTab.tsx`. Supports CRUD for recipe links. |
| T9 | RBAC - Cuisinier | CUISINIER | Can see stock list but cannot edit/add. | PASSED | Verified: `isGerant` check hides "Ajouter" and "Edit/Delete" actions. |
| T10 | Mobile Layout | GERANT | Ingredient list displays correctly on mobile. | PASSED | Verified in `IngredientMobileCard.tsx`. |

## 3. Results Summary
- **Total Tests**: 10
- **Passed**: 10
- **Failed**: 0
- **Pending**: 0
- **UAT Verdict**: PASSED

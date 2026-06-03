# Phase 19 Context: Stock Management Frontend

## 1. Objective
Build the Back-Office interface for monitoring and managing ingredients, stock levels, and dish recipes (M2M links between Plats and Ingredients).

## 2. Implementation Decisions

### 2.1 Navigation & Access
- **Sidebar Entry**: New top-level item "Stock" with `Package` (Lucide) icon.
- **RBAC**:
    - `GERANT`: Full CRUD on Ingredients and PlatIngredients.
    - `CUISINIER`: Read-only access to view stock levels and alerts (to know what can't be cooked).
    - `SERVEUR`: No access.

### 2.2 Ingredient Management
- **View Pattern**: Standard `List/Table + Drawer` pattern used in Categories/Plats.
- **Fields**: Nom, Unité (g, ml, pcs), Stock Actuel, Seuil Alerte.
- **Soft Delete**: Deleting an ingredient sets `est_active=False`.

### 2.3 Recipe Management (Recettes)
- **Integration**: Add a "Recette" tab to the existing `PlatDrawer`.
- **Functionality**:
    - List ingredients currently linked to the dish.
    - Add/Remove links to ingredients.
    - Set `quantite_requise` per dish.
- **Context**: This prepares the ground for Phase 20 (Automated Deductions).

### 2.4 Stock Adjustment Workflow
- **Modal**: "Ajuster le Stock" triggered from the Ingredient list.
- **UX**: Provides `+/-` buttons and a numeric input to modify `stock_actuel` directly.
- **Validation**: Prevent negative stock values.

### 2.5 UI/UX & Feedback
- **Alert Highlights**:
    - **Amber (#E9C46A)**: Stock < 1.2x threshold.
    - **Terracotta (#E76F51)**: Stock <= threshold.
- **Filtering**: Quick toggle for "Alertes uniquement".
- **Mobile**: Full responsive support using `MobileCard` pattern for the stock list.

## 3. Reusable Assets
- `AppShell` & `Sidebar` for navigation.
- `AuthBootstrap` & `useAuthStore` for RBAC.
- `shared/ui` components (Buttons, Drawers, Inputs).
- `stock` API endpoints (verified in Phase 18).

## 4. Deferred / Out of Scope
- Stock movement history (Journal/Logs) — deferred to a future maintenance phase.
- Automatic deduction logic — scheduled for Phase 20.
- Supplier management — scheduled for Phase 37/38.

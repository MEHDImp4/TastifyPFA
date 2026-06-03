# Phase 19 Research: Stock Management Frontend

## 1. Codebase Analysis

### 1.1 Existing Navigation Pattern
- `Sidebar.tsx`: Already has a "Stock" entry pointing to `#` with `allowedRoles: ['GERANT']`.
- **Action**: Update `Sidebar.tsx` to point to `/stock` and update `allowedRoles` to include `['GERANT', 'CUISINIER']`.

### 1.2 Existing CRUD Patterns
- `Categories` & `Plats`: Use a `List/Table + Drawer` pattern.
- `PlatDrawer.tsx`: Uses `axiosInstance` for multipart/form-data (images) and JSON.
- **Action**: Clone this pattern for `Stock/IngredientList.tsx` and `Stock/IngredientDrawer.tsx`.

### 1.3 Recipe Management
- `PlatDrawer.tsx` currently only handles basic fields (nom, prix, etc.).
- **Action**: Refactor `PlatDrawer.tsx` to include a tabbed interface (e.g., using `useState` for active tab).
- **Tab 1**: Basic Info (existing fields).
- **Tab 2**: Recette (New). Will use `GET /api/stock/plat-ingredients/?plat={id}` and `POST/DELETE` for linking.

### 1.4 API Interaction (from Phase 18)
- `GET /api/stock/ingredients/`: List ingredients (filtered by `est_active` for non-GERANT).
- `POST /api/stock/ingredients/`: Create ingredient.
- `PATCH /api/stock/ingredients/{id}/`: Update (including `stock_actuel` for adjustments).
- `GET /api/stock/plat-ingredients/`: List recipe links.
- `POST /api/stock/plat-ingredients/`: Add ingredient to plat.
- `DELETE /api/stock/plat-ingredients/{id}/`: Remove ingredient from plat.

## 2. UI/UX Strategy

### 2.1 Stock Adjustment Modal
- Will be a small component in `Stock/` using `shared/ui/Modal` or `Drawer`.
- Numeric input with `Step` control for decimal precision (needed for `g` and `ml`).

### 2.2 Alerts Visualization
- Need a reusable helper to calculate "Warning" vs "Alert" status based on `stock_actuel` and `seuil_alerte`.
- CSS classes from `DESIGN.md`:
    - Warning: `text-amber-500` / `bg-amber-500/10`.
    - Alert: `text-red-500` / `bg-red-500/10`.

### 2.3 Mobile Layout
- Will use `MobileCard` pattern as seen in `Plats/PlatMobileCard.tsx`.

## 3. Risk Assessment
- **Role Sync**: Ensuring `CUISINIER` can see `/stock` but the `IngredientDrawer` remains read-only or hidden for them.
- **Concurrent Updates**: Simple PATCH on `stock_actuel` is fine for now, as full movement history is deferred.

## 4. Proposed File Structure
```
app/frontend/backoffice/src/pages/Stock/
├── index.tsx (Page wrapper + Routing)
├── IngredientList.tsx (Desktop Table)
├── IngredientMobileCard.tsx (Mobile List)
├── IngredientDrawer.tsx (Add/Edit/View)
├── StockAdjustmentModal.tsx (Quick Update)
└── types.ts (TypeScript interfaces)
```

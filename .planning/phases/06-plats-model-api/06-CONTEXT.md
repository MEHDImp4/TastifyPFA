# Phase 06: Plats Model & API - Context

## Objective
Implement the `Plat` (Dish) model and its associated REST API within the `menu` app. This phase bridges categories to actual products, enabling managers to define dishes with pricing and preparation times.

## Requirements
- **Model Definition**: Create a `Plat` model with fields for name, description, price, preparation time, category association, and availability.
- **API Endpoints**: Provide full CRUD operations for dishes at `/api/plats/`.
- **Soft Delete**: Implement the same soft-delete pattern used for categories.
- **RBAC**: Enforce hierarchical access—GERANT has full CRUD, while others have read-only access.
- **Filtering**: Automatically filter out unavailable or deleted dishes for non-manager roles.

## Success Criteria
- [ ] `Plat` model implemented in the `menu` app.
- [ ] Relationship between `Plat` and `Categorie` correctly established (Foreign Key).
- [ ] API endpoints functional and passing integration tests.
- [ ] RBAC permissions correctly gating access to dish management.

## Technical Decisions
- **D-06-01**: The `Plat` model will be housed in the existing `menu` app to keep menu-related logic consolidated.
- **D-06-02**: Preparation time will be stored in minutes as an IntegerField.
- **D-06-03**: Price will use a `DecimalField` for precision.
- **D-06-04**: Image handling will follow the same pattern as categories (using media storage).

## Scope
- `menu/models.py`: Add `Plat` model.
- `menu/serializers.py`: Add `PlatSerializer`.
- `menu/views.py`: Add `PlatViewSet`.
- `menu/urls.py`: Register `/api/plats/`.
- `tests/`: Add integration tests for dish CRUD and permissions.

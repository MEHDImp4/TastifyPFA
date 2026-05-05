# Phase 18: Validation

## Nyquist Compliance
All phase features must have verifiable, automated test coverage:

- **Models & Database**: 
  - `docker compose exec backend pytest apps/stock/tests/test_models.py -x`
  - Verifies: `Ingredient` fields, soft-delete method, and `PlatIngredient` M2M relationship logic.
- **REST API**:
  - `docker compose exec backend pytest apps/stock/tests/test_api.py -x`
  - Verifies: Correct CRUD behaviors, `IsGerant` permission restrictions, and exclusion of soft-deleted records from standard queries.
- **Signals & Real-Time Alerts**:
  - `docker compose exec backend pytest apps/stock/tests/test_signals.py -x`
  - Verifies: Only a crossing below `seuil_alerte` triggers a WebSocket notification, preventing spam on subsequent updates.

## Human Verification
- Ensure API endpoints properly map and correctly interpret base units on the frontend without any backend calculation altering them.
- Check WebSocket channels to confirm alert payload structure.

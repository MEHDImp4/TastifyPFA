# Phase 20 Summary: Automated Deductions

## Implementation Overview

Phase 20 focused on automating the deduction of stock ingredients when orders are launched for preparation. This ensures that the inventory levels accurately reflect the real-time usage in the kitchen.

### Key Components

1.  **StockService (`apps/stock/services.py`)**:
    - Centralized logic for ingredient deduction.
    - **Atomicity**: Uses `transaction.atomic` to ensure that either all ingredients for a dish are deducted or none are.
    - **Race Condition Prevention**: Employs `select_for_update()` to lock ingredient rows during the update process.
    - **Deadlock Prevention**: Ingredients are fetched and locked in a deterministic order (by ID) to avoid circular dependencies when multiple dishes share the same ingredients.
    - **Validation**: Raises `InsufficientStockError` if any ingredient falls below the required quantity.

2.  **JIT Task Integration (`apps/commandes/tasks.py`)**:
    - The `launch_item_task` now includes a call to `StockService.deduct_ingredients_for_plat`.
    - This ensures that stock is only deducted at the moment production actually begins (Just-In-Time).
    - Failure to deduct stock (e.g., due to insufficiency) will roll back the status change of the order line.

### Verification Results

- **Unit Tests**: `app/backend/apps/stock/tests/test_services.py` passed (3 tests).
- **Integration Tests**: `app/backend/apps/commandes/tests/test_stock_integration.py` passed (4 tests).
- **Dashboard**: Updated to reflect 50% project completion.

## Lessons Learned

- **Deterministic Locking**: Ordering by ID for `select_for_update` is a critical pattern for preventing deadlocks in high-concurrency environments like restaurant order processing.
- **Service Layer**: Keeping the deduction logic in a service layer rather than in signals or models makes the workflow more explicit and easier to test in isolation.

## Next Steps

Phase 21: Employees (HR) Model & API - Establishing the foundation for human resource management.

## Phase 28-04 Summary

Completed the async stock deduction migration for the order flow.

### Delivered
- Added `app/backend/apps/stock/tasks.py` with `deduct_stock_async`, a Celery task that loads the target `Plat`, performs ingredient deduction, and logs critical failures instead of crashing the order flow.
- Added `StockService.queue_deduction()` in `app/backend/apps/stock/services.py` as the async boundary for stock updates.
- Migrated order-side deduction call sites in `app/backend/apps/commandes/views.py` from synchronous service calls to queued Celery work when:
  - a line moves from `EN_ATTENTE` to `EN_PREPARATION`
  - an order moves from `EN_COURS` to `EN_CUISINE`
  - new lines are appended to an order already in `EN_CUISINE`
- Added regression coverage in `app/backend/apps/stock/tests/test_tasks.py`.
- Updated `app/backend/apps/commandes/tests/test_stock_integration.py` to reflect the current contract: `launch_item_task` no longer deducts stock directly, while the async deduction task handles failure logging and no-op recipe cases.

### Validation
- `docker compose exec -T backend python manage.py makemigrations --check`
- `docker compose exec -T -e MYSQL_USER=root -e MYSQL_PASSWORD=Tr5Hc9Vx2Bn8Lp4Wz7Mq1Ry3 backend pytest apps/stock/tests/test_tasks.py apps/stock/tests/test_services.py apps/commandes/tests/test_stock_integration.py -q`

### Outcome
- Order lifecycle transitions no longer block on stock deduction work.
- Stock failures are now isolated to the worker path and surfaced through logs for operational follow-up.

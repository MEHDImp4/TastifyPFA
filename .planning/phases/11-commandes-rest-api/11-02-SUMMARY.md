# Summary: Plan 11-02 - Table State Synchronization

## Work Completed
- Added `post_save` signal on `Commande` to sync `Table` status.
- Implemented logic to set table to `OCCUPEE` on order creation.
- Implemented logic to set table to `LIBRE` on order payment or cancellation.

## Verification
- `python backend/manage.py test apps.commandes.tests.test_table_sync`: 4/4 passed.
- Signal reliability verified with initial terminal status and reactivation edge cases.

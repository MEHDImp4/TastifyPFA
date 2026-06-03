# Summary: Plan 10-03 - Commande Total Signals

## Work Completed
- Added `signals.py` with `post_save` and `post_delete` receivers for `CommandeLigne`.
- Implemented `recalcul_montant_total` using database aggregation over non-cancelled lines.
- Wired signal registration through `CommandesConfig.ready()`.
- Added signal tests for line creation, quantity updates, deletion, cancellation, uncancellation, and empty-order totals.

## Verification Results
- `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test python backend\manage.py test apps.commandes.tests.test_signals`: 6/6 passed.
- `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test python backend\manage.py test apps.commandes`: 13/13 passed.
- `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test python backend\manage.py check`: passed.

## Deviations
- None.

## Self-Check
PASSED

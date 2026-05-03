# Phase 16-03 Summary: Backend Implementation (Wave 1)

## Implementation Details

### `backend/apps/commandes/services/orchestrator.py`
- Added a `statut` guard to `reorchestrate_order`.
- Orchestration is now strictly limited to `EN_CUISINE` orders.
- Prevents draft orders (`EN_COURS`) or completed orders from triggering Celery tasks.

### `backend/apps/commandes/signals.py`
- Added `capture_commande_statut_before_save` (`pre_save`) and `trigger_orchestration_on_en_cuisine` (`post_save`) receivers.
- Uses a module-level dictionary `_PREVIOUS_COMMANDE_STATUT` to track transitions.
- Triggers `KdsOrchestrator.schedule_reorchestration_after_commit` ONLY on `EN_COURS -> EN_CUISINE` transition.

### `backend/apps/commandes/tests/conftest.py`
- Updated `commande_with_lines` fixture to set `statut=EN_CUISINE` by default, ensuring existing orchestrator tests remain compatible with the new guard.

## Test Results
- **RED -> GREEN**:
  - `apps/commandes/tests/test_signals.py::TestCommandeFireTransitionSignal` (4 tests)
  - `apps/commandes/tests/test_orchestrator.py::test_reorchestrate_skips_when_not_en_cuisine`
  - `apps/commandes/tests/test_orchestrator.py::test_reorchestrate_skips_when_prete`
  - `apps/commandes/tests/test_api.py::FireOrderPatchTestCase::test_fire_order_owner_succeeds`
- **Remaining RED (Expected for Plan 04)**:
  - `test_fire_order_non_owner_serveur_forbidden` (404 != 403 due to queryset filtering)
  - `test_cuisinier_queryset_excludes_en_cours` (CUISINIER still sees EN_COURS)
  - `test_cuisinier_queryset_includes_en_cuisine_and_prete` (CUISINIER doesn't see PRETE yet)

## Commit
- `feat(16): gate orchestration on EN_COURS->EN_CUISINE transition`

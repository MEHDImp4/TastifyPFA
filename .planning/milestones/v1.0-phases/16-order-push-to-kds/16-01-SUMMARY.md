# Phase 16-01 Summary: Backend Test Scaffolding (Wave 0)

## Tests Added

### `backend/apps/commandes/tests/test_signals.py`
- `TestCommandeFireTransitionSignal.test_fire_transition_triggers_orchestrator` (RED)
- `TestCommandeFireTransitionSignal.test_en_cuisine_to_prete_does_not_trigger_orchestrator` (PASSED)
- `TestCommandeFireTransitionSignal.test_no_op_save_does_not_trigger_orchestrator` (PASSED)
- `TestCommandeFireTransitionSignal.test_create_with_en_cuisine_does_not_trigger_orchestrator` (PASSED)

### `backend/apps/commandes/tests/test_orchestrator.py`
- `test_reorchestrate_skips_when_not_en_cuisine` (RED - FieldError: MagicMock.id)
- `test_reorchestrate_skips_when_prete` (RED - FieldError: MagicMock.id)

### `backend/apps/commandes/tests/test_kds_permissions.py`
- `KDSPermissionsTestCase.test_cuisinier_queryset_excludes_en_cours` (RED - 404/Assertion)
- `KDSPermissionsTestCase.test_cuisinier_queryset_includes_en_cuisine_and_prete` (RED - Assertion)

### `backend/apps/commandes/tests/test_api.py`
- `FireOrderPatchTestCase.test_fire_order_owner_succeeds` (PASSED)
- `FireOrderPatchTestCase.test_fire_order_non_owner_serveur_forbidden` (RED - 404 instead of 403)
- `FireOrderPatchTestCase.test_fire_order_gerant_can_override_ownership` (PASSED)

## Status
- **RED count**: 6 failing tests/errors out of 11 new/updated tests.
- All existing tests (41 in `apps/commandes`) continue to pass where applicable.

## Notes
- Updated `backend/tastify_backend/settings/test.py` to use `memory://` broker and `InMemoryChannelLayer` for isolated host testing.
- Added Rule 11 to `GEMINI.md` (Gemini 3.1 PRO mandate).
- Verified `pytest-mock` installation.

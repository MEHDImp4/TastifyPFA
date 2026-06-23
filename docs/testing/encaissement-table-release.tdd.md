# Encaissement Table Release TDD Evidence

## Source plan

User-provided implementation plan in chat: fix manual staff payment so a fully paid table leaves `OCCUPEE` and becomes `LIBRE`.

## User journeys

- As a serveur, I want cash/card encaissement to send backend-native payment methods, so the payment is accepted and reconciled.
- As staff, I want a fully paid table to become free, so the salle view is ready for the next clients.
- As a client, I want QR payment to free the table after the order is paid, so staff sees the table available again.

## Task report

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|--------------------|----------------------|-----------|--------|----------|
| 1 | Manual cash payment sends `ESPECES` and returns to `/salle` after success. | `app/frontend/backoffice-app/src/pages/Staff/OrderingPage.test.tsx` | Unit | PASS | `npx vitest run src/pages/Staff/OrderingPage.test.tsx`: 2 passed |
| 2 | Manual card payment sends `CARTE` and returns to `/salle` after success. | `app/frontend/backoffice-app/src/pages/Staff/OrderingPage.test.tsx` | Unit | PASS | `npx vitest run src/pages/Staff/OrderingPage.test.tsx`: 2 passed |
| 3 | Full staff manual payment marks the commande `PAYEE` and table `LIBRE`. | `app/backend/apps/paiements/tests/test_api.py` | API integration | PASS | `docker compose exec backend pytest -q -c /dev/null --ds=tastify_backend.settings.test apps/paiements/tests/test_api.py apps/paiements/tests/test_services.py apps/commandes/tests/test_table_sync.py`: 22 passed |
| 4 | Back-office unit suite remains green. | `app/frontend/backoffice-app` | Unit suite | PASS | `npm run test:unit`: 9 files, 27 tests passed |
| 5 | QR token payment marks the commande `PAYEE` and leaves the table `LIBRE`. | `app/backend/apps/paiements/tests/test_api.py::TestPaiementAPI::test_pay_token_success` | API integration | PASS | RED: table was `OCCUPEE`; GREEN: targeted test passed, then backend suite passed |

## Known gaps

- The repository `app/backend/pytest.ini` currently references `django.utils.deprecation.RemovedInDjango61Warning`, which is unavailable in the installed Django version. The backend verification used `-c /dev/null --ds=tastify_backend.settings.test` to bypass that pre-existing config issue without editing unrelated user changes.
- `npm run typecheck` currently fails in `src/pages/HR/HrPage.tsx` on unrelated HR changes: an unused `Clock` import and `type_contrat` typed as `string` instead of the `OffreEmploi` union.

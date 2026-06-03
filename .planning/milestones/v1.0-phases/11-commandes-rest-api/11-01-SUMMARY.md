# Summary: Plan 11-01 - Serializers & ViewSet Foundation

## Work Completed
- Implemented `CommandeLigneSerializer` and `CommandeSerializer` with nested support.
- Implemented `create()` in `CommandeSerializer` with `transaction.atomic()`.
- Implemented `CommandeViewSet` with ownership-based filtering for `SERVEUR` role.
- Registered the `commandes` endpoint in `api_router.py`.

## Verification
- `python backend/manage.py test apps.commandes.tests.test_api`: 3/3 passed.
- Atomic creation and RBAC verified via automated tests.

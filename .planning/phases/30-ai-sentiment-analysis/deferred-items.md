# Deferred Items - Phase 30

## Out of Scope Discoveries

### 1. Bug in apps/hr/serializers.py
- **File:** `app/backend/apps/hr/serializers.py`
- **Issue:** `ChoiceField` is initialized with `max_length=20`, which is not a valid argument for `serializers.ChoiceField`. This causes a `TypeError` during Django system checks.
- **Impact:** Prevents running commands that perform system checks (like `makemigrations`, `migrate`, `runserver`) unless `--skip-checks` is used.
- **Resolution:** Remove `max_length=20` from the `role` field in `EmployeSerializer`.

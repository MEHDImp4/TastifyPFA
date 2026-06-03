---
phase: 2
slug: user-model-rbac
status: ready
created: 2026-04-27
---

# Phase 2: User Model & RBAC - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the custom User model (`Utilisateur`) and the Role-Based Access Control (RBAC) foundation. This phase focus is on the backend model, role definitions, and DRF permission classes. Authentication (JWT) is deferred to Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Custom User Model
- **D-01:** Model named `Utilisateur` (or `User`) extending `AbstractUser`.
- **D-02:** Fields: `role` (ENUM/Choices: GERANT, SERVEUR, CUISINIER, CLIENT).
- **D-03:** No extra operation-specific fields (like telephone) for now; stick to standard `AbstractUser` fields.
- **D-04:** Deletion strategy: standard Django `is_active=False` (no true soft-delete for now).

### RBAC Structure
- **D-05:** **Hierarchical roles**: `GERANT` inherits all permissions of other staff roles. `CLIENT` is the base role.
- **D-06:** Permission classes localized in `backend/apps/users/permissions.py`.

### Developer Experience (Wave 0)
- **D-07:** Implement a management command `seed_dev` to automatically create one test user for each role.

</decisions>

<canonical_refs>
## Canonical References

### Design system
- `DESIGN.md` — Not directly applicable to this backend-only phase, but role-based SPA access (GERANT vs CLIENT) is defined here conceptually.

### Project architecture rules
- `.planning/PROJECT.md` — Confirms the 4-role RBAC mandate.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/core/` — Contains base config and health checks.

### Established Patterns
- App registration convention: `apps.<name>`.
- Settings module selection via env var.

### Integration Points
- `AUTH_USER_MODEL` must be updated in `backend/tastify_backend/settings/base.py`.
- New `users` app to be created under `backend/apps/`.

</code_context>

<specifics>
## Specific Ideas

- Use a clean `TextChoices` class for roles to ensure type safety in the backend.
- Ensure the `seed_dev` command uses the `create_superuser` and `create_user` methods correctly to handle hashing.

</specifics>

<deferred>
## Deferred Ideas

- **JWT Auth:** Deferred to Phase 3.
- **Detailed Staff Profiles:** (e.g. `date_embauche`) Deferred to Phase 21 (HR Model).

</deferred>

---

*Phase: 02-user-model-rbac*
*Context gathered: 2026-04-27*

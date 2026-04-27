---
phase: 3
slug: auth-api-login
status: ready
created: 2026-04-27
---

# Phase 3: Auth API & Login Page - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement JWT authentication for the Django backend and the corresponding Login UI for the 4 React SPAs. The backend must issue access tokens in JSON payloads and securely store refresh tokens in HttpOnly cookies to mitigate XSS risks. The frontend must manage auth state using Zustand and handle automatic token refreshing via Axios interceptors. A shared Login component will be created to avoid code duplication across the SPAs.

</domain>

<decisions>
## Implementation Decisions

### Backend Auth (JWT)
- **D-01:** Library: `djangorestframework-simplejwt`.
- **D-02:** Token Strategy: Access token returned in JSON (stored in memory on frontend). Refresh token securely stored in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- **D-03:** Endpoints required: `POST /api/auth/login/`, `POST /api/auth/refresh/` (reads cookie), `POST /api/auth/logout/` (clears cookie).

### Frontend Architecture
- **D-04:** UI Sharing: Create a shared Login component in `frontend/_shared/` that is imported into the Back-office, Salle, KDS, and Portail Client SPAs.
- **D-05:** State Management: Use **Zustand** for lightweight, global auth state management (`isAuthenticated`, `user`, `role`, `accessToken`).
- **D-06:** API Client: Configure an **Axios** instance with interceptors to automatically attach the access token to outgoing requests and intercept 401 Unauthorized responses to seamlessly call the refresh endpoint.

</decisions>

<canonical_refs>
## Canonical References

### Project architecture rules
- `.planning/PROJECT.md` — Confirms "Access and refresh tokens are managed by the frontend, with refresh tokens securely stored in HttpOnly cookies to prevent XSS."

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/apps/users/` — Contains the custom `Utilisateur` model and roles established in Phase 2.
- `frontend/_shared/` — Exists for shared assets like `theme.css`.

### Integration Points
- DRF settings in `backend/tastify_backend/settings/base.py` must be updated to configure `DEFAULT_AUTHENTICATION_CLASSES`.
- Vite configurations (`vite.config.ts`) across all 4 SPAs must support importing from `frontend/_shared/`.

</code_context>

<specifics>
## Specific Ideas

- Customizing `TokenObtainPairView` from `simplejwt` is necessary to set the HttpOnly cookie for the refresh token upon successful login.
- The `Axios` interceptor logic must handle a queue of failed requests while the refresh token is being renewed to prevent multiple simultaneous refresh calls.

</specifics>

<deferred>
## Deferred Ideas

- **Role-based routing/guards:** While the login returns a role, comprehensive route guards for each SPA might be refined in later phases (e.g., Phase 4+ when actual protected views exist).
- **OAuth/Social Login:** Deferred. Stick to standard email/password or username/password for now.

</deferred>

---

*Phase: 03-auth-api-login*
*Context gathered: 2026-04-27*

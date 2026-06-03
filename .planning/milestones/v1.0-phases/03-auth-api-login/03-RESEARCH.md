# Phase 3: Auth API & Login Page - Research

**Researched:** 2026-04-27
**Domain:** Authentication (JWT, HttpOnly Cookies, Axios Interceptors)
**Confidence:** HIGH

## Summary
This phase focuses on implementing a secure authentication system using `djangorestframework-simplejwt` for the backend and a combination of Zustand and Axios for the frontend. The architecture is designed to mitigate XSS risks by storing the refresh token in an `HttpOnly` cookie and the access token in memory. A critical component is the Axios interceptor logic, which must robustly handle simultaneous requests and automatic token refreshing through a queueing mechanism.

**Primary recommendation:** Use a customized `TokenObtainPairView` to set the HttpOnly cookie and implement a thread-safe (via queueing) Axios response interceptor on the frontend.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Library: `djangorestframework-simplejwt`.
- **D-02:** Token Strategy: Access token returned in JSON (stored in memory on frontend). Refresh token securely stored in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- **D-03:** Endpoints required: `POST /api/auth/login/`, `POST /api/auth/refresh/` (reads cookie), `POST /api/auth/logout/` (clears cookie).
- **D-04:** UI Sharing: Create a shared Login component in `frontend/_shared/` that is imported into the Back-office, Salle, KDS, and Portail Client SPAs.
- **D-05:** State Management: Use **Zustand** for lightweight, global auth state management (`isAuthenticated`, `user`, `role`, `accessToken`).
- **D-06:** API Client: Configure an **Axios** instance with interceptors to automatically attach the access token to outgoing requests and intercept 401 Unauthorized responses to seamlessly call the refresh endpoint.

### the agent's Discretion
- Customizing `TokenObtainPairView` from `simplejwt` is necessary to set the HttpOnly cookie for the refresh token upon successful login. [VERIFIED: SimpleJWT docs]
- The `Axios` interceptor logic must handle a queue of failed requests while the refresh token is being renewed to prevent multiple simultaneous refresh calls. [VERIFIED: Axios advanced patterns]

### Deferred Ideas (OUT OF SCOPE)
- **Role-based routing/guards:** While the login returns a role, comprehensive route guards for each SPA might be refined in later phases (e.g., Phase 4+ when actual protected views exist).
- **OAuth/Social Login:** Deferred. Stick to standard email/password or username/password for now.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | JWT Login Endpoint | `djangorestframework-simplejwt` standard setup with custom View for cookies. |
| AUTH-02 | JWT Refresh Endpoint | Custom view reading `refresh_token` from HttpOnly cookie. |
| AUTH-03 | JWT Logout Endpoint | View to clear `refresh_token` cookie. |
| AUTH-04 | Shared Login Component | Pattern for Vite cross-directory imports (`@shared` alias). |
| AUTH-05 | Frontend Auth Store | Zustand implementation for session persistence and tokens. |
| AUTH-06 | Axios Interceptors | Robust response interceptor with refresh queueing logic. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Issue Access & Refresh Tokens | API / Backend | — | Core auth logic resides in Django DRF. |
| Store Refresh Token | Browser / Client | — | Managed securely by the browser via HttpOnly cookies set by the backend. |
| Store Access Token | Browser / Client | — | Kept in JavaScript memory (Zustand) to prevent XSS exfiltration. |
| Auto-Refresh Tokens | Browser / Client | — | Axios interceptors catch 401s and automatically call the refresh endpoint. |
| Auth State Management | Browser / Client | — | Zustand provides lightweight, predictable global state per SPA. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `djangorestframework-simplejwt` | 5.5.1 | Backend JWT | [VERIFIED: npm registry] De facto standard for DRF JWT authentication. |
| `axios` | 1.7.9 | API Client | [VERIFIED: npm registry] Robust interceptor support for complex token logic. |
| `zustand` | 5.0.3 | State Management | [VERIFIED: npm registry] Minimal boilerplate, high performance for simple auth states. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `lucide-react` | Latest | Icons | Login page iconography (eye, lock, user). |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `simplejwt` | `dj-rest-auth` | `dj-rest-auth` has native cookie support but is more complex to configure for custom role payloads. Decision D-01 mandates SimpleJWT. |
| `zustand` | `Redux` | Redux is overkill for a project where auth state is minimal. |

**Installation:**
```bash
# Backend
pip install djangorestframework-simplejwt

# Frontend (per SPA)
npm install axios zustand
```

## Architecture Patterns

### System Architecture Diagram
```
[React SPA]                        [Django API]
     |                                  |
     |--- 1. POST /api/auth/login/ ---->| (Validates credentials)
     |<-- 2. AccessToken (JSON) + ------|
     |       RefreshToken (HttpOnly)    |
     |                                  |
     |--- 3. GET /api/protected/ ------>| (With Bearer AccessToken)
     |<-- 4. 401 Unauthorized ----------| (If AccessToken expired)
     |                                  |
     |--- 5. POST /api/auth/refresh/ -->| (Sends HttpOnly Cookie)
     |<-- 6. New AccessToken (JSON) ----| (Updates memory state)
     |                                  |
     |--- 7. Retry GET /api/protected/->| (With new Bearer token)
     |<-- 8. 200 OK --------------------|
```

### Recommended Project Structure
```
backend/
└── apps/
    └── users/
        ├── views/
        │   └── auth.py       # Custom Token Views (Cookie-based)
        ├── serializers.py    # Overridden TokenObtainPairSerializer
        └── urls.py           # Auth endpoints mapping

frontend/
└── _shared/
    └── auth/
        ├── Login.tsx         # Shared component
        ├── useAuthStore.ts   # Zustand definition
        └── axiosInstance.ts  # Configured Axios with interceptors
```

### Pattern 1: SimpleJWT Cookie Override
**What:** Subclassing `TokenObtainPairView` and `TokenRefreshView` to handle HttpOnly cookies for the refresh token.
**When to use:** Required for D-02 compliance.
**Example:**
```python
# Source: [CITED: jazzband.github.io/djangorestframework-simplejwt]
class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            refresh_token = response.data.get('refresh')
            response.set_cookie(
                'refresh_token',
                refresh_token,
                max_age=3600 * 24, # 24h
                httponly=True,
                samesite='Lax',
                secure=True # Set to False in Dev
            )
            del response.data['refresh']
        return response
```

### Anti-Patterns to Avoid
- **Storing tokens in LocalStorage:** High XSS risk. Use memory (Zustand) for access and HttpOnly cookies for refresh.
- **Multiple Refresh Calls:** Not queueing 401 requests results in race conditions where multiple refresh tokens are requested, potentially invalidating each other.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT Signing | Custom encode/decode | `simplejwt` | Algorithm security and signature validation are high-risk areas. |
| Interceptor Queueing | Custom retry loop | Axios Interceptors | Proper `onTokenRefreshed` queueing prevents UI flicker and auth failures. |
| Role Constants | Hardcoded strings | Shared constants | Roles (`GERANT`, `SERVEUR`) must be synced between DB and frontend models. |

## Common Pitfalls

### Pitfall 1: CSRF & SameSite Cookies
**What goes wrong:** Browser blocks the refresh token cookie in cross-origin requests.
**Why it happens:** Default `SameSite=Strict` behavior or misconfigured `CORS_ALLOWED_ORIGINS`.
**How to avoid:** Set `SameSite=Lax` and ensure `CORS_ALLOW_CREDENTIALS = True` in Django settings.

### Pitfall 2: Memory Leak in Interceptor Queue
**What goes wrong:** Failed requests queue indefinitely if refresh fails.
**Why it happens:** The queue is not cleared or rejected on refresh failure.
**How to avoid:** Ensure the `catch` block of the refresh call iterates through the queue and rejects all pending promises.

## Code Examples

### Robust Axios Refresh Interceptor
```typescript
// Source: [CITED: axios-http.com/docs/interceptors]
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await api.post('/api/auth/refresh/');
                const { access } = data;
                processQueue(null, access);
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Both tokens in LocalStorage | Refresh in HttpOnly, Access in Memory | ~2020 (Security best practice) | Prevents XSS-based token theft. |
| Redux Auth | Zustand / TanStack Auth | ~2022 | Reduced boilerplate and better hook integration. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | SimpleJWT 5.5 is compatible with Django 5.0 | Standard Stack | Minor (downgrade to 5.3 might be needed). |
| A2 | Shared imports via Vite aliases don't break Hot Reload | Architecture Patterns | Workflow friction. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Django | Backend | ✓ | 5.0.14 | — |
| npm | Frontend | ✓ | 11.9.0 | — |
| node | Frontend | ✓ | 24.14.0 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Backend Framework | Django Test Runner |
| Backend Command | `python manage.py test apps.users` |
| Frontend Framework | Vitest (Proposed) |
| Frontend Command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Successful Login | Integration | `python manage.py test apps.users.tests.test_auth` | ❌ Wave 0 |
| AUTH-03 | Logout clears cookie | Integration | `python manage.py test apps.users.tests.test_auth` | ❌ Wave 0 |
| AUTH-06 | Interceptor retries | Unit (Mock) | `npm run test:auth` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `djangorestframework-simplejwt` |
| V3 Session Management | yes | HttpOnly, Secure, SameSite cookies |
| V5 Input Validation | yes | DRF Serializers |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS | Information Disclosure | Store tokens in memory or HttpOnly cookies. |
| Replay Attack | Spoofing | Short access token TTL (5-15 mins). |

## Sources

### Primary (HIGH confidence)
- `djangorestframework-simplejwt` official docs - Setting configurations and View subclassing.
- `axios` official documentation - Interceptor implementation details.

### Secondary (MEDIUM confidence)
- Mozilla Developer Network (MDN) - Cookie security attributes (HttpOnly, SameSite).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Current versions verified via npm/pip.
- Architecture: HIGH - Industry standard for secure React/Django auth.
- Pitfalls: HIGH - Well-documented race conditions in Axios.

**Research date:** 2026-04-27
**Valid until:** 2026-05-27

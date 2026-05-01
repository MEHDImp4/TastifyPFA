# Phase 13: WebSocket Infrastructure - Research

**Researched:** 2026-05-01
**Domain:** Django Channels WebSocket routing, Redis channel layer, Simple JWT WebSocket authentication, React staff WebSocket connection
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Establish a reliable, real-time communication layer using Django Channels and Redis to push updates from the backend to the frontend SPAs.
- Centralize the Protocol Router in `tastify_backend/asgi.py`.
- Use query-string JWT authentication for WebSockets: `ws://localhost:8000/ws/staff/?token=<jwt>`.
- Create custom `JWTAuthMiddleware` in `core/middleware.py` to extract and validate the token, populating `scope['user']`.
- Use a single staff channel: all `GERANT`, `SERVEUR`, and `CUISINIER` users join one group named `staff_group`.
- Every message must contain a `type` or `event_type` field so the frontend can filter events.
- Implement `StaffConsumer` as an async consumer in `core/consumers.py`.
- Define routing in `core/routing.py` and map it to `/ws/staff/`.
- Initialize the WebSocket connection globally at the staff application root after authentication.
- Keep the connection open throughout the authenticated session.
- Implement exponential backoff reconnection for server restarts or network blips.
- Dispatch received events to relevant Zustand stores.
- Use message shape:

```json
{
  "type": "event_type",
  "payload": {
    "data": "..."
  }
}
```

### the agent's Discretion

- Exact frontend provider/hook names and folder placement.
- Exact reconnection delay caps and jitter.
- Exact test names and test fixture structure.
- Exact development smoke command for sending a group message.

### Deferred Ideas (OUT OF SCOPE)

- Per-user groups.
- Per-role groups.
- KDS domain event payloads beyond a generic infrastructure test event.
- Order/status propagation logic for Phases 14-17.
- Presence tracking or connected-user lists.
</user_constraints>

## Summary

Phase 13 should extend the infrastructure already present in the repository: `channels==4.3.2`, `daphne==4.2.1`, `channels-redis==4.3.0`, `redis==5.0.8`, and `djangorestframework-simplejwt==5.5.0` are already pinned in `backend/requirements.txt`; `daphne`, `channels`, and `CHANNEL_LAYERS` are already configured in `backend/tastify_backend/settings/base.py`; and `backend/tastify_backend/asgi.py` already uses `ProtocolTypeRouter` for HTTP. [VERIFIED: codebase grep] [CITED: https://channels.readthedocs.io/en/latest/topics/routing.html]

The implementation should add only the missing WebSocket surface: `core/routing.py`, `core/consumers.py`, `core/middleware.py`, and a staff-root React connection provider/hook. Channels documentation explicitly supports custom authentication middleware for tokens in the URL, `URLRouter` under `ProtocolTypeRouter`, and Redis-backed groups for broadcast. [CITED: https://channels.readthedocs.io/en/latest/topics/authentication.html] [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html]

**Primary recommendation:** Use `AsyncJsonWebsocketConsumer` with explicit `group_add`/`group_discard`, a query-string JWT middleware that validates Simple JWT access tokens and loads `Utilisateur`, and a small first-party React WebSocket provider with capped exponential backoff; do not install a frontend WebSocket abstraction library for this narrow global connection. [CITED: https://channels.readthedocs.io/en/stable/topics/consumers.html] [VERIFIED: npm registry]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| WebSocket protocol routing | Backend ASGI | Docker network | `asgi.py` owns protocol dispatch; Docker exposes backend on port 8000. [VERIFIED: codebase grep] |
| JWT authentication for WebSocket handshakes | Backend ASGI middleware | Frontend auth store | Browser provides the token in the URL; middleware validates it and sets `scope['user']`. [CITED: https://channels.readthedocs.io/en/latest/topics/authentication.html] |
| Staff broadcast subscription | Backend consumer | Redis channel layer | Consumer joins/leaves `staff_group`; Redis distributes group messages across backend processes. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html] |
| Event fan-out from backend code | API / Backend | Redis channel layer | Future phases should send high-level domain events through `group_send`, not directly through sockets. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html] |
| Global WebSocket connection lifecycle | Browser / Client | Backend close codes | Staff React app owns connect/reconnect/cleanup while backend accepts or rejects handshakes. [CITED: https://developer.mozilla.org/docs/Web/API/WebSocket/WebSocket] |
| Store updates from events | Browser / Client | Zustand stores | The event handler maps received message types to client state updates. [VERIFIED: codebase grep] |

## Project Constraints (from AGENTS.md)

| Directive | Planning Impact |
|-----------|-----------------|
| Maintain `docs/brain/00_Meta/FILE_MAP.md` and planning sync | If new source/test files are added, update FILE_MAP. [VERIFIED: AGENTS.md] |
| Always plan before executing | Planner must create executable task files before implementation. [VERIFIED: AGENTS.md] |
| Auto-commit successful changes and keep commits atomic | Split backend middleware/consumer, frontend provider, tests/docs into focused commits. [VERIFIED: AGENTS.md] |
| Never `git push` without permission | No phase task may push. [VERIFIED: AGENTS.md] |
| Maintain `docs/brain/02_Journal/CHANGELOG.md` with timestamps and commit hashes | Every implementation commit needs a changelog entry. [VERIFIED: AGENTS.md] |
| Update `dashboard.html` after every change, commit, or state shift | Planner must include dashboard update steps. [VERIFIED: AGENTS.md] |
| Use MCP/Context7 or official docs for library questions | Research used official docs/web because Context7 MCP tools were unavailable in this session. [VERIFIED: tool availability] |
| Read `DESIGN.md` before UI changes | Frontend connection status UI, if any, must respect DESIGN.md. [VERIFIED: AGENTS.md] |
| No trivial comments | Consumer/middleware comments should explain security edge cases only. [VERIFIED: AGENTS.md] |
| Write validation tests alongside features | Include Channels communicator tests and Vitest provider tests. [VERIFIED: AGENTS.md] |
| Fail fast on failed commands/tests | Plans should stop on failing backend/frontend tests and diagnose. [VERIFIED: AGENTS.md] |
| Windows PowerShell uses `;` instead of `&&` | Use PowerShell-compatible commands in plans. [VERIFIED: AGENTS.md] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django Channels | 4.3.2 | ASGI/WebSocket integration | Existing pinned package; docs are for Channels 4.x and prescribe `ProtocolTypeRouter`, `URLRouter`, consumers, and channel layers. [VERIFIED: backend/requirements.txt] [CITED: https://channels.readthedocs.io/] |
| Daphne | 4.2.1 | ASGI HTTP/WebSocket server | Existing pinned package; Daphne is the Channels HTTP/WebSocket termination server. [VERIFIED: backend/requirements.txt] [CITED: https://github.com/django/daphne] |
| channels-redis | 4.3.0 | Production Redis channel layer | Existing pinned package; Channels docs call `channels_redis` the only official Django-maintained production channel layer. [VERIFIED: backend/requirements.txt] [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html] |
| Redis Docker image | 7-alpine | Channel layer backing service | Existing `docker-compose.yml` service; channels-redis requires Redis server >= 5.0, so Redis 7 satisfies it. [VERIFIED: docker-compose.yml] [CITED: https://pypi.org/project/channels-redis/4.3.0/] |
| djangorestframework-simplejwt | 5.5.0 | Access token parsing/validation | Existing auth stack; Simple JWT exposes access token classes and verification APIs. [VERIFIED: backend/requirements.txt] [CITED: https://django-rest-framework-simplejwt.readthedocs.io/en/stable/getting_started.html] |
| Browser `WebSocket` API | Baseline browser API | Staff SPA WebSocket connection | Constructor accepts URL and optional protocols only; this supports the locked query-string token approach. [CITED: https://developer.mozilla.org/docs/Web/API/WebSocket/WebSocket] |
| Zustand | 5.0.12 | Auth and event target stores | Existing shared auth store persists `accessToken`, `user`, and `isAuthenticated`. [VERIFIED: frontend/back-office/package.json] [VERIFIED: frontend/_shared/auth/useAuthStore.ts] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| channels.testing.WebsocketCommunicator | Bundled with Channels 4.3.2 | Backend WebSocket unit/integration tests | Use for middleware, route, accept/reject, and group message tests. [CITED: https://channels.readthedocs.io/en/latest/topics/testing.html] |
| pytest / pytest-django | 8.3.3 / 4.9.0 | Backend test runner | Existing backend test infrastructure uses `backend/pytest.ini`. [VERIFIED: backend/requirements.txt] [VERIFIED: backend/pytest.ini] |
| Vitest / Testing Library | 4.1.5 / 16.3.2 | Frontend provider/hook tests | Existing back-office frontend test stack. [VERIFIED: frontend/back-office/package.json] |
| asgiref.sync.async_to_sync | Bundled transitive dependency | Calling `group_send` from sync code | Channels docs require wrapping async channel-layer methods when called from sync code. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| First-party `WebSocket` provider | `react-use-websocket@4.13.0` | Avoid dependency; phase needs one global connection, not a generic socket abstraction. Version checked on npm, modified 2025-02-04. [VERIFIED: npm registry] |
| `channels_redis.core.RedisChannelLayer` | `channels_redis.pubsub.RedisPubSubChannelLayer` | Pub/Sub layer is documented as beta; use stable core layer already configured. [CITED: https://github.com/django/channels_redis] |
| Query-string JWT | Cookie/session auth | Locked context requires query-string JWT; cookie/session auth would conflict with Phase 13 context. [VERIFIED: 13-CONTEXT.md] |
| Per-role/per-user groups | Multiple groups | Out of scope and more complex; locked context says single `staff_group`. [VERIFIED: 13-CONTEXT.md] |

**Installation:**

No new backend packages are required. No new frontend packages are required. [VERIFIED: backend/requirements.txt] [VERIFIED: frontend/back-office/package.json]

**Version verification:**

| Package | Project Version | Registry/Docs Status |
|---------|-----------------|----------------------|
| channels | 4.3.2 | PyPI search shows 4.3.2 uploaded Nov 20, 2025; local `pip index` failed under Python 3.14 because current packages advertise support up to Python 3.13. [CITED: https://pypi.org/project/channels/] |
| daphne | 4.2.1 | PyPI shows 4.2.1 uploaded Jul 2, 2025. [CITED: https://pypi.org/project/daphne/] |
| channels-redis | 4.3.0 | PyPI shows 4.3.0 uploaded Jul 22, 2025. [CITED: https://pypi.org/project/channels-redis/4.3.0/] |
| djangorestframework-simplejwt | 5.5.0 | PyPI latest is 5.5.1 as of Jul 21, 2025; project pins 5.5.0. Keep the pin unless a separate dependency-update phase is opened. [CITED: https://pypi.org/project/djangorestframework-simplejwt/] |
| react-use-websocket | 4.13.0 | Checked only to reject adding it; not recommended for this phase. [VERIFIED: npm registry] |

## Architecture Patterns

### System Architecture Diagram

```text
Staff React app
  |
  | authenticated user + persisted accessToken
  v
WebSocketProvider builds ws://host/ws/staff/?token=<access>
  |
  v
Daphne / ASGI application
  |
  v
ProtocolTypeRouter
  |-- http --> Django ASGI app
  |
  '-- websocket --> AllowedHostsOriginValidator
                    |
                    v
                JWTAuthMiddleware
                    |
                    | valid access token + staff role?
                    |-- no --> close handshake
                    |
                    '-- yes --> URLRouter /ws/staff/
                                  |
                                  v
                              StaffConsumer
                                  |
                                  v
                              staff_group in Redis channel layer
                                  ^
                                  |
                   backend services call group_send(event)
```

### Recommended Project Structure

```text
backend/
├── core/
│   ├── consumers.py          # StaffConsumer
│   ├── middleware.py         # JWTAuthMiddleware
│   ├── routing.py            # websocket_urlpatterns
│   └── tests/
│       ├── test_websocket_auth.py
│       └── test_staff_consumer.py
└── tastify_backend/
    └── asgi.py               # ProtocolTypeRouter with websocket branch

frontend/
├── _shared/
│   ├── auth/
│   │   └── useAuthStore.ts   # existing access token source
│   └── websocket/
│       ├── WebSocketProvider.tsx
│       └── staffSocket.ts
└── back-office/
    └── src/
        └── websocket/
            └── WebSocketProvider.test.tsx
```

### Pattern 1: ASGI Routing Boundary

**What:** Keep HTTP and WebSocket protocol dispatch in `tastify_backend/asgi.py`; import `core.routing.websocket_urlpatterns` only after `get_asgi_application()` initializes Django. [CITED: https://channels.readthedocs.io/en/latest/topics/routing.html]

**When to use:** Always in this phase. It preserves the existing HTTP behavior and adds a scoped WebSocket branch. [VERIFIED: backend/tastify_backend/asgi.py]

**Example:**

```python
# Source: https://channels.readthedocs.io/en/latest/topics/routing.html
import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tastify_backend.settings.dev')

django_asgi_app = get_asgi_application()

from core.middleware import JWTAuthMiddleware
from core.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
    ),
})
```

### Pattern 2: Query-String JWT Middleware

**What:** Parse `scope['query_string']`, extract `token`, validate it as a Simple JWT access token, load `Utilisateur`, and set `scope['user']`; invalid, expired, missing, or non-staff users become `AnonymousUser` or are closed in the consumer. [CITED: https://channels.readthedocs.io/en/latest/topics/authentication.html] [CITED: https://django-rest-framework-simplejwt.readthedocs.io/en/latest/rest_framework_simplejwt.html]

**When to use:** Only for WebSocket handshakes. REST continues using the existing DRF Simple JWT authentication classes. [VERIFIED: backend/tastify_backend/settings/base.py]

**Example:**

```python
# Source: Channels custom auth docs + Simple JWT token docs
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user_for_token(raw_token: str):
    try:
        token = AccessToken(raw_token)
        user_id = token.get('user_id')
        return get_user_model().objects.get(id=user_id)
    except (InvalidToken, TokenError, get_user_model().DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query = parse_qs(scope.get('query_string', b'').decode())
        raw_token = query.get('token', [None])[0]
        scope['user'] = await get_user_for_token(raw_token) if raw_token else AnonymousUser()
        return await self.app(scope, receive, send)
```

### Pattern 3: Async JSON Consumer With Explicit Group Lifecycle

**What:** Use `AsyncJsonWebsocketConsumer`, accept only authenticated staff, join `staff_group`, send JSON events, and discard on disconnect. [CITED: https://channels.readthedocs.io/en/stable/topics/consumers.html] [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html]

**When to use:** This phase has JSON messages and no ORM work inside the consumer after authentication, so async JSON is appropriate. [VERIFIED: 13-CONTEXT.md]

**Example:**

```python
# Source: Channels consumer and groups docs
from channels.generic.websocket import AsyncJsonWebsocketConsumer

STAFF_GROUP = 'staff_group'
STAFF_ROLES = {'GERANT', 'SERVEUR', 'CUISINIER'}


class StaffConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated or user.role not in STAFF_ROLES:
            await self.close(code=4401)
            return

        await self.channel_layer.group_add(STAFF_GROUP, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(STAFF_GROUP, self.channel_name)

    async def staff_event(self, event):
        await self.send_json({
            'type': event['event_type'],
            'payload': event.get('payload', {}),
        })
```

### Pattern 4: Backend Event Publisher Helper

**What:** Expose one small helper for later phases to publish high-level staff events through the channel layer; use `async_to_sync` for sync Django code. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html]

**When to use:** Future model signals, DRF actions, or service functions should call this helper instead of importing consumers. [VERIFIED: roadmap Phases 14-17]

**Example:**

```python
# Source: Channels "Using Outside Of Consumers" docs
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

STAFF_GROUP = 'staff_group'


def broadcast_staff_event(event_type: str, payload: dict):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        STAFF_GROUP,
        {
            'type': 'staff.event',
            'event_type': event_type,
            'payload': payload,
        },
    )
```

### Pattern 5: Frontend Global Provider

**What:** Build the URL from `window.location`, convert `http` to `ws` and `https` to `wss`, append `token`, attach `onmessage`, `onclose`, and `onerror`, and reconnect with capped exponential backoff while authenticated. [CITED: https://developer.mozilla.org/docs/Web/API/WebSocket/WebSocket]

**When to use:** Mount once in the staff app after `useAuthStore` reports an authenticated staff user. [VERIFIED: frontend/_shared/auth/useAuthStore.ts] [VERIFIED: frontend/_shared/auth/roleAccess.ts]

**Example:**

```typescript
// Source: MDN WebSocket constructor docs
export const buildStaffSocketUrl = (origin: Location, token: string) => {
  const protocol = origin.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = new URL(`${protocol}//${origin.host}/ws/staff/`)
  url.searchParams.set('token', token)
  return url.toString()
}
```

### Anti-Patterns to Avoid

- **Custom WebSocket headers in browser code:** The browser `WebSocket` constructor accepts only URL and protocols, so do not plan `Authorization: Bearer` headers for browser sockets. [CITED: https://developer.mozilla.org/docs/Web/API/WebSocket/WebSocket]
- **In-memory channel layer for this phase:** Channels docs warn that in-memory layers do not support cross-process messaging and cause data loss in multi-instance deployments. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html]
- **Enumerating `staff_group` members:** Channels groups deliberately do not allow listing channels; do not build presence or connected-client counts on group membership. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html]
- **ORM calls directly inside async consumer methods:** Channels docs require `database_sync_to_async` or async ORM methods when async code touches Django ORM. [CITED: https://channels.readthedocs.io/en/stable/topics/consumers.html]
- **Domain-specific order/KDS events in this phase:** Phase 13 is infrastructure; Phases 14-17 own KDS/order propagation. [VERIFIED: .planning/ROADMAP.md]
- **Using raw `type` names that collide with consumer handlers:** Channel-layer event `type` maps to consumer method names; use internal handler type `staff.event` and public payload key `event_type`. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ASGI protocol dispatch | Custom protocol router | `ProtocolTypeRouter` + `URLRouter` | Channels provides scope-level routing for HTTP/WebSocket. [CITED: https://channels.readthedocs.io/en/latest/topics/routing.html] |
| Broadcast group registry | Custom Redis sets of channel names | Channels groups | Groups add/discard/send and expire stale channels. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html] |
| JWT signature/expiry parsing | Manual JWT decode | Simple JWT `AccessToken` | Token classes verify signature, expiry, and token type. [CITED: https://django-rest-framework-simplejwt.readthedocs.io/en/latest/rest_framework_simplejwt.html] |
| JSON frame parsing | Manual `json.loads`/`json.dumps` in base consumer | `AsyncJsonWebsocketConsumer` | Generic JSON consumer already encodes/decodes JSON frames. [CITED: https://channels.readthedocs.io/en/stable/topics/consumers.html] |
| Sync/async bridge | Calling async channel-layer methods from sync code directly | `asgiref.sync.async_to_sync` | Channel-layer methods are async by default. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html] |
| Frontend generic socket framework | A local event bus or new socket library | Native `WebSocket` + one provider | One global connection is narrow enough to own locally. [CITED: https://developer.mozilla.org/docs/Web/API/WebSocket/WebSocket] |

**Key insight:** Channels already solves the hard distributed parts: ASGI routing, per-connection consumer instances, group fan-out, Redis-backed delivery, and cleanup expiry. The planner should focus on authentication boundaries, lifecycle tests, and a thin frontend integration rather than rebuilding a realtime framework. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html]

## Common Pitfalls

### Pitfall 1: Treating the Public `type` Field as the Channels Handler Name

**What goes wrong:** A message sent with `{'type': 'order_created'}` makes Channels look for `order_created()` on the consumer instead of the intended generic handler. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html]
**Why it happens:** Channel-layer event `type` is a dispatch key, and periods are converted to underscores. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html]
**How to avoid:** Use internal `type: 'staff.event'` and public `event_type: 'order_created'`.
**Warning signs:** `ValueError` or silent missing handler behavior when using `group_send`.

### Pitfall 2: Async Consumer Blocking on ORM

**What goes wrong:** The event loop blocks if synchronous ORM queries run inside async middleware/consumer code. [CITED: https://channels.readthedocs.io/en/stable/topics/consumers.html]
**Why it happens:** Django ORM is synchronous unless using async methods.
**How to avoid:** Wrap middleware user lookup with `@database_sync_to_async`; avoid ORM work in `StaffConsumer` after connect.
**Warning signs:** Slow socket accepts under load, warnings around sync code in async contexts.

### Pitfall 3: Access Token Expires While Socket Stays Open

**What goes wrong:** A socket authenticated at connect time can remain connected after the 15-minute REST access token lifetime. [VERIFIED: backend/tastify_backend/settings/base.py]
**Why it happens:** WebSocket authentication happens at handshake; Channels does not re-run middleware for every frame. [CITED: https://channels.readthedocs.io/en/latest/topics/authentication.html]
**How to avoid:** For Phase 13, document this as accepted infrastructure behavior and close/reconnect when auth store clears or refresh fails; defer mid-connection re-auth unless required later. [ASSUMED]
**Warning signs:** User logs out in one tab but another tab remains connected until close.

### Pitfall 4: Query Tokens in Logs

**What goes wrong:** Access tokens in `?token=` can appear in server/proxy logs. [VERIFIED: 13-CONTEXT.md]
**Why it happens:** URLs are commonly logged by servers and middleware.
**How to avoid:** Never log full WebSocket URLs; keep access lifetime short; sanitize test/debug output; use `wss` in production. [VERIFIED: backend/tastify_backend/settings/base.py] [ASSUMED]
**Warning signs:** Backend logs show `/ws/staff/?token=ey...`.

### Pitfall 5: Frontend Reconnection Storm

**What goes wrong:** Server restarts cause every staff client to reconnect in tight loops. [ASSUMED]
**Why it happens:** Immediate reconnect on every close/event error.
**How to avoid:** Use capped exponential backoff with jitter; reset attempts after a successful open.
**Warning signs:** Browser console floods connection attempts; backend logs repeated rejected handshakes.

### Pitfall 6: Group Presence Assumptions

**What goes wrong:** Code tries to list connected staff users from `staff_group`. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html]
**Why it happens:** Groups look like rooms, but Channels documents them as pure broadcast and non-enumerable.
**How to avoid:** Do not plan presence in Phase 13; if needed later, design explicit presence storage.
**Warning signs:** Redis key spelunking or code depending on channels_redis internals.

### Pitfall 7: Redis Channel Capacity and Expiry Surprises

**What goes wrong:** Messages are dropped/refused or stale group membership remains longer than expected during disconnect failures. [CITED: https://github.com/django/channels_redis]
**Why it happens:** channels_redis defaults include message expiry, group expiry, and channel capacity.
**How to avoid:** Keep defaults for Phase 13, document them, and only tune after real load evidence.
**Warning signs:** Missing low-priority events during traffic spikes.

### Pitfall 8: Testing With In-Memory Layer Only

**What goes wrong:** Tests pass locally but Redis-backed behavior fails in Docker. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html]
**Why it happens:** In-memory layer is process-local and does not exercise Redis.
**How to avoid:** Unit-test consumer behavior with communicators, and include one Docker smoke path using the real Redis service.
**Warning signs:** No test ever exercises `channels_redis.core.RedisChannelLayer`.

## Code Examples

### WebSocket Route

```python
# Source: Channels URLRouter docs
from django.urls import path

from core.consumers import StaffConsumer

websocket_urlpatterns = [
    path('ws/staff/', StaffConsumer.as_asgi()),
]
```

### Test With WebsocketCommunicator

```python
# Source: Channels testing docs
from channels.testing import WebsocketCommunicator

from tastify_backend.asgi import application


async def test_staff_socket_rejects_missing_token():
    communicator = WebsocketCommunicator(application, '/ws/staff/')
    connected, _ = await communicator.connect()
    assert connected is False
```

### Frontend Message Handler Shape

```typescript
type StaffEvent = {
  type: string
  payload: Record<string, unknown>
}

export const handleStaffEvent = (event: StaffEvent) => {
  switch (event.type) {
    case 'table_updated':
      return
    case 'order_created':
      return
    default:
      return
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Channels 1.x `Group` API | Channels 4.x consumers plus channel layers | Channels 2+ architecture | Use `self.channel_layer.group_add/group_send`, not old `Group`. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html] |
| WSGI-only Django deployment | ASGI via Daphne | Existing project Phase 1 | No WSGI swap is needed; extend current ASGI app. [VERIFIED: backend/tastify_backend/asgi.py] |
| Browser custom auth headers | Query string, cookie, or subprotocol-based auth | Browser WebSocket API constraint | Browser constructor has no custom headers parameter. [CITED: https://developer.mozilla.org/docs/Web/API/WebSocket/WebSocket] |
| In-memory channel layer in production | Redis-backed channel layer | Channels production guidance | Redis is the official production layer. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html] |
| Pub/Sub Redis layer by default | Core RedisChannelLayer | channels_redis 4.3.0 README | Pub/Sub implementation is documented as beta; use stable core layer. [CITED: https://github.com/django/channels_redis] |

**Deprecated/outdated:**

- `channels.Group`: old Channels 1.x pattern; do not use. [CITED: https://channels.readthedocs.io/en/latest/topics/channel_layers.html]
- `WebsocketConsumer` plus manual JSON parsing for this phase: `AsyncJsonWebsocketConsumer` is better aligned with JSON-only messages. [CITED: https://channels.readthedocs.io/en/stable/topics/consumers.html]
- Frontend polling for table/KDS updates as the realtime base: Phase 13 creates push infrastructure. [VERIFIED: .planning/ROADMAP.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Mid-connection JWT expiry can be accepted for Phase 13 if logout/refresh failure closes the socket and later phases do not require strict re-auth. | Common Pitfalls | Security behavior may need a stricter timed reconnect or server-side token expiry close. |
| A2 | Capped exponential backoff with jitter is sufficient for staff-scale restaurant usage. | Common Pitfalls | Very large deployments may need server-coordinated retry hints. |
| A3 | Production will use `wss`; current direct-port local dev uses `ws`. | Security Domain | Deploying insecure `ws` over public networks would expose tokens. |

## Open Questions

1. **Should WebSocket connections be force-closed at access token expiry?**
   - What we know: Access tokens last 15 minutes in settings. [VERIFIED: backend/tastify_backend/settings/base.py]
   - What's unclear: Whether Phase 13 must enforce expiry mid-connection.
   - Recommendation: Defer strict mid-connection expiry to a security hardening phase unless the planner receives a user decision.

2. **Should non-staff authenticated users receive close code `4403` rather than `4401`?**
   - What we know: The staff portal already rejects `CLIENT` users. [VERIFIED: frontend/_shared/auth/roleAccess.ts]
   - What's unclear: Whether the backend should distinguish unauthenticated vs forbidden in close codes.
   - Recommendation: Use `4401` for missing/invalid token and `4403` for authenticated non-staff if tests can assert both cleanly.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Docker | Redis/backend smoke validation | Yes | 29.4.1 | None needed. [VERIFIED: shell] |
| Docker Compose | Service orchestration | Yes | v5.1.3 | None needed. [VERIFIED: shell] |
| Node.js | Frontend tests/build | Yes | v24.14.0 | Use project containers if host Node diverges. [VERIFIED: shell] |
| npm | Frontend scripts | Yes | 11.9.0 | Use project containers if host npm diverges. [VERIFIED: shell] |
| Python | Backend tests | Yes, but host is newer than package support | 3.14.3 | Use Docker backend image/project runtime. [VERIFIED: shell] [CITED: https://pypi.org/project/channels-redis/4.3.0/] |
| Redis server CLI | Local non-Docker Redis | No | — | Use `redis:7-alpine` Docker service. [VERIFIED: shell] |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:**

- Host Redis CLI/server is missing; use the existing Docker Redis service. [VERIFIED: docker-compose.yml]
- Host Python 3.14 caused `pip index versions` compatibility failures for Django Channels packages; use the Docker backend environment for package installation/tests. [VERIFIED: shell] [CITED: https://pypi.org/project/channels-redis/4.3.0/]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Backend framework | pytest 8.3.3 + pytest-django 4.9.0 + Channels testing utilities. [VERIFIED: backend/requirements.txt] |
| Backend config file | `backend/pytest.ini`. [VERIFIED: backend/pytest.ini] |
| Frontend framework | Vitest 4.1.5 + Testing Library React 16.3.2. [VERIFIED: frontend/back-office/package.json] |
| Quick backend command | `cd backend; pytest core/tests/test_websocket_auth.py core/tests/test_staff_consumer.py -q` |
| Quick frontend command | `cd frontend/back-office; npm run test -- src/websocket/WebSocketProvider.test.tsx --run` |
| Full suite command | `cd backend; pytest -q` and `cd frontend/back-office; npm run test -- --run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| WS-01 | `JWTAuthMiddleware` authenticates valid access token and rejects missing/invalid token | backend integration | `cd backend; pytest core/tests/test_websocket_auth.py -q` | No - Wave 0 |
| WS-02 | `StaffConsumer` joins/leaves `staff_group` for staff roles | backend integration | `cd backend; pytest core/tests/test_staff_consumer.py -q` | No - Wave 0 |
| WS-03 | `/ws/staff/` route is wired through ASGI | backend integration | `cd backend; pytest core/tests/test_staff_consumer.py::test_staff_route_accepts_staff_token -q` | No - Wave 0 |
| WS-04 | Backend `group_send` test event reaches connected socket | backend integration | `cd backend; pytest core/tests/test_staff_consumer.py::test_group_send_reaches_staff_socket -q` | No - Wave 0 |
| WS-05 | Staff frontend builds correct `ws/wss` URL with token | frontend unit | `cd frontend/back-office; npm run test -- src/websocket/WebSocketProvider.test.tsx --run` | No - Wave 0 |
| WS-06 | Staff frontend reconnects with capped backoff and stops after logout | frontend unit | `cd frontend/back-office; npm run test -- src/websocket/WebSocketProvider.test.tsx --run` | No - Wave 0 |

### Sampling Rate

- **Per task commit:** Run the focused backend or frontend quick command for touched tier.
- **Per wave merge:** Run backend quick command plus frontend quick command.
- **Phase gate:** Full backend pytest suite and full back-office Vitest suite green before UAT.

### Wave 0 Gaps

- [ ] `backend/core/tests/test_websocket_auth.py` - covers WS-01.
- [ ] `backend/core/tests/test_staff_consumer.py` - covers WS-02, WS-03, WS-04.
- [ ] `frontend/back-office/src/websocket/WebSocketProvider.test.tsx` - covers WS-05, WS-06.
- [ ] Optional Docker smoke note/command for manual shell broadcast to `staff_group`.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | Yes | Simple JWT access token validation in ASGI middleware. [CITED: https://django-rest-framework-simplejwt.readthedocs.io/en/stable/getting_started.html] |
| V3 Session Management | Yes | Close socket when auth store clears; reconnect only while authenticated. [VERIFIED: frontend/_shared/auth/useAuthStore.ts] |
| V4 Access Control | Yes | Backend staff-role gate for `GERANT`, `SERVEUR`, `CUISINIER`; reject `CLIENT`. [VERIFIED: frontend/_shared/auth/roleAccess.ts] |
| V5 Input Validation | Yes | Parse JSON through `AsyncJsonWebsocketConsumer`; validate `type`/`payload` shape before dispatch. [CITED: https://channels.readthedocs.io/en/stable/topics/consumers.html] |
| V6 Cryptography | Yes | Do not implement JWT cryptography; use Simple JWT. [CITED: https://django-rest-framework-simplejwt.readthedocs.io/en/latest/rest_framework_simplejwt.html] |

### Known Threat Patterns for Django Channels + JWT

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Token in WebSocket URL logged | Information Disclosure | Never log full URL; short access lifetime; use `wss` outside local dev. [VERIFIED: 13-CONTEXT.md] [ASSUMED] |
| Non-staff user opens staff socket | Elevation of Privilege | Backend role check in `connect`, not only frontend route guard. [VERIFIED: frontend/_shared/auth/roleAccess.ts] |
| Cross-origin WebSocket handshake | Spoofing | Wrap WebSocket app in `AllowedHostsOriginValidator`. [CITED: https://channels.readthedocs.io/en/latest/topics/authentication.html] |
| Malformed JSON/event flood | Denial of Service | JSON consumer plus minimal receive behavior; Phase 13 does not accept client-origin domain commands. [CITED: https://channels.readthedocs.io/en/stable/topics/consumers.html] |
| Redis message sniffing | Information Disclosure | Keep Redis inside Docker network for dev; consider channels_redis encryption/TLS only for production hardening. [CITED: https://github.com/django/channels_redis] |

## Sources

### Primary (HIGH confidence)

- https://channels.readthedocs.io/ - Channels 4.x overview and package roles.
- https://channels.readthedocs.io/en/latest/topics/routing.html - `ProtocolTypeRouter`, `URLRouter`, `AllowedHostsOriginValidator`, ASGI import ordering.
- https://channels.readthedocs.io/en/latest/topics/authentication.html - custom authentication middleware and query-string auth pattern.
- https://channels.readthedocs.io/en/latest/topics/channel_layers.html - Redis layer, async APIs, groups, group limits, `async_to_sync`.
- https://channels.readthedocs.io/en/stable/topics/consumers.html - `AsyncWebsocketConsumer`, `AsyncJsonWebsocketConsumer`, async ORM warning.
- https://github.com/django/channels_redis - channel-layer config options, core vs Pub/Sub, expiry/capacity.
- https://django-rest-framework-simplejwt.readthedocs.io/en/stable/getting_started.html - Simple JWT project configuration and supported versions.
- https://django-rest-framework-simplejwt.readthedocs.io/en/latest/rest_framework_simplejwt.html - token classes and verification behavior.
- https://developer.mozilla.org/docs/Web/API/WebSocket/WebSocket - browser WebSocket constructor constraints.
- Repository files: `backend/requirements.txt`, `backend/tastify_backend/asgi.py`, `backend/tastify_backend/settings/base.py`, `docker-compose.yml`, `frontend/_shared/auth/*`, `frontend/back-office/package.json`.

### Secondary (MEDIUM confidence)

- https://pypi.org/project/channels/ - package release metadata.
- https://pypi.org/project/daphne/ - package release metadata.
- https://pypi.org/project/channels-redis/4.3.0/ - package release metadata and README mirror.
- https://pypi.org/project/djangorestframework-simplejwt/ - package release metadata.
- npm registry via `npm view react-use-websocket version time.modified` - rejected frontend library version check.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - existing project pins plus official Channels/Simple JWT docs and PyPI metadata.
- Architecture: HIGH - follows locked context and official Channels routing/auth/group patterns.
- Pitfalls: MEDIUM-HIGH - major pitfalls are documented by official docs; reconnection-storm and token-expiry policy need planner/user confirmation.

**Research date:** 2026-05-01
**Valid until:** 2026-05-31

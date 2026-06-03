# Phase 13 Context: WebSocket Infrastructure

## 1. Objective
Establish a reliable, real-time communication layer using Django Channels and Redis to push updates from the backend to the frontend SPAs. This phase focuses on the infrastructure itself, enabling real-time features in subsequent phases (KDS, Table Map updates, etc.).

## 2. Architectural Decisions

### 2.1 Backend (Django Channels)
- **Protocol Router:** Centralized in `tastify_backend/asgi.py`.
- **Authentication:** **Query String JWT**. 
  - Since standard WebSocket headers don't support custom fields like `Authorization: Bearer <token>`, we will pass the JWT via the URL (e.g., `ws://localhost:8000/ws/staff/?token=<jwt>`).
  - **Middleware:** A custom `JWTAuthMiddleware` will be created in `core/middleware.py` to extract and validate the token, populating `scope['user']`.
- **Channel Strategy:** **Single Staff Channel**.
  - All staff members (Gérant, Serveur, Cuisinier) will join a single group named `staff_group`.
  - **Differentiator:** Every message will contain an `type` or `event_type` field (e.g., `order_created`, `dish_ready`, `table_updated`) to allow the frontend to filter and react appropriately.
- **Consumer:** `StaffConsumer` (Async) located in `core/consumers.py`.
- **Routing:** Defined in `core/routing.py` and mapped to `/ws/staff/`.

### 2.2 Frontend (React)
- **Connection Strategy:** **Global Connection**.
  - The WebSocket connection will be initialized at the application root level (likely within a `WebSocketProvider` or a specialized hook).
  - **Persistence:** The connection will be established as soon as the user is authenticated and will remain open throughout the session.
- **Reconnection:** Implement exponential backoff for reconnection to handle server restarts or network blips.
- **State Management:** Events received via WebSocket will dispatch actions to relevant Zustand stores (e.g., updating the table map state or the KDS order list).

## 3. Implementation Details & Patterns

### 3.1 Message Schema
All WebSocket messages must follow this structure:
```json
{
  "type": "event_type",
  "payload": {
    "data": "..."
  }
}
```

### 3.2 Reusable Patterns
- **Middleware:** The `JWTAuthMiddleware` pattern from Phase 3 (REST) should be adapted for the `scope` object in Channels.
- **Async Consumers:** Use `AsyncWebsocketConsumer` to avoid blocking the event loop, especially since we expect high concurrency during peak restaurant hours.

## 4. Risks & Mitigations
- **Security:** Tokens in query strings can be logged by some servers. *Mitigation:* We are using a private/containerized network and short-lived tokens. Ensure the middleware clears the token from the scope immediately after authentication.
- **Zombie Connections:** Redis can accumulate stale channels if not closed properly. *Mitigation:* Ensure `disconnect` logic in the consumer rigorously removes the channel from the group.

## 5. Success Criteria
- [ ] `JWTAuthMiddleware` successfully authenticates WebSocket connections.
- [ ] `StaffConsumer` manages joining/leaving the `staff_group`.
- [ ] Frontend successfully establishes a persistent connection to `ws://localhost:8000/ws/staff/`.
- [ ] Heartbeat/Ping-Pong mechanism verified (native Channels support).
- [ ] A test message sent from the Django shell reaches the frontend console.

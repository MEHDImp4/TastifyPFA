---
phase: 39
slug: load-testing-optimization
status: discussion
---

# Phase 39: Load Testing & Optimization

## Goal
Validate the system performance under high concurrency and optimize infrastructure for production readiness.

## Context
Tastify must handle busy restaurant hours (many tables, many kitchen updates, real-time sync). 
We need to ensure the Docker-based stack is resilient and performant.

## Proposed Scope

### 1. Load Testing with Locust
- **Script**: Create `scripts/locustfile.py` to simulate:
  - 50 concurrent Servers taking orders.
  - 10 concurrent Chefs updating KDS.
  - 100 concurrent Clients browsing the menu.
- **Metrics**: Response time (P95 < 500ms), Error rate (< 1%).

### 2. Backend Production Readiness
- **Server**: Switch from `runserver` to `daphne` (for both HTTP and WS) or `gunicorn` + `daphne`.
- **Optimization**:
  - Configure `gunicorn` workers.
  - Enable caching for static files.
  - Optimize DB connections (pooling).

### 3. Nginx Reverse Proxy (Optional/Recommended)
- **Goal**: Add an Nginx container to handle load balancing and static serving.

## Questions for Discussion
- [ ] Should we use a real load testing environment or just the local Docker? (Local Docker is enough to find obvious bottlenecks).
- [ ] Which ASGI server should be the primary? (Daphne is easiest for Channels, Gunicorn+Uvicorn is often faster).

## Success Criteria
1.  Locust test runs with 100+ simulated users without crashing the backend.
2.  Average API response time remains under 200ms under moderate load.
3.  Websocket frames are delivered with < 100ms latency.

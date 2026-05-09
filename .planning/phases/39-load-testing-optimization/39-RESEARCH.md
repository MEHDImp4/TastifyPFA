---
phase: 39
slug: load-testing-optimization
status: research
---

# Phase 39 Research: Load Testing & ASGI

## Load Testing: Locust
- **Tool**: [Locust.io](https://locust.io/)
- **Strategy**: 
  - User 1: `StaffUser` (POST /api/commandes/, PATCH /api/commandelignes/)
  - User 2: `ClientUser` (GET /api/plats/, GET /api/categories/)
  - WebSocket testing: Use `locust-plugins` or custom events to simulate WS frames.

## ASGI Server: Daphne vs Gunicorn/Uvicorn
- **Daphne**: Official server for Django Channels. Handles HTTP and WS. Simple to config.
- **Gunicorn + UvicornWorkers**: High performance for HTTP. 

## Bottlenecks to Watch
1.  **MySQL Connections**: Max connections limit.
2.  **Redis Throughput**: For WebSockets and Celery.
3.  **IO Bound Tasks**: Celery worker concurrency.

## Static Assets
- In dev, SPAs run their own Vite dev servers.
- In prod, Vite should build to static files, and Nginx should serve them.

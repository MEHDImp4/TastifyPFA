# Project: TastifyPFA

## Purpose
Tastify is an ERP web full-stack dedicated to the management of Moroccan restaurants (PME). It serves as an accessible, high-performance alternative to expensive POS systems on the market, incorporating modern UI paradigms, real-time Kitchen Display Systems, and AI-driven recommendations.

## Tech Stack
- **Backend:** Django 5.0, Django REST Framework 3.15, Celery 5.x, Daphne (WebSockets).
- **Frontend:** React 18, Vite 5.x, Tailwind CSS (ECO-FRESH Palette).
- **Database:** MySQL 8.0, Redis 7 (Broker & Channel Layer).
- **AI/ML:** scikit-learn (collaborative filtering), HuggingFace Transformers (BERT sentiment analysis).
- **Infra:** Docker Compose 3.9, Nginx alpine.

## Architecture Rules
- **Strict Decoupling:** The Django backend must NEVER return HTML templates in production. All communication is exclusively via JSON REST or WebSocket.
- **JWT Auth:** Access and refresh tokens are managed by the frontend, with refresh tokens securely stored in HttpOnly cookies to prevent XSS.
- **RBAC:** Four distinct roles (`GERANT`, `SERVEUR`, `CUISINIER`, `CLIENT`) governing access across four independent React SPAs.
- **Event-Driven:** Orders are pushed in real-time via Django Channels and Redis to the KDS (`ws://host/ws/cuisine/`).

## Project Context
The project operates under strict adherence to `GEMINI.md` mandates, emphasizing atomic commits, self-documenting code without boilerplate comments, and the GSD `.planning/` framework.

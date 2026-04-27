# Technology Stack

> **Note:** Versions are strictly locked as per the Cahier de Charges.

## Backend
| Component | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Django + DRF | 5.0 / 3.15 | REST API, ORM, Models |
| WebSockets | Django Channels + Daphne | 4.x | Real-time KDS & Floor map |
| Background Jobs | Celery + Beat | 5.x | Async tasks, cron, email, AI batch |
| Message Broker | Redis | 7-alpine | Celery Broker & Channels Layer |
| Database | MySQL | 8.0 | Primary relational store |
| Auth | djangorestframework-simplejwt | 5.x | JWT auth (access/refresh) |

## Frontend
| Component | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React + Vite | 18.x / 5.x | 4 distinct decoupled SPAs |
| Styling | Tailwind CSS | 3.x | ECO-FRESH design system |
| Offline | vite-plugin-pwa | latest | PWA caching for Serveur app |

## Artificial Intelligence
| Component | Technology | Version | Purpose |
|---|---|---|---|
| Recommendations | scikit-learn | 1.x | Collaborative filtering |
| Sentiment Analysis| HuggingFace Transformers | 4.x | Multilingual BERT model |

## Infrastructure & DevOps
| Component | Technology | Version | Purpose |
|---|---|---|---|
| Orchestration | Docker Compose | 3.9 | Local & prod deployment |
| Reverse Proxy | Nginx | alpine | Serve React static files & proxy API/WS |
| Testing | pytest + pytest-django | latest | Unit & Integration testing |

# Tastify - Project Overview

This document summarizes the core specifications defined in the master [Cahier de Charges](../../cahier_de_charge_tastify.md).

## 1. Context
Tastify is an accessible, full-stack web ERP designed for Moroccan restaurants (PME). The system is divided into four distinct React SPA modules communicating with a central Django backend.

## 2. Technology Stack
- **Backend**: Django 5.0, Django REST Framework 3.15, Celery 5.x, Daphne
- **Real-time**: Django Channels 4.x, Redis 7-alpine
- **Database**: MySQL 8.0
- **Frontend**: React 18, Vite 5.x, Tailwind CSS 3.x
- **Authentication**: JWT (djangorestframework-simplejwt) - strict separation (frontend manages tokens, refresh in HttpOnly cookie).
- **AI/ML**: scikit-learn (collaborative filtering recommendations), HuggingFace Transformers (BERT multilingual sentiment).
- **Infrastructure**: Docker Compose 3.9, Nginx alpine.

## 3. Core Modules & RBAC
The system enforces strict Role-Based Access Control (RBAC):
1. **Back-Office (GERANT)**: CRUD operations, KPIs, Stock alerts, HR management, AI config.
2. **Kitchen Display System (CUISINIER)**: Real-time WebSocket KDS, order status updates, orchestration logic for synchronized serving (`heure_lancement`).
3. **Salle (SERVEUR)**: Interactive interactive SVG/Canvas table map, order taking, split bill, QR code payments.
4. **Portail Client (CLIENT)**: Online reservations, AI-driven dish recommendations, loyalty program (Bronze/Silver/Gold).

## 4. Key Constraints
- **Strict Decoupling**: Django NEVER renders HTML. All communication is JSON/REST or WebSocket.
- **Transactions**: Critical tables like `commande` use Django signals (`post_save`) for robust recalculations (e.g., `montant_total`).
- **Soft Deletes**: Use `is_active` or `est_actif` rather than physical DELETE operations for critical business data (Plats, Employes).
- **Testing**: Minimum 80% coverage (pytest, Locust for load testing).

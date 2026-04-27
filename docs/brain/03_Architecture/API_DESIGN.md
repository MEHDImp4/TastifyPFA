# API Design & Communication

## 1. REST API (Django DRF)
The primary interface for CRUD operations.
- **Format**: JSON only. No HTML rendering.
- **Authentication**: JWT sent via `Authorization: Bearer <token>`.
- **URL Prefix**: `/api/` (proxied by Nginx to Gunicorn `web:8000`).

### Authentication Endpoints
- `POST /api/auth/login/`: Returns `{ "access", "refresh" }`
- `POST /api/auth/refresh/`: Takes refresh token, returns new access token.
- `POST /api/auth/logout/`: Blacklists refresh token.
- `GET /api/auth/me/`: Returns `{"id", "username", "role"}`.

## 2. WebSockets (Django Channels)
Used for real-time synchronization across modules.
- **URL Prefix**: `/ws/` (proxied by Nginx to Daphne `daphne:9001`).
- **Channel Layer**: Redis (`redis://redis:6379/0`).

### Connections
- `ws://host/ws/cuisine/`: Cuisinier KDS.
- `ws://host/ws/salle/`: Serveur Tablet.

### Event Payloads
**`nouvelle_commande`** (Pushed to KDS)
```json
{
  "type": "nouvelle_commande",
  "commande": {
    "id": 42,
    "table_numero": 7,
    "heure": "20:14:32",
    "lignes": [
      {"id": 101, "plat": "Tajine Agneau", "quantite": 2, "notes": "sans piment", "temps_prep": 20}
    ],
    "heure_lancement_orchestre": "20:15:00"
  }
}
```

**`plat_pret`** (Pushed to Salle)
Triggered when Cuisinier marks a line as `pret` via `PATCH /api/lignes/{id}/statut/`.

## 3. JWT Security Rules
- `ACCESS_TOKEN_LIFETIME`: 15 minutes.
- `REFRESH_TOKEN_LIFETIME`: 7 days.
- `ROTATE_REFRESH_TOKENS`: True.
- `BLACKLIST_AFTER_ROTATION`: True.
- Payload must include the user's `role` to allow frontend RBAC routing before any API calls.

# API Design & Communication

## 1. REST API (Django DRF)
The primary interface for CRUD operations.
- **Format**: JSON only. No HTML rendering.
- **Authentication**: JWT sent via `Authorization: Bearer <token>`.
- **URL Prefix**: `/api/` (proxied by Nginx to Gunicorn `web:8000`).

### Authentication Endpoints
- `POST /api/users/login/`: Returns `{ "access", "refresh" }`
- `POST /api/users/refresh/`: Takes refresh token, returns new access token, username, and role.
- `POST /api/users/logout/`: Blacklists refresh token.

## 2. WebSockets (Django Channels)
Utilisés pour la synchronisation temps réel globale.
- **URL Prefix**: `/ws/staff/` (pour GERANT, SERVEUR, CUISINIER).
- **Format Auth**: JWA envoyé via query string `?token=...`.

### Event Payloads
**`order_created` / `order_updated`**
```json
{
  "type": "order_created",
  "payload": {
    "order": {
      "id": 16,
      "table": 13,
      "statut": "EN_COURS",
      "lignes": [
        {
          "id": 18, 
          "plat_details": {"nom": "Briouates"}, 
          "statut": "EN_ATTENTE",
          "heure_lancement": "2026-05-03T14:37:48Z"
        }
      ]
    }
  }
}
```

**`line_launched`** (Spécifique KDS)
Envoyé par le worker Celery au moment du lancement.
```json
{
  "type": "line_launched",
  "payload": {
    "ligne_id": 18,
    "commande_id": 16,
    "plat_nom": "Briouates au Fromage",
    "heure_lancement": "2026-05-03T13:37:48Z",
    "heure_fin_estimee": "2026-05-03T13:49:48Z"
  }
}
```

## 3. JWT Security Rules
- `ACCESS_TOKEN_LIFETIME`: 15 minutes.
- `REFRESH_TOKEN_LIFETIME`: 7 days.
- `ROTATE_REFRESH_TOKENS`: True.
- `BLACKLIST_AFTER_ROTATION`: True.
- Payload must include the user's `role` to allow frontend RBAC routing before any API calls.

# Role-Based Access Control (RBAC) Model

The Tastify system relies on a strict 4-tier RBAC system implemented via a custom `role` field on the Django `AbstractUser` model.

## 1. Roles

| Role | Enums | React SPA | Permissions Scope |
|---|---|---|---|
| **Gérant** | `GERANT` | Back-Office | Full CRUD access, Dashboards, HR, Global settings, Reports. |
| **Serveur** | `SERVEUR` | Salle | Read access to menu/tables. Create orders, manage their own tables, QR payments. |
| **Cuisinier**| `CUISINIER`| KDS | Read access to orders/ingredients. Update `statut` of plats in `ligne_commande`. |
| **Client** | `CLIENT` | Portail | Read menu, create reservations, place orders for themselves. |

## 2. Django Implementation

Permissions are enforced via custom DRF permission classes.

```python
from rest_framework.permissions import BasePermission

class IsGerant(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == 'GERANT')

class IsServeurOrGerant(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in ['SERVEUR', 'GERANT'])
```

Usage in `ModelViewSet`:
```python
class PlatViewSet(ModelViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]  # Everyone can read
        return [IsGerant()]             # Only GERANT can write
```

## 3. Frontend Routing
The user's role is embedded in the JWT payload (via custom `TOKEN_OBTAIN_SERIALIZER`). The frontend decodes the token and redirects the user to the correct SPA.
If a SERVEUR tries to access the Back-Office URL, the Nginx/React router will block it and/or the backend API will return `403 Forbidden` on dashboard endpoints.

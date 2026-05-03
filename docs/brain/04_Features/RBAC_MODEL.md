# Role-Based Access Control (RBAC) Model

The Tastify system relies on a strict 4-tier RBAC system implemented via a custom `role` field on the Django `AbstractUser` model.

## 1. Roles

| Role | Enums | Front-end Portal | Permissions Scope |
|---|---|---|---|
| **Gérant** | `GERANT` | Staff (Port 3000) | Full CRUD access, Dashboards, HR, Global settings, Reports. |
| **Serveur** | `SERVEUR` | Staff (Port 3000) | Read menu/tables. Create orders, manage tables, process payments. |
| **Cuisinier**| `CUISINIER`| Staff (Port 3000) | Read orders. Update `statut` of plats (KDS view). |
| **Client** | `CLIENT` | Client (Port 3003) | Read menu, create reservations, place orders. |

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

## 3. Frontend Routing & Gating
Le système utilise deux portails distincts :
- **Staff (Port 3000)** : Accepte uniquement `GERANT`, `SERVEUR`, `CUISINIER`.
- **Client (Port 3003)** : Accepte uniquement `CLIENT`.

### Logique de Gating
La protection est faite à deux niveaux :
1. **Frontend** : Le `roleAccess.ts` centralise la logique de rejet. Si un utilisateur essaie de se connecter au mauvais portail, l'accès est bloqué au niveau du composant `Login`.
2. **Backend** : Chaque endpoint API est protégé par des classes de permission (ex: `IsGerant`) qui renvoient `403 Forbidden` si le rôle ne correspond pas.

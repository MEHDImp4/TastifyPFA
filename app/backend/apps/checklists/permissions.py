from rest_framework import permissions

from apps.users.models import Utilisateur


CHECKLIST_STAFF_ROLES = {
    Utilisateur.Role.GERANT,
    Utilisateur.Role.SERVEUR,
    Utilisateur.Role.CUISINIER,
}


class IsChecklistStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in CHECKLIST_STAFF_ROLES
        )


class IsGerantOrReadOnlyForChecklistStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (
            request.user
            and request.user.is_authenticated
            and request.user.role in CHECKLIST_STAFF_ROLES
        ):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == Utilisateur.Role.GERANT


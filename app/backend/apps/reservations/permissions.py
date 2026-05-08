from rest_framework import permissions

from apps.users.models import Utilisateur

STAFF_ROLES = {Utilisateur.Role.GERANT, Utilisateur.Role.SERVEUR, Utilisateur.Role.CUISINIER}


class IsStaffOrOwnReservation(permissions.BasePermission):
    """
    Grants global access to GERANT / SERVEUR, and object-level access only when
    the authenticated client is the reservation owner (T-23-04).
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role in STAFF_ROLES:
            return True
        return obj.client_id == request.user.pk

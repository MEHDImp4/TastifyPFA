from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()

class IsGerant(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.GERANT)

class IsServeurOrGerant(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [User.Role.SERVEUR, User.Role.GERANT])

class IsCuisinierOrGerant(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [User.Role.CUISINIER, User.Role.GERANT])
from rest_framework import permissions
from .tokens import validate_payment_token
from .exceptions import InvalidTokenError


class HasValidPaymentToken(permissions.BasePermission):
    """
    Permission that allows access if a valid payment token is provided in the request data.
    """

    def has_permission(self, request, view):
        token = request.data.get('token')
        if not token:
            return False
        
        try:
            payload = validate_payment_token(token)
            # Store payload in request for later use in the view
            request.payment_payload = payload
            return True
        except InvalidTokenError:
            return False

from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import MagicMock
from rest_framework.request import Request
from apps.users.permissions import IsGerant, IsServeurOrGerant, IsCuisinierOrGerant

User = get_user_model()

class PermissionTestCase(TestCase):
    def setUp(self):
        self.gerant = User.objects.create_user(username='gerant', role=User.Role.GERANT)
        self.serveur = User.objects.create_user(username='serveur', role=User.Role.SERVEUR)
        self.cuisinier = User.objects.create_user(username='cuisinier', role=User.Role.CUISINIER)
        self.client = User.objects.create_user(username='client', role=User.Role.CLIENT)
        self.unauthenticated_user = MagicMock()
        self.unauthenticated_user.is_authenticated = False

    def create_request(self, user):
        request = MagicMock(spec=Request)
        request.user = user
        return request

    def test_is_gerant(self):
        permission = IsGerant()
        
        self.assertTrue(permission.has_permission(self.create_request(self.gerant), None))
        self.assertFalse(permission.has_permission(self.create_request(self.serveur), None))
        self.assertFalse(permission.has_permission(self.create_request(self.cuisinier), None))
        self.assertFalse(permission.has_permission(self.create_request(self.client), None))
        self.assertFalse(permission.has_permission(self.create_request(self.unauthenticated_user), None))

    def test_is_serveur_or_gerant(self):
        permission = IsServeurOrGerant()
        
        self.assertTrue(permission.has_permission(self.create_request(self.gerant), None))
        self.assertTrue(permission.has_permission(self.create_request(self.serveur), None))
        self.assertFalse(permission.has_permission(self.create_request(self.cuisinier), None))
        self.assertFalse(permission.has_permission(self.create_request(self.client), None))
        self.assertFalse(permission.has_permission(self.create_request(self.unauthenticated_user), None))

    def test_is_cuisinier_or_gerant(self):
        permission = IsCuisinierOrGerant()
        
        self.assertTrue(permission.has_permission(self.create_request(self.gerant), None))
        self.assertTrue(permission.has_permission(self.create_request(self.cuisinier), None))
        self.assertFalse(permission.has_permission(self.create_request(self.serveur), None))
        self.assertFalse(permission.has_permission(self.create_request(self.client), None))
        self.assertFalse(permission.has_permission(self.create_request(self.unauthenticated_user), None))
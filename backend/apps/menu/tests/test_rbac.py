from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.menu.models import Categorie

User = get_user_model()


class RBACTest(TestCase):
    """D-05: GERANT has full CRUD; SERVEUR/CUISINIER/CLIENT are read-only."""

    def setUp(self):
        self.gerant = User.objects.create_user(
            username='gerant_rbac', password='pass', role=User.Role.GERANT
        )
        self.serveur = User.objects.create_user(
            username='serveur_rbac', password='pass', role=User.Role.SERVEUR
        )
        self.cuisinier = User.objects.create_user(
            username='cuisinier_rbac', password='pass', role=User.Role.CUISINIER
        )
        self.client_user = User.objects.create_user(
            username='client_rbac', password='pass', role=User.Role.CLIENT
        )
        self.categorie = Categorie.objects.create(nom='TestCat')
        self.api_client = APIClient()

    def _assert_write_forbidden(self, user):
        self.api_client.force_authenticate(user=user)
        post_r = self.api_client.post('/api/categories/', {'nom': 'X'}, format='json')
        patch_r = self.api_client.patch(
            f'/api/categories/{self.categorie.pk}/', {'nom': 'Y'}, format='json'
        )
        delete_r = self.api_client.delete(f'/api/categories/{self.categorie.pk}/')
        self.assertEqual(post_r.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(patch_r.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(delete_r.status_code, status.HTTP_403_FORBIDDEN)

    def test_serveur_cannot_write(self):
        self._assert_write_forbidden(self.serveur)

    def test_cuisinier_cannot_write(self):
        self._assert_write_forbidden(self.cuisinier)

    def test_client_cannot_write(self):
        self._assert_write_forbidden(self.client_user)

    def test_gerant_can_create(self):
        self.api_client.force_authenticate(user=self.gerant)
        response = self.api_client.post(
            '/api/categories/', {'nom': 'Entrées GERANT'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_unauthenticated_cannot_access(self):
        self.api_client.force_authenticate(user=None)
        self.api_client.credentials()
        response = self.api_client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

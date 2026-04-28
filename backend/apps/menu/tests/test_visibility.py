from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.menu.models import Categorie

User = get_user_model()


class VisibilityTest(TestCase):
    """D-06: Non-GERANT users only see est_active=True categories."""

    def setUp(self):
        self.gerant = User.objects.create_user(
            username='gerant_vis', password='pass', role=User.Role.GERANT
        )
        self.serveur = User.objects.create_user(
            username='serveur_vis', password='pass', role=User.Role.SERVEUR
        )
        self.active_cat = Categorie.objects.create(nom='Active Cat', est_active=True)
        self.inactive_cat = Categorie.objects.create(nom='Inactive Cat', est_active=False)
        self.api_client = APIClient()

    def test_non_gerant_sees_only_active(self):
        """D-06: SERVEUR receives only active categories."""
        self.api_client.force_authenticate(user=self.serveur)
        response = self.api_client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [c['nom'] for c in response.data]
        self.assertIn('Active Cat', names)
        self.assertNotIn('Inactive Cat', names)

    def test_gerant_sees_all_categories(self):
        """D-06: GERANT sees both active and inactive categories."""
        self.api_client.force_authenticate(user=self.gerant)
        response = self.api_client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [c['nom'] for c in response.data]
        self.assertIn('Active Cat', names)
        self.assertIn('Inactive Cat', names)

    def test_inactive_category_not_directly_accessible_by_non_gerant(self):
        """D-06: Non-GERANT cannot retrieve a specific inactive category by ID."""
        self.api_client.force_authenticate(user=self.serveur)
        response = self.api_client.get(f'/api/categories/{self.inactive_cat.pk}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

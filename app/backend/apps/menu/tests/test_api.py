from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.menu.models import Categorie

User = get_user_model()


class CategorieAPITest(TestCase):
    """D-04: CRUD endpoints exist and behave correctly."""

    def setUp(self):
        self.client = APIClient()
        self.gerant = User.objects.create_user(
            username='gerant_api', password='testpass123', role=User.Role.GERANT
        )
        self.client.force_authenticate(user=self.gerant)
        self.categorie = Categorie.objects.create(
            nom='Boissons', description='Toutes les boissons', ordre_affichage=1
        )

    def test_list_categories(self):
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_category(self):
        data = {'nom': 'Desserts', 'description': 'Les desserts', 'ordre_affichage': 2}
        response = self.client.post('/api/categories/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nom'], 'Desserts')

    def test_partial_update_category(self):
        response = self.client.patch(
            f'/api/categories/{self.categorie.pk}/',
            {'description': 'Updated'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_soft_delete_via_api(self):
        """D-07 via API: DELETE endpoint sets est_active=False."""
        response = self.client.delete(f'/api/categories/{self.categorie.pk}/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.categorie.refresh_from_db()
        self.assertFalse(self.categorie.est_active)
        self.assertTrue(Categorie.objects.filter(pk=self.categorie.pk).exists())

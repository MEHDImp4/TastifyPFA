import io

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image
from rest_framework.test import APIClient
from rest_framework import status
from apps.menu.models import Categorie

User = get_user_model()


def make_test_image(name='category.png'):
    image = Image.new('RGB', (10, 10), color='navy')
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type='image/png')


class CategorieAPITest(TestCase):
    """D-04: CRUD endpoints exist and behave correctly."""

    def setUp(self):
        self.client = APIClient()
        self.gerant = User.objects.create_user(
            username='gerant_api', password='testpass123', role=User.Role.GERANT
        )
        self.serveur = User.objects.create_user(
            username='serveur_api', password='testpass123', role=User.Role.SERVEUR
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

    def test_create_category_with_image_uses_normalized_media_path(self):
        response = self.client.post(
            '/api/categories/',
            {
                'nom': 'Patisseries',
                'description': 'Desserts signatures',
                'ordre_affichage': 3,
                'image': make_test_image(),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nom'], 'Patisseries')
        self.assertIsNotNone(response.data['image'])
        self.assertTrue(response.data['image'].startswith('/media/categories/'))

    def test_partial_update_category_replaces_existing_image(self):
        self.categorie.image = make_test_image('initial-category.png')
        self.categorie.save(update_fields=['image', 'updated_at'])
        previous_image_name = self.categorie.image.name

        response = self.client.patch(
            f'/api/categories/{self.categorie.pk}/',
            {'image': make_test_image('replacement-category.png')},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.categorie.refresh_from_db()
        self.assertNotEqual(self.categorie.image.name, previous_image_name)
        self.assertTrue(self.categorie.image.name.startswith('categories/'))
        self.assertTrue(response.data['image'].startswith('/media/categories/'))

    def test_partial_update_category_can_clear_existing_image_with_null(self):
        self.categorie.image = make_test_image('clearable-category.png')
        self.categorie.save(update_fields=['image', 'updated_at'])

        response = self.client.patch(
            f'/api/categories/{self.categorie.pk}/',
            {'image': None},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.categorie.refresh_from_db()
        self.assertFalse(self.categorie.image)
        self.assertIsNone(response.data['image'])

    def test_non_manager_multipart_category_write_is_forbidden(self):
        self.client.force_authenticate(user=self.serveur)

        response = self.client.post(
            '/api/categories/',
            {
                'nom': 'Forbidden',
                'description': 'Should not persist',
                'ordre_affichage': 9,
                'image': make_test_image('forbidden-category.png'),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Categorie.objects.filter(nom='Forbidden').exists())

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

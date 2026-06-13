import io

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image
from rest_framework.test import APIClient
from rest_framework import status
from apps.menu.models import Categorie, Plat

User = get_user_model()


def make_test_image(name='plat.png'):
    image = Image.new('RGB', (10, 10), color='darkgreen')
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type='image/png')


class PlatAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.gerant = User.objects.create_user(
            username='gerant_plat', password='testpass123', role=User.Role.GERANT
        )
        self.serveur = User.objects.create_user(
            username='serveur_plat', password='testpass123', role=User.Role.SERVEUR
        )
        self.categorie = Categorie.objects.create(nom='Entrées Test', ordre_affichage=1)
        self.plat = Plat.objects.create(
            categorie=self.categorie,
            nom='Salade Test',
            prix='10.00',
            temps_preparation=10,
        )

    def test_list_plats(self):
        """Any authenticated user can list dishes (200)."""
        self.client.force_authenticate(user=self.serveur)
        response = self.client.get('/api/plats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_plat_as_gerant(self):
        """GERANT can create a dish (201)."""
        self.client.force_authenticate(user=self.gerant)
        data = {
            'categorie': self.categorie.pk,
            'nom': 'Nouveau Plat',
            'prix': '15.00',
            'temps_preparation': 20,
        }
        response = self.client.post('/api/plats/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nom'], 'Nouveau Plat')

    def test_create_plat_with_image_uses_normalized_media_path(self):
        self.client.force_authenticate(user=self.gerant)
        response = self.client.post(
            '/api/plats/',
            {
                'categorie': self.categorie.pk,
                'nom': 'Tagine Image',
                'prix': '19.00',
                'temps_preparation': 18,
                'image': make_test_image(),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nom'], 'Tagine Image')
        self.assertIsNotNone(response.data['image'])
        self.assertTrue(response.data['image'].startswith('/media/plats/'))
        self.assertTrue(response.data['image'].endswith('.webp'))

    def test_list_plat_with_missing_image_returns_null(self):
        self.client.force_authenticate(user=self.serveur)
        self.plat.image = 'plats/missing-plat.png'
        self.plat.save(update_fields=['image', 'updated_at'])

        response = self.client.get('/api/plats/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = next(item for item in response.data if item['id'] == self.plat.id)
        self.assertIsNone(payload['image'])

    def test_create_plat_as_serveur_forbidden(self):
        """Non-GERANT cannot create a dish (403)."""
        self.client.force_authenticate(user=self.serveur)
        data = {
            'categorie': self.categorie.pk,
            'nom': 'Plat Interdit',
            'prix': '12.00',
            'temps_preparation': 15,
        }
        response = self.client.post('/api/plats/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_plat_as_serveur_with_multipart_is_forbidden(self):
        self.client.force_authenticate(user=self.serveur)
        response = self.client.post(
            '/api/plats/',
            {
                'categorie': self.categorie.pk,
                'nom': 'Plat Multipart Interdit',
                'prix': '12.00',
                'temps_preparation': 15,
                'image': make_test_image('forbidden-plat.png'),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Plat.objects.filter(nom='Plat Multipart Interdit').exists())

    def test_partial_update_plat_replaces_existing_image(self):
        self.client.force_authenticate(user=self.gerant)
        self.plat.image = make_test_image('initial-plat.png')
        self.plat.save(update_fields=['image', 'updated_at'])
        previous_image_name = self.plat.image.name

        response = self.client.patch(
            f'/api/plats/{self.plat.pk}/',
            {'image': make_test_image('replacement-plat.png')},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.plat.refresh_from_db()
        self.assertNotEqual(self.plat.image.name, previous_image_name)
        self.assertTrue(self.plat.image.name.startswith('plats/'))
        self.assertTrue(self.plat.image.name.endswith('.webp'))
        self.assertTrue(response.data['image'].startswith('/media/plats/'))
        self.assertTrue(response.data['image'].endswith('.webp'))

    def test_partial_update_plat_can_clear_existing_image_with_null(self):
        self.client.force_authenticate(user=self.gerant)
        self.plat.image = make_test_image('clearable-plat.png')
        self.plat.save(update_fields=['image', 'updated_at'])

        response = self.client.patch(
            f'/api/plats/{self.plat.pk}/',
            {'image': None},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.plat.refresh_from_db()
        self.assertFalse(self.plat.image)
        self.assertIsNone(response.data['image'])

    def test_soft_delete_plat(self):
        """GERANT DELETE sets est_active=False; row still exists in DB."""
        self.client.force_authenticate(user=self.gerant)
        response = self.client.delete(f'/api/plats/{self.plat.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.plat.refresh_from_db()
        self.assertFalse(self.plat.est_active)
        self.assertTrue(Plat.objects.filter(pk=self.plat.pk).exists())

    def test_visibility_filtering(self):
        """Non-GERANT sees only est_active=True AND est_disponible=True dishes."""
        inactive_plat = Plat.objects.create(
            categorie=self.categorie,
            nom='Plat Inactif',
            prix='8.00',
            est_active=False,
            est_disponible=True,
        )
        unavailable_plat = Plat.objects.create(
            categorie=self.categorie,
            nom='Plat Indisponible',
            prix='8.00',
            est_active=True,
            est_disponible=False,
        )
        self.client.force_authenticate(user=self.serveur)
        response = self.client.get('/api/plats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        noms = [p['nom'] for p in response.data]
        self.assertIn('Salade Test', noms)
        self.assertNotIn('Plat Inactif', noms)
        self.assertNotIn('Plat Indisponible', noms)

    def test_plat_detail_access(self):
        """Non-GERANT gets 404 for an inactive dish."""
        self.plat.est_active = False
        self.plat.save(update_fields=['est_active', 'updated_at'])
        self.client.force_authenticate(user=self.serveur)
        response = self.client.get(f'/api/plats/{self.plat.pk}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

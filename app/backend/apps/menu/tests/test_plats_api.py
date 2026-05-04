from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.menu.models import Categorie, Plat

User = get_user_model()


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

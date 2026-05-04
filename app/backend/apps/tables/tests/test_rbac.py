from django.test import TestCase
from rest_framework.test import APIClient
from apps.users.models import Utilisateur
from apps.tables.models import Table


class TableRBACTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.gerant = Utilisateur.objects.create_user(
            username='gerant', password='pass', role='GERANT'
        )
        self.serveur = Utilisateur.objects.create_user(
            username='serveur', password='pass', role='SERVEUR'
        )
        self.table = Table.objects.create(numero=1, capacite=4)

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def test_unauthenticated_list_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/tables/')
        self.assertEqual(response.status_code, 401)

    def test_serveur_can_list_tables(self):
        self._auth(self.serveur)
        response = self.client.get('/api/tables/')
        self.assertEqual(response.status_code, 200)

    def test_serveur_cannot_create_table(self):
        self._auth(self.serveur)
        response = self.client.post('/api/tables/', {'numero': 99, 'capacite': 2})
        self.assertEqual(response.status_code, 403)

    def test_serveur_cannot_delete_table(self):
        self._auth(self.serveur)
        response = self.client.delete(f'/api/tables/{self.table.pk}/')
        self.assertEqual(response.status_code, 403)

    def test_gerant_can_create_table(self):
        self._auth(self.gerant)
        response = self.client.post('/api/tables/', {'numero': 50, 'capacite': 6})
        self.assertEqual(response.status_code, 201)

    def test_gerant_can_soft_delete_table(self):
        self._auth(self.gerant)
        response = self.client.delete(f'/api/tables/{self.table.pk}/')
        self.assertEqual(response.status_code, 204)
        self.table.refresh_from_db()
        self.assertFalse(self.table.est_active)

    def test_soft_deleted_table_hidden_from_serveur(self):
        self.table.delete()
        self._auth(self.serveur)
        response = self.client.get('/api/tables/')
        ids = [t['id'] for t in response.data]
        self.assertNotIn(self.table.pk, ids)

    def test_gerant_sees_soft_deleted_table(self):
        self.table.delete()
        self._auth(self.gerant)
        response = self.client.get('/api/tables/')
        ids = [t['id'] for t in response.data]
        self.assertIn(self.table.pk, ids)

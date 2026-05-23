from decimal import Decimal
from urllib.parse import quote

from django.test import TestCase
from rest_framework.test import APIClient
from apps.commandes.models import Commande
from apps.menu.models import Categorie, Plat
from apps.users.models import Utilisateur
from apps.tables.models import Table


class TableAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.gerant = Utilisateur.objects.create_user(
            username='gerant_api', password='pass', role='GERANT'
        )
        self.client.force_authenticate(user=self.gerant)
        self.table = Table.objects.create(numero=1, capacite=4)

    def test_list_returns_200_with_table(self):
        response = self.client.get('/api/tables/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_list_response_shape(self):
        response = self.client.get('/api/tables/')
        item = response.data[0]
        expected_fields = {'id', 'numero', 'capacite', 'statut', 'pos_x', 'pos_y',
                            'est_active', 'created_at', 'updated_at'}
        self.assertTrue(expected_fields.issubset(set(item.keys())))

    def test_retrieve_returns_200(self):
        response = self.client.get(f'/api/tables/{self.table.pk}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['numero'], 1)

    def test_create_returns_201_with_correct_defaults(self):
        response = self.client.post('/api/tables/', {'numero': 5, 'capacite': 6})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['statut'], Table.Statut.LIBRE)
        self.assertEqual(response.data['est_active'], True)
        self.assertEqual(response.data['pos_x'], 0.0)
        self.assertEqual(response.data['pos_y'], 0.0)

    def test_partial_update_capacite(self):
        response = self.client.patch(
            f'/api/tables/{self.table.pk}/', {'capacite': 8}
        )
        self.assertEqual(response.status_code, 200)
        self.table.refresh_from_db()
        self.assertEqual(self.table.capacite, 8)

    def test_partial_update_statut(self):
        response = self.client.patch(
            f'/api/tables/{self.table.pk}/', {'statut': 'OCCUPEE'}
        )
        self.assertEqual(response.status_code, 200)
        self.table.refresh_from_db()
        self.assertEqual(self.table.statut, 'OCCUPEE')

    def test_destroy_soft_deletes(self):
        response = self.client.delete(f'/api/tables/{self.table.pk}/')
        self.assertEqual(response.status_code, 204)
        self.table.refresh_from_db()
        self.assertFalse(self.table.est_active)

    def test_destroy_row_persists_in_db(self):
        self.client.delete(f'/api/tables/{self.table.pk}/')
        self.assertTrue(Table.objects.filter(pk=self.table.pk).exists())

    def test_numero_must_be_unique(self):
        response = self.client.post('/api/tables/', {'numero': 1, 'capacite': 2})
        self.assertEqual(response.status_code, 400)

    def test_pos_x_pos_y_updatable(self):
        response = self.client.patch(
            f'/api/tables/{self.table.pk}/', {'pos_x': 150.5, 'pos_y': 200.0}
        )
        self.assertEqual(response.status_code, 200)
        self.table.refresh_from_db()
        self.assertAlmostEqual(float(self.table.pos_x), 150.5)
        self.assertAlmostEqual(float(self.table.pos_y), 200.0)

    def test_qr_requires_staff_role(self):
        client_user = Utilisateur.objects.create_user(
            username='client_qr_table', password='pass', role='CLIENT'
        )
        self.client.force_authenticate(user=client_user)
        response = self.client.get(f'/api/tables/{self.table.pk}/qr/')
        self.assertEqual(response.status_code, 403)

    def test_qr_returns_404_when_no_payable_order_exists(self):
        response = self.client.get(f'/api/tables/{self.table.pk}/qr/')
        self.assertEqual(response.status_code, 404)

    def test_qr_returns_token_for_unique_payable_order(self):
        categorie = Categorie.objects.create(nom='Table QR', ordre_affichage=8)
        plat = Plat.objects.create(
            nom='Pastilla',
            categorie=categorie,
            prix=Decimal('50.00'),
            temps_preparation=10,
        )
        commande = Commande.objects.create(
            table=self.table,
            serveur=self.gerant,
            statut=Commande.Statut.PRETE,
            montant_total=Decimal('50.00'),
        )
        commande.lignes.create(plat=plat, quantite=1, prix_unitaire=Decimal('50.00'))

        response = self.client.get(f'/api/tables/{self.table.pk}/qr/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['commande_id'], commande.id)
        self.assertIn('token', response.data)
        self.assertEqual(
            response.data['payment_url'],
            f"/pay/{quote(response.data['token'], safe='')}",
        )

    def test_qr_returns_409_when_multiple_payable_orders_exist(self):
        categorie = Categorie.objects.create(nom='Table QR multi', ordre_affichage=9)
        plat = Plat.objects.create(
            nom='Rfissa',
            categorie=categorie,
            prix=Decimal('35.00'),
            temps_preparation=12,
        )
        for _ in range(2):
            commande = Commande.objects.create(
                table=self.table,
                serveur=self.gerant,
                statut=Commande.Statut.PRETE,
                montant_total=Decimal('35.00'),
            )
            commande.lignes.create(plat=plat, quantite=1, prix_unitaire=Decimal('35.00'))

        response = self.client.get(f'/api/tables/{self.table.pk}/qr/')
        self.assertEqual(response.status_code, 409)

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.tables.models import Table
from apps.menu.models import Categorie, Plat
from apps.commandes.models import Commande

User = get_user_model()

class AdvancedCommandeAPITestCase(APITestCase):
    def setUp(self):
        self.serveur = User.objects.create_user(
            username='serveur', password='password123', role=User.Role.SERVEUR
        )
        self.table = Table.objects.create(numero=5, capacite=2)
        self.categorie = Categorie.objects.create(nom='Boissons')
        self.plat = Plat.objects.create(nom='Thé', prix=15, categorie=self.categorie)
        
        self.client.force_authenticate(user=self.serveur)
        res = self.client.post(reverse('commande-list'), {'table': self.table.id, 'lignes': []}, format='json')
        self.commande_id = res.data['id']
        self.add_items_url = reverse('commande-add-items', kwargs={'pk': self.commande_id})

    def test_add_items_success(self):
        data = [
            {'plat': self.plat.id, 'quantite': 3, 'notes': 'Fresh mint'}
        ]
        response = self.client.post(self.add_items_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['lignes']), 1)
        self.assertEqual(float(response.data['montant_total']), 45.0)

    def test_add_items_to_paid_order_fails(self):
        commande = Commande.objects.get(id=self.commande_id)
        commande.statut = Commande.Statut.PAYEE
        commande.save()
        
        data = [{'plat': self.plat.id, 'quantite': 1}]
        response = self.client.post(self.add_items_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_full_lifecycle_with_table_sync(self):
        # 1. Table is LIBRE
        self.assertEqual(Table.objects.get(id=self.table.id).statut, Table.Statut.OCCUPEE) # Already occupied by setup order
        
        # 2. Add items
        self.client.post(self.add_items_url, [{'plat': self.plat.id, 'quantite': 2}], format='json')
        
        # 3. Pay order
        detail_url = reverse('commande-detail', kwargs={'pk': self.commande_id})
        self.client.patch(detail_url, {'statut': Commande.Statut.PAYEE}, format='json')
        
        # 4. Table should be LIBRE
        self.table.refresh_from_db()
        self.assertEqual(self.table.statut, Table.Statut.LIBRE)

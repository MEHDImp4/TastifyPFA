from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

from apps.paiements.models import Paiement
from apps.tables.models import Table
from apps.commandes.models import Commande, CommandeLigne
from apps.menu.models import Plat, Categorie

User = get_user_model()

class DashboardAPITests(APITestCase):
    def setUp(self):
        # Create a gerant user
        self.gerant_user = User.objects.create_user(
            username='gerant_test',
            password='password123',
            role=User.Role.GERANT
        )
        self.url = reverse('dashboard')
        
        # Create base data
        self.category = Categorie.objects.create(nom="Test Category")
        self.plat = Plat.objects.create(
            categorie=self.category,
            nom="Test Plat",
            prix=10.0
        )
        self.table = Table.objects.create(numero=1, capacite=4)

    def test_dashboard_access_gerant(self):
        self.client.force_authenticate(user=self.gerant_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if keys exist in response
        data = response.json()
        self.assertIn('todayRevenue', data)
        self.assertIn('activeTables', data)
        self.assertIn('pendingOrders', data)
        self.assertIn('avgPrepTime', data)
        self.assertIn('revenue7Days', data)
        self.assertIn('topDishes', data)

    def test_dashboard_access_unauthorized(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_access_client(self):
        client_user = User.objects.create_user(
            username='client_test',
            password='password123',
            role=User.Role.CLIENT
        )
        self.client.force_authenticate(user=client_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_calculations(self):
        self.client.force_authenticate(user=self.gerant_user)
        
        # 1. Setup Active Table (use a different table than the one for orders to avoid signal interference)
        active_table = Table.objects.create(numero=2, capacite=2, statut=Table.Statut.OCCUPEE)
        
        # 2. Setup Pending Order
        pending_table = Table.objects.create(numero=3, capacite=2)
        # Commande creation will set pending_table to OCCUPEE, but that's fine.
        Commande.objects.create(table=pending_table, statut=Commande.Statut.EN_CUISINE)
        
        # 3. Setup Revenue (Payment)
        paid_table = Table.objects.create(numero=4, capacite=2)
        paid_commande = Commande.objects.create(table=paid_table, statut=Commande.Statut.EN_COURS)
        Paiement.objects.create(
            commande=paid_commande,
            montant=50.0,
            methode=Paiement.Methode.CARTE,
            statut=Paiement.Statut.COMPLETE
        )
        # paid_table should now be LIBRE, and paid_commande should be PAYEE (filtered out from pending)
        
        # 4. Setup Avg Prep Time
        # Prep time is calculated based on items served today
        prep_table = Table.objects.create(numero=5, capacite=2)
        prep_commande = Commande.objects.create(table=prep_table, statut=Commande.Statut.PRETE)
        now = timezone.now()
        launch_time = now - timedelta(minutes=25)
        CommandeLigne.objects.create(
            commande=prep_commande,
            plat=self.plat,
            quantite=1,
            statut=CommandeLigne.Statut.SERVI,
            heure_lancement=launch_time
        )
        
        response = self.client.get(self.url)
        data = response.json()
        
        # Active tables: table #2 (manual), table #3 (order), table #5 (order)
        # Wait, if table #5 has an order EN_COURS, it is OCCUPEE.
        # So activeTables should be 3.
        self.assertEqual(data['activeTables'], 3)
        # Pending orders: the one from table #3 (EN_CUISINE)
        # The one from table #4 was paid (PAYEE).
        # The one from table #5 (PRETE)
        # So pendingOrders should be 1.
        self.assertEqual(data['pendingOrders'], 1)
        self.assertEqual(data['todayRevenue'], 50.0)
        # avgPrepTime should be around 25 minutes
        self.assertGreaterEqual(data['avgPrepTime'], 24)
        
        # 5. Top Dishes
        self.assertEqual(len(data['topDishes']), 1)
        self.assertEqual(data['topDishes'][0]['name'], "Test Plat")
        self.assertEqual(data['topDishes'][0]['quantity'], 1)

    @patch('apps.analytics.signals.async_to_sync')
    def test_signals_trigger_update(self, mock_async_to_sync):
        # Test Paiement signal
        commande = Commande.objects.create(table=self.table)
        Paiement.objects.create(
            commande=commande,
            montant=10.0,
            methode=Paiement.Methode.ESPECES,
            statut=Paiement.Statut.COMPLETE
        )
        self.assertTrue(mock_async_to_sync.called)
        
        mock_async_to_sync.reset_mock()
        # Test Table signal
        self.table.statut = Table.Statut.LIBRE
        self.table.save()
        self.assertTrue(mock_async_to_sync.called)

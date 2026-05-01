from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.tables.models import Table
from apps.commandes.models import Commande

User = get_user_model()

class KDSPermissionsTestCase(APITestCase):
    def setUp(self):
        self.gerant = User.objects.create_user(
            username='gerant', password='password123', role=User.Role.GERANT
        )
        self.serveur = User.objects.create_user(
            username='serveur', password='password123', role=User.Role.SERVEUR
        )
        self.cuisinier = User.objects.create_user(
            username='cuisinier', password='password123', role=User.Role.CUISINIER
        )
        
        self.table1 = Table.objects.create(numero=1, capacite=4)
        self.table2 = Table.objects.create(numero=2, capacite=2)
        
        # Create some orders
        self.cmd_serveur = Commande.objects.create(
            serveur=self.serveur, 
            table=self.table1,
            statut=Commande.Statut.EN_COURS
        )
        self.cmd_kitchen = Commande.objects.create(
            serveur=self.serveur, 
            table=self.table2,
            statut=Commande.Statut.EN_CUISINE
        )
        
        self.url = reverse('commande-list')

    def test_cuisinier_can_access_list(self):
        self.client.force_authenticate(user=self.cuisinier)
        response = self.client.get(self.url)
        # Should be allowed after update
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cuisinier_queryset_filtering(self):
        self.client.force_authenticate(user=self.cuisinier)
        response = self.client.get(self.url)
        
        # Cuisinier should only see orders with statut=EN_CUISINE
        # (Assuming they see all such orders)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.cmd_kitchen.id)
        self.assertEqual(response.data[0]['statut'], Commande.Statut.EN_CUISINE)

    def test_serveur_queryset_filtering_regression(self):
        # Serveur should only see their own orders
        serveur2 = User.objects.create_user(
            username='serveur2', password='password123', role=User.Role.SERVEUR
        )
        table3 = Table.objects.create(numero=3, capacite=4)
        Commande.objects.create(
            serveur=serveur2,
            table=table3,
            statut=Commande.Statut.EN_CUISINE
        )
        
        self.client.force_authenticate(user=self.serveur)
        response = self.client.get(self.url)
        
        # Should see 2 orders (cmd_serveur, cmd_kitchen) but NOT the one from serveur2
        self.assertEqual(len(response.data), 2)
        ids = [item['id'] for item in response.data]
        self.assertIn(self.cmd_serveur.id, ids)
        self.assertIn(self.cmd_kitchen.id, ids)

    def test_cuisinier_sees_all_kitchen_orders(self):
        # Create an order for another server that is EN_CUISINE
        serveur2 = User.objects.create_user(
            username='serveur2_other', password='password123', role=User.Role.SERVEUR
        )
        table3 = Table.objects.create(numero=3, capacite=4)
        cmd_other_kitchen = Commande.objects.create(
            serveur=serveur2,
            table=table3,
            statut=Commande.Statut.EN_CUISINE
        )
        
        self.client.force_authenticate(user=self.cuisinier)
        response = self.client.get(self.url)
        
        # Should see BOTH kitchen orders regardless of serveur
        # filter(statut=EN_CUISINE)
        ids = [item['id'] for item in response.data]
        self.assertIn(self.cmd_kitchen.id, ids)
        self.assertIn(cmd_other_kitchen.id, ids)

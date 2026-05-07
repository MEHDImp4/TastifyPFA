from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.tables.models import Table
from apps.commandes.models import Commande
from apps.paiements.models import Paiement

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
        self.cmd_paid = Commande.objects.create(
            serveur=self.serveur,
            table=self.table1,
            statut=Commande.Statut.PAYEE,
        )
        
        self.url = reverse('commande-list')

    def test_cuisinier_can_access_list(self):
        self.client.force_authenticate(user=self.cuisinier)
        response = self.client.get(self.url)
        # Should be allowed after update
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cuisinier_queryset_excludes_en_cours(self):
        """P16-BE-04: CUISINIER must NOT see EN_COURS orders after Phase 16."""
        self.client.force_authenticate(user=self.cuisinier)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data]
        self.assertNotIn(self.cmd_serveur.id, ids)
        statuses = {item['statut'] for item in response.data}
        self.assertNotIn(Commande.Statut.EN_COURS, statuses)

    def test_cuisinier_queryset_includes_en_cuisine_and_prete(self):
        """P16-BE-04: CUISINIER queryset must include EN_CUISINE and PRETE."""
        table_p = Table.objects.create(numero=99, capacite=2)
        cmd_prete = Commande.objects.create(
            serveur=self.serveur,
            table=table_p,
            statut=Commande.Statut.PRETE,
        )

        self.client.force_authenticate(user=self.cuisinier)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data]
        self.assertIn(self.cmd_kitchen.id, ids)   # EN_CUISINE
        self.assertIn(cmd_prete.id, ids)          # PRETE

    def test_gerant_kitchen_scope_excludes_paid_orders(self):
        """GERANT KDS fetches must use kitchen scope so paid tickets stay hidden."""
        table_p = Table.objects.create(numero=100, capacite=2)
        cmd_prete = Commande.objects.create(
            serveur=self.serveur,
            table=table_p,
            statut=Commande.Statut.PRETE,
        )

        self.client.force_authenticate(user=self.gerant)
        response = self.client.get(self.url, {'scope': 'kitchen'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data]
        statuses = {item['statut'] for item in response.data}
        self.assertIn(self.cmd_kitchen.id, ids)
        self.assertIn(cmd_prete.id, ids)
        self.assertNotIn(self.cmd_paid.id, ids)
        self.assertEqual(statuses, {Commande.Statut.EN_CUISINE, Commande.Statut.PRETE})

    def test_gerant_kitchen_scope_excludes_fully_paid_stale_prete_orders(self):
        """Defensive guard: stale PRETE orders fully covered by payments must stay out of KDS."""
        stale_prete = Commande.objects.create(
            serveur=self.serveur,
            table=self.table2,
            statut=Commande.Statut.PRETE,
            montant_total='42.00',
        )
        Paiement.objects.create(
            commande=stale_prete,
            montant='42.00',
            methode=Paiement.Methode.ESPECES,
            statut=Paiement.Statut.COMPLETE,
        )

        self.client.force_authenticate(user=self.gerant)
        response = self.client.get(self.url, {'scope': 'kitchen'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data]
        self.assertNotIn(stale_prete.id, ids)

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

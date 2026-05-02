from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from apps.tables.models import Table
from apps.menu.models import Categorie, Plat
from apps.commandes.models import Commande, CommandeLigne

User = get_user_model()

class CommandeAPITestCase(APITestCase):
    def setUp(self):
        self.gerant = User.objects.create_user(
            username='gerant', password='password123', role=User.Role.GERANT
        )
        self.serveur1 = User.objects.create_user(
            username='serveur1', password='password123', role=User.Role.SERVEUR
        )
        self.serveur2 = User.objects.create_user(
            username='serveur2', password='password123', role=User.Role.SERVEUR
        )
        
        self.table = Table.objects.create(numero=1, capacite=4)
        self.categorie = Categorie.objects.create(nom='Entrées')
        self.plat1 = Plat.objects.create(
            nom='Salade', prix=50, categorie=self.categorie
        )
        self.plat2 = Plat.objects.create(
            nom='Soupe', prix=30, categorie=self.categorie
        )
        
        self.url = reverse('commande-list')

    def test_create_commande_atomic(self):
        self.client.force_authenticate(user=self.serveur1)
        data = {
            'table': self.table.id,
            'lignes': [
                {'plat': self.plat1.id, 'quantite': 2},
                {'plat': self.plat2.id, 'quantite': 1, 'notes': 'Extra hot'}
            ]
        }
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Commande.objects.count(), 1)
        self.assertEqual(CommandeLigne.objects.count(), 2)
        
        commande = Commande.objects.first()
        self.assertEqual(commande.serveur, self.serveur1)
        self.assertEqual(commande.table, self.table)
        
        # Verify lines
        self.assertTrue(CommandeLigne.objects.filter(commande=commande, plat=self.plat1, quantite=2).exists())
        self.assertTrue(CommandeLigne.objects.filter(commande=commande, plat=self.plat2, quantite=1, notes='Extra hot').exists())

    def test_get_queryset_filtering(self):
        # Create a second table to avoid OCCUPEE conflicts
        table2 = Table.objects.create(numero=2, capacite=2)
        
        # Create an order for serveur1 on table1
        self.client.force_authenticate(user=self.serveur1)
        self.client.post(self.url, {'table': self.table.id, 'lignes': []}, format='json')
        
        # Create an order for serveur2 on table2
        self.client.force_authenticate(user=self.serveur2)
        self.client.post(self.url, {'table': table2.id, 'lignes': []}, format='json')
        
        # Serveur1 should only see 1 order
        self.client.force_authenticate(user=self.serveur1)
        response = self.client.get(self.url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['serveur'], self.serveur1.id)
        
        # Gerant should see 2 orders
        self.client.force_authenticate(user=self.gerant)
        response = self.client.get(self.url)
        self.assertEqual(len(response.data), 2)

    def test_create_on_occupied_table_fails(self):
        # 1. Occupy the table
        self.client.force_authenticate(user=self.serveur1)
        self.client.post(self.url, {'table': self.table.id, 'lignes': []}, format='json')
        
        # 2. Try to create another order on the same table
        response = self.client.post(self.url, {'table': self.table.id, 'lignes': []}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cette table est déjà occupée", str(response.data['table'][0]))

    def test_soft_delete(self):
        self.client.force_authenticate(user=self.serveur1)
        res = self.client.post(self.url, {'table': self.table.id, 'lignes': []}, format='json')
        commande_id = res.data['id']
        
        delete_url = reverse('commande-detail', kwargs={'pk': commande_id})
        response = self.client.delete(delete_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Commande.objects.active().count(), 0)
        self.assertEqual(Commande.objects.count(), 1)
        self.assertFalse(Commande.objects.get(id=commande_id).est_active)

    def test_create_commande_defers_broadcast_until_commit(self):
        self.client.force_authenticate(user=self.serveur1)
        data = {
            'table': self.table.id,
            'lignes': [{'plat': self.plat1.id, 'quantite': 2}],
        }

        with patch('apps.commandes.signals.transaction.on_commit') as on_commit_mock:
                response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertGreaterEqual(on_commit_mock.call_count, 1)

    def test_create_commande_broadcasts_single_committed_order_snapshot(self):
        self.client.force_authenticate(user=self.serveur1)
        data = {
            'table': self.table.id,
            'lignes': [{'plat': self.plat1.id, 'quantite': 2}],
        }

        with patch('apps.commandes.signals.broadcast_staff_event') as broadcast_mock:
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_events = [
            call.args[1]['order']
            for call in broadcast_mock.call_args_list
            if call.args and call.args[0] == 'order_created'
        ]
        updated_events = [
            call.args[1]['order']
            for call in broadcast_mock.call_args_list
            if call.args and call.args[0] == 'order_updated'
        ]

        self.assertEqual(len(created_events), 1)
        self.assertEqual(len(created_events[0]['lignes']), 1)
        self.assertEqual(created_events[0]['lignes'][0]['quantite'], 2)
        self.assertEqual(len(updated_events), 1)

    def test_create_commande_schedules_reorchestration_on_commit(self):
        self.client.force_authenticate(user=self.serveur1)
        data = {
            'table': self.table.id,
            'lignes': [{'plat': self.plat1.id, 'quantite': 2}],
        }

        with patch(
            'apps.commandes.serializers.KdsOrchestrator.schedule_reorchestration_after_commit'
        ) as schedule_mock:
            response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        schedule_mock.assert_called_once()
        commande = Commande.objects.get(pk=response.data['id'])
        self.assertEqual(schedule_mock.call_args.args[0], commande.pk)

    def test_add_items_schedules_reorchestration_on_commit(self):
        self.client.force_authenticate(user=self.serveur1)
        create_response = self.client.post(self.url, {'table': self.table.id, 'lignes': []}, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        add_items_url = reverse('commande-add-items', kwargs={'pk': create_response.data['id']})
        data = [{'plat': self.plat1.id, 'quantite': 1}]

        with patch(
            'apps.commandes.views.KdsOrchestrator.schedule_reorchestration_after_commit'
        ) as schedule_mock:
            response = self.client.post(add_items_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        schedule_mock.assert_called_once_with(create_response.data['id'])

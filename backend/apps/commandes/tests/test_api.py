from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
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
        # Create an order for serveur1
        self.client.force_authenticate(user=self.serveur1)
        self.client.post(self.url, {'table': self.table.id, 'lignes': []}, format='json')
        
        # Create an order for serveur2
        self.client.force_authenticate(user=self.serveur2)
        self.client.post(self.url, {'table': self.table.id, 'lignes': []}, format='json')
        
        # Serveur1 should only see 1 order
        self.client.force_authenticate(user=self.serveur1)
        response = self.client.get(self.url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['serveur'], self.serveur1.id)
        
        # Gerant should see 2 orders
        self.client.force_authenticate(user=self.gerant)
        response = self.client.get(self.url)
        self.assertEqual(len(response.data), 2)

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

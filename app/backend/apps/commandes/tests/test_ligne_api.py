from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from apps.tables.models import Table
from apps.menu.models import Categorie, Plat
from apps.commandes.models import Commande, CommandeLigne

User = get_user_model()

class CommandeLigneAPITestCase(APITestCase):
    def setUp(self):
        self.gerant = User.objects.create_user(
            username='ligne_gerant', password='password123', role=User.Role.GERANT
        )
        self.serveur = User.objects.create_user(
            username='ligne_serveur', password='password123', role=User.Role.SERVEUR
        )
        self.cuisinier = User.objects.create_user(
            username='ligne_cuisinier', password='password123', role=User.Role.CUISINIER
        )
        
        self.table = Table.objects.create(numero=10, capacite=4)
        self.categorie = Categorie.objects.create(nom='Test Cat')
        self.plat = Plat.objects.create(nom='Test Plat', prix=50, categorie=self.categorie)
        
        self.commande = Commande.objects.create(
            table=self.table,
            serveur=self.serveur,
            statut=Commande.Statut.EN_CUISINE
        )
        self.ligne = CommandeLigne.objects.create(
            commande=self.commande,
            plat=self.plat,
            quantite=1,
            statut=CommandeLigne.Statut.EN_ATTENTE
        )
        
        self.url = reverse('commandeligne-detail', kwargs={'pk': self.ligne.pk})

    def test_cuisinier_can_mark_as_preparation(self):
        self.client.force_authenticate(user=self.cuisinier)
        response = self.client.patch(self.url, {'statut': CommandeLigne.Statut.EN_PREPARATION})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ligne.refresh_from_db()
        self.assertEqual(self.ligne.statut, CommandeLigne.Statut.EN_PREPARATION)

    def test_cuisinier_can_mark_as_pret(self):
        self.client.force_authenticate(user=self.cuisinier)
        response = self.client.patch(self.url, {'statut': CommandeLigne.Statut.PRET})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ligne.refresh_from_db()
        self.assertEqual(self.ligne.statut, CommandeLigne.Statut.PRET)

    def test_cuisinier_cannot_mark_as_servi(self):
        self.client.force_authenticate(user=self.cuisinier)
        response = self.client.patch(self.url, {'statut': CommandeLigne.Statut.SERVI})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_serveur_can_mark_as_servi_if_pret(self):
        self.ligne.statut = CommandeLigne.Statut.PRET
        self.ligne.save()
        
        self.client.force_authenticate(user=self.serveur)
        response = self.client.patch(self.url, {'statut': CommandeLigne.Statut.SERVI})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ligne.refresh_from_db()
        self.assertEqual(self.ligne.statut, CommandeLigne.Statut.SERVI)

    def test_serveur_cannot_mark_as_servi_if_not_pret(self):
        # Current status is EN_ATTENTE
        self.client.force_authenticate(user=self.serveur)
        response = self.client.patch(self.url, {'statut': CommandeLigne.Statut.SERVI})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_other_serveur_cannot_mark_as_servi(self):
        other_serveur = User.objects.create_user(
            username='other_serveur', password='password123', role=User.Role.SERVEUR
        )
        self.ligne.statut = CommandeLigne.Statut.PRET
        self.ligne.save()
        
        self.client.force_authenticate(user=other_serveur)
        response = self.client.patch(self.url, {'statut': CommandeLigne.Statut.SERVI})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ligne_update_broadcasts_order(self):
        self.client.force_authenticate(user=self.cuisinier)
        
        with patch('apps.commandes.signals.broadcast_staff_event') as broadcast_mock:
            with self.captureOnCommitCallbacks(execute=True):
                self.client.patch(self.url, {'statut': CommandeLigne.Statut.PRET})
        
        # Verify that an order_updated event was broadcasted
        # Note: it might be called multiple times due to signals, but at least once with order_updated
        broadcasted_types = [call.args[0] for call in broadcast_mock.call_args_list]
        self.assertIn('order_updated', broadcasted_types)

    def test_cuisinier_can_mark_entire_order_as_pret(self):
        self.client.force_authenticate(user=self.cuisinier)
        order_url = reverse('commande-detail', kwargs={'pk': self.commande.pk})
        response = self.client.patch(order_url, {'statut': Commande.Statut.PRETE})
        if response.status_code != 200:
            print(f"DEBUG RESPONSE: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.commande.refresh_from_db()
        self.assertEqual(self.commande.statut, Commande.Statut.PRETE)

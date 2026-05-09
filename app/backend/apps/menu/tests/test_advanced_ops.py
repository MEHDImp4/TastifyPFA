import pytest
from django.urls import reverse
from rest_framework import status
from apps.menu.models import Plat, Categorie
from apps.commandes.models import Commande, CommandeLigne

@pytest.mark.django_db
class TestAdvancedOps:
    def setup_method(self):
        self.cat = Categorie.objects.create(nom="Test Cat")
        self.plat = Plat.objects.create(nom="Test Plat", prix=10, categorie=self.cat, temps_preparation=10)
        
    def test_cuisinier_can_mark_plat_unavailable(self, cuisinier_client):
        url = reverse('plat-detail', kwargs={'pk': self.plat.pk})
        response = cuisinier_client.patch(url, {'est_disponible': False})
        assert response.status_code == status.HTTP_200_OK
        self.plat.refresh_from_db()
        assert self.plat.est_disponible is False

    def test_serveur_can_cancel_pending_line(self, serveur_client, table, plat):
        # Create a commande owned by this serveur
        from django.contrib.auth import get_user_model
        User = get_user_model()
        serveur = User.objects.get(username="serveur_user") # Assuming this exists from fixtures
        
        commande = Commande.objects.create(table=table, serveur=serveur)
        ligne = CommandeLigne.objects.create(commande=commande, plat=plat, quantite=2, statut='EN_ATTENTE')
        
        url = reverse('commandeligne-detail', kwargs={'pk': ligne.pk})
        response = serveur_client.patch(url, {'statut': 'ANNULE'})
        assert response.status_code == status.HTTP_200_OK
        ligne.refresh_from_db()
        assert ligne.statut == 'ANNULE'

    def test_serveur_cannot_cancel_preparing_line(self, serveur_client, table, plat):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        serveur = User.objects.get(username="serveur_user")
        
        commande = Commande.objects.create(table=table, serveur=serveur)
        ligne = CommandeLigne.objects.create(commande=commande, plat=plat, quantite=2, statut='EN_PREPARATION')
        
        url = reverse('commandeligne-detail', kwargs={'pk': ligne.pk})
        response = serveur_client.patch(url, {'statut': 'ANNULE'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Impossible d'annuler" in response.data['error']

import pytest
from django.urls import reverse
from rest_framework import status
from apps.hr.models import Employe, Shift, OffreEmploi
from datetime import date, time

@pytest.mark.django_db
class TestHRExtensions:
    def setup_method(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.user = User.objects.create_user(username="emp1", password="password", role="SERVEUR")
        self.employe = Employe.objects.create(user=self.user, poste="Serveur", salaire=3000, date_embauche=date.today())
        self.offre = OffreEmploi.objects.create(titre="Chef de Rang", description="Looking for a chef")

    def test_shift_creation_success(self, gerant_client):
        url = reverse('shift-list')
        data = {
            'employe': self.employe.id,
            'jour': '2026-06-01',
            'heure_debut': '08:00:00',
            'heure_fin': '16:00:00'
        }
        response = gerant_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Shift.objects.count() == 1

    def test_shift_overlap_failure(self, gerant_client):
        Shift.objects.create(employe=self.employe, jour=date(2026, 6, 1), heure_debut=time(8, 0), heure_fin=time(16, 0))
        url = reverse('shift-list')
        data = {
            'employe': self.employe.id,
            'jour': '2026-06-01',
            'heure_debut': '10:00:00',
            'heure_fin': '12:00:00'
        }
        response = gerant_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "chevauche" in str(response.data)

    def test_public_candidatura_submission(self, api_client):
        url = reverse('candidature-list')
        data = {
            'offre': self.offre.id,
            'nom_complet': "John Doe",
            'email': "john@example.com",
            'telephone': "0600000000",
            'message_motivation': "I am very motivated"
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert self.offre.candidatures.count() == 1

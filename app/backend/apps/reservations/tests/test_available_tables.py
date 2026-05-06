import datetime

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.reservations.models import Reservation
from apps.tables.models import Table
from apps.users.models import Utilisateur


URL = 'reservation-available-tables'

DATE = '2026-06-01'
DEBUT = '19:00:00'
FIN = '21:00:00'
GUESTS = 3


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def client_user(db):
    return Utilisateur.objects.create_user(
        username='avail-client',
        password='pass123',
        role=Utilisateur.Role.CLIENT,
    )


@pytest.fixture
def table(db):
    return Table.objects.create(numero=99, capacite=4)


@pytest.mark.django_db
class TestAvailableTablesAction:
    def test_returns_available_table(self, api_client, client_user, table):
        api_client.force_authenticate(user=client_user)
        response = api_client.get(reverse(URL), {
            'date': DATE,
            'heure_debut': DEBUT,
            'heure_fin': FIN,
            'nombre_personnes': GUESTS,
        })
        assert response.status_code == status.HTTP_200_OK
        ids = [t['id'] for t in response.data]
        assert table.id in ids

    def test_excludes_conflicting_table(self, api_client, client_user, table):
        Reservation.objects.create(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 6, 1),
            heure_debut=datetime.time(18, 30),
            heure_fin=datetime.time(20, 30),
            nombre_personnes=2,
            statut=Reservation.Statut.CONFIRMEE,
        )
        api_client.force_authenticate(user=client_user)
        response = api_client.get(reverse(URL), {
            'date': DATE,
            'heure_debut': DEBUT,
            'heure_fin': FIN,
            'nombre_personnes': GUESTS,
        })
        assert response.status_code == status.HTTP_200_OK
        ids = [t['id'] for t in response.data]
        assert table.id not in ids

    def test_returns_400_on_missing_params(self, api_client, client_user):
        api_client.force_authenticate(user=client_user)
        response = api_client.get(reverse(URL), {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_requires_authentication(self, api_client):
        response = api_client.get(reverse(URL), {
            'date': DATE,
            'heure_debut': DEBUT,
            'heure_fin': FIN,
            'nombre_personnes': GUESTS,
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

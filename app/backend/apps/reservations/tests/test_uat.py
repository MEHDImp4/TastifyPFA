import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.tables.models import Table
from apps.reservations.models import Reservation

User = get_user_model()

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def client_user(db):
    return User.objects.create_user(username='uat_client_2', password='password', role='CLIENT')

@pytest.fixture
def table(db):
    return Table.objects.create(numero=102, capacite=4, statut='LIBRE')

@pytest.mark.django_db
class TestPhase23UAT:
    def test_5_client_status_injection_blocked(self, api_client, client_user, table):
        """Test CR-01 Fix: Clients cannot set initial status."""
        api_client.force_authenticate(user=client_user)
        url = reverse('reservation-list')
        data = {
            'table': table.id,
            'date_reservation': '2026-05-20',
            'heure_debut': '12:00:00',
            'heure_fin': '13:00:00',
            'nombre_personnes': 2,
            'statut': 'CONFIRMEE'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'statut' in response.data
        assert 'Les clients ne peuvent pas choisir le statut initial.' in str(response.data['statut'])
        print("\nTest 5 Result: PASS - Status injection blocked")

    def test_6_midnight_wrap_overlap(self, api_client, client_user, table):
        """Test CR-02 Fix: Overlap detection near midnight with buffer."""
        # Create a reservation ending at 23:55 on May 20
        Reservation.objects.create(
            client=client_user,
            table=table,
            date_reservation='2026-05-20',
            heure_debut='23:00:00',
            heure_fin='23:55:00',
            nombre_personnes=2,
            statut='CONFIRMEE'
        )
        
        # Attempt another reservation starting at 00:05 on May 21 (within 15 min buffer)
        api_client.force_authenticate(user=client_user)
        url = reverse('reservation-list')
        
        # Overlapping because 23:55 + 15 min buffer = 00:10 on May 21.
        data = {
            'table': table.id,
            'date_reservation': '2026-05-21',
            'heure_debut': '00:05:00',
            'heure_fin': '01:00:00',
            'nombre_personnes': 2
        }
        response = api_client.post(url, data, format='json')
        
        # If it returns 201, it means validation failed to catch the cross-day overlap
        if response.status_code == 201:
             print("\nTest 6 Result: FAIL - Midnight wrap overlap NOT detected (Potential Gap)")
             assert False, "Midnight wrap overlap not detected"
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        print("\nTest 6 Result: PASS - Midnight wrap overlap detected")

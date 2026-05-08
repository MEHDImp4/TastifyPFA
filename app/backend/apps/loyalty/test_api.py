import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from apps.loyalty.models import LoyaltyProfile, LoyaltyTransaction, Reward

User = get_user_model()

@pytest.fixture
def client_api():
    return APIClient()

@pytest.fixture
def gerant_user(db):
    return User.objects.create_user(username='gerant', password='password', role=User.Role.GERANT)

@pytest.fixture
def client_user(db):
    return User.objects.create_user(username='client', password='password', role=User.Role.CLIENT)

@pytest.fixture
def loyalty_profile(client_user):
    return LoyaltyProfile.objects.create(user=client_user, points=Decimal('100.00'))

@pytest.fixture
def active_reward(db):
    return Reward.objects.create(
        nom="Boisson gratuite",
        description="Une boisson au choix",
        points_requis=Decimal('50.00'),
        est_actif=True
    )

@pytest.mark.django_db
class TestLoyaltyAPI:
    def test_client_can_see_own_status(self, client_api, client_user, loyalty_profile):
        client_api.force_authenticate(user=client_user)
        url = reverse('loyalty-my-status')
        response = client_api.get(url)
        
        assert response.status_code == 200
        assert response.data['points'] == "100.00"
        assert response.data['username'] == 'client'

    def test_client_can_list_rewards(self, client_api, client_user, active_reward):
        client_api.force_authenticate(user=client_user)
        url = reverse('reward-list')
        response = client_api.get(url)
        
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['nom'] == "Boisson gratuite"

    def test_client_can_redeem_reward(self, client_api, client_user, loyalty_profile, active_reward):
        client_api.force_authenticate(user=client_user)
        url = reverse('reward-redeem', kwargs={'pk': active_reward.pk})
        response = client_api.post(url)
        
        assert response.status_code == 200
        loyalty_profile.refresh_from_db()
        assert loyalty_profile.points == Decimal('50.00')
        
        # Check transaction
        transaction = LoyaltyTransaction.objects.get(profile=loyalty_profile, type='REDEEM')
        assert transaction.points == Decimal('-50.00')

    def test_client_insufficient_points_redeem_fails(self, client_api, client_user, active_reward):
        # Create profile with only 10 points
        LoyaltyProfile.objects.create(user=client_user, points=Decimal('10.00'))
        client_api.force_authenticate(user=client_user)
        url = reverse('reward-redeem', kwargs={'pk': active_reward.pk})
        response = client_api.post(url)
        
        assert response.status_code == 400
        assert "Points insuffisants" in response.data['detail']

    def test_gerant_can_manage_rewards(self, client_api, gerant_user):
        client_api.force_authenticate(user=gerant_user)
        url = reverse('reward-list')
        data = {
            "nom": "Nouveau Dessert",
            "description": "Un dessert gratuit",
            "points_requis": 150.0,
            "est_actif": True
        }
        response = client_api.post(url, data)
        assert response.status_code == 201
        assert Reward.objects.filter(nom="Nouveau Dessert").exists()

    def test_client_cannot_create_reward(self, client_api, client_user):
        client_api.force_authenticate(user=client_user)
        url = reverse('reward-list')
        data = {"nom": "Fraude", "points_requis": 0, "est_actif": True}
        response = client_api.post(url, data)
        assert response.status_code == 403

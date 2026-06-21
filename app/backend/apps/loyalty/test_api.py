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

@pytest.fixture
def inactive_reward(db):
    return Reward.objects.create(
        nom="Dessert masqué",
        description="Une récompense temporairement indisponible",
        points_requis=Decimal('75.00'),
        est_actif=False
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

    def test_client_can_list_rewards(self, client_api, client_user, active_reward, inactive_reward):
        client_api.force_authenticate(user=client_user)
        url = reverse('reward-list')
        response = client_api.get(url)
        
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['nom'] == "Boisson gratuite"

    def test_client_cannot_redeem_inactive_reward(self, client_api, client_user, loyalty_profile, inactive_reward):
        client_api.force_authenticate(user=client_user)
        url = reverse('reward-redeem', kwargs={'pk': inactive_reward.pk})
        response = client_api.post(url)

        assert response.status_code == 404
        loyalty_profile.refresh_from_db()
        assert loyalty_profile.points == Decimal('100.00')
        assert not LoyaltyTransaction.objects.filter(profile=loyalty_profile).exists()

    def test_client_transactions_are_limited_to_own_profile(self, client_api, client_user, db):
        other_user = User.objects.create_user(username='other_client', password='password', role=User.Role.CLIENT)
        client_profile = LoyaltyProfile.objects.create(user=client_user, points=Decimal('100.00'))
        other_profile = LoyaltyProfile.objects.create(user=other_user, points=Decimal('500.00'))
        LoyaltyTransaction.objects.create(
            profile=client_profile,
            points=Decimal('25.00'),
            type=LoyaltyTransaction.Type.GAIN,
            description='Client visible gain',
        )
        LoyaltyTransaction.objects.create(
            profile=other_profile,
            points=Decimal('999.00'),
            type=LoyaltyTransaction.Type.GAIN,
            description='Other user hidden gain',
        )

        client_api.force_authenticate(user=client_user)
        response = client_api.get(reverse('loyalty-transactions'))

        assert response.status_code == 200
        assert [transaction['description'] for transaction in response.data] == ['Client visible gain']

    def test_gerant_can_list_inactive_rewards(self, client_api, gerant_user, active_reward, inactive_reward):
        client_api.force_authenticate(user=gerant_user)
        url = reverse('reward-list')
        response = client_api.get(url)

        assert response.status_code == 200
        names = {reward['nom'] for reward in response.data}
        assert names == {"Boisson gratuite", "Dessert masqué"}

    def test_client_can_redeem_reward(self, client_api, client_user, loyalty_profile, active_reward):
        client_api.force_authenticate(user=client_user)
        url = reverse('reward-redeem', kwargs={'pk': active_reward.pk})
        response = client_api.post(url)
        
        assert response.status_code == 200
        loyalty_profile.refresh_from_db()
        assert loyalty_profile.points == Decimal('50.00')
        
        # Check transaction
        transaction = LoyaltyTransaction.objects.get(profile=loyalty_profile, type=LoyaltyTransaction.Type.DEPENSE)
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

    def test_gerant_can_deactivate_reward(self, client_api, gerant_user, active_reward):
        client_api.force_authenticate(user=gerant_user)
        url = reverse('reward-detail', kwargs={'pk': active_reward.pk})
        response = client_api.patch(url, {"est_actif": False}, format='json')

        assert response.status_code == 200
        active_reward.refresh_from_db()
        assert active_reward.est_actif is False

    def test_serveur_cannot_manage_rewards(self, client_api, active_reward, db):
        serveur = User.objects.create_user(username='serveur', password='password', role=User.Role.SERVEUR)
        client_api.force_authenticate(user=serveur)

        create_response = client_api.post(reverse('reward-list'), {
            "nom": "Accès staff refusé",
            "points_requis": 10,
            "est_actif": True,
        })
        update_response = client_api.patch(
            reverse('reward-detail', kwargs={'pk': active_reward.pk}),
            {"est_actif": False},
            format='json',
        )

        assert create_response.status_code == 403
        assert update_response.status_code == 403
        active_reward.refresh_from_db()
        assert active_reward.est_actif is True

import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from apps.paiements.models import Paiement
from apps.commandes.models import Commande
from apps.tables.models import Table
from apps.loyalty.models import LoyaltyProfile, LoyaltyTransaction

User = get_user_model()

@pytest.fixture
def table(db):
    return Table.objects.create(numero=1, capacite=4)

@pytest.fixture
def client_user(db):
    user = User.objects.create_user(username='testclient', password='password', role=User.Role.CLIENT)
    return user

@pytest.fixture
def commande(db, table):
    # We need a minimal commande
    return Commande.objects.create(table=table, statut='EN_COURS')

@pytest.mark.django_db
def test_payment_without_client_no_points(client_user, commande):
    paiement = Paiement.objects.create(
        commande=commande,
        montant=Decimal('100.00'),
        methode='CARTE',
        statut='COMPLETE'
    )
    
    # Check that no loyalty profile was created (since no client associated)
    assert not LoyaltyProfile.objects.filter(user=client_user).exists()

@pytest.mark.django_db
def test_payment_with_client_awards_points(client_user, commande):
    # Ensure profile exists or is created
    profile, _ = LoyaltyProfile.objects.get_or_create(user=client_user)
    
    paiement = Paiement.objects.create(
        commande=commande,
        client=client_user,
        montant=Decimal('100.00'),
        methode='CARTE',
        statut='COMPLETE'
    )
    
    profile.refresh_from_db()
    assert profile.points == Decimal('10.00')
    
    # Check transaction
    transaction = LoyaltyTransaction.objects.get(profile=profile)
    assert transaction.points == Decimal('10.00')
    assert transaction.type == 'GAIN'

@pytest.mark.django_db
def test_payment_status_update_awards_points(client_user, commande):
    profile, _ = LoyaltyProfile.objects.get_or_create(user=client_user)
    
    paiement = Paiement.objects.create(
        commande=commande,
        client=client_user,
        montant=Decimal('55.00'),
        methode='CARTE',
        statut='EN_ATTENTE'
    )
    
    profile.refresh_from_db()
    assert profile.points == Decimal('0.00')
    
    # Update to COMPLETE
    paiement.statut = 'COMPLETE'
    paiement.save()
    
    profile.refresh_from_db()
    assert profile.points == Decimal('5.50')
    
    # Check transaction
    transaction = LoyaltyTransaction.objects.get(profile=profile)
    assert transaction.points == Decimal('5.50')

import pytest
from decimal import Decimal
from rest_framework import status
from rest_framework.test import APIClient
from apps.users.models import Utilisateur
from apps.tables.models import Table
from apps.commandes.models import Commande, CommandeLigne
from apps.menu.models import Categorie, Plat
from apps.paiements.models import Paiement, PaiementItem
from apps.paiements.tokens import issue_payment_token


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def gerant():
    return Utilisateur.objects.create_user(
        username='gerant_pay', password='pass', role='GERANT'
    )


@pytest.fixture
def table():
    return Table.objects.create(numero=10, capacite=4)


@pytest.fixture
def setup_order(table, gerant):
    categorie = Categorie.objects.create(nom='Test Pay', ordre_affichage=1)
    plat = Plat.objects.create(
        nom='Tajine', categorie=categorie, prix=Decimal('100.00'), temps_preparation=15
    )
    commande = Commande.objects.create(
        table=table, serveur=gerant, statut=Commande.Statut.PRETE, montant_total=Decimal('100.00')
    )
    ligne = CommandeLigne.objects.create(
        commande=commande, plat=plat, quantite=1, prix_unitaire=Decimal('100.00')
    )
    return commande, ligne


@pytest.mark.django_db
class TestPaiementAPI:
    def test_resolve_session_with_valid_token(self, api_client, setup_order, table):
        commande, _ = setup_order
        token = issue_payment_token(table.id, commande.id)
        
        response = api_client.post('/api/paiements/session/resolve/', {'token': token}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert Decimal(response.data['montant_restant']) == Decimal('100.00')
        assert response.data['commande_id'] == commande.id

    def test_resolve_session_stale_token(self, api_client, setup_order, table, gerant):
        commande, _ = setup_order
        token = issue_payment_token(table.id, commande.id)
        
        # Mark order as paid or cancelled to make token stale
        commande.statut = Commande.Statut.PAYEE
        commande.save()
        
        response = api_client.post('/api/paiements/session/resolve/', {'token': token}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # resolve_payable_session raises NoPayableOrderError which is mapped to 400 in resolve action (via detail)

    def test_equal_split_preview_no_side_effects(self, api_client, setup_order, table):
        commande, _ = setup_order
        token = issue_payment_token(table.id, commande.id)
        
        response = api_client.post('/api/paiements/session/equal-split/', {
            'token': token,
            'split_count': 3
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['share_amounts']) == 3
        assert Paiement.objects.count() == 0

    def test_item_split_preview(self, api_client, setup_order, table):
        commande, ligne = setup_order
        token = issue_payment_token(table.id, commande.id)
        
        response = api_client.post('/api/paiements/session/item-split/', {
            'token': token,
            'contributions': [
                {'commande_ligne_id': ligne.id, 'montant_contribue': '40.00'}
            ]
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert Decimal(response.data['total_amount']) == Decimal('40.00')

    def test_pay_token_success(self, api_client, setup_order, table):
        commande, _ = setup_order
        token = issue_payment_token(table.id, commande.id)
        
        response = api_client.post('/api/paiements/session/pay/', {
            'token': token,
            'montant': '100.00',
            'reference_transaction': 'TX123'
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['statut'] == 'COMPLETE'
        
        commande.refresh_from_db()
        assert commande.statut == Commande.Statut.PAYEE

    def test_pay_token_missing_reference(self, api_client, setup_order, table):
        commande, _ = setup_order
        token = issue_payment_token(table.id, commande.id)
        
        # reference_transaction is required in serializer
        response = api_client.post('/api/paiements/session/pay/', {
            'token': token,
            'montant': '100.00'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_staff_manual_payment_especes_no_ref(self, api_client, gerant, setup_order):
        commande, _ = setup_order
        api_client.force_authenticate(user=gerant)
        
        response = api_client.post('/api/paiements/', {
            'commande': commande.id,
            'montant': '50.00',
            'methode': 'ESPECES'
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['reference_transaction'] == ''

    def test_staff_manual_payment_en_ligne_rejected(self, api_client, gerant, setup_order):
        commande, _ = setup_order
        api_client.force_authenticate(user=gerant)
        
        response = api_client.post('/api/paiements/', {
            'commande': commande.id,
            'montant': '50.00',
            'methode': 'QR'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "QR" in str(response.data['methode'])

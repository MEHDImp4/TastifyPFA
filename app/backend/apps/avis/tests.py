from unittest.mock import patch
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

from apps.avis.models import AnalyseSentiment, Avis
from apps.avis.tasks import analyze_review_sentiment, get_hf_api_token, query_hf_api
from apps.commandes.models import Commande, CommandeLigne
from apps.menu.models import Categorie, Plat
from apps.paiements.models import Paiement, PaiementItem
from apps.tables.models import Table

User = get_user_model()


@pytest.mark.django_db
class TestAvisModel:
    def test_avis_creation(self):
        user = User.objects.create_user(username='testuser', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='Excellent plat!',
            note=5,
        )
        assert avis.id is not None
        assert str(avis) == f"Avis {avis.id} by testuser - Note: 5"
        assert avis.sentiment_score is None
        assert avis.lang_code is None


@pytest.mark.django_db
class TestAvisTasks:
    @patch('apps.avis.tasks.get_hf_api_token', return_value='hf_test_token')
    @patch('apps.avis.tasks.query_hf_api')
    def test_analyze_review_sentiment_success(self, mock_query_hf_api, _mock_get_hf_api_token):
        mock_query_hf_api.return_value = [[{'label': '5 stars', 'score': 0.99}]]

        user = User.objects.create_user(username='testuser2', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='I loved the food!',
            note=5,
        )

        result = analyze_review_sentiment(avis.id)

        avis.refresh_from_db()
        analyse = AnalyseSentiment.objects.get(avis=avis)
        assert 'Sentiment analysed' in result
        assert avis.sentiment_score == pytest.approx(0.99)
        assert avis.lang_code == 'en'
        assert analyse.label == AnalyseSentiment.Label.POSITIF
        assert analyse.modele_utilise == 'nlptown/bert-base-multilingual-uncased-sentiment'
        mock_query_hf_api.assert_called_once()

    @patch('apps.avis.tasks.get_hf_api_token', return_value='hf_test_token')
    @patch('apps.avis.tasks.query_hf_api')
    def test_analyze_review_sentiment_negative(self, mock_query_hf_api, _mock_get_hf_api_token):
        mock_query_hf_api.return_value = [{'label': '1 star', 'score': 0.95}]

        user = User.objects.create_user(username='testuser3', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='The food was terrible.',
            note=1,
        )

        result = analyze_review_sentiment(avis.id)

        avis.refresh_from_db()
        analyse = AnalyseSentiment.objects.get(avis=avis)
        assert 'Sentiment analysed' in result
        assert avis.sentiment_score == pytest.approx(-0.95)
        assert analyse.label == AnalyseSentiment.Label.NEGATIF

    @patch('apps.avis.tasks.predict_sentiment')
    @patch('apps.avis.tasks.query_hf_api')
    def test_analyze_review_sentiment_falls_back_to_local_model(self, mock_query_hf_api, mock_predict_sentiment):
        mock_query_hf_api.return_value = None
        mock_predict_sentiment.return_value = {
            'label': 'NEUTRE',
            'score': 0.61,
            'model': 'tfidf-linearsvc-local',
        }

        user = User.objects.create_user(username='testuser5', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='Average meal.',
            note=3,
        )

        result = analyze_review_sentiment(avis.id)

        avis.refresh_from_db()
        analyse = AnalyseSentiment.objects.get(avis=avis)
        assert 'Sentiment analysed' in result
        assert avis.sentiment_score == 0
        assert analyse.label == AnalyseSentiment.Label.NEUTRE
        assert analyse.modele_utilise == 'tfidf-linearsvc-local'

    @patch('apps.avis.tasks.config')
    def test_get_hf_api_token_strips_bearer_prefix(self, mock_config):
        mock_config.return_value = 'Bearer hf_test_token'

        assert get_hf_api_token() == 'hf_test_token'

    @patch('apps.avis.tasks.config')
    def test_query_hf_api_returns_none_without_token(self, mock_config):
        mock_config.return_value = ''

        assert query_hf_api('Hello world', 'model') is None

    def test_analyze_review_sentiment_not_found(self):
        with pytest.raises(Avis.DoesNotExist):
            analyze_review_sentiment(9999)

    def test_analyze_review_sentiment_empty_comment(self):
        user = User.objects.create_user(username='testuser4', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='',
            note=3,
        )
        result = analyze_review_sentiment(avis.id)
        assert result == 'No commentary'
        avis.refresh_from_db()
        assert avis.sentiment_score is None


@pytest.mark.django_db
class TestAvisAPI:
    def setup_method(self):
        self.client = APIClient()
        self.user_client = User.objects.create_user(
            username='client1', password='password', role=User.Role.CLIENT,
        )
        self.user_gerant = User.objects.create_user(
            username='gerant1', password='password', role=User.Role.GERANT,
        )
        self.url = reverse('avis-list')

    def create_paid_order(self, user=None, with_item=True):
        user = user or self.user_client
        table = Table.objects.create(numero=71, capacite=2)
        categorie = Categorie.objects.create(nom=f'Avis Cat {user.id}', ordre_affichage=1)
        plat = Plat.objects.create(
            nom=f'Plat avis {user.id}',
            categorie=categorie,
            prix=Decimal('42.00'),
            temps_preparation=15,
        )
        commande = Commande.objects.create(
            table=table,
            client=user,
            statut=Commande.Statut.PAYEE,
            montant_total=Decimal('42.00'),
        )
        ligne = CommandeLigne.objects.create(
            commande=commande,
            plat=plat,
            quantite=1,
            prix_unitaire=Decimal('42.00'),
        )
        paiement = Paiement.objects.create(
            commande=commande,
            client=user,
            montant=Decimal('42.00'),
            methode=Paiement.Methode.QR,
            statut=Paiement.Statut.COMPLETE,
            reference_transaction='TX-AVIS',
        )
        if with_item:
            PaiementItem.objects.create(
                paiement=paiement,
                commande_ligne=ligne,
                montant_contribue=Decimal('42.00'),
            )
        return commande, plat

    @patch('apps.avis.views.analyze_review_sentiment.delay')
    def test_client_can_create_avis(self, mock_task_delay):
        commande, plat = self.create_paid_order()
        self.client.force_authenticate(user=self.user_client)
        data = {
            'commande': commande.id,
            'plat': plat.id,
            'commentaire': 'Super!',
            'note': 5,
        }
        response = self.client.post(self.url, data)
        assert response.status_code == 201
        assert response.data['user'] == self.user_client.id
        assert response.data['commentaire'] == 'Super!'
        assert response.data['note'] == 5
        mock_task_delay.assert_called_once_with(response.data['id'])

    def test_client_cannot_review_unpaid_dish(self):
        commande, plat = self.create_paid_order()
        other_user = User.objects.create_user(username='unpaid', password='password', role=User.Role.CLIENT)

        self.client.force_authenticate(user=other_user)
        response = self.client.post(self.url, {
            'commande': commande.id,
            'plat': plat.id,
            'commentaire': 'Pas payé',
            'note': 2,
        })

        assert response.status_code == 400

    def test_client_cannot_duplicate_review_for_same_dish(self):
        commande, plat = self.create_paid_order()
        Avis.objects.create(user=self.user_client, commande=commande, plat=plat, commentaire='Avant', note=4)

        self.client.force_authenticate(user=self.user_client)
        response = self.client.post(self.url, {
            'commande': commande.id,
            'plat': plat.id,
            'commentaire': 'Encore',
            'note': 5,
        })

        assert response.status_code == 400

    def test_client_only_sees_own_avis(self):
        Avis.objects.create(user=self.user_client, commentaire='Avis 1', note=5)
        other_user = User.objects.create_user(username='other', password='password', role=User.Role.CLIENT)
        Avis.objects.create(user=other_user, commentaire='Avis Other', note=4)

        self.client.force_authenticate(user=self.user_client)
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['commentaire'] == 'Avis 1'

    def test_gerant_can_see_all_avis(self):
        Avis.objects.create(user=self.user_client, commentaire='Avis 1', note=5)
        other_user = User.objects.create_user(username='other2', password='password', role=User.Role.CLIENT)
        Avis.objects.create(user=other_user, commentaire='Avis Other', note=4)

        self.client.force_authenticate(user=self.user_gerant)
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2

    def test_unauthenticated_cannot_create_avis(self):
        data = {'commentaire': 'Unauthorized', 'note': 1}
        response = self.client.post(self.url, data)
        assert response.status_code == 401

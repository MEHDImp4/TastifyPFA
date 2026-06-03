import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from unittest.mock import patch

from apps.avis.models import AnalyseSentiment, Avis
from apps.avis.tasks import analyze_review_sentiment

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
    def test_analyze_review_sentiment_positive(self):
        user = User.objects.create_user(username='testuser2', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='I loved the food!',
            note=5,
        )

        result = analyze_review_sentiment(avis.id)

        avis.refresh_from_db()
        analyse = AnalyseSentiment.objects.get(avis=avis)
        assert 'Rule-based sentiment analysed' in result
        assert avis.sentiment_score == 15
        assert avis.lang_code == 'fr'
        assert analyse.label == AnalyseSentiment.Label.POSITIF
        assert analyse.modele_utilise == 'rule-based-sentiment-engine'

    def test_analyze_review_sentiment_negative(self):
        user = User.objects.create_user(username='testuser3', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='The food was terrible.',
            note=1,
        )

        result = analyze_review_sentiment(avis.id)

        avis.refresh_from_db()
        analyse = AnalyseSentiment.objects.get(avis=avis)
        assert 'Rule-based sentiment analysed' in result
        assert avis.sentiment_score == -15
        assert analyse.label == AnalyseSentiment.Label.NEGATIF
        assert analyse.modele_utilise == 'rule-based-sentiment-engine'

    def test_analyze_review_sentiment_neutral(self):
        user = User.objects.create_user(username='testuser4', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='It was average.',
            note=3,
        )

        result = analyze_review_sentiment(avis.id)

        avis.refresh_from_db()
        analyse = AnalyseSentiment.objects.get(avis=avis)
        assert 'Rule-based sentiment analysed' in result
        assert avis.sentiment_score == 0
        assert analyse.label == AnalyseSentiment.Label.NEUTRE
        assert analyse.modele_utilise == 'rule-based-sentiment-engine'

    def test_analyze_review_sentiment_not_found(self):
        with pytest.raises(Avis.DoesNotExist):
            analyze_review_sentiment(9999)

    def test_analyze_review_sentiment_empty_comment(self):
        user = User.objects.create_user(username='testuser5', password='password')
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

    @patch('apps.avis.views.analyze_review_sentiment.delay')
    def test_client_can_create_avis(self, mock_task_delay):
        self.client.force_authenticate(user=self.user_client)
        data = {
            'commentaire': 'Super!',
            'note': 5,
        }
        response = self.client.post(self.url, data)
        assert response.status_code == 201
        assert response.data['user'] == self.user_client.id
        assert response.data['commentaire'] == 'Super!'
        mock_task_delay.assert_called_once_with(response.data['id'])

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

import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from apps.avis.models import Avis
from apps.avis.tasks import analyze_review_sentiment, get_hf_api_token, get_hf_api_url

User = get_user_model()

@pytest.mark.django_db
class TestAvisModel:
    def test_avis_creation(self):
        user = User.objects.create_user(username='testuser', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='Excellent plat!',
            note=5
        )
        assert avis.id is not None
        assert str(avis) == f"Avis {avis.id} by testuser - Note: 5"
        assert avis.sentiment_score is None

@pytest.mark.django_db
class TestAvisTasks:
    @patch('apps.avis.tasks.query_hf_api')
    def test_analyze_review_sentiment_success(self, mock_query_hf_api):
        mock_query_hf_api.return_value = [[{'label': '5 stars', 'score': 0.99}]]

        user = User.objects.create_user(username='testuser2', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='I loved the food!',
            note=5
        )

        result = analyze_review_sentiment(avis.id)

        avis.refresh_from_db()
        assert result == "Sentiment analyzed: 5 stars"
        assert avis.sentiment_score == 5
        mock_query_hf_api.assert_called_once_with('I loved the food!')

    @patch('apps.avis.tasks.query_hf_api')
    def test_analyze_review_sentiment_negative(self, mock_query_hf_api):
        mock_query_hf_api.return_value = [{'label': '1 star', 'score': 0.95}]

        user = User.objects.create_user(username='testuser3', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='The food was terrible.',
            note=1
        )

        result = analyze_review_sentiment(avis.id)

        avis.refresh_from_db()
        assert result == "Sentiment analyzed: 1 stars"
        assert avis.sentiment_score == 1

    @patch('apps.avis.tasks.query_hf_api')
    def test_analyze_review_sentiment_handles_missing_api_response(self, mock_query_hf_api):
        mock_query_hf_api.return_value = None

        user = User.objects.create_user(username='testuser5', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='Average meal.',
            note=3
        )

        result = analyze_review_sentiment(avis.id)

        avis.refresh_from_db()
        assert result == f"Failed to get API response for Avis {avis.id}"
        assert avis.sentiment_score is None

    def test_get_hf_api_url_uses_router_endpoint(self):
        assert get_hf_api_url().startswith('https://router.huggingface.co/hf-inference/models/')

    @patch('apps.avis.tasks.config')
    def test_get_hf_api_token_strips_bearer_prefix(self, mock_config):
        mock_config.return_value = 'Bearer hf_test_token'

        assert get_hf_api_token() == 'hf_test_token'

    def test_analyze_review_sentiment_not_found(self):
        result = analyze_review_sentiment(9999)
        assert "not found" in result

    def test_analyze_review_sentiment_empty_comment(self):
        user = User.objects.create_user(username='testuser4', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='',
            note=3
        )
        result = analyze_review_sentiment(avis.id)
        assert result == "No commentary to analyze"

@pytest.mark.django_db
class TestAvisAPI:
    def setup_method(self):
        self.client = APIClient()
        self.user_client = User.objects.create_user(
            username='client1', password='password', role=User.Role.CLIENT
        )
        self.user_gerant = User.objects.create_user(
            username='gerant1', password='password', role=User.Role.GERANT
        )
        self.url = reverse('avis-list')

    @patch('apps.avis.views.analyze_review_sentiment.delay')
    def test_client_can_create_avis(self, mock_task_delay):
        self.client.force_authenticate(user=self.user_client)
        data = {
            'commentaire': 'Super!',
            'note': 5
        }
        response = self.client.post(self.url, data)
        assert response.status_code == 201
        assert response.data['user'] == self.user_client.id
        assert response.data['commentaire'] == 'Super!'
        
        # Verify task was triggered
        mock_task_delay.assert_called_once()
        avis_id = response.data['id']
        mock_task_delay.assert_called_with(avis_id)

    def test_client_only_sees_own_avis(self):
        # Create avis for client1
        Avis.objects.create(user=self.user_client, commentaire='Avis 1', note=5)
        # Create avis for another user
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

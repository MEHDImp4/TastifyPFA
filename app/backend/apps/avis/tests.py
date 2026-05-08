import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from apps.avis.models import Avis
from apps.avis.tasks import analyze_review_sentiment

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
    @patch('apps.avis.tasks.get_sentiment_analyzer')
    def test_analyze_review_sentiment_success(self, mock_get_analyzer):
        # Setup mock analyzer
        mock_analyzer = MagicMock()
        mock_analyzer.return_value = [{'label': '5 stars', 'score': 0.99}]
        mock_get_analyzer.return_value = mock_analyzer
        
        # Create test data
        user = User.objects.create_user(username='testuser2', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='I loved the food!',
            note=5
        )
        
        # Run task
        result = analyze_review_sentiment(avis.id)
        
        # Refresh and assert
        avis.refresh_from_db()
        assert result == "Sentiment analyzed: 5 stars"
        assert avis.sentiment_score == 5
        mock_analyzer.assert_called_once_with('I loved the food!')

    @patch('apps.avis.tasks.get_sentiment_analyzer')
    def test_analyze_review_sentiment_negative(self, mock_get_analyzer):
        # Setup mock analyzer
        mock_analyzer = MagicMock()
        mock_analyzer.return_value = [{'label': '1 star', 'score': 0.95}]
        mock_get_analyzer.return_value = mock_analyzer
        
        # Create test data
        user = User.objects.create_user(username='testuser3', password='password')
        avis = Avis.objects.create(
            user=user,
            commentaire='The food was terrible.',
            note=1
        )
        
        # Run task
        result = analyze_review_sentiment(avis.id)
        
        # Refresh and assert
        avis.refresh_from_db()
        assert result == "Sentiment analyzed: 1 stars"
        assert avis.sentiment_score == 1

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

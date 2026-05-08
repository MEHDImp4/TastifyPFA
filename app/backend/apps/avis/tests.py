import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
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

import pytest
from unittest.mock import patch, MagicMock
from django.core.cache import cache
from apps.menu.ml.recommender import compute_similarities
from apps.menu.tasks import update_recommendations

@pytest.mark.django_db
def test_compute_similarities_empty():
    """Test 1: Empty command list returns empty similarity dict."""
    assert compute_similarities([]) == {}

@pytest.mark.django_db
def test_compute_similarities_with_data():
    """Test 2: Mocked list where Plats A and B are ordered together often."""
    mock_data = [
        {'commande_id': 1, 'plat_id': 10, 'quantite': 1},
        {'commande_id': 1, 'plat_id': 20, 'quantite': 2},
        {'commande_id': 2, 'plat_id': 10, 'quantite': 1},
        {'commande_id': 2, 'plat_id': 20, 'quantite': 1},
        {'commande_id': 3, 'plat_id': 30, 'quantite': 1},
    ]
    result = compute_similarities(mock_data)
    assert 20 in result.get(10, [])
    assert 10 in result.get(20, [])

@pytest.mark.django_db
@patch('apps.menu.tasks.compute_similarities')
@patch('apps.commandes.models.CommandeLigne.objects')
def test_update_recommendations_task(mock_objects, mock_compute):
    """Test 3: Celery task saves to cache."""
    mock_objects.values.return_value = [{'commande_id': 1, 'plat_id': 1, 'quantite': 1}]
    mock_compute.return_value = {1: [2]}
    
    update_recommendations()
    
    cached = cache.get('plat_similarities')
    assert cached == {1: [2]}

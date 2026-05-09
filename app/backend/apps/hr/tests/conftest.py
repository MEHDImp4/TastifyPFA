import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def gerant_user(db):
    return User.objects.create_user(username="gerant_test", password="password", role="GERANT")

@pytest.fixture
def gerant_client(api_client, gerant_user):
    api_client.force_authenticate(user=gerant_user)
    return api_client

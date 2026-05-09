import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.menu.models import Plat, Categorie
from apps.tables.models import Table

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def gerant_user(db):
    return User.objects.create_user(username="gerant_user", password="password", role="GERANT")

@pytest.fixture
def serveur_user(db):
    return User.objects.create_user(username="serveur_user", password="password", role="SERVEUR")

@pytest.fixture
def cuisinier_user(db):
    return User.objects.create_user(username="cuisinier_user", password="password", role="CUISINIER")

@pytest.fixture
def gerant_client(api_client, gerant_user):
    api_client.force_authenticate(user=gerant_user)
    return api_client

@pytest.fixture
def serveur_client(api_client, serveur_user):
    api_client.force_authenticate(user=serveur_user)
    return api_client

@pytest.fixture
def cuisinier_client(api_client, cuisinier_user):
    api_client.force_authenticate(user=cuisinier_user)
    return api_client

@pytest.fixture
def table(db):
    return Table.objects.create(numero=1, capacite=4)

@pytest.fixture
def plat(db):
    cat, _ = Categorie.objects.get_or_create(nom="Test Cat")
    return Plat.objects.create(nom="Test Plat", prix=10, categorie=cat, temps_preparation=10)

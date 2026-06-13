import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

from apps.configuration.models import RestaurantConfiguration
from apps.users.models import Utilisateur


def make_test_image(name="logo.png"):
    image = Image.new("RGB", (10, 10), color="black")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/png")


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def gerant():
    return Utilisateur.objects.create_user(
        username="gerant_settings",
        password="password123",
        role=Utilisateur.Role.GERANT,
    )


@pytest.fixture
def serveur():
    return Utilisateur.objects.create_user(
        username="serveur_settings",
        password="password123",
        role=Utilisateur.Role.SERVEUR,
    )


@pytest.mark.django_db
class TestRestaurantConfigurationAPI:
    def test_public_endpoints_are_accessible(self, api_client):
        list_response = api_client.get("/api/settings/")
        public_response = api_client.get("/api/settings/public/")

        assert list_response.status_code == status.HTTP_200_OK
        assert public_response.status_code == status.HTTP_200_OK
        assert list_response.data["id"] == 1
        assert public_response.data["id"] == 1

    def test_only_manager_can_patch_settings(self, api_client, serveur):
        api_client.force_authenticate(user=serveur)

        response = api_client.patch("/api/settings/1/", {"nom": "Forbidden"}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_manager_can_patch_branding_and_upload_logo(self, api_client, gerant):
        api_client.force_authenticate(user=gerant)

        response = api_client.patch(
            "/api/settings/1/",
            {
                "nom": "Tastify Atlas",
                "email": "atlas@tastify.ma",
                "logo": make_test_image(),
            },
            format="multipart",
        )

        assert response.status_code == status.HTTP_200_OK
        config = RestaurantConfiguration.get_solo()
        assert config.nom == "Tastify Atlas"
        assert config.email == "atlas@tastify.ma"
        assert config.logo.name.startswith("restaurant_logos/")
        assert config.logo.name.endswith(".webp")

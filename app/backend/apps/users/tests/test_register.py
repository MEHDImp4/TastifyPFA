from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import Utilisateur


class RegisterTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("users:register")

    def test_register_creates_client_even_when_role_is_submitted(self):
        response = self.client.post(
            self.register_url,
            {
                "username": "fresh_client",
                "email": "fresh@tastify.ma",
                "password": "password123",
                "role": Utilisateur.Role.GERANT,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_user = Utilisateur.objects.get(username="fresh_client")
        self.assertEqual(created_user.role, Utilisateur.Role.CLIENT)

    def test_register_rejects_missing_required_fields(self):
        response = self.client.post(
            self.register_url,
            {
                "username": "broken_client",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

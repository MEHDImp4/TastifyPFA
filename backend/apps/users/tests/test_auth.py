from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import Utilisateur
from django.conf import settings

class AuthTests(APITestCase):
    def setUp(self):
        self.username = "testuser"
        self.password = "password123"
        self.user = Utilisateur.objects.create_user(
            username=self.username,
            password=self.password,
            role=Utilisateur.Role.GERANT
        )
        self.login_url = reverse('users:token_obtain_pair')
        self.refresh_url = reverse('users:token_refresh')
        self.logout_url = reverse('users:logout')

    def test_login_sets_cookie_and_returns_access_token(self):
        data = {
            "username": self.username,
            "password": self.password
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        self.assertEqual(response.data['role'], Utilisateur.Role.GERANT)
        self.assertEqual(response.data['username'], self.username)
        
        # Check cookie
        cookie_name = settings.SIMPLE_JWT['AUTH_COOKIE']
        self.assertIn(cookie_name, response.cookies)
        self.assertTrue(response.cookies[cookie_name]['httponly'])

    def test_refresh_token_from_cookie(self):
        # First login to get the cookie
        login_data = {"username": self.username, "password": self.password}
        login_response = self.client.post(self.login_url, login_data, format='json')
        
        # Now call refresh
        response = self.client.post(self.refresh_url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        
        # Check new cookie is set (since rotation is ON)
        cookie_name = settings.SIMPLE_JWT['AUTH_COOKIE']
        self.assertIn(cookie_name, response.cookies)

    def test_logout_clears_cookie(self):
        # Login
        login_data = {"username": self.username, "password": self.password}
        login_response = self.client.post(self.login_url, login_data, format='json')
        access_token = login_response.data['access']
        
        # Logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.post(self.logout_url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check cookie is deleted (value is empty or expiry in past)
        cookie_name = settings.SIMPLE_JWT['AUTH_COOKIE']
        self.assertEqual(response.cookies[cookie_name].value, '')

    def test_protected_endpoint_requires_auth(self):
        # Try to access logout without auth
        response = self.client.post(self.logout_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
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
        self.staff_cookie_name = f"{settings.SIMPLE_JWT['AUTH_COOKIE']}_staff"
        self.client_cookie_name = f"{settings.SIMPLE_JWT['AUTH_COOKIE']}_client"

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
        self.assertIn(self.staff_cookie_name, response.cookies)
        self.assertTrue(response.cookies[self.staff_cookie_name]['httponly'])

    def test_refresh_token_from_cookie(self):
        # First login to get the cookie
        login_data = {"username": self.username, "password": self.password}
        login_response = self.client.post(self.login_url, login_data, format='json')
        
        # Now call refresh
        response = self.client.post(self.refresh_url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        self.assertEqual(response.data['role'], Utilisateur.Role.GERANT)
        self.assertEqual(response.data['username'], self.username)
        
        # Check new cookie is set (since rotation is ON)
        self.assertIn(self.staff_cookie_name, response.cookies)

    def test_refresh_with_invalid_cookie_returns_auth_error_not_server_error(self):
        self.client.cookies[self.staff_cookie_name] = 'invalid-refresh-token'

        response = self.client.post(self.refresh_url, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

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
        self.assertEqual(response.cookies[self.staff_cookie_name].value, '')

    def test_portal_sessions_use_separate_refresh_cookies(self):
        client_user = Utilisateur.objects.create_user(
            username='clientuser',
            password=self.password,
            role=Utilisateur.Role.CLIENT,
        )
        staff_client = APIClient()
        portal_client = APIClient()

        staff_login = staff_client.post(
            self.login_url,
            {"username": self.username, "password": self.password},
            format='json',
            HTTP_X_TASTIFY_PORTAL='staff',
        )
        portal_login = portal_client.post(
            self.login_url,
            {"username": client_user.username, "password": self.password},
            format='json',
            HTTP_X_TASTIFY_PORTAL='client',
        )

        self.assertEqual(staff_login.status_code, status.HTTP_200_OK)
        self.assertEqual(portal_login.status_code, status.HTTP_200_OK)
        self.assertIn(self.staff_cookie_name, staff_login.cookies)
        self.assertIn(self.client_cookie_name, portal_login.cookies)

        staff_refresh = staff_client.post(
            self.refresh_url,
            format='json',
            HTTP_X_TASTIFY_PORTAL='staff',
        )
        portal_refresh = portal_client.post(
            self.refresh_url,
            format='json',
            HTTP_X_TASTIFY_PORTAL='client',
        )

        self.assertEqual(staff_refresh.status_code, status.HTTP_200_OK)
        self.assertEqual(staff_refresh.data['username'], self.username)
        self.assertEqual(staff_refresh.data['role'], Utilisateur.Role.GERANT)
        self.assertEqual(portal_refresh.status_code, status.HTTP_200_OK)
        self.assertEqual(portal_refresh.data['username'], client_user.username)
        self.assertEqual(portal_refresh.data['role'], Utilisateur.Role.CLIENT)

    def test_protected_endpoint_requires_auth(self):
        # Try to access logout without auth
        response = self.client.post(self.logout_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class DashboardAPITests(APITestCase):
    def setUp(self):
        # Create a gerant user
        self.gerant_user = User.objects.create_user(
            username='gerant_test',
            password='password123',
            role=User.Role.GERANT
        )
        self.url = reverse('dashboard')

    def test_dashboard_access_gerant(self):
        self.client.force_authenticate(user=self.gerant_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if keys exist in response
        data = response.json()
        self.assertIn('todayRevenue', data)
        self.assertIn('activeTables', data)
        self.assertIn('pendingOrders', data)
        self.assertIn('avgPrepTime', data)
        self.assertIn('revenue7Days', data)
        self.assertIn('topDishes', data)

    def test_dashboard_access_unauthorized(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_access_client(self):
        client_user = User.objects.create_user(
            username='client_test',
            password='password123',
            role=User.Role.CLIENT
        )
        self.client.force_authenticate(user=client_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

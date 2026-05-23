from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import Utilisateur
from .models import Employe

class EmployeAPITests(APITestCase):
    def setUp(self):
        self.gerant = Utilisateur.objects.create_user(
            username='gerant_hr',
            password='password123',
            role=Utilisateur.Role.GERANT
        )
        self.serveur = Utilisateur.objects.create_user(
            username='serveur_hr',
            password='password123',
            role=Utilisateur.Role.SERVEUR
        )
        
        # Initial employee
        self.employe_user = Utilisateur.objects.create_user(
            username='emp1',
            password='password123',
            role=Utilisateur.Role.SERVEUR
        )
        self.employe = Employe.objects.create(
            user=self.employe_user,
            poste='Serveur Senior',
            salaire=4500.00,
            date_embauche='2024-01-01',
            cin='AA123456'
        )
        
        self.list_url = reverse('employe-list')
        self.detail_url = reverse('employe-detail', kwargs={'pk': self.employe.pk})

    def test_gerant_can_list_employees(self):
        self.client.force_authenticate(user=self.gerant)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_serveur_can_list_active_employees_only(self):
        self.client.force_authenticate(user=self.serveur)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_gerant_can_create_employee(self):
        self.client.force_authenticate(user=self.gerant)
        data = {
            'username': 'new_emp',
            'password': 'password123',
            'first_name': 'New',
            'last_name': 'Employee',
            'email': 'new@tastify.ma',
            'role': 'CUISINIER',
            'poste': 'Cuisinier Chef',
            'salaire': 6000.00,
            'date_embauche': '2024-05-01',
            'cin': 'BB654321'
        }
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Utilisateur.objects.filter(username='new_emp').exists())
        self.assertTrue(Employe.objects.filter(poste='Cuisinier Chef').exists())

    def test_gerant_can_update_employee(self):
        self.client.force_authenticate(user=self.gerant)
        data = {'poste': 'Manager Salle', 'salaire': 5000.00}
        response = self.client.patch(self.detail_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employe.refresh_from_db()
        self.assertEqual(self.employe.poste, 'Manager Salle')
        self.assertEqual(float(self.employe.salaire), 5000.00)

    def test_soft_delete_deactivates_user(self):
        self.client.force_authenticate(user=self.gerant)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.employe_user.refresh_from_db()
        self.assertFalse(self.employe_user.is_active)
        
        # GERANT listings retain deactivated employees for management visibility.
        response = self.client.get(self.list_url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.employe.id)

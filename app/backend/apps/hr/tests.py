from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import Utilisateur
from .models import Employe, OffreEmploi, Candidature

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


class OffreEmploiAPITests(APITestCase):
    def setUp(self):
        self.gerant = Utilisateur.objects.create_user(
            username='gerant_offre', password='password123', role=Utilisateur.Role.GERANT
        )
        self.serveur = Utilisateur.objects.create_user(
            username='serveur_offre', password='password123', role=Utilisateur.Role.SERVEUR
        )
        self.offre = None
        self.list_url = reverse('offre-list')
        self.detail_url = None

    def _create_offre(self):
        data = {'titre': 'Chef de cuisine', 'description': 'Recherche chef experimeenté', 'type_contrat': 'CDI'}
        self.client.force_authenticate(user=self.gerant)
        response = self.client.post(self.list_url, data)
        self.offre = response.data
        self.detail_url = reverse('offre-detail', kwargs={'pk': self.offre['id']})
        return response

    def test_public_can_list_offres(self):
        self._create_offre()
        self.client.force_authenticate(user=None)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_gerant_can_create_offre(self):
        response = self._create_offre()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['titre'], 'Chef de cuisine')

    def test_gerant_can_update_offre(self):
        self._create_offre()
        response = self.client.patch(self.detail_url, {'titre': 'Chef de partie'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['titre'], 'Chef de partie')

    def test_gerant_can_delete_offre(self):
        self._create_offre()
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(OffreEmploi.objects.filter(id=self.offre['id']).exists())

    def test_non_gerant_cannot_create_offre(self):
        self.client.force_authenticate(user=self.serveur)
        response = self.client.post(self.list_url, {'titre': 'Test', 'description': 'Test'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class CandidatureAPITests(APITestCase):
    def setUp(self):
        self.gerant = Utilisateur.objects.create_user(
            username='gerant_cand', password='password123', role=Utilisateur.Role.GERANT
        )
        self.offre = OffreEmploi.objects.create(titre='Serveur', description='Poste de serveur')
        self.list_url = reverse('candidature-list')

    def test_public_can_submit_candidature(self):
        data = {
            'offre': self.offre.id,
            'nom_complet': 'Jean Dupont',
            'email': 'jean@example.com',
            'telephone': '0600000000',
            'message_motivation': 'Motivé',
        }
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Candidature.objects.count(), 1)

    def test_gerant_can_update_statut(self):
        cand = Candidature.objects.create(
            offre=self.offre, nom_complet='Marie', email='marie@test.com',
            telephone='0600000001', message_motivation='OK'
        )
        self.client.force_authenticate(user=self.gerant)
        url = reverse('candidature-detail', kwargs={'pk': cand.pk})
        response = self.client.patch(url, {'statut': 'ENTRETENUE'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cand.refresh_from_db()
        self.assertEqual(cand.statut, 'ENTRETENUE')

    def test_public_cannot_update_candidature(self):
        cand = Candidature.objects.create(
            offre=self.offre, nom_complet='Paul', email='paul@test.com',
            telephone='0600000002', message_motivation='OK'
        )
        url = reverse('candidature-detail', kwargs={'pk': cand.pk})
        response = self.client.patch(url, {'statut': 'RECRUTEE'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
